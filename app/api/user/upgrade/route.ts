import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TIER CONFIG — 8th Ledger Sovereign Tiers
   ============================================================ */
const MAX_TIER = 5;

const TIER_UPGRADE_COST: Record<number, number> = {
  1: 100,
  2: 500,
  3: 2000,
  4: 5000,
  5: 0, // Max tier
};

/* ============================================================
   POST /api/user/upgrade — Burn LED to upgrade sovereign tier
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetTier } = body;

    if (!targetTier || typeof targetTier !== "number" || targetTier < 1 || targetTier > MAX_TIER) {
      return NextResponse.json(
        { success: false, error: `Invalid target tier. Must be 1–${MAX_TIER}` },
        { status: 400 }
      );
    }

    const currentTier = user.tier || 1;

    // Validation
    if (targetTier <= currentTier) {
      return NextResponse.json(
        { success: false, error: "Cannot downgrade or stay at current tier" },
        { status: 400 }
      );
    }

    if (targetTier !== currentTier + 1) {
      return NextResponse.json(
        { success: false, error: "Can only upgrade one tier at a time" },
        { status: 400 }
      );
    }

    const cost = TIER_UPGRADE_COST[currentTier];
    if (cost === 0) {
      return NextResponse.json(
        { success: false, error: "You are already at the highest tier" },
        { status: 400 }
      );
    }

    if (user.ledgerBalance < cost) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient LED balance",
          required: cost,
          current: user.ledgerBalance,
          deficit: cost - user.ledgerBalance,
        },
        { status: 402 }
      );
    }

    // Execute: burn LED + upgrade tier
    const updatedUser = await prisma.user.update({
      where: { ledgerId: user.ledgerId },
      data: {
        ledgerBalance: { decrement: cost },
        tier: targetTier,
        trustScore: { increment: Math.round(cost * 0.1) },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "tier_upgrade",
        description: `${user.displayName} upgraded from tier ${currentTier} to ${targetTier}. ${cost} LED burned.`,
        ledgerId: user.ledgerId,
        amount: cost,
        txHash: `UPG-${user.ledgerId}-${Date.now()}`,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      previousTier: currentTier,
      newTier: updatedUser.tier,
      ledBurned: cost,
      ledRemaining: updatedUser.ledgerBalance,
      trustScore: updatedUser.trustScore,
      message: `Upgraded from tier ${currentTier} to ${targetTier}. ${cost} LED burned permanently.`,
    });
  } catch (error: unknown) {
    console.error("[USER_UPGRADE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Tier upgrade failed" },
      { status: 500 }
    );
  }
}