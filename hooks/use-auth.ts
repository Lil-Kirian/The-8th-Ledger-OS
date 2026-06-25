"use client";

import useSWR from "swr";
import { useCallback } from "react";

/* ============================================================
   TYPES — 8th Ledger Sovereign Identity
   ============================================================ */

export interface AuthUser {
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  trustScore: number;
  tier: number;
  ledgerBalance: number;
  creditPool: number;
  identityScore: number;
  kycStatus: string;
  kycTier?: string | null;
  legalName?: string | null;
  role: string;
  isPrimaryAdmin: boolean;
  // Optional fields
  referrals?: number;
  forgesCompleted?: number;
  phone?: string | null;
  oracleStanding?: number;
  globalSriScore?: number;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isError: Error | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
}

/* ============================================================
   FETCHER — Handles { success, user } API shape
   ============================================================ */

const fetcher = async (url: string): Promise<{ user: AuthUser | null }> => {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Session verification failed");
  }

  return { user: data.user || null };
};

/* ============================================================
   HOOK — useAuth
   ============================================================ */

export function useAuth(): AuthState & {
  mutate: () => void;
  logout: () => Promise<void>;
} {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/auth",
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
    }
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth", {
      method: "DELETE",
      credentials: "include",
    });
    mutate({ user: null }, false);
    window.location.href = "/enter";
  }, [mutate]);

  const user = data?.user ?? null;

  return {
    user,
    isLoading,
    isError: error ?? null,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isPrimaryAdmin: user?.role === "admin" && user?.isPrimaryAdmin === true,
    mutate: () => mutate(),
    logout,
  };
}

/* ============================================================
   HOOK — useAuthRequired
   ============================================================ */

export function useAuthRequired(): AuthState & {
  mutate: () => void;
  logout: () => Promise<void>;
} {
  const auth = useAuth();

  if (typeof window !== "undefined" && !auth.isLoading && !auth.isAuthenticated) {
    window.location.replace("/enter");
  }

  return auth;
}

/* ============================================================
   HOOK — useUserBalance
   ============================================================ */

export function useUserBalance(): {
  ledger: number;
  creditPool: number;
  totalValue: number;
  isLoading: boolean;
} {
  const { user, isLoading } = useAuth();

  return {
    ledger: user?.ledgerBalance ?? 0,
    creditPool: user?.creditPool ?? 0,
    totalValue: (user?.ledgerBalance ?? 0) + (user?.creditPool ?? 0),
    isLoading,
  };
}