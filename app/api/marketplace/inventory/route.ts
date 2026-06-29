// app/api/marketplace/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   GET — Public Inventory Browse
   Anyone can see inventory from halls with inventoryEnabled=true
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const vertical = searchParams.get("vertical");
    const country = searchParams.get("country");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest"; // newest | price-asc | price-desc | popular
    const skip = (page - 1) * limit;

    // Build hall sub-where atomically to avoid object-spread clobbering
    const hallWhere: Prisma.HallWhereInput = {
      inventoryEnabled: true,
      status: "live",
    };

    if (vertical || country) {
      hallWhere.pool = {};
      if (vertical) hallWhere.pool.verticalId = vertical;
      if (country) hallWhere.pool.country = country;
    }

    const where: Prisma.InventoryItemWhereInput = {
      status: "active",
      hall: hallWhere,
      quantity: { gt: 0 },
    };

    if (minPrice) {
      where.price = {
        ...(where.price as Prisma.IntFilter | undefined),
        gte: parseInt(minPrice, 10),
      };
    }
    if (maxPrice) {
      where.price = {
        ...(where.price as Prisma.IntFilter | undefined),
        lte: parseInt(maxPrice, 10),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.InventoryItemOrderByWithRelationInput = {
      createdAt: "desc",
    };
    if (sort === "price-asc") orderBy = { price: "asc" };
    if (sort === "price-desc") orderBy = { price: "desc" };
    if (sort === "popular") orderBy = { quantitySold: "desc" };

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          hall: {
            select: {
              id: true,
              name: true,
              sriScore: true,
              ahgiScore: true,
              pool: {
                select: {
                  poolId: true,
                  name: true,
                  verticalId: true,
                  country: true,
                  imageUrl: true,
                },
              },
            },
          },
          _count: {
            select: { orders: { where: { status: { not: "cancelled" } } } },
          },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Sanitize — never expose costOfGoods, reorderThreshold, or internal fields
    const sanitized = items.map((item) => {
      let parsedImages: string[] | null = null;
      let parsedTags: string[] | null = null;
      let parsedSpecs: Record<string, unknown> | null = null;

      try {
        if (item.images) parsedImages = JSON.parse(item.images);
      } catch {
        /* ignore bad JSON */
      }
      try {
        if (item.tags) parsedTags = JSON.parse(item.tags);
      } catch {
        /* ignore bad JSON */
      }
      try {
        if (item.specs) parsedSpecs = JSON.parse(item.specs);
      } catch {
        /* ignore bad JSON */
      }

      // Primary image: imageUrl first, then first from images array
      const primaryImage = item.imageUrl || (parsedImages?.[0] ?? null);

      return {
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
        hall: {
          id: item.hall.id,
          name: item.hall.name,
          sriScore: item.hall.sriScore,
          ahgiScore: item.hall.ahgiScore,
          pool: item.hall.pool,
        },
        orderCount: item._count.orders,
      };
    });

    return NextResponse.json({
      success: true,
      items: sanitized,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[INVENTORY_MARKETPLACE_GET]", err);
    return NextResponse.json(
      { success: false, error: "Failed to load inventory marketplace" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST — Create Inventory Item
   Hall owners can create for their hall. Founder/Admin for any.
   ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const claims = await getSessionClaims(req);
    const isFounder = isFounderSync(claims);

    const body = await req.json();
    const {
      hallId,
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
    if (!hallId || !title || price == null || quantity == null) {
      return NextResponse.json(
        {
          success: false,
          error: "hallId, title, price, and quantity are required",
        },
        { status: 400 },
      );
    }

    const trimmedTitle = String(title).trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
      return NextResponse.json(
        { success: false, error: "Title must be 3-200 characters" },
        { status: 400 },
      );
    }

    const numPrice = Number(price);
    const numQty = Number(quantity);
    if (
      !Number.isFinite(numPrice) ||
      numPrice <= 0 ||
      !Number.isFinite(numQty) ||
      numQty <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Price and quantity must be positive numbers",
        },
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

    // Verify hall exists and has inventory enabled
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { pool: { select: { poolId: true, name: true } } },
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
          error: "Hall does not have inventory enabled. Vote to enable first.",
        },
        { status: 403 },
      );
    }

    // Authorization: must be hall owner OR founder/admin
    if (!isFounder) {
      const ownership = await prisma.ownership.findFirst({
        where: { hallId, userId: user.id, status: "active" },
      });
      if (!ownership) {
        return NextResponse.json(
          {
            success: false,
            error: "You must be an owner of this hall to list inventory",
          },
          { status: 403 },
        );
      }
    }

    // Normalize image data
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
      },
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
        txHash: `LED-INV-${Date.now()}`,
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
          hall: item.hall,
          createdAt: item.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[INVENTORY_MARKETPLACE_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Forbidden" || message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: message || "Failed to create inventory item" },
      { status: 500 },
    );
  }
}
