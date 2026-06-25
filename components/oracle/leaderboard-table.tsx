"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Brain,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Search,
  ArrowUpDown,
  Trophy,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  ledgerId: string;
  displayName?: string;
  tier: "seer" | "oracle" | "prophet";
  totalPoints: number;
  correctCount: number;
  totalPredictions: number;
  streak: number;
  lastActive: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserLedgerId?: string;
}

export default function LeaderboardTable({
  entries,
  currentUserLedgerId,
}: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<"points" | "accuracy" | "streak">("points");
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "seer" | "oracle" | "prophet">("all");

  const filtered = entries
    .filter((e) =>
      (filterTier === "all" ? true : e.tier === filterTier) &&
      (e.ledgerId.toLowerCase().includes(search.toLowerCase()) ||
        (e.displayName?.toLowerCase() || "").includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "points") return b.totalPoints - a.totalPoints;
      if (sortBy === "accuracy") {
        const aAcc = a.totalPredictions ? a.correctCount / a.totalPredictions : 0;
        const bAcc = b.totalPredictions ? b.correctCount / b.totalPredictions : 0;
        return bAcc - aAcc;
      }
      return b.streak - a.streak;
    });

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "prophet":
        return <Crown className="w-4 h-4 text-amber-400" />;
      case "oracle":
        return <Brain className="w-4 h-4 text-slate-300" />;
      case "seer":
        return <Eye className="w-4 h-4 text-amber-700" />;
      default:
        return <Eye className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "prophet":
        return "text-amber-400 bg-amber-950/30 border-amber-900/50";
      case "oracle":
        return "text-slate-300 bg-slate-800/50 border-slate-700";
      case "seer":
        return "text-amber-700 bg-amber-950/20 border-amber-900/50";
      default:
        return "text-slate-500 bg-slate-900/50 border-slate-800";
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-mono text-slate-500 w-5 text-center">#{rank}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Ledger ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            {(["all", "seer", "oracle", "prophet"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTier(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  filterTier === t
                    ? "bg-slate-800 text-cyan-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortBy(sortBy === "points" ? "accuracy" : sortBy === "accuracy" ? "streak" : "points")}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            title="Sort"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Streak
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Predictions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((entry, i) => {
                  const accuracy = entry.totalPredictions
                    ? Math.round((entry.correctCount / entry.totalPredictions) * 100)
                    : 0;
                  const isCurrentUser = entry.ledgerId === currentUserLedgerId;

                  return (
                    <motion.tr
                      key={entry.ledgerId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                        isCurrentUser ? "bg-cyan-950/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-300">
                            {entry.ledgerId}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/50 text-cyan-400 border border-cyan-900/50">
                              YOU
                            </span>
                          )}
                          {entry.displayName && (
                            <span className="text-xs text-slate-500">
                              {entry.displayName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getTierColor(
                            entry.tier
                          )}`}
                        >
                          {getTierIcon(entry.tier)}
                          <span className="capitalize">{entry.tier}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-slate-200">
                          {entry.totalPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {accuracy > 60 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          ) : accuracy < 40 ? (
                            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              accuracy >= 70
                                ? "text-emerald-400"
                                : accuracy >= 50
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {accuracy}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            entry.streak >= 5
                              ? "text-emerald-400"
                              : entry.streak >= 3
                              ? "text-amber-400"
                              : "text-slate-400"
                          }`}
                        >
                          {entry.streak}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-slate-500">
                          {entry.totalPredictions}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No subjects match your filters.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2">
        <span>
          Showing {filtered.length} of {entries.length} subjects
        </span>
        <span>Sorted by {sortBy}</span>
      </div>
    </div>
  );
}