import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateWallet } from "@/server/services/wallet.service";

/* ============================================================
   GET /api/wallet/balance — 8th Ledger Sovereign Balance
   ============================================================ */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const wallet = await getOrCreateWallet(user.ledgerId);

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
    return NextResponse.json(
      { success: false, error: "Balance check failed" },
      { status: 500 },
    );
  }
}
