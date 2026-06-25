"use client";

import { useCallback, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";

/* ============================================================
   TYPES — 8th Ledger Operations Command Center
   ============================================================ */

export interface ExecutionProposal {
  id: string;
  title: string;
  description: string;
  type: string;
  status: "passed" | "executing" | "completed" | "cancelled";
  executionStatus: "pending" | "in_progress" | "completed" | "stalled";
  amount: number | null;
  currency: string | null;
  hallId: string;
  hallName: string;
  poolName: string;
  poolVerticalId: string;
  voteTally: {
    yes: number;
    no: number;
    total: number;
    threshold: number;
    passed: boolean;
  };
  execution: {
    startedAt: string | null;
    completedAt: string | null;
    proofUrls: string[];
    proofCount: number;
    notes: string | null;
    stalledReason: string | null;
    executedBy: string | null;
    actualCost: number | null;
  };
  timeline: {
    createdAt: string;
    passedAt: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  completionPct: number;
  pirAdvanceRequired: boolean;
  workerHireContext: {
    role: string;
    salaryRange: [number, number];
    candidateCount: number;
  } | null;
}

export interface ProofUpload {
  url: string;
  uploadedAt: string;
  type: "photo" | "invoice" | "certificate" | "document";
  caption: string | null;
}

export interface ExecutionLog {
  id: string;
  proposalId: string;
  status: string;
  cost: number | null;
  proofUrls: string[];
  executedBy: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

/* ============================================================
   RAW API RESPONSE TYPES
   ============================================================ */

interface RawProposal {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  executionStatus?: string;
  execution_status?: string;
  amount?: number;
  currency?: string;
  hallId?: string;
  hall_id?: string;
  hall?: {
    id?: string;
    name?: string;
    pool?: {
      name?: string;
      verticalId?: string;
      vertical_id?: string;
    };
  };
  voteCountYes?: number;
  vote_count_yes?: number;
  voteCountNo?: number;
  vote_count_no?: number;
  thresholdPercent?: number;
  threshold?: number;
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
  executionProof?: string | string[];
  execution_proof?: string | string[];
  executionNotes?: string;
  execution_notes?: string;
  stalledReason?: string;
  stalled_reason?: string;
  executedBy?: string;
  executed_by?: string;
  executionCost?: number;
  execution_cost?: number;
  actualCost?: number;
  actual_cost?: number;
  createdAt?: string;
  created_at?: string;
  passedAt?: string;
  passed_at?: string;
  pirAdvanceRequired?: boolean;
  pir_advance_required?: boolean;
  workerHireContext?: {
    role?: string;
    salaryRange?: [number, number];
    candidateCount?: number;
  };
  worker_hire_context?: {
    role?: string;
    salaryRange?: [number, number];
    candidateCount?: number;
  };
}

interface OperationsListResponse {
  success: boolean;
  proposals?: RawProposal[];
  error?: string;
}

interface OperationDetailResponse {
  success: boolean;
  proposal?: RawProposal;
  proposals?: RawProposal[];
  logs?: RawLog[];
  error?: string;
}

interface RawLog {
  id: string;
  proposalId?: string;
  proposal_id?: string;
  status?: string;
  cost?: number;
  proofUrls?: string | string[];
  proof_urls?: string | string[];
  executedBy?: string;
  executed_by?: string;
  completedAt?: string;
  completed_at?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
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
  dedupingInterval: 10000,
};

const POLLING_CONFIG = {
  revalidateOnFocus: true,
  refreshInterval: 10000,
  dedupingInterval: 5000,
};

/* ============================================================
   HELPERS
   ============================================================ */

function parseProofUrls(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [raw];
    }
  }
  return raw;
}

function calcCompletionPct(proposal: RawProposal): number {
  let pct = 0;
  const status =
    proposal.executionStatus || proposal.execution_status || "pending";

  if (status === "completed") return 100;
  if (status === "stalled") return 0;

  pct += 10; // passed

  if (status === "in_progress" || proposal.startedAt || proposal.started_at)
    pct += 20;

  const proofs = parseProofUrls(proposal.executionProof || proposal.execution_proof);
  pct += Math.min(50, proofs.length * 10);

  if (proposal.executionNotes || proposal.execution_notes) pct += 10;
  if (status === "in_progress" && proofs.length >= 3) pct += 10;

  return Math.min(99, pct);
}

function enrichExecutionProposal(raw: RawProposal): ExecutionProposal {
  const hall = raw.hall;
  const pool = hall?.pool;
  const voteYes = raw.voteCountYes || raw.vote_count_yes || 0;
  const voteNo = raw.voteCountNo || raw.vote_count_no || 0;
  const totalVotes = voteYes + voteNo;
  const threshold = raw.thresholdPercent || raw.threshold || 51;

  const proofs = parseProofUrls(
    raw.executionProof || raw.execution_proof
  );

  const hireCtx =
    raw.workerHireContext || raw.worker_hire_context;
  const workerHireContext = hireCtx
    ? {
        role: hireCtx.role || "",
        salaryRange: hireCtx.salaryRange || [0, 0],
        candidateCount: hireCtx.candidateCount || 0,
      }
    : null;

  return {
    id: raw.id,
    title: raw.title || "",
    description: raw.description || "",
    type: raw.type || "",
    status: (raw.status || "passed") as ExecutionProposal["status"],
    executionStatus: (raw.executionStatus ||
      raw.execution_status ||
      "pending") as ExecutionProposal["executionStatus"],
    amount: raw.amount ?? null,
    currency: raw.currency || null,
    hallId: raw.hallId || raw.hall_id || hall?.id || "",
    hallName: hall?.name || "",
    poolName: pool?.name || "",
    poolVerticalId: pool?.verticalId || pool?.vertical_id || "",
    voteTally: {
      yes: voteYes,
      no: voteNo,
      total: totalVotes,
      threshold,
      passed:
        totalVotes > 0 ? (voteYes / totalVotes) * 100 >= threshold : false,
    },
    execution: {
      startedAt: raw.startedAt || raw.started_at || null,
      completedAt: raw.completedAt || raw.completed_at || null,
      proofUrls: proofs,
      proofCount: proofs.length,
      notes: raw.executionNotes || raw.execution_notes || null,
      stalledReason: raw.stalledReason || raw.stalled_reason || null,
      executedBy: raw.executedBy || raw.executed_by || null,
      actualCost:
        raw.executionCost ||
        raw.execution_cost ||
        raw.actualCost ||
        raw.actual_cost ||
        null,
    },
    timeline: {
      createdAt: raw.createdAt || raw.created_at || "",
      passedAt: raw.passedAt || raw.passed_at || "",
      startedAt: raw.startedAt || raw.started_at || null,
      completedAt: raw.completedAt || raw.completed_at || null,
    },
    completionPct: calcCompletionPct(raw),
    pirAdvanceRequired:
      raw.pirAdvanceRequired || raw.pir_advance_required || false,
    workerHireContext,
  };
}

/* ============================================================
   HOOK: useOperations
   ============================================================ */
export function useOperations(hallId?: string) {
  const endpoint = hallId
    ? `/api/admin/operations?hallId=${hallId}`
    : "/api/admin/operations";

  const { data, error, isLoading, isValidating, mutate } = useSWR<OperationsListResponse>(
    endpoint,
    fetcher,
    SWR_CONFIG
  );

  const proposals = useMemo((): ExecutionProposal[] => {
    if (!data?.proposals) return [];
    return data.proposals.map(enrichExecutionProposal);
  }, [data]);

  const hasInProgress = useMemo(
    () => proposals.some((p) => p.executionStatus === "in_progress"),
    [proposals]
  );

  // Poll more aggressively if anything is in progress
  useSWR<OperationsListResponse>(
    hasInProgress ? endpoint : null,
    fetcher,
    POLLING_CONFIG
  );

  const stats = useMemo(() => {
    return {
      total: proposals.length,
      pending: proposals.filter((p) => p.executionStatus === "pending")
        .length,
      inProgress: proposals.filter(
        (p) => p.executionStatus === "in_progress"
      ).length,
      completed: proposals.filter((p) => p.executionStatus === "completed")
        .length,
      stalled: proposals.filter((p) => p.executionStatus === "stalled")
        .length,
      pirAdvances: proposals.filter((p) => p.pirAdvanceRequired).length,
      workerHires: proposals.filter((p) => p.workerHireContext !== null)
        .length,
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
   HOOK: useOperation
   ============================================================ */
export function useOperation(proposalId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<OperationDetailResponse>(
    proposalId ? `/api/admin/operations/${proposalId}` : null,
    fetcher,
    POLLING_CONFIG
  );

  const proposal = useMemo((): ExecutionProposal | undefined => {
    if (!data?.proposal && !data?.proposals?.[0]) return undefined;
    const p = data.proposal || data.proposals![0];
    return enrichExecutionProposal(p);
  }, [data]);

  const logs = useMemo((): ExecutionLog[] => {
    if (!data?.logs) return [];
    return data.logs.map((l) => ({
      id: l.id,
      proposalId: l.proposalId || l.proposal_id || "",
      status: l.status || "",
      cost: l.cost ?? null,
      proofUrls: parseProofUrls(l.proofUrls || l.proof_urls),
      executedBy: l.executedBy || l.executed_by || null,
      completedAt: l.completedAt || l.completed_at || null,
      notes: l.notes || null,
      createdAt: l.createdAt || l.created_at || new Date().toISOString(),
    }));
  }, [data]);

  return {
    proposal,
    logs,
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error.message : null,
    mutate,
  };
}

/* ============================================================
   HOOK: useOperationActions
   ============================================================ */
export function useOperationActions() {
  const mutateKey = "/api/admin/operations";

  const startExecution = useCallback(
    async (
      proposalId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(
          `/api/halls/proposals/${proposalId}/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ action: "start" }),
          }
        );

        const json = (await res.json()) as {
          success: boolean;
          error?: string;
        };
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Execution start failed",
          };
        }

        await globalMutate(mutateKey);
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

  const uploadProof = useCallback(
    async (
      proposalId: string,
      files: {
        urls: string[];
        type?: "photo" | "invoice" | "certificate";
        notes?: string;
      }
    ): Promise<{ success: boolean; proofCount?: number; error?: string }> => {
      try {
        const res = await fetch(
          `/api/halls/proposals/${proposalId}/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              action: "complete",
              proofUrls: files.urls,
              proofType: files.type || "photo",
              notes: files.notes,
            }),
          }
        );

        const json = (await res.json()) as {
          success: boolean;
          proposal?: { proofCount?: number };
          error?: string;
        };
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Upload failed" };
        }

        await globalMutate(mutateKey);
        return { success: true, proofCount: json.proposal?.proofCount };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    []
  );

  const markComplete = useCallback(
    async (
      proposalId: string,
      finalNotes?: string,
      actualCost?: number
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(
          `/api/halls/proposals/${proposalId}/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              action: "complete",
              finalNotes,
              actualCost,
            }),
          }
        );

        const json = (await res.json()) as {
          success: boolean;
          error?: string;
        };
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error || "Completion failed",
          };
        }

        await globalMutate(mutateKey);
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

  const cancelExecution = useCallback(
    async (
      proposalId: string,
      reason?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(
          `/api/halls/proposals/${proposalId}/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              action: "cancel",
              reason,
            }),
          }
        );

        const json = (await res.json()) as {
          success: boolean;
          error?: string;
        };
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Cancel failed" };
        }

        await globalMutate(mutateKey);
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

  const stall = useCallback(
    async (
      proposalId: string,
      reason: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(
          `/api/halls/proposals/${proposalId}/execute/status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              status: "stalled",
              reason,
            }),
          }
        );

        const json = (await res.json()) as {
          success: boolean;
          error?: string;
        };
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Stall failed" };
        }

        await globalMutate(mutateKey);
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
    startExecution,
    uploadProof,
    markComplete,
    cancelExecution,
    stall,
  };
}

/* ============================================================
   HOOK: useBusinessMetrics
   ============================================================ */
export interface BusinessMetrics {
  hallId: string;
  monthlyRevenue: number;
  monthlyCOGS: number;
  monthlyPayroll: number;
  netRevenue: number;
  salesVelocity: number;
  workerProductivity: number;
  inventoryTurnover: number;
  ahgiTrend: number;
  sriTrend: number;
}

export function useBusinessMetrics(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; metrics?: BusinessMetrics }>(
    hallId ? `/api/halls/${hallId}/operations` : null,
    fetcher,
    { refreshInterval: 30000, dedupingInterval: 5000 }
  );

  return {
    metrics: data?.metrics,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useProposeBusinessAction
   ============================================================ */
export function useProposeBusinessAction() {
  const proposeAction = useCallback(
    async (
      hallId: string,
      payload: {
        type: "inventory_order" | "pricing_change" | "marketing" | "supplier_change";
        title: string;
        description: string;
        amount?: number;
        fundingSource?: "treasury" | "ihcp";
      }
    ): Promise<{ success: boolean; proposalId?: string; error?: string }> => {
      try {
        const res = await fetch(`/api/halls/${hallId}/operations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Proposal failed" };
        }
        return { success: true, proposalId: json.proposalId };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  return { proposeAction };
}

/* ============================================================
   HOOK: useProposeIhcpAction
   ============================================================ */
export function useProposeIhcpAction() {
  const proposeIhcpAction = useCallback(
    async (
      hallId: string,
      payload: {
        type: "payroll" | "inventory" | "marketing" | "upgrade" | "emergency";
        amount: number;
        justification: string;
      }
    ): Promise<{ success: boolean; proposalId?: string; error?: string }> => {
      try {
        const res = await fetch(`/api/halls/${hallId}/ihcp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "IHCP proposal failed" };
        }
        return { success: true, proposalId: json.proposalId };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  return { proposeIhcpAction };
}