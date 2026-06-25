import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHallAccess } from "@/lib/auth";
import { calculateHallValuation, getLatestValuationSnapshot } from "@/lib/valuation";

/* ============================================================
   GET /api/valuation/hall/[id]
   Get current dynamic valuation for a hall and all ownerships.
   ============================================================ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;

    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const access = await requireHallAccess(request, hallId);
    if (!access.success && auth.role !== "admin") {
      return NextResponse.json({ error: "Hall access denied" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { poolId: true, name: true, verticalId: true, assetBookValue: true } },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Get latest snapshot
    const snapshot = await getLatestValuationSnapshot(hallId);

    // Recalculate fresh
    const valuations = await calculateHallValuation(hallId);

    // Get ownerships with user details
    const ownerships = await prisma.ownership.findMany({
      where: { hallId, status: "active" },
      include: {
        user: { select: { ledgerId: true, displayName: true, kycTier: true } },
      },
      orderBy: { ownershipPercent: "desc" },
    });

    const formattedOwnerships = ownerships.map((o) => {
      const valuation = valuations.find((v) => v.ownershipId === o.id);
      return {
        ownershipId: o.id,
        userId: o.userId,
        ledgerId: o.user?.ledgerId,
        displayName: o.user?.displayName,
        kycTier: o.user?.kycTier,
        ownershipPercent: Number(o.ownershipPercent),
        accumulatedDividends: o.accumulatedDividends,
        pirDebt: o.pirDebt,
        dynamicValue: o.dynamicValue,
        totalValue: valuation?.totalValue || o.dynamicValue,
        valuePerPercent: valuation?.valuePerPercent || 0,
        components: valuation?.components || null,
      };
    });

    return NextResponse.json({
      hall: {
        id: hall.id,
        name: hall.name || hall.pool?.name,
        poolId: hall.poolId,
        verticalId: hall.pool?.verticalId,
        assetBookValue: hall.pool?.assetBookValue,
        sriScore: hall.sriScore,
        ahgiScore: hall.ahgiScore,
      },
      valuation: {
        snapshotId: snapshot?.id || null,
        calculatedAt: snapshot?.calculatedAt || new Date(),
        valuePerPercent: snapshot?.valuePerPercent || 0,
        assetBookValue: snapshot?.assetBookValue || 0,
        accumulatedDividendsPerPercent: snapshot?.accumulatedDividendsPerPercent || 0,
        ahgiPremium: snapshot?.ahgiPremium || 0,
        sriBonus: snapshot?.sriBonus || 0,
        pirDebtPerPercent: snapshot?.pirDebtPerPercent || 0,
      },
      ownerships: formattedOwnerships,
      totalOwnerships: ownerships.length,
      totalValued: formattedOwnerships.reduce((s, o) => s + (o.totalValue || 0), 0),
    });
  } catch (error) {
    console.error("[VALUATION HALL]", error);
    return NextResponse.json({ error: "Failed to fetch valuation", detail: String(error) }, { status: 500 });
  }
}