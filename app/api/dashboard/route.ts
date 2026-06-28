import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface DashboardResponse {
  success: boolean;
  sovereign?: any;
  pools?: any;
  exchange?: any;
  activity?: any[];
  tierProgress?: any;
  knot?: any;
  halls?: any[];
  oracle?: any[];
  error?: string;
}

/* ============================================================
   EXCHANGE SNAPSHOT (8th Ledger — VIN dead, LED active)
   ============================================================ */
async function getExchangeSnapshot() {
  const [volume24h, openOrders, tradeCount24h] = await prisma.$transaction([
    prisma.trade.aggregate({
      where: { executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count({ where: { status: { in: ["open", "partial"] } } }),
    prisma.trade.count({
      where: { executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    volume24h: Number(volume24h._sum.total || 0),
    tradeCount24h: volume24h._count || 0,
    openOrders,
    status: "active",
  };
}

/* ============================================================
   GET /api/dashboard — Sovereign command center (8th Ledger)
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<DashboardResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const [
      activeOwnerships,
      recentOwnerships,
      myOraclePredictions,
      myRewards,
      recentActivity,
      totalPools,
      activePools,
      myKnot,
      myInviteCode,
      myOwnerships,
    ] = await prisma.$transaction([
      prisma.ownership.findMany({
        where: { userId: user.id, status: "active" },
        orderBy: { createdAt: "desc" },
        include: {
          pool: { select: { poolId: true, name: true, verticalId: true, status: true, committed: true, target: true, closesAt: true } },
          hall: { select: { id: true, status: true, name: true } },
        },
      }),
      prisma.ownership.findMany({
        where: { userId: user.id, status: { in: ["dormant", "forfeited"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          pool: { select: { poolId: true, name: true, verticalId: true, assetValue: true, distributedAt: true } },
          hall: { select: { id: true, status: true } },
        },
      }),
      prisma.oraclePrediction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { forecast: { select: { id: true, title: true, status: true } } },
      }),
      prisma.referralReward.findMany({
        where: { toLedgerId: user.ledgerId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.activityEvent.findMany({
        where: { ledgerId: user.ledgerId },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.pool.count(),
      prisma.pool.count({ where: { status: "filling" } }),
      prisma.knotMember.findUnique({ where: { ledgerId: user.ledgerId } }),
      prisma.inviteCode.findFirst({ where: { ownerId: user.ledgerId } }),
      prisma.ownership.findMany({
        where: { userId: user.id, status: "active" },
        include: {
          pool: { select: { poolId: true, name: true, verticalId: true, status: true, imageUrl: true } },
          hall: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const exchange = await getExchangeSnapshot();

    const tierThresholds = [0, 1000, 5000, 15000, 35000, 75000, 150000, 300000, 600000];
    const currentThreshold = tierThresholds[user.tier - 1] || 0;
    const nextThreshold = tierThresholds[user.tier] || 999999;
    const totalCommitted = activeOwnerships.reduce((sum, o) => sum + o.amountCommitted, 0);
    const progressToNext = Math.min(100, Math.round(((totalCommitted - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

    const halls = myOwnerships.map((o) => ({
      hallId: o.hall?.id,
      poolId: o.pool.poolId,
      name: o.pool.name,
      verticalId: o.pool.verticalId,
      ownershipPercent: o.ownershipPercent,
      pacToken: o.pacToken,
      totalReturned: o.totalReturned,
      totalFromMarket: o.totalFromMarket,
      status: o.pool.status,
      hallStatus: o.hall?.status,
      imageUrl: o.pool.imageUrl,
    }));

    const response: DashboardResponse = {
      success: true,
      sovereign: {
        ledgerId: user.ledgerId,
        displayName: user.displayName,
        email: user.email,
        country: user.country,
        tier: user.tier,
        trustScore: user.trustScore,
        ledgerBalance: user.ledgerBalance,
        creditPool: user.creditPool,
        forgesCompleted: user.forgesCompleted,
        referrals: user.referrals,
        totalCommitted,
        lastLoginAt: user.lastLoginAt,
        kycTier: user.kycTier,
        kycStatus: user.kycStatus,
        legalName: user.legalName,
        isBanned: user.isBanned,
      },
      pools: {
        activeCount: activeOwnerships.length,
        totalPools,
        fillingPools: activePools,
        active: activeOwnerships.map((o) => ({
          poolId: o.pool.poolId,
          name: o.pool.name,
          verticalId: o.pool.verticalId,
          committed: o.amountCommitted,
          ownershipPercent: o.ownershipPercent,
          poolStatus: o.pool.status,
          poolCommitted: o.pool.committed,
          target: o.pool.target,
          fillPercentage: o.pool.target > 0 ? Math.round((o.pool.committed / o.pool.target) * 100) : 0,
          closesAt: o.pool.closesAt,
          hallId: o.hall?.id,
          hallStatus: o.hall?.status,
        })),
        history: recentOwnerships.map((o) => ({
          poolId: o.pool.poolId,
          name: o.pool.name,
          verticalId: o.pool.verticalId,
          committed: o.amountCommitted,
          ownershipPercent: o.ownershipPercent,
          status: o.status,
          assetValue: o.pool.assetValue,
          distributedAt: o.pool.distributedAt,
          hallId: o.hall?.id,
          hallStatus: o.hall?.status,
        })),
      },
      exchange,
      activity: recentActivity,
      tierProgress: {
        currentTier: user.tier,
        currentThreshold,
        nextThreshold,
        progressPercent: progressToNext,
        totalCommitted,
        toNextTier: Math.max(0, nextThreshold - totalCommitted),
      },
      knot: {
        isMember: !!myKnot,
        depth: myKnot?.depth || 0,
        totalCommitted: myKnot?.totalCommitted || 0,
        poolsWon: myKnot?.poolsWon || 0,
        inviteCode: myInviteCode?.code || null,
        inviteUses: myInviteCode?.uses || 0,
        inviteMax: myInviteCode?.maxUses || 50,
        pendingRewards: myRewards.filter((r) => r.status === "pending").reduce((a, r) => a + Number(r.rewardAmount), 0),
        paidRewards: myRewards.filter((r) => r.status === "paid").reduce((a, r) => a + Number(r.rewardAmount), 0),
      },
      halls,
      oracle: myOraclePredictions.map((p) => ({
        forecastId: p.forecast.id,
        title: p.forecast.title,
        forecastStatus: p.forecast.status,
        predictionStatus: p.status,
        pointsEarned: p.pointsEarned,
        vertical: p.vertical,
        country: p.country,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DASHBOARD]", error);
    return NextResponse.json<DashboardResponse>(
      { success: false, error: "Dashboard data unavailable" },
      { status: 500 }
    );
  }
}