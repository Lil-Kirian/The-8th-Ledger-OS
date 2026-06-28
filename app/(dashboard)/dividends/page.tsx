"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─
// TYPES — 8TH LEDGER BLUEPRINT
// ─
interface HallDividend {
  id: string;
  name: string;
  vertical: string;
  emoji: string;
  continent: string;
  ownershipPercent: number;
  monthlyDividend: number;
  accumulatedDividends: number;
  sriScore: number;
  sriTier: "platinum" | "gold" | "silver" | "bronze" | "at-risk";
  ahgiScore: number;
  ahgiTrend: "up" | "flat" | "down";
  grossRevenue: number;
  ledgerTithe: number;
  ihcpRepayment: number;
  payrollForge: number;
  cogs: number;
  netHallRevenue: number;
  lastPayout: string;
  status: "live" | "mature" | "ghost" | "closure-warning" | "closure-final";
  dynamicValuePerPercent: number;
  pirDebtPerPercent: number;
  ihcpDebtPerPercent: number;
}

interface WaterfallStep {
  label: string;
  amount: number;
  percent: number;
  type: "inflow" | "tithe" | "ihcp" | "payroll" | "cogs" | "net" | "dividend";
  icon: string;
}

// ─
// MOCK DATA — GLOBAL NEUTRAL, 11 VERTICALS
// ─
const HALLS: HallDividend[] = [
  {
    id: "h-2847",
    name: "Solar Array Alpha — Kajiado",
    vertical: "LedgerEnergy",
    emoji: "⚡",
    continent: "Africa",
    ownershipPercent: 8.5,
    monthlyDividend: 2840.00,
    accumulatedDividends: 18460.00,
    sriScore: 87,
    sriTier: "gold",
    ahgiScore: 72,
    ahgiTrend: "up",
    grossRevenue: 18000,
    ledgerTithe: 3600,
    ihcpRepayment: 0,
    payrollForge: 3150,
    cogs: 0,
    netHallRevenue: 11250,
    lastPayout: "2026-06-22",
    status: "live",
    dynamicValuePerPercent: 2930,
    pirDebtPerPercent: 0,
    ihcpDebtPerPercent: 0,
  },
  {
    id: "h-2901",
    name: "Metro Fleet — North Atlantic Corridor",
    vertical: "LedgerAuto",
    emoji: "🚗",
    continent: "Americas",
    ownershipPercent: 12.3,
    monthlyDividend: 4100.50,
    accumulatedDividends: 28730.00,
    sriScore: 92,
    sriTier: "platinum",
    ahgiScore: 81,
    ahgiTrend: "up",
    grossRevenue: 25000,
    ledgerTithe: 5000,
    ihcpRepayment: 1250,
    payrollForge: 4200,
    cogs: 0,
    netHallRevenue: 14550,
    lastPayout: "2026-06-22",
    status: "live",
    dynamicValuePerPercent: 4120,
    pirDebtPerPercent: 0,
    ihcpDebtPerPercent: 45,
  },
  {
    id: "h-3012",
    name: "Quantum Campus — East Asian Highlands",
    vertical: "LedgerEdu",
    emoji: "🎓",
    continent: "Asia",
    ownershipPercent: 5.0,
    monthlyDividend: 1560.00,
    accumulatedDividends: 7800.00,
    sriScore: 74,
    sriTier: "silver",
    ahgiScore: 68,
    ahgiTrend: "flat",
    grossRevenue: 12000,
    ledgerTithe: 2400,
    ihcpRepayment: 0,
    payrollForge: 1800,
    cogs: 0,
    netHallRevenue: 7800,
    lastPayout: "2026-06-21",
    status: "live",
    dynamicValuePerPercent: 2150,
    pirDebtPerPercent: 0,
    ihcpDebtPerPercent: 0,
  },
  {
    id: "h-3156",
    name: "Cocoa Collective — West African Belt",
    vertical: "LedgerAgri",
    emoji: "🌾",
    continent: "Africa",
    ownershipPercent: 15.0,
    monthlyDividend: 5200.00,
    accumulatedDividends: 41600.00,
    sriScore: 64,
    sriTier: "silver",
    ahgiScore: 58,
    ahgiTrend: "down",
    grossRevenue: 35000,
    ledgerTithe: 7000,
    ihcpRepayment: 2800,
    payrollForge: 8500,
    cogs: 4200,
    netHallRevenue: 12500,
    lastPayout: "2026-06-20",
    status: "live",
    dynamicValuePerPercent: 3850,
    pirDebtPerPercent: 120,
    ihcpDebtPerPercent: 180,
  },
  {
    id: "h-3204",
    name: "Aero Fraction — Nordic Charter",
    vertical: "LedgerTravel",
    emoji: "✈️",
    continent: "Europe",
    ownershipPercent: 3.2,
    monthlyDividend: 980.00,
    accumulatedDividends: 5880.00,
    sriScore: 88,
    sriTier: "gold",
    ahgiScore: 76,
    ahgiTrend: "up",
    grossRevenue: 8000,
    ledgerTithe: 1600,
    ihcpRepayment: 0,
    payrollForge: 1200,
    cogs: 0,
    netHallRevenue: 5200,
    lastPayout: "2026-06-22",
    status: "mature",
    dynamicValuePerPercent: 5600,
    pirDebtPerPercent: 0,
    ihcpDebtPerPercent: 0,
  },
  {
    id: "h-3381",
    name: "SportLedger — Gulf Academy FC",
    vertical: "SportLedger",
    emoji: "🏆",
    continent: "Middle East",
    ownershipPercent: 6.7,
    monthlyDividend: 2100.00,
    accumulatedDividends: 12600.00,
    sriScore: 71,
    sriTier: "silver",
    ahgiScore: 63,
    ahgiTrend: "flat",
    grossRevenue: 16000,
    ledgerTithe: 3200,
    ihcpRepayment: 0,
    payrollForge: 4800,
    cogs: 2200,
    netHallRevenue: 5800,
    lastPayout: "2026-06-19",
    status: "live",
    dynamicValuePerPercent: 3100,
    pirDebtPerPercent: 0,
    ihcpDebtPerPercent: 0,
  },
  {
    id: "h-3409",
    name: "Diagnostics Node — Pacific Rim",
    vertical: "LedgerHealth",
    emoji: "🏥",
    continent: "Oceania",
    ownershipPercent: 4.1,
    monthlyDividend: 720.00,
    accumulatedDividends: 3600.00,
    sriScore: 45,
    sriTier: "bronze",
    ahgiScore: 42,
    ahgiTrend: "down",
    grossRevenue: 6000,
    ledgerTithe: 1200,
    ihcpRepayment: 800,
    payrollForge: 2400,
    cogs: 0,
    netHallRevenue: 1600,
    lastPayout: "2026-06-15",
    status: "closure-warning",
    dynamicValuePerPercent: 1800,
    pirDebtPerPercent: 0,
    ihcpDebtPerPercent: 95,
  },
];

const MONTHLY_TREND = [12400, 13200, 12800, 14500, 15100, 14800, 16200, 15800, 17500, 18200, 17800, 19240];

// ─
// UTILITIES
// ─
const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const formatPercent = (n: number) => `${n.toFixed(1)}%`;

const AnimatedCounter = ({ value, prefix = "", suffix = "", decimals = 2 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) => {
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
      const progress = Math.min((now - startTime) / 1800, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value]);

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}{display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

// ─
// FUTURISTIC UI COMPONENTS
// ─

const HologramCard = ({ children, className = "", accent = "cyan", glow = false }: { children: React.ReactNode; className?: string; accent?: "cyan" | "amber" | "violet" | "emerald" | "rose" | "slate"; glow?: boolean }) => {
  const accentMap = {
    cyan: "from-cyan-500/10 via-blue-500/5 to-transparent border-cyan-500/20 shadow-[0_0_40px_-12px_rgba(6,182,212,0.25)]",
    amber: "from-amber-500/10 via-yellow-500/5 to-transparent border-amber-500/20 shadow-[0_0_40px_-12px_rgba(245,158,11,0.25)]",
    violet: "from-violet-500/10 via-fuchsia-500/5 to-transparent border-violet-500/20 shadow-[0_0_40px_-12px_rgba(139,92,246,0.25)]",
    emerald: "from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20 shadow-[0_0_40px_-12px_rgba(16,185,129,0.25)]",
    rose: "from-rose-500/10 via-red-500/5 to-transparent border-rose-500/20 shadow-[0_0_40px_-12px_rgba(244,63,94,0.25)]",
    slate: "from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20 shadow-[0_0_40px_-12px_rgba(100,116,139,0.15)]",
  };
  return (
    <div className={`relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-500 hover:scale-[1.005] ${accentMap[accent]} ${glow ? "animate-pulse-slow" : ""} ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    live: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400", label: "LIVE" },
    mature: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-400", label: "MATURE" },
    ghost: { cls: "bg-slate-500/10 text-slate-400 border-slate-500/30", dot: "bg-slate-400", label: "GHOST" },
    "closure-warning": { cls: "bg-rose-500/10 text-rose-400 border-rose-500/30", dot: "bg-rose-400 animate-pulse", label: "CRITICAL" },
    "closure-final": { cls: "bg-red-500/10 text-red-400 border-red-500/30", dot: "bg-red-400 animate-pulse", label: "LIQUIDATING" },
  };
  const s = map[status] || map.ghost;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${s.cls}`}>
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
    <div className="flex items-center gap-2">
      <span className="text-xs">{t.icon}</span>
      <div className="flex flex-col">
        <span className={`text-[10px] font-bold bg-gradient-to-r ${t.color} bg-clip-text text-transparent uppercase tracking-wider`}>{t.label}</span>
        <span className="text-[10px] font-mono text-slate-500">SRI {score}</span>
      </div>
    </div>
  );
};

const AHGIBar = ({ score, trend }: { score: number; trend: string }) => {
  const color = score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-cyan-400" : score >= 40 ? "bg-amber-400" : "bg-rose-400";
  const trendIcon = trend === "up" ? "↗" : trend === "down" ? "↘" : "→";
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400";
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} shadow-[0_0_8px_currentColor]`} style={{ width: `${score}%`, transition: "width 1.5s ease-out" }} />
      </div>
      <span className="text-[10px] font-mono text-slate-500 w-6">{score}</span>
      <span className={`text-xs ${trendColor}`}>{trendIcon}</span>
    </div>
  );
};

const WaterfallBar = ({ steps, hallId }: { steps: WaterfallStep[]; hallId: string }) => {
  const max = Math.max(...steps.map(s => s.amount));
  return (
    <div className="flex items-end gap-1 h-24 mt-4">
      {steps.map((step, i) => {
        const h = (step.amount / max) * 100;
        const colors: Record<string, string> = {
          inflow: "bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.4)]",
          tithe: "bg-amber-400/70",
          ihcp: "bg-violet-400/70",
          payroll: "bg-cyan-400/70",
          cogs: "bg-slate-400/50",
          net: "bg-blue-400/80 shadow-[0_0_12px_rgba(96,165,250,0.4)]",
          dividend: "bg-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.4)]",
        };
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end justify-center h-20">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                className={`w-full max-w-[40px] rounded-t-md ${colors[step.type]} transition-all group-hover:brightness-125`}
              />
              <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap z-20 pointer-events-none">
                {step.label}: {formatMoney(step.amount)}
              </div>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider text-center leading-tight">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const MiniSparkline = ({ data, color = "#22d3ee" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`sp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill={`url(#sp-${color.replace("#", "")})`} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={`0,${h} ${points} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

// ─
// MAIN PAGE
// ─
export default function DividendsPage() {
  const router = useRouter();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [selectedHalls, setSelectedHalls] = useState<Set<string>>(new Set(HALLS.map(h => h.id)));
  const [expandedHall, setExpandedHall] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = useMemo(() => HALLS.filter(h => selectedHalls.has(h.id)), [selectedHalls]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((s, h) => s + h.grossRevenue, 0);
    const tithe = filtered.reduce((s, h) => s + h.ledgerTithe, 0);
    const ihcp = filtered.reduce((s, h) => s + h.ihcpRepayment, 0);
    const payroll = filtered.reduce((s, h) => s + h.payrollForge, 0);
    const cogs = filtered.reduce((s, h) => s + h.cogs, 0);
    const net = filtered.reduce((s, h) => s + h.netHallRevenue, 0);
    const div = filtered.reduce((s, h) => s + h.monthlyDividend, 0);
    const accum = filtered.reduce((s, h) => s + h.accumulatedDividends, 0);
    const dynValue = filtered.reduce((s, h) => s + (h.dynamicValuePerPercent * h.ownershipPercent), 0);
    return { gross, tithe, ihcp, payroll, cogs, net, div, accum, dynValue };
  }, [filtered]);

  const toggleHall = (id: string) => {
    const next = new Set(selectedHalls);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedHalls(next);
  };

  const getWaterfallSteps = (h: HallDividend): WaterfallStep[] => [
    { label: "Gross", amount: h.grossRevenue, percent: 100, type: "inflow", icon: "↓" },
    { label: "Tithe", amount: h.ledgerTithe, percent: (h.ledgerTithe / h.grossRevenue) * 100, type: "tithe", icon: "→" },
    { label: "IHCP", amount: h.ihcpRepayment, percent: (h.ihcpRepayment / h.grossRevenue) * 100, type: "ihcp", icon: "→" },
    { label: "Forge", amount: h.payrollForge, percent: (h.payrollForge / h.grossRevenue) * 100, type: "payroll", icon: "→" },
    { label: "COGS", amount: h.cogs, percent: (h.cogs / h.grossRevenue) * 100, type: "cogs", icon: "→" },
    { label: "Net", amount: h.netHallRevenue, percent: (h.netHallRevenue / h.grossRevenue) * 100, type: "net", icon: "→" },
    { label: "Your Cut", amount: h.monthlyDividend, percent: (h.monthlyDividend / h.grossRevenue) * 100, type: "dividend", icon: "★" },
  ];

  const handleDownload = (type: "csv" | "pdf") => {
    if (type === "csv") {
      const rows = [
        ["8TH LEDGER — DIVIDEND STATEMENT", "", "", "", "", "", "", "", "", "", ""],
        [`Generated: ${new Date().toISOString()}`, "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", ""],
        ["Hall ID", "Hall Name", "Vertical", "Continent", "Ownership %", "Gross Revenue", "8th Ledger Tithe", "IHCP Repay", "Forge/Payroll", "COGS", "Net Hall Rev", "Your Dividend", "Accumulated", "Dynamic Val/1%", "SRI Score", "AHGI Score", "Status"],
        ...filtered.map(h => [
          h.id, h.name, h.vertical, h.continent, h.ownershipPercent + "%",
          h.grossRevenue, h.ledgerTithe, h.ihcpRepayment, h.payrollForge, h.cogs,
          h.netHallRevenue, h.monthlyDividend, h.accumulatedDividends,
          h.dynamicValuePerPercent, h.sriScore, h.ahgiScore, h.status
        ]),
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["TOTALS", "", "", "", formatPercent(filtered.reduce((s, h) => s + h.ownershipPercent, 0)), totals.gross, totals.tithe, totals.ihcp, totals.payroll, totals.cogs, totals.net, totals.div, totals.accum, "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Revenue Flow Formula:", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Gross Revenue → 8th Ledger Tithe (20%) → IHCP Repayment (priority) → Payroll/Forge → COGS → Net Hall Revenue → Split by Ownership % → Dividend", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ];
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `8TH_LEDGER_Dividend_Statement_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert("PDF generation requires server-side rendering. CSV downloaded instead.");
    }
    setDownloadOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#030308] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      {/*  AMBIENT BACKGROUND  */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/[0.03] rounded-full blur-[150px] animate-pulse-slow" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-500/[0.03] rounded-full blur-[150px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-violet-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.04),_transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        {/*  HEADER  */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.3em]">
                Sovereign Revenue Stream Active
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              DIVIDEND<span className="text-cyan-400">.</span>COMMAND
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-light">
              Global income aggregation across all sovereign Halls. Revenue
              flows through the Protocol Infrastructure Reserve, then splits by
              ownership percentage. Immutable. Transparent. Yours forever.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDownloadOpen(true)}
              className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600/80 to-blue-600/80 border border-cyan-500/30 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 backdrop-blur-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Ledger
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>
          </div>
        </header>

        {/*  TOP STATS ROW  */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <HologramCard accent="emerald" className="lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em]">
                Net Monthly
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                {filtered.length} Halls
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={totals.div} prefix="$" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              After all protocol deductions
            </div>
            <div className="mt-3 h-8 opacity-40">
              <MiniSparkline data={MONTHLY_TREND.slice(-6)} color="#34d399" />
            </div>
          </HologramCard>

          <HologramCard accent="amber">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.2em]">
                Gross Inflow
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                Pre-Tithe
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={totals.gross} prefix="$" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Total hall revenue this cycle
            </div>
            <div className="mt-3 flex gap-1">
              {[0.2, 0.35, 0.5, 0.7, 1].map((op, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full bg-amber-500/20 overflow-hidden"
                >
                  <div
                    className="h-full bg-amber-400/60 rounded-full"
                    style={{ width: `${op * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </HologramCard>

          <HologramCard accent="cyan">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em]">
                8th Ledger Tithe
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                20% Fixed
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={totals.tithe} prefix="$" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Protocol infrastructure reserve
            </div>
            <div className="mt-3 w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                style={{ width: "20%" }}
              />
            </div>
          </HologramCard>

          <HologramCard accent="violet">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-violet-400 uppercase tracking-[0.2em]">
                Accumulated
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-mono">
                Lifetime
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={totals.accum} prefix="$" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Feeds Dynamic PAC Valuation
            </div>
            <div className="mt-3 h-8 opacity-40">
              <MiniSparkline
                data={[
                  5000, 8200, 11400, 15600, 19800, 24500, 28900, 34200, 39800,
                  45200, 51200, 56700,
                ]}
                color="#a78bfa"
              />
            </div>
          </HologramCard>

          <HologramCard accent="slate">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                Book Value
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-300 border border-slate-500/20 font-mono">
                Dynamic
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={totals.dynValue} prefix="$" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Current PAC valuation floor
            </div>
            <div className="mt-3 flex items-center gap-1">
              <span className="text-[10px] text-emerald-400 font-mono">
                +8.4%
              </span>
              <span className="text-[10px] text-slate-600 font-mono">
                vs last quarter
              </span>
            </div>
          </HologramCard>
        </div>

        {/*  REVENUE WATERFALL + CHART  */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          <HologramCard className="lg:col-span-2" accent="cyan">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Revenue Velocity
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
                  12-month dividend trend across all verticals
                </p>
              </div>
              <div className="flex gap-1">
                {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                  <button
                    key={range}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono border transition-all ${range === "1Y" ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]" : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-56 w-full relative">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 900 260"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 65}
                    x2="900"
                    y2={i * 65}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                  />
                ))}
                <path
                  d={`M0,260 ${MONTHLY_TREND.map((v, i) => {
                    const x = (i / (MONTHLY_TREND.length - 1)) * 900;
                    const y = 260 - ((v - 12000) / 8000) * 260;
                    return `L${x},${y}`;
                  }).join(" ")} L900,260 Z`}
                  fill="url(#areaGrad)"
                />
                <path
                  d={`M0,${260 - ((MONTHLY_TREND[0] - 12000) / 8000) * 260} ${MONTHLY_TREND.map(
                    (v, i) => {
                      const x = (i / (MONTHLY_TREND.length - 1)) * 900;
                      const y = 260 - ((v - 12000) / 8000) * 260;
                      return `L${x},${y}`;
                    },
                  ).join(" ")}`}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                {MONTHLY_TREND.map((v, i) => {
                  const x = (i / (MONTHLY_TREND.length - 1)) * 900;
                  const y = 260 - ((v - 12000) / 8000) * 260;
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#030308"
                        stroke="#22d3ee"
                        strokeWidth="2"
                      />
                      {i === MONTHLY_TREND.length - 1 && (
                        <>
                          <circle
                            cx={x}
                            cy={y}
                            r="10"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="1"
                            opacity="0.3"
                          >
                            <animate
                              attributeName="r"
                              values="10;16;10"
                              dur="2.5s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.3;0;0.3"
                              dur="2.5s"
                              repeatCount="indefinite"
                            />
                          </circle>
                          <text
                            x={x}
                            y={y - 16}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            ${(v / 1000).toFixed(1)}k
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-2 px-2 uppercase tracking-wider">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </HologramCard>

          <HologramCard accent="violet" className="flex flex-col">
            <h3 className="text-lg font-bold text-white tracking-tight mb-1">
              Protocol Flow
            </h3>
            <p className="text-[10px] text-slate-400 mb-6 font-mono uppercase tracking-wider">
              Revenue distribution architecture
            </p>
            <div className="flex-1 space-y-3">
              {[
                {
                  label: "Gross Revenue",
                  amount: totals.gross,
                  color: "from-emerald-500 to-teal-500",
                  pct: 100,
                },
                {
                  label: "8th Ledger Tithe (20%)",
                  amount: totals.tithe,
                  color: "from-amber-500 to-yellow-500",
                  pct: (totals.tithe / totals.gross) * 100,
                },
                {
                  label: "IHCP Repayment",
                  amount: totals.ihcp,
                  color: "from-violet-500 to-purple-500",
                  pct: (totals.ihcp / totals.gross) * 100,
                },
                {
                  label: "Forge / Payroll",
                  amount: totals.payroll,
                  color: "from-cyan-500 to-blue-500",
                  pct: (totals.payroll / totals.gross) * 100,
                },
                {
                  label: "COGS (Inventory)",
                  amount: totals.cogs,
                  color: "from-slate-500 to-slate-400",
                  pct: (totals.cogs / totals.gross) * 100,
                },
                {
                  label: "Net Hall Revenue",
                  amount: totals.net,
                  color: "from-blue-500 to-indigo-500",
                  pct: (totals.net / totals.gross) * 100,
                },
                {
                  label: "Your Dividend",
                  amount: totals.div,
                  color: "from-fuchsia-500 to-pink-500",
                  pct: (totals.div / totals.gross) * 100,
                },
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-slate-300 flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color} shadow-[0_0_6px_currentColor]`}
                      />
                      {item.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-200">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{
                        duration: 1.2,
                        delay: i * 0.1,
                        ease: "easeOut",
                      }}
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">
                  Effective Yield
                </span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {((totals.div / totals.gross) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                Of gross revenue distributed to you
              </div>
            </div>
          </HologramCard>
        </div>

        {/*  HALL BREAKDOWN TABLE  */}
        <HologramCard accent="cyan" className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Sovereign Hall Registry
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
                Per-asset dividend allocation, SRI health, and dynamic valuation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono">
                {selectedHalls.size} of {HALLS.length} selected
              </span>
              <button
                onClick={() =>
                  setSelectedHalls(new Set(HALLS.map((h) => h.id)))
                }
                className="text-[10px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors font-mono"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedHalls(new Set())}
                className="text-[10px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-mono"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="pb-3 pl-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedHalls.size === HALLS.length}
                      onChange={() =>
                        selectedHalls.size === HALLS.length
                          ? setSelectedHalls(new Set())
                          : setSelectedHalls(new Set(HALLS.map((h) => h.id)))
                      }
                      className="rounded border-slate-600 bg-slate-800/50 text-cyan-500 focus:ring-cyan-500/20"
                    />
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Hall
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Vertical
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-center">
                    SRI / AHGI
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-right">
                    Ownership
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-right">
                    Monthly
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-right">
                    Accumulated
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-right">
                    Dynamic Val
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="pb-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-right">
                    Waterfall
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {HALLS.map((hall) => {
                  const isExpanded = expandedHall === hall.id;
                  return (
                    <React.Fragment key={hall.id}>
                      <tr
                        onMouseEnter={() => setHoveredRow(hall.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() =>
                          setExpandedHall(isExpanded ? null : hall.id)
                        }
                        className={`group transition-all duration-300 cursor-pointer ${hoveredRow === hall.id ? "bg-slate-800/20" : ""} ${isExpanded ? "bg-slate-800/30" : ""}`}
                      >
                        <td className="py-4 pl-2">
                          <input
                            type="checkbox"
                            checked={selectedHalls.has(hall.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleHall(hall.id);
                            }}
                            className="rounded border-slate-600 bg-slate-800/50 text-cyan-500 focus:ring-cyan-500/20"
                          />
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{hall.emoji}</span>
                            <div>
                              <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                {hall.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                                {hall.id} · {hall.continent}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-[10px] px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700 font-mono">
                            {hall.vertical}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-2 items-center">
                            <SRIBadge
                              tier={hall.sriTier}
                              score={hall.sriScore}
                            />
                            <AHGIBar
                              score={hall.ahgiScore}
                              trend={hall.ahgiTrend}
                            />
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="text-sm font-mono text-white">
                            {hall.ownershipPercent}%
                          </div>
                          <div className="w-16 h-1 bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                              style={{ width: `${hall.ownershipPercent * 4}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="text-sm font-mono text-emerald-400">
                            {formatMoney(hall.monthlyDividend)}
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            of {formatMoney(hall.netHallRevenue)} net
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="text-sm font-mono text-violet-300">
                            {formatMoney(hall.accumulatedDividends)}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="text-sm font-mono text-amber-300">
                            {formatMoney(hall.dynamicValuePerPercent)}
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            per 1%
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <StatusBadge status={hall.status} />
                        </td>
                        <td className="py-4 text-right pr-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`text-slate-500 transition-transform duration-300 inline-block ${isExpanded ? "rotate-180 text-cyan-400" : ""}`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <td colSpan={10} className="p-0">
                              <div className="bg-slate-900/40 border-y border-slate-800/50 px-6 py-5">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                      <span className="w-1 h-4 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                      Revenue Waterfall
                                    </h4>
                                    <WaterfallBar
                                      steps={getWaterfallSteps(hall)}
                                      hallId={hall.id}
                                    />
                                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                                      <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/30">
                                        <div className="text-slate-500 mb-1">
                                          PIR Debt / 1%
                                        </div>
                                        <div className="text-white">
                                          {formatMoney(hall.pirDebtPerPercent)}
                                        </div>
                                      </div>
                                      <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/30">
                                        <div className="text-slate-500 mb-1">
                                          IHCP Debt / 1%
                                        </div>
                                        <div className="text-white">
                                          {formatMoney(hall.ihcpDebtPerPercent)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                      <span className="w-1 h-4 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                      Dynamic Valuation Formula
                                    </h4>
                                    <div className="space-y-2 text-[11px] font-mono">
                                      {[
                                        {
                                          label: "Asset Book Value / 100",
                                          val:
                                            hall.dynamicValuePerPercent * 0.6,
                                          color: "text-cyan-400",
                                        },
                                        {
                                          label: "Accumulated Dividends / 1%",
                                          val:
                                            hall.accumulatedDividends /
                                            hall.ownershipPercent,
                                          color: "text-violet-400",
                                        },
                                        {
                                          label: "AHGI Growth Premium",
                                          val: (hall.ahgiScore - 50) * 10,
                                          color: "text-emerald-400",
                                        },
                                        {
                                          label: "SRI Tier Bonus",
                                          val:
                                            hall.sriTier === "platinum"
                                              ? 50
                                              : hall.sriTier === "gold"
                                                ? 30
                                                : hall.sriTier === "silver"
                                                  ? 10
                                                  : hall.sriTier === "bronze"
                                                    ? 0
                                                    : -20,
                                          color: "text-amber-400",
                                        },
                                        {
                                          label: "PIR Debt / 1%",
                                          val: -hall.pirDebtPerPercent,
                                          color: "text-rose-400",
                                        },
                                        {
                                          label: "IHCP Debt / 1%",
                                          val: -hall.ihcpDebtPerPercent,
                                          color: "text-rose-400",
                                        },
                                      ].map((item, i) => (
                                        <div
                                          key={i}
                                          className="flex justify-between items-center py-1 border-b border-slate-800/30"
                                        >
                                          <span className="text-slate-400">
                                            {item.label}
                                          </span>
                                          <span className={item.color}>
                                            {item.val >= 0 ? "+" : ""}
                                            {formatMoney(item.val)}
                                          </span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between items-center pt-2">
                                        <span className="text-white font-bold">
                                          FLOOR VALUE PER 1%
                                        </span>
                                        <span className="text-cyan-400 font-bold text-sm">
                                          {formatMoney(
                                            hall.dynamicValuePerPercent,
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-white font-bold">
                                          YOUR TOTAL VALUE (
                                          {hall.ownershipPercent}%)
                                        </span>
                                        <span className="text-fuchsia-400 font-bold text-sm">
                                          {formatMoney(
                                            hall.dynamicValuePerPercent *
                                              hall.ownershipPercent,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700/50 bg-slate-800/10">
                  <td className="py-4 pl-2" />
                  <td className="py-4 text-sm font-bold text-white">
                    AGGREGATE
                  </td>
                  <td className="py-4" />
                  <td className="py-4" />
                  <td className="py-4 text-right text-sm font-mono text-cyan-400">
                    {HALLS.reduce((s, h) => s + h.ownershipPercent, 0).toFixed(
                      1,
                    )}
                    %
                  </td>
                  <td className="py-4 text-right text-sm font-mono text-emerald-400 font-bold">
                    {formatMoney(totals.div)}
                  </td>
                  <td className="py-4 text-right text-sm font-mono text-violet-300 font-bold">
                    {formatMoney(totals.accum)}
                  </td>
                  <td className="py-4 text-right text-sm font-mono text-amber-300 font-bold">
                    {formatMoney(totals.dynValue)}
                  </td>
                  <td className="py-4" />
                  <td className="py-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </HologramCard>

        {/*  BOTTOM ROW: YIELD SIM + ACTIVITY  */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HologramCard accent="amber" className="lg:col-span-1">
            <h3 className="text-lg font-bold text-white tracking-tight mb-1">
              Yield Simulator
            </h3>
            <p className="text-[10px] text-slate-400 mb-6 font-mono uppercase tracking-wider">
              Projected returns at varying commitment scales
            </p>
            <div className="space-y-4">
              {[
                {
                  label: "Conservative (5% yield)",
                  mult: 0.6,
                  color: "from-slate-500 to-slate-400",
                  glow: "shadow-slate-500/20",
                },
                {
                  label: "Expected (8% yield)",
                  mult: 1.0,
                  color: "from-amber-500 to-yellow-500",
                  glow: "shadow-amber-500/20",
                },
                {
                  label: "Optimistic (12% yield)",
                  mult: 1.4,
                  color: "from-emerald-500 to-teal-500",
                  glow: "shadow-emerald-500/20",
                },
              ].map((scenario) => (
                <div
                  key={scenario.label}
                  className={`flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-600 transition-all ${scenario.glow}`}
                >
                  <div>
                    <div className="text-xs text-slate-300 mb-1">
                      {scenario.label}
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {formatMoney(totals.div * 12 * scenario.mult)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Annual projection
                    </div>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${scenario.color} opacity-30 flex items-center justify-center`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-gradient-to-br ${scenario.color} opacity-60`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </HologramCard>

          <HologramCard accent="cyan" className="lg:col-span-2">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4">
              Recent Payout Activity
            </h3>
            <div className="space-y-2">
              {[
                {
                  hall: "Solar Array Alpha — Kajiado",
                  amount: 2840,
                  time: "2 hours ago",
                  type: "dividend",
                  emoji: "⚡",
                },
                {
                  hall: "Metro Fleet — North Atlantic",
                  amount: 4100.5,
                  time: "5 hours ago",
                  type: "dividend",
                  emoji: "🚗",
                },
                {
                  hall: "Cocoa Collective — West African Belt",
                  amount: 5200,
                  time: "8 hours ago",
                  type: "dividend",
                  emoji: "🌾",
                },
                {
                  hall: "SportLedger — Gulf Academy FC",
                  amount: 2100,
                  time: "1 day ago",
                  type: "dividend",
                  emoji: "🏆",
                },
                {
                  hall: "8th Ledger Protocol Tithe",
                  amount: 13640,
                  time: "1 day ago",
                  type: "tithe",
                  emoji: "🏛",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-slate-800/50 hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.emoji}</span>
                    <div
                      className={`w-2 h-2 rounded-full ${item.type === "tithe" ? "bg-amber-400" : "bg-emerald-400"} shadow-[0_0_8px_currentColor]`}
                    />
                    <div>
                      <div className="text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {item.hall}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.time}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-mono font-semibold ${item.type === "tithe" ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {item.type === "tithe" ? "-" : "+"}
                    {formatMoney(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </HologramCard>
        </div>
      </div>

      {/*  DOWNLOAD MODAL  */}
      <AnimatePresence>
        {downloadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={() => setDownloadOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#08080f] border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-cyan-900/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />

              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                Export Ledger
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Download your dividend records for audit, tax, and valuation
                purposes.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleDownload("csv")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/20 hover:bg-slate-800/50 hover:border-cyan-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        CSV Spreadsheet
                      </div>
                      <div className="text-xs text-slate-500">
                        Raw data for Excel / Sheets
                      </div>
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-500 group-hover:text-cyan-400"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDownload("pdf")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/20 hover:bg-slate-800/50 hover:border-amber-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9 13h6" />
                        <path d="M9 17h6" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                        PDF Certificate
                      </div>
                      <div className="text-xs text-slate-500">
                        Formal statement with 8th Ledger seal
                      </div>
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-500 group-hover:text-amber-400"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setDownloadOpen(false)}
                className="mt-6 w-full py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-mono"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  CSS ANIMATIONS  */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}