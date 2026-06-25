"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  Crown,
  Users,
  MessageSquare,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Lock,
  Unlock,
  Trophy,
  Percent,
  BarChart3,
  TrendingUp,
  X,
  User,
  RefreshCw,
  Landmark,
  Gavel,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// ─── Types ───
export type CabinetRole = "speaker" | "treasurer" | "warden" | "scribe";

export interface ElectionCandidate {
  userId: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  role: CabinetRole;
  nominationStatement: string;
  votesReceived: number;
  voteWeight: number; // ownership % that voted for them
  isIncumbent: boolean;
  nominatedAt: string;
}

export interface CabinetElectionProps {
  hallId: string;
  hallName: string;
  electionId: string;
  status: "nominating" | "voting" | "closed";
  phaseDeadline: string;
  candidates: ElectionCandidate[];
  totalVotingPower: number;
  votesCast: number;
  yourLedgerId?: string;
  yourOwnershipPercent: number;
  hasVoted: boolean;
  yourVotes?: Record<CabinetRole, string>; // role -> candidateId
  isLoading?: boolean;
  onNominate?: (role: CabinetRole, statement: string) => void;
  onVote?: (candidateId: string, role: CabinetRole) => void;
  onCloseElection?: () => void;
}

// ─── Config ───
const ROLE_CONFIG: Record<CabinetRole, {
  label: string; short: string; color: string; bg: string; border: string;
  icon: React.ElementType; description: string;
}> = {
  speaker: {
    label: "The Speaker", short: "SPK", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
    icon: MessageSquare, description: "Voice of the hall. Proposes strategies.",
  },
  treasurer: {
    label: "The Treasurer", short: "TR", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
    icon: FileText, description: "Financial oversight. Revenue reports.",
  },
  warden: {
    label: "The Warden", short: "WRD", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
    icon: Shield, description: "Asset protection. Insurance & maintenance.",
  },
  scribe: {
    label: "The Scribe", short: "SCR", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20",
    icon: FileText, description: "Communications. Reports & messaging.",
  },
};

// ─── Helpers ───
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { expired: true, text: "Closed" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { expired: false, text: `${days}d ${hours}h` };
  if (hours > 0) return { expired: false, text: `${hours}h ${mins}m` };
  return { expired: false, text: `${mins}m` };
}

function votePercent(weight: number, total: number) {
  if (!total) return 0;
  return Math.round((weight / total) * 100);
}

// ─── Component ───
export function CabinetElection({
  hallId,
  hallName,
  electionId,
  status,
  phaseDeadline,
  candidates,
  totalVotingPower,
  votesCast,
  yourLedgerId,
  yourOwnershipPercent,
  hasVoted,
  yourVotes = {},
  isLoading = false,
  onNominate,
  onVote,
  onCloseElection,
}: CabinetElectionProps) {
  const [selectedRole, setSelectedRole] = useState<CabinetRole>("speaker");
  const [showNominate, setShowNominate] = useState(false);
  const [nominationStatement, setNominationStatement] = useState("");
  const [expandedRole, setExpandedRole] = useState<CabinetRole | null>(null);
  const [confirmVote, setConfirmVote] = useState<{ candidateId: string; role: CabinetRole } | null>(null);

  const timer = timeRemaining(phaseDeadline);
  const quorumPct = totalVotingPower > 0 ? (votesCast / totalVotingPower) * 100 : 0;

  const roleCandidates = useMemo(() => {
    const byRole: Record<CabinetRole, ElectionCandidate[]> = {
      speaker: [], treasurer: [], warden: [], scribe: [],
    };
    candidates.forEach((c) => byRole[c.role].push(c));
    Object.keys(byRole).forEach((r) => {
      byRole[r as CabinetRole].sort((a, b) => b.voteWeight - a.voteWeight);
    });
    return byRole;
  }, [candidates]);

  const winners = useMemo(() => {
    const w: Partial<Record<CabinetRole, ElectionCandidate>> = {};
    (Object.keys(roleCandidates) as CabinetRole[]).forEach((role) => {
      const list = roleCandidates[role];
      if (list.length > 0) w[role] = list[0];
    });
    return w;
  }, [roleCandidates]);

  const handleNominate = () => {
    if (!nominationStatement.trim()) return;
    onNominate?.(selectedRole, nominationStatement);
    setShowNominate(false);
    setNominationStatement("");
  };

  const handleVote = (candidateId: string, role: CabinetRole) => {
    onVote?.(candidateId, role);
    setConfirmVote(null);
  };

  if (isLoading) {
    return <ElectionSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Executive Cabinet Election</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Hall #{hallId} · {candidates.length} candidates · {status === "nominating" ? "Nomination Phase" : status === "voting" ? "Voting Phase" : "Election Closed"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={`text-xs ${
              status === "nominating"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : status === "voting"
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            <Clock className="w-3 h-3 mr-1" />
            {timer.expired ? "Closed" : timer.text} remaining
          </Badge>
          <Badge className="text-xs bg-slate-800 text-slate-400 border-0">
            <Percent className="w-3 h-3 mr-1" />
            {quorumPct.toFixed(1)}% quorum
          </Badge>
          {status !== "closed" && onCloseElection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseElection}
              className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
            >
              <Gavel className="w-3.5 h-3.5 mr-1.5" />
              Close Election
            </Button>
          )}
        </div>
      </div>

      {/* ─── Quorum Bar ─── */}
      <Card className="border-slate-800 bg-slate-950/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Participation</span>
            <span className="text-xs font-mono text-slate-300">
              {votesCast.toFixed(1)}% / {totalVotingPower.toFixed(1)}% voting power cast
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(quorumPct, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${quorumPct >= 51 ? "bg-emerald-400" : "bg-cyan-400"}`}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500" style={{ left: "51%" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 whitespace-nowrap">51% quorum</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Nomination Phase ─── */}
      {status === "nominating" && (
        <div>
          {!showNominate ? (
            <Button
              onClick={() => setShowNominate(true)}
              className="w-full text-sm bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 h-12"
            >
              <User className="w-4 h-4 mr-2" />
              Nominate Yourself for a Cabinet Position
            </Button>
          ) : (
            <Card className="border-violet-500/20 bg-violet-950/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-violet-400">Self-Nomination</h3>
                  <button onClick={() => setShowNominate(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Position</label>
                  <div className="flex gap-2">
                    {(["speaker", "treasurer", "warden", "scribe"] as CabinetRole[]).map((role) => {
                      const cfg = ROLE_CONFIG[role];
                      const CIcon = cfg.icon;
                      return (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all ${
                            selectedRole === role
                              ? `${cfg.border} ${cfg.bg}`
                              : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <CIcon className={`w-5 h-5 ${selectedRole === role ? cfg.color : "text-slate-500"}`} />
                          <span className={selectedRole === role ? cfg.color : ""}>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Nomination Statement</label>
                  <Textarea
                    value={nominationStatement}
                    onChange={(e) => setNominationStatement(e.target.value)}
                    placeholder={`Why should the hall elect you as ${ROLE_CONFIG[selectedRole].label}? Describe your qualifications, vision, and commitment...`}
                    rows={4}
                    className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleNominate}
                    disabled={!nominationStatement.trim()}
                    className="text-xs bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit Nomination
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowNominate(false)} className="text-xs text-slate-500 hover:text-slate-300">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── Results (if closed) ─── */}
      {status === "closed" && (
        <Card className="border-emerald-500/20 bg-emerald-950/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-400">Election Results</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["speaker", "treasurer", "warden", "scribe"] as CabinetRole[]).map((role) => {
                const winner = winners[role];
                const cfg = ROLE_CONFIG[role];
                const CIcon = cfg.icon;
                return (
                  <div key={role} className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <CIcon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    {winner ? (
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center text-sm font-bold font-mono ${cfg.color}`}>
                          {winner.displayName?.[0] || winner.ledgerId.slice(-2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">{winner.displayName || winner.ledgerId}</div>
                          <div className="text-xs text-slate-500">
                            {votePercent(winner.voteWeight, totalVotingPower)}% of vote · {winner.votesReceived} votes
                          </div>
                        </div>
                        <Trophy className="w-5 h-5 text-emerald-400 ml-auto" />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">No candidates · Position vacant</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Role Sections ─── */}
      <div className="space-y-4">
        {(["speaker", "treasurer", "warden", "scribe"] as CabinetRole[]).map((role) => {
          const cfg = ROLE_CONFIG[role];
          const CIcon = cfg.icon;
          const list = roleCandidates[role];
          const isExpanded = expandedRole === role;
          const winner = winners[role];
          const yourVote = yourVotes[role];

          return (
            <Card key={role} className={`border overflow-hidden ${cfg.border} ${cfg.bg}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CIcon className={`w-4 h-4 ${cfg.color}`} />
                    <h3 className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</h3>
                    <Badge className="text-[10px] bg-slate-800 text-slate-400 border-0">
                      {list.length} candidate{list.length === 1 ? "" : "s"}
                    </Badge>
                    {winner && status === "closed" && (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-0">
                        <Trophy className="w-2.5 h-2.5 mr-1" />Elected
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedRole(isExpanded ? null : role)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {(isExpanded || status === "voting") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3">
                        {list.length === 0 ? (
                          <div className="text-center py-4 text-sm text-slate-500">
                            No candidates yet for {cfg.label}.
                          </div>
                        ) : (
                          list.map((candidate, index) => {
                            const isWinner = winner?.userId === candidate.userId && status === "closed";
                            const isYourVote = yourVote === candidate.userId;
                            const votePct = votePercent(candidate.voteWeight, totalVotingPower);
                            const isLeading = index === 0 && status !== "closed";

                            return (
                              <div
                                key={candidate.userId}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  isWinner
                                    ? "border-emerald-500/20 bg-emerald-500/5"
                                    : isYourVote
                                    ? "border-cyan-500/20 bg-cyan-500/5"
                                    : "border-slate-800 bg-slate-900/30"
                                }`}
                              >
                                <div className="text-center w-6 shrink-0">
                                  {isWinner ? (
                                    <Trophy className="w-5 h-5 text-emerald-400 mx-auto" />
                                  ) : (
                                    <span className="text-xs font-mono text-slate-600">#{index + 1}</span>
                                  )}
                                </div>

                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold font-mono text-slate-400 shrink-0">
                                  {candidate.avatar ? (
                                    <img src={candidate.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    candidate.displayName?.[0] || candidate.ledgerId.slice(-2)
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-slate-200">
                                      {candidate.displayName || candidate.ledgerId}
                                    </span>
                                    {candidate.isIncumbent && (
                                      <Badge className="text-[9px] bg-slate-800 text-slate-400 border-0">Incumbent</Badge>
                                    )}
                                    {isYourVote && (
                                      <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-0">Your Vote</Badge>
                                    )}
                                    {isLeading && status !== "closed" && (
                                      <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-0">
                                        <TrendingUp className="w-2.5 h-2.5 mr-1" />Leading
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                    {candidate.nominationStatement}
                                  </div>
                                  <div className="mt-2">
                                    <div className="flex justify-between text-[10px] mb-1">
                                      <span className="text-slate-500">{candidate.votesReceived} votes</span>
                                      <span className="font-mono text-slate-300">{votePct}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          isWinner ? "bg-emerald-400" : isYourVote ? "bg-cyan-400" : "bg-slate-500"
                                        }`}
                                        style={{ width: `${votePct}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {status === "voting" && onVote && !hasVoted && (
                                  <Button
                                    size="sm"
                                    onClick={() => setConfirmVote({ candidateId: candidate.userId, role })}
                                    className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 shrink-0"
                                  >
                                    <Vote className="w-3.5 h-3.5 mr-1.5" />
                                    Vote
                                  </Button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isExpanded && status !== "voting" && list.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    Leading: <span className="text-slate-300">{list[0].displayName || list[0].ledgerId}</span>
                    <span className="text-cyan-400 font-mono ml-2">{votePercent(list[0].voteWeight, totalVotingPower)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Vote Confirmation Modal ─── */}
      <AnimatePresence>
        {confirmVote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmVote(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Confirm Your Vote</h3>
              <p className="text-xs text-slate-500 mb-4">
                You are voting for{" "}
                <span className="text-slate-300 font-medium">
                  {candidates.find((c) => c.userId === confirmVote.candidateId)?.displayName || "Candidate"}
                </span>{" "}
                as <span className={ROLE_CONFIG[confirmVote.role].color}>{ROLE_CONFIG[confirmVote.role].label}</span>.
                Your vote carries <span className="text-cyan-400 font-mono">{yourOwnershipPercent.toFixed(2)}%</span> weight.
                This vote is final.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleVote(confirmVote.candidateId, confirmVote.role)}
                  className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 flex-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Confirm Vote
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmVote(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Voted State ─── */}
      {hasVoted && status === "voting" && (
        <Card className="border-emerald-500/20 bg-emerald-950/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-medium text-emerald-400">You have voted</div>
              <div className="text-xs text-slate-500">
                Your <span className="font-mono text-cyan-400">{yourOwnershipPercent.toFixed(2)}%</span> weight has been recorded.
                Results will be announced when the election closes.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Skeleton ───
function ElectionSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-56 bg-slate-800 rounded animate-pulse" />
      <div className="h-16 bg-slate-800 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}