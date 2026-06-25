// app/api/halls/[id]/marketplace/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   8TH LEDGER — HALL INVENTORY ORDER REGISTRY
   Hall owners view and manage inventory orders.
   Fulfillment flow: pending → processing → shipped → delivered → completed
   ============================================================ */

// ── Helper: Check hall ownership ──
async function isHallOwner(hallId: string, userId: string): Promise<boolean> {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: "active" },
  });
  return !!ownership;
}

// ── GET — List hall inventory orders ────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const claims = getSessionClaims(request);
    const isFounder = isFounderSync(claims) || user.role === "founder";

    const { id: hallId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Gate: hall owner or founder/admin
    const isOwner = await isHallOwner(hallId, user.id);
    if (!isOwner && !isFounder) {
      return NextResponse.json(
        { success: false, error: "Hall ownership required" },
        { status: 403 }
      );
    }

    const where: Prisma.InventoryOrderWhereInput = {
      inventory: { hallId },
    };
    if (status !== "all") {
      where.status = status;
    }

    const [orders, total, revenueAgg] = await prisma.$transaction([
      prisma.inventoryOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          inventory: {
            select: {
              id: true,
              title: true,
              price: true,
              hallId: true,
            },
          },
          buyer: {
            select: { id: true, ledgerId: true, displayName: true, avatar: true },
          },
        },
      }),
      prisma.inventoryOrder.count({ where }),
      prisma.inventoryOrder.aggregate({
        where: { inventory: { hallId }, status: "completed" },
        _sum: { amount: true, netToHall: true, platformFee: true, fulfillmentCost: true },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.amount || 0);
    const totalNetToHall = Number(revenueAgg._sum.netToHall || 0);
    const totalPlatformFee = Number(revenueAgg._sum.platformFee || 0);
    const totalFulfillmentCost = Number(revenueAgg._sum.fulfillmentCost || 0);

    return NextResponse.json({
      success: true,
      hallId,
      orders: orders.map((o) => ({
        id: o.id,
        inventoryId: o.inventoryId,
        title: o.inventory.title,
        unitPrice: o.inventory.price,
        amount: o.amount,
        quantity: o.quantity,
        status: o.status,
        platformFee: o.platformFee,
        fulfillmentCost: o.fulfillmentCost,
        netToHall: o.netToHall,
        buyer: o.buyer,
        escrowReleasedAt: o.escrowReleasedAt,
        createdAt: o.createdAt,
        completedAt: o.completedAt,
      })),
      summary: {
        totalOrders: total,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalNetToHall: Number(totalNetToHall.toFixed(2)),
        totalPlatformFee: Number(totalPlatformFee.toFixed(2)),
        totalFulfillmentCost: Number(totalFulfillmentCost.toFixed(2)),
        pendingCount: orders.filter((o) => o.status === "pending").length,
        processingCount: orders.filter((o) => o.status === "processing").length,
        shippedCount: orders.filter((o) => o.status === "shipped").length,
        deliveredCount: orders.filter((o) => o.status === "delivered").length,
        completedCount: orders.filter((o) => o.status === "completed").length,
        cancelledCount: orders.filter((o) => o.status === "cancelled").length,
      },
      meta: {
        page,
        limit,
        total,
        hasMore: skip + orders.length < total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    console.error("[HALL_INVENTORY_ORDERS_GET]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Order registry unreachable" },
      { status: 500 }
    );
  }
}

// ── POST — Fulfillment & escrow release ───────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const claims = getSessionClaims(request);
    const isFounder = isFounderSync(claims) || user.role === "founder";

    const { id: hallId } = await params;
    const body = await request.json();
    const { orderId, action, trackingNumber, notes } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: "orderId and action required" },
        { status: 400 }
      );
    }

    const validActions = ["processing", "shipped", "delivered", "completed", "cancelled"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch order with inventory + buyer + pool info
    const order = await prisma.inventoryOrder.findFirst({
      where: { id: orderId, inventory: { hallId } },
      include: {
        inventory: {
          include: {
            hall: {
              select: {
                id: true,
                name: true,
                poolId: true,
                pool: { select: { id: true, poolId: true } },
              },
            },
          },
        },
        buyer: { select: { id: true, ledgerId: true, displayName: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found in this hall" },
        { status: 404 }
      );
    }

    // Gate: hall owner or founder/admin
    const isOwner = await isHallOwner(hallId, user.id);
    if (!isOwner && !isFounder) {
      return NextResponse.json(
        { success: false, error: "Hall ownership or 8th Ledger authority required" },
        { status: 403 }
      );
    }

    // Transition validation
    const validTransitions: Record<string, string[]> = {
      pending: ["processing", "shipped", "delivered", "completed", "cancelled"],
      processing: ["shipped", "delivered", "completed", "cancelled"],
      shipped: ["delivered", "completed", "cancelled"],
      delivered: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Cannot '${action}' from status '${order.status}'` },
        { status: 400 }
      );
    }

    const totalPrice = order.amount;

    // Atomic processing
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order
      const updateData: Prisma.InventoryOrderUpdateInput = {
        status: action,
        updatedAt: new Date(),
      };
      if (action === "completed") {
        updateData.completedAt = new Date();
        updateData.escrowReleasedAt = new Date();
      }

      const updated = await tx.inventoryOrder.update({
        where: { id: orderId },
        data: updateData,
      });

      // 2. Hall activity log — NO buyer names per blueprint
      await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "inventory_fulfillment",
          description: `Order #${orderId.slice(-6)}: ${action.toUpperCase()} — "${order.inventory.title}" x${order.quantity}`,
          metadata: JSON.stringify({
            orderId,
            action,
            totalPrice,
            trackingNumber: trackingNumber || null,
            notes: notes || null,
          }),
        },
      });

      // 3. CANCELLED → refund buyer
      if (action === "cancelled") {
        // Refund buyer wallet
        await tx.wallet.update({
          where: { ledgerId: order.buyer.ledgerId },
          data: {
            balance: { increment: totalPrice },
            lockedBalance: { decrement: totalPrice },
          },
        });

        // Audit
        await tx.auditLog.create({
          data: {
            eventType: "inventory_order_cancelled",
            description: `Order #${orderId} cancelled. ${order.quantity}x ${order.inventory.title} refunded. $${totalPrice.toFixed(2)} returned to buyer.`,
            amount: totalPrice,
            txHash: `INV-CANCEL-${orderId}-${Date.now()}`,
            poolId: order.inventory.hall.pool?.id,
            ledgerId: user.ledgerId,
            visibleToPublic: true,
          },
        });

        return { updated, distribution: null };
      }

      // 4. COMPLETED → release escrow, credit hall treasury
      if (action === "completed" && totalPrice > 0) {
        const netToHall = order.netToHall || 0;
        const platformFee = order.platformFee || 0;
        const fulfillmentCost = order.fulfillmentCost || 0;

        // Unlock buyer funds
        await tx.wallet.update({
          where: { ledgerId: order.buyer.ledgerId },
          data: { lockedBalance: { decrement: totalPrice } },
        });

        // Track cumulative sales
        await tx.inventoryItem.update({
          where: { id: order.inventoryId },
          data: { quantitySold: { increment: order.quantity } },
        });

        // Credit hall treasury
        if (netToHall > 0) {
          const treasury = await tx.hallTreasury.findUnique({
            where: { hallId },
          });

          if (treasury) {
            await tx.hallTreasury.update({
              where: { id: treasury.id },
              data: {
                balance: { increment: netToHall },
                totalRevenue: { increment: netToHall },
                monthlyRevenue: { increment: netToHall },
              },
            });

            await tx.hallTreasuryTransaction.create({
              data: {
                treasuryId: treasury.id,
                type: "inventory_sale",
                amount: netToHall,
                description: `Sale: ${order.quantity}x ${order.inventory.title} — Net to hall`,
                metadata: JSON.stringify({
                  orderId,
                  inventoryId: order.inventoryId,
                  buyerId: order.buyerId,
                }),
              },
            });
          }
        }

        // Platform fee log — uses Pool.poolId (string), not Pool.id (cuid)
        const poolIdString = order.inventory.hall.pool?.poolId;
        if (platformFee > 0 && poolIdString) {
          await tx.treasuryTransaction.create({
            data: {
              type: "inventory_platform_fee",
              amount: platformFee,
              currency: "USD",
              poolId: poolIdString,
              description: `Platform fee: ${order.quantity}x ${order.inventory.title}`,
              status: "completed",
              txHash: `INV-FEE-${orderId}-${Date.now()}`,
              timestamp: new Date(),
              audited: true,
            },
          });
        }

        // Fulfillment cost log
        if (fulfillmentCost > 0 && poolIdString) {
          await tx.treasuryTransaction.create({
            data: {
              type: "inventory_fulfillment_cost",
              amount: fulfillmentCost,
              currency: "USD",
              poolId: poolIdString,
              description: `Fulfillment cost: ${order.quantity}x ${order.inventory.title}`,
              status: "completed",
              txHash: `INV-FULFILL-${orderId}-${Date.now()}`,
              timestamp: new Date(),
              audited: true,
            },
          });
        }

        // Audit
        await tx.auditLog.create({
          data: {
            eventType: "inventory_sale_completed",
            description: `Sale completed: ${order.quantity}x ${order.inventory.title} — $${totalPrice.toFixed(2)} (Net: $${netToHall.toFixed(2)}, Platform: $${platformFee.toFixed(2)}, Fulfillment: $${fulfillmentCost.toFixed(2)})`,
            amount: totalPrice,
            txHash: `INV-SALE-${orderId}-${Date.now()}`,
            poolId: order.inventory.hall.pool?.id,
            ledgerId: user.ledgerId,
            visibleToPublic: true,
          },
        });

        return {
          updated,
          distribution: {
            total: totalPrice,
            netToHall,
            platformFee,
            fulfillmentCost,
          },
        };
      }

      return { updated, distribution: null };
    });

    // Post-transaction notifications (fire and forget)
    const notifPromises: Promise<unknown>[] = [];

    if (action === "cancelled") {
      notifPromises.push(
        prisma.notification.create({
          data: {
            ledgerId: order.buyerId,
            poolId: order.inventory.hall.pool?.id,
            type: "inventory_refund",
            title: "Order Cancelled",
            message: `"${order.inventory.title}" cancelled. $${totalPrice.toFixed(2)} refunded to your wallet.`,
            actionUrl: `/marketplace/inventory/${order.inventoryId}`,
            read: false,
          },
        })
      );
    } else if (action === "completed" && result.distribution) {
      notifPromises.push(
        prisma.notification.create({
          data: {
            ledgerId: order.buyerId,
            poolId: order.inventory.hall.pool?.id,
            type: "inventory_delivered",
            title: "Order Delivered",
            message: `${order.quantity}x ${order.inventory.title} fulfilled. $${totalPrice.toFixed(2)} released from escrow.`,
            actionUrl: `/marketplace/inventory/${order.inventoryId}`,
            read: false,
          },
        })
      );
    }

    Promise.all(notifPromises).catch((err) => {
      console.error("[HALL_ORDERS_NOTIFICATIONS]", err);
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.updated.id,
        status: result.updated.status,
        action,
        completedAt: result.updated.completedAt,
        escrowReleasedAt: result.updated.escrowReleasedAt,
      },
      distribution: result.distribution,
      message: action === "completed" && result.distribution
        ? `Order complete. $${result.distribution.total.toFixed(2)} distributed: $${result.distribution.netToHall.toFixed(2)} to hall treasury, $${result.distribution.platformFee.toFixed(2)} platform fee, $${result.distribution.fulfillmentCost.toFixed(2)} fulfillment.`
        : action === "cancelled"
        ? `Order cancelled. Buyer refunded $${totalPrice.toFixed(2)}.`
        : `Order status updated to ${action}.`,
    });
  } catch (err: unknown) {
    console.error("[HALL_INVENTORY_ORDERS_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Order processing failed" },
      { status: 500 }
    );
  }
}