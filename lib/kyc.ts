import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

/* ============================================================
   TYPES
   ============================================================ */
export type KycTier = "visitor" | "sovereign" | "verified" | "whale";

export interface NameMatchResult {
  exact: boolean;
  normalizedMatch: boolean;
  similarity: number; // 0-1
  displayNormalized: string;
  idNormalized: string;
  discrepancy?: string;
}

export interface RiskScoreResult {
  score: number;
  level: "low" | "medium" | "high";
  flags: string[];
  maxAllowedTier: KycTier;
}

export interface TierCheckResult {
  eligible: boolean;
  currentTier: KycTier;
  requestedTier: KycTier;
  recommendedTier: KycTier;
  missing: string[];
  met: string[];
}

export interface WithdrawalCheck {
  allowed: boolean;
  dailyLimit: number;
  requestedAmount: number;
  remainingToday: number;
  reason?: string;
}

export interface KycSubmissionInput {
  userId: number;
  displayName: string;
  idName: string;
  idDocumentUrl: string;
  selfieUrl: string;
  addressDocumentUrl?: string;
  dateOfBirth?: string;
  idNumber?: string;
  country?: string;
  requestedTier?: KycTier;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const TIER_ORDER: KycTier[] = ["visitor", "sovereign", "verified", "whale"];

const TIER_WITHDRAW_LIMITS: Record<KycTier, number> = {
  visitor: 0,
  sovereign: 500,
  verified: 5000,
  whale: Number.MAX_SAFE_INTEGER,
};

const TIER_REQUIREMENTS: Record<
  KycTier,
  { label: string; docs: string[]; livenessMin: number; addressRequired: boolean; nameMatchRequired: boolean }
> = {
  visitor: {
    label: "Visitor",
    docs: [],
    livenessMin: 0,
    addressRequired: false,
    nameMatchRequired: false,
  },
  sovereign: {
    label: "Sovereign",
    docs: ["idDocument", "selfie"],
    livenessMin: 0.5,
    addressRequired: false,
    nameMatchRequired: false,
  },
  verified: {
    label: "Verified",
    docs: ["idDocument", "selfie", "addressDocument"],
    livenessMin: 0.7,
    addressRequired: true,
    nameMatchRequired: false,
  },
  whale: {
    label: "Whale",
    docs: ["idDocument", "selfie", "addressDocument"],
    livenessMin: 0.85,
    addressRequired: true,
    nameMatchRequired: true,
  },
};

/* ============================================================
   PURE FUNCTIONS
   ============================================================ */

/**
 * Normalize a name for comparison.
 * Removes special chars, extra spaces, lowercases.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate string similarity (Levenshtein-based ratio).
 * Returns 0-1 where 1 is identical.
 */
export function nameSimilarity(a: string, b: string): number {
  const s1 = normalizeName(a);
  const s2 = normalizeName(b);

  if (s1 === s2) return 1.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if display name matches government ID name.
 */
export function checkNameMatch(displayName: string, idName: string): NameMatchResult {
  const displayNormalized = normalizeName(displayName);
  const idNormalized = normalizeName(idName);
  const similarity = nameSimilarity(displayName, idName);
  const exact = displayName.trim() === idName.trim();
  const normalizedMatch = displayNormalized === idNormalized;

  let discrepancy: string | undefined;
  if (!normalizedMatch) {
    if (similarity >= 0.8) {
      discrepancy = "Minor variation detected (initials, spacing, or diacritics)";
    } else if (similarity >= 0.5) {
      discrepancy = "Significant name variation — manual review required";
    } else {
      discrepancy = "Name mismatch — possible identity fraud";
    }
  }

  return {
    exact,
    normalizedMatch,
    similarity: Number(similarity.toFixed(4)),
    displayNormalized,
    idNormalized,
    discrepancy,
  };
}

/**
 * Calculate risk score (0-100).
 */
export function calculateRiskScore(params: {
  hasIdDocument: boolean;
  hasSelfie: boolean;
  hasAddressDocument: boolean;
  livenessScore: number | null;
  addressVerified: boolean;
  nameMatch: NameMatchResult | null;
  previousRejections: number;
  country?: string | null;
}): RiskScoreResult {
  let score = 0;
  const flags: string[] = [];

  // Document completeness (0-30)
  if (!params.hasIdDocument) {
    score += 20;
    flags.push("missing_id_document");
  }
  if (!params.hasSelfie) {
    score += 20;
    flags.push("missing_selfie");
  }
  if (!params.hasAddressDocument) {
    score += 10;
    flags.push("missing_address_document");
  }

  // Name match (0-25)
  if (params.nameMatch) {
    if (!params.nameMatch.normalizedMatch) {
      if (params.nameMatch.similarity < 0.5) {
        score += 25;
        flags.push("severe_name_mismatch");
      } else if (params.nameMatch.similarity < 0.8) {
        score += 15;
        flags.push("moderate_name_mismatch");
      } else {
        score += 5;
        flags.push("minor_name_variation");
      }
    }
  } else {
    score += 20;
    flags.push("name_not_provided");
  }

  // Liveness (0-15)
  const liveness = params.livenessScore ?? 0;
  if (liveness < 0.5) {
    score += 15;
    flags.push("liveness_failed");
  } else if (liveness < 0.7) {
    score += 10;
    flags.push("low_liveness_score");
  } else if (liveness < 0.85) {
    score += 5;
    flags.push("moderate_liveness_score");
  }

  // Address (0-10)
  if (params.addressVerified === false) {
    score += 10;
    flags.push("address_unverified");
  }

  // History (0-15)
  if (params.previousRejections >= 3) {
    score += 15;
    flags.push("multiple_rejections");
  } else if (params.previousRejections === 2) {
    score += 10;
    flags.push("two_rejections");
  } else if (params.previousRejections === 1) {
    score += 5;
    flags.push("one_rejection");
  }

  // High-risk countries (0-5)
  const highRiskCountries = ["XX"]; // extend as needed
  if (params.country && highRiskCountries.includes(params.country.toUpperCase())) {
    score += 5;
    flags.push("high_risk_jurisdiction");
  }

  const finalScore = Math.min(100, score);
  const level = finalScore >= 70 ? "high" : finalScore >= 40 ? "medium" : "low";
  const maxAllowedTier: KycTier =
    finalScore >= 70 ? "visitor" : finalScore >= 40 ? "sovereign" : "whale";

  return { score: finalScore, level, flags, maxAllowedTier };
}

/**
 * Validate a document URL.
 */
export function validateDocument(url: string, type: "image" | "pdf" = "image"): { valid: boolean; error?: string } {
  if (!url.startsWith("https://")) {
    return { valid: false, error: "Document URL must be HTTPS" };
  }

  const allowedImageExts = [".jpg", ".jpeg", ".png", ".webp"];
  const allowedPdfExts = [".pdf"];

  const lower = url.toLowerCase();
  const exts = type === "pdf" ? allowedPdfExts : allowedImageExts;

  if (!exts.some((ext) => lower.endsWith(ext))) {
    return { valid: false, error: `Invalid file type. Allowed: ${exts.join(", ")}` };
  }

  return { valid: true };
}

/**
 * Get requirement checklist for a tier.
 */
export function getTierRequirements(tier: KycTier): TierCheckResult["met"] {
  const req = TIER_REQUIREMENTS[tier];
  const checklist: string[] = [];

  req.docs.forEach((d) => checklist.push(`Upload ${d}`));
  if (req.livenessMin > 0) checklist.push(`Liveness score ≥ ${req.livenessMin}`);
  if (req.addressRequired) checklist.push("Address verification");
  if (req.nameMatchRequired) checklist.push("Name match with government ID");

  return checklist;
}

/* ============================================================
   BUSINESS LOGIC
   ============================================================ */

/**
 * Check if user can upgrade to a requested tier.
 */
export async function validateTierUpgrade(
  userId: number,
  requestedTier: KycTier
): Promise<TierCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  const currentTier = (user?.tier as KycTier) || "visitor";

  // Cannot skip tiers
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const requestedIndex = TIER_ORDER.indexOf(requestedTier);

  if (requestedIndex <= currentIndex) {
    return {
      eligible: true,
      currentTier,
      requestedTier,
      recommendedTier: currentTier,
      missing: [],
      met: ["Already at or above requested tier"],
    };
  }

  // Get latest KYC record
  const kyc = await prisma.kycRecord.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const req = TIER_REQUIREMENTS[requestedTier];
  const missing: string[] = [];
  const met: string[] = [];

  // Check documents
  for (const doc of req.docs) {
    const hasDoc =
      doc === "idDocument"
        ? !!kyc?.idDocumentUrl
        : doc === "selfie"
        ? !!kyc?.selfieUrl
        : doc === "addressDocument"
        ? !!kyc?.addressDocumentUrl
        : false;

    if (hasDoc) met.push(`${doc} uploaded`);
    else missing.push(`Upload ${doc}`);
  }

  // Check liveness
  const liveness = kyc?.livenessScore ?? 0;
  if (liveness >= req.livenessMin) met.push(`Liveness score ${liveness.toFixed(2)} ≥ ${req.livenessMin}`);
  else missing.push(`Liveness score ${liveness.toFixed(2)} < ${req.livenessMin}`);

  // Check address
  if (req.addressRequired) {
    if (kyc?.addressVerified) met.push("Address verified");
    else missing.push("Address verification required");
  }

  // Check name match
  if (req.nameMatchRequired && kyc?.idName) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });
    const match = checkNameMatch(user?.displayName || "", kyc.idName);
    if (match.normalizedMatch) met.push("Name matches government ID");
    else missing.push(`Name mismatch: ${match.discrepancy || "does not match ID"}`);
  }

  // Determine recommended tier based on what they actually have
  let recommendedTier: KycTier = "visitor";
  for (const tier of TIER_ORDER) {
    const tReq = TIER_REQUIREMENTS[tier];
    const hasAllDocs = tReq.docs.every((d) => {
      if (d === "idDocument") return !!kyc?.idDocumentUrl;
      if (d === "selfie") return !!kyc?.selfieUrl;
      if (d === "addressDocument") return !!kyc?.addressDocumentUrl;
      return false;
    });
    const livenessOk = (kyc?.livenessScore ?? 0) >= tReq.livenessMin;
    const addressOk = !tReq.addressRequired || !!kyc?.addressVerified;
    const nameOk = !tReq.nameMatchRequired || (kyc?.idName ? checkNameMatch("", kyc.idName).normalizedMatch : false);

    if (hasAllDocs && livenessOk && addressOk && nameOk) {
      recommendedTier = tier;
    }
  }

  return {
    eligible: missing.length === 0,
    currentTier,
    requestedTier,
    recommendedTier,
    missing,
    met,
  };
}

/**
 * Check if a withdrawal is allowed for user's tier.
 */
export async function canWithdraw(
  userId: number,
  amount: number,
  todayWithdrawn?: number
): Promise<WithdrawalCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, displayName: true },
  });

  const tier = (user?.tier as KycTier) || "visitor";
  const dailyLimit = TIER_WITHDRAW_LIMITS[tier];

  if (tier === "visitor") {
    return {
      allowed: false,
      dailyLimit: 0,
      requestedAmount: amount,
      remainingToday: 0,
      reason: "Visitor tier cannot withdraw. Complete KYC to upgrade.",
    };
  }

  // Get today's withdrawals if not provided
  let withdrawn = todayWithdrawn ?? 0;
  if (todayWithdrawn === undefined) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const agg = await prisma.walletTransaction.aggregate({
      where: {
        userId,
        type: "withdrawal",
        status: "completed",
        createdAt: { gte: startOfDay },
      },
      _sum: { amount: true },
    });
    withdrawn = Number(agg._sum.amount || 0);
  }

  const remainingToday = Math.max(0, dailyLimit - withdrawn);
  const allowed = amount > 0 && amount <= remainingToday;

  return {
    allowed,
    dailyLimit,
    requestedAmount: amount,
    remainingToday: Number(remainingToday.toFixed(2)),
    reason: allowed
      ? undefined
      : `Daily limit $${dailyLimit} exceeded. Remaining: $${remainingToday.toFixed(2)}.`,
  };
}

/**
 * Process a new KYC submission.
 */
export async function processKycSubmission(
  input: KycSubmissionInput
): Promise<{ success: boolean; recordId?: number; risk?: RiskScoreResult; error?: string }> {
  // Validate documents
  const idCheck = validateDocument(input.idDocumentUrl, "image");
  if (!idCheck.valid) return { success: false, error: `ID document: ${idCheck.error}` };

  const selfieCheck = validateDocument(input.selfieUrl, "image");
  if (!selfieCheck.valid) return { success: false, error: `Selfie: ${selfieCheck.error}` };

  if (input.addressDocumentUrl) {
    const addrCheck = validateDocument(input.addressDocumentUrl, "image");
    if (!addrCheck.valid) return { success: false, error: `Address proof: ${addrCheck.error}` };
  }

  // Name match
  const nameMatch = checkNameMatch(input.displayName, input.idName);

  // Calculate risk
  const existingKyc = await prisma.kycRecord.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
    select: { previousRejections: true },
  });

  const risk = calculateRiskScore({
    hasIdDocument: true,
    hasSelfie: true,
    hasAddressDocument: !!input.addressDocumentUrl,
    livenessScore: null, // set after upload processing
    addressVerified: false, // set after verification
    nameMatch,
    previousRejections: existingKyc?.previousRejections || 0,
    country: input.country,
  });

  // Determine recommended tier
  const reqCheck = await validateTierUpgrade(input.userId, input.requestedTier || "sovereign");

  const record = await prisma.kycRecord.create({
    data: {
      userId: input.userId,
      idName: input.idName.trim(),
      idDocumentUrl: input.idDocumentUrl,
      selfieUrl: input.selfieUrl,
      addressDocumentUrl: input.addressDocumentUrl || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      idNumber: input.idNumber || null,
      country: input.country || null,
      requestedTier: input.requestedTier || "sovereign",
      status: "pending",
      previousRejections: existingKyc?.previousRejections || 0,
    },
  });

  return {
    success: true,
    recordId: record.id,
    risk,
  };
}

/**
 * Get user's current KYC status summary.
 */
export async function getKycStatus(userId: number): Promise<{
  tier: KycTier;
  kycStatus: string;
  canWithdraw: boolean;
  dailyLimit: number;
  nextTier: KycTier | null;
  requirementsForNext: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  const currentTier = (user?.tier as KycTier) || "visitor";
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const nextTier = currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;

  const latestKyc = await prisma.kycRecord.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  return {
    tier: currentTier,
    kycStatus: latestKyc?.status || "none",
    canWithdraw: currentTier !== "visitor",
    dailyLimit: TIER_WITHDRAW_LIMITS[currentTier],
    nextTier,
    requirementsForNext: nextTier ? getTierRequirements(nextTier) : [],
  };
}