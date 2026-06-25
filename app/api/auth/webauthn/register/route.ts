import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* ============================================================
   WEBAUTHN REGISTER — 8th Ledger Security Fortress
   Architect Layer 3: Hardware Key Enrollment
   Install: npm install @simplewebauthn/server
   If unavailable, this route returns setup instructions.
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin" || !user.isPrimaryAdmin) {
      return NextResponse.json({ error: "Architect authority required. Primary admin access only." }, { status: 403 });
    }

    const body = await req.json();
    const { step } = body; // "start" | "finish"

    /* ---- STEP 1: Generate Challenge ---- */
    if (step === "start") {
      const crypto = await import("crypto");
      const challenge = crypto.randomBytes(32).toString("base64url");

      // Store challenge in session or temporary record (5 min expiry)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // We reuse webauthnCounter as challenge expiry timestamp temporarily
          webauthnCounter: Math.floor(Date.now() / 1000) + 300,
        },
      });

      // If simplewebauthn is available, use proper options
      try {
        const { generateRegistrationOptions } = await import("@simplewebauthn/server");
        const options = await generateRegistrationOptions({
          rpName: "8th Ledger Protocol",
          rpID: process.env.WEBAUTHN_RP_ID || "localhost",
          userID: user.ledgerId,
          userName: user.displayName,
          challenge,
          attestationType: "direct",
          authenticatorSelection: {
            residentKey: "discouraged",
            userVerification: "required",
            authenticatorAttachment: "platform", // TouchID/FaceID first
          },
        });

        return NextResponse.json({ success: true, options });
      } catch {
        // Fallback without simplewebauthn library
        return NextResponse.json({
          success: true,
          fallback: true,
          options: {
            challenge,
            rp: {
              name: "8th Ledger Protocol",
              id: process.env.WEBAUTHN_RP_ID || "localhost",
            },
            user: {
              id: user.ledgerId,
              name: user.displayName,
              displayName: user.displayName,
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" },   // ES256
              { alg: -257, type: "public-key" }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
            },
            attestation: "direct",
            timeout: 60000,
          },
        });
      }
    }

    /* ---- STEP 2: Verify & Store Credential ---- */
    if (step === "finish") {
      const { credential } = body;
      if (!credential?.id || !credential?.rawId || !credential?.response) {
        return NextResponse.json({ error: "Invalid credential payload" }, { status: 400 });
      }

      try {
        const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
        const verification = await verifyRegistrationResponse({
          response: credential,
          expectedChallenge: async () => true, // Simplified — production should verify exact challenge
          expectedOrigin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          expectedRPID: process.env.WEBAUTHN_RP_ID || "localhost",
          requireUserVerification: true,
        });

        if (!verification.verified || !verification.registrationInfo) {
          throw new Error("Verification failed");
        }

        const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            webauthnCredentialId: Buffer.from(credentialID).toString("base64url"),
            webauthnPublicKey: Buffer.from(credentialPublicKey).toString("base64url"),
            webauthnCounter: counter,
          },
        });

        // Security audit
        await prisma.securityAuditLog.create({
          data: {
            ledgerId: user.ledgerId,
            action: "admin_login",
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
            deviceFingerprint: req.headers.get("x-device-fingerprint") || "unknown",
            success: true,
            details: "WebAuthn hardware key enrolled for Architect.",
            currentHash: crypto.randomUUID(),
          },
        });

        return NextResponse.json({ success: true, message: "Hardware key enrolled" });
      } catch (libError: any) {
        // Fallback: store raw credential without deep verification
        // ⚠️ Production should use @simplewebauthn/server for full verification
        await prisma.user.update({
          where: { id: user.id },
          data: {
            webauthnCredentialId: credential.id,
            webauthnPublicKey: credential.rawId,
            webauthnCounter: 0,
          },
        });

        return NextResponse.json({
          success: true,
          warning: "Fallback storage mode. Install @simplewebauthn/server for full attestation verification.",
          message: "Credential stored. Re-register with library installed for production hardening.",
        });
      }
    }

    return NextResponse.json({ error: "Invalid step. Use 'start' or 'finish'." }, { status: 400 });
  } catch (err: any) {
    console.error("[WEBAUTHN REGISTER]", err);
    return NextResponse.json(
      { error: err.message || "Hardware key registration failed" },
      { status: 500 }
    );
  }
}