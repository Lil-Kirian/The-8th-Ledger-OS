"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useSovereignStream, StreamPost } from "@/hooks/use-sovereign-stream";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ChevronRight,
  BarChart3, Users, MessageSquare,
  Vote, Gavel, FileText, Send, Pin, Loader2, Search,
  CircleDollarSign, Receipt, Reply, CornerDownRight,
  Paperclip, AtSign, Crown,
  ShieldCheck, ScrollText, Banknote, Megaphone, ThumbsUp, PanelLeftClose, Bot, UserCheck
} from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
};

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

interface HallStreamData {
  name: string;
  class: string;
  id: string;
  assetValue: number;
  treasury: number;
  pir: number;
  lastDividend: number;
  dividendYield: string;
  sri: number;
  sriTier: string;
  totalOwners: number;
  activeProposals: number;
  nextDividend: string;
  location: string;
  assetType: string;
}

interface HallResponse {
  success: boolean;
  hall: { id: string; name: string; hallClass: string | null; sriScore: number; poolId: string };
  assetTracker?: {
    name?: string;
    verticalId?: string;
    assetValue?: number;
    selectedLocation?: string | null;
    assetBookValue?: number;
    pirAllocation?: number;
  } | null;
  treasury?: {
    balance: number;
    totalDistributed: number;
    lastDistribution?: string | null;
    pirDebt?: number;
  } | null;
  proposals?: Array<{ status: string }>;
  members?: Array<{
    ledgerId: string;
    displayName: string | null;
    avatar: string | null;
    ownershipPercent: number;
    role: string | null;
    lastActivityAt: string | null;
  }>;
}

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

function sriTier(score: number) {
  if (score >= 85) return "Platinum";
  if (score >= 70) return "Gold";
  if (score >= 55) return "Silver";
  return "Bronze";
}

function initials(name: string, ledgerId: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || ledgerId.slice(-2)).toUpperCase();
}

function streamRole(role?: string | null): Member["role"] {
  const normalized = (role || "owner").toLowerCase();
  if (["speaker", "treasurer", "warden", "scribe"].includes(normalized)) return normalized as Member["role"];
  return "owner";
}

function memberStatus(lastActivityAt?: string | null): Member["status"] {
  if (!lastActivityAt) return "offline";
  const minutes = (Date.now() - new Date(lastActivityAt).getTime()) / 60000;
  if (minutes < 15) return "online";
  if (minutes < 120) return "away";
  return "offline";
}

function buildHallData(data?: HallResponse): HallStreamData {
  const sri = Number(data?.hall?.sriScore || 0);
  const assetValue = Number(data?.assetTracker?.assetBookValue || data?.assetTracker?.assetValue || 0);
  const distributed = Number(data?.treasury?.totalDistributed || 0);
  const yieldPct = assetValue > 0 ? `${((distributed / assetValue) * 100).toFixed(1)}%` : "0%";
  return {
    name: data?.hall?.name || "Sovereign Hall",
    class: data?.hall?.hallClass || "I",
    id: data?.hall?.id || "",
    assetValue,
    treasury: Number(data?.treasury?.balance || 0),
    pir: Number(data?.treasury?.pirDebt || data?.assetTracker?.pirAllocation || 0),
    lastDividend: distributed,
    dividendYield: yieldPct,
    sri,
    sriTier: sriTier(sri),
    totalOwners: data?.members?.length || 0,
    activeProposals: data?.proposals?.filter((p) => p.status === "active" || p.status === "pending").length || 0,
    nextDividend: data?.treasury?.lastDistribution
      ? new Date(data.treasury.lastDistribution).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Pending",
    location: data?.assetTracker?.selectedLocation || "Location pending",
    assetType: data?.assetTracker?.verticalId || "Asset",
  };
}

function mapHallMembers(data?: HallResponse): Member[] {
  return (data?.members || []).map((member) => {
    const name = member.displayName || member.ledgerId;
    const role = streamRole(member.role);
    return {
      id: member.ledgerId,
      name,
      ledgerId: member.ledgerId,
      role,
      avatar: member.avatar && !member.avatar.startsWith("http") ? member.avatar : initials(name, member.ledgerId),
      stake: Number(member.ownershipPercent || 0),
      status: memberStatus(member.lastActivityAt),
      lastSeen: member.lastActivityAt ? timeAgo(member.lastActivityAt) : undefined,
      isExecutive: role !== "owner",
    };
  });
}

function postType(type: StreamPost["type"]): StreamMessage["type"] {
  if (type === "PROPOSAL") return "proposal";
  if (type === "REPORT") return "alert";
  if (type === "APPEAL") return "thread_parent";
  return "system";
}

function mapStreamPost(post: StreamPost): StreamMessage {
  const authorName = post.author?.displayName || post.author?.ledgerId || "8th Ledger Protocol";
  return {
    id: post.id,
    type: post.isSystem ? "system" : postType(post.type),
    priority: post.type === "REPORT" ? "high" : "medium",
    authorId: post.authorId || "system",
    authorName,
    authorLedgerId: post.author?.ledgerId || "LED-SYSTEM",
    authorRole: post.isSystem ? "system" : "owner",
    authorAvatar: initials(authorName, post.author?.ledgerId || "SYS"),
    content: post.content,
    timestamp: post.createdAt,
    likes: 0,
    replies: [],
    replyCount: post.replyCount || 0,
    tags: [post.type.toLowerCase()],
    pinned: post.isSystem || false,
    readBy: [],
    metadata: post.type === "PROPOSAL" ? { proposalTitle: post.title, voteThreshold: 51 } : undefined,
  };
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
function CompactHeader({ hallData }: { hallData: HallStreamData }) {
  return (
    <div className="shrink-0 border-b border-slate-800/40 bg-[#0a0a0f]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white truncate">{hallData.name}</h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">Class {hallData.class}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">{hallData.sriTier}</span>
            </div>
            <p className="text-[10px] text-slate-600 font-mono truncate">{hallData.id} • {hallData.location} • {hallData.assetType}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Treasury</p>
            <p className="text-xs font-bold text-white font-mono">{formatCompact(hallData.treasury)}</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Yield</p>
            <p className="text-xs font-bold text-emerald-400 font-mono">{hallData.dividendYield}</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">SRI</p>
            <p className="text-xs font-bold text-amber-400 font-mono">{hallData.sri}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MEMBER SIDEBAR
   ============================================================ */
function MemberSidebar({ open, onToggle, members, hallData }: { open: boolean; onToggle: () => void; members: Member[]; hallData: HallStreamData }) {
  const [filter, setFilter] = useState("");
  const filtered = members.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()) || m.ledgerId.toLowerCase().includes(filter.toLowerCase()));
  const onlineCount = members.filter(m => m.status === "online").length;

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
                <span className="text-[10px] font-mono text-slate-500">{onlineCount}/{members.length}</span>
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
                <span className="text-[10px] font-bold text-white font-mono">{members.reduce((sum, m) => sum + m.stake, 0).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600">Active Proposals</span>
                <span className="text-[10px] font-bold text-violet-400 font-mono">{hallData.activeProposals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600">Next Dividend</span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono">{hallData.nextDividend}</span>
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
function RightPanel({ open, onToggle, hallData, activity }: { open: boolean; onToggle: () => void; hallData: HallStreamData; activity: StreamMessage[] }) {
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
                  <span className="text-xs font-bold text-white font-mono">{formatCompact(hallData.treasury)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Asset Value</span>
                  <span className="text-[11px] font-bold text-slate-300 font-mono">{formatCompact(hallData.assetValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">PIR Reserve</span>
                  <span className="text-[11px] font-bold text-amber-400 font-mono">{formatCompact(hallData.pir)}</span>
                </div>
                <div className="h-px bg-slate-800/30" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Last Dividend</span>
                  <span className="text-[11px] font-bold text-emerald-400 font-mono">{formatCompact(hallData.lastDividend)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Yield</span>
                  <span className="text-[11px] font-bold text-amber-400 font-mono">{hallData.dividendYield}</span>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-800/30">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity Log</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {activity.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[9px] font-mono text-slate-700 shrink-0 pt-0.5">{timeAgo(a.timestamp)}</span>
                    <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                      a.type === "dividend" ? "bg-emerald-400" : a.type === "alert" ? "bg-rose-400" : "bg-slate-600"
                    )} />
                    <span className="text-[10px] text-slate-400">{a.content}</span>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-[10px] text-slate-600">No hall activity has been posted yet.</p>
                )}
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
function MessageInput({ replyTo, onCancelReply, onSend }: { replyTo: string | null; onCancelReply: () => void; onSend: (type: "PROPOSAL" | "REPORT" | "8TH_LEDGER_UPDATE", content: string) => Promise<boolean> }) {
  const [text, setText] = useState("");
  const [msgType, setMsgType] = useState<"chat" | "proposal" | "poll" | "announcement">("chat");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [sending, setSending] = useState(false);

  const typeConfig = {
    chat: { label: "Message", icon: MessageSquare, color: "text-slate-400" },
    proposal: { label: "Proposal", icon: Gavel, color: "text-violet-400" },
    poll: { label: "Poll", icon: Vote, color: "text-amber-400" },
    announcement: { label: "Announce", icon: Megaphone, color: "text-cyan-400" },
  };

  async function submit() {
    if (!text.trim() || sending) return;
    setSending(true);
    const type = msgType === "proposal" ? "PROPOSAL" : msgType === "poll" ? "REPORT" : "8TH_LEDGER_UPDATE";
    const ok = await onSend(type, text.trim());
    setSending(false);
    if (ok) {
      setText("");
      onCancelReply();
    }
  }

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
                submit();
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
            onClick={submit}
            className={cn(
              "h-9 px-3 rounded-lg border flex items-center gap-1.5 text-[11px] font-bold transition-all shrink-0",
              text.trim() && !sending
                ? "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500"
                : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
            )}
            disabled={!text.trim() || sending}
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SEALED GATE
   ============================================================ */
function SealedGate({ onBrowse }: { onBrowse: () => void }) {
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
                onClick={onBrowse}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 py-3 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
                Browse Pools
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
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const { data: hallDataRaw, error: hallError, isLoading } = useSWR<HallResponse>(
    hallId ? `/api/halls/${hallId}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const { posts, createPost, isLoading: streamLoading } = useSovereignStream(hallId);

  const hallData = buildHallData(hallDataRaw);
  const members = mapHallMembers(hallDataRaw);
  const messages = posts.map(mapStreamPost);
  const canView = !hallError;

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
          <CompactHeader hallData={hallData} />
          <SealedGate onBrowse={() => window.location.href = "/pools"} />
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
        <CompactHeader hallData={hallData} />

        {/* Main layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar — Member Roster */}
          <div className="hidden lg:block">
            <MemberSidebar open={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} members={members} hallData={hallData} />
          </div>
          <div className="lg:hidden">
            <MemberSidebar open={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} members={members} hallData={hallData} />
          </div>

          {/* Center — Chat Stream */}
          <ChatStream
            messages={streamLoading ? [] : messages}
            replyTo={replyTo}
            onReply={(id) => setReplyTo(replyTo === id ? null : id)}
          />

          {/* Right sidebar — Treasury & Activity */}
          <div className="hidden lg:block">
            <RightPanel open={rightOpen} onToggle={() => setRightOpen(!rightOpen)} hallData={hallData} activity={messages} />
          </div>
          <div className="lg:hidden">
            <RightPanel open={rightOpen} onToggle={() => setRightOpen(!rightOpen)} hallData={hallData} activity={messages} />
          </div>
        </div>

        {/* Message Input */}
        <MessageInput
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={async (type, content) => {
            const result = await createPost({ type, title: content.slice(0, 80), content });
            return !!result;
          }}
        />
      </div>
    </div>
  );
}
