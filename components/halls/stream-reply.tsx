// components/halls/stream-reply.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Reply,
  Send,
  X,
  Clock,
  Hash,
  BadgeCheck,
  Shield,
  Mic,
  Landmark,
  ScrollText,
  CornerDownRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export type ExecutiveRole = "speaker" | "treasurer" | "warden" | "scribe" | "admin";

export interface StreamReplyData {
  id: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  content: string;
  createdAt: Date;
  isExecutive?: boolean;
  executiveRole?: ExecutiveRole;
  parentReplyId?: string; // For nested threading
  editedAt?: Date;
}

export interface StreamReplyProps {
  reply: StreamReplyData;
  currentUserLedgerId?: string;
  isNested?: boolean;
  onReply?: (replyId: string, content: string) => void;
  onEdit?: (replyId: string, content: string) => void;
  onDelete?: (replyId: string) => void;
  onViewProfile?: (ledgerId: string) => void;
  className?: string;
}

export interface StreamReplyInputProps {
  parentPostId?: string;
  parentReplyId?: string;
  placeholder?: string;
  onSubmit: (content: string) => void | Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
}

//  Role Config

const ROLE_CONFIG: Record<ExecutiveRole, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  speaker: { label: "Speaker", color: "text-amber-400", bg: "bg-amber-500/15", icon: Mic },
  treasurer: { label: "Treasurer", color: "text-emerald-400", bg: "bg-emerald-500/15", icon: Landmark },
  warden: { label: "Warden", color: "text-cyan-400", bg: "bg-cyan-500/15", icon: Shield },
  scribe: { label: "Scribe", color: "text-violet-400", bg: "bg-violet-500/15", icon: ScrollText },
  admin: { label: "8th Ledger", color: "text-rose-400", bg: "bg-rose-500/15", icon: BadgeCheck },
};

//  Helpers

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

function getInitials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

//  Reply Card

export function StreamReply({
  reply,
  currentUserLedgerId,
  isNested = false,
  onReply,
  onEdit,
  onDelete,
  onViewProfile,
  className,
}: StreamReplyProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);
  const [showActions, setShowActions] = useState(false);
  const isOwn = currentUserLedgerId === reply.ledgerId;
  const isAdmin = reply.executiveRole === "admin";
  const roleCfg = reply.executiveRole ? ROLE_CONFIG[reply.executiveRole] : null;
  const RoleIcon = roleCfg?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: isNested ? 12 : 0, y: isNested ? 0 : 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group relative",
        isNested && "ml-6 border-l-2 border-slate-800 pl-4",
        className
      )}
    >
      <div className={cn(
        "flex gap-3 rounded-xl border bg-slate-900/50 p-3.5 transition-all hover:border-slate-700/50",
        reply.isExecutive ? "border-slate-700/40" : "border-slate-800/40",
        isAdmin && "border-rose-500/20 bg-rose-500/5"
      )}>
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full overflow-hidden text-[10px] font-bold",
              reply.avatar ? "" : "bg-slate-700 text-slate-300",
              isAdmin && "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30"
            )}
          >
            {reply.avatar ? (
              <img src={reply.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              getInitials(reply.displayName || reply.ledgerId)
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onViewProfile?.(reply.ledgerId)}
              className="text-xs font-semibold text-slate-200 hover:text-cyan-400 transition-colors"
            >
              {reply.displayName || reply.ledgerId}
            </button>

            {reply.isExecutive && roleCfg && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                roleCfg.bg,
                roleCfg.color,
                isAdmin ? "border-rose-500/30" : "border-slate-700/50"
              )}>
                {RoleIcon && <RoleIcon className="h-2.5 w-2.5" />}
                {roleCfg.label}
              </span>
            )}

            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatTimeAgo(reply.createdAt)}
            </span>

            {reply.editedAt && (
              <span className="text-[9px] text-slate-600 italic">(edited)</span>
            )}

            {/* Actions dropdown trigger */}
            <div className="ml-auto relative">
              <button
                onClick={() => setShowActions((s) => !s)}
                className="rounded p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-slate-800 hover:text-slate-300 transition-all"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-slate-700 bg-slate-900 shadow-xl py-1">
                  {onReply && (
                    <button
                      onClick={() => {
                        setIsReplying(true);
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Reply className="h-3 w-3" />
                      Reply
                    </button>
                  )}
                  {isOwn && onEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <CornerDownRight className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                  {isOwn && onDelete && (
                    <button
                      onClick={() => {
                        onDelete(reply.id);
                        setShowActions(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ledger ID (subtle) */}
          <div className="mt-0.5 flex items-center gap-1">
            <Hash className="h-2.5 w-2.5 text-slate-600" />
            <span className="text-[10px] font-mono text-slate-600">{reply.ledgerId}</span>
          </div>

          {/* Body */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 resize-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onEdit?.(reply.id, editText);
                    setIsEditing(false);
                  }}
                  className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditText(reply.content);
                    setIsEditing(false);
                  }}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {reply.content}
            </p>
          )}

          {/* Nested reply input */}
          {isReplying && onReply && (
            <div className="mt-3">
              <StreamReplyInput
                parentReplyId={reply.id}
                placeholder={`Reply to ${reply.displayName || reply.ledgerId}...`}
                onSubmit={async (content) => {
                  await onReply(reply.id, content);
                  setIsReplying(false);
                }}
                onCancel={() => setIsReplying(false)}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

//  Reply Input ─

export function StreamReplyInput({
  parentPostId,
  parentReplyId,
  placeholder = "Write a reply...",
  onSubmit,
  onCancel,
  autoFocus = false,
  className,
}: StreamReplyInputProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <input
          type="text"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          autoFocus={autoFocus}
          className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 pl-3 pr-10 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
        {text.length > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-600">
            {text.length}
          </span>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !text.trim()}
        className="rounded-lg bg-cyan-500/15 px-3 py-2 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 disabled:opacity-40 transition-colors"
        title="Send reply"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
      {onCancel && (
        <button
          onClick={onCancel}
          className="rounded-lg bg-slate-800 px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

//  Skeleton ─

export function StreamReplySkeleton({ isNested = false }: { isNested?: boolean }) {
  return (
    <div className={cn("flex gap-3", isNested && "ml-6 border-l-2 border-slate-800 pl-4")}>
      <div className="h-8 w-8 shrink-0 rounded-full bg-slate-800 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 rounded bg-slate-800 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="h-3 w-full rounded bg-slate-800 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}

export default StreamReply;