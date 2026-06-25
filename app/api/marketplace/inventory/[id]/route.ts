// app/api/marketplace/inventory/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   GET — Public Single Inventory Item
   ============================================================ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            sriScore: true,
            ahgiScore: true,
            inventoryEnabled: true,
            status: true,
            pool: {
              select: {
                poolId: true,
                name: true,
                verticalId: true,
                country: true,
                imageUrl: true,
                assetValue: true,
              },
            },
          },
        },
        _count: {
          select: { orders: { where: { status: { not: "cancelled" } } } },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Gate: hall must be live and inventory enabled
    if (!item.hall.inventoryEnabled || item.hall.status !== "live") {
      return NextResponse.json(
        { success: false, error: "This item is not available on the marketplace" },
        { status: 403 }
      );
    }

    if (item.status !== "active" || item.quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "This item is sold out or inactive" },
        { status: 404 }
      );
    }

    // Safe JSON parsing
    let parsedImages: string[] | null = null;
    let parsedTags: string[] | null = null;
    let parsedSpecs: Record<string, unknown> | null = null;

    try {
      if (item.images) parsedImages = JSON.parse(item.images);
    } catch { /* ignore bad JSON */ }
    try {
      if (item.tags) parsedTags = JSON.parse(item.tags);
    } catch { /* ignore bad JSON */ }
    try {
      if (item.specs) parsedSpecs = JSON.parse(item.specs);
    } catch { /* ignore bad JSON */ }

    const primaryImage = item.imageUrl || (parsedImages?.[0] ?? null);

    // Sanitize — never expose costOfGoods or reorderThreshold
    const sanitized = {
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
      quantitySold: item.quantitySold,
      imageUrl: primaryImage,
      images: parsedImages,
      tags: parsedTags,
      specs: parsedSpecs,
      listedAt: item.listedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      hall: {
        id: item.hall.id,
        name: item.hall.name,
        sriScore: item.hall.sriScore,
        ahgiScore: item.hall.ahgiScore,
        pool: item.hall.pool,
      },
      orderCount: item._count.orders,
    };

    return NextResponse.json({ success: true, item: sanitized });
  } catch (err) {
    console.error("[INVENTORY_ITEM_GET]", err);
    return NextResponse.json(
      { success: false, error: "Failed to load item" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH — Update Inventory Item
   ============================================================ */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const claims = getSessionClaims(req);
    const isFounder = isFounderSync(claims);

    const { id } = await params;
    const body = await req.json();

    const {
      title,
      description,
      price,
      quantity,
      costOfGoods,
      reorderThreshold,
      status,
      images,
      tags,
      specs,
    } = body;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        hall: { select: { id: true, name: true, pool: { select: { poolId: true } } } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Authorization: must be hall owner OR founder/admin
    if (!isFounder) {
      const ownership = await prisma.ownership.findFirst({
        where: { hallId: existing.hall.id, userId: user.id, status: "active" },
      });
      if (!ownership) {
        return NextResponse.json(
          { success: false, error: "You must be an owner of this hall to update inventory" },
          { status: 403 }
        );
      }
    }

    const updateData: Prisma.InventoryItemUpdateInput = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      const trimmed = String(title).trim();
      if (trimmed.length < 3 || trimmed.length > 200) {
        return NextResponse.json(
          { success: false, error: "Title must be 3-200 characters" },
          { status: 400 }
        );
      }
      updateData.title = trimmed;
    }

    if (description !== undefined) {
      updateData.description = String(description).trim();
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (!Number.isFinite(numPrice) || numPrice <= 0) {
        return NextResponse.json(
          { success: false, error: "Price must be a positive number" },
          { status: 400 }
        );
      }
      updateData.price = numPrice;
    }

    if (quantity !== undefined) {
      const numQty = Number(quantity);
      if (!Number.isFinite(numQty) || numQty < 0) {
        return NextResponse.json(
          { success: false, error: "Quantity cannot be negative" },
          { status: 400 }
        );
      }
      updateData.quantity = numQty;
    }

    if (costOfGoods !== undefined) {
      const num = Number(costOfGoods);
      if (!Number.isFinite(num) || num < 0) {
        return NextResponse.json(
          { success: false, error: "costOfGoods must be non-negative" },
          { status: 400 }
        );
      }
      updateData.costOfGoods = num;
    }

    if (reorderThreshold !== undefined) {
      const num = Number(reorderThreshold);
      if (!Number.isFinite(num) || num < 0) {
        return NextResponse.json(
          { success: false, error: "reorderThreshold must be non-negative" },
          { status: 400 }
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
      updateData.specs = specs && typeof specs === "object" ? JSON.stringify(specs) : null;
    }

    if (status !== undefined) {
      const allowed = ["active", "inactive", "deleted", "sold_out"];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Status must be one of: ${allowed.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            pool: { select: { poolId: true, name: true } },
          },
        },
      },
    });

    // Safe parse for response
    let respImages: string[] | null = null;
    let respTags: string[] | null = null;
    let respSpecs: Record<string, unknown> | null = null;
    try {
      if (item.images) respImages = JSON.parse(item.images);
    } catch { /* ignore */ }
    try {
      if (item.tags) respTags = JSON.parse(item.tags);
    } catch { /* ignore */ }
    try {
      if (item.specs) respSpecs = JSON.parse(item.specs);
    } catch { /* ignore */ }

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "inventory_item_updated",
        description: `Inventory item "${item.title}" updated in hall ${existing.hall.name}`,
        poolId: existing.hall.pool?.poolId,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({ itemId: item.id, changes: Object.keys(body) }),
        txHash: `LED-INV-UP-${Date.now()}`,
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
        images: respImages,
        tags: respTags,
        specs: respSpecs,
        hall: item.hall,
        updatedAt: item.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error("[INVENTORY_ITEM_PATCH]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Forbidden" || message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: message || "Failed to update item" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — Soft-delete (set inactive)
   ============================================================ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const claims = getSessionClaims(req);
    const isFounder = isFounderSync(claims);

    const { id } = await params;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        hall: { select: { id: true, name: true, pool: { select: { poolId: true } } } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Authorization: must be hall owner OR founder/admin
    if (!isFounder) {
      const ownership = await prisma.ownership.findFirst({
        where: { hallId: existing.hall.id, userId: user.id, status: "active" },
      });
      if (!ownership) {
        return NextResponse.json(
          { success: false, error: "You must be an owner of this hall to delete inventory" },
          { status: 403 }
        );
      }
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { status: "inactive", updatedAt: new Date() },
      include: {
        hall: {
          select: {
            id: true,
            name: true,
            pool: { select: { poolId: true, name: true } },
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "inventory_item_deleted",
        description: `Inventory item "${existing.title}" deactivated in hall ${existing.hall.name}`,
        poolId: existing.hall.pool?.poolId,
        ledgerId: user.ledgerId,
        metadata: JSON.stringify({ itemId: id }),
        txHash: `LED-INV-DEL-${Date.now()}`,
        visibleToPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        status: item.status,
        hall: item.hall,
        updatedAt: item.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error("[INVENTORY_ITEM_DELETE]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Forbidden" || message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: message || "Failed to delete item" },
      { status: 500 }
    );
  }
}