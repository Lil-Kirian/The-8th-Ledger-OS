// app/api/meridian/cycle/[id]/forge/route.ts
// 8th Ledger — The Forge: Winner pool opens. First 100 committers = "Early Ledger".
// GET: Public. Forge status, commitment progress, early ledger count.
// POST: Admin-only. Completes forge, locks cycle, spawns hall if missing.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdminRole } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// CONSTANTS
//

const EARLY_LEDGER_MAX = 100;

//
// HELPERS
//

function maskPoolId(poolId: string): string {
  if (!poolId || poolId.length < 4) return "POOL-XXXX";
  return `POOL-${poolId.slice(-4).toUpperCase()}`;
}

//
// GET /api/meridian/cycle/[id]/forge
// Public. Forge status. Cached 15s (commitment data changes fast).
//

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cycleId } = await params;

    if (!cycleId || cycleId.length < 10) {
      return NextResponse.json(
        { error: "Invalid cycle ID", code: "VALIDATION_ID" },
        { status: 400 }
      );
    }

    const cycle = await prisma.meridianCycle.findUnique({
      where: { id: cycleId },
      include: {
        cyclePools: {
          where: { isWinner: true },
          include: {
            pool: {
              select: {
                id: true,
                poolId: true,
                name: true,
                verticalId: true,
                country: true,
                imageUrl: true,
                assetValue: true,
                status: true,
                committed: true,
                target: true,
                participants: true,
                maxParticipants: true,
                minCommitment: true,
                maxCommitment: true,
                campaignDuration: true,
                hallClass: true,
                emojiSet: true,
                assetImages: true,
                assetBookValue: true,
                closesAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!cycle.winnerPoolId) {
      return NextResponse.json(
        { error: "No winner has been revealed yet", code: "NO_WINNER" },
        { status: 400 }
      );
    }

    const winnerCyclePool = cycle.cyclePools[0];
    if (!winnerCyclePool) {
      return NextResponse.json(
        { error: "Winner pool data missing", code: "WINNER_DATA_MISSING" },
        { status: 500 }
      );
    }

    const pool = winnerCyclePool.pool;

    // Early Ledger: first 100 ownerships created after winner was revealed
    // (approximated by cyclePool.revealedAt or cycle start + 96h)
    const forgeStart = new Date(
      cycle.startAt.getTime() + 48 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000
    );

    const earlyLedgerCount = await prisma.ownership.count({
      where: {
        poolId: pool.id,
        createdAt: { gte: forgeStart },
      },
    });

    const now = Date.now();
    const endAtMs = cycle.startAt.getTime() + 48 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000;
    const timeRemaining = Math.max(0, endAtMs - now);

    const response = NextResponse.json({
      cycle: {
        id: cycle.id,
        continent: cycle.continent,
        phase: cycle.phase,
        startAt: cycle.startAt,
        timeRemaining,
      },
      winner: {
        cyclePoolId: winnerCyclePool.id,
        poolId: maskPoolId(pool.poolId),
        name: pool.name,
        verticalId: pool.verticalId,
        country: pool.country,
        imageUrl: pool.imageUrl,
        assetValue: pool.assetValue,
        status: pool.status,
        hallClass: pool.hallClass,
        emojiSet: pool.emojiSet,
        assetImages: pool.assetImages,
        assetBookValue: pool.assetBookValue,
      },
      commitment: {
        committed: pool.committed,
        target: pool.target,
        participants: pool.participants,
        maxParticipants: pool.maxParticipants,
        percentFilled: pool.target > 0 ? Math.round((pool.committed / pool.target) * 1000) / 10 : 0,
        minCommitment: pool.minCommitment,
        maxCommitment: pool.maxCommitment,
        campaignDuration: pool.campaignDuration,
        closesAt: pool.closesAt,
      },
      earlyLedger: {
        count: earlyLedgerCount,
        max: EARLY_LEDGER_MAX,
        remaining: Math.max(0, EARLY_LEDGER_MAX - earlyLedgerCount),
        status: earlyLedgerCount < EARLY_LEDGER_MAX ? "open" : "closed",
      },
      meta: {
        message:
          cycle.phase === "forge"
            ? "🔥 FORGED 🔥 — Commit to earn. Own a piece of the 8th Ledger."
            : "This cycle is complete. The pool is live.",
      },
    });

    response.headers.set("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
    return response;
  } catch (error) {
    console.error("[MERIDIAN_FORGE_GET]", error);
    return NextResponse.json(
      { error: "The forge cannot be inspected", code: "MERIDIAN_FORGE_001" },
      { status: 500 }
    );
  }
}

//
// POST /api/meridian/cycle/[id]/forge
// Admin-only. Complete the forge. Lock cycle. Ensure hall exists.
//

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const user = await requireAuth(req);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        {
          error: "The Architect only. Admin role required.",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const { id: cycleId } = await params;
    if (!cycleId || cycleId.length < 10) {
      return NextResponse.json(
        { error: "Invalid cycle ID", code: "VALIDATION_ID" },
        { status: 400 },
      );
    }

    // 2. Fetch cycle + winner
    const cycle = await prisma.meridianCycle.findUnique({
      where: { id: cycleId },
      include: {
        cyclePools: {
          where: { isWinner: true },
          include: {
            pool: {
              select: {
                id: true,
                poolId: true,
                name: true,
                status: true,
                hallClass: true,
                hallUnlocked: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (cycle.phase !== "forge") {
      return NextResponse.json(
        {
          error: `Cannot complete forge during ${cycle.phase} phase. Must be in forge.`,
          code: "PHASE_LOCKED",
          currentPhase: cycle.phase,
        },
        { status: 409 },
      );
    }

    const winnerCyclePool = cycle.cyclePools[0];
    if (!winnerCyclePool) {
      return NextResponse.json(
        { error: "No winner to forge", code: "NO_WINNER" },
        { status: 400 },
      );
    }

    const pool = winnerCyclePool.pool;

    // 3. Atomic completion
    const result = await prisma.$transaction(async (tx) => {
      // Mark cycle complete
      const updatedCycle = await tx.meridianCycle.update({
        where: { id: cycleId },
        data: {
          phase: "complete",
          lockStatus: "locked",
          endAt: new Date(),
        },
      });

      // Ensure pool is open for commitment
      await tx.pool.update({
        where: { id: pool.id },
        data: {
          status: "filling",
          hallUnlocked: true,
        },
      });

      // Ensure hall exists (auto-spawn ghost hall if missing)
      const existingHall = await tx.hall.findUnique({
        where: { poolId: pool.id },
        select: { id: true },
      });

      if (!existingHall) {
        await tx.hall.create({
          data: {
            poolId: pool.id,
            name: pool.name,
            status: "ghost",
            hallClass: pool.hallClass || "I",
            sriScore: 50,
            ahgiScore: 50,
            closureStatus: "active",
          },
        });
      }

      // Audit
      await tx.auditLog.create({
        data: {
          eventType: "meridian_forge_complete",
          description: `Cycle ${cycleId} complete. ${pool.name} (${maskPoolId(pool.poolId)}) is now live for commitment.`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            cycleId,
            poolId: pool.id,
            poolPoolId: pool.poolId,
            hallSpawned: !existingHall,
          }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      });

      return updatedCycle;
    });

    return NextResponse.json({
      cycle: {
        id: result.id,
        continent: result.continent,
        phase: result.phase,
        lockStatus: result.lockStatus,
        endAt: result.endAt,
      },
      winner: {
        poolId: maskPoolId(pool.poolId),
        name: pool.name,
        status: "live",
      },
      meta: {
        message: "The forge is complete. The pool is live. Commit to earn.",
      },
    });
  } catch (error: any) {
    console.error("[MERIDIAN_FORGE_POST]", error);

    if (
      error.message?.includes("Unauthorized") ||
      error.message?.includes("unauthorized")
    ) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "The forge could not be completed", code: "MERIDIAN_FORGE_002" },
      { status: 500 },
    );
  }
}