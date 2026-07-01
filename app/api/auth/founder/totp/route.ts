import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { SignJWT } from "jose";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ============================================================
   PRIMARY ADMIN TOTP — 8th Ledger Security Fortress
   Architect Layer 1: TOTP → PIN → WebAuthn → Geo → Device → Time
   Install: npm install speakeasy qrcode
   ============================================================ */

let speakeasy: any;
let QRCode: any;

try {
  speakeasy = require("speakeasy");
} catch {
  console.warn("[TOTP] speakeasy not installed");
}

try {
  QRCode = require("qrcode");
} catch {
  console.warn("[TOTP] qrcode not installed");
}

/* Dev fallback for local testing */
const devFallback = {
  generateSecret: () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    const bytes = crypto.randomBytes(32);
    for (let i = 0; i < 32; i++) secret += chars[bytes[i] % chars.length];
    return { base32: secret };
  },
  otpauthURL: (opts: any) =>
    `otpauth://totp/8thLedger:${opts.encoding}?secret=${opts.secret}`,
  totp: {
    verify: () => false,
  },
};

function generateSecret() {
  if (speakeasy) {
    return speakeasy.generateSecret({ length: 32 });
  }
  return devFallback.generateSecret();
}

function verifyToken(token: string, secret: string) {
  if (speakeasy) {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
  }
  return devFallback.totp.verify();
}

async function generateQR(url: string): Promise<string | null> {
  if (QRCode) {
    try {
      return await QRCode.toDataURL(url);
    } catch {
      return null;
    }
  }
  return null;
}

/* ============================================================
   PRIMARY ADMIN TOTP ROUTE
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !isAdminRole(user.role) || !user.isPrimaryAdmin) {
      return NextResponse.json(
        { error: "Architect authority required. Primary admin access only." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      enabled: user.founderTotpEnabled || false,
      setup: !!user.founderTotpSecret,
    });
  } catch (err: any) {
    console.error("[PRIMARY ADMIN TOTP GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !isAdminRole(user.role) || !user.isPrimaryAdmin) {
      return NextResponse.json(
        { error: "Architect authority required. Primary admin access only." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { action } = body;

    /* ---- SETUP ---- */
    if (action === "setup") {
      const secretObj = generateSecret();
      const secret = secretObj.base32;

      const otpauthUrl = speakeasy
        ? speakeasy.otpauthURL({
            secret,
            label: user.email,
            issuer: "8th Ledger Architect",
            encoding: "base32",
          })
        : `otpauth://totp/8th%20Ledger%20Architect:${encodeURIComponent(user.email)}?secret=${secret}&issuer=8th%20Ledger%20Architect`;

      const qrDataUrl = await generateQR(otpauthUrl);

      await prisma.user.update({
        where: { id: user.id },
        data: { founderTotpSecret: secret },
      });

      return NextResponse.json({
        success: true,
        secret,
        otpauthUrl,
        qrDataUrl,
        message: qrDataUrl
          ? "Scan QR with Google Authenticator"
          : `Secret key: ${secret} — Enter this manually in Google Authenticator`,
      });
    }

    /* ---- VERIFY / VERIFY-LOGIN ---- */
    if (action === "verify" || action === "verify-login") {
      const { code } = body;
      if (!code || !user.founderTotpSecret) {
        return NextResponse.json(
          { error: "Code required or setup incomplete" },
          { status: 400 },
        );
      }

      const isValid = verifyToken(code, user.founderTotpSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid code" }, { status: 401 });
      }

      if (!user.founderTotpEnabled) {
        await prisma.user.update({
          where: { id: user.id },
          data: { founderTotpEnabled: true },
        });
      }

      // Access log
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastFounderAccessAt: new Date(),
          lastFounderIP:
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown",
          founderAccessCount: { increment: 1 },
        },
      });

      // Security audit
      await prisma.securityAuditLog.create({
        data: {
          ledgerId: user.ledgerId,
          action: "admin_login",
          ipAddress:
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          deviceFingerprint:
            req.headers.get("x-device-fingerprint") || "unknown",
          success: true,
          details: "Architect TOTP verified. Primary admin session issued.",
          currentHash: crypto.randomUUID(),
        },
      });

      // Issue session
      const sessionSecret = process.env.SESSION_SECRET;
      if (!sessionSecret) throw new Error("SESSION_SECRET missing");

      const key = new TextEncoder().encode(sessionSecret);
      const now = Math.floor(Date.now() / 1000);

      const newToken = await new SignJWT({
        ledgerId: user.ledgerId,
        kycTier: user.kycTier || "visitor",
        role: user.role,
        isPrimaryAdmin: true,
        hallIds: user.hallIds || [],
        nameMatchVerified: user.nameMatchVerified || false,
        deviceFingerprint: user.deviceFingerprint || undefined,
        totpEnabled: user.totpEnabled,
        totpVerifiedAt: now,
        founderTotpEnabled: true,
        founderTotpVerifiedAt: now,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(key);

      const response = NextResponse.json({
        success: true,
        message:
          action === "verify-login"
            ? "Architect access granted"
            : "TOTP enabled",
      });

      response.cookies.set("ledger_session", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[PRIMARY ADMIN TOTP]", err);
    return NextResponse.json(
      { error: err.message || "Failed" },
      { status: 500 },
    );
  }
}
