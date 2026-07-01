// app/api/auth/admin/totp/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { SignJWT } from "jose";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ============================================================
   ADMIN TOTP — Pure Node.js RFC 6238 Implementation
   No otplib. No external deps. Works with any authenticator app.
   ============================================================ */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateSecret(): string {
  const bytes = crypto.randomBytes(32);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

function base32Decode(secret: string): Buffer {
  let bits = "";
  for (const char of secret.toUpperCase()) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secret: string, window = 0): string {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / 30);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(time + window), 0);
  const hmac = crypto.createHmac("sha1", key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24 |
      (hmac[offset + 1] & 0xff) << 16 |
      (hmac[offset + 2] & 0xff) << 8 |
      (hmac[offset + 3] & 0xff)) %
    1000000;
  return code.toString().padStart(6, "0");
}

function verifyTOTP(token: string, secret: string): boolean {
  for (let i = -1; i <= 1; i++) {
    if (generateTOTP(secret, i) === token) return true;
  }
  return false;
}

function keyuri(email: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

/* ============================================================
   ROUTE HANDLERS
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: "Administrative access only" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      enabled: user.adminTotpEnabled || false,
      setup: !!user.adminTotpSecret,
    });
  } catch (err: any) {
    console.error("[ADMIN TOTP GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: "Administrative access only" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    /* ---- SETUP: Generate new secret ---- */
    if (action === "setup") {
      const secret = generateSecret();

      await prisma.user.update({
        where: { id: user.id },
        data: { adminTotpSecret: secret },
      });

      const otpauth = keyuri(user.email, "8th Ledger Admin", secret);

      let qrDataUrl: string | null = null;
      try {
        const QRCode = await import("qrcode");
        qrDataUrl = await QRCode.toDataURL(otpauth);
      } catch {
        // qrcode not installed — manual entry only
      }

      return NextResponse.json({
        success: true,
        secret,
        otpauthUrl: otpauth,
        qrDataUrl,
        message: qrDataUrl
          ? "Scan QR with authenticator app"
          : "Install qrcode package for QR, or enter secret manually",
      });
    }

    /* ---- VERIFY: Check code + enable TOTP ---- */
    if (action === "verify") {
      const { code } = body;
      if (!code || !user.adminTotpSecret) {
        return NextResponse.json({ error: "Code required or setup incomplete" }, { status: 400 });
      }

      const isValid = verifyTOTP(code, user.adminTotpSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid admin TOTP code" }, { status: 401 });
      }

      if (!user.adminTotpEnabled) {
        await prisma.user.update({
          where: { id: user.id },
          data: { adminTotpEnabled: true },
        });
      }

      return NextResponse.json({ success: true, message: "Admin TOTP verified and enabled" });
    }

    /* ---- VERIFY-LOGIN: Issue admin session ---- */
    if (action === "verify-login") {
      const { code } = body;
      if (!code || !user.adminTotpSecret) {
        return NextResponse.json({ error: "Code required or setup incomplete" }, { status: 400 });
      }

      const isValid = verifyTOTP(code, user.adminTotpSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid admin TOTP code" }, { status: 401 });
      }

      if (!user.adminTotpEnabled) {
        await prisma.user.update({
          where: { id: user.id },
          data: { adminTotpEnabled: true },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastAdminAccessAt: new Date(),
          lastAdminIP: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          adminAccessCount: { increment: 1 },
        },
      });

      await prisma.securityAuditLog.create({
        data: {
          ledgerId: user.ledgerId,
          action: "admin_login",
          ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          deviceFingerprint: req.headers.get("x-device-fingerprint") || "unknown",
          success: true,
          details: "Admin TOTP verified. Session issued.",
          currentHash: crypto.randomUUID(),
        },
      });

      const secret = process.env.SESSION_SECRET;
      if (!secret) throw new Error("SESSION_SECRET missing");

      const key = new TextEncoder().encode(secret);
      const now = Math.floor(Date.now() / 1000);

      const newToken = await new SignJWT({
        ledgerId: user.ledgerId,
        kycTier: user.kycTier || "visitor",
        role: user.role,
        isPrimaryAdmin: user.isPrimaryAdmin,
        hallIds: user.hallIds || [],
        nameMatchVerified: user.nameMatchVerified || false,
        deviceFingerprint: user.deviceFingerprint || undefined,
        adminTotpEnabled: true,
        adminTotpVerifiedAt: now,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(key);

      const response = NextResponse.json({ success: true, message: "Admin access granted" });
      response.cookies.set("ledger_session", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 2,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action. Use setup, verify, or verify-login" }, { status: 400 });
  } catch (err: any) {
    console.error("[ADMIN TOTP]", err);
    return NextResponse.json({ error: err.message || "Admin TOTP failed" }, { status: 500 });
  }
}