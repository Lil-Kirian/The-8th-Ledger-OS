"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Zap,
  AlertOctagon,
  Shield,
  Clock,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AhgiSnapshot {
  score: number;
  healthScore: number;
  growthScore: number;
  healthMetrics: string | null;
  growthMetrics: string | null;
  recordedAt: string;
}

interface AHGIData {
  hallId: string;
  hallName: string;
  vertical: string;
  current: AhgiSnapshot;
  history: { month: string; health: number; growth: number; combined: number }[];
  lastInspection: string;
  nextInspection: string;
}

type AHGIStatus = "THRIVING" | "HEALTHY" | "STAGNANT" | "DECLINING" | "CRITICAL";

const STATUS_CONFIG: Record<
  AHGIStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    effect: string;
    action: string;
  }
> = {
  THRIVING: {
    label: "THRIVING",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/50",
    icon: <TrendingUp className="w-5 h-5" />,
    effect: "Hall can propose expansion, new hires, additional inventory",
    action: "Expansion Ready",
  },
  HEALTHY: {
    label: "HEALTHY",
    color: "text-emerald-400",
    bg: "bg-emerald-950/10",
    border: "border-emerald-900/30",
    icon: <CheckCircle2 className="w-5 h-5" />,
    effect: "Standard operation. Maintenance proposals auto-approved.",
    action: "Standard Ops",
  },
  STAGNANT: {
    label: "STAGNANT",
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    icon: <TrendingDown className="w-5 h-5" />,
    effect: "8th Ledger flags for review. Hall must submit improvement plan.",
    action: "Review Required",
  },
  DECLINING: {
    label: "DECLINING",
    color: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    icon: <TrendingDown className="w-5 h-5" />,
    effect: "Dividend smoothing from Sanctuary activated. Immediate attention needed.",
    action: "Intervention",
  },
  CRITICAL: {
    label: "CRITICAL",
    color: "text-red-500",
    bg: "bg-red-950/30",
    border: "border-red-500/50",
    icon: <AlertOctagon className="w-5 h-5" />,
    effect: "8th Ledger can force asset sale, merger, or restructuring without hall vote.",
    action: "Emergency Protocol",
  },
};

function getStatus(score: number): AHGIStatus {
  if (score >= 80) return "THRIVING";
  if (score >= 60) return "HEALTHY";
  if (score >= 40) return "STAGNANT";
  if (score >= 20) return "DECLINING";
  return "CRITICAL";
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-slate-400";
  return "text-red-400";
}

function getScoreBar(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 40) return "bg-slate-500";
  return "bg-red-500";
}

const VERTICAL_LABELS: Record<string, { health: string[]; growth: string[] }> = {
  LedgerProp: {
    health: ["Occupancy %", "Maintenance Backlog", "Tenant Satisfaction"],
    growth: ["Property Value Index", "Rent Growth YoY", "Location Score"],
  },
  LedgerAuto: {
    health: ["Fleet Utilization", "Depreciation Rate", "Accident Rate"],
    growth: ["Lease Rate Growth", "Residual Value Trajectory", "Fleet Expansion"],
  },
  LedgerTech: {
    health: ["Inventory Turnover", "Defect Rate", "Warranty Claims"],
    growth: ["Margin Growth", "Product Lifecycle Stage", "Market Share"],
  },
  LedgerAgri: {
    health: ["Soil Health", "Crop Yield vs Projection", "Weather Risk"],
    growth: ["Yield Growth", "Land Value Index", "Diversification"],
  },
  LedgerEnergy: {
    health: ["Generation Uptime", "Panel Degradation", "Grid Stability"],
    growth: ["kWh Output Growth", "Carbon Credit Accumulation", "Capacity Expansion"],
  },
  LedgerBiz: {
    health: ["Daily Revenue Consistency", "Customer Retention", "Staff Turnover"],
    growth: ["Revenue Growth", "Location Value Index", "Brand Strength"],
  },
  LedgerTravel: {
    health: ["Charter Utilization", "Maintenance Hours", "Safety Incidents"],
    growth: ["Charter Rate Growth", "Asset Appreciation", "Route Expansion"],
  },
  LedgerHealth: {
    health: ["Equipment Uptime", "Patient Throughput", "Compliance Score"],
    growth: ["Service Rate Growth", "Contract Renewal Rate", "Expansion Potential"],
  },
  LedgerEdu: {
    health: ["Enrollment Rate", "Facility Utilization", "License Compliance"],
    growth: ["Tuition Growth", "Certification Value", "Program Expansion"],
  },
  LedgerAccess: {
    health: ["Tower Uptime", "Bandwidth Utilization", "Contract Coverage"],
    growth: ["Lease Rate Growth", "Expansion Potential", "Technology Upgrade"],
  },
};

function parseMetrics(json: string | null): Record<string, number> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Record<string, number>;
  } catch {
    return {};
  }
}

export default function AHGIDashboard({ hallId }: { hallId: string }) {
  const { data, error, isLoading, mutate } = useSWR<AHGIData>(
    `/api/ahgi/hall/${hallId}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/ahgi/hall/${hallId}`, { method: "POST" });
      if (res.ok) await mutate();
    } finally {
      setRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Failed to load AHGI data
      </div>
    );
  }

  const status = STATUS_CONFIG[getStatus(data.current.score)];
  const verticalLabels =
    VERTICAL_LABELS[data.vertical] || {
      health: ["Health Metric 1", "Health Metric 2", "Health Metric 3"],
      growth: ["Growth Metric 1", "Growth Metric 2", "Growth Metric 3"],
    };

  const healthMetrics = parseMetrics(data.current.healthMetrics);
  const growthMetrics = parseMetrics(data.current.growthMetrics);

  const healthKeys = Object.keys(healthMetrics);
  const growthKeys = Object.keys(growthMetrics);

  return (
    <div className="space-y-6">
      {/* Status Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative p-8 rounded-2xl border ${status.border} ${status.bg} overflow-hidden`}
      >
        {getStatus(data.current.score) === "CRITICAL" && (
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/10"
          />
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <span className={status.color}>{status.icon}</span>
              <span
                className={`text-xs font-bold uppercase tracking-[0.2em] ${status.color}`}
              >
                Asset Health Growth Index
              </span>
            </div>
            <h2 className={`text-6xl md:text-7xl font-black ${status.color}`}>
              {data.current.score}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {data.hallName} — Hall #{data.hallId}
            </p>
          </div>

          <div className="text-center md:text-right space-y-2">
            <span
              className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${status.border} ${status.bg} ${status.color}`}
            >
              {status.label}
            </span>
            <p className={`text-sm ${status.color}`}>{status.action}</p>
            <p className="text-xs text-slate-500 max-w-xs">{status.effect}</p>
            <div className="flex items-center justify-center md:justify-end gap-2 text-xs text-slate-600">
              <Calendar className="w-3 h-3" />
              Last updated: {new Date(data.current.recordedAt).toLocaleDateString()}
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 rounded-lg hover:bg-cyan-900/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 ${recalculating ? "animate-spin" : ""}`}
              />
              {recalculating ? "Recalculating..." : "Recalculate"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Score Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-bold text-slate-200">
                Health Score
              </span>
            </div>
            <span
              className={`text-3xl font-black ${getScoreColor(
                data.current.healthScore
              )}`}
            >
              {data.current.healthScore}
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.current.healthScore}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full rounded-full ${getScoreBar(
                data.current.healthScore
              )}`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Weight: 40% of AHGI</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-slate-200">
                Growth Score
              </span>
            </div>
            <span
              className={`text-3xl font-black ${getScoreColor(
                data.current.growthScore
              )}`}
            >
              {data.current.growthScore}
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.current.growthScore}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`h-full rounded-full ${getScoreBar(
                data.current.growthScore
              )}`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Weight: 60% of AHGI</p>
        </motion.div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Health Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Health Metrics — {data.vertical}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {verticalLabels.health.map((label, i) => {
              const key = healthKeys[i] || `health_${i}`;
              const score = healthMetrics[key] ?? 50;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{label}</span>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      className={`h-full rounded-full ${getScoreBar(score)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Growth Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Growth Metrics — {data.vertical}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {verticalLabels.growth.map((label, i) => {
              const key = growthKeys[i] || `growth_${i}`;
              const score = growthMetrics[key] ?? 50;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{label}</span>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                      className={`h-full rounded-full ${getScoreBar(score)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* History Chart */}
      {data.history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden p-5"
        >
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            AHGI Trend
          </h3>

          <div className="flex items-end gap-1 h-48">
            {data.history.map((h, i) => {
              const healthHeight = (h.health / 100) * 100;
              const growthHeight = (h.growth / 100) * 100;
              return (
                <div
                  key={h.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex items-end gap-px h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${healthHeight}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.05 }}
                      className="flex-1 bg-rose-500/40 rounded-t-sm"
                      title={`Health: ${h.health}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${growthHeight}%` }}
                      transition={{ duration: 0.8, delay: 0.7 + i * 0.05 }}
                      className="flex-1 bg-cyan-500/40 rounded-t-sm"
                      title={`Growth: ${h.growth}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600">{h.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500/40 rounded-sm" />
              <span className="text-xs text-slate-500">Health</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-500/40 rounded-sm" />
              <span className="text-xs text-slate-500">Growth</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Inspection Info */}
      <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-600" />
          <span>
            Last inspection: {new Date(data.lastInspection).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <span>
            Next: {new Date(data.nextInspection).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}