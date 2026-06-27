"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, Zap, HeartPulse,
  TrendingUp, Hexagon, Plane,
  Users, Clock, Sprout, Wifi, Car,
  ShoppingBag, Cpu, GraduationCap,
  Swords, Sparkles, Activity, BarChart3, Globe,
  ChevronRight, Filter, X, Search, Layers,
  Diamond, Shield, Flame, ArrowUpRight, Minus
} from "lucide-react";

/* ============================================================
   VERTICAL CONFIG — 11 Ledger Asset Classes + Background Images
   ============================================================ */
const VERTICALS = [
  {
    id: "ledgerprop",
    name: "LedgerProp",
    emoji: "🏠",
    class: "I",
    accent: "amber" as const,
    description: "Real estate — apartments, offices, warehouses, hotels. Long-term lease revenue.",
    icon: Landmark,
    stats: { pools: 12, value: 2400000, yield: "8.4%" },
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  },
  {
    id: "ledgerauto",
    name: "LedgerAuto",
    emoji: "🚗",
    class: "I",
    accent: "red" as const,
    description: "Vehicle fleets — ride-hail, delivery, luxury rentals, buses. Lease to operators.",
    icon: Car,
    stats: { pools: 8, value: 890000, yield: "11.2%" },
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
  },
  {
    id: "ledgerenergy",
    name: "LedgerEnergy",
    emoji: "⚡",
    class: "I",
    accent: "gold" as const,
    description: "Power assets — solar, wind, battery, EV charging. Power Purchase Agreements.",
    icon: Zap,
    stats: { pools: 15, value: 3100000, yield: "9.1%" },
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  },
  {
    id: "ledgeraccess",
    name: "LedgerAccess",
    emoji: "📡",
    class: "I",
    accent: "violet" as const,
    description: "Infrastructure — towers, fiber, data centers, WiFi. Lease to operators.",
    icon: Wifi,
    stats: { pools: 6, value: 1800000, yield: "7.8%" },
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  },
  {
    id: "ledgerhealth",
    name: "LedgerHealth",
    emoji: "🏥",
    class: "II",
    accent: "emerald" as const,
    description: "Medical — clinics, imaging, dialysis, dental. License to institutions.",
    icon: HeartPulse,
    stats: { pools: 9, value: 1500000, yield: "10.5%" },
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
  },
  {
    id: "ledgeredu",
    name: "LedgerEdu",
    emoji: "🎓",
    class: "II",
    accent: "indigo" as const,
    description: "Education — bootcamps, vocational, K-12, research labs. License to institutions.",
    icon: GraduationCap,
    stats: { pools: 7, value: 980000, yield: "6.9%" },
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
  },
  {
    id: "ledgertravel",
    name: "LedgerTravel",
    emoji: "✈️",
    class: "II",
    accent: "sky" as const,
    description: "Travel — jets, yachts, hotels, safari lodges. Charter and lease.",
    icon: Plane,
    stats: { pools: 5, value: 4200000, yield: "14.3%" },
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
  },
  {
    id: "ledgerbiz",
    name: "LedgerBiz",
    emoji: "🏪",
    class: "III",
    accent: "orange" as const,
    description: "Business — supermarkets, restaurants, coworking, logistics. Direct operation.",
    icon: ShoppingBag,
    stats: { pools: 11, value: 760000, yield: "15.7%" },
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  },
  {
    id: "ledgeragri",
    name: "LedgerAgri",
    emoji: "🌾",
    class: "III",
    accent: "cyan" as const,
    description: "Agriculture — farms, greenhouses, livestock, dairy. Grow, harvest, sell.",
    icon: Sprout,
    stats: { pools: 14, value: 540000, yield: "12.1%" },
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  },
  {
    id: "ledgertech",
    name: "LedgerTech",
    emoji: "💻",
    class: "III",
    accent: "purple" as const,
    description: "Technology — electronics, servers, drones, 3D printing. Fast turnover.",
    icon: Cpu,
    stats: { pools: 18, value: 320000, yield: "18.4%" },
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  },
  {
    id: "ledgersport",
    name: "LedgerSport",
    emoji: "⚽",
    class: "III",
    accent: "rose" as const,
    description: "Sport — stadiums, arenas, gyms, esports venues. Event revenue and direct operation.",
    icon: Swords,
    stats: { pools: 4, value: 6800000, yield: "22.1%" },
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80",
  },
];

/* ============================================================
   TYPES
   ============================================================ */
type PoolStatus = "filling" | "consensus" | "distributed" | "closed";

type Pool = {
  id: string;
  poolId: string;
  verticalId: string;
  name: string;
  assetValue: number;
  committed: number;
  target: number;
  participants: number;
  maxParticipants: number;
  closesAt: string;
  status: PoolStatus;
  myCommitment?: number;
  imageUrl?: string;
  description: string;
  country?: string;
  trueCost?: number;
  listedPrice?: number;
  surplus?: number;
};

/* ============================================================
   UTILS
   ============================================================ */
const formatCurrency = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 1500 }: { value: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStarted(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}{value >= 1000 ? formatMoney(display) : display.toFixed(0)}{suffix}
    </span>
  );
};

const StatusBadge = ({ status }: { status: PoolStatus }) => {
  const map: Record<string, { bg: string; text: string; border: string; label: string; pulse?: boolean }> = {
    filling: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Filling", pulse: true },
    consensus: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30", label: "Consensus", pulse: true },
    distributed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Live", pulse: false },
    closed: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", label: "Closed", pulse: false },
  };
  const s = map[status] || map.filling;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
      {s.pulse && <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${s.text} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${s.text}`} />
      </span>}
      {s.label}
    </span>
  );
};

const ClassBadge = ({ hallClass }: { hallClass: string }) => {
  const colors: Record<string, string> = {
    I: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    II: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    III: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${colors[hallClass] || colors.I}`}>
      Class {hallClass}
    </span>
  );
};

/* ============================================================
   GLASS CARD
   ============================================================ */
const GlassCard = ({ children, className = "", hover = true, glow = false }: { children: React.ReactNode; className?: string; hover?: boolean; glow?: boolean }) => {
  return (
    <div className={`relative group overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl transition-all duration-500 ${hover ? "hover:border-slate-700/80 hover:bg-slate-800/40" : ""} ${glow ? "shadow-[0_0_40px_-12px_rgba(6,182,212,0.15)]" : ""} ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

/* ============================================================
   VERTICAL TILE — COMPACT SIZE (mobile-like on desktop)
   ============================================================ */
function VerticalTile({ v, isSelected, onClick, index }: { v: typeof VERTICALS[number]; isSelected: boolean; onClick: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className={`relative cursor-pointer group ${isSelected ? "z-10" : ""}`}
    >
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-500 h-full ${
        isSelected 
          ? "border-cyan-500/40 shadow-[0_0_30px_-8px_rgba(6,182,212,0.2)]" 
          : "border-slate-800/40 hover:border-slate-700/60"
      }`}>

        {/* Full Background Image */}
        <div className="absolute inset-0">
          <img 
            src={v.image} 
            alt={v.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Dark overlay — darker at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          {/* Selected overlay */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isSelected ? "bg-cyan-500/10" : "bg-transparent group-hover:bg-white/[0.02]"
          }`} />
        </div>

        {/* Content overlaid on image — COMPACT PADDING */}
        <div className="relative p-4 flex flex-col h-full min-h-[200px]">
          {/* Top: Emoji icon */}
          <div className="mb-auto">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-300 ${
              isSelected 
                ? "bg-black/50 border-white/20" 
                : "bg-black/40 border-white/10 group-hover:bg-black/50 group-hover:border-white/20"
            }`}>
              <span className="text-lg">{v.emoji}</span>
            </div>
          </div>

          {/* Middle: Name + Class + Description */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className={`text-base font-bold text-white transition-colors duration-300 ${isSelected ? "text-cyan-300" : ""}`}>
                {v.name}
              </h3>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                v.class === "I" ? "bg-blue-500/20 border-blue-400/30 text-blue-300" :
                v.class === "II" ? "bg-indigo-500/20 border-indigo-400/30 text-indigo-300" :
                "bg-purple-500/20 border-purple-400/30 text-purple-300"
              }`}>
                Class {v.class}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-white/50 line-clamp-2">
              {v.description}
            </p>
          </div>

          {/* Bottom: Stats — COMPACT */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">
                  <span className={`font-bold text-white/80 ${isSelected ? "text-cyan-300" : ""}`}>{v.stats.pools}</span> pools
                </span>
                <span className="text-xs text-white/30">|</span>
                <span className="text-xs text-white/50">
                  <span className={`font-bold text-white/80 ${isSelected ? "text-amber-300" : ""}`}>{v.stats.yield}</span> yield
                </span>
              </div>
              <span className={`text-xs font-mono font-bold text-white/60 ${isSelected ? "text-cyan-300" : ""}`}>
                {formatCurrency(v.stats.value)}
              </span>
            </div>
          </div>
        </div>

        {/* Selected indicator ring */}
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-2xl ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-[#050508] pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   POOL CARD — NEXT GEN
   ============================================================ */
function PoolCard({ pool, vertical }: { pool: Pool; vertical: typeof VERTICALS[number] }) {
  const fillPct = pool.target > 0 ? Math.min((pool.committed / pool.target) * 100, 100) : 0;
  const timeLeft = new Date(pool.closesAt).getTime() - Date.now();
  const isExpired = timeLeft <= 0;
  const daysLeft = Math.max(0, Math.ceil(timeLeft / 86400000));
  const Icon = vertical.icon;

  const accentColor = {
    amber: "from-amber-500 to-orange-500",
    red: "from-rose-500 to-red-500",
    gold: "from-yellow-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    emerald: "from-emerald-500 to-teal-500",
    indigo: "from-indigo-500 to-blue-500",
    sky: "from-sky-500 to-cyan-500",
    orange: "from-orange-500 to-red-500",
    cyan: "from-cyan-500 to-blue-500",
    purple: "from-purple-500 to-fuchsia-500",
    rose: "from-rose-500 to-pink-500",
  }[vertical.accent] || "from-cyan-500 to-blue-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <GlassCard hover glow={pool.status === "filling"} className="h-full flex flex-col">
        {/* Image / Hero */}
        <div className="relative h-48 md:h-52 w-full overflow-hidden rounded-xl border border-slate-800/50 mb-4">
          {pool.imageUrl ? (
            <img src={pool.imageUrl} alt={pool.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
              <Icon className="h-14 w-14 text-slate-700/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/40 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950/80 border border-slate-800/60 px-2.5 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-xl">
              <span className="text-sm">{vertical.emoji}</span>
              {vertical.name}
            </div>
            <ClassBadge hallClass={vertical.class} />
          </div>
          <div className="absolute top-3 right-3">
            <StatusBadge status={pool.status} />
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{pool.name}</h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {pool.country || "Global"}
              </span>
              {pool.status === "filling" && !isExpired && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="h-3 w-3" />
                  {daysLeft}d left
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-slate-500 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {pool.participants} / {pool.maxParticipants} participants
            </span>
            <span className="font-mono font-bold text-cyan-400">{Math.round(fillPct)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={`h-full rounded-full bg-gradient-to-r ${accentColor} relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-slate-950/50 border border-slate-800/50 p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Asset Value</p>
            <p className="text-sm font-bold text-white font-mono">{formatCurrency(pool.assetValue)}</p>
          </div>
          <div className="rounded-xl bg-slate-950/50 border border-slate-800/50 p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Committed</p>
            <p className="text-sm font-bold text-cyan-300 font-mono">{formatCurrency(pool.committed)}</p>
          </div>
          <div className="rounded-xl bg-slate-950/50 border border-slate-800/50 p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Target</p>
            <p className="text-sm font-bold text-cyan-400 font-mono">{formatCurrency(pool.target)}</p>
          </div>
        </div>

        {/* Surplus info */}
        {(pool.trueCost && pool.listedPrice) && (
          <div className="mb-4 rounded-xl bg-slate-950/30 border border-slate-800/40 p-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">True Cost</span>
              <span className="font-mono text-slate-300">{formatCurrency(pool.trueCost)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1">
              <span className="text-slate-500">Listed Price</span>
              <span className="font-mono text-cyan-400">{formatCurrency(pool.listedPrice)}</span>
            </div>
            {pool.surplus && (
              <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-800/30">
                <span className="text-slate-500">PIR Reserve</span>
                <span className="font-mono text-amber-400">{formatCurrency(pool.surplus)}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <a
          href={`/pool/${pool.poolId}`}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 border border-cyan-500/20 py-3 text-xs font-bold uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all group/btn"
        >
          View Pool
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </a>
      </GlassCard>
    </motion.div>
  );
}

/* ============================================================
   HERO SECTION
   ============================================================ */
function HeroSection({ activePoolCount, totalValue }: { activePoolCount: number; totalValue: number }) {
  return (
    <section className="relative mb-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-[#0a0a14] backdrop-blur-xl p-6 md:p-10">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Sovereign Registry</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5">
                <Diamond className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">11 Classes</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                The 11 Ledger
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
                Verticals
              </span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              300 asset types across 11 sovereign classes. Class I is passive. Class II is managed. 
              Class III is active. All protected by the Protocol Infrastructure Reserve.
            </p>
          </div>

          <div className="flex items-end gap-3">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-xl p-4 min-w-[140px]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl" />
              <p className="text-[10px] text-cyan-400/70 uppercase tracking-wider mb-1">Active Pools</p>
              <p className="text-2xl font-bold text-cyan-300 font-mono">
                <AnimatedCounter value={activePoolCount} />
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>+12% this month</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-950/20 backdrop-blur-xl p-4 min-w-[140px]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
              <p className="text-[10px] text-amber-400/70 uppercase tracking-wider mb-1">Total Value</p>
              <p className="text-2xl font-bold text-amber-300 font-mono">
                <AnimatedCounter value={totalValue} prefix="$" />
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                <BarChart3 className="h-3 w-3" />
                <span>Across all classes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FILTER BAR
   ============================================================ */
function FilterBar({ selectedVertical, onSelect, searchQuery, onSearch, showFilters, onToggleFilters }: {
  selectedVertical: string | null;
  onSelect: (id: string | null) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 mb-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-[#0a0a14]/90 backdrop-blur-2xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search pools, assets, countries..."
              className="w-full rounded-xl border border-slate-800/60 bg-slate-950/50 py-2.5 pl-11 pr-10 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="h-3.5 w-3.5 text-slate-500" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              showFilters
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                : "border-slate-800/60 bg-slate-950/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {selectedVertical && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
          </button>
        </div>

        {/* Vertical pills */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-800/40">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter by Vertical</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onSelect(null)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                      !selectedVertical
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                        : "border-slate-800/60 bg-slate-950/50 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    All Verticals
                  </button>
                  {VERTICALS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onSelect(v.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                        selectedVertical === v.id
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                          : "border-slate-800/60 bg-slate-950/50 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span className="text-sm">{v.emoji}</span>
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-24"
    >
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Hexagon className="h-10 w-10 text-slate-700" />
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Minus className="h-3 w-3 text-slate-500" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-300 mb-2">
        {hasFilters ? "No pools match your filters" : "No Active Pools"}
      </h3>
      <p className="text-sm text-slate-500 max-w-md text-center">
        {hasFilters
          ? "Try adjusting your search or filters to find available pools."
          : "Pools will appear here once they are forged through the Meridian Cycle."}
      </p>
    </motion.div>
  );
}

/* ============================================================
   FOOTER BANNER
   ============================================================ */
function FooterBanner() {
  return (
    <div className="mt-10 relative overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-[#0a0a14] backdrop-blur-xl p-6 md:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">The 8th Ledger Model</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Every asset is protected. Every owner is sovereign.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            True Acquisition Cost plus the Protocol Infrastructure Reserve creates a fully protected asset. 
            Owners receive Perpetual Asset Contracts (PACs), govern through democratic halls, 
            and earn monthly dividends forever.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-white font-mono mb-1">100%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Asset Protected</div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-700" />
          <div className="text-center">
            <div className="text-xl font-bold text-amber-300 font-mono mb-1">PIR</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Infrastructure Reserve</div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-700" />
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-300 font-mono mb-1">PAC</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Perpetual Ownership</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function VerticalsPage() {
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPools() {
      try {
        const res = await fetch("/api/pools?status=all");
        const data = await res.json();
        if (data.success && data.pools) {
          setPools(data.pools.map((p: unknown) => ({
            ...p,
            target: p.target || p.accessThreshold || 0,
            id: p.poolId || p.id,
          })));
        }
      } catch (err) {
        console.error("[VERTICALS]", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPools();
  }, []);

  const filteredPools = useMemo(() => {
    let result = [...pools];

    if (selectedVertical) {
      result = result.filter((p) => p.verticalId === selectedVertical);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.country || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [selectedVertical, pools, searchQuery]);

  const activePoolCount = pools.filter((p) => p.status === "filling").length;
  const totalValue = pools.reduce((s, p) => s + p.assetValue, 0);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[30%] bg-indigo-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Hero */}
        <HeroSection activePoolCount={activePoolCount} totalValue={totalValue} />

        {/* Verticals Grid — MORE COLUMNS ON DESKTOP = SMALLER CARDS */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">11 Sovereign Classes</span>
            </div>
            <button
              onClick={() => setSelectedVertical(null)}
              className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${selectedVertical ? "text-cyan-400 hover:text-cyan-300" : "text-slate-600"}`}
            >
              {selectedVertical ? "Clear filter →" : ""}
            </button>
          </div>

          {/* 
            Mobile: 1 col (default)
            sm: 2 cols 
            md: 3 cols
            lg: 4 cols  ← desktop cards are now smaller, more like mobile
            xl: 4 cols
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {VERTICALS.map((v, i) => (
              <VerticalTile
                key={v.id}
                v={v}
                isSelected={selectedVertical === v.id}
                onClick={() => setSelectedVertical(selectedVertical === v.id ? null : v.id)}
                index={i}
              />
            ))}
          </div>
        </section>

        {/* Filter Bar */}
        <FilterBar
          selectedVertical={selectedVertical}
          onSelect={setSelectedVertical}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">
              {selectedVertical
                ? VERTICALS.find((v) => v.id === selectedVertical)?.name
                : "All Pools"}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-800 text-[10px] font-mono text-slate-400">
              {filteredPools.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Activity className="h-3 w-3" />
            <span>Live data</span>
          </div>
        </div>

        {/* Pools Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 animate-pulse">
                <div className="h-48 rounded-xl bg-slate-800/60 mb-4" />
                <div className="h-4 bg-slate-800/60 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-800/60 rounded w-1/2 mb-4" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="h-12 bg-slate-800/60 rounded-xl" />
                  <div className="h-12 bg-slate-800/60 rounded-xl" />
                  <div className="h-12 bg-slate-800/60 rounded-xl" />
                </div>
                <div className="h-10 bg-slate-800/60 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredPools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  vertical={VERTICALS.find((v) => v.id === pool.verticalId) || VERTICALS[0]}
                />
              ))}
            </AnimatePresence>
            {filteredPools.length === 0 && (
              <EmptyState hasFilters={!!selectedVertical || !!searchQuery} />
            )}
          </div>
        )}

        {/* Footer Banner */}
        <FooterBanner />
      </div>

      {/* Custom shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}