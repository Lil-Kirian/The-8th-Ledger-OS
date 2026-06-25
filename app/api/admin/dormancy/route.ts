import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   8TH LEDGER — DORMANCY ADMIN API
   3-Year Protocol: Warning → Vault → Auction → Liquidation
   ============================================================ */

function handlePrismaError(error: unknown): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }
  }
  console.error("[ADMIN_DORMANCY ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Dormancy operation failed" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/admin/dormancy — Primary admin dormancy registry
   view=vaults | auctions | logs
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "vaults";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    /* ── VAULTS (Year 2) ── */
    if (view === "vaults") {
      const status = searchParams.get("status") || "vaulted";
      const search = searchParams.get("search");

      const where: Prisma.DormancyVaultWhereInput = {};
      if (status !== "all") where.status = status;

      if (search) {
        where.OR = [
          { user: { displayName: { contains: search, mode: "insensitive" } } },
          { user: { ledgerId: { contains: search, mode: "insensitive" } } },
          { ownership: { hall: { name: { contains: search, mode: "insensitive" } } } },
        ];
      }

      const [vaults, total] = await Promise.all([
        prisma.dormancyVault.findMany({
          where,
          orderBy: { vaultedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: {
              select: { ledgerId: true, displayName: true, email: true, kycTier: true },
            },
            ownership: {
              select: {
                ownershipPercent: true,
                dynamicValue: true,
                accumulatedDividends: true,
                hall: {
                  select: {
                    id: true,
                    name: true,
                    pool: { select: { poolId: true, name: true, verticalId: true } },
                  },
                },
              },
            },
          },
        }),
        prisma.dormancyVault.count({ where }),
      ]);

      const enriched = vaults.map((v) => ({
        id: v.id,
        user: v.user,
        ownership: v.ownership,
        hall: v.ownership?.hall,
        vaultedAt: v.vaultedAt,
        accumulatedDividends: v.accumulatedDividends,
        status: v.status,
        reclaimedAt: v.reclaimedAt,
        daysInVault: Math.floor((Date.now() - new Date(v.vaultedAt).getTime()) / (1000 * 60 * 60 * 24)),
      }));

      return NextResponse.json({
        success: true,
        vaults: enriched,
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    /* ── AUCTIONS (Year 3) ── */
    if (view === "auctions") {
      const status = searchParams.get("status") || "active";
      const search = searchParams.get("search");

      const where: Prisma.DormancyAuctionWhereInput = {};
      if (status !== "all") where.status = status;

      if (search) {
        where.vault = {
          OR: [
            { user: { displayName: { contains: search, mode: "insensitive" } } },
            { user: { ledgerId: { contains: search, mode: "insensitive" } } },
          ],
        };
      }

      const [auctions, total] = await Promise.all([
        prisma.dormancyAuction.findMany({
          where,
          orderBy: { listedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            vault: {
              include: {
                user: {
                  select: { ledgerId: true, displayName: true },
                },
                ownership: {
                  select: {
                    ownershipPercent: true,
                    dynamicValue: true,
                    hall: {
                      select: {
                        id: true,
                        name: true,
                        pool: { select: { poolId: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.dormancyAuction.count({ where }),
      ]);

      const enriched = auctions.map((a) => ({
        id: a.id,
        vaultId: a.vaultId,
        listedAt: a.listedAt,
        startingPrice: a.startingPrice,
        finalPrice: a.finalPrice,
        buyerId: a.buyerId,
        status: a.status,
        completedAt: a.completedAt,
        daysListed: Math.floor((Date.now() - new Date(a.listedAt).getTime()) / (1000 * 60 * 60 * 24)),
        originalOwner: a.vault?.user,
        ownership: a.vault?.ownership,
        hall: a.vault?.ownership?.hall,
      }));

      return NextResponse.json({
        success: true,
        auctions: enriched,
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    /* ── LOGS (History) ── */
    const type = searchParams.get("type");
    const stage = searchParams.get("stage");

    const where: Prisma.DormancyLogWhereInput = {};
    if (type) where.type = type;
    if (stage) where.stage = stage;

    const [logs, total] = await Promise.all([
      prisma.dormancyLog.findMany({
        where,
        orderBy: { notifiedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dormancyLog.count({ where }),
    ]);

    // Enrich with user/hall/pool names
    const userIds = [...new Set(logs.filter((l) => l.userId).map((l) => l.userId!))];
    const hallIds = [...new Set(logs.filter((l) => l.hallId).map((l) => l.hallId!))];
    const poolIds = [...new Set(logs.filter((l) => l.poolId).map((l) => l.poolId!))];

    const [users, halls, pools] = await Promise.all([
      userIds.length > 0 ? prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, ledgerId: true, displayName: true },
      }) : [],
      hallIds.length > 0 ? prisma.hall.findMany({
        where: { id: { in: hallIds } },
        select: { id: true, name: true },
      }) : [],
      poolIds.length > 0 ? prisma.pool.findMany({
        where: { id: { in: poolIds } },
        select: { id: true, poolId: true, name: true },
      }) : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const hallMap = new Map(halls.map((h) => [h.id, h]));
    const poolMap = new Map(pools.map((p) => [p.id, p]));

    const enriched = logs.map((l) => ({
      ...l,
      user: l.userId ? userMap.get(l.userId) || null : null,
      hall: l.hallId ? hallMap.get(l.hallId) || null : null,
      pool: l.poolId ? poolMap.get(l.poolId) || null : null,
    }));

    return NextResponse.json({
      success: true,
      logs: enriched,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   POST /api/admin/dormancy — Admin dormancy actions
   vault | auction | reclaim | force_liquidate
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    /* ===== VAULT — Move ownership to dormancy vault (Year 2) ===== */
    if (action === "vault") {
      const { ownershipId, reason } = body;
      if (!ownershipId) {
        return NextResponse.json(
          { success: false, error: "ownershipId required" },
          { status: 400 }
        );
      }

      const ownership = await prisma.ownership.findUnique({
        where: { id: ownershipId },
        include: {
          user: { select: { ledgerId: true, displayName: true } },
          hall: { select: { id: true, name: true, poolId: true } },
        },
      });

      if (!ownership) {
        return NextResponse.json({ success: false, error: "Ownership not found" }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const vault = await tx.dormancyVault.create({
          data: {
            userId: ownership.userId,
            ownershipId: ownership.id,
            accumulatedDividends: ownership.accumulatedDividends,
            status: "vaulted",
          },
        });

        await tx.ownership.update({
          where: { id: ownership.id },
          data: { status: "dormant" },
        });

        await tx.dormancyLog.create({
          data: {
            userId: ownership.userId,
            poolId: ownership.poolId,
            hallId: ownership.hallId,
            type: "account",
            stage: "vault_24mo",
            message: reason || `Ownership vaulted by admin ${user.ledgerId}`,
          },
        });

        await tx.auditEntry.create({
          data: {
            type: "dormancy_vaulted",
            description: `Ownership ${ownership.id} vaulted for ${ownership.user?.displayName}. Hall: ${ownership.hall?.name}`,
            txHash: `DORM-VAULT-${vault.id}-${Date.now()}`,
            poolId: ownership.poolId,
            ledgerId: user.ledgerId,
          },
        });

        return vault;
      });

      return NextResponse.json({
        success: true,
        vault: result,
        message: `Ownership vaulted. Subject can reclaim by logging in + identity verification.`,
      });
    }

    /* ===== AUCTION — List vaulted ownership for auction (Year 3) ===== */
    if (action === "auction") {
      const { vaultId, startingPrice, reason } = body;
      if (!vaultId || !startingPrice) {
        return NextResponse.json(
          { success: false, error: "vaultId and startingPrice required" },
          { status: 400 }
        );
      }

      const vault = await prisma.dormancyVault.findUnique({
        where: { id: vaultId },
        include: {
          ownership: {
            include: {
              hall: { select: { id: true, name: true, poolId: true } },
            },
          },
        },
      });

      if (!vault) {
        return NextResponse.json({ success: false, error: "Vault entry not found" }, { status: 404 });
      }
      if (vault.status !== "vaulted") {
        return NextResponse.json(
          { success: false, error: `Vault status is ${vault.status}, not vaulted` },
          { status: 409 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const auction = await tx.dormancyAuction.create({
          data: {
            vaultId: vault.id,
            startingPrice,
            status: "active",
          },
        });

        await tx.dormancyVault.update({
          where: { id: vault.id },
          data: { status: "auctioned" },
        });

        await tx.dormancyLog.create({
          data: {
            userId: vault.userId,
            poolId: vault.ownership?.poolId,
            hallId: vault.ownership?.hallId,
            type: "account",
            stage: "auction_36mo",
            message: reason || `Ownership listed for auction by admin ${user.ledgerId}. Starting price: $${startingPrice}`,
          },
        });

        await tx.auditEntry.create({
          data: {
            type: "dormancy_auctioned",
            description: `Auction created for vault ${vault.id}. Starting price: $${startingPrice}. Hall: ${vault.ownership?.hall?.name}`,
            txHash: `DORM-AUCTION-${auction.id}-${Date.now()}`,
            poolId: vault.ownership?.poolId,
            ledgerId: user.ledgerId,
          },
        });

        return auction;
      });

      return NextResponse.json({
        success: true,
        auction: result,
        message: `Auction created. 30-day timer started. 80% to original owner if they return, 20% to 8th Ledger as dormancy fee.`,
      });
    }

    /* ===== RECLAIM — Admin restores ownership from vault ===== */
    if (action === "reclaim") {
      const { vaultId, reason } = body;
      if (!vaultId) {
        return NextResponse.json(
          { success: false, error: "vaultId required" },
          { status: 400 }
        );
      }

      const vault = await prisma.dormancyVault.findUnique({
        where: { id: vaultId },
        include: {
          ownership: {
            include: {
              hall: { select: { id: true, name: true, poolId: true } },
              user: { select: { ledgerId: true, displayName: true } },
            },
          },
        },
      });

      if (!vault) {
        return NextResponse.json({ success: false, error: "Vault entry not found" }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.ownership.update({
          where: { id: vault.ownershipId },
          data: { status: "active" },
        });

        const updatedVault = await tx.dormancyVault.update({
          where: { id: vault.id },
          data: { status: "reclaimed", reclaimedAt: new Date() },
        });

        await tx.dormancyLog.create({
          data: {
            userId: vault.userId,
            poolId: vault.ownership?.poolId,
            hallId: vault.ownership?.hallId,
            type: "account",
            stage: "reclaimed",
            message: reason || `Ownership reclaimed from vault by admin ${user.ledgerId}`,
          },
        });

        await tx.auditEntry.create({
          data: {
            type: "dormancy_reclaimed",
            description: `Ownership reclaimed from vault for ${vault.ownership?.user?.displayName}. Hall: ${vault.ownership?.hall?.name}`,
            txHash: `DORM-RECLAIM-${vault.id}-${Date.now()}`,
            poolId: vault.ownership?.poolId,
            ledgerId: user.ledgerId,
          },
        });

        return updatedVault;
      });

      return NextResponse.json({
        success: true,
        vault: result,
        message: `Ownership reclaimed from vault and restored to active status.`,
      });
    }

    /* ===== FORCE LIQUIDATE — Admin forces closure of dormant hall ===== */
    if (action === "force_liquidate") {
      const { hallId, reason } = body;
      if (!hallId) {
        return NextResponse.json(
          { success: false, error: "hallId required" },
          { status: 400 }
        );
      }

      const hall = await prisma.hall.findUnique({
        where: { id: hallId },
        include: {
          pool: { select: { id: true, poolId: true, name: true } },
          ownerships: {
            where: { status: { in: ["active", "dormant"] } },
            include: {
              user: { select: { ledgerId: true, displayName: true } },
            },
          },
        },
      });

      if (!hall) {
        return NextResponse.json({ success: false, error: "Hall not found" }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        for (const o of hall.ownerships) {
          await tx.ownership.update({
            where: { id: o.id },
            data: { status: "forfeited" },
          });
        }

        await tx.hall.update({
          where: { id: hall.id },
          data: { status: "dissolved", closureStatus: "dissolved" },
        });

        await tx.pool.update({
          where: { id: hall.poolId },
          data: { status: "dissolved" },
        });

        await tx.closureProtocol.create({
          data: {
            hallId: hall.id,
            triggerMonth: new Date(),
            ahgiAtTrigger: hall.ahgiScore,
            revenueAtTrigger: 0,
            payrollAtTrigger: 0,
            phase: "dissolved",
            status: "completed",
            closedAt: new Date(),
          },
        });

        await tx.dormancyLog.create({
          data: {
            poolId: hall.poolId,
            hallId: hall.id,
            type: "asset",
            stage: "executed",
            message: reason || `Hall force-liquidated by admin ${user.ledgerId}. ${hall.ownerships.length} ownership(s) dissolved.`,
          },
        });

        await tx.auditEntry.create({
          data: {
            type: "dormancy_force_liquidated",
            description: `Hall ${hall.name} force-liquidated. ${hall.ownerships.length} ownership(s) dissolved. Asset returned to 8th Ledger.`,
            txHash: `DORM-LIQUIDATE-${hall.id}-${Date.now()}`,
            poolId: hall.poolId,
            ledgerId: user.ledgerId,
          },
        });

        return { dissolvedCount: hall.ownerships.length };
      });

      return NextResponse.json({
        success: true,
        liquidation: {
          hallId: hall.id,
          poolId: hall.poolId,
          poolName: hall.pool?.name,
          dissolvedOwnerships: result.dissolvedCount,
        },
        message: `${hall.pool?.name} force-liquidated. ${result.dissolvedCount} PAC(s) dissolved. Asset returned to 8th Ledger.`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "vault", "auction", "reclaim", or "force_liquidate"' },
      { status: 400 }
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}