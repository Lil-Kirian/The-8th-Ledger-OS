/* ============================================================
   8TH LEDGER — API CLIENT
   Centralized fetcher for all non-auth endpoints
   ============================================================ */

import { getLocalIdentity } from "./auth";

/* ============================================================
   TYPES — Request/Response shapes
   ============================================================ */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/* ============================================================
   CORE FETCHER
   ============================================================ */

async function fetcher<T>(
  path: string,
  options: RequestInit = {},
  retries = 1
): Promise<ApiResponse<T>> {
  const url = path.startsWith("http") ? path : `/api${path}`;

  // Inject auth header if local identity exists
  const identity = typeof window !== "undefined" ? getLocalIdentity() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (identity?.ledgerId) {
    headers["x-ledger-id"] = identity.ledgerId;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle non-JSON gracefully
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { success: false, error: `Expected JSON, got ${contentType}` };
    }

    const json = (await res.json()) as ApiResponse<T>;

    // Retry on network-ish failures
    if (!res.ok && retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      return fetcher<T>(path, options, retries - 1);
    }

    return json;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network failure",
    };
  }
}

/* ============================================================
   POOLS API
   ============================================================ */

export interface PoolPayload {
  name: string;
  verticalId: string;
  assetValue: number;
  trueCost: number;
  listedPrice: number;
  maxParticipants: number;
  country: string;
  description?: string;
  closesAt?: string;
  hallClass?: "I" | "II" | "III";
  emojiSet?: string;
}

export interface CommitPayload {
  poolId: string;
  amount: number;
}

export const poolsApi = {
  list: (params?: { vertical?: string; status?: string; user?: string }) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetcher<{ pools: unknown[] }>(`/pools${qs}`, { method: "GET" });
  },

  create: (payload: PoolPayload) =>
    fetcher<{ pool: unknown }>("/pools", { method: "POST", body: JSON.stringify(payload) }),

  commit: (payload: CommitPayload) =>
    fetcher<{ pool: unknown; message: string }>("/pools", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  suspend: (poolId: string) =>
    fetcher<{ message: string }>(`/pools?id=${poolId}`, { method: "DELETE" }),
};

/* ============================================================
   EXCHANGE API
   ============================================================ */

export interface OrderPayload {
  side: "buy" | "sell";
  amount: number;
  price?: number;
  type?: "limit" | "market";
}

export const exchangeApi = {
  state: (type: "all" | "book" | "trades" | "bonding" = "all") =>
    fetcher<{ bonding?: unknown; orders?: unknown[]; trades?: unknown[] }>(
      `/exchange/orders?type=${type}`,
      { method: "GET" }
    ),

  placeOrder: (payload: OrderPayload) =>
    fetcher<{ order: unknown; trades?: unknown[]; message: string }>("/exchange/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  cancelOrder: (orderId: string) =>
    fetcher<{ order: unknown; message: string }>(`/exchange/orders?id=${orderId}`, {
      method: "DELETE",
    }),
};

/* ============================================================
   ORACLE API — Standing-Based Forecasts (No Money)
   ============================================================ */

export interface OracleForecastPayload {
  forecastId: string;
  vertical: string;
  country: string;
}

export const oracleApi = {
  getForecasts: (status?: "active" | "locked" | "resolved" | "all") =>
    fetcher<{ forecasts: unknown[] }>(`/oracle/forecasts?status=${status || "all"}`, { method: "GET" }),

  getStanding: () =>
    fetcher<{ standing: unknown }>("/oracle/standing", { method: "GET" }),

  getLeaderboard: () =>
    fetcher<{ leaderboard: unknown[] }>("/oracle/leaderboard", { method: "GET" }),

  predict: (payload: OracleForecastPayload) =>
    fetcher<{ prediction: unknown; message: string }>("/oracle/forecasts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resolveForecast: (payload: { forecastId: string; winningVertical: string; winningCountry: string }) =>
    fetcher<{ resolved: unknown; message: string }>(`/oracle/forecasts`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

/* ============================================================
   KNOT API — Referral Network
   ============================================================ */

export const knotApi = {
  get: (type: "all" | "network" | "rewards" | "leaderboard" | "stats" = "all") =>
    fetcher<unknown>(`/knot?type=${type}`, { method: "GET" }),

  redeemCode: (inviteCode: string) =>
    fetcher<{ message: string }>("/knot", {
      method: "POST",
      body: JSON.stringify({ action: "redeem", inviteCode }),
    }),

  recordReferral: (payload: { fromLedgerId: string; activityType: "commit" | "win" | "forge"; amount: number }) =>
    fetcher<{ rewards: unknown[]; message: string }>("/knot", {
      method: "POST",
      body: JSON.stringify({ action: "record", ...payload }),
    }),
};

/* ============================================================
   TREASURY API — 8th Ledger Revenue & PIR
   ============================================================ */

export interface WithdrawPayload {
  amount: number;
  destination: string;
  reason?: string;
}

export const treasuryApi = {
  get: (type: "all" | "state" | "transactions" | "pir" | "withdrawals" | "revenue" = "all") =>
    fetcher<unknown>(`/treasury?type=${type}`, { method: "GET" }),

  withdraw: (payload: WithdrawPayload) =>
    fetcher<{ withdrawals: unknown[]; message: string }>("/treasury", {
      method: "POST",
      body: JSON.stringify({ action: "withdraw", ...payload }),
    }),

  allocatePir: (payload: { poolId: string; poolName?: string; totalCommitted: number; trueCost: number }) =>
    fetcher<{ pirAllocations: unknown[]; message: string }>("/treasury", {
      method: "POST",
      body: JSON.stringify({ action: "allocate_pir", ...payload }),
    }),

  distributeRevenue: (payload: { hallId: string; poolId: string; grossRevenue: number; payrollAmount?: number }) =>
    fetcher<{ distribution: unknown; message: string }>("/treasury", {
      method: "POST",
      body: JSON.stringify({ action: "distribute_revenue", ...payload }),
    }),

  processWithdrawal: (payload: { withdrawalId: string; status: "completed" | "rejected"; rejectionReason?: string }) =>
    fetcher<{ withdrawals: unknown[]; message: string }>("/treasury", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

/* ============================================================
   MERIDIAN CYCLE API
   ============================================================ */

export const meridianApi = {
  getCurrentCycle: () =>
    fetcher<{ cycle: unknown }>("/meridian/cycle", { method: "GET" }),

  getCycleDetails: (cycleId: string) =>
    fetcher<{ cycle: unknown }>(`/meridian/cycle/${cycleId}`, { method: "GET" }),

  getCyclePools: (cycleId: string) =>
    fetcher<{ pools: unknown[] }>(`/meridian/cycle/${cycleId}/pools`, { method: "GET" }),

  vote: (payload: { cycleId: string; poolId: string }) =>
    fetcher<{ vote: unknown; message: string }>(`/meridian/cycle/${payload.cycleId}/vote`, {
      method: "POST",
      body: JSON.stringify({ poolId: payload.poolId }),
    }),
};

/* ============================================================
   AGORA API — Public Square
   ============================================================ */

export interface AgoraSuggestionPayload {
  title: string;
  description: string;
  continent: string;
  vertical: string;
}

export const agoraApi = {
  getSuggestions: (filters?: { status?: string; continent?: string; page?: number }) => {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return fetcher<{ suggestions: unknown[]; total: number }>(`/agora/suggestions${qs}`, { method: "GET" });
  },

  createSuggestion: (payload: AgoraSuggestionPayload) =>
    fetcher<{ suggestion: unknown; message: string }>("/agora/suggestions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  voteSuggestion: (suggestionId: string, direction: "up" | "down") =>
    fetcher<{ suggestion: unknown; message: string }>(`/agora/suggestions/${suggestionId}/vote`, {
      method: "POST",
      body: JSON.stringify({ direction }),
    }),

  getQA: (page?: number) =>
    fetcher<{ questions: unknown[] }>(`/agora/qa?page=${page || 1}`, { method: "GET" }),

  askQuestion: (payload: { question: string }) =>
    fetcher<{ qa: unknown; message: string }>("/agora/qa", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRelay: (page?: number) =>
    fetcher<{ feed: unknown[] }>(`/agora/relay?page=${page || 1}`, { method: "GET" }),

  getPulse: () =>
    fetcher<{ stats: unknown }>("/agora/pulse", { method: "GET" }),
};

/* ============================================================
   MARKETPLACE API — Ownership + Inventory
   ============================================================ */

export interface OwnershipListingPayload {
  ownershipId: string;
  hallId: string;
  percentListed: number;
  pricePerPercent: number;
  totalPrice: number;
  floorPrice: number;
}

export interface InventoryBuyPayload {
  inventoryId: string;
  quantity: number;
}

export const marketplaceApi = {
  getOwnershipListings: (filters?: { hallId?: string; verticalId?: string; page?: number }) => {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return fetcher<{ listings: unknown[]; total: number }>(`/marketplace/ownership${qs}`, { method: "GET" });
  },

  createOwnershipListing: (payload: OwnershipListingPayload) =>
    fetcher<{ listing: unknown; message: string }>("/marketplace/ownership", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  buyOwnership: (listingId: string) =>
    fetcher<{ order: unknown; message: string }>(`/marketplace/ownership/${listingId}/buy`, {
      method: "POST",
    }),

  cancelOwnershipListing: (listingId: string) =>
    fetcher<{ message: string }>(`/marketplace/ownership/${listingId}/cancel`, {
      method: "POST",
    }),

  getInventory: (filters?: { hallId?: string; page?: number }) => {
    const qs = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : "";
    return fetcher<{ items: unknown[]; total: number }>(`/marketplace/inventory${qs}`, { method: "GET" });
  },

  buyInventory: (payload: InventoryBuyPayload) =>
    fetcher<{ order: unknown; message: string }>(`/marketplace/inventory/${payload.inventoryId}/buy`, {
      method: "POST",
      body: JSON.stringify({ quantity: payload.quantity }),
    }),
};

/* ============================================================
   HALL API — Governance & Operations
   ============================================================ */

export const hallApi = {
  getStream: (hallId: string, page?: number) =>
    fetcher<{ posts: unknown[] }>(`/halls/${hallId}/stream?page=${page || 1}`, { method: "GET" }),

  createStreamPost: (hallId: string, payload: { type: "PROPOSAL" | "REPORT" | "APPEAL"; title: string; content: string; proposalId?: string }) =>
    fetcher<{ post: unknown; message: string }>(`/halls/${hallId}/stream`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getCabinet: (hallId: string) =>
    fetcher<{ cabinet: unknown }>(`/halls/${hallId}/cabinet`, { method: "GET" }),

  electCabinet: (hallId: string, payload: { speakerId?: string; treasurerId?: string; wardenId?: string; scribeId?: string }) =>
    fetcher<{ cabinet: unknown; message: string }>(`/halls/${hallId}/cabinet/elect`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getForge: (hallId: string) =>
    fetcher<{ forge: unknown }>(`/halls/${hallId}/forge`, { method: "GET" }),

  getLedger: (hallId: string) =>
    fetcher<{ updates: unknown[] }>(`/halls/${hallId}/ledger`, { method: "GET" }),

  getVault: (hallId: string) =>
    fetcher<{ documents: unknown[] }>(`/halls/${hallId}/vault`, { method: "GET" }),

  getClosure: (hallId: string) =>
    fetcher<{ closure: unknown }>(`/halls/${hallId}/closure`, { method: "GET" }),
};