import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireHallAccess, requireAdmin, getSessionUser } from "@/lib/auth";
import {
  getHallClassWorkerRules,
  getForgeLedgerHistory,
  getWorkerRoster,
  getHallStaffingSummary,
  executePayroll,
} from "@/lib/forge";

/* ============================================================
   GET /api/halls/[id]/forge
   Forge Ledger dashboard data.
   ============================================================ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownership = await prisma.ownership.findFirst({
      where: { hallId, ledgerId: user.ledgerId, status: "active" },
    });

    if (!ownership && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: {
        id: true,
        name: true,
        hallClass: true,
        payrollReserve: true,
        sriScore: true,
        ahgiScore: true,
        pirDebt: true,
        status: true,
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const workerRules = getHallClassWorkerRules(hall.hallClass);

    const [forgeLedgers, workers, staffingSummary] = await Promise.all([
      getForgeLedgerHistory(hallId, 12),
      getWorkerRoster(hallId),
      getHallStaffingSummary(hallId),
    ]);

    // Parse entries from JSON strings
    const parsedLedgers = forgeLedgers.map((l) => ({
      ...l,
      entries: l.entries,
    }));

    return NextResponse.json({
      hall,
      workerRules,
      forgeLedgers: parsedLedgers,
      workers,
      staffingSummary,
      canProposeHire: workerRules.canProposeHire,
      canProposeFire: workerRules.canProposeFire,
      showSalaries: workerRules.showIndividualSalaries,
      isAdmin: user.role === "admin" && user.isPrimaryAdmin,
    });
  } catch (err) {
    console.error("[8th Ledger] Forge GET error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

/* ============================================================
   POST /api/halls/[id]/forge
   Execute payroll (admin only). Creates ForgeLedger entry.
   Body: { month?, force?: boolean }
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;

    const admin = await requireAdmin(req);
    if (!admin.success) {
      return NextResponse.json({ error: "Admin authority required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { month, force = false } = body;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        pool: { select: { poolId: true } },
        hallTreasury: true,
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Check if payroll already executed for this month
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const existing = await prisma.forgeLedger.findUnique({
      where: { hallId_month: { hallId, month: targetMonth } },
    });

    if (existing && !force) {
      return NextResponse.json(
        { error: `Payroll already executed for ${targetMonth}. Use force: true to override.` },
        { status: 409 }
      );
    }

    // Execute payroll via lib/forge
    const result = await executePayroll(hallId, admin.ledgerId || admin.userId || "system");

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Payroll executed for ${targetMonth}`,
      forgeLedgerId: result.forgeLedgerId,
      totalPayroll: result.totalPayroll,
      workerCount: result.workerCount,
      hallId,
      month: targetMonth,
    });
  } catch (err) {
    console.error("[8th Ledger] Forge POST error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}