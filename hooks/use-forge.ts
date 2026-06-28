import useSWR from "swr";
import { useCallback } from "react";

/* ============================================================
   TYPES
   ============================================================ */

export interface PerformanceReview {
  id: string;
  score: number;
  metrics: Record<string, number> | null;
  reviewerId: string;
  reviewerLedgerId?: string;
  improvementPlan?: string;
  isTerminated: boolean;
  reviewedAt: string;
}

export interface WorkerBase {
  id: string;
  workerNumber: string;
  role: string;
  salary: number;
  contractMonths: number;
  hiredAt: string;
  status: "active" | "probation" | "terminated";
  performanceScore: number;
  lastReview?: PerformanceReview | null;
}

export interface ForgeLedgerEntry {
  workerId: string;
  workerNumber: string;
  role: string;
  salary: number;
  period: string;
  performanceScore: number;
  notes?: string;
}

export interface ForgeLedgerMonth {
  month: string;
  totalPayroll: number;
  workerCount: number;
  entries: ForgeLedgerEntry[];
}

export interface ForgeLedgerData {
  hall: {
    id: string;
    name: string;
    hallClass: string | null;
    payrollReserve: number;
    sriScore: number;
    ahgiScore: number;
    pirDebt: number;
    status: string;
  };
  workerRules: {
    maxWorkers: number;
    canProposeHire: boolean;
    canProposeFire: boolean;
    showIndividualSalaries: boolean;
  };
  forgeLedgers: ForgeLedgerMonth[];
  workers: WorkerBase[];
  staffingSummary: {
    activeWorkers: number;
    probationWorkers: number;
    totalMonthlyPayroll: number;
    avgPerformanceScore: number;
    nextReviewDue: number;
  };
  canProposeHire: boolean;
  canProposeFire: boolean;
  showSalaries: boolean;
  isAdmin: boolean;
}

export interface WorkerDetail {
  id: string;
  workerNumber: string;
  role: string;
  contractMonths: number;
  hiredAt: string;
  status: string;
  performanceScore: number;
  terminationReason?: string;
  terminatedAt?: string;
  salary?: number;
  totalEstimatedContractValue?: number;
  relayMessageCount: number;
  performanceHistory: PerformanceReview[];
  hallClass: string | null;
  canMessage: boolean;
}

export interface PayrollWorker {
  id: string;
  workerNumber: string;
  role: string;
  status: string;
  salary: number;
}

export interface PayrollHistory {
  payrollHistory: ForgeLedgerMonth[];
  workers: PayrollWorker[];
  totalWorkers: number;
  currentMonthlyPayroll: number;
}

export interface RelayMessage {
  id: string;
  direction: "hall_to_worker" | "worker_to_hall";
  content: string;
  relayedAt: string;
  status: "relayed" | "delivered" | "read";
  loggedBy: string;
}

export interface WorkersListResponse {
  workers: WorkerBase[];
  count: number;
  hallClass: string | null;
  canProposeHire: boolean;
  canProposeFire: boolean;
  showSalaries: boolean;
}

export interface RelayResponse {
  hallId: string;
  workerId: string;
  messages: RelayMessage[];
  count: number;
}

/* ============================================================
   FETCHER
   ============================================================ */

const fetchJson = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json());

/* ============================================================
   HOOKS
   ============================================================ */

export function useForge(hallId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ForgeLedgerData>(
    hallId ? `/api/halls/${hallId}/forge` : null,
    fetchJson,
    { refreshInterval: 30000 }
  );

  return {
    forge: data,
    isLoading,
    error,
    mutate,
  };
}

export function useWorkers(hallId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<WorkersListResponse>(
    hallId ? `/api/halls/${hallId}/forge/workers` : null,
    fetchJson,
    { refreshInterval: 30000 }
  );

  return {
    workers: data?.workers || [],
    count: data?.count || 0,
    hallClass: data?.hallClass,
    canProposeHire: data?.canProposeHire || false,
    canProposeFire: data?.canProposeFire || false,
    showSalaries: data?.showSalaries || false,
    isLoading,
    error,
    mutate,
  };
}

export function useWorker(
  hallId: string | undefined,
  workerId: string | undefined
) {
  const { data, error, isLoading, mutate } = useSWR<WorkerDetail>(
    hallId && workerId
      ? `/api/halls/${hallId}/forge/workers/${workerId}`
      : null,
    fetchJson,
    { refreshInterval: 30000 }
  );

  return {
    worker: data,
    isLoading,
    error,
    mutate,
  };
}

export function useRelay(
  hallId: string | undefined,
  workerId: string | undefined,
  limit: number = 50
) {
  const { data, error, isLoading, mutate } = useSWR<RelayResponse>(
    hallId && workerId
      ? `/api/halls/${hallId}/forge/workers/${workerId}/relay?limit=${limit}`
      : null,
    fetchJson,
    { refreshInterval: 10000 }
  );

  return {
    messages: data?.messages || [],
    count: data?.count || 0,
    isLoading,
    error,
    mutate,
  };
}

export function usePayroll(hallId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<PayrollHistory>(
    hallId ? `/api/halls/${hallId}/forge/payroll` : null,
    fetchJson,
    { refreshInterval: 60000 }
  );

  return {
    payroll: data,
    isLoading,
    error,
    mutate,
  };
}

/* ============================================================
   MUTATIONS
   ============================================================ */

export async function proposeHire(
  hallId: string,
  payload: {
    role: string;
    responsibilities: string;
    salaryRange: [number, number];
    expectedOutcome: string;
    contractMonths: number;
    fundingSource?: string;
  }
) {
  const res = await fetch(`/api/halls/${hallId}/forge/workers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<{ success: boolean; proposalId?: string; error?: string }>;
}

export async function submitPerformanceReview(
  hallId: string,
  workerId: string,
  payload: {
    score?: number;
    metrics?: Record<string, number>;
    improvementPlan?: string;
    recommendTermination?: boolean;
    notes?: string;
  }
) {
  const res = await fetch(
    `/api/halls/${hallId}/forge/workers/${workerId}/performance`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );
  return res.json() as Promise<{ success: boolean; reviewId?: string; error?: string }>;
}

export async function sendRelayMessage(
  hallId: string,
  workerId: string,
  payload: {
    content: string;
    direction: "hall_to_worker" | "worker_to_hall";
  }
) {
  const res = await fetch(
    `/api/halls/${hallId}/forge/workers/${workerId}/relay`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );
  return res.json() as Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export async function executePayroll(
  hallId: string,
  month?: string,
  force?: boolean
) {
  const res = await fetch(`/api/halls/${hallId}/forge/payroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ month, force }),
  });
  return res.json() as Promise<{
    success: boolean;
    payrollId?: string;
    totalPaid?: number;
    workersPaid?: number;
    error?: string;
  }>;
}

/* ============================================================
   TOGGLE FORGE ENABLE/DISABLE
   ============================================================ */
export async function toggleForge(
  hallId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/halls/${hallId}/forge/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ enabled }),
  });
  return res.json() as Promise<{ success: boolean; error?: string }>;
}

export function useToggleForge() {
  const mutateAsync = useCallback(
    async ({ hallId, enable, enabled }: { hallId: string; enable?: boolean; enabled?: boolean }) =>
      toggleForge(hallId, enable ?? enabled ?? true),
    []
  );

  return { mutateAsync };
}
