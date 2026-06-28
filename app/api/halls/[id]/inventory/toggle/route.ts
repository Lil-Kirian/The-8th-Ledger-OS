// app/api/halls/[id]/inventory/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/* ============================================================
   POST — Toggle inventory enable/disable for a hall
   Creates a proposal. If proposer owns >= 51% of active ownership, auto-executes.
   ============================================================ */
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
        { success: false, error: "enable (boolean) is required" },
        { status: 400 }
      );
    }

    // Verify hall + ownership
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { id: true, poolId: true, name: true } },
        ownerships: {
          where: { userId: user.id, status: "active" },
          select: { ownershipPercent: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 }
      );
    }

    if (hall.status !== "live") {
      return NextResponse.json(
        { success: false, error: "Hall must be live to toggle inventory" },
        { status: 400 }
      );
    }

    if (hall.ownerships.length === 0) {
      return NextResponse.json(
        { success: false, error: "Only hall owners can propose inventory toggle" },
        { status: 403 }
      );
    }

    const userOwnership = hall.ownerships[0].ownershipPercent;

    // Check current state
    if (enable && hall.inventoryEnabled) {
      return NextResponse.json(
        { success: false, error: "Inventory is already enabled for this hall" },
        { status: 400 }
      );
    }
    if (!enable && !hall.inventoryEnabled) {
      return NextResponse.json(
        { success: false, error: "Inventory is already disabled for this hall" },
        { status: 400 }
      );
    }

    // Calculate total active ownership for threshold context
    const totalOwnershipAgg = await prisma.ownership.aggregate({
      where: { hallId, status: "active" },
      _sum: { ownershipPercent: true },
    });
    const totalOwnership = totalOwnershipAgg._sum.ownershipPercent || 0;

    // Proposer's share of active ownership
    const proposerShare = totalOwnership > 0 ? (userOwnership / totalOwnership) * 100 : 0;

    // Create proposal with proposer's vote baked in
    const proposalType = enable ? "inventory_enable" : "inventory_disable";
    const proposal = await prisma.proposal.create({
      data: {
        poolId: hall.poolId,
        hallId,
        proposerId: user.id,
        title: enable
          ? "Enable Inventory Management"
          : "Disable Inventory Management",
        description: enable
          ? "Enable inventory management for this hall. Once enabled, the hall can list physical products for public sale on the 8th Ledger marketplace."
          : "Disable inventory management for this hall. Existing inventory listings will be deactivated.",
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

    // Auto-execute if proposer alone meets 51% of active ownership
    let executed = false;
    if (totalOwnership > 0 && proposerShare >= 51) {
      await prisma.$transaction(async (tx) => {
        await tx.proposal.update({
          where: { id: proposal.id },
          data: {
            status: "passed",
            passedAt: new Date(),
            executionStatus: "completed",
            executedAt: new Date(),
            executionResult: enable
              ? "inventory_enabled"
              : "inventory_disabled",
          },
        });

        await tx.hall.update({
          where: { id: hallId },
          data: { inventoryEnabled: enable, updatedAt: new Date() },
        });

        // If disabling, deactivate all inventory items
        if (!enable) {
          await tx.inventoryItem.updateMany({
            where: { hallId },
            data: { status: "inactive", updatedAt: new Date() },
          });
        }

        // Audit
        await tx.auditLog.create({
          data: {
            eventType: `inventory_${enable ? "enabled" : "disabled"}`,
            description: `Inventory ${enable ? "enabled" : "disabled"} for hall ${hall.name} via auto-execution (proposer owned ${proposerShare.toFixed(1)}% of active ownership)`,
            poolId: hall.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({
              hallId,
              proposalId: proposal.id,
              triggeredBy: user.ledgerId,
              proposerShare,
              totalActiveOwnership: totalOwnership,
            }),
            txHash: `LED-INV-TOGGLE-${Date.now()}`,
            visibleToPublic: true,
          },
        });

        // Notify all owners
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
              title: `Inventory ${enable ? "Enabled" : "Disabled"}`,
              message: `Inventory management has been ${enable ? "enabled" : "disabled"} for hall ${hall.name}.`,
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
        totalActiveOwnership: totalOwnership,
        proposerShare: Number(proposerShare.toFixed(2)),
        executed,
        hallInventoryEnabled: executed ? enable : hall.inventoryEnabled,
        message: executed
          ? `Inventory ${enable ? "enabled" : "disabled"} immediately. You own ${proposerShare.toFixed(1)}% of active ownership.`
          : `Proposal created. You voted YES (${userOwnership}% weight). Need 51% of active ownership to ${enable ? "enable" : "disable"} inventory. 48 hours remaining.`,
      },
    });
  } catch (err: any) {
    console.error("[INVENTORY_TOGGLE_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json(
        { success: false, error: "Login required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: message || "Failed to toggle inventory" },
      { status: 500 }
    );
  }
}