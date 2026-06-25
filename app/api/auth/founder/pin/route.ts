import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ============================================================
   PRIMARY ADMIN PIN — 6-digit, 1-hour lockout, bcrypt
   8th Ledger Security Fortress — Architect Layer 2
   Install: npm install bcryptjs
   Types: npm install -D @types/bcryptjs
   ============================================================ */

async function hashPin(pin: string): Promise<string> {
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.hashSync(pin, 12);
  } catch {
    const crypto = await import("crypto");
    return crypto.pbkdf2Sync(pin, process.env.SESSION_SECRET || "8th-ledger", 100000, 64, "sha512").toString("hex");
  }
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compareSync(pin, hash);
  } catch {
    const crypto = await import("crypto");
    const testHash = crypto.pbkdf2Sync(pin, process.env.SESSION_SECRET || "8th-ledger", 100000, 64, "sha512").toString("hex");
    return testHash === hash;
  }
}

function isLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

/* ============================================================
   GET /api/auth/founder/pin — Status check (for setup flow)
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin" || !user.isPrimaryAdmin) {
      return NextResponse.json({ error: "Architect authority required. Primary admin access only." }, { status: 403 });
    }

    const locked = isLocked(user.founderLockedUntil);
    const remaining = locked && user.founderLockedUntil
      ? Math.ceil((user.founderLockedUntil.getTime() - Date.now()) / 60000)
      : 0;

    return NextResponse.json({
      success: true,
      pinSet: !!user.founderPinHash,
      locked,
      lockMinutesRemaining: remaining,
      attempts: user.founderPinAttempts || 0,
      geoEnrolled: user.founderTrustedLat != null && user.founderTrustedLng != null,
      windowStart: user.founderAccessWindowStart ?? 8,
      windowEnd: user.founderAccessWindowEnd ?? 23,
      webauthnEnrolled: !!user.webauthnCredentialId,
    });
  } catch (err: any) {
    console.error("[PRIMARY ADMIN PIN GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============================================================
   POST /api/auth/founder/pin — Set / Verify / Change
   ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin" || !user.isPrimaryAdmin) {
      return NextResponse.json({ error: "Architect authority required. Primary admin access only." }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body; // "set" | "verify" | "change"

    /* ---- SET: Create new PIN ---- */
    if (action === "set") {
      const { pin } = body;
      if (!pin || !/^\d{6}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 });
      }

      const hash = await hashPin(pin);
      await prisma.user.update({
        where: { id: user.id },
        data: { founderPinHash: hash, founderPinAttempts: 0, founderLockedUntil: null },
      });

      return NextResponse.json({ success: true, message: "Architect PIN set" });
    }

    /* ---- VERIFY: Check PIN + issue session with fortress settings ---- */
    if (action === "verify") {
      if (isLocked(user.founderLockedUntil)) {
        const remaining = Math.ceil((user.founderLockedUntil!.getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { error: `Sovereign account locked. Try again in ${remaining} minutes.`, locked: true, lockMinutes: remaining },
          { status: 429 }
        );
      }

      const { pin } = body;
      if (!pin || !/^\d{6}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be exactly 6 digits" }, { status: 400 });
      }

      if (!user.founderPinHash) {
        return NextResponse.json({ error: "PIN not set. Set it first.", needsSetup: true }, { status: 400 });
      }

      const isValid = await verifyPin(pin, user.founderPinHash);

      if (!isValid) {
        const newAttempts = (user.founderPinAttempts || 0) + 1;
        const lockoutData: any = { founderPinAttempts: newAttempts };

        if (newAttempts >= 3) {
          lockoutData.founderLockedUntil = new Date(Date.now() + 60 * 60 * 1000);
        }

        await prisma.user.update({ where: { id: user.id }, data: lockoutData });

        await prisma.securityAuditLog.create({
          data: {
            ledgerId: user.ledgerId,
            action: "pin_fail",
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            success: false,
            details: `Architect PIN fail. Attempt ${newAttempts}/3.`,
            currentHash: crypto.randomUUID(),
          },
        });

        if (newAttempts >= 3) {
          return NextResponse.json(
            { error: "Too many failed attempts. Architect locked for 1 hour.", locked: true, lockMinutes: 60 },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { error: `Invalid PIN. ${3 - newAttempts} attempts remaining.` },
          { status: 401 }
        );
      }

      // Success — reset attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { founderPinAttempts: 0, founderLockedUntil: null },
      });

      await prisma.securityAuditLog.create({
        data: {
          ledgerId: user.ledgerId,
          action: "admin_login",
          ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          deviceFingerprint: req.headers.get("x-device-fingerprint") || "unknown",
          success: true,
          details: "Architect PIN verified. Session issued with fortress settings.",
          currentHash: crypto.randomUUID(),
        },
      });

      // Issue 15-minute primary admin session WITH FORTRESS SETTINGS EMBEDDED
      const secret = process.env.SESSION_SECRET;
      if (!secret) throw new Error("SESSION_SECRET missing");

      const key = new TextEncoder().encode(secret);
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
        founderPinVerifiedAt: now,
        founderTotpEnabled: user.founderTotpEnabled,
        // EMBEDDED FORTRESS SETTINGS
        primaryAdminAccessWindowStart: user.founderAccessWindowStart ?? 8,
        primaryAdminAccessWindowEnd: user.founderAccessWindowEnd ?? 23,
        primaryAdminLockedUntil: user.founderLockedUntil ? Math.floor(user.founderLockedUntil.getTime() / 1000) : undefined,
        primaryAdminTrustedLat: user.founderTrustedLat ?? undefined,
        primaryAdminTrustedLng: user.founderTrustedLng ?? undefined,
        primaryAdminGeoRadiusKm: user.founderGeoRadiusKm || 50,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(key);

      const response = NextResponse.json({ success: true, message: "Architect PIN verified" });
      response.cookies.set("ledger_session", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15,
        path: "/",
      });

      return response;
    }

    /* ---- CHANGE: Verify old PIN, set new PIN ---- */
    if (action === "change") {
      const { oldPin, newPin } = body;
      if (!oldPin || !newPin || !/^\d{6}$/.test(newPin)) {
        return NextResponse.json({ error: "Both old and new PIN required. New PIN must be 6 digits." }, { status: 400 });
      }

      if (!user.founderPinHash) {
        return NextResponse.json({ error: "No existing PIN. Use 'set' instead." }, { status: 400 });
      }

      const isValid = await verifyPin(oldPin, user.founderPinHash);
      if (!isValid) {
        return NextResponse.json({ error: "Current PIN incorrect" }, { status: 401 });
      }

      const hash = await hashPin(newPin);
      await prisma.user.update({
        where: { id: user.id },
        data: { founderPinHash: hash, founderPinAttempts: 0 },
      });

      return NextResponse.json({ success: true, message: "Architect PIN changed" });
    }

    return NextResponse.json({ error: "Invalid action. Use set, verify, or change" }, { status: 400 });
  } catch (err: any) {
    console.error("[PRIMARY ADMIN PIN]", err);
    return NextResponse.json({ error: err.message || "Architect PIN failed" }, { status: 500 });
  }
}