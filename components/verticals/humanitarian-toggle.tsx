"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  AlertTriangle,
  Shield,
  Globe,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Info,
  Cross,
  Ban,
  FileText,
  Send,
  Crown,
  Lock,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DeploymentStatus = "standby" | "pending_vote" | "approved" | "deployed" | "returned";

interface HumanitarianToggleProps {
  hallId: string;
  hallName: string;
  assetType: string; // e.g. "Mobile Clinic", "Ambulance Fleet"
  isEnabled: boolean;
  onToggle?: (enabled: boolean) => void;
  status?: DeploymentStatus;
  targetRegion?: string;
  ngoPartners?: string[];
  selectedNgo?: string;
  onSelectNgo?: (ngo: string) => void;
  riskLevel?: "low" | "moderate" | "high" | "extreme";
  insuranceCoverage?: boolean;
  unPartner?: boolean;
  redCrossPartner?: boolean;
  voteProgress?: number;
  onProposeDeployment?: (region: string, reason: string) => void;
  onVote?: (vote: boolean) => void;
  userVoted?: boolean;
  deploymentHistory?: {
    region: string;
    deployedAt: string;
    returnedAt?: string;
    patientsTreated?: number;
    status: "active" | "completed" | "evacuated";
  }[];
}

const statusConfig: Record<
  DeploymentStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  standby: {
    label: "Standby",
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
    icon: Clock,
  },
  pending_vote: {
    label: "Vote Pending",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Zap,
  },
  approved: {
    label: "Approved",
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/30",
    icon: CheckCircle2,
  },
  deployed: {
    label: "Deployed",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: Globe,
  },
  returned: {
    label: "Returned",
    color: "text-slate-300",
    bg: "bg-slate-800/40",
    border: "border-slate-600/40",
    icon: Shield,
  },
};

const riskConfig: Record<
  "low" | "moderate" | "high" | "extreme",
  { label: string; color: string; bg: string; border: string; description: string }
> = {
  low: {
    label: "Low Risk",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    description: "Stable region with established infrastructure",
  },
  moderate: {
    label: "Moderate Risk",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    description: "Some instability, requires caution",
  },
  high: {
    label: "High Risk",
    color: "text-orange-400",
    bg: "bg-orange-900/20",
    border: "border-orange-700/30",
    description: "Active conflict zone, enhanced security needed",
  },
  extreme: {
    label: "Extreme Risk",
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/30",
    description: "War zone, UN coordination required",
  },
};

const ngoList = [
  "Doctors Without Borders (MSF)",
  "International Medical Corps",
  "Red Cross / Red Crescent",
  "UNHCR",
  "UNICEF",
  "Save the Children",
  "World Vision",
  "Local Health Ministry",
  "Other (specify)",
];

export default function HumanitarianToggle({
  hallId,
  hallName,
  assetType,
  isEnabled,
  onToggle,
  status = "standby",
  targetRegion,
  ngoPartners = [],
  selectedNgo,
  onSelectNgo,
  riskLevel = "low",
  insuranceCoverage = false,
  unPartner = false,
  redCrossPartner = false,
  voteProgress = 0,
  onProposeDeployment,
  onVote,
  userVoted,
  deploymentHistory = [],
}: HumanitarianToggleProps) {
  const [showForm, setShowForm] = useState(false);
  const [region, setRegion] = useState(targetRegion || "");
  const [reason, setReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showRisk, setShowRisk] = useState(false);

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;
  const riskCfg = riskConfig[riskLevel];

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-900/20 border border-rose-700/30 flex items-center justify-center">
            <HeartHandshake size={18} className="text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Humanitarian Deployment</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{assetType} • {hallName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1", cfg.bg, cfg.border, cfg.color)}>
            <StatusIcon size={10} />
            {cfg.label}
          </div>
          {unPartner && (
            <div className="px-2 py-1 rounded bg-blue-900/20 border border-blue-700/30 text-[10px] text-blue-400 font-bold">
              UN
            </div>
          )}
          {redCrossPartner && (
            <div className="px-2 py-1 rounded bg-red-900/20 border border-red-700/30 text-[10px] text-red-400 font-bold">
              Red Cross
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
              isEnabled ? "bg-rose-900/20 border-rose-700/30" : "bg-slate-800/40 border-slate-700/30"
            )}>
              <HeartHandshake size={20} className={isEnabled ? "text-rose-400" : "text-slate-500"} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">Humanitarian Mode</div>
              <div className="text-[10px] text-slate-500">
                {isEnabled ? "Deployment proposals enabled" : "Standard operations only"}
              </div>
            </div>
          </div>
          <button
            onClick={() => onToggle?.(!isEnabled)}
            className={cn(
              "relative w-14 h-7 rounded-full transition-all border",
              isEnabled
                ? "bg-rose-600 border-rose-500"
                : "bg-slate-800 border-slate-700"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all",
              isEnabled ? "left-7" : "left-0.5"
            )} />
          </button>
        </div>

        {/* Risk Level */}
        {isEnabled && (
          <div className={cn("p-4 rounded-xl border", riskCfg.bg, riskCfg.border)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className={riskCfg.color} />
                <span className={cn("text-sm font-bold", riskCfg.color)}>{riskCfg.label}</span>
              </div>
              <button
                onClick={() => setShowRisk(!showRisk)}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <Info size={10} />
                {showRisk ? "Hide" : "Details"}
              </button>
            </div>
            <p className={cn("text-xs", riskCfg.color)}>{riskCfg.description}</p>
            {showRisk && (
              <div className="mt-3 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield size={12} />
                  <span>VIN Insurance Fund covers equipment loss in conflict zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={12} />
                  <span>All personnel are VIN employees on hazard pay</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={12} />
                  <span>NGO coordination required for border access</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NGO Selection */}
        {isEnabled && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Globe size={12} />
              NGO Partner
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ngoList.map((ngo) => {
                const selected = selectedNgo === ngo;
                const isPartner = ngoPartners.includes(ngo);
                return (
                  <button
                    key={ngo}
                    onClick={() => onSelectNgo?.(ngo)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      selected
                        ? "bg-blue-900/20 border-blue-700/30"
                        : "bg-slate-800/20 border-slate-700/30 hover:border-slate-600/40"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                      selected ? "bg-blue-900/20 border-blue-700/30" : "bg-slate-800/40 border-slate-700/30"
                    )}>
                      {selected ? (
                        <CheckCircle2 size={14} className="text-blue-400" />
                      ) : (
                        <Globe size={14} className="text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={cn("text-xs font-medium", selected ? "text-blue-300" : "text-slate-300")}>
                        {ngo}
                      </span>
                      {isPartner && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-emerald-900/20 text-emerald-400 border border-emerald-700/30">
                          Verified Partner
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Propose Deployment */}
        {isEnabled && status === "standby" && (
          <div className="space-y-3">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-rose-600 border border-rose-500 text-white text-sm font-bold hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20"
              >
                <Send size={16} />
                Propose Deployment
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/10 border border-rose-800/20 space-y-4 animate-in slide-in-from-top-2">
                <div className="text-xs font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Deployment Proposal
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase">Target Region</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Sudan, Gaza, Haiti..."
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase">Justification</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why deploy? Cite humanitarian need, crisis data, or UN appeal..."
                    rows={3}
                    className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/40 resize-none"
                  />
                </div>
                <div className="p-3 rounded-lg bg-amber-950/10 border border-amber-800/20 flex items-start gap-2">
                  <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-300/80 leading-relaxed">
                    This will create a governance proposal. 51% capital-weighted vote required. VIN Operations will assess security before approving any deployment.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 rounded-lg border border-slate-700/40 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onProposeDeployment?.(region, reason);
                      setShowForm(false);
                      setRegion("");
                      setReason("");
                    }}
                    disabled={!region.trim() || !reason.trim()}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-xs font-bold transition-all",
                      region.trim() && reason.trim()
                        ? "bg-rose-600 text-white hover:bg-rose-500"
                        : "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                    )}
                  >
                    Submit Proposal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vote Progress */}
        {status === "pending_vote" && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Community Vote</div>
            <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Capital-weighted approval</span>
                <span className="text-slate-200 font-mono font-bold">{voteProgress.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500/40 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(voteProgress, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600">
                <span>51% required for deployment</span>
                <span>{(51 - voteProgress).toFixed(1)}% more needed</span>
              </div>
              {!userVoted && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => onVote?.(false)}
                    className="px-4 py-2.5 rounded-xl border border-red-700/30 bg-red-900/20 text-xs font-bold text-red-400 hover:bg-red-900/30 transition-all"
                  >
                    <XCircle size={14} className="inline mr-1" />
                    Decline
                  </button>
                  <button
                    onClick={() => onVote?.(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 border border-emerald-500 text-white text-xs font-bold hover:bg-emerald-500 transition-all"
                  >
                    <CheckCircle2 size={14} className="inline mr-1" />
                    Approve
                  </button>
                </div>
              )}
              {userVoted && (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 size={14} />
                  You have voted
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deployed Status */}
        {status === "deployed" && targetRegion && (
          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/20 space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Active Deployment</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                <div className="text-[10px] text-slate-500 uppercase mb-1">Region</div>
                <div className="text-xs font-bold text-slate-200">{targetRegion}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                <div className="text-[10px] text-slate-500 uppercase mb-1">Partner</div>
                <div className="text-xs font-bold text-slate-200">{selectedNgo || "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield size={12} />
              <span>VIN Insurance active • Hazard pay for staff</span>
            </div>
          </div>
        )}

        {/* Deployment History */}
        {deploymentHistory.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>Deployment History ({deploymentHistory.length})</span>
            </button>

            {showHistory && (
              <div className="space-y-2">
                {deploymentHistory.map((dep, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-xl border flex items-center gap-3",
                      dep.status === "active"
                        ? "bg-emerald-950/10 border-emerald-800/20"
                        : dep.status === "evacuated"
                        ? "bg-red-950/10 border-red-800/20"
                        : "bg-slate-800/20 border-slate-700/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                      dep.status === "active" ? "bg-emerald-900/20 border-emerald-700/30" :
                      dep.status === "evacuated" ? "bg-red-900/20 border-red-700/30" :
                      "bg-slate-800/40 border-slate-700/30"
                    )}>
                      <Globe size={14} className={
                        dep.status === "active" ? "text-emerald-400" :
                        dep.status === "evacuated" ? "text-red-400" :
                        "text-slate-500"
                      } />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{dep.region}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] border",
                          dep.status === "active" ? "bg-emerald-900/20 text-emerald-400 border-emerald-700/30" :
                          dep.status === "evacuated" ? "bg-red-900/20 text-red-400 border-red-700/30" :
                          "bg-slate-800 text-slate-500 border-slate-700/30"
                        )}>
                          {dep.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                        <span>Deployed {new Date(dep.deployedAt).toLocaleDateString()}</span>
                        {dep.returnedAt && (
                          <span>• Returned {new Date(dep.returnedAt).toLocaleDateString()}</span>
                        )}
                        {dep.patientsTreated !== undefined && (
                          <span className="text-emerald-500">• {dep.patientsTreated} treated</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Insurance Footer */}
        <div className="pt-3 border-t border-slate-800/40 flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
            insuranceCoverage ? "bg-emerald-900/20 border-emerald-700/30" : "bg-red-900/20 border-red-700/30"
          )}>
            <Shield size={14} className={insuranceCoverage ? "text-emerald-400" : "text-red-400"} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-300">
              {insuranceCoverage ? "Insurance Coverage Active" : "No Insurance Coverage"}
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {insuranceCoverage
                ? "VIN Insurance Fund covers equipment and liability in this deployment."
                : "Deployment without insurance coverage is not recommended."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}