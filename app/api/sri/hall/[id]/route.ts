import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHallAccess, requireAdmin, isAdminRole } from "@/lib/auth";

/* ============================================================
   SRI CALCULATION HELPERS (inline until lib/sri.ts is built)
   ============================================================ */

interface SRIDetail {
  votesCast: number;
  eligibleVoters: number;
  quorumPercentage: number;
}

interface SRIComponents {
  governanceActivity: number;
  revenueConsistency: number;
  dividendReliability: number;
  proposalQuality: number;
  dormancyRate: number;
  marketplaceVelocity: number;
}

interface SRIBreakdown {
  totalScore: number;
  tier: string;
  components: SRIComponents;
  details: Record<string, unknown>;
  recordedAt: string;
}

function getTier(score: number): string {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  if (score >= 40) return "bronze";
  return "at_risk";
}

async function calculateSri(hallId: string): Promise<SRIBreakdown> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      ownerships: { where: { status: "active" } },
      proposals: true,
      sriSnapshots: { orderBy: { recordedAt: "desc" }, take: 1 },
      pool: { include: { revenueLogs: true } },
      _count: { select: { ownerships: true } },
    },
  });

  if (!hall) throw new Error("Hall not found");

  const totalOwners = hall._count.ownerships;
  const activeOwners = hall.ownerships.length;

  // Governance Activity (25%): votes cast / eligible voters
  const proposalsWithVotes = hall.proposals.filter(
    (p) => p.voteCountYes + p.voteCountNo > 0,
  );
  const totalVotesCast = proposalsWithVotes.reduce(
    (sum, p) => sum + p.voteCountYes + p.voteCountNo,
    0,
  );
  const eligibleVotes = totalOwners * hall.proposals.length;
  const governanceActivity =
    eligibleVotes > 0 ? Math.round((totalVotesCast / eligibleVotes) * 100) : 0;

  // Revenue Consistency (25%): positive months / total months
  const revenueLogs = hall.pool.revenueLogs;
  const positiveMonths = revenueLogs.filter((r) => r.amount > 0).length;
  const totalMonths = revenueLogs.length || 1;
  const revenueConsistency = Math.round((positiveMonths / totalMonths) * 100);

  // Dividend Reliability (20%): on-time % (mock: 100% if any revenue exists)
  const dividendReliability = revenueLogs.length > 0 ? 100 : 0;

  // Proposal Quality (15%): pass rate
  const closedProposals = hall.proposals.filter((p) => p.status !== "pending");
  const passedProposals = closedProposals.filter(
    (p) => p.status === "passed",
  ).length;
  const proposalQuality =
    closedProposals.length > 0
      ? Math.round((passedProposals / closedProposals.length) * 100)
      : 0;

  // Dormancy Rate (10%): % inactive (inverted: lower dormancy = higher score)
  const inactiveOwners = totalOwners - activeOwners;
  const dormancyRate =
    totalOwners > 0
      ? Math.round(((totalOwners - inactiveOwners) / totalOwners) * 100)
      : 100;

  // Marketplace Velocity (5%): PAC turnover (mock: 100 if no listings, else calc)
  const listings = await prisma.ownershipListing.count({ where: { hallId } });
  const marketplaceVelocity =
    listings === 0 ? 100 : Math.max(0, 100 - listings * 5);

  // Weighted total
  const totalScore = Math.round(
    governanceActivity * 0.25 +
      revenueConsistency * 0.25 +
      dividendReliability * 0.2 +
      proposalQuality * 0.15 +
      dormancyRate * 0.1 +
      marketplaceVelocity * 0.05,
  );

  const components: SRIComponents = {
    governanceActivity,
    revenueConsistency,
    dividendReliability,
    proposalQuality,
    dormancyRate,
    marketplaceVelocity,
  };

  const details = {
    governanceActivity: {
      votesCast: totalVotesCast,
      eligibleVoters: totalOwners * hall.proposals.length,
      quorumPercentage: governanceActivity,
    },
    revenueConsistency: {
      positiveMonths,
      totalMonths,
      streak: 0,
    },
    dividendReliability: {
      onTime: revenueLogs.length,
      delayed: 0,
      missed: 0,
    },
    proposalQuality: {
      passed: passedProposals,
      total: closedProposals.length,
      avgTimeToDecision: 0,
    },
    dormancyRate: {
      inactiveOwners,
      totalOwners,
    },
    marketplaceVelocity: {
      pacTurnover: listings,
      avgHoldTime: 0,
    },
  };

  // Persist snapshot
  await prisma.sriSnapshot.create({
    data: {
      hallId,
      score: totalScore,
      governanceActivity,
      revenueConsistency,
      dividendReliability,
      proposalQuality,
      dormancyRate,
      marketplaceVelocity,
    },
  });

  // Update hall cache
  await prisma.hall.update({
    where: { id: hallId },
    data: { sriScore: totalScore },
  });

  return {
    totalScore,
    tier: getTier(totalScore),
    components,
    details,
    recordedAt: new Date().toISOString(),
  };
}

async function getLatestSriSnapshot(
  hallId: string,
): Promise<SRIBreakdown | null> {
  const snap = await prisma.sriSnapshot.findFirst({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
  });

  if (!snap) return null;

  return {
    totalScore: snap.score,
    tier: getTier(snap.score),
    components: {
      governanceActivity: snap.governanceActivity,
      revenueConsistency: snap.revenueConsistency,
      dividendReliability: snap.dividendReliability,
      proposalQuality: snap.proposalQuality,
      dormancyRate: snap.dormancyRate,
      marketplaceVelocity: snap.marketplaceVelocity,
    },
    details: {}, // details not stored in snapshot, recalc if needed
    recordedAt: snap.recordedAt.toISOString(),
  };
}

async function getSriHistory(hallId: string, months: number) {
  const snaps = await prisma.sriSnapshot.findMany({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
    take: months,
  });

  return snaps.reverse().map((s) => ({
    month: s.recordedAt.toLocaleString("en-US", { month: "short" }),
    score: s.score,
  }));
}

/* ============================================================
   GET /api/sri/hall/[id]
   ============================================================ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: hallId } = await params;

    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const access = await requireHallAccess(request, hallId);
    if (!access.success && !auth.isPrimaryAdmin && !isAdminRole(auth.role)) {
      return NextResponse.json(
        { error: "Hall access denied" },
        { status: 403 },
      );
    }

    // Get latest or calculate fresh
    let breakdown = await getLatestSriSnapshot(hallId);
    if (!breakdown) {
      breakdown = await calculateSri(hallId);
    }

    const history = await getSriHistory(hallId, 12);

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { pool: { select: { verticalId: true } } },
    });

    const verticalConfig = hall?.pool?.verticalId
      ? await prisma.verticalConfig.findUnique({
          where: { slug: hall.pool.verticalId },
        })
      : null;

    return NextResponse.json({
      hallId,
      hallName: hall?.name || "Unknown Hall",
      vertical: verticalConfig?.name || hall?.pool?.verticalId || "Unknown",
      current: {
        score: breakdown.totalScore,
        ...breakdown.components,
        recordedAt: breakdown.recordedAt,
      },
      history,
      restrictions: {
        canProposeHires: breakdown.totalScore >= 60,
        dividendsPaused: breakdown.totalScore < 40,
        marketplaceFee:
          breakdown.tier === "platinum"
            ? 0.25
            : breakdown.tier === "gold"
              ? 0.5
              : 1.0,
      },
    });
  } catch (error) {
    console.error("[SRI HALL GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch SRI", detail: String(error) },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/sri/hall/[id]
   Recalculate. Admin only.
   ============================================================ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: hallId } = await params;

    const admin = await requireAdmin(request);
    if (!admin.success) {
      return NextResponse.json(
        { error: "Admin authority required" },
        { status: 403 },
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { name: true, poolId: true },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const breakdown = await calculateSri(hallId);

    await prisma.auditEntry.create({
      data: {
        type: "sri_recalculated",
        description: `SRI recalculated for Hall ${hallId}. New score: ${breakdown.totalScore} (${breakdown.tier}).`,
        txHash: `SRI-${hallId}-${Date.now()}`,
        poolId: hall.poolId || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      hallId,
      hallName: hall.name,
      current: {
        score: breakdown.totalScore,
        ...breakdown.components,
        recordedAt: breakdown.recordedAt,
      },
      tier: breakdown.tier,
      restrictions: {
        canProposeHires: breakdown.totalScore >= 60,
        dividendsPaused: breakdown.totalScore < 40,
        marketplaceFee:
          breakdown.tier === "platinum"
            ? 0.25
            : breakdown.tier === "gold"
              ? 0.5
              : 1.0,
      },
    });
  } catch (error) {
    console.error("[SRI HALL POST]", error);
    return NextResponse.json(
      { error: "Failed to recalculate SRI", detail: String(error) },
      { status: 500 },
    );
  }
}
