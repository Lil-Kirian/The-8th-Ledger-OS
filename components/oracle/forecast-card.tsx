"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Globe,
  Clock,
  Lock,
  Unlock,
  TrendingUp,
  Users,
  ChevronRight,
  Sparkles,
  Target,
} from "lucide-react";

interface ForecastCardProps {
  forecast: {
    id: string;
    title: string;
    type: "meridian" | "asset_launch";
    continent?: string;
    verticalOptions: string[];
    countryOptions: string[];
    lockDate: Date;
    status: "ACTIVE" | "LOCKED" | "RESOLVED";
    resolvedOutcome?: {
      vertical: string;
      country: string;
    };
    totalPredictions: number;
  };
  hasPredicted: boolean;
  onPredict: (forecastId: string) => void;
  onView: (forecastId: string) => void;
}

export default function ForecastCard({
  forecast,
  hasPredicted,
  onPredict,
  onView,
}: ForecastCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isLocked = forecast.status === "LOCKED" || forecast.status === "RESOLVED";
  const isResolved = forecast.status === "RESOLVED";

  const timeUntilLock = Math.max(0, new Date(forecast.lockDate).getTime() - Date.now());
  const hoursLeft = Math.floor(timeUntilLock / (1000 * 60 * 60));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-slate-900 border rounded-xl overflow-hidden transition-all ${
        isResolved
          ? "border-slate-800 opacity-75"
          : isLocked
          ? "border-amber-900/50"
          : "border-slate-800 hover:border-cyan-900/50"
      }`}
    >
      {/* Status Banner */}
      {isResolved && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-slate-800/80 px-3 py-1.5 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">Resolved</span>
        </div>
      )}
      {forecast.status === "LOCKED" && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-amber-950/50 border-b border-amber-900/50 px-3 py-1.5 flex items-center justify-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-400 uppercase tracking-wider">Locked — Awaiting Reveal</span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isResolved
                  ? "bg-slate-800 text-slate-500"
                  : "bg-cyan-950/30 text-cyan-400 border border-cyan-900/50"
              }`}
            >
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{forecast.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {forecast.continent || "Global"}
                </span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-slate-500 uppercase">
                  {forecast.type === "meridian" ? "Meridian Cycle" : "Asset Launch"}
                </span>
              </div>
            </div>
          </div>
          {hasPredicted && !isResolved && (
            <span className="px-2 py-1 rounded-md bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 text-xs font-bold">
              PREDICTED
            </span>
          )}
          {isResolved && forecast.resolvedOutcome && (
            <span className="px-2 py-1 rounded-md bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-bold">
              RESOLVED
            </span>
          )}
        </div>

        {/* Options Preview */}
        <div className="space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-wider">
            {forecast.status === "ACTIVE" ? "Predict the winner" : "Outcome"}
          </div>
          <div className="flex flex-wrap gap-2">
            {forecast.verticalOptions.slice(0, 4).map((v) => (
              <span
                key={v}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  isResolved && forecast.resolvedOutcome?.vertical === v
                    ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
                    : "bg-slate-950/50 border-slate-800 text-slate-400"
                }`}
              >
                {v}
              </span>
            ))}
            {forecast.verticalOptions.length > 4 && (
              <span className="px-2.5 py-1 rounded-md text-xs text-slate-600">
                +{forecast.verticalOptions.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Countries */}
        <div className="flex flex-wrap gap-1.5">
          {forecast.countryOptions.slice(0, 6).map((c) => (
            <span
              key={c}
              className={`px-2 py-0.5 rounded text-xs ${
                isResolved && forecast.resolvedOutcome?.country === c
                  ? "bg-emerald-950/30 text-emerald-400"
                  : "bg-slate-950 text-slate-600"
              }`}
            >
              {c}
            </span>
          ))}
          {forecast.countryOptions.length > 6 && (
            <span className="px-2 py-0.5 rounded text-xs text-slate-700">
              +{forecast.countryOptions.length - 6}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {forecast.totalPredictions.toLocaleString()}
            </span>
            {!isResolved && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {hoursLeft > 0 ? `${hoursLeft}h left` : "Closing soon"}
              </span>
            )}
          </div>

          {isResolved ? (
            <button
              onClick={() => onView(forecast.id)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              View Results
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : isLocked ? (
            <span className="px-3 py-1.5 text-xs text-amber-400/70 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPredict(forecast.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                hasPredicted
                  ? "bg-slate-800 text-slate-500 cursor-default"
                  : "bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 hover:bg-cyan-950/50"
              }`}
            >
              {hasPredicted ? (
                <>
                  <Target className="w-3.5 h-3.5" />
                  Predicted
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Predict
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}