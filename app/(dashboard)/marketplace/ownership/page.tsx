// app/(dashboard)/marketplace/ownership/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Crown, Gem, Shield, MapPin, X, Loader2, ShoppingBag, Landmark, Clock, CheckCircle2,
  AlertTriangle, Lock, Hash, TrendingUp, Percent, Eye,
  ArrowRight, ChevronRight, BadgeCheck,
  Home, Car, GraduationCap, Lock as LockIcon, Stethoscope,
  Briefcase, Plane, Sprout, Sun, Wifi, Swords, Activity, ArrowUpRight, ArrowDownRight, Diamond, Receipt, User,
  ShieldCheck, Layers, Copy, Check, Banknote,
  PlusCircle, Tag, Store,
} from "lucide-react";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function safeStr(val: any, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

function safeNum(val: any, fallback = 0): number {
  return typeof val === "number" && !isNaN(val) ? val : fallback;
}

function formatTimeRemaining(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

/* ============================================================
   TYPES
   ============================================================ */
interface OwnershipListingData {
  id: string;
  ownershipId: string;
  hallId: string;
  hallName?: string;
  hallClass?: string;
  hallClosureStatus?: string;
  verticalId?: string;
  verticalName?: string;
  country?: string;
  sellerId?: string;
  sellerLedgerId?: string;
  sellerDisplayName?: string;
  sellerKycTier?: string;
  percentListed?: number;
  pricePerPercent?: number;
  totalPrice?: number;
  floorPrice?: number;
  dynamicValuationPerPercent?: number;
  status?: "active" | "sold" | "cancelled" | "expired";
  listedAt?: string;
  expiresAt?: string;
  sriScore?: number;
  sriTier?: string;
  ahgiScore?: number;
  monthlyDividendEstimate?: number;
  accumulatedDividends?: number;
  assetBookValue?: number;
  views?: number;
  interestCount?: number;
  isFeatured?: boolean;
  isFractional?: boolean;
  belowFloorApproved?: boolean;
  assetImage?: string;
}

interface UserOwnership {
  id: string;
  ownershipId: string;
  hallId: string;
  hallName: string;
  verticalId: string;
  ownershipPercent: number;
  dynamicValue: number;
  accumulatedDividends: number;
  pacToken: string;
  status: string;
  hallClass?: string;
  sriScore?: number;
  ahgiScore?: number;
  assetBookValue?: number;
  imageUrl?: string;
}

interface CreateListingInput {
  ownershipId: string;
  hallId: string;
  percentListed: number;
  pricePerPercent: number;
  expiresAt?: string;
}

/* ============================================================
   CONFIG
   ============================================================ */
const SRI_TIERS = [
  { key: "all", label: "All", icon: Shield, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", ring: "ring-slate-500/30" },
  { key: "platinum", label: "Platinum", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", ring: "ring-amber-500/30" },
  { key: "gold", label: "Gold", icon: Gem, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", ring: "ring-yellow-500/30" },
  { key: "silver", label: "Silver", icon: Shield, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20", ring: "ring-slate-400/30" },
  { key: "bronze", label: "Bronze", icon: Shield, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", ring: "ring-orange-500/30" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" },
  { key: "sri_high", label: "SRI Score" },
  { key: "ahgi_high", label: "AHGI Health" },
  { key: "dividend_high", label: "Dividend Yield" },
];

const VERTICALS = [
  { id: "all", name: "All", icon: Landmark, color: "text-slate-400" },
  { id: "ledgerprop", name: "Prop", icon: Home, color: "text-amber-400" },
  { id: "ledgerauto", name: "Auto", icon: Car, color: "text-cyan-400" },
  { id: "ledgertech", name: "Tech", icon: Wifi, color: "text-indigo-400" },
  { id: "ledgeredu", name: "Edu", icon: GraduationCap, color: "text-violet-400" },
  { id: "ledgerhealth", name: "Health", icon: Stethoscope, color: "text-rose-400" },
  { id: "ledgerbiz", name: "Biz", icon: Briefcase, color: "text-orange-400" },
  { id: "ledgertravel", name: "Travel", icon: Plane, color: "text-sky-400" },
  { id: "ledgeragri", name: "Agri", icon: Sprout, color: "text-green-400" },
  { id: "ledgerenergy", name: "Energy", icon: Sun, color: "text-yellow-400" },
  { id: "ledgeraccess", name: "Access", icon: LockIcon, color: "text-emerald-400" },
  { id: "ledgersport", name: "Sport", icon: Swords, color: "text-fuchsia-400" },
];

const VERTICAL_META: Record<string, { color: string; bg: string; border: string; gradient: string; emoji: string }> = {
  ledgerprop:   { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  gradient: "from-amber-500/20 to-orange-500/5",  emoji: "🏛" },
  ledgerauto:   { color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   gradient: "from-cyan-500/20 to-blue-500/5",   emoji: "🚗" },
  ledgertech:   { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/20 to-violet-500/5", emoji: "💻" },
  ledgeredu:    { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/20 to-purple-500/5", emoji: "🎓" },
  ledgerhealth: { color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20",   gradient: "from-rose-500/20 to-red-500/5",   emoji: "🏥" },
  ledgerbiz:    { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/20 to-amber-500/5", emoji: "💼" },
  ledgertravel: { color: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/20",    gradient: "from-sky-500/20 to-cyan-500/5",    emoji: "✈️" },
  ledgeragri:   { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20",  gradient: "from-green-500/20 to-emerald-500/5", emoji: "🌿" },
  ledgerenergy: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/20 to-amber-500/5", emoji: "⚡" },
  ledgeraccess: { color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",gradient: "from-emerald-500/20 to-teal-500/5", emoji: "🔧" },
  ledgersport:  { color: "text-fuchsia-400",   bg: "bg-fuchsia-500/10",   border: "border-fuchsia-500/20",   gradient: "from-fuchsia-500/20 to-pink-500/5",   emoji: "⚽" },
};

const KYC_TIER_RANK: Record<string, number> = { visitor: 0, sovereign: 1, verified: 2, whale: 3 };

/* ============================================================
   SRI RING
   ============================================================ */
function SriRing({ score, tier, size = 36 }: { score?: number; tier?: string; size?: number }) {
  const s = safeNum(score, 50);
  const circumference = 2 * Math.PI * (size / 2 - 3);
  const strokeDashoffset = circumference - (s / 100) * circumference;
  const tierConfig = SRI_TIERS.find(t => t.key === (tier || "all")) || SRI_TIERS[0];
  const Icon = tierConfig.icon;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 3} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={size / 2 - 3} fill="none"
          stroke={s >= 90 ? "#fbbf24" : s >= 75 ? "#f59e0b" : s >= 60 ? "#94a3b8" : s >= 40 ? "#f97316" : "#ef4444"}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className={cn("h-3 w-3", tierConfig.color)} />
      </div>
    </div>
  );
}

/* ============================================================
   AHGI BAR
   ============================================================ */
function AhgiBar({ score }: { score?: number }) {
  const s = safeNum(score, 50);
  let color = "bg-emerald-500";
  let textColor = "text-emerald-400";
  if (s < 20) { color = "bg-rose-500"; textColor = "text-rose-400"; }
  else if (s < 40) { color = "bg-orange-500"; textColor = "text-orange-400"; }
  else if (s < 60) { color = "bg-amber-500"; textColor = "text-amber-400"; }
  else if (s < 80) { color = "bg-cyan-500"; textColor = "text-cyan-400"; }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${s}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className={cn("text-[10px] font-bold font-mono", textColor)}>{s}</span>
    </div>
  );
}

/* ============================================================
   GLOW CARD
   ============================================================ */
function GlowCard({ children, className = "", accent = "cyan" }: { children: React.ReactNode; className?: string; accent?: string }) {
  const map: Record<string, string> = {
    cyan: "from-cyan-500/10 to-blue-500/5 border-cyan-500/15 hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.06)]",
    amber: "from-amber-500/10 to-yellow-500/5 border-amber-500/15 hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(245,158,11,0.06)]",
    emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-500/15 hover:border-emerald-500/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.06)]",
    violet: "from-violet-500/10 to-purple-500/5 border-violet-500/15 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.06)]",
    rose: "from-rose-500/10 to-red-500/5 border-rose-500/15 hover:border-rose-500/30 hover:shadow-[0_0_40px_rgba(244,63,94,0.06)]",
    slate: "from-white/5 to-white/[0.02] border-white/10 hover:border-white/20",
  };
  return (
    <div className={cn("relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-500 hover:scale-[1.01]", map[accent] || map.cyan, className)}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ============================================================
   LISTING CARD
   ============================================================ */
function ListingCard({ listing, index, onClick, userTier }: { listing: OwnershipListingData; index: number; onClick: (l: OwnershipListingData) => void; userTier?: string }) {
  const vId = safeStr(listing.verticalId, "ledgerprop").toLowerCase();
  const meta = VERTICAL_META[vId] || VERTICAL_META.ledgerprop;
  const vName = safeStr(listing.verticalName, "LedgerProp");
  const hName = safeStr(listing.hallName, "Unknown Hall");
  const hClass = safeStr(listing.hallClass, "I");
  const country = safeStr(listing.country, "Unknown");
  const sellerName = safeStr(listing.sellerDisplayName, "Unknown");
  const sriScore = safeNum(listing.sriScore);
  const ahgiScore = safeNum(listing.ahgiScore);
  const pricePer = safeNum(listing.pricePerPercent);
  const dynVal = safeNum(listing.dynamicValuationPerPercent);
  const percentListed = safeNum(listing.percentListed);
  const totalPrice = safeNum(listing.totalPrice);
  const monthlyDiv = safeNum(listing.monthlyDividendEstimate);
  const assetVal = safeNum(listing.assetBookValue);
  const views = safeNum(listing.views);
  const aboveFloor = pricePer > dynVal;
  const floorDiff = dynVal > 0 ? Math.round((pricePer / dynVal - 1) * 100) : 0;
  const VerticalIcon = VERTICALS.find((v) => v.id === vId)?.icon || Landmark;
  const isExpired = listing.expiresAt ? new Date(listing.expiresAt) < new Date() : false;
  const timeLeft = listing.expiresAt ? formatTimeRemaining(listing.expiresAt) : "";
  const buyerRank = KYC_TIER_RANK[userTier || "visitor"] || 0;
  const sellerRank = KYC_TIER_RANK[listing.sellerKycTier || "visitor"] || 0;
  const isEligible = buyerRank >= sellerRank;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={() => onClick(listing)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1",
        listing.isFeatured
          ? "border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 to-[#0a0a14] shadow-lg shadow-cyan-500/5"
          : "border-white/[0.06] bg-[#0a0a12]/80 hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/40"
      )}
    >
      {listing.isFeatured && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 z-20" />}
      {listing.hallClosureStatus && listing.hallClosureStatus !== "active" && <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500 z-20" />}

      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={listing.assetImage || `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600`}
          alt={hName}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/60 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider backdrop-blur-md", meta.bg, meta.border, meta.color)}>
            <VerticalIcon className="h-3 w-3" />
            {vName}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white/70">
            <MapPin className="h-3 w-3" />
            {country}
          </span>
          {listing.isFractional && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 text-[10px] font-bold text-cyan-400">
              <Layers className="h-3 w-3" />
              Fractional
            </span>
          )}
          {listing.belowFloorApproved && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 backdrop-blur-md border border-rose-500/20 text-[10px] font-bold text-rose-400">
              <ArrowDownRight className="h-3 w-3" />
              Below Floor
            </span>
          )}
          {listing.hallClosureStatus && listing.hallClosureStatus !== "active" && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 backdrop-blur-md border border-rose-500/20 text-[10px] font-bold text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              {listing.hallClosureStatus}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
            <Clock className="h-3 w-3 text-white/50" />
            <span className="text-[10px] font-mono text-white/60">{isExpired ? "Expired" : timeLeft}</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">{hName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-white/40 font-mono">Class {hClass}</span>
                <span className="w-px h-3 bg-white/10" />
                <span className="text-[10px] text-white/40 font-mono">{percentListed}% Listed</span>
              </div>
            </div>
            <SriRing score={sriScore} tier={listing.sriTier} size={32} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-0.5">Ask Price</p>
            <p className="text-xl font-black text-white tracking-tight">{formatCurrency(totalPrice)}</p>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">{formatCurrency(pricePer)} per 1%</p>
          </div>
          <div className="text-right">
            <div className={cn("flex items-center gap-1 text-[11px] font-bold", aboveFloor ? "text-emerald-400" : "text-rose-400")}>
              {aboveFloor ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {aboveFloor ? "+" : ""}{floorDiff}% floor
            </div>
            <p className="text-[10px] text-white/25 font-mono mt-0.5">Floor: {formatCurrency(dynVal)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-white/20" />
              <span className="text-[9px] text-white/25 uppercase tracking-wider font-semibold">AHGI</span>
            </div>
            <AhgiBar score={ahgiScore} />
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-1 mb-1">
              <Banknote className="h-3 w-3 text-emerald-500/40" />
              <span className="text-[9px] text-white/25 uppercase tracking-wider font-semibold">Monthly</span>
            </div>
            <p className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(monthlyDiv)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-1 mb-1">
              <Diamond className="h-3 w-3 text-white/20" />
              <span className="text-[9px] text-white/25 uppercase tracking-wider font-semibold">Asset</span>
            </div>
            <p className="text-xs font-bold text-white/70 font-mono">{formatCurrency(assetVal)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400">{sellerName.charAt(0) || "?"}</span>
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/50">{sellerName}</p>
              <div className="flex items-center gap-1">
                <BadgeCheck className={cn("h-2.5 w-2.5", isEligible ? "text-cyan-500/50" : "text-rose-500/50")} />
                <span className="text-[9px] text-white/20 font-mono uppercase">{listing.sellerKycTier || "Visitor"}</span>
                {!isEligible && <span className="text-[9px] text-rose-400/60">• Ineligible</span>}
              </div>
            </div>
          </div>
          {views > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-white/20">
              <Eye className="h-3 w-3" />
              <span className="font-mono">{views}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   DETAIL MODAL — 3 STEP FLOW
   ============================================================ */
function ListingDetail({
  listing,
  onClose,
  onBuy,
  userKycTier,
  userLedgerId,
  userBalance,
}: {
  listing: OwnershipListingData;
  onClose: () => void;
  onBuy: (id: string) => void;
  userKycTier?: string;
  userLedgerId?: string;
  userBalance?: number;
}) {
  const [step, setStep] = useState<"review" | "kyc" | "confirm" | "processing" | "success">("review");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const vId = safeStr(listing.verticalId, "ledgerprop").toLowerCase();
  const meta = VERTICAL_META[vId] || VERTICAL_META.ledgerprop;
  const vName = safeStr(listing.verticalName, "Unknown");
  const hName = safeStr(listing.hallName, "Unknown Hall");
  const hClass = safeStr(listing.hallClass, "I");
  const country = safeStr(listing.country, "Unknown");
  const sellerName = safeStr(listing.sellerDisplayName, "Unknown");
  const sellerId = safeStr(listing.sellerLedgerId, "???");
  const sellerKyc = safeStr(listing.sellerKycTier, "visitor");
  const sriScore = safeNum(listing.sriScore);
  const ahgiScore = safeNum(listing.ahgiScore);
  const pricePer = safeNum(listing.pricePerPercent);
  const dynVal = safeNum(listing.dynamicValuationPerPercent);
  const percentListed = safeNum(listing.percentListed);
  const totalPrice = safeNum(listing.totalPrice);
  const monthlyDiv = safeNum(listing.monthlyDividendEstimate);
  const assetVal = safeNum(listing.assetBookValue);
  const accDiv = safeNum(listing.accumulatedDividends);

  const canBuy = !!userKycTier && userKycTier !== "visitor";
  const buyerRank = KYC_TIER_RANK[userKycTier || "visitor"] || 0;
  const sellerRank = KYC_TIER_RANK[sellerKyc] || 0;
  const kycBlocked = buyerRank < sellerRank;

  const aboveFloor = pricePer > dynVal;
  const fee = Math.floor(totalPrice * (percentListed >= 100 ? 0.01 : 0.02));
  const totalWithFee = totalPrice + fee;
  const yieldPct = assetVal > 0 ? ((monthlyDiv * 12) / assetVal) * 100 : 0;

  const handleBuyClick = () => {
    setError("");
    if (!canBuy) { setStep("kyc"); return; }
    if (kycBlocked) { setError(`Your KYC tier (${userKycTier}) is below the seller's required tier (${sellerKyc}).`); return; }
    if ((userBalance || 0) < totalWithFee) { setError("Insufficient balance. Deposit funds to continue."); return; }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("processing");
    setError("");
    try {
      const res = await fetch(`/api/marketplace/ownership/${listing.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setStep("success");
        setTimeout(() => { onBuy(listing.id); onClose(); }, 2000);
      } else {
        setError(data.error || "Purchase failed");
        setStep("confirm");
      }
    } catch {
      setError("Network error. Try again.");
      setStep("confirm");
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(listing.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepIndicator = [
    { key: "review", label: "Review", icon: Eye },
    { key: "confirm", label: "Confirm", icon: CheckCircle2 },
    { key: "success", label: "Complete", icon: ShieldCheck },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0a0a12] shadow-2xl shadow-black/50"
      >
        <div className="relative h-52 w-full overflow-hidden">
          <img
            src={listing.assetImage || `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800`}
            alt={hName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/50 to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider backdrop-blur-md", meta.bg, meta.border, meta.color)}>
              {meta.emoji} {vName}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white/70">
              Class {hClass}
            </span>
            {listing.isFractional && (
              <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 text-[11px] font-bold text-cyan-400">
                <Layers className="h-3 w-3 inline mr-1" />
                Fractional
              </span>
            )}
            {listing.belowFloorApproved && (
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 backdrop-blur-md border border-rose-500/20 text-[11px] font-bold text-rose-400">
                Below Floor (Hall Approved)
              </span>
            )}
            {listing.hallClosureStatus && listing.hallClosureStatus !== "active" && (
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 backdrop-blur-md border border-rose-500/20 text-[11px] font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {listing.hallClosureStatus}
              </span>
            )}
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/60 transition-all">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white mb-1">{hName}</h2>
            <div className="flex items-center gap-3 text-[11px] text-white/40 font-mono">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {country}</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {listing.id.slice(0, 8)}</span>
              <button onClick={copyId} className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            {stepIndicator.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.key || (step === "processing" && s.key === "confirm") || (step === "kyc" && s.key === "review");
              const isDone = step === "success" || (step === "processing" && s.key === "review") || (step === "confirm" && s.key === "review");
              return (
                <React.Fragment key={s.key}>
                  <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all", 
                    isDone ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    isActive ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                    "bg-white/[0.02] text-white/20 border border-white/[0.04]"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </div>
                  {i < stepIndicator.length - 1 && <ChevronRight className="h-3 w-3 text-white/10" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {step === "review" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <GlowCard accent="amber" className="!p-4">
                  <div className="flex items-center gap-3">
                    <SriRing score={sriScore} tier={listing.sriTier} size={44} />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">SRI Score</p>
                      <p className="text-lg font-bold text-white">{sriScore}<span className="text-white/30 text-sm">/100</span></p>
                      <p className="text-[10px] text-amber-400/60">{listing.sriTier || "Unrated"} Tier</p>
                    </div>
                  </div>
                </GlowCard>
                <GlowCard accent="emerald" className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">AHGI Health</p>
                      <p className="text-lg font-bold text-white">{ahgiScore}<span className="text-white/30 text-sm">/100</span></p>
                      <p className="text-[10px] text-emerald-400/60">{ahgiScore >= 80 ? "Thriving" : ahgiScore >= 60 ? "Healthy" : "Review Needed"}</p>
                    </div>
                  </div>
                </GlowCard>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Ownership Listed</p>
                    <p className="text-3xl font-black text-white">{percentListed}<span className="text-xl text-white/40">%</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">Total Price</p>
                    <p className="text-3xl font-black text-white">{formatCurrency(totalPrice)}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">8th Ledger Floor (per 1%)</span>
                    <span className="text-white/70 font-mono">{formatCurrency(dynVal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Seller Ask (per 1%)</span>
                    <span className="text-white font-mono">{formatCurrency(pricePer)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Premium to Floor</span>
                    <span className={cn("font-bold", aboveFloor ? "text-emerald-400" : "text-rose-400")}>
                      {aboveFloor ? "+" : ""}{formatCurrency(pricePer - dynVal)} ({aboveFloor ? "+" : ""}{dynVal > 0 ? Math.round((pricePer / dynVal - 1) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">8th Ledger Fee ({percentListed >= 100 ? "1%" : "2%"})</span>
                    <span className="text-white/70 font-mono">{formatCurrency(fee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold pt-3 border-t border-white/[0.06]">
                    <span className="text-white">Total with Fee</span>
                    <span className="text-cyan-400 font-mono">{formatCurrency(totalWithFee)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Asset Value", value: formatCurrency(assetVal), icon: Diamond, color: "text-white" },
                  { label: "Monthly Div", value: formatCurrency(monthlyDiv), icon: Banknote, color: "text-emerald-400" },
                  { label: "Est. Yield", value: `${yieldPct.toFixed(1)}%`, icon: Percent, color: "text-amber-400" },
                  { label: "Lifetime Earned", value: formatCurrency(accDiv), icon: TrendingUp, color: "text-cyan-400" },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                    <stat.icon className={cn("h-4 w-4 mx-auto mb-1.5", stat.color)} />
                    <p className="text-xs font-bold font-mono text-white">{stat.value}</p>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">Seller</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-400">{sellerName.charAt(0) || "?"}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{sellerName}</p>
                    <p className="text-[10px] text-white/30 font-mono">{sellerId}</p>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                    sellerKyc === "whale" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    sellerKyc === "verified" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  )}>
                    {sellerKyc}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03]">
                <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-cyan-300 mb-1">48-Hour Escrow Protection</p>
                  <p className="text-xs text-cyan-400/60 leading-relaxed">
                    Funds held in escrow. Either party may flag for review. Ownership transfers instantly upon release. 
                    KYC tier must match or exceed seller's tier.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleBuyClick}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                Proceed to Purchase
              </button>
            </>
          )}

          {step === "kyc" && (
            <div className="py-8 text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">KYC Verification Required</h3>
                <p className="text-sm text-white/40 max-w-sm mx-auto">
                  Complete Sovereign Identity Verification (SIV) to purchase ownership on the 8th Ledger Exchange.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep("review")} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white hover:border-white/20 transition-all">
                  Back
                </button>
                <button className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-all">
                  Go to KYC
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-5">
                <h3 className="text-sm font-bold text-cyan-300 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Purchase
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/40">
                    <span>Asset</span>
                    <span className="text-white/70">{hName}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Ownership</span>
                    <span className="text-white font-bold">{percentListed}%</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Price</span>
                    <span className="text-white font-mono">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Fee</span>
                    <span className="text-white/70 font-mono">{formatCurrency(fee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-3 border-t border-cyan-500/10">
                    <span className="text-white">Total</span>
                    <span className="text-cyan-400 font-mono">{formatCurrency(totalWithFee)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <Receipt className="h-5 w-5 text-white/30 shrink-0" />
                <div className="text-xs text-white/40 leading-relaxed">
                  By confirming, you agree to the 8th Ledger Exchange terms. Ownership transfers are final after escrow release. 
                  You will receive a PAC token and immediate hall access.
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep("review")} className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/40 text-sm font-semibold hover:text-white hover:border-white/20 transition-all">
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-12 text-center space-y-4">
              <div className="relative h-16 w-16 mx-auto">
                <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
                <div className="absolute inset-2 h-12 w-12 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-400" style={{ animationDirection: "reverse", animationDuration: "1.2s" }} />
              </div>
              <h3 className="text-lg font-bold text-white">Processing Purchase</h3>
              <p className="text-sm text-white/40">Escrow initiated. Ownership transfer in progress.</p>
              <p className="text-xs text-white/20 font-mono">Do not close this window</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Purchase Complete</h3>
              <p className="text-sm text-white/40">You now own {percentListed}% of {hName}.</p>
              <p className="text-xs text-emerald-400/60 font-mono">PAC token issued. Hall access granted.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   MY PACs MODAL — Choose which PAC to list
   ============================================================ */
function MyPacsModal({
  open,
  onClose,
  onSelectPac,
}: {
  open: boolean;
  onClose: () => void;
  onSelectPac: (pac: UserOwnership) => void;
}) {
  const { data, error, isLoading } = useSWR<{ positions?: UserOwnership[] }>(
    open ? "/api/positions" : null,
    fetcher
  );

  const positions = data?.positions || [];

  const activePacs = positions.filter((p) => p.status === "active" && p.ownershipPercent > 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0a0a12] shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/[0.06] bg-[#0a0a12]/95 backdrop-blur-xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Store className="h-5 w-5 text-cyan-500" />
                  List Your PAC
                </h2>
                <p className="text-xs text-white/40 mt-1">Select an ownership to list on the 8th Ledger Exchange</p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-10 w-10 text-rose-400/50 mx-auto mb-3" />
                  <p className="text-sm text-rose-400">Failed to load your ownerships</p>
                </div>
              ) : activePacs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <Landmark className="h-8 w-8 text-white/10" />
                  </div>
                  <p className="text-white/40 font-medium">No Active Ownerships</p>
                  <p className="text-xs text-white/20 mt-1 max-w-sm mx-auto">
                    You don't own any PACs yet. Commit to a pool and wait for it to fill to receive ownership.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-white/20 uppercase tracking-wider font-semibold">
                    {activePacs.length} ownership{activePacs.length !== 1 ? "s" : ""} available
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePacs.map((pac, i) => {
                      const vId = safeStr(pac.verticalId, "ledgerprop").toLowerCase();
                      const meta = VERTICAL_META[vId] || VERTICAL_META.ledgerprop;
                      const VerticalIcon = VERTICALS.find((v) => v.id === vId)?.icon || Landmark;

                      return (
                        <motion.div
                          key={pac.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] transition-all cursor-pointer"
                          onClick={() => onSelectPac(pac)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                              <span className="text-lg">{meta.emoji}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-white truncate">{pac.hallName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider", meta.color)}>
                                  <VerticalIcon className="h-3 w-3" />
                                  {vId.replace("ledger", "")}
                                </span>
                                <span className="text-[10px] text-white/20">Class {pac.hallClass || "I"}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-black text-cyan-400">{pac.ownershipPercent}%</p>
                              <p className="text-[10px] text-white/30 font-mono">owned</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/[0.04]">
                            <div>
                              <p className="text-[9px] text-white/20 uppercase tracking-wider">Dynamic Value</p>
                              <p className="text-xs font-bold text-white font-mono mt-0.5">${formatCompact(pac.dynamicValue)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-white/20 uppercase tracking-wider">Lifetime Earned</p>
                              <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">${formatCompact(pac.accumulatedDividends)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-white/20 uppercase tracking-wider">PAC Token</p>
                              <p className="text-xs font-bold text-white/50 font-mono mt-0.5 truncate">{pac.pacToken?.slice(0, 8) || "—"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <div className="flex-1 flex items-center gap-1.5">
                              <SriRing score={pac.sriScore} size={24} />
                              <span className="text-[10px] text-white/30 font-mono">SRI {pac.sriScore || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Activity className="h-3 w-3 text-emerald-500/40" />
                              <span className="text-[10px] text-white/30 font-mono">AHGI {pac.ahgiScore || "—"}</span>
                            </div>
                          </div>

                          <button className="w-full mt-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2">
                            <Tag className="h-3.5 w-3.5" />
                            List for Sale
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   LIST PAC FORM — Create the listing
   ============================================================ */
function ListPacForm({
  pac,
  open,
  onClose,
  onListed,
}: {
  pac: UserOwnership | null;
  open: boolean;
  onClose: () => void;
  onListed: () => void;
}) {
  const [percentListed, setPercentListed] = useState("");
  const [pricePerPercent, setPricePerPercent] = useState("");
  const [expiresDays, setExpiresDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!pac) return null;

  const maxPercent = pac.ownershipPercent;
  const dynVal = pac.dynamicValue / (pac.ownershipPercent || 1); // per 1%
  const askPrice = parseFloat(pricePerPercent || "0");
  const listPct = parseFloat(percentListed || "0");
  const totalPrice = askPrice * listPct;
  const isBelowFloor = askPrice > 0 && askPrice < dynVal;
  const fee = listPct >= 100 ? totalPrice * 0.01 : totalPrice * 0.02;

  const handleSubmit = async () => {
    if (!listPct || listPct <= 0 || listPct > maxPercent) {
      setError(`You can only list up to ${maxPercent}%`);
      return;
    }
    if (!askPrice || askPrice <= 0) {
      setError("Set a price per 1%");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/marketplace/ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ownershipId: pac.ownershipId,
          hallId: pac.hallId,
          percentListed: listPct,
          pricePerPercent: askPrice,
          expiresAt: expiresDays ? new Date(Date.now() + parseInt(expiresDays) * 86400000).toISOString() : undefined,
        } as CreateListingInput),
      });

      const data = await res.json();
      if (res.ok) {
        onListed();
        onClose();
      } else {
        setError(data.error || data.message || "Failed to create listing");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0a0a12] shadow-2xl shadow-black/50"
          >
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-cyan-500" />
                List PAC for Sale
              </h2>
              <p className="text-xs text-white/40 mt-1">{pac.hallName} — You own {pac.ownershipPercent}%</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Dynamic Valuation Reference */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-3">8th Ledger Reference</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Your Ownership</span>
                    <span className="text-white font-bold">{pac.ownershipPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Dynamic Value (per 1%)</span>
                    <span className="text-emerald-400 font-mono">${formatCurrency(dynVal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Your Total Value</span>
                    <span className="text-white font-mono">${formatCurrency(pac.dynamicValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Lifetime Dividends</span>
                    <span className="text-cyan-400 font-mono">${formatCurrency(pac.accumulatedDividends)}</span>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 font-semibold mb-1.5 block">Percent to List (max {maxPercent}%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={maxPercent}
                    value={percentListed}
                    onChange={(e) => setPercentListed(e.target.value)}
                    placeholder="e.g., 2.5"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 px-4 text-sm text-white placeholder:text-white/15 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  {listPct > maxPercent && <p className="text-xs text-rose-400 mt-1">Cannot exceed your {maxPercent}% ownership</p>}
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold mb-1.5 block">Price per 1%</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={pricePerPercent}
                      onChange={(e) => setPricePerPercent(e.target.value)}
                      placeholder={formatCurrency(dynVal)}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 pl-8 pr-4 text-sm text-white placeholder:text-white/15 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  {isBelowFloor && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Below 8th Ledger floor. Requires hall vote (51%) to approve.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold mb-1.5 block">Listing Duration</label>
                  <select
                    value={expiresDays}
                    onChange={(e) => setExpiresDays(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 px-4 text-sm text-white focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              {totalPrice > 0 && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4 space-y-2">
                  <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider font-semibold">Listing Preview</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">List {listPct}% at</span>
                    <span className="text-white font-mono">{formatCurrency(askPrice)}/%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Gross Total</span>
                    <span className="text-white font-mono">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">8th Ledger Fee ({listPct >= 100 ? "1%" : "2%"})</span>
                    <span className="text-white/60 font-mono">-{formatCurrency(fee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-cyan-500/10">
                    <span className="text-white">You Receive</span>
                    <span className="text-cyan-400 font-mono">{formatCurrency(totalPrice - fee)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 text-sm font-semibold hover:text-white hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Tag className="h-4 w-4" />
                      Create Listing
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-24"
    >
      <div className="h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
        <Landmark className="h-10 w-10 text-white/10" />
      </div>
      <h3 className="text-xl font-bold text-white/40 mb-2">
        {hasFilters ? "No Listings Match" : "Exchange Empty"}
      </h3>
      <p className="text-sm text-white/20 max-w-md text-center mb-6">
        {hasFilters
          ? "Adjust your filters or search terms to find available ownership positions."
          : "No PACs are listed for sale. Ownership unlocks after pools fill. Browse active pools to commit."}
      </p>
      {!hasFilters && (
        <button className="px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition-all">
          Browse Active Pools
        </button>
      )}
    </motion.div>
  );
}

/* ============================================================
   PAGINATION
   ============================================================ */
function Pagination({
  page,
  perPage,
  total,
  onPageChange,
}: {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage) || 1;
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (i === page - 2 || i === page + 2) {
      pages.push("...");
    }
  }
  const uniquePages = pages.filter((p, i, arr) => p !== "..." || arr[i - 1] !== "...");

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="h-9 w-9 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
      </button>
      {uniquePages.map((p, i) => (
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="text-xs text-white/15 px-2">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              "h-9 w-9 rounded-lg border text-xs font-bold transition-all",
              p === page
                ? "bg-cyan-600 border-cyan-500/30 text-slate-950"
                : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10"
            )}
          >
            {p}
          </button>
        )
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="h-9 w-9 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function OwnershipMarketplacePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedVertical, setSelectedVertical] = useState("all");
  const [selectedHallClass, setSelectedHallClass] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showMyListingsOnly, setShowMyListingsOnly] = useState(false);
  const [showBelowFloorOnly, setShowBelowFloorOnly] = useState(false);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [selectedListing, setSelectedListing] = useState<OwnershipListingData | null>(null);
  const [showMyPacs, setShowMyPacs] = useState(false);
  const [selectedPac, setSelectedPac] = useState<UserOwnership | null>(null);
  const [showListForm, setShowListForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data: userData } = useSWR<{ user?: { kycTier: string; ledgerId: string; ledgerBalance: number } }>("/api/user", fetcher);
  const user = userData?.user;

  const { data, error, isLoading, mutate } = useSWR<{ listings?: OwnershipListingData[]; total?: number }>(
    `/api/marketplace/ownership?page=${page}&perPage=${perPage}`,
    fetcher
  );

  const listings = data?.listings || [];
  const totalItems = data?.total || 0;

  const filtered = useMemo(() => {
    let result = [...listings];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          safeStr(l.hallName).toLowerCase().includes(q) ||
          safeStr(l.country).toLowerCase().includes(q) ||
          safeStr(l.sellerDisplayName).toLowerCase().includes(q) ||
          safeStr(l.sellerLedgerId).toLowerCase().includes(q)
      );
    }

    if (selectedTier !== "all") {
      result = result.filter((l) => safeStr(l.sriTier).toLowerCase() === selectedTier);
    }
    if (selectedVertical !== "all") {
      result = result.filter((l) => safeStr(l.verticalId).toLowerCase() === selectedVertical);
    }
    if (selectedHallClass !== "all") {
      result = result.filter((l) => safeStr(l.hallClass).toUpperCase() === selectedHallClass);
    }
    if (showMyListingsOnly && user?.ledgerId) {
      result = result.filter((l) => l.sellerLedgerId === user.ledgerId);
    }
    if (showBelowFloorOnly) {
      result = result.filter((l) => (l.pricePerPercent || 0) < (l.dynamicValuationPerPercent || 0));
    }
    if (showEligibleOnly && user?.kycTier) {
      const buyerRank = KYC_TIER_RANK[user.kycTier] || 0;
      result = result.filter((l) => buyerRank >= (KYC_TIER_RANK[l.sellerKycTier || "visitor"] || 0));
    }

    switch (sortBy) {
      case "price_asc": result.sort((a, b) => safeNum(a.totalPrice) - safeNum(b.totalPrice)); break;
      case "price_desc": result.sort((a, b) => safeNum(b.totalPrice) - safeNum(a.totalPrice)); break;
      case "sri_high": result.sort((a, b) => safeNum(b.sriScore) - safeNum(a.sriScore)); break;
      case "ahgi_high": result.sort((a, b) => safeNum(b.ahgiScore) - safeNum(a.ahgiScore)); break;
      case "dividend_high": result.sort((a, b) => safeNum(b.monthlyDividendEstimate) - safeNum(a.monthlyDividendEstimate)); break;
      default: result.sort((a, b) => new Date(safeStr(b.listedAt)).getTime() - new Date(safeStr(a.listedAt)).getTime());
    }

    return result;
  }, [listings, search, selectedTier, selectedVertical, selectedHallClass, sortBy, showMyListingsOnly, showBelowFloorOnly, showEligibleOnly, user]);

  const activeFiltersCount = [
    selectedTier !== "all",
    selectedVertical !== "all",
    selectedHallClass !== "all",
    showMyListingsOnly,
    showBelowFloorOnly,
    showEligibleOnly,
  ].filter(Boolean).length;

  const handleBuy = () => {
    mutate();
  };

  const handleSelectPac = (pac: UserOwnership) => {
    setSelectedPac(pac);
    setShowMyPacs(false);
    setShowListForm(true);
  };

  const handleListed = () => {
    mutate();
    setShowListForm(false);
    setSelectedPac(null);
  };

  const totalVolume = listings.reduce((s, l) => s + safeNum(l.totalPrice), 0);
  const avgFloor = listings.length > 0 ? listings.reduce((s, l) => s + safeNum(l.dynamicValuationPerPercent), 0) / listings.length : 0;
  const topVertical = listings.length > 0 ? 
    Object.entries(listings.reduce((acc, l) => { acc[l.verticalId || "unknown"] = (acc[l.verticalId || "unknown"] || 0) + 1; return acc; }, {} as Record<string, number>))
      .sort((a, b) => b[1] - a[1])[0]?.[0] : "ledgerprop";

  useEffect(() => { setPage(1); }, [search, selectedTier, selectedVertical, selectedHallClass, showMyListingsOnly, showBelowFloorOnly, showEligibleOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="relative">
        <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#050508]/95 backdrop-blur-xl">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em]">Exchange Live</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/15 uppercase tracking-wider">8th Ledger Protocol</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-transparent">
                    Ownership Exchange
                  </span>
                </h1>
                <p className="text-xs text-white/30 mt-1">Buy PACs from sovereign owners. 48h escrow. Dynamic floor pricing.</p>
              </div>

              <div className="flex items-center gap-1">
                {[
                  { label: "Listings", value: totalItems, prefix: "", suffix: "", color: "text-cyan-400" },
                  { label: "Volume", value: totalVolume, prefix: "$", suffix: "", color: "text-emerald-400" },
                  { label: "Avg Floor", value: avgFloor, prefix: "$", suffix: "", color: "text-amber-400" },
                  { label: "Top Vertical", value: topVertical.replace("ledger", ""), prefix: "", suffix: "", color: "text-violet-400", isText: true },
                ].map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    <div className="px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] min-w-[100px]">
                      <p className="text-[9px] text-white/20 uppercase tracking-wider font-semibold mb-0.5">{stat.label}</p>
                      <p className={cn("text-sm font-bold font-mono", stat.color)}>
                        {stat.isText ? stat.value : `${stat.prefix}${stat.value.toLocaleString()}${stat.suffix}`}
                      </p>
                    </div>
                    {i < 3 && <div className="w-px h-8 bg-white/[0.04]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {user?.kycTier === "visitor" && (
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-300 font-medium">KYC Verification Required</p>
                  <p className="text-xs text-amber-400/70">You can browse all listings, but purchasing ownership requires SIV/KYC verification.</p>
                </div>
                <button
                  onClick={() => router.push("/kyc")}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors shrink-0"
                >
                  Verify
                </button>
              </div>
            )}

            <div className="pb-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search halls, countries, sellers..."
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/15 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded text-white/20 hover:text-white/40 transition-all">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-white/[0.02] rounded-xl border border-white/[0.06] p-0.5">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => setSortBy(o.key)}
                      className={cn("px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                        sortBy === o.key ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-white/25 hover:text-white/50"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn("flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all",
                    showFilters || activeFiltersCount > 0
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                      : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowMyPacs(true)}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  List Your PAC
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-white/[0.04] space-y-4">
                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-2">Quick Filters</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setShowMyListingsOnly(!showMyListingsOnly)}
                            className={cn("flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all border",
                              showMyListingsOnly ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40"
                            )}
                          >
                            <User className="h-3.5 w-3.5" />
                            My Listings
                          </button>
                          <button
                            onClick={() => setShowBelowFloorOnly(!showBelowFloorOnly)}
                            className={cn("flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all border",
                              showBelowFloorOnly ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40"
                            )}
                          >
                            <ArrowDownRight className="h-3.5 w-3.5" />
                            Below Floor
                          </button>
                          <button
                            onClick={() => setShowEligibleOnly(!showEligibleOnly)}
                            className={cn("flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all border",
                              showEligibleOnly ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40"
                            )}
                          >
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Eligible Only
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-2">SRI Tier</p>
                        <div className="flex flex-wrap gap-2">
                          {SRI_TIERS.map((t) => {
                            const Icon = t.icon;
                            const active = selectedTier === t.key;
                            return (
                              <button
                                key={t.key}
                                onClick={() => setSelectedTier(t.key)}
                                className={cn("flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border",
                                  active ? cn("bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]") : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40"
                                )}
                              >
                                <Icon className={cn("h-3.5 w-3.5", active ? t.color : "text-white/15")} />
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-2">Vertical</p>
                        <div className="flex flex-wrap gap-2">
                          {VERTICALS.map((v) => {
                            const Icon = v.icon;
                            const active = selectedVertical === v.id;
                            return (
                              <button
                                key={v.id}
                                onClick={() => setSelectedVertical(v.id)}
                                className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all border",
                                  active ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40"
                                )}
                              >
                                <Icon className={cn("h-3.5 w-3.5", active ? v.color : "text-white/15")} />
                                {v.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-2">Hall Class</p>
                        <div className="flex flex-wrap gap-2">
                          {["all", "I", "II", "III"].map((c) => (
                            <button
                              key={c}
                              onClick={() => setSelectedHallClass(c)}
                              className={cn("rounded-xl px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border",
                                selectedHallClass === c ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "border-white/[0.04] bg-white/[0.02] text-white/25 hover:text-white/40"
                              )}
                            >
                              {c === "all" ? "All Classes" : `Class ${c}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="relative">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
                <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-emerald-400/30" style={{ animationDuration: "1.5s" }} />
              </div>
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center text-rose-400">
              <AlertTriangle className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-semibold">Failed to load exchange data</p>
              <p className="text-xs text-rose-400/50 mt-1">Retrying connection...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EmptyState hasFilters={activeFiltersCount > 0 || !!search} />
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-xs text-white/20">
                  <span className="font-mono text-cyan-400 font-bold text-sm">{filtered.length}</span>
                  <span className="ml-1">active listing{filtered.length !== 1 ? "s" : ""}</span>
                  {listings.length !== filtered.length && (
                    <span className="text-white/10 ml-1">/ {listings.length} total</span>
                  )}
                </p>
                <button
                  onClick={() => router.push("/marketplace")}
                  className="text-xs text-white/20 hover:text-white/40 flex items-center gap-1.5 transition-colors font-medium"
                >
                  Inventory Market
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((listing, i) => (
                  <ListingCard key={listing.id} listing={listing} index={i} onClick={setSelectedListing} userTier={user?.kycTier} />
                ))}
              </div>
              <Pagination page={page} perPage={perPage} total={totalItems} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onBuy={handleBuy}
            userKycTier={user?.kycTier}
            userLedgerId={user?.ledgerId}
            userBalance={user?.ledgerBalance}
          />
        )}
      </AnimatePresence>

      <MyPacsModal
        open={showMyPacs}
        onClose={() => setShowMyPacs(false)}
        onSelectPac={handleSelectPac}
      />

      <ListPacForm
        pac={selectedPac}
        open={showListForm}
        onClose={() => { setShowListForm(false); setSelectedPac(null); }}
        onListed={handleListed}
      />
    </div>
  );
}