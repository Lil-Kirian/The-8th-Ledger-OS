"use client";

import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  EyeOff,
  MapPin,
  CreditCard,
  Camera,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  Clock,
  FileCheck,
  Ban,
  RotateCcw,
  Crown,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KycTier = "visitor" | "sovereign" | "verified" | "whale";

interface KycReviewCardProps {
  record: {
    id: string;
    userId: string;
    ledgerId: string;
    displayName: string;
    email: string;
    country: string;
    avatar?: string | null;
    legalName?: string | null;
    idType?: string | null;
    idNumber?: string | null;
    idImageUrl?: string | null;
    idVerified: boolean;
    selfieUrl?: string | null;
    selfieMatchScore?: number | null;
    selfieVerified: boolean;
    livenessVideoUrl?: string | null;
    livenessPassed: boolean;
    addressProofUrl?: string | null;
    addressVerified: boolean;
    address?: string | null;
    dateOfBirth?: Date | null;
    tier: KycTier;
    status: "pending" | "approved" | "rejected" | "needs_review";
    reviewedBy?: string | null;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
    createdAt: Date;
  };
  onApprove: (id: string, tier: KycTier) => void;
  onReject: (id: string, reason: string) => void;
  onRequestReview: (id: string, notes: string) => void;
  isProcessing?: boolean;
}

const tierConfig: Record<KycTier, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  visitor: {
    label: "Visitor",
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
    icon: EyeOff,
  },
  sovereign: {
    label: "Sovereign",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: Shield,
  },
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: BadgeCheck,
  },
  whale: {
    label: "Whale",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Crown,
  },
};

const statusConfig = {
  pending: { label: "Pending Review", color: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/30", icon: Clock },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-700/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-900/20", border: "border-red-700/30", icon: Ban },
  needs_review: { label: "Needs Review", color: "text-orange-400", bg: "bg-orange-900/20", border: "border-orange-700/30", icon: AlertCircle },
};

export default function KycReviewCard({
  record,
  onApprove,
  onReject,
  onRequestReview,
  isProcessing = false,
}: KycReviewCardProps) {
  const [selectedTier, setSelectedTier] = useState<KycTier>(record.tier);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("identity");

  const tierCfg = tierConfig[record.tier];
  const statusCfg = statusConfig[record.status];
  const StatusIcon = statusCfg.icon;
  const TierIcon = tierCfg.icon;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const verificationSteps = [
    {
      key: "identity",
      label: "Government ID",
      icon: CreditCard,
      verified: record.idVerified,
      url: record.idImageUrl,
      detail: record.idType ? `${record.idType.replace(/_/g, " ")} • ${record.idNumber ? `••••${record.idNumber.slice(-4)}` : "No number"}` : "Not uploaded",
    },
    {
      key: "selfie",
      label: "Selfie Match",
      icon: Camera,
      verified: record.selfieVerified,
      url: record.selfieUrl,
      detail: record.selfieMatchScore ? `${(record.selfieMatchScore * 100).toFixed(1)}% match confidence` : "Not analyzed",
    },
    {
      key: "liveness",
      label: "Liveness Check",
      icon: Fingerprint,
      verified: record.livenessPassed,
      url: record.livenessVideoUrl,
      detail: record.livenessPassed ? "Biometric verification passed" : "Not completed",
    },
    {
      key: "address",
      label: "Address Proof",
      icon: MapPin,
      verified: record.addressVerified,
      url: record.addressProofUrl,
      detail: record.address || "Not provided",
    },
  ];

  const allVerified = verificationSteps.every((s) => s.verified);

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-[#0d0d1a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-sm font-bold text-slate-400">
            {record.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{record.displayName}</h3>
            <p className="text-[10px] text-slate-500 font-mono">{record.ledgerId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", statusCfg.bg, statusCfg.border, statusCfg.color)}>
            <StatusIcon size={10} />
            {statusCfg.label}
          </div>
          <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", tierCfg.bg, tierCfg.border, tierCfg.color)}>
            <TierIcon size={10} />
            {tierCfg.label}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Sovereign Identity Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Legal Name</div>
            <div className="text-xs font-semibold text-slate-200 truncate">{record.legalName || "—"}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Country</div>
            <div className="text-xs font-semibold text-slate-200">{record.country}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Email</div>
            <div className="text-xs font-semibold text-slate-200 truncate">{record.email}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Submitted</div>
            <div className="text-xs font-semibold text-slate-200">
              {new Date(record.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Shield size={10} />
            Verification Pipeline
            {allVerified && (
              <span className="text-emerald-400 text-[9px]">(All checks passed)</span>
            )}
          </div>

          {verificationSteps.map((step) => {
            const StepIcon = step.icon;
            const isExpanded = expandedSection === step.key;

            return (
              <div
                key={step.key}
                className={cn(
                  "rounded-xl border transition-all overflow-hidden",
                  step.verified
                    ? "bg-emerald-950/5 border-emerald-800/20"
                    : "bg-slate-800/10 border-slate-800/20"
                )}
              >
                <button
                  onClick={() => toggleSection(step.key)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border",
                        step.verified
                          ? "bg-emerald-900/20 border-emerald-700/30"
                          : "bg-slate-800/30 border-slate-700/30"
                      )}
                    >
                      <StepIcon
                        size={14}
                        className={step.verified ? "text-emerald-400" : "text-slate-600"}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{step.label}</div>
                      <div className="text-[10px] text-slate-500">{step.detail}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.verified ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <XCircle size={14} className="text-slate-600" />
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                  </div>
                </button>

                {isExpanded && step.url && (
                  <div className="px-4 pb-4">
                    <div className="relative aspect-video rounded-lg bg-slate-900/50 border border-slate-700/30 overflow-hidden flex items-center justify-center">
                      <img
                        src={step.url}
                        alt={step.label}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-slate-500 text-xs hidden only:flex">
                        <FileCheck size={16} className="mr-2" />
                        Document unavailable
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tier Selector */}
        {record.status === "pending" && (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Assign KYC Tier</div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(tierConfig) as KycTier[]).map((tier) => {
                const tCfg = tierConfig[tier];
                const TIcon = tCfg.icon;
                return (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      selectedTier === tier
                        ? `${tCfg.bg} ${tCfg.border}`
                        : "bg-slate-800/10 border-slate-800/20 hover:border-slate-700/40"
                    )}
                  >
                    <TIcon size={16} className={cn("mx-auto mb-1", selectedTier === tier ? tCfg.color : "text-slate-600")} />
                    <div className={cn("text-[10px] font-bold uppercase", selectedTier === tier ? tCfg.color : "text-slate-600")}>
                      {tCfg.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Previous Review Info */}
        {record.reviewedAt && (
          <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Last Review</div>
            <div className="text-xs text-slate-300">
              By {record.reviewedBy || "System"} on {new Date(record.reviewedAt).toLocaleDateString()}
            </div>
            {record.rejectionReason && (
              <div className="mt-2 text-xs text-red-300/80 bg-red-950/10 p-2 rounded border border-red-800/20">
                <Ban size={10} className="inline mr-1" />
                {record.rejectionReason}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {record.status === "pending" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onApprove(record.id, selectedTier)}
                disabled={isProcessing || !allVerified}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  allVerified
                    ? "bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                    : "bg-slate-800/40 border border-slate-700/30 text-slate-500 cursor-not-allowed"
                )}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Approve as {tierConfig[selectedTier].label}
              </button>

              <button
                onClick={() => {
                  setShowRejectForm(!showRejectForm);
                  setShowReviewForm(false);
                }}
                className="px-4 py-3 rounded-xl bg-red-950/20 border border-red-800/30 text-red-400 text-sm font-bold hover:bg-red-900/20 transition-all"
              >
                <Ban size={16} />
              </button>

              <button
                onClick={() => {
                  setShowReviewForm(!showReviewForm);
                  setShowRejectForm(false);
                }}
                className="px-4 py-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-amber-400 text-sm font-bold hover:bg-amber-900/20 transition-all"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Reject Form */}
            {showRejectForm && (
              <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 space-y-3 animate-in slide-in-from-top-2">
                <div className="text-xs text-red-300 font-bold flex items-center gap-2">
                  <Ban size={14} />
                  Reject Application
                </div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (visible to user)..."
                  className="w-full bg-slate-900/50 border border-slate-700/30 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-700/50 min-h-[80px]"
                />
                <button
                  onClick={() => {
                    if (rejectionReason.trim()) {
                      onReject(record.id, rejectionReason);
                      setShowRejectForm(false);
                      setRejectionReason("");
                    }
                  }}
                  disabled={!rejectionReason.trim() || isProcessing}
                  className="w-full px-4 py-2.5 rounded-lg bg-red-600 border border-red-500 text-white text-xs font-bold hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Confirm Rejection"}
                </button>
              </div>
            )}

            {/* Request Review Form */}
            {showReviewForm && (
              <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-800/20 space-y-3 animate-in slide-in-from-top-2">
                <div className="text-xs text-amber-300 font-bold flex items-center gap-2">
                  <RotateCcw size={14} />
                  Request Additional Documents
                </div>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="What additional information does the user need to provide?"
                  className="w-full bg-slate-900/50 border border-slate-700/30 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-700/50 min-h-[80px]"
                />
                <button
                  onClick={() => {
                    if (reviewNotes.trim()) {
                      onRequestReview(record.id, reviewNotes);
                      setShowReviewForm(false);
                      setReviewNotes("");
                    }
                  }}
                  disabled={!reviewNotes.trim() || isProcessing}
                  className="w-full px-4 py-2.5 rounded-lg bg-amber-600 border border-amber-500 text-white text-xs font-bold hover:bg-amber-500 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Send Review Request"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Approved State */}
        {record.status === "approved" && (
          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/20 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-300">Approved as {tierConfig[record.tier].label}</div>
              <div className="text-[10px] text-emerald-300/60">
                By {record.reviewedBy || "Admin"} on {record.reviewedAt ? new Date(record.reviewedAt).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>
        )}

        {/* Rejected State */}
        {record.status === "rejected" && (
          <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 flex items-start gap-3">
            <Ban size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-red-300">Application Rejected</div>
              <div className="text-xs text-red-300/70 mt-1">{record.rejectionReason}</div>
              <div className="text-[10px] text-red-300/50 mt-1">
                By {record.reviewedBy || "Admin"} on {record.reviewedAt ? new Date(record.reviewedAt).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}