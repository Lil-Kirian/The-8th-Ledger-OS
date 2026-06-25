import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LeaderboardFilter = "referrals" | "committed" | "poolsWon" | "trustScore";

const VALID_FILTERS: LeaderboardFilter[] = [
  "referrals",
  "committed",
  "poolsWon",
  "trustScore",
];

// GET /api/knot/leaderboard?by=referrals&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const by = (searchParams.get("by") as LeaderboardFilter) || "referrals";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const country = searchParams.get("country") || undefined;

    if (!VALID_FILTERS.includes(by)) {
      return NextResponse.json(
        { error: "Invalid filter", valid: VALID_FILTERS },
        { status: 400 }
      );
    }

    const orderField = {
      referrals: { referrals: "desc" as const },
      committed: { totalCommitted: "desc" as const },
      poolsWon: { poolsWon: "desc" as const },
      trustScore: { trustScore: "desc" as const },
    }[by];

    const where = country ? { country } : {};

    const leaders = await prisma.knotMember.findMany({
      where,
      orderBy: [orderField, { joinedAt: "asc" }],
      take: limit,
      select: {
        ledgerId: true,
        displayName: true,
        country: true,
        tier: true,
        joinedAt: true,
        totalCommitted: true,
        poolsWon: true,
        trustScore: true,
        referrals: true,
        depth: true,
      },
    });

    // Add rank position
    const ranked = leaders.map((member, index) => ({
      rank: index + 1,
      ...member,
    }));

    // Get aggregate stats
    const stats = await prisma.knotMember.aggregate({
      where,
      _avg: { trustScore: true, referrals: true },
      _max: { trustScore: true, referrals: true, totalCommitted: true, poolsWon: true },
    });

    return NextResponse.json({
      filter: by,
      country: country || "global",
      totalReturned: ranked.length,
      leaders: ranked,
      stats: {
        avgTrustScore: stats._avg.trustScore || 0,
        avgReferrals: stats._avg.referrals || 0,
        maxTrustScore: stats._max.trustScore || 0,
        maxReferrals: stats._max.referrals || 0,
        maxCommitted: stats._max.totalCommitted || 0,
        maxPoolsWon: stats._max.poolsWon || 0,
      },
    });
  } catch (error) {
    console.error("[LEADERBOARD_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}