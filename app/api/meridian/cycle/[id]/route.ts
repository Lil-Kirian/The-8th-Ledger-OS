// app/api/meridian/cycle/[id]/route.ts
// 8th Ledger — Cycle Detail: Deep inspection of a single Meridian Cycle
// Phase-aware data masking. Vote telemetry. Time math.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

//
// CONSTANTS
//

const PHASE_DURATIONS_MS = {
  hush: 48 * 60 * 60 * 1000,    // 48h
  unveil: 24 * 60 * 60 * 1000,   // 24h
  reveal: 24 * 60 * 60 * 1000,   // 24h
  forge: 6 * 60 * 60 * 1000,     // 6h
} as const;

const PHASE_ORDER = ["hush", "unveil", "reveal", "forge", "complete"] as const;
const TOTAL_CYCLE_DURATION_MS = Object.values(PHASE_DURATIONS_MS).reduce((a, b) => a + b, 0);

//
// HELPERS
//

function getNextPhase(current: string): string | null {
  const idx = PHASE_ORDER.indexOf(current as typeof PHASE_ORDER[number]);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

function maskPoolId(poolId: string): string {
  if (!poolId || poolId.length < 4) return "POOL-XXXX";
  return `POOL-${poolId.slice(-4).toUpperCase()}`;
}

function computePhaseTime(phase: string, elapsedMs: number): {
  phaseTimeRemaining: number;
  phaseProgress: number;
  isTallyVisible: boolean;
} {
  const hushEnd = PHASE_DURATIONS_MS.hush;
  const unveilEnd = hushEnd + PHASE_DURATIONS_MS.unveil;
  const revealEnd = unveilEnd + PHASE_DURATIONS_MS.reveal;

  let phaseTimeRemaining = 0;
  let phaseProgress = 0;
  let isTallyVisible = false;

  switch (phase) {
    case "hush":
      phaseTimeRemaining = Math.max(0, hushEnd - elapsedMs);
      phaseProgress = Math.min(100, (elapsedMs / PHASE_DURATIONS_MS.hush) * 100);
      break;
    case "unveil":
      phaseTimeRemaining = Math.max(0, unveilEnd - elapsedMs);
      phaseProgress = Math.min(100, ((elapsedMs - hushEnd) / PHASE_DURATIONS_MS.unveil) * 100);
      break;
    case "reveal":
      phaseTimeRemaining = Math.max(0, revealEnd - elapsedMs);
      phaseProgress = Math.min(100, ((elapsedMs - unveilEnd) / PHASE_DURATIONS_MS.reveal) * 100);
      isTallyVisible = (elapsedMs - unveilEnd) >= 12 * 60 * 60 * 1000;
      break;
    case "forge":
      phaseTimeRemaining = Math.max(0, TOTAL_CYCLE_DURATION_MS - elapsedMs);
      phaseProgress = Math.min(100, ((elapsedMs - revealEnd) / PHASE_DURATIONS_MS.forge) * 100);
      isTallyVisible = true;
      break;
    case "complete":
      phaseTimeRemaining = 0;
      phaseProgress = 100;
      isTallyVisible = true;
      break;
  }

  return { phaseTimeRemaining, phaseProgress, isTallyVisible };
}

//
// GET /api/meridian/cycle/[id]
// Public. Phase-aware masking. Cached 30s.
//

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 10) {
      return NextResponse.json(
        { error: "Invalid cycle ID", code: "VALIDATION_ID" },
        { status: 400 }
      );
    }

    const cycle = await prisma.meridianCycle.findUnique({
      where: { id },
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
                assetValue: true,
                status: true,
                hallClass: true,
                minCommitment: true,
                maxCommitment: true,
                emojiSet: true,
              },
            },
          },
          orderBy: { voteCount: "desc" },
        },
        _count: { select: { cycleVotes: true } },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const now = Date.now();
    const startMs = cycle.startAt.getTime();
    const elapsedMs = now - startMs;
    const totalTimeRemaining = Math.max(0, startMs + TOTAL_CYCLE_DURATION_MS - now);

    // Use stored phase as source of truth, compute time math
    const phaseTime = computePhaseTime(cycle.phase, elapsedMs);

    const totalVotes = cycle._count.cycleVotes;
    const maxVotes = Math.max(...cycle.cyclePools.map((cp) => cp.voteCount), 0);

    // Sanitize pools based on stored phase
    const pools = cycle.cyclePools.map((cp) => {
      const base = {
        id: cp.id,
        cyclePoolId: cp.id,
        poolId: maskPoolId(cp.poolId),
        isWinner: cp.isWinner,
        revealedAt: cp.revealedAt,
      };

      if (cycle.phase === "hush") {
        return {
          ...base,
          state: "locked" as const,
          pool: null,
          votes: null,
        };
      }

      if (cycle.phase === "unveil") {
        return {
          ...base,
          state: "blurred" as const,
          pool: {
            name: null,
            verticalId: cp.pool.verticalId,
            country: cp.pool.country,
            imageUrl: null,
            assetValue: null,
            hallClass: null,
            minCommitment: null,
            maxCommitment: null,
            emojiSet: null,
          },
          votes: null,
        };
      }

      if (cycle.phase === "reveal") {
        const votePercent = totalVotes > 0 ? (cp.voteCount / totalVotes) * 100 : 0;
        const isLeading = cp.voteCount === maxVotes && maxVotes > 0;

        return {
          ...base,
          state: "revealed" as const,
          pool: {
            name: cp.pool.name,
            verticalId: cp.pool.verticalId,
            country: cp.pool.country,
            imageUrl: cp.pool.imageUrl,
            assetValue: cp.pool.assetValue,
            hallClass: cp.pool.hallClass,
            minCommitment: cp.pool.minCommitment,
            maxCommitment: cp.pool.maxCommitment,
            emojiSet: cp.pool.emojiSet,
          },
          votes: phaseTime.isTallyVisible
            ? {
                count: cp.voteCount,
                weight: cp.voteWeight,
                percent: Math.round(votePercent * 10) / 10,
                isLeading,
              }
            : null,
        };
      }

      // forge / complete
      return {
        ...base,
        state: "forged" as const,
        pool: {
          name: cp.pool.name,
          verticalId: cp.pool.verticalId,
          country: cp.pool.country,
          imageUrl: cp.pool.imageUrl,
          assetValue: cp.pool.assetValue,
          hallClass: cp.pool.hallClass,
          minCommitment: cp.pool.minCommitment,
          maxCommitment: cp.pool.maxCommitment,
          emojiSet: cp.pool.emojiSet,
        },
        votes: {
          count: cp.voteCount,
          weight: cp.voteWeight,
          percent: totalVotes > 0 ? Math.round((cp.voteCount / totalVotes) * 1000) / 10 : 0,
          isLeading: cp.voteCount === maxVotes && maxVotes > 0,
        },
      };
    });

    const winnerPool = cycle.winnerPoolId
      ? cycle.cyclePools.find((cp) => cp.poolId === cycle.winnerPoolId)
      : null;

    const response = NextResponse.json({
      cycle: {
        id: cycle.id,
        continent: cycle.continent,
        phase: cycle.phase,
        nextPhase: getNextPhase(cycle.phase),
        startAt: cycle.startAt,
        endAt: new Date(startMs + TOTAL_CYCLE_DURATION_MS),
        timeRemaining: {
          phase: phaseTime.phaseTimeRemaining,
          total: totalTimeRemaining,
        },
        phaseProgress: phaseTime.phaseProgress,
        isTallyVisible: phaseTime.isTallyVisible,
        lockStatus: cycle.lockStatus,
        winnerPoolId: cycle.winnerPoolId ? maskPoolId(cycle.winnerPoolId) : null,
        winnerPool: winnerPool
          ? {
              name: winnerPool.pool.name,
              verticalId: winnerPool.pool.verticalId,
              country: winnerPool.pool.country,
            }
          : null,
        totalPools: cycle.cyclePools.length,
        totalVotes,
        pools,
      },
      meta: {
        totalCycleDuration: TOTAL_CYCLE_DURATION_MS,
        phaseDurations: PHASE_DURATIONS_MS,
      },
    });

    response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("[MERIDIAN_CYCLE_DETAIL]", error);
    return NextResponse.json(
      { error: "Failed to fetch cycle detail", code: "MERIDIAN_003" },
      { status: 500 }
    );
  }
}