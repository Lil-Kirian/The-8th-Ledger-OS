import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface ReportResponse {
  success: boolean;
  reports?: unknown[];
  report?: unknown;
  total?: number;
  error?: string;
  message?: string;
}

/* ============================================================
   GET /api/reports — List flagged listings (Primary Admin only)
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Sovereign authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get("poolId");
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
    const skip = (page - 1) * limit;

    const where: unknown = {};
    if (poolId) where.poolId = poolId;
    if (status) where.status = status;

    const [reports, total] = await prisma.$transaction([
      prisma.assetReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          pool: {
            select: {
              poolId: true,
              name: true,
              status: true,
              country: true,
              assetValue: true,
              reportedCount: true,
            },
          },
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              country: true,
              tier: true,
            },
          },
        },
      }),
      prisma.assetReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      reports,
      total,
    });
  } catch (error) {
    console.error("[REPORTS GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/reports — Flag a listing
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { poolId, reason, description } = body;

    if (!poolId || !reason || !description) {
      return NextResponse.json(
        { success: false, error: "Pool ID, reason, and description required" },
        { status: 400 }
      );
    }

    if (description.length < 10 || description.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Description must be 10–1000 characters" },
        { status: 400 }
      );
    }

    const pool = await prisma.pool.findUnique({ where: { poolId } });
    if (!pool) {
      return NextResponse.json(
        { success: false, error: "Pool not found" },
        { status: 404 }
      );
    }

    // Prevent duplicate reports from same user on same pool
    const existing = await prisma.assetReport.findFirst({
      where: { poolId, ledgerId: user.ledgerId, status: "pending" },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "You already have a pending report for this pool" },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.assetReport.create({
        data: {
          poolId,
          ledgerId: user.ledgerId,
          reason: reason.trim(),
          description: description.trim(),
          status: "pending",
        },
        include: {
          pool: { select: { poolId: true, name: true } },
          user: { select: { ledgerId: true, displayName: true } },
        },
      });

      await tx.pool.update({
        where: { poolId },
        data: { reportedCount: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: {
          eventType: "asset_reported",
          description: `${user.displayName} reported ${pool.name}: ${reason}`,
          poolId: pool.id,
          ledgerId: user.ledgerId,
          txHash: `REPORT-${poolId}-${Date.now()}`,
          visibleToPublic: false,
        },
      });

      return report;
    });

    return NextResponse.json({
      success: true,
      report: result,
      message: "Listing flagged for review",
    });
  } catch (error: unknown) {
    console.error("[REPORTS POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH /api/reports — Review / resolve / dismiss a report
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Sovereign authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportId, status, resolution } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: "Report ID and status required" },
        { status: 400 }
      );
    }

    const validStatuses = ["reviewed", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const report = await prisma.assetReport.findUnique({
      where: { id: reportId },
      include: { pool: { select: { id: true, poolId: true, name: true } } },
    });
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.assetReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: user.ledgerId,
      },
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            reportedCount: true,
          },
        },
        user: {
          select: {
            ledgerId: true,
            displayName: true,
          },
        },
      },
    });

    // If resolving, optionally suspend pool
    if (status === "resolved" && resolution === "suspend_pool") {
      await prisma.pool.update({
        where: { id: report.pool.id },
        data: { status: "suspended" },
      });
    }

    await prisma.auditLog.create({
      data: {
        eventType: "report_reviewed",
        description: `Report on ${report.pool.name} marked ${status} by ${user.displayName}.${resolution ? ` Resolution: ${resolution}` : ""}`,
        poolId: report.pool.id,
        ledgerId: user.ledgerId,
        txHash: `REPORT-REVIEW-${reportId}-${Date.now()}`,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      report: updated,
      message: `Report ${status}`,
    });
  } catch (error: unknown) {
    console.error("[REPORTS PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update report" },
      { status: 500 }
    );
  }
}