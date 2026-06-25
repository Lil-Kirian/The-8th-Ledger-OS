/* ============================================================
   8TH LEDGER — MOCK DATA & CONSTANTS
   Aligned to V3.2 Schema
   ============================================================ */

export type PoolStatus = "filling" | "filled" | "forged" | "active" | "dormant" | "sold" | "dissolved";

export type UserTier = "visitor" | "sovereign" | "verified" | "whale";
export type UserRole = "user" | "admin";

export interface User {
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  passwordHash: string;
  trustScore: number;
  tier: UserTier;
  role: UserRole;
  isPrimaryAdmin: boolean;
  ledgerBalance: number;
  creditPool: number;
  totalBurned: number;
  forgesCompleted: number;
  referrals: number;
  createdAt: string;
}

export interface Pool {
  id: string;
  verticalId: string;
  name: string;
  assetValue: number;
  trueCost: number;
  listedPrice: number;
  committed: number;
  target: number;
  participants: number;
  maxParticipants: number;
  status: PoolStatus;
  hallClass: "I" | "II" | "III";
  createdAt: string;
  closesAt: string;
  country: string;
  description: string;
  creatorId: string;
  pirGenerated: number;
}

export interface Vertical {
  id: string;
  name: string;
  color: string;
  bgGradient: string;
  description: string;
  totalPools: number;
  activePools: number;
  totalValue: number;
  hallClass: "I" | "II" | "III";
}

export interface Tier {
  level: number;
  name: string;
  minTrust: number;
  maxTrust: number;
  color: string;
  bgGradient: string;
  perks: string[];
  poolAccess: string;
  maxCommitment: number;
  forgeCost: number;
}

export interface KnotMember {
  id: string;
  ledgerId: string;
  displayName: string;
  country: string;
  tier: UserTier;
  joinedAt: string;
  totalCommitted: number;
  poolsWon: number;
  trustScore: number;
  referrals: number;
  depth: number;
  status: "active" | "idle" | "churned";
  referredBy?: string;
}

export interface OracleLeader {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  totalPoints: number;
  streak: number;
  tier: UserTier;
}

export interface CountryStat {
  country: string;
  participants: number;
  pools: number;
  committed: number;
  won: number;
  pir: number;
  growth: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  type: "pool_created" | "forge_executed" | "pir_allocated" | "ledger_burned" | "withdrawal" | "tier_upgrade" | "revenue_distributed" | "closure_liquidation";
  description: string;
  amount?: number;
  txHash: string;
}

/* ============================================================
   VERTICALS — 10 Sovereign Asset Classes (8th Ledger)
   ============================================================ */

export const VERTICALS: Vertical[] = [
  { id: "ledgerprop", name: "LedgerProp", color: "text-amber-400", bgGradient: "from-amber-500/10 to-orange-500/5", description: "Fractional real estate — apartments, villas, commercial units.", totalPools: 142, activePools: 23, totalValue: 89000000, hallClass: "I" },
  { id: "ledgerauto", name: "LedgerAuto", color: "text-cyan-400", bgGradient: "from-cyan-500/10 to-blue-500/5", description: "Vehicles — luxury cars, EV fleets, commercial trucks.", totalPools: 89, activePools: 14, totalValue: 34000000, hallClass: "I" },
  { id: "ledgeredu", name: "LedgerEdu", color: "text-violet-400", bgGradient: "from-violet-500/10 to-purple-500/5", description: "Education — tuition, certifications, bootcamps, degrees.", totalPools: 56, activePools: 9, totalValue: 12000000, hallClass: "II" },
  { id: "ledgeraccess", name: "LedgerAccess", color: "text-emerald-400", bgGradient: "from-emerald-500/10 to-teal-500/5", description: "Exclusive access — events, clubs, VIP experiences, backstage.", totalPools: 34, activePools: 7, totalValue: 5600000, hallClass: "I" },
  { id: "ledgerhealth", name: "LedgerHealth", color: "text-rose-400", bgGradient: "from-rose-500/10 to-pink-500/5", description: "Wellness — surgeries, treatments, gym memberships, therapy.", totalPools: 67, activePools: 11, totalValue: 18000000, hallClass: "II" },
  { id: "ledgerbiz", name: "LedgerBiz", color: "text-orange-400", bgGradient: "from-orange-500/10 to-red-500/5", description: "Business assets — machinery, inventory, office space, IP.", totalPools: 45, activePools: 8, totalValue: 22000000, hallClass: "III" },
  { id: "ledgertech", name: "LedgerTech", color: "text-indigo-400", bgGradient: "from-indigo-500/10 to-blue-500/5", description: "Technology — GPUs, servers, software licenses, hardware.", totalPools: 78, activePools: 16, totalValue: 41000000, hallClass: "III" },
  { id: "ledgertravel", name: "LedgerTravel", color: "text-sky-400", bgGradient: "from-sky-500/10 to-cyan-500/5", description: "Fractional aviation — private jet hours, airline shares, lounges.", totalPools: 28, activePools: 5, totalValue: 15000000, hallClass: "II" },
  { id: "ledgeragri", name: "LedgerAgri", color: "text-lime-400", bgGradient: "from-lime-500/10 to-green-500/5", description: "Agricultural assets — farmland, equipment, crop shares, livestock.", totalPools: 52, activePools: 10, totalValue: 28000000, hallClass: "III" },
  { id: "ledgerenergy", name: "LedgerEnergy", color: "text-yellow-400", bgGradient: "from-yellow-500/10 to-amber-500/5", description: "Energy assets — solar panels, battery storage, wind shares, grid credits.", totalPools: 41, activePools: 8, totalValue: 35000000, hallClass: "I" },
];

/* ============================================================
   TIERS — Sovereignty Ladder (UI display tiers, 1-5)
   ============================================================ */

export const TIERS: Tier[] = [
  { level: 1, name: "Novice", minTrust: 0, maxTrust: 199, color: "text-slate-400", bgGradient: "from-slate-500/10 to-slate-600/5", perks: ["Access to pools up to $500", "1 active pool limit", "Standard consensus weight"], poolAccess: "Entry Pools", maxCommitment: 500, forgeCost: 0 },
  { level: 2, name: "Adept", minTrust: 200, maxTrust: 399, color: "text-sky-400", bgGradient: "from-sky-500/10 to-blue-600/5", perks: ["Access to pools up to $2,000", "3 active pools", "+10% consensus weight", "Priority filling"], poolAccess: "Standard Pools", maxCommitment: 2000, forgeCost: 50 },
  { level: 3, name: "Vanguard", minTrust: 400, maxTrust: 699, color: "text-indigo-400", bgGradient: "from-indigo-500/10 to-violet-600/5", perks: ["Access to pools up to $10,000", "5 active pools", "+25% consensus weight", "Early pool preview", "Oracle forecast access"], poolAccess: "Premium Pools", maxCommitment: 10000, forgeCost: 150 },
  { level: 4, name: "Archon", minTrust: 700, maxTrust: 949, color: "text-violet-400", bgGradient: "from-violet-500/10 to-purple-600/5", perks: ["Access to pools up to $50,000", "8 active pools", "+50% consensus weight", "Private pools invite", "Dividend share", "Governance vote"], poolAccess: "Elite Pools", maxCommitment: 50000, forgeCost: 400 },
  { level: 5, name: "Sovereign", minTrust: 950, maxTrust: 1000, color: "text-amber-400", bgGradient: "from-amber-500/10 to-orange-600/5", perks: ["Unlimited pool access", "Unlimited active pools", "+100% consensus weight", "Admin pool access", "Protocol revenue share", "Veto power on disputes", "Custom pool creation"], poolAccess: "Sovereign Pools", maxCommitment: 999999, forgeCost: 1000 },
];

/* ============================================================
   COUNTRIES — 195 for Oracle Forecasts
   ============================================================ */

export const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium",
  "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
  "Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad",
  "Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
  "Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany",
  "Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali",
  "Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia",
  "Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand",
  "Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines",
  "Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone",
  "Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan",
  "Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania",
  "Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

/* ============================================================
   POOLS — Live Protocol Pools (8th Ledger)
   ============================================================ */

export const POOLS: Pool[] = [
  { id: "prop-001", verticalId: "ledgerprop", name: "Lagos Marina Penthouse", assetValue: 450000, trueCost: 450000, listedPrice: 900000, committed: 312000, target: 900000, participants: 312, maxParticipants: 450, status: "filling", hallClass: "I", createdAt: "2026-05-01T08:00:00Z", closesAt: "2026-06-15T00:00:00Z", pirGenerated: 0, country: "Nigeria", description: "3-bedroom penthouse overlooking Lagos Marina. Cooperative ownership via PAC.", creatorId: "ADMIN" },
  { id: "prop-002", verticalId: "ledgerprop", name: "Abuja Tech Hub Office", assetValue: 180000, trueCost: 180000, listedPrice: 360000, committed: 156000, target: 360000, participants: 156, maxParticipants: 200, status: "filling", hallClass: "I", createdAt: "2026-05-05T10:00:00Z", closesAt: "2026-06-10T00:00:00Z", pirGenerated: 0, country: "Nigeria", description: "200sqm commercial space in Abuja's central tech district.", creatorId: "ADMIN" },
  { id: "prop-003", verticalId: "ledgerprop", name: "Victoria Island Duplex", assetValue: 320000, trueCost: 320000, listedPrice: 640000, committed: 640000, target: 640000, participants: 450, maxParticipants: 450, status: "filled", hallClass: "I", createdAt: "2026-04-15T11:00:00Z", closesAt: "2026-05-20T00:00:00Z", pirGenerated: 0, country: "Nigeria", description: "5-bedroom duplex in Victoria Island. Pool filled. Ready for forge.", creatorId: "ADMIN" },
  { id: "auto-001", verticalId: "ledgerauto", name: "Tesla Model S Plaid", assetValue: 95000, trueCost: 95000, listedPrice: 190000, committed: 72000, target: 190000, participants: 144, maxParticipants: 200, status: "filling", hallClass: "I", createdAt: "2026-05-05T10:00:00Z", closesAt: "2026-06-01T00:00:00Z", pirGenerated: 0, country: "United States", description: "2026 Tesla Model S Plaid. Midnight Silver. Full ownership via SPV.", creatorId: "ADMIN" },
  { id: "auto-002", verticalId: "ledgerauto", name: "Mercedes G-Wagon AMG", assetValue: 145000, trueCost: 145000, listedPrice: 290000, committed: 290000, target: 290000, participants: 200, maxParticipants: 200, status: "forged", hallClass: "I", createdAt: "2026-04-20T08:00:00Z", closesAt: "2026-05-18T00:00:00Z", pirGenerated: 145000, country: "Germany", description: "2025 Mercedes-AMG G63. Forged into cooperative ownership.", creatorId: "ADMIN" },
  { id: "edu-001", verticalId: "ledgeredu", name: "MIT Blockchain Certificate", assetValue: 12000, trueCost: 12000, listedPrice: 24000, committed: 8400, target: 24000, participants: 84, maxParticipants: 120, status: "filling", hallClass: "II", createdAt: "2026-05-10T09:00:00Z", closesAt: "2026-06-20T00:00:00Z", pirGenerated: 0, country: "United States", description: "Full tuition + certification for MIT Professional Education Blockchain course.", creatorId: "ADMIN" },
  { id: "trav-001", verticalId: "ledgertravel", name: "NetJets 25-Hour Card", assetValue: 185000, trueCost: 185000, listedPrice: 370000, committed: 148000, target: 370000, participants: 74, maxParticipants: 100, status: "filling", hallClass: "II", createdAt: "2026-05-12T11:00:00Z", closesAt: "2026-06-05T00:00:00Z", pirGenerated: 0, country: "UAE", description: "25 hours on Citation Latitude. Global access. Cooperative ownership.", creatorId: "ADMIN" },
  { id: "tech-001", verticalId: "ledgertech", name: "NVIDIA H100 Cluster (8x)", assetValue: 280000, trueCost: 280000, listedPrice: 560000, committed: 196000, target: 560000, participants: 98, maxParticipants: 150, status: "filling", hallClass: "III", createdAt: "2026-05-12T09:00:00Z", closesAt: "2026-06-12T00:00:00Z", pirGenerated: 0, country: "United States", description: "8x NVIDIA H100 GPUs. 640GB HBM3 memory. Cooperative ownership via SPV.", creatorId: "ADMIN" },
  { id: "health-001", verticalId: "ledgerhealth", name: "Full Body Wellness Year", assetValue: 25000, trueCost: 25000, listedPrice: 50000, committed: 20000, target: 50000, participants: 80, maxParticipants: 100, status: "filling", hallClass: "II", createdAt: "2026-05-12T08:20:00Z", closesAt: "2026-06-08T00:00:00Z", pirGenerated: 0, country: "United Kingdom", description: "12-month premium wellness package. Nutritionist, trainer, therapy, medical.", creatorId: "ADMIN" },
  { id: "acc-001", verticalId: "ledgeraccess", name: "Davos 2027 All-Access", assetValue: 35000, trueCost: 35000, listedPrice: 70000, committed: 28000, target: 70000, participants: 56, maxParticipants: 80, status: "filling", hallClass: "I", createdAt: "2026-05-10T07:30:00Z", closesAt: "2026-05-30T00:00:00Z", pirGenerated: 0, country: "Switzerland", description: "World Economic Forum Davos 2027. VIP pass, hotel, dinners, private sessions.", creatorId: "ADMIN" },
  { id: "biz-001", verticalId: "ledgerbiz", name: "Industrial 3D Printer Setup", assetValue: 85000, trueCost: 85000, listedPrice: 170000, committed: 68000, target: 170000, participants: 68, maxParticipants: 100, status: "filling", hallClass: "III", createdAt: "2026-05-12T09:00:00Z", closesAt: "2026-06-03T00:00:00Z", pirGenerated: 0, country: "Germany", description: "Full industrial 3D printing station. Printer, materials, training, support.", creatorId: "ADMIN" },
  { id: "agri-001", verticalId: "ledgeragri", name: "Nairobi Solar Farm", assetValue: 100000, trueCost: 100000, listedPrice: 200000, committed: 156000, target: 200000, participants: 312, maxParticipants: 450, status: "filling", hallClass: "III", createdAt: "2026-06-01T08:00:00Z", closesAt: "2026-07-01T00:00:00Z", pirGenerated: 0, country: "Kenya", description: "Solar farm in Kajiado County. 8-12% annual revenue. Cooperative ownership.", creatorId: "ADMIN" },
  { id: "energy-001", verticalId: "ledgerenergy", name: "Lagos Microgrid Station", assetValue: 150000, trueCost: 150000, listedPrice: 300000, committed: 120000, target: 300000, participants: 200, maxParticipants: 250, status: "filling", hallClass: "I", createdAt: "2026-06-05T10:00:00Z", closesAt: "2026-07-05T00:00:00Z", pirGenerated: 0, country: "Nigeria", description: "Community microgrid with battery storage. Power Purchase Agreement ready.", creatorId: "ADMIN" },
];

/* ============================================================
   USERS — Sovereign Identities (8th Ledger)
   ============================================================ */

export const USERS: User[] = [
  { ledgerId: "LED-8X2P-9LQ3", displayName: "The Architect", email: "architect@8thledger.io", country: "Cayman Islands", passwordHash: "hash_mock", trustScore: 847, tier: "verified", role: "admin", isPrimaryAdmin: true, ledgerBalance: 1240, creditPool: 4850, totalBurned: 200, forgesCompleted: 2, referrals: 12, createdAt: "2026-03-15T08:00:00Z" },
  { ledgerId: "LED-ADMIN-001", displayName: "The Warden", email: "warden@8thledger.io", country: "Cayman Islands", passwordHash: "hash_mock", trustScore: 950, tier: "whale", role: "admin", isPrimaryAdmin: false, ledgerBalance: 5000, creditPool: 10000, totalBurned: 0, forgesCompleted: 0, referrals: 0, createdAt: "2026-03-15T08:00:00Z" },
  { ledgerId: "LED-USER-001", displayName: "Demo Subject", email: "demo@8thledger.io", country: "United States", passwordHash: "hash_mock", trustScore: 400, tier: "sovereign", role: "user", isPrimaryAdmin: false, ledgerBalance: 500, creditPool: 2000, totalBurned: 50, forgesCompleted: 1, referrals: 3, createdAt: "2026-04-01T10:00:00Z" },
];

/* ============================================================
   KNOT — Network
   ============================================================ */

export const KNOT_STATS = {
  directReferrals: 12,
  networkDepth: 3,
  totalNetwork: 47,
  activeNetwork: 38,
  totalRewards: 2840,
  pendingRewards: 450,
  inviteCode: "LED-8X2P-ALPHA",
  inviteLink: "https://8thledger.io/enter?ref=LED-8X2P-ALPHA",
  codeUses: 12,
  codeMax: 50,
};

export const KNOT_MEMBERS: KnotMember[] = [
  { id: "m-001", ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "Nigeria", tier: "verified", joinedAt: "2026-04-20T10:00:00Z", totalCommitted: 8500, poolsWon: 0, trustScore: 620, referrals: 4, depth: 1, status: "active", referredBy: "LED-8X2P-9LQ3" },
  { id: "m-002", ledgerId: "LED-1P4Q-8L3N", displayName: "Sarah", country: "United Kingdom", tier: "sovereign", joinedAt: "2026-04-22T14:30:00Z", totalCommitted: 3200, poolsWon: 0, trustScore: 310, referrals: 2, depth: 1, status: "active", referredBy: "LED-8X2P-9LQ3" },
  { id: "m-003", ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "China", tier: "whale", joinedAt: "2026-04-25T09:15:00Z", totalCommitted: 24000, poolsWon: 0, trustScore: 780, referrals: 7, depth: 1, status: "active", referredBy: "LED-8X2P-9LQ3" },
  { id: "m-004", ledgerId: "LED-2V8W-1X4Y", displayName: "Maria", country: "Brazil", tier: "sovereign", joinedAt: "2026-05-01T11:00:00Z", totalCommitted: 1800, poolsWon: 0, trustScore: 250, referrals: 0, depth: 2, status: "active", referredBy: "LED-3X9A-7K2M" },
  { id: "m-005", ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "United States", tier: "verified", joinedAt: "2026-05-05T16:45:00Z", totalCommitted: 12000, poolsWon: 0, trustScore: 550, referrals: 1, depth: 2, status: "active", referredBy: "LED-3X9A-7K2M" },
  { id: "m-006", ledgerId: "LED-4D6E-7F8G", displayName: "Aisha", country: "UAE", tier: "visitor", joinedAt: "2026-05-10T08:20:00Z", totalCommitted: 400, poolsWon: 0, trustScore: 120, referrals: 0, depth: 2, status: "idle", referredBy: "LED-3X9A-7K2M" },
  { id: "m-007", ledgerId: "LED-0H2I-3J4K", displayName: "Kofi", country: "Ghana", tier: "sovereign", joinedAt: "2026-05-12T13:10:00Z", totalCommitted: 2100, poolsWon: 0, trustScore: 280, referrals: 1, depth: 3, status: "active", referredBy: "LED-1P4Q-8L3N" },
  { id: "m-008", ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "Japan", tier: "whale", joinedAt: "2026-05-15T07:30:00Z", totalCommitted: 35000, poolsWon: 0, trustScore: 820, referrals: 5, depth: 1, status: "active", referredBy: "LED-8X2P-9LQ3" },
];

/* ============================================================
   ORACLE — Standing Leaderboard (No Money, Just Foresight)
   ============================================================ */

export const ORACLE_LEADERBOARD: OracleLeader[] = [
  { rank: 1, ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "Japan", correctPredictions: 23, totalPredictions: 28, accuracy: 82.1, totalPoints: 1840, streak: 7, tier: "whale" },
  { rank: 2, ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "China", correctPredictions: 19, totalPredictions: 25, accuracy: 76.0, totalPoints: 1520, streak: 4, tier: "whale" },
  { rank: 3, ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "Nigeria", correctPredictions: 17, totalPredictions: 24, accuracy: 70.8, totalPoints: 1360, streak: 3, tier: "verified" },
  { rank: 4, ledgerId: "LED-1P4Q-8L3N", displayName: "Sarah", country: "United Kingdom", correctPredictions: 14, totalPredictions: 22, accuracy: 63.6, totalPoints: 1120, streak: 2, tier: "sovereign" },
  { rank: 5, ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "United States", correctPredictions: 12, totalPredictions: 20, accuracy: 60.0, totalPoints: 960, streak: 1, tier: "verified" },
  { rank: 6, ledgerId: "LED-2V8W-1X4Y", displayName: "Maria", country: "Brazil", correctPredictions: 10, totalPredictions: 18, accuracy: 55.6, totalPoints: 800, streak: 0, tier: "sovereign" },
  { rank: 7, ledgerId: "LED-8X2P-9LQ3", displayName: "The Architect", country: "Cayman Islands", correctPredictions: 9, totalPredictions: 15, accuracy: 60.0, totalPoints: 720, streak: 2, tier: "verified" },
];

/* ============================================================
   TREASURY / 8TH LEDGER — Protocol State
   ============================================================ */

export const ECONOMIC_FLOWS = [
  { label: "Total Committed", amount: 12400000, color: "text-amber-400", icon: "ArrowUpRight" },
  { label: "PIR Allocated", amount: 6200000, color: "text-indigo-400", icon: "TrendingUp" },
  { label: "Revenue Distributed", amount: 890000, color: "text-emerald-400", icon: "ArrowDownRight" },
  { label: "Assets Forged", amount: 3100000, color: "text-violet-400", icon: "Shield" },
  { label: "LED Burned", amount: 124000, color: "text-red-400", icon: "Flame" },
  { label: "8th Ledger Tithe", amount: 178000, color: "text-slate-400", icon: "Lock" },
];

export const COUNTRY_METRICS: CountryStat[] = [
  { country: "Nigeria", participants: 2340, pools: 12, committed: 3400000, won: 0, pir: 445000, growth: 23.4 },
  { country: "United States", participants: 1870, pools: 8, committed: 4200000, won: 0, pir: 680000, growth: 18.7 },
  { country: "Germany", participants: 1240, pools: 6, committed: 2800000, won: 0, pir: 420000, growth: 15.2 },
  { country: "UAE", participants: 980, pools: 5, committed: 2100000, won: 0, pir: 310000, growth: 31.2 },
  { country: "China", participants: 1560, pools: 7, committed: 3100000, won: 0, pir: 380000, growth: 12.8 },
  { country: "India", participants: 1890, pools: 9, committed: 2600000, won: 0, pir: 290000, growth: 19.5 },
  { country: "Singapore", participants: 850, pools: 4, committed: 1900000, won: 0, pir: 250000, growth: 28.9 },
  { country: "Japan", participants: 760, pools: 5, committed: 1600000, won: 0, pir: 210000, growth: 14.3 },
  { country: "United Kingdom", participants: 920, pools: 4, committed: 1800000, won: 0, pir: 230000, growth: 16.1 },
  { country: "Brazil", participants: 670, pools: 3, committed: 1200000, won: 0, pir: 150000, growth: 9.2 },
  { country: "Kenya", participants: 520, pools: 2, committed: 800000, won: 0, pir: 120000, growth: 14.5 },
];

export const AUDIT_LOG: AuditEntry[] = [
  { id: "aud-001", timestamp: "2026-05-24T22:00:00Z", type: "forge_executed", description: "Pool forged: Mercedes G-Wagon AMG — cooperative ownership activated", amount: 290000, txHash: "PROTO-FORGE-001" },
  { id: "aud-002", timestamp: "2026-05-24T20:30:00Z", type: "pir_allocated", description: "PIR allocated to 6 pillars for Hall #2847 — The Shield, The Seal, The Forge, The Spire, The Vanguard, The Sanctuary", amount: 145000, txHash: "PROTO-PIR-042" },
  { id: "aud-003", timestamp: "2026-05-24T18:15:00Z", type: "ledger_burned", description: "Sovereign forged to Tier 5 — 1000 LED permanently burned", amount: 1000, txHash: "PROTO-BURN-089" },
  { id: "aud-004", timestamp: "2026-05-24T16:00:00Z", type: "pool_created", description: "NVIDIA H100 Cluster (8x) pool created in LedgerTech", amount: 560000, txHash: "PROTO-POOL-156" },
  { id: "aud-005", timestamp: "2026-05-24T14:45:00Z", type: "withdrawal", description: "Protocol withdrawal to 8th Ledger operations wallet", amount: 50000, txHash: "PROTO-WITHDRAW-023" },
  { id: "aud-006", timestamp: "2026-05-24T12:00:00Z", type: "revenue_distributed", description: "Monthly dividend distribution — Hall #2847. 20% tithe to 8th Ledger. Net distributed by ownership %.", amount: 2560, txHash: "PROTO-DIVIDEND-001" },
];