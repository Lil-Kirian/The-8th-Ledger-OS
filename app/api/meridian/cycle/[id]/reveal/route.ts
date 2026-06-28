// app/api/meridian/cycle/[id]/reveal/route.ts
// 8th Ledger — The Reveal: Winner determination. Tiebreaker: Architect's Hand.
// POST: Admin-only. Determines winner, advances phase to forge, opens pool.
// GET: Public tally. Vote distribution. Cached 30s.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// CONSTANTS
//

const PHASE_DURATIONS_MS = {
  hush: 48 * 60 * 60 * 1000,
  unveil: 24 * 60 * 60 * 1000,
  reveal: 24 * 60 * 60 * 1000,
  forge: 6 * 60 * 60 * 1000,
} as const;

const TOTAL_CYCLE_DURATION_MS = Object.values(PHASE_DURATIONS_MS).reduce((a, b) => a + b, 0);

//
// HELPERS
//

function maskPoolId(poolId: string): string {
  if (!poolId || poolId.length < 4) return "POOL-XXXX";
  return `POOL-${poolId.slice(-4).toUpperCase()}`;
}

//
// POST /api/meridian/cycle/[id]/reveal
// Admin-only. Reveal winner. Tiebreaker: Architect's Hand. Atomic.
//

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const user = await requireAuth(req);
    if (user.role !== "admin") {
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

    // 2. Body
    const body = await req.json();
    const { architectHandPoolId } = body as { architectHandPoolId?: string };

    // 3. Fetch cycle with pools
    const cycle = await prisma.meridianCycle.findUnique({
      where: { id: cycleId },
      include: {
        cyclePools: {
          include: {
            pool: {
              select: {
                id: true,
                poolId: true,
                name: true,
                status: true,
                verticalId: true,
                country: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { voteCount: "desc" },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (cycle.phase !== "reveal") {
      return NextResponse.json(
        {
          error: `Cannot reveal winner during ${cycle.phase} phase. Must be in reveal.`,
          code: "PHASE_LOCKED",
          currentPhase: cycle.phase,
        },
        { status: 409 },
      );
    }

    if (cycle.cyclePools.length === 0) {
      return NextResponse.json(
        { error: "No pools in this cycle to reveal", code: "EMPTY_CYCLE" },
        { status: 400 },
      );
    }

    // 4. Determine winner
    const sortedPools = [...cycle.cyclePools].sort(
      (a, b) => b.voteCount - a.voteCount,
    );
    const topVoteCount = sortedPools[0].voteCount;
    const tiedPools = sortedPools.filter((p) => p.voteCount === topVoteCount);

    let winner = null;
    let tiebreakerUsed = false;

    if (tiedPools.length === 1) {
      // Clear winner
      winner = tiedPools[0];
    } else {
      // Tie — Architect's Hand REQUIRED
      if (!architectHandPoolId) {
        return NextResponse.json(
          {
            error:
              "Tie detected. The Architect's Hand is required to break the tie.",
            code: "TIE_BREAKER_REQUIRED",
            tiedPools: tiedPools.map((p) => ({
              cyclePoolId: p.id,
              poolId: maskPoolId(p.pool.poolId),
              name: p.pool.name,
              voteCount: p.voteCount,
            })),
            message: "Provide architectHandPoolId to declare the winner.",
          },
          { status: 422 },
        );
      }

      const forced = tiedPools.find((p) => p.id === architectHandPoolId);
      if (!forced) {
        return NextResponse.json(
          {
            error: "Architect's Hand pool ID is not among the tied contenders",
            code: "INVALID_HAND",
            tiedPools: tiedPools.map((p) => ({
              cyclePoolId: p.id,
              poolId: maskPoolId(p.pool.poolId),
              name: p.pool.name,
            })),
          },
          { status: 400 },
        );
      }

      winner = forced;
      tiebreakerUsed = true;
    }

    if (!winner) {
      return NextResponse.json(
        { error: "Could not determine a winner", code: "WINNER_ERROR" },
        { status: 500 },
      );
    }

    // 5. Atomic transaction: update cycle, winner, pool, audit
    const result = await prisma.$transaction(async (tx) => {
      // Advance cycle to forge, set winner, fix endAt to total duration
      const updatedCycle = await tx.meridianCycle.update({
        where: { id: cycleId },
        data: {
          phase: "forge",
          winnerPoolId: winner.pool.id,
          lockStatus: "unlocked",
          endAt: new Date(cycle.startAt.getTime() + TOTAL_CYCLE_DURATION_MS),
        },
      });

      // Mark winner
      await tx.cyclePool.update({
        where: { id: winner.id },
        data: { isWinner: true, revealedAt: new Date() },
      });

      // Mark losers
      await tx.cyclePool.updateMany({
        where: { cycleId, id: { not: winner.id } },
        data: { isWinner: false },
      });

      // Open winner pool for commitment
      await tx.pool.update({
        where: { id: winner.pool.id },
        data: {
          status: "filling",
          meridianCycleId: cycleId,
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          eventType: "meridian_winner_revealed",
          description: `Winner revealed: ${winner.pool.name} (${maskPoolId(winner.pool.poolId)}) in cycle ${cycleId}. Votes: ${winner.voteCount}. Tiebreaker: ${tiebreakerUsed ? "Architect's Hand" : "Clear majority"}.`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            cycleId,
            winnerPoolId: winner.pool.id,
            winnerCyclePoolId: winner.id,
            voteCount: winner.voteCount,
            tiebreakerUsed,
            architectHandPoolId: tiebreakerUsed ? architectHandPoolId : null,
            totalPools: cycle.cyclePools.length,
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
        winnerPoolId: result.winnerPoolId
          ? maskPoolId(result.winnerPoolId)
          : null,
        endAt: result.endAt,
      },
      winner: {
        cyclePoolId: winner.id,
        poolId: maskPoolId(winner.pool.poolId),
        name: winner.pool.name,
        verticalId: winner.pool.verticalId,
        country: winner.pool.country,
        voteCount: winner.voteCount,
        tiebreakerUsed,
        architectHandApplied: tiebreakerUsed,
      },
      meta: {
        message: `🔥 FORGED 🔥 — ${winner.pool.name} is the winner.`,
        forgeDuration: PHASE_DURATIONS_MS.forge,
        nextPhase: "complete",
      },
    });
  } catch (error: any) {
    console.error("[MERIDIAN_REVEAL_POST]", error);

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
      {
        error: "The winner could not be revealed",
        code: "MERIDIAN_REVEAL_001",
      },
      { status: 500 },
    );
  }
}

//
// GET /api/meridian/cycle/[id]/reveal
// Public tally. Vote distribution. Cached 30s.
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
          include: {
            pool: {
              select: {
                id: true,
                poolId: true,
                name: true,
                verticalId: true,
                country: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { voteCount: "desc" },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const totalVotes = cycle.cyclePools.reduce((sum, cp) => sum + cp.voteCount, 0);
    const maxVotes = Math.max(...cycle.cyclePools.map((cp) => cp.voteCount), 0);

    const tally = cycle.cyclePools.map((cp) => {
      const votePercent = totalVotes > 0 ? (cp.voteCount / totalVotes) * 100 : 0;
      return {
        id: cp.id,
        cyclePoolId: cp.id,
        poolId: maskPoolId(cp.pool.poolId),
        name: cp.pool.name,
        verticalId: cp.pool.verticalId,
        country: cp.pool.country,
        imageUrl: cp.pool.imageUrl,
        voteCount: cp.voteCount,
        voteWeight: cp.voteWeight,
        votePercent: Math.round(votePercent * 10) / 10,
        isLeading: cp.voteCount === maxVotes && maxVotes > 0,
        isWinner: cp.isWinner,
      };
    });

    const response = NextResponse.json({
      cycle: {
        id: cycle.id,
        continent: cycle.continent,
        phase: cycle.phase,
        winnerPoolId: cycle.winnerPoolId ? maskPoolId(cycle.winnerPoolId) : null,
      },
      tally,
      stats: {
        totalVotes,
        totalPools: cycle.cyclePools.length,
        winnerDeclared: cycle.phase === "forge" || cycle.phase === "complete",
      },
      meta: {
        message:
          cycle.phase === "reveal"
            ? "The votes are being counted."
            : cycle.phase === "forge"
            ? "The winner has been revealed. The Forge is open."
            : "Cycle complete.",
      },
    });

    response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("[MERIDIAN_REVEAL_GET]", error);
    return NextResponse.json(
      { error: "Cannot retrieve reveal state", code: "MERIDIAN_REVEAL_002" },
      { status: 500 }
    );
  }
}