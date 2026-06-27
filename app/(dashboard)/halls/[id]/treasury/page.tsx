"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp, Hexagon, Plane,
  Sprout, Sun, ArrowUpRight, ArrowDownRight, BarChart3,
  PieChart, ChevronLeft,
  Download, TrendingDown, Coins,
  PiggyBank, Landmark as LandmarkIcon,
  ArrowRight,
  History, RotateCcw, Sparkles, Info, CheckCircle2
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type VerticalId = "propvin" | "autovin" | "eduvin" | "accessvin" | "healthvin" | "bizvin" | "techvin" | "travelvin" | "agrivin" | "energyvin";

interface RevenueMonth {
  month: string;
  gross: number;
  community80: number;
  vin20: number;
  expenses: number;
  net: number;
}

interface ReserveAllocation {
  label: string;
  amount: number;
  percent: number;
  color: string;
}

interface DividendRecord {
  id: string;
  date: string;
  amount: number;
  source: string;
  claimed: boolean;
}

/* ============================================================
   VERTICAL CONFIG
   ============================================================ */
const VERTICAL_CONFIG: Record<VerticalId, {
  name: string; color: string; bg: string; border: string;
  gradient: string; icon: React.ElementType;
}> = {
  propvin: { name: "PropVin Hall", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/5 to-orange-500/5", icon: Landmark },
  autovin: { name: "AutoVin Hall", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500/5 to-blue-500/5", icon: Zap },
  eduvin: { name: "EduVin Hall", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/5 to-purple-500/5", icon: Crown },
  accessvin: { name: "AccessVin Hall", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/5 to-teal-500/5", icon: Lock },
  healthvin: { name: "HealthVin Hall", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500/5 to-pink-500/5", icon: HeartPulse },
  bizvin: { name: "BizVin Hall", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/5 to-red-500/5", icon: TrendingUp },
  techvin: { name: "TechVin Hall", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/5 to-blue-500/5", icon: Hexagon },
  travelvin: { name: "TravelVin Hall", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/5 to-cyan-500/5", icon: Plane },
  agrivin: { name: "AgriVin Hall", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", gradient: "from-green-500/5 to-emerald-500/5", icon: Sprout },
  energyvin: { name: "EnergyVin Hall", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/5 to-amber-500/5", icon: Sun },
};

/* ============================================================
   MOCK DATA
   ============================================================ */
const REVENUE_DATA: RevenueMonth[] = [
  { month: "Jan", gross: 7200, community80: 5760, vin20: 1440, expenses: 1200, net: 4560 },
  { month: "Feb", gross: 6800, community80: 5440, vin20: 1360, expenses: 900, net: 4540 },
  { month: "Mar", gross: 8100, community80: 6480, vin20: 1620, expenses: 1500, net: 4980 },
  { month: "Apr", gross: 7900, community80: 6320, vin20: 1580, expenses: 1100, net: 5220 },
  { month: "May", gross: 8500, community80: 6800, vin20: 1700, expenses: 1300, net: 5500 },
  { month: "Jun", gross: 9200, community80: 7360, vin20: 1840, expenses: 1600, net: 5760 },
  { month: "Jul", gross: 8800, community80: 7040, vin20: 1760, expenses: 1400, net: 5640 },
  { month: "Aug", gross: 9500, community80: 7600, vin20: 1900, expenses: 1800, net: 5800 },
  { month: "Sep", gross: 10200, community80: 8160, vin20: 2040, expenses: 2000, net: 6160 },
  { month: "Oct", gross: 9800, community80: 7840, vin20: 1960, expenses: 1700, net: 6140 },
  { month: "Nov", gross: 10500, community80: 8400, vin20: 2100, expenses: 1900, net: 6500 },
  { month: "Dec", gross: 11200, community80: 8960, vin20: 2240, expenses: 2200, net: 6760 },
];

const RESERVE_ALLOCATION: ReserveAllocation[] = [
  { label: "Maintenance Reserve", amount: 18500, percent: 35, color: "bg-cyan-500" },
  { label: "Insurance Fund", amount: 12000, percent: 22, color: "bg-emerald-500" },
  { label: "Emergency Buffer", amount: 8500, percent: 16, color: "bg-amber-500" },
  { label: "Reinvestment", amount: 7200, percent: 13, color: "bg-violet-500" },
  { label: "Dividend Pool", amount: 7800, percent: 14, color: "bg-rose-500" },
];

const DIVIDEND_HISTORY: DividendRecord[] = [
  { id: "d1", date: "Dec 2025", amount: 450, source: "PropVin Rental", claimed: true },
  { id: "d2", date: "Nov 2025", amount: 420, source: "PropVin Rental", claimed: true },
  { id: "d3", date: "Oct 2025", amount: 390, source: "PropVin Rental", claimed: true },
  { id: "d4", date: "Sep 2025", amount: 380, source: "PropVin Rental", claimed: false },
  { id: "d5", date: "Aug 2025", amount: 410, source: "PropVin Rental", claimed: true },
  { id: "d6", date: "Jul 2025", amount: 395, source: "PropVin Rental", claimed: true },
];

/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ============================================================
   COMPONENT — Animated Counter
   ============================================================ */
function AnimatedValue({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  React.useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 1000;
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
   COMPONENT — 80/20 Split Donut
   ============================================================ */
function SplitDonut({ community, vin, size = 140 }: { community: number; vin: number; size?: number }) {
  const total = community + vin;
  const communityPercent = (community / total) * 100;
  const vinPercent = (vin / total) * 100;
  const radius = (size - 16) / 2;
  const circumference = radius * 2 * Math.PI;
  const communityOffset = circumference - (communityPercent / 100) * circumference;
  const vinOffset = circumference - (vinPercent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={12} />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: communityOffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#10b981" strokeWidth={12}
          strokeLinecap="round" strokeDasharray={circumference}
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: vinOffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#06b6d4" strokeWidth={12}
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={communityOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{formatCurrency(total)}</span>
        <span className="text-[9px] text-white/20">Total Revenue</span>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Revenue Bar Chart
   ============================================================ */
function RevenueChart({ data }: { data: RevenueMonth[] }) {
  const maxGross = Math.max(...data.map((d) => d.gross));
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 h-48">
        {data.map((month, i) => {
          const grossHeight = (month.gross / maxGross) * 100;
          const communityHeight = (month.community80 / maxGross) * 100;
          const vinHeight = (month.vin20 / maxGross) * 100;
          const isHovered = hoveredMonth === i;

          return (
            <div
              key={month.month}
              className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
              onMouseEnter={() => setHoveredMonth(i)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <div className="relative w-full flex-1 flex items-end gap-0.5">
                {/* Community 80% */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${communityHeight}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className={cn(
                    "flex-1 rounded-t-sm bg-emerald-500/60 transition-all",
                    isHovered && "bg-emerald-500/80"
                  )}
                />
                {/* VIN 20% */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${vinHeight}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 + 0.1 }}
                  className={cn(
                    "flex-1 rounded-t-sm bg-cyan-500/40 transition-all",
                    isHovered && "bg-cyan-500/60"
                  )}
                />
              </div>
              <span className={cn("text-[9px] transition-colors", isHovered ? "text-white" : "text-white/20")}>
                {month.month}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredMonth !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="rounded-xl border border-white/10 bg-[#0a0a14] p-3 shadow-xl"
          >
            <p className="text-xs font-bold text-white mb-2">{data[hoveredMonth].month} 2025</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-6">
                <span className="text-white/40">Gross Revenue</span>
                <span className="text-white font-bold">{formatCurrency(data[hoveredMonth].gross)}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-emerald-400/60">Community (80%)</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(data[hoveredMonth].community80)}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-cyan-400/60">VIN Protocol (20%)</span>
                <span className="text-cyan-400 font-bold">{formatCurrency(data[hoveredMonth].vin20)}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-white/20">Expenses</span>
                <span className="text-white/40">-{formatCurrency(data[hoveredMonth].expenses)}</span>
              </div>
              <div className="border-t border-white/5 pt-1 flex items-center justify-between gap-6">
                <span className="text-white/60">Net to Treasury</span>
                <span className="text-white font-bold">{formatCurrency(data[hoveredMonth].net)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-6 text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/60" />
          <span className="text-white/30">Community 80%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500/40" />
          <span className="text-white/30">VIN Protocol 20%</span>
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Reserve Gauge
   ============================================================ */
function ReserveGauge({ allocation }: { allocation: ReserveAllocation[] }) {
  return (
    <div className="space-y-3">
      {allocation.map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{formatCurrency(item.amount)}</span>
              <span className="text-[10px] text-white/20">{item.percent}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.percent}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className={cn("h-full rounded-full", item.color)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   COMPONENT — Burn Rate Card
   ============================================================ */
function BurnRateCard() {
  const monthlyBurn = 4200;
  const runwayMonths = 12.4;
  const burnTrend = -8; // decreasing

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
          Burn Rate
        </h3>
        <span className={cn("text-[10px] font-bold flex items-center gap-1", burnTrend < 0 ? "text-emerald-400" : "text-rose-400")}>
          <ArrowDownRight className="h-3 w-3" />{Math.abs(burnTrend)}% vs last month
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl font-bold text-white">{formatCurrency(monthlyBurn)}</span>
        <span className="text-[10px] text-white/20 mb-1">/month</span>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-white/30">Runway</span>
          <span className="text-white font-bold">{runwayMonths} months</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full" style={{ width: `${(runwayMonths / 24) * 100}%` }} />
        </div>
        <p className="text-[9px] text-white/15 mt-1">At current burn, reserves deplete by Jun 2027</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center">
          <p className="text-xs font-bold text-white">$2,100</p>
          <p className="text-[9px] text-white/20">Maintenance</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center">
          <p className="text-xs font-bold text-white">$1,200</p>
          <p className="text-[9px] text-white/20">Insurance</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center">
          <p className="text-xs font-bold text-white">$600</p>
          <p className="text-[9px] text-white/20">Utilities</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center">
          <p className="text-xs font-bold text-white">$300</p>
          <p className="text-[9px] text-white/20">Management</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Dividend Claim Card
   ============================================================ */
function DividendClaimCard({ available }: { available: number }) {
  const [claimed, setClaimed] = useState(false);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border backdrop-blur-sm p-5 transition-all",
        claimed ? "border-emerald-500/20 bg-emerald-950/10" : "border-amber-500/20 bg-amber-950/10"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Coins className={cn("h-3.5 w-3.5", claimed ? "text-emerald-400" : "text-amber-400")} />
          {claimed ? "Dividend Claimed" : "Dividend Available"}
        </h3>
        <span className="text-[10px] text-white/20">Monthly cycle</span>
      </div>

      <div className="flex items-end gap-2 mb-4">
        <span className={cn("text-3xl font-bold", claimed ? "text-emerald-400" : "text-amber-400")}>
          {claimed ? "0" : formatCurrency(available)}
        </span>
        <span className="text-xs text-white/20 mb-1">VIN</span>
      </div>

      {!claimed && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30">Your ownership</span>
            <span className="text-white font-bold">2.5%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30">Hall revenue this month</span>
            <span className="text-white font-bold">{formatCurrency(8500)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30">80% community share</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(6800)}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
            <span className="text-white/40">Your share</span>
            <span className="text-amber-400 font-bold">{formatCurrency(available)}</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setClaimed(true)}
        disabled={claimed}
        className={cn(
          "w-full mt-4 rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2",
          claimed
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
        )}
      >
        {claimed ? <CheckCircle2 className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
        {claimed ? "Claimed — Minted to Wallet" : "Claim Dividend"}
      </button>

      {claimed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-emerald-400/50 mt-2 text-center"
        >
          450 VIN minted to your wallet. Next cycle: Jan 1, 2026.
        </motion.p>
      )}
    </motion.div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallTreasuryPage() {
  const params = useParams();
  const hallId = (params.id as VerticalId) || "propvin";
  const config = VERTICAL_CONFIG[hallId] || VERTICAL_CONFIG.propvin;
  const HallIcon = config.icon;

  const totalRevenue = REVENUE_DATA.reduce((a, m) => a + m.gross, 0);
  const totalCommunity = REVENUE_DATA.reduce((a, m) => a + m.community80, 0);
  const totalVin = REVENUE_DATA.reduce((a, m) => a + m.vin20, 0);
  const currentTreasury = 52800;
  const totalDividends = DIVIDEND_HISTORY.reduce((a, d) => a + d.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-cyan-500/3 rounded-full blur-[128px]" />
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
              <h1 className={cn("text-xl font-bold", config.color)}>{config.name}</h1>
              <p className="text-xs text-white/30">Hall Treasury — 80/20 Split Visualization</p>
            </div>
          </div>
        </motion.div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Treasury Balance</span>
              <LandmarkIcon className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              <AnimatedValue value={currentTreasury} prefix="$" />
            </p>
            <p className="text-[10px] text-white/20 mt-1">Across all reserves</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Annual Revenue</span>
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              <AnimatedValue value={totalRevenue} prefix="$" />
            </p>
            <p className="text-[10px] text-emerald-400/50 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />+12.4% YoY
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Community Share</span>
            <PieChart className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              <AnimatedValue value={totalCommunity} prefix="$" />
            </p>
            <p className="text-[10px] text-white/20 mt-1">80% of gross revenue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">VIN Protocol</span>
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              <AnimatedValue value={totalVin} prefix="$" />
            </p>
            <p className="text-[10px] text-white/20 mt-1">20% of gross revenue</p>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Revenue Chart + 80/20 Split */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-cyan-400" />
                    Revenue History
                  </h3>
                  <p className="text-[10px] text-white/20 mt-1">Monthly gross revenue with 80/20 split breakdown</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    2025
                  </button>
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/40 hover:text-white hover:bg-white/10 transition-all">
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <RevenueChart data={REVENUE_DATA} />
            </div>

            {/* 80/20 Split Visualization */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-emerald-400" />
                    The 80/20 Split
                  </h3>
                  <p className="text-[10px] text-white/20 mt-1">Gross revenue distribution. No exceptions. Forever.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <SplitDonut community={totalCommunity} vin={totalVin} size={160} />

                <div className="flex-1 space-y-4">
                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-950/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-emerald-400">Community Treasury</span>
                      </div>
                      <span className="text-xs font-bold text-white">80%</span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatCurrency(totalCommunity)}</p>
                    <p className="text-[10px] text-white/20 mt-1">Split by ownership % among all PAC holders</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400/50">
                      <ArrowRight className="h-3 w-3" />
                      <span>Your monthly share: {formatCurrency(450)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-500/10 bg-cyan-950/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-cyan-500" />
                        <span className="text-xs font-bold text-cyan-400">VIN Protocol</span>
                      </div>
                      <span className="text-xs font-bold text-white">20%</span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatCurrency(totalVin)}</p>
                    <p className="text-[10px] text-white/20 mt-1">Platform operations, insurance, development</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-cyan-400/50">
                      <ArrowRight className="h-3 w-3" />
                      <span>3% auto-deposited to Insurance Fund</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reserve Allocation */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-amber-400" />
                  Reserve Allocation
                </h3>
                <span className="text-[10px] text-white/20">{formatCurrency(currentTreasury)} total</span>
              </div>
              <ReserveGauge allocation={RESERVE_ALLOCATION} />
            </div>
          </div>

          {/* Right: Claim + Burn + History */}
          <div className="space-y-6">
            <DividendClaimCard available={450} />

            <BurnRateCard />

            {/* Dividend History */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-violet-400" />
                  Dividend History
                </h3>
                <span className="text-[10px] text-white/20">{formatCurrency(totalDividends)} total</span>
              </div>

              <div className="space-y-2">
                {DIVIDEND_HISTORY.map((div) => (
                  <div key={div.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div>
                      <p className="text-xs font-medium text-white">{div.date}</p>
                      <p className="text-[10px] text-white/20">{div.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">{formatCurrency(div.amount)}</p>
                      <p className={cn("text-[9px]", div.claimed ? "text-emerald-400/50" : "text-amber-400/50")}>
                        {div.claimed ? "Claimed" : "Unclaimed"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/dividends">
                <button className="w-full mt-3 rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-semibold text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  Full Dividend Dashboard
                </button>
              </Link>
            </div>

            {/* Reinvestment Proposals */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                  Reinvestment Queue
                </h3>
                <span className="text-[10px] text-white/20">3 pending</span>
              </div>

              <div className="space-y-2">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60">Solar Panel Upgrade</span>
                    <span className="text-xs font-bold text-white">{formatCurrency(15000)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-cyan-500/50 rounded-full" style={{ width: "67%" }} />
                  </div>
                  <p className="text-[9px] text-white/15 mt-1">67% voted — needs 51%</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60">Security System</span>
                    <span className="text-xs font-bold text-white">{formatCurrency(8500)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-cyan-500/50 rounded-full" style={{ width: "34%" }} />
                  </div>
                  <p className="text-[9px] text-white/15 mt-1">34% voted — needs 51%</p>
                </div>
              </div>

              <Link href={`/halls/${hallId}/governance`}>
                <button className="w-full mt-3 rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-semibold text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  Vote on Proposals
                </button>
              </Link>
            </div>

            {/* Protocol Info */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-white/20" />
                Protocol Rules
              </h3>
              <div className="space-y-2 text-[10px] text-white/20">
                <p className="flex items-start gap-2">
                  <span className="text-emerald-400/50 shrink-0">80%</span>
                  Community treasury split by ownership percentage
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-cyan-400/50 shrink-0">20%</span>
                  VIN Protocol fee — no exceptions, forever
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-400/50 shrink-0">3%</span>
                  Auto-deposited to VIN Insurance Fund from surplus
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-rose-400/50 shrink-0">24h</span>
                  Dividend claim window before auto-rollover
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
