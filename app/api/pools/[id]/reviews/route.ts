import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

/* ============================================================
   SCHEMA
   ============================================================ */
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3).max(100).optional(),
  content: z.string().min(10).max(2000),
  tags: z.array(z.string()).max(5).optional(),
});

/* ============================================================
   GET /api/pools/[id]/reviews — fetch reviews for a pool
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: poolId } = await params;

    const reviews = await prisma.poolReview.findMany({
      where: { poolId },
      include: {
        user: {
          select: {
            ledgerId: true,
            displayName: true,
            avatar: true,
            tier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const aggregated = await prisma.poolReview.aggregate({
      where: { poolId },
      _avg: { rating: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      reviews,
      summary: {
        averageRating: aggregated._avg.rating || 0,
        totalReviews: aggregated._count.id,
      },
    });
  } catch (error) {
    console.error("[REVIEWS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

/* ============================================================
   POST /api/pools/[id]/reviews — create a review
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: poolId } = await params;

    // Verify pool exists
    const pool = await prisma.pool.findUnique({
      where: { poolId },
      select: { poolId: true, status: true },
    });

    if (!pool) {
      return NextResponse.json(
        { success: false, error: "Pool not found" },
        { status: 404 },
      );
    }

    // Check if user already reviewed this pool
    const existingReview = await prisma.poolReview.findUnique({
      where: {
        poolId_ledgerId: { poolId, ledgerId: user.ledgerId },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this pool" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const validated = reviewSchema.parse(body);

    // Prisma tags is String?, so serialize array to JSON
    const tagsString = validated.tags ? JSON.stringify(validated.tags) : null;

    const review = await prisma.poolReview.create({
      data: {
        poolId,
        ledgerId: user.ledgerId,
        rating: validated.rating,
        title: validated.title || null,
        content: validated.content,
        tags: tagsString,
      },
      include: {
        user: {
          select: {
            ledgerId: true,
            displayName: true,
            avatar: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("[REVIEWS_POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 },
    );
  }
}
