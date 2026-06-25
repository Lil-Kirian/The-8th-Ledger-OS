"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ───────────────────────────────────────────
// TYPES — 8TH LEDGER VAULT SYSTEM
// ───────────────────────────────────────────
interface VaultAsset {
  id: string;
  hallName: string;
  vertical: string;
  emoji: string;
  continent: string;
  pacToken: string;
  ownershipPercent: number;
  monthlyIncome: number;
  annualYield: number;
  value: number;
  dynamicValuePerPercent: number;
  accumulatedDividends: number;
  acquiredAt: string;
  status: "active" | "maturing" | "dormant" | "closure-warning";
  sriScore: number;
  sriTier: "platinum" | "gold" | "silver" | "bronze" | "at-risk";
  ahgiScore: number;
  ahgiTrend: "up" | "flat" | "down";
  pirDebt: number;
  ihcpDebt: number;
  lastPayout: string;
  monthlyHistory: number[];
}

interface VaultStats {
  totalValue: number;
  totalMonthly: number;
  totalAnnual: number;
  avgYield: number;
  totalAssets: number;
  sriWeighted: number;
  ahgiWeighted: number;
  diversificationScore: number;
  riskExposure: number;
}

// ───────────────────────────────────────────
// MOCK DATA — 11 VERTICALS, GLOBAL NEUTRAL
// ───────────────────────────────────────────
const ASSETS: VaultAsset[] = [
  {
    id: "v-2847", hallName: "Solar Array Alpha", vertical: "LedgerEnergy", emoji: "⚡", continent: "Africa",
    pacToken: "PAC-8X2P-9LQ3-2847", ownershipPercent: 8.5, monthlyIncome: 2840.00, annualYield: 11.2,
    value: 185000, dynamicValuePerPercent: 2930, accumulatedDividends: 18460,
    acquiredAt: "2025-09-14", status: "active", sriScore: 87, sriTier: "gold", ahgiScore: 72, ahgiTrend: "up",
    pirDebt: 0, ihcpDebt: 0, lastPayout: "2026-06-22",
    monthlyHistory: [2100, 2250, 2180, 2400, 2550, 2480, 2600, 2700, 2750, 2800, 2780, 2840],
  },
  {
    id: "v-2901", hallName: "Metro Fleet Corridor", vertical: "LedgerAuto", emoji: "🚗", continent: "Americas",
    pacToken: "PAC-3F7K-2M9P-2901", ownershipPercent: 12.3, monthlyIncome: 4100.50, annualYield: 13.5,
    value: 312000, dynamicValuePerPercent: 4120, accumulatedDividends: 28730,
    acquiredAt: "2025-07-22", status: "active", sriScore: 92, sriTier: "platinum", ahgiScore: 81, ahgiTrend: "up",
    pirDebt: 0, ihcpDebt: 450, lastPayout: "2026-06-22",
    monthlyHistory: [3200, 3350, 3400, 3600, 3700, 3650, 3800, 3900, 3950, 4000, 4050, 4100],
  },
  {
    id: "v-3012", hallName: "Quantum Campus", vertical: "LedgerEdu", emoji: "🎓", continent: "Asia",
    pacToken: "PAC-9LQ3-8X2P-3012", ownershipPercent: 5.0, monthlyIncome: 1560.00, annualYield: 9.8,
    value: 98000, dynamicValuePerPercent: 2150, accumulatedDividends: 7800,
    acquiredAt: "2026-01-08", status: "active", sriScore: 74, sriTier: "silver", ahgiScore: 68, ahgiTrend: "flat",
    pirDebt: 0, ihcpDebt: 0, lastPayout: "2026-06-21",
    monthlyHistory: [1200, 1250, 1300, 1350, 1400, 1380, 1420, 1450, 1480, 1500, 1520, 1560],
  },
  {
    id: "v-3156", hallName: "Cocoa Collective", vertical: "LedgerAgri", emoji: "🌾", continent: "Africa",
    pacToken: "PAC-2M9P-3F7K-3156", ownershipPercent: 15.0, monthlyIncome: 5200.00, annualYield: 14.1,
    value: 380000, dynamicValuePerPercent: 3850, accumulatedDividends: 41600,
    acquiredAt: "2025-04-30", status: "active", sriScore: 64, sriTier: "silver", ahgiScore: 58, ahgiTrend: "down",
    pirDebt: 1200, ihcpDebt: 1800, lastPayout: "2026-06-20",
    monthlyHistory: [4800, 4900, 5000, 5100, 5050, 5150, 5200, 5250, 5300, 5350, 5280, 5200],
  },
  {
    id: "v-3204", hallName: "Nordic Charter Aero", vertical: "LedgerTravel", emoji: "✈️", continent: "Europe",
    pacToken: "PAC-8X2P-2M9P-3204", ownershipPercent: 3.2, monthlyIncome: 980.00, annualYield: 8.4,
    value: 72000, dynamicValuePerPercent: 5600, accumulatedDividends: 5880,
    acquiredAt: "2025-11-15", status: "maturing", sriScore: 88, sriTier: "gold", ahgiScore: 76, ahgiTrend: "up",
    pirDebt: 0, ihcpDebt: 0, lastPayout: "2026-06-22",
    monthlyHistory: [800, 820, 850, 880, 900, 920, 940, 950, 960, 970, 975, 980],
  },
  {
    id: "v-3381", hallName: "Gulf Academy FC", vertical: "SportLedger", emoji: "🏆", continent: "Middle East",
    pacToken: "PAC-3F7K-9LQ3-3381", ownershipPercent: 6.7, monthlyIncome: 2100.00, annualYield: 10.5,
    value: 145000, dynamicValuePerPercent: 3100, accumulatedDividends: 12600,
    acquiredAt: "2025-10-03", status: "active", sriScore: 71, sriTier: "silver", ahgiScore: 63, ahgiTrend: "flat",
    pirDebt: 0, ihcpDebt: 0, lastPayout: "2026-06-19",
    monthlyHistory: [1600, 1700, 1750, 1800, 1850, 1900, 1950, 2000, 2050, 2080, 2090, 2100],
  },
  {
    id: "v-3409", hallName: "Pacific Diagnostics", vertical: "LedgerHealth", emoji: "🏥", continent: "Oceania",
    pacToken: "PAC-9LQ3-3F7K-3409", ownershipPercent: 4.1, monthlyIncome: 720.00, annualYield: 6.2,
    value: 54000, dynamicValuePerPercent: 1800, accumulatedDividends: 3600,
    acquiredAt: "2026-02-20", status: "closure-warning", sriScore: 45, sriTier: "bronze", ahgiScore: 42, ahgiTrend: "down",
    pirDebt: 0, ihcpDebt: 950, lastPayout: "2026-06-15",
    monthlyHistory: [900, 880, 860, 840, 820, 800, 780, 760, 740, 730, 725, 720],
  },
  {
    id: "v-3501", hallName: "Silicon Forge Node", vertical: "LedgerTech", emoji: "📱", continent: "Asia",
    pacToken: "PAC-2M9P-8X2P-3501", ownershipPercent: 7.8, monthlyIncome: 3450.00, annualYield: 12.8,
    value: 210000, dynamicValuePerPercent: 4200, accumulatedDividends: 18900,
    acquiredAt: "2025-08-11", status: "active", sriScore: 79, sriTier: "gold", ahgiScore: 74, ahgiTrend: "up",
    pirDebt: 0, ihcpDebt: 0, lastPayout: "2026-06-22",
    monthlyHistory: [2800, 2900, 3000, 3100, 3150, 3200, 3250, 3300, 3350, 3400, 3420, 3450],
  },
];

const MONTHLY_AGGREGATE = [12400, 13200, 12800, 14500, 15100, 14800, 16200, 15800, 17500, 18200, 17800, 19240];

// ───────────────────────────────────────────
// UTILITIES
// ───────────────────────────────────────────
const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatMoneyPrecise = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 1800 }: { value: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStarted(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return (
    <span ref={ref} className="tabular-nums tracking-tighter">
      {prefix}{display.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{suffix}
    </span>
  );
};

// ───────────────────────────────────────────
// FUTURISTIC UI COMPONENTS
// ───────────────────────────────────────────

const HologramCard = ({ children, className = "", accent = "cyan", glow = false }: { children: React.ReactNode; className?: string; accent?: "cyan" | "amber" | "violet" | "emerald" | "rose" | "slate"; glow?: boolean }) => {
  const accentMap = {
    cyan: "from-cyan-500/[0.08] via-blue-500/[0.03] to-transparent border-cyan-500/20 shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)]",
    amber: "from-amber-500/[0.08] via-yellow-500/[0.03] to-transparent border-amber-500/20 shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)]",
    violet: "from-violet-500/[0.08] via-fuchsia-500/[0.03] to-transparent border-violet-500/20 shadow-[0_0_60px_-15px_rgba(139,92,246,0.2)]",
    emerald: "from-emerald-500/[0.08] via-teal-500/[0.03] to-transparent border-emerald-500/20 shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)]",
    rose: "from-rose-500/[0.08] via-red-500/[0.03] to-transparent border-rose-500/20 shadow-[0_0_60px_-15px_rgba(244,63,94,0.2)]",
    slate: "from-slate-500/[0.06] via-slate-500/[0.02] to-transparent border-slate-500/15 shadow-[0_0_40px_-15px_rgba(100,116,139,0.1)]",
  };
  return (
    <div className={`relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-2xl transition-all duration-500 hover:scale-[1.005] ${accentMap[accent]} ${glow ? "animate-pulse-slow" : ""} ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    active: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400", label: "ACTIVE" },
    maturing: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-400", label: "MATURING" },
    dormant: { cls: "bg-slate-500/10 text-slate-400 border-slate-500/30", dot: "bg-slate-400", label: "DORMANT" },
    "closure-warning": { cls: "bg-rose-500/10 text-rose-400 border-rose-500/30", dot: "bg-rose-400 animate-pulse", label: "CRITICAL" },
  };
  const s = map[status] || map.dormant;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-[0.15em] ${s.cls}`}>
      <span className={`w-1 h-1 rounded-full ${s.dot} shadow-[0_0_6px_currentColor]`} />
      {s.label}
    </span>
  );
};

const SRIBadge = ({ tier, score }: { tier: string; score: number }) => {
  const map: Record<string, { icon: string; color: string; label: string }> = {
    platinum: { icon: "👑", color: "from-violet-400 to-fuchsia-400", label: "PLATINUM" },
    gold: { icon: "🥇", color: "from-amber-400 to-yellow-400", label: "GOLD" },
    silver: { icon: "🥈", color: "from-slate-300 to-slate-400", label: "SILVER" },
    bronze: { icon: "🥉", color: "from-orange-400 to-amber-600", label: "BRONZE" },
    "at-risk": { icon: "⚠️", color: "from-rose-400 to-red-500", label: "AT RISK" },
  };
  const t = map[tier] || map.silver;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px]">{t.icon}</span>
      <div className="flex flex-col leading-none">
        <span className={`text-[9px] font-bold bg-gradient-to-r ${t.color} bg-clip-text text-transparent uppercase tracking-wider`}>{t.label}</span>
        <span className="text-[9px] font-mono text-slate-500">SRI {score}</span>
      </div>
    </div>
  );
};

const AHGIBar = ({ score, trend }: { score: number; trend: string }) => {
  const color = score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-cyan-400" : score >= 40 ? "bg-amber-400" : "bg-rose-400";
  const trendIcon = trend === "up" ? "↗" : trend === "down" ? "↘" : "→";
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400";
  return (
    <div className="flex items-center gap-1.5 w-20">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} shadow-[0_0_6px_currentColor]`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[9px] font-mono text-slate-500 w-4">{score}</span>
      <span className={`text-[10px] ${trendColor}`}>{trendIcon}</span>
    </div>
  );
};

const MiniSparkline = ({ data, color = "#22d3ee", height = 28 }: { data: number[]; color?: string; height?: number }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`sp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill={`url(#sp-${color.replace("#", "")})`} stroke="none" points={`0,${h} ${points} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const DonutChart = ({ data, size = 140 }: { data: { label: string; value: number; color: string }[]; size?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        {data.map((slice, i) => {
          const slicePercent = slice.value / total;
          const dashArray = slicePercent * circumference;
          const dashOffset = -cumulative * circumference;
          cumulative += slicePercent;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Value</span>
        <span className="text-sm font-bold text-white font-mono">{formatMoney(total)}</span>
      </div>
    </div>
  );
};

const HexBadge = ({ value, label, color = "cyan" }: { value: string; label: string; color?: "cyan" | "amber" | "emerald" | "violet" | "rose" }) => {
  const colors = {
    cyan: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5",
    amber: "border-amber-500/30 text-amber-400 bg-amber-500/5",
    emerald: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
    violet: "border-violet-500/30 text-violet-400 bg-violet-500/5",
    rose: "border-rose-500/30 text-rose-400 bg-rose-500/5",
  };
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${colors[color]} backdrop-blur-sm`}>
      <span className="text-xs font-bold font-mono">{value}</span>
      <span className="text-[8px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
};

// ───────────────────────────────────────────
// MAIN PAGE
// ───────────────────────────────────────────
export default function VaultPage() {
  const [assets, setAssets] = useState<VaultAsset[]>(ASSETS);
  const [filter, setFilter] = useState<"all" | "active" | "maturing" | "dormant" | "closure-warning">("all");
  const [sortBy, setSortBy] = useState<"value" | "yield" | "income" | "ahgi" | "sri">("value");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [reinvestRate, setReinvestRate] = useState(50);
  const [showSimulator, setShowSimulator] = useState(false);

  const stats = useMemo(() => {
    const totalValue = assets.reduce((s, a) => s + a.value, 0);
    const totalMonthly = assets.reduce((s, a) => s + a.monthlyIncome, 0);
    const totalAnnual = totalMonthly * 12;
    const avgYield = assets.length ? assets.reduce((s, a) => s + a.annualYield, 0) / assets.length : 0;
    const sriWeighted = assets.length ? assets.reduce((s, a) => s + a.sriScore * a.value, 0) / totalValue : 0;
    const ahgiWeighted = assets.length ? assets.reduce((s, a) => s + a.ahgiScore * a.value, 0) / totalValue : 0;
    const uniqueVerticals = new Set(assets.map(a => a.vertical)).size;
    const diversificationScore = Math.min((uniqueVerticals / 11) * 100, 100);
    const riskExposure = assets.filter(a => a.status === "closure-warning").reduce((s, a) => s + a.value, 0) / totalValue * 100;
    return { totalValue, totalMonthly, totalAnnual, avgYield, totalAssets: assets.length, sriWeighted, ahgiWeighted, diversificationScore, riskExposure };
  }, [assets]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? assets : assets.filter(a => a.status === filter);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "value": return b.value - a.value;
        case "yield": return b.annualYield - a.annualYield;
        case "income": return b.monthlyIncome - a.monthlyIncome;
        case "ahgi": return b.ahgiScore - a.ahgiScore;
        case "sri": return b.sriScore - a.sriScore;
        default: return 0;
      }
    });
  }, [assets, filter, sortBy]);

  const allocation = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(a => { map[a.vertical] = (map[a.vertical] || 0) + a.value; });
    const colors: Record<string, string> = {
      LedgerProp: "#fbbf24", LedgerAuto: "#22d3ee", LedgerTravel: "#a855f7", LedgerAgri: "#34d399",
      LedgerEnergy: "#f59e0b", LedgerBiz: "#6366f1", LedgerEdu: "#ec4899", LedgerHealth: "#f43f5e",
      LedgerTech: "#14b8a6", LedgerAccess: "#8b5cf6", SportLedger: "#e879f9",
    };
    return Object.entries(map).map(([label, value]) => ({ label, value, color: colors[label] || "#94a3b8" }));
  }, [assets]);

  const continentSpread = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(a => { map[a.continent] = (map[a.continent] || 0) + a.value; });
    return Object.entries(map).map(([name, value]) => ({ name, value, percent: ((value / stats.totalValue) * 100).toFixed(1) }));
  }, [assets, stats.totalValue]);

  const simulatorProjection = useMemo(() => {
    const reinvest = stats.totalMonthly * (reinvestRate / 100);
    const cash = stats.totalMonthly * (1 - reinvestRate / 100);
    const months = 12;
    let projectedValue = stats.totalValue;
    let projectedMonthly = stats.totalMonthly;
    const data: number[] = [];
    for (let i = 0; i < months; i++) {
      projectedValue += reinvest;
      projectedMonthly = projectedValue * (stats.avgYield / 100 / 12);
      data.push(projectedMonthly);
    }
    return { reinvest, cash, projectedValue, projectedMonthly, data };
  }, [stats, reinvestRate]);

  const VERTICAL_LABELS: Record<string, string> = {
    LedgerProp: "Property", LedgerAuto: "Auto", LedgerTravel: "Travel", LedgerAgri: "Agriculture",
    LedgerEnergy: "Energy", LedgerBiz: "Business", LedgerEdu: "Education", LedgerHealth: "Health",
    LedgerTech: "Technology", LedgerAccess: "Access", SportLedger: "Sport",
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      {/* ─── AMBIENT BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-cyan-500/[0.025] rounded-full blur-[180px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-amber-500/[0.025] rounded-full blur-[180px] animate-pulse-slow" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] bg-violet-500/[0.02] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.03),_transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        {/* ─── HEADER ─── */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-amber-400 animate-ping opacity-30" />
              </div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.3em]">Sovereign Asset Vault</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono uppercase tracking-wider">{stats.totalAssets} Assets</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
              VAULT<span className="text-amber-400">.</span>COMMAND
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-light">
              Perpetual Asset Contract registry. Real-time valuation, yield trajectory, and systematic risk analysis across all sovereign Halls.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="group relative px-5 py-3 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300 font-semibold text-sm overflow-hidden transition-all hover:border-cyan-500/40 hover:text-cyan-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md"
            >
              <span className="relative z-10 flex items-center gap-2 font-mono text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
                Yield Simulator
              </span>
            </button>
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600/80 to-yellow-600/80 border border-amber-500/30 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 backdrop-blur-md">
              <span className="relative z-10 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export Ledger
              </span>
            </button>
          </div>
        </header>

        {/* ─── TOP COMMAND STATS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-10">
          <HologramCard accent="amber" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-amber-400 uppercase tracking-[0.2em]">Portfolio Value</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">LIVE</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={stats.totalValue} prefix="$" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{stats.totalAssets} PAC certificates · Dynamic valuation</div>
            </div>
          </HologramCard>

          <HologramCard accent="emerald" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-[0.2em]">Monthly Yield</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">NET</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={stats.totalMonthly} prefix="$" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">After 8th Ledger Tithe (20%)</div>
            </div>
          </HologramCard>

          <HologramCard accent="cyan" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.2em]">Annual Projection</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">APY</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={stats.totalAnnual} prefix="$" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{stats.avgYield.toFixed(1)}% avg yield · 12-mo</div>
            </div>
          </HologramCard>

          <HologramCard accent="violet" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-violet-400 uppercase tracking-[0.2em]">Diversification</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-mono">SCORE</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={stats.diversificationScore} suffix="/100" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{new Set(assets.map(a => a.vertical)).size} of 11 verticals</div>
            </div>
          </HologramCard>
        </div>

        {/* ─── SYSTEM HEALTH ROW ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          <HologramCard accent="emerald" className="flex items-center gap-4 p-4">
            <HexBadge value={stats.sriWeighted.toFixed(0)} label="SRI" color="emerald" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Weighted Sovereign Reputation</span>
                <span className="text-[10px] font-mono text-emerald-400">{stats.sriWeighted.toFixed(1)}</span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.sriWeighted}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="cyan" className="flex items-center gap-4 p-4">
            <HexBadge value={stats.ahgiWeighted.toFixed(0)} label="AHGI" color="cyan" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Weighted Asset Health Growth</span>
                <span className="text-[10px] font-mono text-cyan-400">{stats.ahgiWeighted.toFixed(1)}</span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.ahgiWeighted}%` }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              </div>
            </div>
          </HologramCard>

          <HologramCard accent={stats.riskExposure > 10 ? "rose" : "slate"} className="flex items-center gap-4 p-4">
            <HexBadge value={`${stats.riskExposure.toFixed(1)}%`} label="RISK" color={stats.riskExposure > 10 ? "rose" : "slate"} />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Closure-Exposure Capital</span>
                <span className={`text-[10px] font-mono ${stats.riskExposure > 10 ? "text-rose-400" : "text-slate-400"}`}>{stats.riskExposure.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.riskExposure}%` }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }} className={`h-full rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)] ${stats.riskExposure > 10 ? "bg-gradient-to-r from-rose-500 to-red-400" : "bg-gradient-to-r from-slate-500 to-slate-400"}`} />
              </div>
            </div>
          </HologramCard>
        </div>

        {/* ─── YIELD SIMULATOR (EXPANDABLE) ─── */}
        <AnimatePresence>
          {showSimulator && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden mb-10"
            >
              <HologramCard accent="violet" className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-1/3 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight mb-1">Reinvestment Simulator</h3>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Compound projection over 12 months</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-slate-300">Reinvestment Rate</span>
                        <span className="text-sm font-bold text-violet-400 font-mono">{reinvestRate}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={reinvestRate}
                        onChange={(e) => setReinvestRate(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-violet-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
                        <span>0% (All Cash)</span>
                        <span>50%</span>
                        <span>100% (Full Reinvest)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Monthly Cash</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono">{formatMoneyPrecise(simulatorProjection.cash)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Monthly Reinvest</div>
                        <div className="text-sm font-bold text-violet-400 font-mono">{formatMoneyPrecise(simulatorProjection.reinvest)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-2/3">
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Projected Value (12mo)</div>
                        <div className="text-2xl font-bold text-white font-mono">{formatMoney(simulatorProjection.projectedValue)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Projected Monthly</div>
                        <div className="text-2xl font-bold text-violet-400 font-mono">{formatMoney(simulatorProjection.projectedMonthly)}</div>
                      </div>
                    </div>
                    <div className="h-40 w-full">
                      <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M0,160 ${simulatorProjection.data.map((v, i) => {
                            const x = (i / (simulatorProjection.data.length - 1)) * 600;
                            const minVal = Math.min(...simulatorProjection.data) * 0.9;
                            const maxVal = Math.max(...simulatorProjection.data) * 1.1;
                            const y = 160 - ((v - minVal) / (maxVal - minVal)) * 160;
                            return `L${x},${y}`;
                          }).join(" ")} L600,160 Z`}
                          fill="url(#simGrad)"
                        />
                        <path
                          d={`M0,${160 - ((simulatorProjection.data[0] - Math.min(...simulatorProjection.data) * 0.9) / (Math.max(...simulatorProjection.data) * 1.1 - Math.min(...simulatorProjection.data) * 0.9)) * 160} ${simulatorProjection.data.map((v, i) => {
                            const x = (i / (simulatorProjection.data.length - 1)) * 600;
                            const minVal = Math.min(...simulatorProjection.data) * 0.9;
                            const maxVal = Math.max(...simulatorProjection.data) * 1.1;
                            const y = 160 - ((v - minVal) / (maxVal - minVal)) * 160;
                            return `L${x},${y}`;
                          }).join(" ")}`}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-1 uppercase tracking-wider">
                      {Array.from({ length: 12 }, (_, i) => <span key={i}>M{i + 1}</span>)}
                    </div>
                  </div>
                </div>
              </HologramCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MAIN DASHBOARD: CHART + ALLOCATION + GEO ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10">
          {/* INCOME VELOCITY CHART */}
          <HologramCard className="lg:col-span-7" accent="amber">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Income Velocity</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">12-month aggregate dividend trend</p>
                </div>
                <div className="flex gap-1">
                  {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                    <button key={range} className={`px-3 py-1 rounded-lg text-[10px] font-mono border transition-all ${range === "1Y" ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]" : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"}`}>
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-52 w-full relative">
                <svg width="100%" height="100%" viewBox="0 0 900 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="vaultArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="vaultLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                    <filter id="vaultGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {[0, 1, 2, 3, 4].map(i => <line key={i} x1="0" y1={i * 55} x2="900" y2={i * 55} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
                  <path
                    d={`M0,220 ${MONTHLY_AGGREGATE.map((v, i) => {
                      const x = (i / (MONTHLY_AGGREGATE.length - 1)) * 900;
                      const y = 220 - ((v - 12000) / 8000) * 220;
                      return `L${x},${y}`;
                    }).join(" ")} L900,220 Z`}
                    fill="url(#vaultArea)"
                  />
                  <path
                    d={`M0,${220 - ((MONTHLY_AGGREGATE[0] - 12000) / 8000) * 220} ${MONTHLY_AGGREGATE.map((v, i) => {
                      const x = (i / (MONTHLY_AGGREGATE.length - 1)) * 900;
                      const y = 220 - ((v - 12000) / 8000) * 220;
                      return `L${x},${y}`;
                    }).join(" ")}`}
                    fill="none"
                    stroke="url(#vaultLine)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#vaultGlow)"
                  />
                  {MONTHLY_AGGREGATE.map((v, i) => {
                    const x = (i / (MONTHLY_AGGREGATE.length - 1)) * 900;
                    const y = 220 - ((v - 12000) / 8000) * 220;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" fill="#020205" stroke="#fbbf24" strokeWidth="1.5" />
                        {i === MONTHLY_AGGREGATE.length - 1 && (
                          <>
                            <circle cx={x} cy={y} r="10" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.3">
                              <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
                            </circle>
                            <text x={x} y={y - 14} textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace" fontWeight="bold">${(v / 1000).toFixed(1)}k</text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-2 px-2 uppercase tracking-wider">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
              </div>
            </div>
          </HologramCard>

          {/* ALLOCATION + GEO */}
          <div className="lg:col-span-5 space-y-4">
            <HologramCard accent="violet">
              <div className="p-6">
                <h3 className="text-sm font-bold text-white tracking-tight mb-1">Vertical Allocation</h3>
                <p className="text-[10px] text-slate-400 mb-4 font-mono uppercase tracking-wider">Portfolio by asset class</p>
                <div className="flex items-center gap-6">
                  <DonutChart data={allocation} size={120} />
                  <div className="flex-1 space-y-1.5">
                    {allocation.map((item) => (
                      <div key={item.label} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                          <span className="text-[10px] text-slate-300">{VERTICAL_LABELS[item.label] || item.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition-colors">{((item.value / stats.totalValue) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HologramCard>

            <HologramCard accent="cyan">
              <div className="p-6">
                <h3 className="text-sm font-bold text-white tracking-tight mb-1">Geographic Spread</h3>
                <p className="text-[10px] text-slate-400 mb-4 font-mono uppercase tracking-wider">Capital distribution by continent</p>
                <div className="space-y-2">
                  {continentSpread.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 w-20 font-mono">{c.name}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.percent}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 w-10 text-right">{c.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </HologramCard>
          </div>
        </div>

        {/* ─── FILTER & CONTROL BAR ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mr-2">Filter:</span>
              {[
              { id: "all" as const, label: "All", count: assets.length },
              { id: "active" as const, label: "Active", count: assets.filter(a => a.status === "active").length },
              { id: "maturing" as const, label: "Maturing", count: assets.filter(a => a.status === "maturing").length },
              { id: "dormant" as const, label: "Dormant", count: assets.filter(a => a.status === "dormant").length },
              { id: "closure-warning" as const, label: "Critical", count: assets.filter(a => a.status === "closure-warning").length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border font-mono ${
                  filter === f.id
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                    : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                }`}
              >
                {f.label} <span className="opacity-50 ml-1">{f.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Sort:</span>
            {[
              { id: "value" as const, label: "Value" },
              { id: "yield" as const, label: "Yield" },
              { id: "income" as const, label: "Income" },
              { id: "ahgi" as const, label: "AHGI" },
              { id: "sri" as const, label: "SRI" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border font-mono ${
                  sortBy === s.id
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                    : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                }`}
              >
                {s.label}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg border transition-all ${viewMode === "grid" ? "bg-slate-800 border-slate-600 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg border transition-all ${viewMode === "table" ? "bg-slate-800 border-slate-600 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* ─── ASSET GRID VIEW ─── */}
        <AnimatePresence mode="wait">
          {viewMode === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10"
            >
              {filtered.map((asset) => (
                <HologramCard
                  key={asset.id}
                  accent={asset.status === "active" ? "amber" : asset.status === "maturing" ? "cyan" : asset.status === "closure-warning" ? "rose" : "slate"}
                  className={`cursor-pointer transition-all ${selectedAsset === asset.id ? "ring-1 ring-cyan-500/40" : ""}`}
                >
                  <div className="p-5" onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}>
                    {/* HEADER */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{asset.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-white leading-tight">{asset.hallName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">{asset.pacToken}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">{asset.continent}</span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={asset.status} />
                    </div>

                    {/* METRICS ROW */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Ownership</div>
                        <div className="text-base font-bold text-white font-mono">{asset.ownershipPercent}%</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Monthly</div>
                        <div className="text-base font-bold text-emerald-400 font-mono">{formatMoneyPrecise(asset.monthlyIncome)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Yield</div>
                        <div className="text-base font-bold text-amber-400 font-mono">{asset.annualYield}%</div>
                      </div>
                    </div>

                    {/* HEALTH & CHART */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <SRIBadge tier={asset.sriTier} score={asset.sriScore} />
                          <AHGIBar score={asset.ahgiScore} trend={asset.ahgiTrend} />
                        </div>
                      </div>
                    </div>

                    <div className="h-10 mb-3 opacity-60">
                      <MiniSparkline data={asset.monthlyHistory} color={asset.ahgiTrend === "up" ? "#34d399" : asset.ahgiTrend === "down" ? "#f43f5e" : "#94a3b8"} />
                    </div>

                    {/* FOOTER */}
                    <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono">
                      <span>Val: {formatMoney(asset.value)} · Dyn: {formatMoney(asset.dynamicValuePerPercent)}/1%</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        {asset.lastPayout}
                      </span>
                    </div>
                  </div>

                  {/* EXPANDED DETAIL */}
                  <AnimatePresence>
                    {selectedAsset === asset.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-slate-800/50"
                      >
                        <div className="p-5 bg-slate-900/20">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Accumulated</div>
                              <div className="text-sm font-bold text-violet-300 font-mono">{formatMoney(asset.accumulatedDividends)}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Dynamic Value</div>
                              <div className="text-sm font-bold text-cyan-300 font-mono">{formatMoney(asset.dynamicValuePerPercent * asset.ownershipPercent)}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">PIR Debt</div>
                              <div className={`text-sm font-bold font-mono ${asset.pirDebt > 0 ? "text-rose-400" : "text-slate-400"}`}>{formatMoney(asset.pirDebt)}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                              <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">IHCP Debt</div>
                              <div className={`text-sm font-bold font-mono ${asset.ihcpDebt > 0 ? "text-rose-400" : "text-slate-400"}`}>{formatMoney(asset.ihcpDebt)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors">
                              View Hall
                            </button>
                            <button className="flex-1 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-colors">
                              List PAC
                            </button>
                            <button className="flex-1 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider hover:bg-violet-500/20 transition-colors">
                              Reinvest
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </HologramCard>
              ))}
            </motion.div>
          )}

          {/* ─── TABLE VIEW ─── */}
          {viewMode === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-10"
            >
              <HologramCard accent="slate">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80">
                        <th className="pb-3 pt-4 pl-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider">Asset</th>
                        <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-center">Health</th>
                        <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">Ownership</th>
                        <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">Value</th>
                        <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">Monthly</th>
                        <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">Yield</th>
                        <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">Accum</th>
                        <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-center">Status</th>
                        <th className="pb-3 pt-4 pr-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filtered.map((asset) => (
                        <tr
                          key={asset.id}
                          className="group hover:bg-slate-800/20 transition-colors cursor-pointer"
                          onClick={() => setSelectedAsset(selectedAsset === asset.id ? null : asset.id)}
                        >
                          <td className="py-3 pl-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{asset.emoji}</span>
                              <div>
                                <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">{asset.hallName}</div>
                                <div className="text-[9px] text-slate-500 font-mono">{asset.pacToken}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <SRIBadge tier={asset.sriTier} score={asset.sriScore} />
                              <AHGIBar score={asset.ahgiScore} trend={asset.ahgiTrend} />
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="text-sm font-mono text-white">{asset.ownershipPercent}%</div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="text-sm font-mono text-slate-200">{formatMoney(asset.value)}</div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="text-sm font-mono text-emerald-400">{formatMoneyPrecise(asset.monthlyIncome)}</div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="text-sm font-mono text-amber-400">{asset.annualYield}%</div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="text-sm font-mono text-violet-300">{formatMoney(asset.accumulatedDividends)}</div>
                          </td>
                          <td className="py-3 text-center">
                            <StatusBadge status={asset.status} />
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <div className="w-20 ml-auto h-8 opacity-50">
                              <MiniSparkline data={asset.monthlyHistory} color={asset.ahgiTrend === "up" ? "#34d399" : asset.ahgiTrend === "down" ? "#f43f5e" : "#94a3b8"} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-700/50 bg-slate-800/5">
                        <td className="py-3 pl-4 text-sm font-bold text-white">AGGREGATE</td>
                        <td className="py-3" />
                        <td className="py-3 text-right text-sm font-mono text-cyan-400">{assets.reduce((s, a) => s + a.ownershipPercent, 0).toFixed(1)}%</td>
                        <td className="py-3 text-right text-sm font-mono text-white font-bold">{formatMoney(stats.totalValue)}</td>
                        <td className="py-3 text-right text-sm font-mono text-emerald-400 font-bold">{formatMoneyPrecise(stats.totalMonthly)}</td>
                        <td className="py-3 text-right text-sm font-mono text-amber-400 font-bold">{stats.avgYield.toFixed(1)}%</td>
                        <td className="py-3 text-right text-sm font-mono text-violet-300 font-bold">{formatMoney(assets.reduce((s, a) => s + a.accumulatedDividends, 0))}</td>
                        <td className="py-3" />
                        <td className="py-3 pr-4" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </HologramCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── BOTTOM COMMAND STRIP ─── */}
        <HologramCard accent="amber" className="mb-10">
          <div className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                👑
              </div>
              <div>
                <div className="text-sm text-slate-400 font-mono uppercase tracking-wider">Sovereign Portfolio Command</div>
                <div className="text-2xl font-bold text-white font-mono">
                  <AnimatedCounter value={stats.totalValue} prefix="$" />
                </div>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Monthly</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">{formatMoneyPrecise(stats.totalMonthly)}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Annual</div>
                <div className="text-lg font-bold text-cyan-400 font-mono">{formatMoney(stats.totalAnnual)}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Yield</div>
                <div className="text-lg font-bold text-amber-400 font-mono">{stats.avgYield.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Assets</div>
                <div className="text-lg font-bold text-white font-mono">{stats.totalAssets}</div>
              </div>
            </div>
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold text-sm hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-wider">
              Claim All Dividends
            </button>
          </div>
        </HologramCard>
      </div>

      {/* ─── CSS ANIMATIONS ─── */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}