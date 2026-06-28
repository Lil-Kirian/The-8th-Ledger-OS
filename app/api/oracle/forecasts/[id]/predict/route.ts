// app/api/oracle/forecasts/[id]/predict/route.ts
// 8th Ledger — The Oracle: Prediction Seal
// POST: Auth required. One prediction per forecast. Free. No money.
// GET: Check if user has predicted on this forecast. Auth required.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAuth } from "@/lib/auth";
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
] as const;

type VerticalSlug = (typeof VALID_VERTICALS)[number];
type OracleTier = "novice" | "seer" | "oracle" | "prophet";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_PREDICTIONS = 20; // per user per hour

//
// IN-MEMORY RATE LIMITER (swap for Redis at scale)
//

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(userId: string): { allowed: boolean; resetAt: number; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, resetAt: now + RATE_LIMIT_WINDOW_MS, remaining: RATE_LIMIT_MAX_PREDICTIONS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_PREDICTIONS) {
    return { allowed: false, resetAt: entry.resetAt, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, resetAt: entry.resetAt, remaining: RATE_LIMIT_MAX_PREDICTIONS - entry.count };
}

//
// HELPERS
//

function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function isValidVertical(v: string): v is VerticalSlug {
  return VALID_VERTICALS.includes(v as VerticalSlug);
}

function calculateTier(correctCount: number): OracleTier {
  if (correctCount >= 100) return "prophet";
  if (correctCount >= 50) return "oracle";
  if (correctCount >= 10) return "seer";
  return "novice";
}

function sanitizeText(input: string, maxLength: number): string {
  return input.replace(/[<>]/g, "").trim().slice(0, maxLength);
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
// FORECAST LOCK CHECK
//

async function checkForecastLock(forecastId: string): Promise<{
  forecast: Awaited<ReturnType<typeof prisma.oracleForecast.findUnique>>;
  isLocked: boolean;
  isResolved: boolean;
  isCancelled: boolean;
}> {
  const forecast = await prisma.oracleForecast.findUnique({
    where: { id: forecastId },
    select: {
      id: true,
      title: true,
      status: true,
      lockDate: true,
      verticalOptions: true,
      countryOptions: true,
      resolvedOutcome: true,
    },
  });

  const now = new Date();
  const isLocked = forecast ? now >= new Date(forecast.lockDate) : false;
  const isResolved = forecast?.status === "resolved";
  const isCancelled = forecast?.status === "cancelled";

  return { forecast, isLocked, isResolved, isCancelled };
}

//
// POST /api/oracle/forecasts/[id]/predict
// Seal a prediction. One per user per forecast. Free. No stakes.
//

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth gate (strict — predictions require auth)
    const user = await requireAuth(req);
    const { id: forecastId } = await params;

    if (!forecastId || forecastId.length < 10) {
      return NextResponse.json(
        { error: "Invalid forecast ID.", code: "VALIDATION_ID" },
        { status: 400 },
      );
    }

    // 2. Rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Max 20 predictions per hour.",
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
    const { vertical, country: countryRaw } = body;

    if (!vertical || !isValidVertical(vertical)) {
      return NextResponse.json(
        {
          error: `Invalid vertical. Must be one of: ${VALID_VERTICALS.join(", ")}`,
          code: "VALIDATION_VERTICAL",
        },
        { status: 400 },
      );
    }

    const country = sanitizeText(countryRaw, 2).toUpperCase();
    if (country.length !== 2) {
      return NextResponse.json(
        {
          error: "Country must be a 2-letter ISO code.",
          code: "VALIDATION_COUNTRY",
        },
        { status: 400 },
      );
    }

    // 4. Forecast state check
    const { forecast, isLocked, isResolved, isCancelled } =
      await checkForecastLock(forecastId);

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (isCancelled) {
      return NextResponse.json(
        { error: "This forecast was cancelled.", code: "FORECAST_CANCELLED" },
        { status: 403 },
      );
    }

    if (isResolved) {
      return NextResponse.json(
        {
          error: "This forecast has already been resolved.",
          code: "FORECAST_RESOLVED",
        },
        { status: 403 },
      );
    }

    if (isLocked) {
      return NextResponse.json(
        {
          error: "This forecast is locked. No more predictions.",
          code: "FORECAST_LOCKED",
          lockedAt: forecast.lockDate,
        },
        { status: 403 },
      );
    }

    // 5. Validate against forecast options
    const verticalOptions = safeJsonParse<VerticalSlug[]>(
      forecast.verticalOptions,
      [],
    );
    const countryOptions = safeJsonParse<string[]>(forecast.countryOptions, []);

    if (!verticalOptions.includes(vertical)) {
      return NextResponse.json(
        {
          error: "Invalid vertical option for this forecast.",
          code: "VALIDATION_VERTICAL_OPTION",
          valid: verticalOptions,
        },
        { status: 400 },
      );
    }

    if (!countryOptions.includes(country)) {
      return NextResponse.json(
        {
          error: "Invalid country option for this forecast.",
          code: "VALIDATION_COUNTRY_OPTION",
          valid: countryOptions,
        },
        { status: 400 },
      );
    }

    // 6. Duplicate guard — one prediction per user per forecast
    const existingPrediction = await prisma.oraclePrediction.findFirst({
      where: {
        forecastId,
        userId: user.id,
      },
      select: { id: true, vertical: true, country: true, createdAt: true },
    });

    if (existingPrediction) {
      return NextResponse.json(
        {
          error: "You have already predicted on this forecast.",
          code: "ALREADY_PREDICTED",
          prediction: {
            id: existingPrediction.id,
            vertical: existingPrediction.vertical,
            country: existingPrediction.country,
            predictedAt: existingPrediction.createdAt,
          },
        },
        { status: 409 },
      );
    }

    // 7. Atomic creation + standing update
    const [prediction, standing] = await prisma.$transaction(async (tx) => {
      // Create prediction
      const pred = await tx.oraclePrediction.create({
        data: {
          forecastId,
          userId: user.id,
          vertical,
          country,
          pointsEarned: 0,
          status: "pending",
        },
      });

      // Upsert standing with tier recalculation
      const currentStanding = await tx.oracleStanding.findUnique({
        where: { userId: user.id },
        select: { totalPredictions: true, correctCount: true, tier: true },
      });

      const newTotalPredictions = (currentStanding?.totalPredictions ?? 0) + 1;
      const correctCount = currentStanding?.correctCount ?? 0;
      const newTier = calculateTier(correctCount);

      const stand = await tx.oracleStanding.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          totalPredictions: 1,
          correctCount: 0,
          tier: "novice",
          streak: 0,
        },
        update: {
          totalPredictions: newTotalPredictions,
          tier: newTier,
          updatedAt: new Date(),
        },
      });

      return [pred, stand];
    });

    // 8. Audit trail (non-blocking)
    await logAudit({
      eventType: "oracle_prediction_created",
      description: `Prediction sealed on "${forecast.title}": ${vertical} + ${country}`,
      ledgerId: user.ledgerId,
      metadata: {
        forecastId,
        forecastTitle: forecast.title,
        vertical,
        country,
        predictionId: prediction.id,
        totalPredictions: standing.totalPredictions,
        tier: standing.tier,
      },
    });

    // 9. Response
    return NextResponse.json(
      {
        prediction: {
          id: prediction.id,
          forecastId: prediction.forecastId,
          vertical: prediction.vertical,
          country: prediction.country,
          status: prediction.status,
          pointsEarned: prediction.pointsEarned,
          createdAt: prediction.createdAt,
        },
        standing: {
          totalPredictions: standing.totalPredictions,
          correctCount: standing.correctCount,
          tier: standing.tier,
          nextTier: calculateTier(standing.correctCount + 1),
          pointsToNextTier: Math.max(
            0,
            (standing.tier === "novice"
              ? 10
              : standing.tier === "seer"
                ? 50
                : standing.tier === "oracle"
                  ? 100
                  : 999) - standing.correctCount,
          ),
        },
        meta: {
          rateLimitRemaining: rateLimit.remaining,
          forecastTitle: forecast.title,
          isLocked: false,
        },
        message: "Your foresight is sealed. The Oracle awaits the truth.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[ORACLE_PREDICT_POST]", error);

    // Prisma unique constraint violation (race condition)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Prediction already recorded. Refresh and try again.",
          code: "CONFLICT",
        },
        { status: 409 },
      );
    }

    if (
      error.message?.includes("Unauthorized") ||
      error.message?.includes("unauthorized")
    ) {
      return NextResponse.json(
        { error: "Authentication required to predict.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Your prediction could not be recorded.",
        code: "ORACLE_PREDICT_001",
      },
      { status: 500 },
    );
  }
}

//
// GET /api/oracle/forecasts/[id]/predict
// Check if current user has predicted on this forecast.
// Also returns forecast state (locked, resolved, etc.).
//

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { id: forecastId } = await params;

    if (!forecastId || forecastId.length < 10) {
      return NextResponse.json(
        { error: "Invalid forecast ID.", code: "VALIDATION_ID" },
        { status: 400 }
      );
    }

    // Parallel fetch: forecast state + user prediction
    const [forecastState, prediction] = await Promise.all([
      checkForecastLock(forecastId),
      prisma.oraclePrediction.findFirst({
        where: {
          forecastId,
          userId: user.id,
        },
        select: {
          id: true,
          vertical: true,
          country: true,
          status: true,
          pointsEarned: true,
          createdAt: true,
        },
      }),
    ]);

    const { forecast, isLocked, isResolved, isCancelled } = forecastState;

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!prediction) {
      return NextResponse.json({
        hasPredicted: false,
        forecast: {
          id: forecast.id,
          title: forecast.title,
          status: forecast.status,
          isLocked,
          isResolved,
          isCancelled,
          lockDate: forecast.lockDate,
          verticalOptions: safeJsonParse<VerticalSlug[]>(forecast.verticalOptions, []),
          countryOptions: safeJsonParse<string[]>(forecast.countryOptions, []),
        },
        message: "You have not predicted on this forecast.",
      });
    }

    return NextResponse.json({
      hasPredicted: true,
      prediction: {
        id: prediction.id,
        vertical: prediction.vertical,
        country: prediction.country,
        status: prediction.status,
        pointsEarned: prediction.pointsEarned,
        predictedAt: prediction.createdAt,
      },
      forecast: {
        id: forecast.id,
        title: forecast.title,
        status: forecast.status,
        isLocked,
        isResolved,
        isCancelled,
        lockDate: forecast.lockDate,
        resolvedOutcome: forecast.resolvedOutcome,
      },
      message: "Your prediction is sealed.",
    });
  } catch (error) {
    console.error("[ORACLE_PREDICT_GET]", error);
    return NextResponse.json(
      { error: "Cannot retrieve prediction status.", code: "ORACLE_PREDICT_002" },
      { status: 500 }
    );
  }
}