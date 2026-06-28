"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowDown,
  Wallet,
  Building2,
  Percent,
  AlertTriangle,
  Shield,
  Hammer,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Receipt,
  PiggyBank,
  Activity,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

//  Types
export interface TreasurySnapshot {
  hallId: string;
  hallName: string;
  month: string; // "Jun 2026"

  // Revenue flow
  grossRevenue: number;
  ledgerTithe: number;        // 20% to 8th Ledger
  payrollDeduction: number;   // Forge payroll
  netRevenue: number;         // After tithe + payroll

  // Reserves
  payrollReserve: number;
  pirDebt: number;
  closureReserve: number;

  // Distribution
  totalOwnershipPercent: number; // should be ~100
  dividendPerPercent: number;    // net / 100
  yourOwnershipPercent: number;
  yourDividend: number;

  // History
  lastMonthGross?: number;
  lastMonthNet?: number;

  // Status
  isClosing: boolean;
  closurePhase?: "warning" | "decision" | "liquidation";
  monthsOperating: number;
}

export interface TreasuryPanelProps {
  snapshot: TreasurySnapshot;
  isLoading?: boolean;
  onExport?: () => void;
  onViewLedger?: () => void;
}

//  Helpers
function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function revenueChange(current: number, previous?: number) {
  if (!previous || previous === 0) return { pct: 0, direction: "flat" as const };
  const pct = ((current - previous) / previous) * 100;
  return {
    pct: Math.abs(pct).toFixed(1),
    direction: pct > 0 ? "up" as const : pct < 0 ? "down" as const : "flat" as const,
  };
}

//  Component
export function TreasuryPanel({ snapshot, isLoading = false, onExport, onViewLedger }: TreasuryPanelProps) {
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const grossChange = revenueChange(snapshot.grossRevenue, snapshot.lastMonthGross);
  const netChange = revenueChange(snapshot.netRevenue, snapshot.lastMonthNet);

  if (isLoading) {
    return <TreasurySkeleton />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/*  Header  */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Hall Treasury
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {snapshot.month} · {snapshot.monthsOperating} month
              {snapshot.monthsOperating === 1 ? "" : "s"} operating
            </p>
          </div>
          <div className="flex items-center gap-2">
            {snapshot.isClosing && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Closure {snapshot.closurePhase}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onViewLedger}
              className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              8th Ledger Ledger
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/*  Top Stats  */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={Landmark}
            label="Gross Revenue"
            value={formatCurrency(snapshot.grossRevenue)}
            sub={
              grossChange.direction === "up"
                ? `+${grossChange.pct}% vs last month`
                : grossChange.direction === "down"
                  ? `-${grossChange.pct}% vs last month`
                  : "No change"
            }
            color={
              grossChange.direction === "up"
                ? "emerald"
                : grossChange.direction === "down"
                  ? "red"
                  : "slate"
            }
            trend={grossChange.direction}
          />
          <StatTile
            icon={Building2}
            label="8th Ledger Tithe"
            value={formatCurrency(snapshot.ledgerTithe)}
            sub={`${((snapshot.ledgerTithe / snapshot.grossRevenue) * 100).toFixed(0)}% of gross`}
            color="amber"
          />
          <StatTile
            icon={Hammer}
            label="Payroll (Forge)"
            value={formatCurrency(snapshot.payrollDeduction)}
            sub={
              snapshot.payrollReserve > 0
                ? `${formatCompact(snapshot.payrollReserve)} reserve`
                : "No reserve"
            }
            color="violet"
          />
          <StatTile
            icon={Wallet}
            label="Net Revenue"
            value={formatCurrency(snapshot.netRevenue)}
            sub={
              netChange.direction === "up"
                ? `+${netChange.pct}% vs last month`
                : netChange.direction === "down"
                  ? `-${netChange.pct}% vs last month`
                  : "No change"
            }
            color={
              netChange.direction === "up"
                ? "emerald"
                : netChange.direction === "down"
                  ? "red"
                  : "slate"
            }
            trend={netChange.direction}
          />
        </div>

        {/*  Revenue Flow Diagram  */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Revenue Distribution Flow
                </h3>
              </div>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showBreakdown ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {showBreakdown && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-1 py-2">
                    {/* Gross */}
                    <FlowNode
                      label="Gross Revenue"
                      amount={snapshot.grossRevenue}
                      color="cyan"
                      icon={Landmark}
                      widthPct={100}
                    />

                    <ArrowDown className="w-4 h-4 text-slate-600" />

                    {/* Split Row */}
                    <div className="w-full grid grid-cols-2 gap-4">
                      {/* Tithe */}
                      <div className="flex flex-col items-center gap-1">
                        <FlowNode
                          label="8th Ledger Tithe"
                          amount={snapshot.ledgerTithe}
                          color="amber"
                          icon={Building2}
                          widthPct={
                            (snapshot.ledgerTithe / snapshot.grossRevenue) * 100
                          }
                          subLabel="20% protocol fee"
                        />
                        <ArrowDown className="w-4 h-4 text-slate-600" />
                        <FlowNode
                          label="To 8th Ledger Holdings"
                          amount={snapshot.ledgerTithe}
                          color="amber"
                          icon={Shield}
                          widthPct={100}
                          compact
                        />
                      </div>

                      {/* Remainder → Payroll + Net */}
                      <div className="flex flex-col items-center gap-1">
                        <FlowNode
                          label="Remaining"
                          amount={snapshot.grossRevenue - snapshot.ledgerTithe}
                          color="slate"
                          icon={Receipt}
                          widthPct={
                            ((snapshot.grossRevenue - snapshot.ledgerTithe) /
                              snapshot.grossRevenue) *
                            100
                          }
                        />
                        <ArrowDown className="w-4 h-4 text-slate-600" />

                        {/* Payroll */}
                        <FlowNode
                          label="Payroll (Forge)"
                          amount={snapshot.payrollDeduction}
                          color="violet"
                          icon={Hammer}
                          widthPct={
                            (snapshot.payrollDeduction /
                              (snapshot.grossRevenue - snapshot.ledgerTithe)) *
                            100
                          }
                          subLabel="8th Ledger executes"
                        />
                        <ArrowDown className="w-4 h-4 text-slate-600" />

                        {/* Net */}
                        <FlowNode
                          label="Net Hall Revenue"
                          amount={snapshot.netRevenue}
                          color="emerald"
                          icon={Wallet}
                          widthPct={100}
                          subLabel="Distributed to sovereigns"
                        />
                      </div>
                    </div>

                    <ArrowDown className="w-4 h-4 text-slate-600" />

                    {/* Distribution */}
                    <FlowNode
                      label={`Dividend per 1% ownership`}
                      amount={snapshot.dividendPerPercent}
                      color="emerald"
                      icon={Percent}
                      widthPct={60}
                      subLabel={`${snapshot.totalOwnershipPercent.toFixed(1)}% total allocated`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/*  Your Dividend  */}
        <Card
          className={`border ${snapshot.isClosing ? "border-red-500/20 bg-red-950/5" : "border-cyan-500/20 bg-cyan-950/10"}`}
        >
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${snapshot.isClosing ? "bg-red-500/10" : "bg-cyan-500/10"}`}
                >
                  <PiggyBank
                    className={`w-7 h-7 ${snapshot.isClosing ? "text-red-400" : "text-cyan-400"}`}
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">
                    Your Dividend — {snapshot.month}
                  </div>
                  <div
                    className={`text-3xl font-bold font-mono mt-0.5 ${snapshot.isClosing ? "text-red-400" : "text-cyan-400"}`}
                  >
                    {formatCurrency(snapshot.yourDividend)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Based on your{" "}
                    <span className="font-mono font-medium text-slate-300">
                      {snapshot.yourOwnershipPercent.toFixed(2)}%
                    </span>{" "}
                    ownership stake
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:text-right">
                <div className="text-xs text-slate-500">
                  Net revenue:{" "}
                  <span className="font-mono text-slate-300">
                    {formatCurrency(snapshot.netRevenue)}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Dividend per 1%:{" "}
                  <span className="font-mono text-slate-300">
                    {formatCurrency(snapshot.dividendPerPercent)}
                  </span>
                </div>
                {snapshot.pirDebt > 0 && (
                  <div className="text-xs text-red-400">
                    PIR debt deducted:{" "}
                    <span className="font-mono">
                      -
                      {formatCurrency(
                        (snapshot.pirDebt / 100) *
                          snapshot.yourOwnershipPercent,
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {snapshot.isClosing && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-400">
                  Hall is in closure protocol. Dividend distribution may be
                  paused or reduced. Final payout will be calculated during
                  liquidation.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/*  Reserves & Debt  */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ReserveCard
            icon={Hammer}
            label="Payroll Reserve"
            amount={snapshot.payrollReserve}
            description="Funds reserved for worker salaries and vendor contracts. Hall votes on staffing levels. 8th Ledger executes."
            color="violet"
          />
          <ReserveCard
            icon={Shield}
            label="PIR Debt"
            amount={snapshot.pirDebt}
            description="Outstanding Protocol Infrastructure Reserve advances. Auto-deducted from dividends until repaid."
            color="amber"
            warning={snapshot.pirDebt > 0}
          />
          <ReserveCard
            icon={PiggyBank}
            label="Closure Reserve"
            amount={snapshot.closureReserve}
            description="Sanctuary pillar funds reserved for hall closure payouts and worker severance. 8th Ledger controlled."
            color="emerald"
          />
        </div>

        {/*  Ownership Allocation Bar  */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">
                Ownership Allocation
              </span>
              <span className="text-xs font-mono text-slate-500">
                {snapshot.totalOwnershipPercent.toFixed(1)}% / 100%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                style={{
                  width: `${Math.min(snapshot.totalOwnershipPercent, 100)}%`,
                }}
              />
              {snapshot.totalOwnershipPercent < 100 && (
                <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                  <span className="text-[9px] text-slate-500 font-mono">
                    {(100 - snapshot.totalOwnershipPercent).toFixed(1)}%
                    unallocated
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
              <span>0%</span>
              <span>
                Your stake: {snapshot.yourOwnershipPercent.toFixed(2)}%
              </span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

//  Stat Tile
function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: "emerald" | "red" | "amber" | "violet" | "slate" | "cyan";
  trend?: "up" | "down" | "flat";
}) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    slate: "text-slate-400 bg-slate-500/10 border-slate-700",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono">{value}</div>
      <div className="flex items-center gap-1 text-[10px] opacity-60 mt-1">
        {trend && <TrendIcon className="w-3 h-3" />}
        {sub}
      </div>
    </div>
  );
}

//  Flow Node
function FlowNode({
  label,
  amount,
  color,
  icon: Icon,
  widthPct,
  subLabel,
  compact = false,
}: {
  label: string;
  amount: number;
  color: "cyan" | "amber" | "violet" | "emerald" | "slate";
  icon: React.ElementType;
  widthPct: number;
  subLabel?: string;
  compact?: boolean;
}) {
  const colorMap = {
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    slate: "bg-slate-800 border-slate-700 text-slate-400",
  };

  if (compact) {
    return (
      <div className={`w-full rounded-lg border px-3 py-2 ${colorMap[color]}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
          <span className="text-xs font-mono font-semibold">{formatCompact(amount)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className={`rounded-xl border p-3 ${colorMap[color]} transition-all`}
        style={{ width: `${Math.max(widthPct, 30)}%` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <span className="text-sm font-mono font-bold">{formatCompact(amount)}</span>
        </div>
        {subLabel && (
          <div className="text-[10px] opacity-60 mt-1">{subLabel}</div>
        )}
      </div>
    </div>
  );
}

//  Reserve Card
function ReserveCard({
  icon: Icon,
  label,
  amount,
  description,
  color,
  warning = false,
}: {
  icon: React.ElementType;
  label: string;
  amount: number;
  description: string;
  color: "violet" | "amber" | "emerald";
  warning?: boolean;
}) {
  const colorMap = {
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`rounded-xl border p-4 cursor-help ${colorMap[color]} ${warning ? "ring-1 ring-red-500/20" : ""}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
          </div>
          <div className="text-xl font-bold font-mono">{formatCurrency(amount)}</div>
          {warning && amount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1">
              <AlertTriangle className="w-3 h-3" />
              Outstanding balance
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 max-w-xs p-3">
        <p className="text-xs text-slate-300">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

//  Skeleton
function TreasurySkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-slate-800 rounded-xl animate-pulse" />
      <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}