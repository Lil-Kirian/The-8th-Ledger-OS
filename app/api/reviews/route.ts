import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface ReviewResponse {
  success: boolean;
  reviews?: unknown[];
  review?: unknown;
  averageRating?: number;
  total?: number;
  error?: string;
  message?: string;
}

/* ============================================================
   GET /api/reviews — Pool reviews with stats
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get("poolId");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
    const skip = (page - 1) * limit;

    if (!poolId) {
      return NextResponse.json<ReviewResponse>(
        { success: false, error: "Pool ID required" },
        { status: 400 }
      );
    }

    const [reviews, total, aggregate] = await prisma.$transaction([
      prisma.poolReview.findMany({
        where: { poolId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              country: true,
              tier: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.poolReview.count({ where: { poolId } }),
      prisma.poolReview.aggregate({
        where: { poolId },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json<ReviewResponse>({
      success: true,
      reviews,
      total,
      averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
    });
  } catch (error) {
    console.error("[REVIEWS GET]", error);
    return NextResponse.json<ReviewResponse>(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/reviews — Submit a pool review
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<ReviewResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { poolId, rating, content, title } = body;

    if (!poolId || !rating || !content) {
      return NextResponse.json<ReviewResponse>(
        { success: false, error: "Pool ID, rating, and content required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json<ReviewResponse>(
        { success: false, error: "Rating must be 1–5" },
        { status: 400 }
      );
    }

    if (content.length < 5 || content.length > 2000) {
      return NextResponse.json<ReviewResponse>(
        { success: false, error: "Review must be 5–2000 characters" },
        { status: 400 }
      );
    }

    // Verify pool exists
    const pool = await prisma.pool.findUnique({ where: { poolId } });
    if (!pool) {
      return NextResponse.json<ReviewResponse>(
        { success: false, error: "Pool not found" },
        { status: 404 }
      );
    }

    // One review per user per pool
    const existing = await prisma.poolReview.findUnique({
      where: { poolId_ledgerId: { poolId, ledgerId: user.ledgerId } },
    });
    if (existing) {
      return NextResponse.json<ReviewResponse>(
        { success: false, error: "You already reviewed this pool" },
        { status: 409 }
      );
    }

    const review = await prisma.poolReview.create({
      data: {
        poolId,
        ledgerId: user.ledgerId,
        rating: Number(rating),
        title: title?.trim() || null,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            ledgerId: true,
            displayName: true,
            country: true,
            tier: true,
            avatar: true,
          },
        },
      },
    });

    // Activity log
    await prisma.activityEvent.create({
      data: {
        ledgerId: user.ledgerId,
        type: "pool_review",
        title: `Reviewed ${pool.name}`,
        detail: `${rating}★ — ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
        points: rating * 2,
      },
    });

    return NextResponse.json<ReviewResponse>(
      {
        success: true,
        review,
        message: "Review submitted",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[REVIEWS POST]", error);
    return NextResponse.json<ReviewResponse>(
      { success: false, error: error.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}