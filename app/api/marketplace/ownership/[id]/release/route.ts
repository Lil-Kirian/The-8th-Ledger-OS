// app/api/marketplace/ownership/[id]/release/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";
import { generatePacToken, generateTxHash } from "@/lib/utils";
import crypto from "crypto";

/* ============================================================
   POST /api/marketplace/ownership/[id]/release
   48h passes → transfer ownership, release funds, pay seller
   ============================================================ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);
    const claims = await getSessionClaims(req);
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
            displayName: true,
          },
        },
        hall: {
          select: {
            id: true,
            poolId: true,
            name: true,
            status: true,
            closureStatus: true,
          },
        },
        ownership: {
          select: {
            id: true,
            poolId: true,
            ownershipPercent: true,
            accumulatedDividends: true,
            pirDebt: true,
            ihcpDebt: true,
            dynamicValue: true,
            totalFromMarket: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    // Must be in escrow with a buyer
    if (
      listing.status !== "escrow" ||
      !listing.buyerId ||
      !listing.escrowStartedAt
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Listing is not in escrow. No release possible.",
        },
        { status: 400 },
      );
    }

    const escrowEndsAt = listing.escrowExpiresAt
      ? new Date(listing.escrowExpiresAt)
      : new Date(listing.escrowStartedAt.getTime() + 48 * 60 * 60 * 1000);

    const now = new Date();
    const canForceRelease =
      isFounder && req.headers.get("x-founder-override") === "true";

    // 48h must have passed, or founder force-override
    if (now < escrowEndsAt && !canForceRelease) {
      const remainingMs = escrowEndsAt.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return NextResponse.json(
        {
          success: false,
          error: `Escrow period active. ${remainingHours} hours remaining before auto-release.`,
          escrowEndsAt,
          remainingMs,
        },
        { status: 400 },
      );
    }

    // Hall must still be live
    if (
      listing.hall.status !== "live" ||
      listing.hall.closureStatus !== "active"
    ) {
      return NextResponse.json(
        { success: false, error: "Hall is not active. Release suspended." },
        { status: 400 },
      );
    }

    // Calculate financials
    const isFullSale = !listing.isFractional;
    const feePercent = isFullSale ? 0.01 : 0.02;
    const ledgerFee = Math.round(listing.totalPrice * feePercent);

    // Clamp debt deductions to available debt (prevent negative)
    const availableAfterFee = listing.totalPrice - ledgerFee;
    const pirDeduction = Math.min(
      listing.ownership.pirDebt || 0,
      availableAfterFee,
    );
    const remainingAfterPir = availableAfterFee - pirDeduction;
    const ihcpDeduction = Math.min(
      listing.ownership.ihcpDebt || 0,
      remainingAfterPir,
    );
    const sellerPayout =
      listing.totalPrice - ledgerFee - pirDeduction - ihcpDeduction;

    // Generate immutable hash
    const hashPayload = `${listing.id}|${listing.sellerId}|${listing.buyerId}|${listing.ownershipId}|${listing.percentListed}|${listing.totalPrice}|${now.toISOString()}`;
    const transferHash = crypto
      .createHash("sha256")
      .update(hashPayload)
      .digest("hex");

    // Execute atomic transfer
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update listing to sold
      const soldListing = await tx.ownershipListing.update({
        where: { id: listing.id },
        data: {
          status: "sold",
          soldAt: now,
          auditHash: transferHash,
        },
      });

      // 2. Unlock buyer's locked balance
      const buyerTotal = listing.totalPrice + ledgerFee;
      await tx.wallet.update({
        where: { ledgerId: listing.buyer.ledgerId },
        data: {
          lockedBalance: { decrement: buyerTotal },
        },
      });

      // 3. Pay seller (net of debts)
      await tx.wallet.update({
        where: { ledgerId: listing.seller.ledgerId },
        data: {
          balance: { increment: sellerPayout },
        },
      });

      // 4. 8th Ledger fee to hall treasury
      const treasury = await tx.hallTreasury.findUnique({
        where: { hallId: listing.hall.id },
      });
      if (treasury) {
        await tx.hallTreasury.update({
          where: { id: treasury.id },
          data: {
            balance: { increment: ledgerFee },
          },
        });
        await tx.hallTreasuryTransaction.create({
          data: {
            treasuryId: treasury.id,
            type: "marketplace_fee",
            amount: ledgerFee,
            description: `Marketplace fee from PAC sale: ${listing.percentListed}% of Hall ${listing.hall.id}`,
            metadata: JSON.stringify({
              listingId: listing.id,
              sellerId: listing.sellerId,
              buyerId: listing.buyerId,
              transferHash,
            }),
          },
        });
      }

      // 5. Update seller's ownership
      const sellerOwnership = await tx.ownership.findUnique({
        where: { id: listing.ownershipId },
      });
      if (!sellerOwnership) {
        throw new Error("SELLER_OWNERSHIP_NOT_FOUND");
      }

      const newSellerPercent = parseFloat(
        (sellerOwnership.ownershipPercent - listing.percentListed).toFixed(4),
      );

      if (newSellerPercent <= 0.001 || isFullSale) {
        // Full sale — mark as transferred
        await tx.ownership.update({
          where: { id: sellerOwnership.id },
          data: {
            ownershipPercent: 0,
            status: "transferred",
            totalFromMarket:
              sellerOwnership.totalFromMarket + Math.round(sellerPayout),
            pirDebt: Math.max(0, sellerOwnership.pirDebt - pirDeduction),
            ihcpDebt: Math.max(0, sellerOwnership.ihcpDebt - ihcpDeduction),
            updatedAt: now,
          },
        });
      } else {
        // Partial sale — reduce percentage
        await tx.ownership.update({
          where: { id: sellerOwnership.id },
          data: {
            ownershipPercent: newSellerPercent,
            totalFromMarket:
              sellerOwnership.totalFromMarket + Math.round(sellerPayout),
            pirDebt: Math.max(0, sellerOwnership.pirDebt - pirDeduction),
            ihcpDebt: Math.max(0, sellerOwnership.ihcpDebt - ihcpDeduction),
            updatedAt: now,
          },
        });
      }

      // 6. Update or create buyer's ownership
      let buyerOwnership = await tx.ownership.findFirst({
        where: {
          hallId: listing.hall.id,
          userId: listing.buyerId,
        },
      });

      if (buyerOwnership) {
        await tx.ownership.update({
          where: { id: buyerOwnership.id },
          data: {
            ownershipPercent: { increment: listing.percentListed },
            amountCommitted: { increment: Math.round(listing.totalPrice) },
            dynamicValue: listing.ownership.dynamicValue,
            status: "active",
            updatedAt: now,
          },
        });
      } else {
        buyerOwnership = await tx.ownership.create({
          data: {
            poolId: sellerOwnership.poolId,
            userId: listing.buyerId,
            hallId: listing.hall.id,
            amountCommitted: Math.round(listing.totalPrice),
            ownershipPercent: listing.percentListed,
            pacToken: generatePacToken(
              sellerOwnership.poolId,
              listing.buyer.ledgerId,
            ),
            dynamicValue: listing.ownership.dynamicValue,
            accumulatedDividends: 0,
            pirDebt: 0,
            ihcpDebt: 0,
            status: "active",
            ledgerId: listing.buyer.ledgerId,
          },
        });
      }

      // 7. Hall activity log — no amounts, just % change
      await tx.hallActivity.create({
        data: {
          hallId: listing.hall.id,
          userId: listing.buyerId,
          type: "ownership_transfer",
          description: `${listing.buyer?.ledgerId} acquired ${listing.percentListed}% from ${listing.seller?.ledgerId}`,
          metadata: JSON.stringify({
            transferHash,
            listingId: listing.id,
            percent: listing.percentListed,
            noAmounts: true,
          }),
        },
      });

      return {
        soldListing,
        sellerPayout,
        ledgerFee,
        pirDeduction,
        ihcpDeduction,
        transferHash,
        newSellerPercent: isFullSale ? 0 : newSellerPercent,
        buyerOwnershipId: buyerOwnership?.id,
      };
    });

    // Post-transaction: audit + notifications (fire and forget)
    const auditPromise = prisma.auditLog.create({
      data: {
        eventType: "ownership_transfer_completed",
        description: `Ownership transfer complete: ${listing.percentListed}% of Hall ${listing.hall.id} from ${listing.seller?.ledgerId} to ${listing.buyer?.ledgerId}. PIR: $${pirDeduction}. IHCP: $${ihcpDeduction}. Net: $${sellerPayout}. Hash: ${result.transferHash}`,
        ledgerId: listing.buyer?.ledgerId,
        poolId: listing.hall.poolId,
        amount: listing.totalPrice,
        metadata: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.sellerId,
          buyerId: listing.buyerId,
          ownershipId: listing.ownershipId,
          percentListed: listing.percentListed,
          pricePerPercent: listing.pricePerPercent,
          totalPrice: listing.totalPrice,
          ledgerFee: result.ledgerFee,
          pirDeduction: result.pirDeduction,
          ihcpDeduction: result.ihcpDeduction,
          sellerPayout: result.sellerPayout,
          transferHash: result.transferHash,
          isFullSale,
          founderOverride: canForceRelease,
        }),
        txHash: generateTxHash("LED-RELEASE"),
        visibleToPublic: true,
      },
    });

    const sellerNotifPromise = prisma.notification.create({
      data: {
        ledgerId: listing.seller.ledgerId,
        poolId: listing.hall.poolId,
        type: "marketplace",
        title: "Your PAC sale is complete",
        message: `${listing.buyer?.displayName} now owns ${listing.percentListed}% of your former stake. You received $${result.sellerPayout.toFixed(2)} (after debt deductions).`,
        actionUrl: `/halls/${listing.hall.id}`,
      },
    });

    const buyerNotifPromise = prisma.notification.create({
      data: {
        ledgerId: listing.buyer.ledgerId,
        poolId: listing.hall.poolId,
        type: "marketplace",
        title: "Ownership transfer complete",
        message: `You now own ${listing.percentListed}% of Hall ${listing.hall.id}. Welcome, sovereign.`,
        actionUrl: `/halls/${listing.hall.id}`,
      },
    });

    Promise.all([auditPromise, sellerNotifPromise, buyerNotifPromise]).catch(
      (err) => {
        console.error("[OWNERSHIP_RELEASE_NOTIFICATIONS]", err);
      },
    );

    return NextResponse.json({
      success: true,
      transfer: {
        listingId: listing.id,
        status: "sold",
        percentListed: listing.percentListed,
        sellerId: listing.seller?.ledgerId,
        buyerId: listing.buyer?.ledgerId,
        hallId: listing.hall.id,
        totalPrice: listing.totalPrice,
        ledgerFee: result.ledgerFee,
        pirDeduction: result.pirDeduction,
        ihcpDeduction: result.ihcpDeduction,
        sellerPayout: result.sellerPayout,
        transferHash: result.transferHash,
        isFullSale,
        founderOverride: canForceRelease,
        releasedAt: now,
      },
      message: isFullSale
        ? "Full ownership transfer complete. Seller has exited the hall."
        : "Fractional ownership transfer complete. New percentages active next dividend cycle.",
    });
  } catch (err: any) {
    console.error("[OWNERSHIP_RELEASE_POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "SELLER_OWNERSHIP_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Seller ownership record not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: message || "Failed to release escrow and transfer ownership",
      },
      { status: 500 },
    );
  }
}
