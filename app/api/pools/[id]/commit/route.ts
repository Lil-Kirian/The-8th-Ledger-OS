import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, generatePacToken } from "@/lib/auth";

/* ============================================================
   GET /api/pools/[id]/commit — Check commit eligibility
   V3.2: Ownership is authoritative for PAC.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: poolId } = await params;

    const [pool, ownership] = await Promise.all([
      prisma.pool.findUnique({
        where: { poolId },
        select: {
          poolId: true,
          name: true,
          status: true,
          committed: true,
          target: true,
          participants: true,
          maxParticipants: true,
          minCommitment: true,
          maxCommitment: true,
          hall: { select: { id: true, status: true } },
        },
      }),
      /* ── V3.2: Ownership = authoritative PAC + ownership % ── */
      prisma.ownership.findUnique({
        where: { poolId_userId: { poolId, userId: user.id } },
        select: {
          pacToken: true,
          ownershipPercent: true,
          status: true,
          role: true,
          amountCommitted: true,
          inviteCodesRemaining: true,
          dynamicValue: true,
          accumulatedDividends: true,
          pirDebt: true,
        },
      }),
    ]);

    if (!pool) {
      return NextResponse.json(
        { success: false, error: "Pool not found" },
        { status: 404 },
      );
    }

    const fillPercent =
      pool.target > 0 ? Math.round((pool.committed / pool.target) * 100) : 0;

    return NextResponse.json({
      success: true,
      pool: {
        poolId: pool.poolId,
        name: pool.name,
        status: pool.status,
        committed: pool.committed,
        target: pool.target,
        fillPercent,
        participants: pool.participants,
        maxParticipants: pool.maxParticipants,
        minCommitment: pool.minCommitment,
        maxCommitment: pool.maxCommitment,
        hallStatus: pool.hall?.status,
      },
      ownership: ownership || null,
      canCommit: pool.status === "filling" && !ownership,
      requiresInvite: fillPercent > 80,
    });
  } catch (error) {
    console.error("[COMMIT GET]", error);
    return NextResponse.json(
      { success: false, error: "Status check failed" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/pools/[id]/commit — Sovereign Commitment V3.2
   KYC gate → Invite check (>80%) → PAC → Ownership → Hall unlock
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // ── 1. KYC TIER GATE
    const kycTier = user.kycTier || "visitor";
    if (kycTier === "visitor") {
      return NextResponse.json(
        {
          success: false,
          error: "Sovereign Identity Verification required",
          detail: "Complete KYC to unlock commitments. Visit /kyc",
          requiredTier: "sovereign",
          currentTier: kycTier,
        },
        { status: 403 },
      );
    }

    const { id: poolId } = await params;
    const body = await request.json();
    const { amount, inviteCode } = body;

    if (!amount || typeof amount !== "number" || amount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid commitment amount required (minimum $1)",
        },
        { status: 400 },
      );
    }

    // ── 2. IDEMPOTENCY ─
    const existing = await prisma.ownership.findUnique({
      where: { poolId_userId: { poolId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Already committed to this pool",
          detail: `Committed $${existing.amountCommitted.toLocaleString()}. Your PAC: ${existing.pacToken}.`,
        },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // ── 3. LOCK POOL ─
      const pool = await tx.pool.findUnique({
        where: { poolId },
        include: { hall: true },
      });

      if (!pool) throw new Error("Pool not found in registry");
      if (!pool.hall) throw new Error("Hall not yet initialized for this pool");
      if (pool.status !== "filling")
        throw new Error(`Pool is ${pool.status}. No new commitments accepted.`);
      if (pool.participants >= pool.maxParticipants)
        throw new Error("Pool has reached maximum sovereign capacity");
      if (pool.committed + amount > pool.target) {
        const remaining = pool.target - pool.committed;
        throw new Error(
          `Commitment exceeds pool target. Only $${remaining.toLocaleString()} remaining.`,
        );
      }
      if (user.creditPool < amount) {
        throw new Error(
          `Insufficient credit pool balance. Available: $${user.creditPool.toLocaleString()}. Required: $${amount.toLocaleString()}.`,
        );
      }

      // Min/max per pool
      if (pool.minCommitment && amount < pool.minCommitment) {
        throw new Error(
          `Minimum commitment for this pool is $${pool.minCommitment.toLocaleString()}`,
        );
      }
      if (pool.maxCommitment && amount > pool.maxCommitment) {
        throw new Error(
          `Maximum commitment for this pool is $${pool.maxCommitment.toLocaleString()}`,
        );
      }

      // ── 4. INVITE VALIDATION (>80% full)
      const fillPercent =
        pool.target > 0 ? (pool.committed / pool.target) * 100 : 0;
      const requiresInvite = fillPercent > 80;

      if (requiresInvite) {
        if (!inviteCode || typeof inviteCode !== "string") {
          throw new Error(
            "This pool is >80% filled. A Sovereign Invite code is required from a current member.",
          );
        }

        const validInvite = await tx.hallInvite.findFirst({
          where: {
            hallId: pool.hall.id,
            code: inviteCode,
            isActive: true,
            usedCount: { lt: 3 }, // 3 uses per code
            OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
          },
        });

        if (!validInvite) {
          throw new Error(
            "Invalid, expired, or fully-used invite code. Request a new invite from a member.",
          );
        }

        // Mark used
        await tx.hallInvite.update({
          where: { id: validInvite.id },
          data: { usedCount: { increment: 1 } },
        });

        // ── 5. INVITER BONUS (1% Knot reward)
        if (validInvite.creatorId !== user.id) {
          const inviter = await tx.user.findUnique({
            where: { id: validInvite.creatorId },
            select: { ledgerId: true, displayName: true },
          });
          if (inviter) {
            const bonus = Math.max(1, Math.round(amount * 0.01));
            await tx.referralReward.create({
              data: {
                toLedgerId: inviter.ledgerId,
                fromLedgerId: user.ledgerId,
                fromDisplayName: user.displayName,
                type: "hall_invite",
                amount: bonus,
                rewardPercent: 1,
                rewardAmount: bonus,
                status: "pending",
              },
            });
          }
        }
      }

      // ── 6. DEDUCT CREDIT
      await tx.user.update({
        where: { id: user.id },
        data: {
          creditPool: { decrement: amount },
          totalCommitted: { increment: amount },
          lastActivityAt: new Date(),
        },
      });

      // ── 7. CALCULATE ─
      const newCommitted = pool.committed + Number(amount);
      const newParticipants = pool.participants + 1;
      const ownershipPercent = Number(amount) / Number(pool.target);
      const isFilled = newCommitted >= pool.target;

      // ── 8. OWNERSHIP + PAC (authoritative record) ──
      const pacToken = generatePacToken();
      const ownership = await tx.ownership.create({
        data: {
          poolId: pool.id,
          userId: user.id,
          hallId: pool.hall.id,
          amountCommitted: Number(amount),
          ownershipPercent,
          pacToken,
          status: "active",
          inviteCodesRemaining: 3,
          inviteCodesUsed: 0,
          isWinner: isFilled,
          ledgerId: user.ledgerId,
        },
      });

      // ── 9. UPDATE POOL ─
      const updatedPool = await tx.pool.update({
        where: { id: pool.id },
        data: {
          committed: newCommitted,
          participants: newParticipants,
          status: isFilled ? "filled" : "filling",
          hallUnlocked: isFilled ? true : pool.hallUnlocked,
        },
      });

      // ── 10. HALL UNLOCK: Ghost → Live ──
      if (isFilled && pool.hall) {
        await tx.hall.update({
          where: { id: pool.hall.id },
          data: { status: "live" },
        });

        // First committer → Scribe (legacy role, will be replaced by Executive Cabinet election)
        const first = await tx.ownership.findFirst({
          where: { poolId: pool.id },
          orderBy: { createdAt: "asc" },
        });
        if (first && first.userId === user.id) {
          await tx.hallRole.create({
            data: {
              hallId: pool.hall.id,
              userId: first.userId,
              role: "scribe",
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Hall activity
        await tx.hallActivity.create({
          data: {
            hallId: pool.hall.id,
            type: "join",
            description: `Pool filled. Hall activated LIVE. ${newParticipants} sovereigns entered.`,
          },
        });

        // Expire all unused invites (pool full)
        await tx.hallInvite.updateMany({
          where: { hallId: pool.hall.id, isActive: true },
          data: { isActive: false, expiresAt: new Date() },
        });
      }

      // ── 11. TREASURY LOG
      await tx.treasuryTransaction.create({
        data: {
          type: "commit",
          amount: Number(amount),
          currency: "USD",
          poolId: pool.id,
          ledgerId: user.ledgerId,
          description: `Committed $${amount.toLocaleString()} to ${pool.name}`,
          status: "completed",
          txHash: `COMMIT-${user.ledgerId}-${pool.poolId}-${Date.now()}`,
        },
      });

      // ── 12. AUDIT
      await tx.auditEntry.create({
        data: {
          type: "commit",
          description: `${user.displayName} committed $${amount.toLocaleString()} to ${pool.name}. Ownership: ${(ownershipPercent * 100).toFixed(4)}%. Hall: ${pool.hall.status}→${isFilled ? "live" : pool.hall.status}.`,
          amount,
          txHash: `COMMIT-${user.ledgerId}-${pool.poolId}-${Date.now()}`,
          ledgerId: user.ledgerId,
          poolId: pool.id,
        },
      });

      return { updatedPool, ownership, isFilled, pool, requiresInvite };
    });

    return NextResponse.json({
      success: true,
      pool: {
        poolId: result.pool.poolId,
        name: result.pool.name,
        committed: result.updatedPool.committed,
        target: result.updatedPool.target,
        fillPercent:
          result.updatedPool.target > 0
            ? Math.round(
                (result.updatedPool.committed / result.updatedPool.target) *
                  100,
              )
            : 0,
        status: result.updatedPool.status,
        participants: result.updatedPool.participants,
      },
      ownership: {
        pacToken: result.ownership.pacToken,
        ownershipPercent: result.ownership.ownershipPercent,
        amountCommitted: result.ownership.amountCommitted,
        status: result.ownership.status,
      },
      hall: {
        id: result.pool.hall?.id,
        status: result.isFilled ? "live" : result.pool.hall?.status,
      },
      inviteRequired: result.requiresInvite,
      hallActivated: result.isFilled,
      message: result.isFilled
        ? `Committed $${amount.toLocaleString()}. Pool FILLED. Hall activated LIVE. Your PAC: ${result.ownership.pacToken}`
        : `Committed $${amount.toLocaleString()}. Pool is ${Math.round((result.updatedPool.committed / result.updatedPool.target) * 100)}% to threshold. Your PAC: ${result.ownership.pacToken}`,
    });
  } catch (error: any) {
    console.error("[COMMIT POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Commitment failed" },
      { status: 400 },
    );
  }
}
