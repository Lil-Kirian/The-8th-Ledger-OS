"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  Landmark,
  Gift,
  ShoppingCart,
  Package,
  Gavel,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Filter,
  Search,
  Receipt,
  Building2,
  Shield,
  Hammer,
  Calendar,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// UNIFIED TRANSACTION TYPE
// ============================================================

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "dividend"
  | "ledger_transfer"
  | "trade"
  | "marketplace_sale"
  | "marketplace_purchase"
  | "inventory_sale"
  | "inventory_purchase"
  | "referral"
  | "liquidation_payout"
  | "pir_advance"
  | "payroll"
  | "treasury"
  | "closure_reserve"
  | "insurance";

export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled" | "processing";

export interface LedgerTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  timestamp: string;
  direction: "in" | "out" | "neutral";
  metadata?: {
    hallName?: string;
    hallId?: string;
    poolName?: string;
    poolId?: string;
    counterpartyName?: string;
    counterpartyLedgerId?: string;
    txHash?: string;
    fee?: number;
    netAmount?: number;
    notes?: string;
  };
}

interface TransactionListProps {
  transactions: LedgerTransaction[];
  ledgerId?: string;
  ledgerBalance?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showExport?: boolean;
  maxItems?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
}

// ============================================================
// CONFIGURATION
// ============================================================

const typeConfig: Record<
  TransactionType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
  }
> = {
  deposit: {
    label: "Deposit",
    icon: ArrowDownLeft,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
  },
  withdrawal: {
    label: "Withdrawal",
    icon: ArrowUpRight,
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
  },
  dividend: {
    label: "Dividend",
    icon: TrendingUp,
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
  },
  ledger_transfer: {
    label: "Transfer",
    icon: ArrowLeftRight,
    color: "text-violet-400",
    bg: "bg-violet-900/20",
    border: "border-violet-700/30",
  },
  trade: {
    label: "Trade",
    icon: ArrowLeftRight,
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/30",
  },
  marketplace_sale: {
    label: "PAC Sale",
    icon: Receipt,
    color: "text-teal-400",
    bg: "bg-teal-900/20",
    border: "border-teal-700/30",
  },
  marketplace_purchase: {
    label: "PAC Purchase",
    icon: ShoppingCart,
    color: "text-rose-400",
    bg: "bg-rose-900/20",
    border: "border-rose-700/30",
  },
  inventory_sale: {
    label: "Inventory Sale",
    icon: Package,
    color: "text-teal-400",
    bg: "bg-teal-900/20",
    border: "border-teal-700/30",
  },
  inventory_purchase: {
    label: "Inventory Purchase",
    icon: Package,
    color: "text-rose-400",
    bg: "bg-rose-900/20",
    border: "border-rose-700/30",
  },
  referral: {
    label: "Referral",
    icon: Gift,
    color: "text-pink-400",
    bg: "bg-pink-900/20",
    border: "border-pink-700/30",
  },
  liquidation_payout: {
    label: "Liquidation",
    icon: Gavel,
    color: "text-orange-400",
    bg: "bg-orange-900/20",
    border: "border-orange-700/30",
  },
  pir_advance: {
    label: "PIR Advance",
    icon: Shield,
    color: "text-indigo-400",
    bg: "bg-indigo-900/20",
    border: "border-indigo-700/30",
  },
  payroll: {
    label: "Payroll",
    icon: Hammer,
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
  },
  treasury: {
    label: "Treasury",
    icon: Landmark,
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
  },
  closure_reserve: {
    label: "Closure Reserve",
    icon: Building2,
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/30",
  },
  insurance: {
    label: "Insurance",
    icon: Shield,
    color: "text-sky-400",
    bg: "bg-sky-900/20",
    border: "border-sky-700/30",
  },
};

const statusConfig: Record<
  TransactionStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-900/20",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-900/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-900/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "text-slate-400",
    bg: "bg-slate-800/30",
  },
};

const filterOptions: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "All Transactions" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "dividend", label: "Dividends" },
  { value: "ledger_transfer", label: "Transfers" },
  { value: "marketplace_sale", label: "PAC Sales" },
  { value: "marketplace_purchase", label: "PAC Purchases" },
  { value: "inventory_sale", label: "Inventory" },
  { value: "referral", label: "Referrals" },
  { value: "liquidation_payout", label: "Liquidations" },
  { value: "pir_advance", label: "PIR Advances" },
];

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(transactions: LedgerTransaction[]): [string, LedgerTransaction[]][] {
  const groups: Record<string, LedgerTransaction[]> = {};
  const now = new Date();

  transactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    let key: string;
    if (isToday) key = "Today";
    else if (isYesterday) key = "Yesterday";
    else {
      key = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  return Object.entries(groups);
}

// ============================================================
// COMPONENT
// ============================================================

export default function TransactionList({
  transactions,
  ledgerId,
  ledgerBalance,
  showFilters = true,
  showSearch = true,
  showExport = true,
  maxItems,
  onLoadMore,
  hasMore = false,
  emptyTitle = "No Transactions",
  emptySubtitle = "Your ledger activity will appear here once you begin committing, trading, or earning dividends.",
}: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (filter !== "all") {
      result = result.filter((tx) => tx.type === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          tx.type.toLowerCase().includes(q) ||
          tx.metadata?.hallName?.toLowerCase().includes(q) ||
          tx.metadata?.poolName?.toLowerCase().includes(q) ||
          tx.metadata?.counterpartyName?.toLowerCase().includes(q) ||
          tx.metadata?.counterpartyLedgerId?.toLowerCase().includes(q)
      );
    }

    // Sort by timestamp desc
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (maxItems && result.length > maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [transactions, filter, searchQuery, maxItems]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const totalIn = useMemo(
    () => filtered.filter((t) => t.direction === "in" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );
  const totalOut = useMemo(
    () => filtered.filter((t) => t.direction === "out" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0),
    [filtered]
  );

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-[#0d0d1a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
              <Wallet size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Ledger Activity</h3>
              <p className="text-[10px] text-slate-500">
                {ledgerId ? `${ledgerId} • ` : ""}
                {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {ledgerBalance !== undefined && (
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase">Balance</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">
                {formatCurrency(ledgerBalance, "USD")}
              </div>
            </div>
          )}
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-950/10 border border-emerald-800/20 text-center">
            <div className="text-[9px] text-emerald-500 uppercase font-bold">In</div>
            <div className="text-xs text-emerald-400 font-mono font-bold">{formatCurrency(totalIn)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/10 border border-amber-800/20 text-center">
            <div className="text-[9px] text-amber-500 uppercase font-bold">Out</div>
            <div className="text-xs text-amber-400 font-mono font-bold">{formatCurrency(totalOut)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/10 border border-cyan-800/20 text-center">
            <div className="text-[9px] text-cyan-500 uppercase font-bold">Net</div>
            <div className="text-xs text-cyan-400 font-mono font-bold">{formatCurrency(totalIn - totalOut)}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          {showSearch && (
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          )}
          {showFilters && (
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as TransactionType | "all")}
                className="pl-9 pr-8 py-2 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs text-slate-200 appearance-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all cursor-pointer"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            </div>
          )}
          {showExport && (
            <button
              onClick={() => {
                const csv = [
                  ["Date", "Type", "Description", "Amount", "Currency", "Status", "Direction"].join(","),
                  ...filtered.map((tx) =>
                    [
                      new Date(tx.timestamp).toISOString(),
                      tx.type,
                      `"${tx.description.replace(/"/g, '""')}"`,
                      tx.amount,
                      tx.currency,
                      tx.status,
                      tx.direction,
                    ].join(",")
                  ),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ledger-activity-${ledgerId || "export"}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="max-h-[600px] overflow-y-auto">
        {grouped.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-slate-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-400 mb-1">{emptyTitle}</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">{emptySubtitle}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {grouped.map(([dateLabel, txs]) => (
              <div key={dateLabel}>
                <div className="sticky top-0 z-10 px-5 py-2 bg-[#0a0a12]/95 backdrop-blur-sm border-b border-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {dateLabel}
                  </span>
                </div>
                <div className="divide-y divide-slate-800/20">
                  {txs.map((tx) => {
                    const cfg = typeConfig[tx.type];
                    const statusCfg = statusConfig[tx.status];
                    const TypeIcon = cfg.icon;
                    const StatusIcon = statusCfg.icon;
                    const isExpanded = expandedId === tx.id;

                    return (
                      <div
                        key={tx.id}
                        className="px-5 py-4 hover:bg-slate-800/20 transition-colors cursor-pointer group"
                        onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all",
                              cfg.bg,
                              cfg.border,
                              tx.direction === "in" && "ring-1 ring-emerald-500/10",
                              tx.direction === "out" && "ring-1 ring-amber-500/10"
                            )}
                          >
                            <TypeIcon size={18} className={cfg.color} />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-slate-200 truncate">
                                {tx.description}
                              </span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0",
                                  statusCfg.bg,
                                  statusCfg.color,
                                  "border-transparent"
                                )}
                              >
                                <StatusIcon size={9} className="inline mr-0.5" />
                                {statusCfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                              <span>•</span>
                              <span>{formatDate(tx.timestamp)}</span>
                              {tx.metadata?.hallName && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400">{tx.metadata.hallName}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right shrink-0">
                            <div
                              className={cn(
                                "text-sm font-bold font-mono",
                                tx.direction === "in"
                                  ? "text-emerald-400"
                                  : tx.direction === "out"
                                  ? "text-amber-400"
                                  : "text-slate-300"
                              )}
                            >
                              {tx.direction === "in" ? "+" : tx.direction === "out" ? "-" : ""}
                              {formatCurrency(tx.amount, tx.currency)}
                            </div>
                            {tx.metadata?.fee !== undefined && (
                              <div className="text-[9px] text-slate-600">
                                Fee: {formatCurrency(tx.metadata.fee, tx.currency)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && tx.metadata && (
                          <div className="mt-3 ml-14 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 space-y-2 animate-in slide-in-from-top-1">
                            {tx.metadata.hallName && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Hall</span>
                                <span className="text-slate-300 font-medium">{tx.metadata.hallName}</span>
                              </div>
                            )}
                            {tx.metadata.poolName && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Pool</span>
                                <span className="text-slate-300 font-medium">{tx.metadata.poolName}</span>
                              </div>
                            )}
                            {tx.metadata.counterpartyName && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Counterparty</span>
                                <span className="text-slate-300 font-medium">
                                  {tx.metadata.counterpartyName}
                                  {tx.metadata.counterpartyLedgerId && (
                                    <span className="text-slate-600 font-mono ml-1">
                                      ({tx.metadata.counterpartyLedgerId})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {tx.metadata.txHash && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Tx Hash</span>
                                <span className="text-cyan-400 font-mono text-[10px] truncate max-w-[200px]">
                                  {tx.metadata.txHash}
                                </span>
                              </div>
                            )}
                            {tx.metadata.netAmount !== undefined && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Net Amount</span>
                                <span className="text-emerald-400 font-mono font-bold">
                                  {formatCurrency(tx.metadata.netAmount, tx.currency)}
                                </span>
                              </div>
                            )}
                            {tx.metadata.notes && (
                              <div className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-700/20">
                                {tx.metadata.notes}
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-700/20">
                              <span>ID: {tx.id.slice(-8)}</span>
                              <span>{new Date(tx.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && onLoadMore && (
          <div className="p-4 text-center border-t border-slate-800/40">
            <button
              onClick={onLoadMore}
              className="px-6 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-cyan-500/30 hover:bg-cyan-950/10 transition-all"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}