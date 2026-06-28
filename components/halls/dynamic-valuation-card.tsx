// components/halls/dynamic-valuation-card.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  BadgeCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Gavel,
  ShoppingCart,
  XCircle,
  CheckCircle2,
  Clock,
  FileText,
  Calculator,
  Crown,
  Medal,
  Shield,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export type SriTier = "platinum" | "gold" | "silver" | "bronze" | "at_risk";

export interface DynamicValuationData {
  hallId: string;
  hallName: string;
  vertical: string;
  hallClass: string;
  sriScore: number;
  sriTier: SriTier;
  ahgiScore: number;

  // Per 1% ownership
  assetBookValuePerPercent: number;
  accumulatedDividendsPerPercent: number;
  ahgiPremiumPerPercent: number;
  sriBonusPerPercent: number;
  pirDebtPerPercent: number;

  // User's stake
  userOwnershipPercent: number;
  userTotalValue: number;
  userPirDebt: number;

  // Sale rules
  floorPricePerPercent: number;
  canListBelowFloor: boolean; // requires hall vote
  belowFloorVoteStatus?: "none" | "pending" | "passed" | "rejected";

  // Listing limits
  maxFractionPerListing: number; // % of ownership
  minOwnershipAfterSale: number; // 0.1% hard rule
  maxActiveListings: number;
  listingDurationDays: number;

  // Fees
  fullSaleFee: number; // 1%
  fractionalSaleFee: number; // 2%

  // Meta
  lastCalculatedAt: Date;
  nextAppraisalAt: Date;
  appraisalFirm?: string;
  userActiveListings?: number;
}

export interface DynamicValuationCardProps {
  data: DynamicValuationData;
  onListForSale?: (percent: number, pricePerPercent: number, isFullSale: boolean) => void;
  onRequestBelowFloorVote?: () => void;
  onViewAppraisal?: () => void;
  className?: string;
}

//  Tier Config

const TIER_CONFIG: Record<
  SriTier,
  { label: string; color: string; bg: string; bonus: number; icon: React.ElementType }
> = {
  platinum: { label: "Platinum", color: "text-amber-300", bg: "bg-amber-500/10", bonus: 50, icon: Crown },
  gold: { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-500/10", bonus: 30, icon: Medal },
  silver: { label: "Silver", color: "text-slate-300", bg: "bg-slate-400/10", bonus: 10, icon: Shield },
  bronze: { label: "Bronze", color: "text-orange-400", bg: "bg-orange-500/10", bonus: 0, icon: Ban },
  at_risk: { label: "At Risk", color: "text-red-400", bg: "bg-red-500/10", bonus: -20, icon: AlertTriangle },
};

//  Helpers

function formatCurrency(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
}

//  Formula Row ─

function FormulaRow({
  label,
  value,
  isNegative,
  isPositive,
  description,
  delay,
}: {
  label: string;
  value: string;
  isNegative?: boolean;
  isPositive?: boolean;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="flex items-center justify-between py-2.5 border-b border-slate-800/40 last:border-0"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{description}</p>
      </div>
      <div className={cn(
        "text-sm font-bold font-mono shrink-0 ml-4",
        isNegative ? "text-red-400" : isPositive ? "text-emerald-400" : "text-slate-200"
      )}>
        {isNegative ? "-" : "+"}{value}
      </div>
    </motion.div>
  );
}

//  Main Component

export function DynamicValuationCard({
  data,
  onListForSale,
  onRequestBelowFloorVote,
  onViewAppraisal,
  className,
}: DynamicValuationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showLister, setShowLister] = useState(false);
  const [listPercent, setListPercent] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [isFullSale, setIsFullSale] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tierCfg = TIER_CONFIG[data.sriTier];
  const TierIcon = tierCfg.icon;

  const floorTotal = data.floorPricePerPercent * data.userOwnershipPercent;
  const userValueAfterDebt = data.userTotalValue - data.userPirDebt;
  const isBelowFloor = parseFloat(listPrice) < data.floorPricePerPercent;
  const canList = data.userOwnershipPercent >= data.minOwnershipAfterSale;
  const remainingAfterSale = data.userOwnershipPercent - (parseFloat(listPercent) || 0);
  const wouldDropBelowMin = remainingAfterSale > 0 && remainingAfterSale < data.minOwnershipAfterSale;
  const fee = isFullSale ? data.fullSaleFee : data.fractionalSaleFee;
  const estimatedFee = ((parseFloat(listPercent) || 0) / 100) * fee * (parseFloat(listPrice) || 0);
  const estimatedReceive = ((parseFloat(listPercent) || 0) * (parseFloat(listPrice) || 0)) - estimatedFee;

  const handleList = async () => {
    if (!onListForSale || !listPercent || !listPrice) return;
    const pct = parseFloat(listPercent);
    const price = parseFloat(listPrice);
    if (isNaN(pct) || isNaN(price) || pct <= 0 || price <= 0) return;
    if (pct > data.userOwnershipPercent) return;
    if (wouldDropBelowMin) return;
    setIsSubmitting(true);
    try {
      await onListForSale(pct, price, isFullSale || pct >= data.userOwnershipPercent);
      setShowLister(false);
      setListPercent("");
      setListPrice("");
      setIsFullSale(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-slate-950/90 backdrop-blur-md",
        "border-slate-700/50",
        className
      )}
    >
      {/* Top accent */}
      <div className="h-1 w-full bg-cyan-500" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-cyan-400" />
              8th Ledger Valuation
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data.hallName} — Dynamic PAC floor price per 1%
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Next: {formatDate(data.nextAppraisalAt)}
            </span>
            {data.appraisalFirm && (
              <span className="text-[10px] text-slate-600">
                By {data.appraisalFirm}
              </span>
            )}
          </div>
        </div>

        {/* Big Numbers */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 mb-1">
              8th Ledger Floor (per 1%)
            </p>
            <p className="text-xl font-black text-cyan-300 font-mono">
              {formatCurrency(data.floorPricePerPercent)}
            </p>
            <p className="text-[10px] text-cyan-400/60 mt-1">
              Hard floor — cannot list below without hall vote
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Your Total Value
            </p>
            <p className="text-xl font-black text-slate-100 font-mono">
              {formatCurrency(data.userTotalValue)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400">
                {data.userOwnershipPercent.toFixed(2)}% ownership
              </span>
              {data.userPirDebt > 0 && (
                <span className="text-[10px] text-red-400">
                  -{formatCurrency(data.userPirDebt)} PIR debt
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Net after debt */}
        {data.userPirDebt > 0 && (
          <div className="mt-3 rounded-lg bg-red-500/5 p-3 border border-red-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-400/90">Net after PIR debt</span>
            </div>
            <span className="text-sm font-bold text-red-400 font-mono">
              {formatCurrency(userValueAfterDebt)}
            </span>
          </div>
        )}

        {/* Formula Breakdown */}
        <div className="mt-5 rounded-xl border border-slate-800/50 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5" />
              Valuation Formula (per 1%)
            </p>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <FormulaRow
            label="Asset Book Value / 100"
            value={formatCurrency(data.assetBookValuePerPercent)}
            description="Independent appraisal + revenue multiple"
            delay={0.1}
          />
          <FormulaRow
            label="Accumulated Dividends"
            value={formatCurrency(data.accumulatedDividendsPerPercent)}
            isPositive
            description="Total dividends ever paid to 1% ownership"
            delay={0.2}
          />
          <FormulaRow
            label="AHGI Growth Premium"
            value={formatCurrency(data.ahgiPremiumPerPercent)}
            isPositive={data.ahgiPremiumPerPercent > 0}
            description={`(AHGI ${data.ahgiScore} - 50) × $10 per point`}
            delay={0.3}
          />
          <FormulaRow
            label="SRI Tier Bonus"
            value={formatCurrency(data.sriBonusPerPercent)}
            isPositive={data.sriBonusPerPercent > 0}
            isNegative={data.sriBonusPerPercent < 0}
            description={`${tierCfg.label}: ${tierCfg.bonus > 0 ? "+" : ""}${tierCfg.bonus} per 1%`}
            delay={0.4}
          />
          {data.pirDebtPerPercent > 0 && (
            <FormulaRow
              label="PIR Debt"
              value={formatCurrency(data.pirDebtPerPercent)}
              isNegative
              description="Outstanding PIR advances attributed to 1%"
              delay={0.5}
            />
          )}

          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">8th Ledger Floor (per 1%)</span>
            <span className="text-base font-black text-cyan-300 font-mono">
              {formatCurrency(data.floorPricePerPercent)}
            </span>
          </div>
        </div>

        {/* Expanded: Sale Rules */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-xl border border-slate-800/50 bg-slate-900/40 p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Sale Pricing Rules
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Floor Price</p>
                    <p className="text-xs font-bold text-cyan-400">100% of Valuation</p>
                    <p className="text-[10px] text-slate-500">Hard protocol rule</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Below Floor</p>
                    <p className="text-xs font-bold text-amber-400">Requires Hall Vote (51%)</p>
                    <p className="text-[10px] text-slate-500">Protects against fire sales</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Above Floor</p>
                    <p className="text-xs font-bold text-emerald-400">No maximum</p>
                    <p className="text-[10px] text-slate-500">Market decides</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">8th Ledger Fee</p>
                    <p className="text-xs font-bold text-slate-200">1% full / 2% fractional</p>
                    <p className="text-[10px] text-slate-500">Auto-deducted at sale</p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-800/50 space-y-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Listing Limits</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Max fraction per listing</span>
                    <span className="text-slate-200 font-medium">{data.maxFractionPerListing}% of your ownership</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Min ownership after sale</span>
                    <span className="text-slate-200 font-medium">{data.minOwnershipAfterSale}% (hard rule)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Max active listings</span>
                    <span className="text-slate-200 font-medium">{data.maxActiveListings}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Listing duration</span>
                    <span className="text-slate-200 font-medium">{data.listingDurationDays} days</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List for Sale Section */}
        {onListForSale && canList && (
          <div className="mt-5">
            <button
              onClick={() => setShowLister((s) => !s)}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-all",
                showLister
                  ? "border-slate-700 bg-slate-800 text-slate-200"
                  : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              {showLister ? "Cancel Listing" : "List for Sale on 8th Ledger Exchange"}
            </button>

            <AnimatePresence>
              {showLister && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-4">
                    {/* Ownership bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400">Your Ownership</span>
                        <span className="text-xs font-bold text-slate-200">{data.userOwnershipPercent.toFixed(2)}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-500 transition-all"
                          style={{ width: `${data.userOwnershipPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                          Percent to List
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            max={data.userOwnershipPercent}
                            placeholder="0.00"
                            value={listPercent}
                            onChange={(e) => setListPercent(e.target.value)}
                            className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">%</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">
                          Max {Math.min(data.maxFractionPerListing, data.userOwnershipPercent).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                          Price per 1%
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                          <input
                            type="number"
                            step="0.01"
                            placeholder={data.floorPricePerPercent.toString()}
                            value={listPrice}
                            onChange={(e) => setListPrice(e.target.value)}
                            className={cn(
                              "w-full rounded-lg bg-slate-800/60 border px-3 py-2 pl-8 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-all",
                              isBelowFloor && !data.canListBelowFloor
                                ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20"
                                : "border-slate-700/50 focus:border-cyan-500/40 focus:ring-cyan-500/20"
                            )}
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">
                          Floor: {formatCurrency(data.floorPricePerPercent)}
                        </p>
                      </div>
                    </div>

                    {/* Full sale toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsFullSale((s) => !s)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border transition-all",
                          isFullSale
                            ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700/50"
                        )}
                      >
                        {isFullSale ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        Full Sale ({data.userOwnershipPercent.toFixed(2)}%)
                      </button>
                      {isFullSale && (
                        <span className="text-[10px] text-emerald-400">
                          Fee: {data.fullSaleFee}% (vs {data.fractionalSaleFee}% fractional)
                        </span>
                      )}
                    </div>

                    {/* Warnings */}
                    {isBelowFloor && (
                      <div className="rounded-lg bg-amber-500/5 p-3 border border-amber-500/15">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-amber-400/90 font-medium">Below Floor Price</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Your price is {formatCurrency(parseFloat(listPrice))} vs floor {formatCurrency(data.floorPricePerPercent)}.
                              {data.canListBelowFloor
                                ? " Hall vote already approved below-floor sale."
                                : " Requires hall vote (51%) to prevent fire sales."}
                            </p>
                            {!data.canListBelowFloor && onRequestBelowFloorVote && data.belowFloorVoteStatus === "none" && (
                              <button
                                onClick={onRequestBelowFloorVote}
                                className="mt-2 rounded-lg bg-amber-500/15 px-3 py-1.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                              >
                                <Gavel className="h-3 w-3 inline mr-1" />
                                Request Hall Vote
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {wouldDropBelowMin && (
                      <div className="rounded-lg bg-red-500/5 p-3 border border-red-500/15">
                        <div className="flex items-start gap-2">
                          <Ban className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-red-400/90 font-medium">Below Minimum Ownership</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              You would retain {remainingAfterSale.toFixed(2)}%, below the {data.minOwnershipAfterSale}% hard minimum.
                              You must sell your entire stake or retain at least {data.minOwnershipAfterSale}%.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    {listPercent && listPrice && !isNaN(parseFloat(listPercent)) && !isNaN(parseFloat(listPrice)) && (
                      <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800/50 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Listing Preview</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Listed</span>
                          <span className="text-slate-200 font-medium">{parseFloat(listPercent).toFixed(2)}% at {formatCurrency(parseFloat(listPrice))}/1%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Total Listing</span>
                          <span className="text-slate-200 font-bold">{(parseFloat(listPercent) * parseFloat(listPrice)).toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">8th Ledger Fee ({fee}%)</span>
                          <span className="text-amber-400 font-medium">-{formatCurrency(estimatedFee)}</span>
                        </div>
                        <div className="h-px bg-slate-800" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-200 font-semibold">You Receive</span>
                          <span className="text-emerald-400 font-bold font-mono">{formatCurrency(estimatedReceive)}</span>
                        </div>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleList}
                      disabled={
                        isSubmitting ||
                        !listPercent ||
                        !listPrice ||
                        parseFloat(listPercent) <= 0 ||
                        parseFloat(listPrice) <= 0 ||
                        parseFloat(listPercent) > data.userOwnershipPercent ||
                        wouldDropBelowMin ||
                        (isBelowFloor && !data.canListBelowFloor)
                      }
                      className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {isSubmitting ? "Creating Listing..." : "List on 8th Ledger Exchange"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Cannot list warning */}
        {!canList && (
          <div className="mt-5 rounded-xl bg-red-500/5 p-4 border border-red-500/15 flex items-center gap-3">
            <Ban className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-400">Cannot List</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Your ownership is below the minimum threshold for marketplace listings.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <BadgeCheck className="h-3 w-3" />
            <span>Verified by 8th Ledger</span>
            <span className="text-slate-700">•</span>
            <span>Last: {formatDate(data.lastCalculatedAt)}</span>
          </div>
          {onViewAppraisal && (
            <button
              onClick={onViewAppraisal}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-1.5 text-[10px] text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <FileText className="h-3 w-3" />
              View Appraisal
            </button>
          )}
          {data.userActiveListings !== undefined && data.userActiveListings > 0 && (
            <span className="text-[10px] text-cyan-400">
              {data.userActiveListings} active listing{data.userActiveListings !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

//  Skeleton ─

export function DynamicValuationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-slate-800 animate-pulse" />
        <div className="h-3 w-64 rounded bg-slate-800 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
        <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
      </div>
      <div className="h-40 rounded-xl bg-slate-800 animate-pulse" />
      <div className="h-12 rounded-xl bg-slate-800 animate-pulse" />
    </div>
  );
}

export default DynamicValuationCard;