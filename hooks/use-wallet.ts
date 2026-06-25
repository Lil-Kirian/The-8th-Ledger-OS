"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Wallet System
   ============================================================ */

export interface Wallet {
  id: string;
  ledgerId: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deposit {
  id: string;
  walletId: string;
  ledgerId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  method: string;
  reference: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Withdrawal {
  id: string;
  walletId: string;
  ledgerId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "rejected" | "cancelled";
  destination: string;
  destinationType: string;
  reference: string | null;
  createdAt: string;
  processedAt: string | null;
  processedBy: string | null;
  rejectionReason: string | null;
}

export interface WalletTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "dividend" | "sale" | "refund" | "fee" | "pir_advance" | "liquidation";
  amount: number;
  currency: string;
  status: string;
  description: string;
  reference: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface KycTierLimit {
  tier: string;
  dailyLimit: number;
  instantLimit: number;
  delayHours: number;
  requiresTOTP: boolean;
  requiresNameMatch: boolean;
}

export interface DepositInput {
  amount: number;
  currency?: string;
  method?: string;
  reference?: string;
}

export interface WithdrawalInput {
  amount: number;
  destination: string;
  destinationType?: string;
  currency?: string;
}

export interface DepositResult {
  success: boolean;
  deposit?: Deposit;
  paymentUrl?: string; // For Paystack redirect
  error?: string;
}

export interface WithdrawalResult {
  success: boolean;
  withdrawal?: Withdrawal;
  delayHours?: number;
  error?: string;
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

const BALANCE_CONFIG = {
  ...SWR_CONFIG,
  refreshInterval: 15000, // 15s for live balance
};

/* ============================================================
   HELPERS
   ============================================================ */

function enrichWallet(raw: Record<string, unknown>): Wallet {
  const balance = Number(raw.balance || 0);
  const locked = Number(raw.lockedBalance || raw.locked_balance || 0);
  return {
    id: String(raw.id),
    ledgerId: String(raw.ledgerId || raw.ledger_id),
    balance,
    lockedBalance: locked,
    availableBalance: balance - locked,
    currency: String(raw.currency || "USD"),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
  };
}

function enrichDeposit(raw: Record<string, unknown>): Deposit {
  return {
    id: String(raw.id),
    walletId: String(raw.walletId || raw.wallet_id),
    ledgerId: String(raw.ledgerId || raw.ledger_id),
    amount: Number(raw.amount || 0),
    currency: String(raw.currency || "USD"),
    status: String(raw.status || "pending") as Deposit["status"],
    method: String(raw.method || "bank_transfer"),
    reference: (raw.reference as string) || null,
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    completedAt: (raw.completedAt || raw.completed_at) as string | null,
  };
}

function enrichWithdrawal(raw: Record<string, unknown>): Withdrawal {
  return {
    id: String(raw.id),
    walletId: String(raw.walletId || raw.wallet_id),
    ledgerId: String(raw.ledgerId || raw.ledger_id),
    amount: Number(raw.amount || 0),
    currency: String(raw.currency || "USD"),
    status: String(raw.status || "pending") as Withdrawal["status"],
    destination: String(raw.destination || ""),
    destinationType: String(raw.destinationType || raw.destination_type || "bank"),
    reference: (raw.reference as string) || null,
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    processedAt: (raw.processedAt || raw.processed_at) as string | null,
    processedBy: (raw.processedBy || raw.processed_by) as string | null,
    rejectionReason: (raw.rejectionReason || raw.rejection_reason) as string | null,
  };
}

function enrichTransaction(raw: Record<string, unknown>): WalletTransaction {
  return {
    id: String(raw.id),
    type: String(raw.type || "deposit") as WalletTransaction["type"],
    amount: Number(raw.amount || 0),
    currency: String(raw.currency || "USD"),
    status: String(raw.status || "pending"),
    description: String(raw.description || ""),
    reference: (raw.reference as string) || null,
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    metadata: raw.metadata as Record<string, unknown> | undefined,
  };
}

/* ============================================================
   HOOK: useWallet — Current user's wallet
   ============================================================ */
export function useWallet() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "/api/wallet/balance",
    fetcher,
    BALANCE_CONFIG
  );

  const wallet = useMemo(() => {
    if (!data?.wallet) return undefined;
    return enrichWallet(data.wallet as Record<string, unknown>);
  }, [data]);

  return {
    wallet,
    balance: wallet?.balance || 0,
    lockedBalance: wallet?.lockedBalance || 0,
    availableBalance: wallet?.availableBalance || 0,
    currency: wallet?.currency || "USD",
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useDeposits — Deposit history
   ============================================================ */
export function useDeposits(page: number = 1, limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/wallet/deposits?page=${page}&limit=${limit}`,
    fetcher,
    SWR_CONFIG
  );

  const deposits = useMemo(() => {
    if (!data?.deposits) return [];
    return (data.deposits as Record<string, unknown>[]).map(enrichDeposit);
  }, [data]);

  const stats = useMemo(() => {
    return {
      total: deposits.length,
      pending: deposits.filter((d) => d.status === "pending").length,
      completed: deposits.filter((d) => d.status === "completed").length,
      totalDeposited: deposits
        .filter((d) => d.status === "completed")
        .reduce((s, d) => s + d.amount, 0),
    };
  }, [deposits]);

  return {
    deposits,
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
   HOOK: useWithdrawals — Withdrawal history
   ============================================================ */
export function useWithdrawals(page: number = 1, limit: number = 20) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/wallet/withdrawals?page=${page}&limit=${limit}`,
    fetcher,
    SWR_CONFIG
  );

  const withdrawals = useMemo(() => {
    if (!data?.withdrawals) return [];
    return (data.withdrawals as Record<string, unknown>[]).map(enrichWithdrawal);
  }, [data]);

  const stats = useMemo(() => {
    return {
      total: withdrawals.length,
      pending: withdrawals.filter((w) => w.status === "pending" || w.status === "processing").length,
      completed: withdrawals.filter((w) => w.status === "completed").length,
      totalWithdrawn: withdrawals
        .filter((w) => w.status === "completed")
        .reduce((s, w) => s + w.amount, 0),
      rejected: withdrawals.filter((w) => w.status === "rejected").length,
    };
  }, [withdrawals]);

  return {
    withdrawals,
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
   HOOK: useTransactions — Unified transaction history
   ============================================================ */
export function useTransactions(page: number = 1, limit: number = 50) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/wallet/transactions?page=${page}&limit=${limit}`,
    fetcher,
    SWR_CONFIG
  );

  const transactions = useMemo(() => {
    if (!data?.transactions) return [];
    return (data.transactions as Record<string, unknown>[]).map(enrichTransaction);
  }, [data]);

  return {
    transactions,
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
   HOOK: useKycTierLimits — Withdrawal limits by KYC tier
   ============================================================ */
export function useKycTierLimits() {
  const { data, error, isLoading } = useSWR(
    "/api/wallet/limits",
    fetcher,
    SWR_CONFIG
  );

  const limits = useMemo(() => {
    if (!data?.limits) return undefined;
    return data.limits as KycTierLimit;
  }, [data]);

  const canWithdraw = useMemo(() => {
    if (!limits) return false;
    return limits.dailyLimit > 0;
  }, [limits]);

  const needsDelay = useMemo(() => {
    if (!limits) return false;
    return (limits.delayHours || 0) > 0;
  }, [limits]);

  return {
    limits,
    canWithdraw,
    needsDelay,
    delayHours: limits?.delayHours || 0,
    instantLimit: limits?.instantLimit || 0,
    dailyLimit: limits?.dailyLimit || 0,
    isLoading,
    isError: !!error,
    error: error?.message || null,
  };
}

/* ============================================================
   HOOK: useWalletActions — Mutations
   ============================================================ */
export function useWalletActions() {
  const { mutate: mutateWallet } = useSWR("/api/wallet/balance");
  const { mutate: mutateDeposits } = useSWR("/api/wallet/deposits");
  const { mutate: mutateWithdrawals } = useSWR("/api/wallet/withdrawals");

  /* ===== CREATE DEPOSIT ===== */
  const createDeposit = useCallback(
    async (input: DepositInput): Promise<DepositResult> => {
      try {
        const res = await fetch("/api/wallet/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Deposit creation failed",
          };
        }

        await mutateWallet();
        await mutateDeposits();

        return {
          success: true,
          deposit: json.deposit
            ? enrichDeposit(json.deposit as Record<string, unknown>)
            : undefined,
          paymentUrl: json.paymentUrl as string | undefined,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateWallet, mutateDeposits]
  );

  /* ===== CREATE WITHDRAWAL ===== */
  const createWithdrawal = useCallback(
    async (input: WithdrawalInput): Promise<WithdrawalResult> => {
      try {
        const res = await fetch("/api/wallet/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Withdrawal request failed",
          };
        }

        await mutateWallet();
        await mutateWithdrawals();

        return {
          success: true,
          withdrawal: json.withdrawal
            ? enrichWithdrawal(json.withdrawal as Record<string, unknown>)
            : undefined,
          delayHours: json.delayHours as number | undefined,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateWallet, mutateWithdrawals]
  );

  /* ===== VERIFY PAYSTACK PAYMENT ===== */
  const verifyPaystack = useCallback(
    async (reference: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/wallet/deposit/verify?reference=${reference}`, {
          method: "GET",
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Verification failed",
          };
        }

        await mutateWallet();
        await mutateDeposits();

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateWallet, mutateDeposits]
  );

  /* ===== CANCEL PENDING WITHDRAWAL ===== */
  const cancelWithdrawal = useCallback(
    async (withdrawalId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/wallet/withdraw/${withdrawalId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Cancel failed",
          };
        }

        await mutateWallet();
        await mutateWithdrawals();

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateWallet, mutateWithdrawals]
  );

  return {
    createDeposit,
    createWithdrawal,
    verifyPaystack,
    cancelWithdrawal,
  };
}

/* ============================================================
   HOOK: useEscrowBalance — Locked funds (marketplace/orders)
   ============================================================ */
export function useEscrowBalance() {
  const { data, error, isLoading } = useSWR(
    "/api/wallet/escrow",
    fetcher,
    SWR_CONFIG
  );

  const escrow = useMemo(() => {
    if (!data?.escrow) return undefined;
    return {
      totalLocked: Number(data.escrow.totalLocked || data.escrow.total_locked || 0),
      pendingOrders: Number(data.escrow.pendingOrders || data.escrow.pending_orders || 0),
      pendingListings: Number(data.escrow.pendingListings || data.escrow.pending_listings || 0),
    };
  }, [data]);

  return {
    escrow,
    totalLocked: escrow?.totalLocked || 0,
    isLoading,
    isError: !!error,
    error: error?.message || null,
  };
}

/* ============================================================
   HOOK: useLedgerBalance — Quick balance check (no full wallet)
   ============================================================ */
export function useLedgerBalance() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/wallet/balance",
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 5000,
    }
  );

  return {
    balance: Number(data?.balance || 0),
    locked: Number(data?.lockedBalance || data?.locked_balance || 0),
    available: Number(data?.availableBalance || data?.available_balance || 0),
    currency: String(data?.currency || "USD"),
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}