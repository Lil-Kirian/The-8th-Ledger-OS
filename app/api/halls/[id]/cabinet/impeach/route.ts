import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdminRole } from "@/lib/auth";

// POST /api/halls/[id]/cabinet/impeach
// Impeach an Executive Cabinet member. Creates a 51% capital-weighted proposal.
// 48-hour vote window. Only owners or admin may trigger.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    // Fetch hall with cabinet and active ownerships
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { id: true, poolId: true } },
        executiveCabinet: true,
        ownerships: {
          where: { status: "active" },
          select: { id: true, userId: true, ownershipPercent: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Verify caller is an active owner or admin
    const ownership = hall.ownerships.find((o) => o.userId === user.id);
    const isAdmin = isAdminRole(user.role);

    if (!ownership && !isAdmin) {
      return NextResponse.json(
        { error: "Only hall owners or the 8th Ledger may initiate impeachment." },
        { status: 403 }
      );
    }

    // Verify cabinet exists and is active
    if (!hall.executiveCabinet) {
      return NextResponse.json(
        { error: "No Executive Cabinet exists to impeach." },
        { status: 400 }
      );
    }

    const cabinet = hall.executiveCabinet;

    if (cabinet.isImpeached) {
      return NextResponse.json(
        { error: "The Executive Cabinet has already been impeached." },
        { status: 409 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(cabinet.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: "The Executive Cabinet term has already expired." },
        { status: 409 }
      );
    }

    // Check for existing active impeachment proposal
    const activeImpeachment = await prisma.proposal.findFirst({
      where: {
        hallId,
        type: "impeach",
        status: { in: ["pending", "active"] },
        endsAt: { gt: now },
      },
    });

    if (activeImpeachment) {
      return NextResponse.json(
        { error: "An impeachment vote is already in progress.", proposalId: activeImpeachment.id },
        { status: 409 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { targetRole, reason } = body as {
      targetRole: "speaker" | "treasurer" | "warden" | "scribe";
      reason: string;
    };

    if (!targetRole || !["speaker", "treasurer", "warden", "scribe"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Valid targetRole required: speaker, treasurer, warden, or scribe." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Impeachment reason must be at least 10 characters." },
        { status: 400 }
      );
    }

    // Map role to cabinet field
    const roleFieldMap: Record<string, keyof typeof cabinet> = {
      speaker: "speakerId",
      treasurer: "treasurerId",
      warden: "wardenId",
      scribe: "scribeId",
    };

    const cabinetField = roleFieldMap[targetRole] as keyof typeof cabinet;
    const targetUserId = cabinet[cabinetField] as string | null;

    if (!targetUserId) {
      return NextResponse.json(
        { error: `No ${targetRole} is currently seated in the cabinet.` },
        { status: 400 }
      );
    }

    // Fetch target user profile for the proposal description
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { ledgerId: true, displayName: true },
    });

    const roleLabels: Record<string, string> = {
      speaker: "The Speaker",
      treasurer: "The Treasurer",
      warden: "The Warden",
      scribe: "The Scribe",
    };

    // Create impeachment proposal
    const endsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const proposal = await prisma.proposal.create({
      data: {
        poolId: hall.pool.id,
        hallId,
        proposerId: user.id,
        title: `Impeachment of ${roleLabels[targetRole]}`,
        description: `Proposal to impeach ${roleLabels[targetRole]} (${targetUser?.displayName ?? targetUser?.ledgerId ?? targetUserId}).\n\nReason: ${reason.trim()}\n\nIf passed (51%), the ${targetRole} will be removed from the Executive Cabinet and a new election must be called within 14 days.`,
        type: "impeach",
        targetUserId: targetUserId,
        thresholdPercent: 51.0,
        status: "active",
        endsAt,
        executionResult: JSON.stringify({ targetRole, targetUserId, reason: reason.trim() }),
      },
    });

    // Log 8th Ledger update
    await prisma.eighthLedgerUpdate.create({
      data: {
        hallId,
        type: "IMPEACHMENT_INITIATED",
        title: `Impeachment of ${roleLabels[targetRole]} Initiated`,
        content: `An impeachment vote has been initiated by ${user.displayName} (${user.ledgerId}). Reason: ${reason.trim()}. Voting closes in 48 hours.`,
      },
    });

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      hallId,
      type: "impeach",
      targetRole,
      targetUserId,
      targetUserName: targetUser?.displayName ?? targetUser?.ledgerId,
      endsAt,
      thresholdPercent: 51,
      eligibleVoters: hall.ownerships.length,
      reason: reason.trim(),
      message: `Impeachment vote initiated. ${roleLabels[targetRole]} will be removed if 51% of capital votes in favor.`,
    });
  } catch (error: any) {
    console.error("[CABINET IMPEACH]", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}