"use client";

import { useCallback, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";

/* ============================================================
   TYPES
   ============================================================ */
export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: string;
  status: "active" | "pending" | "passed" | "rejected" | "executing" | "completed" | "cancelled";
  executionStatus: "pending" | "in_progress" | "completed" | "stalled" | null;
  amount: number | null;
  currency: string | null;
  threshold: number;
  voteCountYes: number;
  voteCountNo: number;
  yesWeight: number;
  noWeight: number;
  totalWeight: number;
  yesPct: number;
  noPct: number;
  hasPassed: boolean;
  hasQuorum: boolean;
  endsAt: string;
  createdAt: string;
  passedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  creator: {
    ledgerId: string;
    displayName: string;
  } | null;
  myVote: "yes" | "no" | null;
  myWeight: number;
  executionProof: string[] | null;
  stalledReason: string | null;
}

export interface ProposalCreateInput {
  title: string;
  description: string;
  type:
    | "renovate"
    | "sell"
    | "rent_change"
    | "location_select"
    | "humanitarian"
    | "liquidation"
    | "marketplace_list"
    | "budget_approve"
    | "hire"
    | "fire"
    | "maintenance"
    | "inventory_list"
    | "closure"
    | "pir_advance"
    | "general";
  amount?: number;
  currency?: string;
  threshold?: number;
  endsAt?: string;
  targetUserId?: string;
  locationOption?: string;
}

export interface VoteResult {
  success: boolean;
  proposal?: Proposal;
  error?: string;
}

/* ============================================================
   RAW API TYPES
   ============================================================ */
interface RawCreator {
  ledgerId?: string;
  displayName?: string;
  display_name?: string;
}

interface RawProposal {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  executionStatus?: string | null;
  execution_status?: string | null;
  amount?: number;
  currency?: string;
  thresholdPercent?: number;
  threshold?: number;
  threshold_percent?: number;
  voteCountYes?: number;
  vote_count_yes?: number;
  voteCountNo?: number;
  vote_count_no?: number;
  voteWeightYes?: number;
  vote_weight_yes?: number;
  voteWeightNo?: number;
  vote_weight_no?: number;
  totalWeight?: number;
  total_weight?: number;
  endsAt?: string;
  ends_at?: string;
  createdAt?: string;
  created_at?: string;
  passedAt?: string | null;
  passed_at?: string | null;
  startedAt?: string | null;
  started_at?: string | null;
  completedAt?: string | null;
  completed_at?: string | null;
  creator?: RawCreator;
  myVote?: "yes" | "no" | null;
  my_vote?: "yes" | "no" | null;
  myWeight?: number;
  my_weight?: number;
  executionProof?: string | string[] | null;
  execution_proof?: string | string[] | null;
  stalledReason?: string | null;
  stalled_reason?: string | null;
}

interface ProposalsListResponse {
  success: boolean;
  proposals?: RawProposal[];
  error?: string;
}

interface ProposalDetailResponse {
  success: boolean;
  proposal?: RawProposal;
  error?: string;
}

interface CreateResponse {
  success: boolean;
  proposal?: RawProposal;
  error?: string;
}

interface VoteResponse {
  success: boolean;
  proposal?: RawProposal;
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
const SWR_CONFIG_ACTIVE = {
  revalidateOnFocus: true,
  refreshInterval: 10000,
  dedupingInterval: 5000,
};

const SWR_CONFIG_STATIC = {
  revalidateOnFocus: true,
  dedupingInterval: 30000,
};

/* ============================================================
   HELPERS
   ============================================================ */
function parseProofUrls(raw: string | string[] | null | undefined): string[] | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [raw];
    }
  }
  return raw;
}

function enrichProposal(raw: RawProposal): Proposal {
  const yesWeight = raw.voteWeightYes || raw.vote_weight_yes || 0;
  const noWeight = raw.voteWeightNo || raw.vote_weight_no || 0;
  const totalWeight = raw.totalWeight || raw.total_weight || yesWeight + noWeight;
  const threshold = raw.thresholdPercent || raw.threshold || raw.threshold_percent || 51;

  const yesPct = totalWeight > 0 ? (yesWeight / totalWeight) * 100 : 0;
  const noPct = totalWeight > 0 ? (noWeight / totalWeight) * 100 : 0;

  const creator = raw.creator;
  const creatorLedgerId = creator?.ledgerId;

  return {
    id: raw.id,
    title: raw.title || "",
    description: raw.description || "",
    type: raw.type || "general",
    status: (raw.status || "pending") as Proposal["status"],
    executionStatus: (raw.executionStatus || raw.execution_status || null) as Proposal["executionStatus"],
    amount: raw.amount ?? null,
    currency: raw.currency || null,
    threshold,
    voteCountYes: raw.voteCountYes || raw.vote_count_yes || 0,
    voteCountNo: raw.voteCountNo || raw.vote_count_no || 0,
    yesWeight,
    noWeight,
    totalWeight,
    yesPct: Number(yesPct.toFixed(2)),
    noPct: Number(noPct.toFixed(2)),
    hasPassed: yesPct >= threshold,
    hasQuorum: totalWeight > 0,
    endsAt: raw.endsAt || raw.ends_at || new Date().toISOString(),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    passedAt: raw.passedAt || raw.passed_at || null,
    startedAt: raw.startedAt || raw.started_at || null,
    completedAt: raw.completedAt || raw.completed_at || null,
    creator: creator && creatorLedgerId
      ? {
          ledgerId: creatorLedgerId,
          displayName: creator.displayName || creator.display_name || "",
        }
      : null,
    myVote: raw.myVote || raw.my_vote || null,
    myWeight: raw.myWeight || raw.my_weight || 0,
    executionProof: parseProofUrls(raw.executionProof || raw.execution_proof),
    stalledReason: raw.stalledReason || raw.stalled_reason || null,
  };
}

/* ============================================================
   HOOK: useProposals
   ============================================================ */
export function useProposals(hallId: string | null | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ProposalsListResponse>(
    hallId ? `/api/halls/${hallId}/proposals` : null,
    fetcher,
    SWR_CONFIG_ACTIVE
  );

  const proposals = useMemo(() => {
    if (!data?.proposals) return [];
    return data.proposals.map(enrichProposal);
  }, [data]);

  const stats = useMemo(() => {
    const active = proposals.filter((p) => p.status === "active");
    const passed = proposals.filter((p) => p.status === "passed");
    const rejected = proposals.filter((p) => p.status === "rejected");
    const executing = proposals.filter((p) => p.status === "executing");
    const completed = proposals.filter((p) => p.status === "completed");

    return {
      total: proposals.length,
      active: active.length,
      passed: passed.length,
      rejected: rejected.length,
      executing: executing.length,
      completed: completed.length,
      needsAttention: active.filter(
        (p) => p.hasPassed && p.executionStatus === "pending"
      ).length,
    };
  }, [proposals]);

  return {
    proposals,
    stats,
    isLoading,
    isValidating,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useProposal
   ============================================================ */
export function useProposal(proposalId: string | null | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ProposalDetailResponse>(
    proposalId ? `/api/halls/proposals/${proposalId}` : null,
    fetcher,
    SWR_CONFIG_STATIC
  );

  const proposal = useMemo(() => {
    if (!data?.proposal) return undefined;
    return enrichProposal(data.proposal);
  }, [data]);

  return {
    proposal,
    isLoading,
    isValidating,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useProposalActions
   ============================================================ */
export function useProposalActions(hallId: string | null | undefined) {
  const listKey = hallId ? `/api/halls/${hallId}/proposals` : null;

  const createProposal = useCallback(
    async (
      input: ProposalCreateInput
    ): Promise<{ success: boolean; proposal?: Proposal; error?: string }> => {
      if (!hallId) return { success: false, error: "No hall selected" };

      try {
        const res = await fetch(`/api/halls/${hallId}/proposals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json = (await res.json()) as CreateResponse;
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Failed to create proposal",
          };
        }

        if (listKey) await globalMutate(listKey);
        return {
          success: true,
          proposal: json.proposal ? enrichProposal(json.proposal) : undefined,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [hallId, listKey]
  );

  const vote = useCallback(
    async (proposalId: string, vote: "yes" | "no"): Promise<VoteResult> => {
      if (!hallId) return { success: false, error: "No hall selected" };

      try {
        const res = await fetch(
          `/api/halls/${hallId}/proposals/${proposalId}/vote`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ vote }),
          }
        );

        const json = (await res.json()) as VoteResponse;
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Vote failed" };
        }

        if (listKey) await globalMutate(listKey);
        return {
          success: true,
          proposal: json.proposal ? enrichProposal(json.proposal) : undefined,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [hallId, listKey]
  );

  const execute = useCallback(
    async (proposalId: string): Promise<{ success: boolean; error?: string }> => {
      if (!hallId) return { success: false, error: "No hall selected" };

      try {
        const res = await fetch(
          `/api/halls/${hallId}/proposals/${proposalId}/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        const json = (await res.json()) as { success: boolean; error?: string };
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Execution failed",
          };
        }

        if (listKey) await globalMutate(listKey);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [hallId, listKey]
  );

  return {
    createProposal,
    vote,
    execute,
  };
}