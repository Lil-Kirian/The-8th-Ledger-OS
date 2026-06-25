import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHallAccess } from "@/lib/auth";

/* ============================================================
   GET /api/dividends/hall/[id]
   Get dividend history for a specific hall.
   Requires hall ownership or admin access.
   ============================================================ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;

    // Auth check
    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Hall access check
    const access = await requireHallAccess(request, hallId);
    if (!access.success) {
      return NextResponse.json({ error: "Hall access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get hall with pool info
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { poolId: true, name: true, verticalId: true } },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Get revenue logs with distributions
    const revenueLogs = await prisma.revenueLog.findMany({
      where: {
        poolId: hall.poolId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        dividendDistributions: {
          include: {
            entries: {
              include: {
                ownership: {
                  select: {
                    id: true,
                    userId: true,
                    ledgerId: true,
                    ownershipPercent: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get user's ownership in this hall for personalized view
    const userOwnership = await prisma.ownership.findFirst({
      where: {
        hallId,
        userId: auth.userId,
        status: "active",
      },
      select: {
        id: true,
        ownershipPercent: true,
        accumulatedDividends: true,
        totalReturned: true,
        dynamicValue: true,
      },
    });

    // Get hall treasury snapshot
    const treasury = await prisma.hallTreasury.findUnique({
      where: { hallId },
    });

    // Get total stats
    const totalRevenueLogs = await prisma.revenueLog.count({
      where: { poolId: hall.poolId },
    });

    const totalDistributed = await prisma.dividendDistribution.aggregate({
      where: { poolId: hall.poolId },
      _sum: { totalAmount: true },
    });

    const totalDividendEntries = await prisma.dividendEntry.count({
      where: {
        distribution: { poolId: hall.poolId },
      },
    });

    // Format response
    const formattedLogs = revenueLogs.map((log) => ({
      revenueLogId: log.id,
      amount: log.amount,
      source: log.source,
      ledgerTithe: log.ledgerFee,
      payrollDeducted: log.payrollDeducted,
      netAfterPayroll: log.netAfterPayroll,
      distributed: log.distributed,
      distributionTx: log.distributionTx,
      createdAt: log.createdAt,
      distributions: log.dividendDistributions.map((dist) => ({
        distributionId: dist.id,
        totalAmount: dist.totalAmount,
        totalOwners: dist.totalOwners,
        distributedAt: dist.distributedAt,
        entries: dist.entries.map((entry) => ({
          entryId: entry.id,
          ownershipId: entry.ownershipId,
          userId: entry.ownership?.userId,
          ledgerId: entry.ownership?.ledgerId,
          ownershipPercent: entry.ownership?.ownershipPercent,
          amount: entry.amount,
          claimed: entry.claimed,
          claimedAt: entry.claimedAt,
        })),
      })),
    }));

    // Calculate user's lifetime earnings from this hall
    const userEntries = userOwnership
      ? await prisma.dividendEntry.findMany({
          where: {
            ownershipId: userOwnership.id,
            claimed: true,
          },
          select: { amount: true },
        })
      : [];

    const userLifetimeEarnings = userEntries.reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
      hall: {
        id: hall.id,
        name: hall.name || hall.pool?.name,
        poolId: hall.poolId,
        verticalId: hall.pool?.verticalId,
      },
      treasury: treasury
        ? {
            balance: treasury.balance,
            totalRevenue: treasury.totalRevenue,
            totalDistributed: treasury.totalDistributed,
            monthlyRevenue: treasury.monthlyRevenue,
            payrollReserve: treasury.payrollReserve,
            pirDebt: treasury.pirDebt,
          }
        : null,
      stats: {
        totalRevenueLogs,
        totalDistributedAmount: totalDistributed._sum.totalAmount || 0,
        totalDividendEntries,
      },
      userOwnership: userOwnership
        ? {
            ownershipId: userOwnership.id,
            ownershipPercent: userOwnership.ownershipPercent,
            accumulatedDividends: userOwnership.accumulatedDividends,
            totalReturned: userOwnership.totalReturned,
            dynamicValue: userOwnership.dynamicValue,
            lifetimeEarnings: userLifetimeEarnings,
          }
        : null,
      revenueLogs: formattedLogs,
      pagination: {
        limit,
        offset,
        total: totalRevenueLogs,
        hasMore: offset + limit < totalRevenueLogs,
      },
    });
  } catch (error) {
    console.error("[DIVIDEND HALL]", error);
    return NextResponse.json(
      { error: "Failed to fetch dividend history", detail: String(error) },
      { status: 500 }
    );
  }
}