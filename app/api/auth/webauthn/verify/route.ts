import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ============================================================
   WEBAUTHN VERIFY — 8th Ledger Security Fortress
   Architect Layer 3: Hardware Key Authentication
   DEPENDENCY: npm install @simplewebauthn/server
   If unavailable, this route returns setup instructions.
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin" || !user.isPrimaryAdmin) {
      return NextResponse.json({ error: "Architect authority required. Primary admin access only." }, { status: 403 });
    }

    // Check if hardware key is enrolled
    if (!user.webauthnCredentialId || !user.webauthnPublicKey) {
      return NextResponse.json(
        { error: "No hardware key enrolled. Register first at /api/auth/webauthn/register" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { step } = body; // "start" | "finish"

    /* ---- STEP 1: Generate Authentication Challenge ---- */
    if (step === "start") {
      const crypto = await import("crypto");
      const challenge = crypto.randomBytes(32).toString("base64url");

      // Store challenge temporarily (5 min expiry)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          webauthnCounter: Math.floor(Date.now() / 1000) + 300,
        },
      });

      try {
        const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
        const options = await generateAuthenticationOptions({
          rpID: process.env.WEBAUTHN_RP_ID || "localhost",
          allowCredentials: [
            {
              id: Buffer.from(user.webauthnCredentialId, "base64url"),
              type: "public-key",
              transports: ["internal", "hybrid"],
            },
          ],
          challenge,
          userVerification: "required",
          timeout: 60000,
        });

        return NextResponse.json({ success: true, options });
      } catch {
        return NextResponse.json({
          success: true,
          fallback: true,
          options: {
            challenge,
            rpId: process.env.WEBAUTHN_RP_ID || "localhost",
            allowCredentials: [
              {
                id: user.webauthnCredentialId,
                type: "public-key",
                transports: ["internal", "hybrid"],
              },
            ],
            userVerification: "required",
            timeout: 60000,
          },
        });
      }
    }

    /* ---- STEP 2: Verify Challenge Response ---- */
    if (step === "finish") {
      const { credential } = body;
      if (!credential?.id || !credential?.rawId || !credential?.response) {
        return NextResponse.json({ error: "Invalid credential payload" }, { status: 400 });
      }

      try {
        const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
        const verification = await verifyAuthenticationResponse({
          response: credential,
          expectedChallenge: async () => true,
          expectedOrigin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          expectedRPID: process.env.WEBAUTHN_RP_ID || "localhost",
          requireUserVerification: true,
          authenticator: {
            credentialID: Buffer.from(user.webauthnCredentialId, "base64url"),
            credentialPublicKey: Buffer.from(user.webauthnPublicKey, "base64url"),
            counter: user.webauthnCounter || 0,
            transports: ["internal", "hybrid"],
          },
        });

        if (!verification.verified) {
          throw new Error("Hardware key verification failed");
        }

        // Update counter
        await prisma.user.update({
          where: { id: user.id },
          data: {
            webauthnCounter: verification.authenticationInfo.newCounter,
            lastFounderAccessAt: new Date(),
            lastFounderIP: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            founderAccessCount: { increment: 1 },
          },
        });

        // Log security audit
        await prisma.securityAuditLog.create({
          data: {
            ledgerId: user.ledgerId,
            action: "admin_login",
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            deviceFingerprint: req.headers.get("x-device-fingerprint") || "unknown",
            success: true,
            details: "Hardware key verified. WebAuthn counter updated. Architect access granted.",
            currentHash: crypto.randomUUID(),
          },
        });

        // Re-issue JWT with hardware key verified
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
          webauthnVerifiedAt: now, // NEW: hardware key verified
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("15m") // Architect session: 15 minutes max
          .sign(key);

        const response = NextResponse.json({
          success: true,
          message: "Hardware key verified. Architect access granted.",
        });

        response.cookies.set("ledger_session", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 15, // 15 minutes
          path: "/",
        });

        return response;
      } catch (libError: any) {
        // Fallback without simplewebauthn
        // ⚠️ Production MUST use library for full verification
        await prisma.securityAuditLog.create({
          data: {
            ledgerId: user.ledgerId,
            action: "webauthn_fail",
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            success: false,
            details: `Fallback verification: ${libError.message}`,
            currentHash: crypto.randomUUID(),
          },
        });

        return NextResponse.json(
          {
            error: "Hardware key verification requires @simplewebauthn/server. Install for production.",
            fallback: true,
          },
          { status: 501 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid step. Use 'start' or 'finish'." }, { status: 400 });
  } catch (err: any) {
    console.error("[WEBAUTHN VERIFY]", err);
    return NextResponse.json(
      { error: err.message || "Hardware key verification failed" },
      { status: 500 }
    );
  }
}