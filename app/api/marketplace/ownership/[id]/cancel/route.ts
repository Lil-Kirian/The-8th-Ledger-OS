// app/api/marketplace/ownership/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/* ============================================================
   POST /api/marketplace/ownership/[id]/cancel
   Seller cancels their active listing before any buyer initiates escrow
   ============================================================ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, error: "Account suspended" },
        { status: 403 }
      );
    }

    const listing = await prisma.ownershipListing.findUnique({
      where: { id },
      include: {
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

    // Only the seller can cancel their own listing
    if (listing.sellerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Only the seller can cancel this listing" },
        { status: 403 }
      );
    }

    // Already cancelled
    if (listing.status === "cancelled" || listing.status === "deleted") {
      return NextResponse.json(
        { success: false, error: "Listing is already cancelled" },
        { status: 400 }
      );
    }

    // Already sold
    if (listing.status === "sold" || listing.soldAt) {
      return NextResponse.json(
        { success: false, error: "Listing is already sold. Cannot cancel." },
        { status: 400 }
      );
    }

    // In escrow — seller cannot cancel once buyer committed funds
    if (listing.status === "escrow") {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase is in escrow. Seller cannot cancel once a buyer has committed funds. Buyer may cancel for refund, or funds will auto-release after 48 hours.",
        },
        { status: 400 }
      );
    }

    // Only active listings can be cancelled
    if (listing.status !== "active") {
      return NextResponse.json(
        { success: false, error: `Listing cannot be cancelled. Current status: ${listing.status}` },
        { status: 400 }
      );
    }

    // Cancel the listing — sanitize all escrow fields
    const cancelled = await prisma.ownershipListing.update({
      where: { id: listing.id },
      data: {
        status: "cancelled",
        buyerId: null,
        escrowStartedAt: null,
        escrowExpiresAt: null,
        expiresAt: new Date(), // expire immediately
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: "ownership_listing_cancelled",
        description: `Seller ${user.ledgerId} cancelled listing ${listing.id} for ${listing.percentListed}% of Hall ${listing.hallId}`,
        ledgerId: user.ledgerId,
        poolId: listing.hall.poolId,
        amount: Math.round(listing.totalPrice),
        metadata: JSON.stringify({
          listingId: listing.id,
          percentListed: listing.percentListed,
          pricePerPercent: listing.pricePerPercent,
          totalPrice: listing.totalPrice,
        }),
        txHash: `LED-CANCEL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        visibleToPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      listing: {
        id: cancelled.id,
        status: cancelled.status,
        percentListed: listing.percentListed,
        hallId: listing.hallId,
        cancelledAt: cancelled.expiresAt,
      },
      message: "Listing cancelled. No penalty applied.",
    });
  } catch (err: any) {
    console.error("[OWNERSHIP_CANCEL_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message || "Failed to cancel listing" },
      { status: 500 }
    );
  }
}