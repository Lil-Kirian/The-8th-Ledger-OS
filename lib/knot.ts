/* ============================================================
   8TH LEDGER — KNOT ENGINE V3.2
   Referral rewards, Oracle standing, network math
   ============================================================ */

import { round2, clamp } from "./utils";

/* ============================================================
   CONSTANTS — Knot Reward Tiers
   ============================================================ */

export const KNOT_REWARDS = {
  COMMIT: [0.05, 0.02, 0.01] as const,
  WIN:    [0.02, 0.01, 0.005] as const,
  FORGE:  [0.01, 0.005, 0.0025] as const,
  MAX_DEPTH: 3,
} as const;

export const ORACLE_CONSTANTS = {
  POINTS_CORRECT: 10,
  POINTS_CORRECT_STREAK_5: 15,
  POINTS_CORRECT_STREAK_10: 25,
  POINTS_CORRECT_STREAK_25: 50,
  POINTS_CORRECT_STREAK_50: 100,
  POINTS_CORRECT_STREAK_100: 250,
  STREAK_BONUS_MULTIPLIER: [1, 1.5, 2, 2.5, 3, 5] as const,
} as const;

/* ============================================================
   TYPE DEFINITIONS
   ============================================================ */

export type ActivityType = "commit" | "win" | "forge";

export interface RewardCalculation {
  depth: number;
  rate: number;
  amount: number;
  reward: number;
}

export interface NetworkNode {
  ledgerId: string;
  referredBy?: string;
}

export interface NetworkMember extends NetworkNode {
  totalCommitted?: number;
}

export interface NetworkValueResult {
  totalMembers: number;
  totalCommitted: number;
  byDepth: Record<number, number>;
}

export interface OracleForecastStake {
  vertical: string;
  country: string;
  count: number; // number of predictors, not money
}

export interface OracleStandingCalculation {
  ledgerId: string;
  correctCount: number;
  totalPredictions: number;
  streak: number;
  pointsEarned: number;
  tier: "novice" | "seer" | "oracle" | "prophet";
}

/* ============================================================
   REFERRAL REWARD CALCULATOR
   ============================================================ */

export function getRewardRate(depth: number, type: ActivityType): number {
  if (depth < 1 || depth > KNOT_REWARDS.MAX_DEPTH) return 0;
  const key = type.toUpperCase() as keyof typeof KNOT_REWARDS;
  const rates = KNOT_REWARDS[key];
  if (!Array.isArray(rates)) return 0;
  return rates[depth - 1] ?? 0;
}

export function calculateRewardChain(
  activityAmount: number,
  activityType: ActivityType,
  maxDepth: number = KNOT_REWARDS.MAX_DEPTH
): RewardCalculation[] {
  const chain: RewardCalculation[] = [];

  for (let depth = 1; depth <= maxDepth; depth++) {
    const rate = getRewardRate(depth, activityType);
    if (rate > 0) {
      const reward = round2(activityAmount * rate);
      chain.push({
        depth,
        rate: round2(rate * 100),
        amount: activityAmount,
        reward,
      });
    }
  }

  return chain;
}

export function getTotalRewardPool(
  activityAmount: number,
  activityType: ActivityType
): number {
  return calculateRewardChain(activityAmount, activityType).reduce(
    (sum, r) => sum + r.reward,
    0
  );
}

/* ============================================================
   NETWORK DEPTH & TREE MATH
   ============================================================ */

export function getNetworkDepth(
  member: NetworkNode,
  rootId: string,
  registry: Map<string, NetworkNode>
): number {
  if (member.ledgerId === rootId) return 0;
  if (member.referredBy === rootId) return 1;

  let current: string | undefined = member.referredBy;
  let depth = 1;

  const visited = new Set<string>();

  while (current) {
    if (visited.has(current)) break;
    visited.add(current);

    if (current === rootId) return depth;

    const parent = registry.get(current);
    if (!parent) break;

    current = parent.referredBy;
    depth++;

    if (depth > 10) break;
  }

  return 0;
}

export function getAncestorChain(
  member: NetworkNode,
  registry: Map<string, NetworkNode>
): string[] {
  const chain: string[] = [];
  let current: string | undefined = member.referredBy;
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current)) break;
    visited.add(current);

    chain.push(current);
    const parent = registry.get(current);
    if (!parent) break;

    current = parent.referredBy;
    if (chain.length > 10) break;
  }

  return chain;
}

export function getNetworkValue(
  rootId: string,
  registry: Map<string, NetworkMember>
): NetworkValueResult {
  const byDepth: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  let totalMembers = 0;
  let totalCommitted = 0;

  for (const node of registry.values()) {
    if (node.ledgerId === rootId) continue;

    const depth = getNetworkDepth(node, rootId, registry);
    if (depth > 0 && depth <= 3) {
      totalMembers++;
      byDepth[depth] = (byDepth[depth] || 0) + 1;
      totalCommitted += node.totalCommitted || 0;
    }
  }

  return { totalMembers, totalCommitted, byDepth };
}

/* ============================================================
   ORACLE STANDING ENGINE — No Money, Just Foresight
   ============================================================ */

/**
 * Calculate points for a correct Oracle forecast.
 * Streak bonuses apply.
 */
export function calculateOraclePoints(
  streak: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;

  const basePoints = ORACLE_CONSTANTS.POINTS_CORRECT;

  let bonusMultiplier = 1;
  if (streak >= 100) bonusMultiplier = ORACLE_CONSTANTS.STREAK_BONUS_MULTIPLIER[5];
  else if (streak >= 50) bonusMultiplier = ORACLE_CONSTANTS.STREAK_BONUS_MULTIPLIER[4];
  else if (streak >= 25) bonusMultiplier = ORACLE_CONSTANTS.STREAK_BONUS_MULTIPLIER[3];
  else if (streak >= 10) bonusMultiplier = ORACLE_CONSTANTS.STREAK_BONUS_MULTIPLIER[2];
  else if (streak >= 5) bonusMultiplier = ORACLE_CONSTANTS.STREAK_BONUS_MULTIPLIER[1];

  return Math.floor(basePoints * bonusMultiplier);
}

/**
 * Determine Oracle tier from correct count.
 */
export function getOracleTier(correctCount: number): OracleStandingCalculation["tier"] {
  if (correctCount >= 100) return "prophet";
  if (correctCount >= 50) return "oracle";
  if (correctCount >= 10) return "seer";
  return "novice";
}

/**
 * Calculate full Oracle standing update.
 */
export function calculateOracleStanding(
  ledgerId: string,
  currentStanding: {
    totalPoints: number;
    correctCount: number;
    totalPredictions: number;
    streak: number;
    lastCorrectAt: Date | null;
  },
  isCorrect: boolean,
  forecastResolvedAt: Date
): OracleStandingCalculation {
  let newStreak = isCorrect ? currentStanding.streak + 1 : 0;
  let newCorrectCount = currentStanding.correctCount + (isCorrect ? 1 : 0);
  let newTotalPredictions = currentStanding.totalPredictions + 1;

  // Reset streak if more than 30 days since last correct
  if (currentStanding.lastCorrectAt) {
    const daysSinceLastCorrect = Math.floor(
      (forecastResolvedAt.getTime() - currentStanding.lastCorrectAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastCorrect > 30) {
      newStreak = isCorrect ? 1 : 0;
    }
  }

  const pointsEarned = calculateOraclePoints(newStreak, isCorrect);
  const newTotalPoints = currentStanding.totalPoints + pointsEarned;
  const tier = getOracleTier(newCorrectCount);

  return {
    ledgerId,
    correctCount: newCorrectCount,
    totalPredictions: newTotalPredictions,
    streak: newStreak,
    pointsEarned: newTotalPoints,
    tier,
  };
}

/**
 * Get Oracle tier privileges.
 */
export function getOracleTierPrivileges(tier: OracleStandingCalculation["tier"]): {
  icon: string;
  earlyAccessHours: number;
  nameOnPoolCards: boolean;
  councilInvitation: boolean;
} {
  const privileges = {
    novice: { icon: "🔮", earlyAccessHours: 0, nameOnPoolCards: false, councilInvitation: false },
    seer: { icon: "🥉", earlyAccessHours: 0, nameOnPoolCards: false, councilInvitation: false },
    oracle: { icon: "🥈", earlyAccessHours: 24, nameOnPoolCards: false, councilInvitation: false },
    prophet: { icon: "🥇", earlyAccessHours: 24, nameOnPoolCards: true, councilInvitation: true },
  };

  return privileges[tier];
}

/* ============================================================
   ORACLE FORECAST ANALYTICS — Community Intelligence
   ============================================================ */

/**
 * Aggregate forecast choices by vertical+country combo.
 * Shows where the community is placing its foresight.
 */
export function aggregateForecastStakes(
  stakes: OracleForecastStake[]
): Record<string, { vertical: string; country: string; count: number; popularityPct: number }> {
  const total = stakes.reduce((sum, s) => sum + s.count, 0);

  const result: Record<string, { vertical: string; country: string; count: number; popularityPct: number }> = {};
  
  for (const stake of stakes) {
    const key = `${stake.vertical}-${stake.country}`;
    result[key] = {
      vertical: stake.vertical,
      country: stake.country,
      count: stake.count,
      popularityPct: total > 0 ? round2((stake.count / total) * 100) : 0,
    };
  }

  return result;
}

/**
 * Determine most popular forecast combo.
 */
export function getMostPopularForecast(
  stakes: OracleForecastStake[]
): OracleForecastStake | null {
  if (stakes.length === 0) return null;
  return stakes.reduce((max, s) => (s.count > max.count ? s : max), stakes[0]);
}

/* ============================================================
   STREAK BONUS ENGINE
   ============================================================ */

export function getStreakMultiplier(streak: number): number {
  if (streak <= 0) return 1;
  const idx = Math.min(streak, ORACLE_CONSTANTS.STREAK_BONUS_MULTIPLIER.length - 1);
  return ORACLE_CONSTANTS.STREAK_BONUS_MULTIPLIER[idx];
}

export function getStreakPayout(
  basePayout: number,
  streak: number
): number {
  const multiplier = getStreakMultiplier(streak);
  return round2(basePayout * multiplier);
}

/* ============================================================
   INVITE CODE VALIDATION
   ============================================================ */

export function isValidInviteCode(code: string): boolean {
  return typeof code === "string" && /^LED-[A-Z0-9]{4}-[A-Z]+$/.test(code.toUpperCase());
}

export function generateInviteCode(ledgerId: string): string {
  if (!ledgerId || typeof ledgerId !== "string") {
    return "LED-XXXX-ALPHA";
  }
  const parts = ledgerId.split("-");
  const prefix = parts[1]?.substring(0, 4) || "XXXX";
  return `LED-${prefix.toUpperCase()}-ALPHA`;
}

/* ============================================================
   KNOT MEMBER METRICS
   ============================================================ */

export function calculateKnotDepthScore(
  memberCount: number,
  depth1: number,
  depth2: number,
  depth3: number
): number {
  const weighted = depth1 * 1 + depth2 * 0.5 + depth3 * 0.25;
  return Math.min(100, Math.floor((weighted / Math.max(memberCount, 1)) * 100));
}