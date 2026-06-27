// app/api/halls/[id]/forge/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// POST — Toggle forge enable/disable for a hall
// Creates a proposal. If proposer owns >= 51%, auto-executes.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    const body = await req.json();
    const { enable } = body; // true = enable, false = disable

    if (typeof enable !== "boolean") {
      return NextResponse.json(
        { error: "enable (boolean) is required" },
        { status: 400 }
      );
    }

    // Verify hall + ownership
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { poolId: true, name: true } },
        ownerships: {
          where: { userId: user.id, status: "active" },
          select: { ownershipPercent: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    if (hall.ownerships.length === 0) {
      return NextResponse.json(
        { error: "Only hall owners can propose forge toggle" },
        { status: 403 }
      );
    }

    const userOwnership = hall.ownerships[0].ownershipPercent;

    // Check current state
    if (enable && hall.forgeEnabled) {
      return NextResponse.json(
        { error: "Forge is already enabled for this hall" },
        { status: 400 }
      );
    }
    if (!enable && !hall.forgeEnabled) {
      return NextResponse.json(
        { error: "Forge is already disabled for this hall" },
        { status: 400 }
      );
    }

    // Calculate total active ownership for threshold context
    const totalOwnershipAgg = await prisma.ownership.aggregate({
      where: { hallId, status: "active" },
      _sum: { ownershipPercent: true },
    });
    const totalOwnership = totalOwnershipAgg._sum.ownershipPercent || 0;

    // Create proposal with proposer's vote baked in
    const proposalType = enable ? "forge_enable" : "forge_disable";
    const proposal = await prisma.proposal.create({
      data: {
        poolId: hall.poolId,
        hallId,
        proposerId: user.id,
        title: enable
          ? "Enable The Forge (Worker Management)"
          : "Disable The Forge (Worker Management)",
        description: enable
          ? "Enable the Forge for this hall. Once enabled, the hall can hire workers, manage payroll, and operate the asset through 8th Ledger employment. Workers are employed by the 8th Ledger, not the hall."
          : "Disable the Forge for this hall. Existing workers will be notified and contracts will not be renewed. Current workers complete their term.",
        type: proposalType,
        thresholdPercent: 51.0,
        status: "pending",
        voteWeightYes: userOwnership,
        voteCountYes: 1,
        endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    // Record proposer's vote
    await prisma.vote.create({
      data: {
        proposalId: proposal.id,
        userId: user.id,
        weight: userOwnership,
        choice: "yes",
      },
    });

    // Auto-execute if proposer alone meets 51%
    let executed = false;
    if (totalOwnership > 0 && userOwnership >= 51) {
      await prisma.$transaction(async (tx) => {
        await tx.proposal.update({
          where: { id: proposal.id },
          data: {
            status: "passed",
            passedAt: new Date(),
            executionStatus: "completed",
            executedAt: new Date(),
            executionResult: enable ? "forge_enabled" : "forge_disabled",
          },
        });

        await tx.hall.update({
          where: { id: hallId },
          data: { forgeEnabled: enable },
        });

        // If disabling, handle existing workers
        if (!enable) {
          // Mark all active workers as "not-renewing" — they finish current term
          await tx.worker.updateMany({
            where: { hallId, status: "active" },
            data: { status: "not-renewing" },
          });
        }

        // Audit
        await tx.auditLog.create({
          data: {
            eventType: `forge_${enable ? "enabled" : "disabled"}`,
            description: `Forge ${enable ? "enabled" : "disabled"} for hall ${hall.name} via auto-execution (proposer owned ${userOwnership}%)`,
            poolId: hall.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({
              hallId,
              proposalId: proposal.id,
              triggeredBy: user.ledgerId,
            }),
            txHash: `LED-FORGE-TOGGLE-${Date.now()}`,
            visibleToPublic: true,
          },
        });

        // Notify all owners — FIX: select user.ledgerId, not user.id
        const owners = await tx.ownership.findMany({
          where: { hallId, status: "active" },
          select: {
            user: { select: { ledgerId: true } },
          },
        });
        if (owners.length > 0) {
          await tx.notification.createMany({
            data: owners.map((o) => ({
              ledgerId: o.user.ledgerId,
              poolId: hall.poolId,
              proposalId: proposal.id,
              type: "proposal_executed",
              title: `Forge ${enable ? "Enabled" : "Disabled"}`,
              message: `The Forge has been ${enable ? "enabled" : "disabled"} for hall ${hall.name}. ${enable ? "You may now propose hires." : "No new hires may be proposed."}`,
              read: false,
            })),
          });
        }
      });
      executed = true;
    }

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        type: proposal.type,
        status: executed ? "passed" : "pending",
        voteWeightYes: userOwnership,
        voteCountYes: 1,
        thresholdPercent: 51,
        totalOwnership,
        executed,
        hallForgeEnabled: executed ? enable : hall.forgeEnabled,
        message: executed
          ? `Forge ${enable ? "enabled" : "disabled"} immediately. You own ${userOwnership}% of this hall.`
          : `Proposal created. You voted YES (${userOwnership}%). Need 51% total to ${enable ? "enable" : "disable"} the Forge. 48 hours remaining.`,
      },
    });
  } catch (err: unknown) {
    console.error("[FORGE_TOGGLE_POST]", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to toggle forge" },
      { status: 500 }
    );
  }
}