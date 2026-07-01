import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";

/* ============================================================
   GET /api/admin/operations
   Returns all proposals across all halls that have passed,
   are executing, or completed — for the 8th Ledger Operations
   Command Center.
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden — 8th Ledger Operations access only" },
        { status: 403 }
      );
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        status: { in: ["passed", "executing", "completed", "cancelled"] },
      },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            pool: {
              select: {
                verticalId: true,
              },
            },
          },
        },
        proposer: {
          select: {
            displayName: true,
            ledgerId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = proposals.map((p) => {
      const totalVotes = p.voteCountYes + p.voteCountNo;
      const yesPercent = totalVotes > 0 ? ((p.voteCountYes / totalVotes) * 100).toFixed(1) : "0";

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        status: p.status,
        amount: p.amount,
        executionCost: p.executionCost,
        voteWeightYes: p.voteWeightYes,
        voteWeightNo: p.voteWeightNo,
        voteCountYes: p.voteCountYes,
        voteCountNo: p.voteCountNo,
        thresholdPercent: p.thresholdPercent,
        yesPercent: Number(yesPercent),
        endsAt: p.endsAt.toISOString(),
        executedAt: p.executedAt?.toISOString() || null,
        executionResult: p.executionResult,
        hallId: p.hallId,
        hallName: p.hall?.name || "Unknown Hall",
        vertical: p.hall?.pool?.verticalId || "unknown",
        proposer: {
          displayName: p.proposer?.displayName || "Unknown",
          ledgerId: p.proposer?.ledgerId || "Unknown",
        },
        totalVotes,
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      proposals: formatted,
    });
  } catch (error) {
    console.error("[ADMIN OPERATIONS GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch operations" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/admin/operations
   Centralized execution override — start / complete / cancel
   any proposal by ID (primary admin-only emergency control).
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    if (!user.isPrimaryAdmin) {
      return NextResponse.json(
        { success: false, error: "Primary Admin override only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { proposalId, hallId, action, executionResult, executionCost, proofUrls } = body;

    if (!proposalId || !hallId || !action) {
      return NextResponse.json(
        { success: false, error: "proposalId, hallId, and action required" },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, hallId },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (action === "start") {
      if (proposal.status !== "passed") {
        return NextResponse.json(
          { success: false, error: "Must be passed to start" },
          { status: 400 }
        );
      }

      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: "executing",
          startedAt: new Date(),
          executedBy: user.ledgerId,
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "execution_started",
          description: `Primary Admin override: execution started for ${proposalId}`,
          ledgerId: user.ledgerId,
          txHash: `EXEC-START-${proposalId}-${Date.now()}`,
        },
      });

      return NextResponse.json({ success: true, message: "Execution started" });
    }

    if (action === "complete") {
      if (proposal.status !== "executing") {
        return NextResponse.json(
          { success: false, error: "Must be executing to complete" },
          { status: 400 }
        );
      }

      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: "completed",
          executionResult: executionResult || null,
          executionCost: executionCost || null,
          executionProof: proofUrls ? JSON.stringify(proofUrls) : proposal.executionProof,
          completedAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "execution_completed",
          description: `Primary Admin override: execution completed for ${proposalId}`,
          ledgerId: user.ledgerId,
          txHash: `EXEC-COMPLETE-${proposalId}-${Date.now()}`,
        },
      });

      return NextResponse.json({ success: true, message: "Execution completed" });
    }

    if (action === "cancel") {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: "cancelled",
          executionResult: "Cancelled by Primary Admin override",
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "execution_cancelled",
          description: `Primary Admin override: execution cancelled for ${proposalId}`,
          ledgerId: user.ledgerId,
          txHash: `EXEC-CANCEL-${proposalId}-${Date.now()}`,
        },
      });

      return NextResponse.json({ success: true, message: "Execution cancelled" });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Expected: start | complete | cancel" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[ADMIN OPERATIONS POST]", error);
    return NextResponse.json(
      { success: false, error: "Execution override failed" },
      { status: 500 }
    );
  }
}