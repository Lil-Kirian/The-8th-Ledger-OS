// lib/marketplace.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

/* ============================================================
   8TH LEDGER — MARKETPLACE ENGINE V4.1
   Ownership Market (PACs) + Inventory Market (Physical Products)
   Universal Rules: Any hall can enable inventory/forge via 51% vote
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export interface OwnershipListingInput {
  ownershipId: string;
  hallId: string;
  sellerId: string;
  percentListed: number;
  pricePerPercent: number;
  totalPrice: number;
  floorPrice: number;
  expiresAt?: Date;
  belowFloorApproved?: boolean;
}

export interface InventoryListingInput {
  title: string;
  description: string;
  price: number;
  quantity: number;
  hallId: string;
  sellerId: string;
  images?: string[];
  costOfGoods?: number;
  reorderThreshold?: number;
}

export interface OwnershipOrderResult {
  success: boolean;
  order?: {
    id: string;
    listingId: string;
    status: string;
    escrowReleasedAt?: Date;
    totalPayment?: number;
  };
  error?: string;
}

export interface InventoryOrderResult {
  success: boolean;
  order?: {
    id: string;
    inventoryId: string;
    status: string;
    escrowReleasedAt?: Date;
  };
  error?: string;
}

export interface EscrowStatus {
  listingId: string;
  startedAt: Date;
  expiresAt: Date;
  canBuyerCancel: boolean;
  canSellerCancel: boolean;
  status: "holding" | "released" | "refunded" | "cancelled" | "expired";
  hoursRemaining: number;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const MARKETPLACE_CONSTANTS = {
  OWNERSHIP_FEE_FULL: 0.01,       // 1% on full PAC sale
  OWNERSHIP_FEE_FRACTIONAL: 0.02, // 2% on fractional sale
  INVENTORY_PLATFORM_FEE: 0.05,   // 5% on inventory sales
  INVENTORY_FULFILLMENT_PCT: 0.30, // 30% estimated fulfillment cost
  ESCROW_HOLD_HOURS: 48,
  MAX_LISTINGS_PER_USER: 3,
  MAX_FRACTION_PER_LISTING: 0.25,  // 25% of ownership
  MIN_OWNERSHIP_AFTER_SALE: 0.001, // 0.1%
  LISTING_DURATION_DAYS: 30,
};

/* ============================================================
   HELPERS
   ============================================================ */
function generateListingId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LST-${timestamp}-${random}`;
}

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function calculateEscrowExpiry(): Date {
  return new Date(Date.now() + MARKETPLACE_CONSTANTS.ESCROW_HOLD_HOURS * 60 * 60 * 1000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function tierRank(tier: string): number {
  const ranks: Record<string, number> = { visitor: 0, sovereign: 1, verified: 2, whale: 3 };
  return ranks[tier] ?? 0;
}

function sriTierFromScore(score: number): string {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  if (score >= 40) return "bronze";
  return "at_risk";
}

/**
 * Generate SHA-256 audit hash for ownership transfers.
 */
function generateTransferHash(
  sellerLedgerId: string,
  buyerId: string,
  hallId: string,
  percent: number,
  price: number,
  timestamp: string
): string {
  const data = `${sellerLedgerId}:${buyerId}:${hallId}:${percent}:${price}:${timestamp}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Validate listing price against dynamic valuation floor.
 * Blueprint: Floor = 100% of 8th Ledger Valuation. Below floor requires hall vote (51%).
 */
function validateListingPrice(
  pricePerPercent: number,
  floorPrice: number,
  belowFloorApproved: boolean
): { valid: boolean; reason?: string } {
  if (pricePerPercent >= floorPrice) return { valid: true };
  if (!belowFloorApproved) {
    return {
      valid: false,
      reason: `Price $${pricePerPercent} is below 8th Ledger floor $${floorPrice}. Hall vote (51%) required.`,
    };
  }
  return { valid: true };
}

/**
 * Get marketplace fee based on sale type and hall SRI.
 * Blueprint: 1% full, 2% fractional. SRI tier discounts apply.
 */
function getMarketplaceFeePercent(isFullSale: boolean, sriScore: number): number {
  const base = isFullSale
    ? MARKETPLACE_CONSTANTS.OWNERSHIP_FEE_FULL
    : MARKETPLACE_CONSTANTS.OWNERSHIP_FEE_FRACTIONAL;
  const tier = sriTierFromScore(sriScore);
  const multipliers: Record<string, number> = {
    platinum: 0.25,
    gold: 0.5,
    silver: 1.0,
    bronze: 1.0,
    at_risk: 1.0,
  };
  return round2(base * (multipliers[tier] ?? 1.0));
}

/**
 * Get current dynamic valuation for a hall (floor price per 1%).
 */
export async function getDynamicValuationForHall(hallId: string): Promise<{
  valuePerPercent: number;
  assetBookValue: number;
  accumulatedDividends: number;
  ahgiPremium: number;
  sriBonus: number;
  pirDebt: number;
  ihcpDebt: number;
} | null> {
  const latest = await prisma.dynamicValuation.findFirst({
    where: { hallId },
    orderBy: { calculatedAt: "desc" },
  });
  if (!latest) return null;

  return {
    valuePerPercent: latest.valuePerPercent,
    assetBookValue: latest.assetBookValue,
    accumulatedDividends: latest.accumulatedDividendsPerPercent,
    ahgiPremium: latest.ahgiPremium,
    sriBonus: latest.sriBonus,
    pirDebt: latest.pirDebtPerPercent,
    ihcpDebt: latest.ihcpDebtPerPercent,
  };
}

/* ============================================================
   OWNERSHIP MARKET — PAC Trading
   ============================================================ */

/**
 * Create an ownership listing (PAC for sale).
 */
export async function createOwnershipListing(input: OwnershipListingInput): Promise<{
  success: boolean;
  listing?: { id: string; status: string };
  error?: string;
}> {
  const ownership = await prisma.ownership.findUnique({
    where: { id: input.ownershipId },
    include: {
      user: { select: { ledgerId: true, kycTier: true } },
      hall: { select: { id: true, name: true, sriScore: true } },
    },
  });

  if (!ownership) return { success: false, error: "Ownership not found" };
  if (ownership.userId !== input.sellerId) return { success: false, error: "You do not own this PAC" };
  if (ownership.status !== "active") return { success: false, error: `Ownership is ${ownership.status}` };

  // Dormancy check
  const isDormant = await prisma.dormancyVault.findFirst({
    where: { ownershipId: input.ownershipId, status: "vaulted" },
  });
  if (isDormant) return { success: false, error: "Cannot list dormant ownership" };

  // Max listings check
  const activeListings = await prisma.ownershipListing.count({
    where: { sellerId: input.sellerId, status: "active" },
  });
  if (activeListings >= MARKETPLACE_CONSTANTS.MAX_LISTINGS_PER_USER) {
    return { success: false, error: `Max ${MARKETPLACE_CONSTANTS.MAX_LISTINGS_PER_USER} active listings allowed` };
  }

  // Fraction validation
  if (input.percentListed > ownership.ownershipPercent * MARKETPLACE_CONSTANTS.MAX_FRACTION_PER_LISTING) {
    return { success: false, error: `Cannot list more than ${MARKETPLACE_CONSTANTS.MAX_FRACTION_PER_LISTING * 100}% of your ownership` };
  }

  // Min ownership after sale
  const remaining = ownership.ownershipPercent - input.percentListed;
  if (remaining > 0 && remaining < MARKETPLACE_CONSTANTS.MIN_OWNERSHIP_AFTER_SALE) {
    return { success: false, error: "Minimum ownership after sale is 0.1%. Sell all or keep above 0.1%" };
  }

  // Floor price validation
  const floorCheck = validateListingPrice(
    input.pricePerPercent,
    input.floorPrice,
    input.belowFloorApproved ?? false
  );
  if (!floorCheck.valid) return { success: false, error: floorCheck.reason };

  // KYC gate
  if (ownership.user.kycTier === "visitor") {
    return { success: false, error: "KYC verification required to list ownership" };
  }

  const isFractional = input.percentListed < ownership.ownershipPercent;
  const listingId = generateListingId();
  const expiresAt = input.expiresAt || new Date(Date.now() + MARKETPLACE_CONSTANTS.LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const listing = await prisma.ownershipListing.create({
    data: {
      id: listingId,
      ownershipId: input.ownershipId,
      hallId: input.hallId,
      sellerId: input.sellerId,
      percentListed: input.percentListed,
      pricePerPercent: input.pricePerPercent,
      totalPrice: input.totalPrice,
      floorPrice: input.floorPrice,
      status: "active",
      listedAt: new Date(),
      expiresAt,
      isFractional,
      sellerKycTier: ownership.user.kycTier,
      belowFloorApproved: input.belowFloorApproved ?? false,
    },
  });

  await prisma.auditEntry.create({
    data: {
      type: "ownership_listed",
      description: `PAC listed: ${input.percentListed}% of Hall ${input.hallId} at $${input.pricePerPercent}/1%`,
      txHash: `LST-${listingId}`,
      ledgerId: ownership.user.ledgerId,
    },
  });

  return { success: true, listing: { id: listing.id, status: listing.status } };
}

/**
 * Get ownership listings with filters.
 */
export async function getOwnershipListings(filters: {
  hallId?: string;
  verticalId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sellerId?: string;
  page?: number;
  limit?: number;
}): Promise<{ listings: Array<Record<string, unknown>>; total: number }> {
  const where: Prisma.OwnershipListingWhereInput = {};
  if (filters.hallId) where.hallId = filters.hallId;
  if (filters.status) where.status = filters.status;
  else where.status = "active";
  if (filters.sellerId) where.sellerId = filters.sellerId;
  if (filters.minPrice !== undefined) where.pricePerPercent = { gte: filters.minPrice };
  if (filters.maxPrice !== undefined) {
    where.pricePerPercent = { ...(where.pricePerPercent as object || {}), lte: filters.maxPrice };
  }

  const [listings, total] = await Promise.all([
    prisma.ownershipListing.findMany({
      where,
      orderBy: { listedAt: "desc" },
      skip: ((filters.page || 1) - 1) * (filters.limit || 20),
      take: filters.limit || 20,
      include: {
        seller: { select: { ledgerId: true, displayName: true, avatar: true, kycTier: true } },
        hall: {
          select: {
            name: true,
            sriScore: true,
            ahgiScore: true,
            pool: { select: { verticalId: true, name: true, assetType: true } },
          },
        },
        ownership: { select: { ownershipPercent: true, accumulatedDividends: true, dynamicValue: true } },
      },
    }),
    prisma.ownershipListing.count({ where }),
  ]);

  let enriched = listings.map((l) => ({
    ...l,
    verticalId: l.hall?.pool?.verticalId,
    poolName: l.hall?.pool?.name,
    assetType: l.hall?.pool?.assetType,
  }));

  if (filters.verticalId) {
    enriched = enriched.filter((l) => l.verticalId === filters.verticalId);
  }

  return { listings: enriched, total };
}

/**
 * Get single ownership listing detail.
 */
export async function getOwnershipListingDetail(listingId: string): Promise<Record<string, unknown> | null> {
  const listing = await prisma.ownershipListing.findUnique({
    where: { id: listingId },
    include: {
      seller: { select: { ledgerId: true, displayName: true, avatar: true, kycTier: true } },
      hall: {
        select: {
          name: true,
          sriScore: true,
          ahgiScore: true,
          pool: { select: { verticalId: true, name: true, assetType: true } },
        },
      },
      ownership: { select: { ownershipPercent: true, accumulatedDividends: true, dynamicValue: true, pirDebt: true, ihcpDebt: true } },
    },
  });

  if (!listing) return null;

  return {
    ...listing,
    verticalId: listing.hall?.pool?.verticalId,
    poolName: listing.hall?.pool?.name,
    assetType: listing.hall?.pool?.assetType,
  };
}

/**
 * Increment view count for an ownership listing.
 */
export async function incrementViewCount(listingId: string): Promise<void> {
  await prisma.ownershipListing.update({
    where: { id: listingId },
    data: { viewCount: { increment: 1 } },
  });
}

/**
 * Increment interest count for an ownership listing.
 */
export async function incrementInterestCount(listingId: string): Promise<void> {
  await prisma.ownershipListing.update({
    where: { id: listingId },
    data: { interestCount: { increment: 1 } },
  });
}

/**
 * Buy ownership (PAC) — initiates 48h escrow.
 */
export async function buyOwnership(input: {
  listingId: string;
  buyerId: string;
  buyerLedgerId: string;
  buyerKycTier: string;
  buyerLegalName: string;
}): Promise<OwnershipOrderResult> {
  const listing = await prisma.ownershipListing.findUnique({
    where: { id: input.listingId },
    include: {
      seller: { select: { ledgerId: true, displayName: true, kycTier: true, legalName: true } },
      hall: { select: { name: true, poolId: true, sriScore: true } },
      ownership: { select: { ownershipPercent: true, poolId: true } },
    },
  });

  if (!listing) return { success: false, error: "Listing not found" };
  if (listing.status !== "active") return { success: false, error: `Listing is ${listing.status}` };
  if (listing.sellerId === input.buyerId) return { success: false, error: "Cannot buy your own listing" };

  // KYC tier gate
  if (tierRank(input.buyerKycTier) < tierRank(listing.seller.kycTier)) {
    return { success: false, error: `Your KYC tier must be >= seller's tier (${listing.seller.kycTier})` };
  }

  // Name verification
  if (!input.buyerLegalName || input.buyerLegalName.trim().length < 2) {
    return { success: false, error: "Name verification required — legal name must match government ID" };
  }

  // Dormancy check on buyer
  const buyerDormant = await prisma.dormancyVault.findFirst({
    where: { userId: input.buyerId, status: "vaulted" },
  });
  if (buyerDormant) return { success: false, error: "Dormant accounts cannot purchase ownership" };

  // Calculate fee
  const isFullSale = !listing.isFractional;
  const feeRate = getMarketplaceFeePercent(isFullSale, listing.hall.sriScore);
  const fee = round2(listing.totalPrice * feeRate);
  const totalPayment = round2(listing.totalPrice + fee);

  // Wallet balance check
  const buyerWallet = await prisma.wallet.findUnique({
    where: { ledgerId: input.buyerLedgerId },
  });
  if (!buyerWallet) return { success: false, error: "Buyer wallet not found" };
  if (buyerWallet.balance < totalPayment) {
    return { success: false, error: `Insufficient balance. Required: $${totalPayment}, Available: $${buyerWallet.balance}` };
  }

  const orderId = generateOrderId();
  const escrowExpiresAt = calculateEscrowExpiry();

  await prisma.$transaction(async (tx) => {
    // Lock buyer funds
    await tx.wallet.update({
      where: { ledgerId: input.buyerLedgerId },
      data: {
        balance: { decrement: totalPayment },
        lockedBalance: { increment: totalPayment },
      },
    });

    // Lock listing
    await tx.ownershipListing.update({
      where: { id: listing.id },
      data: {
        status: "pending_sale",
        buyerId: input.buyerId,
        escrowStartedAt: new Date(),
        escrowExpiresAt,
      },
    });

    // Create audit
    await tx.auditEntry.create({
      data: {
        type: "ownership_purchase_initiated",
        description: `Purchase initiated: ${listing.percentListed}% of Hall ${listing.hallId} by ${input.buyerLedgerId}. 48h escrow active. Total: $${totalPayment}`,
        amount: Math.round(totalPayment),
        txHash: `ORD-${orderId}`,
        ledgerId: input.buyerLedgerId,
      },
    });
  });

  return {
    success: true,
    order: {
      id: orderId,
      listingId: listing.id,
      status: "pending",
      totalPayment,
    },
  };
}

/**
 * Get escrow status for a listing.
 */
export async function getEscrowStatus(listingId: string): Promise<EscrowStatus | null> {
  const listing = await prisma.ownershipListing.findUnique({
    where: { id: listingId },
    select: { id: true, escrowStartedAt: true, escrowExpiresAt: true, status: true, sellerId: true, buyerId: true },
  });

  if (!listing || !listing.escrowStartedAt) return null;

  const now = new Date();
  const expiresAt = listing.escrowExpiresAt || new Date(listing.escrowStartedAt.getTime() + MARKETPLACE_CONSTANTS.ESCROW_HOLD_HOURS * 60 * 60 * 1000);
  const hoursRemaining = Math.max(0, (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000));

  let status: EscrowStatus["status"] = "holding";
  if (listing.status === "sold") status = "released";
  else if (listing.status === "cancelled") status = "cancelled";
  else if (listing.status === "refunded") status = "refunded";
  else if (now > expiresAt) status = "expired";

  return {
    listingId: listing.id,
    startedAt: listing.escrowStartedAt,
    expiresAt,
    canBuyerCancel: status === "holding" && hoursRemaining > 0,
    canSellerCancel: status === "holding" && hoursRemaining > 0 && !listing.buyerId,
    status,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
  };
}

/**
 * Release escrow after 48h — complete ownership transfer.
 */
export async function releaseEscrow(
  listingId: string,
  callerId: string,
  isAdmin: boolean
): Promise<OwnershipOrderResult> {
  const listing = await prisma.ownershipListing.findUnique({
    where: { id: listingId },
    include: {
      ownership: true,
      seller: { select: { ledgerId: true, id: true } },
      hall: { select: { name: true, poolId: true } },
    },
  });

  if (!listing) return { success: false, error: "Listing not found" };
  if (listing.status !== "pending_sale") return { success: false, error: `Listing is ${listing.status}` };

  const escrow = await getEscrowStatus(listingId);
  if (!escrow) return { success: false, error: "No escrow found" };

  // Only buyer or admin can release after 48h
  if (listing.buyerId !== callerId && !isAdmin) {
    return { success: false, error: "Only buyer or 8th Ledger can release escrow" };
  }

  // Must be past 48h OR admin override
  if (escrow.hoursRemaining > 0 && !isAdmin) {
    return { success: false, error: `Escrow holds for ${escrow.hoursRemaining.toFixed(1)} more hours` };
  }

  const isFullSale = !listing.isFractional;
  const feeRate = getMarketplaceFeePercent(isFullSale, listing.hall?.sriScore ?? 50);
  const fee = round2(listing.totalPrice * feeRate);
  let sellerProceeds = round2(listing.totalPrice - fee);

  const buyerId = listing.buyerId!;
  const timestamp = new Date().toISOString();
  const transferHash = generateTransferHash(
    listing.seller.ledgerId,
    buyerId,
    listing.hallId,
    listing.percentListed,
    listing.totalPrice,
    timestamp
  );

  await prisma.$transaction(async (tx) => {
    // Deduct seller debts from proceeds
    const sellerOwnership = await tx.ownership.findUnique({
      where: { id: listing.ownershipId },
      select: { pirDebt: true, ihcpDebt: true },
    });

    let pirDeduction = 0;
    let ihcpDeduction = 0;

    if (sellerOwnership) {
      pirDeduction = Math.min(sellerOwnership.pirDebt, Math.round(sellerProceeds));
      ihcpDeduction = Math.min(sellerOwnership.ihcpDebt, Math.round(sellerProceeds - pirDeduction));
      sellerProceeds = round2(sellerProceeds - pirDeduction - ihcpDeduction);

      if (pirDeduction > 0) {
        await tx.ownership.update({
          where: { id: listing.ownershipId },
          data: { pirDebt: { decrement: pirDeduction } },
        });
      }
      if (ihcpDeduction > 0) {
        await tx.ownership.update({
          where: { id: listing.ownershipId },
          data: { ihcpDebt: { decrement: ihcpDeduction } },
        });
      }
    }

    // Reduce seller ownership
    await tx.ownership.update({
      where: { id: listing.ownershipId },
      data: {
        ownershipPercent: { decrement: listing.percentListed },
        totalFromMarket: { increment: sellerProceeds },
      },
    });

    // Create or update buyer ownership
    const existingBuyer = await tx.ownership.findFirst({
      where: { hallId: listing.hallId, userId: buyerId },
    });

    if (existingBuyer) {
      await tx.ownership.update({
        where: { id: existingBuyer.id },
        data: {
          ownershipPercent: { increment: listing.percentListed },
        },
      });
    } else {
      await tx.ownership.create({
        data: {
          poolId: listing.ownership.poolId,
          userId: buyerId,
          hallId: listing.hallId,
          amountCommitted: 0,
          ownershipPercent: listing.percentListed,
          status: "active",
          totalReturned: 0,
          totalFromMarket: 0,
          dynamicValue: 0,
          accumulatedDividends: 0,
          pirDebt: 0,
          ihcpDebt: 0,
        },
      });
    }

    // Mark listing sold with audit hash
    await tx.ownershipListing.update({
      where: { id: listingId },
      data: { status: "sold", soldAt: new Date(), auditHash: transferHash },
    });

    // Unlock buyer funds and credit seller
    const buyerWallet = await tx.wallet.findUnique({ where: { ledgerId: buyerId } });
    if (buyerWallet) {
      await tx.wallet.update({
        where: { ledgerId: buyerId },
        data: {
          lockedBalance: { decrement: round2(listing.totalPrice + fee) },
        },
      });
    }

    const sellerWallet = await tx.wallet.findUnique({ where: { ledgerId: listing.seller.ledgerId } });
    if (sellerWallet) {
      await tx.wallet.update({
        where: { ledgerId: listing.seller.ledgerId },
        data: {
          balance: { increment: sellerProceeds },
        },
      });
    }

    // Hall activity
    await tx.hallActivity.create({
      data: {
        hallId: listing.hallId,
        type: "ownership_transfer",
        description: `${listing.seller.ledgerId} transferred ${listing.percentListed}% to ${buyerId}`,
        metadata: JSON.stringify({ listingId, percent: listing.percentListed, hash: transferHash }),
      },
    });

    // Audit with hash
    await tx.auditEntry.create({
      data: {
        type: "ownership_transferred",
        description: `PAC transferred: ${listing.percentListed}% of Hall ${listing.hallId}. Fee: $${fee}. PIR debt: $${pirDeduction}. IHCP debt: $${ihcpDeduction}. Net to seller: $${sellerProceeds}. Hash: ${transferHash}`,
        amount: Math.round(listing.totalPrice),
        txHash: transferHash,
        ledgerId: listing.seller.ledgerId,
      },
    });
  });

  return {
    success: true,
    order: {
      id: generateOrderId(),
      listingId,
      status: "completed",
      escrowReleasedAt: new Date(),
    },
  };
}

/**
 * Buyer cancel within 48h — full refund.
 */
export async function refundBuyer(
  listingId: string,
  buyerId: string
): Promise<{ success: boolean; error?: string }> {
  const listing = await prisma.ownershipListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return { success: false, error: "Listing not found" };
  if (listing.buyerId !== buyerId) return { success: false, error: "Only the buyer can request refund" };
  if (listing.status !== "pending_sale") return { success: false, error: `Listing is ${listing.status}` };

  const escrow = await getEscrowStatus(listingId);
  if (!escrow || !escrow.canBuyerCancel) {
    return { success: false, error: "Refund window expired (48h)" };
  }

  await prisma.$transaction(async (tx) => {
    // Refund buyer wallet
    const isFullSale = !listing.isFractional;
    const feeRate = getMarketplaceFeePercent(isFullSale, 50); // default SRI for refund calc
    const fee = round2(listing.totalPrice * feeRate);
    const totalPayment = round2(listing.totalPrice + fee);

    const buyerWallet = await tx.wallet.findUnique({ where: { ledgerId: buyerId } });
    if (buyerWallet) {
      await tx.wallet.update({
        where: { ledgerId: buyerId },
        data: {
          balance: { increment: totalPayment },
          lockedBalance: { decrement: totalPayment },
        },
      });
    }

    await tx.ownershipListing.update({
      where: { id: listingId },
      data: { status: "refunded", buyerId: null, escrowStartedAt: null, escrowExpiresAt: null },
    });

    await tx.auditEntry.create({
      data: {
        type: "ownership_refunded",
        description: `Buyer refunded for listing ${listingId}. Full refund within 48h window. Amount: $${totalPayment}`,
        txHash: `REFUND-${listingId}`,
        ledgerId: buyerId,
      },
    });
  });

  return { success: true };
}

/**
 * Cancel ownership listing (seller only, no penalty, only if no buyer yet).
 */
export async function cancelOwnershipListing(
  listingId: string,
  sellerId: string
): Promise<{ success: boolean; error?: string }> {
  const listing = await prisma.ownershipListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return { success: false, error: "Listing not found" };
  if (listing.sellerId !== sellerId) return { success: false, error: "Only the seller can cancel" };
  if (listing.status !== "active") return { success: false, error: `Cannot cancel ${listing.status} listing` };
  if (listing.buyerId) return { success: false, error: "Cannot cancel — buyer has initiated purchase" };

  await prisma.ownershipListing.update({
    where: { id: listingId },
    data: { status: "cancelled" },
  });

  return { success: true };
}

/* ============================================================
   INVENTORY MARKET — Physical Products (Any hall with inventory enabled)
   ============================================================ */

/**
 * Create an inventory listing. Requires hall to have inventoryEnabled=true.
 */
export async function createInventoryListing(input: InventoryListingInput): Promise<{
  success: boolean;
  item?: { id: string; status: string };
  error?: string;
}> {
  // Check hall has inventory enabled
  const hall = await prisma.hall.findUnique({
    where: { id: input.hallId },
    include: { pool: { select: { assetType: true, verticalId: true } } },
  });

  if (!hall) return { success: false, error: "Hall not found" };
  if (!hall.inventoryEnabled) {
    return { success: false, error: "Inventory not enabled for this hall. Propose enablement via vote." };
  }

  // Verify seller is hall member
  const membership = await prisma.ownership.findFirst({
    where: { hallId: input.hallId, userId: input.sellerId, status: "active" },
  });
  if (!membership) return { success: false, error: "Not an active owner of this hall" };

  if (input.price <= 0) return { success: false, error: "Price must be positive" };
  if (input.quantity <= 0) return { success: false, error: "Quantity must be positive" };

  const item = await prisma.inventoryItem.create({
    data: {
      hallId: input.hallId,
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      quantity: input.quantity,
      costOfGoods: input.costOfGoods ?? 0,
      reorderThreshold: input.reorderThreshold ?? 0,
      status: "active",
      listedAt: new Date(),
      images: input.images ? JSON.stringify(input.images) : null,
    },
  });

  return { success: true, item: { id: item.id, status: item.status } };
}

/**
 * Get inventory listings (public — any hall with inventory enabled).
 */
export async function getInventoryListings(filters: {
  hallId?: string;
  verticalId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
  const where: Prisma.InventoryItemWhereInput = { status: "active" };
  if (filters.hallId) where.hallId = filters.hallId;
  if (filters.minPrice !== undefined) where.price = { gte: filters.minPrice };
  if (filters.maxPrice !== undefined) {
    where.price = { ...(where.price as object || {}), lte: filters.maxPrice };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { listedAt: "desc" },
      skip: ((filters.page || 1) - 1) * (filters.limit || 20),
      take: filters.limit || 20,
      include: {
        hall: {
          select: {
            name: true,
            inventoryEnabled: true,
            pool: { select: { verticalId: true, name: true, assetType: true } },
          },
        },
      },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  let enriched = items.map((item) => ({
    ...item,
    verticalId: item.hall?.pool?.verticalId,
    poolName: item.hall?.pool?.name,
    assetType: item.hall?.pool?.assetType,
  }));

  if (filters.verticalId) {
    enriched = enriched.filter((i) => i.verticalId === filters.verticalId);
  }

  return { items: enriched, total };
}

/**
 * Buy inventory item (public, no KYC for <$500).
 */
export async function buyInventory(input: {
  inventoryId: string;
  buyerId: string;
  quantity: number;
  buyerKycTier?: string;
  buyerLedgerId?: string;
}): Promise<InventoryOrderResult> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: input.inventoryId },
    include: {
      hall: { select: { id: true, name: true, poolId: true, inventoryEnabled: true } },
    },
  });

  if (!item) return { success: false, error: "Item not found" };
  if (!item.hall.inventoryEnabled) return { success: false, error: "Hall inventory not enabled" };
  if (item.status !== "active") return { success: false, error: `Item is ${item.status}` };
  if (item.quantity < input.quantity) return { success: false, error: `Only ${item.quantity} available` };

  const totalAmount = item.price * input.quantity;

  // KYC for B2B / large orders
  if (totalAmount >= 500 && (!input.buyerKycTier || input.buyerKycTier === "visitor")) {
    return { success: false, error: "KYC verification required for purchases >= $500" };
  }

  // Calculate fee breakdown per blueprint
  const platformFee = Math.round(totalAmount * MARKETPLACE_CONSTANTS.INVENTORY_PLATFORM_FEE);
  const fulfillmentCost = Math.round(totalAmount * MARKETPLACE_CONSTANTS.INVENTORY_FULFILLMENT_PCT);
  const netToHall = totalAmount - platformFee - fulfillmentCost;

  // Wallet check for large orders
  if (totalAmount >= 500 && input.buyerLedgerId) {
    const wallet = await prisma.wallet.findUnique({ where: { ledgerId: input.buyerLedgerId } });
    if (!wallet || wallet.balance < totalAmount) {
      return { success: false, error: "Insufficient wallet balance" };
    }
  }

  const orderId = generateOrderId();

  await prisma.$transaction(async (tx) => {
    await tx.inventoryOrder.create({
      data: {
        id: orderId,
        inventoryId: item.id,
        buyerId: input.buyerId,
        amount: totalAmount,
        quantity: input.quantity,
        status: "pending",
        platformFee,
        fulfillmentCost,
        netToHall,
      },
    });

    await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantity: { decrement: input.quantity },
        quantitySold: { increment: input.quantity },
        status: item.quantity - input.quantity <= 0 ? "sold_out" : item.status,
      },
    });
  });

  return {
    success: true,
    order: { id: orderId, inventoryId: item.id, status: "pending" },
  };
}

/**
 * Fulfill inventory order (8th Ledger executes).
 */
export async function fulfillInventoryOrder(
  orderId: string,
  fulfillerId: string,
  isAdmin: boolean
): Promise<InventoryOrderResult> {
  if (!isAdmin) return { success: false, error: "8th Ledger authority required" };

  const order = await prisma.inventoryOrder.findUnique({
    where: { id: orderId },
    include: {
      inventory: { include: { hall: { select: { poolId: true } } } },
    },
  });

  if (!order) return { success: false, error: "Order not found" };
  if (order.status !== "pending" && order.status !== "paid") {
    return { success: false, error: `Order is ${order.status}` };
  }

  // Lookup actual treasury record by hallId
  const treasury = await prisma.hallTreasury.findUnique({
    where: { hallId: order.inventory.hallId },
  });
  if (!treasury) return { success: false, error: "Hall treasury not found" };

  await prisma.$transaction(async (tx) => {
    await tx.inventoryOrder.update({
      where: { id: orderId },
      data: { status: "completed", escrowReleasedAt: new Date(), completedAt: new Date() },
    });

    await tx.hallTreasury.update({
      where: { id: treasury.id },
      data: {
        balance: { increment: order.netToHall },
        totalRevenue: { increment: order.netToHall },
        monthlyRevenue: { increment: order.netToHall },
      },
    });

    await tx.hallTreasuryTransaction.create({
      data: {
        treasuryId: treasury.id,
        type: "inventory_sale",
        amount: order.netToHall,
        description: `Inventory sale: ${order.inventory.title} x${order.quantity}`,
      },
    });

    await tx.auditEntry.create({
      data: {
        type: "inventory_sale_completed",
        description: `Inventory fulfilled: ${order.inventory.title} x${order.quantity}. Net to hall: $${order.netToHall}. Platform fee: $${order.platformFee}. Fulfillment: $${order.fulfillmentCost}`,
        amount: order.amount,
        txHash: `INV-ORD-${orderId}`,
        poolId: order.inventory.hall.poolId,
      },
    });
  });

  return {
    success: true,
    order: { id: orderId, inventoryId: order.inventoryId, status: "completed", escrowReleasedAt: new Date() },
  };
}

/* ============================================================
   SALES VELOCITY — Ownership Market
   ============================================================ */
export async function getOwnershipSalesVelocity(hallId: string): Promise<{
  listings3mo: number;
  listings6mo: number;
  listings24mo: number;
  gmv3mo: number;
  gmv6mo: number;
  gmv24mo: number;
  turnoverRate: number;
  warning: { level: string; message: string } | null;
}> {
  const now = new Date();
  const since3mo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const since6mo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const since24mo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

  const [l3, l6, l24] = await Promise.all([
    prisma.ownershipListing.findMany({ where: { hallId, soldAt: { gte: since3mo }, status: "sold" }, select: { totalPrice: true } }),
    prisma.ownershipListing.findMany({ where: { hallId, soldAt: { gte: since6mo }, status: "sold" }, select: { totalPrice: true } }),
    prisma.ownershipListing.findMany({ where: { hallId, soldAt: { gte: since24mo }, status: "sold" }, select: { totalPrice: true } }),
  ]);

  const listings3mo = l3.length;
  const listings6mo = l6.length;
  const listings24mo = l24.length;
  const gmv3mo = l3.reduce((s, l) => s + Number(l.totalPrice), 0);
  const gmv6mo = l6.reduce((s, l) => s + Number(l.totalPrice), 0);
  const gmv24mo = l24.reduce((s, l) => s + Number(l.totalPrice), 0);

  const totalOwnerships = await prisma.ownership.count({ where: { hallId, status: "active" } });
  const turnoverRate = totalOwnerships > 0 ? round2((listings24mo / totalOwnerships) * 100) : 0;

  let warning: { level: string; message: string } | null = null;
  if (turnoverRate > 50) warning = { level: "high_turnover", message: "High PAC turnover detected. Hall stability at risk." };
  else if (turnoverRate > 30) warning = { level: "moderate", message: "Elevated PAC turnover. Monitor hall health." };

  return { listings3mo, listings6mo, listings24mo, gmv3mo, gmv6mo, gmv24mo, turnoverRate, warning };
}

/* ============================================================
   INVENTORY VELOCITY
   ============================================================ */
export async function getInventorySalesVelocity(hallId: string): Promise<{
  itemsSold30d: number;
  revenue30d: number;
  lowStockAlerts: Array<{ id: string; title: string; qty: number; threshold: number }>;
}> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orders = await prisma.inventoryOrder.findMany({
    where: { inventory: { hallId }, status: "completed", completedAt: { gte: since30d } },
    include: { inventory: { select: { title: true } } },
  });

  const itemsSold30d = orders.reduce((s, o) => s + o.quantity, 0);
  const revenue30d = orders.reduce((s, o) => s + o.amount, 0);

  // Fetch all active inventory and filter low stock in memory
  const allItems = await prisma.inventoryItem.findMany({
    where: { hallId, status: "active" },
    select: { id: true, title: true, quantity: true, reorderThreshold: true },
  });

  const lowStockAlerts = allItems
    .filter((i) => i.quantity <= i.reorderThreshold)
    .map((i) => ({ id: i.id, title: i.title, qty: i.quantity, threshold: i.reorderThreshold }));

  return { itemsSold30d, revenue30d, lowStockAlerts };
}