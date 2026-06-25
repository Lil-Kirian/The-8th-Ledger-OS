"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Clock,
  ShoppingCart,
  ChevronRight,
  Gauge,
  Target,
  Skull,
  ArrowRight,
  BarChart3,
  Flame,
  ShieldAlert,
  Package,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesVelocityTrackerProps {
  hallId: string;
  hallName: string;
  totalInventory: number;
  unitsSold: number;
  monthsActive: number;
  salesPerMonth: number;
  communitySplit: number; // current % (starts at 60, drops to 50 if 8th Ledger takes over)
  ledgerTakeoverMonths?: number; // default 6
  warningMonths?: number; // default 3
  reclamationMonths?: number; // default 24
  status: "healthy" | "warning" | "critical" | "ledger_takeover" | "reclaimed";
  lastSaleAt?: string;
}

function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    return () => {
      start = target;
    };
  }, [target, duration]);
  return value;
}

export default function SalesVelocityTracker({
  hallId,
  hallName,
  totalInventory,
  unitsSold,
  monthsActive,
  salesPerMonth,
  communitySplit,
  ledgerTakeoverMonths = 6,
  warningMonths = 3,
  reclamationMonths = 24,
  status,
  lastSaleAt,
}: SalesVelocityTrackerProps) {
  const remaining = totalInventory - unitsSold;
  const sellThroughRate = totalInventory > 0 ? (unitsSold / totalInventory) * 100 : 0;
  const monthsToClear = salesPerMonth > 0 ? remaining / salesPerMonth : Infinity;
  const monthsToLedgerTakeover = Math.max(0, ledgerTakeoverMonths - monthsActive);
  const monthsToReclamation = Math.max(0, reclamationMonths - monthsActive);

  const animatedSold = useAnimatedNumber(unitsSold);
  const animatedRate = useAnimatedNumber(sellThroughRate);

  const statusConfig = {
    healthy: {
      label: "Healthy Velocity",
      color: "text-emerald-400",
      bg: "bg-emerald-900/20",
      border: "border-emerald-700/30",
      icon: TrendingUp,
      pulse: false,
      message: "Sales pace is strong. Community retains full 60% split.",
    },
    warning: {
      label: "Velocity Warning",
      color: "text-amber-400",
      bg: "bg-amber-900/20",
      border: "border-amber-700/30",
      icon: AlertTriangle,
      pulse: true,
      message: `Slow sales detected. 8th Ledger may take over marketing in ${monthsToLedgerTakeover} month${monthsToLedgerTakeover !== 1 ? "s" : ""}.`,
    },
    critical: {
      label: "Critical Velocity",
      color: "text-orange-400",
      bg: "bg-orange-900/20",
      border: "border-orange-700/30",
      icon: Flame,
      pulse: true,
      message: "Community split will drop to 50% if 8th Ledger intervenes.",
    },
    ledger_takeover: {
      label: "8th Ledger Takeover Active",
      color: "text-red-400",
      bg: "bg-red-900/20",
      border: "border-red-700/30",
      icon: Zap,
      pulse: true,
      message: "8th Ledger now handles marketing. Community split reduced to 50%.",
    },
    reclaimed: {
      label: "Asset Reclaimed",
      color: "text-slate-400",
      bg: "bg-slate-800/40",
      border: "border-slate-700/40",
      icon: Skull,
      pulse: false,
      message: "Hall dormant 24 months. 8th Ledger owns asset. All PACs dissolved.",
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  // Timeline markers
  const timelineMarkers = [
    { month: 0, label: "Launch", icon: ShoppingCart },
    { month: warningMonths, label: "Warning", icon: AlertTriangle },
    { month: ledgerTakeoverMonths, label: "8th Ledger Takeover", icon: Zap },
    { month: reclamationMonths, label: "Reclamation", icon: Skull },
  ];

  const currentPosition = Math.min((monthsActive / reclamationMonths) * 100, 100);

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", cfg.bg, cfg.border)}>
            <StatusIcon size={18} className={cn(cfg.color, cfg.pulse && "animate-pulse")} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Sales Velocity</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{hallName}</p>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", cfg.bg, cfg.border, cfg.color)}>
          <StatusIcon size={10} className={cn(cfg.pulse && "animate-pulse")} />
          {cfg.label}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Status Message */}
        <div className={cn("flex items-start gap-3 p-3 rounded-xl border", cfg.bg, cfg.border)}>
          <StatusIcon size={16} className={cn("shrink-0 mt-0.5", cfg.color)} />
          <p className={cn("text-xs leading-relaxed", cfg.color)}>{cfg.message}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Inventory</div>
            <div className="text-lg font-bold text-slate-200 font-mono">{totalInventory.toLocaleString()}</div>
            <div className="text-[10px] text-slate-600">units total</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sold</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">{Math.round(animatedSold).toLocaleString()}</div>
            <div className="text-[10px] text-slate-600">{animatedRate.toFixed(1)}% sell-through</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Remaining</div>
            <div className="text-lg font-bold text-amber-400 font-mono">{remaining.toLocaleString()}</div>
            <div className="text-[10px] text-slate-600">units left</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sales / Mo</div>
            <div className="text-lg font-bold text-blue-400 font-mono">{salesPerMonth.toLocaleString()}</div>
            <div className="text-[10px] text-slate-600">current pace</div>
          </div>
        </div>

        {/* Velocity Projection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Gauge size={10} />
              Clearance Projection
            </span>
            <span className={cn("font-mono", monthsToClear === Infinity ? "text-red-400" : "text-slate-400")}>
              {monthsToClear === Infinity ? "∞" : `${monthsToClear.toFixed(1)} months`}
            </span>
          </div>

          {/* Sell-through bar */}
          <div className="relative h-4 bg-slate-800/40 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-emerald-500/40 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(sellThroughRate, 100)}%` }}
            />
            {/* Warning marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-amber-400/50"
              style={{ left: `${(warningMonths / reclamationMonths) * 100}%` }}
            />
            {/* Takeover marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-400/50"
              style={{ left: `${(ledgerTakeoverMonths / reclamationMonths) * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-600">
            <span>0 sold</span>
            <span className="text-amber-500">{warningMonths}mo warning</span>
            <span className="text-red-500">{ledgerTakeoverMonths}mo takeover</span>
            <span>{reclamationMonths}mo reclaim</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock size={10} />
            Dormancy Timeline
          </div>

          <div className="relative pt-6 pb-2">
            {/* Background line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-slate-800/60" />

            {/* Progress fill */}
            <div
              className="absolute top-8 left-0 h-0.5 bg-emerald-500/40 transition-all duration-1000"
              style={{ width: `${currentPosition}%` }}
            />

            {/* Markers */}
            <div className="relative flex justify-between">
              {timelineMarkers.map((marker) => {
                const position = (marker.month / reclamationMonths) * 100;
                const isPast = monthsActive >= marker.month;
                const isCurrent = Math.abs(monthsActive - marker.month) < 1;

                return (
                  <div
                    key={marker.month}
                    className="flex flex-col items-center"
                    style={{ position: "absolute", left: `${position}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 mb-2 transition-all",
                        isCurrent
                          ? "bg-amber-900/30 border-amber-500 shadow-lg shadow-amber-900/20"
                          : isPast
                          ? "bg-slate-800 border-slate-600"
                          : "bg-slate-900/50 border-slate-800"
                      )}
                    >
                      <marker.icon
                        size={14}
                        className={cn(
                          isCurrent ? "text-amber-400" : isPast ? "text-slate-500" : "text-slate-700"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase whitespace-nowrap",
                        isCurrent ? "text-amber-400" : isPast ? "text-slate-500" : "text-slate-700"
                      )}
                    >
                      {marker.label}
                    </span>
                    <span className="text-[9px] text-slate-600 mt-0.5">{marker.month}mo</span>
                  </div>
                );
              })}
            </div>

            {/* Current position indicator */}
            <div
              className="absolute top-6 z-20"
              style={{ left: `${currentPosition}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-emerald-500" />
              <div className="text-[9px] text-emerald-400 font-mono mt-1 whitespace-nowrap">
                Month {monthsActive}
              </div>
            </div>
          </div>
        </div>

        {/* Community Split */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Percent size={10} />
              Community Split
            </span>
            <span className={cn("font-mono", communitySplit < 60 ? "text-red-400" : "text-emerald-400")}>
              {communitySplit}%
            </span>
          </div>
          <div className="h-3 bg-slate-800/40 rounded-full overflow-hidden flex">
            <div
              className={cn(
                "h-full transition-all duration-700 flex items-center justify-center text-[9px] font-bold",
                communitySplit >= 60 ? "bg-emerald-500/40 text-emerald-300" : "bg-red-500/40 text-red-300"
              )}
              style={{ width: `${communitySplit}%` }}
            >
              {communitySplit >= 20 && `${communitySplit}% Community`}
            </div>
            <div
              className="h-full bg-amber-500/30 flex items-center justify-center text-[9px] font-bold text-amber-300"
              style={{ width: `${100 - communitySplit}%` }}
            >
              {100 - communitySplit >= 20 && `${100 - communitySplit}% 8th Ledger`}
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>Community keeps {communitySplit}% of sales</span>
            <span>8th Ledger takes {100 - communitySplit}%</span>
          </div>
        </div>

        {/* Last Sale */}
        {lastSaleAt && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Package size={14} />
              <span>Last Sale</span>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              {new Date(lastSaleAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Action CTA */}
        {status === "warning" || status === "critical" ? (
          <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-800/20 flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-400 mb-1">Action Required</div>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                List more items, share your marketplace links, or propose a price reduction. If sales
                don't improve, 8th Ledger will take over marketing in {monthsToLedgerTakeover} month
                {monthsToLedgerTakeover !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        ) : status === "ledger_takeover" ? (
          <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 flex items-start gap-3">
            <Zap size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-red-400 mb-1">8th Ledger Marketing Active</div>
              <p className="text-xs text-red-300/80 leading-relaxed">
                8th Ledger is now managing all sales and marketing. Community split is reduced to 50%.
                You still earn ownership dividends. {monthsToReclamation} months until potential reclamation.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}