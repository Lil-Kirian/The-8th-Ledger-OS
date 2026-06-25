import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { createHmac, timingSafeEqual } from "crypto";
import { calculate8020Split, distributeByOwnership } from "./dividends";

/* ============================================================
   TYPES
   ============================================================ */
export interface RevenueEvent {
  hallId: number;
  amount: number;
  source: string;
  sourceType: "rental" | "sale" | "service" | "dividend" | "royalty" | "other";
  externalId?: string;
  metadata?: Record<string, unknown>;
  receivedAt: Date;
}

export interface IngestResult {
  success: boolean;
  revenueLogId?: number;
  communityShare: number;
  vinShare: number;
  claimCount: number;
  error?: string;
}

export interface BatchResult {
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{ event: RevenueEvent; result: IngestResult }>;
}

export interface MonthlyRevenue {
  month: string;
  gross: number;
  community: number;
  vin: number;
  entries: number;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const WEBHOOK_SECRET = process.env.REVENUE_WEBHOOK_SECRET || "";
const ALLOWED_SOURCES = ["rental", "sale", "service", "dividend", "royalty", "other"] as const;

/* ============================================================
   WEBHOOK SECURITY
   ============================================================ */

/**
 * Verify HMAC-SHA256 signature from revenue provider.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = WEBHOOK_SECRET
): boolean {
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);

  if (expectedBuf.length !== actualBuf.length) return false;

  try {
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Validate revenue event structure.
 */
export function validateRevenueEvent(event: RevenueEvent): { valid: boolean; error?: string } {
  if (!event.hallId || event.hallId <= 0) {
    return { valid: false, error: "Valid hallId required" };
  }
  if (!event.amount || event.amount <= 0) {
    return { valid: false, error: "Positive amount required" };
  }
  if (!event.source || event.source.trim().length === 0) {
    return { valid: false, error: "Source identifier required" };
  }
  if (!ALLOWED_SOURCES.includes(event.sourceType as typeof ALLOWED_SOURCES[number])) {
    return { valid: false, error: `Invalid sourceType. Allowed: ${ALLOWED_SOURCES.join(", ")}` };
  }
  return { valid: true };
}

/* ============================================================
   SINGLE EVENT INGESTION
   ============================================================ */

/**
 * Ingest a single revenue event.
 * 1. Validate
 * 2. Calculate 80/20 split
 * 3. Create RevenueLog
 * 4. Create DividendClaim per active owner
 * 5. Update HallTreasury
 */
export async function ingestRevenueEvent(event: RevenueEvent): Promise<IngestResult> {
  const validation = validateRevenueEvent(event);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const hall = await prisma.hall.findUnique({
    where: { id: event.hallId },
    include: {
      pool: { select: { id: true, poolId: true, name: true } },
      ownerships: {
        where: { status: "active" },
        select: {
          id: true,
          userId: true,
          ownershipPercent: true,
        },
      },
      hallTreasury: true,
    },
  });

  if (!hall) {
    return { success: false, error: "Hall not found" };
  }

  if (hall.status === "suspended" || hall.status === "forfeited" || hall.status === "reclaimed") {
    return { success: false, error: `Hall is ${hall.status}. Revenue blocked.` };
  }

  const split = calculate8020Split(event.amount);
  const ownerClaims = distributeByOwnership(
    split.community,
    hall.ownerships.map((o) => ({
      ownershipId: o.id,
      userId: o.userId,
      ownershipPercent: Number(o.ownershipPercent),
    }))
  );

  const result = await prisma.$transaction(async (tx) => {
    // Create revenue log
    const revenueLog = await tx.revenueLog.create({
      data: {
        hallId: event.hallId,
        amount: event.amount,
        source: event.source.trim(),
        sourceType: event.sourceType,
        communityNet: split.community,
        vinShare: split.vin,
        distributed: false,
        externalId: event.externalId || null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        receivedAt: event.receivedAt,
      },
    });

    // Create dividend claims
    const claims = await Promise.all(
      ownerClaims.map((c) =>
        tx.dividendClaim.create({
          data: {
            hallId: event.hallId,
            ownershipId: c.ownershipId,
            amount: c.amount,
            revenueLogId: revenueLog.id,
            claimed: false,
          },
        })
      )
    );

    // Update treasury
    await tx.hallTreasury.update({
      where: { hallId: event.hallId },
      data: {
        totalRevenue: { increment: event.amount },
      },
    });

    return {
      revenueLogId: revenueLog.id,
      communityShare: split.community,
      vinShare: split.vin,
      claimCount: claims.length,
    };
  });

  // Audit
  await prisma.auditEntry.create({
    data: {
      type: "revenue_ingested",
      description: `Revenue $${event.amount.toFixed(2)} from ${event.sourceType} (${event.source}) ingested to Hall ${hall.name}. Split: Community $${split.community.toFixed(2)}, VIN $${split.vin.toFixed(2)}. ${result.claimCount} claims queued.`,
      amount: event.amount,
      txHash: `REVENUE-${result.revenueLogId}-${Date.now()}`,
      poolId: hall.pool?.id,
    },
  });

  return {
    success: true,
    revenueLogId: result.revenueLogId,
    communityShare: result.communityShare,
    vinShare: result.vinShare,
    claimCount: result.claimCount,
  };
}

/* ============================================================
   BATCH INGESTION
   ============================================================ */

/**
 * Ingest multiple revenue events in a single transaction.
 * If any event fails, the entire batch rolls back (atomic).
 */
export async function ingestRevenueBatch(events: RevenueEvent[]): Promise<BatchResult> {
  const results: Array<{ event: RevenueEvent; result: IngestResult }> = [];
  let processed = 0;
  let failed = 0;

  // Validate all first
  for (const event of events) {
    const validation = validateRevenueEvent(event);
    if (!validation.valid) {
      results.push({ event, result: { success: false, error: validation.error } });
      failed++;
    }
  }

  if (failed > 0 && failed === events.length) {
    return { success: false, processed: 0, failed, results };
  }

  // Process valid events
  await prisma.$transaction(async (tx) => {
    for (const event of events) {
      const validation = validateRevenueEvent(event);
      if (!validation.valid) continue;

      const hall = await tx.hall.findUnique({
        where: { id: event.hallId },
        include: {
          ownerships: {
            where: { status: "active" },
            select: { id: true, userId: true, ownershipPercent: true },
          },
        },
      });

      if (!hall || hall.status === "suspended") {
        results.push({ event, result: { success: false, error: "Hall unavailable" } });
        failed++;
        continue;
      }

      const split = calculate8020Split(event.amount);
      const ownerClaims = distributeByOwnership(
        split.community,
        hall.ownerships.map((o) => ({
          ownershipId: o.id,
          userId: o.userId,
          ownershipPercent: Number(o.ownershipPercent),
        }))
      );

      const revenueLog = await tx.revenueLog.create({
        data: {
          hallId: event.hallId,
          amount: event.amount,
          source: event.source.trim(),
          sourceType: event.sourceType,
          communityNet: split.community,
          vinShare: split.vin,
          distributed: false,
          externalId: event.externalId || null,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          receivedAt: event.receivedAt,
        },
      });

      await Promise.all(
        ownerClaims.map((c) =>
          tx.dividendClaim.create({
            data: {
              hallId: event.hallId,
              ownershipId: c.ownershipId,
              amount: c.amount,
              revenueLogId: revenueLog.id,
              claimed: false,
            },
          })
        )
      );

      await tx.hallTreasury.update({
        where: { hallId: event.hallId },
        data: { totalRevenue: { increment: event.amount } },
      });

      results.push({
        event,
        result: {
          success: true,
          revenueLogId: revenueLog.id,
          communityShare: split.community,
          vinShare: split.vin,
          claimCount: ownerClaims.length,
        },
      });
      processed++;
    }
  });

  return { success: failed === 0, processed, failed, results };
}

/* ============================================================
   DISTRIBUTION
   ============================================================ */

/**
 * Manually distribute a pending revenue log.
 * Creates claims if they don't exist, marks log as distributed.
 */
export async function distributeRevenueLog(revenueLogId: number): Promise<IngestResult> {
  const log = await prisma.revenueLog.findUnique({
    where: { id: revenueLogId },
    include: {
      hall: {
        include: {
          ownerships: {
            where: { status: "active" },
            select: { id: true, userId: true, ownershipPercent: true },
          },
        },
      },
      dividendClaims: true,
    },
  });

  if (!log) {
    return { success: false, error: "Revenue log not found" };
  }

  if (log.distributed) {
    return { success: false, error: "Already distributed" };
  }

  // If claims already exist, just mark distributed
  if (log.dividendClaims.length > 0) {
    await prisma.revenueLog.update({
      where: { id: revenueLogId },
      data: { distributed: true, distributedAt: new Date() },
    });
    return {
      success: true,
      revenueLogId: log.id,
      communityShare: Number(log.communityNet),
      vinShare: Number(log.vinShare),
      claimCount: log.dividendClaims.length,
    };
  }

  // Create claims now
  const split = calculate8020Split(Number(log.amount));
  const ownerClaims = distributeByOwnership(
    split.community,
    log.hall.ownerships.map((o) => ({
      ownershipId: o.id,
      userId: o.userId,
      ownershipPercent: Number(o.ownershipPercent),
    }))
  );

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      ownerClaims.map((c) =>
        tx.dividendClaim.create({
          data: {
            hallId: log.hallId,
            ownershipId: c.ownershipId,
            amount: c.amount,
            revenueLogId: log.id,
            claimed: false,
          },
        })
      )
    );

    await tx.revenueLog.update({
      where: { id: revenueLogId },
      data: { distributed: true, distributedAt: new Date() },
    });
  });

  return {
    success: true,
    revenueLogId: log.id,
    communityShare: split.community,
    vinShare: split.vin,
    claimCount: ownerClaims.length,
  };
}

/* ============================================================
   ANALYTICS
   ============================================================ */

/**
 * Get revenue aggregated by source type.
 */
export async function getRevenueSources(
  hallId?: number,
  from?: Date,
  to?: Date
): Promise<Array<{ sourceType: string; total: number; count: number }>> {
  const where: Prisma.RevenueLogWhereInput = {};
  if (hallId) where.hallId = hallId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const logs = await prisma.revenueLog.groupBy({
    by: ["sourceType"],
    where,
    _sum: { amount: true },
    _count: true,
  });

  return logs.map((l) => ({
    sourceType: l.sourceType,
    total: Number(l._sum.amount || 0),
    count: l._count,
  }));
}

/**
 * Get monthly revenue rollup.
 */
export async function getMonthlyRevenue(
  hallId?: number,
  months: number = 12
): Promise<MonthlyRevenue[]> {
  const since = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
  const where: Prisma.RevenueLogWhereInput = { createdAt: { gte: since } };
  if (hallId) where.hallId = hallId;

  const logs = await prisma.revenueLog.findMany({
    where,
    select: { amount: true, communityNet: true, vinShare: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, MonthlyRevenue>();

  for (const log of logs) {
    const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key);

    if (existing) {
      existing.gross += Number(log.amount);
      existing.community += Number(log.communityNet);
      existing.vin += Number(log.vinShare);
      existing.entries += 1;
    } else {
      map.set(key, {
        month: key,
        gross: Number(log.amount),
        community: Number(log.communityNet),
        vin: Number(log.vinShare),
        entries: 1,
      });
    }
  }

  return Array.from(map.values()).reverse();
}

/**
 * Get revenue velocity (trending up/down).
 */
export async function getRevenueVelocity(hallId: number): Promise<{
  currentMonth: number;
  previousMonth: number;
  changePct: number;
  trend: "up" | "down" | "flat";
}> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [current, previous] = await Promise.all([
    prisma.revenueLog.aggregate({
      where: { hallId, createdAt: { gte: currentMonthStart } },
      _sum: { amount: true },
    }),
    prisma.revenueLog.aggregate({
      where: {
        hallId,
        createdAt: { gte: previousMonthStart, lt: currentMonthStart },
      },
      _sum: { amount: true },
    }),
  ]);

  const currentTotal = Number(current._sum.amount || 0);
  const previousTotal = Number(previous._sum.amount || 0);

  let changePct = 0;
  if (previousTotal > 0) {
    changePct = ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  const trend = changePct > 5 ? "up" : changePct < -5 ? "down" : "flat";

  return {
    currentMonth: currentTotal,
    previousMonth: previousTotal,
    changePct: Number(changePct.toFixed(2)),
    trend,
  };
}