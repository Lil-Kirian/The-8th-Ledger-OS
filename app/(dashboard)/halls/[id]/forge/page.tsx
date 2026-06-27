"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Wallet,
  Briefcase,
  MessageSquare,
  DollarSign,
  Plus,
  X,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  FileText,
  Ban,
  Star,
  Hammer,
  ArrowRight,
  Info,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "overview" | "workers" | "payroll" | "proposals" | "relay";

interface Worker {
  id: string;
  workerNumber: string;
  role: string;
  salary: number;
  contractMonths: number;
  hiredAt: string;
  status: "active" | "probation" | "terminated";
  performanceScore: number;
  terminationReason?: string;
  terminatedAt?: string;
}

interface ForgeLedgerEntry {
  month: string;
  totalPayroll: number;
  workerCount: number;
  entries: string;
}

interface PayrollRecord {
  id: string;
  workerId: string;
  workerNumber: string;
  role: string;
  amount: number;
  period: string;
  paidAt: string;
  status: "pending" | "paid" | "failed";
}

interface Proposal {
  id: string;
  type: "hire" | "fire" | "review";
  title: string;
  description: string;
  proposedBy: string;
  status: "pending" | "passed" | "rejected" | "executing" | "completed";
  voteCountYes: number;
  voteCountNo: number;
  createdAt: string;
  targetWorkerId?: string;
}

interface RelayMessage {
  id: string;
  direction: "hall_to_worker" | "worker_to_hall";
  content: string;
  relayedAt: string;
  status: "relayed" | "delivered" | "read";
  workerNumber: string;
}

interface ForgeData {
  hallId: string;
  hallName: string;
  hallClass: string;
  workers: Worker[];
  payrollHistory: ForgeLedgerEntry[];
  recentPayrolls: PayrollRecord[];
  proposals: Proposal[];
  relayMessages: RelayMessage[];
  totalPayrollYtd: number;
  activeWorkerCount: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
    case "passed":
    case "paid":
    case "delivered":
      return "text-emerald-400 bg-emerald-950/20 border-emerald-900/50";
    case "probation":
    case "pending":
      return "text-amber-400 bg-amber-950/20 border-amber-900/50";
    case "terminated":
    case "rejected":
    case "failed":
    case "fire":
      return "text-red-400 bg-red-950/20 border-red-900/50";
    case "read":
      return "text-cyan-400 bg-cyan-950/20 border-cyan-900/50";
    default:
      return "text-slate-400 bg-slate-800/50 border-slate-700";
  }
}

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/* ============================================================
   FORGE DISABLED VIEW — PHASE 4: Universal Operations
   ============================================================ */
function ForgeDisabledView({
  hallId,
  hallName,
  hallClass,
}: {
  hallId: string;
  hallName?: string;
  hallClass?: string;
}) {
  const router = useRouter();
  const [isProposing, setIsProposing] = useState(false);
  const [proposalSent, setProposalSent] = useState(false);

  const handleProposeEnable = async () => {
    setIsProposing(true);
    try {
      const res = await fetch(`/api/halls/${hallId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Enable the Forge",
          description: `Proposal to enable worker management (the Forge) for this hall. Once enabled, the hall can hire workers, manage payroll, and use the 8th Ledger Relay. Workers are employed by the 8th Ledger, not the hall. All hiring requires hall votes. 51% approval required.`,
          type: "forge_enable",
        }),
      });
      if (res.ok) {
        setProposalSent(true);
        setTimeout(() => {
          router.push(`/halls/${hallId}/sovereign-stream`);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProposing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Hammer className="h-8 w-8 text-slate-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-200 mb-2">
          The Forge is Not Enabled
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          {hallName
            ? `${hallName} does not have worker management enabled yet.`
            : "This hall does not have worker management enabled yet."}{" "}
          The Forge lets halls hire workers, manage payroll, and communicate
          through the 8th Ledger Relay.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-left">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
            <Users className="h-5 w-5 text-cyan-400 mb-2" />
            <p className="text-xs font-bold text-slate-200">Hire Workers</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Propose roles, approve candidates, review performance
            </p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
            <Wallet className="h-5 w-5 text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-slate-200">Payroll</p>
            <p className="text-[10px] text-slate-500 mt-1">
              8th Ledger executes payroll. Hall sees cost impact only
            </p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
            <MessageSquare className="h-5 w-5 text-violet-400 mb-2" />
            <p className="text-xs font-bold text-slate-200">8th Ledger Relay</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Communicate with workers without exposing hall internals
            </p>
          </div>
        </div>

        {proposalSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-400">
              Proposal Submitted
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Redirecting to Sovereign Stream...
            </p>
          </motion.div>
        ) : (
          <button
            onClick={handleProposeEnable}
            disabled={isProposing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 rounded-xl text-slate-950 text-sm font-bold transition-colors"
          >
            {isProposing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Hammer className="h-4 w-4" />
                Propose Enable Forge
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}

        <p className="text-[10px] text-slate-600 mt-4">
          Requires 51% hall vote. Default class: {hallClass || "I"}.
        </p>
      </motion.div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-400 mb-1">
              How the Forge Works
            </p>
            <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
              <li>Hall proposes a hire → 8th Ledger recruits → Hall approves candidate</li>
              <li>Workers are 8th Ledger employees, assigned to hall assets</li>
              <li>Hall never sees salaries, bank details, or personal data</li>
              <li>All communication goes through 8th Ledger Relay</li>
              <li>Payroll is a pre-dividend expense executed by the 8th Ledger</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN FORGE PAGE
   ============================================================ */
export default function ForgePage() {
  const params = useParams();
  const hallId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showHireForm, setShowHireForm] = useState(false);
  const [showRelayForm, setShowRelayForm] = useState(false);
  const [relayMessage, setRelayMessage] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PHASE 4: Check if forge is enabled for this hall
  const { data: hallCheck, isLoading: hallCheckLoading } = useSWR<{
    hall?: {
      forgeEnabled?: boolean;
      name?: string;
      hallClass?: string;
    };
  }>(`/api/halls/${hallId}`, fetcher);

  const forgeEnabled = hallCheck?.hall?.forgeEnabled ?? false;

  // Only fetch forge data if enabled
  const { data, error, isLoading, mutate } = useSWR<ForgeData>(
    forgeEnabled ? `/api/halls/${hallId}/forge` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const handleProposeHire = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      role: form.get("role") as string,
      salary: Number(form.get("salary")),
      contractMonths: Number(form.get("contractMonths")),
      responsibilities: form.get("responsibilities") as string,
      expectedOutcome: form.get("expectedOutcome") as string,
    };

    try {
      const res = await fetch(`/api/halls/${hallId}/forge/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowHireForm(false);
        await mutate();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relayMessage.trim() || !selectedWorker) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/halls/${hallId}/forge/workers/${selectedWorker}/relay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: relayMessage.trim() }),
        }
      );
      if (res.ok) {
        setRelayMessage("");
        setShowRelayForm(false);
        await mutate();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // PHASE 4: Loading state while checking hall permissions
  if (hallCheckLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // PHASE 4: Forge not enabled — show enable CTA
  if (!forgeEnabled) {
    return (
      <ForgeDisabledView
        hallId={hallId}
        hallName={hallCheck?.hall?.name}
        hallClass={hallCheck?.hall?.hallClass}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-red-400">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Failed to load Forge Ledger
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Zap className="w-4 h-4" /> },
    { key: "workers", label: "Workers", icon: <Users className="w-4 h-4" /> },
    { key: "payroll", label: "Payroll", icon: <Wallet className="w-4 h-4" /> },
    { key: "proposals", label: "Proposals", icon: <FileText className="w-4 h-4" /> },
    { key: "relay", label: "8th Ledger Relay", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500">
              #{data.hallId}
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-cyan-400">
              Class {data.hallClass}
            </span>
            {/* PHASE 4: Forge enabled badge */}
            <span className="text-[10px] text-orange-400 border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 rounded">
              Forge On
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-cyan-400" />
            The Forge Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {data.hallName} — Staffing, Payroll & Worker Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">YTD Payroll</div>
            <div className="text-lg font-bold text-slate-100">
              ${data.totalPayrollYtd.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Active Workers</div>
            <div className="text-lg font-bold text-slate-100">
              {data.activeWorkerCount}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-cyan-950/30 text-cyan-400 border border-cyan-900/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-bold text-slate-200">
                      Worker Roster
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-100">
                    {data.workers.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {data.workers.filter((w) => w.status === "active").length}{" "}
                    active,{" "}
                    {data.workers.filter((w) => w.status === "probation").length}{" "}
                    on probation
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-slate-200">
                      Monthly Payroll
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-100">
                    $
                    {data.workers
                      .filter((w) => w.status === "active")
                      .reduce((sum, w) => sum + w.salary, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Executed by 8th Ledger
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-slate-200">
                      Avg Performance
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-100">
                    {data.workers.length > 0
                      ? Math.round(
                          data.workers.reduce((s, w) => s + w.performanceScore, 0) /
                            data.workers.length
                        )
                      : 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Out of 100</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
                  Recent Proposals
                </h3>
                {data.proposals.length === 0 ? (
                  <p className="text-sm text-slate-500">No active proposals</p>
                ) : (
                  <div className="space-y-3">
                    {data.proposals.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(
                                p.type
                              )}`}
                            >
                              {p.type}
                            </span>
                            <span className="text-sm text-slate-200">
                              {p.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {p.voteCountYes} yes / {p.voteCountNo} no
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold uppercase px-2 py-1 rounded border ${getStatusColor(
                            p.status
                          )}`}
                        >
                          {getStatusLabel(p.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WORKERS */}
          {activeTab === "workers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200">
                  Active Workers
                </h2>
                <button
                  onClick={() => setShowHireForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-cyan-400 text-sm font-bold hover:bg-cyan-950/50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Propose Hire
                </button>
              </div>

              {showHireForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleProposeHire}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">
                      Propose New Hire
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowHireForm(false)}
                      className="p-1 hover:bg-slate-800 rounded"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">
                        Role
                      </label>
                      <input
                        name="role"
                        required
                        placeholder="e.g. Farm Manager"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">
                        Monthly Salary ($)
                      </label>
                      <input
                        name="salary"
                        type="number"
                        required
                        min={1}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">
                        Contract (months)
                      </label>
                      <input
                        name="contractMonths"
                        type="number"
                        required
                        min={1}
                        max={24}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-900 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">
                        Responsibilities
                      </label>
                      <textarea
                        name="responsibilities"
                        required
                        rows={2}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-900 focus:outline-none resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">
                        Expected Outcome
                      </label>
                      <textarea
                        name="expectedOutcome"
                        required
                        rows={2}
                        placeholder="e.g. Yield +20%, waste -15%"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-900 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 rounded-lg text-slate-950 text-sm font-bold transition-colors"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Proposal"}
                  </button>
                </motion.form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.workers.map((worker, i) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">
                            {worker.workerNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStatusColor(
                              worker.status
                            )}`}
                          >
                            {worker.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-200">
                          {worker.role}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-100">
                          ${worker.salary.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">/month</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Performance</span>
                        <span
                          className={`font-bold ${
                            worker.performanceScore >= 80
                              ? "text-emerald-400"
                              : worker.performanceScore >= 60
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {worker.performanceScore}/100
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            worker.performanceScore >= 80
                              ? "bg-emerald-500"
                              : worker.performanceScore >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${worker.performanceScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500">
                      <span>
                        Hired {new Date(worker.hiredAt).toLocaleDateString()}
                      </span>
                      <span>{worker.contractMonths} month contract</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* PAYROLL */}
          {activeTab === "payroll" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200">
                Payroll History
              </h2>
              {data.payrollHistory.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No payroll records yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.payrollHistory.map((entry) => (
                    <div
                      key={entry.month}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-bold text-slate-200">
                            {entry.month}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-100">
                            ${entry.totalPayroll.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {entry.workerCount} workers
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500/60 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (entry.totalPayroll / 10000) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent individual payrolls */}
              {data.recentPayrolls.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Recent Payments
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {data.recentPayrolls.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${getStatusColor(
                              p.status
                            )}`}
                          >
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-200">
                              {p.workerNumber} — {p.role}
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.period}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-100">
                            ${p.amount.toLocaleString()}
                          </p>
                          <p
                            className={`text-xs ${
                              p.status === "paid"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {getStatusLabel(p.status)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROPOSALS */}
          {activeTab === "proposals" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200">
                Worker Proposals
              </h2>
              {data.proposals.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No worker proposals active
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.proposals.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(
                              p.type
                            )}`}
                          >
                            {p.type}
                          </span>
                          <span
                            className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(
                              p.status
                            )}`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-200 mb-1">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {p.voteCountYes}
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <Ban className="w-3.5 h-3.5" />
                          {p.voteCountNo}
                        </div>
                        <span className="text-slate-600">
                          Proposed by {p.proposedBy}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RELAY */}
          {activeTab === "relay" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-200">
                    8th Ledger Relay
                  </h2>
                  <p className="text-xs text-slate-500">
                    All communication logged for audit. No direct messaging.
                  </p>
                </div>
                <button
                  onClick={() => setShowRelayForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-cyan-400 text-sm font-bold hover:bg-cyan-950/50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  New Message
                </button>
              </div>

              {showRelayForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  onSubmit={handleRelay}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">
                      Send via 8th Ledger Relay
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowRelayForm(false)}
                      className="p-1 hover:bg-slate-800 rounded"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <select
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-900 focus:outline-none"
                  >
                    <option value="">Select worker</option>
                    {data.workers
                      .filter((w) => w.status === "active")
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.workerNumber} — {w.role}
                        </option>
                      ))}
                  </select>
                  <textarea
                    value={relayMessage}
                    onChange={(e) => setRelayMessage(e.target.value)}
                    required
                    rows={3}
                    placeholder="Enter message for worker..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-cyan-900 focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 rounded-lg text-slate-950 text-sm font-bold transition-colors"
                  >
                    {isSubmitting ? "Relaying..." : "Relay Message"}
                  </button>
                </motion.form>
              )}

              {data.relayMessages.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-sm text-slate-500">No relay messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.relayMessages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex gap-3 p-4 rounded-xl border ${
                        msg.direction === "hall_to_worker"
                          ? "bg-cyan-950/10 border-cyan-900/30"
                          : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      <div
                        className={`shrink-0 p-2 rounded-lg h-fit ${
                          msg.direction === "hall_to_worker"
                            ? "bg-cyan-950/30 text-cyan-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {msg.direction === "hall_to_worker" ? (
                          <Send className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-300">
                            {msg.direction === "hall_to_worker"
                              ? "Hall → Worker"
                              : "Worker → Hall"}
                          </span>
                          <span className="text-xs text-slate-600">
                            {msg.workerNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStatusColor(
                              msg.status
                            )}`}
                          >
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 break-words">
                          {msg.content}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {new Date(msg.relayedAt).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}