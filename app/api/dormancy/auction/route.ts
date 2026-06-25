import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getSessionUser } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";

const MIN_BID_INCREMENT = 0.05; // 5%

// GET /api/dormancy/auction
// Public auction feed. Anyone may view. No auth required.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const hallId = searchParams.get("hallId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = { status };
    if (hallId) {
      where.vault = {
        ownership: { hallId },
      };
    }

    const auctions = await prisma.dormancyAuction.findMany({
      where,
      include: {
        vault: {
          include: {
            ownership: {
              select: {
                ownershipPercent: true,
                dynamicValue: true,
                poolId: true,
                hallId: true,
                pool: {
                  select: {
                    name: true,
                    verticalId: true,
                    country: true,
                    imageUrl: true,
                  },
                },
                hall: {
                  select: {
                    name: true,
                    sriScore: true,
                    ahgiScore: true,
                  },
                },
              },
            },
            user: {
              select: {
                ledgerId: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { listedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const now = new Date();
    const AUCTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

    return NextResponse.json({
      success: true,
      auctions: auctions.map((a) => {
        const expiresAt = new Date(a.listedAt.getTime() + AUCTION_DURATION_MS);
        const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());
        return {
          id: a.id,
          vaultId: a.vaultId,
          startingPrice: a.startingPrice,
          currentBid: a.finalPrice,
          highestBidder: a.buyerId,
          status: a.status,
          listedAt: a.listedAt,
          expiresAt,
          timeRemainingMs: timeRemaining,
          ownership: a.vault.ownership,
          originalOwner: a.vault.user,
        };
      }),
      count: auctions.length,
    });
  } catch (error: any) {
    console.error("[DORMANCY AUCTION] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load auctions" },
      { status: 500 }
    );
  }
}

// POST /api/dormancy/auction
// Place bid on active auction, or admin force-complete expired auction.
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, auctionId, bidAmount } = body;

    // ── Admin: force complete expired auction ──
    if (action === "complete" && auctionId) {
      if (user.role !== "admin" || !user.isPrimaryAdmin) {
        return NextResponse.json(
          { success: false, error: "Primary admin authority required" },
          { status: 403 }
        );
      }

      const auction = await prisma.dormancyAuction.findUnique({
        where: { id: auctionId },
        include: {
          vault: {
            include: {
              ownership: {
                select: {
                  id: true,
                  userId: true,
                  hallId: true,
                  dynamicValue: true,
                  ownershipPercent: true,
                },
              },
              user: { select: { ledgerId: true } },
            },
          },
        },
      });

      if (!auction) {
        return NextResponse.json(
          { success: false, error: "Auction not found" },
          { status: 404 }
        );
      }

      const now = new Date();
      const absorbPrice = auction.finalPrice || auction.startingPrice;
      const ownership = auction.vault.ownership;

      await prisma.$transaction(async (tx) => {
        if (auction.buyerId) {
          // Sold to highest bidder — transfer ownership
          await tx.ownership.update({
            where: { id: ownership.id },
            data: {
              userId: auction.buyerId,
              status: "active",
              accumulatedDividends: 0,
              pirDebt: 0,
            },
          });

          // Payout: 80% to original owner, 20% dormancy fee to 8th Ledger
          const sellerPayout = Math.floor(absorbPrice * 0.8);
          const dormancyFee = absorbPrice - sellerPayout;

          await tx.wallet.updateMany({
            where: { ledgerId: auction.vault.user.ledgerId },
            data: { balance: { increment: sellerPayout } },
          });

          // Record fee to hall treasury if hall exists
          if (ownership.hallId) {
            const treasury = await tx.hallTreasury.findUnique({
              where: { hallId: ownership.hallId },
            });

            if (treasury) {
              await tx.hallTreasuryTransaction.create({
                data: {
                  treasuryId: treasury.id,
                  type: "dormancy_fee",
                  amount: dormancyFee,
                  description: `Dormancy auction fee — ownership ${ownership.id}`,
                  createdAt: now,
                },
              });
            }
          }

          await tx.dormancyAuction.update({
            where: { id: auctionId },
            data: { status: "sold", completedAt: now },
          });
        } else {
          // Unsold — 8th Ledger absorbs at Dynamic Valuation
          await tx.ownership.update({
            where: { id: ownership.id },
            data: { status: "forfeited" },
          });

          await tx.dormancyAuction.update({
            where: { id: auctionId },
            data: { status: "unsold", completedAt: now },
          });

          await tx.auditLog.create({
            data: {
              eventType: "dormancy_absorb",
              description: `8th Ledger absorbed ownership ${ownership.id} after unsold auction.`,
              txHash: `ABSORB-${auctionId}-${Date.now()}`,
              visibleToPublic: true,
            },
          });
        }

        await tx.dormancyVault.update({
          where: { id: auction.vaultId },
          data: { status: "auctioned" },
        });
      });

      await logSecurityAudit({
        action: "DORMANCY_AUCTION_COMPLETED",
        actorId: user.ledgerId,
        targetId: auctionId,
        metadata: {
          status: auction.buyerId ? "sold" : "unsold",
          price: absorbPrice,
          ownershipId: ownership.id,
        },
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });

      return NextResponse.json({
        success: true,
        message: auction.buyerId
          ? `Auction completed. Sold to highest bidder.`
          : "Auction completed. 8th Ledger absorbed ownership.",
        auctionId,
        finalPrice: absorbPrice,
        dormancyFee: auction.buyerId ? Math.floor(absorbPrice * 0.2) : 0,
      });
    }

    // ── Place bid ──
    if (!auctionId || typeof bidAmount !== "number" || bidAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "auctionId and valid bidAmount required" },
        { status: 400 }
      );
    }

    const auction = await prisma.dormancyAuction.findUnique({
      where: { id: auctionId },
      include: {
        vault: {
          include: {
            user: { select: { id: true, ledgerId: true } },
            ownership: { select: { id: true, hallId: true } },
          },
        },
      },
    });

    if (!auction || auction.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Auction not found or inactive" },
        { status: 404 }
      );
    }

    // Prevent original owner from bidding on their own auction
    if (auction.vault.userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot bid on your own auction" },
        { status: 403 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(auction.listedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: "Auction has expired" },
        { status: 410 }
      );
    }

    // Validate bid meets minimum
    const minBid = auction.finalPrice
      ? Math.ceil(auction.finalPrice * (1 + MIN_BID_INCREMENT))
      : auction.startingPrice;

    if (bidAmount < minBid) {
      return NextResponse.json(
        { success: false, error: `Bid must be at least $${minBid}` },
        { status: 400 }
      );
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { ledgerId: user.ledgerId },
    });

    if (!wallet || wallet.balance < bidAmount) {
      return NextResponse.json(
        { success: false, error: "Insufficient ledger balance" },
        { status: 402 }
      );
    }

    // Record bid atomically
    await prisma.$transaction(async (tx) => {
      await tx.dormancyAuction.update({
        where: { id: auctionId },
        data: {
          finalPrice: bidAmount,
          buyerId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: "dormancy_bid",
          description: `Subject ${user.ledgerId} placed bid $${bidAmount} on auction ${auctionId}.`,
          ledgerId: user.ledgerId,
          txHash: `BID-${auctionId}-${Date.now()}`,
          visibleToPublic: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Bid placed: $${bidAmount.toLocaleString()}. You are the current highest bidder.`,
      auctionId,
      yourBid: bidAmount,
      ledgerId: user.ledgerId,
    });
  } catch (error: any) {
    console.error("[DORMANCY AUCTION] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Auction action failed" },
      { status: 500 }
    );
  }
}