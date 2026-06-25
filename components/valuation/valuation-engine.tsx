"use client";

import { motion } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  Award,
  Shield,
  AlertTriangle,
  DollarSign,
  Info,
  Equal,
  Minus,
  Plus,
  Calendar,
} from "lucide-react";

interface ValuationEngineProps {
  hallId: string;
  hallName: string;
  assetBookValue: number;
  accumulatedDividendsPerPercent: number;
  ahgiScore: number;
  ahgiPremium: number;
  sriTier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "AT_RISK";
  sriBonus: number;
  pirDebtPerPercent: number;
  calculatedAt: string;
  nextAppraisal: string;
}

const SRI_BONUS_CONFIG = {
  PLATINUM: { amount: 50, color: "text-amber-300" },
  GOLD: { amount: 30, color: "text-amber-400" },
  SILVER: { amount: 10, color: "text-slate-300" },
  BRONZE: { amount: 0, color: "text-amber-700" },
  AT_RISK: { amount: -20, color: "text-red-400" },
};

export default function ValuationEngine({
  hallId,
  hallName,
  assetBookValue,
  accumulatedDividendsPerPercent,
  ahgiScore,
  ahgiPremium,
  sriTier,
  sriBonus,
  pirDebtPerPercent,
  calculatedAt,
  nextAppraisal,
}: ValuationEngineProps) {
  const baseValue = assetBookValue / 100;
  const totalPerPercent =
    baseValue +
    accumulatedDividendsPerPercent +
    ahgiPremium +
    sriBonus -
    pirDebtPerPercent;

  const components = [
    {
      label: "Asset Book Value",
      value: baseValue,
      formula: `$${assetBookValue.toLocaleString()} ÷ 100`,
      icon: <DollarSign className="w-4 h-4" />,
      color: "text-slate-300",
      bg: "bg-slate-800/50",
      operator: null as React.ReactNode,
    },
    {
      label: "Accumulated Dividends",
      value: accumulatedDividendsPerPercent,
      formula: "Per 1% over lifetime",
      icon: <TrendingUp className="w-4 h-4" />,
      color: "text-emerald-400",
      bg: "bg-emerald-950/20",
      operator: <Plus className="w-3 h-3 text-slate-600" />,
    },
    {
      label: "AHGI Premium",
      value: ahgiPremium,
      formula: `(${ahgiScore} - 50) × $10`,
      icon: <TrendingUp className="w-4 h-4" />,
      color: "text-cyan-400",
      bg: "bg-cyan-950/20",
      operator: <Plus className="w-3 h-3 text-slate-600" />,
    },
    {
      label: "SRI Tier Bonus",
      value: sriBonus,
      formula: `${sriTier}: $${SRI_BONUS_CONFIG[sriTier].amount}`,
      icon: <Award className="w-4 h-4" />,
      color: SRI_BONUS_CONFIG[sriTier].color,
      bg: "bg-amber-950/20",
      operator: <Plus className="w-3 h-3 text-slate-600" />,
    },
  ];

  if (pirDebtPerPercent > 0) {
    components.push({
      label: "PIR Debt",
      value: -pirDebtPerPercent,
      formula: "Outstanding advance",
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-red-400",
      bg: "bg-red-950/20",
      operator: <Minus className="w-3 h-3 text-slate-600" />,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            8th Ledger Valuation Engine
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {hallName} — Hall #{hallId}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase tracking-wider">
            Calculated
          </div>
          <div className="text-sm text-slate-400">
            {new Date(calculatedAt).toLocaleDateString()}
          </div>
        </div>
      </motion.div>

      {/* Formula Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            Valuation Formula
          </h3>
        </div>

        <div className="p-5 space-y-3">
          {components.map((comp, i) => (
            <motion.div
              key={comp.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {comp.operator && (
                <div className="flex justify-center py-1">{comp.operator}</div>
              )}
              <div
                className={`flex items-center justify-between p-4 rounded-lg border border-slate-800 ${comp.bg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${comp.color}`}>{comp.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {comp.label}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {comp.formula}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-bold ${comp.color}`}>
                  {comp.value >= 0 ? "+" : ""}$
                  {comp.value.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Equals */}
          <div className="flex justify-center py-2">
            <Equal className="w-5 h-5 text-slate-600" />
          </div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="p-5 bg-cyan-950/20 border border-cyan-900/50 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                  8th Ledger Valuation (Per 1%)
                </div>
                <div className="text-xs text-cyan-400/70 mt-1">
                  Floor price for all marketplace listings
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-cyan-400">
                  $
                  {totalPerPercent.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-cyan-400/70">per 1% ownership</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3"
      >
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Sale Pricing Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RuleCard
            label="Floor Price"
            value="100% of 8th Ledger Valuation"
            status="hard"
            desc="Cannot list below without hall vote (51%)"
          />
          <RuleCard
            label="Above Floor"
            value="Owner sets any price"
            status="free"
            desc="Market decides fair value"
          />
          <RuleCard
            label="8th Ledger Fee"
            value="1% full / 2% fractional"
            status="fee"
            desc="Deducted from sale proceeds"
          />
          <RuleCard
            label="Auto-Update"
            value="Monthly recalculation"
            status="auto"
            desc="Active listings auto-adjust"
          />
        </div>
      </motion.div>

      {/* Next Appraisal */}
      <div className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-800 rounded-lg text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            Next appraisal: {new Date(nextAppraisal).toLocaleDateString()}
          </span>
        </div>
        <span className="text-slate-600">
          Independent valuation + revenue multiple
        </span>
      </div>
    </div>
  );
}

function RuleCard({
  label,
  value,
  status,
  desc,
}: {
  label: string;
  value: string;
  status: "hard" | "free" | "fee" | "auto";
  desc: string;
}) {
  const statusConfig = {
    hard: {
      color: "text-red-400 bg-red-950/20 border-red-900/50",
      badge: "HARD RULE",
    },
    free: {
      color: "text-emerald-400 bg-emerald-950/20 border-emerald-900/50",
      badge: "FREE",
    },
    fee: {
      color: "text-amber-400 bg-amber-950/20 border-amber-900/50",
      badge: "FEE",
    },
    auto: {
      color: "text-cyan-400 bg-cyan-950/20 border-cyan-900/50",
      badge: "AUTO",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${config.color}`}
        >
          {config.badge}
        </span>
      </div>
      <div className="text-sm font-bold text-slate-200">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{desc}</div>
    </div>
  );
}