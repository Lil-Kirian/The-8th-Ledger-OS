import { prisma } from "./prisma";
import {  getHallMembership } from "./halls";

/* ============================================================
   8TH LEDGER — BAN & APPEAL ENGINE
   Hall-level governance bans + Global blacklist
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export type BanScope = "hall" | "global";
export type BanStatus = "active" | "lifted" | "appealed" | "superseded";

export interface BanProposalInput {
  hallId: string;
  targetUserId: string;
  proposedBy: string;
  reason: string;
  evidenceUrls: string[];
  scope: BanScope;
  durationDays?: number; // null = permanent
}

export interface BanRecord {
  id: string;
  hallId: string | null;
  userId: string;
  scope: BanScope;
  status: BanStatus;
  reason: string;
  evidenceUrls: string[];
  bannedBy: string | null;
  liftedBy: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  liftedAt: Date | null;
}

export interface AppealInput {
  banId: string;
  appellantId: string;
  reason: string;
  newEvidenceUrls: string[];
}

export interface BlacklistEntry {
  identityHash: string;
  reason: string;
  bannedAt: Date;
  permanent: boolean;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const BAN_PROPOSAL_TYPE = "ban";
const BAN_THRESHOLD = 51;
const APPEAL_REVIEW_DAYS = 14;

/* ============================================================
   BAN PROPOSALS (Governance-driven)
   ============================================================ */

/**
 * Create a ban proposal. Must go through governance vote.
 */
export async function proposeBan(input: BanProposalInput): Promise<{
  success: boolean;
  proposalId?: string;
  error?: string;
}> {
  if (!input.reason.trim()) {
    return { success: false, error: "Reason required" };
  }
  if (!input.evidenceUrls || input.evidenceUrls.length === 0) {
    return { success: false, error: "At least one evidence URL required" };
  }
  if (input.evidenceUrls.length > 10) {
    return { success: false, error: "Maximum 10 evidence URLs" };
  }

  // Verify target is a member
  const targetMembership = await getHallMembership(input.hallId, input.targetUserId);
  if (!targetMembership) {
    return { success: false, error: "Target is not a member of this Hall" };
  }

  // Verify proposer is a member
  const proposerMembership = await getHallMembership(input.hallId, input.proposedBy);
  if (!proposerMembership) {
    return { success: false, error: "Proposer must be a Hall member" };
  }

  // Cannot ban yourself
  if (input.targetUserId === input.proposedBy) {
    return { success: false, error: "Cannot propose ban on yourself" };
  }

  // Cannot ban primary admin
  const targetUser = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { role: true, isPrimaryAdmin: true, ledgerId: true, displayName: true },
  });

  if (targetUser?.isPrimaryAdmin) {
    return { success: false, error: "Cannot propose ban on Primary Admin" };
  }

  const proposal = await prisma.proposal.create({
    data: {
      hallId: input.hallId,
      proposerId: input.proposedBy,
      title: `Ban ${targetUser?.displayName || "Member"} — ${input.scope.toUpperCase()}`,
      description: input.reason.trim(),
      type: BAN_PROPOSAL_TYPE,
      amount: null,
      thresholdPercent: BAN_THRESHOLD,
      status: "active",
      executionStatus: "pending",
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day vote
      voteCountYes: 0,
      voteCountNo: 0,
    },
  });

  return { success: true, proposalId: proposal.id };
}

/**
 * Execute a passed ban proposal. Called after 51% vote threshold reached.
 */
export async function executeBanVote(
  proposalId: string,
  executorId: string,
  isPrimaryAdmin: boolean
): Promise<{ success: boolean; banId?: string; error?: string }> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal || proposal.type !== BAN_PROPOSAL_TYPE) {
    return { success: false, error: "Ban proposal not found" };
  }

  if (proposal.status !== "passed") {
    return { success: false, error: `Proposal is ${proposal.status}, not passed` };
  }

  const targetUserId = proposal.targetUserId;
  const scope = (proposal.description.includes("GLOBAL") ? "global" : "hall") as BanScope;

  if (!targetUserId) {
    return { success: false, error: "Corrupted ban proposal metadata" };
  }

  if (scope === "global" && !isPrimaryAdmin) {
    return { success: false, error: "Global bans require Primary Admin authority" };
  }

  // Execute ban
  if (scope === "global") {
    const result = await applyGlobalBan({
      userId: targetUserId,
      reason: proposal.description,
      evidenceUrls: [],
      bannedByLedgerId: executorId,
    });
    return result;
  } else {
    const result = await applyHallBan({
      hallId: proposal.hallId!,
      userId: targetUserId,
      reason: proposal.description,
      evidenceUrls: [],
      bannedByLedgerId: executorId,
      durationDays: null,
    });
    return result;
  }
}

/* ============================================================
   HALL BAN
   ============================================================ */

/**
 * Apply a hall-level ban.
 * - Loses voting rights
 * - Keeps dividend rights
 * - Can be temporary or permanent
 */
export async function applyHallBan(input: {
  hallId: string;
  userId: string;
  reason: string;
  evidenceUrls: string[];
  bannedByLedgerId: string;
  durationDays?: number | null;
}): Promise<{ success: boolean; banId?: string; error?: string }> {
  const { hallId, userId, reason, evidenceUrls, bannedByLedgerId, durationDays } = input;

  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  // Lift any existing active bans first (clean slate)
  await prisma.banRecord.updateMany({
    where: { hallId, userId, status: "active" },
    data: { status: "superseded", liftedAt: new Date() },
  });

  const ban = await prisma.banRecord.create({
    data: {
      hallId,
      userId,
      reason: reason.trim(),
      evidence: JSON.stringify(evidenceUrls),
      bannedById: bannedByLedgerId,
      status: "active",
      expiresAt,
      duration: durationDays ? `${durationDays}d` : "permanent",
    },
  });

  // Update ownership: strip voting but keep dividends
  await prisma.ownership.updateMany({
    where: { hallId, userId },
    data: { status: "banned" },
  });

  // Audit
  await prisma.auditEntry.create({
    data: {
      type: "hall_ban_enacted",
      description: `Hall ban enacted on user ${userId} in Hall ${hallId}. Scope: hall. Duration: ${durationDays ? durationDays + " days" : "permanent"}.`,
      txHash: `BAN-HALL-${ban.id}-${Date.now()}`,
      poolId: (await prisma.hall.findUnique({ where: { id: hallId }, select: { poolId: true } }))?.poolId || undefined,
    },
  });

  return { success: true, banId: ban.id };
}

/* ============================================================
   GLOBAL BAN
   ============================================================ */

/**
 * Apply a global ban.
 * - Freezes account (cannot login, cannot transact)
 * - Forfeits ALL PACs across all halls
 * - Blacklists identity permanently
 */
export async function applyGlobalBan(input: {
  userId: string;
  reason: string;
  evidenceUrls: string[];
  bannedByLedgerId: string;
}): Promise<{ success: boolean; banId?: string; error?: string }> {
  const { userId, reason, evidenceUrls, bannedByLedgerId } = input;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ledgerId: true,
      displayName: true,
      email: true,
      dateOfBirth: true,
      idNumber: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  await prisma.$transaction(async (tx) => {
    // Create global ban record (no hallId)
    await tx.banRecord.create({
      data: {
        userId,
        reason: reason.trim(),
        evidence: JSON.stringify(evidenceUrls),
        bannedById: bannedByLedgerId,
        status: "active",
        duration: "permanent",
      },
    });

    // Forfeit all PACs across all halls
    const ownerships = await tx.ownership.findMany({
      where: { userId, status: "active" },
    });

    for (const o of ownerships) {
      const activeOwners = await tx.ownership.findMany({
        where: { hallId: o.hallId, status: "active", NOT: { userId } },
      });

      if (activeOwners.length > 0) {
        const totalActivePct = activeOwners.reduce((s, ao) => s + Number(ao.ownershipPercent), 0);
        const forfeitPct = Number(o.ownershipPercent);

        for (const ao of activeOwners) {
          const aoPct = Number(ao.ownershipPercent);
          const additional = totalActivePct > 0 ? (aoPct / totalActivePct) * forfeitPct : 0;
          await tx.ownership.update({
            where: { id: ao.id },
            data: { ownershipPercent: aoPct + additional },
          });
        }
      }

      await tx.ownership.update({
        where: { id: o.id },
        data: { status: "dissolved", ownershipPercent: 0 },
      });
    }

    // Freeze account
    await tx.user.update({
      where: { id: userId },
      data: { isBanned: true, banReason: reason.trim() },
    });

    // Blacklist identity
    const identityHash = hashIdentity(user.email, user.dateOfBirth, user.idNumber);
    await tx.blacklistEntry.create({
      data: {
        identityHash,
        reason: reason.trim(),
        bannedAt: new Date(),
        permanent: true,
      },
    });
  });

  await prisma.auditEntry.create({
    data: {
      type: "global_ban_enacted",
      description: `GLOBAL BAN: ${user.displayName} (${user.ledgerId}). Account frozen. PACs forfeited. Identity blacklisted.`,
      txHash: `BAN-GLOBAL-${userId}-${Date.now()}`,
      ledgerId: user.ledgerId,
    },
  });

  return { success: true, banId: userId };
}

/* ============================================================
   LIFT BAN
   ============================================================ */

/**
 * Lift a ban (primary admin or successful appeal).
 */
export async function liftBan(input: {
  banId: string;
  liftedByLedgerId: string;
  isPrimaryAdmin: boolean;
  appealId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { banId, liftedByLedgerId, isPrimaryAdmin, appealId } = input;

  const ban = await prisma.banRecord.findUnique({
    where: { id: banId },
  });

  if (!ban) {
    return { success: false, error: "Ban record not found" };
  }

  if (ban.status !== "active") {
    return { success: false, error: `Ban is already ${ban.status}` };
  }

  // Global bans can only be lifted by primary admin
  if (!ban.hallId && !isPrimaryAdmin) {
    return { success: false, error: "Global bans require Primary Admin authority to lift" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.banRecord.update({
      where: { id: banId },
      data: {
        status: "lifted",
        liftedAt: new Date(),
      },
    });

    // Restore hall membership if hall ban
    if (ban.hallId) {
      await tx.ownership.updateMany({
        where: { hallId: ban.hallId, userId: ban.userId },
        data: { status: "active" },
      });
    }

    // If global ban, unfreeze account
    if (!ban.hallId) {
      await tx.user.update({
        where: { id: ban.userId },
        data: { isBanned: false, banReason: null },
      });
    }

    // Update appeal if applicable
    if (appealId) {
      await tx.banAppeal.update({
        where: { id: appealId },
        data: { status: "granted", resolvedAt: new Date() },
      });
    }

    await tx.auditEntry.create({
      data: {
        type: "ban_lifted",
        description: `Ban #${banId} lifted by ${liftedByLedgerId}. Scope: ${ban.hallId ? "hall" : "global"}.`,
        txHash: `BAN-LIFT-${banId}-${Date.now()}`,
      },
    });
  });

  return { success: true };
}

/* ============================================================
   APPEALS
   ============================================================ */

/**
 * File an appeal against a ban.
 */
export async function fileAppeal(input: AppealInput): Promise<{
  success: boolean;
  appealId?: string;
  error?: string;
}> {
  const { banId, appellantId, reason, newEvidenceUrls } = input;

  const ban = await prisma.banRecord.findUnique({
    where: { id: banId },
  });

  if (!ban) {
    return { success: false, error: "Ban record not found" };
  }

  if (ban.userId !== appellantId) {
    return { success: false, error: "Only the banned user can file an appeal" };
  }

  if (ban.status !== "active") {
    return { success: false, error: `Ban is ${ban.status}, cannot appeal` };
  }

  // Check for existing pending appeal
  const existing = await prisma.banAppeal.findFirst({
    where: { banId, status: "pending" },
  });

  if (existing) {
    return { success: false, error: "You already have a pending appeal" };
  }

  const appeal = await prisma.banAppeal.create({
    data: {
      banId,
      appellantId,
      reason: reason.trim(),
      evidence: JSON.stringify(newEvidenceUrls),
      status: "pending",
      reviewDeadline: new Date(Date.now() + APPEAL_REVIEW_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  // Update ban status to appealed
  await prisma.banRecord.update({
    where: { id: banId },
    data: { status: "appealed" },
  });

  // Notify primary admin
  try {
    await prisma.notification.create({
      data: {
        ledgerId: "admin",
        type: "ban_appeal",
        title: "Ban Appeal Filed",
        message: `User ${appellantId} filed an appeal for ban #${banId}.`,
        actionUrl: `/admin/bans?appeal=${appeal.id}`,
        createdAt: new Date(),
      },
    });
  } catch {
    // Silent
  }

  return { success: true, appealId: appeal.id };
}

/**
 * Review an appeal (primary admin only).
 */
export async function reviewAppeal(input: {
  appealId: string;
  decision: "grant" | "deny";
  reviewerLedgerId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { appealId, decision, reviewerLedgerId, reason } = input;

  const appeal = await prisma.banAppeal.findUnique({
    where: { id: appealId },
    include: { ban: true },
  });

  if (!appeal) {
    return { success: false, error: "Appeal not found" };
  }

  if (appeal.status !== "pending") {
    return { success: false, error: `Appeal already ${appeal.status}` };
  }

  if (decision === "grant") {
    await liftBan({
      banId: appeal.banId,
      liftedByLedgerId: reviewerLedgerId,
      isPrimaryAdmin: true,
      appealId,
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.banAppeal.update({
        where: { id: appealId },
        data: { status: "denied", resolvedAt: new Date(), resolutionReason: reason },
      });

      // Restore ban to active
      await tx.banRecord.update({
        where: { id: appeal.banId },
        data: { status: "active" },
      });

      await tx.auditEntry.create({
        data: {
          type: "ban_appeal_denied",
          description: `Appeal #${appealId} denied. Reason: ${reason}`,
          txHash: `APPEAL-DENY-${appealId}-${Date.now()}`,
        },
      });
    });
  }

  return { success: true };
}

/* ============================================================
   BLACKLIST
   ============================================================ */

/**
 * Hash identity for blacklist comparison.
 */
function hashIdentity(email: string | null, dob: Date | null, idNumber: string | null): string {
  const payload = `${(email || "").toLowerCase().trim()}|${dob?.toISOString() || ""}|${idNumber || ""}`;
  return require("crypto").createHash("sha256").update(payload).digest("hex");
}

/**
 * Check if an identity is globally blacklisted.
 */
export async function isBlacklisted(input: {
  email?: string;
  dateOfBirth?: Date;
  idNumber?: string;
}): Promise<{ blacklisted: boolean; reason?: string; bannedAt?: Date }> {
  const identityHash = hashIdentity(input.email || null, input.dateOfBirth || null, input.idNumber || null);

  const entry = await prisma.blacklistEntry.findUnique({
    where: { identityHash },
  });

  if (!entry) {
    return { blacklisted: false };
  }

  return {
    blacklisted: true,
    reason: entry.reason,
    bannedAt: entry.bannedAt,
  };
}

/**
 * Check if a user is currently banned from a hall.
 */
export async function isBannedFromHall(hallId: string, userId: string): Promise<boolean> {
  const ban = await prisma.banRecord.findFirst({
    where: {
      hallId,
      userId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  return !!ban;
}

/**
 * Check if a user is globally banned.
 */
export async function isGloballyBanned(userId: string): Promise<boolean> {
  const ban = await prisma.banRecord.findFirst({
    where: {
      userId,
      hallId: null,
      status: "active",
    },
  });
  return !!ban;
}

/* ============================================================
   QUERIES
   ============================================================ */

/**
 * Get full ban history for a user.
 */
export async function getBanHistory(userId: string): Promise<{
  bans: BanRecord[];
  appeals: Array<{
    id: string;
    status: string;
    reason: string;
    filedAt: Date;
    resolvedAt: Date | null;
  }>;
}> {
  const [bans, appeals] = await Promise.all([
    prisma.banRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.banAppeal.findMany({
      where: { appellantId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    bans: bans.map((b) => ({
      id: b.id,
      hallId: b.hallId,
      userId: b.userId,
      scope: (b.hallId ? "hall" : "global") as BanScope,
      status: b.status as BanStatus,
      reason: b.reason,
      evidenceUrls: safeParseJson(b.evidence),
      bannedBy: b.bannedById,
      liftedBy: null,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
      liftedAt: b.liftedAt,
    })),
    appeals: appeals.map((a) => ({
      id: a.id,
      status: a.status,
      reason: a.reason,
      filedAt: a.createdAt,
      resolvedAt: a.resolvedAt,
    })),
  };
}

/**
 * Get active bans for a hall (admin view).
 */
export async function getHallBans(hallId: string): Promise<BanRecord[]> {
  const bans = await prisma.banRecord.findMany({
    where: {
      hallId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });

  return bans.map((b) => ({
    id: b.id,
    hallId: b.hallId,
    userId: b.userId,
    scope: "hall" as BanScope,
    status: b.status as BanStatus,
    reason: b.reason,
    evidenceUrls: safeParseJson(b.evidence),
    bannedBy: b.bannedById,
    liftedBy: null,
    expiresAt: b.expiresAt,
    createdAt: b.createdAt,
    liftedAt: b.liftedAt,
  }));
}

function safeParseJson(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}