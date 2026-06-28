// app/api/marketplace/ownership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { generateTxHash } from "@/lib/utils";

/* ============================================================
   GET /api/marketplace/ownership
   List active PAC listings with filters, pagination, enrichment
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const hallId = searchParams.get("hallId");
    const verticalId = searchParams.get("verticalId");
    const sellerId = searchParams.get("sellerId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "newest";
    const skip = (page - 1) * limit;

    const where: Prisma.OwnershipListingWhereInput = {
      status: "active",
    };

    // ExpiresAt: either null (never expires) or in the future
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    if (hallId) where.hallId = hallId;
    if (sellerId) where.sellerId = sellerId;

    if (verticalId) {
      where.hall = {
        pool: { verticalId },
      };
    }

    if (minPrice || maxPrice) {
      where.pricePerPercent = {};
      if (minPrice) where.pricePerPercent.gte = parseFloat(minPrice);
      if (maxPrice) where.pricePerPercent.lte = parseFloat(maxPrice);
    }

    const [listings, total] = await Promise.all([
      prisma.ownershipListing.findMany({
        where,
        include: {
          seller: {
            select: {
              ledgerId: true,
              displayName: true,
              kycTier: true,
              avatar: true,
            },
          },
          hall: {
            include: {
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
                },
              },
              dynamicValuations: {
                orderBy: { calculatedAt: "desc" },
                take: 1,
                select: {
                  valuePerPercent: true,
                  pirDebtPerPercent: true,
                  ihcpDebtPerPercent: true,
                  calculatedAt: true,
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
            },
          },
        },
        orderBy:
          sortBy === "price_asc"
            ? { pricePerPercent: "asc" }
            : sortBy === "price_desc"
              ? { pricePerPercent: "desc" }
              : { listedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ownershipListing.count({ where }),
    ]);

    const now = new Date();
    const enriched = listings.map((listing) => {
      const dynamicVal = listing.hall.dynamicValuations[0];
      const floorPrice =
        dynamicVal?.valuePerPercent || listing.ownership.dynamicValue || 0;

      const timeRemainingMs = listing.expiresAt
        ? listing.expiresAt.getTime() - now.getTime()
        : Infinity;
      const timeRemaining =
        timeRemainingMs === Infinity
          ? null
          : Math.max(0, Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24)));

      const isAboveFloor =
        floorPrice > 0
          ? listing.pricePerPercent >= floorPrice || listing.belowFloorApproved
          : true;

      const premiumPercent =
        floorPrice > 0
          ? Math.round(
              ((listing.pricePerPercent - floorPrice) / floorPrice) * 100,
            )
          : 0;

      return {
        id: listing.id,
        ownershipId: listing.ownershipId,
        hallId: listing.hallId,
        percentListed: listing.percentListed,
        pricePerPercent: listing.pricePerPercent,
        totalPrice: listing.totalPrice,
        floorPrice,
        isAboveFloor,
        premiumPercent,
        belowFloorApproved: listing.belowFloorApproved,
        isFractional: listing.isFractional,
        viewCount: listing.viewCount,
        interestCount: listing.interestCount,
        sellerKycTier: listing.sellerKycTier,
        auditHash: listing.auditHash,
        escrowExpiresAt: listing.escrowExpiresAt,
        seller: {
          ledgerId: listing.seller.ledgerId,
          displayName: listing.seller.displayName,
          kycTier: listing.seller.kycTier,
          avatar: listing.seller.avatar,
        },
        hall: {
          id: listing.hall.id,
          poolId: listing.hall.pool?.poolId,
          name: listing.hall.pool?.name,
          verticalId: listing.hall.pool?.verticalId,
          country: listing.hall.pool?.country,
          imageUrl: listing.hall.pool?.imageUrl,
          assetType: listing.hall.pool?.assetType,
          hallClass: listing.hall.pool?.hallClass,
          sriScore: listing.hall.sriScore,
          ahgiScore: listing.hall.ahgiScore,
        },
        ownership: {
          ownershipPercent: listing.ownership.ownershipPercent,
          accumulatedDividends: listing.ownership.accumulatedDividends,
          pirDebt: listing.ownership.pirDebt,
          ihcpDebt: listing.ownership.ihcpDebt,
        },
        status: listing.status,
        listedAt: listing.listedAt,
        expiresAt: listing.expiresAt,
        timeRemaining,
      };
    });

    return NextResponse.json({
      success: true,
      listings: enriched,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[OWNERSHIP_MARKETPLACE_GET]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listings" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/marketplace/ownership
   Create a new PAC listing
   ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // KYC gate — visitors cannot list
    if (user.kycTier === "visitor") {
      return NextResponse.json(
        {
          success: false,
          error: "KYC verification required to list PACs on the marketplace",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { ownershipId, percentListed, pricePerPercent, expiresAt } = body;

    // Validation
    if (
      !ownershipId ||
      percentListed === undefined ||
      pricePerPercent === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: ownershipId, percentListed, pricePerPercent",
        },
        { status: 400 },
      );
    }

    const percent = parseFloat(percentListed);
    const price = parseFloat(pricePerPercent);

    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid percentListed. Must be between 0 and 100.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pricePerPercent. Must be greater than 0.",
        },
        { status: 400 },
      );
    }

    // Get ownership with hall and active listings
    const ownership = await prisma.ownership.findUnique({
      where: { id: ownershipId },
      include: {
        hall: {
          select: {
            id: true,
            status: true,
            pool: {
              select: { id: true, poolId: true },
            },
            dynamicValuations: {
              orderBy: { calculatedAt: "desc" },
              take: 1,
              select: { valuePerPercent: true },
            },
          },
        },
        ownershipListings: {
          where: { status: { in: ["active", "escrow"] } },
          select: { percentListed: true },
        },
      },
    });

    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Ownership not found" },
        { status: 404 },
      );
    }

    if (ownership.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this PAC" },
        { status: 403 },
      );
    }

    if (ownership.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Ownership is not active" },
        { status: 400 },
      );
    }

    // Dormancy check
    const isDormant = await prisma.dormancyVault.findFirst({
      where: { ownershipId: ownership.id, status: "vaulted" },
    });
    if (isDormant) {
      return NextResponse.json(
        { success: false, error: "Cannot list dormant ownership" },
        { status: 403 },
      );
    }

    if (
      !ownership.hallId ||
      !ownership.hall ||
      ownership.hall.status !== "live"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Hall is not live. Listings only allowed for live halls.",
        },
        { status: 400 },
      );
    }

    // Max active listings per user: 3 (hard protocol limit)
    const userActiveListings = await prisma.ownershipListing.count({
      where: {
        sellerId: user.id,
        status: { in: ["active", "escrow"] },
      },
    });

    if (userActiveListings >= 3) {
      return NextResponse.json(
        { success: false, error: "Maximum 3 active listings allowed per user" },
        { status: 400 },
      );
    }

    // Total listed percent for this ownership cannot exceed owned percent
    const alreadyListed = ownership.ownershipListings.reduce(
      (sum, l) => sum + l.percentListed,
      0,
    );
    const remainingOwnership = ownership.ownershipPercent - alreadyListed;

    if (alreadyListed + percent > ownership.ownershipPercent) {
      return NextResponse.json(
        {
          success: false,
          error: `Total listed percent (${(alreadyListed + percent).toFixed(2)}%) exceeds your ownership (${ownership.ownershipPercent}%)`,
        },
        { status: 400 },
      );
    }

    // Single listing cannot exceed 25% of ownership (default protocol limit)
    const maxListablePercent = ownership.ownershipPercent * 0.25;
    if (percent > maxListablePercent) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot list more than 25% of your ownership in a single listing. Max: ${maxListablePercent.toFixed(2)}%`,
        },
        { status: 400 },
      );
    }

    // Remaining ownership must be >= 0.1% or zero (hard protocol rule)
    const afterListing = remainingOwnership - percent;
    if (afterListing > 0 && afterListing < 0.1) {
      return NextResponse.json(
        {
          success: false,
          error: `Remaining ownership after this listing would be ${afterListing.toFixed(2)}%. Minimum remaining is 0.1% or sell entire stake.`,
        },
        { status: 400 },
      );
    }

    // Floor price check — 8th Ledger Dynamic Valuation
    const floorPrice =
      ownership.hall.dynamicValuations[0]?.valuePerPercent ||
      ownership.dynamicValue ||
      0;

    // Below floor is NEVER allowed on creation. Admin must approve via PATCH.
    if (floorPrice > 0 && price < floorPrice) {
      return NextResponse.json(
        {
          success: false,
          error: `Price cannot be below 8th Ledger floor valuation of $${floorPrice.toFixed(2)} per 1%. Request hall vote (51%) and admin approval to list below floor.`,
        },
        { status: 400 },
      );
    }

    // Determine if this is a full sale of remaining stake
    const isFullSale = percent >= remainingOwnership - 0.001;
    const feeRate = isFullSale ? 0.01 : 0.02;
    const ledgerFee = Math.round(percent * price * feeRate);

    // Validate expiry
    let listingExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (isNaN(parsed.getTime()) || parsed <= new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid expiresAt. Must be a future date.",
          },
          { status: 400 },
        );
      }
      const maxExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      if (parsed > maxExpiry) {
        return NextResponse.json(
          { success: false, error: "Listing duration cannot exceed 90 days" },
          { status: 400 },
        );
      }
      listingExpiry = parsed;
    }

    // Generate audit hash
    const hashPayload = `${ownershipId}-${user.id}-${percent}-${price}-${Date.now()}`;
    const auditHash = crypto
      .createHash("sha256")
      .update(hashPayload)
      .digest("hex");

    // Create listing
    const listing = await prisma.ownershipListing.create({
      data: {
        ownershipId: ownership.id,
        hallId: ownership.hallId,
        sellerId: user.id,
        percentListed: percent,
        pricePerPercent: price,
        totalPrice: percent * price,
        floorPrice,
        status: "active",
        listedAt: new Date(),
        expiresAt: listingExpiry,
        isFractional: !isFullSale,
        sellerKycTier: user.kycTier,
        belowFloorApproved: false,
        auditHash,
        viewCount: 0,
        interestCount: 0,
      },
      include: {
        seller: {
          select: {
            ledgerId: true,
            displayName: true,
            kycTier: true,
          },
        },
        hall: {
          include: {
            pool: {
              select: {
                name: true,
                verticalId: true,
                country: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "ownership_listing_created",
        description: `User ${user.ledgerId} listed ${percent}% of Hall ${ownership.hallId} at $${price.toFixed(2)}/1% (Total: $${(percent * price).toFixed(2)}). Floor: $${floorPrice.toFixed(2)}. Full sale: ${isFullSale}.`,
        ledgerId: user.ledgerId,
        poolId: ownership.hall.pool?.poolId,
        txHash: generateTxHash("LED-LIST"),
        visibleToPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        ownershipId: listing.ownershipId,
        hallId: listing.hallId,
        percentListed: listing.percentListed,
        pricePerPercent: listing.pricePerPercent,
        totalPrice: listing.totalPrice,
        floorPrice: listing.floorPrice,
        ledgerFee,
        isFullSale,
        isFractional: listing.isFractional,
        belowFloorApproved: listing.belowFloorApproved,
        sellerKycTier: listing.sellerKycTier,
        auditHash: listing.auditHash,
        status: listing.status,
        listedAt: listing.listedAt,
        expiresAt: listing.expiresAt,
        seller: listing.seller,
        hall: listing.hall,
      },
      message: "Listing created successfully",
    });
  } catch (err) {
    console.error("[OWNERSHIP_MARKETPLACE_POST]", err);
    return NextResponse.json(
      { success: false, error: "Failed to create listing" },
      { status: 500 },
    );
  }
}
