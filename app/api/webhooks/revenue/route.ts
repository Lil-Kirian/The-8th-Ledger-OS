import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestRevenue } from "@/lib/dividends";

const LEDGER_WEBHOOK_SECRET = process.env.LEDGER_WEBHOOK_SECRET;

const VALID_SOURCES = [
  "rent",
  "lease",
  "usage",
  "rental",
  "ppa",
  "crop_sale",
  "energy_sale",
  "training_fee",
  "membership_fee",
  "tourism_booking",
  "inventory_sale",
  "charter",
  "service_fee",
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = request.headers.get("x-ledger-webhook-key");
    if (!LEDGER_WEBHOOK_SECRET || apiKey !== LEDGER_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing webhook key" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      hallId,
      externalTransactionId,
      amount,
      source,
      currency = "USD",
      businessSource,
    } = body;

    if (!hallId || typeof hallId !== "string") {
      return NextResponse.json(
        { success: false, error: "hallId required" },
        { status: 400 },
      );
    }
    if (!externalTransactionId || typeof externalTransactionId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "externalTransactionId required for idempotency",
        },
        { status: 400 },
      );
    }
    if (!amount || Number(amount) <= 0 || Number.isNaN(Number(amount))) {
      return NextResponse.json(
        { success: false, error: "Positive numeric amount required" },
        { status: 400 },
      );
    }
    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        {
          success: false,
          error: `Source must be one of: ${VALID_SOURCES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const txHash = `LED-REV-${externalTransactionId}`;
    const existingTx = await prisma.treasuryTransaction.findUnique({
      where: { txHash },
    });
    if (existingTx) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        txHash,
        message: "Revenue already processed. Idempotency protected.",
      });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: {
        id: true,
        poolId: true,
        status: true,
        closureStatus: true,
        pool: { select: { poolId: true, name: true } },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }
    if (hall.status === "dormant" || hall.closureStatus !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Hall is dormant or in closure. Revenue rejected.",
        },
        { status: 403 },
      );
    }

    const gross = Number(amount);
    const distribution = await ingestRevenue({
      hallId,
      amount: gross,
      source,
      businessSource,
    });

    if (!distribution.success || !distribution.distribution) {
      return NextResponse.json(
        {
          success: false,
          error: distribution.error || "Revenue processing failed",
        },
        { status: 422 },
      );
    }

    await prisma.treasuryTransaction.create({
      data: {
        type: "revenue_webhook",
        amount: gross,
        currency: String(currency).toUpperCase(),
        poolId: hall.pool.poolId,
        description: `External revenue webhook ${externalTransactionId} for ${hall.pool.name}`,
        status: "completed",
        txHash,
        audited: true,
      },
    });

    return NextResponse.json({
      success: true,
      revenue: {
        revenueLogId: distribution.distribution.revenueLogId,
        hallId,
        poolId: hall.poolId,
        externalTransactionId,
        grossAmount: gross,
        currency: String(currency).toUpperCase(),
        ledgerFee: distribution.distribution.ledgerTithe,
        payrollDeducted: distribution.distribution.payrollDeducted,
        netAfterPayroll: distribution.distribution.netHallRevenue,
        source,
        dividendCount: distribution.distribution.ownerEntries.length,
        processedAt: new Date(),
      },
      message: "Revenue processed and dividends queued.",
    });
  } catch (error) {
    console.error("[8TH LEDGER REVENUE WEBHOOK]", error);
    return NextResponse.json(
      { success: false, error: "Revenue processing failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = request.headers.get("x-ledger-webhook-key");
    const isWebhookAuth =
      LEDGER_WEBHOOK_SECRET && apiKey === LEDGER_WEBHOOK_SECRET;

    if (!isWebhookAuth) {
      const { getSessionUser, isAdminRole } = await import("@/lib/auth");
      const user = await getSessionUser();
      if (!user || !isAdminRole(user.role)) {
        return NextResponse.json(
          { success: false, error: "Webhook key or admin auth required" },
          { status: 401 },
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
            verticalId: true,
            hall: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        poolId: log.poolId,
        hallId: log.pool.hall?.id,
        hallName: log.pool.hall?.name,
        vertical: log.pool.verticalId,
        amount: log.amount,
        currency: "USD",
        ledgerFee: log.ledgerFee,
        communityNet: log.communityNet,
        payrollDeducted: log.payrollDeducted,
        netAfterPayroll: log.netAfterPayroll,
        source: log.source,
        distributed: log.distributed,
        createdAt: log.createdAt,
      })),
      count: logs.length,
    });
  } catch (error) {
    console.error("[8TH LEDGER REVENUE GET]", error);
    return NextResponse.json(
      { success: false, error: "Webhook logs unreachable" },
      { status: 500 },
    );
  }
}
