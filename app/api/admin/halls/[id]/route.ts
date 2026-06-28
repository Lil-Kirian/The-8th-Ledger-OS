import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   ERROR HANDLER
   ============================================================ */
function handleError(error: any, label: string): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      );
    }
  }
  console.error(`[${label}]`, error);
  return NextResponse.json(
    { success: false, error: "Operation failed" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/admin/halls/[id] — Primary Admin Hall Detail
   Full sovereign view: SRI, AHGI, Cabinet, PIR, Workers,
   Dynamic Valuation, Closure Protocol, Ownership Breakdown.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const hallId = id;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            verticalId: true,
            status: true,
            country: true,
            trueCost: true,
            listedPrice: true,
            assetValue: true,
            assetBookValue: true,
            committed: true,
            target: true,
            hallClass: true,
            pirAllocation: true,
            meridianCycleId: true,
          },
        },
        hallTreasury: true,
        executiveCabinet: true,
        _count: {
          select: {
            ownerships: true,
            workers: true,
            proposals: true,
            inventoryItems: true,
            banRecords: true,
          },
        },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 }
      );
    }

    // Parallel deep queries
    const [
      ownerships,
      workers,
      pirAllocations,
      latestValuation,
      closureProtocol,
      sriSnapshots,
      ahgiSnapshots,
      recentUpdates,
      recentProposals,
      activeBans,
    ] = await Promise.all([
      prisma.ownership.findMany({
        where: { hallId, status: "active" },
        orderBy: { ownershipPercent: "desc" },
        take: 50,
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              email: true,
              kycTier: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.worker.findMany({
        where: { hallId },
        orderBy: { hiredAt: "desc" },
        include: {
          performances: {
            orderBy: { reviewedAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.pirAllocation.findMany({
        where: { hallId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dynamicValuation.findFirst({
        where: { hallId },
        orderBy: { calculatedAt: "desc" },
      }),
      prisma.closureProtocol.findUnique({
        where: { hallId },
      }),
      prisma.sriSnapshot.findMany({
        where: { hallId },
        orderBy: { recordedAt: "desc" },
        take: 3,
      }),
      prisma.ahgiSnapshot.findMany({
        where: { hallId },
        orderBy: { recordedAt: "desc" },
        take: 3,
      }),
      prisma.eighthLedgerUpdate.findMany({
        where: { hallId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.proposal.findMany({
        where: { hallId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          proposer: {
            select: {
              ledgerId: true,
              displayName: true,
            },
          },
          _count: { select: { votes: true } },
        },
      }),
      prisma.banRecord.findMany({
        where: { hallId, status: "active" },
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
            },
          },
        },
      }),
    ]);

    const totalOwnership = ownerships.reduce(
      (sum, o) => sum + o.ownershipPercent,
      0
    );

    const topHolders = ownerships.slice(0, 5).map((o) => ({
      ledgerId: o.user?.ledgerId,
      displayName: o.user?.displayName,
      ownershipPercent: o.ownershipPercent,
      dynamicValue: o.dynamicValue,
      accumulatedDividends: o.accumulatedDividends,
    }));

    const treasury = hall.hallTreasury;
    const treasuryHealth = treasury
      ? {
          balance: treasury.balance,
          totalDistributed: treasury.totalDistributed,
          totalRevenue: treasury.totalRevenue,
          payrollReserve: treasury.payrollReserve,
          pirDebt: treasury.pirDebt,
          closureReserve: treasury.closureReserve,
          monthlyRevenue: treasury.monthlyRevenue,
          lastDistribution: treasury.lastDistribution,
        }
      : null;

    const pirSummary = {
      totalAllocated: pirAllocations.reduce((s, p) => s + p.amount, 0),
      totalSpent: pirAllocations.reduce((s, p) => s + p.spent, 0),
      pillars: pirAllocations.map((p) => ({
        pillar: p.pillar,
        amount: p.amount,
        spent: p.spent,
        remaining: p.amount - p.spent,
        purpose: p.purpose,
      })),
    };

    return NextResponse.json({
      success: true,
      hall: {
        id: hall.id,
        name: hall.name,
        status: hall.status,
        hallClass: hall.hallClass,
        sriScore: hall.sriScore,
        ahgiScore: hall.ahgiScore,
        closureStatus: hall.closureStatus,
        executiveCabinetId: hall.executiveCabinetId,
        pirDebt: hall.pirDebt,
        payrollReserve: hall.payrollReserve,
        createdAt: hall.createdAt,
        updatedAt: hall.updatedAt,
        pool: hall.pool,
        stats: {
          totalMembers: hall._count.ownerships,
          totalWorkers: hall._count.workers,
          totalProposals: hall._count.proposals,
          totalInventoryItems: hall._count.inventoryItems,
          totalBans: hall._count.banRecords,
          activeBans: activeBans.length,
          ownershipConcentration: Number(totalOwnership.toFixed(4)),
        },
        treasury: treasuryHealth,
        executiveCabinet: hall.executiveCabinet,
        topHolders,
        workers: workers.map((w) => ({
          id: w.id,
          workerNumber: w.workerNumber,
          role: w.role,
          salary: w.salary,
          status: w.status,
          performanceScore: w.performanceScore,
          hiredAt: w.hiredAt,
          contractMonths: w.contractMonths,
          latestPerformance: w.performances[0] || null,
        })),
        pir: pirSummary,
        dynamicValuation: latestValuation
          ? {
              assetBookValue: latestValuation.assetBookValue,
              accumulatedDividendsPerPercent:
                latestValuation.accumulatedDividendsPerPercent,
              ahgiPremium: latestValuation.ahgiPremium,
              sriBonus: latestValuation.sriBonus,
              pirDebtPerPercent: latestValuation.pirDebtPerPercent,
              valuePerPercent: latestValuation.valuePerPercent,
              calculatedAt: latestValuation.calculatedAt,
            }
          : null,
        closureProtocol: closureProtocol
          ? {
              id: closureProtocol.id,
              phase: closureProtocol.phase,
              status: closureProtocol.status,
              triggerMonth: closureProtocol.triggerMonth,
              ahgiAtTrigger: closureProtocol.ahgiAtTrigger,
              revenueAtTrigger: closureProtocol.revenueAtTrigger,
              payrollAtTrigger: closureProtocol.payrollAtTrigger,
              liquidationValue: closureProtocol.liquidationValue,
              netProceeds: closureProtocol.netProceeds,
              closedAt: closureProtocol.closedAt,
            }
          : null,
        sriHistory: sriSnapshots,
        ahgiHistory: ahgiSnapshots,
        recentUpdates: recentUpdates.map((u) => ({
          type: u.type,
          title: u.title,
          content: u.content,
          amount: u.amount,
          createdAt: u.createdAt,
        })),
        recentProposals: recentProposals.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          status: p.status,
          proposer: p.proposer,
          voteCount: p._count.votes,
          createdAt: p.createdAt,
          endsAt: p.endsAt,
        })),
        activeBans: activeBans.map((b) => ({
          userId: b.userId,
          ledgerId: b.user?.ledgerId,
          displayName: b.user?.displayName,
          reason: b.reason,
          duration: b.duration,
          expiresAt: b.expiresAt,
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (error) {
    return handleError(error, "ADMIN_HALL_DETAIL_GET");
  }
}

/* ============================================================
   PATCH /api/admin/halls/[id] — Update Hall Metadata
   hallClass, status, closureStatus, sriScore, ahgiScore,
   payrollReserve, pirDebt
   ============================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const hallId = id;

    const body = await request.json();
    const {
      hallClass,
      status,
      closureStatus,
      sriScore,
      ahgiScore,
      payrollReserve,
      pirDebt,
    } = body;

    const updateData: Prisma.HallUpdateInput = {};
    if (hallClass !== undefined) updateData.hallClass = hallClass;
    if (status !== undefined) updateData.status = status;
    if (closureStatus !== undefined) updateData.closureStatus = closureStatus;
    if (sriScore !== undefined) updateData.sriScore = sriScore;
    if (ahgiScore !== undefined) updateData.ahgiScore = ahgiScore;
    if (payrollReserve !== undefined)
      updateData.payrollReserve = payrollReserve;
    if (pirDebt !== undefined) updateData.pirDebt = pirDebt;

    const updated = await prisma.hall.update({
      where: { id: hallId },
      data: updateData,
      include: {
        pool: { select: { poolId: true, name: true } },
      },
    });

    await prisma.auditEntry.create({
      data: {
        type: "hall_metadata_updated",
        description: `Primary Admin updated Hall #${hallId} metadata`,
        txHash: `HALL-UPD-${hallId}-${Date.now()}`,
        poolId: updated.pool?.poolId,
      },
    });

    return NextResponse.json({
      success: true,
      hall: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        hallClass: updated.hallClass,
        sriScore: updated.sriScore,
        ahgiScore: updated.ahgiScore,
        closureStatus: updated.closureStatus,
        payrollReserve: updated.payrollReserve,
        pirDebt: updated.pirDebt,
        updatedAt: updated.updatedAt,
      },
      message: "Hall metadata updated",
    });
  } catch (error) {
    return handleError(error, "ADMIN_HALL_DETAIL_PATCH");
  }
}

/* ============================================================
   POST /api/admin/halls/[id] — Primary Admin Actions
   trigger_closure_warning | force_liquidation | pir_advance
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const hallId = id;
    const body = await request.json();
    const { action } = body;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { pool: { select: { poolId: true } } },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 }
      );
    }

    /* ===== TRIGGER CLOSURE WARNING ===== */
    if (action === "trigger_closure_warning") {
      const { reason } = body;

      const existing = await prisma.closureProtocol.findUnique({
        where: { hallId },
      });

      if (existing && existing.status === "active") {
        return NextResponse.json(
          {
            success: false,
            error: "Active closure protocol already exists for this hall",
          },
          { status: 409 }
        );
      }

      const treasury = await prisma.hallTreasury.findUnique({
        where: { hallId },
      });

      const protocol = await prisma.closureProtocol.create({
        data: {
          hallId,
          triggerMonth: new Date(),
          ahgiAtTrigger: hall.ahgiScore,
          revenueAtTrigger: treasury?.monthlyRevenue || 0,
          payrollAtTrigger: hall.payrollReserve,
          phase: "warning",
          status: "active",
        },
      });

      await prisma.hall.update({
        where: { id: hallId },
        data: { closureStatus: "warning" },
      });

      await prisma.auditEntry.create({
        data: {
          type: "closure_warning_triggered",
          description: `Primary Admin triggered closure warning for Hall #${hallId}. Reason: ${reason || "Manual override"}`,
          txHash: `CLOSURE-WARN-${hallId}-${Date.now()}`,
          poolId: hall.pool?.poolId,
        },
      });

      return NextResponse.json({
        success: true,
        closureProtocol: {
          id: protocol.id,
          phase: protocol.phase,
          status: protocol.status,
          triggerMonth: protocol.triggerMonth,
        },
        message:
          "Closure warning triggered. Hall enters 60-day improvement period.",
      });
    }

    /* ===== FORCE LIQUIDATION ===== */
    if (action === "force_liquidation") {
      const { liquidationValue, reason } = body;

      const activeProtocol = await prisma.closureProtocol.findUnique({
        where: { hallId },
      });

      if (!activeProtocol || activeProtocol.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            error: "No active closure protocol. Trigger warning first.",
          },
          { status: 409 }
        );
      }

      const updated = await prisma.closureProtocol.update({
        where: { id: activeProtocol.id },
        data: {
          phase: "liquidation",
          liquidationValue: liquidationValue || 0,
        },
      });

      await prisma.hall.update({
        where: { id: hallId },
        data: { closureStatus: "liquidation" },
      });

      await prisma.auditEntry.create({
        data: {
          type: "closure_liquidation_forced",
          description: `Primary Admin forced liquidation for Hall #${hallId}. Reason: ${reason || "Manual override"}`,
          txHash: `CLOSURE-LIQ-${hallId}-${Date.now()}`,
          poolId: hall.pool?.poolId,
        },
      });

      return NextResponse.json({
        success: true,
        closureProtocol: {
          id: updated.id,
          phase: updated.phase,
          liquidationValue: updated.liquidationValue,
        },
        message: "Liquidation phase forced. Asset sale initiated.",
      });
    }

    /* ===== EMERGENCY PIR ADVANCE ===== */
    if (action === "pir_advance") {
      const { amount, reason, repaymentRate } = body;

      if (!amount || amount < 1) {
        return NextResponse.json(
          { success: false, error: "Positive amount required" },
          { status: 400 }
        );
      }

      const advance = await prisma.pirAdvance.create({
        data: {
          hallId,
          amount: Number(amount),
          reason: reason?.trim() || "Emergency PIR advance",
          repaymentRate: repaymentRate || 5,
          interestRate: 0,
          status: "active",
          approvedBy: user.ledgerId,
        },
      });

      await prisma.hall.update({
        where: { id: hallId },
        data: { pirDebt: { increment: Number(amount) } },
      });

      await prisma.auditEntry.create({
        data: {
          type: "pir_advance_emergency",
          description: `Emergency PIR advance of $${amount} approved for Hall #${hallId}`,
          amount: Number(amount),
          txHash: `PIR-ADV-${hallId}-${Date.now()}`,
          poolId: hall.pool?.poolId,
        },
      });

      return NextResponse.json({
        success: true,
        pirAdvance: {
          id: advance.id,
          amount: advance.amount,
          repaymentRate: advance.repaymentRate,
          status: advance.status,
          approvedBy: advance.approvedBy,
          approvedAt: advance.approvedAt,
        },
        message: `Emergency PIR advance of $${amount} approved.`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'Invalid action. Use "trigger_closure_warning", "force_liquidation", or "pir_advance"',
      },
      { status: 400 }
    );
  } catch (error) {
    return handleError(error, "ADMIN_HALL_DETAIL_POST");
  }
}