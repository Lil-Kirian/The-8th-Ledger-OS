"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Revenue Distribution Engine
   ============================================================ */

export interface DividendEntry {
  id: string;
  distributionId: string;
  ownershipId: string;
  amount: number;
  claimed: boolean;
  claimedAt: string | null;
  createdAt: string;
}

export interface DividendDistribution {
  id: string;
  poolId: string;
  revenueLogId: string | null;
  totalAmount: number;
  totalOwners: number;
  distributedAt: string;
  entries: DividendEntry[];
}

export interface RevenueLog {
  id: string;
  poolId: string;
  amount: number;
  source: string;
  ledgerFee: number;
  payrollDeducted: number;
  netAfterPayroll: number;
  distributed: boolean;
  distributionTx: string | null;
  createdAt: string;
}

export interface DistributionEntry {
  entryId: string;
  ownershipId: string;
  userId: string;
  ledgerId: string | null;
  ownershipPercent: number | null;
  amount: number;
  claimed: boolean;
  claimedAt: string | null;
}

export interface DistributionGroup {
  distributionId: string;
  totalAmount: number;
  totalOwners: number;
  entries: DistributionEntry[];
}

export interface RevenueLogWithDistributions {
  revenueLogId: string;
  amount: number;
  source: string;
  ledgerTithe: number;
  payrollDeducted: number;
  netAfterPayroll: number;
  distributed: boolean;
  createdAt: string;
  distributions: DistributionGroup[];
}

export interface HallDividendData {
  hall: {
    id: string;
    name: string;
    poolId: string | null;
    verticalId: string | null;
  } | null;
  treasury: {
    balance: number;
    totalRevenue: number;
    totalDistributed: number;
    monthlyRevenue: number;
    payrollReserve: number;
    pirDebt: number;
  } | null;
  stats: {
    totalRevenueLogs: number;
    totalDistributedAmount: number;
    totalDividendEntries: number;
  };
  userOwnership: {
    ownershipId: string;
    ownershipPercent: number;
    accumulatedDividends: number;
    totalReturned: number;
    dynamicValue: number;
    lifetimeEarnings: number;
  } | null;
  revenueLogs: RevenueLogWithDistributions[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface QueueItem {
  revenueLogId: string;
  hallId: string | null;
  hallName: string | null;
  amount: number;
  ledgerTithe: number;
  payrollDeducted: number;
  netAfterPayroll: number;
  source: string;
  createdAt: string;
  pendingEntries: number;
}

export interface DistributionQueue {
  queue: QueueItem[];
}

export interface RoiBreakdown {
  totalInvested: number;
  totalReturned: number;
  netProfit: number;
  roiPct: number;
  annualizedPct: number | null;
  daysHeld: number;
}

export interface DistributionResult {
  revenueLogId: string;
  hallId: string;
  totalAmount: number;
  entriesCreated: number;
  success: boolean;
  error?: string;
}

/* ============================================================
   FETCHER
   ============================================================ */

const fetchJson = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   CONFIG
   ============================================================ */
const SWR_CONFIG = {
  revalidateOnFocus: true,
  dedupingInterval: 10000,
};

const LIVE_CONFIG = {
  ...SWR_CONFIG,
  refreshInterval: 30000,
};

/* ============================================================
   HOOK: useDividends
   ============================================================ */
export function useDividends(hallId: string | null | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<HallDividendData>(
    hallId ? `/api/dividends/hall/${hallId}` : null,
    fetchJson,
    SWR_CONFIG
  );

  const stats = useMemo(() => {
    if (!data) return null;
    return {
      totalRevenue: data.stats?.totalDistributedAmount || 0,
      totalLogs: data.stats?.totalRevenueLogs || 0,
      userLifetimeEarnings: data.userOwnership?.lifetimeEarnings || 0,
      userAccumulatedDividends: data.userOwnership?.accumulatedDividends || 0,
      userOwnershipPercent: data.userOwnership?.ownershipPercent || 0,
    };
  }, [data]);

  return {
    data,
    stats,
    revenueLogs: data?.revenueLogs || [],
    userOwnership: data?.userOwnership,
    treasury: data?.treasury,
    pagination: data?.pagination,
    isLoading,
    isValidating,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useDistributionQueue
   ============================================================ */
export function useDistributionQueue(hallId?: string) {
  const url = hallId
    ? `/api/dividends/distribute?hallId=${hallId}`
    : "/api/dividends/distribute";

  const { data, error, isLoading, isValidating, mutate } = useSWR<DistributionQueue>(
    url,
    fetchJson,
    LIVE_CONFIG
  );

  return {
    queue: data?.queue || [],
    isLoading,
    isValidating,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useDividendActions
   ============================================================ */
export function useDividendActions(hallId?: string) {
  const { mutate: mutateDividends } = useSWR(
    hallId ? `/api/dividends/hall/${hallId}` : null
  );
  const { mutate: mutateQueue } = useSWR(
    hallId
      ? `/api/dividends/distribute?hallId=${hallId}`
      : "/api/dividends/distribute"
  );

  const triggerDistribution = useCallback(
    async (
      allHalls: boolean = false
    ): Promise<{ success: boolean; results?: DistributionResult[]; error?: string }> => {
      try {
        const res = await fetch("/api/dividends/distribute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ hallId, allHalls }),
        });

        const json = (await res.json()) as {
          success: boolean;
          results?: DistributionResult[];
          error?: string;
        };
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Distribution failed",
          };
        }

        await mutateDividends();
        await mutateQueue();

        return { success: true, results: json.results };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [hallId, mutateDividends, mutateQueue]
  );

  const calculateRoi = useCallback(
    async (): Promise<{ success: boolean; roi?: RoiBreakdown; error?: string }> => {
      try {
        const endpoint = hallId
          ? `/api/dividends/hall/${hallId}/roi`
          : "/api/dividends/roi";

        const res = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
        });

        const json = (await res.json()) as {
          success: boolean;
          roi?: RoiBreakdown;
          error?: string;
        };
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "ROI calculation failed",
          };
        }

        return {
          success: true,
          roi: json.roi,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [hallId]
  );

  return {
    triggerDistribution,
    calculateRoi,
  };
}

/* ============================================================
   MUTATIONS
   ============================================================ */

export async function ingestRevenue(
  hallId: string,
  payload: {
    amount: number;
    source: string;
    payrollDeducted?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; revenueLogId?: string; error?: string }> {
  const res = await fetch(`/api/halls/${hallId}/revenue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<{ success: boolean; revenueLogId?: string; error?: string }>;
}