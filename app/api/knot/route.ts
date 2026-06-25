import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface KnotResponse {
  success: boolean;
  network?: any[];
  oraclePredictions?: any[];
  rewards?: any[];
  leaderboard?: any[];
  stats?: any;
  error?: string;
  message?: string;
}

/* ============================================================
   REWARD CALCULATOR — Multi-level Knot rewards
   ============================================================ */
function calculateReward(
  depth: number,
  activityType: "commit" | "win" | "forge"
): number {
  const baseRates = {
    commit: [0.05, 0.02, 0.01],
    win: [0.02, 0.01, 0.005],
    forge: [0.01, 0.005, 0.0025],
  };
  const rate = baseRates[activityType][Math.min(depth - 1, 2)] || 0;
  return rate;
}

/* ============================================================
   GET /api/knot — Network, oracle standings, rewards, leaderboard
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    if (!user && type !== "leaderboard") {
      return NextResponse.json<KnotResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const response: KnotResponse = { success: true };

    if ((type === "all" || type === "network" || type === "stats") && user) {
      const direct = await prisma.knotMember.findMany({
        where: { referredBy: user.ledgerId },
      });

      const depth2LedgerIds = direct.map((d) => d.ledgerId);
      const depth2 = await prisma.knotMember.findMany({
        where: { referredBy: { in: depth2LedgerIds } },
      });

      const depth3LedgerIds = depth2.map((d) => d.ledgerId);
      const depth3 = await prisma.knotMember.findMany({
        where: { referredBy: { in: depth3LedgerIds } },
      });

      const totalNetwork = direct.length + depth2.length + depth3.length;

      const userRewards = await prisma.referralReward.findMany({
        where: { toLedgerId: user.ledgerId },
      });

      const totalRewards = userRewards
        .filter((r) => r.status === "paid")
        .reduce((a, r) => a + Number(r.rewardAmount), 0);

      const pendingRewards = userRewards
        .filter((r) => r.status === "pending")
        .reduce((a, r) => a + Number(r.rewardAmount), 0);

      const code = await prisma.inviteCode.findFirst({
        where: { ownerId: user.ledgerId },
      });

      response.stats = {
        directReferrals: direct.length,
        networkDepth: depth3.length > 0 ? 3 : depth2.length > 0 ? 2 : 1,
        totalNetwork,
        totalRewards,
        pendingRewards,
        inviteCode: code?.code || "No code",
        codeUses: code?.uses || 0,
        codeMax: code?.maxUses || 50,
      };

      if (type === "network" || type === "all") {
        response.network = [...direct, ...depth2, ...depth3];
      }
    }

    if ((type === "all" || type === "predictions") && user) {
      // Betting replaced by Oracle standing system (Phase 1)
      response.oraclePredictions = await prisma.oraclePrediction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          forecast: { select: { title: true, type: true, status: true } },
        },
      });
    }

    if ((type === "all" || type === "rewards") && user) {
      response.rewards = await prisma.referralReward.findMany({
        where: { toLedgerId: user.ledgerId },
        orderBy: { createdAt: "desc" },
      });
    }

    if (type === "all" || type === "leaderboard") {
      const allPredictions = await prisma.oraclePrediction.findMany({
        where: { status: { in: ["correct", "incorrect"] } },
        include: { user: { select: { displayName: true, country: true, tier: true, ledgerId: true } } },
      });

      const userStats = new Map<
        string,
        {
          ledgerId: string;
          displayName: string;
          country: string;
          tier: number;
          correct: number;
          total: number;
          totalPoints: number;
          streak: number;
          currentStreak: number;
        }
      >();

      for (const p of allPredictions) {
        const ledgerId = p.user?.ledgerId || p.userId;
        if (!userStats.has(ledgerId)) {
          userStats.set(ledgerId, {
            ledgerId,
            displayName: p.user?.displayName || "Unknown",
            country: p.user?.country || "Unknown",
            tier: p.user?.tier || 1,
            correct: 0,
            total: 0,
            totalPoints: 0,
            streak: 0,
            currentStreak: 0,
          });
        }

        const stats = userStats.get(ledgerId)!;
        stats.total += 1;

        if (p.status === "correct") {
          stats.correct += 1;
          stats.currentStreak += 1;
          stats.totalPoints += p.pointsEarned || 0;
          if (stats.currentStreak > stats.streak) {
            stats.streak = stats.currentStreak;
          }
        } else {
          stats.currentStreak = 0;
        }
      }

      const leaderboard = Array.from(userStats.values())
        .map((s) => ({
          rank: 0,
          ledgerId: s.ledgerId,
          displayName: s.displayName,
          country: s.country,
          tier: s.tier,
          correctPredictions: s.correct,
          totalPredictions: s.total,
          accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0,
          totalPoints: s.totalPoints,
          streak: s.streak,
        }))
        .sort((a, b) => b.accuracy - a.accuracy || b.totalPoints - a.totalPoints)
        .map((e, i) => ({ ...e, rank: i + 1 }))
        .slice(0, 50);

      response.leaderboard = leaderboard;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[KNOT GET]", error);
    return NextResponse.json<KnotResponse>(
      { success: false, error: "Knot data unavailable" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/knot — Oracle forecast, redeem code, record referral
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<KnotResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    /* ===== SUBMIT ORACLE FORECAST ===== */
    if (action === "predict") {
      // Betting system retired. Oracle forecasts are free standing-based predictions.
      return NextResponse.json<KnotResponse>(
        {
          success: false,
          error: "Betting system retired. Use /api/oracle/forecasts to make free standing-based predictions.",
        },
        { status: 410 }
      );
    }

    /* ===== USE INVITE CODE ===== */
    if (action === "redeem") {
      const { inviteCode } = body;

      if (!inviteCode) {
        return NextResponse.json<KnotResponse>(
          { success: false, error: "Invite code required" },
          { status: 400 }
        );
      }

      const codeData = await prisma.inviteCode.findUnique({
        where: { code: inviteCode.toUpperCase() },
      });

      if (!codeData) {
        return NextResponse.json<KnotResponse>(
          { success: false, error: "Invalid invite code" },
          { status: 404 }
        );
      }

      if (codeData.uses >= codeData.maxUses) {
        return NextResponse.json<KnotResponse>(
          { success: false, error: "Invite code exhausted" },
          { status: 409 }
        );
      }

      await prisma.inviteCode.update({
        where: { id: codeData.id },
        data: { uses: { increment: 1 } },
      });

      if (!user.referredBy) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referredBy: codeData.ownerId },
        });
      }

      await prisma.knotMember.upsert({
        where: { ledgerId: user.ledgerId },
        create: {
          ledgerId: user.ledgerId,
          displayName: user.displayName,
          country: user.country,
          tier: user.tier,
          referredBy: codeData.ownerId,
        },
        update: {
          referredBy: codeData.ownerId,
        },
      });

      return NextResponse.json<KnotResponse>({
        success: true,
        message: "Invite code accepted. Welcome to the Knot.",
      });
    }

    /* ===== RECORD REFERRAL ACTIVITY ===== */
    if (action === "record") {
      const { fromLedgerId, activityType, amount } = body;

      if (!fromLedgerId || !activityType || !amount) {
        return NextResponse.json<KnotResponse>(
          { success: false, error: "Missing referral activity data" },
          { status: 400 }
        );
      }

      const rewardChain: { ledgerId: string; depth: number }[] = [];
      let currentLedgerId = fromLedgerId;

      for (let depth = 1; depth <= 3; depth++) {
        const member = await prisma.knotMember.findUnique({
          where: { ledgerId: currentLedgerId },
        });
        if (!member?.referredBy) break;
        rewardChain.push({ ledgerId: member.referredBy, depth });
        currentLedgerId = member.referredBy;
      }

      const newRewards = [];
      for (const { ledgerId, depth } of rewardChain) {
        const rate = calculateReward(depth, activityType as "commit" | "win" | "forge");
        const rewardAmount = amount * rate;

        if (rewardAmount > 0) {
          const fromMember = await prisma.knotMember.findUnique({
            where: { ledgerId: fromLedgerId },
          });

          const reward = await prisma.referralReward.create({
            data: {
              toLedgerId: ledgerId,
              fromLedgerId: fromLedgerId,
              fromDisplayName: fromMember?.displayName || "Unknown",
              type: activityType,
              amount: Number(amount),
              rewardPercent: rate * 100,
              rewardAmount,
              status: "pending",
            },
          });

          newRewards.push(reward);
        }
      }

      return NextResponse.json<KnotResponse>({
        success: true,
        rewards: newRewards,
        message: `${newRewards.length} referral reward(s) queued`,
      });
    }

    return NextResponse.json<KnotResponse>(
      { success: false, error: 'Invalid action. Use "redeem" or "record"' },
      { status: 400 }
    );
  } catch (error) {
    console.error("[KNOT POST]", error);
    return NextResponse.json<KnotResponse>(
      { success: false, error: "Knot operation failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH /api/knot — Betting resolution retired
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<KnotResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json<KnotResponse>({
      success: false,
      error: "Betting resolution retired. The Oracle standing system replaces pooled betting. Use /api/oracle instead.",
    }, { status: 410 });
  } catch (error) {
    console.error("[KNOT PATCH]", error);
    return NextResponse.json<KnotResponse>(
      { success: false, error: "Operation failed" },
      { status: 500 }
    );
  }
}