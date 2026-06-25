// app/api/marketplace/ownership/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ============================================================
   GET /api/marketplace/ownership/[id]
   Single listing detail — public, no auth required
   ============================================================ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.ownershipListing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            ledgerId: true,
            displayName: true,
            kycTier: true,
            avatar: true,
            globalSriScore: true,
          },
        },
        buyer: {
          select: {
            ledgerId: true,
            displayName: true,
            kycTier: true,
            avatar: true,
          },
        },
        hall: {
          select: {
            id: true,
            status: true,
            sriScore: true,
            ahgiScore: true,
            closureStatus: true,
            pool: {
              select: {
                id: true,
                poolId: true,
                name: true,
                verticalId: true,
                country: true,
                imageUrl: true,
                assetType: true,
                hallClass: true,
                description: true,
              },
            },
            dynamicValuations: {
              orderBy: { calculatedAt: "desc" },
              take: 1,
              select: {
                valuePerPercent: true,
                assetBookValue: true,
                accumulatedDividendsPerPercent: true,
                ahgiPremium: true,
                sriBonus: true,
                pirDebtPerPercent: true,
                ihcpDebtPerPercent: true,
                calculatedAt: true,
              },
            },
            sriSnapshots: {
              orderBy: { recordedAt: "desc" },
              take: 1,
              select: {
                score: true,
                governanceActivity: true,
                revenueConsistency: true,
                dividendReliability: true,
                proposalQuality: true,
                dormancyRate: true,
                marketplaceVelocity: true,
              },
            },
            ahgiSnapshots: {
              orderBy: { recordedAt: "desc" },
              take: 1,
              select: {
                score: true,
                healthMetrics: true,
                growthMetrics: true,
              },
            },
            executiveCabinet: {
              select: {
                speakerId: true,
                treasurerId: true,
                wardenId: true,
                scribeId: true,
                electedAt: true,
                expiresAt: true,
              },
            },
          },
        },
        ownership: {
          select: {
            ownershipPercent: true,
            accumulatedDividends: true,
            pirDebt: true,
            ihcpDebt: true,
            dynamicValue: true,
            totalReturned: true,
            totalFromMarket: true,
            createdAt: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Hall must be live
    if (listing.hall.status !== "live") {
      return NextResponse.json(
        { success: false, error: "Listing is not available" },
        { status: 404 }
      );
    }

    // Only show active, escrow, sold, refunded, disputed. Cancelled/deleted = hidden.
    const visibleStatuses = ["active", "escrow", "sold", "refunded", "disputed"];
    if (!visibleStatuses.includes(listing.status)) {
      return NextResponse.json(
        { success: false, error: "Listing is not available" },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget, no await)
    prisma.ownershipListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => { /* silent fail */ });

    const now = new Date();

    // Time remaining
    let timeRemaining: number | null = null;
    let isExpired = false;
    if (listing.expiresAt) {
      const ms = listing.expiresAt.getTime() - now.getTime();
      if (ms <= 0) isExpired = true;
      timeRemaining = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }

    const floorPrice =
      listing.hall.dynamicValuations[0]?.valuePerPercent ||
      listing.ownership.dynamicValue ||
      0;

    const isAboveFloor = floorPrice > 0
      ? listing.pricePerPercent >= floorPrice || listing.belowFloorApproved
      : true;

    const premiumPercent =
      floorPrice > 0
        ? Math.round(((listing.pricePerPercent - floorPrice) / floorPrice) * 100)
        : 0;

    const isFullSale = !listing.isFractional;
    const feePercent = isFullSale ? 0.01 : 0.02;
    const ledgerFee = Math.round(listing.totalPrice * feePercent);
    const buyerTotal = listing.totalPrice + ledgerFee;

    // Escrow status
    let escrowStatus: {
      startedAt: Date;
      endsAt: Date;
      remainingMs: number;
      isReleased: boolean;
      isRefunded: boolean;
      auditHash: string | null;
    } | null = null;

    if (listing.escrowStartedAt) {
      const endsAt = listing.escrowExpiresAt
        ? new Date(listing.escrowExpiresAt)
        : new Date(listing.escrowStartedAt.getTime() + 48 * 60 * 60 * 1000);

      escrowStatus = {
        startedAt: listing.escrowStartedAt,
        endsAt,
        remainingMs: Math.max(0, endsAt.getTime() - now.getTime()),
        isReleased: !!listing.soldAt,
        isRefunded: listing.status === "refunded",
        auditHash: listing.auditHash,
      };
    }

    const dv = listing.hall.dynamicValuations[0];
    const sri = listing.hall.sriSnapshots[0];
    const ahgi = listing.hall.ahgiSnapshots[0];

    // Buyer info: only show if sold/refunded. Active/escrow = null.
    const showBuyer = listing.status === "sold" || listing.status === "refunded";

    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        ownershipId: listing.ownershipId,
        hallId: listing.hallId,
        percentListed: listing.percentListed,
        pricePerPercent: listing.pricePerPercent,
        totalPrice: listing.totalPrice,
        buyerTotal,
        floorPrice,
        isAboveFloor,
        premiumPercent,
        ledgerFee,
        feePercent,
        isFullSale,
        isFractional: listing.isFractional,
        belowFloorApproved: listing.belowFloorApproved,
        sellerKycTier: listing.sellerKycTier,
        viewCount: listing.viewCount,
        interestCount: listing.interestCount,
        status: listing.status,
        isExpired,
        listedAt: listing.listedAt,
        expiresAt: listing.expiresAt,
        timeRemaining,
        soldAt: listing.soldAt,
        escrow: escrowStatus,
      },
      seller: {
        ledgerId: listing.seller.ledgerId,
        displayName: listing.seller.displayName,
        kycTier: listing.seller.kycTier,
        avatar: listing.seller.avatar,
        globalSriScore: listing.seller.globalSriScore,
      },
      buyer: showBuyer && listing.buyer
        ? {
            ledgerId: listing.buyer.ledgerId,
            displayName: listing.buyer.displayName,
            kycTier: listing.buyer.kycTier,
            avatar: listing.buyer.avatar,
          }
        : null,
      hall: {
        id: listing.hall.id,
        poolId: listing.hall.pool?.poolId,
        name: listing.hall.pool?.name,
        verticalId: listing.hall.pool?.verticalId,
        country: listing.hall.pool?.country,
        imageUrl: listing.hall.pool?.imageUrl,
        assetType: listing.hall.pool?.assetType,
        hallClass: listing.hall.pool?.hallClass,
        description: listing.hall.pool?.description,
        sriScore: listing.hall.sriScore,
        ahgiScore: listing.hall.ahgiScore,
        closureStatus: listing.hall.closureStatus,
      },
      valuation: {
        floorPrice: dv?.valuePerPercent || 0,
        assetBookValue: dv?.assetBookValue || 0,
        accumulatedDividendsPerPercent: dv?.accumulatedDividendsPerPercent || 0,
        ahgiPremium: dv?.ahgiPremium || 0,
        sriBonus: dv?.sriBonus || 0,
        pirDebtPerPercent: dv?.pirDebtPerPercent || 0,
        ihcpDebtPerPercent: dv?.ihcpDebtPerPercent || 0,
        calculatedAt: dv?.calculatedAt || null,
      },
      sri: sri
        ? {
            score: sri.score,
            governanceActivity: sri.governanceActivity,
            revenueConsistency: sri.revenueConsistency,
            dividendReliability: sri.dividendReliability,
            proposalQuality: sri.proposalQuality,
            dormancyRate: sri.dormancyRate,
            marketplaceVelocity: sri.marketplaceVelocity,
          }
        : null,
      ahgi: ahgi
        ? {
            score: ahgi.score,
            healthMetrics: ahgi.healthMetrics,
            growthMetrics: ahgi.growthMetrics,
          }
        : null,
      executiveCabinet: listing.hall.executiveCabinet,
      ownership: {
        ownershipPercent: listing.ownership.ownershipPercent,
        accumulatedDividends: listing.ownership.accumulatedDividends,
        pirDebt: listing.ownership.pirDebt,
        ihcpDebt: listing.ownership.ihcpDebt,
        dynamicValue: listing.ownership.dynamicValue,
        totalReturned: listing.ownership.totalReturned,
        totalFromMarket: listing.ownership.totalFromMarket,
        ownedSince: listing.ownership.createdAt,
      },
    });
  } catch (err) {
    console.error("[OWNERSHIP_DETAIL_GET]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing details" },
      { status: 500 }
    );
  }
}