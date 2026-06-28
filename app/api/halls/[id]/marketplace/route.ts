// app/api/halls/[id]/marketplace/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   8TH LEDGER — HALL INTERNAL MARKETPLACE API
   Hall members view inventory. Hall owners manage listings.
   Universal: Any hall with inventoryEnabled=true can sell.
   ============================================================ */

// ── Helper: Check if user is hall owner ──
async function isHallOwner(hallId: string, userId: string): Promise<boolean> {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: "active" },
  });
  return !!ownership;
}

// ── GET — List hall inventory with stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const user = await requireAuth(req);
    const claims = getSessionClaims(req);
    const isFounder = isFounderSync(claims);

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: {
        id: true,
        name: true,
        inventoryEnabled: true,
        status: true,
        pool: { select: { poolId: true, name: true, verticalId: true } },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    if (!hall.inventoryEnabled) {
      return NextResponse.json(
        { success: false, error: "Inventory not enabled for this hall" },
        { status: 403 },
      );
    }

    // Check membership
    const isOwner = await isHallOwner(hallId, user.id);
    if (!isOwner && !isFounder) {
      return NextResponse.json(
        { success: false, error: "Hall membership required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryItemWhereInput = { hallId };
    if (status !== "all") where.status = status;

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { listedAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              orders: { where: { status: { not: "cancelled" } } },
            },
          },
          orders: {
            where: { status: "completed" },
            select: { amount: true, quantity: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Calculate revenue per item
    const enriched = items.map((item) => {
      const totalRevenue = item.orders.reduce((s, o) => s + o.amount, 0);
      const totalSold = item.orders.reduce((s, o) => s + o.quantity, 0);

      // Account for pending orders in available stock
      const pendingOrders = item._count.orders - totalSold;
      const availableStock = Math.max(
        0,
        item.quantity - (item.quantitySold || 0) - pendingOrders,
      );

      // Safe JSON parsing
      let parsedImages: string[] | null = null;
      let parsedTags: string[] | null = null;
      let parsedSpecs: Record<string, unknown> | null = null;
      try {
        if (item.images) parsedImages = JSON.parse(item.images);
      } catch {
        /* ignore */
      }
      try {
        if (item.tags) parsedTags = JSON.parse(item.tags);
      } catch {
        /* ignore */
      }
      try {
        if (item.specs) parsedSpecs = JSON.parse(item.specs);
      } catch {
        /* ignore */
      }

      const primaryImage = item.imageUrl || (parsedImages?.[0] ?? null);

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        quantitySold: item.quantitySold || 0,
        availableStock,
        totalSold,
        totalRevenue,
        status: item.status,
        imageUrl: primaryImage,
        images: parsedImages,
        tags: parsedTags,
        specs: parsedSpecs,
        costOfGoods: isOwner || isFounder ? item.costOfGoods : undefined,
        reorderThreshold:
          isOwner || isFounder ? item.reorderThreshold : undefined,
        listedAt: item.listedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        orderCount: item._count.orders,
        recentOrders: item.orders.map((o) => ({
          amount: o.amount,
          quantity: o.quantity,
          date: o.createdAt,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      hall: {
        id: hall.id,
        name: hall.name,
        poolName: hall.pool?.name,
        verticalId: hall.pool?.verticalId,
      },
      items: enriched,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("[HALL_MARKETPLACE_GET]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Failed to load hall marketplace" },
      { status: 500 },
    );
  }
}

// ── POST — Create inventory item for hall 
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const user = await requireAuth(req);
    const claims = getSessionClaims(req);
    const isFounder = isFounderSync(claims);

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { poolId: true, name: true } },
      },
    });

    if (!hall) {
      return NextResponse.json(
        { success: false, error: "Hall not found" },
        { status: 404 },
      );
    }

    if (!hall.inventoryEnabled) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Inventory not enabled for this hall. Propose enablement via vote.",
        },
        { status: 403 },
      );
    }

    if (hall.status !== "live") {
      return NextResponse.json(
        { success: false, error: "Hall must be live to list inventory" },
        { status: 400 },
      );
    }

    // Authorization: hall owner or founder/admin
    const isOwner = await isHallOwner(hallId, user.id);
    if (!isOwner && !isFounder) {
      return NextResponse.json(
        { success: false, error: "Hall ownership required to list inventory" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      price,
      quantity,
      costOfGoods,
      reorderThreshold,
      images,
      tags,
      specs,
    } = body;

    // Validation
    const trimmedTitle = title ? String(title).trim() : "";
    if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      return NextResponse.json(
        { success: false, error: "Title must be 3-200 characters" },
        { status: 400 },
      );
    }

    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be a positive number" },
        { status: 400 },
      );
    }

    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty < 1) {
      return NextResponse.json(
        { success: false, error: "Quantity must be a whole number >= 1" },
        { status: 400 },
      );
    }

    const numCost = costOfGoods != null ? Number(costOfGoods) : 0;
    const numReorder = reorderThreshold != null ? Number(reorderThreshold) : 0;
    if (numCost < 0 || numReorder < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "costOfGoods and reorderThreshold must be non-negative",
        },
        { status: 400 },
      );
    }

    const imagesArray = Array.isArray(images) ? images : null;
    const imageUrl = imagesArray?.[0] ?? null;

    const item = await prisma.inventoryItem.create({
      data: {
        hallId,
        title: trimmedTitle,
        description: description ? String(description).trim() : "",
        price: numPrice,
        quantity: numQty,
        quantitySold: 0,
        costOfGoods: numCost,
        reorderThreshold: numReorder,
        imageUrl,
        images: imagesArray ? JSON.stringify(imagesArray) : null,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : null,
        specs:
          specs && typeof specs === "object" ? JSON.stringify(specs) : null,
        status: "active",
        listedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "inventory_item_created",
        description: `Inventory item "${item.title}" created for hall ${hall.name}`,
        poolId: hall.pool?.poolId,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({
          itemId: item.id,
          price: numPrice,
          quantity: numQty,
          costOfGoods: numCost,
        }),
        txHash: `LED-INV-CREATE-${Date.now()}`,
        visibleToPublic: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        item: {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          images: imagesArray,
          tags: tags || null,
          specs: specs || null,
          status: item.status,
          listedAt: item.listedAt,
          createdAt: item.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[HALL_MARKETPLACE_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Failed to create inventory item" },
      { status: 500 },
    );
  }
}

// ── PATCH — Update inventory item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const user = await requireAuth(req);
    const claims = getSessionClaims(req);
    const isFounder = isFounderSync(claims);

    const body = await req.json();
    const {
      itemId,
      title,
      description,
      price,
      quantity,
      status,
      costOfGoods,
      reorderThreshold,
      images,
      tags,
      specs,
    } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "itemId required" },
        { status: 400 },
      );
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId, hallId },
      include: {
        hall: {
          select: { name: true, pool: { select: { poolId: true } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found in this hall" },
        { status: 404 },
      );
    }

    // Authorization
    const isOwner = await isHallOwner(hallId, user.id);
    if (!isOwner && !isFounder) {
      return NextResponse.json(
        {
          success: false,
          error: "Hall ownership required to update inventory",
        },
        { status: 403 },
      );
    }

    const updateData: Prisma.InventoryItemUpdateInput = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      const trimmed = String(title).trim();
      if (trimmed.length < 3 || trimmed.length > 200) {
        return NextResponse.json(
          { success: false, error: "Title must be 3-200 chars" },
          { status: 400 },
        );
      }
      updateData.title = trimmed;
    }

    if (description !== undefined) {
      updateData.description = String(description).trim();
    }

    if (price !== undefined) {
      const num = Number(price);
      if (!Number.isFinite(num) || num <= 0) {
        return NextResponse.json(
          { success: false, error: "Price must be a positive number" },
          { status: 400 },
        );
      }
      updateData.price = num;
    }

    if (quantity !== undefined) {
      const num = Number(quantity);
      if (!Number.isInteger(num) || num < 0) {
        return NextResponse.json(
          { success: false, error: "Quantity must be a whole number >= 0" },
          { status: 400 },
        );
      }
      updateData.quantity = num;
    }

    if (status !== undefined) {
      const allowed = ["active", "inactive", "deleted", "sold_out"];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Status must be one of: ${allowed.join(", ")}`,
          },
          { status: 400 },
        );
      }
      updateData.status = status;
    }

    if (costOfGoods !== undefined) {
      const num = Number(costOfGoods);
      if (!Number.isFinite(num) || num < 0) {
        return NextResponse.json(
          { success: false, error: "costOfGoods must be non-negative" },
          { status: 400 },
        );
      }
      updateData.costOfGoods = num;
    }

    if (reorderThreshold !== undefined) {
      const num = Number(reorderThreshold);
      if (!Number.isFinite(num) || num < 0) {
        return NextResponse.json(
          { success: false, error: "reorderThreshold must be non-negative" },
          { status: 400 },
        );
      }
      updateData.reorderThreshold = num;
    }

    if (images !== undefined) {
      const imagesArray = Array.isArray(images) ? images : null;
      updateData.images = imagesArray ? JSON.stringify(imagesArray) : null;
      updateData.imageUrl = imagesArray?.[0] ?? null;
    }

    if (tags !== undefined) {
      const tagsArray = Array.isArray(tags) ? tags : null;
      updateData.tags = tagsArray ? JSON.stringify(tagsArray) : null;
    }

    if (specs !== undefined) {
      updateData.specs =
        specs && typeof specs === "object" ? JSON.stringify(specs) : null;
    }

    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        eventType: "inventory_item_updated",
        description: `Inventory item "${item.title}" updated in hall ${existing.hall.name}`,
        poolId: existing.hall.pool?.poolId,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({ itemId, changes: Object.keys(body) }),
        txHash: `LED-INV-UPDATE-${Date.now()}`,
        visibleToPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        status: item.status,
        imageUrl: item.imageUrl,
        updatedAt: item.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("[HALL_MARKETPLACE_PATCH]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Failed to update inventory item" },
      { status: 500 },
    );
  }
}

// ── DELETE — Soft-delete inventory item ─
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const user = await requireAuth(req);
    const claims = getSessionClaims(req);
    const isFounder = isFounderSync(claims);

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "itemId query param required" },
        { status: 400 },
      );
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId, hallId },
      include: {
        hall: { select: { name: true, pool: { select: { poolId: true } } } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found in this hall" },
        { status: 404 },
      );
    }

    // Authorization
    const isOwner = await isHallOwner(hallId, user.id);
    if (!isOwner && !isFounder) {
      return NextResponse.json(
        {
          success: false,
          error: "Hall ownership required to delete inventory",
        },
        { status: 403 },
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { status: "deleted", updatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        eventType: "inventory_item_deleted",
        description: `Inventory item "${existing.title}" deleted in hall ${existing.hall.name}`,
        poolId: existing.hall.pool?.poolId,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({ itemId }),
        txHash: `LED-INV-DELETE-${Date.now()}`,
        visibleToPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        status: item.status,
        updatedAt: item.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("[HALL_MARKETPLACE_DELETE]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Failed to delete inventory item" },
      { status: 500 },
    );
  }
}