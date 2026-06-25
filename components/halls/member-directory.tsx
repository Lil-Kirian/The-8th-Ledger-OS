"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Crown,
  Search,
  Shield,
  Eye,
  EyeOff,
  Gavel,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  BadgeCheck,
  Clock,
  Ban,
  Activity,
  Percent,
  Vote,
  MessageSquare,
  Lock,
  Globe,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ───
export type KycTier = "visitor" | "sovereign" | "verified" | "whale";
export type CabinetRole = "speaker" | "treasurer" | "warden" | "scribe";

export interface Member {
  id: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  kycTier: KycTier;
  ownershipPercent: number;
  accumulatedDividends: number;
  joinedAt: string;
  lastActiveAt: string;
  votesCast: number;
  votesEligible: number;
  proposalsCreated: number;
  isDormant: boolean;
  dormancyFlaggedAt?: string;
  isPrimaryAdmin: boolean;
  cabinetRole?: CabinetRole;
  cabinetElectedAt?: string;
  cabinetExpiresAt?: string;
  sriContribution: number; // 0-100 individual governance score
  country?: string;
}

export interface MemberDirectoryProps {
  members: Member[];
  hallId: string;
  hallName: string;
  isLoading?: boolean;
  currentUserLedgerId?: string;
  onImpeach?: (memberId: string, role: CabinetRole) => void;
  onBan?: (memberId: string) => void;
}

// ─── Config ───
const KYC_CONFIG: Record<KycTier, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  visitor:  { label: "Visitor",  color: "text-slate-400",    bg: "bg-slate-500/10",    icon: EyeOff },
  sovereign:{ label: "Sovereign",color: "text-cyan-400",     bg: "bg-cyan-500/10",     icon: Shield },
  verified: { label: "Verified", color: "text-emerald-400",  bg: "bg-emerald-500/10",  icon: BadgeCheck },
  whale:    { label: "Whale",    color: "text-amber-400",    bg: "bg-amber-500/10",    icon: Crown },
};

const CABINET_CONFIG: Record<CabinetRole, { label: string; color: string; bg: string; border: string; icon: React.ElementType; description: string }> = {
  speaker: {
    label: "The Speaker",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    icon: MessageSquare,
    description: "Voice of the hall. Proposes strategies. Cannot spend.",
  },
  treasurer: {
    label: "The Treasurer",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: FileText,
    description: "Read-only treasury. Reviews revenue. Flags anomalies.",
  },
  warden: {
    label: "The Warden",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Shield,
    description: "Monitors insurance, maintenance, security, staffing.",
  },
  scribe: {
    label: "The Scribe",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    icon: FileText,
    description: "Communications. Reports. Coordinates messaging.",
  },
};

const SORT_OPTIONS = [
  { key: "ownershipDesc", label: "Ownership: Highest", icon: SortDesc },
  { key: "ownershipAsc", label: "Ownership: Lowest", icon: SortAsc },
  { key: "sriDesc", label: "SRI Contribution: Highest", icon: SortDesc },
  { key: "sriAsc", label: "SRI Contribution: Lowest", icon: SortAsc },
  { key: "dividendsDesc", label: "Dividends: Highest", icon: SortDesc },
  { key: "dividendsAsc", label: "Dividends: Lowest", icon: SortAsc },
  { key: "votesDesc", label: "Votes Cast: Most", icon: SortDesc },
  { key: "votesAsc", label: "Votes Cast: Least", icon: SortAsc },
  { key: "newest", label: "Joined: Newest", icon: SortDesc },
  { key: "oldest", label: "Joined: Oldest", icon: SortAsc },
  { key: "activeDesc", label: "Last Active: Recent", icon: SortDesc },
  { key: "activeAsc", label: "Last Active: Dormant", icon: SortAsc },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

// ─── Helpers ───
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function quorumPercent(votes: number, eligible: number) {
  if (!eligible) return 0;
  return Math.round((votes / eligible) * 100);
}

// ─── Component ───
export function MemberDirectory({
  members,
  hallId,
  hallName,
  isLoading = false,
  currentUserLedgerId,
  onImpeach,
  onBan,
}: MemberDirectoryProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ownershipDesc");
  const [filterTier, setFilterTier] = useState<KycTier | "all">("all");
  const [filterCabinet, setFilterCabinet] = useState(false);
  const [filterDormant, setFilterDormant] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [showCabinetOnly, setShowCabinetOnly] = useState(false);

  const cabinetMembers = useMemo(() => members.filter((m) => m.cabinetRole), [members]);
  const totalOwnership = useMemo(
    () => members.reduce((sum, m) => sum + m.ownershipPercent, 0),
    [members]
  );
  const avgSri = useMemo(
    () => Math.round(members.reduce((sum, m) => sum + m.sriContribution, 0) / (members.length || 1)),
    [members]
  );
  const totalDividends = useMemo(
    () => members.reduce((sum, m) => sum + m.accumulatedDividends, 0),
    [members]
  );
  const dormantCount = useMemo(() => members.filter((m) => m.isDormant).length, [members]);

  const filtered = useMemo(() => {
    let result = [...members];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.ledgerId.toLowerCase().includes(q) ||
          m.displayName?.toLowerCase().includes(q) ||
          m.country?.toLowerCase().includes(q)
      );
    }

    if (filterTier !== "all") {
      result = result.filter((m) => m.kycTier === filterTier);
    }

    if (filterCabinet) {
      result = result.filter((m) => m.cabinetRole);
    }

    if (filterDormant) {
      result = result.filter((m) => m.isDormant);
    }

    if (showCabinetOnly) {
      result = result.filter((m) => m.cabinetRole);
    }

    result.sort((a, b) => {
      switch (sortKey) {
        case "ownershipDesc": return b.ownershipPercent - a.ownershipPercent;
        case "ownershipAsc": return a.ownershipPercent - b.ownershipPercent;
        case "sriDesc": return b.sriContribution - a.sriContribution;
        case "sriAsc": return a.sriContribution - b.sriContribution;
        case "dividendsDesc": return b.accumulatedDividends - a.accumulatedDividends;
        case "dividendsAsc": return a.accumulatedDividends - b.accumulatedDividends;
        case "votesDesc": return b.votesCast - a.votesCast;
        case "votesAsc": return a.votesCast - b.votesCast;
        case "newest": return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        case "oldest": return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        case "activeDesc": return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
        case "activeAsc": return new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime();
        default: return 0;
      }
    });

    return result;
  }, [members, search, sortKey, filterTier, filterCabinet, filterDormant, showCabinetOnly]);

  const activeFilterCount =
    (search ? 1 : 0) +
    (filterTier !== "all" ? 1 : 0) +
    (filterCabinet ? 1 : 0) +
    (filterDormant ? 1 : 0) +
    (showCabinetOnly ? 1 : 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* ─── Header Stats ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={Users}
            label="Sovereigns"
            value={members.length}
            sub={`${cabinetMembers.length} in cabinet`}
            color="cyan"
          />
          <StatCard
            icon={Percent}
            label="Ownership Distributed"
            value={`${totalOwnership.toFixed(1)}%`}
            sub={totalOwnership < 100 ? `${(100 - totalOwnership).toFixed(1)}% unallocated` : "Fully allocated"}
            color="emerald"
          />
          <StatCard
            icon={Award}
            label="Avg SRI Contribution"
            value={avgSri}
            sub="/100"
            color="violet"
          />
          <StatCard
            icon={Activity}
            label="Total Dividends"
            value={`$${(totalDividends / 1000).toFixed(1)}K`}
            sub="lifetime"
            color="amber"
          />
        </div>

        {/* ─── Executive Cabinet Banner ─── */}
        {cabinetMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">Executive Cabinet</h3>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">
                  {cabinetMembers.length}/4 elected
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCabinetOnly(!showCabinetOnly)}
                className={`text-xs ${showCabinetOnly ? "text-cyan-400" : "text-slate-500"}`}
              >
                {showCabinetOnly ? "Show All" : "Show Cabinet Only"}
              </Button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(["speaker", "treasurer", "warden", "scribe"] as CabinetRole[]).map((role) => {
                const member = cabinetMembers.find((m) => m.cabinetRole === role);
                const cfg = CABINET_CONFIG[role];
                const CIcon = cfg.icon;

                return (
                  <div
                    key={role}
                    className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 ${
                      member ? "" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CIcon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    {member ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400">
                            {member.displayName?.[0] || member.ledgerId.slice(-2)}
                          </div>
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {member.displayName || member.ledgerId}
                          </span>
                          {member.isPrimaryAdmin && (
                            <Crown className="w-3 h-3 text-amber-400" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Elected {formatDate(member.cabinetElectedAt!)} ·{" "}
                          {daysSince(member.cabinetExpiresAt!) > 0
                            ? `${daysSince(member.cabinetExpiresAt!)}d remaining`
                            : "Expired"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {member.ownershipPercent.toFixed(2)}% ownership · SRI {member.sriContribution}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">Position vacant</div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Controls ─── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by Ledger ID, name, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-cyan-500/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="appearance-none bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 pr-8 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Tier filter */}
            <div className="relative">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value as KycTier | "all")}
                className="appearance-none bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 pr-8 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              >
                <option value="all">All Tiers</option>
                <option value="visitor">Visitor</option>
                <option value="sovereign">Sovereign</option>
                <option value="verified">Verified</option>
                <option value="whale">Whale</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Toggles */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDormant(!filterDormant)}
              className={`text-xs border-slate-700 ${
                filterDormant ? "text-red-400 border-red-500/30 bg-red-500/5" : "text-slate-500"
              }`}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Dormant
              {dormantCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-slate-800 px-1 rounded">{dormantCount}</span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilterTier("all");
                  setFilterCabinet(false);
                  setFilterDormant(false);
                  setShowCabinetOnly(false);
                }}
                className="text-xs text-slate-500 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* ─── Results Count ─── */}
        <div className="text-sm text-slate-500">
          Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of{" "}
          <span className="text-slate-300 font-medium">{members.length}</span> sovereigns
        </div>

        {/* ─── Member List ─── */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={`skel-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MemberRowSkeleton />
                  </motion.div>
                ))
              : filtered.map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MemberRow
                      member={member}
                      isCurrentUser={member.ledgerId === currentUserLedgerId}
                      isExpanded={expandedMember === member.id}
                      onToggle={() =>
                        setExpandedMember(expandedMember === member.id ? null : member.id)
                      }
                      onImpeach={onImpeach}
                      onBan={onBan}
                    />
                  </motion.div>
                ))}
          </AnimatePresence>
        </div>

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No sovereigns found</h3>
            <p className="text-sm text-slate-500">Adjust your filters or search terms.</p>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Stat Card ───
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: "cyan" | "emerald" | "violet" | "amber";
}) {
  const colorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono">{value}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>
    </div>
  );
}

// ─── Member Row ───
function MemberRow({
  member,
  isCurrentUser,
  isExpanded,
  onToggle,
  onImpeach,
  onBan,
}: {
  member: Member;
  isCurrentUser: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onImpeach?: (memberId: string, role: CabinetRole) => void;
  onBan?: (memberId: string) => void;
}) {
  const kyc = KYC_CONFIG[member.kycTier];
  const KIcon = kyc.icon;
  const quorum = quorumPercent(member.votesCast, member.votesEligible);
  const daysInactive = daysSince(member.lastActiveAt);

  return (
    <Card
      className={`border transition-colors overflow-hidden ${
        isCurrentUser
          ? "border-cyan-500/30 bg-cyan-950/10"
          : member.isDormant
          ? "border-red-500/20 bg-red-950/5"
          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
      }`}
    >
      {/* Main Row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono ${
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
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              {(() => {
                const CIcon = CABINET_CONFIG[member.cabinetRole].icon;
                return <CIcon className={`w-2.5 h-2.5 ${CABINET_CONFIG[member.cabinetRole].color}`} />;
              })()}
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200">
              {member.displayName || member.ledgerId}
            </span>
            {isCurrentUser && (
              <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-0">You</Badge>
            )}
            {member.isPrimaryAdmin && (
              <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-0">
                <Crown className="w-2.5 h-2.5 mr-1" />
                8th Ledger
              </Badge>
            )}
            {member.cabinetRole && (
              <Badge
                className={`text-[10px] border-0 ${CABINET_CONFIG[member.cabinetRole].bg} ${CABINET_CONFIG[member.cabinetRole].color}`}
              >
                {CABINET_CONFIG[member.cabinetRole].label}
              </Badge>
            )}
            {member.isDormant && (
              <Badge className="text-[10px] bg-red-500/10 text-red-400 border-0">
                <Clock className="w-2.5 h-2.5 mr-1" />
                Dormant
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span className="font-mono">{member.ledgerId}</span>
            <span className="text-slate-700">·</span>
            <Badge className={`text-[10px] ${kyc.bg} ${kyc.color} border-0 px-1.5 py-0`}>
              <KIcon className="w-2.5 h-2.5 mr-1" />
              {kyc.label}
            </Badge>
            {member.country && (
              <>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {member.country}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Ownership */}
        <div className="hidden sm:block text-right min-w-[100px]">
          <div className="text-sm font-mono font-semibold text-cyan-400">
            {member.ownershipPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500">ownership</div>
        </div>

        {/* SRI */}
        <div className="hidden md:block text-right min-w-[80px]">
          <div className="text-sm font-mono font-semibold text-violet-400">{member.sriContribution}</div>
          <div className="text-[10px] text-slate-500">SRI contrib</div>
        </div>

        {/* Dividends */}
        <div className="hidden lg:block text-right min-w-[100px]">
          <div className="text-sm font-mono font-semibold text-emerald-400">
            ${member.accumulatedDividends.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500">dividends</div>
        </div>

        {/* Expand */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-800/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {/* Governance */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
                    <Vote className="w-3 h-3" />
                    Governance
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Votes cast</span>
                      <span className="text-slate-300">
                        {member.votesCast} / {member.votesEligible}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${quorum}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Quorum</span>
                      <span className={`font-mono ${quorum >= 70 ? "text-emerald-400" : quorum >= 40 ? "text-amber-400" : "text-red-400"}`}>
                        {quorum}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Proposals created</span>
                      <span className="text-slate-300">{member.proposalsCreated}</span>
                    </div>
                  </div>
                </div>

                {/* Activity */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    Activity
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Joined</span>
                      <span className="text-slate-300">{formatDate(member.joinedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last active</span>
                      <span className={`${daysInactive > 30 ? "text-amber-400" : daysInactive > 90 ? "text-red-400" : "text-slate-300"}`}>
                        {daysInactive === 0 ? "Today" : `${daysInactive}d ago`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dividends earned</span>
                      <span className="font-mono text-emerald-400">${member.accumulatedDividends.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SRI contribution</span>
                      <span className="font-mono text-violet-400">{member.sriContribution}/100</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
                    <Gavel className="w-3 h-3" />
                    Actions
                  </h4>
                  <div className="space-y-2">
                    {member.cabinetRole && onImpeach && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onImpeach(member.id, member.cabinetRole!)}
                        className="w-full text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 justify-start"
                      >
                        <Gavel className="w-3.5 h-3.5 mr-2" />
                        Impeach {CABINET_CONFIG[member.cabinetRole].label}
                      </Button>
                    )}
                    {onBan && !member.isPrimaryAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onBan(member.id)}
                        className="w-full text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 justify-start"
                      >
                        <Ban className="w-3.5 h-3.5 mr-2" />
                        Propose Ban
                      </Button>
                    )}
                    {member.isDormant && (
                      <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/5 border border-red-500/10">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-400">
                          Account flagged dormant on {member.dormancyFlaggedAt ? formatDate(member.dormancyFlaggedAt) : "N/A"}.
                          Voting rights suspended. Dividends still accrue.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Skeletons ───
function MemberRowSkeleton() {
  return (
    <Card className="border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 bg-slate-800 rounded animate-pulse" />
          <div className="h-3 w-48 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="hidden sm:block w-20 space-y-1">
          <div className="h-3.5 w-16 bg-slate-800 rounded animate-pulse ml-auto" />
          <div className="h-2.5 w-12 bg-slate-800 rounded animate-pulse ml-auto" />
        </div>
        <div className="hidden md:block w-16 space-y-1">
          <div className="h-3.5 w-12 bg-slate-800 rounded animate-pulse ml-auto" />
          <div className="h-2.5 w-10 bg-slate-800 rounded animate-pulse ml-auto" />
        </div>
      </div>
    </Card>
  );
}