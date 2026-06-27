// app/api/meridian/cycle/[id]/vote/route.ts
// 8th Ledger — The Vote: One vote per cycle. Sealed forever.
// POST: Cast vote (reveal phase only, auth required, one per user).
// GET: Check current user's vote status.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const PHASE_DURATIONS_MS = {
  hush: 48 * 60 * 60 * 1000,
  unveil: 24 * 60 * 60 * 1000,
  reveal: 24 * 60 * 60 * 1000,
  forge: 6 * 60 * 60 * 1000,
} as const;

const REVEAL_START_OFFSET_MS = PHASE_DURATIONS_MS.hush + PHASE_DURATIONS_MS.unveil;
const REVEAL_END_OFFSET_MS = REVEAL_START_OFFSET_MS + PHASE_DURATIONS_MS.reveal;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function maskPoolId(poolId: string): string {
  if (!poolId || poolId.length < 4) return "POOL-XXXX";
  return `POOL-${poolId.slice(-4).toUpperCase()}`;
}

function isRevealPhaseActive(startAt: Date): boolean {
  const elapsed = Date.now() - startAt.getTime();
  return elapsed >= REVEAL_START_OFFSET_MS && elapsed < REVEAL_END_OFFSET_MS;
}

function getRevealTimeRemaining(startAt: Date): number {
  const elapsed = Date.now() - startAt.getTime();
  return Math.max(0, REVEAL_END_OFFSET_MS - elapsed);
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

// ─────────────────────────────────────────────────────────────
// POST /api/meridian/cycle/[id]/vote
// Cast one vote. Reveal phase only. Atomic. Audited.
// ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const user = await requireAuth(req);

    const { id: cycleId } = await params;
    if (!cycleId || cycleId.length < 10) {
      return NextResponse.json(
        { error: "Invalid cycle ID", code: "VALIDATION_ID" },
        { status: 400 }
      );
    }

    // 2. Body
    const body = await req.json();
    const { cyclePoolId } = body as { cyclePoolId?: string };

    if (!cyclePoolId || typeof cyclePoolId !== "string" || cyclePoolId.length < 10) {
      return NextResponse.json(
        { error: "Valid cycle pool ID required", code: "VALIDATION_POOL_ID" },
        { status: 400 }
      );
    }

    // 3. Fetch cycle + validate phase
    const cycle = await prisma.meridianCycle.findUnique({
      where: { id: cycleId },
      select: {
        id: true,
        phase: true,
        startAt: true,
        lockStatus: true,
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Cycle not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (cycle.phase !== "reveal") {
      return NextResponse.json(
        {
          error: `Voting is locked during the ${cycle.phase} phase.`,
          code: "PHASE_LOCKED",
          currentPhase: cycle.phase,
        },
        { status: 403 }
      );
    }

    if (cycle.lockStatus === "locked") {
      return NextResponse.json(
        { error: "This cycle is locked. Voting is sealed.", code: "CYCLE_LOCKED" },
        { status: 403 }
      );
    }

    // Use computed reveal window, not stored endAt (which is hush-only)
    if (!isRevealPhaseActive(cycle.startAt)) {
      return NextResponse.json(
        {
          error: "Reveal phase has ended. Voting is sealed.",
          code: "REVEAL_ENDED",
          timeRemaining: 0,
        },
        { status: 403 }
      );
    }

    // 4. Validate cyclePool belongs to this cycle
    const cyclePool = await prisma.cyclePool.findFirst({
      where: {
        id: cyclePoolId,
        cycleId,
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

    if (!cyclePool) {
      return NextResponse.json(
        { error: "This contender is not part of the current cycle.", code: "INVALID_POOL" },
        { status: 400 }
      );
    }

    // 5. Duplicate guard
    const existingVote = await prisma.cycleVote.findUnique({
      where: {
        cycleId_userId: {
          cycleId,
          userId: user.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        {
          error: "Your vote is already sealed. One vote per cycle.",
          code: "ALREADY_VOTED",
          votedFor: existingVote.poolId,
        },
        { status: 409 }
      );
    }

    // 6. Atomic vote + counter + audit
    const [vote, updatedCyclePool] = await prisma.$transaction([
      prisma.cycleVote.create({
        data: {
          cycleId,
          poolId: cyclePoolId,
          userId: user.id,
        },
      }),
      prisma.cyclePool.update({
        where: { id: cyclePoolId },
        data: {
          voteCount: { increment: 1 },
          voteWeight: { increment: 1 },
        },
      }),
      prisma.auditLog.create({
        data: {
          eventType: "meridian_vote_cast",
          description: `Vote cast in cycle ${cycleId} for pool ${maskPoolId(cyclePool.pool.poolId)}`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            cycleId,
            cyclePoolId,
            poolId: cyclePool.pool.id,
            poolPoolId: cyclePool.pool.poolId,
          }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      }),
    ]);

    return NextResponse.json(
      {
        vote: {
          id: vote.id,
          cycleId: vote.cycleId,
          poolId: vote.poolId,
          votedAt: vote.votedAt,
        },
        pool: {
          id: cyclePool.pool.id,
          poolId: maskPoolId(cyclePool.pool.poolId),
          name: cyclePool.pool.name,
          verticalId: cyclePool.pool.verticalId,
          country: cyclePool.pool.country,
        },
        stats: {
          newVoteCount: updatedCyclePool.voteCount,
          newVoteWeight: updatedCyclePool.voteWeight,
        },
        meta: {
          message: "Your vote is sealed. The 8th Ledger records it.",
          timeRemaining: getRevealTimeRemaining(cycle.startAt),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[MERIDIAN_VOTE_POST]", error);

    if (error.message?.includes("Unauthorized") || error.message?.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Prisma unique constraint (race condition)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Vote already recorded. Refresh and try again.", code: "CONFLICT" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Your vote could not be recorded", code: "MERIDIAN_VOTE_001" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/meridian/cycle/[id]/vote
// Check if current user has voted. Cached 10s.
// ─────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    const { id: cycleId } = await params;
    if (!cycleId || cycleId.length < 10) {
      return NextResponse.json(
        { error: "Invalid cycle ID", code: "VALIDATION_ID" },
        { status: 400 }
      );
    }

    const vote = await prisma.cycleVote.findUnique({
      where: {
        cycleId_userId: {
          cycleId,
          userId: user.id,
        },
      },
      include: {
        pool: {
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
        },
      },
    });

    if (!vote) {
      const response = NextResponse.json({
        hasVoted: false,
        meta: { message: "You have not yet voted in this cycle." },
      });
      response.headers.set("Cache-Control", "private, max-age=10");
      return response;
    }

    const response = NextResponse.json({
      hasVoted: true,
      vote: {
        id: vote.id,
        poolId: vote.poolId,
        votedAt: vote.votedAt,
      },
      pool: vote.pool
        ? {
            id: vote.pool.pool.id,
            poolId: maskPoolId(vote.pool.pool.poolId),
            name: vote.pool.pool.name,
            verticalId: vote.pool.pool.verticalId,
            country: vote.pool.pool.country,
            imageUrl: vote.pool.pool.imageUrl,
          }
        : null,
      meta: { message: "Your vote is sealed." },
    });

    response.headers.set("Cache-Control", "private, max-age=10");
    return response;
  } catch (error: unknown) {
    console.error("[MERIDIAN_VOTE_GET]", error);

    if (error.message?.includes("Unauthorized") || error.message?.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Cannot retrieve vote status", code: "MERIDIAN_VOTE_002" },
      { status: 500 }
    );
  }
}