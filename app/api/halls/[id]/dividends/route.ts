import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin, isFounder, isAdminRole } from "@/lib/auth";

const CLAIMABLE_KYC_TIERS = new Set(["sovereign", "verified", "admin"]);

async function getHallAccess(hallId: string, userId: string, ledgerId: string) {
  const [hall, ownerships, canAdminView] = await Promise.all([
    prisma.hall.findUnique({
      where: { id: hallId },
      select: { id: true, name: true, poolId: true },
    }),
    prisma.ownership.findMany({
      where: { hallId, userId, status: { not: "forfeited" } },
      select: { id: true, ownershipPercent: true },
    }),
    Promise.all([isPrimaryAdmin({ ledgerId }), isFounder({ ledgerId })]).then(
      ([primaryAdmin, founder]) => primaryAdmin || founder,
    ),
  ]);

  return { hall, ownerships, canAdminView };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: hallId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const { hall, ownerships, canAdminView } = await getHallAccess(
      hallId,
      user.id,
      user.ledgerId,
    );
    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }
    if (ownerships.length === 0 && !canAdminView && !isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 },
      );
    }

    const kyc = await prisma.kycRecord.findUnique({
      where: { userId: user.id },
      select: { tier: true },
    });
    const tier = kyc?.tier ?? "visitor";

    const entryWhere = {
      ...(ownerships.length > 0
        ? { ownershipId: { in: ownerships.map((ownership) => ownership.id) } }
        : { ownership: { hallId } }),
      ...(status === "claimed" ? { claimed: true } : {}),
      ...(status === "unclaimed" ? { claimed: false } : {}),
    };

    const dividends = await prisma.dividendEntry.findMany({
      where: entryWhere,
      orderBy: { distribution: { distributedAt: "desc" } },
      include: {
        ownership: { select: { ownershipPercent: true, userId: true } },
        distribution: {
          select: {
            id: true,
            revenueLogId: true,
            totalAmount: true,
            distributedAt: true,
          },
        },
      },
      take: 100,
    });

    const totalUnclaimed = dividends
      .filter((entry) => !entry.claimed)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalClaimed = dividends
      .filter((entry) => entry.claimed)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const ownershipPct = ownerships.reduce(
      (sum, ownership) => sum + ownership.ownershipPercent,
      0,
    );

    return NextResponse.json({
      success: true,
      dividends: dividends.map((entry) => ({
        id: entry.id,
        revenueLogId: entry.distribution.revenueLogId,
        grossAmount: entry.distribution.totalAmount,
        ownershipPercent: entry.ownership.ownershipPercent,
        entitlement: entry.amount,
        status: entry.claimed ? "claimed" : "unclaimed",
        claimedAt: entry.claimedAt,
        createdAt: entry.distribution.distributedAt,
        revenueDate: entry.distribution.distributedAt,
      })),
      summary: {
        totalUnclaimed,
        totalClaimed,
        totalRecords: dividends.length,
        unclaimedCount: dividends.filter((entry) => !entry.claimed).length,
        claimedCount: dividends.filter((entry) => entry.claimed).length,
        ownershipPercent: Number(ownershipPct.toFixed(2)),
        canClaim: CLAIMABLE_KYC_TIERS.has(tier),
        tier,
      },
    });
  } catch (error) {
    console.error("[HALL DIVIDENDS GET]", error);
    return NextResponse.json(
      { success: false, error: "Dividend history unreachable" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: hallId } = await params;
    const { hall, ownerships } = await getHallAccess(
      hallId,
      user.id,
      user.ledgerId,
    );
    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }
    if (ownerships.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sovereign access denied. Only PAC holders can claim.",
        },
        { status: 403 },
      );
    }

    const kyc = await prisma.kycRecord.findUnique({
      where: { userId: user.id },
      select: { tier: true },
    });
    if (!kyc || !CLAIMABLE_KYC_TIERS.has(kyc.tier)) {
      return NextResponse.json(
        {
          success: false,
          error: "Visitor tier cannot claim dividends. Complete KYC first.",
        },
        { status: 403 },
      );
    }

    const dormant = await prisma.dormancyLog.findFirst({
      where: {
        OR: [{ userId: user.id }, { hallId }],
        type: "account",
        stage: { in: ["critical", "forfeited"] },
        resolvedAt: null,
      },
    });
    if (dormant) {
      return NextResponse.json(
        { success: false, error: "Account dormancy critical. Claims frozen." },
        { status: 403 },
      );
    }

    const ownershipIds = ownerships.map((ownership) => ownership.id);
    const unclaimed = await prisma.dividendEntry.findMany({
      where: { ownershipId: { in: ownershipIds }, claimed: false },
      include: { distribution: { select: { revenueLogId: true } } },
    });

    if (unclaimed.length === 0) {
      return NextResponse.json(
        { success: false, error: "No unclaimed dividends available" },
        { status: 400 },
      );
    }

    const totalEntitlement = unclaimed.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );
    const dividendIds = unclaimed.map((entry) => entry.id);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      await tx.dividendEntry.updateMany({
        where: { id: { in: dividendIds }, claimed: false },
        data: { claimed: true, claimedAt: now },
      });

      await tx.wallet.upsert({
        where: { ledgerId: user.ledgerId },
        create: {
          ledgerId: user.ledgerId,
          balance: totalEntitlement,
          lockedBalance: 0,
        },
        update: {
          balance: { increment: totalEntitlement },
        },
      });

      await tx.ownership.updateMany({
        where: { id: { in: ownershipIds } },
        data: { totalReturned: { increment: totalEntitlement } },
      });

      const treasury = await tx.hallTreasury.upsert({
        where: { hallId },
        create: {
          hallId,
          balance: -totalEntitlement,
          totalDistributed: totalEntitlement,
          totalRevenue: 0,
          lastDistribution: now,
        },
        update: {
          balance: { decrement: totalEntitlement },
          totalDistributed: { increment: totalEntitlement },
          lastDistribution: now,
        },
      });

      await tx.hallTreasuryTransaction.create({
        data: {
          treasuryId: treasury.id,
          type: "dividend_claim",
          amount: -totalEntitlement,
          description: `Dividend claim by ${user.displayName ?? user.ledgerId}`,
          metadata: JSON.stringify({ dividendIds, ledgerId: user.ledgerId }),
        },
      });

      await tx.ledgerEntry.create({
        data: {
          ledgerId: user.ledgerId,
          type: "dividend",
          direction: "credit",
          amount: totalEntitlement,
          currency: "USD",
          referenceType: "dividend_claim",
          referenceId: hallId,
          idempotencyKey: `dividend-claim-${user.ledgerId}-${now.getTime()}`,
          description: `Dividend claim from ${hall.name}`,
          metadata: { dividendIds },
        },
      });

      await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "dividend",
          description: `${user.displayName ?? user.ledgerId} claimed ${totalEntitlement} in dividends`,
          metadata: JSON.stringify({ dividendIds, totalEntitlement }),
        },
      });

      await tx.notification.create({
        data: {
          ledgerId: user.ledgerId,
          poolId: hall.poolId,
          type: "dividend_claimed",
          title: "Dividends Claimed",
          message: `${totalEntitlement} credited to your wallet from ${unclaimed.length} dividend records.`,
          actionUrl: `/halls/${hallId}/dividends`,
        },
      });

      return { totalEntitlement, count: unclaimed.length };
    });

    return NextResponse.json({
      success: true,
      claimed: result.count,
      amount: result.totalEntitlement,
      message: `${result.totalEntitlement} credited to wallet`,
    });
  } catch (error) {
    console.error("[HALL DIVIDENDS POST]", error);
    return NextResponse.json(
      { success: false, error: "Dividend claim failed" },
      { status: 500 },
    );
  }
}
