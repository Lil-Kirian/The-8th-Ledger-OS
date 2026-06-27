// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // ═══════════════════════════════════════════════════════════
  // HASHES
  // ═══════════════════════════════════════════════════════════
  const adminHash = await bcrypt.hash("FounderQuantumKey2026!", 12);
  const demoHash = await bcrypt.hash("8thledger2026", 12);

  // ═══════════════════════════════════════════════════════════
  // 1. PRIMARY ADMIN (Original Founder Tier)
  // ═══════════════════════════════════════════════════════════
  const primaryAdmin = await prisma.user.upsert({
    where: { ledgerId: "LED-8X2P-9LQ3" },
    update: {},
    create: {
      ledgerId: "LED-8X2P-9LQ3",
      displayName: "The Architect",
      email: "architect@8thledger.io",
      passwordHash: adminHash,
      country: "Cayman Islands",
      role: "admin",
      isPrimaryAdmin: true,
      trustScore: 1000,
      tier: 10,
      ledgerBalance: 1_000_000,
      creditPool: 1_000_000,
      forgesCompleted: 0,
      referrals: 0,
      totpEnabled: false,
      totpVerified: false,
      totalCommitted: 0,
      kycStatus: "verified",
      kycTier: "whale",
      identityScore: 100,
      isBanned: false,
      lastActivityAt: now,
      lastLoginAt: now,
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=architect8x2p",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 2. DEMO ADMIN (Primary Admin Clone)
  // ═══════════════════════════════════════════════════════════
  const demoAdmin = await prisma.user.upsert({
    where: { ledgerId: "LED-ADMIN-001" },
    update: {},
    create: {
      ledgerId: "LED-ADMIN-001",
      displayName: "The Architect",
      email: "admin@8thledger.io",
      passwordHash: demoHash,
      country: "Cayman Islands",
      role: "admin",
      isPrimaryAdmin: true,
      trustScore: 1000,
      tier: 5,
      ledgerBalance: 5_000_000,
      creditPool: 1_000_000,
      kycStatus: "verified",
      kycTier: "whale",
      identityScore: 100,
      isBanned: false,
      lastActivityAt: now,
      lastLoginAt: now,
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=demoadmin",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 3. DEMO SUB-ADMIN (Lower Tier Admin)
  // ═══════════════════════════════════════════════════════════
  const demoSubAdmin = await prisma.user.upsert({
    where: { ledgerId: "LED-SUBADMIN-001" },
    update: {},
    create: {
      ledgerId: "LED-SUBADMIN-001",
      displayName: "The Warden",
      email: "subadmin@8thledger.io",
      passwordHash: demoHash,
      country: "United Kingdom",
      role: "admin",
      isPrimaryAdmin: false,
      trustScore: 850,
      tier: 4,
      ledgerBalance: 500_000,
      creditPool: 100_000,
      kycStatus: "verified",
      kycTier: "verified",
      identityScore: 85,
      isBanned: false,
      lastActivityAt: now,
      lastLoginAt: now,
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=demosubadmin",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // 4. DEMO USER
  // ═══════════════════════════════════════════════════════════
  const demoUser = await prisma.user.upsert({
    where: { ledgerId: "LED-USER-001" },
    update: {},
    create: {
      ledgerId: "LED-USER-001",
      displayName: "Citizen One",
      email: "demouser@8thledger.io",
      passwordHash: demoHash,
      country: "United States",
      role: "user",
      trustScore: 420,
      tier: 2,
      ledgerBalance: 50_000,
      creditPool: 10_000,
      kycStatus: "verified",
      kycTier: "sovereign",
      identityScore: 42,
      isBanned: false,
      lastActivityAt: now,
      lastLoginAt: now,
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=demouser",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // WALLETS
  // ═══════════════════════════════════════════════════════════
  for (const u of [primaryAdmin, demoAdmin, demoSubAdmin, demoUser]) {
    await prisma.wallet.upsert({
      where: { ledgerId: u.ledgerId },
      update: {},
      create: {
        ledgerId: u.ledgerId,
        balance:
          u.ledgerId === "LED-ADMIN-001"
            ? 5_000_000
            : u.ledgerId === "LED-SUBADMIN-001"
              ? 500_000
              : u.ledgerId === "LED-USER-001"
                ? 50_000
                : 1_000_000,
        lockedBalance: 0,
        currency: "USD",
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // KYC RECORDS
  // ═══════════════════════════════════════════════════════════
  await prisma.kycRecord.upsert({
    where: { userId: primaryAdmin.id },
    update: {},
    create: {
      userId: primaryAdmin.id,
      tier: "whale",
      status: "approved",
      legalName: "The Architect",
      idVerified: true,
      selfieVerified: true,
      livenessPassed: true,
      addressVerified: true,
    },
  });
  await prisma.kycRecord.upsert({
    where: { userId: demoAdmin.id },
    update: {},
    create: {
      userId: demoAdmin.id,
      tier: "whale",
      status: "approved",
      legalName: "Demo Admin",
      idVerified: true,
      selfieVerified: true,
      livenessPassed: true,
      addressVerified: true,
    },
  });
  await prisma.kycRecord.upsert({
    where: { userId: demoSubAdmin.id },
    update: {},
    create: {
      userId: demoSubAdmin.id,
      tier: "verified",
      status: "approved",
      legalName: "Demo Sub-Admin",
      idVerified: true,
      selfieVerified: true,
    },
  });
  await prisma.kycRecord.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      tier: "sovereign",
      status: "approved",
      legalName: "Demo User",
      idVerified: true,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // DEMO POOL 1: LedgerProp Dubai (Class I — Passive)
  // ═══════════════════════════════════════════════════════════
  const demoPool1 = await prisma.pool.upsert({
    where: { poolId: "POOL-LEDGERPROP-001" },
    update: {},
    create: {
      poolId: "POOL-LEDGERPROP-001",
      verticalId: "ledgerprop",
      name: "Sovereign Heights — Dubai Marina",
      description:
        "Luxury 2-bedroom waterfront apartment in Dubai Marina. Full sea view, metro access, premium finishes. Community-managed with absolute transparency. All decisions require 51% capital-weighted approval. Protected by the Protocol Infrastructure Reserve.",
      assetValue: 150000,
      target: 200000,
      trueCost: 100000,
      listedPrice: 150000,
      country: "uae",
      creatorId: demoAdmin.ledgerId,
      status: "filled",
      maxParticipants: 100,
      participants: 3,
      committed: 150000,
      minCommitment: 1,
      maxCommitment: 75000,
      campaignDuration: 30,
      emojiSet: "🏠🌊🌴🔑⚡",
      hallUnlocked: true,
      isVerified: true,
      assetCondition: "new",
      closesAt: new Date("2026-12-31"),
      selectedLocation: "Dubai Marina",
      assetImages: JSON.stringify([
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
      ]),
      documents: JSON.stringify([
        { name: "SPV Certificate", url: "#", type: "pdf", category: "spv" },
        {
          name: "Insurance Policy",
          url: "#",
          type: "pdf",
          category: "insurance",
        },
        { name: "Title Deed", url: "#", type: "pdf", category: "legal" },
      ]),
      assetType: "ledgerprop-residential-apartments",
      revenueSources: JSON.stringify([
        "Monthly rental income",
        "Lease renewal premiums",
        "Parking fees",
        "Storage unit rentals",
        "Utility markups",
      ]),
      hallClass: "I",
      pirAllocation: JSON.stringify({
        shield: 25000,
        seal: 20000,
        forge: 20000,
        spire: 15000,
        vanguard: 12000,
        sanctuary: 8000,
      }),
      assetBookValue: 150000,
      // PHASE 4: IHCP target for future upgrades
      ihcpTarget: 10000,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // DEMO HALL 1: Class I — LedgerProp
  // ═══════════════════════════════════════════════════════════
  const demoHall1 = await prisma.hall.upsert({
    where: { poolId: demoPool1.id },
    update: {},
    create: {
      poolId: demoPool1.id,
      name: "Sovereign Heights Parliament",
      status: "live",
      hallClass: "I",
      sriScore: 87,
      ahgiScore: 72,
      closureStatus: "active",
      pirDebt: 0,
      payrollReserve: 0,
      assetType: "ledgerprop-residential-apartments",
      businessStatus: "operating",
      // PHASE 4: Universal feature flags — Class I defaults disabled
      inventoryEnabled: false,
      forgeEnabled: false,
      ihcpBalance: 0,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 TREASURY
  // ═══════════════════════════════════════════════════════════
  await prisma.hallTreasury.upsert({
    where: { hallId: demoHall1.id },
    update: {},
    create: {
      hallId: demoHall1.id,
      balance: 3600,
      totalRevenue: 4500,
      totalDistributed: 900,
      payrollReserve: 0,
      pirDebt: 0,
      closureReserve: 0,
      monthlyRevenue: 4500,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 MESSAGES
  // ═══════════════════════════════════════════════════════════
  await prisma.hallMessage.createMany({
    data: [
      {
        hallId: demoHall1.id,
        userId: demoAdmin.id,
        content:
          "Welcome to the Sovereign Heights Parliament. This Hall is now LIVE. All decisions require 51% capital-weighted approval. No one is above the vote.",
        type: "system",
        watermarkHash: "system-welcome-001",
      },
      {
        hallId: demoHall1.id,
        userId: demoAdmin.id,
        content:
          "The first proposal is live: Set Monthly Rent at $4,500. Please review and vote. Execution will begin immediately upon passage.",
        type: "system",
        watermarkHash: "system-proposal-001",
      },
      {
        hallId: demoHall1.id,
        userId: demoSubAdmin.id,
        content:
          "Market analysis confirms $4,500 is competitive for Dubai Marina 2BR units. Comparable units rent at $4,200–$4,800. I vote YES.",
        type: "text",
        watermarkHash: "msg-admin-001",
      },
      {
        hallId: demoHall1.id,
        userId: demoUser.id,
        content:
          "First dividend already hit my wallet. This system is unreal. Looking forward to the next acquisition vote.",
        type: "text",
        watermarkHash: "msg-user-001",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 ROLES (Legacy)
  // ═══════════════════════════════════════════════════════════
  await prisma.hallRole.createMany({
    data: [
      {
        hallId: demoHall1.id,
        userId: demoAdmin.id,
        role: "manager",
        electedAt: now,
        expiresAt: new Date("2026-12-31"),
        votesReceived: 5333,
      },
      {
        hallId: demoHall1.id,
        userId: demoSubAdmin.id,
        role: "liaison",
        electedAt: now,
        expiresAt: new Date("2026-12-31"),
        votesReceived: 1667,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 EXECUTIVE CABINET
  // ═══════════════════════════════════════════════════════════
  await prisma.executiveCabinet.upsert({
    where: { hallId: demoHall1.id },
    update: {},
    create: {
      hallId: demoHall1.id,
      speakerId: demoAdmin.id,
      treasurerId: demoSubAdmin.id,
      wardenId: demoSubAdmin.id,
      scribeId: demoUser.id,
      electedAt: now,
      expiresAt: new Date("2026-12-31"),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 OWNERSHIPS (PACs)
  // ═══════════════════════════════════════════════════════════
  await prisma.ownership.createMany({
    data: [
      {
        poolId: demoPool1.id,
        userId: demoAdmin.id,
        hallId: demoHall1.id,
        amountCommitted: 50000,
        ownershipPercent: 33.33,
        pacToken: "PAC-ADMIN-001",
        status: "active",
        role: "manager",
        isWinner: true,
        inviteCodesRemaining: 3,
        inviteCodesUsed: 0,
        dynamicValue: 2930,
        accumulatedDividends: 180,
        pirDebt: 0,
        ledgerId: demoAdmin.ledgerId,
      },
      {
        poolId: demoPool1.id,
        userId: demoSubAdmin.id,
        hallId: demoHall1.id,
        amountCommitted: 25000,
        ownershipPercent: 16.67,
        pacToken: "PAC-SUBADMIN-001",
        status: "active",
        role: "liaison",
        isWinner: true,
        inviteCodesRemaining: 3,
        inviteCodesUsed: 0,
        dynamicValue: 2930,
        accumulatedDividends: 90,
        pirDebt: 0,
        ledgerId: demoSubAdmin.ledgerId,
      },
      {
        poolId: demoPool1.id,
        userId: demoUser.id,
        hallId: demoHall1.id,
        amountCommitted: 5000,
        ownershipPercent: 3.33,
        pacToken: "PAC-USER-001",
        status: "active",
        isWinner: true,
        inviteCodesRemaining: 3,
        inviteCodesUsed: 0,
        dynamicValue: 2930,
        accumulatedDividends: 18,
        pirDebt: 0,
        ledgerId: demoUser.ledgerId,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 PROPOSAL + VOTES
  // ═══════════════════════════════════════════════════════════
  const proposal1 = await prisma.proposal.create({
    data: {
      poolId: demoPool1.id,
      hallId: demoHall1.id,
      proposerId: demoAdmin.id,
      title: "Set Monthly Rent at $4,500 USD",
      description:
        "Based on Q2 2026 market analysis for Dubai Marina 2BR units, we recommend setting the monthly rent at $4,500 USD. This generates $3,600 net community revenue after the 20% 8th Ledger Tithe ($900). Projected annual community net: $43,200. Tenant profile: corporate expat family, 12-month lease.",
      type: "rent_change",
      amount: 4500,
      status: "passed",
      voteWeightYes: 53.33,
      voteCountYes: 2,
      voteWeightNo: 0,
      voteCountNo: 0,
      thresholdPercent: 51,
      passedAt: now,
      executedAt: now,
      executionStatus: "completed",
      executionResult:
        "Rent successfully set to $4,500/month. Tenant screening criteria approved. Corporate marketing initiated. First revenue collection scheduled for July 1, 2026.",
      endsAt: new Date("2026-12-31"),
    },
  });

  await prisma.vote.createMany({
    data: [
      {
        proposalId: proposal1.id,
        userId: demoAdmin.id,
        weight: 33.33,
        choice: "yes",
      },
      {
        proposalId: proposal1.id,
        userId: demoSubAdmin.id,
        weight: 16.67,
        choice: "yes",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 REVENUE LOG
  // ═══════════════════════════════════════════════════════════
  await prisma.revenueLog.create({
    data: {
      poolId: demoPool1.id,
      amount: 4500,
      source: "rent",
      ledgerFee: 900,
      communityNet: 3600,
      distributed: true,
      distributionTx: "TX-REV-001",
      payrollDeducted: 0,
      netAfterPayroll: 3600,
      businessSource: "monthly_rent",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 ACTIVITIES
  // ═══════════════════════════════════════════════════════════
  await prisma.hallActivity.createMany({
    data: [
      {
        hallId: demoHall1.id,
        userId: demoAdmin.id,
        type: "proposal",
        description: "Proposal created: Set Monthly Rent at $4,500",
      },
      {
        hallId: demoHall1.id,
        userId: demoAdmin.id,
        type: "vote",
        description: "Vote cast: YES (33.33% weight)",
      },
      {
        hallId: demoHall1.id,
        userId: demoSubAdmin.id,
        type: "vote",
        description: "Vote cast: YES (16.67% weight)",
      },
      {
        hallId: demoHall1.id,
        type: "dividend",
        description: "First dividend distributed: $3,600 community net",
      },
      {
        hallId: demoHall1.id,
        userId: demoAdmin.id,
        type: "join",
        description: "Hall activated by admin",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 LOCATION OPTIONS
  // ═══════════════════════════════════════════════════════════
  await prisma.locationOption.createMany({
    data: [
      {
        poolId: demoPool1.id,
        hallId: demoHall1.id,
        name: "Dubai Marina",
        address: "Dubai Marina, UAE",
        lat: 25.2048,
        lng: 55.2708,
        cost: 150000,
        description: "Prime waterfront with metro access and yacht club",
        votes: 2,
        voteWeight: 53.33,
        isSelected: true,
      },
      {
        poolId: demoPool1.id,
        hallId: demoHall1.id,
        name: "Palm Jumeirah",
        address: "Palm Jumeirah, Dubai",
        lat: 25.1124,
        lng: 55.139,
        cost: 180000,
        description: "Ultra-luxury island living with private beach access",
        votes: 1,
        voteWeight: 16.67,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 MARKETPLACE ITEM
  // ═══════════════════════════════════════════════════════════
  await prisma.marketplaceItem.create({
    data: {
      poolId: demoPool1.id,
      hallId: demoHall1.id,
      title: "Sovereign Heights — Short-Term Rental Week",
      description:
        "Book a full week at Sovereign Heights Dubai Marina. All proceeds flow directly to the Hall treasury and split by ownership %. Includes concierge, cleaning, and airport transfer.",
      price: 1200,
      quantity: 4,
      quantitySold: 1,
      status: "active",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 PIR ALLOCATIONS
  // ═══════════════════════════════════════════════════════════
  await prisma.pirAllocation.createMany({
    data: [
      {
        hallId: demoHall1.id,
        pillar: "shield",
        amount: 25000,
        purpose:
          "Lloyd's insurance coverage, casualty, liability, force majeure",
        spent: 1500,
      },
      {
        hallId: demoHall1.id,
        pillar: "seal",
        amount: 20000,
        purpose:
          "Entity registration, operating agreements, beneficial interest documents",
        spent: 5000,
      },
      {
        hallId: demoHall1.id,
        pillar: "forge",
        amount: 20000,
        purpose: "Repairs, upkeep, vendor contracts, management fees",
        spent: 0,
      },
      {
        hallId: demoHall1.id,
        pillar: "spire",
        amount: 15000,
        purpose: "Protocol development, infrastructure, API, audits",
        spent: 3000,
      },
      {
        hallId: demoHall1.id,
        pillar: "vanguard",
        amount: 12000,
        purpose: "New vertical R&D, geographic expansion, ecosystem grants",
        spent: 0,
      },
      {
        hallId: demoHall1.id,
        pillar: "sanctuary",
        amount: 8000,
        purpose:
          "Vacancy coverage, dividend smoothing, market downturn, closure protection",
        spent: 0,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 SRI SNAPSHOT
  // ═══════════════════════════════════════════════════════════
  await prisma.sriSnapshot.create({
    data: {
      hallId: demoHall1.id,
      score: 87,
      governanceActivity: 92,
      revenueConsistency: 85,
      dividendReliability: 90,
      proposalQuality: 78,
      dormancyRate: 65,
      marketplaceVelocity: 95,
      recordedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 AHGI SNAPSHOT
  // ═══════════════════════════════════════════════════════════
  await prisma.ahgiSnapshot.create({
    data: {
      hallId: demoHall1.id,
      score: 72,
      healthMetrics: JSON.stringify({
        occupancy: 95,
        maintenanceBacklog: 2,
        tenantSatisfaction: 88,
      }),
      growthMetrics: JSON.stringify({
        propertyValueIndex: 108,
        rentGrowthYoY: 5,
        appreciation: 3,
      }),
      recordedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 DYNAMIC VALUATION
  // ═══════════════════════════════════════════════════════════
  await prisma.dynamicValuation.create({
    data: {
      hallId: demoHall1.id,
      assetBookValue: 250000,
      accumulatedDividendsPerPercent: 180,
      ahgiPremium: 220,
      sriBonus: 30,
      pirDebtPerPercent: 0,
      valuePerPercent: 2930,
      calculatedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 FORGE LEDGER (Class I — Vendor Contracts Only)
  // ═══════════════════════════════════════════════════════════
  await prisma.forgeLedger.create({
    data: {
      hallId: demoHall1.id,
      month: "2026-06",
      totalPayroll: 0,
      workerCount: 0,
      entries: JSON.stringify([
        {
          type: "vendor_contract",
          vendor: "Dubai Property Management Ltd",
          cost: 1500,
          description: "Monthly property management fee",
        },
        {
          type: "vendor_contract",
          vendor: "CleanCo Dubai",
          cost: 400,
          description: "Bi-weekly cleaning service",
        },
      ]),
      businessRevenue: 0,
      costOfGoodsSold: 0,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 1 8TH LEDGER UPDATES
  // ═══════════════════════════════════════════════════════════
  await prisma.eighthLedgerUpdate.createMany({
    data: [
      {
        hallId: demoHall1.id,
        type: "insurance",
        title: "Insurance Renewal",
        content:
          "Policy #2847 renewed. 12 months. Lloyd's of London. No action required.",
        amount: 25000,
      },
      {
        hallId: demoHall1.id,
        type: "maintenance",
        title: "Property Tax Paid",
        content: "Annual tax: $3,200. Receipt attached. No action required.",
        amount: 3200,
      },
      {
        hallId: demoHall1.id,
        type: "valuation",
        title: "Dynamic Valuation Update",
        content:
          "Asset book value increased 8% this quarter. Driven by: rent increase (+5%), property appreciation (+3%).",
        amount: 20000,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // DEMO POOL 2: LedgerBiz Nairobi (Class III — Active)
  // ═══════════════════════════════════════════════════════════
  const demoPool2 = await prisma.pool.upsert({
    where: { poolId: "POOL-LEDGERBIZ-001" },
    update: {},
    create: {
      poolId: "POOL-LEDGERBIZ-001",
      verticalId: "ledgerbiz",
      name: "MetroMart Supermarket — Nairobi",
      description:
        "Full-service grocery supermarket in Nairobi Westlands. 2,500 sq ft. Daily inventory turnover. Multi-department staffing with direct 8th Ledger payroll. Class III Active Operation — hall governs inventory orders, pricing, marketing, and staffing levels.",
      assetValue: 80000,
      target: 160000,
      trueCost: 80000,
      listedPrice: 80000,
      country: "kenya",
      creatorId: demoAdmin.ledgerId,
      status: "filled",
      maxParticipants: 50,
      participants: 3,
      committed: 80000,
      minCommitment: 1,
      maxCommitment: 40000,
      campaignDuration: 30,
      emojiSet: "🏪🛒🍞🥩🥛",
      hallUnlocked: true,
      isVerified: true,
      assetCondition: "new",
      closesAt: new Date("2026-12-31"),
      selectedLocation: "Nairobi Westlands",
      assetImages: JSON.stringify([
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200",
        "https://images.unsplash.com/photo-1604719312566-8912f9c0353f?w=1200",
      ]),
      documents: JSON.stringify([
        {
          name: "Business License",
          url: "#",
          type: "pdf",
          category: "compliance",
        },
        {
          name: "Health Inspection",
          url: "#",
          type: "pdf",
          category: "compliance",
        },
        { name: "Lease Agreement", url: "#", type: "pdf", category: "legal" },
      ]),
      assetType: "ledgerbiz-supermarket",
      revenueSources: JSON.stringify([
        "Daily sales margin",
        "Private label product sales",
        "Supplier slotting fees",
        "Delivery service fees",
        "Pharmacy dispensing",
      ]),
      hallClass: "III",
      pirAllocation: JSON.stringify({
        shield: 20000,
        seal: 16000,
        forge: 16000,
        spire: 12000,
        vanguard: 9600,
        sanctuary: 6400,
      }),
      assetBookValue: 80000,
      // PHASE 4: IHCP target for active operations
      ihcpTarget: 20000,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // DEMO HALL 2: Class III — LedgerBiz (Active Operation)
  // ═══════════════════════════════════════════════════════════
  const demoHall2 = await prisma.hall.upsert({
    where: { poolId: demoPool2.id },
    update: {},
    create: {
      poolId: demoPool2.id,
      name: "MetroMart Operations Parliament",
      status: "live",
      hallClass: "III",
      sriScore: 78,
      ahgiScore: 65,
      closureStatus: "active",
      pirDebt: 0,
      payrollReserve: 5000,
      assetType: "ledgerbiz-supermarket",
      businessStatus: "operating",
      // PHASE 4: Universal feature flags — Class III has inventory + forge enabled
      inventoryEnabled: true,
      forgeEnabled: true,
      ihcpBalance: 5000,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 TREASURY
  // ═══════════════════════════════════════════════════════════
  await prisma.hallTreasury.upsert({
    where: { hallId: demoHall2.id },
    update: {},
    create: {
      hallId: demoHall2.id,
      balance: 8850,
      totalRevenue: 15000,
      totalDistributed: 3150,
      payrollReserve: 5000,
      pirDebt: 0,
      closureReserve: 0,
      monthlyRevenue: 15000,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 EXECUTIVE CABINET
  // ═══════════════════════════════════════════════════════════
  await prisma.executiveCabinet.upsert({
    where: { hallId: demoHall2.id },
    update: {},
    create: {
      hallId: demoHall2.id,
      speakerId: demoAdmin.id,
      treasurerId: demoSubAdmin.id,
      wardenId: demoUser.id,
      scribeId: demoUser.id,
      electedAt: now,
      expiresAt: new Date("2026-12-31"),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 OWNERSHIPS
  // ═══════════════════════════════════════════════════════════
  const ownership2Admin = await prisma.ownership.create({
    data: {
      poolId: demoPool2.id,
      userId: demoAdmin.id,
      hallId: demoHall2.id,
      amountCommitted: 40000,
      ownershipPercent: 50.0,
      pacToken: "PAC-ADMIN-002",
      status: "active",
      isWinner: true,
      inviteCodesRemaining: 3,
      inviteCodesUsed: 0,
      dynamicValue: 1200,
      accumulatedDividends: 450,
      pirDebt: 0,
      ledgerId: demoAdmin.ledgerId,
    },
  });

  const ownership2Sub = await prisma.ownership.create({
    data: {
      poolId: demoPool2.id,
      userId: demoSubAdmin.id,
      hallId: demoHall2.id,
      amountCommitted: 20000,
      ownershipPercent: 25.0,
      pacToken: "PAC-SUBADMIN-002",
      status: "active",
      isWinner: true,
      inviteCodesRemaining: 3,
      inviteCodesUsed: 0,
      dynamicValue: 1200,
      accumulatedDividends: 225,
      pirDebt: 0,
      ledgerId: demoSubAdmin.ledgerId,
    },
  });

  await prisma.ownership.create({
    data: {
      poolId: demoPool2.id,
      userId: demoUser.id,
      hallId: demoHall2.id,
      amountCommitted: 10000,
      ownershipPercent: 12.5,
      pacToken: "PAC-USER-002",
      status: "active",
      isWinner: true,
      inviteCodesRemaining: 3,
      inviteCodesUsed: 0,
      dynamicValue: 1200,
      accumulatedDividends: 112,
      pirDebt: 0,
      ledgerId: demoUser.ledgerId,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 WORKERS (Class III — Full Staff)
  // ═══════════════════════════════════════════════════════════
  const worker1 = await prisma.worker.create({
    data: {
      hallId: demoHall2.id,
      workerNumber: `W-${demoHall2.id.slice(-4)}-001`,
      role: "Store Manager",
      salary: 1500,
      contractMonths: 12,
      hiredAt: new Date("2026-03-01"),
      status: "active",
      performanceScore: 88,
      shiftSchedule: JSON.stringify({
        mon: "08:00-18:00",
        tue: "08:00-18:00",
        wed: "08:00-18:00",
        thu: "08:00-18:00",
        fri: "08:00-18:00",
        sat: "09:00-15:00",
        sun: "off",
      }),
      department: "Admin",
    },
  });

  const worker2 = await prisma.worker.create({
    data: {
      hallId: demoHall2.id,
      workerNumber: `W-${demoHall2.id.slice(-4)}-002`,
      role: "Cashier",
      salary: 600,
      contractMonths: 12,
      hiredAt: new Date("2026-04-15"),
      status: "active",
      performanceScore: 75,
      shiftSchedule: JSON.stringify({
        mon: "07:00-15:00",
        tue: "07:00-15:00",
        wed: "off",
        thu: "07:00-15:00",
        fri: "07:00-15:00",
        sat: "08:00-16:00",
        sun: "off",
      }),
      department: "Floor",
    },
  });

  const worker3 = await prisma.worker.create({
    data: {
      hallId: demoHall2.id,
      workerNumber: `W-${demoHall2.id.slice(-4)}-003`,
      role: "Stocker",
      salary: 500,
      contractMonths: 6,
      hiredAt: new Date("2026-05-01"),
      status: "active",
      performanceScore: 82,
      shiftSchedule: JSON.stringify({
        mon: "06:00-14:00",
        tue: "06:00-14:00",
        wed: "06:00-14:00",
        thu: "off",
        fri: "06:00-14:00",
        sat: "06:00-14:00",
        sun: "off",
      }),
      department: "Floor",
    },
  });

  const worker4 = await prisma.worker.create({
    data: {
      hallId: demoHall2.id,
      workerNumber: `W-${demoHall2.id.slice(-4)}-004`,
      role: "Butcher",
      salary: 800,
      contractMonths: 12,
      hiredAt: new Date("2026-03-15"),
      status: "active",
      performanceScore: 91,
      shiftSchedule: JSON.stringify({
        mon: "07:00-15:00",
        tue: "07:00-15:00",
        wed: "07:00-15:00",
        thu: "07:00-15:00",
        fri: "07:00-15:00",
        sat: "07:00-13:00",
        sun: "off",
      }),
      department: "Kitchen",
    },
  });

  const worker5 = await prisma.worker.create({
    data: {
      hallId: demoHall2.id,
      workerNumber: `W-${demoHall2.id.slice(-4)}-005`,
      role: "Baker",
      salary: 750,
      contractMonths: 12,
      hiredAt: new Date("2026-04-01"),
      status: "probation",
      performanceScore: 68,
      shiftSchedule: JSON.stringify({
        mon: "04:00-12:00",
        tue: "04:00-12:00",
        wed: "04:00-12:00",
        thu: "04:00-12:00",
        fri: "04:00-12:00",
        sat: "05:00-13:00",
        sun: "off",
      }),
      department: "Kitchen",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 WORKER PERFORMANCES
  // ═══════════════════════════════════════════════════════════
  await prisma.workerPerformance.createMany({
    data: [
      {
        workerId: worker1.id,
        score: 88,
        metrics: JSON.stringify({
          attendance: 98,
          salesTarget: 105,
          customerComplaints: 0,
          inventoryAccuracy: 96,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Continue current performance. Consider leadership training for regional expansion.",
      },
      {
        workerId: worker2.id,
        score: 75,
        metrics: JSON.stringify({
          attendance: 92,
          transactionSpeed: 85,
          cashAccuracy: 99,
          customerRating: 78,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Attend customer service workshop. Reduce checkout time by 15%.",
      },
      {
        workerId: worker3.id,
        score: 82,
        metrics: JSON.stringify({
          attendance: 96,
          restockSpeed: 90,
          shelfOrganization: 88,
          damageRate: 2,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan: "Maintain standards. Cross-train on produce handling.",
      },
      {
        workerId: worker4.id,
        score: 91,
        metrics: JSON.stringify({
          attendance: 99,
          meatYield: 97,
          customerSatisfaction: 94,
          wasteRate: 3,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Exceeds expectations. Eligible for senior butcher promotion.",
      },
      {
        workerId: worker5.id,
        score: 68,
        metrics: JSON.stringify({
          attendance: 85,
          productConsistency: 72,
          onTimeDelivery: 90,
          wasteRate: 8,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "30-day probation extension. Must improve consistency and reduce waste by 50%.",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 RELAY MESSAGES
  // ═══════════════════════════════════════════════════════════
  await prisma.relayMessage.createMany({
    data: [
      {
        hallId: demoHall2.id,
        workerId: worker1.id,
        direction: "hall_to_worker",
        content:
          "Please prioritize restocking dairy section before morning rush. Supplier delivery delayed 2 hours.",
        relayedAt: now,
        status: "relayed",
        loggedBy: demoAdmin.ledgerId,
      },
      {
        hallId: demoHall2.id,
        workerId: worker1.id,
        direction: "worker_to_hall",
        content:
          "Understood. I have shifted the stocker to dairy. ETA: 07:30 AM fully restocked.",
        relayedAt: new Date(now.getTime() + 15 * 60000),
        status: "relayed",
        loggedBy: "SYSTEM",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 FORGE LEDGER (Class III — Full Payroll + COGS)
  // ═══════════════════════════════════════════════════════════
  await prisma.forgeLedger.create({
    data: {
      hallId: demoHall2.id,
      month: "2026-06",
      totalPayroll: 4150,
      workerCount: 5,
      entries: JSON.stringify([
        {
          workerId: worker1.id,
          workerNumber: worker1.workerNumber,
          role: "Store Manager",
          salary: 1500,
          status: "paid",
        },
        {
          workerId: worker2.id,
          workerNumber: worker2.workerNumber,
          role: "Cashier",
          salary: 600,
          status: "paid",
        },
        {
          workerId: worker3.id,
          workerNumber: worker3.workerNumber,
          role: "Stocker",
          salary: 500,
          status: "paid",
        },
        {
          workerId: worker4.id,
          workerNumber: worker4.workerNumber,
          role: "Butcher",
          salary: 800,
          status: "paid",
        },
        {
          workerId: worker5.id,
          workerNumber: worker5.workerNumber,
          role: "Baker",
          salary: 750,
          status: "pending_review",
        },
      ]),
      businessRevenue: 15000,
      costOfGoodsSold: 8500,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 INVENTORY ITEMS (Class III — Business Stock)
  // ═══════════════════════════════════════════════════════════
  const inventory1 = await prisma.inventoryItem.create({
    data: {
      hallId: demoHall2.id,
      title: "Premium Basmati Rice (5kg)",
      description: "Imported premium basmati rice. High turnover staple.",
      price: 8,
      quantity: 240,
      quantitySold: 60,
      status: "active",
      listedAt: now,
      costOfGoods: 5,
      reorderThreshold: 50,
    },
  });

  const inventory2 = await prisma.inventoryItem.create({
    data: {
      hallId: demoHall2.id,
      title: "Fresh Whole Milk (1L)",
      description: "Locally sourced whole milk. Daily delivery.",
      price: 2,
      quantity: 500,
      quantitySold: 180,
      status: "active",
      listedAt: now,
      costOfGoods: 1,
      reorderThreshold: 100,
    },
  });

  const inventory3 = await prisma.inventoryItem.create({
    data: {
      hallId: demoHall2.id,
      title: "Basic Smartphone (Entry Level)",
      description:
        "Budget smartphone for local market. Electronics department.",
      price: 120,
      quantity: 24,
      quantitySold: 6,
      status: "active",
      listedAt: now,
      costOfGoods: 85,
      reorderThreshold: 5,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 INVENTORY ORDERS
  // ═══════════════════════════════════════════════════════════
  await prisma.inventoryOrder.create({
    data: {
      inventoryId: inventory1.id,
      buyerId: demoUser.id,
      amount: 16,
      quantity: 2,
      status: "completed",
      escrowReleasedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      completedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 OWNERSHIP LISTINGS (PAC Trading — 48h Escrow)
  // ═══════════════════════════════════════════════════════════
  await prisma.ownershipListing.create({
    data: {
      ownershipId: ownership2Sub.id,
      hallId: demoHall2.id,
      sellerId: demoSubAdmin.id,
      percentListed: 5.0,
      pricePerPercent: 1500,
      totalPrice: 7500,
      floorPrice: 1200,
      status: "active",
      listedAt: now,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 REVENUE LOG (With Business Source)
  // ═══════════════════════════════════════════════════════════
  await prisma.revenueLog.create({
    data: {
      poolId: demoPool2.id,
      amount: 15000,
      source: "daily_sales",
      ledgerFee: 3000,
      communityNet: 12000,
      distributed: true,
      distributionTx: "TX-REV-BIZ-001",
      payrollDeducted: 4150,
      netAfterPayroll: 7850,
      businessSource: "daily_sales",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 8TH LEDGER UPDATES
  // ═══════════════════════════════════════════════════════════
  await prisma.eighthLedgerUpdate.createMany({
    data: [
      {
        hallId: demoHall2.id,
        type: "payroll",
        title: "Payroll Executed",
        content:
          "5 workers paid via 8th Ledger Payroll System. Total: $4,150. Performance review scheduled for W-0002-005 (Baker — probation).",
        amount: 4150,
      },
      {
        hallId: demoHall2.id,
        type: "inventory",
        title: "Inventory Alert: Rice",
        content:
          "Premium Basmati Rice at 75% stock. Reorder threshold (50 units) will trigger in 4 days. Hall vote required for supplier change.",
        amount: 0,
      },
      {
        hallId: demoHall2.id,
        type: "valuation",
        title: "Dynamic Valuation Update",
        content:
          "MetroMart asset book value stable. Daily revenue consistent. AHGI: 65 (Stagnant — improvement plan recommended).",
        amount: 80000,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 SRI SNAPSHOT
  // ═══════════════════════════════════════════════════════════
  await prisma.sriSnapshot.create({
    data: {
      hallId: demoHall2.id,
      score: 78,
      governanceActivity: 85,
      revenueConsistency: 72,
      dividendReliability: 80,
      proposalQuality: 70,
      dormancyRate: 55,
      marketplaceVelocity: 88,
      recordedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 AHGI SNAPSHOT
  // ═══════════════════════════════════════════════════════════
  await prisma.ahgiSnapshot.create({
    data: {
      hallId: demoHall2.id,
      score: 65,
      healthMetrics: JSON.stringify({
        dailyRevenueConsistency: 82,
        customerRetention: 74,
        staffTurnover: 15,
      }),
      growthMetrics: JSON.stringify({
        revenueGrowth: 3,
        locationValueIndex: 105,
        expansionPotential: 60,
      }),
      recordedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 DYNAMIC VALUATION
  // ═══════════════════════════════════════════════════════════
  await prisma.dynamicValuation.create({
    data: {
      hallId: demoHall2.id,
      assetBookValue: 80000,
      accumulatedDividendsPerPercent: 45,
      ahgiPremium: 150,
      sriBonus: 30,
      pirDebtPerPercent: 0,
      valuePerPercent: 1025,
      calculatedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 PIR ALLOCATIONS
  // ═══════════════════════════════════════════════════════════
  await prisma.pirAllocation.createMany({
    data: [
      {
        hallId: demoHall2.id,
        pillar: "shield",
        amount: 20000,
        purpose:
          "Business insurance, liability, worker compensation, product recall",
        spent: 2500,
      },
      {
        hallId: demoHall2.id,
        pillar: "seal",
        amount: 16000,
        purpose: "Business registration, operating license, tax compliance",
        spent: 6000,
      },
      {
        hallId: demoHall2.id,
        pillar: "forge",
        amount: 16000,
        purpose: "Equipment repair, refrigeration maintenance, facility upkeep",
        spent: 3200,
      },
      {
        hallId: demoHall2.id,
        pillar: "spire",
        amount: 12000,
        purpose: "POS system upgrades, inventory management software, security",
        spent: 4500,
      },
      {
        hallId: demoHall2.id,
        pillar: "vanguard",
        amount: 9600,
        purpose: "Second location scouting, private label product R&D",
        spent: 0,
      },
      {
        hallId: demoHall2.id,
        pillar: "sanctuary",
        amount: 6400,
        purpose:
          "Slow season reserve, emergency stock, payroll shortfall coverage",
        spent: 800,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 2 ACTIVITIES
  // ═══════════════════════════════════════════════════════════
  await prisma.hallActivity.createMany({
    data: [
      {
        hallId: demoHall2.id,
        userId: demoAdmin.id,
        type: "proposal",
        description: "Proposal passed: Hire Baker (probationary)",
      },
      {
        hallId: demoHall2.id,
        userId: demoAdmin.id,
        type: "vote",
        description: "Vote cast: YES (50% weight)",
      },
      {
        hallId: demoHall2.id,
        userId: demoSubAdmin.id,
        type: "vote",
        description: "Vote cast: YES (25% weight)",
      },
      {
        hallId: demoHall2.id,
        type: "dividend",
        description: "Weekly dividend distributed: $7,850 net after payroll",
      },
      {
        hallId: demoHall2.id,
        type: "inventory",
        description:
          "Stock order approved: 500kg rice, 200L milk, 12 smartphones",
      },
      {
        hallId: demoHall2.id,
        userId: demoAdmin.id,
        type: "join",
        description: "MetroMart Operations Parliament activated",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // PHASE 4: HALL 2 IHCP (Internal Hall Contribution Pool)
  // ═══════════════════════════════════════════════════════════
  await prisma.hallContribution.createMany({
    data: [
      {
        hallId: demoHall2.id,
        ledgerId: demoAdmin.ledgerId,
        amount: 3000,
        purpose: "payroll",
        repaidAmount: 1500,
        status: "active",
      },
      {
        hallId: demoHall2.id,
        ledgerId: demoSubAdmin.ledgerId,
        amount: 2000,
        purpose: "inventory",
        repaidAmount: 800,
        status: "active",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // DEMO POOL 3: LedgerSport Manchester (Class III — Active)
  // ═══════════════════════════════════════════════════════════
  const demoPool3 = await prisma.pool.upsert({
    where: { poolId: "POOL-LEDGERSPORT-001" },
    update: {},
    create: {
      poolId: "POOL-LEDGERSPORT-001",
      verticalId: "ledgersport",
      name: "Manchester Lions FC — Training Academy",
      description:
        "Semi-professional football club and youth training academy in Manchester. 3,000-seat stadium, 5 training pitches, gym, and physiotherapy center. Class III Active Operation — hall governs player recruitment, merchandise pricing, match-day operations, and sponsorship strategy.",
      assetValue: 120000,
      target: 240000,
      trueCost: 120000,
      listedPrice: 120000,
      country: "united kingdom",
      creatorId: demoAdmin.ledgerId,
      status: "filled",
      maxParticipants: 150,
      participants: 3,
      committed: 120000,
      minCommitment: 1,
      maxCommitment: 60000,
      campaignDuration: 45,
      emojiSet: "🏆⚽🏟️🦁⚡",
      hallUnlocked: true,
      isVerified: true,
      assetCondition: "new",
      closesAt: new Date("2026-12-31"),
      selectedLocation: "Manchester, UK",
      assetImages: JSON.stringify([
        "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1200",
        "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=1200",
      ]),
      documents: JSON.stringify([
        { name: "Club Registration", url: "#", type: "pdf", category: "legal" },
        { name: "FA License", url: "#", type: "pdf", category: "compliance" },
        { name: "Stadium Lease", url: "#", type: "pdf", category: "legal" },
      ]),
      assetType: "ledgersport-football-club",
      revenueSources: JSON.stringify([
        "Match day ticket sales",
        "Merchandise and kit sales",
        "Sponsorship and advertising",
        "Youth academy training fees",
        "Stadium hospitality and catering",
      ]),
      hallClass: "III",
      pirAllocation: JSON.stringify({
        shield: 30000,
        seal: 20000,
        forge: 20000,
        spire: 12000,
        vanguard: 10000,
        sanctuary: 8000,
      }),
      assetBookValue: 120000,
      ihcpTarget: 25000,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // DEMO HALL 3: Class III — LedgerSport (Active Operation)
  // ═══════════════════════════════════════════════════════════
  const demoHall3 = await prisma.hall.upsert({
    where: { poolId: demoPool3.id },
    update: {},
    create: {
      poolId: demoPool3.id,
      name: "Manchester Lions FC Parliament",
      status: "live",
      hallClass: "III",
      sriScore: 82,
      ahgiScore: 74,
      closureStatus: "active",
      pirDebt: 0,
      payrollReserve: 6000,
      assetType: "ledgersport-football-club",
      businessStatus: "operating",
      inventoryEnabled: true,
      forgeEnabled: true,
      ihcpBalance: 8000,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 TREASURY
  // ═══════════════════════════════════════════════════════════
  await prisma.hallTreasury.upsert({
    where: { hallId: demoHall3.id },
    update: {},
    create: {
      hallId: demoHall3.id,
      balance: 12400,
      totalRevenue: 22000,
      totalDistributed: 3600,
      payrollReserve: 6000,
      pirDebt: 0,
      closureReserve: 0,
      monthlyRevenue: 22000,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 EXECUTIVE CABINET
  // ═══════════════════════════════════════════════════════════
  await prisma.executiveCabinet.upsert({
    where: { hallId: demoHall3.id },
    update: {},
    create: {
      hallId: demoHall3.id,
      speakerId: demoAdmin.id,
      treasurerId: demoSubAdmin.id,
      wardenId: demoUser.id,
      scribeId: demoUser.id,
      electedAt: now,
      expiresAt: new Date("2026-12-31"),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 OWNERSHIPS
  // ═══════════════════════════════════════════════════════════
  const ownership3Admin = await prisma.ownership.create({
    data: {
      poolId: demoPool3.id,
      userId: demoAdmin.id,
      hallId: demoHall3.id,
      amountCommitted: 50000,
      ownershipPercent: 41.67,
      pacToken: "PAC-ADMIN-003",
      status: "active",
      isWinner: true,
      inviteCodesRemaining: 3,
      inviteCodesUsed: 0,
      dynamicValue: 1850,
      accumulatedDividends: 620,
      pirDebt: 0,
      ledgerId: demoAdmin.ledgerId,
    },
  });

  const ownership3Sub = await prisma.ownership.create({
    data: {
      poolId: demoPool3.id,
      userId: demoSubAdmin.id,
      hallId: demoHall3.id,
      amountCommitted: 30000,
      ownershipPercent: 25.0,
      pacToken: "PAC-SUBADMIN-003",
      status: "active",
      isWinner: true,
      inviteCodesRemaining: 3,
      inviteCodesUsed: 0,
      dynamicValue: 1850,
      accumulatedDividends: 375,
      pirDebt: 0,
      ledgerId: demoSubAdmin.ledgerId,
    },
  });

  await prisma.ownership.create({
    data: {
      poolId: demoPool3.id,
      userId: demoUser.id,
      hallId: demoHall3.id,
      amountCommitted: 20000,
      ownershipPercent: 16.67,
      pacToken: "PAC-USER-003",
      status: "active",
      isWinner: true,
      inviteCodesRemaining: 3,
      inviteCodesUsed: 0,
      dynamicValue: 1850,
      accumulatedDividends: 250,
      pirDebt: 0,
      ledgerId: demoUser.ledgerId,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 WORKERS (Class III — Sport Staff)
  // ═══════════════════════════════════════════════════════════
  const sportWorker1 = await prisma.worker.create({
    data: {
      hallId: demoHall3.id,
      workerNumber: `W-${demoHall3.id.slice(-4)}-001`,
      role: "Club Manager",
      salary: 2000,
      contractMonths: 12,
      hiredAt: new Date("2026-02-01"),
      status: "active",
      performanceScore: 90,
      shiftSchedule: JSON.stringify({
        mon: "09:00-18:00",
        tue: "09:00-18:00",
        wed: "09:00-18:00",
        thu: "09:00-18:00",
        fri: "09:00-18:00",
        sat: "match_day",
        sun: "off",
      }),
      department: "Admin",
    },
  });

  const sportWorker2 = await prisma.worker.create({
    data: {
      hallId: demoHall3.id,
      workerNumber: `W-${demoHall3.id.slice(-4)}-002`,
      role: "Head Coach",
      salary: 1800,
      contractMonths: 12,
      hiredAt: new Date("2026-02-15"),
      status: "active",
      performanceScore: 85,
      shiftSchedule: JSON.stringify({
        mon: "07:00-15:00",
        tue: "07:00-15:00",
        wed: "07:00-15:00",
        thu: "07:00-15:00",
        fri: "07:00-15:00",
        sat: "match_day",
        sun: "off",
      }),
      department: "Field",
    },
  });

  const sportWorker3 = await prisma.worker.create({
    data: {
      hallId: demoHall3.id,
      workerNumber: `W-${demoHall3.id.slice(-4)}-003`,
      role: "Fitness Trainer",
      salary: 900,
      contractMonths: 6,
      hiredAt: new Date("2026-04-01"),
      status: "active",
      performanceScore: 78,
      shiftSchedule: JSON.stringify({
        mon: "06:00-14:00",
        tue: "06:00-14:00",
        wed: "off",
        thu: "06:00-14:00",
        fri: "06:00-14:00",
        sat: "match_day",
        sun: "off",
      }),
      department: "Field",
    },
  });

  const sportWorker4 = await prisma.worker.create({
    data: {
      hallId: demoHall3.id,
      workerNumber: `W-${demoHall3.id.slice(-4)}-004`,
      role: "Physiotherapist",
      salary: 1100,
      contractMonths: 12,
      hiredAt: new Date("2026-03-01"),
      status: "active",
      performanceScore: 92,
      shiftSchedule: JSON.stringify({
        mon: "08:00-16:00",
        tue: "08:00-16:00",
        wed: "08:00-16:00",
        thu: "08:00-16:00",
        fri: "08:00-16:00",
        sat: "match_day",
        sun: "off",
      }),
      department: "Field",
    },
  });

  const sportWorker5 = await prisma.worker.create({
    data: {
      hallId: demoHall3.id,
      workerNumber: `W-${demoHall3.id.slice(-4)}-005`,
      role: "Groundskeeper",
      salary: 650,
      contractMonths: 12,
      hiredAt: new Date("2026-03-15"),
      status: "active",
      performanceScore: 80,
      shiftSchedule: JSON.stringify({
        mon: "05:00-13:00",
        tue: "05:00-13:00",
        wed: "05:00-13:00",
        thu: "05:00-13:00",
        fri: "05:00-13:00",
        sat: "match_day",
        sun: "off",
      }),
      department: "Field",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 WORKER PERFORMANCES
  // ═══════════════════════════════════════════════════════════
  await prisma.workerPerformance.createMany({
    data: [
      {
        workerId: sportWorker1.id,
        score: 90,
        metrics: JSON.stringify({
          attendance: 99,
          revenueGrowth: 112,
          sponsorRetention: 95,
          fanEngagement: 88,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Continue current performance. Explore stadium naming rights deal.",
      },
      {
        workerId: sportWorker2.id,
        score: 85,
        metrics: JSON.stringify({
          attendance: 96,
          winRate: 68,
          playerDevelopment: 82,
          tacticalRating: 79,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Focus on defensive organization. Target 75% win rate by Q4.",
      },
      {
        workerId: sportWorker3.id,
        score: 78,
        metrics: JSON.stringify({
          attendance: 94,
          injuryPrevention: 71,
          fitnessTestScores: 85,
          sessionQuality: 80,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Reduce soft-tissue injuries by 20%. Implement GPS tracking.",
      },
      {
        workerId: sportWorker4.id,
        score: 92,
        metrics: JSON.stringify({
          attendance: 98,
          recoveryRate: 94,
          playerAvailability: 91,
          treatmentSatisfaction: 96,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Exceeds expectations. Eligible for senior physio role expansion.",
      },
      {
        workerId: sportWorker5.id,
        score: 80,
        metrics: JSON.stringify({
          attendance: 97,
          pitchQuality: 84,
          equipmentMaintenance: 88,
          weatherPrep: 76,
        }),
        reviewerId: demoAdmin.id,
        improvementPlan:
          "Improve drainage system before winter season. Budget request approved.",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 RELAY MESSAGES
  // ═══════════════════════════════════════════════════════════
  await prisma.relayMessage.createMany({
    data: [
      {
        hallId: demoHall3.id,
        workerId: sportWorker2.id,
        direction: "hall_to_worker",
        content:
          "Saturday match vs United reserves — please prepare tactical briefing for players by Thursday.",
        relayedAt: now,
        status: "relayed",
        loggedBy: demoAdmin.ledgerId,
      },
      {
        hallId: demoHall3.id,
        workerId: sportWorker2.id,
        direction: "worker_to_hall",
        content:
          "Briefing ready. Video analysis uploaded. Injury report: 2 players doubtful. Recommend starting lineup adjustment.",
        relayedAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        status: "relayed",
        loggedBy: "SYSTEM",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 FORGE LEDGER
  // ═══════════════════════════════════════════════════════════
  await prisma.forgeLedger.create({
    data: {
      hallId: demoHall3.id,
      month: "2026-06",
      totalPayroll: 6450,
      workerCount: 5,
      entries: JSON.stringify([
        {
          workerId: sportWorker1.id,
          workerNumber: sportWorker1.workerNumber,
          role: "Club Manager",
          salary: 2000,
          status: "paid",
        },
        {
          workerId: sportWorker2.id,
          workerNumber: sportWorker2.workerNumber,
          role: "Head Coach",
          salary: 1800,
          status: "paid",
        },
        {
          workerId: sportWorker3.id,
          workerNumber: sportWorker3.workerNumber,
          role: "Fitness Trainer",
          salary: 900,
          status: "paid",
        },
        {
          workerId: sportWorker4.id,
          workerNumber: sportWorker4.workerNumber,
          role: "Physiotherapist",
          salary: 1100,
          status: "paid",
        },
        {
          workerId: sportWorker5.id,
          workerNumber: sportWorker5.workerNumber,
          role: "Groundskeeper",
          salary: 650,
          status: "paid",
        },
      ]),
      businessRevenue: 22000,
      costOfGoodsSold: 4800,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 INVENTORY ITEMS
  // ═══════════════════════════════════════════════════════════
  const sportInventory1 = await prisma.inventoryItem.create({
    data: {
      hallId: demoHall3.id,
      title: "Manchester Lions Home Jersey 2026",
      description:
        "Official home kit. Embroidered club crest. Adult sizes S-XXL.",
      price: 65,
      quantity: 500,
      quantitySold: 145,
      status: "active",
      listedAt: now,
      costOfGoods: 28,
      reorderThreshold: 80,
    },
  });

  const sportInventory2 = await prisma.inventoryItem.create({
    data: {
      hallId: demoHall3.id,
      title: "Youth Training Kit Bundle",
      description:
        "Full training set: jersey, shorts, socks, and water bottle. Academy standard.",
      price: 45,
      quantity: 300,
      quantitySold: 92,
      status: "active",
      listedAt: now,
      costOfGoods: 18,
      reorderThreshold: 50,
    },
  });

  const sportInventory3 = await prisma.inventoryItem.create({
    data: {
      hallId: demoHall3.id,
      title: "Match Day Ticket — General Admission",
      description:
        "Single match entry. Valid for any home league fixture. Digital QR code.",
      price: 18,
      quantity: 2800,
      quantitySold: 1240,
      status: "active",
      listedAt: now,
      costOfGoods: 2,
      reorderThreshold: 200,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 INVENTORY ORDERS
  // ═══════════════════════════════════════════════════════════
  await prisma.inventoryOrder.create({
    data: {
      inventoryId: sportInventory1.id,
      buyerId: demoUser.id,
      amount: 130,
      quantity: 2,
      status: "completed",
      escrowReleasedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      completedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 OWNERSHIP LISTINGS
  // ═══════════════════════════════════════════════════════════
  await prisma.ownershipListing.create({
    data: {
      ownershipId: ownership3Sub.id,
      hallId: demoHall3.id,
      sellerId: demoSubAdmin.id,
      percentListed: 3.0,
      pricePerPercent: 2200,
      totalPrice: 6600,
      floorPrice: 1850,
      status: "active",
      listedAt: now,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 REVENUE LOG
  // ═══════════════════════════════════════════════════════════
  await prisma.revenueLog.create({
    data: {
      poolId: demoPool3.id,
      amount: 22000,
      source: "daily_sales",
      ledgerFee: 4400,
      communityNet: 17600,
      distributed: true,
      distributionTx: "TX-REV-SPORT-001",
      payrollDeducted: 6450,
      netAfterPayroll: 11150,
      businessSource: "match_day_revenue",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 8TH LEDGER UPDATES
  // ═══════════════════════════════════════════════════════════
  await prisma.eighthLedgerUpdate.createMany({
    data: [
      {
        hallId: demoHall3.id,
        type: "payroll",
        title: "Payroll Executed",
        content:
          "5 staff paid via 8th Ledger Payroll System. Total: $6,450. Club Manager bonus approved for sponsor retention.",
        amount: 6450,
      },
      {
        hallId: demoHall3.id,
        type: "inventory",
        title: "Merchandise Alert: Home Jerseys",
        content:
          "Home Jersey stock at 71%. Reorder threshold (80 units) approaching. Hall vote required for manufacturer selection.",
        amount: 0,
      },
      {
        hallId: demoHall3.id,
        type: "valuation",
        title: "Dynamic Valuation Update",
        content:
          "Manchester Lions asset book value up 5%. Driven by: season ticket sales (+8%), merchandise growth (+12%).",
        amount: 126000,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 SRI SNAPSHOT
  // ═══════════════════════════════════════════════════════════
  await prisma.sriSnapshot.create({
    data: {
      hallId: demoHall3.id,
      score: 82,
      governanceActivity: 88,
      revenueConsistency: 80,
      dividendReliability: 85,
      proposalQuality: 82,
      dormancyRate: 60,
      marketplaceVelocity: 90,
      recordedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 AHGI SNAPSHOT
  // ═══════════════════════════════════════════════════════════
  await prisma.ahgiSnapshot.create({
    data: {
      hallId: demoHall3.id,
      score: 74,
      healthMetrics: JSON.stringify({
        matchAttendance: 78,
        playerInjuryRate: 12,
        pitchCondition: 91,
        staffRetention: 88,
      }),
      growthMetrics: JSON.stringify({
        seasonTicketGrowth: 15,
        merchandiseGrowth: 22,
        sponsorValueIndex: 108,
        youthEnrollment: 34,
      }),
      recordedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 DYNAMIC VALUATION
  // ═══════════════════════════════════════════════════════════
  await prisma.dynamicValuation.create({
    data: {
      hallId: demoHall3.id,
      assetBookValue: 126000,
      accumulatedDividendsPerPercent: 62,
      ahgiPremium: 240,
      sriBonus: 30,
      pirDebtPerPercent: 0,
      valuePerPercent: 1850,
      calculatedAt: now,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 PIR ALLOCATIONS
  // ═══════════════════════════════════════════════════════════
  await prisma.pirAllocation.createMany({
    data: [
      {
        hallId: demoHall3.id,
        pillar: "shield",
        amount: 30000,
        purpose:
          "Player injury insurance, liability, stadium casualty, force majeure",
        spent: 3500,
      },
      {
        hallId: demoHall3.id,
        pillar: "seal",
        amount: 20000,
        purpose:
          "Club registration, FA license, operating agreements, beneficial interest",
        spent: 8000,
      },
      {
        hallId: demoHall3.id,
        pillar: "forge",
        amount: 20000,
        purpose:
          "Pitch maintenance, gym equipment, stadium repairs, kit replacement",
        spent: 4200,
      },
      {
        hallId: demoHall3.id,
        pillar: "spire",
        amount: 12000,
        purpose:
          "Ticketing system, fan app, security upgrades, broadcast equipment",
        spent: 5500,
      },
      {
        hallId: demoHall3.id,
        pillar: "vanguard",
        amount: 10000,
        purpose: "Women's team expansion, academy scouting, international tour",
        spent: 0,
      },
      {
        hallId: demoHall3.id,
        pillar: "sanctuary",
        amount: 8000,
        purpose:
          "Off-season reserve, injury crisis fund, match cancellation coverage",
        spent: 1200,
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // HALL 3 ACTIVITIES
  // ═══════════════════════════════════════════════════════════
  await prisma.hallActivity.createMany({
    data: [
      {
        hallId: demoHall3.id,
        userId: demoAdmin.id,
        type: "proposal",
        description: "Proposal passed: Hire Head Coach (12-month contract)",
      },
      {
        hallId: demoHall3.id,
        userId: demoAdmin.id,
        type: "vote",
        description: "Vote cast: YES (41.67% weight)",
      },
      {
        hallId: demoHall3.id,
        userId: demoSubAdmin.id,
        type: "vote",
        description: "Vote cast: YES (25% weight)",
      },
      {
        hallId: demoHall3.id,
        type: "dividend",
        description: "Weekly dividend distributed: $11,150 net after payroll",
      },
      {
        hallId: demoHall3.id,
        type: "inventory",
        description:
          "Stock order approved: 300 home jerseys, 150 training kits, 2,000 match tickets",
      },
      {
        hallId: demoHall3.id,
        userId: demoAdmin.id,
        type: "join",
        description: "Manchester Lions FC Parliament activated",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // PHASE 4: HALL 3 IHCP
  // ═══════════════════════════════════════════════════════════
  await prisma.hallContribution.createMany({
    data: [
      {
        hallId: demoHall3.id,
        ledgerId: demoAdmin.ledgerId,
        amount: 5000,
        purpose: "marketing",
        repaidAmount: 2000,
        status: "active",
      },
      {
        hallId: demoHall3.id,
        ledgerId: demoSubAdmin.ledgerId,
        amount: 3000,
        purpose: "upgrade",
        repaidAmount: 1000,
        status: "active",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // ORACLE STANDING
  // ═══════════════════════════════════════════════════════════
  await prisma.oracleStanding.upsert({
    where: { userId: demoAdmin.id },
    update: {},
    create: {
      userId: demoAdmin.id,
      totalPoints: 847,
      correctCount: 42,
      totalPredictions: 50,
      tier: "oracle",
      streak: 7,
      lastCorrectAt: now,
    },
  });
  await prisma.oracleStanding.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalPoints: 47,
      correctCount: 8,
      totalPredictions: 15,
      tier: "seer",
      streak: 2,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      {
        ledgerId: demoAdmin.ledgerId,
        type: "system",
        title: "Hall Activated",
        message:
          "Sovereign Heights Parliament is now live with 3 sovereign members.",
        actionUrl: "/halls",
      },
      {
        ledgerId: demoAdmin.ledgerId,
        type: "system",
        title: "Hall Activated",
        message:
          "MetroMart Operations Parliament is now live. Class III Active Operation.",
        actionUrl: "/halls",
      },
      {
        ledgerId: demoAdmin.ledgerId,
        type: "system",
        title: "Hall Activated",
        message:
          "Manchester Lions FC Parliament is now live. Class III Active Operation — 11th vertical unlocked.",
        actionUrl: "/halls",
      },
      {
        ledgerId: demoUser.ledgerId,
        type: "proposal",
        title: "New Proposal",
        message: "Vote now: Set Monthly Rent at $4,500",
        actionUrl: `/halls/${demoHall1.id}/proposals`,
      },
      {
        ledgerId: demoUser.ledgerId,
        type: "dividend",
        title: "Dividend Received",
        message: "You earned $120.00 from Sovereign Heights rent distribution.",
        actionUrl: "/dividends",
      },
      {
        ledgerId: demoSubAdmin.ledgerId,
        type: "system",
        title: "Role Assigned",
        message:
          "You have been elected as Treasurer for Sovereign Heights Parliament.",
        actionUrl: `/halls/${demoHall1.id}`,
      },
      {
        ledgerId: demoSubAdmin.ledgerId,
        type: "marketplace",
        title: "PAC Listing Active",
        message:
          "Your 5% listing in MetroMart is now live on the Ownership Market.",
        actionUrl: "/marketplace/ownership",
      },
      {
        ledgerId: demoSubAdmin.ledgerId,
        type: "marketplace",
        title: "PAC Listing Active",
        message:
          "Your 3% listing in Manchester Lions FC is now live on the Ownership Market.",
        actionUrl: "/marketplace/ownership",
      },
    ],
  });

  // ═══════════════════════════════════════════════════════════
  // AUDIT & SECURITY
  // ═══════════════════════════════════════════════════════════
  await prisma.auditEntry.create({
    data: {
      type: "hall_created",
      description: "Sovereign Heights Parliament created and activated",
      txHash: "AUDIT-HALL-001",
      ledgerId: demoAdmin.ledgerId,
      poolId: demoPool1.id,
    },
  });
  await prisma.auditEntry.create({
    data: {
      type: "hall_created",
      description:
        "MetroMart Operations Parliament created and activated — Class III",
      txHash: "AUDIT-HALL-002",
      ledgerId: demoAdmin.ledgerId,
      poolId: demoPool2.id,
    },
  });
  await prisma.auditEntry.create({
    data: {
      type: "hall_created",
      description:
        "Manchester Lions FC Parliament created and activated — Class III, LedgerSport (11th vertical)",
      txHash: "AUDIT-HALL-003",
      ledgerId: demoAdmin.ledgerId,
      poolId: demoPool3.id,
    },
  });
  await prisma.securityAuditLog.create({
    data: {
      ledgerId: demoAdmin.ledgerId,
      action: "admin_login",
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      success: true,
      details: "Initial seed and system activation",
      currentHash: "SEED-HASH-001",
    },
  });

  // ═══════════════════════════════════════════════════════════
  // PROTOCOL SETTINGS
  // ═══════════════════════════════════════════════════════════
  await prisma.protocolSettings.upsert({
    where: { key: "default" },
    update: {},
    create: {
      key: "default",
      platformFee: 0,
      minCommitment: 50,
      maxCommitment: 50000,
      consensusThreshold: 2,
      publicAudit: true,
      pirEnabled: true,
      oracleEnabled: true,
      meridianCycleEnabled: true,
      closureProtocolEnabled: true,
      dormancyProtocolEnabled: true,
      dynamicValuationEnabled: true,
      forgeLedgerEnabled: true,
      eighthLedgerTithe: 20,
    },
  });

  console.log("\n✅ 8TH LEDGER PHASE 4 SEED COMPLETE");
  console.log(
    `   Primary Admin : LED-8X2P-9LQ3     | Password: FounderQuantumKey2026! | 6-Factor Auth`,
  );
  console.log(
    `   Admin         : LED-ADMIN-001    | Password: 8thledger2026         | 6-Factor Auth`,
  );
  console.log(
    `   Sub-Admin     : LED-SUBADMIN-001 | Password: 8thledger2026         | 3-Factor Auth`,
  );
  console.log(
    `   User          : LED-USER-001     | Password: 8thledger2026         | Standard`,
  );
  console.log(
    `   ─────────────────────────────────────────────────────────────────────`,
  );
  console.log(
    `   HALL 1 (Class I)  : Sovereign Heights Parliament — LedgerProp Dubai`,
  );
  console.log(`   Pool              : POOL-LEDGERPROP-001`);
  console.log(`   SRI: 87 🥇 GOLD   | AHGI: 72  | PAC Floor: $2,930 per 1%`);
  console.log(`   PIR Shield: $25K  | Inventory: OFF | Forge: OFF | IHCP: $0`);
  console.log(
    `   ─────────────────────────────────────────────────────────────────────`,
  );
  console.log(
    `   HALL 2 (Class III): MetroMart Operations Parliament — LedgerBiz Nairobi`,
  );
  console.log(`   Pool              : POOL-LEDGERBIZ-001`);
  console.log(`   SRI: 78 🥇 GOLD   | AHGI: 65  | PAC Floor: $1,025 per 1%`);
  console.log(`   Workers: 5        | Inventory: 3 SKUs | Payroll: $4,150/mo`);
  console.log(`   COGS: $8,500      | Business Revenue: $15,000 | Net: $7,850`);
  console.log(
    `   IHCP: $5,000      | Inventory: ON | Forge: ON | IHCP Repaid: $2,300`,
  );
  console.log(
    `   ─────────────────────────────────────────────────────────────────────`,
  );
  console.log(
    `   HALL 3 (Class III): Manchester Lions FC Parliament — LedgerSport UK`,
  );
  console.log(`   Pool              : POOL-LEDGERSPORT-001`);
  console.log(`   SRI: 82 🥇 GOLD   | AHGI: 74  | PAC Floor: $1,850 per 1%`);
  console.log(`   Workers: 5        | Inventory: 3 SKUs | Payroll: $6,450/mo`);
  console.log(
    `   COGS: $4,800      | Business Revenue: $22,000 | Net: $11,150`,
  );
  console.log(
    `   IHCP: $8,000      | Inventory: ON | Forge: ON | IHCP Repaid: $3,000`,
  );
  console.log(
    `   ─────────────────────────────────────────────────────────────────────`,
  );
  console.log(`   Oracle Standing   : 2 records seeded (Seer + Oracle tiers)`);
  console.log(`   Dynamic Valuation : Active on all 3 halls`);
  console.log(
    `   Forge Ledger      : Class I (vendors) + Class III (full payroll)`,
  );
  console.log(`   Ownership Market  : 2 active listings with 48h escrow ready`);
  console.log(
    `   11 Verticals      : LedgerSport added as 11th sovereign asset class`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
