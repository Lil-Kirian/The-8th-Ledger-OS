"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel, Ban, Shield, CheckCircle2, X,
  Users, Vote, FileText, ChevronDown, ChevronUp,
  Unlock, History, Eye, Crown,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

//  Types
export type BanStatus = "proposed" | "voting" | "enforced" | "appealed" | "lifted" | "rejected";
export type BanDuration = "7d" | "30d" | "90d" | "1y" | "permanent";

export interface BanEvidence {
  id: string;
  type: "message" | "report" | "screenshot" | "witness";
  description: string;
  submittedBy: string;
  submittedAt: string;
}

export interface BanProposal {
  id: string;
  targetLedgerId: string;
  targetName?: string;
  proposedBy: string;
  proposedByLedgerId: string;
  proposedAt: string;
  reason: string;
  duration: BanDuration;
  status: BanStatus;
  yesVotes: number;
  noVotes: number;
  totalVotingPower: number;
  voteDeadline?: string;
  evidence: BanEvidence[];
  enforcedAt?: string;
  liftedAt?: string;
  liftReason?: string;
  isPrimaryAdmin: boolean;
}

export interface BanPanelProps {
  hallId: string;
  hallName: string;
  proposals: BanProposal[];
  isLoading?: boolean;
  isPrimaryAdmin: boolean;
  isSpeaker: boolean;
  yourOwnershipPercent: number;
  onProposeBan?: (data: { targetLedgerId: string; reason: string; duration: BanDuration }) => void;
  onVote?: (proposalId: string, vote: "yes" | "no") => void;
  onLiftBan?: (proposalId: string, reason: string) => void;
  onSubmitEvidence?: (proposalId: string, evidence: Omit<BanEvidence, "id" | "submittedAt">) => void;
}

//  Config
const STATUS_CONFIG: Record<BanStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  proposed:  { label: "Proposed",  color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: FileText },
  voting:    { label: "Voting",    color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    icon: Vote },
  enforced:  { label: "Enforced",  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     icon: Ban },
  appealed:  { label: "Appealed",  color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  icon: MessageSquare },
  lifted:    { label: "Lifted",    color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20",  icon: Unlock },
  rejected:  { label: "Rejected",  color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-700",       icon: X },
};

const DURATION_CONFIG: Record<BanDuration, { label: string; days: number | null; color: string }> = {
  "7d":       { label: "7 Days",       days: 7,    color: "text-amber-400" },
  "30d":      { label: "30 Days",      days: 30,   color: "text-orange-400" },
  "90d":      { label: "90 Days",      days: 90,   color: "text-red-400" },
  "1y":       { label: "1 Year",       days: 365,  color: "text-red-400" },
  permanent:  { label: "Permanent",    days: null, color: "text-red-500" },
};

const EVIDENCE_TYPES = [
  { key: "message" as const, label: "Message", icon: MessageSquare },
  { key: "report" as const, label: "Report", icon: FileText },
  { key: "screenshot" as const, label: "Screenshot", icon: Eye },
  { key: "witness" as const, label: "Witness", icon: Users },
];

//  Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function votePercent(yes: number, total: number) {
  if (!total) return 0;
  return Math.round((yes / total) * 100);
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

//  Component
export function BanPanel({
  hallId,
  hallName,
  proposals,
  isLoading = false,
  isPrimaryAdmin,
  isSpeaker,
  yourOwnershipPercent,
  onProposeBan,
  onVote,
  onLiftBan,
  onSubmitEvidence,
}: BanPanelProps) {
  const [showPropose, setShowPropose] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [showEvidenceForm, setShowEvidenceForm] = useState<string | null>(null);

  const [targetId, setTargetId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<BanDuration>("30d");

  const [evidenceType, setEvidenceType] = useState<BanEvidence["type"]>("message");
  const [evidenceDesc, setEvidenceDesc] = useState("");

  const canPropose = isPrimaryAdmin || isSpeaker;
  const activeBans = proposals.filter((p) => p.status === "enforced" || p.status === "appealed");
  const votingBans = proposals.filter((p) => p.status === "voting");
  const pastBans = proposals.filter((p) => ["lifted", "rejected"].includes(p.status));

  const handlePropose = () => {
    if (!targetId || !banReason) return;
    onProposeBan?.({ targetLedgerId: targetId, reason: banReason, duration: banDuration });
    setShowPropose(false);
    setTargetId("");
    setBanReason("");
    setBanDuration("30d");
  };

  const handleEvidence = (proposalId: string) => {
    if (!evidenceDesc) return;
    onSubmitEvidence?.(proposalId, { type: evidenceType, description: evidenceDesc, submittedBy: "You" });
    setShowEvidenceForm(null);
    setEvidenceDesc("");
    setEvidenceType("message");
  };

  if (isLoading) {
    return <BanSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Tribunal & Enforcement</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeBans.length} active · {votingBans.length} voting · {pastBans.length} resolved
          </p>
        </div>
        {canPropose && (
          <Button
            onClick={() => setShowPropose(!showPropose)}
            className={`text-xs ${
              showPropose
                ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            }`}
          >
            {showPropose ? <X className="w-3.5 h-3.5 mr-1.5" /> : <Gavel className="w-3.5 h-3.5 mr-1.5" />}
            {showPropose ? "Cancel" : "Propose Ban"}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showPropose && canPropose && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Card className="border-red-500/20 bg-red-950/5">
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-red-400">Propose Ban / Suspension</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Target Ledger ID</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder="LED-XXXX-XXXX"
                        className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 font-mono placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Duration</label>
                    <div className="flex gap-2">
                      {(["7d", "30d", "90d", "1y", "permanent"] as BanDuration[]).map((d) => {
                        const dc = DURATION_CONFIG[d];
                        return (
                          <button
                            key={d}
                            onClick={() => setBanDuration(d)}
                            className={`flex-1 px-2 py-2 rounded-lg border text-xs transition-all ${
                              banDuration === d
                                ? "border-red-500/30 bg-red-500/10 text-red-400"
                                : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {dc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Reason / Evidence Summary</label>
                  <Textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Describe the violation, provide context, and cite any rules broken..."
                    rows={4}
                    className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePropose}
                    disabled={!targetId || !banReason}
                    className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-40"
                  >
                    <Gavel className="w-3.5 h-3.5 mr-1.5" />
                    Submit to Tribunal
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPropose(false)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {activeBans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Active Enforcements
          </h3>
          <div className="space-y-3">
            {activeBans.map((proposal) => (
              <BanCard
                key={proposal.id}
                proposal={proposal}
                isExpanded={expandedProposal === proposal.id}
                onToggle={() => setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)}
                onVote={onVote}
                onLiftBan={onLiftBan}
                onShowEvidence={() => setShowEvidenceForm(showEvidenceForm === proposal.id ? null : proposal.id)}
                yourOwnershipPercent={yourOwnershipPercent}
                isPrimaryAdmin={isPrimaryAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {votingBans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            <Vote className="w-4 h-4" />
            Under Vote
          </h3>
          <div className="space-y-3">
            {votingBans.map((proposal) => (
              <BanCard
                key={proposal.id}
                proposal={proposal}
                isExpanded={expandedProposal === proposal.id}
                onToggle={() => setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)}
                onVote={onVote}
                onLiftBan={onLiftBan}
                onShowEvidence={() => setShowEvidenceForm(showEvidenceForm === proposal.id ? null : proposal.id)}
                yourOwnershipPercent={yourOwnershipPercent}
                isPrimaryAdmin={isPrimaryAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {pastBans.length > 0 && (
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-200">Tribunal History</h3>
              <Badge className="text-[10px] bg-slate-800 text-slate-400 border-0">
                {pastBans.length} resolved
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastBans.map((proposal) => {
              const status = STATUS_CONFIG[proposal.status];
              const SIcon = status.icon;
              const dc = DURATION_CONFIG[proposal.duration];
              return (
                <div
                  key={proposal.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/20 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}>
                    <SIcon className={`w-4 h-4 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200">
                        {proposal.targetName || proposal.targetLedgerId}
                      </span>
                      <Badge className={`text-[9px] ${status.bg} ${status.color} border-0`}>
                        {status.label}
                      </Badge>
                      <Badge className="text-[9px] bg-slate-800 text-slate-400 border-0">
                        {dc.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Proposed by {proposal.proposedBy || proposal.proposedByLedgerId} ·{" "}
                      {formatDate(proposal.proposedAt)}
                      {proposal.liftedAt && ` · Lifted ${formatDate(proposal.liftedAt)}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono text-slate-400">
                      {votePercent(proposal.yesVotes, proposal.totalVotingPower)}% voted yes
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!isLoading && proposals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">No tribunal cases</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            The tribunal is clear. Ban proposals require Speaker or 8th Ledger initiation, followed by hall vote.
          </p>
        </div>
      )}
    </div>
  );
}

function BanCard({
  proposal,
  isExpanded,
  onToggle,
  onVote,
  onLiftBan,
  onShowEvidence,
  isPrimaryAdmin,
}: {
  proposal: BanProposal;
  isExpanded: boolean;
  onToggle: () => void;
  onVote?: (proposalId: string, vote: "yes" | "no") => void;
  onLiftBan?: (proposalId: string, reason: string) => void;
  onShowEvidence: () => void;
  isPrimaryAdmin: boolean;
}) {
  const status = STATUS_CONFIG[proposal.status];
  const SIcon = status.icon;
  const dc = DURATION_CONFIG[proposal.duration];
  const votePct = votePercent(proposal.yesVotes, proposal.totalVotingPower);
  const [liftReason, setLiftReason] = useState("");
  const [showLiftForm, setShowLiftForm] = useState(false);

  return (
    <Card className={`border overflow-hidden ${status.border} ${status.bg}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}>
            <SIcon className={`w-5 h-5 ${status.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-200">
                {proposal.targetName || proposal.targetLedgerId}
              </span>
              <Badge className={`text-[10px] ${status.bg} ${status.color} border-0`}>
                {status.label}
              </Badge>
              <Badge className={`text-[10px] bg-slate-800 text-slate-400 border-0`}>
                {dc.label}
              </Badge>
              {proposal.isPrimaryAdmin && (
                <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-0">
                  <Crown className="w-2.5 h-2.5 mr-1" />
                  8th Ledger
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Proposed by {proposal.proposedBy || proposal.proposedByLedgerId} ·{" "}
              {formatDate(proposal.proposedAt)}
              {proposal.enforcedAt && ` · Enforced ${formatDate(proposal.enforcedAt)}`}
              {proposal.enforcedAt && proposal.duration !== "permanent" && (
                <span className="text-red-400"> · {daysSince(proposal.enforcedAt)}d served</span>
              )}
            </div>
          </div>

          {proposal.status === "voting" && (
            <div className="hidden sm:block w-28 shrink-0">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-500">{votePct}% yes</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="flex h-full">
                  <div className="h-full bg-emerald-400" style={{ width: `${votePct}%` }} />
                  <div
                    className="h-full bg-red-400"
                    style={{ width: `${proposal.totalVotingPower > 0 ? (proposal.noVotes / proposal.totalVotingPower) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {proposal.status === "voting" && onVote && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(proposal.id, "yes");
                  }}
                  className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 h-7 px-2"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Yes
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(proposal.id, "no");
                  }}
                  className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 h-7 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  No
                </Button>
              </div>
            )}
            <button onClick={onToggle} className="text-slate-500 hover:text-slate-300 transition-colors">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Reason</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{proposal.reason}</p>
                </div>

                {proposal.evidence.length > 0 && (
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Evidence ({proposal.evidence.length})</div>
                    <div className="space-y-2">
                      {proposal.evidence.map((ev) => {
                        const et = EVIDENCE_TYPES.find((t) => t.key === ev.type);
                        const EIcon = et?.icon || FileText;
                        return (
                          <div key={ev.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                            <EIcon className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-xs text-slate-300">{ev.description}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Submitted by {ev.submittedBy} · {formatDate(ev.submittedAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {proposal.status !== "lifted" && proposal.status !== "rejected" && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowEvidence}
                      className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Submit Evidence
                    </Button>
                  </div>
                )}

                {proposal.status === "enforced" && isPrimaryAdmin && (
                  <div>
                    {!showLiftForm ? (
                      <Button
                        size="sm"
                        onClick={() => setShowLiftForm(true)}
                        className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                      >
                        <Unlock className="w-3.5 h-3.5 mr-1.5" />
                        Lift Ban
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Textarea
                          value={liftReason}
                          onChange={(e) => setLiftReason(e.target.value)}
                          placeholder="Reason for lifting the ban..."
                          rows={2}
                          className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 resize-none text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              onLiftBan?.(proposal.id, liftReason);
                              setShowLiftForm(false);
                              setLiftReason("");
                            }}
                            disabled={!liftReason}
                            className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-40"
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1.5" />
                            Confirm Lift
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLiftForm(false)}
                            className="text-xs text-slate-500 hover:text-slate-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Yes Votes</div>
                    <div className="font-mono text-emerald-400">{proposal.yesVotes.toFixed(1)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] text-slate-500">No Votes</div>
                    <div className="font-mono text-red-400">{proposal.noVotes.toFixed(1)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Total Power</div>
                    <div className="font-mono text-slate-300">{proposal.totalVotingPower.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function BanSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}