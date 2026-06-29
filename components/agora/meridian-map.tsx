// components/agora/meridian-map.tsx
// 8th Ledger — The Meridian Map
// A living globe. Continents breathe. The current cycle pulses with authority.

"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Lock,
  Unlock,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  MapPin,
  RotateCcw,
} from "lucide-react";

//
// TYPES — Schema-Aligned
//

export interface MeridianMapData {
  currentCycle: {
    continent: string;
    phase: "hush" | "unveil" | "reveal" | "forge" | "complete";
    timeRemaining: number;
    competingPools: number;
    totalVotes: number;
  } | null;
  rotation: {
    continent: string;
    status: "current" | "locked" | "available";
    cycleNumber: number;
  }[];
  pastWinners: {
    cycle: number;
    continent: string;
    poolName: string;
    vertical: string;
    forgedAt: string;
  }[];
}

interface MeridianMapProps {
  data: MeridianMapData;
}

//
// DESIGN SYSTEM
//

const CONTINENTS = [
  { id: "africa", name: "Africa", short: "AFR", emoji: "🌍", x: 52, y: 58, size: "lg" },
  { id: "europe", name: "Europe", short: "EUR", emoji: "🌍", x: 51, y: 28, size: "md" },
  { id: "asia", name: "Asia", short: "ASI", emoji: "🌏", x: 72, y: 32, size: "xl" },
  { id: "americas", name: "Americas", short: "AME", emoji: "🌎", x: 22, y: 42, size: "xl" },
  { id: "middle_east", name: "Middle East", short: "ME", emoji: "🌍", x: 58, y: 45, size: "sm" },
  { id: "oceania", name: "Oceania", short: "OCE", emoji: "🌏", x: 82, y: 72, size: "md" },
] as const;

const PHASE_CONFIG = {
  hush: {
    label: "The Hush",
    sub: "Anticipation builds",
    color: "from-slate-600 to-slate-800",
    glow: "shadow-slate-500/20",
    text: "text-slate-300",
    border: "border-slate-700",
    icon: Sparkles,
    pulse: false,
  },
  unveil: {
    label: "The Unveil",
    sub: "Pools emerge from shadow",
    color: "from-violet-600 to-indigo-800",
    glow: "shadow-violet-500/30",
    text: "text-violet-300",
    border: "border-violet-700",
    icon: Sparkles,
    pulse: true,
  },
  reveal: {
    label: "The Reveal",
    sub: "Democracy decides",
    color: "from-cyan-600 to-teal-800",
    glow: "shadow-cyan-500/30",
    text: "text-cyan-300",
    border: "border-cyan-700",
    icon: Globe,
    pulse: true,
  },
  forge: {
    label: "The Forge",
    sub: "The winner ignites",
    color: "from-amber-600 to-orange-800",
    glow: "shadow-amber-500/30",
    text: "text-amber-300",
    border: "border-amber-700",
    icon: Sparkles,
    pulse: true,
  },
  complete: {
    label: "Complete",
    sub: "Cycle archived",
    color: "from-emerald-600 to-green-800",
    glow: "shadow-emerald-500/20",
    text: "text-emerald-300",
    border: "border-emerald-700",
    icon: Lock,
    pulse: false,
  },
} as const;

//
// HELPERS
//

function formatTimeRemaining(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
  if (mins > 0) return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  return `${secs}s`;
}

function getContinentStatus(id: string, rotation: MeridianMapData["rotation"]) {
  return rotation.find((r) => r.continent === id)?.status || "available";
}

//
// SUB-COMPONENTS
//

function ContinentNode({
  continent,
  status,
  isCurrent,
  cycleNumber,
}: {
  continent: (typeof CONTINENTS)[number];
  status: string;
  isCurrent: boolean;
  cycleNumber: number;
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
  };

  const ringSizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: `${continent.x}%`,
        top: `${continent.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 * CONTINENTS.findIndex((c) => c.id === continent.id), duration: 0.6 }}
    >
      {/* Pulse ring for current */}
      {isCurrent && (
        <motion.div
          className={`absolute rounded-full border border-cyan-400/30 ${ringSizes[continent.size as keyof typeof ringSizes]}`}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Core dot */}
      <div
        className={`
          relative ${sizeClasses[continent.size as keyof typeof sizeClasses]} rounded-full
          flex items-center justify-center text-sm font-bold
          border-2 transition-all duration-500
          ${isCurrent
            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            : status === "locked"
            ? "bg-red-500/10 border-red-500/40 text-red-400/60"
            : "bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400"
          }
        `}
      >
        {isCurrent ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Globe className="w-5 h-5" />
          </motion.div>
        ) : status === "locked" ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <span className="text-[10px]">{continent.short}</span>
        )}
      </div>

      {/* Label */}
      <div className="mt-2 flex flex-col items-center">
        <span
          className={`text-[11px] font-semibold whitespace-nowrap ${
            isCurrent ? "text-cyan-300" : status === "locked" ? "text-red-400/50" : "text-slate-500"
          }`}
        >
          {continent.name}
        </span>
        {cycleNumber > 0 && (
          <span className="text-[9px] text-slate-600 font-mono mt-0.5">Cycle {cycleNumber}</span>
        )}
      </div>

      {/* Status indicator */}
      <div className="mt-1">
        {isCurrent ? (
          <span className="flex items-center gap-1 text-[9px] text-cyan-400/80 font-medium uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Active
          </span>
        ) : status === "locked" ? (
          <span className="flex items-center gap-1 text-[9px] text-red-400/50 font-medium uppercase tracking-widest">
            <Lock className="w-2.5 h-2.5" />
            Locked
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] text-slate-600 font-medium uppercase tracking-widest">
            <Unlock className="w-2.5 h-2.5" />
            Ready
          </span>
        )}
      </div>
    </motion.div>
  );
}

function PhaseBadge({
  phase,
  timeRemaining,
}: {
  phase: string;
  timeRemaining: number;
}) {
  const config = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG] || PHASE_CONFIG.hush;
  const Icon = config.icon;

  return (
    <motion.div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        bg-gradient-to-r ${config.color} bg-opacity-10
        border ${config.border} backdrop-blur-md
      `}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        bg-black/20 border border-white/10
        ${config.text}
      `}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className={`text-sm font-bold ${config.text}`}>{config.label}</div>
        <div className="text-[11px] text-slate-400">{config.sub}</div>
      </div>
      <div className="flex items-center gap-2 pl-3 border-l border-white/10">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-sm font-mono font-semibold text-slate-200 tabular-nums">
          {formatTimeRemaining(timeRemaining)}
        </span>
      </div>
    </motion.div>
  );
}

function StatPill({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`
      flex flex-col items-center px-4 py-3 rounded-xl
      border backdrop-blur-sm
      ${accent
        ? "bg-cyan-500/5 border-cyan-500/20"
        : "bg-slate-800/30 border-slate-700/40"
      }
    `}>
      <span className={`text-lg font-bold tabular-nums ${accent ? "text-cyan-400" : "text-slate-200"}`}>
        {value}
      </span>
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-medium mt-1">
        {label}
      </span>
    </div>
  );
}

function WinnerRow({
  winner,
  index,
}: {
  winner: MeridianMapData["pastWinners"][number];
  index: number;
}) {
  return (
    <motion.div
      className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/20 border border-slate-800/40 hover:border-slate-700/60 transition-all cursor-default"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[10px] font-bold text-slate-500 font-mono">
        #{winner.cycle}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{winner.continent.replace("_", " ")}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-sm font-medium text-slate-200 truncate">{winner.poolName}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 border border-slate-700/30">
            {winner.vertical}
          </span>
          <span className="text-[10px] text-slate-600">
            Forged {new Date(winner.forgedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <MapPin className="w-4 h-4 text-slate-600 group-hover:text-cyan-400/60 transition-colors" />
    </motion.div>
  );
}

//
// MAIN COMPONENT
//

export function MeridianMap({ data }: MeridianMapProps) {
  const currentPhase = data.currentCycle?.phase || "hush";
  const phaseConfig = PHASE_CONFIG[currentPhase as keyof typeof PHASE_CONFIG] || PHASE_CONFIG.hush;

  const availableCount = useMemo(
    () => data.rotation.filter((r) => r.status === "available").length,
    [data.rotation]
  );
  const lockedCount = useMemo(
    () => data.rotation.filter((r) => r.status === "locked").length,
    [data.rotation]
  );

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight">The Meridian Map</h2>
              <p className="text-xs text-slate-500">Continent rotation • 6 cycles • Global reach</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {availableCount} Ready • {lockedCount} Locked
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Phase Banner */}
        {data.currentCycle && (
          <div className="mb-6">
            <PhaseBadge
              phase={data.currentCycle.phase}
              timeRemaining={data.currentCycle.timeRemaining}
            />
          </div>
        )}

        {/* The Living Map */}
        <div className="relative h-64 mb-6 rounded-xl bg-slate-950 border border-slate-800/60 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          {/* Subtle meridian lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
            <ellipse cx="50%" cy="50%" rx="45%" ry="35%" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <ellipse cx="50%" cy="50%" rx="30%" ry="25%" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="#94a3b8" strokeWidth="0.5" />
          </svg>

          {/* Continents */}
          <AnimatePresence>
            {CONTINENTS.map((continent) => {
              const status = getContinentStatus(continent.id, data.rotation);
              const rotationItem = data.rotation.find((r) => r.continent === continent.id);
              const isCurrent = status === "current";

              return (
                <ContinentNode
                  key={continent.id}
                  continent={continent}
                  status={status}
                  isCurrent={isCurrent}
                  cycleNumber={rotationItem?.cycleNumber || 0}
                />
              );
            })}
          </AnimatePresence>

          {/* Rotation direction indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] text-slate-700 font-medium">
            <ArrowRight className="w-3 h-3 animate-pulse" />
            <span>Clockwise rotation</span>
          </div>
        </div>

        {/* Live Stats */}
        {data.currentCycle && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <StatPill
              value={data.currentCycle.competingPools}
              label="Competing Pools"
              accent
            />
            <StatPill
              value={data.currentCycle.totalVotes.toLocaleString()}
              label="Total Votes"
            />
            <StatPill
              value={data.currentCycle.continent.replace("_", " ")}
              label="Current Continent"
              accent
            />
            <StatPill
              value={formatTimeRemaining(data.currentCycle.timeRemaining)}
              label="Time Remaining"
            />
          </div>
        )}

        {/* Past Winners Archive */}
        {data.pastWinners.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                The Archive — Past Winners
              </h3>
              <span className="text-[10px] text-slate-600 font-mono">
                {data.pastWinners.length} cycles completed
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {data.pastWinners.map((winner, i) => (
                <WinnerRow key={winner.cycle} winner={winner} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.pastWinners.length === 0 && (
          <div className="py-8 text-center">
            <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No completed cycles yet.</p>
            <p className="text-xs text-slate-600 mt-1">The first Meridian Cycle is about to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}