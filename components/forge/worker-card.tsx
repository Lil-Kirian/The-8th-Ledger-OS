"use client";

import { motion } from "framer-motion";
import {
  User,
  Calendar,
  DollarSign,
  Award,
  Clock,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface WorkerCardProps {
  worker: {
    id: string;
    workerNumber: string;
    role: string;
    salary?: number;
    contractMonths: number;
    hiredAt: string;
    status: string;
    performanceScore: number;
    lastReview?: {
      score: number;
      reviewedAt: string;
      reviewerId: string;
      improvementPlan?: string;
    } | null;
  };
  hallClass?: string | null;
  showSalary?: boolean;
  canMessage?: boolean;
  onMessage?: (workerId: string) => void;
  onReview?: (workerId: string) => void;
}

export default function WorkerCard({
  worker,
  hallClass,
  showSalary = false,
  canMessage = true,
  onMessage,
  onReview,
}: WorkerCardProps) {
  const contractProgress = Math.min(
    100,
    Math.round(
      ((Date.now() - new Date(worker.hiredAt).getTime()) /
        (worker.contractMonths * 30 * 24 * 60 * 60 * 1000)) *
        100
    )
  );

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    active: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "text-emerald-400 bg-emerald-950/30 border-emerald-900/50",
      label: "ACTIVE",
    },
    probation: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-amber-400 bg-amber-950/30 border-amber-900/50",
      label: "PROBATION",
    },
    terminated: {
      icon: <XCircle className="w-4 h-4" />,
      color: "text-red-400 bg-red-950/30 border-red-900/50",
      label: "TERMINATED",
    },
    suspended: {
      icon: <Clock className="w-4 h-4" />,
      color: "text-slate-400 bg-slate-900/50 border-slate-800",
      label: "SUSPENDED",
    },
  };

  const statusKey = worker.status.toLowerCase();
  const status = statusConfig[statusKey] || statusConfig.suspended;

  const isTerminated = worker.status.toLowerCase() === "terminated";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">{worker.role}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{worker.workerNumber}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${status.color}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {showSalary && worker.salary !== undefined && (
          <Metric
            icon={<DollarSign className="w-4 h-4" />}
            label="Salary"
            value={`$${worker.salary.toLocaleString()}/mo`}
          />
        )}
        <Metric
          icon={<Calendar className="w-4 h-4" />}
          label="Contract"
          value={`${worker.contractMonths} months`}
        />
        <Metric
          icon={<Award className="w-4 h-4" />}
          label="Performance"
          value={`${worker.performanceScore}/100`}
          highlight={worker.performanceScore >= 80}
        />
        <Metric
          icon={<Clock className="w-4 h-4" />}
          label="Hired"
          value={new Date(worker.hiredAt).toLocaleDateString()}
        />
      </div>

      {/* Contract Bar */}
      <div className="px-5 pb-2">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Contract progress</span>
          <span>{contractProgress}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${contractProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              contractProgress > 80 ? "bg-amber-500" : "bg-cyan-500"
            }`}
          />
        </div>
      </div>

      {/* Latest Performance */}
      {worker.lastReview && (
        <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Latest Review
            </span>
            <span className="text-xs text-slate-600 ml-auto">
              {new Date(worker.lastReview.reviewedAt).toLocaleDateString()}
            </span>
          </div>
          {worker.lastReview.improvementPlan && (
            <p className="text-sm text-slate-400 line-clamp-2">{worker.lastReview.improvementPlan}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-500">Score:</span>
            <span
              className={`text-xs font-semibold ${
                worker.lastReview.score >= 80
                  ? "text-emerald-400"
                  : worker.lastReview.score >= 60
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {worker.lastReview.score}/100
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isTerminated && (
        <div className="p-3 border-t border-slate-800/50 flex gap-2">
          {onReview && (
            <button
              onClick={() => onReview(worker.id)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Award className="w-3.5 h-3.5" />
              Review
            </button>
          )}
          {canMessage && onMessage && (
            <button
              onClick={() => onMessage(worker.id)}
              className="flex-1 px-3 py-2 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Relay
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Metric({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`mt-0.5 ${highlight ? "text-emerald-400" : "text-slate-500"}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-semibold mt-0.5 ${highlight ? "text-emerald-400" : "text-slate-200"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}