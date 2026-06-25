// app/api/oracle/standing/route.ts
// 8th Ledger — The Oracle: Your Standing
// GET: Auth required. Cached 30s. Returns your foresight score,
//      tier, progress, recent predictions, and global rank.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────
// CONSTANTS & TYPES
// ─────────────────────────────────────────────────────────────

type OracleTier = "novice" | "seer" | "oracle" | "prophet";

const TIER_THRESHOLDS: Record<OracleTier, number> = {
  novice: 0,
  seer: 10,
  oracle: 50,
  prophet: 100,
};

const TIER_META: Record<
  OracleTier,
  { label: string; icon: string; color: string; perk: string }
> = {
  novice: { label: "Novice", icon: "🔮", color: "#94a3b8", perk: "Enter the Oracle" },
  seer: { label: "Seer", icon: "🥉", color: "#cd7f32", perk: "Bronze icon, Codex access" },
  oracle: { label: "Oracle", icon: "🥈", color: "#c0c0c0", perk: "Silver icon, early pool access (24h)" },
  prophet: { label: "Prophet", icon: "🥇", color: "#ffd700", perk: "Gold icon, name on pool cards, Council invitation" },
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function getNextTier(current: OracleTier): OracleTier | null {
  const order: OracleTier[] = ["novice", "seer", "oracle", "prophet"];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

function calculateTier(correctCount: number): OracleTier {
  if (correctCount >= 100) return "prophet";
  if (correctCount >= 50) return "oracle";
  if (correctCount >= 10) return "seer";
  return "novice";
}

function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/oracle/standing
// Auth required. Cached 30s. Rich analytics.
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // 1. Strict auth
    const user = await requireAuth(req);

    // 2. Parallel fetch: standing + predictions + global stats
    const [standing, recentPredictions, globalStats] = await Promise.all([
      // Standing record
      prisma.oracleStanding.findUnique({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              avatar: true,
              country: true,
            },
          },
        },
      }),

      // Recent predictions (last 20) with forecast details
      prisma.oraclePrediction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          forecast: {
            select: {
              id: true,
              title: true,
              type: true,
              resolvedOutcome: true,
              status: true,
              lockDate: true,
              resolveDate: true,
              verticalOptions: true,
              countryOptions: true,
            },
          },
        },
      }),

      // Global stats for percentile calculation
      prisma.$transaction([
        prisma.oracleStanding.count(),
        prisma.oracleStanding.count({
          where: { totalPoints: { gt: { /* filled below */ } as any } },
        }),
      ]).catch(() => [0, 0] as [number, number]),
    ]);

    // 3. Handle first-time user (no standing yet)
    const defaultStanding = {
      id: null,
      userId: user.id,
      totalPoints: 0,
      correctCount: 0,
      totalPredictions: 0,
      tier: "novice" as OracleTier,
      streak: 0,
      lastCorrectAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        ledgerId: user.ledgerId,
        displayName: user.displayName,
        avatar: user.avatar,
        country: user.country,
      },
    };

    const s = standing ?? defaultStanding;

    // 4. Calculate analytics
    const accuracy =
      s.totalPredictions > 0
        ? Math.round((s.correctCount / s.totalPredictions) * 1000) / 10
        : 0;

    const nextTier = getNextTier(s.tier as OracleTier);
    const nextTierThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
    const pointsToNext = nextTierThreshold ? nextTierThreshold - s.correctCount : 0;
    const progressPercent = nextTierThreshold
      ? Math.min(100, Math.round((s.correctCount / nextTierThreshold) * 100))
      : 100;

    // Global rank percentile (by totalPoints)
    const [totalOracles, higherRanked] = globalStats;
    const percentile =
      totalOracles > 0
        ? Math.round(((totalOracles - higherRanked) / totalOracles) * 100)
        : 100;

    // 5. Shape recent predictions
    const predictions = recentPredictions.map((p) => {
      const forecast = p.forecast;
      const verticalOptions = safeJsonParse<string[]>(forecast.verticalOptions, []);
      const countryOptions = safeJsonParse<string[]>(forecast.countryOptions, []);
      const resolvedParts = forecast.resolvedOutcome
        ? forecast.resolvedOutcome.split("|")
        : [];
      const [winVertical, winCountry] = resolvedParts;

      return {
        id: p.id,
        forecastId: forecast.id,
        forecastTitle: forecast.title,
        forecastType: forecast.type,
        forecastStatus: forecast.status,
        vertical: p.vertical,
        country: p.country,
        predictionStatus: p.status,
        pointsEarned: p.pointsEarned,
        predictedAt: p.createdAt,
        resolvedAt: forecast.resolveDate,
        resolvedOutcome: forecast.resolvedOutcome,
        wasCorrect: p.status === "correct",
        // Show what the winning combo was
        winningVertical: winVertical || null,
        winningCountry: winCountry || null,
        // Show available options at time of prediction
        options: {
          verticals: verticalOptions,
          countries: countryOptions,
        },
      };
    });

    // 6. Tier history / badges
    const allTiers = (Object.keys(TIER_THRESHOLDS) as OracleTier[]).map((tier) => ({
      tier,
      ...TIER_META[tier],
      threshold: TIER_THRESHOLDS[tier],
      isCurrent: tier === s.tier,
      isUnlocked: s.correctCount >= TIER_THRESHOLDS[tier],
    }));

    // 7. Response
    const response = NextResponse.json({
      standing: {
        userId: s.userId,
        ledgerId: s.user.ledgerId,
        displayName: s.user.displayName,
        avatar: s.user.avatar,
        country: s.user.country,

        // Core stats
        totalPoints: s.totalPoints,
        correctCount: s.correctCount,
        totalPredictions: s.totalPredictions,
        accuracy,
        streak: s.streak,
        lastCorrectAt: s.lastCorrectAt,

        // Tier
        tier: s.tier,
        currentTierMeta: TIER_META[s.tier as OracleTier],

        // Progress
        nextTier,
        nextTierMeta: nextTier ? TIER_META[nextTier] : null,
        pointsToNext,
        progressPercent,
        allTiers,

        // Global rank
        globalRank: {
          totalOracles,
          higherRanked,
          percentile, // 99 = top 1%
        },
      },
      predictions,
      summary: {
        pending: predictions.filter((p) => p.predictionStatus === "pending").length,
        correct: predictions.filter((p) => p.predictionStatus === "correct").length,
        incorrect: predictions.filter((p) => p.predictionStatus === "incorrect").length,
        totalPointsEarned: predictions.reduce((sum, p) => sum + p.pointsEarned, 0),
      },
      message:
        s.totalPredictions === 0
          ? "You have not yet entered the Oracle. Make your first forecast."
          : `You are a ${s.tier}. ${s.correctCount} correct of ${s.totalPredictions} (${accuracy}% accuracy).`,
    });

    // 8. Cache control — standing is personal but changes slowly
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (error: any) {
    console.error("[ORACLE_STANDING_GET]", error);

    if (error.message?.includes("Unauthorized") || error.message?.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Your standing cannot be read.", code: "ORACLE_STANDING_001" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// NOTE: Forecast resolution does NOT belong here.
// It belongs in: app/api/oracle/forecasts/[id]/resolve/route.ts
// (Admin-only POST that resolves a forecast and recalculates
// all affected standings atomically.)
// ─────────────────────────────────────────────────────────────