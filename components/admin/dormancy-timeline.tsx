"use client";

import React, { useState } from "react";
import {
  Clock,
  AlertTriangle,
  Skull,
  Crown,
  ChevronRight,
  Calendar,
  RotateCcw,
  Lock,
  Eye,
  Ban,
  Zap,
  TrendingDown,
  CheckCircle2,
  X,
  Timer,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DormancyStage = "healthy" | "warning" | "critical" | "forfeited" | "reclaimed";

interface DormancyTimelineProps {
  hallId: string;
  hallName: string;
  type: "account" | "asset";
  targetName: string;
  targetLedgerId?: string;
  currentStage: DormancyStage;
  monthsInactive: number;
  warningDate?: string;
  criticalDate?: string;
  forfeitureDate?: string;
  lastActivity?: string;
  canReclaim?: boolean;
  onReclaim?: () => void;
  onRevive?: () => void;
}

const stageConfig: Record<
  DormancyStage,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; description: string }
> = {
  healthy: {
    label: "Healthy",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: CheckCircle2,
    description: "Active and in good standing",
  },
  warning: {
    label: "Warning",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: AlertTriangle,
    description: "Approaching dormancy threshold",
  },
  critical: {
    label: "Critical",
    color: "text-orange-400",
    bg: "bg-orange-900/20",
    border: "border-orange-700/30",
    icon: ShieldAlert,
    description: "Immediate action required",
  },
  forfeited: {
    label: "Forfeited",
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/30",
    icon: Ban,
    description: "Ownership redistributed or reclaimed",
  },
  reclaimed: {
    label: "Reclaimed",
    color: "text-slate-400",
    bg: "bg-slate-800/40",
    border: "border-slate-700/40",
    icon: Skull,
    description: "8th Ledger holds full ownership",
  },
};

const timelineMarkers = [
  { month: 0, label: "Active", icon: CheckCircle2, stage: "healthy" as DormancyStage },
  { month: 12, label: "12 Mo Warning", icon: AlertTriangle, stage: "warning" as DormancyStage },
  { month: 18, label: "18 Mo Critical", icon: ShieldAlert, stage: "critical" as DormancyStage },
  { month: 24, label: "24 Mo Reclaim", icon: Skull, stage: "reclaimed" as DormancyStage },
];

export default function DormancyTimeline({
  hallId,
  hallName,
  type,
  targetName,
  targetLedgerId,
  currentStage,
  monthsInactive,
  warningDate,
  criticalDate,
  forfeitureDate,
  lastActivity,
  canReclaim,
  onReclaim,
  onRevive,
}: DormancyTimelineProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const cfg = stageConfig[currentStage];
  const StatusIcon = cfg.icon;

  const maxMonths = 24;
  const progress = Math.min((monthsInactive / maxMonths) * 100, 100);

  const getMarkerPosition = (month: number) => (month / maxMonths) * 100;

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", cfg.bg, cfg.border)}>
            <StatusIcon size={18} className={cfg.color} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              {type === "account" ? "Account Dormancy" : "Asset Dormancy"}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {hallName} • {type === "account" ? targetLedgerId : `Hall #${hallId.slice(-6)}`}
            </p>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", cfg.bg, cfg.border, cfg.color)}>
          <StatusIcon size={10} />
          {cfg.label}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Target Info */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-sm font-bold text-slate-400">
            {targetName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-200">{targetName}</div>
            {targetLedgerId && (
              <div className="text-[10px] text-slate-600 font-mono">{targetLedgerId}</div>
            )}
            <div className="text-[10px] text-slate-500 mt-0.5">{cfg.description}</div>
          </div>
          {lastActivity && (
            <div className="text-right shrink-0">
              <div className="text-[10px] text-slate-500 uppercase">Last Active</div>
              <div className="text-xs text-slate-300 font-mono">
                {new Date(lastActivity).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Visual */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Timer size={10} />
              Dormancy Timeline
            </span>
            <span className="font-mono text-slate-400">
              Month {monthsInactive} / {maxMonths}
            </span>
          </div>

          {/* The bar */}
          <div className="relative pt-8 pb-4">
            {/* Background track */}
            <div className="h-3 bg-slate-800/40 rounded-full overflow-hidden">
              {/* Progress fill */}
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  currentStage === "healthy" || currentStage === "warning"
                    ? "bg-emerald-500/40"
                    : currentStage === "critical"
                    ? "bg-amber-500/40"
                    : "bg-red-500/40"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Markers */}
            <div className="relative mt-2">
              {timelineMarkers.map((marker) => {
                const MarkerIcon = marker.icon;
                const position = getMarkerPosition(marker.month);
                const isPast = monthsInactive >= marker.month;
                const isNext = monthsInactive < marker.month && monthsInactive >= marker.month - 3;

                return (
                  <div
                    key={marker.month}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 -mt-5 transition-all",
                        isPast
                          ? "bg-slate-800 border-slate-600"
                          : isNext
                          ? "bg-amber-900/30 border-amber-500 animate-pulse"
                          : "bg-slate-900/50 border-slate-800"
                      )}
                    >
                      <MarkerIcon
                        size={12}
                        className={isPast ? "text-slate-500" : isNext ? "text-amber-400" : "text-slate-700"}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase mt-1 whitespace-nowrap",
                        isPast ? "text-slate-500" : isNext ? "text-amber-400" : "text-slate-700"
                      )}
                    >
                      {marker.label}
                    </span>
                  </div>
                );
              })}

              {/* Current position indicator */}
              <div
                className="absolute top-0 z-20"
                style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
              >
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-400 -mt-2" />
                <div className="text-[9px] text-cyan-400 font-mono mt-1 whitespace-nowrap">
                  Now
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timelineMarkers.map((marker) => {
            const MarkerIcon = marker.icon;
            const stageCfg = stageConfig[marker.stage];
            const isCurrent = currentStage === marker.stage;
            const isPast = monthsInactive >= marker.month && !isCurrent;

            return (
              <div
                key={marker.month}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  isCurrent
                    ? `${stageCfg.bg} ${stageCfg.border}`
                    : isPast
                    ? "bg-slate-900/20 border-slate-800/20 opacity-50"
                    : "bg-slate-800/10 border-slate-800/20"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 mx-auto rounded-lg flex items-center justify-center border mb-2",
                    isCurrent ? stageCfg.bg : "bg-slate-800/30",
                    isCurrent ? stageCfg.border : "border-slate-700/30"
                  )}
                >
                  <MarkerIcon size={14} className={isCurrent ? stageCfg.color : "text-slate-600"} />
                </div>
                <div className={cn("text-[10px] font-bold uppercase", isCurrent ? stageCfg.color : "text-slate-600")}>
                  {marker.label}
                </div>
                <div className="text-[9px] text-slate-700 mt-0.5">
                  {marker.month === 0 ? "Active" : `${marker.month} months`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Dates */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Key Dates</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {warningDate && (
              <div className="p-3 rounded-lg bg-amber-950/10 border border-amber-800/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-900/20 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-500 uppercase">Warning</div>
                  <div className="text-xs text-amber-300 font-mono">
                    {new Date(warningDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            {criticalDate && (
              <div className="p-3 rounded-lg bg-orange-950/10 border border-orange-800/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-900/20 flex items-center justify-center">
                  <ShieldAlert size={14} className="text-orange-400" />
                </div>
                <div>
                  <div className="text-[10px] text-orange-500 uppercase">Critical</div>
                  <div className="text-xs text-orange-300 font-mono">
                    {new Date(criticalDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            {forfeitureDate && (
              <div className="p-3 rounded-lg bg-red-950/10 border border-red-800/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-900/20 flex items-center justify-center">
                  <Skull size={14} className="text-red-400" />
                </div>
                <div>
                  <div className="text-[10px] text-red-500 uppercase">Forfeiture</div>
                  <div className="text-xs text-red-300 font-mono">
                    {new Date(forfeitureDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canReclaim && currentStage !== "reclaimed" && (
            <>
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-red-600 border border-red-500 text-white text-sm font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
                >
                  <Crown size={16} />
                  Reclaim {type === "account" ? "PACs" : "Asset"}
                </button>
              ) : (
                <div className="flex-1 p-4 rounded-xl bg-red-950/10 border border-red-800/20 space-y-3 animate-in slide-in-from-top-2">
                  <div className="text-xs text-red-300 font-bold flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Confirm Reclamation
                  </div>
                  <p className="text-xs text-red-300/70 leading-relaxed">
                    This will permanently {type === "account" ? "redistribute all PACs to active owners" : "transfer full asset ownership to 8th Ledger treasury"}.
                    This action is irreversible.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 rounded-lg border border-slate-700/40 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onReclaim?.();
                        setShowConfirm(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 border border-red-500 text-white text-xs font-bold hover:bg-red-500 transition-all"
                    >
                      Confirm Reclaim
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {currentStage === "warning" || currentStage === "critical" ? (
            <button
              onClick={onRevive}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 border border-emerald-500 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
            >
              <RotateCcw size={16} />
              Revive {type === "account" ? "Account" : "Asset"}
            </button>
          ) : null}
        </div>

        {/* Rules Footer */}
        <div className="pt-3 border-t border-slate-800/40 space-y-2">
          <div className="flex items-start gap-2 text-[10px] text-slate-600">
            <Clock size={10} className="shrink-0 mt-0.5" />
            <span>
              <span className="font-bold text-slate-500">Account:</span> 12mo warning → 18mo critical → 24mo forfeiture. PACs redistributed to active owners in same Hall.
            </span>
          </div>
          <div className="flex items-start gap-2 text-[10px] text-slate-600">
            <Skull size={10} className="shrink-0 mt-0.5" />
            <span>
              <span className="font-bold text-slate-500">Asset:</span> 12mo warning → 18mo critical → 24mo reclamation. 8th Ledger takes full ownership. All PACs dissolved.
            </span>
          </div>
          <div className="flex items-start gap-2 text-[10px] text-slate-600">
            <Zap size={10} className="shrink-0 mt-0.5" />
            <span>
              Active rent-paying assets (LedgerProp/LedgerAuto) are NOT dormant even if the Sovereign Stream is quiet.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}