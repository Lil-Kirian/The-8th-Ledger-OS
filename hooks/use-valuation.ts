import useSWR from "swr";

/* ============================================================
   TYPES
   ============================================================ */

export interface ValuationComponent {
  assetBookValuePerPercent: number;
  accumulatedDividendsPerPercent: number;
  ahgiPremium: number;
  sriBonus: number;
  pirDebtPerPercent: number;
}

export interface OwnershipValuation {
  ownershipId: string;
  userId: string;
  ledgerId: string | null;
  displayName: string | null;
  kycTier: string | null;
  ownershipPercent: number;
  accumulatedDividends: number;
  pirDebt: number;
  dynamicValue: number;
  totalValue: number;
  valuePerPercent: number;
  components: ValuationComponent | null;
}

export interface HallValuation {
  hall: {
    id: string;
    name: string | null;
    poolId: string | null;
    verticalId: string | null;
    assetBookValue: number | null;
    sriScore: number;
    ahgiScore: number;
  };
  valuation: {
    snapshotId: string | null;
    calculatedAt: string;
    valuePerPercent: number;
    assetBookValue: number;
    accumulatedDividendsPerPercent: number;
    ahgiPremium: number;
    sriBonus: number;
    pirDebtPerPercent: number;
  };
  ownerships: OwnershipValuation[];
  totalOwnerships: number;
  totalValued: number;
}

export interface ValuationFormula {
  formula: string;
  components: {
    assetBookValue: string;
    accumulatedDividends: string;
    ahgiPremium: string;
    sriBonus: string;
    pirDebt: string;
  };
  example: {
    assetBookValue: number;
    accumulatedDividendsPerPercent: number;
    ahgiScore: number;
    ahgiPremium: number;
    sriTier: string;
    sriBonus: number;
    pirDebtPerPercent: number;
    calculatedValue: number;
  };
  rules: {
    floorPrice: string;
    aboveFloor: string;
    belowFloor: string;
    feeFull: string;
    feeFractional: string;
    autoUpdate: string;
  };
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
   FETCHER
   ============================================================ */

const fetchJson = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   HOOKS
   ============================================================ */

export function useValuation(hallId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<HallValuation>(
    hallId ? `/api/valuation/hall/${hallId}` : null,
    fetchJson,
    { refreshInterval: 300000 }
  );

  return {
    valuation: data?.valuation,
    hall: data?.hall,
    ownerships: data?.ownerships || [],
    totalOwnerships: data?.totalOwnerships || 0,
    totalValued: data?.totalValued || 0,
    isLoading,
    error,
    mutate,
  };
}

export function useValuationFormula() {
  const { data, error, isLoading } = useSWR<ValuationFormula>(
    "/api/valuation",
    fetchJson,
    { revalidateOnFocus: false }
  );

  return {
    formula: data?.formula,
    components: data?.components,
    example: data?.example,
    rules: data?.rules,
    isLoading,
    error,
  };
}

/* ============================================================
   MUTATIONS
   ============================================================ */

export async function validateListing(
  ownershipId: string,
  percentListed: number,
  pricePerPercent: number
): Promise<ListingValidation> {
  const res = await fetch(`/api/marketplace/ownership/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownershipId, percentListed, pricePerPercent }),
  });
  return res.json();
}

export async function autoAdjustListings(hallId: string) {
  const res = await fetch(`/api/valuation/hall/${hallId}/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json() as Promise<{
    success: boolean;
    adjustedCount: number;
    newValuePerPercent: number;
  }>;
}

export function calculateSaleProceedsPreview(
  totalPrice: number,
  isFractional: boolean,
  pirDebt: number = 0
): SaleProceeds {
  const feePercent = isFractional ? 0.02 : 0.01;
  const ledgerFee = Math.round(totalPrice * feePercent);
  const pirDebtDeduction = pirDebt;
  const netToSeller = totalPrice - ledgerFee - pirDebtDeduction;

  return {
    grossAmount: totalPrice,
    ledgerFee,
    pirDebtDeduction,
    netToSeller,
    feePercent,
  };
}