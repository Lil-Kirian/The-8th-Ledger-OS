"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Hash,
  Crown,
  Gem,
  Activity,
  Building2,
  Percent,
  User,
  Globe,
  Calendar,
  Eye,
  Heart,
  ChevronRight,
  X,
  Lock,
  Loader2,
  Share2,
  Copy,
  Check,
  Landmark,
  Home,
  Car,
  GraduationCap,
  Lock as LockIcon,
  Stethoscope,
  Briefcase,
  Plane,
  Sprout,
  Sun,
  Wifi,
  Swords,
  Ban,
  HelpCircle,
  PlusCircle,
  Receipt,
  Layers,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTimeRemaining(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days > 0) return `${days}d ${remHours}h`;
  return `${hours}h`;
}

/* ============================================================
   TYPES
   ============================================================ */
interface OwnershipListingData {
  id: string;
  ownershipId: string;
  hallId: string;
  hallName: string;
  hallClass: string;
  hallClosureStatus?: string;
  verticalId: string;
  verticalName: string;
  country: string;
  sellerId: string;
  sellerLedgerId: string;
  sellerDisplayName: string;
  sellerKycTier: string;
  percentListed: number;
  pricePerPercent: number;
  totalPrice: number;
  floorPrice: number;
  dynamicValuationPerPercent: number;
  status: "active" | "sold" | "cancelled" | "expired";
  listedAt: string;
  expiresAt: string;
  escrowExpiresAt?: string;
  auditHash?: string;
  buyerId?: string;
  sriScore: number;
  sriTier: string;
  ahgiScore: number;
  monthlyDividendEstimate: number;
  accumulatedDividends: number;
  assetBookValue: number;
  views: number;
  interestCount: number;
  isFeatured?: boolean;
  isFractional?: boolean;
  belowFloorApproved?: boolean;
}

interface UserData {
  user?: {
    id: string;
    kycTier: string;
    ledgerId: string;
    ledgerBalance: number;
    ownerships?: { hallId?: string; ownershipPercent: number }[];
  };
}

const KYC_TIER_RANK: Record<string, number> = { visitor: 0, sovereign: 1, verified: 2, whale: 3 };

/* ============================================================
   CONFIG
   ============================================================ */
const HALL_CLASS_CONFIG: Record<string, { label: string; desc: string; color: string; bg: string; border: string }> = {
  I: { label: "CLASS I — PASSIVE", desc: "8th Ledger manages everything. Minimal hall input.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  II: { label: "CLASS II — MANAGED", desc: "Hall hires operators. 8th Ledger executes.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  III: { label: "CLASS III — ACTIVE", desc: "Hall runs daily operations. Full staffing.", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const SRI_TIER_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; effect: string }> = {
  platinum: { icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10", label: "PLATINUM", effect: "Early access, 0.25% marketplace fees" },
  gold: { icon: Gem, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "GOLD", effect: "Reduced fees (0.5%)" },
  silver: { icon: Shield, color: "text-slate-300", bg: "bg-slate-500/10", label: "SILVER", effect: "Standard operation" },
  bronze: { icon: Shield, color: "text-orange-400", bg: "bg-orange-500/10", label: "BRONZE", effect: "Restricted: cannot propose hires" },
  at_risk: { icon: Activity, color: "text-rose-400", bg: "bg-rose-500/10", label: "AT RISK", effect: "8th Ledger oversight. Dividends paused." },
};

const VERTICAL_ICONS: Record<string, React.ElementType> = {
  ledgerprop: Home, ledgerauto: Car, ledgertech: Wifi, ledgeredu: GraduationCap,
  ledgerhealth: Stethoscope, ledgerbiz: Briefcase, ledgertravel: Plane,
  ledgeragri: Sprout, ledgerenergy: Sun, ledgeraccess: LockIcon, ledgersport: Swords,
};

const VERTICAL_COLORS: Record<string, string> = {
  ledgerprop: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  ledgerauto: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
  ledgertech: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
  ledgeredu: "text-violet-400 border-violet-500/20 bg-violet-500/10",
  ledgerhealth: "text-rose-400 border-rose-500/20 bg-rose-500/10",
  ledgerbiz: "text-orange-400 border-orange-500/20 bg-orange-500/10",
  ledgertravel: "text-sky-400 border-sky-500/20 bg-sky-500/10",
  ledgeragri: "text-green-400 border-green-500/20 bg-green-500/10",
  ledgerenergy: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
  ledgeraccess: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  ledgersport: "text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/10",
};

/* ============================================================
   ESCROW MODAL
   ============================================================ */
function EscrowModal({
  escrow,
  onClose,
}: {
  escrow: {
    id: string;
    amount: number;
    fee: number;
    total: number;
    status: string;
    createdAt: string;
    expiresAt: string;
    buyerLedgerId: string;
    sellerLedgerId: string;
    auditHash?: string;
  };
  onClose: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await fetch(`/api/marketplace/ownership/${escrow.id}/cancel`, { method: "POST", credentials: "include" });
    } finally {
      onClose();
    }
  };

  const timeLeft = formatTimeRemaining(escrow.expiresAt);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-cyan-950/30 border border-cyan-900/30 flex items-center justify-center">
            <Clock className="h-7 w-7 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-1">48-Hour Escrow Active</h3>
          <p className="text-xs text-slate-500 mb-4">
            Your payment is held securely. The seller cannot cancel. You can cancel anytime for a full refund.
          </p>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-4 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Amount</span>
              <span className="text-slate-200 font-mono">{formatCurrency(escrow.amount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">8th Ledger Fee</span>
              <span className="text-slate-200 font-mono">{formatCurrency(escrow.fee)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Paid</span>
              <span className="text-cyan-400 font-bold font-mono">{formatCurrency(escrow.total)}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-xs">
              <span className="text-slate-500">Time Remaining</span>
              <span className="text-amber-400 font-bold">{timeLeft}</span>
            </div>
            {escrow.auditHash && (
              <div className="border-t border-slate-800 pt-2 flex justify-between text-[10px]">
                <span className="text-slate-600">Audit Hash</span>
                <span className="text-slate-500 font-mono truncate max-w-[120px]">{escrow.auditHash.slice(0, 16)}...</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel & Refund"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-slate-950 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function OwnershipListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "valuation" | "seller" | "hall">("overview");
  const [showEscrow, setShowEscrow] = useState(false);
  const [buyStep, setBuyStep] = useState<"review" | "kyc" | "confirm" | "processing" | "done">("review");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Fetch listing
  const { data: listingData, error: listingError, isLoading } = useSWR<{
    listing?: OwnershipListingData;
  }>(`/api/marketplace/ownership/${listingId}`, fetcher);

  // Fetch user
  const { data: userData } = useSWR<UserData>("/api/user", fetcher);

  const listing = listingData?.listing;
  const user = userData?.user;

  const userOwnershipPercent = useMemo(() => {
    return (user?.ownerships || []).find((o) => o.hallId === listing?.hallId)?.ownershipPercent || 0;
  }, [user, listing]);

  const handleShare = () => {
    const url = `${window.location.origin}/marketplace/ownership/${listingId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyClick = () => {
    if (!listing || !user) return;

    const buyerRank = KYC_TIER_RANK[user.kycTier || "visitor"];
    const sellerRank = KYC_TIER_RANK[listing.sellerKycTier] || 0;

    if (user.kycTier === "visitor") {
      setBuyStep("kyc");
      return;
    }
    if (buyerRank < sellerRank) {
      setError(`Your KYC tier (${user.kycTier}) is below the seller's required tier (${listing.sellerKycTier}).`);
      return;
    }

    const feeRate = listing.isFractional ? 0.02 : 0.01;
    const totalWithFee = listing.totalPrice * (1 + feeRate);
    if (user.ledgerBalance < totalWithFee) {
      setError(`Insufficient balance. You need ${formatCurrency(totalWithFee)}. Your balance: ${formatCurrency(user.ledgerBalance)}.`);
      return;
    }

    setBuyStep("confirm");
  };

  const handleConfirm = async () => {
    if (!listing) return;
    setBuyStep("processing");
    setError("");

    try {
      const res = await fetch(`/api/marketplace/ownership/${listing.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.escrow) {
        setBuyStep("done");
        setShowEscrow(true);
      } else {
        setError(data.error || "Purchase failed");
        setBuyStep("confirm");
      }
    } catch {
      setError("Network error. Try again.");
      setBuyStep("confirm");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a14]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (listingError || !listing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a14] text-slate-500">
        <AlertTriangle className="mb-3 h-10 w-10 text-slate-700" />
        <p className="text-sm font-medium">Listing not found</p>
        <p className="text-xs">This ownership listing may have been sold or cancelled</p>
        <button
          onClick={() => router.push("/marketplace/ownership")}
          className="mt-4 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Back to Exchange
        </button>
      </div>
    );
  }

  const hallClass = HALL_CLASS_CONFIG[listing.hallClass] || HALL_CLASS_CONFIG.I;
  const sriTier = SRI_TIER_CONFIG[listing.sriTier] || SRI_TIER_CONFIG.silver;
  const SRIIcon = sriTier.icon;
  const VerticalIcon = VERTICAL_ICONS[listing.verticalId] || Landmark;
  const verticalStyle = VERTICAL_COLORS[listing.verticalId] || VERTICAL_COLORS.ledgerprop;

  const pricePremium = listing.dynamicValuationPerPercent > 0
    ? ((listing.pricePerPercent / listing.dynamicValuationPerPercent) - 1) * 100
    : 0;
  const isAboveFloor = pricePremium >= 0;
  const feeRate = listing.isFractional ? 0.02 : 0.01;
  const fee = Math.floor(listing.totalPrice * feeRate);
  const totalWithFee = listing.totalPrice + fee;

  const buyerRank = KYC_TIER_RANK[user?.kycTier || "visitor"];
  const sellerRank = KYC_TIER_RANK[listing.sellerKycTier] || 0;
  const kycBlocked = buyerRank < sellerRank;
  const kycRequired = user?.kycTier === "visitor";
  const canAfford = user ? user.ledgerBalance >= totalWithFee : false;
  const isExpired = listing.expiresAt ? new Date(listing.expiresAt) < new Date() : false;
  const isInEscrow = !!listing.buyerId && listing.buyerId === user?.id;
  const daysRemaining = listing.expiresAt
    ? Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const sriBonus = listing.sriTier === "platinum" ? 50 : listing.sriTier === "gold" ? 30 : listing.sriTier === "silver" ? 10 : listing.sriTier === "bronze" ? 0 : -20;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/[0.015] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-violet-500/[0.015] rounded-full blur-[150px]" />
      </div>

      <div className="relative">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 border-b border-slate-800/60 bg-[#0a0a14]/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push("/marketplace/ownership")}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-cyan-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Exchange
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:text-cyan-400"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden relative"
          >
            {/* Featured ribbon */}
            {listing.isFeatured && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 z-20" />
            )}

            {/* Closure warning */}
            {listing.hallClosureStatus && listing.hallClosureStatus !== "active" && (
              <div className="bg-rose-950/30 border-b border-rose-500/20 p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-xs text-rose-400 font-bold">
                  Hall Status: {listing.hallClosureStatus.toUpperCase()} — This asset may be at risk
                </span>
              </div>
            )}

            {/* User ownership context */}
            {userOwnershipPercent > 0 && (
              <div className="bg-emerald-950/20 border-b border-emerald-500/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">
                    You own {userOwnershipPercent}% of this hall
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/marketplace/ownership?action=list&hallId=${listing.hallId}`)}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="h-3 w-3" />
                  List Your PAC
                </button>
              </div>
            )}

            {/* Active escrow status */}
            {isInEscrow && (
              <div className="bg-cyan-950/20 border-b border-cyan-500/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400 font-medium">
                    Escrow Active — {listing.escrowExpiresAt ? formatTimeRemaining(listing.escrowExpiresAt) : "48h remaining"}
                  </span>
                </div>
                <button
                  onClick={() => setShowEscrow(true)}
                  className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View Details
                </button>
              </div>
            )}

            {/* Card Header */}
            <div className="relative flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border", verticalStyle)}>
                  <VerticalIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="text-lg font-bold text-slate-100">{listing.hallName}</h1>
                    <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider border", hallClass.bg, hallClass.color, hallClass.border)}>
                      {hallClass.label}
                    </span>
                    {listing.isFractional && (
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Fractional
                      </span>
                    )}
                    {listing.belowFloorApproved && (
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider border bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Below Floor
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-cyan-500">{listing.hallId.slice(-8)}</span>
                    <span>·</span>
                    <span>{listing.country}</span>
                    <span>·</span>
                    <span>{listing.verticalName}</span>
                  </div>
                </div>
              </div>
              <SRIIcon className={cn("h-6 w-6", sriTier.color)} />
            </div>

            <div className="p-6">
              {/* Price Hero */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Asking Price</div>
                  <div className="text-4xl font-black text-slate-50">{formatCurrency(listing.totalPrice)}</div>
                  <div className="text-sm text-slate-400 mt-1">{formatCurrency(listing.pricePerPercent)} per 1%</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-bold border",
                    isAboveFloor
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  )}>
                    {isAboveFloor ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {isAboveFloor ? "+" : ""}{pricePremium.toFixed(1)}% vs floor
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Floor: {formatCurrency(listing.floorPrice)}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
                  <p className="text-lg font-bold text-slate-100">{listing.percentListed}%</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">For Sale</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
                  <p className="text-lg font-bold text-cyan-400">{formatCurrency(listing.dynamicValuationPerPercent)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Floor / 1%</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
                  <p className="text-lg font-bold text-slate-100">{listing.sriScore}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">SRI</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
                  <p className="text-lg font-bold text-slate-100">{listing.ahgiScore}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">AHGI</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex gap-1 p-1 bg-slate-950/50 border border-slate-800 rounded-xl overflow-x-auto">
                {(["overview", "valuation", "seller", "hall"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 min-w-[80px] rounded-lg px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap",
                      activeTab === tab
                        ? "bg-cyan-950/30 text-cyan-400 border border-cyan-900/30"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "overview" && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
                        <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Financial Summary</div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Listing Price</span>
                            <span className="font-semibold text-slate-100">{formatCurrency(listing.totalPrice)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">8th Ledger Fee ({listing.isFractional ? "2%" : "1%"})</span>
                            <span className="font-semibold text-slate-100">{formatCurrency(fee)}</span>
                          </div>
                          <div className="border-t border-slate-800 pt-3">
                            <div className="flex justify-between text-base">
                              <span className="font-semibold text-slate-200">Total to Pay</span>
                              <span className="font-black text-cyan-400">{formatCurrency(totalWithFee)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Est. Monthly Dividend</span>
                            <span className="text-emerald-400 font-bold">+{formatCurrency(listing.monthlyDividendEstimate)}/mo</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                        <div>
                          <div className="text-sm font-bold text-cyan-300 mb-0.5">48-Hour Sovereign Hold</div>
                          <div className="text-xs text-slate-500 leading-relaxed">
                            Funds held in escrow for 48 hours. Seller cannot cancel. Buyer can cancel for full refund.
                            8th Ledger verifies identity and fraud flags before transfer.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                        <div>
                          <div className="text-sm font-bold text-slate-400 mb-0.5">Queue System</div>
                          <div className="text-xs text-slate-500 leading-relaxed">
                            First-come-first-served. No bidding wars. First to complete payment gets it.
                            Others refunded instantly. No auction. No counter-offers.
                          </div>
                        </div>
                      </div>

                      {listing.auditHash && (
                        <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                          <Hash className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                          <div>
                            <div className="text-sm font-bold text-slate-400 mb-0.5">Immutable Audit</div>
                            <div className="text-xs text-slate-500 font-mono break-all">{listing.auditHash}</div>
                          </div>
                        </div>
                      )}

                      {isExpired && (
                        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4">
                          <Ban className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                          <div>
                            <div className="text-sm font-bold text-rose-300">Listing Expired</div>
                            <div className="text-xs text-slate-500">This listing has expired and is no longer available.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "valuation" && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
                        <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">8th Ledger Dynamic Valuation</div>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Asset Book Value (per 1%)</span>
                            <span className="font-mono text-slate-200">{formatCurrency(Math.round(listing.assetBookValue / 100))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Accumulated Dividends (per 1%)</span>
                            <span className="font-mono text-emerald-400">+{formatCurrency(listing.accumulatedDividends)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">AHGI Premium ({listing.ahgiScore})</span>
                            <span className="font-mono text-cyan-400">+{formatCurrency(Math.max(0, (listing.ahgiScore - 50) * 10))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">SRI Bonus ({sriTier.label})</span>
                            <span className="font-mono text-violet-400">{sriBonus >= 0 ? "+" : ""}{formatCurrency(sriBonus)}</span>
                          </div>
                          <div className="border-t border-slate-800 pt-3">
                            <div className="flex justify-between text-base">
                              <span className="font-bold text-slate-200">Dynamic Floor (per 1%)</span>
                              <span className="font-black text-cyan-400">{formatCurrency(listing.dynamicValuationPerPercent)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "rounded-2xl border p-4",
                        isAboveFloor ? "border-emerald-500/20 bg-emerald-950/10" : "border-rose-500/20 bg-rose-950/10"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          {isAboveFloor ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
                          <span className={cn("text-sm font-bold", isAboveFloor ? "text-emerald-400" : "text-rose-400")}>
                            {isAboveFloor ? "Above Floor" : "Below Floor"}
                          </span>
                          {listing.belowFloorApproved && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                              Hall Approved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {isAboveFloor
                            ? `Seller asks ${pricePremium.toFixed(1)}% above 8th Ledger Valuation. Market decides if it sells.`
                            : "Below floor requires hall vote (51%). Protects against fire sales that crash hall value."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "seller" && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-2xl font-bold text-slate-400">
                          {listing.sellerDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-100">{listing.sellerDisplayName}</div>
                          <div className="font-mono text-xs text-slate-500">{listing.sellerLedgerId}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                              listing.sellerKycTier === "whale"
                                ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                                : listing.sellerKycTier === "verified"
                                ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
                                : "text-slate-400 border-slate-500/20 bg-slate-500/10"
                            )}>
                              {listing.sellerKycTier}
                            </span>
                            {kycBlocked && (
                              <span className="text-[10px] text-rose-400 font-bold">Your tier is lower</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
                        <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Listing Metadata</div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Listing ID</span>
                            <span className="font-mono text-slate-300">{listing.id.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Listed</span>
                            <span className="text-slate-300">{new Date(listing.listedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Expires</span>
                            <span className="text-slate-300">{new Date(listing.expiresAt).toLocaleDateString()}</span>
                          </div>
                          {listing.escrowExpiresAt && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Escrow Ends</span>
                              <span className="text-amber-400 font-bold">{formatTimeRemaining(listing.escrowExpiresAt)}</span>
                            </div>
                          )}
                          {listing.views > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Views</span>
                              <span className="text-slate-300">{listing.views}</span>
                            </div>
                          )}
                          {listing.interestCount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 flex items-center gap-2"><Heart className="h-3.5 w-3.5" /> Interested</span>
                              <span className="text-slate-300">{listing.interestCount}</span>
                            </div>
                          )}
                          {listing.auditHash && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Audit Hash</span>
                              <span className="font-mono text-slate-500 text-xs truncate max-w-[150px]">{listing.auditHash}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "hall" && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
                        <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Hall Information</div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Hall Name</span>
                            <span className="font-bold text-slate-100">{listing.hallName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Hall ID</span>
                            <span className="font-mono text-slate-300">{listing.hallId}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Class</span>
                            <span className={cn("font-bold", hallClass.color)}>{hallClass.label}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Description</span>
                            <span className="text-slate-300 text-right max-w-xs">{hallClass.desc}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Vertical</span>
                            <span className="font-bold text-slate-100">{listing.verticalName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Location</span>
                            <span className="font-bold text-slate-100">{listing.country}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">SRI Score</span>
                            <span className="font-bold text-slate-100">{listing.sriScore} — {sriTier.label}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">AHGI Score</span>
                            <span className="font-bold text-slate-100">{listing.ahgiScore}</span>
                          </div>
                          {listing.hallClosureStatus && listing.hallClosureStatus !== "active" && (
                            <div className="flex justify-between text-sm p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                              <span className="text-rose-400 font-bold">Closure Status</span>
                              <span className="text-rose-400 font-bold">{listing.hallClosureStatus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className="mt-5 flex items-center gap-2 p-3 rounded-xl border border-rose-900/30 bg-rose-950/20 text-rose-400 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sticky Footer CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800/60 bg-[#0a0a14]/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {isInEscrow ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-bold">
                  Escrow Active — {listing.escrowExpiresAt ? formatTimeRemaining(listing.escrowExpiresAt) : "48h remaining"}
                </span>
                <button
                  onClick={() => setShowEscrow(true)}
                  className="ml-2 text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                  View
                </button>
              </div>
            ) : buyStep === "review" && (
              <button
                onClick={handleBuyClick}
                disabled={!user || kycBlocked || !canAfford || isExpired}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold tracking-wider uppercase transition-all",
                  !user || kycBlocked || !canAfford || isExpired
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                    : "bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10"
                )}
              >
                {!user
                  ? "Sign In to Purchase"
                  : isExpired
                  ? "LISTING EXPIRED"
                  : kycRequired
                  ? "KYC VERIFICATION REQUIRED"
                  : kycBlocked
                  ? `UPGRADE KYC (${user.kycTier} → ${listing.sellerKycTier})`
                  : !canAfford
                  ? "INSUFFICIENT BALANCE"
                  : `BUY ${listing.percentListed}% FOR ${formatCurrency(totalWithFee)}`}
              </button>
            )}

            {buyStep === "kyc" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-900/30 bg-amber-950/20 text-amber-400 text-xs">
                  <Lock className="h-4 w-4 shrink-0" />
                  KYC verification required. Complete SIV/KYC to purchase ownership.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBuyStep("review")}
                    className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => router.push("/kyc")}
                    className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-slate-950"
                  >
                    Go to KYC
                  </button>
                </div>
              </div>
            )}

            {buyStep === "confirm" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl border border-cyan-900/30 bg-cyan-950/20 text-cyan-400 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  You are purchasing <strong>{listing.percentListed}%</strong> of <strong>{listing.hallName}</strong> for{" "}
                  <strong>{formatCurrency(totalWithFee)}</strong> (includes {formatCurrency(fee)} fee). Funds held 48h.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBuyStep("review")}
                    className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/10"
                  >
                    Confirm & Pay
                  </button>
                </div>
              </div>
            )}

            {buyStep === "processing" && (
              <div className="flex items-center justify-center gap-3 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <span className="text-sm text-slate-400">Processing purchase...</span>
              </div>
            )}

            {buyStep === "done" && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Purchase initiated. Check escrow.</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push("/marketplace/ownership/orders")}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                  >
                    <Receipt className="h-3.5 w-3.5 inline mr-1" />
                    My Orders
                  </button>
                  <button
                    onClick={() => { setBuyStep("review"); setShowEscrow(false); }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Escrow Modal */}
        <AnimatePresence>
          {showEscrow && (
            <EscrowModal
              escrow={{
                id: listing.id,
                amount: listing.totalPrice,
                fee,
                total: totalWithFee,
                status: "payment_held",
                createdAt: listing.listedAt,
                expiresAt: listing.escrowExpiresAt || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                buyerLedgerId: user?.ledgerId || "",
                sellerLedgerId: listing.sellerLedgerId,
                auditHash: listing.auditHash,
              }}
              onClose={() => setShowEscrow(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}