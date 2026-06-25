import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getGlobalAhgiLeaderboard, getAhgiStatusMeta } from "@/lib/ahgi";

/* ============================================================
   GET /api/ahgi
   Global AHGI data — leaderboard, stats, status distribution.
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
    const leaderboard = await getGlobalAhgiLeaderboard(limit);

    // Get aggregate stats
    const allHalls = await prisma.hall.findMany({
      where: { status: { not: "dissolved" } },
      select: { ahgiScore: true },
    });

    const totalHalls = allHalls.length;
    const avgScore =
      totalHalls > 0
        ? Math.round(allHalls.reduce((s, h) => s + h.ahgiScore, 0) / totalHalls)
        : 0;

    const statusCounts = {
      thriving: allHalls.filter((h) => h.ahgiScore >= 80).length,
      healthy: allHalls.filter((h) => h.ahgiScore >= 60 && h.ahgiScore < 80).length,
      stagnant: allHalls.filter((h) => h.ahgiScore >= 40 && h.ahgiScore < 60).length,
      declining: allHalls.filter((h) => h.ahgiScore >= 20 && h.ahgiScore < 40).length,
      critical: allHalls.filter((h) => h.ahgiScore < 20).length,
    };

    const avgMeta = getAhgiStatusMeta(avgScore);

    return NextResponse.json({
      global: {
        totalHalls,
        averageScore: avgScore,
        averageStatus: avgMeta.status,
        averageLabel: avgMeta.label,
        statusDistribution: statusCounts,
      },
      leaderboard: leaderboard.map((h) => ({
        hallId: h.hallId,
        hallName: h.hallName,
        score: h.score,
        status: h.status,
        verticalId: h.verticalId,
      })),
    });
  } catch (error) {
    console.error("[AHGI GLOBAL]", error);
    return NextResponse.json({ error: "Failed to fetch AHGI data" }, { status: 500 });
  }
}