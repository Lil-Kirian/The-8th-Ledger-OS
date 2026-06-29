// app/api/oracle/forecasts/[id]/resolve/route.ts
// 8th Ledger — The Oracle: The Reckoning
// POST: Admin-only. 6-factor auth. Resolves a forecast, judges all predictions,
//       recalculates standings, and updates tiers atomically.
// This is the moment the Oracle speaks. There is no undo.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// CONSTANTS & TYPES
//

type OracleTier = "novice" | "seer" | "oracle" | "prophet";

const TIER_THRESHOLDS: Record<OracleTier, number> = {
  novice: 0,
  seer: 10,
  oracle: 50,
  prophet: 100,
};

const BASE_POINTS = 10;
const ASSET_LAUNCH_BONUS = 5;
const STREAK_MULTIPLIER = 2;
const MAX_STREAK_BONUS = 20;

//
// HELPERS
//

function calculateTier(correctCount: number): OracleTier {
  if (correctCount >= 100) return "prophet";
  if (correctCount >= 50) return "oracle";
  if (correctCount >= 10) return "seer";
  return "novice";
}

function calculatePoints(
  isCorrect: boolean,
  forecastType: string,
  streak: number
): number {
  if (!isCorrect) return 0;

  let points = BASE_POINTS;
  if (forecastType === "asset_launch") points += ASSET_LAUNCH_BONUS;

  const streakBonus = Math.min(streak * STREAK_MULTIPLIER, MAX_STREAK_BONUS);
  points += streakBonus;

  return points;
}

function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

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
    // Audit failure must not break the reckoning
  }
}

//
// POST /api/oracle/forecasts/[id]/resolve
// The Architect speaks. The Oracle resolves. Standings are rewritten.
//

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Admin gate — 6-factor auth enforced in requireAdmin
    const admin = await requireAdmin(req);
    const { id: forecastId } = await params;

    if (!forecastId || forecastId.length < 10) {
      return NextResponse.json(
        { error: "Invalid forecast ID.", code: "VALIDATION_ID" },
        { status: 400 },
      );
    }

    // 2. Parse & validate body
    const body = await req.json();
    const { resolvedOutcome } = body;

    if (!resolvedOutcome || typeof resolvedOutcome !== "string") {
      return NextResponse.json(
        {
          error: "resolvedOutcome is required. Format: vertical|country",
          example: "ledgerprop|kenya",
          code: "VALIDATION_OUTCOME",
        },
        { status: 400 },
      );
    }

    const outcomeParts = resolvedOutcome.split("|");
    if (outcomeParts.length !== 2) {
      return NextResponse.json(
        {
          error: "Outcome must be exactly 2 parts: vertical|country",
          code: "VALIDATION_OUTCOME_FORMAT",
        },
        { status: 400 },
      );
    }

    const [winningVertical, winningCountry] = outcomeParts;

    if (!winningVertical || winningVertical.length < 3) {
      return NextResponse.json(
        { error: "Invalid winning vertical.", code: "VALIDATION_VERTICAL" },
        { status: 400 },
      );
    }

    if (!winningCountry || winningCountry.length !== 2) {
      return NextResponse.json(
        {
          error: "Winning country must be a 2-letter ISO code.",
          code: "VALIDATION_COUNTRY",
        },
        { status: 400 },
      );
    }

    // 3. Fetch forecast with all predictions
    const forecast = await prisma.oracleForecast.findUnique({
      where: { id: forecastId },
      include: {
        predictions: {
          select: {
            id: true,
            userId: true,
            vertical: true,
            country: true,
            status: true,
            pointsEarned: true,
          },
        },
      },
    });

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // 4. State validation
    if (forecast.status === "resolved") {
      return NextResponse.json(
        {
          error: "This forecast has already been resolved.",
          resolvedOutcome: forecast.resolvedOutcome,
          resolvedAt: forecast.resolveDate,
          code: "ALREADY_RESOLVED",
        },
        { status: 409 },
      );
    }

    if (forecast.status === "cancelled") {
      return NextResponse.json(
        {
          error: "This forecast was cancelled. It cannot be resolved.",
          code: "FORECAST_CANCELLED",
        },
        { status: 403 },
      );
    }

    // Forecast must be locked (past lockDate) before resolution
    const now = new Date();
    if (forecast.status === "active" && now < new Date(forecast.lockDate)) {
      return NextResponse.json(
        {
          error:
            "This forecast is still open. Lock it first or wait for the lock date.",
          lockDate: forecast.lockDate,
          code: "FORECAST_NOT_LOCKED",
        },
        { status: 403 },
      );
    }

    // 5. Validate winning combo against forecast options
    const verticalOptions = safeJsonParse<string[]>(
      forecast.verticalOptions,
      [],
    );
    const countryOptions = safeJsonParse<string[]>(forecast.countryOptions, []);

    if (!verticalOptions.includes(winningVertical)) {
      return NextResponse.json(
        {
          error: "Winning vertical is not among this forecast's options.",
          code: "VALIDATION_VERTICAL_OPTION",
          valid: verticalOptions,
          provided: winningVertical,
        },
        { status: 400 },
      );
    }

    if (!countryOptions.includes(winningCountry)) {
      return NextResponse.json(
        {
          error: "Winning country is not among this forecast's options.",
          code: "VALIDATION_COUNTRY_OPTION",
          valid: countryOptions,
          provided: winningCountry,
        },
        { status: 400 },
      );
    }

    // 6. THE RECKONING — Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 6a. Mark forecast resolved
      const updatedForecast = await tx.oracleForecast.update({
        where: { id: forecastId },
        data: {
          status: "resolved",
          resolvedOutcome,
          resolveDate: now,
          updatedAt: now,
        },
      });

      // 6b. Pre-fetch all standings for users who predicted
      const userIds = [...new Set(forecast.predictions.map((p) => p.userId))];
      const existingStandings = await tx.oracleStanding.findMany({
        where: { userId: { in: userIds } },
      });
      const standingMap = new Map(existingStandings.map((s) => [s.userId, s]));

      // 6c. Track results for response
      const results: {
        predictionId: string;
        userId: string;
        vertical: string;
        country: string;
        wasCorrect: boolean;
        pointsEarned: number;
        previousStreak: number;
        newStreak: number;
      }[] = [];

      let correctCount = 0;
      let incorrectCount = 0;

      // 6d. Process each prediction
      for (const pred of forecast.predictions) {
        const isCorrect =
          pred.vertical === winningVertical && pred.country === winningCountry;

        const standing = standingMap.get(pred.userId);
        const previousStreak = standing?.streak ?? 0;

        // Calculate points
        const pointsEarned = calculatePoints(
          isCorrect,
          forecast.type,
          isCorrect ? previousStreak : 0,
        );

        // Update prediction
        await tx.oraclePrediction.update({
          where: { id: pred.id },
          data: {
            status: isCorrect ? "correct" : "incorrect",
            pointsEarned,
          },
        });

        // Update or create standing
        const currentCorrect = standing?.correctCount ?? 0;
        const currentTotal = standing?.totalPredictions ?? 0;
        const currentPoints = standing?.totalPoints ?? 0;
        const newStreak = isCorrect ? previousStreak + 1 : 0;
        const newCorrectCount = isCorrect ? currentCorrect + 1 : currentCorrect;
        const newTotalPredictions = currentTotal + 1; // This shouldn't happen since we count on create, but defensive
        const newTotalPoints = currentPoints + pointsEarned;
        const newTier = calculateTier(newCorrectCount);

        await tx.oracleStanding.upsert({
          where: { userId: pred.userId },
          create: {
            userId: pred.userId,
            totalPoints: pointsEarned,
            correctCount: isCorrect ? 1 : 0,
            totalPredictions: 1,
            tier: newTier,
            streak: newStreak,
            lastCorrectAt: isCorrect ? now : null,
          },
          update: {
            totalPoints: newTotalPoints,
            correctCount: newCorrectCount,
            streak: newStreak,
            tier: newTier,
            lastCorrectAt: isCorrect ? now : standing?.lastCorrectAt,
            updatedAt: now,
          },
        });

        // Track stats
        if (isCorrect) correctCount++;
        else incorrectCount++;

        results.push({
          predictionId: pred.id,
          userId: pred.userId,
          vertical: pred.vertical,
          country: pred.country,
          wasCorrect: isCorrect,
          pointsEarned,
          previousStreak,
          newStreak,
        });
      }

      // 6e. Audit log
      await tx.auditLog.create({
        data: {
          eventType: "oracle_forecast_resolved",
          description: `Forecast "${forecast.title}" resolved. Outcome: ${resolvedOutcome}. ${correctCount} correct, ${incorrectCount} incorrect of ${forecast.predictions.length} total.`,
          ledgerId: admin.ledgerId,
          metadata: JSON.stringify({
            forecastId,
            forecastTitle: forecast.title,
            resolvedOutcome,
            totalPredictions: forecast.predictions.length,
            correctCount,
            incorrectCount,
            forecastType: forecast.type,
          }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: now,
        },
      });

      return {
        forecast: updatedForecast,
        results,
        stats: {
          totalPredictions: forecast.predictions.length,
          correctCount,
          incorrectCount,
          accuracy:
            forecast.predictions.length > 0
              ? Math.round(
                  (correctCount / forecast.predictions.length) * 1000,
                ) / 10
              : 0,
        },
      };
    });

    // 7. Non-blocking: send notifications to winners
    // (Fire-and-forget — failures don't affect the response)
    const winners = result.results.filter((r) => r.wasCorrect);
    if (winners.length > 0) {
      Promise.all(
        winners.map((w) =>
          prisma.notification.create({
            data: {
              ledgerId: w.userId,
              type: "oracle_win",
              title: "The Oracle has spoken",
              message: `Your prediction on "${forecast.title}" was correct! +${w.pointsEarned} standing points.`,
              read: false,
              createdAt: new Date(),
            },
          }),
        ),
      ).catch(() => {
        // Notification failures are silent
      });
    }

    // 8. Response
    return NextResponse.json(
      {
        forecast: {
          id: result.forecast.id,
          title: forecast.title,
          status: result.forecast.status,
          resolvedOutcome: result.forecast.resolvedOutcome,
          resolveDate: result.forecast.resolveDate,
          type: forecast.type,
        },
        resolution: {
          winningVertical,
          winningCountry,
          totalPredictions: result.stats.totalPredictions,
          correctCount: result.stats.correctCount,
          incorrectCount: result.stats.incorrectCount,
          accuracy: result.stats.accuracy,
        },
        winners: winners.map((w) => ({
          userId: w.userId,
          pointsEarned: w.pointsEarned,
          streak: w.newStreak,
        })),
        topStreak:
          winners.length > 0 ? Math.max(...winners.map((w) => w.newStreak)) : 0,
        message: "The Oracle has spoken. Standings are rewritten.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[ORACLE_RESOLVE_POST]", error);

    // Prisma unique constraint (race condition on double-resolve)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Forecast already resolved. Refresh and try again.",
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
        {
          error: "Only the Architect may resolve the Oracle.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (error.message?.includes("Admin") || error.message?.includes("admin")) {
      return NextResponse.json(
        {
          error: "Only the Architect may resolve the Oracle.",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        error: "The Oracle could not be resolved.",
        code: "ORACLE_RESOLVE_001",
      },
      { status: 500 },
    );
  }
}