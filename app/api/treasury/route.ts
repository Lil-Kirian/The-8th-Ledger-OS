import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

const COMMUNITY_PCT = 0.80;
const LEDGER_TITHE_PCT = 0.20;

interface TreasuryResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

/* ============================================================
   GET /api/treasury — Global protocol financial state (80/20)
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    const response: unknown = { success: true };

    // ── Global state ──
    if (type === "all" || type === "state") {
      const [
        revenueAgg,
        ledgerFeeAgg,
        communityNetAgg,
        protocolInAgg,
        protocolOutAgg,
        hallTreasuryAgg,
        pendingWithdrawalsAgg,
        insuranceFundAgg,
        hallCount,
        activeHalls,
      ] = await prisma.$transaction([
        prisma.revenueLog.aggregate({ _sum: { amount: true } }),
        prisma.revenueLog.aggregate({ _sum: { ledgerFee: true } }),
        prisma.revenueLog.aggregate({ _sum: { communityNet: true } }),
        prisma.treasuryTransaction.aggregate({
          where: { type: { in: ["ledger_fee_in", "protocol_revenue"] }, status: "completed" },
          _sum: { amount: true },
        }),
        prisma.treasuryTransaction.aggregate({
          where: { type: "protocol_withdraw", status: "completed" },
          _sum: { amount: true },
        }),
        prisma.hallTreasury.aggregate({ _sum: { balance: true } }),
        prisma.withdrawalRequest.aggregate({
          where: { status: { in: ["pending", "processing"] } },
          _sum: { amount: true },
        }),
        prisma.insuranceFund.aggregate({
          where: { type: "global" },
          _sum: { balance: true },
        }),
        prisma.hall.count(),
        prisma.hall.count({ where: { status: { in: ["live", "mature"] } } }),
      ]);

      const protocolIn = Number(protocolInAgg._sum.amount || 0);
      const protocolOut = Number(protocolOutAgg._sum.amount || 0);

      response.state = {
        totalRevenueUSD: Number(revenueAgg._sum.amount || 0),
        totalLedgerFeeUSD: Number(ledgerFeeAgg._sum.ledgerFee || 0),
        totalCommunityNetUSD: Number(communityNetAgg._sum.communityNet || 0),
        protocolTreasuryUSD: protocolIn - protocolOut,
        communityTreasuryUSD: Number(hallTreasuryAgg._sum.balance || 0),
        pendingWithdrawalsUSD: Number(pendingWithdrawalsAgg._sum.amount || 0),
        insuranceFundUSD: Number(insuranceFundAgg._sum.balance || 0),
        totalHalls: hallCount,
        activeHalls,
        splitRatio: "80/20",
      };
    }

    // ── Per-hall treasury breakdown (admin) ──
    if ((type === "all" || type === "halls") && (isPrimaryAdmin(user.ledgerId) || user.role === "admin")) {
      const halls = await prisma.hall.findMany({
        where: { status: { in: ["live", "mature", "ghost"] } },
        include: {
          pool: { select: { name: true, verticalId: true, listedPrice: true } },
          hallTreasury: true,
          _count: { select: { ownerships: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      response.halls = halls.map((h) => ({
        id: h.id,
        name: h.name,
        vertical: h.pool?.verticalId,
        status: h.status,
        communityBalance: Number(h.hallTreasury?.balance || 0),
        totalDistributed: Number(h.hallTreasury?.totalDistributed || 0),
        totalRevenue: Number(h.hallTreasury?.totalRevenue || 0),
        ownerCount: h._count.ownerships,
        listedPrice: h.pool?.listedPrice,
      }));
    }

    // ── Revenue logs ──
    if (type === "all" || type === "revenue") {
      const logs = await prisma.revenueLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          pool: { select: { name: true, verticalId: true } },
        },
      });

      response.revenueLogs = logs.map((r) => ({
        id: r.id,
        poolId: r.poolId,
        poolName: r.pool?.name,
        vertical: r.pool?.verticalId,
        grossAmount: Number(r.amount),
        ledgerFee: Number(r.ledgerFee),
        communityNet: Number(r.communityNet),
        source: r.source,
        distributed: !!r.distributionTx,
        createdAt: r.createdAt,
      }));
    }

    // ── Admin-only: transactions, withdrawals ──
    if (isPrimaryAdmin(user.ledgerId) || user.role === "admin") {
      if (type === "all" || type === "transactions") {
        response.transactions = await prisma.treasuryTransaction.findMany({
          orderBy: { timestamp: "desc" },
          take: 100,
        });
      }
      if (type === "all" || type === "withdrawals") {
        response.withdrawals = await prisma.withdrawalRequest.findMany({
          orderBy: { requestedAt: "desc" },
          take: 50,
        });
      }
    } else if (["transactions", "withdrawals"].includes(type || "")) {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: "Sovereign authority required" },
        { status: 403 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[TREASURY GET]", error);
    return NextResponse.json<TreasuryResponse>(
      { success: false, error: "Treasury data unavailable" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/treasury
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    /* ===== RECORD REVENUE — 80/20 SPLIT (Admin) ===== */
    if (action === "record_revenue") {
      if (!isPrimaryAdmin(user.ledgerId) && user.role !== "admin") {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "8th Ledger Operations authority required" },
          { status: 403 }
        );
      }

      const { hallId, amount, source, description, periodStart, periodEnd } = body;

      if (!hallId || !amount || Number(amount) <= 0) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "hallId and positive amount required" },
          { status: 400 }
        );
      }

      if (!source || typeof source !== "string") {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "Revenue source required (rent, lease, usage, inventory, service, etc.)" },
          { status: 400 }
        );
      }

      const hall = await prisma.hall.findUnique({
        where: { id: hallId },
        include: {
          pool: { select: { id: true, poolId: true, name: true } },
          ownerships: {
            where: { status: "active" },
            select: { id: true, userId: true, ownershipPercent: true, ledgerId: true },
          },
        },
      });

      if (!hall) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "Hall not found" },
          { status: 404 }
        );
      }

      const gross = Number(amount);
      let communityNet = Math.floor(gross * COMMUNITY_PCT * 100) / 100;
      const ledgerFee = Math.floor(gross * LEDGER_TITHE_PCT * 100) / 100;

      // Fix rounding drift
      const drift = gross - (communityNet + ledgerFee);
      communityNet += drift;

      const result = await prisma.$transaction(async (tx) => {
        // 1. Revenue log (linked to pool)
        const revenueLog = await tx.revenueLog.create({
          data: {
            poolId: hall.poolId,
            amount: gross,
            source,
            ledgerFee,
            communityNet,
            distributed: false,
          },
        });

        // 2. Credit Hall Treasury (community 80%)
        await tx.hallTreasury.upsert({
          where: { hallId },
          create: {
            hallId,
            balance: Math.round(communityNet),
            totalRevenue: Math.round(communityNet),
            totalDistributed: 0,
          },
          update: {
            balance: { increment: Math.round(communityNet) },
            totalRevenue: { increment: Math.round(communityNet) },
            monthlyRevenue: Math.round(communityNet),
          },
        });

        // 3. Credit 8th Ledger Protocol (20% tithe)
        await tx.treasuryTransaction.create({
          data: {
            type: "ledger_fee_in",
            amount: ledgerFee,
            currency: "USD",
            poolId: hall.poolId,
            description: description || `8th Ledger 20% tithe — ${source}: ${hall.pool?.name || hallId}`,
            status: "completed",
            txHash: `LED-TITHE-${Date.now().toString(36).toUpperCase()}`,
            timestamp: new Date(),
            audited: true,
          },
        });

        // 4. Queue dividend entitlements per owner
        let dividendDistribution;
        if (hall.ownerships.length > 0) {
          dividendDistribution = await tx.dividendDistribution.create({
            data: {
              poolId: hall.poolId,
              revenueLogId: revenueLog.id,
              totalAmount: Math.round(communityNet),
              totalOwners: hall.ownerships.length,
            },
          });

          const dividendRecords = hall.ownerships.map((o) => ({
            distributionId: dividendDistribution.id,
            ownershipId: o.id,
            amount: Math.round((communityNet * (o.ownershipPercent || 0)) / 100),
            claimed: false,
          }));

          await tx.dividendEntry.createMany({
            data: dividendRecords,
            skipDuplicates: true,
          });
        }

        // 5. Hall activity
        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "revenue",
            description: `Revenue: $${gross.toFixed(2)} from ${source}`,
            metadata: JSON.stringify({
              revenueLogId: revenueLog.id,
              gross,
              communityNet,
              ledgerFee,
              ownerCount: hall.ownerships.length,
              periodStart,
              periodEnd,
            }),
          },
        });

        // 6. Notify owners
        if (hall.ownerships.length > 0) {
          const notifications = hall.ownerships
            .filter((o) => o.ledgerId)
            .map((o) => ({
              ledgerId: o.ledgerId!,
              poolId: hall.poolId,
              type: "dividend_available",
              title: "Dividend Available",
              message: `$${gross.toFixed(2)} revenue recorded. Your share is ready to claim.`,
              actionUrl: `/halls/${hallId}/dividends`,
            }));

          if (notifications.length > 0) {
            await tx.notification.createMany({
              data: notifications,
              skipDuplicates: true,
            });
          }
        }

        return { revenueLog, communityNet, ledgerFee, ownerCount: hall.ownerships.length, dividendDistribution };
      });

      return NextResponse.json<TreasuryResponse>({
        success: true,
        data: {
          revenueLogId: result.revenueLog.id,
          hallId,
          poolId: hall.poolId,
          grossAmount: gross,
          communityNet: result.communityNet,
          ledgerFee: result.ledgerFee,
          ownerCount: result.ownerCount,
          split: "80/20",
        },
        message: `Revenue recorded. $${result.communityNet.toFixed(2)} → Hall Treasury. $${result.ledgerFee.toFixed(2)} → 8th Ledger Protocol. ${result.ownerCount} dividend entitlements queued.`,
      });
    }

    /* ===== USER WITHDRAWAL REQUEST ===== */
    if (action === "withdraw") {
      const { amount, destination, destinationType, reason } = body;

      if (!amount || Number(amount) < 100) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "Minimum withdrawal is $100" },
          { status: 400 }
        );
      }

      if (!destination) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "Destination address or account required" },
          { status: 400 }
        );
      }

      // Sum unclaimed dividend entries for this user
      const unclaimedAgg = await prisma.dividendEntry.aggregate({
        where: {
          claimed: false,
          ownership: { userId: user.id },
        },
        _sum: { amount: true },
      });

      const claimable = Number(unclaimedAgg._sum.amount || 0);
      const requested = Number(amount);

      if (claimable < requested) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: `Insufficient claimable balance. Available: $${claimable.toFixed(2)}` },
          { status: 409 }
        );
      }

      const withdrawal = await prisma.withdrawalRequest.create({
        data: {
          ledgerId: user.ledgerId,
          displayName: user.displayName,
          amount: requested,
          destination,
          destinationType: destinationType || "bank",
          status: "pending",
          requestedAt: new Date(),
        },
      });

      return NextResponse.json<TreasuryResponse>({
        success: true,
        data: { withdrawal },
        message: `Withdrawal of $${requested} submitted. Processing within 24h. Remaining claimable: $${(claimable - requested).toFixed(2)}`,
      });
    }

    /* ===== PRIMARY ADMIN: TOKEN BURN (RETIRED) ===== */
    if (action === "burn_vin") {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: "Token burn system retired. VIN replaced by Ledger balance in 8th Ledger." },
        { status: 410 }
      );
    }

    /* ===== PRIMARY ADMIN: PROTOCOL WITHDRAWAL (8th Ledger's 20%) ===== */
    if (action === "protocol_withdraw") {
      if (!isPrimaryAdmin(user.ledgerId)) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "Sovereign authority required" },
          { status: 403 }
        );
      }

      const { amount, reason } = body;
      if (!amount || Number(amount) <= 0) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: "Valid amount required" },
          { status: 400 }
        );
      }

      const [protocolInAgg, protocolOutAgg] = await prisma.$transaction([
        prisma.treasuryTransaction.aggregate({
          where: { type: { in: ["ledger_fee_in", "protocol_revenue"] }, status: "completed" },
          _sum: { amount: true },
        }),
        prisma.treasuryTransaction.aggregate({
          where: { type: "protocol_withdraw", status: "completed" },
          _sum: { amount: true },
        }),
      ]);

      const available =
        Number(protocolInAgg._sum.amount || 0) - Number(protocolOutAgg._sum.amount || 0);
      const requested = Number(amount);

      if (requested > available) {
        return NextResponse.json<TreasuryResponse>(
          { success: false, error: `Protocol treasury insufficient. Available: $${available.toFixed(2)}` },
          { status: 409 }
        );
      }

      const tx = await prisma.treasuryTransaction.create({
        data: {
          type: "protocol_withdraw",
          amount: requested,
          currency: "USD",
          description: reason || "8th Ledger protocol operations withdrawal",
          status: "completed",
          txHash: `PROTO-WITHDRAW-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date(),
          audited: true,
        },
      });

      return NextResponse.json<TreasuryResponse>({
        success: true,
        data: { transaction: tx },
        message: `$${requested} withdrawn from 8th Ledger protocol treasury. Remaining: $${(available - requested).toFixed(2)}`,
      });
    }

    return NextResponse.json<TreasuryResponse>(
      {
        success: false,
        error: 'Invalid action. Use "record_revenue", "withdraw", or "protocol_withdraw"',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[TREASURY POST]", error);
    return NextResponse.json<TreasuryResponse>(
      { success: false, error: "Treasury operation failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH /api/treasury — Primary Admin processes withdrawal
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: "Sovereign authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { withdrawalId, status, rejectionReason } = body;

    if (!withdrawalId || !status) {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: "Withdrawal ID and status required" },
        { status: 400 }
      );
    }

    const existing = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!existing) {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "pending" && existing.status !== "processing") {
      return NextResponse.json<TreasuryResponse>(
        { success: false, error: `Cannot modify ${existing.status} withdrawal` },
        { status: 409 }
      );
    }

    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status,
        processedAt: new Date(),
        processedBy: user.ledgerId,
        rejectionReason: status === "rejected" ? rejectionReason : existing.rejectionReason,
      },
    });

    return NextResponse.json<TreasuryResponse>({
      success: true,
      data: { withdrawal: updated },
      message: `Withdrawal ${withdrawalId} marked as ${status}`,
    });
  } catch (error) {
    console.error("[TREASURY PATCH]", error);
    return NextResponse.json<TreasuryResponse>(
      { success: false, error: "Withdrawal processing failed" },
      { status: 500 }
    );
  }
}