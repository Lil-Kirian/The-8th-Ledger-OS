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
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const primaryAdminView = await isPrimaryAdmin(user.ledgerId);

    // ── 1. Halls where user has ownership ────────────────────
    const ownerships = await prisma.ownership.findMany({
      where: { userId: user.id, status: { not: "forfeited" } },
      include: {
        hall: {
          include: {
            pool: {
              select: {
                id: true, poolId: true, name: true, verticalId: true, status: true,
                imageUrl: true, assetImages: true, emojiSet: true,
                trueCost: true, listedPrice: true, surplus: true,
                committed: true, target: true, assetValue: true,
                selectedLocation: true, managementFee: true,
                insuranceAllocation: true, hallClass: true,
                pirAllocation: true, assetBookValue: true,
              },
            },
            hallTreasury: {
              select: {
                balance: true, totalRevenue: true, totalDistributed: true,
                payrollReserve: true, pirDebt: true, closureReserve: true, monthlyRevenue: true,
              },
            },
            sriSnapshots: { orderBy: { recordedAt: "desc" }, take: 1, select: { score: true, recordedAt: true } },
            ahgiSnapshots: { orderBy: { recordedAt: "desc" }, take: 1, select: { score: true, recordedAt: true } },
            _count: { select: { ownerships: true, proposals: true, messages: true, workers: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const ownedHallIds = ownerships.map((o) => o.hallId).filter(Boolean);

    // ── 2. Discovery halls (live/mature, not owned) ───────────
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
              id: true, poolId: true, name: true, verticalId: true, status: true,
              imageUrl: true, assetImages: true, emojiSet: true,
              trueCost: true, listedPrice: true, surplus: true,
              committed: true, target: true, assetValue: true,
              selectedLocation: true, hallClass: true,
              pirAllocation: true, assetBookValue: true,
            },
          },
          hallTreasury: {
            select: {
              balance: true, totalRevenue: true, totalDistributed: true, monthlyRevenue: true,
            },
          },
          sriSnapshots: { orderBy: { recordedAt: "desc" }, take: 1, select: { score: true } },
          ahgiSnapshots: { orderBy: { recordedAt: "desc" }, take: 1, select: { score: true } },
          _count: { select: { ownerships: true, proposals: true, messages: true } },
        },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.hall.count({ where: discoveryWhere }),
    ]);

    const allHallIds = [...ownedHallIds, ...discoveryHalls.map((h) => h.id)];

    // ── 3. Active proposal counts ─────────────────────────────
    let proposalCountMap: Record<string, number> = {};
    try {
      const activeProposals = await prisma.proposal.groupBy({
        by: ["hallId"],
        where: { hallId: { in: allHallIds }, status: { in: ["pending", "active"] } },
        _count: { id: true },
      });
      proposalCountMap = Object.fromEntries(activeProposals.map((p) => [p.hallId, p._count.id]));
    } catch { /* ignore */ }

    // ── 4. Message activity (24h) ────────────────────────────
    let messageCountMap: Record<string, number> = {};
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentMessages = await prisma.hallMessage.groupBy({
        by: ["hallId"],
        where: { hallId: { in: allHallIds }, createdAt: { gte: oneDayAgo } },
        _count: { id: true },
      });
      messageCountMap = Object.fromEntries(recentMessages.map((m) => [m.hallId, m._count.id]));
    } catch { /* ignore */ }

    // ── 5. Format helper ─────────────────────────────────────
    function formatHall(hall: any, ownership?: any) {
      const pool = hall.pool;
      const treasury = hall.hallTreasury;
      const sri = hall.sriSnapshots?.[0];
      const ahgi = hall.ahgiSnapshots?.[0];
      const fillPct = pool?.listedPrice && pool.listedPrice > 0
        ? Math.round((pool.committed / pool.listedPrice) * 100) : 0;

      let assetImage = pool?.imageUrl;
      if (!assetImage && pool?.assetImages) {
        try {
          const imgs = JSON.parse(pool.assetImages);
          if (Array.isArray(imgs) && imgs.length > 0) assetImage = imgs[0];
        } catch { /* ignore */ }
      }

      const emojiSet = pool?.emojiSet ? Array.from(pool.emojiSet) : ["🏠"];

      const base: Record<string, any> = {
        id: hall.id,
        verticalId: pool?.verticalId || "unknown",
        name: hall.name,
        shortName: pool?.name || hall.name,
        status: hall.status,
        joined: !!ownership,
        description: pool?.name ? `${pool.name} — ${pool.verticalId} asset pool` : hall.name,
        assetImage: assetImage || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
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
        category: pool?.verticalId ? pool.verticalId.replace("ledger", "").toUpperCase() : "Asset",
        nextConsensus: pool?.status === "filled" ? "Ready" : pool?.status === "filling" ? "Filling" : "Complete",
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
        totalMonthlyDividend: owned.reduce((a, h) => a + (h.myDividendMonthly || 0), 0),
        totalOwnership: owned.reduce((a, h) => a + (h.myOwnership || 0), 0),
        totalPACs: owned.length,
        activeProposals: owned.reduce((a, h) => a + (h.activeProposals || 0), 0),
        joinedCount: owned.length,
        totalHalls: allHalls.length,
        avgSri: owned.length > 0 ? Math.round(owned.reduce((a, h) => a + (h.sriScore || 50), 0) / owned.length) : 0,
        avgAhgi: owned.length > 0 ? Math.round(owned.reduce((a, h) => a + (h.ahgiScore || 50), 0) / owned.length) : 0,
      },
    });
  } catch (error) {
    console.error("[HALLS LIST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch halls" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/halls/seed — Generate Demo Halls (Founder/Admin)
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "founder" && user.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Founder or admin required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(100, Math.max(1, body.count || 55));

    const VERTICALS = [
      { id: "ledgerprop", name: "Nairobi Luxury Apartments", location: "Nairobi, Kenya", class: "I", emoji: "🏠🔑🏗️📐🌇" },
      { id: "ledgerauto", name: "Lagos EV Fleet", location: "Lagos, Nigeria", class: "I", emoji: "🚗🏎️🔋🛞🚦" },
      { id: "ledgertech", name: "Accra Data Center", location: "Accra, Ghana", class: "III", emoji: "💻⚡🖥️🔌🌐" },
      { id: "ledgeredu", name: "Kampala Tech Campus", location: "Kampala, Uganda", class: "II", emoji: "📚🎓✏️🏛️🧠" },
      { id: "ledgerhealth", name: "Addis Ababa Medical Hub", location: "Addis Ababa, Ethiopia", class: "II", emoji: "🏥💊🩺❤️🧬" },
      { id: "ledgerbiz", name: "Cairo Commercial Tower", location: "Cairo, Egypt", class: "III", emoji: "💼📈🏢📊🤝" },
      { id: "ledgertravel", name: "Cape Town Aviation", location: "Cape Town, South Africa", class: "II", emoji: "✈️🛩️🌴🧳🗺️" },
      { id: "ledgeragri", name: "Dar es Salaam Farmland", location: "Dar es Salaam, Tanzania", class: "III", emoji: "🌾🚜🍃🌱🌽" },
      { id: "ledgerenergy", name: "Windhoek Solar Farm", location: "Windhoek, Namibia", class: "I", emoji: "☀️⚡🔋🌬️♻️" },
      { id: "ledgeraccess", name: "Kigali Access Network", location: "Kigali, Rwanda", class: "I", emoji: "🎫🔐🎭🥂🎪" },
      { id: "ledgersport", name: "Johannesburg Sports Complex", location: "Johannesburg, South Africa", class: "III", emoji: "⚽🏀🏈⚾🎾" },
    ];

    const STATUSES: Array<{ status: string; poolStatus: string; fill: number; committed: number; treasury: number; sri: number; ahgi: number }> = [
      { status: "ghost", poolStatus: "filling", fill: 45, committed: 45000, treasury: 0, sri: 50, ahgi: 50 },
      { status: "live", poolStatus: "filled", fill: 100, committed: 100000, treasury: 8500, sri: 78, ahgi: 72 },
      { status: "mature", poolStatus: "filled", fill: 100, committed: 100000, treasury: 24000, sri: 92, ahgi: 85 },
      { status: "dormant", poolStatus: "filled", fill: 100, committed: 100000, treasury: 200, sri: 35, ahgi: 28 },
      { status: "dissolved", poolStatus: "closed", fill: 100, committed: 100000, treasury: 0, sri: 0, ahgi: 0 },
    ];

    const created = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const vertical = VERTICALS[i % VERTICALS.length];
      const statusCfg = STATUSES[Math.floor(i / VERTICALS.length) % STATUSES.length];
      const idx = Math.floor(i / VERTICALS.length);
      const poolId = `DEMO-${vertical.id.toUpperCase()}-${idx + 1}-${Date.now()}-${i}`;
      const listedPrice = 100000 + (i * 5000);
      const trueCost = listedPrice / 2;

      // Create Pool
      const pool = await prisma.pool.create({
        data: {
          poolId,
          verticalId: vertical.id,
          name: `${vertical.name} ${idx > 0 ? `#${idx + 1}` : ""}`,
          description: `Demo ${vertical.id} asset pool for testing. ${statusCfg.status} status.`,
          imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
          assetValue: trueCost,
          committed: statusCfg.committed,
          target: listedPrice,
          participants: Math.floor(Math.random() * 50) + 10,
          maxParticipants: 100,
          status: statusCfg.poolStatus,
          country: vertical.location.split(", ").pop() || "Global",
          creatorId: user.id,
          isVerified: true,
          closesAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          trueCost,
          listedPrice,
          surplus: listedPrice - trueCost,
          managementFee: 20,
          minCommitment: 1,
          maxCommitment: 50000,
          campaignDuration: 30,
          emojiSet: vertical.emoji,
          hallUnlocked: statusCfg.status !== "ghost",
          selectedLocation: vertical.location,
          assetCondition: "new",
          assetType: vertical.id,
          hallClass: vertical.class,
          pirAllocation: JSON.stringify({
            shield: Math.round(trueCost * 0.25),
            seal: Math.round(trueCost * 0.20),
            forge: Math.round(trueCost * 0.20),
            spire: Math.round(trueCost * 0.15),
            vanguard: Math.round(trueCost * 0.12),
            sanctuary: Math.round(trueCost * 0.08),
          }),
          assetBookValue: trueCost,
          insuranceAllocation: Math.round(trueCost * 0.25),
          ihcpTarget: 0,
        },
      });

      // Create Hall
      const hall = await prisma.hall.create({
        data: {
          poolId: pool.id,
          name: pool.name,
          status: statusCfg.status,
          hallClass: vertical.class,
          sriScore: statusCfg.sri,
          ahgiScore: statusCfg.ahgi,
          closureStatus: statusCfg.status === "dissolved" ? "dissolved" : "active",
          pirDebt: 0,
          payrollReserve: statusCfg.status === "live" || statusCfg.status === "mature" ? 5000 : 0,
          assetType: vertical.id,
          businessStatus: statusCfg.status === "live" ? "operating" : statusCfg.status === "mature" ? "stable" : "inactive",
          inventoryEnabled: vertical.class === "III" && statusCfg.status === "live",
          forgeEnabled: vertical.class === "III" && statusCfg.status === "live",
          ihcpBalance: 0,
        },
      });

      // Create HallTreasury
      await prisma.hallTreasury.create({
        data: {
          hallId: hall.id,
          balance: statusCfg.treasury,
          totalDistributed: statusCfg.status === "mature" ? 45000 : statusCfg.status === "live" ? 12000 : 0,
          totalRevenue: statusCfg.treasury,
          payrollReserve: statusCfg.status === "live" || statusCfg.status === "mature" ? 5000 : 0,
          pirDebt: 0,
          closureReserve: statusCfg.status === "dormant" ? 2000 : 0,
          monthlyRevenue: statusCfg.status === "live" ? 8500 : statusCfg.status === "mature" ? 12000 : 0,
        },
      });

      // Create SRI Snapshot
      await prisma.sriSnapshot.create({
        data: {
          hallId: hall.id,
          score: statusCfg.sri,
          governanceActivity: Math.floor(Math.random() * 40) + 60,
          revenueConsistency: Math.floor(Math.random() * 30) + 70,
          dividendReliability: Math.floor(Math.random() * 20) + 80,
          proposalQuality: Math.floor(Math.random() * 30) + 60,
          dormancyRate: statusCfg.status === "dormant" ? 85 : Math.floor(Math.random() * 20),
          marketplaceVelocity: Math.floor(Math.random() * 15),
        },
      });

      // Create AHGI Snapshot
      await prisma.ahgiSnapshot.create({
        data: {
          hallId: hall.id,
          score: statusCfg.ahgi,
          healthMetrics: JSON.stringify({
            occupancy: Math.floor(Math.random() * 40) + 60,
            maintenance: "current",
            compliance: "passed",
          }),
          growthMetrics: JSON.stringify({
            revenueGrowth: (Math.random() * 20 - 5).toFixed(1),
            assetValue: (Math.random() * 15).toFixed(1),
          }),
        },
      });

      // Create some demo workers for Class III
      if (vertical.class === "III" && statusCfg.status !== "ghost" && statusCfg.status !== "dissolved") {
        const roles = vertical.id === "ledgersport"
          ? ["Head Coach", "Team Manager", "Medical Staff", "Groundskeeper", "Marketing Lead"]
          : ["Operations Manager", "Field Supervisor", "Sales Lead", "Maintenance", "Security"];
        for (let w = 0; w < Math.min(3, roles.length); w++) {
          await prisma.worker.create({
            data: {
              hallId: hall.id,
              workerNumber: `W-${hall.id.slice(-6)}-${String(w + 1).padStart(3, "0")}`,
              role: roles[w],
              salary: 1500 + w * 500,
              contractMonths: 12,
              status: "active",
              performanceScore: Math.random() * 40 + 60,
              department: vertical.id === "ledgersport" ? "Team Operations" : "General Operations",
            },
          });
        }
      }

      // Create demo proposals for live/mature
      if (statusCfg.status === "live" || statusCfg.status === "mature") {
        const proposalTypes = ["budget_approve", "maintenance", "hire", "strategy"];
        for (let p = 0; p < 2; p++) {
          await prisma.proposal.create({
            data: {
              poolId: pool.id,
              hallId: hall.id,
              proposerId: user.id,
              title: `Demo Proposal ${p + 1}: ${proposalTypes[p]} for ${vertical.name}`,
              description: "This is a demo proposal generated for testing the Sovereign Stream.",
              type: proposalTypes[p],
              amount: Math.floor(Math.random() * 10000) + 1000,
              thresholdPercent: 51,
              status: p === 0 ? "passed" : "pending",
              executionStatus: p === 0 ? "completed" : "pending",
              endsAt: new Date(now.getTime() + (48 - p * 24) * 60 * 60 * 1000),
              passedAt: p === 0 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : null,
              executedAt: p === 0 ? new Date(now.getTime() - 12 * 60 * 60 * 1000) : null,
            },
          });
        }
      }

      // Create 8th Ledger updates
      const updateTypes = [
        { type: "insurance", title: "Insurance Renewal", content: "Policy renewed for 12 months. Lloyd's of London." },
        { type: "maintenance", title: "Routine Maintenance", content: "Scheduled maintenance completed. All systems nominal." },
        { type: "payroll", title: "Payroll Executed", content: "Monthly payroll processed. All workers paid." },
        { type: "valuation", title: "Dynamic Valuation Update", content: "Asset book value increased 3% this quarter." },
      ];
      for (const u of updateTypes) {
        await prisma.eighthLedgerUpdate.create({
          data: {
            hallId: hall.id,
            type: u.type,
            title: u.title,
            content: u.content,
            amount: u.type === "payroll" ? 5000 : u.type === "maintenance" ? 2000 : 0,
          },
        });
      }

      created.push({ hallId: hall.id, poolId: pool.id, vertical: vertical.id, status: statusCfg.status });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created.length} demo halls`,
      created,
    });
  } catch (error) {
    console.error("[HALLS SEED]", error);
    return NextResponse.json(
      { success: false, error: "Seed failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}