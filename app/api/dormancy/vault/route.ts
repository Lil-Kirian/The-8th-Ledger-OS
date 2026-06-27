import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";

// GET /api/dormancy/vault
// Returns current sovereign's Dormancy Vault contents
// Year 2: PACs held in trust. Dividends accrue. Reclaim by login + identity verification.
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const vaults = await prisma.dormancyVault.findMany({
      where: { userId: user.id },
      include: {
        ownership: {
          select: {
            ownershipPercent: true,
            dynamicValue: true,
            accumulatedDividends: true,
            poolId: true,
            hallId: true,
            pool: {
              select: {
                name: true,
                verticalId: true,
                country: true,
                imageUrl: true,
              },
            },
            hall: {
              select: {
                name: true,
                status: true,
                sriScore: true,
                ahgiScore: true,
              },
            },
          },
        },
        auctions: {
          where: { status: { in: ["active", "sold"] } },
          select: {
            id: true,
            startingPrice: true,
            finalPrice: true,
            status: true,
            listedAt: true,
            completedAt: true,
            buyerId: true,
          },
          orderBy: { listedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { vaultedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      ledgerId: user.ledgerId,
      vaults: vaults.map((v) => ({
        id: v.id,
        ownershipId: v.ownershipId,
        vaultedAt: v.vaultedAt,
        accumulatedDividends: v.accumulatedDividends,
        status: v.status,
        reclaimedAt: v.reclaimedAt,
        ownership: v.ownership,
        activeAuction: v.auctions[0] || null,
      })),
      count: vaults.length,
    });
  } catch (error: unknown) {
    console.error("[DORMANCY VAULT] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load vault" },
      { status: 500 }
    );
  }
}

// POST /api/dormancy/vault
// Reclaim PACs from the Dormancy Vault. Restores ownership to active.
// Requires identity verification (already passed via auth).
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vaultId } = body;

    if (!vaultId) {
      return NextResponse.json(
        { success: false, error: "vaultId required" },
        { status: 400 }
      );
    }

    const vault = await prisma.dormancyVault.findFirst({
      where: { id: vaultId, userId: user.id },
      include: {
        ownership: {
          select: { id: true, status: true, hallId: true, ownershipPercent: true },
        },
      },
    });

    if (!vault) {
      return NextResponse.json(
        { success: false, error: "Vault entry not found" },
        { status: 404 }
      );
    }

    if (vault.status !== "vaulted") {
      return NextResponse.json(
        { success: false, error: `Cannot reclaim — status is ${vault.status}` },
        { status: 400 }
      );
    }

    // Check if an active auction exists (Year 3) — cannot reclaim if already listed
    const activeAuction = await prisma.dormancyAuction.findFirst({
      where: { vaultId, status: "active" },
    });

    if (activeAuction) {
      return NextResponse.json(
        {
          success: false,
          error: "PAC is currently in auction. Cannot reclaim until auction completes or is cancelled.",
          auctionId: activeAuction.id,
        },
        { status: 409 }
      );
    }

    // Reclaim: restore ownership to active, mark vault as reclaimed
    await prisma.$transaction(async (tx) => {
      await tx.dormancyVault.update({
        where: { id: vaultId },
        data: {
          status: "reclaimed",
          reclaimedAt: new Date(),
        },
      });

      await tx.ownership.update({
        where: { id: vault.ownershipId },
        data: {
          status: "active",
          updatedAt: new Date(),
        },
      });

      // Log 8th Ledger update
      if (vault.ownership?.hallId) {
        await tx.eighthLedgerUpdate.create({
          data: {
            hallId: vault.ownership.hallId,
            type: "DORMANCY_RECLAIMED",
            title: "Dormancy Reclaim",
            content: `Owner ${user.ledgerId} reclaimed ${vault.ownership.ownershipPercent}% from the Dormancy Vault. Ownership restored.`,
          },
        });
      }
    });

    await logSecurityAudit({
      action: "DORMANCY_RECLAIMED",
      actorId: user.ledgerId,
      targetId: vault.ownershipId,
      metadata: { vaultId, hallId: vault.ownership?.hallId },
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "PAC reclaimed from Dormancy Vault. Ownership restored.",
      vaultId,
      ownershipId: vault.ownershipId,
      reclaimedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[DORMANCY VAULT] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reclaim from vault" },
      { status: 500 }
    );
  }
}