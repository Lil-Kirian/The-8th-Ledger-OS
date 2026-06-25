import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireHallAccess } from "@/lib/auth";
import { getHallClassWorkerRules } from "@/lib/forge";

/* ============================================================
   GET /api/halls/[id]/forge/workers/[workerId]
   Get single worker details. Hall never sees salary/personal data.
   ============================================================ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  try {
    const { id: hallId, workerId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await requireHallAccess(req, hallId);
    if (!access.success && user.role !== "admin" && user.role !== "founder") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { hallClass: true, name: true },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const worker = await prisma.worker.findFirst({
      where: { id: workerId, hallId },
      include: {
        performances: {
          orderBy: { reviewedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const rules = getHallClassWorkerRules(hall.hallClass);

    const sanitized = {
      id: worker.id,
      workerNumber: worker.workerNumber,
      role: worker.role,
      department: worker.department,
      contractMonths: worker.contractMonths,
      hiredAt: worker.hiredAt,
      status: worker.status,
      performanceScore: worker.performanceScore,
      shiftSchedule: worker.shiftSchedule,
      lastReview: worker.performances[0]
        ? {
            score: worker.performances[0].score,
            reviewedAt: worker.performances[0].reviewedAt,
            reviewerId: worker.performances[0].reviewerId,
            improvementPlan: worker.performances[0].improvementPlan,
          }
        : null,
      // Salary hidden unless Class III with salary visibility enabled
      ...(rules.showIndividualSalaries ? { salary: worker.salary } : {}),
    };

    return NextResponse.json({
      worker: sanitized,
      hallClass: hall.hallClass,
      showSalaries: rules.showIndividualSalaries,
    });
  } catch (err) {
    console.error("[8th Ledger] Worker GET error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

/* ============================================================
   PATCH /api/halls/[id]/forge/workers/[workerId]
   Update worker status or request performance review.
   Body: { action: "review" | "status", ... }
   ============================================================ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  try {
    const { id: hallId, workerId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownership = await prisma.ownership.findFirst({
      where: { hallId, ledgerId: user.ledgerId, status: "active" },
      include: { pool: { select: { id: true, poolId: true } } },
    });

    if (!ownership && user.role !== "admin" && user.role !== "founder") {
      return NextResponse.json({ error: "Active hall ownership required" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { hallClass: true, name: true },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const worker = await prisma.worker.findFirst({
      where: { id: workerId, hallId },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "review") {
      // Create performance review
      const { score, metrics, improvementPlan } = body;
      if (typeof score !== "number" || score < 0 || score > 100) {
        return NextResponse.json({ error: "Score must be 0-100" }, { status: 400 });
      }

      const review = await prisma.workerPerformance.create({
        data: {
          workerId,
          score,
          metrics: metrics || null,
          improvementPlan: improvementPlan || null,
          reviewerId: user.id,
        },
      });

      // Update worker performance score
      await prisma.worker.update({
        where: { id: workerId },
        data: { performanceScore: score },
      });

      // Audit
      await prisma.auditEntry.create({
        data: {
          type: "worker_review",
          description: `Performance review for Worker ${worker.workerNumber} in Hall ${hallId}. Score: ${score}. Reviewer: ${user.ledgerId}`,
          txHash: `REV-${review.id}`,
          poolId: ownership?.poolId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Performance review recorded.",
        review: {
          id: review.id,
          score: review.score,
          reviewedAt: review.reviewedAt,
        },
      });
    }

    if (action === "status") {
      const { status, terminationReason } = body;
      if (!["active", "suspended", "terminated"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const updateData: any = { status };
      if (status === "terminated") {
        updateData.terminatedAt = new Date();
        updateData.terminationReason = terminationReason || "Hall proposal";
      }

      const updated = await prisma.worker.update({
        where: { id: workerId },
        data: updateData,
      });

      // Audit
      await prisma.auditEntry.create({
        data: {
          type: "worker_status_change",
          description: `Worker ${worker.workerNumber} status changed to ${status} in Hall ${hallId}. By: ${user.ledgerId}`,
          txHash: `STA-${updated.id}-${Date.now()}`,
          poolId: ownership?.poolId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Worker status updated to ${status}.`,
        worker: {
          id: updated.id,
          status: updated.status,
          terminatedAt: updated.terminatedAt,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'review' or 'status'." }, { status: 400 });
  } catch (err) {
    console.error("[8th Ledger] Worker PATCH error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

/* ============================================================
   DELETE /api/halls/[id]/forge/workers/[workerId]
   Propose worker termination. Creates a hall vote proposal.
   ============================================================ */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  try {
    const { id: hallId, workerId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownership = await prisma.ownership.findFirst({
      where: { hallId, ledgerId: user.ledgerId, status: "active" },
      include: { pool: { select: { id: true, poolId: true } } },
    });

    if (!ownership && user.role !== "admin" && user.role !== "founder") {
      return NextResponse.json({ error: "Active hall ownership required" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { hallClass: true, name: true },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const worker = await prisma.worker.findFirst({
      where: { id: workerId, hallId },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    if (worker.status === "terminated") {
      return NextResponse.json({ error: "Worker already terminated" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { reason, severanceOverride } = body;

    // Create termination proposal
    const proposal = await prisma.proposal.create({
      data: {
        hallId,
        poolId: ownership?.poolId,
        title: `Terminate Worker ${worker.workerNumber} — ${worker.role}`,
        description: `Proposal to terminate ${worker.role} (Worker ID: ${worker.workerNumber}). Reason: ${reason || "Performance or operational needs"}. ${severanceOverride ? `Severance override: $${severanceOverride}.` : ""} 8th Ledger will execute payroll and compliance upon approval.`,
        type: "fire",
        amount: severanceOverride || 0,
        status: "pending",
        proposerId: user.id,
        thresholdPercent: 51.00,
        endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    // Sovereign stream post
    await prisma.sovereignStreamPost.create({
      data: {
        hallId,
        type: "PROPOSAL",
        title: `Termination Proposal: ${worker.workerNumber}`,
        content: `Motion to terminate ${worker.role}. Reason: ${reason || "Not specified"}.`,
        authorId: user.id,
        proposalId: proposal.id,
      },
    });

    // Audit
    await prisma.auditEntry.create({
      data: {
        type: "fire_proposed",
        description: `Termination proposal for Worker ${worker.workerNumber} in Hall ${hallId}. Role: ${worker.role}. Proposed by: ${user.ledgerId}`,
        amount: severanceOverride || 0,
        txHash: `FIRE-${proposal.id}`,
        poolId: ownership?.poolId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Termination proposal created. Hall must vote 51% to approve.",
      proposal: {
        id: proposal.id,
        title: proposal.title,
        type: proposal.type,
        status: proposal.status,
        endsAt: proposal.endsAt,
      },
    });
  } catch (err) {
    console.error("[8th Ledger] Worker DELETE error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}