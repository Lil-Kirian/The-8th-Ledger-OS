// hooks/use-inventory.ts
"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — Hall Inventory Management (Internal)
   ============================================================ */

export interface InventoryStockItem {
  id: string;
  title: string;
  description: string;
  price: number;
  costOfGoods: number;
  quantity: number;
  quantitySold: number;
  quantityAvailable: number;
  reorderThreshold: number;
  status: "active" | "inactive" | "sold_out";
  listedAt: string;
  createdAt: string;
  imageUrl?: string;
  images?: string | null;
  tags?: string | null;
  specs?: string | null;
  margin: number;
  marginPercent: number;
}

export interface InventoryOrderInternal {
  id: string;
  inventoryId: string;
  buyerId: string;
  buyerLedgerId: string;
  amount: number;
  quantity: number;
  status: "pending" | "paid" | "fulfilled" | "completed" | "refunded";
  escrowReleasedAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface InventoryMetrics {
  totalStockValue: number;
  totalCOGS: number;
  totalRevenue: number;
  grossMargin: number;
  itemsNeedingReorder: number;
  salesVelocity: number;
  turnoverRate: number;
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
  if (json.success === false)
    throw new Error(json.error || json.message || "Request failed");
  return json.success !== undefined ? json : { success: true, ...json };
};

const SWR_CONFIG = {
  revalidateOnFocus: true,
  dedupingInterval: 5000,
};

/* ============================================================
   HELPERS
   ============================================================ */
function enrichStockItem(raw: Record<string, unknown>): InventoryStockItem {
  const qty = Number(raw.quantity || 0);
  const sold = Number(raw.quantitySold || raw.quantity_sold || 0);
  const cogs = Number(raw.costOfGoods || raw.cost_of_goods || 0);
  const price = Number(raw.price || 0);
  return {
    id: String(raw.id),
    title: String(raw.title || ""),
    description: String(raw.description || ""),
    price,
    costOfGoods: cogs,
    quantity: qty,
    quantitySold: sold,
    quantityAvailable: Math.max(0, qty - sold),
    reorderThreshold: Number(
      raw.reorderThreshold || raw.reorder_threshold || 0,
    ),
    status: String(raw.status || "active") as InventoryStockItem["status"],
    listedAt: String(raw.listedAt || raw.listed_at || new Date().toISOString()),
    createdAt: String(
      raw.createdAt ||
        raw.created_at ||
        raw.listedAt ||
        raw.listed_at ||
        new Date().toISOString(),
    ),
    imageUrl: (raw.imageUrl || raw.image_url) as string | undefined,
    images: (raw.images as string | null | undefined) ?? null,
    tags: (raw.tags as string | null | undefined) ?? null,
    specs: (raw.specs as string | null | undefined) ?? null,
    margin: price - cogs,
    marginPercent: price > 0 ? Math.round(((price - cogs) / price) * 100) : 0,
  };
}

/* ============================================================
   HOOK: useHallInventory
   ============================================================ */
export function useHallInventory(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/inventory` : null,
    fetcher,
    SWR_CONFIG,
  );

  const items = useMemo((): InventoryStockItem[] => {
    if (!data?.items) return [];
    return (data.items as Record<string, unknown>[]).map(enrichStockItem);
  }, [data]);

  const metrics = useMemo((): InventoryMetrics => {
    const totalStockValue = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalCOGS = items.reduce((s, i) => s + i.costOfGoods * i.quantity, 0);
    const totalRevenue = items.reduce(
      (s, i) => s + i.price * i.quantitySold,
      0,
    );
    const itemsNeedingReorder = items.filter(
      (i) => i.quantityAvailable <= i.reorderThreshold && i.status === "active",
    ).length;

    return {
      totalStockValue,
      totalCOGS,
      totalRevenue,
      grossMargin: totalRevenue - totalCOGS,
      itemsNeedingReorder,
      salesVelocity: data?.salesVelocity || 0,
      turnoverRate: data?.turnoverRate || 0,
    };
  }, [items, data]);

  return {
    data: {
      items,
      metrics,
      salesVelocity: data?.salesVelocity || 0,
      turnoverRate: data?.turnoverRate || 0,
    },
    items,
    metrics,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
    refetch: mutate,
  };
}

/* ============================================================
   ALIAS: useInventory (used by inventory-manager.tsx)
   ============================================================ */
export { useHallInventory as useInventory };

/* ============================================================
   HOOK: useInventoryOrders
   ============================================================ */
export function useInventoryOrders(hallId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    hallId ? `/api/halls/${hallId}/inventory/orders` : null,
    fetcher,
    SWR_CONFIG,
  );

  const orders = useMemo((): InventoryOrderInternal[] => {
    if (!data?.orders) return [];
    return (data.orders as Record<string, unknown>[]).map((raw) => ({
      id: String(raw.id),
      inventoryId: String(raw.inventoryId || raw.inventory_id),
      buyerId: String(raw.buyerId || raw.buyer_id),
      buyerLedgerId: String(
        (raw.buyer as Record<string, unknown>)?.ledgerId ||
          (raw.buyer as Record<string, unknown>)?.t8ledgerId ||
          "",
      ),
      amount: Number(raw.amount || 0),
      quantity: Number(raw.quantity || 1),
      status: String(
        raw.status || "pending",
      ) as InventoryOrderInternal["status"],
      escrowReleasedAt: (raw.escrowReleasedAt || raw.escrow_released_at) as
        | string
        | null,
      createdAt: String(
        raw.createdAt || raw.created_at || new Date().toISOString(),
      ),
      completedAt: (raw.completedAt || raw.completed_at) as string | null,
    }));
  }, [data]);

  return {
    orders,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useToggleInventoryItem
   ============================================================ */
export function useToggleInventoryItem() {
  const toggle = useCallback(
    async (
      itemId: string,
      hallId: string,
      newStatus: "active" | "inactive",
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(
          `/api/halls/${hallId}/inventory/${itemId}/toggle`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: newStatus }),
          },
        );

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error || json.message || "Toggle failed",
          };
        }
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [],
  );

  return toggle;
}

/* ============================================================
   HOOK: useInventoryActions
   ============================================================ */
export function useInventoryActions() {
  const toggleInventory = useCallback(
    async (
      hallId: string,
      enabled: boolean,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/halls/${hallId}/inventory/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ enabled }),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error || json.message || "Toggle failed",
          };
        }
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [],
  );

  const proposeStockOrder = useCallback(
    async (
      hallId: string,
      payload: {
        title: string;
        description: string;
        price: number;
        costOfGoods: number;
        quantity: number;
        reorderThreshold: number;
        imageUrl?: string;
      },
    ): Promise<{ success: boolean; itemId?: string; error?: string }> => {
      try {
        const res = await fetch(`/api/halls/${hallId}/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error || json.message || "Stock order failed",
          };
        }
        return { success: true, itemId: json.itemId || json.id };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [],
  );

  const updateStock = useCallback(
    async (
      hallId: string,
      itemId: string,
      payload: {
        quantity?: number;
        price?: number;
        costOfGoods?: number;
        reorderThreshold?: number;
        status?: string;
        imageUrl?: string;
      },
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/halls/${hallId}/inventory/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error || json.message || "Update failed",
          };
        }
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [],
  );

  return {
    toggleInventory,
    proposeStockOrder,
    updateStock,
  };
}
