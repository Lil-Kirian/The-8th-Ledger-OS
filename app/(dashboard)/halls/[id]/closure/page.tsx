"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertOctagon,
  Lock,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  Shield,
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  Building2,
  Receipt,
  Wallet,
  Hammer,
  Scale,
  ArrowRight,
  Ban,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ClosureData = {
  hallId: string;
  hallName: string;
  hallClass?: string;
  closureStatus: string;
  closure: {
    id: string;
    phase: "warning" | "decision" | "liquidation";
    triggerMonth: string;
    ahgiAtTrigger: number;
    revenueAtTrigger: number;
    payrollAtTrigger: number;
    liquidationValue?: number;
    assetSalePrice?: number;
    pirDebtPaid: number;
    taxPaid: number;
    severancePaid: number;
    ledgerFeePaid: number;
    netProceeds?: number;
    status: string;
    closedAt?: string;
    createdAt: string;
  } | null;
  sriScore: number;
  ahgiScore: number;
  currentRevenue: number;
  currentPayroll: number;
  totalOwners: number;
  userOwnershipPercent?: number;
  estimatedPayout?: number;
  isOwner: boolean;
  isAdmin: boolean;
};

const phaseConfig = {
  warning: {
    icon: AlertTriangle,
    title: "Critical Warning",
    subtitle: "Month 1 of Critical Status",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    barColor: "bg-amber-400",
    step: 1,
    description:
      "This hall has operated at a loss for 1 month. AHGI is in Critical range (0-19). You have 60 days to improve or the hall will enter liquidation.",
    actions: ["Vote on emergency cost cuts", "Vote to sell asset voluntarily (66% required)", "Submit improvement plan"],
  },
  decision: {
    icon: AlertOctagon,
    title: "Final Warning",
    subtitle: "Month 2 of Critical Status",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    barColor: "bg-rose-400",
    step: 2,
    description:
      "This hall has operated at a loss for 2 consecutive months. The 8th Ledger has commissioned an independent appraisal. Liquidation is scheduled in 30 days.",
    actions: ["View liquidation terms", "View estimated payout per %", "No votes required — 8th Ledger executes"],
  },
  liquidation: {
    icon: Lock,
    title: "Liquidation Complete",
    subtitle: "Asset Sold — Hall Dissolved",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    barColor: "bg-slate-400",
    step: 3,
    description:
      "The asset has been sold and proceeds distributed. This hall is now dissolved. You no longer own this asset.",
    actions: ["View full audit", "Download payout statement", "Commit to new pools"],
  },
};

export default function ClosurePage() {
  const params = useParams();
  const hallId = params.id as string;
  const { user } = useAuth();
  const [showPayoutDetails, setShowPayoutDetails] = useState(false);

  const { data, error, isLoading } = useSWR<ClosureData>(
    hallId ? `/api/halls/${hallId}/closure` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          <p className="text-sm text-slate-400">Checking closure protocol...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertOctagon className="h-10 w-10 text-rose-400" />
          <h3 className="text-lg font-semibold text-slate-200">Closure data unavailable</h3>
          <p className="max-w-sm text-sm text-slate-400">
            The 8th Ledger could not retrieve closure status for this hall.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    hallName,
    hallClass,
    closureStatus,
    closure,
    sriScore,
    ahgiScore,
    currentRevenue,
    currentPayroll,
    totalOwners,
    userOwnershipPercent,
    estimatedPayout,
    isOwner,
    isAdmin,
  } = data;

  // If hall is active with no closure triggered
  if (closureStatus === "active" && !closure) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            <Shield className="h-4 w-4" />
            <span>Closure Protocol</span>
            {hallClass && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
                Class {hallClass}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">{hallName}</h1>
          <p className="text-sm text-slate-400">
            Hall is operating normally. No closure triggers active.
            {isOwner && userOwnershipPercent !== undefined && (
              <span className="ml-1 text-cyan-400">Your stake: {userOwnershipPercent}%</span>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <h3 className="mt-4 text-lg font-semibold text-emerald-400">Hall is Healthy</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            This hall is not in closure protocol. AHGI and revenue are within acceptable ranges.
            The 8th Ledger monitors all assets continuously.
          </p>

          <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-4">
            <HealthMiniCard label="SRI" value={sriScore} color="cyan" />
            <HealthMiniCard label="AHGI" value={ahgiScore} color="emerald" />
            <HealthMiniCard label="Revenue" value={`$${currentRevenue.toLocaleString()}`} color="amber" text />
          </div>
        </div>
      </div>
    );
  }

  const phase = closure ? phaseConfig[closure.phase] : null;
  if (!phase) return null;

  const PhaseIcon = phase.icon;
  const isLiquidated = closure?.phase === "liquidation";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          <AlertTriangle className="h-4 w-4" />
          <span>Closure Protocol</span>
          {hallClass && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
              Class {hallClass}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">{hallName}</h1>
        <p className="text-sm text-slate-400">
          {isLiquidated
            ? "This hall has been dissolved. Asset sold, proceeds distributed."
            : "The 8th Ledger Closure Protocol has been activated for this hall."}
          {isOwner && userOwnershipPercent !== undefined && (
            <span className="ml-1 text-cyan-400">Your stake: {userOwnershipPercent}%</span>
          )}
        </p>
      </div>

      {/* Phase Progress */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between">
          {(["warning", "decision", "liquidation"] as const).map((p, i) => {
            const cfg = phaseConfig[p];
            const isActive = closure?.phase === p;
            const isPast = phase && phase.step > cfg.step;
            const Icon = cfg.icon;

            return (
              <div key={p} className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                    isActive
                      ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                      : isPast
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-800 bg-slate-900 text-slate-600"
                  }`}
                >
                  {isPast ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="hidden md:block">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isActive ? cfg.color : isPast ? "text-emerald-400" : "text-slate-600"
                    }`}
                  >
                    {cfg.title}
                  </p>
                  <p className="text-[10px] text-slate-600">{cfg.subtitle}</p>
                </div>
                {i < 2 && (
                  <ArrowRight
                    className={`mx-2 h-4 w-4 ${
                      isPast ? "text-emerald-400" : "text-slate-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Phase Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border ${phase.border} ${phase.bg} p-6 backdrop-blur-sm`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${phase.border} ${phase.bg}`}
          >
            <PhaseIcon className={`h-7 w-7 ${phase.color}`} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className={`text-xl font-bold ${phase.color}`}>{phase.title}</h2>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${phase.bg} ${phase.border} ${phase.color}`}
              >
                Phase {phase.step} of 3
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{phase.description}</p>

            {closure && (
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Triggered: {new Date(closure.triggerMonth).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5" />
                  AHGI at trigger: {closure.ahgiAtTrigger}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Revenue: ${closure.revenueAtTrigger.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Owners: {totalOwners}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isLiquidated && (
          <div className="mt-5 flex flex-wrap gap-2">
            {phase.actions.map((action) => (
              <span
                key={action}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300"
              >
                <ChevronRight className="h-3 w-3 text-slate-500" />
                {action}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Financials Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          label="Current Revenue"
          value={`$${currentRevenue.toLocaleString()}`}
          trend={currentRevenue < currentPayroll ? "down" : "up"}
          icon={Receipt}
          color={currentRevenue < currentPayroll ? "rose" : "emerald"}
        />
        <FinancialCard
          label="Current Payroll"
          value={`$${currentPayroll.toLocaleString()}`}
          icon={Hammer}
          color="cyan"
        />
        <FinancialCard
          label="Net Position"
          value={`$${(currentRevenue - currentPayroll).toLocaleString()}`}
          trend={currentRevenue - currentPayroll < 0 ? "down" : "up"}
          icon={Scale}
          color={currentRevenue - currentPayroll < 0 ? "rose" : "emerald"}
        />
        <FinancialCard
          label="8th Ledger Tithe"
          value={`$${Math.round(currentRevenue * 0.2).toLocaleString()}`}
          icon={Building2}
          color="amber"
        />
      </div>

      {/* Liquidation Payout (if applicable) */}
      {closure && (closure.phase === "decision" || closure.phase === "liquidation") && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <button
            onClick={() => setShowPayoutDetails(!showPayoutDetails)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {isLiquidated ? "Liquidation Payout" : "Estimated Payout"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isLiquidated
                    ? "Final distribution after all deductions"
                    : "Projected distribution if asset sells at appraisal value"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-slate-100">
                {isOwner && estimatedPayout !== undefined
                  ? `$${estimatedPayout.toLocaleString()}`
                  : "—"}
              </p>
              {showPayoutDetails ? (
                <ChevronRight className="h-4 w-4 rotate-90 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showPayoutDetails && closure && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                  {/* Payout Order */}
                  <PayoutRow
                    label="Asset Sale Price"
                    value={closure.assetSalePrice ?? closure.liquidationValue ?? 0}
                    positive
                    bold
                  />
                  <PayoutRow
                    label="8th Ledger Liquidation Fee (2.5%)"
                    value={closure.ledgerFeePaid}
                    negative
                    note="Protocol fee for executing closure"
                  />
                  <PayoutRow
                    label="Outstanding PIR Debt Repayment"
                    value={closure.pirDebtPaid}
                    negative
                    note="Repayment of any PIR advances"
                  />
                  <PayoutRow
                    label="Tax Obligations"
                    value={closure.taxPaid}
                    negative
                    note="Property and capital gains tax"
                  />
                  <PayoutRow
                    label="Worker Severance"
                    value={closure.severancePaid}
                    negative
                    note="1 month per year of service"
                  />
                  <div className="my-2 border-t border-dashed border-slate-800" />
                  <PayoutRow
                    label="Net Proceeds"
                    value={closure.netProceeds ?? 0}
                    positive
                    bold
                    highlight
                  />
                  {isOwner && userOwnershipPercent !== undefined && estimatedPayout !== undefined && (
                    <>
                      <div className="my-2 border-t border-dashed border-slate-800" />
                      <div className="flex items-center justify-between rounded-lg bg-cyan-500/5 p-3">
                        <span className="text-sm font-medium text-cyan-400">
                          Your Payout ({userOwnershipPercent}% ownership)
                        </span>
                        <span className="text-lg font-bold text-cyan-400">
                          ${estimatedPayout.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {isLiquidated && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800">
                      <FileText className="h-3.5 w-3.5" />
                      View Full Audit
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800">
                      <Download className="h-3.5 w-3.5" />
                      Download Statement
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Hall Closed Banner */}
      {isLiquidated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-slate-700 bg-slate-900/80 p-8 text-center"
        >
          <Ban className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-slate-300">Hall Dissolved</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            This hall is no longer active. The asset has been sold, all proceeds distributed,
            and PACs redeemed. Thank you for being a sovereign.
          </p>
          <p className="mt-4 text-xs text-slate-600">
            Closed on {closure?.closedAt ? new Date(closure.closedAt).toLocaleDateString() : "—"}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function HealthMiniCard({
  label,
  value,
  color,
  text,
}: {
  label: string;
  value: string | number;
  color: "cyan" | "emerald" | "amber" | "rose";
  text?: boolean;
}) {
  const map = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className={`mt-1 text-lg font-bold ${map[color]}`}>{value}</p>
    </div>
  );
}

function FinancialCard({
  label,
  value,
  trend,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  trend?: "up" | "down";
  icon: React.ElementType;
  color: "emerald" | "rose" | "cyan" | "amber" | "violet";
}) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <span className={trend === "up" ? "text-emerald-400" : "text-rose-400"}>
            {trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-200">{value}</p>
    </div>
  );
}

function PayoutRow({
  label,
  value,
  positive,
  negative,
  bold,
  highlight,
  note,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
  highlight?: boolean;
  note?: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg p-2.5 ${highlight ? "bg-slate-800/50" : ""}`}>
      <div>
        <span className={`text-sm ${bold ? "font-semibold text-slate-200" : "text-slate-400"}`}>
          {label}
        </span>
        {note && <p className="text-[10px] text-slate-600">{note}</p>}
      </div>
      <span
        className={`font-mono text-sm ${
          negative ? "text-rose-400" : positive ? "text-emerald-400" : "text-slate-300"
        } ${bold ? "font-bold" : ""}`}
      >
        {negative ? "−" : positive ? "+" : ""}${value.toLocaleString()}
      </span>
    </div>
  );
}