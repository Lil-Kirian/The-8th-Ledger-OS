// app/api/halls/[id]/proposals/[proposalId]/execute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   POST /api/halls/[id]/proposals/[proposalId]/execute
   Hall-level execution. Admin only.
   Actions: start | complete | cancel
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proposalId: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 },
      );
    }

    const { id: hallId, proposalId } = await params;

    // Verify user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin only" },
        { status: 403 },
      );
    }

    // Verify proposal belongs to this hall
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, hallId },
      include: { hall: { select: { name: true } } },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found in this hall" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { action, executionResult, executionCost, proofUrls } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action required" },
        { status: 400 },
      );
    }

    /* ===== START ===== */
    if (action === "start") {
      if (proposal.status !== "passed") {
        return NextResponse.json(
          { success: false, error: "Must be passed to start" },
          { status: 400 },
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

      await prisma.executionLog.create({
        data: {
          proposalId,
          hallId,
          status: "in_progress",
          cost: 0,
          executedBy: user.ledgerId,
          proofUrls: "[]",
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "execution_started",
          description: `Execution started for "${proposal.title}" in ${proposal.hall?.name}`,
          ledgerId: user.ledgerId,
          txHash: `EXEC-START-${proposalId}-${Date.now()}`,
        },
      });

      return NextResponse.json({ success: true, message: "Execution started" });
    }

    /* ===== COMPLETE ===== */
    if (action === "complete") {
      if (proposal.status !== "executing") {
        return NextResponse.json(
          { success: false, error: "Must be executing to complete" },
          { status: 400 },
        );
      }

      const costNum = executionCost ? Number(executionCost) : null;

      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: "completed",
          executionResult: executionResult || null,
          executionCost: costNum,
          executionProof: proofUrls
            ? JSON.stringify(proofUrls)
            : proposal.executionProof,
          completedAt: new Date(),
        },
      });

      await prisma.executionLog.updateMany({
        where: { proposalId, hallId },
        data: {
          status: "completed",
          cost: costNum || 0,
          proofUrls: proofUrls ? JSON.stringify(proofUrls) : "[]",
          completedAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "execution_completed",
          description: `Execution completed for "${proposal.title}" in ${proposal.hall?.name}`,
          ledgerId: user.ledgerId,
          txHash: `EXEC-COMPLETE-${proposalId}-${Date.now()}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Execution completed",
      });
    }

    /* ===== CANCEL ===== */
    if (action === "cancel") {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          status: "cancelled",
          completedAt: new Date(),
          executionNotes: "Execution cancelled",
        },
      });

      await prisma.executionLog.updateMany({
        where: { proposalId, hallId },
        data: {
          status: "cancelled",
          completedAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "execution_cancelled",
          description: `Execution cancelled for "${proposal.title}" in ${proposal.hall?.name}`,
          ledgerId: user.ledgerId,
          txHash: `EXEC-CANCEL-${proposalId}-${Date.now()}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Execution cancelled",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Expected: start | complete | cancel",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[HALL PROPOSAL EXECUTE POST]", error);
    return NextResponse.json(
      { success: false, error: "Execution failed" },
      { status: 500 },
    );
  }
}
