"use client";

import React from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  TrendingUp,
  Lock,
  CreditCard,
  Landmark,
  Crown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  ledgerBalance: number;
  creditPool: number;
  totalCommitted: number;
  lockedBalance?: number;
  kycTier?: "visitor" | "sovereign" | "verified" | "whale";
  ledgerId?: string;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
}

const tierConfig = {
  visitor: {
    label: "Visitor",
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
    icon: Lock,
    limit: "$0",
  },
  sovereign: {
    label: "Sovereign",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: Sparkles,
    limit: "$500",
  },
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: TrendingUp,
    limit: "$5,000",
  },
  whale: {
    label: "Whale",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Crown,
    limit: "Unlimited",
  },
};

export default function BalanceDisplay({
  ledgerBalance,
  creditPool,
  totalCommitted,
  lockedBalance = 0,
  kycTier = "visitor",
  ledgerId,
  onDeposit,
  onWithdraw,
  onTransfer,
}: BalanceDisplayProps) {
  const tier = tierConfig[kycTier];
  const TierIcon = tier.icon;
  const availableBalance = ledgerBalance - lockedBalance;
  const totalValue = ledgerBalance + creditPool + totalCommitted;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <div className="bg-[#0a0a12] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

        <div className="relative p-6 sm:p-8">
          {/* Top Row: Title + Tier */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
                <Wallet size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Ledger Balance</h2>
                {ledgerId && (
                  <p className="text-[10px] text-slate-600 font-mono">{ledgerId}</p>
                )}
              </div>
            </div>
            <div
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5",
                tier.bg,
                tier.border,
                tier.color
              )}
            >
              <TierIcon size={12} />
              {tier.label}
            </div>
          </div>

          {/* Primary Balance */}
          <div className="mb-6">
            <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {formatCurrency(ledgerBalance)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Available: {formatCurrency(availableBalance)}</span>
              {lockedBalance > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Lock size={10} />
                  Locked: {formatCurrency(lockedBalance)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                <CreditCard size={10} />
                Credit Pool
              </div>
              <div className="text-sm font-bold text-slate-200">
                {formatCurrency(creditPool)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Landmark size={10} />
                Committed
              </div>
              <div className="text-sm font-bold text-slate-200">
                {formatCurrency(totalCommitted)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/20">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp size={10} />
                Total Value
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {formatCurrency(totalValue)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onDeposit}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-600/30 transition-all"
            >
              <ArrowDownLeft size={16} />
              Deposit
            </button>
            <button
              onClick={onWithdraw}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-600/30 transition-all"
            >
              <ArrowUpRight size={16} />
              Withdraw
            </button>
            <button
              onClick={onTransfer}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700/30 border border-slate-600/30 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition-all"
            >
              <ArrowRightLeft size={16} />
              Transfer
            </button>
          </div>
        </div>

        {/* KYC Tier Limit Footer */}
        <div className="px-6 sm:px-8 py-3 border-t border-slate-800/40 bg-slate-900/20 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Withdrawal limit: <span className={cn("font-bold", tier.color)}>{tier.limit}</span>
          </span>
          <span className="text-[10px] text-slate-600">
            KYC tier determines your limits
          </span>
        </div>
      </div>

      {/* Mini Portfolio Summary */}
      <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Portfolio Snapshot</h3>
          <span className="text-[10px] text-slate-500">Live</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/20 border border-emerald-700/20 flex items-center justify-center">
                <Wallet size={14} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300">Liquid Ledger</div>
                <div className="text-[10px] text-slate-600">Available for withdrawal</div>
              </div>
            </div>
            <div className="text-sm font-bold text-slate-200">
              {formatCurrency(availableBalance)}
            </div>
          </div>
          <div className="h-px bg-slate-800/40" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-900/20 border border-cyan-700/20 flex items-center justify-center">
                <Landmark size={14} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300">In Halls</div>
                <div className="text-[10px] text-slate-600">Active ownership commitments</div>
              </div>
            </div>
            <div className="text-sm font-bold text-slate-200">
              {formatCurrency(totalCommitted)}
            </div>
          </div>
          <div className="h-px bg-slate-800/40" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/20 border border-amber-700/20 flex items-center justify-center">
                <Lock size={14} className="text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300">Locked / Pending</div>
                <div className="text-[10px] text-slate-600">Escrow, auctions, transfers</div>
              </div>
            </div>
            <div className="text-sm font-bold text-slate-200">
              {formatCurrency(lockedBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}