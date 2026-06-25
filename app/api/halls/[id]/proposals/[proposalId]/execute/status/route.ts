// app/api/halls/[id]/proposals/[proposalId]/execute/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   GET /api/halls/[id]/proposals/[proposalId]/execute/status
   Community read-only view. Ownership-gated.
   Returns execution timeline, proofs, cost, verifications.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();

    const { id: hallId, proposalId } = await params;

    // ── Gate: must be logged in ──
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // ── Gate: must own a PAC in this hall ──
    const ownership = await prisma.ownership.findFirst({
      where: {
        ledgerId: user.ledgerId,
        hallId,
      },
    });

    const isAdmin = user.role === "admin";

    if (!ownership && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Hall ownership required to view execution status" },
        { status: 403 }
      );
    }

    // ── Fetch proposal ──
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, hallId },
      include: {
        hall: {
          select: { name: true, vertical: true },
        },
        proposer: {
          select: { displayName: true, ledgerId: true },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 }
      );
    }

    // ── Fetch execution log ──
    const logs = await prisma.executionLog.findMany({
      where: { proposalId, hallId },
      orderBy: { createdAt: "asc" },
    });

    // ── Build timeline ──
    const timeline = [];
    if (proposal.status !== "cancelled") {
      timeline.push({
        step: "passed",
        label: "Community Passed",
        timestamp: proposal.endsAt.toISOString(),
        completed: true,
      });
      if (proposal.startedAt) {
        timeline.push({
          step: "ledger_review",
          label: "8th Ledger Review",
          timestamp: proposal.startedAt.toISOString(),
          completed: true,
        });
      } else {
        timeline.push({
          step: "ledger_review",
          label: "8th Ledger Review",
          timestamp: null,
          completed: false,
        });
      }
      if (proposal.startedAt) {
        timeline.push({
          step: "in_progress",
          label: "In Progress",
          timestamp: proposal.startedAt.toISOString(),
          completed: proposal.status === "executing" || proposal.status === "completed",
        });
      } else {
        timeline.push({
          step: "in_progress",
          label: "In Progress",
          timestamp: null,
          completed: false,
        });
      }
      if (proposal.completedAt) {
        timeline.push({
          step: "completed",
          label: "Completed",
          timestamp: proposal.completedAt.toISOString(),
          completed: true,
        });
      } else {
        timeline.push({
          step: "completed",
          label: "Completed",
          timestamp: null,
          completed: false,
        });
      }
    } else {
      timeline.push({
        step: "cancelled",
        label: "Cancelled",
        timestamp: proposal.cancelledAt?.toISOString() || null,
        completed: true,
      });
    }

    // ── Parse proofs ──
    let proofs: string[] = [];
    try {
      if (proposal.proofUrls) {
        proofs = JSON.parse(proposal.proofUrls);
      }
    } catch {
      proofs = [];
    }

    // ── Format response ──
    const response = {
      success: true,
      execution: {
        proposalId: proposal.id,
        title: proposal.title,
        description: proposal.description,
        type: proposal.type,
        status: proposal.status,
        hallId: proposal.hallId,
        hallName: proposal.hall?.name,
        vertical: proposal.hall?.vertical,
        proposer: {
          displayName: proposal.proposer?.displayName,
          ledgerId: proposal.proposer?.ledgerId,
        },
        estimatedCost: proposal.amount,
        actualCost: proposal.executionCost,
        executionResult: proposal.executionResult,
        executedBy: proposal.executedBy,
        proofs,
        timeline,
        logs: logs.map((log) => ({
          id: log.id,
          status: log.status,
          cost: log.cost,
          proofUrls: (() => {
            try {
              return log.proofUrls ? JSON.parse(log.proofUrls) : [];
            } catch {
              return [];
            }
          })(),
          executedBy: log.executedBy,
          createdAt: log.createdAt.toISOString(),
          completedAt: log.completedAt?.toISOString() || null,
        })),
        createdAt: proposal.createdAt.toISOString(),
        endsAt: proposal.endsAt.toISOString(),
        startedAt: proposal.startedAt?.toISOString() || null,
        completedAt: proposal.completedAt?.toISOString() || null,
        cancelledAt: proposal.cancelledAt?.toISOString() || null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[EXECUTE STATUS GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch execution status" },
      { status: 500 }
    );
  }
}