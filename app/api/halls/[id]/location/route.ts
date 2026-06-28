import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyOwnership, isPrimaryAdmin } from "@/lib/auth";

const APPLICABLE_VERTICALS = [
  "ledgerbiz",
  "ledgeragri",
  "ledgeraccess",
  "ledgertravel",
];

/* ============================================================
   GET /api/halls/[id]/location — 3 location options + current vote
   V3.2: locationOptions sourced from LocationOption relation ONLY.
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: hallId } = await params;

    const isOwner = await verifyOwnership(user.id, undefined, hallId);
    if (!isOwner && !(await isPrimaryAdmin(user)) && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 },
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        /* ── V3.2: Location options from relation ONLY ── */
        pool: {
          select: {
            verticalId: true,
            id: true,
            locationOptionsList: true,
          },
        },
      },
    });

    if (!hall?.pool) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    if (!APPLICABLE_VERTICALS.includes(hall.pool.verticalId.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Location voting not applicable for ${hall.pool.verticalId}`,
        },
        { status: 400 },
      );
    }

    // ── V3.2: Map LocationOption relation to frontend format ──
    const options = (hall.pool.locationOptionsList || []).map((opt) => ({
      id: opt.id,
      label: opt.name,
      description: opt.description || undefined,
      coordinates:
        opt.lat && opt.lng ? { lat: opt.lat, lng: opt.lng } : undefined,
      data: {
        address: opt.address,
        cost: opt.cost,
        image: opt.image,
        votes: opt.votes,
        voteWeight: opt.voteWeight,
        isSelected: opt.isSelected,
      } as Record<string, unknown>,
    }));

    // Fallback: if no options stored, return empty with flag
    if (options.length === 0) {
      return NextResponse.json({
        success: true,
        location: {
          options: [],
          selected: null,
          voteTally: [],
          applicable: true,
          needsSetup: true,
        },
        message:
          "No location options configured. Primary admin must set 3 options on pool creation.",
      });
    }

    // ── Active location_select proposal ──
    const activeProposal = await prisma.proposal.findFirst({
      where: {
        hallId,
        type: "location_select",
        status: { in: ["active", "pending", "passed"] },
      },
      include: {
        votes: { select: { userId: true, choice: true, weight: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Build vote tally per option ──
    const voteTally = options.map((opt) => {
      const votesFor =
        activeProposal?.votes.filter((v) => v.choice === opt.id) || [];
      const totalWeight = votesFor.reduce((sum, v) => sum + (v.weight || 0), 0);
      return {
        optionId: opt.id,
        label: opt.label,
        votes: votesFor.length,
        weight: totalWeight,
      };
    });

    const totalVotedWeight = voteTally.reduce((sum, v) => sum + v.weight, 0);
    const selected = activeProposal?.locationOption || null;

    return NextResponse.json({
      success: true,
      location: {
        options: options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          description: opt.description,
          coordinates: opt.coordinates,
          data: opt.data,
        })),
        selected,
        voteTally: voteTally.map((v) => ({
          ...v,
          percent:
            totalVotedWeight > 0
              ? Number(((v.weight / totalVotedWeight) * 100).toFixed(2))
              : 0,
        })),
        activeProposalId: activeProposal?.id || null,
        activeProposalStatus: activeProposal?.status || null,
        endsAt: activeProposal?.endsAt || null,
        applicable: true,
        needsSetup: false,
      },
    });
  } catch (error) {
    console.error("[HALL LOCATION GET]", error);
    return NextResponse.json(
      { success: false, error: "Location registry unreachable" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/halls/[id]/location — Vote on location option
   V3.2: Ownership queried directly for voting weight.
   Location options from relation ONLY.
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { optionId, reason } = body;

    if (!optionId || typeof optionId !== "string") {
      return NextResponse.json(
        { success: false, error: "optionId required" },
        { status: 400 },
      );
    }

    // ── V3.2: Ownership gate + weight from Ownership model ──
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id, status: { not: "forfeited" } },
      select: { ownershipPercent: true, role: true },
    });
    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 },
      );
    }

    const weight = ownership.ownershipPercent || 0;
    if (weight <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid voting weight" },
        { status: 400 },
      );
    }

    // ── Dormancy & ban checks ──
    const isDormant = await prisma.dormancyLog.findFirst({
      where: {
        OR: [{ userId: user.id }, { hallId }],
        type: "account",
        stage: { in: ["warning", "critical", "forfeited"] },
      },
    });
    if (isDormant) {
      return NextResponse.json(
        { success: false, error: "Account dormancy active. Voting suspended." },
        { status: 403 },
      );
    }

    const isBanned = await prisma.banRecord.findFirst({
      where: {
        hallId,
        userId: user.id,
        OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
      },
    });
    if (isBanned) {
      return NextResponse.json(
        { success: false, error: "Banned from this Hall. Cannot vote." },
        { status: 403 },
      );
    }

    // ── Hall & pool validation ──
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        /* ── V3.2: Location options from relation ONLY ── */
        pool: {
          select: {
            verticalId: true,
            id: true,
            locationOptionsList: true,
          },
        },
      },
    });

    if (!hall?.pool) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    if (!APPLICABLE_VERTICALS.includes(hall.pool.verticalId.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Location voting not applicable for ${hall.pool.verticalId}`,
        },
        { status: 400 },
      );
    }

    // ── V3.2: Validate option exists from relation ──
    const options = (hall.pool.locationOptionsList || []).map((opt) => ({
      id: opt.id,
      label: opt.name,
    }));

    const selectedOption = options.find((o) => o.id === optionId);
    if (!selectedOption) {
      return NextResponse.json(
        { success: false, error: "Invalid location option" },
        { status: 400 },
      );
    }

    // ── Find or create location_select proposal ──
    let proposal = await prisma.proposal.findFirst({
      where: {
        hallId,
        type: "location_select",
        status: { in: ["active", "pending"] },
      },
      include: { votes: { where: { userId: user.id } } },
    });

    if (!proposal) {
      // Check for duplicate active type
      const duplicate = await prisma.proposal.findFirst({
        where: { hallId, type: "location_select", status: "active" },
      });
      if (duplicate) {
        proposal = await prisma.proposal.findFirst({
          where: { id: duplicate.id },
          include: { votes: { where: { userId: user.id } } },
        });
      } else {
        const endsAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        proposal = await prisma.proposal.create({
          data: {
            poolId: hall.pool.id,
            hallId,
            proposerId: user.id,
            title: `Select Location: ${selectedOption.label}`,
            description:
              reason ||
              `Community vote to select operational location for ${hall.pool.verticalId}`,
            type: "location_select",
            locationOption: optionId,
            thresholdPercent: 51.0,
            status: "active",
            endsAt,
          },
          include: { votes: { where: { userId: user.id } } },
        });
      }
    }

    if (proposal!.votes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already voted on this location selection",
        },
        { status: 409 },
      );
    }

    if (proposal!.status !== "active" && proposal!.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Location vote is ${proposal!.status}. Voting closed.`,
        },
        { status: 400 },
      );
    }

    if (proposal!.endsAt < new Date()) {
      await prisma.proposal.update({
        where: { id: proposal!.id },
        data: { status: "rejected" },
      });
      return NextResponse.json(
        {
          success: false,
          error: "Location voting period ended. Auto-rejected.",
        },
        { status: 400 },
      );
    }

    // ── Atomic vote + tally ──
    const result = await prisma.$transaction(async (tx) => {
      await tx.vote.create({
        data: {
          proposalId: proposal!.id,
          userId: user.id,
          weight,
          choice: optionId,
        },
      });

      const updated = await tx.proposal.update({
        where: { id: proposal!.id },
        data: {
          voteWeightYes: { increment: weight },
          voteCountYes: { increment: 1 },
        },
      });

      // ── Recalculate all votes for this proposal ──
      const allVotes = await tx.vote.findMany({
        where: { proposalId: proposal!.id },
        select: { choice: true, weight: true },
      });

      const tally: Record<string, number> = {};
      allVotes.forEach((v) => {
        tally[v.choice] = (tally[v.choice] || 0) + (v.weight || 0);
      });

      const totalWeight = Object.values(tally).reduce((a, b) => a + b, 0);
      const winningWeight = Math.max(...Object.values(tally));
      const winningChoice =
        Object.entries(tally).find(([, w]) => w === winningWeight)?.[0] || null;
      const winningPercent =
        totalWeight > 0 ? (winningWeight / totalWeight) * 100 : 0;
      const thresholdMet = winningPercent >= updated.thresholdPercent;

      let finalStatus = updated.status;
      let winningOption = null;

      if (thresholdMet && updated.status === "active") {
        finalStatus = "passed";
        winningOption = options.find((o) => o.id === winningChoice) || null;

        await tx.proposal.update({
          where: { id: proposal!.id },
          data: {
            status: "passed",
            locationOption: winningChoice,
          },
        });

        await tx.hallActivity.create({
          data: {
            hallId,
            userId: user.id,
            type: "location_select",
            description: `Location selected: ${winningOption?.label || winningChoice} (${winningPercent.toFixed(1)}%)`,
            metadata: JSON.stringify({
              proposalId: proposal!.id,
              winningChoice,
              winningPercent,
              totalWeight,
            }),
          },
        });

        // ── Notify owners ──
        const owners = await tx.ownership.findMany({
          where: { hallId },
          select: { userId: true },
        });

        if (owners.length > 0) {
          await tx.notification.createMany({
            data: owners.map((o) => ({
              ledgerId: o.userId,
              proposalId: proposal!.id,
              type: "location_selected",
              title: "Location Selected",
              message: `Community chose ${winningOption?.label || winningChoice} as operational location (${winningPercent.toFixed(1)}%)`,
              actionUrl: `/halls/${hallId}/governance`,
              createdAt: new Date(),
            })),
            skipDuplicates: true,
          });
        }
      }

      return {
        updated,
        tally,
        totalWeight,
        winningChoice,
        winningPercent: Number(winningPercent.toFixed(2)),
        thresholdMet,
        finalStatus,
        winningOption,
      };
    });

    return NextResponse.json({
      success: true,
      vote: {
        optionId,
        weight,
        label: selectedOption.label,
      },
      location: {
        proposalId: proposal!.id,
        tally: result.tally,
        totalWeight: result.totalWeight,
        winningChoice: result.winningChoice,
        winningPercent: result.winningPercent,
        thresholdMet: result.thresholdMet,
        status: result.finalStatus,
        selectedOption: result.winningOption,
      },
      message: result.thresholdMet
        ? `LOCATION SELECTED: ${result.winningOption?.label || result.winningChoice} wins with ${result.winningPercent.toFixed(1)}% approval.`
        : `Voted for ${selectedOption.label}. Leading option at ${result.winningPercent.toFixed(1)}%. ${result.updated.thresholdPercent}% required.`,
    });
  } catch (error) {
    console.error("[HALL LOCATION POST]", error);
    return NextResponse.json(
      { success: false, error: "Location vote failed" },
      { status: 500 },
    );
  }
}
