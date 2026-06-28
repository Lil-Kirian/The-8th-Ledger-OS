import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ============================================================
   TYPES
   ============================================================ */
interface AuditResponse {
  success: boolean;
  events?: any[];
  total?: number;
  error?: string;
}

/* ============================================================
   GET /api/audit — Public read-only event stream
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("type");
    const poolId = searchParams.get("poolId");
    const vinculumId = searchParams.get("vinculumId");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
    const skip = (page - 1) * limit;

    // Build where clause — public only
    const where: any = { visibleToPublic: true };
    if (eventType) where.eventType = { contains: eventType, mode: "insensitive" };
    if (poolId) where.poolId = poolId;
    if (vinculumId) where.vinculumId = vinculumId;

    const [events, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        include: {
          pool: {
            select: {
              poolId: true,
              name: true,
              status: true,
              winnerCountry: true,
            },
          },
          user: {
            select: {
              vinculumId: true,
              displayName: true,
              country: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json<AuditResponse>({
      success: true,
      events,
      total,
    });
  } catch (error) {
    console.error("[AUDIT STREAM]", error);
    return NextResponse.json<AuditResponse>(
      { success: false, error: "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}