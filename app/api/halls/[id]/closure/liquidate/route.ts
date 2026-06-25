import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSessionUser } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";

// POST /api/halls/[id]/closure/liquidate
// Execute full liquidation. Primary admin only.
// Payout order: 8th Ledger fee (2.5%) → PIR debt → Tax → Worker severance → Owners by %
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: hallId } = await params;
    const user = await getSessionUser(req);

    // Primary admin only — this is irreversible
    if (!user || user.role !== "admin" || !user.isPrimaryAdmin) {
      return NextResponse.json(
        { error: "Primary admin required. Liquidation is irreversible." },
        { status: 403 }
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { id: true, poolId: true, trueCost: true } },
        ownerships: {
          where: { status: "active" },
          select: { id: true, userId: true, ownershipPercent: true, accumulatedDividends: true },
        },
        workers: {
          where: { status: { in: ["active", "probation"] } },
          select: { id: true, salary: true, hiredAt: true, workerNumber: true, role: true },
        },
        closureProtocols: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        hallTreasury: {
          select: { balance: true, pirDebt: true, payrollReserve: true },
        },
        pirAdvances: {
          where: { status: "active" },
          select: { id: true, amount: true, repaidAmount: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    if (!["warning", "decision"].includes(hall.closureStatus)) {
      return NextResponse.json(
        { error: "Hall not in closure phase. Must be warning or decision." },
        { status: 400 }
      );
    }

    const closure = hall.closureProtocols[0];
    if (!closure) {
      return NextResponse.json(
        { error: "No active closure protocol found." },
        { status: 400 }
      );
    }

    // Determine sale price
    const salePrice = closure.assetSalePrice ?? closure.liquidationValue ?? 0;
    if (salePrice <= 0) {
      return NextResponse.json(
        { error: "Asset sale price must be greater than zero." },
        { status: 400 }
      );
    }

    // 1. 8th Ledger liquidation fee: 2.5%
    const ledgerFee = Math.round(salePrice * 0.025);

    // 2. Outstanding PIR debt repayment
    const totalPirDebt = hall.pirAdvances.reduce(
      (sum, p) => sum + (p.amount - p.repaidAmount),
      0
    );
    const pirDebt = totalPirDebt || hall.hallTreasury?.pirDebt || 0;

    // 3. Tax obligations (estimated 4% of sale price)
    const taxObligations = Math.round(salePrice * 0.04);

    // 4. Worker severance: 1 month salary per year of service (minimum 1 month)
    const workerSeverance = hall.workers.reduce((sum, w) => {
      const monthsEmployed = Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(w.hiredAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
        )
      );
      const yearsOfService = Math.max(1, Math.ceil(monthsEmployed / 12));
      const severance = w.salary * yearsOfService;
      return sum + severance;
    }, 0);

    // Calculate net proceeds
    const netProceeds = Math.max(
      0,
      salePrice - ledgerFee - pirDebt - taxObligations - workerSeverance
    );

    if (netProceeds <= 0) {
      return NextResponse.json(
        {
          error: "Net proceeds zero or negative after deductions. Aborting liquidation.",
          breakdown: { salePrice, ledgerFee, pirDebt, taxObligations, workerSeverance, netProceeds },
        },
        { status: 400 }
      );
    }

    // Execute liquidation atomically
    const payouts = await prisma.$transaction(async (tx) => {
      const createdPayouts = [];

      // 5. Distribute remaining proceeds by ownership %
      const totalOwnershipPercent = hall.ownerships.reduce(
        (sum, o) => sum + o.ownershipPercent,
        0
      );

      for (const ownership of hall.ownerships) {
        const amount =
          totalOwnershipPercent > 0
            ? Math.round((ownership.ownershipPercent / totalOwnershipPercent) * netProceeds)
            : 0;

        // Credit user wallet
        if (amount > 0) {
          await tx.user.update({
            where: { id: ownership.userId },
            data: { ledgerBalance: { increment: amount } },
          });
        }

        // Record payout
        const payout = await tx.liquidationPayout.create({
          data: {
            closureId: closure.id,
            userId: ownership.userId,
            ownershipPercent: ownership.ownershipPercent,
            amount,
            status: "paid",
            paidAt: new Date(),
          },
        });
        createdPayouts.push(payout);
      }

      // Mark all PIR advances as repaid
      if (hall.pirAdvances.length > 0) {
        await tx.pirAdvance.updateMany({
          where: { hallId, status: "active" },
          data: { status: "repaid", repaidAmount: { increment: pirDebt } },
        });
      }

      // Mark all workers as terminated with severance paid
      for (const worker of hall.workers) {
        await tx.worker.update({
          where: { id: worker.id },
          data: {
            status: "terminated",
            terminatedAt: new Date(),
            terminationReason: "Hall closure — liquidation",
          },
        });
      }

      // Update closure protocol to liquidation complete
      await tx.closureProtocol.update({
        where: { id: closure.id },
        data: {
          phase: "liquidation",
          status: "completed",
          ledgerFeePaid: ledgerFee,
          pirDebtPaid: pirDebt,
          taxPaid: taxObligations,
          severancePaid: workerSeverance,
          netProceeds,
          closedAt: new Date(),
        },
      });

      // Dissolve hall
      await tx.hall.update({
        where: { id: hallId },
        data: {
          closureStatus: "dissolved",
          status: "dissolved",
          sriScore: 0,
          ahgiScore: 0,
        },
      });

      // Dissolve all ownerships
      await tx.ownership.updateMany({
        where: { hallId },
        data: {
          status: "dissolved",
          dynamicValue: 0,
          pirDebt: 0,
        },
      });

      // Cancel any active listings
      await tx.ownershipListing.updateMany({
        where: { hallId, status: "active" },
        data: { status: "cancelled" },
      });

      // Create 8th Ledger update
      await tx.eighthLedgerUpdate.create({
        data: {
          hallId,
          type: "CLOSURE_LIQUIDATION",
          title: "Hall Liquidation Complete",
          content: `Asset sold for $${salePrice.toLocaleString()}. Net proceeds: $${netProceeds.toLocaleString()}. ${createdPayouts.length} owners paid. Hall dissolved.`,
          amount: netProceeds,
        },
      });

      return createdPayouts;
    });

    await logSecurityAudit({
      action: "LIQUIDATION_EXECUTED",
      actorId: user.ledgerId,
      targetId: hallId,
      metadata: {
        salePrice,
        ledgerFee,
        pirDebt,
        taxObligations,
        workerSeverance,
        netProceeds,
        payoutCount: payouts.length,
        workerCount: hall.workers.length,
      },
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: `Hall ${hallId} liquidated. ${payouts.length} payouts distributed.`,
      hallId,
      phase: "liquidation",
      summary: {
        salePrice,
        ledgerFee,
        pirDebt,
        taxObligations,
        workerSeverance,
        netProceeds,
        totalDeductions: salePrice - netProceeds,
      },
      payouts: payouts.map((p) => ({
        userId: p.userId,
        ownershipPercent: p.ownershipPercent,
        amount: p.amount,
        status: p.status,
        paidAt: p.paidAt,
      })),
      workersSevered: hall.workers.length,
    });
  } catch (err) {
    console.error("[LIQUIDATION API] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}