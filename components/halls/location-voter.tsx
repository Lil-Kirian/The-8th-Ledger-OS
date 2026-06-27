"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Vote,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  TrendingUp,
  Landmark,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ───
export type VerticalKey =
  | "ledgerprop"
  | "ledgerauto"
  | "ledgertech"
  | "ledgeredu"
  | "ledgerhealth"
  | "ledgerbiz"
  | "ledgertravel"
  | "ledgeragri"
  | "ledgerenergy"
  | "ledgeraccess";

export interface LocationMetric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  rating: "excellent" | "good" | "fair" | "poor";
  icon: React.ElementType;
}

export interface LocationOption {
  id: string;
  name: string;
  description: string;
  region: string;
  country: string;
  coordinates: { lat: number; lng: number };
  image?: string;
  metrics: LocationMetric[];
  voteCount: number;
  voteWeight: number; // ownership % that voted
  totalVoters: number;
  estimatedAssetValue: number;
  estimatedRevenue: number;
  riskLevel: "low" | "moderate" | "high" | "extreme";
}

export interface LocationVoterProps {
  hallId: string;
  hallName: string;
  vertical: VerticalKey;
  options: LocationOption[];
  totalOwnershipVotingPower: number; // sum of all ownership %
  yourOwnershipPercent: number;
  yourVote?: string | null; // optionId you voted for
  voteDeadline: string; // ISO
  isLoading?: boolean;
  onVote?: (optionId: string) => void;
  onViewMap?: () => void;
}

// ─── Config ───
const QUORUM_PERCENT = 51;

const RISK_CONFIG = {
  low:     { label: "Low",      color: "text-emerald-400",  bg: "bg-emerald-500/10",  border: "border-emerald-500/20" },
  moderate:{ label: "Moderate", color: "text-amber-400",    bg: "bg-amber-500/10",    border: "border-amber-500/20" },
  high:    { label: "High",     color: "text-orange-400",   bg: "bg-orange-500/10",   border: "border-orange-500/20" },
  extreme: { label: "Extreme",  color: "text-red-400",      bg: "bg-red-500/10",      border: "border-red-500/20" },
};

const RATING_CONFIG = {
  excellent: { color: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-400" },
  good:      { color: "text-blue-400",    bg: "bg-blue-500/10",    bar: "bg-blue-400" },
  fair:      { color: "text-amber-400",   bg: "bg-amber-500/10",   bar: "bg-amber-400" },
  poor:      { color: "text-red-400",     bg: "bg-red-500/10",     bar: "bg-red-400" },
};

const VERTICAL_LABELS: Record<VerticalKey, string> = {
  ledgerprop: "LedgerProp", ledgerauto: "LedgerAuto", ledgertech: "LedgerTech",
  ledgeredu: "LedgerEdu", ledgerhealth: "LedgerHealth", ledgerbiz: "LedgerBiz",
  ledgertravel: "LedgerTravel", ledgeragri: "LedgerAgri", ledgerenergy: "LedgerEnergy",
  ledgeraccess: "LedgerAccess",
};

// ─── Helpers ───
function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function timeRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { expired: true, text: "Voting closed" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { expired: false, text: `${days}d ${hours}h remaining` };
  if (hours > 0) return { expired: false, text: `${hours}h ${mins}m remaining` };
  return { expired: false, text: `${mins}m remaining` };
}

// ─── Component ───
export function LocationVoter({
  hallId,
  hallName,
  vertical,
  options,
  totalOwnershipVotingPower,
  yourOwnershipPercent,
  yourVote,
  voteDeadline,
  isLoading = false,
  onVote,
  onViewMap,
}: LocationVoterProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [confirmVote, setConfirmVote] = useState<string | null>(null);

  const timer = timeRemaining(voteDeadline);
  const totalVotesCast = options.reduce((s, o) => s + o.voteWeight, 0);
  const quorumReached = totalVotesCast >= (totalOwnershipVotingPower * QUORUM_PERCENT) / 100;
  const quorumPercent = totalOwnershipVotingPower > 0 ? (totalVotesCast / totalOwnershipVotingPower) * 100 : 0;

  const leadingOption = useMemo(() => {
    if (!options.length) return null;
    return options.reduce((max, o) => (o.voteWeight > max.voteWeight ? o : max), options[0]);
  }, [options]);

  if (isLoading) {
    return <LocationVoterSkeleton />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Location Selection</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {VERTICAL_LABELS[vertical]} · {options.length} options · Vote by ownership weight
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`text-xs ${
                quorumReached
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <Vote className="w-3 h-3 mr-1" />
              {quorumReached ? "Quorum Reached" : `Quorum: ${quorumPercent.toFixed(1)}% / ${QUORUM_PERCENT}%`}
            </Badge>
            <Badge
              className={`text-xs ${
                timer.expired
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {timer.text}
            </Badge>
            {onViewMap && (
              <Button variant="outline" size="sm" onClick={onViewMap} className="text-xs border-slate-700 text-slate-400 hover:text-slate-200">
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                Map
              </Button>
            )}
          </div>
        </div>

        {/* ─── Quorum Progress ─── */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Vote Progress</span>
              <span className="text-xs font-mono text-slate-300">
                {totalVotesCast.toFixed(1)}% / {QUORUM_PERCENT}% required
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(quorumPercent, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${quorumReached ? "bg-emerald-400" : "bg-amber-400"}`}
              />
              {/* Quorum marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-500"
                style={{ left: `${QUORUM_PERCENT}%` }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 whitespace-nowrap">
                  51% quorum
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
              <span>{options.reduce((s, o) => s + o.totalVoters, 0)} sovereigns voted</span>
              <span>Your weight: {yourOwnershipPercent.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* ─── Live Tally ─── */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">Live Vote Tally</h3>
              {leadingOption && (
                <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-0 ml-auto">
                  <TrendingUp className="w-2.5 h-2.5 mr-1" />
                  Leading: {leadingOption.name}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map((option) => {
              const votePct = totalOwnershipVotingPower > 0 ? (option.voteWeight / totalOwnershipVotingPower) * 100 : 0;
              const isLeading = leadingOption?.id === option.id;
              const isYourVote = yourVote === option.id;

              return (
                <div key={option.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-300">{option.name}</span>
                      {isLeading && (
                        <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-0">
                          <TrendingUp className="w-2.5 h-2.5 mr-1" />
                          Leading
                        </Badge>
                      )}
                      {isYourVote && (
                        <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-0">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          Your Vote
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">{votePct.toFixed(1)}%</span>
                      <span className="text-slate-500">({option.totalVoters} voters)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${votePct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        isYourVote
                          ? "bg-emerald-400"
                          : isLeading
                          ? "bg-cyan-400"
                          : "bg-slate-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ─── Location Options ─── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Location Options
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {options.map((option) => {
              const isExpanded = expandedOption === option.id;
              const isYourVote = yourVote === option.id;
              const risk = RISK_CONFIG[option.riskLevel];
              const votePct = totalOwnershipVotingPower > 0 ? (option.voteWeight / totalOwnershipVotingPower) * 100 : 0;

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`border transition-colors overflow-hidden ${
                      isYourVote
                        ? "border-emerald-500/30 bg-emerald-950/5"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    {/* Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedOption(isExpanded ? null : option.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Image or Map Placeholder */}
                        <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {option.image ? (
                            <img src={option.image} alt={option.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <MapPin className="w-6 h-6 text-slate-600" />
                              <span className="text-[9px] text-slate-600 font-mono">
                                {option.coordinates.lat.toFixed(2)}, {option.coordinates.lng.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {isYourVote && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-slate-950" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-semibold text-slate-200">{option.name}</h4>
                            <Badge className={`text-[10px] ${risk.bg} ${risk.color} border-0`}>
                              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                              {risk.label} Risk
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {option.region}, {option.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Landmark className="w-3 h-3" />
                              {formatCompact(option.estimatedAssetValue)} est. value
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {formatCompact(option.estimatedRevenue)} est. revenue
                            </span>
                          </div>
                        </div>

                        {/* Vote + Expand */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-mono font-bold text-slate-200">
                              {votePct.toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-slate-500">{option.totalVoters} votes</div>
                          </div>
                          {!timer.expired && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isYourVote) return;
                                setConfirmVote(confirmVote === option.id ? null : option.id);
                              }}
                              className={`text-xs ${
                                isYourVote
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default"
                                  : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
                              }`}
                              disabled={isYourVote || timer.expired}
                            >
                              {isYourVote ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                  Voted
                                </>
                              ) : (
                                <>
                                  <Vote className="w-3.5 h-3.5 mr-1.5" />
                                  Vote
                                </>
                              )}
                            </Button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Confirmation */}
                    <AnimatePresence>
                      {confirmVote === option.id && !timer.expired && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-800/50"
                        >
                          <div className="p-4 bg-cyan-950/10">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-200">
                                  Confirm your vote for {option.name}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Your vote carries <span className="font-mono text-cyan-400">{yourOwnershipPercent.toFixed(2)}%</span> weight.
                                  This vote is final and cannot be changed.
                                </p>
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      onVote?.(option.id);
                                      setConfirmVote(null);
                                    }}
                                    className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
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
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expanded Metrics */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-slate-800/50">
                            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                              Location Data Grid
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              {option.metrics.map((metric) => {
                                const MetricIcon = metric.icon;
                                const rating = RATING_CONFIG[metric.rating];

                                return (
                                  <Tooltip key={metric.key}>
                                    <TooltipTrigger asChild>
                                      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 cursor-help hover:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                          <MetricIcon className={`w-4 h-4 ${rating.color}`} />
                                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                            {metric.label}
                                          </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-lg font-mono font-bold text-slate-200">
                                            {metric.value}
                                          </span>
                                          {metric.unit && (
                                            <span className="text-xs text-slate-500">{metric.unit}</span>
                                          )}
                                        </div>
                                        <div className="mt-2">
                                          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full ${rating.bar}`}
                                              style={{
                                                width:
                                                  metric.rating === "excellent"
                                                    ? "100%"
                                                    : metric.rating === "good"
                                                    ? "75%"
                                                    : metric.rating === "fair"
                                                    ? "50%"
                                                    : "25%",
                                              }}
                                            />
                                          </div>
                                          <div className={`text-[10px] mt-1 ${rating.color}`}>
                                            {metric.rating}
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="bottom"
                                      className="bg-slate-900 border-slate-800 p-3 max-w-xs"
                                    >
                                      <div className="text-xs text-slate-300">
                                        <span className="font-semibold">{metric.label}:</span>{" "}
                                        {metric.value} {metric.unit || ""}
                                      </div>
                                      <div className={`text-xs mt-1 ${rating.color}`}>
                                        Rating: {metric.rating}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>

                            {/* Financial Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Asset Value</div>
                                <div className="text-lg font-mono font-bold text-slate-200 mt-1">
                                  {formatCurrency(option.estimatedAssetValue)}
                                </div>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Annual Revenue</div>
                                <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                                  {formatCurrency(option.estimatedRevenue)}
                                </div>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Risk Level</div>
                                <div className={`text-lg font-bold mt-1 ${risk.color}`}>{risk.label}</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ─── Closed State ─── */}
        {timer.expired && leadingOption && (
          <Card className="border-emerald-500/20 bg-emerald-950/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-emerald-400">
                    Voting Complete — Winner Selected
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-300">{leadingOption.name}</span> won with{" "}
                    <span className="font-mono text-cyan-400">
                      {totalOwnershipVotingPower > 0
                        ? ((leadingOption.voteWeight / totalOwnershipVotingPower) * 100).toFixed(1)
                        : "0"}
                      %
                    </span>{" "}
                    of the vote.
                    {quorumReached
                      ? " Quorum was reached. The 8th Ledger will now proceed with acquisition."
                      : " Quorum was not reached. The Architect's Hand will apply the tiebreaker."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Skeleton ───
function LocationVoterSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="h-24 bg-slate-800 rounded-xl animate-pulse" />
      <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}