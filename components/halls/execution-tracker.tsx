"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Circle,
  ChevronRight,
  Image,
  FileText,
  Receipt,
  ExternalLink,
  X,
  ZoomIn,
  AlertTriangle,
  Zap,
  UserCheck,
  Truck,
  PackageCheck,
  Gavel,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ExecutionStatus = "passed" | "ledger_review" | "in_progress" | "completed";

interface ExecutionProof {
  id: string;
  type: "photo" | "invoice" | "certificate";
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ExecutionTrackerProps {
  proposalId: string;
  proposalTitle: string;
  proposalType: string;
  costEstimate: number;
  actualCost?: number;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  proofs: ExecutionProof[];
  executedBy?: string;
  notes?: string;
}

const stages: { key: ExecutionStatus; label: string; description: string; icon: React.ElementType }[] = [
  {
    key: "passed",
    label: "Passed",
    description: "Community voted 51% to approve",
    icon: Gavel,
  },
  {
    key: "ledger_review",
    label: "8th Ledger Review",
    description: "8th Ledger Operations assessing feasibility and cost",
    icon: UserCheck,
  },
  {
    key: "in_progress",
    label: "In Progress",
    description: "Work is actively being executed",
    icon: Truck,
  },
  {
    key: "completed",
    label: "Completed",
    description: "All deliverables verified and logged",
    icon: PackageCheck,
  },
];

const statusConfig: Record<
  ExecutionStatus,
  { color: string; bg: string; border: string; pulse?: boolean }
> = {
  passed: {
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/30",
  },
  ledger_review: {
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    pulse: true,
  },
  in_progress: {
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    pulse: true,
  },
  completed: {
    color: "text-slate-300",
    bg: "bg-slate-800/40",
    border: "border-slate-600/40",
  },
};

const proofConfig: Record<
  ExecutionProof["type"],
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  photo: { icon: Image, label: "Photo", color: "text-blue-400", bg: "bg-blue-900/20" },
  invoice: { icon: Receipt, label: "Invoice", color: "text-emerald-400", bg: "bg-emerald-900/20" },
  certificate: { icon: FileText, label: "Certificate", color: "text-purple-400", bg: "bg-purple-900/20" },
};

export default function ExecutionTracker({
  proposalId,
  proposalTitle,
  proposalType,
  costEstimate,
  actualCost,
  status,
  startedAt,
  completedAt,
  proofs,
  executedBy,
  notes,
}: ExecutionTrackerProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [expandedProofs, setExpandedProofs] = useState(true);

  const currentStageIndex = stages.findIndex((s) => s.key === status);
  const costVariance = actualCost !== undefined ? actualCost - costEstimate : null;
  const isOverBudget = costVariance !== null && costVariance > 0;

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center border",
              statusConfig[status].bg,
              statusConfig[status].border
            )}
          >
            {status === "in_progress" || status === "ledger_review" ? (
              <Loader2 size={18} className={cn(statusConfig[status].color, "animate-spin")} />
            ) : (
              <CheckCircle2 size={18} className={statusConfig[status].color} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{proposalTitle}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {proposalType}
              </span>
              <span className="text-slate-700">•</span>
              <span className="text-[10px] text-slate-500 font-mono">
                #{proposalId.slice(-6)}
              </span>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5",
            statusConfig[status].bg,
            statusConfig[status].border,
            statusConfig[status].color
          )}
        >
          {status === "in_progress" && <Zap size={10} className="animate-pulse" />}
          {stages[currentStageIndex].label}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-800/60">
            <div
              className="h-full bg-emerald-500/40 transition-all duration-1000"
              style={{
                width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
              }}
            />
          </div>

          <div className="relative grid grid-cols-4 gap-2">
            {stages.map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-500",
                      isCurrent
                        ? "bg-emerald-900/30 border-emerald-500 shadow-lg shadow-emerald-900/20"
                        : isActive
                        ? "bg-slate-800 border-emerald-600/50"
                        : "bg-slate-900/50 border-slate-800"
                    )}
                  >
                    {isCurrent && status !== "completed" ? (
                      <Loader2 size={16} className="text-emerald-400 animate-spin" />
                    ) : (
                      <StageIcon
                        size={16}
                        className={isActive ? "text-emerald-400" : "text-slate-600"}
                      />
                    )}
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <div
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isActive ? "text-slate-200" : "text-slate-600"
                      )}
                    >
                      {stage.label}
                    </div>
                    <div
                      className={cn(
                        "text-[9px] leading-tight max-w-[80px]",
                        isActive ? "text-slate-500" : "text-slate-700"
                      )}
                    >
                      {stage.description}
                    </div>
                    {isCurrent && startedAt && (
                      <div className="text-[9px] text-emerald-500/70 font-mono mt-0.5">
                        {new Date(startedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Badge */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
              <Receipt size={14} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cost</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-200 font-mono">
                  ${actualCost?.toLocaleString() || costEstimate.toLocaleString()}
                </span>
                {actualCost !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                      isOverBudget
                        ? "bg-red-900/20 text-red-400 border-red-700/30"
                        : "bg-emerald-900/20 text-emerald-400 border-emerald-700/30"
                    )}
                  >
                    {isOverBudget ? "+" : ""}
                    {costVariance?.toLocaleString()} vs estimate
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Estimate</div>
            <span className="text-xs text-slate-400 font-mono">${costEstimate.toLocaleString()}</span>
          </div>
        </div>

        {/* Executed By */}
        {executedBy && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <UserCheck size={14} className="text-slate-500" />
            <span>
              Executed by <span className="text-slate-300 font-medium">{executedBy}</span>
              {completedAt && (
                <span className="text-slate-600">
                  {" "}
                  on {new Date(completedAt).toLocaleDateString()}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              <FileText size={10} />
              Operations Notes
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{notes}</p>
          </div>
        )}

        {/* Proof Gallery */}
        {proofs.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setExpandedProofs(!expandedProofs)}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              {expandedProofs ? <ChevronRight size={14} className="rotate-90" /> : <ChevronRight size={14} />}
              <span>Execution Proof ({proofs.length})</span>
            </button>

            {expandedProofs && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {proofs.map((proof) => {
                  const config = proofConfig[proof.type];
                  const ProofIcon = config.icon;
                  return (
                    <button
                      key={proof.id}
                      onClick={() => proof.type === "photo" && setLightboxImage(proof.url)}
                      className={cn(
                        "group relative p-3 rounded-xl border text-left transition-all hover:scale-[1.02]",
                        config.bg,
                        "border-slate-700/30 hover:border-slate-600/40"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-900/40 flex items-center justify-center">
                          <ProofIcon size={14} className={config.color} />
                        </div>
                        <span className={cn("text-[10px] font-bold uppercase", config.color)}>
                          {config.label}
                        </span>
                      </div>
                      {proof.type === "photo" ? (
                        <div className="relative aspect-video rounded-lg bg-slate-900/40 overflow-hidden">
                          <img
                            src={proof.url}
                            alt={proof.caption || "Proof"}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn size={20} className="text-white drop-shadow-lg" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg bg-slate-900/40 flex items-center justify-center">
                          <FileText size={24} className={cn(config.color, "opacity-40")} />
                        </div>
                      )}
                      {proof.caption && (
                        <p className="mt-2 text-[10px] text-slate-500 truncate">{proof.caption}</p>
                      )}
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-600">
                        <span>{proof.uploadedBy}</span>
                        <span>{new Date(proof.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* No proofs warning */}
        {status === "completed" && proofs.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/10 border border-amber-800/20 text-xs text-amber-400">
            <AlertTriangle size={14} />
            <span>Completed but no proof uploaded yet. 8th Ledger Operations should upload documentation.</span>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt="Proof"
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border border-slate-800/60"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxImage}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 text-slate-300 text-xs hover:bg-slate-700/60 transition-colors"
          >
            <ExternalLink size={14} />
            Open Original
          </a>
        </div>
      )}
    </div>
  );
}