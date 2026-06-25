import { prisma } from "./prisma";

/* ============================================================
   TYPES
   ============================================================ */

export interface SriComponent {
  name: string;
  weight: number; // 0-1
  rawScore: number; // 0-100
  weightedScore: number;
  detail: string;
}

export interface SriBreakdown {
  totalScore: number;
  tier: SriTier;
  badge: string;
  status: string;
  components: SriComponent[];
  recordedAt: Date;
}

export type SriTier = "platinum" | "gold" | "silver" | "bronze" | "at_risk";

export const SRI_TIERS: Record<
  SriTier,
  { min: number; max: number; badge: string; label: string; effect: string }
> = {
  platinum: {
    min: 90,
    max: 100,
    badge: "👑",
    label: "Platinum",
    effect: "Early access to next cycle pools, featured in Agora, reduced marketplace fees (0.25%)",
  },
  gold: {
    min: 75,
    max: 89,
    badge: "🥇",
    label: "Gold",
    effect: "Reduced marketplace fees (0.5% vs 1%), priority support",
  },
  silver: {
    min: 60,
    max: 74,
    badge: "🥈",
    label: "Silver",
    effect: "Standard operation",
  },
  bronze: {
    min: 40,
    max: 59,
    badge: "🥉",
    label: "Bronze",
    effect: "Restricted: cannot propose new hires, only maintenance votes",
  },
  at_risk: {
    min: 0,
    max: 39,
    badge: "⚠️",
    label: "At Risk",
    effect: "8th Ledger oversight mode. Dividend distribution paused until reforms complete.",
  },
};

/* ============================================================
   WEIGHTS
   ============================================================ */

const SRI_WEIGHTS = {
  governanceActivity: 0.25,
  revenueConsistency: 0.25,
  dividendReliability: 0.20,
  proposalQuality: 0.15,
  dormancyRate: 0.10,
  marketplaceVelocity: 0.05,
} as const;

/* ============================================================
   PURE FUNCTIONS
   ============================================================ */

/**
 * Get tier from score.
 */
export function getSriTier(score: number): SriTier {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  if (score >= 40) return "bronze";
  return "at_risk";
}

/**
 * Get tier metadata.
 */
export function getSriTierMeta(score: number) {
  const tier = getSriTier(score);
  return SRI_TIERS[tier];
}

/**
 * Get status text from score.
 */
export function getSriStatus(score: number): string {
  if (score >= 80) return "HEALTHY & GROWING";
  if (score >= 60) return "STABLE";
  if (score >= 40) return "NEEDS ATTENTION";
  return "CRITICAL — REFORMS REQUIRED";
}

/* ============================================================
   COMPONENT CALCULATORS
   ============================================================ */

/**
 * Governance Activity (25%)
 * Votes cast / eligible voters across all proposals in last 90 days.
 */
async function calcGovernanceActivity(hallId: string): Promise<{ score: number; detail: string }> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const proposals = await prisma.proposal.findMany({
    where: {
      hallId,
      createdAt: { gte: ninetyDaysAgo },
      status: { in: ["passed", "rejected", "executed"] },
    },
    include: {
      votes: { select: { userId: true } },
    },
  });

  if (proposals.length === 0) {
    return { score: 50, detail: "No votes in last 90 days — neutral score" };
  }

  const totalOwners = await prisma.ownership.count({
    where: { hallId, status: "active" },
  });

  if (totalOwners === 0) {
    return { score: 0, detail: "No active owners" };
  }

  let totalVoteRatio = 0;

  for (const proposal of proposals) {
    const uniqueVoters = new Set(proposal.votes.map((v) => v.userId)).size;
    totalVoteRatio += uniqueVoters / totalOwners;
  }

  const avgTurnout = totalVoteRatio / proposals.length;
  const score = Math.round(avgTurnout * 100);

  return {
    score,
    detail: `${Math.round(avgTurnout * 100)}% average voter turnout across ${proposals.length} proposals`,
  };
}

/**
 * Revenue Consistency (25%)
 * Months with positive revenue vs total months since first revenue.
 */
async function calcRevenueConsistency(hallId: string): Promise<{ score: number; detail: string }> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: {
      pool: { hall: { id: hallId } },
    },
    orderBy: { createdAt: "asc" },
    select: { amount: true, createdAt: true },
  });

  if (revenueLogs.length === 0) {
    return { score: 50, detail: "No revenue history — neutral score" };
  }

  const positiveMonths = new Set(
    revenueLogs.filter((r) => r.amount > 0).map((r) => `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`)
  ).size;

  const totalMonths = new Set(
    revenueLogs.map((r) => `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`)
  ).size;

  const score = totalMonths > 0 ? Math.round((positiveMonths / totalMonths) * 100) : 50;

  return {
    score,
    detail: `${positiveMonths}/${totalMonths} months with positive revenue`,
  };
}

/**
 * Dividend Reliability (20%)
 * On-time dividend % vs delayed/missed.
 * We track via RevenueLog.distributed flag.
 */
async function calcDividendReliability(hallId: string): Promise<{ score: number; detail: string }> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: {
      pool: { hall: { id: hallId } },
    },
    select: { distributed: true, createdAt: true },
  });

  if (revenueLogs.length === 0) {
    return { score: 50, detail: "No dividend history — neutral score" };
  }

  const onTime = revenueLogs.filter((r) => r.distributed).length;
  const total = revenueLogs.length;
  const score = Math.round((onTime / total) * 100);

  return {
    score,
    detail: `${onTime}/${total} revenue logs distributed on time`,
  };
}

/**
 * Proposal Quality (15%)
 * Pass rate of proposals in last 90 days.
 */
async function calcProposalQuality(hallId: string): Promise<{ score: number; detail: string }> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const proposals = await prisma.proposal.findMany({
    where: {
      hallId,
      createdAt: { gte: ninetyDaysAgo },
      status: { in: ["passed", "rejected", "executed", "cancelled"] },
    },
    select: { status: true },
  });

  if (proposals.length === 0) {
    return { score: 50, detail: "No proposals in last 90 days — neutral score" };
  }

  const passed = proposals.filter((p) => p.status === "passed" || p.status === "executed").length;
  const score = Math.round((passed / proposals.length) * 100);

  return {
    score,
    detail: `${passed}/${proposals.length} proposals passed (${score}%)`,
  };
}

/**
 * Dormancy Rate (10%)
 * % of inactive owners. Inverted: low dormancy = high score.
 */
async function calcDormancyRate(hallId: string): Promise<{ score: number; detail: string }> {
  const totalOwners = await prisma.ownership.count({
    where: { hallId, status: "active" },
  });

  if (totalOwners === 0) {
    return { score: 0, detail: "No active owners" };
  }

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const activeVoters = await prisma.vote.groupBy({
    by: ["userId"],
    where: {
      proposal: { hallId },
      createdAt: { gte: sixMonthsAgo },
    },
    _count: { userId: true },
  });

  const dormantCount = totalOwners - activeVoters.length;
  const dormancyPct = dormantCount / totalOwners;

  // Invert: 0% dormant = 100 score, 100% dormant = 0 score
  const score = Math.round((1 - dormancyPct) * 100);

  return {
    score,
    detail: `${dormantCount}/${totalOwners} owners inactive (${Math.round(dormancyPct * 100)}% dormancy)`,
  };
}

/**
 * Marketplace Velocity (5%)
 * PAC turnover rate in last 90 days. Low turnover = stable = high score.
 */
async function calcMarketplaceVelocity(hallId: string): Promise<{ score: number; detail: string }> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const totalOwnerships = await prisma.ownership.count({
    where: { hallId, status: "active" },
  });

  if (totalOwnerships === 0) {
    return { score: 50, detail: "No ownerships — neutral score" };
  }

  const listings = await prisma.ownershipListing.count({
    where: {
      hallId,
      status: { in: ["active", "sold"] },
      listedAt: { gte: ninetyDaysAgo },
    },
  });

  // Turnover rate: listings / total ownerships
  const turnoverRate = listings / totalOwnerships;
  // Invert: low turnover = high score. Cap at 100% turnover = 0 score.
  const score = Math.max(0, Math.round((1 - Math.min(turnoverRate, 1)) * 100));

  return {
    score,
    detail: `${listings} listings / ${totalOwnerships} ownerships (${Math.round(turnoverRate * 100)}% turnover)`,
  };
}

/* ============================================================
   MAIN CALCULATION
   ============================================================ */

/**
 * Calculate complete SRI for a hall.
 * Returns breakdown + saves snapshot.
 */
export async function calculateSri(hallId: string, saveSnapshot: boolean = true): Promise<SriBreakdown> {
  const [
    governance,
    revenue,
    dividends,
    proposals,
    dormancy,
    marketplace,
  ] = await Promise.all([
    calcGovernanceActivity(hallId),
    calcRevenueConsistency(hallId),
    calcDividendReliability(hallId),
    calcProposalQuality(hallId),
    calcDormancyRate(hallId),
    calcMarketplaceVelocity(hallId),
  ]);

  const components: SriComponent[] = [
    {
      name: "Governance Activity",
      weight: SRI_WEIGHTS.governanceActivity,
      rawScore: governance.score,
      weightedScore: Math.round(governance.score * SRI_WEIGHTS.governanceActivity),
      detail: governance.detail,
    },
    {
      name: "Revenue Consistency",
      weight: SRI_WEIGHTS.revenueConsistency,
      rawScore: revenue.score,
      weightedScore: Math.round(revenue.score * SRI_WEIGHTS.revenueConsistency),
      detail: revenue.detail,
    },
    {
      name: "Dividend Reliability",
      weight: SRI_WEIGHTS.dividendReliability,
      rawScore: dividends.score,
      weightedScore: Math.round(dividends.score * SRI_WEIGHTS.dividendReliability),
      detail: dividends.detail,
    },
    {
      name: "Proposal Quality",
      weight: SRI_WEIGHTS.proposalQuality,
      rawScore: proposals.score,
      weightedScore: Math.round(proposals.score * SRI_WEIGHTS.proposalQuality),
      detail: proposals.detail,
    },
    {
      name: "Dormancy Rate",
      weight: SRI_WEIGHTS.dormancyRate,
      rawScore: dormancy.score,
      weightedScore: Math.round(dormancy.score * SRI_WEIGHTS.dormancyRate),
      detail: dormancy.detail,
    },
    {
      name: "Marketplace Velocity",
      weight: SRI_WEIGHTS.marketplaceVelocity,
      rawScore: marketplace.score,
      weightedScore: Math.round(marketplace.score * SRI_WEIGHTS.marketplaceVelocity),
      detail: marketplace.detail,
    },
  ];

  const totalScore = components.reduce((sum, c) => sum + c.weightedScore, 0);
  const clampedScore = Math.max(0, Math.min(100, totalScore));
  const tier = getSriTier(clampedScore);
  const meta = SRI_TIERS[tier];

  const breakdown: SriBreakdown = {
    totalScore: clampedScore,
    tier,
    badge: meta.badge,
    status: getSriStatus(clampedScore),
    components,
    recordedAt: new Date(),
  };

  if (saveSnapshot) {
    await prisma.sriSnapshot.create({
      data: {
        hallId,
        score: clampedScore,
        governanceActivity: governance.score,
        revenueConsistency: revenue.score,
        dividendReliability: dividends.score,
        proposalQuality: proposals.score,
        dormancyRate: dormancy.score,
        marketplaceVelocity: marketplace.score,
      },
    });

    // Update hall's current SRI score
    await prisma.hall.update({
      where: { id: hallId },
      data: { sriScore: clampedScore },
    });
  }

  return breakdown;
}

/* ============================================================
   QUERIES
   ============================================================ */

/**
 * Get latest SRI snapshot for a hall.
 */
export async function getLatestSriSnapshot(hallId: string): Promise<SriBreakdown | null> {
  const snapshot = await prisma.sriSnapshot.findFirst({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
  });

  if (!snapshot) return null;

  const tier = getSriTier(snapshot.score);
  const meta = SRI_TIERS[tier];

  return {
    totalScore: snapshot.score,
    tier,
    badge: meta.badge,
    status: getSriStatus(snapshot.score),
    components: [
      { name: "Governance Activity", weight: 0.25, rawScore: snapshot.governanceActivity, weightedScore: Math.round(snapshot.governanceActivity * 0.25), detail: "" },
      { name: "Revenue Consistency", weight: 0.25, rawScore: snapshot.revenueConsistency, weightedScore: Math.round(snapshot.revenueConsistency * 0.25), detail: "" },
      { name: "Dividend Reliability", weight: 0.20, rawScore: snapshot.dividendReliability, weightedScore: Math.round(snapshot.dividendReliability * 0.20), detail: "" },
      { name: "Proposal Quality", weight: 0.15, rawScore: snapshot.proposalQuality, weightedScore: Math.round(snapshot.proposalQuality * 0.15), detail: "" },
      { name: "Dormancy Rate", weight: 0.10, rawScore: snapshot.dormancyRate, weightedScore: Math.round(snapshot.dormancyRate * 0.10), detail: "" },
      { name: "Marketplace Velocity", weight: 0.05, rawScore: snapshot.marketplaceVelocity, weightedScore: Math.round(snapshot.marketplaceVelocity * 0.05), detail: "" },
    ],
    recordedAt: snapshot.recordedAt,
  };
}

/**
 * Get SRI history for a hall (last N snapshots).
 */
export async function getSriHistory(hallId: string, limit: number = 12): Promise<Array<{
  score: number;
  tier: SriTier;
  recordedAt: Date;
}>> {
  const snapshots = await prisma.sriSnapshot.findMany({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });

  return snapshots.map((s) => ({
    score: s.score,
    tier: getSriTier(s.score),
    recordedAt: s.recordedAt,
  }));
}

/**
 * Get global SRI leaderboard — all halls ranked by score.
 */
export async function getGlobalSriLeaderboard(limit: number = 50): Promise<Array<{
  hallId: string;
  hallName: string;
  score: number;
  tier: SriTier;
  badge: string;
  verticalId: string | null;
}>> {
  const halls = await prisma.hall.findMany({
    where: { status: { not: "dissolved" } },
    include: {
      pool: { select: { verticalId: true, name: true } },
      sriSnapshots: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
    orderBy: { sriScore: "desc" },
    take: limit,
  });

  return halls.map((h) => {
    const tier = getSriTier(h.sriScore);
    return {
      hallId: h.id,
      hallName: h.name || h.pool?.name || "Unknown Hall",
      score: h.sriScore,
      tier,
      badge: SRI_TIERS[tier].badge,
      verticalId: h.pool?.verticalId || null,
    };
  });
}

/**
 * Check if hall is restricted (Bronze or At Risk).
 */
export function isHallRestricted(sriScore: number): boolean {
  return sriScore < 60;
}

/**
 * Check if dividends should be paused (At Risk).
 */
export function areDividendsPaused(sriScore: number): boolean {
  return sriScore < 40;
}