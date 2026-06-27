// lib/gates.ts
// 8th Ledger — Feature Access Gates
// Controls what pages/components/APIs are locked/unlocked

import { prisma } from "./prisma";
import {  requireAuth } from "./auth";
import { getAssetTypeById, getVerticalClass } from "./asset-types";

/* ============================================================
   TYPES
   ============================================================ */
export interface GateResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: string;
  requiredFeature?: string;
}

/* ============================================================
   KYC TIER RANKING
   ============================================================ */
const TIER_RANK: Record<string, number> = {
  visitor: 0,
  sovereign: 1,
  verified: 2,
  whale: 3,
};

export function tierMeets(required: string, actual: string): boolean {
  return (TIER_RANK[actual] ?? 0) >= (TIER_RANK[required] ?? 0);
}

/* ============================================================
   HALL MEMBERSHIP GATES
   ============================================================ */

/**
 * Check if user is an active owner/member of a hall.
 */
export async function isHallMember(hallId: string, userId: string): Promise<boolean> {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: "active" },
  });
  return !!ownership;
}

/**
 * Get user's ownership percentage in a hall.
 */
export async function getHallOwnershipPercent(hallId: string, userId: string): Promise<number> {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: "active" },
    select: { ownershipPercent: true },
  });
  return ownership?.ownershipPercent ?? 0;
}

/**
 * Require hall membership. Returns ownership data.
 */
export async function requireHallMembership(hallId: string, userId: string) {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: "active" },
    include: { hall: true, pool: true },
  });
  if (!ownership) {
    throw new Error("You are not a member of this Hall");
  }
  return ownership;
}

/* ============================================================
   FEATURE GATES — Universal Rules (Any hall can enable via 51% vote)
   ============================================================ */

/**
 * Can user access Inventory for this hall?
 * Rule: Hall must have inventoryEnabled=true OR be default Class III.
 * User must be hall member.
 */
export async function canAccessInventory(hallId: string, userId: string): Promise<GateResult> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: { pool: { select: { assetType: true, verticalId: true } } },
  });

  if (!hall) return { allowed: false, reason: "Hall not found" };

  const isMember = await isHallMember(hallId, userId);
  if (!isMember) return { allowed: false, reason: "Hall membership required" };

  // If explicitly enabled via vote, always allow
  if (hall.inventoryEnabled) return { allowed: true };

  // Default: Class III halls have inventory capability
  const assetType = getAssetTypeById(hall.pool?.assetType ?? "");
  const verticalClass = getVerticalClass(hall.pool?.verticalId ?? "");
  const defaultCapable = assetType?.inventoryCapable ?? verticalClass === "III";

  if (defaultCapable) return { allowed: true };

  return {
    allowed: false,
    reason: "Inventory not enabled for this hall. Propose a vote (51% required).",
    requiredFeature: "inventory_enable",
  };
}

/**
 * Can user access Forge/Workers for this hall?
 * Rule: Hall must have forgeEnabled=true OR be default Class III.
 * User must be hall member.
 */
export async function canAccessForge(hallId: string, userId: string): Promise<GateResult> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: { pool: { select: { assetType: true, verticalId: true } } },
  });

  if (!hall) return { allowed: false, reason: "Hall not found" };

  const isMember = await isHallMember(hallId, userId);
  if (!isMember) return { allowed: false, reason: "Hall membership required" };

  // If explicitly enabled via vote, always allow
  if (hall.forgeEnabled) return { allowed: true };

  // Default: Class III and II halls have worker capability
  const assetType = getAssetTypeById(hall.pool?.assetType ?? "");
  const verticalClass = getVerticalClass(hall.pool?.verticalId ?? "");
  const defaultCapable = (assetType?.workerRoles?.length ?? 0) > 0 || verticalClass !== "I";

  if (defaultCapable) return { allowed: true };

  return {
    allowed: false,
    reason: "Forge not enabled for this hall. Propose a vote (51% required).",
    requiredFeature: "forge_enable",
  };
}

/**
 * Can user access Operations tab?
 * Rule: Operations appears if inventory OR forge is accessible.
 */
export async function canAccessOperations(hallId: string, userId: string): Promise<GateResult> {
  const [inventory, forge] = await Promise.all([
    canAccessInventory(hallId, userId),
    canAccessForge(hallId, userId),
  ]);

  if (inventory.allowed || forge.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Operations require inventory or forge to be enabled. Propose a vote (51% required).",
    requiredFeature: "inventory_enable or forge_enable",
  };
}

/**
 * Can user access IHCP for this hall?
 * Rule: Any hall can have IHCP. Just need to be a member.
 */
export async function canAccessIhcp(hallId: string, userId: string): Promise<GateResult> {
  const hall = await prisma.hall.findUnique({ where: { id: hallId } });
  if (!hall) return { allowed: false, reason: "Hall not found" };

  const isMember = await isHallMember(hallId, userId);
  if (!isMember) return { allowed: false, reason: "Hall membership required" };

  return { allowed: true };
}

/**
 * Can user access the Marketplace (Ownership)?
 * Rule: KYC tier >= sovereign required.
 */
export async function canAccessOwnershipMarket(userId: string): Promise<GateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycTier: true },
  });
  if (!user) return { allowed: false, reason: "User not found" };

  if (tierMeets("sovereign", user.kycTier)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "KYC tier 'Sovereign' required to trade PACs.",
    requiredTier: "sovereign",
  };
}

/**
 * Can user access public Inventory Market?
 * Rule: No auth required for small purchases. KYC for B2B.
 */
export async function canAccessInventoryMarket(userId?: string): Promise<GateResult> {
  // Public access allowed
  return { allowed: true };
}

/* ============================================================
   PROPOSAL GATES — What can this hall vote on?
   ============================================================ */

export async function canProposeType(
  hallId: string,
  userId: string,
  type: string
): Promise<GateResult> {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: { pool: { select: { assetType: true, verticalId: true } } },
  });

  if (!hall) return { allowed: false, reason: "Hall not found" };

  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: "active" },
  });
  if (!ownership) return { allowed: false, reason: "Ownership required to propose" };

  // Enable proposals are always allowed
  if (["inventory_enable", "forge_enable", "ihcp_create"].includes(type)) {
    return { allowed: true };
  }

  // Check hall's default class capability
  const assetType = getAssetTypeById(hall.pool?.assetType ?? "");
  const verticalClass = getVerticalClass(hall.pool?.verticalId ?? "");
  const inventoryEnabled = hall.inventoryEnabled;
  const forgeEnabled = hall.forgeEnabled;

  // Operational proposals require feature enabled
  if (["inventory_list", "pricing_change", "marketing", "supplier_change"].includes(type)) {
    if (inventoryEnabled || verticalClass === "III") return { allowed: true };
    return { allowed: false, reason: "Enable inventory first (51% vote)" };
  }

  if (["hire", "fire", "performance_review"].includes(type)) {
    if (forgeEnabled || verticalClass !== "I") return { allowed: true };
    return { allowed: false, reason: "Enable forge first (51% vote)" };
  }

  // Maintenance, sale, lease, insurance, location — always allowed
  if (["maintenance", "sale", "lease", "insurance", "location_select", "closure", "pir_advance"].includes(type)) {
    return { allowed: true };
  }

  return { allowed: false, reason: `Proposal type '${type}' not recognized` };
}

/* ============================================================
   PAGE-LEVEL GATES (Server Components / API Routes)
   ============================================================ */

/**
 * Server-side gate check. Throws if not allowed.
 */
export async function assertGate(
  check: Promise<GateResult> | GateResult,
  action: string
): Promise<void> {
  const result = await check;
  if (!result.allowed) {
    throw new Error(`Access denied for ${action}: ${result.reason}`);
  }
}

/**
 * Quick sync check for middleware / client.
 * Use async version above for server components.
 */
export function getGateStatus(
  inventoryEnabled: boolean,
  forgeEnabled: boolean,
  hallClass: string,
  assetTypeId?: string
): {
  inventory: boolean;
  forge: boolean;
  operations: boolean;
  ihcp: boolean;
} {
  const assetType = getAssetTypeById(assetTypeId ?? "");
  const defaultInventory = assetType?.inventoryCapable ?? hallClass === "III";
  const defaultForge = (assetType?.workerRoles?.length ?? 0) > 0 || hallClass !== "I";

  return {
    inventory: inventoryEnabled || defaultInventory,
    forge: forgeEnabled || defaultForge,
    operations: (inventoryEnabled || defaultInventory) || (forgeEnabled || defaultForge),
    ihcp: true, // IHCP is universal
  };
}

/* ============================================================
   KYC GATES
   ============================================================ */

export async function requireKycTierGate(userId: string, requiredTier: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycTier: true },
  });
  if (!user || !tierMeets(requiredTier, user.kycTier)) {
    throw new Error(`KYC tier '${requiredTier}' required`);
  }
}

/* ============================================================
   ADMIN GATES
   ============================================================ */

export async function isPrimaryAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isPrimaryAdmin: true },
  });
  return user?.role === "admin" && user?.isPrimaryAdmin === true;
}

export async function requirePrimaryAdmin(userId: string): Promise<void> {
  if (!(await isPrimaryAdmin(userId))) {
    throw new Error("Primary Admin access required");
  }
}