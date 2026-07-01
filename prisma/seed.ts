import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requiredArchitechEnvProvided() {
  return Boolean(
    process.env.SEED_ARCHITECH_EMAIL &&
      process.env.SEED_ARCHITECH_PASSWORD &&
      process.env.SEED_ARCHITECH_LEDGER_ID,
  );
}

async function main() {
  await prisma.protocolSettings.upsert({
    where: { key: "default" },
    update: {},
    create: {
      key: "default",
      platformFee: 0,
      minCommitment: 1,
      maxCommitment: 1000000,
      consensusThreshold: 2,
      publicAudit: true,
    },
  });

  if (requiredArchitechEnvProvided()) {
    const email = process.env.SEED_ARCHITECH_EMAIL!.toLowerCase().trim();
    const ledgerId = process.env.SEED_ARCHITECH_LEDGER_ID!.trim();
    const passwordHash = await bcrypt.hash(process.env.SEED_ARCHITECH_PASSWORD!, 12);

    await prisma.user.upsert({
      where: { ledgerId },
      update: {
        email,
        passwordHash,
        role: "architech",
        isPrimaryAdmin: true,
        kycStatus: "approved",
        kycTier: "whale",
        legalName: process.env.SEED_ARCHITECH_LEGAL_NAME || "8th Ledger Architech",
      },
      create: {
        ledgerId,
        displayName: process.env.SEED_ARCHITECH_DISPLAY_NAME || "8th Ledger Architech",
        legalName: process.env.SEED_ARCHITECH_LEGAL_NAME || "8th Ledger Architech",
        email,
        passwordHash,
        country: process.env.SEED_ARCHITECH_COUNTRY || "Global",
        role: "architech",
        isPrimaryAdmin: true,
        kycStatus: "approved",
        kycTier: "whale",
        trustScore: 1000,
        tier: 10,
        identityScore: 100,
      },
    });

    console.log(`Production seed complete: protocol settings initialized; architech ${ledgerId} upserted.`);
    return;
  }

  console.log("Production seed complete: protocol settings initialized. No architech seed env provided.");
}

main()
  .catch((error) => {
    console.error("Production seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
