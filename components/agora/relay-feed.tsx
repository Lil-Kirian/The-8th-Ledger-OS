// components/agora/relay-feed.tsx
// 8th Ledger — The Relay: Governance Wire
// "Every vote is recorded. Every decision is witnessed. Nothing is hidden."

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Vote,
  FileText,
  Wrench,
  UserPlus,
  UserMinus,
  Package,
  AlertTriangle,
  Gavel,
  MapPin,
  Shield,
  Crown,
  Medal,
  Award,
  Clock,
  Hash,
  Radio,
  ChevronRight,
  FileCheck,
} from "lucide-react";

//
// TYPES — Schema-Aligned
//

export interface RelayFeedItem {
  id: string;
  timestamp: string;
  hall: {
    id: string;
    name: string;
    status: string;
    class: string | null;
    sri: {
      score: number;
      tier: "platinum" | "gold" | "silver" | "bronze" | "at_risk";
    };
  };
  event: {
    type: string;
    description: string;
  };
}

interface RelayFeedProps {
  item: RelayFeedItem;
  index?: number;
  isLast?: boolean;
}

//
// DESIGN SYSTEM — The Governance Wire
//

const EVENT_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  vote: {
    icon: Vote,
    label: "Governance Vote",
    color: "text-cyan-400",
    bg: "bg-cyan-400/8",
    border: "border-cyan-400/15",
    glow: "shadow-cyan-400/5",
  },
  proposal: {
    icon: FileText,
    label: "Proposal Filed",
    color: "text-blue-400",
    bg: "bg-blue-400/8",
    border: "border-blue-400/15",
    glow: "shadow-blue-400/5",
  },
  execution: {
    icon: FileCheck,
    label: "Execution Complete",
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/15",
    glow: "shadow-emerald-400/5",
  },
  hire: {
    icon: UserPlus,
    label: "Hire Approved",
    color: "text-violet-400",
    bg: "bg-violet-400/8",
    border: "border-violet-400/15",
    glow: "shadow-violet-400/5",
  },
  fire: {
    icon: UserMinus,
    label: "Termination Approved",
    color: "text-orange-400",
    bg: "bg-orange-400/8",
    border: "border-orange-400/15",
    glow: "shadow-orange-400/5",
  },
  maintenance: {
    icon: Wrench,
    label: "Maintenance Order",
    color: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/15",
    glow: "shadow-amber-400/5",
  },
  inventory: {
    icon: Package,
    label: "Inventory Action",
    color: "text-teal-400",
    bg: "bg-teal-400/8",
    border: "border-teal-400/15",
    glow: "shadow-teal-400/5",
  },
  closure: {
    icon: AlertTriangle,
    label: "Closure Protocol",
    color: "text-red-400",
    bg: "bg-red-400/8",
    border: "border-red-400/15",
    glow: "shadow-red-400/5",
  },
  impeach: {
    icon: Gavel,
    label: "Impeachment Vote",
    color: "text-rose-400",
    bg: "bg-rose-400/8",
    border: "border-rose-400/15",
    glow: "shadow-rose-400/5",
  },
  pir_advance: {
    icon: Shield,
    label: "PIR Advance",
    color: "text-indigo-400",
    bg: "bg-indigo-400/8",
    border: "border-indigo-400/15",
    glow: "shadow-indigo-400/5",
  },
  location_select: {
    icon: MapPin,
    label: "Location Selected",
    color: "text-sky-400",
    bg: "bg-sky-400/8",
    border: "border-sky-400/15",
    glow: "shadow-sky-400/5",
  },
};

const SRI_CONFIG = {
  platinum: {
    icon: Crown,
    label: "Platinum",
    color: "text-purple-300",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    ring: "ring-purple-400/30",
  },
  gold: {
    icon: Medal,
    label: "Gold",
    color: "text-yellow-300",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    ring: "ring-yellow-400/30",
  },
  silver: {
    icon: Award,
    label: "Silver",
    color: "text-slate-300",
    bg: "bg-slate-400/10",
    border: "border-slate-400/20",
    ring: "ring-slate-400/30",
  },
  bronze: {
    icon: Award,
    label: "Bronze",
    color: "text-amber-600",
    bg: "bg-amber-600/10",
    border: "border-amber-600/20",
    ring: "ring-amber-600/30",
  },
  at_risk: {
    icon: AlertTriangle,
    label: "At Risk",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    ring: "ring-red-400/30",
  },
} as const;

const HALL_CLASS_CONFIG: Record<string, { color: string; label: string }> = {
  I: { color: "text-emerald-400", label: "Passive" },
  II: { color: "text-amber-400", label: "Managed" },
  III: { color: "text-cyan-400", label: "Active" },
};

//
// HELPERS
//

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getEventConfig(type: string) {
  return EVENT_CONFIG[type] || EVENT_CONFIG.proposal;
}

//
// SUB-COMPONENTS
//

function TimelineNode({
  config,
  isLast,
}: {
  config: ReturnType<typeof getEventConfig>;
  isLast?: boolean;
}) {
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center shrink-0">
      {/* Top connector */}
      {!isLast && (
        <div className="w-px h-full bg-slate-800/60 absolute top-8 left-4" />
      )}
      {/* Node */}
      <div
        className={`
          relative w-8 h-8 rounded-full flex items-center justify-center
          border-2 z-10
          ${config.bg} ${config.border} ${config.color}
        `}
      >
        <Icon className="w-3.5 h-3.5" />
        {/* Pulse ring for recent items */}
        <div className={`
          absolute inset-0 rounded-full ${config.bg} opacity-0
          animate-ping
        `} style={{ animationDuration: "3s" }} />
      </div>
    </div>
  );
}

function SriBadge({ tier, score }: { tier: string; score: number }) {
  const config = SRI_CONFIG[tier as keyof typeof SRI_CONFIG] || SRI_CONFIG.bronze;
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
        text-[10px] font-bold uppercase tracking-wider
        ${config.bg} ${config.color} border ${config.border}
      `}
    >
      <Icon className="w-2.5 h-2.5" />
      {score}
    </span>
  );
}

function HallClassBadge({ class: className }: { class: string | null }) {
  if (!className) return null;
  const config = HALL_CLASS_CONFIG[className] || { color: "text-slate-500", label: className };

  return (
    <span
      className={`
        inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium
        bg-slate-800/60 border border-slate-700/40 ${config.color}
      `}
    >
      Class {className}
    </span>
  );
}

//
// MAIN COMPONENT
//

export function RelayFeed({ item, index = 0, isLast = false }: RelayFeedProps) {
  const eventConfig = getEventConfig(item.event.type);
  const EventIcon = eventConfig.icon;

  const isRecent = useMemo(() => {
    const diff = Date.now() - new Date(item.timestamp).getTime();
    return diff < 3600000; // 1 hour
  }, [item.timestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: "easeOut" }}
      className={`
        group relative flex items-start gap-4 py-4 px-5
        border-b border-slate-800/30 last:border-b-0
        hover:bg-slate-800/20 transition-colors duration-300
        ${isRecent ? "bg-slate-800/10" : ""}
      `}
    >
      {/* Timeline + Icon */}
      <div className="relative shrink-0">
        <div
          className={`
            w-9 h-9 rounded-full flex items-center justify-center
            border-2 transition-all duration-300
            ${eventConfig.bg} ${eventConfig.border} ${eventConfig.color}
            group-hover:scale-110 group-hover:shadow-lg ${eventConfig.glow}
          `}
        >
          <EventIcon className="w-4 h-4" />
        </div>
        {/* Recent indicator */}
        {isRecent && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row: Hall identity */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {/* Hall ID */}
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
            <Hash className="w-3 h-3" />
            {item.hall.id}
          </span>

          <ChevronRight className="w-3 h-3 text-slate-700" />

          {/* Hall name */}
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px]">
            {item.hall.name}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-1.5 ml-auto">
            <SriBadge tier={item.hall.sri.tier} score={item.hall.sri.score} />
            <HallClassBadge class={item.hall.class} />
          </div>
        </div>

        {/* Event description */}
        <p className="text-sm text-slate-200 leading-relaxed group-hover:text-slate-100 transition-colors">
          {item.event.description}
        </p>

        {/* Footer metadata */}
        <div className="flex items-center gap-3 mt-2.5">
          {/* Event type chip */}
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-md
              text-[10px] font-semibold uppercase tracking-wider
              ${eventConfig.bg} ${eventConfig.color} border ${eventConfig.border}
            `}
          >
            <EventIcon className="w-2.5 h-2.5" />
            {eventConfig.label}
          </span>

          {/* Timestamp */}
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <Clock className="w-3 h-3" />
            {timeAgo(item.timestamp)}
          </span>

          {/* Live indicator for recent */}
          {isRecent && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400/70 font-medium">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              Live
            </span>
          )}

          {/* Hall status */}
          <span className="text-[10px] text-slate-700 capitalize">
            {item.hall.status}
          </span>
        </div>
      </div>

      {/* Hover action hint */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </div>
    </motion.div>
  );
}