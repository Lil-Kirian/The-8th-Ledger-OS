import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";

// GET /api/halls/[id]/closure
// Returns closure status + hall financials for the Closure Protocol page
// Owners and admins only
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: hallId } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership or admin
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id, status: "active" },
      select: { ownershipPercent: true },
    });

    const isAdmin = user.role === "admin";
    const isPrimaryAdmin = user.isPrimaryAdmin === true;

    if (!ownership && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch hall with treasury for current financials
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { id: true, poolId: true, trueCost: true, assetBookValue: true } },
        hallTreasury: {
          select: {
            monthlyRevenue: true,
            payrollReserve: true,
            pirDebt: true,
            balance: true,
          },
        },
        _count: {
          select: {
            ownerships: { where: { status: "active" } },
            workers: { where: { status: "active" } },
          },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Fetch latest closure protocol (if any)
    const closure = await prisma.closureProtocol.findFirst({
      where: { hallId },
      orderBy: { createdAt: "desc" },
      include: {
        payouts: {
          include: {
            user: { select: { ledgerId: true, displayName: true } },
          },
        },
      },
    });

    // Calculate estimated payout if in decision/liquidation phase
    let estimatedPayout: number | undefined;
    if (closure && ownership && (closure.phase === "decision" || closure.phase === "liquidation")) {
      const netProceeds = closure.netProceeds ?? closure.liquidationValue ?? 0;
      estimatedPayout = Math.round((netProceeds * ownership.ownershipPercent) / 100);
    }

    return NextResponse.json({
      hallId: hall.id,
      hallName: hall.name,
      hallClass: hall.hallClass,
      closureStatus: hall.closureStatus,
      sriScore: hall.sriScore,
      ahgiScore: hall.ahgiScore,
      currentRevenue: hall.hallTreasury?.monthlyRevenue ?? 0,
      currentPayroll: hall.hallTreasury?.payrollReserve ?? 0,
      totalOwners: hall._count.ownerships,
      totalWorkers: hall._count.workers,
      userOwnershipPercent: ownership?.ownershipPercent ?? 0,
      estimatedPayout,
      isOwner: !!ownership,
      isAdmin,
      isPrimaryAdmin,
      closure: closure
        ? {
            id: closure.id,
            phase: closure.phase,
            triggerMonth: closure.triggerMonth,
            ahgiAtTrigger: closure.ahgiAtTrigger,
            revenueAtTrigger: closure.revenueAtTrigger,
            payrollAtTrigger: closure.payrollAtTrigger,
            liquidationValue: closure.liquidationValue,
            assetSalePrice: closure.assetSalePrice,
            pirDebtPaid: closure.pirDebtPaid,
            taxPaid: closure.taxPaid,
            severancePaid: closure.severancePaid,
            ledgerFeePaid: closure.ledgerFeePaid,
            netProceeds: closure.netProceeds,
            status: closure.status,
            closedAt: closure.closedAt,
            createdAt: closure.createdAt,
            payouts: closure.payouts,
          }
        : null,
    });
  } catch (err) {
    console.error("[CLOSURE API] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/halls/[id]/closure
// Trigger or advance the Closure Protocol. Admin only.
// Auto-trigger logic (cron) checks AHGI critical for 3 consecutive months.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: hallId } = await params;
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      phase,
      triggerMonth,
      ahgiAtTrigger,
      revenueAtTrigger,
      payrollAtTrigger,
      liquidationValue,
      assetSalePrice,
      pirDebtPaid,
      taxPaid,
      severancePaid,
      ledgerFeePaid,
      netProceeds,
    } = body;

    const validPhases = ["warning", "decision", "liquidation"];
    if (!validPhases.includes(phase)) {
      return NextResponse.json(
        { error: "Invalid phase. Must be: warning, decision, liquidation" },
        { status: 400 }
      );
    }

    // Validate required fields per phase
    if (phase === "warning" && (ahgiAtTrigger === undefined || revenueAtTrigger === undefined)) {
      return NextResponse.json(
        { error: "warning phase requires ahgiAtTrigger and revenueAtTrigger" },
        { status: 400 }
      );
    }

    if (phase === "liquidation" && !liquidationValue && !assetSalePrice) {
      return NextResponse.json(
        { error: "liquidation phase requires liquidationValue or assetSalePrice" },
        { status: 400 }
      );
    }

    // Check for existing active closure
    const existing = await prisma.closureProtocol.findFirst({
      where: { hallId, status: "active" },
    });

    if (existing && existing.phase === phase) {
      return NextResponse.json(
        { error: `Closure protocol already in ${phase} phase`, closureId: existing.id },
        { status: 409 }
      );
    }

    // If advancing from warning→decision or decision→liquidation, close the previous
    if (existing) {
      await prisma.closureProtocol.update({
        where: { id: existing.id },
        data: { status: "completed" },
      });
    }

    // Create new closure protocol entry
    const closure = await prisma.closureProtocol.create({
      data: {
        hallId,
        phase,
        triggerMonth: triggerMonth ? new Date(triggerMonth) : new Date(),
        ahgiAtTrigger: ahgiAtTrigger ?? 0,
        revenueAtTrigger: revenueAtTrigger ?? 0,
        payrollAtTrigger: payrollAtTrigger ?? 0,
        liquidationValue: liquidationValue ?? assetSalePrice ?? 0,
        assetSalePrice: assetSalePrice ?? 0,
        pirDebtPaid: pirDebtPaid ?? 0,
        taxPaid: taxPaid ?? 0,
        severancePaid: severancePaid ?? 0,
        ledgerFeePaid: ledgerFeePaid ?? 0,
        netProceeds: netProceeds ?? 0,
        status: "active",
      },
    });

    // Update hall closure status
    await prisma.hall.update({
      where: { id: hallId },
      data: { closureStatus: phase },
    });

    // Create 8th Ledger update
    const phaseTitles: Record<string, string> = {
      warning: "Closure Protocol — Critical Warning",
      decision: "Closure Protocol — Final Warning",
      liquidation: "Closure Protocol — Liquidation Complete",
    };

    await prisma.eighthLedgerUpdate.create({
      data: {
        hallId,
        type: `CLOSURE_${phase.toUpperCase()}`,
        title: phaseTitles[phase],
        content: `The 8th Ledger has activated Closure Protocol Phase ${phase.toUpperCase()}. AHGI: ${ahgiAtTrigger ?? "N/A"}. Revenue: $${revenueAtTrigger?.toLocaleString() ?? "N/A"}.`,
        amount: liquidationValue ?? 0,
      },
    });

    // If liquidation, execute payouts automatically
    if (phase === "liquidation") {
      const ownerships = await prisma.ownership.findMany({
        where: { hallId, status: "active" },
        select: { id: true, userId: true, ownershipPercent: true },
      });

      const net = netProceeds ?? liquidationValue ?? 0;
      const payoutPromises = ownerships.map(async (o) => {
        const amount = Math.round((net * o.ownershipPercent) / 100);
        return prisma.liquidationPayout.create({
          data: {
            closureId: closure.id,
            userId: o.userId,
            ownershipPercent: o.ownershipPercent,
            amount,
            status: "paid",
            paidAt: new Date(),
          },
        });
      });

      await Promise.all(payoutPromises);

      // Deactivate ownerships
      await prisma.ownership.updateMany({
        where: { hallId },
        data: { status: "dissolved" },
      });

      // Close hall
      await prisma.hall.update({
        where: { id: hallId },
        data: { status: "dissolved", closureStatus: "dissolved" },
      });
    }

    await logSecurityAudit({
      action: "CLOSURE_TRIGGERED",
      actorId: admin.ledgerId,
      targetId: hallId,
      metadata: { phase, ahgiAtTrigger, revenueAtTrigger, payrollAtTrigger, liquidationValue },
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      message: `Closure Protocol ${phase} activated for Hall ${hallId}`,
      closureId: closure.id,
      phase,
      hallId,
    });
  } catch (err) {
    console.error("[CLOSURE API] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}