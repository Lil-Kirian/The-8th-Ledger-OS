/* ============================================================
   8TH LEDGER — POOL ENGINE V3.2
   Cooperative Ownership Model, PIR Calculation, Consensus Logic
   ============================================================ */

import { round2 } from "./utils";

/* ============================================================
   CONSTANTS
   ============================================================ */

export const POOL_CONSTANTS = {
  PIR_MULTIPLIER: 1,        // PIR = trueCost (1:1 model)
  MIN_COMMITMENT: 1,        // USD — 8th Ledger minimum
  MAX_COMMITMENT_TIER_1: 500,
  MAX_COMMITMENT_TIER_5: 999999,
  CONSENSUS_WEIGHT_CAP: 1000,    // Max $ commitment weight in consensus
  TRUST_WEIGHT_MULTIPLIER: 0.1, // 10% boost per 100 trust points
  MIN_PARTICIPANTS: 2,           // Need at least 2 for live pool
  POOL_DURATION_DAYS: 30,        // Default fill window
  EARLY_LEDGER_COUNT: 100,       // First 100 committers get Early Ledger status
};

/* ============================================================
   TYPES
   ============================================================ */

export interface PoolCommitment {
  ledgerId: string;
  amount: number;
  trustScore: number;
  tier: number;
  committedAt: string;
}

export interface PoolState {
  id: string;
  assetValue: number;      // trueCost (hidden from public)
  committed: number;
  target: number;          // listedPrice = trueCost + PIR
  participants: number;
  maxParticipants: number;
  status: "filling" | "filled" | "forged" | "active" | "dormant" | "sold" | "dissolved";
  commitments: PoolCommitment[];
  winnerId?: string;       // Legacy field — kept for compat, now null in cooperative model
  pirGenerated: number;    // Protocol Infrastructure Reserve
  distributedAt?: string;
  closesAt?: string;
  hallClass?: "I" | "II" | "III";
  trueCost: number;
  listedPrice: number;
}

export interface OwnershipResult {
  ledgerId: string;
  amountCommitted: number;
  ownershipPercent: number;
  pacToken: string;
}

export interface PoolDistributionResult {
  totalCommitted: number;
  pirAmount: number;
  trueCost: number;
  ownershipResults: OwnershipResult[];
  forgeTimestamp: string;
}

/* ============================================================
   TARGET & VALIDATION
   ============================================================ */

/**
 * Calculate PIR target from true cost
 * PIR = trueCost (1:1 ratio = 2x total target)
 */
export function getPirTarget(trueCost: number): number {
  return trueCost * POOL_CONSTANTS.PIR_MULTIPLIER;
}

/**
 * Calculate total pool target = trueCost + PIR
 */
export function getPoolTarget(trueCost: number): number {
  return trueCost + getPirTarget(trueCost);
}

/**
 * Check if pool has reached 100% fill
 */
export function isPoolFilled(pool: PoolState): boolean {
  return pool.committed >= pool.target && pool.participants >= POOL_CONSTANTS.MIN_PARTICIPANTS;
}

/**
 * Validate commitment amount against tier limits
 */
export function validateCommitment(
  amount: number,
  tier: number,
  userLedgerBalance: number
): { valid: boolean; error?: string } {
  if (amount < POOL_CONSTANTS.MIN_COMMITMENT) {
    return { valid: false, error: `Minimum commitment is $${POOL_CONSTANTS.MIN_COMMITMENT}` };
  }

  const tierMax = getTierMaxCommitment(tier);
  if (amount > tierMax) {
    return { valid: false, error: `Tier ${tier} max commitment is $${tierMax.toLocaleString()}` };
  }

  if (amount > userLedgerBalance) {
    return { valid: false, error: `Insufficient Ledger balance: $${userLedgerBalance}` };
  }

  return { valid: true };
}

/**
 * Check if commitment would overflow pool capacity
 */
export function checkPoolCapacity(
  pool: PoolState,
  newAmount: number
): { valid: boolean; error?: string } {
  if (pool.participants >= pool.maxParticipants) {
    return { valid: false, error: "Pool has reached maximum participants" };
  }

  if (pool.committed + newAmount > pool.target * 1.05) {
    return { valid: false, error: "Commitment would exceed 105% of target" };
  }

  if (pool.status !== "filling") {
    return { valid: false, error: `Pool is ${pool.status}` };
  }

  return { valid: true };
}

/* ============================================================
   TIER LIMITS
   ============================================================ */

export function getTierMaxCommitment(tier: number): number {
  const limits: Record<number, number> = {
    1: POOL_CONSTANTS.MAX_COMMITMENT_TIER_1,
    2: 2000,
    3: 10000,
    4: 50000,
    5: POOL_CONSTANTS.MAX_COMMITMENT_TIER_5,
  };
  return limits[tier] || POOL_CONSTANTS.MAX_COMMITMENT_TIER_1;
}

/* ============================================================
   OWNERSHIP CONVERSION — 8th Ledger Cooperative Model
   Everyone becomes an owner. No winners. No losers.
   ============================================================ */

/**
 * Convert commitments to ownership percentages
 * Each committer gets % proportional to their commitment
 */
export function convertToOwnership(pool: PoolState): PoolDistributionResult {
  if (!isPoolFilled(pool)) {
    throw new Error("Pool not ready for forge — must be 100% filled");
  }

  const totalCommitted = pool.committed;
  const trueCost = pool.trueCost || Math.round(totalCommitted / 2);
  const pirAmount = totalCommitted - trueCost;

  const ownershipResults: OwnershipResult[] = pool.commitments.map((c) => {
    const ownershipPercent = round2((c.amount / totalCommitted) * 100);
    const pacToken = generatePacToken(pool.id, c.ledgerId);

    return {
      ledgerId: c.ledgerId,
      amountCommitted: c.amount,
      ownershipPercent,
      pacToken,
    };
  });

  return {
    totalCommitted,
    pirAmount,
    trueCost,
    ownershipResults,
    forgeTimestamp: new Date().toISOString(),
  };
}

/**
 * Generate PAC token
 */
export function generatePacToken(poolId: string, ledgerId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAC-${poolId.substring(0, 4)}-${ledgerId.substring(4, 8)}-${timestamp}-${hash}`;
}

/**
 * Check if user is an Early Ledger committer
 */
export function isEarlyLedger(commitIndex: number): boolean {
  return commitIndex < POOL_CONSTANTS.EARLY_LEDGER_COUNT;
}

/* ============================================================
   PIR CALCULATIONS — Protocol Infrastructure Reserve
   ============================================================ */

/**
 * Calculate PIR amount from pool data
 */
export function calculatePir(pool: PoolState): number {
  const trueCost = pool.trueCost || Math.round(pool.target / 2);
  return Math.max(0, pool.target - trueCost);
}

/**
 * Calculate what the 8th Ledger retains (PIR)
 */
export function getProtocolPir(pool: PoolState): number {
  if (pool.status !== "forged" && pool.status !== "active") return 0;
  return calculatePir(pool);
}

/**
 * Calculate 8th Ledger Tithe from revenue (20%)
 */
export function calculateLedgerTithe(revenue: number): number {
  return round2(revenue * 0.20);
}

/**
 * Calculate net hall revenue after tithe
 */
export function calculateNetRevenue(revenue: number): number {
  return round2(revenue * 0.80);
}

/* ============================================================
   POOL LIFECYCLE
   ============================================================ */

/**
 * Add commitment to pool state
 */
export function addCommitment(
  pool: PoolState,
  commitment: PoolCommitment
): PoolState {
  const newPool = {
    ...pool,
    committed: pool.committed + commitment.amount,
    participants: pool.participants + 1,
    commitments: [...pool.commitments, commitment],
  };

  // Auto-trigger filled if target reached
  if (isPoolFilled(newPool)) {
    newPool.status = "filled";
  }

  return newPool;
}

/**
 * Forge pool — convert to ownership and unlock Ghost Hall
 */
export function forgePool(pool: PoolState): PoolState & { distribution: PoolDistributionResult } {
  if (pool.status === "forged" || pool.status === "active") {
    throw new Error("Pool already forged");
  }

  if (!isPoolFilled(pool)) {
    throw new Error("Pool must be 100% filled before forging");
  }

  const distribution = convertToOwnership(pool);

  return {
    ...pool,
    status: "forged",
    pirGenerated: distribution.pirAmount,
    distributedAt: new Date().toISOString(),
    distribution,
  };
}

/**
 * Activate pool — hall goes live after Executive Cabinet election
 */
export function activatePool(pool: PoolState): PoolState {
  if (pool.status !== "forged") {
    throw new Error("Pool must be forged before activation");
  }
  return { ...pool, status: "active" };
}

/**
 * Suspend pool (emergency admin action)
 */
export function suspendPool(pool: PoolState): PoolState {
  if (pool.status === "active" || pool.status === "dissolved") {
    throw new Error("Cannot suspend active or dissolved pool");
  }
  return { ...pool, status: "dormant" };
}

/* ============================================================
   POOL METRICS
   ============================================================ */

export interface PoolMetrics {
  fillPercentage: number;
  participantPercentage: number;
  timeRemaining: number; // seconds
  estimatedCloseDate: string;
  averageCommitment: number;
  trustWeightedAverage: number;
  pirPreview: number;
  trueCostPreview: number;
}

export function getPoolMetrics(pool: PoolState): PoolMetrics {
  const fillPercentage = round2((pool.committed / pool.target) * 100);
  const participantPercentage = round2((pool.participants / pool.maxParticipants) * 100);
  const avgCommitment = pool.participants > 0 ? round2(pool.committed / pool.participants) : 0;
  
  const trustWeighted = pool.commitments.reduce(
    (sum, c) => sum + c.amount * (c.trustScore / 1000),
    0
  );
  const trustWeightedAvg = pool.participants > 0 ? round2(trustWeighted / pool.participants) : 0;

  // Calculate time remaining from closesAt if available
  let timeRemaining = 0;
  const estimatedCloseDate = pool.closesAt || "TBD";
  
  if (pool.closesAt) {
    const closeTime = new Date(pool.closesAt).getTime();
    const now = Date.now();
    timeRemaining = Math.max(0, Math.floor((closeTime - now) / 1000));
  }

  const trueCostPreview = pool.trueCost || Math.round(pool.target / 2);
  const pirPreview = pool.target - trueCostPreview;

  return {
    fillPercentage,
    participantPercentage,
    timeRemaining,
    estimatedCloseDate,
    averageCommitment: avgCommitment,
    trustWeightedAverage: trustWeightedAvg,
    pirPreview,
    trueCostPreview,
  };
}

/* ============================================================
   PIR ALLOCATION — 6-Pillar Distribution
   ============================================================ */

export interface PirPillarAllocation {
  shield: number;    // 25% — Insurance
  seal: number;      // 20% — Legal/SPV
  forge: number;     // 20% — Maintenance
  spire: number;     // 15% — Protocol
  vanguard: number;  // 12% — R&D
  sanctuary: number; // 8%  — Reserve
}

export function calculatePirAllocation(pirAmount: number): PirPillarAllocation {
  return {
    shield: round2(pirAmount * 0.25),
    seal: round2(pirAmount * 0.20),
    forge: round2(pirAmount * 0.20),
    spire: round2(pirAmount * 0.15),
    vanguard: round2(pirAmount * 0.12),
    sanctuary: round2(pirAmount * 0.08),
  };
}

/* ============================================================
   REVENUE DISTRIBUTION — Auto-Split by Ownership %
   ============================================================ */

export interface RevenueDistribution {
  grossRevenue: number;
  ledgerTithe: number;      // 20% to 8th Ledger
  netHallRevenue: number;   // 80% to hall
  payrollDeducted: number;  // Pre-dividend expense
  netAfterPayroll: number;  // After payroll
  dividendPerPercent: number;
}

export function calculateRevenueDistribution(
  grossRevenue: number,
  totalOwnershipPercent: number,
  payrollAmount: number = 0
): RevenueDistribution {
  const ledgerTithe = calculateLedgerTithe(grossRevenue);
  const netHallRevenue = grossRevenue - ledgerTithe;
  const netAfterPayroll = Math.max(0, netHallRevenue - payrollAmount);
  const dividendPerPercent = totalOwnershipPercent > 0
    ? round2(netAfterPayroll / totalOwnershipPercent)
    : 0;

  return {
    grossRevenue,
    ledgerTithe,
    netHallRevenue,
    payrollDeducted: payrollAmount,
    netAfterPayroll,
    dividendPerPercent,
  };
}

/* ============================================================
   DIVIDEND CALCULATION — Per Owner
   ============================================================ */

export function calculateOwnerDividend(
  ownershipPercent: number,
  dividendPerPercent: number
): number {
  return round2(ownershipPercent * dividendPerPercent);
}

/* ============================================================
   DYNAMIC PAC VALUATION — Floor Price Calculation
   ============================================================ */

export interface DynamicValuationInput {
  assetBookValue: number;
  accumulatedDividendsPerPercent: number;
  ahgiScore: number;
  sriScore: number;
  sriTier: "platinum" | "gold" | "silver" | "bronze" | "at_risk";
  pirDebtPerPercent: number;
}

export function calculateDynamicValuation(input: DynamicValuationInput): number {
  const baseValue = input.assetBookValue / 100;
  const ahgiPremium = Math.max(0, (input.ahgiScore - 50) * 10);
  
  const sriBonuses: Record<string, number> = {
    platinum: 50,
    gold: 30,
    silver: 10,
    bronze: 0,
    at_risk: -20,
  };
  const sriBonus = sriBonuses[input.sriTier] || 0;

  const value = baseValue
    + input.accumulatedDividendsPerPercent
    + ahgiPremium
    + sriBonus
    - input.pirDebtPerPercent;

  return Math.max(0, round2(value));
}

/* ============================================================
   LEGACY COMPAT — Quantum Merit (deprecated, kept for audit)
   ============================================================ */

/**
 * Calculate consensus weight for a participant (legacy)
 * Now used for governance voting weight only
 */
export function getGovernanceWeight(commitment: PoolCommitment): number {
  const cappedCommitment = Math.min(commitment.amount, POOL_CONSTANTS.CONSENSUS_WEIGHT_CAP);
  const trustBonus = 1 + (commitment.trustScore / 100) * POOL_CONSTANTS.TRUST_WEIGHT_MULTIPLIER;
  return cappedCommitment * trustBonus;
}