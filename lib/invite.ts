import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

/* ============================================================
   8TH LEDGER — INVITE ENGINE
   Sovereign Invite Codes for Pool Access
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export interface InviteCode {
  id: string;
  code: string;
  poolId: string;
  inviterLedgerId: string;
  inviterName: string;
  maxUses: number;
  usedCount: number;
  remainingUses: number;
  expiresAt: Date | null;
  isExpired: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface InviteValidation {
  valid: boolean;
  code?: string;
  inviterLedgerId?: string;
  inviterName?: string;
  poolId?: string;
  poolName?: string;
  error?: string;
}

export interface InviteUsageResult {
  success: boolean;
  inviteeLedgerId?: string;
  inviterLedgerId?: string;
  referralBonus?: number;
  error?: string;
}

export interface InviteStats {
  totalGenerated: number;
  totalUsed: number;
  totalRemaining: number;
  activeCodes: number;
  expiredCodes: number;
  totalReferralEarnings: number;
  referralCount: number;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const DEFAULT_MAX_USES = 3;
const CODE_LENGTH = 10;
const CODE_EXPIRY_DAYS = 30;
const REFERRAL_BONUS_PCT = 0.01; // 1%

/* ============================================================
   PURE FUNCTIONS
   ============================================================ */

/**
 * Generate a cryptographically secure invite code.
 */
export function generateCode(): string {
  return crypto
    .randomBytes(6)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, CODE_LENGTH);
}

/**
 * Check if a code is expired.
 */
export function isCodeExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

/* ============================================================
   CODE GENERATION
   ============================================================ */

/**
 * Generate invite codes for an owner.
 * Rules: 3 invites per owner before pool fills. Links die at 100% fill.
 */
export async function generateInviteCode(input: {
  inviterLedgerId: string;
  poolId: string;
  maxUses?: number;
  expiresInDays?: number;
}): Promise<{ success: boolean; code?: InviteCode; error?: string }> {
  const { inviterLedgerId, poolId, maxUses = DEFAULT_MAX_USES, expiresInDays = CODE_EXPIRY_DAYS } = input;

  // Verify pool exists and is filling
  const pool = await prisma.pool.findUnique({
    where: { poolId },
    select: {
      id: true,
      name: true,
      status: true,
      committed: true,
      target: true,
      participants: true,
      maxParticipants: true,
    },
  });

  if (!pool) {
    return { success: false, error: "Pool not found" };
  }

  if (pool.status === "filled" || pool.status === "forged" || pool.status === "active") {
    return { success: false, error: "Pool is filled. Invites are closed." };
  }

  if (pool.status === "suspended" || pool.status === "dissolved") {
    return { success: false, error: "Pool is not available for invites" };
  }

  // Verify inviter is an owner in this pool
  const inviterUser = await prisma.user.findUnique({
    where: { ledgerId: inviterLedgerId },
    select: { id: true },
  });

  if (!inviterUser) {
    return { success: false, error: "Inviter not found" };
  }

  const ownership = await prisma.ownership.findUnique({
    where: {
      poolId_userId: { poolId, userId: inviterUser.id },
    },
    select: { inviteCodesRemaining: true, inviteCodesUsed: true, amountCommitted: true },
  });

  if (!ownership) {
    return { success: false, error: "You must own a PAC in this pool to generate invites" };
  }

  if (ownership.inviteCodesRemaining <= 0) {
    return { success: false, error: "No invite codes remaining for this pool" };
  }

  // Check existing codes for this user+pool
  const existingCodes = await prisma.hallInvite.count({
    where: {
      creatorId: inviterUser.id,
      hall: { poolId },
      isActive: true,
    },
  });

  if (existingCodes >= ownership.inviteCodesRemaining) {
    return { success: false, error: "Maximum active codes reached" };
  }

  // Generate unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    const exists = await prisma.hallInvite.findUnique({ where: { code } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return { success: false, error: "Failed to generate unique code. Please retry." };
  }

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Get the hall for this pool
  const hall = await prisma.hall.findFirst({
    where: { poolId },
    select: { id: true },
  });

  if (!hall) {
    return { success: false, error: "Hall not found for this pool" };
  }

  const record = await prisma.hallInvite.create({
    data: {
      hallId: hall.id,
      creatorId: inviterUser.id,
      code,
      maxUses,
      usedCount: 0,
      expiresAt,
      isActive: true,
    },
  });

  // Decrement remaining codes on ownership
  await prisma.ownership.update({
    where: {
      poolId_userId: { poolId, userId: inviterUser.id },
    },
    data: {
      inviteCodesRemaining: { decrement: 1 },
      inviteCodesUsed: { increment: 1 },
    },
  });

  const inviter = await prisma.user.findUnique({
    where: { ledgerId: inviterLedgerId },
    select: { displayName: true },
  });

  return {
    success: true,
    code: {
      id: record.id,
      code: record.code,
      poolId,
      inviterLedgerId,
      inviterName: inviter?.displayName || "",
      maxUses: record.maxUses,
      usedCount: 0,
      remainingUses: record.maxUses,
      expiresAt: record.expiresAt,
      isExpired: false,
      isActive: true,
      createdAt: record.createdAt,
    },
  };
}

/* ============================================================
   VALIDATION
   ============================================================ */

/**
 * Validate an invite code before use.
 */
export async function validateInviteCode(code: string): Promise<InviteValidation> {
  const record = await prisma.hallInvite.findUnique({
    where: { code },
    include: {
      hall: {
        select: {
          poolId: true,
          name: true,
          pool: { select: { name: true, status: true, committed: true, target: true } },
        },
      },
      creator: { select: { ledgerId: true, displayName: true } },
    },
  });

  if (!record) {
    return { valid: false, error: "Invalid invite code" };
  }

  if (isCodeExpired(record.expiresAt)) {
    return { valid: false, error: "Invite code has expired" };
  }

  if (record.usedCount >= record.maxUses) {
    return { valid: false, error: "Invite code has reached maximum uses" };
  }

  if (!record.isActive) {
    return { valid: false, error: "Invite code is inactive" };
  }

  const poolStatus = record.hall.pool?.status;
  if (poolStatus === "filled" || poolStatus === "forged" || poolStatus === "active") {
    return { valid: false, error: "Pool is filled. Invites are closed." };
  }

  if (poolStatus === "suspended" || poolStatus === "dissolved") {
    return { valid: false, error: "Pool is not available" };
  }

  return {
    valid: true,
    code: record.code,
    inviterLedgerId: record.creator.ledgerId,
    inviterName: record.creator.displayName || "",
    poolId: record.hall.poolId || "",
    poolName: record.hall.pool?.name || record.hall.name || "",
  };
}

/* ============================================================
   USAGE
   ============================================================ */

/**
 * Use an invite code. Links invitee to inviter, credits 1% referral bonus.
 */
export async function useInviteCode(input: {
  code: string;
  inviteeLedgerId: string;
  commitAmount: number;
}): Promise<InviteUsageResult> {
  const { code, inviteeLedgerId, commitAmount } = input;

  // Prevent self-invite
  const validation = await validateInviteCode(code);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  if (validation.inviterLedgerId === inviteeLedgerId) {
    return { success: false, error: "Cannot use your own invite code" };
  }

  // Check if invitee already owns in this pool
  const inviteeUser = await prisma.user.findUnique({
    where: { ledgerId: inviteeLedgerId },
    select: { id: true },
  });

  if (!inviteeUser) {
    return { success: false, error: "Invitee not found" };
  }

  const existingOwnership = await prisma.ownership.findUnique({
    where: {
      poolId_userId: {
        poolId: validation.poolId!,
        userId: inviteeUser.id,
      },
    },
  });

  if (existingOwnership) {
    return { success: false, error: "Already committed to this pool" };
  }

  const referralBonus = Math.floor(commitAmount * REFERRAL_BONUS_PCT * 100) / 100;

  await prisma.$transaction(async (tx) => {
    // Mark code as used
    await tx.hallInvite.update({
      where: { code },
      data: {
        usedCount: { increment: 1 },
      },
    });

    // Credit referral bonus to inviter
    if (referralBonus > 0) {
      await tx.user.update({
        where: { ledgerId: validation.inviterLedgerId },
        data: {
          ledgerBalance: { increment: referralBonus },
        },
      });

      // Create referral reward record
      await tx.referralReward.create({
        data: {
          toLedgerId: validation.inviterLedgerId!,
          fromLedgerId: inviteeLedgerId,
          fromDisplayName: inviteeLedgerId,
          type: "invite",
          amount: commitAmount,
          rewardPercent: REFERRAL_BONUS_PCT,
          rewardAmount: referralBonus,
          status: "completed",
        },
      });
    }

    // Audit
    await tx.auditEntry.create({
      data: {
        type: "invite_used",
        description: `Invite code ${code} used by ${inviteeLedgerId}. Inviter: ${validation.inviterLedgerId}. Bonus: $${referralBonus.toFixed(2)}.`,
        amount: referralBonus,
        txHash: `INVITE-${code}-${Date.now()}`,
        ledgerId: inviteeLedgerId,
      },
    });
  });

  return {
    success: true,
    inviteeLedgerId,
    inviterLedgerId: validation.inviterLedgerId,
    referralBonus,
  };
}

/* ============================================================
   STATS & QUERIES
   ============================================================ */

/**
 * Get invite stats for a user.
 */
export async function getInviteStats(ledgerId: string): Promise<InviteStats> {
  const user = await prisma.user.findUnique({
    where: { ledgerId },
    select: { id: true, ledgerBalance: true },
  });

  if (!user) {
    return {
      totalGenerated: 0,
      totalUsed: 0,
      totalRemaining: 0,
      activeCodes: 0,
      expiredCodes: 0,
      totalReferralEarnings: 0,
      referralCount: 0,
    };
  }

  const [codes, rewards] = await Promise.all([
    prisma.hallInvite.findMany({
      where: { creatorId: user.id },
    }),
    prisma.referralReward.findMany({
      where: { toLedgerId: ledgerId },
    }),
  ]);

  const totalGenerated = codes.length;
  const totalUsed = codes.reduce((s, c) => s + c.usedCount, 0);
  const totalRemaining = codes.reduce((s, c) => s + (c.maxUses - c.usedCount), 0);
  const activeCodes = codes.filter((c) => !isCodeExpired(c.expiresAt) && c.usedCount < c.maxUses && c.isActive).length;
  const expiredCodes = codes.filter((c) => isCodeExpired(c.expiresAt)).length;

  const totalReferralEarnings = rewards.reduce((s, r) => s + r.rewardAmount, 0);
  const referralCount = rewards.length;

  return {
    totalGenerated,
    totalUsed,
    totalRemaining,
    activeCodes,
    expiredCodes,
    totalReferralEarnings,
    referralCount,
  };
}

/**
 * Get all invite codes for a pool.
 */
export async function getPoolInvites(poolId: string): Promise<InviteCode[]> {
  const hall = await prisma.hall.findFirst({
    where: { poolId },
    select: { id: true },
  });

  if (!hall) return [];

  const codes = await prisma.hallInvite.findMany({
    where: { hallId: hall.id },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { ledgerId: true, displayName: true } },
    },
  });

  return codes.map((c) => ({
    id: c.id,
    code: c.code,
    poolId,
    inviterLedgerId: c.creator.ledgerId,
    inviterName: c.creator.displayName || "",
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    remainingUses: c.maxUses - c.usedCount,
    expiresAt: c.expiresAt,
    isExpired: isCodeExpired(c.expiresAt),
    isActive: c.isActive && !isCodeExpired(c.expiresAt) && c.usedCount < c.maxUses,
    createdAt: c.createdAt,
  }));
}

/* ============================================================
   MAINTENANCE
   ============================================================ */

/**
 * Expire old unused codes. Call from cron job.
 */
export async function expireOldCodes(olderThanDays: number = CODE_EXPIRY_DAYS): Promise<{
  expired: number;
}> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const result = await prisma.hallInvite.updateMany({
    where: {
      createdAt: { lt: cutoff },
      usedCount: 0,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  return { expired: result.count };
}

/**
 * Clean up fully used codes (optional archival).
 */
export async function archiveUsedCodes(): Promise<{ archived: number }> {
  const count = await prisma.hallInvite.count({
    where: {
      usedCount: { gte: Prisma.sql`maxUses` },
    },
  });

  return { archived: count };
}