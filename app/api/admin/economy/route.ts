import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   HELPERS
   ============================================================ */
function handleError(error: unknown, label: string): NextResponse {
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
    { success: false, error: "Economy operation failed" },
    { status: 500 }
  );
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ============================================================
   GET /api/admin/economy — 8th Ledger Revenue & PIR Dashboard
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chartMonths = Math.min(
      24,
      Math.max(1, parseInt(searchParams.get("chartMonths") || "12", 10))
    );

    // ── Protocol settings ──
    let settings = await prisma.protocolSettings.findUnique({
      where: { key: "default" },
    });
    if (!settings) {
      settings = await prisma.protocolSettings.create({
        data: {
          key: "default",
          platformFee: 0,
          minCommitment: 50,
          maxCommitment: 50000,
          consensusThreshold: 2,
          publicAudit: true,
          pirEnabled: true,
          oracleEnabled: true,
          meridianCycleEnabled: true,
          closureProtocolEnabled: true,
          dormancyProtocolEnabled: true,
          dynamicValuationEnabled: true,
          forgeLedgerEnabled: true,
          eighthLedgerTithe: 20,
        },
      });
    }

    // ── Revenue aggregates (all time) ──
    const revenueAgg = await prisma.revenueLog.aggregate({
      _sum: {
        amount: true,
        ledgerFee: true,
        communityNet: true,
        payrollDeducted: true,
        netAfterPayroll: true,
      },
    });

    // ── This month ──
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = await prisma.revenueLog.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { amount: true, ledgerFee: true },
    });

    // ── Last month ──
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = monthStart;
    const lastMonthRevenue = await prisma.revenueLog.aggregate({
      where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
      _sum: { amount: true, ledgerFee: true },
    });

    // ── PIR aggregates by pillar ──
    const pirPillars = await prisma.pirAllocation.groupBy({
      by: ["pillar"],
      _sum: { amount: true, spent: true },
    });
    const pirMap = new Map(
      pirPillars.map((p) => [
        p.pillar,
        { allocated: p._sum.amount || 0, spent: p._sum.spent || 0 },
      ])
    );

    // ── Hall treasury aggregates ──
    const treasuryAgg = await prisma.hallTreasury.aggregate({
      _sum: {
        balance: true,
        totalDistributed: true,
        totalRevenue: true,
        payrollReserve: true,
        pirDebt: true,
        closureReserve: true,
      },
    });

    // ── Top performing halls ──
    const topHalls = await prisma.hall.findMany({
      orderBy: { hallTreasury: { totalRevenue: "desc" } },
      take: 10,
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            verticalId: true,
            country: true,
          },
        },
        hallTreasury: {
          select: {
            totalRevenue: true,
            balance: true,
            totalDistributed: true,
          },
        },
        _count: {
          select: {
            ownerships: true,
            workers: true,
          },
        },
      },
    });

    // ── Closure protocol stats ──
    const closureStats = await prisma.closureProtocol.groupBy({
      by: ["phase"],
      _count: true,
    });
    const closureMap = new Map(closureStats.map((c) => [c.phase, c._count]));

    // ── Monthly chart ──
    const since = new Date(now.getFullYear(), now.getMonth() - chartMonths + 1, 1);
    const monthlyLogs = await prisma.revenueLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        amount: true,
        ledgerFee: true,
        communityNet: true,
        payrollDeducted: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const chartMap = new Map<
      string,
      { month: string; gross: number; tithe: number; community: number; payroll: number }
    >();
    for (let i = 0; i < chartMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      chartMap.set(key, { month: key, gross: 0, tithe: 0, community: 0, payroll: 0 });
    }
    for (const r of monthlyLogs) {
      const key = getMonthKey(r.createdAt);
      const entry = chartMap.get(key);
      if (entry) {
        entry.gross += Number(r.amount || 0);
        entry.tithe += Number(r.ledgerFee || 0);
        entry.community += Number(r.communityNet || 0);
        entry.payroll += Number(r.payrollDeducted || 0);
      }
    }
    const monthlyChart = Array.from(chartMap.values()).reverse();

    // ── Marketplace fee estimates ──
    const ownershipFees = await prisma.ownershipListing.aggregate({
      where: { status: "sold" },
      _sum: { totalPrice: true },
    });
    const inventoryFees = await prisma.inventoryOrder.aggregate({
      where: { status: { in: ["completed", "fulfilled"] } },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      settings: {
        eighthLedgerTithe: settings.eighthLedgerTithe,
        platformFee: settings.platformFee,
        minCommitment: settings.minCommitment,
        maxCommitment: settings.maxCommitment,
        consensusThreshold: settings.consensusThreshold,
        publicAudit: settings.publicAudit,
        pirEnabled: settings.pirEnabled,
        closureProtocolEnabled: settings.closureProtocolEnabled,
      },
      revenue: {
        allTime: {
          gross: Number(revenueAgg._sum.amount || 0),
          tithe: Number(revenueAgg._sum.ledgerFee || 0),
          communityNet: Number(revenueAgg._sum.communityNet || 0),
          payrollDeducted: Number(revenueAgg._sum.payrollDeducted || 0),
          netAfterPayroll: Number(revenueAgg._sum.netAfterPayroll || 0),
        },
        thisMonth: {
          gross: Number(monthRevenue._sum.amount || 0),
          tithe: Number(monthRevenue._sum.ledgerFee || 0),
        },
        lastMonth: {
          gross: Number(lastMonthRevenue._sum.amount || 0),
          tithe: Number(lastMonthRevenue._sum.ledgerFee || 0),
        },
      },
      pir: {
        totalAllocated: pirPillars.reduce((s, p) => s + (p._sum.amount || 0), 0),
        totalSpent: pirPillars.reduce((s, p) => s + (p._sum.spent || 0), 0),
        pillars: {
          shield: pirMap.get("shield") || { allocated: 0, spent: 0 },
          seal: pirMap.get("seal") || { allocated: 0, spent: 0 },
          forge: pirMap.get("forge") || { allocated: 0, spent: 0 },
          spire: pirMap.get("spire") || { allocated: 0, spent: 0 },
          vanguard: pirMap.get("vanguard") || { allocated: 0, spent: 0 },
          sanctuary: pirMap.get("sanctuary") || { allocated: 0, spent: 0 },
        },
      },
      treasury: {
        totalBalance: Number(treasuryAgg._sum.balance || 0),
        totalDistributed: Number(treasuryAgg._sum.totalDistributed || 0),
        totalRevenue: Number(treasuryAgg._sum.totalRevenue || 0),
        totalPayrollReserve: Number(treasuryAgg._sum.payrollReserve || 0),
        totalPirDebt: Number(treasuryAgg._sum.pirDebt || 0),
        totalClosureReserve: Number(treasuryAgg._sum.closureReserve || 0),
      },
      marketplace: {
        estimatedOwnershipFees: Math.round(
          (Number(ownershipFees._sum.totalPrice || 0) * 0.015) * 100
        ) / 100, // blended ~1.5% avg
        estimatedInventoryFees: Math.round(
          (Number(inventoryFees._sum.amount || 0) * 0.05) * 100
        ) / 100, // 5% flat
      },
      closure: {
        warning: closureMap.get("warning") || 0,
        decision: closureMap.get("decision") || 0,
        liquidation: closureMap.get("liquidation") || 0,
        dissolved: closureMap.get("dissolved") || 0,
      },
      topHalls: topHalls.map((h) => ({
        id: h.id,
        name: h.name,
        pool: h.pool,
        totalRevenue: h.hallTreasury?.totalRevenue || 0,
        balance: h.hallTreasury?.balance || 0,
        totalDistributed: h.hallTreasury?.totalDistributed || 0,
        members: h._count.ownerships,
        workers: h._count.workers,
      })),
      monthlyChart,
    });
  } catch (error) {
    return handleError(error, "ADMIN_ECONOMY_GET");
  }
}

/* ============================================================
   POST /api/admin/economy — Primary Admin economy actions
   adjust_tithe | pir_reallocate
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    /* ===== ADJUST TITHE ===== */
    if (action === "adjust_tithe") {
      const { rate } = body;
      const newRate = Number(rate);

      if (isNaN(newRate) || newRate < 0 || newRate > 100) {
        return NextResponse.json(
          { success: false, error: "Tithe rate must be 0–100" },
          { status: 400 }
        );
      }

      const updated = await prisma.protocolSettings.upsert({
        where: { key: "default" },
        create: {
          key: "default",
          eighthLedgerTithe: newRate,
          updatedBy: user.ledgerId,
        },
        update: {
          eighthLedgerTithe: newRate,
          updatedBy: user.ledgerId,
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "tithe_rate_adjusted",
          description: `Primary Admin adjusted 8th Ledger Tithe to ${newRate}%`,
          txHash: `TITHE-${newRate}-${Date.now()}`,
          ledgerId: user.ledgerId,
        },
      });

      return NextResponse.json({
        success: true,
        tithe: updated.eighthLedgerTithe,
        message: `8th Ledger Tithe adjusted to ${newRate}%`,
      });
    }

    /* ===== PIR REALLOCATION ===== */
    if (action === "pir_reallocate") {
      const { hallId, pillar, amount, purpose } = body;
      const amt = Number(amount);

      if (!hallId || !pillar || !amt || amt < 1) {
        return NextResponse.json(
          { success: false, error: "hallId, pillar, and positive amount required" },
          { status: 400 }
        );
      }

      const validPillars = [
        "shield",
        "seal",
        "forge",
        "spire",
        "vanguard",
        "sanctuary",
      ];
      if (!validPillars.includes(pillar)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid pillar. Use: ${validPillars.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const hall = await prisma.hall.findUnique({
        where: { id: hallId },
        select: { id: true, name: true },
      });
      if (!hall) {
        return NextResponse.json(
          { success: false, error: "Hall not found" },
          { status: 404 }
        );
      }

      const allocation = await prisma.pirAllocation.create({
        data: {
          hallId,
          pillar,
          amount: amt,
          purpose: purpose?.trim() || "Admin reallocation",
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "pir_reallocated",
          description: `PIR reallocated: $${amt} to ${pillar} for Hall #${hallId} (${hall.name})`,
          amount: amt,
          txHash: `PIR-REALLOC-${hallId}-${Date.now()}`,
          ledgerId: user.ledgerId,
        },
      });

      return NextResponse.json({
        success: true,
        allocation: {
          id: allocation.id,
          hallId: allocation.hallId,
          pillar: allocation.pillar,
          amount: allocation.amount,
          purpose: allocation.purpose,
          createdAt: allocation.createdAt,
        },
        message: `PIR reallocated: $${amt} → ${pillar} for Hall ${hall.name}`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use "adjust_tithe" or "pir_reallocate"',
      },
      { status: 400 }
    );
  } catch (error) {
    return handleError(error, "ADMIN_ECONOMY_POST");
  }
}