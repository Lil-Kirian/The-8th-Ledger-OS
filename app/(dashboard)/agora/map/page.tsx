"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {

  ArrowLeft,
  ChevronRight,
  MapPin,
  Lock,
  Unlock,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

// ── Types

interface Cycle {
  id: string;
  continent: string;
  phase: string;
  startAt: string;
  endAt: string;
  lockStatus: string;
}

interface PastWinner {
  cycleId: string;
  continent: string;
  poolName: string;
  vertical: string;
  forgedAt: string;
}

// ── Fetcher

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Continent Data

const CONTINENTS = [
  { id: "africa", name: "Africa", emoji: "🌍", color: "from-amber-500/20 to-transparent", locked: false },
  { id: "asia", name: "Asia", emoji: "🌏", color: "from-cyan-500/20 to-transparent", locked: false },
  { id: "europe", name: "Europe", emoji: "🌍", color: "from-violet-500/20 to-transparent", locked: false },
  { id: "americas", name: "Americas", emoji: "🌎", color: "from-emerald-500/20 to-transparent", locked: false },
  { id: "middle_east", name: "Middle East", emoji: "🌍", color: "from-rose-500/20 to-transparent", locked: false },
  { id: "oceania", name: "Oceania", emoji: "🌏", color: "from-blue-500/20 to-transparent", locked: false },
];

const PHASES = [
  { id: "hush", name: "The Hush", duration: 48, desc: "48 hours of silence. The Architect watches." },
  { id: "unveil", name: "The Unveil", duration: 24, desc: "4 blurred pools. 1 winner. 24 hours." },
  { id: "reveal", name: "The Reveal", duration: 24, desc: "Full data. One vote. Tally hidden 12h." },
  { id: "forge", name: "The Forge", duration: 6, desc: "Winner forged. Pool opens. Early Ledger status." },
  { id: "complete", name: "Complete", duration: 0, desc: "Cycle complete. Next continent prepares." },
];

// ── Countdown Hook

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ── Components

function ContinentCard({
  continent,
  isActive,
  isLocked,
  isNext,
}: {
  continent: (typeof CONTINENTS)[0];
  isActive: boolean;
  isLocked: boolean;
  isNext: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${
        isActive
          ? "border-cyan-500/30 bg-cyan-500/5"
          : isLocked
          ? "border-white/5 bg-white/[0.02] opacity-50"
          : isNext
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${continent.color} opacity-30`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{continent.emoji}</span>
            <div>
              <h3 className={`font-semibold ${isActive ? "text-cyan-300" : "text-white/70"}`}>
                {continent.name}
              </h3>
              <p className="text-xs text-white/30">
                {isActive ? "Current Cycle" : isLocked ? "Locked 2 cycles" : isNext ? "Next in rotation" : "In queue"}
              </p>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
            {isActive ? (
              <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
            ) : isLocked ? (
              <Lock className="h-4 w-4 text-white/20" />
            ) : (
              <Unlock className="h-4 w-4 text-white/20" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PhaseTimeline({ currentPhase }: { currentPhase: string }) {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {PHASES.map((phase, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={phase.id} className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                isCurrent
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : isPast
                  ? "bg-white/5 text-white/30"
                  : "bg-white/[0.02] text-white/20"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  isCurrent ? "bg-cyan-400 animate-pulse" : isPast ? "bg-emerald-400" : "bg-white/10"
                }`}
              />
              {phase.name}
            </div>
            {i < PHASES.length - 1 && (
              <ChevronRight className={`h-3 w-3 shrink-0 ${isPast ? "text-white/20" : "text-white/5"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─

export default function MapPage() {
  const { data: cycleData } = useSWR("/api/meridian/cycle", fetcher);
  const { data: pulseData } = useSWR("/api/agora/pulse", fetcher, { refreshInterval: 30000 });

  const currentCycle = cycleData?.cycle;
  const timeLeft = useCountdown(currentCycle?.endAt || new Date().toISOString());

  const currentContinent = currentCycle?.continent;
  const currentPhase = currentCycle?.phase;

  // Determine which continents are locked/active/next
  const continentStates = CONTINENTS.map((c, i) => {
    const isActive = c.id === currentContinent;
    // Simple rotation logic: winner locked for 2 cycles
    const isLocked = false; // Would need cycle history
    const isNext = false; // Would need cycle history
    return { ...c, isActive, isLocked, isNext };
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/agora" className="text-white/30 hover:text-white/60">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/60">The Agora</span>
          </div>
          <h1 className="text-3xl font-bold text-white">The Meridian Map</h1>
          <p className="mt-1 text-white/40">
            The cycle of global asset distribution. Where the 8th Ledger looks next.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Active Cycle Banner */}
        {currentCycle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-cyan-400/60 mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em]">Active Cycle</span>
                </div>
                <h2 className="text-2xl font-bold text-white capitalize">
                  {currentCycle.continent.replace("_", " ")} — {currentCycle.phase.replace("_", " ")}
                </h2>
                <p className="mt-1 text-white/40">
                  {PHASES.find((p) => p.id === currentPhase)?.desc}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-cyan-400">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30">Hours</div>
                </div>
                <div className="text-2xl text-white/10">:</div>
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-cyan-400">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30">Minutes</div>
                </div>
                <div className="text-2xl text-white/10">:</div>
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-cyan-400">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30">Seconds</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <PhaseTimeline currentPhase={currentPhase} />
            </div>
          </motion.div>
        )}

        {/* Continents Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Continent Rotation</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {continentStates.map((c, i) => (
              <ContinentCard
                key={c.id}
                continent={c}
                isActive={c.isActive}
                isLocked={c.isLocked}
                isNext={c.isNext}
              />
            ))}
          </div>
        </div>

        {/* Rotation Rules */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">The Rotation Protocol</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                <Lock className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Continent Lock</h4>
                <p className="text-xs text-white/30 mt-1">
                  Winner continent cannot source the next pool for 2 full cycles. Forces global spread.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">The Architect's Hand</h4>
                <p className="text-xs text-white/30 mt-1">
                  One wildcard pool per cycle. Not from public suggestion. The Architect proposes. The Council approves.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Trophy className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Early Ledger</h4>
                <p className="text-xs text-white/30 mt-1">
                  First 100 committers in a forged pool receive "Early Ledger" status and priority access.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <MapPin className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Location Hints</h4>
                <p className="text-xs text-white/30 mt-1">
                  During The Unveil, only location hints are shown. "West African Coast." Full data revealed in The Reveal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}