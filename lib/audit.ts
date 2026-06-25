import { prisma } from "@/lib/prisma";

/* ============================================================
   8TH LEDGER — AUDIT HELPER
   Auto-links previousHash for immutability.
   Use this in EVERY route that creates an AuditEntry.
   ============================================================ */
export async function createAuditEntry(data: {
  type: string;
  description: string;
  amount?: number;
  txHash: string;
  ledgerId?: string;
  poolId?: string;
}) {
  // Find the most recent entry to chain to
  const lastEntry = await prisma.auditEntry.findFirst({
    orderBy: { timestamp: "desc" },
    select: { txHash: true },
  });

  return prisma.auditEntry.create({
    data: {
      ...data,
      previousHash: lastEntry?.txHash ?? null,
    },
  });
}