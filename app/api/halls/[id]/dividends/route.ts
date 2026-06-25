import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   GET /api/halls/[id]/dividends — Personal dividend history
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // unclaimed | claimed | all

    // ── Ownership gate ──
    const ownership = await verifyOwnership(hallId, user.id);
    if (!ownership && !isPrimaryAdmin(user) && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Sovereign access denied" }, { status: 403 });
    }

    // ── KYC tier check (Visitor cannot claim) ──
    const kyc = await prisma.kycRecord.findUnique({
      where: { ledgerId: user.ledgerId },
      select: { tier: true },
    });
    const tier = kyc?.tier || "visitor";

    // ── Fetch dividends ──
    const where: any = { hallId, userId: user.id };
    if (status && ["unclaimed", "claimed"].includes(status)) {
      where.status = status;
    }

    const dividends = await prisma.dividend.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        revenueLog: {
          select: {
            amount: true,
            source: true,
            createdAt: true,
          },
        },
      },
      take: 100,
    });

    const totalUnclaimed = dividends
      .filter((d) => d.status === "unclaimed")
      .reduce((sum, d) => sum + Number(d.entitlement), 0);

    const totalClaimed = dividends
      .filter((d) => d.status === "claimed")
      .reduce((sum, d) => sum + Number(d.entitlement), 0);

    const ownershipPct = ownership?.percentage || ownership?.ownershipPercent || 0;

    return NextResponse.json({
      success: true,
      dividends: dividends.map((d) => ({
        id: d.id,
        revenueLogId: d.revenueLogId,
        grossAmount: Number(d.grossAmount),
        ownershipPercent: Number(d.ownershipPercent),
        entitlement: Number(d.entitlement),
        status: d.status,
        claimedAt: d.claimedAt,
        createdAt: d.createdAt,
        source: d.revenueLog?.source,
        revenueDate: d.revenueLog?.createdAt,
      })),
      summary: {
        totalUnclaimed: Number(totalUnclaimed.toFixed(2)),
        totalClaimed: Number(totalClaimed.toFixed(2)),
        totalRecords: dividends.length,
        unclaimedCount: dividends.filter((d) => d.status === "unclaimed").length,
        claimedCount: dividends.filter((d) => d.status === "claimed").length,
        ownershipPercent: Number(ownershipPct.toFixed(2)),
        canClaim: tier !== "visitor",
        tier,
      },
    });
  } catch (error) {
    console.error("[HALL DIVIDENDS GET]", error);
    return NextResponse.json(
      { success: false, error: "Dividend history unreachable" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/halls/[id]/dividends — Claim unclaimed dividends
   Credits LED to wallet. Marks records claimed. Immutable log.
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;

    // ── Ownership gate ──
    const ownership = await verifyOwnership(hallId, user.id);
    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied. Only PAC holders can claim." },
        { status: 403 }
      );
    }

    // ── KYC tier gate: Visitor cannot claim ──
    const kyc = await prisma.kycRecord.findUnique({
      where: { ledgerId: user.ledgerId },
      select: { tier: true, legalName: true },
    });
    if (!kyc || kyc.tier === "visitor") {
      return NextResponse.json(
        { success: false, error: "Visitor tier cannot claim dividends. Complete KYC to Sovereign tier." },
        { status: 403 }
      );
    }

    // ── Dormancy check ──
    const isDormant = await prisma.dormancyLog.findFirst({
      where: {
        OR: [{ accountId: user.id }, { hallId }],
        type: "account",
        status: { in: ["critical", "forfeited"] },
      },
    });
    if (isDormant) {
      return NextResponse.json(
        { success: false, error: "Account dormancy critical. Claims frozen." },
        { status: 403 }
      );
    }

    // ── Find unclaimed dividends ──
    const unclaimed = await prisma.dividend.findMany({
      where: {
        hallId,
        userId: user.id,
        status: "unclaimed",
      },
      include: {
        revenueLog: {
          select: { id: true, amount: true, source: true, createdAt: true },
        },
      },
    });

    if (unclaimed.length === 0) {
      return NextResponse.json(
        { success: false, error: "No unclaimed dividends available" },
        { status: 400 }
      );
    }

    const totalEntitlement = unclaimed.reduce((sum, d) => sum + Number(d.entitlement), 0);
    const dividendIds = unclaimed.map((d) => d.id);

    // ── Atomic claim + credit ──
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark dividends claimed
      await tx.dividend.updateMany({
        where: { id: { in: dividendIds } },
        data: {
          status: "claimed",
          claimedAt: new Date(),
        },
      });

      // 2. Credit LED to wallet (1 USD entitlement = 1 LED)
      const creditAmount = Math.floor(totalEntitlement * 100) / 100;
      const txHash = `DIV-CREDIT-${Date.now().toString(36).toUpperCase()}`;

      // 3. Credit wallet
      await tx.wallet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          balance: creditAmount,
          lockedBalance: 0,
          totalDeposited: 0,
          totalWithdrawn: 0,
        },
        update: {
          balance: { increment: creditAmount },
        },
      });

      // 4. Treasury outflow tracking
      await tx.treasury.update({
        where: { hallId },
        data: {
          balance: { decrement: totalEntitlement },
          totalOut: { increment: totalEntitlement },
        },
      });

      // 5. Treasury transaction log
      await tx.treasuryTransaction.create({
        data: {
          type: "dividend_payout",
          amount: totalEntitlement,
          currency: "USD",
          hallId,
          ledgerId: user.ledgerId,
          description: `Dividend claim: ${unclaimed.length} records — ${user.displayName}`,
          status: "completed",
          txHash,
          timestamp: new Date(),
          audited: true,
        },
      });

      // 6. Hall activity
      await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "dividend",
          description: `${user.displayName} claimed $${totalEntitlement.toFixed(2)} in dividends (${unclaimed.length} records)`,
          metadata: JSON.stringify({
            dividendIds,
            creditAmount,
            txHash,
            ownershipPercent: ownership.percentage || ownership.ownershipPercent,
          }),
        },
      });

      // 7. Notification
      await tx.notification.create({
        data: {
          ledgerId: user.ledgerId,
          hallId,
          type: "dividend_claimed",
          title: "Dividends Claimed",
          message: `$${totalEntitlement.toFixed(2)} claimed from ${unclaimed.length} revenue records. ${creditAmount} LED credited to wallet.`,
          actionUrl: `/halls/${hallId}/dividends`,
        },
      });

      return { creditAmount, totalEntitlement, count: unclaimed.length, txHash };
    });

    return NextResponse.json({
      success: true,
      claim: {
        hallId,
        dividendCount: result.count,
        totalEntitlement: Number(result.totalEntitlement.toFixed(2)),
        creditedLedger: result.creditAmount,
        txHash: result.txHash,
        claimedAt: new Date(),
      },
      message: `${result.count} dividends claimed. $${result.totalEntitlement.toFixed(2)} → ${result.creditAmount} LED credited to wallet.`,
    });
  } catch (error) {
    console.error("[HALL DIVIDENDS POST]", error);
    return NextResponse.json(
      { success: false, error: "Dividend claim failed" },
      { status: 500 }
    );
  }
}