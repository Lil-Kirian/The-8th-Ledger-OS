"use client";

import React from "react";

interface ReferralReward {
  id: string;
  date: string;
  fromMember: string;
  fromId: string;
  type: "commit" | "win" | "forge";
  amount: number;
  reward: number;
  status: "pending" | "paid";
}

function formatCurrency(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface RewardRowProps {
  reward: ReferralReward;
}

export function RewardRow({ reward }: RewardRowProps) {
  const typeConfig = {
    commit: { label: "Commitment", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    win: { label: "Win", color: "text-amber-400", bg: "bg-amber-500/10" },
    forge: { label: "Forge", color: "text-violet-400", bg: "bg-violet-500/10" },
  };
  const config = typeConfig[reward.type];

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className={`rounded-md ${config.bg} px-2 py-0.5 text-[9px] font-semibold ${config.color}`}>
          {config.label}
        </div>
        <div>
          <p className="text-xs text-white">
            From <span className="font-semibold">{reward.fromMember}</span>
          </p>
          <p className="text-[10px] text-slate-500">{formatDate(reward.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Their Activity</p>
          <p className="text-xs text-slate-300">{formatCurrency(reward.amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Your Reward</p>
          <p className={`text-xs font-bold ${reward.status === "paid" ? "text-emerald-400" : "text-amber-300"}`}>
            +{formatCurrency(reward.reward)}
          </p>
        </div>
        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
          reward.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
        }`}>
          {reward.status}
        </span>
      </div>
    </div>
  );
}