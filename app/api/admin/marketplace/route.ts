// app/api/admin/marketplace/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole, isPrimaryAdminRole } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   8TH LEDGER — ADMIN MARKETPLACE API
   Oversight for Ownership + Inventory markets + IHCP
   ============================================================ */

function handlePrismaError(error: any): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }
  }
  console.error("[ADMIN_MARKETPLACE ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Marketplace operation failed" },
    { status: 500 }
  );
}

function requireAdminOrFounder(user: { role: string } | null): NextResponse | null {
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminRole(user.role) && !isPrimaryAdminRole(user.role)) {
    return NextResponse.json(
      { success: false, error: "Admin or founder authority required" },
      { status: 403 }
    );
  }
  return null;
}

/* ============================================================
   GET /api/admin/marketplace
   view=orders | disputes | velocity | ihcp
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    const authError = requireAdminOrFounder(user);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "orders";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    /* ── IHCP VIEW ── */
    if (view === "ihcp") {
      const hallId = searchParams.get("hallId");
      const status = searchParams.get("status") || "active";

      const where: Prisma.HallContributionWhereInput = {
        status: status === "all" ? undefined : status,
      };
      if (hallId) where.hallId = hallId;

      const [contributions, total] = await Promise.all([
        prisma.hallContribution.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            hall: {
              select: {
                id: true,
                name: true,
                pool: { select: { poolId: true, name: true, verticalId: true } },
                ihcpBalance: true,
              },
            },
            user: {
              select: { ledgerId: true, displayName: true },
            },
          },
        }),
        prisma.hallContribution.count({ where }),
      ]);

      const summary = await prisma.hallContribution.groupBy({
        by: ["status"],
        _sum: { amount: true, repaidAmount: true },
        _count: true,
      });

      return NextResponse.json({
        success: true,
        contributions: contributions.map((c) => ({
          id: c.id,
          amount: c.amount,
          repaidAmount: c.repaidAmount,
          purpose: c.purpose,
          status: c.status,
          contributor: c.user,
          hall: c.hall,
          createdAt: c.createdAt,
        })),
        summary: Object.fromEntries(
          summary.map((s) => [
            s.status,
            {
              count: s._count,
              totalContributed: s._sum.amount || 0,
              totalRepaid: s._sum.repaidAmount || 0,
            },
          ])
        ),
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    /* ── DISPUTES ── */
    if (view === "disputes") {
      const status = searchParams.get("status");
      const hallId = searchParams.get("hallId");

      const invWhere: Prisma.InventoryOrderWhereInput = {
        status: { in: ["disputed", "refunded"] },
      };
      if (status) invWhere.status = status;

      const ownWhere: Prisma.OwnershipListingWhereInput = {
        status: { in: ["disputed", "cancelled"] },
      };
      if (hallId) {
        invWhere.inventory = { hallId };
        ownWhere.hallId = hallId;
      }

      const [inventoryOrders, ownershipListings, invTotal, ownTotal] = await Promise.all([
        prisma.inventoryOrder.findMany({
          where: invWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            inventory: {
              select: {
                title: true,
                price: true,
                hall: {
                  select: { id: true, name: true, pool: { select: { poolId: true, name: true } } },
                },
              },
            },
            buyer: { select: { ledgerId: true, displayName: true } },
          },
        }),
        prisma.ownershipListing.findMany({
          where: ownWhere,
          orderBy: { listedAt: "desc" },
          skip,
          take: limit,
          include: {
            hall: {
              select: { id: true, name: true, pool: { select: { poolId: true, name: true } } },
            },
            seller: { select: { ledgerId: true, displayName: true, kycTier: true } },
            buyer: { select: { ledgerId: true, displayName: true } },
            ownership: { select: { ownershipPercent: true } },
          },
        }),
        prisma.inventoryOrder.count({ where: invWhere }),
        prisma.ownershipListing.count({ where: ownWhere }),
      ]);

      return NextResponse.json({
        success: true,
        inventoryDisputes: inventoryOrders.map((o) => ({
          id: o.id,
          market: "inventory",
          status: o.status,
          amount: o.amount,
          quantity: o.quantity,
          platformFee: o.platformFee,
          fulfillmentCost: o.fulfillmentCost,
          netToHall: o.netToHall,
          createdAt: o.createdAt,
          item: o.inventory,
          buyer: o.buyer,
          hall: o.inventory?.hall,
        })),
        ownershipDisputes: ownershipListings.map((l) => ({
          id: l.id,
          market: "ownership",
          status: l.status,
          percentListed: l.percentListed,
          pricePerPercent: l.pricePerPercent,
          totalPrice: l.totalPrice,
          floorPrice: l.floorPrice,
          isFractional: l.isFractional,
          sellerKycTier: l.sellerKycTier,
          belowFloorApproved: l.belowFloorApproved,
          escrowExpiresAt: l.escrowExpiresAt,
          auditHash: l.auditHash,
          listedAt: l.listedAt,
          escrowStartedAt: l.escrowStartedAt,
          seller: l.seller,
          buyer: l.buyer,
          hall: l.hall,
          ownershipPercent: l.ownership?.ownershipPercent,
        })),
        meta: {
          page,
          limit,
          total: invTotal + ownTotal,
          pages: Math.ceil((invTotal + ownTotal) / limit),
          inventoryTotal: invTotal,
          ownershipTotal: ownTotal,
        },
      });
    }

    /* ── VELOCITY ── */
    if (view === "velocity") {
      const hallId = searchParams.get("hallId");
      const since3mo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const since6mo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const since24mo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);

      const hallWhere: Prisma.HallWhereInput = hallId ? { id: hallId } : { status: "live" };

      const halls = await prisma.hall.findMany({
        where: hallWhere,
        select: {
          id: true,
          name: true,
          inventoryEnabled: true,
          forgeEnabled: true,
          sriScore: true,
          ahgiScore: true,
          pool: { select: { poolId: true, name: true, verticalId: true } },
        },
        take: 100,
      });

      const hallIds = halls.map((h) => h.id);

      const [inv3mo, inv6mo, inv24mo] = await Promise.all([
        prisma.inventoryOrder.findMany({
          where: {
            inventory: { hallId: { in: hallIds } },
            createdAt: { gte: since3mo },
            status: { not: "cancelled" },
          },
          select: { id: true, amount: true, status: true, createdAt: true, inventory: { select: { hallId: true } } },
        }),
        prisma.inventoryOrder.findMany({
          where: {
            inventory: { hallId: { in: hallIds } },
            createdAt: { gte: since6mo },
            status: { not: "cancelled" },
          },
          select: { id: true, amount: true, status: true, createdAt: true, inventory: { select: { hallId: true } } },
        }),
        prisma.inventoryOrder.findMany({
          where: {
            inventory: { hallId: { in: hallIds } },
            createdAt: { gte: since24mo },
            status: { not: "cancelled" },
          },
          select: { id: true, amount: true, status: true, createdAt: true, inventory: { select: { hallId: true } } },
        }),
      ]);

      const [own3mo, own6mo, own24mo] = await Promise.all([
        prisma.ownershipListing.findMany({
          where: {
            hallId: { in: hallIds },
            soldAt: { gte: since3mo },
            status: "sold",
          },
          select: { id: true, totalPrice: true, soldAt: true, hallId: true },
        }),
        prisma.ownershipListing.findMany({
          where: {
            hallId: { in: hallIds },
            soldAt: { gte: since6mo },
            status: "sold",
          },
          select: { id: true, totalPrice: true, soldAt: true, hallId: true },
        }),
        prisma.ownershipListing.findMany({
          where: {
            hallId: { in: hallIds },
            soldAt: { gte: since24mo },
            status: "sold",
          },
          select: { id: true, totalPrice: true, soldAt: true, hallId: true },
        }),
      ]);

      const hallVelocity = halls.map((h) => {
        const hInv3 = inv3mo.filter((o) => o.inventory?.hallId === h.id);
        const hInv6 = inv6mo.filter((o) => o.inventory?.hallId === h.id);
        const hInv24 = inv24mo.filter((o) => o.inventory?.hallId === h.id);

        const hOwn3 = own3mo.filter((o) => o.hallId === h.id);
        const hOwn6 = own6mo.filter((o) => o.hallId === h.id);
        const hOwn24 = own24mo.filter((o) => o.hallId === h.id);

        const invGMV3 = hInv3.reduce((s, o) => s + o.amount, 0);
        const invGMV6 = hInv6.reduce((s, o) => s + o.amount, 0);
        const ownGMV3 = hOwn3.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const ownGMV6 = hOwn6.reduce((s, o) => s + (o.totalPrice || 0), 0);

        let warning = null;
        if (h.inventoryEnabled && hInv3.length === 0 && hInv6.length > 0) {
          warning = { level: "warning", message: "No inventory sales in 3 months. Marketing recommended." };
        } else if (h.inventoryEnabled && hInv6.length === 0 && hInv24.length > 0) {
          warning = { level: "takeover", message: "No inventory sales in 6 months. Community split drops to 50%." };
        } else if (h.inventoryEnabled && hInv24.length === 0) {
          warning = { level: "reclamation", message: "No inventory sales in 24 months. Asset eligible for reclamation." };
        }

        return {
          hallId: h.id,
          hallName: h.name,
          pool: h.pool,
          features: {
            inventoryEnabled: h.inventoryEnabled,
            forgeEnabled: h.forgeEnabled,
          },
          scores: { sri: h.sriScore, ahgi: h.ahgiScore },
          inventory: {
            "3mo": { orders: hInv3.length, gmv: invGMV3 },
            "6mo": { orders: hInv6.length, gmv: invGMV6 },
            "24mo": { orders: hInv24.length, gmv: hInv24.reduce((s, o) => s + o.amount, 0) },
          },
          ownership: {
            "3mo": { sales: hOwn3.length, gmv: ownGMV3 },
            "6mo": { sales: hOwn6.length, gmv: ownGMV6 },
            "24mo": { sales: hOwn24.length, gmv: hOwn24.reduce((s, o) => s + (o.totalPrice || 0), 0) },
          },
          warning,
        };
      });

      const totalInvGMV3 = inv3mo.reduce((s, o) => s + o.amount, 0);
      const totalOwnGMV3 = own3mo.reduce((s, o) => s + (o.totalPrice || 0), 0);

      return NextResponse.json({
        success: true,
        velocity: hallVelocity,
        summary: {
          totalInventoryOrders3mo: inv3mo.length,
          totalOwnershipSales3mo: own3mo.length,
          totalInventoryGMV3mo: totalInvGMV3,
          totalOwnershipGMV3mo: totalOwnGMV3,
          hallsAtRisk: hallVelocity.filter((h) => h.warning !== null).length,
        },
      });
    }

    /* ── ORDERS (default) — Combined Inventory + Ownership ── */
    const status = searchParams.get("status");
    const hallId = searchParams.get("hallId");
    const search = searchParams.get("search");

    const invOrderWhere: Prisma.InventoryOrderWhereInput = {};
    if (status) invOrderWhere.status = status;
    if (hallId) invOrderWhere.inventory = { hallId };
    if (search) {
      invOrderWhere.OR = [
        { inventory: { title: { contains: search, mode: "insensitive" } } },
        { buyer: { displayName: { contains: search, mode: "insensitive" } } },
        { buyer: { ledgerId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const ownWhere: Prisma.OwnershipListingWhereInput = {};
    if (status) ownWhere.status = status;
    if (hallId) ownWhere.hallId = hallId;
    if (search) {
      ownWhere.OR = [
        { seller: { displayName: { contains: search, mode: "insensitive" } } },
        { seller: { ledgerId: { contains: search, mode: "insensitive" } } },
        { buyer: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [inventoryOrders, ownershipListings, invTotal, ownTotal] = await Promise.all([
      prisma.inventoryOrder.findMany({
        where: invOrderWhere,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          inventory: {
            select: {
              title: true,
              price: true,
              hall: { select: { id: true, name: true } },
            },
          },
          buyer: { select: { ledgerId: true, displayName: true } },
        },
      }),
      prisma.ownershipListing.findMany({
        where: ownWhere,
        orderBy: { listedAt: "desc" },
        skip,
        take: limit,
        include: {
          hall: { select: { id: true, name: true } },
          seller: { select: { ledgerId: true, displayName: true, kycTier: true } },
          buyer: { select: { ledgerId: true, displayName: true } },
          ownership: { select: { ownershipPercent: true } },
        },
      }),
      prisma.inventoryOrder.count({ where: invOrderWhere }),
      prisma.ownershipListing.count({ where: ownWhere }),
    ]);

    const invStats = await prisma.inventoryOrder.groupBy({
      by: ["status"],
      _count: true,
    });
    const ownStats = await prisma.ownershipListing.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      inventoryOrders: inventoryOrders.map((o) => ({
        id: o.id,
        market: "inventory",
        status: o.status,
        amount: o.amount,
        quantity: o.quantity,
        platformFee: o.platformFee,
        fulfillmentCost: o.fulfillmentCost,
        netToHall: o.netToHall,
        createdAt: o.createdAt,
        escrowReleasedAt: o.escrowReleasedAt,
        completedAt: o.completedAt,
        item: o.inventory,
        buyer: o.buyer,
        hall: o.inventory?.hall,
      })),
      ownershipListings: ownershipListings.map((l) => ({
        id: l.id,
        market: "ownership",
        status: l.status,
        percentListed: l.percentListed,
        pricePerPercent: l.pricePerPercent,
        totalPrice: l.totalPrice,
        floorPrice: l.floorPrice,
        isFractional: l.isFractional,
        sellerKycTier: l.sellerKycTier,
        belowFloorApproved: l.belowFloorApproved,
        viewCount: l.viewCount,
        interestCount: l.interestCount,
        escrowExpiresAt: l.escrowExpiresAt,
        auditHash: l.auditHash,
        listedAt: l.listedAt,
        expiresAt: l.expiresAt,
        soldAt: l.soldAt,
        escrowStartedAt: l.escrowStartedAt,
        seller: l.seller,
        buyer: l.buyer,
        hall: l.hall,
        ownershipPercent: l.ownership?.ownershipPercent,
      })),
      stats: {
        inventory: Object.fromEntries(invStats.map((s) => [s.status, s._count])),
        ownership: Object.fromEntries(ownStats.map((s) => [s.status, s._count])),
      },
      meta: {
        page,
        limit,
        total: invTotal + ownTotal,
        pages: Math.ceil((invTotal + ownTotal) / limit),
        inventoryTotal: invTotal,
        ownershipTotal: ownTotal,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   POST /api/admin/marketplace — Admin actions
   resolve_dispute | override_escrow | suspend_listing
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    const authError = requireAdminOrFounder(user);
    if (authError) return authError;

    const body = await request.json();
    const { action } = body;

    /* ===== RESOLVE INVENTORY DISPUTE ===== */
    if (action === "resolve_inventory_dispute") {
      const { orderId, resolution, reason } = body;
      if (!orderId || !resolution || !["release_to_hall", "refund_buyer"].includes(resolution)) {
        return NextResponse.json(
          { success: false, error: "orderId and resolution (release_to_hall|refund_buyer) required" },
          { status: 400 }
        );
      }
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "reason required for dispute resolution" },
          { status: 400 }
        );
      }

      const order = await prisma.inventoryOrder.findUnique({
        where: { id: orderId },
        include: {
          inventory: {
            select: {
              title: true,
              hallId: true,
              hall: { select: { id: true, name: true, poolId: true } },
            },
          },
          buyer: { select: { id: true, ledgerId: true, displayName: true } },
        },
      });

      if (!order) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      if (order.status !== "disputed") {
        return NextResponse.json(
          { success: false, error: `Order is ${order.status}, not disputed` },
          { status: 409 }
        );
      }

      const platformFee = order.platformFee || Math.round(order.amount * 0.05);
      const fulfillmentCost = order.fulfillmentCost || 0;
      const netToHall = order.netToHall || (order.amount - platformFee - fulfillmentCost);

      await prisma.$transaction(async (tx) => {
        if (resolution === "release_to_hall") {
          await tx.inventoryOrder.update({
            where: { id: order.id },
            data: {
              status: "completed",
              completedAt: new Date(),
              escrowReleasedAt: new Date(),
              platformFee,
              fulfillmentCost,
              netToHall,
            },
          });

          await tx.wallet.update({
            where: { ledgerId: order.buyer.ledgerId },
            data: { lockedBalance: { decrement: order.amount } },
          });

          if (order.inventory?.hallId) {
            await tx.hallTreasury.update({
              where: { hallId: order.inventory.hallId },
              data: { balance: { increment: netToHall } },
            });
          }

          await tx.auditLog.create({
            data: {
              eventType: "inventory_marketplace_fee",
              description: `8th Ledger fee ($${platformFee}) from inventory sale #${order.id}`,
              amount: platformFee,
              txHash: `LED-INV-FEE-${order.id}-${Date.now()}`,
              poolId: order.inventory?.hall?.poolId,
              ledgerId: user.ledgerId,
              metadata: JSON.stringify({ orderId: order.id, feePercent: 5, feeAmount: platformFee, fulfillmentCost, netToHall }),
              visibleToPublic: false,
            },
          });
        } else {
          await tx.inventoryOrder.update({
            where: { id: order.id },
            data: { status: "refunded", completedAt: new Date() },
          });

          await tx.wallet.update({
            where: { ledgerId: order.buyer.ledgerId },
            data: {
              lockedBalance: { decrement: order.amount },
              balance: { increment: order.amount },
            },
          });
        }

        await tx.auditLog.create({
          data: {
            eventType: "inventory_dispute_resolved",
            description: `Inventory dispute resolved: ${resolution}. Order ${order.id}. Item: ${order.inventory?.title}. Reason: ${reason}`,
            amount: order.amount,
            txHash: `LED-INV-DISPUTE-${order.id}-${Date.now()}`,
            poolId: order.inventory?.hall?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ orderId, resolution, reason, platformFee, netToHall }),
            visibleToPublic: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        resolution: { orderId: order.id, outcome: resolution, amount: order.amount, reason, platformFee, netToHall },
        message: `Inventory dispute resolved: ${resolution}.`,
      });
    }

    /* ===== RESOLVE OWNERSHIP DISPUTE ===== */
    if (action === "resolve_ownership_dispute") {
      const { listingId, resolution, reason } = body;
      if (!listingId || !resolution || !["release_to_seller", "refund_buyer"].includes(resolution)) {
        return NextResponse.json(
          { success: false, error: "listingId and resolution (release_to_seller|refund_buyer) required" },
          { status: 400 }
        );
      }
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "reason required" },
          { status: 400 }
        );
      }

      const listing = await prisma.ownershipListing.findUnique({
        where: { id: listingId },
        include: {
          hall: { select: { id: true, name: true, poolId: true } },
          seller: { select: { id: true, ledgerId: true, displayName: true } },
          buyer: { select: { id: true, ledgerId: true, displayName: true } },
          ownership: { select: { id: true, ownershipPercent: true } },
        },
      });

      if (!listing) {
        return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
      }
      if (listing.status !== "disputed") {
        return NextResponse.json(
          { success: false, error: `Listing is ${listing.status}, not disputed` },
          { status: 409 }
        );
      }

      const feeRate = listing.isFractional ? 0.02 : 0.01;
      const ledgerFee = Math.round(listing.totalPrice * feeRate);
      const sellerReceives = listing.totalPrice - ledgerFee;

      await prisma.$transaction(async (tx) => {
        if (resolution === "release_to_seller") {
          await tx.ownershipListing.update({
            where: { id: listing.id },
            data: { status: "sold", soldAt: new Date() },
          });

          if (listing.buyer) {
            await tx.wallet.update({
              where: { ledgerId: listing.buyer.ledgerId },
              data: { lockedBalance: { decrement: listing.totalPrice } },
            });
          }

          await tx.wallet.update({
            where: { ledgerId: listing.seller.ledgerId },
            data: { balance: { increment: sellerReceives } },
          });

          if (listing.buyerId && listing.ownership) {
            await tx.ownership.update({
              where: { id: listing.ownership.id },
              data: {
                userId: listing.buyerId,
                ledgerId: listing.buyer?.ledgerId,
                updatedAt: new Date(),
              },
            });
          }

          await tx.auditLog.create({
            data: {
              eventType: "ownership_marketplace_fee",
              description: `8th Ledger fee ($${ledgerFee}) from ownership sale #${listing.id}`,
              amount: ledgerFee,
              txHash: `LED-OWN-FEE-${listing.id}-${Date.now()}`,
              poolId: listing.hall?.poolId,
              ledgerId: user.ledgerId,
              metadata: JSON.stringify({ listingId: listing.id, feeRate, feeAmount: ledgerFee, sellerReceives, isFractional: listing.isFractional }),
              visibleToPublic: false,
            },
          });
        } else {
          await tx.ownershipListing.update({
            where: { id: listing.id },
            data: { status: "active", buyerId: null, escrowStartedAt: null, escrowExpiresAt: null },
          });

          if (listing.buyer) {
            await tx.wallet.update({
              where: { ledgerId: listing.buyer.ledgerId },
              data: {
                lockedBalance: { decrement: listing.totalPrice },
                balance: { increment: listing.totalPrice },
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            eventType: "ownership_dispute_resolved",
            description: `Ownership dispute resolved: ${resolution}. Listing ${listing.id}. Hall: ${listing.hall?.name}. Reason: ${reason}`,
            amount: Math.round(listing.totalPrice),
            txHash: `LED-OWN-DISPUTE-${listing.id}-${Date.now()}`,
            poolId: listing.hall?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ listingId, resolution, reason, ledgerFee, sellerReceives }),
            visibleToPublic: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        resolution: { listingId: listing.id, outcome: resolution, amount: listing.totalPrice, reason, ledgerFee, sellerReceives },
        message: `Ownership dispute resolved: ${resolution}.`,
      });
    }

    /* ===== OVERRIDE ESCROW ===== */
    if (action === "override_escrow") {
      const { targetId, targetType, overrideAction, reason } = body;
      if (!targetId || !targetType || !["inventory", "ownership"].includes(targetType) || !overrideAction || !["release", "cancel", "hold"].includes(overrideAction)) {
        return NextResponse.json(
          { success: false, error: "targetId, targetType (inventory|ownership), overrideAction (release|cancel|hold) required" },
          { status: 400 }
        );
      }
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "reason required for escrow override" },
          { status: 400 }
        );
      }

      if (targetType === "inventory") {
        const order = await prisma.inventoryOrder.findUnique({
          where: { id: targetId },
          include: {
            inventory: { select: { title: true, hallId: true, hall: { select: { poolId: true } } } },
            buyer: { select: { ledgerId: true } },
          },
        });
        if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

        const platformFee = order.platformFee || Math.round(order.amount * 0.05);
        const fulfillmentCost = order.fulfillmentCost || 0;
        const netToHall = order.netToHall || (order.amount - platformFee - fulfillmentCost);

        await prisma.$transaction(async (tx) => {
          let newStatus = order.status;
          if (overrideAction === "release") {
            newStatus = "completed";

            await tx.wallet.update({
              where: { ledgerId: order.buyer.ledgerId },
              data: { lockedBalance: { decrement: order.amount } },
            });

            if (order.inventory?.hallId) {
              await tx.hallTreasury.update({
                where: { hallId: order.inventory.hallId },
                data: { balance: { increment: netToHall } },
              });
            }

            await tx.auditLog.create({
              data: {
                eventType: "inventory_marketplace_fee",
                description: `8th Ledger fee from escrow override release #${order.id}`,
                amount: platformFee,
                txHash: `LED-INV-FEE-${order.id}-${Date.now()}`,
                poolId: order.inventory?.hall?.poolId,
                ledgerId: user.ledgerId,
                metadata: JSON.stringify({ orderId: order.id, action: overrideAction, platformFee, netToHall }),
                visibleToPublic: false,
              },
            });
          } else if (overrideAction === "cancel") {
            newStatus = "refunded";
            await tx.wallet.update({
              where: { ledgerId: order.buyer.ledgerId },
              data: {
                lockedBalance: { decrement: order.amount },
                balance: { increment: order.amount },
              },
            });
          }

          await tx.inventoryOrder.update({
            where: { id: order.id },
            data: {
              status: newStatus,
              completedAt: overrideAction !== "hold" ? new Date() : order.completedAt,
              escrowReleasedAt: overrideAction === "release" ? new Date() : order.escrowReleasedAt,
              platformFee: overrideAction === "release" ? platformFee : order.platformFee,
              fulfillmentCost: overrideAction === "release" ? fulfillmentCost : order.fulfillmentCost,
              netToHall: overrideAction === "release" ? netToHall : order.netToHall,
            },
          });

          await tx.auditLog.create({
            data: {
              eventType: "inventory_escrow_override",
              description: `Admin override: ${overrideAction} escrow on inventory order ${order.id}. Reason: ${reason}`,
              amount: order.amount,
              txHash: `LED-INV-ESCROW-OVERRIDE-${order.id}-${Date.now()}`,
              poolId: order.inventory?.hall?.poolId,
              ledgerId: user.ledgerId,
              metadata: JSON.stringify({ orderId: order.id, action: overrideAction, reason, platformFee, netToHall }),
              visibleToPublic: true,
            },
          });
        });

        return NextResponse.json({ success: true, override: { targetId, targetType, action: overrideAction, previousStatus: order.status, reason, platformFee, netToHall } });
      }

      const listing = await prisma.ownershipListing.findUnique({
        where: { id: targetId },
        include: {
          hall: { select: { poolId: true } },
          seller: { select: { ledgerId: true } },
          buyer: { select: { ledgerId: true } },
          ownership: { select: { id: true } },
        },
      });
      if (!listing) return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });

      const feeRate = listing.isFractional ? 0.02 : 0.01;
      const ledgerFee = Math.round(listing.totalPrice * feeRate);
      const sellerReceives = listing.totalPrice - ledgerFee;

      await prisma.$transaction(async (tx) => {
        let newStatus = listing.status;
        if (overrideAction === "release") {
          newStatus = "sold";

          if (listing.buyer) {
            await tx.wallet.update({
              where: { ledgerId: listing.buyer.ledgerId },
              data: { lockedBalance: { decrement: listing.totalPrice } },
            });
          }

          await tx.wallet.update({
            where: { ledgerId: listing.seller.ledgerId },
            data: { balance: { increment: sellerReceives } },
          });

          if (listing.buyerId && listing.ownership) {
            await tx.ownership.update({
              where: { id: listing.ownership.id },
              data: {
                userId: listing.buyerId,
                ledgerId: listing.buyer?.ledgerId,
                updatedAt: new Date(),
              },
            });
          }

          await tx.auditLog.create({
            data: {
              eventType: "ownership_marketplace_fee",
              description: `8th Ledger fee from escrow override release #${listing.id}`,
              amount: ledgerFee,
              txHash: `LED-OWN-FEE-${listing.id}-${Date.now()}`,
              poolId: listing.hall?.poolId,
              ledgerId: user.ledgerId,
              metadata: JSON.stringify({ listingId: listing.id, action: overrideAction, feeRate, ledgerFee, sellerReceives }),
              visibleToPublic: false,
            },
          });
        } else if (overrideAction === "cancel") {
          newStatus = "active";
          if (listing.buyer) {
            await tx.wallet.update({
              where: { ledgerId: listing.buyer.ledgerId },
              data: {
                lockedBalance: { decrement: listing.totalPrice },
                balance: { increment: listing.totalPrice },
              },
            });
          }
          await tx.ownershipListing.update({
            where: { id: listing.id },
            data: { buyerId: null, escrowStartedAt: null, escrowExpiresAt: null },
          });
        }

        await tx.ownershipListing.update({
          where: { id: listing.id },
          data: { status: newStatus, soldAt: overrideAction === "release" ? new Date() : listing.soldAt },
        });

        await tx.auditLog.create({
          data: {
            eventType: "ownership_escrow_override",
            description: `Admin override: ${overrideAction} escrow on ownership listing ${listing.id}. Reason: ${reason}`,
            amount: Math.round(listing.totalPrice),
            txHash: `LED-OWN-ESCROW-OVERRIDE-${listing.id}-${Date.now()}`,
            poolId: listing.hall?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ listingId: listing.id, action: overrideAction, reason, ledgerFee, sellerReceives }),
            visibleToPublic: true,
          },
        });
      });

      return NextResponse.json({ success: true, override: { targetId, targetType, action: overrideAction, previousStatus: listing.status, reason, ledgerFee, sellerReceives } });
    }

    /* ===== SUSPEND LISTING ===== */
    if (action === "suspend_listing") {
      const { targetId, targetType, reason } = body;
      if (!targetId || !targetType || !["inventory", "ownership"].includes(targetType) || !reason) {
        return NextResponse.json(
          { success: false, error: "targetId, targetType (inventory|ownership), reason required" },
          { status: 400 }
        );
      }

      if (targetType === "inventory") {
        const item = await prisma.inventoryItem.findUnique({
          where: { id: targetId },
          include: { hall: { select: { name: true, poolId: true } } },
        });
        if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

        await prisma.inventoryItem.update({
          where: { id: targetId },
          data: { status: "inactive" },
        });

        await prisma.auditLog.create({
          data: {
            eventType: "inventory_item_suspended",
            description: `Inventory item "${item.title}" suspended by admin. Reason: ${reason}`,
            poolId: item.hall?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ itemId: targetId, reason }),
            txHash: `LED-INV-SUSPEND-${targetId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });

        return NextResponse.json({ success: true, suspended: { targetId, targetType, title: item.title, reason } });
      }

      const listing = await prisma.ownershipListing.findUnique({
        where: { id: targetId },
        include: { hall: { select: { name: true, poolId: true } }, seller: { select: { ledgerId: true } } },
      });
      if (!listing) return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });

      await prisma.$transaction(async (tx) => {
        if (listing.status === "escrow" && listing.buyerId) {
          const buyer = await tx.user.findUnique({
            where: { id: listing.buyerId },
            select: { ledgerId: true },
          });
          if (buyer) {
            await tx.wallet.update({
              where: { ledgerId: buyer.ledgerId },
              data: {
                lockedBalance: { decrement: listing.totalPrice },
                balance: { increment: listing.totalPrice },
              },
            });
          }
        }

        await tx.ownershipListing.update({
          where: { id: targetId },
          data: { status: "cancelled", buyerId: null, escrowStartedAt: null, escrowExpiresAt: null },
        });

        await tx.auditLog.create({
          data: {
            eventType: "ownership_listing_suspended",
            description: `Ownership listing suspended by admin. Hall: ${listing.hall?.name}. Reason: ${reason}`,
            poolId: listing.hall?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ listingId: targetId, reason }),
            txHash: `LED-OWN-SUSPEND-${targetId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });
      });

      return NextResponse.json({ success: true, suspended: { targetId, targetType, hall: listing.hall?.name, reason } });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use resolve_inventory_dispute | resolve_ownership_dispute | override_escrow | suspend_listing' },
      { status: 400 }
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   PATCH /api/admin/marketplace — Admin updates
   approve_below_floor | update_listing | force_reclaim
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    const authError = requireAdminOrFounder(user);
    if (authError) return authError;

    const body = await request.json();
    const { action } = body;

    /* ===== APPROVE BELOW-FLOOR LISTING ===== */
    if (action === "approve_below_floor") {
      const { listingId, reason } = body;
      if (!listingId || !reason) {
        return NextResponse.json(
          { success: false, error: "listingId and reason required" },
          { status: 400 }
        );
      }

      const listing = await prisma.ownershipListing.findUnique({
        where: { id: listingId },
        include: { hall: { select: { name: true, poolId: true } }, seller: { select: { ledgerId: true } } },
      });
      if (!listing) return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });

      await prisma.$transaction(async (tx) => {
        await tx.ownershipListing.update({
          where: { id: listingId },
          data: { belowFloorApproved: true },
        });

        await tx.auditLog.create({
          data: {
            eventType: "ownership_below_floor_approved",
            description: `Admin approved below-floor listing #${listingId}. Hall: ${listing.hall?.name}. Reason: ${reason}`,
            amount: Math.round(listing.totalPrice),
            txHash: `LED-OWN-BF-APPROVE-${listingId}-${Date.now()}`,
            poolId: listing.hall?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ listingId, reason, floorPrice: listing.floorPrice, listedPrice: listing.totalPrice }),
            visibleToPublic: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        approved: { listingId, floorPrice: listing.floorPrice, totalPrice: listing.totalPrice, reason },
      });
    }

    /* ===== UPDATE LISTING ===== */
    if (action === "update_listing") {
      const { targetId, targetType, updates, reason } = body;
      if (!targetId || !targetType || !["inventory", "ownership"].includes(targetType) || !updates || !reason) {
        return NextResponse.json(
          { success: false, error: "targetId, targetType, updates, reason required" },
          { status: 400 }
        );
      }

      const allowedInvFields = ["title", "description", "price", "quantity", "status", "imageUrl", "images", "tags", "specs", "costOfGoods", "reorderThreshold"];
      const allowedOwnFields = ["pricePerPercent", "totalPrice", "floorPrice", "expiresAt", "status", "isFractional"];

      if (targetType === "inventory") {
        const filtered: Record<string, unknown> = {};
        for (const key of Object.keys(updates)) {
          if (allowedInvFields.includes(key)) filtered[key] = updates[key];
        }

        const item = await prisma.inventoryItem.findUnique({
          where: { id: targetId },
          include: { hall: { select: { name: true, poolId: true } } },
        });
        if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

        await prisma.inventoryItem.update({
          where: { id: targetId },
          data: { ...filtered, updatedAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            eventType: "inventory_item_updated",
            description: `Inventory item "${item.title}" updated by admin. Reason: ${reason}`,
            poolId: item.hall?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ itemId: targetId, changes: filtered, reason }),
            txHash: `LED-INV-UPDATE-${targetId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });

        return NextResponse.json({ success: true, updated: { targetId, targetType, changes: filtered, reason } });
      }

      const filtered: Record<string, unknown> = {};
      for (const key of Object.keys(updates)) {
        if (allowedOwnFields.includes(key)) filtered[key] = updates[key];
      }

      const listing = await prisma.ownershipListing.findUnique({
        where: { id: targetId },
        include: { hall: { select: { name: true, poolId: true } }, seller: { select: { ledgerId: true } } },
      });
      if (!listing) return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });

      await prisma.ownershipListing.update({
        where: { id: targetId },
        data: { ...filtered },
      });

      await prisma.auditLog.create({
        data: {
          eventType: "ownership_listing_updated",
          description: `Ownership listing updated by admin. Hall: ${listing.hall?.name}. Reason: ${reason}`,
          poolId: listing.hall?.poolId,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ listingId: targetId, changes: filtered, reason }),
          txHash: `LED-OWN-UPDATE-${targetId}-${Date.now()}`,
          visibleToPublic: true,
        },
      });

      return NextResponse.json({ success: true, updated: { targetId, targetType, changes: filtered, reason } });
    }

    /* ===== FORCE RECLAIM ===== */
    if (action === "force_reclaim") {
      const { hallId, reason } = body;
      if (!hallId || !reason) {
        return NextResponse.json(
          { success: false, error: "hallId and reason required" },
          { status: 400 }
        );
      }

      const hall = await prisma.hall.findUnique({
        where: { id: hallId },
        include: { pool: { select: { poolId: true, name: true } } },
      });
      if (!hall) return NextResponse.json({ success: false, error: "Hall not found" }, { status: 404 });

      await prisma.$transaction(async (tx) => {
        await tx.hall.update({
          where: { id: hallId },
          data: { closureStatus: "reclamation", status: "reclamation" },
        });

        await tx.closureProtocol.create({
          data: {
            hallId,
            triggerMonth: new Date(),
            ahgiAtTrigger: hall.ahgiScore,
            revenueAtTrigger: 0,
            payrollAtTrigger: 0,
            phase: "reclamation",
            status: "active",
          },
        });

        await tx.auditLog.create({
          data: {
            eventType: "hall_force_reclaimed",
            description: `Hall ${hall.name} force-reclaimed by admin. Reason: ${reason}`,
            poolId: hall.pool?.poolId,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({ hallId, reason }),
            txHash: `LED-HALL-RECLAIM-${hallId}-${Date.now()}`,
            visibleToPublic: true,
          },
        });
      });

      return NextResponse.json({ success: true, reclaimed: { hallId, hallName: hall.name, reason } });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use approve_below_floor | update_listing | force_reclaim' },
      { status: 400 }
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   DELETE /api/admin/marketplace — Soft-delete listings
   ============================================================ */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    const authError = requireAdminOrFounder(user);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId");
    const targetType = searchParams.get("targetType");
    const reason = searchParams.get("reason");

    if (!targetId || !targetType || !["inventory", "ownership"].includes(targetType) || !reason) {
      return NextResponse.json(
        { success: false, error: "targetId, targetType (inventory|ownership), reason required" },
        { status: 400 }
      );
    }

    if (targetType === "inventory") {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: targetId },
        include: { hall: { select: { name: true, poolId: true } } },
      });
      if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

      await prisma.inventoryItem.update({
        where: { id: targetId },
        data: { status: "deleted", updatedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          eventType: "inventory_item_deleted",
          description: `Inventory item "${item.title}" deleted by admin. Reason: ${reason}`,
          poolId: item.hall?.poolId,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ itemId: targetId, reason }),
          txHash: `LED-INV-DELETE-${targetId}-${Date.now()}`,
          visibleToPublic: true,
        },
      });

      return NextResponse.json({ success: true, deleted: { targetId, targetType, title: item.title, reason } });
    }

    const listing = await prisma.ownershipListing.findUnique({
      where: { id: targetId },
      include: { hall: { select: { name: true, poolId: true } }, seller: { select: { ledgerId: true } } },
    });
    if (!listing) return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (listing.status === "escrow" && listing.buyerId) {
        const buyer = await tx.user.findUnique({
          where: { id: listing.buyerId },
          select: { ledgerId: true },
        });
        if (buyer) {
          await tx.wallet.update({
            where: { ledgerId: buyer.ledgerId },
            data: {
              lockedBalance: { decrement: listing.totalPrice },
              balance: { increment: listing.totalPrice },
            },
          });
        }
      }

      await tx.ownershipListing.update({
        where: { id: targetId },
        data: { status: "deleted", buyerId: null, escrowStartedAt: null, escrowExpiresAt: null },
      });

      await tx.auditLog.create({
        data: {
          eventType: "ownership_listing_deleted",
          description: `Ownership listing deleted by admin. Hall: ${listing.hall?.name}. Reason: ${reason}`,
          poolId: listing.hall?.poolId,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ listingId: targetId, reason }),
          txHash: `LED-OWN-DELETE-${targetId}-${Date.now()}`,
          visibleToPublic: true,
        },
      });
    });

    return NextResponse.json({ success: true, deleted: { targetId, targetType, hall: listing.hall?.name, reason } });
  } catch (error) {
    return handlePrismaError(error);
  }
}