// components/meridian/cycle-timer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Globe, Clock, Lock, Sparkles, Shield, Flame } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES — Schema-aligned with MeridianCycle model
// ─────────────────────────────────────────────────────────────

type Phase = "hush" | "unveil" | "reveal" | "forge" | "complete";

interface CycleTimerProps {
  phase: Phase;
  continent: string;
  endAt: Date | string;
  startAt: Date | string;
  lockStatus?: "unlocked" | "locked";
  winnerPoolId?: string | null;
  totalPools?: number;
  totalVotes?: number;
  competingPools?: number;
}

interface PhaseConfig {
  label: string;
  subtitle: string;
  color: string;
  glow: string;
  dot: string;
  icon: React.ReactNode;
  durationHours: number;
}

// ─────────────────────────────────────────────────────────────
// PHASE CONFIGURATION — Matches Meridian Cycle spec
// ─────────────────────────────────────────────────────────────

const PHASE_MAP: Record<Phase, PhaseConfig> = {
  hush: {
    label: "THE HUSH",
    subtitle: "The Architect watches. The 8th Ledger waits.",
    color: "text-slate-300",
    glow: "bg-slate-500",
    dot: "bg-cyan-500",
    icon: <Sparkles className="w-5 h-5" />,
    durationHours: 48,
  },
  unveil: {
    label: "THE UNVEIL",
    subtitle: "4 pools. 1 winner. 24 hours.",
    color: "text-amber-400",
    glow: "bg-amber-500",
    dot: "bg-amber-500",
    icon: <Lock className="w-5 h-5" />,
    durationHours: 24,
  },
  reveal: {
    label: "THE REVEAL",
    subtitle: "Vote. Lock. Decide.",
    color: "text-cyan-400",
    glow: "bg-cyan-500",
    dot: "bg-cyan-500",
    icon: <Globe className="w-5 h-5" />,
    durationHours: 24,
  },
  forge: {
    label: "THE FORGE",
    subtitle: "The winner burns. The pool opens.",
    color: "text-emerald-400",
    glow: "bg-emerald-500",
    dot: "bg-emerald-500",
    icon: <Flame className="w-5 h-5" />,
    durationHours: 6,
  },
  complete: {
    label: "COMPLETE",
    subtitle: "The cycle has turned. The Meridian rests.",
    color: "text-slate-500",
    glow: "bg-slate-600",
    dot: "bg-slate-500",
    icon: <Shield className="w-5 h-5" />,
    durationHours: 0,
  },
};

// ─────────────────────────────────────────────────────────────
// TIME UTILITIES
// ─────────────────────────────────────────────────────────────

function parseDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

// ─────────────────────────────────────────────────────────────
// GLITCH TEXT — Memoized character animation
// ─────────────────────────────────────────────────────────────

function GlitchText({ text, colorClass }: { text: string; colorClass: string }) {
  const chars = useMemo(() => text.split(""), [text]);

  return (
    <span className={`inline-flex ${colorClass}`} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.04,
            duration: 0.3,
            ease: "easeOut",
          }}
          className="inline-block"
          style={{ willChange: "transform, opacity" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function CycleTimer({
  phase,
  continent,
  endAt: endAtRaw,
  startAt: startAtRaw,
  lockStatus = "unlocked",
  winnerPoolId,
  totalPools = 4,
  totalVotes = 0,
  competingPools,
}: CycleTimerProps) {
  const endAt = useMemo(() => parseDate(endAtRaw), [endAtRaw]);
  const startAt = useMemo(() => parseDate(startAtRaw), [startAtRaw]);
  const config = PHASE_MAP[phase];

  // ── Timer state ───────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endAt.getTime() - Date.now()));
  const [isExpired, setIsExpired] = useState(false);

  // ── Motion values for smooth progress (no re-render) ──────
  const progressValue = useMotionValue(0);
  const progressWidth = useTransform(progressValue, [0, 100], ["0%", "100%"]);

  // ── Calculate progress percentage ─────────────────────────
  const totalDuration = useMemo(() => endAt.getTime() - startAt.getTime(), [endAt, startAt]);
  const progressPercent = useMemo(() => {
    if (totalDuration <= 0) return 100;
    const elapsed = totalDuration - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [totalDuration, timeLeft]);

  // ── Animate progress bar smoothly ─────────────────────────
  useEffect(() => {
    const controls = animate(progressValue, progressPercent, {
      duration: 0.8,
      ease: "easeInOut",
    });
    return controls.stop;
  }, [progressPercent, progressValue]);

  // ── Tick every second ─────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, endAt.getTime() - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) setIsExpired(true);
    };

    tick(); // Initial
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  // ── Hydration-safe mount ──────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <CycleTimerSkeleton phase={phase} />;

  // ── Derived display values ────────────────────────────────
  const displayPools = competingPools ?? totalPools;
  const isLocked = lockStatus === "locked" || phase === "complete" || isExpired;

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/80 backdrop-blur-xl"
      aria-label={`Meridian Cycle: ${config.label}`}
    >
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={
            phase === "hush"
              ? { scale: [1, 1.6, 1], opacity: [0.03, 0.08, 0.03] }
              : { opacity: 0.05 }
          }
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full ${config.glow} blur-[100px]`}
        />
      </div>

      <div className="relative z-10 p-8 md:p-12 text-center space-y-8">
        {/* ── Phase Badge ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={phase === "hush" ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
            className={`relative w-3 h-3 rounded-full ${config.dot}`}
          >
            <span className="absolute inset-0 rounded-full bg-current animate-ping opacity-40" />
          </motion.div>
          <span
            className={`text-xs font-bold uppercase tracking-[0.25em] ${config.color}`}
          >
            {config.label}
          </span>
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
        </div>

        {/* ── Continent ────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight">
            <GlitchText text={continent.toUpperCase()} colorClass={config.color} />
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-medium max-w-md mx-auto">
            {config.subtitle}
          </p>
        </div>

        {/* ── Timer ────────────────────────────────────────── */}
        <div className="space-y-4" role="timer" aria-live="polite" aria-atomic="true">
          <div
            className={`font-mono font-bold tracking-wider ${
              isExpired ? "text-slate-600" : "text-slate-100"
            }`}
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.1 }}
          >
            {isExpired ? "CYCLE COMPLETE" : formatDuration(timeLeft)}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-lg mx-auto h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              style={{ width: progressWidth }}
              className={`h-full rounded-full ${config.dot}`}
            />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {config.durationHours}h cycle
            </span>
            <span className="text-slate-700">•</span>
            <span>{Math.round(progressPercent)}% elapsed</span>

            {phase === "reveal" && (
              <>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  {totalVotes.toLocaleString()} votes
                </span>
              </>
            )}

            {(phase === "unveil" || phase === "reveal") && (
              <>
                <span className="text-slate-700">•</span>
                <span>{displayPools} pools</span>
              </>
            )}

            {winnerPoolId && phase === "forge" && (
              <>
                <span className="text-slate-700">•</span>
                <span className="text-emerald-400 font-medium">
                  Winner: {winnerPoolId.slice(0, 8)}...
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Phase-specific CTA / Status ──────────────────── */}
        {phase === "hush" && (
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-xs text-slate-600 font-mono tracking-wide"
          >
            The 8th Ledger observes. The Meridian turns.
          </motion.p>
        )}

        {phase === "forge" && !isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-xl backdrop-blur-sm"
          >
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-semibold">
              Pool is LIVE — Commit to Earn
            </span>
          </motion.div>
        )}

        {phase === "complete" && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Awaiting next rotation</span>
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON — Prevents hydration mismatch
// ─────────────────────────────────────────────────────────────

function CycleTimerSkeleton({ phase }: { phase: Phase }) {
  const config = PHASE_MAP[phase];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/80 p-8 md:p-12 animate-pulse">
      <div className="text-center space-y-8">
        <div className={`h-4 w-32 mx-auto rounded ${config.glow} opacity-20`} />
        <div className={`h-16 md:h-20 w-64 mx-auto rounded ${config.glow} opacity-20`} />
        <div className={`h-12 w-48 mx-auto rounded ${config.glow} opacity-20`} />
      </div>
    </div>
  );
}