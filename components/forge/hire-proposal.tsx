"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  Clock,
  Target,
  FileText,
  Send,
  X,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { proposeHire } from "@/hooks/use-forge";

interface HireProposalProps {
  hallId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface HireProposalData {
  role: string;
  responsibilities: string;
  salaryRange: [number, number];
  contractMonths: number;
  expectedOutcome: string;
  justification: string;
  fundingSource: "forge_mini_pool" | "pir_advance" | "treasury";
}

const ROLE_TEMPLATES = [
  { role: "Farm Manager", benchmark: [1200, 1800] },
  { role: "Field Supervisor", benchmark: [800, 1200] },
  { role: "Equipment Operator", benchmark: [600, 900] },
  { role: "Sales Representative", benchmark: [700, 1100] },
  { role: "Chef / Cook", benchmark: [800, 1400] },
  { role: "Operations Lead", benchmark: [1500, 2500] },
  { role: "Clinic Manager", benchmark: [1400, 2200] },
  { role: "Charter Coordinator", benchmark: [1000, 1600] },
  { role: "Maintenance Technician", benchmark: [900, 1400] },
  { role: "Security Guard", benchmark: [500, 800] },
];

export default function HireProposalForm({
  hallId,
  onSubmit,
  onCancel,
}: HireProposalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<HireProposalData>({
    role: "",
    responsibilities: "",
    salaryRange: [0, 0],
    contractMonths: 12,
    expectedOutcome: "",
    justification: "",
    fundingSource: "forge_mini_pool",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyTemplate = (template: (typeof ROLE_TEMPLATES)[0]) => {
    setSelectedTemplate(template.role);
    setData((prev) => ({
      ...prev,
      role: template.role,
      salaryRange: [template.benchmark[0], template.benchmark[1]],
    }));
    setShowTemplates(false);
  };

  const isStep1Valid = data.role.trim().length >= 3 && data.responsibilities.trim().length >= 20;
  const isStep2Valid = data.salaryRange[0] > 0 && data.salaryRange[1] > data.salaryRange[0] && data.contractMonths >= 1;
  const isStep3Valid = data.expectedOutcome.trim().length >= 20 && data.justification.trim().length >= 20;

  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) return;

    setIsSubmitting(true);
    try {
      await proposeHire(hallId, {
        role: data.role,
        responsibilities: data.responsibilities,
        salaryRange: data.salaryRange,
        expectedOutcome: data.expectedOutcome,
        contractMonths: data.contractMonths,
        fundingSource: data.fundingSource,
      });
      onSubmit();
    } catch (err) {
      console.error("Hire proposal failed:", err);
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
      <div className="p-6 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              Propose a Hire
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hall #{hallId} — Forge Ledger Proposal
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s
                    ? "bg-cyan-950/50 text-cyan-400 border border-cyan-900/50"
                    : "bg-slate-900 text-slate-600 border border-slate-800"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <div className="flex-1 h-px bg-slate-800">
                {s < 3 && (
                  <div
                    className={`h-full transition-all ${
                      step > s ? "bg-cyan-900/50" : "bg-slate-800"
                    }`}
                    style={{ width: step > s ? "100%" : "0%" }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Role & Scope</span>
          <span>Compensation</span>
          <span>Justification</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Role Templates */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Role Title
                </label>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 hover:border-slate-700 transition-colors"
                >
                  <span className={data.role ? "text-slate-200" : "text-slate-600"}>
                    {data.role || "Select a role template or type custom..."}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showTemplates && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto">
                        {ROLE_TEMPLATES.map((t) => (
                          <button
                            key={t.role}
                            onClick={() => applyTemplate(t)}
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-800 transition-colors flex items-center justify-between ${
                              selectedTemplate === t.role ? "bg-cyan-950/20 text-cyan-400" : "text-slate-300"
                            }`}
                          >
                            <span>{t.role}</span>
                            <span className="text-xs text-slate-500">
                              ${t.benchmark[0]}-${t.benchmark[1]}/mo
                            </span>
                          </button>
                        ))}
                        <div className="px-4 py-2 text-xs text-slate-600 border-t border-slate-800">
                          Or type a custom role below
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  type="text"
                  value={data.role}
                  onChange={(e) => {
                    setData((prev) => ({ ...prev, role: e.target.value }));
                    setSelectedTemplate(null);
                  }}
                  placeholder="Custom role title..."
                  className="w-full mt-2 p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all"
                />
              </div>

              {/* Responsibilities */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Responsibilities
                </label>
                <textarea
                  value={data.responsibilities}
                  onChange={(e) => setData((prev) => ({ ...prev, responsibilities: e.target.value }))}
                  placeholder="Describe day-to-day duties, reporting structure, and key deliverables..."
                  rows={4}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all resize-none"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-600">
                    {data.responsibilities.length} chars
                  </span>
                  <span className="text-xs text-slate-600">Min 20 characters</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Salary Min ($/mo)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={data.salaryRange[0] || ""}
                      onChange={(e) => setData((prev) => ({
                        ...prev,
                        salaryRange: [Number(e.target.value), prev.salaryRange[1]],
                      }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Salary Max ($/mo)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={data.salaryRange[1] || ""}
                      onChange={(e) => setData((prev) => ({
                        ...prev,
                        salaryRange: [prev.salaryRange[0], Number(e.target.value)],
                      }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Contract Duration
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={data.contractMonths}
                    onChange={(e) => setData((prev) => ({ ...prev, contractMonths: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 min-w-[80px] text-center">
                    {data.contractMonths} mo
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Funding Source
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: "forge_mini_pool" as const, label: "Forge Mini-Pool", desc: "Hall-funded" },
                    { key: "pir_advance" as const, label: "PIR Advance", desc: "8th Ledger" },
                    { key: "treasury" as const, label: "Treasury", desc: "Direct" },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setData((prev) => ({ ...prev, fundingSource: opt.key }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        data.fundingSource === opt.key
                          ? "bg-cyan-950/30 border-cyan-900/50 text-cyan-400"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs mt-1 opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-amber-400">8th Ledger Benchmark</div>
                  <p className="text-xs text-amber-400/70 mt-1">
                    The 8th Ledger will screen all candidates and present the top 3 to the hall for final vote. 
                    Salary must fall within the benchmark range for the role.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Expected Outcome
                </label>
                <textarea
                  value={data.expectedOutcome}
                  onChange={(e) => setData((prev) => ({ ...prev, expectedOutcome: e.target.value }))}
                  placeholder="e.g., Yield increase of 20%, waste reduction of 15%, revenue growth of $X/month..."
                  rows={3}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Justification
                </label>
                <textarea
                  value={data.justification}
                  onChange={(e) => setData((prev) => ({ ...prev, justification: e.target.value }))}
                  placeholder="Why does this hall need this role now? What problem does it solve?..."
                  rows={3}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all resize-none"
                />
              </div>

              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Proposal Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Role</span>
                    <span className="text-slate-200">{data.role || "—"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Salary Range</span>
                    <span className="text-slate-200">
                      ${data.salaryRange[0].toLocaleString()} - ${data.salaryRange[1].toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Contract</span>
                    <span className="text-slate-200">{data.contractMonths} months</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Funding</span>
                    <span className="text-slate-200 capitalize">{data.fundingSource.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/30">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
          disabled={step === 1}
          className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)}
            disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
            className="px-6 py-2.5 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-cyan-400 text-sm font-medium hover:bg-cyan-950/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Continue
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isStep3Valid || isSubmitting}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-slate-950 text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit Proposal"}
          </button>
        )}
      </div>
    </motion.div>
  );
}