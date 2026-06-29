"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Clock, Flame, Hexagon, Trophy, XCircle, Wallet, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PoolStatus = "filling" | "consensus" | "distributed" | "closed";

interface Pool {
  id: string;
  verticalId: string;
  name: string;
  assetValue: number;
  committed: number;
  target: number;
  participants: number;
  maxParticipants: number;
  closesAt: string;
  status: PoolStatus;
  winnerId?: string;
  winnerCountry?: string;
  myCommitment?: number;
  description: string;
}

interface Vertical {
  id: string;
  name: string;
  color: string;
  bgGradient: string;
}

interface PoolCardProps {
  pool: Pool;
  vertical: Vertical;
  onCommit: (pool: Pool) => void;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatTimeRemaining(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function getStatusConfig(status: PoolStatus) {
  switch (status) {
    case "filling":
      return { label: "Filling", color: "text-amber-400", bg: "bg-amber-500/10", icon: Flame };
    case "consensus":
      return { label: "Consensus", color: "text-indigo-400", bg: "bg-indigo-500/10", icon: Hexagon };
    case "distributed":
      return { label: "Distributed", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Trophy };
    case "closed":
      return { label: "Closed", color: "text-slate-400", bg: "bg-white/5", icon: XCircle };
  }
}

/** Inline circular fill indicator — replaces dead SurplusRing */
function FillRing({ committed, target }: { committed: number; target: number }) {
  const pct = Math.min((committed / target) * 100, 100);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="url(#fillGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="fillGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[10px] font-bold text-white">{Math.round(pct)}%</span>
    </div>
  );
}

export function PoolCard({ pool, vertical, onCommit }: PoolCardProps) {
  const status = getStatusConfig(pool.status);
  const StatusIcon = status.icon;
  const fillPct = (pool.participants / pool.maxParticipants) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a14] transition-all hover:border-white/10 hover:shadow-lg hover:shadow-black/40"
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", vertical.bgGradient)} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="amber" className={cn("flex items-center gap-1", status.bg, status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              {pool.winnerId && (
                <Badge variant="success">Winner: {pool.winnerId}</Badge>
              )}
            </div>
            <h3 className="mt-2 font-space text-base font-semibold text-white sm:text-lg">{pool.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">{pool.description}</p>
          </div>
          <FillRing committed={pool.committed} target={pool.target} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/[0.02] p-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Asset Value</p>
            <p className="mt-0.5 text-sm font-bold text-white">{formatCurrency(pool.assetValue)}</p>
          </div>
          <div className="rounded-lg bg-white/[0.02] p-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Committed</p>
            <p className="mt-0.5 text-sm font-bold text-indigo-300">{formatCurrency(pool.committed)}</p>
          </div>
          <div className="rounded-lg bg-white/[0.02] p-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Pool Target</p>
            <p className="mt-0.5 text-sm font-bold text-amber-300">{formatCurrency(pool.target)}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{pool.participants} / {pool.maxParticipants}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTimeRemaining(pool.closesAt)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {pool.status === "filling" && (
            <button onClick={() => onCommit(pool)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 active:scale-[0.98]">
              <Wallet className="h-3.5 w-3.5" /> Commit Capital
            </button>
          )}
          {pool.status === "consensus" && (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 py-2.5 text-xs font-medium text-indigo-300">
              <Hexagon className="h-3.5 w-3.5 animate-spin" /> Quantum Merit Consensus in progress...
            </div>
          )}
          {pool.status === "distributed" && (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-xs font-medium text-emerald-300">
              <Trophy className="h-3.5 w-3.5" /> Winner: {pool.winnerId} ({pool.winnerCountry})
            </div>
          )}
        </div>

        {pool.myCommitment && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            You committed {formatCurrency(pool.myCommitment)}. If not selected, you retain 50% ({formatCurrency(pool.myCommitment * 0.5)}) as PAC credit.
          </div>
        )}
      </div>
    </motion.div>
  );
}