"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Upload,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Search,
  X,
  Eye,
  DollarSign,
  Layers,
  Siren,
  Hammer,
  Package,
  PiggyBank,
  Zap,
} from "lucide-react";

/*  Types  */
type RealStatus = "passed" | "executing" | "completed" | "cancelled";
type FilterStatus = RealStatus | "all";

type ProposalType =
  | "renovate"
  | "sell"
  | "rent_change"
  | "manager_change"
  | "location_select"
  | "humanitarian"
  | "liquidation"
  | "impeach_manager"
  | "impeach_liaison"
  | "marketplace_list"
  | "budget_approve"
  | "hire"
  | "fire"
  | "maintenance"
  | "inventory_list"
  | "closure"
  | "pir_advance"
  // PHASE 4: Universal operations
  | "inventory_enable"
  | "forge_enable"
  | "ihcp_create"
  | "pricing_change"
  | "marketing"
  | "supplier_change"
  | "performance_review";

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: RealStatus;
  amount: number | null;
  executionCost: number | null;
  voteWeightYes: number;
  voteWeightNo: number;
  voteCountYes: number;
  voteCountNo: number;
  thresholdPercent: number;
  yesPercent: number;
  endsAt: string;
  executedAt: string | null;
  executionResult: string | null;
  hallId: string;
  hallName: string;
  vertical: string;
  proposer: { displayName: string; ledgerId: string };
  totalVotes: number;
  createdAt: string;
}

// PHASE 4: Closure protocol alert
interface ClosureAlert {
  hallId: string;
  hallName: string;
  phase: string;
  ahgi: number;
  revenue: number;
  payroll: number;
  net: number;
  monthsCritical: number;
}

/*  Config  */
const STATUS_CONFIG: Record<
  RealStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  passed: {
    label: "Passed — Awaiting Execution",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Clock,
  },
  executing: {
    label: "In Progress",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: X,
  },
};

const TYPE_LABELS: Record<string, string> = {
  renovate: "Renovate",
  sell: "Sell",
  rent_change: "Rent Change",
  manager_change: "Manager Change",
  location_select: "Location",
  humanitarian: "Humanitarian",
  liquidation: "Liquidation",
  impeach_manager: "Impeach Manager",
  impeach_liaison: "Impeach Liaison",
  marketplace_list: "Marketplace",
  budget_approve: "Budget",
  hire: "Hire Staff",
  fire: "Terminate Staff",
  maintenance: "Maintenance",
  inventory_list: "Inventory List",
  closure: "Closure Protocol",
  pir_advance: "PIR Advance",
  // PHASE 4
  inventory_enable: "Enable Inventory",
  forge_enable: "Enable Forge",
  ihcp_create: "Create IHCP",
  pricing_change: "Pricing Change",
  marketing: "Marketing Spend",
  supplier_change: "Supplier Change",
  performance_review: "Performance Review",
};

const TYPE_COLORS: Record<string, string> = {
  renovate: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
  sell: "border-amber-500/20 text-amber-400 bg-amber-500/10",
  rent_change: "border-sky-500/20 text-sky-400 bg-sky-500/10",
  manager_change: "border-violet-500/20 text-violet-400 bg-violet-500/10",
  location_select: "border-indigo-500/20 text-indigo-400 bg-indigo-500/10",
  humanitarian: "border-rose-500/20 text-rose-400 bg-rose-500/10",
  liquidation: "border-red-500/20 text-red-400 bg-red-500/10",
  impeach_manager: "border-orange-500/20 text-orange-400 bg-orange-500/10",
  impeach_liaison: "border-orange-500/20 text-orange-400 bg-orange-500/10",
  marketplace_list: "border-cyan-500/20 text-cyan-400 bg-cyan-500/10",
  budget_approve: "border-green-500/20 text-green-400 bg-green-500/10",
  hire: "border-blue-500/20 text-blue-400 bg-blue-500/10",
  fire: "border-red-500/20 text-red-400 bg-red-500/10",
  maintenance: "border-yellow-500/20 text-yellow-400 bg-yellow-500/10",
  inventory_list: "border-teal-500/20 text-teal-400 bg-teal-500/10",
  closure: "border-red-600/20 text-red-500 bg-red-600/10",
  pir_advance: "border-purple-500/20 text-purple-400 bg-purple-500/10",
  // PHASE 4
  inventory_enable: "border-sky-500/20 text-sky-400 bg-sky-500/10",
  forge_enable: "border-orange-500/20 text-orange-400 bg-orange-500/10",
  ihcp_create: "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
  pricing_change: "border-amber-500/20 text-amber-400 bg-amber-500/10",
  marketing: "border-violet-500/20 text-violet-400 bg-violet-500/10",
  supplier_change: "border-cyan-500/20 text-cyan-400 bg-cyan-500/10",
  performance_review: "border-blue-500/20 text-blue-400 bg-blue-500/10",
};

/*  Stat card styles  */
const STAT_STYLES: Record<
  string,
  { border: string; bg: string; text: string; icon: React.ElementType }
> = {
  amber: {
    border: "border-amber-500/10",
    bg: "bg-amber-500/[0.04]",
    text: "text-amber-400",
    icon: Clock,
  },
  cyan: {
    border: "border-cyan-500/10",
    bg: "bg-cyan-500/[0.04]",
    text: "text-cyan-400",
    icon: Loader2,
  },
  emerald: {
    border: "border-emerald-500/10",
    bg: "bg-emerald-500/[0.04]",
    text: "text-emerald-400",
    icon: CheckCircle2,
  },
  violet: {
    border: "border-violet-500/10",
    bg: "bg-violet-500/[0.04]",
    text: "text-violet-400",
    icon: Layers,
  },
  rose: {
    border: "border-rose-500/10",
    bg: "bg-rose-500/[0.04]",
    text: "text-rose-400",
    icon: Siren,
  },
  sky: {
    border: "border-sky-500/10",
    bg: "bg-sky-500/[0.04]",
    text: "text-sky-400",
    icon: Package,
  },
  orange: {
    border: "border-orange-500/10",
    bg: "bg-orange-500/[0.04]",
    text: "text-orange-400",
    icon: Hammer,
  },
};

/*  Component  */
export default function OperationsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [closureAlerts, setClosureAlerts] = useState<ClosureAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [message, setMessage] = useState("");

  const [execForms, setExecForms] = useState<
    Record<
      string,
      {
        result: string;
        cost: string;
        proofs: string[];
        uploading: boolean;
      }
    >
  >({});

  /* Fetch */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [proposalsRes, closureRes] = await Promise.all([
        fetch("/api/admin/operations"),
        fetch("/api/admin/operations?closure=true"),
      ]);
      const proposalsData = await proposalsRes.json();
      const closureData = await closureRes.json();

      if (proposalsData.success) setProposals(proposalsData.proposals || []);
      if (closureData.success)
        setClosureAlerts(closureData.closureAlerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Filtered */
  const filtered = useMemo(() => {
    let list = proposals;
    if (activeFilter !== "all") {
      list = list.filter((p) => p.status === activeFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((p) => p.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.hallName.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.proposer.displayName.toLowerCase().includes(q),
      );
    }
    return list.sort(
      (a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
    );
  }, [proposals, activeFilter, typeFilter, search]);

  /* Stats */
  const stats = useMemo(() => {
    return {
      total: proposals.length,
      passed: proposals.filter((p) => p.status === "passed").length,
      executing: proposals.filter((p) => p.status === "executing").length,
      completed: proposals.filter((p) => p.status === "completed").length,
      // PHASE 4
      inventoryOps: proposals.filter(
        (p) => p.type === "inventory_enable" || p.type === "inventory_list",
      ).length,
      forgeOps: proposals.filter(
        (p) =>
          p.type === "forge_enable" || p.type === "hire" || p.type === "fire",
      ).length,
      ihcpOps: proposals.filter((p) => p.type === "ihcp_create").length,
    };
  }, [proposals]);

  /* Actions */
  async function handleStart(proposalId: string, hallId: string) {
    setActionLoading((prev) => ({ ...prev, [proposalId]: true }));
    try {
      const res = await fetch(
        `/api/halls/${hallId}/proposals/${proposalId}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setMessage("Execution started");
        fetchData();
      } else {
        setMessage(data.error || "Failed to start");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [proposalId]: false }));
    }
  }

  async function handleComplete(proposalId: string, hallId: string) {
    const form = execForms[proposalId];
    if (!form?.result || form.result.length < 5) {
      setMessage("Execution result required (min 5 chars)");
      return;
    }
    setActionLoading((prev) => ({ ...prev, [proposalId]: true }));
    try {
      const res = await fetch(
        `/api/halls/${hallId}/proposals/${proposalId}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            executionResult: form.result,
            executionCost: form.cost ? Number(form.cost) : null,
            proofUrls: form.proofs,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setMessage("Execution completed");
        setExpandedId(null);
        fetchData();
      } else {
        setMessage(data.error || "Failed to complete");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [proposalId]: false }));
    }
  }

  /* Proof upload */
  const handleProofUpload = useCallback(
    async (proposalId: string, files: FileList | null) => {
      if (!files) return;
      setExecForms((prev) => ({
        ...prev,
        [proposalId]: { ...prev[proposalId], uploading: true },
      }));
      const proofs: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        proofs.push(dataUrl);
      }
      setExecForms((prev) => ({
        ...prev,
        [proposalId]: {
          ...prev[proposalId],
          proofs: [...(prev[proposalId]?.proofs || []), ...proofs],
          uploading: false,
        },
      }));
    },
    [],
  );

  const updateForm = (
    proposalId: string,
    field: "result" | "cost",
    value: string,
  ) => {
    setExecForms((prev) => ({
      ...prev,
      [proposalId]: {
        ...(prev[proposalId] || { proofs: [], uploading: false }),
        [field]: value,
      },
    }));
  };

  const removeProof = (proposalId: string, index: number) => {
    setExecForms((prev) => ({
      ...prev,
      [proposalId]: {
        ...prev[proposalId],
        proofs: prev[proposalId]?.proofs.filter((_, i) => i !== index) || [],
      },
    }));
  };

  async function triggerClosureAction(
    hallId: string,
    action: "force" | "liquidate",
  ) {
    try {
      const res = await fetch(`/api/halls/${hallId}/closure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Closure ${action} triggered for Hall #${hallId.slice(-6)}`);
        fetchData();
      } else {
        setMessage(data.error || "Closure action failed");
      }
    } catch {
      setMessage("Network error");
    }
  }

  /*  Render  */
  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-4 py-1.5">
          <ClipboardCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            8th Ledger Operations
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Command{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Center
          </span>
        </h1>
        <p className="mt-1 max-w-lg text-sm text-slate-400">
          Execute what the community votes. Manage IHCP approvals. Trigger
          closure protocols. Track forge, inventory, and maintenance operations.
        </p>
      </div>

      {/* PHASE 4: Closure Protocol Alerts */}
      {closureAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-3"
        >
          {closureAlerts.map((alert) => (
            <div
              key={alert.hallId}
              className={`rounded-xl border p-4 ${
                alert.phase === "liquidation"
                  ? "border-rose-500/20 bg-rose-500/[0.04]"
                  : alert.phase === "decision"
                    ? "border-orange-500/20 bg-orange-500/[0.04]"
                    : "border-amber-500/20 bg-amber-500/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Siren
                    className={`h-5 w-5 ${
                      alert.phase === "liquidation"
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  />
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        alert.phase === "liquidation"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {alert.phase === "liquidation"
                        ? "🔒 Liquidation Scheduled"
                        : alert.phase === "decision"
                          ? "⚠️ Final Warning"
                          : "⚠️ Closure Warning"}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {alert.hallName} • AHGI: {alert.ahgi} • Revenue: $
                      {alert.revenue.toLocaleString()} • Payroll: $
                      {alert.payroll.toLocaleString()} • Net: $
                      {alert.net.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {alert.phase !== "liquidation" && (
                    <button
                      onClick={() =>
                        triggerClosureAction(alert.hallId, "force")
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
                    >
                      <Zap className="h-3.5 w-3.5" /> Force Closure
                    </button>
                  )}
                  <Link
                    href={`/admin/halls/${alert.hallId}`}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Hall
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Total Passed", value: stats.passed, key: "amber" },
          { label: "In Progress", value: stats.executing, key: "cyan" },
          { label: "Completed", value: stats.completed, key: "emerald" },
          { label: "All Proposals", value: stats.total, key: "violet" },
          { label: "Inventory Ops", value: stats.inventoryOps, key: "sky" },
          { label: "Forge Ops", value: stats.forgeOps, key: "orange" },
          { label: "IHCP Ops", value: stats.ihcpOps, key: "rose" },
        ].map((s) => {
          const style = STAT_STYLES[s.key];
          const Icon = style.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border ${style.border} ${style.bg} p-4 backdrop-blur-sm`}
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                {s.label}
              </div>
              <p className={`mt-1 text-2xl font-bold ${style.text}`}>
                {s.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters + Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "passed", "executing", "completed"] as FilterStatus[]).map(
            (f) => {
              const active = activeFilter === f;
              const config =
                f === "all"
                  ? {
                      label: "All",
                      color: "text-slate-300",
                      bg: "bg-white/[0.02]",
                      border: "border-white/5",
                      icon: Layers,
                    }
                  : STATUS_CONFIG[f];
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? `${config.bg} ${config.border} ${config.color} ring-1 ${config.border.replace("border", "ring")}`
                      : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <config.icon
                    className={`h-3.5 w-3.5 ${active ? config.color : "text-slate-500"}`}
                  />
                  {f === "all" ? "All" : config.label.split("—")[0]}
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-white/10" : "bg-white/5"} text-white/60`}
                  >
                    {f === "all"
                      ? stats.total
                      : proposals.filter((p) => p.status === f).length}
                  </span>
                </button>
              );
            },
          )}

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500/30"
          >
            <option value="all">All Types</option>
            <optgroup label="Universal Operations">
              <option value="inventory_enable">Enable Inventory</option>
              <option value="forge_enable">Enable Forge</option>
              <option value="ihcp_create">Create IHCP</option>
              <option value="inventory_list">Inventory List</option>
              <option value="pricing_change">Pricing Change</option>
              <option value="marketing">Marketing</option>
              <option value="supplier_change">Supplier Change</option>
            </optgroup>
            <optgroup label="Staffing">
              <option value="hire">Hire</option>
              <option value="fire">Fire</option>
              <option value="performance_review">Performance Review</option>
            </optgroup>
            <optgroup label="Asset">
              <option value="renovate">Renovate</option>
              <option value="sell">Sell</option>
              <option value="maintenance">Maintenance</option>
              <option value="pir_advance">PIR Advance</option>
            </optgroup>
            <optgroup label="Governance">
              <option value="closure">Closure</option>
              <option value="liquidation">Liquidation</option>
              <option value="impeach_manager">Impeach Manager</option>
              <option value="budget_approve">Budget</option>
            </optgroup>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposals..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-cyan-500/30 focus:bg-white/[0.05] sm:w-64"
          />
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs ${
              message.includes("completed") ||
              message.includes("started") ||
              message.includes("triggered")
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {message.includes("completed") ||
            message.includes("started") ||
            message.includes("triggered") ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {message}
            <button onClick={() => setMessage("")} className="ml-auto">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proposal Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/60 p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-white/10" />
          <p className="mt-4 text-sm text-slate-500">
            No proposals match your filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((proposal, idx) => {
            const statusCfg = STATUS_CONFIG[proposal.status];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === proposal.id;
            const form = execForms[proposal.id] || {
              proofs: [],
              uploading: false,
              result: "",
              cost: "",
            };

            // PHASE 4: Special indicators
            const isInventoryOp =
              proposal.type === "inventory_enable" ||
              proposal.type === "inventory_list";
            const isForgeOp =
              proposal.type === "forge_enable" ||
              proposal.type === "hire" ||
              proposal.type === "fire";
            const isIhcpOp = proposal.type === "ihcp_create";

            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl border backdrop-blur-md transition-all ${
                  isExpanded
                    ? "border-cyan-500/20 bg-[#0a0a14]/90"
                    : "border-white/5 bg-[#0a0a14]/60 hover:border-white/10"
                }`}
              >
                {/* Card Header */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-5"
                  onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statusCfg.bg} ring-1 ${statusCfg.border}`}
                  >
                    <StatusIcon
                      className={`h-5 w-5 ${statusCfg.color} ${
                        proposal.status === "executing" ? "animate-spin" : ""
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          TYPE_COLORS[proposal.type] ||
                          "border-white/10 text-slate-400 bg-white/[0.02]"
                        }`}
                      >
                        {TYPE_LABELS[proposal.type] || proposal.type}
                      </span>
                      {/* PHASE 4: Operation indicators */}
                      {isInventoryOp && (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-400">
                          <Package className="h-3 w-3" /> Inventory
                        </span>
                      )}
                      {isForgeOp && (
                        <span className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-400">
                          <Hammer className="h-3 w-3" /> Forge
                        </span>
                      )}
                      {isIhcpOp && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
                          <PiggyBank className="h-3 w-3" /> IHCP
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        #{proposal.id.slice(-6)}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate text-sm font-semibold text-white">
                      {proposal.title}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{proposal.hallName}</span>
                      <span>•</span>
                      <span>{proposal.vertical}</span>
                      <span>•</span>
                      <span>by {proposal.proposer.displayName}</span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 flex-col items-end sm:flex">
                    {proposal.amount && (
                      <span className="text-sm font-bold text-amber-300">
                        ${proposal.amount.toLocaleString()}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {proposal.yesPercent.toFixed(1)}% approval
                    </span>
                  </div>

                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-5 pb-5 pt-4">
                        {/* Description */}
                        <p className="mb-4 text-sm leading-relaxed text-slate-300">
                          {proposal.description}
                        </p>

                        {/* Vote Bar */}
                        <div className="mb-4">
                          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Approval</span>
                            <span>
                              {proposal.yesPercent.toFixed(1)}% /{" "}
                              {proposal.thresholdPercent}% required
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{
                                width: `${Math.min(proposal.yesPercent, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-[9px] text-slate-600">
                            <span>{proposal.voteCountYes} yes</span>
                            <span>{proposal.voteCountNo} no</span>
                          </div>
                        </div>

                        {/* Meta Grid */}
                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">
                              Proposed
                            </p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {new Date(
                                proposal.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">
                              Voting Ended
                            </p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {new Date(proposal.endsAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">
                              Est. Amount
                            </p>
                            <p className="mt-1 text-xs font-semibold text-amber-300">
                              {proposal.amount
                                ? `$${proposal.amount.toLocaleString()}`
                                : "—"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">
                              Execution Cost
                            </p>
                            <p className="mt-1 text-xs font-semibold text-cyan-300">
                              {proposal.executionCost
                                ? `$${proposal.executionCost.toLocaleString()}`
                                : "—"}
                            </p>
                          </div>
                        </div>

                        {/* PHASE 4: IHCP-specific info */}
                        {isIhcpOp && proposal.status === "passed" && (
                          <div className="mb-4 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
                            <p className="text-[10px] text-emerald-400 flex items-center gap-2">
                              <PiggyBank className="h-3.5 w-3.5" />
                              IHCP Proposal: 5% priority return. Repaid from
                              revenue before dividends.
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        {proposal.status === "passed" && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleStart(proposal.id, proposal.hallId)
                              }
                              disabled={actionLoading[proposal.id]}
                              className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-2.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 disabled:opacity-50"
                            >
                              {actionLoading[proposal.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              Start Execution
                            </button>
                            <Link
                              href={`/admin/operations/${proposal.id}`}
                              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
                            >
                              <Eye className="h-3.5 w-3.5" /> Detail View
                            </Link>
                          </div>
                        )}

                        {proposal.status === "executing" && (
                          <div className="space-y-4">
                            {/* Result Input */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Execution Result
                              </label>
                              <textarea
                                value={form.result}
                                onChange={(e) =>
                                  updateForm(
                                    proposal.id,
                                    "result",
                                    e.target.value,
                                  )
                                }
                                rows={2}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/30 resize-none"
                                placeholder="Describe what was done, outcomes, deliverables..."
                              />
                            </div>

                            {/* Cost Input */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Actual Cost (USD)
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/20" />
                                <input
                                  type="number"
                                  value={form.cost}
                                  onChange={(e) =>
                                    updateForm(
                                      proposal.id,
                                      "cost",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-8 pr-4 py-2.5 text-xs text-white outline-none focus:border-cyan-500/30 sm:w-48"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            {/* Proof Upload */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                Proof Upload
                              </label>
                              <div className="relative flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 hover:border-white/20 transition-all">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleProofUpload(
                                      proposal.id,
                                      e.target.files,
                                    )
                                  }
                                  className="absolute inset-0 cursor-pointer opacity-0"
                                />
                                <Upload className="h-4 w-4 text-slate-500" />
                                <span className="text-xs text-slate-400">
                                  Drop photos, invoices, certificates
                                </span>
                                {form.uploading && (
                                  <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-cyan-400" />
                                )}
                              </div>

                              {form.proofs.length > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                  {form.proofs.map((proof, i) => (
                                    <div
                                      key={i}
                                      className="group relative aspect-square overflow-hidden rounded-lg border border-white/5"
                                    >
                                      <img
                                        src={proof}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                      <button
                                        onClick={() =>
                                          removeProof(proposal.id, i)
                                        }
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                                      >
                                        <X className="h-4 w-4 text-rose-400" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                              <button
                                onClick={() =>
                                  handleComplete(proposal.id, proposal.hallId)
                                }
                                disabled={actionLoading[proposal.id]}
                                className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                {actionLoading[proposal.id] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Mark Complete
                              </button>
                              <Link
                                href={`/admin/operations/${proposal.id}`}
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
                              >
                                <Eye className="h-3.5 w-3.5" /> Full Detail
                              </Link>
                            </div>
                          </div>
                        )}

                        {proposal.status === "completed" && (
                          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-400 mb-2">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                            </div>
                            <p className="text-xs text-slate-300">
                              {proposal.executionResult ||
                                "No result recorded."}
                            </p>
                            {proposal.executedAt && (
                              <p className="mt-2 text-[10px] text-slate-500">
                                Executed{" "}
                                {new Date(proposal.executedAt).toLocaleString()}
                              </p>
                            )}
                            <Link
                              href={`/admin/operations/${proposal.id}`}
                              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Execution Log{" "}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}