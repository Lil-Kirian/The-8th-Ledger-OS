import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership, isFounder } from "@/lib/auth";

/* ============================================================
   GET /api/halls/[id]/treasury — Per-Hall financials
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;
    const { searchParams } = new URL(request.url);
    const months = Math.min(Number(searchParams.get("months") || "12"), 24);

    // ── Gate ──
    const isOwner = await verifyOwnership(hallId, user.id);
    if (!isOwner && !isFounder(user) && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Sovereign access denied" }, { status: 403 });
    }

    // ── Treasury snapshot ──
    const treasury = await prisma.treasury.findUnique({
      where: { hallId },
    });

    if (!treasury) {
      return NextResponse.json({
        success: true,
        treasury: {
          hallId,
          balance: 0,
          totalIn: 0,
          totalOut: 0,
          reserveAllocation: 0,
          reserveBalance: 0,
          liquidBalance: 0,
        },
        revenueHistory: [],
        monthlyBreakdown: [],
        burnRate: 0,
        runwayMonths: null,
        dividendStats: {
          totalDistributed: 0,
          totalClaimed: 0,
          totalUnclaimed: 0,
          claimRate: 0,
        },
        message: "No treasury activity recorded for this Hall yet.",
      });
    }

    // ── Revenue history (last N months) ──
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const revenueLogs = await prisma.revenueLog.findMany({
      where: { hallId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { dividends: true } },
      },
    });

    // ── Monthly breakdown skeleton ──
    const monthlyMap = new Map<string, {
      month: string;
      grossRevenue: number;
      vinFee: number;
      communityNet: number;
      dividendsQueued: number;
      outflow: number;
    }>();

    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, {
        month: key,
        grossRevenue: 0,
        vinFee: 0,
        communityNet: 0,
        dividendsQueued: 0,
        outflow: 0,
      });
    }

    for (const log of revenueLogs) {
      const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!;
        entry.grossRevenue += Number(log.amount);
        entry.vinFee += Number(log.vinFee);
        entry.communityNet += Number(log.communityNet);
        entry.dividendsQueued += log._count.dividends;
      }
    }

    // ── Dividend aggregates ──
    const [dividendAgg, claimedAgg] = await prisma.$transaction([
      prisma.dividend.aggregate({
        where: { hallId },
        _sum: { entitlement: true },
        _count: true,
      }),
      prisma.dividend.aggregate({
        where: { hallId, status: "claimed" },
        _sum: { entitlement: true },
        _count: true,
      }),
    ]);

    const totalDistributed = Number(dividendAgg._sum.entitlement || 0);
    const totalClaimed = Number(claimedAgg._sum.entitlement || 0);
    const totalUnclaimed = totalDistributed - totalClaimed;
    const claimRate = totalDistributed > 0 ? (totalClaimed / totalDistributed) * 100 : 0;

    // ── Burn rate: avg monthly outflow ──
    const claimedDividends = await prisma.dividend.findMany({
      where: { hallId, status: "claimed", claimedAt: { gte: since } },
      select: { claimedAt: true, entitlement: true },
    });

    for (const d of claimedDividends) {
      const key = `${d.claimedAt!.getFullYear()}-${String(d.claimedAt!.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.get(key)!.outflow += Number(d.entitlement);
      }
    }

    const monthlyValues = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const monthsWithOutflow = monthlyValues.filter((m) => m.outflow > 0);
    const burnRate = monthsWithOutflow.length > 0
      ? monthsWithOutflow.reduce((sum, m) => sum + m.outflow, 0) / monthsWithOutflow.length
      : 0;

    // ── Reserve split ──
    const reservePct = Number(treasury.reserveAllocation || 0);
    const balance = Number(treasury.balance);
    const reserveBalance = balance * (reservePct / 100);
    const liquidBalance = balance - reserveBalance;

    return NextResponse.json({
      success: true,
      treasury: {
        hallId,
        balance: Number(balance.toFixed(2)),
        totalIn: Number(treasury.totalIn),
        totalOut: Number(treasury.totalOut),
        reserveAllocation: reservePct,
        reserveBalance: Number(reserveBalance.toFixed(2)),
        liquidBalance: Number(liquidBalance.toFixed(2)),
        netFlow: Number((Number(treasury.totalIn) - Number(treasury.totalOut)).toFixed(2)),
      },
      revenueHistory: revenueLogs.map((r) => ({
        id: r.id,
        grossAmount: Number(r.amount),
        vinFee: Number(r.vinFee),
        communityNet: Number(r.communityNet),
        source: r.source,
        distributed: !!r.distributedAt,
        createdAt: r.createdAt,
      })),
      monthlyBreakdown: monthlyValues,
      burnRate: Number(burnRate.toFixed(2)),
      runwayMonths: burnRate > 0 ? Number((balance / burnRate).toFixed(1)) : null,
      dividendStats: {
        totalDistributed: Number(totalDistributed.toFixed(2)),
        totalClaimed: Number(totalClaimed.toFixed(2)),
        totalUnclaimed: Number(totalUnclaimed.toFixed(2)),
        claimRate: Number(claimRate.toFixed(2)),
        totalRecords: dividendAgg._count,
        claimedRecords: claimedAgg._count,
      },
      splitRatio: "80/20",
    });
  } catch (error) {
    console.error("[HALL TREASURY GET]", error);
    return NextResponse.json(
      { success: false, error: "Treasury data unreachable" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/halls/[id]/treasury — Founder adjusts reserve allocation
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isFounder(user)) {
      return NextResponse.json(
        { success: false, error: "Sovereign authority required" },
        { status: 403 }
      );
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { reserveAllocation } = body;

    if (typeof reserveAllocation !== "number" || reserveAllocation < 0 || reserveAllocation > 100) {
      return NextResponse.json(
        { success: false, error: "reserveAllocation must be 0–100" },
        { status: 400 }
      );
    }

    const updated = await prisma.treasury.upsert({
      where: { hallId },
      create: {
        hallId,
        balance: 0,
        totalIn: 0,
        totalOut: 0,
        reserveAllocation,
      },
      update: {
        reserveAllocation,
      },
    });

    await prisma.hallActivity.create({
      data: {
        hallId,
        userId: user.id,
        type: "treasury",
        description: `Reserve allocation set to ${reserveAllocation}%`,
        metadata: JSON.stringify({ reserveAllocation }),
      },
    });

    return NextResponse.json({
      success: true,
      treasury: {
        hallId,
        reserveAllocation: updated.reserveAllocation,
        balance: Number(updated.balance),
      },
      message: `Reserve allocation updated to ${reserveAllocation}%. ${100 - reserveAllocation}% remains liquid for dividends.`,
    });
  } catch (error) {
    console.error("[HALL TREASURY POST]", error);
    return NextResponse.json(
      { success: false, error: "Reserve update failed" },
      { status: 500 }
    );
  }
}