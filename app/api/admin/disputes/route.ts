import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   8TH LEDGER — DISPUTE ADMIN API
   Arbitration, resolution, and enforcement
   ============================================================ */

/* ============================================================
   GET — List Disputes
   ============================================================ */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isPrimaryAdmin(user)) return NextResponse.json({ success: false, error: "Primary admin authority required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";
  const sort = searchParams.get("sort") || "createdAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const where: unknown = {};
  if (status !== "all") where.status = status;
  if (type !== "all") where.type = type;
  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { poolId: { contains: q, mode: "insensitive" } },
      { ledgerId: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: unknown = {};
  if (["createdAt", "resolvedAt"].includes(sort)) {
    orderBy[sort] = dir;
  } else {
    orderBy.createdAt = "desc";
  }

  try {
    const disputes = await prisma.dispute.findMany({
      where,
      orderBy,
      take: 100,
      select: {
        id: true,
        poolId: true,
        ledgerId: true,
        type: true,
        description: true,
        evidence: true,
        status: true,
        resolution: true,
        createdAt: true,
        resolvedAt: true,
        resolvedBy: true,
      },
    });

    // Enrich with pool names and user names
    const poolIds = [...new Set(disputes.map((d) => d.poolId))];
    const userIds = [...new Set(disputes.map((d) => d.ledgerId))];
    const [pools, users] = await Promise.all([
      prisma.pool.findMany({ where: { poolId: { in: poolIds } }, select: { poolId: true, name: true } }),
      prisma.user.findMany({ where: { ledgerId: { in: userIds } }, select: { ledgerId: true, displayName: true } }),
    ]);
    const poolMap = new Map(pools.map((p) => [p.poolId, p.name]));
    const userMap = new Map(users.map((u) => [u.ledgerId, u.displayName]));

    const enriched = disputes.map((d) => ({
      ...d,
      poolName: poolMap.get(d.poolId) || d.poolId,
      userName: userMap.get(d.ledgerId) || d.ledgerId,
    }));

    return NextResponse.json({ success: true, disputes: enriched });
  } catch (err) {
    console.error("[ADMIN_DISPUTES ERROR]", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

/* ============================================================
   PATCH — Resolve / Mediate Disputes
   ============================================================ */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isPrimaryAdmin(user)) return NextResponse.json({ success: false, error: "Primary admin authority required" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { action, disputeId, resolution } = body;
  if (!action || !disputeId) {
    return NextResponse.json({ success: false, error: "Missing action or disputeId" }, { status: 400 });
  }

  try {
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) return NextResponse.json({ success: false, error: "Dispute not found" }, { status: 404 });
    if (dispute.status !== "open") {
      return NextResponse.json({ success: false, error: "Dispute already closed" }, { status: 400 });
    }

    let message = "";
    let poolUpdate: unknown = null;
    let userUpdate: unknown = null;

    switch (action) {
      case "resolve":
        await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: "resolved",
            resolution: resolution || "Resolved by admin",
            resolvedAt: new Date(),
            resolvedBy: user.ledgerId,
          },
        });
        message = `Dispute resolved: ${resolution || "No notes"}`;
        break;

      case "dismiss":
        await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: "resolved",
            resolution: resolution || "Dismissed as invalid",
            resolvedAt: new Date(),
            resolvedBy: user.ledgerId,
          },
        });
        message = "Dispute dismissed.";
        break;

      case "slash-pool":
        poolUpdate = await prisma.pool.update({
          where: { poolId: dispute.poolId },
          data: { status: "rejected", isVerified: false },
        });
        await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: "resolved",
            resolution: resolution || "Pool slashed by arbitration",
            resolvedAt: new Date(),
            resolvedBy: user.ledgerId,
          },
        });
        message = `Pool ${dispute.poolId} slashed. Asset removed from public view.`;
        break;

      case "cancel-pool":
        poolUpdate = await prisma.pool.update({
          where: { poolId: dispute.poolId },
          data: { status: "rejected", isVerified: false },
        });
        await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: "resolved",
            resolution: resolution || "Pool cancelled by arbitration",
            resolvedAt: new Date(),
            resolvedBy: user.ledgerId,
          },
        });
        message = `Pool ${dispute.poolId} cancelled. All participants notified.`;
        break;

      case "ban-user":
        userUpdate = await prisma.user.update({
          where: { ledgerId: dispute.ledgerId },
          data: {
            isBanned: true,
            banReason: resolution || "Banned by admin dispute resolution",
          },
        });
        await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: "resolved",
            resolution: resolution || "Reporter banned",
            resolvedAt: new Date(),
            resolvedBy: user.ledgerId,
          },
        });
        message = `Subject ${dispute.ledgerId} banned.`;
        break;

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "ADMIN_DISPUTE_ACTION",
        description: message,
        poolId: dispute.poolId,
        ledgerId: dispute.ledgerId,
        metadata: JSON.stringify({ action, disputeId, resolution, poolUpdate, userUpdate }),
        txHash: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("[ADMIN_DISPUTES PATCH ERROR]", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}