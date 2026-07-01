import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { calculatePerformanceScore } from "@/lib/forge";

/* ============================================================
   POST /api/halls/[id]/forge/workers/[workerId]/performance
   Submit performance review. Warden or admin only.
   Body: { score?, metrics?, improvementPlan?, recommendTermination?, notes? }
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  try {
    const { id: hallId, workerId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is Warden or admin
    const isAdmin = isAdminRole(user.role);
    const cabinet = await prisma.executiveCabinet.findUnique({
      where: { hallId },
      select: { wardenId: true },
    });

    const isWarden = cabinet?.wardenId === user.id;

    if (!isAdmin && !isWarden) {
      return NextResponse.json(
        { error: "Warden or admin authority required to review workers" },
        { status: 403 }
      );
    }

    const worker = await prisma.worker.findFirst({
      where: { id: workerId, hallId },
      include: { performances: { orderBy: { reviewedAt: "desc" }, take: 1 } },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      score,
      metrics,
      improvementPlan,
      recommendTermination = false,
      notes,
    } = body;

    // Calculate or validate score
    let finalScore = score;
    if (!finalScore && metrics) {
      finalScore = calculatePerformanceScore(metrics);
    } else if (!finalScore) {
      finalScore = 50; // Neutral default
    }

    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    // Create performance record
    const performance = await prisma.workerPerformance.create({
      data: {
        workerId,
        score: finalScore,
        metrics: metrics ? JSON.stringify(metrics) : null,
        reviewerId: user.id,
        improvementPlan: improvementPlan || null,
        isTerminated: recommendTermination,
      },
    });

    // Update worker's aggregate performance score (rolling average)
    const allScores = await prisma.workerPerformance.aggregate({
      where: { workerId },
      _avg: { score: true },
    });

    await prisma.worker.update({
      where: { id: workerId },
      data: {
        performanceScore: Math.round((allScores._avg.score || 0) * 100) / 100,
        ...(recommendTermination
          ? {
              status: "terminated",
              terminationReason: notes || "Performance review recommendation",
              terminatedAt: new Date(),
            }
          : {}),
      },
    });

    // If termination recommended, create 8th Ledger update
    if (recommendTermination) {
      await prisma.eighthLedgerUpdate.create({
        data: {
          hallId,
          type: "termination",
          title: `Worker Termination — ${worker.workerNumber}`,
          content: `Performance review recommended termination. Score: ${finalScore}/100. Reason: ${notes || "Performance below threshold"}. 8th Ledger will process severance.`,
          amount: worker.salary, // 1 month severance proxy
        },
      });

      // Create proposal for hall vote if not admin override
      if (!isAdmin) {
        await prisma.proposal.create({
          data: {
            hallId,
            poolId: (await prisma.hall.findUnique({ where: { id: hallId }, select: { poolId: true } }))?.poolId || "",
            title: `Terminate Worker ${worker.workerNumber}`,
            description: `Performance review score: ${finalScore}/100. Recommendation: Terminate with 30-day notice. 8th Ledger standard severance applies.`,
            type: "fire",
            targetUserId: workerId,
            status: "pending",
            proposerId: user.id,
            thresholdPercent: 51.0,
            endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Create 8th Ledger update for review
    await prisma.eighthLedgerUpdate.create({
      data: {
        hallId,
        type: "performance_review",
        title: `Performance Review — ${worker.workerNumber}`,
        content: `Score: ${finalScore}/100. ${improvementPlan ? `Improvement plan: ${improvementPlan}` : "Meets expectations."}`,
        amount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      performance: {
        id: performance.id,
        score: finalScore,
        metrics: metrics || null,
        improvementPlan: performance.improvementPlan,
        isTerminated: performance.isTerminated,
        reviewedAt: performance.reviewedAt,
      },
      workerUpdated: {
        id: workerId,
        newPerformanceScore: allScores._avg.score || finalScore,
        status: recommendTermination ? "terminated" : worker.status,
      },
      message: recommendTermination
        ? "Termination recommended. Hall vote required (unless admin override)."
        : "Performance review recorded.",
    });
  } catch (err) {
    console.error("[8th Ledger] Performance POST error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

/* ============================================================
   GET /api/halls/[id]/forge/workers/[workerId]/performance
   Get performance history for a worker.
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

    const hasAccess =
      isAdminRole(user.role) ||
      (await prisma.ownership.findFirst({
        where: { hallId, ledgerId: user.ledgerId, status: "active" },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const performances = await prisma.workerPerformance.findMany({
      where: { workerId },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      performances: performances.map((p) => ({
        id: p.id,
        score: p.score,
        metrics: p.metrics ? JSON.parse(p.metrics) : null,
        reviewerId: p.reviewerId,
        improvementPlan: p.improvementPlan,
        isTerminated: p.isTerminated,
        reviewedAt: p.reviewedAt,
      })),
      count: performances.length,
    });
  } catch (err) {
    console.error("[8th Ledger] Performance GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}