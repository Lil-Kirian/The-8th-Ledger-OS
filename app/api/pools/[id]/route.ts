import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
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
  console.error("[POOL_DETAIL GET]", error);
  return NextResponse.json(
    { success: false, error: "Pool detail unavailable" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/pools/[id] — Single pool detail (V3.2)
   Public: trueCost/surplus HIDDEN.
   Primary Admin: extra fields appended.
   Ghost Hall: invisible unless committed or admin.
   locationOptions sourced from LocationOption relation ONLY.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    const { id: poolId } = await params;

    const pool = await prisma.pool.findUnique({
      where: { poolId },
      include: {
        hall: {
          select: {
            id: true,
            status: true,
            name: true,
            sriScore: true,
            ahgiScore: true,
            closureStatus: true,
          },
        },
        /* ── V3.2: Ownership (PAC) — authoritative ownership data ── */
        ownerships: user
          ? {
              where: { userId: user.id },
              select: {
                ownershipPercent: true,
                pacToken: true,
                totalReturned: true,
                status: true,
                role: true,
                amountCommitted: true,
                dynamicValue: true,
                accumulatedDividends: true,
                pirDebt: true,
              },
            }
          : false,
        /* ── V3.2: Location options from relation ONLY ── */
        locationOptionsList: true,
        spv: {
          select: {
            id: true,
            name: true,
            entityType: true,
            jurisdiction: true,
            registrationNumber: true,
          },
        },
        revenueLogs: {
          where: { distributed: false },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            amount: true,
            ledgerFee: true,
            netAfterPayroll: true,
            createdAt: true,
          },
        },
        proposals: {
          where: { status: { in: ["active", "pending"] } },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            endsAt: true,
            voteCountYes: true,
            voteCountNo: true,
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

    // ── Ghost Hall gate ──
    const isCommitted = pool.ownerships && pool.ownerships.length > 0;
    const isPrimaryAdminView = user ? isPrimaryAdmin(user.ledgerId) : false;

    if (pool.hall?.status === "ghost" && !isCommitted && !isPrimaryAdminView) {
      return NextResponse.json(
        { success: false, error: "Pool not yet visible. Commit to enter." },
        { status: 403 }
      );
    }

    const fillPercent = pool.target > 0 ? Math.round((pool.committed / pool.target) * 100) : 0;

    // ── Parse media ──
    const assetImages = parseMediaField(pool.assetImages);
    const assetVideos = parseMediaField(pool.assetVideos);
    const documents = parseMediaField(pool.documents);
    const externalLinks = parseMediaField(pool.externalLinks);

    // ── Dividend preview (owner only) ──
    let dividendPreview = null;
    if (isCommitted && pool.ownerships?.[0]) {
      const ownership = pool.ownerships[0];
      const grossRevenue = pool.revenueLogs.reduce((sum, r) => sum + (r.amount || 0), 0);
      const communityShare = pool.revenueLogs.reduce((sum, r) => sum + (r.netAfterPayroll || 0), 0);
      const personalShare = communityShare * (ownership.ownershipPercent / 100);
      dividendPreview = {
        grossRevenue,
        communityShare,
        ledgerShare: grossRevenue - communityShare,
        yourShare: Math.round(personalShare),
        ownershipPercent: ownership.ownershipPercent,
        pendingRevenueCount: pool.revenueLogs.length,
      };
    }

    // ── Invite status (owner only)
    let inviteStatus = null;
    let myCommitment = 0;
    if (isCommitted && user) {
      const ownership = pool.ownerships?.[0];
      if (ownership) {
        inviteStatus = {
          remaining: ownership.inviteCodesRemaining || 0,
          used: ownership.inviteCodesUsed || 0,
          canGenerate: (ownership.inviteCodesRemaining || 0) > 0,
        };
        myCommitment = ownership.amountCommitted || 0;
      }
    }

    // ── Build public response ──
    const poolData: Record<string, unknown> = {
      poolId: pool.poolId,
      name: pool.name,
      verticalId: pool.verticalId,
      description: pool.description,
      assetValue: pool.assetValue,
      listedPrice: pool.listedPrice,
      committed: pool.committed,
      target: pool.target,
      fillPercent,
      status: pool.status,
      country: pool.country,
      creatorId: pool.creatorId,
      imageUrl: pool.imageUrl,
      assetImages,
      assetVideos,
      tour360Url: pool.tour360Url,
      documents,
      externalLinks,
      emojiSet: pool.emojiSet,
      assetCondition: pool.assetCondition,
      minCommitment: pool.minCommitment,
      maxCommitment: pool.maxCommitment,
      campaignDuration: pool.campaignDuration,
      closesAt: pool.closesAt,
      createdAt: pool.createdAt,
      participants: pool.participants,
      maxParticipants: pool.maxParticipants,
      isVerified: pool.isVerified,
      hallUnlocked: pool.hallUnlocked,
      hallClass: pool.hallClass || "I",

      hall: pool.hall
        ? {
            id: pool.hall.id,
            status: pool.hall.status,
            name: pool.hall.name,
            sriScore: pool.hall.sriScore,
            ahgiScore: pool.hall.ahgiScore,
            closureStatus: pool.hall.closureStatus,
          }
        : null,

      /* ── V3.2: Location options from relation ONLY ── */
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

      spv: pool.spv,
      activeProposals: pool.proposals || [],
      myOwnership: pool.ownerships?.[0] || null,
      myCommitment,
      dividendPreview,
      inviteStatus,
    };

    // ── Primary admin-only fields ──
    if (isPrimaryAdminView) {
      poolData.trueCost = pool.trueCost;
      poolData.surplus = pool.surplus;
      poolData.insuranceAllocation = pool.insuranceAllocation;
      poolData.pirAllocation = pool.pirAllocation;
      poolData.managementFee = pool.managementFee;
      poolData.executionQueue = pool.executionQueue;
      poolData.assetBookValue = pool.assetBookValue;
    }

    return NextResponse.json({ success: true, pool: poolData });
  } catch (error) {
    return handlePrismaError(error);
  }
}