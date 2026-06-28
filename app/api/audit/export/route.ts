import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import crypto from "crypto";

/* ============================================================
   HASH CHAIN VERIFIER
   Each entry's previousHash must match the prior entry's txHash
   ============================================================ */
function computeEntryHash(entry: any): string {
  const payload = `${entry.timestamp.toISOString()}|${entry.type}|${entry.description}|${entry.amount ?? 0}|${entry.txHash}|${entry.previousHash ?? "genesis"}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function verifyHashChain(entries: any[]): { valid: boolean; brokenAt?: number; total: number } {
  if (entries.length === 0) return { valid: true, total: 0 };

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];

    if (current.previousHash !== previous.txHash) {
      return { valid: false, brokenAt: i, total: sorted.length };
    }
  }

  return { valid: true, total: sorted.length };
}

/* ============================================================
   GET /api/audit/export — Download full audit trail as CSV
   ============================================================ */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json({ error: "Primary admin access only" }, { status: 403 });
    }

    const [entries, treasuryTxs] = await prisma.$transaction([
      prisma.auditEntry.findMany({
        orderBy: { timestamp: "desc" },
        include: { user: { select: { ledgerId: true, displayName: true } } },
      }),
      prisma.treasuryTransaction.findMany({
        orderBy: { timestamp: "desc" },
        include: { pool: { select: { poolId: true, name: true } } },
      }),
    ]);

    const chainStatus = verifyHashChain(entries);

    const lines: string[] = [];

    lines.push(`# 8th Ledger Audit Export`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Hash Chain Status: ${chainStatus.valid ? "VALID" : "BROKEN"} | Entries: ${chainStatus.total}${chainStatus.brokenAt ? ` | Broken at index: ${chainStatus.brokenAt}` : ""}`);
    lines.push(`# SHA-256 Verification: Each entry's previousHash links to the prior entry's txHash`);
    lines.push("");

    lines.push("AUDIT LEDGER");
    lines.push("Timestamp,Type,Description,Amount (USD),TX Hash,Previous Hash,User Ledger ID,User Name,Pool ID,Entry Hash");
    for (const e of entries) {
      const entryHash = computeEntryHash(e);
      lines.push(
        [
          e.timestamp.toISOString(),
          e.type,
          `"${(e.description || "").replace(/"/g, '""')}"`,
          e.amount ?? 0,
          e.txHash,
          e.previousHash ?? "GENESIS",
          e.user?.ledgerId || "PROTOCOL",
          e.user?.displayName || "System",
          e.poolId || "",
          entryHash,
        ].join(",")
      );
    }

    lines.push("");

    lines.push("TREASURY FLOW");
    lines.push("Timestamp,Type,Amount,Currency,Pool,Description,TX Hash,Status");
    for (const t of treasuryTxs) {
      lines.push(
        [
          t.timestamp.toISOString(),
          t.type,
          t.amount,
          t.currency,
          t.pool?.name || "Protocol",
          `"${(t.description || "").replace(/"/g, '""')}"`,
          t.txHash,
          t.status,
        ].join(",")
      );
    }

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="8th-ledger-audit-${Date.now()}.csv"`,
        "X-Audit-Chain-Valid": String(chainStatus.valid),
        "X-Audit-Chain-Total": String(chainStatus.total),
      },
    });
  } catch (error) {
    console.error("[AUDIT EXPORT]", error);
    return NextResponse.json(
      { error: "Failed to generate audit export" },
      { status: 500 }
    );
  }
}