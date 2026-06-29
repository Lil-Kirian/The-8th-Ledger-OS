// components/halls/closure-liquidation.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Download,
  Hash,
  FileText,
  Users,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Ban,
  Crown,
  Landmark,
  Receipt,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export interface LiquidationWorker {
  id: string;
  workerNumber: string;
  role: string;
  yearsOfService: number;
  severanceAmount: number;
  status: "pending" | "paid" | "transferred";
}

export interface OwnerPayout {
  ledgerId: string;
  displayName?: string;
  ownershipPercent: number;
  payoutAmount: number;
  status: "pending" | "processing" | "paid" | "failed";
  paidAt?: Date;
  transactionHash?: string;
}

export interface ClosureLiquidationData {
  hallId: string;
  hallName: string;
  hallClass: string;
  vertical: string;
  assetSoldPrice: number;
  ledgerLiquidationFee: number; // 2.5%
  outstandingPirDebt: number;
  taxObligations: number;
  totalSeverance: number;
  workerSeveranceList: LiquidationWorker[];
  netProceeds: number;
  ownerPayouts: OwnerPayout[];
  totalOwners: number;
  dissolutionDate?: Date;
  closureStartedAt: Date;
  liquidationCompletedAt?: Date;
  auditHash: string;
  statementUrl?: string;
  status: "liquidating" | "distributed" | "dissolved";
}

export interface ClosureLiquidationProps {
  data: ClosureLiquidationData;
  currentUserLedgerId?: string;
  onDownloadStatement?: () => void;
  onViewAudit?: (hash: string) => void;
  onCopyHash?: (hash: string) => void;
  className?: string;
}

//  Helpers

function formatCurrency(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

//  Payout Status Badge

function PayoutStatusBadge({ status }: { status: OwnerPayout["status"] }) {
  const map = {
    pending: { label: "Pending", class: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: Clock },
    processing: { label: "Processing", class: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20", icon: ArrowUpRight },
    paid: { label: "Paid", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
    failed: { label: "Failed", class: "bg-red-500/15 text-red-400 border-red-500/20", icon: XCircle },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider", cfg.class)}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

//  Main Component

export function ClosureLiquidation({
  data,
  currentUserLedgerId,
  onDownloadStatement,
  onViewAudit,
  onCopyHash,
  className,
}: ClosureLiquidationProps) {
  const [expandedSection, setExpandedSection] = useState<"payouts" | "workers" | "audit" | null>("payouts");
  const [copiedHash, setCopiedHash] = useState(false);
  const [showDissolvedBanner, setShowDissolvedBanner] = useState(true);

  const isDissolved = data.status === "dissolved";
  const isCurrentUserPaid = data.ownerPayouts.find(
    (o) => o.ledgerId === currentUserLedgerId
  );
  const totalPaid = data.ownerPayouts.filter((o) => o.status === "paid").length;
  const totalPending = data.ownerPayouts.filter((o) => o.status === "pending").length;

  const handleCopyHash = () => {
    if (onCopyHash) {
      onCopyHash(data.auditHash);
    } else {
      navigator.clipboard.writeText(data.auditHash);
    }
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-slate-950/90 backdrop-blur-md",
        isDissolved ? "border-slate-700/50" : "border-red-500/30",
        isDissolved ? "shadow-slate-500/5" : "shadow-red-500/10",
        className
      )}
    >
      {/* Dissolved Banner */}
      <AnimatePresence>
        {isDissolved && showDissolvedBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-800"
          >
            <div className="bg-slate-900/80 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-400">
                  This hall has been dissolved. Ownership terminated.
                </span>
              </div>
              <button
                onClick={() => setShowDissolvedBanner(false)}
                className="rounded p-1 text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top accent */}
      <div className={cn(
        "h-1 w-full",
        isDissolved ? "bg-slate-600" : "bg-red-500"
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              isDissolved ? "bg-slate-800" : "bg-red-500/15"
            )}>
              {isDissolved ? (
                <Lock className="h-6 w-6 text-slate-500" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-red-400" />
              )}
            </div>
            <div>
              <h2 className={cn(
                "text-base font-bold tracking-wide",
                isDissolved ? "text-slate-400" : "text-red-400"
              )}>
                {isDissolved ? "Hall Dissolved" : "Liquidation in Progress"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {data.hallName} — {data.vertical} | {data.hallClass}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border",
              isDissolved
                ? "bg-slate-800 text-slate-400 border-slate-700"
                : "bg-red-500/15 text-red-400 border-red-500/20"
            )}>
              {isDissolved ? (
                <>
                  <Ban className="h-3 w-3" />
                  Dissolved
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  {data.status === "liquidating" ? "Liquidating" : "Distributing"}
                </>
              )}
            </span>
            {data.liquidationCompletedAt && (
              <span className="text-[10px] text-slate-600">
                {formatDate(data.liquidationCompletedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-5 flex items-center gap-2">
          {[
            { label: "Warning", done: true },
            { label: "Decision", done: true },
            { label: "Liquidation", done: data.status !== "liquidating" },
            { label: "Distributed", done: data.status === "dissolved" },
            { label: "Dissolved", done: isDissolved },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold border",
                  step.done
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-800 text-slate-600 border-slate-700"
                )}>
                  {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn(
                  "text-[9px] font-medium",
                  step.done ? "text-emerald-400" : "text-slate-600"
                )}>
                  {step.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={cn(
                  "h-px flex-1 max-w-[40px]",
                  step.done ? "bg-emerald-500/30" : "bg-slate-800"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="mt-6 rounded-xl border border-slate-800/50 bg-slate-900/40 p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Landmark className="h-3.5 w-3.5" />
            Liquidation Breakdown
          </p>

          <div className="space-y-2">
            {/* Asset Sale */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                Asset Sold
              </span>
              <span className="font-bold text-emerald-400 font-mono">{formatCurrency(data.assetSoldPrice)}</span>
            </div>

            <div className="h-px bg-slate-800/50" />

            {/* Deductions */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-2">
                <ArrowDownRight className="h-3 w-3 text-red-400" />
                8th Ledger Liquidation Fee (2.5%)
              </span>
              <span className="font-medium text-red-400 font-mono">-{formatCurrency(data.ledgerLiquidationFee)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-2">
                <ArrowDownRight className="h-3 w-3 text-red-400" />
                Outstanding PIR Debt
              </span>
              <span className="font-medium text-red-400 font-mono">-{formatCurrency(data.outstandingPirDebt)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-2">
                <ArrowDownRight className="h-3 w-3 text-red-400" />
                Tax Obligations
              </span>
              <span className="font-medium text-red-400 font-mono">-{formatCurrency(data.taxObligations)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-2">
                <ArrowDownRight className="h-3 w-3 text-red-400" />
                Worker Severance ({data.workerSeveranceList.length} workers)
              </span>
              <span className="font-medium text-red-400 font-mono">-{formatCurrency(data.totalSeverance)}</span>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Net */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-cyan-400" />
                Net Proceeds to Owners
              </span>
              <span className="font-bold text-cyan-400 font-mono text-base">{formatCurrency(data.netProceeds)}</span>
            </div>
          </div>
        </div>

        {/* Current User Payout (if applicable) */}
        {isCurrentUserPaid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
                <Crown className="h-3.5 w-3.5" />
                Your Payout
              </p>
              <PayoutStatusBadge status={isCurrentUserPaid.status} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-slate-500 mb-1">
                  Ownership: {isCurrentUserPaid.ownershipPercent.toFixed(2)}%
                </p>
                <p className="text-2xl font-bold text-slate-100 font-mono">
                  {formatCurrency(isCurrentUserPaid.payoutAmount)}
                </p>
              </div>
              {isCurrentUserPaid.transactionHash && (
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-2.5 py-1.5 text-[10px] text-slate-400 border border-slate-700/40 hover:text-slate-200 transition-colors"
                >
                  {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedHash ? "Copied" : "Copy Hash"}
                </button>
              )}
            </div>
            {isCurrentUserPaid.paidAt && (
              <p className="text-[10px] text-slate-500 mt-2">
                Paid at {formatDate(isCurrentUserPaid.paidAt)}
              </p>
            )}
          </motion.div>
        )}

        {/* Expandable Sections */}
        <div className="mt-5 space-y-2">
          {/* Owner Payouts */}
          <button
            onClick={() => setExpandedSection(expandedSection === "payouts" ? null : "payouts")}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
              expandedSection === "payouts"
                ? "border-slate-700 bg-slate-900/60"
                : "border-slate-800/50 bg-slate-900/30 hover:border-slate-700/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Owner Payouts</span>
              <span className="text-[10px] text-slate-500">
                {totalPaid}/{data.ownerPayouts.length} paid
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(totalPaid / data.ownerPayouts.length) * 100}%` }}
                />
              </div>
              {expandedSection === "payouts" ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === "payouts" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-3 space-y-2 max-h-64 overflow-y-auto">
                  {data.ownerPayouts.map((owner, i) => (
                    <div
                      key={owner.ledgerId}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-2.5 border transition-colors",
                        owner.ledgerId === currentUserLedgerId
                          ? "bg-cyan-500/5 border-cyan-500/15"
                          : "bg-slate-800/20 border-slate-800/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300">
                          {(owner.displayName || owner.ledgerId).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {owner.displayName || owner.ledgerId}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {owner.ownershipPercent.toFixed(2)}% → {formatCurrency(owner.payoutAmount)}
                          </p>
                        </div>
                      </div>
                      <PayoutStatusBadge status={owner.status} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Worker Severance */}
          <button
            onClick={() => setExpandedSection(expandedSection === "workers" ? null : "workers")}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
              expandedSection === "workers"
                ? "border-slate-700 bg-slate-900/60"
                : "border-slate-800/50 bg-slate-900/30 hover:border-slate-700/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Worker Severance</span>
              <span className="text-[10px] text-slate-500">
                {data.workerSeveranceList.length} workers
              </span>
            </div>
            {expandedSection === "workers" ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {expandedSection === "workers" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-3 space-y-2 max-h-64 overflow-y-auto">
                  <p className="text-[10px] text-slate-500 px-1">
                    1 month salary per year of service. Paid from liquidation proceeds.
                  </p>
                  {data.workerSeveranceList.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between rounded-lg bg-slate-800/20 p-2.5 border border-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300">
                          {worker.workerNumber.slice(-3)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-200">
                            {worker.workerNumber}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {worker.role} • {worker.yearsOfService} year{worker.yearsOfService !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-300 font-mono">
                          {formatCurrency(worker.severanceAmount)}
                        </p>
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-medium",
                          worker.status === "paid" ? "text-emerald-400" : "text-amber-400"
                        )}>
                          {worker.status === "paid" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                          {worker.status === "paid" ? "Paid" : worker.status === "transferred" ? "Transferred" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audit Trail */}
          <button
            onClick={() => setExpandedSection(expandedSection === "audit" ? null : "audit")}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
              expandedSection === "audit"
                ? "border-slate-700 bg-slate-900/60"
                : "border-slate-800/50 bg-slate-900/30 hover:border-slate-700/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Hash className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Audit Trail</span>
            </div>
            {expandedSection === "audit" ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {expandedSection === "audit" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-4 space-y-3">
                  <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Immutable Closure Hash
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-mono text-slate-300 break-all flex-1">
                        {data.auditHash}
                      </p>
                      <button
                        onClick={handleCopyHash}
                        className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                      >
                        {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Closure Started</p>
                      <p className="text-xs text-slate-200">{formatDate(data.closureStartedAt)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        {data.liquidationCompletedAt ? "Completed" : "Status"}
                      </p>
                      <p className="text-xs text-slate-200">
                        {data.liquidationCompletedAt ? formatDate(data.liquidationCompletedAt) : "In Progress"}
                      </p>
                    </div>
                  </div>

                  {onViewAudit && (
                    <button
                      onClick={() => onViewAudit(data.auditHash)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Full Audit Trail
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 pt-5 border-t border-slate-800/50 flex flex-wrap items-center gap-2">
          {onDownloadStatement && (
            <button
              onClick={onDownloadStatement}
              className="flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Statement
            </button>
          )}

          {data.statementUrl && (
            <a
              href={data.statementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              View Statement
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-600">
            <BadgeCheck className="h-3 w-3" />
            <span>Verified by 8th Ledger</span>
          </div>
        </div>

        {/* Final message */}
        <div className="mt-4 rounded-lg bg-slate-900/50 p-3 border border-slate-800/50">
          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            {isDissolved
              ? "This hall has been permanently dissolved. All PACs have been redeemed and burned. Thank you for being a sovereign."
              : "Payouts are being processed in order. You will receive your share automatically once liquidation is complete."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

//  Skeleton ─

export function ClosureLiquidationSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-slate-800 animate-pulse" />
            <div className="h-3 w-48 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-full bg-slate-800 animate-pulse" />
      </div>
      <div className="h-32 rounded-xl bg-slate-800 animate-pulse" />
      <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default ClosureLiquidation;