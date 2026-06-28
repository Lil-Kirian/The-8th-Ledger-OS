// components/halls/cabinet-card.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Mic,
  ShieldCheck,
  ScrollText,
  Landmark,
  Crown,
  Clock,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Calendar,
  Hash,
  Gavel,
  ChevronRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export type CabinetRole = "speaker" | "treasurer" | "warden" | "scribe";

export interface CabinetMember {
  id: string;
  role: CabinetRole;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  electedAt: Date;
  expiresAt: Date;
  status: "active" | "expired" | "impeached" | "resigned";
  proposalsAuthored: number;
  lastActivityAt?: Date;
}

export interface CabinetCardProps {
  member: CabinetMember;
  hallId: string;
  canImpeach?: boolean;
  onImpeach?: (memberId: string) => void;
  onViewProfile?: (ledgerId: string) => void;
  className?: string;
}

//  Role Config

const ROLE_CONFIG: Record<
  CabinetRole,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    glow: string;
    description: string;
    powers: string[];
  }
> = {
  speaker: {
    label: "The Speaker",
    icon: Mic,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
    description: "Voice of the hall. Proposes strategies and appeals to the 8th Ledger.",
    powers: [
      "Propose governance votes",
      "Appeal to 8th Ledger for execution",
      "Set hall strategic direction",
      "Cannot spend hall funds",
    ],
  },
  treasurer: {
    label: "The Treasurer",
    icon: Landmark,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    description: "Financial oversight. Reviews revenue flows and flags anomalies.",
    powers: [
      "Read-only treasury access",
      "Review revenue & audit logs",
      "One multi-sig key holder",
      "Cannot spend hall funds",
    ],
  },
  warden: {
    label: "The Warden",
    icon: ShieldCheck,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    description: "Asset protection. Monitors insurance, maintenance, and staffing.",
    powers: [
      "Propose maintenance votes",
      "Monitor insurance & security",
      "Review worker performance",
      "Cannot spend hall funds",
    ],
  },
  scribe: {
    label: "The Scribe",
    icon: ScrollText,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    glow: "shadow-violet-500/20",
    description: "Communications. Publishes reports and coordinates messaging.",
    powers: [
      "Publish hall reports",
      "Coordinate Sovereign Stream",
      "Propose marketing votes",
      "Cannot spend hall funds",
    ],
  },
};

//  Helpers

function getTermProgress(electedAt: Date, expiresAt: Date): number {
  const now = Date.now();
  const start = electedAt.getTime();
  const end = expiresAt.getTime();
  const total = end - start;
  const elapsed = now - start;
  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;
  return Math.round((elapsed / total) * 100);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysRemaining(expiresAt: Date): number {
  const diff = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

//  Component

export function CabinetCard({
  member,
  hallId,
  canImpeach = false,
  onImpeach,
  onViewProfile,
  className,
}: CabinetCardProps) {
  const config = ROLE_CONFIG[member.role];
  const Icon = config.icon;
  const progress = getTermProgress(member.electedAt, member.expiresAt);
  const remaining = daysRemaining(member.expiresAt);
  const isExpired = member.status === "expired";
  const isImpeached = member.status === "impeached";
  const isActive = member.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-slate-950/80 backdrop-blur-md",
        "transition-all duration-300 hover:shadow-lg",
        config.border,
        config.glow,
        isImpeached && "opacity-60 border-red-500/30",
        isExpired && "opacity-70 border-slate-600/30",
        className
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "h-1 w-full",
          member.role === "speaker" && "bg-amber-500",
          member.role === "treasurer" && "bg-emerald-500",
          member.role === "warden" && "bg-cyan-500",
          member.role === "scribe" && "bg-violet-500"
        )}
      />

      <div className="p-5">
        {/* Header: Role + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                config.bg
              )}
            >
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <h3 className={cn("text-sm font-bold tracking-wide", config.color)}>
                {config.label}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Active
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border border-slate-500/20">
                <Clock className="h-3 w-3" />
                Expired
              </span>
            )}
            {isImpeached && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400 border border-red-500/20">
                <Ban className="h-3 w-3" />
                Impeached
              </span>
            )}
            {member.status === "resigned" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                Resigned
              </span>
            )}
          </div>
        </div>

        {/* Member Identity */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-900/60 p-3 border border-slate-800/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.displayName || member.ledgerId}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {member.displayName || "Anonymous Sovereign"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Hash className="h-3 w-3 text-slate-500" />
              <p className="text-xs font-mono text-slate-400 truncate">
                {member.ledgerId}
              </p>
            </div>
          </div>
          {onViewProfile && (
            <button
              onClick={() => onViewProfile(member.ledgerId)}
              className="ml-auto shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="View Profile"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Term Timeline */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Term
            </span>
            <span className="text-slate-300 font-medium">
              {remaining > 0 ? `${remaining} days left` : "Term ended"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className={cn(
                "h-full rounded-full",
                member.role === "speaker" && "bg-amber-500",
                member.role === "treasurer" && "bg-emerald-500",
                member.role === "warden" && "bg-cyan-500",
                member.role === "scribe" && "bg-violet-500"
              )}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{formatDate(member.electedAt)}</span>
            <span>{formatDate(member.expiresAt)}</span>
          </div>
        </div>

        {/* Powers List */}
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Powers & Limits
          </p>
          <ul className="space-y-1.5">
            {config.powers.map((power, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 text-xs",
                  power.includes("Cannot spend") ? "text-amber-400/90" : "text-slate-300"
                )}
              >
                {power.includes("Cannot spend") ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" />
                )}
                <span>{power}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-900/50 p-2.5 border border-slate-800/40 text-center">
            <p className="text-lg font-bold text-slate-100">
              {member.proposalsAuthored}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Proposals
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/50 p-2.5 border border-slate-800/40 text-center">
            <p className="text-lg font-bold text-slate-100">
              {member.lastActivityAt
                ? Math.max(
                    1,
                    Math.ceil(
                      (Date.now() - member.lastActivityAt.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Days since activity
            </p>
          </div>
        </div>

        {/* Actions */}
        {isActive && canImpeach && onImpeach && (
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <button
              onClick={() => onImpeach(member.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Gavel className="h-3.5 w-3.5" />
              Initiate Impeachment Vote
            </button>
            <p className="mt-1.5 text-center text-[10px] text-slate-500">
              Requires 51% hall vote to remove from office
            </p>
          </div>
        )}

        {/* Crown for primary admin override hint */}
        {member.ledgerId.startsWith("LED-ADMIN") && (
          <div className="absolute -top-1 -right-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
              <Crown className="h-3 w-3 text-amber-400" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

//  Skeleton Loader

export function CabinetCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
            <div className="h-3 w-40 rounded bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-800 animate-pulse" />
      </div>
      <div className="mt-4 h-12 rounded-xl bg-slate-800 animate-pulse" />
      <div className="mt-4 h-2 w-full rounded-full bg-slate-800 animate-pulse" />
      <div className="mt-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-slate-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default CabinetCard;