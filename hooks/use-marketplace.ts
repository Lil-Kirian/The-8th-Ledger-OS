// hooks/use-marketplace.ts
"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Dual Marketplace
   ============================================================ */

// ── Ownership Market (PAC Trading) ──
export interface OwnershipListing {
  id: string;
  ownershipId: string;
  hallId: string;
  hallName: string;
  verticalId: string;
  hallClass: string;
  sriScore: number;
  ahgiScore: number;
  sellerId: string;
  seller: {
    ledgerId: string;
    displayName: string;
    kycTier: string;
  };
  percentListed: number;
  pricePerPercent: number;
  totalPrice: number;
  floorPrice: number;
  aboveValuation: number;
  status: "active" | "sold" | "cancelled" | "expired";
  listedAt: string;
  expiresAt: string;
  views: number;
  interest: number;
}

export interface OwnershipListingDetail extends OwnershipListing {
  ownership: {
    totalPercent: number;
    accumulatedDividends: number;
    dynamicValue: number;
    pirDebt: number;
  };
  hall: {
    monthlyRevenue: number;
    lastDistribution: string;
    closureStatus: string;
  };
  valuation: {
    assetBookValue: number;
    accumulatedDividendsPerPercent: number;
    ahgiPremium: number;
    sriBonus: number;
    pirDebtPerPercent: number;
    valuePerPercent: number;
    calculatedAt: string;
  };
}

export interface CreateOwnershipListingInput {
  ownershipId: string;
  hallId: string;
  percentListed: number;
  pricePerPercent: number;
  expiresAt?: string;
}

export interface BuyOwnershipInput {
  listingId: string;
  percentToBuy: number;
}

// ── Inventory Market (Physical Products) ──
export interface InventoryItem {
  id: string;
  hallId: string;
  hallName: string;
  verticalId: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  quantitySold: number;
  quantityAvailable: number;
  status: "active" | "sold_out" | "delisted" | "inactive";
  listedAt: string;
  imageUrl?: string;
  costOfGoods?: number;
  reorderThreshold?: number;
}

export interface InventoryOrder {
  id: string;
  inventoryId: string;
  item: InventoryItem;
  buyerId: string;
  buyer: {
    ledgerId: string;
    displayName: string;
  } | null;
  amount: number;
  quantity: number;
  status: "pending" | "paid" | "fulfilled" | "completed" | "disputed" | "refunded";
  escrowReleasedAt: string | null;
  createdAt: string;
  completedAt: string | null;
  platformFee?: number;
  fulfillmentCost?: number;
  netToHall?: number;
}

export interface CreateInventoryItemInput {
  hallId: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  costOfGoods?: number;
  reorderThreshold?: number;
  imageUrl?: string;
}

export interface BuyInventoryInput {
  inventoryId: string;
  quantity: number;
}

/* ============================================================
   FETCHER
   ============================================================ */
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  const json = await res.json();
  // Handle both wrapped { success: true, data: ... } and raw responses
  if (json.success === false) throw new Error(json.error || "Request failed");
  return json.success !== undefined ? json : { success: true, ...json };
};

/* ============================================================
   CONFIG
   ============================================================ */
const SWR_CONFIG = {
  revalidateOnFocus: true,
  dedupingInterval: 5000,
};

const POLLING_CONFIG = {
  revalidateOnFocus: true,
  refreshInterval: 10000,
  dedupingInterval: 5000,
};

const ESCROW_POLLING = {
  revalidateOnFocus: true,
  refreshInterval: 5000,
  dedupingInterval: 2000,
};

/* ============================================================
   HELPERS
   ============================================================ */

function enrichOwnershipListing(raw: Record<string, unknown>): OwnershipListing {
  const sellerRaw = raw.seller as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    ownershipId: String(raw.ownershipId || raw.ownership_id),
    hallId: String(raw.hallId || raw.hall_id),
    hallName: String(raw.hallName || raw.hall_name || "Hall"),
    verticalId: String(raw.verticalId || raw.vertical_id || "ledgerprop"),
    hallClass: String(raw.hallClass || raw.hall_class || "I"),
    sriScore: Number(raw.sriScore || raw.sri_score || 50),
    ahgiScore: Number(raw.ahgiScore || raw.ahgi_score || 50),
    sellerId: String(raw.sellerId || raw.seller_id),
    seller: sellerRaw
      ? {
          ledgerId: String(sellerRaw.ledgerId || ""),
          displayName: String(
            sellerRaw.displayName || sellerRaw.display_name || "",
          ),
          kycTier: String(sellerRaw.kycTier || sellerRaw.kyc_tier || "visitor"),
        }
      : { ledgerId: "", displayName: "", kycTier: "visitor" },
    percentListed: Number(raw.percentListed || raw.percent_listed || 0),
    pricePerPercent: Number(raw.pricePerPercent || raw.price_per_percent || 0),
    totalPrice: Number(raw.totalPrice || raw.total_price || 0),
    floorPrice: Number(raw.floorPrice || raw.floor_price || 0),
    aboveValuation: Number(raw.aboveValuation || raw.above_valuation || 0),
    status: String(raw.status || "active") as OwnershipListing["status"],
    listedAt: String(raw.listedAt || raw.listed_at || new Date().toISOString()),
    expiresAt: String(raw.expiresAt || raw.expires_at || ""),
    views: Number(raw.views || raw.viewCount || 0),
    interest: Number(raw.interest || raw.interestCount || 0),
  };
}

function enrichInventoryItem(raw: Record<string, unknown>): InventoryItem {
  const qty = Number(raw.quantity || 0);
  const sold = Number(raw.quantitySold || raw.quantity_sold || 0);
  return {
    id: String(raw.id),
    hallId: String(raw.hallId || raw.hall_id),
    hallName: String(raw.hallName || raw.hall_name || "Hall"),
    verticalId: String(raw.verticalId || raw.vertical_id || "ledgerbiz"),
    title: String(raw.title || ""),
    description: String(raw.description || ""),
    price: Number(raw.price || 0),
    quantity: qty,
    quantitySold: sold,
    quantityAvailable: Math.max(0, qty - sold),
    status: String(raw.status || "active") as InventoryItem["status"],
    listedAt: String(raw.listedAt || raw.listed_at || new Date().toISOString()),
    imageUrl: (raw.imageUrl || raw.image_url) as string | undefined,
    costOfGoods: Number(raw.costOfGoods || raw.cost_of_goods || 0),
    reorderThreshold: Number(raw.reorderThreshold || raw.reorder_threshold || 0),
  };
}

function enrichInventoryOrder(raw: Record<string, unknown>): InventoryOrder {
  const buyerRaw = raw.buyer as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    inventoryId: String(raw.inventoryId || raw.inventory_id),
    item: raw.item
      ? enrichInventoryItem(raw.item as Record<string, unknown>)
      : (raw.item as InventoryItem),
    buyerId: String(raw.buyerId || raw.buyer_id),
    buyer: buyerRaw
      ? {
          ledgerId: String(buyerRaw.ledgerId || buyerRaw.t8ledgerId || ""),
          displayName: String(
            buyerRaw.displayName || buyerRaw.display_name || "",
          ),
        }
      : null,
    amount: Number(raw.amount || 0),
    quantity: Number(raw.quantity || 1),
    status: String(raw.status || "pending") as InventoryOrder["status"],
    escrowReleasedAt:
      (raw.escrowReleasedAt as string) ||
      (raw.escrow_released_at as string) ||
      null,
    createdAt: String(
      raw.createdAt || raw.created_at || new Date().toISOString(),
    ),
    completedAt:
      (raw.completedAt as string) || (raw.completed_at as string) || null,
    platformFee: Number(raw.platformFee || raw.platform_fee || 0),
    fulfillmentCost: Number(raw.fulfillmentCost || raw.fulfillment_cost || 0),
    netToHall: Number(raw.netToHall || raw.net_to_hall || 0),
  };
}

/* ============================================================
   OWNERSHIP MARKET HOOKS
   ============================================================ */

interface OwnershipFilters {
  verticalId?: string;
  hallClass?: string;
  minPrice?: number;
  maxPrice?: number;
  minSri?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useOwnershipListings(filters: OwnershipFilters = {}) {
  const { verticalId, hallClass, minPrice, maxPrice, minSri, status, search, page = 1, limit = 20 } = filters;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (verticalId) params.set("verticalId", verticalId);
  if (hallClass) params.set("hallClass", hallClass);
  if (minPrice) params.set("minPrice", String(minPrice));
  if (maxPrice) params.set("maxPrice", String(maxPrice));
  if (minSri) params.set("minSri", String(minSri));
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  const qs = params.toString();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/marketplace/ownership?${qs}`,
    fetcher,
    SWR_CONFIG
  );

  const listings = useMemo(() => {
    if (!data?.listings) return [];
    return (data.listings as Record<string, unknown>[]).map(enrichOwnershipListing);
  }, [data]);

  return {
    listings,
    meta: data?.meta,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

export function useOwnershipListing(listingId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    listingId ? `/api/marketplace/ownership/${listingId}` : null,
    fetcher,
    SWR_CONFIG
  );

  const listing = useMemo(() => {
    if (!data?.listing) return undefined;
    return enrichOwnershipListing(data.listing as Record<string, unknown>) as OwnershipListingDetail;
  }, [data]);

  return {
    listing,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

export function useMyOwnershipListings() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/marketplace/ownership/my-listings",
    fetcher,
    SWR_CONFIG
  );

  const listings = useMemo(() => {
    if (!data?.listings) return [];
    return (data.listings as Record<string, unknown>[]).map(enrichOwnershipListing);
  }, [data]);

  const stats = useMemo(() => {
    return {
      total: listings.length,
      active: listings.filter((l) => l.status === "active").length,
      sold: listings.filter((l) => l.status === "sold").length,
      totalListedPercent: listings.reduce((s, l) => s + l.percentListed, 0),
      totalValue: listings.reduce((s, l) => s + l.totalPrice, 0),
    };
  }, [listings]);

  return {
    listings,
    stats,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   INVENTORY MARKET HOOKS
   ============================================================ */

interface InventoryFilters {
  hallId?: string;
  verticalId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useInventoryItems(filters: InventoryFilters = {}) {
  const { hallId, verticalId, minPrice, maxPrice, status, search, page = 1, limit = 20 } = filters;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (hallId) params.set("hallId", hallId);
  if (verticalId) params.set("verticalId", verticalId);
  if (minPrice) params.set("minPrice", String(minPrice));
  if (maxPrice) params.set("maxPrice", String(maxPrice));
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  const qs = params.toString();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/marketplace/inventory?${qs}`,
    fetcher,
    SWR_CONFIG
  );

  const items = useMemo(() => {
    if (!data?.items) return [];
    return (data.items as Record<string, unknown>[]).map(enrichInventoryItem);
  }, [data]);

  return {
    items,
    meta: data?.meta,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

export function useInventoryItem(itemId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    itemId ? `/api/marketplace/inventory/${itemId}` : null,
    fetcher,
    SWR_CONFIG
  );

  const item = useMemo(() => {
    if (!data?.item) return undefined;
    return enrichInventoryItem(data.item as Record<string, unknown>);
  }, [data]);

  return {
    item,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

export function useMyInventoryOrders() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/marketplace/inventory/my-orders",
    fetcher,
    SWR_CONFIG
  );

  const orders = useMemo(() => {
    if (!data?.orders) return [];
    return (data.orders as Record<string, unknown>[]).map(enrichInventoryOrder);
  }, [data]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending" || o.status === "paid").length,
      completed: orders.filter((o) => o.status === "completed").length,
      totalSpent: orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0),
    };
  }, [orders]);

  return {
    orders,
    stats,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

export function useInventoryOrder(orderId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? `/api/marketplace/inventory/orders/${orderId}` : null,
    fetcher,
    POLLING_CONFIG
  );

  const order = useMemo(() => {
    if (!data?.order) return undefined;
    return enrichInventoryOrder(data.order as Record<string, unknown>);
  }, [data]);

  // Aggressive polling if in pending/paid
  const isActive = order?.status === "pending" || order?.status === "paid";
  const { data: liveData } = useSWR(
    isActive && orderId ? `/api/marketplace/inventory/orders/${orderId}` : null,
    fetcher,
    ESCROW_POLLING
  );

  const liveOrder = useMemo(() => {
    if (!liveData?.order) return undefined;
    return enrichInventoryOrder(liveData.order as Record<string, unknown>);
  }, [liveData]);

  return {
    order: liveOrder || order,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HALL INVENTORY MANAGEMENT (Universal Operations — any class)
   ============================================================ */
export function useHallInventory(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/inventory` : null,
    fetcher,
    SWR_CONFIG
  );

  const items = useMemo(() => {
    if (!data?.items) return [];
    return (data.items as Record<string, unknown>[]).map(enrichInventoryItem);
  }, [data]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((i) => i.status === "active").length,
      soldOut: items.filter((i) => i.status === "sold_out" || i.quantity === 0).length,
      totalRevenue: items.reduce((s, i) => s + i.price * i.quantitySold, 0),
    };
  }, [items]);

  return {
    items,
    stats,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   ACTIONS — Ownership Market
   ============================================================ */
export function useOwnershipActions() {
  const listOwnership = useCallback(
    async (input: CreateOwnershipListingInput): Promise<{ success: boolean; listing?: OwnershipListing; error?: string }> => {
      try {
        const res = await fetch("/api/marketplace/ownership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Failed to list ownership" };
        }

        return {
          success: true,
          listing: json.listing ? enrichOwnershipListing(json.listing as Record<string, unknown>) : undefined,
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  const buyOwnership = useCallback(
    async (input: BuyOwnershipInput): Promise<{ success: boolean; order?: Record<string, unknown>; error?: string }> => {
      try {
        const res = await fetch(`/api/marketplace/ownership/${input.listingId}/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ percentToBuy: input.percentToBuy }),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Purchase failed" };
        }

        return { success: true, order: json.order };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  const cancelOwnershipListing = useCallback(
    async (listingId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/marketplace/ownership/${listingId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Cancel failed" };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  const releaseEscrow = useCallback(
    async (listingId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/marketplace/ownership/${listingId}/release`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Escrow release failed" };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  const refundEscrow = useCallback(
    async (listingId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/marketplace/ownership/${listingId}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Refund failed" };
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  return {
    listOwnership,
    buyOwnership,
    cancelOwnershipListing,
    releaseEscrow,
    refundEscrow,
  };
}

/* ============================================================
   ACTIONS — Inventory Market
   ============================================================ */
export function useInventoryActions() {
  const listInventory = useCallback(
    async (input: CreateInventoryItemInput): Promise<{ success: boolean; item?: InventoryItem; error?: string }> => {
      try {
        const res = await fetch(`/api/halls/${input.hallId}/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Failed to list product" };
        }

        return {
          success: true,
          item: json.item ? enrichInventoryItem(json.item as Record<string, unknown>) : undefined,
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  const buyInventory = useCallback(
    async (input: BuyInventoryInput): Promise<{ success: boolean; order?: InventoryOrder; error?: string }> => {
      try {
        const res = await fetch(`/api/marketplace/inventory/${input.inventoryId}/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ quantity: input.quantity }),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Purchase failed" };
        }

        return {
          success: true,
          order: json.order ? enrichInventoryOrder(json.order as Record<string, unknown>) : undefined,
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  const confirmInventoryOrder = useCallback(
    async (orderId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/marketplace/inventory/orders/${orderId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Confirmation failed" };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  const openInventoryDispute = useCallback(
    async (orderId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/marketplace/inventory/orders/${orderId}/dispute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return { success: false, error: json.error || json.message || "Dispute failed" };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Network error" };
      }
    },
    []
  );

  return {
    listInventory,
    buyInventory,
    confirmInventoryOrder,
    openInventoryDispute,
  };
}

/* ============================================================
   COMBINED MARKETPLACE ACTIONS
   ============================================================ */
export function useMarketplaceActions() {
  const ownership = useOwnershipActions();
  const inventory = useInventoryActions();

  return {
    ...ownership,
    ...inventory,
  };
}

/* ============================================================
   RE-EXPORTS for use-inventory.ts compatibility
   ============================================================ */
export { useHallInventory as useInventory };