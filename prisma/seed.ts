import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  console.log("Production seed complete: protocol settings initialized.");
}

main()
  .catch((error) => {
    console.error("Production seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

