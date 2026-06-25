"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Radio, Users, Activity, Clock, MapPin, Gavel, Wallet,
  PieChart, Receipt, Hourglass, Search, Grid, List, X,
  ArrowRight, Sparkles, Eye, Store, FileText, Shield,
  Banknote, CheckCircle2, Lock, Unlock, Vote, BarChart3,
  TrendingUp, Flame, Loader2, Bell, ChevronDown, Zap,
  Crown, AlertCircle, ArrowUpRight, ArrowDownRight, Minus,
  ChevronLeft, ChevronRight, Plus, Wand2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ============================================================
   TYPES
   ============================================================ */
type HallStatus = "ghost" | "live" | "mature" | "dormant" | "dissolved";

interface Hall {
  id: string;
  name: string;
  shortName: string;
  color: string;
  border: string;
  bg: string;
  accentGradient: string;
  members: number;
  online: number;
  joined: boolean;
  status: HallStatus;
  description: string;
  assetImage: string;
  emojiSet: string[];
  listedPrice: number;
  pir: number;
  fillPercent: number;
  myOwnership: number;
  myDividendMonthly: number;
  activeProposals: number;
  pacCount: number;
  commitmentCount: number;
  location: string;
  category: string;
  nextConsensus: string;
  treasuryBalance: number;
  monthlyRevenue: number;
  totalCommitted: number;
  target2X: number;
  spvName: string;
  assetType: string;
  yieldApy: number;
  lastDistribution: string;
  governancePower: number;
  forgeEnabled?: boolean;
  inventoryEnabled?: boolean;
  ihcpBalance?: number;
}

interface ApiHall {
  id: string;
  verticalId: string;
  name: string;
  shortName?: string;
  status: string;
  joined?: boolean;
  description?: string;
  assetImage?: string;
  emojiSet?: string[];
  listedPrice?: number;
  committed?: number;
  target?: number;
  fillPercent?: number;
  myOwnership?: number;
  myDividendMonthly?: number;
  activeProposals?: number;
  pacCount?: number;
  location?: string;
  category?: string;
  nextConsensus?: string;
  treasuryBalance?: number;
  monthlyRevenue?: number;
  totalCommitted?: number;
  target2X?: number;
  spvName?: string;
  members?: number;
  online?: number;
  hallClass?: string;
  sriScore?: number;
  ahgiScore?: number;
  pool?: { name?: string; verticalId?: string };
  [key: string]: any;
}

interface DividendSnapshot {
  hallId: string;
  hallName: string;
  amount: number;
  date: string;
  claimed: boolean;
}

interface ProposalAlert {
  id: string;
  hallId: string;
  hallName: string;
  title: string;
  type: string;
  votesFor: number;
  votesAgainst: number;
  threshold: number;
  endsAt: string;
}

/* ============================================================
   VERTICAL STYLES
   ============================================================ */
const VERTICAL_STYLES: Record<string, {
  color: string; border: string; bg: string; accentGradient: string;
  emojiSet: string[]; category: string; assetType: string; description: string;
  spvName: string; yieldApy: number;
}> = {
  ledgerprop: {
    color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10",
    accentGradient: "from-amber-400 to-orange-500",
    emojiSet: ["🏠", "🔑", "🏗️", "📐", "🌇"],
    category: "Real Estate", assetType: "Luxury Apartment",
    description: "Fractional real estate ownership. Residential, commercial, and land assets via PAC.",
    spvName: "LedgerProp SPV", yieldApy: 5.4,
  },
  ledgerauto: {
    color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/10",
    accentGradient: "from-cyan-400 to-blue-500",
    emojiSet: ["🚗", "🏎️", "🔋", "🛞", "🚦"],
    category: "Automotive", assetType: "Fleet Pool",
    description: "Vehicle fleet pools. Luxury cars, commercial fleets, EV charging networks.",
    spvName: "LedgerAuto Fleet SPV", yieldApy: 4.2,
  },
  ledgertech: {
    color: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10",
    accentGradient: "from-indigo-400 to-blue-500",
    emojiSet: ["💻", "⚡", "🖥️", "🔌", "🌐"],
    category: "Technology", assetType: "Data Center",
    description: "Technology infrastructure. GPU clusters, servers, data centers.",
    spvName: "LedgerTech Infra SPV", yieldApy: 6.9,
  },
  ledgeredu: {
    color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/10",
    accentGradient: "from-violet-400 to-purple-500",
    emojiSet: ["📚", "🎓", "✏️", "🏛️", "🧠"],
    category: "Education", assetType: "Campus Block",
    description: "Education & scholarship pools. All participants own the asset.",
    spvName: "LedgerEdu Scholarship SPV", yieldApy: 3.8,
  },
  ledgerhealth: {
    color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10",
    accentGradient: "from-rose-400 to-pink-500",
    emojiSet: ["🏥", "💊", "🩺", "❤️", "🧬"],
    category: "Healthcare", assetType: "Medical Center",
    description: "Healthcare & wellness assets. Clinics, equipment, telehealth infrastructure.",
    spvName: "LedgerHealth Care SPV", yieldApy: 4.2,
  },
  ledgerbiz: {
    color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/10",
    accentGradient: "from-orange-400 to-red-500",
    emojiSet: ["💼", "📈", "🏢", "📊", "🤝"],
    category: "Business", assetType: "Office Tower",
    description: "Business asset pools. Co-working, logistics, commercial real estate.",
    spvName: "LedgerBiz Commercial SPV", yieldApy: 4.1,
  },
  ledgertravel: {
    color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/10",
    accentGradient: "from-sky-400 to-cyan-500",
    emojiSet: ["✈️", "🛩️", "🌴", "🧳", "🗺️"],
    category: "Aviation", assetType: "Route Portfolio",
    description: "Fractional aviation & luxury travel. Private jets, yacht access, routes.",
    spvName: "LedgerTravel Aviation SPV", yieldApy: 3.2,
  },
  ledgeragri: {
    color: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/10",
    accentGradient: "from-green-400 to-emerald-500",
    emojiSet: ["🌾", "🚜", "🍃", "🌱", "🌽"],
    category: "Agriculture", assetType: "Farmland Portfolio",
    description: "Agricultural assets. Farmland, equipment, crop yield contracts.",
    spvName: "LedgerAgri Land SPV", yieldApy: 3.5,
  },
  ledgerenergy: {
    color: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/10",
    accentGradient: "from-yellow-400 to-amber-500",
    emojiSet: ["☀️", "⚡", "🔋", "🌬️", "♻️"],
    category: "Energy", assetType: "Solar Farm",
    description: "Solar, wind & renewable energy. PPA contracts. Carbon credits.",
    spvName: "LedgerEnergy Renewables SPV", yieldApy: 5.0,
  },
  ledgeraccess: {
    color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10",
    accentGradient: "from-emerald-400 to-teal-500",
    emojiSet: ["🎫", "🔐", "🎭", "🥂", "🎪"],
    category: "Access", assetType: "Access Portfolio",
    description: "Exclusive access rights. VIP events, private clubs, premium venues.",
    spvName: "LedgerAccess Rights SPV", yieldApy: 3.8,
  },
  ledgersport: {
    color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10",
    accentGradient: "from-red-400 to-rose-500",
    emojiSet: ["⚽", "🏀", "🏈", "⚾", "🎾"],
    category: "Sports", assetType: "Sports Complex",
    description: "Professional sports teams, academies, and facilities. Revenue from matchday, merchandise, media rights.",
    spvName: "LedgerSport SPV", yieldApy: 5.5,
  },
};

/* ============================================================
   MAP API HALL → UI HALL
   ============================================================ */
function mapApiHall(api: ApiHall): Hall {
  const style = VERTICAL_STYLES[api.verticalId] || VERTICAL_STYLES.ledgerprop;
  const status = api.status as HallStatus;
  const isLive = status === "live" || status === "mature";

  return {
    id: api.id,
    name: api.name || style.category + " Hall",
    shortName: api.shortName || api.name || style.category,
    color: style.color,
    border: style.border,
    bg: style.bg,
    accentGradient: style.accentGradient,
    members: api.members || 0,
    online: api.online || 0,
    joined: api.joined || false,
    status,
    description: api.description || style.description,
    assetImage: api.assetImage || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    emojiSet: api.emojiSet || style.emojiSet,
    listedPrice: api.listedPrice || api.target2X || 0,
    pir: (api.listedPrice || 0) - (api.totalCommitted || 0),
    fillPercent: api.fillPercent || 0,
    myOwnership: api.myOwnership || 0,
    myDividendMonthly: api.myDividendMonthly || 0,
    activeProposals: api.activeProposals || 0,
    pacCount: api.pacCount || 0,
    commitmentCount: 0,
    location: api.location || "Global",
    category: api.category || style.category,
    nextConsensus: api.nextConsensus || (isLive ? "Active" : "TBD"),
    treasuryBalance: api.treasuryBalance || 0,
    monthlyRevenue: api.monthlyRevenue || 0,
    totalCommitted: api.totalCommitted || api.committed || 0,
    target2X: api.target2X || api.listedPrice || 0,
    spvName: api.spvName || style.spvName,
    assetType: api.assetType || style.assetType,
    yieldApy: style.yieldApy,
    lastDistribution: "—",
    governancePower: api.myOwnership || 0,
    forgeEnabled: false,
    inventoryEnabled: false,
    ihcpBalance: 0,
  };
}

const STATUS_CONFIG: Record<HallStatus, { label: string; icon: any; color: string; bg: string; border: string; pulse: boolean; description: string }> = {
  ghost: { label: "Ghost", icon: Lock, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", pulse: false, description: "Invisible to public. Only committers see this hall." },
  live: { label: "Live", icon: Radio, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", pulse: true, description: "Active governance. Revenue generating. Open proposals." },
  mature: { label: "Mature", icon: CheckCircle2, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", pulse: false, description: "Fully filled. Stable revenue. Minimal proposals." },
  dormant: { label: "Dormant", icon: Flame, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", pulse: false, description: "No revenue 90+ days. At risk of LED reclamation." },
  dissolved: { label: "Dissolved", icon: X, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", pulse: false, description: "Hall closed. Asset liquidated." },
};

const RECENT_DIVIDENDS: DividendSnapshot[] = [
  { hallId: "ledgerprop", hallName: "LedgerProp", amount: 450, date: "2h ago", claimed: true },
  { hallId: "ledgertech", hallName: "LedgerTech", amount: 890, date: "1d ago", claimed: true },
  { hallId: "ledgerbiz", hallName: "LedgerBiz", amount: 620, date: "2d ago", claimed: false },
  { hallId: "ledgerenergy", hallName: "LedgerEnergy", amount: 540, date: "3d ago", claimed: true },
  { hallId: "ledgeredu", hallName: "LedgerEdu", amount: 320, date: "4d ago", claimed: true },
];

const PROPOSAL_ALERTS: ProposalAlert[] = [
  { id: "pr1", hallId: "ledgerprop", hallName: "LedgerProp", title: "Marina Roof Renovation — $12K", type: "renovate", votesFor: 52, votesAgainst: 12, threshold: 51, endsAt: "12h" },
  { id: "pr2", hallId: "ledgerbiz", hallName: "LedgerBiz", title: "Hire New Property Manager", type: "manager_change", votesFor: 48, votesAgainst: 8, threshold: 51, endsAt: "2d" },
  { id: "pr3", hallId: "ledgerenergy", hallName: "LedgerEnergy", title: "Expand Solar Array B — $45K", type: "budget_approve", votesFor: 61, votesAgainst: 4, threshold: 51, endsAt: "5h" },
  { id: "pr4", hallId: "ledgerprop", hallName: "LedgerProp", title: "Q3 Rent Increase 8%", type: "rent_adjust", votesFor: 38, votesAgainst: 22, threshold: 51, endsAt: "1d" },
  { id: "pr5", hallId: "ledgerbiz", hallName: "LedgerBiz", title: "Sell Floor 3 Office Unit", type: "asset_sale", votesFor: 55, votesAgainst: 15, threshold: 51, endsAt: "3d" },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   GLOW CARD
   ============================================================ */
function GlowCard({ children, className = "", accent = "cyan" }: { children: React.ReactNode; className?: string; accent?: string }) {
  const map: Record<string, string> = {
    cyan: "from-cyan-500/10 to-blue-500/5 border-cyan-500/10",
    amber: "from-amber-500/10 to-orange-500/5 border-amber-500/10",
    emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-500/10",
    violet: "from-violet-500/10 to-purple-500/5 border-violet-500/10",
    rose: "from-rose-500/10 to-pink-500/5 border-rose-500/10",
    slate: "from-slate-500/10 to-gray-500/5 border-slate-500/10",
  };
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-sm", map[accent] || map.cyan, className)}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
      {children}
    </div>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */
function StatusBadge({ status }: { status: HallStatus }) {
  const c = STATUS_CONFIG[status];
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", c.bg, c.color, c.border)}>
      <Icon className={cn("h-3 w-3", c.pulse && "animate-pulse")} />
      {c.label}
    </span>
  );
}

/* ============================================================
   TOKEN INDICATOR
   ============================================================ */
function TokenIndicator({ commitment, pac, ownership }: { commitment: number; pac: number; ownership: number }) {
  return (
    <div className="flex items-center gap-2">
      {commitment > 0 && (
        <div className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5">
          <Hourglass className="h-2.5 w-2.5 text-amber-400" />
          <span className="text-[9px] font-bold text-amber-400">{commitment} Commitment</span>
        </div>
      )}
      {pac > 0 && (
        <div className="flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5">
          <Receipt className="h-2.5 w-2.5 text-cyan-400" />
          <span className="text-[9px] font-bold text-cyan-400">{pac} PAC</span>
        </div>
      )}
      {ownership > 0 && (
        <div className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5">
          <PieChart className="h-2.5 w-2.5 text-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-400">{ownership}%</span>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PHASE 4: OPERATIONS BADGES
   ============================================================ */
function OperationsBadges({ hall }: { hall: Hall }) {
  if (!hall.forgeEnabled && !hall.inventoryEnabled && !hall.ihcpBalance) return null;
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {hall.forgeEnabled && (
        <span className="flex items-center gap-1 rounded-md bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-400">
          <Hammer className="h-2.5 w-2.5" />
          Forge
        </span>
      )}
      {hall.inventoryEnabled && (
        <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
          <Package className="h-2.5 w-2.5" />
          Inventory
        </span>
      )}
      {(hall.ihcpBalance || 0) > 0 && (
        <span className="flex items-center gap-1 rounded-md bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
          <Wallet className="h-2.5 w-2.5" />
          IHCP {formatCurrency(hall.ihcpBalance || 0)}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   FLOATING NOTIFICATION DROPDOWN
   ============================================================ */
function FloatingNotifications({ proposals, dividends }: { proposals: ProposalAlert[]; dividends: DividendSnapshot[] }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"votes" | "dividends">("votes");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const totalUnread = proposals.length + dividends.filter((d) => !d.claimed).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
          open
            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60"
        )}
      >
        <Bell className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Alerts</span>
        {totalUnread > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {totalUnread}
          </span>
        )}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-[380px] rounded-2xl border border-white/10 bg-[#0a0a14]/95 backdrop-blur-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
          >
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab("votes")}
                className={cn(
                  "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all",
                  activeTab === "votes" ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5" : "text-white/20 hover:text-white/40"
                )}
              >
                <Gavel className="h-3 w-3 inline mr-1.5" />
                Active Votes ({proposals.length})
              </button>
              <button
                onClick={() => setActiveTab("dividends")}
                className={cn(
                  "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all",
                  activeTab === "dividends" ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5" : "text-white/20 hover:text-white/40"
                )}
              >
                <Wallet className="h-3 w-3 inline mr-1.5" />
                Dividends ({dividends.length})
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
              {activeTab === "votes" ? (
                proposals.length === 0 ? (
                  <div className="py-8 text-center">
                    <Gavel className="h-8 w-8 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/30">No active votes</p>
                  </div>
                ) : (
                  proposals.map((p) => {
                    const total = p.votesFor + p.votesAgainst;
                    const forPct = total > 0 ? (p.votesFor / total) * 100 : 0;
                    const isPassing = forPct >= p.threshold;
                    return (
                      <div key={p.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-amber-500/15 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-[10px] text-amber-400 font-semibold">{p.hallName}</span>
                            <p className="text-xs text-white mt-0.5">{p.title}</p>
                          </div>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", isPassing ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>
                            {isPassing ? "PASSING" : "PENDING"}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex mb-1.5">
                          <div className="h-full bg-emerald-500/60 rounded-l-full" style={{ width: `${forPct}%` }} />
                          <div className="h-full bg-rose-500/40 rounded-r-full" style={{ width: `${100 - forPct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-white/20">
                          <span>{p.votesFor} Agree</span>
                          <span>{p.endsAt} left</span>
                          <span>{p.votesAgainst} Decline</span>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                dividends.length === 0 ? (
                  <div className="py-8 text-center">
                    <Wallet className="h-8 w-8 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/30">No recent dividends</p>
                  </div>
                ) : (
                  dividends.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-emerald-500/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", d.claimed ? "bg-emerald-500/10" : "bg-amber-500/10")}>
                          {d.claimed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Clock className="h-3.5 w-3.5 text-amber-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{d.hallName}</p>
                          <p className="text-[9px] text-white/20">{d.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">{formatCurrency(d.amount)}</p>
                        <p className={cn("text-[9px]", d.claimed ? "text-emerald-400/50" : "text-amber-400/50")}>{d.claimed ? "Claimed" : "Pending"}</p>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            <div className="border-t border-white/5 p-3">
              <Link href={activeTab === "votes" ? "/halls/governance" : "/dividends"}>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-semibold text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  View All {activeTab === "votes" ? "Proposals" : "Dividends"}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   HALL CARD
   ============================================================ */
function HallCard({ hall, index }: { hall: Hall; index: number }) {
  const isJoined = hall.joined;
  const isGhost = hall.status === "ghost";
  const isFull = hall.fillPercent >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-500",
        hall.border,
        isJoined ? "bg-[#0c0c18]/95" : "bg-[#0c0c18]/50",
        isJoined && !isGhost && "hover:shadow-[0_8px_40px_-12px_rgba(6,182,212,0.18)] hover:border-cyan-500/30",
        isGhost && "opacity-60 hover:opacity-80"
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-60", hall.color)} />
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(180deg, transparent 0%, ${hall.color.includes("amber") ? "rgba(251,191,36,0.03)" : hall.color.includes("cyan") ? "rgba(34,211,238,0.03)" : "rgba(139,92,246,0.03)"} 100%)` }} />

      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c18] via-[#0c0c18]/60 to-transparent z-10" />
        <img src={hall.assetImage} alt={hall.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-3 left-3 z-20"><StatusBadge status={hall.status} /></div>
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <span className="rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium text-white/70">{hall.category}</span>
          {(hall.status === "live" || hall.status === "mature") && (
            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-emerald-400">{hall.yieldApy}% APY</span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 z-20">
          <span className="rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium text-white/60">{hall.assetType}</span>
        </div>
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1">
          {hall.emojiSet.map((emoji, i) => (
            <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 backdrop-blur-md text-sm border border-white/5">{emoji}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-white/10", hall.bg)}>
                <span className={cn("text-xl", hall.color)}>{hall.emojiSet[0]}</span>
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", hall.color)}>{hall.name}</h3>
                <p className="text-[10px] text-white/20 font-mono">{hall.spvName}</p>
              </div>
            </div>
            <OperationsBadges hall={hall} />
          </div>
          {isJoined && <TokenIndicator commitment={hall.commitmentCount} pac={hall.pacCount} ownership={hall.myOwnership} />}
        </div>

        <p className="text-[11px] text-white/30 leading-relaxed mb-4 line-clamp-2">{hall.description}</p>

        {/* Pool Fill */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 font-medium">Pool Fill</span>
              {isFull && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  CONSENSUS READY
                </span>
              )}
            </div>
            <span className={cn("text-[10px] font-bold", isFull ? "text-emerald-400" : "text-white/50")}>{hall.fillPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${hall.fillPercent}%` }} transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }} className={cn("h-full rounded-full bg-gradient-to-r", hall.accentGradient)} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-white/20 font-mono">{formatCurrency(hall.totalCommitted)} committed</span>
            <span className="text-[9px] text-white/20 font-mono">{formatCurrency(hall.listedPrice)} listed</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-2.5 text-center group/stat hover:bg-white/[0.03] transition-colors">
            <Users className="mx-auto h-3.5 w-3.5 text-white/15 mb-1.5 group-hover/stat:text-white/30 transition-colors" />
            <p className="text-[11px] font-bold text-white">{hall.members.toLocaleString()}</p>
            <p className="text-[8px] text-white/15">Members</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-2.5 text-center group/stat hover:bg-white/[0.03] transition-colors">
            <Activity className="mx-auto h-3.5 w-3.5 text-emerald-400/30 mb-1.5" />
            <p className="text-[11px] font-bold text-emerald-400/80">{hall.online}</p>
            <p className="text-[8px] text-white/15">Online</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-2.5 text-center group/stat hover:bg-white/[0.03] transition-colors">
            <Gavel className="mx-auto h-3.5 w-3.5 text-white/15 mb-1.5 group-hover/stat:text-amber-400/50 transition-colors" />
            <p className={cn("text-[11px] font-bold", hall.activeProposals > 0 ? "text-amber-400" : "text-white/30")}>{hall.activeProposals}</p>
            <p className="text-[8px] text-white/15">Votes</p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-2.5 text-center group/stat hover:bg-white/[0.03] transition-colors">
            <Clock className="mx-auto h-3.5 w-3.5 text-white/15 mb-1.5" />
            <p className="text-[11px] font-bold text-white/50">{hall.nextConsensus}</p>
            <p className="text-[8px] text-white/15">Consensus</p>
          </div>
        </div>

        {/* Ownership Panel */}
        {isJoined && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5 hover:bg-white/[0.025] transition-colors">
              <div className="flex items-center gap-2"><PieChart className="h-3.5 w-3.5 text-white/20" /><span className="text-[11px] text-white/40">Ownership</span></div>
              <span className="text-xs font-bold text-white">{hall.myOwnership}%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5 hover:bg-white/[0.025] transition-colors">
              <div className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-emerald-400/40" /><span className="text-[11px] text-white/40">Monthly</span></div>
              <span className="text-xs font-bold text-emerald-400">{formatCurrency(hall.myDividendMonthly)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5 hover:bg-white/[0.025] transition-colors">
              <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-amber-400/40" /><span className="text-[11px] text-white/40">Governance</span></div>
              <span className="text-xs font-bold text-amber-400">{hall.governancePower}%</span>
            </div>
          </motion.div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between mb-4 text-[10px] text-white/15">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{hall.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{hall.lastDistribution !== "—" ? `Last: ${hall.lastDistribution}` : "No distributions"}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/halls/${hall.id}`} className="flex-1">
            <button className={cn(
              "w-full rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              isJoined && !isGhost
                ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 border border-cyan-500/20"
                : isGhost
                ? "bg-white/[0.03] text-white/25 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/40"
                : "bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/50"
            )}>
              {isJoined && !isGhost ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isJoined && !isGhost ? "Enter Hall" : isGhost ? "Ghost Hall" : "View Hall"}
            </button>
          </Link>
          {isJoined && !isGhost && (
            <>
              <Link href={`/halls/${hall.id}/governance`}>
                <button className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-white/30 hover:text-white hover:bg-white/[0.05] transition-all" title="Governance">
                  <Vote className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link href={`/halls/${hall.id}/treasury`}>
                <button className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-white/30 hover:text-white hover:bg-white/[0.05] transition-all" title="Treasury">
                  <BarChart3 className="h-3.5 w-3.5" />
                </button>
              </Link>
              {(hall.forgeEnabled || hall.inventoryEnabled) && (
                <Link href={`/halls/${hall.id}/operations`}>
                  <button className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all" title="Operations">
                    <Cog className="h-3.5 w-3.5" />
                  </button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   STAT CARD
   ============================================================ */
function StatCard({ label, value, sub, icon: Icon, color, delay }: { label: string; value: string; sub: string; icon: any; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} className="rounded-2xl border border-white/[0.04] bg-[#0c0c18]/80 backdrop-blur-sm p-4 relative overflow-hidden group hover:border-white/[0.08] transition-colors">
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] blur-2xl transition-opacity group-hover:opacity-[0.12]", color.replace("text-", "bg-").replace("400", "500"))} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/15 font-bold">{label}</span>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", color.replace("text-", "bg-").replace("400", "500/8"))}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-[10px] text-white/15 mt-1">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   PAGINATION CONTROLS
   ============================================================ */
function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04]">
      <p className="text-[11px] text-white/20">
        Showing <span className="text-white/40 font-semibold">{(page - 1) * 10 + 1}</span> –{" "}
        <span className="text-white/40 font-semibold">{Math.min(page * 10, totalItems)}</span> of{" "}
        <span className="text-white/40 font-semibold">{totalItems}</span> halls
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={cn(
            "flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
            page <= 1
              ? "border-white/[0.04] bg-white/[0.01] text-white/10 cursor-not-allowed"
              : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all",
                  pageNum === page
                    ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                    : "border border-white/[0.04] text-white/25 hover:bg-white/[0.03] hover:text-white/40"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={cn(
            "flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
            page >= totalPages
              ? "border-white/[0.04] bg-white/[0.01] text-white/10 cursor-not-allowed"
              : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
          )}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "joined" | "ghost" | "live" | "mature" | "dormant">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfo, setShowInfo] = useState(true);
  const [page, setPage] = useState(1);
  const [isSeeding, setIsSeeding] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    async function fetchHalls() {
      try {
        const res = await fetch(`/api/halls?page=${page}&limit=${ITEMS_PER_PAGE}`, { credentials: "include" });
        const data = await res.json();
        if (data.success && Array.isArray(data.halls)) {
          const mapped = data.halls.map(mapApiHall);
          setHalls(mapped);
        } else {
          setHalls([]);
          if (data.error) setApiError(data.error);
        }
      } catch (err) {
        console.error("[HALLS]", err);
        setApiError("Failed to load halls.");
        setHalls([]);
      } finally {
        setApiLoading(false);
      }
    }
    fetchHalls();
  }, [page]);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/halls/seed", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPage(1);
        // Refetch
        const refresh = await fetch(`/api/halls?page=1&limit=${ITEMS_PER_PAGE}`, { credentials: "include" });
        const refreshData = await refresh.json();
        if (refreshData.success && Array.isArray(refreshData.halls)) {
          setHalls(refreshData.halls.map(mapApiHall));
        }
      } else {
        setApiError(data.error || "Seed failed");
      }
    } catch (err) {
      setApiError("Seed request failed");
    } finally {
      setIsSeeding(false);
    }
  };

  const joinedHalls = halls.filter((h) => h.joined);
  const totalMonthlyDividend = joinedHalls.reduce((a, h) => a + h.myDividendMonthly, 0);
  const totalOwnership = joinedHalls.reduce((a, h) => a + h.myOwnership, 0);
  const totalPACs = joinedHalls.reduce((a, h) => a + h.pacCount, 0);
  const totalCommitments = joinedHalls.reduce((a, h) => a + h.commitmentCount, 0);
  const activeProposalsTotal = halls.reduce((a, h) => a + h.activeProposals, 0);
  const totalTreasury = halls.reduce((a, h) => a + h.treasuryBalance, 0);

  const filteredHalls = useMemo(() => {
    let result = halls;
    if (filter !== "all") {
      if (filter === "joined") result = result.filter((h) => h.joined);
      else result = result.filter((h) => h.status === filter);
    }
    if (searchQuery) {
      result = result.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [halls, filter, searchQuery]);

  const paginatedHalls = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredHalls.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHalls, page]);

  const totalPages = Math.ceil(filteredHalls.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  if (authLoading || apiLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-white/30 uppercase tracking-widest">Loading 8th Ledger Halls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-cyan-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-violet-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/[0.015] rounded-full blur-[200px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5">
                  <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Sovereign Parliament</span>
                </div>
                <span className="text-[10px] text-white/20">{halls.length} Halls</span>
                {apiError && <span className="text-[10px] text-amber-400/60">{apiError}</span>}
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Sovereign Halls</h1>
              <p className="text-sm text-white/25 mt-1.5 max-w-xl leading-relaxed">
                Your perpetual asset communities. Ghost halls are invisible to the public.
                Only committers and their invitees see them.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  isSeeding
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-400/50"
                    : "border-violet-500/20 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10"
                )}
              >
                {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {isSeeding ? "Seeding..." : "Seed Demo Halls"}
              </button>
              <FloatingNotifications proposals={PROPOSAL_ALERTS} dividends={RECENT_DIVIDENDS} />
              {user && (
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <Crown className="h-3.5 w-3.5 text-amber-400/60" />
                  <span className="text-[10px] text-white/30">{user.ledgerId}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span className="text-[10px] font-bold text-amber-400">{user.kycTier}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showInfo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
              <GlowCard accent="cyan" className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">How Halls Work</h3>
                    <p className="text-[11px] text-white/35 leading-relaxed">
                      <span className="text-slate-400 font-medium">Ghost</span> — Pool filling. Invisible. Only committers see it.
                      <span className="text-emerald-400 font-medium ml-2">Live</span> — Active governance. Revenue generating.
                      <span className="text-cyan-400 font-medium ml-2">Mature</span> — Fully filled. Stable dividends.
                      <span className="text-rose-400 font-medium ml-2">Dormant</span> — No revenue 90+ days. At risk.
                    </p>
                  </div>
                  <button onClick={() => setShowInfo(false)} className="text-white/15 hover:text-white/30 transition-colors mt-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </GlowCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Monthly Income" value={formatCurrency(totalMonthlyDividend)} sub="Across joined halls" icon={Wallet} color="text-emerald-400" delay={0} />
          <StatCard label="Ownership" value={`${totalOwnership.toFixed(1)}%`} sub={`${joinedHalls.length} halls`} icon={PieChart} color="text-cyan-400" delay={0.05} />
          <StatCard label="PACs" value={totalPACs.toString()} sub="Perpetual contracts" icon={Receipt} color="text-amber-400" delay={0.1} />
          <StatCard label="Commitments" value={totalCommitments.toString()} sub="Pending ownership" icon={Hourglass} color="text-violet-400" delay={0.15} />
          <StatCard label="Active Votes" value={activeProposalsTotal.toString()} sub="Need your vote" icon={Gavel} color="text-rose-400" delay={0.2} />
          <StatCard label="Treasury" value={formatCurrency(totalTreasury)} sub="Combined reserves" icon={Banknote} color="text-yellow-400" delay={0.25} />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-hide">
            {[
              { id: "all", label: "All", count: halls.length },
              { id: "joined", label: "My Halls", count: joinedHalls.length },
              { id: "live", label: "Live", count: halls.filter((h) => h.status === "live").length },
              { id: "mature", label: "Mature", count: halls.filter((h) => h.status === "mature").length },
              { id: "ghost", label: "Ghost", count: halls.filter((h) => h.status === "ghost").length },
              { id: "dormant", label: "Dormant", count: halls.filter((h) => h.status === "dormant").length },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setFilter(tab.id as any)} className={cn("flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap border", filter === tab.id ? "bg-white/[0.08] text-white border-white/15 shadow-lg shadow-white/[0.03]" : "bg-transparent text-white/25 border-white/[0.04] hover:bg-white/[0.03] hover:text-white/45")}>
                {tab.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", filter === tab.id ? "bg-white/10 text-white/50" : "bg-white/[0.03] text-white/15")}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/15" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search halls, locations, categories..." className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/15 outline-none focus:border-cyan-500/20 focus:bg-white/[0.04] transition-all" />
            </div>
            <div className="flex items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
              <button onClick={() => setViewMode("grid")} className={cn("rounded-lg p-1.5 transition-all", viewMode === "grid" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40")}><Grid className="h-3.5 w-3.5" /></button>
              <button onClick={() => setViewMode("list")} className={cn("rounded-lg p-1.5 transition-all", viewMode === "list" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40")}><List className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>

        <div className={cn("gap-5", viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col")}>
          <AnimatePresence mode="popLayout">
            {paginatedHalls.map((hall, index) => (
              <HallCard key={hall.id} hall={hall} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {filteredHalls.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-16 text-center">
            <Search className="mx-auto h-10 w-10 text-white/8 mb-4" />
            <p className="text-sm text-white/25">No halls match your criteria.</p>
            <p className="text-xs text-white/15 mt-2">{halls.length === 0 ? "No halls in the database yet. Click 'Seed Demo Halls' to generate all 11 verticals." : "Try adjusting your search or filter."}</p>
          </motion.div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredHalls.length}
          onPageChange={setPage}
        />

        <div className="h-16" />
      </div>
    </div>
  );
}