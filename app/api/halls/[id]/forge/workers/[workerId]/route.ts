import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getHallClassWorkerRules } from "@/lib/forge";

/* ============================================================
   GET /api/halls/[id]/forge/workers/[workerId]
   Get detailed worker info. Hall never sees salary or personal data.
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

    // Verify hall access
    const hasAccess =
      user.role === "admin" ||
      (await prisma.ownership.findFirst({
        where: { hallId, ledgerId: user.ledgerId, status: "active" },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Hall access denied" }, { status: 403 });
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
          take: 5,
        },
        _count: {
          select: { relayMessages: true },
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found in this hall" }, { status: 404 });
    }

    const rules = getHallClassWorkerRules(hall.hallClass);
    const isAdmin = user.role === "admin";

    // Build response — salary redacted unless admin or Class III with showIndividualSalaries
    const response: Record<string, any> = {
      id: worker.id,
      workerNumber: worker.workerNumber,
      role: worker.role,
      contractMonths: worker.contractMonths,
      hiredAt: worker.hiredAt,
      status: worker.status,
      performanceScore: worker.performanceScore,
      terminationReason: worker.terminationReason,
      terminatedAt: worker.terminatedAt,
      relayMessageCount: worker._count.relayMessages,
      performanceHistory: worker.performances.map((p) => ({
        id: p.id,
        score: p.score,
        metrics: p.metrics ? JSON.parse(p.metrics) : null,
        reviewerId: p.reviewerId,
        improvementPlan: p.improvementPlan,
        isTerminated: p.isTerminated,
        reviewedAt: p.reviewedAt,
      })),
    };

    // Only admin or Class III halls see salary
    if (isAdmin || rules.showIndividualSalaries) {
      response.salary = worker.salary;
      response.totalEstimatedContractValue = worker.salary * worker.contractMonths;
    }

    return NextResponse.json({
      worker: response,
      hallClass: hall.hallClass,
      canMessage: worker.status === "active" || worker.status === "probation",
    });
  } catch (err) {
    console.error("[8th Ledger] Worker detail GET error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}