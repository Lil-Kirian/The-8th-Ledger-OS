import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getHallClassWorkerRules,
  getWorkerRoster,
  proposeHire,
} from "@/lib/forge";

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
      user.role === "admin" ||
      user.role === "founder" ||
      (await prisma.ownership.findFirst({
        where: { hallId, ledgerId: user.ledgerId, status: "active" },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Hall access denied" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { hallClass: true },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const rules = getHallClassWorkerRules(hall.hallClass);
    const workers = await getWorkerRoster(hallId);
    const showSalaries = user.role === "admin" || rules.showIndividualSalaries;

    return NextResponse.json({
      workers: workers.map((worker) => ({
        ...worker,
        salary: showSalaries ? worker.salary : 0,
      })),
      count: workers.length,
      hallClass: hall.hallClass,
      canProposeHire: rules.canProposeHire,
      canProposeFire: rules.canProposeFire,
      showSalaries,
    });
  } catch (err) {
    console.error("[8th Ledger] Worker roster GET error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}

export async function POST(
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

    if (!ownership && user.role !== "admin" && user.role !== "founder") {
      return NextResponse.json({ error: "Active hall ownership required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const salaryRange = Array.isArray(body.salaryRange) ? body.salaryRange : undefined;
    const salary =
      typeof body.salary === "number"
        ? body.salary
        : salaryRange
          ? Math.round((Number(salaryRange[0]) + Number(salaryRange[1])) / 2)
          : 0;

    if (!body.role || !salary || !body.contractMonths) {
      return NextResponse.json(
        { error: "role, salary or salaryRange, and contractMonths are required" },
        { status: 400 }
      );
    }

    const result = await proposeHire({
      hallId,
      role: String(body.role),
      department: typeof body.department === "string" ? body.department : undefined,
      salary,
      contractMonths: Number(body.contractMonths),
      proposedBy: user.ledgerId,
      justification:
        typeof body.justification === "string"
          ? body.justification
          : typeof body.expectedOutcome === "string"
            ? body.expectedOutcome
            : "Forge worker proposal",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      worker: result.worker,
      proposalId: result.worker?.id,
    });
  } catch (err) {
    console.error("[8th Ledger] Worker roster POST error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}
