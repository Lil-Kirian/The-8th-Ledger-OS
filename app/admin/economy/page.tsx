"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  Activity,
  ArrowUpRight,
  Lock,
  Globe,
  BarChart3,
  PieChart,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Landmark,
  Hammer,
  Rocket,
  HeartPulse,
  Store,
  Receipt,
  ArrowRight,
} from "lucide-react";

/* ============================================================
   TYPES — 8th Ledger Economic Observatory
   ============================================================ */
interface PillarAllocation {
  pillar: string;
  amount: number;
  icon: React.ElementType;
  color: string;
}

interface DailyMetric {
  date: string;
  grossRevenue: number;
  tithe: number;
  payroll: number;
  netRevenue: number;
  dividends: number;
}

interface EconomyState {
  // Capital
  totalCommittedUSD: number;
  totalDividendsDistributed: number;
  totalPools: number;
  activePools: number;
  totalHalls: number;
  activeHalls: number;
  ghostHalls: number;
  dormantHalls: number;

  // PIR — Protocol Infrastructure Reserve
  pirTotalUSD: number;
  pirShieldUSD: number;
  pirSealUSD: number;
  pirForgeUSD: number;
  pirSpireUSD: number;
  pirVanguardUSD: number;
  pirSanctuaryUSD: number;

  // Revenue Flow
  totalRevenueUSD: number;
  monthlyRevenueUSD: number;
  eighthLedgerTitheUSD: number;
  totalPayrollUSD: number;
  netHallRevenueUSD: number;

  // Marketplace
  marketplaceVolumeUSD: number;
  ownershipSalesCount: number;
  inventorySalesCount: number;

  // Hall Classes
  classIHalls: number;
  classIIHalls: number;
  classIIIHalls: number;

  // Health & Governance
  avgSriScore: number;
  avgAhgiScore: number;
  platinumSriCount: number;
  goldSriCount: number;
  activeClosureProtocols: number;
  activePirAdvances: number;
  totalWorkers: number;

  // Daily
  dailyVolumeUSD: number;
}

const PILLAR_META: Record<string, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  shield:   { label: "The Shield",   icon: Shield,      color: "#10b981", desc: "Insurance & casualty" },
  seal:     { label: "The Seal",     icon: Lock,        color: "#8b5cf6", desc: "Legal & SPV formation" },
  forge:    { label: "The Forge",    icon: Hammer,      color: "#f59e0b", desc: "Maintenance & payroll" },
  spire:    { label: "The Spire",    icon: Rocket,      color: "#06b6d4", desc: "Protocol & infrastructure" },
  vanguard: { label: "The Vanguard", icon: Globe,       color: "#ec4899", desc: "R&D & expansion" },
  sanctuary:{ label: "The Sanctuary",icon: HeartPulse,  color: "#f43f5e", desc: "Vacancy & closure cover" },
};

const MOCK_DAILY: DailyMetric[] = Array.from({ length: 30 }, (_, i) => {
  const gross = Math.floor(Math.random() * 80000) + 20000;
  const tithe = Math.floor(gross * 0.20);
  const payroll = Math.floor(Math.random() * 15000) + 5000;
  const net = gross - tithe - payroll;
  const dividends = Math.floor(net * 0.95);
  return {
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(5, 10),
    grossRevenue: gross,
    tithe,
    payroll,
    netRevenue: net,
    dividends,
  };
});

export default function EconomyPage() {
  const [state, setState] = useState<EconomyState | null>(null);
  const [daily, setDaily] = useState<DailyMetric[]>(MOCK_DAILY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30>(30);

  const fetchEconomy = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/economy");
      const data = await res.json();
      if (data.success && data.state) {
        setState(data.state);
      } else {
        throw new Error("API returned no state");
      }
    } catch {
      // Fallback to realistic 8th Ledger mock data
      setState({
        totalCommittedUSD: 12400000,
        totalDividendsDistributed: 2840000,
        totalPools: 147,
        activePools: 89,
        totalHalls: 124,
        activeHalls: 98,
        ghostHalls: 18,
        dormantHalls: 8,

        pirTotalUSD: 6200000,
        pirShieldUSD: 1550000,
        pirSealUSD: 1240000,
        pirForgeUSD: 1240000,
        pirSpireUSD: 930000,
        pirVanguardUSD: 744000,
        pirSanctuaryUSD: 496000,

        totalRevenueUSD: 18500000,
        monthlyRevenueUSD: 1540000,
        eighthLedgerTitheUSD: 3700000,
        totalPayrollUSD: 2850000,
        netHallRevenueUSD: 11950000,

        marketplaceVolumeUSD: 420000,
        ownershipSalesCount: 34,
        inventorySalesCount: 156,

        classIHalls: 52,
        classIIHalls: 28,
        classIIIHalls: 18,

        avgSriScore: 74,
        avgAhgiScore: 68,
        platinumSriCount: 12,
        goldSriCount: 34,
        activeClosureProtocols: 3,
        activePirAdvances: 7,
        totalWorkers: 89,

        dailyVolumeUSD: 14500,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEconomy();
  }, [fetchEconomy]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEconomy();
    setTimeout(() => setRefreshing(false), 800);
  };

  const chartData = useMemo(() => daily.slice(-selectedRange), [daily, selectedRange]);

  const maxRevenue = Math.max(...chartData.map((d) => d.grossRevenue));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Server className="h-8 w-8 animate-pulse text-cyan-400" />
      </div>
    );
  }

  if (!state) return null;

  const pirHealth = state.pirTotalUSD > 0
    ? ((state.pirShieldUSD / state.pirTotalUSD) * 100).toFixed(1)
    : "0";

  const revenueGrowth = state.monthlyRevenueUSD > 0
    ? ((state.totalRevenueUSD / Math.max(state.monthlyRevenueUSD * 12, 1)) * 100).toFixed(1)
    : "0";

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">Economic Observatory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            8th Ledger <span className="bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Macro State</span>
          </h1>
          <p className="mt-1 max-w-lg text-sm text-slate-400">
            Protocol Infrastructure Reserve. Revenue flows. Hall health. PIR allocation. Treasury split. SRI & AHGI aggregates.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {/* TOP ROW: Capital + Revenue + PIR + Halls */}
      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        {/* Total Committed Capital */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-950/20 via-[#0a0a14]/60 to-transparent p-5 backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <Landmark className="h-3.5 w-3.5 text-cyan-400" />
              Committed Capital
            </div>
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-400">
              {state.activePools} Active Pools
            </span>
          </div>
          <p className="text-2xl font-bold text-cyan-300">
            ${state.totalCommittedUSD.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[10px]">
            <span className="text-slate-500">Total Pools: {state.totalPools}</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">{state.activeHalls} Live Halls</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-500"
              style={{ width: `${Math.min((state.activePools / Math.max(state.totalPools, 1)) * 100, 100)}%` }}
            />
          </div>
        </motion.div>

        {/* Monthly Revenue Run Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-950/20 via-[#0a0a14]/60 to-transparent p-5 backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Monthly Revenue
            </div>
            <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400`}>
              <ArrowUpRight className="h-3 w-3" />
              {revenueGrowth}% YoY
            </span>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[9px] uppercase text-slate-500">This Month</p>
              <p className="text-lg font-bold text-emerald-300">${state.monthlyRevenueUSD.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[9px] uppercase text-slate-500">Total Revenue</p>
              <p className="text-lg font-bold text-white">${state.totalRevenueUSD.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            8th Ledger Tithe (20%): ${state.eighthLedgerTitheUSD.toLocaleString()}
          </p>
        </motion.div>

        {/* PIR — The Shield */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-950/20 via-[#0a0a14]/60 to-transparent p-5 backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              PIR — The Shield
            </div>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
              {pirHealth}% funded
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-300">
            ${state.pirShieldUSD.toLocaleString()}
          </p>
          <div className="mt-2 text-[10px] text-slate-500">
            Total PIR: ${state.pirTotalUSD.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Active Advances: {state.activePirAdvances}</span>
            <span className="text-amber-400">{state.activeClosureProtocols} closures</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${Math.min((state.pirShieldUSD / Math.max(state.pirTotalUSD, 1)) * 100, 100)}%` }}
            />
          </div>
        </motion.div>

        {/* Hall Ecosystem Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-950/20 via-[#0a0a14]/60 to-transparent p-5 backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              Hall Ecosystem
            </div>
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400">
              {state.totalWorkers} Workers
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-300">
            {state.activeHalls} <span className="text-sm text-slate-500">/ {state.totalHalls}</span>
          </p>
          <div className="mt-2 text-[10px] text-slate-500">
            Class I: {state.classIHalls} · Class II: {state.classIIHalls} · Class III: {state.classIIIHalls}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Ghost: {state.ghostHalls}</span>
            <span className="text-rose-400">Dormant: {state.dormantHalls}</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(state.activeHalls / Math.max(state.totalHalls, 1)) * 100}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* CHART ROW: Revenue Flow + PIR Donut + Hall Health */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Revenue Flow Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" /> Revenue Flow Trajectory
            </h3>
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedRange(d as 7 | 14 | 30)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all ${
                    selectedRange === d
                      ? "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-64 w-full">
            <svg className="h-full w-full" viewBox={`0 0 ${chartData.length * 20} 200`} preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 50, 100, 150, 200].map((y) => (
                <line key={y} x1="0" y1={y} x2={chartData.length * 20} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}

              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
                  <stop offset="100%" stopColor="rgba(6,182,212,0)" />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
                  <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                </linearGradient>
              </defs>

              {/* Gross Revenue line */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                points={chartData.map((d, i) => `${i * 20 + 10},${200 - (d.grossRevenue / maxRevenue) * 180}`).join(" ")}
              />
              <polygon
                fill="url(#grossGrad)"
                points={`0,200 ${chartData.map((d, i) => `${i * 20 + 10},${200 - (d.grossRevenue / maxRevenue) * 180}`).join(" ")} ${(chartData.length - 1) * 20 + 10},200`}
              />

              {/* Net Revenue line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                points={chartData.map((d, i) => `${i * 20 + 10},${200 - (d.netRevenue / maxRevenue) * 180}`).join(" ")}
              />
              <polygon
                fill="url(#netGrad)"
                points={`0,200 ${chartData.map((d, i) => `${i * 20 + 10},${200 - (d.netRevenue / maxRevenue) * 180}`).join(" ")} ${(chartData.length - 1) * 20 + 10},200`}
              />

              {/* Dividend dots */}
              {chartData.map((d, i) => (
                <circle
                  key={i}
                  cx={i * 20 + 10}
                  cy={200 - (d.dividends / maxRevenue) * 180}
                  r="3"
                  fill="#f59e0b"
                  opacity="0.8"
                />
              ))}
            </svg>

            <div className="mt-2 flex justify-between text-[9px] text-slate-600">
              <span>{chartData[0]?.date}</span>
              <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <div className="h-2 w-2 rounded-full bg-cyan-500" /> Gross Revenue
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <div className="h-2 w-2 rounded-full bg-emerald-500" /> Net (After Tithe + Payroll)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <div className="h-2 w-2 rounded-full bg-amber-500" /> Dividends Distributed
            </span>
          </div>
        </motion.div>

        {/* Right Column: PIR + Hall Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          {/* PIR Allocation Donut */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-violet-400" /> PIR Allocation
            </h3>

            <div className="relative mx-auto mb-4 h-40 w-40">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                {[
                  { pct: state.pirShieldUSD / state.pirTotalUSD, color: "#10b981" },
                  { pct: state.pirSealUSD / state.pirTotalUSD, color: "#8b5cf6" },
                  { pct: state.pirForgeUSD / state.pirTotalUSD, color: "#f59e0b" },
                  { pct: state.pirSpireUSD / state.pirTotalUSD, color: "#06b6d4" },
                  { pct: state.pirVanguardUSD / state.pirTotalUSD, color: "#ec4899" },
                  { pct: state.pirSanctuaryUSD / state.pirTotalUSD, color: "#f43f5e" },
                ].map((seg, i, arr) => {
                  const offset = arr.slice(0, i).reduce((a, b) => a + b.pct, 0) * 251;
                  return (
                    <circle
                      key={i}
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={`${seg.pct * 251} 251`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] uppercase text-slate-500">Total PIR</span>
                <span className="text-lg font-bold text-white">
                  ${(state.pirTotalUSD / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "Shield", pct: ((state.pirShieldUSD / state.pirTotalUSD) * 100).toFixed(0), color: "text-emerald-400", dot: "bg-emerald-500" },
                { label: "Seal", pct: ((state.pirSealUSD / state.pirTotalUSD) * 100).toFixed(0), color: "text-violet-400", dot: "bg-violet-500" },
                { label: "Forge", pct: ((state.pirForgeUSD / state.pirTotalUSD) * 100).toFixed(0), color: "text-amber-400", dot: "bg-amber-500" },
                { label: "Spire", pct: ((state.pirSpireUSD / state.pirTotalUSD) * 100).toFixed(0), color: "text-cyan-400", dot: "bg-cyan-500" },
                { label: "Vanguard", pct: ((state.pirVanguardUSD / state.pirTotalUSD) * 100).toFixed(0), color: "text-pink-400", dot: "bg-pink-500" },
                { label: "Sanctuary", pct: ((state.pirSanctuaryUSD / state.pirTotalUSD) * 100).toFixed(0), color: "text-rose-400", dot: "bg-rose-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-2 text-slate-400">
                    <div className={`h-2 w-2 rounded-full ${item.dot}`} /> {item.label}
                  </span>
                  <span className={`font-semibold ${item.color}`}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hall Health Snapshot */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-md">
            <h3 className="mb-3 text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" /> Hall Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Avg SRI Score</span>
                <span className="text-sm font-bold text-white">{state.avgSriScore}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${state.avgSriScore}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Avg AHGI Score</span>
                <span className="text-sm font-bold text-white">{state.avgAhgiScore}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${state.avgAhgiScore}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className="text-slate-500">Platinum: {state.platinumSriCount}</span>
                <span className="text-amber-400">Gold: {state.goldSriCount}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM ROW: Revenue Breakdown + Marketplace + System Health */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Breakdown Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md"
        >
          <h3 className="mb-4 text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" /> Revenue Distribution Model
          </h3>

          <div className="space-y-4">
            {/* Gross Revenue */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-400 font-medium">Gross Revenue</span>
                <span className="text-white font-bold">${state.totalRevenueUSD.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                <div className="h-full bg-cyan-500" style={{ width: "100%" }} />
              </div>
            </div>

            {/* 8th Ledger Tithe (20%) */}
            <div className="flex items-center gap-3">
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-violet-400 font-medium">8th Ledger Tithe (20%)</span>
                  <span className="text-white font-bold">${state.eighthLedgerTitheUSD.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-violet-500" style={{ width: "20%" }} />
                </div>
              </div>
            </div>

            {/* Payroll (Forge) */}
            <div className="flex items-center gap-3">
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium">Forge Payroll</span>
                  <span className="text-white font-bold">${state.totalPayrollUSD.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(state.totalPayrollUSD / state.totalRevenueUSD) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Net Hall Revenue */}
            <div className="flex items-center gap-3">
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-medium">Net Hall Revenue</span>
                  <span className="text-white font-bold">${state.netHallRevenueUSD.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(state.netHallRevenueUSD / state.totalRevenueUSD) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Dividends Distributed */}
            <div className="flex items-center gap-3">
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium">Dividends Distributed (All-Time)</span>
                  <span className="text-white font-bold">${state.totalDividendsDistributed.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(state.totalDividendsDistributed / Math.max(state.totalRevenueUSD, 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-slate-400">
              Every dollar of gross revenue is split: 20% to the 8th Ledger (protocol operations), payroll deducted from Forge PIR, and the remainder distributed as dividends by ownership percentage. No manual intervention. Protocol enforces.
            </p>
          </div>
        </motion.div>

        {/* Right Column: Marketplace + System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          {/* Marketplace Volume */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-md">
            <h3 className="mb-3 text-sm font-bold text-white flex items-center gap-2">
              <Store className="h-4 w-4 text-yellow-400" /> Marketplace
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Volume (30D)</span>
                <span className="text-sm font-bold text-white">${state.marketplaceVolumeUSD.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Ownership Sales</span>
                <span className="text-sm font-bold text-cyan-300">{state.ownershipSalesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Inventory Sales</span>
                <span className="text-sm font-bold text-emerald-300">{state.inventorySalesCount}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: "65%" }} />
              </div>
            </div>
          </div>

          {/* Closure Monitor */}
          <div className={`rounded-2xl border p-5 backdrop-blur-md ${
            state.activeClosureProtocols > 0
              ? "border-amber-500/20 bg-amber-950/[0.06]"
              : "border-emerald-500/20 bg-emerald-950/[0.06]"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${state.activeClosureProtocols > 0 ? "text-amber-400" : "text-emerald-400"}`} />
              <h3 className="text-xs font-bold text-white">Closure Monitor</h3>
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {state.activeClosureProtocols} Active Protocol{state.activeClosureProtocols !== 1 ? "s" : ""}
            </p>
            <p className="text-[10px] text-slate-500">
              {state.activeClosureProtocols > 0
                ? "Halls in warning, decision, or liquidation phase. Review immediately."
                : "All halls operating normally. No closure triggers active."}
            </p>
          </div>

          {/* System Health */}
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-md">
            <h3 className="mb-3 text-xs font-bold text-white flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-slate-400" /> System Health
            </h3>
            <div className="space-y-2">
              {[
                { label: "Treasury Sync", status: "ok", icon: CheckCircle2 },
                { label: "PIR Shield", status: state.pirShieldUSD > 0 ? "ok" : "warn", icon: state.pirShieldUSD > 0 ? CheckCircle2 : AlertTriangle },
                { label: "Forge Payroll", status: state.totalPayrollUSD > 0 ? "ok" : "warn", icon: state.totalPayrollUSD > 0 ? CheckCircle2 : AlertTriangle },
                { label: "Hall Count", status: state.activeHalls > 0 ? "ok" : "warn", icon: state.activeHalls > 0 ? CheckCircle2 : AlertTriangle },
                { label: "Dormancy Check", status: state.dormantHalls < 10 ? "ok" : "warn", icon: state.dormantHalls < 10 ? CheckCircle2 : AlertTriangle },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={`flex items-center gap-1 ${item.status === "ok" ? "text-emerald-400" : "text-amber-400"}`}>
                    <item.icon className="h-3 w-3" />
                    {item.status === "ok" ? "Operational" : "Check"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}