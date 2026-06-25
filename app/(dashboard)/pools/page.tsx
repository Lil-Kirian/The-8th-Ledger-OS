"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Layers, Users, Timer, Globe, Landmark, Zap, Crown, Lock,
  HeartPulse, TrendingUp, Hexagon, Plane, Wheat, Sun,
  ArrowRight, Coins, CheckCircle2, Shield, Radio, Activity,
  ChevronRight, Sparkles, Terminal, Orbit, Crosshair,
  BarChart3, Flame, CircleDot, Fingerprint, Satellite,
  Building2, CircleCheck, XCircle, Diamond, Flame as FlameIcon,
  LockKeyhole, Target, Percent, TrendingUp as TrendUp,
  ArrowLeft, Hash, CircleDollarSign, Wallet, Receipt
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   VERTICALS — ALL 10 LEDGERS
   ============================================================ */
const ALL_VERTICALS = [
  { id: "ledgerprop", name: "LedgerProp", icon: Landmark, color: "emerald", desc: "Real Estate & Property", status: "live" },
  { id: "ledgerauto", name: "LedgerAuto", icon: Zap, color: "cyan", desc: "Vehicles & Mobility", status: "locked" },
  { id: "ledgeredu", name: "LedgerEdu", icon: Crown, color: "violet", desc: "Education & Certificates", status: "locked" },
  { id: "ledgeraccess", name: "LedgerAccess", icon: Lock, color: "amber", desc: "Exclusive Access", status: "locked" },
  { id: "ledgerhealth", name: "LedgerHealth", icon: HeartPulse, color: "rose", desc: "Wellness & Healthcare", status: "locked" },
  { id: "ledgerbiz", name: "LedgerBiz", icon: TrendingUp, color: "orange", desc: "Business Assets", status: "locked" },
  { id: "ledgertech", name: "LedgerTech", icon: Hexagon, color: "indigo", desc: "Technology & Hardware", status: "locked" },
  { id: "ledgertravel", name: "LedgerTravel", icon: Plane, color: "sky", desc: "Fractional Aviation", status: "locked" },
  { id: "ledgeragri", name: "LedgerAgri", icon: Wheat, color: "lime", desc: "Agriculture & Farms", status: "locked" },
  { id: "ledgerenergy", name: "LedgerEnergy", icon: Sun, color: "yellow", desc: "Solar, Wind & Microgrids", status: "locked" },
];

const COLOR_MAP: Record<string, { text: string; bg: string; border: string; glow: string; gradient: string; accent: string; hex: string }> = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/20", gradient: "from-emerald-500/20 to-teal-500/10", accent: "#10b981", hex: "#10b981" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "shadow-cyan-500/20", gradient: "from-cyan-500/20 to-blue-500/10", accent: "#22d3ee", hex: "#22d3ee" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "shadow-violet-500/20", gradient: "from-violet-500/20 to-purple-500/10", accent: "#8b5cf6", hex: "#8b5cf6" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/20", gradient: "from-amber-500/20 to-yellow-500/10", accent: "#f59e0b", hex: "#f59e0b" },
  rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-rose-500/20", gradient: "from-rose-500/20 to-red-500/10", accent: "#f43f5e", hex: "#f43f5e" },
  orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", glow: "shadow-orange-500/20", gradient: "from-orange-500/20 to-amber-500/10", accent: "#f97316", hex: "#f97316" },
  indigo: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "shadow-indigo-500/20", gradient: "from-indigo-500/20 to-blue-500/10", accent: "#6366f1", hex: "#6366f1" },
  sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", glow: "shadow-sky-500/20", gradient: "from-sky-500/20 to-cyan-500/10", accent: "#0ea5e9", hex: "#0ea5e9" },
  lime: { text: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20", glow: "shadow-lime-500/20", gradient: "from-lime-500/20 to-emerald-500/10", accent: "#84cc16", hex: "#84cc16" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", glow: "shadow-yellow-500/20", gradient: "from-yellow-500/20 to-orange-500/10", accent: "#eab308", hex: "#eab308" },
};

/* ============================================================
   ANIMATED COUNTER — FIXED NO $$
   ============================================================ */
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(e * value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value]);

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}{display.toLocaleString("en-US", { maximumFractionDigits: value % 1 === 0 ? 0 : 1 })}{suffix}
    </span>
  );
}

/* ============================================================
   GLASS CARD
   ============================================================ */
function GlassCard({ children, className = "", accent = "cyan", glow = false }: { children: React.ReactNode; className?: string; accent?: string; glow?: boolean }) {
  const colors = COLOR_MAP[accent] || COLOR_MAP.cyan;
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0c0c14] to-[#08080f] backdrop-blur-sm transition-all duration-500",
      colors.border,
      glow && `hover:shadow-[0_0_40px_${colors.hex}15]`,
      className
    )}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10", colors.bg)} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
    filling: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: FlameIcon, label: "FILLING" },
    forged: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", icon: Diamond, label: "FORGED" },
    active: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: Activity, label: "ACTIVE" },
    dormant: { bg: "bg-slate-800", text: "text-slate-500", border: "border-slate-700", icon: Satellite, label: "DORMANT" },
    sold: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", icon: LockKeyhole, label: "SOLD" },
    dissolved: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", icon: XCircle, label: "DISSOLVED" },
  };
  const c = configs[status] || configs.dormant;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border", c.bg, c.text, c.border)}>
      <Icon className="h-2.5 w-2.5" /> {c.label}
    </span>
  );
}

/* ============================================================
   HERO STATS
   ============================================================ */
function HeroStats({ stats }: { stats: any }) {
  const cards = [
    { label: "TOTAL POOLS", value: stats?.total ?? 0, icon: Layers, color: "cyan", suffix: "" },
    { label: "ACTIVE FORGES", value: stats?.active ?? 0, icon: Flame, color: "amber", suffix: "" },
    { label: "CAPITAL DEPLOYED", value: stats?.committed ?? 0, icon: BarChart3, color: "emerald", suffix: "", prefix: "$" },
    { label: "PROTOCOL UPTIME", value: 99.97, icon: Radio, color: "violet", suffix: "%" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => {
        const colors = COLOR_MAP[c.color];
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={cn(
              "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4",
              colors.border, "from-[#0c0c14] to-[#08080f]"
            )}
          >
            <div className={cn("absolute top-0 right-0 h-16 w-16 rounded-full blur-3xl opacity-20", colors.bg)} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("h-3.5 w-3.5", colors.text)} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">{c.label}</span>
              </div>
              <p className={cn("text-xl sm:text-2xl font-bold font-mono", colors.text)}>
                {c.prefix}<AnimatedCounter value={c.value} suffix={c.suffix} />
              </p>
            </div>
            <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r", colors.gradient)} />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
   VERTICAL SELECTOR
   ============================================================ */
function VerticalSelector({ activeId, onSelect }: { activeId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vertical Selector</span>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(null)}
          className={cn(
            "relative group overflow-hidden rounded-xl border p-3 transition-all duration-300",
            !activeId
              ? "border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              : "border-slate-800/40 bg-slate-900/20 hover:border-slate-700/40"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center border transition-all",
              !activeId ? "bg-cyan-500/10 border-cyan-500/20" : "bg-slate-800/50 border-slate-800"
            )}>
              <Layers className={cn("h-4 w-4", !activeId ? "text-cyan-400" : "text-slate-600")} />
            </div>
            <span className={cn("text-[10px] font-bold", !activeId ? "text-white" : "text-slate-500")}>All</span>
          </div>
          {!activeId && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500/50" />}
        </motion.button>

        {ALL_VERTICALS.map((v, i) => {
          const colors = COLOR_MAP[v.color];
          const Icon = v.icon;
          const isActive = activeId === v.id;
          const isLive = v.status === "live";

          return (
            <motion.button
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={isLive ? { scale: 1.02 } : {}}
              whileTap={isLive ? { scale: 0.98 } : {}}
              onClick={() => isLive && onSelect(isActive ? null : v.id)}
              disabled={!isLive}
              className={cn(
                "relative group overflow-hidden rounded-xl border p-3 transition-all duration-300",
                isActive && isLive
                  ? cn(colors.border, colors.bg, "shadow-[0_0_20px_rgba(0,0,0,0.3)]")
                  : isLive
                  ? "border-slate-800/40 bg-slate-900/20 hover:border-slate-700/40"
                  : "border-slate-800/20 bg-slate-900/10 opacity-40 cursor-not-allowed"
              )}
            >
              {isLive && !isActive && (
                <div className="absolute top-2 right-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75")} style={{ backgroundColor: colors.accent }} />
                    <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", colors.bg)} />
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center border transition-all",
                  isActive && isLive ? cn(colors.bg, colors.border) : "bg-slate-800/50 border-slate-800"
                )}>
                  <Icon className={cn("h-4 w-4", isActive && isLive ? colors.text : "text-slate-600")} />
                </div>
                <span className={cn("text-[10px] font-bold", isActive && isLive ? "text-white" : "text-slate-500")}>{v.name}</span>
                {!isLive && <span className="text-[8px] text-slate-700 font-mono">LOCKED</span>}
              </div>

              {isActive && isLive && (
                <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r", colors.gradient)} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   POOL CARD — NO TARGET / TRUE COST
   ============================================================ */
function PoolCard({ pool, index }: { pool: any; index: number }) {
  const vertical = ALL_VERTICALS.find(v => pool.verticalId?.includes(v.id)) || ALL_VERTICALS[0];
  const colors = COLOR_MAP[vertical.color];
  const Icon = vertical.icon;

  const committed = pool.committed || 0;
  const assetValue = pool.assetValue || 0;
  const participants = pool.participants || 0;
  const maxParticipants = pool.maxParticipants || 0;
  const participantPct = maxParticipants > 0 ? (participants / maxParticipants) * 100 : 0;
  const timeLeft = new Date(pool.closesAt).getTime() - Date.now();
  const isExpired = timeLeft <= 0;
  const isFilled = pool.status === "forged" || pool.status === "active" || pool.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/pools/${pool.poolId}`} className="group block">
        <div className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-500",
          "bg-gradient-to-br from-[#0c0c14] to-[#08080f]",
          "hover:shadow-2xl hover:border-slate-700/50",
          isFilled ? "border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]" : "border-slate-800/40"
        )}>
          {/* Side glow strip */}
          <div className={cn(
            "absolute left-0 top-4 bottom-4 w-0.5 rounded-full transition-all duration-500",
            isFilled ? "bg-emerald-500/50" : participantPct > 75 ? "bg-cyan-500/40" : "bg-slate-800"
          )} />

          {/* Top holographic line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

          <div className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              {/* Left: Identity */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={cn(
                  "relative shrink-0 h-14 w-14 rounded-xl border flex items-center justify-center transition-all duration-300",
                  colors.bg, colors.border,
                  "group-hover:shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                )}>
                  <Icon className={cn("h-7 w-7", colors.text)} />
                  {isFilled && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#0c0c14] flex items-center justify-center">
                      <CheckCircle2 className="h-2.5 w-2.5 text-[#0c0c14]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {pool.name}
                    </h3>
                    <StatusBadge status={pool.status} />
                    {pool.hallClass && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                        CLASS {pool.hallClass}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Globe className="h-3 w-3" /> {pool.country}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Users className="h-3 w-3" /> {participants}/{maxParticipants} Sovereigns
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Timer className="h-3 w-3" /> {timeLeft > 0 ? `${Math.ceil(timeLeft / 86400000)}D LEFT` : "CYCLE CLOSED"}
                    </span>
                  </div>

                  {pool.description && (
                    <p className="mt-2 text-[11px] text-slate-600 line-clamp-1 leading-relaxed">
                      {pool.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Financials — NO TARGET, NO TRUE COST */}
              <div className="flex flex-col gap-3 lg:items-end lg:min-w-[260px]">
                <div className="flex items-baseline gap-4">
                  <div className="text-right">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Asset Value</p>
                    <p className="text-lg font-bold font-mono text-cyan-400">
                      <AnimatedCounter value={assetValue} prefix="$" />
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="text-right">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Deployed</p>
                    <p className="text-sm font-bold font-mono text-emerald-400">
                      <AnimatedCounter value={committed} prefix="$" />
                    </p>
                  </div>
                </div>

                {/* Participation meter — NOT target progress */}
                <div className="w-full lg:w-56">
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="font-mono font-bold text-cyan-400/80">
                      PARTICIPATION
                    </span>
                    <span className="text-slate-700 font-mono">
                      {participants} of {maxParticipants} sovereigns
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${participantPct}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={cn(
                        "h-full rounded-full relative",
                        isFilled
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : participantPct > 75
                          ? "bg-gradient-to-r from-cyan-500 to-blue-400"
                          : "bg-gradient-to-r from-cyan-600 to-cyan-400"
                      )}
                    >
                      {isFilled && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                    </motion.div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-slate-700">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-violet-500/60" />
                    PIR-Protected
                  </span>
                  <span className="flex items-center gap-1">
                    <CircleDot className="h-3 w-3 text-emerald-500/60" />
                    {pool.locationOptions?.length || 0} Locations
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom holographic line */}
          <div className={cn("h-px w-full bg-gradient-to-r from-transparent", isFilled ? "via-emerald-500/20" : "via-slate-700/30", "to-transparent")} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ============================================================
   PIR BANNER
   ============================================================ */
function PirBanner() {
  return (
    <GlassCard accent="cyan" glow>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Protocol Infrastructure Reserve</h3>
            <p className="text-[10px] text-slate-500">The 8th Ledger commands the reserve. The public knows it exists. No one sees its depths.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "The Shield", pct: 25, desc: "Insurance & Legal", color: "emerald", icon: Shield },
            { label: "The Seal", pct: 20, desc: "SPV & Compliance", color: "cyan", icon: LockKeyhole },
            { label: "The Forge", pct: 20, desc: "Maintenance & Ops", color: "amber", icon: Flame },
            { label: "The Spire", pct: 15, desc: "Management", color: "violet", icon: Target },
            { label: "The Vanguard", pct: 12, desc: "R&D & Growth", color: "rose", icon: Orbit },
            { label: "The Sanctuary", pct: 8, desc: "Emergency Reserve", color: "indigo", icon: Diamond },
          ].map((a, i) => {
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
                  c.border, "bg-slate-900/20"
                )}
              >
                <div className={cn("absolute inset-0 opacity-5", c.bg)} />
                <Icon className={cn("h-5 w-5 mx-auto mb-2", c.text)} />
                <p className="text-lg font-bold font-mono text-white">{a.pct}%</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{a.label}</p>
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
   EMPTY STATE
   ============================================================ */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-gradient-to-br from-[#0c0c14] to-[#08080f] p-12 text-center"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-slate-800/50 border border-slate-700 items-center justify-center mb-4">
          <Satellite className="h-8 w-8 text-slate-600" />
        </div>
        <p className="text-sm font-bold text-slate-400 mb-1">No Pools Detected</p>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">
          The Architect will forge new pools through the Meridian Cycle. Check back after the next Reveal phase.
        </p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   FOOTER INFO
   ============================================================ */
function FooterInfo() {
  return (
    <GlassCard accent="cyan">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">System Protocol</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
              <Fingerprint className="h-3 w-3 text-cyan-400" />
              Perpetual Asset Contract
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Commit capital into a pool. When it fills, your commitment converts to a PAC — a legal ownership percentage of a real-world asset. You govern. You earn. Forever.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
              <Orbit className="h-3 w-3 text-violet-400" />
              The Meridian Cycle
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pools are forged through a democratic cycle: The Hush, The Unveil, The Reveal, and The Forge. Winner chosen by vote. Continent rotation ensures global spread.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Protocol Infrastructure Reserve
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The PIR covers insurance, legal structure, maintenance, operations, payroll, and closure protection. The 8th Ledger takes full responsibility.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function PoolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeVertical = searchParams.get("vertical");

  const { data, isLoading } = useSWR(
    `/api/pools${activeVertical ? `?vertical=${activeVertical}` : ""}`,
    fetcher
  );

  const pools = data?.pools || [];
  const stats = data?.stats || { total: 0, active: 0, committed: 0 };

  const handleSelectVertical = (id: string | null) => {
    if (id) router.push(`/pools?vertical=${id}`);
    else router.push("/pools");
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-100">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Live Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Asset <span className="text-cyan-400">Pools</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Commit capital to own real-world assets — LedgerProp is live
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-800/40 bg-slate-900/20 px-4 py-2">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-mono text-slate-400">
              {stats.active ?? 0} Active / {stats.total ?? 0} Total
            </span>
          </div>
        </motion.div>

        {/* Hero Stats */}
        <HeroStats stats={{ total: stats.total, active: stats.active, committed: stats.committed, uptime: 99.97 }} />

        {/* PIR Banner */}
        <PirBanner />

        {/* Vertical Selector */}
        <VerticalSelector activeId={activeVertical} onSelect={handleSelectVertical} />

        {/* Pool List Header */}
        <div className="flex items-center gap-2">
          <CircleDot className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {activeVertical
              ? ALL_VERTICALS.find(v => v.id === activeVertical)?.name + " Pools"
              : "All Live Pools"}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent" />
          <span className="text-[10px] font-mono text-slate-700">{pools.length} entries</span>
        </div>

        {/* Pool List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              </div>
            ) : pools.length === 0 ? (
              <EmptyState />
            ) : (
              pools.map((pool: any, i: number) => (
                <PoolCard key={pool.poolId} pool={pool} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <FooterInfo />
      </div>
    </div>
  );
}