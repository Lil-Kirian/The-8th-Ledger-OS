// components/agora/pulse-dashboard.tsx
// 8th Ledger — The Pulse: System Vital Signs
// "The empire has a heartbeat. You are watching it."

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Zap,
  Minus,
  Activity,
  Users,
  Building2,
  Landmark,
  Vote,
  Globe,
  Eye,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Crown,
  Gem,
  BarChart3,
  Radio,
} from "lucide-react";

//
// TYPES — Schema-Aligned
//

export interface PulseData {
  pools: {
    active: number;
    filling: number;
    forged: number;
    totalCommitted: number;
    totalParticipants: number;
    targetProgress: number;
  };
  halls: {
    live: number;
    mature: number;
    total: number;
    avgSri: number;
    platinum: number;
    gold: number;
    warning: number;
    liquidation: number;
  };
  capital: {
    dividendsThisMonth: number;
    dividendsLastMonth: number;
    changePercent: number;
    totalDistributedAllTime: number;
  };
  governance: {
    proposals24h: number;
    votes24h: number;
    newOwners24h: number;
    activeProposals: number;
  };
  meridian: {
    phase: string | null;
    continent: string | null;
    timeRemaining: number | null;
    competingPools: number | null;
    totalVotes: number | null;
  };
  oracle: {
    activeForecasts: number;
    totalPredictions: number;
    totalStandingPoints: number;
    topTier: string | null;
  };
  agora: {
    pendingSuggestions: number;
    answeredQuestions: number;
    totalSuggestions: number;
  };
  system: {
    status: "BEATING" | "RACING" | "FLAT";
    score: number;
    lastUpdated: string;
  };
}

interface PulseDashboardProps {
  data: PulseData;
}

//
// DESIGN SYSTEM — The Vital Palette
//

const STATUS_CONFIG = {
  BEATING: {
    label: "BEATING",
    icon: Heart,
    color: "text-emerald-400",
    bg: "from-emerald-950/40 to-emerald-900/20",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    accent: "bg-emerald-500",
    desc: "The empire thrives. Capital flows like blood. Governance is alive.",
    rhythm: "animate-pulse",
  },
  RACING: {
    label: "RACING",
    icon: Zap,
    color: "text-amber-400",
    bg: "from-amber-950/40 to-amber-900/20",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
    accent: "bg-amber-500",
    desc: "Momentum building. Pools filling. The Oracle watches.",
    rhythm: "animate-pulse",
  },
  FLAT: {
    label: "FLAT",
    icon: Activity,
    color: "text-red-400",
    bg: "from-red-950/40 to-red-900/20",
    border: "border-red-500/20",
    glow: "shadow-red-500/10",
    accent: "bg-red-500",
    desc: "System at rest. Awaiting the next Meridian cycle.",
    rhythm: "",
  },
} as const;

const SRI_TIERS = [
  { key: "platinum", label: "Platinum", color: "bg-purple-400", width: "w-2" },
  { key: "gold", label: "Gold", color: "bg-yellow-400", width: "w-2" },
  { key: "silver", label: "Silver", color: "bg-slate-300", width: "w-2" },
  { key: "bronze", label: "Bronze", color: "bg-amber-600", width: "w-2" },
  { key: "warning", label: "Warning", color: "bg-orange-500", width: "w-2" },
  { key: "liquidation", label: "Liquidation", color: "bg-red-400", width: "w-2" },
] as const;

//
// HELPERS
//

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

//
// SUB-COMPONENTS
//

function VitalCard({
  icon: Icon,
  label,
  value,
  subValue,
  subIcon: SubIcon,
  subColor,
  accent = false,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue: string;
  subIcon?: React.ElementType;
  subColor?: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`
        group relative overflow-hidden rounded-xl border backdrop-blur-md
        transition-all duration-300 hover:scale-[1.02]
        ${accent
          ? "bg-cyan-950/20 border-cyan-500/15 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
          : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700/60 hover:shadow-lg hover:shadow-black/20"
        }
      `}
    >
      <div className="p-4 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${accent ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-slate-800/50 border border-slate-700/40"}
          `}>
            <Icon className={`w-4 h-4 ${accent ? "text-cyan-400" : "text-slate-400"}`} />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            {label}
          </span>
        </div>
        <div className={`text-2xl font-bold tracking-tight ${accent ? "text-cyan-100" : "text-slate-100"}`}>
          {value}
        </div>
        <div className={`flex items-center gap-1.5 mt-2 text-[11px] ${subColor || "text-slate-500"}`}>
          {SubIcon && <SubIcon className="w-3 h-3" />}
          <span>{subValue}</span>
        </div>
      </div>
      {/* Subtle gradient overlay */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        ${accent ? "bg-gradient-to-br from-cyan-500/5 to-transparent" : "bg-gradient-to-br from-slate-500/5 to-transparent"}
      `} />
    </motion.div>
  );
}

function SectorPanel({
  icon: Icon,
  iconColor,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-800/40 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

function HealthBar({ data }: { data: PulseData["halls"] }) {
  const total = Math.max(data.total, 1);
  const segments = [
    { key: "platinum", value: data.platinum, color: "bg-purple-400", label: "Platinum" },
    { key: "gold", value: data.gold, color: "bg-yellow-400", label: "Gold" },
    { key: "silver", value: Math.max(0, data.live - data.platinum - data.gold), color: "bg-slate-400", label: "Silver/Bronze" },
    { key: "warning", value: data.warning, color: "bg-orange-500", label: "Warning" },
    { key: "liquidation", value: data.liquidation, color: "bg-red-400", label: "Liquidation" },
  ] as const;

  return (
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Hall Health Distribution
          </span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">{data.total} halls total</span>
      </div>

      {/* Segmented bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800/80 ring-1 ring-slate-700/50">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct < 0.5) return null;
          return (
            <motion.div
              key={seg.key}
              className={`${seg.color} relative`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-white/10" />
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${seg.color} ring-1 ring-white/10`} />
            <span className="text-[10px] text-slate-500">
              {seg.label}: <span className="text-slate-300 font-mono">{seg.value}</span>
            </span>
          </div>
        ))}
      </div>

      {/* SRI Average */}
      <div className="mt-4 pt-4 border-t border-slate-800/40 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Average SRI Score</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${data.avgSri}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <span className="text-sm font-bold text-slate-200 font-mono">{data.avgSri}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score, status }: { score: number; status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#0f172a" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={config.color}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${config.color}`}>{score}</span>
        <span className="text-[9px] text-slate-600 uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

//
// MAIN COMPONENT
//

export function PulseDashboard({ data }: PulseDashboardProps) {
  const status = STATUS_CONFIG[data.system.status];
  const StatusIcon = status.icon;
  const isPositiveChange = data.capital.changePercent > 0;

  const capitalChangeColor = isPositiveChange ? "text-emerald-400" : data.capital.changePercent < 0 ? "text-red-400" : "text-slate-500";
  const capitalChangeIcon = isPositiveChange ? ArrowUpRight : data.capital.changePercent < 0 ? ArrowDownRight : Minus;

  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════════════════
          STATUS CARD — The Heartbeat
          ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={`
          relative overflow-hidden rounded-2xl border backdrop-blur-xl
          bg-gradient-to-br ${status.bg}
          ${status.border} ${status.glow} shadow-2xl
        `}
      >
        {/* Animated background pulse */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className={`absolute -top-20 -right-20 w-64 h-64 rounded-full ${status.accent} opacity-[0.07] blur-3xl`}
            animate={data.system.status !== "FLAT" ? { scale: [1, 1.3, 1], opacity: [0.07, 0.12, 0.07] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative p-6 flex items-center gap-6">
          {/* Status Icon */}
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center shrink-0
            border-2 ${status.border} ${status.rhythm}
            ${data.system.status === "BEATING" ? "bg-emerald-500/10" : data.system.status === "RACING" ? "bg-amber-500/10" : "bg-red-500/10"}
          `}>
            <StatusIcon className={`w-8 h-8 ${status.color}`} />
          </div>

          {/* Status Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className={`text-3xl font-black tracking-tighter ${status.color}`}>
                {status.label}
              </h2>
              <div className={`
                px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                ${status.color} bg-black/20 border border-white/10
              `}>
                {data.system.score}/100
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">{status.desc}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Updated {new Date(data.system.lastUpdated).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Radio className="w-3 h-3" />
                <span>Live telemetry</span>
              </div>
            </div>
          </div>

          {/* Score Ring */}
          <ScoreRing score={data.system.score} status={data.system.status} />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          VITAL METRICS — The Four Chambers
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <VitalCard
          icon={Landmark}
          label="Capital Flow"
          value={formatCurrency(data.capital.dividendsThisMonth)}
          subValue={`${isPositiveChange ? "+" : ""}${data.capital.changePercent}% vs last month`}
          subIcon={capitalChangeIcon}
          subColor={capitalChangeColor}
          accent
          delay={0.1}
        />
        <VitalCard
          icon={Building2}
          label="Pool Ecosystem"
          value={String(data.pools.active)}
          subValue={`${data.pools.filling} filling • ${data.pools.forged} forged • ${formatCompact(data.pools.totalParticipants)} participants`}
          delay={0.15}
        />
        <VitalCard
          icon={Users}
          label="Sovereign Halls"
          value={String(data.halls.live)}
          subValue={`SRI avg ${data.halls.avgSri} • ${data.halls.platinum} platinum • ${data.halls.gold} gold`}
          delay={0.2}
        />
        <VitalCard
          icon={Vote}
          label="24h Governance"
          value={String(data.governance.proposals24h + data.governance.votes24h)}
          subValue={`${data.governance.proposals24h} proposals • ${data.governance.votes24h} votes • ${data.governance.newOwners24h} new owners`}
          delay={0.25}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTOR PANELS — The Three Pillars
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Meridian */}
        <SectorPanel icon={Globe} iconColor="text-cyan-400" title="Meridian Cycle" delay={0.3}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Phase</span>
              <span className="text-sm font-semibold text-slate-200 capitalize">
                {data.meridian.phase || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Continent</span>
              <span className="text-sm font-semibold text-cyan-400 capitalize">
                {data.meridian.continent?.replace("_", " ") || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Competing</span>
              <span className="text-sm font-semibold text-slate-200">
                {data.meridian.competingPools ?? "—"} <span className="text-xs text-slate-500">pools</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Votes Cast</span>
              <span className="text-sm font-semibold text-slate-200">
                {data.meridian.totalVotes?.toLocaleString() ?? "—"}
              </span>
            </div>
            {data.meridian.timeRemaining !== null && (
              <div className="mt-2 pt-3 border-t border-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Time Remaining</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    {(() => {
                      const s = data.meridian.timeRemaining!;
                      const h = Math.floor(s / 3600);
                      const m = Math.floor((s % 3600) / 60);
                      const sec = s % 60;
                      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </SectorPanel>

        {/* Oracle */}
        <SectorPanel icon={Eye} iconColor="text-purple-400" title="The Oracle" delay={0.35}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Active Forecasts</span>
              <span className="text-sm font-semibold text-slate-200">{data.oracle.activeForecasts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Predictions</span>
              <span className="text-sm font-semibold text-slate-200">
                {data.oracle.totalPredictions.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Standing Points</span>
              <span className="text-sm font-semibold text-purple-400">
                {data.oracle.totalStandingPoints.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Highest Tier</span>
              <div className="flex items-center gap-1.5">
                {data.oracle.topTier === "prophet" && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                {data.oracle.topTier === "oracle" && <Gem className="w-3.5 h-3.5 text-slate-300" />}
                <span className="text-sm font-semibold text-slate-200 capitalize">
                  {data.oracle.topTier || "—"}
                </span>
              </div>
            </div>
          </div>
        </SectorPanel>

        {/* Agora */}
        <SectorPanel icon={MessageSquare} iconColor="text-emerald-400" title="The Agora" delay={0.4}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Pending Suggestions</span>
              <span className="text-sm font-semibold text-amber-400">{data.agora.pendingSuggestions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Answered Questions</span>
              <span className="text-sm font-semibold text-emerald-400">{data.agora.answeredQuestions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Suggestions</span>
              <span className="text-sm font-semibold text-slate-200">{data.agora.totalSuggestions}</span>
            </div>
            <div className="mt-2 pt-3 border-t border-slate-800/40">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Community Pulse</span>
                <span className="text-xs text-emerald-400 font-medium">
                  {data.agora.totalSuggestions > 0
                    ? `${Math.round((data.agora.answeredQuestions / data.agora.totalSuggestions) * 100)}% engagement`
                    : "Awaiting first suggestion"}
                </span>
              </div>
            </div>
          </div>
        </SectorPanel>
      </div>

      {/* ═══════════════════════════════════════════════════════
          HALL HEALTH — The Body Scan
          ═══════════════════════════════════════════════════════ */}
      <HealthBar data={data.halls} />

      {/* ═══════════════════════════════════════════════════════
          CAPITAL HISTORY — The Treasury Line
          ═══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Capital Distribution
            </span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">
            All-time: {formatCurrency(data.capital.totalDistributedAllTime)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-800/40">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">This Month</div>
            <div className="text-xl font-bold text-slate-100">{formatCurrency(data.capital.dividendsThisMonth)}</div>
            <div className={`flex items-center gap-1 mt-1 text-xs ${capitalChangeColor}`}>
              {React.createElement(capitalChangeIcon, { className: "w-3 h-3" })}
              <span>{isPositiveChange ? "+" : ""}{data.capital.changePercent}%</span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-800/40">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Month</div>
            <div className="text-xl font-bold text-slate-300">{formatCurrency(data.capital.dividendsLastMonth)}</div>
            <div className="text-xs text-slate-600 mt-1">Baseline comparison</div>
          </div>
        </div>
      </div>
    </div>
  );
}