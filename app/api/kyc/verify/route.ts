import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const REQUIRED_CHALLENGES = ["blink", "smile", "turn"] as const;

/* ============================================================
   GET /api/kyc/verify — Liveness status check
   8th Ledger Sovereign Identity Verification
   ============================================================ */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycRecord.findUnique({
      where: { userId: user.id },
      select: {
        livenessVideoUrl: true,
        livenessPassed: true,
        selfieVerified: true,
        idVerified: true,
        addressVerified: true,
        status: true,
        tier: true,
      },
    });

    if (!kyc) {
      return NextResponse.json({
        success: true,
        liveness: {
          passed: false,
          videoUrl: null,
          challenges: [],
          allStepsComplete: false,
        },
      });
    }

    const allComplete = kyc.idVerified && kyc.selfieVerified && kyc.livenessPassed && kyc.addressVerified;

    return NextResponse.json({
      success: true,
      liveness: {
        passed: kyc.livenessPassed,
        videoUrl: kyc.livenessVideoUrl,
        challenges: kyc.livenessPassed ? [...REQUIRED_CHALLENGES] : [],
        allStepsComplete: allComplete,
        tier: kyc.tier,
        status: kyc.status,
      },
    });
  } catch (error) {
    console.error("[KYC_VERIFY GET]", error);
    return NextResponse.json({ success: false, error: "Status check failed" }, { status: 500 });
  }
}

/* ============================================================
   POST /api/kyc/verify — Liveness video validation
   Challenge/response: blink, smile, turn
   ============================================================ */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      videoUrl,
      challengeResults, // { blink: boolean, smile: boolean, turn: boolean, timestamp: number }
      sessionId,
    } = body;

    // ── Validation ──
    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "videoUrl required and must be a string" },
        { status: 400 }
      );
    }

    if (!challengeResults || typeof challengeResults !== "object") {
      return NextResponse.json(
        { success: false, error: "challengeResults object required" },
        { status: 400 }
      );
    }

    // ── Challenge verification ──
    const results = challengeResults as Record<string, boolean>;
    const passedChallenges = REQUIRED_CHALLENGES.filter((c) => results[c] === true);
    const failedChallenges = REQUIRED_CHALLENGES.filter((c) => results[c] !== true);
    const allPassed = passedChallenges.length === REQUIRED_CHALLENGES.length;

    if (!allPassed) {
      // Log failed attempt for fraud tracking
      await prisma.auditLog.create({
        data: {
          eventType: "KYC_LIVENESS_FAILED",
          description: `Liveness challenge failed for ${user.ledgerId}`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ passed: passedChallenges, failed: failedChallenges, sessionId }),
          txHash: `LIV-${Date.now()}`,
          visibleToPublic: false,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Liveness challenge incomplete",
          passed: passedChallenges,
          failed: failedChallenges,
          required: [...REQUIRED_CHALLENGES],
        },
        { status: 400 }
      );
    }

    // ── Cooldown check (prevent spam) ──
    const existing = await prisma.kycRecord.findUnique({
      where: { userId: user.id },
      select: { updatedAt: true, livenessPassed: true },
    });

    if (existing?.livenessPassed) {
      return NextResponse.json(
        { success: false, error: "Liveness already verified. Contact support to reset." },
        { status: 409 }
      );
    }

    // ── Update KYC record ──
    const kyc = await prisma.kycRecord.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        livenessVideoUrl: videoUrl,
        livenessPassed: true,
        status: "pending",
        tier: "visitor",
      },
      update: {
        livenessVideoUrl: videoUrl,
        livenessPassed: true,
      },
    });

    // ── Check full completion ──
    const allComplete = kyc.idVerified && kyc.selfieVerified && kyc.livenessPassed && kyc.addressVerified;

    if (allComplete) {
      await prisma.kycRecord.update({
        where: { userId: user.id },
        data: {
          status: "pending",
          tier: "sovereign",
        },
      });
    }

    // ── Sync user ──
    await prisma.user.update({
      where: { id: user.id },
      data: {
        kycTier: allComplete ? "sovereign" : kyc.tier,
        kycStatus: allComplete ? "pending" : kyc.status,
      },
    });

    // ── Audit log ──
    await prisma.auditLog.create({
      data: {
        eventType: "KYC_LIVENESS_PASSED",
        description: `Liveness verified for ${user.ledgerId}`,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({ sessionId, challenges: passedChallenges, allComplete }),
        txHash: `LIV-${Date.now()}`,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      liveness: {
        passed: true,
        challenges: passedChallenges,
        videoUrl,
        sessionId: sessionId || null,
      },
      allStepsComplete: allComplete,
      tier: allComplete ? "sovereign" : kyc.tier,
      message: allComplete
        ? "Liveness verified. All SIV steps complete — awaiting 8th Ledger review."
        : "Liveness verified. Complete remaining steps.",
    });
  } catch (error) {
    console.error("[KYC_VERIFY POST]", error);
    return NextResponse.json(
      { success: false, error: "Liveness verification failed" },
      { status: 500 }
    );
  }
}