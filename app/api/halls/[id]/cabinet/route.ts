import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAuth, requireHallAccess } from "@/lib/auth";

// GET /api/halls/[id]/cabinet
// Returns current Executive Cabinet with enriched member profiles
// Only hall owners and admins may access
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    // Verify user is an active owner of this hall OR admin
    const ownership = await prisma.ownership.findFirst({
      where: {
        hallId,
        userId: user.id,
        status: "active",
      },
      select: { id: true, ownershipPercent: true },
    });

    const isAdmin = user.role === "admin";
    const isPrimaryAdmin = user.isPrimaryAdmin === true;

    if (!ownership && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Only hall owners may view the Executive Cabinet." },
        { status: 403 }
      );
    }

    // Fetch hall with cabinet and ownership count
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        executiveCabinet: true,
        pool: {
          select: {
            id: true,
            poolId: true,
            verticalId: true,
            name: true,
          },
        },
        _count: {
          select: {
            ownerships: {
              where: { status: "active" },
            },
          },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // If no cabinet exists yet (Ghost Hall before first election)
    if (!hall.executiveCabinet) {
      return NextResponse.json({
        hallId: hall.id,
        hallName: hall.name,
        hallClass: hall.hallClass,
        sriScore: hall.sriScore,
        ahgiScore: hall.ahgiScore,
        status: hall.status,
        cabinet: null,
        message: "No Executive Cabinet elected yet. Election required before hall goes Live.",
        totalOwners: hall._count.ownerships,
        isOwner: !!ownership,
        ownershipPercent: ownership?.ownershipPercent ?? 0,
        canElect: !!ownership || isAdmin,
        canImpeach: !!ownership || isAdmin,
      });
    }

    const cabinet = hall.executiveCabinet;

    // Fetch member profiles in parallel
    const memberIds = {
      speaker: cabinet.speakerId,
      treasurer: cabinet.treasurerId,
      warden: cabinet.wardenId,
      scribe: cabinet.scribeId,
    };

    const memberProfiles = await Promise.all(
      Object.entries(memberIds).map(async ([role, userId]) => {
        if (!userId) return { role, user: null };
        const profile = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            ledgerId: true,
            displayName: true,
            avatar: true,
            kycTier: true,
            globalSriScore: true,
            country: true,
          },
        });
        return { role, user: profile };
      })
    );

    const members = memberProfiles.reduce((acc, { role, user }) => {
      const labels: Record<string, { label: string; function: string }> = {
        speaker: { label: "The Speaker", function: "Voice of the hall. Proposes strategies. Appeals to 8th Ledger." },
        treasurer: { label: "The Treasurer", function: "Read-only treasury. Reviews revenue. Flags anomalies." },
        warden: { label: "The Warden", function: "Monitors insurance, maintenance, security, staffing." },
        scribe: { label: "The Scribe", function: "Communications. Publishes reports. Coordinates messaging." },
      };
      acc[role] = user
        ? {
            ...user,
            role,
            roleLabel: labels[role].label,
            roleFunction: labels[role].function,
          }
        : null;
      return acc;
    }, {} as Record<string, any>);

    // Calculate term status
    const now = new Date();
    const expiresAt = new Date(cabinet.expiresAt);
    const electedAt = new Date(cabinet.electedAt);
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const termTotalDays = Math.ceil((expiresAt.getTime() - electedAt.getTime()) / (1000 * 60 * 60 * 24));
    const termProgressPercent = Math.min(100, Math.max(0, Math.round(((termTotalDays - daysRemaining) / termTotalDays) * 100)));

    const isActive = !cabinet.isImpeached && now < expiresAt;

    return NextResponse.json({
      hallId: hall.id,
      hallName: hall.name,
      hallClass: hall.hallClass,
      sriScore: hall.sriScore,
      ahgiScore: hall.ahgiScore,
      status: hall.status,
      cabinet: {
        id: cabinet.id,
        electedAt: cabinet.electedAt,
        expiresAt: cabinet.expiresAt,
        isImpeached: cabinet.isImpeached,
        impeachedAt: cabinet.impeachedAt,
        impeachReason: cabinet.impeachReason,
        isActive,
        daysRemaining,
        termTotalDays,
        termProgressPercent,
        members,
      },
      totalOwners: hall._count.ownerships,
      isOwner: !!ownership,
      ownershipPercent: ownership?.ownershipPercent ?? 0,
      canElect: isAdmin || (!cabinet.isImpeached && isActive && daysRemaining <= 14),
      canImpeach: (!!ownership || isAdmin) && isActive && !cabinet.isImpeached,
    });
  } catch (error: any) {
    console.error("[CABINET GET]", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}