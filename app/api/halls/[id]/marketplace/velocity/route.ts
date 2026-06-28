// app/api/halls/[id]/marketplace/velocity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";

const THRESHOLDS = {
  warning: 3, // 3 months no sales = warning
  takeover: 6, // 6 months = community split drops to 50%
  reclamation: 24, // 24 months = asset eligible for reclamation
};

/* ============================================================
   GET — Inventory sales velocity for hall
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const claims = await getSessionClaims(request);
    const isFounder = isFounderSync(claims) || user.role === "founder";

    const { id: hallId } = await params;

    // Gate: hall owner or founder/admin
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id, status: "active" },
    });
    if (!ownership && !isFounder) {
      return NextResponse.json(
        { success: false, error: "Hall access required" },
        { status: 403 },
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: {
          select: {
            listedPrice: true,
            trueCost: true,
            verticalId: true,
            name: true,
          },
        },
        _count: { select: { ownerships: true, inventoryItems: true } },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const twentyFourMonthsAgo = new Date(
      now.getTime() - 730 * 24 * 60 * 60 * 1000,
    );

    const [
      totalItems,
      totalCompleted,
      completedLast3Mo,
      completedLast6Mo,
      completedLast12Mo,
      completedLast24Mo,
      lastSale,
      revenueAgg,
    ] = await prisma.$transaction([
      prisma.inventoryItem.count({ where: { hallId } }),
      prisma.inventoryOrder.count({
        where: { inventory: { hallId }, status: "completed" },
      }),
      prisma.inventoryOrder.count({
        where: {
          inventory: { hallId },
          status: "completed",
          completedAt: { gte: threeMonthsAgo },
        },
      }),
      prisma.inventoryOrder.count({
        where: {
          inventory: { hallId },
          status: "completed",
          completedAt: { gte: sixMonthsAgo },
        },
      }),
      prisma.inventoryOrder.count({
        where: {
          inventory: { hallId },
          status: "completed",
          completedAt: { gte: twelveMonthsAgo },
        },
      }),
      prisma.inventoryOrder.count({
        where: {
          inventory: { hallId },
          status: "completed",
          completedAt: { gte: twentyFourMonthsAgo },
        },
      }),
      prisma.inventoryOrder.findFirst({
        where: { inventory: { hallId }, status: "completed" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),
      prisma.inventoryOrder.aggregate({
        where: { inventory: { hallId }, status: "completed" },
        _sum: { amount: true, netToHall: true },
      }),
    ]);

    const activeItems = await prisma.inventoryItem.count({
      where: { hallId, status: "active" },
    });

    const avgMonthlySales3mo = completedLast3Mo / 3;
    const avgMonthlySales6mo = completedLast6Mo / 6;
    const avgMonthlySales12mo = completedLast12Mo / 12;
    const avgMonthlySales24mo = completedLast24Mo / 24;

    const bestPace = Math.max(
      avgMonthlySales3mo,
      avgMonthlySales6mo,
      avgMonthlySales12mo,
    );
    const conservativePace =
      avgMonthlySales6mo > 0 ? avgMonthlySales6mo : avgMonthlySales12mo;

    // Days to clear active inventory at current pace
    let daysToClear: number | null = null;
    let monthsToClear: number | null = null;

    if (activeItems === 0) {
      daysToClear = 0;
      monthsToClear = 0;
    } else if (conservativePace > 0) {
      daysToClear = Math.round(activeItems / (conservativePace / 30));
      monthsToClear = Math.round(daysToClear / 30);
    } else {
      daysToClear = null;
      monthsToClear = null;
    }

    let velocityStatus: "healthy" | "warning" | "takeover" | "reclamation" =
      "healthy";
    let reviewFlagged = false;

    if (
      monthsToClear === null ||
      (monthsToClear !== null && monthsToClear > THRESHOLDS.reclamation)
    ) {
      velocityStatus = "reclamation";
      reviewFlagged = true;
    } else if (monthsToClear !== null && monthsToClear > THRESHOLDS.takeover) {
      velocityStatus = "takeover";
      reviewFlagged = true;
    } else if (monthsToClear !== null && monthsToClear > THRESHOLDS.warning) {
      velocityStatus = "warning";
    }

    const daysSinceLastSale = lastSale?.completedAt
      ? Math.floor(
          (now.getTime() - new Date(lastSale.completedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const totalRevenue = Number(revenueAgg._sum.amount || 0);
    const totalNetToHall = Number(revenueAgg._sum.netToHall || 0);

    // Check for existing review flag
    const existingReview = await prisma.hallActivity.findFirst({
      where: {
        hallId,
        type: { in: ["inventory_review", "takeover", "reclamation"] },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      velocity: {
        hallId,
        hallName: hall.name,
        verticalId: hall.pool?.verticalId,
        totalItems,
        activeItems,
        totalCompletedOrders: totalCompleted,
        completedLast3Months: completedLast3Mo,
        completedLast6Months: completedLast6Mo,
        completedLast12Months: completedLast12Mo,
        completedLast24Months: completedLast24Mo,
        avgMonthlySales: Number(conservativePace.toFixed(2)),
        daysToClear,
        monthsToClear:
          monthsToClear !== null ? Number(monthsToClear.toFixed(1)) : null,
        daysSinceLastSale,
        velocityStatus,
        reviewFlagged: reviewFlagged || !!existingReview,
        thresholds: THRESHOLDS,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalNetToHall: Number(totalNetToHall.toFixed(2)),
        message:
          velocityStatus === "reclamation"
            ? "CRITICAL: Inventory stagnant for 24+ months. Reclamation protocol recommended."
            : velocityStatus === "takeover"
              ? "8th Ledger takeover flagged. Sales velocity below 6-month threshold. Community split drops to 50%."
              : velocityStatus === "warning"
                ? `WARNING: At current pace, inventory clears in ${monthsToClear !== null ? Number(monthsToClear.toFixed(1)) : "∞"} months. Consider marketing.`
                : activeItems === 0
                  ? "No active inventory. Add products to generate sales."
                  : `Healthy: Inventory clears in ~${monthsToClear !== null ? Number(monthsToClear.toFixed(1)) : "∞"} months.`,
      },
    });
  } catch (err: any) {
    console.error("[HALL_VELOCITY_GET]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Velocity tracker unreachable" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST — Admin velocity actions
   flag_review | clear_review | trigger_takeover | force_reclamation
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const claims = await getSessionClaims(request);
    const isFounder = isFounderSync(claims) || user.role === "founder";

    if (!isFounder && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "8th Ledger authority required" },
        { status: 403 },
      );
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { action, reason } = body;

    const validActions = [
      "flag_review",
      "clear_review",
      "trigger_takeover",
      "force_reclamation",
    ];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: `action must be one of: ${validActions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { id: true, name: true, poolId: true } },
        ownerships: {
          where: { status: "active" },
          select: { userId: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    // Fetch owner ledgerIds for notifications
    const ownerUsers = await prisma.user.findMany({
      where: { id: { in: hall.ownerships.map((o) => o.userId) } },
      select: { id: true, ledgerId: true },
    });
    const ownerLedgerIds = ownerUsers.map((u) => u.ledgerId).filter(Boolean);

    // ── FLAG REVIEW ──
    if (action === "flag_review") {
      await prisma.$transaction(async (tx) => {
        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "inventory_review",
            description: `8th Ledger flagged hall for inventory sales review. ${reason || "Sales velocity below threshold."}`,
            metadata: JSON.stringify({
              action: "flag_review",
              reason: reason || "Sales velocity below threshold",
            }),
          },
        });

        await tx.auditLog.create({
          data: {
            eventType: "inventory_velocity_review",
            description: `8th Ledger review flagged: ${hall.pool?.name || hallId}. ${reason || ""}`,
            poolId: hall.pool?.poolId,
            ledgerId: user.ledgerId,
            txHash: `REVIEW-${hallId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });
      });

      if (ownerLedgerIds.length > 0) {
        await prisma.notification.createMany({
          data: ownerLedgerIds.map((ledgerId) => ({
            ledgerId,
            poolId: hall.pool?.id,
            type: "inventory_review",
            title: "Inventory Review Flagged",
            message: `8th Ledger has flagged ${hall.name} for inventory sales review. ${reason || "Sales velocity concern."}`,
            actionUrl: `/halls/${hallId}/marketplace`,
            read: false,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        review: {
          hallId,
          status: "flagged",
        },
        message: `8th Ledger review flagged for ${hall.name}. Hall owners notified.`,
      });
    }

    // ── CLEAR REVIEW ──
    if (action === "clear_review") {
      await prisma.$transaction(async (tx) => {
        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "inventory_review",
            description: `8th Ledger cleared inventory review flag. Sales velocity recovered.`,
            metadata: JSON.stringify({
              action: "clear_review",
              reason: reason || "Sales velocity recovered",
            }),
          },
        });

        await tx.auditLog.create({
          data: {
            eventType: "inventory_velocity_review_cleared",
            description: `8th Ledger review cleared: ${hall.pool?.name || hallId}. ${reason || ""}`,
            poolId: hall.pool?.poolId,
            ledgerId: user.ledgerId,
            txHash: `REVIEW-CLEAR-${hallId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });
      });

      if (ownerLedgerIds.length > 0) {
        await prisma.notification.createMany({
          data: ownerLedgerIds.map((ledgerId) => ({
            ledgerId,
            poolId: hall.pool?.id,
            type: "inventory_review_cleared",
            title: "Review Cleared",
            message: `8th Ledger has cleared the inventory review flag for ${hall.name}.`,
            actionUrl: `/halls/${hallId}/marketplace`,
            read: false,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        cleared: { hallId },
        message: `Inventory review flag cleared for ${hall.name}.`,
      });
    }

    // ── TRIGGER TAKEOVER ──
    if (action === "trigger_takeover") {
      await prisma.$transaction(async (tx) => {
        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "takeover",
            description: `8th Ledger triggered takeover. Community revenue split reduced to 50%. ${reason || "6-month inventory stagnation."}`,
            metadata: JSON.stringify({
              action: "trigger_takeover",
              reason: reason || "6-month inventory stagnation",
            }),
          },
        });

        await tx.auditLog.create({
          data: {
            eventType: "inventory_takeover_triggered",
            description: `Takeover triggered: ${hall.pool?.name || hallId}. Community split drops to 50%. ${reason || ""}`,
            poolId: hall.pool?.poolId,
            ledgerId: user.ledgerId,
            txHash: `TAKEOVER-${hallId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });
      });

      if (ownerLedgerIds.length > 0) {
        await prisma.notification.createMany({
          data: ownerLedgerIds.map((ledgerId) => ({
            ledgerId,
            poolId: hall.pool?.id,
            type: "takeover",
            title: "8th Ledger Takeover",
            message: `Community revenue split for ${hall.name} has been reduced to 50% due to inventory stagnation. ${reason || ""}`,
            actionUrl: `/halls/${hallId}`,
            read: false,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        takeover: { hallId, status: "active", communitySplit: 50 },
        message: `Takeover triggered for ${hall.name}. Community split reduced to 50%.`,
      });
    }

    // ── FORCE RECLAMATION ──
    if (action === "force_reclamation") {
      if (!isFounder) {
        return NextResponse.json(
          {
            success: false,
            error: "Founder authority required for reclamation",
          },
          { status: 403 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.hall.update({
          where: { id: hallId },
          data: { closureStatus: "reclamation", status: "reclamation" },
        });

        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "reclamation",
            description: `Reclamation protocol initiated due to 24-month inventory stagnation.`,
            metadata: JSON.stringify({
              action: "force_reclamation",
              reason: reason || "24-month inventory stagnation",
            }),
          },
        });

        await tx.closureProtocol.create({
          data: {
            hallId,
            triggerMonth: new Date(),
            ahgiAtTrigger: hall.ahgiScore || 0,
            revenueAtTrigger: 0,
            payrollAtTrigger: 0,
            phase: "reclamation",
            status: "active",
          },
        });

        await tx.auditLog.create({
          data: {
            eventType: "reclamation_initiated",
            description: `Reclamation initiated: ${hall.pool?.name || hallId}. Inventory stagnant 24+ months. ${reason || ""}`,
            poolId: hall.pool?.poolId,
            ledgerId: user.ledgerId,
            txHash: `RECLAMATION-${hallId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });
      });

      if (ownerLedgerIds.length > 0) {
        await prisma.notification.createMany({
          data: ownerLedgerIds.map((ledgerId) => ({
            ledgerId,
            poolId: hall.pool?.id,
            type: "reclamation",
            title: "Reclamation Protocol Initiated",
            message: `8th Ledger has initiated reclamation for ${hall.name} due to prolonged inventory stagnation. Asset liquidation scheduled.`,
            actionUrl: `/halls/${hallId}`,
            read: false,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        reclamation: { hallId, status: "initiated", phase: "reclamation" },
        message: `Reclamation protocol initiated for ${hall.name}. Hall owners notified. Asset liquidation scheduled.`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("[HALL_VELOCITY_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Velocity action failed" },
      { status: 500 },
    );
  }
}
