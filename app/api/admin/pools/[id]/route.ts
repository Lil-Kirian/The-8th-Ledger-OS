import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   HELPERS
   ============================================================ */
function parseMediaField(raw: string | null): any[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function handlePrismaError(error: any): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }
  }
  console.error("[ADMIN_POOL_DETAIL GET]", error);
  return NextResponse.json(
    { success: false, error: "Pool detail unavailable" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/admin/pools/[id] — Primary Admin-only pool detail
   Returns ALL fields including trueCost, PIR, allocations.
   For admin editing panel only.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (!user.isPrimaryAdmin) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { id: poolId } = await params;

    const pool = await prisma.pool.findUnique({
      where: { poolId },
      include: {
        hall: {
          select: {
            id: true,
            status: true,
            name: true,
            createdAt: true,
            hallClass: true,
            sriScore: true,
            ahgiScore: true,
          },
        },
        locationOptionsList: true,
        spv: {
          select: {
            id: true,
            name: true,
            entityType: true,
            jurisdiction: true,
            registrationNumber: true,
            documents: true,
            createdAt: true,
          },
        },
        ownerships: {
          select: {
            id: true,
            userId: true,
            ledgerId: true,
            ownershipPercent: true,
            pacToken: true,
            totalReturned: true,
            status: true,
            role: true,
            createdAt: true,
            dynamicValue: true,
            accumulatedDividends: true,
            user: {
              select: {
                ledgerId: true,
                displayName: true,
                email: true,
              },
            },
          },
          orderBy: { ownershipPercent: "desc" },
        },
        revenueLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            source: true,
            communityNet: true,
            ledgerFee: true,
            distributed: true,
            createdAt: true,
            payrollDeducted: true,
            netAfterPayroll: true,
          },
        },
        auditEntries: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            description: true,
            amount: true,
            txHash: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pool) {
      return NextResponse.json(
        { success: false, error: "Pool not found" },
        { status: 404 }
      );
    }

    const fillPercent = pool.target > 0 ? Math.round((pool.committed / pool.target) * 100) : 0;

    return NextResponse.json({
      success: true,
      pool: {
        // Core identity
        id: pool.id,
        poolId: pool.poolId,
        name: pool.name,
        verticalId: pool.verticalId,
        description: pool.description,
        country: pool.country,
        creatorId: pool.creatorId,
        status: pool.status,
        hallClass: pool.hallClass,

        // Pricing (primary admin-only visibility)
        assetValue: pool.assetValue,
        listedPrice: pool.listedPrice,
        trueCost: pool.trueCost,
        surplus: pool.surplus,
        target: pool.target,
        committed: pool.committed,
        fillPercent,
        participants: pool.participants,
        maxParticipants: pool.maxParticipants,

        // Allocations
        insuranceAllocation: pool.insuranceAllocation,

        // Media
        imageUrl: pool.imageUrl,
        assetImages: parseMediaField(pool.assetImages),
        assetVideos: parseMediaField(pool.assetVideos),
        tour360Url: pool.tour360Url,
        documents: parseMediaField(pool.documents),
        externalLinks: parseMediaField(pool.externalLinks),
        emojiSet: pool.emojiSet,
        assetCondition: pool.assetCondition,

        // Commitment rules
        minCommitment: pool.minCommitment,
        maxCommitment: pool.maxCommitment,
        campaignDuration: pool.campaignDuration,
        closesAt: pool.closesAt,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,

        // Verification
        isVerified: pool.isVerified,
        hallUnlocked: pool.hallUnlocked,

        // Hall
        hall: pool.hall,

        // Location options
        locationOptions: (pool.locationOptionsList || []).map((opt) => ({
          id: opt.id,
          name: opt.name,
          address: opt.address,
          lat: opt.lat,
          lng: opt.lng,
          cost: opt.cost,
          image: opt.image,
          description: opt.description,
          votes: opt.votes,
          isSelected: opt.isSelected,
        })),

        // SPV
        spv: pool.spv
          ? {
              ...pool.spv,
              documents: parseMediaField(pool.spv.documents),
            }
          : null,

        // Ownership breakdown (authoritative — no Commitment)
        ownerships: pool.ownerships.map((o) => ({
          id: o.id,
          userId: o.userId,
          ledgerId: o.user?.ledgerId || o.ledgerId,
          displayName: o.user?.displayName,
          email: o.user?.email,
          ownershipPercent: o.ownershipPercent,
          pacToken: o.pacToken,
          totalReturned: o.totalReturned,
          status: o.status,
          role: o.role,
          dynamicValue: o.dynamicValue,
          accumulatedDividends: o.accumulatedDividends,
          createdAt: o.createdAt,
        })),

        // Revenue
        revenueLogs: pool.revenueLogs,

        // Audit trail
        auditEntries: pool.auditEntries,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}