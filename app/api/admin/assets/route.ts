import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   8TH LEDGER — ASSET ADMIN API
   Asset verification, reporting, and moderation
   ============================================================ */

/* ============================================================
   GET — Assets + Reports
   ============================================================ */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isPrimaryAdmin(user)) return NextResponse.json({ success: false, error: "Primary admin authority required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const verified = searchParams.get("verified") || "pending";
  const sort = searchParams.get("sort") || "createdAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const where: any = {};
  if (verified === "pending") where.isVerified = false;
  if (verified === "verified") where.isVerified = true;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { poolId: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { verticalId: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: any = {};
  if (["assetValue", "committed", "participants", "createdAt", "reportedCount"].includes(sort)) {
    orderBy[sort] = dir;
  } else {
    orderBy.createdAt = "desc";
  }

  try {
    const assets = await prisma.pool.findMany({
      where,
      orderBy,
      take: 50,
      select: {
        id: true,
        poolId: true,
        name: true,
        description: true,
        imageUrl: true,
        assetValue: true,
        country: true,
        verticalId: true,
        creatorId: true,
        committed: true,
        participants: true,
        maxParticipants: true,
        status: true,
        isVerified: true,
        reportedCount: true,
        createdAt: true,
        closesAt: true,
        hallClass: true,
        trueCost: true,
        listedPrice: true,
      },
    });

    // Enrich with creator name
    const creatorIds = [...new Set(assets.map((a) => a.creatorId))];
    const creators = await prisma.user.findMany({
      where: { ledgerId: { in: creatorIds } },
      select: { ledgerId: true, displayName: true },
    });
    const creatorMap = new Map(creators.map((c) => [c.ledgerId, c.displayName]));

    const enrichedAssets = assets.map((a) => ({
      ...a,
      creatorName: creatorMap.get(a.creatorId) || a.creatorId,
    }));

    // Fetch pending reports
    const reports = await prisma.assetReport.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        poolId: true,
        ledgerId: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    // Enrich reports with pool name and reporter name
    const reportPoolIds = [...new Set(reports.map((r) => r.poolId))];
    const reportUserIds = [...new Set(reports.map((r) => r.ledgerId))];
    const [pools, users] = await Promise.all([
      prisma.pool.findMany({ where: { poolId: { in: reportPoolIds } }, select: { poolId: true, name: true } }),
      prisma.user.findMany({ where: { ledgerId: { in: reportUserIds } }, select: { ledgerId: true, displayName: true } }),
    ]);
    const poolMap = new Map(pools.map((p) => [p.poolId, p.name]));
    const userMap = new Map(users.map((u) => [u.ledgerId, u.displayName]));

    const enrichedReports = reports.map((r) => ({
      ...r,
      poolName: poolMap.get(r.poolId) || r.poolId,
      reporterName: userMap.get(r.ledgerId) || r.ledgerId,
    }));

    return NextResponse.json({ success: true, assets: enrichedAssets, reports: enrichedReports });
  } catch (err) {
    console.error("[ADMIN_ASSETS ERROR]", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

/* ============================================================
   PATCH — Approve / Reject / Report actions
   ============================================================ */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isPrimaryAdmin(user)) return NextResponse.json({ success: false, error: "Primary admin authority required" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { action, poolId, reportId } = body;

  try {
    let message = "";

    if (action === "approve" && poolId) {
      await prisma.pool.update({ where: { poolId }, data: { isVerified: true } });
      message = `Asset ${poolId} approved and is now live.`;
    } else if (action === "reject" && poolId) {
      await prisma.pool.update({ where: { poolId }, data: { status: "rejected", isVerified: false } });
      message = `Asset ${poolId} rejected and removed from public view.`;
    } else if (action === "dismiss-report" && reportId) {
      await prisma.assetReport.update({ where: { id: reportId }, data: { status: "dismissed", reviewedAt: new Date() } });
      message = "Report dismissed.";
    } else if (action === "remove-reported" && reportId) {
      const report = await prisma.assetReport.findUnique({ where: { id: reportId } });
      if (report) {
        await prisma.pool.update({ where: { poolId: report.poolId }, data: { status: "rejected", isVerified: false } });
        await prisma.assetReport.update({ where: { id: reportId }, data: { status: "resolved", reviewedAt: new Date() } });
        message = "Asset removed and report resolved.";
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "ADMIN_ASSET_ACTION",
        description: message,
        poolId: poolId || undefined,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({ action, reportId, admin: user.ledgerId }),
        txHash: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("[ADMIN_ASSETS PATCH ERROR]", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}