// app/api/marketplace/ownership/[id]/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

const KYC_TIER_RANK: Record<string, number> = {
  visitor: 0,
  sovereign: 1,
  verified: 2,
  whale: 3,
};

/* ============================================================
   POST /api/marketplace/ownership/[id]/buy
   Initiate purchase → 48h escrow
   ============================================================ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Buyer KYC gate
    if (user.kycTier === "visitor") {
      return NextResponse.json(
        { success: false, error: "KYC verification required to purchase PACs" },
        { status: 403 }
      );
    }

    // Find listing with seller and hall
    const listing = await prisma.ownershipListing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            ledgerId: true,
            displayName: true,
            kycTier: true,
            isBanned: true,
            lastActivityAt: true,
          },
        },
        hall: {
          select: {
            id: true,
            poolId: true,
            status: true,
            closureStatus: true,
            sriScore: true,
          },
        },
        ownership: {
          select: {
            ownershipPercent: true,
            status: true,
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

    // Listing must be active and not expired
    if (listing.status !== "active") {
      return NextResponse.json(
        { success: false, error: `Listing is ${listing.status}. Cannot purchase.` },
        { status: 400 }
      );
    }

    if (listing.expiresAt && listing.expiresAt <= new Date()) {
      return NextResponse.json(
        { success: false, error: "Listing has expired" },
        { status: 400 }
      );
    }

    // Hall must be live and not in closure
    if (listing.hall.status !== "live" || listing.hall.closureStatus !== "active") {
      return NextResponse.json(
        { success: false, error: "Hall is not active. Purchases suspended." },
        { status: 400 }
      );
    }

    // Buyer cannot buy their own listing
    if (listing.sellerId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot purchase your own listing" },
        { status: 400 }
      );
    }

    // KYC tier gate: buyer must match or exceed seller's tier
    const buyerRank = KYC_TIER_RANK[user.kycTier] || 0;
    const sellerTier = listing.sellerKycTier || listing.seller.kycTier || "visitor";
    const sellerRank = KYC_TIER_RANK[sellerTier] || 0;

    if (buyerRank < sellerRank) {
      return NextResponse.json(
        {
          success: false,
          error: `Your KYC tier (${user.kycTier}) is below the seller's tier (${sellerTier}). Upgrade required.`,
        },
        { status: 403 }
      );
    }

    // Identity lock: verify buyer has completed full KYC
    const kycRecord = await prisma.kycRecord.findUnique({
      where: { userId: user.id },
      select: { legalName: true, idVerified: true, status: true },
    });

    if (!kycRecord || !kycRecord.legalName || !kycRecord.idVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Complete identity verification required before purchase. Legal name and ID document must be on file.",
        },
        { status: 403 }
      );
    }

    // Anti-fraud: dormancy check on buyer
    const buyerDormant = await prisma.dormancyVault.findFirst({
      where: { userId: user.id, status: "vaulted" },
    });
    if (buyerDormant) {
      return NextResponse.json(
        { success: false, error: "Dormant accounts cannot purchase ownership" },
        { status: 403 }
      );
    }

    // Anti-fraud: dormancy check on seller
    const daysSinceActivity = listing.seller.lastActivityAt
      ? Math.floor((Date.now() - listing.seller.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    if (daysSinceActivity > 365) {
      return NextResponse.json(
        { success: false, error: "Seller account is dormant. Purchase blocked pending review." },
        { status: 400 }
      );
    }

    // Anti-fraud: rapid flipping check on buyer
    const recentPurchases = await prisma.ownershipListing.count({
      where: {
        buyerId: user.id,
        soldAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    if (recentPurchases >= 5) {
      return NextResponse.json(
        { success: false, error: "Purchase velocity limit reached. Maximum 5 PAC acquisitions per 7 days." },
        { status: 429 }
      );
    }

    // Calculate totals
    const isFullSale = !listing.isFractional;
    const feePercent = isFullSale ? 0.01 : 0.02;
    const ledgerFee = Math.round(listing.totalPrice * feePercent);
    const buyerTotal = listing.totalPrice + ledgerFee;

    // Wallet check
    const wallet = await prisma.wallet.findUnique({
      where: { ledgerId: user.ledgerId },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "No wallet found. Please deposit funds first." },
        { status: 400 }
      );
    }

    if (wallet.balance < buyerTotal) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Required: $${buyerTotal.toFixed(2)}, Available: $${wallet.balance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Generate audit hash
    const timestamp = new Date().toISOString();
    const transferHash = crypto
      .createHash("sha256")
      .update(`${listing.seller.ledgerId}:${user.id}:${listing.hallId}:${listing.percentListed}:${listing.totalPrice}:${timestamp}`)
      .digest("hex");

    const escrowEndsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Execute purchase atomically
    const result = await prisma.$transaction(async (tx) => {
      // Lock funds from buyer wallet
      const updatedWallet = await tx.wallet.update({
        where: { ledgerId: user.ledgerId },
        data: {
          balance: { decrement: buyerTotal },
          lockedBalance: { increment: buyerTotal },
        },
      });

      if (updatedWallet.balance < 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Lock listing into escrow — single update
      const updatedListing = await tx.ownershipListing.update({
        where: { id: listing.id },
        data: {
          status: "escrow",
          buyerId: user.id,
          escrowStartedAt: new Date(),
          escrowExpiresAt: escrowEndsAt,
          auditHash: transferHash,
          interestCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      return { updatedListing, updatedWallet };
    });

    // Post-transaction: audit log + notifications (non-blocking)
    const auditPromise = prisma.auditLog.create({
      data: {
        eventType: "ownership_purchase_initiated",
        description: `Buyer ${user.ledgerId} initiated purchase of ${listing.percentListed}% of Hall ${listing.hallId} from ${listing.seller.ledgerId} for $${buyerTotal.toFixed(2)} (escrow until ${escrowEndsAt.toISOString()}). Hash: ${transferHash}`,
        ledgerId: user.ledgerId,
        poolId: listing.hall.poolId,
        amount: buyerTotal,
        metadata: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.seller.ledgerId,
          percentListed: listing.percentListed,
          pricePerPercent: listing.pricePerPercent,
          ledgerFee,
          isFullSale,
          auditHash: transferHash,
        }),
        txHash: `LED-BUY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        visibleToPublic: true,
      },
    });

    const sellerNotifPromise = prisma.notification.create({
      data: {
        ledgerId: listing.seller.ledgerId,
        poolId: listing.hall.poolId,
        type: "marketplace",
        title: "Your PAC listing has a buyer",
        message: `${user.displayName} initiated purchase of ${listing.percentListed}% of your ownership. 48-hour escrow active.`,
        actionUrl: `/marketplace/ownership/${listing.id}`,
      },
    });

    const buyerNotifPromise = prisma.notification.create({
      data: {
        ledgerId: user.ledgerId,
        poolId: listing.hall.poolId,
        type: "marketplace",
        title: "Purchase Initiated",
        message: `You initiated purchase of ${listing.percentListed}% of Hall ${listing.hallId}. $${buyerTotal.toFixed(2)} held in 48h escrow. You may cancel for full refund before expiry.`,
        actionUrl: `/marketplace/ownership/${listing.id}`,
      },
    });

    // Fire and forget notifications — purchase already committed
    Promise.all([auditPromise, sellerNotifPromise, buyerNotifPromise]).catch((err) => {
      console.error("[OWNERSHIP_BUY_NOTIFICATIONS]", err);
    });

    return NextResponse.json({
      success: true,
      escrow: {
        listingId: listing.id,
        status: "escrow",
        buyerTotal,
        ledgerFee,
        feePercent,
        isFullSale,
        escrowStartedAt: new Date(),
        escrowEndsAt,
        remainingMs: 48 * 60 * 60 * 1000,
        buyerCanCancel: true,
        sellerCanCancel: false,
        auditHash: transferHash,
      },
      message: "Purchase initiated. Funds held in 48-hour escrow. Buyer may cancel for full refund during this period.",
    });
  } catch (err: any) {
    console.error("[OWNERSHIP_BUY_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Insufficient balance. Please try again." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: message || "Failed to initiate purchase" },
      { status: 500 }
    );
  }
}