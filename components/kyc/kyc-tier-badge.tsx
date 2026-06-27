"use client";

import React, { useState } from "react";
import {
  Shield,
  Star,
  Gem,
  ChevronDown,
  Lock,
  Wallet,
  Eye,
  Fingerprint,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KycTier = "visitor" | "sovereign" | "verified" | "whale";

interface KycTierBadgeProps {
  tier: KycTier;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  interactive?: boolean;
}

interface TierRequirement {
  tier: KycTier;
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
  requirements: string[];
  withdrawalLimit: string;
  hallAccess: string;
  description: string;
}

const tiers: TierRequirement[] = [
  {
    tier: "visitor",
    label: "Visitor",
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
    icon: Eye,
    requirements: ["Email verification", "Phone verification"],
    withdrawalLimit: "$0",
    hallAccess: "Can commit, cannot claim",
    description: "Basic account. Can browse and commit to pools but cannot withdraw or access Halls.",
  },
  {
    tier: "sovereign",
    label: "Sovereign",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: Shield,
    requirements: ["Government ID", "Selfie match", "Name verification"],
    withdrawalLimit: "$500 / day",
    hallAccess: "Full Hall access",
    description: "Verified identity. Full Hall access and limited withdrawals.",
  },
  {
    tier: "verified",
    label: "Verified",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Star,
    requirements: ["Proof of address", "Video liveness", "Enhanced check"],
    withdrawalLimit: "$5,000 / day",
    hallAccess: "Full Hall access",
    description: "Enhanced due diligence. Higher withdrawal limits and full platform access.",
  },
  {
    tier: "whale",
    label: "Whale",
    color: "text-purple-400",
    bg: "bg-purple-900/20",
    border: "border-purple-700/30",
    icon: Gem,
    requirements: ["Source of funds", "EDD completed", "Priority support"],
    withdrawalLimit: "Unlimited",
    hallAccess: "Full Hall + Priority",
    description: "Maximum verification. Unlimited withdrawals and priority support.",
  },
];

export default function KycTierBadge({
  tier,
  showTooltip = true,
  size = "md",
  onClick,
  interactive = false,
}: KycTierBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentTier = tiers.find((t) => t.tier === tier) || tiers[0];
  const TierIcon = currentTier.icon;

  const sizeConfig = {
    sm: { badge: "px-2 py-0.5 text-[10px] gap-1", icon: 10, popup: "w-64" },
    md: { badge: "px-2.5 py-1 text-xs gap-1.5", icon: 12, popup: "w-72" },
    lg: { badge: "px-3 py-1.5 text-sm gap-2", icon: 14, popup: "w-80" },
  };

  const cfg = sizeConfig[size];

  return (
    <div className="relative inline-block">
      {/* Badge */}
      <button
        onClick={() => {
          if (interactive) {
            setIsOpen(!isOpen);
            onClick?.();
          }
        }}
        className={cn(
          "inline-flex items-center rounded-lg border font-bold uppercase tracking-wider transition-all",
          currentTier.bg,
          currentTier.border,
          currentTier.color,
          cfg.badge,
          interactive && "hover:brightness-110 cursor-pointer",
          !interactive && "cursor-default"
        )}
      >
        <TierIcon size={cfg.icon} />
        {currentTier.label}
        {interactive && (
          <ChevronDown size={cfg.icon} className={cn("transition-transform", isOpen && "rotate-180")} />
        )}
      </button>

      {/* Tooltip / Popup */}
      {showTooltip && isOpen && interactive && (
        <div className={cn("absolute z-50 mt-2 left-0", cfg.popup)}>
          <div className="bg-[#0a0a12] border border-slate-700/40 rounded-xl shadow-2xl overflow-hidden">
            {/* Current Tier Header */}
            <div className={cn("p-4 border-b border-slate-800/40", currentTier.bg)}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", currentTier.bg, currentTier.border)}>
                  <TierIcon size={20} className={currentTier.color} />
                </div>
                <div>
                  <div className={cn("text-sm font-bold", currentTier.color)}>{currentTier.label}</div>
                  <div className="text-[10px] text-slate-500">Current Tier</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{currentTier.description}</p>
            </div>

            {/* All Tiers */}
            <div className="p-4 space-y-3">
              {tiers.map((t) => {
                const TIcon = t.icon;
                const isCurrent = t.tier === tier;
                const isLocked = tiers.findIndex((x) => x.tier === tier) < tiers.findIndex((x) => x.tier === t.tier);

                return (
                  <div
                    key={t.tier}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all",
                      isCurrent
                        ? `${t.bg} ${t.border}`
                        : "bg-slate-800/10 border-slate-800/20 opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                        isCurrent ? t.bg : "bg-slate-800/30",
                        isCurrent ? t.border : "border-slate-700/30"
                      )}
                    >
                      {isLocked ? (
                        <Lock size={14} className="text-slate-600" />
                      ) : (
                        <TIcon size={14} className={isCurrent ? t.color : "text-slate-500"} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold", isCurrent ? t.color : "text-slate-500")}>
                          {t.label}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-900/30 text-emerald-400 border border-emerald-700/30">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Wallet size={10} />
                          <span>Withdraw: {t.withdrawalLimit}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Globe size={10} />
                          <span>{t.hallAccess}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.requirements.map((req, i) => (
                          <span
                            key={i}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] border",
                              isCurrent
                                ? "bg-slate-800/30 border-slate-700/30 text-slate-400"
                                : "bg-slate-900/30 border-slate-800/30 text-slate-600"
                            )}
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-900/30 border-t border-slate-800/40 text-[10px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Fingerprint size={10} />
                SIV/KYC Tier System
              </span>
              <span>Upgrade in Settings</span>
            </div>
          </div>
        </div>
      )}

      {/* Simple tooltip on hover (non-interactive) */}
      {showTooltip && !interactive && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700/40 rounded-lg shadow-xl whitespace-nowrap">
          <div className="flex items-center gap-2">
            <TierIcon size={12} className={currentTier.color} />
            <span className="text-xs text-slate-200 font-medium">{currentTier.label}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Withdraw: {currentTier.withdrawalLimit}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-900" />
        </div>
      )}
    </div>
  );
}