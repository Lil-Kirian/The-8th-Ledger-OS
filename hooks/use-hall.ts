"use client";

import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Hall System
   ============================================================ */

export interface Hall {
  id: string;
  name: string;
  status: string; // ghost | live | mature | dormant | dissolved
  createdAt: string;
  updatedAt: string;
  poolId: string;
  pool?: {
    poolId: string;
    name: string;
    verticalId: string;
    listedPrice: number;
    committed: number;
    target: number;
    fillPercent: number;
    status: string;
    country: string;
    imageUrl: string | null;
    hallClass: string | null; // I | II | III
    assetBookValue: number;
  };
  // 8th Ledger Hall Fields
  hallClass: string | null;
  sriScore: number;
  ahgiScore: number;
  closureStatus: string; // active | warning | decision | liquidation | dissolved
  executiveCabinet?: ExecutiveCabinet;
  pirDebt: number;
  payrollReserve: number;
  // Document Vault
  deedUrl: string | null;
  insuranceCertificateUrl: string | null;
  spvAgreementUrl: string | null;
  constitutionUrl: string | null;
  treasury?: {
    balance: number;
    totalDistributed: number;
    totalRevenue: number;
    payrollReserve: number;
    pirDebt: number;
    closureReserve: number;
    monthlyRevenue: number;
  };
  stats?: {
    memberCount: number;
    activeProposalCount: number;
    myOwnershipPercent: number;
    totalWorkers: number;
    lastDistribution: string | null;
  };
}

export interface ExecutiveCabinet {
  id: string;
  hallId: string;
  speakerId: string | null;
  speaker: CabinetMember | null;
  treasurerId: string | null;
  treasurer: CabinetMember | null;
  wardenId: string | null;
  warden: CabinetMember | null;
  scribeId: string | null;
  scribe: CabinetMember | null;
  electedAt: string;
  expiresAt: string;
  isImpeached: boolean;
}

export interface CabinetMember {
  ledgerId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface HallMembership {
  id: string;
  ownershipPercent: number;
  pacToken: string | null;
  totalReturned: number;
  status: string;
  role: string | null; // legacy
  joinedAt: string;
  inviteCodesRemaining: number;
  isBanned: boolean;
  // 8th Ledger Fields
  dynamicValue: number;
  accumulatedDividends: number;
  pirDebt: number;
  isSpeaker: boolean;
  isTreasurer: boolean;
  isWarden: boolean;
  isScribe: boolean;
  isExecutive: boolean; // any cabinet role
}

export interface HallListItem {
  id: string;
  name: string;
  status: string;
  pool: Hall["pool"];
  myOwnershipPercent: number;
  myRole: string | null;
  sriScore: number;
  ahgiScore: number;
  closureStatus: string;
  unreadPosts: number;
}

export interface SriBreakdown {
  governanceActivity: number;
  revenueConsistency: number;
  dividendReliability: number;
  proposalQuality: number;
  dormancyRate: number;
  marketplaceVelocity: number;
}

export interface AhgiMetrics {
  healthMetrics: Record<string, number>;
  growthMetrics: Record<string, number>;
}

export interface ForgeLedgerEntry {
  month: string;
  totalPayroll: number;
  workerCount: number;
  entries: Array<{
    workerId: string;
    workerNumber: string;
    role: string;
    salary: number;
    status: string;
  }>;
}

export interface Worker {
  id: string;
  workerNumber: string;
  role: string;
  salary: number;
  contractMonths: number;
  hiredAt: string;
  status: string;
  performanceScore: number;
}

export interface ClosureStatus {
  phase: string;
  triggerMonth: string;
  ahgiAtTrigger: number;
  revenueAtTrigger: number;
  payrollAtTrigger: number;
  liquidationValue: number | null;
  netProceeds: number | null;
  estimatedPayout: number | null;
  daysRemaining: number | null;
}

export interface DynamicValuation {
  assetBookValue: number;
  accumulatedDividendsPerPercent: number;
  ahgiPremium: number;
  sriBonus: number;
  pirDebtPerPercent: number;
  valuePerPercent: number;
  calculatedAt: string;
}

/* ============================================================
   FETCHER
   ============================================================ */
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json;
};

/* ============================================================
   CONFIG
   ============================================================ */
const SWR_CONFIG = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
};

const LIVE_CONFIG = {
  ...SWR_CONFIG,
  refreshInterval: 10000,
};

/* ============================================================
   HELPERS
   ============================================================ */

function enrichHall(raw: Record<string, unknown>): Hall {
  const poolRaw = raw.pool as Record<string, unknown> | undefined;
  const treasuryRaw = raw.treasury as Record<string, unknown> | undefined;
  const cabinetRaw = raw.executiveCabinet as Record<string, unknown> | undefined;

  return {
    id: String(raw.id),
    name: String(raw.name || ""),
    status: String(raw.status || "ghost"),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
    poolId: String(raw.poolId || raw.pool_id),
    pool: poolRaw
      ? {
          poolId: String(poolRaw.poolId || poolRaw.pool_id || ""),
          name: String(poolRaw.name || ""),
          verticalId: String(poolRaw.verticalId || poolRaw.vertical_id || ""),
          listedPrice: Number(poolRaw.listedPrice || poolRaw.listed_price || 0),
          committed: Number(poolRaw.committed || 0),
          target: Number(poolRaw.target || 0),
          fillPercent: Number(poolRaw.fillPercent || poolRaw.fill_percent || 0),
          status: String(poolRaw.status || ""),
          country: String(poolRaw.country || ""),
          imageUrl: (poolRaw.imageUrl || poolRaw.image_url) as string | null,
          hallClass: (poolRaw.hallClass || poolRaw.hall_class) as string | null,
          assetBookValue: Number(poolRaw.assetBookValue || poolRaw.asset_book_value || 0),
        }
      : undefined,
    hallClass: (raw.hallClass || raw.hall_class) as string | null,
    sriScore: Number(raw.sriScore || raw.sri_score || 50),
    ahgiScore: Number(raw.ahgiScore || raw.ahgi_score || 50),
    closureStatus: String(raw.closureStatus || raw.closure_status || "active"),
    executiveCabinet: cabinetRaw ? enrichCabinet(cabinetRaw) : undefined,
    pirDebt: Number(raw.pirDebt || raw.pir_debt || 0),
    payrollReserve: Number(raw.payrollReserve || raw.payroll_reserve || 0),
    deedUrl: (raw.deedUrl || raw.deed_url) as string | null,
    insuranceCertificateUrl: (raw.insuranceCertificateUrl || raw.insurance_certificate_url) as string | null,
    spvAgreementUrl: (raw.spvAgreementUrl || raw.spv_agreement_url) as string | null,
    constitutionUrl: (raw.constitutionUrl || raw.constitution_url) as string | null,
    treasury: treasuryRaw
      ? {
          balance: Number(treasuryRaw.balance || 0),
          totalDistributed: Number(treasuryRaw.totalDistributed || treasuryRaw.total_distributed || 0),
          totalRevenue: Number(treasuryRaw.totalRevenue || treasuryRaw.total_revenue || 0),
          payrollReserve: Number(treasuryRaw.payrollReserve || treasuryRaw.payroll_reserve || 0),
          pirDebt: Number(treasuryRaw.pirDebt || treasuryRaw.pir_debt || 0),
          closureReserve: Number(treasuryRaw.closureReserve || treasuryRaw.closure_reserve || 0),
          monthlyRevenue: Number(treasuryRaw.monthlyRevenue || treasuryRaw.monthly_revenue || 0),
        }
      : undefined,
    stats: raw.stats as Hall["stats"],
  };
}

function enrichCabinet(raw: Record<string, unknown>): ExecutiveCabinet {
  const speakerRaw = raw.speaker as Record<string, unknown> | undefined;
  const treasurerRaw = raw.treasurer as Record<string, unknown> | undefined;
  const wardenRaw = raw.warden as Record<string, unknown> | undefined;
  const scribeRaw = raw.scribe as Record<string, unknown> | undefined;

  const buildMember = (m: Record<string, unknown> | undefined): CabinetMember | null => {
    if (!m) return null;
    return {
      ledgerId: String(m.ledgerId || m.vinculumId || ""),
      displayName: String(m.displayName || m.display_name || ""),
      avatarUrl: (m.avatarUrl || m.avatar_url) as string | null,
    };
  };

  return {
    id: String(raw.id),
    hallId: String(raw.hallId || raw.hall_id),
    speakerId: (raw.speakerId || raw.speaker_id) as string | null,
    speaker: buildMember(speakerRaw),
    treasurerId: (raw.treasurerId || raw.treasurer_id) as string | null,
    treasurer: buildMember(treasurerRaw),
    wardenId: (raw.wardenId || raw.warden_id) as string | null,
    warden: buildMember(wardenRaw),
    scribeId: (raw.scribeId || raw.scribe_id) as string | null,
    scribe: buildMember(scribeRaw),
    electedAt: String(raw.electedAt || raw.elected_at || new Date().toISOString()),
    expiresAt: String(raw.expiresAt || raw.expires_at || ""),
    isImpeached: Boolean(raw.isImpeached || raw.is_impeached || false),
  };
}

function enrichMembership(raw: Record<string, unknown>): HallMembership {
  const cabinetRaw = raw.executiveCabinet as Record<string, unknown> | undefined;
  const isSpeaker = Boolean(raw.isSpeaker || raw.is_speaker || cabinetRaw?.role === "speaker");
  const isTreasurer = Boolean(raw.isTreasurer || raw.is_treasurer || cabinetRaw?.role === "treasurer");
  const isWarden = Boolean(raw.isWarden || raw.is_warden || cabinetRaw?.role === "warden");
  const isScribe = Boolean(raw.isScribe || raw.is_scribe || cabinetRaw?.role === "scribe");

  return {
    id: String(raw.id),
    ownershipPercent: Number(raw.ownershipPercent || raw.ownership_percent || 0),
    pacToken: (raw.pacToken || raw.pac_token) as string | null,
    totalReturned: Number(raw.totalReturned || raw.total_returned || 0),
    status: String(raw.status || "active"),
    role: (raw.role as string) || null,
    joinedAt: String(raw.joinedAt || raw.joined_at || new Date().toISOString()),
    inviteCodesRemaining: Number(raw.inviteCodesRemaining || raw.invite_codes_remaining || 0),
    isBanned: Boolean(raw.isBanned || raw.is_banned || false),
    dynamicValue: Number(raw.dynamicValue || raw.dynamic_value || 0),
    accumulatedDividends: Number(raw.accumulatedDividends || raw.accumulated_dividends || 0),
    pirDebt: Number(raw.pirDebt || raw.pir_debt || 0),
    isSpeaker,
    isTreasurer,
    isWarden,
    isScribe,
    isExecutive: isSpeaker || isTreasurer || isWarden || isScribe,
  };
}

function enrichWorker(raw: Record<string, unknown>): Worker {
  return {
    id: String(raw.id),
    workerNumber: String(raw.workerNumber || raw.worker_number || ""),
    role: String(raw.role || ""),
    salary: Number(raw.salary || 0),
    contractMonths: Number(raw.contractMonths || raw.contract_months || 0),
    hiredAt: String(raw.hiredAt || raw.hired_at || new Date().toISOString()),
    status: String(raw.status || "active"),
    performanceScore: Number(raw.performanceScore || raw.performance_score || 0),
  };
}

/* ============================================================
   HOOK: useHall — Single hall detail
   ============================================================ */
export function useHall(hallId: string | null | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}` : null,
    fetcher,
    SWR_CONFIG
  );

  const hall = data?.hall ? enrichHall(data.hall as Record<string, unknown>) : undefined;

  return {
    hall,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useHallMembership — Current user's membership
   ============================================================ */
export function useHallMembership(hallId: string | null | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/membership` : null,
    fetcher,
    SWR_CONFIG
  );

  const membership = data?.membership
    ? enrichMembership(data.membership as Record<string, unknown>)
    : undefined;

  return {
    membership,
    isMember: !!membership && membership.status === "active",
    isExecutive: membership?.isExecutive || false,
    isSpeaker: membership?.isSpeaker || false,
    isTreasurer: membership?.isTreasurer || false,
    isWarden: membership?.isWarden || false,
    isScribe: membership?.isScribe || false,
    isBanned: membership?.isBanned || false,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHalls — List halls
   ============================================================ */
interface UseHallsOptions {
  status?: string;
  vertical?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
}

export function useHalls(options: UseHallsOptions = {}) {
  const { status, vertical, mine, page = 1, limit = 20 } = options;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (vertical) params.set("vertical", vertical);
  if (mine) params.set("mine", "true");
  params.set("page", String(page));
  params.set("limit", String(limit));

  const qs = params.toString();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/halls?${qs}`,
    fetcher,
    SWR_CONFIG
  );

  const halls = (data?.halls as Record<string, unknown>[] | undefined)?.map(
    (h) => {
      const poolRaw = h.pool as Record<string, unknown> | undefined;
      return {
        id: String(h.id),
        name: String(h.name || ""),
        status: String(h.status || ""),
        pool: poolRaw
          ? {
              poolId: String(poolRaw.poolId || poolRaw.pool_id || ""),
              name: String(poolRaw.name || ""),
              verticalId: String(poolRaw.verticalId || poolRaw.vertical_id || ""),
              listedPrice: Number(poolRaw.listedPrice || poolRaw.listed_price || 0),
              committed: Number(poolRaw.committed || 0),
              target: Number(poolRaw.target || 0),
              fillPercent: Number(poolRaw.fillPercent || poolRaw.fill_percent || 0),
              status: String(poolRaw.status || ""),
              country: String(poolRaw.country || ""),
              imageUrl: (poolRaw.imageUrl || poolRaw.image_url) as string | null,
              hallClass: (poolRaw.hallClass || poolRaw.hall_class) as string | null,
              assetBookValue: Number(poolRaw.assetBookValue || poolRaw.asset_book_value || 0),
            }
          : undefined,
        myOwnershipPercent: Number(h.myOwnershipPercent || h.my_ownership_percent || 0),
        myRole: (h.myRole || h.my_role) as string | null,
        sriScore: Number(h.sriScore || h.sri_score || 50),
        ahgiScore: Number(h.ahgiScore || h.ahgi_score || 50),
        closureStatus: String(h.closureStatus || h.closure_status || "active"),
        unreadPosts: Number(h.unreadPosts || h.unread_posts || 0),
      } as HallListItem;
    }
  ) || [];

  return {
    halls,
    meta: data?.meta,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useHallStats — Live hall stats
   ============================================================ */
export function useHallStats(hallId: string | null | undefined) {
  const { data, error, isLoading } = useSWR(
    hallId ? `/api/halls/${hallId}/stats` : null,
    fetcher,
    LIVE_CONFIG
  );

  return {
    stats: data?.stats as
      | {
          memberCount: number;
          activeProposals: number;
          treasuryBalance: number;
          sovereignStreamPosts24h: number;
          totalWorkers: number;
          sriScore: number;
          ahgiScore: number;
          lastDistribution: string | null;
        }
      | undefined,
    isLoading,
    isError: !!error,
    error: error?.message || null,
  };
}

/* ============================================================
   HOOK: useHallSRI — Sovereign Reputation Index
   ============================================================ */
export function useHallSRI(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/sri/hall/${hallId}` : null,
    fetcher,
    SWR_CONFIG
  );

  const breakdown = data?.breakdown as SriBreakdown | undefined;
  const score = Number(data?.score || 50);
  const tier = score >= 90 ? "platinum" : score >= 75 ? "gold" : score >= 60 ? "silver" : score >= 40 ? "bronze" : "at_risk";

  return {
    score,
    tier,
    breakdown,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHallAHGI — Asset Health Growth Index
   ============================================================ */
export function useHallAHGI(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/ahgi/hall/${hallId}` : null,
    fetcher,
    SWR_CONFIG
  );

  const metrics = data?.metrics as AhgiMetrics | undefined;
  const score = Number(data?.score || 50);
  const status = score >= 80 ? "thriving" : score >= 60 ? "healthy" : score >= 40 ? "stagnant" : score >= 20 ? "declining" : "critical";

  return {
    score,
    status,
    metrics,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHallForge — Forge Ledger & Workers
   ============================================================ */
export function useHallForge(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/forge` : null,
    fetcher,
    SWR_CONFIG
  );

  const workers = (data?.workers as Record<string, unknown>[] | undefined)?.map(
    enrichWorker
  ) || [];

  const payrollHistory = (data?.payrollHistory as Record<string, unknown>[] | undefined)?.map(
    (e) => ({
      month: String(e.month || ""),
      totalPayroll: Number(e.totalPayroll || e.total_payroll || 0),
      workerCount: Number(e.workerCount || e.worker_count || 0),
      entries: (e.entries as Array<Record<string, unknown>> | undefined) || [],
    })
  ) || [];

  return {
    workers,
    payrollHistory,
    totalPayrollThisMonth: Number(data?.totalPayrollThisMonth || data?.total_payroll_this_month || 0),
    workerCount: workers.length,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHallClosure — Closure Protocol Status
   ============================================================ */
export function useHallClosure(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/closure` : null,
    fetcher,
    LIVE_CONFIG
  );

  const closure = data?.closure as ClosureStatus | undefined;

  return {
    closure,
    isActive: closure?.phase !== undefined,
    isWarning: closure?.phase === "warning",
    isDecision: closure?.phase === "decision",
    isLiquidation: closure?.phase === "liquidation",
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHallValuation — Dynamic PAC Valuation
   ============================================================ */
export function useHallValuation(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/valuation/hall/${hallId}` : null,
    fetcher,
    SWR_CONFIG
  );

  const valuation = data?.valuation as DynamicValuation | undefined;

  return {
    valuation,
    valuePerPercent: valuation?.valuePerPercent || 0,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHallCabinet — Executive Cabinet
   ============================================================ */
export function useHallCabinet(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/cabinet` : null,
    fetcher,
    SWR_CONFIG
  );

  const cabinet = data?.cabinet
    ? enrichCabinet(data.cabinet as Record<string, unknown>)
    : undefined;

  return {
    cabinet,
    hasCabinet: !!cabinet && !cabinet.isImpeached,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHallLedger — 8th Ledger Updates
   ============================================================ */
export function useHallLedger(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/ledger` : null,
    fetcher,
    SWR_CONFIG
  );

  const updates = (data?.updates as Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    amount: number | null;
    createdAt: string;
  }> | undefined) || [];

  return {
    updates,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useHallVault — Document Vault
   ============================================================ */
export function useHallVault(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/vault` : null,
    fetcher,
    SWR_CONFIG
  );

  const documents = (data?.documents as Array<{
    name: string;
    url: string;
    type: string;
    category: string;
    uploadedAt: string;
  }> | undefined) || [];

  return {
    documents,
    deedUrl: data?.deedUrl as string | undefined,
    insuranceUrl: data?.insuranceCertificateUrl as string | undefined,
    spvUrl: data?.spvAgreementUrl as string | undefined,
    constitutionUrl: data?.constitutionUrl as string | undefined,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}