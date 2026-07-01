import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionUser,
  verifyOwnership,
  getUserHallRole,
  isPrimaryAdmin,
  isAdminRole,
} from "@/lib/auth";

/* ============================================================
   PROPOSAL DURATION CONFIG (hours)
   PHASE 4: Added forge_enable, inventory_enable, ihcp_create
   ============================================================ */
const PROPOSAL_DURATIONS: Record<string, number> = {
  renovate: 72,
  sell: 168,
  rent_change: 48,
  manager_change: 48,
  location_select: 72,
  humanitarian: 24,
  liquidation: 168,
  impeach_manager: 48,
  impeach_liaison: 48,
  marketplace_list: 48,
  budget_approve: 72,
  hire: 72,
  fire: 48,
  maintenance: 48,
  inventory_list: 48,
  closure: 168,
  pir_advance: 72,
  // PHASE 4: Universal operations
  forge_enable: 72,
  inventory_enable: 72,
  ihcp_create: 72,
};

const VALID_TYPES = Object.keys(PROPOSAL_DURATIONS);

/* ============================================================
   ROLE RESTRICTIONS
   ============================================================ */
const MANAGER_ONLY_TYPES = ["renovate", "budget_approve", "marketplace_list"];
const MANAGER_OR_LIAISON_TYPES = [
  "impeach_manager",
  "impeach_liaison",
  "liquidation",
  "humanitarian",
];

/* ============================================================
   GET /api/halls/[id]/proposals — List proposals
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const myVotes = searchParams.get("myVotes") === "true";

    const isOwner = await verifyOwnership(hallId, user.id);
    if (!isOwner && !isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 },
      );
    }

    const where: { hallId: string; status?: string } = { hallId };
    if (
      status &&
      [
        "pending",
        "active",
        "passed",
        "rejected",
        "executing",
        "completed",
      ].includes(status)
    ) {
      where.status = status;
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        proposer: {
          select: { displayName: true, ledgerId: true, avatar: true },
        },
        votes: myVotes
          ? {
              where: { userId: user.id },
              select: { choice: true, weight: true, createdAt: true },
            }
          : {
              select: { userId: true, choice: true, weight: true },
            },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = proposals.map((p) => {
      const totalWeight = p.voteWeightYes + p.voteWeightNo;
      const yesPercent =
        totalWeight > 0 ? (p.voteWeightYes / totalWeight) * 100 : 0;
      const noPercent =
        totalWeight > 0 ? (p.voteWeightNo / totalWeight) * 100 : 0;

      const myVote =
        (
          p.votes as Array<{ userId?: string; choice: string; weight: number }>
        ).find((v) => (v.userId ? v.userId === user.id : true)) ?? null;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        amount: p.amount,
        executionCost: p.executionCost,
        status: p.status,
        voteWeightYes: p.voteWeightYes,
        voteWeightNo: p.voteWeightNo,
        voteCountYes: p.voteCountYes,
        voteCountNo: p.voteCountNo,
        thresholdPercent: p.thresholdPercent,
        yesPercent: Number(yesPercent.toFixed(2)),
        noPercent: Number(noPercent.toFixed(2)),
        totalWeight,
        myVote: myVote
          ? { choice: myVote.choice, weight: myVote.weight }
          : null,
        endsAt: p.endsAt,
        executedAt: p.executedAt,
        executionResult: p.executionResult,
        proposer: p.proposer,
        totalVotes: p._count.votes,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ success: true, proposals: enriched });
  } catch (error) {
    console.error("[HALL PROPOSALS GET]", error);
    return NextResponse.json(
      { success: false, error: "Governance chamber unreachable" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/halls/[id]/proposals — Create proposal
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
    const {
      title,
      description,
      type,
      amount,
      executionCost,
      targetUserId,
      locationOption,
      purpose, // PHASE 4: IHCP purpose
    } = body;

    // ── Basic validation ──
    if (
      !title ||
      typeof title !== "string" ||
      title.trim().length < 5 ||
      title.trim().length > 120
    ) {
      return NextResponse.json(
        { success: false, error: "Title required: 5–120 characters" },
        { status: 400 },
      );
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length < 20 ||
      description.trim().length > 5000
    ) {
      return NextResponse.json(
        { success: false, error: "Description required: 20–5000 characters" },
        { status: 400 },
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Valid: ${VALID_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ── Ownership gate ──
    const isOwner = await verifyOwnership(hallId, user.id);
    if (!isOwner && !isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 },
      );
    }

    // ── Hall state & link validation ──
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { pool: { select: { id: true, status: true } } },
    });

    if (!hall?.pool) {
      return NextResponse.json(
        { success: false, error: "Hall not linked to pool" },
        { status: 500 },
      );
    }

    if (hall.status === "dormant") {
      return NextResponse.json(
        {
          success: false,
          error: "Hall is dormant. Reactivate before proposing.",
        },
        { status: 403 },
      );
    }

    if (
      hall.status === "ghost" &&
      !["humanitarian", "liquidation"].includes(type)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Hall is Ghost. Only humanitarian or liquidation proposals allowed before Live unlock.",
        },
        { status: 403 },
      );
    }

    // ── Role authorization ──
    const userRole = await getUserHallRole(hallId, user.id);
    const isManagerOrPrimaryAdmin =
      userRole === "manager" || isPrimaryAdmin(user.ledgerId);
    const isManagerLiaisonOrPrimaryAdmin =
      ["manager", "liaison"].includes(userRole) ||
      isPrimaryAdmin(user.ledgerId);

    if (MANAGER_ONLY_TYPES.includes(type) && !isManagerOrPrimaryAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Manager role required for this proposal type",
        },
        { status: 403 },
      );
    }

    if (
      MANAGER_OR_LIAISON_TYPES.includes(type) &&
      !isManagerLiaisonOrPrimaryAdmin
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Manager or Liaison role required for this proposal type",
        },
        { status: 403 },
      );
    }

    // ── PHASE 4: Universal operations validation ──
    if (type === "forge_enable") {
      if (hall.forgeEnabled) {
        return NextResponse.json(
          { success: false, error: "Forge is already enabled for this hall" },
          { status: 409 },
        );
      }
    }

    if (type === "inventory_enable") {
      if (hall.inventoryEnabled) {
        return NextResponse.json(
          {
            success: false,
            error: "Inventory is already enabled for this hall",
          },
          { status: 409 },
        );
      }
    }

    if (type === "ihcp_create") {
      const numericAmount = amount ? Number(amount) : null;
      if (
        !numericAmount ||
        isNaN(numericAmount) ||
        numericAmount <= 0 ||
        numericAmount > 1_000_000_000
      ) {
        return NextResponse.json(
          { success: false, error: "IHCP requires a valid positive amount" },
          { status: 400 },
        );
      }
      if (
        !purpose ||
        typeof purpose !== "string" ||
        purpose.trim().length < 3
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "IHCP requires a purpose (payroll | inventory | marketing | upgrade | emergency)",
          },
          { status: 400 },
        );
      }
      const validPurposes = [
        "payroll",
        "inventory",
        "marketing",
        "upgrade",
        "emergency",
      ];
      if (!validPurposes.includes(purpose.trim().toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            error: `IHCP purpose must be one of: ${validPurposes.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // ── Amount & executionCost validation ──
    const numericAmount = amount ? Number(amount) : null;
    const numericExecutionCost = executionCost ? Number(executionCost) : null;

    if (
      numericAmount !== null &&
      (isNaN(numericAmount) ||
        numericAmount <= 0 ||
        numericAmount > 1_000_000_000)
    ) {
      return NextResponse.json(
        { success: false, error: "Amount must be positive and realistic" },
        { status: 400 },
      );
    }

    if (
      numericExecutionCost !== null &&
      (isNaN(numericExecutionCost) ||
        numericExecutionCost < 0 ||
        numericExecutionCost > 1_000_000_000)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Execution cost must be non-negative and realistic",
        },
        { status: 400 },
      );
    }

    // ── Anti-spam: max 3 active proposals per user in this hall ──
    const activeCount = await prisma.proposal.count({
      where: {
        hallId,
        proposerId: user.id,
        status: "active",
      },
    });

    if (activeCount >= 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have 3 active proposals in this Hall. Wait for one to close.",
        },
        { status: 429 },
      );
    }

    // ── Duplicate-type guard: no duplicate active proposals of same type ──
    const duplicateType = await prisma.proposal.findFirst({
      where: {
        hallId,
        type,
        status: "active",
      },
      select: { id: true },
    });

    if (duplicateType) {
      return NextResponse.json(
        {
          success: false,
          error: `An active ${type} proposal already exists. Vote on it first.`,
        },
        { status: 409 },
      );
    }

    // ── Impeachment target validation ──
    if (type === "impeach_manager" || type === "impeach_liaison") {
      if (!targetUserId || typeof targetUserId !== "string") {
        return NextResponse.json(
          { success: false, error: "targetUserId required for impeachment" },
          { status: 400 },
        );
      }

      if (targetUserId === user.id) {
        return NextResponse.json(
          { success: false, error: "You cannot impeach yourself" },
          { status: 400 },
        );
      }

      const targetRole = await prisma.hallRole.findFirst({
        where: {
          hallId,
          userId: targetUserId,
          role: type === "impeach_manager" ? "manager" : "liaison",
          isImpeached: false,
        },
        include: { user: { select: { displayName: true } } },
      });

      if (!targetRole) {
        return NextResponse.json(
          {
            success: false,
            error: `Target does not hold ${type === "impeach_manager" ? "Manager" : "Liaison"} role`,
          },
          { status: 400 },
        );
      }
    }

    // ── Location validation ──
    if (type === "location_select") {
      if (
        !locationOption ||
        typeof locationOption !== "string" ||
        locationOption.length < 2
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "locationOption required for location selection",
          },
          { status: 400 },
        );
      }
    }

    // ── Budget cap: cannot exceed 50% of treasury in one shot ──
    if (type === "budget_approve" && numericAmount) {
      const treasury = await prisma.hallTreasury.findUnique({
        where: { hallId },
        select: { balance: true },
      });
      if (treasury && numericAmount > treasury.balance * 0.5) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Budget exceeds 50% of treasury balance. Split into smaller proposals.",
          },
          { status: 400 },
        );
      }
    }

    // ── Atomic creation ──
    const durationHours = PROPOSAL_DURATIONS[type];
    const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          poolId: hall.pool.id,
          hallId,
          proposerId: user.id,
          title: title.trim(),
          description: description.trim(),
          type,
          amount: numericAmount,
          executionCost: numericExecutionCost,
          targetUserId: targetUserId || null,
          locationOption: locationOption || null,
          thresholdPercent: 51.0,
          status: "active",
          endsAt,
        },
        include: {
          proposer: {
            select: { displayName: true, ledgerId: true },
          },
        },
      });

      await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "proposal",
          description: `${user.displayName} proposed: ${title} (${type})`,
          metadata: JSON.stringify({
            proposalId: proposal.id,
            amount: numericAmount,
            executionCost: numericExecutionCost,
            purpose: purpose || undefined,
          }),
        },
      });

      const owners = await tx.ownership.findMany({
        where: { hallId, status: "active" },
        select: { userId: true },
      });

      if (owners.length > 0) {
        await tx.notification.createMany({
          data: owners.map((o) => ({
            ledgerId: o.userId,
            poolId: hall.pool.id,
            proposalId: proposal.id,
            type: "proposal_started",
            title: "New Proposal",
            message: `${proposal.proposer.displayName} proposed: ${title}`,
            actionUrl: `/halls/${hallId}/governance`,
            createdAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }

      return proposal;
    });

    return NextResponse.json({
      success: true,
      proposal: {
        id: result.id,
        title: result.title,
        description: result.description,
        type: result.type,
        amount: result.amount,
        executionCost: result.executionCost,
        status: result.status,
        thresholdPercent: result.thresholdPercent,
        endsAt: result.endsAt,
        proposer: result.proposer,
        durationHours,
      },
      message: `Proposal "${result.title}" is now active. Voting ends in ${durationHours} hours. 51% capital-weighted approval required.`,
    });
  } catch (error) {
    console.error("[HALL PROPOSALS POST]", error);
    return NextResponse.json(
      { success: false, error: "Proposal creation failed" },
      { status: 500 },
    );
  }
}
