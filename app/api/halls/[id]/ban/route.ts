import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireManagerRole, requireLiaisonRole, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   GET /api/halls/[id]/ban — Ban list + appeal status
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;

    // Ownership gate
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id, status: { not: "forfeited" } },
    });
    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 }
      );
    }

    const bans = await prisma.banRecord.findMany({
      where: { hallId },
      include: {
        user: {
          select: { ledgerId: true, displayName: true, avatar: true },
        },
        bannedBy: {
          select: { ledgerId: true, displayName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      bans: bans.map((b) => ({
        id: b.id,
        user: b.user,
        bannedBy: b.bannedBy,
        reason: b.reason,
        evidence: b.evidence,
        duration: b.duration,
        expiresAt: b.expiresAt,
        isAppealed: b.isAppealed,
        appealReason: b.appealReason,
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error("[BAN GET]", error);
    return NextResponse.json({ success: false, error: "Ban list unavailable" }, { status: 500 });
  }
}

/* ============================================================
   POST /api/halls/[id]/ban — Propose ban (Manager/Liaison only)
   Requires trigger by elected role. Community vote to enforce.
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { targetUserId, reason, evidence, duration = "permanent" } = body;

    if (!targetUserId || !reason) {
      return NextResponse.json(
        { success: false, error: "targetUserId and reason required" },
        { status: 400 }
      );
    }

    // ── 1. ROLE GATE ─────────────────────────────────────────
    let hasTriggerPower = false;
    try {
      await requireManagerRole(hallId, user.id);
      hasTriggerPower = true;
    } catch {
      try {
        await requireLiaisonRole(hallId, user.id);
        hasTriggerPower = true;
      } catch {
        // Neither
      }
    }

    if (!hasTriggerPower && !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Manager or Liaison role required to propose bans",
          detail: "Only elected Managers or Liaisons can trigger ban proposals.",
        },
        { status: 403 }
      );
    }

    // ── 2. VALIDATE TARGET ───────────────────────────────────
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { ledgerId: true, displayName: true },
    });
    if (!target) {
      return NextResponse.json({ success: false, error: "Target user not found" }, { status: 404 });
    }

    // Cannot ban self
    if (targetUserId === user.id) {
      return NextResponse.json({ success: false, error: "Cannot ban yourself" }, { status: 400 });
    }

    // Cannot ban primary admin
    if (isPrimaryAdmin(target.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Cannot ban the 8th Ledger Primary Admin" },
        { status: 403 }
      );
    }

    // ── 3. CREATE BAN PROPOSAL ───────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // Create ban record (pending — not yet enforced)
      const ban = await tx.banRecord.create({
        data: {
          hallId,
          userId: targetUserId,
          bannedById: user.id,
          reason,
          evidence: evidence || null,
          duration,
          expiresAt: duration === "permanent" ? null : new Date(Date.now() + parseDuration(duration)),
          isAppealed: false,
        },
      });

      // Auto-create proposal for community vote
      const proposal = await tx.proposal.create({
        data: {
          poolId: (await tx.hall.findUnique({ where: { id: hallId }, select: { poolId: true } }))?.poolId || "",
          hallId,
          proposerId: user.id,
          title: `Ban ${target.displayName}`,
          description: `Proposed ban: ${reason}. Evidence: ${evidence || "None provided"}. Duration: ${duration}.`,
          type: "impeach_manager", // Using impeach type as ban proxy
          status: "active",
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to vote
          thresholdPercent: 51.0,
        },
      });

      // Hall activity
      await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "ban",
          description: `Ban proposed for ${target.displayName}: ${reason}`,
          metadata: JSON.stringify({ banId: ban.id, proposalId: proposal.id, targetUserId }),
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          ledgerId: target.ledgerId,
          type: "ban_proposed",
          title: "Ban Proposal Filed Against You",
          message: `A ban has been proposed in Hall ${hallId}. Reason: ${reason}. Vote ends in 7 days.`,
          actionUrl: `/halls/${hallId}/tribunal`,
        },
      });

      return { ban, proposal };
    });

    return NextResponse.json({
      success: true,
      ban: result.ban,
      proposalId: result.proposal.id,
      message: `Ban proposed for ${target.displayName}. Community must vote 51% to enforce.`,
    });
  } catch (error: any) {
    console.error("[BAN POST]", error);
    return NextResponse.json({ success: false, error: error.message || "Ban proposal failed" }, { status: 500 });
  }
}

/* ============================================================
   PATCH /api/halls/[id]/ban — Appeal ban
   Banned user submits appeal. Community votes to overturn.
   ============================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { banId, appealReason } = body;

    if (!banId || !appealReason) {
      return NextResponse.json(
        { success: false, error: "banId and appealReason required" },
        { status: 400 }
      );
    }

    const ban = await prisma.banRecord.findFirst({
      where: { id: banId, hallId, userId: user.id },
    });
    if (!ban) {
      return NextResponse.json(
        { success: false, error: "Ban record not found or not yours" },
        { status: 404 }
      );
    }
    if (ban.isAppealed) {
      return NextResponse.json(
        { success: false, error: "Appeal already submitted" },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update ban with appeal
      const updated = await tx.banRecord.update({
        where: { id: banId },
        data: {
          isAppealed: true,
          appealReason,
        },
      });

      // Create overturn proposal
      const proposal = await tx.proposal.create({
        data: {
          poolId: (await tx.hall.findUnique({ where: { id: hallId }, select: { poolId: true } }))?.poolId || "",
          hallId,
          proposerId: user.id,
          title: `Overturn Ban on ${user.displayName}`,
          description: `Appeal: ${appealReason}`,
          type: "impeach_manager",
          status: "active",
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          thresholdPercent: 51.0,
        },
      });

      // Activity
      await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "ban",
          description: `${user.displayName} appealed ban. Reason: ${appealReason}`,
          metadata: JSON.stringify({ banId, proposalId: proposal.id }),
        },
      });

      return { updated, proposal };
    });

    return NextResponse.json({
      success: true,
      ban: result.updated,
      proposalId: result.proposal.id,
      message: "Appeal submitted. Community must vote 51% to overturn.",
    });
  } catch (error: any) {
    console.error("[BAN PATCH]", error);
    return NextResponse.json({ success: false, error: error.message || "Appeal failed" }, { status: 500 });
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function parseDuration(duration: string): number {
  const map: Record<string, number> = {
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    permanent: 100 * 365 * 24 * 60 * 60 * 1000,
  };
  return map[duration] || map.permanent;
}