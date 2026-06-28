// app/api/marketplace/inventory/[id]/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/* ============================================================
   POST — Buy Inventory Item
   1. Check stock (accounting for pending orders)
   2. KYC gate for $500+
   3. Verify buyer funds (wallet balance)
   4. Create order with fee breakdown, lock funds in escrow
   5. 48h hold — buyer can cancel, 8th Ledger releases after 48h
   ============================================================ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id: inventoryId } = await params;

    const body = await req.json();
    const { quantity = 1 } = body;

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, error: "Account suspended. Contact support." },
        { status: 403 }
      );
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json(
        { success: false, error: "Quantity must be a whole number >= 1" },
        { status: 400 }
      );
    }

    // Fetch item with hall + pool + pending orders
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
      include: {
        hall: {
          include: {
            hallTreasury: true,
            pool: {
              select: {
                poolId: true,
                name: true,
                verticalId: true,
              },
            },
          },
        },
        orders: {
          where: { status: "pending" },
          select: { quantity: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.status !== "active") {
      return NextResponse.json(
        { success: false, error: "This item is no longer available" },
        { status: 400 }
      );
    }

    if (!item.hall.inventoryEnabled || item.hall.status !== "live") {
      return NextResponse.json(
        { success: false, error: "Inventory sales are disabled for this hall" },
        { status: 403 }
      );
    }

    // Check available stock (accounting for pending orders)
    const reservedQuantity = item.orders.reduce((sum, o) => sum + o.quantity, 0);
    const availableStock = item.quantity - reservedQuantity;

    if (qty > availableStock) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${availableStock} units available. ${reservedQuantity} reserved in pending orders.`,
        },
        { status: 400 }
      );
    }

    const totalAmount = item.price * qty;

    // KYC gate for B2B / large orders
    if (totalAmount >= 500 && user.kycTier === "visitor") {
      return NextResponse.json(
        { success: false, error: "KYC verification required for purchases >= $500" },
        { status: 403 }
      );
    }

    // Dormancy check
    const isDormant = await prisma.dormancyVault.findFirst({
      where: { userId: user.id, status: "vaulted" },
    });
    if (isDormant) {
      return NextResponse.json(
        { success: false, error: "Dormant accounts cannot make purchases" },
        { status: 403 }
      );
    }

    // Fee breakdown per blueprint
    // fulfillmentCost = actual cost of goods (per unit * qty)
    // platformFee = 5% of total
    // netToHall = remainder
    const fulfillmentCost = (item.costOfGoods || 0) * qty;
    const platformFee = Math.round(totalAmount * 0.05);
    const netToHall = totalAmount - platformFee - fulfillmentCost;

    // Verify buyer wallet
    const wallet = await prisma.wallet.findUnique({
      where: { ledgerId: user.ledgerId },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    if (wallet.balance < totalAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Required: $${totalAmount.toFixed(2)}, Available: $${wallet.balance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Execute purchase atomically
    const result = await prisma.$transaction(async (tx) => {
      // Lock funds from buyer wallet
      const updatedWallet = await tx.wallet.update({
        where: { ledgerId: user.ledgerId },
        data: {
          balance: { decrement: totalAmount },
          lockedBalance: { increment: totalAmount },
        },
      });

      if (updatedWallet.balance < 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Create order with full fee breakdown
      const order = await tx.inventoryOrder.create({
        data: {
          inventoryId,
          buyerId: user.id,
          amount: totalAmount,
          quantity: qty,
          status: "pending",
          platformFee,
          fulfillmentCost,
          netToHall,
          escrowReleasedAt: null,
          completedAt: null,
        },
        include: {
          inventory: {
            select: {
              title: true,
              price: true,
              hall: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          buyer: {
            select: {
              ledgerId: true,
              displayName: true,
            },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          eventType: "inventory_order_created",
          description: `Inventory order #${order.id} created. ${qty}x "${item.title}" for $${totalAmount}. Platform fee: $${platformFee}. Fulfillment: $${fulfillmentCost}. Net to hall: $${netToHall}.`,
          poolId: item.hall.pool?.poolId,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            orderId: order.id,
            inventoryId,
            quantity: qty,
            totalAmount,
            platformFee,
            fulfillmentCost,
            netToHall,
            buyerLedgerId: user.ledgerId,
          }),
          txHash: `LED-INV-BUY-${Date.now()}`,
          visibleToPublic: true,
        },
      });

      // Hall activity — NO buyer names per blueprint. Just revenue.
      await tx.hallActivity.create({
        data: {
          hallId: item.hall.id,
          type: "inventory_sale",
          description: `${qty}x ${item.title} ordered for $${totalAmount}. 48h escrow active.`,
          metadata: JSON.stringify({
            orderId: order.id,
            inventoryId,
            quantity: qty,
            totalAmount,
            netToHall,
          }),
        },
      });

      // Notification to buyer
      await tx.notification.create({
        data: {
          ledgerId: user.ledgerId,
          poolId: item.hall.pool?.poolId,
          type: "inventory_purchase",
          title: "Purchase Confirmed",
          message: `You ordered ${qty}x "${item.title}" for $${totalAmount}. Funds held in 48h escrow.`,
          read: false,
        },
      });

      return { order, updatedWallet, platformFee, fulfillmentCost, netToHall };
    });

    const escrowExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        inventoryId,
        title: result.order.inventory.title,
        quantity: result.order.quantity,
        amount: result.order.amount,
        status: result.order.status,
        hall: result.order.inventory.hall,
        buyer: {
          ledgerId: result.order.buyer.ledgerId,
          displayName: result.order.buyer.displayName,
        },
      },
      fees: {
        total: totalAmount,
        platformFee: result.platformFee,
        fulfillmentCost: result.fulfillmentCost,
        netToHall: result.netToHall,
      },
      wallet: {
        balance: result.updatedWallet.balance,
        lockedBalance: result.updatedWallet.lockedBalance,
        currency: result.updatedWallet.currency,
      },
      escrow: {
        holdUntil: escrowExpiresAt,
        cancellable: true,
        message: "Funds held in escrow for 48 hours. You may cancel anytime before release.",
      },
    });
  } catch (err: any) {
    console.error("[INVENTORY_BUY_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Login required" },
        { status: 401 }
      );
    }
    if (message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Insufficient balance. Please try again." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: message || "Failed to process purchase" },
      { status: 500 }
    );
  }
}