import { prisma } from "./prisma";

/* ============================================================
   TYPES
   ============================================================ */

export interface ValuationComponents {
  assetBookValuePerPercent: number;
  accumulatedDividendsPerPercent: number;
  ahgiPremium: number;
  sriBonus: number;
  pirDebtPerPercent: number;
}

export interface ValuationResult {
  valuePerPercent: number;
  totalValue: number;
  ownershipPercent: number;
  floorPrice: number;
  components: ValuationComponents;
  calculatedAt: Date;
}

export interface ListingValidation {
  valid: boolean;
  floorPrice: number;
  listingPrice: number;
  percentListed: number;
  requiresHallVote: boolean;
  message?: string;
}

export interface SaleProceeds {
  grossAmount: number;
  ledgerFee: number;
  pirDebtDeduction: number;
  netToSeller: number;
  feePercent: number;
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const AHGI_PREMIUM_RATE = 10; // $10 per point above/below 50
const SRI_BONUSES: Record<string, number> = {
  platinum: 50,
  gold: 30,
  silver: 10,
  bronze: 0,
  at_risk: -20,
};

const FULL_SALE_FEE_PCT = 0.01; // 1%
const FRACTIONAL_SALE_FEE_PCT = 0.02; // 2%
const MIN_OWNERSHIP_AFTER_SALE = 0.1; // 0.1% hard floor

/* ============================================================
   SRI TIER HELPERS
   ============================================================ */

function getSriTierFromScore(score: number): string {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  if (score >= 40) return "bronze";
  return "at_risk";
}

function getSriBonus(sriScore: number): number {
  const tier = getSriTierFromScore(sriScore);
  return SRI_BONUSES[tier] ?? 0;
}

/* ============================================================
   CORE VALUATION FORMULA
   ============================================================ */

/**
 * Calculate Dynamic PAC Valuation per 1%.
 *
 * Formula:
 *   Asset Book Value / 100
 *   + Accumulated Dividends per 1%
 *   + AHGI Premium: (AHGI - 50) × $10
 *   + SRI Tier Bonus
 *   - PIR Debt per 1%
 */
export function calculateValuePerPercent(
  assetBookValue: number,
  accumulatedDividendsPerPercent: number,
  ahgiScore: number,
  sriScore: number,
  pirDebtPerPercent: number,
): number {
  const base = assetBookValue / 100;
  const ahgiPremium = (ahgiScore - 50) * AHGI_PREMIUM_RATE;
  const sriBonus = getSriBonus(sriScore);

  const raw =
    base +
    accumulatedDividendsPerPercent +
    ahgiPremium +
    sriBonus -
    pirDebtPerPercent;

  return Math.max(0, Math.round(raw * 100) / 100);
}

/* ============================================================
   HALL-LEVEL VALUATION
   ============================================================ */

/**
 * Calculate and store dynamic valuation for a hall.
 * Updates all ownerships' dynamicValue.
 */
export async function calculateHallValuation(
  hallId: string,
): Promise<Array<ValuationResult & { ownershipId: string; userId: string }>> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      pool: { select: { assetBookValue: true } },
      ownerships: {
        where: { status: "active" },
        select: {
          id: true,
          userId: true,
          ownershipPercent: true,
          accumulatedDividends: true,
          pirDebt: true,
          dynamicValue: true,
        },
      },
    },
  });

  if (!hall) throw new Error("Hall not found");

  const assetBookValue = hall.pool?.assetBookValue || 0;
  const ahgiScore = hall.ahgiScore;
  const sriScore = hall.sriScore;
  const hallPirDebt = hall.pirDebt;

  // Total ownership percent (should be ~100)
  const totalOwnershipPercent = hall.ownerships.reduce(
    (s, o) => s + Number(o.ownershipPercent),
    0,
  );

  const results = await prisma.$transaction(async (tx) => {
    const valuations: Array<
      ValuationResult & { ownershipId: string; userId: string }
    > = [];

    for (const ownership of hall.ownerships) {
      const percent = Number(ownership.ownershipPercent);

      // Accumulated dividends per 1%
      const accumulatedDividendsPerPercent =
        percent > 0 ? ownership.accumulatedDividends / percent : 0;

      // PIR debt per 1%: use ownership's share if tracked, else hall's pro-rata
      const ownershipPirDebtPerPercent =
        percent > 0 && ownership.pirDebt > 0
          ? ownership.pirDebt / percent
          : totalOwnershipPercent > 0
            ? hallPirDebt / totalOwnershipPercent
            : 0;

      const valuePerPercent = calculateValuePerPercent(
        assetBookValue,
        accumulatedDividendsPerPercent,
        ahgiScore,
        sriScore,
        ownershipPirDebtPerPercent,
      );
      const sriBonus = getSriBonus(sriScore);

      const totalValue = Math.round(valuePerPercent * percent * 100) / 100;

      // Update ownership dynamicValue
      await tx.ownership.update({
        where: { id: ownership.id },
        data: { dynamicValue: totalValue },
      });

      valuations.push({
        ownershipId: ownership.id,
        userId: ownership.userId,
        valuePerPercent,
        totalValue,
        ownershipPercent: percent,
        floorPrice: valuePerPercent,
        components: {
          assetBookValuePerPercent:
            Math.round((assetBookValue / 100) * 100) / 100,
          accumulatedDividendsPerPercent:
            Math.round(accumulatedDividendsPerPercent * 100) / 100,
          ahgiPremium:
            Math.round((ahgiScore - 50) * AHGI_PREMIUM_RATE * 100) / 100,
          sriBonus,
          pirDebtPerPercent: Math.round(ownershipPirDebtPerPercent * 100) / 100,
        },
        calculatedAt: new Date(),
      });
    }

    // Create dynamic valuation snapshot
    await tx.dynamicValuation.create({
      data: {
        hallId,
        assetBookValue,
        accumulatedDividendsPerPercent:
          hall.ownerships.length > 0
            ? Math.round(
                (hall.ownerships.reduce(
                  (s, o) => s + o.accumulatedDividends,
                  0,
                ) /
                  hall.ownerships.reduce(
                    (s, o) => s + Number(o.ownershipPercent),
                    0,
                  )) *
                  100,
              ) / 100
            : 0,
        ahgiPremium:
          Math.round((ahgiScore - 50) * AHGI_PREMIUM_RATE * 100) / 100,
        sriBonus: getSriBonus(sriScore),
        pirDebtPerPercent:
          totalOwnershipPercent > 0
            ? Math.round((hallPirDebt / totalOwnershipPercent) * 100) / 100
            : 0,
        valuePerPercent:
          valuations.length > 0
            ? valuations.reduce((s, v) => s + v.valuePerPercent, 0) /
              valuations.length
            : 0,
      },
    });

    return valuations;
  });

  return results;
}

/* ============================================================
   SINGLE OWNERSHIP VALUATION
   ============================================================ */

/**
 * Get current valuation for a single ownership.
 */
export async function getOwnershipValuation(
  ownershipId: string,
): Promise<ValuationResult | null> {
  const ownership = await prisma.ownership.findUnique({
    where: { id: ownershipId },
    include: {
      hall: {
        include: {
          pool: { select: { assetBookValue: true } },
        },
      },
    },
  });

  if (!ownership || !ownership.hall) return null;

  const hall = ownership.hall;
  const assetBookValue = hall.pool?.assetBookValue || 0;
  const percent = Number(ownership.ownershipPercent);

  const accumulatedDividendsPerPercent =
    percent > 0 ? ownership.accumulatedDividends / percent : 0;

  const totalOwnershipPercent = await prisma.ownership
    .aggregate({
      where: { hallId: hall.id, status: "active" },
      _sum: { ownershipPercent: true },
    })
    .then((r) => Number(r._sum.ownershipPercent) || 100);

  const pirDebtPerPercent =
    percent > 0 && ownership.pirDebt > 0
      ? ownership.pirDebt / percent
      : totalOwnershipPercent > 0
        ? hall.pirDebt / totalOwnershipPercent
        : 0;

  const valuePerPercent = calculateValuePerPercent(
    assetBookValue,
    accumulatedDividendsPerPercent,
    hall.ahgiScore,
    hall.sriScore,
    pirDebtPerPercent,
  );

  const totalValue = Math.round(valuePerPercent * percent * 100) / 100;

  return {
    valuePerPercent,
    totalValue,
    ownershipPercent: percent,
    floorPrice: valuePerPercent,
    components: {
      assetBookValuePerPercent: Math.round((assetBookValue / 100) * 100) / 100,
      accumulatedDividendsPerPercent:
        Math.round(accumulatedDividendsPerPercent * 100) / 100,
      ahgiPremium:
        Math.round((hall.ahgiScore - 50) * AHGI_PREMIUM_RATE * 100) / 100,
      sriBonus: getSriBonus(hall.sriScore),
      pirDebtPerPercent: Math.round(pirDebtPerPercent * 100) / 100,
    },
    calculatedAt: new Date(),
  };
}

/* ============================================================
   LISTING VALIDATION
   ============================================================ */

/**
 * Validate a PAC listing against floor price rules.
 */
export async function validateListing(
  ownershipId: string,
  percentListed: number,
  pricePerPercent: number,
): Promise<ListingValidation> {
  const ownership = await prisma.ownership.findUnique({
    where: { id: ownershipId },
    select: {
      ownershipPercent: true,
      pirDebt: true,
      hallId: true,
      dynamicValue: true,
    },
  });

  if (!ownership) {
    return {
      valid: false,
      floorPrice: 0,
      listingPrice: pricePerPercent,
      percentListed,
      requiresHallVote: false,
      message: "Ownership not found",
    };
  }

  const valuation = await getOwnershipValuation(ownershipId);
  if (!valuation) {
    return {
      valid: false,
      floorPrice: 0,
      listingPrice: pricePerPercent,
      percentListed,
      requiresHallVote: false,
      message: "Valuation not available",
    };
  }

  const floorPrice = valuation.floorPrice;
  const belowFloor = pricePerPercent < floorPrice;
  const requiresHallVote = belowFloor;

  // Check min ownership after sale
  const remainingPercent = Number(ownership.ownershipPercent) - percentListed;
  if (remainingPercent > 0 && remainingPercent < MIN_OWNERSHIP_AFTER_SALE) {
    return {
      valid: false,
      floorPrice,
      listingPrice: pricePerPercent,
      percentListed,
      requiresHallVote: false,
      message: `Minimum ownership after sale is ${MIN_OWNERSHIP_AFTER_SALE}%. You would have ${remainingPercent.toFixed(2)}%. Sell all or keep above threshold.`,
    };
  }

  // Check max fraction per listing (25% default)
  const maxFraction = Number(ownership.ownershipPercent) * 0.25;
  if (percentListed > maxFraction) {
    return {
      valid: false,
      floorPrice,
      listingPrice: pricePerPercent,
      percentListed,
      requiresHallVote: false,
      message: `Max fraction per listing is 25% of your ownership (${maxFraction.toFixed(2)}%).`,
    };
  }

  if (belowFloor && !requiresHallVote) {
    return {
      valid: false,
      floorPrice,
      listingPrice: pricePerPercent,
      percentListed,
      requiresHallVote: true,
      message: `Price $${pricePerPercent.toFixed(2)} is below floor $${floorPrice.toFixed(2)}. Requires hall vote (51%).`,
    };
  }

  return {
    valid: true,
    floorPrice,
    listingPrice: pricePerPercent,
    percentListed,
    requiresHallVote: false,
  };
}

/* ============================================================
   SALE PROCEEDS CALCULATION
   ============================================================ */

/**
 * Calculate net proceeds for a PAC sale.
 */
export function calculateSaleProceeds(
  totalPrice: number,
  isFractional: boolean,
  sellerPirDebt: number = 0,
): SaleProceeds {
  const feePercent = isFractional ? FRACTIONAL_SALE_FEE_PCT : FULL_SALE_FEE_PCT;
  const ledgerFee = Math.round(totalPrice * feePercent * 100) / 100;
  const pirDebtDeduction = sellerPirDebt;
  const netToSeller =
    Math.round((totalPrice - ledgerFee - pirDebtDeduction) * 100) / 100;

  return {
    grossAmount: totalPrice,
    ledgerFee,
    pirDebtDeduction,
    netToSeller,
    feePercent,
  };
}

/* ============================================================
   AUTO-ADJUST ACTIVE LISTINGS
   ============================================================ */

/**
 * Recalculate valuations and auto-adjust active listings.
 * Called monthly by cron or admin.
 */
export async function autoAdjustListings(hallId: string): Promise<
  Array<{
    listingId: string;
    oldPrice: number;
    newPrice: number;
    adjusted: boolean;
  }>
> {
  // Recalculate hall valuations first
  await calculateHallValuation(hallId);

  const listings = await prisma.ownershipListing.findMany({
    where: { hallId, status: "active" },
    include: {
      ownership: {
        select: { dynamicValue: true, ownershipPercent: true, pirDebt: true },
      },
    },
  });

  const adjustments: Array<{
    listingId: string;
    oldPrice: number;
    newPrice: number;
    adjusted: boolean;
  }> = [];

  for (const listing of listings) {
    const percent = Number(listing.percentListed);
    const oldPrice = listing.pricePerPercent;

    // Get updated floor from ownership's dynamic value
    const ownershipValue = listing.ownership.dynamicValue;
    const ownershipPercent = Number(listing.ownership.ownershipPercent);
    const newFloor =
      ownershipPercent > 0
        ? Math.round((ownershipValue / ownershipPercent) * 100) / 100
        : oldPrice;

    // If listing is below new floor, auto-adjust up to floor
    let newPrice = oldPrice;
    let adjusted = false;

    if (oldPrice < newFloor) {
      newPrice = newFloor;
      adjusted = true;

      await prisma.ownershipListing.update({
        where: { id: listing.id },
        data: {
          pricePerPercent: newPrice,
          totalPrice: Math.round(newPrice * percent * 100) / 100,
          floorPrice: newFloor,
        },
      });
    }

    adjustments.push({
      listingId: listing.id,
      oldPrice,
      newPrice,
      adjusted,
    });
  }

  return adjustments;
}

/* ============================================================
   QUERIES
   ============================================================ */

/**
 * Get latest dynamic valuation snapshot for a hall.
 */
export async function getLatestValuationSnapshot(hallId: string) {
  return prisma.dynamicValuation.findFirst({
    where: { hallId },
    orderBy: { calculatedAt: "desc" },
  });
}

/**
 * Get valuation history for a hall.
 */
export async function getValuationHistory(hallId: string, limit: number = 12) {
  return prisma.dynamicValuation.findMany({
    where: { hallId },
    orderBy: { calculatedAt: "desc" },
    take: limit,
  });
}

/**
 * Get global valuation leaderboard (highest value per %).
 */
export async function getGlobalValuationLeaderboard(limit: number = 50) {
  const halls = await prisma.hall.findMany({
    where: { status: { not: "dissolved" } },
    include: {
      pool: { select: { name: true, verticalId: true } },
      dynamicValuations: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
    orderBy: { ahgiScore: "desc" },
    take: limit,
  });

  return halls.map((h) => ({
    hallId: h.id,
    hallName: h.name || h.pool?.name || "Unknown",
    valuePerPercent: h.dynamicValuations[0]?.valuePerPercent || 0,
    assetBookValue: h.dynamicValuations[0]?.assetBookValue || 0,
    verticalId: h.pool?.verticalId || null,
    calculatedAt: h.dynamicValuations[0]?.calculatedAt || null,
  }));
}

/**
 * Check if a listing price is valid (at or above floor).
 */
export async function isValidListingPrice(
  ownershipId: string,
  pricePerPercent: number,
): Promise<boolean> {
  const valuation = await getOwnershipValuation(ownershipId);
  if (!valuation) return false;
  return pricePerPercent >= valuation.floorPrice;
}

/**
 * Get floor price for an ownership.
 */
export async function getFloorPrice(ownershipId: string): Promise<number> {
  const valuation = await getOwnershipValuation(ownershipId);
  return valuation?.floorPrice || 0;
}
