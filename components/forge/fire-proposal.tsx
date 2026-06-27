"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  X,
  User,
  Calendar,
  DollarSign,
  Award,
} from "lucide-react";
import { buildTerminationProposal } from "@/lib/forge";

interface FireProposalProps {
  hallId: string;
  worker: {
    id: string;
    workerNumber: string;
    role: string;
    salary: number;
    hiredAt: string;
    performanceScore: number;
    status: string;
    lastReview?: {
      score: number;
      reviewedAt: string;
      reviewerId: string;
      improvementPlan?: string;
    } | null;
  };
  onSubmit: () => void;
  onCancel: () => void;
}

export interface FireProposalData {
  workerId: string;
  reason: string;
  terminationType: "immediate" | "thirty_day_notice" | "performance_plan";
  finalAssessment: string;
  hallImpact: string;
}

export default function FireProposalForm({
  hallId,
  worker,
  onSubmit,
  onCancel,
}: FireProposalProps) {
  const [data, setData] = useState<FireProposalData>({
    workerId: worker.id,
    reason: "",
    terminationType: "thirty_day_notice",
    finalAssessment: "",
    hallImpact: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenureMonths = Math.floor(
    (Date.now() - new Date(worker.hiredAt).getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  const severanceEstimate = Math.round(worker.salary * Math.max(1, tenureMonths / 12));

  const isValid =
    data.reason.trim().length >= 20 &&
    data.finalAssessment.trim().length >= 20 &&
    data.hallImpact.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Build proposal payload via lib/forge
      const proposalPayload = buildTerminationProposal({
        workerId: worker.id,
        workerNumber: worker.workerNumber,
        role: worker.role,
        performanceScore: worker.performanceScore,
        reason: data.reason,
        noticeDays: data.terminationType === "immediate" ? 0 : 30,
      });

      // Submit as proposal
      const res = await fetch(`/api/halls/${hallId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: proposalPayload.title,
          description: proposalPayload.description,
          type: "fire",
          targetUserId: worker.id,
          amount: severanceEstimate,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit termination proposal");

      onSubmit();
    } catch (err) {
      console.error("Fire proposal failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-w-2xl mx-auto shadow-2xl shadow-black/50"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-red-950/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Propose Termination
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hall #{hallId} — Worker {worker.workerNumber}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Worker Summary Card */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-200">{worker.role}</h3>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                    worker.status.toLowerCase() === "active"
                      ? "text-emerald-400 bg-emerald-950/30 border-emerald-900/50"
                      : worker.status.toLowerCase() === "probation"
                      ? "text-amber-400 bg-amber-950/30 border-amber-900/50"
                      : "text-slate-400 bg-slate-900/50 border-slate-800"
                  }`}
                >
                  {worker.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>${worker.salary.toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{tenureMonths} months</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Award className="w-3.5 h-3.5" />
                  <span>{worker.performanceScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Termination Type */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
            Termination Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              {
                key: "thirty_day_notice" as const,
                label: "30-Day Notice",
                desc: "Standard. 8th Ledger handles severance.",
                color: "amber",
              },
              {
                key: "performance_plan" as const,
                label: "Improvement Plan",
                desc: "30-day review period. Final chance.",
                color: "cyan",
              },
              {
                key: "immediate" as const,
                label: "Immediate",
                desc: "Gross misconduct. Full severance.",
                color: "red",
              },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setData((prev) => ({ ...prev, terminationType: opt.key }))}
                className={`p-3 rounded-lg border text-left transition-all ${
                  data.terminationType === opt.key
                    ? opt.color === "red"
                      ? "bg-red-950/30 border-red-900/50 text-red-400"
                      : opt.color === "amber"
                      ? "bg-amber-950/30 border-amber-900/50 text-amber-400"
                      : "bg-cyan-950/30 border-cyan-900/50 text-cyan-400"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs mt-1 opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Reason for Termination
          </label>
          <textarea
            value={data.reason}
            onChange={(e) => setData((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Be specific. Include performance metrics, incidents, or strategic changes..."
            rows={3}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all resize-none"
          />
        </div>

        {/* Final Assessment */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Final Performance Assessment
          </label>
          <textarea
            value={data.finalAssessment}
            onChange={(e) => setData((prev) => ({ ...prev, finalAssessment: e.target.value }))}
            placeholder="Summarize overall performance, achievements, and deficiencies..."
            rows={3}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all resize-none"
          />
        </div>

        {/* Hall Impact */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Impact on Hall Operations
          </label>
          <textarea
            value={data.hallImpact}
            onChange={(e) => setData((prev) => ({ ...prev, hallImpact: e.target.value }))}
            placeholder="How will this role be covered? What is the transition plan?..."
            rows={2}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all resize-none"
          />
        </div>

        {/* Severance Estimate */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-200">Estimated Severance</span>
          </div>
          <p className="text-sm text-slate-400">
            8th Ledger standard: 1 month salary per year of service.
          </p>
          <div className="mt-2 text-lg font-bold text-amber-400">
            ~${severanceEstimate.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Final amount calculated by 8th Ledger HR based on full tenure and contract terms.
          </p>
        </div>

        {/* Warning */}
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-400">This requires 51% hall approval</div>
            <p className="text-xs text-red-400/70 mt-1">
              All terminations are reviewed by 8th Ledger Legal. False claims or retaliatory proposals
              may result in governance suspension.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/30">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Submitting..." : "Submit Termination Proposal"}
        </button>
      </div>
    </motion.div>
  );
}