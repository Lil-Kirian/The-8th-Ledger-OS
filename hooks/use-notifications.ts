"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Notification System
   ============================================================ */

export type NotificationType =
  | "sovereign_stream" // New post/reply in hall
  | "proposal_vote" // Vote required
  | "proposal_passed" // Proposal passed
  | "proposal_executed" // Proposal executed
  | "meridian_cycle" // Phase change, winner revealed
  | "oracle_forecast" // New forecast, result resolved
  | "oracle_standing" // Tier promotion (seer/oracle/prophet)
  | "cabinet_election" // Election called, term ending
  | "cabinet_impeach" // Executive impeached
  | "forge_ledger" // Worker hired, payroll, review
  | "pir_advance" // PIR advance approved/repaid
  | "closure_warning" // Hall closure protocol triggered
  | "liquidation" // Closure liquidation complete
  | "dividend" // Revenue distributed
  | "marketplace" // Ownership sold, inventory order
  | "escrow" // Escrow released/refunded
  | "dormancy" // Year 1/2/3 warnings
  | "kyc" // KYC approved/rejected
  | "system" // 8th Ledger platform updates
  | "security"; // Login alerts, fortress events

export interface Notification {
  id: string;
  ledgerId: string;
  poolId: string | null;
  proposalId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  priority: "low" | "normal" | "high" | "critical";
  createdAt: string;
  // Enriched fields
  poolName?: string;
  hallId?: string;
  verticalId?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  unreadOnly?: boolean;
  priority?: "low" | "normal" | "high" | "critical";
  page?: number;
  limit?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  byType: Record<string, number>;
}

export interface NotificationGroup {
  date: string;
  label: string;
  notifications: Notification[];
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
  dedupingInterval: 5000,
  errorRetryCount: 3,
};

const BADGE_CONFIG = {
  revalidateOnFocus: true,
  refreshInterval: 15000, // 15s polling for badge
  dedupingInterval: 3000,
};

/* ============================================================
   HELPERS
   ============================================================ */

function enrichNotification(raw: Record<string, unknown>): Notification {
  const type = String(raw.type || "system") as NotificationType;

  // Auto-assign priority based on type
  const priorityMap: Record<string, Notification["priority"]> = {
    closure_warning: "critical",
    liquidation: "critical",
    security: "critical",
    proposal_vote: "high",
    dormancy: "high",
    dividend: "normal",
    sovereign_stream: "normal",
    proposal_passed: "normal",
    proposal_executed: "normal",
    meridian_cycle: "normal",
    oracle_forecast: "normal",
    oracle_standing: "normal",
    cabinet_election: "high",
    cabinet_impeach: "high",
    forge_ledger: "low",
    pir_advance: "normal",
    marketplace: "normal",
    escrow: "normal",
    kyc: "high",
    system: "low",
  };

  return {
    id: String(raw.id),
    ledgerId: String(raw.ledgerId || raw.ledger_id),
    poolId: (raw.poolId || raw.pool_id) as string | null,
    proposalId: (raw.proposalId || raw.proposal_id) as string | null,
    type,
    title: String(raw.title || ""),
    message: String(raw.message || ""),
    read: Boolean(raw.read || false),
    actionUrl: (raw.actionUrl || raw.action_url) as string | null,
    priority: priorityMap[type] || "normal",
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    poolName: (raw.poolName || raw.pool_name) as string | undefined,
    hallId: (raw.hallId || raw.hall_id) as string | undefined,
    verticalId: (raw.verticalId || raw.vertical_id) as string | undefined,
  };
}

function groupByDate(notifications: Notification[]): NotificationGroup[] {
  const groups = new Map<string, Notification[]>();

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }

    const key = `${label}|${date.toDateString()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }

  return Array.from(groups.entries())
    .sort((a, b) => {
      const dateA = new Date(a[1][0].createdAt);
      const dateB = new Date(b[1][0].createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .map(([key, notifications]) => ({
      date: key.split("|")[1],
      label: key.split("|")[0],
      notifications: notifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
}

/* ============================================================
   HOOK: useNotifications — Full notification feed
   ============================================================ */
export function useNotifications(filters: NotificationFilters = {}) {
  const { type, unreadOnly, priority, page = 1, limit = 50 } = filters;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (type) params.set("type", type);
  if (unreadOnly) params.set("unreadOnly", "true");
  if (priority) params.set("priority", priority);

  const qs = params.toString();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/notifications?${qs}`,
    fetcher,
    SWR_CONFIG
  );

  const notifications = useMemo(() => {
    if (!data?.notifications) return [];
    return (data.notifications as Record<string, unknown>[]).map(enrichNotification);
  }, [data]);

  const grouped = useMemo(() => groupByDate(notifications), [notifications]);

  const stats = useMemo((): NotificationStats => {
    return {
      total: data?.meta?.total || notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      critical: notifications.filter((n) => n.priority === "critical" && !n.read).length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [notifications, data]);

  return {
    notifications,
    grouped,
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
   HOOK: useNotificationBadge — Lightweight unread count
   ============================================================ */
export function useNotificationBadge() {
  const { data, error, mutate } = useSWR(
    "/api/notifications/badge",
    fetcher,
    BADGE_CONFIG
  );

  const count = Number(data?.unread || 0);
  const hasCritical = Boolean(data?.hasCritical || data?.has_critical || false);

  return {
    count,
    hasCritical,
    isError: !!error,
    mutate,
  };
}

/* ============================================================
   HOOK: useNotificationActions — Mutations
   ============================================================ */
export function useNotificationActions() {
  const { mutate: mutateNotifications } = useSWR("/api/notifications");
  const { mutate: mutateBadge } = useSWR("/api/notifications/badge");

  /* ===== MARK SINGLE AS READ ===== */
  const markAsRead = useCallback(
    async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/notifications/${notificationId}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Failed to mark read" };
        }

        await mutateNotifications();
        await mutateBadge();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateNotifications, mutateBadge]
  );

  /* ===== MARK ALL AS READ ===== */
  const markAllAsRead = useCallback(
    async (type?: NotificationType): Promise<{ success: boolean; markedCount?: number; error?: string }> => {
      try {
        const url = type
          ? `/api/notifications/read-all?type=${type}`
          : "/api/notifications/read-all";

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Failed to mark all read" };
        }

        await mutateNotifications();
        await mutateBadge();
        return { success: true, markedCount: json.markedCount as number | undefined };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateNotifications, mutateBadge]
  );

  /* ===== DELETE NOTIFICATION ===== */
  const deleteNotification = useCallback(
    async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Delete failed" };
        }

        await mutateNotifications();
        await mutateBadge();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateNotifications, mutateBadge]
  );

  /* ===== DISMISS CRITICAL ALERT ===== */
  const dismissCritical = useCallback(
    async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
      return markAsRead(notificationId);
    },
    [markAsRead]
  );

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissCritical,
  };
}

/* ============================================================
   HOOK: useNotificationPreferences — Settings
   ============================================================ */
export function useNotificationPreferences() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/notifications/preferences",
    fetcher,
    SWR_CONFIG
  );

  const preferences = useMemo(() => {
    const defaults: Record<NotificationType, boolean> = {
      sovereign_stream: true,
      proposal_vote: true,
      proposal_passed: true,
      proposal_executed: true,
      meridian_cycle: true,
      oracle_forecast: true,
      oracle_standing: true,
      cabinet_election: true,
      cabinet_impeach: true,
      forge_ledger: true,
      pir_advance: true,
      closure_warning: true,
      liquidation: true,
      dividend: true,
      marketplace: true,
      escrow: true,
      dormancy: true,
      kyc: true,
      system: false,
      security: true,
    };

    if (!data?.preferences) return defaults;

    const raw = data.preferences as Record<string, boolean>;
    return { ...defaults, ...raw };
  }, [data]);

  const updatePreferences = useCallback(
    async (updates: Partial<Record<NotificationType, boolean>>): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updates),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Update failed" };
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
    [mutate]
  );

  return {
    preferences,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    updatePreferences,
  };
}

/* ============================================================
   HOOK: useNotificationRouting — Action URL resolver
   ============================================================ */
export function useNotificationRouting() {
  const resolveAction = useCallback((notification: Notification): string => {
    const { type, actionUrl, poolId, proposalId, hallId } = notification;

    if (actionUrl) return actionUrl;

    // Auto-resolve based on type + IDs
    switch (type) {
      case "sovereign_stream":
        return hallId ? `/halls/${hallId}/sovereign-stream` : "/halls";
      case "proposal_vote":
      case "proposal_passed":
      case "proposal_executed":
        return proposalId && hallId
          ? `/halls/${hallId}/sovereign-stream?proposal=${proposalId}`
          : hallId
          ? `/halls/${hallId}/sovereign-stream`
          : "/halls";
      case "meridian_cycle":
        return "/pools?tab=meridian";
      case "oracle_forecast":
        return "/oracle";
      case "oracle_standing":
        return "/leaderboards";
      case "cabinet_election":
      case "cabinet_impeach":
        return hallId ? `/halls/${hallId}/cabinet` : "/halls";
      case "forge_ledger":
        return hallId ? `/halls/${hallId}/forge` : "/halls";
      case "pir_advance":
        return hallId ? `/halls/${hallId}/sovereign-stream` : "/halls";
      case "closure_warning":
      case "liquidation":
        return hallId ? `/halls/${hallId}/closure` : "/halls";
      case "dividend":
        return "/dividends";
      case "marketplace":
        return "/marketplace/ownership";
      case "escrow":
        return "/marketplace/orders";
      case "dormancy":
        return "/settings?tab=dormancy";
      case "kyc":
        return "/kyc";
      case "security":
        return "/settings?tab=security";
      case "system":
      default:
        return "/dashboard";
    }
  }, []);

  return { resolveAction };
}