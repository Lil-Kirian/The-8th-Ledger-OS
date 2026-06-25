"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Pool System
   ============================================================ */

export interface Pool {
  id: string;
  poolId: string;
  name: string;
  description: string;
  verticalId: string;
  country: string;
  imageUrl: string | null;
  assetValue: number;
  committed: number;
  target: number;
  participants: number;
  maxParticipants: number;
  status: string; // filling | filled | forged | active | dormant | sold | dissolved
  fillPercent: number;
  isVerified: boolean;
  createdAt: string;
  closesAt: string;
  distributedAt: string | null;
  // 8th Ledger Fields
  hallClass: string | null; // I | II | III
  listedPrice: number | null;
  minCommitment: number;
  maxCommitment: number | null;
  campaignDuration: number;
  emojiSet: string;
  hallUnlocked: boolean;
  selectedLocation: string | null;
  assetCondition: string;
  assetBookValue: number;
  meridianCycleId: string | null;
  // PIR (public-facing only — no amounts)
  pirProtected: boolean;
  // Relations
  hall?: {
    id: string;
    status: string;
    sriScore: number;
    ahgiScore: number;
    memberCount: number;
  };
  locationOptions?: LocationOption[];
  cyclePool?: CyclePoolInfo;
}

export interface PoolDetail extends Pool {
  // Founder/Admin sees these
  trueCost: number | null;
  surplus: number | null; // PIR amount
  spvEntityId: string | null;
  managementFee: number;
  pirAllocation: PirPillar[] | null;
  executionQueue: unknown[] | null;
  assetImages: string[] | null;
  assetVideos: unknown[] | null;
  tour360Url: string | null;
  documents: PoolDocument[] | null;
  externalLinks: unknown[] | null;
  // Ownership data (if committed)
  myOwnership?: {
    id: string;
    ownershipPercent: number;
    amountCommitted: number;
    pacToken: string | null;
    dynamicValue: number;
    accumulatedDividends: number;
    status: string;
  };
  // Invite status
  inviteStatus?: {
    code: string | null;
    remaining: number;
    used: number;
  };
  // Active proposals
  activeProposals: number;
  // Dynamic valuation preview
  valuationPreview?: {
    valuePerPercent: number;
    floorPrice: number;
    ahgiPremium: number;
    sriBonus: number;
  };
}

export interface PirPillar {
  pillar: string; // shield | seal | forge | spire | vanguard | sanctuary
  amount: number;
  purpose: string;
  percent: number;
}

export interface PoolDocument {
  name: string;
  url: string;
  type: string;
  category: "spv" | "insurance" | "legal";
}

export interface LocationOption {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  cost: number | null;
  image: string | null;
  description: string | null;
  votes: number;
  voteWeight: number;
  isSelected: boolean;
}

export interface CyclePoolInfo {
  cycleId: string;
  voteCount: number;
  voteWeight: number;
  isWinner: boolean;
  revealedAt: string | null;
}

export interface PoolCommitInput {
  amount: number;
  inviteCode?: string;
}

export interface PoolCommitResult {
  success: boolean;
  ownership?: {
    id: string;
    pacToken: string;
    ownershipPercent: number;
    amountCommitted: number;
  };
  error?: string;
}

export interface PoolCreateInput {
  name: string;
  description: string;
  verticalId: string;
  country: string;
  assetValue: number;
  trueCost: number;
  listedPrice: number;
  target: number;
  maxParticipants: number;
  minCommitment: number;
  maxCommitment?: number;
  campaignDuration: number;
  hallClass: string;
  imageUrl?: string;
  emojiSet?: string;
  assetCondition?: string;
  locationOptions?: Array<{
    name: string;
    address: string;
    lat?: number;
    lng?: number;
    cost?: number;
    image?: string;
    description?: string;
  }>;
}

export interface PoolFilters {
  verticalId?: string;
  status?: string;
  country?: string;
  hallClass?: string;
  meridianCycleId?: string;
  isVerified?: boolean;
  search?: string;
  minAssetValue?: number;
  maxAssetValue?: number;
  page?: number;
  limit?: number;
}

export interface PoolPosition {
  poolId: string;
  poolName: string;
  verticalId: string;
  country: string;
  imageUrl: string | null;
  ownershipPercent: number;
  amountCommitted: number;
  totalReturned: number;
  accumulatedDividends: number;
  dynamicValue: number;
  status: string;
  pacToken: string | null;
  hallStatus: string | null;
  hallSriScore: number;
  hallAhgiScore: number;
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

const ACTIVE_CONFIG = {
  ...SWR_CONFIG,
  refreshInterval: 15000, // 15s for filling pools
};

/* ============================================================
   HELPERS
   ============================================================ */

function enrichPool(raw: Record<string, unknown>): Pool {
  const hallRaw = raw.hall as Record<string, unknown> | undefined;
  const cycleRaw = raw.cyclePool as Record<string, unknown> | undefined;
  const locations = raw.locationOptions as Record<string, unknown>[] | undefined;

  const committed = Number(raw.committed || 0);
  const target = Number(raw.target || 1);

  return {
    id: String(raw.id),
    poolId: String(raw.poolId || raw.pool_id),
    name: String(raw.name || ""),
    description: String(raw.description || ""),
    verticalId: String(raw.verticalId || raw.vertical_id || ""),
    country: String(raw.country || ""),
    imageUrl: (raw.imageUrl || raw.image_url) as string | null,
    assetValue: Number(raw.assetValue || raw.asset_value || 0),
    committed,
    target,
    participants: Number(raw.participants || 0),
    maxParticipants: Number(raw.maxParticipants || raw.max_participants || 0),
    status: String(raw.status || "filling"),
    fillPercent: target > 0 ? Math.min((committed / target) * 100, 100) : 0,
    isVerified: Boolean(raw.isVerified || raw.is_verified || false),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    closesAt: String(raw.closesAt || raw.closes_at || new Date().toISOString()),
    distributedAt: (raw.distributedAt || raw.distributed_at) as string | null,
    hallClass: (raw.hallClass || raw.hall_class) as string | null,
    listedPrice: (raw.listedPrice || raw.listed_price) as number | null,
    minCommitment: Number(raw.minCommitment || raw.min_commitment || 1),
    maxCommitment: (raw.maxCommitment || raw.max_commitment) as number | null,
    campaignDuration: Number(raw.campaignDuration || raw.campaign_duration || 30),
    emojiSet: String(raw.emojiSet || raw.emoji_set || "🏠🚗📱🎓🏥🏗️✈️🌾⚡"),
    hallUnlocked: Boolean(raw.hallUnlocked || raw.hall_unlocked || false),
    selectedLocation: (raw.selectedLocation || raw.selected_location) as string | null,
    assetCondition: String(raw.assetCondition || raw.asset_condition || "new"),
    assetBookValue: Number(raw.assetBookValue || raw.asset_book_value || 0),
    meridianCycleId: (raw.meridianCycleId || raw.meridian_cycle_id) as string | null,
    pirProtected: Boolean(raw.pirProtected || raw.pir_protected || true),
    hall: hallRaw
      ? {
          id: String(hallRaw.id),
          status: String(hallRaw.status || "ghost"),
          sriScore: Number(hallRaw.sriScore || hallRaw.sri_score || 50),
          ahgiScore: Number(hallRaw.ahgiScore || hallRaw.ahgi_score || 50),
          memberCount: Number(hallRaw.memberCount || hallRaw.member_count || 0),
        }
      : undefined,
    locationOptions: locations?.map((loc) => ({
      id: String(loc.id),
      name: String(loc.name || ""),
      address: String(loc.address || ""),
      lat: (loc.lat as number) || null,
      lng: (loc.lng as number) || null,
      cost: (loc.cost as number) || null,
      image: (loc.image as string) || null,
      description: (loc.description as string) || null,
      votes: Number(loc.votes || 0),
      voteWeight: Number(loc.voteWeight || loc.vote_weight || 0),
      isSelected: Boolean(loc.isSelected || loc.is_selected || false),
    })),
    cyclePool: cycleRaw
      ? {
          cycleId: String(cycleRaw.cycleId || cycleRaw.cycle_id),
          voteCount: Number(cycleRaw.voteCount || cycleRaw.vote_count || 0),
          voteWeight: Number(cycleRaw.voteWeight || cycleRaw.vote_weight || 0),
          isWinner: Boolean(cycleRaw.isWinner || cycleRaw.is_winner || false),
          revealedAt: (cycleRaw.revealedAt || cycleRaw.revealed_at) as string | null,
        }
      : undefined,
  };
}

function enrichPoolDetail(raw: Record<string, unknown>): PoolDetail {
  const base = enrichPool(raw);
  const myOwnershipRaw = raw.myOwnership as Record<string, unknown> | undefined;
  const valuationRaw = raw.valuationPreview as Record<string, unknown> | undefined;
  const pirAlloc = raw.pirAllocation as string | Record<string, unknown>[] | undefined;

  let pirAllocation: PirPillar[] | null = null;
  if (typeof pirAlloc === "string") {
    try {
      pirAllocation = JSON.parse(pirAlloc);
    } catch {
      pirAllocation = null;
    }
  } else if (Array.isArray(pirAlloc)) {
    pirAllocation = pirAlloc.map((p) => ({
      pillar: String(p.pillar || ""),
      amount: Number(p.amount || 0),
      purpose: String(p.purpose || ""),
      percent: Number(p.percent || 0),
    }));
  }

  const docs = raw.documents as string | Record<string, unknown>[] | undefined;
  let documents: PoolDocument[] | null = null;
  if (typeof docs === "string") {
    try {
      documents = JSON.parse(docs);
    } catch {
      documents = null;
    }
  } else if (Array.isArray(docs)) {
    documents = docs.map((d) => ({
      name: String(d.name || ""),
      url: String(d.url || ""),
      type: String(d.type || ""),
      category: String(d.category || "legal") as PoolDocument["category"],
    }));
  }

  return {
    ...base,
    trueCost: (raw.trueCost || raw.true_cost) as number | null,
    surplus: (raw.surplus || raw.pirAmount || raw.pir_amount) as number | null,
    spvEntityId: (raw.spvEntityId || raw.spv_entity_id) as string | null,
    managementFee: Number(raw.managementFee || raw.management_fee || 20),
    pirAllocation,
    executionQueue: raw.executionQueue
      ? typeof raw.executionQueue === "string"
        ? JSON.parse(String(raw.executionQueue))
        : raw.executionQueue
      : null,
    assetImages: raw.assetImages
      ? typeof raw.assetImages === "string"
        ? JSON.parse(String(raw.assetImages))
        : (raw.assetImages as string[])
      : null,
    assetVideos: raw.assetVideos
      ? typeof raw.assetVideos === "string"
        ? JSON.parse(String(raw.assetVideos))
        : (raw.assetVideos as unknown[])
      : null,
    tour360Url: (raw.tour360Url || raw.tour360_url) as string | null,
    documents,
    externalLinks: raw.externalLinks
      ? typeof raw.externalLinks === "string"
        ? JSON.parse(String(raw.externalLinks))
        : (raw.externalLinks as unknown[])
      : null,
    myOwnership: myOwnershipRaw
      ? {
          id: String(myOwnershipRaw.id),
          ownershipPercent: Number(myOwnershipRaw.ownershipPercent || myOwnershipRaw.ownership_percent || 0),
          amountCommitted: Number(myOwnershipRaw.amountCommitted || myOwnershipRaw.amount_committed || 0),
          pacToken: (myOwnershipRaw.pacToken || myOwnershipRaw.pac_token) as string | null,
          dynamicValue: Number(myOwnershipRaw.dynamicValue || myOwnershipRaw.dynamic_value || 0),
          accumulatedDividends: Number(
            myOwnershipRaw.accumulatedDividends || myOwnershipRaw.accumulated_dividends || 0
          ),
          status: String(myOwnershipRaw.status || "active"),
        }
      : undefined,
    inviteStatus: raw.inviteStatus
      ? {
          code: (raw.inviteStatus as Record<string, unknown>).code as string | null,
          remaining: Number((raw.inviteStatus as Record<string, unknown>).remaining || 0),
          used: Number((raw.inviteStatus as Record<string, unknown>).used || 0),
        }
      : undefined,
    activeProposals: Number(raw.activeProposals || raw.active_proposals || 0),
    valuationPreview: valuationRaw
      ? {
          valuePerPercent: Number(valuationRaw.valuePerPercent || valuationRaw.value_per_percent || 0),
          floorPrice: Number(valuationRaw.floorPrice || valuationRaw.floor_price || 0),
          ahgiPremium: Number(valuationRaw.ahgiPremium || valuationRaw.ahgi_premium || 0),
          sriBonus: Number(valuationRaw.sriBonus || valuationRaw.sri_bonus || 0),
        }
      : undefined,
  };
}

function enrichPosition(raw: Record<string, unknown>): PoolPosition {
  const poolRaw = raw.pool as Record<string, unknown> | undefined;
  const hallRaw = raw.hall as Record<string, unknown> | undefined;

  return {
    poolId: String(raw.poolId || raw.pool_id || ""),
    poolName: String(raw.poolName || raw.pool_name || poolRaw?.name || ""),
    verticalId: String(raw.verticalId || raw.vertical_id || poolRaw?.verticalId || ""),
    country: String(raw.country || poolRaw?.country || ""),
    imageUrl: (raw.imageUrl || raw.image_url || poolRaw?.imageUrl) as string | null,
    ownershipPercent: Number(raw.ownershipPercent || raw.ownership_percent || 0),
    amountCommitted: Number(raw.amountCommitted || raw.amount_committed || 0),
    totalReturned: Number(raw.totalReturned || raw.total_returned || 0),
    accumulatedDividends: Number(
      raw.accumulatedDividends || raw.accumulated_dividends || 0
    ),
    dynamicValue: Number(raw.dynamicValue || raw.dynamic_value || 0),
    status: String(raw.status || "active"),
    pacToken: (raw.pacToken || raw.pac_token) as string | null,
    hallStatus: hallRaw ? String(hallRaw.status || "ghost") : null,
    hallSriScore: Number(hallRaw?.sriScore || hallRaw?.sri_score || 50),
    hallAhgiScore: Number(hallRaw?.ahgiScore || hallRaw?.ahgi_score || 50),
  };
}

/* ============================================================
   HOOK: usePools — Browse pool directory
   ============================================================ */
export function usePools(filters: PoolFilters = {}) {
  const {
    verticalId,
    status,
    country,
    hallClass,
    meridianCycleId,
    isVerified,
    search,
    minAssetValue,
    maxAssetValue,
    page = 1,
    limit = 20,
  } = filters;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (verticalId) params.set("verticalId", verticalId);
  if (status) params.set("status", status);
  if (country) params.set("country", country);
  if (hallClass) params.set("hallClass", hallClass);
  if (meridianCycleId) params.set("meridianCycleId", meridianCycleId);
  if (isVerified !== undefined) params.set("isVerified", String(isVerified));
  if (search) params.set("search", search);
  if (minAssetValue) params.set("minAssetValue", String(minAssetValue));
  if (maxAssetValue) params.set("maxAssetValue", String(maxAssetValue));

  const qs = params.toString();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/pools?${qs}`,
    fetcher,
    SWR_CONFIG
  );

  const pools = useMemo(() => {
    if (!data?.pools) return [];
    return (data.pools as Record<string, unknown>[]).map(enrichPool);
  }, [data]);

  const stats = useMemo(() => {
    return {
      total: data?.meta?.total || 0,
      filling: pools.filter((p) => p.status === "filling").length,
      active: pools.filter((p) => p.status === "active").length,
      totalCommitted: pools.reduce((s, p) => s + p.committed, 0),
    };
  }, [pools, data]);

  return {
    pools,
    stats,
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
   HOOK: usePool — Single pool detail
   ============================================================ */
export function usePool(poolId: string | null | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    poolId ? `/api/pools/${poolId}` : null,
    fetcher,
    ACTIVE_CONFIG
  );

  const pool = useMemo(() => {
    if (!data?.pool) return undefined;
    return enrichPoolDetail(data.pool as Record<string, unknown>);
  }, [data]);

  return {
    pool,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: usePoolCommit — Commit to a pool
   ============================================================ */
export function usePoolCommit(poolId: string | null | undefined) {
  const { mutate: mutatePool } = useSWR(
    poolId ? `/api/pools/${poolId}` : null
  );
  const { mutate: mutatePositions } = useSWR("/api/positions");

  const commit = useCallback(
    async (input: PoolCommitInput): Promise<PoolCommitResult> => {
      if (!poolId) return { success: false, error: "No pool selected" };

      try {
        const res = await fetch(`/api/pools/${poolId}/commit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Commitment failed",
          };
        }

        await mutatePool();
        await mutatePositions();

        return {
          success: true,
          ownership: json.ownership
            ? {
                id: String(json.ownership.id),
                pacToken: String(json.ownership.pacToken || json.ownership.pac_token),
                ownershipPercent: Number(
                  json.ownership.ownershipPercent || json.ownership.ownership_percent
                ),
                amountCommitted: Number(
                  json.ownership.amountCommitted || json.ownership.amount_committed
                ),
              }
            : undefined,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [poolId, mutatePool, mutatePositions]
  );

  return {
    commit,
    isReady: !!poolId,
  };
}

/* ============================================================
   HOOK: usePoolLocationOptions — Vote on location
   ============================================================ */
export function usePoolLocationOptions(poolId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    poolId ? `/api/halls/${poolId}/location` : null,
    fetcher,
    SWR_CONFIG
  );

  const options = useMemo(() => {
    if (!data?.options) return [];
    return (data.options as Record<string, unknown>[]).map((loc) => ({
      id: String(loc.id),
      name: String(loc.name || ""),
      address: String(loc.address || ""),
      lat: (loc.lat as number) || null,
      lng: (loc.lng as number) || null,
      cost: (loc.cost as number) || null,
      image: (loc.image as string) || null,
      description: (loc.description as string) || null,
      votes: Number(loc.votes || 0),
      voteWeight: Number(loc.voteWeight || loc.vote_weight || 0),
      isSelected: Boolean(loc.isSelected || loc.is_selected || false),
    })) as LocationOption[];
  }, [data]);

  const vote = useCallback(
    async (locationOptionId: string): Promise<{ success: boolean; error?: string }> => {
      if (!poolId) return { success: false, error: "No pool selected" };

      try {
        const res = await fetch(`/api/halls/${poolId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ locationOptionId }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Vote failed" };
        }

        await mutate();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [poolId, mutate]
  );

  return {
    options,
    hasVoted: Boolean(data?.hasVoted || data?.has_voted),
    isLoading,
    isError: !!error,
    error: error?.message || null,
    vote,
    mutate,
  };
}

/* ============================================================
   HOOK: useMeridianCyclePools — Pools in current cycle
   ============================================================ */
export function useMeridianCyclePools(cycleId: string | null | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    cycleId ? `/api/meridian/cycle/${cycleId}/pools` : null,
    fetcher,
    {
      ...SWR_CONFIG,
      refreshInterval: 30000, // 30s for cycle pools
    }
  );

  const pools = useMemo(() => {
    if (!data?.pools) return [];
    return (data.pools as Record<string, unknown>[]).map(enrichPool);
  }, [data]);

  const cycleInfo = useMemo(() => {
    if (!data?.cycle) return undefined;
    const c = data.cycle as Record<string, unknown>;
    return {
      id: String(c.id),
      continent: String(c.continent || ""),
      phase: String(c.phase || "hush"),
      startAt: String(c.startAt || c.start_at),
      endAt: String(c.endAt || c.end_at),
      lockStatus: String(c.lockStatus || c.lock_status || "unlocked"),
      winnerPoolId: (c.winnerPoolId || c.winner_pool_id) as string | null,
    };
  }, [data]);

  return {
    pools,
    cycleInfo,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useMyPoolPositions — User's ownership portfolio
   ============================================================ */
export function useMyPoolPositions() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "/api/positions",
    fetcher,
    SWR_CONFIG
  );

  const positions = useMemo(() => {
    if (!data?.positions) return [];
    return (data.positions as Record<string, unknown>[]).map(enrichPosition);
  }, [data]);

  const summary = useMemo(() => {
    return {
      totalCommitted: Number(data?.summary?.totalCommitted || data?.summary?.total_committed || 0),
      totalOwnershipPercent: Number(
        data?.summary?.totalOwnershipPercent || data?.summary?.total_ownership_percent || 0
      ),
      activeOwnerships: Number(
        data?.summary?.activeOwnerships || data?.summary?.active_ownerships || 0
      ),
      totalReturned: Number(data?.summary?.totalReturned || data?.summary?.total_returned || 0),
      totalFromMarket: Number(
        data?.summary?.totalFromMarket || data?.summary?.total_from_market || 0
      ),
      monthlyDividendEstimate: Number(
        data?.summary?.monthlyDividendEstimate || data?.summary?.monthly_dividend_estimate || 0
      ),
      hallCount: Number(data?.summary?.hallCount || data?.summary?.hall_count || 0),
    };
  }, [data]);

  return {
    positions,
    summary,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: usePoolActions — Admin/Founder mutations
   ============================================================ */
export function usePoolActions() {
  const createPool = useCallback(
    async (
      input: PoolCreateInput
    ): Promise<{ success: boolean; pool?: Pool; error?: string }> => {
      try {
        const res = await fetch("/api/admin/pools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Pool creation failed" };
        }

        return {
          success: true,
          pool: json.pool ? enrichPool(json.pool as Record<string, unknown>) : undefined,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    []
  );

  const updatePool = useCallback(
    async (
      poolId: string,
      updates: Partial<PoolCreateInput>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/admin/pools/${poolId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updates),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Update failed" };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    []
  );

  const suspendPool = useCallback(
    async (poolId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/admin/pools/${poolId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Suspend failed" };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    []
  );

  return {
    createPool,
    updatePool,
    suspendPool,
  };
}