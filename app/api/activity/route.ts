import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface ActivityResponse {
  success: boolean;
  events?: unknown[];
  total?: number;
  hasMore?: boolean;
  error?: string;
  message?: string;
}

/* ============================================================
   GET /api/activity — Paginated activity feed
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<ActivityResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
    const skip = (page - 1) * limit;

    const where: unknown = { ledgerId: user.ledgerId };
    if (type) where.type = type;

    const [events, total] = await prisma.$transaction([
      prisma.activityEvent.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityEvent.count({ where }),
    ]);

    return NextResponse.json<ActivityResponse>({
      success: true,
      events,
      total,
      hasMore: skip + events.length < total,
    });
  } catch (error) {
    console.error("[ACTIVITY GET]", error);
    return NextResponse.json<ActivityResponse>(
      { success: false, error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/activity — Log a new activity event
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<ActivityResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, title, detail, amount, points } = body;

    if (!type || !title) {
      return NextResponse.json<ActivityResponse>(
        { success: false, error: "Activity type and title required" },
        { status: 400 }
      );
    }

    const event = await prisma.activityEvent.create({
      data: {
        ledgerId: user.ledgerId,
        type,
        title,
        detail: detail || "",
        amount: amount ? Number(amount) : null,
        points: points ? Number(points) : null,
      },
    });

    return NextResponse.json<ActivityResponse>(
      {
        success: true,
        events: [event],
        message: "Activity logged",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ACTIVITY POST]", error);
    return NextResponse.json<ActivityResponse>(
      { success: false, error: "Failed to log activity" },
      { status: 500 }
    );
  }
}