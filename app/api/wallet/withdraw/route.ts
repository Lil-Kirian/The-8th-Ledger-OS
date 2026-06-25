import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import * as otplib from "otplib";
const { authenticator } = otplib;

/* ============================================================
   WITHDRAWAL LIMITS BY KYC TIER — 8th Ledger
   ============================================================ */
const TIER_LIMITS: Record<string, { daily: number; delayHours: number }> = {
  visitor: { daily: 0, delayHours: 0 },      // Cannot withdraw
  sovereign: { daily: 500, delayHours: 0 },   // Up to $500 instant
  verified: { daily: 5000, delayHours: 24 },  // Up to $5k, 24h delay
  whale: { daily: Infinity, delayHours: 72 },  // Unlimited, 72h delay
};

/* ============================================================
   POST /api/wallet/withdraw — Hardened Sovereign Withdrawal
   8th Ledger Security Protocol
   ============================================================ */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      destination,
      destinationType = "bank",
      totpCode, // Required if TOTP enabled
      currency = "USD",
    } = body;

    if (!amount || amount < 1) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    // ── 1. KYC TIER GATE ─────────────────────────────────────
    const kycTier = user.kycTier || "visitor";
    const tierConfig = TIER_LIMITS[kycTier];

    if (!tierConfig || tierConfig.daily === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sovereign Identity Verification required",
          detail: "Complete KYC to unlock withdrawals. Visit /kyc",
        },
        { status: 403 }
      );
    }

    // ── 2. NAME MATCH VERIFICATION ───────────────────────────
    if (!user.legalName || user.legalName.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Legal name not verified",
          detail: "Your account name must match your government ID. Update in Settings.",
        },
        { status: 403 }
      );
    }

    // ── 3. TOTP / 2FA CHECK ──────────────────────────────────
    if (user.totpEnabled && user.totpSecret) {
      if (!totpCode || totpCode.length !== 6) {
        return NextResponse.json(
          {
            success: false,
            error: "TOTP code required",
            detail: "Enter the 6-digit code from your authenticator app.",
          },
          { status: 403 }
        );
      }
      const isValid = authenticator.verify({
        token: totpCode,
        secret: user.totpSecret,
      });
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid TOTP code" },
          { status: 403 }
        );
      }
    }

    // ── 4. DORMANCY CHECK ────────────────────────────────────
    const daysSinceActivity = user.lastActivityAt
      ? (Date.now() - new Date(user.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    if (daysSinceActivity > 365) {
      return NextResponse.json(
        {
          success: false,
          error: "Account dormant",
          detail: "Your account has been inactive for over 365 days. Login required.",
        },
        { status: 403 }
      );
    }

    // ── 5. DAILY LIMIT CHECK ─────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyWithdrawn = await prisma.withdrawal.aggregate({
      where: {
        ledgerId: user.ledgerId,
        status: { in: ["pending", "processing", "completed"] },
        createdAt: { gte: today, lt: tomorrow },
      },
      _sum: { amount: true },
    });

    const todayTotal = (dailyWithdrawn._sum?.amount || 0) + amount;
    if (todayTotal > tierConfig.daily) {
      return NextResponse.json(
        {
          success: false,
          error: "Daily withdrawal limit exceeded",
          detail: `Tier: ${kycTier.toUpperCase()}. Limit: $${tierConfig.daily.toLocaleString()}/day. Already withdrawn: $${(dailyWithdrawn._sum?.amount || 0).toLocaleString()}.`,
        },
        { status: 403 }
      );
    }

    // ── 6. BALANCE CHECK ─────────────────────────────────────
    const wallet = await prisma.wallet.findUnique({
      where: { ledgerId: user.ledgerId },
    });
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // ── 7. DELAY CALCULATION ─────────────────────────────────
    const delayMs = tierConfig.delayHours * 60 * 60 * 1000;
    const processedAt = delayMs > 0 ? new Date(Date.now() + delayMs) : null;

    // ── 8. EXECUTE WITHDRAWAL ────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      // Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          walletId: wallet.id,
          ledgerId: user.ledgerId,
          amount,
          currency,
          destination,
          destinationType,
          status: processedAt ? "pending" : "processing", // If instant, go to processing
          processedAt,
        },
      });

      // Update user activity
      await tx.user.update({
        where: { id: user.id },
        data: { lastActivityAt: new Date() },
      });

      // Audit log
      await tx.auditEntry.create({
        data: {
          type: "withdrawal_requested",
          description: `Withdrawal $${amount.toLocaleString()} ${currency} requested. Tier: ${kycTier}. Delay: ${tierConfig.delayHours}h.`,
          amount,
          txHash: `WD-${user.ledgerId}-${withdrawal.id.slice(-6)}-${Date.now()}`,
          ledgerId: user.ledgerId,
        },
      });

      return withdrawal;
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: result.id,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
        processedAt: result.processedAt,
        delayHours: tierConfig.delayHours,
        tier: kycTier,
      },
      message: processedAt
        ? `Withdrawal queued. $${amount.toLocaleString()} will be processed in ${tierConfig.delayHours} hours (${result.processedAt.toISOString()}).`
        : `Withdrawal processing instantly. $${amount.toLocaleString()} dispatched.`,
    });
  } catch (error) {
    console.error("[WITHDRAW POST]", error);
    return NextResponse.json(
      { success: false, error: "Withdrawal request failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET /api/wallet/withdraw — Withdrawal history
   ============================================================ */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: any = { ledgerId: user.ledgerId };
    if (status) where.status = status;

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Calculate remaining daily limit
    const tierConfig = TIER_LIMITS[user.kycTier || "visitor"];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyWithdrawn = await prisma.withdrawal.aggregate({
      where: {
        ledgerId: user.ledgerId,
        status: { in: ["pending", "processing", "completed"] },
        createdAt: { gte: today, lt: tomorrow },
      },
      _sum: { amount: true },
    });

    const remainingDaily = Math.max(0, (tierConfig?.daily || 0) - (dailyWithdrawn._sum?.amount || 0));

    return NextResponse.json({
      success: true,
      withdrawals,
      limits: {
        tier: user.kycTier || "visitor",
        dailyLimit: tierConfig?.daily || 0,
        dailyUsed: dailyWithdrawn._sum?.amount || 0,
        remainingDaily: tierConfig?.daily === Infinity ? Infinity : remainingDaily,
      },
    });
  } catch (error) {
    console.error("[WITHDRAW GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}