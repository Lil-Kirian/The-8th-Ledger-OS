"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp, Hexagon, Plane,
  Sprout, Sun, ChevronLeft, Search, Users, Shield, Star, Award,
  ShieldCheck, AlertTriangle, Ban, Scale, MessageCircle, Clock,
  Activity, ChevronRight, MoreHorizontal, Filter, Crown as CrownIcon,
  Diamond, Zap as ZapIcon, Flame as FlameIcon, Swords, UserX,
  UserCheck, Fingerprint, Eye, Flag, Bookmark, Share2,
  TrendingUp as TrendIcon, BarChart3, PieChart, Layers,
  MapPin, Calendar, Mail, Phone, Hash, Percent, Target,
  CheckCircle2, XCircle, AlertOctagon, Info, Download,
  QrCode, Lock as LockIcon, Unlock, Send, X
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type VerticalId = "ledgerprop" | "ledgerauto" | "ledgeredu" | "ledgeraccess" | "ledgerhealth" | "ledgerbiz" | "ledgertech" | "ledgertravel" | "ledgeragri" | "ledgerenergy";

type MemberRole = "Manager" | "Liaison" | "Scribe" | "Member";
type MemberStatus = "active" | "banned" | "dormant" | "appealing";
type MemberTier = 1 | 2 | 3 | 4 | 5 | 10;

interface Member {
  id: string;
  name: string;
  ledgerId: string;
  tier: MemberTier;
  avatar: string;
  role: MemberRole;
  ownership: number;
  status: MemberStatus;
  joinedAt: string;
  lastActive: string;
  contributions: number;
  proposalsCreated: number;
  votesCast: number;
  dividendsEarned: number;
  referrals: number;
  location: string;
  isVerified: boolean;
  bio?: string;
  impeachHistory?: { date: string; result: "survived" | "removed" | "resigned" }[];
}

/* ============================================================
   VERTICAL CONFIG
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
   ROLE CONFIG
   ============================================================ */
const ROLE_CONFIG: Record<MemberRole, { color: string; bg: string; border: string; icon: React.ElementType; description: string }> = {
  Manager: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Crown, description: "Hall executive — can execute proposals, manage treasury" },
  Liaison: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: Shield, description: "8th Ledger Protocol coordinator — operations & compliance" },
  Scribe: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: MessageCircle, description: "Records keeper — minutes, audits, documentation" },
  Member: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Users, description: "Sovereign owner — voting rights, dividend claims" },
};

/* ============================================================
   STATUS CONFIG
   ============================================================ */
const STATUS_CONFIG: Record<MemberStatus, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2, label: "Active" },
  banned: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: Ban, label: "Banned" },
  dormant: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Clock, label: "Dormant" },
  appealing: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Scale, label: "Appealing" },
};

/* ============================================================
   MOCK MEMBERS
   ============================================================ */
const MEMBERS: Member[] = [
  {
    id: "1", name: "Sovereign Alpha", ledgerId: "LED-8X2P-9LQ3", tier: 5, avatar: "A",
    role: "Manager", ownership: 8.5, status: "active", joinedAt: "2024-01-15", lastActive: "2m ago",
    contributions: 45000, proposalsCreated: 12, votesCast: 89, dividendsEarned: 12400, referrals: 23,
    location: "Lagos, Nigeria", isVerified: true, bio: "Real estate investor. 7th pool commitment. Long-term sovereign.",
    impeachHistory: []
  },
  {
    id: "2", name: "Archon Epsilon", ledgerId: "LED-4F6G-7H8I", tier: 4, avatar: "E",
    role: "Liaison", ownership: 6.2, status: "active", joinedAt: "2024-02-20", lastActive: "5m ago",
    contributions: 32000, proposalsCreated: 8, votesCast: 67, dividendsEarned: 8900, referrals: 15,
    location: "Berlin, Germany", isVerified: true, bio: "Tech infrastructure specialist. Frankfurt DC liaison.",
    impeachHistory: []
  },
  {
    id: "3", name: "Vanguard Zeta", ledgerId: "LED-2C3D-4E5F", tier: 3, avatar: "Z",
    role: "Scribe", ownership: 4.1, status: "active", joinedAt: "2024-03-10", lastActive: "12m ago",
    contributions: 21000, proposalsCreated: 5, votesCast: 45, dividendsEarned: 5600, referrals: 8,
    location: "Singapore", isVerified: true, bio: "Corporate governance expert. Records all hall proceedings.",
    impeachHistory: []
  },
  {
    id: "4", name: "Operant Beta", ledgerId: "LED-3X9K-2M7P", tier: 2, avatar: "B",
    role: "Member", ownership: 2.5, status: "active", joinedAt: "2024-05-01", lastActive: "1h ago",
    contributions: 12500, proposalsCreated: 1, votesCast: 23, dividendsEarned: 2100, referrals: 3,
    location: "Dubai, UAE", isVerified: false, bio: "First pool commitment. Learning the protocol.",
    impeachHistory: []
  },
  {
    id: "5", name: "Initiate Delta", ledgerId: "LED-1A5B-3C4D", tier: 1, avatar: "D",
    role: "Member", ownership: 0.8, status: "active", joinedAt: "2024-06-12", lastActive: "30m ago",
    contributions: 4000, proposalsCreated: 0, votesCast: 8, dividendsEarned: 450, referrals: 1,
    location: "London, UK", isVerified: false, bio: "New to 8th Ledger. Excited to grow.",
    impeachHistory: []
  },
  {
    id: "6", name: "Sovereign Gamma", ledgerId: "LED-9M3P-8K2L", tier: 5, avatar: "G",
    role: "Member", ownership: 7.3, status: "active", joinedAt: "2024-01-20", lastActive: "3m ago",
    contributions: 38000, proposalsCreated: 9, votesCast: 78, dividendsEarned: 10200, referrals: 19,
    location: "New York, USA", isVerified: true, bio: "Serial pool participant. 9th commitment across 4 verticals.",
    impeachHistory: []
  },
  {
    id: "7", name: "Manager Theta", ledgerId: "LED-7T3P-5R8N", tier: 5, avatar: "T",
    role: "Manager", ownership: 5.1, status: "active", joinedAt: "2024-01-10", lastActive: "1d ago",
    contributions: 28000, proposalsCreated: 15, votesCast: 92, dividendsEarned: 7800, referrals: 12,
    location: "Singapore", isVerified: true, bio: "Property manager with 15 years experience. Under impeachment review.",
    impeachHistory: [{ date: "2026-05-20", result: "survived" }]
  },
  {
    id: "8", name: "Initiate Kappa", ledgerId: "LED-0K9L-1M2N", tier: 1, avatar: "K",
    role: "Member", ownership: 0.3, status: "banned", joinedAt: "2024-08-01", lastActive: "45d ago",
    contributions: 1500, proposalsCreated: 0, votesCast: 2, dividendsEarned: 0, referrals: 0,
    location: "Unknown", isVerified: false, bio: "Banned for fraud. Forfeited PACs redistributed.",
    impeachHistory: [{ date: "2026-04-15", result: "removed" }]
  },
  {
    id: "9", name: "Vanguard Lambda", ledgerId: "LED-5L6M-7N8O", tier: 3, avatar: "L",
    role: "Member", ownership: 3.2, status: "dormant", joinedAt: "2024-04-05", lastActive: "8mo ago",
    contributions: 18000, proposalsCreated: 3, votesCast: 34, dividendsEarned: 4200, referrals: 6,
    location: "Toronto, Canada", isVerified: true, bio: "Dormant account. 12-month warning issued. 6 months to critical.",
    impeachHistory: []
  },
  {
    id: "10", name: "Operant Mu", ledgerId: "LED-3M4N-5O6P", tier: 2, avatar: "M",
    role: "Member", ownership: 1.5, status: "appealing", joinedAt: "2024-07-12", lastActive: "2d ago",
    contributions: 8000, proposalsCreated: 1, votesCast: 15, dividendsEarned: 1200, referrals: 2,
    location: "Sydney, Australia", isVerified: false, bio: "Appealing ban for disputed marketplace transaction.",
    impeachHistory: [{ date: "2026-05-10", result: "removed" }]
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
   STATUS BADGE (was missing in original)
   ============================================================ */
function StatusBadge({ status }: { status: MemberStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
}

/* ============================================================
   COMPONENT — Ownership Donut
   ============================================================ */
function OwnershipDonut({ members }: { members: Member[] }) {
  const totalOwnership = members.reduce((a, m) => a + m.ownership, 0);
  const topHolders = [...members].sort((a, b) => b.ownership - a.ownership).slice(0, 5);
  const others = totalOwnership - topHolders.reduce((a, m) => a + m.ownership, 0);

  const colors = ["#f59e0b", "#8b5cf6", "#06b6d4", "#10b981", "#f43f5e", "#64748b"];
  const data = [...topHolders, { name: "Others", ownership: others }];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
      <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
        <PieChart className="h-3.5 w-3.5 text-amber-400" />
        Ownership Concentration
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {data.reduce((acc, item, i) => {
              const prevOffset = acc.offset;
              const slice = (item.ownership / totalOwnership) * 100;
              const circumference = 2 * Math.PI * 40;
              const offset = circumference - (slice / 100) * circumference;
              const color = colors[i % colors.length];

              acc.elements.push(
                <circle
                  key={i}
                  cx="50" cy="50" r="40" fill="none" stroke={color}
                  strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={prevOffset}
                  className="transition-all"
                />
              );
              acc.offset = prevOffset - (slice / 100) * circumference;
              return acc;
            }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{members.length}</span>
            <span className="text-[8px] text-white/20">Sovereigns</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-white/40">{item.name}</span>
              </div>
              <span className="text-white font-bold">{item.ownership}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Role Distribution
   ============================================================ */
function RoleDistribution({ members }: { members: Member[] }) {
  const counts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = members.length;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
      <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-cyan-400" />
        Role Distribution
      </h3>
      <div className="space-y-2">
        {(Object.keys(ROLE_CONFIG) as MemberRole[]).map((role) => {
          const cfg = ROLE_CONFIG[role];
          const count = counts[role] || 0;
          const percent = (count / total) * 100;
          const Icon = cfg.icon;
          return (
            <div key={role} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                  <span className={cn("font-medium", cfg.color)}>{role}</span>
                </div>
                <span className="text-white/40">{count} ({Math.round(percent)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn("h-full rounded-full", cfg.color.replace("text-", "bg-").replace("400", "500"))}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Report Modal
   ============================================================ */
function ReportModal({ member, open, onClose }: { member: Member | null; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!open || !member) return null;

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
          {!submitted ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <Flag className="h-5 w-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Report to Tribunal</h3>
                    <p className="text-xs text-white/30">Target: {member.name}</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 text-white/30 hover:text-white hover:bg-white/5 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/5">
                  <span className="text-sm font-bold text-white/40">{member.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{member.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TierBadge tier={member.tier} />
                    <span className={cn("text-[10px]", ROLE_CONFIG[member.role].color)}>{member.role}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white outline-none focus:border-rose-500/30 transition-all"
                  >
                    <option value="" className="bg-[#0a0a14]">Select reason...</option>
                    <option value="fraud" className="bg-[#0a0a14]">Fraud / Misrepresentation</option>
                    <option value="harassment" className="bg-[#0a0a14]">Harassment in Hall Chat</option>
                    <option value="theft" className="bg-[#0a0a14]">Theft / Embezzlement</option>
                    <option value="spam" className="bg-[#0a0a14]">Spam / Scam Links</option>
                    <option value="other" className="bg-[#0a0a14]">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Evidence</label>
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Screenshots, links, dates, transaction IDs..."
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-rose-500/30 focus:bg-white/[0.07] resize-none transition-all"
                  />
                </div>

                <div className="rounded-xl border border-amber-500/10 bg-amber-950/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200/60">
                      False reports result in your own ban. Tribunal requires 51% community vote. Banned members lose chat/voting rights but keep dividends.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSubmitted(true)}
                  disabled={!reason}
                  className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/30 disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <Flag className="h-4 w-4" />Submit to Tribunal
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 mb-4">
                <CheckCircle2 className="h-8 w-8 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Report Filed</h3>
              <p className="text-xs text-white/30 mb-6">
                Tribunal case #{Math.random().toString(36).slice(2, 8).toUpperCase()} opened. Community voting begins in 24 hours.
              </p>
              <button onClick={onClose} className="rounded-xl bg-white/5 border border-white/10 px-6 py-2 text-xs font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all">
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   COMPONENT — Member Row
   ============================================================ */
function MemberRow({ member, index, onReport }: { member: Member; index: number; onReport: (m: Member) => void }) {
  const roleCfg = ROLE_CONFIG[member.role];
  const statusCfg = STATUS_CONFIG[member.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "rounded-2xl border backdrop-blur-sm overflow-hidden transition-all",
        member.status === "banned" ? "border-rose-500/10 bg-rose-950/5" :
        member.status === "dormant" ? "border-slate-500/10 bg-slate-950/5" :
        "border-white/5 bg-[#0a0a14]/60 hover:border-white/10"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={cn(
            "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
            member.isVerified ? "bg-gradient-to-br from-cyan-500 to-blue-600 ring-cyan-500/30" : "bg-white/5 ring-white/5"
          )}>
            <span className="text-lg font-bold text-white/60">{member.avatar}</span>
            {member.isVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 ring-2 ring-[#0a0a14]">
                <ShieldCheck className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">{member.name}</span>
              <TierBadge tier={member.tier} />
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", roleCfg.bg, roleCfg.border, roleCfg.color)}>
                {member.role}
              </span>
              <StatusBadge status={member.status} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-white/20">
              <span className="font-mono">{member.ledgerId}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{member.location}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{member.lastActive}</span>
            </div>
          </div>

          {/* Ownership + Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{member.ownership}%</p>
              <p className="text-[9px] text-white/20">Ownership</p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-1.5 text-white/20 hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] text-white/20">
            <BarChart3 className="h-3 w-3" />
            <span>{formatCurrency(member.contributions)} committed</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/20">
            <Award className="h-3 w-3" />
            <span>{member.votesCast} votes</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/40">
            <Wallet className="h-3 w-3" />
            <span>{formatCurrency(member.dividendsEarned)} earned</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-violet-400/40">
            <Users className="h-3 w-3" />
            <span>{member.referrals} refs</span>
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-xs font-bold text-white">{member.proposalsCreated}</p>
                  <p className="text-[9px] text-white/20">Proposals</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-xs font-bold text-white">{member.votesCast}</p>
                  <p className="text-[9px] text-white/20">Votes Cast</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-xs font-bold text-white">{member.referrals}</p>
                  <p className="text-[9px] text-white/20">Referrals</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-center">
                  <p className="text-xs font-bold text-white">{formatCurrency(member.dividendsEarned)}</p>
                  <p className="text-[9px] text-white/20">Dividends</p>
                </div>
              </div>

              {member.bio && (
                <p className="text-xs text-white/30 mb-3 italic">"{member.bio}"</p>
              )}

              {member.impeachHistory && member.impeachHistory.length > 0 && (
                <div className="rounded-xl border border-rose-500/10 bg-rose-950/10 p-3 mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-rose-400/50 font-bold mb-1">Impeachment History</p>
                  {member.impeachHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-white/20">{h.date}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold",
                        h.result === "survived" ? "bg-emerald-500/10 text-emerald-400" :
                        h.result === "removed" ? "bg-rose-500/10 text-rose-400" :
                        "bg-amber-500/10 text-amber-400"
                      )}>
                        {h.result}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReport(member)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                >
                  <Flag className="h-3.5 w-3.5" />Report
                </button>
                <Link href={`/halls/${member.ledgerId.split('-')[1].toLowerCase()}/chat`}>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />Message
                  </button>
                </Link>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/20 hover:text-white hover:bg-white/10 transition-all">
                  <MoreHorizontal className="h-3.5 w-3.5" />
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
export default function HallMembersPage() {
  const params = useParams();
  const hallId = (params.id as VerticalId) || "ledgerprop";
  const config = VERTICAL_CONFIG[hallId] || VERTICAL_CONFIG.ledgerprop;
  const HallIcon = config.icon;

  const [members] = useState(MEMBERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | MemberRole>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | MemberStatus>("all");
  const [reportMember, setReportMember] = useState<Member | null>(null);
  const [showReport, setShowReport] = useState(false);

  const filtered = useMemo(() => {
    let result = members;
    if (filterRole !== "all") result = result.filter((m) => m.role === filterRole);
    if (filterStatus !== "all") result = result.filter((m) => m.status === filterStatus);
    if (searchQuery) result = result.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ledgerId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return result;
  }, [members, filterRole, filterStatus, searchQuery]);

  const totalOwnership = members.reduce((a, m) => a + m.ownership, 0);
  const activeCount = members.filter((m) => m.status === "active").length;
  const bannedCount = members.filter((m) => m.status === "banned").length;
  const dormantCount = members.filter((m) => m.status === "dormant").length;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-[128px]" />
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
              <h1 className={cn("text-xl font-bold", config.color)}>{config.name} Members</h1>
              <p className="text-xs text-white/30">Sovereign directory • Roles • Ownership • Governance</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Total Members</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{members.length}</p>
            <p className="text-[10px] text-white/20 mt-1">{activeCount} active</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Total Ownership</span>
              <Percent className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{totalOwnership.toFixed(1)}%</p>
            <p className="text-[10px] text-white/20 mt-1">Distributed across {members.length} PACs</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Banned</span>
              <Ban className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400">{bannedCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Lost voting rights</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Dormant</span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-400">{dormantCount}</p>
            <p className="text-[10px] text-white/20 mt-1">Inactive 6+ months</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Member List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                <button
                  onClick={() => setFilterRole("all")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all border whitespace-nowrap",
                    filterRole === "all" ? "bg-white/10 text-white border-white/10" : "bg-white/5 text-white/20 border-white/5 hover:bg-white/[0.07]"
                  )}
                >
                  All Roles
                </button>
                {(Object.keys(ROLE_CONFIG) as MemberRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all border whitespace-nowrap",
                      filterRole === role
                        ? cn(ROLE_CONFIG[role].bg, ROLE_CONFIG[role].border, ROLE_CONFIG[role].color)
                        : "bg-white/5 text-white/20 border-white/5 hover:bg-white/[0.07]"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sovereigns..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.07] transition-all"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/30 transition-all"
                >
                  <option value="all" className="bg-[#0a0a14]">All Status</option>
                  <option value="active" className="bg-[#0a0a14]">Active</option>
                  <option value="banned" className="bg-[#0a0a14]">Banned</option>
                  <option value="dormant" className="bg-[#0a0a14]">Dormant</option>
                  <option value="appealing" className="bg-[#0a0a14]">Appealing</option>
                </select>
              </div>
            </div>

            {/* Members */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((member, i) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    index={i}
                    onReport={(m) => { setReportMember(m); setShowReport(true); }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
                <Users className="mx-auto h-10 w-10 text-white/10 mb-4" />
                <p className="text-sm text-white/30">No members match your filters.</p>
              </div>
            )}
          </div>

          {/* Right: Charts */}
          <div className="space-y-6">
            <OwnershipDonut members={members} />
            <RoleDistribution members={members} />

            {/* Governance Power */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-rose-400" />
                Governance Power
              </h3>
              <div className="space-y-3">
                {[...members]
                  .sort((a, b) => b.ownership - a.ownership)
                  .slice(0, 5)
                  .map((m, i) => (
                    <div key={m.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 w-4">{i + 1}</span>
                          <span className="text-white/60">{m.name}</span>
                        </div>
                        <span className="text-white font-bold">{m.ownership}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.ownership * 3}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            i === 0 ? "bg-amber-500" : i === 1 ? "bg-violet-500" : i === 2 ? "bg-cyan-500" : "bg-white/20"
                          )}
                        />
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-[9px] text-white/15 mt-3">
                51% threshold requires top 3 members to agree, or broader coalition.
              </p>
            </div>

            {/* Activity Heatmap */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                Activity Pulse
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }).map((_, i) => {
                  const intensity = Math.random();
                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-sm",
                        intensity > 0.8 ? "bg-emerald-500/60" :
                        intensity > 0.5 ? "bg-emerald-500/30" :
                        intensity > 0.2 ? "bg-emerald-500/10" :
                        "bg-white/5"
                      )}
                      title={`Day ${i + 1}: ${Math.round(intensity * 100)}% activity`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2 text-[8px] text-white/15">
                <span>4 weeks ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        member={reportMember}
        open={showReport}
        onClose={() => { setShowReport(false); setReportMember(null); }}
      />
    </div>
  );
}