"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft, AlertTriangle,
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp,
  Hexagon, Plane, Sprout, Sun, Target, Shield,
  FileCheck, Coins, Users, Globe, Timer, Fingerprint,
  Terminal, Orbit, Diamond,
  Flame, LockKeyhole, Satellite,
  CircleCheck, XCircle
} from "lucide-react";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   VERTICALS
   ============================================================ */
const ALL_VERTICALS = [
  { id: "ledgerprop", name: "LedgerProp", icon: Landmark, color: "emerald", desc: "Real Estate & Property" },
  { id: "ledgerauto", name: "LedgerAuto", icon: Zap, color: "cyan", desc: "Vehicles & Mobility" },
  { id: "ledgeredu", name: "LedgerEdu", icon: Crown, color: "violet", desc: "Education & Certificates" },
  { id: "ledgeraccess", name: "LedgerAccess", icon: Lock, color: "amber", desc: "Exclusive Access" },
  { id: "ledgerhealth", name: "LedgerHealth", icon: HeartPulse, color: "rose", desc: "Wellness & Healthcare" },
  { id: "ledgerbiz", name: "LedgerBiz", icon: TrendingUp, color: "orange", desc: "Business Assets" },
  { id: "ledgertech", name: "LedgerTech", icon: Hexagon, color: "indigo", desc: "Technology & Hardware" },
  { id: "ledgertravel", name: "LedgerTravel", icon: Plane, color: "sky", desc: "Fractional Aviation" },
  { id: "ledgeragri", name: "LedgerAgri", icon: Sprout, color: "lime", desc: "Agriculture & Farms" },
  { id: "ledgerenergy", name: "LedgerEnergy", icon: Sun, color: "yellow", desc: "Solar, Wind & Microgrids" },
];

const COLOR_MAP: Record<string, { text: string; bg: string; border: string; gradient: string; accent: string; hex: string }> = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/20 to-teal-500/10", accent: "#10b981", hex: "#10b981" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500/20 to-blue-500/10", accent: "#22d3ee", hex: "#22d3ee" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/20 to-purple-500/10", accent: "#8b5cf6", hex: "#8b5cf6" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/20 to-yellow-500/10", accent: "#f59e0b", hex: "#f59e0b" },
  rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500/20 to-red-500/10", accent: "#f43f5e", hex: "#f43f5e" },
  orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/20 to-amber-500/10", accent: "#f97316", hex: "#f97316" },
  indigo: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/20 to-blue-500/10", accent: "#6366f1", hex: "#6366f1" },
  sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/20 to-cyan-500/10", accent: "#0ea5e9", hex: "#0ea5e9" },
  lime: { text: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20", gradient: "from-lime-500/20 to-emerald-500/10", accent: "#84cc16", hex: "#84cc16" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/20 to-orange-500/10", accent: "#eab308", hex: "#eab308" },
};

/* ============================================================
   ANIMATED COUNTER
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
    filling: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: Flame, label: "FILLING" },
    forged: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", icon: Diamond, label: "FORGED" },
    active: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: CircleCheck, label: "ACTIVE" },
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
   MAIN PAGE
   ============================================================ */
export default function CommitPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params.id as string;
  const { user } = useAuth();

  const [pool, setPool] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [poolRes, walletRes] = await Promise.all([
          fetch(`/api/pools/${poolId}`),
          fetch("/api/wallet/balance"),
        ]);
        const poolData = await poolRes.json();
        const walletData = await walletRes.json();
        if (poolData.success) setPool(poolData.pool);
        if (walletData.success) setWalletBalance(walletData.available || walletData.balance || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [poolId]);

  const numAmount = Number(amount) || 0;
  const assetValue = pool?.assetValue || 0;
  const minCommitment = pool?.minCommitment ?? 1;
  const maxCommitment = pool?.maxCommitment ?? Infinity;
  const committed = pool?.committed || 0;
  const participants = pool?.participants || 0;
  const maxParticipants = pool?.maxParticipants || 0;

  // Ownership preview based on assetValue (NOT target)
  const ownershipPreview = assetValue > 0 && numAmount > 0
    ? {
        ownershipPercent: ((numAmount / assetValue) * 100).toFixed(4),
        estimatedDividendMonthly: pool?.estimatedRevenue
          ? (numAmount / assetValue) * (pool.estimatedRevenue * 0.8 * 0.2)
          : 0,
      }
    : { ownershipPercent: "0.0000", estimatedDividendMonthly: 0 };

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault();
    if (!numAmount || numAmount < minCommitment) {
      setMessage(`Minimum commitment is $${minCommitment}`);
      return;
    }
    if (maxCommitment && numAmount > maxCommitment) {
      setMessage(`Maximum commitment is $${maxCommitment}`);
      return;
    }
    if (numAmount > walletBalance) {
      setMessage("Insufficient ledger balance. Deposit funds first.");
      return;
    }
    if (!user) {
      setMessage("Authenticate to commit capital");
      return;
    }
    if (user.kycTier === "visitor") {
      setMessage("Complete SIV/KYC verification to commit. Visitor tier cannot commit.");
      return;
    }

    setCommitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/pools/${poolId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Committed $${numAmount}. Your PAC: ${data.pacToken || "LED-XXXX-XXXX"}. Hall unlocked.`);
        setTimeout(() => router.push(`/pools/${poolId}`), 2000);
      } else {
        setMessage(data.error || "Commitment failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setCommitting(false);
    }
  }

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
          <p className="text-xs text-slate-600 mt-2">This asset does not exist in the registry.</p>
          <Link href="/pools" className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/30 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-all">
            <ArrowLeft className="h-3 w-3" /> Return to Pools
          </Link>
        </GlassCard>
      </div>
    );
  }

  const vertical = ALL_VERTICALS.find((v) => pool.verticalId?.includes(v.id)) || ALL_VERTICALS[0];
  const colors = COLOR_MAP[vertical.color] || COLOR_MAP.cyan;
  const timeLeft = new Date(pool.closesAt).getTime() - Date.now();
  const isExpired = timeLeft <= 0;
  const isFilled = pool.status === "forged" || pool.status === "active" || pool.status === "sold";

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-100">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn("absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-5", colors.bg)} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href={`/pools/${poolId}`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Pool Detail
          </Link>
        </motion.div>

        {/* Pool Identity Header */}
        <GlassCard accent={vertical.color} glow>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("h-12 w-12 rounded-xl border flex items-center justify-center", colors.bg, colors.border)}>
                <vertical.icon className={cn("h-6 w-6", colors.text)} />
              </div>
              <div>
                <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border", colors.bg, colors.text, colors.border)}>
                  <vertical.icon className="h-3 w-3" />
                  {vertical.name}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={pool.status} />
                  {pool.hallClass && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                      Class {pool.hallClass}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              {pool.name}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              {pool.description || "No description provided."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {pool.country}</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {participants}/{maxParticipants} Sovereigns</span>
              <span className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5" /> {timeLeft > 0 ? `${Math.ceil(timeLeft / 86400000)}D LEFT` : "CYCLE CLOSED"}</span>
            </div>
          </div>
        </GlassCard>

        {/* KYC Gate */}
        {user?.kycTier === "visitor" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard accent="rose">
              <div className="p-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">SIV Verification Required</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Visitor-tier accounts cannot commit to pools. Complete your Sovereign Identity Verification to upgrade to <span className="text-rose-400 font-semibold">sovereign</span> tier.
                  </p>
                  <Link href="/kyc">
                    <button className="mt-3 px-4 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-500/20 transition-all">
                      Complete SIV
                    </button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Commit Terminal */}
        <GlassCard accent="cyan" glow>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">Forge Terminal</span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Asset Value</p>
                <p className="text-sm font-bold font-mono text-cyan-400">
                  <AnimatedCounter value={assetValue} prefix="$" />
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Min Commit</p>
                <p className="text-sm font-bold font-mono text-white">${minCommitment}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Max Commit</p>
                <p className="text-sm font-bold font-mono text-white">${maxCommitment !== Infinity ? maxCommitment.toLocaleString() : "∞"}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/20">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Your Balance</p>
                <p className="text-sm font-bold font-mono text-emerald-400">
                  <AnimatedCounter value={walletBalance} prefix="$" />
                </p>
              </div>
            </div>

            {/* Participation meter */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-400">
                  PARTICIPATION
                </span>
                <span className="text-[10px] font-mono text-slate-600">
                  {participants} of {maxParticipants} sovereigns
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${maxParticipants > 0 ? (participants / maxParticipants) * 100 : 0}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400"
                />
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleCommit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={minCommitment}
                  max={maxCommitment !== Infinity ? maxCommitment : undefined}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 pl-8 pr-4 py-3 text-sm text-white font-mono outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-slate-700 transition-all"
                  placeholder={String(minCommitment)}
                />
              </div>

              <button
                type="submit"
                disabled={committing || !numAmount || numAmount < minCommitment || (maxCommitment && numAmount > maxCommitment) || numAmount > walletBalance || user?.kycTier === "visitor" || isFilled || isExpired}
                className={cn(
                  "w-full rounded-xl border py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
                  committing || !numAmount || numAmount < minCommitment || (maxCommitment && numAmount > maxCommitment) || numAmount > walletBalance || user?.kycTier === "visitor" || isFilled || isExpired
                    ? "border-slate-800 bg-slate-900/20 text-slate-600 cursor-not-allowed"
                    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                )}
              >
                {committing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    Forging Ownership...
                  </>
                ) : isFilled ? (
                  <>
                    <CircleCheck className="h-4 w-4" />
                    Pool Filled
                  </>
                ) : isExpired ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Pool Closed
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    Commit ${numAmount > 0 ? numAmount.toLocaleString() : "0"}
                  </>
                )}
              </button>
            </form>

            {message && (
              <div className={cn(
                "mt-4 rounded-xl p-3 text-xs border",
                message.includes("Committed") || message.includes("PAC")
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              )}>
                {message}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Ownership Preview — NO TARGET REFERENCE */}
        <AnimatePresence>
          {numAmount > 0 && !isFilled && !isExpired && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <GlassCard accent="emerald" glow>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">Ownership Preview</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                  </div>

                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Your <span className="text-emerald-300 font-semibold">${numAmount.toLocaleString()}</span> commitment 
                    converts to a <span className="text-emerald-300 font-semibold">Perpetual Asset Contract (PAC)</span> when the pool fills. 
                    Everyone who commits becomes a co-owner. No losers. No gambling.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileCheck className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] uppercase text-slate-600 font-bold tracking-wider">Your Ownership</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-300 font-mono">{ownershipPreview.ownershipPercent}%</p>
                      <p className="text-[9px] text-slate-600">PAC token issued on fill</p>
                    </div>
                    <div className="p-3 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Coins className="h-3 w-3 text-cyan-400" />
                        <span className="text-[10px] uppercase text-slate-600 font-bold tracking-wider">Est. Monthly Dividend</span>
                      </div>
                      <p className="text-lg font-bold text-cyan-300 font-mono">${ownershipPreview.estimatedDividendMonthly.toFixed(2)}</p>
                      <p className="text-[9px] text-slate-600">After 20% 8th Ledger tithe</p>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.04]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="h-3 w-3 text-amber-400" />
                        <span className="text-[10px] uppercase text-slate-600 font-bold tracking-wider">PIR Protection</span>
                      </div>
                      <p className="text-lg font-bold text-amber-300 font-mono">100%</p>
                      <p className="text-[9px] text-slate-600">Insurance + legal + maintenance</p>
                    </div>
                    <div className="p-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.04]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="h-3 w-3 text-violet-400" />
                        <span className="text-[10px] uppercase text-slate-600 font-bold tracking-wider">Hall Access</span>
                      </div>
                      <p className="text-lg font-bold text-violet-300 font-mono">Immediate</p>
                      <p className="text-[9px] text-slate-600">On pool fill → Ghost Hall unlocks</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PAC Info */}
        <GlassCard accent="emerald">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Perpetual Asset Contract (PAC)</h3>
                <p className="text-[10px] text-slate-500">Legally binding • SPV-registered • Insured by the 8th Ledger</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upon commitment, your capital is held in escrow. When the pool fills, your commitment converts to a 
              <span className="text-emerald-300 font-semibold"> PAC</span> — a legal ownership percentage of the asset. 
              The PAC is stored in your Vault, transferable on the 8th Ledger Exchange, and earns monthly dividends forever.
            </p>
          </div>
        </GlassCard>

        {/* PIR Breakdown */}
        <GlassCard accent="cyan">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">Protocol Infrastructure Reserve</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">The PIR protects your asset across six pillars:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "The Shield", pct: "25%", desc: "Insurance & Legal", color: "emerald", icon: Shield },
                { label: "The Seal", pct: "20%", desc: "SPV & Compliance", color: "cyan", icon: LockKeyhole },
                { label: "The Forge", pct: "20%", desc: "Maintenance & Ops", color: "amber", icon: Flame },
                { label: "The Spire", pct: "15%", desc: "Management", color: "violet", icon: Target },
                { label: "The Vanguard", pct: "12%", desc: "R&D & Growth", color: "rose", icon: Orbit },
                { label: "The Sanctuary", pct: "8%", desc: "Emergency Reserve", color: "indigo", icon: Diamond },
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
                      "relative overflow-hidden rounded-xl border p-3 text-center transition-all duration-300 hover:scale-105",
                      c.border, "bg-slate-900/20"
                    )}
                  >
                    <div className={cn("absolute inset-0 opacity-5", c.bg)} />
                    <Icon className={cn("h-4 w-4 mx-auto mb-1.5", c.text)} />
                    <p className="text-sm font-bold font-mono text-white">{a.pct}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{a.label}</p>
                    <p className="text-[9px] text-slate-600">{a.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Warning */}
        <GlassCard accent="amber">
          <div className="p-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Commitments are deducted from your ledger balance and held in escrow until the pool fills. 
                If the pool does not reach capacity by the close date, all commitments are returned in full. 
                Once forged, ownership is perpetual and dividends begin automatically.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}