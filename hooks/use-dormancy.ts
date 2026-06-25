"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES
   ============================================================ */
export type DormancyStatus = "active" | "warning" | "critical" | "forfeited" | "reclaimed";

export interface DormancyRecord {
  id: number;
  type: "account" | "asset";
  status: DormancyStatus;
  lastActivityAt: string;
  daysInactive: number;
  warningSentAt: string | null;
  criticalSentAt: string | null;
  forfeitedAt: string | null;
  reclaimedBy: string | null;
  nextThreshold: {
    days: number;
    label: string;
    daysUntil: number;
    date: string;
  } | null;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  totalSeconds: number;
  isExpired: boolean;
}

export interface DormancyAlert {
  id: number;
  severity: "warning" | "critical" | "forfeit";
  message: string;
  hallName?: string;
  actionRequired?: string;
  dismissable: boolean;
}

/* ============================================================
   THRESHOLDS (must match server)
   ============================================================ */
const THRESHOLDS = {
  account: { warning: 365, critical: 547, forfeit: 730 },
  asset: { warning: 90, critical: 180, forfeit: 730 },
};

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
  refreshInterval: 60000, // 1 minute
  dedupingInterval: 10000,
};

/* ============================================================
   HELPERS
   ============================================================ */
function parseDate(d: string | Date): Date {
  return typeof d === "string" ? new Date(d) : d;
}

function getLiveStatus(type: "account" | "asset", daysInactive: number): DormancyStatus {
  const t = THRESHOLDS[type];
  if (daysInactive >= t.forfeit) return "forfeited";
  if (daysInactive >= t.critical) return "critical";
  if (daysInactive >= t.warning) return "warning";
  return "active";
}

function getNextThreshold(
  type: "account" | "asset",
  status: DormancyStatus,
  lastActivity: Date
): { days: number; label: string; date: Date } | null {
  const t = THRESHOLDS[type];
  if (status === "forfeited" || status === "reclaimed") return null;

  let targetDays: number;
  let label: string;

  if (status === "active") {
    targetDays = t.warning;
    label = "Warning";
  } else if (status === "warning") {
    targetDays = t.critical;
    label = "Critical";
  } else {
    targetDays = t.forfeit;
    label = "Forfeit";
  }

  const date = new Date(lastActivity.getTime() + targetDays * 24 * 60 * 60 * 1000);
  return { days: targetDays, label, date };
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "Expired";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 30) return `${days} days`;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getStatusColor(status: DormancyStatus): string {
  switch (status) {
    case "active": return "green";
    case "warning": return "yellow";
    case "critical": return "orange";
    case "forfeited": return "red";
    case "reclaimed": return "red";
    default: return "gray";
  }
}

/* ============================================================
   HOOK: useDormancy — Current user's account dormancy
   ============================================================ */
export function useDormancy() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/dormancy",
    fetcher,
    SWR_CONFIG
  );

  const record = useMemo(() => {
    if (!data?.record) return null;
    return data.record as DormancyRecord;
  }, [data]);

  // Live countdown timer
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 60000); // update every minute
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const countdown = useMemo((): Countdown | null => {
    if (!record?.nextThreshold) return null;

    const target = parseDate(record.nextThreshold.date).getTime();
    const diff = Math.max(0, target - now);
    const totalSeconds = Math.floor(diff / 1000);

    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      totalSeconds,
      isExpired: totalSeconds <= 0,
    };
  }, [record, now]);

  const statusColor = useMemo(() => {
    if (!record) return "gray";
    return getStatusColor(record.status);
  }, [record]);

  const humanReadable = useMemo(() => {
    if (!record) return null;
    if (record.status === "forfeited") return "Account forfeited. PACs redistributed.";
    if (record.status === "reclaimed") return "Asset reclaimed by VIN.";
    if (!countdown) return "No upcoming thresholds.";

    const timeLeft = formatCountdown(countdown.totalSeconds);
    if (record.status === "active") return `Warning in ${timeLeft}`;
    if (record.status === "warning") return `Critical in ${timeLeft}`;
    if (record.status === "critical") return `Forfeit in ${timeLeft}`;
    return timeLeft;
  }, [record, countdown]);

  return {
    record,
    countdown,
    statusColor,
    humanReadable,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useHallDormancy — Asset dormancy for a specific hall
   ============================================================ */
export function useHallDormancy(hallId: number | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/dormancy` : null,
    fetcher,
    SWR_CONFIG
  );

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const record = useMemo(() => {
    if (!data?.record) return null;
    return data.record as DormancyRecord;
  }, [data]);

  const countdown = useMemo((): Countdown | null => {
    if (!record?.nextThreshold) return null;
    const target = parseDate(record.nextThreshold.date).getTime();
    const diff = Math.max(0, target - now);
    const totalSeconds = Math.floor(diff / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      totalSeconds,
      isExpired: totalSeconds <= 0,
    };
  }, [record, now]);

  const salesVelocity = useMemo(() => {
    if (!data?.velocity) return null;
    return data.velocity as {
      lastSaleAt: string | null;
      orders3mo: number;
      orders6mo: number;
      orders24mo: number;
      warning: { level: string; message: string } | null;
    };
  }, [data]);

  return {
    record,
    countdown,
    salesVelocity,
    statusColor: record ? getStatusColor(record.status) : "gray",
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useDormancyAlerts — Active alerts for the user
   ============================================================ */
export function useDormancyAlerts() {
  const { data, error, isLoading } = useSWR(
    "/api/dormancy/alerts",
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 }
  );

  const alerts = useMemo((): DormancyAlert[] => {
    if (!data?.alerts) return [];
    return (data.alerts as DormancyAlert[]).filter((a) => !a.dismissable);
  }, [data]);

  const hasCritical = useMemo(() => alerts.some((a) => a.severity === "critical"), [alerts]);
  const hasForfeit = useMemo(() => alerts.some((a) => a.severity === "forfeit"), [alerts]);

  return {
    alerts,
    count: alerts.length,
    hasCritical,
    hasForfeit,
    isLoading,
    isError: !!error,
    error: error?.message || null,
  };
}