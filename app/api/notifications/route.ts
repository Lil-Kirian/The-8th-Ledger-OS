import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        ledgerId: user.ledgerId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { ledgerId: user.ledgerId, read: false },
    });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("[NOTIFICATIONS GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { ledgerId: user.ledgerId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked read" });
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, ledgerId: user.ledgerId },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "Notification marked read" });
    }

    return NextResponse.json({ success: false, error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error("[NOTIFICATIONS PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}