import useSWR from "swr";

/* ============================================================
   TYPES
   ============================================================ */

export interface SriSnapshot {
  score: number;
  governanceActivity: number;
  revenueConsistency: number;
  dividendReliability: number;
  proposalQuality: number;
  dormancyRate: number;
  marketplaceVelocity: number;
  recordedAt: string;
}

export interface SriHistoryPoint {
  month: string;
  score: number;
}

export interface SriHallData {
  hallId: string;
  hallName: string;
  vertical: string;
  current: SriSnapshot;
  history: SriHistoryPoint[];
  restrictions: {
    canProposeHires: boolean;
    dividendsPaused: boolean;
    marketplaceFee: number;
  };
}

export interface GlobalSriStats {
  totalHalls: number;
  averageScore: number;
  averageTier: string;
  tierDistribution: Record<string, number>;
}

export interface SriLeaderboardEntry {
  hallId: string;
  hallName: string;
  score: number;
  tier: string;
  verticalId: string | null;
}

export interface GlobalSriData {
  global: GlobalSriStats;
  leaderboard: SriLeaderboardEntry[];
  user: {
    ledgerId: string;
    globalSriScore: number;
  };
}

/* ============================================================
   FETCHER
   ============================================================ */

const fetchJson = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   HOOKS
   ============================================================ */

export function useSriHall(hallId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<SriHallData>(
    hallId ? `/api/sri/hall/${hallId}` : null,
    fetchJson,
    { refreshInterval: 60000 }
  );

  return {
    current: data?.current,
    hallId: data?.hallId,
    hallName: data?.hallName,
    vertical: data?.vertical,
    history: data?.history || [],
    restrictions: data?.restrictions,
    isLoading,
    error,
    mutate,
  };
}

export function useGlobalSri(limit: number = 50) {
  const { data, error, isLoading, mutate } = useSWR<GlobalSriData>(
    `/api/sri?limit=${limit}`,
    fetchJson,
    { refreshInterval: 300000 }
  );

  return {
    global: data?.global,
    leaderboard: data?.leaderboard || [],
    user: data?.user,
    isLoading,
    error,
    mutate,
  };
}

/* ============================================================
   MUTATIONS
   ============================================================ */

export async function recalculateSri(hallId: string) {
  const res = await fetch(`/api/sri/hall/${hallId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json() as Promise<{
    success: boolean;
    hallId: string;
    hallName: string;
    current: SriSnapshot;
    tier: string;
    restrictions: SriHallData["restrictions"];
    recordedAt: string;
  }>;
}