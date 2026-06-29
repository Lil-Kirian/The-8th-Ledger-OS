// app/api/agora/pulse/route.ts
// 8th Ledger — The Pulse: System Health Dashboard
// Public. Cached 30s. Every number tells a story of momentum.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

//
// TYPES
//

interface PulseMetrics {
  pools: {
    active: number;
    filling: number;
    forged: number;
    totalCommitted: number;
    totalParticipants: number;
    targetProgress: number; // % of target filled across active pools
  };
  halls: {
    live: number;
    mature: number;
    total: number;
    avgSri: number;
    platinum: number;
    gold: number;
    warning: number;
    liquidation: number;
  };
  capital: {
    dividendsThisMonth: number;
    dividendsLastMonth: number;
    changePercent: number;
    totalDistributedAllTime: number;
  };
  governance: {
    proposals24h: number;
    votes24h: number;
    newOwners24h: number;
    activeProposals: number;
  };
  meridian: {
    phase: string | null;
    continent: string | null;
    timeRemaining: number | null; // seconds
    competingPools: number | null;
    totalVotes: number | null;
  };
  oracle: {
    activeForecasts: number;
    totalPredictions: number;
    totalStandingPoints: number;
    topTier: string | null;
  };
  agora: {
    pendingSuggestions: number;
    answeredQuestions: number;
    totalSuggestions: number;
  };
  system: {
    status: "BEATING" | "RACING" | "FLAT";
    score: number; // 0-100
    lastUpdated: string;
  };
}

//
// HELPERS
//

function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function getPreviousMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const end = new Date(date.getFullYear(), date.getMonth(), 1);
  return { start, end };
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function calculateSystemScore(metrics: PulseMetrics): number {
  // Weighted composite score (0-100)
  // Capital flow: 30%
  // Governance activity: 25%
  // Hall health: 20%
  // Pool momentum: 15%
  // Oracle engagement: 10%

  const capitalScore = Math.min(100, (metrics.capital.dividendsThisMonth / 100_000) * 100);
  const governanceScore = Math.min(
    100,
    ((metrics.governance.proposals24h + metrics.governance.votes24h) / 500) * 100
  );
  const hallScore = Math.min(100, metrics.halls.avgSri);
  const poolScore = Math.min(100, (metrics.pools.totalParticipants / 1000) * 100);
  const oracleScore = Math.min(100, (metrics.oracle.totalPredictions / 5000) * 100);

  return Math.round(
    capitalScore * 0.3 +
    governanceScore * 0.25 +
    hallScore * 0.2 +
    poolScore * 0.15 +
    oracleScore * 0.1
  );
}

function determineStatus(score: number, changePercent: number): PulseMetrics["system"]["status"] {
  if (score >= 70 && changePercent > 0) return "BEATING";
  if (score >= 40 || changePercent > 0) return "RACING";
  return "FLAT";
}

//
// GET /api/agora/pulse
// Public. 30s cache. 12 parallel queries for sub-100ms response.
//

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { start: startOfMonth } = getMonthBounds(now);
    const { start: startOfLastMonth, end: endOfLastMonth } =
      getPreviousMonthBounds(now);

    // ── Parallel aggregation queries
    const [
      // Pools
      activePools,
      fillingPools,
      forgedPools,
      committedAgg,
      participantsAgg,
      targetAgg,

      // Halls
      liveHalls,
      matureHalls,
      totalHalls,
      sriAgg,
      platinumHalls,
      goldHalls,
      warningHalls,
      liquidationHalls,

      // Capital
      revenueThisMonth,
      revenueLastMonth,
      totalDistributedAgg,

      // Governance
      proposals24h,
      votes24h,
      newOwners24h,
      activeProposals,

      // Meridian
      currentCycle,
      cyclePools,
      cycleVotes,

      // Oracle
      activeForecasts,
      totalPredictions,
      totalStandingPoints,
      topOracleStanding,

      // Agora
      pendingSuggestions,
      answeredQuestions,
      totalSuggestions,
    ] = await Promise.all([
      // ── Pools ─
      prisma.pool.count({
        where: { status: { in: ["filling", "filled", "forged", "active"] } },
      }),
      prisma.pool.count({ where: { status: "filling" } }),
      prisma.pool.count({ where: { status: "forged" } }),
      prisma.pool.aggregate({
        where: { status: { in: ["filling", "filled", "forged", "active"] } },
        _sum: { committed: true },
      }),
      prisma.pool.aggregate({ _sum: { participants: true } }),
      prisma.pool.aggregate({
        where: { status: { in: ["filling", "filled", "forged", "active"] } },
        _sum: { target: true },
      }),

      // ── Halls ─
      prisma.hall.count({ where: { status: "live" } }),
      prisma.hall.count({ where: { status: "mature" } }),
      prisma.hall.count(),
      prisma.hall.aggregate({
        where: { status: { in: ["live", "mature"] } },
        _avg: { sriScore: true },
      }),
      prisma.hall.count({ where: { status: "live", sriScore: { gte: 90 } } }),
      prisma.hall.count({
        where: { status: "live", sriScore: { gte: 75, lt: 90 } },
      }),
      prisma.hall.count({ where: { closureStatus: "warning" } }),
      prisma.hall.count({ where: { closureStatus: "liquidation" } }),

      // ── Capital ─
      prisma.revenueLog.aggregate({
        where: { createdAt: { gte: startOfMonth }, distributed: true },
        _sum: { communityNet: true },
      }),
      prisma.revenueLog.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lt: endOfLastMonth },
          distributed: true,
        },
        _sum: { communityNet: true },
      }),
      prisma.revenueLog.aggregate({
        where: { distributed: true },
        _sum: { communityNet: true },
      }),

      // ── Governance
      prisma.proposal.count({ where: { createdAt: { gte: last24h } } }),
      prisma.vote.count({ where: { createdAt: { gte: last24h } } }),
      prisma.ownership.count({ where: { createdAt: { gte: last24h } } }),
      prisma.proposal.count({
        where: { status: { in: ["pending", "active"] }, endsAt: { gt: now } },
      }),

      // ── Meridian
      prisma.meridianCycle.findFirst({
        where: { phase: { not: "complete" } },
        orderBy: { startAt: "desc" },
        select: {
          phase: true,
          continent: true,
          startAt: true,
          endAt: true,
          id: true,
        },
      }),
      prisma.cyclePool.count({
        where: {
          cycle: { phase: { not: "complete" } },
        },
      }),
      prisma.cycleVote.count({
        where: {
          cycle: { phase: { not: "complete" } },
          votedAt: { gte: last24h },
        },
      }),

      // ── Oracle
      prisma.oracleForecast.count({ where: { status: "active" } }),
      prisma.oraclePrediction.count(),
      prisma.oracleStanding.aggregate({ _sum: { totalPoints: true } }),
      prisma.oracleStanding.findFirst({
        orderBy: { totalPoints: "desc" },
        select: { tier: true, totalPoints: true },
      }),

      // ── Agora ─
      prisma.agoraSuggestion.count({ where: { status: "pending" } }),
      prisma.agoraQA.count({ where: { status: "answered" } }),
      prisma.agoraSuggestion.count(),
    ]);

    // ── Shape metrics

    const totalCommitted = committedAgg._sum.committed || 0;
    const totalTarget = targetAgg._sum.target || 1;
    const totalParticipants = participantsAgg._sum.participants || 0;

    const dividendsThisMonth = revenueThisMonth._sum.communityNet || 0;
    const dividendsLastMonth = revenueLastMonth._sum.communityNet || 0;
    const totalDistributedAllTime = totalDistributedAgg._sum.communityNet || 0;

    const changePercent =
      dividendsLastMonth > 0
        ? Math.round(
            ((dividendsThisMonth - dividendsLastMonth) / dividendsLastMonth) *
              100,
          )
        : dividendsThisMonth > 0
          ? 100
          : 0;

    const avgSri = Math.round(sriAgg._avg.sriScore || 0);

    const meridianTimeRemaining = currentCycle?.endAt
      ? Math.max(
          0,
          Math.floor((currentCycle.endAt.getTime() - now.getTime()) / 1000),
        )
      : null;

    const metrics: PulseMetrics = {
      pools: {
        active: activePools,
        filling: fillingPools,
        forged: forgedPools,
        totalCommitted,
        totalParticipants,
        targetProgress: Math.round((totalCommitted / totalTarget) * 100),
      },
      halls: {
        live: liveHalls,
        mature: matureHalls,
        total: totalHalls,
        avgSri,
        platinum: platinumHalls,
        gold: goldHalls,
        warning: warningHalls,
        liquidation: liquidationHalls,
      },
      capital: {
        dividendsThisMonth,
        dividendsLastMonth,
        changePercent,
        totalDistributedAllTime,
      },
      governance: {
        proposals24h,
        votes24h,
        newOwners24h,
        activeProposals,
      },
      meridian: {
        phase: currentCycle?.phase ?? null,
        continent: currentCycle?.continent ?? null,
        timeRemaining: meridianTimeRemaining,
        competingPools: cyclePools,
        totalVotes: cycleVotes,
      },
      oracle: {
        activeForecasts,
        totalPredictions,
        totalStandingPoints: totalStandingPoints._sum.totalPoints || 0,
        topTier: topOracleStanding?.tier ?? null,
      },
      agora: {
        pendingSuggestions,
        answeredQuestions,
        totalSuggestions,
      },
      system: {
        status: "FLAT",
        score: 0,
        lastUpdated: now.toISOString(),
      },
    };

    // ── System status calculation ─
    metrics.system.score = calculateSystemScore(metrics);
    metrics.system.status = determineStatus(
      metrics.system.score,
      changePercent,
    );

    // ── Response ─
    const response = NextResponse.json({
      pulse: metrics,
      display: {
        totalCommittedFormatted: formatCurrency(totalCommitted),
        dividendsThisMonthFormatted: formatCurrency(dividendsThisMonth),
        dividendsLastMonthFormatted: formatCurrency(dividendsLastMonth),
        totalDistributedFormatted: formatCurrency(totalDistributedAllTime),
        meridianTimeRemainingFormatted:
          meridianTimeRemaining !== null
            ? new Date(meridianTimeRemaining * 1000).toISOString().substr(11, 8)
            : null,
      },
      meta: {
        cachedAt: now.toISOString(),
        nextRefresh: new Date(now.getTime() + 30_000).toISOString(),
      },
    });

    // 30s public cache — pulse must feel live but not hammer the DB
    response.headers.set(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=60",
    );
    return response;
  } catch (error) {
    console.error("[AGORA_PULSE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch pulse data", code: "AGORA_PULSE_001" },
      { status: 500 }
    );
  }
}