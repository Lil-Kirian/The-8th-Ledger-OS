// components/halls/sri-display.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Medal,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Vote,
  DollarSign,
  CheckCircle2,
  FileText,
  Users,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  BadgeCheck,
  Ban,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export type SriTier = "platinum" | "gold" | "silver" | "bronze" | "at_risk";

export interface SriComponent {
  name: string;
  weight: number; // percentage
  score: number; // 0-100
  trend: number; // change from last month
  description: string;
}

export interface SriData {
  hallId: string;
  hallName: string;
  overallScore: number;
  tier: SriTier;
  previousScore: number;
  recordedAt: Date;
  components: SriComponent[];
  nextRecalculationAt: Date;
  historicalSnapshots?: { date: Date; score: number; tier: SriTier }[];
}

export interface SriDisplayProps {
  data: SriData;
  onViewHistory?: () => void;
  onViewAudit?: () => void;
  className?: string;
}

//  Tier Config ─

const TIER_CONFIG: Record<
  SriTier,
  {
    label: string;
    badge: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    glow: string;
    effects: string[];
    restrictions: string[];
  }
> = {
  platinum: {
    label: "Platinum",
    badge: "👑",
    icon: Crown,
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/15",
    effects: [
      "Early access to next cycle pools (24h before public)",
      "Featured in the Agora hall showcase",
      "Reduced marketplace fees: 0.25% (vs 1%)",
      "Priority 8th Ledger support",
      "Name engraved on hall registry",
    ],
    restrictions: [],
  },
  gold: {
    label: "Gold",
    badge: "🥇",
    icon: Medal,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-500/15",
    effects: [
      "Reduced marketplace fees: 0.5% (vs 1%)",
      "Priority support queue",
      "Hall eligibility for expansion proposals",
    ],
    restrictions: [],
  },
  silver: {
    label: "Silver",
    badge: "🥈",
    icon: Shield,
    color: "text-slate-300",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
    glow: "shadow-slate-400/10",
    effects: ["Standard operation", "Full voting rights", "Standard marketplace fees (1%)"],
    restrictions: [],
  },
  bronze: {
    label: "Bronze",
    badge: "🥉",
    icon: AlertTriangle,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/10",
    effects: ["Standard operation", "Full voting rights"],
    restrictions: [
      "Cannot propose new hires or staffing votes",
      "Cannot propose expansion or inventory orders",
      "Maintenance votes only",
    ],
  },
  at_risk: {
    label: "At Risk",
    badge: "⚠️",
    icon: Ban,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "shadow-red-500/15",
    effects: ["8th Ledger oversight mode activated"],
    restrictions: [
      "Dividend distribution paused until reforms complete",
      "Architect can force governance reforms",
      "Cannot propose any votes except compliance-related",
      "Marketplace listings suspended",
      "SRI recalculation every 7 days (vs monthly)",
    ],
  },
};

const COMPONENT_ICONS: Record<string, React.ElementType> = {
  "Governance Activity": Vote,
  "Revenue Consistency": DollarSign,
  "Dividend Reliability": CheckCircle2,
  "Proposal Quality": FileText,
  "Dormancy Rate": Users,
  "Marketplace Velocity": ShoppingCart,
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
  if (score >= 90) return "text-amber-300";
  if (score >= 75) return "text-yellow-400";
  if (score >= 60) return "text-slate-300";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "bg-amber-500";
  if (score >= 75) return "bg-yellow-500";
  if (score >= 60) return "bg-slate-400";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

//  Main Component

export function SriDisplay({
  data,
  onViewHistory,
  onViewAudit,
  className,
}: SriDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const tierCfg = TIER_CONFIG[data.tier];
  const TierIcon = tierCfg.icon;
  const scoreDiff = data.overallScore - data.previousScore;
  const isImproving = scoreDiff > 0;
  const isDeclining = scoreDiff < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-slate-950/90 backdrop-blur-md",
        tierCfg.border,
        tierCfg.glow,
        className
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-1.5 w-full", getScoreBg(data.overallScore))} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", tierCfg.bg)}>
              <TierIcon className={cn("h-7 w-7", tierCfg.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={cn("text-2xl font-black tracking-tight", tierCfg.color)}>
                  {data.overallScore}
                </h2>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  tierCfg.bg,
                  tierCfg.color,
                  tierCfg.border
                )}>
                  {tierCfg.badge} {tierCfg.label}
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
            {data.tier === "at_risk" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/20 animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5" />
                Oversight Active
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
          <span>Recorded {formatDate(data.recordedAt)}</span>
        </div>

        {/* Component Breakdown */}
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            Component Breakdown
          </p>

          {data.components.map((comp, index) => {
            const Icon = COMPONENT_ICONS[comp.name] || Star;
            const compColor = getScoreBg(comp.score);
            const compTextColor = getScoreColor(comp.score);

            return (
              <motion.div
                key={comp.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", compTextColor)} />
                    <span className="text-xs font-medium text-slate-300">{comp.name}</span>
                    <span className="text-[10px] text-slate-600">({comp.weight}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold font-mono", compTextColor)}>
                      {comp.score}
                    </span>
                    <span className={cn(
                      "flex items-center gap-0.5 text-[10px]",
                      comp.trend > 0 ? "text-emerald-400" : comp.trend < 0 ? "text-red-400" : "text-slate-500"
                    )}>
                      {comp.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : comp.trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {comp.trend !== 0 ? Math.abs(comp.trend) : ""}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${comp.score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.1 }}
                    className={cn("h-full rounded-full", compColor)}
                  />
                </div>

                <p className="text-[10px] text-slate-600 leading-snug">
                  {comp.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Tier Effects & Restrictions */}
        <div className="mt-5 rounded-xl border border-slate-800/50 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {tierCfg.label} Tier Effects
            </p>
            <span className="text-[10px] text-slate-600">
              Score: {data.overallScore}/100
            </span>
          </div>

          {/* Effects */}
          {tierCfg.effects.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {tierCfg.effects.map((effect, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <Unlock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Restrictions */}
          {tierCfg.restrictions.length > 0 && (
            <>
              <div className="h-px bg-slate-800/50 my-3" />
              <ul className="space-y-1.5">
                {tierCfg.restrictions.map((restriction, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-400/90">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    <span>{restriction}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Historical Trend (mini chart) */}
        {data.historicalSnapshots && data.historicalSnapshots.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800/50 bg-slate-900/30 px-4 py-3 text-left transition-all hover:border-slate-700/50"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-200">SRI History</span>
                <span className="text-[10px] text-slate-500">
                  {data.historicalSnapshots.length} snapshots
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
                    <div className="flex items-end gap-1 h-24 px-2">
                      {data.historicalSnapshots.map((snap, i) => {
                        const height = Math.max(10, (snap.score / 100) * 100);
                        const snapCfg = TIER_CONFIG[snap.tier];
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center gap-1 group"
                          >
                            <div className="relative w-full flex justify-center">
                              <div
                                className={cn(
                                  "w-full max-w-[24px] rounded-t-sm transition-all duration-300 group-hover:opacity-100",
                                  snapCfg.color.replace("text-", "bg-")
                                )}
                                style={{ height: `${height}%`, opacity: 0.7 }}
                              />
                              <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">
                                {snap.score}
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-600 rotate-0 whitespace-nowrap">
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
            <Star className="h-3 w-3" />
            <span>SRI Engine v1.0 — 8th Ledger</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

//  Skeleton ─

export function SriDisplaySkeleton() {
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
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-12 rounded bg-slate-800 animate-pulse" />
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-32 rounded-xl bg-slate-800 animate-pulse" />
    </div>
  );
}

export default SriDisplay;