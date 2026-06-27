import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface PositionItem {
  id: string;
  poolId: string;
  poolName: string;
  verticalId: string;
  ownershipPercent: number;
  amountCommitted: number;
  pacToken: string | null;
  totalReturned: number;
  totalFromMarket: number;
  status: string;
  role: string | null;
  dateCommitted: Date;
  poolStatus: string;
  hallId: string | null;
  hallStatus: string | null;
  country: string;
  imageUrl: string | null;
  monthlyDividendEstimate: number;
}

interface PositionsResponse {
  success: boolean;
  positions?: PositionItem[];
  summary?: {
    totalCommitted: number;
    totalOwnershipPercent: number;
    activeOwnerships: number;
    totalReturned: number;
    totalFromMarket: number;
    monthlyDividendEstimate: number;
    hallCount: number;
  };
  error?: string;
  message?: string;
}

/* ============================================================
   GET /api/positions — User's 8th Ledger Ownership Portfolio (PACs)
   Ownership is the authoritative source. Commitment is dead.
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<PositionsResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

    const where: unknown = { userId: user.id };
    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }

    const ownerships = await prisma.ownership.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            verticalId: true,
            assetValue: true,
            status: true,
            country: true,
            imageUrl: true,
            target: true,
            committed: true,
            listedPrice: true,
          },
        },
        hall: {
          select: {
            id: true,
            status: true,
            name: true,
          },
        },
      },
    });

    /* ── Fetch recent revenue for dividend estimates ── */
    const poolIds = ownerships.map((o) => o.poolId);
    const recentRevenue = await prisma.revenueLog.findMany({
      where: { poolId: { in: poolIds } },
      orderBy: { createdAt: "desc" },
      select: {
        poolId: true,
        amount: true,
        communityNet: true,
        netAfterPayroll: true,
        createdAt: true,
      },
    });

    const revenueByPool = new Map<string, typeof recentRevenue>();
    recentRevenue.forEach((r) => {
      if (!revenueByPool.has(r.poolId)) revenueByPool.set(r.poolId, []);
      revenueByPool.get(r.poolId)!.push(r);
    });

    /* ── Build 8th Ledger positions ── */
    const positions: PositionItem[] = ownerships.map((o) => {
      const poolRevenue = revenueByPool.get(o.poolId) || [];
      const latestRevenue = poolRevenue[0];
      const netForDividends = latestRevenue?.netAfterPayroll || latestRevenue?.communityNet || 0;
      const monthlyDividendEstimate = latestRevenue
        ? Math.round(netForDividends * (o.ownershipPercent / 100))
        : 0;

      return {
        id: o.id,
        poolId: o.pool.poolId,
        poolName: o.pool.name,
        verticalId: o.pool.verticalId,
        ownershipPercent: o.ownershipPercent,
        amountCommitted: o.amountCommitted,
        pacToken: o.pacToken,
        totalReturned: o.totalReturned,
        totalFromMarket: o.totalFromMarket,
        status: o.status,
        role: o.role,
        dateCommitted: o.createdAt,
        poolStatus: o.pool.status,
        hallId: o.hall?.id || null,
        hallStatus: o.hall?.status || null,
        country: o.pool.country,
        imageUrl: o.pool.imageUrl,
        monthlyDividendEstimate,
      };
    });

    const summary = {
      totalCommitted: ownerships.reduce((sum, o) => sum + o.amountCommitted, 0),
      totalOwnershipPercent: ownerships.reduce((sum, o) => sum + o.ownershipPercent, 0),
      activeOwnerships: ownerships.filter((o) => o.status === "active").length,
      totalReturned: ownerships.reduce((sum, o) => sum + o.totalReturned, 0),
      totalFromMarket: ownerships.reduce((sum, o) => sum + o.totalFromMarket, 0),
      monthlyDividendEstimate: positions.reduce((sum, p) => sum + p.monthlyDividendEstimate, 0),
      hallCount: new Set(ownerships.map((o) => o.hall?.id).filter(Boolean)).size,
    };

    return NextResponse.json<PositionsResponse>({
      success: true,
      positions,
      summary,
    });
  } catch (error) {
    console.error("[POSITIONS GET]", error);
    return NextResponse.json<PositionsResponse>(
      { success: false, error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}