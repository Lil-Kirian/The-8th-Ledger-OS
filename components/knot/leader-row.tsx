"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Flame, Crown, Medal } from "lucide-react";

interface PredictionLeader {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  totalWon: number;
  streak: number;
  tier: number;
}

const TIER_COLORS: Record<number, string> = {
  1: "text-slate-400",
  2: "text-sky-400",
  3: "text-indigo-400",
  4: "text-violet-400",
  5: "text-amber-400",
};

const TIER_BG: Record<number, string> = {
  1: "bg-slate-500/10",
  2: "bg-sky-500/10",
  3: "bg-indigo-500/10",
  4: "bg-violet-500/10",
  5: "bg-amber-500/10",
};

function formatCurrency(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

interface LeaderRowProps {
  leader: PredictionLeader;
  isMe: boolean;
}

export function LeaderRow({ leader, isMe }: LeaderRowProps) {
  const rankIcon =
    leader.rank === 1 ? <Crown className="h-4 w-4 text-amber-400" /> :
    leader.rank === 2 ? <Medal className="h-4 w-4 text-slate-300" /> :
    leader.rank === 3 ? <Medal className="h-4 w-4 text-orange-400" /> :
    <span className="w-4 text-center text-xs font-bold text-slate-500">{leader.rank}</span>;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
        isMe ? "border-indigo-500/20 bg-indigo-950/10" : "border-white/5 bg-[#0a0a14] hover:border-white/10"
      }`}
    >
      <div className="flex w-6 items-center justify-center">{rankIcon}</div>

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10">
        <span className="text-xs font-bold text-indigo-300">{leader.displayName.charAt(0)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isMe ? "text-indigo-300" : "text-white"}`}>{leader.displayName}</span>
          {isMe && <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300">You</span>}
          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${TIER_BG[leader.tier]} ${TIER_COLORS[leader.tier]}`}>T{leader.tier}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Globe className="h-3 w-3" />
          <span>{leader.country}</span>
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-slate-500">Accuracy</p>
        <p className="text-xs font-bold text-white">{leader.accuracy.toFixed(1)}%</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-slate-500">Correct</p>
        <p className="text-xs font-bold text-emerald-400">{leader.correctPredictions}/{leader.totalPredictions}</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-slate-500">Streak</p>
        <div className="flex items-center justify-end gap-1">
          <Flame className="h-3 w-3 text-orange-400" />
          <span className="text-xs font-bold text-orange-400">{leader.streak}</span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-[10px] text-slate-500">Won</p>
        <p className="text-sm font-bold text-amber-300">{formatCurrency(leader.totalWon)}</p>
      </div>
    </motion.div>
  );
}