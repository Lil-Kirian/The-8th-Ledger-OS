import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   GET /api/audit/trail — Public audit trail (paginated JSON)
   Returns visible-to-public entries + user's own entries.
   ============================================================ */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const skip = (page - 1) * limit;
    const eventType = searchParams.get("type");

    const where: any = {
      OR: [{ visibleToPublic: true }, { ledgerId: user.ledgerId }],
    };
    if (eventType) where.eventType = eventType;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { ledgerId: true, displayName: true } },
          pool: { select: { poolId: true, name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      hasMore: skip + logs.length < total,
    });
  } catch (error) {
    console.error("[AUDIT TRAIL]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}