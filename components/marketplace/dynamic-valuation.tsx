// components/marketplace/dynamic-valuation.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Shield,
  Crown,
  Gem,
  Activity,
  Wallet,
  Percent,
  Info,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DynamicValuationData {
  hallId: string;
  hallName: string;
  assetBookValue: number;
  accumulatedDividendsPerPercent: number;
  ahgiScore: number;
  ahgiPremium: number;
  sriTier: "platinum" | "gold" | "silver" | "bronze" | "at_risk";
  sriBonus: number;
  pirDebtPerPercent: number;
  ihcpDebtPerPercent: number;
  valuePerPercent: number;
  calculatedAt: string;
  ownershipPercent: number;
  totalValue: number;
}

interface DynamicValuationProps {
  data: DynamicValuationData;
  compact?: boolean;
  showFloorWarning?: boolean;
}

const sriTierConfig = {
  platinum: { icon: Crown, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "PLATINUM", bonus: "+$50" },
  gold: { icon: Gem, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "GOLD", bonus: "+$30" },
  silver: { icon: Shield, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "SILVER", bonus: "+$10" },
  bronze: { icon: Shield, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "BRONZE", bonus: "$0" },
  at_risk: { icon: Activity, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "AT RISK", bonus: "-$20" },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100);
}

function formatDollar(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function DynamicValuation({ data, compact = false, showFloorWarning = true }: DynamicValuationProps) {
  const sriTier = sriTierConfig[data.sriTier];
  const SRIIcon = sriTier.icon;

  const assetBookPerPercent = Math.round(data.assetBookValue / 100);

  const components = [
    {
      label: "Asset Book Value (per 1%)",
      value: assetBookPerPercent,
      desc: `Total asset book ${formatCurrency(data.assetBookValue)} / 100`,
      icon: Building2,
      color: "text-slate-300",
      isPositive: true,
    },
    {
      label: "Accumulated Dividends",
      value: data.accumulatedDividendsPerPercent,
      desc: "Lifetime dividends per 1% ownership",
      icon: Wallet,
      color: "text-emerald-400",
      isPositive: true,
    },
    {
      label: "AHGI Premium",
      value: data.ahgiPremium,
      desc: `AHGI ${data.ahgiScore} — (${data.ahgiScore} - 50) × $10`,
      icon: TrendingUp,
      color: "text-cyan-400",
      isPositive: true,
    },
    {
      label: "SRI Tier Bonus",
      value: data.sriBonus,
      desc: `${sriTier.label} — ${sriTier.bonus}`,
      icon: SRIIcon,
      color: sriTier.color,
      isPositive: data.sriBonus >= 0,
    },
  ];

  if (data.pirDebtPerPercent > 0) {
    components.push({
      label: "PIR Debt",
      value: -data.pirDebtPerPercent,
      desc: "Outstanding PIR advance per 1%",
      icon: TrendingDown,
      color: "text-rose-400",
      isPositive: false,
    });
  }

  if (data.ihcpDebtPerPercent > 0) {
    components.push({
      label: "IHCP Debt",
      value: -data.ihcpDebtPerPercent,
      desc: "Outstanding IHCP contribution per 1%",
      icon: TrendingDown,
      color: "text-orange-400",
      isPositive: false,
    });
  }

  const safeValuePerPercent = data.valuePerPercent || 0;
  const safeTotalValue = data.totalValue || 0;
  const nextAppraisal = new Date(data.calculatedAt);
  nextAppraisal.setMonth(nextAppraisal.getMonth() + 3);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-slate-800/60 bg-slate-950/60 p-4 backdrop-blur-md"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">8th Ledger Valuation</div>
          <div className={cn("flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold border", sriTier.bg, sriTier.border, sriTier.color)}>
            <SRIIcon className="h-3 w-3" />
            {sriTier.label}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-50">{formatDollar(safeValuePerPercent)}</div>
            <div className="text-xs text-slate-500">per 1% ownership</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-cyan-400">{formatDollar(safeTotalValue)}</div>
            <div className="text-xs text-slate-500">your {data.ownershipPercent}% value</div>
          </div>
        </div>
        {showFloorWarning && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
            <Lock className="h-3 w-3" />
            Cannot list below floor without hall vote
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-slate-800/60 bg-slate-950/70 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-slate-800/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <Percent className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100">Dynamic PAC Valuation</div>
              <div className="text-[10px] text-slate-500">8th Ledger Engine · Recalculated Monthly</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold border", sriTier.bg, sriTier.border, sriTier.color)}>
              <SRIIcon className="h-3 w-3" />
              {sriTier.label}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Next Appraisal</div>
              <div className="text-xs font-mono text-cyan-400">{nextAppraisal.toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main value display */}
      <div className="px-6 py-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Floor Price (per 1%)</div>
            <div className="text-4xl font-bold text-slate-50">{formatDollar(safeValuePerPercent)}</div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Your Total Value</div>
            <div className="text-3xl font-bold text-cyan-400">{formatDollar(safeTotalValue)}</div>
            <div className="text-xs text-slate-500">{data.ownershipPercent}% ownership</div>
          </div>
        </div>

        {/* Component breakdown */}
        <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Valuation Breakdown</div>
        <div className="space-y-2">
          {components.map((comp, i) => (
            <motion.div
              key={comp.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-900/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/80", comp.color)}>
                  <comp.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300">{comp.label}</div>
                  <div className="text-[10px] text-slate-500">{comp.desc}</div>
                </div>
              </div>
              <div className={cn("font-mono text-sm font-semibold", comp.color)}>
                {comp.value >= 0 ? "+" : "-"}{formatCurrency(Math.abs(comp.value))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total bar */}
        {showFloorWarning && (
          <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-300">8th Ledger Floor Price</span>
              </div>
              <div className="font-mono text-lg font-bold text-cyan-400">{formatDollar(safeValuePerPercent)}</div>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Cannot list below this price without hall vote (51%). This protects against fire sales that crash hall value.
            </div>
          </div>
        )}

        {/* AHGI Context */}
        <div className="mt-4 rounded-lg border border-slate-800/40 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">Asset Health Growth Index</span>
            </div>
            <span className={cn("text-sm font-bold", data.ahgiScore >= 80 ? "text-emerald-400" : data.ahgiScore >= 60 ? "text-cyan-400" : data.ahgiScore >= 40 ? "text-amber-400" : "text-red-400")}>
              {data.ahgiScore}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                data.ahgiScore >= 80 ? "bg-emerald-400" :
                data.ahgiScore >= 60 ? "bg-cyan-400" :
                data.ahgiScore >= 40 ? "bg-amber-400" : "bg-red-400"
              )}
              style={{ width: `${Math.min(100, data.ahgiScore)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span>0 Critical</span>
            <span>40 Stagnant</span>
            <span>60 Healthy</span>
            <span>80 Thriving</span>
            <span>100 Max</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DynamicValuation;