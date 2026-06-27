import { prisma } from "./prisma";

/* ============================================================
   8TH LEDGER — HALL ENGINE V3.2
   Sovereign Parliament, Executive Cabinet, SRI/AHGI
   ============================================================ */

/* ============================================================
   TYPES
   ============================================================ */
export interface HallWithRelations {
  id: string;
  name: string;
  status: string;
  poolId: string;
  createdAt: Date;
  updatedAt: Date;
  hallClass?: "I" | "II" | "III";
  sriScore: number;
  ahgiScore: number;
  closureStatus: string;
  pirDebt: number;
  payrollReserve: number;
  pool: {
    poolId: string;
    name: string;
    verticalId: string;
    status: string;
    listedPrice: number;
    committed: number;
    target: number;
  } | null;
  treasury: {
    balance: number;
    totalDistributed: number;
    totalRevenue: number;
    payrollReserve: number;
    pirDebt: number;
    closureReserve: number;
    monthlyRevenue: number;
  } | null;
  _count: {
    ownerships: number;
    banRecords: number;
    workers: number;
  };
}

export interface HallMembership {
  id: string;
  ownershipPercent: number;
  pacToken: string | null;
  totalReturned: number;
  status: string;
  role: string | null;
  joinedAt: Date;
  isBanned: boolean;
  banExpiresAt: Date | null;
  banReason: string | null;
}

export interface ActiveMember {
  userId: string;
  ledgerId: string;
  displayName: string;
  email: string;
  ownershipPercent: number;
  role: string | null;
  totalReturned: number;
  joinedAt: Date;
}

export type HallRole = "speaker" | "treasurer" | "warden" | "scribe" | "member" | null;

/* ============================================================
   ERRORS
   ============================================================ */
export class HallAccessError extends Error {
  constructor(message: string, public status: number = 403) {
    super(message);
    this.name = "HallAccessError";
  }
}

export class HallValidationError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = "HallValidationError";
  }
}

/* ============================================================
   QUERIES
   ============================================================ */

/**
 * Get hall by ID with all relations.
 */
export async function getHallById(hallId: string): Promise<HallWithRelations | null> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: {
      pool: {
        select: {
          poolId: true,
          name: true,
          verticalId: true,
          status: true,
          listedPrice: true,
          committed: true,
          target: true,
        },
      },
      hallTreasury: {
        select: {
          balance: true,
          totalDistributed: true,
          totalRevenue: true,
          payrollReserve: true,
          pirDebt: true,
          closureReserve: true,
          monthlyRevenue: true,
        },
      },
      _count: {
        select: {
          ownerships: true,
          banRecords: true,
          workers: true,
        },
      },
    },
  });

  if (!hall) return null;

  return hall as HallWithRelations;
}

/**
 * Get hall by pool ID (useful for auto-spawn lookups).
 */
export async function getHallByPoolId(poolId: string): Promise<HallWithRelations | null> {
  const hall = await prisma.hall.findFirst({
    where: { poolId },
    include: {
      pool: {
        select: {
          poolId: true,
          name: true,
          verticalId: true,
          status: true,
          listedPrice: true,
          committed: true,
          target: true,
        },
      },
      hallTreasury: {
        select: {
          balance: true,
          totalDistributed: true,
          totalRevenue: true,
          payrollReserve: true,
          pirDebt: true,
          closureReserve: true,
          monthlyRevenue: true,
        },
      },
      _count: {
        select: {
          ownerships: true,
          banRecords: true,
          workers: true,
        },
      },
    },
  });

  return hall as HallWithRelations | null;
}

/**
 * Get a user's membership in a specific hall.
 */
export async function getHallMembership(
  hallId: string,
  userId: string
): Promise<HallMembership | null> {
  const [ownership, activeBan] = await Promise.all([
    prisma.ownership.findFirst({
      where: { hallId, userId },
      select: {
        id: true,
        ownershipPercent: true,
        pacToken: true,
        totalReturned: true,
        status: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.banRecord.findFirst({
      where: {
        hallId,
        userId,
        status: "active",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        reason: true,
        expiresAt: true,
      },
    }),
  ]);

  if (!ownership) return null;

  return {
    id: ownership.id,
    ownershipPercent: Number(ownership.ownershipPercent),
    pacToken: ownership.pacToken,
    totalReturned: Number(ownership.totalReturned),
    status: ownership.status,
    role: ownership.role,
    joinedAt: ownership.createdAt,
    isBanned: !!activeBan,
    banExpiresAt: activeBan?.expiresAt || null,
    banReason: activeBan?.reason || null,
  };
}

/**
 * Check if a user is banned from a hall.
 */
export async function isBanned(hallId: string, userId: string): Promise<boolean> {
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
 * Get all active (non-banned) members of a hall.
 */
export async function getActiveMembers(hallId: string): Promise<ActiveMember[]> {
  const ownerships = await prisma.ownership.findMany({
    where: {
      hallId,
      status: "active",
      user: {
        banRecords: {
          none: {
            hallId,
            status: "active",
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    },
    select: {
      userId: true,
      ownershipPercent: true,
      role: true,
      totalReturned: true,
      createdAt: true,
      user: {
        select: {
          ledgerId: true,
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: { ownershipPercent: "desc" },
  });

  return ownerships.map((o) => ({
    userId: o.userId,
    ledgerId: o.user.ledgerId,
    displayName: o.user.displayName,
    email: o.user.email,
    ownershipPercent: Number(o.ownershipPercent),
    role: o.role,
    totalReturned: Number(o.totalReturned),
    joinedAt: o.createdAt,
  }));
}

/**
 * Get total committed capital in a hall (for vote threshold calculations).
 */
export async function getHallTotalCapital(hallId: string): Promise<number> {
  const result = await prisma.ownership.aggregate({
    where: { hallId, status: "active" },
    _sum: { ownershipPercent: true },
  });
  return Number(result._sum.ownershipPercent || 0);
}

/* ============================================================
   ACCESS GATES
   ============================================================ */

/**
 * Assert user can access a hall.
 * - Ghost halls: only committers/owners/admin
 * - Banned users: denied
 * - Live halls: any authenticated owner
 */
export async function assertHallAccess(
  hallId: string,
  userId: string,
  userLedgerId: string,
  isAdmin: boolean,
  isPrimaryAdmin: boolean
): Promise<void> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    select: { status: true, poolId: true },
  });

  if (!hall) {
    throw new HallAccessError("Hall not found", 404);
  }

  // Primary admin bypass
  if (isPrimaryAdmin) return;

  // Ban check
  if (await isBanned(hallId, userId)) {
    throw new HallAccessError("You are banned from this Hall", 403);
  }

  // Ghost hall gate — only owners or admin
  if (hall.status === "ghost") {
    const isOwner = await prisma.ownership.findFirst({
      where: { hallId, userId },
    });
    if (!isOwner && !isAdmin) {
      throw new HallAccessError("Pool not yet visible. Commit to enter.", 403);
    }
  }

  // Dissolved hall
  if (hall.status === "dissolved") {
    throw new HallAccessError("This Hall has been dissolved", 403);
  }

  // Dormant hall — still accessible but read-only
  if (hall.status === "dormant") {
    // Allow access but warn
    return;
  }
}

/**
 * Assert user has required role in hall.
 * Roles hierarchy: primary admin (bypass) > admin > executive cabinet > member
 */
export async function assertHallRole(
  hallId: string,
  userId: string,
  isAdmin: boolean,
  isPrimaryAdmin: boolean,
  requiredRole: HallRole | "executive"
): Promise<void> {
  if (isPrimaryAdmin) return;

  const membership = await getHallMembership(hallId, userId);
  if (!membership) {
    throw new HallAccessError("Not a member of this Hall", 403);
  }

  if (membership.isBanned) {
    throw new HallAccessError("You are banned from this Hall", 403);
  }

  if (requiredRole === "executive") {
    const executiveRoles = ["speaker", "treasurer", "warden", "scribe"];
    if (!executiveRoles.includes(membership.role || "")) {
      throw new HallAccessError("Executive Cabinet role required", 403);
    }
    return;
  }

  if (requiredRole === "speaker") {
    if (membership.role !== "speaker") {
      throw new HallAccessError("Speaker role required", 403);
    }
  }

  if (requiredRole === "treasurer") {
    if (membership.role !== "treasurer" && membership.role !== "speaker") {
      throw new HallAccessError("Treasurer or Speaker role required", 403);
    }
  }
}

/* ============================================================
   MUTATIONS
   ============================================================ */

/**
 * Create a hall (typically auto-spawned on pool creation).
 */
export async function createHall(input: {
  poolId: string;
  name: string;
  status?: string;
  hallClass?: "I" | "II" | "III";
}): Promise<{ id: string; name: string }> {
  const existing = await prisma.hall.findFirst({
    where: { poolId: input.poolId },
  });

  if (existing) {
    throw new HallValidationError("Hall already exists for this pool", 409);
  }

  const hall = await prisma.hall.create({
    data: {
      poolId: input.poolId,
      name: input.name,
      status: input.status || "ghost",
      hallClass: input.hallClass,
      sriScore: 50,
      ahgiScore: 50,
      closureStatus: "active",
      pirDebt: 0,
      payrollReserve: 0,
    },
  });

  // Auto-create treasury
  await prisma.hallTreasury.create({
    data: {
      hallId: hall.id,
      balance: 0,
      totalDistributed: 0,
      totalRevenue: 0,
      payrollReserve: 0,
      pirDebt: 0,
      closureReserve: 0,
      monthlyRevenue: 0,
    },
  });

  // Auto-create initial SRI snapshot
  await prisma.sriSnapshot.create({
    data: {
      hallId: hall.id,
      score: 50,
      governanceActivity: 0,
      revenueConsistency: 0,
      dividendReliability: 0,
      proposalQuality: 0,
      dormancyRate: 0,
      marketplaceVelocity: 0,
    },
  });

  // Auto-create initial AHGI snapshot
  await prisma.ahgiSnapshot.create({
    data: {
      hallId: hall.id,
      score: 50,
      healthMetrics: JSON.stringify({ status: "new" }),
      growthMetrics: JSON.stringify({ status: "new" }),
    },
  });

  return { id: hall.id, name: hall.name };
}

/**
 * Update hall status with validation.
 */
export async function updateHallStatus(
  hallId: string,
  newStatus: string,
  updaterLedgerId: string,
  isPrimaryAdmin: boolean
): Promise<void> {
  if (!isPrimaryAdmin) {
    throw new HallAccessError("Primary Admin authority required", 403);
  }

  const validTransitions: Record<string, string[]> = {
    ghost: ["live", "suspended"],
    live: ["mature", "suspended", "dormant"],
    mature: ["live", "suspended", "dormant"],
    suspended: ["live", "ghost"],
    dormant: ["live", "dissolved"],
    dissolved: [],
  };

  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    select: { status: true, name: true },
  });

  if (!hall) {
    throw new HallValidationError("Hall not found", 404);
  }

  const allowed = validTransitions[hall.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new HallValidationError(
      `Cannot transition Hall from "${hall.status}" to "${newStatus}". Allowed: ${allowed.join(", ")}`,
      409
    );
  }

  await prisma.hall.update({
    where: { id: hallId },
    data: { status: newStatus },
  });

  await prisma.auditEntry.create({
    data: {
      type: "hall_status_changed",
      description: `Hall "${hall.name}" status: ${hall.status} → ${newStatus}`,
      txHash: `HALL-STATUS-${hallId}-${Date.now()}`,
    },
  });
}

/**
 * Add a member to a hall with ownership and optional role.
 */
export async function addMember(input: {
  hallId: string;
  userId: string;
  ownershipPercent: number;
  role?: HallRole;
  pacToken?: string;
}): Promise<void> {
  const existing = await prisma.ownership.findFirst({
    where: { hallId: input.hallId, userId: input.userId },
  });

  if (existing) {
    // Update existing ownership
    await prisma.ownership.update({
      where: { id: existing.id },
      data: {
        ownershipPercent: input.ownershipPercent,
        role: input.role || existing.role,
        status: "active",
        pacToken: input.pacToken || existing.pacToken,
      },
    });
    return;
  }

  await prisma.ownership.create({
    data: {
      hallId: input.hallId,
      userId: input.userId,
      ownershipPercent: input.ownershipPercent,
      role: input.role,
      status: "active",
      pacToken: input.pacToken || null,
      totalReturned: 0,
      dynamicValue: 0,
      accumulatedDividends: 0,
      pirDebt: 0,
    },
  });
}

/**
 * Remove or ban a member from a hall.
 */
export async function removeMember(input: {
  hallId: string;
  userId: string;
  action: "remove" | "ban";
  reason?: string;
  durationDays?: number;
  bannedBy?: string;
}): Promise<void> {
  const membership = await getHallMembership(input.hallId, input.userId);
  if (!membership) {
    throw new HallValidationError("Member not found in this Hall", 404);
  }

  if (input.action === "ban") {
    const expiresAt = input.durationDays
      ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.banRecord.create({
        data: {
          hallId: input.hallId,
          userId: input.userId,
          reason: input.reason || "No reason provided",
          bannedById: input.bannedBy || null,
          status: "active",
          expiresAt,
        },
      });

      await tx.ownership.updateMany({
        where: { hallId: input.hallId, userId: input.userId },
        data: { status: "banned" },
      });
    });
  } else {
    // Soft remove — dissolve ownership
    await prisma.ownership.updateMany({
      where: { hallId: input.hallId, userId: input.userId },
      data: { status: "inactive", ownershipPercent: 0 },
    });
  }
}

/**
 * Lift a ban and restore membership.
 */
export async function liftBan(hallId: string, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.banRecord.updateMany({
      where: { hallId, userId, status: "active" },
      data: { status: "lifted", liftedAt: new Date() },
    });

    await tx.ownership.updateMany({
      where: { hallId, userId },
      data: { status: "active" },
    });
  });
}

/* ============================================================
   EXECUTIVE CABINET
   ============================================================ */

/**
 * Get current Executive Cabinet for a hall.
 */
export async function getExecutiveCabinet(hallId: string) {
  return prisma.executiveCabinet.findUnique({
    where: { hallId },
    include: {
      speaker: { select: { ledgerId: true, displayName: true, avatar: true } },
      treasurer: { select: { ledgerId: true, displayName: true, avatar: true } },
      warden: { select: { ledgerId: true, displayName: true, avatar: true } },
      scribe: { select: { ledgerId: true, displayName: true, avatar: true } },
    },
  });
}

/**
 * Elect Executive Cabinet (called after pool forge).
 */
export async function electExecutiveCabinet(input: {
  hallId: string;
  speakerId?: string;
  treasurerId?: string;
  wardenId?: string;
  scribeId?: string;
  expiresAt: Date;
}): Promise<void> {
  const existing = await prisma.executiveCabinet.findUnique({
    where: { hallId: input.hallId },
  });

  if (existing) {
    await prisma.executiveCabinet.update({
      where: { hallId: input.hallId },
      data: {
        speakerId: input.speakerId,
        treasurerId: input.treasurerId,
        wardenId: input.wardenId,
        scribeId: input.scribeId,
        electedAt: new Date(),
        expiresAt: input.expiresAt,
        isImpeached: false,
        impeachedAt: null,
        impeachReason: null,
      },
    });
  } else {
    await prisma.executiveCabinet.create({
      data: {
        hallId: input.hallId,
        speakerId: input.speakerId,
        treasurerId: input.treasurerId,
        wardenId: input.wardenId,
        scribeId: input.scribeId,
        electedAt: new Date(),
        expiresAt: input.expiresAt,
      },
    });
  }

  // Update hall reference
  await prisma.hall.update({
    where: { id: input.hallId },
    data: { executiveCabinetId: input.hallId },
  });
}

/* ============================================================
   SRI / AHGI HELPERS
   ============================================================ */

/**
 * Get latest SRI snapshot for a hall.
 */
export async function getLatestSri(hallId: string) {
  return prisma.sriSnapshot.findFirst({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
  });
}

/**
 * Get latest AHGI snapshot for a hall.
 */
export async function getLatestAhgi(hallId: string) {
  return prisma.ahgiSnapshot.findFirst({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
  });
}

/**
 * Get SRI tier from score.
 */
export function getSriTier(score: number): string {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  if (score >= 40) return "bronze";
  return "at_risk";
}

/**
 * Get AHGI status from score.
 */
export function getAhgiStatus(score: number): string {
  if (score >= 80) return "thriving";
  if (score >= 60) return "healthy";
  if (score >= 40) return "stagnant";
  if (score >= 20) return "declining";
  return "critical";
}

/* ============================================================
   CLOSURE PROTOCOL
   ============================================================ */

/**
 * Get active closure protocol for a hall.
 */
export async function getClosureProtocol(hallId: string) {
  return prisma.closureProtocol.findFirst({
    where: { hallId, status: "active" },
    include: { payouts: true },
  });
}

/**
 * Trigger closure warning (auto or admin).
 */
export async function triggerClosureWarning(
  hallId: string,
  ahgiScore: number,
  revenue: number,
  payroll: number,
  triggeredBy: "system" | "admin"
): Promise<void> {
  const existing = await prisma.closureProtocol.findFirst({
    where: { hallId, status: "active" },
  });

  if (existing) {
    // Update existing if in warning phase
    if (existing.phase === "warning") {
      await prisma.closureProtocol.update({
        where: { id: existing.id },
        data: {
          phase: "decision",
          triggerMonth: new Date(),
          ahgiAtTrigger: ahgiScore,
          revenueAtTrigger: revenue,
          payrollAtTrigger: payroll,
        },
      });
    }
    return;
  }

  await prisma.closureProtocol.create({
    data: {
      hallId,
      triggerMonth: new Date(),
      ahgiAtTrigger: ahgiScore,
      revenueAtTrigger: revenue,
      payrollAtTrigger: payroll,
      phase: "warning",
      status: "active",
    },
  });

  // Update hall
  await prisma.hall.update({
    where: { id: hallId },
    data: { closureStatus: "warning" },
  });

  // Create audit entry
  await prisma.auditEntry.create({
    data: {
      type: "closure_warning",
      description: `Closure Protocol triggered for Hall ${hallId}. AHGI: ${ahgiScore}. Triggered by: ${triggeredBy}`,
      txHash: `CLOSURE-${hallId}-${Date.now()}`,
    },
  });
}

/* ============================================================
   VALIDATORS
   ============================================================ */

/**
 * Validate that a proposed ownership redistribution sums to 100%.
 */
export async function validateOwnershipDistribution(
  hallId: string,
  proposed: Array<{ userId: string; ownershipPercent: number }>
): Promise<{ valid: boolean; error?: string; total: number }> {
  const total = proposed.reduce((s, p) => s + p.ownershipPercent, 0);
  if (Math.abs(total - 100) > 0.01) {
    return { valid: false, error: `Ownership must total 100%. Current: ${total.toFixed(2)}%`, total };
  }

  // Check no user goes below 0
  const negative = proposed.filter((p) => p.ownershipPercent < 0);
  if (negative.length > 0) {
    return { valid: false, error: "Ownership cannot be negative", total };
  }

  return { valid: true, total };
}

/**
 * Check if a hall has quorum for governance (at least 1 active member with ownership).
 */
export async function hasQuorum(hallId: string): Promise<boolean> {
  const members = await getActiveMembers(hallId);
  const totalOwnership = members.reduce((s, m) => s + m.ownershipPercent, 0);
  return members.length > 0 && totalOwnership > 0;
}

/**
 * Check if hall is in closure protocol.
 */
export async function isInClosure(hallId: string): Promise<boolean> {
  const closure = await getClosureProtocol(hallId);
  return !!closure;
}