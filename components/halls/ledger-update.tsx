// components/halls/ledger-update.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  ShieldCheck,
  Wrench,
  Receipt,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  ExternalLink,
  CheckCircle2,
  Hash,
  BadgeCheck,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Gavel,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────

export type LedgerUpdateType =
  | "insurance_renewal"
  | "emergency_repair"
  | "property_tax"
  | "payroll_executed"
  | "dynamic_valuation"
  | "pir_advance"
  | "maintenance_complete"
  | "spv_formed"
  | "legal_filing"
  | "audit_complete";

export interface LedgerUpdateData {
  id: string;
  hallId: string;
  type: LedgerUpdateType;
  title: string;
  content: string;
  amount?: number;
  amountLabel?: string;
  createdAt: Date;
  status: "info" | "warning" | "success" | "urgent";
  metadata?: Record<string, string>;
  documentUrl?: string;
  auditHash?: string;
  requiresAction?: boolean;
  actionTaken?: boolean;
}

export interface LedgerUpdateProps {
  update: LedgerUpdateData;
  onViewDocument?: (url: string) => void;
  onViewAudit?: (hash: string) => void;
  onAcknowledge?: (id: string) => void;
  className?: string;
}

export interface LedgerUpdateListProps {
  updates: LedgerUpdateData[];
  hallName: string;
  hallId: string;
  onViewDocument?: (url: string) => void;
  onViewAudit?: (hash: string) => void;
  onAcknowledge?: (id: string) => void;
  className?: string;
}

// ─── Type Config ───────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  LedgerUpdateType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    glow: string;
    amountColor: string;
  }
> = {
  insurance_renewal: {
    label: "Insurance Renewal",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    glow: "shadow-emerald-500/10",
    amountColor: "text-emerald-400",
  },
  emergency_repair: {
    label: "Emergency Repair",
    icon: Wrench,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    glow: "shadow-amber-500/10",
    amountColor: "text-amber-400",
  },
  property_tax: {
    label: "Property Tax",
    icon: Receipt,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    glow: "shadow-cyan-500/10",
    amountColor: "text-cyan-400",
  },
  payroll_executed: {
    label: "Payroll Executed",
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    glow: "shadow-violet-500/10",
    amountColor: "text-violet-400",
  },
  dynamic_valuation: {
    label: "Dynamic Valuation",
    icon: TrendingUp,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
    glow: "shadow-sky-500/10",
    amountColor: "text-sky-400",
  },
  pir_advance: {
    label: "PIR Advance",
    icon: Landmark,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    glow: "shadow-rose-500/10",
    amountColor: "text-rose-400",
  },
  maintenance_complete: {
    label: "Maintenance Complete",
    icon: CheckCircle2,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/25",
    glow: "shadow-teal-500/10",
    amountColor: "text-teal-400",
  },
  spv_formed: {
    label: "SPV Formed",
    icon: Gavel,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
    glow: "shadow-indigo-500/10",
    amountColor: "text-indigo-400",
  },
  legal_filing: {
    label: "Legal Filing",
    icon: FileText,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/25",
    glow: "shadow-slate-500/10",
    amountColor: "text-slate-400",
  },
  audit_complete: {
    label: "Audit Complete",
    icon: BadgeCheck,
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/25",
    glow: "shadow-lime-500/10",
    amountColor: "text-lime-400",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; class: string; icon: React.ElementType }
> = {
  info: { label: "Information", class: "bg-slate-500/15 text-slate-400 border-slate-500/20", icon: Info },
  warning: { label: "Attention", class: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: AlertTriangle },
  success: { label: "Completed", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  urgent: { label: "Urgent", class: "bg-rose-500/15 text-rose-400 border-rose-500/20", icon: AlertTriangle },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

// ─── Single Update Card ────────────────────────────────────────────

export function LedgerUpdate({
  update,
  onViewDocument,
  onViewAudit,
  onAcknowledge,
  className,
}: LedgerUpdateProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cfg = TYPE_CONFIG[update.type];
  const TypeIcon = cfg.icon;
  const statusCfg = STATUS_CONFIG[update.status];
  const StatusIcon = statusCfg.icon;
  const isNegative = update.amount !== undefined && update.amount < 0;
  const isPositive = update.amount !== undefined && update.amount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-slate-900/60 backdrop-blur-sm transition-all duration-300",
        cfg.border,
        cfg.glow,
        update.status === "urgent" && "ring-1 ring-rose-500/20",
        className
      )}
    >
      {/* Top accent */}
      <div className={cn(
        "h-[2px] w-full",
        update.type === "insurance_renewal" && "bg-emerald-500",
        update.type === "emergency_repair" && "bg-amber-500",
        update.type === "property_tax" && "bg-cyan-500",
        update.type === "payroll_executed" && "bg-violet-500",
        update.type === "dynamic_valuation" && "bg-sky-500",
        update.type === "pir_advance" && "bg-rose-500",
        update.type === "maintenance_complete" && "bg-teal-500",
        update.type === "spv_formed" && "bg-indigo-500",
        update.type === "legal_filing" && "bg-slate-500",
        update.type === "audit_complete" && "bg-lime-500",
      )} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
              <TypeIcon className={cn("h-4.5 w-4.5", cfg.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", cfg.color)}>
                  {cfg.label}
                </span>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider", statusCfg.class)}>
                  <StatusIcon className="h-2.5 w-2.5" />
                  {statusCfg.label}
                </span>
                {update.requiresAction && !update.actionTaken && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-semibold text-rose-400 border border-rose-500/20 animate-pulse">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Action Required
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-0.5 leading-snug">
                {update.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {update.amount !== undefined && (
              <div className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold font-mono border",
                isNegative ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}>
                {isNegative ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                {isNegative ? "-" : "+"}${Math.abs(update.amount).toLocaleString()}
              </div>
            )}
            <button
              onClick={() => setIsExpanded((e) => !e)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Landmark className="h-3 w-3" />
            8th Ledger
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(update.createdAt)}
          </span>
          {update.auditHash && (
            <>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                <Hash className="h-3 w-3" />
                {update.auditHash.slice(0, 8)}...
              </span>
            </>
          )}
        </div>

        {/* Content Preview */}
        <p className={cn(
          "mt-2.5 text-xs text-slate-300 leading-relaxed",
          !isExpanded && "line-clamp-2"
        )}>
          {update.content}
        </p>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4">
                {/* Metadata Grid */}
                {update.metadata && Object.keys(update.metadata).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(update.metadata).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs font-medium text-slate-200">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Amount Breakdown */}
                {update.amount !== undefined && update.amountLabel && (
                  <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-800/50 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{update.amountLabel}</span>
                    <span className={cn("text-sm font-bold font-mono", cfg.amountColor)}>
                      ${Math.abs(update.amount).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* PIR Advance Terms (if applicable) */}
                {update.type === "pir_advance" && update.metadata && (
                  <div className="rounded-xl bg-rose-500/5 p-4 border border-rose-500/15 space-y-2">
                    <p className="text-xs font-semibold text-rose-400 flex items-center gap-2">
                      <Landmark className="h-3.5 w-3.5" />
                      PIR Advance Terms
                    </p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Repayment Rate</span>
                        <span className="text-slate-200 font-medium">{update.metadata.repayment_rate || "N/A"}</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Interest (0-12mo)</span>
                        <span className="text-emerald-400 font-medium">0%</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Interest (12mo+)</span>
                        <span className="text-amber-400 font-medium">2% annual</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Auto-Deducted From</span>
                        <span className="text-slate-200 font-medium">Monthly Dividends</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Dynamic Valuation Breakdown */}
                {update.type === "dynamic_valuation" && update.metadata && (
                  <div className="rounded-xl bg-sky-500/5 p-4 border border-sky-500/15 space-y-2">
                    <p className="text-xs font-semibold text-sky-400 flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Valuation Breakdown
                    </p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Asset Book Value</span>
                        <span className="text-slate-200 font-medium">{update.metadata.asset_book_value || "N/A"}</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">AHGI Premium</span>
                        <span className="text-sky-400 font-medium">{update.metadata.ahgi_premium || "N/A"}</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">SRI Bonus</span>
                        <span className="text-slate-200 font-medium">{update.metadata.sri_bonus || "N/A"}</span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">PIR Debt</span>
                        <span className="text-rose-400 font-medium">{update.metadata.pir_debt || "$0"}</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Payroll Worker List */}
                {update.type === "payroll_executed" && update.metadata && (
                  <div className="rounded-xl bg-violet-500/5 p-4 border border-violet-500/15">
                    <p className="text-xs font-semibold text-violet-400 flex items-center gap-2 mb-3">
                      <Users className="h-3.5 w-3.5" />
                      Workers Paid
                    </p>
                    <div className="space-y-2">
                      {update.metadata.workers?.split(",").map((worker, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-mono">{worker.trim()}</span>
                          <span className="text-slate-500">Paid</span>
                        </div>
                      )) || (
                        <p className="text-xs text-slate-500">Worker details available in Forge Ledger.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {update.documentUrl && onViewDocument && (
                    <button
                      onClick={() => onViewDocument(update.documentUrl!)}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Document
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                  {update.auditHash && onViewAudit && (
                    <button
                      onClick={() => onViewAudit(update.auditHash!)}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                    >
                      <Hash className="h-3.5 w-3.5" />
                      Audit Trail
                    </button>
                  )}
                  {update.requiresAction && !update.actionTaken && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(update.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Acknowledge
                    </button>
                  )}
                </div>

                {/* Full timestamp */}
                <p className="text-[10px] text-slate-600 text-right">
                  Logged at {formatDate(update.createdAt)} UTC
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Update List ───────────────────────────────────────────────────

export function LedgerUpdateList({
  updates,
  hallName,
  hallId,
  onViewDocument,
  onViewAudit,
  onAcknowledge,
  className,
}: LedgerUpdateListProps) {
  const [filterType, setFilterType] = useState<LedgerUpdateType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "urgent" | "warning" | "info" | "success">("all");

  const filtered = updates.filter((u) => {
    if (filterType !== "all" && u.type !== filterType) return false;
    if (filterStatus !== "all" && u.status !== filterStatus) return false;
    return true;
  });

  const urgentCount = updates.filter((u) => u.status === "urgent" && !u.actionTaken).length;

  return (
    <div className={cn("flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-violet-400" />
              8th Ledger Ledger
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {hallName} — Official records, maintenance, and financial updates
            </p>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1.5 border border-rose-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-xs font-semibold text-rose-400">{urgentCount} urgent</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as LedgerUpdateType | "all")}
            className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500/40"
          >
            <option value="all">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500/40"
          >
            <option value="all">All Status</option>
            <option value="urgent">Urgent</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
          </select>

          <span className="text-[10px] text-slate-500 ml-auto">
            {filtered.length} of {updates.length} updates
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Landmark className="h-10 w-10 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">No ledger updates</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
              The 8th Ledger has not posted any updates for this hall yet. Updates appear automatically.
            </p>
          </div>
        ) : (
          filtered.map((update, index) => (
            <LedgerUpdate
              key={update.id}
              update={update}
              onViewDocument={onViewDocument}
              onViewAudit={onViewAudit}
              onAcknowledge={onAcknowledge}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────

export function LedgerUpdateSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-slate-800 animate-pulse" />
            <div className="h-4 w-48 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-20 rounded-lg bg-slate-800 animate-pulse" />
      </div>
      <div className="h-8 rounded bg-slate-800 animate-pulse" />
      <div className="h-3 w-3/4 rounded bg-slate-800 animate-pulse" />
    </div>
  );
}

export default LedgerUpdate;