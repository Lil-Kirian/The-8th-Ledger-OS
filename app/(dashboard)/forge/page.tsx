// app/(dashboard)/forge/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Crown, Shield, ShieldCheck, ShieldAlert, Zap, Eye, TrendingUp, Landmark, Globe,
  Hexagon, Activity, ChevronRight, Lock, Unlock, Flame,
  Sparkles, Vote, Trophy, Radio, Fingerprint, CircleDollarSign,
  Target, FileCheck, AlertTriangle, Diamond, BadgeCheck, UserX, Crown as CrownIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";

/* ============================================================
   TYPES — Aligned to 8th Ledger Schema
   ============================================================ */
interface HallOwnership {
  id: string;
  hallName: string;
  vertical: string;
  ownershipPercent: number;
  accumulatedDividends: number;
  amountCommitted: number;
  sriScore: number;
  ahgiScore: number;
  hallClass: string;
  status: "active" | "warning" | "critical";
}

interface OracleStanding {
  tier: "novice" | "seer" | "oracle" | "prophet";
  totalPoints: number;
  correctCount: number;
  totalPredictions: number;
  streak: number;
  nextTierProgress: number;
}

interface SovereignProfile {
  ledgerId: string;
  displayName: string;
  kycTier: string;
  avatar?: string;
  walletBalance: number;
  totalCommitted: number;
  totalDividendsEarned: number;
  activeHalls: number;
  totalGovernanceWeight: number;
  proposalsVoted: number;
  oracle: OracleStanding;
  recentDividends: { date: string; amount: number; hallName: string }[];
  halls: HallOwnership[];
}

/* ============================================================
   MOCK DATA — Replace with API call to /api/forge or /api/user
   ============================================================ */
const MOCK_DATA: SovereignProfile = {
  ledgerId: "LED-8X2P-9LQ3",
  displayName: "The Architect",
  kycTier: "verified",
  avatar: undefined,
  walletBalance: 48250,
  totalCommitted: 127500,
  totalDividendsEarned: 18420,
  activeHalls: 4,
  totalGovernanceWeight: 12.4,
  proposalsVoted: 23,
  oracle: {
    tier: "oracle",
    totalPoints: 847,
    correctCount: 63,
    totalPredictions: 89,
    streak: 7,
    nextTierProgress: 72,
  },
  recentDividends: [
    { date: "2026-06-23", amount: 340, hallName: "Nairobi Solar Farm" },
    { date: "2026-06-23", amount: 125, hallName: "Kigali Biz Hub" },
    { date: "2026-06-22", amount: 890, hallName: "Lagos LedgerProp" },
    { date: "2026-06-21", amount: 210, hallName: "Nairobi Solar Farm" },
    { date: "2026-06-20", amount: 445, hallName: "Accra Travel Fleet" },
  ],
  halls: [
    { id: "1", hallName: "Nairobi Solar Farm", vertical: "LedgerEnergy", ownershipPercent: 5.0, accumulatedDividends: 4200, amountCommitted: 25000, sriScore: 87, ahgiScore: 72, hallClass: "I", status: "active" },
    { id: "2", hallName: "Kigali Biz Hub", vertical: "LedgerBiz", ownershipPercent: 2.5, accumulatedDividends: 1800, amountCommitted: 15000, sriScore: 74, ahgiScore: 68, hallClass: "III", status: "active" },
    { id: "3", hallName: "Lagos LedgerProp", vertical: "LedgerProp", ownershipPercent: 8.0, accumulatedDividends: 8900, amountCommitted: 60000, sriScore: 91, ahgiScore: 85, hallClass: "I", status: "active" },
    { id: "4", hallName: "Accra Travel Fleet", vertical: "LedgerTravel", ownershipPercent: 1.2, accumulatedDividends: 3520, amountCommitted: 27500, sriScore: 45, ahgiScore: 38, hallClass: "II", status: "warning" },
  ],
};

/* ============================================================
   UTILITY
   ============================================================ */
const verticalMeta: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  LedgerProp: { icon: Landmark, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-600/5" },
  LedgerAuto: { icon: Activity, color: "text-sky-400", bg: "from-sky-500/10 to-sky-600/5" },
  LedgerTech: { icon: Zap, color: "text-violet-400", bg: "from-violet-500/10 to-violet-600/5" },
  LedgerEdu: { icon: Shield, color: "text-amber-400", bg: "from-amber-500/10 to-amber-600/5" },
  LedgerHealth: { icon: Activity, color: "text-rose-400", bg: "from-rose-500/10 to-rose-600/5" },
  LedgerAccess: { icon: Radio, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-600/5" },
  LedgerBiz: { icon: TrendingUp, color: "text-orange-400", bg: "from-orange-500/10 to-orange-600/5" },
  LedgerTravel: { icon: Globe, color: "text-blue-400", bg: "from-blue-500/10 to-blue-600/5" },
  LedgerAgri: { icon: Hexagon, color: "text-lime-400", bg: "from-lime-500/10 to-lime-600/5" },
  LedgerEnergy: { icon: Zap, color: "text-yellow-400", bg: "from-yellow-500/10 to-yellow-600/5" },
  SportLedger: { icon: Trophy, color: "text-purple-400", bg: "from-purple-500/10 to-purple-600/5" },
};

/* ============================================================
   KYC TIER CONFIG — Universal Identity Clearance System
   ============================================================ */
interface KycTierConfig {
  level: number;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  description: string;
  canAccess: string[];
}

const KYC_TIERS: Record<string, KycTierConfig> = {
  visitor: {
    level: 0,
    label: "VISITOR",
    subtitle: "Browse Only",
    icon: UserX,
    color: "text-slate-400",
    borderColor: "border-slate-500/30",
    bgColor: "bg-slate-500/10",
    glowColor: "shadow-slate-500/5",
    description: "You can view pools and explore the Agora. Verify your identity to commit capital and own assets.",
    canAccess: ["View pools", "Agora (read-only)", "Oracle forecasts"],
  },
  verified: {
    level: 1,
    label: "VERIFIED",
    subtitle: "Sovereign Owner",
    icon: ShieldCheck,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
    glowColor: "shadow-emerald-500/10",
    description: "Identity confirmed. You can commit capital, own PACs, vote in halls, and earn dividends.",
    canAccess: ["Pool commitment", "PAC ownership", "Hall voting", "Dividend collection", "Marketplace"],
  },
  sovereign: {
    level: 2,
    label: "SOVEREIGN",
    subtitle: "Full Access",
    icon: BadgeCheck,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/40",
    bgColor: "bg-cyan-500/10",
    glowColor: "shadow-cyan-500/10",
    description: "Enhanced verification complete. Higher commitment limits, priority pool access, and reduced marketplace fees.",
    canAccess: ["All Verified perks", "$50K+ pools", "Priority filling", "Reduced fees (0.5%)", "Early previews"],
  },
  whale: {
    level: 3,
    label: "COUNCIL ELITE",
    subtitle: "Institutional Grade",
    icon: CrownIcon,
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    glowColor: "shadow-amber-500/10",
    description: "Maximum clearance. Unlimited pool access, custom deals, direct Council liaison, and protocol revenue share eligibility.",
    canAccess: ["All Sovereign perks", "Unlimited commitment", "Custom pool creation", "Council liaison", "Protocol revenue share"],
  },
};

function getKycConfig(tier: string): KycTierConfig {
  return KYC_TIERS[tier] || KYC_TIERS.visitor;
}

function oracleBadge(tier: string) {
  switch (tier) {
    case "prophet": return { icon: Crown, color: "text-amber-300", label: "PROPHET" };
    case "oracle": return { icon: Eye, color: "text-cyan-300", label: "ORACLE" };
    case "seer": return { icon: Sparkles, color: "text-violet-300", label: "SEER" };
    default: return { icon: Target, color: "text-white/30", label: "NOVICE" };
  }
}

function sriColor(score: number) {
  if (score >= 90) return "text-amber-300";
  if (score >= 75) return "text-emerald-300";
  if (score >= 60) return "text-cyan-300";
  if (score >= 40) return "text-orange-300";
  return "text-rose-400";
}

function ahgiStatus(score: number) {
  if (score >= 80) return { label: "THRIVING", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (score >= 60) return { label: "HEALTHY", color: "text-cyan-400", bg: "bg-cyan-500/10" };
  if (score >= 40) return { label: "STAGNANT", color: "text-orange-400", bg: "bg-orange-500/10" };
  if (score >= 20) return { label: "DECLINING", color: "text-rose-400", bg: "bg-rose-500/10" };
  return { label: "CRITICAL", color: "text-red-500", bg: "bg-red-500/10" };
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/** Animated background particles */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
    let anim: number;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${p.alpha})`;
        ctx.fill();
      });
      anim = requestAnimationFrame(draw);
    }
    draw();
    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    return () => { cancelAnimationFrame(anim); window.removeEventListener("resize", handleResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
}

/** Universal Identity Clearance Badge — IMPOSSIBLE to misunderstand */
function IdentityClearanceBadge({ tier }: { tier: string }) {
  const config = getKycConfig(tier);
  const Icon = config.icon;
  const isVerified = config.level >= 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`relative overflow-hidden rounded-xl border ${config.borderColor} ${config.bgColor} p-4 ${config.glowColor} shadow-lg`}
    >
      {/* Corner rank indicator */}
      <div className="absolute top-0 right-0 px-2 py-1 rounded-bl-lg bg-white/5 border-b border-l border-white/10">
        <span className={`text-[9px] font-bold tracking-widest ${config.color}`}>CLEARANCE LVL {config.level}</span>
      </div>

      <div className="flex items-start gap-4">
        {/* Large icon seal */}
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${config.borderColor} ${config.bgColor}`}>
          <Icon className={`h-7 w-7 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-sm font-bold tracking-wide ${config.color}`}>
              {config.label}
            </h3>
            {isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <BadgeCheck className={`h-4 w-4 ${config.color}`} />
              </motion.div>
            )}
          </div>
          <p className="text-xs text-white/50 font-medium mb-2">{config.subtitle}</p>
          <p className="text-[11px] text-white/30 leading-relaxed">{config.description}</p>
        </div>
      </div>

      {/* Access list */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Your Access</p>
        <div className="flex flex-wrap gap-2">
          {config.canAccess.map((access, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-md border ${config.borderColor} ${config.bgColor} px-2 py-1 text-[10px] ${config.color}`}
            >
              {isVerified ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              {access}
            </span>
          ))}
        </div>
      </div>

      {/* Upgrade prompt for non-verified */}
      {config.level === 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 p-2.5">
          <ShieldAlert className="h-4 w-4 text-orange-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-white/60 font-medium">Verify to unlock ownership</p>
            <p className="text-[10px] text-white/30">Complete KYC to commit capital and earn</p>
          </div>
          <button className="ml-auto shrink-0 rounded-md bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-[10px] font-bold text-white transition-colors">
            VERIFY
          </button>
        </div>
      )}
    </motion.div>
  );
}

/** Holographic Identity Card — REDESIGNED */
function IdentityCard({ data }: { data: SovereignProfile }) {
  const orb = oracleBadge(data.oracle.tier);
  const OrbIcon = orb.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08080f]/80 backdrop-blur-xl p-6 sm:p-8"
    >
      {/* Scanning line animation */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <motion.div
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
        />
      </div>

      <div className="relative flex flex-col gap-6">
        {/* Top row: Avatar + Name + Oracle */}
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar / Identity Seal */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/10 border border-cyan-500/20 flex items-center justify-center">
              {data.avatar ? (
                <img src={data.avatar} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Fingerprint className="h-9 w-9 text-cyan-400" />
              )}
            </div>
            {/* Online status pulse */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#08080f] border border-emerald-500/30 flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Name & ID */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">{data.displayName}</h2>
              <div className={`flex items-center gap-1.5 rounded-full border ${orb.color.replace("text-", "border-").replace("300", "500/30")} bg-white/5 px-2.5 py-1`}>
                <OrbIcon className={`h-3 w-3 ${orb.color}`} />
                <span className={`text-[10px] font-bold tracking-wider ${orb.color}`}>{orb.label}</span>
              </div>
            </div>
            <p className="font-mono text-xs text-white/30 mb-4">{data.ledgerId}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricPill label="Capital Committed" value={formatCurrency(data.totalCommitted)} accent="cyan" />
              <MetricPill label="Dividends Earned" value={formatCurrency(data.totalDividendsEarned)} accent="amber" />
              <MetricPill label="Governance Weight" value={`${data.totalGovernanceWeight}%`} accent="violet" />
              <MetricPill label="Active Halls" value={data.activeHalls.toString()} accent="emerald" />
            </div>
          </div>
        </div>

        {/* Bottom row: The Clearance Badge — PROMINENT */}
        <IdentityClearanceBadge tier={data.kycTier} />
      </div>
    </motion.div>
  );
}

function MetricPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  const border = accent === "cyan" ? "border-cyan-500/20" : accent === "amber" ? "border-amber-500/20" : accent === "violet" ? "border-violet-500/20" : "border-emerald-500/20";
  const text = accent === "cyan" ? "text-cyan-300" : accent === "amber" ? "text-amber-300" : accent === "violet" ? "text-violet-300" : "text-emerald-300";
  return (
    <div className={`rounded-lg border ${border} bg-white/[0.02] px-3 py-2.5`}>
      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${text}`}>{value}</p>
    </div>
  );
}

/** Power Gauge — Capital Deployment */
function PowerGauge({ committed, target }: { committed: number; target: number }) {
  const progress = Math.min((committed / target) * 100, 100);
  const springProgress = useSpring(progress, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08080f]/80 backdrop-blur-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Capital Deployment</h3>
        </div>
        <span className="text-xs text-white/30">Next Milestone: {formatCurrency(target)}</span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5 mb-3">
        <motion.div
          style={{ width: springProgress.get() + "%" }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-amber-400"
        />
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white">{formatCurrency(committed)}</p>
          <p className="text-[10px] text-white/30 mt-0.5">Deployed across {MOCK_DATA.activeHalls} halls</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-cyan-300">{progress.toFixed(1)}%</p>
          <p className="text-[10px] text-white/30">of {formatCurrency(target)} target</p>
        </div>
      </div>
    </motion.div>
  );
}

/** Oracle Standing Panel */
function OraclePanel({ oracle }: { oracle: OracleStanding }) {
  const orb = oracleBadge(oracle.tier);
  const OrbIcon = orb.icon;
  const accuracy = oracle.totalPredictions > 0 ? Math.round((oracle.correctCount / oracle.totalPredictions) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08080f]/80 backdrop-blur-xl p-6"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Eye className="h-24 w-24 text-cyan-400" />
      </div>

      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <OrbIcon className={`h-5 w-5 ${orb.color}`} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Oracle Standing</h3>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">{orb.label} • {oracle.totalPoints} PTS</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{accuracy}%</p>
          <p className="text-[10px] text-white/30">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-cyan-300">{oracle.correctCount}</p>
          <p className="text-[10px] text-white/30">Correct</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-300">{oracle.streak}</p>
          <p className="text-[10px] text-white/30">Streak</p>
        </div>
      </div>

      {oracle.tier !== "prophet" && (
        <div>
          <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
            <span>Progress to {oracle.tier === "oracle" ? "Prophet" : oracle.tier === "seer" ? "Oracle" : "Seer"}</span>
            <span>{oracle.nextTierProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${oracle.nextTierProgress}%` }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-amber-400"
            />
          </div>
        </div>
      )}

      {oracle.tier === "prophet" && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <Crown className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-xs font-semibold text-amber-300">Maximum Foresight Achieved</span>
        </div>
      )}
    </motion.div>
  );
}

/** Hall Constellation Grid */
function HallConstellation({ halls }: { halls: HallOwnership[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="rounded-2xl border border-white/10 bg-[#08080f]/80 backdrop-blur-xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Sovereign Holdings</h3>
        </div>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{halls.length} Active Halls</span>
      </div>

      <div className="space-y-3">
        {halls.map((hall, i) => {
          const meta = verticalMeta[hall.vertical] || { icon: Hexagon, color: "text-white", bg: "from-white/10 to-white/5" };
          const Icon = meta.icon;
          const sriC = sriColor(hall.sriScore);
          const ahgi = ahgiStatus(hall.ahgiScore);

          return (
            <motion.div
              key={hall.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.bg} border border-white/5`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-medium text-white truncate">{hall.hallName}</h4>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/30">Class {hall.hallClass}</span>
                    {hall.status === "warning" && <AlertTriangle className="h-3 w-3 text-orange-400" />}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    <span>{hall.vertical}</span>
                    <span>•</span>
                    <span>{hall.ownershipPercent}% owned</span>
                    <span>•</span>
                    <span>{formatCurrency(hall.amountCommitted)} committed</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-right">
                  <div>
                    <p className={`text-xs font-bold ${sriC}`}>{hall.sriScore}</p>
                    <p className="text-[9px] text-white/20">SRI</p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${ahgi.color}`}>{hall.ahgiScore}</p>
                    <p className="text-[9px] text-white/20">AHGI</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">{formatCurrency(hall.accumulatedDividends)}</p>
                    <p className="text-[9px] text-white/20">Dividends</p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-white/30 transition-colors" />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-amber-400"
                    style={{ width: `${Math.min(hall.ownershipPercent * 10, 100)}%` }}
                  />
                </div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${ahgi.bg} ${ahgi.color}`}>
                  {ahgi.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/** Dividend Stream — The Flow */
function DividendStream({ dividends }: { dividends: SovereignProfile["recentDividends"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="rounded-2xl border border-white/10 bg-[#08080f]/80 backdrop-blur-xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Dividend Stream</h3>
        </div>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">Last 5 Distributions</span>
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-2 bottom-2 w-[1px] bg-gradient-to-b from-amber-500/30 via-cyan-500/20 to-transparent" />

        <div className="space-y-4">
          {dividends.map((div, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="relative flex items-center gap-4 pl-1"
            >
              <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/20 bg-[#08080f]">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60 truncate">{div.hallName}</p>
                  <p className="text-xs font-bold text-amber-300">+{formatCurrency(div.amount)}</p>
                </div>
                <p className="text-[10px] text-white/20">{new Date(div.date).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** Governance Activity */
function GovernanceCard({ proposalsVoted, weight }: { proposalsVoted: number; weight: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08080f]/80 backdrop-blur-xl p-6"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Vote className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Governance Power</h3>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Capital-Weighted Voting</p>
        </div>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-3xl font-bold text-white">{proposalsVoted}</p>
          <p className="text-[10px] text-white/30">Proposals Voted</p>
        </div>
        <div className="h-8 w-[1px] bg-white/10" />
        <div>
          <p className="text-3xl font-bold text-violet-300">{weight}%</p>
          <p className="text-[10px] text-white/30">Total Weight</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Recent Vote</span>
        </div>
        <p className="text-xs text-white/60">"Approve Roof Repair — $4,200 PIR Advance"</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">YES 73%</span>
          <span className="text-[9px] text-white/20">Hall #2847 • 2 days ago</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function ForgePage() {
  const { user } = useAuth();
  const [data] = useState<SovereignProfile>(MOCK_DATA);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const headerY = useTransform(scrollYProgress, [0, 0.05], [0, -20]);

  return (
    <div className="relative min-h-screen bg-[#030308] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      <ParticleField />

      <div className="fixed top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 pb-20">
        <motion.div
          style={{ opacity: headerOpacity, y: headerY }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-cyan-500/20 bg-cyan-500/10">
              <Diamond className="h-3 w-3 text-cyan-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Sovereign Command
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            The Forge
          </h1>
          <p className="mt-1 text-sm text-white/30 max-w-lg">
            Your capital, your governance, your power across the 8th Ledger.
            Real assets. Real dividends. Real ownership.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3 mb-4">
          <div className="lg:col-span-2">
            <IdentityCard data={data} />
          </div>
          <PowerGauge committed={data.totalCommitted} target={250000} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3 mb-4">
          <GovernanceCard proposalsVoted={data.proposalsVoted} weight={data.totalGovernanceWeight} />
          <OraclePanel oracle={data.oracle} />
          <DividendStream dividends={data.recentDividends} />
        </div>

        <HallConstellation halls={data.halls} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex items-center justify-center gap-2 text-[10px] text-white/20 uppercase tracking-wider"
        >
          <Lock className="h-3 w-3" />
          <span>All data secured by the 8th Ledger Protocol • Encrypted • Immutable</span>
        </motion.div>
      </div>
    </div>
  );
}