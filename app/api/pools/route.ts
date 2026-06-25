import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   CONSTANTS — 8th Ledger 10 Verticals
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
   TYPES
   ============================================================ */
interface LocationOptionItem {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  cost: number | null;
  image: string | null;
  description: string | null;
  votes: number;
  voteWeight: number;
  isSelected: boolean;
}

interface MyOwnership {
  ownershipPercent: number;
  pacToken: string | null;
  totalReturned: number;
  status: string;
  amountCommitted: number;
  role: string | null;
  dynamicValue: number | null;
  accumulatedDividends: number;
  pirDebt: number;
}

interface PoolListItem {
  id: string;
  poolId: string;
  name: string;
  verticalId: string;
  description: string | null;
  assetValue: number;
  listedPrice: number;
  committed: number;
  target: number;
  fillPercent: number;
  status: string;
  country: string;
  creatorId: string;
  imageUrl: string | null;
  assetImages: unknown[] | null;
  assetVideos: unknown[] | null;
  documents: unknown[] | null;
  tour360Url: string | null;
  externalLinks: unknown[] | null;
  emojiSet: string | null;
  assetCondition: string | null;
  minCommitment: number;
  maxCommitment: number;
  campaignDuration: number;
  closesAt: Date | null;
  createdAt: Date;
  participants: number;
  maxParticipants: number;
  isVerified: boolean;
  hallUnlocked: boolean;
  hallId: string | null;
  hallStatus: string | null;
  locationOptions: LocationOptionItem[];
  myOwnership: MyOwnership | null;
  myCommitment: number;
  myInvitesRemaining: number;
  hallClass: string | null;
  sriScore: number;
  ahgiScore: number;
}

/* ============================================================
   HELPERS
   ============================================================ */
function isValidVertical(v: string): v is VerticalId {
  return VALID_VERTICALS.includes(v as VerticalId);
}

function parseMediaField(raw: string | null): unknown[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function handlePrismaError(error: unknown): NextResponse {
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
  console.error("[POOLS ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}

/* ============================================================
   GET /api/pools — List pools (Public + Auth-enriched)
   trueCost/surplus NEVER sent. listedPrice IS public.
   locationOptions sourced from LocationOption relation ONLY.
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get("vertical");
    const status = searchParams.get("status");
    const country = searchParams.get("country");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const sessionUser = await getSessionUser();
    const userLedgerId = sessionUser?.ledgerId || null;

    const where: Prisma.PoolWhereInput = {};
    if (vertical) where.verticalId = vertical;
    if (status) where.status = status;
    if (country) where.country = { equals: country, mode: "insensitive" };

    const [poolList, total] = await Promise.all([
      prisma.pool.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          hall: { select: { id: true, status: true, sriScore: true, ahgiScore: true } },
          /* ── V3.2: Ownership (PAC) data — authoritative for ownership % ── */
          ownerships: userLedgerId
            ? {
                where: { user: { ledgerId: userLedgerId } },
                select: {
                  ownershipPercent: true,
                  pacToken: true,
                  totalReturned: true,
                  status: true,
                  amountCommitted: true,
                  role: true,
                  dynamicValue: true,
                  accumulatedDividends: true,
                  pirDebt: true,
                },
              }
            : false,
          /* ── V3.2: Location options from relation ONLY ── */
          locationOptionsList: true,
        },
      }),
      prisma.pool.count({ where }),
    ]);

    const enriched: PoolListItem[] = poolList.map((p) => {
      const assetImages = parseMediaField(p.assetImages);
      const assetVideos = parseMediaField(p.assetVideos);
      const documents = parseMediaField(p.documents);
      const externalLinks = parseMediaField(p.externalLinks);

      const ownership = p.ownerships?.[0];
      const myOwnership: MyOwnership | null = ownership
        ? {
            ownershipPercent: ownership.ownershipPercent,
            pacToken: ownership.pacToken,
            totalReturned: ownership.totalReturned,
            status: ownership.status,
            amountCommitted: ownership.amountCommitted,
            role: ownership.role,
            dynamicValue: ownership.dynamicValue,
            accumulatedDividends: ownership.accumulatedDividends,
            pirDebt: ownership.pirDebt,
          }
        : null;

      return {
        id: p.poolId,
        poolId: p.poolId,
        name: p.name,
        verticalId: p.verticalId,
        description: p.description,
        assetValue: p.assetValue,
        listedPrice: p.listedPrice,
        committed: p.committed,
        target: p.target,
        fillPercent: p.target > 0 ? Math.round((p.committed / p.target) * 100) : 0,
        status: p.status,
        country: p.country,
        creatorId: p.creatorId,
        imageUrl: p.imageUrl,
        assetImages,
        assetVideos,
        documents,
        tour360Url: p.tour360Url,
        externalLinks,
        emojiSet: p.emojiSet,
        assetCondition: p.assetCondition,
        minCommitment: p.minCommitment,
        maxCommitment: p.maxCommitment,
        campaignDuration: p.campaignDuration,
        closesAt: p.closesAt,
        createdAt: p.createdAt,
        participants: p.participants,
        maxParticipants: p.maxParticipants,
        isVerified: p.isVerified,
        hallUnlocked: p.hallUnlocked,
        hallId: p.hall?.id || null,
        hallStatus: p.hall?.status || null,
        locationOptions: (p.locationOptionsList || []) as LocationOptionItem[],
        myOwnership,
        myCommitment: ownership?.amountCommitted || 0,
        myInvitesRemaining: ownership?.inviteCodesRemaining || 0,
        hallClass: p.hallClass || "I",
        sriScore: p.hall?.sriScore || 50,
        ahgiScore: p.hall?.ahgiScore || 50,
      };
    });

    return NextResponse.json({
      success: true,
      pools: enriched,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   POST /api/pools — Create pool (Primary Admin only)
   Auto-spawns Ghost Hall + HallTreasury + SpvEntity.
   Location options written to LocationOption relation ONLY.
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (!isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Architect authority required to create pools" },
        { status: 403 }
      );
    }

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
        { success: false, error: "Missing required sovereign fields" },
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
    const effectiveHallClass = hallClass || "I";

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

    const surplus = effectiveListedPrice - effectiveTrueCost;
    const insuranceAllocation = Math.round(surplus * 0.25); // The Shield: 25%
    const poolId = `${verticalId.replace("ledger", "")}-${Date.now().toString(36)}`;

    // PIR allocation breakdown
    const pirAllocation = JSON.stringify({
      shield: Math.round(surplus * 0.25),    // 25% — Insurance
      seal: Math.round(surplus * 0.20),      // 20% — Legal/SPV
      forge: Math.round(surplus * 0.20),     // 20% — Maintenance
      spire: Math.round(surplus * 0.15),     // 15% — Protocol Dev
      vanguard: Math.round(surplus * 0.12),  // 12% — R&D
      sanctuary: Math.round(surplus * 0.08), // 8% — Emergency Reserve
    });

    const result = await prisma.$transaction(async (tx) => {
      const pool = await tx.pool.create({
        data: {
          poolId,
          name,
          verticalId,
          assetValue: numAssetValue,
          listedPrice: effectiveListedPrice,
          trueCost: effectiveTrueCost,
          surplus: surplus > 0 ? surplus : 0,
          target: effectiveListedPrice,
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
          hallClass: effectiveHallClass,
          pirAllocation,
          assetBookValue: numAssetValue,
        },
      });

      const hall = await tx.hall.create({
        data: {
          poolId: pool.id,
          name: `${name} — Hall`,
          status: "ghost",
          hallClass: effectiveHallClass,
          sriScore: 50,
          ahgiScore: 50,
          closureStatus: "active",
        },
      });

      await tx.hallTreasury.create({
        data: {
          hallId: hall.id,
          balance: 0,
          totalDistributed: 0,
          totalRevenue: 0,
          payrollReserve: 0,
          pirDebt: 0,
          closureReserve: 0,
          monthlyRevenue: 0,
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

      // Create PIR allocations
      const pirData = JSON.parse(pirAllocation);
      for (const [pillar, amount] of Object.entries(pirData)) {
        await tx.pirAllocation.create({
          data: {
            hallId: hall.id,
            pillar,
            amount: amount as number,
            purpose: getPirPillarPurpose(pillar),
          },
        });
      }

      /* ── V3.2: Location options written to relation ONLY ── */
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
          description: `Pool ${pool.name} created. Listed: $${effectiveListedPrice.toLocaleString()} | True Cost: $${effectiveTrueCost.toLocaleString()} | PIR: $${surplus.toLocaleString()}`,
          amount: effectiveListedPrice,
          txHash: `POOL-CREATE-${pool.poolId}-${Date.now()}`,
          poolId: pool.id,
        },
      });

      await tx.hallActivity.create({
        data: {
          hallId: hall.id,
          type: "system",
          description: "Hall genesis — pool published",
        },
      });

      return { pool, hall, spv };
    });

    return NextResponse.json(
      {
        success: true,
        pool: {
          id: result.pool.poolId,
          poolId: result.pool.poolId,
          name: result.pool.name,
          verticalId: result.pool.verticalId,
          listedPrice: result.pool.listedPrice,
          target: result.pool.target,
          hallId: result.hall.id,
          spvId: result.spv.id,
          assetImages: assetImages || null,
          assetVideos: assetVideos || null,
          tour360Url: tour360Url || null,
          documents: documents || null,
          hallClass: result.pool.hallClass,
        },
        message: `Pool created. Listed: $${effectiveListedPrice.toLocaleString()}. PIR: $${surplus.toLocaleString()}. Hall & SPV auto-generated.`,
      },
      { status: 201 }
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}

function getPirPillarPurpose(pillar: string): string {
  const purposes: Record<string, string> = {
    shield: "Lloyd's insurance coverage, casualty, liability, force majeure",
    seal: "Entity registration, operating agreements, beneficial interest documents",
    forge: "Repairs, upkeep, vendor contracts, management fees, payroll",
    spire: "Protocol development, infrastructure, API, audits",
    vanguard: "New vertical R&D, geographic expansion, ecosystem grants",
    sanctuary: "Vacancy coverage, dividend smoothing, market downturn, closure protection",
  };
  return purposes[pillar] || "General PIR allocation";
}

/* ============================================================
   PATCH /api/pools — Primary admin metadata update
   LOCKED: If committed > 0, price/cost/target cannot change.
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Architect authority required" },
        { status: 403 }
      );
    }

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
    const lockedFields = ["listedPrice", "trueCost", "target", "surplus", "insuranceAllocation", "pirAllocation"];
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

      const newSurplus = newListed - newCost;
      allowedUpdates.surplus = newSurplus > 0 ? newSurplus : 0;
      allowedUpdates.insuranceAllocation = Math.round(newSurplus * 0.25);
      allowedUpdates.pirAllocation = JSON.stringify({
        shield: Math.round(newSurplus * 0.25),
        seal: Math.round(newSurplus * 0.20),
        forge: Math.round(newSurplus * 0.20),
        spire: Math.round(newSurplus * 0.15),
        vanguard: Math.round(newSurplus * 0.12),
        sanctuary: Math.round(newSurplus * 0.08),
      });

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
        accessThreshold: updated.target,
      },
      message: `Pool ${poolId} updated.`,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   DELETE /api/pools — Suspend pool (Primary Admin only)
   Also suspends Hall and logs audit trail.
   ============================================================ */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Architect authority required" },
        { status: 403 }
      );
    }

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
          description: `Pool ${pool.name} suspended by Architect`,
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
    return handlePrismaError(error);
  }
}