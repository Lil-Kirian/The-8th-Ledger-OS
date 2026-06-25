import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   8TH LEDGER — WITHDRAWAL ADMIN API
   Sovereign treasury outflows: approval, rejection, oversight
   ============================================================ */

function handlePrismaError(error: unknown): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }
  }
  console.error("[ADMIN_WITHDRAWALS ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Withdrawal operation failed" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/admin/withdrawals — Primary admin withdrawal registry
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "modern"; // modern | legacy | all
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sort = searchParams.get("sort") || "createdAt";
    const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

    const orderBy: any = {};
    if (["createdAt", "amount", "processedAt"].includes(sort)) {
      orderBy[sort] = dir;
    } else {
      orderBy.createdAt = "desc";
    }

    let withdrawals: any[] = [];
    let total = 0;

    /* ── MODERN WITHDRAWALS (Wallet relation) ── */
    if (type === "modern" || type === "all") {
      const where: Prisma.WithdrawalWhereInput = {};
      if (status !== "all") where.status = status;
      if (search) {
        where.OR = [
          { ledgerId: { contains: search, mode: "insensitive" } },
          { destination: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
          { wallet: { user: { displayName: { contains: search, mode: "insensitive" } } } },
        ];
      }

      const [items, count] = await Promise.all([
        prisma.withdrawal.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            wallet: {
              select: {
                user: {
                  select: {
                    ledgerId: true,
                    displayName: true,
                    email: true,
                    kycTier: true,
                  },
                },
              },
            },
          },
        }),
        prisma.withdrawal.count({ where }),
      ]);

      const enriched = items.map((w) => ({
        id: w.id,
        type: "modern",
        ledgerId: w.ledgerId,
        user: w.wallet?.user,
        amount: w.amount,
        currency: w.currency,
        status: w.status,
        destination: w.destination,
        destinationType: w.destinationType,
        reference: w.reference,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        processedBy: w.processedBy,
        rejectionReason: w.rejectionReason,
      }));

      withdrawals = [...withdrawals, ...enriched];
      total += count;
    }

    /* ── LEGACY WITHDRAWAL REQUESTS ── */
    if (type === "legacy" || type === "all") {
      const where: Prisma.WithdrawalRequestWhereInput = {};
      if (status !== "all") where.status = status;
      if (search) {
        where.OR = [
          { ledgerId: { contains: search, mode: "insensitive" } },
          { destination: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
        ];
      }

      const [items, count] = await Promise.all([
        prisma.withdrawalRequest.findMany({
          where,
          orderBy: { requestedAt: dir },
          skip: type === "all" ? 0 : (page - 1) * limit,
          take: type === "all" ? limit : limit,
          include: {
            user: {
              select: {
                ledgerId: true,
                displayName: true,
                email: true,
                kycTier: true,
              },
            },
          },
        }),
        prisma.withdrawalRequest.count({ where }),
      ]);

      const enriched = items.map((w) => ({
        id: w.id,
        type: "legacy",
        ledgerId: w.ledgerId,
        user: w.user || { ledgerId: w.ledgerId, displayName: w.displayName, kycTier: null },
        amount: w.amount,
        currency: "USD",
        status: w.status,
        destination: w.destination,
        destinationType: w.destinationType,
        reference: null,
        createdAt: w.requestedAt,
        processedAt: w.processedAt,
        processedBy: w.processedBy,
        rejectionReason: w.rejectionReason,
      }));

      withdrawals = [...withdrawals, ...enriched];
      total += count;
    }

    // Sort combined if type=all
    if (type === "all") {
      withdrawals.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return dir === "asc" ? aTime - bTime : bTime - aTime;
      });
      // Re-apply pagination
      const start = (page - 1) * limit;
      withdrawals = withdrawals.slice(start, start + limit);
    }

    // Stats
    const [modernStats, legacyStats] = await Promise.all([
      prisma.withdrawal.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
      prisma.withdrawalRequest.groupBy({
        by: ["status"],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    const stats = {
      modern: Object.fromEntries(modernStats.map((s) => [s.status, { count: s._count, total: s._sum.amount }])),
      legacy: Object.fromEntries(legacyStats.map((s) => [s.status, { count: s._count, total: s._sum.amount }])),
      combinedPending: modernStats.filter((s) => s.status === "pending").reduce((sum, s) => sum + s._count, 0)
        + legacyStats.filter((s) => s.status === "pending").reduce((sum, s) => sum + s._count, 0),
    };

    return NextResponse.json({
      success: true,
      withdrawals,
      stats,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   PATCH /api/admin/withdrawals — Approve / Reject / Reprocess
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, id, type, reason } = body;

    if (!action || !id || !type) {
      return NextResponse.json(
        { success: false, error: "action, id, and type (modern|legacy) required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject", "reprocess"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action must be approve, reject, or reprocess" },
        { status: 400 }
      );
    }

    let result: any;
    let message = "";
    let amount = 0;
    let ledgerId = "";

    /* ===== MODERN WITHDRAWAL ===== */
    if (type === "modern") {
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id },
        include: {
          wallet: {
            select: {
              balance: true,
              user: {
                select: {
                  ledgerId: true,
                  displayName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!withdrawal) {
        return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 });
      }

      amount = withdrawal.amount;
      ledgerId = withdrawal.ledgerId;

      if (action === "approve") {
        if (withdrawal.status !== "pending") {
          return NextResponse.json(
            { success: false, error: `Withdrawal is already ${withdrawal.status}` },
            { status: 409 }
          );
        }

        // Verify wallet has sufficient balance
        if (withdrawal.wallet && withdrawal.wallet.balance < withdrawal.amount) {
          return NextResponse.json(
            { success: false, error: "Insufficient wallet balance. Cannot approve." },
            { status: 409 }
          );
        }

        result = await prisma.$transaction(async (tx) => {
          // Deduct from wallet
          if (withdrawal.wallet) {
            await tx.wallet.update({
              where: { id: withdrawal.walletId },
              data: { balance: { decrement: withdrawal.amount } },
            });
          }

          // Mark withdrawal completed
          const updated = await tx.withdrawal.update({
            where: { id },
            data: {
              status: "completed",
              processedAt: new Date(),
              processedBy: user.ledgerId,
            },
          });

          return updated;
        });

        message = `Withdrawal of $${amount} approved and processed for ${withdrawal.wallet?.user?.displayName || ledgerId}.`;
      }

      if (action === "reject") {
        if (withdrawal.status !== "pending") {
          return NextResponse.json(
            { success: false, error: `Withdrawal is already ${withdrawal.status}` },
            { status: 409 }
          );
        }

        result = await prisma.withdrawal.update({
          where: { id },
          data: {
            status: "rejected",
            processedAt: new Date(),
            processedBy: user.ledgerId,
            rejectionReason: reason || "Rejected by admin",
          },
        });

        message = `Withdrawal of $${amount} rejected for ${withdrawal.wallet?.user?.displayName || ledgerId}.`;
      }

      if (action === "reprocess") {
        if (withdrawal.status !== "rejected") {
          return NextResponse.json(
            { success: false, error: "Only rejected withdrawals can be reprocessed" },
            { status: 409 }
          );
        }

        result = await prisma.withdrawal.update({
          where: { id },
          data: {
            status: "pending",
            processedAt: null,
            processedBy: null,
            rejectionReason: null,
          },
        });

        message = `Withdrawal of $${amount} reprocessed to pending for ${withdrawal.wallet?.user?.displayName || ledgerId}.`;
      }
    }

    /* ===== LEGACY WITHDRAWAL REQUEST ===== */
    if (type === "legacy") {
      const req = await prisma.withdrawalRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              email: true,
            },
          },
        },
      });

      if (!req) {
        return NextResponse.json({ success: false, error: "Withdrawal request not found" }, { status: 404 });
      }

      amount = req.amount;
      ledgerId = req.ledgerId;

      if (action === "approve") {
        if (req.status !== "pending") {
          return NextResponse.json(
            { success: false, error: `Request is already ${req.status}` },
            { status: 409 }
          );
        }

        result = await prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status: "completed",
            processedAt: new Date(),
            processedBy: user.ledgerId,
          },
        });

        message = `Legacy withdrawal of $${amount} approved for ${req.user?.displayName || req.displayName || ledgerId}.`;
      }

      if (action === "reject") {
        if (req.status !== "pending") {
          return NextResponse.json(
            { success: false, error: `Request is already ${req.status}` },
            { status: 409 }
          );
        }

        result = await prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status: "rejected",
            processedAt: new Date(),
            processedBy: user.ledgerId,
            rejectionReason: reason || "Rejected by admin",
          },
        });

        message = `Legacy withdrawal of $${amount} rejected for ${req.user?.displayName || req.displayName || ledgerId}.`;
      }

      if (action === "reprocess") {
        if (req.status !== "rejected") {
          return NextResponse.json(
            { success: false, error: "Only rejected requests can be reprocessed" },
            { status: 409 }
          );
        }

        result = await prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status: "pending",
            processedAt: null,
            processedBy: null,
            rejectionReason: null,
          },
        });

        message = `Legacy withdrawal of $${amount} reprocessed to pending for ${req.user?.displayName || req.displayName || ledgerId}.`;
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "ADMIN_WITHDRAWAL_ACTION",
        description: message,
        ledgerId,
        amount,
        metadata: JSON.stringify({ action, id, type, reason, admin: user.ledgerId }),
        txHash: `AUD-WD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        status: result.status,
        processedAt: result.processedAt,
        processedBy: result.processedBy,
        rejectionReason: result.rejectionReason,
      },
      message,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}