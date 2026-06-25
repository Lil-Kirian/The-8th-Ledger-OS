import { NextResponse } from "next/server";

/* ============================================================
   8TH LEDGER — RATE LIMITER
   Shared across all API routes. Redis-ready for production.
   ============================================================ */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

// In-memory store (dev / single-instance)
const memoryStore = new Map<string, RateLimitEntry>();

function getKey(identifier: string, route: string): string {
  return `ratelimit:${route}:${identifier}`;
}

/* ============================================================
   CORE LIMITER
   ============================================================ */
export async function rateLimit(
  identifier: string,
  route: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const key = getKey(identifier, route);
  const now = Date.now();

  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
      windowMs,
    };
    memoryStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: newEntry.resetAt,
      retryAfter: 0,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfter: 0,
  };
}

/* ============================================================
   ROUTE-SPECIFIC PRESETS
   ============================================================ */

/** Auth endpoints: 5 attempts per 15 minutes */
export async function authRateLimit(identifier: string): Promise<RateLimitResult> {
  return rateLimit(identifier, "auth", 5, 15 * 60 * 1000);
}

/** Pool commit: 10 attempts per 5 minutes */
export async function commitRateLimit(identifier: string): Promise<RateLimitResult> {
  return rateLimit(identifier, "commit", 10, 5 * 60 * 1000);
}

/** Exchange orders: 20 attempts per minute */
export async function exchangeRateLimit(identifier: string): Promise<RateLimitResult> {
  return rateLimit(identifier, "exchange", 20, 60 * 1000);
}

/** General API: 60 attempts per minute */
export async function generalRateLimit(identifier: string): Promise<RateLimitResult> {
  return rateLimit(identifier, "general", 60, 60 * 1000);
}

/* ============================================================
   NEXT.JS RESPONSE HELPER
   Returns a 429 response if blocked
   ============================================================ */
export function rateLimitResponse(retryAfter: number, limit: number = 5): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Rate limit exceeded. Cool down.",
      message: `Too many requests. Retry after ${retryAfter} seconds.`,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + retryAfter),
        "Retry-After": String(retryAfter),
      },
    }
  );
}

/* ============================================================
   CLEANUP (dev only — prevents memory leak in long-running dev)
   ============================================================ */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 60 * 1000);