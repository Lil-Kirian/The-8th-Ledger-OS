import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin, isAdminRole } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";

// GET /api/halls/[id]/ledger
// Returns 8th Ledger updates + hall metadata for the Ledger page
// Owners and admins only
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership or admin role
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id, status: "active" },
      select: { id: true, ownershipPercent: true },
    });

    const isAdmin = isAdminRole(user.role);
    if (!ownership && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch hall metadata + updates
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: {
        id: true,
        name: true,
        hallClass: true,
        sriScore: true,
        ahgiScore: true,
        status: true,
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const updates = await prisma.eighthLedgerUpdate.findMany({
      where: { hallId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalUpdates = await prisma.eighthLedgerUpdate.count({
      where: { hallId },
    });

    return NextResponse.json({
      hallId: hall.id,
      hallName: hall.name,
      hallClass: hall.hallClass,
      sriScore: hall.sriScore,
      ahgiScore: hall.ahgiScore,
      status: hall.status,
      updates,
      totalUpdates,
      isOwner: !!ownership,
      ownershipPercent: ownership?.ownershipPercent ?? 0,
    });
  } catch (err) {
    console.error("[8TH LEDGER API] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/halls/[id]/ledger
// Create a new 8th Ledger update. Admin only.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    const body = await req.json();
    const { type, title, content, amount } = body;

    const validTypes = [
      "INSURANCE_RENEWAL",
      "EMERGENCY_REPAIR",
      "PROPERTY_TAX",
      "PAYROLL_EXECUTED",
      "DYNAMIC_VALUATION",
      "PIR_ADVANCE",
      "MAINTENANCE",
      "COMPLIANCE",
      "ELECTION_CALLED",
      "IMPEACHMENT_INITIATED",
      "CLOSURE_WARNING",
      "CLOSURE_DECISION",
      "CLOSURE_LIQUIDATION",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid update type", validTypes },
        { status: 400 }
      );
    }

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    const update = await prisma.eighthLedgerUpdate.create({
      data: {
        hallId,
        type,
        title: title.trim(),
        content: content.trim(),
        amount: amount || 0,
      },
    });

    await logSecurityAudit({
      action: "LEDGER_UPDATE_CREATED",
      actorId: admin.ledgerId,
      targetId: hallId,
      metadata: { type, title, amount },
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      message: "8th Ledger update recorded",
      update,
    });
  } catch (err) {
    console.error("[8TH LEDGER API] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}