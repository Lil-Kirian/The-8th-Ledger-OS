/* ============================================================
   /api/forge/route.ts
   8th Ledger Forge — Legacy tier advancement endpoint.
   NOTE: The token-burning forge system has been retired.
   The true Forge Ledger (staffing & payroll) is built in Phase 3.
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ─── TIER CONFIGURATION ─── */
const TIERS = [
  { level: 1, name: "Novice", minTrust: 0, maxTrust: 199, forgeCost: 0 },
  { level: 2, name: "Adept", minTrust: 200, maxTrust: 399, forgeCost: 50 },
  { level: 3, name: "Vanguard", minTrust: 400, maxTrust: 699, forgeCost: 150 },
  { level: 4, name: "Archon", minTrust: 700, maxTrust: 949, forgeCost: 400 },
  { level: 5, name: "Sovereign", minTrust: 950, maxTrust: 1000, forgeCost: 1000 },
];

function getTierByLevel(level: number) {
  return TIERS.find((t) => t.level === level) || TIERS[0];
}

function getNextTier(currentLevel: number) {
  return TIERS.find((t) => t.level === currentLevel + 1);
}

/* ============================================================
   GET /api/forge
   Returns user's forge profile + history
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        ledgerId: true,
        displayName: true,
        ledgerBalance: true,
        trustScore: true,
        tier: true,
        forgesCompleted: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const trustScore = dbUser.trustScore || 0;
    const tier = dbUser.tier || 1;
    const forgesCompleted = dbUser.forgesCompleted || 0;
    const ledgerBalance = Number(dbUser.ledgerBalance) || 0;

    const currentTier = getTierByLevel(tier);
    const nextTier = getNextTier(tier);
    const nextTierProgress = nextTier
      ? Math.min(
          100,
          Math.round(((trustScore - currentTier.minTrust) / (nextTier.minTrust - currentTier.minTrust)) * 100)
        )
      : 100;

    // Forge history pulled from audit logs (forgeTransaction table retired)
    const forgeHistory = await prisma.auditLog.findMany({
      where: { ledgerId: user.ledgerId, eventType: "forge_completed" },
      orderBy: { timestamp: "desc" },
      take: 50,
      select: {
        id: true,
        timestamp: true,
        metadata: true,
        txHash: true,
      },
    }).catch(() => []);

    const history = forgeHistory.map((tx: unknown) => {
      const meta = tx.metadata ? JSON.parse(tx.metadata) : {};
      return {
        id: tx.id,
        date: tx.timestamp?.toISOString() || new Date().toISOString(),
        ledgerBurned: meta.ledgerBurned || 0,
        trustGained: meta.trustGained || 0,
        newTrustScore: meta.newTrust || 0,
        newTier: meta.toTier || 1,
        txHash: tx.txHash || `LED-FORGE-${tx.id.slice(-8).toUpperCase()}`,
      };
    });

    await prisma.auditLog.create({
      data: {
        eventType: "forge_viewed",
        description: "User viewed forge profile",
        ledgerId: user.ledgerId,
        txHash: `FORGE-VIEW-${Date.now()}`,
        visibleToPublic: false,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      profile: {
        trustScore,
        tier,
        ledgerBalance,
        forgesCompleted,
        nextTierProgress,
      },
      tiers: TIERS.map((t) => ({
        level: t.level,
        name: t.name,
        minTrust: t.minTrust,
        maxTrust: t.maxTrust,
        forgeCost: t.forgeCost,
      })),
      history,
      supply: {
        total: 21_000_000,
        burned: history.reduce((a: number, h: unknown) => a + (h.ledgerBurned || 0), 0),
        remainingPercent: "100.0",
      },
    });
  } catch (err: unknown) {
    console.error("[API/forge GET]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch forge data" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/forge
   Burn Ledger to forge to next tier
   ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { targetTier } = body;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        ledgerBalance: true,
        trustScore: true,
        tier: true,
        forgesCompleted: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const currentTierLevel = dbUser.tier || 1;
    const currentTrust = dbUser.trustScore || 0;
    const currentLedger = Number(dbUser.ledgerBalance) || 0;
    const currentForges = dbUser.forgesCompleted || 0;

    const nextTier = getNextTier(currentTierLevel);

    if (!nextTier) {
      return NextResponse.json(
        { success: false, error: "Already at maximum tier" },
        { status: 400 }
      );
    }

    if (targetTier && targetTier !== nextTier.level) {
      return NextResponse.json(
        { success: false, error: "Can only forge to the next consecutive tier" },
        { status: 400 }
      );
    }

    if (currentLedger < nextTier.forgeCost) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient Ledger balance. Need ${nextTier.forgeCost} LED, have ${currentLedger}.`,
        },
        { status: 400 }
      );
    }

    const newTrust = nextTier.minTrust + 50;
    const newTier = nextTier.level;
    const newLedger = currentLedger - nextTier.forgeCost;
    const newForges = currentForges + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ledgerBalance: newLedger,
        trustScore: newTrust,
        tier: newTier,
        forgesCompleted: newForges,
      },
    });

    const txHash = `LED-8X2P-FORGE-${Date.now().toString(36).toUpperCase()}`;

    await prisma.auditLog.create({
      data: {
        eventType: "forge_completed",
        description: `Forge completed: tier ${currentTierLevel} → ${newTier}`,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({
          fromTier: currentTierLevel,
          toTier: newTier,
          ledgerBurned: nextTier.forgeCost,
          newTrust,
          txHash,
        }),
        txHash,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: `forge-${Date.now()}`,
        date: new Date().toISOString(),
        ledgerBurned: nextTier.forgeCost,
        trustGained: newTrust - currentTrust,
        newTrustScore: newTrust,
        newTier,
        txHash,
      },
      profile: {
        trustScore: newTrust,
        tier: newTier,
        ledgerBalance: newLedger,
        forgesCompleted: newForges,
      },
    });
  } catch (err: unknown) {
    console.error("[API/forge POST]", err);
    return NextResponse.json(
      { success: false, error: "Forge failed: " + err.message },
      { status: 500 }
    );
  }
}