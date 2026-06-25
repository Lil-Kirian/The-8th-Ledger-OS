"use client";

import React from "react";
import { Shield, Zap, Crown, Flame, Hexagon } from "lucide-react";

const TIERS = [
  { level: 1, name: "Vanguard", color: "text-white", bg: "bg-white/5", border: "border-white/10", icon: Shield },
  { level: 2, name: "Sentinel", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: Zap },
  { level: 3, name: "Archon", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: Crown },
  { level: 4, name: "Sovereign", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Flame },
  { level: 5, name: "Kaiser", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Hexagon },
];

interface TierBadgeProps {
  tier: number;
  size?: "sm" | "md";
  showName?: boolean;
}

export function TierBadge({ tier, size = "sm", showName = true }: TierBadgeProps) {
  const config = TIERS.find((t) => t.level === tier) || TIERS[0];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md ${config.bg} ${config.border} border ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } font-semibold ${config.color}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {showName && config.name}
      {!showName && `T${tier}`}
    </span>
  );
}