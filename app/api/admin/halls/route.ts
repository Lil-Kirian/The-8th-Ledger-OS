import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   HELPERS
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
  console.error("[ADMIN_HALLS ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Hall operation failed" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/admin/halls — Primary Admin only
   view=halls (default) | view=chat
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
    const view = searchParams.get("view") || "halls";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    /* ── CHAT LOGS (Legacy) ── */
    if (view === "chat") {
      const hallId = searchParams.get("hallId");
      if (!hallId) {
        return NextResponse.json(
          { success: false, error: "hallId required for chat view" },
          { status: 400 }
        );
      }

      const [messages, total] = await Promise.all([
        prisma.hallMessage.findMany({
          where: { hallId },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: {
              select: {
                ledgerId: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        }),
        prisma.hallMessage.count({
          where: { hallId },
        }),
      ]);

      return NextResponse.json({
        success: true,
        messages: messages.reverse().map((m) => ({
          id: m.id,
          hallId: m.hallId,
          content: m.content,
          sender: m.user,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })),
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    /* ── HALLS LIST ── */
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.HallWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { pool: { name: { contains: search, mode: "insensitive" } } },
        { pool: { poolId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [halls, total] = await Promise.all([
      prisma.hall.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          pool: {
            select: {
              poolId: true,
              name: true,
              verticalId: true,
              status: true,
              listedPrice: true,
              committed: true,
              target: true,
              country: true,
            },
          },
          hallTreasury: {
            select: {
              balance: true,
              totalDistributed: true,
              totalRevenue: true,
            },
          },
          _count: {
            select: {
              ownerships: true,
              banRecords: true,
            },
          },
        },
      }),
      prisma.hall.count({ where }),
    ]);

    // Fetch PAC counts (active ownerships) in bulk
    const hallIds = halls.map((h) => h.id);
    const pacCounts = await prisma.ownership.groupBy({
      by: ["hallId"],
      where: {
        hallId: { in: hallIds },
        status: "active",
      },
      _count: true,
    });
    const pacMap = new Map(pacCounts.map((p) => [p.hallId, p._count]));

    // Fetch active bans in bulk (schema has no status field; check expiresAt)
    const allBans = await prisma.banRecord.findMany({
      where: { hallId: { in: hallIds } },
      select: { hallId: true, expiresAt: true },
    });
    const activeBanMap = new Map<string, number>();
    for (const ban of allBans) {
      const isActive = !ban.expiresAt || ban.expiresAt > new Date();
      if (isActive) {
        activeBanMap.set(ban.hallId, (activeBanMap.get(ban.hallId) || 0) + 1);
      }
    }

    const enriched = halls.map((h) => ({
      id: h.id,
      name: h.name,
      status: h.status,
      hallClass: h.hallClass,
      sriScore: h.sriScore,
      ahgiScore: h.ahgiScore,
      closureStatus: h.closureStatus,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      pool: h.pool,
      treasury: h.hallTreasury,
      stats: {
        totalMembers: h._count.ownerships,
        activePacs: pacMap.get(h.id) || 0,
        totalBans: h._count.banRecords,
        activeBans: activeBanMap.get(h.id) || 0,
      },
    }));

    return NextResponse.json({
      success: true,
      halls: enriched,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   POST /api/admin/halls — Primary Admin override ban/unban
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
    const { hallId, userId, action, reason, durationDays } = body;

    if (!hallId || !userId || !action) {
      return NextResponse.json(
        { success: false, error: "hallId, userId, and action required" },
        { status: 400 }
      );
    }

    if (!["ban", "unban"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action must be 'ban' or 'unban'" },
        { status: 400 }
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { pool: { select: { id: true, poolId: true } } },
    });

    if (!hall) {
      return NextResponse.json({ success: false, error: "Hall not found" }, { status: 404 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, ledgerId: true, displayName: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (action === "ban") {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "reason required for ban action" },
          { status: 400 }
        );
      }

      const expiresAt = durationDays
        ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000)
        : null;

      await prisma.$transaction(async (tx) => {
        // Expire any existing active bans first (clean slate)
        await tx.banRecord.updateMany({
          where: {
            hallId: hall.id,
            userId: targetUser.id,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          data: { expiresAt: new Date() },
        });

        // Create new ban
        await tx.banRecord.create({
          data: {
            hallId: hall.id,
            userId: targetUser.id,
            reason: reason.trim(),
            bannedById: user.id,
            expiresAt,
          },
        });

        // Sync ownership status
        await tx.ownership.updateMany({
          where: { hallId: hall.id, userId: targetUser.id },
          data: { status: "banned" },
        });
      });

      await prisma.auditEntry.create({
        data: {
          type: "hall_ban_override",
          description: `Primary Admin banned ${targetUser.displayName} (${targetUser.ledgerId}) from Hall ${hall.name}. Reason: ${reason}`,
          txHash: `BAN-${hall.id}-${targetUser.id}-${Date.now()}`,
          ledgerId: user.ledgerId,
          poolId: hall.pool?.id || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        ban: {
          hallId: hall.id,
          userId: targetUser.id,
          displayName: targetUser.displayName,
          reason: reason.trim(),
          expiresAt,
        },
        message: `${targetUser.displayName} banned from ${hall.name}.${expiresAt ? ` Expires: ${expiresAt.toISOString()}` : ""}`,
      });
    }

    /* ── UNBAN ── */
    await prisma.$transaction(async (tx) => {
      await tx.banRecord.updateMany({
        where: {
          hallId: hall.id,
          userId: targetUser.id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        data: { expiresAt: new Date() },
      });

      await tx.ownership.updateMany({
        where: { hallId: hall.id, userId: targetUser.id },
        data: { status: "active" },
      });
    });

    await prisma.auditEntry.create({
      data: {
        type: "hall_unban_override",
        description: `Primary Admin lifted ban on ${targetUser.displayName} (${targetUser.ledgerId}) from Hall ${hall.name}`,
        txHash: `UNBAN-${hall.id}-${targetUser.id}-${Date.now()}`,
        ledgerId: user.ledgerId,
        poolId: hall.pool?.id || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      unban: {
        hallId: hall.id,
        userId: targetUser.id,
        displayName: targetUser.displayName,
      },
      message: `${targetUser.displayName} unbanned from ${hall.name}.`,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}