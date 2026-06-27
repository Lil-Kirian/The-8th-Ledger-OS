// app/(dashboard)/halls/[id]/marketplace/page.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp, Hexagon, Plane,
  Sprout, Sun, ChevronLeft, Search, LayoutGrid, List as ListIcon,
  ShoppingCart, Share2, Trophy, Clock, Shield, CheckCircle2, Wallet, Receipt, Package,
  Truck, Sparkles, Copy, Image as ImageIcon, X, Hash,
  Send, Heart, Bookmark, MessageCircle, ExternalLink, Play,
  AlertTriangle,
  Settings, Plus, Lock as LockIcon, TrendingUp as TrendIcon,
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type VerticalId = "ledgerprop" | "ledgerauto" | "ledgeredu" | "ledgeraccess" | "ledgerhealth" | "ledgerbiz" | "ledgertech" | "ledgertravel" | "ledgeragri" | "ledgerenergy" | "sportledger";

interface InventoryItem {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  quantitySold: number;
  costOfGoods: number;
  reorderThreshold: number;
  status: string;
  imageUrl?: string | null;
  images?: string | null; // JSON array
  tags?: string | null; // JSON array
  specs?: string | null; // JSON object
  listedAt: string;
  createdAt: string;
}

interface InventoryOrder {
  id: string;
  amount: number;
  quantity: number;
  status: string;
  createdAt: string;
  buyerId: string;
}

/* ============================================================
   VERTICAL CONFIG — 11 VERTICALS (INCLUDES SPORTLEDGER)
   ============================================================ */
const VERTICAL_CONFIG: Record<VerticalId, {
  name: string; color: string; bg: string; border: string;
  gradient: string; icon: React.ElementType;
}> = {
  ledgerprop: { name: "LedgerProp", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/5 to-orange-500/5", icon: Landmark },
  ledgerauto: { name: "LedgerAuto", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500/5 to-blue-500/5", icon: Zap },
  ledgeredu: { name: "LedgerEdu", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/5 to-purple-500/5", icon: Crown },
  ledgeraccess: { name: "LedgerAccess", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/5 to-teal-500/5", icon: Lock },
  ledgerhealth: { name: "LedgerHealth", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500/5 to-pink-500/5", icon: HeartPulse },
  ledgerbiz: { name: "LedgerBiz", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/5 to-red-500/5", icon: TrendingUp },
  ledgertech: { name: "LedgerTech", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/5 to-blue-500/5", icon: Hexagon },
  ledgertravel: { name: "LedgerTravel", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/5 to-cyan-500/5", icon: Plane },
  ledgeragri: { name: "LedgerAgri", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", gradient: "from-green-500/5 to-emerald-500/5", icon: Sprout },
  ledgerenergy: { name: "LedgerEnergy", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/5 to-amber-500/5", icon: Sun },
  sportledger: { name: "SportLedger", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/5 to-red-500/5", icon: Trophy },
};

/* ============================================================
   FETCHER
   ============================================================ */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function getItemImage(item: InventoryItem): string | null {
  if (item.imageUrl) return item.imageUrl;
  if (item.images) {
    try {
      const parsed = JSON.parse(item.images) as string[];
      return parsed[0] || null;
    } catch {
      return null;
    }
  }
  return null;
}

function getItemTags(item: InventoryItem): string[] {
  if (!item.tags) return [];
  try {
    return JSON.parse(item.tags) as string[];
  } catch {
    return [];
  }
}

function getVerticalConfig(hall: unknown): typeof VERTICAL_CONFIG[VerticalId] {
  const vid = (hall?.pool?.verticalId || hall?.verticalId || "ledgerprop") as VerticalId;
  return VERTICAL_CONFIG[vid] || VERTICAL_CONFIG.ledgerprop;
}

/* ============================================================
   COMPONENT — Item Card
   ============================================================ */
function ItemCard({
  item,
  config,
  onShare,
  onBuy,
  canBuy,
}: {
  item: InventoryItem;
  config: typeof VERTICAL_CONFIG[VerticalId];
  onShare: (item: InventoryItem) => void;
  onBuy: (item: InventoryItem) => void;
  canBuy: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const img = getItemImage(item);
  const tags = getItemTags(item);
  const isOut = item.quantity === 0;
  const isLow = item.quantity <= item.reorderThreshold && item.quantity > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm transition-all hover:border-white/10 hover:shadow-[0_0_40px_-15px_rgba(255,255,255,0.05)]",
        isOut && "opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-800">
        {img ? (
          <img src={img} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isOut ? (
            <span className="rounded-lg bg-red-500/20 border border-red-500/20 px-2 py-1 text-[9px] font-bold text-red-400">
              Out of Stock
            </span>
          ) : isLow ? (
            <span className="rounded-lg bg-amber-500/20 border border-amber-500/20 px-2 py-1 text-[9px] font-bold text-amber-400">
              Low Stock
            </span>
          ) : (
            <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 text-[9px] font-bold text-emerald-400">
              Available
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1">
          <button
            onClick={() => setSaved(!saved)}
            className={cn(
              "rounded-lg p-1.5 backdrop-blur-md transition-all",
              saved ? "bg-amber-500/20 text-amber-400" : "bg-black/40 text-white/40 hover:text-white"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-amber-400/20")} />
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className={cn(
              "rounded-lg p-1.5 backdrop-blur-md transition-all",
              liked ? "bg-rose-500/20 text-rose-400" : "bg-black/40 text-white/40 hover:text-white"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-rose-400/20")} />
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", config.bg)}>
              <config.icon className={cn("h-3 w-3", config.color)} />
            </div>
            <span className="text-[10px] text-white/60">{config.name}</span>
          </div>
          <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-white/30 line-clamp-2 mb-3">{item.description}</p>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-white">{formatCurrency(item.price)}</p>
            <p className="text-[10px] text-white/20">COGS: {formatCurrency(item.costOfGoods)}</p>
          </div>
          <div className="text-right">
            <p className={cn("text-sm font-medium", isLow ? "text-amber-400" : isOut ? "text-red-400" : "text-slate-300")}>
              {item.quantity} left
            </p>
            <p className="text-[10px] text-white/20">{item.quantitySold} sold</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] text-white/30 border border-white/5">
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[9px] text-white/20">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBuy(item)}
            disabled={!canBuy || isOut}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5",
              !canBuy || isOut
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20 hover:shadow-cyan-500/30"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isOut ? "Sold Out" : canBuy ? "Buy via Escrow" : "KYC Required"}
          </button>
          <button
            onClick={() => onShare(item)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Share Forge Modal
   ============================================================ */
function ShareForgeModal({
  item,
  hall,
  open,
  onClose,
}: {
  item: InventoryItem | null;
  hall: unknown;
  open: boolean;
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState<"whatsapp" | "telegram" | "twitter" | "instagram" | "tiktok">("twitter");
  const [customMessage, setCustomMessage] = useState("");
  const [copied, setCopied] = useState(false);

  if (!open || !item || !hall) return null;

  const platforms = [
    { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, color: "text-emerald-400" },
    { id: "telegram" as const, label: "Telegram", icon: Send, color: "text-sky-400" },
    { id: "twitter" as const, label: "X / Twitter", icon: Hash, color: "text-white" },
    { id: "instagram" as const, label: "Instagram", icon: ImageIcon, color: "text-rose-400" },
    { id: "tiktok" as const, label: "TikTok", icon: Play, color: "text-cyan-400" },
  ];

  const defaultMessage = `I own this through 8th Ledger. ${item.title} — ${formatCurrency(item.price)}.`;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/marketplace/inventory/${item.id}?ref=${hall.id}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const img = getItemImage(item);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-3xl border border-violet-500/20 bg-[#0a0a14]/95 p-6 shadow-[0_0_60px_-15px_rgba(139,92,246,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Share2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Share Forge</h3>
                <p className="text-xs text-white/30">Generate branded share card + ref link</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-white/30 hover:text-white hover:bg-white/5 transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Preview Card */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-4 mb-4">
            <div className="flex gap-3">
              {img ? (
                <img src={img} alt={item.title} className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-slate-800 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-slate-700" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                <p className="text-lg font-bold text-violet-400 mt-0.5">{formatCurrency(item.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/20">Ref: {hall.id?.slice(-8)}</span>
                  <span className="text-[10px] text-violet-400/50">5% commission</span>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-violet-500/10 bg-violet-500/5 p-2.5">
              <p className="text-xs text-white/40">{customMessage || defaultMessage}</p>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600" />
              <span className="text-[10px] text-white/20">I own this via 8th Ledger</span>
            </div>
          </div>

          {/* Platform Picker */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-bold transition-all border",
                    platform === p.id
                      ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                      : "bg-white/5 text-white/30 border-white/5 hover:bg-white/[0.07]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", p.color)} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Message */}
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-2 block">Custom Message</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={defaultMessage}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-violet-500/30 focus:bg-white/[0.07] resize-none transition-all"
            />
          </div>

          {/* Ref Link */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/40 font-mono truncate">
              {shareUrl}
            </div>
            <button
              onClick={copyLink}
              className={cn(
                "rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5",
                copied ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20"
              )}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30 flex items-center justify-center gap-2">
            <Share2 className="h-4 w-4" />Share to {platforms.find((p) => p.id === platform)?.label}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   COMPONENT — Escrow Modal (BLUEPRINT: 48h + 5% fee + fulfillment)
   ============================================================ */
function EscrowModal({
  item,
  hall,
  userKycTier,
  open,
  onClose,
  onConfirm,
}: {
  item: InventoryItem | null;
  hall: unknown;
  userKycTier: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (item: InventoryItem) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card" | "bank">("wallet");

  if (!open || !item) return null;

  const platformFee = Math.round(item.price * 0.05);
  const fulfillmentEstimate = Math.round(item.price * 0.08); // 8% estimated fulfillment
  const totalToPay = item.price + platformFee + fulfillmentEstimate;

  const kycBlocked = userKycTier === "visitor";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-3xl border border-cyan-500/20 bg-[#0a0a14]/95 p-6 shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Shield className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Escrow Purchase</h3>
                <p className="text-xs text-white/30">Funds held by 8th Ledger for 48 hours</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-white/30 hover:text-white hover:bg-white/5 transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* KYC Block */}
          {kycBlocked && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/20 p-4">
              <div className="flex items-start gap-2">
                <LockIcon className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-400">KYC Verification Required</p>
                  <p className="text-[10px] text-red-300/60 mt-1">
                    Complete KYC verification to purchase items on the 8th Ledger Exchange.
                  </p>
                  <Link href="/kyc" onClick={onClose}>
                    <button className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-all">
                      Go to KYC
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { num: 1, label: "Review" },
              { num: 2, label: "Fees" },
              { num: 3, label: "Pay" },
              { num: 4, label: "Confirm" },
            ].map((s) => (
              <div key={s.num} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step >= s.num ? "bg-cyan-500 text-white" : "bg-white/5 text-white/20"
                )}>
                  {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                </div>
                <span className={cn("text-[9px]", step >= s.num ? "text-cyan-400" : "text-white/20")}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Review */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                {getItemImage(item) ? (
                  <img src={getItemImage(item)!} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-slate-800 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-slate-700" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white">{item.title}</p>
                  <p className="text-lg font-bold text-cyan-400">{formatCurrency(item.price)}</p>
                  <p className="text-[10px] text-white/20">Hall: {hall?.name || "Unknown"}</p>
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/10 bg-amber-950/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/60">
                    Funds held in 8th Ledger escrow for 48 hours. Released to hall treasury after delivery confirmation. Either party may flag for review during the hold period.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={kycBlocked}
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-bold transition-all",
                  kycBlocked
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                )}
              >
                Review Fee Breakdown
              </button>
            </div>
          )}

          {/* Step 2: Fee Breakdown (BLUEPRINT) */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-white/30 mb-2">8th Ledger handles fulfillment. Fees deducted before hall treasury deposit.</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Item Price</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white">{formatCurrency(item.price)}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-amber-500/10 bg-amber-950/10 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-400">Fulfillment</p>
                      <p className="text-[10px] text-white/20">Shipping & handling</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-amber-400">+ {formatCurrency(fulfillmentEstimate)}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-cyan-500/10 bg-cyan-950/10 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-cyan-400">8th Ledger Platform Fee</p>
                      <p className="text-[10px] text-white/20">5% of item price</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-cyan-400">+ {formatCurrency(platformFee)}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-emerald-500/10 bg-emerald-950/10 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">Net to Hall Treasury</p>
                      <p className="text-[10px] text-white/20">Distributed as dividends</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(item.price - platformFee)}</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 flex items-center justify-between text-sm font-bold">
                <span className="text-white">Total You Pay</span>
                <span className="text-cyan-400">{formatCurrency(totalToPay)}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30">
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {[
                  { id: "wallet" as const, label: "Ledger Wallet", icon: Wallet },
                  { id: "card" as const, label: "Card", icon: Receipt },
                  { id: "bank" as const, label: "Bank", icon: Landmark },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 rounded-xl py-3 text-[10px] font-bold transition-all border",
                        paymentMethod === m.id
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          : "bg-white/5 text-white/30 border-white/5 hover:bg-white/[0.07]"
                      )}
                    >
                      <Icon className="h-4 w-4" />{m.label}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/30">Item Price</span>
                  <span className="text-white">{formatCurrency(item.price)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/30">Fulfillment</span>
                  <span className="text-white">{formatCurrency(fulfillmentEstimate)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/30">Platform Fee (5%)</span>
                  <span className="text-white">{formatCurrency(platformFee)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-cyan-400">{formatCurrency(totalToPay)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  Back
                </button>
                <button onClick={() => setStep(4)} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30">
                  Confirm Purchase
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Escrow Funded</h3>
              <p className="text-xs text-white/30">
                {formatCurrency(totalToPay)} held in 8th Ledger escrow. 48-hour hold active. Seller notified. Track delivery in your orders.
              </p>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[10px] text-white/20 mb-1">Order Status</p>
                <p className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  48h Escrow Active
                </p>
              </div>
              <button
                onClick={() => {
                  onConfirm(item);
                  onClose();
                }}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
              >
                View My Orders
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallMarketplacePage() {
  const params = useParams();
  const hallId = params.id as string;

  const { data: hall, isLoading: hallLoading } = useSWR(`/api/halls/${hallId}`, fetcher);
  const { data: inventoryData, isLoading: inventoryLoading } = useSWR(`/api/halls/${hallId}/inventory`, fetcher);
  const { data: ordersData } = useSWR(`/api/halls/${hallId}/marketplace/orders`, fetcher);

  const items: InventoryItem[] = inventoryData?.items || [];
  const orders: InventoryOrder[] = ordersData?.orders || [];
  const config = getVerticalConfig(hall);
  const HallIcon = config.icon;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [shareItem, setShareItem] = useState<InventoryItem | null>(null);
  const [buyItem, setBuyItem] = useState<InventoryItem | null>(null);
  const [showShareForge, setShowShareForge] = useState(false);
  const [showEscrow, setShowEscrow] = useState(false);

  const inventoryEnabled = hall?.inventoryEnabled || false;
  const canManage = hall?.canManage || hall?.isAdmin || false;
  const userKycTier = hall?.userKycTier || "visitor";

  const filteredItems = items.filter((item) => {
    if (filterCategory !== "all" && item.status !== filterCategory) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = [
    { key: "all", label: "All Items" },
    { key: "active", label: "Listed" },
    { key: "inactive", label: "Hidden" },
  ];

  const totalStockValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalRevenue = orders.reduce((sum, o) => (o.status === "completed" ? sum + o.amount : sum), 0);
  const activeEscrows = orders.filter((o) => o.status === "pending").length;

  const handleBuy = async (item: InventoryItem) => {
    try {
      const res = await fetch(`/api/marketplace/inventory/${item.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 1, paymentMethod: "wallet" }),
      });
      if (res.ok) {
        setBuyItem(null);
        setShowEscrow(false);
        // Refresh orders
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "Purchase failed");
      }
    } catch (e) {
      alert("Network error");
    }
  };

  if (hallLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-slate-500">Loading hall data...</div>
      </div>
    );
  }

  if (!inventoryEnabled) {
    return (
      <div className="min-h-screen bg-[#0a0a14] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/halls/${hallId}`}>
              <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Link>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-12 text-center">
            <LockIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Marketplace Locked</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              The inventory marketplace is not enabled for this hall. Propose a vote to activate it through the Operations dashboard.
            </p>
            <Link href={`/halls/${hallId}/operations`}>
              <button className="rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-6 py-3 text-sm font-bold hover:bg-cyan-500/30 transition-all">
                <Settings className="w-4 h-4 mr-2 inline" />
                Go to Operations
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/halls/${hallId}`}>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </Link>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10", config.bg)}>
                <HallIcon className={cn("h-5 w-5", config.color)} />
              </div>
              <div>
                <h1 className={cn("text-xl font-bold", config.color)}>{config.name} Marketplace</h1>
                <p className="text-xs text-white/30">{hall?.name || "Hall"} — Inventory Storefront</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <Link href={`/halls/${hallId}/inventory`}>
                  <button className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Manage Stock
                  </button>
                </Link>
              )}
              <Link href="/marketplace/inventory" target="_blank">
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Public Store
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Items Listed</span>
              <Package className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Stock Value</span>
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalStockValue)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Revenue</span>
              <TrendIcon className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-violet-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">Active Escrows</span>
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{activeEscrows}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilterCategory(cat.key)}
                className={cn(
                  "rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap border",
                  filterCategory === cat.key
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/[0.02] text-white/30 border-white/5 hover:bg-white/[0.05] hover:text-white/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.07] transition-all"
              />
            </div>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button onClick={() => setViewMode("grid")} className={cn("rounded-lg p-1.5 transition-all", viewMode === "grid" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40")}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={cn("rounded-lg p-1.5 transition-all", viewMode === "list" ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40")}>
                <ListIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {inventoryLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-500">Loading inventory...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <Package className="mx-auto h-10 w-10 text-white/10 mb-4" />
            <p className="text-sm text-white/30 mb-2">No items in this hall's inventory yet.</p>
            {canManage && (
              <Link href={`/halls/${hallId}/inventory`}>
                <button className="mt-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-2 text-xs font-bold hover:bg-cyan-500/30 transition-all">
                  <Plus className="w-3.5 h-3.5 mr-1 inline" />
                  Add First Item
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className={cn(
            "gap-5",
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  config={config}
                  onShare={(item) => { setShareItem(item); setShowShareForge(true); }}
                  onBuy={(item) => { setBuyItem(item); setShowEscrow(true); }}
                  canBuy={userKycTier !== "visitor"}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredItems.length === 0 && items.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <Search className="mx-auto h-10 w-10 text-white/10 mb-4" />
            <p className="text-sm text-white/30">No items match your filters.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ShareForgeModal
        item={shareItem}
        hall={hall}
        open={showShareForge}
        onClose={() => setShowShareForge(false)}
      />
      <EscrowModal
        item={buyItem}
        hall={hall}
        userKycTier={userKycTier}
        open={showEscrow}
        onClose={() => setShowEscrow(false)}
        onConfirm={handleBuy}
      />
    </div>
  );
}