"use client";

import { motion } from "framer-motion";
import { Crown, Award, Medal, AlertTriangle } from "lucide-react";

interface SRIBadgeProps {
  score: number;
  tier?: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "AT_RISK";
  size?: "sm" | "md" | "lg" | "xl";
  showScore?: boolean;
  animate?: boolean;
  className?: string;
}

const TIER_CONFIG = {
  PLATINUM: {
    label: "PLATINUM",
    emoji: "👑",
    icon: <Crown className="w-4 h-4" />,
    color: "text-amber-300",
    bg: "bg-amber-950/40",
    border: "border-amber-500/60",
    glow: "shadow-amber-500/20",
    gradient: "from-amber-500/20 to-amber-950/20",
    pulse: false,
  },
  GOLD: {
    label: "GOLD",
    emoji: "🥇",
    icon: <Award className="w-4 h-4" />,
    color: "text-amber-400",
    bg: "bg-amber-950/30",
    border: "border-amber-900/50",
    glow: "shadow-amber-900/20",
    gradient: "from-amber-500/10 to-transparent",
    pulse: false,
  },
  SILVER: {
    label: "SILVER",
    emoji: "🥈",
    icon: <Medal className="w-4 h-4" />,
    color: "text-slate-300",
    bg: "bg-slate-800/50",
    border: "border-slate-600",
    glow: "",
    gradient: "from-slate-500/10 to-transparent",
    pulse: false,
  },
  BRONZE: {
    label: "BRONZE",
    emoji: "🥉",
    icon: <Medal className="w-4 h-4" />,
    color: "text-amber-700",
    bg: "bg-amber-950/20",
    border: "border-amber-900/40",
    glow: "",
    gradient: "from-amber-700/10 to-transparent",
    pulse: false,
  },
  AT_RISK: {
    label: "AT RISK",
    emoji: "⚠️",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-400",
    bg: "bg-red-950/30",
    border: "border-red-900/50",
    glow: "shadow-red-900/20",
    gradient: "from-red-500/10 to-transparent",
    pulse: true,
  },
};

function getTierFromScore(score: number): keyof typeof TIER_CONFIG {
  if (score >= 90) return "PLATINUM";
  if (score >= 75) return "GOLD";
  if (score >= 60) return "SILVER";
  if (score >= 40) return "BRONZE";
  return "AT_RISK";
}

export default function SRIBadge({
  score,
  tier,
  size = "md",
  showScore = true,
  animate = true,
  className = "",
}: SRIBadgeProps) {
  const resolvedTier = tier || getTierFromScore(score);
  const config = TIER_CONFIG[resolvedTier];

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
    xl: "px-5 py-2.5 text-lg gap-2.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  const scoreSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <motion.div
      whileHover={animate ? { scale: 1.05 } : {}}
      className={`inline-flex items-center rounded-lg border ${config.border} ${config.bg} ${config.glow} ${sizeClasses[size]} backdrop-blur-sm overflow-hidden relative ${className}`}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${config.gradient} pointer-events-none`}
      />

      {/* Pulse ring for AT_RISK */}
      {config.pulse && (
        <span className="absolute inset-0 rounded-lg ring-2 ring-red-500/40 animate-pulse pointer-events-none" />
      )}

      <span className={`relative z-10 ${iconSizes[size]} ${config.color}`}>
        {config.icon}
      </span>
      <span className={`relative z-10 font-bold ${config.color}`}>
        {config.label}
      </span>
      {showScore && (
        <span
          className={`relative z-10 ${scoreSizes[size]} text-slate-500 ml-1 border-l border-slate-700/50 pl-2`}
        >
          {score}
        </span>
      )}
    </motion.div>
  );
}

interface SRICompactBadgeProps {
  score: number;
  size?: "sm" | "md";
  className?: string;
}

export function SRICompactBadge({
  score,
  size = "sm",
  className = "",
}: SRICompactBadgeProps) {
  const tier = getTierFromScore(score);
  const config = TIER_CONFIG[tier];

  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      title={`${config.label} — SRI ${score}`}
      className={`inline-flex items-center justify-center rounded-full border ${config.border} ${config.bg} ${sizes[size]} font-bold ${config.color} ${className}`}
    >
      {config.emoji}
    </motion.div>
  );
}