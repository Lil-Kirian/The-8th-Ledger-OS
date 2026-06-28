"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Play,
  Landmark,
  Users,
  DollarSign,
  Download,
  X,
  TrendingUp,
  Eye,
  Vote,
  ClipboardList,
  Wrench,
  Activity,
  Building2,
  Car,
  Cpu,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Plane,
  Wheat,
  Sun,
  Wifi,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

//  Types
export type ProposalStatus =
  | "passed"
  | "ledger_review"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "voting";
export type ProposalType =
  | "maintenance"
  | "upgrade"
  | "hire"
  | "fire"
  | "inventory_list"
  | "closure"
  | "pir_advance"
  | "location_select"
  | "sale"
  | "strategy";
export type VerticalKey =
  | "ledgerprop"
  | "ledgerauto"
  | "ledgertech"
  | "ledgeredu"
  | "ledgerhealth"
  | "ledgerbiz"
  | "ledgertravel"
  | "ledgeragri"
  | "ledgerenergy"
  | "ledgeraccess";

export interface OperationsProposal {
  id: string;
  hallId: string;
  hallName: string;
  hallNumber: number;
  vertical: VerticalKey;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  proposedBy: string;
  proposedByLedgerId: string;
  proposedAt: string;
  voteDeadline?: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalVotingPower: number;
  estimatedCost: number;
  actualCost?: number;
  costVariance?: number;
  executionStartedAt?: string;
  executionCompletedAt?: string;
  proofCount: number;
  cabinetRole?: "speaker" | "treasurer" | "warden" | "scribe";
  isPrimaryAdmin: boolean;
}

export interface OperationsTableProps {
  proposals: OperationsProposal[];
  isLoading?: boolean;
  onExecute?: (proposalId: string) => void;
  onViewDetail?: (proposalId: string) => void;
  onExport?: () => void;
  showHallColumn?: boolean;
}

//  Config
type DetailColor = "cyan" | "emerald" | "red" | "violet" | "amber";

const STATUS_CONFIG: Record<
  ProposalStatus,
  {
    label: string;
    color: string;
    detailColor: DetailColor;
    bg: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  passed: {
    label: "Passed",
    color: "text-emerald-400",
    detailColor: "emerald",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  ledger_review: {
    label: "8th Ledger Review",
    color: "text-amber-400",
    detailColor: "amber",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Landmark,
  },
  in_progress: {
    label: "In Progress",
    color: "text-cyan-400",
    detailColor: "cyan",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: Play,
  },
  completed: {
    label: "Completed",
    color: "text-blue-400",
    detailColor: "cyan",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    detailColor: "red",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: Ban,
  },
  voting: {
    label: "Voting",
    color: "text-violet-400",
    detailColor: "violet",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    icon: Vote,
  },
};

const TYPE_CONFIG: Record<
  ProposalType,
  { label: string; icon: React.ElementType; color: string }
> = {
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    color: "text-emerald-400",
  },
  upgrade: { label: "Upgrade", icon: TrendingUp, color: "text-cyan-400" },
  hire: { label: "Hire", icon: Users, color: "text-blue-400" },
  fire: { label: "Termination", icon: Ban, color: "text-red-400" },
  inventory_list: {
    label: "Inventory List",
    icon: ClipboardList,
    color: "text-amber-400",
  },
  closure: { label: "Closure", icon: AlertTriangle, color: "text-red-400" },
  pir_advance: {
    label: "PIR Advance",
    icon: Landmark,
    color: "text-violet-400",
  },
  location_select: {
    label: "Location Vote",
    icon: Landmark,
    color: "text-sky-400",
  },
  sale: { label: "Asset Sale", icon: DollarSign, color: "text-orange-400" },
  strategy: { label: "Strategy", icon: Activity, color: "text-slate-400" },
};

const VERTICAL_ICONS: Record<VerticalKey, React.ElementType> = {
  ledgerprop: Building2,
  ledgerauto: Car,
  ledgertech: Cpu,
  ledgeredu: GraduationCap,
  ledgerhealth: HeartPulse,
  ledgerbiz: Briefcase,
  ledgertravel: Plane,
  ledgeragri: Wheat,
  ledgerenergy: Sun,
  ledgeraccess: Wifi,
};

//  Helpers
function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function votePercent(yes: number, total: number) {
  if (!total) return 0;
  return Math.round((yes / total) * 100);
}

//  Component
export function OperationsTable({
  proposals,
  isLoading = false,
  onExecute,
  onViewDetail,
  onExport,
  showHallColumn = true,
}: OperationsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<ProposalType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "cost_high" | "cost_low"
  >("newest");

  const filtered = useMemo(() => {
    let result = [...proposals];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.hallName.toLowerCase().includes(q) ||
          p.proposedBy.toLowerCase().includes(q) ||
          String(p.hallNumber).includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.proposedAt).getTime() - new Date(b.proposedAt).getTime()
          );
        case "cost_high":
          return b.estimatedCost - a.estimatedCost;
        case "cost_low":
          return a.estimatedCost - b.estimatedCost;
        default:
          return 0;
      }
    });

    return result;
  }, [proposals, search, statusFilter, typeFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: proposals.length,
      passed: proposals.filter((p) => p.status === "passed").length,
      inProgress: proposals.filter((p) => p.status === "in_progress").length,
      completed: proposals.filter((p) => p.status === "completed").length,
      totalEstimated: proposals.reduce((s, p) => s + p.estimatedCost, 0),
      totalActual: proposals.reduce((s, p) => s + (p.actualCost || 0), 0),
    };
  }, [proposals]);

  if (isLoading) {
    return <OperationsSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/*  Header  */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            8th Ledger Operations
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Command Center · {stats.total} proposals ·{" "}
            {formatCurrency(stats.totalEstimated)} estimated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            CSV
          </Button>
        </div>
      </div>

      {/*  Stats  */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatPill
          icon={ClipboardList}
          label="Total"
          value={stats.total}
          color="slate"
        />
        <StatPill
          icon={CheckCircle2}
          label="Passed"
          value={stats.passed}
          color="emerald"
        />
        <StatPill
          icon={Play}
          label="In Progress"
          value={stats.inProgress}
          color="cyan"
        />
        <StatPill
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          color="blue"
        />
        <StatPill
          icon={DollarSign}
          label="Est. Value"
          value={formatCurrency(stats.totalEstimated)}
          color="amber"
        />
      </div>

      {/*  Controls  */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search proposals by title, hall, or proposer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-cyan-500/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProposalStatus | "all")
            }
            className="appearance-none bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 pr-8 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="voting">Voting</option>
            <option value="passed">Passed</option>
            <option value="ledger_review">8th Ledger Review</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as ProposalType | "all")
            }
            className="appearance-none bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 pr-8 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="appearance-none bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 pr-8 text-xs text-slate-300 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="cost_high">Cost: High</option>
            <option value="cost_low">Cost: Low</option>
          </select>
        </div>
      </div>

      {/*  Results Count  */}
      <div className="text-sm text-slate-500">
        Showing{" "}
        <span className="text-slate-300 font-medium">{filtered.length}</span> of{" "}
        <span className="text-slate-300 font-medium">{proposals.length}</span>{" "}
        proposals
      </div>

      {/*  Table  */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((proposal) => {
            const isExpanded = expandedId === proposal.id;
            const status = STATUS_CONFIG[proposal.status];
            const SIcon = status.icon;
            const type = TYPE_CONFIG[proposal.type];
            const TIcon = type.icon;
            const VIcon = VERTICAL_ICONS[proposal.vertical];
            const votePct = votePercent(
              proposal.yesVotes,
              proposal.totalVotingPower,
            );
            const hasVariance =
              proposal.actualCost != null && proposal.estimatedCost > 0;
            const variance = hasVariance
              ? proposal.actualCost! - proposal.estimatedCost
              : 0;
            const variancePct = hasVariance
              ? (variance / proposal.estimatedCost) * 100
              : 0;

            return (
              <motion.div
                key={proposal.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`border transition-colors overflow-hidden ${
                    proposal.status === "in_progress"
                      ? "border-cyan-500/20 bg-cyan-950/5"
                      : proposal.status === "completed"
                        ? "border-blue-500/20 bg-blue-950/5"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  {/* Main Row */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : proposal.id)
                    }
                  >
                    {/* Status */}
                    <div
                      className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}
                    >
                      <SIcon className={`w-5 h-5 ${status.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-200 truncate">
                          {proposal.title}
                        </span>
                        <Badge
                          className={`text-[10px] ${type.color} bg-slate-800 border-0`}
                        >
                          <TIcon className="w-2.5 h-2.5 mr-1" />
                          {type.label}
                        </Badge>
                        {proposal.isPrimaryAdmin && (
                          <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-0">
                            8th Ledger
                          </Badge>
                        )}
                        {proposal.cabinetRole && (
                          <Badge className="text-[10px] bg-violet-500/10 text-violet-400 border-0">
                            {proposal.cabinetRole}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                        {showHallColumn && (
                          <>
                            <VIcon className="w-3 h-3" />
                            <span>
                              #{proposal.hallNumber} {proposal.hallName}
                            </span>
                            <span className="text-slate-700">·</span>
                          </>
                        )}
                        <span>
                          by{" "}
                          {proposal.proposedBy || proposal.proposedByLedgerId}
                        </span>
                        <span className="text-slate-700">·</span>
                        <span>{timeAgo(proposal.proposedAt)}</span>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="hidden md:block text-right min-w-[100px]">
                      <div className="text-sm font-mono font-semibold text-slate-200">
                        {formatCurrency(proposal.estimatedCost)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        estimated
                      </div>
                      {hasVariance && (
                        <div
                          className={`text-[10px] font-mono ${variance > 0 ? "text-red-400" : "text-emerald-400"}`}
                        >
                          {variance > 0 ? "+" : ""}
                          {formatCurrency(variance)} (
                          {variancePct > 0 ? "+" : ""}
                          {variancePct.toFixed(1)}%)
                        </div>
                      )}
                    </div>

                    {/* Vote Bar */}
                    {proposal.status === "voting" ||
                    proposal.status === "passed" ? (
                      <div className="hidden sm:block w-28 shrink-0">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-500">{votePct}% yes</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${votePct}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {proposal.status === "passed" && onExecute && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExecute(proposal.id);
                          }}
                          className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5" />
                          Execute
                        </Button>
                      )}
                      {onViewDetail && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(proposal.id);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                            <DetailBox
                              label="Description"
                              value={proposal.description}
                              fullWidth
                            />

                            <DetailBox
                              label="Proposed By"
                              value={
                                proposal.proposedBy ||
                                proposal.proposedByLedgerId
                              }
                            />
                            <DetailBox
                              label="Proposed"
                              value={formatDate(proposal.proposedAt)}
                            />
                            <DetailBox
                              label="Status"
                              value={status.label}
                              color={status.detailColor}
                            />
                            <DetailBox label="Type" value={type.label} />

                            <DetailBox
                              label="Estimated Cost"
                              value={formatCurrency(proposal.estimatedCost)}
                              color="cyan"
                            />
                            {proposal.actualCost != null && (
                              <DetailBox
                                label="Actual Cost"
                                value={formatCurrency(proposal.actualCost)}
                                color={variance > 0 ? "red" : "emerald"}
                              />
                            )}
                            {hasVariance && (
                              <DetailBox
                                label="Variance"
                                value={`${variance > 0 ? "+" : ""}${formatCurrency(variance)} (${variancePct.toFixed(1)}%)`}
                                color={variance > 0 ? "red" : "emerald"}
                              />
                            )}

                            <DetailBox
                              label="Yes Votes"
                              value={`${proposal.yesVotes.toFixed(1)}%`}
                              color="emerald"
                            />
                            <DetailBox
                              label="No Votes"
                              value={`${proposal.noVotes.toFixed(1)}%`}
                              color="red"
                            />
                            <DetailBox
                              label="Abstain"
                              value={`${proposal.abstainVotes.toFixed(1)}%`}
                            />
                            <DetailBox
                              label="Total Power"
                              value={`${proposal.totalVotingPower.toFixed(1)}%`}
                            />

                            {proposal.executionStartedAt && (
                              <DetailBox
                                label="Execution Started"
                                value={formatDate(proposal.executionStartedAt)}
                              />
                            )}
                            {proposal.executionCompletedAt && (
                              <DetailBox
                                label="Execution Completed"
                                value={formatDate(
                                  proposal.executionCompletedAt,
                                )}
                              />
                            )}
                            <DetailBox
                              label="Proofs"
                              value={`${proposal.proofCount} uploaded`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">
            No proposals found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Adjust your filters or search terms.
          </p>
        </motion.div>
      )}
    </div>
  );
}

//  Stat Pill
function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: "slate" | "emerald" | "cyan" | "blue" | "amber";
}) {
  const colorMap = {
    slate: "text-slate-400 bg-slate-500/10 border-slate-700",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">
          {label}
        </span>
      </div>
      <div className="text-lg font-bold font-mono">{value}</div>
    </div>
  );
}

//  Detail Box
function DetailBox({
  label,
  value,
  color,
  fullWidth,
}: {
  label: string;
  value: string;
  color?: DetailColor;
  fullWidth?: boolean;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
  };

  return (
    <div className={fullWidth ? "sm:col-span-2 lg:col-span-4" : ""}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-sm font-medium mt-0.5 ${color ? colorMap[color] : "text-slate-200"} ${fullWidth ? "leading-relaxed" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

//  Skeleton
function OperationsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-10 bg-slate-800 rounded animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
