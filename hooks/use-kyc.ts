"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Sovereign Identity Verification (SIV)
   ============================================================ */

export type KycTier = "visitor" | "sovereign" | "verified" | "whale";

export interface KycRecord {
  id: string;
  userId: string;
  ledgerId: string;
  // Identity Documents
  idType: "passport" | "drivers_license" | "national_id" | null;
  idNumber: string | null;
  idImageUrl: string | null;
  idVerified: boolean;
  // Biometric
  selfieUrl: string | null;
  selfieMatchScore: number | null;
  selfieVerified: boolean;
  livenessVideoUrl: string | null;
  livenessPassed: boolean;
  // Address
  addressProofUrl: string | null;
  addressVerified: boolean;
  // Legal Identity
  legalName: string | null;
  dateOfBirth: string | null;
  address: string | null;
  // Tier & Review
  tier: KycTier;
  status: "pending" | "approved" | "rejected" | "needs_review";
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface KycStatus {
  record: KycRecord | null;
  kycTier: KycTier;
  kycStatus: string;
  isVerified: boolean;
  canWithdraw: boolean;
  withdrawalLimit: number;
  delayHours: number;
  requiresTOTP: boolean;
}

export interface TierRequirement {
  tier: KycTier;
  label: string;
  description: string;
  dailyWithdraw: number;
  instantLimit: number;
  delayHours: number;
  requiresTOTP: boolean;
  requiresNameMatch: boolean;
  requirements: {
    idDocument: boolean;
    selfie: boolean;
    addressProof: boolean;
    liveness: boolean;
    legalName: boolean;
  };
  met: boolean;
  locked: boolean;
}

export interface UploadResult {
  success: boolean;
  documentType: "id" | "selfie" | "address" | "liveness";
  url?: string;
  error?: string;
}

/* ============================================================
   FETCHER
   ============================================================ */
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json;
};

/* ============================================================
   CONFIG
   ============================================================ */
const SWR_CONFIG = {
  revalidateOnFocus: true,
  dedupingInterval: 10000,
};

const POLLING_CONFIG = {
  revalidateOnFocus: true,
  refreshInterval: 15000,
  dedupingInterval: 5000,
};

/* ============================================================
   TIER CONFIGURATION — 8th Ledger Sovereign Tiers
   ============================================================ */
const TIER_CONFIG: Record<KycTier, Omit<TierRequirement, "requirements" | "met" | "locked">> = {
  visitor: {
    tier: "visitor",
    label: "Visitor",
    description: "Browse only. No withdrawals.",
    dailyWithdraw: 0,
    instantLimit: 0,
    delayHours: 0,
    requiresTOTP: false,
    requiresNameMatch: false,
  },
  sovereign: {
    tier: "sovereign",
    label: "Sovereign",
    description: "Basic identity. $500 instant withdrawals.",
    dailyWithdraw: 500,
    instantLimit: 500,
    delayHours: 0,
    requiresTOTP: false,
    requiresNameMatch: false,
  },
  verified: {
    tier: "verified",
    label: "Verified",
    description: "Full verification. $5,000 with 24h delay.",
    dailyWithdraw: 5000,
    instantLimit: 0,
    delayHours: 24,
    requiresTOTP: true,
    requiresNameMatch: true,
  },
  whale: {
    tier: "whale",
    label: "Whale",
    description: "Unlimited. 72h delay for large transfers.",
    dailyWithdraw: Number.MAX_SAFE_INTEGER,
    instantLimit: 0,
    delayHours: 72,
    requiresTOTP: true,
    requiresNameMatch: true,
  },
};

/* ============================================================
   HELPERS
   ============================================================ */

function enrichKycRecord(raw: Record<string, unknown>): KycRecord {
  return {
    id: String(raw.id),
    userId: String(raw.userId || raw.user_id),
    ledgerId: String(
      raw.ledgerId || raw.ledger_id || raw.t8ledgerId || raw.t8ledger_id || "",
    ),
    idType: (raw.idType || raw.id_type || null) as KycRecord["idType"],
    idNumber: (raw.idNumber || raw.id_number || null) as string | null,
    idImageUrl: (raw.idImageUrl || raw.id_image_url || null) as string | null,
    idVerified: Boolean(raw.idVerified || raw.id_verified || false),
    selfieUrl: (raw.selfieUrl || raw.selfie_url || null) as string | null,
    selfieMatchScore: (raw.selfieMatchScore || raw.selfie_match_score) as
      | number
      | null,
    selfieVerified: Boolean(raw.selfieVerified || raw.selfie_verified || false),
    livenessVideoUrl: (raw.livenessVideoUrl ||
      raw.liveness_video_url ||
      null) as string | null,
    livenessPassed: Boolean(raw.livenessPassed || raw.liveness_passed || false),
    addressProofUrl: (raw.addressProofUrl || raw.address_proof_url || null) as
      | string
      | null,
    addressVerified: Boolean(
      raw.addressVerified || raw.address_verified || false,
    ),
    legalName: (raw.legalName || raw.legal_name || null) as string | null,
    dateOfBirth: (raw.dateOfBirth || raw.date_of_birth || null) as
      | string
      | null,
    address: (raw.address || null) as string | null,
    tier: String(raw.tier || "visitor") as KycTier,
    status: String(raw.status || "pending") as KycRecord["status"],
    reviewedBy: (raw.reviewedBy || raw.reviewed_by || null) as string | null,
    reviewedAt: (raw.reviewedAt || raw.reviewed_at || null) as string | null,
    rejectionReason: (raw.rejectionReason || raw.rejection_reason || null) as
      | string
      | null,
    createdAt: String(
      raw.createdAt || raw.created_at || new Date().toISOString(),
    ),
    updatedAt: String(
      raw.updatedAt || raw.updated_at || new Date().toISOString(),
    ),
  };
}

function enrichKycStatus(raw: Record<string, unknown>): KycStatus {
  const recordRaw = raw.record as Record<string, unknown> | undefined;
  return {
    record: recordRaw ? enrichKycRecord(recordRaw) : null,
    kycTier: String(raw.kycTier || raw.kyc_tier || "visitor") as KycTier,
    kycStatus: String(raw.kycStatus || raw.kyc_status || "unverified"),
    isVerified: Boolean(raw.isVerified || raw.is_verified || false),
    canWithdraw: Boolean(raw.canWithdraw || raw.can_withdraw || false),
    withdrawalLimit: Number(raw.withdrawalLimit || raw.withdrawal_limit || 0),
    delayHours: Number(raw.delayHours || raw.delay_hours || 0),
    requiresTOTP: Boolean(raw.requiresTOTP || raw.requires_totp || false),
  };
}

/* ============================================================
   HOOK: useKyc — Current user's SIV status
   ============================================================ */
export function useKyc() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "/api/kyc",
    fetcher,
    SWR_CONFIG
  );

  const status = useMemo(() => {
    if (!data) return undefined;
    return enrichKycStatus(data as Record<string, unknown>);
  }, [data]);

  const isPending = status?.record?.status === "pending" || status?.record?.status === "needs_review";

  // Poll more frequently while under review
  useSWR(
    isPending ? "/api/kyc" : null,
    fetcher,
    POLLING_CONFIG
  );

  return {
    status,
    record: status?.record || null,
    kycTier: status?.kycTier || "visitor",
    kycStatus: status?.kycStatus || "unverified",
    isPending,
    isApproved: status?.record?.status === "approved",
    isRejected: status?.record?.status === "rejected",
    isVerified: status?.isVerified || false,
    canWithdraw: status?.canWithdraw || false,
    withdrawalLimit: status?.withdrawalLimit || 0,
    delayHours: status?.delayHours || 0,
    requiresTOTP: status?.requiresTOTP || false,
    isLoading,
    isValidating,
    isError: !!error,
    error: error?.message || null,
    mutate,
    refresh: mutate,
  };
}

/* ============================================================
   HOOK: useTierProgress — Tier ladder with requirement checks
   ============================================================ */
export function useTierProgress() {
  const { record, kycTier } = useKyc();

  const tiers: TierRequirement[] = useMemo(() => {
    const tierOrder: KycTier[] = ["visitor", "sovereign", "verified", "whale"];

    return tierOrder.map((tier, index) => {
      const config = TIER_CONFIG[tier];

      // Check which requirements are met based on record data
      const requirements = {
        idDocument: !!record?.idImageUrl && record.idVerified,
        selfie: !!record?.selfieUrl && record.selfieVerified,
        addressProof: !!record?.addressProofUrl && record.addressVerified,
        liveness: record?.livenessPassed || false,
        legalName: !!record?.legalName && record.status === "approved",
      };

      // Determine if tier is locked (more than 1 step above current)
      const currentIndex = tierOrder.indexOf(kycTier);
      const locked = index > currentIndex + 1;

      // Determine if tier requirements are met
      let met = false;
      if (tier === "visitor") met = true;
      if (tier === "sovereign") met = requirements.idDocument && requirements.selfie;
      if (tier === "verified") {
        met = requirements.idDocument && requirements.selfie && requirements.addressProof && requirements.liveness;
      }
      if (tier === "whale") {
        met = requirements.idDocument && requirements.selfie && requirements.addressProof && requirements.liveness && requirements.legalName;
      }

      return {
        ...config,
        requirements,
        met,
        locked,
      };
    });
  }, [record, kycTier]);

  const currentTierIndex = tiers.findIndex((t) => t.tier === kycTier);
  const nextTier = tiers[currentTierIndex + 1] || null;

  const missingForNext = useMemo(() => {
    if (!nextTier || nextTier.locked) return [];
    return Object.entries(nextTier.requirements)
      .filter(([, met]) => !met)
      .map(([key]) => key);
  }, [nextTier]);

  const progressPercent = useMemo(() => {
    if (!nextTier) return 100;
    const total = Object.keys(nextTier.requirements).length;
    const met = Object.values(nextTier.requirements).filter(Boolean).length;
    return Math.round((met / total) * 100);
  }, [nextTier]);

  return {
    tiers,
    currentTier: kycTier,
    nextTier,
    missingForNext,
    canUpgrade: nextTier?.met && !nextTier?.locked,
    progressPercent,
  };
}

/* ============================================================
   HOOK: useKycUpload — Document & identity upload actions
   ============================================================ */
export function useKycUpload() {
  const { mutate: mutateKyc } = useSWR("/api/kyc");

  /* ===== UPLOAD DOCUMENT (ID / Selfie / Address) ===== */
  const uploadDocument = useCallback(
    async (
      file: File,
      documentType: "id" | "selfie" | "address"
    ): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      try {
        const res = await fetch("/api/kyc", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            documentType,
            error: json.error || "Upload failed",
          };
        }

        await mutateKyc();
        return {
          success: true,
          documentType,
          url: json.url as string | undefined,
        };
      } catch (err) {
        return {
          success: false,
          documentType,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateKyc]
  );

  /* ===== UPDATE PROFILE DATA (legal name, address, DOB, id type/number) ===== */
  const updateProfile = useCallback(
    async (data: {
      legalName?: string;
      address?: string;
      dateOfBirth?: string;
      idType?: string;
      idNumber?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/kyc", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Update failed" };
        }

        await mutateKyc();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateKyc]
  );

  /* ===== LIVENESS VERIFICATION ===== */
  const verifyLiveness = useCallback(
    async (videoBlob: Blob): Promise<{ success: boolean; score?: number; error?: string }> => {
      const formData = new FormData();
      formData.append("video", videoBlob, "liveness.webm");

      try {
        const res = await fetch("/api/kyc/verify", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Liveness verification failed" };
        }

        await mutateKyc();
        return {
          success: true,
          score: json.score as number | undefined,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateKyc]
  );

  /* ===== BATCH UPLOAD ALL DOCUMENTS ===== */
  const uploadBatch = useCallback(
    async (files: {
      id?: File;
      selfie?: File;
      address?: File;
    }): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];

      if (files.id) {
        results.push(await uploadDocument(files.id, "id"));
      }
      if (files.selfie) {
        results.push(await uploadDocument(files.selfie, "selfie"));
      }
      if (files.address) {
        results.push(await uploadDocument(files.address, "address"));
      }

      return results;
    },
    [uploadDocument]
  );

  /* ===== SUBMIT FOR REVIEW ===== */
  const submitForReview = useCallback(
    async (requestedTier: KycTier = "sovereign"): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/kyc", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ requestedTier, action: "submit" }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Submission failed" };
        }

        await mutateKyc();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateKyc]
  );

  return {
    uploadDocument,
    uploadBatch,
    updateProfile,
    verifyLiveness,
    submitForReview,
  };
}

/* ============================================================
   HOOK: useKycAdminQueue — Admin review queue (read-only)
   ============================================================ */
export function useKycAdminQueue(
  status: "pending" | "approved" | "rejected" | "needs_review" | "all" = "pending",
  page: number = 1,
  limit: number = 20
) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/kyc?status=${status}&page=${page}&limit=${limit}`,
    fetcher,
    SWR_CONFIG
  );

  const records = useMemo(() => {
    if (!data?.records) return [];
    return (data.records as Record<string, unknown>[]).map(enrichKycRecord);
  }, [data]);

  return {
    records,
    stats: data?.stats as
      | {
          pending: number;
          approved: number;
          rejected: number;
          needs_review: number;
          total: number;
        }
      | undefined,
    meta: data?.meta,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  };
}

/* ============================================================
   HOOK: useKycAdminActions — Admin review mutations
   ============================================================ */
export function useKycAdminActions() {
  const { mutate: mutateQueue } = useSWR("/api/admin/kyc");

  /* ===== APPROVE KYC ===== */
  const approve = useCallback(
    async (
      userId: string,
      tier: KycTier,
      notes?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/admin/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "verify-kyc",
            userId,
            tier,
            notes,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Approval failed" };
        }

        await mutateQueue();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateQueue]
  );

  /* ===== REJECT KYC ===== */
  const reject = useCallback(
    async (
      userId: string,
      reason: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/admin/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "unverify-kyc",
            userId,
            reason,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Rejection failed" };
        }

        await mutateQueue();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateQueue]
  );

  /* ===== PROMOTE/DEMOTE TIER ===== */
  const setTier = useCallback(
    async (
      userId: string,
      tier: KycTier
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/admin/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: tier === "visitor" ? "unverify-kyc" : "verify-kyc",
            userId,
            tier,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Tier change failed" };
        }

        await mutateQueue();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [mutateQueue]
  );

  return {
    approve,
    reject,
    setTier,
  };
}