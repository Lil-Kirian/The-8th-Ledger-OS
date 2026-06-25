import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getGlobalSriLeaderboard, getSriTierMeta } from "@/lib/sri";

/* ============================================================
   GET /api/sri
   Global SRI data — leaderboard, stats, tier distribution.
   ============================================================ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    // Get leaderboard
    const leaderboard = await getGlobalSriLeaderboard(limit);

    // Get aggregate stats
    const allHalls = await prisma.hall.findMany({
      where: { status: { not: "dissolved" } },
      select: { sriScore: true },
    });

    const totalHalls = allHalls.length;
    const avgScore =
      totalHalls > 0
        ? Math.round(allHalls.reduce((s, h) => s + h.sriScore, 0) / totalHalls)
        : 0;

    const tierCounts = {
      platinum: allHalls.filter((h) => h.sriScore >= 90).length,
      gold: allHalls.filter((h) => h.sriScore >= 75 && h.sriScore < 90).length,
      silver: allHalls.filter((h) => h.sriScore >= 60 && h.sriScore < 75).length,
      bronze: allHalls.filter((h) => h.sriScore >= 40 && h.sriScore < 60).length,
      at_risk: allHalls.filter((h) => h.sriScore < 40).length,
    };

    const avgMeta = getSriTierMeta(avgScore);

    return NextResponse.json({
      global: {
        totalHalls,
        averageScore: avgScore,
        averageTier: avgMeta.tier,
        averageBadge: avgMeta.badge,
        tierDistribution: tierCounts,
      },
      leaderboard: leaderboard.map((h) => ({
        hallId: h.hallId,
        hallName: h.hallName,
        score: h.score,
        tier: h.tier,
        badge: h.badge,
        verticalId: h.verticalId,
      })),
      user: {
        ledgerId: auth.ledgerId,
        globalSriScore: auth.globalSriScore || 0,
      },
    });
  } catch (error) {
    console.error("[SRI GLOBAL]", error);
    return NextResponse.json({ error: "Failed to fetch SRI data" }, { status: 500 });
  }
}