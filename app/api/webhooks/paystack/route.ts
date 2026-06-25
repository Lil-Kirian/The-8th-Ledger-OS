// app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/* ============================================================
   8TH LEDGER — PAYSTACK WEBHOOK
   Handles charge.success events. Idempotent. Atomic.
   ============================================================ */
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!PAYSTACK_SECRET || !signature) return false;
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
  return hash === signature;
}

/* ============================================================
   POST /api/webhooks/paystack
   ============================================================ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Signature verification (skip in dev if no secret configured)
    if (process.env.NODE_ENV !== "development" || PAYSTACK_SECRET) {
      if (!verifyPaystackSignature(body, signature)) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);

    // Only process successful charges
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true, ignored: event.event }, { status: 200 });
    }

    const data = event.data;
    const amount = data.amount / 100; // Paystack sends minor units
    const currency = (data.currency || "USD").toUpperCase();
    const txReference = data.reference as string;
    const status = data.status as string;
    const userEmail = data.customer?.email as string | undefined;
    const metadata = data.metadata || {};
    const userLedgerId = metadata.ledgerId as string | null;

    if (status !== "success") {
      return NextResponse.json({ received: true, ignored: "not successful" }, { status: 200 });
    }

    // Idempotency — never process the same reference twice
    const existing = await prisma.treasuryTransaction.findUnique({
      where: { txHash: txReference },
    });
    if (existing) {
      return NextResponse.json({ received: true, ignored: "duplicate" }, { status: 200 });
    }

    // Resolve user by ledgerId or email
    let user = null;
    if (userLedgerId) {
      user = await prisma.user.findUnique({ where: { ledgerId: userLedgerId } });
    }
    if (!user && userEmail) {
      user = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase() } });
    }

    if (!user) {
      console.error("[8TH LEDGER WEBHOOK] User not found:", { userLedgerId, userEmail, txReference });
      return NextResponse.json({ received: true, error: "User not found" }, { status: 200 });
    }

    // Atomic financial transaction
    await prisma.$transaction(async (tx) => {
      // 1. Get or create wallet
      let wallet = await tx.wallet.findUnique({
        where: { ledgerId: user.ledgerId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            ledgerId: user.ledgerId,
            balance: 0,
            lockedBalance: 0,
            currency,
          },
        });
      }

      // 2. Credit wallet
      await tx.wallet.update({
        where: { ledgerId: user.ledgerId },
        data: { balance: { increment: amount } },
      });

      // 3. Record deposit
      await tx.deposit.create({
        data: {
          walletId: wallet.id,
          ledgerId: user.ledgerId,
          amount,
          currency,
          status: "completed",
          method: "paystack",
          reference: txReference,
          completedAt: new Date(),
        },
      });

      // 4. Protocol treasury log
      await tx.treasuryTransaction.create({
        data: {
          type: "deposit_in",
          amount,
          currency,
          ledgerId: user.ledgerId,
          description: `Wallet deposit via Paystack — ${txReference}`,
          status: "completed",
          txHash: txReference,
          timestamp: new Date(),
          audited: true,
        },
      });

      // 5. Immutable audit entry
      await tx.auditEntry.create({
        data: {
          type: "deposit",
          description: `${user.displayName || user.ledgerId} deposited ${amount} ${currency} via Paystack`,
          amount: Math.floor(amount),
          txHash: `AUDIT-${txReference}`,
          ledgerId: user.ledgerId,
        },
      });

      // 6. Touch user activity
      await tx.user.update({
        where: { id: user.id },
        data: { lastActivityAt: new Date() },
      });
    });

    return NextResponse.json(
      {
        received: true,
        credited: amount,
        ledgerId: user.ledgerId,
        currency,
        reference: txReference,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[8TH LEDGER PAYSTACK WEBHOOK]", error);
    // Always return 200 to prevent Paystack retry storms
    return NextResponse.json({ received: true, error: "Processing error logged" }, { status: 200 });
  }
}