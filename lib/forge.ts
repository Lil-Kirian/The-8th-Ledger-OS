import { prisma } from "./prisma";
import {
  getAssetTypeById,
  getWorkerRoles,
  getDepartmentForRole,
  getWorkerSalaryRange,
  generateWorkerNumber,
  getContractDurationMonths,
  getPerformanceThresholds,
  getTerminationNoticeDays,
  getSeveranceMonthsPerYear,
} from "./asset-types";

/* ============================================================
   8TH LEDGER — FORGE LEDGER ENGINE V4.0
   Worker Management, Payroll, Relay, Performance, IHCP Integration
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export interface HireProposalInput {
  hallId: string;
  role: string;
  department?: string;
  salary: number;
  contractMonths: number;
  proposedBy: string;
  justification: string;
}

export interface WorkerPerformanceInput {
  workerId: string;
  score: number;
  metrics: string;
  reviewerId: string;
  improvementPlan?: string;
}

export interface PayrollExecution {
  hallId: string;
  month: string;
  totalPayroll: number;
  workerCount: number;
  entries: PayrollEntry[];
  businessRevenue?: number;
  costOfGoodsSold?: number;
}

export interface PayrollEntry {
  workerId: string;
  workerNumber: string;
  role: string;
  salary: number;
  department: string;
  status: string;
}

export interface RelayMessageInput {
  hallId: string;
  workerId: string;
  direction: "hall_to_worker" | "worker_to_hall";
  content: string;
  loggedBy: string;
}

/* ============================================================
   WORKER CRUD
   ============================================================ */

/**
 * Propose a new hire (creates Worker with status "pending").
 * Actual hiring requires hall vote + 8th Ledger execution.
 */
export async function proposeHire(input: HireProposalInput): Promise<{
  success: boolean;
  worker?: { id: string; workerNumber: string; status: string };
  error?: string;
}> {
  const hall = await prisma.hall.findUnique({
    where: { id: input.hallId },
    include: { pool: { select: { assetType: true } } },
  });

  if (!hall) return { success: false, error: "Hall not found" };
  if (!hall.forgeEnabled) {
    return { success: false, error: "Forge not enabled for this hall. Propose enablement via vote." };
  }

  const assetType = hall.pool?.assetType;
  const validRoles = assetType ? getWorkerRoles(assetType) : [];
  if (validRoles.length > 0 && !validRoles.includes(input.role)) {
    return { success: false, error: `Invalid role for this asset type. Valid: ${validRoles.join(", ")}` };
  }

  const dept = input.department || (assetType ? getDepartmentForRole(assetType, input.role) : "General");
  const salaryRange = assetType ? getWorkerSalaryRange(input.role, assetType) : { min: 500, max: 1000 };

  if (input.salary < salaryRange.min || input.salary > salaryRange.max) {
    return {
      success: false,
      error: `Salary $${input.salary} outside range $${salaryRange.min}-$${salaryRange.max} for ${input.role}`,
    };
  }

  const workerCount = await prisma.worker.count({ where: { hallId: input.hallId } });
  const workerNumber = generateWorkerNumber(input.hallId, workerCount);

  const worker = await prisma.worker.create({
    data: {
      hallId: input.hallId,
      workerNumber,
      role: input.role,
      salary: input.salary,
      contractMonths: input.contractMonths,
      department: dept,
      status: "pending",
      performanceScore: 0,
    },
  });

  await prisma.hallActivity.create({
    data: {
      hallId: input.hallId,
      type: "hire_proposed",
      description: `Hire proposed: ${input.role} (${workerNumber}) at $${input.salary}/mo. ${input.justification}`,
      metadata: JSON.stringify({ workerId: worker.id, proposedBy: input.proposedBy, salary: input.salary }),
    },
  });

  return { success: true, worker: { id: worker.id, workerNumber, status: worker.status } };
}

/**
 * Activate a pending worker (8th Ledger executes after hall vote).
 */
export async function activateWorker(workerId: string, activatedBy: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: { hall: { select: { id: true, name: true } } },
  });

  if (!worker) return { success: false, error: "Worker not found" };
  if (worker.status !== "pending") return { success: false, error: `Worker is ${worker.status}` };

  await prisma.worker.update({
    where: { id: workerId },
    data: { status: "active", hiredAt: new Date() },
  });

  await prisma.hallActivity.create({
    data: {
      hallId: worker.hallId,
      type: "hire_activated",
      description: `Worker ${worker.workerNumber} activated. Role: ${worker.role}.`,
    },
  });

  return { success: true };
}

/**
 * Terminate a worker (after hall vote).
 */
export async function terminateWorker(
  workerId: string,
  reason: string,
  terminatedBy: string
): Promise<{ success: boolean; severance?: number; error?: string }> {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: { hall: { select: { id: true } } },
  });

  if (!worker) return { success: false, error: "Worker not found" };
  if (worker.status !== "active" && worker.status !== "pending") {
    return { success: false, error: `Worker already ${worker.status}` };
  }

  const monthsEmployed = worker.hiredAt
    ? Math.max(0, Math.floor((Date.now() - worker.hiredAt.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const yearsEmployed = monthsEmployed / 12;
  const severance = Math.round(worker.salary * getSeveranceMonthsPerYear() * yearsEmployed);

  await prisma.worker.update({
    where: { id: workerId },
    data: {
      status: "terminated",
      terminatedAt: new Date(),
      terminationReason: reason,
    },
  });

  await prisma.hallActivity.create({
    data: {
      hallId: worker.hallId,
      type: "worker_terminated",
      description: `Worker ${worker.workerNumber} terminated. Reason: ${reason}. Severance: $${severance}.`,
    },
  });

  return { success: true, severance };
}

/* ============================================================
   PERFORMANCE
   ============================================================ */

export async function recordPerformance(input: WorkerPerformanceInput): Promise<{
  success: boolean;
  performance?: { id: string; score: number; status: string };
  error?: string;
}> {
  const worker = await prisma.worker.findUnique({
    where: { id: input.workerId },
    include: { hall: { select: { id: true } } },
  });

  if (!worker) return { success: false, error: "Worker not found" };

  const thresholds = getPerformanceThresholds();
  let status = "meets";
  if (input.score >= thresholds.exceeds) status = "exceeds";
  else if (input.score < thresholds.underperforms) status = "underperforms";

  const performance = await prisma.workerPerformance.create({
    data: {
      workerId: input.workerId,
      score: input.score,
      metrics: input.metrics,
      reviewerId: input.reviewerId,
      improvementPlan: input.improvementPlan || null,
      isTerminated: status === "underperforms" && !!input.improvementPlan,
    },
  });

  // Update worker's cumulative score
  const allScores = await prisma.workerPerformance.aggregate({
    where: { workerId: input.workerId },
    _avg: { score: true },
  });

  await prisma.worker.update({
    where: { id: input.workerId },
    data: { performanceScore: allScores._avg.score ?? input.score },
  });

  return { success: true, performance: { id: performance.id, score: input.score, status } };
}

/* ============================================================
   PAYROLL
   ============================================================ */

/**
 * Execute monthly payroll for a hall.
 * Creates ForgeLedger entry. Deducts from treasury or IHCP.
 */
export async function executePayroll(
  hallId: string,
  month: string,
  executorId: string,
  isAdmin: boolean
): Promise<{ success: boolean; payroll?: PayrollExecution; error?: string }> {
  if (!isAdmin) return { success: false, error: "8th Ledger authority required" };

  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      workers: { where: { status: "active" } },
      hallTreasury: true,
      pool: { select: { assetType: true } },
    },
  });

  if (!hall) return { success: false, error: "Hall not found" };
  if (!hall.forgeEnabled) return { success: false, error: "Forge not enabled" };

  const workers = hall.workers;
  if (workers.length === 0) return { success: false, error: "No active workers" };

  const totalPayroll = workers.reduce((s, w) => s + w.salary, 0);

  // Check treasury + IHCP balance
  const treasuryBalance = hall.hallTreasury?.balance || 0;
  const ihcpBalance = hall.ihcpBalance || 0;
  const available = treasuryBalance + ihcpBalance;

  if (available < totalPayroll) {
    return {
      success: false,
      error: `Insufficient funds. Payroll: $${totalPayroll}, Available: $${available}. Propose IHCP contribution.`,
    };
  }

  const entries: PayrollEntry[] = workers.map((w) => ({
    workerId: w.id,
    workerNumber: w.workerNumber,
    role: w.role,
    salary: w.salary,
    department: w.department || "General",
    status: w.status,
  }));

  await prisma.$transaction(async (tx) => {
    // Deduct from treasury first, then IHCP
    let remaining = totalPayroll;
    const fromTreasury = Math.min(remaining, treasuryBalance);
    if (fromTreasury > 0) {
      await tx.hallTreasury.update({
        where: { hallId },
        data: { balance: { decrement: fromTreasury }, payrollReserve: { increment: fromTreasury } },
      });
      remaining -= fromTreasury;
    }
    if (remaining > 0) {
      await tx.hall.update({
        where: { id: hallId },
        data: { ihcpBalance: { decrement: remaining } },
      });
    }

    // Create ForgeLedger
    await tx.forgeLedger.create({
      data: {
        hallId,
        month,
        totalPayroll,
        workerCount: workers.length,
        entries: JSON.stringify(entries),
      },
    });

    // Create treasury transaction
    await tx.hallTreasuryTransaction.create({
      data: {
        treasuryId: hallId,
        type: "payroll",
        amount: totalPayroll,
        description: `Monthly payroll: ${workers.length} workers, $${totalPayroll}`,
      },
    });

    // Audit
    await tx.auditEntry.create({
      data: {
        type: "payroll_executed",
        description: `Payroll executed for Hall ${hallId}. ${workers.length} workers. Total: $${totalPayroll}.`,
        amount: totalPayroll,
        txHash: `PAYROLL-${hallId}-${month}-${Date.now()}`,
      },
    });
  });

  return {
    success: true,
    payroll: {
      hallId,
      month,
      totalPayroll,
      workerCount: workers.length,
      entries,
    },
  };
}

/**
 * Get payroll history for a hall.
 */
export async function getPayrollHistory(hallId: string, limit: number = 12): Promise<PayrollExecution[]> {
  const ledgers = await prisma.forgeLedger.findMany({
    where: { hallId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return ledgers.map((l) => ({
    hallId: l.hallId,
    month: l.month,
    totalPayroll: l.totalPayroll,
    workerCount: l.workerCount,
    entries: JSON.parse(l.entries || "[]"),
    businessRevenue: l.businessRevenue,
    costOfGoodsSold: l.costOfGoodsSold,
  }));
}

/* ============================================================
   RELAY — Hall ↔ Worker Communication
   ============================================================ */

export async function sendRelayMessage(input: RelayMessageInput): Promise<{
  success: boolean;
  message?: { id: string; relayedAt: Date };
  error?: string;
}> {
  const worker = await prisma.worker.findUnique({
    where: { id: input.workerId },
    select: { hallId: true, status: true },
  });

  if (!worker) return { success: false, error: "Worker not found" };
  if (worker.hallId !== input.hallId) return { success: false, error: "Worker not in this hall" };
  if (worker.status === "terminated") return { success: false, error: "Worker is terminated" };

  const message = await prisma.relayMessage.create({
    data: {
      hallId: input.hallId,
      workerId: input.workerId,
      direction: input.direction,
      content: input.content.trim(),
      loggedBy: input.loggedBy,
      status: "relayed",
    },
  });

  return { success: true, message: { id: message.id, relayedAt: message.relayedAt } };
}

/**
 * Get relay conversation for a worker.
 */
export async function getRelayConversation(workerId: string, limit: number = 50): Promise<Array<{
  id: string;
  direction: string;
  content: string;
  relayedAt: Date;
  loggedBy: string;
  status: string;
}>> {
  const messages = await prisma.relayMessage.findMany({
    where: { workerId },
    orderBy: { relayedAt: "desc" },
    take: limit,
  });

  return messages.map((m) => ({
    id: m.id,
    direction: m.direction,
    content: m.content,
    relayedAt: m.relayedAt,
    loggedBy: m.loggedBy,
    status: m.status,
  }));
}

/* ============================================================
   FORGE ENABLEMENT
   ============================================================ */

export function getEnableForgeProposalTemplate(assetTypeId: string): string {
  const asset = getAssetTypeById(assetTypeId);
  const roles = asset?.workerRoles ?? [];
  const rolesText = roles.length > 0 ? `Default roles: ${roles.slice(0, 5).join(", ")}${roles.length > 5 ? "..." : ""}.` : "No default worker roles for this asset type.";

  return `Proposal to enable the Forge for this hall. The Forge allows hiring workers, managing payroll, and communicating via the 8th Ledger Relay. ${rolesText} Once enabled, the hall can propose hires, performance reviews, and terminations. Workers are employed by the 8th Ledger, not the hall. Payroll is executed monthly from treasury or IHCP funds.`;
}

export function getEnableInventoryProposalTemplate(assetTypeId: string): string {
  const asset = getAssetTypeById(assetTypeId);
  const capable = asset?.inventoryCapable ?? false;

  if (!capable) {
    return `Proposal to enable inventory management for this hall. Note: This asset type does not have inventory capabilities by default. If enabled, the hall can manage stock, set reorder thresholds, and optionally list products for public sale via the 8th Ledger Marketplace.`;
  }

  return `Proposal to enable inventory management for this hall. This asset type supports inventory operations. Once enabled, the hall can: add stock items, track cost of goods, set reorder alerts, propose stock orders, and vote to list products for public sale. Revenue from inventory sales flows to the hall treasury after 5% platform fee and fulfillment costs.`;
}

/* ============================================================
   WORKER ROSTER QUERIES
   ============================================================ */

export async function getWorkerRoster(hallId: string): Promise<Array<{
  id: string;
  workerNumber: string;
  role: string;
  department: string;
  salary: number;
  status: string;
  performanceScore: number;
  hiredAt: Date;
  contractMonths: number;
}>> {
  const workers = await prisma.worker.findMany({
    where: { hallId },
    orderBy: [{ status: "asc" }, { hiredAt: "desc" }],
  });

  return workers.map((w) => ({
    id: w.id,
    workerNumber: w.workerNumber,
    role: w.role,
    department: w.department || "General",
    salary: w.salary,
    status: w.status,
    performanceScore: w.performanceScore,
    hiredAt: w.hiredAt,
    contractMonths: w.contractMonths,
  }));
}

export async function getWorkerDetail(workerId: string): Promise<{
  id: string;
  workerNumber: string;
  role: string;
  department: string;
  salary: number;
  status: string;
  performanceScore: number;
  hiredAt: Date;
  contractMonths: number;
  performances: Array<{ id: string; score: number; metrics: string; reviewedAt: Date; reviewerId: string }>;
} | null> {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      performances: { orderBy: { reviewedAt: "desc" } },
    },
  });

  if (!worker) return null;

  return {
    id: worker.id,
    workerNumber: worker.workerNumber,
    role: worker.role,
    department: worker.department || "General",
    salary: worker.salary,
    status: worker.status,
    performanceScore: worker.performanceScore,
    hiredAt: worker.hiredAt,
    contractMonths: worker.contractMonths,
    performances: worker.performances.map((p) => ({
      id: p.id,
      score: p.score,
      metrics: p.metrics || "",
      reviewedAt: p.reviewedAt,
      reviewerId: p.reviewerId,
    })),
  };
}

/* ============================================================
   FORGE LEDGER QUERIES
   ============================================================ */

export async function getForgeLedger(hallId: string, limit: number = 12): Promise<Array<{
  month: string;
  totalPayroll: number;
  workerCount: number;
  businessRevenue: number;
  costOfGoodsSold: number;
  createdAt: Date;
}>> {
  const ledgers = await prisma.forgeLedger.findMany({
    where: { hallId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return ledgers.map((l) => ({
    month: l.month,
    totalPayroll: l.totalPayroll,
    workerCount: l.workerCount,
    businessRevenue: l.businessRevenue,
    costOfGoodsSold: l.costOfGoodsSold,
    createdAt: l.createdAt,
  }));
}

/* ============================================================
   PAYROLL SHORTFALL — IHCP INTEGRATION
   ============================================================ */

export async function checkPayrollShortfall(hallId: string): Promise<{
  projectedPayroll: number;
  treasuryBalance: number;
  ihcpBalance: number;
  shortfall: number;
  needsIhcp: boolean;
}> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      workers: { where: { status: "active" }, select: { salary: true } },
      hallTreasury: { select: { balance: true } },
    },
  });

  if (!hall) {
    return { projectedPayroll: 0, treasuryBalance: 0, ihcpBalance: 0, shortfall: 0, needsIhcp: false };
  }

  const projectedPayroll = hall.workers.reduce((s, w) => s + w.salary, 0);
  const treasuryBalance = hall.hallTreasury?.balance || 0;
  const ihcpBalance = hall.ihcpBalance || 0;
  const shortfall = Math.max(0, projectedPayroll - treasuryBalance);
  const needsIhcp = shortfall > 0 && ihcpBalance < shortfall;

  return { projectedPayroll, treasuryBalance, ihcpBalance, shortfall, needsIhcp };
}