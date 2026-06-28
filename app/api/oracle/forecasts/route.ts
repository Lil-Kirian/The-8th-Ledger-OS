// app/api/oracle/forecasts/route.ts
// 8th Ledger — The Oracle: Forecast Engine
// GET: Public. Cached. Auto-locks expired forecasts.
// POST: Admin-only. 6-factor auth. Rate-limited. Audited.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSessionUser } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// CONSTANTS & TYPES
//

const VALID_VERTICALS = [
  "ledgerprop",
  "ledgerauto",
  "ledgertech",
  "ledgeredu",
  "ledgerhealth",
  "ledgerbiz",
  "ledgertravel",
  "ledgeragri",
  "ledgerenergy",
  "ledgeraccess",
  "ledgersport",
] as const;

type VerticalSlug = (typeof VALID_VERTICALS)[number];
type ForecastType = "asset_launch" | "hall_revenue";
type ForecastStatus = "active" | "locked" | "resolved" | "cancelled";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_FORECASTS = 10;

//
// IN-MEMORY RATE LIMITER (swap for Redis at scale)
//

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(adminId: string): {
  allowed: boolean;
  resetAt: number;
  remaining: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(adminId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(adminId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
      remaining: RATE_LIMIT_MAX_FORECASTS - 1,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX_FORECASTS) {
    return { allowed: false, resetAt: entry.resetAt, remaining: 0 };
  }

  entry.count += 1;
  return {
    allowed: true,
    resetAt: entry.resetAt,
    remaining: RATE_LIMIT_MAX_FORECASTS - entry.count,
  };
}

//
// HELPERS
//

function sanitizeText(input: string, maxLength: number): string {
  return input.replace(/[<>]/g, "").trim().slice(0, maxLength);
}

function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function isValidStatus(status: string): status is ForecastStatus {
  return ["active", "locked", "resolved", "cancelled", "all"].includes(status);
}

function isValidType(type: string): type is ForecastType {
  return ["asset_launch", "hall_revenue"].includes(type);
}

function isValidVertical(v: string): v is VerticalSlug {
  return VALID_VERTICALS.includes(v as VerticalSlug);
}

//
// AUTO-LOCK EXPIRED FORECASTS (data integrity guard)
//
// Called on every GET to ensure active forecasts past lockDate
// are atomically transitioned to 'locked' before serving.
//

async function autoLockExpiredForecasts(): Promise<number> {
  try {
    const now = new Date();
    const result = await prisma.oracleForecast.updateMany({
      where: {
        status: "active",
        lockDate: { lt: now },
      },
      data: {
        status: "locked",
        updatedAt: now,
      },
    });
    return result.count;
  } catch {
    return 0;
  }
}

//
// AUDIT LOGGING
//

async function logAudit(props: {
  eventType: string;
  description: string;
  ledgerId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: props.eventType,
        description: props.description,
        ledgerId: props.ledgerId ?? null,
        metadata: props.metadata ? JSON.stringify(props.metadata) : null,
        txHash: `AUD-${randomUUID()}`,
        visibleToPublic: true,
        timestamp: new Date(),
      },
    });
  } catch {
    // Audit failure must not break the user flow
  }
}

//
// GET /api/oracle/forecasts
// Public. Cached 60s. Auto-locks expired. Optional auth enriches
// with the caller's prediction per forecast.
//

export async function GET(req: NextRequest) {
  try {
    // 1. Data integrity: auto-lock anything that expired
    const lockedCount = await autoLockExpiredForecasts();

    // 2. Parse query params
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get("status") || "active";
    const status: ForecastStatus | "all" =
      statusRaw === "all"
        ? "all"
        : isValidStatus(statusRaw)
          ? statusRaw
          : "active";
    const type = searchParams.get("type");
    const isLocked = searchParams.get("isLocked");
    const q = searchParams.get("q") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const skip = (page - 1) * limit;

    // 3. Build where clause
    const where: {
      status?: ForecastStatus;
      type?: ForecastType;
      lockDate?: { lt: Date } | { gt: Date };
      title?: { contains: string; mode: "insensitive" };
    } = {};

    if (status !== "all") where.status = status;
    if (type && isValidType(type)) where.type = type as ForecastType;

    // isLocked filter: true = already locked, false = still open
    if (isLocked === "true") {
      where.lockDate = { lt: new Date() };
      if (!where.status) where.status = "locked";
    } else if (isLocked === "false") {
      where.lockDate = { gt: new Date() };
      if (!where.status) where.status = "active";
    }

    if (q) {
      where.title = { contains: q, mode: "insensitive" };
    }

    // 4. Optional auth: fetch caller's predictions for enrichment
    let currentUserId: string | null = null;
    try {
      const user = await getSessionUser(req);
      if (user) currentUserId = user.id;
    } catch {
      // Public endpoint — auth failure is fine
    }

    // 5. Parallel fetch
    const [forecasts, total] = await Promise.all([
      prisma.oracleForecast.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          _count: {
            select: { predictions: true },
          },
          predictions: currentUserId
            ? {
                where: { userId: currentUserId },
                select: {
                  id: true,
                  vertical: true,
                  country: true,
                  status: true,
                  pointsEarned: true,
                  createdAt: true,
                },
                take: 1,
              }
            : false,
        },
      }),
      prisma.oracleForecast.count({ where }),
    ]);

    const now = new Date();

    // 6. Shape response
    const enriched = forecasts.map((f) => {
      const verticalOptions = safeJsonParse<VerticalSlug[]>(
        f.verticalOptions,
        [],
      );
      const countryOptions = safeJsonParse<string[]>(f.countryOptions, []);
      const isLockedNow = now >= new Date(f.lockDate);
      const userPrediction =
        currentUserId && f.predictions?.length > 0
          ? {
              id: f.predictions[0].id,
              vertical: f.predictions[0].vertical,
              country: f.predictions[0].country,
              status: f.predictions[0].status,
              pointsEarned: f.predictions[0].pointsEarned,
              predictedAt: f.predictions[0].createdAt,
            }
          : null;

      return {
        id: f.id,
        type: f.type,
        title: f.title,
        description: f.description,
        verticalOptions,
        countryOptions,
        lockDate: f.lockDate,
        resolveDate: f.resolveDate,
        resolvedOutcome: f.resolvedOutcome,
        periodStart: f.periodStart,
        periodEnd: f.periodEnd,
        status: f.status,
        isLocked: isLockedNow,
        isResolved: f.status === "resolved",
        isCancelled: f.status === "cancelled",
        predictionCount: f._count.predictions,
        userPrediction,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      };
    });

    const response = NextResponse.json({
      forecasts: enriched,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        status,
        type: type || null,
        autoLocked: lockedCount,
      },
    });

    response.headers.set(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300",
    );
    return response;
  } catch (error) {
    console.error("[ORACLE_FORECASTS_GET]", error);
    return NextResponse.json(
      { error: "The Oracle cannot be read.", code: "ORACLE_001" },
      { status: 500 },
    );
  }
}

//
// POST /api/oracle/forecasts
// Create a new forecast. Admin-only. Rate-limited. Audited.
//

export async function POST(req: NextRequest) {
  try {
    // 1. Admin gate (6-factor auth enforced in requireAdmin)
    const admin = await requireAdmin(req);

    // 2. Rate limit
    const rateLimit = checkRateLimit(admin.userId ?? admin.ledgerId ?? "admin");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Max 10 forecasts per hour.",
          code: "RATE_LIMITED",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    // 3. Parse & validate body
    const body = await req.json();
    const {
      title: titleRaw,
      description: descriptionRaw,
      type,
      verticalOptions,
      countryOptions,
      lockDate,
      periodStart,
      periodEnd,
    } = body;

    const title = sanitizeText(titleRaw, 200);
    const description = sanitizeText(descriptionRaw || "", 1000);

    if (title.length < 5) {
      return NextResponse.json(
        {
          error: "Title must be at least 5 characters.",
          code: "VALIDATION_TITLE",
        },
        { status: 400 },
      );
    }

    if (!type || !isValidType(type)) {
      return NextResponse.json(
        {
          error: "Type must be 'asset_launch' or 'hall_revenue'.",
          code: "VALIDATION_TYPE",
        },
        { status: 400 },
      );
    }

    // Validate verticals
    if (
      !Array.isArray(verticalOptions) ||
      verticalOptions.length === 0 ||
      verticalOptions.length > 10
    ) {
      return NextResponse.json(
        {
          error: "Provide 1-10 vertical options.",
          code: "VALIDATION_VERTICALS",
        },
        { status: 400 },
      );
    }

    const invalidVerticals = verticalOptions.filter(
      (v: string) => !isValidVertical(v),
    );
    if (invalidVerticals.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid verticals: ${invalidVerticals.join(", ")}`,
          code: "VALIDATION_VERTICAL_INVALID",
          validVerticals: VALID_VERTICALS,
        },
        { status: 400 },
      );
    }

    // Validate countries
    if (
      !Array.isArray(countryOptions) ||
      countryOptions.length === 0 ||
      countryOptions.length > 50
    ) {
      return NextResponse.json(
        {
          error: "Provide 1-50 country options.",
          code: "VALIDATION_COUNTRIES",
        },
        { status: 400 },
      );
    }

    const invalidCountries = countryOptions.filter(
      (c: string) => typeof c !== "string" || c.length !== 2,
    );
    if (invalidCountries.length > 0) {
      return NextResponse.json(
        {
          error: "All countries must be 2-letter ISO codes.",
          code: "VALIDATION_COUNTRY_FORMAT",
          invalid: invalidCountries,
        },
        { status: 400 },
      );
    }

    // Validate lock date
    const lockTime = new Date(lockDate);
    if (isNaN(lockTime.getTime()) || lockTime <= new Date()) {
      return NextResponse.json(
        {
          error: "Lock date must be in the future.",
          code: "VALIDATION_LOCK_DATE",
        },
        { status: 400 },
      );
    }

    // Period dates (optional, for hall_revenue type)
    const periodStartDate = periodStart ? new Date(periodStart) : null;
    const periodEndDate = periodEnd ? new Date(periodEnd) : null;
    if (periodStartDate && isNaN(periodStartDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid period start date.",
          code: "VALIDATION_PERIOD_START",
        },
        { status: 400 },
      );
    }
    if (periodEndDate && isNaN(periodEndDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid period end date.", code: "VALIDATION_PERIOD_END" },
        { status: 400 },
      );
    }
    if (periodStartDate && periodEndDate && periodEndDate <= periodStartDate) {
      return NextResponse.json(
        {
          error: "Period end must be after period start.",
          code: "VALIDATION_PERIOD_ORDER",
        },
        { status: 400 },
      );
    }

    // 4. Duplicate guard: same title in last 24h
    const recentDuplicate = await prisma.oracleForecast.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          error:
            "A forecast with this title already exists in the last 24 hours.",
          code: "DUPLICATE",
        },
        { status: 409 },
      );
    }

    // 5. Atomic creation + audit
    const [forecast] = await prisma.$transaction([
      prisma.oracleForecast.create({
        data: {
          title,
          description,
          type,
          verticalOptions: JSON.stringify(verticalOptions),
          countryOptions: JSON.stringify(countryOptions),
          lockDate: lockTime,
          periodStart: periodStartDate,
          periodEnd: periodEndDate,
          status: "active",
        },
      }),
      prisma.auditLog.create({
        data: {
          eventType: "oracle_forecast_created",
          description: `Forecast "${title}" cast. Type: ${type}. Lock: ${lockTime.toISOString()}. Verticals: ${verticalOptions.length}. Countries: ${countryOptions.length}.`,
          ledgerId: admin.ledgerId,
          metadata: JSON.stringify({
            forecastTitle: title,
            type,
            verticalCount: verticalOptions.length,
            countryCount: countryOptions.length,
            lockDate: lockTime.toISOString(),
          }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      }),
    ]);

    // 6. Response
    return NextResponse.json(
      {
        forecast: {
          id: forecast.id,
          title: forecast.title,
          description: forecast.description,
          type: forecast.type,
          verticalOptions,
          countryOptions,
          lockDate: forecast.lockDate,
          periodStart: forecast.periodStart,
          periodEnd: forecast.periodEnd,
          status: forecast.status,
          isLocked: false,
          predictionCount: 0,
          createdAt: forecast.createdAt,
          updatedAt: forecast.updatedAt,
        },
        meta: {
          rateLimitRemaining: rateLimit.remaining,
        },
        message: "The Oracle has cast a new forecast.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[ORACLE_FORECASTS_POST]", error);

    if (
      error.message?.includes("Unauthorized") ||
      error.message?.includes("unauthorized")
    ) {
      return NextResponse.json(
        {
          error: "Only the Architect may cast a forecast.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (error.message?.includes("Admin") || error.message?.includes("admin")) {
      return NextResponse.json(
        { error: "Only the Architect may cast a forecast.", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "The forecast could not be cast.", code: "ORACLE_002" },
      { status: 500 },
    );
  }
}
