// app/api/halls/[id]/ihcp/contribute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// POST — Contribute capital to the IHCP
// Only hall owners can contribute. Deducts from wallet, creates HallContribution.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: hallId } = await params;

    const body = await req.json();
    const { amount, purpose } = body;

    // Validation
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

    // Verify hall + ownership — FIX: include hallTreasury
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        hallTreasury: true,
        pool: {
          select: {
            poolId: true,
            name: true,
            ihcpTarget: true,
          },
        },
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
        { error: "Only hall owners can contribute to IHCP" },
        { status: 403 }
      );
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { ledgerId: user.ledgerId },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    if (wallet.balance < amount) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Required: $${amount.toFixed(
            2
          )}, Available: $${wallet.balance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Execute contribution atomically
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const updatedWallet = await tx.wallet.update({
        where: { ledgerId: user.ledgerId },
        data: {
          balance: { decrement: amount },
        },
      });

      if (updatedWallet.balance < 0) {
        throw new Error("Insufficient balance after concurrent update");
      }

      // Create HallContribution record
      const contribution = await tx.hallContribution.create({
        data: {
          hallId,
          ledgerId: user.ledgerId,
          amount,
          purpose,
          repaidAmount: 0,
          status: "active",
        },
        include: {
          hall: {
            select: {
              id: true,
              name: true,
              pool: { select: { poolId: true } },
            },
          },
          user: {
            select: {
              ledgerId: true,
              displayName: true,
            },
          },
        },
      });

      // Update hall IHCP balance
      const updatedHall = await tx.hall.update({
        where: { id: hallId },
        data: {
          ihcpBalance: { increment: amount },
        },
        select: {
          ihcpBalance: true,
          name: true,
        },
      });

      // Create treasury transaction record — FIX: only if treasury exists
      if (hall.hallTreasury?.id) {
        await tx.hallTreasuryTransaction.create({
          data: {
            treasuryId: hall.hallTreasury.id,
            type: "ihcp_contribution",
            amount,
            description: `IHCP contribution by ${user.displayName} for ${purpose}: $${amount}`,
            metadata: JSON.stringify({
              contributionId: contribution.id,
              ledgerId: user.ledgerId,
              purpose,
            }),
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          eventType: "ihcp_contribution",
          description: `$${amount} contributed to IHCP for ${purpose} in hall ${hall.name}`,
          poolId: hall.pool?.poolId,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            contributionId: contribution.id,
            hallId,
            amount,
            purpose,
            newIhcpBalance: updatedHall.ihcpBalance,
          }),
          txHash: `LED-IHCP-CON-${Date.now()}`,
          visibleToPublic: true,
        },
      });

      // Notification to contributor — FIX: user.ledgerId, not user.id
      await tx.notification.create({
        data: {
          ledgerId: user.ledgerId,
          poolId: hall.pool?.poolId,
          type: "ihcp_contribution",
          title: "IHCP Contribution Confirmed",
          message: `You contributed $${amount.toLocaleString()} to the IHCP for ${purpose} in hall ${hall.name}. Repayment begins from next revenue cycle with 5% priority return.`,
          read: false,
        },
      });

      return { contribution, updatedHall, updatedWallet };
    });

    return NextResponse.json({
      success: true,
      contribution: {
        id: result.contribution.id,
        amount: result.contribution.amount,
        purpose: result.contribution.purpose,
        status: result.contribution.status,
        repaidAmount: result.contribution.repaidAmount,
        hall: {
          id: result.contribution.hall.id,
          name: result.contribution.hall.name,
        },
        contributor: {
          ledgerId: result.contribution.user.ledgerId,
          displayName: result.contribution.user.displayName,
        },
        createdAt: result.contribution.createdAt,
      },
      hall: {
        ihcpBalance: result.updatedHall.ihcpBalance,
      },
      wallet: {
        balance: result.updatedWallet.balance,
      },
      repayment: {
        priorityReturn: 5, // 5% priority return
        message:
          "You will receive 5% priority return on this contribution before standard dividends are distributed. Repayment is automatic from hall revenue.",
      },
    });
  } catch (err: unknown) {
    console.error("[IHCP_CONTRIBUTE_POST]", err);
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (err.message === "Insufficient balance after concurrent update") {
      return NextResponse.json(
        { error: "Insufficient balance. Please try again." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to contribute to IHCP" },
      { status: 500 }
    );
  }
}