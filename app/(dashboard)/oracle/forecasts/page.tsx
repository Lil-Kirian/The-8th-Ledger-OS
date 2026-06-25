// app/(dashboard)/oracle/forecasts/page.tsx
// 8th Ledger — The Prophecy Archive: All Forecasts
// Production-grade: SWR-powered, filterable, animated, API-connected

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import {
  Telescope,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Calendar,
  Globe,
  BarChart3,
  ArrowLeft,
  Eye,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Hash,
  Target,
  Zap,
  Loader2,
  RefreshCw,
  Crown,
  Star,
  Medal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

/* ============================================================
   TYPES
   ============================================================ */
type ForecastStatus = "active" | "locked" | "resolved" | "cancelled";

type OracleForecast = {
  id: string;
  title: string;
  description: string | null;
  type: "asset_launch" | "hall_revenue";
  verticalOptions: string[];
  countryOptions: string[];
  lockDate: string;
  resolveDate?: string | null;
  resolvedOutcome?: string | null;
  status: ForecastStatus;
  totalPredictions: number;
  createdAt: string;
};

type UserPrediction = {
  id: string;
  forecastId: string;
  vertical: string;
  country: string;
  pointsEarned: number;
  status: "pending" | "correct" | "incorrect";
};

type ForecastWithPrediction = OracleForecast & {
  myPrediction?: UserPrediction | null;
};

type FilterStatus = "all" | "active" | "locked" | "resolved" | "cancelled";
type SortMode = "newest" | "oldest" | "most_predictions" | "closing_soon";

/* ============================================================
   CONSTANTS
   ============================================================ */
const VERTICALS = [
  { slug: "ledgerprop", name: "LedgerProp", icon: "🏠", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { slug: "ledgerauto", name: "LedgerAuto", icon: "🚗", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  { slug: "ledgertech", name: "LedgerTech", icon: "📱", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { slug: "ledgeredu", name: "LedgerEdu", icon: "🎓", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { slug: "ledgerhealth", name: "LedgerHealth", icon: "🏥", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { slug: "ledgerbiz", name: "LedgerBiz", icon: "🏗️", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { slug: "ledgertravel", name: "LedgerTravel", icon: "✈️", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { slug: "ledgeragri", name: "LedgerAgri", icon: "🌾", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20" },
  { slug: "ledgerenergy", name: "LedgerEnergy", icon: "⚡", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  { slug: "ledgeraccess", name: "LedgerAccess", icon: "📡", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
];

const COUNTRIES = [
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
];

const STATUS_CONFIG: Record<ForecastStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  active: { label: "Open", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Unlock },
  locked: { label: "Locked", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Lock },
  resolved: { label: "Resolved", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-crimson", bg: "bg-crimson/10", border: "border-crimson/20", icon: XCircle },
};

const PAGE_SIZE = 12;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   UTILS
   ============================================================ */
function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = React.useState(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, diff);
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);

  if (remaining <= 0) return "Closed";
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ============================================================
   COMPONENT — Forecast Card
   ============================================================ */
function ForecastCard({ forecast }: { forecast: ForecastWithPrediction }) {
  const status = STATUS_CONFIG[forecast.status];
  const StatusIcon = status.icon;
  const countdown = forecast.status === "active" ? useCountdown(forecast.lockDate) : null;

  const resolvedVertical = forecast.resolvedOutcome
    ? VERTICALS.find((v) => forecast.resolvedOutcome?.includes(v.slug))
    : null;
  const resolvedCountry = forecast.resolvedOutcome
    ? COUNTRIES.find((c) => forecast.resolvedOutcome?.includes(c.code))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col rounded-2xl border border-white/5 bg-surface-800 p-5 transition-all hover:border-white/10 hover:shadow-lg hover:shadow-violet-500/5"
    >
      {/* Status Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-md ${status.bg} px-2 py-1 text-[10px] font-bold ${status.color} border ${status.border}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
        {forecast.status === "active" && countdown && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300">
            <Clock className="h-3 w-3" />
            {countdown}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-white mb-1">{forecast.title}</h3>
      <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-2">{forecast.description}</p>

      {/* Options Preview */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {forecast.verticalOptions.slice(0, 4).map((v) => {
            const vert = VERTICALS.find((x) => x.slug === v);
            if (!vert) return null;
            const isWinner = resolvedVertical?.slug === v;
            return (
              <span
                key={v}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border ${
                  isWinner
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/5 text-white/30 border-white/5"
                }`}
              >
                <span>{vert.icon}</span>
                {vert.name}
                {isWinner && <CheckCircle2 className="h-2.5 w-2.5" />}
              </span>
            );
          })}
          {forecast.verticalOptions.length > 4 && (
            <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/20">
              +{forecast.verticalOptions.length - 4}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {forecast.countryOptions.slice(0, 4).map((c) => {
            const country = COUNTRIES.find((x) => x.code === c);
            if (!country) return null;
            const isWinner = resolvedCountry?.code === c;
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border ${
                  isWinner
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/5 text-white/30 border-white/5"
                }`}
              >
                <span>{country.flag}</span>
                {country.name}
                {isWinner && <CheckCircle2 className="h-2.5 w-2.5" />}
              </span>
            );
          })}
          {forecast.countryOptions.length > 4 && (
            <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/20">
              +{forecast.countryOptions.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* My Prediction */}
      {forecast.myPrediction && (
        <div className={`mb-4 rounded-xl border p-3 ${
          forecast.myPrediction.status === "correct"
            ? "border-emerald-500/20 bg-emerald-500/5"
            : forecast.myPrediction.status === "incorrect"
            ? "border-crimson/20 bg-crimson/5"
            : "border-amber-500/20 bg-amber-500/5"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/30">Your Prophecy</span>
            <span className={`text-[10px] font-bold capitalize ${
              forecast.myPrediction.status === "correct"
                ? "text-emerald-400"
                : forecast.myPrediction.status === "incorrect"
                ? "text-crimson"
                : "text-amber-400"
            }`}>
              {forecast.myPrediction.status}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
            <span>
              {VERTICALS.find((v) => v.slug === forecast.myPrediction?.vertical)?.icon}{" "}
              {VERTICALS.find((v) => v.slug === forecast.myPrediction?.vertical)?.name}
            </span>
            <span className="text-white/10">•</span>
            <span>
              {COUNTRIES.find((c) => c.code === forecast.myPrediction?.country)?.flag}{" "}
              {COUNTRIES.find((c) => c.code === forecast.myPrediction?.country)?.name}
            </span>
          </div>
          {forecast.myPrediction.pointsEarned > 0 && (
            <p className="mt-1 text-xs font-bold text-emerald-400">+{forecast.myPrediction.pointsEarned} pts</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-[10px] text-white/20">
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {forecast.totalPredictions.toLocaleString()} cast
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(forecast.lockDate)}
          </span>
        </div>
        <Link href={`/oracle/forecasts/${forecast.id}`}>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-violet-300 hover:text-violet-200 hover:bg-violet-500/10">
            Details
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Skeleton Card
   ============================================================ */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/5 bg-surface-800 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-16 rounded bg-white/5" />
        <div className="h-4 w-20 rounded bg-white/5" />
      </div>
      <div className="h-5 w-3/4 rounded bg-white/5 mb-1" />
      <div className="h-3 w-full rounded bg-white/5 mb-4" />
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-16 rounded bg-white/5" />
        ))}
      </div>
      <div className="h-12 rounded bg-white/5 mb-4" />
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="h-3 w-24 rounded bg-white/5" />
        <div className="h-6 w-16 rounded bg-white/5" />
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Empty State
   ============================================================ */
function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
        <Icon className="h-8 w-8 text-white/10" />
      </div>
      <h3 className="text-sm font-bold text-white/40">{title}</h3>
      <p className="mt-1 text-xs text-white/20 max-w-xs">{subtitle}</p>
    </div>
  );
}

/* ============================================================
   MAIN PAGE — Prophecy Archive
   ============================================================ */
export default function OracleForecastsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Fetch forecasts
  const { data: forecastsData, error: forecastsError, isLoading: forecastsLoading } = useSWR(
    "/api/oracle/forecasts",
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch my predictions
  const { data: predictionsData } = useSWR(
    "/api/oracle/forecasts?my=true",
    fetcher,
    { refreshInterval: 30000 }
  );

  const forecasts: OracleForecast[] = forecastsData?.forecasts || [];
  const myPredictions: UserPrediction[] = predictionsData?.predictions || [];

  // Merge predictions into forecasts
  const forecastsWithPredictions: ForecastWithPrediction[] = useMemo(() => {
    const predictionMap = new Map(myPredictions.map((p) => [p.forecastId, p]));
    return forecasts.map((f) => ({
      ...f,
      myPrediction: predictionMap.get(f.id) || null,
    }));
  }, [forecasts, myPredictions]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let result = [...forecastsWithPredictions];

    // Status filter
    if (filter !== "all") {
      result = result.filter((f) => f.status === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q) ||
          f.verticalOptions.some((v) => VERTICALS.find((x) => x.slug === v)?.name.toLowerCase().includes(q)) ||
          f.countryOptions.some((c) => COUNTRIES.find((x) => x.code === c)?.name.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "most_predictions":
          return b.totalPredictions - a.totalPredictions;
        case "closing_soon":
          return new Date(a.lockDate).getTime() - new Date(b.lockDate).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [forecastsWithPredictions, filter, search, sort]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const activeCount = forecasts.filter((f) => f.status === "active").length;
  const resolvedCount = forecasts.filter((f) => f.status === "resolved").length;
  const myPredictionsCount = myPredictions.length;

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
          <h1 className="font-space text-3xl font-bold text-white">Prophecy Archive</h1>
          <p className="mt-1 text-sm text-white/40">
            All forecasts — past, present, and future. The Oracle remembers everything.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10px] text-white/30">Active</p>
            <p className="font-space text-lg font-bold text-emerald-400">{forecastsLoading ? "—" : activeCount}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10px] text-white/30">Resolved</p>
            <p className="font-space text-lg font-bold text-sky-400">{forecastsLoading ? "—" : resolvedCount}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10px] text-white/30">My Prophecies</p>
            <p className="font-space text-lg font-bold text-violet-400">{forecastsLoading ? "—" : myPredictionsCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search prophecies by title, vertical, or country..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-white/5 bg-white/[0.02] py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:border-violet-500/30 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {([
              { id: "all" as FilterStatus, label: "All", count: forecasts.length },
              { id: "active" as FilterStatus, label: "Open", count: forecasts.filter((f) => f.status === "active").length },
              { id: "locked" as FilterStatus, label: "Locked", count: forecasts.filter((f) => f.status === "locked").length },
              { id: "resolved" as FilterStatus, label: "Resolved", count: forecasts.filter((f) => f.status === "resolved").length },
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

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[10px] font-bold text-white/50 focus:border-violet-500/30 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_predictions">Most Predictions</option>
            <option value="closing_soon">Closing Soon</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forecastsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : forecastsError ? (
          <EmptyState
            icon={AlertTriangle}
            title="The Archive is sealed"
            subtitle="Could not load forecasts. The Oracle will reveal them shortly."
          />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No prophecies found"
            subtitle="Try adjusting your search or filter to see more forecasts."
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {paginated.map((forecast) => (
              <ForecastCard key={forecast.id} forecast={forecast} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-3 text-[10px]"
          >
            Previous
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-bold transition-all ${
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
            className="h-8 px-3 text-[10px]"
          >
            Next
          </Button>
        </div>
      )}

      {/* Stats Footer */}
      <div className="rounded-2xl border border-white/5 bg-surface-800 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <Zap className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">About Oracle Forecasts</h4>
            <p className="mt-1 text-xs text-white/40 leading-relaxed max-w-2xl">
              Forecasts open before each Meridian Cycle reveal. Predict which vertical and country combination
              will win the public vote. Active forecasts lock at the deadline — no changes after. Resolved
              forecasts show the winning outcome and award points to correct prophets. All predictions are
              immutable and publicly auditable on the 8th Ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}