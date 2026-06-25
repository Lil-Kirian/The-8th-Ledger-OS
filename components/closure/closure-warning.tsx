"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  TrendingDown,
  DollarSign,
  Users,
  Gavel,
  FileText,
  ArrowRight,
  Shield,
  X,
  ChevronRight,
  Activity,
  Heart,
  Vote,
} from "lucide-react";

interface ClosureWarningProps {
  hallId: string;
  hallName: string;
  ahgi: number;
  revenue: number;
  payroll: number;
  tithe: number;
  net: number;
  month: number; // 1, 2, or 3
  daysRemaining: number;
  onVoteSell: () => void;
  onViewPlan: () => void;
  onViewTerms: () => void;
}

const PHASE_CONFIG = {
  1: {
    title: "⚠️ CRITICAL WARNING",
    subtitle: "1st Month of Critical AHGI",
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    icon: <AlertTriangle className="w-6 h-6" />,
    message: "This hall is operating at a loss. The 8th Ledger has activated the Closure Protocol. You have 60 days to improve or the hall will be liquidated.",
    actions: ["VIEW_IMPROVEMENT_PLAN", "VOTE_ON_SALE"] as const,
  },
  2: {
    title: "⚠️ FINAL WARNING",
    subtitle: "2nd Month of Critical AHGI",
    color: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    icon: <AlertOctagon className="w-6 h-6" />,
    message: "This hall has operated at a loss for 2 consecutive months. The 8th Ledger will liquidate the asset and distribute proceeds to all owners in 30 days.",
    actions: ["VIEW_LIQUIDATION_TERMS"] as const,
  },
  3: {
    title: "🔒 LIQUIDATION COMPLETE",
    subtitle: "Closure Executed",
    color: "text-slate-400",
    bg: "bg-slate-900/50",
    border: "border-slate-800",
    icon: <Shield className="w-6 h-6" />,
    message: "This hall has been dissolved. All proceeds have been distributed. Thank you for being a sovereign.",
    actions: [] as const,
  },
};

export default function ClosureWarning({
  hallId,
  hallName,
  ahgi,
  revenue,
  payroll,
  tithe,
  net,
  month,
  daysRemaining,
  onVoteSell,
  onViewPlan,
  onViewTerms,
}: ClosureWarningProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "actions">("overview");
  const config = PHASE_CONFIG[month as keyof typeof PHASE_CONFIG] || PHASE_CONFIG[1];

  const isNegative = net < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-950 border ${config.border} rounded-2xl overflow-hidden shadow-2xl shadow-black/50`}
    >
      {/* Header */}
      <div className={`p-6 ${config.bg} border-b ${config.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={month < 3 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={config.color}
            >
              {config.icon}
            </motion.div>
            <div>
              <h2 className={`text-xl font-bold ${config.color}`}>{config.title}</h2>
              <p className="text-xs text-slate-500">{config.subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Hall #{hallId}</div>
            <div className="text-sm text-slate-400">{hallName}</div>
          </div>
        </div>

        <p className={`text-sm leading-relaxed ${month === 3 ? "text-slate-500" : config.color}`}>
          {config.message}
        </p>

        {month < 3 && (
          <div className="mt-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${(daysRemaining / (month === 1 ? 60 : 30)) * 100}%` }}
                transition={{ duration: 1 }}
                className={`h-full rounded-full ${
                  month === 1 ? "bg-amber-500" : "bg-red-500"
                }`}
              />
            </div>
            <span className="text-xs text-slate-500 w-16 text-right">
              {daysRemaining}d left
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      {month < 3 && (
        <div className="flex border-b border-slate-800">
          {(["overview", "financials", "actions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "text-slate-200 border-b-2 border-cyan-400 bg-slate-900/50"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && month < 3 && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                  icon={<Activity className="w-4 h-4" />}
                  label="AHGI"
                  value={ahgi.toString()}
                  color={ahgi >= 20 ? "amber" : "red"}
                />
                <MetricCard
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Revenue"
                  value={`$${revenue.toLocaleString()}`}
                  color="slate"
                />
                <MetricCard
                  icon={<Users className="w-4 h-4" />}
                  label="Payroll"
                  value={`$${payroll.toLocaleString()}`}
                  color="red"
                />
                <MetricCard
                  icon={<TrendingDown className="w-4 h-4" />}
                  label="Net"
                  value={`$${net.toLocaleString()}`}
                  color={isNegative ? "red" : "emerald"}
                />
              </div>

              <div className={`p-4 rounded-xl border ${isNegative ? "bg-red-950/20 border-red-900/50" : "bg-emerald-950/20 border-emerald-900/50"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Monthly Net Position</span>
                  <span className={`text-lg font-bold ${isNegative ? "text-red-400" : "text-emerald-400"}`}>
                    {isNegative ? "-" : "+"}
                    ${Math.abs(net).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isNegative ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, Math.abs(net) / (payroll * 1.5) * 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "financials" && month < 3 && (
            <motion.div
              key="financials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <FinancialRow label="Gross Revenue" value={revenue} color="text-slate-200" />
              <FinancialRow label="8th Ledger Tithe (20%)" value={-tithe} color="text-slate-400" indent />
              <FinancialRow label="Payroll (Forge)" value={-payroll} color="text-slate-400" indent />
              <div className="h-px bg-slate-800 my-2" />
              <FinancialRow label="Net Hall Revenue" value={net} color={isNegative ? "text-red-400" : "text-emerald-400"} bold />
              <div className="h-px bg-slate-800 my-2" />
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-500 mb-2">Revenue vs Payroll</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500/60"
                      style={{ width: `${Math.min(100, (revenue / (revenue + payroll)) * 100)}%` }}
                    />
                    <div
                      className="h-full bg-red-500/60"
                      style={{ width: `${Math.min(100, (payroll / (revenue + payroll)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-600">
                  <span>Revenue</span>
                  <span>Payroll</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "actions" && month < 3 && (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {month === 1 && (
                <>
                  <ActionButton
                    icon={<FileText className="w-4 h-4" />}
                    label="View Improvement Plan"
                    desc="8th Ledger recommendations for cost cuts and revenue recovery"
                    color="cyan"
                    onClick={onViewPlan}
                  />
                  <ActionButton
                    icon={<Gavel className="w-4 h-4" />}
                    label="Vote on Voluntary Sale"
                    desc="Requires 66% hall approval to sell asset immediately"
                    color="amber"
                    onClick={onVoteSell}
                  />
                </>
              )}
              {month === 2 && (
                <ActionButton
                  icon={<FileText className="w-4 h-4" />}
                  label="View Liquidation Terms"
                  desc="Estimated payout per ownership % after fees and debt"
                  color="red"
                  onClick={onViewTerms}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {month < 3 && (
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Shield className="w-3.5 h-3.5" />
            <span>
              Closure Protocol {month === 1 ? "Phase 1" : "Phase 2"} — 8th Ledger Holdings Ltd.
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "amber" | "red" | "emerald" | "slate";
}) {
  const colors = {
    amber: "bg-amber-950/30 border-amber-900/50 text-amber-400",
    red: "bg-red-950/30 border-red-900/50 text-red-400",
    emerald: "bg-emerald-950/30 border-emerald-900/50 text-emerald-400",
    slate: "bg-slate-900/50 border-slate-800 text-slate-400",
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1 opacity-80">{icon}</div>
      <div className="text-lg font-bold text-slate-100">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider opacity-90">{label}</div>
    </div>
  );
}

function FinancialRow({
  label,
  value,
  color,
  indent = false,
  bold = false,
}: {
  label: string;
  value: number;
  color: string;
  indent?: boolean;
  bold?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm ${bold ? "font-bold text-slate-200" : "text-slate-400"}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? "font-bold" : ""} ${color}`}>
        {value >= 0 ? "" : "-"}
        ${Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  desc,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  color: "cyan" | "amber" | "red";
  onClick: () => void;
}) {
  const colors = {
    cyan: "hover:border-cyan-900/50 hover:bg-cyan-950/10",
    amber: "hover:border-amber-900/50 hover:bg-amber-950/10",
    red: "hover:border-red-900/50 hover:bg-red-950/10",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-left transition-all ${colors[color]} group`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-slate-400 group-hover:text-slate-200 transition-colors">{icon}</div>
          <div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
              {label}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
      </div>
    </button>
  );
}