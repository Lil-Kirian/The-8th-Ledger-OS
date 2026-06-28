import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isFounder } from "@/lib/auth";

const COMMUNITY_PCT = 0.8;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const months = Math.min(Number(searchParams.get("months") || "12"), 36);
    const roiSimCommitment = searchParams.get("roiCommitment");
    const roiSimHallId = searchParams.get("roiHallId");

    const ownerships = await prisma.ownership.findMany({
      where: { userId: user.id, status: { not: "forfeited" } },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            status: true,
            pool: {
              select: {
                id: true,
                poolId: true,
                verticalId: true,
                listedPrice: true,
                trueCost: true,
              },
            },
            hallTreasury: { select: { balance: true, totalRevenue: true } },
          },
        },
      },
    });

    if (ownerships.length === 0) {
      return NextResponse.json({
        success: true,
        portfolio: {
          halls: [],
          totalMonthlyIncome: 0,
          annualProjection: 0,
          totalUnclaimed: 0,
          totalClaimed: 0,
          totalInvested: 0,
          overallROI: 0,
          taxSummary: { estimatedAnnualTax: 0, effectiveRate: 0 },
        },
        message:
          "No PAC ownerships found. Commit to a pool to start earning dividends.",
      });
    }

    const ownershipIds = ownerships.map((ownership) => ownership.id);
    const poolIds = Array.from(
      new Set(ownerships.map((ownership) => ownership.poolId)),
    );
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const [monthlyRevenue, dividendEntries] = await prisma.$transaction([
      prisma.revenueLog.findMany({
        where: { poolId: { in: poolIds }, createdAt: { gte: since } },
        select: {
          poolId: true,
          amount: true,
          communityNet: true,
          createdAt: true,
        },
      }),
      prisma.dividendEntry.findMany({
        where: { ownershipId: { in: ownershipIds } },
        select: { ownershipId: true, amount: true, claimed: true },
      }),
    ]);

    const ownershipByPool = new Map(
      ownerships.map((ownership) => [ownership.poolId, ownership]),
    );
    const monthlyMap = new Map<
      string,
      {
        month: string;
        grossRevenue: number;
        personalShare: number;
        halls: Set<string>;
      }
    >();

    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, {
        month: key,
        grossRevenue: 0,
        personalShare: 0,
        halls: new Set(),
      });
    }

    for (const revenue of monthlyRevenue) {
      const key = `${revenue.createdAt.getFullYear()}-${String(revenue.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key);
      const ownership = ownershipByPool.get(revenue.poolId);
      if (!entry || !ownership) continue;

      entry.grossRevenue += revenue.amount;
      entry.personalShare +=
        (revenue.communityNet * ownership.ownershipPercent) / 100;
      if (ownership.hallId) entry.halls.add(ownership.hallId);
    }

    const monthlyBreakdown = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((month) => ({
        month: month.month,
        grossRevenue: Number(month.grossRevenue.toFixed(2)),
        personalShare: Number(month.personalShare.toFixed(2)),
        activeHalls: month.halls.size,
      }));

    const totalUnclaimed = dividendEntries
      .filter((entry) => !entry.claimed)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalClaimed = dividendEntries
      .filter((entry) => entry.claimed)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalDistributed = totalUnclaimed + totalClaimed;
    const totalInvested = ownerships.reduce(
      (sum, ownership) => sum + ownership.amountCommitted,
      0,
    );
    const last3Months = monthlyBreakdown.slice(-3);
    const avgMonthlyShare =
      last3Months.length > 0
        ? last3Months.reduce((sum, month) => sum + month.personalShare, 0) /
          last3Months.length
        : 0;
    const annualProjection = avgMonthlyShare * 12;
    const overallROI =
      totalInvested > 0 ? (totalClaimed / totalInvested) * 100 : 0;
    const effectiveTaxRate = 0.2;
    const founder = await isFounder(user);

    const hallBreakdown = await Promise.all(
      ownerships.map(async (ownership) => {
        const [hallRevenue, hallEntries] = await prisma.$transaction([
          prisma.revenueLog.aggregate({
            where: { poolId: ownership.poolId },
            _sum: { amount: true, communityNet: true },
          }),
          prisma.dividendEntry.findMany({
            where: { ownershipId: ownership.id },
            select: { amount: true, claimed: true },
          }),
        ]);

        const unclaimed = hallEntries
          .filter((entry) => !entry.claimed)
          .reduce((sum, entry) => sum + entry.amount, 0);
        const claimed = hallEntries
          .filter((entry) => entry.claimed)
          .reduce((sum, entry) => sum + entry.amount, 0);
        const invested = ownership.amountCommitted;
        const hallROI =
          invested > 0 ? ((claimed + unclaimed) / invested) * 100 : 0;

        return {
          hallId: ownership.hallId,
          hallName: ownership.hall?.name,
          vertical: ownership.hall?.pool?.verticalId,
          status: ownership.hall?.status,
          ownershipPercent: Number(ownership.ownershipPercent.toFixed(4)),
          invested: Number(invested.toFixed(2)),
          unclaimed: Number(unclaimed.toFixed(2)),
          claimed: Number(claimed.toFixed(2)),
          totalEarned: Number((claimed + unclaimed).toFixed(2)),
          hallROI: Number(hallROI.toFixed(2)),
          totalHallRevenue: Number(hallRevenue._sum.amount || 0),
          communityNetTotal: Number(hallRevenue._sum.communityNet || 0),
          listedPrice: ownership.hall?.pool?.listedPrice,
          trueCost: founder ? ownership.hall?.pool?.trueCost : null,
        };
      }),
    );

    let roiSimulation = null;
    if (roiSimCommitment && roiSimHallId) {
      const targetOwnership = ownerships.find(
        (ownership) => ownership.hallId === roiSimHallId,
      );
      if (targetOwnership) {
        const commitment = Number(roiSimCommitment);
        const pct = targetOwnership.ownershipPercent || 0;
        const avgMonthlyRevenue = pct > 0 ? avgMonthlyShare / (pct / 100) : 0;
        const listedPrice = targetOwnership.hall?.pool?.listedPrice || 1;
        const projectedMonthly =
          (avgMonthlyRevenue * COMMUNITY_PCT * commitment) / listedPrice;
        const projectedAnnual = projectedMonthly * 12;

        roiSimulation = {
          hallId: roiSimHallId,
          hallName: targetOwnership.hall?.name,
          commitment: Number(commitment.toFixed(2)),
          projectedMonthly: Number(projectedMonthly.toFixed(2)),
          projectedAnnual: Number(projectedAnnual.toFixed(2)),
          projected5Year: Number((projectedAnnual * 5).toFixed(2)),
          breakEvenMonths:
            projectedMonthly > 0
              ? Math.ceil(commitment / projectedMonthly)
              : null,
          annualYieldPct:
            commitment > 0
              ? ((projectedAnnual / commitment) * 100).toFixed(2)
              : "0",
        };
      }
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        totalHalls: ownerships.length,
        halls: hallBreakdown,
        monthlyBreakdown,
        totalMonthlyIncome: Number(avgMonthlyShare.toFixed(2)),
        annualProjection: Number(annualProjection.toFixed(2)),
        totalUnclaimed: Number(totalUnclaimed.toFixed(2)),
        totalClaimed: Number(totalClaimed.toFixed(2)),
        totalDistributed: Number(totalDistributed.toFixed(2)),
        totalInvested: Number(totalInvested.toFixed(2)),
        overallROI: Number(overallROI.toFixed(2)),
        claimRate:
          totalDistributed > 0
            ? Number(((totalClaimed / totalDistributed) * 100).toFixed(2))
            : 0,
        taxSummary: {
          estimatedAnnualTax: Number(
            (annualProjection * effectiveTaxRate).toFixed(2),
          ),
          effectiveRate: `${(effectiveTaxRate * 100).toFixed(0)}%`,
          disclaimer: "Consult a tax professional. This is an estimate only.",
        },
        roiSimulation,
      },
    });
  } catch (error) {
    console.error("[DIVIDENDS GET]", error);
    return NextResponse.json(
      { success: false, error: "Dividend dashboard unreachable" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { hallId, commitment, projectedMonthlyRent, projectedAnnualRevenue } =
      body;
    if (!hallId || !commitment || Number(commitment) <= 0) {
      return NextResponse.json(
        { success: false, error: "hallId and positive commitment required" },
        { status: 400 },
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: {
          select: {
            id: true,
            listedPrice: true,
            trueCost: true,
            verticalId: true,
          },
        },
        ownerships: {
          where: { userId: user.id },
          select: { ownershipPercent: true, amountCommitted: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    const listedPrice = Number(hall.pool?.listedPrice || 1);
    const commitmentNum = Number(commitment);
    const ownershipPct = (commitmentNum / listedPrice) * 100;
    const revenueAgg = await prisma.revenueLog.aggregate({
      where: { poolId: hall.poolId },
      _avg: { amount: true, communityNet: true },
      _count: { id: true },
    });

    const avgMonthlyGross = Number(revenueAgg._avg.amount || 0);
    const recordCount = revenueAgg._count.id;
    const monthlyRent = projectedMonthlyRent
      ? Number(projectedMonthlyRent)
      : avgMonthlyGross;
    const annualRevenue = projectedAnnualRevenue
      ? Number(projectedAnnualRevenue)
      : avgMonthlyGross * 12;
    const monthlyCommunityShare =
      (monthlyRent * COMMUNITY_PCT * ownershipPct) / 100;
    const annualCommunityShare = monthlyCommunityShare * 12;
    const breakEvenMonths =
      monthlyCommunityShare > 0
        ? Math.ceil(commitmentNum / monthlyCommunityShare)
        : null;
    const annualYieldPct =
      commitmentNum > 0 ? (annualCommunityShare / commitmentNum) * 100 : 0;

    return NextResponse.json({
      success: true,
      simulation: {
        hallId,
        hallName: hall.name,
        vertical: hall.pool?.verticalId,
        commitment: Number(commitmentNum.toFixed(2)),
        ownershipPercent: Number(ownershipPct.toFixed(4)),
        listedPrice: Number(listedPrice.toFixed(2)),
        basedOn: recordCount > 0 ? "historical_revenue" : "projected_inputs",
        recordCount,
        monthlyRent: Number(monthlyRent.toFixed(2)),
        annualRevenue: Number(annualRevenue.toFixed(2)),
        monthlyDividend: Number(monthlyCommunityShare.toFixed(2)),
        annualDividend: Number(annualCommunityShare.toFixed(2)),
        fiveYearTotal: Number((annualCommunityShare * 5).toFixed(2)),
        tenYearTotal: Number((annualCommunityShare * 10).toFixed(2)),
        breakEvenMonths,
        annualYieldPct: Number(annualYieldPct.toFixed(2)),
        taxEstimate: Number((annualCommunityShare * 0.2).toFixed(2)),
        disclaimer:
          "Projections based on historical performance or user inputs. Not financial advice.",
      },
    });
  } catch (error) {
    console.error("[DIVIDENDS POST]", error);
    return NextResponse.json(
      { success: false, error: "ROI calculation failed" },
      { status: 500 },
    );
  }
}
