/* ============================================================
   8TH LEDGER — Pool Forge API
   Auto-spawns Ghost Hall + HallTreasury + SpvEntity.
   Location options written to LocationOption relation ONLY.
   ============================================================ */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   CONSTANTS
   ============================================================ */
const VALID_VERTICALS = [
  "ledgerprop",
  "ledgerauto",
  "ledgeredu",
  "ledgeraccess",
  "ledgerhealth",
  "ledgerbiz",
  "ledgertech",
  "ledgertravel",
  "ledgeragri",
  "ledgerenergy",
] as const;

type VerticalId = (typeof VALID_VERTICALS)[number];
const DEFAULT_EMOJI_SET = "🏠🚗📱🎓🏥🏗️✈️🌾⚡";

/* ============================================================
   HELPERS
   ============================================================ */
function isValidVertical(v: string): v is VerticalId {
  return VALID_VERTICALS.includes(v as VerticalId);
}

function parseMediaField(raw: string | null): any[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function handlePrismaError(error: any): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Duplicate entry. This resource already exists." },
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
  console.error("[ADMIN_POOLS ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}

class ResponseError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/* ============================================================
   POST /api/admin/pools — Create pool (Primary Admin only)
   Auto-spawns Ghost Hall + HallTreasury + SpvEntity.
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) throw new ResponseError("Authentication required", 401);
    if (!user.isPrimaryAdmin) throw new ResponseError("Primary Admin authority required", 403);

    const body = await request.json();
    const {
      name,
      verticalId,
      assetValue,
      listedPrice,
      trueCost,
      maxParticipants,
      country,
      description,
      closesAt,
      imageUrl,
      assetImages,
      assetVideos,
      tour360Url,
      externalLinks,
      documents,
      locationOptions,
      emojiSet,
      assetCondition,
      minCommitment,
      maxCommitment,
      campaignDuration,
      hallClass,
    } = body;

    if (!name || !verticalId || !assetValue || !maxParticipants || !country) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!isValidVertical(verticalId)) {
      return NextResponse.json(
        { success: false, error: `Invalid vertical. Must be one of: ${VALID_VERTICALS.join(", ")}` },
        { status: 400 }
      );
    }

    const numAssetValue = Number(assetValue);
    const numMaxParticipants = Number(maxParticipants);
    const effectiveTrueCost = trueCost ? Number(trueCost) : numAssetValue;
    const effectiveListedPrice = listedPrice ? Number(listedPrice) : numAssetValue;
    const numMinCommitment = minCommitment ? Number(minCommitment) : 1;
    const numMaxCommitment = maxCommitment ? Number(maxCommitment) : effectiveListedPrice;
    const numCampaignDuration = campaignDuration ? Number(campaignDuration) : 30;

    if (numAssetValue < 1000) {
      return NextResponse.json(
        { success: false, error: "Asset value must exceed $1,000" },
        { status: 400 }
      );
    }
    if (effectiveListedPrice <= effectiveTrueCost) {
      return NextResponse.json(
        { success: false, error: "Listed price must exceed true cost" },
        { status: 400 }
      );
    }
    if (numMaxParticipants < 1) {
      return NextResponse.json(
        { success: false, error: "maxParticipants must be at least 1" },
        { status: 400 }
      );
    }
    if (numMinCommitment < 1) {
      return NextResponse.json(
        { success: false, error: "minCommitment must be at least 1" },
        { status: 400 }
      );
    }
    if (numMaxCommitment > effectiveListedPrice) {
      return NextResponse.json(
        { success: false, error: "maxCommitment cannot exceed the listed price" },
        { status: 400 }
      );
    }
    if (numMinCommitment > numMaxCommitment) {
      return NextResponse.json(
        { success: false, error: "minCommitment cannot exceed maxCommitment" },
        { status: 400 }
      );
    }
    if (numCampaignDuration < 1 || numCampaignDuration > 365) {
      return NextResponse.json(
        { success: false, error: "campaignDuration must be between 1 and 365 days" },
        { status: 400 }
      );
    }
    if (assetImages && !Array.isArray(assetImages)) {
      return NextResponse.json({ success: false, error: "assetImages must be an array" }, { status: 400 });
    }
    if (assetVideos && !Array.isArray(assetVideos)) {
      return NextResponse.json({ success: false, error: "assetVideos must be an array" }, { status: 400 });
    }
    if (documents && !Array.isArray(documents)) {
      return NextResponse.json({ success: false, error: "documents must be an array" }, { status: 400 });
    }
    if (tour360Url && !tour360Url.startsWith("http")) {
      return NextResponse.json({ success: false, error: "tour360Url must be a valid URL" }, { status: 400 });
    }

    const pirAmount = effectiveListedPrice - effectiveTrueCost;
    const insuranceAllocation = Math.round(pirAmount * 0.25); // The Shield: 25% of PIR
    const target = effectiveListedPrice;
    const poolId = `POOL-${verticalId.replace(/^ledger/, "").toUpperCase()}-${Date.now().toString(36)}`;

    // Derive hall class from vertical if not provided
    const derivedHallClass = hallClass || (() => {
      const classI = ["ledgerprop", "ledgerauto", "ledgerenergy", "ledgeraccess"];
      const classII = ["ledgerhealth", "ledgeredu", "ledgertravel"];
      if (classI.includes(verticalId)) return "I";
      if (classII.includes(verticalId)) return "II";
      return "III";
    })();

    const result = await prisma.$transaction(async (tx) => {
      const pool = await tx.pool.create({
        data: {
          poolId,
          name,
          verticalId,
          assetValue: numAssetValue,
          listedPrice: effectiveListedPrice,
          trueCost: effectiveTrueCost,
          surplus: pirAmount > 0 ? pirAmount : 0,
          target,
          committed: 0,
          participants: 0,
          maxParticipants: numMaxParticipants,
          status: "filling",
          country,
          description: description || "",
          creatorId: user.ledgerId,
          closesAt: closesAt
            ? new Date(closesAt)
            : new Date(Date.now() + numCampaignDuration * 24 * 60 * 60 * 1000),
          imageUrl,
          assetImages: assetImages ? JSON.stringify(assetImages) : null,
          assetVideos: assetVideos ? JSON.stringify(assetVideos) : null,
          tour360Url: tour360Url || null,
          documents: documents ? JSON.stringify(documents) : null,
          externalLinks: externalLinks ? JSON.stringify(externalLinks) : null,
          emojiSet: emojiSet || DEFAULT_EMOJI_SET,
          assetCondition: assetCondition || "new",
          minCommitment: numMinCommitment,
          maxCommitment: numMaxCommitment,
          campaignDuration: numCampaignDuration,
          insuranceAllocation,
          hallUnlocked: false,
          hallClass: derivedHallClass,
          assetBookValue: effectiveTrueCost,
        },
      });

      const hall = await tx.hall.create({
        data: {
          poolId: pool.id,
          name: `${name} — Hall`,
          status: "ghost",
          hallClass: derivedHallClass,
        },
      });

      await tx.hallTreasury.create({
        data: {
          hallId: hall.id,
          balance: 0,
          totalDistributed: 0,
          totalRevenue: 0,
        },
      });

      const spv = await tx.spvEntity.create({
        data: {
          poolId: pool.id,
          name: `${verticalId.toUpperCase()} SPV #${pool.poolId}`,
          entityType: "llc",
          jurisdiction: country,
        },
      });

      /* ── Location options written to relation ONLY ── */
      if (locationOptions && Array.isArray(locationOptions)) {
        await tx.locationOption.createMany({
          data: locationOptions.map((opt: Record<string, unknown>) => ({
            poolId: pool.id,
            name: String(opt.name || ""),
            address: opt.address ? String(opt.address) : null,
            lat: opt.lat ? Number(opt.lat) : null,
            lng: opt.lng ? Number(opt.lng) : null,
            cost: opt.cost ? Number(opt.cost) : null,
            image: opt.image ? String(opt.image) : null,
            description: opt.description ? String(opt.description) : null,
          })),
        });
      }

      await tx.auditEntry.create({
        data: {
          type: "pool_created",
          description: `Pool ${pool.name} created. Listed: $${effectiveListedPrice.toLocaleString()} | True Cost: $${effectiveTrueCost.toLocaleString()} | PIR: $${pirAmount.toLocaleString()}`,
          amount: target,
          txHash: `POOL-CREATE-${pool.poolId}-${Date.now()}`,
          poolId: pool.id,
        },
      });

      await tx.hallActivity.create({
        data: {
          hallId: hall.id,
          type: "system",
          description: "Hall genesis — pool published by Primary Admin",
        },
      });

      return { pool, hall, spv };
    });

    const createdPool = result.pool;

    return NextResponse.json(
      {
        success: true,
        pool: {
          id: createdPool.poolId,
          poolId: createdPool.poolId,
          name: createdPool.name,
          verticalId: createdPool.verticalId,
          assetValue: createdPool.assetValue,
          listedPrice: createdPool.listedPrice,
          trueCost: createdPool.trueCost,
          surplus: createdPool.surplus,
          target: createdPool.target,
          status: createdPool.status,
          country: createdPool.country,
          description: createdPool.description,
          imageUrl: createdPool.imageUrl,
          assetImages: parseMediaField(createdPool.assetImages),
          assetVideos: parseMediaField(createdPool.assetVideos),
          tour360Url: createdPool.tour360Url,
          documents: parseMediaField(createdPool.documents),
          externalLinks: parseMediaField(createdPool.externalLinks),
          emojiSet: createdPool.emojiSet,
          assetCondition: createdPool.assetCondition,
          minCommitment: createdPool.minCommitment,
          maxCommitment: createdPool.maxCommitment,
          campaignDuration: createdPool.campaignDuration,
          closesAt: createdPool.closesAt,
          participants: createdPool.participants,
          maxParticipants: createdPool.maxParticipants,
          insuranceAllocation: createdPool.insuranceAllocation,
          hallId: result.hall.id,
          hallStatus: result.hall.status,
          spvId: result.spv.id,
        },
        message: `Pool created. Listed: $${effectiveListedPrice.toLocaleString()}. PIR: $${pirAmount.toLocaleString()}. Hall & SPV auto-generated.`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return handlePrismaError(error);
  }
}

/* ============================================================
   PATCH /api/admin/pools — Primary Admin metadata update
   LOCKED: If committed > 0, price/cost/target/surplus cannot change.
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) throw new ResponseError("Authentication required", 401);
    if (!user.isPrimaryAdmin) throw new ResponseError("Primary Admin authority required", 403);

    const body = await request.json();
    const { poolId, ...updates } = body;

    if (!poolId) {
      return NextResponse.json(
        { success: false, error: "poolId required" },
        { status: 400 }
      );
    }

    const pool = await prisma.pool.findUnique({
      where: { poolId },
      include: { hall: true },
    });

    if (!pool) {
      return NextResponse.json(
        { success: false, error: "Pool not found" },
        { status: 404 }
      );
    }
    if (pool.status === "distributed") {
      return NextResponse.json(
        { success: false, error: "Distributed pools cannot be modified" },
        { status: 409 }
      );
    }

    const hasCommitments = pool.committed > 0;
    const lockedFields = ["listedPrice", "trueCost", "target", "surplus", "insuranceAllocation"];
    const attemptedLocked = lockedFields.filter((f) => updates[f] !== undefined);

    if (hasCommitments && attemptedLocked.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Pool has $${pool.committed.toLocaleString()} in commitments. These fields are locked: ${attemptedLocked.join(", ")}`,
        },
        { status: 409 }
      );
    }

    const editableFields = [
      "name",
      "description",
      "imageUrl",
      "assetImages",
      "assetVideos",
      "tour360Url",
      "documents",
      "externalLinks",
      "emojiSet",
      "assetCondition",
      "listedPrice",
      "trueCost",
      "minCommitment",
      "maxCommitment",
      "closesAt",
      "hallClass",
    ];

    const allowedUpdates: Record<string, unknown> = {};
    for (const key of editableFields) {
      if (updates[key] !== undefined) {
        allowedUpdates[key] = updates[key];
      }
    }

    if (allowedUpdates.assetImages && !Array.isArray(allowedUpdates.assetImages)) {
      return NextResponse.json({ success: false, error: "assetImages must be an array" }, { status: 400 });
    }
    if (allowedUpdates.assetVideos && !Array.isArray(allowedUpdates.assetVideos)) {
      return NextResponse.json({ success: false, error: "assetVideos must be an array" }, { status: 400 });
    }
    if (allowedUpdates.documents && !Array.isArray(allowedUpdates.documents)) {
      return NextResponse.json({ success: false, error: "documents must be an array" }, { status: 400 });
    }
    if (allowedUpdates.tour360Url && !String(allowedUpdates.tour360Url).startsWith("http")) {
      return NextResponse.json({ success: false, error: "tour360Url must be a valid URL" }, { status: 400 });
    }

    if (allowedUpdates.listedPrice !== undefined || allowedUpdates.trueCost !== undefined) {
      const newListed = Number(allowedUpdates.listedPrice ?? pool.listedPrice);
      const newCost = Number(allowedUpdates.trueCost ?? pool.trueCost);

      if (newListed <= newCost) {
        return NextResponse.json(
          { success: false, error: "Listed price must exceed true cost" },
          { status: 400 }
        );
      }

      const newPir = newListed - newCost;
      allowedUpdates.surplus = newPir > 0 ? newPir : 0;
      allowedUpdates.insuranceAllocation = Math.round(newPir * 0.25);

      if (allowedUpdates.listedPrice !== undefined) {
        allowedUpdates.target = newListed;
      }
    }

    if (allowedUpdates.minCommitment !== undefined || allowedUpdates.maxCommitment !== undefined) {
      const newMin = Number(allowedUpdates.minCommitment ?? pool.minCommitment);
      const newMax = Number(allowedUpdates.maxCommitment ?? pool.maxCommitment);
      if (newMin > newMax) {
        return NextResponse.json(
          { success: false, error: "minCommitment cannot exceed maxCommitment" },
          { status: 400 }
        );
      }
    }

    if (allowedUpdates.assetImages) allowedUpdates.assetImages = JSON.stringify(allowedUpdates.assetImages);
    if (allowedUpdates.assetVideos) allowedUpdates.assetVideos = JSON.stringify(allowedUpdates.assetVideos);
    if (allowedUpdates.documents) allowedUpdates.documents = JSON.stringify(allowedUpdates.documents);
    if (allowedUpdates.externalLinks) allowedUpdates.externalLinks = JSON.stringify(allowedUpdates.externalLinks);
    if (allowedUpdates.closesAt) allowedUpdates.closesAt = new Date(String(allowedUpdates.closesAt));

    const updated = await prisma.pool.update({
      where: { id: pool.id },
      data: allowedUpdates,
    });

    return NextResponse.json({
      success: true,
      pool: {
        id: updated.poolId,
        poolId: updated.poolId,
        name: updated.name,
        listedPrice: updated.listedPrice,
        trueCost: updated.trueCost,
        surplus: updated.surplus,
        target: updated.target,
        insuranceAllocation: updated.insuranceAllocation,
        status: updated.status,
      },
      message: `Pool ${poolId} updated.`,
    });
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return handlePrismaError(error);
  }
}

/* ============================================================
   DELETE /api/admin/pools — Suspend pool (Primary Admin only)
   Also suspends Hall and logs audit trail.
   ============================================================ */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) throw new ResponseError("Authentication required", 401);
    if (!user.isPrimaryAdmin) throw new ResponseError("Primary Admin authority required", 403);

    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get("id");

    if (!poolId) {
      return NextResponse.json(
        { success: false, error: "Pool ID required" },
        { status: 400 }
      );
    }

    const pool = await prisma.pool.findUnique({
      where: { poolId },
      include: { hall: true },
    });

    if (!pool) {
      return NextResponse.json(
        { success: false, error: "Pool not found" },
        { status: 404 }
      );
    }
    if (pool.status === "distributed") {
      return NextResponse.json(
        { success: false, error: "Distributed pools cannot be suspended" },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.pool.update({
        where: { id: pool.id },
        data: { status: "suspended" },
      });

      if (pool.hall) {
        await tx.hall.update({
          where: { id: pool.hall.id },
          data: { status: "suspended" },
        });
      }

      await tx.auditEntry.create({
        data: {
          type: "pool_suspended",
          description: `Pool ${pool.name} suspended by Primary Admin`,
          amount: pool.committed,
          txHash: `POOL-SUSPEND-${pool.poolId}-${Date.now()}`,
          poolId: pool.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Pool ${poolId} suspended. Hall frozen. All commitments eligible for full return.`,
    });
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return handlePrismaError(error);
  }
}