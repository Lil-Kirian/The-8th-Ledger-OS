"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface AHGITrendProps {
  data: {
    month: string;
    health: number;
    growth: number;
    combined: number;
  }[];
  vertical: string;
  showProjection?: boolean;
  projectionMonths?: number;
}

export default function AHGITrend({
  data,
  vertical,
  showProjection = false,
  projectionMonths = 3,
}: AHGITrendProps) {
  const maxValue = 100;
  const chartHeight = 200;
  const barWidth = 100 / (data.length + (showProjection ? projectionMonths : 0));

  // Calculate trend
  const current = data[data.length - 1];
  const previous = data[data.length - 2] || current;
  const healthTrend = current.health - previous.health;
  const growthTrend = current.growth - previous.growth;
  const combinedTrend = current.combined - previous.combined;

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />;
    if (trend < 0) return <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-amber-400" />;
  };

  // Generate simple projection
  const projection = useMemo(() => {
    if (!showProjection) return [];
    const last = data[data.length - 1];
    const projected = [];
    for (let i = 1; i <= projectionMonths; i++) {
      projected.push({
        month: `+${i}M`,
        health: Math.max(0, Math.min(100, last.health + (Math.random() - 0.3) * 10)),
        growth: Math.max(0, Math.min(100, last.growth + (Math.random() - 0.3) * 10)),
        combined: 0,
        isProjection: true,
      });
    }
    return projected;
  }, [data, showProjection, projectionMonths]);

  const allData = [...data, ...projection];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            AHGI Trend
          </h3>
          <span className="text-xs text-slate-500">({vertical})</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            {getTrendIcon(healthTrend)}
            <span className="text-slate-400">Health {healthTrend > 0 ? "+" : ""}{healthTrend}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(growthTrend)}
            <span className="text-slate-400">Growth {growthTrend > 0 ? "+" : ""}{growthTrend}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(combinedTrend)}
            <span className="text-slate-400">AHGI {combinedTrend > 0 ? "+" : ""}{combinedTrend}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[100, 75, 50, 25, 0].map((val) => (
            <div key={val} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-700 w-6 text-right">{val}</span>
              <div className="flex-1 h-px bg-slate-800/50" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 pl-8 flex items-end gap-1">
          {allData.map((d, i) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Combined bar (background) */}
              <div className="relative w-full flex items-end gap-px" style={{ height: chartHeight - 20 }}>
                {/* Health segment */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.health / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className={`flex-1 rounded-t-sm ${d.isProjection ? "bg-rose-500/20 border border-rose-900/30 border-b-0" : "bg-rose-500/40"}`}
                />
                {/* Growth segment */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.growth / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 + 0.1 }}
                  className={`flex-1 rounded-t-sm ${d.isProjection ? "bg-cyan-500/20 border border-cyan-900/30 border-b-0" : "bg-cyan-500/40"}`}
                />

                {/* Tooltip on hover */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap shadow-xl">
                    <div className="text-rose-400">H: {Math.round(d.health)}</div>
                    <div className="text-cyan-400">G: {Math.round(d.growth)}</div>
                    <div className="text-slate-400">C: {Math.round((d.health * 0.4) + (d.growth * 0.6))}</div>
                  </div>
                </div>
              </div>

              {/* Month label */}
              <span className={`text-[10px] ${d.isProjection ? "text-slate-600 italic" : "text-slate-500"}`}>
                {d.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-rose-500/40 rounded-sm" />
          <span className="text-xs text-slate-500">Health (40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500/40 rounded-sm" />
          <span className="text-xs text-slate-500">Growth (60%)</span>
        </div>
        {showProjection && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 border border-slate-600 rounded-sm" />
            <span className="text-xs text-slate-600">Projection</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/50">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Avg Health</div>
          <div className="text-lg font-bold text-rose-400">
            {Math.round(data.reduce((sum, d) => sum + d.health, 0) / data.length)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Avg Growth</div>
          <div className="text-lg font-bold text-cyan-400">
            {Math.round(data.reduce((sum, d) => sum + d.growth, 0) / data.length)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Avg AHGI</div>
          <div className="text-lg font-bold text-slate-200">
            {Math.round(data.reduce((sum, d) => sum + d.combined, 0) / data.length)}
          </div>
        </div>
      </div>
    </div>
  );
}