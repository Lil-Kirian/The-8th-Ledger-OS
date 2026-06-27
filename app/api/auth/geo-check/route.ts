import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ============================================================
   GEO + TIME CHECK — Primary Admin Gate (8th Ledger Fortress)
   Architect Layer 4: Geographic + Time-Window Verification
   ============================================================ */

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isWithinWindow(start: number | null, end: number | null): boolean {
  const startHour = start ?? 8;
  const endHour = end ?? 23;
  const currentHour = new Date().getUTCHours();
  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  }
  return currentHour >= startHour || currentHour < endHour;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin" || !user.isPrimaryAdmin) {
      return NextResponse.json({ error: "Architect authority required. Primary admin access only." }, { status: 403 });
    }

    const body = await req.json();
    const { lat, lng } = body;

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const deviceFingerprint = req.headers.get("x-device-fingerprint") || "unknown";

    /* ===== 1. TIME-WINDOW CHECK ===== */
    if (!isWithinWindow(user.founderAccessWindowStart, user.founderAccessWindowEnd)) {
      await prisma.securityAuditLog.create({
        data: {
          ledgerId: user.ledgerId,
          action: "time_lockout",
          ipAddress: clientIp,
          userAgent,
          deviceFingerprint,
          lat: lat || null,
          lng: lng || null,
          success: false,
          details: `Access outside time window. Allowed: ${user.founderAccessWindowStart ?? 8}:00-${user.founderAccessWindowEnd ?? 23}:00 UTC. Current: ${new Date().getUTCHours()}:00 UTC.`,
          currentHash: crypto.randomUUID(),
        },
      });

      return NextResponse.json(
        {
          error: "Architect access restricted outside configured hours.",
          timeLock: true,
          windowStart: user.founderAccessWindowStart ?? 8,
          windowEnd: user.founderAccessWindowEnd ?? 23,
          currentHour: new Date().getUTCHours(),
        },
        { status: 403 }
      );
    }

    /* ===== 2. FIRST-TIME ENROLLMENT ===== */
    if (user.founderTrustedLat == null || user.founderTrustedLng == null) {
      if (lat == null || lng == null) {
        return NextResponse.json(
          { error: "GPS coordinates required for first-time Architect enrollment.", needsEnrollment: true },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          founderTrustedLat: lat,
          founderTrustedLng: lng,
        },
      });

      await prisma.securityAuditLog.create({
        data: {
          ledgerId: user.ledgerId,
          action: "admin_login",
          ipAddress: clientIp,
          userAgent,
          deviceFingerprint,
          lat,
          lng,
          success: true,
          details: "Trusted geographic anchor set for first time.",
          currentHash: crypto.randomUUID(),
        },
      });

      // Issue JWT with geo enrolled
      return issuePrimaryAdminSession(user, req);
    }

    /* ===== 3. GEOGRAPHIC CHECK ===== */
    if (lat != null && lng != null) {
      const distance = getDistanceKm(user.founderTrustedLat, user.founderTrustedLng, lat, lng);
      const radius = user.founderGeoRadiusKm || 50;

      if (distance > radius) {
        await prisma.securityAuditLog.create({
          data: {
            ledgerId: user.ledgerId,
            action: "geo_anomaly",
            ipAddress: clientIp,
            userAgent,
            deviceFingerprint,
            lat,
            lng,
            success: false,
            details: `Geographic anomaly. Distance: ${distance.toFixed(1)}km from anchor. Radius: ${radius}km.`,
            currentHash: crypto.randomUUID(),
          },
        });

        return NextResponse.json(
          {
            error: "Geographic anomaly detected. Architect access denied.",
            geoAnomaly: true,
            distance: Math.round(distance),
            radius,
            trustedLat: user.founderTrustedLat,
            trustedLng: user.founderTrustedLng,
            currentLat: lat,
            currentLng: lng,
          },
          { status: 403 }
        );
      }
    }

    /* ===== 4. PASS — Log & Issue Session ===== */
    await prisma.securityAuditLog.create({
      data: {
        ledgerId: user.ledgerId,
        action: "admin_login",
        ipAddress: clientIp,
        userAgent,
        deviceFingerprint,
        lat: lat || null,
        lng: lng || null,
        success: true,
        details: lat != null
          ? `Geographic check passed. Within ${user.founderGeoRadiusKm || 50}km radius.`
          : "Geographic check skipped (no coordinates).",
        currentHash: crypto.randomUUID(),
      },
    });

    return issuePrimaryAdminSession(user, req);
  } catch (err: unknown) {
    console.error("[GEO CHECK]", err);
    return NextResponse.json({ error: err.message || "Geographic check failed" }, { status: 500 });
  }
}

/* ============================================================
   Helper: Issue Primary Admin JWT with all fortress settings
   ============================================================ */
async function issuePrimaryAdminSession(user: unknown, req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET missing");

  const key = new TextEncoder().encode(secret);
  const now = Math.floor(Date.now() / 1000);

  // Preserve existing verification timestamps from current session if available
  const cookie = req.cookies.get("ledger_session")?.value;
  let existingClaims: unknown = {};
  if (cookie && cookie.includes(".")) {
    try {
      const { jwtVerify } = await import("jose");
      const { payload } = await jwtVerify(cookie, key, { clockTolerance: 60 });
      existingClaims = payload;
    } catch {
      // ignore
    }
  }

  const newToken = await new SignJWT({
    ledgerId: user.ledgerId,
    kycTier: user.kycTier || "visitor",
    role: user.role,
    isPrimaryAdmin: true,
    hallIds: user.hallIds || [],
    nameMatchVerified: user.nameMatchVerified || false,
    deviceFingerprint: user.deviceFingerprint || undefined,
    totpEnabled: user.totpEnabled,
    totpVerifiedAt: existingClaims.totpVerifiedAt || now,
    founderTotpEnabled: user.founderTotpEnabled,
    founderTotpVerifiedAt: existingClaims.founderTotpVerifiedAt || now,
    founderPinVerifiedAt: existingClaims.founderPinVerifiedAt || now,
    webauthnVerifiedAt: existingClaims.webauthnVerifiedAt || now,
    // FORTRESS SETTINGS EMBEDDED
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

  const response = NextResponse.json({
    success: true,
    message: "Geographic and time verification passed.",
    geoVerified: user.founderTrustedLat != null,
    timeVerified: true,
    enrolled: true,
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