// components/halls/stream-post.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  FileText,
  ShieldAlert,
  Landmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Pin,
  TrendingUp,
  Calendar,
  Reply,
  Send,
  X,
  BadgeCheck,
  Wrench,
  AlertTriangle,
  Gavel,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────

export type StreamPostType = "proposal" | "report" | "appeal" | "ledger_update";

export interface StreamReply {
  id: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  content: string;
  createdAt: Date;
  isExecutive?: boolean;
  executiveRole?: string;
}

export interface StreamPostData {
  id: string;
  type: StreamPostType;
  title: string;
  content: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  createdAt: Date;
  voteClosesAt?: Date;
  voteYes?: number;
  voteNo?: number;
  voteAbstain?: number;
  status?: "active" | "passed" | "rejected" | "executing" | "completed";
  amount?: number;
  isPinned?: boolean;
  isRead?: boolean;
  replies: StreamReply[];
  tags?: string[];
}

export interface StreamPostProps {
  post: StreamPostData;
  currentUserLedgerId?: string;
  canVote?: boolean;
  canPin?: boolean;
  onVote?: (postId: string, vote: "yes" | "no" | "abstain") => void;
  onPin?: (postId: string) => void;
  onReply?: (postId: string, content: string) => void;
  onViewProfile?: (ledgerId: string) => void;
  defaultExpanded?: boolean;
  className?: string;
}

// ─── Type Config ───────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  StreamPostType,
  {
    label: string;
    prefix: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    badge: string;
    glow: string;
  }
> = {
  proposal: {
    label: "Proposal",
    prefix: "[PROPOSAL]",
    icon: Vote,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    glow: "shadow-amber-500/10",
  },
  report: {
    label: "Report",
    prefix: "[REPORT]",
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  appeal: {
    label: "Appeal",
    prefix: "[APPEAL]",
    icon: ShieldAlert,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    glow: "shadow-cyan-500/10",
  },
  ledger_update: {
    label: "8th Ledger",
    prefix: "[8TH LEDGER]",
    icon: Landmark,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    glow: "shadow-violet-500/10",
  },
};

// ─── Status Config ───────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  { label: string; class: string; icon: React.ElementType }
> = {
  active: {
    label: "Voting Open",
    class: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  passed: {
    label: "Passed",
    class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    class: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: XCircle,
  },
  executing: {
    label: "Executing",
    class: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    icon: Wrench,
  },
  completed: {
    label: "Completed",
    class: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    icon: BadgeCheck,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getVotePercent(yes: number, no: number, abstain: number) {
  const total = yes + no + abstain;
  if (total === 0) return { yes: 0, no: 0, abstain: 0 };
  return {
    yes: Math.round((yes / total) * 100),
    no: Math.round((no / total) * 100),
    abstain: 100 - Math.round((yes / total) * 100) - Math.round((no / total) * 100),
  };
}

// ─── Sub-Components ──────────────────────────────────────────────────

function VoteBar({ yes, no, abstain }: { yes: number; no: number; abstain: number }) {
  const { yes: y, no: n, abstain: a } = getVotePercent(yes, no, abstain);
  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
        {y > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${y}%` }} className="h-full bg-emerald-500" transition={{ duration: 0.6, ease: "easeOut" }} />}
        {n > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${n}%` }} className="h-full bg-red-500" transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }} />}
        {a > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${a}%` }} className="h-full bg-slate-500" transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }} />}
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="h-3 w-3" /> {y}% Yes
        </span>
        <span className="flex items-center gap-1 text-red-400 font-medium">
          <XCircle className="h-3 w-3" /> {n}% No
        </span>
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          <MoreHorizontal className="h-3 w-3" /> {a}% Abstain
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cfg = STATUS_MAP[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cfg.class)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function ReplyCard({ reply }: { reply: StreamReply }) {
  return (
    <div className="flex gap-3 rounded-lg bg-slate-800/40 p-3 border border-slate-800/50">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-300 overflow-hidden">
        {reply.avatar ? (
          <img src={reply.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold">
            {(reply.displayName || reply.ledgerId).charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-200">
            {reply.displayName || reply.ledgerId}
          </span>
          {reply.isExecutive && (
            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-400 border border-cyan-500/20">
              {reply.executiveRole}
            </span>
          )}
          <span className="text-[10px] text-slate-500">{formatTimeAgo(reply.createdAt)}</span>
        </div>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{reply.content}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function StreamPost({
  post,
  currentUserLedgerId,
  canVote = false,
  canPin = false,
  onVote,
  onPin,
  onReply,
  onViewProfile,
  defaultExpanded = false,
  className,
}: StreamPostProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<"yes" | "no" | "abstain" | null>(null);

  const cfg = TYPE_CONFIG[post.type];
  const TypeIcon = cfg.icon;
  const hasVoting = (post.type === "proposal" || post.type === "appeal") && post.status === "active";
  const isLedgerUpdate = post.type === "ledger_update";

  const handleVote = (vote: "yes" | "no" | "abstain") => {
    if (!onVote) return;
    setUserVote(vote);
    onVote(post.id, vote);
  };

  const handleReply = async () => {
    if (!onReply || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(post.id, replyText.trim());
      setReplyText("");
      setShowReplyInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-slate-900/60 backdrop-blur-sm transition-all duration-300",
        cfg.border,
        cfg.glow,
        post.isPinned && "ring-1 ring-amber-500/20",
        isExpanded && "shadow-lg",
        className
      )}
    >
      {/* Top accent line */}
      <div className={cn(
        "h-[2px] w-full",
        post.type === "proposal" && "bg-amber-500",
        post.type === "report" && "bg-emerald-500",
        post.type === "appeal" && "bg-cyan-500",
        post.type === "ledger_update" && "bg-violet-500"
      )} />

      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
              <TypeIcon className={cn("h-4.5 w-4.5", cfg.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", cfg.color)}>
                  {cfg.prefix}
                </span>
                {post.isPinned && (
                  <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                    <Pin className="h-2.5 w-2.5" />
                    Pinned
                  </span>
                )}
                <StatusBadge status={post.status} />
                {isLedgerUpdate && (
                  <span className="flex items-center gap-1 rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-400 border border-violet-500/15">
                    <Eye className="h-2.5 w-2.5" />
                    Auto-Generated
                  </span>
                )}
              </div>
              <h3
                className="text-sm font-semibold text-slate-100 mt-0.5 leading-snug cursor-pointer hover:text-cyan-400 transition-colors"
                onClick={() => setIsExpanded((e) => !e)}
              >
                {post.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canPin && onPin && (
              <button
                onClick={() => onPin(post.id)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                title={post.isPinned ? "Unpin" : "Pin to top"}
              >
                <Pin className={cn("h-3.5 w-3.5", post.isPinned && "fill-amber-400 text-amber-400")} />
              </button>
            )}
            <button
              onClick={() => setIsExpanded((e) => !e)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
          <span
            className="flex items-center gap-1 cursor-pointer hover:text-cyan-400 transition-colors"
            onClick={() => onViewProfile?.(post.ledgerId)}
          >
            <Hash className="h-3 w-3" />
            <span className="font-mono text-slate-400">{post.ledgerId}</span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(post.createdAt)}
          </span>
          {post.amount !== undefined && post.amount > 0 && (
            <>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <TrendingUp className="h-3 w-3" />
                ${post.amount.toLocaleString()}
              </span>
            </>
          )}
          {post.voteClosesAt && post.status === "active" && (
            <>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Calendar className="h-3 w-3" />
                Closes {formatTimeAgo(post.voteClosesAt)}
              </span>
            </>
          )}
          {post.replies.length > 0 && !isExpanded && (
            <>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Reply className="h-3 w-3" />
                {post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}
              </span>
            </>
          )}
        </div>

        {/* Content Preview */}
        <div className="mt-3">
          <p className={cn(
            "text-xs text-slate-300 leading-relaxed whitespace-pre-wrap",
            !isExpanded && "line-clamp-3"
          )}>
            {post.content}
          </p>
        </div>

        {/* Voting Section */}
        {hasVoting && post.voteYes !== undefined && post.voteNo !== undefined && post.voteAbstain !== undefined && (
          <div className="mt-4 rounded-xl bg-slate-800/30 p-3 border border-slate-800/50">
            <VoteBar yes={post.voteYes} no={post.voteNo} abstain={post.voteAbstain} />
            {canVote && !userVote && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleVote("yes")}
                  className="flex-1 rounded-lg bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Vote Yes
                </button>
                <button
                  onClick={() => handleVote("no")}
                  className="flex-1 rounded-lg bg-red-500/10 py-2 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Vote No
                </button>
                <button
                  onClick={() => handleVote("abstain")}
                  className="flex-1 rounded-lg bg-slate-700/40 py-2 text-xs font-semibold text-slate-400 border border-slate-600/30 hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  Abstain
                </button>
              </div>
            )}
            {userVote && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-slate-800/50 py-2 border border-slate-700/30">
                <BadgeCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs text-slate-300">
                  You voted <span className={cn(
                    "font-semibold capitalize",
                    userVote === "yes" && "text-emerald-400",
                    userVote === "no" && "text-red-400",
                    userVote === "abstain" && "text-slate-400"
                  )}>{userVote}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Ledger Update Amount Block */}
        {isLedgerUpdate && post.amount !== undefined && post.amount !== 0 && (
          <div className="mt-3 rounded-xl bg-violet-500/5 p-3 border border-violet-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-slate-400">8th Ledger Transaction</span>
            </div>
            <span className={cn(
              "text-sm font-bold font-mono",
              post.amount > 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {post.amount > 0 ? "+" : ""}${Math.abs(post.amount).toLocaleString()}
            </span>
          </div>
        )}

        {/* Expanded: Replies + Reply Input */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
                {post.replies.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Reply className="h-6 w-6 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500">No threaded replies yet.</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Be the first to respond.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {post.replies.map((reply) => (
                      <ReplyCard key={reply.id} reply={reply} />
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {onReply && (
                  <div className="pt-2">
                    {showReplyInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a threaded reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleReply();
                            }
                          }}
                          className="flex-1 rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                          autoFocus
                        />
                        <button
                          onClick={handleReply}
                          disabled={isSubmitting || !replyText.trim()}
                          className="rounded-lg bg-cyan-500/15 px-3 py-2 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 disabled:opacity-40 transition-colors"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setShowReplyInput(false);
                            setReplyText("");
                          }}
                          className="rounded-lg bg-slate-800 px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReplyInput(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800/40 py-2.5 text-xs text-slate-500 hover:text-cyan-400 hover:bg-slate-800/60 border border-slate-800/50 transition-all"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        Reply to this thread
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Impeachment warning for proposals */}
        {post.type === "proposal" && post.status === "rejected" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/5 p-2.5 border border-red-500/10">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <p className="text-[10px] text-red-400/80">
              Proposal rejected. Consider revision before re-submission.
            </p>
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────

export function StreamPostSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-slate-800 animate-pulse" />
            <div className="h-4 w-48 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse" />
      </div>
      <div className="h-12 rounded bg-slate-800 animate-pulse" />
      <div className="h-8 rounded-xl bg-slate-800 animate-pulse" />
    </div>
  );
}

export default StreamPost;