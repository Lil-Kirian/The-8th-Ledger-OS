"use client";

import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  TrendingUp,
  Clock,
  Shield,
  Briefcase,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Hammer,
  Plus,
  MessageSquare,
  Ban,
} from "lucide-react";
import { useForge, proposeHire } from "@/hooks/use-forge";
import { useState } from "react";

interface ForgeLedgerProps {
  hallId: string;
}

export default function ForgeLedgerDashboard({ hallId }: ForgeLedgerProps) {
  const { forge, isLoading, error, mutate } = useForge(hallId);
  const [showHireForm, setShowHireForm] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse text-slate-500">Loading Forge Ledger...</div>
      </div>
    );
  }

  if (error || !forge) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-slate-400">Failed to load Forge Ledger</p>
      </div>
    );
  }

  const { hall, workerRules, forgeLedgers, workers, staffingSummary, canProposeHire, showSalaries } = forge;

  const classConfig = {
    I: {
      label: "Class I — Passive",
      desc: "8th Ledger manages all staffing through contracted vendors. No hall workers.",
      color: "text-slate-400",
      bg: "bg-slate-900/50",
      border: "border-slate-800",
    },
    II: {
      label: "Class II — Managed",
      desc: "Hall approves operator staff levels. 8th Ledger hires through operator. No individual salaries visible.",
      color: "text-amber-400",
      bg: "bg-amber-950/20",
      border: "border-amber-900/50",
    },
    III: {
      label: "Class III — Active",
      desc: "Full hall governance over hiring, firing, and performance. Salaries visible.",
      color: "text-cyan-400",
      bg: "bg-cyan-950/20",
      border: "border-cyan-900/50",
    },
  };

  const config = classConfig[(hall.hallClass as "I" | "II" | "III") || "I"];

  const reserveMonths =
    staffingSummary.totalMonthlyPayroll > 0
      ? (hall.payrollReserve || 0) / staffingSummary.totalMonthlyPayroll
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Hammer className="w-6 h-6 text-cyan-400" />
            THE FORGE LEDGER
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Hall #{hallId} — Staffing & Payroll Command
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border ${config.border} ${config.bg}`}>
          <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
            {config.label}
          </span>
        </div>
      </motion.div>

      {/* Class Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-4 rounded-xl border ${config.border} ${config.bg} flex items-start gap-3`}
      >
        <Shield className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-slate-400">{config.desc}</p>
          {canProposeHire && (
            <button
              onClick={() => setShowHireForm(true)}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-950/50 border border-cyan-800 text-cyan-400 text-xs font-medium hover:bg-cyan-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Propose New Hire
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Workers"
          value={staffingSummary.activeWorkers.toString()}
          sub={`${staffingSummary.probationWorkers} on probation`}
          color="cyan"
          delay={0.2}
        />
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Monthly Payroll"
          value={`$${staffingSummary.totalMonthlyPayroll.toLocaleString()}`}
          sub="8th Ledger executes"
          color="amber"
          delay={0.3}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Reserve Coverage"
          value={`${reserveMonths.toFixed(1)} mo`}
          sub={`$${(hall.payrollReserve || 0).toLocaleString()} reserve`}
          color="emerald"
          delay={0.4}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Reviews Due"
          value={staffingSummary.nextReviewDue.toString()}
          sub={`Avg score: ${staffingSummary.avgPerformanceScore}/100`}
          color="slate"
          delay={0.5}
        />
      </div>

      {/* Workers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            Worker Roster
          </h3>
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            {workers.length} total
          </span>
        </div>
        <div className="divide-y divide-slate-800/50">
          {workers.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No workers assigned to this hall.</p>
              {canProposeHire && (
                <p className="text-slate-600 text-xs mt-2">
                  Propose a hire through the Sovereign Stream.
                </p>
              )}
            </div>
          ) : (
            workers.map((worker, i) => (
              <WorkerRow key={worker.id} worker={worker} index={i} showSalary={showSalaries} hallId={hallId} />
            ))
          )}
        </div>
      </motion.div>

      {/* Ledger History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Payroll History
          </h3>
        </div>
        <div className="divide-y divide-slate-800/50">
          {forgeLedgers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No payroll records yet.
            </div>
          ) : (
            forgeLedgers.slice(0, 6).map((ledger, i) => (
              <LedgerRow key={`${ledger.month}-${i}`} ledger={ledger} index={i} />
            ))
          )}
        </div>
      </motion.div>

      {/* Hire Proposal Modal Placeholder */}
      {showHireForm && (
        <HireProposalModal
          hallId={hallId}
          onClose={() => setShowHireForm(false)}
          onSubmit={async (payload) => {
            await proposeHire(hallId, payload);
            setShowHireForm(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "cyan" | "amber" | "emerald" | "slate";
  delay: number;
}) {
  const colors = {
    cyan: "bg-cyan-950/30 border-cyan-900/50 text-cyan-400",
    amber: "bg-amber-950/30 border-amber-900/50 text-amber-400",
    emerald: "bg-emerald-950/30 border-emerald-900/50 text-emerald-400",
    slate: "bg-slate-900/50 border-slate-800 text-slate-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className={`p-4 rounded-xl border ${colors[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-2 opacity-80">{icon}</div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider mt-1 opacity-90">
        {label}
      </div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </motion.div>
  );
}

function WorkerRow({
  worker,
  index,
  showSalary,
  hallId,
}: {
  worker: unknown;
  index: number;
  showSalary: boolean;
  hallId: string;
}) {
  const statusColors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-950/30 border-emerald-900/50",
    probation: "text-amber-400 bg-amber-950/30 border-amber-900/50",
    terminated: "text-red-400 bg-red-950/30 border-red-900/50",
    suspended: "text-slate-400 bg-slate-900/50 border-slate-800",
  };

  const statusKey = worker.status.toLowerCase();
  const statusStyle = statusColors[statusKey] || statusColors.suspended;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-mono text-xs">
          {worker.workerNumber}
        </div>
        <div>
          <div className="text-sm font-medium text-slate-200">{worker.role}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Hired {new Date(worker.hiredAt).toLocaleDateString()} • {worker.contractMonths}mo contract
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          {showSalary && (
            <div className="text-sm font-semibold text-slate-200">
              ${worker.salary.toLocaleString()}/mo
            </div>
          )}
          <div className="text-xs text-slate-500">Performance: {worker.performanceScore}/100</div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusStyle}`}
        >
          {worker.status}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors"
            title="View Relay"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

function LedgerRow({ ledger, index }: { ledger: unknown; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 * index }}
      className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-slate-300 font-mono">{ledger.month}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-sm text-slate-400">
          {ledger.workerCount} workers
        </span>
        <span className="text-sm font-semibold text-slate-200">
          ${ledger.totalPayroll.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HIRE PROPOSAL MODAL
   ============================================================ */

function HireProposalModal({
  hallId,
  onClose,
  onSubmit,
}: {
  hallId: string;
  onClose: () => void;
  onSubmit: (payload: unknown) => void;
}) {
  const [role, setRole] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [contractMonths, setContractMonths] = useState("12");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Propose New Hire</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <Ban className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 uppercase">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. Farm Manager"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Responsibilities</label>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              rows={3}
              placeholder="Describe duties and expectations"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Salary Min ($/mo)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Salary Max ($/mo)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Expected Outcome</label>
            <input
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              placeholder="e.g. Yield +20%, waste -15%"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Contract (months)</label>
            <input
              type="number"
              value={contractMonths}
              onChange={(e) => setContractMonths(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            />
          </div>
        </div>

        <button
          onClick={() =>
            onSubmit({
              role,
              responsibilities,
              salaryRange: [parseInt(salaryMin), parseInt(salaryMax)],
              expectedOutcome,
              contractMonths: parseInt(contractMonths),
            })
          }
          disabled={!role || !responsibilities || !salaryMin || !salaryMax}
          className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm transition-colors"
        >
          Submit Hire Proposal
        </button>
      </motion.div>
    </div>
  );
}