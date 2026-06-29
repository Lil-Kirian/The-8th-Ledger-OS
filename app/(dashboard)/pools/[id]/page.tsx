"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import type { PoolDetail } from "@/types/pools";
import {
  Landmark,
  Zap,
  Crown,
  Lock,
  HeartPulse,
  TrendingUp,
  Hexagon,
  Plane,
  Sprout,
  Sun,
  ArrowLeft,
  Users,
  Globe,
  Timer,
  Coins,
  CheckCircle2,
  Shield,
  ExternalLink,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  Target,
  Activity,
  Fingerprint,
  Orbit,
  Sparkles,
  Terminal,
  Satellite,
  Flame,
  LockKeyhole,
  Diamond,
  MessageSquare,
  AlertTriangle,
  XCircle,
  CircleCheck,
  Banknote,
  Building2,
} from "lucide-react";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   VERTICALS — ALL 10 LEDGERS
   ============================================================ */
const ALL_VERTICALS = [
  {
    id: "ledgerprop",
    name: "LedgerProp",
    icon: Landmark,
    color: "emerald",
    desc: "Real Estate & Property",
  },
  {
    id: "ledgerauto",
    name: "LedgerAuto",
    icon: Zap,
    color: "cyan",
    desc: "Vehicles & Mobility",
  },
  {
    id: "ledgeredu",
    name: "LedgerEdu",
    icon: Crown,
    color: "violet",
    desc: "Education & Certificates",
  },
  {
    id: "ledgeraccess",
    name: "LedgerAccess",
    icon: Lock,
    color: "amber",
    desc: "Exclusive Access",
  },
  {
    id: "ledgerhealth",
    name: "LedgerHealth",
    icon: HeartPulse,
    color: "rose",
    desc: "Wellness & Healthcare",
  },
  {
    id: "ledgerbiz",
    name: "LedgerBiz",
    icon: TrendingUp,
    color: "orange",
    desc: "Business Assets",
  },
  {
    id: "ledgertech",
    name: "LedgerTech",
    icon: Hexagon,
    color: "indigo",
    desc: "Technology & Hardware",
  },
  {
    id: "ledgertravel",
    name: "LedgerTravel",
    icon: Plane,
    color: "sky",
    desc: "Fractional Aviation",
  },
  {
    id: "ledgeragri",
    name: "LedgerAgri",
    icon: Sprout,
    color: "lime",
    desc: "Agriculture & Farms",
  },
  {
    id: "ledgerenergy",
    name: "LedgerEnergy",
    icon: Sun,
    color: "yellow",
    desc: "Solar, Wind & Microgrids",
  },
];

const COLOR_MAP: Record<
  string,
  {
    text: string;
    bg: string;
    border: string;
    glow: string;
    gradient: string;
    accent: string;
    hex: string;
  }
> = {
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/20",
    gradient: "from-emerald-500/20 to-teal-500/10",
    accent: "#10b981",
    hex: "#10b981",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-500/20 to-blue-500/10",
    accent: "#22d3ee",
    hex: "#22d3ee",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/20",
    gradient: "from-violet-500/20 to-purple-500/10",
    accent: "#8b5cf6",
    hex: "#8b5cf6",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/20",
    gradient: "from-amber-500/20 to-yellow-500/10",
    accent: "#f59e0b",
    hex: "#f59e0b",
  },
  rose: {
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/20",
    gradient: "from-rose-500/20 to-red-500/10",
    accent: "#f43f5e",
    hex: "#f43f5e",
  },
  orange: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/20",
    gradient: "from-orange-500/20 to-amber-500/10",
    accent: "#f97316",
    hex: "#f97316",
  },
  indigo: {
    text: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    glow: "shadow-indigo-500/20",
    gradient: "from-indigo-500/20 to-blue-500/10",
    accent: "#6366f1",
    hex: "#6366f1",
  },
  sky: {
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    glow: "shadow-sky-500/20",
    gradient: "from-sky-500/20 to-cyan-500/10",
    accent: "#0ea5e9",
    hex: "#0ea5e9",
  },
  lime: {
    text: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
    glow: "shadow-lime-500/20",
    gradient: "from-lime-500/20 to-emerald-500/10",
    accent: "#84cc16",
    hex: "#84cc16",
  },
  yellow: {
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    glow: "shadow-yellow-500/20",
    gradient: "from-yellow-500/20 to-orange-500/10",
    accent: "#eab308",
    hex: "#eab308",
  },
};

/* ============================================================
   UTILS
   ============================================================ */
function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return "NOW";
  if (m < 60) return `${m}M`;
  if (h < 24) return `${h}H`;
  if (days < 7) return `${days}D`;
  return new Date(d)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1500,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStarted(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(e * value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}
      {display.toLocaleString("en-US", {
        maximumFractionDigits: value % 1 === 0 ? 0 : 1,
      })}
      {suffix}
    </span>
  );
}

/* ============================================================
   GLASS CARD
   ============================================================ */
function GlassCard({
  children,
  className = "",
  accent = "cyan",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
  glow?: boolean;
}) {
  const colors = COLOR_MAP[accent] || COLOR_MAP.cyan;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0c0c14] to-[#08080f] backdrop-blur-sm transition-all duration-500",
        colors.border,
        glow && `hover:shadow-[0_0_40px_${colors.hex}15]`,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10",
          colors.bg,
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */
function StatusBadge({
  status,
  isFilled,
  isExpired,
}: {
  status: string;
  isFilled: boolean;
  isExpired: boolean;
}) {
  if (isFilled)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CircleCheck className="h-3 w-3" /> Pool Filled
      </span>
    );
  if (isExpired)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle className="h-3 w-3" /> Expired
      </span>
    );
  const configs: Record<
    string,
    { bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    filling: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      icon: Flame,
    },
    forged: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      icon: Diamond,
    },
    active: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      icon: Activity,
    },
    dormant: {
      bg: "bg-slate-800",
      text: "text-slate-500",
      border: "border-slate-700",
      icon: Satellite,
    },
    sold: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
      icon: Banknote,
    },
    dissolved: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/20",
      icon: AlertTriangle,
    },
  };
  const c = configs[status] || configs.dormant;
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
        c.bg,
        c.text,
        c.border,
      )}
    >
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

/* ============================================================
   HERO SECTION — NO TARGET / TRUE COST
   ============================================================ */
function HeroSection({
  pool,
  vertical,
  colors,
  activeImage,
  setActiveImage,
  assetImages,
}: any) {
  const timeLeft = new Date(pool.closesAt).getTime() - Date.now();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/40 bg-gradient-to-br from-[#0a0a12] to-[#050508]">
      <div
        className={cn(
          "absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10",
          colors.bg,
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Info */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <Link
              href="/pools"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-cyan-400 transition-colors mb-6"
            >
              <ArrowLeft className="h-3 w-3" /> Asset Pools
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-xl border flex items-center justify-center",
                  colors.bg,
                  colors.border,
                )}
              >
                <vertical.icon className={cn("h-6 w-6", colors.text)} />
              </div>
              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                    colors.bg,
                    colors.text,
                    colors.border,
                  )}
                >
                  <vertical.icon className="h-3 w-3" />
                  {vertical.name}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge
                    status={pool.status}
                    isFilled={
                      pool.status === "forged" || pool.status === "active"
                    }
                    isExpired={timeLeft <= 0 && pool.status === "filling"}
                  />
                  {pool.hallClass && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                      Class {pool.hallClass}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
              {pool.name}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl mb-6">
              {pool.description || "No description provided."}
            </p>

            {/* Asset metadata row */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono mb-6">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> {pool.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {pool.participants}/
                {pool.maxParticipants} Sovereigns
              </span>
              <span className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />{" "}
                {timeLeft > 0
                  ? `${Math.ceil(timeLeft / 86400000)}D LEFT`
                  : "CYCLE CLOSED"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />{" "}
                {pool.locationOptions?.[0]?.name || "Location TBD"}
              </span>
            </div>

            {/* Asset Value + PIR — ONLY public financials */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/20">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Asset Value
                </p>
                <p className="text-xl font-bold font-mono text-cyan-400">
                  <AnimatedCounter value={pool.assetValue || 0} prefix="$" />
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/20">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Capital Deployed
                </p>
                <p className="text-xl font-bold font-mono text-emerald-400">
                  <AnimatedCounter value={pool.committed || 0} prefix="$" />
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/20">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  PIR Protected
                </p>
                <p className="text-xl font-bold font-mono text-amber-400">
                  <AnimatedCounter
                    value={pool.pirAllocation || pool.surplus || 0}
                    prefix="$"
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Participation meter — NOT a target progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-400">
                PARTICIPATION
              </span>
              <span className="text-[10px] font-mono text-slate-600">
                {pool.participants} of {pool.maxParticipants} sovereigns
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${pool.maxParticipants > 0 ? (pool.participants / pool.maxParticipants) * 100 : 0}%`,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Right: Image Gallery */}
        <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-0">
          <div className="absolute inset-0 lg:p-4">
            <div className="relative h-full rounded-2xl overflow-hidden border border-slate-800/40">
              <img
                src={assetImages[activeImage]}
                alt={pool.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-l from-[#050508] via-transparent to-transparent opacity-20 lg:opacity-40" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {assetImages.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === activeImage
                          ? "bg-cyan-400 w-8"
                          : "bg-slate-600 w-4 hover:bg-slate-500",
                      )}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setActiveImage(
                        (prev: number) =>
                          (prev - 1 + assetImages.length) % assetImages.length,
                      )
                    }
                    className="h-8 w-8 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveImage(
                        (prev: number) => (prev + 1) % assetImages.length,
                      )
                    }
                    className="h-8 w-8 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-all backdrop-blur-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="absolute bottom-12 left-4 flex gap-2">
                {assetImages.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative w-12 h-8 rounded-lg overflow-hidden border transition-all",
                      i === activeImage
                        ? "border-cyan-500/50 ring-1 ring-cyan-500/30"
                        : "border-slate-800 opacity-60 hover:opacity-100",
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DATA DASHBOARD — NO TARGET / TRUE COST
   ============================================================ */
function DataDashboard({ pool, colors, user }: any) {
  const assetValue = pool.assetValue || 0;
  const committed = pool.committed || 0;
  const pir = pool.pirAllocation || pool.surplus || 0;
  const participantPct =
    pool.maxParticipants > 0
      ? ((pool.participants / pool.maxParticipants) * 100).toFixed(1)
      : "0";

  const stats = [
    {
      label: "Asset Value",
      value: assetValue,
      prefix: "$",
      icon: Building2,
      color: "cyan",
      sub: "Current book valuation",
    },
    {
      label: "Capital Deployed",
      value: committed,
      prefix: "$",
      icon: Coins,
      color: "emerald",
      sub: "Total sovereign commitments",
    },
    {
      label: "PIR Reserve",
      value: pir,
      prefix: "$",
      icon: Shield,
      color: "amber",
      sub: "Protocol protection layer",
    },
    {
      label: "Sovereigns",
      value: pool.participants || 0,
      prefix: "",
      icon: Users,
      color: "violet",
      sub: `${participantPct}% of capacity`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => {
        const c = COLOR_MAP[s.color];
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={cn(
              "relative overflow-hidden rounded-xl border p-5 bg-gradient-to-br from-[#0c0c14] to-[#08080f]",
              c.border,
            )}
          >
            <div
              className={cn(
                "absolute top-0 right-0 h-16 w-16 rounded-full blur-3xl opacity-10",
                c.bg,
              )}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("h-3.5 w-3.5", c.text)} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  {s.label}
                </span>
              </div>
              <p
                className={cn(
                  "text-xl sm:text-2xl font-bold font-mono",
                  c.text,
                )}
              >
                <AnimatedCounter value={s.value} prefix={s.prefix} />
              </p>
              <p className="text-[10px] text-slate-600 mt-1">{s.sub}</p>
            </div>
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r",
                c.gradient,
              )}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
   PIR BREAKDOWN
   ============================================================ */
function PirBreakdown() {
  const allocations = [
    {
      label: "The Shield",
      pct: 25,
      desc: "Insurance & Legal",
      color: "emerald",
      icon: Shield,
    },
    {
      label: "The Seal",
      pct: 20,
      desc: "SPV & Compliance",
      color: "cyan",
      icon: LockKeyhole,
    },
    {
      label: "The Forge",
      pct: 20,
      desc: "Maintenance & Ops",
      color: "amber",
      icon: Flame,
    },
    {
      label: "The Spire",
      pct: 15,
      desc: "Management",
      color: "violet",
      icon: Target,
    },
    {
      label: "The Vanguard",
      pct: 12,
      desc: "R&D & Growth",
      color: "rose",
      icon: Orbit,
    },
    {
      label: "The Sanctuary",
      pct: 8,
      desc: "Emergency Reserve",
      color: "indigo",
      icon: Diamond,
    },
  ];

  return (
    <GlassCard accent="cyan" glow>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Protocol Infrastructure Reserve
            </h3>
            <p className="text-[10px] text-slate-500">
              The 8th Ledger commands the reserve. The public knows it exists.
              No one sees its depths.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allocations.map((a, i) => {
            const c = COLOR_MAP[a.color];
            const Icon = a.icon;
            return (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-4 text-center transition-all duration-300 hover:scale-105",
                  c.border,
                  "bg-slate-900/20",
                )}
              >
                <div className={cn("absolute inset-0 opacity-5", c.bg)} />
                <Icon className={cn("h-5 w-5 mx-auto mb-2", c.text)} />
                <p className="text-lg font-bold font-mono text-white">
                  {a.pct}%
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {a.label}
                </p>
                <p className="text-[9px] text-slate-600 mt-0.5">{a.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

/* ============================================================
   LOCATION OPTIONS
   ============================================================ */
function LocationOptions({ options, colors }: { options: any[]; colors: any }) {
  if (!options || options.length === 0) return null;

  return (
    <GlassCard accent={colors.color} glow>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className={cn("h-4 w-4", colors.text)} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Location Options
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent" />
          <span className="text-[10px] font-mono text-slate-700">
            {options.length} sites
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {options.map((loc: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
                loc.isSelected ? colors.border : "border-slate-800/40",
                loc.isSelected ? colors.bg : "bg-slate-900/10",
              )}
            >
              {loc.isSelected && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-2 w-2">
                    <span
                      className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        colors.bg,
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        colors.bg,
                      )}
                    />
                  </span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0",
                    loc.isSelected
                      ? colors.bg
                      : "bg-slate-800 border-slate-700",
                  )}
                >
                  <MapPin
                    className={cn(
                      "h-4 w-4",
                      loc.isSelected ? colors.text : "text-slate-600",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {loc.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {loc.address || "Address pending"}
                  </p>
                  {loc.lat && loc.lng && (
                    <p className="text-[9px] font-mono text-slate-700 mt-1">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </p>
                  )}
                  {loc.votes > 0 && (
                    <p className="text-[9px] text-slate-600 mt-1">
                      {loc.votes} votes
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

/* ============================================================
   COMMIT TERMINAL — NO TARGET REFERENCE
   ============================================================ */
function CommitTerminal({
  pool,
  user,
  onCommit,
  committing,
  message,
  commitAmount,
  setCommitAmount,
}: any) {
  const isClosed =
    pool.status === "forged" ||
    pool.status === "active" ||
    pool.status === "dormant" ||
    pool.status === "sold" ||
    pool.status === "dissolved";
  const timeLeft = new Date(pool.closesAt).getTime() - Date.now();
  const isExpired = timeLeft <= 0;

  if (isClosed || isExpired)
    return (
      <GlassCard accent="emerald">
        <div className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {pool.status === "forged"
                ? "Pool Forged — Hall Unlocked"
                : pool.status === "active"
                  ? "Pool Active — Revenue Flowing"
                  : "Pool Closed"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {pool.status === "forged" || pool.status === "active"
                ? "Ownership has been distributed. The hall is now live."
                : "This pool is no longer accepting commitments."}
            </p>
          </div>
        </div>
      </GlassCard>
    );

  return (
    <GlassCard accent="cyan" glow>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">
            Commit Terminal
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-lg border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Min Commit
            </p>
            <p className="text-sm font-bold font-mono text-white">
              ${pool.minCommitment || 1}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Max Commit
            </p>
            <p className="text-sm font-bold font-mono text-white">
              ${pool.maxCommitment || "∞"}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Your Balance
            </p>
            <p className="text-sm font-bold font-mono text-emerald-400">
              ${user?.ledgerBalance?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Est. Ownership
            </p>
            <p className="text-sm font-bold font-mono text-cyan-400">
              {commitAmount && pool.assetValue > 0
                ? `${((Number(commitAmount) / pool.assetValue) * 100).toFixed(4)}%`
                : "0%"}
            </p>
          </div>
        </div>

        <form onSubmit={onCommit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">
              $
            </span>
            <input
              type="number"
              value={commitAmount}
              onChange={(e) => setCommitAmount(e.target.value)}
              min={pool.minCommitment || 1}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/30 pl-8 pr-4 py-3 text-sm text-white font-mono outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-slate-700 transition-all"
              placeholder={String(pool.minCommitment || 1)}
            />
          </div>

          <button
            type="submit"
            disabled={committing || !commitAmount}
            className={cn(
              "w-full rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
              committing || !commitAmount
                ? "border-slate-800 bg-slate-900/20 text-slate-600 cursor-not-allowed"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]",
            )}
          >
            {committing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4" />
                Commit Capital
              </>
            )}
          </button>
        </form>

        {message && (
          <div
            className={cn(
              "mt-4 rounded-xl p-3 text-xs border",
              message.includes("Committed") || message.includes("PAC")
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20",
            )}
          >
            {message}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/* ============================================================
   SOVEREIGN ACCESS CARD
   ============================================================ */
function SovereignAccess({ pool, userOwnership, colors }: any) {
  if (!userOwnership || userOwnership.ownershipPercent <= 0) return null;

  return (
    <GlassCard accent="cyan" glow>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Sovereign Access Granted
            </h3>
            <p className="text-[10px] text-slate-500">
              You are a sovereign owner of this asset
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Your Commitment
            </p>
            <p className="text-lg font-bold text-white font-mono">
              ${userOwnership.amountCommitted?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Ownership
            </p>
            <p className="text-lg font-bold text-cyan-400 font-mono">
              {userOwnership.ownershipPercent?.toFixed(2) || "0"}%
            </p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Monthly Dividend
            </p>
            <p className="text-lg font-bold text-emerald-400 font-mono">
              ${userOwnership.dividendPreview?.monthly?.toLocaleString() || "0"}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
              Est. Annual Yield
            </p>
            <p className="text-lg font-bold text-amber-400 font-mono">
              {userOwnership.dividendPreview?.yield || "0"}%
            </p>
          </div>
        </div>

        <Link href={`/halls/${pool.poolId}`}>
          <button className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 py-3 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2">
            <LockKeyhole className="h-4 w-4" />
            Enter Hall
          </button>
        </Link>
      </div>
    </GlassCard>
  );
}

/* ============================================================
   REVIEW SYSTEM
   ============================================================ */
function ReviewSystem({ reviews, reviewStats, user, poolId, onSubmit }: any) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await onSubmit({ poolId, rating, content: text });
    setText("");
    setRating(5);
    setSubmitting(false);
  };

  return (
    <GlassCard accent="amber">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="h-4 w-4 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">
            Community Reviews
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
          <span className="text-[10px] font-mono text-slate-700">
            {reviewStats.total} entries
          </span>
        </div>

        {user && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 p-4 rounded-xl border border-slate-800/40 bg-slate-900/20"
          >
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      s <= rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-700",
                    )}
                  />
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-2 font-mono">
                {rating}/5
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Share your experience with this asset..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2 text-xs text-white placeholder:text-slate-700 outline-none focus:border-amber-500/30 resize-none mb-3"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                submitting || !text.trim()
                  ? "border-slate-800 bg-slate-900/20 text-slate-600 cursor-not-allowed"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
              )}
            >
              {submitting ? "Submitting..." : "Post Review"}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">
                No reviews yet. Be the first to review this asset.
              </p>
            </div>
          ) : (
            reviews.map((review: any, i: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-slate-800/40 bg-slate-900/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {review.user?.displayName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-300">
                        {review.user?.displayName || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-3 w-3",
                              s <= review.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-700",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-700">
                    {timeAgo(review.createdAt)}
                  </span>
                </div>
                {review.title && (
                  <p className="text-xs font-semibold text-slate-300 mb-1">
                    {review.title}
                  </p>
                )}
                <p className="text-xs text-slate-500 leading-relaxed">
                  {review.content}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </GlassCard>
  );
}

/* ============================================================
   EXTERNAL LINKS
   ============================================================ */
function ExternalLinks({ links }: { links: any[] }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link: any, i: number) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/20 text-[11px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/20 transition-all"
        >
          <ExternalLink className="h-3 w-3" />
          {link.label}
        </a>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function PoolDetailPage() {
  const params = useParams();
  const poolId = params.id as string;
  const { user } = useAuth();

  const [pool, setPool] = useState<PoolDetail | null>(null);
  const [reviews, setReviews] = useState<unknown[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [commitAmount, setCommitAmount] = useState("");
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [poolRes, reviewRes] = await Promise.all([
          fetch(`/api/pools/${poolId}`),
          fetch(`/api/reviews?poolId=${poolId}`),
        ]);
        const poolData = await poolRes.json();
        const reviewData = await reviewRes.json();
        if (poolData.success) setPool(poolData.pool);
        if (reviewData.success) {
          setReviews(reviewData.reviews || []);
          setReviewStats({
            total: reviewData.total || 0,
            average: reviewData.averageRating || 0,
          });
        }
      } catch (err) {
        console.error("[POOL DETAIL]", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [poolId]);

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    const minAmount = pool?.minCommitment ?? 1;
    if (!commitAmount || Number(commitAmount) < minAmount) {
      setMessage(`Minimum commitment is $${minAmount}`);
      return;
    }
    if (!user) {
      setMessage("Authenticate to commit capital");
      return;
    }

    setCommitting(true);
    setMessage("");
    try {
      const res = await fetch(`/api/pools/${poolId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(commitAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `Committed $${commitAmount}. PAC token: ${data.pacToken || "Pending"}`,
        );
        const fresh = await fetch(`/api/pools/${poolId}`).then((r) => r.json());
        if (fresh.success) setPool(fresh.pool);
        setCommitAmount("");
      } else {
        setMessage(data.error || "Commitment failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setCommitting(false);
    }
  }

  async function handleReviewSubmit({ poolId, rating, content }: any) {
    if (!user) {
      setMessage("Authenticate to leave a review");
      return;
    }
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId, rating, content }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => [data.review, ...prev]);
        setReviewStats((prev) => ({
          total: prev.total + 1,
          average: data.review?.rating
            ? Math.round(
                ((prev.average * prev.total + data.review.rating) /
                  (prev.total + 1)) *
                  10,
              ) / 10
            : prev.average,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  const assetImages = pool?.assetImages || [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
  ];

  const locationOptions = pool?.locationOptions || [];
  const externalLinks = pool?.externalLinks || [
    { label: "SPV Registration", url: "#" },
    { label: "Asset Inspection", url: "#" },
    { label: "Insurance Certificate", url: "#" },
  ];

  const userOwnership = pool?.userOwnership || null;

  if (loading) {
    return (
      <div className="h-screen bg-[#050508] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-[#050508] text-slate-100 flex items-center justify-center px-6">
        <GlassCard accent="red" className="max-w-lg w-full text-center py-16">
          <Satellite className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-400">Pool Not Found</p>
          <p className="text-xs text-slate-600 mt-2">
            This asset does not exist in the registry.
          </p>
          <Link
            href="/pools"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/30 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <ArrowLeft className="h-3 w-3" /> Return to Pools
          </Link>
        </GlassCard>
      </div>
    );
  }

  const vertical =
    ALL_VERTICALS.find((v) => pool.verticalId?.includes(v.id)) ||
    ALL_VERTICALS[0];
  const colors = COLOR_MAP[vertical.color] || COLOR_MAP.cyan;

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-100">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className={cn(
            "absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-5",
            colors.bg,
          )}
        />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        <HeroSection
          pool={pool}
          vertical={vertical}
          colors={colors}
          activeImage={activeImage}
          setActiveImage={setActiveImage}
          assetImages={assetImages}
        />

        <DataDashboard pool={pool} colors={colors} user={user} />

        <PirBreakdown />

        <LocationOptions options={locationOptions} colors={colors} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CommitTerminal
            pool={pool}
            user={user}
            onCommit={handleCommit}
            committing={committing}
            message={message}
            commitAmount={commitAmount}
            setCommitAmount={setCommitAmount}
          />
          <SovereignAccess
            pool={pool}
            userOwnership={userOwnership}
            colors={colors}
          />
        </div>

        <ExternalLinks links={externalLinks} />

        <ReviewSystem
          reviews={reviews}
          reviewStats={reviewStats}
          user={user}
          poolId={poolId}
          onSubmit={handleReviewSubmit}
        />

        <GlassCard accent="cyan">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                System Protocol
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <Fingerprint className="h-3 w-3 text-cyan-400" />
                  Perpetual Asset Contract
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Commit capital into a pool. When it fills, your commitment
                  converts to a PAC — a legal ownership percentage of a
                  real-world asset. You govern. You earn. Forever.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <Orbit className="h-3 w-3 text-violet-400" />
                  The Meridian Cycle
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pools are forged through a democratic cycle: The Hush, The
                  Unveil, The Reveal, and The Forge. Winner chosen by vote.
                  Continent rotation ensures global spread.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Protocol Infrastructure Reserve
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The PIR covers insurance, legal structure, maintenance,
                  operations, payroll, and closure protection. The 8th Ledger
                  takes full responsibility.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
