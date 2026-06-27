import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface ContractsResponse {
  success: boolean;
  contracts?: PacContract[];
  certificate?: CertificateData;
  stats?: ContractStats;
  error?: string;
  message?: string;
}

interface PacContract {
  id: string;
  token: string;
  hallName: string;
  hallId: string | null;
  poolId: string;
  vertical: string;
  emoji: string;
  ownershipPercent: number;
  value: number;
  dynamicValuePerPercent: number;
  issuedAt: string;
  expiresAt: string | null;
  assetImage: string;
  revenueHistory: number[];
  status: "active" | "maturing" | "dormant";
  sriScore: number | null;
  ahgiScore: number | null;
  accumulatedDividends: number;
  pirDebt: number;
}

interface ContractStats {
  totalValue: number;
  totalContracts: number;
  activeContracts: number;
  totalOwnership: number;
  totalAccumulatedDividends: number;
}

interface CertificateData {
  token: string;
  hallName: string;
  vertical: string;
  ownershipPercent: number;
  value: number;
  issuedAt: string;
  status: string;
  termsHash: string;
  ledgerId: string;
  legalNotice: string;
  dynamicValuePerPercent: number;
  sriScore: number | null;
  ahgiScore: number | null;
  accumulatedDividends: number;
}

const VERTICAL_EMOJI: Record<string, string> = {
  ledgerprop: "🏛",
  ledgerauto: "🚗",
  ledgertech: "💻",
  ledgeredu: "🎓",
  ledgerhealth: "🏥",
  ledgerbiz: "🏗️",
  ledgertravel: "✈️",
  ledgeragri: "🌿",
  ledgerenergy: "⚡",
  ledgeraccess: "📡",
};

/* ============================================================
   GET /api/contracts — List user's PAC contracts
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<ContractsResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const ownerships = await prisma.ownership.findMany({
      where: { userId: user.id },
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            verticalId: true,
            imageUrl: true,
            assetValue: true,
            status: true,
          },
        },
        hall: {
          select: {
            id: true,
            name: true,
            status: true,
            sriScore: true,
            ahgiScore: true,
          },
        },
        dividendEntries: {
          where: { claimed: true },
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 12,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const contracts: PacContract[] = ownerships.map((o) => {
      // Build 12-month revenue history from dividend entries
      const rawHistory = o.dividendEntries.map((d) => d.amount);
      const revenueHistory = Array(12).fill(0);
      rawHistory.forEach((amt, i) => {
        if (i < 12) revenueHistory[11 - i] = amt;
      });

      // Calculate dynamic value if available
      const dynamicValuePerPercent = o.dynamicValue && o.ownershipPercent > 0
        ? o.dynamicValue / o.ownershipPercent
        : (o.pool?.assetValue || 0) / 100;

      const status: "active" | "maturing" | "dormant" =
        o.hall?.status === "live" ? "active" :
        o.hall?.status === "mature" ? "maturing" :
        "dormant";

      return {
        id: o.id,
        token: o.pacToken || `PAC-${o.pool?.poolId?.toUpperCase()}-${o.id.slice(-4).toUpperCase()}`,
        hallName: o.hall?.name || o.pool?.name || "Unknown Hall",
        hallId: o.hallId,
        poolId: o.poolId,
        vertical: o.pool?.verticalId || "unknown",
        emoji: VERTICAL_EMOJI[o.pool?.verticalId || ""] || "📜",
        ownershipPercent: o.ownershipPercent,
        value: o.dynamicValue || o.amountCommitted || 0,
        dynamicValuePerPercent,
        issuedAt: o.createdAt.toISOString().split("T")[0],
        expiresAt: o.roleExpiresAt ? o.roleExpiresAt.toISOString().split("T")[0] : null,
        assetImage: o.pool?.imageUrl || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=400&fit=crop",
        revenueHistory,
        status,
        sriScore: o.hall?.sriScore ?? null,
        ahgiScore: o.hall?.ahgiScore ?? null,
        accumulatedDividends: o.accumulatedDividends || 0,
        pirDebt: o.pirDebt || 0,
      };
    });

    const stats: ContractStats = {
      totalValue: contracts.reduce((s, c) => s + c.value, 0),
      totalContracts: contracts.length,
      activeContracts: contracts.filter((c) => c.status === "active").length,
      totalOwnership: contracts.reduce((s, c) => s + c.ownershipPercent, 0),
      totalAccumulatedDividends: contracts.reduce((s, c) => s + c.accumulatedDividends, 0),
    };

    return NextResponse.json<ContractsResponse>({
      success: true,
      contracts,
      stats,
    });
  } catch (error) {
    console.error("[CONTRACTS GET]", error);
    return NextResponse.json<ContractsResponse>(
      { success: false, error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/contracts — Generate PAC certificate
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<ContractsResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contractId, format = "json" } = body;

    if (!contractId) {
      return NextResponse.json<ContractsResponse>(
        { success: false, error: "Contract ID required" },
        { status: 400 }
      );
    }

    const ownership = await prisma.ownership.findFirst({
      where: { id: contractId, userId: user.id },
      include: {
        pool: {
          select: {
            poolId: true,
            name: true,
            verticalId: true,
            assetValue: true,
          },
        },
        hall: {
          select: {
            id: true,
            name: true,
            status: true,
            sriScore: true,
            ahgiScore: true,
          },
        },
      },
    });

    if (!ownership) {
      return NextResponse.json<ContractsResponse>(
        { success: false, error: "Contract not found or not owned by you" },
        { status: 404 }
      );
    }

    const dynamicValuePerPercent = ownership.dynamicValue && ownership.ownershipPercent > 0
      ? ownership.dynamicValue / ownership.ownershipPercent
      : (ownership.pool?.assetValue || 0) / 100;

    const status =
      ownership.hall?.status === "live" ? "ACTIVE" :
      ownership.hall?.status === "mature" ? "MATURING" :
      "DORMANT";

    const certificate: CertificateData = {
      token: ownership.pacToken || `PAC-${ownership.pool?.poolId?.toUpperCase()}-${ownership.id.slice(-4).toUpperCase()}`,
      hallName: ownership.hall?.name || ownership.pool?.name || "Unknown",
      vertical: ownership.pool?.verticalId || "unknown",
      ownershipPercent: ownership.ownershipPercent,
      value: ownership.dynamicValue || ownership.amountCommitted || 0,
      issuedAt: ownership.createdAt.toISOString(),
      status,
      termsHash: `sha256://LED-${ownership.id}-${Date.now()}-${user.ledgerId}`,
      ledgerId: user.ledgerId,
      legalNotice:
        "This certifies sovereign ownership in the 8th Ledger protocol. " +
        "PACs are not securities, not tokens on a public blockchain, and not transferable outside the 8th Ledger ecosystem without Hall governance approval. " +
        "Revenue distributions follow the 8th Ledger Tithe: 20% to Protocol Infrastructure Reserve (PIR), 80% to Hall Treasury (pro-rata by ownership). " +
        "The 8th Ledger Holdings Ltd. holds all legal SPVs, insurance policies, and beneficial interest documents on behalf of owners.",
      dynamicValuePerPercent,
      sriScore: ownership.hall?.sriScore ?? null,
      ahgiScore: ownership.hall?.ahgiScore ?? null,
      accumulatedDividends: ownership.accumulatedDividends || 0,
    };

    // Immutable audit log
    await prisma.auditLog.create({
      data: {
        eventType: "certificate_downloaded",
        description: `PAC certificate downloaded: ${certificate.token} by ${user.ledgerId}`,
        ledgerId: user.ledgerId,
        poolId: ownership.poolId,
        txHash: `CERT-${Date.now().toString(36).toUpperCase()}`,
        visibleToPublic: false,
      },
    }).catch(() => {});

    return NextResponse.json<ContractsResponse>({
      success: true,
      certificate,
      message: `Certificate generated for ${certificate.token}`,
    });
  } catch (error: unknown) {
    console.error("[CONTRACTS POST]", error);
    return NextResponse.json<ContractsResponse>(
      { success: false, error: error.message || "Failed to generate certificate" },
      { status: 500 }
    );
  }
}