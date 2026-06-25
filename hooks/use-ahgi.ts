import useSWR from "swr";

/* ============================================================
   TYPES
   ============================================================ */

export interface AhgiSnapshot {
  score: number;
  healthScore: number;
  growthScore: number;
  healthMetrics: string | null; // JSON string from DB
  growthMetrics: string | null; // JSON string from DB
  recordedAt: string;
}

export interface AhgiHistoryPoint {
  month: string;
  health: number;
  growth: number;
  combined: number;
}

export interface AhgiHallData {
  hallId: string;
  hallName: string;
  vertical: string;
  current: AhgiSnapshot;
  history: AhgiHistoryPoint[];
  lastInspection: string;
  nextInspection: string;
}

export interface AhgiGlobalStats {
  totalHalls: number;
  averageScore: number;
  averageStatus: string;
  statusDistribution: Record<string, number>;
}

export interface AhgiLeaderboardEntry {
  hallId: string;
  hallName: string;
  score: number;
  status: string;
  verticalId: string | null;
}

export interface GlobalAhgiData {
  global: AhgiGlobalStats;
  leaderboard: AhgiLeaderboardEntry[];
}

/* ============================================================
   FETCHER
   ============================================================ */

const fetchJson = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   HOOKS
   ============================================================ */

export function useAhgiHall(hallId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<AhgiHallData>(
    hallId ? `/api/ahgi/hall/${hallId}` : null,
    fetchJson,
    { refreshInterval: 60000 }
  );

  return {
    current: data?.current,
    hallId: data?.hallId,
    hallName: data?.hallName,
    vertical: data?.vertical,
    history: data?.history || [],
    lastInspection: data?.lastInspection,
    nextInspection: data?.nextInspection,
    isLoading,
    error,
    mutate,
  };
}

export function useGlobalAhgi(limit: number = 50) {
  const { data, error, isLoading, mutate } = useSWR<GlobalAhgiData>(
    `/api/ahgi?limit=${limit}`,
    fetchJson,
    { refreshInterval: 300000 }
  );

  return {
    global: data?.global,
    leaderboard: data?.leaderboard || [],
    isLoading,
    error,
    mutate,
  };
}

/* ============================================================
   MUTATIONS
   ============================================================ */

export async function recalculateAhgi(hallId: string) {
  const res = await fetch(`/api/ahgi/hall/${hallId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json() as Promise<{
    success: boolean;
    hallId: string;
    hallName: string;
    current: AhgiSnapshot;
    status: string;
    recordedAt: string;
  }>;
}