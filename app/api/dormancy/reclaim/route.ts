import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";

// POST /api/dormancy/reclaim
// Reclaim PAC from the Dormancy Vault. Restores ownership to active.
// Requires: identity verification (KYC tier >= sovereign) + active login + no active auction bids.
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
    const { vaultId, verifyIdentity } = body;

    if (!vaultId) {
      return NextResponse.json(
        { success: false, error: "Vault ID required" },
        { status: 400 }
      );
    }

    if (!verifyIdentity) {
      return NextResponse.json(
        {
          success: false,
          error: "Identity verification required. Set verifyIdentity: true to confirm.",
        },
        { status: 400 }
      );
    }

    // KYC gate: must be at least sovereign tier to reclaim
    if (user.kycTier === "visitor") {
      return NextResponse.json(
        {
          success: false,
          error: "KYC tier too low. Complete Sovereign Identity Verification (SIV) to reclaim.",
        },
        { status: 403 }
      );
    }

    const vault = await prisma.dormancyVault.findFirst({
      where: {
        id: vaultId,
        userId: user.id,
        status: { in: ["vaulted", "auctioned"] },
      },
      include: {
        ownership: {
          select: { id: true, hallId: true, ownershipPercent: true, accumulatedDividends: true },
        },
        auctions: {
          where: { status: "active" },
          select: { id: true, buyerId: true, finalPrice: true },
        },
      },
    });

    if (!vault) {
      return NextResponse.json(
        { success: false, error: "Vault entry not found or already reclaimed" },
        { status: 404 }
      );
    }

    // Block reclaim if auction has active bids
    if (vault.status === "auctioned" && vault.auctions.some((a) => a.buyerId)) {
      return NextResponse.json(
        { success: false, error: "Cannot reclaim: auction has active bids" },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Restore ownership to active with accumulated dividends
      await tx.ownership.update({
        where: { id: vault.ownershipId },
        data: {
          status: "active",
          accumulatedDividends: { increment: vault.accumulatedDividends },
          updatedAt: new Date(),
        },
      });

      // Mark vault reclaimed
      await tx.dormancyVault.update({
        where: { id: vaultId },
        data: {
          status: "reclaimed",
          reclaimedAt: new Date(),
        },
      });

      // Cancel any pending auctions
      await tx.dormancyAuction.updateMany({
        where: { vaultId, status: "active" },
        data: { status: "cancelled" },
      });

      // Log dormancy event
      await tx.dormancyLog.create({
        data: {
          userId: user.id,
          type: "account",
          stage: "reclaimed",
          message: `Subject ${user.ledgerId} reclaimed PAC from Dormancy Vault.`,
          notifiedAt: new Date(),
          resolvedAt: new Date(),
        },
      });

      // Reset user activity clock
      await tx.user.update({
        where: { id: user.id },
        data: { lastActivityAt: new Date() },
      });

      // Create 8th Ledger update if hall exists
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

      // Audit trail
      await tx.auditLog.create({
        data: {
          eventType: "dormancy_reclaim",
          description: `Subject ${user.ledgerId} reclaimed ownership ${vault.ownershipId} from vault.`,
          ledgerId: user.ledgerId,
          txHash: `RECLAIM-${vaultId}-${Date.now()}`,
          visibleToPublic: true,
        },
      });
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
      message: "PAC reclaimed successfully. Ownership restored to active.",
      vaultId,
      ownershipId: vault.ownershipId,
      reclaimedAt: new Date().toISOString(),
      ledgerId: user.ledgerId,
    });
  } catch (error: any) {
    console.error("[DORMANCY RECLAIM] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Reclaim failed" },
      { status: 500 }
    );
  }
}