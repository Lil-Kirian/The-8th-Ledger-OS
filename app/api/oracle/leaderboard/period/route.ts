// app/api/oracle/leaderboard/period/route.ts
// 8th Ledger — The Oracle: Periodic Standing Board
// GET: Public. Rolling periods (week/month/quarter/year).
// Aggregates predictions within the period, ranks by points earned.
// Optional auth enriches with your rank.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

//
// CONSTANTS & TYPES
//

type Period = "week" | "month" | "quarter" | "year";

const PERIOD_DAYS: Record<Period, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const TIER_META: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  novice: { label: "Novice", icon: "🔮", color: "#94a3b8" },
  seer: { label: "Seer", icon: "🥉", color: "#cd7f32" },
  oracle: { label: "Oracle", icon: "🥈", color: "#c0c0c0" },
  prophet: { label: "Prophet", icon: "🥇", color: "#ffd700" },
};

//
// HELPERS
//

function isValidPeriod(p: string): p is Period {
  return ["week", "month", "quarter", "year"].includes(p);
}

function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 1000) / 10;
}

function getPeriodBounds(period: Period): { start: Date; end: Date; label: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - PERIOD_DAYS[period]);
  start.setHours(0, 0, 0, 0);

  const label =
    period === "week"
      ? "Last 7 Days"
      : period === "month"
      ? "Last 30 Days"
      : period === "quarter"
      ? "Last 90 Days"
      : "Last 365 Days";

  return { start, end, label };
}

//
// GET /api/oracle/leaderboard/period?period=month
// Public. Rolling period. Aggregates predictions, not cumulative standings.
//

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Parse period
    const periodRaw = searchParams.get("period") || "month";
    const period: Period = isValidPeriod(periodRaw) ? periodRaw : "month";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    // 2. Optional auth
    let currentUserId: string | null = null;
    try {
      const user = await getSessionUser(req);
      if (user) currentUserId = user.id;
    } catch {
      // Public endpoint
    }

    // 3. Calculate period bounds
    const { start, end, label } = getPeriodBounds(period);

    // 4. Fetch all predictions in period with user data
    // This is a bounded query — max ~10k predictions per month even at scale
    const predictions = await prisma.oraclePrediction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        userId: true,
        pointsEarned: true,
        status: true,
        forecastId: true,
        user: {
          select: {
            ledgerId: true,
            displayName: true,
            avatar: true,
            country: true,
          },
        },
      },
    });

    // 5. Aggregate by user in memory (O(n), n = predictions in period)
    const userMap = new Map<
      string,
      {
        userId: string;
        ledgerId: string;
        displayName: string;
        avatar: string | null;
        country: string;
        totalPoints: number;
        correctCount: number;
        incorrectCount: number;
        totalPredictions: number;
        forecastIds: Set<string>;
      }
    >();

    for (const pred of predictions) {
      const existing = userMap.get(pred.userId);
      if (existing) {
        existing.totalPoints += pred.pointsEarned;
        existing.totalPredictions += 1;
        existing.forecastIds.add(pred.forecastId);
        if (pred.status === "correct") existing.correctCount += 1;
        else if (pred.status === "incorrect") existing.incorrectCount += 1;
      } else {
        userMap.set(pred.userId, {
          userId: pred.userId,
          ledgerId: pred.user.ledgerId,
          displayName: pred.user.displayName,
          avatar: pred.user.avatar,
          country: pred.user.country,
          totalPoints: pred.pointsEarned,
          correctCount: pred.status === "correct" ? 1 : 0,
          incorrectCount: pred.status === "incorrect" ? 1 : 0,
          totalPredictions: 1,
          forecastIds: new Set([pred.forecastId]),
        });
      }
    }

    // 6. Convert to array, sort, rank
    const allEntries = Array.from(userMap.values())
      .map((entry) => ({
        ...entry,
        accuracy: calculateAccuracy(entry.correctCount, entry.totalPredictions),
        uniqueForecasts: entry.forecastIds.size,
        forecastIds: undefined, // Remove Set from response
      }))
      .sort((a, b) => {
        // Primary: total points in period
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        // Tie-breaker: correct count
        if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
        // Tie-breaker: accuracy
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        // Final tie-breaker: seniority (fewer predictions = more efficient = higher rank)
        return a.totalPredictions - b.totalPredictions;
      });

    const total = allEntries.length;
    const paginated = allEntries.slice((page - 1) * limit, page * limit);

    const leaderboard = paginated.map((entry, index) => {
      const rank = (page - 1) * limit + index + 1;
      return {
        rank,
        userId: entry.userId,
        ledgerId: entry.ledgerId,
        displayName: entry.displayName,
        avatar: entry.avatar,
        country: entry.country,
        totalPoints: entry.totalPoints,
        correctCount: entry.correctCount,
        incorrectCount: entry.incorrectCount,
        totalPredictions: entry.totalPredictions,
        uniqueForecasts: entry.uniqueForecasts,
        accuracy: entry.accuracy,
      };
    });

    // 7. Your rank if authenticated
    let yourRank = null;
    if (currentUserId) {
      const yourIndex = allEntries.findIndex((e) => e.userId === currentUserId);
      if (yourIndex !== -1) {
        const you = allEntries[yourIndex];
        yourRank = {
          rank: yourIndex + 1,
          totalOutOf: total,
          percentile: Math.max(1, Math.round(((total - yourIndex) / total) * 100)),
          totalPoints: you.totalPoints,
          correctCount: you.correctCount,
          incorrectCount: you.incorrectCount,
          totalPredictions: you.totalPredictions,
          uniqueForecasts: you.uniqueForecasts,
          accuracy: you.accuracy,
        };
      }
    }

    // 8. Period stats
    const stats = {
      totalPredictionsInPeriod: predictions.length,
      uniqueParticipants: userMap.size,
      totalPointsDistributed: allEntries.reduce((sum, e) => sum + e.totalPoints, 0),
      correctPredictions: allEntries.reduce((sum, e) => sum + e.correctCount, 0),
      incorrectPredictions: allEntries.reduce((sum, e) => sum + e.incorrectCount, 0),
      overallAccuracy:
        predictions.length > 0
          ? Math.round(
              (allEntries.reduce((sum, e) => sum + e.correctCount, 0) / predictions.length) *
                1000
            ) / 10
          : 0,
    };

    // 9. Response
    const response = NextResponse.json({
      leaderboard,
      yourRank,
      period: {
        type: period,
        label,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
      message: `The Oracle reveals the seers of the ${label.toLowerCase()}.`,
    });

    // 10. Cache: 60s — period data changes as new predictions come in
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("[ORACLE_LEADERBOARD_PERIOD_GET]", error);
    return NextResponse.json(
      { error: "The periodic leaderboard cannot be read.", code: "ORACLE_PERIOD_001" },
      { status: 500 }
    );
  }
}