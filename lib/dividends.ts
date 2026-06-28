import { prisma } from "./prisma";
import {
  getAssetTypeById,
  getAssetTypePayrollReservePercent,
  getAssetTypeTitheRate,
} from "./asset-types";

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

const ROUNDING_PRECISION = 100;

export function calculateRevenueSplitV4(
  gross: number,
  assetTypeId: string,
  ihcpDebt = 0,
  _workerCount = 0,
  customPayroll?: number,
): RevenueSplitV4 {
  const asset = getAssetTypeById(assetTypeId);
  const titheRate = getAssetTypeTitheRate(assetTypeId) / 100;
  const ledgerTithe = Math.round(gross * titheRate * ROUNDING_PRECISION) / ROUNDING_PRECISION;
  let remaining = gross - ledgerTithe;

  const ihcpRepayment =
    ihcpDebt > 0 ? Math.min(ihcpDebt, Math.round(remaining * 0.1 * ROUNDING_PRECISION) / ROUNDING_PRECISION) : 0;
  remaining -= ihcpRepayment;

  const payrollReserve =
    customPayroll ??
    (asset ? Math.round(gross * (getAssetTypePayrollReservePercent(assetTypeId) / 100) * ROUNDING_PRECISION) / ROUNDING_PRECISION : 0);
  const payrollDeducted = Math.min(payrollReserve, remaining);
  remaining -= payrollDeducted;

  let cogs = 0;
  if (asset?.hallClass === "III") {
    cogs = Math.min(Math.round(gross * 0.35 * ROUNDING_PRECISION) / ROUNDING_PRECISION, remaining);
    remaining -= cogs;
  }

  return {
    gross,
    ledgerTithe,
    ihcpRepayment,
    payrollDeducted,
    cogs,
    netHallRevenue: Math.max(0, Math.round(remaining * ROUNDING_PRECISION) / ROUNDING_PRECISION),
  };
}

export function distributeByOwnership(
  netPool: number,
  owners: Array<{ ownershipId: string; userId: string; ownershipPercent: number }>,
): Array<{ ownershipId: string; userId: string; amount: number; ownershipPercent: number }> {
  if (owners.length === 0) return [];
  if (netPool <= 0) return owners.map((owner) => ({ ...owner, amount: 0 }));

  const totalOwnership = owners.reduce((sum, owner) => sum + owner.ownershipPercent, 0);
  if (totalOwnership <= 0) return owners.map((owner) => ({ ...owner, amount: 0 }));

  let distributed = 0;
  const entries = owners.map((owner) => {
    const amount = Math.floor(((owner.ownershipPercent / totalOwnership) * netPool) * ROUNDING_PRECISION) / ROUNDING_PRECISION;
    distributed += amount;
    return { ...owner, amount };
  });

  const remainder = Math.round((netPool - distributed) * ROUNDING_PRECISION) / ROUNDING_PRECISION;
  if (remainder > 0) {
    const largest = entries.reduce((winner, entry) =>
      entry.ownershipPercent > winner.ownershipPercent ? entry : winner,
    );
    largest.amount = Math.round((largest.amount + remainder) * ROUNDING_PRECISION) / ROUNDING_PRECISION;
  }

  return entries;
}

export async function ingestRevenue(input: {
  hallId: string;
  amount: number;
  source: string;
  businessSource?: string;
  payrollDeducted?: number;
}): Promise<{ success: boolean; distribution?: DistributionResultV4; error?: string }> {
  if (input.amount <= 0) return { success: false, error: "Revenue amount must be positive" };

  const hall = await prisma.hall.findUnique({
    where: { id: input.hallId },
    include: {
      ownerships: {
        where: { status: "active" },
        select: { id: true, userId: true, ownershipPercent: true },
      },
      pool: { select: { assetType: true } },
      hallContributions: {
        where: { status: "active" },
        select: { amount: true, repaidAmount: true },
      },
    },
  });

  if (!hall) return { success: false, error: "Hall not found" };

  const ihcpDebt = hall.hallContributions.reduce((sum, contribution) => {
    const owed = Math.round(contribution.amount * 1.05);
    return sum + Math.max(0, owed - contribution.repaidAmount);
  }, 0);
  const split = calculateRevenueSplitV4(input.amount, hall.pool.assetType || "", ihcpDebt, 0, input.payrollDeducted);
  const ownerEntries = distributeByOwnership(
    split.netHallRevenue,
    hall.ownerships.map((ownership) => ({
      ownershipId: ownership.id,
      userId: ownership.userId,
      ownershipPercent: ownership.ownershipPercent,
    })),
  );

  const result = await prisma.$transaction(async (tx) => {
    const revenueLog = await tx.revenueLog.create({
      data: {
        poolId: hall.poolId,
        amount: Math.round(input.amount),
        source: input.source.trim(),
        ledgerFee: Math.round(split.ledgerTithe),
        communityNet: Math.round(split.netHallRevenue),
        payrollDeducted: Math.round(split.payrollDeducted),
        netAfterPayroll: Math.round(split.netHallRevenue),
        businessSource: input.businessSource || undefined,
      },
    });

    const distribution = await tx.dividendDistribution.create({
      data: {
        poolId: hall.poolId,
        revenueLogId: revenueLog.id,
        totalAmount: Math.round(split.netHallRevenue),
        totalOwners: ownerEntries.length,
        entries: {
          create: ownerEntries.map((entry) => ({
            ownershipId: entry.ownershipId,
            amount: Math.round(entry.amount),
          })),
        },
      },
    });

    for (const entry of ownerEntries) {
      await tx.ownership.update({
        where: { id: entry.ownershipId },
        data: { accumulatedDividends: { increment: Math.round(entry.amount) } },
      });
    }

    await tx.hallTreasury.upsert({
      where: { hallId: input.hallId },
      create: {
        hallId: input.hallId,
        balance: Math.round(split.netHallRevenue),
        totalRevenue: Math.round(input.amount),
        monthlyRevenue: Math.round(input.amount),
        payrollReserve: Math.round(split.payrollDeducted),
      },
      update: {
        balance: { increment: Math.round(split.netHallRevenue) },
        totalRevenue: { increment: Math.round(input.amount) },
        monthlyRevenue: { increment: Math.round(input.amount) },
        payrollReserve: { increment: Math.round(split.payrollDeducted) },
      },
    });

    const totalDistributed = ownerEntries.reduce((sum, entry) => sum + entry.amount, 0);
    return {
      revenueLogId: revenueLog.id,
      hallId: input.hallId,
      grossAmount: input.amount,
      ledgerTithe: split.ledgerTithe,
      ihcpRepayment: split.ihcpRepayment,
      payrollDeducted: split.payrollDeducted,
      cogs: split.cogs,
      netHallRevenue: split.netHallRevenue,
      ownerEntries,
      totalDistributed,
      remainder: Math.round((split.netHallRevenue - totalDistributed) * ROUNDING_PRECISION) / ROUNDING_PRECISION,
      distributionId: distribution.id,
    };
  });

  await prisma.auditEntry.create({
    data: {
      type: "revenue_ingested_v4",
      description: `Revenue ${input.amount} ingested to Hall ${input.hallId}. Net: ${split.netHallRevenue}.`,
      amount: Math.round(input.amount),
      txHash: `REVENUE-V4-${result.revenueLogId}-${Date.now()}`,
      poolId: hall.poolId,
    },
  });

  return { success: true, distribution: result };
}

export async function distributeDividend(
  distributionId: string,
): Promise<{ success: boolean; totalAmount?: number; claimedCount?: number; error?: string }> {
  const distribution = await prisma.dividendDistribution.findUnique({
    where: { id: distributionId },
    include: {
      entries: {
        where: { claimed: false },
        include: { ownership: { select: { id: true, ledgerId: true, totalReturned: true } } },
      },
    },
  });

  if (!distribution) return { success: false, error: "Distribution not found" };
  if (distribution.entries.length === 0) return { success: true, totalAmount: 0, claimedCount: 0 };

  let totalAmount = 0;
  await prisma.$transaction(async (tx) => {
    for (const entry of distribution.entries) {
      totalAmount += entry.amount;
      await tx.dividendEntry.update({
        where: { id: entry.id },
        data: { claimed: true, claimedAt: new Date() },
      });
      await tx.ownership.update({
        where: { id: entry.ownershipId },
        data: { totalReturned: { increment: entry.amount } },
      });
      if (entry.ownership.ledgerId) {
        await tx.wallet.update({
          where: { ledgerId: entry.ownership.ledgerId },
          data: { balance: { increment: entry.amount } },
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

export async function getUnclaimedByUser(userId: string, hallId?: string) {
  const entries = await prisma.dividendEntry.findMany({
    where: { claimed: false, ownership: { userId, ...(hallId ? { hallId } : {}) } },
    orderBy: { claimedAt: "desc" },
    include: {
      distribution: true,
      ownership: { include: { hall: { select: { id: true, name: true } } } },
    },
  });

  return entries.map((entry) => ({
    entryId: entry.id,
    distributionId: entry.distributionId,
    hallId: entry.ownership.hall?.id || "",
    hallName: entry.ownership.hall?.name || "",
    amount: entry.amount,
    revenueSource: entry.distribution.revenueLogId || "",
    createdAt: entry.distribution.distributedAt,
  }));
}

export async function getDistributionQueue(hallId?: string) {
  const logs = await prisma.revenueLog.findMany({
    where: { distributed: false },
    orderBy: { createdAt: "asc" },
    include: { pool: { include: { hall: { select: { id: true, name: true } } } } },
  });

  return logs
    .filter((log) => !hallId || log.pool.hall?.id === hallId)
    .map((log) => ({
      revenueLogId: log.id,
      hallId: log.pool.hall?.id || "",
      hallName: log.pool.hall?.name || "",
      amount: log.amount,
      ledgerTithe: log.ledgerFee,
      payrollDeducted: log.payrollDeducted,
      netAfterPayroll: log.netAfterPayroll,
      source: log.source,
      createdAt: log.createdAt,
      pendingEntries: 0,
    }));
}

export async function calculateRoi(userId: string, hallId: string): Promise<{ success: boolean; roi?: RoiResult; error?: string }> {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId },
    include: { hall: { include: { pool: { select: { assetValue: true, createdAt: true } } } } },
  });

  if (!ownership?.hall) return { success: false, error: "Ownership not found" };

  const invested = ownership.amountCommitted;
  const returned = ownership.totalReturned + ownership.accumulatedDividends;
  const netProfit = returned - invested;
  const daysHeld = Math.max(1, Math.floor((Date.now() - ownership.hall.pool.createdAt.getTime()) / 86_400_000));
  const roiPct = invested > 0 ? (netProfit / invested) * 100 : 0;
  const annualizedPct = daysHeld > 0 ? roiPct * (365 / daysHeld) : null;

  return {
    success: true,
    roi: {
      totalInvested: Number(invested.toFixed(2)),
      totalReturned: Number(returned.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      roiPct: Number(roiPct.toFixed(2)),
      annualizedPct: annualizedPct === null ? null : Number(annualizedPct.toFixed(2)),
      daysHeld,
    },
  };
}
