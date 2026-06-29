// app/(dashboard)/leaderboards/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
   Crown, Medal, Star, Target, Zap, BarChart3, Award, Hash
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
interface Leader {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  kycTier: string;
  value: number;
  secondary?: number;
  tertiary?: number;
  label: string;
  sublabel?: string;
}

/* ============================================================
   MOCK DATA
   ============================================================ */
const CAPITAL: Leader[] = [
  { rank: 1, ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "East Asia", kycTier: "whale", value: 350000, secondary: 42000, tertiary: 6, label: "USD Committed", sublabel: "Dividends" },
  { rank: 2, ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "East Asia", kycTier: "whale", value: 240000, secondary: 28500, tertiary: 5, label: "USD Committed", sublabel: "Dividends" },
  { rank: 3, ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "East Africa", kycTier: "sovereign", value: 85000, secondary: 12000, tertiary: 3, label: "USD Committed", sublabel: "Dividends" },
  { rank: 4, ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "North America", kycTier: "sovereign", value: 62000, secondary: 8900, tertiary: 2, label: "USD Committed", sublabel: "Dividends" },
  { rank: 5, ledgerId: "LED-1P4Q-8L3N", displayName: "Sarah", country: "Western Europe", kycTier: "verified", value: 32000, secondary: 4100, tertiary: 1, label: "USD Committed", sublabel: "Dividends" },
  { rank: 6, ledgerId: "LED-2V8W-1X4Y", displayName: "Maria", country: "South America", kycTier: "verified", value: 18000, secondary: 2200, tertiary: 1, label: "USD Committed", sublabel: "Dividends" },
];

const MERIT: Leader[] = [
  { rank: 1, ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "East Asia", kycTier: "whale", value: 9870, secondary: 3500, label: "Merit Score", sublabel: "Ownership" },
  { rank: 2, ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "East Asia", kycTier: "whale", value: 8450, secondary: 2400, label: "Merit Score", sublabel: "Ownership" },
  { rank: 3, ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "East Africa", kycTier: "sovereign", value: 7230, secondary: 1800, label: "Merit Score", sublabel: "Ownership" },
  { rank: 4, ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "North America", kycTier: "sovereign", value: 6100, secondary: 1200, label: "Merit Score", sublabel: "Ownership" },
  { rank: 5, ledgerId: "LED-8X2P-9LQ3", displayName: "The Architect", country: "East Africa", kycTier: "whale", value: 5400, secondary: 900, label: "Merit Score", sublabel: "Ownership" },
];

const REVIEWERS: Leader[] = [
  { rank: 1, ledgerId: "LED-1P4Q-8L3N", displayName: "Sarah", country: "Western Europe", kycTier: "verified", value: 47, secondary: 4.8, label: "Reviews", sublabel: "Avg Rating" },
  { rank: 2, ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "East Africa", kycTier: "sovereign", value: 38, secondary: 4.6, label: "Reviews", sublabel: "Avg Rating" },
  { rank: 3, ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "East Asia", kycTier: "whale", value: 31, secondary: 4.9, label: "Reviews", sublabel: "Avg Rating" },
  { rank: 4, ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "East Asia", kycTier: "whale", value: 25, secondary: 4.4, label: "Reviews", sublabel: "Avg Rating" },
  { rank: 5, ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "North America", kycTier: "sovereign", value: 19, secondary: 4.7, label: "Reviews", sublabel: "Avg Rating" },
];

const ORACLES: Leader[] = [
  { rank: 1, ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "East Asia", kycTier: "whale", value: 82.1, secondary: 23, tertiary: 7, label: "Accuracy %", sublabel: "Correct" },
  { rank: 2, ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "East Asia", kycTier: "whale", value: 76.0, secondary: 19, tertiary: 4, label: "Accuracy %", sublabel: "Correct" },
  { rank: 3, ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "East Africa", kycTier: "sovereign", value: 70.8, secondary: 17, tertiary: 3, label: "Accuracy %", sublabel: "Correct" },
  { rank: 4, ledgerId: "LED-1P4Q-8L3N", displayName: "Sarah", country: "Western Europe", kycTier: "verified", value: 63.6, secondary: 14, tertiary: 2, label: "Accuracy %", sublabel: "Correct" },
  { rank: 5, ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "North America", kycTier: "sovereign", value: 60.0, secondary: 12, tertiary: 1, label: "Accuracy %", sublabel: "Correct" },
];

/* ============================================================
   UTILS
   ============================================================ */
const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const kycColor = (t: string) => {
  if (t === "whale") return "text-amber-400";
  if (t === "sovereign") return "text-cyan-400";
  if (t === "verified") return "text-emerald-400";
  return "text-slate-500";
};

const kycLabel = (t: string) => {
  if (t === "whale") return "ELITE";
  if (t === "sovereign") return "SOVEREIGN";
  if (t === "verified") return "VERIFIED";
  return "VISITOR";
};

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/** Minimal rank indicator */
function Rank({ n }: { n: number }) {
  if (n === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (n === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (n === 3) return <Award className="h-5 w-5 text-orange-400" />;
  return <span className="text-xs font-mono text-white/20 w-5 text-center">{n}</span>;
}

/** A single board */
function Board({
  title,
  icon: Icon,
  accent,
  data,
  isPercent,
}: {
  title: string;
  icon: React.ElementType;
  accent: "cyan" | "amber" | "violet" | "emerald";
  data: Leader[];
  isPercent?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? data : data.slice(0, 5);

  const border = {
    cyan: "border-cyan-500/20 hover:border-cyan-500/40",
    amber: "border-amber-500/20 hover:border-amber-500/40",
    violet: "border-violet-500/20 hover:border-violet-500/40",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
  }[accent];

  const text = {
    cyan: "text-cyan-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
  }[accent];

  const glow = {
    cyan: "shadow-[0_0_30px_rgba(6,182,212,0.08)]",
    amber: "shadow-[0_0_30px_rgba(251,191,36,0.08)]",
    violet: "shadow-[0_0_30px_rgba(139,92,246,0.08)]",
    emerald: "shadow-[0_0_30px_rgba(16,185,129,0.08)]",
  }[accent];

  return (
    <div className={`rounded-xl border bg-[#08080f] ${border} ${glow} transition-colors duration-500`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <Icon className={`h-4 w-4 ${text}`} />
        <h2 className="text-sm font-bold tracking-wider text-white uppercase">{title}</h2>
        <span className="ml-auto text-[10px] font-mono text-white/20">{data.length} ENTRIES</span>
      </div>

      {/* Top 3 — Big Display */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5">
        {data.slice(0, 3).map((leader) => (
          <div key={leader.rank} className="bg-[#08080f] p-4 text-center group cursor-default">
            <div className="flex justify-center mb-2">
              {leader.rank === 1 && <Crown className="h-6 w-6 text-amber-400" />}
              {leader.rank === 2 && <Medal className="h-6 w-6 text-slate-300" />}
              {leader.rank === 3 && <Award className="h-6 w-6 text-orange-400" />}
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{leader.displayName}</p>
            <p className={`text-2xl font-bold font-mono ${text} tracking-tight`}>
              {isPercent ? `${leader.value}%` : leader.value >= 1000 ? formatUSD(leader.value) : leader.value}
            </p>
            <p className="text-[10px] text-white/20 mt-0.5">{leader.country}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-white/5">
        {shown.slice(3).map((leader, i) => (
          <motion.div
            key={leader.rank}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <Rank n={leader.rank} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{leader.displayName}</span>
                <span className={`text-[9px] font-mono ${kycColor(leader.kycTier)}`}>{kycLabel(leader.kycTier)}</span>
              </div>
              <p className="text-[10px] text-white/20 font-mono">{leader.country} • {leader.ledgerId}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-mono font-bold ${text}`}>
                {isPercent ? `${leader.value}%` : leader.value >= 1000 ? formatUSD(leader.value) : leader.value}
              </p>
              {leader.secondary !== undefined && (
                <p className="text-[10px] text-white/20 font-mono">
                  {leader.sublabel}: {leader.secondary >= 1000 ? formatUSD(leader.secondary) : leader.secondary}
                  {leader.tertiary !== undefined && ` • ${leader.tertiary}`}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expand */}
      {data.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/40 hover:bg-white/[0.02] transition-all border-t border-white/5"
        >
          {expanded ? "Collapse" : `View All ${data.length}`}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function LeaderboardsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#030308] text-white selection:bg-cyan-500/30">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400">
              8th Ledger Command
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Leaderboards</h1>
          <p className="text-sm text-white/30 max-w-md">
            Sovereigns ranked by capital deployed, merit earned, foresight accuracy, and community contribution.
          </p>
        </motion.div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={mounted ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}>
            <Board title="Capital Deployed" icon={Zap} accent="cyan" data={CAPITAL} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={mounted ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}>
            <Board title="Quantum Merit" icon={BarChart3} accent="violet" data={MERIT} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={mounted ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}>
            <Board title="Top Reviewers" icon={Star} accent="amber" data={REVIEWERS} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={mounted ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
            <Board title="Oracle Masters" icon={Target} accent="emerald" data={ORACLES} isPercent />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-10 flex items-center justify-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-widest"
        >
          <Hash className="h-3 w-3" />
          <span>All rankings secured by the 8th Ledger Protocol • Immutable • Live</span>
        </motion.div>
      </div>
    </div>
  );
}