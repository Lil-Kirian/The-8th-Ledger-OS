import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   GET /api/halls/[id] — 8th Ledger Sovereign Hall Gateway
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: hallId } = await params;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            verticalId: true,
            assetValue: true,
            committed: true,
            target: true,
            status: true,
            imageUrl: true,
            assetImages: true,
            emojiSet: true,
            externalLinks: true,
            selectedLocation: true,
            assetCondition: true,
            trueCost: true,
            listedPrice: true,
            surplus: true,
            insuranceAllocation: true,
            executionQueue: true,
            managementFee: true,
            hallClass: true,
            pirAllocation: true,
            assetBookValue: true,
          },
        },
        executiveCabinet: {
          select: {
            speakerId: true,
            treasurerId: true,
            wardenId: true,
            scribeId: true,
            electedAt: true,
            expiresAt: true,
            isImpeached: true,
          },
        },
        sriSnapshots: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
        ahgiSnapshots: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
        dynamicValuations: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
        pirAllocations: true,
        eighthLedgerUpdates: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 }
      );
    }

    const hasOwnership = await verifyOwnership(user.id, undefined, hallId);
    const isPrimaryAdminView = await isPrimaryAdmin(user.ledgerId);

    if (hall.status === "ghost" && !hasOwnership && !isPrimaryAdminView) {
      return NextResponse.json(
        {
          success: false,
          error: "Hall not yet visible",
          detail: "This Hall is in Ghost mode. Commit to the pool to enter.",
        },
        { status: 403 }
      );
    }

    if (hall.status !== "ghost" && !hasOwnership && !isPrimaryAdminView) {
      return NextResponse.json(
        {
          success: false,
          error: "Sovereign access denied",
          detail: "You do not own a PAC in this Hall. Commit to enter.",
        },
        { status: 403 }
      );
    }

    const [
      messages,
      proposals,
      treasury,
      members,
      executionLogs,
      dormancyLogs,
      myRole,
      myOwnership,
      workers,
      forgeLedgers,
      locationOptions,
    ] = await prisma.$transaction([
      prisma.hallMessage.findMany({
        where: { hallId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              avatar: true,
              kycTier: true,
            },
          },
        },
      }),

      prisma.proposal.findMany({
        where: { hallId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          proposer: {
            select: { ledgerId: true, displayName: true },
          },
          votes: {
            select: { userId: true, weight: true, choice: true },
          },
        },
      }),

      prisma.hallTreasury.findUnique({
        where: { hallId },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      }),

      prisma.ownership.findMany({
        where: { hallId, status: { not: "forfeited" } },
        include: {
          user: {
            select: {
              id: true,
              ledgerId: true,
              displayName: true,
              avatar: true,
              kycTier: true,
              isBanned: true,
              lastActivityAt: true,
            },
          },
        },
        orderBy: { ownershipPercent: "desc" },
      }),

      prisma.executionLog.findMany({
        where: { hallId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          proposal: {
            select: { title: true, type: true },
          },
        },
      }),

      prisma.dormancyLog.findMany({
        where: { hallId },
        orderBy: { notifiedAt: "desc" },
        take: 5,
      }),

      prisma.hallRole.findFirst({
        where: {
          hallId,
          userId: user.id,
          isImpeached: false,
        },
        select: { role: true, electedAt: true, expiresAt: true },
      }),

      prisma.ownership.findUnique({
        where: {
          poolId_userId: {
            poolId: hall.poolId,
            userId: user.id,
          },
        },
        select: {
          ownershipPercent: true,
          pacToken: true,
          totalReturned: true,
          totalFromMarket: true,
          status: true,
          role: true,
          dynamicValue: true,
          accumulatedDividends: true,
          pirDebt: true,
        },
      }),

      prisma.worker.findMany({
        where: { hallId },
        orderBy: { hiredAt: "desc" },
        include: {
          performances: {
            orderBy: { reviewedAt: "desc" },
            take: 1,
          },
        },
      }),

      prisma.forgeLedger.findMany({
        where: { hallId },
        orderBy: { month: "desc" },
        take: 6,
      }),

      prisma.locationOption.findMany({
        where: { poolId: hall.poolId },
      }),
    ]);

    let assetTracker: unknown = null;
    const pool = hall.pool;

    if (pool) {
      assetTracker = {
        poolId: pool.poolId,
        name: pool.name,
        verticalId: pool.verticalId,
        assetValue: pool.assetValue,
        committed: pool.committed,
        target: pool.target,
        fillPercent: pool.target > 0 ? Math.round((pool.committed / pool.target) * 100) : 0,
        status: pool.status,
        assetCondition: pool.assetCondition,
        selectedLocation: pool.selectedLocation,
        managementFee: pool.managementFee,
        executionQueue: pool.executionQueue,
        hallClass: pool.hallClass || "I",
        pirAllocation: pool.pirAllocation,
        assetBookValue: pool.assetBookValue,
        ...(isPrimaryAdminView
          ? {
              trueCost: pool.trueCost,
              listedPrice: pool.listedPrice,
              surplus: pool.surplus,
              insuranceAllocation: pool.insuranceAllocation,
            }
          : {}),
      };

      switch (pool.verticalId) {
        case "ledgerprop": {
          const propRevenue = await prisma.revenueLog.findMany({
            where: { poolId: pool.poolId, source: "rent" },
            orderBy: { createdAt: "desc" },
            take: 12,
            select: { amount: true, ledgerFee: true, netAfterPayroll: true, createdAt: true },
          });
          assetTracker.occupancyRate = propRevenue.length > 0 ? 85 : 0;
          assetTracker.monthlyRent = propRevenue[0]?.amount || 0;
          assetTracker.revenueHistory = propRevenue;
          break;
        }
        case "ledgerauto": {
          assetTracker.gpsLocation = locationOptions.find((l) => l.isSelected) || null;
          assetTracker.fleetStatus = "operational";
          break;
        }
        case "ledgertravel": {
          assetTracker.route = pool.selectedLocation;
          assetTracker.bookings = pool.committed;
          break;
        }
        case "ledgeragri": {
          const agriRevenue = await prisma.revenueLog.findMany({
            where: { poolId: pool.poolId, source: "sale" },
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { amount: true, source: true, createdAt: true },
          });
          assetTracker.productionYield = agriRevenue.reduce((s, r) => s + r.amount, 0);
          assetTracker.harvestHistory = agriRevenue;
          break;
        }
        case "ledgerenergy": {
          const energyRevenue = await prisma.revenueLog.findMany({
            where: { poolId: pool.poolId, source: "usage" },
            orderBy: { createdAt: "desc" },
            take: 12,
            select: { amount: true, ledgerFee: true, netAfterPayroll: true, createdAt: true },
          });
          assetTracker.generationKwh = energyRevenue.reduce((s, r) => s + r.amount, 0);
          assetTracker.monthlyGeneration = energyRevenue;
          break;
        }
        case "ledgerhealth":
        case "ledgertech": {
          assetTracker.equipmentStatus = "operational";
          assetTracker.utilizationRate = 78;
          break;
        }
        default:
          assetTracker.status = "tracking_active";
      }
    }

    const now = new Date();
    const dormancyStatus = {
      accountWarning: false,
      accountVault: false,
      accountAuction: false,
      assetWarning: false,
      assetCritical: false,
      assetReclamation: false,
    };

    const lastActivity = user.lastActivityAt ? new Date(user.lastActivityAt) : new Date(0);
    const daysInactive = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysInactive > 1095) dormancyStatus.accountAuction = true;
    else if (daysInactive > 730) dormancyStatus.accountVault = true;
    else if (daysInactive > 365) dormancyStatus.accountWarning = true;

    const latestDormancy = dormancyLogs[0];
    if (latestDormancy) {
      if (latestDormancy.stage === "warning_12mo") dormancyStatus.assetWarning = true;
      if (latestDormancy.stage === "vault_24mo") dormancyStatus.accountVault = true;
      if (latestDormancy.stage === "auction_36mo") dormancyStatus.accountAuction = true;
    }

    const response: unknown = {
      success: true,
      hall: {
        id: hall.id,
        name: hall.name,
        status: hall.status,
        poolId: hall.poolId,
        createdAt: hall.createdAt,
        hallClass: hall.hallClass || "I",
        sriScore: hall.sriScore || 50,
        ahgiScore: hall.ahgiScore || 50,
        closureStatus: hall.closureStatus || "active",
        pirDebt: hall.pirDebt || 0,
        payrollReserve: hall.payrollReserve || 0,
      },
      assetTracker,
      treasury: treasury
        ? {
            balance: treasury.balance,
            totalDistributed: treasury.totalDistributed,
            totalRevenue: treasury.totalRevenue,
            lastDistribution: treasury.lastDistribution,
            payrollReserve: treasury.payrollReserve,
            pirDebt: treasury.pirDebt,
            closureReserve: treasury.closureReserve,
            monthlyRevenue: treasury.monthlyRevenue,
            recentTransactions: treasury.transactions,
          }
        : null,
      executiveCabinet: hall.executiveCabinet
        ? {
            speakerId: hall.executiveCabinet.speakerId,
            treasurerId: hall.executiveCabinet.treasurerId,
            wardenId: hall.executiveCabinet.wardenId,
            scribeId: hall.executiveCabinet.scribeId,
            electedAt: hall.executiveCabinet.electedAt,
            expiresAt: hall.executiveCabinet.expiresAt,
            isImpeached: hall.executiveCabinet.isImpeached,
          }
        : null,
      sri: hall.sriSnapshots[0]
        ? {
            score: hall.sriSnapshots[0].score,
            governanceActivity: hall.sriSnapshots[0].governanceActivity,
            revenueConsistency: hall.sriSnapshots[0].revenueConsistency,
            dividendReliability: hall.sriSnapshots[0].dividendReliability,
            proposalQuality: hall.sriSnapshots[0].proposalQuality,
            dormancyRate: hall.sriSnapshots[0].dormancyRate,
            marketplaceVelocity: hall.sriSnapshots[0].marketplaceVelocity,
            recordedAt: hall.sriSnapshots[0].recordedAt,
          }
        : null,
      ahgi: hall.ahgiSnapshots[0]
        ? {
            score: hall.ahgiSnapshots[0].score,
            healthMetrics: hall.ahgiSnapshots[0].healthMetrics,
            growthMetrics: hall.ahgiSnapshots[0].growthMetrics,
            recordedAt: hall.ahgiSnapshots[0].recordedAt,
          }
        : null,
      dynamicValuation: hall.dynamicValuations[0]
        ? {
            assetBookValue: hall.dynamicValuations[0].assetBookValue,
            accumulatedDividendsPerPercent: hall.dynamicValuations[0].accumulatedDividendsPerPercent,
            ahgiPremium: hall.dynamicValuations[0].ahgiPremium,
            sriBonus: hall.dynamicValuations[0].sriBonus,
            pirDebtPerPercent: hall.dynamicValuations[0].pirDebtPerPercent,
            valuePerPercent: hall.dynamicValuations[0].valuePerPercent,
            calculatedAt: hall.dynamicValuations[0].calculatedAt,
          }
        : null,
      pirAllocations: hall.pirAllocations.map((p: unknown) => ({
        pillar: p.pillar,
        amount: p.amount,
        purpose: p.purpose,
        spent: p.spent,
      })),
      eighthLedgerUpdates: hall.eighthLedgerUpdates.map((u: unknown) => ({
        type: u.type,
        title: u.title,
        content: u.content,
        amount: u.amount,
        createdAt: u.createdAt,
      })),
      proposals: proposals.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        amount: p.amount,
        status: p.status,
        voteWeightYes: p.voteWeightYes,
        voteWeightNo: p.voteWeightNo,
        voteCountYes: p.voteCountYes,
        voteCountNo: p.voteCountNo,
        thresholdPercent: p.thresholdPercent,
        endsAt: p.endsAt,
        executedAt: p.executedAt,
        executionResult: p.executionResult,
        executionCost: p.executionCost,
        proposer: p.proposer,
        myVote: p.votes.find((v) => v.userId === user.id) || null,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        watermarkHash: m.watermarkHash,
        isEphemeral: m.isEphemeral,
        expiresAt: m.expiresAt,
        createdAt: m.createdAt,
        user: m.user,
      })),
      members: members.map((m) => ({
        ledgerId: m.user.ledgerId,
        displayName: m.user.displayName,
        avatar: m.user.avatar,
        kycTier: m.user.kycTier,
        ownershipPercent: m.ownershipPercent,
        pacToken: m.pacToken,
        totalReturned: m.totalReturned,
        role: m.role,
        isBanned: m.user.isBanned,
        lastActivityAt: m.user.lastActivityAt,
      })),
      executionLogs: executionLogs.map((e) => ({
        id: e.id,
        proposalId: e.proposalId,
        proposalTitle: e.proposal?.title,
        proposalType: e.proposal?.type,
        status: e.status,
        cost: e.cost,
        proofUrls: e.proofUrls && e.proofUrls.trim() ? JSON.parse(e.proofUrls) : [],
        executedBy: e.executedBy,
        completedAt: e.completedAt,
        createdAt: e.createdAt,
      })),
      dormancy: {
        status: dormancyStatus,
        logs: dormancyLogs,
        daysSinceActivity: Math.round(daysInactive),
      },
      workers: workers.map((w) => ({
        id: w.id,
        workerNumber: w.workerNumber,
        role: w.role,
        salary: w.salary,
        contractMonths: w.contractMonths,
        hiredAt: w.hiredAt,
        status: w.status,
        performanceScore: w.performanceScore,
        latestPerformance: w.performances[0] || null,
      })),
      forgeLedgers: forgeLedgers.map((f) => ({
        month: f.month,
        totalPayroll: f.totalPayroll,
        workerCount: f.workerCount,
        entries: f.entries,
      })),
      me: {
        ownership: myOwnership,
        role: myRole?.role || null,
        roleExpiresAt: myRole?.expiresAt || null,
      },
    };

    try {
      await prisma.auditLog.create({
        data: {
          eventType: "HALL_ACCESS",
          description: `${user.displayName} entered Hall ${hall.name}`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            hallId,
            hallStatus: hall.status,
            hasOwnership,
            role: myRole?.role,
          }),
          txHash: `HALL-${hallId}-${Date.now()}`,
          visibleToPublic: false,
        },
      });
    } catch (auditErr) {
      console.error("[HALL AUDIT SKIP]", auditErr);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[HALL GET]", error);
    return NextResponse.json(
      { success: false, error: "Hall data unavailable" },
      { status: 500 }
    );
  }
}