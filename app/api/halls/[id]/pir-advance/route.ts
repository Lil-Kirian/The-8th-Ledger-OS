import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHallAccess, requireAdmin } from "@/lib/auth";
import {
  getPirStatus,
  getActivePirAdvances,
  calculatePirAdvanceTerms,
  requestPirAdvance,
} from "@/lib/pir";

/* ============================================================
   GET /api/halls/[id]/pir-advance
   Get PIR advance status for a hall.
   ============================================================ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: hallId } = await params;

    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const access = await requireHallAccess(request, hallId);
    if (!access.success) {
      return NextResponse.json(
        { error: "Hall access denied" },
        { status: 403 },
      );
    }

    const [status, advances] = await Promise.all([
      getPirStatus(hallId),
      getActivePirAdvances(hallId),
    ]);

    // Get hall context
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: {
        name: true,
        sriScore: true,
        ahgiScore: true,
        pirDebt: true,
        payrollReserve: true,
      },
    });

    return NextResponse.json({
      hall: hall || null,
      pirStatus: status,
      activeAdvances: advances,
      canRequest: status.sanctuaryAvailable > 0 && (hall?.sriScore || 0) >= 40,
    });
  } catch (error) {
    console.error("[PIR ADVANCE GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch PIR status" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/halls/[id]/pir-advance
   Request a new PIR advance.
   Body: { amount, reason, repaymentRate?, isAdminOverride? }
   ============================================================ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: hallId } = await params;

    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { amount, reason, repaymentRate, isAdminOverride = false } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount required" },
        { status: 400 },
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    // Check if user is admin for override
    let adminOverride = false;
    if (isAdminOverride) {
      const adminCheck = await requireAdmin(request);
      if (!adminCheck.success) {
        return NextResponse.json(
          { error: "Admin override denied" },
          { status: 403 },
        );
      }
      adminOverride = true;
    } else {
      // Non-admin must have hall access
      const access = await requireHallAccess(request, hallId);
      if (!access.success) {
        return NextResponse.json(
          { error: "Hall access denied" },
          { status: 403 },
        );
      }
    }

    // Get user's estimated monthly dividend for terms preview
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: auth.userId, status: "active" },
      select: { ownershipPercent: true, accumulatedDividends: true },
    });

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        hallTreasury: { select: { monthlyRevenue: true } },
      },
    });

    const monthlyEstimate =
      ownership && hall?.hallTreasury?.monthlyRevenue
        ? Math.floor(
            (hall.hallTreasury.monthlyRevenue *
              0.8 *
              Number(ownership.ownershipPercent)) /
              100,
          )
        : 0;

    const rate = repaymentRate || 0.05;
    const terms = calculatePirAdvanceTerms(
      amount,
      monthlyEstimate,
      rate,
      adminOverride,
    );

    // Execute request
    const result = await requestPirAdvance({
      hallId,
      amount,
      reason: reason.trim(),
      repaymentRate: rate,
      requestedBy: auth.ledgerId || auth.userId,
      isAdminOverride: adminOverride,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      advance: result.advance,
      terms,
      monthlyEstimate,
      message: adminOverride
        ? "Sanctuary override executed."
        : "PIR advance requested. Awaiting hall vote.",
    });
  } catch (error) {
    console.error("[PIR ADVANCE POST]", error);
    return NextResponse.json(
      { error: "Failed to request PIR advance", detail: String(error) },
      { status: 500 },
    );
  }
}

/* ============================================================
   PATCH /api/halls/[id]/pir-advance
   Accept terms for an existing advance (hall vote confirmation).
   Body: { advanceId, accept: boolean }
   ============================================================ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: hallId } = await params;

    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const access = await requireHallAccess(request, hallId);
    if (!access.success) {
      return NextResponse.json(
        { error: "Hall access denied" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { advanceId, accept = true } = body;

    if (!advanceId) {
      return NextResponse.json(
        { error: "advanceId required" },
        { status: 400 },
      );
    }

    const advance = await prisma.pirAdvance.findUnique({
      where: { id: advanceId },
      include: { hall: true },
    });

    if (!advance || advance.hallId !== hallId) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    if (advance.status !== "active") {
      return NextResponse.json(
        { error: `Advance is ${advance.status}` },
        { status: 400 },
      );
    }

    // Record acceptance vote
    // In a real system, you'd track individual votes. Here we log it.
    await prisma.auditEntry.create({
      data: {
        type: "pir_advance_accepted",
        description: `User ${auth.ledgerId || auth.userId} ${accept ? "accepted" : "declined"} PIR advance terms. Advance: ${advanceId}. Hall: ${hallId}`,
        txHash: `PIR-ACCEPT-${advanceId}-${Date.now()}`,
      },
    });

    if (!accept) {
      return NextResponse.json({
        success: true,
        message:
          "Terms declined. Advance remains active but may be challenged.",
      });
    }

    return NextResponse.json({
      success: true,
      advance: {
        id: advance.id,
        amount: advance.amount,
        reason: advance.reason,
        repaymentRate: advance.repaymentRate,
        repaidAmount: advance.repaidAmount,
        remainingDebt: advance.amount - advance.repaidAmount,
        status: advance.status,
      },
      message: "Terms accepted. Repayment will begin next dividend cycle.",
    });
  } catch (error) {
    console.error("[PIR ADVANCE PATCH]", error);
    return NextResponse.json(
      { error: "Failed to process acceptance", detail: String(error) },
      { status: 500 },
    );
  }
}
