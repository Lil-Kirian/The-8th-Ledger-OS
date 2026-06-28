"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Shield,
  CheckCircle2,
  X,
  Users,
  Vote,
  Clock,
  ChevronDown,
  ChevronUp,
  Ambulance,
  Hospital,
  ClipboardList,
  Send,
  Ban,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipProvider,
} from "@/components/ui/tooltip";

//  Types
export type RiskLevel = "low" | "moderate" | "high" | "extreme";
export type DeploymentStatus = "pending" | "voting" | "deployed" | "suspended" | "completed" | "cancelled";

export interface NgoPartner {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
  specializations: string[];
  activeDeployments: number;
}

export interface DeploymentRecord {
  id: string;
  region: string;
  country: string;
  justification: string;
  proposedAt: string;
  voteStartedAt?: string;
  deployedAt?: string;
  completedAt?: string;
  status: DeploymentStatus;
  yesVotes: number;
  noVotes: number;
  totalVotingPower: number;
  riskLevel: RiskLevel;
  ngoPartnerId?: string;
  ngoPartnerName?: string;
  patientsServed?: number;
  staffDeployed?: number;
  budgetUsed?: number;
  budgetAllocated?: number;
  insurancePolicyId?: string;
  insuranceStatus: "active" | "pending" | "expired" | "claimed";
}

export interface HumanitarianToggleProps {
  hallId: string;
  hallName: string;
  isEnabled: boolean;
  currentRiskLevel: RiskLevel;
  ngoPartners: NgoPartner[];
  activeDeployment?: DeploymentRecord | null;
  deploymentHistory: DeploymentRecord[];
  insuranceCoverage: {
    policyId: string;
    provider: string;
    coverageAmount: number;
    status: "active" | "pending" | "expired";
    expiresAt: string;
  };
  yourOwnershipPercent: number;
  isLoading?: boolean;
  onToggleEnable?: (enabled: boolean) => void;
  onProposeDeployment?: (data: { region: string; country: string; justification: string; ngoPartnerId: string; riskLevel: RiskLevel }) => void;
  onVote?: (deploymentId: string, vote: "yes" | "no") => void;
  onExport?: () => void;
}

//  Config
const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: React.ElementType; description: string }> = {
  low: {
    label: "Low Risk",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: Shield,
    description: "Stable region. Standard medical operations. Minimal security concerns.",
  },
  moderate: {
    label: "Moderate Risk",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: AlertTriangle,
    description: "Some instability. Enhanced security protocols required. NGO coordination essential.",
  },
  high: {
    label: "High Risk",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: AlertTriangle,
    description: "Active conflict or health crisis zone. Heavy insurance load. Council approval required.",
  },
  extreme: {
    label: "Extreme Risk",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: Ban,
    description: "War zone or pandemic epicenter. Maximum insurance coverage. Architect override possible.",
  },
};

const STATUS_CONFIG: Record<DeploymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",    color: "text-slate-400",    bg: "bg-slate-500/10",    icon: Clock },
  voting:    { label: "Voting",     color: "text-cyan-400",     bg: "bg-cyan-500/10",     icon: Vote },
  deployed:  { label: "Deployed",   color: "text-emerald-400",  bg: "bg-emerald-500/10",  icon: CheckCircle2 },
  suspended: { label: "Suspended",  color: "text-amber-400",    bg: "bg-amber-500/10",    icon: AlertTriangle },
  completed: { label: "Completed",  color: "text-blue-400",     bg: "bg-blue-500/10",    icon: CheckCircle2 },
  cancelled: { label: "Cancelled",  color: "text-red-400",      bg: "bg-red-500/10",     icon: Ban },
};

//  Helpers
function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function votePercent(yes: number, total: number) {
  if (!total) return 0;
  return Math.round((yes / total) * 100);
}

//  Component
export function HumanitarianToggle({
  hallId,
  hallName,
  isEnabled,
  currentRiskLevel,
  ngoPartners,
  activeDeployment,
  deploymentHistory,
  insuranceCoverage,
  yourOwnershipPercent,
  isLoading = false,
  onToggleEnable,
  onProposeDeployment,
  onVote,
  onExport,
}: HumanitarianToggleProps) {
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedDeployment, setExpandedDeployment] = useState<string | null>(null);

  // Form state
  const [formRegion, setFormRegion] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formJustification, setFormJustification] = useState("");
  const [formNgo, setFormNgo] = useState("");
  const [formRisk, setFormRisk] = useState<RiskLevel>("moderate");

  const risk = RISK_CONFIG[currentRiskLevel];
  const RiskIcon = risk.icon;

  const handleSubmit = () => {
    if (!formRegion || !formCountry || !formJustification || !formNgo) return;
    onProposeDeployment?.({
      region: formRegion,
      country: formCountry,
      justification: formJustification,
      ngoPartnerId: formNgo,
      riskLevel: formRisk,
    });
    setShowProposalForm(false);
    setFormRegion("");
    setFormCountry("");
    setFormJustification("");
    setFormNgo("");
    setFormRisk("moderate");
  };

  if (isLoading) {
    return <HumanitarianSkeleton />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/*  Header  */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <HeartPulse className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                Humanitarian Deployment
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                LedgerHealth · {hallName} · Managed by 8th Ledger
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/*  Main Toggle Card  */}
        <Card
          className={`border overflow-hidden ${isEnabled ? "border-rose-500/20 bg-rose-950/5" : "border-slate-800 bg-slate-950/50"}`}
        >
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnabled ? "bg-rose-500/10" : "bg-slate-800"}`}
                >
                  {isEnabled ? (
                    <HeartPulse className="w-6 h-6 text-rose-400" />
                  ) : (
                    <HeartPulse className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Humanitarian Operations {isEnabled ? "Enabled" : "Disabled"}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isEnabled
                      ? "Hall can propose medical deployments to crisis zones."
                      : "Enable to activate humanitarian deployment capabilities."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onToggleEnable?.(!isEnabled)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all shrink-0"
              >
                {isEnabled ? (
                  <>
                    <ToggleRight className="w-6 h-6 text-rose-400" />
                    <span className="text-sm font-medium text-rose-400">
                      On
                    </span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-6 h-6 text-slate-500" />
                    <span className="text-sm font-medium text-slate-500">
                      Off
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Risk Level (when enabled) */}
            <AnimatePresence>
              {isEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${risk.bg} flex items-center justify-center`}
                      >
                        <RiskIcon className={`w-5 h-5 ${risk.color}`} />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${risk.color}`}>
                          {risk.label}
                        </div>
                        <p className="text-xs text-slate-500">
                          {risk.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/*  Insurance Coverage  */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Insurance Coverage
              </h3>
              <Badge
                className={`text-[10px] border-0 ml-auto ${
                  insuranceCoverage.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : insuranceCoverage.status === "pending"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                }`}
              >
                {insuranceCoverage.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Policy ID
                </div>
                <div className="text-xs font-mono text-slate-300 mt-1">
                  {insuranceCoverage.policyId}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Provider
                </div>
                <div className="text-xs font-medium text-slate-300 mt-1">
                  {insuranceCoverage.provider}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Coverage
                </div>
                <div className="text-xs font-mono text-emerald-400 mt-1">
                  {formatCurrency(insuranceCoverage.coverageAmount)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Expires
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {formatDate(insuranceCoverage.expiresAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/*  Active Deployment  */}
        {isEnabled && activeDeployment && (
          <Card
            className={`border overflow-hidden ${
              activeDeployment.status === "deployed"
                ? "border-emerald-500/20 bg-emerald-950/5"
                : activeDeployment.status === "voting"
                  ? "border-cyan-500/20 bg-cyan-950/5"
                  : "border-slate-800 bg-slate-950/50"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ambulance className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-semibold text-slate-200">
                    Active Deployment
                  </h3>
                  {(() => {
                    const s = STATUS_CONFIG[activeDeployment.status];
                    const SIcon = s.icon;
                    return (
                      <Badge
                        className={`text-[10px] ${s.bg} ${s.color} border-0`}
                      >
                        <SIcon className="w-2.5 h-2.5 mr-1" />
                        {s.label}
                      </Badge>
                    );
                  })()}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {activeDeployment.id}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deployment Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Region
                  </div>
                  <div className="text-sm font-medium text-slate-200 mt-1">
                    {activeDeployment.region}
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeDeployment.country}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    NGO Partner
                  </div>
                  <div className="text-sm font-medium text-slate-200 mt-1">
                    {activeDeployment.ngoPartnerName || "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeDeployment.staffDeployed || 0} staff deployed
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Patients Served
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                    {activeDeployment.patientsServed?.toLocaleString() || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Budget
                  </div>
                  <div className="text-sm font-mono text-slate-200 mt-1">
                    {activeDeployment.budgetUsed != null &&
                    activeDeployment.budgetAllocated != null
                      ? `${formatCurrency(activeDeployment.budgetUsed)} / ${formatCurrency(activeDeployment.budgetAllocated)}`
                      : "—"}
                  </div>
                  {activeDeployment.budgetAllocated &&
                    activeDeployment.budgetUsed != null && (
                      <div className="mt-1">
                        <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{
                              width: `${Math.min((activeDeployment.budgetUsed / activeDeployment.budgetAllocated) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Voting (if in voting phase) */}
              {activeDeployment.status === "voting" && (
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300">
                      Deployment Vote
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {votePercent(
                        activeDeployment.yesVotes,
                        activeDeployment.totalVotingPower,
                      )}
                      % yes
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="h-full bg-emerald-400"
                        style={{
                          width: `${activeDeployment.totalVotingPower > 0 ? (activeDeployment.yesVotes / activeDeployment.totalVotingPower) * 100 : 0}%`,
                        }}
                      />
                      <div
                        className="h-full bg-red-400"
                        style={{
                          width: `${activeDeployment.totalVotingPower > 0 ? (activeDeployment.noVotes / activeDeployment.totalVotingPower) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span className="text-emerald-400">
                      {activeDeployment.yesVotes.toFixed(1)}% yes
                    </span>
                    <span className="text-red-400">
                      {activeDeployment.noVotes.toFixed(1)}% no
                    </span>
                    <span>
                      {activeDeployment.totalVotingPower.toFixed(1)}% total cast
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => onVote?.(activeDeployment.id, "yes")}
                      className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Vote Yes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onVote?.(activeDeployment.id, "no")}
                      className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1.5" />
                      Vote No
                    </Button>
                  </div>
                </div>
              )}

              {/* Justification */}
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  Justification
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeDeployment.justification}
                </p>
              </div>

              {/* Insurance */}
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] border-0 ${
                    activeDeployment.insuranceStatus === "active"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : activeDeployment.insuranceStatus === "claimed"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                  }`}
                >
                  <Shield className="w-2.5 h-2.5 mr-1" />
                  Insurance: {activeDeployment.insuranceStatus}
                </Badge>
                {activeDeployment.insurancePolicyId && (
                  <span className="text-[10px] font-mono text-slate-500">
                    Policy: {activeDeployment.insurancePolicyId}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/*  Propose New Deployment  */}
        {isEnabled && !activeDeployment && (
          <div>
            {!showProposalForm ? (
              <Button
                onClick={() => setShowProposalForm(true)}
                className="w-full text-sm bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 h-12"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Propose New Humanitarian Deployment
              </Button>
            ) : (
              <Card className="border-rose-500/20 bg-rose-950/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-rose-400">
                      New Deployment Proposal
                    </h3>
                    <button
                      onClick={() => setShowProposalForm(false)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">
                        Region
                      </label>
                      <Input
                        value={formRegion}
                        onChange={(e) => setFormRegion(e.target.value)}
                        placeholder="e.g., East Africa"
                        className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">
                        Country
                      </label>
                      <Input
                        value={formCountry}
                        onChange={(e) => setFormCountry(e.target.value)}
                        placeholder="e.g., Kenya"
                        className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">
                      Justification
                    </label>
                    <Textarea
                      value={formJustification}
                      onChange={(e) => setFormJustification(e.target.value)}
                      placeholder="Describe the humanitarian crisis, medical needs, and expected impact..."
                      rows={4}
                      className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">
                        NGO Partner
                      </label>
                      <select
                        value={formNgo}
                        onChange={(e) => setFormNgo(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                      >
                        <option value="">Select partner...</option>
                        {ngoPartners.map((ngo) => (
                          <option key={ngo.id} value={ngo.id}>
                            {ngo.name} {ngo.verified ? "✓" : ""} (
                            {ngo.activeDeployments} active)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">
                        Risk Level
                      </label>
                      <div className="flex gap-2">
                        {(
                          ["low", "moderate", "high", "extreme"] as RiskLevel[]
                        ).map((r) => {
                          const rc = RISK_CONFIG[r];
                          const RIcon = rc.icon;
                          return (
                            <button
                              key={r}
                              onClick={() => setFormRisk(r)}
                              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                                formRisk === r
                                  ? `${rc.border} ${rc.bg}`
                                  : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <RIcon
                                className={`w-4 h-4 ${formRisk === r ? rc.color : "text-slate-500"}`}
                              />
                              <span className={formRisk === r ? rc.color : ""}>
                                {rc.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        !formRegion ||
                        !formCountry ||
                        !formJustification ||
                        !formNgo
                      }
                      className="text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Submit Proposal
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProposalForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/*  NGO Partners  */}
        {isEnabled && ngoPartners.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              NGO Partners
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ngoPartners.map((ngo) => (
                <Card
                  key={ngo.id}
                  className={`border transition-colors ${
                    ngo.verified
                      ? "border-emerald-500/20 bg-emerald-950/5"
                      : "border-slate-800 bg-slate-950/50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hospital className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-200">
                        {ngo.name}
                      </span>
                      {ngo.verified && (
                        <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-0">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ngo.specializations.map((spec) => (
                        <Badge
                          key={spec}
                          className="text-[9px] bg-slate-800 text-slate-400 border-0"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ngo.activeDeployments} active deployment
                      {ngo.activeDeployments === 1 ? "" : "s"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/*  Deployment History  */}
        {deploymentHistory.length > 0 && (
          <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-200">
                    Deployment History
                  </h3>
                  <Badge className="text-[10px] bg-slate-800 text-slate-400 border-0">
                    {deploymentHistory.length} past
                  </Badge>
                </div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showHistory ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-3"
                  >
                    {deploymentHistory.map((dep) => {
                      const isExpanded = expandedDeployment === dep.id;
                      const status = STATUS_CONFIG[dep.status];
                      const SIcon = status.icon;

                      return (
                        <div
                          key={dep.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden"
                        >
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
                            onClick={() =>
                              setExpandedDeployment(isExpanded ? null : dep.id)
                            }
                          >
                            <div
                              className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}
                            >
                              <SIcon className={`w-4 h-4 ${status.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-200">
                                  {dep.region}
                                </span>
                                <Badge
                                  className={`text-[9px] ${status.bg} ${status.color} border-0`}
                                >
                                  {status.label}
                                </Badge>
                                <Badge
                                  className={`text-[9px] ${RISK_CONFIG[dep.riskLevel].bg} ${RISK_CONFIG[dep.riskLevel].color} border-0`}
                                >
                                  {RISK_CONFIG[dep.riskLevel].label}
                                </Badge>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {dep.country} · {dep.ngoPartnerName} ·{" "}
                                {formatDate(dep.proposedAt)}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-mono text-slate-300">
                                {dep.patientsServed?.toLocaleString() || "—"}{" "}
                                patients
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {dep.budgetUsed != null
                                  ? formatCurrency(dep.budgetUsed)
                                  : "—"}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 pt-1 border-t border-slate-800/50">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                    <div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        Patients
                                      </div>
                                      <div className="text-sm font-mono text-emerald-400">
                                        {dep.patientsServed?.toLocaleString() ||
                                          "—"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        Staff
                                      </div>
                                      <div className="text-sm font-mono text-slate-200">
                                        {dep.staffDeployed || "—"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        Budget Used
                                      </div>
                                      <div className="text-sm font-mono text-slate-200">
                                        {dep.budgetUsed != null
                                          ? formatCurrency(dep.budgetUsed)
                                          : "—"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        Insurance
                                      </div>
                                      <div className="text-sm font-mono text-slate-200">
                                        {dep.insuranceStatus}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-slate-500">
                                    <span className="text-slate-400">
                                      Justification:
                                    </span>{" "}
                                    {dep.justification}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

//  Skeleton
function HumanitarianSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
      <div className="h-24 bg-slate-800 rounded-xl animate-pulse" />
      <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}