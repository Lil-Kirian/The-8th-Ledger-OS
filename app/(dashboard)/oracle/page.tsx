// app/(dashboard)/oracle/page.tsx
// 8th Ledger — The Oracle: Foresight Engine
// Production-grade: SWR-powered, animated, API-connected, error-resilient

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import {
  Eye,
  Sparkles,
  Target,
  Trophy,
  Flame,
  Globe,
  CheckCircle2,
  Clock,
  ChevronRight,
  Star,
  Crown,
  Medal,
  TrendingUp,
  Activity,
  Zap,
  ArrowRight,
  Hash,
  Lock,
  Unlock,
  BarChart3,
  AlertTriangle,
  Sparkle,
  BrainCircuit,
  Telescope,
  Fingerprint,
  Loader2,
  RefreshCw,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/* ============================================================
   TYPES — Aligned with API + Schema
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
};

type UserPrediction = {
  id: string;
  forecastId: string;
  forecastTitle: string;
  vertical: string;
  country: string;
  pointsEarned: number;
  status: "pending" | "correct" | "incorrect";
  createdAt: string;
};

type StandingTier = "novice" | "seer" | "oracle" | "prophet";

type OracleStanding = {
  totalPoints: number;
  correctCount: number;
  totalPredictions: number;
  tier: StandingTier;
  streak: number;
  rank: number;
  nextTier: { name: string; remaining: number };
};

type LeaderboardEntry = {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  totalPoints: number;
  correctCount: number;
  tier: StandingTier;
  streak: number;
};

type Toast = { id: string; message: string; type: "success" | "error" | "info" };

/* ============================================================
   CONSTANTS — The Oracle Codex
   ============================================================ */
const VERTICALS = [
  { slug: "ledgerprop", name: "LedgerProp", icon: "🏠", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/20" },
  { slug: "ledgerauto", name: "LedgerAuto", icon: "🚗", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", glow: "shadow-sky-500/20" },
  { slug: "ledgertech", name: "LedgerTech", icon: "📱", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "shadow-violet-500/20" },
  { slug: "ledgeredu", name: "LedgerEdu", icon: "🎓", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "shadow-indigo-500/20" },
  { slug: "ledgerhealth", name: "LedgerHealth", icon: "🏥", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-rose-500/20" },
  { slug: "ledgerbiz", name: "LedgerBiz", icon: "🏗️", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/20" },
  { slug: "ledgertravel", name: "LedgerTravel", icon: "✈️", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "shadow-cyan-500/20" },
  { slug: "ledgeragri", name: "LedgerAgri", icon: "🌾", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20", glow: "shadow-lime-500/20" },
  { slug: "ledgerenergy", name: "LedgerEnergy", icon: "⚡", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", glow: "shadow-yellow-500/20" },
  { slug: "ledgeraccess", name: "LedgerAccess", icon: "📡", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", glow: "shadow-fuchsia-500/20" },
  { slug: "ledgersport", name: "LedgerSport", icon: "⚽", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-rose-500/20" },
];

const COUNTRIES = [
  { code: "KE", name: "Kenya", continent: "Africa", flag: "🇰🇪" },
  { code: "NG", name: "Nigeria", continent: "Africa", flag: "🇳🇬" },
  { code: "ZA", name: "South Africa", continent: "Africa", flag: "🇿🇦" },
  { code: "GH", name: "Ghana", continent: "Africa", flag: "🇬🇭" },
  { code: "CN", name: "China", continent: "Asia", flag: "🇨🇳" },
  { code: "JP", name: "Japan", continent: "Asia", flag: "🇯🇵" },
  { code: "IN", name: "India", continent: "Asia", flag: "🇮🇳" },
  { code: "SG", name: "Singapore", continent: "Asia", flag: "🇸🇬" },
  { code: "DE", name: "Germany", continent: "Europe", flag: "🇩🇪" },
  { code: "GB", name: "United Kingdom", continent: "Europe", flag: "🇬🇧" },
  { code: "FR", name: "France", continent: "Europe", flag: "🇫🇷" },
  { code: "US", name: "United States", continent: "Americas", flag: "🇺🇸" },
  { code: "CA", name: "Canada", continent: "Americas", flag: "🇨🇦" },
  { code: "BR", name: "Brazil", continent: "Americas", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", continent: "Americas", flag: "🇲🇽" },
  { code: "AE", name: "UAE", continent: "Middle East", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", continent: "Middle East", flag: "🇸🇦" },
  { code: "AU", name: "Australia", continent: "Oceania", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", continent: "Oceania", flag: "🇳🇿" },
  { code: "ID", name: "Indonesia", continent: "Oceania", flag: "🇮🇩" },
];

const TIER_CONFIG: Record<StandingTier, { label: string; color: string; bg: string; border: string; icon: React.ElementType; requirement: number; privilege: string }> = {
  novice: { label: "Novice", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Eye, requirement: 0, privilege: "Begin your journey" },
  seer: { label: "Seer", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Star, requirement: 10, privilege: "Bronze icon • Codex access" },
  oracle: { label: "Oracle", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", icon: Eye, requirement: 50, privilege: "Silver icon • Early pool access (24h)" },
  prophet: { label: "Prophet", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: Crown, requirement: 100, privilege: "Gold icon • Name on pool cards • Council invitation" },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   UTILS — Time & Format
   ============================================================ */
function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (remaining <= 0) return { text: "Locked", expired: true, parts: { days: 0, hours: 0, minutes: 0, seconds: 0 } };
  if (days > 0) return { text: `${days}d ${hours}h ${minutes}m`, expired: false, parts: { days, hours, minutes, seconds } };
  return { text: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`, expired: false, parts: { days, hours, minutes, seconds } };
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ============================================================
   TOAST SYSTEM — Lightweight
   ============================================================ */
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, addToast };
}

/* ============================================================
   COMPONENT — Toast Container
   ============================================================ */
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-md ${
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/80 text-emerald-300"
                : toast.type === "error"
                ? "border-crimson/30 bg-crimson/10 text-crimson"
                : "border-white/10 bg-surface-800/90 text-white/80"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="h-4 w-4" />}
            {toast.type === "error" && <XCircle className="h-4 w-4" />}
            {toast.type === "info" && <Info className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   COMPONENT — Standing Card (Redesigned)
   ============================================================ */
function StandingCard({ standing, isLoading }: { standing?: OracleStanding; isLoading: boolean }) {
  if (isLoading) return <StandingSkeleton />;
  if (!standing) return null;

  const tier = TIER_CONFIG[standing.tier];
  const TierIcon = tier.icon;
  const progressPct = Math.min((standing.correctCount / (standing.correctCount + standing.nextTier.remaining)) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-surface-800 via-surface-800 to-surface-700 p-6 sm:p-8"
    >
      {/* Ambient glow */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-600/5 blur-[100px]" />
      <div className="absolute -left-32 -bottom-32 h-64 w-64 rounded-full bg-cyan-600/5 blur-[80px]" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${tier.bg} border ${tier.border} shadow-lg ${tier.glow}`}
          >
            <TierIcon className={`h-8 w-8 ${tier.color}`} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/40 font-mono border border-white/5">Rank #{standing.rank}</span>
            </div>
            <p className="mt-1 text-xs text-white/40">
              {standing.correctCount} correct • {standing.totalPredictions} total predictions
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{standing.streak} streak</span>
              {standing.streak >= 3 && <Sparkle className="h-3 w-3 text-amber-400 animate-pulse" />}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-[10px] text-white/30 mb-2">
            <span className="uppercase tracking-wider">Path to {standing.nextTier.name}</span>
            <span className="font-mono">{standing.correctCount} / {standing.correctCount + standing.nextTier.remaining}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-400"
            />
          </div>
          <p className="mt-2 text-[10px] text-white/20">
            {standing.nextTier.remaining} more correct forecasts to ascend to {standing.nextTier.name}
          </p>
        </div>

        {/* Score */}
        <div className="text-right lg:pl-6">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Standing</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="font-space text-4xl font-bold text-white tabular-nums"
          >
            {standing.totalPoints}
          </motion.p>
          <p className="text-[10px] text-white/20">points earned</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Standing Skeleton
   ============================================================ */
function StandingSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/5 bg-surface-800 p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/5" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-3 w-40 rounded bg-white/5" />
          </div>
        </div>
        <div className="flex-1 max-w-md space-y-2">
          <div className="h-2.5 w-full rounded-full bg-white/5" />
          <div className="h-2 w-48 rounded bg-white/5" />
        </div>
        <div className="text-right">
          <div className="h-8 w-20 rounded bg-white/5 ml-auto" />
          <div className="h-2 w-16 rounded bg-white/5 ml-auto mt-2" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Forecast Card (Prophecy Tablet)
   ============================================================ */
function ForecastCard({
  forecast,
  onPredict,
  hasPredicted,
  isSubmitting,
}: {
  forecast: OracleForecast;
  onPredict: (forecastId: string, vertical: string, country: string) => Promise<void>;
  hasPredicted: boolean;
  isSubmitting: boolean;
}) {
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countdown = useCountdown(forecast.lockDate);
  const isLocked = forecast.status !== "active" || hasPredicted || submitted || countdown.expired;

  const handleSubmit = async () => {
    if (!selectedVertical || !selectedCountry) return;
    setError(null);
    try {
      await onPredict(forecast.id, selectedVertical, selectedCountry);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit prophecy");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-surface-800 p-5 sm:p-6"
    >
      {/* Subtle top accent */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
              <Telescope className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400/80">Prophecy</span>
            {forecast.type === "asset_launch" && (
              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">Asset Launch</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white sm:text-xl">{forecast.title}</h3>
          <p className="mt-1 text-xs text-white/40 leading-relaxed">{forecast.description}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">{countdown.text}</span>
        </div>
      </div>

      {/* Vertical Selection */}
      <div className="mb-4">
        <p className="mb-2.5 text-[10px] uppercase tracking-widest text-white/20 font-semibold">Select Vertical</p>
        <div className="flex flex-wrap gap-2">
          {forecast.verticalOptions.map((v) => {
            const vert = VERTICALS.find((x) => x.slug === v);
            if (!vert) return null;
            const isSelected = selectedVertical === v;
            return (
              <motion.button
                key={v}
                whileHover={!isLocked ? { scale: 1.05 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                onClick={() => !isLocked && setSelectedVertical(v)}
                disabled={isLocked}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? `${vert.bg} ${vert.color} ${vert.border} shadow-md ${vert.glow}`
                    : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60 hover:bg-white/[0.04]"
                } ${isLocked && !isSelected ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                <span className="text-sm">{vert.icon}</span>
                <span>{vert.name}</span>
                {isSelected && <CheckCircle2 className="h-3 w-3" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Country Selection */}
      <div className="mb-5">
        <p className="mb-2.5 text-[10px] uppercase tracking-widest text-white/20 font-semibold">Select Nation</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {forecast.countryOptions.map((c) => {
            const country = COUNTRIES.find((x) => x.code === c);
            if (!country) return null;
            const isSelected = selectedCountry === c;
            return (
              <motion.button
                key={c}
                whileHover={!isLocked ? { scale: 1.03 } : {}}
                whileTap={!isLocked ? { scale: 0.97 } : {}}
                onClick={() => !isLocked && setSelectedCountry(c)}
                disabled={isLocked}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-md shadow-cyan-500/10"
                    : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60 hover:bg-white/[0.04]"
                } ${isLocked && !isSelected ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                <span className="text-lg leading-none">{country.flag}</span>
                <span className="truncate">{country.name}</span>
                {isSelected && <CheckCircle2 className="ml-auto h-3 w-3 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 flex items-center gap-2 rounded-lg border border-crimson/20 bg-crimson/5 px-3 py-2 text-xs text-crimson">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[10px] text-white/20">
          <BrainCircuit className="h-3 w-3" />
          <span>{forecast.totalPredictions.toLocaleString()} prophecies cast</span>
        </div>
        {hasPredicted || submitted ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 border border-emerald-500/20"
          >
            <Lock className="h-3.5 w-3.5" />
            Prophecy Sealed
          </motion.div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!selectedVertical || !selectedCountry || isSubmitting || countdown.expired}
            variant="cyan"
            size="sm"
            isLoading={isSubmitting}
            className="shadow-lg shadow-cyan-500/10"
          >
            {!isSubmitting && <Sparkles className="h-3.5 w-3.5" />}
            Cast Prophecy
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Prediction History Row
   ============================================================ */
function PredictionRow({ prediction }: { prediction: UserPrediction }) {
  const vert = VERTICALS.find((v) => v.slug === prediction.vertical);
  const country = COUNTRIES.find((c) => c.code === prediction.country);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5 transition-all hover:border-white/10 hover:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            prediction.status === "correct"
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : prediction.status === "incorrect"
              ? "bg-crimson/10 text-crimson ring-1 ring-crimson/20"
              : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
          }`}
        >
          {prediction.status === "correct" ? <CheckCircle2 className="h-4 w-4" /> : prediction.status === "incorrect" ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{prediction.forecastTitle}</p>
          <div className="flex items-center gap-2 text-[10px] text-white/30 mt-0.5">
            <span className="flex items-center gap-1">{vert?.icon} <span className={vert?.color}>{vert?.name}</span></span>
            <span className="text-white/10">•</span>
            <span className="flex items-center gap-1">{country?.flag} {country?.name}</span>
            <span className="text-white/10">•</span>
            <span>{formatDate(prediction.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        {prediction.status === "correct" ? (
          <motion.p initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-sm font-bold text-emerald-400 tabular-nums">+{prediction.pointsEarned}</motion.p>
        ) : prediction.status === "incorrect" ? (
          <p className="text-sm font-bold text-crimson tabular-nums">0</p>
        ) : (
          <p className="text-sm font-bold text-amber-400">Pending</p>
        )}
        <p className="text-[9px] text-white/20 capitalize">{prediction.status}</p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Leaderboard Row
   ============================================================ */
function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const tier = TIER_CONFIG[entry.tier];
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: entry.rank * 0.04 }}
      className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-all ${
        isMe ? "border-violet-500/30 bg-violet-950/10 shadow-lg shadow-violet-500/5" : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.03]"
      }`}
    >
      {/* Rank */}
      <div className="flex w-8 items-center justify-center">
        {entry.rank === 1 ? (
          <Crown className="h-5 w-5 text-amber-400 drop-shadow-lg" />
        ) : entry.rank === 2 ? (
          <Medal className="h-5 w-5 text-slate-300" />
        ) : entry.rank === 3 ? (
          <Medal className="h-5 w-5 text-orange-400" />
        ) : (
          <span className="w-5 text-center text-xs font-bold text-white/30 tabular-nums">{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-white/10">
        <span className="text-sm font-bold text-violet-300">{entry.displayName.charAt(0)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-bold ${isMe ? "text-violet-300" : "text-white"}`}>{entry.displayName}</span>
          {isMe && (
            <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-300 border border-violet-500/30">
              You
            </span>
          )}
          <span className={`flex items-center gap-1 rounded-md ${tier.bg} px-1.5 py-0.5 text-[9px] font-bold ${tier.color} border ${tier.border}`}>
            <TierIcon className="h-2.5 w-2.5" />
            {tier.label}
          </span>
        </div>
        <div className="text-[10px] text-white/20 mt-0.5">{entry.country}</div>
      </div>

      {/* Stats */}
      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-white/20">Correct</p>
        <p className="text-xs font-bold text-emerald-400 tabular-nums">{entry.correctCount}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-white/20">Streak</p>
        <div className="flex items-center justify-end gap-1">
          <Flame className="h-3 w-3 text-orange-400" />
          <span className="text-xs font-bold text-orange-400 tabular-nums">{entry.streak}</span>
        </div>
      </div>
      <div className="text-right min-w-[60px]">
        <p className="text-sm font-bold text-white font-mono tabular-nums">{entry.totalPoints}</p>
        <p className="text-[9px] text-white/20">pts</p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Empty State
   ============================================================ */
function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-surface-800/50 py-16 px-6 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
        <Icon className="h-8 w-8 text-white/10" />
      </div>
      <h3 className="text-sm font-bold text-white/40">{title}</h3>
      <p className="mt-1 text-xs text-white/20 max-w-xs">{subtitle}</p>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Section Skeleton
   ============================================================ */
function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-white/5 bg-surface-800 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-white/5" />
              <div className="h-5 w-48 rounded bg-white/5" />
            </div>
            <div className="h-8 w-24 rounded bg-white/5" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-white/5" />
            <div className="h-2 w-3/4 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN PAGE — The Oracle
   ============================================================ */
export default function OraclePage() {
  const { user } = useAuth();
  const { toasts, addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"forecasts" | "history" | "leaderboard">("forecasts");
  const [submittingForecastId, setSubmittingForecastId] = useState<string | null>(null);

  // ── Data Fetching ─────────────────────────────────────────
  const { data: forecastsData, error: forecastsError, isLoading: forecastsLoading, mutate: mutateForecasts } = useSWR(
    "/api/oracle/forecasts",
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: standingData, isLoading: standingLoading } = useSWR(
    "/api/oracle/standing",
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: leaderboardData, isLoading: leaderboardLoading } = useSWR(
    "/api/oracle/leaderboard",
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: predictionsData, mutate: mutatePredictions } = useSWR(
    "/api/oracle/forecasts?my=true",
    fetcher,
    { refreshInterval: 30000 }
  );

  const forecasts: OracleForecast[] = forecastsData?.forecasts || [];
  const standing: OracleStanding | undefined = standingData?.standing;
  const leaderboard: LeaderboardEntry[] = leaderboardData?.leaderboard || [];
  const predictions: UserPrediction[] = predictionsData?.predictions || [];

  const predictedForecastIds = useMemo(
    () => new Set(predictions.filter((p) => p.status === "pending").map((p) => p.forecastId)),
    [predictions]
  );

  // ── Submit Prediction ─────────────────────────────────────
  const handlePredict = useCallback(
    async (forecastId: string, vertical: string, country: string) => {
      setSubmittingForecastId(forecastId);
      try {
        const res = await fetch(`/api/oracle/forecasts/${forecastId}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vertical, country }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to cast prophecy");
        }

        addToast("Prophecy cast successfully. The Oracle remembers.", "success");
        await Promise.all([mutateForecasts(), mutatePredictions()]);
      } catch (err: any) {
        addToast(err.message || "The Oracle could not hear your prophecy", "error");
        throw err;
      } finally {
        setSubmittingForecastId(null);
      }
    },
    [addToast, mutateForecasts, mutatePredictions]
  );

  const accuracy = standing ? ((standing.correctCount / Math.max(standing.totalPredictions, 1)) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      <ToastContainer toasts={toasts} />

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1"
          >
            <Telescope className="h-3 w-3 text-violet-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">The Oracle</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-space text-3xl font-bold text-white sm:text-4xl"
          >
            Foresight Engine
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 max-w-lg text-sm text-white/40 leading-relaxed"
          >
            Predict the future of the 8th Ledger. No stakes. No money. Just standing.
            Correct prophecies earn you rank, recognition, and early access.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Global Rank</p>
            <p className="font-space text-lg font-bold text-white tabular-nums">
              {standingLoading ? "—" : standing ? `#${standing.rank}` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Accuracy</p>
            <p className="font-space text-lg font-bold text-emerald-400 tabular-nums">
              {standingLoading ? "—" : `${accuracy}%`}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Standing Card ────────────────────────────────────── */}
      <StandingCard standing={standing} isLoading={standingLoading} />

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1"
      >
        {[
          { id: "forecasts" as const, label: "Active Prophecies", count: forecasts.length },
          { id: "history" as const, label: "Your History", count: predictions.length },
          { id: "leaderboard" as const, label: "Standing", count: leaderboard.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id ? "text-white" : "text-white/30 hover:text-white/60"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="oracle-tab"
                className="absolute inset-0 rounded-lg bg-violet-500/15 border border-violet-500/25"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            <span
              className={`relative z-10 rounded-md px-1.5 py-0.5 text-[9px] font-mono ${
                activeTab === tab.id ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-white/30"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── Active Forecasts ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "forecasts" && (
          <motion.div
            key="forecasts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {forecastsLoading ? (
              <SectionSkeleton />
            ) : forecastsError ? (
              <EmptyState icon={AlertTriangle} title="The Oracle is silent" subtitle="Could not load prophecies. The stars will align shortly." />
            ) : forecasts.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No active prophecies"
                subtitle="The next Meridian Cycle opens soon. Return when the Oracle awakens."
              />
            ) : (
              forecasts.map((forecast) => (
                <ForecastCard
                  key={forecast.id}
                  forecast={forecast}
                  onPredict={handlePredict}
                  hasPredicted={predictedForecastIds.has(forecast.id)}
                  isSubmitting={submittingForecastId === forecast.id}
                />
              ))
            )}
          </motion.div>
        )}

        {/* ── History ──────────────────────────────────────────── */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {predictions.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No prophecies cast"
                  subtitle="Your history begins with your first prediction. Choose a forecast above."
                />
              ) : (
                predictions.map((p) => <PredictionRow key={p.id} prediction={p} />)
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Leaderboard ────────────────────────────────────── */}
        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {leaderboardLoading ? (
              <SectionSkeleton />
            ) : leaderboard.length === 0 ? (
              <EmptyState icon={Trophy} title="The Scroll is empty" subtitle="No sovereigns have earned standing yet. Be the first." />
            ) : (
              <>
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <LeaderboardRow key={entry.rank} entry={entry} isMe={entry.ledgerId === user?.ledgerId} />
                  ))}
                </div>

                {/* Tier Explainer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-white/5 bg-surface-800 p-5"
                >
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
                            {config.requirement === 0 ? "Starting tier" : `${config.requirement} correct required`}
                          </p>
                          <p className="mt-2 text-[10px] text-white/20 leading-relaxed">{config.privilege}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── How It Works ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-white/5 bg-surface-800 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <Zap className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">How The Oracle Works</h4>
            <p className="mt-2 text-xs text-white/40 leading-relaxed max-w-2xl">
              Before each Meridian Cycle reveal, the Oracle opens a forecast window. Pick the vertical and country
              you believe will win the public vote. No money required. No risk. If you are correct, you earn
              Oracle Standing points that unlock tiers, early access, and recognition. Incorrect forecasts cost
              nothing. Your streak multiplies future rewards. All predictions are logged immutably on the 8th Ledger.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}