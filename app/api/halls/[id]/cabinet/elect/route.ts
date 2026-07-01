import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdminRole } from "@/lib/auth";

// POST /api/halls/[id]/cabinet/elect
// Call an Executive Cabinet election. Creates a capital-weighted proposal.
// 48-hour vote window. 51% threshold. Only owners or admin can trigger.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    // Verify hall exists and user has access
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

    // Only owners or admin can call election
    const ownership = hall.ownerships.find((o) => o.userId === user.id);
    const isAdmin = isAdminRole(user.role);
    const isPrimaryAdmin = user.isPrimaryAdmin === true;

    if (!ownership && !isAdmin) {
      return NextResponse.json(
        { error: "Only hall owners or the 8th Ledger may call an election." },
        { status: 403 }
      );
    }

    // Check if election already active
    const activeElection = await prisma.proposal.findFirst({
      where: {
        hallId,
        type: "cabinet_elect",
        status: { in: ["pending", "active"] },
        endsAt: { gt: new Date() },
      },
    });

    if (activeElection) {
      return NextResponse.json(
        { error: "An election is already in progress.", proposalId: activeElection.id },
        { status: 409 }
      );
    }

    // Check if current cabinet is still valid and not near expiry
    if (hall.executiveCabinet && !hall.executiveCabinet.isImpeached) {
      const now = new Date();
      const expiresAt = new Date(hall.executiveCabinet.expiresAt);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Block if cabinet is healthy and >14 days remain (unless primary admin override)
      if (daysRemaining > 14 && !isPrimaryAdmin) {
        return NextResponse.json(
          {
            error: "Current cabinet term has more than 14 days remaining. Election blocked.",
            daysRemaining,
            expiresAt,
          },
          { status: 403 }
        );
      }
    }

    // Parse nominees from body
    const body = await req.json();
    const { nominees } = body as {
      nominees: {
        speakerId?: string;
        treasurerId?: string;
        wardenId?: string;
        scribeId?: string;
      };
    };

    // Validate nominees are active owners
    const nomineeIds = [
      nominees?.speakerId,
      nominees?.treasurerId,
      nominees?.wardenId,
      nominees?.scribeId,
    ].filter(Boolean) as string[];

    if (nomineeIds.length === 0) {
      return NextResponse.json(
        { error: "At least one nominee required." },
        { status: 400 }
      );
    }

    // All nominees must be active owners of this hall
    const validOwners = hall.ownerships.filter((o) => nomineeIds.includes(o.userId));
    const validOwnerIds = new Set(validOwners.map((o) => o.userId));

    const invalid = nomineeIds.filter((id) => !validOwnerIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: "All nominees must be active owners of this hall.", invalid },
        { status: 400 }
      );
    }

    // Ensure no duplicate nominees across roles
    const uniqueNominees = new Set(nomineeIds);
    if (uniqueNominees.size !== nomineeIds.length) {
      return NextResponse.json(
        { error: "Each nominee can only run for one role." },
        { status: 400 }
      );
    }

    // Build election description
    const roleLabels: Record<string, string> = {
      speakerId: "The Speaker",
      treasurerId: "The Treasurer",
      wardenId: "The Warden",
      scribeId: "The Scribe",
    };

    const nomineeDescriptions = Object.entries(nominees)
      .filter(([, id]) => !!id)
      .map(([role, id]) => {
        const owner = validOwners.find((o) => o.userId === id);
        return `${roleLabels[role]}: ${owner?.ownershipPercent ?? 0}% owner`;
      })
      .join("\n");

    // Create the election proposal
    const endsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const proposal = await prisma.proposal.create({
      data: {
        poolId: hall.pool.id,
        hallId,
        proposerId: user.id,
        title: "Executive Cabinet Election",
        description: `Elect the Executive Cabinet for Hall ${hall.name}.\n\nNominees:\n${nomineeDescriptions}\n\nTerm: 6 months. All executives propose and oversee only — they cannot spend hall funds.`,
        type: "cabinet_elect",
        thresholdPercent: 51.0,
        status: "active",
        endsAt,
        // Store nominees in metadata via a hidden field or we can use executionResult
        executionResult: JSON.stringify(nominees),
      },
    });

    // Create 8th Ledger update
    await prisma.eighthLedgerUpdate.create({
      data: {
        hallId,
        type: "ELECTION_CALLED",
        title: "Executive Cabinet Election Called",
        content: `An election has been called. Voting closes in 48 hours. ${hall.ownerships.length} owners eligible.`,
      },
    });

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      hallId,
      type: "cabinet_elect",
      endsAt,
      thresholdPercent: 51,
      eligibleVoters: hall.ownerships.length,
      nominees,
      message: "Election called. Owners must vote within 48 hours.",
    });
  } catch (error: any) {
    console.error("[CABINET ELECT]", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}