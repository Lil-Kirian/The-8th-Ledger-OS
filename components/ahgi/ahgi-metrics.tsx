"use client";

import { motion } from "framer-motion";
import {

  Zap,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Home,
  Car,
  Cpu,
  Wheat,
  Battery,
  Store,
  Plane,
  Stethoscope,
  GraduationCap,
  Wifi,
} from "lucide-react";

interface AHGIMetricCardProps {
  label: string;
  value: number;
  unit?: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  icon: React.ReactNode;
  category: "health" | "growth";
  benchmark?: number;
}

const CATEGORY_CONFIG = {
  health: {
    label: "Health",
    color: "text-rose-400",
    bg: "bg-rose-950/20",
    border: "border-rose-900/50",
    bar: "bg-rose-500",
  },
  growth: {
    label: "Growth",
    color: "text-cyan-400",
    bg: "bg-cyan-950/20",
    border: "border-cyan-900/50",
    bar: "bg-cyan-500",
  },
};

export function AHGIMetricCard({
  label,
  value,
  unit = "",
  trend,
  trendValue,
  icon,
  category,
  benchmark,
}: AHGIMetricCardProps) {
  const config = CATEGORY_CONFIG[category];

  const trendConfig = {
    up: { icon: <ArrowUpRight className="w-3.5 h-3.5" />, color: "text-emerald-400" },
    down: { icon: <ArrowDownRight className="w-3.5 h-3.5" />, color: "text-red-400" },
    stable: { icon: <Minus className="w-3.5 h-3.5" />, color: "text-amber-400" },
  };

  const t = trendConfig[trend];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={`bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${t.color}`}>
          {t.icon}
          {trendValue > 0 ? "+" : ""}
          {trendValue}
          {unit}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-100">{value}</span>
          {unit && <span className="text-sm text-slate-500">{unit}</span>}
        </div>
      </div>

      {benchmark !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">vs benchmark</span>
            <span className={value >= benchmark ? "text-emerald-400" : "text-amber-400"}>
              {value >= benchmark ? "Above" : "Below"} ({benchmark})
            </span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${config.bar}`}
              style={{ width: `${Math.min(100, (value / (benchmark * 1.5)) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function AHGIStatusBanner({ status, score }: { status: string; score: number }) {
  const configs: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; message: string }> = {
    THRIVING: {
      color: "text-emerald-400",
      bg: "bg-emerald-950/20",
      border: "border-emerald-900/50",
      icon: <CheckCircle2 className="w-5 h-5" />,
      message: "Asset is performing above expectations. Expansion opportunities available.",
    },
    HEALTHY: {
      color: "text-emerald-400",
      bg: "bg-emerald-950/10",
      border: "border-emerald-900/30",
      icon: <CheckCircle2 className="w-5 h-5" />,
      message: "Asset is operating within normal parameters.",
    },
    STAGNANT: {
      color: "text-amber-400",
      bg: "bg-amber-950/20",
      border: "border-amber-900/50",
      icon: <AlertTriangle className="w-5 h-5" />,
      message: "Growth has plateaued. Hall should submit improvement plan.",
    },
    DECLINING: {
      color: "text-red-400",
      bg: "bg-red-950/20",
      border: "border-red-900/50",
      icon: <TrendingDown className="w-5 h-5" />,
      message: "Performance declining. 8th Ledger has activated monitoring protocols.",
    },
    CRITICAL: {
      color: "text-red-500",
      bg: "bg-red-950/30",
      border: "border-red-500/50",
      icon: <AlertTriangle className="w-5 h-5" />,
      message: "Asset at risk. Closure protocol may be initiated without hall vote.",
    },
  };

  const config = configs[status] || configs.HEALTHY;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${config.border} ${config.bg} flex items-start gap-3`}
    >
      <div className={config.color}>{config.icon}</div>
      <div>
        <div className={`text-sm font-bold ${config.color}`}>
          {status} — AHGI {score}
        </div>
        <p className="text-xs text-slate-400 mt-1">{config.message}</p>
      </div>
    </motion.div>
  );
}

export function getVerticalIcon(vertical: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    LedgerProp: <Home className="w-5 h-5" />,
    LedgerAuto: <Car className="w-5 h-5" />,
    LedgerTech: <Cpu className="w-5 h-5" />,
    LedgerAgri: <Wheat className="w-5 h-5" />,
    LedgerEnergy: <Battery className="w-5 h-5" />,
    LedgerBiz: <Store className="w-5 h-5" />,
    LedgerTravel: <Plane className="w-5 h-5" />,
    LedgerHealth: <Stethoscope className="w-5 h-5" />,
    LedgerEdu: <GraduationCap className="w-5 h-5" />,
    LedgerAccess: <Wifi className="w-5 h-5" />,
  };
  return icons[vertical] || <Zap className="w-5 h-5" />;
}