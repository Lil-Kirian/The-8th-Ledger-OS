// app/api/marketplace/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isFounderSync, getSessionClaims } from "@/lib/auth";

const PLATFORMS = [
  "tiktok",
  "instagram",
  "whatsapp",
  "twitter",
  "telegram",
] as const;
type Platform = (typeof PLATFORMS)[number];

/* ============================================================
   GET — Fetch or generate share link for an inventory item
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "itemId required" },
        { status: 400 },
      );
    }

    let shareLink = await prisma.socialShare.findFirst({
      where: {
        userId: user.id,
        itemId,
      },
      include: {
        item: {
          select: {
            title: true,
            price: true,
            images: true,
            hall: {
              select: {
                name: true,
                pool: { select: { verticalId: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      const refCode = generateRefCode(user.ledgerId, itemId);
      shareLink = await prisma.socialShare.create({
        data: {
          userId: user.id,
          itemId,
          refCode,
        },
        include: {
          item: {
            select: {
              title: true,
              price: true,
              images: true,
              hall: {
                select: {
                  name: true,
                  pool: { select: { verticalId: true, name: true } },
                },
              },
            },
          },
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://8thledger.io";
    const shareUrl = `${baseUrl}/marketplace/inventory/${itemId}?ref=${shareLink.refCode}`;

    // Parse images JSON
    let image = "";
    if (shareLink.item?.images) {
      try {
        const parsed = JSON.parse(shareLink.item.images);
        image = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        image = shareLink.item.images;
      }
    }

    const title =
      shareLink.item?.title || shareLink.item?.hall?.name || "8th Ledger Asset";
    const price = shareLink.item?.price
      ? `$${Number(shareLink.item.price).toFixed(2)}`
      : "";
    const vertical = shareLink.item?.hall?.pool?.verticalId || "";

    const deepLinks = {
      tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`I own this on 8th Ledger — ${title} ${price} ${vertical ? `#${vertical}` : ""}`)}`,
      instagram: `https://www.instagram.com/`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out "${title}" on 8th Ledger — ${shareUrl}`)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`I own this on 8th Ledger — ${title} ${price}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`I own this on 8th Ledger — ${title} ${price}`)}`,
    };

    const instagramCaption = `I own this on 8th Ledger 🔗\n\n"${title}" ${price}\n${vertical ? `Vertical: ${vertical}` : ""}\n\n${shareUrl}\n\n#8thLedger #${vertical || "RealWorldAssets"} #Ownership`;

    return NextResponse.json({
      success: true,
      share: {
        refCode: shareLink.refCode,
        shareUrl,
        shortUrl: `${baseUrl}/s/${shareLink.refCode}`,
        title,
        price,
        vertical,
        image,
        totalClicks: shareLink.clicks,
        conversions: shareLink.conversions,
        commissionEarned: shareLink.commissionEarned,
        estimatedCommission: shareLink.commissionEarned, // Already tracked
        deepLinks,
        instagramCaption,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`,
      },
    });
  } catch (error) {
    console.error("[MARKETPLACE SHARE GET]", error);
    return NextResponse.json(
      { success: false, error: "Share link generation failed" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST — Record click (no auth required)
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { refCode, platform } = body;

    if (!refCode || typeof refCode !== "string") {
      return NextResponse.json(
        { success: false, error: "refCode required" },
        { status: 400 },
      );
    }

    const shareLink = await prisma.socialShare.findUnique({
      where: { refCode },
      select: { id: true, userId: true, itemId: true, clicks: true },
    });

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: "Invalid ref code" },
        { status: 404 },
      );
    }

    const validPlatform = PLATFORMS.includes(platform as Platform)
      ? (platform as Platform)
      : "other";

    await prisma.socialShare.update({
      where: { id: shareLink.id },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      click: {
        refCode,
        platform: validPlatform,
        itemId: shareLink.itemId,
      },
      message: "Click tracked.",
    });
  } catch (error) {
    console.error("[MARKETPLACE SHARE POST]", error);
    return NextResponse.json(
      { success: false, error: "Click tracking failed" },
      { status: 500 },
    );
  }
}

/* ============================================================
   PATCH — Record conversion (8th Ledger only)
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    const claims = await getSessionClaims(request);
    const isFounder = isFounderSync(claims);

    if (!isFounder && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "8th Ledger authority required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { refCode, orderId, amount } = body;

    if (!refCode || !orderId) {
      return NextResponse.json(
        { success: false, error: "refCode and orderId required" },
        { status: 400 },
      );
    }

    const shareLink = await prisma.socialShare.findUnique({
      where: { refCode },
      select: {
        id: true,
        userId: true,
        conversions: true,
        commissionEarned: true,
      },
    });

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: "Ref code not found" },
        { status: 404 },
      );
    }

    await prisma.socialShare.update({
      where: { id: shareLink.id },
      data: {
        conversions: { increment: 1 },
        commissionEarned: { increment: amount || 0 },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Conversion recorded for ${refCode}. Order #${orderId}.`,
    });
  } catch (error) {
    console.error("[MARKETPLACE SHARE PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Conversion tracking failed" },
      { status: 500 },
    );
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function generateRefCode(ledgerId: string, seed: string): string {
  const base = `${ledgerId.slice(-4)}${seed.slice(-4)}${Date.now().toString(36).toUpperCase()}`;
  return base.replace(/[^A-Z0-9]/g, "").slice(0, 12);
}
