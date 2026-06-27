"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  DollarSign,
  Calendar,
  Hash,
  TrendingUp,
  Shield,
  ImageIcon,
  FileText,
  X,
  ChevronRight,
  Minus,
  Save,
  Printer,
  Download,
  Package,
  Hammer,
  PiggyBank,
  Siren,
} from "lucide-react";

type ProposalStatus = "passed" | "executing" | "completed" | "cancelled";

interface ExecutionLog {
  id: string;
  status: string;
  cost: number | null;
  proofUrls: string[];
  notes: string | null;
  executedBy: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface ProposalDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  status: ProposalStatus;
  amount: number | null;
  executionCost: number | null;
  executionResult: string | null;
  voteWeightYes: number;
  voteWeightNo: number;
  voteCountYes: number;
  voteCountNo: number;
  thresholdPercent: number;
  yesPercent: number;
  endsAt: string;
  executedAt: string | null;
  hallId: string | null;
  hallName: string;
  vertical: string;
  proposer: { displayName: string; ledgerId: string };
  createdAt: string;
  proofUrls: string[];
  executionLogs?: ExecutionLog[];
}

const STATUS_CONFIG: Record<
  ProposalStatus,
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

export default function OperationDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [result, setResult] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  /* ─── Fetch ─── */
  useEffect(() => {
    let cancelled = false;
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/admin/operations?id=${proposalId}&limit=1`
        );
        const data = await res.json();
        if (!cancelled && data.success && data.proposals?.[0]) {
          const p = data.proposals[0];

          // Parse executionLogs proofUrls from JSON strings
          const logs = (p.executionLogs || []).map((log: unknown) => ({
            ...log,
            proofUrls: log.proofUrls
              ? (() => {
                  try {
                    return JSON.parse(log.proofUrls);
                  } catch {
                    return [];
                  }
                })()
              : [],
          }));

          setProposal({ ...p, executionLogs: logs });
          if (p.executionResult) setResult(p.executionResult);
          if (p.executionCost) setActualCost(String(p.executionCost));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  /* ─── Budget Calculations ─── */
  const budgetAmount = proposal?.amount || 0;
  const actualCostNum = useMemo(() => Number(actualCost) || 0, [actualCost]);
  const variance = useMemo(
    () => actualCostNum - budgetAmount,
    [actualCostNum, budgetAmount]
  );
  const variancePct = useMemo(
    () => (budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0),
    [variance, budgetAmount]
  );
  const overBudget = useMemo(
    () => variance > budgetAmount * 0.2,
    [variance, budgetAmount]
  );

  /* ─── Upload ─── */
  const handleFileUpload = async (
    type: "before" | "after" | "invoice" | "certificate",
    files: FileList | null
  ) => {
    if (!files) return;
    setUploading((prev) => ({ ...prev, [type]: true }));
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      urls.push(dataUrl);
    }
    if (type === "before") setBeforePhotos((prev) => [...prev, ...urls]);
    if (type === "after") setAfterPhotos((prev) => [...prev, ...urls]);
    if (type === "invoice") setInvoices((prev) => [...prev, ...urls]);
    if (type === "certificate") setCertificates((prev) => [...prev, ...urls]);
    setUploading((prev) => ({ ...prev, [type]: false }));
  };

  const removePhoto = (
    type: "before" | "after" | "invoice" | "certificate",
    index: number
  ) => {
    const setter =
      type === "before"
        ? setBeforePhotos
        : type === "after"
          ? setAfterPhotos
          : type === "invoice"
            ? setInvoices
            : setCertificates;
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  /* ─── Actions ─── */
  async function handleStart() {
    if (!proposal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", proposalId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Execution started");
        setProposal((prev) => (prev ? { ...prev, status: "executing" } : null));
      } else {
        setMessage(data.error || "Failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!proposal) return;
    if (!result || result.length < 5) {
      setMessage("Execution result required (min 5 chars)");
      return;
    }

    const allProofs = [
      ...beforePhotos,
      ...afterPhotos,
      ...invoices,
      ...certificates,
    ];

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          proposalId,
          executionResult: result,
          executionCost: actualCost ? Number(actualCost) : null,
          proofUrls: allProofs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Execution completed and archived");
        setProposal((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                executionResult: result,
                executionCost: actualCost ? Number(actualCost) : null,
              }
            : null
        );
      } else {
        setMessage(data.error || "Failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  /* ─── Render ─── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ClipboardCheck className="h-12 w-12 text-white/10" />
        <p className="mt-4 text-sm text-slate-500">Operation not found</p>
        <Link
          href="/admin/operations"
          className="mt-4 text-xs text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Operations
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[proposal.status];
  const StatusIcon = statusCfg.icon;

  // PHASE 4: Operation type indicators
  const isInventoryOp = proposal.type === "inventory_enable" || proposal.type === "inventory_list";
  const isForgeOp = proposal.type === "forge_enable" || proposal.type === "hire" || proposal.type === "fire";
  const isIhcpOp = proposal.type === "ihcp_create";
  const isClosureOp = proposal.type === "closure" || proposal.type === "liquidation";

  // Gather all proof URLs for gallery
  const archivedProofs =
    proposal.executionLogs?.flatMap((log) => log.proofUrls || []) || [];
  const allProofs = [
    ...archivedProofs,
    ...beforePhotos,
    ...afterPhotos,
    ...invoices,
    ...certificates,
  ];

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-[11px] text-slate-500">
        <Link
          href="/admin"
          className="hover:text-slate-300 transition-colors"
        >
          Admin
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/admin/operations"
          className="hover:text-slate-300 transition-colors"
        >
          Operations
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-300">#{proposalId.slice(-6)}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[proposal.type]}`}
            >
              {TYPE_LABELS[proposal.type] || proposal.type}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}
            >
              <StatusIcon
                className={`h-3 w-3 ${proposal.status === "executing" ? "animate-spin" : ""}`}
              />
              {statusCfg.label}
            </span>

            {/* PHASE 4: Operation badges */}
            {isInventoryOp && (
              <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-400">
                <Package className="h-3 w-3" /> Inventory Op
              </span>
            )}
            {isForgeOp && (
              <span className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-400">
                <Hammer className="h-3 w-3" /> Forge Op
              </span>
            )}
            {isIhcpOp && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
                <PiggyBank className="h-3 w-3" /> IHCP
              </span>
            )}
            {isClosureOp && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-400">
                <Siren className="h-3 w-3" /> Closure
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {proposal.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" /> {proposal.id.slice(-8)}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> {proposal.hallName}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {proposal.vertical}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{" "}
              {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            onClick={() => {
              const csv = `ID,Title,Type,Status,Amount,Execution Cost,Result\n${proposal.id},"${proposal.title}",${proposal.type},${proposal.status},${proposal.amount || 0},${proposal.executionCost || 0},"${proposal.executionResult || ""}"`;
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `operation-${proposal.id.slice(-6)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* PHASE 4: IHCP Info Banner */}
      {isIhcpOp && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4"
        >
          <div className="flex items-center gap-3">
            <PiggyBank className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-emerald-400">Internal Hall Contribution Pool</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                5% priority return. Repaid from revenue before dividends. Hall must vote 51% to create. Admin executes once passed.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* PHASE 4: Closure Warning Banner */}
      {isClosureOp && proposal.status === "passed" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4"
        >
          <div className="flex items-center gap-3">
            <Siren className="h-5 w-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-rose-400">Closure Protocol Execution</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                This triggers asset liquidation, worker severance, and payout distribution. Irreversible. Ensure all PIR debts and payroll are settled first.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs ${
              message.includes("completed") || message.includes("started")
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {message.includes("completed") || message.includes("started") ? (
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Proposal Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md"
          >
            <h3 className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" /> Proposal Details
            </h3>
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
              {proposal.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[9px] uppercase text-slate-500">
                  Proposed By
                </p>
                <p className="mt-1 text-xs font-semibold text-white">
                  {proposal.proposer.displayName}
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
                  Approval
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-300">
                  {proposal.yesPercent.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[9px] uppercase text-slate-500">
                  Total Votes
                </p>
                <p className="mt-1 text-xs font-semibold text-white">
                  {proposal.voteCountYes + proposal.voteCountNo}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Execution Form */}
          {proposal.status !== "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-950/10 via-[#0a0a14]/60 to-transparent p-6 backdrop-blur-md"
            >
              <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-cyan-400" />{" "}
                Execution Form
              </h3>

              {/* Result */}
              <div className="mb-4 space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Execution Result
                </label>
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] resize-none"
                  placeholder="Detailed description of work completed, outcomes, and deliverables..."
                />
              </div>

              {/* Cost Tracker */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" /> Actual Cost (USD)
                  </label>
                  {budgetAmount > 0 && (
                    <span className="text-[10px] text-slate-500">
                      Budget: ${budgetAmount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-white/20" />
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] sm:w-64"
                    placeholder="0.00"
                  />
                </div>
                {actualCostNum > 0 && budgetAmount > 0 && (
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                      overBudget
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        : variance > 0
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {overBudget ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : variance > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                    {overBudget
                      ? `Over budget by ${variancePct.toFixed(1)}%. Admin override may be required.`
                      : variance > 0
                        ? `Over budget by $${variance.toFixed(2)} (${variancePct.toFixed(1)}%)`
                        : variance < 0
                          ? `Under budget by $${Math.abs(variance).toFixed(2)}`
                          : "On budget"}
                  </div>
                )}
              </div>

              {/* Upload Grid */}
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    key: "before",
                    label: "Before Photos",
                    icon: ImageIcon,
                    state: beforePhotos,
                  },
                  {
                    key: "after",
                    label: "After Photos",
                    icon: ImageIcon,
                    state: afterPhotos,
                  },
                  {
                    key: "invoice",
                    label: "Invoices",
                    icon: FileText,
                    state: invoices,
                  },
                  {
                    key: "certificate",
                    label: "Certificates",
                    icon: Shield,
                    state: certificates,
                  },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      {field.label}
                    </label>
                    <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-4 hover:border-white/20 transition-all">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(
                            field.key as unknown,
                            e.target.files
                          )
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      <field.icon className="h-4 w-4 text-slate-500 mb-1" />
                      <span className="text-[10px] text-slate-400">
                        Drop {field.key.replace("_", " ")}
                      </span>
                      {uploading[field.key] && (
                        <Loader2 className="mt-2 h-3 w-3 animate-spin text-cyan-400" />
                      )}
                    </div>
                    {field.state.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {field.state.map((img, i) => (
                          <div
                            key={i}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-white/5"
                          >
                            <img
                              src={img}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              onClick={() =>
                                removePhoto(field.key as unknown, i)
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
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                {proposal.status === "passed" && (
                  <button
                    onClick={handleStart}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-3 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start Execution
                  </button>
                )}

                {proposal.status === "executing" && (
                  <button
                    onClick={handleComplete}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Mark Complete & Archive
                  </button>
                )}

                <Link
                  href="/admin/operations"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Link>
              </div>
            </motion.div>
          )}

          {/* Completed Result */}
          {proposal.status === "completed" && proposal.executionResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-950/[0.06] p-6 backdrop-blur-md"
            >
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Execution Result
              </div>
              <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                {proposal.executionResult}
              </p>
              {proposal.executedAt && (
                <p className="mt-3 text-[10px] text-slate-500">
                  Completed{" "}
                  {new Date(proposal.executedAt).toLocaleString()}
                </p>
              )}
            </motion.div>
          )}

          {/* Proof Gallery */}
          {allProofs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md"
            >
              <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-amber-400" /> Proof
                Gallery
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {archivedProofs.map((url, i) => (
                  <div
                    key={`log-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/5"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-2">
                      <span className="text-[9px] text-white/70">
                        Archived
                      </span>
                    </div>
                  </div>
                ))}
                {beforePhotos.map((img, i) => (
                  <div
                    key={`before-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/5"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70">
                      Before
                    </div>
                  </div>
                ))}
                {afterPhotos.map((img, i) => (
                  <div
                    key={`after-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/5"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70">
                      After
                    </div>
                  </div>
                ))}
                {invoices.map((img, i) => (
                  <div
                    key={`inv-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/5"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70">
                      Invoice
                    </div>
                  </div>
                ))}
                {certificates.map((img, i) => (
                  <div
                    key={`cert-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/5"
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70">
                      Cert
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-md"
          >
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Timeline
            </h3>
            <div className="space-y-4">
              {[
                {
                  stage: "Proposed",
                  date: proposal.createdAt,
                  completed: true,
                },
                {
                  stage: "Voted",
                  date: proposal.endsAt,
                  completed: true,
                },
                {
                  stage: "Passed",
                  date: proposal.endsAt,
                  completed: proposal.status !== "active",
                },
                {
                  stage: "8th Ledger Review",
                  date: proposal.executionLogs?.[0]?.createdAt,
                  completed: ["executing", "completed", "cancelled"].includes(
                    proposal.status
                  ),
                },
                {
                  stage: "In Progress",
                  date: proposal.executionLogs?.find(
                    (l) => l.status === "in_progress"
                  )?.createdAt,
                  completed: ["executing", "completed"].includes(
                    proposal.status
                  ),
                },
                {
                  stage: "Completed",
                  date: proposal.executedAt,
                  completed: proposal.status === "completed",
                },
              ].map((step, i, arr) => (
                <div key={i} className="relative flex gap-3">
                  {i < arr.length - 1 && (
                    <div
                      className={`absolute left-[7px] top-6 h-full w-px ${step.completed ? "bg-emerald-500/30" : "bg-white/5"}`}
                    />
                  )}
                  <div
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                      step.completed
                        ? "border-emerald-500/50 bg-emerald-500/20"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    {step.completed && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-medium ${step.completed ? "text-white" : "text-slate-500"}`}
                    >
                      {step.stage}
                    </p>
                    {step.date && (
                      <p className="text-[10px] text-slate-600">
                        {new Date(step.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Budget Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-md"
          >
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" /> Cost Tracker
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Approved Budget
                </span>
                <span className="text-sm font-bold text-white">
                  ${budgetAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Actual Cost
                </span>
                <span
                  className={`text-sm font-bold ${actualCostNum > budgetAmount ? "text-rose-400" : "text-emerald-400"}`}
                >
                  ${actualCostNum.toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Variance</span>
                <span
                  className={`text-xs font-bold ${
                    variance > 0
                      ? "text-rose-400"
                      : variance < 0
                        ? "text-emerald-400"
                        : "text-slate-400"
                  }`}
                >
                  {variance > 0 ? "+" : ""}${variance.toLocaleString()} (
                  {variancePct > 0 ? "+" : ""}
                  {variancePct.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {budgetAmount > 0 && (
              <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all ${actualCostNum > budgetAmount ? "bg-rose-500" : "bg-emerald-500"}`}
                  style={{
                    width: `${Math.min((actualCostNum / budgetAmount) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Execution Logs */}
          {proposal.executionLogs && proposal.executionLogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-md"
            >
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ClipboardCheck className="h-3.5 w-3.5" /> Execution Log
              </h3>
              <div className="space-y-3">
                {proposal.executionLogs.map((log, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          log.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : log.status === "in_progress"
                              ? "bg-cyan-500/10 text-cyan-400"
                              : "bg-white/5 text-slate-400"
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-[9px] text-slate-600">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {log.notes || "No notes recorded."}
                    </p>
                    {log.cost && (
                      <p className="mt-1 text-[10px] text-amber-400">
                        Cost: ${log.cost.toLocaleString()}
                      </p>
                    )}
                    {log.proofUrls.length > 0 && (
                      <p className="mt-1 text-[9px] text-slate-500">
                        {log.proofUrls.length} proof items
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}