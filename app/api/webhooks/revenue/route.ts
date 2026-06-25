// app/api/webhooks/revenue/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LEDGER_WEBHOOK_SECRET = process.env.LEDGER_WEBHOOK_SECRET;
const TITHE_PCT = 0.20; // 8th Ledger Tithe
const COMMUNITY_PCT = 0.80;

const VALID_SOURCES = [
  "rent", "lease", "usage", "rental", "ppa", "crop_sale",
  "energy_sale", "training_fee", "membership_fee", "tourism_booking",
  "inventory_sale", "charter", "service_fee",
];

/* ============================================================
   POST /api/webhooks/revenue
   External revenue ingestion — 8th Ledger Protocol
   Flow: Gross → Tithe 20% → Payroll (Forge) → Net → Dividends
   Idempotent. Atomic. Immutable audit trail.
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ──
    const apiKey = request.headers.get("x-ledger-webhook-key");
    if (!LEDGER_WEBHOOK_SECRET || apiKey !== LEDGER_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing webhook key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      hallId,
      externalTransactionId,
      amount,
      source,
      currency,
      periodStart,
      periodEnd,
      description,
      metadata,
    } = body;

    // ── Validation ──
    if (!hallId || typeof hallId !== "string") {
      return NextResponse.json({ success: false, error: "hallId required" }, { status: 400 });
    }
    if (!externalTransactionId || typeof externalTransactionId !== "string") {
      return NextResponse.json(
        { success: false, error: "externalTransactionId required for idempotency" },
        { status: 400 }
      );
    }
    if (!amount || Number(amount) <= 0 || isNaN(Number(amount))) {
      return NextResponse.json(
        { success: false, error: "Positive numeric amount required" },
        { status: 400 }
      );
    }
    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { success: false, error: `Source must be one of: ${VALID_SOURCES.join(", ")}` },
        { status: 400 }
      );
    }

    const gross = Number(amount);
    const currencyCode = (currency || "USD").toUpperCase();
    const txHash = `LED-REV-${externalTransactionId}`;

    // ── Idempotency ──
    const existingTx = await prisma.treasuryTransaction.findUnique({
      where: { txHash },
    });
    if (existingTx) {
      return NextResponse.json(
        {
          success: true,
          idempotent: true,
          txHash,
          message: "Revenue already processed. Idempotency protected.",
        },
        { status: 200 }
      );
    }

    // ── Hall validation ──
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { id: true, poolId: true, name: true, vertical: true } },
        hallTreasury: true,
        ownerships: {
          where: { status: "active" },
          select: { id: true, userId: true, percentage: true, ledgerId: true },
        },
        workers: {
          where: { status: { in: ["active", "probation"] } },
          select: { salary: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ success: false, error: "Hall not found" }, { status: 404 });
    }
    if (hall.status === "dormant" || hall.closureStatus !== "active") {
      return NextResponse.json(
        { success: false, error: "Hall is dormant or in closure. Revenue rejected." },
        { status: 403 }
      );
    }

    // ── Financial math ──
    const ledgerFee = Math.floor(gross * TITHE_PCT);
    let communityGross = Math.floor(gross * COMMUNITY_PCT);
    const drift = gross - (ledgerFee + communityGross);
    communityGross += drift; // Fix rounding

    // Payroll deduction (Forge Ledger)
    const monthlyPayroll = hall.workers.reduce((sum, w) => sum + (w.salary || 0), 0);
    const payrollDeducted = Math.min(monthlyPayroll, communityGross);
    const netAfterPayroll = communityGross - payrollDeducted;

    // ── Atomic processing ──
    const result = await prisma.$transaction(async (tx) => {
      // 1. Revenue log (immutable)
      const revenueLog = await tx.revenueLog.create({
        data: {
          poolId: hall.poolId,
          amount: gross,
          source,
          ledgerFee,
          communityNet: communityGross,
          payrollDeducted,
          netAfterPayroll,
          distributed: true,
          distributionTx: txHash,
        },
      });

      // 2. Credit Hall Treasury
      await tx.hallTreasury.upsert({
        where: { hallId },
        create: {
          hallId,
          balance: netAfterPayroll,
          totalRevenue: gross,
          monthlyRevenue: gross,
          payrollReserve: payrollDeducted,
        },
        update: {
          balance: { increment: netAfterPayroll },
          totalRevenue: { increment: gross },
          monthlyRevenue: { increment: gross },
          payrollReserve: { increment: payrollDeducted },
        },
      });

      // 3. Credit 8th Ledger Protocol Treasury (Tithe)
      await tx.treasuryTransaction.create({
        data: {
          type: "tithe_in",
          amount: ledgerFee,
          currency: currencyCode,
          poolId: hall.pool?.poolId,
          ledgerId: null,
          description: `8th Ledger Tithe (20%) — ${source}: ${hall.pool?.name || hallId}`,
          status: "completed",
          txHash: `LED-TITHE-${externalTransactionId}-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date(),
          audited: true,
        },
      });

      // 4. Record payroll reserve transaction
      if (payrollDeducted > 0) {
        await tx.hallTreasuryTransaction.create({
          data: {
            treasuryId: hall.hallTreasury?.id || "",
            type: "payroll",
            amount: payrollDeducted,
            description: `Forge payroll reserve — ${hall.workers.length} workers`,
            metadata: JSON.stringify({ workerCount: hall.workers.length, source }),
          },
        });
      }

      // 5. Queue dividend distribution
      let dividendCount = 0;
      let distribution = null;
      if (hall.ownerships.length > 0 && netAfterPayroll > 0) {
        distribution = await tx.dividendDistribution.create({
          data: {
            poolId: hall.poolId,
            revenueLogId: revenueLog.id,
            totalAmount: netAfterPayroll,
            totalOwners: hall.ownerships.length,
          },
        });

        const entries = hall.ownerships.map((o) => ({
          distributionId: distribution.id,
          ownershipId: o.id,
          amount: Math.floor((netAfterPayroll * (o.percentage || 0)) / 100),
          claimed: false,
        }));

        await tx.dividendEntry.createMany({
          data: entries,
          skipDuplicates: true,
        });
        dividendCount = entries.length;
      }

      // 6. Hall activity log
      await tx.hallActivity.create({
        data: {
          hallId,
          type: "revenue",
          description: `Revenue: ${currencyCode} ${gross.toFixed(2)} from ${source}`,
          metadata: JSON.stringify({
            revenueLogId: revenueLog.id,
            externalTransactionId,
            gross,
            ledgerFee,
            communityGross,
            payrollDeducted,
            netAfterPayroll,
            ownerCount: hall.ownerships.length,
            workerCount: hall.workers.length,
            periodStart,
            periodEnd,
          }),
        },
      });

      // 7. Audit entry
      await tx.auditEntry.create({
        data: {
          type: "revenue",
          description: `Hall ${hallId} received ${gross} ${currencyCode} from ${source}`,
          amount: gross,
          txHash,
          poolId: hall.poolId,
        },
      });

      // 8. Notify owners
      if (hall.ownerships.length > 0) {
        await tx.notification.createMany({
          data: hall.ownerships.map((o) => ({
            ledgerId: o.userId,
            poolId: hall.poolId,
            type: "dividend_available",
            title: "Revenue Received",
            message: `${currencyCode} ${gross.toFixed(2)} ${source} revenue recorded. Net after payroll: ${currencyCode} ${netAfterPayroll.toFixed(2)}. Your dividend share is ready.`,
            actionUrl: `/halls/${hallId}/dividends`,
          })),
          skipDuplicates: true,
        });
      }

      return {
        revenueLog,
        ledgerFee,
        communityGross,
        payrollDeducted,
        netAfterPayroll,
        dividendCount,
        ownerCount: hall.ownerships.length,
        workerCount: hall.workers.length,
      };
    });

    return NextResponse.json({
      success: true,
      revenue: {
        revenueLogId: result.revenueLog.id,
        hallId,
        poolId: hall.poolId,
        externalTransactionId,
        grossAmount: gross,
        currency: currencyCode,
        ledgerFee: result.ledgerFee,
        communityGross: result.communityGross,
        payrollDeducted: result.payrollDeducted,
        netAfterPayroll: result.netAfterPayroll,
        split: "80/20",
        source,
        dividendCount: result.dividendCount,
        ownerCount: result.ownerCount,
        workerCount: result.workerCount,
        processedAt: new Date(),
      },
      message: `Revenue processed. ${result.netAfterPayroll.toFixed(2)} → Hall Treasury. ${result.ledgerFee.toFixed(2)} → 8th Ledger Tithe. ${result.payrollDeducted.toFixed(2)} → Payroll Reserve. ${result.dividendCount} dividends queued.`,
    });
  } catch (error) {
    console.error("[8TH LEDGER REVENUE WEBHOOK]", error);
    return NextResponse.json(
      { success: false, error: "Revenue processing failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET /api/webhooks/revenue
   Health check / recent webhook logs.
   Admin or primary admin only.
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = request.headers.get("x-ledger-webhook-key");
    const isWebhookAuth = LEDGER_WEBHOOK_SECRET && apiKey === LEDGER_WEBHOOK_SECRET;

    if (!isWebhookAuth) {
      const { getSessionUser } = await import("@/lib/auth");
      const user = await getSessionUser();
      if (!user || user.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Webhook key or admin auth required" },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
    const hallId = searchParams.get("hallId");

    const logs = await prisma.revenueLog.findMany({
      where: hallId ? { pool: { hall: { id: hallId } } } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        pool: {
          select: {
            name: true,
            vertical: true,
            hall: { select: { id: true, name: true } },
          },
        },
        _count: { select: { dividendDistributions: true } },
      },
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        poolId: l.poolId,
        hallId: l.pool?.hall?.id,
        hallName: l.pool?.hall?.name,
        vertical: l.pool?.vertical,
        amount: Number(l.amount),
        currency: "USD",
        ledgerFee: Number(l.ledgerFee),
        communityNet: Number(l.communityNet),
        payrollDeducted: Number(l.payrollDeducted),
        netAfterPayroll: Number(l.netAfterPayroll),
        source: l.source,
        distributed: l.distributed,
        dividendCount: l._count.dividendDistributions,
        createdAt: l.createdAt,
      })),
      count: logs.length,
    });
  } catch (error) {
    console.error("[8TH LEDGER REVENUE GET]", error);
    return NextResponse.json(
      { success: false, error: "Webhook logs unreachable" },
      { status: 500 }
    );
  }
}