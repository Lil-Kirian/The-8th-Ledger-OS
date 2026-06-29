"use client";

import React, { useState, useEffect } from "react";
import {
  Gavel,
  TrendingUp,
  TrendingDown,
  Percent,
  Crown,
  CheckCircle2,
  XCircle,
  Minus,
  Zap,
  Activity,
  BarChart3,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteTally {
  agreed: number; // capital-weighted %
  declined: number;
  abstained: number;
  totalCommitted: number;
  quorumRequired: number;
  voterCount: number;
  totalOwners: number;
  timeRemaining: number; // seconds
}

interface VoterBreakdown {
  tier: "whale" | "major" | "moderate" | "minor";
  label: string;
  count: number;
  capital: number;
  agreed: number;
  declined: number;
  color: string;
}

interface VotePanelProps {
  proposalId: string;
  proposalTitle: string;
  tally: VoteTally;
  breakdown?: VoterBreakdown[];
  onVote?: (vote: "agreed" | "declined") => void;
  userVote?: "agreed" | "declined" | null;
  userOwnershipPercent: number;
  isSpeaker?: boolean;
  isTreasurer?: boolean;
}

function useAnimatedValue(target: number, duration = 1000) {
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

function formatPercent(n: number) {
  return n.toFixed(2) + "%";
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VotePanel({
  proposalId,
  proposalTitle,
  tally,
  breakdown = [],
  onVote,
  userVote,
  userOwnershipPercent,
  isSpeaker,
  isTreasurer,
}: VotePanelProps) {
  const animatedAgreed = useAnimatedValue(tally.agreed);
  const animatedDeclined = useAnimatedValue(tally.declined);
  const quorumLine = tally.quorumRequired;
  const isPassing = tally.agreed >= quorumLine;
  const isFailing = tally.declined >= quorumLine;
  const isDecided = isPassing || isFailing;
  const [timeLeft, setTimeLeft] = useState(tally.timeRemaining);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  const totalVoted = tally.agreed + tally.declined;
  const participationRate = tally.totalCommitted > 0 ? (totalVoted / tally.totalCommitted) * 100 : 0;

  const defaultBreakdown: VoterBreakdown[] = [
    { tier: "whale", label: "Whales (10%+)", count: 2, capital: 62, agreed: 45, declined: 17, color: "bg-purple-500" },
    { tier: "major", label: "Major (5-10%)", count: 4, capital: 24, agreed: 18, declined: 6, color: "bg-blue-500" },
    { tier: "moderate", label: "Moderate (1-5%)", count: 12, capital: 10, agreed: 7, declined: 3, color: "bg-cyan-500" },
    { tier: "minor", label: "Minor (<1%)", count: 32, capital: 4, agreed: 2.5, declined: 1.5, color: "bg-slate-500" },
  ];

  const tiers = breakdown.length > 0 ? breakdown : defaultBreakdown;

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
            <Gavel size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Capital-Weighted Vote</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Proposal #{proposalId.slice(-6)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft > 0 && !isDecided && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400">
              <Timer size={12} className={cn(pulse && "text-amber-400")} />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
          {isDecided && (
            <div
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5",
                isPassing
                  ? "bg-emerald-900/30 text-emerald-400 border-emerald-700/30"
                  : "bg-red-900/30 text-red-400 border-red-700/30"
              )}
            >
              {isPassing ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {isPassing ? "PASSED" : "DECLINED"}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Main Tally Bars */}
        <div className="space-y-4">
          {/* 51% Threshold Visual */}
          <div className="relative">
            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1">
                <Percent size={10} />
                Quorum: {quorumLine}%
              </span>
              <span className="flex items-center gap-1">
                <Activity size={10} />
                Participation: {participationRate.toFixed(1)}%
              </span>
            </div>

            {/* The Big Bar */}
            <div className="relative h-10 bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/30">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {[25, 50, 75].map((pct) => (
                  <div
                    key={pct}
                    className="absolute top-0 bottom-0 w-px bg-slate-700/20"
                    style={{ left: `${pct}%` }}
                  />
                ))}
              </div>

              {/* 51% threshold marker */}
              <div
                className="absolute top-0 bottom-0 z-20 flex flex-col items-center"
                style={{ left: `${quorumLine}%` }}
              >
                <div className="h-full w-0.5 bg-amber-400/70" />
                <div className="absolute -top-1 bg-amber-900/80 text-amber-400 text-[9px] px-1.5 py-0.5 rounded border border-amber-700/40 font-mono font-bold">
                  51%
                </div>
              </div>

              {/* Agreed fill */}
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500/30 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                style={{ width: `${Math.min(animatedAgreed, 100)}%` }}
              >
                <div className="h-full w-full bg-emerald-500/20 animate-pulse" />
                {animatedAgreed > 15 && (
                  <span className="text-xs font-bold text-emerald-300 font-mono z-10">
                    {formatPercent(animatedAgreed)}
                  </span>
                )}
              </div>

              {/* Declined fill (from right) */}
              <div
                className="absolute top-0 right-0 h-full bg-red-500/20 transition-all duration-1000 ease-out flex items-center pl-2"
                style={{ width: `${Math.min(animatedDeclined, 100)}%` }}
              >
                {animatedDeclined > 15 && (
                  <span className="text-xs font-bold text-red-300 font-mono z-10">
                    {formatPercent(animatedDeclined)}
                  </span>
                )}
              </div>

              {/* Center label if close */}
              {Math.abs(animatedAgreed - quorumLine) < 5 && !isDecided && (
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/40 animate-pulse">
                    NEAR QUORUM
                  </span>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/60" />
                <span className="text-emerald-400 font-semibold">
                  Agreed {formatPercent(tally.agreed)}
                </span>
                <span className="text-slate-600">
                  ({tally.voterCount} voters)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">
                  ({tally.totalOwners - tally.voterCount} remaining)
                </span>
                <span className="text-red-400 font-semibold">
                  Declined {formatPercent(tally.declined)}
                </span>
                <div className="w-3 h-3 rounded bg-red-500/40 border border-red-500/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
            <BarChart3 size={10} />
            Capital Distribution by Tier
          </div>

          <div className="space-y-2.5">
            {tiers.map((tier) => {
              const totalTier = tier.agreed + tier.declined;
              const agreedPct = totalTier > 0 ? (tier.agreed / totalTier) * 100 : 0;
              return (
                <div key={tier.tier} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", tier.color)} />
                      <span className="text-slate-300 font-medium">{tier.label}</span>
                      <span className="text-slate-600">
                        {tier.count} owners • {tier.capital}% capital
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-mono">{tier.agreed.toFixed(1)}%</span>
                      <span className="text-red-400 font-mono">{tier.declined.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden flex">
                    <div
                      className={cn("h-full transition-all duration-700", tier.color)}
                      style={{ width: `${agreedPct}%`, opacity: 0.6 }}
                    />
                    <div
                      className="h-full bg-red-500/40 transition-all duration-700"
                      style={{ width: `${100 - agreedPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Vote Section */}
        <div className="pt-4 border-t border-slate-800/40">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-400">
              Your ownership:{" "}
              <span className="text-slate-200 font-bold font-mono">
                {userOwnershipPercent.toFixed(4)}%
              </span>
            </div>
            {userVote && (
              <div
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1",
                  userVote === "agreed"
                    ? "bg-emerald-900/30 text-emerald-400 border-emerald-700/30"
                    : "bg-red-900/30 text-red-400 border-red-700/30"
                )}
              >
                {userVote === "agreed" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                You voted {userVote.toUpperCase()}
              </div>
            )}
          </div>

          {/* Vote Buttons */}
          {!isDecided && timeLeft > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onVote?.("agreed")}
                disabled={userVote === "agreed"}
                className={cn(
                  "relative px-4 py-3 rounded-xl border text-sm font-bold transition-all overflow-hidden group",
                  userVote === "agreed"
                    ? "bg-emerald-900/30 border-emerald-600/50 text-emerald-400 cursor-default"
                    : "bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-emerald-900/20 hover:border-emerald-700/40 hover:text-emerald-300"
                )}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  AGREE
                </div>
                {userVote !== "agreed" && (
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>

              <button
                onClick={() => onVote?.("declined")}
                disabled={userVote === "declined"}
                className={cn(
                  "relative px-4 py-3 rounded-xl border text-sm font-bold transition-all overflow-hidden group",
                  userVote === "declined"
                    ? "bg-red-900/30 border-red-600/50 text-red-400 cursor-default"
                    : "bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-red-900/20 hover:border-red-700/40 hover:text-red-300"
                )}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <XCircle size={16} />
                  DECLINE
                </div>
                {userVote !== "declined" && (
                  <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
          )}

          {/* No abstentions rule reminder */}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600">
            <Minus size={10} />
            <span>Abstentions do not count toward quorum. Binary only: Agreed or Declined.</span>
          </div>

          {/* Whale warning */}
          {userOwnershipPercent >= 50 && !isDecided && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/10 border border-amber-800/20 text-xs text-amber-400">
              <Crown size={14} />
              <span>
                You hold {userOwnershipPercent.toFixed(1)}%. Even a whale cannot act alone. You still need{" "}
                {(quorumLine - userOwnershipPercent).toFixed(1)}% more to pass this alone.
              </span>
            </div>
          )}
        </div>

        {/* Live indicator */}
        {!isDecided && timeLeft > 0 && (
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <Zap size={10} className="text-emerald-400 animate-pulse" />
            <span>Live tally updating in real-time</span>
          </div>
        )}
      </div>
    </div>
  );
}