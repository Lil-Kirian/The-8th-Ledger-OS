"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {

  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Ban,
  BadgeCheck,
  Wallet,
  ArrowRight,
  FileText,
  Lock,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────

export type PirAdvanceStatus =
  | "proposed"
  | "voting"
  | "approved"
  | "active"
  | "repaid"
  | "defaulted";

export interface PirAdvanceData {
  id: string;
  hallId: string;
  hallName: string;
  title: string;
  reason: string;
  amount: number;
  miniPoolRaised?: number;
  miniPoolTarget?: number;
  repaymentRate: number; // % of monthly dividends
  repaidAmount: number;
  status: PirAdvanceStatus;
  proposedAt: Date | string;
  voteClosesAt?: Date | string;
  approvedAt?: Date | string;
  dueDate?: Date | string;
  interestRate: number; // 0% for first 12mo, 2% after
  estimatedRepaymentMonths: number;
  totalOwners: number;
  ownersAccepted: number;
  ownersRequired: number; // 51%
  isEmergencyOverride?: boolean;
  overrideReason?: string;
  overrideBy?: string;
  userLedgerId?: string;
  userOwnershipPercent?: number;
  userMonthlyDividend?: number;
  userCurrentPirDebt?: number;
  userDeductionPerMonth?: number;
  userTotalDeductionEstimate?: number;
}

export interface PirAdvancePanelProps {
  data: PirAdvanceData;
  canVote?: boolean;
  isAdmin?: boolean;
  onVoteApprove?: (advanceId: string) => void;
  onVoteReject?: (advanceId: string) => void;
  onAcceptTerms?: (advanceId: string) => void;
  onDeclineTerms?: (advanceId: string) => void;
  onEmergencyOverride?: (advanceId: string, reason: string) => void;
  onPrepay?: (advanceId: string, amount: number) => void;
  onViewContract?: (advanceId: string) => void;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function toDate(input: Date | string | undefined): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return input;
  return new Date(input);
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(input: Date | string | undefined): string {
  const d = toDate(input);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysRemaining(input: Date | string | undefined): number {
  const d = toDate(input);
  if (!d) return 0;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function isOverdue(input: Date | string | undefined): boolean {
  const d = toDate(input);
  if (!d) return false;
  return d.getTime() < Date.now();
}

// ─── Status Config ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PirAdvanceStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ElementType;
    description: string;
  }
> = {
  proposed: {
    label: "Proposed",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    icon: FileText,
    description: "Awaiting hall vote on PIR advance.",
  },
  voting: {
    label: "Terms Vote",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    icon: Vote,
    description: "Owners voting on repayment terms.",
  },
  approved: {
    label: "Approved",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    icon: CheckCircle2,
    description: "Advance approved. Awaiting execution.",
  },
  active: {
    label: "Active",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    icon: Zap,
    description: "PIR advance active. Auto-deducting from dividends.",
  },
  repaid: {
    label: "Repaid",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/25",
    icon: BadgeCheck,
    description: "Advance fully repaid. No outstanding debt.",
  },
  defaulted: {
    label: "Defaulted",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    icon: Ban,
    description:
      "Repayment failed. Debt transferred to sale/closure deductions.",
  },
};

// ─── Main Component ────────────────────────────────────────────────

export function PirAdvancePanel({
  data,
  canVote = false,
  isAdmin = false,
  onVoteApprove,
  onVoteReject,
  onAcceptTerms,
  onDeclineTerms,
  onEmergencyOverride,
  onPrepay,
  onViewContract,
  className,
}: PirAdvancePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState("");
  const [showPrepayForm, setShowPrepayForm] = useState(false);
  const [prepayAmount, setPrepayAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cfg = STATUS_CONFIG[data.status];
  const StatusIcon = cfg.icon;
  const progress =
    data.miniPoolTarget && data.miniPoolRaised !== undefined
      ? Math.min(100, (data.miniPoolRaised / data.miniPoolTarget) * 100)
      : 0;
  const repaymentProgress =
    data.amount > 0
      ? Math.min(100, (data.repaidAmount / data.amount) * 100)
      : 0;
  const remaining = data.amount - data.repaidAmount;
  const overdue = isOverdue(data.dueDate);
  const hasUserAccepted = data.userLedgerId ? data.ownersAccepted > 0 : false;

  const handleEmergencyOverride = async () => {
    if (!onEmergencyOverride || !emergencyReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onEmergencyOverride(data.id, emergencyReason.trim());
      setShowEmergencyForm(false);
      setEmergencyReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrepay = async () => {
    if (!onPrepay || !prepayAmount) return;
    const amount = parseFloat(prepayAmount);
    if (isNaN(amount) || amount <= 0 || amount > remaining) return;
    setIsSubmitting(true);
    try {
      await onPrepay(data.id, amount);
      setShowPrepayForm(false);
      setPrepayAmount("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-slate-950/90 backdrop-blur-md",
        data.isEmergencyOverride
          ? "border-rose-500/30 shadow-rose-500/10"
          : cfg.border,
        data.isEmergencyOverride ? "ring-1 ring-rose-500/20" : "",
        className
      )}
    >
      {/* Top accent */}
      <div
        className={cn(
          "h-[2px] w-full",
          data.isEmergencyOverride
            ? "bg-rose-500"
            : cfg.color.replace("text-", "bg-")
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                cfg.bg
              )}
            >
              <StatusIcon className={cn("h-5 w-5", cfg.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={cn("text-sm font-bold", cfg.color)}>
                  PIR Advance
                </h2>
                {data.isEmergencyOverride && (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/20 animate-pulse">
                    <ShieldAlert className="h-2.5 w-2.5" />
                    EMERGENCY OVERRIDE
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                    cfg.bg,
                    cfg.color,
                    cfg.border
                  )}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{data.title}</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Reason */}
        <div className="mt-3 rounded-lg bg-slate-900/50 p-3 border border-slate-800/50">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Reason
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.reason}
          </p>
        </div>

        {/* Amount & Gap */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Advance Amount
            </p>
            <p className="text-lg font-bold text-slate-100 font-mono">
              {formatCurrency(data.amount)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Mini-Pool Raised
            </p>
            <p className="text-lg font-bold text-slate-100 font-mono">
              {data.miniPoolRaised !== undefined
                ? formatCurrency(data.miniPoolRaised)
                : "—"}
            </p>
            {data.miniPoolTarget && data.miniPoolRaised !== undefined && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                {formatCurrency(data.miniPoolTarget)} target
              </p>
            )}
          </div>
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Funding Gap
            </p>
            <p
              className={cn(
                "text-lg font-bold font-mono",
                data.miniPoolTarget &&
                  data.miniPoolRaised !== undefined &&
                  data.miniPoolRaised < data.miniPoolTarget
                  ? "text-amber-400"
                  : "text-emerald-400"
              )}
            >
              {data.miniPoolTarget && data.miniPoolRaised !== undefined
                ? formatCurrency(
                    Math.max(0, data.miniPoolTarget - data.miniPoolRaised)
                  )
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Repayment Rate
            </p>
            <p className="text-lg font-bold text-violet-400 font-mono">
              {data.repaymentRate}%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              of monthly dividends
            </p>
          </div>
        </div>

        {/* Mini-pool progress bar */}
        {data.miniPoolTarget && data.miniPoolRaised !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500">
                Mini-Pool Progress
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  progress >= 100 ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
            </div>
          </div>
        )}

        {/* Expanded: Terms & User Impact */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4">
                {/* Repayment Terms */}
                <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    Repayment Terms
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Interest (0-12 months)
                      </p>
                      <p className="text-sm font-bold text-emerald-400">0%</p>
                      <p className="text-[10px] text-slate-500">
                        No interest if repaid within 12 months
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Interest (12+ months)
                      </p>
                      <p className="text-sm font-bold text-amber-400">
                        2% annual
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Applied after 12-month grace period
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Auto-Deduction
                      </p>
                      <p className="text-sm font-bold text-violet-400">
                        {data.repaymentRate}%
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Of monthly dividends until repaid
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Prepayment
                      </p>
                      <p className="text-sm font-bold text-cyan-400">Allowed</p>
                      <p className="text-[10px] text-slate-500">
                        Lump sum to clear debt anytime
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Impact */}
                {data.userLedgerId &&
                  data.userOwnershipPercent !== undefined && (
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5" />
                        Your Impact
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            Your Ownership
                          </p>
                          <p className="text-sm font-bold text-slate-200">
                            {data.userOwnershipPercent.toFixed(2)}%
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            Est. Monthly Dividend
                          </p>
                          <p className="text-sm font-bold text-slate-200">
                            {data.userMonthlyDividend !== undefined
                              ? formatCurrency(data.userMonthlyDividend)
                              : "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            Your Deduction
                          </p>
                          <p className="text-sm font-bold text-red-400">
                            {data.userDeductionPerMonth !== undefined
                              ? `-${formatCurrency(data.userDeductionPerMonth)}`
                              : "—"}
                            <span className="text-[10px] text-slate-500 font-normal">
                              /mo
                            </span>
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50 col-span-2 md:col-span-3">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            Total Estimated Repayment (Your Share)
                          </p>
                          <p className="text-sm font-bold text-slate-200">
                            {data.userTotalDeductionEstimate !== undefined
                              ? formatCurrency(data.userTotalDeductionEstimate)
                              : "—"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Deducted automatically from your dividends over ~
                            {data.estimatedRepaymentMonths} months
                          </p>
                        </div>
                      </div>

                      {/* Sale/Closure warnings */}
                      <div className="mt-3 rounded-lg bg-amber-500/5 p-3 border border-amber-500/15">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-[11px] text-amber-400/90 font-medium">
                              Debt Follows Your PAC
                            </p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              If you sell your PAC while this debt is
                              outstanding, the debt will be deducted from your
                              sale price. If the hall closes, the debt is
                              deducted from your liquidation payout.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Repayment Progress (if active) */}
                {data.status === "active" && (
                  <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Repayment Progress
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {repaymentProgress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${repaymentProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-violet-500"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                      <span>Repaid: {formatCurrency(data.repaidAmount)}</span>
                      <span>Remaining: {formatCurrency(remaining)}</span>
                    </div>
                    {overdue && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 p-2 border border-red-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-[10px] text-red-400 font-medium">
                          Overdue. Interest now applies at 2% annual.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Vote / Terms Acceptance */}
                {data.status === "voting" && (
                  <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800/50 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-2">
                      <Vote className="h-3.5 w-3.5" />
                      Terms Acceptance
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">
                        {data.ownersAccepted} of {data.totalOwners} owners
                        accepted
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {((data.ownersAccepted / data.totalOwners) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.ownersAccepted / data.ownersRequired) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {data.ownersRequired}% required to activate (
                      {Math.ceil(
                        data.totalOwners * (data.ownersRequired / 100)
                      )}{" "}
                      owners)
                    </p>

                    {canVote && !hasUserAccepted && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => onAcceptTerms?.(data.id)}
                          className="flex-1 rounded-lg bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accept Terms
                        </button>
                        <button
                          onClick={() => onDeclineTerms?.(data.id)}
                          className="flex-1 rounded-lg bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </div>
                    )}
                    {hasUserAccepted && (
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">
                          You have accepted the terms
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Prepay Section (if active) */}
                {data.status === "active" && onPrepay && (
                  <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5" />
                      Prepay Lump Sum
                    </p>
                    {showPrepayForm ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                          <input
                            type="number"
                            placeholder={`Max ${formatCurrency(remaining)}`}
                            value={prepayAmount}
                            onChange={(e) => setPrepayAmount(e.target.value)}
                            className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                          />
                        </div>
                        <button
                          onClick={handlePrepay}
                          disabled={isSubmitting}
                          className="rounded-lg bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 disabled:opacity-40 transition-colors"
                        >
                          {isSubmitting ? "..." : "Prepay"}
                        </button>
                        <button
                          onClick={() => {
                            setShowPrepayForm(false);
                            setPrepayAmount("");
                          }}
                          className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPrepayForm(true)}
                        className="w-full rounded-lg bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Prepay to Clear Debt
                      </button>
                    )}
                  </div>
                )}

                {/* Emergency Override (Admin only) */}
                {isAdmin &&
                  data.status === "proposed" &&
                  onEmergencyOverride && (
                    <div className="rounded-xl bg-rose-500/5 p-4 border border-rose-500/15 space-y-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        8th Ledger Emergency Override
                      </p>
                      <p className="text-[11px] text-rose-400/80 leading-relaxed">
                        If the asset is at immediate risk (structural collapse,
                        fire hazard, legal violation, payroll default threatening
                        operations, or closure imminent), the 8th Ledger can act
                        within 6 hours without a vote.
                      </p>
                      {showEmergencyForm ? (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Document the emergency reason..."
                            value={emergencyReason}
                            onChange={(e) => setEmergencyReason(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleEmergencyOverride}
                              disabled={isSubmitting || !emergencyReason.trim()}
                              className="flex-1 rounded-lg bg-rose-500/15 py-2 text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-40 transition-colors"
                            >
                              {isSubmitting ? "Executing..." : "Execute Override"}
                            </button>
                            <button
                              onClick={() => {
                                setShowEmergencyForm(false);
                                setEmergencyReason("");
                              }}
                              className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowEmergencyForm(true)}
                          className="w-full rounded-lg bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-colors flex items-center justify-center gap-2"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Protect Asset Now — Override
                        </button>
                      )}
                    </div>
                  )}

                {/* Contract link */}
                {onViewContract && (
                  <button
                    onClick={() => onViewContract(data.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800/60 px-4 py-2.5 text-xs text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View PIR Advance Contract
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Lock className="h-3 w-3" />
            <span>PIR Vault — 8th Ledger Secured</span>
          </div>
          {data.voteClosesAt && data.status === "voting" && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {daysRemaining(data.voteClosesAt)} days to accept
            </span>
          )}
          {data.dueDate && data.status === "active" && (
            <span
              className={cn(
                "text-[10px] flex items-center gap-1",
                overdue ? "text-red-400" : "text-slate-500"
              )}
            >
              <Calendar className="h-3 w-3" />
              {overdue ? "Overdue" : `Due ${formatDate(data.dueDate)}`}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────

export function PirAdvancePanelSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
            <div className="h-3 w-48 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-slate-800 animate-pulse"
          />
        ))}
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 animate-pulse" />
    </div>
  );
}

export default PirAdvancePanel;