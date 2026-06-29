"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Home, Car, GraduationCap, Lock, Stethoscope, Briefcase, Wifi,
  Plane, Sprout, Sun, Activity, ChevronRight, Wallet, ArrowUpRight,
  CheckCircle2, Loader2, Crown, Wrench, Scroll,
  AlertTriangle, TrendingUp, HeartPulse, Shield, MessageSquare,
  BookOpen, Vault, Store, Hammer, Landmark, ChevronLeft, Sparkles,
  Radio, Ban, FileText, Users, Clock,
  Cog, Package, Swords,
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type HallStatus = "ghost" | "live" | "mature" | "dormant" | "dissolved";

interface Hall {
  id: string;
  name: string;
  shortName: string;
  icon: React.ElementType;
  color: string;
  border: string;
  bg: string;
  glow: string;
  gradient: string;
  accentGradient: string;
  members: number;
  online: number;
  joined: boolean;
  status: HallStatus;
  description: string;
  assetImage: string;
  emojiSet: string[];
  trueCost: number;
  listedPrice: number;
  pir: number;
  fillPercent: number;
  myOwnership: number;
  myDividendMonthly: number;
  activeProposals: number;
  pacCount: number;
  location: string;
  category: string;
  treasuryBalance: number;
  monthlyRevenue: number;
  totalCommitted: number;
  target2X: number;
  spvName: string;
  sriScore: number;
  ahgiScore: number;
  hallClass?: string;
  closureStatus?: string;
  // PHASE 4: Universal feature flags
  forgeEnabled: boolean;
  inventoryEnabled: boolean;
  ihcpBalance: number;
}

interface CabinetMember {
  role: string;
  roleLabel: string;
  displayName?: string;
  ledgerId?: string;
}

interface LedgerUpdate {
  id: string;
  type: string;
  title: string;
  content: string;
  amount?: number;
  createdAt: string;
}

/* ============================================================
   API RESPONSE TYPES (for loadHall)
   ============================================================ */
interface ApiOwnership {
  user?: { ledgerId?: string };
  ownershipPercent?: number;
}

interface ApiProposal {
  status?: string;
}

interface ApiRevenueLog {
  communityNet?: number;
  netAfterPayroll?: number;
}

interface ApiPool {
  verticalId?: string;
  description?: string;
  assetImages?: string;
  emojiSet?: string;
  trueCost?: number;
  listedPrice?: number;
  surplus?: number;
  pir?: number;
  target?: number;
  committed?: number;
  spv?: { name?: string };
}

interface ApiHallTreasury {
  balance?: number;
}

interface ApiExecutiveCabinet {
  speakerId?: string | null;
  treasurerId?: string | null;
  wardenId?: string | null;
  scribeId?: string | null;
}

interface ApiHallResponse {
  id: string;
  name: string;
  status?: string;
  pool?: ApiPool;
  _count?: { ownerships?: number };
  ownerships?: ApiOwnership[];
  proposals?: ApiProposal[];
  revenueLogs?: ApiRevenueLog[];
  hallTreasury?: ApiHallTreasury;
  executiveCabinet?: ApiExecutiveCabinet | null;
  eighthLedgerUpdates?: LedgerUpdate[];
  sriScore?: number;
  ahgiScore?: number;
  hallClass?: string;
  closureStatus?: string;
  // PHASE 4: Universal feature flags
  forgeEnabled?: boolean;
  inventoryEnabled?: boolean;
  ihcpBalance?: number;
}

/* ============================================================
   ICON & COLOR MAPS
   ============================================================ */
const VERTICAL_ICON_MAP: Record<string, React.ElementType> = {
  ledgerprop: Home,
  ledgerauto: Car,
  ledgeredu: GraduationCap,
  ledgeraccess: Lock,
  ledgerhealth: Stethoscope,
  ledgerbiz: Briefcase,
  ledgertech: Wifi,
  ledgertravel: Plane,
  ledgeragri: Sprout,
  ledgerenergy: Sun,
  ledgersport: Swords,
};

const VERTICAL_COLOR_MAP: Record<
  string,
  {
    color: string;
    border: string;
    bg: string;
    glow: string;
    gradient: string;
    accentGradient: string;
  }
> = {
  ledgerprop: {
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/20",
    gradient: "from-amber-500/5 to-orange-500/5",
    accentGradient: "from-amber-400 to-orange-500",
  },
  ledgerauto: {
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/10",
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-500/5 to-blue-500/5",
    accentGradient: "from-cyan-400 to-blue-500",
  },
  ledgeredu: {
    color: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/10",
    glow: "shadow-violet-500/20",
    gradient: "from-violet-500/5 to-purple-500/5",
    accentGradient: "from-violet-400 to-purple-500",
  },
  ledgeraccess: {
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
    gradient: "from-emerald-500/5 to-teal-500/5",
    accentGradient: "from-emerald-400 to-teal-500",
  },
  ledgerhealth: {
    color: "text-rose-400",
    border: "border-rose-500/20",
    bg: "bg-rose-500/10",
    glow: "shadow-rose-500/20",
    gradient: "from-rose-500/5 to-pink-500/5",
    accentGradient: "from-rose-400 to-pink-500",
  },
  ledgerbiz: {
    color: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/10",
    glow: "shadow-orange-500/20",
    gradient: "from-orange-500/5 to-red-500/5",
    accentGradient: "from-orange-400 to-red-500",
  },
  ledgertech: {
    color: "text-indigo-400",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/10",
    glow: "shadow-indigo-500/20",
    gradient: "from-indigo-500/5 to-blue-500/5",
    accentGradient: "from-indigo-400 to-blue-500",
  },
  ledgertravel: {
    color: "text-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/10",
    glow: "shadow-sky-500/20",
    gradient: "from-sky-500/5 to-cyan-500/5",
    accentGradient: "from-sky-400 to-cyan-500",
  },
  ledgeragri: {
    color: "text-green-400",
    border: "border-green-500/20",
    bg: "bg-green-500/10",
    glow: "shadow-green-500/20",
    gradient: "from-green-500/5 to-emerald-500/5",
    accentGradient: "from-green-400 to-emerald-500",
  },
  ledgerenergy: {
    color: "text-yellow-400",
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/10",
    glow: "shadow-yellow-500/20",
    gradient: "from-yellow-500/5 to-amber-500/5",
    accentGradient: "from-yellow-400 to-amber-500",
  },
  ledgersport: {
    color: "text-rose-400",
    border: "border-rose-500/20",
    bg: "bg-rose-500/10",
    glow: "shadow-rose-500/20",
    gradient: "from-rose-500/5 to-pink-500/5",
    accentGradient: "from-rose-400 to-pink-500",
  },
};

const STATUS_CONFIG: Record<
  HallStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    pulse: boolean;
  }
> = {
  ghost: {
    label: "Ghost",
    icon: Lock,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    pulse: false,
  },
  live: {
    label: "Live",
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    pulse: true,
  },
  mature: {
    label: "Mature",
    icon: CheckCircle2,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    pulse: false,
  },
  dormant: {
    label: "Dormant",
    icon: AlertTriangle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    pulse: false,
  },
  dissolved: {
    label: "Dissolved",
    icon: Ban,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    pulse: false,
  },
};

const SRI_TIER_MAP = [
  {
    min: 90,
    label: "Platinum",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Crown,
  },
  {
    min: 75,
    label: "Gold",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    icon: Sparkles,
  },
  {
    min: 60,
    label: "Silver",
    color: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: Shield,
  },
  {
    min: 40,
    label: "Bronze",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: Activity,
  },
  {
    min: 0,
    label: "At Risk",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: AlertTriangle,
  },
];

const AHGI_STATUS_MAP = [
  {
    min: 80,
    label: "Thriving",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    min: 60,
    label: "Healthy",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    min: 40,
    label: "Stagnant",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    min: 20,
    label: "Declining",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    min: 0,
    label: "Critical",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
];

/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getSriTier(score: number) {
  return (
    SRI_TIER_MAP.find((t) => score >= t.min) ||
    SRI_TIER_MAP[SRI_TIER_MAP.length - 1]
  );
}

function getAhgiStatus(score: number) {
  return (
    AHGI_STATUS_MAP.find((s) => score >= s.min) ||
    AHGI_STATUS_MAP[AHGI_STATUS_MAP.length - 1]
  );
}

/* ============================================================
   NAV TABS — 8TH LEDGER STRUCTURE (DYNAMIC)
   ============================================================ */
function getHallNav(hall: Hall) {
  const base = [
    { id: "dashboard", label: "Dashboard", href: "", icon: Activity },
    {
      id: "sovereign-stream",
      label: "Sovereign Stream",
      href: "/sovereign-stream",
      icon: MessageSquare,
    },
    { id: "cabinet", label: "Cabinet", href: "/cabinet", icon: Crown },
    { id: "ledger", label: "Ledger", href: "/ledger", icon: BookOpen },
    { id: "vault", label: "Vault", href: "/vault", icon: Vault },
    { id: "assets", label: "Assets", href: "/assets", icon: Landmark },
    {
      id: "marketplace",
      label: "Marketplace",
      href: "/marketplace",
      icon: Store,
    },
  ];

  // PHASE 4: Operations tab appears if forge OR inventory enabled
  if (hall.forgeEnabled || hall.inventoryEnabled) {
    base.push({
      id: "operations",
      label: "Operations",
      href: "/operations",
      icon: Cog,
    });
  }

  // PHASE 4: Inventory tab appears if inventory enabled
  if (hall.inventoryEnabled) {
    base.push({
      id: "inventory",
      label: "Inventory",
      href: "/inventory",
      icon: Package,
    });
  }

  // PHASE 4: Forge tab appears if forge enabled
  if (hall.forgeEnabled) {
    base.push({
      id: "forge",
      label: "Forge",
      href: "/forge",
      icon: Hammer,
    });
  }

  return base;
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
function TreasuryCard({ hall }: { hall: Hall }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-emerald-400" />
          Hall Treasury
        </h3>
        <Link href={`/halls/${hall.id}/ledger`}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 hover:text-slate-400" />
        </Link>
      </div>
      <div className="mb-4">
        <p className="text-2xl font-bold text-slate-100">
          {formatCurrency(hall.treasuryBalance)}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <ArrowUpRight className="h-3 w-3 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            +{formatCurrency(hall.monthlyRevenue)} this month
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Net Hall Revenue</span>
          <span className="text-slate-300 font-medium">
            {formatCurrency(hall.treasuryBalance)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">8th Ledger Tithe (20%)</span>
          <span className="text-slate-300 font-medium">
            {formatCurrency(hall.monthlyRevenue * 0.2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Your Monthly Share</span>
          <span className="text-emerald-400 font-bold">
            {formatCurrency(hall.myDividendMonthly)}
          </span>
        </div>
      </div>
    </div>
  );
}

function AssetTracker({ hall }: { hall: Hall }) {
  const trackers: Record<
    string,
    {
      label: string;
      value: string;
      sub: string;
      icon: React.ElementType;
      color: string;
    }[]
  > = {
    ledgerprop: [
      {
        label: "Occupancy",
        value: "94%",
        sub: "11/12 units leased",
        icon: Users,
        color: "text-emerald-400",
      },
      {
        label: "Rent Yield",
        value: "8.5%",
        sub: "Annual ROI",
        icon: TrendingUp,
        color: "text-cyan-400",
      },
      {
        label: "Maintenance",
        value: "Good",
        sub: "Last inspection: 2w ago",
        icon: CheckCircle2,
        color: "text-emerald-400",
      },
    ],
    ledgertech: [
      {
        label: "Uptime",
        value: "99.97%",
        sub: "GPU Cluster Alpha",
        icon: Activity,
        color: "text-emerald-400",
      },
      {
        label: "Hash Rate",
        value: "847 TH/s",
        sub: "Combined compute",
        icon: Sparkles,
        color: "text-cyan-400",
      },
      {
        label: "Power",
        value: "12.4 MW",
        sub: "Frankfurt DC-7",
        icon: Activity,
        color: "text-amber-400",
      },
    ],
    ledgerenergy: [
      {
        label: "Generation",
        value: "2.4 GWh",
        sub: "This month",
        icon: Sun,
        color: "text-yellow-400",
      },
      {
        label: "Capacity",
        value: "78%",
        sub: "Solar array efficiency",
        icon: Activity,
        color: "text-emerald-400",
      },
      {
        label: "Carbon",
        value: "-840t",
        sub: "CO2 offset credits",
        icon: HeartPulse,
        color: "text-green-400",
      },
    ],
    ledgeredu: [
      {
        label: "Enrolled",
        value: "234",
        sub: "Active scholars",
        icon: Users,
        color: "text-violet-400",
      },
      {
        label: "Graduation",
        value: "92%",
        sub: "Completion rate",
        icon: GraduationCap,
        color: "text-cyan-400",
      },
      {
        label: "Revenue",
        value: "$15.2k",
        sub: "Licensing this month",
        icon: Wallet,
        color: "text-emerald-400",
      },
    ],
    ledgerbiz: [
      {
        label: "Occupancy",
        value: "87%",
        sub: "Co-working spaces",
        icon: Users,
        color: "text-emerald-400",
      },
      {
        label: "Contracts",
        value: "14",
        sub: "Active corporate",
        icon: Briefcase,
        color: "text-orange-400",
      },
      {
        label: "Growth",
        value: "+12%",
        sub: "QoQ revenue",
        icon: TrendingUp,
        color: "text-cyan-400",
      },
    ],
    ledgertravel: [
      {
        label: "Flights",
        value: "24",
        sub: "This month",
        icon: Plane,
        color: "text-sky-400",
      },
      {
        label: "Load Factor",
        value: "78%",
        sub: "Dubai-London",
        icon: Users,
        color: "text-emerald-400",
      },
      {
        label: "Maintenance",
        value: "Scheduled",
        sub: "Next: 3d",
        icon: Clock,
        color: "text-amber-400",
      },
    ],
    ledgeragri: [
      {
        label: "Yield",
        value: "4.2t",
        sub: "Maize per hectare",
        icon: Sprout,
        color: "text-green-400",
      },
      {
        label: "Irrigation",
        value: "Active",
        sub: "Drip system online",
        icon: Activity,
        color: "text-cyan-400",
      },
      {
        label: "Soil",
        value: "pH 6.8",
        sub: "Optimal range",
        icon: HeartPulse,
        color: "text-emerald-400",
      },
    ],
    ledgerhealth: [
      {
        label: "Patients",
        value: "1,240",
        sub: "Monthly throughput",
        icon: Users,
        color: "text-rose-400",
      },
      {
        label: "Equipment",
        value: "98%",
        sub: "Operational uptime",
        icon: Activity,
        color: "text-emerald-400",
      },
      {
        label: "Revenue",
        value: "$4.8k",
        sub: "This month",
        icon: Wallet,
        color: "text-emerald-400",
      },
    ],
    ledgeraccess: [
      {
        label: "Events",
        value: "12",
        sub: "This month",
        icon: Sparkles,
        color: "text-emerald-400",
      },
      {
        label: "Members",
        value: "89",
        sub: "Active passes",
        icon: Users,
        color: "text-violet-400",
      },
      {
        label: "Venues",
        value: "4",
        sub: "Monaco grid",
        icon: Landmark,
        color: "text-cyan-400",
      },
    ],
    ledgerauto: [
      {
        label: "Fleet",
        value: "24",
        sub: "Vehicles active",
        icon: Car,
        color: "text-cyan-400",
      },
      {
        label: "Utilization",
        value: "76%",
        sub: "Daily average",
        icon: TrendingUp,
        color: "text-emerald-400",
      },
      {
        label: "Revenue",
        value: "$8.2k",
        sub: "This month",
        icon: Wallet,
        color: "text-emerald-400",
      },
    ],
    ledgersport: [
      {
        label: "Events",
        value: "8",
        sub: "This month",
        icon: Swords,
        color: "text-rose-400",
      },
      {
        label: "Attendance",
        value: "12.4k",
        sub: "Avg per event",
        icon: Users,
        color: "text-emerald-400",
      },
      {
        label: "Revenue",
        value: "$45.2k",
        sub: "Ticket + merch",
        icon: Wallet,
        color: "text-emerald-400",
      },
    ],
  };

  const verticalKey = hall.category.toLowerCase();
  const metrics = trackers[verticalKey] || trackers.ledgerprop;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          Asset Tracker
        </h3>
        <span className="text-[10px] text-slate-600">{hall.location}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center"
          >
            <m.icon className={cn("mx-auto h-4 w-4 mb-2", m.color)} />
            <p className="text-sm font-bold text-slate-100">{m.value}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{m.label}</p>
            <p className="text-[8px] text-slate-700 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-500">SPV Entity</span>
          <span className="text-[10px] text-slate-400">{hall.spvName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Listed Price</span>
          <span className="text-[10px] text-slate-300 font-mono">
            {formatCurrency(hall.listedPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SriCard({ score }: { score: number }) {
  const tier = getSriTier(score);
  const TierIcon = tier.icon;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
          Sovereign Reputation Index
        </h3>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            tier.bg,
            tier.border,
            tier.color
          )}
        >
          <TierIcon className="inline h-3 w-3 mr-1" />
          {tier.label}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-slate-100">{score}</span>
        <span className="text-xs text-slate-500 mb-1">/ 100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            tier.color.replace("text-", "bg-")
          )}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
        <div className="flex justify-between">
          <span>Governance</span>
          <span className="text-slate-300">92%</span>
        </div>
        <div className="flex justify-between">
          <span>Revenue</span>
          <span className="text-slate-300">85%</span>
        </div>
        <div className="flex justify-between">
          <span>Dividends</span>
          <span className="text-slate-300">90%</span>
        </div>
        <div className="flex justify-between">
          <span>Proposals</span>
          <span className="text-slate-300">78%</span>
        </div>
      </div>
    </div>
  );
}

function AhgiCard({ score }: { score: number }) {
  const status = getAhgiStatus(score);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
          Asset Health Growth Index
        </h3>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            status.bg,
            status.border,
            status.color
          )}
        >
          {status.label}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-slate-100">{score}</span>
        <span className="text-xs text-slate-500 mb-1">/ 100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={cn(
            "h-full rounded-full",
            status.color.replace("text-", "bg-")
          )}
        />
      </div>
      <p className="mt-3 text-[10px] text-slate-500 leading-relaxed">
        {score >= 80
          ? "Hall is thriving. Expansion proposals are enabled."
          : score >= 60
          ? "Standard operation. Maintenance proposals auto-approved."
          : score >= 40
          ? "8th Ledger has flagged this hall for review. Submit improvement plan."
          : score >= 20
          ? "Dividend smoothing from Sanctuary activated. Oversight increased."
          : "Critical status. 8th Ledger may force asset sale without hall vote."}
      </p>
    </div>
  );
}

function CabinetPreview({
  hallId,
  cabinet,
}: {
  hallId: string;
  cabinet: CabinetMember[] | null;
}) {
  const roles = [
    {
      key: "speaker",
      label: "Speaker",
      icon: Crown,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      key: "treasurer",
      label: "Treasurer",
      icon: Wallet,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      key: "warden",
      label: "Warden",
      icon: Shield,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      key: "scribe",
      label: "Scribe",
      icon: Scroll,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-amber-400" />
          Executive Cabinet
        </h3>
        <Link href={`/halls/${hallId}/cabinet`}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 hover:text-slate-400" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((role) => {
          const member = cabinet?.find((m) => m.role === role.key);
          return (
            <div
              key={role.key}
              className={cn(
                "rounded-xl border p-3 flex items-center gap-3",
                member ? role.border : "border-slate-800",
                member ? role.bg : "bg-slate-950/20"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  member ? role.bg : "bg-slate-800"
                )}
              >
                <role.icon
                  className={cn(
                    "h-4 w-4",
                    member ? role.color : "text-slate-600"
                  )}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    member ? role.color : "text-slate-600"
                  )}
                >
                  {role.label}
                </p>
                <p className="text-xs text-slate-300 truncate">
                  {member?.displayName || member?.ledgerId || "Vacant"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {!cabinet && (
        <p className="mt-3 text-[10px] text-slate-600 text-center">
          No cabinet elected. Call an election when the hall goes Live.
        </p>
      )}
    </div>
  );
}

function LedgerPreview({
  hallId,
  updates,
}: {
  hallId: string;
  updates: LedgerUpdate[];
}) {
  const typeIcons: Record<string, React.ElementType> = {
    INSURANCE_RENEWAL: Shield,
    EMERGENCY_REPAIR: Wrench,
    PROPERTY_TAX: FileText,
    PAYROLL_EXECUTED: Users,
    DYNAMIC_VALUATION: TrendingUp,
    PIR_ADVANCE: AlertTriangle,
    DEFAULT: FileText,
  };
  const typeColors: Record<string, string> = {
    INSURANCE_RENEWAL: "text-emerald-400",
    EMERGENCY_REPAIR: "text-amber-400",
    PROPERTY_TAX: "text-blue-400",
    PAYROLL_EXECUTED: "text-cyan-400",
    DYNAMIC_VALUATION: "text-violet-400",
    PIR_ADVANCE: "text-rose-400",
    DEFAULT: "text-slate-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-violet-400" />
          8th Ledger Ledger
        </h3>
        <Link href={`/halls/${hallId}/ledger`}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 hover:text-slate-400" />
        </Link>
      </div>
      <div className="space-y-2">
        {updates.slice(0, 4).map((update) => {
          const Icon = typeIcons[update.type] || typeIcons.DEFAULT;
          const color = typeColors[update.type] || typeColors.DEFAULT;
          return (
            <div
              key={update.id}
              className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-800/30 transition-colors"
            >
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", color)} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 line-clamp-1">
                  {update.title}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-1">
                  {update.content}
                </p>
                <p className="text-[9px] text-slate-700 mt-0.5">
                  {new Date(update.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {updates.length === 0 && (
        <p className="text-[10px] text-slate-600 text-center py-4">
          No updates yet. The 8th Ledger will post records here.
        </p>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const hallId = (params.id as string) || "ledgerprop";

  const [hall, setHall] = useState<Hall | null>(null);
  const [cabinet, setCabinet] = useState<CabinetMember[] | null>(null);
  const [ledgerUpdates, setLedgerUpdates] = useState<LedgerUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHall() {
      try {
        const res = await fetch(`/api/halls/${hallId}`, {
          credentials: "include",
        });
        const data = (await res.json()) as { hall?: ApiHallResponse };

        if (data.hall) {
          const apiHall = data.hall;
          const poolVertical = apiHall.pool?.verticalId || "ledgerprop";
          const style =
            VERTICAL_COLOR_MAP[poolVertical] || VERTICAL_COLOR_MAP.ledgerprop;
          const Icon =
            VERTICAL_ICON_MAP[poolVertical] || VERTICAL_ICON_MAP.ledgerprop;

          const userLedgerId = user?.ledgerId;

          const ownerships = apiHall.ownerships || [];
          const userOwnership = ownerships.find(
            (o) => o.user?.ledgerId === userLedgerId
          );

          const revenueLogs = apiHall.revenueLogs || [];
          const monthlyRevenue = revenueLogs.reduce(
            (sum, r) => sum + (r.netAfterPayroll || r.communityNet || 0),
            0
          );

          setHall({
            id: apiHall.id,
            name: apiHall.name,
            shortName: poolVertical,
            icon: Icon,
            ...style,
            members: apiHall._count?.ownerships || 0,
            online: Math.floor((apiHall._count?.ownerships || 0) * 0.7),
            joined: ownerships.some(
              (o) => o.user?.ledgerId === userLedgerId
            ),
            status: (apiHall.status as HallStatus) || "ghost",
            description:
              apiHall.pool?.description || "Sovereign asset pool",
            assetImage:
              apiHall.pool?.assetImages
                ? (JSON.parse(apiHall.pool.assetImages) as string[])[0]
                : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
            emojiSet: apiHall.pool?.emojiSet
              ? apiHall.pool.emojiSet.split("")
              : ["🏠", "🔑", "🏗️", "📐", "🌇"],
            trueCost: apiHall.pool?.trueCost || 0,
            listedPrice: apiHall.pool?.listedPrice || 0,
            pir: apiHall.pool?.surplus || apiHall.pool?.pir || 0,
            fillPercent: apiHall.pool?.target
              ? Math.round(
                  ((apiHall.pool?.committed || 0) / apiHall.pool.target) * 100
                )
              : 0,
            myOwnership: userOwnership?.ownershipPercent || 0,
            myDividendMonthly: 0,
            activeProposals: (apiHall.proposals || []).filter(
              (p) => p.status === "active"
            ).length,
            pacCount: ownerships.length,
            location: apiHall.pool?.verticalId || "Global",
            category: poolVertical,
            treasuryBalance: apiHall.hallTreasury?.balance || 0,
            monthlyRevenue,
            totalCommitted: apiHall.pool?.committed || 0,
            target2X: apiHall.pool?.target || 0,
            spvName: apiHall.pool?.spv?.name || "8th Ledger SPV",
            sriScore: apiHall.sriScore || 50,
            ahgiScore: apiHall.ahgiScore || 50,
            hallClass: apiHall.hallClass,
            closureStatus: apiHall.closureStatus,
            // PHASE 4: Universal feature flags
            forgeEnabled: apiHall.forgeEnabled || false,
            inventoryEnabled: apiHall.inventoryEnabled || false,
            ihcpBalance: apiHall.ihcpBalance || 0,
          });

          if (apiHall.executiveCabinet) {
            const c = apiHall.executiveCabinet;
            const members: CabinetMember[] = [];
            if (c.speakerId)
              members.push({
                role: "speaker",
                roleLabel: "The Speaker",
                ledgerId: c.speakerId,
              });
            if (c.treasurerId)
              members.push({
                role: "treasurer",
                roleLabel: "The Treasurer",
                ledgerId: c.treasurerId,
              });
            if (c.wardenId)
              members.push({
                role: "warden",
                roleLabel: "The Warden",
                ledgerId: c.wardenId,
              });
            if (c.scribeId)
              members.push({
                role: "scribe",
                roleLabel: "The Scribe",
                ledgerId: c.scribeId,
              });
            setCabinet(members);
          } else {
            setCabinet(null);
          }

          setLedgerUpdates((apiHall.eighthLedgerUpdates || []).slice(0, 6));
        }
      } catch (err) {
        console.error("[HALL LOAD]", err);
      } finally {
        setLoading(false);
      }
    }

    loadHall();
  }, [hallId, user?.ledgerId]);

  if (loading || !hall) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-500">Loading sovereign hall...</p>
        </div>
      </div>
    );
  }

  const HallIcon = hall.icon;
  const statusCfg = STATUS_CONFIG[hall.status] || STATUS_CONFIG.ghost;
  const StatusIcon = statusCfg.icon;

  // PHASE 4: Dynamic nav based on hall flags
  const hallNav = getHallNav(hall);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold text-white/[0.015] select-none whitespace-nowrap">
          8TH LEDGER
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-[1800px] mx-auto px-4 py-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Link href="/halls">
              <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Link>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-slate-800",
                hall.bg
              )}
            >
              <HallIcon className={cn("h-5 w-5", hall.color)} />
            </div>
            <div>
              <h1 className={cn("text-lg font-bold", hall.color)}>
                {hall.name}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border",
                    statusCfg.bg,
                    statusCfg.border,
                    statusCfg.color
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </span>
                <span className="text-[10px] text-slate-600">
                  • {hall.members} sovereigns
                </span>
                <span className="text-[10px] text-slate-600">
                  • {hall.location}
                </span>
                {hall.hallClass && (
                  <span className="text-[10px] text-slate-600">
                    • Class {hall.hallClass}
                  </span>
                )}
                {/* PHASE 4: Feature badges */}
                {hall.forgeEnabled && (
                  <span className="text-[10px] text-orange-400 border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 rounded">
                    Forge On
                  </span>
                )}
                {hall.inventoryEnabled && (
                  <span className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Inventory On
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SRI + AHGI + Closure Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {(() => {
              const tier = getSriTier(hall.sriScore);
              const TierIcon = tier.icon;
              return (
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    tier.bg,
                    tier.border,
                    tier.color
                  )}
                >
                  <TierIcon className="h-3 w-3" />
                  SRI {hall.sriScore} — {tier.label}
                </span>
              );
            })()}
            {(() => {
              const aStatus = getAhgiStatus(hall.ahgiScore);
              return (
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    aStatus.bg,
                    aStatus.border,
                    aStatus.color
                  )}
                >
                  <HeartPulse className="h-3 w-3" />
                  AHGI {hall.ahgiScore} — {aStatus.label}
                </span>
              );
            })()}
            {hall.closureStatus && hall.closureStatus !== "active" && (
              <span className="flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                <AlertTriangle className="h-3 w-3" />
                Closure: {hall.closureStatus}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300">
              <Sparkles className="h-3.5 w-3.5" />
              {hall.myOwnership}% Owned
            </span>
          </div>
        </motion.div>

        {/* Navigation Tabs — DYNAMIC */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {hallNav.map((nav) => {
            const isActive = nav.id === "dashboard";
            const NavIcon = nav.icon;
            return (
              <Link
                key={nav.id}
                href={`/halls/${hall.id}${nav.href}`}
              >
                <button
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                      : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  )}
                >
                  <NavIcon className="h-3.5 w-3.5" />
                  {nav.label}
                </button>
              </Link>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TreasuryCard hall={hall} />
              <AssetTracker hall={hall} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SriCard score={hall.sriScore} />
              <AhgiCard score={hall.ahgiScore} />
            </div>
            <LedgerPreview hallId={hall.id} updates={ledgerUpdates} />
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-4">
            <CabinetPreview hallId={hall.id} cabinet={cabinet} />

            {/* Hall Stats */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
              <h3 className="text-xs font-bold text-slate-200 mb-3">
                Hall Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Committed</span>
                  <span className="text-slate-300 font-mono">
                    {formatCurrency(hall.totalCommitted)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">2X Target</span>
                  <span className="text-slate-300 font-mono">
                    {formatCurrency(hall.target2X)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Fill Progress</span>
                  <span className="text-cyan-400 font-bold">
                    {hall.fillPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">True Cost</span>
                  <span className="text-slate-300 font-mono">
                    {formatCurrency(hall.trueCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">PIR</span>
                  <span className="text-slate-300 font-mono">
                    {formatCurrency(hall.pir)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Active Proposals</span>
                  <span className="text-amber-400 font-bold">
                    {hall.activeProposals}
                  </span>
                </div>
                {/* PHASE 4: IHCP balance display */}
                {hall.ihcpBalance > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">IHCP Balance</span>
                    <span className="text-violet-400 font-mono">
                      {formatCurrency(hall.ihcpBalance)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
              <h3 className="text-xs font-bold text-slate-200 mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/halls/${hall.id}/sovereign-stream`}>
                  <button className="w-full rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex flex-col items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Sovereign Stream
                  </button>
                </Link>
                <Link href={`/halls/${hall.id}/cabinet`}>
                  <button className="w-full rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex flex-col items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Cabinet
                  </button>
                </Link>
                <Link href={`/halls/${hall.id}/ledger`}>
                  <button className="w-full rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex flex-col items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Ledger
                  </button>
                </Link>
                <Link href={`/halls/${hall.id}/vault`}>
                  <button className="w-full rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex flex-col items-center gap-1">
                    <Vault className="h-4 w-4" />
                    Vault
                  </button>
                </Link>
                <Link href={`/halls/${hall.id}/marketplace`}>
                  <button className="w-full rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex flex-col items-center gap-1">
                    <Store className="h-4 w-4" />
                    Marketplace
                  </button>
                </Link>
                {/* PHASE 4: Forge button only if enabled */}
                {hall.forgeEnabled && (
                  <Link href={`/halls/${hall.id}/forge`}>
                    <button className="w-full rounded-xl border border-orange-500/20 bg-orange-500/5 p-2.5 text-[10px] text-orange-400 hover:text-orange-200 hover:bg-orange-500/10 transition-all flex flex-col items-center gap-1">
                      <Hammer className="h-4 w-4" />
                      Forge
                    </button>
                  </Link>
                )}
                {/* PHASE 4: Operations button if forge or inventory enabled */}
                {(hall.forgeEnabled || hall.inventoryEnabled) && (
                  <Link href={`/halls/${hall.id}/operations`}>
                    <button className="w-full rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-[10px] text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-1">
                      <Cog className="h-4 w-4" />
                      Operations
                    </button>
                  </Link>
                )}
                {/* PHASE 4: Inventory button if enabled */}
                {hall.inventoryEnabled && (
                  <Link href={`/halls/${hall.id}/inventory`}>
                    <button className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[10px] text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/10 transition-all flex flex-col items-center gap-1">
                      <Package className="h-4 w-4" />
                      Inventory
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}