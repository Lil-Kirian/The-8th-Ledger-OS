import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ============================================================
   ADMIN PIN — 4-digit, rate-limited, bcrypt hashed
   8th Ledger Security Fortress — Sub-Admin Layer 2
   ============================================================ */

async function hashPin(pin: string): Promise<string> {
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.hashSync(pin, 12);
  } catch {
    const crypto = await import("crypto");
    if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");
    return crypto
      .pbkdf2Sync(pin, process.env.SESSION_SECRET, 100000, 64, "sha512")
      .toString("hex");
  }
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compareSync(pin, hash);
  } catch {
    const crypto = await import("crypto");
    if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");
    const testHash = crypto
      .pbkdf2Sync(pin, process.env.SESSION_SECRET, 100000, 64, "sha512")
      .toString("hex");
    return testHash === hash;
  }
}

function isLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

/* ---- GET: Check PIN status ---- */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Administrative access only" },
        { status: 403 },
      );
    }

    const locked = isLocked(user.adminLockedUntil);
    const remaining =
      locked && user.adminLockedUntil
        ? Math.ceil((user.adminLockedUntil.getTime() - Date.now()) / 60000)
        : 0;

    return NextResponse.json({
      success: true,
      pinSet: !!user.adminPinHash,
      locked,
      lockMinutesRemaining: remaining,
      attempts: user.adminPinAttempts || 0,
    });
  } catch (err: unknown) {
    console.error("[ADMIN PIN GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ---- POST: Set / Verify / Change ---- */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Administrative access only" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { action } = body;

    /* ---- SET ---- */
    if (action === "set") {
      const { pin } = body;
      if (!pin || !/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 },
        );
      }

      const hash = await hashPin(pin);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          adminPinHash: hash,
          adminPinAttempts: 0,
          adminLockedUntil: null,
        },
      });

      return NextResponse.json({ success: true, message: "Admin PIN set" });
    }

    /* ---- VERIFY ---- */
    if (action === "verify") {
      if (isLocked(user.adminLockedUntil)) {
        const remaining = Math.ceil(
          (user.adminLockedUntil!.getTime() - Date.now()) / 60000,
        );
        return NextResponse.json(
          {
            error: `Account locked. Try again in ${remaining} minutes.`,
            locked: true,
          },
          { status: 429 },
        );
      }

      const { pin } = body;
      if (!pin || !/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 },
        );
      }

      if (!user.adminPinHash) {
        return NextResponse.json(
          { error: "PIN not set. Set it first." },
          { status: 400 },
        );
      }

      const isValid = await verifyPin(pin, user.adminPinHash);

      if (!isValid) {
        const newAttempts = (user.adminPinAttempts || 0) + 1;
        const lockoutData: unknown = { adminPinAttempts: newAttempts };

        if (newAttempts >= 3) {
          lockoutData.adminLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await prisma.user.update({ where: { id: user.id }, data: lockoutData });

        await prisma.securityAuditLog.create({
          data: {
            ledgerId: user.ledgerId,
            action: "pin_fail",
            ipAddress:
              req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            success: false,
            details: `Admin PIN fail. Attempt ${newAttempts}/3.`,
            currentHash: crypto.randomUUID(),
          },
        });

        if (newAttempts >= 3) {
          return NextResponse.json(
            {
              error: "Too many failed attempts. Locked for 15 minutes.",
              locked: true,
            },
            { status: 429 },
          );
        }

        return NextResponse.json(
          { error: `Invalid PIN. ${3 - newAttempts} attempts remaining.` },
          { status: 401 },
        );
      }

      // Success
      await prisma.user.update({
        where: { id: user.id },
        data: { adminPinAttempts: 0, adminLockedUntil: null },
      });

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
          details: "Admin PIN verified. Session issued.",
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
        adminPinVerifiedAt: now,
        adminTotpEnabled: user.adminTotpEnabled,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(key);

      const response = NextResponse.json({
        success: true,
        message: "Admin PIN verified",
      });
      response.cookies.set("ledger_session", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 2,
        path: "/",
      });

      return response;
    }

    /* ---- CHANGE ---- */
    if (action === "change") {
      const { oldPin, newPin } = body;
      if (!oldPin || !newPin || !/^\d{4}$/.test(newPin)) {
        return NextResponse.json(
          { error: "Both old and new PIN required. New PIN must be 4 digits." },
          { status: 400 },
        );
      }

      if (!user.adminPinHash) {
        return NextResponse.json(
          { error: "No existing PIN. Use 'set' instead." },
          { status: 400 },
        );
      }

      const isValid = await verifyPin(oldPin, user.adminPinHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current PIN incorrect" },
          { status: 401 },
        );
      }

      const hash = await hashPin(newPin);
      await prisma.user.update({
        where: { id: user.id },
        data: { adminPinHash: hash, adminPinAttempts: 0 },
      });

      return NextResponse.json({ success: true, message: "Admin PIN changed" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use set, verify, or change" },
      { status: 400 },
    );
  } catch (err: unknown) {
    console.error("[ADMIN PIN]", err);
    return NextResponse.json(
      { error: err.message || "Admin PIN failed" },
      { status: 500 },
    );
  }
}
