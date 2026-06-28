"use client";

import React, { useState } from "react";
import {
  Eye,
  Shield,
  Star,
  Gem,
  Lock,
  CheckCircle2,
  Wallet,
  Globe,
  Fingerprint,
  FileCheck,
  Crown,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KycTier = "visitor" | "sovereign" | "verified" | "whale";

interface TierProgressProps {
  currentTier: KycTier;
  kycStatus?: "pending" | "approved" | "rejected" | "needs_review";
  onStartVerification?: () => void;
  onUpgradeTier?: (targetTier: KycTier) => void;
  isProcessing?: boolean;
}

interface TierConfig {
  tier: KycTier;
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
  withdrawalLimit: string;
  withdrawalDelay: string;
  hallAccess: string;
  marketplaceAccess: string;
  requirements: { label: string; completed: boolean }[];
  description: string;
}

const tiers: TierConfig[] = [
  {
    tier: "visitor",
    label: "Visitor",
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
    icon: Eye,
    withdrawalLimit: "$0",
    withdrawalDelay: "N/A",
    hallAccess: "Browse only",
    marketplaceAccess: "View only",
    requirements: [
      { label: "Email verified", completed: true },
      { label: "Phone verified", completed: true },
    ],
    description: "Basic account. Can browse pools and commit capital, but cannot withdraw or access Hall governance.",
  },
  {
    tier: "sovereign",
    label: "Sovereign",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: Shield,
    withdrawalLimit: "$500",
    withdrawalDelay: "Instant",
    hallAccess: "Full access",
    marketplaceAccess: "Buy & sell",
    requirements: [
      { label: "Government ID uploaded", completed: false },
      { label: "Selfie captured", completed: false },
      { label: "Face match verified", completed: false },
      { label: "Legal name confirmed", completed: false },
    ],
    description: "Verified identity. Full Hall access, governance voting, and limited instant withdrawals.",
  },
  {
    tier: "verified",
    label: "Verified",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Star,
    withdrawalLimit: "$5,000",
    withdrawalDelay: "24h",
    hallAccess: "Full + priority",
    marketplaceAccess: "Full access",
    requirements: [
      { label: "Proof of address", completed: false },
      { label: "Video liveness check", completed: false },
      { label: "Enhanced due diligence", completed: false },
      { label: "Source of funds declared", completed: false },
    ],
    description: "Enhanced verification. Higher withdrawal limits, priority support, and full platform privileges.",
  },
  {
    tier: "whale",
    label: "Whale",
    color: "text-purple-400",
    bg: "bg-purple-900/20",
    border: "border-purple-700/30",
    icon: Gem,
    withdrawalLimit: "Unlimited",
    withdrawalDelay: "72h",
    hallAccess: "Full + priority",
    marketplaceAccess: "Full + OTC",
    requirements: [
      { label: "Wealth verification", completed: false },
      { label: "EDD interview completed", completed: false },
      { label: "Priority support enrolled", completed: false },
      { label: "Council recognition", completed: false },
    ],
    description: "Maximum verification tier. Unlimited withdrawals, OTC marketplace access, and Council consideration.",
  },
];

export default function TierProgress({
  currentTier,
  kycStatus,
  onStartVerification,
  onUpgradeTier,
  isProcessing = false,
}: TierProgressProps) {
  const [expandedTier, setExpandedTier] = useState<KycTier | null>(currentTier);
  const currentTierIndex = tiers.findIndex((t) => t.tier === currentTier);
  const nextTier = tiers[currentTierIndex + 1];

  const getTierStatus = (index: number) => {
    if (index < currentTierIndex) return "completed";
    if (index === currentTierIndex) return "current";
    return "locked";
  };

  const completedRequirements = tiers[currentTierIndex].requirements.filter((r) => r.completed).length;
  const totalRequirements = tiers[currentTierIndex].requirements.length;
  const tierProgress = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 100;

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-[#0d0d1a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
              <Crown size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">SIV / KYC Tier Progress</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Current: <span className={tiers[currentTierIndex].color}>{tiers[currentTierIndex].label}</span>
              </p>
            </div>
          </div>
          {kycStatus && (
            <div
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5",
                kycStatus === "approved"
                  ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
                  : kycStatus === "pending"
                  ? "bg-amber-900/20 border-amber-700/30 text-amber-400"
                  : "bg-red-900/20 border-red-700/30 text-red-400"
              )}
            >
              {kycStatus === "approved" && <CheckCircle2 size={10} />}
              {kycStatus === "pending" && <Loader2 size={10} className="animate-spin" />}
              {kycStatus === "rejected" && <AlertTriangle size={10} />}
              {kycStatus === "needs_review" && <FileCheck size={10} />}
              {kycStatus.replace("_", " ")}
            </div>
          )}
        </div>

        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            <span>Tier Completion</span>
            <span className="font-mono text-cyan-400">
              {completedRequirements}/{totalRequirements} requirements
            </span>
          </div>
          <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500/40 rounded-full transition-all duration-700"
              style={{ width: `${tierProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Tier Stepper */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-0 right-0 h-px bg-slate-800/40" />
          <div className="relative flex items-start justify-between">
            {tiers.map((tier, index) => {
              const TierIcon = tier.icon;
              const status = getTierStatus(index);
              const isExpanded = expandedTier === tier.tier;

              return (
                <button
                  key={tier.tier}
                  onClick={() => setExpandedTier(isExpanded ? null : tier.tier)}
                  className="flex flex-col items-center gap-2 z-10 group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                      status === "completed"
                        ? "bg-emerald-900/20 border-emerald-500/50"
                        : status === "current"
                        ? `${tier.bg} ${tier.border} ring-2 ring-cyan-500/20`
                        : "bg-slate-800/30 border-slate-700/30"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <TierIcon
                        size={18}
                        className={status === "current" ? tier.color : "text-slate-600"}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        status === "completed"
                          ? "text-emerald-400"
                          : status === "current"
                          ? tier.color
                          : "text-slate-600"
                      )}
                    >
                      {tier.label}
                    </div>
                    {status === "current" && (
                      <div className="text-[9px] text-slate-500 mt-0.5">You are here</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded Tier Detail */}
        {expandedTier && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            {tiers
              .filter((t) => t.tier === expandedTier)
              .map((tier) => {
                const TierIcon = tier.icon;
                const tierIndex = tiers.findIndex((x) => x.tier === tier.tier);
                const status = getTierStatus(tierIndex);

                return (
                  <div
                    key={tier.tier}
                    className={cn(
                      "p-4 rounded-xl border space-y-4",
                      status === "current" ? `${tier.bg} ${tier.border}` : "bg-slate-800/10 border-slate-800/20"
                    )}
                  >
                    {/* Tier Header */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border",
                          status === "current" ? tier.bg : "bg-slate-800/30",
                          status === "current" ? tier.border : "border-slate-700/30"
                        )}
                      >
                        <TierIcon size={24} className={status === "current" ? tier.color : "text-slate-500"} />
                      </div>
                      <div>
                        <div className={cn("text-sm font-bold", status === "current" ? tier.color : "text-slate-400")}>
                          {tier.label}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tier.description}</p>
                      </div>
                    </div>

                    {/* Privileges Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase mb-1">
                          <Wallet size={10} />
                          Withdrawal
                        </div>
                        <div className="text-xs font-bold text-slate-200">{tier.withdrawalLimit}</div>
                        <div className="text-[9px] text-slate-600">{tier.withdrawalDelay}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase mb-1">
                          <Globe size={10} />
                          Hall Access
                        </div>
                        <div className="text-xs font-bold text-slate-200">{tier.hallAccess}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase mb-1">
                          <Fingerprint size={10} />
                          Marketplace
                        </div>
                        <div className="text-xs font-bold text-slate-200">{tier.marketplaceAccess}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase mb-1">
                          <Shield size={10} />
                          Status
                        </div>
                        <div className={cn("text-xs font-bold", status === "completed" ? "text-emerald-400" : status === "current" ? tier.color : "text-slate-500")}>
                          {status === "completed" ? "Unlocked" : status === "current" ? "In Progress" : "Locked"}
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Requirements</div>
                      {tier.requirements.map((req, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                            req.completed
                              ? "bg-emerald-950/10 border-emerald-800/20"
                              : "bg-slate-800/10 border-slate-800/20"
                          )}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded-md flex items-center justify-center border",
                              req.completed
                                ? "bg-emerald-900/20 border-emerald-700/30"
                                : "bg-slate-800/30 border-slate-700/30"
                            )}
                          >
                            {req.completed ? (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            ) : (
                              <Lock size={12} className="text-slate-600" />
                            )}
                          </div>
                          <span className={cn("text-xs", req.completed ? "text-emerald-300" : "text-slate-500")}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    {status === "current" && nextTier && (
                      <button
                        onClick={() => onUpgradeTier?.(nextTier.tier)}
                        disabled={isProcessing || tierProgress < 100}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all",
                          tierProgress >= 100
                            ? "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20"
                            : "bg-slate-800/20 border-slate-800/20 text-slate-600 cursor-not-allowed"
                        )}
                      >
                        {isProcessing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ArrowRight size={16} />
                        )}
                        {isProcessing
                          ? "Processing..."
                          : tierProgress >= 100
                          ? `Upgrade to ${nextTier.label}`
                          : `Complete ${Math.round(100 - tierProgress)}% more requirements`}
                      </button>
                    )}

                    {status === "locked" && (
                      <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30 flex items-center gap-2 text-xs text-slate-500">
                        <Lock size={14} />
                        Complete {tiers[tierIndex - 1]?.label} tier first
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Next Tier CTA */}
        {nextTier && currentTier !== "whale" && (
          <div className="p-4 rounded-xl bg-cyan-950/10 border border-cyan-800/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center shrink-0">
              <nextTier.icon size={20} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-cyan-300">Next: {nextTier.label}</div>
              <p className="text-xs text-cyan-400/70 mt-0.5 leading-relaxed">
                Unlock {nextTier.withdrawalLimit} withdrawals and {nextTier.hallAccess.toLowerCase()} hall privileges.
              </p>
            </div>
            <button
              onClick={onStartVerification}
              className="shrink-0 px-4 py-2.5 rounded-lg bg-cyan-600 border border-cyan-500 text-white text-xs font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20"
            >
              Verify
            </button>
          </div>
        )}

        {/* Whale Complete */}
        {currentTier === "whale" && (
          <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-800/20 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-900/20 border border-purple-700/30 flex items-center justify-center mb-2">
              <Gem size={24} className="text-purple-400" />
            </div>
            <div className="text-sm font-bold text-purple-300">Maximum Tier Reached</div>
            <p className="text-xs text-purple-400/70 mt-1">
              You have full 8th Ledger privileges. No further verification required.
            </p>
          </div>
        )}

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <Shield size={10} />
            <span>SIV/KYC tiers are immutable</span>
          </div>
          <div className="flex items-center gap-2">
            <Fingerprint size={10} />
            <span>Verified by 8th Ledger Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
