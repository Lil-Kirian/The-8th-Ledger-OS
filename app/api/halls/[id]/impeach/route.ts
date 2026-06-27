import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership, isPrimaryAdmin } from "@/lib/auth";

const IMPEACHMENT_DURATION_HOURS = 48;

/* ============================================================
   POST /api/halls/[id]/impeach — Vote to impeach Manager/Liaison
   51% capital-weighted = instant removal. Triggers re-election.
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { targetUserId, role, reason, choice } = body;

    // ── Validation ──
    if (!targetUserId || !role || !reason) {
      return NextResponse.json(
        { success: false, error: "targetUserId, role, and reason required" },
        { status: 400 }
      );
    }

    if (role !== "manager" && role !== "liaison") {
      return NextResponse.json(
        { success: false, error: "Role must be 'manager' or 'liaison'" },
        { status: 400 }
      );
    }

    if (typeof reason !== "string" || reason.trim().length < 10 || reason.trim().length > 2000) {
      return NextResponse.json(
        { success: false, error: "Reason required: 10–2000 characters" },
        { status: 400 }
      );
    }

    const voteChoice = choice || "yes";
    if (voteChoice !== "yes" && voteChoice !== "no") {
      return NextResponse.json(
        { success: false, error: "Vote must be 'yes' or 'no'" },
        { status: 400 }
      );
    }

    // ── Self-impeachment block ──
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot impeach yourself" },
        { status: 400 }
      );
    }

    // ── Ownership gate ──
    const ownership = await verifyOwnership(hallId, user.id);
    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 }
      );
    }

    const weight = ownership.percentage || ownership.ownershipPercent || 0;
    if (weight <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid voting weight" },
        { status: 400 }
      );
    }

    // ── Dormancy check ──
    const isDormant = await prisma.dormancyLog.findFirst({
      where: {
        OR: [{ accountId: user.id }, { hallId }],
        type: "account",
        status: { in: ["warning", "critical", "forfeited"] },
      },
    });
    if (isDormant) {
      return NextResponse.json(
        { success: false, error: "Account dormancy active. Voting suspended." },
        { status: 403 }
      );
    }

    // ── Ban check ──
    const isBanned = await prisma.banRecord.findFirst({
      where: {
        hallId,
        targetLedgerId: user.ledgerId,
        status: { in: ["active", "executed"] },
        OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
      },
    });
    if (isBanned) {
      return NextResponse.json(
        { success: false, error: "Banned from this Hall. Cannot vote." },
        { status: 403 }
      );
    }

    // ── Verify target holds the role & not already impeached ──
    const targetRole = await prisma.hallRole.findFirst({
      where: {
        hallId,
        userId: targetUserId,
        role,
        isImpeached: false,
      },
      include: {
        user: { select: { displayName: true, ledgerId: true } },
      },
    });

    if (!targetRole) {
      return NextResponse.json(
        { success: false, error: `Target does not hold active ${role} role` },
        { status: 400 }
      );
    }

    // ── 6-month term guard ──
    const termStart = targetRole.assignedAt || targetRole.createdAt;
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    if (termStart > sixMonthsAgo && !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: `Manager/Liaison term is protected for 6 months. Primary Admin override required.` },
        { status: 403 }
      );
    }

    // ── Hall & pool link ──
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { pool: { select: { id: true } } },
    });
    if (!hall?.pool) {
      return NextResponse.json({ success: false, error: "Hall not linked to pool" }, { status: 500 });
    }

    // ── Find or create impeachment proposal ──
    const proposalType = role === "manager" ? "impeach_manager" : "impeach_liaison";

    let proposal = await prisma.proposal.findFirst({
      where: {
        hallId,
        type: proposalType,
        targetUserId,
        status: { in: ["active", "pending"] },
      },
      include: { votes: { where: { userId: user.id } } },
    });

    if (!proposal) {
      // Check no duplicate active type (from proposals route logic)
      const duplicate = await prisma.proposal.findFirst({
        where: { hallId, type: proposalType, targetUserId, status: "active" },
      });
      if (duplicate) {
        proposal = await prisma.proposal.findFirst({
          where: { id: duplicate.id },
          include: { votes: { where: { userId: user.id } } },
        });
      } else {
        const endsAt = new Date(Date.now() + IMPEACHMENT_DURATION_HOURS * 60 * 60 * 1000);
        proposal = await prisma.proposal.create({
          data: {
            poolId: hall.pool.id,
            hallId,
            proposerId: user.id,
            title: `Impeach ${role === "manager" ? "Manager" : "Liaison"}: ${targetRole.user.displayName}`,
            description: reason.trim(),
            type: proposalType,
            targetUserId,
            thresholdPercent: 51.0,
            status: "active",
            endsAt,
          },
          include: { votes: { where: { userId: user.id } } },
        });
      }
    }

    if (proposal!.votes.length > 0) {
      return NextResponse.json(
        { success: false, error: "You have already voted on this impeachment" },
        { status: 409 }
      );
    }

    if (proposal!.status !== "active" && proposal!.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Impeachment is ${proposal!.status}. Voting closed.` },
        { status: 400 }
      );
    }

    if (proposal!.endsAt < new Date()) {
      await prisma.proposal.update({
        where: { id: proposal!.id },
        data: { status: "rejected" },
      });
      return NextResponse.json(
        { success: false, error: "Impeachment voting period ended. Auto-rejected." },
        { status: 400 }
      );
    }

    // ── Atomic vote + tally + removal ──
    const result = await prisma.$transaction(async (tx) => {
      await tx.vote.create({
        data: {
          proposalId: proposal!.id,
          userId: user.id,
          weight,
          choice: voteChoice,
        },
      });

      const updated = await tx.proposal.update({
        where: { id: proposal!.id },
        data: voteChoice === "yes"
          ? { voteWeightYes: { increment: weight }, voteCountYes: { increment: 1 } }
          : { voteWeightNo: { increment: weight }, voteCountNo: { increment: 1 } },
      });

      const totalWeight = updated.voteWeightYes + updated.voteWeightNo;
      const yesPercent = totalWeight > 0 ? (updated.voteWeightYes / totalWeight) * 100 : 0;
      const noPercent = totalWeight > 0 ? (updated.voteWeightNo / totalWeight) * 100 : 0;
      const thresholdMet = yesPercent >= updated.thresholdPercent;

      const removed = false;
      let reelectionProposal = null;

      if (thresholdMet && updated.status === "active") {
        // ── INSTANT REMOVAL ──
        await tx.hallRole.update({
          where: { id: targetRole.id },
          data: {
            isImpeached: true,
            impeachedAt: new Date(),
            impeachReason: reason.trim(),
          },
        });

        await tx.proposal.update({
          where: { id: proposal!.id },
          data: {
            status: "completed",
            executedAt: new Date(),
            executionResult: `Impeached ${role} by 51% vote (${yesPercent.toFixed(1)}%)`,
          },
        });

        // ── ExecutionLog ──
        await tx.executionLog.create({
          data: {
            proposalId: proposal!.id,
            hallId,
            status: "completed",
            executedBy: user.id,
            description: `${targetRole.user.displayName} impeached as ${role} — ${reason.trim()}`,
          },
        });

        // ── Auto-trigger re-election proposal ──
        const reelectionType = role === "manager" ? "manager_change" : "manager_change";
        const reelectionTitle = role === "manager" ? "Elect New Manager" : "Elect New Liaison";
        const reelectionEndsAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

        reelectionProposal = await tx.proposal.create({
          data: {
            poolId: hall.pool.id,
            hallId,
            proposerId: user.id,
            title: reelectionTitle,
            description: `Re-election triggered after ${role} impeachment. Community nominates candidates.`,
            type: reelectionType,
            thresholdPercent: 51.0,
            status: "active",
            endsAt: reelectionEndsAt,
          },
        });

        // ── Activity log ──
        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "impeach",
            description: `${targetRole.user.displayName} impeached as ${role} with ${yesPercent.toFixed(1)}% approval`,
            metadata: JSON.stringify({
              targetUserId,
              role,
              yesPercent,
              totalWeight,
              reelectionProposalId: reelectionProposal.id,
            }),
          },
        });

        // ── Notify all owners ──
        const owners = await tx.ownership.findMany({
          where: { hallId },
          select: { userId: true },
        });

        if (owners.length > 0) {
          await tx.notification.createMany({
            data: owners.map((o) => ({
              ledgerId: o.userId,
              proposalId: proposal!.id,
              type: "impeachment_executed",
              title: `${role === "manager" ? "Manager" : "Liaison"} Impeached`,
              message: `${targetRole.user.displayName} was removed by community vote (${yesPercent.toFixed(1)}%). Re-election started.`,
              actionUrl: `/halls/${hallId}/governance`,
              createdAt: new Date(),
            })),
            skipDuplicates: true,
          });
        }
      }

      return {
        updated,
        removed,
        yesPercent: Number(yesPercent.toFixed(2)),
        noPercent: Number(noPercent.toFixed(2)),
        totalWeight,
        targetName: targetRole.user.displayName,
        reelectionProposalId: reelectionProposal?.id || null,
      };
    });

    return NextResponse.json({
      success: true,
      impeachment: {
        proposalId: proposal!.id,
        target: result.targetName,
        role,
        voteWeightYes: result.updated.voteWeightYes,
        voteWeightNo: result.updated.voteWeightNo,
        voteCountYes: result.updated.voteCountYes,
        voteCountNo: result.updated.voteCountNo,
        yesPercent: result.yesPercent,
        noPercent: result.noPercent,
        totalWeight: result.totalWeight,
        status: result.removed ? "completed" : "active",
        reelectionProposalId: result.reelectionProposalId,
      },
      message: result.removed
        ? `IMPEACHMENT EXECUTED. ${result.targetName} removed as ${role} with ${result.yesPercent.toFixed(1)}% approval. Re-election proposal #${result.reelectionProposalId} is now active.`
        : `Voted ${voteChoice.toUpperCase()}. Impeachment at ${result.yesPercent.toFixed(1)}% approval. ${result.updated.thresholdPercent}% required for removal.`,
    });
  } catch (error) {
    console.error("[HALL IMPEACH]", error);
    return NextResponse.json(
      { success: false, error: "Impeachment vote failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET /api/halls/[id]/impeach — Active & past impeachments
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;

    const isOwner = await verifyOwnership(hallId, user.id);
    if (!isOwner && !isPrimaryAdmin(user.ledgerId) && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Sovereign access denied" }, { status: 403 });
    }

    const impeachments = await prisma.proposal.findMany({
      where: {
        hallId,
        type: { in: ["impeach_manager", "impeach_liaison"] },
      },
      include: {
        proposer: { select: { displayName: true, ledgerId: true } },
        votes: { select: { userId: true, choice: true, weight: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = impeachments.map((p) => {
      const totalWeight = p.voteWeightYes + p.voteWeightNo;
      const yesPercent = totalWeight > 0 ? (p.voteWeightYes / totalWeight) * 100 : 0;
      const noPercent = totalWeight > 0 ? (p.voteWeightNo / totalWeight) * 100 : 0;

      return {
        id: p.id,
        title: p.title,
        targetUserId: p.targetUserId,
        role: p.type === "impeach_manager" ? "manager" : "liaison",
        status: p.status,
        voteWeightYes: p.voteWeightYes,
        voteWeightNo: p.voteWeightNo,
        voteCountYes: p.voteCountYes,
        voteCountNo: p.voteCountNo,
        yesPercent: Number(yesPercent.toFixed(2)),
        noPercent: Number(noPercent.toFixed(2)),
        totalVotes: p._count.votes,
        endsAt: p.endsAt,
        executedAt: p.executedAt,
        executionResult: p.executionResult,
        proposer: p.proposer,
        myVote: p.votes.find((v) => v.userId === user.id)?.choice || null,
      };
    });

    return NextResponse.json({
      success: true,
      impeachments: enriched,
      activeCount: enriched.filter((i) => i.status === "active").length,
    });
  } catch (error) {
    console.error("[HALL IMPEACH GET]", error);
    return NextResponse.json(
      { success: false, error: "Impeachment registry unreachable" },
      { status: 500 }
    );
  }
}