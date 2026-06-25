"use client";

import { motion } from "framer-motion";
import { Eye, Sparkles, Crown, Brain, Target } from "lucide-react";

interface StandingBadgeProps {
  tier: "none" | "seer" | "oracle" | "prophet";
  points: number;
  correctCount: number;
  totalPredictions: number;
  rank?: number;
  size?: "sm" | "md" | "lg";
}

const TIER_CONFIG = {
  none: {
    label: "Observer",
    color: "text-slate-500",
    bg: "bg-slate-900/50",
    border: "border-slate-800",
    icon: <Eye className="w-4 h-4" />,
    glow: "",
    desc: "Make predictions to earn standing",
  },
  seer: {
    label: "Seer",
    color: "text-amber-700",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    icon: <Eye className="w-4 h-4" />,
    glow: "shadow-amber-950/20",
    desc: "10 correct predictions",
  },
  oracle: {
    label: "Oracle",
    color: "text-slate-300",
    bg: "bg-slate-800/50",
    border: "border-slate-600",
    icon: <Brain className="w-4 h-4" />,
    glow: "shadow-slate-900/30",
    desc: "50 correct predictions",
  },
  prophet: {
    label: "Prophet",
    color: "text-amber-400",
    bg: "bg-amber-950/30",
    border: "border-amber-500/50",
    icon: <Crown className="w-4 h-4" />,
    glow: "shadow-amber-500/20",
    desc: "100 correct predictions",
  },
};

export default function StandingBadge({
  tier,
  points,
  correctCount,
  totalPredictions,
  rank,
  size = "md",
}: StandingBadgeProps) {
  const config = TIER_CONFIG[tier];
  const accuracy = totalPredictions > 0 ? Math.round((correctCount / totalPredictions) * 100) : 0;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`inline-flex items-center gap-2 rounded-lg border ${config.border} ${config.bg} ${sizeClasses[size]} ${config.glow} transition-all`}
    >
      <span className={config.color}>
        {tier === "prophet" ? (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {config.icon}
          </motion.div>
        ) : (
          config.icon
        )}
      </span>
      <div className="flex items-center gap-1.5">
        <span className={`font-bold ${config.color}`}>{config.label}</span>
        {rank && (
          <span className="text-xs text-slate-500">#{rank}</span>
        )}
      </div>
      {size !== "sm" && (
        <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-800/50">
          <span className="text-xs text-slate-500">{points} pts</span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-500">{accuracy}% acc</span>
        </div>
      )}
    </motion.div>
  );
}

export function StandingProgress({
  currentPoints,
  currentTier,
}: {
  currentPoints: number;
  currentTier: "none" | "seer" | "oracle" | "prophet";
}) {
  const tiers = [
    { key: "none" as const, threshold: 0, label: "Observer" },
    { key: "seer" as const, threshold: 10, label: "Seer" },
    { key: "oracle" as const, threshold: 50, label: "Oracle" },
    { key: "prophet" as const, threshold: 100, label: "Prophet" },
  ];

  const currentIndex = tiers.findIndex((t) => t.key === currentTier);
  const nextTier = tiers[currentIndex + 1];
  const progress = nextTier
    ? Math.min(100, ((currentPoints - tiers[currentIndex].threshold) / (nextTier.threshold - tiers[currentIndex].threshold)) * 100)
    : 100;

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span className="capitalize">{currentTier}</span>
        {nextTier ? (
          <span>{currentPoints} / {nextTier.threshold} to {nextTier.label}</span>
        ) : (
          <span>Max tier reached</span>
        )}
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            currentTier === "prophet"
              ? "bg-amber-500"
              : currentTier === "oracle"
              ? "bg-slate-400"
              : "bg-amber-700"
          }`}
        />
      </div>
      <div className="flex justify-between mt-1">
        {tiers.map((t) => (
          <div
            key={t.key}
            className={`w-1.5 h-1.5 rounded-full ${
              currentIndex >= tiers.indexOf(t) ? "bg-cyan-500" : "bg-slate-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}