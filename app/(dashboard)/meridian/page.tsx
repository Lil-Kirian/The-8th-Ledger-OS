// app/(dashboard)/meridian/page.tsx
// 8th Ledger — The Meridian: Pool Creation Cycle Hub
// The forge where assets are born through democratic fire.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Clock,
  Globe,
  Flame,
  Lock,
  Eye,
  Vote,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  History,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

//
// TYPES
//

type MeridianPhase = "hush" | "unveil" | "reveal" | "forge" | "complete";

interface CyclePool {
  id: string;
  poolId: string;
  voteCount: number;
  voteWeight: number;
  isWinner: boolean;
  revealedAt: string | null;
  pool: {
    name: string;
    verticalId: string;
    country: string;
    listedPrice: number | null;
    trueCost: number | null;
    imageUrl: string | null;
    emojiSet: string;
    minCommitment: number;
    riskLevel: string;
    estRevenue: string;
  };
}

interface MeridianCycle {
  id: string;
  continent: string;
  phase: MeridianPhase;
  startAt: string;
  endAt: string;
  lockStatus: string;
  winnerPoolId: string | null;
  createdAt: string;
  cyclePools: CyclePool[];
  _count?: { cycleVotes: number };
}

interface CycleArchive {
  id: string;
  continent: string;
  phase: MeridianPhase;
  winnerPoolId: string | null;
  startAt: string;
  endAt: string;
  cyclePools: { id: string; poolId?: string; pool: { name: string; verticalId: string } }[];
}

//
// CONSTANTS
//

const CONTINENTS = [
  { id: "africa", name: "Africa", emoji: "🌍", color: "from-amber-500/20 to-orange-500/20" },
  { id: "asia", name: "Asia", emoji: "🌏", color: "from-rose-500/20 to-pink-500/20" },
  { id: "europe", name: "Europe", emoji: "🌍", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "americas", name: "Americas", emoji: "🌎", color: "from-emerald-500/20 to-teal-500/20" },
  { id: "middle_east", name: "Middle East", emoji: "🌍", color: "from-amber-500/20 to-yellow-500/20" },
  { id: "oceania", name: "Oceania", emoji: "🌏", color: "from-sky-500/20 to-indigo-500/20" },
];

const VERTICAL_META: Record<string, { label: string; icon: string; color: string }> = {
  ledgerprop: { label: "LedgerProp", icon: "🏠", color: "text-emerald-400" },
  ledgerauto: { label: "LedgerAuto", icon: "🚗", color: "text-blue-400" },
  ledgertech: { label: "LedgerTech", icon: "📱", color: "text-violet-400" },
  ledgeredu: { label: "LedgerEdu", icon: "🎓", color: "text-amber-400" },
  ledgerhealth: { label: "LedgerHealth", icon: "🏥", color: "text-rose-400" },
  ledgerbiz: { label: "LedgerBiz", icon: "🏗️", color: "text-orange-400" },
  ledgertravel: { label: "LedgerTravel", icon: "✈️", color: "text-sky-400" },
  ledgeragri: { label: "LedgerAgri", icon: "🌾", color: "text-lime-400" },
  ledgerenergy: { label: "LedgerEnergy", icon: "⚡", color: "text-yellow-400" },
  ledgeraccess: { label: "LedgerAccess", icon: "🔑", color: "text-cyan-400" },
};

const PHASE_META: Record<MeridianPhase, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
  hush: {
    title: "The Hush",
    subtitle: "The Architect watches. The 8th Ledger waits.",
    icon: <Clock className="w-5 h-5" />,
    color: "text-cyan-400",
  },
  unveil: {
    title: "The Unveil",
    subtitle: "4 pools. 1 winner. 24 hours.",
    icon: <Eye className="w-5 h-5" />,
    color: "text-violet-400",
  },
  reveal: {
    title: "The Reveal",
    subtitle: "One vote. One winner. The ledger decides.",
    icon: <Vote className="w-5 h-5" />,
    color: "text-emerald-400",
  },
  forge: {
    title: "The Forge",
    subtitle: "The asset is born. The pool opens.",
    icon: <Flame className="w-5 h-5" />,
    color: "text-amber-400",
  },
  complete: {
    title: "Complete",
    subtitle: "The cycle has ended. The asset lives.",
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-slate-400",
  },
};

//
// FETCHER
//

const fetcher = (url: string) => fetch(url).then((r) => r.json());

//
// COUNTDOWN HOOK
//

function useCountdown(targetDate: string | null) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return {
    total: remaining,
    formatted: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    isExpired: remaining === 0,
  };
}

//
// GLITCH TEXT COMPONENT
//

function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 translate-x-[2px] text-red-500/50 opacity-70 animate-pulse">
        {text}
      </span>
      <span className="absolute top-0 left-0 -z-10 -translate-x-[2px] text-cyan-500/50 opacity-70 animate-pulse delay-75">
        {text}
      </span>
    </span>
  );
}

//
// MAIN PAGE
//

export default function MeridianPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  // Current active cycle
  const {
    data: currentData,
    error: currentError,
    isLoading: currentLoading,
  } = useSWR<{ cycle: MeridianCycle | null }>("/api/meridian/cycle", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Cycle archive
  const { data: archiveData } = useSWR<{ cycles: CycleArchive[] }>(
    "/api/meridian/cycle?archive=true",
    fetcher,
  );

  const currentCycle = currentData?.cycle;
  const countdown = useCountdown(currentCycle?.endAt ?? null);

  const handleVote = useCallback(async (cycleId: string, poolId: string) => {
    try {
      const res = await fetch(`/api/meridian/cycle/${cycleId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId }),
      });
      if (!res.ok) throw new Error("Vote failed");
      // SWR will revalidate
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }, []);

  //
  // RENDER: LOADING
  //

  if (currentLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Loading Meridian Cycle
          </p>
        </div>
      </div>
    );
  }

  //
  // RENDER: ERROR
  //

  if (currentError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <h2 className="text-xl font-semibold text-white">
            Cycle Data Unavailable
          </h2>
          <p className="text-slate-400 text-sm">
            The Meridian engine is experiencing turbulence. The Architect has
            been notified.
          </p>
        </div>
      </div>
    );
  }

  //
  // RENDER: NO ACTIVE CYCLE
  //

  if (!currentCycle) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-6 h-6 text-cyan-400" />
              <h1 className="text-3xl font-bold tracking-tight">
                The Meridian
              </h1>
            </div>
            <p className="text-slate-400 max-w-xl">
              The forge where assets are born through democratic fire. No cycle
              is currently active.
            </p>
          </div>

          {/* Next Cycle Teaser */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                <Clock className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                The Hush Approaches
              </h2>
              <p className="text-slate-400 mb-6">
                The next cycle will begin soon. The Architect is selecting the
                continent.
              </p>
              <div className="flex justify-center gap-2">
                {CONTINENTS.map((c) => (
                  <div
                    key={c.id}
                    className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg opacity-50"
                    title={c.name}
                  >
                    {c.emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Archive */}
          {archiveData?.cycles && archiveData.cycles.length > 0 && (
            <div className="mt-16">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Past Cycles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archiveData.cycles.map((cycle) => (
                  <CycleArchiveCard key={cycle.id} cycle={cycle} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const phaseMeta = PHASE_META[currentCycle.phase];
  const continentMeta = CONTINENTS.find((c) => c.id === currentCycle.continent);

  //
  // RENDER: ACTIVE CYCLE
  //

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ─ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <h1 className="text-3xl font-bold tracking-tight">The Meridian</h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium uppercase tracking-wider">
              Live
            </span>
          </div>
          <p className="text-slate-400 max-w-xl">
            The forge where assets are born through democratic fire. The 8th
            Ledger commands the cycle. The community writes the law.
          </p>
        </div>

        {/* ── Phase Hero  */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 mb-12">
          {/* Dynamic background based on phase */}
          <div className="absolute inset-0">
            {currentCycle.phase === "hush" && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent animate-pulse" />
            )}
            {currentCycle.phase === "unveil" && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
            )}
            {currentCycle.phase === "reveal" && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
            )}
            {currentCycle.phase === "forge" && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
            )}
          </div>

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`${phaseMeta.color}`}>{phaseMeta.icon}</span>
                  <span
                    className={`text-sm font-semibold uppercase tracking-wider ${phaseMeta.color}`}
                  >
                    {phaseMeta.title}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-2">
                  {currentCycle.phase === "hush" ? (
                    <GlitchText
                      text={continentMeta?.name || currentCycle.continent}
                      className="text-cyan-400"
                    />
                  ) : (
                    continentMeta?.name || currentCycle.continent
                  )}
                </h2>
                <p className="text-slate-400 text-lg">{phaseMeta.subtitle}</p>
              </div>

              {/* Countdown */}
              {currentCycle.phase !== "complete" && (
                <div className="flex flex-col items-center md:items-end">
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                    Time Remaining
                  </div>
                  <div className="font-mono text-4xl md:text-5xl font-bold text-white tracking-wider">
                    {countdown.isExpired ? "00:00:00" : countdown.formatted}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Ends {new Date(currentCycle.endAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Phase indicator dots */}
            <div className="flex items-center gap-2 mt-8">
              {(["hush", "unveil", "reveal", "forge"] as MeridianPhase[]).map(
                (p, i) => (
                  <div key={p} className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                        p === currentCycle.phase
                          ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] scale-125"
                          : p === "complete" ||
                              (currentCycle.phase === "forge" && p === "forge")
                            ? "bg-slate-600"
                            : "bg-slate-700"
                      }`}
                    />
                    {i < 3 && <div className="w-8 h-px bg-slate-800" />}
                  </div>
                ),
              )}
              <span className="ml-2 text-xs text-slate-500 uppercase tracking-wider">
                {currentCycle.phase === "hush"
                  ? "Phase 1 of 4"
                  : currentCycle.phase === "unveil"
                    ? "Phase 2 of 4"
                    : currentCycle.phase === "reveal"
                      ? "Phase 3 of 4"
                      : "Phase 4 of 4"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Phase-Specific Content ─ */}

        {/* HUSH: Pulsing dot, dark screen */}
        {currentCycle.phase === "hush" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative mb-8">
              <div className="w-4 h-4 rounded-full bg-cyan-400 animate-ping absolute inset-0" />
              <div className="w-4 h-4 rounded-full bg-cyan-400 relative shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-cyan-400">
              <GlitchText text={continentMeta?.name || ""} />
            </h3>
            <p className="text-slate-500 max-w-md">
              The Architect watches. The 8th Ledger waits. In{" "}
              {countdown.formatted}, the veil lifts.
            </p>
          </motion.div>
        )}

        {/* UNVEIL: Blurred cards, location hints */}
        {currentCycle.phase === "unveil" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-400" />
                Competing Pools
              </h3>
              <span className="text-xs text-slate-500">
                {currentCycle.cyclePools.length} candidates • Tally hidden
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentCycle.cyclePools.map((cp, idx) => (
                <UnveilCard key={cp.id} cyclePool={cp} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* REVEAL: Full data, voting */}
        {currentCycle.phase === "reveal" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Vote className="w-5 h-5 text-emerald-400" />
                Vote for the Winner
              </h3>
              <span className="text-xs text-slate-500">
                One vote per subject • {currentCycle._count?.cycleVotes || 0}{" "}
                votes cast
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentCycle.cyclePools.map((cp) => (
                <RevealCard
                  key={cp.id}
                  cyclePool={cp}
                  cycleId={currentCycle.id}
                  onVote={handleVote}
                  hasVoted={false} // TODO: fetch from user data
                />
              ))}
            </div>
          </div>
        )}

        {/* FORGE: Winner card, commit button */}
        {currentCycle.phase === "forge" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Forged Asset
              </h3>
              <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                Live Pool
              </span>
            </div>
            {currentCycle.cyclePools
              .filter((cp) => cp.isWinner)
              .map((cp) => (
                <ForgeCard key={cp.id} cyclePool={cp} />
              ))}
          </div>
        )}

        {/* ── Continent Rotation Map ─ */}
        <div className="mt-16 mb-8">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-400" />
            Continent Rotation
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {CONTINENTS.map((c) => {
              const isCurrent = c.id === currentCycle.continent;
              const isLocked = false; // TODO: calculate from cycle history

              return (
                <div
                  key={c.id}
                  className={`relative rounded-xl border p-4 text-center transition-all ${
                    isCurrent
                      ? "border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                      : "border-slate-800 bg-slate-900/30"
                  }`}
                >
                  <div className="text-2xl mb-1">{c.emoji}</div>
                  <div
                    className={`text-xs font-medium ${isCurrent ? "text-cyan-400" : "text-slate-500"}`}
                  >
                    {c.name}
                  </div>
                  {isCurrent && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[10px] font-bold uppercase">
                      Active
                    </div>
                  )}
                  {isLocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-slate-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Winner continent is locked for 2 cycles. Forces global spread.
            Prevents concentration.
          </p>
        </div>

        {/* ── Archive ─ */}
        {archiveData?.cycles && archiveData.cycles.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Past Cycles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archiveData.cycles.slice(0, 6).map((cycle) => (
                <CycleArchiveCard key={cycle.id} cycle={cycle} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//
// SUB-COMPONENTS
//

function UnveilCard({ cyclePool, index }: { cyclePool: CyclePool; index: number }) {
  const vertical = VERTICAL_META[cyclePool.pool.verticalId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative group rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden"
    >
      {/* Blurred image overlay */}
      <div className="absolute inset-0 opacity-30">
        {cyclePool.pool.imageUrl ? (
          <img
            src={cyclePool.pool.imageUrl}
            alt=""
            className="w-full h-full object-cover blur-xl scale-110"
          />
        ) : (
          <div className="w-full h-full bg-slate-800" />
        )}
      </div>

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-lg">
            {vertical?.icon || "📦"}
          </div>
          <Lock className="w-4 h-4 text-slate-600" />
        </div>

        <div className="space-y-2 mb-4">
          <div className="h-4 bg-slate-800/80 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-slate-800/80 rounded w-1/2 animate-pulse" />
        </div>

        <div className="text-xs text-slate-500 mb-1">Location Hint</div>
        <div className="text-sm font-medium text-slate-300">
          {cyclePool.pool.country}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
          <span className={`text-xs font-medium ${vertical?.color || "text-slate-400"}`}>
            {vertical?.label || cyclePool.pool.verticalId}
          </span>
          <span className="text-xs text-slate-600">🔒 Locked</span>
        </div>
      </div>
    </motion.div>
  );
}

function RevealCard({
  cyclePool,
  cycleId,
  onVote,
  hasVoted,
}: {
  cyclePool: CyclePool;
  cycleId: string;
  onVote: (cycleId: string, poolId: string) => void;
  hasVoted: boolean;
}) {
  const vertical = VERTICAL_META[cyclePool.pool.verticalId];
  const percent = cyclePool.voteCount; // Simplified — real data would calculate %

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden hover:border-slate-700 transition-colors"
    >
      {cyclePool.pool.imageUrl && (
        <div className="h-32 overflow-hidden">
          <img
            src={cyclePool.pool.imageUrl}
            alt={cyclePool.pool.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{vertical?.icon || "📦"}</span>
          <span className={`text-xs font-semibold uppercase tracking-wider ${vertical?.color || "text-slate-400"}`}>
            {vertical?.label || cyclePool.pool.verticalId}
          </span>
        </div>

        <h4 className="font-semibold text-white mb-1">{cyclePool.pool.name}</h4>
        <p className="text-xs text-slate-400 mb-3">{cyclePool.pool.country}</p>

        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {cyclePool.pool.estRevenue || "8-12%"} annually
          </span>
          <span>Min: ${cyclePool.pool.minCommitment}</span>
        </div>

        {/* Vote bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">{cyclePool.voteCount} votes</span>
            <span className="text-emerald-400">{cyclePool.voteWeight.toFixed(1)} weight</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percent)}%` }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </div>
        </div>

        <button
          onClick={() => onVote(cycleId, cyclePool.poolId)}
          disabled={hasVoted}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
            hasVoted
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95"
          }`}
        >
          {hasVoted ? "Vote Recorded" : "Vote for This Pool"}
        </button>
      </div>
    </motion.div>
  );
}

function ForgeCard({ cyclePool }: { cyclePool: CyclePool }) {
  const vertical = VERTICAL_META[cyclePool.pool.verticalId];
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl border border-amber-500/30 bg-slate-900/80 overflow-hidden max-w-2xl mx-auto"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

      <div className="relative z-10 p-8 md:p-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider mb-6"
        >
          <Flame className="w-4 h-4" />
          Forged
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{cyclePool.pool.name}</h2>
        <p className="text-slate-400 mb-6">
          {vertical?.label || cyclePool.pool.verticalId} • {cyclePool.pool.country}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-lg font-bold text-white">${cyclePool.pool.listedPrice || "—"}</div>
            <div className="text-xs text-slate-500">Listed Price</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-lg font-bold text-emerald-400">{cyclePool.pool.estRevenue || "—"}</div>
            <div className="text-xs text-slate-500">Est. Revenue</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="text-lg font-bold text-white">${cyclePool.pool.minCommitment}</div>
            <div className="text-xs text-slate-500">Min Commit</div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/pools/${cyclePool.poolId}`)}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors active:scale-95"
        >
          Commit to Earn
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-slate-600 mt-4">
          First 100 committers receive "Early Ledger" status
        </p>
      </div>
    </motion.div>
  );
}

function CycleArchiveCard({ cycle }: { cycle: CycleArchive }) {
  const router = useRouter();
  const continent = CONTINENTS.find((c) => c.id === cycle.continent);
  const winner = cycle.cyclePools.find((cp) => (cp.poolId ?? cp.id) === cycle.winnerPoolId);

  return (
    <div
      onClick={() => router.push(`/meridian/cycle/${cycle.id}`)}
      className="group rounded-xl border border-slate-800 bg-slate-900/30 p-5 hover:border-slate-700 hover:bg-slate-900/50 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{continent?.emoji}</span>
          <span className="text-sm font-medium text-white">{continent?.name || cycle.continent}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>

      <div className="text-xs text-slate-500 mb-2">
        {new Date(cycle.startAt).toLocaleDateString()} — {new Date(cycle.endAt).toLocaleDateString()}
      </div>

      {winner ? (
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300">{winner.pool.name}</span>
          <span className="text-xs text-slate-500">({winner.pool.verticalId})</span>
        </div>
      ) : (
        <div className="text-xs text-slate-600">No winner recorded</div>
      )}

      <div className="mt-3 text-xs text-slate-600">
        {cycle.cyclePools.length} competing pools
      </div>
    </div>
  );
}
