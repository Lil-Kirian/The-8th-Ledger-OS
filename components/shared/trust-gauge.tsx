"use client";

import React from "react";
import { motion } from "framer-motion";

interface TrustGaugeProps {
  score: number;
  tier: number;
  nextTierMin?: number;
  currentTierMin?: number;
}

export function TrustGauge({ score, tier, nextTierMin, currentTierMin = 0 }: TrustGaugeProps) {
  const range = nextTierMin ? nextTierMin - currentTierMin : 1000 - currentTierMin;
  const progress = nextTierMin ? Math.min(((score - currentTierMin) / range) * 100, 100) : 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#0a0a14] to-[#0f0f1a] p-6 sm:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-[80px]" />
      <div className="relative flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
          <span className="font-space text-3xl font-bold text-white">{score}</span>
        </div>
        <h2 className="font-space text-xl font-semibold text-white">Trust Score</h2>
        <p className="mt-1 text-sm text-slate-400">Tier {tier}</p>
        {nextTierMin && (
          <div className="mt-4 w-full max-w-xs">
            <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>{currentTierMin}</span>
              <span className="text-indigo-300">{nextTierMin} to unlock next tier</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">{nextTierMin - score} points to next tier</p>
          </div>
        )}
      </div>
    </div>
  );
}