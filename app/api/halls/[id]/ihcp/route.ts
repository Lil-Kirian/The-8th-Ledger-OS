// app/api/halls/[id]/ihcp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET — IHCP status for a hall
// Returns: current balance, total contributions, repayment history, active IHCPs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            verticalId: true,
            ihcpTarget: true,
          },
        },
        hallTreasury: true,
        ownerships: {
          where: { userId: user.id, status: "active" },
          select: { ownershipPercent: true },
        },
        hallContributions: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                ledgerId: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Only owners can see IHCP details
    const isOwner = hall.ownerships.length > 0;
    const isAdmin = user.role === "admin" || user.isPrimaryAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only hall owners can view IHCP details" },
        { status: 403 }
      );
    }

    const totalContributed = hall.hallContributions.reduce(
      (sum, c) => sum + c.amount,
      0
    );
    const totalRepaid = hall.hallContributions.reduce(
      (sum, c) => sum + c.repaidAmount,
      0
    );
    const outstandingDebt = totalContributed - totalRepaid;

    // Group by purpose
    const byPurpose: Record<string, { contributed: number; repaid: number }> =
      {};
    hall.hallContributions.forEach((c) => {
      if (!byPurpose[c.purpose]) {
        byPurpose[c.purpose] = { contributed: 0, repaid: 0 };
      }
      byPurpose[c.purpose].contributed += c.amount;
      byPurpose[c.purpose].repaid += c.repaidAmount;
    });

    // Monthly repayment estimate (5% of net hall revenue, if available)
    const monthlyRevenue = hall.hallTreasury?.monthlyRevenue || 0;
    const estimatedMonthlyRepayment = Math.round(monthlyRevenue * 0.05);

    return NextResponse.json({
      hall: {
        id: hall.id,
        name: hall.name,
        poolId: hall.pool?.poolId,
        verticalId: hall.pool?.verticalId,
      },
      ihcp: {
        balance: hall.ihcpBalance,
        target: hall.pool?.ihcpTarget || 0,
        totalContributed,
        totalRepaid,
        outstandingDebt,
        fillPercent:
          hall.pool?.ihcpTarget && hall.pool.ihcpTarget > 0
            ? Math.min(100, Math.round((totalContributed / hall.pool.ihcpTarget) * 100))
            : 0,
      },
      treasury: {
        balance: hall.hallTreasury?.balance || 0,
        monthlyRevenue,
        estimatedMonthlyRepayment,
        monthsToRepay:
          estimatedMonthlyRepayment > 0
            ? Math.ceil(outstandingDebt / estimatedMonthlyRepayment)
            : outstandingDebt > 0
            ? null
            : 0,
      },
      byPurpose,
      contributions: isOwner
        ? hall.hallContributions.map((c) => ({
            id: c.id,
            amount: c.amount,
            purpose: c.purpose,
            repaidAmount: c.repaidAmount,
            status: c.status,
            contributor: {
              ledgerId: c.user.ledgerId,
              displayName: c.user.displayName,
            },
            createdAt: c.createdAt,
          }))
        : undefined,
      myOwnership: isOwner ? hall.ownerships[0].ownershipPercent : 0,
    });
  } catch (err: any) {
    console.error("[IHCP_GET]", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to load IHCP status" },
      { status: 500 }
    );
  }
}

// POST — Create IHCP proposal
// Hall votes to raise an IHCP for a specific purpose (payroll, stock, marketing, upgrade, emergency)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    const body = await req.json();
    const { amount, purpose, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const validPurposes = [
      "payroll",
      "stock",
      "marketing",
      "upgrade",
      "emergency",
    ];
    if (!purpose || !validPurposes.includes(purpose)) {
      return NextResponse.json(
        {
          error: `purpose must be one of: ${validPurposes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verify hall + ownership
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { poolId: true, name: true, ihcpTarget: true } },
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
        { error: "Only hall owners can propose IHCP" },
        { status: 403 }
      );
    }

    const userOwnership = hall.ownerships[0].ownershipPercent;

    // Calculate total active ownership
    const totalOwnershipAgg = await prisma.ownership.aggregate({
      where: { hallId, status: "active" },
      _sum: { ownershipPercent: true },
    });
    const totalOwnership = totalOwnershipAgg._sum.ownershipPercent || 0;

    // Create proposal
    const proposal = await prisma.proposal.create({
      data: {
        poolId: hall.poolId,
        hallId,
        proposerId: user.id,
        title: `IHCP: ${purpose.toUpperCase()} — $${amount.toLocaleString()}`,
        description:
          description?.trim() ||
          `Raise $${amount.toLocaleString()} from hall owners for ${purpose}. Repaid from revenue before dividends with 5% priority return.`,
        type: "ihcp_create",
        amount,
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
            executionStatus: "executing",
            executedAt: new Date(),
            executionResult: "ihcp_activated",
          },
        });

        // Update pool ihcpTarget if not set or increase it
        const currentTarget = hall.pool?.ihcpTarget || 0;
        await tx.pool.update({
          where: { id: hall.poolId },
          data: {
            ihcpTarget: currentTarget + amount,
          },
        });

        // Audit
        await tx.auditLog.create({
          data: {
            eventType: "ihcp_proposal_executed",
            description: `IHCP of $${amount} for ${purpose} auto-executed in hall ${hall.name}`,
            poolId: hall.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({
              hallId,
              proposalId: proposal.id,
              amount,
              purpose,
              triggeredBy: user.ledgerId,
            }),
            txHash: `LED-IHCP-${Date.now()}`,
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
              title: "IHCP Activated",
              message: `An IHCP of $${amount.toLocaleString()} for ${purpose} has been activated in hall ${hall.name}. Owners may now contribute.`,
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
        amount,
        purpose,
        status: executed ? "passed" : "pending",
        voteWeightYes: userOwnership,
        voteCountYes: 1,
        thresholdPercent: 51,
        totalOwnership,
        executed,
        message: executed
          ? `IHCP activated immediately. You own ${userOwnership}%. Owners may now contribute.`
          : `Proposal created. You voted YES (${userOwnership}%). Need 51% total to activate IHCP. 48 hours remaining.`,
      },
    });
  } catch (err: any) {
    console.error("[IHCP_POST]", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err.message || "Failed to create IHCP proposal" },
      { status: 500 }
    );
  }
}