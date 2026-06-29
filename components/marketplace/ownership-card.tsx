// components/marketplace/ownership-card.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  Crown,
  Gem,
  ArrowRight,
  Percent,
  Wallet,
  Activity,
  Building2,
  AlertTriangle,
  Unlock,
  Hash,
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
  totalPrice: number; // cents = percentListed * pricePerPercent
  floorPrice: number; // cents = dynamic valuation floor
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
  // Hall-level (fetched with listing)
  hallSriTier?: "platinum" | "gold" | "silver" | "bronze" | "at_risk";
  hallSriScore?: number;
  ahgiScore?: number;
  monthlyDividendEstimate?: number; // cents
  accumulatedDividends?: number; // cents
  assetBookValue?: number; // cents
}

interface OwnershipCardProps {
  listing: OwnershipListingData;
  index?: number;
  onClick?: (listing: OwnershipListingData) => void;
  compact?: boolean;
}

const hallClassConfig = {
  I: { label: "CLASS I", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  II: { label: "CLASS II", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  III: { label: "CLASS III", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const sriTierConfig = {
  platinum: { icon: Crown, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", label: "PLATINUM" },
  gold: { icon: Gem, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "GOLD" },
  silver: { icon: Shield, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "SILVER" },
  bronze: { icon: Shield, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "BRONZE" },
  at_risk: { icon: Activity, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "AT RISK" },
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

function getHoursRemaining(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 ? Math.round(diff / (1000 * 60 * 60)) : 0;
}

export function OwnershipCard({ listing, index = 0, onClick, compact = false }: OwnershipCardProps) {
  const hallClass = hallClassConfig[listing.hallClass];
  const sriTier = listing.hallSriTier ? sriTierConfig[listing.hallSriTier] : null;
  const SRIIcon = sriTier?.icon || Shield;

  const pricePremium = listing.floorPrice > 0
    ? ((listing.pricePerPercent / listing.floorPrice) - 1) * 100
    : 0;
  const isAboveFloor = listing.pricePerPercent >= listing.floorPrice;
  const isBelowFloorUnapproved = !isAboveFloor && !listing.belowFloorApproved;

  const feePercent = listing.isFractional ? 2 : 1;
  const feeAmount = Math.round(listing.totalPrice * (feePercent / 100));
  const sellerReceives = listing.totalPrice - feeAmount;

  const daysRemaining = listing.expiresAt
    ? Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const escrowHoursLeft = getHoursRemaining(listing.escrowExpiresAt);
  const isEscrowActive = listing.status === "pending" && escrowHoursLeft !== null && escrowHoursLeft > 0;

  const verticalEmoji = verticalEmojiMap[listing.verticalId] || "📦";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35 }}
        onClick={() => onClick?.(listing)}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300",
          "bg-slate-900/60 border-slate-700/40 hover:border-cyan-500/40 hover:bg-slate-800/60",
          listing.isFeatured && "border-cyan-500/30 ring-1 ring-cyan-500/10",
          isBelowFloorUnapproved && "border-rose-500/30"
        )}
      >
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">
            {verticalEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-100">{listing.hallName}</span>
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider", hallClass.bg, hallClass.color)}>
                {listing.hallClass}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{listing.countryFlag} {listing.country}</span>
              <span className="text-slate-600">|</span>
              <span>{listing.percentListed}% listed</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-cyan-400">{formatDollar(listing.totalPrice)}</div>
            <div className="text-[10px] text-slate-500">{formatCurrency(listing.pricePerPercent)}/%</div>
            {isBelowFloorUnapproved && (
              <div className="text-[10px] text-rose-400 flex items-center justify-end gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                Below floor
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      onClick={() => onClick?.(listing)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500",
        "bg-slate-950/70 border-slate-800/60 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-900/10",
        listing.isFeatured && "border-cyan-500/40 ring-1 ring-cyan-500/20",
        isBelowFloorUnapproved && "border-rose-500/30"
      )}
    >
      {listing.isFeatured && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />
      )}

      {/* Top bar */}
      <div className="relative flex items-center justify-between border-b border-slate-800/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/80 text-lg shadow-inner">
            {verticalEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">HALL</span>
              <span className="font-mono text-xs text-cyan-400">#{listing.hallId.slice(-4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">{listing.hallName}</span>
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider border", hallClass.bg, hallClass.color, hallClass.border)}>
                {hallClass.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sriTier && (
            <span className={cn("flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wider border", sriTier.bg, sriTier.color, sriTier.border)}>
              <SRIIcon className="h-3 w-3" />
              {sriTier.label}
            </span>
          )}
          <span className="text-xs font-mono text-slate-500">{listing.countryFlag} {listing.country}</span>
        </div>
      </div>

      <div className="relative p-5">
        {/* Seller row */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
            {listing.sellerDisplayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-slate-300">{listing.sellerDisplayName}</span>
              <span className="font-mono text-[10px] text-slate-600">{listing.sellerLedgerId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                KYC: {listing.sellerKycTier}
              </span>
              {listing.isFractional && (
                <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-400 border border-violet-500/20">
                  FRACTIONAL · {feePercent}% FEE
                </span>
              )}
              {!listing.isFractional && (
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                  FULL · {feePercent}% FEE
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Listed</div>
            <div className="text-xs font-mono text-slate-400">{new Date(listing.listedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <Percent className="h-3 w-3" />
              Listed
            </div>
            <div className="text-lg font-bold text-slate-100">{listing.percentListed.toFixed(1)}%</div>
            <div className="text-[10px] text-slate-500">of ownership</div>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <Wallet className="h-3 w-3" />
              Floor
            </div>
            <div className="text-lg font-bold text-cyan-400">{formatCurrency(listing.floorPrice)}</div>
            <div className="text-[10px] text-slate-500">per 1%</div>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <Building2 className="h-3 w-3" />
              AHGI
            </div>
            <div className={cn(
              "text-lg font-bold",
              (listing.ahgiScore || 50) >= 80 ? "text-emerald-400" :
              (listing.ahgiScore || 50) >= 60 ? "text-cyan-400" :
              (listing.ahgiScore || 50) >= 40 ? "text-amber-400" : "text-red-400"
            )}>
              {listing.ahgiScore || 50}
            </div>
            <div className="text-[10px] text-slate-500">health score</div>
          </div>
        </div>

        {/* Price block */}
        <div className="mb-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Asking Price</div>
              <div className="text-2xl font-bold text-slate-50">{formatDollar(listing.totalPrice)}</div>
              <div className="text-xs text-slate-400">{formatCurrency(listing.pricePerPercent)} per 1%</div>
            </div>
            <div className="text-right">
              <div className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold",
                isAboveFloor ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
              )}>
                {isAboveFloor ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {isAboveFloor ? "+" : ""}{pricePremium.toFixed(1)}%
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                vs 8th Ledger Valuation
              </div>
            </div>
          </div>

          {/* Below floor warning */}
          {isBelowFloorUnapproved && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <div className="text-xs text-rose-300">
                Listed below floor price without hall approval. Purchase requires 51% hall vote.
              </div>
            </div>
          )}

          {listing.belowFloorApproved && !isAboveFloor && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
              <Unlock className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-300">
                Below floor price approved by hall vote (51%).
              </div>
            </div>
          )}

          {/* Price bar */}
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-slate-500">
              <span>Floor: {formatCurrency(listing.floorPrice)}</span>
              <span>Ask: {formatCurrency(listing.pricePerPercent)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, listing.floorPrice > 0 ? (listing.pricePerPercent / (listing.floorPrice * 1.5)) * 100 : 50)}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  isAboveFloor ? "bg-cyan-500" : "bg-rose-500"
                )}
              />
            </div>
          </div>
        </div>

        {/* Fee preview */}
        <div className="mb-4 rounded-xl border border-slate-800/40 bg-slate-900/20 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">8th Ledger Fee ({feePercent}%)</span>
            <span className="font-mono text-cyan-400">{formatCurrency(feeAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">Seller Receives</span>
            <span className="font-mono text-emerald-400">{formatCurrency(sellerReceives)}</span>
          </div>
        </div>

        {/* Escrow timer */}
        {isEscrowActive && (
          <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 flex items-center gap-3">
            <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-medium text-cyan-300">48-Hour Escrow Active</div>
              <div className="text-[10px] text-slate-400">
                {escrowHoursLeft} hours remaining. Either party may flag for review.
              </div>
            </div>
          </div>
        )}

        {/* Audit hash */}
        {listing.auditHash && (
          <div className="mb-4 rounded-xl border border-violet-500/10 bg-violet-500/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] text-violet-400 font-medium">Audit Hash</span>
            </div>
            <div className="font-mono text-[10px] text-violet-300 break-all">
              {listing.auditHash}
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{daysRemaining > 0 ? `${daysRemaining}d remaining` : "Expired"}</span>
            </div>
            <div className="text-xs text-slate-500">
              {listing.viewCount} views · {listing.interestCount} interested
            </div>
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300"
          >
            View Listing
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default OwnershipCard;