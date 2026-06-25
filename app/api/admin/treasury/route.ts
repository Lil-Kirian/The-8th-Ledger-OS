import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   HELPERS
   ============================================================ */
function handleError(error: unknown, label: string): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      );
    }
  }
  console.error(`[${label}]`, error);
  return NextResponse.json(
    { success: false, error: "Treasury operation failed" },
    { status: 500 }
  );
}

function verifyRevenueSplit(
  amount: number,
  ledgerFee: number,
  payrollDeducted: number,
  netAfterPayroll: number
): {
  valid: boolean;
  expectedTithe: number;
  expectedNet: number;
  discrepancy: number;
} {
  const expectedTithe = Math.round(amount * 0.2 * 100) / 100;
  const expectedNet = Math.round((amount - expectedTithe - payrollDeducted) * 100) / 100;
  const total = Math.round((ledgerFee + payrollDeducted + netAfterPayroll) * 100) / 100;
  const discrepancy =
    Math.abs(total - amount) +
    Math.abs(ledgerFee - expectedTithe) +
    Math.abs(netAfterPayroll - expectedNet);
  return {
    valid: discrepancy < 0.02,
    expectedTithe,
    expectedNet,
    discrepancy: Math.round(discrepancy * 100) / 100,
  };
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ============================================================
   GET /api/admin/treasury — Primary Admin treasury drill-down
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hallId = searchParams.get("hallId");
    const view = searchParams.get("view") || "overview";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    /* ── OVERVIEW: All hall treasuries ── */
    if (view === "overview" || !hallId) {
      const where: Prisma.HallTreasuryWhereInput = {};
      if (hallId) where.hallId = hallId;

      const [treasuries, total] = await Promise.all([
        prisma.hallTreasury.findMany({
          where,
          orderBy: { totalRevenue: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            hall: {
              select: {
                id: true,
                name: true,
                status: true,
                sriScore: true,
                ahgiScore: true,
                closureStatus: true,
                pool: {
                  select: {
                    poolId: true,
                    name: true,
                    verticalId: true,
                    country: true,
                  },
                },
              },
            },
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        }),
        prisma.hallTreasury.count({ where }),
      ]);

      // Get pending revenue per hall
      const hallIds = treasuries.map((t) => t.hallId);
      const pendingRevenues = await prisma.revenueLog.groupBy({
        by: ["poolId"],
        where: {
          poolId: { in: hallIds },
          distributed: false,
        },
        _sum: {
          amount: true,
          ledgerFee: true,
          communityNet: true,
          payrollDeducted: true,
          netAfterPayroll: true,
        },
      });
      const pendingMap = new Map(
        pendingRevenues.map((p) => [
          p.poolId,
          {
            amount: Number(p._sum.amount || 0),
            ledgerFee: Number(p._sum.ledgerFee || 0),
            communityNet: Number(p._sum.communityNet || 0),
            payrollDeducted: Number(p._sum.payrollDeducted || 0),
            netAfterPayroll: Number(p._sum.netAfterPayroll || 0),
          },
        ])
      );

      const enriched = treasuries.map((t) => {
        const pending = pendingMap.get(t.hallId);
        return {
          hallId: t.hallId,
          hallName: t.hall?.name,
          hallStatus: t.hall?.status,
          hallClass: t.hall?.pool?.verticalId,
          sriScore: t.hall?.sriScore,
          ahgiScore: t.hall?.ahgiScore,
          closureStatus: t.hall?.closureStatus,
          pool: t.hall?.pool,
          balance: Number(t.balance.toFixed(2)),
          totalDistributed: Number(t.totalDistributed.toFixed(2)),
          totalRevenue: Number(t.totalRevenue.toFixed(2)),
          payrollReserve: t.payrollReserve,
          pirDebt: t.pirDebt,
          closureReserve: t.closureReserve,
          pendingRevenue: pending
            ? {
                gross: pending.amount,
                tithe: pending.ledgerFee,
                payroll: pending.payrollDeducted,
                netAfterPayroll: pending.netAfterPayroll,
                communityNet: pending.communityNet,
              }
            : null,
          transactionCount: t._count.transactions,
        };
      });

      // Totals across all halls
      const totals = await prisma.hallTreasury.aggregate({
        _sum: {
          balance: true,
          totalDistributed: true,
          totalRevenue: true,
          payrollReserve: true,
          pirDebt: true,
          closureReserve: true,
        },
      });

      return NextResponse.json({
        success: true,
        treasuries: enriched,
        totals: {
          balance: Number(totals._sum.balance || 0),
          totalDistributed: Number(totals._sum.totalDistributed || 0),
          totalRevenue: Number(totals._sum.totalRevenue || 0),
          payrollReserve: Number(totals._sum.payrollReserve || 0),
          pirDebt: Number(totals._sum.pirDebt || 0),
          closureReserve: Number(totals._sum.closureReserve || 0),
        },
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    /* ── DETAIL: Single hall deep dive ── */
    const targetHallId = hallId;

    const treasury = await prisma.hallTreasury.findUnique({
      where: { hallId: targetHallId },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            status: true,
            sriScore: true,
            ahgiScore: true,
            closureStatus: true,
            pool: {
              select: {
                poolId: true,
                name: true,
                verticalId: true,
                listedPrice: true,
                committed: true,
                assetBookValue: true,
              },
            },
          },
        },
      },
    });

    if (!treasury) {
      return NextResponse.json(
        { success: false, error: "Treasury not found" },
        { status: 404 }
      );
    }

    // Revenue logs with tithe/payroll verification
    const [revenueLogs, totalRevenue] = await Promise.all([
      prisma.revenueLog.findMany({
        where: { poolId: targetHallId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.revenueLog.count({ where: { poolId: targetHallId } }),
    ]);

    const verifiedRevenue = revenueLogs.map((r) => {
      const check = verifyRevenueSplit(
        Number(r.amount),
        Number(r.ledgerFee),
        Number(r.payrollDeducted),
        Number(r.netAfterPayroll)
      );
      return {
        id: r.id,
        amount: Number(r.amount),
        source: r.source,
        ledgerFee: Number(r.ledgerFee),
        communityNet: Number(r.communityNet),
        payrollDeducted: Number(r.payrollDeducted),
        netAfterPayroll: Number(r.netAfterPayroll),
        distributed: r.distributed,
        distributionTx: r.distributionTx,
        createdAt: r.createdAt,
        verified: check.valid,
        discrepancy: check.discrepancy,
        expectedTithe: check.expectedTithe,
        expectedNet: check.expectedNet,
      };
    });

    // Monthly aggregates
    const allRevenue = await prisma.revenueLog.findMany({
      where: { poolId: targetHallId },
      select: {
        amount: true,
        ledgerFee: true,
        communityNet: true,
        payrollDeducted: true,
        netAfterPayroll: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const monthlyMap = new Map<
      string,
      {
        month: string;
        gross: number;
        tithe: number;
        payroll: number;
        netAfterPayroll: number;
        communityNet: number;
        entries: number;
      }
    >();
    for (const r of allRevenue) {
      const key = getMonthKey(r.createdAt);
      const existing = monthlyMap.get(key) || {
        month: key,
        gross: 0,
        tithe: 0,
        payroll: 0,
        netAfterPayroll: 0,
        communityNet: 0,
        entries: 0,
      };
      existing.gross += Number(r.amount);
      existing.tithe += Number(r.ledgerFee);
      existing.payroll += Number(r.payrollDeducted);
      existing.netAfterPayroll += Number(r.netAfterPayroll);
      existing.communityNet += Number(r.communityNet);
      existing.entries += 1;
      monthlyMap.set(key, existing);
    }
    const monthly = Array.from(monthlyMap.values()).reverse();

    // Ownership breakdown
    const ownerships = await prisma.ownership.findMany({
      where: { hallId: targetHallId, status: "active" },
      select: {
        ownershipPercent: true,
        accumulatedDividends: true,
        dynamicValue: true,
        user: {
          select: {
            ledgerId: true,
            displayName: true,
          },
        },
      },
      orderBy: { ownershipPercent: "desc" },
    });

    // Latest dividend distribution
    const latestDistribution = await prisma.dividendDistribution.findFirst({
      where: { poolId: targetHallId },
      orderBy: { distributedAt: "desc" },
      include: {
        entries: {
          take: 10,
          include: {
            ownership: {
              select: {
                user: {
                  select: {
                    ledgerId: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Unclaimed dividends (entries not yet claimed)
    const unclaimed = await prisma.dividendEntry.aggregate({
      where: {
        distribution: { poolId: targetHallId },
        claimed: false,
      },
      _sum: { amount: true },
      _count: true,
    });

    // Treasury transactions
    const [transactions, txTotal] = await Promise.all([
      prisma.hallTreasuryTransaction.findMany({
        where: { treasuryId: treasury.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hallTreasuryTransaction.count({
        where: { treasuryId: treasury.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      hall: treasury.hall,
      treasury: {
        balance: Number(treasury.balance.toFixed(2)),
        totalDistributed: Number(treasury.totalDistributed.toFixed(2)),
        totalRevenue: Number(treasury.totalRevenue.toFixed(2)),
        payrollReserve: treasury.payrollReserve,
        pirDebt: treasury.pirDebt,
        closureReserve: treasury.closureReserve,
        monthlyRevenue: treasury.monthlyRevenue,
        lastDistribution: treasury.lastDistribution,
      },
      splitVerification: {
        totalEntries: totalRevenue,
        valid: verifiedRevenue.filter((r) => r.verified).length,
        invalid: verifiedRevenue.filter((r) => !r.verified).length,
      },
      revenue: {
        items: verifiedRevenue,
        meta: { page, limit, total: totalRevenue, pages: Math.ceil(totalRevenue / limit) },
      },
      monthly,
      ownerships: ownerships.map((o) => ({
        ledgerId: o.user?.ledgerId,
        displayName: o.user?.displayName,
        ownershipPercent: o.ownershipPercent,
        accumulatedDividends: o.accumulatedDividends,
        dynamicValue: o.dynamicValue,
      })),
      latestDistribution: latestDistribution
        ? {
            id: latestDistribution.id,
            totalAmount: latestDistribution.totalAmount,
            totalOwners: latestDistribution.totalOwners,
            distributedAt: latestDistribution.distributedAt,
            entries: latestDistribution.entries.map((e) => ({
              id: e.id,
              amount: e.amount,
              claimed: e.claimed,
              claimedAt: e.claimedAt,
              user: e.ownership?.user,
            })),
          }
        : null,
      claims: {
        unclaimedAmount: Number(unclaimed._sum.amount || 0),
        unclaimedCount: unclaimed._count,
      },
      transactions: {
        items: transactions,
        meta: { page, limit, total: txTotal, pages: Math.ceil(txTotal / limit) },
      },
    });
  } catch (error) {
    return handleError(error, "ADMIN_TREASURY_GET");
  }
}

/* ============================================================
   POST /api/admin/treasury — Primary Admin treasury actions
   distribute | adjust
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    /* ===== DISTRIBUTE — Process pending revenue ===== */
    if (action === "distribute") {
      const { hallId, revenueLogIds } = body;
      const targetHallId = hallId;

      if (!targetHallId) {
        return NextResponse.json(
          { success: false, error: "hallId required" },
          { status: 400 }
        );
      }

      const treasury = await prisma.hallTreasury.findUnique({
        where: { hallId: targetHallId },
        include: {
          hall: {
            include: {
              ownerships: {
                where: { status: "active" },
                select: {
                  id: true,
                  userId: true,
                  ownershipPercent: true,
                  user: {
                    select: {
                      ledgerId: true,
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!treasury) {
        return NextResponse.json(
          { success: false, error: "Treasury not found" },
          { status: 404 }
        );
      }

      const where: Prisma.RevenueLogWhereInput = {
        poolId: targetHallId,
        distributed: false,
      };
      if (revenueLogIds && Array.isArray(revenueLogIds) && revenueLogIds.length > 0) {
        where.id = { in: revenueLogIds.map((id: unknown) => String(id)) };
      }

      const pendingRevenue = await prisma.revenueLog.findMany({ where });

      if (pendingRevenue.length === 0) {
        return NextResponse.json(
          { success: false, error: "No pending revenue to distribute" },
          { status: 409 }
        );
      }

      const totalGross = pendingRevenue.reduce((s, r) => s + Number(r.amount), 0);
      const totalTithe = pendingRevenue.reduce((s, r) => s + Number(r.ledgerFee), 0);
      const totalPayroll = pendingRevenue.reduce((s, r) => s + Number(r.payrollDeducted), 0);
      const totalNet = pendingRevenue.reduce((s, r) => s + Number(r.netAfterPayroll), 0);

      // Verify tithe/payroll split on each entry
      for (const r of pendingRevenue) {
        const check = verifyRevenueSplit(
          Number(r.amount),
          Number(r.ledgerFee),
          Number(r.payrollDeducted),
          Number(r.netAfterPayroll)
        );
        if (!check.valid) {
          return NextResponse.json(
            {
              success: false,
              error: `Revenue split violation on revenue #${r.id}. Discrepancy: $${check.discrepancy}`,
              detail: {
                revenueId: r.id,
                expectedTithe: check.expectedTithe,
                expectedNet: check.expectedNet,
                actualTithe: r.ledgerFee,
                actualPayroll: r.payrollDeducted,
                actualNet: r.netAfterPayroll,
              },
            },
            { status: 409 }
          );
        }
      }

      const ownerships = treasury.hall?.ownerships || [];
      const totalOwnership = ownerships.reduce(
        (s, o) => s + Number(o.ownershipPercent),
        0
      );

      const result = await prisma.$transaction(async (tx) => {
        // Create distribution batch
        const distribution = await tx.dividendDistribution.create({
          data: {
            poolId: targetHallId,
            totalAmount: Math.round(totalNet * 100) / 100,
            totalOwners: ownerships.length,
          },
        });

        const dividendEntries: Array<{
          ownershipId: string;
          userId: string;
          amount: number;
        }> = [];

        for (const rev of pendingRevenue) {
          const netPool = Number(rev.netAfterPayroll);

          for (const o of ownerships) {
            const share =
              totalOwnership > 0
                ? (Number(o.ownershipPercent) / totalOwnership) * netPool
                : 0;

            if (share > 0) {
              const entry = await tx.dividendEntry.create({
                data: {
                  distributionId: distribution.id,
                  ownershipId: o.id,
                  amount: Math.round(share * 100) / 100,
                  claimed: false,
                },
              });
              dividendEntries.push({
                ownershipId: o.id,
                userId: o.userId,
                amount: entry.amount,
              });

              // Update accumulated dividends on ownership
              await tx.ownership.update({
                where: { id: o.id },
                data: {
                  accumulatedDividends: { increment: entry.amount },
                },
              });
            }
          }

          // Mark revenue as distributed
          await tx.revenueLog.update({
            where: { id: rev.id },
            data: {
              distributed: true,
              distributionTx: `DIST-${distribution.id}-${Date.now()}`,
            },
          });
        }

        // Update treasury
        const updatedTreasury = await tx.hallTreasury.update({
          where: { hallId: targetHallId },
          data: {
            balance: { increment: totalNet },
            totalDistributed: { increment: totalNet },
            totalRevenue: { increment: totalGross },
            monthlyRevenue: { increment: totalGross },
            lastDistribution: new Date(),
          },
        });

        // Audit
        await tx.auditEntry.create({
          data: {
            type: "treasury_distribution",
            description: `Distributed $${totalNet.toFixed(2)} net revenue across ${pendingRevenue.length} entries. Tithe: $${totalTithe.toFixed(2)}. Payroll: $${totalPayroll.toFixed(2)}. ${dividendEntries.length} dividend entries created.`,
            amount: totalGross,
            txHash: `TREASURY-DIST-${targetHallId}-${Date.now()}`,
            ledgerId: user.ledgerId,
          },
        });

        return {
          treasury: updatedTreasury,
          distributionId: distribution.id,
          dividendEntries,
          totalGross,
          totalTithe,
          totalPayroll,
          totalNet,
        };
      });

      return NextResponse.json({
        success: true,
        distribution: {
          hallId: targetHallId,
          revenueEntries: pendingRevenue.length,
          distributionId: result.distributionId,
          totalGross: result.totalGross,
          totalTithe: result.totalTithe,
          totalPayroll: result.totalPayroll,
          totalNet: result.totalNet,
          dividendEntriesCreated: result.dividendEntries.length,
          newBalance: Number(result.treasury.balance),
          newTotalDistributed: Number(result.treasury.totalDistributed),
        },
        message: `Distributed $${result.totalNet.toFixed(2)} to ${result.dividendEntries.length} owners. Tithe: $${result.totalTithe.toFixed(2)}. Payroll: $${result.totalPayroll.toFixed(2)}.`,
      });
    }

    /* ===== ADJUST — Emergency balance correction ===== */
    if (action === "adjust") {
      const { hallId: adjHallId, newBalance, reason } = body;
      const targetHallId = adjHallId;

      if (!targetHallId || newBalance === undefined || !reason) {
        return NextResponse.json(
          { success: false, error: "hallId, newBalance, and reason required" },
          { status: 400 }
        );
      }

      const targetTreasury = await prisma.hallTreasury.findUnique({
        where: { hallId: targetHallId },
        include: { hall: { select: { name: true, poolId: true } } },
      });

      if (!targetTreasury) {
        return NextResponse.json(
          { success: false, error: "Treasury not found" },
          { status: 404 }
        );
      }

      const oldBalance = Number(targetTreasury.balance);
      const adjustedBalance = Number(newBalance);

      await prisma.$transaction(async (tx) => {
        await tx.hallTreasury.update({
          where: { hallId: targetHallId },
          data: { balance: adjustedBalance },
        });

        await tx.hallTreasuryTransaction.create({
          data: {
            treasuryId: targetTreasury.id,
            type: "adjustment",
            amount: Math.round((adjustedBalance - oldBalance) * 100) / 100,
            description: `EMERGENCY ADJUSTMENT: ${reason}`,
          },
        });

        await tx.auditEntry.create({
          data: {
            type: "treasury_adjusted",
            description: `EMERGENCY: Treasury balance adjusted from $${oldBalance.toFixed(2)} to $${adjustedBalance.toFixed(2)}. Reason: ${reason}`,
            amount: adjustedBalance - oldBalance,
            txHash: `TREASURY-ADJ-${targetHallId}-${Date.now()}`,
            ledgerId: user.ledgerId,
          },
        });
      });

      return NextResponse.json({
        success: true,
        adjustment: {
          hallId: targetHallId,
          oldBalance,
          newBalance: adjustedBalance,
          delta: adjustedBalance - oldBalance,
          reason,
        },
        message: `Treasury adjusted: $${oldBalance.toFixed(2)} → $${adjustedBalance.toFixed(2)}.`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "distribute" or "adjust"' },
      { status: 400 }
    );
  } catch (error) {
    return handleError(error, "ADMIN_TREASURY_POST");
  }
}