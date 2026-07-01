import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSessionUser, isAdminRole } from "@/lib/auth";
import { executePayroll, getForgeLedgerHistory } from "@/lib/forge";

/* ============================================================
   GET /api/halls/[id]/forge/payroll
   Get payroll history (Forge Ledger records).
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

    const hasAccess =
      isAdminRole(user.role) ||
      (await prisma.ownership.findFirst({
        where: { hallId, ledgerId: user.ledgerId, status: "active" },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const history = await getForgeLedgerHistory(hallId, 12);

    // Get active workers for reference
    const workers = await prisma.worker.findMany({
      where: { hallId },
      select: {
        id: true,
        workerNumber: true,
        role: true,
        status: true,
        salary: true,
      },
      orderBy: { hiredAt: "desc" },
    });

    return NextResponse.json({
      payrollHistory: history,
      workers,
      totalWorkers: workers.length,
      currentMonthlyPayroll: workers
        .filter((w) => w.status === "active" || w.status === "probation")
        .reduce((s, w) => s + w.salary, 0),
    });
  } catch (err) {
    console.error("[8th Ledger] Payroll GET error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

/* ============================================================
   POST /api/halls/[id]/forge/payroll
   Execute payroll (admin only). Uses lib/forge executePayroll.
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

    // Check for duplicate this month
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

    // Execute via lib/forge
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
    console.error("[8th Ledger] Payroll POST error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}