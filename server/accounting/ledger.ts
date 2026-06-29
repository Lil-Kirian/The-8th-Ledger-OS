import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Prisma.TransactionClient | PrismaClient;

export type LedgerDirection = "debit" | "credit";

export type LedgerEntryInput = {
  ledgerId: string;
  walletId?: string;
  type: string;
  direction: LedgerDirection;
  amount: number | Prisma.Decimal;
  currency?: string;
  status?: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  description: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createLedgerEntry(tx: TxClient, input: LedgerEntryInput) {
  return tx.ledgerEntry.create({
    data: {
      ledgerId: input.ledgerId,
      walletId: input.walletId,
      type: input.type,
      direction: input.direction,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency || "USD",
      status: input.status || "posted",
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      idempotencyKey: input.idempotencyKey,
      description: input.description,
      metadata: input.metadata,
    },
  });
}
