import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import {
  getAssetTypePayrollReservePercent,
  getAssetTypeTitheRate,
  getAssetTypeDividendFrequency,
  getAssetTypeById,
} from "./asset-types";
import { calculateTotalIhcpDebt } from "./ihcp";

/* ============================================================
   8TH LEDGER — DIVIDEND & REVENUE ENGINE V4.0
   Phase 4 Flow: Gross → Tithe 20% → IHCP Repayment → Payroll → COGS → Net → Split
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export interface RevenueSplitV4 {
  gross: number;
  ledgerTithe: number;
  ihcpRepayment: number;
  payrollDeducted: number;
  cogs: number;
  netHallRevenue: number;
}

export interface DistributionResultV4 {
  revenueLogId: string;
  hallId: string;
  grossAmount: number;
  ledgerTithe: number;
  ihcpRepayment: number;
  payrollDeducted: number;
  cogs: number;
  netHallRevenue: number;
  ownerEntries: Array<{
    ownershipId: string;
    userId: string;
    amount: number;
    ownershipPercent: number;
  }>;
  totalDistributed: number;
  remainder: number;
}

export interface RoiResult {
  totalInvested: number;
  totalReturned: number;
  netProfit: number;
  roiPct: number;
  annualizedPct: number | null;
  daysHeld: number;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const ROUNDING_PRECISION = 100;

/* ============================================================
   PURE FUNCTIONS — PHASE 4 REVENUE SPLIT
   ============================================================ */

/**
 * Phase 4 Revenue Flow:
 * Gross Revenue
 *   → 8th Ledger Tithe (20%)
 *   → IHCP Repayment (if active)
 *   → Payroll (Forge)
 *   → COGS (Class III only)
 *   → Net Hall Revenue
 *   → Split by ownership %
 */
export function calculateRevenueSplitV4(
  gross: number,
  assetTypeId: string,
  ihcpDebt: number = 0,
  workerCount: number = 0,
  customPayroll?: number
): RevenueSplitV4 {
  const asset = getAssetTypeById(assetTypeId);
  const titheRate = getAssetTypeTitheRate(assetTypeId) / 100;
  const ledgerTithe = Math.round(gross * titheRate * ROUNDING_PRECISION) / ROUNDING_PRECISION;

  let afterTithe = gross - ledgerTithe;

  // IHCP repayment: 10% of net revenue until debt cleared
  const ihcpRepayment = ihcpDebt > 0
    ? Math.min(ihcpDebt, Math.round(afterTithe * 0.1 * ROUNDING_PRECISION) / ROUNDING_PRECISION)
    : 0;
  afterTithe -= ihcpRepayment;

  // Payroll: either custom amount or asset-type reserve percent
  const payrollReserve = customPayroll ?? (asset
    ? Math.round(gross * (getAssetTypePayrollReservePercent(assetTypeId) / 100) * ROUNDING_PRECISION) / ROUNDING_PRECISION
    : 0);
  const payrollDeducted = Math.min(payrollReserve, afterTithe);
  afterTithe -= payrollDeducted;

  // COGS: Class III only (approx 35% of gross for active operations)
  let cogs = 0;
  if (asset?.hallClass === "III") {
    cogs = Math.round(gross * 0.35 * ROUNDING_PRECISION) / ROUNDING_PRECISION;
    cogs = Math.min(cogs, afterTithe); // Cannot exceed remaining
    afterTithe -= cogs;
  }

  const netHallRevenue = Math.max(0, Math.round(afterTithe * ROUNDING_PRECISION) / ROUNDING_PRECISION);

  return { gross, ledgerTithe, ihcpRepayment, payrollDeducted, cogs, netHallRevenue };
}

/**
 * Distribute net revenue proportionally by ownership %.
 * Remainder goes to largest owner.
 */
export function distributeByOwnership(
  netPool: number,
  owners: Array<{ ownershipId: string; userId: string; ownershipPercent: number }>
): Array<{ ownershipId: string; userId: string; amount: number; ownershipPercent: number }> {
  if (owners.length === 0) return [];
  if (netPool <= 0) return owners.map((o) => ({ ...o, amount: 0 }));

  const totalOwnership = owners.reduce((s, o) => s + o.ownershipPercent, 0);
  if (totalOwnership <= 0) return owners.map((o) => ({ ...o, amount: 0 }));

  let distributed = 0;
  const entries = owners.map((o) => {
    const raw = (o.ownershipPercent / totalOwnership) * netPool;
    const amount = Math.floor(raw * ROUNDING_PRECISION) / ROUNDING_PRECISION;
    distributed += amount;
    return { ...o, amount };
  });

  const remainder = Math.round((netPool - distributed) * ROUNDING_PRECISION) / ROUNDING_PRECISION;
  if (remainder > 0 && entries.length > 0) {
    entries.sort((a, b) => b.ownershipPercent - a.ownershipPercent);
    entries[0].amount = Math.round((entries[0].amount + remainder) * ROUNDING_PRECISION) / ROUNDING_PRECISION;
  }

  return entries;
}

/* ============================================================
   REVENUE INGESTION — PHASE 4
   ============================================================ */

/**
 * Ingest new revenue into a hall.
 * Phase 4: Gross → Tithe → IHCP → Payroll → COGS → Net → Ownership % split
 */
export async function ingestRevenue(input: {
  hallId: string;
  amount: number;
  source: string;
  businessSource?: string;
  payrollDeducted?: number;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; distribution?: DistributionResultV4; error?: string }> {
  const { hallId, amount, source, businessSource, payrollDeducted, metadata } = input;

  if (amount <= 0) {
    return { success: false, error: "Revenue amount must be positive" };
  }

  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      ownerships: {
        where: { status: "active" },
        select: {
          id: true,
          userId: true,
          ownershipPercent: true,
          accumulatedDividends: true,
        },
      },
      hallTreasury: true,
      pool: { select: { id: true, poolId: true, assetType: true } },
      hallContributions: {
        where: { status: "active" },
        select: { id: true, amount: true, repaidAmount: true },
      },
    },
  });

  if (!hall) {
    return { success: false, error: "Hall not found" };
  }

  // Calculate outstanding IHCP debt
  const ihcpDebt = calculateTotalIhcpDebt(hall.hallContributions);

  const split = calculateRevenueSplitV4(
    amount,
    hall.pool?.assetType || "",
    ihcpDebt,
    0,
    payrollDeducted
  );

  const ownerEntries = distributeByOwnership(
    split.netHallRevenue,
    hall.ownerships.map((o) => ({
      ownershipId: o.id,
      userId: o.userId,
      ownershipPercent: Number(o.ownershipPercent),
    }))
  );

  const result = await prisma.$transaction(async (tx) => {
    // Create revenue log with Phase 4 fields
    const revenueLog = await tx.revenueLog.create({
      data: {
        poolId: hall.poolId,
        amount,
        source: source.trim(),
        ledgerFee: Math.round(split.ledgerTithe),
        communityNet: split.netHallRevenue,
        payrollDeducted: split.payrollDeducted,
        netAfterPayroll: split.netHallRevenue,
        businessSource: businessSource || undefined,
      },
    });

    // Create dividend distribution
    const distribution = await tx.dividendDistribution.create({
      data: {
        poolId: hall.poolId,
        revenueLogId: revenueLog.id,
        totalAmount: split.netHallRevenue,
        totalOwners: ownerEntries.length,
      },
    });

    // Create dividend entries
    await Promise.all(
      ownerEntries.map((e) =>
        tx.dividendEntry.create({
          data: {
            distributionId: distribution.id,
            ownershipId: e.ownershipId,
            amount: e.amount,
          },
        })
      )
    );

    // Update ownership accumulatedDividends
    for (const e of ownerEntries) {
      await tx.ownership.update({
        where: { id: e.ownershipId },
        data: {
          accumulatedDividends: { increment: Math.round(e.amount) },
        },
      });
    }

    // Update treasury
    await tx.hallTreasury.update({
      where: { hallId },
      data: {
        totalRevenue: { increment: amount },
        balance: { increment: split.netHallRevenue },
        monthlyRevenue: { increment: amount },
        payrollReserve: { increment: split.payrollDeducted },
      },
    });

    // Repay IHCP if applicable
    if (split.ihcpRepayment > 0 && hall.hallContributions.length > 0) {
      let remaining = split.ihcpRepayment;
      for (const contrib of hall.hallContributions) {
        if (remaining <= 0) break;
        const owed = Math.round(contrib.amount * 1.05) - contrib.repaidAmount;
        const pay = Math.min(owed, remaining);
        if (pay > 0) {
          await tx.hallContribution.update({
            where: { id: contrib.id },
            data: { repaidAmount: { increment: pay } },
          });
          remaining -= pay;
        }
      }
    }

    const totalClaimed = ownerEntries.reduce((s, c) => s + c.amount, 0);
    const remainder = Math.round((split.netHallRevenue - totalClaimed) * ROUNDING_PRECISION) / ROUNDING_PRECISION;

    return {
      revenueLogId: revenueLog.id,
      hallId,
      grossAmount: amount,
      ledgerTithe: split.ledgerTithe,
      ihcpRepayment: split.ihcpRepayment,
      payrollDeducted: split.payrollDeducted,
      cogs: split.cogs,
      netHallRevenue: split.netHallRevenue,
      ownerEntries,
      totalDistributed: totalClaimed + (remainder > 0 ? remainder : 0),
      remainder,
      distributionId: distribution.id,
    };
  });

  await prisma.auditEntry.create({
    data: {
      type: "revenue_ingested_v4",
      description: `Revenue $${amount.toFixed(2)} ingested to Hall ${hallId}. Tithe: $${split.ledgerTithe.toFixed(2)}, IHCP: $${split.ihcpRepayment.toFixed(2)}, Payroll: $${split.payrollDeducted.toFixed(2)}, COGS: $${split.cogs.toFixed(2)}, Net: $${split.netHallRevenue.toFixed(2)}. ${ownerEntries.length} entries.`,
      amount,
      txHash: `REVENUE-V4-${result.revenueLogId}-${Date.now()}`,
      poolId: hall.poolId || undefined,
    },
  });

  return { success: true, distribution: result };
}

/* ============================================================
   DISTRIBUTION TRIGGER (Auto-claim all entries)
   ============================================================ */

export async function distributeDividend(
  distributionId: string
): Promise<{ success: boolean; totalAmount?: number; claimedCount?: number; error?: string }> {
  const distribution = await prisma.dividendDistribution.findUnique({
    where: { id: distributionId },
    include: {
      entries: {
        where: { claimed: false },
        include: {
          ownership: {
            select: { userId: true, ledgerId: true, totalReturned: true },
          },
        },
      },
      revenueLog: { select: { poolId: true } },
    },
  });

  if (!distribution) {
    return { success: false, error: "Distribution not found" };
  }

  if (distribution.entries.length === 0) {
    return { success: true, totalAmount: 0, claimedCount: 0 };
  }

  let totalAmount = 0;

  await prisma.$transaction(async (tx) => {
    for (const entry of distribution.entries) {
      const amount = Number(entry.amount);
      totalAmount += amount;

      await tx.dividendEntry.update({
        where: { id: entry.id },
        data: { claimed: true, claimedAt: new Date() },
      });

      await tx.ownership.update({
        where: { id: entry.ownershipId },
        data: { totalReturned: { increment: amount } },
      });

      if (entry.ownership.ledgerId) {
        await tx.wallet.update({
          where: { ledgerId: entry.ownership.ledgerId },
          data: { balance: { increment: amount } },
        });
      }
    }

    if (distribution.revenueLogId) {
      await tx.revenueLog.update({
        where: { id: distribution.revenueLogId },
        data: { distributed: true },
      });
    }
  });

  return { success: true, totalAmount, claimedCount: distribution.entries.length };
}

/* ============================================================
   QUERIES
   ============================================================ */

export async function getUnclaimedByUser(
  userId: string,
  hallId?: string
): Promise<Array<{
  entryId: string;
  distributionId: string;
  hallId: string;
  hallName: string;
  amount: number;
  revenueSource: string;
  createdAt: Date;
}>> {
  const entries = await prisma.dividendEntry.findMany({
    where: {
      claimed: false,
      ownership: { userId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      distribution: {
        include: {
          revenueLog: { select: { source: true, poolId: true } },
        },
      },
      ownership: {
        include: {
          hall: { select: { id: true, name: true } },
        },
      },
    },
  });

  return entries
    .filter((e) => !hallId || e.ownership.hall?.id === hallId)
    .map((e) => ({
      entryId: e.id,
      distributionId: e.distributionId,
      hallId: e.ownership.hall?.id || "",
      hallName: e.ownership.hall?.name || "",
      amount: Number(e.amount),
      revenueSource: e.distribution.revenueLog?.source || "",
      createdAt: e.createdAt,
    }));
}

export async function getDistributionQueue(hallId?: string): Promise<Array<{
  revenueLogId: string;
  hallId: string;
  hallName: string;
  amount: number;
  ledgerTithe: number;
  payrollDeducted: number;
  netAfterPayroll: number;
  source: string;
  createdAt: Date;
  pendingEntries: number;
}>> {
  const logs = await prisma.revenueLog.findMany({
    where: { distributed: false },
    orderBy: { createdAt: "asc" },
    include: {
      pool: {
        include: {
          hall: { select: { id: true, name: true } },
        },
      },
      _count: { select: { dividendDistributions: true } },
    },
  });

  return logs
    .filter((l) => !hallId || l.pool?.hall?.id === hallId)
    .map((l) => ({
      revenueLogId: l.id,
      hallId: l.pool?.hall?.id || "",
      hallName: l.pool?.hall?.name || "",
      amount: Number(l.amount),
      ledgerTithe: Number(l.ledgerFee),
      payrollDeducted: Number(l.payrollDeducted),
      netAfterPayroll: Number(l.netAfterPayroll),
      source: l.source,
      createdAt: l.createdAt,
      pendingEntries: l._count.dividendDistributions,
    }));
}

/* ============================================================
   ROI CALCULATION
   ============================================================ */

export async function calculateRoi(
  userId: string,
  hallId: string
): Promise<{ success: boolean; roi?: RoiResult; error?: string }> {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId },
    include: {
      hall: {
        include: {
          pool: { select: { assetValue: true, createdAt: true } },
        },
      },
    },
  });

  if (!ownership) {
    return { success: false, error: "Ownership not found" };
  }

  const invested = Number(ownership.hall.pool?.assetValue || 0) * (Number(ownership.ownershipPercent) / 100);
  const returned = Number(ownership.totalReturned) + Number(ownership.accumulatedDividends);
  const netProfit = returned - invested;

  const poolCreatedAt = ownership.hall.pool?.createdAt;
  const daysHeld = poolCreatedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(poolCreatedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const roiPct = invested > 0 ? (netProfit / invested) * 100 : 0;
  const annualizedPct = daysHeld > 0 ? roiPct * (365 / daysHeld) : null;

  return {
    success: true,
    roi: {
      totalInvested: Number(invested.toFixed(2)),
      totalReturned: Number(returned.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      roiPct: Number(roiPct.toFixed(2)),
      annualizedPct: annualizedPct ? Number(annualizedPct.toFixed(2)) : null,
      daysHeld,
    },
  };
}

export async function calculateAggregateRoi(userId: string): Promise<RoiResult> {
  const ownerships = await prisma.ownership.findMany({
    where: { userId, status: "active" },
    include: {
      hall: {
        include: {
          pool: { select: { assetValue: true, createdAt: true } },
        },
      },
    },
  });

  let totalInvested = 0;
  let totalReturned = 0;
  let earliestDate: Date | null = null;

  for (const o of ownerships) {
    const invested = Number(o.hall.pool?.assetValue || 0) * (Number(o.ownershipPercent) / 100);
    totalInvested += invested;
    totalReturned += Number(o.totalReturned) + Number(o.accumulatedDividends);

    if (o.hall.pool?.createdAt) {
      const d = new Date(o.hall.pool.createdAt);
      if (!earliestDate || d < earliestDate) earliestDate = d;
    }
  }

  const daysHeld = earliestDate
    ? Math.max(1, Math.floor((Date.now() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const netProfit = totalReturned - totalInvested;
  const roiPct = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
  const annualizedPct = daysHeld > 0 ? roiPct * (365 / daysHeld) : null;

  return {
    totalInvested: Number(totalInvested.toFixed(2)),
    totalReturned: Number(totalReturned.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    roiPct: Number(roiPct.toFixed(2)),
    annualizedPct: annualizedPct ? Number(annualizedPct.toFixed(2)) : null,
    daysHeld,
  };
}