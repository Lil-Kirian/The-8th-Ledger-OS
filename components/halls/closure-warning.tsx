// components/halls/closure-warning.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Clock,
  Vote,
  Gavel,
  X,
  ChevronRight,
  ShieldAlert,
  Ban,
  Pause,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  FileText,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export type ClosurePhase = "warning" | "decision" | "liquidation";

export interface ClosureWarningData {
  hallId: string;
  hallName: string;
  phase: ClosurePhase;
  ahgi: number;
  ahgiTrend: number; // change from last month
  revenue: number;
  revenueLastMonth: number;
  payroll: number;
  ledgerTithe: number;
  net: number;
  monthsCritical: number;
  daysRemaining: number;
  sriFrozen: boolean;
  hiresFrozen: boolean;
  proposalsFrozen: boolean;
  estimatedLiquidationValue?: number;
  outstandingPirDebt: number;
  taxObligations: number;
  workerCount: number;
  totalOwnershipPercent: number;
  ownerCount: number;
  voteToSellRequired: number; // 66%
  voteToSellCurrent: number;
  voteToSellStatus: "none" | "pending" | "passed" | "rejected";
  improvementPlanSubmitted?: boolean;
}

export interface ClosureWarningProps {
  data: ClosureWarningData;
  onVoteSell?: () => void;
  onViewImprovementPlan?: () => void;
  onViewLiquidationTerms?: () => void;
  onViewFullAudit?: () => void;
  onAcknowledge?: () => void;
  className?: string;
}

//  Helpers

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

function getPhaseConfig(phase: ClosurePhase) {
  const configs = {
    warning: {
      title: "Critical Warning",
      subtitle: "This hall is operating at a loss. The 8th Ledger has activated the Closure Protocol.",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      glow: "shadow-amber-500/15",
      ring: "ring-amber-500/20",
      progressColor: "bg-amber-500",
      severity: "amber",
    },
    decision: {
      title: "Final Warning",
      subtitle: "This hall has operated at a loss for 2 consecutive months. Liquidation is scheduled.",
      icon: AlertOctagon,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      glow: "shadow-orange-500/15",
      ring: "ring-orange-500/20",
      progressColor: "bg-orange-500",
      severity: "orange",
    },
    liquidation: {
      title: "Liquidation Active",
      subtitle: "The 8th Ledger is executing asset liquidation. All owners will receive payout.",
      icon: ShieldAlert,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      glow: "shadow-red-500/15",
      ring: "ring-red-500/20",
      progressColor: "bg-red-500",
      severity: "red",
    },
  };
  return configs[phase];
}

//  Metric Card

function MetricCard({
  label,
  value,
  trend,
  trendLabel,
  isNegative,
  isPositive,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  isNegative?: boolean;
  isPositive?: boolean;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-slate-900/50 p-3.5", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <Icon className={cn(
          "h-3.5 w-3.5",
          isNegative ? "text-red-400" : isPositive ? "text-emerald-400" : "text-slate-500"
        )} />
      </div>
      <p className={cn(
        "text-lg font-bold font-mono",
        isNegative ? "text-red-400" : isPositive ? "text-emerald-400" : "text-slate-200"
      )}>
        {value}
      </p>
      {trend !== undefined && (
        <p className={cn(
          "text-[10px] mt-1 flex items-center gap-1",
          trend < 0 ? "text-red-400" : trend > 0 ? "text-emerald-400" : "text-slate-500"
        )}>
          {trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
          {trend > 0 ? "+" : ""}{trend}% {trendLabel}
        </p>
      )}
    </div>
  );
}

//  Main Component

export function ClosureWarning({
  data,
  onVoteSell,
  onViewImprovementPlan,
  onViewLiquidationTerms,
  onViewFullAudit,
  onAcknowledge,
  className,
}: ClosureWarningProps) {
  const [expanded, setExpanded] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const cfg = getPhaseConfig(data.phase);
  const PhaseIcon = cfg.icon;

  const isProfitable = data.net >= 0;
  const voteProgress = Math.min(100, (data.voteToSellCurrent / data.voteToSellRequired) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-slate-950/90 backdrop-blur-md",
        cfg.border,
        cfg.glow,
        cfg.ring,
        className,
      )}
    >
      {/* Animated top bar */}
      <div className="relative h-1 w-full overflow-hidden bg-slate-800">
        <motion.div
          className={cn("absolute inset-y-0 left-0", cfg.progressColor)}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {data.phase === "warning" && (
          <motion.div
            className="absolute inset-y-0 right-0 w-1/3 bg-white/20"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                cfg.bg,
              )}
            >
              <PhaseIcon className={cn("h-6 w-6", cfg.color)} />
            </div>
            <div>
              <h2
                className={cn("text-base font-bold tracking-wide", cfg.color)}
              >
                {cfg.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-md">
                {cfg.subtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border",
                cfg.bg,
                cfg.color,
                cfg.border,
              )}
            >
              <Clock className="h-3 w-3" />
              {data.daysRemaining} days
            </span>
            <span className="text-[10px] text-slate-600">
              Month {data.monthsCritical} of Critical
            </span>
          </div>
        </div>

        {/* Frozen notices */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {data.sriFrozen && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/60 px-2.5 py-1 text-[10px] font-medium text-slate-400 border border-slate-700/40">
              <Pause className="h-3 w-3" />
              SRI Frozen
            </span>
          )}
          {data.hiresFrozen && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/60 px-2.5 py-1 text-[10px] font-medium text-slate-400 border border-slate-700/40">
              <Ban className="h-3 w-3" />
              No New Hires
            </span>
          )}
          {data.proposalsFrozen && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/60 px-2.5 py-1 text-[10px] font-medium text-slate-400 border border-slate-700/40">
              <X className="h-3 w-3" />
              Closure Proposals Only
            </span>
          )}
          {data.voteToSellStatus === "passed" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              Sell Vote Passed
            </span>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="AHGI Score"
            value={data.ahgi.toString()}
            trend={data.ahgiTrend}
            trendLabel="vs last month"
            isNegative={data.ahgi < 20}
            icon={TrendingDown}
            className="border-red-500/10"
          />
          <MetricCard
            label="Monthly Revenue"
            value={formatCurrency(data.revenue)}
            trend={Math.round(
              ((data.revenue - data.revenueLastMonth) /
                Math.max(1, data.revenueLastMonth)) *
                100,
            )}
            trendLabel="vs last month"
            isNegative={data.revenue < data.revenueLastMonth}
            isPositive={data.revenue > data.revenueLastMonth}
            icon={DollarSign}
          />
          <MetricCard
            label="Payroll"
            value={formatCurrency(data.payroll)}
            isNegative={data.payroll > data.revenue}
            icon={Users}
          />
          <MetricCard
            label="Net Position"
            value={formatCurrency(data.net)}
            isNegative={!isProfitable}
            isPositive={isProfitable}
            icon={isProfitable ? TrendingUp : TrendingDown}
            className={
              !isProfitable ? "border-red-500/10" : "border-emerald-500/10"
            }
          />
        </div>

        {/* Net Position Bar */}
        <div className="mt-4 rounded-xl bg-slate-900/50 p-4 border border-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Revenue vs Expenses
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                isProfitable ? "text-emerald-400" : "text-red-400",
              )}
            >
              {isProfitable ? "SURPLUS" : "DEFICIT"}:{" "}
              {formatCurrency(Math.abs(data.net))}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, (data.revenue / Math.max(data.revenue, data.payroll + data.ledgerTithe)) * 100))}%`,
              }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, ((data.payroll + data.ledgerTithe) / Math.max(data.revenue, data.payroll + data.ledgerTithe)) * 100))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Revenue {formatCurrency(data.revenue)}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              Payroll + Tithe {formatCurrency(data.payroll + data.ledgerTithe)}
            </span>
          </div>
        </div>

        {/* Vote to Sell Progress (Warning phase only) */}
        {data.phase === "warning" && (
          <div className="mt-4 rounded-xl bg-slate-900/50 p-4 border border-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <Vote className="h-3.5 w-3.5" />
                Vote to Sell Voluntarily
              </span>
              <span className="text-xs font-bold text-slate-300">
                {data.voteToSellCurrent.toFixed(1)}% / {data.voteToSellRequired}
                % required
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${voteProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  voteProgress >= 100 ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-slate-500">
                {data.voteToSellStatus === "none" && "No vote initiated yet."}
                {data.voteToSellStatus === "pending" &&
                  "Vote is active. 66% required to pass."}
                {data.voteToSellStatus === "passed" &&
                  "Vote passed. 8th Ledger will prepare sale."}
                {data.voteToSellStatus === "rejected" &&
                  "Vote rejected. Hall must improve or face liquidation."}
              </p>
              {data.voteToSellStatus !== "passed" && onVoteSell && (
                <button
                  onClick={() => setShowVoteModal(true)}
                  className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center gap-1.5"
                >
                  <Gavel className="h-3.5 w-3.5" />
                  Vote to Sell
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liquidation Preview (Decision phase) */}
        {data.phase === "decision" &&
          data.estimatedLiquidationValue !== undefined && (
            <div className="mt-4 rounded-xl bg-orange-500/5 p-4 border border-orange-500/15 space-y-3">
              <p className="text-xs font-semibold text-orange-400 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Estimated Liquidation Preview
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Asset Sale Estimate</span>
                  <span className="text-slate-200 font-medium">
                    {formatCurrency(data.estimatedLiquidationValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    8th Ledger Liquidation Fee (2.5%)
                  </span>
                  <span className="text-red-400 font-medium">
                    -{formatCurrency(data.estimatedLiquidationValue * 0.025)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Outstanding PIR Debt</span>
                  <span className="text-red-400 font-medium">
                    -{formatCurrency(data.outstandingPirDebt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tax Obligations</span>
                  <span className="text-red-400 font-medium">
                    -{formatCurrency(data.taxObligations)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Worker Severance ({data.workerCount} workers)
                  </span>
                  <span className="text-red-400 font-medium">
                    -{formatCurrency(data.workerCount * 1500)}
                  </span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-200">Net to Owners</span>
                  <span className="text-emerald-400">
                    {formatCurrency(
                      data.estimatedLiquidationValue -
                        data.estimatedLiquidationValue * 0.025 -
                        data.outstandingPirDebt -
                        data.taxObligations -
                        data.workerCount * 1500,
                    )}
                  </span>
                </div>
              </div>
              {onViewLiquidationTerms && (
                <button
                  onClick={onViewLiquidationTerms}
                  className="w-full rounded-lg bg-orange-500/15 px-4 py-2.5 text-xs font-semibold text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View Full Liquidation Terms
                </button>
              )}
            </div>
          )}

        {/* Liquidation Payout (Liquidation phase) */}
        {data.phase === "liquidation" &&
          data.estimatedLiquidationValue !== undefined && (
            <div className="mt-4 rounded-xl bg-red-500/5 p-4 border border-red-500/15 space-y-3">
              <p className="text-xs font-semibold text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5" />
                Liquidation in Progress
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Asset Sold
                  </p>
                  <p className="text-sm font-bold text-slate-200">
                    {formatCurrency(data.estimatedLiquidationValue)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Net Proceeds
                  </p>
                  <p className="text-sm font-bold text-emerald-400">
                    {formatCurrency(
                      data.estimatedLiquidationValue -
                        data.estimatedLiquidationValue * 0.025 -
                        data.outstandingPirDebt -
                        data.taxObligations -
                        data.workerCount * 1500,
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Owners
                  </p>
                  <p className="text-sm font-bold text-slate-200">
                    {data.ownerCount}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Workers
                  </p>
                  <p className="text-sm font-bold text-slate-200">
                    {data.workerCount}
                  </p>
                </div>
              </div>
              {onViewFullAudit && (
                <button
                  onClick={onViewFullAudit}
                  className="w-full rounded-lg bg-red-500/15 px-4 py-2.5 text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors flex items-center justify-center gap-2"
                >
                  <Hash className="h-3.5 w-3.5" />
                  View Full Audit Trail
                </button>
              )}
            </div>
          )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {data.phase === "warning" && onViewImprovementPlan && (
            <button
              onClick={onViewImprovementPlan}
              className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700/50 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              View Improvement Plan
              <ChevronRight className="h-3 w-3" />
            </button>
          )}

          {data.phase === "warning" &&
            data.voteToSellStatus === "none" &&
            onVoteSell && (
              <button
                onClick={() => setShowVoteModal(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
              >
                <Vote className="h-3.5 w-3.5" />
                Initiate Sell Vote
              </button>
            )}

          {data.phase === "decision" && onViewLiquidationTerms && (
            <button
              onClick={onViewLiquidationTerms}
              className="flex items-center gap-2 rounded-xl bg-orange-500/15 px-4 py-2.5 text-xs font-semibold text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              View Liquidation Terms
            </button>
          )}

          {onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="ml-auto flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Acknowledge
            </button>
          )}
        </div>

        {/* Footer note */}
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-500">
              8th Ledger Protocol:
            </span>{" "}
            {data.phase === "warning" &&
              "You have 60 days to improve operations or vote to sell. If conditions persist, the 8th Ledger will execute liquidation to protect owner capital."}
            {data.phase === "decision" &&
              "No further votes are required. The 8th Ledger has commissioned an independent appraisal and will execute liquidation within 30 days."}
            {data.phase === "liquidation" &&
              "Asset sale is in progress. All owners will receive proportional payout once fees, debts, and severance are settled. This hall will be dissolved."}
          </p>
        </div>
      </div>

      {/* Vote Modal (simple inline) */}
      {showVoteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                <Gavel className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Vote to Sell Asset
                </h3>
                <p className="text-[11px] text-slate-500">
                  Requires 66% hall approval
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              This will initiate a proposal to sell the hall asset on the open
              market. If passed, the 8th Ledger will handle the sale and
              distribute proceeds to all owners. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onVoteSell?.();
                  setShowVoteModal(false);
                }}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Yes, Initiate Vote
              </button>
              <button
                onClick={() => setShowVoteModal(false)}
                className="flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

//  Skeleton ─

export function ClosureWarningSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-slate-800 animate-pulse" />
            <div className="h-3 w-64 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-20 rounded-full bg-slate-800 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800 animate-pulse" />
        ))}
      </div>
      <div className="h-24 rounded-xl bg-slate-800 animate-pulse" />
    </div>
  );
}

export default ClosureWarning;