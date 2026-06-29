import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createLedgerEntry } from "@/server/accounting/ledger";

type TxClient = Prisma.TransactionClient;

export async function getOrCreateWallet(ledgerId: string) {
  return prisma.wallet.upsert({
    where: { ledgerId },
    update: {},
    create: {
      ledgerId,
      balance: 0,
      lockedBalance: 0,
      currency: "USD",
    },
  });
}

export async function debitWallet(
  tx: TxClient,
  input: {
    walletId: string;
    ledgerId: string;
    amount: number;
    type: string;
    description: string;
    referenceType?: string;
    referenceId?: string;
    idempotencyKey?: string;
  },
) {
  const wallet = await tx.wallet.update({
    where: { id: input.walletId },
    data: { balance: { decrement: input.amount } },
  });

  await createLedgerEntry(tx, {
    ledgerId: input.ledgerId,
    walletId: input.walletId,
    type: input.type,
    direction: "debit",
    amount: input.amount,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    idempotencyKey: input.idempotencyKey,
    description: input.description,
  });

  return wallet;
}

export async function creditWallet(
  tx: TxClient,
  input: {
    walletId: string;
    ledgerId: string;
    amount: number;
    type: string;
    description: string;
    referenceType?: string;
    referenceId?: string;
    idempotencyKey?: string;
  },
) {
  const wallet = await tx.wallet.update({
    where: { id: input.walletId },
    data: { balance: { increment: input.amount } },
  });

  await createLedgerEntry(tx, {
    ledgerId: input.ledgerId,
    walletId: input.walletId,
    type: input.type,
    direction: "credit",
    amount: input.amount,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    idempotencyKey: input.idempotencyKey,
    description: input.description,
  });

  return wallet;
}
