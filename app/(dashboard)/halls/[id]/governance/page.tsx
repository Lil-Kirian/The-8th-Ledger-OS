"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp, Hexagon, Plane,
  Sprout, Sun, Users, X,
  Shield, Clock, Star, TrendingUp as TrendIcon, Crown as CrownIcon,
  Flame as FlameIcon, Diamond, Zap as ZapIcon,
  AlertTriangle, CheckCircle2, Gavel,
  PieChart, Search, ChevronLeft, ChevronUp,
  FileText, Plus,
  MapPin, ChevronDown, Timer, RefreshCw, Check, XCircle,
  Wrench, DollarSign, UserX, UserCheck, MapPinned, ShoppingCart,
  HeartHandshake, Skull, Target, Swords
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type VerticalId = "ledgerprop" | "ledgerauto" | "ledgeredu" | "ledgeraccess" | "ledgerhealth" | "ledgerbiz" | "ledgertech" | "ledgertravel" | "ledgeragri" | "ledgerenergy";

type ProposalType = "renovate" | "sell" | "rent_change" | "manager_change" | "location_select" | "humanitarian" | "liquidation" | "impeach_manager" | "impeach_liaison" | "marketplace_list" | "budget_approve";
type ProposalStatus = "active" | "passed" | "executing" | "completed" | "declined";

interface Proposal {
  id: string;
  title: string;
  type: ProposalType;
  description: string;
  cost: number;
  proposer: string;
  proposerTier: number;
  proposerLedgerId: string;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  threshold: number;
  status: ProposalStatus;
  endsAt: string;
  createdAt: string;
  totalCapital: number;
  executionCost?: number;
  executionProofs?: string[];
  executionStatus?: "8th Ledger Review" | "In Progress" | "Completed";
  locationOptions?: string[];
  banTarget?: string;
  budgetBreakdown?: { item: string; amount: number }[];
}

interface VoteRecord {
  voter: string;
  ledgerId: string;
  tier: number;
  weight: number;
  choice: "Agreed" | "Declined";
  timestamp: string;
}

/* ============================================================
   VERTICAL CONFIG
   ============================================================ */
const VERTICAL_CONFIG: Record<VerticalId, {
  name: string; color: string; bg: string; border: string;
  gradient: string; icon: React.ElementType;
}> = {
  ledgerprop: { name: "LedgerProp Hall", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/5 to-orange-500/5", icon: Landmark },
  ledgerauto: { name: "LedgerAuto Hall", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500/5 to-blue-500/5", icon: Zap },
  ledgeredu: { name: "LedgerEdu Hall", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/5 to-purple-500/5", icon: Crown },
  ledgeraccess: { name: "LedgerAccess Hall", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/5 to-teal-500/5", icon: Lock },
  ledgerhealth: { name: "LedgerHealth Hall", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500/5 to-pink-500/5", icon: HeartPulse },
  ledgerbiz: { name: "LedgerBiz Hall", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/5 to-red-500/5", icon: TrendingUp },
  ledgertech: { name: "LedgerTech Hall", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/5 to-blue-500/5", icon: Hexagon },
  ledgertravel: { name: "LedgerTravel Hall", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/5 to-cyan-500/5", icon: Plane },
  ledgeragri: { name: "LedgerAgri Hall", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", gradient: "from-green-500/5 to-emerald-500/5", icon: Sprout },
  ledgerenergy: { name: "LedgerEnergy Hall", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/5 to-amber-500/5", icon: Sun },
};

/* ============================================================
   PROPOSAL TYPE CONFIG
   ============================================================ */
const TYPE_CONFIG: Record<ProposalType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  renovate: { label: "Renovate", icon: Wrench, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  sell: { label: "Sell Asset", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  rent_change: { label: "Rent Change", icon: TrendIcon, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  manager_change: { label: "New Manager", icon: UserCheck, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  location_select: { label: "Location", icon: MapPinned, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  humanitarian: { label: "Humanitarian", icon: HeartHandshake, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  liquidation: { label: "Liquidation", icon: Skull, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  impeach_manager: { label: "Impeach Manager", icon: UserX, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  impeach_liaison: { label: "Impeach Liaison", icon: UserX, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  marketplace_list: { label: "List for Sale", icon: ShoppingCart, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  budget_approve: { label: "Budget", icon: PieChart, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
};

/* ============================================================
   STATUS CONFIG
   ============================================================ */
const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  active: { label: "Voting Open", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Timer },
  passed: { label: "Passed", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
  executing: { label: "Executing", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: RefreshCw },
  completed: { label: "Completed", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Check },
  declined: { label: "Declined", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: XCircle },
};

/* ============================================================
   MOCK PROPOSALS
   ============================================================ */
const PROPOSALS: Proposal[] = [
  {
    id: "pr1", title: "Marina Roof Waterproofing", type: "renovate",
    description: "Replace membrane and repaint exterior. Critical before monsoon season. 8th Ledger-vetted contractor. 5-year warranty included.",
    cost: 12000, proposer: "Sovereign Alpha", proposerTier: 5, proposerLedgerId: "LED-8X2P",
    votesFor: 52, votesAgainst: 12, abstentions: 8, threshold: 51, status: "active",
    endsAt: "12h 34m", createdAt: "2 days ago", totalCapital: 100,
    budgetBreakdown: [
      { item: "Membrane replacement", amount: 7000 },
      { item: "Exterior painting", amount: 3000 },
      { item: "Scaffolding & labor", amount: 2000 },
    ]
  },
  {
    id: "pr2", title: "Install Biometric Access", type: "renovate",
    description: "Fingerprint + facial recognition entry for all unit owners. Cloud-managed by 8th Ledger security layer.",
    cost: 8500, proposer: "Archon Epsilon", proposerTier: 4, proposerLedgerId: "LED-4F6G",
    votesFor: 38, votesAgainst: 8, abstentions: 4, threshold: 51, status: "active",
    endsAt: "3d 12h", createdAt: "1 day ago", totalCapital: 100,
  },
  {
    id: "pr3", title: "Q3 Insurance Premium", type: "budget_approve",
    description: "Annual property insurance renewal. Covers fire, flood, liability. 3% deductible. 8th Ledger Insurance co-pay.",
    cost: 24000, proposer: "Manager Theta", proposerTier: 5, proposerLedgerId: "LED-7T3P",
    votesFor: 89, votesAgainst: 2, abstentions: 0, threshold: 51, status: "passed",
    endsAt: "Complete", createdAt: "5 days ago", totalCapital: 100,
    executionStatus: "8th Ledger Review", executionCost: 24000,
  },
  {
    id: "pr4", title: "Impeach Manager Theta", type: "impeach_manager",
    description: "Failure to execute 3 passed proposals within 90 days. Evidence: execution logs show 67-day average delay vs 30-day SLA.",
    cost: 0, proposer: "Sovereign Gamma", proposerTier: 5, proposerLedgerId: "LED-9M3P",
    votesFor: 48, votesAgainst: 31, abstentions: 5, threshold: 51, status: "active",
    endsAt: "6h 12m", createdAt: "3 days ago", totalCapital: 100,
    banTarget: "Manager Theta",
  },
  {
    id: "pr5", title: "Sell Penthouse Unit B-12", type: "sell",
    description: "Market has peaked. Unit B-12 valued at $340K. Sale proceeds split 80/20 per protocol. Community treasury boost.",
    cost: 0, proposer: "Vanguard Zeta", proposerTier: 3, proposerLedgerId: "LED-2C3D",
    votesFor: 61, votesAgainst: 28, abstentions: 6, threshold: 51, status: "passed",
    endsAt: "Complete", createdAt: "7 days ago", totalCapital: 100,
    executionStatus: "In Progress", executionCost: 15000,
    executionProofs: ["listing_contract.pdf", "valuation_report.pdf"],
  },
  {
    id: "pr6", title: "Solar Array Expansion", type: "budget_approve",
    description: "Add 50kW capacity to Marrakech farm. ROI 18 months. Carbon credit eligibility.",
    cost: 45000, proposer: "Sovereign Alpha", proposerTier: 5, proposerLedgerId: "LED-8X2P",
    votesFor: 72, votesAgainst: 18, abstentions: 5, threshold: 51, status: "completed",
    endsAt: "Complete", createdAt: "14 days ago", totalCapital: 100,
    executionStatus: "Completed", executionCost: 42300,
    executionProofs: ["invoice_solar.pdf", "completion_cert.pdf", "before_after.jpg"],
  },
  {
    id: "pr7", title: "New Liaison Appointment", type: "manager_change",
    description: "Appoint Archon Epsilon as Liaison for 8th Ledger Operations coordination. 6-month term. Impeachable by 51%.",
    cost: 0, proposer: "Admin", proposerTier: 10, proposerLedgerId: "LED-ADMIN",
    votesFor: 82, votesAgainst: 4, abstentions: 3, threshold: 51, status: "completed",
    endsAt: "Complete", createdAt: "21 days ago", totalCapital: 100,
    executionStatus: "Completed", executionCost: 0,
  },
  {
    id: "pr8", title: "Increase Fleet Rental Rate", type: "rent_change",
    description: "Raise daily rental from $85 to $110. Market analysis shows 15% below comparable. Revenue +$4,200/month.",
    cost: 0, proposer: "Manager Theta", proposerTier: 5, proposerLedgerId: "LED-7T3P",
    votesFor: 34, votesAgainst: 42, abstentions: 8, threshold: 51, status: "declined",
    endsAt: "Complete", createdAt: "4 days ago", totalCapital: 100,
  },
];

/* ============================================================
   MOCK VOTE RECORDS
   ============================================================ */
const VOTE_RECORDS: Record<string, VoteRecord[]> = {
  pr1: [
    { voter: "Sovereign Alpha", ledgerId: "LED-8X2P", tier: 5, weight: 8.5, choice: "Agreed", timestamp: "2h ago" },
    { voter: "Archon Epsilon", ledgerId: "LED-4F6G", tier: 4, weight: 6.2, choice: "Agreed", timestamp: "1h ago" },
    { voter: "Vanguard Zeta", ledgerId: "LED-2C3D", tier: 3, weight: 4.1, choice: "Declined", timestamp: "45m ago" },
    { voter: "Operant Beta", ledgerId: "LED-3X9K", tier: 2, weight: 2.5, choice: "Agreed", timestamp: "30m ago" },
    { voter: "Initiate Delta", ledgerId: "LED-1A5B", tier: 1, weight: 0.8, choice: "Agreed", timestamp: "20m ago" },
    { voter: "Sovereign Gamma", ledgerId: "LED-9M3P", tier: 5, weight: 7.3, choice: "Agreed", timestamp: "15m ago" },
  ],
};

/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ============================================================
   TIER BADGE
   ============================================================ */
function TierBadge({ tier, showGlow = false }: { tier: number; showGlow?: boolean }) {
  const config: Record<number, { icon: React.ElementType; color: string; border: string; bg: string; label: string }> = {
    1: { icon: Star, color: "text-slate-400", border: "border-slate-500/20", bg: "bg-slate-500/10", label: "Initiate" },
    2: { icon: ZapIcon, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/10", label: "Operant" },
    3: { icon: Shield, color: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10", label: "Vanguard" },
    4: { icon: CrownIcon, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/10", label: "Archon" },
    5: { icon: Diamond, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", label: "Sovereign" },
    10: { icon: FlameIcon, color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10", label: "Admin" },
  };
  const c = config[tier] || config[1];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border ${c.border} ${c.bg} ${c.color} ${showGlow ? "shadow-[0_0_10px_-3px_rgba(255,255,255,0.1)]" : ""}`}>
      <Icon className="h-2.5 w-2.5" />{c.label}
    </span>
  );
}

/* ============================================================
   COMPONENT — Capital Weighted Bar
   ============================================================ */
function CapitalBar({ forPercent, againstPercent, threshold, showThreshold = true }: {
  forPercent: number; againstPercent: number; threshold: number; showThreshold?: boolean;
}) {
  const total = forPercent + againstPercent;
  const forWidth = total > 0 ? (forPercent / total) * 100 : 0;
  const againstWidth = total > 0 ? (againstPercent / total) * 100 : 0;
  const thresholdPosition = threshold;

  return (
    <div className="relative">
      <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${forWidth}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-emerald-500/70 rounded-l-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${againstWidth}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="h-full bg-rose-500/40 rounded-r-full"
        />
      </div>
      {showThreshold && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80"
          style={{ left: `${thresholdPosition}%` }}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-amber-400 font-bold whitespace-nowrap">
            {threshold}% needed
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-1.5 text-[10px]">
        <span className="text-emerald-400/70 font-medium">{forPercent.toFixed(1)}% Agreed</span>
        <span className="text-white/15">{againstPercent.toFixed(1)}% Declined</span>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Proposal Card
   ============================================================ */
function ProposalCard({ proposal, config, onVote, expanded, onToggle }: {
  proposal: Proposal; config: typeof VERTICAL_CONFIG[VerticalId];
  onVote: (id: string, choice: "Agreed" | "Declined") => void;
  expanded: boolean; onToggle: () => void;
}) {
  const typeCfg = TYPE_CONFIG[proposal.type];
  const statusCfg = STATUS_CONFIG[proposal.status];
  const TypeIcon = typeCfg.icon;
  const StatusIcon = statusCfg.icon;
  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.abstentions;
  const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
  const isPassing = forPercent >= proposal.threshold;
  const hasVoted = false; // Would come from user state
  const votes = VOTE_RECORDS[proposal.id] || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300",
        proposal.status === "active" ? "border-white/10 bg-[#0a0a14]/80" : "border-white/5 bg-[#0a0a14]/60",
        expanded && "border-cyan-500/20 shadow-[0_0_40px_-15px_rgba(6,182,212,0.1)]"
      )}
    >
      {/* Top Line */}
      {proposal.status === "active" && (
        <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-40", isPassing ? "text-emerald-400" : "text-amber-400")} />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", typeCfg.bg, typeCfg.border, "ring-white/5")}>
              <TypeIcon className={cn("h-5 w-5", typeCfg.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", typeCfg.bg, typeCfg.border, typeCfg.color)}>
                  {typeCfg.label}
                </span>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1", statusCfg.bg, statusCfg.border, statusCfg.color)}>
                  <StatusIcon className="h-2.5 w-2.5" />{statusCfg.label}
                </span>
                {proposal.status === "active" && (
                  <span className={cn("text-[10px] font-bold flex items-center gap-1", isPassing ? "text-emerald-400" : "text-amber-400")}>
                    <Target className="h-2.5 w-2.5" />
                    {isPassing ? "Passing" : `${(proposal.threshold - forPercent).toFixed(1)}% needed`}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-2">{proposal.title}</h3>
              <p className="text-xs text-white/30 mt-1 line-clamp-2">{proposal.description}</p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            {proposal.cost > 0 && (
              <p className="text-lg font-bold text-white">{formatCurrency(proposal.cost)}</p>
            )}
            <p className="text-[10px] text-white/20">{proposal.endsAt}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <CapitalBar forPercent={forPercent} againstPercent={againstPercent} threshold={proposal.threshold} />
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-4 text-[10px] text-white/20 mb-4">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{totalVotes} votes</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{proposal.createdAt}</span>
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{proposal.proposer}</span>
          <TierBadge tier={proposal.proposerTier} />
          <span className="font-mono text-white/10">{proposal.proposerLedgerId}</span>
        </div>

        {/* Action Buttons */}
        {proposal.status === "active" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onVote(proposal.id, "Agreed")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2",
                hasVoted
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
              )}
            >
              <Check className="h-4 w-4" />Agreed
            </button>
            <button
              onClick={() => onVote(proposal.id, "Declined")}
              className="flex-1 rounded-xl py-2.5 text-xs font-bold text-rose-400 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />Declined
            </button>
            <button
              onClick={onToggle}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              {expanded ? "Less" : "Details"}
            </button>
          </div>
        )}

        {proposal.status !== "active" && (
          <button
            onClick={onToggle}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Collapse" : "View Details"}
          </button>
        )}

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2">Full Description</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{proposal.description}</p>
                </div>

                {/* Budget Breakdown */}
                {proposal.budgetBreakdown && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2">Budget Breakdown</h4>
                    <div className="space-y-1.5">
                      {proposal.budgetBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                          <span className="text-xs text-white/40">{item.item}</span>
                          <span className="text-xs font-bold text-white">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-lg border-t border-white/5 px-3 py-2 mt-1">
                        <span className="text-xs font-bold text-white">Total</span>
                        <span className="text-xs font-bold text-white">{formatCurrency(proposal.cost)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Execution Tracker */}
                {proposal.executionStatus && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2">Execution Tracker</h4>
                    <div className="flex items-center gap-2">
                      {["Passed", "8th Ledger Review", "In Progress", "Completed"].map((step, i) => {
                        const stepIndex = ["Passed", "8th Ledger Review", "In Progress", "Completed"].indexOf(proposal.executionStatus || "");
                        const isActive = i <= stepIndex;
                        const isCurrent = i === stepIndex;
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center gap-1">
                            <div className={cn(
                              "h-2 w-full rounded-full",
                              isActive ? (isCurrent ? "bg-cyan-400" : "bg-emerald-500/50") : "bg-white/5"
                            )} />
                            <span className={cn("text-[8px] font-medium", isActive ? "text-white/60" : "text-white/20")}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                    {proposal.executionCost && (
                      <p className="text-[10px] text-white/20 mt-2">Actual cost: {formatCurrency(proposal.executionCost)}</p>
                    )}
                    {proposal.executionProofs && proposal.executionProofs.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {proposal.executionProofs.map((proof, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                            <FileText className="h-3 w-3 text-white/30" />
                            <span className="text-[9px] text-white/40">{proof}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Vote Records */}
                {votes.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2">Recent Votes</h4>
                    <div className="space-y-1.5">
                      {votes.map((vote, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60">{vote.voter}</span>
                            <TierBadge tier={vote.tier} />
                            <span className="text-[9px] text-white/20 font-mono">{vote.ledgerId}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-white/30">{vote.weight}% weight</span>
                            <span className={cn("text-xs font-bold", vote.choice === "Agreed" ? "text-emerald-400" : "text-rose-400")}>
                              {vote.choice}
                            </span>
                            <span className="text-[9px] text-white/15">{vote.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Options */}
                {proposal.locationOptions && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2">Location Options</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {proposal.locationOptions.map((loc, i) => (
                        <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                          <MapPin className="mx-auto h-4 w-4 text-white/20 mb-1" />
                          <p className="text-xs text-white/60">{loc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ban Target */}
                {proposal.banTarget && (
                  <div className="rounded-xl border border-rose-500/10 bg-rose-950/10 p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-400">Target: {proposal.banTarget}</span>
                    </div>
                    <p className="text-[10px] text-rose-300/50 mt-1">If passed, target will be instantly removed from role and banned from governance for 90 days.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Impeachment Modal
   ============================================================ */
function ImpeachModal({ open, onClose, config }: { open: boolean; onClose: () => void; config: typeof VERTICAL_CONFIG[VerticalId] }) {
  const [role, setRole] = useState<"Manager" | "Liaison">("Manager");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-3xl border border-rose-500/20 bg-[#0a0a14]/95 p-6 shadow-[0_0_60px_-15px_rgba(244,63,94,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Swords className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Trigger Impeachment</h3>
                <p className="text-xs text-white/30">51% capital-weighted required. Instant removal if passed.</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-white/30 hover:text-white hover:bg-white/5 transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Target Role</label>
              <div className="flex gap-2">
                {(["Manager", "Liaison"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all border",
                      role === r
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-white/5 text-white/30 border-white/5 hover:bg-white/[0.07]"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the breach of duty or failure..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-rose-500/30 focus:bg-white/[0.07] resize-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Evidence</label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Links, screenshots, logs, dates..."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-rose-500/30 focus:bg-white/[0.07] resize-none transition-all"
              />
            </div>

            <div className="rounded-xl border border-amber-500/10 bg-amber-950/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/60">
                  <span className="font-bold text-amber-400">Warning:</span> Impeachment is irreversible. If 51% of committed capital votes Agreed, the target is removed instantly. A re-election proposal will auto-generate. False impeachment attempts may result in your own ban.
                </p>
              </div>
            </div>

            <button
              disabled={!reason.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/30 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Swords className="h-4 w-4" />Submit Impeachment Proposal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   COMPONENT — New Proposal Modal
   ============================================================ */
function NewProposalModal({ open, onClose, config }: { open: boolean; onClose: () => void; config: typeof VERTICAL_CONFIG[VerticalId] }) {
  const [type, setType] = useState<ProposalType>("renovate");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-3xl border border-cyan-500/20 bg-[#0a0a14]/95 p-6 shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Gavel className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">New Proposal</h3>
                <p className="text-xs text-white/30">Requires 51% capital-weighted to pass.</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-white/30 hover:text-white hover:bg-white/5 transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Proposal Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TYPE_CONFIG) as ProposalType[]).map((t) => {
                  const tc = TYPE_CONFIG[t];
                  const Icon = tc.icon;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-bold transition-all border",
                        type === t
                          ? cn(tc.bg, tc.border, tc.color)
                          : "bg-white/5 text-white/30 border-white/5 hover:bg-white/[0.07]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short, clear title..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.07] transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the proposal, expected outcomes, risks..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.07] resize-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Cost Estimate (USD)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.07] transition-all"
              />
            </div>

            <button
              disabled={!title.trim() || !description.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Gavel className="h-4 w-4" />Submit Proposal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallGovernancePage() {
  const params = useParams();
  const hallId = (params.id as VerticalId) || "ledgerprop";
  const config = VERTICAL_CONFIG[hallId] || VERTICAL_CONFIG.ledgerprop;
  const HallIcon = config.icon;

  const [proposals, setProposals] = useState(PROPOSALS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | ProposalStatus>("all");
  const [filterType, setFilterType] = useState<"all" | ProposalType>("all");
  const [showImpeach, setShowImpeach] = useState(false);
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProposals = useMemo(() => {
    let result = proposals;
    if (filterStatus !== "all") result = result.filter((p) => p.status === filterStatus);
    if (filterType !== "all") result = result.filter((p) => p.type === filterType);
    if (searchQuery) result = result.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [proposals, filterStatus, filterType, searchQuery]);

  const activeCount = proposals.filter((p) => p.status === "active").length;
  const passedCount = proposals.filter((p) => p.status === "passed" || p.status === "completed").length;
  const declinedCount = proposals.filter((p) => p.status === "declined").length;

  function handleVote(id: string, choice: "Agreed" | "Declined") {
    setProposals((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const weight = 2.5; // Mock user weight
      return {
        ...p,
        votesFor: choice === "Agreed" ? p.votesFor + weight : p.votesFor,
        votesAgainst: choice === "Declined" ? p.votesAgainst + weight : p.votesAgainst,
      };
    }));
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/halls/${hallId}`}>
              <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Link>
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10", config.bg)}>
              <HallIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <h1 className={cn("text-xl font-bold", config.color)}>{config.name}</h1>
              <p className="text-xs text-white/30">Hall Governance — Capital-Weighted Consensus</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Active Votes</span>
              <Timer className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{activeCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Requiring your vote</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Passed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{passedCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Executed or executing</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Declined</span>
              <XCircle className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-white">{declinedCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Rejected by community</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Threshold</span>
              <Target className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">51%</p>
            <p className="text-[10px] text-white/20 mt-1">Capital-weighted required</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {[
              { id: "all", label: "All", count: proposals.length },
              { id: "active", label: "Active", count: activeCount },
              { id: "passed", label: "Passed", count: proposals.filter((p) => p.status === "passed").length },
              { id: "completed", label: "Completed", count: proposals.filter((p) => p.status === "completed").length },
              { id: "declined", label: "Declined", count: declinedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap border",
                  filterStatus === tab.id
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/[0.02] text-white/30 border-white/5 hover:bg-white/[0.05] hover:text-white/50"
                )}
              >
                {tab.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", filterStatus === tab.id ? "bg-white/10 text-white/60" : "bg-white/5 text-white/20")}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search proposals..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.07] transition-all"
              />
            </div>
            <button
              onClick={() => setShowImpeach(true)}
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <Swords className="h-3.5 w-3.5" />Impeach
            </button>
            <button
              onClick={() => setShowNewProposal(true)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />New Proposal
            </button>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all border whitespace-nowrap",
              filterType === "all" ? "bg-white/10 text-white border-white/10" : "bg-white/5 text-white/20 border-white/5 hover:bg-white/[0.07]"
            )}
          >
            All Types
          </button>
          {(Object.keys(TYPE_CONFIG) as ProposalType[]).map((t) => {
            const tc = TYPE_CONFIG[t];
            const Icon = tc.icon;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all border whitespace-nowrap",
                  filterType === t
                    ? cn(tc.bg, tc.border, tc.color)
                    : "bg-white/5 text-white/20 border-white/5 hover:bg-white/[0.07]"
                )}
              >
                <Icon className="h-3 w-3" />{tc.label}
              </button>
            );
          })}
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                config={config}
                onVote={handleVote}
                expanded={expandedId === proposal.id}
                onToggle={() => setExpandedId(expandedId === proposal.id ? null : proposal.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredProposals.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <Gavel className="mx-auto h-10 w-10 text-white/10 mb-4" />
            <p className="text-sm text-white/30">No proposals match your filters.</p>
            <p className="text-xs text-white/20 mt-2">Create a new proposal or adjust your search.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImpeachModal open={showImpeach} onClose={() => setShowImpeach(false)} config={config} />
      <NewProposalModal open={showNewProposal} onClose={() => setShowNewProposal(false)} config={config} />
    </div>
  );
}