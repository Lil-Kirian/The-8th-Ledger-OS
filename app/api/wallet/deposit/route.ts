import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   POST /api/wallet/deposit — 8th Ledger Sovereign Deposit
   ============================================================ */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method = "bank_transfer", reference } = body;

    if (!amount || amount < 1) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { ledgerId: user.ledgerId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          ledgerId: user.ledgerId,
          balance: 0,
          lockedBalance: 0,
        },
      });
    }

    const deposit = await prisma.deposit.create({
      data: {
        walletId: wallet.id,
        ledgerId: user.ledgerId,
        amount,
        method,
        reference: reference || null,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
    });
  } catch (error) {
    console.error("[DEPOSIT POST]", error);
    return NextResponse.json({ success: false, error: "Deposit failed" }, { status: 500 });
  }
}

/* ============================================================
   GET /api/wallet/deposit — Deposit history
   ============================================================ */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const deposits = await prisma.deposit.findMany({
      where: { ledgerId: user.ledgerId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    console.error("[DEPOSIT GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch deposits" }, { status: 500 });
  }
}