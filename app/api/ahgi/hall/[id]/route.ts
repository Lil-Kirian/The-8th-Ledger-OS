import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHallAccess, requireAdmin } from "@/lib/auth";
import {
  calculateAhgi,
  getLatestAhgiSnapshot,
  getAhgiHistory,
  getAhgiStatusMeta,
  canProposeExpansion,
  isMaintenanceAutoApproved,
  canForceClosure,
  shouldActivateDividendSmoothing,
} from "@/lib/ahgi";

/* ============================================================
   GET /api/ahgi/hall/[id]
   Get hall AHGI breakdown with health/growth metrics.
   ============================================================ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;

    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const access = await requireHallAccess(request, hallId);
    if (!access.success && auth.role !== "admin") {
      return NextResponse.json({ error: "Hall access denied" }, { status: 403 });
    }

    // Get latest snapshot or calculate fresh
    let breakdown = await getLatestAhgiSnapshot(hallId);

    if (!breakdown) {
      breakdown = await calculateAhgi(hallId, true);
    }

    // Get history for trend
    const history = await getAhgiHistory(hallId, 6);

    // Get hall context
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: {
        name: true,
        ahgiScore: true,
        sriScore: true,
        hallClass: true,
        status: true,
        closureStatus: true,
        pirDebt: true,
        pool: { select: { verticalId: true, name: true } },
      },
    });

    const meta = getAhgiStatusMeta(breakdown.totalScore);

    return NextResponse.json({
      hall: hall || null,
      ahgi: {
        totalScore: breakdown.totalScore,
        healthScore: breakdown.healthScore,
        growthScore: breakdown.growthScore,
        status: breakdown.status,
        statusLabel: breakdown.statusLabel,
        effect: breakdown.effect,
        healthMetrics: breakdown.healthMetrics,
        growthMetrics: breakdown.growthMetrics,
      },
      history: history.map((h) => ({
        score: h.score,
        healthScore: h.healthScore,
        growthScore: h.growthScore,
        status: h.status,
        recordedAt: h.recordedAt,
      })),
      permissions: {
        canProposeExpansion: canProposeExpansion(breakdown.totalScore),
        maintenanceAutoApproved: isMaintenanceAutoApproved(breakdown.totalScore),
        canForceClosure: canForceClosure(breakdown.totalScore),
        dividendSmoothing: shouldActivateDividendSmoothing(breakdown.totalScore),
      },
    });
  } catch (error) {
    console.error("[AHGI HALL GET]", error);
    return NextResponse.json({ error: "Failed to fetch AHGI", detail: String(error) }, { status: 500 });
  }
}

/* ============================================================
   POST /api/ahgi/hall/[id]
   Recalculate AHGI for a hall. Admin or cron only.
   ============================================================ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;

    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json({ error: "Admin authority required" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { name: true, poolId: true },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Recalculate
    const breakdown = await calculateAhgi(hallId, true);
    const meta = getAhgiStatusMeta(breakdown.totalScore);

    // If critical, trigger closure protocol warning
    if (breakdown.status === "critical") {
      const existingClosure = await prisma.closureProtocol.findFirst({
        where: { hallId, status: "active" },
      });

      if (!existingClosure) {
        await prisma.closureProtocol.create({
          data: {
            hallId,
            triggerMonth: new Date(),
            ahgiAtTrigger: breakdown.totalScore,
            revenueAtTrigger: 0,
            payrollAtTrigger: 0,
            phase: "warning",
            status: "active",
          },
        });

        await prisma.eighthLedgerUpdate.create({
          data: {
            hallId,
            type: "closure_warning",
            title: "⚠️ CRITICAL AHGI — Closure Protocol Activated",
            content: `AHGI dropped to ${breakdown.totalScore} (Critical). Closure Protocol Phase 1 initiated. 60 days to improve or liquidation begins.`,
            amount: 0,
          },
        });
      }
    }

    // Audit
    await prisma.auditEntry.create({
      data: {
        type: "ahgi_recalculated",
        description: `AHGI recalculated for Hall ${hallId}. New score: ${breakdown.totalScore} (${breakdown.statusLabel}). Health: ${breakdown.healthScore}, Growth: ${breakdown.growthScore}.`,
        txHash: `AHGI-${hallId}-${Date.now()}`,
        poolId: hall.poolId || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      hallId,
      hallName: hall.name,
      ahgi: {
        totalScore: breakdown.totalScore,
        healthScore: breakdown.healthScore,
        growthScore: breakdown.growthScore,
        status: breakdown.status,
        statusLabel: breakdown.statusLabel,
        effect: breakdown.effect,
        healthMetrics: breakdown.healthMetrics,
        growthMetrics: breakdown.growthMetrics,
      },
      meta: {
        canProposeExpansion: canProposeExpansion(breakdown.totalScore),
        maintenanceAutoApproved: isMaintenanceAutoApproved(breakdown.totalScore),
        closureTriggered: breakdown.status === "critical",
      },
      recordedAt: breakdown.recordedAt,
    });
  } catch (error) {
    console.error("[AHGI HALL POST]", error);
    return NextResponse.json({ error: "Failed to recalculate AHGI", detail: String(error) }, { status: 500 });
  }
}