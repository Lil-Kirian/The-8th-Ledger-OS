// components/marketplace/ownership-detail.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Hash,
  Crown,
  Gem,
  Activity,
  Building2,
  Calendar,
  Eye,
  Heart,
  ChevronRight,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   VERTICAL EMOJI MAP
   ============================================================ */
const verticalEmojiMap: Record<string, string> = {
  ledgerprop: "🏠",
  ledgerauto: "🚗",
  ledgertech: "📱",
  ledgeredu: "🎓",
  ledgerhealth: "🏥",
  ledgerbiz: "🏗️",
  ledgertravel: "✈️",
  ledgeragri: "🌾",
  ledgerenergy: "⚡",
  ledgeraccess: "🔓",
  sportledger: "🏆",
};

/* ============================================================
   TYPES — Aligned with updated schema
   ============================================================ */
export interface OwnershipListingData {
  id: string;
  ownershipId: string;
  hallId: string;
  hallName: string;
  hallClass: "I" | "II" | "III";
  verticalId: string;
  verticalName: string;
  country: string;
  countryFlag: string;
  sellerId: string;
  sellerLedgerId: string;
  sellerDisplayName: string;
  sellerKycTier: string;
  sellerAvatar?: string;
  percentListed: number;
  pricePerPercent: number; // cents
  totalPrice: number; // cents
  floorPrice: number; // cents
  status: "active" | "pending" | "completed" | "cancelled" | "refunded";
  listedAt: string;
  expiresAt?: string;
  escrowStartedAt?: string;
  escrowExpiresAt?: string;
  auditHash?: string;
  belowFloorApproved: boolean;
  viewCount: number;
  interestCount: number;
  isFractional: boolean;
  isFeatured?: boolean;
  // Hall-level data
  hallSriTier?: "platinum" | "gold" | "silver" | "bronze" | "at_risk";
  hallSriScore?: number;
  ahgiScore?: number;
  monthlyDividendEstimate?: number; // cents
  accumulatedDividends?: number; // cents per 1%
  assetBookValue?: number; // cents
  pirDebtPerPercent?: number; // cents
  ihcpDebtPerPercent?: number; // cents
}

interface OwnershipDetailProps {
  listing: OwnershipListingData;
  onClose: () => void;
  onBuy?: (listingId: string) => void;
  userKycTier?: string;
  userLedgerId?: string;
  userLedgerBalance?: number;
}

const hallClassConfig = {
  I: { label: "CLASS I — PASSIVE", desc: "8th Ledger manages everything. Minimal hall input.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  II: { label: "CLASS II — MANAGED", desc: "Hall hires operators. 8th Ledger executes.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  III: { label: "CLASS III — ACTIVE", desc: "Hall runs daily operations. Full staffing.", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const sriTierConfig = {
  platinum: { icon: Crown, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "PLATINUM", effect: "Early access, 0.25% marketplace fees" },
  gold: { icon: Gem, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "GOLD", effect: "Reduced fees (0.5%)" },
  silver: { icon: Shield, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "SILVER", effect: "Standard operation" },
  bronze: { icon: Shield, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "BRONZE", effect: "Restricted: cannot propose hires" },
  at_risk: { icon: Activity, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "AT RISK", effect: "8th Ledger oversight. Dividends paused." },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100);
}

function formatDollar(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n / 100);
}

function getKycTierRank(tier: string): number {
  const ranks: Record<string, number> = { visitor: 0, sovereign: 1, verified: 2, whale: 3 };
  return ranks[tier] || 0;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return (
    <span className="font-mono text-sm font-bold text-cyan-400">
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

export function OwnershipDetail({
  listing,
  onClose,
  onBuy,
  userKycTier = "visitor",
  userLedgerId,
  userLedgerBalance = 0,
}: OwnershipDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "valuation" | "seller">("overview");
  const [showConfirm, setShowConfirm] = useState(false);

  const hallClass = hallClassConfig[listing.hallClass];
  const sriTier = listing.hallSriTier ? sriTierConfig[listing.hallSriTier] : null;
  const SRIIcon = sriTier?.icon || Shield;

  const feeRate = listing.isFractional ? 0.02 : 0.01;
  const feeAmount = Math.round(listing.totalPrice * feeRate);
  const totalWithFee = listing.totalPrice + feeAmount;

  const pricePremium = listing.floorPrice > 0
    ? ((listing.pricePerPercent / listing.floorPrice) - 1) * 100
    : 0;
  const isAboveFloor = listing.pricePerPercent >= listing.floorPrice;
  const isBelowFloorUnapproved = !isAboveFloor && !listing.belowFloorApproved;

  const kycBlocked = getKycTierRank(userKycTier) < getKycTierRank(listing.sellerKycTier);
  const canAfford = userLedgerBalance >= totalWithFee;

  const daysRemaining = listing.expiresAt
    ? Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const sriBonus = listing.hallSriTier === "platinum" ? 50 : listing.hallSriTier === "gold" ? 30 : listing.hallSriTier === "silver" ? 10 : listing.hallSriTier === "bronze" ? 0 : -20;

  const assetBookPerPercent = listing.assetBookValue ? Math.round(listing.assetBookValue / 100) : 0;
  const ahgiPremium = listing.ahgiScore ? Math.max(0, (listing.ahgiScore - 50) * 10) : 0;
  const pirDebt = listing.pirDebtPerPercent || 0;
  const ihcpDebt = listing.ihcpDebtPerPercent || 0;

  const escrowExpiry = listing.escrowExpiresAt || listing.expiresAt;
  const isEscrowActive = listing.status === "pending" && escrowExpiry && new Date(escrowExpiry).getTime() > Date.now();

  const verticalEmoji = verticalEmojiMap[listing.verticalId] || "📦";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950 shadow-2xl shadow-black/50"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/95 px-6 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900 text-slate-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-400"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-100">{listing.hallName}</span>
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider border", hallClass.bg, hallClass.color, hallClass.border)}>
                    {hallClass.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono text-cyan-500">LED-{listing.hallId.slice(-8)}</span>
                  <span>·</span>
                  <span>{listing.countryFlag} {listing.country}</span>
                  <span>·</span>
                  <span>{verticalEmoji} {listing.verticalName}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto p-6">
            {/* Tabs */}
            <div className="mb-6 flex gap-2">
              {(["overview", "valuation", "seller"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all",
                    activeTab === tab
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* SRI & AHGI badges */}
                <div className="grid grid-cols-2 gap-3">
                  {sriTier && (
                    <div className={cn("rounded-xl border p-4", sriTier.bg, sriTier.border)}>
                      <div className="mb-2 flex items-center gap-2">
                        <SRIIcon className={cn("h-4 w-4", sriTier.color)} />
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">SRI Score</span>
                      </div>
                      <div className={cn("text-2xl font-bold", sriTier.color)}>{listing.hallSriScore || 50}</div>
                      <div className={cn("text-xs opacity-80", sriTier.color)}>{sriTier.label} — {sriTier.effect}</div>
                    </div>
                  )}
                  {!sriTier && (
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <Shield className="h-4 w-4" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">SRI Score</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-100">50</div>
                      <div className="text-xs text-slate-500">SILVER — Standard operation</div>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-cyan-400">
                      <Building2 className="h-4 w-4" />
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">AHGI Score</span>
                    </div>
                    <div className={cn(
                      "text-2xl font-bold",
                      (listing.ahgiScore || 50) >= 80 ? "text-emerald-400" :
                      (listing.ahgiScore || 50) >= 60 ? "text-cyan-400" :
                      (listing.ahgiScore || 50) >= 40 ? "text-amber-400" : "text-red-400"
                    )}>
                      {listing.ahgiScore || 50}
                    </div>
                    <div className="text-xs text-slate-500">
                      {listing.ahgiScore && listing.ahgiScore >= 80 ? "Thriving" : listing.ahgiScore && listing.ahgiScore >= 60 ? "Healthy" : listing.ahgiScore && listing.ahgiScore >= 40 ? "Stagnant" : "Declining"}
                    </div>
                  </div>
                </div>

                {/* Ownership breakdown */}
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Ownership Transfer</div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="mb-1 text-3xl font-bold text-slate-100">{listing.percentListed.toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">For Sale</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                    <div className="flex-1">
                      <div className="mb-2 flex justify-between text-xs text-slate-400">
                        <span>Seller keeps {(100 - listing.percentListed).toFixed(1)}%</span>
                        <span>Buyer gets {listing.percentListed.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="flex h-full">
                          <div className="bg-slate-600" style={{ width: `${100 - listing.percentListed}%` }} />
                          <div className="bg-cyan-500" style={{ width: `${listing.percentListed}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial summary */}
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Financial Summary</div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Listing Price</span>
                      <span className="font-semibold text-slate-100">{formatCurrency(listing.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">8th Ledger Fee ({listing.isFractional ? "2%" : "1%"})</span>
                      <span className="font-semibold text-slate-100">{formatCurrency(feeAmount)}</span>
                    </div>
                    <div className="border-t border-slate-800/60 pt-3">
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-slate-200">Total to Pay</span>
                        <span className="font-bold text-cyan-400">{formatCurrency(totalWithFee)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Est. Monthly Dividend</span>
                      <span className="text-emerald-400">+{formatCurrency(listing.monthlyDividendEstimate || 0)}/mo</span>
                    </div>
                  </div>
                </div>

                {/* 48h escrow notice */}
                <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold text-cyan-300">48-Hour Sovereign Hold</div>
                    <div className="text-xs text-slate-400">
                      Funds held in escrow for 48 hours. Seller cannot cancel. Buyer can cancel for full refund.
                      8th Ledger verifies identity and fraud flags before transfer.
                    </div>
                  </div>
                </div>

                {/* Escrow timer */}
                {isEscrowActive && escrowExpiry && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Escrow Expires In</div>
                    <CountdownTimer expiresAt={escrowExpiry} />
                    <div className="mt-1 text-xs text-slate-500">Either party may flag for review during this period</div>
                  </div>
                )}

                {/* Below floor warning */}
                {isBelowFloorUnapproved && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <div>
                      <div className="text-sm font-semibold text-rose-300">Below Floor Price</div>
                      <div className="text-xs text-slate-400">
                        This listing is priced below the 8th Ledger Dynamic Valuation floor without hall approval.
                        Purchase requires a 51% hall vote to proceed.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "valuation" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">8th Ledger Dynamic Valuation</div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Asset Book Value (per 1%)</span>
                      <span className="font-mono text-slate-200">{formatCurrency(assetBookPerPercent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Accumulated Dividends (per 1%)</span>
                      <span className="font-mono text-emerald-400">+{formatCurrency(listing.accumulatedDividends || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">AHGI Premium ({listing.ahgiScore || 50})</span>
                      <span className="font-mono text-cyan-400">+{formatCurrency(ahgiPremium)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">SRI Bonus ({sriTier?.label || "SILVER"})</span>
                      <span className={cn("font-mono", sriBonus >= 0 ? "text-violet-400" : "text-red-400")}>
                        {sriBonus >= 0 ? "+" : "-"}{formatCurrency(Math.abs(sriBonus))}
                      </span>
                    </div>
                    {pirDebt > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">PIR Debt (per 1%)</span>
                        <span className="font-mono text-rose-400">-{formatCurrency(pirDebt)}</span>
                      </div>
                    )}
                    {ihcpDebt > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">IHCP Debt (per 1%)</span>
                        <span className="font-mono text-orange-400">-{formatCurrency(ihcpDebt)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-800/60 pt-3">
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-slate-200">Dynamic Floor (per 1%)</span>
                        <span className="font-bold text-cyan-400">{formatCurrency(listing.floorPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "rounded-xl border p-4",
                  isAboveFloor ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
                )}>
                  <div className="flex items-center gap-2">
                    {isAboveFloor ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
                    <span className={cn("text-sm font-semibold", isAboveFloor ? "text-emerald-400" : "text-rose-400")}>
                      {isAboveFloor ? "Above Floor" : "Below Floor"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {isAboveFloor
                      ? `Seller asks ${pricePremium.toFixed(1)}% above 8th Ledger Valuation. Market decides.`
                      : listing.belowFloorApproved
                        ? "Below floor approved by hall vote (51%)."
                        : "Below floor requires hall vote (51%). Protects against fire sales."}
                  </div>
                </div>

                {/* Price comparison bar */}
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>Floor: {formatCurrency(listing.floorPrice)}</span>
                    <span>Ask: {formatCurrency(listing.pricePerPercent)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, listing.floorPrice > 0 ? (listing.pricePerPercent / (listing.floorPrice * 1.5)) * 100 : 50)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn("h-full rounded-full", isAboveFloor ? "bg-cyan-500" : "bg-rose-500")}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "seller" && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-xl font-bold text-slate-400">
                    {listing.sellerDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-100">{listing.sellerDisplayName}</div>
                    <div className="font-mono text-xs text-slate-500">{listing.sellerLedgerId}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      KYC Tier: <span className="text-cyan-400">{listing.sellerKycTier}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Listing Metadata</div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Listing ID</span>
                      <span className="font-mono text-slate-300">{listing.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Listed</span>
                      <span className="text-slate-300">{new Date(listing.listedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Expires</span>
                      <span className="text-slate-300">{listing.expiresAt ? new Date(listing.expiresAt).toLocaleDateString() : "30 days"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Views</span>
                      <span className="text-slate-300">{listing.viewCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2"><Heart className="h-3.5 w-3.5" /> Interested</span>
                      <span className="text-slate-300">{listing.interestCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2">
                        {listing.isFractional ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        Sale Type
                      </span>
                      <span className="text-slate-300">{listing.isFractional ? "Fractional (2% fee)" : "Full (1% fee)"}</span>
                    </div>
                  </div>
                </div>

                {/* Audit hash */}
                {listing.auditHash && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-violet-400">
                      <Hash className="h-4 w-4" />
                      <span className="text-sm font-bold">Immutable Audit Hash</span>
                    </div>
                    <div className="font-mono text-xs text-violet-300 break-all">{listing.auditHash}</div>
                    <div className="mt-1 text-[10px] text-slate-500">Logged to audit trail. Permanent. Irreversible.</div>
                  </div>
                )}
              </div>
            )}

            {/* KYC Gate Warning */}
            {kycBlocked && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <div className="text-sm font-semibold text-amber-300">KYC Gate Locked</div>
                  <div className="text-xs text-slate-400">
                    Your KYC tier ({userKycTier}) is below the seller&apos;s requirement ({listing.sellerKycTier}).
                    Complete identity verification to unlock this listing.
                  </div>
                </div>
              </div>
            )}

            {!canAfford && !kycBlocked && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <div className="text-sm font-semibold text-rose-300">Insufficient Balance</div>
                  <div className="text-xs text-slate-400">
                    You need {formatCurrency(totalWithFee)} (including {listing.isFractional ? "2%" : "1%"} fee). Your balance: {formatCurrency(userLedgerBalance)}.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 border-t border-slate-800/60 bg-slate-950/95 px-6 py-4 backdrop-blur-xl">
            {!showConfirm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={kycBlocked || !canAfford || isBelowFloorUnapproved}
                  className={cn(
                    "flex-1 rounded-xl py-3 text-sm font-bold tracking-wider uppercase transition-all",
                    kycBlocked || !canAfford || isBelowFloorUnapproved
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                  )}
                >
                  {isBelowFloorUnapproved ? "HALL VOTE REQUIRED" : kycBlocked ? "KYC REQUIRED" : !canAfford ? "INSUFFICIENT FUNDS" : "INITIATE PURCHASE"}
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center text-xs text-slate-400">
                  You are purchasing <span className="text-cyan-400 font-semibold">{listing.percentListed}%</span> of{" "}
                  <span className="text-slate-200">{listing.hallName}</span> for{" "}
                  <span className="text-cyan-400 font-bold">{formatCurrency(totalWithFee)}</span> (includes {listing.isFractional ? "2%" : "1%"} fee)
                  <div className="mt-1 text-[10px] text-slate-500">
                    48-hour escrow protection. Cancel anytime for full refund.
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 py-3 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onBuy?.(listing.id)}
                    className="flex-1 rounded-xl bg-cyan-500 py-3 text-sm font-bold tracking-wider uppercase text-slate-950 transition-all hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                  >
                    Confirm & Pay
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default OwnershipDetail;