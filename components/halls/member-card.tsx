"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Shield,
  BadgeCheck,
  EyeOff,
  MessageSquare,
  FileText,
  Clock,
  AlertTriangle,
  ChevronRight,
  Percent,
  Vote,
  Activity,
  Ban,
  Gavel,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ───
export type KycTier = "visitor" | "sovereign" | "verified" | "whale";
export type CabinetRole = "speaker" | "treasurer" | "warden" | "scribe";

export interface MemberCardData {
  id: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  kycTier: KycTier;
  ownershipPercent: number;
  accumulatedDividends?: number;
  votesCast?: number;
  votesEligible?: number;
  isDormant: boolean;
  isPrimaryAdmin: boolean;
  cabinetRole?: CabinetRole;
  cabinetExpiresAt?: string;
  sriContribution?: number;
  lastActiveAt?: string;
  country?: string;
}

export interface MemberCardProps {
  member: MemberCardData;
  isCurrentUser?: boolean;
  compact?: boolean; // ultra-compact for sidebars
  showActions?: boolean;
  onMessage?: (ledgerId: string) => void;
  onViewProfile?: (ledgerId: string) => void;
  onImpeach?: (memberId: string, role: CabinetRole) => void;
  onBan?: (memberId: string) => void;
  className?: string;
}

// ─── Config ───
const KYC_CONFIG: Record<KycTier, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  visitor:  { label: "V",  color: "text-slate-400",    bg: "bg-slate-500/10",    icon: EyeOff },
  sovereign:{ label: "S",  color: "text-cyan-400",     bg: "bg-cyan-500/10",     icon: Shield },
  verified: { label: "V",  color: "text-emerald-400",  bg: "bg-emerald-500/10",  icon: BadgeCheck },
  whale:    { label: "W",  color: "text-amber-400",    bg: "bg-amber-500/10",    icon: Crown },
};

const CABINET_CONFIG: Record<CabinetRole, { label: string; color: string; bg: string; icon: React.ElementType; short: string }> = {
  speaker:   { label: "Speaker",   color: "text-violet-400",  bg: "bg-violet-500/10",  icon: MessageSquare, short: "SPK" },
  treasurer: { label: "Treasurer", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: FileText,      short: "TR" },
  warden:    { label: "Warden",    color: "text-amber-400",   bg: "bg-amber-500/10",   icon: Shield,        short: "WRD" },
  scribe:    { label: "Scribe",    color: "text-sky-400",     bg: "bg-sky-500/10",     icon: FileText,      short: "SCR" },
};

// ─── Helpers ───
function daysSince(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function quorumPercent(votes?: number, eligible?: number) {
  if (!votes || !eligible) return 0;
  return Math.round((votes / eligible) * 100);
}

// ─── Component ───
export function MemberCard({
  member,
  isCurrentUser = false,
  compact = false,
  showActions = false,
  onMessage,
  onViewProfile,
  onImpeach,
  onBan,
  className = "",
}: MemberCardProps) {
  const kyc = KYC_CONFIG[member.kycTier];
  const KIcon = kyc.icon;
  const daysInactive = daysSince(member.lastActiveAt);
  const quorum = quorumPercent(member.votesCast, member.votesEligible);

  // ─── Ultra Compact Mode (sidebar, dropdowns) ───
  if (compact) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer ${
                isCurrentUser
                  ? "bg-cyan-500/5 border border-cyan-500/20"
                  : member.isDormant
                  ? "bg-red-500/5 border border-red-500/10 hover:bg-red-500/10"
                  : "hover:bg-slate-800/50"
              } ${className}`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                    member.isPrimaryAdmin
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : member.cabinetRole
                      ? CABINET_CONFIG[member.cabinetRole].bg + " " + CABINET_CONFIG[member.cabinetRole].color
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.displayName?.[0] || member.ledgerId.slice(-2)
                  )}
                </div>
                {member.cabinetRole && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                    {(() => {
                      const CIcon = CABINET_CONFIG[member.cabinetRole].icon;
                      return <CIcon className={`w-2 h-2 ${CABINET_CONFIG[member.cabinetRole].color}`} />;
                    })()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {member.displayName || member.ledgerId}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[9px] text-cyan-400 font-medium">You</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-slate-500">{member.ledgerId}</span>
                  <span className={`text-[9px] px-1 rounded ${kyc.bg} ${kyc.color}`}>{kyc.label}</span>
                  {member.isDormant && (
                    <span className="text-[9px] text-red-400">· Dormant</span>
                  )}
                </div>
              </div>

              {/* Ownership % */}
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-semibold text-cyan-400">
                  {member.ownershipPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-slate-900 border-slate-800 p-3 max-w-[240px]"
          >
            <CompactTooltip member={member} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ─── Standard Card Mode ───
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border overflow-hidden ${
        isCurrentUser
          ? "border-cyan-500/30 bg-cyan-950/10"
          : member.isDormant
          ? "border-red-500/20 bg-red-950/5"
          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
      } transition-colors ${className}`}
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-mono ${
                member.isPrimaryAdmin
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : member.cabinetRole
                  ? CABINET_CONFIG[member.cabinetRole].bg + " " + CABINET_CONFIG[member.cabinetRole].color
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {member.avatar ? (
                <img src={member.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                member.displayName?.[0] || member.ledgerId.slice(-2)
              )}
            </div>
            {member.cabinetRole && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                {(() => {
                  const CIcon = CABINET_CONFIG[member.cabinetRole].icon;
                  return <CIcon className={`w-3 h-3 ${CABINET_CONFIG[member.cabinetRole].color}`} />;
                })()}
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-200">
                {member.displayName || member.ledgerId}
              </span>
              {isCurrentUser && (
                <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-0 px-1.5">You</Badge>
              )}
              {member.isPrimaryAdmin && (
                <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-0 px-1.5">
                  <Crown className="w-2.5 h-2.5 mr-1" />
                  8th Ledger
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-mono text-slate-500">{member.ledgerId}</span>
              <Badge className={`text-[10px] ${kyc.bg} ${kyc.color} border-0 px-1.5 py-0`}>
                <KIcon className="w-2.5 h-2.5 mr-1" />
                {member.kycTier}
              </Badge>
              {member.cabinetRole && (
                <Badge className={`text-[10px] ${CABINET_CONFIG[member.cabinetRole].bg} ${CABINET_CONFIG[member.cabinetRole].color} border-0 px-1.5 py-0`}>
                  {CABINET_CONFIG[member.cabinetRole].label}
                </Badge>
              )}
              {member.isDormant && (
                <Badge className="text-[10px] bg-red-500/10 text-red-400 border-0 px-1.5 py-0">
                  <Clock className="w-2.5 h-2.5 mr-1" />
                  Dormant
                </Badge>
              )}
            </div>
          </div>

          {/* Ownership Badge */}
          <div className="text-right shrink-0">
            <div className="text-lg font-mono font-bold text-cyan-400">
              {member.ownershipPercent.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-500">ownership</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/50">
          <StatItem
            icon={Percent}
            label="Ownership"
            value={`${member.ownershipPercent.toFixed(2)}%`}
            color="cyan"
          />
          <StatItem
            icon={Vote}
            label="Quorum"
            value={`${quorum}%`}
            color={quorum >= 70 ? "emerald" : quorum >= 40 ? "amber" : "red"}
          />
          <StatItem
            icon={Activity}
            label="Active"
            value={daysInactive === null ? "—" : daysInactive === 0 ? "Today" : `${daysInactive}d`}
            color={daysInactive === null ? "slate" : daysInactive > 90 ? "red" : daysInactive > 30 ? "amber" : "emerald"}
          />
        </div>

        {/* Dividends + SRI (if available) */}
        {(member.accumulatedDividends != null || member.sriContribution != null) && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {member.accumulatedDividends != null && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-500">Dividends</div>
                  <div className="text-xs font-mono font-semibold text-emerald-400">
                    ${member.accumulatedDividends.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
            {member.sriContribution != null && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                <div>
                  <div className="text-[10px] text-slate-500">SRI Contribution</div>
                  <div className="text-xs font-mono font-semibold text-violet-400">
                    {member.sriContribution}/100
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dormant Warning */}
        {member.isDormant && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-400">
              Account flagged dormant. Voting rights suspended. Dividends still accrue.
              {daysInactive != null && (
                <span className="block mt-0.5 text-red-400/70">Inactive for {daysInactive} days.</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800/50">
            {onMessage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMessage(member.ledgerId)}
                className="flex-1 text-xs border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Message
              </Button>
            )}
            {onViewProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProfile(member.ledgerId)}
                className="flex-1 text-xs border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <User className="w-3.5 h-3.5 mr-1.5" />
                Profile
              </Button>
            )}
            {member.cabinetRole && onImpeach && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImpeach(member.id, member.cabinetRole!)}
                className="flex-1 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                <Gavel className="w-3.5 h-3.5 mr-1.5" />
                Impeach
              </Button>
            )}
            {onBan && !member.isPrimaryAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBan(member.id)}
                className="flex-1 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" />
                Ban
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Stat Item ───
function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "cyan" | "emerald" | "amber" | "red" | "slate" | "violet";
}) {
  const colorMap = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    slate: "text-slate-400",
    violet: "text-violet-400",
  };

  return (
    <div className="text-center">
      <div className={`text-xs font-mono font-semibold ${colorMap[color]}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
    </div>
  );
}

// ─── Compact Tooltip Content ───
function CompactTooltip({ member }: { member: MemberCardData }) {
  const kyc = KYC_CONFIG[member.kycTier];
  const quorum = quorumPercent(member.votesCast, member.votesEligible);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-200">
          {member.displayName || member.ledgerId}
        </span>
        {member.isPrimaryAdmin && (
          <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-0">
            <Crown className="w-2 h-2 mr-1" />
            8th Ledger
          </Badge>
        )}
      </div>
      <div className="text-[10px] text-slate-500 font-mono">{member.ledgerId}</div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className={`${kyc.color}`}>{kyc.label} · {member.kycTier}</span>
        <span className="text-slate-600">·</span>
        <span className="text-cyan-400 font-mono">{member.ownershipPercent.toFixed(2)}%</span>
      </div>
      {member.cabinetRole && (
        <div className={`text-[10px] ${CABINET_CONFIG[member.cabinetRole].color}`}>
          {CABINET_CONFIG[member.cabinetRole].label} · Term expires {member.cabinetExpiresAt ? new Date(member.cabinetExpiresAt).toLocaleDateString() : "N/A"}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
        <div className="text-[10px] text-slate-500">
          Quorum: <span className="text-slate-300">{quorum}%</span>
        </div>
        <div className="text-[10px] text-slate-500">
          SRI: <span className="text-violet-400">{member.sriContribution ?? "—"}/100</span>
        </div>
        {member.accumulatedDividends != null && (
          <div className="text-[10px] text-slate-500">
            Dividends: <span className="text-emerald-400">${member.accumulatedDividends.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}