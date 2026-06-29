import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership, isFounder } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: hallId } = await params;
    const { searchParams } = new URL(request.url);
    const months = Math.min(Number(searchParams.get("months") || "12"), 24);

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { id: true, name: true, poolId: true },
    });
    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    const isOwner = await verifyOwnership(user.id, undefined, hallId);
    if (!isOwner && !(await isFounder(user)) && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 },
      );
    }

    const treasury = await prisma.hallTreasury.findUnique({
      where: { hallId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const revenueLogs = await prisma.revenueLog.findMany({
      where: { poolId: hall.poolId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });

    const distributions = await prisma.dividendDistribution.findMany({
      where: {
        poolId: hall.poolId,
        distributedAt: { gte: since },
      },
      include: {
        entries: { select: { amount: true, claimed: true } },
      },
    });

    const monthlyMap = new Map<
      string,
      {
        month: string;
        grossRevenue: number;
        ledgerFee: number;
        communityNet: number;
        dividendsQueued: number;
        outflow: number;
      }
    >();

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, {
        month: key,
        grossRevenue: 0,
        ledgerFee: 0,
        communityNet: 0,
        dividendsQueued: 0,
        outflow: 0,
      });
    }

    for (const log of revenueLogs) {
      const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key);
      if (!entry) continue;
      entry.grossRevenue += log.amount;
      entry.ledgerFee += log.ledgerFee;
      entry.communityNet += log.communityNet;
    }

    for (const distribution of distributions) {
      const key = `${distribution.distributedAt.getFullYear()}-${String(distribution.distributedAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key);
      if (!entry) continue;
      const total = distribution.entries.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const claimed = distribution.entries
        .filter((item) => item.claimed)
        .reduce((sum, item) => sum + item.amount, 0);
      entry.dividendsQueued += total;
      entry.outflow += claimed;
    }

    const totalDistributed = distributions.reduce(
      (sum, distribution) =>
        sum +
        distribution.entries.reduce(
          (entrySum, entry) => entrySum + entry.amount,
          0,
        ),
      0,
    );
    const totalClaimed = distributions.reduce(
      (sum, distribution) =>
        sum +
        distribution.entries
          .filter((entry) => entry.claimed)
          .reduce((entrySum, entry) => entrySum + entry.amount, 0),
      0,
    );
    const totalUnclaimed = totalDistributed - totalClaimed;
    const claimRate =
      totalDistributed > 0 ? (totalClaimed / totalDistributed) * 100 : 0;

    const monthlyValues = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
    const monthsWithOutflow = monthlyValues.filter(
      (month) => month.outflow > 0,
    );
    const burnRate =
      monthsWithOutflow.length > 0
        ? monthsWithOutflow.reduce((sum, month) => sum + month.outflow, 0) /
          monthsWithOutflow.length
        : 0;
    const balance = treasury?.balance ?? 0;

    return NextResponse.json({
      success: true,
      treasury: {
        hallId,
        balance,
        totalIn: treasury?.totalRevenue ?? 0,
        totalOut: treasury?.totalDistributed ?? 0,
        payrollReserve: treasury?.payrollReserve ?? 0,
        pirDebt: treasury?.pirDebt ?? 0,
        closureReserve: treasury?.closureReserve ?? 0,
        monthlyRevenue: treasury?.monthlyRevenue ?? 0,
        netFlow:
          (treasury?.totalRevenue ?? 0) - (treasury?.totalDistributed ?? 0),
      },
      revenueHistory: revenueLogs.map((log) => ({
        id: log.id,
        grossAmount: log.amount,
        ledgerFee: log.ledgerFee,
        communityNet: log.communityNet,
        source: log.source,
        distributed: log.distributed,
        createdAt: log.createdAt,
      })),
      transactions: treasury?.transactions ?? [],
      monthlyBreakdown: monthlyValues,
      burnRate: Number(burnRate.toFixed(2)),
      runwayMonths:
        burnRate > 0 ? Number((balance / burnRate).toFixed(1)) : null,
      dividendStats: {
        totalDistributed,
        totalClaimed,
        totalUnclaimed,
        claimRate: Number(claimRate.toFixed(2)),
        totalRecords: distributions.reduce(
          (sum, distribution) => sum + distribution.entries.length,
          0,
        ),
        claimedRecords: distributions.reduce(
          (sum, distribution) =>
            sum + distribution.entries.filter((entry) => entry.claimed).length,
          0,
        ),
      },
      splitRatio: "80/20",
    });
  } catch (error) {
    console.error("[HALL TREASURY GET]", error);
    return NextResponse.json(
      { success: false, error: "Treasury data unreachable" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !(await isFounder(user))) {
      return NextResponse.json(
        { success: false, error: "Sovereign authority required" },
        { status: 403 },
      );
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const payrollReserve = Number(body.payrollReserve ?? 0);
    const closureReserve = Number(body.closureReserve ?? 0);

    if (payrollReserve < 0 || closureReserve < 0) {
      return NextResponse.json(
        { success: false, error: "Reserve values must be non-negative" },
        { status: 400 },
      );
    }

    const updated = await prisma.hallTreasury.upsert({
      where: { hallId },
      create: {
        hallId,
        balance: 0,
        totalDistributed: 0,
        totalRevenue: 0,
        payrollReserve,
        closureReserve,
      },
      update: {
        payrollReserve,
        closureReserve,
      },
    });

    await prisma.hallActivity.create({
      data: {
        hallId,
        userId: user.id,
        type: "treasury",
        description: "Treasury reserves updated",
        metadata: JSON.stringify({ payrollReserve, closureReserve }),
      },
    });

    return NextResponse.json({
      success: true,
      treasury: {
        hallId,
        payrollReserve: updated.payrollReserve,
        closureReserve: updated.closureReserve,
        balance: updated.balance,
      },
      message: "Treasury reserves updated.",
    });
  } catch (error) {
    console.error("[HALL TREASURY POST]", error);
    return NextResponse.json(
      { success: false, error: "Reserve update failed" },
      { status: 500 },
    );
  }
}
