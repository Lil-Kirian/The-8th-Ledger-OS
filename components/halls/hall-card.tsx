"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Users,
  Shield,
  AlertTriangle,
  Lock,
  Globe,
  ChevronRight,
  Activity,
  Zap,
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
  Hammer,
  Gavel,
  Swords,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types ───
export type HallClass = "I" | "II" | "III";
export type HallStatus = "ghost" | "live" | "closing" | "dissolved";
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
  | "ledgeraccess"
  | "ledgersport";

export interface HallCardData {
  id: string;
  hallNumber: number;
  name: string;
  vertical: VerticalKey;
  location: string;
  continent: string;
  hallClass: HallClass;
  status: HallStatus;
  sriScore: number;
  sriTier: SriTier;
  ahgiScore: number;
  memberCount: number;
  assetImage?: string;
  assetType: string;
  monthlyRevenue?: number;
  yourOwnershipPercent?: number;
  isPrimaryAdmin?: boolean;
}

// ─── Vertical Config ───
const VERTICALS: Record<
  VerticalKey,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
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
  ledgersport:  { label: "LedgerSport",  icon: Swords,         color: "text-rose-400",     bg: "bg-rose-500/10" },
};

const HALL_CLASS_LABEL: Record<HallClass, string> = {
  I: "Passive",
  II: "Managed",
  III: "Active",
};

const SRI_TIER_CONFIG: Record<SriTier, { label: string; emoji: string; barColor: string }> = {
  platinum: { label: "Platinum", emoji: "👑", barColor: "bg-gradient-to-r from-purple-400 to-pink-400" },
  gold:     { label: "Gold",     emoji: "🥇", barColor: "bg-yellow-400" },
  silver:   { label: "Silver",   emoji: "🥈", barColor: "bg-slate-300" },
  bronze:   { label: "Bronze",   emoji: "🥉", barColor: "bg-amber-600" },
  at_risk:  { label: "At Risk",  emoji: "⚠️", barColor: "bg-red-500" },
};

const STATUS_CONFIG: Record<HallStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ghost:    { label: "Ghost",    color: "text-slate-400",  bg: "bg-slate-500/10",  icon: Lock },
  live:     { label: "Live",     color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Activity },
  closing:  { label: "Closing",  color: "text-red-400",    bg: "bg-red-500/10",    icon: AlertTriangle },
  dissolved:{ label: "Dissolved",color: "text-zinc-500",   bg: "bg-zinc-500/10",   icon: Gavel },
};

// ─── Helpers ───
function formatCurrency(n?: number) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function ahgiStatus(score: number) {
  if (score >= 80) return { label: "Thriving", color: "text-emerald-400" };
  if (score >= 60) return { label: "Healthy", color: "text-blue-400" };
  if (score >= 40) return { label: "Stagnant", color: "text-amber-400" };
  if (score >= 20) return { label: "Declining", color: "text-orange-400" };
  return { label: "Critical", color: "text-red-400" };
}

// ─── Component ───
export function HallCard({ hall }: { hall: HallCardData }) {
  const v = VERTICALS[hall.vertical];
  const VIcon = v.icon;
  const status = STATUS_CONFIG[hall.status];
  const StatusIcon = status.icon;
  const sri = SRI_TIER_CONFIG[hall.sriTier];
  const ahgi = ahgiStatus(hall.ahgiScore);

  const isLive = hall.status === "live";
  const isClosing = hall.status === "closing";
  const isGhost = hall.status === "ghost";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border border-slate-800 bg-slate-950/80 backdrop-blur-sm hover:border-slate-700 transition-colors group">
        {/* Top accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            isLive
              ? "bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500"
              : isClosing
              ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
              : isGhost
              ? "bg-slate-600"
              : "bg-zinc-700"
          }`}
        />

        {/* Primary admin crown */}
        {hall.isPrimaryAdmin && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] tracking-wider uppercase">
              <Crown className="w-3 h-3 mr-1" />
              8th Ledger
            </Badge>
          </div>
        )}

        <CardHeader className="pb-2 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Asset thumbnail or vertical icon */}
              <div className={`w-12 h-12 rounded-xl ${v.bg} flex items-center justify-center shrink-0`}>
                {hall.assetImage ? (
                  <img src={hall.assetImage} alt={hall.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <VIcon className={`w-6 h-6 ${v.color}`} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-500">#{hall.hallNumber}</span>
                  <Badge className={`${v.bg} ${v.color} border-0 text-[10px] font-semibold uppercase tracking-wide`}>
                    {v.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                    Class {hall.hallClass} — {HALL_CLASS_LABEL[hall.hallClass]}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-slate-100 mt-1 truncate leading-tight">
                  {hall.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{hall.location}</span>
                  <span className="text-slate-700">·</span>
                  <span>{hall.continent}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status + Member row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${status.bg} ${status.color} border-0 text-[10px] uppercase tracking-wider`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              {isGhost && (
                <span className="text-[10px] text-slate-500">Awaiting cabinet election</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium text-slate-300">{hall.memberCount}</span>
              <span>sovereign{hall.memberCount === 1 ? "" : "s"}</span>
            </div>
          </div>

          {/* SRI + AHGI bars */}
          <div className="space-y-3">
            {/* SRI */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">SRI</span>
                <span className="font-mono font-medium text-slate-200">
                  {hall.sriScore} <span className="text-[10px] text-slate-500 ml-1">{sri.emoji} {sri.label}</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hall.sriScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${sri.barColor}`}
                />
              </div>
            </div>

            {/* AHGI */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">AHGI</span>
                <span className={`font-mono font-medium ${ahgi.color}`}>
                  {hall.ahgiScore} <span className="text-[10px] text-slate-500 ml-1">{ahgi.label}</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hall.ahgiScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className={`h-full rounded-full ${
                    hall.ahgiScore >= 80
                      ? "bg-emerald-400"
                      : hall.ahgiScore >= 60
                      ? "bg-blue-400"
                      : hall.ahgiScore >= 40
                      ? "bg-amber-400"
                      : hall.ahgiScore >= 20
                      ? "bg-orange-400"
                      : "bg-red-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Ownership + Revenue row */}
          <div className="flex items-center justify-between pt-1">
            {hall.yourOwnershipPercent != null && (
              <div className="text-xs">
                <span className="text-slate-500">Your stake:</span>{" "}
                <span className="font-mono font-semibold text-cyan-400">{hall.yourOwnershipPercent.toFixed(2)}%</span>
              </div>
            )}
            {hall.monthlyRevenue != null && isLive && (
              <div className="text-xs text-right">
                <span className="text-slate-500">Revenue:</span>{" "}
                <span className="font-mono font-semibold text-emerald-400">{formatCurrency(hall.monthlyRevenue)}</span>
                <span className="text-slate-600">/mo</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="pt-1">
            <Link href={`/halls/${hall.id}`} className="block">
              <Button
                variant="ghost"
                className="w-full justify-between text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 group/btn"
              >
                <span className="flex items-center gap-2">
                  {isGhost ? (
                    <>
                      <Hammer className="w-3.5 h-3.5" />
                      Enter Ghost Hall
                    </>
                  ) : isClosing ? (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      View Closure Protocol
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Enter Hall
                    </>
                  )}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Skeleton Loader ───
export function HallCardSkeleton() {
  return (
    <Card className="border border-slate-800 bg-slate-950/50 overflow-hidden">
      <div className="h-1 bg-slate-800" />
      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-slate-800 rounded-full animate-pulse" />
          <div className="h-1.5 w-full bg-slate-800 rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-full bg-slate-800 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}