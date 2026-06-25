import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isFounder } from "@/lib/auth";

/* ============================================================
   GET /api/dividends — Global income dashboard
   All Halls combined. Monthly income. Tax summary. ROI calculator.
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = Math.min(Number(searchParams.get("months") || "12"), 36);
    const roiSimCommitment = searchParams.get("roiCommitment");
    const roiSimHallId = searchParams.get("roiHallId");

    // ── All user's ownerships ──
    const ownerships = await prisma.ownership.findMany({
      where: { userId: user.id },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            status: true,
            pool: { select: { vertical: true, listedPrice: true, trueCost: true } },
            treasury: { select: { balance: true, totalIn: true } },
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
        message: "No PAC ownerships found. Commit to a pool to start earning dividends.",
      });
    }

    const hallIds = ownerships.map((o) => o.hallId);

    // ── Monthly income breakdown ──
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const monthlyRevenue = await prisma.revenueLog.findMany({
      where: {
        hallId: { in: hallIds },
        createdAt: { gte: since },
      },
      select: {
        hallId: true,
        amount: true,
        communityNet: true,
        createdAt: true,
      },
    });

    const monthlyMap = new Map<string, {
      month: string;
      grossRevenue: number;
      personalShare: number;
      halls: Set<string>;
    }>();

    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { month: key, grossRevenue: 0, personalShare: 0, halls: new Set() });
    }

    for (const rev of monthlyRevenue) {
      const key = `${rev.createdAt.getFullYear()}-${String(rev.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!;
        entry.grossRevenue += Number(rev.amount);
        const ownership = ownerships.find((o) => o.hallId === rev.hallId);
        const pct = ownership?.percentage || ownership?.ownershipPercent || 0;
        entry.personalShare += (Number(rev.communityNet) * pct) / 100;
        entry.halls.add(rev.hallId);
      }
    }

    const monthlyBreakdown = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        month: m.month,
        grossRevenue: Number(m.grossRevenue.toFixed(2)),
        personalShare: Number(m.personalShare.toFixed(2)),
        activeHalls: m.halls.size,
      }));

    // ── Dividend aggregates ──
    const [unclaimedAgg, claimedAgg] = await prisma.$transaction([
      prisma.dividend.aggregate({
        where: { userId: user.id, status: "unclaimed" },
        _sum: { entitlement: true },
        _count: true,
      }),
      prisma.dividend.aggregate({
        where: { userId: user.id, status: "claimed" },
        _sum: { entitlement: true },
        _count: true,
      }),
    ]);

    const totalUnclaimed = Number(unclaimedAgg._sum.entitlement || 0);
    const totalClaimed = Number(claimedAgg._sum.entitlement || 0);
    const totalDistributed = totalUnclaimed + totalClaimed;

    // ── Total invested (sum of commitments) ──
    const totalInvested = ownerships.reduce((sum, o) => sum + Number(o.amount || 0), 0);

    // ── Annual projection (based on last 3-month avg) ──
    const last3Months = monthlyBreakdown.slice(-3);
    const avgMonthlyShare = last3Months.length > 0
      ? last3Months.reduce((sum, m) => sum + m.personalShare, 0) / last3Months.length
      : 0;
    const annualProjection = avgMonthlyShare * 12;

    // ── Overall ROI ──
    const overallROI = totalInvested > 0 ? (totalClaimed / totalInvested) * 100 : 0;

    // ── Tax summary (simplified 20% withholding estimate) ──
    const effectiveTaxRate = 0.20;
    const estimatedAnnualTax = annualProjection * effectiveTaxRate;

    // ── Per-hall breakdown ──
    const hallBreakdown = await Promise.all(
      ownerships.map(async (o) => {
        const [hallUnclaimed, hallClaimed, hallRevenue] = await prisma.$transaction([
          prisma.dividend.aggregate({
            where: { userId: user.id, hallId: o.hallId, status: "unclaimed" },
            _sum: { entitlement: true },
          }),
          prisma.dividend.aggregate({
            where: { userId: user.id, hallId: o.hallId, status: "claimed" },
            _sum: { entitlement: true },
          }),
          prisma.revenueLog.aggregate({
            where: { hallId: o.hallId },
            _sum: { amount: true, communityNet: true },
          }),
        ]);

        const unclaimed = Number(hallUnclaimed._sum.entitlement || 0);
        const claimed = Number(hallClaimed._sum.entitlement || 0);
        const invested = Number(o.amount || 0);
        const hallROI = invested > 0 ? ((claimed + unclaimed) / invested) * 100 : 0;

        return {
          hallId: o.hallId,
          hallName: o.hall?.name,
          vertical: o.hall?.pool?.vertical,
          status: o.hall?.status,
          ownershipPercent: Number(o.percentage || o.ownershipPercent || 0),
          invested: Number(invested.toFixed(2)),
          unclaimed: Number(unclaimed.toFixed(2)),
          claimed: Number(claimed.toFixed(2)),
          totalEarned: Number((claimed + unclaimed).toFixed(2)),
          hallROI: Number(hallROI.toFixed(2)),
          totalHallRevenue: Number(hallRevenue._sum.amount || 0),
          communityNetTotal: Number(hallRevenue._sum.communityNet || 0),
          listedPrice: o.hall?.pool?.listedPrice,
          trueCost: isFounder(user) ? o.hall?.pool?.trueCost : null, // Hidden from public
        };
      })
    );

    // ── ROI Simulator ──
    let roiSimulation = null;
    if (roiSimCommitment && roiSimHallId) {
      const targetHall = ownerships.find((o) => o.hallId === roiSimHallId);
      if (targetHall) {
        const commitment = Number(roiSimCommitment);
        const pct = targetHall.percentage || targetHall.ownershipPercent || 0;
        const avgMonthlyRevenue = avgMonthlyShare / (pct / 100); // reverse to get total hall revenue
        const projectedMonthly = (avgMonthlyRevenue * COMMUNITY_PCT * commitment) / (targetHall.hall?.pool?.listedPrice || 1);
        const projectedAnnual = projectedMonthly * 12;
        const projected5Year = projectedAnnual * 5;

        roiSimulation = {
          hallId: roiSimHallId,
          hallName: targetHall.hall?.name,
          commitment: Number(commitment.toFixed(2)),
          projectedMonthly: Number(projectedMonthly.toFixed(2)),
          projectedAnnual: Number(projectedAnnual.toFixed(2)),
          projected5Year: Number(projected5Year.toFixed(2)),
          breakEvenMonths: projectedMonthly > 0 ? Math.ceil(commitment / projectedMonthly) : null,
          annualYieldPct: commitment > 0 ? ((projectedAnnual / commitment) * 100).toFixed(2) : "0",
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
        claimRate: totalDistributed > 0 ? Number(((totalClaimed / totalDistributed) * 100).toFixed(2)) : 0,
        taxSummary: {
          estimatedAnnualTax: Number(estimatedAnnualTax.toFixed(2)),
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
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/dividends — ROI calculator (stateless)
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { hallId, commitment, projectedMonthlyRent, projectedAnnualRevenue } = body;

    if (!hallId || !commitment || Number(commitment) <= 0) {
      return NextResponse.json(
        { success: false, error: "hallId and positive commitment required" },
        { status: 400 }
      );
    }

    // ── Fetch hall data ──
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { listedPrice: true, trueCost: true, vertical: true } },
        ownerships: {
          where: { userId: user.id },
          select: { percentage: true, amount: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ success: false, error: "Hall not found" }, { status: 404 });
    }

    const listedPrice = Number(hall.pool?.listedPrice || 1);
    const commitmentNum = Number(commitment);
    const ownershipPct = (commitmentNum / listedPrice) * 100;

    // ── Historical revenue for this hall ──
    const revenueAgg = await prisma.revenueLog.aggregate({
      where: { hallId },
      _avg: { amount: true, communityNet: true },
      _count: true,
    });

    const avgMonthlyGross = Number(revenueAgg._avg.amount || 0);
    const avgMonthlyCommunity = Number(revenueAgg._avg.communityNet || 0);
    const recordCount = revenueAgg._count;

    // ── Use provided projections or historical averages ──
    const monthlyRent = projectedMonthlyRent ? Number(projectedMonthlyRent) : avgMonthlyGross;
    const annualRevenue = projectedAnnualRevenue ? Number(projectedAnnualRevenue) : avgMonthlyGross * 12;

    const monthlyCommunityShare = (monthlyRent * COMMUNITY_PCT * ownershipPct) / 100;
    const annualCommunityShare = monthlyCommunityShare * 12;
    const fiveYearTotal = annualCommunityShare * 5;
    const tenYearTotal = annualCommunityShare * 10;

    const breakEvenMonths = monthlyCommunityShare > 0 ? Math.ceil(commitmentNum / monthlyCommunityShare) : null;
    const annualYieldPct = commitmentNum > 0 ? (annualCommunityShare / commitmentNum) * 100 : 0;

    return NextResponse.json({
      success: true,
      simulation: {
        hallId,
        hallName: hall.name,
        vertical: hall.pool?.vertical,
        commitment: Number(commitmentNum.toFixed(2)),
        ownershipPercent: Number(ownershipPct.toFixed(4)),
        listedPrice: Number(listedPrice.toFixed(2)),
        basedOn: recordCount > 0 ? "historical_revenue" : "projected_inputs",
        recordCount,
        monthlyRent: Number(monthlyRent.toFixed(2)),
        annualRevenue: Number(annualRevenue.toFixed(2)),
        monthlyDividend: Number(monthlyCommunityShare.toFixed(2)),
        annualDividend: Number(annualCommunityShare.toFixed(2)),
        fiveYearTotal: Number(fiveYearTotal.toFixed(2)),
        tenYearTotal: Number(tenYearTotal.toFixed(2)),
        breakEvenMonths,
        annualYieldPct: Number(annualYieldPct.toFixed(2)),
        taxEstimate: Number((annualCommunityShare * 0.20).toFixed(2)),
        disclaimer: "Projections based on historical performance or user inputs. Not financial advice.",
      },
    });
  } catch (error) {
    console.error("[DIVIDENDS POST]", error);
    return NextResponse.json(
      { success: false, error: "ROI calculation failed" },
      { status: 500 }
    );
  }
}

const COMMUNITY_PCT = 0.80;