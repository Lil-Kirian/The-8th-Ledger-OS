import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   GET /api/wallet/balance — 8th Ledger Sovereign Balance
   ============================================================ */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      success: true,
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      available: wallet.balance - wallet.lockedBalance,
      currency: wallet.currency,
      ledgerId: user.ledgerId,
    });
  } catch (error) {
    console.error("[BALANCE GET]", error);
    return NextResponse.json({ success: false, error: "Balance check failed" }, { status: 500 });
  }
}