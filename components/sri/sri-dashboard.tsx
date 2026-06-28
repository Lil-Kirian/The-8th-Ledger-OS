"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Crown,
  AlertTriangle,
  TrendingUp,
  Users,
  Vote,
  Clock,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SriSnapshot {
  score: number;
  governanceActivity: number;
  revenueConsistency: number;
  dividendReliability: number;
  proposalQuality: number;
  dormancyRate: number;
  marketplaceVelocity: number;
  recordedAt: string;
}

interface SRIData {
  hallId: string;
  hallName: string;
  vertical: string;
  current: SriSnapshot;
  history: { month: string; score: number }[];
}

const TIER_CONFIG = {
  PLATINUM: {
    label: "PLATINUM",
    emoji: "👑",
    color: "text-amber-300",
    bg: "bg-amber-950/30",
    border: "border-amber-500/50",
    glow: "shadow-amber-500/20",
    effect: "Early access to pools, 0.25% marketplace fees, featured in Agora",
    min: 90,
  },
  GOLD: {
    label: "GOLD",
    emoji: "🥇",
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    glow: "shadow-amber-900/20",
    effect: "0.5% marketplace fees, priority support",
    min: 75,
  },
  SILVER: {
    label: "SILVER",
    emoji: "🥈",
    color: "text-slate-300",
    bg: "bg-slate-800/50",
    border: "border-slate-700",
    glow: "",
    effect: "Standard operation",
    min: 60,
  },
  BRONZE: {
    label: "BRONZE",
    emoji: "🥉",
    color: "text-amber-700",
    bg: "bg-amber-950/10",
    border: "border-amber-900/30",
    glow: "",
    effect: "Restricted: cannot propose new hires, only maintenance votes",
    min: 40,
  },
  AT_RISK: {
    label: "AT RISK",
    emoji: "⚠️",
    color: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    glow: "shadow-red-900/20",
    effect: "8th Ledger oversight mode. Dividends paused until reforms complete.",
    min: 0,
  },
};

const COMPONENT_META: Record<
  string,
  { label: string; icon: React.ReactNode; weight: number }
> = {
  governanceActivity: {
    label: "Governance Activity",
    icon: <Vote className="w-4 h-4" />,
    weight: 25,
  },
  revenueConsistency: {
    label: "Revenue Consistency",
    icon: <TrendingUp className="w-4 h-4" />,
    weight: 25,
  },
  dividendReliability: {
    label: "Dividend Reliability",
    icon: <Clock className="w-4 h-4" />,
    weight: 20,
  },
  proposalQuality: {
    label: "Proposal Quality",
    icon: <Activity className="w-4 h-4" />,
    weight: 15,
  },
  dormancyRate: {
    label: "Dormancy Rate",
    icon: <Users className="w-4 h-4" />,
    weight: 10,
  },
  marketplaceVelocity: {
    label: "Marketplace Velocity",
    icon: <ArrowUpRight className="w-4 h-4" />,
    weight: 5,
  },
};

function getTier(score: number): keyof typeof TIER_CONFIG {
  if (score >= 90) return "PLATINUM";
  if (score >= 75) return "GOLD";
  if (score >= 60) return "SILVER";
  if (score >= 40) return "BRONZE";
  return "AT_RISK";
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-slate-400";
  return "text-red-400";
}

function getScoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 40) return "bg-slate-500";
  return "bg-red-500";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

export default function SRIDashboard({ hallId }: { hallId: string }) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<SRIData>(`/api/sri/hall/${hallId}`, fetcher, {
    refreshInterval: 30000,
  });

  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/sri/hall/${hallId}`, { method: "POST" });
      if (res.ok) await mutate();
    } finally {
      setRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Failed to load SRI data
      </div>
    );
  }

  const tierKey = getTier(data.current.score);
  const tier = TIER_CONFIG[tierKey];
  const components = data.current;
  const componentScores = [
    components.governanceActivity,
    components.revenueConsistency,
    components.dividendReliability,
    components.proposalQuality,
    components.dormancyRate,
    components.marketplaceVelocity,
  ];
  const minScore = Math.min(...componentScores);
  const maxScore = Math.max(...componentScores);

  return (
    <div className="space-y-6">
      {/* Hero Score */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative p-8 rounded-2xl border ${tier.border} ${tier.bg} overflow-hidden ${tier.glow}`}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className="text-3xl">{tier.emoji}</span>
              <span
                className={`text-xs font-bold uppercase tracking-[0.2em] ${tier.color}`}
              >
                {tier.label}
              </span>
            </div>
            <h2 className={`text-6xl md:text-7xl font-black ${tier.color}`}>
              {data.current.score}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Sovereign Reputation Index
            </p>
          </div>

          <div className="text-center md:text-right space-y-2">
            <p className={`text-sm font-medium ${tier.color}`}>{tier.effect}</p>
            <p className="text-xs text-slate-500">
              Hall #{data.hallId} — {data.hallName}
            </p>
            <p className="text-xs text-slate-600">{data.vertical}</p>
            <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-slate-600">
              <Calendar className="w-3 h-3" />
              Last updated: {new Date(data.current.recordedAt).toLocaleDateString()}
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 rounded-lg hover:bg-cyan-900/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Recalculating..." : "Recalculate"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(COMPONENT_META).map(([key, meta], i) => {
          const score = (components as any)[key] as number;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-400">
                  {meta.icon}
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {meta.label}
                  </span>
                </div>
                <span className="text-xs text-slate-600">{meta.weight}%</span>
              </div>

              <div className="flex items-end justify-between mb-2">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-xs text-slate-500">/100</span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  className={`h-full rounded-full ${getScoreBarColor(score)}`}
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-600">
                  {getScoreLabel(score)}
                </span>
                {score === maxScore && score >= 80 && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Best
                  </span>
                )}
                {score === minScore && score < 60 && (
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    Needs Work
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* History Chart */}
      {data.history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden p-5"
        >
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            SRI History
          </h3>

          <div className="flex items-end gap-2 h-40">
            {data.history.map((h, i) => {
              const height = (h.score / 100) * 100;
              return (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.8, delay: 0.6 + i * 0.05 }}
                    className={`w-full rounded-t-md ${
                      h.score >= 80
                        ? "bg-emerald-500/60"
                        : h.score >= 60
                        ? "bg-amber-500/60"
                        : h.score >= 40
                        ? "bg-slate-500/60"
                        : "bg-red-500/60"
                    }`}
                  />
                  <span className="text-[10px] text-slate-600">{h.month}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tier Progression */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tier Progression
          </span>
          <span className="text-xs text-slate-500">
            {tierKey === "PLATINUM"
              ? "Maximum tier reached"
              : `Next: ${TIER_CONFIG[getNextTier(tierKey)].label} at ${
                  TIER_CONFIG[getNextTier(tierKey)].min
                }`}
          </span>
        </div>

        <div className="relative">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.current.score}%` }}
              transition={{ duration: 1.5 }}
              className={`h-full rounded-full ${
                data.current.score >= 90
                  ? "bg-amber-300"
                  : data.current.score >= 75
                  ? "bg-amber-400"
                  : data.current.score >= 60
                  ? "bg-slate-400"
                  : data.current.score >= 40
                  ? "bg-amber-700"
                  : "bg-red-500"
              }`}
            />
          </div>
          <div className="flex justify-between mt-2">
            {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const).map((t) => (
              <div key={t} className="flex flex-col items-center">
                <div
                  className={`w-2 h-2 rounded-full mb-1 ${
                    tierKey === t
                      ? "bg-cyan-400"
                      : getTierIndex(tierKey) > getTierIndex(t)
                      ? "bg-slate-600"
                      : "bg-slate-800"
                  }`}
                />
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    tierKey === t
                      ? "text-cyan-400 font-bold"
                      : "text-slate-600"
                  }`}
                >
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function getTierIndex(tier: string): number {
  return ["AT_RISK", "BRONZE", "SILVER", "GOLD", "PLATINUM"].indexOf(tier);
}

function getNextTier(tier: keyof typeof TIER_CONFIG): keyof typeof TIER_CONFIG {
  const tiers: (keyof typeof TIER_CONFIG)[] = [
    "AT_RISK",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
  ];
  const idx = tiers.indexOf(tier);
  return tiers[Math.min(idx + 1, tiers.length - 1)];
}