import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   8TH LEDGER — QUANTUM MERIT CONSENSUS (QMC)
   Winner Selection Engine
   ============================================================ */

const WEIGHTS = {
  ownershipBase: 0.35,
  poolHistory: 0.20,
  community: 0.15,
  reviewQuality: 0.10,
  identity: 0.10,
  arcStreak: 0.05,
  countryDiversity: 0.05,
} as const;

/* ============================================================
   TYPES
   ============================================================ */
interface MeritBreakdown {
  dimension: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
}

interface MeritScore {
  ledgerId: string;
  displayName: string;
  country: string;
  avatar?: string | null;
  ownershipBase: number;
  poolHistoryScore: number;
  communityScore: number;
  reviewQualityScore: number;
  identityScore: number;
  arcStreakScore: number;
  countryDiversityScore: number;
  totalMeritScore: number;
  rank: number;
  breakdown: MeritBreakdown[];
}

/* ============================================================
   PURE MERIT ENGINE
   ============================================================ */
function calculateArcStreak(dividendEntries: { claimedAt: Date | null }[]): number {
  if (!dividendEntries.length) return 0;
  const sorted = [...dividendEntries].sort(
    (a, b) => (b.claimedAt ? new Date(b.claimedAt).getTime() : 0) - (a.claimedAt ? new Date(a.claimedAt).getTime() : 0)
  );
  let streak = 0;
  for (const entry of sorted) {
    if (entry.claimedAt) streak++;
    else break;
  }
  return streak;
}

function calculateReviewQuality(
  reviews: { rating: number; createdAt: Date }[]
): { quality: number; recencyBoost: number } {
  if (!reviews.length) return { quality: 0, recencyBoost: 0 };
  const now = Date.now();
  let weightedSum = 0;
  let weightSum = 0;
  for (const r of reviews) {
    const daysAgo = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const decay = Math.exp(-daysAgo / 90);
    weightedSum += r.rating * decay;
    weightSum += decay;
  }
  const avg = weightedSum / (weightSum || 1);
  return {
    quality: Math.round(avg * reviews.length * 12),
    recencyBoost: Math.round(weightSum * 10),
  };
}

function calculatePoolHistory(
  ownerships: { amountCommitted: number; pool: { assetValue: number; createdAt: Date } }[]
): number {
  if (!ownerships.length) return 0;
  const now = Date.now();
  return ownerships.reduce((sum, o) => {
    const daysAgo = (now - new Date(o.pool.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recency = Math.exp(-daysAgo / 180);
    const valueWeight = Math.min(o.pool.assetValue / 10000, 5);
    return sum + 40 * recency * valueWeight + o.amountCommitted / 20;
  }, 0);
}

function calculateCountryDiversity(
  userCountry: string,
  countryCounts: Record<string, number>,
  total: number
): number {
  const count = countryCounts[userCountry] || 1;
  const rarityRatio = total / count;
  return Math.min(Math.round(rarityRatio * 25), 150);
}

function buildMeritScore(
  user: unknown,
  userOwnerships: unknown[],
  userReviews: unknown[],
  userDividendEntries: unknown[],
  kycRecord: unknown | null,
  countryCounts: Record<string, number>,
  totalParticipants: number
): MeritScore {
  const ownershipBase = Math.min(user.totalCommitted || 0, 1000);

  const poolHistoryRaw = calculatePoolHistory(userOwnerships);
  const poolHistoryScore = Math.min(poolHistoryRaw, 800);

  const { quality: reviewQualityRaw, recencyBoost } = calculateReviewQuality(userReviews);
  const reviewQualityScore = Math.min(reviewQualityRaw + recencyBoost, 400);

  const communityScore = Math.min(
    userReviews.length * 20 + (user.referrals || 0) * 15 + (user.reportsSubmitted || 0) * 10,
    300
  );

  const identityScore = Math.min((kycRecord?.verificationTier || 0) * 50, 200);

  const streak = calculateArcStreak(userDividendEntries);
  const arcStreakScore = Math.min(streak * 35, 250);

  const countryDiversityScore = calculateCountryDiversity(
    user.country || "Unknown",
    countryCounts,
    totalParticipants
  );

  const breakdown: MeritBreakdown[] = [
    { dimension: "Ownership Base", weight: WEIGHTS.ownershipBase, rawScore: ownershipBase, weightedScore: ownershipBase * WEIGHTS.ownershipBase },
    { dimension: "Pool History", weight: WEIGHTS.poolHistory, rawScore: poolHistoryScore, weightedScore: poolHistoryScore * WEIGHTS.poolHistory },
    { dimension: "Community", weight: WEIGHTS.community, rawScore: communityScore, weightedScore: communityScore * WEIGHTS.community },
    { dimension: "Review Quality", weight: WEIGHTS.reviewQuality, rawScore: reviewQualityScore, weightedScore: reviewQualityScore * WEIGHTS.reviewQuality },
    { dimension: "Identity", weight: WEIGHTS.identity, rawScore: identityScore, weightedScore: identityScore * WEIGHTS.identity },
    { dimension: "Dividend Streak", weight: WEIGHTS.arcStreak, rawScore: arcStreakScore, weightedScore: arcStreakScore * WEIGHTS.arcStreak },
    { dimension: "Global Diversity", weight: WEIGHTS.countryDiversity, rawScore: countryDiversityScore, weightedScore: countryDiversityScore * WEIGHTS.countryDiversity },
  ];

  const totalMeritScore = Math.round(breakdown.reduce((s, b) => s + b.weightedScore, 0));

  return {
    ledgerId: user.ledgerId,
    displayName: user.displayName || "Anonymous",
    country: user.country || "Unknown",
    avatar: user.avatar,
    ownershipBase,
    poolHistoryScore: Math.round(poolHistoryScore),
    communityScore: Math.round(communityScore),
    reviewQualityScore: Math.round(reviewQualityScore),
    identityScore: Math.round(identityScore),
    arcStreakScore: Math.round(arcStreakScore),
    countryDiversityScore: Math.round(countryDiversityScore),
    totalMeritScore,
    rank: 0,
    breakdown,
  };
}

/* ============================================================
   AUTH ERROR
   ============================================================ */
class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/* ============================================================
   GET — Preview Merit Scores (Dry Run)
   ============================================================ */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      throw new AuthError("Architect authority required. Primary admin access only.", 403);
    }

    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get("poolId");
    if (!poolId) {
      return NextResponse.json({ success: false, error: "Pool ID required" }, { status: 400 });
    }

    const pool = await prisma.pool.findUnique({
      where: { poolId },
      include: {
        ownerships: {
          include: { user: true },
        },
      },
    });

    if (!pool) {
      return NextResponse.json({ success: false, error: "Pool not found" }, { status: 404 });
    }

    const participants = pool.ownerships.map((o) => o.user);
    const lids = participants.map((u) => u.ledgerId);

    // Bulk fetch all merit data
    const [allOwnerships, allReviews, allDividendEntries, allKycRecords] = await Promise.all([
      prisma.ownership.findMany({
        where: { ledgerId: { in: lids } },
        include: { pool: { select: { assetValue: true, createdAt: true } } },
      }),
      prisma.poolReview.findMany({
        where: { ledgerId: { in: lids } },
        select: { ledgerId: true, rating: true, createdAt: true },
      }),
      prisma.dividendEntry.findMany({
        where: { ownership: { ledgerId: { in: lids } } },
        select: { claimedAt: true, ownership: { select: { ledgerId: true } } },
      }),
      prisma.kycRecord.findMany({
        where: { user: { ledgerId: { in: lids } } },
        select: { user: { select: { ledgerId: true } }, verificationTier: true, identityScore: true },
      }),
    ]);

    // Group by user
    const ownershipsByUser = groupBy(allOwnerships, "ledgerId");
    const reviewsByUser = groupBy(allReviews, "ledgerId");
    const dividendByUser = groupBy(
      allDividendEntries.map((d) => ({ ...d, ledgerId: d.ownership?.ledgerId })),
      "ledgerId"
    );
    const kycByUser = keyBy(
      allKycRecords.map((k) => ({ ...k, ledgerId: k.user?.ledgerId })),
      "ledgerId"
    );

    // Country diversity map
    const countryCounts: Record<string, number> = {};
    for (const u of participants) {
      countryCounts[u.country || "Unknown"] = (countryCounts[u.country || "Unknown"] || 0) + 1;
    }

    const meritScores: MeritScore[] = participants.map((user) =>
      buildMeritScore(
        user,
        ownershipsByUser[user.ledgerId] || [],
        reviewsByUser[user.ledgerId] || [],
        dividendByUser[user.ledgerId] || [],
        kycByUser[user.ledgerId],
        countryCounts,
        participants.length
      )
    );

    meritScores.sort((a, b) => b.totalMeritScore - a.totalMeritScore);
    meritScores.forEach((s, i) => (s.rank = i + 1));

    return NextResponse.json({
      success: true,
      poolId,
      poolName: pool.name,
      status: pool.status,
      participantCount: meritScores.length,
      meritScores,
      preview: true,
      message: "Preview mode — no winner selected. Use POST to execute Quantum Merit Consensus.",
    });
  } catch (error: unknown) {
    console.error("[MERIT PREVIEW]", error);
    const status = error instanceof AuthError ? error.status : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Preview failed" },
      { status }
    );
  }
}

/* ============================================================
   POST — Execute Quantum Merit Consensus
   ============================================================ */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      throw new AuthError("Architect authority required. Primary admin access only.", 403);
    }

    const sovereignId = user.ledgerId;
    const body = await request.json();
    const { poolId, dryRun = false } = body;

    if (!poolId) {
      return NextResponse.json({ success: false, error: "Pool ID required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lock pool row
      const pool = await tx.pool.findUnique({
        where: { poolId },
        include: {
          ownerships: {
            include: { user: true },
          },
        },
      });

      if (!pool) throw new Error("Pool not found");
      if (pool.status !== "consensus") throw new Error(`Pool status is '${pool.status}'. Must be 'consensus' to trigger merit selection.`);
      if (pool.winnerId) throw new Error("Quantum Merit Consensus already executed for this pool.");

      const participants = pool.ownerships.map((o) => o.user);
      const lids = participants.map((u) => u.ledgerId);

      // Bulk fetch
      const [allOwnerships, allReviews, allDividendEntries, allKycRecords, allWallets] = await Promise.all([
        tx.ownership.findMany({
          where: { ledgerId: { in: lids } },
          include: { pool: { select: { assetValue: true, createdAt: true } } },
        }),
        tx.poolReview.findMany({
          where: { ledgerId: { in: lids } },
          select: { ledgerId: true, rating: true, createdAt: true },
        }),
        tx.dividendEntry.findMany({
          where: { ownership: { ledgerId: { in: lids } } },
          select: { claimedAt: true, ownership: { select: { ledgerId: true } } },
        }),
        tx.kycRecord.findMany({
          where: { user: { ledgerId: { in: lids } } },
          select: { user: { select: { ledgerId: true } }, verificationTier: true, identityScore: true },
        }),
        tx.wallet.findMany({
          where: { ledgerId: { in: lids } },
          select: { id: true, ledgerId: true, balance: true },
        }),
      ]);

      const ownershipsByUser = groupBy(allOwnerships, "ledgerId");
      const reviewsByUser = groupBy(allReviews, "ledgerId");
      const dividendByUser = groupBy(
        allDividendEntries.map((d) => ({ ...d, ledgerId: d.ownership?.ledgerId })),
        "ledgerId"
      );
      const kycByUser = keyBy(
        allKycRecords.map((k) => ({ ...k, ledgerId: k.user?.ledgerId })),
        "ledgerId"
      );
      const walletByUser = keyBy(allWallets, "ledgerId");

      const countryCounts: Record<string, number> = {};
      for (const u of participants) {
        countryCounts[u.country || "Unknown"] = (countryCounts[u.country || "Unknown"] || 0) + 1;
      }

      // Calculate merit
      const meritScores: MeritScore[] = participants.map((user) =>
        buildMeritScore(
          user,
          ownershipsByUser[user.ledgerId] || [],
          reviewsByUser[user.ledgerId] || [],
          dividendByUser[user.ledgerId] || [],
          kycByUser[user.ledgerId],
          countryCounts,
          participants.length
        )
      );

      meritScores.sort((a, b) => b.totalMeritScore - a.totalMeritScore);
      meritScores.forEach((s, i) => (s.rank = i + 1));

      const winner = meritScores[0];
      if (!winner) throw new Error("No participants found in pool.");

      if (dryRun) {
        return { dryRun: true, pool, winner, meritScores, participantCount: participants.length };
      }

      // ── COMMIT WINNER ──
      const updatedPool = await tx.pool.update({
        where: { id: pool.id },
        data: {
          winnerId: winner.ledgerId,
          winnerCountry: winner.country,
          status: "distributed",
          distributedAt: new Date(),
          meritScoreAtWin: winner.totalMeritScore,
        },
      });

      // ── PERSIST MERIT SCORES ──
      for (const score of meritScores) {
        await tx.quantumMeritScore.upsert({
          where: { ledgerId: score.ledgerId },
          create: {
            ledgerId: score.ledgerId,
            tacBase: score.ownershipBase,
            poolHistoryScore: score.poolHistoryScore,
            communityScore: score.communityScore,
            reviewQualityScore: score.reviewQualityScore,
            identityScore: score.identityScore,
            arcStreakScore: score.arcStreakScore,
            countryDiversityScore: score.countryDiversityScore,
            totalMeritScore: score.totalMeritScore,
            lastPoolId: poolId,
            calculatedAt: new Date(),
          },
          update: {
            tacBase: score.ownershipBase,
            poolHistoryScore: score.poolHistoryScore,
            communityScore: score.communityScore,
            reviewQualityScore: score.reviewQualityScore,
            identityScore: score.identityScore,
            arcStreakScore: score.arcStreakScore,
            countryDiversityScore: score.countryDiversityScore,
            totalMeritScore: score.totalMeritScore,
            lastPoolId: poolId,
            calculatedAt: new Date(),
          },
        });
      }

      // ── 50% RETURN TO NON-WINNERS (8th Ledger ARC) ──
      const nonWinners = pool.ownerships.filter((o: unknown) => o.user.ledgerId !== winner.ledgerId);
      const returnRecords: unknown[] = [];

      for (const ownership of nonWinners) {
        const stake = ownership.amountCommitted;
        const lid = ownership.user.ledgerId;
        const returnAmount = Math.round(stake * 0.50);

        // Credit wallet
        const wallet = walletByUser[lid];
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: returnAmount } },
          });
        }

        // Update ownership status
        await tx.ownership.update({
          where: { id: ownership.id },
          data: {
            status: "returned",
            totalReturned: { increment: returnAmount },
          },
        });

        // Create treasury transaction
        await tx.treasuryTransaction.create({
          data: {
            type: "arc_return",
            amount: returnAmount,
            description: `ARC return: 50% of commitment from ${pool.name}`,
            ledgerId: lid,
            poolId: pool.poolId,
            status: "completed",
            txHash: `ARC-${pool.poolId}-${lid}-${Date.now()}`,
          },
        });

        returnRecords.push({ ledgerId: lid, amount: returnAmount });

        // Notify user
        await tx.notification.create({
          data: {
            ledgerId: lid,
            type: "arc_distribution",
            title: "ARC Distribution Received",
            message: `You received ${returnAmount} USD as a 50% liquid return from ${pool.name}.`,
            poolId: pool.id,
            read: false,
          },
        });
      }

      // ── WINNER OWNERSHIP ACTIVATION ──
      const winnerOwnership = pool.ownerships.find((o: unknown) => o.user.ledgerId === winner.ledgerId);
      if (winnerOwnership) {
        await tx.ownership.update({
          where: { id: winnerOwnership.id },
          data: {
            status: "active",
            isWinner: true,
          },
        });
      }

      // Notify winner
      await tx.notification.create({
        data: {
          ledgerId: winner.ledgerId,
          type: "pool_won",
          title: "You Won the Pool!",
          message: `Quantum Merit selected you as the winner of ${pool.name} with a merit score of ${winner.totalMeritScore}.`,
          poolId: pool.id,
          read: false,
        },
      });

      // ── AUDIT LOG ──
      await tx.auditLog.create({
        data: {
          eventType: "quantum_merit_consensus",
          description: `Consensus executed by ${sovereignId}. Winner: ${winner.displayName} (${winner.ledgerId}) from ${winner.country} with merit score ${winner.totalMeritScore}. ARC returned to ${nonWinners.length} participants.`,
          poolId: pool.id,
          ledgerId: winner.ledgerId,
          amount: pool.assetValue,
          txHash: `MERIT-${pool.poolId}-${Date.now()}`,
          visibleToPublic: true,
          metadata: JSON.stringify({
            winnerScore: winner.totalMeritScore,
            participantCount: participants.length,
            arcCount: nonWinners.length,
            top5: meritScores.slice(0, 5).map((s) => ({ id: s.ledgerId, score: s.totalMeritScore })),
          }),
        },
      });

      return {
        pool: updatedPool,
        winner,
        meritScores,
        arcDistributed: nonWinners.length,
        arcRecords: returnRecords,
      };
    }, { maxWait: 20000, timeout: 30000 });

    if (result.dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        poolId: result.pool.poolId,
        poolName: result.pool.name,
        winner: result.winner,
        meritScores: result.meritScores,
        message: "Dry run complete. No changes committed. Set dryRun:false to execute.",
      });
    }

    return NextResponse.json({
      success: true,
      poolId: result.pool.poolId,
      winner: {
        ledgerId: result.winner.ledgerId,
        displayName: result.winner.displayName,
        country: result.winner.country,
        meritScore: result.winner.totalMeritScore,
        rank: 1,
      },
      totalParticipants: result.meritScores.length,
      arcTriggeredFor: result.arcDistributed,
      meritScores: result.meritScores,
      message: `Quantum Merit Consensus complete. Winner: ${result.winner.displayName} (Score: ${result.winner.totalMeritScore}). 50% liquid return distributed to ${result.arcDistributed} sovereigns.`,
    });
  } catch (error: unknown) {
    console.error("[QUANTUM MERIT]", error);
    const status = error instanceof AuthError ? error.status : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Quantum Merit Consensus failed" },
      { status }
    );
  }
}

/* ============================================================
   UTILITIES
   ============================================================ */
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function keyBy<T>(arr: T[], key: keyof T): Record<string, T> {
  return arr.reduce((acc, item) => {
    acc[String(item[key])] = item;
    return acc;
  }, {} as Record<string, T>);
}