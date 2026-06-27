// components/agora/qa-thread.tsx
// 8th Ledger — The Archives: Q&A Thread
// "Every question is a scroll. Every answer is a decree."

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {

  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  Crown,
  Shield,
  ChevronDown,
  Feather,
  Quote,
  CornerDownRight,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES — Schema-Aligned
// ─────────────────────────────────────────────────────────────

export interface QAItem {
  id: string;
  question: string;
  answer: string | null;
  status: "pending" | "answered" | "rejected";
  createdAt: string;
  answeredAt: string | null;
  author: {
    ledgerId: string;
    displayName: string;
    avatar?: string | null;
  };
  answerer: {
    ledgerId: string;
    displayName: string;
    role: string;
    kycTier: string;
    avatar?: string | null;
  } | null;
}

interface QAThreadProps {
  item: QAItem;
  index?: number;
  defaultExpanded?: boolean;
}

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM — The Archive Palette
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: "Awaiting The Scribe",
    short: "Pending",
    icon: HelpCircle,
    color: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/15",
    glow: "shadow-amber-400/5",
    accent: "bg-amber-400",
  },
  answered: {
    label: "Answered by The Scribe",
    short: "Answered",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/15",
    glow: "shadow-emerald-400/5",
    accent: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected by Council",
    short: "Rejected",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-400/8",
    border: "border-red-400/15",
    glow: "shadow-red-400/5",
    accent: "bg-red-400",
  },
} as const;

const ROLE_BADGES = {
  admin: {
    label: "The Architect",
    icon: Crown,
    color: "text-purple-300",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    glow: "shadow-purple-400/10",
  },
  herald: {
    label: "Herald",
    icon: Shield,
    color: "text-cyan-300",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    glow: "shadow-cyan-400/10",
  },
  user: {
    label: "Sovereign",
    icon: User,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/20",
    glow: "",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function getRoleBadge(answerer: QAItem["answerer"]) {
  if (!answerer) return null;
  if (answerer.role === "admin") return ROLE_BADGES.admin;
  if (answerer.kycTier === "verified" || answerer.kycTier === "whale") return ROLE_BADGES.herald;
  return ROLE_BADGES.user;
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function Avatar({
  src,
  fallback,
  size = "sm",
  ring = false,
  ringColor = "border-slate-700",
}: {
  src?: string | null;
  fallback: React.ReactNode;
  size?: "xs" | "sm" | "md";
  ring?: boolean;
  ringColor?: string;
}) {
  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-9 h-9",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full overflow-hidden shrink-0
        bg-slate-800 border flex items-center justify-center
        ${ring ? `ring-2 ring-offset-1 ring-offset-slate-950 ${ringColor}` : "border-slate-700"}
      `}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
        text-[10px] font-bold uppercase tracking-wider
        ${config.bg} ${config.color} border ${config.border}
      `}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function RoleBadge({ answerer }: { answerer: QAItem["answerer"] }) {
  const badge = getRoleBadge(answerer);
  if (!badge) return null;
  const Icon = badge.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-md
        text-[10px] font-semibold
        ${badge.bg} ${badge.color} border ${badge.border}
      `}
    >
      <Icon className="w-2.5 h-2.5" />
      {badge.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function QAThread({ item, index = 0, defaultExpanded = false }: QAThreadProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || item.status === "pending");
  const status = STATUS_CONFIG[item.status];
  const StatusIcon = status.icon;

  const isAnswered = item.status === "answered" && item.answer;
  const isRejected = item.status === "rejected";

  // Auto-expand answered items on first render if they have substantial content
  const shouldAutoExpand = useMemo(() => {
    if (item.status === "answered" && item.answer && item.answer.length > 100) return true;
    return false;
  }, [item.status, item.answer]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      className={`
        group relative rounded-xl overflow-hidden
        border backdrop-blur-md transition-all duration-300
        ${status.border} ${status.bg}
        hover:shadow-lg ${status.glow}
      `}
    >
      {/* Top accent line */}
      <div className={`h-0.5 w-full ${status.accent} opacity-60`} />

      {/* ── QUESTION HEADER ── */}
      <div
        className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <StatusBadge status={item.status} />
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                {timeAgo(item.createdAt)}
              </span>
            </div>

            {/* Question — styled as a scroll entry */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Quote className="w-4 h-4 text-slate-700 shrink-0" />
              </div>
              <h3 className="text-sm font-medium text-slate-200 leading-relaxed">
                {item.question}
              </h3>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            className={`
              p-1.5 rounded-lg shrink-0 mt-0.5 transition-all
              text-slate-600 hover:text-slate-300 hover:bg-slate-800/50
            `}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Author strip */}
        <div className="flex items-center gap-2.5 mt-4 pl-7">
          <Avatar
            src={item.author.avatar}
            fallback={<User className="w-3 h-3 text-slate-600" />}
            size="xs"
          />
          <span className="text-[11px] text-slate-500">
            Asked by{" "}
            <span className="text-slate-400 font-medium">{item.author.displayName}</span>
            <span className="text-slate-600 font-mono ml-1.5">{item.author.ledgerId}</span>
          </span>
        </div>
      </div>

      {/* ── ANSWER SECTION ── */}
      <AnimatePresence>
        {expanded && isAnswered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {/* Divider */}
              <div className="h-px bg-slate-800/60 mb-4" />

              {/* Answer container */}
              <div className="relative pl-4">
                {/* Vertical accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-emerald-500/20" />

                {/* Answerer header */}
                {item.answerer && (
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={item.answerer.avatar}
                      fallback={<Feather className="w-4 h-4 text-slate-500" />}
                      size="sm"
                      ring
                      ringColor="border-emerald-500/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-200">
                          {item.answerer.displayName}
                        </span>
                        <RoleBadge answerer={item.answerer} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-600 font-mono">
                          {item.answerer.ledgerId}
                        </span>
                        {item.answeredAt && (
                          <>
                            <span className="text-[10px] text-slate-700">•</span>
                            <span className="text-[10px] text-slate-600">
                              {timeAgo(item.answeredAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* The Answer — styled as a decree */}
                <div className="relative">
                  <div className="flex items-start gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-500/40 shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {item.answer}
                      </p>
                    </div>
                  </div>

                  {/* Scribe seal */}
                  <div className="flex items-center gap-1.5 mt-4 ml-5">
                    <Sparkles className="w-3 h-3 text-emerald-500/40" />
                    <span className="text-[10px] text-emerald-500/40 font-medium uppercase tracking-wider">
                      Verified by The Scribe
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REJECTED SECTION ── */}
      <AnimatePresence>
        {expanded && isRejected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="h-px bg-slate-800/60 mb-4" />
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-red-500/20" />
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-300/80 leading-relaxed">
                      This question was reviewed by the moderation council and rejected
                      for violating community guidelines or falling outside the scope of The Archives.
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      Rejected questions are archived for transparency but do not receive answers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PENDING HINT ── */}
      {!expanded && item.status === "pending" && (
        <div className="px-5 pb-4 pl-12">
          <span className="text-[10px] text-amber-500/40 italic">
            Click to expand • Awaiting response from The Scribe
          </span>
        </div>
      )}
    </motion.div>
  );
}