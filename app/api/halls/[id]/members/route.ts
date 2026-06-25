import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership } from "@/lib/auth";

/* ============================================================
   GET /api/halls/[id]/members — 8th Ledger Sovereign Directory
   Ownership percentage. Executive Cabinet. Ban status.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: hallId } = await params;

    // ── 1. HALL EXISTS ───────────────────────────────────────
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { id: true, name: true, poolId: true, status: true },
    });
    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 }
      );
    }

    // ── 2. OWNERSHIP GATE ────────────────────────────────────
    const hasAccess = await verifyOwnership(user.id, undefined, hallId);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "Sovereign access denied",
          detail: "Commit to this pool to view the member directory.",
        },
        { status: 403 }
      );
    }

    // ── 3. FETCH MEMBERS ─────────────────────────────────────
    const [ownerships, roles, banRecords, impeachments, executiveCabinet] = await prisma.$transaction([
      // All active ownerships
      prisma.ownership.findMany({
        where: { hallId, status: { not: "forfeited" } },
        include: {
          user: {
            select: {
              id: true,
              ledgerId: true,
              displayName: true,
              avatar: true,
              kycTier: true,
              country: true,
              isBanned: true,
              lastActivityAt: true,
              createdAt: true,
            },
          },
        },
        orderBy: { ownershipPercent: "desc" },
      }),

      // All active roles (legacy)
      prisma.hallRole.findMany({
        where: { hallId, isImpeached: false },
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { electedAt: "desc" },
      }),

      // Ban records
      prisma.banRecord.findMany({
        where: { hallId },
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
            },
          },
          bannedBy: {
            select: {
              ledgerId: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Impeachment history (impeached roles)
      prisma.hallRole.findMany({
        where: { hallId, isImpeached: true },
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
            },
          },
        },
        orderBy: { impeachedAt: "desc" },
      }),

      // Executive Cabinet (8th Ledger)
      prisma.executiveCabinet.findUnique({
        where: { hallId },
        select: {
          speakerId: true,
          treasurerId: true,
          wardenId: true,
          scribeId: true,
          electedAt: true,
          expiresAt: true,
          isImpeached: true,
        },
      }),
    ]);

    // ── 4. BUILD DIRECTORY ───────────────────────────────────
    const memberMap = new Map();

    // Seed from ownerships
    for (const o of ownerships) {
      memberMap.set(o.user.ledgerId, {
        ledgerId: o.user.ledgerId,
        displayName: o.user.displayName,
        avatar: o.user.avatar,
        kycTier: o.user.kycTier,
        country: o.user.country,
        isBanned: o.user.isBanned,
        lastActivityAt: o.user.lastActivityAt,
        joinedAt: o.user.createdAt,
        ownershipPercent: o.ownershipPercent,
        pacToken: o.pacToken,
        totalReturned: o.totalReturned,
        totalFromMarket: o.totalFromMarket,
        ownershipStatus: o.status,
        dynamicValue: o.dynamicValue,
        accumulatedDividends: o.accumulatedDividends,
        pirDebt: o.pirDebt,
        role: o.role || "member",
        roleExpiresAt: null,
        electedAt: null,
        votesReceived: null,
        impeachedAt: null,
        impeachReason: null,
        banRecords: [],
        isExecutive: false,
        executiveRole: null,
      });
    }

    // Overlay legacy roles
    for (const r of roles) {
      const member = memberMap.get(r.user.ledgerId);
      if (member) {
        member.role = r.role;
        member.roleExpiresAt = r.expiresAt;
        member.electedAt = r.electedAt;
        member.votesReceived = r.votesReceived;
      }
    }

    // Overlay impeachments
    for (const i of impeachments) {
      const member = memberMap.get(i.user.ledgerId);
      if (member) {
        member.impeachedAt = i.impeachedAt;
        member.impeachReason = i.impeachReason;
      }
    }

    // Overlay Executive Cabinet (8th Ledger)
    if (executiveCabinet) {
      const execRoles = [
        { id: executiveCabinet.speakerId, role: "Speaker" },
        { id: executiveCabinet.treasurerId, role: "Treasurer" },
        { id: executiveCabinet.wardenId, role: "Warden" },
        { id: executiveCabinet.scribeId, role: "Scribe" },
      ];
      for (const exec of execRoles) {
        if (exec.id) {
          const member = memberMap.get(exec.id);
          if (member) {
            member.isExecutive = true;
            member.executiveRole = exec.role;
          }
        }
      }
    }

    // Overlay ban records
    for (const b of banRecords) {
      const member = memberMap.get(b.user.ledgerId);
      if (member) {
        member.isBanned = true;
        member.banRecords.push({
          reason: b.reason,
          duration: b.duration,
          expiresAt: b.expiresAt,
          isAppealed: b.isAppealed,
          appealReason: b.appealReason,
          bannedBy: b.bannedBy,
          createdAt: b.createdAt,
        });
      }
    }

    const members = Array.from(memberMap.values());

    // ── 5. HALL STATS ──────────────────────────────────────────
    const totalOwnership = members.reduce((s, m) => s + m.ownershipPercent, 0);
    const roleCounts = members.reduce((acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ── 6. AUDIT ─────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        eventType: "HALL_MEMBERS_VIEWED",
        description: `${user.displayName} viewed member directory for Hall ${hall.name}`,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({ hallId, memberCount: members.length }),
        txHash: `MEM-${hallId}-${Date.now()}`,
        visibleToPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      hall: {
        id: hall.id,
        name: hall.name,
        status: hall.status,
      },
      members,
      executiveCabinet: executiveCabinet
        ? {
            speakerId: executiveCabinet.speakerId,
            treasurerId: executiveCabinet.treasurerId,
            wardenId: executiveCabinet.wardenId,
            scribeId: executiveCabinet.scribeId,
            electedAt: executiveCabinet.electedAt,
            expiresAt: executiveCabinet.expiresAt,
            isImpeached: executiveCabinet.isImpeached,
          }
        : null,
      stats: {
        totalMembers: members.length,
        totalOwnershipPercent: totalOwnership,
        roleDistribution: roleCounts,
        bannedCount: members.filter((m) => m.isBanned).length,
        activeCount: members.filter((m) => !m.isBanned && m.ownershipStatus === "active").length,
        dormantCount: members.filter((m) => m.ownershipStatus === "dormant").length,
        executiveCount: members.filter((m) => m.isExecutive).length,
      },
    });
  } catch (error) {
    console.error("[MEMBERS GET]", error);
    return NextResponse.json(
      { success: false, error: "Member directory unavailable" },
      { status: 500 }
    );
  }
}