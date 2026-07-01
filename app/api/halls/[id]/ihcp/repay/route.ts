// app/api/halls/[id]/ihcp/repay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth, isAdminRole } from "@/lib/auth";

const prisma = new PrismaClient();

// POST — Process IHCP repayment from hall revenue
// Called by dividend distribution engine OR admin/founder trigger
// Deducts from hall treasury, repays contributors proportionally with 5% priority return
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    const body = await req.json();
    const { revenuePool } = body; // Amount available for IHCP repayment this cycle

    if (typeof revenuePool !== "number" || revenuePool <= 0) {
      return NextResponse.json(
        { error: "revenuePool must be a positive number" },
        { status: 400 }
      );
    }

    // Verify hall + access
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { poolId: true, name: true } },
        hallTreasury: true,
        ownerships: {
          where: { userId: user.id, status: "active" },
          select: { ownershipPercent: true },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Only admin/founder or hall owners can trigger repayment
    const isAdmin = isAdminRole(user.role) || user.isPrimaryAdmin;
    const isOwner = hall.ownerships.length > 0;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Only hall owners or admin can trigger IHCP repayment" },
        { status: 403 }
      );
    }

    // Guard: hall must have a treasury
    if (!hall.hallTreasury) {
      return NextResponse.json(
        { error: "Hall treasury not initialized" },
        { status: 500 }
      );
    }

    // Get all active contributions for this hall
    const contributions = await prisma.hallContribution.findMany({
      where: {
        hallId,
        status: "active",
      },
      include: {
        user: {
          select: {
            id: true,
            ledgerId: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" }, // First in, first repaid
    });

    if (contributions.length === 0) {
      return NextResponse.json({
        success: true,
        repaid: 0,
        message: "No active IHCP contributions to repay",
        remainingRevenuePool: revenuePool,
      });
    }

    // Calculate total outstanding debt (principal + 5% return)
    const totalOutstanding = contributions.reduce((sum, c) => {
      const totalOwed = Math.round(c.amount * 1.05); // principal + 5% priority return
      const remaining = Math.max(0, totalOwed - c.repaidAmount);
      return sum + remaining;
    }, 0);

    if (totalOutstanding === 0) {
      // Mark all as repaid just in case
      await prisma.hallContribution.updateMany({
        where: { hallId, status: "active" },
        data: { status: "repaid" },
      });

      return NextResponse.json({
        success: true,
        repaid: 0,
        message: "All IHCP contributions fully repaid",
        remainingRevenuePool: revenuePool,
      });
    }

    // How much we actually use (cannot exceed available or outstanding)
    const repaymentAmount = Math.min(revenuePool, totalOutstanding);

    // Distribute proportionally: first-in-first-repaid basis
    // Each contributor gets a proportional slice based on their outstanding balance
    let remainingToDistribute = repaymentAmount;
    const repayments: Array<{
      contributionId: string;
      ledgerId: string;
      displayName: string;
      amount: number;
      newRepaidAmount: number;
      fullyRepaid: boolean;
    }> = [];

    for (const c of contributions) {
      if (remainingToDistribute <= 0) break;

      const totalOwed = Math.round(c.amount * 1.05);
      const stillOwed = Math.max(0, totalOwed - c.repaidAmount);

      if (stillOwed <= 0) continue;

      const thisRepayment = Math.min(stillOwed, remainingToDistribute);
      remainingToDistribute -= thisRepayment;

      repayments.push({
        contributionId: c.id,
        ledgerId: c.user.ledgerId,
        displayName: c.user.displayName,
        amount: thisRepayment,
        newRepaidAmount: c.repaidAmount + thisRepayment,
        fullyRepaid: c.repaidAmount + thisRepayment >= totalOwed,
      });
    }

    // Execute atomically
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from hall treasury
      const treasury = await tx.hallTreasury.update({
        where: { hallId },
        data: {
          balance: { decrement: repaymentAmount },
        },
      });

      if (treasury.balance < 0) {
        throw new Error("Hall treasury insufficient for IHCP repayment");
      }

      // Process each repayment
      const processed = [];
      for (const r of repayments) {
        // Update contribution
        const newStatus = r.fullyRepaid ? "repaid" : "active";
        await tx.hallContribution.update({
          where: { id: r.contributionId },
          data: {
            repaidAmount: r.newRepaidAmount,
            status: newStatus,
          },
        });

        // Credit contributor wallet
        await tx.wallet.update({
          where: { ledgerId: r.ledgerId },
          data: {
            balance: { increment: r.amount },
          },
        });

        // Treasury transaction record — FIX: use guarded treasuryId
        await tx.hallTreasuryTransaction.create({
          data: {
            treasuryId: hall.hallTreasury!.id,
            type: "ihcp_repayment",
            amount: r.amount,
            description: `IHCP repayment to ${r.displayName}: $${r.amount}`,
            metadata: JSON.stringify({
              contributionId: r.contributionId,
              ledgerId: r.ledgerId,
              fullyRepaid: r.fullyRepaid,
            }),
          },
        });

        processed.push({
          contributionId: r.contributionId,
          ledgerId: r.ledgerId,
          displayName: r.displayName,
          repaid: r.amount,
          fullyRepaid: r.fullyRepaid,
        });
      }

      // Update hall IHCP balance
      const updatedHall = await tx.hall.update({
        where: { id: hallId },
        data: {
          ihcpBalance: { decrement: repaymentAmount },
        },
        select: { ihcpBalance: true },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          eventType: "ihcp_repayment",
          description: `$${repaymentAmount} distributed as IHCP repayment in hall ${hall.name}`,
          poolId: hall.poolId,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            hallId,
            repaymentAmount,
            contributorCount: processed.length,
            remainingIhcpBalance: updatedHall.ihcpBalance,
          }),
          txHash: `LED-IHCP-REPAY-${Date.now()}`,
          visibleToPublic: true,
        },
      });

      // Notifications to all repaid contributors
      for (const r of processed) {
        await tx.notification.create({
          data: {
            ledgerId: r.ledgerId,
            poolId: hall.poolId,
            type: "ihcp_repayment",
            title: r.fullyRepaid
              ? "IHCP Fully Repaid"
              : "IHCP Partial Repayment",
            message: r.fullyRepaid
              ? `Your IHCP contribution in hall ${hall.name} has been fully repaid with 5% priority return. You received $${r.repaid}.`
              : `You received $${r.repaid} as IHCP repayment from hall ${hall.name}. Priority return continues next cycle.`,
            read: false,
          },
        });
      }

      return {
        processed,
        updatedHall,
        treasuryBalance: treasury.balance,
      };
    });

    return NextResponse.json({
      success: true,
      repayment: {
        totalRepaid: repaymentAmount,
        fromRevenuePool: revenuePool,
        remainingRevenuePool: revenuePool - repaymentAmount,
        contributorCount: result.processed.length,
        hallIhcpBalance: result.updatedHall.ihcpBalance,
        treasuryBalance: result.treasuryBalance,
      },
      contributors: result.processed,
      message: `$${repaymentAmount.toLocaleString()} distributed to ${
        result.processed.length
      } contributor(s). $${(revenuePool - repaymentAmount).toLocaleString()} remains for payroll/COGS/dividends.`,
    });
  } catch (err: any) {
    console.error("[IHCP_REPAY_POST]", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (err.message === "Hall treasury insufficient for IHCP repayment") {
      return NextResponse.json(
        { error: "Hall treasury has insufficient funds for IHCP repayment" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to process IHCP repayment" },
      { status: 500 }
    );
  }
}