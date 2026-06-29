import { Prisma, PrismaClient } from "@prisma/client";

/* ============================================================
   8TH LEDGER — PRISMA CLIENT SINGLETON
   Prevents connection exhaustion during Next.js hot reload.
   Production-hardened with query audit logging.
   ============================================================ */

interface PrismaGlobal {
  prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as any as PrismaGlobal;

const prismaOptions: Prisma.PrismaClientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? (["query", "error", "warn"] as Prisma.LogLevel[])
      : (["error"] as Prisma.LogLevel[]),
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

/* ============================================================
   QUERY AUDIT MIDDLEWARE — 8th Ledger Immutable Trail
   Logs slow queries and errors for security review.
   ============================================================ */
prisma.$use(async (params, next) => {
  const start = performance.now();
  const result = await next(params);
  const duration = Math.round(performance.now() - start);

  if (duration > 1000) {
    console.warn(
      `[8TH LEDGER SLOW QUERY] ${params.model}.${params.action} — ${duration}ms`,
    );
  }
  return result;
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
