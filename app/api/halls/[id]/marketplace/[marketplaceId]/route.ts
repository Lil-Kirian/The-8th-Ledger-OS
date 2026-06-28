// app/api/halls/[id]/marketplace/[marketplaceId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";

const PLATFORM_FEE_PCT = 0.05;
const KYC_THRESHOLD = 500;

/* ── GET — Public product detail  */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; marketplaceId: string }> }
): Promise<NextResponse> {
  try {
    const { marketplaceId } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id: marketplaceId },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            hallClass: true,
            inventoryEnabled: true,
            status: true,
            pool: { select: { id: true, verticalId: true, country: true, name: true } },
          },
        },
        _count: {
          select: { orders: { where: { status: { not: "cancelled" } } } },
        },
      },
    });

    if (!item || item.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Item not available" },
        { status: 404 }
      );
    }

    // Universal inventory gate: hall must have inventory enabled and be live
    if (!item.hall?.inventoryEnabled || item.hall.status !== "live") {
      return NextResponse.json(
        { success: false, error: "Inventory market not available for this hall" },
        { status: 400 }
      );
    }

    const availableQty = item.quantity - (item.quantitySold || 0);

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        description: item.description,
        price: Number(item.price),
        currency: "USD",
        quantityTotal: item.quantity,
        quantityAvailable: availableQty,
        quantitySold: item.quantitySold || 0,
        status: item.status,
        images: item.images ? JSON.parse(item.images) : [],
        tags: item.tags ? JSON.parse(item.tags) : [],
        hall: {
          id: item.hall?.id,
          name: item.hall?.name,
          verticalId: item.hall?.pool?.verticalId,
          country: item.hall?.pool?.country,
          poolName: item.hall?.pool?.name,
          class: item.hall?.hallClass,
        },
        ordersCount: item._count.orders,
        listedAt: item.listedAt,
      },
    });
  } catch (error) {
    console.error("[INVENTORY ITEM GET]", error);
    return NextResponse.json(
      { success: false, error: "Item detail unreachable" },
      { status: 500 }
    );
  }
}

/* ── POST — Buy inventory item ─ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; marketplaceId: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);

    const { marketplaceId } = await params;
    const body = await request.json();
    const { quantity = 1 } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: marketplaceId },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            hallClass: true,
            inventoryEnabled: true,
            status: true,
            poolId: true,
            pool: { select: { id: true } },
          },
        },
      },
    });

    if (!item || item.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Item not available" },
        { status: 404 }
      );
    }

    // Universal inventory gate
    if (!item.hall?.inventoryEnabled || item.hall.status !== "live") {
      return NextResponse.json(
        { success: false, error: "This hall does not sell inventory publicly" },
        { status: 400 }
      );
    }

    const availableQty = item.quantity - (item.quantitySold || 0);
    if (quantity > availableQty) {
      return NextResponse.json(
        { success: false, error: `Only ${availableQty} available. You requested ${quantity}.` },
        { status: 409 }
      );
    }

    const unitPrice = Number(item.price);
    const totalPrice = unitPrice * quantity;

    // KYC Gate for large orders
    if (totalPrice >= KYC_THRESHOLD) {
      const kyc = await prisma.kycRecord.findUnique({
        where: { userId: user.id },
        select: { tier: true, legalName: true, status: true },
      });
      if (!kyc || kyc.tier === "visitor" || kyc.status !== "verified") {
        return NextResponse.json(
          { success: false, error: "KYC verification required for purchases $500+. Complete SIV/KYC to continue." },
          { status: 403 }
        );
      }
    }

    // Wallet check
    const wallet = await prisma.wallet.findUnique({
      where: { ledgerId: user.ledgerId },
    });
    const balance = Number(wallet?.balance || 0);
    if (balance < totalPrice) {
      return NextResponse.json(
        { success: false, error: `Insufficient balance. Required: $${totalPrice.toFixed(2)}. Available: $${balance.toFixed(2)}` },
        { status: 409 }
      );
    }

    // Fee breakdown
    const platformFee = Math.round(totalPrice * PLATFORM_FEE_PCT);
    const fulfillmentCost = Math.round(totalPrice * 0.30);
    const netToHall = totalPrice - platformFee - fulfillmentCost;

    // Atomic purchase + escrow
    const result = await prisma.$transaction(async (tx) => {
      // 1. Debit buyer wallet
      await tx.wallet.update({
        where: { ledgerId: user.ledgerId },
        data: { balance: { decrement: totalPrice }, lockedBalance: { increment: totalPrice } },
      });

      // 2. Create order (pending escrow)
      const order = await tx.inventoryOrder.create({
        data: {
          inventoryId: marketplaceId,
          buyerId: user.id,
          amount: totalPrice,
          quantity,
          status: "pending",
          platformFee,
          fulfillmentCost,
          netToHall,
          escrowReleasedAt: null,
        },
      });

      // 3. Reserve inventory
      await tx.inventoryItem.update({
        where: { id: marketplaceId },
        data: { quantitySold: { increment: quantity } },
      });

      // 4. Treasury transaction (escrow hold)
      const txHash = `INV-ESCROW-${order.id}-${Date.now().toString(36).toUpperCase()}`;
      await tx.treasuryTransaction.create({
        data: {
          type: "inventory_escrow",
          amount: totalPrice,
          currency: "USD",
          poolId: item.hall?.poolId,
          ledgerId: user.ledgerId,
          description: `Inventory escrow: ${quantity}x ${item.title} — ${user.displayName}`,
          status: "completed",
          txHash,
          timestamp: new Date(),
          audited: true,
        },
      });

      // 5. Hall activity
      await tx.hallActivity.create({
        data: {
          hallId: item.hallId,
          userId: user.id,
          type: "inventory_sale",
          description: `${user.displayName} purchased ${quantity}x "${item.title}" via 8th Ledger escrow ($${totalPrice.toFixed(2)})`,
          metadata: JSON.stringify({
            orderId: order.id,
            inventoryId: marketplaceId,
            quantity,
            unitPrice,
            totalPrice,
            stage: "pending",
          }),
        },
      });

      // 6. Notify hall owners
      const owners = await tx.ownership.findMany({
        where: { hallId: item.hallId, status: "active" },
        select: { userId: true },
      });

      if (owners.length > 0) {
        await tx.notification.createMany({
          data: owners.map((o) => ({
            ledgerId: o.userId,
            poolId: item.hall?.pool?.id,
            type: "inventory_sale",
            title: "Inventory Sale",
            message: `${quantity}x ${item.title} sold for $${totalPrice.toFixed(2)}. 48h escrow active.`,
            actionUrl: `/halls/${item.hallId}/inventory`,
            createdAt: new Date(),
            read: false,
          })),
          skipDuplicates: true,
        });
      }

      return { order, txHash };
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        inventoryId: marketplaceId,
        buyerId: user.id,
        quantity,
        unitPrice,
        totalPrice,
        status: "pending",
        txHash: result.txHash,
        createdAt: result.order.createdAt,
      },
      message: `Order placed. $${totalPrice.toFixed(2)} held in 48-hour escrow. 8th Ledger will fulfill.`,
    });
  } catch (error) {
    console.error("[INVENTORY ITEM POST]", error);
    return NextResponse.json(
      { success: false, error: "Purchase failed" },
      { status: 500 }
    );
  }
}

/* ── PATCH — Fulfillment & escrow release (8th Ledger only) ─ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; marketplaceId: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    const claims = await getSessionClaims(request);
    const isFounder = isFounderSync(claims);

    if (!isFounder && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "8th Ledger authority required" },
        { status: 403 }
      );
    }

    const { marketplaceId } = await params;
    const body = await request.json();
    const { stage, trackingNumber, fulfillmentCost, notes } = body;

    const validStages = ["processing", "shipped", "delivered", "completed", "cancelled"];
    if (!stage || !validStages.includes(stage)) {
      return NextResponse.json(
        { success: false, error: `Stage must be: ${validStages.join(", ")}` },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: marketplaceId },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            poolId: true,
            pool: { select: { id: true } },
            hallClass: true,
          },
        },
        orders: {
          where: { status: { not: "cancelled" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            buyer: { select: { ledgerId: true } },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    const order = item.orders[0];
    if (!order) {
      return NextResponse.json(
        { success: false, error: "No active order for this item" },
        { status: 400 }
      );
    }

    const totalPrice = Number(order.amount);
    const hallId = item.hallId;

    // Stage validation
    const validTransitions: Record<string, string[]> = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(stage)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from '${order.status}' to '${stage}'` },
        { status: 400 }
      );
    }

    // Get treasury record for hall
    const treasuryRecord = await prisma.hallTreasury.findUnique({
      where: { hallId },
    });

    // Atomic fulfillment
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order
      const updatedOrder = await tx.inventoryOrder.update({
        where: { id: order.id },
        data: {
          status: stage,
          completedAt: stage === "completed" || stage === "delivered" ? new Date() : undefined,
        },
      });

      // 2. Log activity
      await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "inventory_fulfillment",
          description: `Fulfillment: ${item.title} → ${stage.toUpperCase()}${notes ? ` (${notes})` : ""}`,
          metadata: JSON.stringify({
            orderId: order.id,
            inventoryId: marketplaceId,
            stage,
            trackingNumber: trackingNumber || null,
            notes: notes || null,
          }),
        },
      });

      // 3. CANCELLED → refund buyer and restore inventory
      if (stage === "cancelled") {
        await tx.wallet.update({
          where: { ledgerId: order.buyer.ledgerId },
          data: { balance: { increment: totalPrice }, lockedBalance: { decrement: totalPrice } },
        });

        await tx.inventoryItem.update({
          where: { id: marketplaceId },
          data: { quantitySold: { decrement: order.quantity } },
        });

        await tx.treasuryTransaction.create({
          data: {
            type: "inventory_refund",
            amount: totalPrice,
            currency: "USD",
            poolId: item.hall?.poolId,
            ledgerId: order.buyerId,
            description: `Refund: ${order.quantity}x ${item.title} cancelled`,
            status: "completed",
            txHash: `INV-REFUND-${order.id}-${Date.now().toString(36).toUpperCase()}`,
            timestamp: new Date(),
            audited: true,
          },
        });

        await tx.notification.create({
          data: {
            ledgerId: order.buyerId,
            poolId: item.hall?.pool?.id,
            type: "inventory_refund",
            title: "Order Cancelled",
            message: `"${item.title}" cancelled. $${totalPrice.toFixed(2)} refunded.`,
            actionUrl: `/marketplace/inventory/${marketplaceId}`,
            read: false,
          },
        });

        return { updatedOrder, distribution: null };
      }

      // 4. COMPLETED → Revenue distribution
      if (stage === "completed" && totalPrice > 0) {
        const estFulfillmentCost = fulfillmentCost || order.fulfillmentCost || totalPrice * 0.30;
        const platformFee = order.platformFee || Math.floor(totalPrice * PLATFORM_FEE_PCT * 100) / 100;
        const netToTreasury = order.netToHall || (totalPrice - estFulfillmentCost - platformFee);

        const safeNet = Math.max(0, netToTreasury);
        const safeFulfillment = Math.max(0, estFulfillmentCost);
        const safeFee = Math.max(0, platformFee);

        // 4a. Net to Hall Treasury
        if (safeNet > 0) {
          await tx.hallTreasury.upsert({
            where: { hallId },
            create: {
              hallId,
              balance: Math.round(safeNet),
              totalDistributed: 0,
              totalRevenue: Math.round(safeNet),
            },
            update: {
              balance: { increment: Math.round(safeNet) },
              totalRevenue: { increment: Math.round(safeNet) },
            },
          });
        }

        // 4b. Platform fee log
        if (safeFee > 0 && treasuryRecord) {
          await tx.hallTreasuryTransaction.create({
            data: {
              treasuryId: treasuryRecord.id,
              type: "inventory_platform_fee",
              amount: Math.round(safeFee),
              description: `Platform fee: ${order.quantity}x ${item.title}`,
              metadata: JSON.stringify({
                orderId: order.id,
                inventoryId: marketplaceId,
              }),
            },
          });
        }

        // 4c. Fulfillment cost log
        if (safeFulfillment > 0 && treasuryRecord) {
          await tx.hallTreasuryTransaction.create({
            data: {
              treasuryId: treasuryRecord.id,
              type: "inventory_fulfillment_cost",
              amount: Math.round(safeFulfillment),
              description: `Fulfillment cost: ${order.quantity}x ${item.title}`,
              metadata: JSON.stringify({
                orderId: order.id,
                inventoryId: marketplaceId,
              }),
            },
          });
        }

        // 4d. Escrow release log
        if (treasuryRecord) {
          await tx.hallTreasuryTransaction.create({
            data: {
              treasuryId: treasuryRecord.id,
              type: "inventory_escrow_released",
              amount: totalPrice,
              description: `Escrow released: ${order.quantity}x ${item.title} delivered`,
              metadata: JSON.stringify({
                orderId: order.id,
                inventoryId: marketplaceId,
                buyerId: order.buyerId,
              }),
            },
          });
        }

        // 4e. Update escrow release timestamp
        await tx.inventoryOrder.update({
          where: { id: order.id },
          data: { escrowReleasedAt: new Date() },
        });

        // 4f. Unlock buyer funds
        await tx.wallet.update({
          where: { ledgerId: order.buyer.ledgerId },
          data: { lockedBalance: { decrement: totalPrice } },
        });

        // 4g. Audit
        await tx.auditLog.create({
          data: {
            eventType: "inventory_sale_completed",
            description: `Inventory sale: ${order.quantity}x ${item.title} — $${totalPrice.toFixed(2)} (Net: $${safeNet.toFixed(2)}, Fee: $${safeFee.toFixed(2)}, Fulfillment: $${safeFulfillment.toFixed(2)})`,
            amount: totalPrice,
            txHash: `INV-SALE-${order.id}-${Date.now()}`,
            poolId: item.hall?.poolId,
            ledgerId: user.ledgerId,
            visibleToPublic: true,
          },
        });

        // 4h. Notifications
        await tx.notification.create({
          data: {
            ledgerId: order.buyerId,
            poolId: item.hall?.pool?.id,
            type: "inventory_delivered",
            title: "Order Delivered",
            message: `${order.quantity}x ${item.title} fulfilled. $${totalPrice.toFixed(2)} released from escrow.`,
            actionUrl: `/marketplace/inventory/${marketplaceId}`,
            read: false,
          },
        });

        return {
          updatedOrder,
          distribution: {
            total: totalPrice,
            netToTreasury: safeNet,
            platformFee: safeFee,
            fulfillmentCost: safeFulfillment,
          },
        };
      }

      return { updatedOrder, distribution: null };
    });

    return NextResponse.json({
      success: true,
      fulfillment: {
        orderId: result.updatedOrder.id,
        inventoryId: marketplaceId,
        stage,
        status: result.updatedOrder.status,
        completedAt: result.updatedOrder.completedAt,
      },
      distribution: result.distribution,
      message: stage === "completed" && result.distribution
        ? `Order complete. $${result.distribution.total.toFixed(2)} distributed: $${result.distribution.netToTreasury.toFixed(2)} to hall treasury, $${result.distribution.platformFee.toFixed(2)} 8th Ledger fee, $${result.distribution.fulfillmentCost.toFixed(2)} fulfillment.`
        : stage === "cancelled"
        ? `Order cancelled. Buyer refunded $${totalPrice.toFixed(2)}. Inventory restored.`
        : `Fulfillment updated to ${stage}.`,
    });
  } catch (error) {
    console.error("[INVENTORY ITEM PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Fulfillment update failed" },
      { status: 500 }
    );
  }
}