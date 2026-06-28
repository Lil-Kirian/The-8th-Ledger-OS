import { prisma } from "./prisma";

/* ============================================================
   8TH LEDGER — PIR ENGINE (Protocol Infrastructure Reserve)
   6-Pillar Model: Shield | Seal | Forge | Spire | Vanguard | Sanctuary
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export type PirPillarName = "shield" | "seal" | "forge" | "spire" | "vanguard" | "sanctuary";

export interface PirPillar {
  pillar: PirPillarName;
  amount: number;
  purpose: string;
  spent: number;
  remaining: number;
}

export interface PirAllocationResult {
  hallId: string;
  totalPir: number;
  pillars: PirPillar[];
  createdAt: Date;
}

export interface PirAdvanceRequest {
  id: string;
  hallId: string;
  amount: number;
  reason: string;
  repaymentRate: number; // 0-1, % of monthly dividends
  interestRate: number;
  status: "active" | "repaid" | "defaulted" | "waived";
  repaidAmount: number;
  remainingDebt: number;
  approvedBy: string;
  approvedAt: Date;
  dueDate?: Date;
}

export interface PirAdvanceTerms {
  monthlyDeduction: number;
  estimatedMonths: number;
  interestAfter12mo: number;
  totalRepayment: number;
}

export interface PirStatus {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  advancesActive: number;
  advancesTotalDebt: number;
  advancesRepaid: number;
  sanctuaryAvailable: number;
  shieldAvailable: number;
  forgeAvailable: number;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const PIR_PILLAR_RATES: Record<PirPillarName, number> = {
  shield: 0.25,
  seal: 0.20,
  forge: 0.20,
  spire: 0.15,
  vanguard: 0.12,
  sanctuary: 0.08,
};

const PIR_REPAYMENT_DEFAULT_RATE = 0.05; // 5% of monthly dividends
const PIR_INTEREST_AFTER_12MO = 0.02;   // 2% annual after 12 months
const PIR_OVERRIDE_INTEREST = 0.05;     // 5% if 8th Ledger override (emergency)

/* ============================================================
   PIR ALLOCATION — 6-Pillar Split
   ============================================================ */

/**
 * Allocate PIR for a newly forged pool.
 * Creates 6 PirAllocation records. All amounts are integers (cents/whole dollars).
 */
export async function allocatePirForPool(
  hallId: string,
  pirAmount: number,
  allocatedBy: string
): Promise<PirAllocationResult> {
  if (pirAmount <= 0) {
    throw new Error("PIR amount must be positive");
  }

  const pillars: PirPillar[] = [
    {
      pillar: "shield",
      amount: Math.floor(pirAmount * PIR_PILLAR_RATES.shield),
      purpose: "Insurance coverage — Lloyd's casualty, liability, force majeure",
      spent: 0,
      remaining: Math.floor(pirAmount * PIR_PILLAR_RATES.shield),
    },
    {
      pillar: "seal",
      amount: Math.floor(pirAmount * PIR_PILLAR_RATES.seal),
      purpose: "Legal structure — SPV formation, deeds, operating agreements",
      spent: 0,
      remaining: Math.floor(pirAmount * PIR_PILLAR_RATES.seal),
    },
    {
      pillar: "forge",
      amount: Math.floor(pirAmount * PIR_PILLAR_RATES.forge),
      purpose: "Maintenance — repairs, vendor contracts, management fees, payroll",
      spent: 0,
      remaining: Math.floor(pirAmount * PIR_PILLAR_RATES.forge),
    },
    {
      pillar: "spire",
      amount: Math.floor(pirAmount * PIR_PILLAR_RATES.spire),
      purpose: "Protocol development — infrastructure, API, audits, security",
      spent: 0,
      remaining: Math.floor(pirAmount * PIR_PILLAR_RATES.spire),
    },
    {
      pillar: "vanguard",
      amount: Math.floor(pirAmount * PIR_PILLAR_RATES.vanguard),
      purpose: "R&D — new verticals, geographic expansion, ecosystem grants",
      spent: 0,
      remaining: Math.floor(pirAmount * PIR_PILLAR_RATES.vanguard),
    },
    {
      pillar: "sanctuary",
      amount: Math.floor(pirAmount * PIR_PILLAR_RATES.sanctuary),
      purpose: "Reserve — vacancy coverage, dividend smoothing, closure protection",
      spent: 0,
      remaining: Math.floor(pirAmount * PIR_PILLAR_RATES.sanctuary),
    },
  ];

  // Handle rounding remainder — add to sanctuary
  const allocatedSum = pillars.reduce((s, p) => s + p.amount, 0);
  const remainder = pirAmount - allocatedSum;
  if (remainder > 0) {
    const sanctuary = pillars.find((p) => p.pillar === "sanctuary")!;
    sanctuary.amount += remainder;
    sanctuary.remaining += remainder;
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      pillars.map((p) =>
        tx.pirAllocation.create({
          data: {
            hallId,
            pillar: p.pillar,
            amount: p.amount,
            purpose: p.purpose,
            spent: 0,
          },
        })
      )
    );

    await tx.auditEntry.create({
      data: {
        type: "pir_allocated",
        description: `PIR allocated for Hall ${hallId}: $${pirAmount}. 6 pillars created by ${allocatedBy}.`,
        amount: pirAmount,
        txHash: `PIR-ALLOC-${hallId}-${Date.now()}`,
      },
    });
  });

  return {
    hallId,
    totalPir: pirAmount,
    pillars,
    createdAt: new Date(),
  };
}

/**
 * Get PIR allocations for a hall.
 */
export async function getPirAllocations(hallId: string): Promise<PirPillar[]> {
  const allocations = await prisma.pirAllocation.findMany({
    where: { hallId },
    orderBy: { createdAt: "desc" },
  });

  return allocations.map((a) => ({
    pillar: a.pillar as PirPillarName,
    amount: a.amount,
    purpose: a.purpose,
    spent: a.spent,
    remaining: a.amount - a.spent,
  }));
}

/**
 * Get PIR status summary for a hall.
 */
export async function getPirStatus(hallId: string): Promise<PirStatus> {
  const allocations = await prisma.pirAllocation.findMany({
    where: { hallId },
  });

  const advances = await prisma.pirAdvance.findMany({
    where: { hallId },
  });

  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
  const totalSpent = allocations.reduce((s, a) => s + a.spent, 0);

  const sanctuary = allocations.find((a) => a.pillar === "sanctuary");
  const shield = allocations.find((a) => a.pillar === "shield");
  const forge = allocations.find((a) => a.pillar === "forge");

  return {
    totalAllocated,
    totalSpent,
    totalRemaining: totalAllocated - totalSpent,
    advancesActive: advances.filter((a) => a.status === "active").length,
    advancesTotalDebt: advances.reduce((s, a) => s + a.amount, 0),
    advancesRepaid: advances.reduce((s, a) => s + a.repaidAmount, 0),
    sanctuaryAvailable: sanctuary ? sanctuary.amount - sanctuary.spent : 0,
    shieldAvailable: shield ? shield.amount - shield.spent : 0,
    forgeAvailable: forge ? forge.amount - forge.spent : 0,
  };
}

/* ============================================================
   PIR SPENDING — Pillar Execution
   ============================================================ */

/**
 * Spend from a PIR pillar (admin only).
 */
export async function spendFromPillar(
  hallId: string,
  pillar: PirPillarName,
  amount: number,
  reason: string,
  spentBy: string
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  if (amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  const allocation = await prisma.pirAllocation.findFirst({
    where: { hallId, pillar },
    orderBy: { createdAt: "desc" },
  });

  if (!allocation) {
    return { success: false, error: `No PIR allocation found for pillar: ${pillar}` };
  }

  const available = allocation.amount - allocation.spent;
  if (amount > available) {
    return { success: false, error: `Insufficient ${pillar} funds. Available: $${available}, Requested: $${amount}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pirAllocation.update({
      where: { id: allocation.id },
      data: { spent: { increment: amount } },
    });

    await tx.auditEntry.create({
      data: {
        type: "pir_spent",
        description: `PIR spent from ${pillar}: $${amount}. Reason: ${reason}. By: ${spentBy}`,
        amount,
        txHash: `PIR-SPEND-${pillar}-${Date.now()}`,
      },
    });

    await tx.eighthLedgerUpdate.create({
      data: {
        hallId,
        type: pillar === "shield" ? "insurance" : pillar === "forge" ? "maintenance" : "repair",
        title: `PIR — ${pillar.toUpperCase()}`,
        content: reason,
        amount,
      },
    });
  });

  return { success: true, remaining: available - amount };
}

/* ============================================================
   PIR ADVANCE — Asset Protection Loan
   ============================================================ */

/**
 * Calculate PIR advance repayment terms. All amounts are integers.
 */
export function calculatePirAdvanceTerms(
  amount: number,
  monthlyDividendEstimate: number,
  repaymentRate: number = PIR_REPAYMENT_DEFAULT_RATE,
  isOverride: boolean = false
): PirAdvanceTerms {
  const monthlyDeduction = Math.floor(monthlyDividendEstimate * repaymentRate);
  const estimatedMonths = monthlyDeduction > 0 ? Math.ceil(amount / monthlyDeduction) : 0;

  const interestRate = isOverride ? PIR_OVERRIDE_INTEREST : PIR_INTEREST_AFTER_12MO;
  const interestAfter12mo =
    estimatedMonths > 12 ? Math.floor(amount * interestRate * (estimatedMonths - 12) / 12) : 0;

  const totalRepayment = amount + interestAfter12mo;

  return {
    monthlyDeduction,
    estimatedMonths,
    interestAfter12mo,
    totalRepayment,
  };
}

/**
 * Request PIR advance (hall vote required, or admin override).
 */
export async function requestPirAdvance(input: {
  hallId: string;
  amount: number;
  reason: string;
  repaymentRate: number;
  requestedBy: string;
  isAdminOverride: boolean;
}): Promise<{ success: boolean; advance?: PirAdvanceRequest; error?: string }> {
  const { hallId, amount, reason, repaymentRate, requestedBy, isAdminOverride } = input;

  if (amount <= 0) {
    return { success: false, error: "Advance amount must be positive" };
  }

  if (!reason.trim()) {
    return { success: false, error: "Reason required" };
  }

  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      pool: { select: { trueCost: true, listedPrice: true } },
      pirAllocations: true,
    },
  });

  if (!hall) {
    return { success: false, error: "Hall not found" };
  }

  // Check sanctuary availability
  const sanctuary = hall.pirAllocations.find((a) => a.pillar === "sanctuary");
  const sanctuaryAvailable = sanctuary ? sanctuary.amount - sanctuary.spent : 0;

  if (amount > sanctuaryAvailable && !isAdminOverride) {
    return { success: false, error: `Insufficient Sanctuary funds. Available: $${sanctuaryAvailable}` };
  }

  // If admin override, skip vote requirement
  if (!isAdminOverride) {
    const approvedProposal = await prisma.proposal.findFirst({
      where: {
        hallId,
        type: "pir_advance",
        status: "passed",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    if (!approvedProposal) {
      return { success: false, error: "Hall vote required for PIR advance. Propose a PIR advance first." };
    }
  }

  const interestRate = isAdminOverride ? PIR_OVERRIDE_INTEREST : PIR_INTEREST_AFTER_12MO;

  const advance = await prisma.pirAdvance.create({
    data: {
      hallId,
      amount,
      reason: reason.trim(),
      repaymentRate,
      repaidAmount: 0,
      interestRate,
      status: "active",
      approvedBy: requestedBy,
      approvedAt: new Date(),
    },
  });

  // Update hall PIR debt
  await prisma.hall.update({
    where: { id: hallId },
    data: { pirDebt: { increment: amount } },
  });

  // Create 8th Ledger update
  await prisma.eighthLedgerUpdate.create({
    data: {
      hallId,
      type: "pir_advance",
      title: "PIR Advance — Asset Protection",
      content: `Advance of $${amount} approved. Reason: ${reason}. Repayment: ${(repaymentRate * 100).toFixed(0)}% of monthly dividends.`,
      amount,
    },
  });

  // Audit
  await prisma.auditEntry.create({
    data: {
      type: "pir_advance_issued",
      description: `PIR advance issued: $${amount}. Hall: ${hallId}. Reason: ${reason}. Override: ${isAdminOverride}`,
      amount,
      txHash: `PIR-ADV-${advance.id}`,
    },
  });

  return {
    success: true,
    advance: {
      id: advance.id,
      hallId,
      amount,
      reason: advance.reason,
      repaymentRate: advance.repaymentRate,
      interestRate: advance.interestRate,
      status: "active",
      repaidAmount: 0,
      remainingDebt: amount,
      approvedBy: advance.approvedBy,
      approvedAt: advance.approvedAt,
      dueDate: advance.dueDate || undefined,
    },
  };
}

/**
 * Repay PIR advance from dividends. Integer math only.
 */
export async function repayPirAdvanceFromDividend(
  advanceId: string,
  dividendAmount: number,
  ownershipId: string
): Promise<{ success: boolean; repaid?: number; remaining?: number; error?: string }> {
  const advance = await prisma.pirAdvance.findUnique({
    where: { id: advanceId },
    include: { hall: true },
  });

  if (!advance || advance.status !== "active") {
    return { success: false, error: "Advance not found or not active" };
  }

  // Integer repayment calculation
  const repayment = Math.floor(dividendAmount * advance.repaymentRate);
  if (repayment <= 0) {
    return { success: true, repaid: 0, remaining: advance.amount - advance.repaidAmount };
  }

  const newRepaid = advance.repaidAmount + repayment;
  const remaining = Math.max(0, advance.amount - newRepaid);
  const newStatus = remaining <= 0 ? "repaid" : advance.status;

  await prisma.$transaction(async (tx) => {
    await tx.pirAdvance.update({
      where: { id: advanceId },
      data: {
        repaidAmount: newRepaid,
        status: newStatus,
      },
    });

    // Update hall PIR debt
    await tx.hall.update({
      where: { id: advance.hallId },
      data: { pirDebt: { decrement: repayment } },
    });

    // Update ownership PIR debt
    await tx.ownership.update({
      where: { id: ownershipId },
      data: { pirDebt: { decrement: repayment } },
    });

    if (newStatus === "repaid") {
      await tx.eighthLedgerUpdate.create({
        data: {
          hallId: advance.hallId,
          type: "pir_advance",
          title: "PIR Advance — Repaid",
          content: `Advance of $${advance.amount} fully repaid.`,
          amount: 0,
        },
      });
    }
  });

  return {
    success: true,
    repaid: repayment,
    remaining,
  };
}

/**
 * Get all active PIR advances for a hall.
 */
export async function getActivePirAdvances(hallId: string): Promise<PirAdvanceRequest[]> {
  const advances = await prisma.pirAdvance.findMany({
    where: { hallId, status: "active" },
    orderBy: { approvedAt: "desc" },
  });

  return advances.map((a) => ({
    id: a.id,
    hallId: a.hallId,
    amount: a.amount,
    reason: a.reason,
    repaymentRate: a.repaymentRate,
    interestRate: a.interestRate,
    status: a.status as PirAdvanceRequest["status"],
    repaidAmount: a.repaidAmount,
    remainingDebt: a.amount - a.repaidAmount,
    approvedBy: a.approvedBy,
    approvedAt: a.approvedAt,
    dueDate: a.dueDate || undefined,
  }));
}

/* ============================================================
   PIR AUDIT
   ============================================================ */

/**
 * Generate PIR audit report for a hall.
 */
export async function generatePirAudit(hallId: string): Promise<{
  hallId: string;
  generatedAt: string;
  allocations: PirPillar[];
  advances: PirAdvanceRequest[];
  totalSpent: number;
  totalRemaining: number;
  totalAdvances: number;
  integrityHash: string;
}> {
  const allocations = await getPirAllocations(hallId);
  const advances = await getActivePirAdvances(hallId);
  const allAdvances = await prisma.pirAdvance.findMany({ where: { hallId } });

  const totalSpent = allocations.reduce((s, a) => s + a.spent, 0);
  const totalRemaining = allocations.reduce((s, a) => s + a.remaining, 0);
  const totalAdvances = allAdvances.reduce((s, a) => s + a.amount, 0);

  const data = `${hallId}|${totalSpent}|${totalRemaining}|${totalAdvances}|${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  return {
    hallId,
    generatedAt: new Date().toISOString(),
    allocations,
    advances,
    totalSpent,
    totalRemaining,
    totalAdvances,
    integrityHash: `pir-audit-${Math.abs(hash).toString(16)}`,
  };
}

/* ============================================================
   SANCTUARY OVERRIDE — Emergency Asset Protection
   ============================================================ */

/**
 * 8th Ledger emergency override — spend from Sanctuary without vote.
 */
export async function sanctuaryOverride(
  hallId: string,
  amount: number,
  reason: string,
  adminLedgerId: string,
  isPrimaryAdmin: boolean
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  if (!isPrimaryAdmin) {
    return { success: false, error: "Primary Admin authority required for Sanctuary Override" };
  }

  const sanctuary = await prisma.pirAllocation.findFirst({
    where: { hallId, pillar: "sanctuary" },
    orderBy: { createdAt: "desc" },
  });

  if (!sanctuary) {
    return { success: false, error: "No Sanctuary allocation found" };
  }

  const available = sanctuary.amount - sanctuary.spent;
  if (amount > available) {
    return { success: false, error: `Insufficient Sanctuary funds. Available: $${available}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pirAllocation.update({
      where: { id: sanctuary.id },
      data: { spent: { increment: amount } },
    });

    // Create PIR advance with override terms
    await tx.pirAdvance.create({
      data: {
        hallId,
        amount,
        reason: `[SANCTUARY OVERRIDE] ${reason}`,
        repaymentRate: PIR_REPAYMENT_DEFAULT_RATE,
        repaidAmount: 0,
        interestRate: PIR_OVERRIDE_INTEREST,
        status: "active",
        approvedBy: adminLedgerId,
        approvedAt: new Date(),
      },
    });

    // Update hall PIR debt
    await tx.hall.update({
      where: { id: hallId },
      data: { pirDebt: { increment: amount } },
    });

    // 8th Ledger update
    await tx.eighthLedgerUpdate.create({
      data: {
        hallId,
        type: "pir_advance",
        title: "🚨 SANCTUARY OVERRIDE — Asset Protected",
        content: `Emergency advance of $${amount} executed without hall vote. Reason: ${reason}. Admin: ${adminLedgerId}. Repayment: 5% of dividends + 5% interest.`,
        amount,
      },
    });

    // Audit
    await tx.auditEntry.create({
      data: {
        type: "sanctuary_override",
        description: `Sanctuary Override executed: $${amount}. Hall: ${hallId}. Reason: ${reason}. Admin: ${adminLedgerId}`,
        amount,
        txHash: `SANCTUARY-OVERRIDE-${hallId}-${Date.now()}`,
      },
    });

    // Security audit
    await tx.securityAuditLog.create({
      data: {
        ledgerId: adminLedgerId,
        action: "sanctuary_override",
        ipAddress: "system",
        success: true,
        details: `Sanctuary override: $${amount} for Hall ${hallId}`,
        currentHash: `SEC-SANCTUARY-${Date.now()}`,
      },
    });
  });

  return { success: true, remaining: available - amount };
}

/* ============================================================
   UTILITY
   ============================================================ */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
