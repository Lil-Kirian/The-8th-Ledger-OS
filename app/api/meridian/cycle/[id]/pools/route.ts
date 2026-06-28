// app/api/meridian/cycle/[id]/pools/route.ts
// 8th Ledger — Cycle Pools: Competing contenders in a Meridian Cycle
// GET: Public. Phase-aware visibility (Hush → Unveil → Reveal → Forge).
// POST: Admin-only. Seeds a pool into the cycle. Validates phase + limits.

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
const MAX_POOLS_PER_CYCLE = 5;
const MAX_STANDARD_POOLS = 4;
const TALLY_HIDE_DURATION_MS = 12 * 60 * 60 * 1000;

//
// HELPERS
//

function maskPoolId(poolId: string): string {
  if (!poolId || poolId.length < 4) return "POOL-XXXX";
  return `POOL-${poolId.slice(-4).toUpperCase()}`;
}

function scrambleText(text: string): string {
  if (!text) return "???";
  return text
    .split(" ")
    .map((word) => {
      if (word.length <= 2) return word;
      const first = word[0];
      const last = word[word.length - 1];
      return `${first}${"*".repeat(word.length - 2)}${last}`;
    })
    .join(" ");
}

function getContinentHint(country: string): string {
  const hints: Record<string, string> = {
    nigeria: "West African Coast", ghana: "West African Coast",
    kenya: "East African Plains", tanzania: "East African Plains",
    south_africa: "Southern African Cape", egypt: "North African Delta",
    morocco: "North African Coast", ethiopia: "East African Highlands",
    india: "South Asian Peninsula", china: "East Asian Heartland",
    japan: "East Asian Archipelago", singapore: "Southeast Asian Strait",
    thailand: "Southeast Asian Basin", vietnam: "Southeast Asian Delta",
    indonesia: "Southeast Asian Archipelago", germany: "Central European Plain",
    france: "Western European Coast", uk: "Northwestern European Isles",
    spain: "Southwestern European Peninsula", italy: "Southern European Peninsula",
    poland: "Eastern European Plain", usa: "North American Atlantic",
    canada: "North American North", mexico: "North American South",
    brazil: "South American Atlantic", argentina: "South American South",
    chile: "South American Pacific", colombia: "South American North",
    uae: "Arabian Peninsula", saudi_arabia: "Arabian Peninsula",
    qatar: "Arabian Gulf", kuwait: "Arabian Gulf",
    israel: "Eastern Mediterranean", turkey: "Anatolian Peninsula",
    australia: "Oceanian Continent", new_zealand: "Oceanian Isles",
    fiji: "South Pacific Isles", papua_new_guinea: "Melanesian Coast",
  };
  return hints[country.toLowerCase()] ?? "Unknown Region";
}

function computeTotalTimeRemaining(startAt: Date): number {
  return Math.max(0, startAt.getTime() + TOTAL_CYCLE_DURATION_MS - Date.now());
}

function computeRevealElapsed(startAt: Date): number {
  const elapsed = Date.now() - startAt.getTime();
  const revealStart = PHASE_DURATIONS_MS.hush + PHASE_DURATIONS_MS.unveil;
  return Math.max(0, elapsed - revealStart);
}

//
// GET /api/meridian/cycle/[id]/pools
// Public. Phase-aware visibility. Cached 30s.
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
        { status: 400 },
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
                assetValue: true,
                description: true,
                status: true,
                hallClass: true,
                minCommitment: true,
                maxCommitment: true,
                campaignDuration: true,
                emojiSet: true,
                assetImages: true,
                assetBookValue: true,
              },
            },
            _count: { select: { cycleVotes: true } },
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

    const totalTimeRemaining = computeTotalTimeRemaining(cycle.startAt);
    const totalVotes = cycle.cyclePools.reduce(
      (sum, cp) => sum + cp._count.cycleVotes,
      0,
    );
    const maxVotes = Math.max(
      ...cycle.cyclePools.map((cp) => cp._count.cycleVotes),
      0,
    );

    // ── Hush: nothing revealed
    if (cycle.phase === "hush") {
      const response = NextResponse.json({
        cycle: {
          id: cycle.id,
          continent: cycle.continent,
          phase: cycle.phase,
          startAt: cycle.startAt,
          timeRemaining: totalTimeRemaining,
        },
        pools: [],
        meta: {
          message: "The Hush. The Architect watches. The 8th Ledger waits.",
        },
      });
      response.headers.set(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=60",
      );
      return response;
    }

    // ── Unveil: blurred cards, location hints only
    if (cycle.phase === "unveil") {
      const pools = cycle.cyclePools.map((cp) => ({
        id: cp.id,
        cyclePoolId: cp.id,
        poolId: null,
        name: scrambleText(cp.pool.name),
        verticalId: null,
        country: getContinentHint(cp.pool.country),
        imageUrl: null,
        assetValue: null,
        description: null,
        status: "locked",
        hallClass: null,
        voteCount: null,
        voteWeight: null,
        isWinner: false,
        revealed: false,
      }));

      const response = NextResponse.json({
        cycle: {
          id: cycle.id,
          continent: cycle.continent,
          phase: cycle.phase,
          startAt: cycle.startAt,
          timeRemaining: totalTimeRemaining,
        },
        pools,
        meta: {
          message: "4 pools. 1 winner. 24 hours.",
          poolCount: pools.length,
        },
      });
      response.headers.set(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=60",
      );
      return response;
    }

    // ── Reveal: full data, tally hidden first 12h
    if (cycle.phase === "reveal") {
      const revealElapsed = computeRevealElapsed(cycle.startAt);
      const tallyHidden = revealElapsed < TALLY_HIDE_DURATION_MS;

      const pools = cycle.cyclePools.map((cp) => {
        const voteCount = cp._count.cycleVotes;
        const votePercent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        const isLeading = voteCount === maxVotes && maxVotes > 0;

        return {
          id: cp.id,
          cyclePoolId: cp.id,
          poolId: maskPoolId(cp.pool.poolId),
          name: cp.pool.name,
          verticalId: cp.pool.verticalId,
          country: cp.pool.country,
          imageUrl: cp.pool.imageUrl,
          assetValue: cp.pool.assetValue,
          description: cp.pool.description,
          status: cp.pool.status,
          hallClass: cp.pool.hallClass,
          minCommitment: cp.pool.minCommitment,
          maxCommitment: cp.pool.maxCommitment,
          campaignDuration: cp.pool.campaignDuration,
          emojiSet: cp.pool.emojiSet,
          assetImages: cp.pool.assetImages,
          assetBookValue: cp.pool.assetBookValue,
          voteCount: tallyHidden ? null : voteCount,
          voteWeight: tallyHidden ? null : cp.voteWeight,
          votePercent: tallyHidden ? null : Math.round(votePercent * 10) / 10,
          isLeading: tallyHidden ? null : isLeading,
          isWinner: cp.isWinner,
          revealed: true,
        };
      });

      const response = NextResponse.json({
        cycle: {
          id: cycle.id,
          continent: cycle.continent,
          phase: cycle.phase,
          startAt: cycle.startAt,
          timeRemaining: totalTimeRemaining,
          tallyHidden,
          tallyRevealIn: tallyHidden
            ? TALLY_HIDE_DURATION_MS - revealElapsed
            : 0,
        },
        pools,
        meta: {
          message: tallyHidden
            ? "Votes are sealed. Tally reveals in 12 hours."
            : "The votes are live. Choose wisely.",
          totalVotes: tallyHidden ? null : totalVotes,
        },
      });
      response.headers.set(
        "Cache-Control",
        "public, max-age=30, stale-while-revalidate=60",
      );
      return response;
    }

    // ── Forge / Complete: everything visible ─
    const pools = cycle.cyclePools.map((cp) => {
      const voteCount = cp._count.cycleVotes;
      const votePercent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

      return {
        id: cp.id,
        cyclePoolId: cp.id,
        poolId: maskPoolId(cp.pool.poolId),
        name: cp.pool.name,
        verticalId: cp.pool.verticalId,
        country: cp.pool.country,
        imageUrl: cp.pool.imageUrl,
        assetValue: cp.pool.assetValue,
        description: cp.pool.description,
        status: cp.pool.status,
        hallClass: cp.pool.hallClass,
        minCommitment: cp.pool.minCommitment,
        maxCommitment: cp.pool.maxCommitment,
        campaignDuration: cp.pool.campaignDuration,
        emojiSet: cp.pool.emojiSet,
        assetImages: cp.pool.assetImages,
        assetBookValue: cp.pool.assetBookValue,
        voteCount,
        voteWeight: cp.voteWeight,
        votePercent: Math.round(votePercent * 10) / 10,
        isLeading: voteCount === maxVotes && maxVotes > 0,
        isWinner: cp.isWinner,
        revealed: true,
      };
    });

    const response = NextResponse.json({
      cycle: {
        id: cycle.id,
        continent: cycle.continent,
        phase: cycle.phase,
        startAt: cycle.startAt,
        timeRemaining: totalTimeRemaining,
        winnerPoolId: cycle.winnerPoolId
          ? maskPoolId(cycle.winnerPoolId)
          : null,
      },
      pools,
      meta: {
        message:
          cycle.phase === "forge"
            ? "FORGED. The pool is live."
            : "Cycle complete.",
        totalVotes,
      },
    });
    response.headers.set(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=60",
    );
    return response;
  } catch (error) {
    console.error("[MERIDIAN_POOLS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch competing pools", code: "MERIDIAN_POOLS_001" },
      { status: 500 }
    );
  }
}

//
// POST /api/meridian/cycle/[id]/pools
// Admin-only. Seeds a pool into the cycle. Validates phase + limits.
//

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth gate
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

    // 2. Body validation
    const body = await req.json();
    const { poolId, isWildcard = false } = body as {
      poolId?: string;
      isWildcard?: boolean;
    };

    if (!poolId || typeof poolId !== "string" || poolId.length < 3) {
      return NextResponse.json(
        { error: "Valid pool ID required", code: "VALIDATION_POOL_ID" },
        { status: 400 },
      );
    }

    // 3. Cycle validation
    const cycle = await prisma.meridianCycle.findUnique({
      where: { id: cycleId },
      include: {
        _count: { select: { cyclePools: true } },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (cycle.phase !== "hush" && cycle.phase !== "unveil") {
      return NextResponse.json(
        {
          error: `Cannot add pools in ${cycle.phase} phase. Only Hush or Unveil.`,
          code: "PHASE_LOCKED",
          currentPhase: cycle.phase,
        },
        { status: 409 },
      );
    }

    // 4. Pool validation
    const pool = await prisma.pool.findUnique({
      where: { poolId },
      select: {
        id: true,
        poolId: true,
        name: true,
        verticalId: true,
        country: true,
        status: true,
      },
    });

    if (!pool) {
      return NextResponse.json(
        { error: "Pool not found", code: "POOL_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (pool.status !== "filling" && pool.status !== "filled") {
      return NextResponse.json(
        {
          error: `Pool status '${pool.status}' cannot enter a cycle. Must be filling or filled.`,
          code: "POOL_STATUS_INVALID",
        },
        { status: 400 },
      );
    }

    // 5. Duplicate guard
    const existing = await prisma.cyclePool.findUnique({
      where: { cycleId_poolId: { cycleId, poolId: pool.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Pool already in this cycle", code: "DUPLICATE" },
        { status: 409 },
      );
    }

    // 6. Capacity guard
    const poolCount = cycle._count.cyclePools;

    if (poolCount >= MAX_POOLS_PER_CYCLE) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_POOLS_PER_CYCLE} pools per cycle reached.`,
          code: "CYCLE_FULL",
          maxPools: MAX_POOLS_PER_CYCLE,
        },
        { status: 409 },
      );
    }

    // 7. Wildcard guard
    if (isWildcard) {
      const wildcardCount = await prisma.cyclePool.count({
        where: { cycleId, isWildcard: true },
      });
      if (wildcardCount >= 1) {
        return NextResponse.json(
          {
            error: "Architect's Hand already used in this cycle.",
            code: "WILDCARD_USED",
          },
          { status: 409 },
        );
      }
      if (poolCount >= MAX_STANDARD_POOLS) {
        return NextResponse.json(
          {
            error:
              "Standard pool slots full. Wildcard cannot replace standard slot.",
            code: "STANDARD_SLOTS_FULL",
          },
          { status: 409 },
        );
      }
    }

    // 8. Atomic creation
    const cyclePool = await prisma.cyclePool.create({
      data: {
        cycleId,
        poolId: pool.id,
        voteCount: 0,
        voteWeight: 0,
        isWinner: false,
      },
      include: {
        pool: {
          select: {
            id: true,
            poolId: true,
            name: true,
            verticalId: true,
            country: true,
          },
        },
      },
    });

    // 9. Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "cycle_pool_added",
        description: `Pool ${maskPoolId(pool.poolId)} added to cycle ${cycleId}${isWildcard ? " (Architect's Hand)" : ""}`,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({
          cycleId,
          poolId: pool.id,
          poolPoolId: pool.poolId,
          isWildcard,
          cyclePoolCount: poolCount + 1,
        }),
        txHash: `AUD-${randomUUID()}`,
        visibleToPublic: true,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(
      {
        cyclePool: {
          id: cyclePool.id,
          cycleId: cyclePool.cycleId,
          poolId: maskPoolId(cyclePool.pool.poolId),
          name: cyclePool.pool.name,
          verticalId: cyclePool.pool.verticalId,
          country: cyclePool.pool.country,
          voteCount: 0,
          voteWeight: 0,
          isWinner: false,
        },
        meta: {
          message: isWildcard
            ? "The Architect's Hand places a wildcard."
            : "A contender enters the cycle.",
          poolCount: poolCount + 1,
          maxPools: MAX_POOLS_PER_CYCLE,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[MERIDIAN_POOLS_POST]", error);

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
      { error: "Failed to add pool to cycle", code: "MERIDIAN_POOLS_002" },
      { status: 500 },
    );
  }
}