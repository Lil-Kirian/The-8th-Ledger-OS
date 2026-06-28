// components/agora/stoa-card.tsx
// 8th Ledger — The Stoa: A Single Petition
// "Every suggestion is a seed. The community decides which ones grow."

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  Tag,
  Clock,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

//
// TYPES — Schema-Aligned
//

export interface StoaSuggestion {
  id: string;
  title: string;
  description: string;
  continent: string;
  vertical: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  upvotes: number;
  downvotes: number;
  score: number;
  createdAt: string;
  author: {
    ledgerId: string;
    displayName: string;
    country: string;
    avatar?: string | null;
  };
  userVote?: "up" | "down" | null;
}

interface StoaCardProps {
  suggestion: StoaSuggestion;
  onVote: (id: string, direction: "up" | "down") => Promise<void>;
  index?: number;
}

//
// DESIGN SYSTEM — The Petition Palette
//

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    short: "Pending",
    icon: HelpCircle,
    color: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/15",
    accent: "bg-amber-400",
    glow: "shadow-amber-400/10",
  },
  under_review: {
    label: "Under Review",
    short: "Reviewing",
    icon: Loader2,
    color: "text-cyan-400",
    bg: "bg-cyan-400/8",
    border: "border-cyan-400/15",
    accent: "bg-cyan-400",
    glow: "shadow-cyan-400/10",
  },
  approved: {
    label: "Approved by Council",
    short: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/15",
    accent: "bg-emerald-400",
    glow: "shadow-emerald-400/10",
  },
  rejected: {
    label: "Rejected by Council",
    short: "Rejected",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-400/8",
    border: "border-red-400/15",
    accent: "bg-red-400",
    glow: "shadow-red-400/10",
  },
} as const;

const VERTICAL_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  ledgerprop: { label: "LedgerProp", emoji: "🏠", color: "text-blue-400" },
  ledgerauto: { label: "LedgerAuto", emoji: "🚗", color: "text-red-400" },
  ledgertech: { label: "LedgerTech", emoji: "📱", color: "text-purple-400" },
  ledgeredu: { label: "LedgerEdu", emoji: "🎓", color: "text-indigo-400" },
  ledgerhealth: { label: "LedgerHealth", emoji: "🏥", color: "text-rose-400" },
  ledgerbiz: { label: "LedgerBiz", emoji: "🏗️", color: "text-amber-400" },
  ledgertravel: { label: "LedgerTravel", emoji: "✈️", color: "text-sky-400" },
  ledgeragri: { label: "LedgerAgri", emoji: "🌾", color: "text-emerald-400" },
  ledgerenergy: { label: "LedgerEnergy", emoji: "⚡", color: "text-yellow-400" },
  ledgeraccess: { label: "LedgerAccess", emoji: "🔑", color: "text-teal-400" },
};

const CONTINENT_CONFIG: Record<string, { emoji: string; label: string }> = {
  africa: { emoji: "🌍", label: "Africa" },
  asia: { emoji: "🌏", label: "Asia" },
  europe: { emoji: "🌍", label: "Europe" },
  americas: { emoji: "🌎", label: "Americas" },
  middle_east: { emoji: "🌍", label: "Middle East" },
  oceania: { emoji: "🌏", label: "Oceania" },
};

//
// HELPERS
//

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  if (score < 0) return `${score}`;
  return "0";
}

//
// SUB-COMPONENTS
//

function VoteButton({
  direction,
  count,
  isActive,
  isLoading,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  count: number;
  isActive: boolean;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const isUp = direction === "up";
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        group relative flex items-center gap-1.5 px-3 py-2 rounded-xl
        text-xs font-bold transition-all duration-200
        ${isActive
          ? isUp
            ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/30 shadow-lg shadow-emerald-400/10"
            : "bg-red-400/15 text-red-400 border border-red-400/30 shadow-lg shadow-red-400/10"
          : "bg-slate-800/50 text-slate-500 border border-slate-700/40 hover:bg-slate-800 hover:text-slate-300"
        }
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
      )}
      <span className="tabular-nums">{count.toLocaleString()}</span>
    </button>
  );
}

function ScorePill({ score }: { score: number }) {
  const isPositive = score > 0;
  const isNegative = score < 0;

  return (
    <div
      className={`
        flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black tabular-nums
        border
        ${isPositive
          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
          : isNegative
          ? "bg-red-400/10 text-red-400 border-red-400/20"
          : "bg-slate-800/50 text-slate-500 border-slate-700/40"
        }
      `}
    >
      {isPositive && <TrendingUp className="w-3 h-3" />}
      {isNegative && <TrendingDown className="w-3 h-3" />}
      {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
      {formatScore(score)}
    </div>
  );
}

function MetaTag({
  icon: Icon,
  emoji,
  label,
  color = "text-slate-400",
}: {
  icon: React.ElementType;
  emoji?: string;
  label: string;
  color?: string;
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
        text-[11px] font-medium
        bg-slate-800/40 border border-slate-700/30
        ${color}
      `}
    >
      {emoji ? <span className="text-xs">{emoji}</span> : <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

//
// MAIN COMPONENT
//

export function StoaCard({ suggestion, onVote, index = 0 }: StoaCardProps) {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [optimisticState, setOptimisticState] = useState({
    score: suggestion.score,
    upvotes: suggestion.upvotes,
    downvotes: suggestion.downvotes,
    userVote: suggestion.userVote || null,
  });

  const status = STATUS_CONFIG[suggestion.status];
  const StatusIcon = status.icon;
  const vertical = VERTICAL_CONFIG[suggestion.vertical] || {
    label: suggestion.vertical,
    emoji: "📋",
    color: "text-slate-400",
  };
  const continent = CONTINENT_CONFIG[suggestion.continent] || {
    emoji: "🌍",
    label: suggestion.continent.replace("_", " "),
  };

  const handleVote = useCallback(
    async (direction: "up" | "down") => {
      if (isVoting || !user) return;

      const prev = { ...optimisticState };
      const next = { ...optimisticState };

      if (prev.userVote === direction) {
        // Unvote
        next.userVote = null;
        next[direction === "up" ? "upvotes" : "downvotes"]--;
      } else if (prev.userVote && prev.userVote !== direction) {
        // Flip
        next.userVote = direction;
        next.upvotes = direction === "up" ? prev.upvotes + 1 : prev.upvotes - 1;
        next.downvotes = direction === "down" ? prev.downvotes + 1 : prev.downvotes - 1;
      } else {
        // Fresh
        next.userVote = direction;
        next[direction === "up" ? "upvotes" : "downvotes"]++;
      }

      next.score = next.upvotes - next.downvotes;
      setOptimisticState(next);
      setIsVoting(true);

      try {
        await onVote(suggestion.id, direction);
      } catch {
        setOptimisticState(prev);
      } finally {
        setIsVoting(false);
      }
    },
    [isVoting, user, optimisticState, onVote, suggestion.id]
  );

  const isHot = optimisticState.score >= 10;
  const isTrending = optimisticState.score >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      className={`
        group relative rounded-2xl overflow-hidden
        border backdrop-blur-md transition-all duration-300
        ${status.border} ${status.bg}
        hover:shadow-xl ${status.glow}
        ${isHot ? "ring-1 ring-amber-400/20" : ""}
      `}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${status.accent} opacity-70`} />

      {/* Hot badge */}
      <AnimatePresence>
        {isHot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 z-10"
          >
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400/15 text-amber-400 border border-amber-400/20 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Hot
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5">
        {/* ── HEADER: Status + Meta ── */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
              text-[10px] font-bold uppercase tracking-wider
              ${status.bg} ${status.color} border ${status.border}
            `}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>

          <MetaTag
            icon={Globe}
            emoji={continent.emoji}
            label={continent.label}
          />

          <MetaTag
            icon={Tag}
            emoji={vertical.emoji}
            label={vertical.label}
            color={vertical.color}
          />

          {isTrending && !isHot && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}

          <span className="flex items-center gap-1 text-[10px] text-slate-600 ml-auto">
            <Clock className="w-3 h-3" />
            {timeAgo(suggestion.createdAt)}
          </span>
        </div>

        {/* ── BODY: Title + Description ── */}
        <div className="mb-4">
          <h3
            className={`
              text-lg font-bold leading-snug mb-2 transition-colors duration-300
              ${isHot ? "text-amber-100" : "text-slate-100 group-hover:text-cyan-100"}
            `}
          >
            {suggestion.title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 group-hover:text-slate-300 transition-colors">
            {suggestion.description}
          </p>
        </div>

        {/* ── FOOTER: Author + Voting ── */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
          {/* Author */}
          <div className="flex items-center gap-3">
            <div
              className={`
                w-9 h-9 rounded-full overflow-hidden flex items-center justify-center
                border-2 bg-slate-800
                ${isHot ? "border-amber-400/30" : "border-slate-700"}
              `}
            >
              {suggestion.author.avatar ? (
                <img
                  src={suggestion.author.avatar}
                  alt={suggestion.author.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300">
                {suggestion.author.displayName}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-600 font-mono">
                  {suggestion.author.ledgerId}
                </span>
                <span className="text-[10px] text-slate-700">•</span>
                <span className="text-[10px] text-slate-600">
                  {suggestion.author.country}
                </span>
              </div>
            </div>
          </div>

          {/* Voting */}
          <div className="flex items-center gap-2">
            <VoteButton
              direction="up"
              count={optimisticState.upvotes}
              isActive={optimisticState.userVote === "up"}
              isLoading={isVoting}
              disabled={!user}
              onClick={() => handleVote("up")}
            />

            <ScorePill score={optimisticState.score} />

            <VoteButton
              direction="down"
              count={optimisticState.downvotes}
              isActive={optimisticState.userVote === "down"}
              isLoading={isVoting}
              disabled={!user}
              onClick={() => handleVote("down")}
            />
          </div>
        </div>

        {/* ── AUTH HINT ── */}
        <AnimatePresence>
          {!user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-slate-800/30"
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <Shield className="w-3.5 h-3.5 text-slate-700" />
                <span>
                  Sign in to vote. <span className="text-amber-500/70">Sovereign tier</span> required to submit suggestions.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}