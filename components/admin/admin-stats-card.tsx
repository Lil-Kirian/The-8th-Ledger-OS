"use client";

import React from "react";
import {
  TrendingUp,
  Users,
  Building2,
  Wallet,
  Landmark,
  Activity,
  Shield,
  Globe,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Crown,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type StatType =
  | "users"
  | "pools"
  | "halls"
  | "revenue"
  | "treasury"
  | "commitments"
  | "dividends"
  | "kyc"
  | "oracle"
  | "meridian"
  | "security";

interface StatConfig {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

const statConfig: Record<StatType, StatConfig> = {
  users: {
    icon: Users,
    label: "Sovereigns",
    color: "text-cyan-400",
    bg: "bg-cyan-950/20",
    border: "border-cyan-800/30",
    glow: "shadow-cyan-900/10",
  },
  pools: {
    icon: Building2,
    label: "Active Pools",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-800/30",
    glow: "shadow-emerald-900/10",
  },
  halls: {
    icon: Landmark,
    label: "Live Halls",
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-800/30",
    glow: "shadow-amber-900/10",
  },
  revenue: {
    icon: Wallet,
    label: "Net Revenue",
    color: "text-violet-400",
    bg: "bg-violet-950/20",
    border: "border-violet-800/30",
    glow: "shadow-violet-900/10",
  },
  treasury: {
    icon: Shield,
    label: "PIR Reserve",
    color: "text-rose-400",
    bg: "bg-rose-950/20",
    border: "border-rose-800/30",
    glow: "shadow-rose-900/10",
  },
  commitments: {
    icon: BarChart3,
    label: "Total Committed",
    color: "text-sky-400",
    bg: "bg-sky-950/20",
    border: "border-sky-800/30",
    glow: "shadow-sky-900/10",
  },
  dividends: {
    icon: Zap,
    label: "Dividends Paid",
    color: "text-yellow-400",
    bg: "bg-yellow-950/20",
    border: "border-yellow-800/30",
    glow: "shadow-yellow-900/10",
  },
  kyc: {
    icon: Activity,
    label: "KYC Pending",
    color: "text-orange-400",
    bg: "bg-orange-950/20",
    border: "border-orange-800/30",
    glow: "shadow-orange-900/10",
  },
  oracle: {
    icon: Globe,
    label: "Oracle Forecasts",
    color: "text-indigo-400",
    bg: "bg-indigo-950/20",
    border: "border-indigo-800/30",
    glow: "shadow-indigo-900/10",
  },
  meridian: {
    icon: Crown,
    label: "Meridian Cycle",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-950/20",
    border: "border-fuchsia-800/30",
    glow: "shadow-fuchsia-900/10",
  },
  security: {
    icon: Shield,
    label: "Security Events",
    color: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-800/30",
    glow: "shadow-red-900/10",
  },
};

interface AdminStatsCardProps {
  type: StatType;
  value: number | string;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function AdminStatsCard({
  type,
  value,
  previousValue,
  prefix = "",
  suffix = "",
  subtitle,
  trend = "neutral",
  trendValue,
  isLoading = false,
  onClick,
  className,
}: AdminStatsCardProps) {
  const config = statConfig[type];
  const Icon = config.icon;

  const displayValue =
    typeof value === "number"
      ? value >= 1000000
        ? `${prefix}${(value / 1000000).toFixed(1)}M${suffix}`
        : value >= 1000
        ? `${prefix}${(value / 1000).toFixed(1)}K${suffix}`
        : `${prefix}${value.toLocaleString()}${suffix}`
      : `${prefix}${value}${suffix}`;

  const percentChange =
    previousValue && typeof value === "number" && typeof previousValue === "number"
      ? ((value - previousValue) / previousValue) * 100
      : null;

  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "relative group rounded-xl border bg-[#0a0a12] p-5 transition-all duration-300",
        "hover:border-slate-700/50 hover:shadow-lg",
        config.border,
        config.glow,
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Glow effect on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          config.bg
        )}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center border",
                config.bg,
                config.border
              )}
            >
              <Icon size={20} className={config.color} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {config.label}
              </div>
              {subtitle && (
                <div className="text-[9px] text-slate-600 mt-0.5">{subtitle}</div>
              )}
            </div>
          </div>

          {/* Trend badge */}
          <div className={cn("flex items-center gap-1 text-[10px] font-bold", trendColor)}>
            <TrendIcon size={12} />
            {trendValue || (percentChange !== null ? `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%` : "0%")}
          </div>
        </div>

        {/* Value */}
        <div className="space-y-1">
          {isLoading ? (
            <div className="h-8 w-32 bg-slate-800/50 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {displayValue}
            </div>
          )}

          {/* Previous value comparison */}
          {previousValue !== undefined && !isLoading && (
            <div className="text-[10px] text-slate-600">
              Previous: {prefix}
              {previousValue.toLocaleString()}
              {suffix}
            </div>
          )}
        </div>

        {/* Progress bar for percentage-based stats */}
        {percentChange !== null && Math.abs(percentChange) > 0 && (
          <div className="mt-4 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                trend === "up" ? "bg-emerald-500/40" : trend === "down" ? "bg-red-500/40" : "bg-slate-500/40"
              )}
              style={{ width: `${Math.min(Math.abs(percentChange), 100)}%` }}
            />
          </div>
        )}

        {/* Bottom accent line */}
        <div
          className={cn(
            "absolute bottom-0 left-5 right-5 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            config.bg.replace("/20", "/40")
          )}
        />
      </div>
    </motion.div>
  );
}

// Grid wrapper for multiple stats
interface AdminStatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function AdminStatsGrid({
  children,
  columns = 4,
  className,
}: AdminStatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}