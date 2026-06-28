// app/api/oracle/leaderboard/route.ts
// 8th Ledger — The Oracle: Global Standing Board
// GET: Public. Cached 120s. Optional auth enriches with your rank.
// The world sees the seers. You see where you stand.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

//
// CONSTANTS & TYPES
//

type OracleTier = "novice" | "seer" | "oracle" | "prophet";

const TIER_META: Record<
  OracleTier,
  { label: string; icon: string; color: string; gradient: string }
> = {
  novice: {
    label: "Novice",
    icon: "🔮",
    color: "#94a3b8",
    gradient: "from-slate-500 to-slate-600",
  },
  seer: {
    label: "Seer",
    icon: "🥉",
    color: "#cd7f32",
    gradient: "from-amber-600 to-amber-700",
  },
  oracle: {
    label: "Oracle",
    icon: "🥈",
    color: "#c0c0c0",
    gradient: "from-gray-400 to-gray-500",
  },
  prophet: {
    label: "Prophet",
    icon: "🥇",
    color: "#ffd700",
    gradient: "from-yellow-400 to-yellow-500",
  },
};

const VALID_TIERS: OracleTier[] = ["novice", "seer", "oracle", "prophet"];

//
// HELPERS
//

function isValidTier(tier: string): tier is OracleTier {
  return VALID_TIERS.includes(tier as OracleTier);
}

function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 1000) / 10;
}

//
// GET /api/oracle/leaderboard
// Public. Cached 120s. Tier filter. Pagination. Optional auth.
//

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Parse query params
    const tierRaw = searchParams.get("tier");
    const tier: OracleTier | undefined = tierRaw && isValidTier(tierRaw) ? tierRaw : undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    // 2. Optional auth — enriches with "your rank"
    let currentUserId: string | null = null;
    try {
      const user = await getSessionUser(req);
      if (user) currentUserId = user.id;
    } catch {
      // Public endpoint — auth failure is fine
    }

    // 3. Build where clause
    const where: {
      tier?: OracleTier;
      totalPoints?: { gt: number };
    } = {};

    if (tier) where.tier = tier;

    // 4. Parallel fetch: leaderboard + total count
    const [standings, total] = await Promise.all([
      prisma.oracleStanding.findMany({
        where,
        orderBy: [{ totalPoints: "desc" }, { correctCount: "desc" }, { updatedAt: "asc" }],
        skip,
        take: limit,
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
      prisma.oracleStanding.count({ where }),
    ]);

    // 5. Shape leaderboard entries
    const leaderboard = standings.map((s, index) => {
      const rank = skip + index + 1;
      const accuracy = calculateAccuracy(s.correctCount, s.totalPredictions);
      const tierMeta = TIER_META[s.tier as OracleTier] || TIER_META.novice;

      return {
        rank,
        userId: s.userId,
        ledgerId: s.user.ledgerId,
        displayName: s.user.displayName,
        avatar: s.user.avatar,
        country: s.user.country,
        totalPoints: s.totalPoints,
        correctCount: s.correctCount,
        totalPredictions: s.totalPredictions,
        accuracy,
        tier: s.tier,
        tierMeta,
        streak: s.streak,
        lastCorrectAt: s.lastCorrectAt,
        updatedAt: s.updatedAt,
      };
    });

    // 6. Calculate user's rank if authenticated (O(1) count query, not O(n) fetch)
    let yourRank = null;
    if (currentUserId) {
      const userStanding = await prisma.oracleStanding.findUnique({
        where: { userId: currentUserId },
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
      });

      if (userStanding) {
        // Count how many have MORE points than you (your rank = count + 1)
        const higherRanked = await prisma.oracleStanding.count({
          where: {
            totalPoints: { gt: userStanding.totalPoints },
          },
        });

        // Tie-breaker: same points but updated earlier (more senior) ranks higher
        const samePointsEarlier = await prisma.oracleStanding.count({
          where: {
            totalPoints: { equals: userStanding.totalPoints },
            correctCount: { gt: userStanding.correctCount },
          },
        });

        const rank = higherRanked + samePointsEarlier + 1;
        const accuracy = calculateAccuracy(
          userStanding.correctCount,
          userStanding.totalPredictions
        );
        const tierMeta = TIER_META[userStanding.tier as OracleTier] || TIER_META.novice;

        yourRank = {
          rank,
          totalOutOf: total,
          percentile: Math.max(1, Math.round(((total - rank + 1) / total) * 100)),
          ledgerId: userStanding.user.ledgerId,
          displayName: userStanding.user.displayName,
          avatar: userStanding.user.avatar,
          country: userStanding.user.country,
          totalPoints: userStanding.totalPoints,
          correctCount: userStanding.correctCount,
          totalPredictions: userStanding.totalPredictions,
          accuracy,
          tier: userStanding.tier,
          tierMeta,
          streak: userStanding.streak,
          lastCorrectAt: userStanding.lastCorrectAt,
        };
      }
    }

    // 7. Tier distribution (public stats)
    const tierDistribution = await prisma.oracleStanding.groupBy({
      by: ["tier"],
      _count: { tier: true },
    }).catch(() => [] as { tier: string; _count: { tier: number } }[]);

    const tierStats = VALID_TIERS.map((t) => {
      const found = tierDistribution.find((d) => d.tier === t);
      return {
        tier: t,
        ...TIER_META[t],
        count: found?._count?.tier ?? 0,
      };
    });

    // 8. Response
    const response = NextResponse.json({
      leaderboard,
      yourRank,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        tierFilter: tier || null,
      },
      stats: {
        totalOracles: total,
        tierDistribution: tierStats,
      },
      message: "The Oracle reveals the seers.",
    });

    // 9. Public cache: 120s — leaderboard is low-volatility, high-read
    response.headers.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return response;
  } catch (error) {
    console.error("[ORACLE_LEADERBOARD_GET]", error);
    return NextResponse.json(
      { error: "The leaderboard cannot be read.", code: "ORACLE_LEADERBOARD_001" },
      { status: 500 }
    );
  }
}