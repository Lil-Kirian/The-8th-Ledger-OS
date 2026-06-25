"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ArrowRight,
  Shield,
  Clock,
  Package,
  TrendingUp,
  Landmark,
  Globe,
  BadgeCheck,
  Loader2,
  AlertCircle,
  Hash,
  Wallet,
  List,
  ShoppingBag,
  Building2,
  Plus,
  RefreshCw,
  Eye,
  DollarSign,
  Tag,
  Search,
  Lock,
  Unlock,
  Star,
  ChevronRight,
  Filter,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   TYPES
   ============================================================ */
type OwnershipListing = {
  id: string;
  percentListed: number;
  pricePerPercent: number;
  totalPrice: number;
  floorPrice: number;
  status: string;
  listedAt: string;
  isFractional: boolean;
  seller?: { ledgerId: string; displayName: string; kycTier: string };
  hall?: { id: string; name: string; hallClass?: string; sriScore?: number };
};

type InventoryItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  quantitySold: number;
  status: string;
  imageUrl?: string;
  images?: string;
  hall?: { id: string; name: string; verticalId?: string };
};

type UserOwnership = {
  hallId?: string;
  hall?: { id: string; name: string; hallClass?: string; inventoryEnabled?: boolean; sriScore?: number };
  ownershipPercent: number;
  dynamicValue?: number;
  accumulatedDividends?: number;
};

/* ============================================================
   STAT PILL
   ============================================================ */
function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
      <Icon className={cn("h-3.5 w-3.5", color)} />
      <div>
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-xs font-bold text-slate-200">{value}</p>
      </div>
    </div>
  );
}

/* ============================================================
   MARKET CARD
   ============================================================ */
function MarketCard({
  title,
  subtitle,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  borderColor,
  gradient,
  stats,
  features,
  ctaLabel,
  ctaHref,
  badge,
  index,
  disabled,
  disabledReason,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  gradient: string;
  stats: { label: string; value: React.ReactNode; icon: React.ElementType; color: string }[];
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
  index: number;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className={cn(
        "group relative rounded-3xl border overflow-hidden transition-all duration-500",
        disabled ? "opacity-60" : "hover:shadow-2xl",
        borderColor
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30 transition-opacity duration-500 group-hover:opacity-50",
          gradient
        )}
      />
      <div className="relative p-8 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center border",
                iconBg,
                borderColor
              )}
            >
              <Icon className={cn("h-7 w-7", iconColor)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-100">{title}</h2>
                {badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-1">
          {description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {stats.map((stat, i) => (
            <StatPill
              key={i}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
            />
          ))}
        </div>

        <div className="space-y-2 mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <BadgeCheck className="h-3.5 w-3.5 text-slate-600" />
              {feature}
            </div>
          ))}
        </div>

        {disabled ? (
          <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed">
            <Lock className="h-4 w-4" />
            {disabledReason || "Unavailable"}
          </div>
        ) : (
          <button
            onClick={() => router.push(ctaHref)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
              "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700",
              "group-hover:border-slate-600"
            )}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   MINI LISTING CARD
   ============================================================ */
function MiniListingCard({
  type,
  data,
  index,
}: {
  type: "ownership" | "inventory";
  data: OwnershipListing | InventoryItem;
  index: number;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (type === "ownership") {
      router.push(`/marketplace/ownership/${data.id}`);
    } else {
      router.push(`/marketplace/inventory/${data.id}`);
    }
  };

  const isOwnership = type === "ownership";
  const o = isOwnership ? (data as OwnershipListing) : null;
  const inv = !isOwnership ? (data as InventoryItem) : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      onClick={handleClick}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/40 hover:border-slate-700/50 transition-all group"
    >
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center border shrink-0",
        isOwnership ? "bg-cyan-500/10 border-cyan-500/20" : "bg-emerald-500/10 border-emerald-500/20"
      )}>
        {isOwnership ? (
          <Landmark className="h-4 w-4 text-cyan-400" />
        ) : (
          <Package className="h-4 w-4 text-emerald-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {isOwnership ? `${o!.percentListed}% of ${o!.hall?.name ?? "Hall"}` : inv!.title}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {isOwnership
            ? `$${o!.pricePerPercent.toLocaleString()} per 1% • Floor: $${o!.floorPrice.toLocaleString()}`
            : `$${inv!.price.toLocaleString()} • ${inv!.quantity - inv!.quantitySold} left`
          }
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
    </motion.button>
  );
}

/* ============================================================
   ACTIVITY ROW
   ============================================================ */
function ActivityRow({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  meta,
  href,
  badge,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  badge?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/40 transition-colors text-left group"
    >
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border border-slate-700/50", iconColor.replace("text-", "bg-").replace("400", "500/10"))}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200 truncate">{title}</p>
          {badge}
        </div>
        <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[11px] text-slate-500">{meta}</p>
        <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </button>
  );
}

/* ============================================================
   SEARCH BAR
   ============================================================ */
function SearchBar({ onSearch }: { onSearch: (query: string, market: "inventory" | "ownership") => void }) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<"inventory" | "ownership">("inventory");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim(), market);
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 backdrop-blur-sm p-2">
        <div className="flex items-center gap-1.5 pl-3">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${market === "inventory" ? "products" : "ownership listings"}...`}
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none py-2.5"
        />
        <div className="flex items-center gap-1 pr-1">
          <button
            type="button"
            onClick={() => setMarket("inventory")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
              market === "inventory"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-500 hover:text-slate-400"
            )}
          >
            Inventory
          </button>
          <button
            type="button"
            onClick={() => setMarket("ownership")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
              market === "ownership"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-500 hover:text-slate-400"
            )}
          >
            Ownership
          </button>
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-30"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function MarketplaceHubPage() {
  const router = useRouter();

  // Real endpoints — limit=1 for counts, limit=3 for previews
  const {
    data: ownershipRes,
    error: ownershipError,
    isLoading: ownershipLoading,
    mutate: mutateOwnership,
  } = useSWR<{ success: boolean; ownershipListings?: OwnershipListing[]; meta?: { total: number } }>(
    "/api/marketplace/ownership?limit=1",
    fetcher
  );

  const {
    data: inventoryRes,
    error: inventoryError,
    isLoading: inventoryLoading,
    mutate: mutateInventory,
  } = useSWR<{ success: boolean; items?: InventoryItem[]; meta?: { total: number } }>(
    "/api/marketplace/inventory?limit=1",
    fetcher
  );

  // Recent listings preview
  const { data: recentOwnershipRes } = useSWR<{ success: boolean; ownershipListings?: OwnershipListing[] }>(
    "/api/marketplace/ownership?limit=3&sort=recent",
    fetcher
  );

  const { data: recentInventoryRes } = useSWR<{ success: boolean; items?: InventoryItem[] }>(
    "/api/marketplace/inventory?limit=3&sort=recent",
    fetcher
  );

  // User context
  const {
    data: userRes,
    isLoading: userLoading,
  } = useSWR<{ success: boolean; kycTier?: string; ownerships?: UserOwnership[] }>(
    "/api/user",
    fetcher
  );

  const ownershipTotal = ownershipRes?.meta?.total ?? 0;
  const inventoryTotal = inventoryRes?.meta?.total ?? 0;
  const userOwnerships = userRes?.ownerships ?? [];
  const userKycTier = userRes?.kycTier ?? "visitor";
  const hasOwnerships = userOwnerships.length > 0;
  const isVisitor = userKycTier === "visitor";

  const recentOwnerships = recentOwnershipRes?.ownershipListings ?? [];
  const recentInventory = recentInventoryRes?.items ?? [];

  const isRefreshing = ownershipLoading || inventoryLoading || userLoading;

  const handleSearch = useCallback((query: string, market: "inventory" | "ownership") => {
    router.push(`/marketplace/${market}?q=${encodeURIComponent(query)}`);
  }, [router]);

  // Halls with inventory enabled
  const hallsWithInventory = userOwnerships.filter((o) => o.hall?.inventoryEnabled);
  const hallsWithoutInventory = userOwnerships.filter((o) => !o.hall?.inventoryEnabled);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/[0.02] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-violet-500/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-4">
            <Store className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              8th Ledger Exchange
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            The Marketplace
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Two markets. One platform. Buy ownership in real-world assets or
            purchase physical products directly from hall operations.
          </p>
        </motion.div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} />

        {/* KYC Gate Warning */}
        <AnimatePresence>
          {isVisitor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-3"
            >
              <Lock className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-300 font-medium">KYC Verification Required</p>
                <p className="text-xs text-amber-400/70">
                  You can browse all markets, but buying ownership requires KYC verification. Complete SIV/KYC to unlock ownership purchases.
                </p>
              </div>
              <button
                onClick={() => router.push("/kyc")}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors shrink-0"
              >
                Verify
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {(ownershipError || inventoryError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-300 font-medium">Marketplace data unavailable</p>
                <p className="text-xs text-red-400/70">Some stats may be stale. Retrying automatically.</p>
              </div>
              <button
                onClick={() => {
                  mutateOwnership();
                  mutateInventory();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Market Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
            <p className="text-lg font-bold text-slate-200">{(ownershipTotal + inventoryTotal).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Listings</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
            <p className="text-lg font-bold text-cyan-400">{ownershipTotal.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Ownership</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">{inventoryTotal.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Inventory</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
            <p className="text-lg font-bold text-slate-200">48h</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Escrow Protected</p>
          </div>
        </motion.div>

        {/* Market Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ownership Market */}
          <MarketCard
            index={0}
            title="Ownership Market"
            subtitle="PAC Trading"
            description="Buy and sell Perpetual Asset Contracts (PACs) at their true dynamic value. Every listing is backed by real asset performance, accumulated dividends, and 8th Ledger appraisal. Full sales or fractional — you choose."
            icon={Landmark}
            iconColor="text-cyan-400"
            iconBg="bg-cyan-500/10"
            borderColor="border-cyan-500/10 hover:border-cyan-500/20"
            gradient="from-cyan-500/5 to-blue-500/5"
            stats={[
              {
                label: "Active Listings",
                value: ownershipLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                ) : (
                  ownershipTotal.toLocaleString()
                ),
                icon: Hash,
                color: "text-cyan-400",
              },
              {
                label: "Your Ownerships",
                value: userLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                ) : (
                  userOwnerships.length
                ),
                icon: Wallet,
                color: "text-emerald-400",
              },
              {
                label: "Escrow",
                value: "48h",
                icon: Clock,
                color: "text-amber-400",
              },
            ]}
            features={[
              "Dynamic valuation floor — never below 8th Ledger appraisal",
              "KYC tier gate — buyer must match seller's tier",
              "1% fee on full sale, 2% on fractional",
              "Immutable hash audit trail on every transfer",
            ]}
            ctaLabel="Browse Ownership Listings"
            ctaHref="/marketplace/ownership"
            badge="Invest"
            disabled={false}
          />

          {/* Inventory Market */}
          <MarketCard
            index={1}
            title="Inventory Market"
            subtitle="The Forge Exchange"
            description="Purchase real products from halls with inventory enabled. Crops from LedgerAgri, electronics from LedgerTech, meals from LedgerBiz — all fulfilled by the 8th Ledger. Public access. No KYC required for small purchases."
            icon={Package}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10"
            borderColor="border-emerald-500/10 hover:border-emerald-500/20"
            gradient="from-emerald-500/5 to-teal-500/5"
            stats={[
              {
                label: "Products",
                value: inventoryLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                ) : (
                  inventoryTotal.toLocaleString()
                ),
                icon: Package,
                color: "text-emerald-400",
              },
              {
                label: "Your Halls",
                value: userLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                ) : (
                  userOwnerships.length
                ),
                icon: Building2,
                color: "text-cyan-400",
              },
              {
                label: "Access",
                value: "Public",
                icon: Globe,
                color: "text-violet-400",
              },
            ]}
            features={[
              "Open to anyone — no ownership required",
              "8th Ledger handles fulfillment, shipping, refunds",
              "5% platform fee — net goes to hall treasury",
              "Revenue auto-splits to owners as dividends",
            ]}
            ctaLabel="Browse Inventory"
            ctaHref="/marketplace/inventory"
            badge="Shop"
            disabled={false}
          />
        </div>

        {/* Recent Listings Preview */}
        {(recentOwnerships.length > 0 || recentInventory.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {recentOwnerships.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    Recent Ownership Listings
                  </h3>
                  <button
                    onClick={() => router.push("/marketplace/ownership")}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {recentOwnerships.map((listing, i) => (
                    <MiniListingCard key={listing.id} type="ownership" data={listing} index={i} />
                  ))}
                </div>
              </div>
            )}

            {recentInventory.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-emerald-400" />
                    Fresh Inventory
                  </h3>
                  <button
                    onClick={() => router.push("/marketplace/inventory")}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {recentInventory.map((item, i) => (
                    <MiniListingCard key={item.id} type="inventory" data={item} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* User Activity + Hall Links */}
        {hasOwnerships && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* My Listings */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <List className="h-4 w-4 text-cyan-400" />
                  My Listings
                </h3>
                <button
                  onClick={() => router.push("/marketplace/ownership?filter=my")}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                <ActivityRow
                  icon={Plus}
                  iconColor="text-emerald-400"
                  title="List PAC for Sale"
                  subtitle="Sell ownership at dynamic valuation or above"
                  meta="New"
                  href="/marketplace/ownership?action=list"
                />
                <ActivityRow
                  icon={Tag}
                  iconColor="text-amber-400"
                  title="Check Active Listings"
                  subtitle="Manage your ownership listings"
                  meta="Manage"
                  href="/marketplace/ownership?filter=my"
                />
              </div>
            </div>

            {/* Hall Marketplaces */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  Hall Marketplaces
                </h3>
                <span className="text-[11px] text-slate-600">
                  {userOwnerships.length} hall{userOwnerships.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userOwnerships.slice(0, 4).map((own, i) => (
                  <ActivityRow
                    key={own.hallId ?? i}
                    icon={Store}
                    iconColor="text-cyan-400"
                    title={own.hall?.name ?? `Hall #${own.hallId?.slice(-6)}`}
                    subtitle={`${own.ownershipPercent}% ownership • Class ${own.hall?.hallClass ?? "I"} • SRI ${own.hall?.sriScore ?? 50}`}
                    meta="Enter"
                    href={`/halls/${own.hallId}/marketplace`}
                    badge={own.hall?.inventoryEnabled ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Inventory
                      </span>
                    ) : undefined}
                  />
                ))}
                {userOwnerships.length > 4 && (
                  <button
                    onClick={() => router.push("/dashboard?tab=halls")}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 text-xs text-slate-500 hover:text-slate-400 hover:border-slate-600 transition-colors"
                  >
                    +{userOwnerships.length - 4} more halls
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-300 mb-1">
                8th Ledger Protected
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every transaction on the 8th Ledger Exchange is escrow-protected,
                identity-verified, and permanently audited. Ownership transfers are
                hashed and timestamped. Inventory orders are fulfilled by the 8th
                Ledger — not individual sellers. If something goes wrong, the
                Protocol Infrastructure Reserve has you covered.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-200">48h</p>
                <p className="text-[10px] text-slate-600">Escrow Hold</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center">
                <p className="text-lg font-bold text-slate-200">100%</p>
                <p className="text-[10px] text-slate-600">Audited</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center">
                <p className="text-lg font-bold text-slate-200">0</p>
                <p className="text-[10px] text-slate-600">Fraud Tolerance</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}