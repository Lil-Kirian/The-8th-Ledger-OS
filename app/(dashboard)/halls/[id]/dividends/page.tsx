"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp, Hexagon, Plane,
  Sprout, Sun, ChevronLeft, Wallet, Coins, Clock, CheckCircle2, Percent, Target, BarChart3,
  Download, Calculator, Receipt,
  Diamond, Star, Shield, Zap as ZapIcon, Flame as FlameIcon,
  Crown as CrownIcon
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type VerticalId = "propvin" | "autovin" | "eduvin" | "accessvin" | "healthvin" | "bizvin" | "techvin" | "travelvin" | "agrivin" | "energyvin";

interface DividendRecord {
  id: string;
  date: string;
  month: string;
  grossRevenue: number;
  communityShare: number;
  yourShare: number;
  vinFee: number;
  claimed: boolean;
  claimedAt?: string;
  source: string;
}

interface ROIScenario {
  label: string;
  rent: number;
  commitment: number;
  ownership: number;
  monthlyReturn: number;
  annualReturn: number;
  fiveYearReturn: number;
  roi: number;
}

interface HallDividendsResponse {
  success: boolean;
  dividends: Array<{
    id: string;
    grossAmount: number;
    ownershipPercent: number;
    entitlement: number;
    status: "claimed" | "unclaimed";
    claimedAt: string | null;
    createdAt: string;
    revenueDate: string;
  }>;
  summary: {
    totalUnclaimed: number;
    totalClaimed: number;
    totalRecords: number;
    unclaimedCount: number;
    claimedCount: number;
    ownershipPercent: number;
    canClaim: boolean;
    tier: string;
  };
}

/* ============================================================
   VERTICAL CONFIG
   ============================================================ */
const VERTICAL_CONFIG: Record<VerticalId, {
  name: string; color: string; bg: string; border: string;
  gradient: string; icon: React.ElementType;
}> = {
  propvin: { name: "PropVin", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/5 to-orange-500/5", icon: Landmark },
  autovin: { name: "AutoVin", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500/5 to-blue-500/5", icon: Zap },
  eduvin: { name: "EduVin", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/5 to-purple-500/5", icon: Crown },
  accessvin: { name: "AccessVin", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/5 to-teal-500/5", icon: Lock },
  healthvin: { name: "HealthVin", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500/5 to-pink-500/5", icon: HeartPulse },
  bizvin: { name: "BizVin", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/5 to-red-500/5", icon: TrendingUp },
  techvin: { name: "TechVin", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/5 to-blue-500/5", icon: Hexagon },
  travelvin: { name: "TravelVin", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/5 to-cyan-500/5", icon: Plane },
  agrivin: { name: "AgriVin", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", gradient: "from-green-500/5 to-emerald-500/5", icon: Sprout },
  energyvin: { name: "EnergyVin", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/5 to-amber-500/5", icon: Sun },
};



/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json as T;
}

function monthLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function mapDividend(entry: HallDividendsResponse["dividends"][number]): DividendRecord {
  const grossRevenue = Number(entry.grossAmount || 0);
  const communityShare = grossRevenue * 0.8;
  return {
    id: entry.id,
    date: dateLabel(entry.revenueDate || entry.createdAt),
    month: monthLabel(entry.revenueDate || entry.createdAt),
    grossRevenue,
    communityShare,
    yourShare: Number(entry.entitlement || 0),
    vinFee: grossRevenue - communityShare,
    claimed: entry.status === "claimed",
    claimedAt: entry.claimedAt ? dateLabel(entry.claimedAt) : undefined,
    source: "Revenue distribution",
  };
}

/* ============================================================
   TIER BADGE
   ============================================================ */
function TierBadge({ tier, showGlow = false }: { tier: number; showGlow?: boolean }) {
  const config: Record<number, { icon: React.ElementType; color: string; border: string; bg: string; label: string }> = {
    1: { icon: Star, color: "text-slate-400", border: "border-slate-500/20", bg: "bg-slate-500/10", label: "Initiate" },
    2: { icon: ZapIcon, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/10", label: "Operant" },
    3: { icon: Shield, color: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10", label: "Vanguard" },
    4: { icon: CrownIcon, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/10", label: "Archon" },
    5: { icon: Diamond, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", label: "Sovereign" },
    10: { icon: FlameIcon, color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10", label: "Founder" },
  };
  const c = config[tier] || config[1];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border ${c.border} ${c.bg} ${c.color} ${showGlow ? "shadow-[0_0_10px_-3px_rgba(255,255,255,0.1)]" : ""}`}>
      <Icon className="h-2.5 w-2.5" />{c.label}
    </span>
  );
}

/* ============================================================
   COMPONENT — Animated Number
   ============================================================ */
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  React.useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(start + (end - start) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ============================================================
   COMPONENT — Dividend Claim Card
   ============================================================ */
function ClaimCard({ record, onClaim }: { record: DividendRecord; onClaim: (id: string) => Promise<void> }) {
  const [claiming, setClaiming] = useState(false);
  const claimed = record.claimed;

  async function handleClaim() {
    setClaiming(true);
    try {
      await onClaim(record.id);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border backdrop-blur-sm p-5 transition-all",
        claimed ? "border-emerald-500/10 bg-emerald-950/5" : "border-amber-500/10 bg-amber-950/5"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-white">{record.month}</span>
            <span className="text-[10px] text-white/20">{record.source}</span>
          </div>
          <p className="text-[10px] text-white/20">{record.date}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-bold", claimed ? "text-emerald-400" : "text-amber-400")}>
            {formatCurrency(record.yourShare)}
          </p>
          <p className="text-[10px] text-white/20">Your share</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/20">Gross Revenue</span>
          <span className="text-white/40">{formatCurrency(record.grossRevenue)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400/40">Community (80%)</span>
          <span className="text-emerald-400/60">{formatCurrency(record.communityShare)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-cyan-400/40">VIN Protocol (20%)</span>
          <span className="text-cyan-400/60">{formatCurrency(record.vinFee)}</span>
        </div>
        <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
          <span className="text-white/30">Your Ownership</span>
          <span className="text-white font-bold">2.5%</span>
        </div>
      </div>

      {/* Claim Button */}
      {!claimed ? (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {claiming ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Coins className="h-4 w-4" />
              Claim {formatCurrency(record.yourShare)}
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">Claimed</span>
          </div>
          <span className="text-[10px] text-emerald-400/50">{record.claimedAt}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — ROI Simulator
   ============================================================ */
function ROISimulator() {
  const [rent, setRent] = useState(8500);
  const [commitment, setCommitment] = useState(5000);
  const [ownership, setOwnership] = useState(2.5);

  const communityShare = rent * 0.8;
  const monthlyReturn = communityShare * (ownership / 100);
  const annualReturn = monthlyReturn * 12;
  const fiveYearReturn = annualReturn * 5;
  const roi = (annualReturn / commitment) * 100;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calculator className="h-4 w-4 text-cyan-400" />
          ROI Simulator
        </h3>
        <span className="text-[10px] text-white/20">Interactive</span>
      </div>

      <p className="text-xs text-white/30 mb-4">
        "If monthly rent is <span className="text-white font-bold">{formatCurrency(rent)}</span>, your <span className="text-white font-bold">{formatCurrency(commitment)}</span> commitment returns <span className="text-emerald-400 font-bold">{formatCurrency(monthlyReturn)}</span>/month."
      </p>

      {/* Sliders */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Monthly Rent</label>
            <span className="text-xs font-bold text-white">{formatCurrency(rent)}</span>
          </div>
          <input
            type="range"
            min="1000"
            max="20000"
            step="100"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[9px] text-white/10 mt-1">
            <span>$1k</span>
            <span>$20k</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Your Commitment</label>
            <span className="text-xs font-bold text-white">{formatCurrency(commitment)}</span>
          </div>
          <input
            type="range"
            min="500"
            max="50000"
            step="500"
            value={commitment}
            onChange={(e) => setCommitment(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-white/10 mt-1">
            <span>$500</span>
            <span>$50k</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Your Ownership %</label>
            <span className="text-xs font-bold text-white">{ownership}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="50"
            step="0.1"
            value={ownership}
            onChange={(e) => setOwnership(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[9px] text-white/10 mt-1">
            <span>0.1%</span>
            <span>50%</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-950/10 p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(monthlyReturn)}</p>
          <p className="text-[9px] text-white/20 uppercase">Monthly</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-cyan-950/10 p-3 text-center">
          <p className="text-lg font-bold text-cyan-400">{formatCurrency(annualReturn)}</p>
          <p className="text-[9px] text-white/20 uppercase">Annual</p>
        </div>
        <div className="rounded-xl border border-violet-500/10 bg-violet-950/10 p-3 text-center">
          <p className="text-lg font-bold text-violet-400">{formatCurrency(fiveYearReturn)}</p>
          <p className="text-[9px] text-white/20 uppercase">5-Year</p>
        </div>
        <div className="rounded-xl border border-amber-500/10 bg-amber-950/10 p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{roi.toFixed(1)}%</p>
          <p className="text-[9px] text-white/20 uppercase">ROI</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <p className="text-[10px] text-white/20 text-center">
          Formula: (Gross Rent × 80%) × Your Ownership % = Your Monthly Dividend
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Annual Projection
   ============================================================ */
function AnnualProjection({ records }: { records: DividendRecord[] }) {
  const months = records.slice(0, 12).reverse();
  const total = months.reduce((a, m) => a + m.yourShare, 0);
  const avg = total / months.length;
  const projected = avg * 12;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-400" />
          Annual Projection
        </h3>
        <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
          <Download className="h-3 w-3" />Statement
        </button>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-32 mb-4">
        {months.map((m, i) => {
          const max = Math.max(...months.map((r) => r.yourShare));
          const height = max > 0 ? (m.yourShare / max) * 100 : 0;
          return (
            <div key={m.id} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                className={cn(
                  "w-full rounded-t-sm",
                  m.claimed ? "bg-emerald-500/50" : "bg-amber-500/30"
                )}
              />
              <span className="text-[8px] text-white/20">{m.month.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-white/30">12-Month Total</span>
        <span className="text-white font-bold">{formatCurrency(total)}</span>
      </div>
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-white/30">Monthly Average</span>
        <span className="text-white font-bold">{formatCurrency(avg)}</span>
      </div>
      <div className="border-t border-white/5 pt-3 flex items-center justify-between text-sm">
        <span className="text-white/40">Projected Annual</span>
        <span className="text-violet-400 font-bold">{formatCurrency(projected)}</span>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallDividendsPage() {
  const params = useParams();
  const hallId = params.id as string;
  const config = VERTICAL_CONFIG.propvin;
  const HallIcon = config.icon;

  const { data, error, isLoading, mutate } = useSWR<HallDividendsResponse>(
    hallId ? `/api/halls/${hallId}/dividends` : null,
    fetchJson,
  );
  const records = useMemo(() => (data?.dividends || []).map(mapDividend), [data]);
  const [filter, setFilter] = useState<"all" | "claimed" | "unclaimed">("all");

  const filtered = useMemo(() => {
    if (filter === "claimed") return records.filter((r) => r.claimed);
    if (filter === "unclaimed") return records.filter((r) => !r.claimed);
    return records;
  }, [records, filter]);

  const totalClaimed = data?.summary.totalClaimed ?? records.filter((r) => r.claimed).reduce((a, r) => a + r.yourShare, 0);
  const totalUnclaimed = data?.summary.totalUnclaimed ?? records.filter((r) => !r.claimed).reduce((a, r) => a + r.yourShare, 0);
  const totalAll = records.reduce((a, r) => a + r.yourShare, 0);
  const avgDividend = records.length ? totalAll / records.length : 0;
  const ownershipPct = data?.summary.ownershipPercent || 0;
  const roiScenarios: ROIScenario[] = [
    { label: "Current", rent: avgDividend, commitment: totalAll, ownership: ownershipPct, monthlyReturn: avgDividend, annualReturn: avgDividend * 12, fiveYearReturn: avgDividend * 60, roi: totalAll > 0 ? Math.round(((avgDividend * 12) / totalAll) * 100) : 0 },
    { label: "Optimistic", rent: avgDividend * 1.25, commitment: totalAll, ownership: ownershipPct, monthlyReturn: avgDividend * 1.25, annualReturn: avgDividend * 15, fiveYearReturn: avgDividend * 75, roi: totalAll > 0 ? Math.round(((avgDividend * 15) / totalAll) * 100) : 0 },
    { label: "Conservative", rent: avgDividend * 0.75, commitment: totalAll, ownership: ownershipPct, monthlyReturn: avgDividend * 0.75, annualReturn: avgDividend * 9, fiveYearReturn: avgDividend * 45, roi: totalAll > 0 ? Math.round(((avgDividend * 9) / totalAll) * 100) : 0 },
  ];

  async function handleClaim(_id: string) {
    const res = await fetch(`/api/halls/${hallId}/dividends`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      window.alert(json.error || "Dividend claim failed");
      return;
    }
    await mutate();
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/halls/${hallId}`}>
              <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Link>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10", config.bg)}>
              <HallIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <h1 className={cn("text-xl font-bold", config.color)}>{config.name} Dividends</h1>
              <p className="text-xs text-white/30">Personal dividend history • Claim • ROI simulator</p>
            </div>
          </div>
        </motion.div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Total Claimed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              <AnimatedNumber value={totalClaimed} prefix="$" />
            </p>
            <p className="text-[10px] text-white/20 mt-1">{records.filter((r) => r.claimed).length} months</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Unclaimed</span>
              <Coins className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">
              <AnimatedNumber value={totalUnclaimed} prefix="$" />
            </p>
            <p className="text-[10px] text-white/20 mt-1">{records.filter((r) => !r.claimed).length} pending</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Lifetime Total</span>
              <Wallet className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              <AnimatedNumber value={totalAll} prefix="$" />
            </p>
            <p className="text-[10px] text-white/20 mt-1">Since Jan 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Your Ownership</span>
              <Percent className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-violet-400">2.5%</p>
            <p className="text-[10px] text-white/20 mt-1">Of hall revenue</p>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Dividend History */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4">
              {[
                { id: "all" as const, label: "All", count: records.length },
                { id: "claimed" as const, label: "Claimed", count: records.filter((r) => r.claimed).length },
                { id: "unclaimed" as const, label: "Unclaimed", count: records.filter((r) => !r.claimed).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all border",
                    filter === tab.id
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-white/[0.02] text-white/30 border-white/5 hover:bg-white/[0.05] hover:text-white/50"
                  )}
                >
                  {tab.label}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", filter === tab.id ? "bg-white/10 text-white/60" : "bg-white/5 text-white/20")}>
                    {tab.count}
                  </span>
                </button>
              ))}
              <button className="ml-auto rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                <Download className="h-3 w-3" />CSV
              </button>
            </div>

            {/* Claim All Banner */}
            {records.some((r) => !r.claimed) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 to-[#0a0a14] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Coins className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{records.filter((r) => !r.claimed).length} unclaimed dividends</p>
                    <p className="text-xs text-amber-400/50">Total: {formatCurrency(totalUnclaimed)} waiting</p>
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(records.find((r) => !r.claimed)?.id || "")}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30"
                >
                  Claim All
                </button>
              </motion.div>
            )}

            {/* Dividend Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="md:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
                  <Coins className="mx-auto h-10 w-10 text-white/10 mb-4 animate-pulse" />
                  <p className="text-sm text-white/30">Loading dividend history...</p>
                </div>
              ) : error ? (
                <div className="md:col-span-2 rounded-2xl border border-rose-500/10 bg-rose-950/5 p-16 text-center">
                  <Receipt className="mx-auto h-10 w-10 text-rose-400/40 mb-4" />
                  <p className="text-sm text-rose-200/70">{error.message}</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((record) => (
                    <ClaimCard key={record.id} record={record} onClaim={handleClaim} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {!isLoading && !error && filtered.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
                <Coins className="mx-auto h-10 w-10 text-white/10 mb-4" />
                <p className="text-sm text-white/30">No dividends match your filter.</p>
              </div>
            )}
          </div>

          {/* Right: Simulator + Projection */}
          <div className="space-y-6">
            <ROISimulator />

            <AnnualProjection records={records} />

            {/* Tax Summary */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-cyan-400" />
                Tax Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/30">Gross Dividends</span>
                  <span className="text-white">{formatCurrency(totalAll)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30">8th Ledger Fee (20%)</span>
                  <span className="text-cyan-400/60">-{formatCurrency(records.reduce((a, r) => a + r.vinFee, 0))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30">Community Share (80%)</span>
                  <span className="text-emerald-400/60">{formatCurrency(records.reduce((a, r) => a + r.communityShare, 0))}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                  <span className="text-white/40">Your Net ({ownershipPct.toFixed(2)}%)</span>
                  <span className="text-white font-bold">{formatCurrency(totalAll)}</span>
                </div>
              </div>
              <p className="text-[9px] text-white/10 mt-3">
                * Tax obligations vary by jurisdiction. Consult your local advisor. 8th Ledger provides transaction logs for audit.
              </p>
            </div>

            {/* Scenarios */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-amber-400" />
                Scenario Comparison
              </h3>
              <div className="space-y-2">
                {roiScenarios.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border p-3 transition-all",
                      i === 0 ? "border-cyan-500/20 bg-cyan-950/10" : "border-white/5 bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-bold", i === 0 ? "text-cyan-400" : "text-white/40")}>{s.label}</span>
                      <span className="text-xs font-bold text-white">{s.roi}% ROI</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/20">
                      <span>Rent: {formatCurrency(s.rent)}</span>
                      <span>5Y: {formatCurrency(s.fiveYearReturn)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Dividend */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Next Cycle
              </h3>
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-950/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Estimated</span>
                  <span className="text-xs font-bold text-emerald-400">{formatCurrency(avgDividend)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: "78%" }} />
                </div>
                <p className="text-[9px] text-white/15 mt-1">Calculated from current dividend history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
