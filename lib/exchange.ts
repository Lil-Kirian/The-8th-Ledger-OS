/* ============================================================
   8TH LEDGER — EXCHANGE ENGINE
   Pure functions for bonding curve, slippage, and scarcity math
   ============================================================ */

import { round2, clamp } from "./utils";

/* ============================================================
   CONSTANTS
   ============================================================ */

export const LED_CONSTANTS = {
  MAX_SUPPLY: 21_000_000,
  BASE_PRICE: 5.0,
  LOG_MULTIPLIER: 2.5,
  LINEAR_MULTIPLIER: 8, // per 1M supply
  BURN_RATE_PER_FORGE: 0.05, // 5% of tier cost
  MARKET_SLIPPAGE_BASE: 0.02, // 2%
  MAX_SLIPPAGE: 0.15, // 15% cap
  CIRCULATING_CAP_FOR_PRICE: 20_000_000, // Price stops increasing here
};

/* ============================================================
   BONDING CURVE — Logarithmic Scarcity Model
   ============================================================ */

/**
 * Calculate LED price at a given circulating supply
 * Formula: base + log(supply/1000) * 2.5 + (supply/1M) * 8
 */
export function getBondingPrice(circulatingSupply: number): number {
  const supply = Math.max(circulatingSupply, 1);
  const price =
    LED_CONSTANTS.BASE_PRICE +
    Math.log(supply / 1000) * LED_CONSTANTS.LOG_MULTIPLIER +
    (supply / 1_000_000) * LED_CONSTANTS.LINEAR_MULTIPLIER;
  return round2(Math.min(price, 1000)); // Hard cap at $1000/LED
}

/**
 * Calculate price for a specific order size (with slippage)
 */
export function getExecutionPrice(
  side: "buy" | "sell",
  amount: number,
  currentSupply: number,
  currentPrice: number,
  marketDepth: number = 50000 // Default depth in LED
): number {
  const basePrice = currentPrice;

  if (side === "buy") {
    // Buying increases supply → price goes up
    const supplyImpact = amount / marketDepth;
    const slippage = clamp(supplyImpact * LED_CONSTANTS.MARKET_SLIPPAGE_BASE, 0, LED_CONSTANTS.MAX_SLIPPAGE);
    return round2(basePrice * (1 + slippage));
  } else {
    // Selling decreases effective demand → price goes down slightly
    const supplyImpact = amount / marketDepth;
    const slippage = clamp(supplyImpact * LED_CONSTANTS.MARKET_SLIPPAGE_BASE * 0.5, 0, LED_CONSTANTS.MAX_SLIPPAGE);
    return round2(basePrice * (1 - slippage));
  }
}

/**
 * Calculate total cost for a buy order (integrating over the curve)
 */
export function getBuyCost(amount: number, startingSupply: number): number {
  let total = 0;
  const step = 1; // Integrate in 1-LED steps for precision

  for (let i = 0; i < amount; i += step) {
    const supply = startingSupply + i;
    total += getBondingPrice(supply);
  }

  return round2(total);
}

/**
 * Calculate proceeds for a sell order
 */
export function getSellProceeds(amount: number, startingSupply: number): number {
  let total = 0;

  for (let i = 0; i < amount; i++) {
    const supply = Math.max(startingSupply - i, 1);
    total += getBondingPrice(supply);
  }

  return round2(total);
}

/* ============================================================
   SCARCITY METRICS
   ============================================================ */

export interface ScarcityMetrics {
  circulating: number;
  burned: number;
  locked: number;
  maxSupply: number;
  currentPrice: number;
  marketCap: number;
  remainingToMine: number;
  scarcityRatio: number; // 0-1, higher = scarcer
  deflationRate: number; // % of supply burned
}

export function calculateScarcity(metrics: {
  circulating: number;
  burned: number;
  locked: number;
}): ScarcityMetrics {
  const { circulating, burned, locked } = metrics;
  const maxSupply = LED_CONSTANTS.MAX_SUPPLY;
  const currentPrice = getBondingPrice(circulating);
  const marketCap = round2(circulating * currentPrice);
  const remainingToMine = maxSupply - circulating - burned - locked;
  const scarcityRatio = round2(1 - circulating / maxSupply);
  const deflationRate = round2((burned / maxSupply) * 100);

  return {
    circulating,
    burned,
    locked,
    maxSupply,
    currentPrice,
    marketCap,
    remainingToMine,
    scarcityRatio,
    deflationRate,
  };
}

/* ============================================================
   ORDER BOOK MATH
   ============================================================ */

export interface OrderBookDepth {
  bids: { price: number; amount: number }[];
  asks: { price: number; amount: number }[];
}

/**
 * Calculate spread between highest bid and lowest ask
 */
export function getSpread(depth: OrderBookDepth): number {
  if (depth.bids.length === 0 || depth.asks.length === 0) return 0;
  const highestBid = Math.max(...depth.bids.map((b) => b.price));
  const lowestAsk = Math.min(...depth.asks.map((a) => a.price));
  return round2(lowestAsk - highestBid);
}

/**
 * Calculate price impact of a market order
 */
export function getPriceImpact(
  side: "buy" | "sell",
  amount: number,
  depth: OrderBookDepth
): number {
  const orders = side === "buy" ? depth.asks : depth.bids;
  let remaining = amount;
  let totalCost = 0;
  let weightedPrice = 0;

  for (const order of orders.sort((a, b) => (side === "buy" ? a.price - b.price : b.price - a.price))) {
    if (remaining <= 0) break;
    const fillAmount = Math.min(remaining, order.amount);
    totalCost += fillAmount * order.price;
    remaining -= fillAmount;
  }

  if (amount - remaining > 0) {
    weightedPrice = totalCost / (amount - remaining);
  }

  const referencePrice = side === "buy"
    ? Math.min(...depth.asks.map((a) => a.price)) || weightedPrice
    : Math.max(...depth.bids.map((b) => b.price)) || weightedPrice;

  if (referencePrice === 0) return 0;
  return round2(Math.abs((weightedPrice - referencePrice) / referencePrice) * 100);
}

/* ============================================================
   LED BURN & MINT LOGIC
   ============================================================ */

/**
 * Calculate LED to burn for a tier upgrade
 */
export function getForgeBurnCost(currentTier: number, targetTier: number): number {
  const tierCosts: Record<number, number> = {
    1: 0,
    2: 50,
    3: 150,
    4: 400,
    5: 1000,
  };

  let total = 0;
  for (let t = currentTier + 1; t <= targetTier; t++) {
    total += tierCosts[t] || 0;
  }
  return total;
}

/**
 * Calculate how much LED is permanently removed when a user forges
 */
export function calculateBurnAmount(tierCost: number): number {
  return Math.floor(tierCost * LED_CONSTANTS.BURN_RATE_PER_FORGE);
}

/**
 * Calculate new circulating supply after a buy (mint-like) or sell
 */
export function updateSupply(
  currentSupply: number,
  amount: number,
  side: "buy" | "sell"
): number {
  if (side === "buy") {
    return Math.min(currentSupply + amount, LED_CONSTANTS.MAX_SUPPLY);
  }
  return Math.max(currentSupply - amount, 0);
}