import { prisma } from "./prisma";

/* ============================================================
   TYPES
   ============================================================ */

export type AhgiStatus =
  | "thriving"
  | "healthy"
  | "stagnant"
  | "declining"
  | "critical";

export interface AhgiMetric {
  name: string;
  value: number; // 0-100
  weight: number;
  detail: string;
}

export interface AhgiBreakdown {
  totalScore: number;
  healthScore: number;
  growthScore: number;
  status: AhgiStatus;
  statusLabel: string;
  effect: string;
  healthMetrics: AhgiMetric[];
  growthMetrics: AhgiMetric[];
  recordedAt: Date;
}

export type VerticalSlug =
  | "ledgerprop"
  | "ledgerauto"
  | "ledgertech"
  | "ledgeredu"
  | "ledgerhealth"
  | "ledgeraccess"
  | "ledgerbiz"
  | "ledgertravel"
  | "ledgeragri"
  | "ledgerenergy"
  | "ledgersport";

/* ============================================================
   STATUS RULES
   ============================================================ */

const AHGI_STATUS: Record<
  AhgiStatus,
  { min: number; max: number; label: string; effect: string }
> = {
  thriving: {
    min: 80,
    max: 100,
    label: "Thriving",
    effect: "Hall can propose expansion, new hires, additional inventory",
  },
  healthy: {
    min: 60,
    max: 79,
    label: "Healthy",
    effect: "Standard operation. Maintenance proposals auto-approved.",
  },
  stagnant: {
    min: 40,
    max: 59,
    label: "Stagnant",
    effect: "8th Ledger flags for review. Hall must submit improvement plan.",
  },
  declining: {
    min: 20,
    max: 39,
    label: "Declining",
    effect: "8th Ledger oversight increases. Dividend smoothing from Sanctuary activated.",
  },
  critical: {
    min: 0,
    max: 19,
    label: "Critical",
    effect: "8th Ledger can force asset sale, merger, or restructuring without hall vote.",
  },
};

/* ============================================================
   PURE FUNCTIONS
   ============================================================ */

export function getAhgiStatus(score: number): AhgiStatus {
  if (score >= 80) return "thriving";
  if (score >= 60) return "healthy";
  if (score >= 40) return "stagnant";
  if (score >= 20) return "declining";
  return "critical";
}

export function getAhgiStatusMeta(score: number) {
  const status = getAhgiStatus(score);
  return { status, ...AHGI_STATUS[status] };
}

/* ============================================================
   HEALTH METRIC CALCULATORS BY VERTICAL
   ============================================================ */

/**
 * LedgerProp — Health: Occupancy %, maintenance backlog, tenant satisfaction
 */
async function calcLedgerPropHealth(hallId: string): Promise<AhgiMetric[]> {
  // Use revenue consistency as proxy for occupancy
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { amount: true, netAfterPayroll: true },
  });

  const avgRevenue =
    revenueLogs.length > 0
      ? revenueLogs.reduce((s, r) => s + r.amount, 0) / revenueLogs.length
      : 0;

  // Occupancy proxy: revenue vs expected (assume $5k baseline for prop)
  const occupancyScore = Math.min(100, Math.max(0, (avgRevenue / 5000) * 100));

  // Maintenance backlog proxy: proposal count for maintenance type
  const maintenanceProposals = await prisma.proposal.count({
    where: { hallId, type: "maintenance", status: { in: ["pending", "passed"] } },
  });
  const maintenanceScore = Math.max(0, 100 - maintenanceProposals * 10);

  // Tenant satisfaction proxy: SRI dividend reliability
  const sri = await prisma.sriSnapshot.findFirst({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
    select: { dividendReliability: true },
  });
  const satisfactionScore = sri?.dividendReliability ?? 50;

  return [
    {
      name: "Occupancy %",
      value: Math.round(occupancyScore),
      weight: 0.4,
      detail: `Avg monthly revenue $${Math.round(avgRevenue)} vs $5k baseline`,
    },
    {
      name: "Maintenance Backlog",
      value: Math.round(maintenanceScore),
      weight: 0.35,
      detail: `${maintenanceProposals} pending maintenance proposals`,
    },
    {
      name: "Tenant Satisfaction",
      value: Math.round(satisfactionScore),
      weight: 0.25,
      detail: `Dividend reliability proxy: ${satisfactionScore}/100`,
    },
  ];
}

/**
 * LedgerAuto — Health: Fleet utilization, depreciation rate, accident rate
 */
async function calcLedgerAutoHealth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { amount: true },
  });

  const avgRevenue =
    revenueLogs.length > 0
      ? revenueLogs.reduce((s, r) => s + r.amount, 0) / revenueLogs.length
      : 0;

  // Utilization proxy
  const utilizationScore = Math.min(100, Math.max(0, (avgRevenue / 3000) * 100));

  // Depreciation proxy: age of pool (older = lower score)
  const pool = await prisma.pool.findFirst({
    where: { hall: { id: hallId } },
    select: { createdAt: true },
  });
  const ageMonths = pool?.createdAt
    ? Math.floor((Date.now() - new Date(pool.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;
  const depreciationScore = Math.max(20, 100 - ageMonths * 2);

  // Accident proxy: disputes count
  const disputes = await prisma.dispute.count({
    where: { pool: { hall: { id: hallId } } },
  });
  const accidentScore = Math.max(0, 100 - disputes * 15);

  return [
    {
      name: "Fleet Utilization",
      value: Math.round(utilizationScore),
      weight: 0.4,
      detail: `Avg revenue $${Math.round(avgRevenue)}`,
    },
    {
      name: "Depreciation Rate",
      value: Math.round(depreciationScore),
      weight: 0.35,
      detail: `Asset age: ${ageMonths} months`,
    },
    {
      name: "Incident Rate",
      value: Math.round(accidentScore),
      weight: 0.25,
      detail: `${disputes} disputes filed`,
    },
  ];
}

/**
 * LedgerAgri — Health: Soil health, crop yield vs projection, weather risk
 */
async function calcLedgerAgriHealth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { amount: true, createdAt: true },
  });

  const yieldScore =
    revenueLogs.length >= 2
      ? Math.min(
          100,
          Math.max(
            0,
            ((revenueLogs[0].amount - revenueLogs[revenueLogs.length - 1].amount) /
              Math.max(1, revenueLogs[revenueLogs.length - 1].amount)) *
              100 +
              50
          )
        )
      : 50;

  // Worker performance proxy for soil/field health
  const workers = await prisma.worker.findMany({
    where: { hallId, status: "active" },
    select: { performanceScore: true },
  });
  const avgWorkerScore =
    workers.length > 0
      ? workers.reduce((s, w) => s + w.performanceScore, 0) / workers.length
      : 50;
  const soilScore = Math.min(100, Math.max(0, avgWorkerScore));

  // Weather risk proxy: revenue volatility
  const volatility =
    revenueLogs.length > 1
      ? Math.sqrt(
          revenueLogs.reduce((s, r) => s + Math.pow(r.amount - (revenueLogs.reduce((a, b) => a + b.amount, 0) / revenueLogs.length), 2), 0) /
            revenueLogs.length
        )
      : 0;
  const weatherRiskScore = Math.max(0, 100 - Math.min(volatility / 100, 100));

  return [
    {
      name: "Crop Yield vs Projection",
      value: Math.round(yieldScore),
      weight: 0.4,
      detail: `Revenue trend: ${Math.round(yieldScore - 50)}% deviation`,
    },
    {
      name: "Field Health",
      value: Math.round(soilScore),
      weight: 0.35,
      detail: `Worker performance proxy: ${Math.round(soilScore)}/100`,
    },
    {
      name: "Weather Risk",
      value: Math.round(weatherRiskScore),
      weight: 0.25,
      detail: `Revenue volatility: ${Math.round(volatility)}`,
    },
  ];
}

/**
 * LedgerEnergy — Health: Generation uptime, panel degradation, grid stability
 */
async function calcLedgerEnergyHealth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { amount: true },
  });

  const avgRevenue =
    revenueLogs.length > 0
      ? revenueLogs.reduce((s, r) => s + r.amount, 0) / revenueLogs.length
      : 0;

  // Uptime proxy: consistent revenue = high uptime
  const uptimeScore = Math.min(100, Math.max(0, (avgRevenue / 4000) * 100));

  // Degradation proxy: pool age
  const pool = await prisma.pool.findFirst({
    where: { hall: { id: hallId } },
    select: { createdAt: true },
  });
  const ageMonths = pool?.createdAt
    ? Math.floor((Date.now() - new Date(pool.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;
  const degradationScore = Math.max(30, 100 - ageMonths * 1.5);

  // Grid stability proxy: revenue consistency (low variance = stable)
  const variance =
    revenueLogs.length > 1
      ? revenueLogs.reduce((s, r) => s + Math.pow(r.amount - avgRevenue, 2), 0) / revenueLogs.length
      : 0;
  const stabilityScore = Math.max(0, 100 - Math.min(variance / 50000, 100));

  return [
    {
      name: "Generation Uptime",
      value: Math.round(uptimeScore),
      weight: 0.4,
      detail: `Avg revenue $${Math.round(avgRevenue)}`,
    },
    {
      name: "Panel Degradation",
      value: Math.round(degradationScore),
      weight: 0.35,
      detail: `Asset age: ${ageMonths} months`,
    },
    {
      name: "Grid Stability",
      value: Math.round(stabilityScore),
      weight: 0.25,
      detail: `Revenue variance: ${Math.round(variance)}`,
    },
  ];
}

/**
 * LedgerSport — Health: Team performance, player fitness, venue utilization
 */
async function calcLedgerSportHealth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { amount: true },
  });

  const avgRevenue =
    revenueLogs.length > 0
      ? revenueLogs.reduce((s, r) => s + r.amount, 0) / revenueLogs.length
      : 0;

  // Team performance proxy: revenue consistency (stable revenue = strong team)
  const performanceScore = Math.min(100, Math.max(0, (avgRevenue / 4000) * 100));

  // Player fitness proxy: worker performance scores
  const workers = await prisma.worker.findMany({
    where: { hallId, status: "active" },
    select: { performanceScore: true },
  });
  const avgWorkerScore =
    workers.length > 0
      ? workers.reduce((s, w) => s + w.performanceScore, 0) / workers.length
      : 50;
  const fitnessScore = Math.min(100, Math.max(0, avgWorkerScore));

  // Venue utilization proxy: revenue per event (assume $2k per event baseline)
  const venueScore = Math.min(100, Math.max(0, (avgRevenue / 2000) * 100));

  return [
    {
      name: "Team Performance",
      value: Math.round(performanceScore),
      weight: 0.4,
      detail: `Avg revenue $${Math.round(avgRevenue)}`,
    },
    {
      name: "Player Fitness",
      value: Math.round(fitnessScore),
      weight: 0.35,
      detail: `Worker performance avg: ${Math.round(fitnessScore)}/100`,
    },
    {
      name: "Venue Utilization",
      value: Math.round(venueScore),
      weight: 0.25,
      detail: `Events per month proxy: ${Math.round(avgRevenue / 2000)}`,
    },
  ];
}

/**
 * Generic health fallback for other verticals.
 */
async function calcGenericHealth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { amount: true, netAfterPayroll: true },
  });

  const avgRevenue =
    revenueLogs.length > 0
      ? revenueLogs.reduce((s, r) => s + r.amount, 0) / revenueLogs.length
      : 0;

  const revenueScore = Math.min(100, Math.max(0, (avgRevenue / 3000) * 100));

  const workers = await prisma.worker.findMany({
    where: { hallId, status: "active" },
    select: { performanceScore: true },
  });
  const opsScore =
    workers.length > 0
      ? workers.reduce((s, w) => s + w.performanceScore, 0) / workers.length
      : 50;

  const proposals = await prisma.proposal.count({
    where: { hallId, type: "maintenance", status: "passed" },
  });
  const maintenanceScore = Math.min(100, 50 + proposals * 5);

  return [
    {
      name: "Revenue Health",
      value: Math.round(revenueScore),
      weight: 0.4,
      detail: `Avg revenue $${Math.round(avgRevenue)}`,
    },
    {
      name: "Operations Score",
      value: Math.round(opsScore),
      weight: 0.35,
      detail: `Worker performance avg: ${Math.round(opsScore)}`,
    },
    {
      name: "Maintenance Health",
      value: Math.round(maintenanceScore),
      weight: 0.25,
      detail: `${proposals} maintenance proposals passed`,
    },
  ];
}

/* ============================================================
   GROWTH METRIC CALCULATORS BY VERTICAL
   ============================================================ */

/**
 * LedgerProp — Growth: Property value index, rent growth YoY
 */
async function calcLedgerPropGrowth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "asc" },
    take: 12,
    select: { amount: true, createdAt: true },
  });

  // Rent growth: compare first half vs second half
  const mid = Math.floor(revenueLogs.length / 2);
  const firstHalf = revenueLogs.slice(0, mid);
  const secondHalf = revenueLogs.slice(mid);
  const firstAvg =
    firstHalf.length > 0 ? firstHalf.reduce((s, r) => s + r.amount, 0) / firstHalf.length : 0;
  const secondAvg =
    secondHalf.length > 0 ? secondHalf.reduce((s, r) => s + r.amount, 0) / secondHalf.length : 0;
  const rentGrowth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  const rentGrowthScore = Math.min(100, Math.max(0, 50 + rentGrowth));

  // Property value proxy: assetBookValue from dynamic valuation
  const latestVal = await prisma.dynamicValuation.findFirst({
    where: { hallId },
    orderBy: { calculatedAt: "desc" },
    select: { assetBookValue: true },
  });
  const pool = await prisma.pool.findFirst({
    where: { hall: { id: hallId } },
    select: { assetValue: true },
  });
  const valueGrowth =
    pool?.assetValue && latestVal?.assetBookValue && pool.assetValue > 0
      ? ((latestVal.assetBookValue - pool.assetValue) / pool.assetValue) * 100
      : 0;
  const valueScore = Math.min(100, Math.max(0, 50 + valueGrowth));

  // Marketplace velocity proxy for demand
  const listings = await prisma.ownershipListing.count({
    where: { hallId, status: "sold" },
  });
  const demandScore = Math.min(100, 50 + listings * 5);

  return [
    {
      name: "Rent Growth YoY",
      value: Math.round(rentGrowthScore),
      weight: 0.4,
      detail: `Revenue growth: ${Math.round(rentGrowth)}%`,
    },
    {
      name: "Property Value Index",
      value: Math.round(valueScore),
      weight: 0.35,
      detail: `Book value growth: ${Math.round(valueGrowth)}%`,
    },
    {
      name: "Market Demand",
      value: Math.round(demandScore),
      weight: 0.25,
      detail: `${listings} PAC sales completed`,
    },
  ];
}

/**
 * LedgerAgri — Growth: Yield growth, land value index
 */
async function calcLedgerAgriGrowth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "asc" },
    take: 6,
    select: { amount: true },
  });

  const yieldGrowth =
    revenueLogs.length >= 2
      ? ((revenueLogs[revenueLogs.length - 1].amount - revenueLogs[0].amount) /
          Math.max(1, revenueLogs[0].amount)) *
        100
      : 0;
  const yieldScore = Math.min(100, Math.max(0, 50 + yieldGrowth));

  // Land value proxy: dynamic valuation
  const latestVal = await prisma.dynamicValuation.findFirst({
    where: { hallId },
    orderBy: { calculatedAt: "desc" },
    select: { assetBookValue: true },
  });
  const pool = await prisma.pool.findFirst({
    where: { hall: { id: hallId } },
    select: { assetValue: true },
  });
  const landGrowth =
    pool?.assetValue && latestVal?.assetBookValue && pool.assetValue > 0
      ? ((latestVal.assetBookValue - pool.assetValue) / pool.assetValue) * 100
      : 0;
  const landScore = Math.min(100, Math.max(0, 50 + landGrowth));

  // Expansion proxy: new hires
  const newHires = await prisma.worker.count({
    where: { hallId, hiredAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
  });
  const expansionScore = Math.min(100, 50 + newHires * 10);

  return [
    {
      name: "Yield Growth",
      value: Math.round(yieldScore),
      weight: 0.4,
      detail: `Revenue trend: ${Math.round(yieldGrowth)}%`,
    },
    {
      name: "Land Value Index",
      value: Math.round(landScore),
      weight: 0.35,
      detail: `Asset appreciation: ${Math.round(landGrowth)}%`,
    },
    {
      name: "Expansion Rate",
      value: Math.round(expansionScore),
      weight: 0.25,
      detail: `${newHires} new hires in last 90 days`,
    },
  ];
}

/**
 * LedgerEnergy — Growth: kWh output growth, carbon credit accumulation
 */
async function calcLedgerEnergyGrowth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "asc" },
    take: 6,
    select: { amount: true },
  });

  const outputGrowth =
    revenueLogs.length >= 2
      ? ((revenueLogs[revenueLogs.length - 1].amount - revenueLogs[0].amount) /
          Math.max(1, revenueLogs[0].amount)) *
        100
      : 0;
  const outputScore = Math.min(100, Math.max(0, 50 + outputGrowth));

  // Carbon credit proxy: revenue per unit (assume $0.10/kWh)
  const latestRevenue = revenueLogs[revenueLogs.length - 1]?.amount || 0;
  const kWhEstimate = latestRevenue / 0.1;
  const carbonScore = Math.min(100, Math.max(0, (kWhEstimate / 50000) * 100));

  // Grid expansion proxy: ownership growth
  const ownerships = await prisma.ownership.count({
    where: { hallId, status: "active" },
  });
  const gridScore = Math.min(100, Math.max(0, ownerships * 2));

  return [
    {
      name: "kWh Output Growth",
      value: Math.round(outputScore),
      weight: 0.4,
      detail: `Revenue growth: ${Math.round(outputGrowth)}%`,
    },
    {
      name: "Carbon Credit Accumulation",
      value: Math.round(carbonScore),
      weight: 0.35,
      detail: `Est. ${Math.round(kWhEstimate)} kWh generated`,
    },
    {
      name: "Grid Expansion",
      value: Math.round(gridScore),
      weight: 0.25,
      detail: `${ownerships} active owners`,
    },
  ];
}

/**
 * LedgerSport — Growth: Fan base growth, sponsorship revenue, media rights
 */
async function calcLedgerSportGrowth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "asc" },
    take: 6,
    select: { amount: true },
  });

  // Fan growth proxy: revenue growth (more fans = more ticket sales)
  const fanGrowth =
    revenueLogs.length >= 2
      ? ((revenueLogs[revenueLogs.length - 1].amount - revenueLogs[0].amount) /
          Math.max(1, revenueLogs[0].amount)) *
        100
      : 0;
  const fanScore = Math.min(100, Math.max(0, 50 + fanGrowth));

  // Sponsorship proxy: inventory sales (merchandise, concessions)
  const inventorySales = await prisma.inventoryOrder.count({
    where: { inventory: { hallId }, status: "completed" },
  });
  const sponsorshipScore = Math.min(100, 50 + inventorySales * 3);

  // Media rights proxy: marketplace velocity (ownership turnover = media interest)
  const mediaDeals = await prisma.ownershipListing.count({
    where: { hallId, status: "sold" },
  });
  const mediaScore = Math.min(100, 50 + mediaDeals * 5);

  return [
    {
      name: "Fan Base Growth",
      value: Math.round(fanScore),
      weight: 0.4,
      detail: `Revenue growth: ${Math.round(fanGrowth)}%`,
    },
    {
      name: "Sponsorship Revenue",
      value: Math.round(sponsorshipScore),
      weight: 0.35,
      detail: `${inventorySales} inventory sales completed`,
    },
    {
      name: "Media Rights Value",
      value: Math.round(mediaScore),
      weight: 0.25,
      detail: `${mediaDeals} ownership transfers (media interest proxy)`,
    },
  ];
}

/**
 * Generic growth fallback.
 */
async function calcGenericGrowth(hallId: string): Promise<AhgiMetric[]> {
  const revenueLogs = await prisma.revenueLog.findMany({
    where: { pool: { hall: { id: hallId } } },
    orderBy: { createdAt: "asc" },
    take: 6,
    select: { amount: true },
  });

  const revenueGrowth =
    revenueLogs.length >= 2
      ? ((revenueLogs[revenueLogs.length - 1].amount - revenueLogs[0].amount) /
          Math.max(1, revenueLogs[0].amount)) *
        100
      : 0;
  const growthScore = Math.min(100, Math.max(0, 50 + revenueGrowth));

  const latestVal = await prisma.dynamicValuation.findFirst({
    where: { hallId },
    orderBy: { calculatedAt: "desc" },
    select: { assetBookValue: true },
  });
  const pool = await prisma.pool.findFirst({
    where: { hall: { id: hallId } },
    select: { assetValue: true },
  });
  const assetGrowth =
    pool?.assetValue && latestVal?.assetBookValue && pool.assetValue > 0
      ? ((latestVal.assetBookValue - pool.assetValue) / pool.assetValue) * 100
      : 0;
  const assetScore = Math.min(100, Math.max(0, 50 + assetGrowth));

  const newProposals = await prisma.proposal.count({
    where: {
      hallId,
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
  });
  const activityScore = Math.min(100, 50 + newProposals * 3);

  return [
    {
      name: "Revenue Growth",
      value: Math.round(growthScore),
      weight: 0.4,
      detail: `Revenue trend: ${Math.round(revenueGrowth)}%`,
    },
    {
      name: "Asset Appreciation",
      value: Math.round(assetScore),
      weight: 0.35,
      detail: `Book value growth: ${Math.round(assetGrowth)}%`,
    },
    {
      name: "Governance Activity",
      value: Math.round(activityScore),
      weight: 0.25,
      detail: `${newProposals} proposals in last 90 days`,
    },
  ];
}

/* ============================================================
   DISPATCHER
   ============================================================ */

function getVerticalSlug(hallId: string): Promise<VerticalSlug | "generic"> {
  return prisma.hall
    .findUnique({
      where: { id: hallId },
      include: { pool: { select: { verticalId: true } } },
    })
    .then((h) => {
      const slug = h?.pool?.verticalId?.toLowerCase() || "generic";
      if (
        [
          "ledgerprop",
          "ledgerauto",
          "ledgertech",
          "ledgeredu",
          "ledgerhealth",
          "ledgeraccess",
          "ledgerbiz",
          "ledgertravel",
          "ledgeragri",
          "ledgerenergy",
          "ledgersport",
        ].includes(slug)
      ) {
        return slug as VerticalSlug;
      }
      return "generic";
    });
}

async function getHealthMetrics(hallId: string, vertical: VerticalSlug | "generic"): Promise<AhgiMetric[]> {
  switch (vertical) {
    case "ledgerprop":
      return calcLedgerPropHealth(hallId);
    case "ledgerauto":
      return calcLedgerAutoHealth(hallId);
    case "ledgeragri":
      return calcLedgerAgriHealth(hallId);
    case "ledgerenergy":
      return calcLedgerEnergyHealth(hallId);
    case "ledgersport":
      return calcLedgerSportHealth(hallId);
    default:
      return calcGenericHealth(hallId);
  }
}

async function getGrowthMetrics(hallId: string, vertical: VerticalSlug | "generic"): Promise<AhgiMetric[]> {
  switch (vertical) {
    case "ledgerprop":
      return calcLedgerPropGrowth(hallId);
    case "ledgeragri":
      return calcLedgerAgriGrowth(hallId);
    case "ledgerenergy":
      return calcLedgerEnergyGrowth(hallId);
    case "ledgersport":
      return calcLedgerSportGrowth(hallId);
    default:
      return calcGenericGrowth(hallId);
  }
}

/* ============================================================
   MAIN CALCULATION
   ============================================================ */

/**
 * Calculate AHGI for a hall.
 * Formula: (Health Score × 0.4) + (Growth Score × 0.6)
 */
export async function calculateAhgi(hallId: string, saveSnapshot: boolean = true): Promise<AhgiBreakdown> {
  const vertical = await getVerticalSlug(hallId);

  const [healthMetrics, growthMetrics] = await Promise.all([
    getHealthMetrics(hallId, vertical),
    getGrowthMetrics(hallId, vertical),
  ]);

  const healthScore = Math.round(
    healthMetrics.reduce((s, m) => s + m.value * m.weight, 0)
  );
  const growthScore = Math.round(
    growthMetrics.reduce((s, m) => s + m.value * m.weight, 0)
  );

  const totalScore = Math.round(healthScore * 0.4 + growthScore * 0.6);
  const clampedScore = Math.max(0, Math.min(100, totalScore));
  const meta = getAhgiStatusMeta(clampedScore);

  const breakdown: AhgiBreakdown = {
    totalScore: clampedScore,
    healthScore,
    growthScore,
    status: meta.status,
    statusLabel: meta.label,
    effect: meta.effect,
    healthMetrics,
    growthMetrics,
    recordedAt: new Date(),
  };

  if (saveSnapshot) {
    await prisma.ahgiSnapshot.create({
      data: {
        hallId,
        score: clampedScore,
        healthMetrics: JSON.stringify(healthMetrics),
        growthMetrics: JSON.stringify(growthMetrics),
      },
    });

    await prisma.hall.update({
      where: { id: hallId },
      data: { ahgiScore: clampedScore },
    });
  }

  return breakdown;
}

/* ============================================================
   QUERIES
   ============================================================ */

/**
 * Get latest AHGI snapshot for a hall.
 */
export async function getLatestAhgiSnapshot(hallId: string): Promise<AhgiBreakdown | null> {
  const snapshot = await prisma.ahgiSnapshot.findFirst({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
  });

  if (!snapshot) return null;

  const healthMetrics: AhgiMetric[] = snapshot.healthMetrics
    ? JSON.parse(snapshot.healthMetrics)
    : [];
  const growthMetrics: AhgiMetric[] = snapshot.growthMetrics
    ? JSON.parse(snapshot.growthMetrics)
    : [];
  const meta = getAhgiStatusMeta(snapshot.score);

  return {
    totalScore: snapshot.score,
    healthScore: Math.round(
      healthMetrics.reduce((s, m) => s + m.value * m.weight, 0)
    ),
    growthScore: Math.round(
      growthMetrics.reduce((s, m) => s + m.value * m.weight, 0)
    ),
    status: meta.status,
    statusLabel: meta.label,
    effect: meta.effect,
    healthMetrics,
    growthMetrics,
    recordedAt: snapshot.recordedAt,
  };
}

/**
 * Get AHGI history.
 */
export async function getAhgiHistory(hallId: string, limit: number = 12): Promise<
  Array<{ score: number; healthScore: number; growthScore: number; status: AhgiStatus; recordedAt: Date }>
> {
  const snapshots = await prisma.ahgiSnapshot.findMany({
    where: { hallId },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });

  return snapshots.map((s) => {
    const healthMetrics: AhgiMetric[] = s.healthMetrics ? JSON.parse(s.healthMetrics) : [];
    const growthMetrics: AhgiMetric[] = s.growthMetrics ? JSON.parse(s.growthMetrics) : [];
    const healthScore = Math.round(healthMetrics.reduce((a, m) => a + m.value * m.weight, 0));
    const growthScore = Math.round(growthMetrics.reduce((a, m) => a + m.value * m.weight, 0));
    return {
      score: s.score,
      healthScore,
      growthScore,
      status: getAhgiStatus(s.score),
      recordedAt: s.recordedAt,
    };
  });
}

/**
 * Get global AHGI leaderboard.
 */
export async function getGlobalAhgiLeaderboard(limit: number = 50): Promise<
  Array<{ hallId: string; hallName: string; score: number; status: AhgiStatus; verticalId: string | null }>
> {
  const halls = await prisma.hall.findMany({
    where: { status: { not: "dissolved" } },
    include: {
      pool: { select: { verticalId: true, name: true } },
    },
    orderBy: { ahgiScore: "desc" },
    take: limit,
  });

  return halls.map((h) => ({
    hallId: h.id,
    hallName: h.name || h.pool?.name || "Unknown Hall",
    score: h.ahgiScore,
    status: getAhgiStatus(h.ahgiScore),
    verticalId: h.pool?.verticalId || null,
  }));
}

/**
 * Check if hall can propose expansion (Thriving only).
 */
export function canProposeExpansion(ahgiScore: number): boolean {
  return ahgiScore >= 80;
}

/**
 * Check if maintenance proposals are auto-approved (Healthy+).
 */
export function isMaintenanceAutoApproved(ahgiScore: number): boolean {
  return ahgiScore >= 60;
}

/**
 * Check if 8th Ledger can force closure (Critical).
 */
export function canForceClosure(ahgiScore: number): boolean {
  return ahgiScore <= 19;
}

/**
 * Check if dividend smoothing should activate (Declining).
 */
export function shouldActivateDividendSmoothing(ahgiScore: number): boolean {
  return ahgiScore <= 39 && ahgiScore >= 20;
}