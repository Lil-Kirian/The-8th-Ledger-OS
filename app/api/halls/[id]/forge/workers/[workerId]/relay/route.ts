import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { sendRelayMessage, getRelayHistory } from "@/lib/forge";

/* ============================================================
   POST /api/halls/[id]/forge/workers/[workerId]/relay
   Send message through 8th Ledger Relay.
   Body: { content, direction: "hall_to_worker" | "worker_to_hall" }
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  try {
    const { id: hallId, workerId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { content, direction } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    if (!direction || !["hall_to_worker", "worker_to_hall"].includes(direction)) {
      return NextResponse.json(
        { error: "direction must be 'hall_to_worker' or 'worker_to_hall'" },
        { status: 400 }
      );
    }

    // Auth check based on direction
    if (direction === "hall_to_worker") {
      // Must be hall owner or admin
      const hasAccess =
        isAdminRole(user.role) ||
        (await prisma.ownership.findFirst({
          where: { hallId, ledgerId: user.ledgerId, status: "active" },
        }));

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Hall ownership required to message workers" },
          { status: 403 }
        );
      }
    } else {
      // worker_to_hall — must be the worker or admin
      const worker = await prisma.worker.findFirst({
        where: { id: workerId, hallId },
      });

      if (!worker) {
        return NextResponse.json({ error: "Worker not found" }, { status: 404 });
      }

      // In a real Worker Portal, we'd verify worker identity separately.
      // For now, only admin can simulate worker replies.
      if (!isAdminRole(user.role)) {
        return NextResponse.json(
          { error: "Worker replies sent through Worker Portal only" },
          { status: 403 }
        );
      }
    }

    // Send via lib/forge
    const result = await sendRelayMessage({
      hallId,
      workerId,
      direction,
      content: content.trim(),
      loggedBy: user.ledgerId || user.id || "unknown",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.message?.id,
      direction,
      relayedAt: new Date(),
      status: "relayed",
    });
  } catch (err) {
    console.error("[8th Ledger] Relay POST error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

/* ============================================================
   GET /api/halls/[id]/forge/workers/[workerId]/relay
   Get relay conversation history.
   ============================================================ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; workerId: string }> }
) {
  try {
    const { id: hallId, workerId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hall access check
    const hasAccess =
      isAdminRole(user.role) ||
      (await prisma.ownership.findFirst({
        where: { hallId, ledgerId: user.ledgerId, status: "active" },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Hall access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const history = await getRelayHistory(hallId, workerId, limit);

    return NextResponse.json({
      hallId,
      workerId,
      messages: history,
      count: history.length,
      note: "All messages relayed through 8th Ledger. No direct contact permitted.",
    });
  } catch (err) {
    console.error("[8th Ledger] Relay GET error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}
