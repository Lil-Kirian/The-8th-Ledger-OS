// app/api/marketplace/ownership/[id]/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";

/* ============================================================
   POST /api/marketplace/ownership/[id]/refund
   Buyer cancels within 48h → full refund, listing returns to active
   ============================================================ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);
    const claims = getSessionClaims(req);
    const isFounder = isFounderSync(claims) || user.role === "founder";

    const listing = await prisma.ownershipListing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            ledgerId: true,
            displayName: true,
          },
        },
        buyer: {
          select: {
            id: true,
            ledgerId: true,
          },
        },
        hall: {
          select: {
            id: true,
            poolId: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Must be in escrow
    if (listing.status !== "escrow" || !listing.escrowStartedAt || !listing.buyerId) {
      return NextResponse.json(
        { success: false, error: "No active escrow to refund." },
        { status: 400 }
      );
    }

    // Only the buyer can refund (or founder emergency override)
    const isBuyer = listing.buyerId === user.id;

    if (!isBuyer && !isFounder) {
      return NextResponse.json(
        { success: false, error: "Only the buyer can cancel this purchase." },
        { status: 403 }
      );
    }

    // 48h window check
    const now = new Date();
    const escrowEndsAt = listing.escrowExpiresAt
      ? new Date(listing.escrowExpiresAt)
      : new Date(listing.escrowStartedAt.getTime() + 48 * 60 * 60 * 1000);

    if (now > escrowEndsAt && !isFounder) {
      return NextResponse.json(
        {
          success: false,
          error: "Escrow period has expired. Funds auto-released to seller. Refund no longer possible.",
          escrowEndedAt: escrowEndsAt,
        },
        { status: 400 }
      );
    }

    // Calculate total to refund
    const isFullSale = !listing.isFractional;
    const feePercent = isFullSale ? 0.01 : 0.02;
    const ledgerFee = Math.round(listing.totalPrice * feePercent);
    const buyerTotal = listing.totalPrice + ledgerFee;

    const buyerLedgerId = listing.buyer?.ledgerId;
    if (!buyerLedgerId) {
      return NextResponse.json(
        { success: false, error: "Buyer wallet not found" },
        { status: 400 }
      );
    }

    // Execute refund atomically
    await prisma.$transaction(async (tx) => {
      // 1. Return funds to buyer wallet
      await tx.wallet.update({
        where: { ledgerId: buyerLedgerId },
        data: {
          lockedBalance: { decrement: buyerTotal },
          balance: { increment: buyerTotal },
        },
      });

      // 2. Reset listing to active, clear all escrow fields
      await tx.ownershipListing.update({
        where: { id: listing.id },
        data: {
          status: "active",
          buyerId: null,
          escrowStartedAt: null,
          escrowExpiresAt: null,
          auditHash: null,
          soldAt: null,
          updatedAt: new Date(),
        },
      });
    });

    // Post-transaction: audit + notifications (fire and forget)
    const auditPromise = prisma.auditLog.create({
      data: {
        eventType: "ownership_purchase_refunded",
        description: `Buyer ${buyerLedgerId} cancelled escrow and received full refund of $${buyerTotal.toFixed(2)} for listing ${listing.id}. Listing returned to active.`,
        ledgerId: buyerLedgerId,
        poolId: listing.hall.poolId,
        amount: buyerTotal,
        metadata: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.sellerId,
          percentListed: listing.percentListed,
          pricePerPercent: listing.pricePerPercent,
          totalPrice: listing.totalPrice,
          ledgerFee,
          buyerTotal,
          refundedBy: isFounder && !isBuyer ? "founder_override" : "buyer",
        }),
        txHash: `LED-REFUND-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        visibleToPublic: true,
      },
    });

    const sellerNotifPromise = prisma.notification.create({
      data: {
        ledgerId: listing.seller.ledgerId,
        poolId: listing.hall.poolId,
        type: "marketplace",
        title: "Buyer cancelled purchase",
        message: `The buyer cancelled their purchase of ${listing.percentListed}% of your ownership. Your listing is back on the marketplace.`,
        actionUrl: `/marketplace/ownership/${listing.id}`,
      },
    });

    Promise.all([auditPromise, sellerNotifPromise]).catch((err) => {
      console.error("[OWNERSHIP_REFUND_NOTIFICATIONS]", err);
    });

    return NextResponse.json({
      success: true,
      refund: {
        listingId: listing.id,
        status: "active",
        refundedAmount: buyerTotal,
        ledgerFee,
        isFullSale,
        refundedAt: now,
        refundedBy: isFounder && !isBuyer ? "founder_override" : "buyer",
      },
      message: "Purchase cancelled. Full refund processed. Listing returned to active marketplace.",
    });
  } catch (err: any) {
    console.error("[OWNERSHIP_REFUND_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Failed to process refund" },
      { status: 500 }
    );
  }
}