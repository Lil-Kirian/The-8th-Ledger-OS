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

export async function logSecurityAudit(data: {
  action: string;
  actorId?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  const metadata = {
    ...(data.metadata ?? {}),
    ip: data.ip ?? undefined,
  };

  return createAuditEntry({
    type: data.action,
    description: `${data.action}${data.targetId ? ` on ${data.targetId}` : ""}`,
    txHash: `SEC-${data.action}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ledgerId: data.actorId ?? undefined,
    poolId: undefined,
  }).catch(async () =>
    prisma.auditLog.create({
      data: {
        eventType: data.action,
        description: `${data.action}${data.targetId ? ` on ${data.targetId}` : ""}`,
        ledgerId: data.actorId ?? undefined,
        metadata: JSON.stringify(metadata),
        txHash: `SECLOG-${data.action}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        visibleToPublic: false,
      },
    })
  );
}
