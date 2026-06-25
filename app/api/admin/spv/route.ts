import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   8TH LEDGER — SPV ENTITY ADMIN API
   Special Purpose Vehicle registry & creation
   ============================================================ */

const ENTITY_TYPES = ["llc", "ltd", "corporation", "trust", "foundation", "partnership", "cooperative", "spv"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

/* ============================================================
   HELPERS
   ============================================================ */
function handlePrismaError(error: unknown): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate entry. SPV may already exist for this pool." },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }
  }
  console.error("[ADMIN_SPV ERROR]", error);
  return NextResponse.json(
    { success: false, error: "SPV operation failed" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/admin/spv — Primary admin SPV registry
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jurisdiction = searchParams.get("jurisdiction");
    const entityType = searchParams.get("entityType");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Prisma.SpvEntityWhereInput = {};
    if (jurisdiction) where.jurisdiction = { equals: jurisdiction, mode: "insensitive" };
    if (entityType && ENTITY_TYPES.includes(entityType as EntityType)) where.entityType = entityType as EntityType;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search, mode: "insensitive" } },
        { pool: { name: { contains: search, mode: "insensitive" } } },
        { pool: { poolId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [entities, total] = await Promise.all([
      prisma.spvEntity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          pool: {
            select: {
              poolId: true,
              name: true,
              verticalId: true,
              country: true,
              status: true,
              listedPrice: true,
              hallClass: true,
            },
          },
        },
      }),
      prisma.spvEntity.count({ where }),
    ]);

    const enriched = entities.map((e) => {
      let documentList: string[] = [];
      try {
        if (e.documents) documentList = JSON.parse(String(e.documents));
      } catch {
        documentList = [];
      }

      return {
        id: e.id,
        name: e.name,
        entityType: e.entityType,
        jurisdiction: e.jurisdiction,
        registrationNumber: e.registrationNumber,
        registeredAt: e.registeredAt,
        bankAccount: e.bankAccount,
        taxId: e.taxId,
        documents: documentList.length > 0 ? documentList : null,
        documentCount: documentList.length,
        createdAt: e.createdAt,
        pool: e.pool,
      };
    });

    // Jurisdiction breakdown
    const jurisdictions = await prisma.spvEntity.groupBy({
      by: ["jurisdiction"],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      spvs: enriched,
      jurisdictions: jurisdictions.map((j) => ({
        name: j.jurisdiction,
        count: j._count,
      })),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   POST /api/admin/spv — Primary admin creates SPV
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      poolId,
      name,
      entityType,
      jurisdiction,
      registrationNumber,
      registeredAt,
      documents,
      bankAccount,
      taxId,
      notes,
    } = body;

    if (!poolId || !name || !entityType || !jurisdiction) {
      return NextResponse.json(
        { success: false, error: "poolId, name, entityType, and jurisdiction required" },
        { status: 400 }
      );
    }

    if (!ENTITY_TYPES.includes(entityType as EntityType)) {
      return NextResponse.json(
        { success: false, error: `entityType must be one of: ${ENTITY_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate pool exists
    const pool = await prisma.pool.findUnique({
      where: { poolId },
      include: { spv: true },
    });

    if (!pool) {
      return NextResponse.json({ success: false, error: "Pool not found" }, { status: 404 });
    }

    // Prevent duplicate SPV per pool (one SPV per pool rule)
    if (pool.spv) {
      return NextResponse.json(
        {
          success: false,
          error: `Pool ${poolId} already has an SPV (#${pool.spv.id}). Use PATCH to update.`,
          existingSpvId: pool.spv.id,
        },
        { status: 409 }
      );
    }

    // Validate document URLs
    let docs: string[] = [];
    if (documents) {
      if (!Array.isArray(documents)) {
        return NextResponse.json(
          { success: false, error: "documents must be an array" },
          { status: 400 }
        );
      }
      const invalid = documents.filter((u: unknown) => typeof u !== "string" || !u.startsWith("https://"));
      if (invalid.length > 0) {
        return NextResponse.json(
          { success: false, error: "All document URLs must be valid HTTPS strings" },
          { status: 400 }
        );
      }
      docs = documents;
    }

    const spv = await prisma.spvEntity.create({
      data: {
        poolId: pool.id,
        name: name.trim(),
        entityType: entityType as EntityType,
        jurisdiction: jurisdiction.trim(),
        registrationNumber: registrationNumber?.trim() || null,
        registeredAt: registeredAt ? new Date(registeredAt) : null,
        documents: docs.length > 0 ? JSON.stringify(docs) : null,
        bankAccount: bankAccount?.trim() || null,
        taxId: taxId?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    // Audit trail
    await prisma.auditEntry.create({
      data: {
        type: "spv_created",
        description: `SPV "${spv.name}" (${spv.entityType}) registered in ${spv.jurisdiction} for pool ${pool.name} by ${user.ledgerId}`,
        txHash: `SPV-CREATE-${spv.id}-${Date.now()}`,
        poolId: pool.id,
        ledgerId: user.ledgerId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        spv: {
          id: spv.id,
          name: spv.name,
          entityType: spv.entityType,
          jurisdiction: spv.jurisdiction,
          registrationNumber: spv.registrationNumber,
          registeredAt: spv.registeredAt,
          documents: docs.length > 0 ? docs : null,
          documentCount: docs.length,
          bankAccount: spv.bankAccount,
          taxId: spv.taxId,
          notes: spv.notes,
          poolId: pool.poolId,
          createdAt: spv.createdAt,
        },
        message: `SPV "${spv.name}" created and linked to pool ${poolId}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}