"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Users,
  Percent,
  Crown,
  TrendingUp,
  ShoppingCart,
  Tag,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

//  Types
export type KycTier = "visitor" | "sovereign" | "verified" | "whale";
export type CabinetRole = "speaker" | "treasurer" | "warden" | "scribe";

export interface OwnershipEntry {
  userId: string;
  ledgerId: string;
  displayName?: string;
  avatar?: string;
  ownershipPercent: number;
  accumulatedDividends: number;
  dynamicValue: number; // current 8th Ledger valuation per 1%
  totalValue: number; // ownershipPercent * dynamicValue
  kycTier: KycTier;
  cabinetRole?: CabinetRole;
  isPrimaryAdmin: boolean;
  isDormant: boolean;
  joinedAt: string;
}

export interface OwnershipBreakdownProps {
  entries: OwnershipEntry[];
  hallId: string;
  hallName: string;
  totalAssetValue: number;
  unallocatedPercent: number;
  yourLedgerId?: string;
  yourOwnershipPercent?: number;
  isLoading?: boolean;
  onListForSale?: (userId: string) => void;
  onBuyMore?: () => void;
  onExport?: () => void;
}

//  Config
const KYC_CONFIG: Record<KycTier, { label: string; color: string; bg: string }> = {
  visitor:  { label: "Visitor",  color: "text-slate-400",    bg: "bg-slate-500/10" },
  sovereign:{ label: "Sovereign",color: "text-cyan-400",     bg: "bg-cyan-500/10" },
  verified: { label: "Verified", color: "text-emerald-400",  bg: "bg-emerald-500/10" },
  whale:    { label: "Whale",    color: "text-amber-400",    bg: "bg-amber-500/10" },
};

const CABINET_COLORS: Record<CabinetRole, string> = {
  speaker: "#8b5cf6",
  treasurer: "#10b981",
  warden: "#f59e0b",
  scribe: "#0ea5e9",
};

const PIE_COLORS = [
  "#22d3ee", "#34d399", "#f59e0b", "#8b5cf6", "#f472b6",
  "#0ea5e9", "#10b981", "#ef4444", "#a78bfa", "#fb923c",
  "#14b8a6", "#e879f9", "#60a5fa", "#84cc16", "#f87171",
];

//  Helpers
function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

//  Component
export function OwnershipBreakdown({
  entries,
  hallId,
  hallName,
  totalAssetValue,
  unallocatedPercent,
  yourLedgerId,
  yourOwnershipPercent,
  isLoading = false,
  onListForSale,
  onBuyMore,
  onExport,
}: OwnershipBreakdownProps) {
  const [showPie, setShowPie] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"ownership" | "value" | "dividends" | "newest">("ownership");

  const totalAllocated = useMemo(
    () => entries.reduce((s, e) => s + e.ownershipPercent, 0),
    [entries]
  );

  const sortedEntries = useMemo(() => {
    const sorted = [...entries];
    switch (sortBy) {
      case "ownership":
        sorted.sort((a, b) => b.ownershipPercent - a.ownershipPercent);
        break;
      case "value":
        sorted.sort((a, b) => b.totalValue - a.totalValue);
        break;
      case "dividends":
        sorted.sort((a, b) => b.accumulatedDividends - a.accumulatedDividends);
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        break;
    }
    return sorted;
  }, [entries, sortBy]);

  // Pie data — top 15 + "Others"
  const pieData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.ownershipPercent - a.ownershipPercent);
    const top = sorted.slice(0, 15);
    const others = sorted.slice(15);
    const othersPct = others.reduce((s, e) => s + e.ownershipPercent, 0);

    const data = top.map((e) => ({
      name: e.displayName || e.ledgerId,
      value: e.ownershipPercent,
      ledgerId: e.ledgerId,
      color: e.cabinetRole ? CABINET_COLORS[e.cabinetRole] : undefined,
    }));

    if (othersPct > 0) {
      data.push({ name: `Others (${others.length})`, value: othersPct, ledgerId: "others", color: "#475569" });
    }

    if (unallocatedPercent > 0) {
      data.push({ name: "Unallocated", value: unallocatedPercent, ledgerId: "unallocated", color: "#1e293b" });
    }

    return data;
  }, [entries, unallocatedPercent]);

  // Stats
  const avgOwnership = entries.length ? totalAllocated / entries.length : 0;
  const largestStake = entries.length ? Math.max(...entries.map((e) => e.ownershipPercent)) : 0;
  const totalDividends = entries.reduce((s, e) => s + e.accumulatedDividends, 0);
  const totalValuation = entries.reduce((s, e) => s + e.totalValue, 0);

  if (isLoading) {
    return <OwnershipSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/*  Header  */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Ownership Registry
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {entries.length} sovereign{entries.length === 1 ? "" : "s"} ·{" "}
            <span className="font-mono text-slate-300">
              {totalAllocated.toFixed(1)}%
            </span>{" "}
            allocated ·{" "}
            <span className="font-mono text-slate-300">
              {formatCurrency(totalAssetValue)}
            </span>{" "}
            asset value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          {onBuyMore && (
            <Button
              size="sm"
              onClick={onBuyMore}
              className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Buy More
            </Button>
          )}
        </div>
      </div>

      {/*  Stats Row  */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox
          icon={Percent}
          label="Total Allocated"
          value={`${totalAllocated.toFixed(1)}%`}
          sub={
            unallocatedPercent > 0
              ? `${unallocatedPercent.toFixed(1)}% unallocated`
              : "Fully allocated"
          }
          color="cyan"
        />
        <StatBox
          icon={Users}
          label="Sovereigns"
          value={entries.length}
          sub={`Avg ${avgOwnership.toFixed(2)}% per owner`}
          color="emerald"
        />
        <StatBox
          icon={Wallet}
          label="Total Valuation"
          value={formatCompact(totalValuation)}
          sub={`${formatCompact(totalAssetValue)} asset value`}
          color="amber"
        />
        <StatBox
          icon={TrendingUp}
          label="Largest Stake"
          value={`${largestStake.toFixed(2)}%`}
          sub={
            entries.find((e) => e.ownershipPercent === largestStake)
              ?.displayName || "—"
          }
          color="violet"
        />
      </div>

      {/*  Pie Chart + List  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie Chart */}
        <Card className="border-slate-800 bg-slate-950/50 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">
                Distribution
              </h3>
              <button
                onClick={() => setShowPie(!showPie)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPie ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {showPie && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.color ||
                                PIE_COLORS[index % PIE_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length)
                              return null;
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                                <div className="text-xs font-semibold text-slate-200">
                                  {data.name}
                                </div>
                                <div className="text-xs font-mono text-cyan-400 mt-1">
                                  {data.value.toFixed(2)}%
                                </div>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Center text */}
                  <div className="text-center -mt-36 mb-8 relative z-10 pointer-events-none">
                    <div className="text-2xl font-bold font-mono text-slate-100">
                      {entries.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      Sovereigns
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {pieData.slice(0, 8).map((entry, i) => (
                      <div
                        key={entry.ledgerId}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              entry.color || PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-slate-400 truncate">
                          {entry.name}
                        </span>
                        <span className="text-slate-500 font-mono ml-auto">
                          {entry.value.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    {pieData.length > 8 && (
                      <div className="text-[10px] text-slate-600 text-center">
                        +{pieData.length - 8} more
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Ownership List */}
        <Card className="border-slate-800 bg-slate-950/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-slate-200">
                Sovereign Registry
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none bg-slate-900/50 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="ownership">Ownership %</option>
                  <option value="value">Total Value</option>
                  <option value="dividends">Dividends</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800/50">
              {sortedEntries.map((entry, index) => {
                const isYou = entry.ledgerId === yourLedgerId;
                const kyc = KYC_CONFIG[entry.kycTier];
                const isExpanded = expandedEntry === entry.userId;

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`${isYou ? "bg-cyan-500/5" : ""}`}
                  >
                    {/* Main Row */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() =>
                        setExpandedEntry(isExpanded ? null : entry.userId)
                      }
                    >
                      {/* Rank */}
                      <div className="w-6 text-center text-[10px] font-mono text-slate-600 shrink-0">
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                          entry.isPrimaryAdmin
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : entry.cabinetRole
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {entry.avatar ? (
                          <img
                            src={entry.avatar}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          entry.displayName?.[0] || entry.ledgerId.slice(-2)
                        )}
                      </div>

                      {/* Identity */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-200 truncate">
                            {entry.displayName || entry.ledgerId}
                          </span>
                          {isYou && (
                            <Badge className="text-[9px] bg-cyan-500/10 text-cyan-400 border-0 px-1.5">
                              You
                            </Badge>
                          )}
                          {entry.isPrimaryAdmin && (
                            <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-0 px-1.5">
                              <Crown className="w-2 h-2 mr-1" />
                              8th Ledger
                            </Badge>
                          )}
                          {entry.cabinetRole && (
                            <Badge
                              className="text-[9px] border-0 px-1.5"
                              style={{
                                backgroundColor: `${CABINET_COLORS[entry.cabinetRole]}20`,
                                color: CABINET_COLORS[entry.cabinetRole],
                              }}
                            >
                              {entry.cabinetRole}
                            </Badge>
                          )}
                          {entry.isDormant && (
                            <Badge className="text-[9px] bg-red-500/10 text-red-400 border-0 px-1.5">
                              Dormant
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500">
                            {entry.ledgerId}
                          </span>
                          <span
                            className={`text-[9px] px-1 rounded ${kyc.bg} ${kyc.color}`}
                          >
                            {kyc.label}
                          </span>
                        </div>
                      </div>

                      {/* Ownership Bar */}
                      <div className="hidden sm:block w-28 shrink-0">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-slate-500">
                            {entry.ownershipPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-400"
                            style={{
                              width: `${Math.min(entry.ownershipPercent * 5, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Value */}
                      <div className="text-right shrink-0 min-w-[80px]">
                        <div className="text-sm font-mono font-semibold text-slate-200">
                          {formatCompact(entry.totalValue)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatCompact(entry.dynamicValue)}/1%
                        </div>
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
                          <div className="px-3 pb-3 pt-1 border-t border-slate-800/50">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                              <DetailItem
                                label="Ownership"
                                value={`${entry.ownershipPercent.toFixed(2)}%`}
                                color="cyan"
                              />
                              <DetailItem
                                label="Dynamic Value"
                                value={formatCurrency(entry.dynamicValue)}
                                color="emerald"
                              />
                              <DetailItem
                                label="Total Value"
                                value={formatCurrency(entry.totalValue)}
                                color="amber"
                              />
                              <DetailItem
                                label="Dividends"
                                value={formatCurrency(
                                  entry.accumulatedDividends,
                                )}
                                color="violet"
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2">
                              Joined{" "}
                              {new Date(entry.joinedAt).toLocaleDateString()}
                            </div>
                            {isYou && onListForSale && (
                              <div className="mt-3 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onListForSale(entry.userId)}
                                  className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
                                >
                                  <Tag className="w-3.5 h-3.5 mr-1.5" />
                                  List for Sale
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/*  Unallocated Warning  */}
      {unallocatedPercent > 0 && (
        <Card className="border-amber-500/20 bg-amber-950/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-400">
                {unallocatedPercent.toFixed(1)}% Unallocated
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This ownership is not yet claimed. It may be available for
                purchase on the marketplace or reserved for future distribution
                by the 8th Ledger.
              </p>
              {onBuyMore && (
                <Button
                  size="sm"
                  onClick={onBuyMore}
                  className="mt-3 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  Acquire Ownership
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/*  Your Position Card  */}
      {yourOwnershipPercent != null && yourOwnershipPercent > 0 && (
        <Card className="border-cyan-500/20 bg-cyan-950/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Percent className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Your Position</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400">
                    {yourOwnershipPercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Rank #
                    {sortedEntries.findIndex(
                      (e) => e.ledgerId === yourLedgerId,
                    ) + 1}{" "}
                    of {entries.length}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:text-right">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Dynamic Value
                  </div>
                  <div className="text-sm font-mono font-semibold text-slate-200">
                    {formatCurrency(
                      entries.find((e) => e.ledgerId === yourLedgerId)
                        ?.totalValue || 0,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Dividends
                  </div>
                  <div className="text-sm font-mono font-semibold text-emerald-400">
                    {formatCurrency(
                      entries.find((e) => e.ledgerId === yourLedgerId)
                        ?.accumulatedDividends || 0,
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {onListForSale && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const you = entries.find(
                      (e) => e.ledgerId === yourLedgerId,
                    );
                    if (you) onListForSale(you.userId);
                  }}
                  className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
                >
                  <Tag className="w-3.5 h-3.5 mr-1.5" />
                  List for Sale
                </Button>
              )}
              {onBuyMore && (
                <Button
                  size="sm"
                  onClick={onBuyMore}
                  className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  Buy More
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

//  Stat Box
function StatBox({
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
  color: "cyan" | "emerald" | "amber" | "violet";
}) {
  const colorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
      </div>
      <div className="text-lg font-bold font-mono">{value}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>
    </div>
  );
}

//  Detail Item
function DetailItem({ label, value, color }: { label: string; value: string; color: "cyan" | "emerald" | "amber" | "violet" }) {
  const colorMap = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
  };

  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-mono font-semibold ${colorMap[color]}`}>{value}</div>
    </div>
  );
}

//  Skeleton
function OwnershipSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="h-[400px] bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-[400px] bg-slate-800 rounded-xl animate-pulse lg:col-span-2" />
      </div>
    </div>
  );
}