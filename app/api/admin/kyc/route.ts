import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { KycStatus, KycTier, Prisma } from "@prisma/client";

/* ============================================================
   TIER DEFINITIONS
   ============================================================ */
const TIERS = ["visitor", "sovereign", "verified", "whale"] as const;
type Tier = (typeof TIERS)[number];
const STATUSES = ["unverified", "pending", "approved", "rejected"] as const;
type Status = (typeof STATUSES)[number];

const TIER_LIMITS: Record<Tier, { dailyWithdraw: number; label: string }> = {
  visitor: { dailyWithdraw: 0, label: "Visitor" },
  sovereign: { dailyWithdraw: 500, label: "Sovereign" },
  verified: { dailyWithdraw: 5000, label: "Verified" },
  whale: { dailyWithdraw: Number.MAX_SAFE_INTEGER, label: "Whale" },
};

function decisionStatus(decision: "approve" | "reject"): KycStatus {
  return decision === "approve" ? "approved" : "rejected";
}

/* ============================================================
   HELPERS
   ============================================================ */
function handlePrismaError(error: any): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }
  }
  console.error("[ADMIN_KYC ERROR]", error);
  return NextResponse.json(
    { success: false, error: "KYC operation failed" },
    { status: 500 }
  );
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateRiskScore(record: {
  idImageUrl: string | null;
  selfieUrl: string | null;
  addressProofUrl: string | null;
  legalName: string | null;
  userDisplayName: string;
  selfieMatchScore: number | null;
  addressVerified: boolean;
}): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  // Document completeness (0-25)
  if (!record.idImageUrl) {
    score += 25;
    flags.push("missing_id_document");
  }
  if (!record.selfieUrl) {
    score += 25;
    flags.push("missing_selfie");
  }
  if (!record.addressProofUrl) {
    score += 15;
    flags.push("missing_address_proof");
  }

  // Name match (0-30)
  if (record.legalName && record.userDisplayName) {
    const idNorm = normalizeName(record.legalName);
    const displayNorm = normalizeName(record.userDisplayName);
    if (idNorm !== displayNorm) {
      score += 30;
      flags.push("name_mismatch");
    }
  } else {
    score += 30;
    flags.push("name_unavailable");
  }

  // Selfie / Liveness (0-15)
  const liveness = record.selfieMatchScore ?? 0;
  if (liveness < 0.7) {
    score += 15;
    flags.push("low_selfie_match_score");
  } else if (liveness < 0.9) {
    score += 5;
    flags.push("moderate_selfie_match_score");
  }

  // Address verification (0-10)
  if (!record.addressVerified) {
    score += 10;
    flags.push("address_unverified");
  }

  return { score: Math.min(100, score), flags };
}

function determineTierFromKyc(record: {
  idImageUrl: string | null;
  selfieUrl: string | null;
  addressProofUrl: string | null;
  addressVerified: boolean;
  selfieMatchScore: number | null;
}): Tier {
  if (
    record.idImageUrl &&
    record.selfieUrl &&
    record.addressProofUrl &&
    record.addressVerified &&
    (record.selfieMatchScore ?? 0) >= 0.85
  ) {
    return "verified";
  }
  if (record.idImageUrl && record.selfieUrl) {
    return "sovereign";
  }
  return "visitor";
}

/* ============================================================
   GET /api/admin/kyc — Primary Admin review queue
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const tier = searchParams.get("tier");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Prisma.KycRecordWhereInput = {};
    if (status !== "all" && STATUSES.includes(status as Status)) where.status = status as KycStatus;
    if (tier && TIERS.includes(tier as Tier)) where.tier = tier as KycTier;

    if (search) {
      where.OR = [
        { user: { displayName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { ledgerId: { contains: search, mode: "insensitive" } } },
        { legalName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.kycRecord.findMany({
        where,
        orderBy: { createdAt: "asc" }, // oldest first (FIFO)
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              ledgerId: true,
              displayName: true,
              email: true,
              avatar: true,
              kycTier: true,
              country: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.kycRecord.count({ where }),
    ]);

    // Fetch reviewer names for enriched display
    const reviewerIds = records
      .map((r) => r.reviewedBy)
      .filter((id): id is string => !!id);
    const reviewers =
      reviewerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: reviewerIds } },
            select: { id: true, ledgerId: true, displayName: true },
          })
        : [];
    const reviewerMap = new Map(reviewers.map((u) => [u.id, u]));

    const enriched = records.map((r) => {
      const risk = calculateRiskScore({
        idImageUrl: r.idImageUrl,
        selfieUrl: r.selfieUrl,
        addressProofUrl: r.addressProofUrl,
        legalName: r.legalName,
        userDisplayName: r.user?.displayName || "",
        selfieMatchScore: r.selfieMatchScore,
        addressVerified: r.addressVerified,
      });

      const nameMatch =
        r.legalName && r.user?.displayName
          ? normalizeName(r.legalName) === normalizeName(r.user.displayName)
          : null;

      const reviewer = r.reviewedBy ? reviewerMap.get(r.reviewedBy) : null;

      return {
        id: r.id,
        status: r.status,
        submittedAt: r.createdAt,
        reviewedAt: r.reviewedAt,
        reviewer: reviewer
          ? {
              ledgerId: reviewer.ledgerId,
              displayName: reviewer.displayName,
            }
          : null,

        user: r.user,

        comparison: {
          idImageUrl: r.idImageUrl,
          selfieUrl: r.selfieUrl,
          addressProofUrl: r.addressProofUrl,
          legalName: r.legalName,
          displayName: r.user?.displayName,
          nameMatch,
          nameMatchExact: r.legalName === r.user?.displayName,
        },

        risk: {
          score: risk.score,
          level: risk.score >= 70 ? "high" : risk.score >= 40 ? "medium" : "low",
          flags: risk.flags,
        },

        documents: {
          idVerified: !!r.idImageUrl,
          selfieVerified: !!r.selfieUrl,
          addressVerified: r.addressVerified,
          selfieMatchScore: r.selfieMatchScore,
          livenessPassed: r.livenessPassed,
        },

        tier: {
          current: r.user?.kycTier,
          recordTier: r.tier,
          recommended: determineTierFromKyc(r),
        },

        metadata: {
          idNumber: r.idNumber ? `${r.idNumber.slice(0, 4)}****${r.idNumber.slice(-4)}` : null,
          dateOfBirth: r.dateOfBirth,
          rejectionReason: r.rejectionReason,
        },
      };
    });

    // Queue stats
    const stats = await prisma.kycRecord.groupBy({
      by: ["status"],
      _count: true,
    });
    const statsMap = Object.fromEntries(stats.map((s) => [s.status, s._count]));

    return NextResponse.json({
      success: true,
      records: enriched,
      stats: {
        pending: statsMap.pending || 0,
        approved: statsMap.approved || 0,
        rejected: statsMap.rejected || 0,
        total,
      },
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   POST /api/admin/kyc — Review actions
   review (single) | bulk_review
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    /* ===== SINGLE REVIEW ===== */
    if (action === "review") {
      const { kycRecordId, decision, tier: overrideTier, notes } = body;

      if (!kycRecordId || !decision || !["approve", "reject"].includes(decision)) {
        return NextResponse.json(
          { success: false, error: "kycRecordId and decision (approve|reject) required" },
          { status: 400 }
        );
      }

      const record = await prisma.kycRecord.findUnique({
        where: { id: kycRecordId },
        include: {
          user: {
            select: {
              id: true,
              ledgerId: true,
              displayName: true,
              email: true,
              kycTier: true,
            },
          },
        },
      });

      if (!record) {
        return NextResponse.json({ success: false, error: "KYC record not found" }, { status: 404 });
      }

      if (record.status !== "pending") {
        return NextResponse.json(
          { success: false, error: `Record already ${record.status}` },
          { status: 409 }
        );
      }

      // ── Name match gate ──
      const nameMatch = record.legalName
        ? normalizeName(record.legalName) === normalizeName(record.user?.displayName || "")
        : false;

      if (decision === "approve" && !nameMatch) {
        return NextResponse.json(
          {
            success: false,
            error: "Name mismatch. ID name does not match account display name.",
            detail: {
              legalName: record.legalName,
              displayName: record.user?.displayName,
            },
          },
          { status: 409 }
        );
      }

      // ── Risk score gate ──
      const risk = calculateRiskScore({
        idImageUrl: record.idImageUrl,
        selfieUrl: record.selfieUrl,
        addressProofUrl: record.addressProofUrl,
        legalName: record.legalName,
        userDisplayName: record.user?.displayName || "",
        selfieMatchScore: record.selfieMatchScore,
        addressVerified: record.addressVerified,
      });

      if (decision === "approve" && risk.score >= 70) {
        return NextResponse.json(
          {
            success: false,
            error: `Risk score too high (${risk.score}/100). Requires manual override or additional verification.`,
            flags: risk.flags,
          },
          { status: 409 }
        );
      }

      const newTier = (overrideTier as Tier) || determineTierFromKyc(record);

      await prisma.$transaction(async (tx) => {
        // Update KYC record
        await tx.kycRecord.update({
          where: { id: record.id },
          data: {
            status: decisionStatus(decision),
            reviewedBy: user.ledgerId,
            reviewedAt: new Date(),
            rejectionReason: decision === "reject" ? (notes || "No reason provided") : null,
            tier: decision === "approve" ? newTier : record.tier,
          },
        });

        if (decision === "approve") {
          // Upgrade user KYC tier and status
          await tx.user.update({
            where: { id: record.userId },
            data: {
              kycTier: newTier,
              kycStatus: "approved",
              kycVerifiedAt: new Date(),
            },
          });
        }
      });

      // Audit
      await prisma.auditEntry.create({
        data: {
          type: `kyc_${decision}d`,
          description: `KYC ${decision} for ${record.user?.displayName} (${record.user?.ledgerId}). Tier: ${newTier}. Risk: ${risk.score}.`,
          txHash: `KYC-${decision.toUpperCase()}-${record.id}-${Date.now()}`,
          ledgerId: user.ledgerId,
        },
      });

      return NextResponse.json({
        success: true,
        review: {
          kycRecordId: record.id,
          userId: record.userId,
          ledgerId: record.user?.ledgerId,
          decision,
          tier: decision === "approve" ? newTier : record.user?.kycTier,
          riskScore: risk.score,
          nameMatch,
          reviewedAt: new Date(),
        },
        message: `KYC ${decision}d for ${record.user?.displayName}. ${
          decision === "approve" ? `Upgraded to ${newTier}.` : "Account frozen until reconciliation."
        }`,
      });
    }

    /* ===== BULK REVIEW ===== */
    if (action === "bulk_review") {
      const { recordIds, decision, reason } = body;

      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "recordIds array required" },
          { status: 400 }
        );
      }
      if (recordIds.length > 50) {
        return NextResponse.json(
          { success: false, error: "Maximum 50 records per bulk action" },
          { status: 400 }
        );
      }
      if (!decision || !["approve", "reject"].includes(decision)) {
        return NextResponse.json(
          { success: false, error: "decision must be approve or reject" },
          { status: 400 }
        );
      }

      const ids = recordIds.map((id: any) => String(id)).filter((id: string) => !!id);

      const records = await prisma.kycRecord.findMany({
        where: {
          id: { in: ids },
          status: "pending",
        },
        include: {
          user: {
            select: {
              id: true,
              ledgerId: true,
              displayName: true,
              kycTier: true,
            },
          },
        },
      });

      const processed: Array<{
        id: string;
        decision: string;
        tier?: string;
        error?: string;
      }> = [];

      for (const record of records) {
        const nameMatch = record.legalName
          ? normalizeName(record.legalName) === normalizeName(record.user?.displayName || "")
          : false;

        // Auto-reject name mismatches on bulk approve
        if (decision === "approve" && !nameMatch) {
          processed.push({
            id: record.id,
            decision: "rejected_auto",
            error: "Name mismatch — requires individual review",
          });
          continue;
        }

        const risk = calculateRiskScore({
          idImageUrl: record.idImageUrl,
          selfieUrl: record.selfieUrl,
          addressProofUrl: record.addressProofUrl,
          legalName: record.legalName,
          userDisplayName: record.user?.displayName || "",
          selfieMatchScore: record.selfieMatchScore,
          addressVerified: record.addressVerified,
        });

        // Auto-reject high risk on bulk approve
        if (decision === "approve" && risk.score >= 70) {
          processed.push({
            id: record.id,
            decision: "rejected_auto",
            error: `Risk score ${risk.score} — requires individual review`,
          });
          continue;
        }

        const newTier = determineTierFromKyc(record);

        await prisma.$transaction(async (tx) => {
          await tx.kycRecord.update({
            where: { id: record.id },
            data: {
              status: decisionStatus(decision),
              reviewedBy: user.ledgerId,
              reviewedAt: new Date(),
              rejectionReason: decision === "reject" ? (reason || "Bulk rejection") : null,
              tier: decision === "approve" ? newTier : record.tier,
            },
          });

          if (decision === "approve") {
            await tx.user.update({
              where: { id: record.userId },
              data: {
                kycTier: newTier,
                kycStatus: "approved",
                kycVerifiedAt: new Date(),
              },
            });
          }
        });

        processed.push({
          id: record.id,
          decision,
          tier: decision === "approve" ? newTier : undefined,
        });
      }

      const approved = processed.filter((p) => p.decision === "approve").length;
      const rejected = processed.filter((p) => p.decision === "reject").length;
      const autoRejected = processed.filter((p) => p.decision === "rejected_auto").length;

      await prisma.auditEntry.create({
        data: {
          type: "kyc_bulk_review",
          description: `Bulk ${decision}: ${approved} approved, ${rejected} rejected, ${autoRejected} auto-rejected.`,
          txHash: `KYC-BULK-${Date.now()}`,
          ledgerId: user.ledgerId,
        },
      });

      return NextResponse.json({
        success: true,
        processed,
        summary: {
          total: processed.length,
          approved,
          rejected,
          autoRejected,
          skipped: ids.length - processed.length,
        },
        message: `Bulk ${decision} complete. ${approved} approved, ${autoRejected} flagged for manual review.`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "review" or "bulk_review"' },
      { status: 400 }
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}
