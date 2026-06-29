import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   GET /api/halls — Paginated Hall Directory
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const skip = (page - 1) * limit;

    const primaryAdminView = await isPrimaryAdmin(user.ledgerId);

    // ── 1. Halls where user has ownership
    const ownerships = await prisma.ownership.findMany({
      where: { userId: user.id, status: { not: "forfeited" } },
      include: {
        hall: {
          include: {
            pool: {
              select: {
                id: true,
                poolId: true,
                name: true,
                verticalId: true,
                status: true,
                imageUrl: true,
                assetImages: true,
                emojiSet: true,
                trueCost: true,
                listedPrice: true,
                surplus: true,
                committed: true,
                target: true,
                assetValue: true,
                selectedLocation: true,
                managementFee: true,
                insuranceAllocation: true,
                hallClass: true,
                pirAllocation: true,
                assetBookValue: true,
              },
            },
            hallTreasury: {
              select: {
                balance: true,
                totalRevenue: true,
                totalDistributed: true,
                payrollReserve: true,
                pirDebt: true,
                closureReserve: true,
                monthlyRevenue: true,
              },
            },
            sriSnapshots: {
              orderBy: { recordedAt: "desc" },
              take: 1,
              select: { score: true, recordedAt: true },
            },
            ahgiSnapshots: {
              orderBy: { recordedAt: "desc" },
              take: 1,
              select: { score: true, recordedAt: true },
            },
            _count: {
              select: {
                ownerships: true,
                proposals: true,
                messages: true,
                workers: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const ownedHallIds = ownerships.map((o) => o.hallId).filter(Boolean);

    // ── 2. Discovery halls (live/mature, not owned)
    const discoveryWhere: any = {
      status: { in: ["live", "mature"] },
      ...(ownedHallIds.length > 0 ? { id: { notIn: ownedHallIds } } : {}),
    };

    const [discoveryHalls, totalDiscovery] = await Promise.all([
      prisma.hall.findMany({
        where: discoveryWhere,
        include: {
          pool: {
            select: {
              id: true,
              poolId: true,
              name: true,
              verticalId: true,
              status: true,
              imageUrl: true,
              assetImages: true,
              emojiSet: true,
              trueCost: true,
              listedPrice: true,
              surplus: true,
              committed: true,
              target: true,
              assetValue: true,
              selectedLocation: true,
              hallClass: true,
              pirAllocation: true,
              assetBookValue: true,
            },
          },
          hallTreasury: {
            select: {
              balance: true,
              totalRevenue: true,
              totalDistributed: true,
              monthlyRevenue: true,
            },
          },
          sriSnapshots: {
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: { score: true },
          },
          ahgiSnapshots: {
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: { score: true },
          },
          _count: {
            select: { ownerships: true, proposals: true, messages: true },
          },
        },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.hall.count({ where: discoveryWhere }),
    ]);

    const allHallIds = [...ownedHallIds, ...discoveryHalls.map((h) => h.id)];

    // ── 3. Active proposal counts
    let proposalCountMap: Record<string, number> = {};
    try {
      const activeProposals = await prisma.proposal.groupBy({
        by: ["hallId"],
        where: {
          hallId: { in: allHallIds },
          status: { in: ["pending", "active"] },
        },
        _count: { id: true },
      });
      proposalCountMap = Object.fromEntries(
        activeProposals.map((p) => [p.hallId, p._count.id]),
      );
    } catch {
      /* ignore */
    }

    // ── 4. Message activity (24h) ─
    let messageCountMap: Record<string, number> = {};
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentMessages = await prisma.hallMessage.groupBy({
        by: ["hallId"],
        where: { hallId: { in: allHallIds }, createdAt: { gte: oneDayAgo } },
        _count: { id: true },
      });
      messageCountMap = Object.fromEntries(
        recentMessages.map((m) => [m.hallId, m._count.id]),
      );
    } catch {
      /* ignore */
    }

    // ── 5. Format helper
    function formatHall(hall: any, ownership?: any) {
      const pool = hall.pool;
      const treasury = hall.hallTreasury;
      const sri = hall.sriSnapshots?.[0];
      const ahgi = hall.ahgiSnapshots?.[0];
      const fillPct =
        pool?.listedPrice && pool.listedPrice > 0
          ? Math.round((pool.committed / pool.listedPrice) * 100)
          : 0;

      let assetImage = pool?.imageUrl;
      if (!assetImage && pool?.assetImages) {
        try {
          const imgs = JSON.parse(pool.assetImages);
          if (Array.isArray(imgs) && imgs.length > 0) assetImage = imgs[0];
        } catch {
          /* ignore */
        }
      }

      const emojiSet = pool?.emojiSet ? Array.from(pool.emojiSet) : ["🏠"];

      const base: any = {
        id: hall.id,
        verticalId: pool?.verticalId || "unknown",
        name: hall.name,
        shortName: pool?.name || hall.name,
        status: hall.status,
        joined: !!ownership,
        description: pool?.name
          ? `${pool.name} — ${pool.verticalId} asset pool`
          : hall.name,
        assetImage:
          assetImage ||
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        emojiSet,
        listedPrice: pool?.listedPrice || 0,
        committed: pool?.committed || 0,
        target: pool?.target || 0,
        fillPercent: fillPct,
        myOwnership: ownership ? Number(ownership.ownershipPercent) : 0,
        myDividendMonthly: 0,
        activeProposals: proposalCountMap[hall.id] || 0,
        pacCount: ownership ? 1 : 0,
        location: pool?.selectedLocation || "Global",
        category: pool?.verticalId
          ? pool.verticalId.replace("ledger", "").toUpperCase()
          : "Asset",
        nextConsensus:
          pool?.status === "filled"
            ? "Ready"
            : pool?.status === "filling"
              ? "Filling"
              : "Complete",
        treasuryBalance: treasury?.balance || 0,
        monthlyRevenue: treasury?.monthlyRevenue || treasury?.totalRevenue || 0,
        totalCommitted: pool?.committed || 0,
        target2X: pool?.listedPrice || 0,
        spvName: pool?.poolId
          ? `${pool.verticalId?.replace("ledger", "").toUpperCase() || "LED"}Ledger SPV ${pool.poolId}`
          : "8th Ledger SPV",
        members: hall._count?.ownerships || 0,
        online: messageCountMap[hall.id] || 0,
        lastActivityAt: hall.createdAt,
        role: ownership?.role || null,
        pacToken: ownership?.pacToken || null,
        hallClass: pool?.hallClass || "I",
        sriScore: sri?.score || 50,
        ahgiScore: ahgi?.score || 50,
        closureStatus: hall.closureStatus || "active",
        workers: hall._count?.workers || 0,
        pool: {
          name: pool?.name || hall.name,
          verticalId: pool?.verticalId || "ledgerprop",
        },
        _count: {
          messages: hall._count?.messages || 0,
          proposals: hall._count?.proposals || 0,
        },
      };

      if (primaryAdminView && pool) {
        base.trueCost = pool.trueCost;
        base.surplus = pool.surplus;
        base.managementFee = pool.managementFee;
        base.insuranceAllocation = pool.insuranceAllocation;
        base.pirAllocation = pool.pirAllocation;
        base.assetBookValue = pool.assetBookValue;
      }

      return base;
    }

    const owned = ownerships.map((o) => formatHall(o.hall, o));
    const discovery = discoveryHalls.map((h) => formatHall(h, null));

    const allHalls = [...owned, ...discovery];

    return NextResponse.json({
      success: true,
      halls: allHalls,
      pagination: {
        page,
        limit,
        total: totalDiscovery + owned.length,
        totalPages: Math.ceil((totalDiscovery + owned.length) / limit),
      },
      stats: {
        totalMonthlyDividend: owned.reduce(
          (a, h) => a + (h.myDividendMonthly || 0),
          0,
        ),
        totalOwnership: owned.reduce((a, h) => a + (h.myOwnership || 0), 0),
        totalPACs: owned.length,
        activeProposals: owned.reduce(
          (a, h) => a + (h.activeProposals || 0),
          0,
        ),
        joinedCount: owned.length,
        totalHalls: allHalls.length,
        avgSri:
          owned.length > 0
            ? Math.round(
                owned.reduce((a, h) => a + (h.sriScore || 50), 0) /
                  owned.length,
              )
            : 0,
        avgAhgi:
          owned.length > 0
            ? Math.round(
                owned.reduce((a, h) => a + (h.ahgiScore || 50), 0) /
                  owned.length,
              )
            : 0,
      },
    });
  } catch (error) {
    console.error("[HALLS LIST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch halls" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/halls — Disabled
   Demo hall generation moved to prisma/seed.dev.ts.
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error:
        "Demo hall generation is disabled. Use npm run db:seed:dev locally.",
    },
    { status: 405 },
  );
}
