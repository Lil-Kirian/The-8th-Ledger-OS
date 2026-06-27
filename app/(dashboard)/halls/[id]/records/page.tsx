"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp, Hexagon, Plane,
  Sprout, Sun, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, ArrowUpRight, ArrowDownRight, Camera,
  Receipt, Download, Eye, Shield, Wrench, Gavel,
  Layers, Calendar, MapPin, Users, Wallet,
  ChevronDown, Flag, Star, Diamond, ShieldCheck,
  Hash, Search, BookOpen, ScrollText, Fingerprint,
  BadgeCheck, AlertOctagon, Archive, GitCommit, FileDown, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ============================================================
   TYPES
   ============================================================ */
type VerticalId = "ledgerprop" | "ledgerauto" | "ledgeredu" | "ledgeraccess" | "ledgerhealth" | "ledgerbiz" | "ledgertech" | "ledgertravel" | "ledgeragri" | "ledgerenergy";

type ExecutionStatus = "passed" | "ledger_review" | "in_progress" | "completed" | "halted";
type VerificationStatus = "pending" | "verified" | "disputed";

interface ExecutionRecord {
  id: string;
  proposalId: string;
  title: string;
  type: string;
  description: string;
  estimatedCost: number;
  actualCost: number;
  status: ExecutionStatus;
  proposer: string;
  proposerTier: number;
  passedAt: string;
  ledgerReviewedAt?: string;
  startedAt?: string;
  completedAt?: string;
  haltedAt?: string;
  haltReason?: string;
  proofs: ProofItem[];
  verifications: Verification[];
  vendor?: string;
  location?: string;
  notes: string[];
}

interface ProofItem {
  id: string;
  type: "before" | "after" | "invoice" | "certificate" | "receipt" | "photo";
  url: string;
  caption: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface Verification {
  id: string;
  verifier: string;
  ledgerId: string;
  tier: number;
  status: VerificationStatus;
  comment: string;
  timestamp: string;
}

/* ============================================================
   VERTICAL CONFIG (8th Ledger)
   ============================================================ */
const VERTICAL_CONFIG: Record<VerticalId, {
  name: string; color: string; bg: string; border: string;
  gradient: string; icon: React.ElementType;
}> = {
  ledgerprop: { name: "LedgerProp", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/5 to-orange-500/5", icon: Landmark },
  ledgerauto: { name: "LedgerAuto", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500/5 to-blue-500/5", icon: Zap },
  ledgeredu: { name: "LedgerEdu", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/5 to-purple-500/5", icon: Crown },
  ledgeraccess: { name: "LedgerAccess", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/5 to-teal-500/5", icon: Lock },
  ledgerhealth: { name: "LedgerHealth", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500/5 to-pink-500/5", icon: HeartPulse },
  ledgerbiz: { name: "LedgerBiz", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/5 to-red-500/5", icon: TrendingUp },
  ledgertech: { name: "LedgerTech", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/5 to-blue-500/5", icon: Hexagon },
  ledgertravel: { name: "LedgerTravel", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/5 to-cyan-500/5", icon: Plane },
  ledgeragri: { name: "LedgerAgri", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", gradient: "from-green-500/5 to-emerald-500/5", icon: Sprout },
  ledgerenergy: { name: "LedgerEnergy", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/5 to-amber-500/5", icon: Sun },
};

/* ============================================================
   STATUS CONFIG
   ============================================================ */
const STATUS_STEPS: { id: ExecutionStatus; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { id: "passed", label: "Passed", icon: Gavel, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "ledger_review", label: "8th Ledger Review", icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "in_progress", label: "In Progress", icon: Wrench, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "completed", label: "Completed", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
];

/* ============================================================
   MOCK DATA
   ============================================================ */
const OPERATIONS: ExecutionRecord[] = [
  {
    id: "op1", proposalId: "pr3", title: "Q3 Insurance Premium", type: "budget_approve",
    description: "Annual property insurance renewal. Covers fire, flood, liability. 3% deductible. 8th Ledger Insurance co-pay.",
    estimatedCost: 24000, actualCost: 24000, status: "completed",
    proposer: "Manager Theta", proposerTier: 5, passedAt: "2025-11-20",
    ledgerReviewedAt: "2025-11-22", startedAt: "2025-11-23", completedAt: "2025-11-25",
    vendor: "Lloyds of London", location: "Lagos Marina",
    proofs: [
      { id: "p1", type: "invoice", url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80", caption: "Insurance invoice — $24,000", uploadedAt: "2025-11-25", uploadedBy: "Manager Theta" },
      { id: "p2", type: "certificate", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80", caption: "Policy certificate 2025-2026", uploadedAt: "2025-11-25", uploadedBy: "Manager Theta" },
      { id: "p3", type: "receipt", url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80", caption: "Payment confirmation", uploadedAt: "2025-11-25", uploadedBy: "8th Ledger Protocol" },
    ],
    verifications: [
      { id: "v1", verifier: "Sovereign Alpha", ledgerId: "LED-8X2P", tier: 5, status: "verified", comment: "Policy verified with Lloyds directly. Coverage adequate.", timestamp: "2025-11-26" },
      { id: "v2", verifier: "Archon Epsilon", ledgerId: "LED-4F6G", tier: 4, status: "verified", comment: "Documents in order. Cost matches estimate exactly.", timestamp: "2025-11-27" },
    ],
    notes: [
      "Proposal passed with 89% agreement (89/2/0)",
      "8th Ledger Review: Approved — no red flags",
      "Payment processed via Hall Treasury",
      "Policy effective: Dec 1, 2025 — Nov 30, 2026",
    ]
  },
  {
    id: "op2", proposalId: "pr5", title: "Sell Penthouse Unit B-12", type: "sell",
    description: "Market has peaked. Unit B-12 valued at $340K. Sale proceeds split 80/20 per protocol. Community treasury boost.",
    estimatedCost: 15000, actualCost: 14200, status: "in_progress",
    proposer: "Vanguard Zeta", proposerTier: 3, passedAt: "2025-10-15",
    ledgerReviewedAt: "2025-10-18", startedAt: "2025-10-20",
    vendor: "Knight Frank Lagos", location: "Lagos Marina",
    proofs: [
      { id: "p4", type: "before", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80", caption: "Unit B-12 — listing photo", uploadedAt: "2025-10-20", uploadedBy: "Manager Theta" },
      { id: "p5", type: "certificate", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80", caption: "Valuation report — $340,000", uploadedAt: "2025-10-22", uploadedBy: "Knight Frank" },
      { id: "p6", type: "invoice", url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80", caption: "Staging costs — $3,200", uploadedAt: "2025-11-05", uploadedBy: "Manager Theta" },
    ],
    verifications: [
      { id: "v3", verifier: "Sovereign Alpha", ledgerId: "LED-8X2P", tier: 5, status: "verified", comment: "Valuation fair. Market comps support $340K.", timestamp: "2025-10-25" },
      { id: "v4", verifier: "Sovereign Gamma", ledgerId: "LED-9M3P", tier: 5, status: "pending", comment: "", timestamp: "Pending" },
    ],
    notes: [
      "Proposal passed with 61% agreement (61/28/6)",
      "8th Ledger Review: Approved — valuation verified by independent appraiser",
      "Listing live on LedgerProp marketplace",
      "3 offers received — highest: $335,000 (negotiating)",
      "Staging completed Nov 5 — photos uploaded",
    ]
  },
  {
    id: "op3", proposalId: "pr6", title: "Solar Array Expansion", type: "budget_approve",
    description: "Add 50kW capacity to Marrakech farm. ROI 18 months. Carbon credit eligibility.",
    estimatedCost: 45000, actualCost: 42300, status: "completed",
    proposer: "Sovereign Alpha", proposerTier: 5, passedAt: "2025-09-10",
    ledgerReviewedAt: "2025-09-12", startedAt: "2025-09-15", completedAt: "2025-10-28",
    vendor: "SunPower Morocco", location: "Marrakech Solar Farm",
    proofs: [
      { id: "p7", type: "before", url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80", caption: "Before — Array Sector C", uploadedAt: "2025-09-15", uploadedBy: "SunPower" },
      { id: "p8", type: "after", url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&q=80", caption: "After — 50kW added", uploadedAt: "2025-10-28", uploadedBy: "SunPower" },
      { id: "p9", type: "invoice", url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80", caption: "Final invoice — $42,300", uploadedAt: "2025-10-28", uploadedBy: "SunPower" },
      { id: "p10", type: "certificate", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80", caption: "Completion certificate", uploadedAt: "2025-10-29", uploadedBy: "8th Ledger Protocol" },
    ],
    verifications: [
      { id: "v5", verifier: "Sovereign Alpha", ledgerId: "LED-8X2P", tier: 5, status: "verified", comment: "Installation quality excellent. Generation up 18%.", timestamp: "2025-10-30" },
      { id: "v6", verifier: "Vanguard Zeta", ledgerId: "LED-2C3D", tier: 3, status: "verified", comment: "Cost under budget by $2,700. Savings returned to treasury.", timestamp: "2025-10-31" },
      { id: "v7", verifier: "Initiate Delta", ledgerId: "LED-1A5B", tier: 1, status: "verified", comment: "Before/after photos show clear improvement.", timestamp: "2025-11-01" },
    ],
    notes: [
      "Proposal passed with 72% agreement (72/18/5)",
      "8th Ledger Review: Approved — vendor vetted, contract reviewed",
      "Under budget: $42,300 vs $45,000 estimate",
      "Savings of $2,700 returned to community treasury",
      "Generation increase: +18% month-over-month",
      "Carbon credits: 45t CO2 — eligible for sale",
    ]
  },
  {
    id: "op4", proposalId: "pr7", title: "New Liaison Appointment", type: "manager_change",
    description: "Appoint Archon Epsilon as Liaison for 8th Ledger Operations coordination. 6-month term. Impeachable by 51%.",
    estimatedCost: 0, actualCost: 0, status: "completed",
    proposer: "Admin", proposerTier: 10, passedAt: "2025-08-15",
    ledgerReviewedAt: "2025-08-15", startedAt: "2025-08-16", completedAt: "2025-08-16",
    vendor: "8th Ledger Protocol", location: "Frankfurt DC-7",
    proofs: [
      { id: "p11", type: "certificate", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80", caption: "Appointment certificate", uploadedAt: "2025-08-16", uploadedBy: "8th Ledger Protocol" },
    ],
    verifications: [
      { id: "v8", verifier: "Sovereign Alpha", ledgerId: "LED-8X2P", tier: 5, status: "verified", comment: "Epsilon qualified. Background check passed.", timestamp: "2025-08-17" },
    ],
    notes: [
      "Proposal passed with 82% agreement (82/4/3)",
      "No cost — administrative appointment",
      "Term: 6 months (expires Feb 16, 2026)",
      "Impeachment threshold: 51% capital-weighted",
    ]
  },
  {
    id: "op5", proposalId: "pr1", title: "Marina Roof Waterproofing", type: "renovate",
    description: "Replace membrane and repaint exterior. Critical before monsoon season. 8th Ledger-vetted contractor. 5-year warranty included.",
    estimatedCost: 12000, actualCost: 12000, status: "ledger_review",
    proposer: "Sovereign Alpha", proposerTier: 5, passedAt: "2025-12-01",
    vendor: "AquaShield Contractors", location: "Lagos Marina — Roof",
    proofs: [],
    verifications: [],
    notes: [
      "Proposal passed with 52% agreement (52/12/8)",
      "Pending 8th Ledger Review: Contractor background check in progress",
      "Estimated start: Dec 10, 2025 (weather permitting)",
      "Warranty: 5 years waterproofing guarantee",
    ]
  },
  {
    id: "op6", proposalId: "pr4", title: "Impeach Manager Theta", type: "impeach_manager",
    description: "Failure to execute 3 passed proposals within 90 days. Evidence: execution logs show 67-day average delay vs 30-day SLA.",
    estimatedCost: 0, actualCost: 0, status: "halted",
    proposer: "Sovereign Gamma", proposerTier: 5, passedAt: "2025-11-25",
    haltedAt: "2025-11-26", haltReason: "Target resigned before vote completion. Re-election proposal auto-generated.",
    vendor: "Hall Tribunal", location: "N/A",
    proofs: [
      { id: "p12", type: "certificate", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80", caption: "Resignation letter — Manager Theta", uploadedAt: "2025-11-26", uploadedBy: "Manager Theta" },
    ],
    verifications: [],
    notes: [
      "Proposal reached 48% when target resigned",
      "Impeachment halted — resignation accepted",
      "Re-election proposal auto-generated: pr-2025-11-26",
      "PACs remain intact. Dividend rights preserved.",
    ]
  },
];

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
    2: { icon: Zap, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/10", label: "Operant" },
    3: { icon: Shield, color: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10", label: "Vanguard" },
    4: { icon: Crown, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/10", label: "Archon" },
    5: { icon: Diamond, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", label: "Sovereign" },
    10: { icon: AlertOctagon, color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10", label: "Admin" },
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
   COMPONENT — Execution Timeline
   ============================================================ */
function ExecutionTimeline({ record }: { record: ExecutionRecord }) {
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.id === record.status);
  const isHalted = record.status === "halted";

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1">
        {STATUS_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = i <= currentStepIndex && !isHalted;
          const isCurrent = i === currentStepIndex && !isHalted;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all",
                  isActive ? cn(step.bg, step.border) : "bg-white/5 border-white/5",
                  isCurrent && "ring-2 ring-offset-2 ring-offset-[#0a0a14] ring-cyan-500/30"
                )}>
                  <StepIcon className={cn("h-5 w-5", isActive ? step.color : "text-white/10")} />
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                    </span>
                  )}
                </div>
                <span className={cn("text-[9px] font-bold uppercase", isActive ? step.color : "text-white/10")}>
                  {step.label}
                </span>
                {step.id === "passed" && record.passedAt && (
                  <span className="text-[8px] text-white/10">{record.passedAt}</span>
                )}
                {step.id === "ledger_review" && record.ledgerReviewedAt && (
                  <span className="text-[8px] text-white/10">{record.ledgerReviewedAt}</span>
                )}
                {step.id === "in_progress" && record.startedAt && (
                  <span className="text-[8px] text-white/10">{record.startedAt}</span>
                )}
                {step.id === "completed" && record.completedAt && (
                  <span className="text-[8px] text-white/10">{record.completedAt}</span>
                )}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 rounded-full transition-all",
                  i < currentStepIndex && !isHalted ? "bg-emerald-500/50" : "bg-white/5"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {isHalted && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-950/10 p-3 flex items-start gap-2">
          <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-400">Halted</p>
            <p className="text-xs text-rose-300/50">{record.haltReason}</p>
            {record.haltedAt && <p className="text-[9px] text-white/15 mt-0.5">{record.haltedAt}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENT — Proof Gallery
   ============================================================ */
function ProofGallery({ proofs }: { proofs: ProofItem[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (proofs.length === 0) return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <Camera className="mx-auto h-8 w-8 text-white/10 mb-2" />
      <p className="text-xs text-white/20">No proofs uploaded yet.</p>
    </div>
  );

  const typeLabels: Record<string, { color: string; label: string }> = {
    before: { color: "text-amber-400", label: "Before" },
    after: { color: "text-emerald-400", label: "After" },
    invoice: { color: "text-cyan-400", label: "Invoice" },
    certificate: { color: "text-violet-400", label: "Certificate" },
    receipt: { color: "text-blue-400", label: "Receipt" },
    photo: { color: "text-rose-400", label: "Photo" },
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {proofs.map((proof) => {
          const typeStyle = typeLabels[proof.type] || { color: "text-white", label: "File" };
          return (
            <motion.button
              key={proof.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedImage(proof.url)}
              className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] transition-all hover:border-white/10"
            >
              <div className="aspect-video overflow-hidden">
                <img src={proof.url} alt={proof.caption} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[9px] font-bold uppercase", typeStyle.color)}>{typeStyle.label}</span>
                  <Eye className="h-3 w-3 text-white/40" />
                </div>
                <p className="text-[10px] text-white/60 mt-0.5 line-clamp-1">{proof.caption}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              alt="Full view"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/40 hover:text-white hover:bg-white/20 transition-all"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   COMPONENT — Cost Tracker
   ============================================================ */
function CostTracker({ estimated, actual }: { estimated: number; actual: number }) {
  const variance = actual - estimated;
  const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;
  const isUnder = variance < 0;
  const isOver = variance > 0;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-cyan-400" />
          Cost Transparency
        </h4>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded border",
          isUnder ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          isOver ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
          "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
        )}>
          {isUnder ? "Under Budget" : isOver ? "Over Budget" : "On Budget"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/30">Estimated</span>
          <span className="text-white/60">{formatCurrency(estimated)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/30">Actual</span>
          <span className="text-white font-bold">{formatCurrency(actual)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
          <div
            className={cn(
              "h-full rounded-l-full transition-all",
              isUnder ? "bg-emerald-500" : isOver ? "bg-rose-500" : "bg-cyan-500"
            )}
            style={{ width: `${Math.min((actual / estimated) * 100, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs pt-1">
          <span className={cn(
            "flex items-center gap-1",
            isUnder ? "text-emerald-400" : isOver ? "text-rose-400" : "text-cyan-400"
          )}>
            {isUnder ? <ArrowDownRight className="h-3 w-3" /> : isOver ? <ArrowUpRight className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {Math.abs(variancePercent).toFixed(1)}%
          </span>
          <span className={cn(
            "font-bold",
            isUnder ? "text-emerald-400" : isOver ? "text-rose-400" : "text-cyan-400"
          )}>
            {isUnder ? "-" : "+"}{formatCurrency(Math.abs(variance))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Verification Panel
   ============================================================ */
function VerificationPanel({ verifications }: { verifications: Verification[] }) {
  if (verifications.length === 0) return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
      <ShieldCheck className="mx-auto h-6 w-6 text-white/10 mb-1" />
      <p className="text-[10px] text-white/20">Awaiting community verification</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {verifications.map((v) => (
        <div key={v.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/5">
            <span className="text-xs font-bold text-white/40">{v.verifier[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-white">{v.verifier}</span>
              <TierBadge tier={v.tier} />
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border font-bold",
                v.status === "verified" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                v.status === "disputed" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {v.status}
              </span>
            </div>
            {v.comment && <p className="text-xs text-white/30 mt-1">{v.comment}</p>}
            <p className="text-[9px] text-white/15 mt-0.5">{v.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   COMPONENT — Operation Card
   ============================================================ */
function OperationCard({ record, index }: { record: ExecutionRecord; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const statusCfg = STATUS_STEPS.find((s) => s.id === record.status) || STATUS_STEPS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "rounded-2xl border backdrop-blur-sm overflow-hidden transition-all",
        record.status === "halted" ? "border-rose-500/10 bg-rose-950/5" :
        record.status === "completed" ? "border-blue-500/10 bg-blue-950/5" :
        record.status === "in_progress" ? "border-amber-500/10 bg-amber-950/5" :
        "border-white/5 bg-[#0a0a14]/60"
      )}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", statusCfg.bg, statusCfg.border, "ring-white/5")}>
              <statusCfg.icon className={cn("h-5 w-5", statusCfg.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">{record.title}</h3>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", statusCfg.bg, statusCfg.border, statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-white/30 mt-1">{record.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-white/20">
                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />Passed: {record.passedAt}</span>
                <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{record.proposer}</span>
                <TierBadge tier={record.proposerTier} />
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-white">{formatCurrency(record.actualCost || record.estimatedCost)}</p>
            <p className="text-[10px] text-white/20">{record.estimatedCost > 0 ? `Est: ${formatCurrency(record.estimatedCost)}` : "No cost"}</p>
          </div>
        </div>

        {/* Timeline */}
        <ExecutionTimeline record={record} />

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full rounded-xl border border-white/5 bg-white/[0.02] py-2 text-xs text-white/30 hover:text-white hover:bg-white/[0.03] transition-all flex items-center justify-center gap-1.5"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {expanded ? "Collapse Details" : "View Full Execution"}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-5">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Proofs */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <Camera className="h-3.5 w-3.5 text-amber-400" />
                    Proof Gallery ({record.proofs.length})
                  </h4>
                  <ProofGallery proofs={record.proofs} />
                </div>

                {/* Right: Cost + Verification */}
                <div className="space-y-4">
                  {record.estimatedCost > 0 && (
                    <CostTracker estimated={record.estimatedCost} actual={record.actualCost} />
                  )}

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Community Verification ({record.verifications.length})
                    </h4>
                    <VerificationPanel verifications={record.verifications} />
                  </div>

                  {record.vendor && (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                        <Wrench className="h-3.5 w-3.5 text-violet-400" />
                        Vendor
                      </h4>
                      <p className="text-xs text-white/40">{record.vendor}</p>
                      {record.location && (
                        <p className="text-[10px] text-white/20 mt-1 flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />{record.location}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Timeline */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  Execution Log
                </h4>
                <div className="space-y-3 relative">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-white/5" />
                  {record.notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-3 relative pl-6">
                      <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-cyan-500/50 ring-2 ring-[#0a0a14]" />
                      <p className="text-xs text-white/30">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />Verify Execution
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />Dispute
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />Download Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallRecordsPage() {
  const params = useParams();
  const hallId = (params.id as VerticalId) || "ledgerprop";
  const config = VERTICAL_CONFIG[hallId] || VERTICAL_CONFIG.ledgerprop;
  const HallIcon = config.icon;

  const [operations] = useState(OPERATIONS);
  const [filter, setFilter] = useState<"all" | ExecutionStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = operations;
    if (filter !== "all") {
      result = result.filter((o) => o.status === filter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.proposer.toLowerCase().includes(q) ||
        o.vendor?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [operations, filter, searchQuery]);

  const completedCount = operations.filter((o) => o.status === "completed").length;
  const inProgressCount = operations.filter((o) => o.status === "in_progress").length;
  const ledgerReviewCount = operations.filter((o) => o.status === "ledger_review").length;
  const haltedCount = operations.filter((o) => o.status === "halted").length;
  const totalSpent = operations
    .filter((o) => o.status === "completed" || o.status === "in_progress")
    .reduce((a, o) => a + o.actualCost, 0);
  const totalVerified = operations.reduce((a, o) => a + o.verifications.filter((v) => v.status === "verified").length, 0);
  const totalProofs = operations.reduce((a, o) => a + o.proofs.length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/3 rounded-full blur-[200px]" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {/* HEADER */}
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
              <h1 className={cn("text-xl font-bold", config.color)}>{config.name} Records</h1>
              <p className="text-xs text-white/30">Execution history • Audit trail • Proof verification</p>
            </div>
          </div>
        </motion.div>

        {/* HERO STATS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Total</span>
              <Hash className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white">{operations.length}</p>
            <p className="text-[10px] text-white/20 mt-1">Operations</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Completed</span>
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{completedCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Fully executed</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">In Progress</span>
              <Wrench className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{inProgressCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Active</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">8th Ledger</span>
              <Shield className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-400">{ledgerReviewCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Review</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Halted</span>
              <XCircle className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400">{haltedCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Stopped</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Deployed</span>
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSpent)}</p>
            <p className="text-[10px] text-white/20 mt-1">Treasury</p>
          </div>
        </div>

        {/* SEARCH + FILTERS + ACTIONS */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input
              placeholder="Search operations, vendors, proposers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/[0.02] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/30 w-full md:w-80"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: "all" as const, label: "All", count: operations.length },
              { id: "passed" as const, label: "Passed", count: operations.filter((o) => o.status === "passed").length },
              { id: "ledger_review" as const, label: "8th Ledger", count: ledgerReviewCount },
              { id: "in_progress" as const, label: "In Progress", count: inProgressCount },
              { id: "completed" as const, label: "Completed", count: completedCount },
              { id: "halted" as const, label: "Halted", count: haltedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap border",
                  filter === tab.id
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/[0.02] text-white/30 border-white/5 hover:bg-white/[0.05] hover:text-white/50"
                )}
              >
                {tab.label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", filter === tab.id ? "bg-white/10 text-white/60" : "bg-white/5 text-white/20")}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/10 text-xs"
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/10 text-xs"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print
            </Button>
          </div>
        </div>

        {/* AUDIT SUMMARY BAR */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/40"><span className="text-white font-bold">{totalVerified}</span> verifications</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-white/40"><span className="text-white font-bold">{totalProofs}</span> proofs</span>
          </div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-white/40"><span className="text-white font-bold">{operations.reduce((a, o) => a + o.notes.length, 0)}</span> log entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-white/40">Immutable hash audit</span>
          </div>
          <div className="ml-auto text-[10px] text-white/20 font-mono">
            LAST SYNC: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
          </div>
        </div>

        {/* Operations List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((op, i) => (
              <OperationCard key={op.id} record={op} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <Archive className="mx-auto h-10 w-10 text-white/10 mb-4" />
            <p className="text-sm text-white/30">No operations match your criteria.</p>
            <p className="text-xs text-white/20 mt-1">Try adjusting filters or search query.</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-white/20">
            <BookOpen className="h-3 w-3" />
            <span>8th Ledger Execution Records · Immutable Audit Trail</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/20">
            <GitCommit className="h-3 w-3" />
            <span>v3.2 · Hall #{hallId.slice(-4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
