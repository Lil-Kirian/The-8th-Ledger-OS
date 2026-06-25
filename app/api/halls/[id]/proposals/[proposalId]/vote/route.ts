import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership } from "@/lib/auth";

/* ============================================================
   POST /api/halls/[id]/proposals/[proposalId]/vote
   Capital-weighted. 51% threshold. Binary only. No abstentions.
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId, proposalId } = await params;
    const body = await request.json();
    const { choice } = body;

    if (!choice || (choice !== "yes" && choice !== "no")) {
      return NextResponse.json(
        { success: false, error: "Vote must be 'yes' or 'no'" },
        { status: 400 }
      );
    }

    // ── Verify ownership & get voting weight ──
    const ownership = await verifyOwnership(hallId, user.id);
    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied. Only PAC holders can vote." },
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

    // ── Account dormancy check ──
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
        { success: false, error: "You are banned from this Hall. Cannot vote." },
        { status: 403 }
      );
    }

    // ── Fetch proposal ──
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, hallId },
      include: { proposer: { select: { id: true } } },
    });
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 }
      );
    }

    // ── Self-impeachment block ──
    if (
      (proposal.type === "impeach_manager" || proposal.type === "impeach_liaison") &&
      proposal.proposer.id === user.id
    ) {
      return NextResponse.json(
        { success: false, error: "You cannot vote on your own impeachment proposal" },
        { status: 403 }
      );
    }

    // ── Status & expiry gates ──
    if (proposal.status !== "active" && proposal.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Proposal is ${proposal.status}. Voting closed.` },
        { status: 400 }
      );
    }

    if (proposal.endsAt < new Date()) {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: "rejected" },
      });
      return NextResponse.json(
        { success: false, error: "Voting period has ended. Proposal auto-rejected." },
        { status: 400 }
      );
    }

    // ── Duplicate vote guard ──
    const existingVote = await prisma.vote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId: user.id,
        },
      },
    });
    if (existingVote) {
      return NextResponse.json(
        { success: false, error: "You have already voted on this proposal" },
        { status: 409 }
      );
    }

    // ── Atomic vote + tally ──
    const result = await prisma.$transaction(async (tx) => {
      await tx.vote.create({
        data: {
          proposalId,
          userId: user.id,
          weight,
          choice,
        },
      });

      const updated = await tx.proposal.update({
        where: { id: proposalId },
        data: choice === "yes"
          ? { voteWeightYes: { increment: weight }, voteCountYes: { increment: 1 } }
          : { voteWeightNo: { increment: weight }, voteCountNo: { increment: 1 } },
      });

      const totalWeight = updated.voteWeightYes + updated.voteWeightNo;
      const yesPercent = totalWeight > 0 ? (updated.voteWeightYes / totalWeight) * 100 : 0;
      const noPercent = totalWeight > 0 ? (updated.voteWeightNo / totalWeight) * 100 : 0;
      const thresholdMet = yesPercent >= updated.thresholdPercent;

      let finalStatus = updated.status;

      // ── 51% threshold auto-pass ──
      if (thresholdMet && updated.status === "active") {
        finalStatus = "passed";
        await tx.proposal.update({
          where: { id: proposalId },
          data: { status: "passed" },
        });

        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "vote",
            description: `Proposal "${updated.title}" PASSED with ${yesPercent.toFixed(2)}% approval`,
            metadata: JSON.stringify({ proposalId, yesPercent, totalWeight, choice }),
          },
        });

        const owners = await tx.ownership.findMany({
          where: { hallId },
          select: { userId: true },
        });

        if (owners.length > 0) {
          await tx.notification.createMany({
            data: owners.map((o) => ({
              ledgerId: o.userId,
              proposalId,
              type: "proposal_passed",
              title: "Proposal Passed",
              message: `"${updated.title}" reached ${yesPercent.toFixed(1)}% approval`,
              actionUrl: `/halls/${hallId}/governance`,
              createdAt: new Date(),
            })),
            skipDuplicates: true,
          });
        }
      }

      return {
        updated,
        thresholdMet,
        yesPercent: Number(yesPercent.toFixed(2)),
        noPercent: Number(noPercent.toFixed(2)),
        totalWeight,
        finalStatus,
      };
    });

    return NextResponse.json({
      success: true,
      vote: {
        choice,
        weight,
        ownershipPercent: weight,
      },
      proposal: {
        id: result.updated.id,
        title: result.updated.title,
        voteWeightYes: result.updated.voteWeightYes,
        voteWeightNo: result.updated.voteWeightNo,
        voteCountYes: result.updated.voteCountYes,
        voteCountNo: result.updated.voteCountNo,
        yesPercent: result.yesPercent,
        noPercent: result.noPercent,
        totalWeight: result.totalWeight,
        thresholdPercent: result.updated.thresholdPercent,
        status: result.finalStatus,
        thresholdMet: result.thresholdMet,
      },
      message: result.thresholdMet
        ? `Voted ${choice.toUpperCase()}. Proposal PASSED with ${result.yesPercent.toFixed(1)}% approval. Awaiting 8th Ledger execution.`
        : `Voted ${choice.toUpperCase()}. Proposal at ${result.yesPercent.toFixed(1)}% approval. ${result.updated.thresholdPercent}% required.`,
    });
  } catch (error) {
    console.error("[HALL PROPOSAL VOTE]", error);
    return NextResponse.json(
      { success: false, error: "Vote failed" },
      { status: 500 }
    );
  }
}