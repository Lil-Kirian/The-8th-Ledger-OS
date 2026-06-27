"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  ShoppingCart,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  X,
  ArrowRight,
  Store,
  Sprout,
  Briefcase,
  Wifi,
  Home,
  Car,
  GraduationCap,
  Lock,
  Stethoscope,
  Plane,
  Sun,
  Swords,
  Activity,
  Zap,
  BarChart3,
  Flame,
  Snowflake,
  Layers,
  Globe,
  Shield,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Receipt,
  User,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   TYPES
   ============================================================ */
interface InventoryItem {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  quantitySold: number;
  status: string;
  listedAt: string;
  updatedAt: string;
  costOfGoods: number;
  reorderThreshold: number;
  hallId: string;
  hallName: string;
  hallVertical?: string;
  hallSriScore?: number;
  hallClass?: string;
  imageUrl?: string;
  images?: string;
  tags?: string;
}

interface InventoryApiResponse {
  items?: InventoryItem[];
  total?: number;
  page?: number;
  perPage?: number;
  error?: string;
}

interface UserApiResponse {
  success?: boolean;
  kycTier?: string;
  ownerships?: { hallId?: string; hall?: { name: string; id: string; hallClass?: string }; ownershipPercent: number }[];
}

/* ============================================================
   VERTICAL CONFIG
   ============================================================ */
const VERTICALS = [
  { slug: "all", label: "All Verticals", icon: Store },
  { slug: "ledgerbiz", label: "LedgerBiz", icon: Briefcase },
  { slug: "ledgeragri", label: "LedgerAgri", icon: Sprout },
  { slug: "ledgertech", label: "LedgerTech", icon: Wifi },
  { slug: "ledgerprop", label: "LedgerProp", icon: Home },
  { slug: "ledgerauto", label: "LedgerAuto", icon: Car },
  { slug: "ledgeredu", label: "LedgerEdu", icon: GraduationCap },
  { slug: "ledgeraccess", label: "LedgerAccess", icon: Lock },
  { slug: "ledgerhealth", label: "LedgerHealth", icon: Stethoscope },
  { slug: "ledgertravel", label: "LedgerTravel", icon: Plane },
  { slug: "ledgerenergy", label: "LedgerEnergy", icon: Sun },
  { slug: "ledgersport", label: "SportLedger", icon: Swords },
];

const VERTICAL_COLORS: Record<string, string> = {
  ledgerbiz: "text-orange-400 border-orange-500/20 bg-orange-500/10",
  ledgeragri: "text-green-400 border-green-500/20 bg-green-500/10",
  ledgertech: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
  ledgerprop: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  ledgerauto: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
  ledgeredu: "text-violet-400 border-violet-500/20 bg-violet-500/10",
  ledgeraccess: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  ledgerhealth: "text-rose-400 border-rose-500/20 bg-rose-500/10",
  ledgertravel: "text-sky-400 border-sky-500/20 bg-sky-500/10",
  ledgerenergy: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
  ledgersport: "text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/10",
};

const VERTICAL_GLOW: Record<string, string> = {
  ledgerbiz: "shadow-orange-500/20",
  ledgeragri: "shadow-green-500/20",
  ledgertech: "shadow-indigo-500/20",
  ledgerprop: "shadow-amber-500/20",
  ledgerauto: "shadow-cyan-500/20",
  ledgeredu: "shadow-violet-500/20",
  ledgeraccess: "shadow-emerald-500/20",
  ledgerhealth: "shadow-rose-500/20",
  ledgertravel: "shadow-sky-500/20",
  ledgerenergy: "shadow-yellow-500/20",
  ledgersport: "shadow-fuchsia-500/20",
};

/* ============================================================
   UTILS
   ============================================================ */
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

function getVerticalIcon(slug?: string) {
  const v = VERTICALS.find((x) => x.slug === (slug || "").toLowerCase());
  return v?.icon || Package;
}

function getStockStatus(item: InventoryItem) {
  const remaining = item.quantity - item.quantitySold;
  if (remaining <= 0) return { label: "Sold Out", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  if (remaining <= item.reorderThreshold) return { label: "Low Stock", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  return { label: "In Stock", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
}

function safeVerticalName(slug?: string) {
  return (slug || "unknown").toLowerCase().replace("ledger", "").replace(/^./, (c) => c.toUpperCase());
}

function isNewItem(listedAt: string) {
  const hours = (Date.now() - new Date(listedAt).getTime()) / (1000 * 60 * 60);
  return hours < 24;
}

/* ============================================================
   MARKET SENTIMENT GAUGE
   ============================================================ */
function MarketSentiment({ items }: { items: InventoryItem[] }) {
  const score = useMemo(() => {
    if (!items.length) return 50;
    const totalQty = items.reduce((a, b) => a + b.quantity, 0) || 1;
    const soldRatio = items.reduce((a, b) => a + b.quantitySold, 0) / totalQty;
    return Math.min(100, Math.max(0, Math.round(soldRatio * 100 + 30)));
  }, [items]);

  const getLabel = (s: number) => {
    if (s >= 80) return { label: "Frenzy", color: "text-rose-400", icon: Flame };
    if (s >= 60) return { label: "Hot", color: "text-orange-400", icon: TrendingUp };
    if (s >= 40) return { label: "Balanced", color: "text-emerald-400", icon: Activity };
    if (s >= 20) return { label: "Cool", color: "text-cyan-400", icon: Snowflake };
    return { label: "Frozen", color: "text-slate-400", icon: Snowflake };
  };

  const { label, color, icon: Icon } = getLabel(score);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Sentiment</span>
        <div className={cn("flex items-center gap-1 text-[10px] font-bold", color)}>
          <Icon className="h-3 w-3" />
          {label}
        </div>
      </div>
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full", color.replace("text-", "bg-"))}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-mono">
        <span>Frozen</span>
        <span>Frenzy</span>
      </div>
    </div>
  );
}

/* ============================================================
   VERTICAL DEPTH PANEL
   ============================================================ */
function VerticalDepthPanel({ items, selected, onSelect }: { items: InventoryItem[]; selected: string; onSelect: (v: string) => void }) {
  const stats = useMemo(() => {
    const map: Record<string, { count: number; sold: number; total: number; value: number }> = {};
    VERTICALS.forEach((v) => { if (v.slug !== "all") map[v.slug] = { count: 0, sold: 0, total: 0, value: 0 }; });
    items.forEach((item) => {
      const v = (item.hallVertical || "ledgerbiz").toLowerCase();
      if (map[v]) {
        map[v].count++;
        map[v].sold += item.quantitySold;
        map[v].total += item.quantity;
        map[v].value += item.price * (item.quantity - item.quantitySold);
      }
    });
    return map;
  }, [items]);

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <BarChart3 className="h-3 w-3" />
        Vertical Depth
      </h3>
      {VERTICALS.filter((v) => v.slug !== "all").map((v) => {
        const s = stats[v.slug];
        const ratio = s && s.total > 0 ? s.sold / s.total : 0;
        const isActive = selected === v.slug;
        const Icon = v.icon;
        return (
          <button
            key={v.slug}
            onClick={() => onSelect(isActive ? "all" : v.slug)}
            className={cn(
              "w-full group flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300 text-left",
              isActive
                ? "bg-slate-800/80 border-slate-700"
                : "bg-transparent border-transparent hover:bg-slate-900/50 hover:border-slate-800"
            )}
          >
            <div className={cn("h-8 w-8 rounded-lg border flex items-center justify-center shrink-0", VERTICAL_COLORS[v.slug])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs font-bold", isActive ? "text-slate-200" : "text-slate-400 group-hover:text-slate-300")}>
                  {v.label}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{s?.count || 0} listings</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", VERTICAL_COLORS[v.slug].split(" ")[0].replace("text-", "bg-"))}
                  initial={{ width: 0 }}
                  animate={{ width: `${(1 - ratio) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   SKELETON CARD
   ============================================================ */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-800 rounded w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-slate-800 rounded w-20" />
          <div className="h-8 bg-slate-800 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ENHANCED PRODUCT CARD
   ============================================================ */
function ProductCard({
  item,
  index,
  isWatchlisted,
  onToggleWatch,
  userTier,
  userHallIds,
}: {
  item: InventoryItem;
  index: number;
  isWatchlisted: boolean;
  onToggleWatch: (id: string) => void;
  userTier: string;
  userHallIds: Set<string>;
}) {
  const router = useRouter();
  const remaining = item.quantity - item.quantitySold;
  const stock = getStockStatus(item);
  const vSlug = (item.hallVertical || "ledgerbiz").toLowerCase();
  const VerticalIcon = getVerticalIcon(vSlug);
  const verticalStyle = VERTICAL_COLORS[vSlug] || VERTICAL_COLORS.ledgerbiz;
  const soldPercent = item.quantity > 0 ? (item.quantitySold / item.quantity) * 100 : 0;
  const isHot = soldPercent > 75 && remaining > 0;
  const isNew = isNewItem(item.listedAt);
  const platformFee = Math.round(item.price * 0.05);
  const totalWithFee = item.price + platformFee;
  const isOwnHall = userHallIds.has(item.hallId);
  const isHighValue = item.price > 5000;
  const kycBlocked = userTier === "visitor" && isHighValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className={cn(
        "group rounded-2xl border bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-slate-600 hover:shadow-xl flex flex-col relative",
        VERTICAL_GLOW[vSlug] || "shadow-cyan-500/10"
      )}
    >
      <div className="relative h-48 bg-slate-950 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <Package className="h-12 w-12 text-slate-700" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isNew && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 backdrop-blur-sm">
              New
            </span>
          )}
          {isHot && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-400 backdrop-blur-sm flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Hot
            </span>
          )}
          {isOwnHall && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
              Your Hall
            </span>
          )}
          {item.hallClass && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-400 backdrop-blur-sm">
              Class {item.hallClass}
            </span>
          )}
        </div>

        {/* Watchlist toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWatch(item.id); }}
          className={cn(
            "absolute top-3 right-3 h-8 w-8 rounded-lg border backdrop-blur-md flex items-center justify-center transition-all z-20",
            isWatchlisted
              ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
              : "bg-slate-950/60 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 opacity-0 group-hover:opacity-100"
          )}
        >
          {isWatchlisted ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-slate-950/90 backdrop-blur-sm border border-slate-700 text-slate-100 text-sm font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            {formatCurrency(item.price)}
          </span>
        </div>

        {/* Stock badge */}
        <div className="absolute bottom-3 left-3">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border backdrop-blur-sm", stock.color)}>
            {stock.label}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border", verticalStyle)}>
            <VerticalIcon className="inline h-3 w-3 mr-1" />
            {safeVerticalName(item.hallVertical)}
          </span>
          {item.hallSriScore && item.hallSriScore >= 80 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
              SRI {item.hallSriScore}
            </span>
          )}
        </div>

        <h3
          onClick={() => router.push(`/marketplace/inventory/${item.id}`)}
          className="text-sm font-bold text-slate-100 mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors cursor-pointer"
        >
          {item.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <Store className="h-3 w-3 text-slate-600" />
          <span className="text-[11px] text-slate-400">{item.hallName || "Unknown Hall"}</span>
          {item.hallClass && (
            <span className="text-[10px] text-slate-500 font-mono">• Class {item.hallClass}</span>
          )}
        </div>

        {/* Fee preview */}
        <div className="mb-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Item Price</span>
            <span className="text-slate-300 font-mono">{formatCurrency(item.price)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-slate-500">8th Ledger Fee (5%)</span>
            <span className="text-slate-400 font-mono">{formatCurrency(platformFee)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-800">
            <span className="text-slate-400 font-bold">Total</span>
            <span className="text-emerald-400 font-bold font-mono">{formatCurrency(totalWithFee)}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-slate-500 font-mono">{item.quantitySold} sold</span>
            <span className={cn("font-mono font-bold", remaining <= item.reorderThreshold ? "text-amber-400" : "text-emerald-400")}>
              {remaining} left
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, soldPercent)}%` }}
              transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
              className={cn(
                "h-full rounded-full",
                soldPercent >= 90 ? "bg-rose-500" : soldPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"
              )}
            />
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-800">
          {kycBlocked ? (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-amber-950/30 border border-amber-900/30 text-amber-400 cursor-not-allowed">
              <Lock className="h-3.5 w-3.5" />
              KYC Required (${formatCurrency(item.price)}+)
            </div>
          ) : remaining > 0 ? (
            <button
              onClick={() => router.push(`/marketplace/inventory/${item.id}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-all group/btn"
            >
              <ShoppingCart className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
              Acquire Now
              <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-600 cursor-not-allowed">
              <AlertCircle className="h-3.5 w-3.5" />
              Depleted
            </div>
          )}
        </div>
      </div>
    </motion.div>
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
      className="col-span-full flex flex-col items-center justify-center py-20"
    >
      <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
        <Package className="h-8 w-8 text-slate-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-300 mb-1">
        {hasFilters ? "No assets match your criteria" : "The Forge Awaits"}
      </h3>
      <p className="text-sm text-slate-500 max-w-md text-center">
        {hasFilters
          ? "Adjust your filters or search query to discover available assets."
          : "No inventory is currently listed. Check the Meridian Cycle for upcoming pools."}
      </p>
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

  const pages = [];
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
        className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {uniquePages.map((p, i) => (
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="text-xs text-slate-600 px-2">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              "h-9 w-9 rounded-lg border text-xs font-bold transition-all",
              p === page
                ? "bg-cyan-600 border-cyan-500/30 text-slate-950"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            )}
          >
            {p}
          </button>
        )
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function InventoryMarketplacePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVertical, setSelectedVertical] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "popular" | "velocity" | "sri">("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [showMyHallsOnly, setShowMyHallsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "dense">("grid");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data, error, isLoading } = useSWR<InventoryApiResponse>(
    `/api/marketplace/inventory?page=${page}&perPage=${perPage}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: userRes } = useSWR<UserApiResponse>("/api/user", fetcher);

  const items = data?.items || [];
  const totalItems = data?.total || 0;
  const userTier = userRes?.kycTier || "visitor";
  const userOwnerships = userRes?.ownerships || [];
  const userHallIds = useMemo(() => new Set(userOwnerships.map((o) => o.hallId).filter(Boolean) as string[]), [userOwnerships]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("8th-ledger-watchlist");
      if (saved) setWatchlist(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  const saveWatchlist = useCallback((ws: Set<string>) => {
    setWatchlist(ws);
    try { localStorage.setItem("8th-ledger-watchlist", JSON.stringify([...ws])); } catch { /* ignore */ }
  }, []);

  const toggleWatch = (id: string) => {
    const ws = new Set(watchlist);
    if (ws.has(id)) ws.delete(id); else ws.add(id);
    saveWatchlist(ws);
  };

  const filtered = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          (i.title || "").toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q) ||
          (i.hallName || "").toLowerCase().includes(q)
      );
    }

    if (selectedVertical !== "all") {
      result = result.filter((i) => (i.hallVertical || "").toLowerCase() === selectedVertical);
    }

    result = result.filter((i) => i.price >= priceRange[0] && i.price <= priceRange[1]);

    if (onlyInStock) {
      result = result.filter((i) => i.quantity - i.quantitySold > 0);
    }

    if (showWatchlistOnly) {
      result = result.filter((i) => watchlist.has(i.id));
    }

    if (showMyHallsOnly) {
      result = result.filter((i) => userHallIds.has(i.hallId));
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.quantitySold - a.quantitySold);
        break;
      case "velocity":
        result.sort((a, b) => (b.quantitySold / (b.quantity || 1)) - (a.quantitySold / (a.quantity || 1)));
        break;
      case "sri":
        result.sort((a, b) => (b.hallSriScore || 0) - (a.hallSriScore || 0));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.listedAt || 0).getTime() - new Date(a.listedAt || 0).getTime());
        break;
    }

    return result;
  }, [items, searchQuery, selectedVertical, sortBy, priceRange, onlyInStock, showWatchlistOnly, showMyHallsOnly, watchlist, userHallIds]);

  const hasActiveFilters =
    searchQuery || selectedVertical !== "all" || onlyInStock || sortBy !== "newest" || priceRange[1] < 100000 || showWatchlistOnly || showMyHallsOnly;

  const totalValue = useMemo(() => items.reduce((a, b) => a + b.price * (b.quantity - b.quantitySold), 0), [items]);
  const totalSold = useMemo(() => items.reduce((a, b) => a + b.quantitySold, 0), [items]);
  const hotItems = useMemo(() => items.filter((i) => i.quantitySold / (i.quantity || 1) > 0.75 && i.quantity - i.quantitySold > 0).length, [items]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, selectedVertical, sortBy, priceRange[0], priceRange[1], onlyInStock, showWatchlistOnly, showMyHallsOnly]);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.015] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/[0.015] rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/[0.008] rounded-full blur-[200px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative max-w-[1800px] mx-auto px-4 py-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <Package className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
                    The Forge <span className="text-emerald-400">Exchange</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sovereign Inventory Market • Real-time • Immutable
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Total Listings", value: totalItems.toLocaleString(), icon: Package, color: "cyan" },
                { label: "Inventory Value", value: formatCurrency(totalValue), icon: BarChart3, color: "emerald" },
                { label: "Units Sold", value: totalSold.toLocaleString(), icon: TrendingUp, color: "amber" },
                { label: "Hot Assets", value: hotItems, icon: Flame, color: "rose" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 min-w-[120px] hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={cn("h-3.5 w-3.5", `text-${stat.color}-400`)} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className={cn("text-lg font-black font-mono", `text-${stat.color}-400`)}>{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* KYC Gate Banner */}
        <AnimatePresence>
          {userTier === "visitor" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-3"
            >
              <Lock className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-300 font-medium">KYC Verification Required for High-Value Orders</p>
                <p className="text-xs text-amber-400/70">
                  You can browse and buy items under $5,000. For larger purchases, complete SIV/KYC verification.
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

        <div className="flex flex-col xl:flex-row gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:w-64 shrink-0 space-y-4"
          >
            <MarketSentiment items={items} />
            <VerticalDepthPanel items={items} selected={selectedVertical} onSelect={setSelectedVertical} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search assets, halls, verticals, sovereign IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded"
                  >
                    <X className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none pl-4 pr-10 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-300 focus:border-cyan-500/30 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <option value="newest">◈ Newest Listed</option>
                    <option value="price_asc">◈ Price: Low → High</option>
                    <option value="price_desc">◈ Price: High → Low</option>
                    <option value="popular">◈ Most Acquired</option>
                    <option value="velocity">◈ Velocity</option>
                    <option value="sri">◈ SRI Score</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all",
                    showFilters || hasActiveFilters
                      ? "bg-cyan-950/20 border-cyan-900/30 text-cyan-400"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />}
                </button>

                <button
                  onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all",
                    showWatchlistOnly
                      ? "bg-amber-950/20 border-amber-900/30 text-amber-400"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Watchlist</span>
                  {watchlist.size > 0 && <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded">{watchlist.size}</span>}
                </button>

                {userHallIds.size > 0 && (
                  <button
                    onClick={() => setShowMyHallsOnly(!showMyHallsOnly)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all",
                      showMyHallsOnly
                        ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">My Halls</span>
                  </button>
                )}

                <button
                  onClick={() => router.push("/marketplace/inventory/orders")}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
                >
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">My Orders</span>
                </button>

                <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn("px-3 py-3 transition-all", viewMode === "grid" ? "bg-slate-800 text-cyan-400" : "text-slate-500 hover:text-slate-300")}
                  >
                    <Layers className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("dense")}
                    className={cn("px-3 py-3 transition-all", viewMode === "dense" ? "bg-slate-800 text-cyan-400" : "text-slate-500 hover:text-slate-300")}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Sovereign Verticals
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {VERTICALS.map((v) => {
                          const Icon = v.icon;
                          const isActive = selectedVertical === v.slug;
                          return (
                            <button
                              key={v.slug}
                              onClick={() => setSelectedVertical(v.slug)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-300",
                                isActive
                                  ? "bg-cyan-950/30 border-cyan-900/50 text-cyan-400 shadow-lg shadow-cyan-500/5"
                                  : "bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
                          Max Acquisition Price: <span className="text-cyan-400 font-mono">{formatCurrency(priceRange[1])}</span>
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100000}
                          step={100}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                          className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-600 mt-2 font-mono">
                          <span>$0</span>
                          <span>$50k</span>
                          <span>$100k+</span>
                        </div>
                      </div>
                      <div className="flex items-end gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={onlyInStock}
                              onChange={(e) => setOnlyInStock(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="h-5 w-5 rounded border border-slate-700 bg-slate-800 peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500/50 transition-all flex items-center justify-center">
                              {onlyInStock && <Zap className="h-3 w-3 text-emerald-400" />}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Available only</span>
                        </label>
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedVertical("all");
                          setSortBy("newest");
                          setPriceRange([0, 100000]);
                          setOnlyInStock(false);
                          setShowWatchlistOnly(false);
                          setShowMyHallsOnly(false);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Reset all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Synchronizing with ledger...
                    </span>
                  ) : (
                    <>
                      <span className="text-slate-300 font-bold font-mono">{filtered.length}</span>
                      <span className="text-slate-500"> asset{filtered.length !== 1 ? "s" : ""} discovered</span>
                      {items.length !== filtered.length && (
                        <span className="text-slate-600 font-mono"> / {items.length} on page</span>
                      )}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => router.push("/marketplace/ownership")}
                className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1.5 transition-colors group"
              >
                <Shield className="h-3 w-3" />
                Ownership Market
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {isLoading ? (
              <div className={cn(
                "grid gap-4",
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-rose-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">Ledger synchronization failed</p>
                <p className="text-xs text-slate-500 mt-1">Retrying in 30 seconds...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className={cn(
                "grid gap-4",
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                <EmptyState hasFilters={hasActiveFilters} />
              </div>
            ) : (
              <>
                <div className={cn(
                  "grid gap-4",
                  viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                )}>
                  {filtered.map((item, i) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      index={i}
                      isWatchlisted={watchlist.has(item.id)}
                      onToggleWatch={toggleWatch}
                      userTier={userTier}
                      userHallIds={userHallIds}
                    />
                  ))}
                </div>
                <Pagination page={page} perPage={perPage} total={totalItems} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-cyan-600 border border-cyan-500/30 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 z-40"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </motion.button>
    </div>
  );
}