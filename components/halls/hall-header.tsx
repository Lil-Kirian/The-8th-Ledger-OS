"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  Crown,
  Activity,
  Lock,
  AlertTriangle,
  Gavel,
  MapPin,
  Users,
  Settings,
  Share2,
  Bookmark,
  BookmarkCheck,
  Globe,
  Building2,
  Car,
  Cpu,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Plane,
  Wheat,
  Sun,
  Wifi,
  Bell,
  BellOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ───
export type HallStatus = "ghost" | "live" | "closing" | "dissolved";
export type HallClass = "I" | "II" | "III";
export type SriTier = "platinum" | "gold" | "silver" | "bronze" | "at_risk";
export type VerticalKey =
  | "ledgerprop"
  | "ledgerauto"
  | "ledgertech"
  | "ledgeredu"
  | "ledgerhealth"
  | "ledgerbiz"
  | "ledgertravel"
  | "ledgeragri"
  | "ledgerenergy"
  | "ledgeraccess";

export interface HallHeaderData {
  id: string;
  hallNumber: number;
  name: string;
  vertical: VerticalKey;
  location: string;
  continent: string;
  coordinates?: { lat: number; lng: number };
  hallClass: HallClass;
  status: HallStatus;
  sriScore: number;
  sriTier: SriTier;
  ahgiScore: number;
  memberCount: number;
  yourOwnershipPercent?: number;
  isPrimaryAdmin: boolean;
  isBookmarked?: boolean;
  notificationsEnabled?: boolean;
}

export interface HallHeaderProps {
  hall: HallHeaderData;
  onBookmark?: () => void;
  onToggleNotifications?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
}

// ─── Config ───
const VERTICALS: Record<VerticalKey, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ledgerprop:   { label: "LedgerProp",   icon: Building2,      color: "text-emerald-400",  bg: "bg-emerald-500/10" },
  ledgerauto:   { label: "LedgerAuto",   icon: Car,            color: "text-blue-400",     bg: "bg-blue-500/10" },
  ledgertech:   { label: "LedgerTech",   icon: Cpu,            color: "text-violet-400",   bg: "bg-violet-500/10" },
  ledgeredu:    { label: "LedgerEdu",    icon: GraduationCap,  color: "text-amber-400",    bg: "bg-amber-500/10" },
  ledgerhealth: { label: "LedgerHealth", icon: HeartPulse,      color: "text-rose-400",     bg: "bg-rose-500/10" },
  ledgerbiz:    { label: "LedgerBiz",    icon: Briefcase,      color: "text-orange-400",   bg: "bg-orange-500/10" },
  ledgertravel: { label: "LedgerTravel", icon: Plane,          color: "text-sky-400",      bg: "bg-sky-500/10" },
  ledgeragri:   { label: "LedgerAgri",   icon: Wheat,          color: "text-lime-400",     bg: "bg-lime-500/10" },
  ledgerenergy: { label: "LedgerEnergy", icon: Sun,            color: "text-yellow-400",   bg: "bg-yellow-500/10" },
  ledgeraccess: { label: "LedgerAccess", icon: Wifi,           color: "text-cyan-400",     bg: "bg-cyan-500/10" },
};

const HALL_CLASS_LABEL: Record<HallClass, { label: string; desc: string }> = {
  I:   { label: "Passive",  desc: "8th Ledger manages everything" },
  II:  { label: "Managed",  desc: "Hall hires operators, 8th Ledger executes" },
  III: { label: "Active",   desc: "Hall runs daily operations" },
};

const STATUS_CONFIG: Record<HallStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType; desc: string }> = {
  ghost:     { label: "Ghost",     color: "text-slate-400",    bg: "bg-slate-500/10",    border: "border-slate-600",    icon: Lock,          desc: "Awaiting cabinet election" },
  live:      { label: "Live",      color: "text-emerald-400",  bg: "bg-emerald-500/10",  border: "border-emerald-500/20", icon: Activity,      desc: "Asset operational" },
  closing:   { label: "Closing",   color: "text-red-400",      bg: "bg-red-500/10",      border: "border-red-500/20",   icon: AlertTriangle, desc: "Closure protocol active" },
  dissolved: { label: "Dissolved", color: "text-zinc-500",     bg: "bg-zinc-500/10",     border: "border-zinc-600",     icon: Gavel,         desc: "Hall permanently closed" },
};

const SRI_TIER_CONFIG: Record<SriTier, { label: string; emoji: string; color: string }> = {
  platinum: { label: "Platinum", emoji: "👑", color: "text-purple-400" },
  gold:     { label: "Gold",     emoji: "🥇", color: "text-yellow-400" },
  silver:   { label: "Silver",   emoji: "🥈", color: "text-slate-300" },
  bronze:   { label: "Bronze",   emoji: "🥉", color: "text-amber-600" },
  at_risk:  { label: "At Risk",  emoji: "⚠️", color: "text-red-400" },
};

// ─── Helpers ───
function ahgiStatus(score: number) {
  if (score >= 80) return { label: "Thriving", color: "text-emerald-400" };
  if (score >= 60) return { label: "Healthy", color: "text-blue-400" };
  if (score >= 40) return { label: "Stagnant", color: "text-amber-400" };
  if (score >= 20) return { label: "Declining", color: "text-orange-400" };
  return { label: "Critical", color: "text-red-400" };
}

// ─── Component ───
export function HallHeader({
  hall,
  onBookmark,
  onToggleNotifications,
  onShare,
  onSettings,
}: HallHeaderProps) {
  const v = VERTICALS[hall.vertical];
  const VIcon = v.icon;
  const status = STATUS_CONFIG[hall.status];
  const StatusIcon = status.icon;
  const sri = SRI_TIER_CONFIG[hall.sriTier];
  const ahgi = ahgiStatus(hall.ahgiScore);
  const cls = HALL_CLASS_LABEL[hall.hallClass];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* ─── Breadcrumb + Actions ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/halls" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Halls
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300 font-medium truncate">{hall.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {onBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBookmark}
              className="text-xs text-slate-500 hover:text-slate-200"
            >
              {hall.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          )}
          {onToggleNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleNotifications}
              className="text-xs text-slate-500 hover:text-slate-200"
            >
              {hall.notificationsEnabled ? (
                <Bell className="w-4 h-4 text-cyan-400" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          )}
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-xs text-slate-500 hover:text-slate-200"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="text-xs text-slate-500 hover:text-slate-200"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── Main Header Card ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-sm overflow-hidden">
        {/* Top accent */}
        <div
          className={`h-1 w-full ${
            hall.status === "live"
              ? "bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"
              : hall.status === "closing"
              ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
              : "bg-slate-700"
          }`}
        />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            {/* Left: Identity */}
            <div className="flex items-start gap-4">
              {/* Vertical Icon */}
              <div className={`w-16 h-16 rounded-2xl ${v.bg} flex items-center justify-center shrink-0`}>
                <VIcon className={`w-8 h-8 ${v.color}`} />
              </div>

              <div className="min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className={`text-[10px] ${v.bg} ${v.color} border-0 font-semibold uppercase tracking-wide`}>
                    {v.label}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${status.border} ${status.color} bg-transparent`}>
                    <StatusIcon className="w-2.5 h-2.5 mr-1" />
                    {status.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                    Class {hall.hallClass} — {cls.label}
                  </Badge>
                  {hall.isPrimaryAdmin && (
                    <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-0">
                      <Crown className="w-2.5 h-2.5 mr-1" />
                      8th Ledger
                    </Badge>
                  )}
                </div>

                {/* Name */}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
                  {hall.name}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
                  <span className="font-mono text-xs">#{hall.hallNumber}</span>
                  <span className="text-slate-700">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {hall.location}
                  </span>
                  <span className="text-slate-700">·</span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {hall.continent}
                  </span>
                  {hall.coordinates && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className="font-mono text-xs">
                        {hall.coordinates.lat.toFixed(4)}, {hall.coordinates.lng.toFixed(4)}
                      </span>
                    </>
                  )}
                </div>

                {/* Status description */}
                <p className="text-xs text-slate-500 mt-1.5">{status.desc}</p>
              </div>
            </div>

            {/* Right: Scores + Stats */}
            <div className="flex flex-col sm:flex-row gap-4 lg:items-end">
              {/* SRI */}
              <div className={`rounded-xl border p-4 min-w-[160px] ${sri.color.replace("text-", "border-").replace("400", "500/20")} bg-slate-900/50`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500">SRI</span>
                  <span className="text-lg">{sri.emoji}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${sri.color}`}>{hall.sriScore}</span>
                  <span className={`text-xs font-medium ${sri.color}`}>{sri.label}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sri.color.replace("text-", "bg-")}`}
                    style={{ width: `${hall.sriScore}%` }}
                  />
                </div>
              </div>

              {/* AHGI */}
              <div className={`rounded-xl border p-4 min-w-[160px] ${ahgi.color.replace("text-", "border-").replace("400", "500/20")} bg-slate-900/50`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500">AHGI</span>
                  <span className={`text-xs ${ahgi.color}`}>{ahgi.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${ahgi.color}`}>{hall.ahgiScore}</span>
                  <span className="text-xs text-slate-500">/100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ahgi.color.replace("text-", "bg-")}`}
                    style={{ width: `${hall.ahgiScore}%` }}
                  />
                </div>
              </div>

              {/* Members */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 min-w-[120px]">
                <div className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-2">Sovereigns</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-200">{hall.memberCount}</span>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                {hall.yourOwnershipPercent != null && hall.yourOwnershipPercent > 0 && (
                  <div className="text-xs text-cyan-400 mt-1">
                    Your stake: <span className="font-mono font-semibold">{hall.yourOwnershipPercent.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Compact Variant (for sidebar embeds, mobile headers) ───
export function HallHeaderCompact({ hall }: { hall: HallHeaderData }) {
  const v = VERTICALS[hall.vertical];
  const VIcon = v.icon;
  const status = STATUS_CONFIG[hall.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/50">
      <div className={`w-10 h-10 rounded-lg ${v.bg} flex items-center justify-center shrink-0`}>
        <VIcon className={`w-5 h-5 ${v.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-200 truncate">{hall.name}</span>
          <Badge className={`text-[9px] ${status.bg} ${status.color} border-0`}>
            <StatusIcon className="w-2.5 h-2.5 mr-1" />
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
          <span className="font-mono">#{hall.hallNumber}</span>
          <span>·</span>
          <span>{hall.location}</span>
          {hall.yourOwnershipPercent != null && (
            <>
              <span>·</span>
              <span className="text-cyan-400 font-mono">{hall.yourOwnershipPercent.toFixed(1)}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}