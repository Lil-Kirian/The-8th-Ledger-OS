import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { calculateRevenueSplit, distributeByOwnership } from "@/lib/dividends";

/* ============================================================
   POST /api/dividends/distribute
   Trigger monthly revenue distribution for a hall or all halls.
   Revenue Flow: Gross → Tithe 20% → Payroll → IHCP Repayment → Net → Split by ownership %
   Admin or cron only.
   ============================================================ */

export async function POST(request: NextRequest) {
  try {
    // Auth check — admin only
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Admin authority required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { hallId, allHalls = false } = body;

    if (!hallId && !allHalls) {
      return NextResponse.json(
        { error: "Provide hallId or set allHalls: true" },
        { status: 400 }
      );
    }

    const results: Array<{
      hallId: string;
      hallName: string;
      revenueLogsProcessed: number;
      totalDistributed: number;
      ihcpRepaid: number;
      ownerCount: number;
      errors?: string[];
    }> = [];

    // Get halls to process
    const halls = allHalls
      ? await prisma.hall.findMany({
          where: { status: { not: "dissolved" } },
          include: {
            pool: { select: { poolId: true, name: true } },
            hallTreasury: true,
          },
        })
      : await prisma.hall.findMany({
          where: { id: hallId },
          include: {
            pool: { select: { poolId: true, name: true } },
            hallTreasury: true,
          },
        });

    for (const hall of halls) {
      const hallErrors: string[] = [];

      // Find undistributed revenue logs for this hall
      const revenueLogs = await prisma.revenueLog.findMany({
        where: {
          poolId: hall.poolId,
          distributed: false,
        },
        orderBy: { createdAt: "asc" },
      });

      if (revenueLogs.length === 0) {
        results.push({
          hallId: hall.id,
          hallName: hall.name || hall.pool?.name || "Unknown",
          revenueLogsProcessed: 0,
          totalDistributed: 0,
          ihcpRepaid: 0,
          ownerCount: 0,
        });
        continue;
      }

      // Get active ownerships
      const ownerships = await prisma.ownership.findMany({
        where: {
          hallId: hall.id,
          status: "active",
        },
        select: {
          id: true,
          userId: true,
          ledgerId: true,
          ownershipPercent: true,
          accumulatedDividends: true,
          pirDebt: true,
        },
      });

      if (ownerships.length === 0) {
        hallErrors.push("No active ownerships");
        results.push({
          hallId: hall.id,
          hallName: hall.name || hall.pool?.name || "Unknown",
          revenueLogsProcessed: 0,
          totalDistributed: 0,
          ihcpRepaid: 0,
          ownerCount: 0,
          errors: hallErrors,
        });
        continue;
      }

      let hallTotalDistributed = 0;
      let hallIhcpRepaid = 0;
      let logsProcessed = 0;

      await prisma.$transaction(async (tx) => {
        for (const log of revenueLogs) {
          const gross = log.amount;
          const payroll = log.payrollDeducted || 0;
          const netAfterPayroll = log.netAfterPayroll || gross - Math.floor(gross * 0.20) - payroll;

          if (netAfterPayroll <= 0) {
            // Mark as distributed even if nothing to split
            await tx.revenueLog.update({
              where: { id: log.id },
              data: { distributed: true },
            });
            logsProcessed++;
            continue;
          }

          // ============================================================
          // PHASE 4: IHCP REPAYMENT (before dividends)
          // ============================================================
          let netForDividends = netAfterPayroll;
          let logIhcpRepaid = 0;

          const activeIhcpContributions = await tx.hallContribution.findMany({
            where: {
              hallId: hall.id,
              status: "active",
            },
          });

          if (activeIhcpContributions.length > 0) {
            const totalOutstanding = activeIhcpContributions.reduce(
              (sum, c) => {
                const totalOwed = Math.floor(c.amount * 1.05); // principal + 5% priority return
                return sum + Math.max(0, totalOwed - c.repaidAmount);
              },
              0
            );

            if (totalOutstanding > 0) {
              // Take up to 20% of netAfterPayroll for IHCP repayment
              const maxRepayment = Math.floor(netAfterPayroll * 0.20);
              const ihcpRepaymentTotal = Math.min(maxRepayment, totalOutstanding);

              if (ihcpRepaymentTotal > 0) {
                for (const contrib of activeIhcpContributions) {
                  const totalOwed = Math.floor(contrib.amount * 1.05);
                  const outstanding = Math.max(0, totalOwed - contrib.repaidAmount);
                  if (outstanding <= 0) continue;

                  const share = Math.floor((outstanding / totalOutstanding) * ihcpRepaymentTotal);
                  if (share <= 0) continue;

                  // Update contribution repaid amount
                  await tx.hallContribution.update({
                    where: { id: contrib.id },
                    data: { repaidAmount: { increment: share } },
                  });

                  // Credit contributor wallet
                  await tx.wallet.update({
                    where: { ledgerId: contrib.ledgerId },
                    data: { balance: { increment: share } },
                  });

                  // Check if fully repaid
                  const updatedContrib = await tx.hallContribution.findUnique({
                    where: { id: contrib.id },
                  });
                  if (
                    updatedContrib &&
                    updatedContrib.repaidAmount >= Math.floor(updatedContrib.amount * 1.05)
                  ) {
                    await tx.hallContribution.update({
                      where: { id: contrib.id },
                      data: { status: "repaid" },
                    });
                  }
                }

                // Update hall IHCP balance
                await tx.hall.update({
                  where: { id: hall.id },
                  data: { ihcpBalance: { decrement: ihcpRepaymentTotal } },
                });

                // IHCP treasury transaction
                await tx.hallTreasuryTransaction.create({
                  data: {
                    treasuryId: hall.hallTreasury?.id || "",
                    type: "ihcp_repayment",
                    amount: -ihcpRepaymentTotal,
                    description: `IHCP repayment distributed to ${activeIhcpContributions.length} contributors`,
                  },
                });

                netForDividends -= ihcpRepaymentTotal;
                logIhcpRepaid += ihcpRepaymentTotal;
                hallIhcpRepaid += ihcpRepaymentTotal;
              }
            }
          }

          // ============================================================
          // SPLIT REMAINING NET BY OWNERSHIP %
          // ============================================================
          if (netForDividends <= 0) {
            await tx.revenueLog.update({
              where: { id: log.id },
              data: { distributed: true },
            });
            logsProcessed++;
            continue;
          }

          const ownerEntries = distributeByOwnership(
            netForDividends,
            ownerships.map((o) => ({
              ownershipId: o.id,
              userId: o.userId,
              ownershipPercent: Number(o.ownershipPercent),
            }))
          );

          // Create dividend distribution
          const distribution = await tx.dividendDistribution.create({
            data: {
              poolId: hall.poolId || "",
              revenueLogId: log.id,
              totalAmount: netForDividends,
              totalOwners: ownerEntries.length,
            },
          });

          // Create entries, update ownerships, credit wallets
          for (const entry of ownerEntries) {
            if (entry.amount <= 0) continue;

            // Create dividend entry
            await tx.dividendEntry.create({
              data: {
                distributionId: distribution.id,
                ownershipId: entry.ownershipId,
                amount: entry.amount,
                claimed: true, // Auto-claimed in distribution trigger
                claimedAt: new Date(),
              },
            });

            // Update ownership accumulatedDividends + totalReturned
            await tx.ownership.update({
              where: { id: entry.ownershipId },
              data: {
                accumulatedDividends: { increment: entry.amount },
                totalReturned: { increment: entry.amount },
              },
            });

            // Credit wallet if ledgerId exists
            const owner = ownerships.find((o) => o.id === entry.ownershipId);
            if (owner?.ledgerId) {
              await tx.wallet.update({
                where: { ledgerId: owner.ledgerId },
                data: { balance: { increment: entry.amount } },
              });
            }

            // Deduct PIR advance repayment if any
            const activeAdvance = await tx.pirAdvance.findFirst({
              where: {
                hallId: hall.id,
                status: "active",
              },
              orderBy: { approvedAt: "asc" },
            });

            if (activeAdvance && owner) {
              const repayment = Math.floor(entry.amount * activeAdvance.repaymentRate);
              if (repayment > 0) {
                const newRepaid = activeAdvance.repaidAmount + repayment;
                const remaining = Math.max(0, activeAdvance.amount - newRepaid);
                const newStatus = remaining <= 0 ? "repaid" : activeAdvance.status;

                await tx.pirAdvance.update({
                  where: { id: activeAdvance.id },
                  data: {
                    repaidAmount: newRepaid,
                    status: newStatus,
                  },
                });

                await tx.hall.update({
                  where: { id: hall.id },
                  data: { pirDebt: { decrement: repayment } },
                });

                await tx.ownership.update({
                  where: { id: entry.ownershipId },
                  data: { pirDebt: { decrement: repayment } },
                });

                // Debit wallet for PIR repayment
                if (owner.ledgerId) {
                  await tx.wallet.update({
                    where: { ledgerId: owner.ledgerId },
                    data: { balance: { decrement: repayment } },
                  });
                }
              }
            }

            hallTotalDistributed += entry.amount;
          }

          // Mark revenue log distributed
          await tx.revenueLog.update({
            where: { id: log.id },
            data: { distributed: true },
          });

          logsProcessed++;
        }

        // Update hall treasury
        if (hall.hallTreasury) {
          await tx.hallTreasury.update({
            where: { hallId: hall.id },
            data: {
              totalDistributed: { increment: hallTotalDistributed },
              balance: { decrement: hallTotalDistributed },
            },
          });
        }
      });

      // Audit
      await prisma.auditEntry.create({
        data: {
          type: "dividends_distributed",
          description: `Distributed $${hallTotalDistributed} across ${ownerships.length} owners in Hall ${hall.id}. ${logsProcessed} revenue logs processed. IHCP repaid: $${hallIhcpRepaid}.`,
          amount: hallTotalDistributed,
          txHash: `DIVIDEND-${hall.id}-${Date.now()}`,
          poolId: hall.poolId || undefined,
        },
      });

      results.push({
        hallId: hall.id,
        hallName: hall.name || hall.pool?.name || "Unknown",
        revenueLogsProcessed: logsProcessed,
        totalDistributed: hallTotalDistributed,
        ihcpRepaid: hallIhcpRepaid,
        ownerCount: ownerships.length,
        errors: hallErrors.length > 0 ? hallErrors : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("[DIVIDEND DISTRIBUTE]", error);
    return NextResponse.json(
      { error: "Failed to distribute dividends", detail: String(error) },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET /api/dividends/distribute
   Get distribution queue — undistributed revenue logs.
   ============================================================ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hallId = searchParams.get("hallId");

    const where = hallId ? { pool: { hall: { id: hallId } } } : {};

    const logs = await prisma.revenueLog.findMany({
      where: {
        distributed: false,
        ...where,
      },
      orderBy: { createdAt: "asc" },
      include: {
        pool: {
          include: {
            hall: { select: { id: true, name: true } },
          },
        },
        _count: { select: { dividendDistributions: true } },
      },
      take: 100,
    });

    return NextResponse.json({
      queue: logs.map((l) => ({
        revenueLogId: l.id,
        hallId: l.pool?.hall?.id,
        hallName: l.pool?.hall?.name,
        amount: l.amount,
        ledgerTithe: l.ledgerFee,
        payrollDeducted: l.payrollDeducted,
        netAfterPayroll: l.netAfterPayroll,
        source: l.source,
        createdAt: l.createdAt,
        pendingDistributions: l._count.dividendDistributions,
      })),
    });
  } catch (error) {
    console.error("[DIVIDEND QUEUE]", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}