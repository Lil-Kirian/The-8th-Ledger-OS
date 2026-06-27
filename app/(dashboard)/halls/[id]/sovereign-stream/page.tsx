"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ChevronRight, Eye,
  BarChart3, Users, MessageSquare,
  Vote, Gavel, FileText, Send, Pin, Loader2, Search,
  CircleDollarSign, Receipt, Reply, CornerDownRight,
  Paperclip, AtSign, Crown,
  ShieldCheck, ScrollText, Banknote, Megaphone, ThumbsUp, PanelLeftClose, Bot, UserCheck
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   TYPES
   ============================================================ */
interface Member {
  id: string;
  name: string;
  ledgerId: string;
  role: "owner" | "speaker" | "treasurer" | "warden" | "scribe" | "system";
  avatar: string;
  stake: number;
  status: "online" | "away" | "offline";
  lastSeen?: string;
  isExecutive: boolean;
}

interface MessageReply {
  id: string;
  authorId: string;
  authorName: string;
  authorLedgerId: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface StreamMessage {
  id: string;
  type: "chat" | "proposal" | "poll" | "system" | "dividend" | "milestone" | "alert" | "thread_parent";
  priority: "low" | "medium" | "high" | "critical";
  authorId: string;
  authorName: string;
  authorLedgerId: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: MessageReply[];
  replyCount: number;
  tags: string[];
  pinned: boolean;
  edited?: boolean;
  readBy: string[];
  metadata?: {
    proposalTitle?: string;
    voteFor?: number;
    voteAgainst?: number;
    voteThreshold?: number;
    pollOptions?: { label: string; votes: number; pct: number }[];
    dividendAmount?: number;
    dividendPerPercent?: number;
    systemCode?: string;
    alertLevel?: string;
  };
}

/* ============================================================
   DEMO DATA — INSTITUTIONAL HALL #001
   ============================================================ */
const DEMO_MEMBERS: Member[] = [
  { id: "m1", name: "Aisha Patel", ledgerId: "LED-203", role: "speaker", avatar: "AP", stake: 15.0, status: "online", isExecutive: true },
  { id: "m2", name: "Marcus Webb", ledgerId: "LED-891", role: "treasurer", avatar: "MW", stake: 12.5, status: "online", isExecutive: true },
  { id: "m3", name: "Sarah Chen", ledgerId: "LED-442", role: "warden", avatar: "SC", stake: 10.2, status: "away", lastSeen: "2m ago", isExecutive: true },
  { id: "m4", name: "Elena Rossi", ledgerId: "LED-104", role: "scribe", avatar: "ER", stake: 8.3, status: "online", isExecutive: true },
  { id: "m5", name: "James Okafor", ledgerId: "LED-567", role: "owner", avatar: "JO", stake: 6.7, status: "offline", lastSeen: "3h ago", isExecutive: false },
  { id: "m6", name: "David Kim", ledgerId: "LED-778", role: "owner", avatar: "DK", stake: 4.1, status: "offline", lastSeen: "1d ago", isExecutive: false },
  { id: "m7", name: "Priya Nair", ledgerId: "LED-312", role: "owner", avatar: "PN", stake: 3.8, status: "online", isExecutive: false },
  { id: "m8", name: "Tom Brennan", ledgerId: "LED-445", role: "owner", avatar: "TB", stake: 2.5, status: "away", lastSeen: "15m ago", isExecutive: false },
  { id: "m9", name: "Yuki Tanaka", ledgerId: "LED-667", role: "owner", avatar: "YT", stake: 1.2, status: "online", isExecutive: false },
];

const DEMO_MESSAGES: StreamMessage[] = [
  {
    id: "msg1", type: "system", priority: "high",
    authorId: "system", authorName: "8th Ledger Protocol", authorLedgerId: "LED-SYSTEM", authorRole: "system", authorAvatar: "◈",
    content: "Dividend distribution complete for May 2026 cycle. $14,400 distributed to 12 PAC holders. Transaction hash: 0x8f2a...9c1d. Ledger Wallets credited.",
    timestamp: "2026-06-23T14:30:00Z", likes: 45, replies: [], replyCount: 0,
    tags: ["dividend", "payment", "ledger"], pinned: true, readBy: ["m1","m2","m3","m4","m5","m6","m7","m8","m9"],
    metadata: { dividendAmount: 14400, systemCode: "DIV-2026-05" }
  },
  {
    id: "msg2", type: "milestone", priority: "high",
    authorId: "m4", authorName: "Elena Rossi", authorLedgerId: "LED-104", authorRole: "scribe", authorAvatar: "ER",
    content: "Meridian Cycle Closed — PAC Distribution Complete. All 12 participants issued Perpetual Asset Contracts. PIR reserve activated at $240,000. First dividend scheduled: 14-JUL-2026.",
    timestamp: "2026-06-23T14:25:00Z", likes: 24, replies: [
      { id: "r1", authorId: "m1", authorName: "Aisha Patel", authorLedgerId: "LED-203", authorRole: "speaker", authorAvatar: "AP", content: "Confirmed. All PACs verified on-chain. Registry updated.", timestamp: "2026-06-23T14:27:00Z", likes: 3 },
      { id: "r2", authorId: "m5", authorName: "James Okafor", authorLedgerId: "LED-567", authorRole: "owner", authorAvatar: "JO", content: "Received my contract. Looking forward to first revenue cycle.", timestamp: "2026-06-23T14:32:00Z", likes: 2 },
    ], replyCount: 2,
    tags: ["milestone", "pac", "dividend"], pinned: true, readBy: ["m1","m2","m3","m4","m5"],
  },
  {
    id: "msg3", type: "proposal", priority: "high",
    authorId: "m1", authorName: "Aisha Patel", authorLedgerId: "LED-203", authorRole: "speaker", authorAvatar: "AP",
    content: "EV Infrastructure Expansion — 4-Port Charging Array. Capital expenditure: $28,000. Revenue model: $0.35/kWh + session fee. Projected ROI: 18 months. PIR coverage: 100%. Vote required within 48 hours.",
    timestamp: "2026-06-23T11:00:00Z", likes: 31, replies: [
      { id: "r3", authorId: "m2", authorName: "Marcus Webb", authorLedgerId: "LED-891", authorRole: "treasurer", authorAvatar: "MW", content: "Treasury can absorb this without PIR advance. Cash flow positive by month 8.", timestamp: "2026-06-23T11:15:00Z", likes: 5 },
      { id: "r4", authorId: "m7", authorName: "Priya Nair", authorLedgerId: "LED-312", authorRole: "owner", authorAvatar: "PN", content: "What is the projected utilization rate? 40%? 60%?", timestamp: "2026-06-23T11:22:00Z", likes: 2 },
      { id: "r5", authorId: "m1", authorName: "Aisha Patel", authorLedgerId: "LED-203", authorRole: "speaker", authorAvatar: "AP", content: "Conservative estimate 55% utilization. Optimistic 72%. Break-even at 38%.", timestamp: "2026-06-23T11:25:00Z", likes: 4 },
    ], replyCount: 3,
    tags: ["capex", "revenue", "ev"], pinned: false, readBy: ["m1","m2","m3","m4","m5","m7"],
    metadata: { proposalTitle: "EV Infrastructure Expansion", voteFor: 8, voteAgainst: 2, voteThreshold: 51 }
  },
  {
    id: "msg4", type: "chat", priority: "low",
    authorId: "m3", authorName: "Sarah Chen", authorLedgerId: "LED-442", authorRole: "warden", authorAvatar: "SC",
    content: "Insurance renewal docs are ready for review. Lloyd\'s policy #2847 extended 12 months. No premium increase. Files uploaded to vault.",
    timestamp: "2026-06-23T10:45:00Z", likes: 12, replies: [], replyCount: 0,
    tags: ["insurance", "compliance"], pinned: false, readBy: ["m1","m2","m3","m4"],
  },
  {
    id: "msg5", type: "poll", priority: "medium",
    authorId: "m6", authorName: "David Kim", authorLedgerId: "LED-778", authorRole: "owner", authorAvatar: "DK",
    content: "HVAC System Upgrade — Pre-Winter Maintenance. Upgrade cost: $45,000. Energy savings: $8,000/year. Should we proceed before Q4?",
    timestamp: "2026-06-23T09:15:00Z", likes: 12, replies: [
      { id: "r6", authorId: "m4", authorName: "Elena Rossi", authorLedgerId: "LED-104", authorRole: "scribe", authorAvatar: "ER", content: "Warranty on current system expires Nov 2026. Deferring risks emergency repair costs.", timestamp: "2026-06-23T09:30:00Z", likes: 6 },
    ], replyCount: 1,
    tags: ["maintenance", "vote"], pinned: false, readBy: ["m1","m2","m3","m4","m5","m6"],
    metadata: { pollOptions: [
      { label: "Execute Upgrade", votes: 7, pct: 58.3 },
      { label: "Defer 12 Months", votes: 4, pct: 33.3 },
      { label: "Abstain", votes: 1, pct: 8.4 },
    ]}
  },
  {
    id: "msg6", type: "chat", priority: "low",
    authorId: "m2", authorName: "Marcus Webb", authorLedgerId: "LED-891", authorRole: "treasurer", authorAvatar: "MW",
    content: "Monthly occupancy report is live. June closed at 94.2% (↑3.1% MoM). Average lease: $2,850/unit. Three renewals pending. SRI holding at 87 Platinum.",
    timestamp: "2026-06-21T09:00:00Z", likes: 18, replies: [
      { id: "r7", authorId: "m8", authorName: "Tom Brennan", authorLedgerId: "LED-445", authorRole: "owner", authorAvatar: "TB", content: "Are the pending renewals at higher rates or flat?", timestamp: "2026-06-21T09:45:00Z", likes: 1 },
      { id: "r8", authorId: "m2", authorName: "Marcus Webb", authorLedgerId: "LED-891", authorRole: "treasurer", authorAvatar: "MW", content: "Two at +4.5%, one at +2.0%. Market rate is +5.2% so we\'re slightly under but retention is priority.", timestamp: "2026-06-21T10:00:00Z", likes: 3 },
    ], replyCount: 2,
    tags: ["report", "occupancy", "sri"], pinned: false, readBy: ["m1","m2","m3","m4","m5","m6","m7","m8"],
  },
  {
    id: "msg7", type: "alert", priority: "critical",
    authorId: "system", authorName: "8th Ledger Protocol", authorLedgerId: "LED-SYSTEM", authorRole: "system", authorAvatar: "◈",
    content: "AHGI Alert: Roof inspection flagged water damage in Section B. Estimated repair: $3,200. Insurance: NOT COVERED (routine wear). PIR advance available. Vote required for Forge allocation.",
    timestamp: "2026-06-20T16:20:00Z", likes: 9, replies: [
      { id: "r9", authorId: "m3", authorName: "Sarah Chen", authorLedgerId: "LED-442", authorRole: "warden", authorAvatar: "SC", content: "I have the inspection photos. Damage is localized. Can we patch instead of full section replacement?", timestamp: "2026-06-20T16:35:00Z", likes: 4 },
      { id: "r10", authorId: "m1", authorName: "Aisha Patel", authorLedgerId: "LED-203", authorRole: "speaker", authorAvatar: "AP", content: "Patch is $1,400 vs $3,200. I propose we patch now and budget full replacement in 2027.", timestamp: "2026-06-20T17:00:00Z", likes: 7 },
    ], replyCount: 2,
    tags: ["maintenance", "alert", "pir"], pinned: false, readBy: ["m1","m2","m3","m4"],
    metadata: { alertLevel: "structural", systemCode: "ALT-ROOF-001" }
  },
  {
    id: "msg8", type: "chat", priority: "low",
    authorId: "m5", authorName: "James Okafor", authorLedgerId: "LED-567", authorRole: "owner", authorAvatar: "JO",
    content: "Has anyone reviewed the new tenant application for Unit 4B? Corporate lease, 36-month term, $3,200/month. Above current market.",
    timestamp: "2026-06-20T11:00:00Z", likes: 6, replies: [
      { id: "r11", authorId: "m2", authorName: "Marcus Webb", authorLedgerId: "LED-891", authorRole: "treasurer", authorAvatar: "MW", content: "Credit check passed. Background clear. I recommend approval. Adds 12% to monthly revenue.", timestamp: "2026-06-20T11:30:00Z", likes: 5 },
      { id: "r12", authorId: "m7", authorName: "Priya Nair", authorLedgerId: "LED-312", authorRole: "owner", authorAvatar: "PN", content: "Corporate tenant is a fintech subsidiary. Stable. I second the approval.", timestamp: "2026-06-20T12:00:00Z", likes: 3 },
      { id: "r13", authorId: "m1", authorName: "Aisha Patel", authorLedgerId: "LED-203", authorRole: "speaker", authorAvatar: "AP", content: "Approved. Marcus, execute lease. 8th Ledger will handle onboarding.", timestamp: "2026-06-20T12:15:00Z", likes: 8 },
    ], replyCount: 3,
    tags: ["tenant", "lease"], pinned: false, readBy: ["m1","m2","m3","m4","m5","m6","m7"],
  },
  {
    id: "msg9", type: "system", priority: "medium",
    authorId: "system", authorName: "8th Ledger Protocol", authorLedgerId: "LED-SYSTEM", authorRole: "system", authorAvatar: "◈",
    content: "Dynamic Valuation Update: Asset book value increased 8% this quarter. 5% PAC now valued at $11,340 (was $10,500). Drivers: rent increase (+5%), property appreciation (+3%).",
    timestamp: "2026-06-19T00:00:00Z", likes: 32, replies: [], replyCount: 0,
    tags: ["valuation", "appreciation"], pinned: false, readBy: ["m1","m2","m3","m4","m5","m6","m7","m8","m9"],
  },
  {
    id: "msg10", type: "chat", priority: "low",
    authorId: "m9", authorName: "Yuki Tanaka", ledgerId: "LED-667", authorRole: "owner", authorAvatar: "YT",
    content: "First-time owner here. How do I read the Forge Ledger? I see payroll numbers but not sure what the performance metrics mean.",
    timestamp: "2026-06-18T14:00:00Z", likes: 4, replies: [
      { id: "r14", authorId: "m4", authorName: "Elena Rossi", authorLedgerId: "LED-104", authorRole: "scribe", authorAvatar: "ER", content: "Welcome Yuki. The Forge Ledger shows worker performance against targets. Green = on target. Amber = review. Red = underperformance. Hover over any metric for the benchmark.", timestamp: "2026-06-18T14:10:00Z", likes: 6 },
      { id: "r15", authorId: "m3", authorName: "Sarah Chen", authorLedgerId: "LED-442", authorRole: "warden", authorAvatar: "SC", content: "Also check the 8th Ledger Ledger tab for maintenance updates. Those affect AHGI which drives valuation.", timestamp: "2026-06-18T14:15:00Z", likes: 4 },
      { id: "r16", authorId: "m9", authorName: "Yuki Tanaka", authorLedgerId: "LED-667", authorRole: "owner", authorAvatar: "YT", content: "Thank you both. The documentation is excellent. This system is remarkable.", timestamp: "2026-06-18T14:20:00Z", likes: 5 },
    ], replyCount: 3,
    tags: ["onboarding", "help"], pinned: false, readBy: ["m1","m2","m3","m4","m5","m6","m7","m8","m9"],
  },
];

const HALL_DATA = {
  name: "LedgerProp — Meridian Tower",
  class: "I",
  id: "LED-PROP-001",
  assetValue: 2400000,
  treasury: 2840000,
  pir: 240000,
  lastDividend: 14400,
  dividendYield: "8.4%",
  occupancy: 94.2,
  sri: 87,
  sriTier: "Platinum",
  totalOwners: 12,
  activeProposals: 2,
  pendingVotes: 3,
  thisMonthPosts: 24,
  nextDividend: "2026-07-14",
  location: "London, UK",
  assetType: "Commercial Real Estate",
  trueCost: 2000000,
  listedPrice: 2400000,
  surplus: 400000,
};

/* ============================================================
   UTILS
   ============================================================ */
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return "NOW";
  if (m < 60) return `${m}M`;
  if (h < 24) return `${h}H`;
  if (days < 7) return `${days}D`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n}`;
}

/* ============================================================
   ROLE BADGE
   ============================================================ */
function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
    speaker: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", icon: Megaphone, label: "SPEAKER" },
    treasurer: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: Banknote, label: "TREASURER" },
    warden: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: ShieldCheck, label: "WARDEN" },
    scribe: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", icon: ScrollText, label: "SCRIBE" },
    system: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", icon: Bot, label: "SYSTEM" },
    owner: { bg: "bg-slate-800", text: "text-slate-500", border: "border-slate-700", icon: UserCheck, label: "OWNER" },
  };
  const c = config[role] || config.owner;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border", c.bg, c.text, c.border)}>
      <Icon className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

/* ============================================================
   STATUS DOT
   ============================================================ */
function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0",
      status === "online" ? "bg-emerald-400" : status === "away" ? "bg-amber-400" : "bg-slate-600"
    )} />
  );
}

/* ============================================================
   COMPACT HEADER — Banking Ticker
   ============================================================ */
function CompactHeader() {
  return (
    <div className="shrink-0 border-b border-slate-800/40 bg-[#0a0a0f]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white truncate">{HALL_DATA.name}</h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">Class {HALL_DATA.class}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">{HALL_DATA.sriTier}</span>
            </div>
            <p className="text-[10px] text-slate-600 font-mono truncate">{HALL_DATA.id} • {HALL_DATA.location} • {HALL_DATA.assetType}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Treasury</p>
            <p className="text-xs font-bold text-white font-mono">{formatCompact(HALL_DATA.treasury)}</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Yield</p>
            <p className="text-xs font-bold text-emerald-400 font-mono">{HALL_DATA.dividendYield}</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">SRI</p>
            <p className="text-xs font-bold text-amber-400 font-mono">{HALL_DATA.sri}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MEMBER SIDEBAR
   ============================================================ */
function MemberSidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [filter, setFilter] = useState("");
  const filtered = DEMO_MEMBERS.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()) || m.ledgerId.toLowerCase().includes(filter.toLowerCase()));
  const onlineCount = DEMO_MEMBERS.filter(m => m.status === "online").length;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-900/20"
      >
        {open ? <PanelLeftClose className="h-4 w-4" /> : <Users className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 border-r border-slate-800/40 bg-[#0a0a0f]/90 backdrop-blur-sm flex flex-col overflow-hidden"
          >
            {/* Sidebar header */}
            <div className="px-3 py-2 border-b border-slate-800/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sovereigns</span>
              <div className="flex items-center gap-1.5">
                <StatusDot status="online" />
                <span className="text-[10px] font-mono text-slate-500">{onlineCount}/{DEMO_MEMBERS.length}</span>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search ledger..."
                  className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-slate-700 font-mono"
                />
              </div>
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer",
                    m.isExecutive ? "hover:bg-slate-800/40" : "hover:bg-slate-800/20"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold border",
                      m.isExecutive
                        ? "bg-slate-800 border-slate-700 text-slate-300"
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    )}>
                      {m.avatar}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot status={m.status} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-300 truncate">{m.name}</span>
                      {m.isExecutive && <Crown className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-slate-600">{m.ledgerId}</span>
                      <span className="text-[9px] font-mono text-cyan-500">{m.stake}%</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <RoleBadge role={m.role} />
                  </div>
                </div>
              ))}
            </div>

            {/* Hall stats mini */}
            <div className="border-t border-slate-800/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600">Total Stake</span>
                <span className="text-[10px] font-bold text-white font-mono">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600">Active Proposals</span>
                <span className="text-[10px] font-bold text-violet-400 font-mono">{HALL_DATA.activeProposals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600">Next Dividend</span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono">{HALL_DATA.nextDividend}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   MESSAGE BUBBLE — Banking Chat Style
   ============================================================ */
function MessageBubble({ msg, isConsecutive, onReply }: { msg: StreamMessage; isConsecutive: boolean; onReply: (id: string) => void }) {
  const [showReplies, setShowReplies] = useState(false);
  const [liked, setLiked] = useState(false);
  const isSystem = msg.type === "system";
  const isMe = msg.authorId === "m1"; // Simulated current user

  const typeStyles: Record<string, { left: string; right: string }> = {
    chat: { left: "bg-slate-800/60 border-slate-700/40", right: "bg-cyan-900/20 border-cyan-800/30" },
    proposal: { left: "bg-violet-900/10 border-violet-800/20", right: "bg-violet-900/20 border-violet-700/30" },
    poll: { left: "bg-amber-900/10 border-amber-800/20", right: "bg-amber-900/20 border-amber-700/30" },
    system: { left: "bg-slate-800/40 border-slate-700/30", right: "bg-slate-800/40 border-slate-700/30" },
    milestone: { left: "bg-cyan-900/10 border-cyan-800/20", right: "bg-cyan-900/20 border-cyan-700/30" },
    alert: { left: "bg-rose-900/10 border-rose-800/20", right: "bg-rose-900/20 border-rose-700/30" },
    dividend: { left: "bg-emerald-900/10 border-emerald-800/20", right: "bg-emerald-900/20 border-emerald-700/30" },
  };
  const styles = typeStyles[msg.type] || typeStyles.chat;
  const alignLeft = !isMe || isSystem;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", alignLeft ? "" : "flex-row-reverse")}
    >
      {/* Avatar */}
      {!isConsecutive && (
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center text-[9px] font-bold border",
            isSystem ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-800 border-slate-700 text-slate-300"
          )}>
            {msg.authorAvatar}
          </div>
          {!alignLeft && <div className="h-2 w-2 rounded-full bg-cyan-400" />}
        </div>
      )}
      {isConsecutive && <div className="w-8 shrink-0" />}

      {/* Message body */}
      <div className={cn("flex-1 min-w-0", alignLeft ? "" : "items-end flex flex-col")}>
        {!isConsecutive && (
          <div className={cn("flex items-center gap-2 mb-1", alignLeft ? "" : "flex-row-reverse")}>
            <span className="text-[11px] font-bold text-slate-300">{msg.authorName}</span>
            <RoleBadge role={msg.authorRole} />
            <span className="text-[9px] font-mono text-slate-600">{msg.authorLedgerId}</span>
            <span className="text-[9px] font-mono text-slate-700">{formatTime(msg.timestamp)}</span>
            {msg.pinned && <Pin className="h-2.5 w-2.5 text-amber-400" />}
          </div>
        )}

        <div className={cn(
          "relative rounded-xl border px-3.5 py-2.5 max-w-[85%] lg:max-w-[75%]",
          alignLeft ? styles.left : styles.right,
          msg.pinned && "border-amber-500/20 bg-amber-950/5"
        )}>
          {/* Priority strip */}
          {msg.priority === "critical" && (
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-rose-500" />
          )}
          {msg.priority === "high" && (
            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-amber-500" />
          )}

          {/* Content */}
          <p className={cn(
            "text-[12px] leading-relaxed",
            isSystem ? "text-slate-400 font-mono" : "text-slate-200"
          )}>
            {msg.content}
          </p>

          {/* Proposal metadata */}
          {msg.type === "proposal" && msg.metadata && (
            <div className="mt-2.5 rounded-lg border border-violet-800/20 bg-violet-950/10 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">Voting Active</span>
                <span className="text-[9px] font-mono text-slate-600">Need {msg.metadata.voteThreshold}%</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-emerald-400 font-bold">FOR</span>
                    <span className="text-slate-400 font-mono">{msg.metadata.voteFor}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(msg.metadata.voteFor / (msg.metadata.voteFor + msg.metadata.voteAgainst)) * 100}%` }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-rose-400 font-bold">AGAINST</span>
                    <span className="text-slate-400 font-mono">{msg.metadata.voteAgainst}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${(msg.metadata.voteAgainst / (msg.metadata.voteFor + msg.metadata.voteAgainst)) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Poll metadata */}
          {msg.type === "poll" && msg.metadata?.pollOptions && (
            <div className="mt-2.5 space-y-1.5">
              {msg.metadata.pollOptions.map((opt, i) => (
                <div key={i} className="relative rounded-lg border border-slate-800/30 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-amber-500/5 transition-all" style={{ width: `${opt.pct}%` }} />
                  <div className="relative flex items-center justify-between px-2.5 py-1.5">
                    <span className="text-[11px] text-slate-300">{opt.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">{opt.pct}% <span className="text-slate-700">({opt.votes})</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {msg.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {msg.tags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 bg-slate-900/50 border border-slate-800">#{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className={cn("flex items-center gap-3 mt-2 pt-2 border-t border-slate-800/20", alignLeft ? "" : "flex-row-reverse")}>
            <button
              onClick={() => setLiked(!liked)}
              className={cn("flex items-center gap-1 text-[10px] font-bold transition-colors", liked ? "text-rose-400" : "text-slate-600 hover:text-slate-400")}
            >
              <ThumbsUp className={cn("h-3 w-3", liked && "fill-rose-400")} />
              {msg.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={() => { onReply(msg.id); setShowReplies(!showReplies); }}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-400 transition-colors"
            >
              <Reply className="h-3 w-3" />
              {msg.replyCount > 0 ? `${msg.replyCount} replies` : "Reply"}
            </button>
            <span className="text-[9px] text-slate-700 font-mono">{msg.readBy.length} read</span>
          </div>
        </div>

        {/* Thread Replies */}
        <AnimatePresence>
          {showReplies && msg.replies.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={cn("mt-2 space-y-2", alignLeft ? "ml-4" : "mr-4")}>
                {msg.replies.map((reply, i) => (
                  <div key={reply.id} className="flex gap-2">
                    <CornerDownRight className="h-3 w-3 text-slate-700 mt-1 shrink-0" />
                    <div className="flex-1 rounded-lg border border-slate-800/30 bg-slate-900/30 px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-slate-400">{reply.authorName}</span>
                        <span className="text-[8px] font-mono text-slate-700">{reply.authorLedgerId}</span>
                        <span className="text-[8px] font-mono text-slate-700">{timeAgo(reply.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{reply.content}</p>
                    </div>
                  </div>
                ))}
                {/* Reply input */}
                <div className="flex gap-2 ml-5">
                  <input
                    placeholder="Reply to thread..."
                    className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-slate-700"
                  />
                  <button className="p-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors">
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ============================================================
   CHAT STREAM
   ============================================================ */
function ChatStream({ messages, replyTo, onReply }: { messages: StreamMessage[]; replyTo: string | null; onReply: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "chat" | "proposal" | "poll" | "system">("all");
  const [search, setSearch] = useState("");

  const filtered = messages.filter((m) => {
    if (filter !== "all" && m.type !== filter) return false;
    if (search && !m.content.toLowerCase().includes(search.toLowerCase()) && !m.authorName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Filter bar */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-800/30 bg-[#0a0a0f]/60">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/40 border border-slate-800/30">
          {(["all", "chat", "proposal", "poll", "system"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all",
                filter === f ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-600 hover:text-slate-400 border border-transparent"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stream..."
              className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-slate-700 font-mono"
            />
          </div>
        </div>
        <span className="text-[9px] font-mono text-slate-700 shrink-0">{filtered.length} msgs</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {filtered.map((msg, i) => {
          const prev = filtered[i - 1];
          const isConsecutive = prev && prev.authorId === msg.authorId && (new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime()) < 300000;
          return (
            <div key={msg.id} id={`msg-${msg.id}`} className={cn(replyTo === msg.id && "scroll-mt-4")}>
              {/* Date separator */}
              {(!prev || new Date(prev.timestamp).toDateString() !== new Date(msg.timestamp).toDateString()) && (
                <div className="flex items-center justify-center my-4">
                  <div className="h-px flex-1 bg-slate-800/40" />
                  <span className="px-3 text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                    {new Date(msg.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <div className="h-px flex-1 bg-slate-800/40" />
                </div>
              )}
              <MessageBubble msg={msg} isConsecutive={!!isConsecutive} onReply={onReply} />
            </div>
          );
        })}
        <div className="h-4" />
      </div>
    </div>
  );
}

/* ============================================================
   RIGHT PANEL — Treasury & Activity
   ============================================================ */
function RightPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <>
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shadow-lg border border-slate-700"
      >
        {open ? <PanelLeftClose className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 border-l border-slate-800/40 bg-[#0a0a0f]/90 backdrop-blur-sm flex flex-col overflow-hidden"
          >
            {/* Treasury */}
            <div className="border-b border-slate-800/30">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Treasury</span>
                <CircleDollarSign className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Balance</span>
                  <span className="text-xs font-bold text-white font-mono">{formatCompact(HALL_DATA.treasury)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Asset Value</span>
                  <span className="text-[11px] font-bold text-slate-300 font-mono">{formatCompact(HALL_DATA.assetValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">PIR Reserve</span>
                  <span className="text-[11px] font-bold text-amber-400 font-mono">{formatCompact(HALL_DATA.pir)}</span>
                </div>
                <div className="h-px bg-slate-800/30" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Last Dividend</span>
                  <span className="text-[11px] font-bold text-emerald-400 font-mono">{formatCompact(HALL_DATA.lastDividend)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Yield</span>
                  <span className="text-[11px] font-bold text-amber-400 font-mono">{HALL_DATA.dividendYield}</span>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-800/30">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity Log</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {[
                  { time: "14:30", text: "Dividend distributed", type: "credit" },
                  { time: "14:25", text: "PAC registry updated", type: "neutral" },
                  { time: "11:00", text: "Proposal #4 submitted", type: "neutral" },
                  { time: "10:45", text: "Insurance docs uploaded", type: "neutral" },
                  { time: "09:15", text: "Poll #3 opened", type: "neutral" },
                  { time: "00:00", text: "Monthly cycle closed", type: "credit" },
                  { time: "Jun 20", text: "Roof inspection alert", type: "debit" },
                  { time: "Jun 19", text: "Valuation updated +8%", type: "credit" },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[9px] font-mono text-slate-700 shrink-0 pt-0.5">{a.time}</span>
                    <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                      a.type === "credit" ? "bg-emerald-400" : a.type === "debit" ? "bg-rose-400" : "bg-slate-600"
                    )} />
                    <span className="text-[10px] text-slate-400">{a.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-slate-800/30 p-2 space-y-1">
              <ActionBtn icon={Gavel} label="New Proposal" color="violet" />
              <ActionBtn icon={Vote} label="Start Poll" color="amber" />
              <ActionBtn icon={Receipt} label="Dividend History" color="emerald" />
              <ActionBtn icon={FileText} label="Contracts" color="cyan" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ActionBtn({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  const colors: Record<string, string> = {
    violet: "text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/20",
    amber: "text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20",
    emerald: "text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20",
    cyan: "text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20",
  };
  return (
    <button className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-transparent text-[10px] font-bold transition-all", colors[color])}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ============================================================
   MESSAGE INPUT
   ============================================================ */
function MessageInput({ replyTo, onCancelReply }: { replyTo: string | null; onCancelReply: () => void }) {
  const [text, setText] = useState("");
  const [msgType, setMsgType] = useState<"chat" | "proposal" | "poll" | "announcement">("chat");
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const typeConfig = {
    chat: { label: "Message", icon: MessageSquare, color: "text-slate-400" },
    proposal: { label: "Proposal", icon: Gavel, color: "text-violet-400" },
    poll: { label: "Poll", icon: Vote, color: "text-amber-400" },
    announcement: { label: "Announce", icon: Megaphone, color: "text-cyan-400" },
  };

  return (
    <div className="shrink-0 border-t border-slate-800/40 bg-[#0a0a0f]/95 backdrop-blur-xl px-4 py-3">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <CornerDownRight className="h-3 w-3 text-cyan-400" />
            <span className="text-[10px] text-cyan-400 font-bold">Replying to thread</span>
          </div>
          <button onClick={onCancelReply} className="text-[10px] text-slate-600 hover:text-slate-400">Cancel</button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Type selector */}
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center hover:border-slate-700 transition-colors shrink-0"
          >
            {React.createElement(typeConfig[msgType].icon, { className: cn("h-4 w-4", typeConfig[msgType].color) })}
          </button>
          <AnimatePresence>
            {showTypeMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-full left-0 mb-1.5 rounded-lg border border-slate-800 bg-[#0c0c14] shadow-xl overflow-hidden min-w-[140px]"
              >
                {(Object.entries(typeConfig) as [typeof msgType, typeof typeConfig[typeof msgType]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => { setMsgType(key); setShowTypeMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold transition-colors",
                      msgType === key ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    )}
                  >
                    <cfg.icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    {cfg.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="flex-1 min-w-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={msgType === "proposal" ? "Enter proposal title and details..." : msgType === "poll" ? "Ask a question..." : "Message the hall..."}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setText("");
              }
            }}
            className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl px-3 py-2 text-[12px] text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-slate-600 resize-none max-h-32"
            style={{ minHeight: "36px" }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-700 transition-colors">
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <button className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-700 transition-colors">
            <AtSign className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setText("")}
            className={cn(
              "h-9 px-3 rounded-lg border flex items-center gap-1.5 text-[11px] font-bold transition-all shrink-0",
              text.trim()
                ? "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500"
                : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
            )}
            disabled={!text.trim()}
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* Typing indicator */}
      <div className="flex items-center gap-1.5 mt-1.5 px-1 h-3">
        <span className="text-[9px] text-slate-700 font-mono">Sarah Chen is typing</span>
        <span className="flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1 w-1 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1 w-1 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   SEALED GATE
   ============================================================ */
function SealedGate({ onPreview }: { onPreview: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-lg w-full mx-auto px-4"
      >
        <div className="absolute inset-0 bg-cyan-500/5 rounded-3xl blur-3xl" />
        <div className="relative rounded-2xl border border-slate-800/40 bg-[#0c0c14] backdrop-blur-xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative text-center">
            <div className="inline-flex h-14 w-14 rounded-xl bg-slate-800 border border-slate-700 items-center justify-center mb-4">
              <Lock className="h-7 w-7 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sovereign Stream Sealed</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
              Owner-only access. Commit to this pool to unlock governance, real-time dividends, and hall activity.
            </p>
            <div className="space-y-2">
              <button
                onClick={onPreview}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 py-3 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all"
              >
                <Eye className="h-4 w-4" />
                Preview Stream
              </button>
              <button
                onClick={() => window.location.href = "/pools"}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
                Browse Pools
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800/30 flex items-center justify-center gap-6 text-[9px] text-slate-600 font-mono uppercase">
              <span>Owner-Only</span>
              <span>•</span>
              <span>Governance</span>
              <span>•</span>
              <span>Dividends</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function SovereignStreamPage() {
  const params = useParams();
  const hallId = params?.id as string;
  const [isPreview, setIsPreview] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const { data: accessData, isLoading } = useSWR(
    hallId ? `/api/halls/${hallId}/access` : null,
    fetcher,
    { shouldRetryOnError: false }
  );

  const isOwner = accessData?.isOwner || false;
  const canView = isOwner || isPreview;

  if (isLoading) {
    return (
      <div className="h-screen bg-[#050508] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="h-screen bg-[#050508] text-slate-100 flex flex-col">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/[0.02] rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col">
          <CompactHeader />
          <SealedGate onPreview={() => setIsPreview(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050508] text-slate-100 flex flex-col overflow-hidden selection:bg-cyan-500/20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <CompactHeader />

        {/* Demo banner */}
        {isPreview && (
          <div className="shrink-0 border-b border-amber-500/20 bg-amber-950/10 px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-amber-400" />
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Demo Preview</span>
              <span className="text-[9px] text-slate-600">Simulated data. Commit to participate.</span>
            </div>
            <button onClick={() => window.location.reload()} className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors">Exit</button>
          </div>
        )}

        {/* Main layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar — Member Roster */}
          <div className="hidden lg:block">
            <MemberSidebar open={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} />
          </div>
          <div className="lg:hidden">
            <MemberSidebar open={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} />
          </div>

          {/* Center — Chat Stream */}
          <ChatStream
            messages={DEMO_MESSAGES}
            replyTo={replyTo}
            onReply={(id) => setReplyTo(replyTo === id ? null : id)}
          />

          {/* Right sidebar — Treasury & Activity */}
          <div className="hidden lg:block">
            <RightPanel open={rightOpen} onToggle={() => setRightOpen(!rightOpen)} />
          </div>
          <div className="lg:hidden">
            <RightPanel open={rightOpen} onToggle={() => setRightOpen(!rightOpen)} />
          </div>
        </div>

        {/* Message Input */}
        <MessageInput replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
      </div>
    </div>
  );
}