// app/api/meridian/cycle/route.ts
// 8th Ledger — The Meridian Cycle: Pool Creation Rotation
// GET: Public. Returns the active cycle with competing pools, phase timer, and continent lock status.
// POST: Admin-only (6-factor fortress). Spawns a new cycle with continent validation and lock logic.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdminRole } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// CONSTANTS & CONFIG
//

const VALID_CONTINENTS = [
  "africa",
  "asia",
  "europe",
  "americas",
  "middle_east",
  "oceania",
] as const;

type Continent = (typeof VALID_CONTINENTS)[number];

const PHASE_DURATIONS_MS = {
  hush: 48 * 60 * 60 * 1000,    // 48 hours — anticipation
  unveil: 24 * 60 * 60 * 1000,   // 24 hours — blurred reveal
  reveal: 24 * 60 * 60 * 1000,   // 24 hours — vote
  forge: 6 * 60 * 60 * 1000,     // 6 hours — winner opens
  complete: 0,
} as const;

const PHASE_ORDER: Array<keyof typeof PHASE_DURATIONS_MS> = [
  "hush",
  "unveil",
  "reveal",
  "forge",
  "complete",
];

const CONTINENT_LOCK_CYCLES = 2; // Winner continent locked for N cycles

//
// HELPERS
//

function isValidContinent(c: string): c is Continent {
  return VALID_CONTINENTS.includes(c as Continent);
}

function getNextPhase(current: string): string | null {
  const idx = PHASE_ORDER.indexOf(current as keyof typeof PHASE_DURATIONS_MS);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

function getPhaseDuration(phase: string): number {
  return PHASE_DURATIONS_MS[phase as keyof typeof PHASE_DURATIONS_MS] ?? 0;
}

function maskPoolId(poolId: string): string {
  if (!poolId || poolId.length < 4) return "POOL-XXXX";
  return `POOL-${poolId.slice(-4).toUpperCase()}`;
}

async function logAudit(props: {
  eventType: string;
  description: string;
  ledgerId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: props.eventType,
        description: props.description,
        ledgerId: props.ledgerId ?? null,
        metadata: props.metadata ? JSON.stringify(props.metadata) : null,
        txHash: `AUD-${randomUUID()}`,
        visibleToPublic: true,
        timestamp: new Date(),
      },
    });
  } catch {
    // Audit failure must not break user flow
  }
}

//
// GET /api/meridian/cycle
// Public. Returns the active (non-complete) cycle. Cached 30s.
//

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeHistory = searchParams.get("history") === "true";
    const historyLimit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));

    // Fetch active cycle (not complete) — the one currently in motion
    const activeCycle = await prisma.meridianCycle.findFirst({
      where: { phase: { not: "complete" } },
      orderBy: { startAt: "desc" },
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
                trueCost: true,
                listedPrice: true,
                hallClass: true,
                status: true,
              },
            },
            cycleVotes: {
              select: { id: true, userId: true, votedAt: true },
            },
          },
          orderBy: { voteCount: "desc" },
        },
      },
    });

    // Build history if requested
    let history = null;
    if (includeHistory) {
      history = await prisma.meridianCycle.findMany({
        where: { phase: "complete" },
        orderBy: { endAt: "desc" },
        take: historyLimit,
        select: {
          id: true,
          continent: true,
          phase: true,
          winnerPoolId: true,
          startAt: true,
          endAt: true,
          createdAt: true,
          cyclePools: {
            select: {
              poolId: true,
              isWinner: true,
              voteCount: true,
              pool: {
                select: { name: true, verticalId: true, country: true },
              },
            },
          },
        },
      });
    }

    // No active cycle — return empty state with next rotation hint
    if (!activeCycle) {
      const lastCycle = await prisma.meridianCycle.findFirst({
        where: { phase: "complete" },
        orderBy: { endAt: "desc" },
        select: { continent: true, endAt: true },
      });

      const response = NextResponse.json({
        cycle: null,
        nextRotation: {
          estimatedStart: lastCycle
            ? new Date(lastCycle.endAt.getTime() + 6 * 60 * 60 * 1000).toISOString()
            : null,
          lastContinent: lastCycle?.continent ?? null,
        },
        history: history?.map((h) => ({
          id: h.id,
          continent: h.continent,
          winnerPoolId: h.winnerPoolId ? maskPoolId(h.winnerPoolId) : null,
          endedAt: h.endAt,
          pools: h.cyclePools.map((cp) => ({
            name: cp.pool.name,
            vertical: cp.pool.verticalId,
            country: cp.pool.country,
            isWinner: cp.isWinner,
            votes: cp.voteCount,
          })),
        })),
        meta: {
          status: "dormant",
          message: "The Meridian rests. The next cycle awakens soon.",
        },
      });

      response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      return response;
    }

    const now = Date.now();
    const endAtMs = activeCycle.endAt.getTime();
    const timeRemaining = Math.max(0, endAtMs - now);
    const timeElapsed = now - activeCycle.startAt.getTime();
    const phaseDuration = getPhaseDuration(activeCycle.phase);

    // Calculate progress % within current phase
    const phaseProgress =
      phaseDuration > 0 ? Math.min(100, Math.round((timeElapsed / phaseDuration) * 100)) : 100;

    // Sanitize pools based on phase
    // Hush: no pools shown (just continent + countdown)
    // Unveil: blurred cards (name scrambled, details hidden)
    // Reveal: full data
    // Forge: winner only
    const sanitizedPools = activeCycle.cyclePools.map((cp) => {
      const base = {
        id: cp.id,
        poolId: maskPoolId(cp.poolId),
        voteCount: cp.voteCount,
        voteWeight: cp.voteWeight,
        isWinner: cp.isWinner,
        revealedAt: cp.revealedAt,
      };

      if (activeCycle.phase === "hush") {
        return {
          ...base,
          state: "locked",
          pool: null,
        };
      }

      if (activeCycle.phase === "unveil") {
        return {
          ...base,
          state: "blurred",
          pool: {
            name: null, // Scrambled on client
            verticalId: cp.pool.verticalId,
            country: cp.pool.country, // Location hint only
            imageUrl: null,
            trueCost: null,
            listedPrice: null,
            hallClass: null,
          },
        };
      }

      if (activeCycle.phase === "reveal" || activeCycle.phase === "forge") {
        return {
          ...base,
          state: "revealed",
          pool: {
            name: cp.pool.name,
            verticalId: cp.pool.verticalId,
            country: cp.pool.country,
            imageUrl: cp.pool.imageUrl,
            trueCost: null, // Never public
            listedPrice: null, // Never public
            hallClass: cp.pool.hallClass,
            status: cp.pool.status,
          },
        };
      }

      return base;
    });

    // Only show vote tally after 12 hours into reveal phase
    const revealPhaseElapsed = activeCycle.phase === "reveal" ? timeElapsed : 0;
    const showTally = revealPhaseElapsed > 12 * 60 * 60 * 1000;

    const totalVotes = activeCycle.cyclePools.reduce((sum, cp) => sum + cp.voteCount, 0);

    const response = NextResponse.json({
      cycle: {
        id: activeCycle.id,
        continent: activeCycle.continent,
        phase: activeCycle.phase,
        nextPhase: getNextPhase(activeCycle.phase),
        startAt: activeCycle.startAt,
        endAt: activeCycle.endAt,
        timeRemaining,
        timeElapsed,
        phaseDuration,
        phaseProgress,
        lockStatus: activeCycle.lockStatus,
        winnerPoolId: activeCycle.winnerPoolId ? maskPoolId(activeCycle.winnerPoolId) : null,
        pools: sanitizedPools,
        stats: {
          totalPools: activeCycle.cyclePools.length,
          totalVotes,
          showTally,
          votesNeededToWin: activeCycle.cyclePools.length > 0
            ? Math.ceil(totalVotes * 0.51) // 51% threshold
            : 0,
        },
      },
      history: history?.map((h) => ({
        id: h.id,
        continent: h.continent,
        winnerPoolId: h.winnerPoolId ? maskPoolId(h.winnerPoolId) : null,
        endedAt: h.endAt,
        pools: h.cyclePools.map((cp) => ({
          name: cp.pool.name,
          vertical: cp.pool.verticalId,
          country: cp.pool.country,
          isWinner: cp.isWinner,
          votes: cp.voteCount,
        })),
      })),
      meta: {
        status: "active",
        continents: VALID_CONTINENTS,
        lockRule: `Winner continent locked for ${CONTINENT_LOCK_CYCLES} cycles`,
      },
    });

    // 30s cache for active cycle — time is ticking, data must feel live
    response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("[MERIDIAN_CYCLE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch Meridian Cycle", code: "MERIDIAN_001" },
      { status: 500 }
    );
  }
}

//
// POST /api/meridian/cycle
// Admin-only. Spawns a new cycle. Validates continent lock. Atomic.
//

export async function POST(req: NextRequest) {
  try {
    // 1. Auth gate — admin only (6-factor verified by middleware)
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

    // 2. Body validation
    const body = await req.json();
    const { continent, poolIds, architectHandPoolId } = body as {
      continent?: string;
      poolIds?: string[];
      architectHandPoolId?: string;
    };

    if (!continent || !isValidContinent(continent)) {
      return NextResponse.json(
        {
          error: `Continent must be one of: ${VALID_CONTINENTS.join(", ")}`,
          code: "VALIDATION_CONTINENT",
        },
        { status: 400 },
      );
    }

    // 3. No overlapping active cycles
    const existingActive = await prisma.meridianCycle.findFirst({
      where: { phase: { not: "complete" } },
      select: { id: true, phase: true, continent: true },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          error: `Cycle already active: ${existingActive.continent} (${existingActive.phase})`,
          code: "CYCLE_ACTIVE",
          activeCycleId: existingActive.id,
        },
        { status: 409 },
      );
    }

    // 4. Continent lock validation
    // Winner continent cannot source next pool for 2 cycles
    const lastCycles = await prisma.meridianCycle.findMany({
      where: { phase: "complete" },
      orderBy: { endAt: "desc" },
      take: CONTINENT_LOCK_CYCLES,
      select: { continent: true, winnerPoolId: true },
    });

    const lockedContinents = lastCycles.map((c) => c.continent);
    if (lockedContinents.includes(continent)) {
      return NextResponse.json(
        {
          error: `${continent} is locked for ${CONTINENT_LOCK_CYCLES} cycles. Choose another continent.`,
          code: "CONTINENT_LOCKED",
          lockedContinents,
          availableContinents: VALID_CONTINENTS.filter(
            (c) => !lockedContinents.includes(c),
          ),
        },
        { status: 423 },
      );
    }

    // 5. Validate poolIds if provided
    let validatedPoolIds: string[] = [];
    if (poolIds && Array.isArray(poolIds) && poolIds.length > 0) {
      if (poolIds.length > 6) {
        return NextResponse.json(
          {
            error: "Max 6 competing pools per cycle",
            code: "VALIDATION_POOL_LIMIT",
          },
          { status: 400 },
        );
      }

      const pools = await prisma.pool.findMany({
        where: { id: { in: poolIds } },
        select: { id: true, status: true, name: true },
      });

      const foundIds = new Set(pools.map((p) => p.id));
      const missing = poolIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: `Pools not found: ${missing.join(", ")}`,
            code: "VALIDATION_POOLS",
          },
          { status: 400 },
        );
      }

      validatedPoolIds = pools.map((p) => p.id);
    }

    // 6. Architect's Hand validation
    let validatedArchitectHandId: string | null = null;
    if (architectHandPoolId) {
      const handPool = await prisma.pool.findUnique({
        where: { id: architectHandPoolId },
        select: { id: true, status: true },
      });
      if (!handPool) {
        return NextResponse.json(
          { error: "Architect's Hand pool not found", code: "VALIDATION_HAND" },
          { status: 400 },
        );
      }
      validatedArchitectHandId = handPool.id;
      // Ensure it's in the pool list
      if (!validatedPoolIds.includes(validatedArchitectHandId)) {
        validatedPoolIds.push(validatedArchitectHandId);
      }
    }

    // 7. Atomic creation
    const now = new Date();
    const hushEnd = new Date(now.getTime() + PHASE_DURATIONS_MS.hush);

    const [cycle] = await prisma.$transaction(async (tx) => {
      // Create the cycle
      const newCycle = await tx.meridianCycle.create({
        data: {
          continent,
          phase: "hush",
          startAt: now,
          endAt: hushEnd,
          lockStatus: "unlocked",
          winnerPoolId: null,
        },
      });

      // Create CyclePool entries if pools provided
      if (validatedPoolIds.length > 0) {
        await tx.cyclePool.createMany({
          data: validatedPoolIds.map((poolId) => ({
            cycleId: newCycle.id,
            poolId,
            voteCount: 0,
            voteWeight: 0,
            isWinner: false,
          })),
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          eventType: "meridian_cycle_created",
          description: `Meridian Cycle created for ${continent} — Hush phase`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            cycleId: newCycle.id,
            continent,
            poolCount: validatedPoolIds.length,
            hasArchitectHand: !!validatedArchitectHandId,
          }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      });

      return [newCycle];
    });

    // 8. Fetch full cycle with pools for response
    const cycleWithPools = await prisma.meridianCycle.findUnique({
      where: { id: cycle.id },
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
                hallClass: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        cycle: {
          id: cycleWithPools!.id,
          continent: cycleWithPools!.continent,
          phase: cycleWithPools!.phase,
          startAt: cycleWithPools!.startAt,
          endAt: cycleWithPools!.endAt,
          timeRemaining: PHASE_DURATIONS_MS.hush,
          pools: cycleWithPools!.cyclePools.map((cp) => ({
            id: cp.id,
            poolId: maskPoolId(cp.poolId),
            name: cp.pool.name,
            verticalId: cp.pool.verticalId,
            country: cp.pool.country,
            voteCount: cp.voteCount,
            isWinner: cp.isWinner,
            // Hush phase: pools are hidden
            state: "locked",
          })),
        },
        meta: {
          createdBy: user.ledgerId,
          phaseDuration: PHASE_DURATIONS_MS.hush,
          nextPhase: "unveil",
          architectHand: validatedArchitectHandId
            ? maskPoolId(validatedArchitectHandId)
            : null,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[MERIDIAN_CYCLE_POST]", error);

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
      { error: "Failed to create Meridian Cycle", code: "MERIDIAN_002" },
      { status: 500 },
    );
  }
}