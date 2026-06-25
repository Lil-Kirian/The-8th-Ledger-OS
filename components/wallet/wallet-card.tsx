"use client";

import React from "react";
import {
  Wallet,
  CreditCard,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletCardProps {
  ledgerId: string;
  displayName: string;
  ledgerBalance: number;
  creditPool: number;
  lockedBalance?: number;
  currency?: string;
  kycTier?: "visitor" | "sovereign" | "verified" | "whale";
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
}

const tierConfig = {
  visitor: { label: "Visitor", color: "text-slate-400", bg: "bg-slate-800/40", border: "border-slate-700/40" },
  sovereign: { label: "Sovereign", color: "text-cyan-400", bg: "bg-cyan-900/20", border: "border-cyan-700/30" },
  verified: { label: "Verified", color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-700/30" },
  whale: { label: "Whale", color: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/30" },
};

export default function WalletCard({
  ledgerId,
  displayName,
  ledgerBalance,
  creditPool,
  lockedBalance = 0,
  currency = "USD",
  kycTier = "visitor",
  onDeposit,
  onWithdraw,
  onTransfer,
}: WalletCardProps) {
  const [hideBalance, setHideBalance] = React.useState(false);
  const totalValue = ledgerBalance + creditPool;
  const tier = tierConfig[kycTier];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
            <Wallet size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Sovereign Vault</h3>
            <p className="text-[10px] text-slate-500 font-mono">{ledgerId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-8 h-8 rounded-lg border border-slate-700/40 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all"
          >
            {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", tier.bg, tier.border, tier.color)}>
            <Shield size={10} />
            {tier.label}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Total Balance */}
        <div className="text-center space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Sovereign Value</div>
          <div className="text-3xl font-bold text-slate-100 tracking-tight">
            {hideBalance ? "••••••" : formatCurrency(totalValue)}
          </div>
          <div className="text-[10px] text-slate-600">
            {displayName} • {currency}
          </div>
        </div>

        {/* Balance Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Ledger Balance */}
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
                <Wallet size={14} className="text-cyan-400" />
              </div>
              <div className="text-[10px] text-slate-500 uppercase">Ledger Balance</div>
            </div>
            <div className="text-lg font-bold text-slate-200">
              {hideBalance ? "••••" : formatCurrency(ledgerBalance)}
            </div>
            <div className="text-[9px] text-slate-600 flex items-center gap-1">
              <TrendingUp size={9} className="text-emerald-400" />
              Available for withdrawal
            </div>
          </div>

          {/* Credit Pool */}
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-900/20 border border-amber-700/30 flex items-center justify-center">
                <CreditCard size={14} className="text-amber-400" />
              </div>
              <div className="text-[10px] text-slate-500 uppercase">Credit Pool</div>
            </div>
            <div className="text-lg font-bold text-slate-200">
              {hideBalance ? "••••" : formatCurrency(creditPool)}
            </div>
            <div className="text-[9px] text-slate-600 flex items-center gap-1">
              <Lock size={9} className="text-amber-400" />
              Committed to pools
            </div>
          </div>
        </div>

        {/* Locked Balance (if any) */}
        {lockedBalance > 0 && (
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-slate-500" />
              <span className="text-[10px] text-slate-500">Locked in Escrow</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {hideBalance ? "••••" : formatCurrency(lockedBalance)}
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onDeposit}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-600/20 border border-emerald-700/30 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 transition-all"
          >
            <ArrowDownRight size={14} />
            Deposit
          </button>
          <button
            onClick={onWithdraw}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-cyan-600/20 border border-cyan-700/30 text-cyan-400 text-xs font-bold hover:bg-cyan-600/30 transition-all"
          >
            <ArrowUpRight size={14} />
            Withdraw
          </button>
          <button
            onClick={onTransfer}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-slate-300 text-xs font-bold hover:bg-slate-700/40 transition-all"
          >
            <Wallet size={14} />
            Transfer
          </button>
        </div>

        {/* KYC Tier Limits */}
        <div className="pt-3 border-t border-slate-800/40 space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tier Limits</div>
          <div className="space-y-1.5">
            {[
              { tier: "visitor", limit: "$0", label: "No withdrawals" },
              { tier: "sovereign", limit: "$500", label: "Instant withdrawal" },
              { tier: "verified", limit: "$5,000", label: "24h delay" },
              { tier: "whale", limit: "Unlimited", label: "72h delay" },
            ].map((t) => (
              <div
                key={t.tier}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-[10px]",
                  kycTier === t.tier
                    ? "bg-slate-800/40 border border-slate-700/30"
                    : "opacity-40"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    t.tier === "visitor" ? "bg-slate-500" :
                    t.tier === "sovereign" ? "bg-cyan-400" :
                    t.tier === "verified" ? "bg-emerald-400" :
                    "bg-amber-400"
                  )} />
                  <span className="text-slate-400 uppercase font-bold">{t.tier}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{t.limit}</span>
                  <span className="text-slate-600">{t.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}