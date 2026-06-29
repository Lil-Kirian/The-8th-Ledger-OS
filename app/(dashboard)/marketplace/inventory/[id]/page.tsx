"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Store,
  Star,
  Shield,
  AlertCircle,
  Check,
  Minus,
  Plus,
  Zap,
  Flame,
  ArrowRight,
  Share2,
  Bookmark,
  BookmarkCheck,
  Layers,
  FileText,
  Lock,
  ChevronRight,
  Loader2,
  Clock,
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
  hallAhgiScore?: number;
  hallClass?: string;
  imageUrl?: string;
  images?: string[];
  specs?: Record<string, string>;
  tags?: string[];
}

interface HallStats {
  totalRevenue: number;
  activeOwners: number;
  totalDividendDistributed: number;
  assetAge: number;
}

interface DetailResponse {
  item?: InventoryItem;
  related?: InventoryItem[];
  hallStats?: HallStats;
  error?: string;
}

interface UserApiResponse {
  success?: boolean;
  kycTier?: string;
  ownerships?: { hallId?: string; hall?: { name: string; id: string; hallClass?: string }; ownershipPercent: number }[];
}

interface OrderApiResponse {
  success?: boolean;
  orders?: { inventoryId: string; quantity: number; status: string; createdAt: string }[];
}

/* ============================================================
   CONFIG
   ============================================================ */
const VERTICAL_LABELS: Record<string, string> = {
  ledgerbiz: "LedgerBiz", ledgeragri: "LedgerAgri", ledgertech: "LedgerTech",
  ledgerprop: "LedgerProp", ledgerauto: "LedgerAuto", ledgeredu: "LedgerEdu",
  ledgeraccess: "LedgerAccess", ledgerhealth: "LedgerHealth",
  ledgertravel: "LedgerTravel", ledgerenergy: "LedgerEnergy", ledgersport: "SportLedger",
};

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

/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ============================================================
   IMAGE GALLERY
   ============================================================ */
function ImageGallery({ item }: { item: InventoryItem }) {
  const images = item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
        <Package className="h-16 w-16 text-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden group">
        <motion.img key={active} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} src={images[active]} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        {images.length > 1 && (
          <>
            <button onClick={() => setActive((a) => (a - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-cyan-500/30">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setActive((a) => (a + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-cyan-500/30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-cyan-400" : "w-3 bg-slate-600 hover:bg-slate-500")} />
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)} className={cn("h-16 w-16 rounded-lg border overflow-hidden shrink-0 transition-all", i === active ? "border-cyan-500/50 ring-1 ring-cyan-500/20" : "border-slate-800 opacity-60 hover:opacity-100")}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ACQUISITION PANEL — REAL API CALL
   ============================================================ */
function AcquisitionPanel({
  item,
  userTier,
  isOwnHall,
  existingOrderQty,
}: {
  item: InventoryItem;
  userTier: string;
  isOwnHall: boolean;
  existingOrderQty: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const remaining = item.quantity - item.quantitySold;
  const maxQty = Math.min(remaining, 10);
  const subtotal = item.price * qty;
  const platformFee = Math.round(subtotal * 0.05);
  const fulfillmentCost = Math.round(subtotal * 0.15); // Estimated
  const total = subtotal + platformFee + fulfillmentCost;
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [acquired, setAcquired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const isVisitor = userTier === "visitor";
  const isHighValue = total > 5000 || qty > 5;
  const kycBlocked = isVisitor && isHighValue;
  const canBuy = !kycBlocked && remaining > 0;

  const handleAcquire = async () => {
    if (!canBuy) return;
    setIsAcquiring(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketplace/inventory/${item.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Acquisition failed");
      }

      setOrderId(data.orderId);
      setAcquired(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsAcquiring(false);
    }
  };

  if (remaining <= 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="h-6 w-6 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-rose-400 mb-1">Asset Depleted</h3>
        <p className="text-sm text-slate-500">This item is sold out. Check the marketplace for similar assets.</p>
      </div>
    );
  }

  if (acquired && orderId) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Check className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-emerald-400 mb-1">Acquisition Confirmed</h3>
        <p className="text-sm text-slate-400 mb-2">{qty} × {item.title} for {formatCurrency(total)}</p>
        <p className="text-xs text-slate-500 mb-4">Order ID: <span className="font-mono text-slate-400">{orderId}</span></p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => router.push("/marketplace/inventory/orders")}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5 inline mr-1" />
            My Orders
          </button>
          <button
            onClick={() => router.push("/marketplace/inventory")}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
      {/* Ownership context */}
      {isOwnHall && (
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">You own {existingOrderQty > 0 ? `${existingOrderQty} units of ` : ""}this hall</span>
        </div>
      )}

      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-slate-100">{formatCurrency(item.price)}</span>
          <span className="text-sm text-slate-500">/ unit</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("px-2 py-0.5 rounded border", remaining <= item.reorderThreshold ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20")}>
            {remaining} units remaining
          </span>
          <span className="text-slate-600">{item.quantitySold} acquired</span>
          {existingOrderQty > 0 && (
            <span className="text-emerald-400 text-[10px] font-bold">• You own {existingOrderQty}</span>
          )}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Quantity</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="h-10 w-10 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 flex items-center justify-center hover:border-slate-600 disabled:opacity-30 transition-all">
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-lg font-black text-slate-100 w-12 text-center font-mono">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="h-10 w-10 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 flex items-center justify-center hover:border-slate-600 disabled:opacity-30 transition-all">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {qty >= maxQty && remaining > 10 && (
          <p className="text-[10px] text-amber-400 mt-1.5">Max 10 units per order</p>
        )}
        {qty >= remaining && remaining <= 10 && (
          <p className="text-[10px] text-amber-400 mt-1.5">Only {remaining} units left</p>
        )}
      </div>

      <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Subtotal ({qty} × {formatCurrency(item.price)})</span>
          <span className="text-slate-300 font-mono">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">8th Ledger Platform Fee (5%)</span>
          <span className="text-slate-400 font-mono">{formatCurrency(platformFee)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Fulfillment & Shipping</span>
          <span className="text-slate-400 font-mono">{formatCurrency(fulfillmentCost)}</span>
        </div>
        <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Total</span>
          <span className="text-lg font-black text-cyan-400 font-mono">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Escrow notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-950/30 border border-slate-800/50">
        <Clock className="h-3.5 w-3.5 text-slate-500" />
        <p className="text-[10px] text-slate-500">
          Funds held in 48-hour escrow. You may cancel for full refund within this window.
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <p className="text-xs text-rose-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Block */}
      {kycBlocked ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
          <Lock className="h-5 w-5 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-amber-400 mb-1">KYC Required</p>
          <p className="text-xs text-amber-400/70 mb-3">
            This order exceeds $5,000. Complete SIV/KYC to unlock high-value purchases.
          </p>
          <button
            onClick={() => router.push("/kyc")}
            className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors"
          >
            Verify Identity
          </button>
        </div>
      ) : (
        <button onClick={handleAcquire} disabled={isAcquiring || !canBuy} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-all active:scale-[0.98] disabled:opacity-50">
          {isAcquiring ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><ShoppingCart className="h-4 w-4" />Acquire {qty} Unit{qty > 1 ? "s" : ""}</>}
        </button>
      )}

      <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Insured</span>
        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Escrow</span>
        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Instant</span>
      </div>
    </div>
  );
}

/* ============================================================
   HALL TELEMETRY
   ============================================================ */
function HallTelemetry({ item, stats }: { item: InventoryItem; stats?: HallStats }) {
  const vSlug = (item.hallVertical || "ledgerbiz").toLowerCase();
  const vStyle = VERTICAL_COLORS[vSlug] || VERTICAL_COLORS.ledgerbiz;
  const soldPercent = item.quantity > 0 ? Math.round((item.quantitySold / item.quantity) * 100) : 0;

  const metrics = [
    { label: "SRI Score", value: item.hallSriScore ?? 50, max: 100, color: "bg-amber-400" },
    { label: "AHGI Score", value: item.hallAhgiScore ?? 50, max: 100, color: "bg-cyan-400" },
    { label: "Sell-Through", value: soldPercent, max: 100, color: "bg-emerald-400" },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center", vStyle)}>
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">{item.hallName}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              {VERTICAL_LABELS[vSlug] || "Unknown"}
              {item.hallClass && <span className="ml-1 text-slate-400">• Class {item.hallClass}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => { /* router.push(`/halls/${item.hallId}`) */ }}
          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
        >
          Enter Hall <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
              <span className="text-xs font-mono text-slate-300">{m.value}/{m.max}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(m.value / m.max) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} className={cn("h-full rounded-full", m.color)} />
            </div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
          {stats.totalRevenue !== undefined && (
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hall Revenue</p><p className="text-sm font-black text-slate-200 font-mono">{formatCurrency(stats.totalRevenue)}</p></div>
          )}
          {stats.activeOwners !== undefined && (
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sovereign Owners</p><p className="text-sm font-black text-slate-200 font-mono">{stats.activeOwners}</p></div>
          )}
          {stats.totalDividendDistributed !== undefined && (
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Dividends Paid</p><p className="text-sm font-black text-emerald-400 font-mono">{formatCurrency(stats.totalDividendDistributed)}</p></div>
          )}
          {stats.assetAge !== undefined && (
            <div><p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Asset Age</p><p className="text-sm font-black text-slate-200 font-mono">{stats.assetAge} mo</p></div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SPEC GRID
   ============================================================ */
function SpecGrid({ specs }: { specs?: Record<string, string> }) {
  if (!specs || !Object.keys(specs).length) return null;
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText className="h-3.5 w-3.5" />Asset Specifications</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(specs).map(([key, value]) => (
          <div key={key} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{key}</p>
            <p className="text-sm font-bold text-slate-200">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   RELATED CAROUSEL
   ============================================================ */
function RelatedCarousel({ items, currentId }: { items?: InventoryItem[]; currentId: string }) {
  const router = useRouter();
  const filtered = items?.filter((i) => i.id !== currentId).slice(0, 6) || [];
  if (!filtered.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers className="h-3.5 w-3.5" />Related Assets</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {filtered.map((item, i) => {
          const remaining = item.quantity - item.quantitySold;
          return (
            <motion.button key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onClick={() => router.push(`/marketplace/inventory/${item.id}`)} className="group text-left bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all">
              <div className="h-28 bg-slate-950 relative overflow-hidden">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-slate-700" /></div>}
                {remaining <= 0 && <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center"><span className="text-[10px] font-bold text-rose-400 uppercase">Sold Out</span></div>}
              </div>
              <div className="p-3">
                <p className="text-[11px] font-bold text-slate-200 line-clamp-1 mb-1 group-hover:text-cyan-400 transition-colors">{item.title}</p>
                <p className="text-xs text-emerald-400 font-mono font-bold">{formatCurrency(item.price)}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, error, isLoading } = useSWR<DetailResponse>(id ? `/api/marketplace/inventory/${id}` : null, fetcher);
  const { data: userRes } = useSWR<UserApiResponse>("/api/user", fetcher);
  const { data: ordersRes } = useSWR<OrderApiResponse>("/api/marketplace/inventory/orders", fetcher);

  const [watchlisted, setWatchlisted] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const userTier = userRes?.kycTier || "visitor";
  const userHallIds = useMemo(() => new Set((userRes?.ownerships || []).map((o) => o.hallId).filter(Boolean) as string[]), [userRes]);
  const existingOrderQty = useMemo(() => {
    return (ordersRes?.orders || []).filter((o) => o.inventoryId === id).reduce((a, o) => a + o.quantity, 0);
  }, [ordersRes, id]);

  useEffect(() => {
    try { const saved = localStorage.getItem("8th-ledger-watchlist"); if (saved) setWatchlisted(new Set(JSON.parse(saved)).has(id)); } catch { /* ignore */ }
  }, [id]);

  const toggleWatch = () => {
    setWatchlisted((w) => {
      const next = !w;
      try { const saved = new Set(JSON.parse(localStorage.getItem("8th-ledger-watchlist") || "[]")); if (next) saved.add(id); else saved.delete(id); localStorage.setItem("8th-ledger-watchlist", JSON.stringify([...saved])); } catch { /* ignore */ }
      return next;
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-500">Loading asset telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.item) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-300 mb-1">Asset Not Found</h2>
          <p className="text-sm text-slate-500 mb-4">This item may have been removed or depleted.</p>
          <button onClick={() => router.push("/marketplace/inventory")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">Back to Marketplace</button>
        </div>
      </div>
    );
  }

  const item = data.item;
  const remaining = item.quantity - item.quantitySold;
  const vSlug = (item.hallVertical || "ledgerbiz").toLowerCase();
  const vStyle = VERTICAL_COLORS[vSlug] || VERTICAL_COLORS.ledgerbiz;
  const isOwnHall = userHallIds.has(item.hallId);

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/[0.015] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/[0.015] rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 py-6 z-10">
        {/* Breadcrumb + Actions */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/marketplace/inventory")} className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Forge Exchange
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleWatch} className={cn("h-9 w-9 rounded-lg border flex items-center justify-center transition-all", watchlisted ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-500/30")}>
              {watchlisted ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
            <button onClick={handleShare} className="h-9 w-9 rounded-lg border bg-slate-900 border-slate-800 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 flex items-center justify-center transition-all">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Share Toast */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-6 right-6 z-50 bg-slate-900 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg">
              <Check className="h-3.5 w-3.5" /> Link copied to clipboard
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* Left: Images */}
          <div className="lg:col-span-5"><ImageGallery item={item} /></div>

          {/* Center: Info */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border", vStyle)}>
                  {VERTICAL_LABELS[vSlug] || "Unknown"}
                </span>
                {item.hallClass && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-950/80 border border-slate-700 px-2 py-1 rounded-lg">
                    Class {item.hallClass}
                  </span>
                )}
                {item.hallSriScore && item.hallSriScore >= 80 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1"><Star className="h-3 w-3" /> SRI {item.hallSriScore}</span>
                )}
                {remaining <= item.reorderThreshold && remaining > 0 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1"><Flame className="h-3 w-3" /> Low Stock</span>
                )}
                {remaining <= 0 && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">Depleted</span>
                )}
                {existingOrderQty > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Check className="h-3 w-3" /> You own {existingOrderQty}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-100 mb-2 leading-tight">{item.title}</h1>
              <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => <span key={tag} className="text-[10px] text-slate-500 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">{tag}</span>)}
              </div>
            )}

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Listed</span><span className="text-xs text-slate-300 font-mono">{formatDate(item.listedAt)}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Last Updated</span><span className="text-xs text-slate-300 font-mono">{formatDate(item.updatedAt)}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Cost of Goods</span><span className="text-xs text-slate-300 font-mono">{formatCurrency(item.costOfGoods)}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Status</span><span className={cn("text-xs font-bold", item.status === "active" ? "text-emerald-400" : "text-amber-400")}>{item.status}</span></div>
            </div>

            <SpecGrid specs={item.specs} />
          </div>

          {/* Right: Acquisition + Hall */}
          <div className="lg:col-span-3 space-y-4">
            <AcquisitionPanel
              item={item}
              userTier={userTier}
              isOwnHall={isOwnHall}
              existingOrderQty={existingOrderQty}
            />
            <HallTelemetry item={item} stats={data.hallStats} />
          </div>
        </div>

        {/* Related */}
        <RelatedCarousel items={data.related} currentId={item.id} />
      </div>
    </div>
  );
}