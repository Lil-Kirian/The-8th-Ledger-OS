"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Users, MessageSquare, FileText, Shield, Gavel,
  ChevronDown, ChevronUp, Clock, CheckCircle2, Vote,
  Lock, Unlock, RefreshCw, User,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type CabinetRole = "speaker" | "treasurer" | "warden" | "scribe";

export interface CabinetMember {
  userId: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  role: CabinetRole;
  electedAt: string;
  expiresAt: string;
  ownershipPercent: number;
  sriContribution: number;
  votesReceived: number;
  totalVoters: number;
  proposalsCreated: number;
  reportsSubmitted: number;
  isPrimaryAdmin: boolean;
}

export interface ExecutiveCabinetProps {
  hallId: string;
  hallName: string;
  members: CabinetMember[];
  isElectionOpen: boolean;
  electionDeadline?: string;
  candidates?: { userId: string; ledgerId: string; displayName?: string; role: CabinetRole; votes: number }[];
  isLoading?: boolean;
  isPrimaryAdmin: boolean;
  yourLedgerId?: string;
  onVote?: (candidateId: string, role: CabinetRole) => void;
  onImpeach?: (memberId: string, role: CabinetRole) => void;
  onCallElection?: () => void;
  onNominate?: (role: CabinetRole) => void;
}

const ROLE_CONFIG: Record<CabinetRole, {
  label: string; short: string; color: string; bg: string; border: string;
  icon: React.ElementType; description: string; powers: string[]; limits: string[];
}> = {
  speaker: {
    label: "The Speaker", short: "SPK", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
    icon: MessageSquare,
    description: "Voice of the hall. Proposes strategies and appeals to the 8th Ledger.",
    powers: ["Propose strategy votes", "Appeal to 8th Ledger for execution", "Call emergency sessions"],
    limits: ["Cannot spend hall money", "Cannot approve proposals alone", "All actions require hall vote"],
  },
  treasurer: {
    label: "The Treasurer", short: "TR", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
    icon: FileText,
    description: "Financial oversight. Reviews revenue, flags anomalies, holds one multi-sig key.",
    powers: ["Read-only treasury access", "Submit monthly revenue reports", "Flag financial anomalies"],
    limits: ["Cannot spend or transfer funds", "Cannot approve budgets", "One of multiple signatories"],
  },
  warden: {
    label: "The Warden", short: "WRD", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
    icon: Shield,
    description: "Asset protection. Monitors insurance, maintenance, security, and staffing levels.",
    powers: ["Propose maintenance votes", "Request insurance reviews", "Monitor asset health metrics"],
    limits: ["Cannot authorize repairs alone", "Cannot hire/fire directly", "All staffing via hall vote"],
  },
  scribe: {
    label: "The Scribe", short: "SCR", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20",
    icon: FileText,
    description: "Communications. Publishes reports, coordinates messaging, manages the Sovereign Stream.",
    powers: ["Publish official reports", "Coordinate hall messaging", "Manage Sovereign Stream posts"],
    limits: ["Cannot spend on marketing", "Cannot contract vendors", "All comms proposals need vote"],
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function termPercent(electedAt: string, expiresAt: string) {
  const total = new Date(expiresAt).getTime() - new Date(electedAt).getTime();
  const elapsed = Date.now() - new Date(electedAt).getTime();
  if (total <= 0) return 100;
  return Math.min(Math.round((elapsed / total) * 100), 100);
}

export function ExecutiveCabinet({
  hallId, hallName, members, isElectionOpen, electionDeadline,
  candidates = [], isLoading = false, isPrimaryAdmin, yourLedgerId,
  onVote, onImpeach, onCallElection, onNominate,
}: ExecutiveCabinetProps) {
  const [expandedRole, setExpandedRole] = useState<CabinetRole | null>(null);
  const [confirmImpeach, setConfirmImpeach] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Executive Cabinet</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {members.length}/4 elected · 6-month term · Hall #{hallId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isElectionOpen ? (
            <Badge className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              <Vote className="w-3 h-3 mr-1" />
              Election Open
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onCallElection}
              className="text-xs bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Call Election
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(["speaker", "treasurer", "warden", "scribe"] as CabinetRole[]).map((role) => {
          const member = members.find((m) => m.role === role);
          const cfg = ROLE_CONFIG[role];
          const RoleIcon = cfg.icon;
          const isExpanded = expandedRole === role;
          const isVacant = !member;
          const daysLeft = member ? daysRemaining(member.expiresAt) : 0;
          const termPct = member ? termPercent(member.electedAt, member.expiresAt) : 0;

          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ["speaker", "treasurer", "warden", "scribe"].indexOf(role) * 0.1 }}
            >
              <Card
                className={`border overflow-hidden transition-colors ${
                  isVacant
                    ? "border-slate-800 bg-slate-950/30 border-dashed"
                    : `${cfg.border} ${cfg.bg}`
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <RoleIcon className={`w-6 h-6 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                        <Badge className="text-[10px] bg-slate-800 text-slate-400 border-0">{cfg.short}</Badge>
                        {isVacant ? (
                          <Badge className="text-[10px] bg-slate-800 text-slate-500 border-0">Vacant</Badge>
                        ) : (
                          <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-0`}>
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{cfg.description}</p>
                    </div>
                    <button
                      onClick={() => setExpandedRole(isExpanded ? null : role)}
                      className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {member ? (
                    <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                      <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center text-sm font-bold font-mono ${cfg.color}`}>
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.displayName?.[0] || member.ledgerId.slice(-2)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">{member.displayName || member.ledgerId}</span>
                          {member.isPrimaryAdmin && (
                            <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-0">
                              <Crown className="w-2 h-2 mr-1" />8th Ledger
                            </Badge>
                          )}
                          {member.ledgerId === yourLedgerId && (
                            <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-0">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="font-mono">{member.ledgerId}</span>
                          <span className="text-cyan-400 font-mono">{member.ownershipPercent.toFixed(2)}%</span>
                          <span>SRI {member.sriContribution}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono text-slate-300">{daysLeft}d left</div>
                        <div className="text-[10px] text-slate-500">of term</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-slate-800 bg-slate-900/20 text-center">
                      <div className="text-sm text-slate-500 mb-2">Position vacant</div>
                      {onNominate && (
                        <Button
                          size="sm"
                          onClick={() => onNominate(role)}
                          className={`text-xs ${cfg.bg} ${cfg.color} hover:opacity-80 border ${cfg.border}`}
                        >
                          <User className="w-3.5 h-3.5 mr-1.5" />
                          Nominate for {cfg.label}
                        </Button>
                      )}
                    </div>
                  )}

                  {member && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">Term progress</span>
                        <span className="text-slate-400">{termPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.color.replace("text-", "bg-")}`} style={{ width: `${termPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>Elected {formatDate(member.electedAt)}</span>
                        <span>Expires {formatDate(member.expiresAt)}</span>
                      </div>
                    </div>
                  )}

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
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Powers</div>
                            <div className="space-y-1.5">
                              {cfg.powers.map((power, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <CheckCircle2 className={`w-3.5 h-3.5 ${cfg.color} shrink-0 mt-0.5`} />
                                  <span className="text-slate-300">{power}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Limits</div>
                            <div className="space-y-1.5">
                              {cfg.limits.map((limit, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <Lock className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                  <span className="text-slate-400">{limit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {member && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                                <div className="text-lg font-mono font-bold text-slate-200">{member.proposalsCreated}</div>
                                <div className="text-[10px] text-slate-500">Proposals</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                                <div className="text-lg font-mono font-bold text-slate-200">{member.reportsSubmitted}</div>
                                <div className="text-[10px] text-slate-500">Reports</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                                <div className="text-lg font-mono font-bold text-slate-200">
                                  {member.totalVoters > 0 ? Math.round((member.votesReceived / member.totalVoters) * 100) : 0}%
                                </div>
                                <div className="text-[10px] text-slate-500">Vote share</div>
                              </div>
                            </div>
                          )}
                          {member && onImpeach && (
                            <div className="pt-2">
                              {!confirmImpeach ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConfirmImpeach(member.userId)}
                                  className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                                >
                                  <Gavel className="w-3.5 h-3.5 mr-1.5" />
                                  Propose Impeachment
                                </Button>
                              ) : (
                                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                  <div className="text-xs text-red-400 mb-2">
                                    Confirm impeachment of {member.displayName || member.ledgerId}?
                                    This requires 51% hall vote.
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => { onImpeach(member.userId, role); setConfirmImpeach(null); }}
                                      className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                    >
                                      <Gavel className="w-3.5 h-3.5 mr-1.5" />Confirm
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setConfirmImpeach(null)}
                                      className="text-xs text-slate-500 hover:text-slate-300"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {isElectionOpen && (
        <Card className="border-cyan-500/20 bg-cyan-950/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-cyan-400">Active Election</h3>
              {electionDeadline && (
                <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-0">
                  <Clock className="w-2.5 h-2.5 mr-1" />
                  {daysRemaining(electionDeadline)}d remaining
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">No candidates yet. Nominate yourself or others.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate) => {
                  const cfg = ROLE_CONFIG[candidate.role];
                  const CIcon = cfg.icon;
                  return (
                    <div key={candidate.userId} className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                      <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center text-sm font-bold font-mono ${cfg.color}`}>
                        {candidate.displayName?.[0] || candidate.ledgerId.slice(-2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">{candidate.displayName || candidate.ledgerId}</span>
                          <Badge className={`text-[9px] ${cfg.bg} ${cfg.color} border-0`}>
                            <CIcon className="w-2.5 h-2.5 mr-1" />{cfg.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <span className="font-mono">{candidate.ledgerId}</span>
                          <span className="text-slate-700"> · </span>
                          <span>{candidate.votes} votes</span>
                        </div>
                      </div>
                      {onVote && (
                        <Button
                          size="sm"
                          onClick={() => onVote(candidate.userId, candidate.role)}
                          className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
                        >
                          <Vote className="w-3.5 h-3.5 mr-1.5" />Vote
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}