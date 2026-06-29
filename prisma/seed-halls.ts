import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_HALLS = [
  {
    name: "LedgerProp Hall",
    verticalId: "ledgerprop",
    assetValue: 200000,
    target: 200000,
    listedPrice: 200000,
    trueCost: 100000,
    surplus: 100000,
    country: "UAE",
    emojiSet: "🏠🔑🏗️📐🌇",
    assetType: "Luxury Apartment",
    status: "live",
  },
  {
    name: "LedgerAuto Hall",
    verticalId: "ledgerauto",
    assetValue: 160000,
    target: 160000,
    listedPrice: 160000,
    trueCost: 80000,
    surplus: 80000,
    country: "UAE",
    emojiSet: "🚗🏎️🔋🛞🚦",
    assetType: "Fleet Pool",
    status: "ghost",
  },
  {
    name: "LedgerEdu Hall",
    verticalId: "ledgeredu",
    assetValue: 100000,
    target: 100000,
    listedPrice: 100000,
    trueCost: 50000,
    surplus: 50000,
    country: "UK",
    emojiSet: "📚🎓✏️🏛️🧠",
    assetType: "Campus Block",
    status: "mature",
  },
  {
    name: "LedgerAccess Hall",
    verticalId: "ledgeraccess",
    assetValue: 80000,
    target: 80000,
    listedPrice: 80000,
    trueCost: 40000,
    surplus: 40000,
    country: "Monaco",
    emojiSet: "🎫🔐🎭🥂🎪",
    assetType: "Access Portfolio",
    status: "ghost",
  },
  {
    name: "LedgerHealth Hall",
    verticalId: "ledgerhealth",
    assetValue: 240000,
    target: 240000,
    listedPrice: 240000,
    trueCost: 120000,
    surplus: 120000,
    country: "Germany",
    emojiSet: "🏥💊🩺❤️🧬",
    assetType: "Medical Center",
    status: "live",
  },
  {
    name: "LedgerBiz Hall",
    verticalId: "ledgerbiz",
    assetValue: 180000,
    target: 180000,
    listedPrice: 180000,
    trueCost: 90000,
    surplus: 90000,
    country: "Singapore",
    emojiSet: "💼📈🏢📊🤝",
    assetType: "Office Tower",
    status: "live",
  },
  {
    name: "LedgerTech Hall",
    verticalId: "ledgertech",
    assetValue: 500000,
    target: 500000,
    listedPrice: 500000,
    trueCost: 250000,
    surplus: 250000,
    country: "Germany",
    emojiSet: "💻⚡🖥️🔌🌐",
    assetType: "Data Center",
    status: "mature",
  },
  {
    name: "LedgerTravel Hall",
    verticalId: "ledgertravel",
    assetValue: 1000000,
    target: 1000000,
    listedPrice: 1000000,
    trueCost: 500000,
    surplus: 500000,
    country: "UAE",
    emojiSet: "✈️🛩️🌴🧳🗺️",
    assetType: "Route Portfolio",
    status: "live",
  },
  {
    name: "LedgerAgri Hall",
    verticalId: "ledgeragri",
    assetValue: 150000,
    target: 150000,
    listedPrice: 150000,
    trueCost: 75000,
    surplus: 75000,
    country: "Brazil",
    emojiSet: "🌾🚜🍃🌱🌽",
    assetType: "Farmland Portfolio",
    status: "ghost",
  },
  {
    name: "LedgerEnergy Hall",
    verticalId: "ledgerenergy",
    assetValue: 400000,
    target: 400000,
    listedPrice: 400000,
    trueCost: 200000,
    surplus: 200000,
    country: "Morocco",
    emojiSet: "☀️⚡🔋🌬️♻️",
    assetType: "Solar Farm",
    status: "live",
  },
  {
    name: "LedgerSport Hall",
    verticalId: "ledgersport",
    assetValue: 300000,
    target: 300000,
    listedPrice: 300000,
    trueCost: 150000,
    surplus: 150000,
    country: "USA",
    emojiSet: "⚽🏀🏈⚾🎾",
    assetType: "Sports Complex",
    status: "live",
  },
];

async function main() {
  console.log("🌱 Seeding demo halls...");

  for (const h of DEMO_HALLS) {
    const existing = await prisma.pool.findUnique({
      where: { poolId: h.verticalId },
    });

    if (existing) {
      console.log(`  ⏭️  ${h.name} already exists`);
      continue;
    }

    const pool = await prisma.pool.create({
      data: {
        poolId: h.verticalId,
        verticalId: h.verticalId,
        name: h.name,
        assetValue: h.assetValue,
        target: h.target,
        listedPrice: h.listedPrice,
        trueCost: h.trueCost,
        surplus: h.surplus,
        country: h.country,
        emojiSet: h.emojiSet,
        status: "filling",
        creatorId: "system",
        closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxParticipants: 100,
        minCommitment: 50,
        assetCondition: "new",
        assetType: h.assetType,
      },
    });

    const hall = await prisma.hall.create({
      data: {
        poolId: pool.id,
        name: h.name,
        status: h.status,
        hallClass: "I",
        sriScore: 50,
        ahgiScore: 50,
      },
    });

    await prisma.hallTreasury.create({
      data: {
        hallId: hall.id,
        balance: 0,
      },
    });

    console.log(`  ✅ ${h.name} created (id: ${hall.id})`);
  }

  console.log("✅ Demo halls seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
