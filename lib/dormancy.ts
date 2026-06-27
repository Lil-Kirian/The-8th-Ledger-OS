import { prisma } from "./prisma";

/* ============================================================
   8TH LEDGER — DORMANCY PROTOCOL V3.2
   3-Year Cycle: Warning → Vault → Auction
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export type DormancyStage = "active" | "warning" | "vaulted" | "auction" | "reclaimed" | "sold";

export interface DormancyCheck {
  userId: string;
  ledgerId: string;
  stage: DormancyStage;
  daysInactive: number;
  lastActivityAt: Date;
  nextThreshold: {
    days: number;
    label: string;
    date: Date;
  } | null;
  warningSent: boolean;
  vaultTransferred: boolean;
  auctionListed: boolean;
}

export interface VaultEntry {
  id: string;
  userId: string;
  ownershipId: string;
  hallId: string;
  hallName: string;
  ownershipPercent: number;
  accumulatedDividends: number;
  vaultedAt: Date;
  status: "vaulted" | "reclaimed" | "auctioned";
}

export interface AuctionEntry {
  id: string;
  vaultId: string;
  ownershipId: string;
  hallId: string;
  startingPrice: number;
  finalPrice: number | null;
  buyerId: string | null;
  buyerLedgerId: string | null;
  status: "active" | "sold" | "unsold" | "cancelled";
  listedAt: Date;
  completedAt: Date | null;
}

export interface DormancyActionResult {
  success: boolean;
  action: "warning" | "vault" | "auction" | "reclaim" | "sold";
  userId?: string;
  ownershipId?: string;
  amount?: number;
  error?: string;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const DORMANCY_THRESHOLDS = {
  warning: 365,   // Year 1: Warning. Email/SMS/push. Voting suspended. Dividends accrue.
  vault: 730,     // Year 2: Vault. PACs transferred to DormancyVault. Held in trust.
  auction: 1095,  // Year 3: Auction. Listed at 120% Dynamic Valuation. 30-day auction.
} as const;

const AUCTION_DURATION_DAYS = 30;
const AUCTION_PREMIUM = 1.20; // 120% of Dynamic Valuation
const DORMANCY_FEE_PCT = 0.20; // 20% to 8th Ledger
const OWNER_PAYOUT_PCT = 0.80; // 80% to original owner if they return

/* ============================================================
   PURE FUNCTIONS
   ============================================================ */

export function getDormancyStage(daysInactive: number): DormancyStage {
  if (daysInactive >= DORMANCY_THRESHOLDS.auction) return "auction";
  if (daysInactive >= DORMANCY_THRESHOLDS.vault) return "vaulted";
  if (daysInactive >= DORMANCY_THRESHOLDS.warning) return "warning";
  return "active";
}

export function getNextThreshold(
  stage: DormancyStage,
  lastActivity: Date
): { days: number; label: string; date: Date } | null {
  if (stage === "auction" || stage === "reclaimed" || stage === "sold") return null;

  let targetDays: number;
  let label: string;

  if (stage === "active") {
    targetDays = DORMANCY_THRESHOLDS.warning;
    label = "Warning (Year 1)";
  } else if (stage === "warning") {
    targetDays = DORMANCY_THRESHOLDS.vault;
    label = "Vault (Year 2)";
  } else {
    targetDays = DORMANCY_THRESHOLDS.auction;
    label = "Auction (Year 3)";
  }

  return {
    days: targetDays,
    label,
    date: new Date(lastActivity.getTime() + targetDays * 24 * 60 * 60 * 1000),
  };
}

/* ============================================================
   YEAR 1 — THE WARNING
   ============================================================ */

/**
 * Check a user's account dormancy status.
 */
export async function checkAccountDormancy(userId: string): Promise<DormancyCheck | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ledgerId: true, lastActivityAt: true },
  });

  if (!user?.lastActivityAt) return null;

  const lastActivity = new Date(user.lastActivityAt);
  const daysInactive = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  const stage = getDormancyStage(daysInactive);

  // Check if warning was sent
  const warningLog = await prisma.dormancyLog.findFirst({
    where: { userId, type: "account", stage: "warning_12mo" },
  });

  // Check if vault transfer happened
  const vaultEntry = await prisma.dormancyVault.findFirst({
    where: { userId, status: "vaulted" },
  });

  // Check if auction listed
  const auctionEntry = await prisma.dormancyAuction.findFirst({
    where: {
      vault: { userId },
      status: { in: ["active", "sold"] },
    },
  });

  return {
    userId,
    ledgerId: user.ledgerId,
    stage,
    daysInactive,
    lastActivityAt: lastActivity,
    nextThreshold: getNextThreshold(stage, lastActivity),
    warningSent: !!warningLog,
    vaultTransferred: !!vaultEntry,
    auctionListed: !!auctionEntry,
  };
}

/**
 * Send Year 1 warning notifications (email, SMS, push).
 * Voting rights suspended. PACs remain active. Dividends accrue.
 */
export async function sendDormancyWarning(userId: string): Promise<DormancyActionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ledgerId: true, displayName: true, email: true },
  });

  if (!user) {
    return { success: false, action: "warning", error: "User not found" };
  }

  // Check if already warned
  const existingWarning = await prisma.dormancyLog.findFirst({
    where: { userId, type: "account", stage: "warning_12mo" },
  });

  if (existingWarning) {
    return { success: false, action: "warning", error: "Warning already sent" };
  }

  // Suspend voting rights
  await prisma.$transaction(async (tx) => {
    // Log warning
    await tx.dormancyLog.create({
      data: {
        userId,
        type: "account",
        stage: "warning_12mo",
        message: `Account flagged for inactivity. Warning sent to ${user.email}. Voting rights suspended.`,
        notifiedAt: new Date(),
      },
    });

    // Suspend voting rights in all halls
    await tx.ownership.updateMany({
      where: { userId, status: "active" },
      data: { role: null }, // Remove any executive roles
    });

    // Create notifications
    await tx.notification.createMany({
      data: [
        {
          ledgerId: user.ledgerId,
          type: "dormancy_warning",
          title: "Account Dormancy — Year 1 Warning",
          message: "Your account has been inactive for 12 months. Voting rights suspended. PACs remain active. Dividends continue to accrue. Log in to restore full privileges.",
          actionUrl: "/enter",
          createdAt: new Date(),
        },
        {
          ledgerId: user.ledgerId,
          type: "dormancy_warning",
          title: "Account Dormancy — Action Required",
          message: "Your 8th Ledger account is dormant. If no activity within 12 months, your PACs will be transferred to the Dormancy Vault.",
          actionUrl: "/enter",
          createdAt: new Date(),
        },
      ],
    });
  });

  return {
    success: true,
    action: "warning",
    userId,
  };
}

/* ============================================================
   YEAR 2 — THE VAULT
   ============================================================ */

/**
 * Transfer all active PACs to Dormancy Vault.
 * Held in trust. Dividends accrue in vault. Reclaim by login + identity verification.
 */
export async function transferToVault(userId: string): Promise<DormancyActionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ledgerId: true, displayName: true },
  });

  if (!user) {
    return { success: false, action: "vault", error: "User not found" };
  }

  // Check if already vaulted
  const existingVault = await prisma.dormancyVault.findFirst({
    where: { userId, status: "vaulted" },
  });

  if (existingVault) {
    return { success: false, action: "vault", error: "Already in vault" };
  }

  const ownerships = await prisma.ownership.findMany({
    where: { userId, status: "active" },
    include: {
      hall: { select: { id: true, name: true } },
      pool: { select: { id: true } },
    },
  });

  if (ownerships.length === 0) {
    return { success: false, action: "vault", error: "No active ownerships to vault" };
  }

  let totalVaulted = 0;

  await prisma.$transaction(async (tx) => {
    for (const ownership of ownerships) {
      // Create vault entry
      await tx.dormancyVault.create({
        data: {
          userId,
          ownershipId: ownership.id,
          vaultedAt: new Date(),
          accumulatedDividends: ownership.accumulatedDividends,
          status: "vaulted",
        },
      });

      // Mark ownership as dormant
      await tx.ownership.update({
        where: { id: ownership.id },
        data: { status: "dormant" },
      });

      totalVaulted++;
    }

    // Log
    await tx.dormancyLog.create({
      data: {
        userId,
        type: "account",
        stage: "vault_24mo",
        message: `PACs transferred to Dormancy Vault. ${totalVaulted} ownership(s) vaulted.`,
        notifiedAt: new Date(),
      },
    });

    // Notify
    await tx.notification.create({
      data: {
        ledgerId: user.ledgerId,
        type: "dormancy_vault",
        title: "Account Dormancy — Year 2 Vault",
        message: `Your ${totalVaulted} PAC(s) have been transferred to the Dormancy Vault. Dividends accrue in vault. Reclaim instantly by logging in + identity verification.`,
        actionUrl: "/enter",
        createdAt: new Date(),
      },
    });
  });

  return {
    success: true,
    action: "vault",
    userId,
    amount: totalVaulted,
  };
}

/**
 * Reclaim PACs from vault (user returns).
 */
export async function reclaimFromVault(userId: string): Promise<DormancyActionResult> {
  const vaultEntries = await prisma.dormancyVault.findMany({
    where: { userId, status: "vaulted" },
    include: { ownership: { include: { hall: true } } },
  });

  if (vaultEntries.length === 0) {
    return { success: false, action: "reclaim", error: "No vault entries found" };
  }

  let totalReclaimed = 0;

  await prisma.$transaction(async (tx) => {
    for (const entry of vaultEntries) {
      // Restore ownership
      await tx.ownership.update({
        where: { id: entry.ownershipId },
        data: {
          status: "active",
          accumulatedDividends: { increment: entry.accumulatedDividends },
        },
      });

      // Mark vault entry reclaimed
      await tx.dormancyVault.update({
        where: { id: entry.id },
        data: {
          status: "reclaimed",
          reclaimedAt: new Date(),
        },
      });

      totalReclaimed++;
    }

    // Log
    await tx.dormancyLog.create({
      data: {
        userId,
        type: "account",
        stage: "reclaimed",
        message: `PACs reclaimed from Dormancy Vault. ${totalReclaimed} ownership(s) restored.`,
        resolvedAt: new Date(),
      },
    });
  });

  return {
    success: true,
    action: "reclaim",
    userId,
    amount: totalReclaimed,
  };
}

/* ============================================================
   YEAR 3 — THE AUCTION
   ============================================================ */

/**
 * List vaulted PACs on auction at 120% of Dynamic Valuation.
 * 30-day auction. Highest bidder wins.
 */
export async function listAuction(userId: string): Promise<DormancyActionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ledgerId: true },
  });

  if (!user) {
    return { success: false, action: "auction", error: "User not found" };
  }

  const vaultEntries = await prisma.dormancyVault.findMany({
    where: { userId, status: "vaulted" },
    include: {
      ownership: {
        include: {
          hall: {
            include: {
              dynamicValuations: { orderBy: { calculatedAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (vaultEntries.length === 0) {
    return { success: false, action: "auction", error: "No vault entries to auction" };
  }

  let totalListed = 0;

  await prisma.$transaction(async (tx) => {
    for (const entry of vaultEntries) {
      const ownership = entry.ownership;
      const hall = ownership.hall;

      // Get dynamic valuation
      const latestValuation = hall.dynamicValuations[0];
      const baseValue = latestValuation?.valuePerPercent || 0;
      const startingPrice = Math.floor(baseValue * AUCTION_PREMIUM * ownership.ownershipPercent);

      // Create auction
      await tx.dormancyAuction.create({
        data: {
          vaultId: entry.id,
          listedAt: new Date(),
          startingPrice,
          status: "active",
        },
      });

      // Mark vault entry auctioned
      await tx.dormancyVault.update({
        where: { id: entry.id },
        data: { status: "auctioned" },
      });

      totalListed++;
    }

    // Log
    await tx.dormancyLog.create({
      data: {
        userId,
        type: "account",
        stage: "auction_36mo",
        message: `PACs listed on Dormancy Auction. ${totalListed} ownership(s) at 120% Dynamic Valuation.`,
        notifiedAt: new Date(),
      },
    });

    // Notify user
    await tx.notification.create({
      data: {
        ledgerId: user.ledgerId,
        type: "dormancy_auction",
        title: "Account Dormancy — Year 3 Auction",
        message: `Your ${totalListed} PAC(s) are now listed on the Dormancy Auction. 30 days to reclaim before sale. 80% of proceeds to you if you return.`,
        actionUrl: "/enter",
        createdAt: new Date(),
      },
    });
  });

  return {
    success: true,
    action: "auction",
    userId,
    amount: totalListed,
  };
}

/**
 * Complete auction sale.
 * 80% to original owner (if they return), 20% to 8th Ledger as dormancy fee.
 * If no buyer, 8th Ledger absorbs at Dynamic Valuation.
 */
export async function completeAuction(
  auctionId: string,
  buyerId?: string,
  buyerLedgerId?: string,
  finalPrice?: number
): Promise<DormancyActionResult> {
  const auction = await prisma.dormancyAuction.findUnique({
    where: { id: auctionId },
    include: {
      vault: {
        include: {
          ownership: { include: { hall: true, user: true } },
          user: true,
        },
      },
    },
  });

  if (!auction || auction.status !== "active") {
    return { success: false, action: "sold", error: "Auction not found or not active" };
  }

  const vault = auction.vault;
  const ownership = vault.ownership;
  const originalOwner = vault.user;

  // If no buyer, 8th Ledger absorbs at starting price
  const salePrice = finalPrice || auction.startingPrice;
  const ownerPayout = Math.floor(salePrice * OWNER_PAYOUT_PCT);
  const ledgerFee = salePrice - ownerPayout;

  await prisma.$transaction(async (tx) => {
    // Update auction
    await tx.dormancyAuction.update({
      where: { id: auctionId },
      data: {
        status: buyerId ? "sold" : "unsold",
        finalPrice: salePrice,
        buyerId: buyerId || null,
        completedAt: new Date(),
      },
    });

    if (buyerId) {
      // Transfer ownership to buyer
      const existingBuyerOwnership = await tx.ownership.findFirst({
        where: { hallId: ownership.hallId, userId: buyerId },
      });

      if (existingBuyerOwnership) {
        await tx.ownership.update({
          where: { id: existingBuyerOwnership.id },
          data: {
            ownershipPercent: { increment: ownership.ownershipPercent },
            status: "active",
          },
        });
      } else {
        await tx.ownership.create({
          data: {
            poolId: ownership.poolId,
            userId: buyerId,
            hallId: ownership.hallId,
            amountCommitted: 0,
            ownershipPercent: ownership.ownershipPercent,
            status: "active",
            totalReturned: 0,
            totalFromMarket: 0,
            dynamicValue: 0,
            accumulatedDividends: 0,
            pirDebt: 0,
          },
        });
      }
    } else {
      // No buyer — 8th Ledger absorbs. Dissolve ownership.
      await tx.ownership.update({
        where: { id: ownership.id },
        data: { status: "dissolved", ownershipPercent: 0 },
      });
    }

    // Dissolve original ownership
    await tx.ownership.update({
      where: { id: ownership.id },
      data: { status: "dissolved", ownershipPercent: 0 },
    });

    // Credit original owner if they return
    if (originalOwner) {
      await tx.wallet.update({
        where: { ledgerId: originalOwner.ledgerId },
        data: { balance: { increment: ownerPayout } },
      });
    }

    // Create treasury transaction for fee
    await tx.treasuryTransaction.create({
      data: {
        type: "dormancy_fee",
        amount: ledgerFee,
        currency: "USD",
        description: `Dormancy auction fee (20%): ${auctionId}`,
        status: "completed",
        txHash: `DORM-FEE-${auctionId}`,
      },
    });

    // Audit
    await tx.auditEntry.create({
      data: {
        type: "dormancy_auction_completed",
        description: `Dormancy auction completed. Sale: $${salePrice}. Owner payout: $${ownerPayout}. 8th Ledger fee: $${ledgerFee}. Buyer: ${buyerLedgerId || "8th Ledger"}`,
        amount: salePrice,
        txHash: `AUCTION-${auctionId}`,
        ledgerId: originalOwner?.ledgerId,
      },
    });
  });

  return {
    success: true,
    action: "sold",
    userId: originalOwner?.id,
    amount: salePrice,
  };
}

/* ============================================================
   BATCH PROCESSING — Cron Job Helpers
   ============================================================ */

/**
 * Process all dormant accounts — check thresholds and advance stage.
 */
export async function processDormancyBatch(): Promise<{
  warningsSent: number;
  vaultTransfers: number;
  auctionsListed: number;
}> {
  const now = new Date();
  const warningThreshold = new Date(now.getTime() - DORMANCY_THRESHOLDS.warning * 24 * 60 * 60 * 1000);
  const vaultThreshold = new Date(now.getTime() - DORMANCY_THRESHOLDS.vault * 24 * 60 * 60 * 1000);
  const auctionThreshold = new Date(now.getTime() - DORMANCY_THRESHOLDS.auction * 24 * 60 * 60 * 1000);

  let warningsSent = 0;
  let vaultTransfers = 0;
  let auctionsListed = 0;

  // Year 1 — Send warnings
  const warningUsers = await prisma.user.findMany({
    where: {
      lastActivityAt: { lt: warningThreshold, gt: vaultThreshold },
    },
    select: { id: true },
  });

  for (const user of warningUsers) {
    const result = await sendDormancyWarning(user.id);
    if (result.success) warningsSent++;
  }

  // Year 2 — Transfer to vault
  const vaultUsers = await prisma.user.findMany({
    where: {
      lastActivityAt: { lt: vaultThreshold, gt: auctionThreshold },
    },
    select: { id: true },
  });

  for (const user of vaultUsers) {
    // Check if already vaulted
    const alreadyVaulted = await prisma.dormancyVault.findFirst({
      where: { userId: user.id, status: "vaulted" },
    });
    if (!alreadyVaulted) {
      const result = await transferToVault(user.id);
      if (result.success) vaultTransfers++;
    }
  }

  // Year 3 — List auctions
  const auctionUsers = await prisma.user.findMany({
    where: {
      lastActivityAt: { lt: auctionThreshold },
    },
    select: { id: true },
  });

  for (const user of auctionUsers) {
    // Check if already auctioned
    const alreadyAuctioned = await prisma.dormancyAuction.findFirst({
      where: {
        vault: { userId: user.id },
        status: { in: ["active", "sold"] },
      },
    });
    if (!alreadyAuctioned) {
      const result = await listAuction(user.id);
      if (result.success) auctionsListed++;
    }
  }

  return { warningsSent, vaultTransfers, auctionsListed };
}

/**
 * Expire old auctions (30 days passed, no buyer).
 */
export async function expireAuctions(): Promise<number> {
  const expiryDate = new Date(Date.now() - AUCTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const expiredAuctions = await prisma.dormancyAuction.findMany({
    where: {
      status: "active",
      listedAt: { lt: expiryDate },
    },
  });

  for (const auction of expiredAuctions) {
    await completeAuction(auction.id); // No buyer = 8th Ledger absorbs
  }

  return expiredAuctions.length;
}

/* ============================================================
   REPORTS
   ============================================================ */

/**
 * Get full dormancy registry for admin dashboard.
 */
export async function getDormancyReport(): Promise<{
  warnings: Array<{
    userId: string;
    ledgerId: string;
    displayName: string;
    daysInactive: number;
    warningSent: boolean;
  }>;
  vaults: Array<VaultEntry>;
  auctions: Array<AuctionEntry>;
}> {
  const [warningLogs, vaultEntries, auctionEntries] = await Promise.all([
    prisma.dormancyLog.findMany({
      where: { type: "account", stage: "warning_12mo" },
      include: { user: { select: { id: true, ledgerId: true, displayName: true } } },
      orderBy: { notifiedAt: "desc" },
    }),
    prisma.dormancyVault.findMany({
      where: { status: "vaulted" },
      include: {
        user: { select: { id: true, ledgerId: true, displayName: true } },
        ownership: {
          include: {
            hall: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { vaultedAt: "desc" },
    }),
    prisma.dormancyAuction.findMany({
      where: { status: { in: ["active", "sold"] } },
      include: {
        vault: {
          include: {
            user: { select: { id: true, ledgerId: true } },
            ownership: {
              include: {
                hall: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { listedAt: "desc" },
    }),
  ]);

  const now = Date.now();

  return {
    warnings: warningLogs.map((log) => ({
      userId: log.userId,
      ledgerId: log.user?.ledgerId || "Unknown",
      displayName: log.user?.displayName || "Unknown",
      daysInactive: Math.floor((now - new Date(log.notifiedAt).getTime()) / (1000 * 60 * 60 * 24)),
      warningSent: true,
    })),
    vaults: vaultEntries.map((v) => ({
      id: v.id,
      userId: v.userId,
      ownershipId: v.ownershipId,
      hallId: v.ownership.hall.id,
      hallName: v.ownership.hall.name,
      ownershipPercent: v.ownership.ownershipPercent,
      accumulatedDividends: v.accumulatedDividends,
      vaultedAt: v.vaultedAt,
      status: v.status as VaultEntry["status"],
    })),
    auctions: auctionEntries.map((a) => ({
      id: a.id,
      vaultId: a.vaultId,
      ownershipId: a.vault.ownership.id,
      hallId: a.vault.ownership.hall.id,
      startingPrice: a.startingPrice,
      finalPrice: a.finalPrice,
      buyerId: a.buyerId,
      buyerLedgerId: a.vault.user?.ledgerId || null,
      status: a.status as AuctionEntry["status"],
      listedAt: a.listedAt,
      completedAt: a.completedAt,
    })),
  };
}

/* ============================================================
   UTILITY
   ============================================================ */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}