"use client";

import React, { useState } from "react";
import {
  ClipboardList,
  Clock,
  PackageCheck,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  Download,
  Zap,
  Hammer,
  DollarSign,
  MapPin,
  Crown,
  AlertTriangle,
  Calendar,
  Gavel,
  UserCog,
  Shield,
  PenTool,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProposalType =
  | "renovate"
  | "sell"
  | "rent_change"
  | "manager_change"
  | "location_select"
  | "humanitarian"
  | "liquidation"
  | "impeach_speaker"
  | "impeach_treasurer"
  | "impeach_warden"
  | "impeach_scribe"
  | "marketplace_list"
  | "budget_approve"
  | "hire"
  | "fire"
  | "maintenance"
  | "inventory_list"
  | "closure"
  | "pir_advance";

type ExecutionStatus = "passed" | "ledger_review" | "in_progress" | "completed";

interface Operation {
  id: string;
  proposalId: string;
  proposalTitle: string;
  proposalType: ProposalType;
  hallId: string;
  hallName: string;
  vertical: string;
  costEstimate: number;
  actualCost?: number;
  status: ExecutionStatus;
  proposedAt: string;
  passedAt: string;
  startedAt?: string;
  completedAt?: string;
  executedBy?: string;
  proofCount: number;
  votesFor: number;
  totalVoters: number;
  proposer: string;
}

interface OperationsTableProps {
  operations: Operation[];
  onExecute?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onDownloadCSV?: () => void;
}

const proposalTypeConfig: Record<
  ProposalType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  renovate: { label: "Renovation", icon: Hammer, color: "text-orange-400", bg: "bg-orange-900/20" },
  sell: { label: "Asset Sale", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-900/20" },
  rent_change: { label: "Rent Change", icon: DollarSign, color: "text-blue-400", bg: "bg-blue-900/20" },
  manager_change: { label: "Executive Change", icon: UserCog, color: "text-purple-400", bg: "bg-purple-900/20" },
  location_select: { label: "Location Vote", icon: MapPin, color: "text-cyan-400", bg: "bg-cyan-900/20" },
  humanitarian: { label: "Humanitarian", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-900/20" },
  liquidation: { label: "Liquidation", icon: DollarSign, color: "text-red-400", bg: "bg-red-900/20" },
  impeach_speaker: { label: "Impeach Speaker", icon: Crown, color: "text-amber-400", bg: "bg-amber-900/20" },
  impeach_treasurer: { label: "Impeach Treasurer", icon: DollarSign, color: "text-amber-400", bg: "bg-amber-900/20" },
  impeach_warden: { label: "Impeach Warden", icon: Shield, color: "text-amber-400", bg: "bg-amber-900/20" },
  impeach_scribe: { label: "Impeach Scribe", icon: PenTool, color: "text-amber-400", bg: "bg-amber-900/20" },
  marketplace_list: { label: "Marketplace", icon: DollarSign, color: "text-pink-400", bg: "bg-pink-900/20" },
  budget_approve: { label: "Budget", icon: DollarSign, color: "text-teal-400", bg: "bg-teal-900/20" },
  hire: { label: "Hire Worker", icon: UserCog, color: "text-emerald-400", bg: "bg-emerald-900/20" },
  fire: { label: "Terminate Worker", icon: Ban, color: "text-red-400", bg: "bg-red-900/20" },
  maintenance: { label: "Maintenance", icon: Hammer, color: "text-orange-400", bg: "bg-orange-900/20" },
  inventory_list: { label: "Inventory Listing", icon: PackageCheck, color: "text-cyan-400", bg: "bg-cyan-900/20" },
  closure: { label: "Closure Protocol", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-900/20" },
  pir_advance: { label: "PIR Advance", icon: Shield, color: "text-indigo-400", bg: "bg-indigo-900/20" },
};

const statusConfig: Record<
  ExecutionStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  passed: {
    label: "Passed",
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/30",
    icon: Gavel,
  },
  ledger_review: {
    label: "Ledger Review",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: Zap,
  },
  completed: {
    label: "Completed",
    color: "text-slate-300",
    bg: "bg-slate-800/40",
    border: "border-slate-600/40",
    icon: PackageCheck,
  },
};

/* ============================================================
   VERTICAL FILTER OPTIONS — 11 Verticals
   ============================================================ */
const VERTICAL_OPTIONS = [
  { value: "all", label: "All Verticals" },
  { value: "ledgerprop", label: "LedgerProp" },
  { value: "ledgerauto", label: "LedgerAuto" },
  { value: "ledgeredu", label: "LedgerEdu" },
  { value: "ledgeraccess", label: "LedgerAccess" },
  { value: "ledgerhealth", label: "LedgerHealth" },
  { value: "ledgerbiz", label: "LedgerBiz" },
  { value: "ledgertech", label: "LedgerTech" },
  { value: "ledgertravel", label: "LedgerTravel" },
  { value: "ledgeragri", label: "LedgerAgri" },
  { value: "ledgerenergy", label: "LedgerEnergy" },
  { value: "ledgersport", label: "SportLedger" },
];

export default function OperationsTable({
  operations,
  onExecute,
  onViewDetails,
  onDownloadCSV,
}: OperationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | "all">("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "cost" | "status">("date");

  const filtered = operations
    .filter((op) => {
      const matchesSearch =
        op.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.hallName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.proposalId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || op.status === statusFilter;
      const matchesVertical = verticalFilter === "all" || op.vertical.toLowerCase() === verticalFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesVertical;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.passedAt).getTime() - new Date(a.passedAt).getTime();
      if (sortBy === "cost") return (b.actualCost || b.costEstimate) - (a.actualCost || a.costEstimate);
      return 0;
    });

  const statusCounts = {
    all: operations.length,
    passed: operations.filter((o) => o.status === "passed").length,
    ledger_review: operations.filter((o) => o.status === "ledger_review").length,
    in_progress: operations.filter((o) => o.status === "in_progress").length,
    completed: operations.filter((o) => o.status === "completed").length,
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-900/20 border border-amber-700/30 flex items-center justify-center">
            <ClipboardList size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">8th Ledger Operations Command Center</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {statusCounts.passed} passed • {statusCounts.ledger_review} review • {statusCounts.in_progress} active • {statusCounts.completed} done
            </p>
          </div>
        </div>
        <button
          onClick={onDownloadCSV}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search proposals, halls..."
              className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={verticalFilter}
              onChange={(e) => setVerticalFilter(e.target.value)}
              className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
            >
              {VERTICAL_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExecutionStatus | "all")}
              className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Status ({statusCounts.all})</option>
              <option value="passed">Passed ({statusCounts.passed})</option>
              <option value="ledger_review">Ledger Review ({statusCounts.ledger_review})</option>
              <option value="in_progress">In Progress ({statusCounts.in_progress})</option>
              <option value="completed">Completed ({statusCounts.completed})</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "cost" | "status")}
              className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="cost">Sort by Cost</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-800/40 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-900/30 text-[10px] text-slate-500 uppercase tracking-wider font-medium border-b border-slate-800/40">
            <div className="col-span-3">Proposal</div>
            <div className="col-span-2">Hall</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Cost</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1"></div>
          </div>

          <div className="divide-y divide-slate-800/40">
            {filtered.map((op) => {
              const typeCfg = proposalTypeConfig[op.proposalType] || proposalTypeConfig.budget_approve;
              const TypeIcon = typeCfg.icon;
              const statusCfg = statusConfig[op.status];
              const StatusIcon = statusCfg.icon;
              const isExpanded = expandedRow === op.id;

              return (
                <div key={op.id}>
                  <div
                    className={cn(
                      "grid grid-cols-12 gap-3 px-4 py-3 items-center transition-all hover:bg-slate-800/20",
                      isExpanded && "bg-slate-800/20"
                    )}
                  >
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border shrink-0", typeCfg.bg, "border-slate-700/30")}>
                          <TypeIcon size={12} className={typeCfg.color} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate">{op.proposalTitle}</div>
                          <div className="text-[10px] text-slate-600 font-mono">#{op.proposalId.slice(-6)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-xs text-slate-300">{op.hallName}</div>
                      <div className="text-[10px] text-slate-600">{op.vertical}</div>
                    </div>

                    <div className="col-span-2">
                      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border", statusCfg.bg, statusCfg.border, statusCfg.color)}>
                        <StatusIcon size={10} className={op.status === "in_progress" ? "animate-pulse" : ""} />
                        {statusCfg.label}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-xs text-slate-200 font-mono">
                        ${(op.actualCost || op.costEstimate).toLocaleString()}
                      </div>
                      {op.actualCost && op.actualCost !== op.costEstimate && (
                        <div className={cn(
                          "text-[10px] font-mono",
                          op.actualCost > op.costEstimate ? "text-red-400" : "text-emerald-400"
                        )}>
                          {op.actualCost > op.costEstimate ? "+" : ""}
                          {(op.actualCost - op.costEstimate).toLocaleString()} vs est
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <div className="text-xs text-slate-400">
                        {new Date(op.passedAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        {op.proofCount} proof{op.proofCount !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {op.status === "passed" && (
                        <button
                          onClick={() => onExecute?.(op.id)}
                          className="p-1.5 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/30 transition-all"
                          title="Begin Execution"
                        >
                          <Zap size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : op.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 py-4 bg-slate-900/20 border-t border-slate-800/40 space-y-4 animate-in slide-in-from-top-1">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Proposer</div>
                          <div className="text-xs text-slate-200">{op.proposer}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Vote Result</div>
                          <div className="text-xs text-slate-200">{op.votesFor}% capital</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Hall ID</div>
                          <div className="text-xs text-slate-400 font-mono">#{op.hallId.slice(-6)}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
                          <div className="text-[10px] text-slate-500 uppercase mb-1">Executed By</div>
                          <div className="text-xs text-slate-200">{op.executedBy || "—"}</div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={12} />
                        <span>Proposed: {new Date(op.proposedAt).toLocaleDateString()}</span>
                        <ChevronRight size={12} />
                        <span>Passed: {new Date(op.passedAt).toLocaleDateString()}</span>
                        {op.startedAt && (
                          <>
                            <ChevronRight size={12} />
                            <span>Started: {new Date(op.startedAt).toLocaleDateString()}</span>
                          </>
                        )}
                        {op.completedAt && (
                          <>
                            <ChevronRight size={12} />
                            <span>Completed: {new Date(op.completedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetails?.(op.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs font-medium text-slate-300 hover:text-slate-100 transition-all"
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                        {op.status === "passed" && (
                          <button
                            onClick={() => onExecute?.(op.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-white text-xs font-bold hover:bg-emerald-500 transition-all"
                          >
                            <Zap size={14} />
                            Execute Now
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No operations match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}