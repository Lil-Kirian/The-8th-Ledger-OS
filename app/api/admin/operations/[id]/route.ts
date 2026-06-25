import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   GET /api/admin/operations/[id]
   Returns a single proposal with full execution history,
   vote breakdown, and hall context. Admin only.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            status: true,
            sriScore: true,
            pool: {
              select: {
                poolId: true,
                verticalId: true,
                name: true,
              },
            },
          },
        },
        proposer: {
          select: {
            id: true,
            displayName: true,
            ledgerId: true,
            kycTier: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                displayName: true,
                ledgerId: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        executionLogs: {
          orderBy: { createdAt: "desc" },
        },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 }
      );
    }

    const totalVotes = proposal.voteCountYes + proposal.voteCountNo;
    const yesPercent = totalVotes > 0 ? (proposal.voteCountYes / totalVotes) * 100 : 0;

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        type: proposal.type,
        status: proposal.status,
        amount: proposal.amount,
        executionCost: proposal.executionCost,
        executionResult: proposal.executionResult,
        executionProof: proposal.executionProof,
        executionNotes: proposal.executionNotes,
        executionStatus: proposal.executionStatus,
        stalledReason: proposal.stalledReason,
        voteWeightYes: proposal.voteWeightYes,
        voteWeightNo: proposal.voteWeightNo,
        voteCountYes: proposal.voteCountYes,
        voteCountNo: proposal.voteCountNo,
        thresholdPercent: proposal.thresholdPercent,
        yesPercent: Number(yesPercent.toFixed(2)),
        totalVotes,
        endsAt: proposal.endsAt.toISOString(),
        createdAt: proposal.createdAt.toISOString(),
        executedAt: proposal.executedAt?.toISOString() || null,
        startedAt: proposal.startedAt?.toISOString() || null,
        completedAt: proposal.completedAt?.toISOString() || null,
        passedAt: proposal.passedAt?.toISOString() || null,
        executedBy: proposal.executedBy,
        hall: proposal.hall,
        proposer: proposal.proposer,
        votes: proposal.votes.map((v) => ({
          id: v.id,
          choice: v.choice,
          weight: v.weight,
          createdAt: v.createdAt.toISOString(),
          user: v.user,
        })),
        executionLogs: proposal.executionLogs,
        notifications: proposal.notifications,
      },
    });
  } catch (error) {
    console.error("[ADMIN OPERATIONS DETAIL GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch proposal detail" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH /api/admin/operations/[id]
   Primary Admin can update execution metadata or force-status.
   ============================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !user.isPrimaryAdmin) {
      return NextResponse.json(
        { success: false, error: "Primary Admin access only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      executionResult,
      executionCost,
      executionNotes,
      executionProof,
      stalledReason,
      status,
    } = body;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      select: { id: true, status: true, hallId: true },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (executionResult !== undefined) updateData.executionResult = executionResult;
    if (executionCost !== undefined) updateData.executionCost = executionCost;
    if (executionNotes !== undefined) updateData.executionNotes = executionNotes;
    if (stalledReason !== undefined) updateData.stalledReason = stalledReason;
    if (executionProof !== undefined) {
      updateData.executionProof = Array.isArray(executionProof)
        ? JSON.stringify(executionProof)
        : executionProof;
    }

    if (status && ["passed", "executing", "completed", "cancelled", "stalled"].includes(status)) {
      updateData.status = status;
      if (status === "executing") updateData.startedAt = new Date();
      if (status === "completed") updateData.completedAt = new Date();
    }

    const updated = await prisma.proposal.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditEntry.create({
      data: {
        type: "execution_updated",
        description: `Primary Admin updated proposal ${id} — status: ${status || "unchanged"}`,
        ledgerId: user.ledgerId,
        txHash: `EXEC-UPDATE-${id}-${Date.now()}`,
      },
    });

    return NextResponse.json({
      success: true,
      proposal: updated,
      message: "Proposal execution updated",
    });
  } catch (error) {
    console.error("[ADMIN OPERATIONS DETAIL PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}