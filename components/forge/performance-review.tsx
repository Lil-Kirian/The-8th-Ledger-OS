"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { submitPerformanceReview } from "@/hooks/use-forge";
import { calculatePerformanceScore } from "@/lib/forge";

interface PerformanceReviewProps {
  hallId: string;
  worker: {
    id: string;
    workerNumber: string;
    role: string;
    performanceScore: number;
    status: string;
  };
  onSubmit: () => void;
  onCancel: () => void;
}

export interface ReviewData {
  workerId: string;
  overallScore: number;
  metrics: {
    yieldChange?: number;
    wasteReduction?: number;
    uptime?: number;
    customerSatisfaction?: number;
    attendance?: number;
    targetYield?: number;
    targetWaste?: number;
  };
  achievements: string;
  deficiencies: string;
  improvementPlan: string;
  recommendation: "continue" | "improvement_plan" | "terminate";
}

export default function PerformanceReviewForm({
  hallId,
  worker,
  onSubmit,
  onCancel,
}: PerformanceReviewProps) {
  const [data, setData] = useState<ReviewData>({
    workerId: worker.id,
    overallScore: worker.performanceScore,
    metrics: {
      yieldChange: 0,
      wasteReduction: 0,
      uptime: 95,
      customerSatisfaction: 70,
      attendance: 95,
      targetYield: 20,
      targetWaste: 15,
    },
    achievements: "",
    deficiencies: "",
    improvementPlan: "",
    recommendation: "continue",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate score from metrics using lib/forge
  const calculatedScore = calculatePerformanceScore({
    yieldChange: data.metrics.yieldChange,
    wasteReduction: data.metrics.wasteReduction,
    uptime: data.metrics.uptime,
    customerSatisfaction: data.metrics.customerSatisfaction,
    attendance: data.metrics.attendance,
    targetYield: data.metrics.targetYield,
    targetWaste: data.metrics.targetWaste,
  });

  const isValid =
    data.achievements.trim().length >= 10 &&
    data.deficiencies.trim().length >= 10 &&
    (data.recommendation !== "improvement_plan" || data.improvementPlan.trim().length >= 20);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-950/30 border-emerald-900/50";
    if (score >= 60) return "bg-amber-950/30 border-amber-900/50";
    return "bg-red-950/30 border-red-900/50";
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await submitPerformanceReview(hallId, worker.id, {
        score: calculatedScore,
        metrics: data.metrics,
        improvementPlan: data.improvementPlan || undefined,
        recommendTermination: data.recommendation === "terminate",
        notes: `${data.achievements}\n\nDeficiencies: ${data.deficiencies}`,
      });
      onSubmit();
    } catch (err) {
      console.error("Performance review failed:", err);
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
              <Award className="w-5 h-5 text-cyan-400" />
              Performance Review
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {worker.role} — {worker.workerNumber} — Hall #{hallId}
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
        {/* Score Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${getScoreBg(worker.performanceScore)}`}>
            <div className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">
              Previous Score
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(worker.performanceScore)}`}>
              {worker.performanceScore}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${getScoreBg(calculatedScore)}`}>
            <div className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">
              Calculated Score
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(calculatedScore)}`}>
              {calculatedScore}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 block">
            Performance Metrics
          </label>
          <div className="space-y-4">
            {([
              { key: "yieldChange" as const, label: "Yield Change %", max: 100, target: "targetYield" as const },
              { key: "wasteReduction" as const, label: "Waste Reduction %", max: 100, target: "targetWaste" as const },
              { key: "uptime" as const, label: "Uptime %", max: 100 },
              { key: "customerSatisfaction" as const, label: "Customer Satisfaction", max: 100 },
              { key: "attendance" as const, label: "Attendance %", max: 100 },
            ]).map((metric) => (
              <div key={metric.key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">{metric.label}</span>
                  <span className={`font-bold ${getScoreColor(data.metrics[metric.key] || 0)}`}>
                    {data.metrics[metric.key] || 0}
                    {metric.target ? ` / ${data.metrics[metric.target] || 0} target` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={metric.max}
                    value={data.metrics[metric.key] || 0}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        metrics: {
                          ...prev.metrics,
                          [metric.key]: Number(e.target.value),
                        },
                      }))
                    }
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="w-12 text-right">
                    {(data.metrics[metric.key] || 0) >= 80 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400 inline" />
                    ) : (data.metrics[metric.key] || 0) >= 60 ? (
                      <Minus className="w-4 h-4 text-amber-400 inline" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400 inline" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Key Achievements
          </label>
          <textarea
            value={data.achievements}
            onChange={(e) => setData((prev) => ({ ...prev, achievements: e.target.value }))}
            placeholder="Specific accomplishments, exceeded targets, notable contributions..."
            rows={3}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all resize-none"
          />
        </div>

        {/* Deficiencies */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Areas for Improvement
          </label>
          <textarea
            value={data.deficiencies}
            onChange={(e) => setData((prev) => ({ ...prev, deficiencies: e.target.value }))}
            placeholder="Missed targets, skill gaps, behavioral issues..."
            rows={3}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all resize-none"
          />
        </div>

        {/* Recommendation */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
            Recommendation
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              {
                key: "continue" as const,
                label: "Continue",
                desc: "Meets expectations. Renew contract.",
                color: "emerald",
                icon: <CheckCircle2 className="w-4 h-4" />,
              },
              {
                key: "improvement_plan" as const,
                label: "Improvement Plan",
                desc: "30-day review. Address deficiencies.",
                color: "amber",
                icon: <Target className="w-4 h-4" />,
              },
              {
                key: "terminate" as const,
                label: "Terminate",
                desc: "Does not meet standards. End contract.",
                color: "red",
                icon: <AlertCircle className="w-4 h-4" />,
              },
            ]).map((rec) => (
              <button
                key={rec.key}
                onClick={() => setData((prev) => ({ ...prev, recommendation: rec.key }))}
                className={`p-3 rounded-lg border text-left transition-all ${
                  data.recommendation === rec.key
                    ? rec.color === "emerald"
                      ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
                      : rec.color === "amber"
                      ? "bg-amber-950/30 border-amber-900/50 text-amber-400"
                      : "bg-red-950/30 border-red-900/50 text-red-400"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {rec.icon}
                  <span className="text-sm font-medium">{rec.label}</span>
                </div>
                <div className="text-xs opacity-70">{rec.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Improvement Plan (conditional) */}
        {data.recommendation === "improvement_plan" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 block">
              30-Day Improvement Plan
            </label>
            <textarea
              value={data.improvementPlan}
              onChange={(e) => setData((prev) => ({ ...prev, improvementPlan: e.target.value }))}
              placeholder="Specific actions, milestones, and success criteria for the improvement period..."
              rows={3}
              className="w-full p-3 bg-amber-950/10 border border-amber-900/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-900/50 transition-all resize-none"
            />
          </motion.div>
        )}

        {/* Summary Preview */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">Review Summary</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Overall Score</span>
              <span className={`font-semibold ${getScoreColor(calculatedScore)}`}>{calculatedScore}/100</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Recommendation</span>
              <span className="text-slate-200 capitalize">{data.recommendation.replace("_", " ")}</span>
            </div>
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
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-slate-950 text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </motion.div>
  );
}