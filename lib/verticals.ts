/* ============================================================
   8TH LEDGER — VERTICALS ENGINE
   11 sovereign asset classes — metadata, validation, defaults
   ============================================================ */

import {
  Landmark,
  Zap,
  Crown,
  Lock,
  HeartPulse,
  TrendingUp,
  Hexagon,
  Plane,
  Wheat,
  Battery,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

export interface VerticalMeta {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  color: string;
  bgGradient: string;
  ringClass: string;
  description: string;
  assetExamples: string[];
  verificationRequirements: VerificationRule[];
  minAssetValue: number;
  maxAssetValue: number;
  defaultMaxParticipants: number;
  typicalCommitmentRange: [number, number];
  assetTransferType: "ownership" | "lease" | "license" | "hours";
  legalJurisdiction: string[];
  defaultCampaignDuration: number;
  hallClass: "I" | "II" | "III";
  active: boolean;
}

export interface VerificationRule {
  field: string;
  required: boolean;
  description: string;
}

/* ============================================================
   VERTICAL REGISTRY — 11 Ledger Verticals (ALL ACTIVE)
   ============================================================ */

export const VERTICAL_REGISTRY: Record<string, VerticalMeta> = {
  ledgerprop: {
    id: "ledgerprop",
    name: "LedgerProp",
    shortName: "PROP",
    icon: Landmark,
    color: "text-amber-400",
    bgGradient: "from-amber-500/10 to-orange-500/5",
    ringClass: "ring-amber-500/30",
    description: "Real estate — apartments, offices, warehouses, hotels, data centers. Long-term lease revenue.",
    assetExamples: ["Penthouse", "Duplex", "Office Space", "Warehouse", "Land Parcel"],
    verificationRequirements: [
      { field: "titleDeed", required: true, description: "Legal title deed or certificate of occupancy" },
      { field: "inspectionReport", required: true, description: "Professional property inspection" },
      { field: "valuation", required: true, description: "Certified third-party valuation" },
      { field: "taxClearance", required: false, description: "Property tax clearance certificate" },
    ],
    minAssetValue: 50000,
    maxAssetValue: 5000000,
    defaultMaxParticipants: 450,
    typicalCommitmentRange: [100, 2000],
    assetTransferType: "ownership",
    legalJurisdiction: ["US", "UK", "CA", "AE", "NG"],
    defaultCampaignDuration: 30,
    hallClass: "I",
    active: true,
  },

  ledgerauto: {
    id: "ledgerauto",
    name: "LedgerAuto",
    shortName: "AUTO",
    icon: Zap,
    color: "text-cyan-400",
    bgGradient: "from-cyan-500/10 to-blue-500/5",
    ringClass: "ring-cyan-500/30",
    description: "Vehicle fleets — ride-hail, delivery, luxury rentals, buses, trucks. Lease to operators.",
    assetExamples: ["Luxury Sedan", "EV", "SUV", "Commercial Truck", "Motorcycle"],
    verificationRequirements: [
      { field: "registration", required: true, description: "Vehicle registration documents" },
      { field: "inspection", required: true, description: "Mechanical inspection report" },
      { field: "insurance", required: false, description: "Valid insurance certificate" },
      { field: "serviceHistory", required: false, description: "Dealership service records" },
    ],
    minAssetValue: 20000,
    maxAssetValue: 300000,
    defaultMaxParticipants: 200,
    typicalCommitmentRange: [50, 500],
    assetTransferType: "ownership",
    legalJurisdiction: ["US", "DE", "AE", "UK"],
    defaultCampaignDuration: 30,
    hallClass: "I",
    active: true,
  },

  ledgeredu: {
    id: "ledgeredu",
    name: "LedgerEdu",
    shortName: "EDU",
    icon: Crown,
    color: "text-violet-400",
    bgGradient: "from-violet-500/10 to-purple-500/5",
    ringClass: "ring-violet-500/30",
    description: "Education — tuition, certifications, bootcamps, degrees. All participants own the asset through PACs.",
    assetExamples: ["University Tuition", "Bootcamp", "Certification", "MBA", "PhD Program"],
    verificationRequirements: [
      { field: "institutionAccreditation", required: true, description: "Accreditation certificate from recognized body" },
      { field: "programSyllabus", required: true, description: "Official program curriculum" },
      { field: "feeSchedule", required: true, description: "Itemized tuition and fee schedule" },
      { field: "acceptanceLetter", required: false, description: "Conditional acceptance letter template" },
    ],
    minAssetValue: 5000,
    maxAssetValue: 150000,
    defaultMaxParticipants: 120,
    typicalCommitmentRange: [50, 300],
    assetTransferType: "license",
    legalJurisdiction: ["US", "UK", "SG", "CA", "IN"],
    defaultCampaignDuration: 45,
    hallClass: "II",
    active: true,
  },

  ledgeraccess: {
    id: "ledgeraccess",
    name: "LedgerAccess",
    shortName: "ACCESS",
    icon: Lock,
    color: "text-emerald-400",
    bgGradient: "from-emerald-500/10 to-teal-500/5",
    ringClass: "ring-emerald-500/30",
    description: "Infrastructure — cell towers, fiber, data centers, WiFi, satellite ground. Lease to operators.",
    assetExamples: ["Cell Tower", "Fiber Route", "Data Center Rack", "WiFi Node", "Satellite Ground"],
    verificationRequirements: [
      { field: "eventContract", required: true, description: "Signed event or venue contract" },
      { field: "capacityProof", required: true, description: "Venue capacity and safety clearance" },
      { field: "hostIdentity", required: true, description: "Verified host or organizer identity" },
    ],
    minAssetValue: 10000,
    maxAssetValue: 100000,
    defaultMaxParticipants: 80,
    typicalCommitmentRange: [50, 400],
    assetTransferType: "lease",
    legalJurisdiction: ["AE", "US", "SG", "CH"],
    defaultCampaignDuration: 21,
    hallClass: "I",
    active: true,
  },

  ledgerhealth: {
    id: "ledgerhealth",
    name: "LedgerHealth",
    shortName: "HEALTH",
    icon: HeartPulse,
    color: "text-rose-400",
    bgGradient: "from-rose-500/10 to-pink-500/5",
    ringClass: "ring-rose-500/30",
    description: "Medical — clinics, imaging, dialysis, dental, pharmacies. License to institutions.",
    assetExamples: ["Surgery Package", "Wellness Retreat", "Gym Annual", "Therapy Sessions", "Dental Package"],
    verificationRequirements: [
      { field: "medicalLicense", required: true, description: "Practitioner or facility medical license" },
      { field: "treatmentPlan", required: true, description: "Detailed treatment or care plan" },
      { field: "insuranceAcceptance", required: false, description: "Insurance compatibility documentation" },
      { field: "patientReviews", required: false, description: "Minimum 10 verified patient reviews" },
    ],
    minAssetValue: 5000,
    maxAssetValue: 100000,
    defaultMaxParticipants: 100,
    typicalCommitmentRange: [50, 500],
    assetTransferType: "license",
    legalJurisdiction: ["US", "DE", "AE", "IN"],
    defaultCampaignDuration: 30,
    hallClass: "II",
    active: true,
  },

  ledgerbiz: {
    id: "ledgerbiz",
    name: "LedgerBiz",
    shortName: "BIZ",
    icon: TrendingUp,
    color: "text-orange-400",
    bgGradient: "from-orange-500/10 to-red-500/5",
    ringClass: "ring-orange-500/30",
    description: "Business — supermarkets, restaurants, coworking, logistics. Direct daily operation.",
    assetExamples: ["Industrial Printer", "Server Rack", "Office Suite", "Trademark", "Patent License"],
    verificationRequirements: [
      { field: "businessRegistration", required: true, description: "Business or asset registration" },
      { field: "assetAppraisal", required: true, description: "Independent asset appraisal" },
      { field: "ownershipChain", required: true, description: "Clear chain of ownership" },
      { field: "lienCheck", required: false, description: "No-lien certificate" },
    ],
    minAssetValue: 15000,
    maxAssetValue: 500000,
    defaultMaxParticipants: 100,
    typicalCommitmentRange: [100, 1000],
    assetTransferType: "ownership",
    legalJurisdiction: ["US", "UK", "DE", "IN", "NG"],
    defaultCampaignDuration: 30,
    hallClass: "III",
    active: true,
  },

  ledgertech: {
    id: "ledgertech",
    name: "LedgerTech",
    shortName: "TECH",
    icon: Hexagon,
    color: "text-indigo-400",
    bgGradient: "from-indigo-500/10 to-blue-500/5",
    ringClass: "ring-indigo-500/30",
    description: "Technology — electronics, servers, drones, 3D printing, robotics. Fast turnover.",
    assetExamples: ["GPU Cluster", "Server Farm", "Software License", "Drone Fleet", "3D Printer"],
    verificationRequirements: [
      { field: "serialNumbers", required: true, description: "Hardware serial numbers and specs" },
      { field: "warranty", required: true, description: "Manufacturer warranty status" },
      { field: "performanceBenchmark", required: true, description: "Independent benchmark results" },
      { field: "softwareLicense", required: false, description: "Transferable license agreement" },
    ],
    minAssetValue: 10000,
    maxAssetValue: 500000,
    defaultMaxParticipants: 150,
    typicalCommitmentRange: [100, 1500],
    assetTransferType: "ownership",
    legalJurisdiction: ["US", "SG", "DE", "IN"],
    defaultCampaignDuration: 30,
    hallClass: "III",
    active: true,
  },

  ledgertravel: {
    id: "ledgertravel",
    name: "LedgerTravel",
    shortName: "TRAVEL",
    icon: Plane,
    color: "text-sky-400",
    bgGradient: "from-sky-500/10 to-cyan-500/5",
    ringClass: "ring-sky-500/30",
    description: "Travel — jets, yachts, hotels, safari lodges, charters. Charter and lease.",
    assetExamples: ["Jet Card Hours", "Fractional Share", "Lounge Membership", "Charter Credit", "Airline Miles"],
    verificationRequirements: [
      { field: "airworthiness", required: true, description: "Airworthiness certificate (aviation)" },
      { field: "operatorLicense", required: true, description: "Operator or charter license" },
      { field: "insurance", required: true, description: "Aviation liability insurance" },
      { field: "flightLogs", required: false, description: "Recent flight logs and maintenance" },
    ],
    minAssetValue: 50000,
    maxAssetValue: 2000000,
    defaultMaxParticipants: 100,
    typicalCommitmentRange: [100, 2500],
    assetTransferType: "hours",
    legalJurisdiction: ["US", "AE", "CH", "KY"],
    defaultCampaignDuration: 30,
    hallClass: "II",
    active: true,
  },

  ledgeragri: {
    id: "ledgeragri",
    name: "LedgerAgri",
    shortName: "AGRI",
    icon: Wheat,
    color: "text-lime-400",
    bgGradient: "from-lime-500/10 to-green-500/5",
    ringClass: "ring-lime-500/30",
    description: "Agriculture — farms, greenhouses, livestock, dairy, aquaculture. Grow, harvest, sell.",
    assetExamples: ["Farmland Parcel", "Tractor Fleet", "Irrigation System", "Crop Share", "Greenhouse"],
    verificationRequirements: [
      { field: "landTitle", required: true, description: "Land title or lease agreement" },
      { field: "soilReport", required: true, description: "Soil quality and fertility report" },
      { field: "equipmentManifest", required: false, description: "Equipment inventory and condition" },
      { field: "cropYieldHistory", required: false, description: "3-year crop yield records" },
    ],
    minAssetValue: 25000,
    maxAssetValue: 1000000,
    defaultMaxParticipants: 200,
    typicalCommitmentRange: [100, 1500],
    assetTransferType: "ownership",
    legalJurisdiction: ["US", "NG", "ZA", "GH", "KE", "IN", "BR"],
    defaultCampaignDuration: 45,
    hallClass: "III",
    active: true,
  },

  ledgerenergy: {
    id: "ledgerenergy",
    name: "LedgerEnergy",
    shortName: "ENERGY",
    icon: Battery,
    color: "text-yellow-400",
    bgGradient: "from-yellow-500/10 to-amber-500/5",
    ringClass: "ring-yellow-500/30",
    description: "Power assets — solar, wind, battery, EV charging, microgrids. Power Purchase Agreements.",
    assetExamples: ["Solar Array", "Battery Bank", "Wind Share", "Grid Credit", "EV Charger Network"],
    verificationRequirements: [
      { field: "installationCert", required: true, description: "Certified installation and inspection" },
      { field: "gridConnection", required: true, description: "Grid connection agreement" },
      { field: "outputMetrics", required: true, description: "Historical energy output data" },
      { field: "maintenanceContract", required: false, description: "Active maintenance service contract" },
    ],
    minAssetValue: 30000,
    maxAssetValue: 2000000,
    defaultMaxParticipants: 250,
    typicalCommitmentRange: [100, 2000],
    assetTransferType: "ownership",
    legalJurisdiction: ["US", "DE", "AE", "SG", "IN", "BR"],
    defaultCampaignDuration: 45,
    hallClass: "I",
    active: true,
  },

  ledgersport: {
    id: "ledgersport",
    name: "LedgerSport",
    shortName: "SPORT",
    icon: Trophy,
    color: "text-red-500",
    bgGradient: "from-red-500/10 to-rose-500/5",
    ringClass: "ring-red-500/30",
    description: "Sports — football clubs, stadium boxes, training academies, franchises, sports venues. Direct operation and revenue share.",
    assetExamples: ["Football Club Stake", "Stadium Box", "Training Academy", "Sports Franchise", "Venue Lease"],
    verificationRequirements: [
      { field: "clubRegistration", required: true, description: "Sports club or franchise registration with governing body" },
      { field: "financialAudit", required: true, description: "Independent financial audit (last 2 seasons)" },
      { field: "stadiumLease", required: true, description: "Stadium lease agreement or ownership deed" },
      { field: "broadcastRights", required: false, description: "Broadcast and media rights documentation" },
      { field: "playerContractSummary", required: false, description: "Anonymized player contract obligations summary" },
    ],
    minAssetValue: 50000,
    maxAssetValue: 5000000,
    defaultMaxParticipants: 300,
    typicalCommitmentRange: [100, 3000],
    assetTransferType: "ownership",
    legalJurisdiction: ["US", "UK", "DE", "ES", "IT", "BR", "AE"],
    defaultCampaignDuration: 45,
    hallClass: "III",
    active: true,
  },
};

/* ============================================================
   ACTIVE / INACTIVE HELPERS
   ============================================================ */

export const ALL_VERTICALS = Object.values(VERTICAL_REGISTRY);
export const ACTIVE_VERTICALS = ALL_VERTICALS.filter((v) => v.active);
export const INACTIVE_VERTICALS = ALL_VERTICALS.filter((v) => !v.active);

export function isVerticalActive(id: string): boolean {
  return VERTICAL_REGISTRY[id]?.active ?? false;
}

/* ============================================================
   HELPERS
   ============================================================ */

export function getVertical(id: string): VerticalMeta | undefined {
  return VERTICAL_REGISTRY[id];
}

export function getAllVerticals(): VerticalMeta[] {
  return Object.values(VERTICAL_REGISTRY);
}

export function getVerticalIcon(id: string): LucideIcon | undefined {
  return VERTICAL_REGISTRY[id]?.icon;
}

export function getVerticalColor(id: string): string {
  return VERTICAL_REGISTRY[id]?.color || "text-slate-400";
}

export function getVerticalGradient(id: string): string {
  return VERTICAL_REGISTRY[id]?.bgGradient || "from-slate-500/10 to-slate-600/5";
}

export function getVerticalRing(id: string): string {
  return VERTICAL_REGISTRY[id]?.ringClass || "ring-slate-500/30";
}

export function isValidVertical(id: string): boolean {
  return id in VERTICAL_REGISTRY;
}

export function getVerticalHallClass(id: string): "I" | "II" | "III" | undefined {
  return VERTICAL_REGISTRY[id]?.hallClass;
}

/* ============================================================
   VALIDATION — 8th Ledger Model
   listedPrice = public target. trueCost = hidden acquisition cost.
   PIR = listedPrice - trueCost.
   ============================================================ */

export function validatePoolForVertical(
  verticalId: string,
  assetValue: number,
  listedPrice: number,
  maxParticipants: number
): {
  valid: boolean;
  error?: string;
  suggestions?: {
    maxParticipants: number;
    minCommitment: number;
    maxCommitment: number;
    campaignDuration: number;
  };
} {
  const vertical = getVertical(verticalId);
  if (!vertical) {
    return { valid: false, error: "Unknown vertical" };
  }

  if (!vertical.active) {
    return { valid: false, error: `${vertical.name} is not yet available for pool creation.` };
  }

  if (assetValue < vertical.minAssetValue) {
    return {
      valid: false,
      error: `${vertical.name} minimum asset value is $${vertical.minAssetValue.toLocaleString()}`,
    };
  }

  if (assetValue > vertical.maxAssetValue) {
    return {
      valid: false,
      error: `${vertical.name} maximum asset value is $${vertical.maxAssetValue.toLocaleString()}`,
    };
  }

  if (listedPrice < assetValue) {
    return {
      valid: false,
      error: "Listed price must be >= asset value (PIR cannot be negative)",
    };
  }

  if (maxParticipants > vertical.defaultMaxParticipants * 2) {
    return {
      valid: false,
      error: `Max participants too high for ${vertical.name}. Suggested: ${vertical.defaultMaxParticipants}`,
    };
  }

  return {
    valid: true,
    suggestions: {
      maxParticipants: maxParticipants || vertical.defaultMaxParticipants,
      minCommitment: Math.max(1, Math.floor(listedPrice * 0.0001)),
      maxCommitment: Math.floor(listedPrice * 0.05),
      campaignDuration: vertical.defaultCampaignDuration,
    },
  };
}

/* ============================================================
   POOL CREATION DEFAULTS — 8th Ledger
   ============================================================ */

export function getPoolDefaults(verticalId: string, assetValue: number, listedPrice: number) {
  const vertical = getVertical(verticalId);
  if (!vertical) return null;

  return {
    maxParticipants: vertical.defaultMaxParticipants,
    target: listedPrice,
    minCommitment: Math.max(1, Math.floor(listedPrice * 0.0001)),
    maxCommitment: Math.floor(listedPrice * 0.05),
    closesAtDays: vertical.defaultCampaignDuration,
    campaignDuration: vertical.defaultCampaignDuration,
    verificationRules: vertical.verificationRequirements,
    assetTransferType: vertical.assetTransferType,
    legalJurisdiction: vertical.legalJurisdiction,
    emojiSet: getDefaultEmojiSet(verticalId),
    hallClass: vertical.hallClass,
  };
}

function getDefaultEmojiSet(verticalId: string): string {
  const sets: Record<string, string> = {
    ledgerprop: "🏠🏢🏬🏭🏗️",
    ledgerauto: "🚗🚙🏎️🚐🛻",
    ledgeredu: "🎓📚🏫📝🎖️",
    ledgeraccess: "📡🔐🎟️🎭🎪",
    ledgerhealth: "🏥💊🩺❤️🧬",
    ledgerbiz: "🏪💼📈🏭🤝",
    ledgertech: "💻🖥️📱⚡🤖",
    ledgertravel: "✈️🌍🏝️🗺️🧳",
    ledgeragri: "🌾🚜🌽🌱🍃",
    ledgerenergy: "⚡🔋☀️💡🔌",
    ledgersport: "🏆⚽🏀🏈⚾",
  };
  return sets[verticalId] || "🏠🚗📱🎓🏥🏗️✈️🌾⚡";
}

/* ============================================================
   ASSET TRANSFER INSTRUCTIONS — 8th Ledger
   All committers become PAC holders. No winners/losers.
   ============================================================ */

export function getTransferInstructions(
  verticalId: string,
  ledgerId: string
): string {
  const vertical = getVertical(verticalId);
  if (!vertical) return "Contact 8th Ledger support for transfer.";

  switch (vertical.assetTransferType) {
    case "ownership":
      return `Legal ownership registered via SPV. Title deed held by 8th Ledger. PAC holders govern through democratic hall votes.`;
    case "lease":
      return `Exclusive lease rights assigned to the hall via SPV. 8th Ledger manages tenant relations. PAC holders vote on lease terms.`;
    case "license":
      return `Transferable license issued to the hall SPV. All PAC holders retain governance rights and dividend entitlement.`;
    case "hours":
      return `Hour credits held in hall treasury. Booked through 8th Ledger portal. PAC holders vote on usage policy.`;
    default:
      return "Standard 8th Ledger protocol transfer initiated via SPV.";
  }
}

/* ============================================================
   PIR ALLOCATION — 6-Pillar Protocol Infrastructure Reserve
   ============================================================ */

export function getPirAllocationRates(verticalId: string): {
  shieldPct: number;
  sealPct: number;
  forgePct: number;
  spirePct: number;
  vanguardPct: number;
  sanctuaryPct: number;
} {
  const defaults = {
    shieldPct: 0.25,
    sealPct: 0.20,
    forgePct: 0.20,
    spirePct: 0.15,
    vanguardPct: 0.12,
    sanctuaryPct: 0.08,
  };

  const overrides: Record<string, typeof defaults> = {
    ledgerhealth: {
      shieldPct: 0.30, sealPct: 0.20, forgePct: 0.15,
      spirePct: 0.15, vanguardPct: 0.12, sanctuaryPct: 0.08,
    },
    ledgertravel: {
      shieldPct: 0.28, sealPct: 0.20, forgePct: 0.17,
      spirePct: 0.15, vanguardPct: 0.12, sanctuaryPct: 0.08,
    },
    ledgerenergy: {
      shieldPct: 0.20, sealPct: 0.20, forgePct: 0.25,
      spirePct: 0.15, vanguardPct: 0.12, sanctuaryPct: 0.08,
    },
    ledgeragri: {
      shieldPct: 0.22, sealPct: 0.20, forgePct: 0.25,
      spirePct: 0.15, vanguardPct: 0.10, sanctuaryPct: 0.08,
    },
    ledgersport: {
      shieldPct: 0.30, sealPct: 0.20, forgePct: 0.20,
      spirePct: 0.12, vanguardPct: 0.10, sanctuaryPct: 0.08,
    },
  };

  return overrides[verticalId] || defaults;
}

/* ============================================================
   HALL CLASS HELPERS — 8th Ledger
   ============================================================ */

export function getHallClassDescription(hallClass: "I" | "II" | "III"): string {
  const descriptions = {
    I: "Passive — 8th Ledger manages everything. Minimal hall input. Vendor-operated only.",
    II: "Managed — Hall hires/approves operators. 8th Ledger executes. Limited staff oversight.",
    III: "Active — Hall runs operations daily. 8th Ledger provides infrastructure. Full staffing.",
  };
  return descriptions[hallClass] || "Unknown class";
}

export function getVerticalsByHallClass(hallClass: "I" | "II" | "III"): VerticalMeta[] {
  return ALL_VERTICALS.filter((v) => v.hallClass === hallClass);
}