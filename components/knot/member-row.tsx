"use client";

import React from "react";
import { motion } from "framer-motion";
import { Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp as TrendIcon, Hexagon, Plane, Globe } from "lucide-react";

interface KnotMember {
  id: string;
  vinculumId: string;
  displayName: string;
  country: string;
  tier: number;
  trustScore: number;
  totalCommitted: number;
  poolsWon: number;
  referrals: number;
  depth: number;
  status: "active" | "idle" | "churned";
  joinedAt: string;
}

const VERTICAL_ICONS: Record<string, React.ElementType> = {
  propvin: Landmark,
  autovin: Zap,
  eduvin: Crown,
  accessvin: Lock,
  healthvin: HeartPulse,
  bizvin: TrendIcon,
  techvin: Hexagon,
  travelvin: Plane,
};

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

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface MemberRowProps {
  member: KnotMember;
}

export function MemberRow({ member }: MemberRowProps) {
  const tierColor = TIER_COLORS[member.tier];
  const tierBg = TIER_BG[member.tier];

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0a0a14] p-4 transition-all hover:border-white/10 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10">
          <span className="text-sm font-bold text-indigo-300">{member.displayName.charAt(0)}</span>
          {member.status === "active" && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a14] bg-emerald-400" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{member.displayName}</span>
            <span className={`rounded-md ${tierBg} px-1.5 py-0.5 text-[9px] font-bold ${tierColor}`}>T{member.tier}</span>
            {member.depth > 1 && <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-500">L{member.depth}</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
            <Globe className="h-3 w-3" />
            <span>{member.country}</span>
            <span>•</span>
            <span>Joined {formatDate(member.joinedAt)}</span>
            <span>•</span>
            <span className="font-mono text-slate-400">{member.vinculumId}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Committed</p>
          <p className="text-sm font-bold text-white">{formatCurrency(member.totalCommitted)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Wins</p>
          <p className="text-sm font-bold text-amber-300">{member.poolsWon}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Trust</p>
          <p className={`text-sm font-bold ${tierColor}`}>{member.trustScore}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Refs</p>
          <p className="text-sm font-bold text-indigo-300">{member.referrals}</p>
        </div>
      </div>
    </motion.div>
  );
}