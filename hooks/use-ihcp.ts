"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — Internal Hall Contribution Pool
   ============================================================ */

export interface IhcpContribution {
  id: string;
  hallId: string;
  ledgerId: string;
  amount: number;
  purpose:
    | "payroll"
    | "inventory"
    | "stock"
    | "marketing"
    | "upgrade"
    | "emergency";
  repaidAmount: number;
  status: "active" | "repaid" | "defaulted" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface IhcpStatus {
  hallId: string;
  ihcpBalance: number;
  ihcpTarget: number;
  percentFilled: number;
  activeContributions: IhcpContribution[];
  totalRaised: number;
  totalRepaid: number;
  totalOutstanding: number;
  monthlyRepayment: number;
  monthsToRepay: number;
  isEnabled: boolean;
}

export interface IhcpProposalInput {
  hallId: string;
  amount: number;
  purpose:
    | "payroll"
    | "inventory"
    | "stock"
    | "marketing"
    | "upgrade"
    | "emergency";
  justification?: string;
  description?: string;
}

export interface IhcpRepaymentSchedule {
  month: string;
  repaymentAmount: number;
  remainingBalance: number;
  projectedDividendImpact: number;
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

const SWR_CONFIG = {
  revalidateOnFocus: true,
  dedupingInterval: 5000,
};

/* ============================================================
   HOOK: useIhcpStatus
   ============================================================ */
export function useIhcpStatus(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/ihcp` : null,
    fetcher,
    SWR_CONFIG,
  );

  const status = useMemo((): IhcpStatus | undefined => {
    if (!data?.status) return undefined;
    return {
      hallId: String(data.status.hallId || hallId),
      ihcpBalance: Number(data.status.ihcpBalance || 0),
      ihcpTarget: Number(data.status.ihcpTarget || 0),
      percentFilled: Number(data.status.percentFilled || 0),
      activeContributions: (data.status.activeContributions ||
        []) as IhcpContribution[],
      totalRaised: Number(data.status.totalRaised || 0),
      totalRepaid: Number(data.status.totalRepaid || 0),
      totalOutstanding: Number(data.status.totalOutstanding || 0),
      monthlyRepayment: Number(data.status.monthlyRepayment || 0),
      monthsToRepay: Number(data.status.monthsToRepay || 0),
      isEnabled: Boolean(data.status.isEnabled),
    };
  }, [data, hallId]);

  return {
    status,
    data: status
      ? {
          ...status,
          contributions: status.activeContributions,
        }
      : undefined,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useIhcpActions
   ============================================================ */
export function useIhcpActions() {
  const proposeIhcp = useCallback(
    async (
      input: IhcpProposalInput,
    ): Promise<{ success: boolean; proposalId?: string; error?: string }> => {
      try {
        const res = await fetch(`/api/halls/${input.hallId}/ihcp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount: input.amount,
            purpose: input.purpose,
            justification: input.justification || input.description || "",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "IHCP proposal failed",
          };
        }
        return { success: true, proposalId: json.proposalId };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [],
  );

  const contributeIhcp = useCallback(
    async (
      hallId: string,
      amount: number,
    ): Promise<{
      success: boolean;
      contributionId?: string;
      error?: string;
    }> => {
      try {
        const res = await fetch(`/api/halls/${hallId}/ihcp/contribute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Contribution failed" };
        }
        return { success: true, contributionId: json.contributionId };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [],
  );

  return {
    proposeIhcp,
    contributeIhcp,
  };
}

export function useProposeIhcp() {
  const { proposeIhcp } = useIhcpActions();
  const [isPending, setIsPending] = useState(false);
  return {
    mutateAsync: async (input: IhcpProposalInput) => {
      setIsPending(true);
      try {
        return await proposeIhcp(input);
      } finally {
        setIsPending(false);
      }
    },
    isPending,
  };
}

export function useContributeIhcp() {
  const { contributeIhcp } = useIhcpActions();
  const [isPending, setIsPending] = useState(false);
  return {
    mutateAsync: async ({
      hallId,
      amount,
    }: {
      hallId: string;
      amount: number;
      purpose?: string;
    }) => {
      setIsPending(true);
      try {
        return await contributeIhcp(hallId, amount);
      } finally {
        setIsPending(false);
      }
    },
    isPending,
  };
}
