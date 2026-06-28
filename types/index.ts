import type React from "react";

/* ============================================================
   8TH LEDGER — THE PERPETUAL OWNERSHIP PROTOCOL
   Master Type System. Import from "@/types" anywhere.
   ============================================================ */

/* ============================================================
   AUTH & IDENTITY
   ============================================================ */

export type KycTier = "visitor" | "sovereign" | "verified" | "whale";
export type TierLevel = 1 | 2 | 3 | 4 | 5; // Legacy trust tier, kept for Knot

/**
 * Database User — NEVER send to client. Contains passwordHash.
 */
export interface User {
  id: string;
  ledgerId: string;
  displayName: string;
  email: string;
  passwordHash: string;
  country: string;
  trustScore: number;
  tier: TierLevel;
  ledgerBalance: number;
  role: string;
  kycTier: KycTier;
  kycStatus: string;
  phone: string | null;
  identityScore: number;
  referrals: number;
  createdAt: string;
  updatedAt: string;
  isPrimaryAdmin?: boolean;
  oracleStanding?: number;
  globalSriScore?: number;
}

/**
 * Safe User — Sent to client via API. No sensitive fields.
 */
export interface UserPublic {
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  trustScore: number;
  tier: TierLevel;
  ledgerBalance: number;
  role: string;
  kycTier: KycTier;
  referrals: number;
  createdAt: string;
}

export interface AuthUser {
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  trustScore: number;
  tier: TierLevel;
  ledgerBalance: number;
  role: string;
  kycTier: KycTier;
  kycStatus: string;
  phone: string | null;
  identityScore: number;
  isPrimaryAdmin?: boolean;
  creditPool?: number;
  legalName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  beneficiaryName?: string | null;
  beneficiaryEmail?: string | null;
  totalCommitted?: number;
  reportsSubmitted?: number;
  forgesCompleted?: number;
  referrals?: number;
  lastLoginAt?: string | Date | null;
  createdAt?: string | Date | null;
  totpEnabled?: boolean;
  recoveryCodes?: unknown;
  livenessVerified?: boolean;
  addressProofUrl?: string | null;
  oracleStanding?: number;
  globalSriScore?: number;
}

export interface AuthResponse {
  success: boolean;
  ledgerId?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
}

export interface InitiatePayload {
  displayName: string;
  email: string;
  country: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
  agreeTerms: boolean;
  agreePir: boolean;
}

export interface AccessPayload {
  ledgerId: string;
  password: string;
  rememberDevice?: boolean;
}

export interface Session {
  ledgerId: string;
  token: string;
  expiresAt: number;
}

/* ============================================================
   VERTICALS & POOLS
   ============================================================ */

export type PoolStatus =
  | "filling"
  | "consensus"
  | "distributed"
  | "closed"
  | "suspended";
export type HallClass = "I" | "II" | "III";

export interface VerticalMeta {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgGradient: string;
  ringClass: string;
  description: string;
  totalPools: number;
  activePools: number;
  totalValue: number;
}

/**
 * Matches Prisma Pool model exactly.
 * `id` = cuid internal. `poolId` = human-readable unique slug (e.g. "pool-ledgerprop-001").
 */
export interface Pool {
  id: string;
  poolId: string;
  verticalId: string;
  name: string;
  assetValue: number;
  trueCost: number;
  listedPrice: number;
  committed: number;
  target: number;
  participants: number;
  maxParticipants: number;
  status: PoolStatus;
  country: string;
  description: string;
  creatorId: string;
  winnerId?: string;
  winnerCountry?: string;
  hallClass: HallClass;
  pirAllocation: number;
  meridianCycleId?: string;
  assetBookValue?: number;
  createdAt: string;
  closesAt: string;
  distributedAt?: string;
}

export interface Ownership {
  id: string;
  poolId: string;
  ledgerId: string;
  hallId: string;
  percent: number;
  amount: number;
  pacToken: string;
  dynamicValue?: number;
  accumulatedDividends?: number;
  pirDebt?: number;
  createdAt: string;
  isDormant?: boolean;
}

export interface PoolPayload {
  name: string;
  verticalId: string;
  assetValue: number;
  trueCost: number;
  listedPrice: number;
  maxParticipants: number;
  country: string;
  description?: string;
  closesAt?: string;
  hallClass?: HallClass;
}

export interface CommitPayload {
  poolId: string;
  amount: number;
}

/**
 * API response format for pool distribution.
 */
export interface ConsensusResult {
  winnerId: string;
  winnerCommitment: number;
  totalCommitted: number;
  participantResults: ParticipantResult[];
}

export interface ParticipantResult {
  ledgerId: string;
  committed: number;
  won: boolean;
  ownershipPercent: number;
}

export interface PoolMetrics {
  fillPercentage: number;
  participantPercentage: number;
  timeRemaining: number;
  estimatedCloseDate: string;
  averageCommitment: number;
  trustWeightedAverage: number;
}

/* ============================================================
   PERPETUAL ASSET CONTRACTS (PAC)
   ============================================================ */

export interface PAC {
  id: string;
  ledgerId: string;
  poolId: string;
  hallId: string;
  ownershipPercent: number;
  amountCommitted: number;
  dynamicValue: number;
  accumulatedDividends: number;
  pirDebt: number;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export interface PACListing {
  id: string;
  pacId: string;
  hallId: string;
  sellerId: string;
  percentListed: number;
  pricePerPercent: number;
  totalPrice: number;
  floorPrice: number;
  status: "active" | "sold" | "cancelled" | "expired";
  listedAt: string;
  expiresAt: string;
}

/* ============================================================
   QUANTUM MERIT CONSENSUS — Algorithm Types
   ============================================================ */

export interface QuantumMeritCandidate {
  ledgerId: string;
  trustScore: number;
  tier: number;
  commitment: number;
  joinedAt: string | Date;
  referrals: number;
}

export interface QuantumMeritScore {
  ledgerId: string;
  merit: number;
  probability: string;
}

export interface QuantumMeritResult {
  winner: QuantumMeritCandidate;
  seed: string;
  meritScores: QuantumMeritScore[];
}

/* ============================================================
   PROTOCOL INFRASTRUCTURE RESERVE (PIR)
   ============================================================ */

export type PirPillar =
  | "shield"
  | "seal"
  | "forge"
  | "spire"
  | "vanguard"
  | "sanctuary";

export interface PirAllocation {
  id: string;
  hallId: string;
  pillar: PirPillar;
  amount: number;
  purpose: string;
  createdAt: string;
}

export interface PirAdvance {
  id: string;
  hallId: string;
  amount: number;
  reason: string;
  repaymentRate: number;
  repaidAmount: number;
  status: "pending" | "active" | "repaid";
  approvedBy?: string;
}

/* ============================================================
   EXCHANGE & LED
   ============================================================ */

export type OrderSide = "buy" | "sell";
export type OrderType = "limit" | "market";
export type OrderStatus = "open" | "partial" | "filled" | "cancelled";

export interface Order {
  id: string;
  side: OrderSide;
  ledgerId: string;
  amount: number;
  price: number;
  filled: number;
  status: OrderStatus;
  createdAt: string;
  txHash: string;
}

export interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  amount: number;
  price: number;
  total: number;
  buyerId: string;
  sellerId: string;
  executedAt: string;
  txHash: string;
}

export interface OrderPayload {
  side: OrderSide;
  amount: number;
  price?: number;
  type?: OrderType;
}

/* ============================================================
   KNOT & ORACLE
   ============================================================ */

export interface KnotMember {
  id: string;
  ledgerId: string;
  displayName: string;
  country: string;
  tier: TierLevel;
  joinedAt: string;
  totalCommitted: number;
  poolsWon: number;
  trustScore: number;
  referrals: number;
  depth: number;
  status: "active" | "idle" | "churned";
  referredBy?: string;
}

export interface OracleForecast {
  id: string;
  title: string;
  type: "hall_revenue" | "asset_launch";
  verticalOptions?: string[];
  countryOptions?: string[];
  lockDate: string;
  status: "active" | "locked" | "resolved";
  resolvedOutcome?: string;
  createdAt: string;
}

export interface OraclePrediction {
  id: string;
  forecastId: string;
  ledgerId: string;
  vertical: string;
  country: string;
  pointsEarned: number;
  status: "pending" | "correct" | "incorrect";
}

export interface OracleStanding {
  id: string;
  ledgerId: string;
  totalPoints: number;
  correctCount: number;
  tier: "seer" | "oracle" | "prophet";
}

export interface OracleLeader {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  totalPoints: number;
  tier: string;
}

export interface CountryStat {
  country: string;
  participants: number;
  pools: number;
  committed: number;
  won: number;
  revenue: number;
  growth: number;
}

export type RewardStatus = "pending" | "paid";

export interface ReferralReward {
  id: string;
  toLedgerId: string;
  fromLedgerId: string;
  fromDisplayName: string;
  type: "commit" | "win";
  amount: number;
  rewardPercent: number;
  rewardAmount: number;
  status: RewardStatus;
  createdAt: string;
}

export interface KnotStats {
  directReferrals: number;
  networkDepth: number;
  totalNetwork: number;
  activeNetwork: number;
  totalRewards: number;
  pendingRewards: number;
  inviteCode: string;
  inviteLink: string;
  codeUses: number;
  codeMax: number;
}

/* ============================================================
   INVITE CODES
   ============================================================ */

export interface InviteCode {
  id: string;
  code: string;
  ownerId: string;
  uses: number;
  maxUses: number;
  createdAt: string;
  expiresAt?: string;
}

/* ============================================================
   MERIDIAN CYCLE
   ============================================================ */

export type MeridianPhase = "hush" | "unveil" | "reveal" | "forge";

export interface MeridianCycle {
  id: string;
  continent: string;
  phase: MeridianPhase;
  startAt: string;
  endAt: string;
  lockStatus: string;
  winnerPoolId?: string;
  createdAt: string;
}

export interface CyclePool {
  id: string;
  cycleId: string;
  poolId: string;
  voteCount: number;
  voteWeight: number;
  isWinner: boolean;
  revealedAt?: string;
}

export interface CycleVote {
  id: string;
  cycleId: string;
  ledgerId: string;
  poolId: string;
  votedAt: string;
}

/* ============================================================
   TREASURY
   ============================================================ */

export type TreasuryTxType =
  | "revenue_in"
  | "dividend_out"
  | "pir_in"
  | "payroll_out"
  | "marketplace_fee"
  | "withdrawal"
  | "operations"
  | "closure_payout";

export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "rejected";
export type DestinationType = "bank" | "usdc" | "crypto";

export interface TreasuryTransaction {
  id: string;
  type: TreasuryTxType;
  amount: number;
  currency: "USD" | "LED";
  poolId?: string;
  ledgerId?: string;
  description: string;
  status: "completed" | "pending" | "rejected";
  txHash: string;
  timestamp: string;
  audited: boolean;
}

export interface WithdrawalRequest {
  id: string;
  ledgerId: string;
  displayName: string;
  amount: number;
  destination: string;
  destinationType: DestinationType;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
}

export interface TreasuryState {
  totalRevenueUSD: number;
  totalDividendsUSD: number;
  totalPIR: number;
  totalPayroll: number;
  circulatingLED: number;
  pendingWithdrawals: number;
  dailyVolumeUSD: number;
  dailyVolumeLED: number;
  ledgerTitheRate: number;
  protocolFeeRate: number;
}

export type AuditEntryType =
  | "pool_created"
  | "consensus_run"
  | "revenue_distributed"
  | "pir_allocated"
  | "withdrawal"
  | "tier_upgrade"
  | "closure_executed"
  | "worker_hired"
  | "marketplace_transfer";

export interface AuditEntry {
  id: string;
  timestamp: string;
  type: AuditEntryType;
  description: string;
  amount?: number;
  txHash: string;
  ledgerId?: string;
}

export interface AuditTrail {
  entries: TreasuryTransaction[];
  totalVolume: number;
  totalWithdrawn: number;
  lastAuditDate: string;
  integrityHash: string;
}

/* ============================================================
   HALLS & GOVERNANCE
   ============================================================ */

export interface Hall {
  id: string;
  hallId: string;
  poolId: string;
  name: string;
  status: "ghost" | "live" | "closed" | "dissolved";
  hallClass: HallClass;
  sriScore: number;
  ahgiScore: number;
  closureStatus?: string;
  executiveCabinetId?: string;
  pirDebt: number;
  payrollReserve: number;
  memberCount: number;
  createdAt: string;
}

export interface ExecutiveCabinet {
  id: string;
  hallId: string;
  speakerId: string;
  treasurerId: string;
  wardenId: string;
  scribeId: string;
  electedAt: string;
  expiresAt: string;
}

export interface Proposal {
  id: string;
  hallId: string;
  title: string;
  description: string;
  type:
    | "strategy"
    | "hire"
    | "fire"
    | "maintenance"
    | "inventory_list"
    | "closure"
    | "pir_advance"
    | "location_select"
    | "sale";
  proposedBy: string;
  costEstimate?: number;
  voteThreshold: number;
  status:
    | "draft"
    | "active"
    | "passed"
    | "rejected"
    | "executing"
    | "completed"
    | "cancelled";
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  createdAt: string;
  closesAt: string;
  executedAt?: string;
}

export interface Vote {
  id: string;
  proposalId: string;
  ledgerId: string;
  weight: number;
  choice: "for" | "against" | "abstain";
  votedAt: string;
}

/* ============================================================
   WORKERS & FORGE LEDGER
   ============================================================ */

export interface Worker {
  id: string;
  hallId: string;
  workerNumber: string;
  role: string;
  salary: number;
  contractMonths: number;
  hiredAt: string;
  status: "active" | "probation" | "terminated";
  performanceScore?: number;
}

export interface WorkerPerformance {
  id: string;
  workerId: string;
  reviewedAt: string;
  metrics: Record<string, number>;
  score: number;
  reviewerId: string;
  improvementPlan?: string;
}

export interface ForgeLedger {
  id: string;
  hallId: string;
  month: string;
  totalPayroll: number;
  workerCount: number;
  entries: ForgeLedgerEntry[];
}

export interface ForgeLedgerEntry {
  workerId: string;
  workerNumber: string;
  role: string;
  salary: number;
  status: string;
  performanceNote?: string;
}

export interface RelayMessage {
  id: string;
  hallId: string;
  workerId: string;
  direction: "hall_to_worker" | "worker_to_hall";
  content: string;
  relayedAt: string;
  status: "pending" | "delivered" | "read";
}

/* ============================================================
   SRI & AHGI
   ============================================================ */

export interface SriSnapshot {
  id: string;
  hallId: string;
  score: number;
  governanceActivity: number;
  revenueConsistency: number;
  dividendReliability: number;
  proposalQuality: number;
  dormancyRate: number;
  marketplaceVelocity: number;
  recordedAt: string;
}

export interface AhgiSnapshot {
  id: string;
  hallId: string;
  score: number;
  healthMetrics: Record<string, number>;
  growthMetrics: Record<string, number>;
  recordedAt: string;
}

export interface DynamicValuation {
  id: string;
  hallId: string;
  assetBookValue: number;
  accumulatedDividendsPerPercent: number;
  ahgiPremium: number;
  sriBonus: number;
  pirDebtPerPercent: number;
  calculatedAt: string;
}

/* ============================================================
   CLOSURE PROTOCOL
   ============================================================ */

export type ClosurePhase = "warning" | "decision" | "liquidation";

export interface ClosureProtocol {
  id: string;
  hallId: string;
  triggerMonth: string;
  ahgiAtTrigger: number;
  revenueAtTrigger: number;
  phase: ClosurePhase;
  liquidationValue?: number;
  status: "active" | "completed";
  closedAt?: string;
}

export interface LiquidationPayout {
  id: string;
  closureId: string;
  ledgerId: string;
  ownershipPercent: number;
  amount: number;
  status: "pending" | "paid";
  paidAt?: string;
}

/* ============================================================
   DORMANCY
   ============================================================ */

export interface DormancyVault {
  id: string;
  ledgerId: string;
  ownershipId: string;
  vaultedAt: string;
  accumulatedDividends: number;
  status: "vaulted" | "reclaimed" | "auctioned";
}

export interface DormancyAuction {
  id: string;
  vaultId: string;
  listedAt: string;
  startingPrice: number;
  finalPrice?: number;
  buyerId?: string;
  status: "active" | "sold" | "expired";
  completedAt?: string;
}

/* ============================================================
   AGORA
   ============================================================ */

export interface AgoraSuggestion {
  id: string;
  ledgerId: string;
  title: string;
  description: string;
  continent: string;
  vertical: string;
  upvotes: number;
  downvotes: number;
  status: "pending" | "under_review" | "approved" | "rejected";
  createdAt: string;
}

export interface AgoraQA {
  id: string;
  ledgerId: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  status: "pending" | "answered";
  createdAt: string;
}

/* ============================================================
   INVENTORY MARKET
   ============================================================ */

export interface InventoryItem {
  id: string;
  hallId: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  quantitySold: number;
  status: "active" | "sold_out" | "delisted";
  listedAt: string;
}

export interface InventoryOrder {
  id: string;
  inventoryId: string;
  buyerId: string;
  amount: number;
  quantity: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "refunded";
  escrowReleasedAt?: string;
}

/* ============================================================
   8TH LEDGER UPDATES
   ============================================================ */

export interface EighthLedgerUpdate {
  id: string;
  hallId: string;
  type:
    | "insurance"
    | "repair"
    | "tax"
    | "payroll"
    | "valuation"
    | "pir_advance"
    | "maintenance";
  title: string;
  content: string;
  amount?: number;
  createdAt: string;
}

/* ============================================================
   ACTIVITY & REVIEWS
   ============================================================ */

export type ActivityType =
  | "commit"
  | "win"
  | "return"
  | "review"
  | "referral"
  | "dividend"
  | "marketplace_sale"
  | "marketplace_purchase";

export interface ActivityEvent {
  id: string;
  ledgerId: string;
  date: string;
  type: ActivityType;
  title: string;
  detail: string;
  amount?: number;
  points?: number;
}

export type ReviewStatus = "visible" | "under_review" | "removed";

export interface Review {
  id: string;
  ledgerId: string;
  propertyName: string;
  verticalId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string;
  helpful: number;
  reported: boolean;
  status: ReviewStatus;
}

/* ============================================================
   MONARCHS & LEADERBOARD
   ============================================================ */

export interface Monarch {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  tier: TierLevel;
  trustScore: number;
  totalCommitted: number;
  totalWon: number;
  winCount: number;
  networkSize: number;
  referrals: number;
  poolsEntered: number;
  streak: number;
  avatarSeed: string;
  title?: string;
}

export interface AscensionEvent {
  id: string;
  ledgerId: string;
  displayName: string;
  fromTier: TierLevel;
  toTier: TierLevel;
  date: string;
}

/* ============================================================
   API RESPONSE WRAPPERS
   ============================================================ */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/* ============================================================
   UI / COMPONENT PROPS (Shared)
   ============================================================ */

export interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  section: "protocol" | "personal" | "sovereign";
}

/* ============================================================
   PROTOCOL SETTINGS
   ============================================================ */

export interface ProtocolSettings {
  id: string;
  key: string;
  ledgerTitheRate: number;
  platformFee: number;
  minCommitment: number;
  maxCommitment: number;
  consensusThreshold: number;
  pirAllocationRate: number;
  publicAudit: boolean;
  meridianEnabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

/* ============================================================
   UTILITY TYPES
   ============================================================ */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
