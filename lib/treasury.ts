/* ============================================================
   8TH LEDGER — TREASURY ENGINE V3.2
   PIR Allocation, Revenue Distribution, Payroll, Audit
   ============================================================ */

import { round2 } from "./utils";

/* ============================================================
   CONSTANTS
   ============================================================ */

export const TREASURY_CONSTANTS = {
  MIN_WITHDRAWAL: 100,           // USD
  MAX_WITHDRAWAL_DAILY: 100000,  // USD daily cap per user
  PROCESSING_HOURS: 24,
  EIGHTH_LEDGER_TITHE: 0.20,     // 20% of net revenue to 8th Ledger
  PAYROLL_RESERVE_MIN: 0.10,     // 10% of net revenue held for payroll
  CLOSURE_RESERVE_MIN: 0.05,     // 5% of net revenue held for closure
  PIR_REPAYMENT_RATE: 0.05,      // 5% of monthly dividends for PIR advance
  PIR_INTEREST_AFTER_12MO: 0.02, // 2% annual after 12 months
  MARKETPLACE_FEE_FULL: 0.01,    // 1% on full PAC sale
  MARKETPLACE_FEE_FRACTIONAL: 0.02, // 2% on fractional sale
  INVENTORY_PLATFORM_FEE: 0.05,  // 5% on inventory sales
};

/* ============================================================
   TYPES
   ============================================================ */

export interface TreasuryState {
  totalPirUSD: number;
  totalRevenueUSD: number;
  totalDistributedUSD: number;
  totalPayrollUSD: number;
  totalLedgerTitheUSD: number;
  pendingWithdrawals: number;
  dailyVolumeUSD: number;
  protocolFeeRate: number;
  titheRate: number;
  payrollReserveUSD: number;
  closureReserveUSD: number;
  reinvestmentPoolUSD: number;
}

export interface TreasuryTransaction {
  id: string;
  type: "pir_in" | "revenue_in" | "tithe_out" | "payroll_out" | "dividend_out" | "withdrawal" | "pir_advance" | "pir_repay" | "marketplace_fee" | "inventory_fee" | "closure_payout" | "dormancy_fee";
  amount: number;
  currency: "USD";
  poolId?: string;
  hallId?: string;
  ledgerId?: string;
  description: string;
  status: "completed" | "pending" | "rejected";
  txHash: string;
  timestamp: string;
  audited: boolean;
}

export interface PirAllocation {
  id: string;
  poolId: string;
  poolName: string;
  totalCommitted: number;
  trueCost: number;
  pirAmount: number;
  shieldAmount: number;    // 25% — Insurance
  sealAmount: number;      // 20% — Legal/SPV
  forgeAmount: number;     // 20% — Maintenance
  spireAmount: number;     // 15% — Protocol
  vanguardAmount: number;  // 12% — R&D
  sanctuaryAmount: number; // 8%  — Reserve
  distributedAt: string;
}

export interface RevenueDistribution {
  id: string;
  hallId: string;
  poolId: string;
  grossRevenue: number;
  ledgerTithe: number;       // 20% to 8th Ledger
  payrollDeducted: number;  // Pre-dividend
  netAfterPayroll: number;
  dividendPerPercent: number;
  distributedAt: string;
  ownerCount: number;
}

export interface WithdrawalRequest {
  id: string;
  ledgerId: string;
  displayName: string;
  amount: number;
  destination: string;
  destinationType: "bank" | "usdc" | "crypto";
  status: "pending" | "processing" | "completed" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
}

export interface AuditTrail {
  entries: TreasuryTransaction[];
  totalVolume: number;
  totalTithe: number;
  totalPayroll: number;
  totalDividends: number;
  totalWithdrawn: number;
  lastAuditDate: string;
  integrityHash: string;
}

/* ============================================================
   INITIAL STATE
   ============================================================ */

export function createInitialTreasuryState(): TreasuryState {
  return {
    totalPirUSD: 0,
    totalRevenueUSD: 0,
    totalDistributedUSD: 0,
    totalPayrollUSD: 0,
    totalLedgerTitheUSD: 0,
    pendingWithdrawals: 0,
    dailyVolumeUSD: 0,
    protocolFeeRate: 0,
    titheRate: 20,
    payrollReserveUSD: 0,
    closureReserveUSD: 0,
    reinvestmentPoolUSD: 0,
  };
}

/* ============================================================
   PIR ALLOCATION — 6-Pillar Protocol Infrastructure Reserve
   ============================================================ */

/**
 * Allocate PIR from a completed pool
 * 6-pillar split: Shield 25%, Seal 20%, Forge 20%, Spire 15%, Vanguard 12%, Sanctuary 8%
 */
export function allocatePir(
  poolId: string,
  poolName: string,
  totalCommitted: number,
  trueCost: number
): { allocation: PirAllocation; stateUpdates: Partial<TreasuryState> } {
  const pirAmount = totalCommitted - trueCost;

  if (pirAmount <= 0) {
    throw new Error("No PIR generated from this pool");
  }

  const shieldAmount = round2(pirAmount * 0.25);
  const sealAmount = round2(pirAmount * 0.20);
  const forgeAmount = round2(pirAmount * 0.20);
  const spireAmount = round2(pirAmount * 0.15);
  const vanguardAmount = round2(pirAmount * 0.12);
  const sanctuaryAmount = round2(pirAmount * 0.08);

  const allocation: PirAllocation = {
    id: `pir-${Date.now()}`,
    poolId,
    poolName,
    totalCommitted,
    trueCost,
    pirAmount,
    shieldAmount,
    sealAmount,
    forgeAmount,
    spireAmount,
    vanguardAmount,
    sanctuaryAmount,
    distributedAt: new Date().toISOString(),
  };

  const stateUpdates: Partial<TreasuryState> = {
    totalPirUSD: pirAmount,
    reinvestmentPoolUSD: vanguardAmount + spireAmount,
  };

  return { allocation, stateUpdates };
}

/**
 * Create transaction records for PIR allocation
 */
export function createPirTransactions(
  allocation: PirAllocation
): TreasuryTransaction[] {
  const timestamp = new Date().toISOString();
  const baseId = Date.now();

  return [
    {
      id: `tx-${baseId}-shield`,
      type: "pir_in",
      amount: allocation.shieldAmount,
      currency: "USD",
      poolId: allocation.poolId,
      description: `PIR — The Shield (Insurance): ${allocation.poolName}`,
      status: "completed",
      txHash: `PIR-SHIELD-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-seal`,
      type: "pir_in",
      amount: allocation.sealAmount,
      currency: "USD",
      poolId: allocation.poolId,
      description: `PIR — The Seal (Legal/SPV): ${allocation.poolName}`,
      status: "completed",
      txHash: `PIR-SEAL-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-forge`,
      type: "pir_in",
      amount: allocation.forgeAmount,
      currency: "USD",
      poolId: allocation.poolId,
      description: `PIR — The Forge (Maintenance): ${allocation.poolName}`,
      status: "completed",
      txHash: `PIR-FORGE-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-spire`,
      type: "pir_in",
      amount: allocation.spireAmount,
      currency: "USD",
      poolId: allocation.poolId,
      description: `PIR — The Spire (Protocol): ${allocation.poolName}`,
      status: "completed",
      txHash: `PIR-SPIRE-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-vanguard`,
      type: "pir_in",
      amount: allocation.vanguardAmount,
      currency: "USD",
      poolId: allocation.poolId,
      description: `PIR — The Vanguard (R&D): ${allocation.poolName}`,
      status: "completed",
      txHash: `PIR-VANGUARD-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-sanctuary`,
      type: "pir_in",
      amount: allocation.sanctuaryAmount,
      currency: "USD",
      poolId: allocation.poolId,
      description: `PIR — The Sanctuary (Reserve): ${allocation.poolName}`,
      status: "completed",
      txHash: `PIR-SANCTUARY-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
  ];
}

/* ============================================================
   REVENUE DISTRIBUTION — Auto-Split by Ownership %
   ============================================================ */

/**
 * Calculate revenue distribution for a hall
 * 1. Gross Revenue enters
 * 2. 20% 8th Ledger Tithe
 * 3. Payroll deducted (pre-dividend)
 * 4. Remainder distributed by ownership %
 */
export function calculateRevenueDistribution(
  hallId: string,
  poolId: string,
  grossRevenue: number,
  totalOwnershipPercent: number,
  payrollAmount: number = 0,
  ownerCount: number = 0
): RevenueDistribution {
  const ledgerTithe = round2(grossRevenue * TREASURY_CONSTANTS.EIGHTH_LEDGER_TITHE);
  const netHallRevenue = grossRevenue - ledgerTithe;
  const netAfterPayroll = Math.max(0, netHallRevenue - payrollAmount);
  
  const dividendPerPercent = totalOwnershipPercent > 0
    ? round2(netAfterPayroll / totalOwnershipPercent)
    : 0;

  return {
    id: `rev-${Date.now()}`,
    hallId,
    poolId,
    grossRevenue,
    ledgerTithe,
    payrollDeducted: payrollAmount,
    netAfterPayroll,
    dividendPerPercent,
    distributedAt: new Date().toISOString(),
    ownerCount,
  };
}

/**
 * Create transaction records for revenue distribution
 */
export function createRevenueTransactions(
  distribution: RevenueDistribution
): TreasuryTransaction[] {
  const timestamp = new Date().toISOString();
  const baseId = Date.now();

  return [
    {
      id: `tx-${baseId}-revenue`,
      type: "revenue_in",
      amount: distribution.grossRevenue,
      currency: "USD",
      hallId: distribution.hallId,
      poolId: distribution.poolId,
      description: `Gross revenue: Hall ${distribution.hallId}`,
      status: "completed",
      txHash: `REVENUE-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-tithe`,
      type: "tithe_out",
      amount: distribution.ledgerTithe,
      currency: "USD",
      hallId: distribution.hallId,
      poolId: distribution.poolId,
      description: `8th Ledger Tithe (20%): Hall ${distribution.hallId}`,
      status: "completed",
      txHash: `TITHE-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-payroll`,
      type: "payroll_out",
      amount: distribution.payrollDeducted,
      currency: "USD",
      hallId: distribution.hallId,
      poolId: distribution.poolId,
      description: `Forge Payroll: Hall ${distribution.hallId}`,
      status: "completed",
      txHash: `PAYROLL-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
    {
      id: `tx-${baseId}-dividend`,
      type: "dividend_out",
      amount: distribution.netAfterPayroll,
      currency: "USD",
      hallId: distribution.hallId,
      poolId: distribution.poolId,
      description: `Dividends distributed: Hall ${distribution.hallId}`,
      status: "completed",
      txHash: `DIVIDEND-${baseId.toString(36).toUpperCase()}`,
      timestamp,
      audited: true,
    },
  ];
}

/* ============================================================
   WITHDRAWALS — User
   ============================================================ */

/**
 * Validate user withdrawal request
 */
export function validateUserWithdrawal(
  amount: number,
  userLedgerBalance: number,
  pendingUserWithdrawals: number,
  _treasuryState: TreasuryState
): { valid: boolean; error?: string } {
  if (amount < TREASURY_CONSTANTS.MIN_WITHDRAWAL) {
    return { valid: false, error: `Minimum withdrawal is $${TREASURY_CONSTANTS.MIN_WITHDRAWAL}` };
  }

  if (amount > userLedgerBalance) {
    return { valid: false, error: `Insufficient Ledger balance: $${userLedgerBalance}` };
  }

  if (amount + pendingUserWithdrawals > TREASURY_CONSTANTS.MAX_WITHDRAWAL_DAILY) {
    return { valid: false, error: `Daily withdrawal cap: $${TREASURY_CONSTANTS.MAX_WITHDRAWAL_DAILY}` };
  }

  return { valid: true };
}

/**
 * Create withdrawal request
 */
export function createWithdrawalRequest(
  ledgerId: string,
  displayName: string,
  amount: number,
  destination: string,
  destinationType: "bank" | "usdc" | "crypto"
): WithdrawalRequest {
  return {
    id: `wd-${Date.now()}`,
    ledgerId,
    displayName,
    amount,
    destination,
    destinationType,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
}

/**
 * Process withdrawal
 */
export function processWithdrawal(
  request: WithdrawalRequest,
  approverId: string,
  approve: boolean,
  rejectionReason?: string
): { request: WithdrawalRequest; transaction?: TreasuryTransaction } {
  const processedAt = new Date().toISOString();

  if (!approve) {
    return {
      request: {
        ...request,
        status: "rejected",
        processedAt,
        processedBy: approverId,
        rejectionReason: rejectionReason || "Rejected by 8th Ledger",
      },
    };
  }

  const transaction: TreasuryTransaction = {
    id: `tx-${Date.now()}`,
    type: "withdrawal",
    amount: request.amount,
    currency: "USD",
    ledgerId: request.ledgerId,
    description: `Withdrawal to ${request.destinationType}: ${request.destination.substring(0, 20)}...`,
    status: "completed",
    txHash: `LEDGER-WITHDRAW-${Date.now().toString(36).toUpperCase()}`,
    timestamp: processedAt,
    audited: true,
  };

  return {
    request: {
      ...request,
      status: "completed",
      processedAt,
      processedBy: approverId,
    },
    transaction,
  };
}

/* ============================================================
   PIR ADVANCE — Asset Protection Loan
   ============================================================ */

/**
 * Calculate PIR advance repayment terms
 */
export function calculatePirAdvanceTerms(
  amount: number,
  monthlyDividendEstimate: number,
  repaymentRate: number = TREASURY_CONSTANTS.PIR_REPAYMENT_RATE
): {
  monthlyDeduction: number;
  estimatedMonths: number;
  interestAfter12mo: number;
} {
  const monthlyDeduction = round2(monthlyDividendEstimate * repaymentRate);
  const estimatedMonths = monthlyDeduction > 0
    ? Math.ceil(amount / monthlyDeduction)
    : 0;
  const interestAfter12mo = estimatedMonths > 12
    ? round2(amount * TREASURY_CONSTANTS.PIR_INTEREST_AFTER_12MO * (estimatedMonths - 12) / 12)
    : 0;

  return {
    monthlyDeduction,
    estimatedMonths,
    interestAfter12mo,
  };
}

/**
 * Create PIR advance transaction
 */
export function createPirAdvanceTransaction(
  hallId: string,
  amount: number,
  reason: string,
  approvedBy: string
): TreasuryTransaction {
  return {
    id: `tx-${Date.now()}`,
    type: "pir_advance",
    amount,
    currency: "USD",
    hallId,
    description: `PIR Advance — ${reason}`,
    status: "completed",
    txHash: `PIR-ADVANCE-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    audited: true,
  };
}

/* ============================================================
   MARKETPLACE FEES
   ============================================================ */

/**
 * Calculate ownership marketplace fee
 */
export function calculateMarketplaceFee(
  salePrice: number,
  isFractional: boolean
): number {
  const rate = isFractional
    ? TREASURY_CONSTANTS.MARKETPLACE_FEE_FRACTIONAL
    : TREASURY_CONSTANTS.MARKETPLACE_FEE_FULL;
  return round2(salePrice * rate);
}

/**
 * Calculate inventory marketplace fee
 */
export function calculateInventoryFee(salePrice: number): number {
  return round2(salePrice * TREASURY_CONSTANTS.INVENTORY_PLATFORM_FEE);
}

/**
 * Create marketplace fee transaction
 */
export function createMarketplaceFeeTransaction(
  hallId: string,
  amount: number,
  isFractional: boolean,
  sellerLedgerId: string
): TreasuryTransaction {
  return {
    id: `tx-${Date.now()}`,
    type: "marketplace_fee",
    amount,
    currency: "USD",
    hallId,
    ledgerId: sellerLedgerId,
    description: `8th Ledger Exchange fee (${isFractional ? "2%" : "1%"}): ${sellerLedgerId}`,
    status: "completed",
    txHash: `MKT-FEE-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    audited: true,
  };
}

/* ============================================================
   CLOSURE PAYOUT
   ============================================================ */

/**
 * Calculate closure liquidation payout
 */
export function calculateClosurePayout(
  assetSalePrice: number,
  pirDebt: number,
  taxObligations: number,
  totalSeverance: number,
  ledgerFeeRate: number = 0.025
): {
  ledgerFee: number;
  netProceeds: number;
  payoutPerPercent: number;
} {
  const ledgerFee = round2(assetSalePrice * ledgerFeeRate);
  const netProceeds = Math.max(0, assetSalePrice - ledgerFee - pirDebt - taxObligations - totalSeverance);
  const payoutPerPercent = round2(netProceeds / 100);

  return {
    ledgerFee,
    netProceeds,
    payoutPerPercent,
  };
}

/**
 * Create closure payout transaction
 */
export function createClosurePayoutTransaction(
  hallId: string,
  amount: number,
  ownerLedgerId: string
): TreasuryTransaction {
  return {
    id: `tx-${Date.now()}`,
    type: "closure_payout",
    amount,
    currency: "USD",
    hallId,
    ledgerId: ownerLedgerId,
    description: `Closure liquidation payout: ${ownerLedgerId}`,
    status: "completed",
    txHash: `CLOSURE-PAYOUT-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    audited: true,
  };
}

/* ============================================================
   AUDIT TRAIL
   ============================================================ */

/**
 * Generate integrity hash for audit trail
 */
export function generateIntegrityHash(entries: TreasuryTransaction[]): string {
  const data = entries.map((e) => `${e.id}:${e.amount}:${e.timestamp}`).join("|");
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash < 5) - hash + char) | 0;
  }
  return `audit-${Math.abs(hash).toString(16)}`;
}

/**
 * Build complete audit trail
 */
export function buildAuditTrail(
  transactions: TreasuryTransaction[]
): AuditTrail {
  const allEntries = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalVolume = allEntries
    .filter((e) => e.type === "revenue_in" || e.type === "pir_in")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalTithe = allEntries
    .filter((e) => e.type === "tithe_out")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPayroll = allEntries
    .filter((e) => e.type === "payroll_out")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDividends = allEntries
    .filter((e) => e.type === "dividend_out")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalWithdrawn = allEntries
    .filter((e) => e.type === "withdrawal")
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    entries: allEntries,
    totalVolume,
    totalTithe,
    totalPayroll,
    totalDividends,
    totalWithdrawn,
    lastAuditDate: new Date().toISOString(),
    integrityHash: generateIntegrityHash(allEntries),
  };
}

/**
 * Verify audit trail integrity
 */
export function verifyAuditIntegrity(trail: AuditTrail): boolean {
  const computedHash = generateIntegrityHash(trail.entries);
  return computedHash === trail.integrityHash;
}

/* ============================================================
   TREASURY STATE UPDATES
   ============================================================ */

/**
 * Apply state updates immutably
 */
export function updateTreasuryState(
  current: TreasuryState,
  updates: Partial<TreasuryState>
): TreasuryState {
  return {
    ...current,
    ...updates,
    totalPirUSD: round2((updates.totalPirUSD ?? 0) + current.totalPirUSD),
    totalRevenueUSD: round2((updates.totalRevenueUSD ?? 0) + current.totalRevenueUSD),
    totalDistributedUSD: round2((updates.totalDistributedUSD ?? 0) + current.totalDistributedUSD),
    totalPayrollUSD: round2((updates.totalPayrollUSD ?? 0) + current.totalPayrollUSD),
    totalLedgerTitheUSD: round2((updates.totalLedgerTitheUSD ?? 0) + current.totalLedgerTitheUSD),
  };
}

/**
 * Reset daily volumes (call at midnight UTC)
 */
export function resetDailyVolumes(state: TreasuryState): TreasuryState {
  return {
    ...state,
    dailyVolumeUSD: 0,
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
   DORMANCY FEE
   ============================================================ */

/**
 * Calculate dormancy auction fee (20% to 8th Ledger)
 */
export function calculateDormancyFee(salePrice: number): number {
  return round2(salePrice * 0.20);
}

/**
 * Create dormancy fee transaction
 */
export function createDormancyFeeTransaction(
  vaultId: string,
  amount: number
): TreasuryTransaction {
  return {
    id: `tx-${Date.now()}`,
    type: "dormancy_fee",
    amount,
    currency: "USD",
    description: `Dormancy auction fee (20%): ${vaultId}`,
    status: "completed",
    txHash: `DORMANCY-FEE-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    audited: true,
  };
}