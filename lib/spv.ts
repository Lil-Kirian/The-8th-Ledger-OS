import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

/* ============================================================
   TYPES
   ============================================================ */
export type EntityType = "llc" | "ltd" | "corporation" | "trust" | "foundation" | "partnership";

export interface SpvDocument {
  name: string;
  url: string;
  category: "incorporation" | "tax" | "compliance" | "ownership" | "banking" | "other";
  uploadedAt: string;
}

export interface SpvEntityInput {
  poolId: number;
  name?: string;
  entityType: EntityType;
  jurisdiction: string;
  registrationNumber?: string;
  registrationDate?: Date;
  registeredAddress?: string;
  beneficialOwners?: Array<{
    name: string;
    ownershipPct: number;
    nationality: string;
  }>;
  notes?: string;
}

export interface SpvRegistrationUpdate {
  registrationNumber?: string;
  registrationDate?: Date;
  registeredAddress?: string;
  beneficialOwners?: Array<{
    name: string;
    ownershipPct: number;
    nationality: string;
  }>;
  notes?: string;
}

export interface ComplianceStatus {
  spvId: number;
  spvName: string;
  poolId: number;
  compliant: boolean;
  checks: {
    hasIncorporationDoc: boolean;
    hasTaxDoc: boolean;
    hasRegistrationNumber: boolean;
    hasRegisteredAddress: boolean;
    hasBeneficialOwners: boolean;
    jurisdictionSupported: boolean;
  };
  missing: string[];
  score: number; // 0-100
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const SUPPORTED_ENTITY_TYPES: EntityType[] = [
  "llc",
  "ltd",
  "corporation",
  "trust",
  "foundation",
  "partnership",
];

const SUPPORTED_JURISDICTIONS = [
  "US",
  "UK",
  "CA",
  "AU",
  "KY", // Cayman Islands
  "VG", // British Virgin Islands
  "SG", // Singapore
  "AE", // UAE
  "CH", // Switzerland
  "DE", // Germany
  "NG", // Nigeria
  "ZA", // South Africa
  "GH", // Ghana
  "KE", // Kenya
  "IN", // India
  "BR", // Brazil
  "MX", // Mexico
] as const;

const JURISDICTION_LABELS: Record<string, string> = {
  US: "United States",
  UK: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  KY: "Cayman Islands",
  VG: "British Virgin Islands",
  SG: "Singapore",
  AE: "United Arab Emirates",
  CH: "Switzerland",
  DE: "Germany",
  NG: "Nigeria",
  ZA: "South Africa",
  GH: "Ghana",
  KE: "Kenya",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
};

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  llc: "Limited Liability Company",
  ltd: "Private Limited Company",
  corporation: "Corporation",
  trust: "Trust",
  foundation: "Foundation",
  partnership: "Limited Partnership",
};

/* ============================================================
   PURE FUNCTIONS
   ============================================================ */

export function isValidEntityType(type: string): type is EntityType {
  return SUPPORTED_ENTITY_TYPES.includes(type as EntityType);
}

export function isValidJurisdiction(code: string): boolean {
  return SUPPORTED_JURISDICTIONS.includes(code as typeof SUPPORTED_JURISDICTIONS[number]);
}

export function getJurisdictionLabel(code: string): string {
  return JURISDICTION_LABELS[code] || code;
}

export function getEntityTypeLabel(type: EntityType): string {
  return ENTITY_TYPE_LABELS[type] || type;
}

export function generateSpvName(verticalId: string, poolId: string): string {
  const prefix = verticalId.split("vin")[0].toUpperCase();
  return `${prefix} SPV #${poolId}`;
}

export function parseDocuments(raw: string | null): SpvDocument[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ============================================================
   CRUD
   ============================================================ */

/**
 * Create an SPV entity for a pool.
 */
export async function createSpvEntity(
  input: SpvEntityInput
): Promise<{ success: boolean; spv?: { id: number; name: string }; error?: string }> {
  // Validate pool exists
  const pool = await prisma.pool.findUnique({
    where: { id: input.poolId },
    select: { poolId: true, name: true, verticalId: true, status: true, spv: true },
  });

  if (!pool) {
    return { success: false, error: "Pool not found" };
  }

  // Prevent duplicate SPV per pool
  if (pool.spv) {
    return {
      success: false,
      error: `Pool already has SPV #${pool.spv.id}. Use update instead.`,
    };
  }

  // Validate entity type
  if (!isValidEntityType(input.entityType)) {
    return {
      success: false,
      error: `Invalid entity type. Allowed: ${SUPPORTED_ENTITY_TYPES.join(", ")}`,
    };
  }

  // Validate jurisdiction
  if (!isValidJurisdiction(input.jurisdiction)) {
    return {
      success: false,
      error: `Jurisdiction not supported. Allowed: ${SUPPORTED_JURISDICTIONS.join(", ")}`,
    };
  }

  const name = input.name?.trim() || generateSpvName(pool.verticalId, pool.poolId);

  const spv = await prisma.spvEntity.create({
    data: {
      poolId: input.poolId,
      name,
      entityType: input.entityType,
      jurisdiction: input.jurisdiction,
      registrationNumber: input.registrationNumber || null,
      registrationDate: input.registrationDate || null,
      registeredAddress: input.registeredAddress || null,
      beneficialOwners: input.beneficialOwners ? JSON.stringify(input.beneficialOwners) : null,
      notes: input.notes || null,
    },
  });

  // Link SPV to pool
  await prisma.pool.update({
    where: { id: input.poolId },
    data: { spvId: spv.id },
  });

  await prisma.auditEntry.create({
    data: {
      type: "spv_created",
      description: `SPV "${spv.name}" (${getEntityTypeLabel(input.entityType)}) registered in ${getJurisdictionLabel(input.jurisdiction)} for pool ${pool.name}`,
      txHash: `SPV-CREATE-${spv.id}-${Date.now()}`,
      poolId: input.poolId,
    },
  });

  return { success: true, spv: { id: spv.id, name: spv.name } };
}

/**
 * Get SPV by pool ID.
 */
export async function getSpvByPool(poolId: number): Promise<{
  id: number;
  name: string;
  entityType: EntityType;
  entityTypeLabel: string;
  jurisdiction: string;
  jurisdictionLabel: string;
  registrationNumber: string | null;
  registrationDate: Date | null;
  registeredAddress: string | null;
  beneficialOwners: Array<{ name: string; ownershipPct: number; nationality: string }>;
  documents: SpvDocument[];
  documentCount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const spv = await prisma.spvEntity.findFirst({
    where: { poolId },
  });

  if (!spv) return null;

  const docs = parseDocuments(spv.documentUrls);
  let owners: Array<{ name: string; ownershipPct: number; nationality: string }> = [];
  try {
    if (spv.beneficialOwners) owners = JSON.parse(spv.beneficialOwners);
  } catch { /* ignore */ }

  return {
    id: spv.id,
    name: spv.name,
    entityType: spv.entityType as EntityType,
    entityTypeLabel: getEntityTypeLabel(spv.entityType as EntityType),
    jurisdiction: spv.jurisdiction,
    jurisdictionLabel: getJurisdictionLabel(spv.jurisdiction),
    registrationNumber: spv.registrationNumber,
    registrationDate: spv.registrationDate,
    registeredAddress: spv.registeredAddress,
    beneficialOwners: owners,
    documents: docs,
    documentCount: docs.length,
    notes: spv.notes,
    createdAt: spv.createdAt,
    updatedAt: spv.updatedAt,
  };
}

/**
 * Get SPV by ID.
 */
export async function getSpvById(spvId: number) {
  return getSpvByPool(
    (await prisma.spvEntity.findUnique({ where: { id: spvId }, select: { poolId: true } }))?.poolId || 0
  );
}

/**
 * Update SPV registration details.
 */
export async function updateSpvRegistration(
  spvId: number,
  updates: SpvRegistrationUpdate
): Promise<{ success: boolean; error?: string }> {
  const spv = await prisma.spvEntity.findUnique({
    where: { id: spvId },
  });

  if (!spv) {
    return { success: false, error: "SPV not found" };
  }

  const data: Prisma.SpvEntityUpdateInput = {};

  if (updates.registrationNumber !== undefined) {
    data.registrationNumber = updates.registrationNumber || null;
  }
  if (updates.registrationDate !== undefined) {
    data.registrationDate = updates.registrationDate || null;
  }
  if (updates.registeredAddress !== undefined) {
    data.registeredAddress = updates.registeredAddress || null;
  }
  if (updates.beneficialOwners !== undefined) {
    data.beneficialOwners = updates.beneficialOwners ? JSON.stringify(updates.beneficialOwners) : null;
  }
  if (updates.notes !== undefined) {
    data.notes = updates.notes || null;
  }

  await prisma.spvEntity.update({
    where: { id: spvId },
    data,
  });

  await prisma.auditEntry.create({
    data: {
      type: "spv_updated",
      description: `SPV #${spvId} registration updated.`,
      txHash: `SPV-UPDATE-${spvId}-${Date.now()}`,
      poolId: spv.poolId,
    },
  });

  return { success: true };
}

/**
 * Link legal documents to an SPV.
 */
export async function linkDocuments(
  spvId: number,
  documents: SpvDocument[]
): Promise<{ success: boolean; addedCount: number; error?: string }> {
  const spv = await prisma.spvEntity.findUnique({
    where: { id: spvId },
  });

  if (!spv) {
    return { success: false, addedCount: 0, error: "SPV not found" };
  }

  // Validate URLs
  const invalid = documents.filter((d) => !d.url.startsWith("https://"));
  if (invalid.length > 0) {
    return { success: false, addedCount: 0, error: "All document URLs must be HTTPS" };
  }

  const existing = parseDocuments(spv.documentUrls);
  const merged = [...existing, ...documents];

  await prisma.spvEntity.update({
    where: { id: spvId },
    data: {
      documentUrls: JSON.stringify(merged),
    },
  });

  await prisma.auditEntry.create({
    data: {
      type: "spv_documents_linked",
      description: `${documents.length} document(s) linked to SPV #${spvId}: ${documents.map((d) => d.category).join(", ")}`,
      txHash: `SPV-DOCS-${spvId}-${Date.now()}`,
      poolId: spv.poolId,
    },
  });

  return { success: true, addedCount: documents.length };
}

/* ============================================================
   COMPLIANCE
   ============================================================ */

/**
 * Get compliance status for an SPV.
 */
export async function getSpvComplianceStatus(spvId: number): Promise<ComplianceStatus | null> {
  const spv = await prisma.spvEntity.findUnique({
    where: { id: spvId },
    include: { pool: { select: { id: true, poolId: true } } },
  });

  if (!spv) return null;

  const docs = parseDocuments(spv.documentUrls);
  const hasIncorporationDoc = docs.some((d) => d.category === "incorporation");
  const hasTaxDoc = docs.some((d) => d.category === "tax");
  const hasRegistrationNumber = !!spv.registrationNumber && spv.registrationNumber.length > 3;
  const hasRegisteredAddress = !!spv.registeredAddress && spv.registeredAddress.length > 5;
  const hasBeneficialOwners = !!spv.beneficialOwners;
  const jurisdictionSupported = isValidJurisdiction(spv.jurisdiction);

  const checks = {
    hasIncorporationDoc,
    hasTaxDoc,
    hasRegistrationNumber,
    hasRegisteredAddress,
    hasBeneficialOwners,
    jurisdictionSupported,
  };

  const checkValues = Object.values(checks);
  const passedCount = checkValues.filter(Boolean).length;
  const score = Math.round((passedCount / checkValues.length) * 100);

  const missing: string[] = [];
  if (!hasIncorporationDoc) missing.push("Incorporation document");
  if (!hasTaxDoc) missing.push("Tax registration document");
  if (!hasRegistrationNumber) missing.push("Registration number");
  if (!hasRegisteredAddress) missing.push("Registered address");
  if (!hasBeneficialOwners) missing.push("Beneficial ownership declaration");
  if (!jurisdictionSupported) missing.push("Jurisdiction verification");

  return {
    spvId: spv.id,
    spvName: spv.name,
    poolId: spv.pool?.id || 0,
    compliant: score >= 80,
    checks,
    missing,
    score,
  };
}

/**
 * Get full SPV registry with compliance filtering.
 */
export async function getSpvRegistry(options: {
  jurisdiction?: string;
  entityType?: EntityType;
  compliantOnly?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  spvs: Array<ComplianceStatus & { name: string; entityType: EntityType; jurisdiction: string; createdAt: Date }>;
  total: number;
}> {
  const where: Prisma.SpvEntityWhereInput = {};
  if (options.jurisdiction) where.jurisdiction = options.jurisdiction;
  if (options.entityType) where.entityType = options.entityType;

  const [spvs, total] = await Promise.all([
    prisma.spvEntity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: ((options.page || 1) - 1) * (options.limit || 20),
      take: options.limit || 20,
      include: { pool: { select: { id: true, poolId: true } } },
    }),
    prisma.spvEntity.count({ where }),
  ]);

  const enriched = await Promise.all(
    spvs.map(async (spv) => {
      const compliance = await getSpvComplianceStatus(spv.id);
      return {
        ...(compliance || {
          spvId: spv.id,
          spvName: spv.name,
          poolId: spv.pool?.id || 0,
          compliant: false,
          checks: {
            hasIncorporationDoc: false,
            hasTaxDoc: false,
            hasRegistrationNumber: false,
            hasRegisteredAddress: false,
            hasBeneficialOwners: false,
            jurisdictionSupported: false,
          },
          missing: ["SPV data incomplete"],
          score: 0,
        }),
        name: spv.name,
        entityType: spv.entityType as EntityType,
        jurisdiction: spv.jurisdiction,
        createdAt: spv.createdAt,
      };
    })
  );

  const filtered = options.compliantOnly
    ? enriched.filter((s) => s.compliant)
    : enriched;

  return { spvs: filtered, total: options.compliantOnly ? filtered.length : total };
}

/* ============================================================
   JURISDICTION HELPERS
   ============================================================ */

/**
 * Get all supported jurisdictions with labels.
 */
export function getSupportedJurisdictions(): Array<{ code: string; label: string }> {
  return SUPPORTED_JURISDICTIONS.map((code) => ({
    code,
    label: JURISDICTION_LABELS[code] || code,
  }));
}

/**
 * Get recommended entity type for a jurisdiction.
 */
export function getRecommendedEntityType(jurisdiction: string): EntityType {
  const recs: Record<string, EntityType> = {
    US: "llc",
    UK: "ltd",
    CA: "corporation",
    AU: "ltd",
    KY: "trust",
    VG: "trust",
    SG: "ltd",
    AE: "foundation",
    CH: "foundation",
    DE: "ltd",
    NG: "llc",
    ZA: "ltd",
    GH: "llc",
    KE: "ltd",
    IN: "ltd",
    BR: "ltd",
    MX: "llc",
  };
  return recs[jurisdiction] || "llc";
}