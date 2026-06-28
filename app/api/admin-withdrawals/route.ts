/* ============================================================
   /api/admin/withdrawals/route.ts
   Treasury Gate — Admin approval/rejection of withdrawal requests
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {  requireAdmin } from "@/lib/auth";

const prisma = new PrismaClient();

type WithdrawalStatus = "pending" | "processing" | "completed" | "rejected";

/* ============================================================
   GET /api/admin/withdrawals
   List all withdrawal requests with optional filtering
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") as WithdrawalStatus | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    /* ── Build where clause ── */
    const where: any = {
      type: "withdrawal",
    };
    if (statusFilter) {
      where.status = statusFilter;
    }

    /* ── Fetch withdrawals ── */
    const withdrawals = await prisma.walletTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            vinculumId: true,
            displayName: true,
            email: true,
            kycTier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }).catch(async () => {
      // Fallback: try Transaction table
      return prisma.transaction.findMany({
        where: {
          ...where,
          direction: "outbound",
        },
        include: {
          user: {
            select: {
              id: true,
              vinculumId: true,
              displayName: true,
              email: true,
              kycTier: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    });

    /* ── Map to expected shape ── */
    const mapped = withdrawals.map((w: any) => ({
      id: w.id,
      userId: w.userId,
      displayName: w.user?.displayName || "Unknown",
      vinculumId: w.user?.vinculumId || "—",
      email: w.user?.email || "—",
      kycTier: w.user?.kycTier || "visitor",
      amount: Number(w.amount) || 0,
      currency: w.currency || "USD",
      destinationType: w.destinationType || w.metadata?.destinationType || "bank",
      destination: w.destination || w.metadata?.destination || "—",
      destinationAccount: w.destinationAccount || w.metadata?.accountNumber || "—",
      status: (w.status as WithdrawalStatus) || "pending",
      requestedAt: w.createdAt?.toISOString() || new Date().toISOString(),
      processedAt: w.processedAt?.toISOString() || w.updatedAt?.toISOString() || null,
      processedBy: w.processedBy || null,
      rejectionReason: w.rejectionReason || null,
      notes: w.notes || null,
      metadata: w.metadata || {},
    }));

    /* ── Stats ── */
    const allWithdrawals = await prisma.walletTransaction.findMany({
      where: { type: "withdrawal" },
      select: { status: true, amount: true },
    }).catch(async () => {
      return prisma.transaction.findMany({
        where: { direction: "outbound" },
        select: { status: true, amount: true },
      });
    });

    const stats = {
      total: allWithdrawals.length,
      pending: allWithdrawals.filter((w: any) => w.status === "pending").length,
      processing: allWithdrawals.filter((w: any) => w.status === "processing").length,
      completed: allWithdrawals.filter((w: any) => w.status === "completed").length,
      rejected: allWithdrawals.filter((w: any) => w.status === "rejected").length,
      pendingAmount: allWithdrawals
        .filter((w: any) => w.status === "pending")
        .reduce((s: number, w: any) => s + Number(w.amount), 0),
      totalAmount: allWithdrawals.reduce((s: number, w: any) => s + Number(w.amount), 0),
    };

    /* ── Audit ── */
    await prisma.auditLog.create({
      data: {
        action: "admin_withdrawals_viewed",
        userId: admin.id,
        details: JSON.stringify({ filter: statusFilter, count: mapped.length }),
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      withdrawals: mapped,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: mapped.length === limit,
      },
    });
  } catch (err: any) {
    console.error("[API/admin/withdrawals GET]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH /api/admin/withdrawals
   Approve or reject a withdrawal request
   ============================================================ */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { withdrawalId, status, rejectionReason } = body;

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { success: false, error: "withdrawalId and status required" },
        { status: 400 }
      );
    }

    if (!["completed", "rejected", "processing"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Use: processing, completed, rejected" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: "rejectionReason required when rejecting" },
        { status: 400 }
      );
    }

    /* ── Find the withdrawal ── */
    let withdrawal = await prisma.walletTransaction.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            vinculumId: true,
            displayName: true,
            email: true,
            vinBalance: true,
            creditPool: true,
          },
        },
      },
    }).catch(() => null);

    // Fallback to Transaction table
    if (!withdrawal) {
      withdrawal = await prisma.transaction.findUnique({
        where: { id: withdrawalId },
        include: {
          user: {
            select: {
              id: true,
              vinculumId: true,
              displayName: true,
              email: true,
              vinBalance: true,
              creditPool: true,
            },
          },
        },
      }).catch(() => null);
    }

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "pending" && withdrawal.status !== "processing") {
      return NextResponse.json(
        { success: false, error: `Cannot modify withdrawal with status: ${withdrawal.status}` },
        { status: 400 }
      );
    }

    /* ── If rejecting, return funds to user's credit pool ── */
    if (status === "rejected") {
      const amount = Number(withdrawal.amount) || 0;
      const currentCredit = Number(withdrawal.user?.creditPool) || 0;

      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          creditPool: currentCredit + amount,
        },
      });

      // Also restore vinBalance if it was deducted
      const currentVin = Number(withdrawal.user?.vinBalance) || 0;
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          vinBalance: currentVin + amount,
        },
      });
    }

    /* ── Update withdrawal status ── */
    const updateData: any = {
      status,
      processedAt: new Date(),
      processedBy: admin.id,
      updatedAt: new Date(),
    };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    let updated;
    try {
      updated = await prisma.walletTransaction.update({
        where: { id: withdrawalId },
        data: updateData,
      });
    } catch {
      updated = await prisma.transaction.update({
        where: { id: withdrawalId },
        data: updateData,
      });
    }

    /* ── Audit log ── */
    await prisma.auditLog.create({
      data: {
        action: `withdrawal_${status}`,
        userId: admin.id,
        targetUserId: withdrawal.userId,
        details: JSON.stringify({
          withdrawalId,
          amount: Number(withdrawal.amount),
          status,
          rejectionReason: rejectionReason || null,
          previousStatus: withdrawal.status,
        }),
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: updated.id,
        status,
        processedAt: new Date().toISOString(),
        processedBy: admin.id,
        rejectionReason: rejectionReason || null,
        user: {
          displayName: withdrawal.user?.displayName || "Unknown",
          vinculumId: withdrawal.user?.vinculumId || "—",
        },
      },
      message: `Withdrawal ${withdrawalId} marked as ${status}`,
    });
  } catch (err: any) {
    console.error("[API/admin/withdrawals PATCH]", err);
    return NextResponse.json(
      { success: false, error: "Action failed: " + err.message },
      { status: 500 }
    );
  }
}