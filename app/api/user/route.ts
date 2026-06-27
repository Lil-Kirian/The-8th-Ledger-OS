/* ============================================================
   8TH LEDGER — Sovereign Profile API (V3.2 Enhanced)
   Ownership is authoritative. Commitment model is dead.
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   GET /api/user — Current sovereign profile
   ============================================================ */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // ── Ownerships = AUTHORITATIVE PAC data (current ownership %) ──
    const ownerships = await prisma.ownership.findMany({
      where: { userId: user.id, status: "active" },
      include: {
        pool: { select: { poolId: true, name: true, verticalId: true, status: true, imageUrl: true } },
        hall: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Fetch pools created by this sovereign
    const pools = await prisma.pool.findMany({
      where: { creatorId: user.ledgerId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        poolId: true,
        name: true,
        verticalId: true,
        status: true,
        createdAt: true,
      },
    });

    // Fetch knot data
    const knot = await prisma.knotMember.findUnique({
      where: { ledgerId: user.ledgerId },
      select: {
        referredBy: true,
        referrals: true,
        tier: true,
        totalCommitted: true,
        poolsWon: true,
      },
    });

    // Count stats
    const [poolCount, reviewCount] = await Promise.all([
      prisma.pool.count({ where: { creatorId: user.ledgerId } }),
      prisma.poolReview.count({ where: { ledgerId: user.ledgerId } }),
    ]);

    // Parse preferences
    let preferences = null;
    try {
      if (user.preferences) preferences = JSON.parse(user.preferences);
    } catch {
      preferences = user.preferences;
    }

    return NextResponse.json({
      success: true,
      user: {
        ledgerId: user.ledgerId,
        displayName: user.displayName,
        email: user.email,
        country: user.country,
        avatar: user.avatar,
        bio: user.bio,
        trustScore: user.trustScore,
        tier: user.tier,
        ledgerBalance: user.ledgerBalance,
        creditPool: user.creditPool,
        totalCommitted: user.totalCommitted,
        forgesCompleted: user.forgesCompleted,
        referrals: user.referrals,
        identityScore: user.identityScore,
        /* ── V3.2: kycTier is the authoritative gate field ── */
        kycStatus: user.kycStatus,
        kycTier: user.kycTier,
        legalName: user.legalName,
        isBanned: user.isBanned,
        isPrimaryAdmin: user.isPrimaryAdmin,
        deviceFingerprint: user.deviceFingerprint,
        lastActivityAt: user.lastActivityAt,
        beneficiaryName: user.beneficiaryName,
        beneficiaryEmail: user.beneficiaryEmail,
        oracleStanding: user.oracleStanding,
        globalSriScore: user.globalSriScore,
        preferences,
        knot,
        pools,
        ownerships: ownerships.map((o) => ({
          poolId: o.pool.poolId,
          name: o.pool.name,
          verticalId: o.pool.verticalId,
          ownershipPercent: o.ownershipPercent,
          pacToken: o.pacToken,
          totalReturned: o.totalReturned,
          totalFromMarket: o.totalFromMarket,
          hallId: o.hall?.id,
          hallStatus: o.hall?.status,
          status: o.status,
          dynamicValue: o.dynamicValue,
          accumulatedDividends: o.accumulatedDividends,
          pirDebt: o.pirDebt,
        })),
        counts: {
          pools: poolCount,
          reviews: reviewCount,
          ownerships: ownerships.length,
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sovereign profile" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT /api/user — Update sovereign profile
   ============================================================ */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      avatar,
      bio,
      preferences,
      phone,
      legalName,
      beneficiaryName,
      beneficiaryEmail,
    } = body;

    // Validate displayName
    if (displayName !== undefined && (displayName.length < 2 || displayName.length > 50)) {
      return NextResponse.json(
        { success: false, error: "Display name must be 2-50 characters" },
        { status: 400 }
      );
    }

    // Validate legalName if provided
    if (legalName !== undefined && legalName.trim().length > 0) {
      if (legalName.length < 2 || legalName.length > 100) {
        return NextResponse.json(
          { success: false, error: "Legal name must be 2-100 characters" },
          { status: 400 }
        );
      }
    }

    // Serialize preferences
    let prefString = undefined;
    if (preferences !== undefined) {
      prefString = typeof preferences === "string" ? preferences : JSON.stringify(preferences);
    }

    const updateData: unknown = {
      displayName: displayName !== undefined ? displayName : undefined,
      avatar: avatar !== undefined ? avatar : undefined,
      bio: bio !== undefined ? bio : undefined,
      preferences: prefString,
      phone: phone !== undefined ? phone : undefined,
      legalName: legalName !== undefined ? legalName.trim() : undefined,
      beneficiaryName: beneficiaryName !== undefined ? beneficiaryName : undefined,
      beneficiaryEmail: beneficiaryEmail !== undefined ? beneficiaryEmail : undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updated = await prisma.user.update({
      where: { ledgerId: user.ledgerId },
      data: updateData,
      select: {
        ledgerId: true,
        displayName: true,
        email: true,
        avatar: true,
        bio: true,
        ledgerBalance: true,
        updatedAt: true,
        legalName: true,
        kycTier: true,
        isPrimaryAdmin: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[USER_PUT]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}