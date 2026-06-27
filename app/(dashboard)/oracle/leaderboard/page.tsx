// app/(dashboard)/oracle/leaderboard/page.tsx
// 8th Ledger — The Oracle Standing: Global Leaderboard
// Production-grade: SWR-powered, searchable, animated, API-connected

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import {
  Crown,
  Star,
  Eye,
  Flame,
  Search,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Fingerprint,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

/* ============================================================
   TYPES
   ============================================================ */
type StandingTier = "novice" | "seer" | "oracle" | "prophet";

type LeaderboardEntry = {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  totalPoints: number;
  correctCount: number;
  totalPredictions: number;
  tier: StandingTier;
  streak: number;
  accuracy: number;
  lastActiveAt: string;
};

type FilterMode = "all" | "prophet" | "oracle" | "seer" | "novice";
type SortMode = "rank" | "points" | "accuracy" | "streak";

/* ============================================================
   CONSTANTS
   ============================================================ */
const TIER_CONFIG: Record<StandingTier, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: React.ElementType;
  requirement: number;
  privilege: string;
}> = {
  novice: {
    label: "Novice",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    glow: "shadow-slate-500/10",
    icon: Eye,
    requirement: 0,
    privilege: "Begin your journey",
  },
  seer: {
    label: "Seer",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
    icon: Star,
    requirement: 10,
    privilege: "Bronze icon • Codex access",
  },
  oracle: {
    label: "Oracle",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    glow: "shadow-sky-500/10",
    icon: Eye,
    requirement: 50,
    privilege: "Silver icon • Early pool access (24h)",
  },
  prophet: {
    label: "Prophet",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
    icon: Crown,
    requirement: 100,
    privilege: "Gold icon • Name on pool cards • Council invitation",
  },
};

const CONTINENTS = [
  { code: "africa", name: "Africa", flag: "🌍" },
  { code: "asia", name: "Asia", flag: "🌏" },
  { code: "europe", name: "Europe", flag: "🌍" },
  { code: "americas", name: "Americas", flag: "🌎" },
  { code: "middle_east", name: "Middle East", flag: "🌍" },
  { code: "oceania", name: "Oceania", flag: "🌏" },
];

const PAGE_SIZE = 25;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   UTILS
   ============================================================ */
function getTierFromPoints(correctCount: number): StandingTier {
  if (correctCount >= 100) return "prophet";
  if (correctCount >= 50) return "oracle";
  if (correctCount >= 10) return "seer";
  return "novice";
}

/* ============================================================
   COMPONENT — Top 3 Podium
   ============================================================ */
function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  const positions = [
    { index: 1, height: "h-40", medal: "text-amber-400", glow: "shadow-amber-500/20", bar: "from-amber-500/20 to-amber-500/5" },
    { index: 0, height: "h-52", medal: "text-yellow-300", glow: "shadow-yellow-500/30", bar: "from-yellow-500/20 to-yellow-500/5" },
    { index: 2, height: "h-32", medal: "text-orange-400", glow: "shadow-orange-500/20", bar: "from-orange-500/20 to-orange-500/5" },
  ];

  return (
    <div className="flex items-end justify-center gap-4 pb-8 pt-4">
      {positions.map((pos) => {
        const entry = top3[pos.index];
        if (!entry) return null;
        const tier = TIER_CONFIG[entry.tier];
        const TierIcon = tier.icon;

        return (
          <motion.div
            key={entry.ledgerId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pos.index * 0.15, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center"
          >
            {/* Avatar */}
            <div className={`relative mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-surface-700 to-surface-800 ring-2 ring-white/10 ${pos.index === 1 ? "ring-yellow-400/50" : ""}`}>
              <span className="text-lg font-bold text-white">{entry.displayName.charAt(0)}</span>
              {pos.index === 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20 ring-1 ring-yellow-500/40"
                >
                  <Crown className="h-3.5 w-3.5 text-yellow-300" />
                </motion.div>
              )}
            </div>

            {/* Name */}
            <p className="text-sm font-bold text-white mb-1">{entry.displayName}</p>
            <span className={`flex items-center gap-1 rounded-md ${tier.bg} px-2 py-0.5 text-[9px] font-bold ${tier.color} border ${tier.border}`}>
              <TierIcon className="h-2.5 w-2.5" />
              {tier.label}
            </span>

            {/* Bar */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              transition={{ delay: 0.3 + pos.index * 0.1, duration: 0.8, ease: "easeOut" }}
              className={`mt-4 w-24 sm:w-28 rounded-t-xl bg-gradient-to-t ${pos.bar} border-t border-x border-white/5 relative overflow-hidden`}
            >
              <div className={`${pos.height} flex flex-col items-center justify-end pb-3`}>
                <p className="font-space text-xl font-bold text-white tabular-nums">{entry.totalPoints}</p>
                <p className="text-[9px] text-white/30">pts</p>
              </div>
              {/* Rank badge */}
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-surface-800 ring-1 ring-white/10`}>
                <span className={`text-xs font-bold ${pos.medal}`}>#{entry.rank}</span>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
   COMPONENT — Table Row
   ============================================================ */
function TableRow({
  entry,
  isMe,
  index,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  index: number;
}) {
  const tier = TIER_CONFIG[entry.tier];
  const TierIcon = tier.icon;
  const accuracy = ((entry.correctCount / Math.max(entry.totalPredictions, 1)) * 100).toFixed(1);

  const trend = entry.streak >= 3 ? "up" : entry.streak === 0 ? "down" : "flat";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`group border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
        isMe ? "bg-violet-950/5" : ""
      }`}
    >
      {/* Rank */}
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-center">
          {entry.rank <= 3 ? (
            <span className={`text-lg font-bold ${
              entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-slate-300" : "text-orange-400"
            }`}>
              {entry.rank}
            </span>
          ) : (
            <span className="text-xs font-bold text-white/30 tabular-nums">#{entry.rank}</span>
          )}
        </div>
      </td>

      {/* User */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-white/10 ${isMe ? "ring-violet-500/30" : ""}`}>
            <span className="text-sm font-bold text-violet-300">{entry.displayName.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isMe ? "text-violet-300" : "text-white"}`}>
                {entry.displayName}
              </span>
              {isMe && (
                <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-300 border border-violet-500/30">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Globe className="h-2.5 w-2.5 text-white/20" />
              <span className="text-[10px] text-white/20">{entry.country}</span>
              <span className="text-white/10">•</span>
              <span className="text-[10px] text-white/20 font-mono">{entry.ledgerId}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Tier */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 rounded-md ${tier.bg} px-2 py-1 text-[10px] font-bold ${tier.color} border ${tier.border}`}>
          <TierIcon className="h-3 w-3" />
          {tier.label}
        </span>
      </td>

      {/* Points */}
      <td className="px-4 py-3.5">
        <p className="text-sm font-bold text-white font-mono tabular-nums">{entry.totalPoints.toLocaleString()}</p>
      </td>

      {/* Accuracy */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(parseFloat(accuracy), 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-emerald-400 tabular-nums">{accuracy}%</span>
        </div>
      </td>

      {/* Correct */}
      <td className="px-4 py-3.5">
        <p className="text-xs font-bold text-white/60 tabular-nums">
          {entry.correctCount} <span className="text-white/20">/ {entry.totalPredictions}</span>
        </p>
      </td>

      {/* Streak */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : trend === "down" ? (
            <TrendingDown className="h-3.5 w-3.5 text-crimson" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-white/20" />
          )}
          <span className={`text-xs font-bold tabular-nums ${entry.streak >= 3 ? "text-orange-400" : "text-white/40"}`}>
            {entry.streak}
          </span>
          {entry.streak >= 3 && <Flame className="h-3 w-3 text-orange-400" />}
        </div>
      </td>
    </motion.tr>
  );
}

/* ============================================================
   COMPONENT — Empty State
   ============================================================ */
function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
        <Icon className="h-8 w-8 text-white/10" />
      </div>
      <h3 className="text-sm font-bold text-white/40">{title}</h3>
      <p className="mt-1 text-xs text-white/20 max-w-xs">{subtitle}</p>
    </div>
  );
}

/* ============================================================
   COMPONENT — Skeleton
   ============================================================ */
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded bg-white/5 animate-pulse" style={{ width: i === 2 ? "60%" : i === 1 ? "30px" : "50px" }} />
        </td>
      ))}
    </tr>
  );
}

/* ============================================================
   MAIN PAGE — Oracle Leaderboard
   ============================================================ */
export default function OracleLeaderboardPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Fetch data
  const { data, error, isLoading } = useSWR("/api/oracle/leaderboard", fetcher, {
    refreshInterval: 60000,
  });

  const allEntries: LeaderboardEntry[] = data?.leaderboard || [];

  // Filter & Sort
  const filtered = useMemo(() => {
    let result = [...allEntries];

    // Tier filter
    if (filter !== "all") {
      result = result.filter((e) => e.tier === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.displayName.toLowerCase().includes(q) ||
          e.ledgerId.toLowerCase().includes(q) ||
          e.country.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let val = 0;
      switch (sort) {
        case "rank":
          val = a.rank - b.rank;
          break;
        case "points":
          val = a.totalPoints - b.totalPoints;
          break;
        case "accuracy":
          val = (a.correctCount / Math.max(a.totalPredictions, 1)) - (b.correctCount / Math.max(b.totalPredictions, 1));
          break;
        case "streak":
          val = a.streak - b.streak;
          break;
      }
      return sortDir === "asc" ? val : -val;
    });

    return result;
  }, [allEntries, filter, search, sort, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = useCallback(
    (field: SortMode) => {
      if (sort === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSort(field);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sort]
  );

  const SortIcon = ({ field }: { field: SortMode }) => {
    if (sort !== field) return <ChevronDown className="h-3 w-3 text-white/10" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-violet-400" />
    ) : (
      <ChevronDown className="h-3 w-3 text-violet-400" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/oracle"
            className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Oracle
          </Link>
          <h1 className="font-space text-3xl font-bold text-white">The Standing</h1>
          <p className="mt-1 text-sm text-white/40">
            Global rankings of the 8th Ledger's most prescient sovereigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10px] text-white/30">Total Prophets</p>
            <p className="font-space text-lg font-bold text-white">
              {isLoading ? "—" : allEntries.filter((e) => e.tier === "prophet").length}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10px] text-white/30">Total Oracles</p>
            <p className="font-space text-lg font-bold text-sky-400">
              {isLoading ? "—" : allEntries.filter((e) => e.tier === "oracle").length}
            </p>
          </div>
        </div>
      </div>

      {/* Podium */}
      {!isLoading && !error && allEntries.length > 0 && <Podium entries={allEntries} />}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search sovereigns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-white/5 bg-white/[0.02] py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:border-violet-500/30 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {/* Tier Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {([
            { id: "all" as FilterMode, label: "All", count: allEntries.length },
            { id: "prophet" as FilterMode, label: "Prophets", count: allEntries.filter((e) => e.tier === "prophet").length },
            { id: "oracle" as FilterMode, label: "Oracles", count: allEntries.filter((e) => e.tier === "oracle").length },
            { id: "seer" as FilterMode, label: "Seers", count: allEntries.filter((e) => e.tier === "seer").length },
            { id: "novice" as FilterMode, label: "Novices", count: allEntries.filter((e) => e.tier === "novice").length },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === f.id
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                  : "border-white/5 bg-white/[0.02] text-white/30 hover:text-white/50"
              }`}
            >
              {f.label}
              <span className="ml-1.5 rounded bg-white/5 px-1 py-0.5 text-[9px] text-white/40">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {[
                  { field: "rank" as SortMode, label: "Rank", width: "w-16" },
                  { field: "rank" as SortMode, label: "Sovereign", width: "w-auto" },
                  { field: "rank" as SortMode, label: "Tier", width: "w-28" },
                  { field: "points" as SortMode, label: "Points", width: "w-24" },
                  { field: "accuracy" as SortMode, label: "Accuracy", width: "w-32" },
                  { field: "rank" as SortMode, label: "Correct", width: "w-24" },
                  { field: "streak" as SortMode, label: "Streak", width: "w-24" },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/30 ${col.width} ${col.field !== "rank" ? "cursor-pointer hover:text-white/50" : ""}`}
                    onClick={() => col.field !== "rank" && handleSort(col.field)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.field !== "rank" && <SortIcon field={col.field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <EmptyState
                      icon={AlertTriangle}
                      title="The Scroll is unreadable"
                      subtitle="Could not load the leaderboard. The Oracle will retry shortly."
                    />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <EmptyState
                      icon={Search}
                      title="No sovereigns found"
                      subtitle="Try adjusting your search or filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((entry, i) => (
                  <TableRow
                    key={entry.ledgerId}
                    entry={entry}
                    isMe={entry.ledgerId === user?.ledgerId}
                    index={i}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <p className="text-[10px] text-white/20">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 px-2 text-[10px]"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                      page === p
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "text-white/30 hover:text-white/50 hover:bg-white/5"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 px-2 text-[10px]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tier Legend */}
      <div className="rounded-2xl border border-white/5 bg-surface-800 p-5">
        <h3 className="mb-4 text-sm font-bold text-white flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-violet-400" />
          Standing Tiers
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(TIER_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={key}
                className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                </div>
                <p className="text-[10px] text-white/30">
                  {config.requirement === 0 ? "Starting tier" : `${config.requirement} correct forecasts required`}
                </p>
                <p className="mt-2 text-[10px] text-white/20 leading-relaxed">{config.privilege}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}