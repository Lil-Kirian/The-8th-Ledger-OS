import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";

const CRON_SECRET = process.env.CRON_SECRET;

const THRESHOLDS = {
  WARNING_MONTHS: 12,
  VAULT_MONTHS: 24,
  AUCTION_MONTHS: 36,
  AUCTION_DURATION_DAYS: 30,
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// GET /api/dormancy/check
// Automated 3-year dormancy sweep. Runs via cron (Bearer CRON_SECRET) or admin trigger.
// Year 1: Warning. Year 2: Vault. Year 3: Auction. Expired auctions: resolve.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

    if (!isCron) {
      const user = await getSessionUser(request);
      if (!user || !user.isPrimaryAdmin) {
        return NextResponse.json(
          { success: false, error: "Sovereign authority required" },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const results = {
      warnings: 0,
      vaults: 0,
      auctions: 0,
      completed: 0,
      errors: [] as string[],
    };

    await prisma.$transaction(async (tx) => {
      // ── YEAR 1 — WARNING (12 months inactive) ──
      const warningCutoff = addMonths(now, -THRESHOLDS.WARNING_MONTHS);

      const usersToWarn = await tx.user.findMany({
        where: {
          lastActivityAt: { lt: warningCutoff },
          role: { not: "admin" },
          isPrimaryAdmin: false,
          dormancyVaults: { none: { status: { in: ["vaulted", "auctioned"] } } },
        },
        select: {
          id: true,
          ledgerId: true,
          ownerships: {
            where: { status: "active" },
            select: { id: true, hallId: true, ownershipPercent: true },
          },
        },
      });

      for (const user of usersToWarn) {
        try {
          const alreadyWarned = await tx.dormancyLog.findFirst({
            where: { userId: user.id, type: "account", stage: "warning_12mo" },
          });
          if (alreadyWarned) continue;

          await tx.dormancyLog.create({
            data: {
              userId: user.id,
              type: "account",
              stage: "warning_12mo",
              message: `Subject ${user.ledgerId} inactive for 12+ months. Voting rights suspended. Log in to reactivate.`,
              notifiedAt: now,
            },
          });

          if (user.ownerships.length > 0) {
            await tx.ownership.updateMany({
              where: { userId: user.id, status: "active" },
              data: { status: "dormant" },
            });
          }

          await tx.notification.create({
            data: {
              ledgerId: user.ledgerId,
              type: "dormancy_warning",
              title: "8th Ledger Dormancy Warning",
              message:
                "Your account has been inactive for 12 months. Voting rights suspended. Log in within 12 months or your PACs will be transferred to the Dormancy Vault.",
              createdAt: now,
            },
          });

          results.warnings++;
        } catch (err: any) {
          results.errors.push(`Warn ${user.ledgerId}: ${err.message}`);
        }
      }

      // ── YEAR 2 — VAULT (24 months inactive) ──
      const vaultCutoff = addMonths(now, -THRESHOLDS.VAULT_MONTHS);

      const usersToVault = await tx.user.findMany({
        where: {
          lastActivityAt: { lt: vaultCutoff },
          role: { not: "admin" },
          isPrimaryAdmin: false,
          ownerships: { some: { status: "dormant" } },
          dormancyVaults: { none: { status: { in: ["vaulted", "auctioned"] } } },
        },
        select: {
          id: true,
          ledgerId: true,
          ownerships: {
            where: { status: "dormant" },
            select: {
              id: true,
              hallId: true,
              ownershipPercent: true,
              accumulatedDividends: true,
              poolId: true,
            },
          },
        },
      });

      for (const user of usersToVault) {
        try {
          const alreadyVaulted = await tx.dormancyLog.findFirst({
            where: { userId: user.id, type: "account", stage: "vault_24mo" },
          });
          if (alreadyVaulted) continue;

          for (const ownership of user.ownerships) {
            await tx.dormancyVault.create({
              data: {
                userId: user.id,
                ownershipId: ownership.id,
                vaultedAt: now,
                accumulatedDividends: ownership.accumulatedDividends,
                status: "vaulted",
              },
            });
          }

          await tx.dormancyLog.create({
            data: {
              userId: user.id,
              type: "account",
              stage: "vault_24mo",
              message: `Subject ${user.ledgerId} inactive for 24+ months. PACs transferred to Dormancy Vault.`,
              notifiedAt: now,
            },
          });

          await tx.notification.create({
            data: {
              ledgerId: user.ledgerId,
              type: "dormancy_vault",
              title: "PACs Transferred to Dormancy Vault",
              message:
                "24 months of inactivity. Your PACs are now held in the Dormancy Vault. You may reclaim them by logging in and verifying your identity. After 12 months in vault, they will be auctioned.",
              createdAt: now,
            },
          });

          results.vaults++;
        } catch (err: any) {
          results.errors.push(`Vault ${user.ledgerId}: ${err.message}`);
        }
      }

      // ── YEAR 3 — AUCTION (36 months inactive) ──
      const auctionCutoff = addMonths(now, -THRESHOLDS.AUCTION_MONTHS);

      const vaultsToAuction = await tx.dormancyVault.findMany({
        where: {
          status: "vaulted",
          vaultedAt: { lt: auctionCutoff },
          auctions: { none: { status: { in: ["active", "sold"] } } },
        },
        include: {
          ownership: {
            select: {
              ownershipPercent: true,
              hallId: true,
              poolId: true,
              dynamicValue: true,
              accumulatedDividends: true,
            },
          },
          user: { select: { ledgerId: true, id: true } },
        },
      });

      for (const vault of vaultsToAuction) {
        try {
          const alreadyAuctioned = await tx.dormancyLog.findFirst({
            where: { userId: vault.userId, type: "account", stage: "auction_36mo" },
          });
          if (alreadyAuctioned) continue;

          const baseValue = vault.ownership?.dynamicValue || 0;
          const startingPrice = Math.max(Math.ceil(baseValue * 1.2), 1);

          await tx.dormancyAuction.create({
            data: {
              vaultId: vault.id,
              listedAt: now,
              startingPrice,
              status: "active",
            },
          });

          await tx.dormancyVault.update({
            where: { id: vault.id },
            data: { status: "auctioned" },
          });

          await tx.dormancyLog.create({
            data: {
              userId: vault.userId,
              type: "account",
              stage: "auction_36mo",
              message: `Subject ${vault.user.ledgerId} inactive for 36+ months. PAC auctioned at 120% valuation ($${startingPrice}).`,
              notifiedAt: now,
            },
          });

          await tx.notification.create({
            data: {
              ledgerId: vault.user.ledgerId,
              type: "dormancy_auction",
              title: "PAC Listed for Auction",
              message: `36 months of inactivity. Your PAC is listed for auction at $${startingPrice}. If sold, 80% proceeds go to your wallet. Reclaim before sale by verifying identity.`,
              createdAt: now,
            },
          });

          results.auctions++;
        } catch (err: any) {
          results.errors.push(`Auction ${vault.id}: ${err.message}`);
        }
      }

      // ── EXPIRE AUCTIONS (30 days past listedAt) ──
      const auctionExpiryCutoff = new Date(
        now.getTime() - THRESHOLDS.AUCTION_DURATION_DAYS * 24 * 60 * 60 * 1000
      );

      const expiredAuctions = await tx.dormancyAuction.findMany({
        where: {
          status: "active",
          listedAt: { lt: auctionExpiryCutoff },
        },
        include: {
          vault: {
            include: {
              ownership: {
                select: {
                  id: true,
                  userId: true,
                  ownershipPercent: true,
                  dynamicValue: true,
                  hallId: true,
                },
              },
              user: { select: { ledgerId: true } },
            },
          },
        },
      });

      for (const auction of expiredAuctions) {
        try {
          const ownership = auction.vault.ownership;
          const absorbPrice = auction.finalPrice || auction.startingPrice;

          if (auction.buyerId) {
            // SOLD: Transfer ownership
            await tx.ownership.update({
              where: { id: ownership.id },
              data: {
                userId: auction.buyerId,
                status: "active",
                accumulatedDividends: 0,
                pirDebt: 0,
              },
            });

            // Credit seller 80%
            const sellerPayout = Math.floor(absorbPrice * 0.8);
            const dormancyFee = absorbPrice - sellerPayout;

            await tx.wallet.updateMany({
              where: { ledgerId: auction.vault.user.ledgerId },
              data: { balance: { increment: sellerPayout } },
            });

            // Record fee to hall treasury
            if (ownership.hallId) {
              const treasury = await tx.hallTreasury.findUnique({
                where: { hallId: ownership.hallId },
              });
              if (treasury) {
                await tx.hallTreasuryTransaction.create({
                  data: {
                    treasuryId: treasury.id,
                    type: "dormancy_fee",
                    amount: dormancyFee,
                    description: `Dormancy auction fee for ownership ${ownership.id}`,
                    createdAt: now,
                  },
                });
              }
            }

            await tx.dormancyAuction.update({
              where: { id: auction.id },
              data: { status: "sold", completedAt: now, finalPrice: absorbPrice },
            });
          } else {
            // UNSOLD: 8th Ledger absorbs
            await tx.ownership.update({
              where: { id: ownership.id },
              data: { status: "forfeited" },
            });

            await tx.dormancyAuction.update({
              where: { id: auction.id },
              data: { status: "unsold", completedAt: now },
            });

            await tx.auditLog.create({
              data: {
                eventType: "dormancy_absorb",
                description: `8th Ledger absorbed ownership ${ownership.id} after unsold auction. Subject ${auction.vault.user.ledgerId}.`,
                txHash: `ABSORB-${auction.id}-${Date.now()}`,
                visibleToPublic: true,
              },
            });
          }

          await tx.dormancyVault.update({
            where: { id: auction.vaultId },
            data: { status: "auctioned" },
          });

          results.completed++;
        } catch (err: any) {
          results.errors.push(`Complete ${auction.id}: ${err.message}`);
        }
      }
    });

    return NextResponse.json({
      success: true,
      results,
      message: `Dormancy sweep complete. ${results.warnings} warned, ${results.vaults} vaulted, ${results.auctions} auctioned, ${results.completed} auctions resolved.`,
    });
  } catch (error: any) {
    console.error("[DORMANCY CHECK] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Dormancy sweep failed" },
      { status: 500 }
    );
  }
}

// POST /api/dormancy/check
// Manual admin override: reactivate account or force auction.
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !user.isPrimaryAdmin) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ledgerId, ownershipId } = body;

    if (action === "reactivate_account" && ledgerId) {
      const target = await prisma.user.findUnique({
        where: { ledgerId },
        include: {
          dormancyVaults: { where: { status: { in: ["vaulted", "auctioned"] } } },
        },
      });

      if (!target) {
        return NextResponse.json(
          { success: false, error: "Subject not found" },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.dormancyLog.updateMany({
          where: { userId: target.id, type: "account" },
          data: { resolvedAt: new Date() },
        });

        await tx.ownership.updateMany({
          where: { userId: target.id },
          data: { status: "active" },
        });

        await tx.dormancyVault.updateMany({
          where: { userId: target.id, status: { in: ["vaulted", "auctioned"] } },
          data: { status: "reclaimed", reclaimedAt: new Date() },
        });

        await tx.dormancyAuction.updateMany({
          where: {
            vaultId: { in: target.dormancyVaults.map((v) => v.id) },
            status: "active",
          },
          data: { status: "cancelled" },
        });

        await tx.user.update({
          where: { id: target.id },
          data: { lastActivityAt: new Date() },
        });
      });

      await logSecurityAudit({
        action: "DORMANCY_REACTIVATED",
        actorId: user.ledgerId,
        targetId: target.id,
        metadata: { ledgerId, action: "reactivate_account" },
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });

      return NextResponse.json({
        success: true,
        message: `Subject ${ledgerId} reactivated. PACs restored.`,
      });
    }

    if (action === "force_auction" && ownershipId) {
      const ownership = await prisma.ownership.findUnique({
        where: { id: ownershipId },
        include: { user: true, hall: true },
      });

      if (!ownership) {
        return NextResponse.json(
          { success: false, error: "Ownership not found" },
          { status: 404 }
        );
      }

      const baseValue = ownership.dynamicValue || 0;
      const startingPrice = Math.max(Math.ceil(baseValue * 1.2), 1);

      await prisma.$transaction(async (tx) => {
        const vault = await tx.dormancyVault.upsert({
          where: { ownershipId: ownership.id },
          update: { status: "auctioned", vaultedAt: new Date() },
          create: {
            userId: ownership.userId,
            ownershipId: ownership.id,
            vaultedAt: new Date(),
            accumulatedDividends: ownership.accumulatedDividends,
            status: "auctioned",
          },
        });

        await tx.dormancyAuction.create({
          data: {
            vaultId: vault.id,
            listedAt: new Date(),
            startingPrice,
            status: "active",
          },
        });

        await tx.dormancyLog.create({
          data: {
            userId: ownership.userId,
            type: "account",
            stage: "auction_36mo",
            message: `Admin forced auction for ownership ${ownership.id}. Starting price $${startingPrice}.`,
            notifiedAt: new Date(),
          },
        });
      });

      await logSecurityAudit({
        action: "DORMANCY_FORCE_AUCTION",
        actorId: user.ledgerId,
        targetId: ownershipId,
        metadata: { startingPrice, hallId: ownership.hallId },
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });

      return NextResponse.json({
        success: true,
        message: `Auction forced for ownership ${ownershipId} at $${startingPrice}.`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Use 'reactivate_account' or 'force_auction'",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[DORMANCY CHECK] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Manual dormancy action failed" },
      { status: 500 }
    );
  }
}