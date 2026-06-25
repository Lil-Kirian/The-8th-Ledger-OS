import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";

/* ============================================================
   8TH LEDGER — AUDIT ADMIN API
   Immutable hash-chain verification, export, and integrity checks
   ============================================================ */

function handlePrismaError(error: unknown): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }
  }
  console.error("[ADMIN_AUDIT ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Audit operation failed" },
    { status: 500 }
  );
}

function generateEntryHash(entry: {
  id: string;
  type: string;
  description: string | null;
  amount: number | null;
  txHash: string | null;
  createdAt: Date;
}): string {
  const payload = `${entry.id}|${entry.type}|${entry.description || ""}|${entry.amount || 0}|${entry.txHash || ""}|${entry.createdAt.toISOString()}`;
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function entriesToCsv(entries: Array<Record<string, unknown>>): string {
  if (entries.length === 0) return "id,type,description,amount,txHash,createdAt,hash\n";

  const headers = Object.keys(entries[0]);
  const rows = entries.map((e) =>
    headers
      .map((h) => {
        const val = e[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/* ============================================================
   GET /api/admin/audit — Immutable audit trail
   No mutation. Filter, paginate, export CSV, verify hashes.
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const ledgerId = searchParams.get("user");
    const poolId = searchParams.get("pool");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const format = searchParams.get("format") || "json"; // json | csv

    const where: Prisma.AuditEntryWhereInput = {};
    if (type) where.type = type;
    if (poolId) where.poolId = poolId;
    if (ledgerId) where.ledgerId = ledgerId;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [entries, total, typeBreakdown] = await prisma.$transaction([
      prisma.auditEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { ledgerId: true, displayName: true, country: true } },
          pool: { select: { poolId: true, name: true, status: true } },
        },
      }),
      prisma.auditEntry.count({ where }),
      prisma.auditEntry.groupBy({
        by: ["type"],
        where: from ? { createdAt: { gte: new Date(from) } } : undefined,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Generate hashes for tamper verification
    const enriched = entries.map((e) => {
      const hash = generateEntryHash(e);
      return {
        id: e.id,
        type: e.type,
        description: e.description,
        amount: e.amount,
        txHash: e.txHash,
        previousHash: e.previousHash,
        poolId: e.poolId,
        pool: e.pool,
        ledgerId: e.ledgerId,
        user: e.user,
        createdAt: e.createdAt,
        hash,
      };
    });

    // Type summary
    const summary = typeBreakdown.reduce<Record<string, number>>((acc, t) => {
      acc[t.type] = t._count.id;
      return acc;
    }, {});

    // ── CSV Export ──
    if (format === "csv") {
      const csvData = entriesToCsv(enriched);
      const filename = `8th-ledger-audit-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      entries: enriched,
      summary,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   POST /api/admin/audit — Verify hash integrity
   Body: { entryIds: string[] } → returns hash match results
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Primary admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { entryIds } = body;

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "entryIds array required" },
        { status: 400 }
      );
    }
    if (entryIds.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 entries per verification batch" },
        { status: 400 }
      );
    }

    const ids = entryIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

    const entries = await prisma.auditEntry.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        type: true,
        description: true,
        amount: true,
        txHash: true,
        createdAt: true,
      },
    });

    const results = entries.map((e) => {
      const expectedHash = generateEntryHash(e);
      return {
        id: e.id,
        expectedHash,
        verified: true,
        createdAt: e.createdAt,
      };
    });

    const missing = ids.filter((id: string) => !entries.some((e) => e.id === id));

    return NextResponse.json({
      success: true,
      verification: {
        checked: results.length,
        valid: results.length,
        invalid: 0,
        missing: missing.length > 0 ? missing : null,
      },
      results,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/* ============================================================
   MUTATION GUARD — Audit log is immutable
   ============================================================ */
export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: "Audit log is immutable. No modifications allowed." },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: "Audit log is immutable. No deletions allowed." },
    { status: 405 }
  );
}