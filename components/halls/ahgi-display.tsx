// components/halls/ahgi-display.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  Sprout,
  Zap,
  Building2,
  Briefcase,
  Plane,
  GraduationCap,
  Stethoscope,
  Wifi,
  Cpu,
  Car,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Hash,
  Info,
  BadgeCheck,
  Unlock,
  Lock,
  BarChart3,
  Gauge,
  Wrench,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export type VerticalType =
  | "ledgerprop"
  | "ledgerauto"
  | "ledgertech"
  | "ledgeragri"
  | "ledgerenergy"
  | "ledgerbiz"
  | "ledgertravel"
  | "ledgeredu"
  | "ledgerhealth"
  | "ledgeraccess";

export type AhgiStatus = "thriving" | "healthy" | "stagnant" | "declining" | "critical";

export interface AhgiMetric {
  name: string;
  value: number; // 0-100
  target: number;
  unit: string;
  trend: number; // % change
  description: string;
}

export interface AhgiData {
  hallId: string;
  hallName: string;
  vertical: VerticalType;
  hallClass: string;
  healthScore: number; // 0-100
  growthScore: number; // 0-100
  overallScore: number; // calculated: (health × 0.4) + (growth × 0.6)
  status: AhgiStatus;
  previousScore: number;
  recordedAt: Date;
  nextRecalculationAt: Date;
  healthMetrics: AhgiMetric[];
  growthMetrics: AhgiMetric[];
  historicalSnapshots?: { date: Date; score: number; status: AhgiStatus }[];
}

export interface AhgiDisplayProps {
  data: AhgiData;
  onViewHistory?: () => void;
  onViewAudit?: () => void;
  onSubmitImprovementPlan?: () => void;
  className?: string;
}

//  Vertical Config

const VERTICAL_CONFIG: Record<
  VerticalType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  ledgerprop: { label: "LedgerProp", icon: Building2, color: "text-amber-400", bg: "bg-amber-500/10" },
  ledgerauto: { label: "LedgerAuto", icon: Car, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ledgertech: { label: "LedgerTech", icon: Cpu, color: "text-violet-400", bg: "bg-violet-500/10" },
  ledgeragri: { label: "LedgerAgri", icon: Sprout, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ledgerenergy: { label: "LedgerEnergy", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  ledgerbiz: { label: "LedgerBiz", icon: Briefcase, color: "text-rose-400", bg: "bg-rose-500/10" },
  ledgertravel: { label: "LedgerTravel", icon: Plane, color: "text-sky-400", bg: "bg-sky-500/10" },
  ledgeredu: { label: "LedgerEdu", icon: GraduationCap, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  ledgerhealth: { label: "LedgerHealth", icon: Stethoscope, color: "text-teal-400", bg: "bg-teal-500/10" },
  ledgeraccess: { label: "LedgerAccess", icon: Wifi, color: "text-lime-400", bg: "bg-lime-500/10" },
};

//  Status Config

const STATUS_CONFIG: Record<
  AhgiStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
    icon: React.ElementType;
    description: string;
    effects: string[];
  }
> = {
  thriving: {
    label: "Thriving",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/15",
    icon: TrendingUp,
    description: "Asset performing above all projections. Maximum growth trajectory.",
    effects: [
      "Hall can propose expansion and new hires",
      "Can propose additional inventory orders",
      "Eligible for premium insurance rates",
      "Featured in Agora marketplace spotlight",
    ],
  },
  healthy: {
    label: "Healthy",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/10",
    icon: HeartPulse,
    description: "Standard operation. Asset meeting expectations.",
    effects: [
      "Standard maintenance proposals auto-approved",
      "Full governance rights active",
      "Standard dividend distribution",
    ],
  },
  stagnant: {
    label: "Stagnant",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/10",
    icon: Minus,
    description: "Asset flagged for review. Hall must submit improvement plan.",
    effects: [
      "8th Ledger flags for review",
      "Hall must submit improvement plan within 14 days",
      "Cannot propose expansion or new hires",
    ],
  },
  declining: {
    label: "Declining",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/15",
    icon: TrendingDown,
    description: "Dividend smoothing from Sanctuary activated. 8th Ledger oversight increases.",
    effects: [
      "Dividend smoothing from PIR Sanctuary activated",
      "8th Ledger oversight increases",
      "Monthly review mandatory",
      "Cannot propose non-maintenance votes",
    ],
  },
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "shadow-red-500/15",
    icon: AlertTriangle,
    description: "8th Ledger can force asset sale, merger, or restructuring without hall vote.",
    effects: [
      "Closure Protocol may be activated",
      "8th Ledger can force sale without hall vote",
      "All non-essential spending frozen",
      "Emergency PIR override available",
    ],
  },
};

//  Helpers

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-cyan-500";
  if (score >= 40) return "bg-amber-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function getGaugeRotation(score: number): number {
  // Map 0-100 to -90deg to 90deg
  return -90 + (score / 100) * 180;
}

//  Metric Row ──

function MetricRow({ metric, index }: { metric: AhgiMetric; index: number }) {
  const pct = Math.min(100, Math.max(0, (metric.value / metric.target) * 100));
  const isGood = metric.value >= metric.target;
  const isImproving = metric.trend > 0;
  const isDeclining = metric.trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-300">{metric.name}</span>
          <span className="text-[10px] text-slate-500">
            {metric.value}{metric.unit} / {metric.target}{metric.unit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-bold font-mono",
            isGood ? "text-emerald-400" : "text-amber-400"
          )}>
            {pct.toFixed(1)}%
          </span>
          <span className={cn(
            "flex items-center gap-0.5 text-[10px]",
            isImproving ? "text-emerald-400" : isDeclining ? "text-red-400" : "text-slate-500"
          )}>
            {isImproving ? <ArrowUpRight className="h-3 w-3" /> : isDeclining ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {metric.trend !== 0 ? `${Math.abs(metric.trend)}%` : ""}
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 + index * 0.08 }}
          className={cn(
            "h-full rounded-full",
            pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-cyan-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
          )}
        />
      </div>

      <p className="text-[10px] text-slate-600 leading-snug">
        {metric.description}
      </p>
    </motion.div>
  );
}

//  Gauge Component ─

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const rotation = getGaugeRotation(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20">
        {/* Background arc */}
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
          />
          {/* Progress arc */}
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 264} 264`}
            className={color.replace("text-", "text-")}
            initial={{ strokeDasharray: "0 264" }}
            animate={{ strokeDasharray: `${(score / 100) * 264} 264` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-lg font-black", color)}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">
        {label}
      </span>
    </div>
  );
}

//  Main Component

export function AhgiDisplay({
  data,
  onViewHistory,
  onViewAudit,
  onSubmitImprovementPlan,
  className,
}: AhgiDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const statusCfg = STATUS_CONFIG[data.status];
  const StatusIcon = statusCfg.icon;
  const vertCfg = VERTICAL_CONFIG[data.vertical];
  const VertIcon = vertCfg.icon;
  const scoreDiff = data.overallScore - data.previousScore;
  const isImproving = scoreDiff > 0;
  const isDeclining = scoreDiff < 0;

  // Calculate formula display
  const calculatedScore = Math.round(data.healthScore * 0.4 + data.growthScore * 0.6);
  const formulaMatch = calculatedScore === data.overallScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-slate-950/90 backdrop-blur-md",
        statusCfg.border,
        statusCfg.glow,
        className
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-1.5 w-full", getScoreBg(data.overallScore))} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", vertCfg.bg)}>
              <VertIcon className={cn("h-7 w-7", vertCfg.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={cn("text-2xl font-black tracking-tight", getScoreColor(data.overallScore))}>
                  {data.overallScore}
                </h2>
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  statusCfg.bg,
                  statusCfg.color,
                  statusCfg.border
                )}>
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  isImproving ? "text-emerald-400" : isDeclining ? "text-red-400" : "text-slate-500"
                )}>
                  {isImproving ? <TrendingUp className="h-3.5 w-3.5" /> : isDeclining ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  {isImproving ? "+" : ""}{scoreDiff} from last month
                </span>
                <span className="text-[10px] text-slate-600">
                  (was {data.previousScore})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recalc in {daysUntil(data.nextRecalculationAt)}d
            </span>
            {data.status === "critical" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/20 animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5" />
                Closure Risk
              </span>
            )}
            {data.status === "stagnant" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/20">
                <Wrench className="h-2.5 w-2.5" />
                Plan Required
              </span>
            )}
          </div>
        </div>

        {/* Hall identity */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
          <Hash className="h-3 w-3" />
          <span className="font-mono">{data.hallId}</span>
          <span className="text-slate-700">•</span>
          <span>{data.hallName}</span>
          <span className="text-slate-700">•</span>
          <span className={cn("font-medium", vertCfg.color)}>{vertCfg.label}</span>
          <span className="text-slate-700">•</span>
          <span>Class {data.hallClass}</span>
        </div>

        {/* Gauges */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <ScoreGauge
            score={data.overallScore}
            label="AHGI"
            color={getScoreColor(data.overallScore)}
          />
          <ScoreGauge
            score={data.healthScore}
            label="Health (×0.4)"
            color={getScoreColor(data.healthScore)}
          />
          <ScoreGauge
            score={data.growthScore}
            label="Growth (×0.6)"
            color={getScoreColor(data.growthScore)}
          />
        </div>

        {/* Formula verification */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-slate-600 font-mono">
            ({data.healthScore} × 0.4) + ({data.growthScore} × 0.6) = {calculatedScore}
            {!formulaMatch && <span className="text-amber-400 ml-1">(rounded to {data.overallScore})</span>}
          </p>
        </div>

        {/* Status Effects */}
        <div className="mt-5 rounded-xl border border-slate-800/50 bg-slate-900/40 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            {statusCfg.label} Status — Effects
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            {statusCfg.description}
          </p>

          {statusCfg.effects.length > 0 && (
            <ul className="space-y-1.5">
              {statusCfg.effects.map((effect, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  {data.status === "critical" || data.status === "declining" ? (
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  ) : (
                    <Unlock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  )}
                  <span className={cn(
                    data.status === "critical" || data.status === "declining" ? "text-red-400/90" : "text-slate-300"
                  )}>
                    {effect}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {(data.status === "stagnant" || data.status === "declining") && onSubmitImprovementPlan && (
            <button
              onClick={onSubmitImprovementPlan}
              className="mt-4 w-full rounded-lg bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="h-3.5 w-3.5" />
              Submit Improvement Plan
            </button>
          )}
        </div>

        {/* Expandable Metrics */}
        <div className="mt-4">
          <button
            onClick={() => setExpanded((e) => !e)}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
              expanded
                ? "border-slate-700 bg-slate-900/60"
                : "border-slate-800/50 bg-slate-900/30 hover:border-slate-700/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Detailed Metrics</span>
              <span className="text-[10px] text-slate-500">
                {data.healthMetrics.length + data.growthMetrics.length} indicators
              </span>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-4 mt-2 space-y-5">
                  {/* Health Metrics */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <HeartPulse className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Health Metrics (40%)
                      </h3>
                      <span className="text-xs font-bold text-cyan-400 font-mono">{data.healthScore}</span>
                    </div>
                    <div className="space-y-4">
                      {data.healthMetrics.map((metric, i) => (
                        <MetricRow key={metric.name} metric={metric} index={i} />
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-800/50" />

                  {/* Growth Metrics */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Growth Metrics (60%)
                      </h3>
                      <span className="text-xs font-bold text-emerald-400 font-mono">{data.growthScore}</span>
                    </div>
                    <div className="space-y-4">
                      {data.growthMetrics.map((metric, i) => (
                        <MetricRow key={metric.name} metric={metric} index={i} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Historical Trend */}
        {data.historicalSnapshots && data.historicalSnapshots.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                showHistory
                  ? "border-slate-700 bg-slate-900/60"
                  : "border-slate-800/50 bg-slate-900/30 hover:border-slate-700/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-200">AHGI Trend</span>
                <span className="text-[10px] text-slate-500">
                  {data.historicalSnapshots.length} months
                </span>
              </div>
              {showHistory ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-4 mt-2">
                    <div className="flex items-end gap-1 h-28 px-2">
                      {data.historicalSnapshots.map((snap, i) => {
                        const height = Math.max(12, (snap.score / 100) * 100);
                        const snapStatus = STATUS_CONFIG[snap.status];
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center gap-1 group"
                          >
                            <div className="relative w-full flex justify-center">
                              <div
                                className={cn(
                                  "w-full max-w-[28px] rounded-t-sm transition-all duration-300 group-hover:opacity-100",
                                  snapStatus.color.replace("text-", "bg-")
                                )}
                                style={{ height: `${height}%`, opacity: 0.75 }}
                              />
                              <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {snap.score}
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-600">
                              {snap.date.toLocaleDateString("en-US", { month: "short" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800/50 flex flex-wrap items-center gap-2">
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Full History
            </button>
          )}
          {onViewAudit && (
            <button
              onClick={onViewAudit}
              className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              Audit Trail
            </button>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-600">
            <Gauge className="h-3 w-3" />
            <span>AHGI Engine v1.0 — 8th Ledger</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

//  Skeleton ─

export function AhgiDisplaySkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-20 rounded bg-slate-800 animate-pulse" />
            <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-24 rounded-full bg-slate-800 animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded bg-slate-800 animate-pulse" />
        ))}
      </div>
      <div className="h-32 rounded-xl bg-slate-800 animate-pulse" />
      <div className="h-12 rounded-xl bg-slate-800 animate-pulse" />
    </div>
  );
}

export default AhgiDisplay;
