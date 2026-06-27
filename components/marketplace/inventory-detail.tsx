// components/marketplace/inventory-detail.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Minus,
  Star,
  Clock,
  X,
  Info,
  Wallet,
  Lock,
  Percent,
  Tag,
  ImageIcon,
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
   TYPES
   ============================================================ */
export interface InventoryItemData {
  id: string;
  hallId: string;
  hallName: string;
  hallClass: "I" | "II" | "III";
  verticalId: string;
  verticalName: string;
  country: string;
  countryFlag: string;
  title: string;
  description: string;
  price: number; // cents
  quantity: number;
  quantitySold: number;
  costOfGoods: number; // cents
  reorderThreshold: number;
  status: "active" | "inactive";
  listedAt: string;
  imageUrl?: string | null;
  images?: string | null; // JSON array
  tags?: string | null; // JSON array
  specs?: string | null; // JSON object
  rating?: number;
  reviewCount?: number;
}

interface InventoryDetailProps {
  item: InventoryItemData;
  onClose: () => void;
  onBuy?: (itemId: string, quantity: number) => void;
  userLedgerBalance?: number;
  userKycTier?: string;
}

const hallClassConfig = {
  I: { label: "CLASS I — PASSIVE", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  II: { label: "CLASS II — MANAGED", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  III: { label: "CLASS III — ACTIVE", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100);
}

function getItemImages(item: InventoryItemData): string[] {
  const imgs: string[] = [];
  if (item.imageUrl) imgs.push(item.imageUrl);
  if (item.images) {
    try {
      const parsed = JSON.parse(item.images) as string[];
      parsed.forEach((url) => { if (!imgs.includes(url)) imgs.push(url); });
    } catch { /* ignore */ }
  }
  return imgs;
}

function getItemTags(item: InventoryItemData): string[] {
  if (!item.tags) return [];
  try {
    return JSON.parse(item.tags) as string[];
  } catch {
    return [];
  }
}

function getItemSpecs(item: InventoryItemData): Record<string, string> {
  if (!item.specs) return {};
  try {
    return JSON.parse(item.specs) as Record<string, string>;
  } catch {
    return {};
  }
}

export function InventoryDetail({
  item,
  onClose,
  onBuy,
  userLedgerBalance = 0,
  userKycTier = "visitor",
}: InventoryDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "hall" | "revenue">("details");
  const [activeImage, setActiveImage] = useState(0);

  const available = item.quantity - item.quantitySold;
  const isSoldOut = item.quantity === 0;
  const isLowStock = available <= item.reorderThreshold && available > 0;
  const hallClass = hallClassConfig[item.hallClass];
  const margin = item.price > 0 ? Math.round(((item.price - item.costOfGoods) / item.price) * 100) : 0;

  const platformFee = Math.round(item.price * 0.05);
  const fulfillmentEstimate = Math.round(item.price * 0.08); // 8% estimated
  const netToHall = item.price - platformFee;

  const totalItemPrice = item.price * quantity;
  const totalPlatformFee = platformFee * quantity;
  const totalFulfillment = fulfillmentEstimate * quantity;
  const totalToPay = totalItemPrice + totalPlatformFee + totalFulfillment;
  const totalNetToHall = netToHall * quantity;

  const canAfford = userLedgerBalance >= totalToPay;
  const kycBlocked = userKycTier === "visitor";

  const images = getItemImages(item);
  const tags = getItemTags(item);
  const specs = getItemSpecs(item);
  const verticalEmoji = verticalEmojiMap[item.verticalId] || "📦";

  const increment = () => setQuantity((q) => Math.min(q + 1, available));
  const decrement = () => setQuantity((q) => Math.max(q - 1, 1));

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
          {/* Header image gallery */}
          <div className="relative h-56 bg-slate-900 overflow-hidden">
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={item.title}
                className="h-full w-full object-cover opacity-80"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-16 w-16 text-slate-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-slate-300 backdrop-blur-md transition-colors hover:bg-black/60"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Image dots */}
            {images.length > 1 && (
              <div className="absolute top-4 left-4 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === activeImage ? "w-6 bg-cyan-400" : "w-1.5 bg-white/30"
                    )}
                  />
                ))}
              </div>
            )}

            <div className="absolute bottom-4 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{verticalEmoji}</span>
                <div>
                  <div className="text-xl font-bold text-slate-100">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.hallName} · {item.countryFlag} {item.country}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold tracking-wider border", hallClass.bg, hallClass.color, hallClass.border)}>
                  {hallClass.label}
                </span>
                {isSoldOut && (
                  <span className="rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-rose-400">
                    SOLD OUT
                  </span>
                )}
                {isLowStock && !isSoldOut && (
                  <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-400">
                    LOW STOCK
                  </span>
                )}
                <span className="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                  <Percent className="h-2.5 w-2.5" />
                  5% PLATFORM FEE
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-400 border border-white/5 flex items-center gap-1">
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex gap-2">
              {(["details", "hall", "revenue"] as const).map((tab) => (
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

            {activeTab === "details" && (
              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-slate-300">{item.description}</p>

                {/* Specs */}
                {Object.keys(specs).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(specs).map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-slate-800/40 bg-slate-900/20 px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase">{k}</p>
                        <p className="text-xs font-medium text-slate-200">{v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rating */}
                {item.rating && (
                  <div className="flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400">{item.rating}</div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-3.5 w-3.5", s <= Math.round(item.rating!) ? "fill-amber-400 text-amber-400" : "text-slate-600")} />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">Based on {item.reviewCount} verified purchases</div>
                  </div>
                )}

                {/* Quantity selector */}
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Select Quantity</div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={decrement}
                      disabled={quantity <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="text-2xl font-bold text-slate-100 w-12 text-center">{quantity}</div>
                    <button
                      onClick={increment}
                      disabled={quantity >= available}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <div className="text-xs text-slate-500">
                      {isSoldOut ? "0 units available" : `${available} units available`}
                    </div>
                  </div>
                </div>

                {/* Price summary */}
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Order Summary</div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{quantity} × {formatCurrency(item.price)}</span>
                      <span className="font-mono text-slate-200">{formatCurrency(totalItemPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Platform Fee (5%)</span>
                      <span className="font-mono text-cyan-400">{formatCurrency(totalPlatformFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Fulfillment (est.)</span>
                      <span className="font-mono text-amber-400">{formatCurrency(totalFulfillment)}</span>
                    </div>
                    <div className="border-t border-slate-800/60 pt-3">
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-slate-200">Total You Pay</span>
                        <span className="font-mono font-bold text-cyan-400">{formatCurrency(totalToPay)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 48h Escrow Notice */}
                <div className="flex items-start gap-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold text-cyan-300">48-Hour Escrow Protection</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Funds held by 8th Ledger. You may cancel within 48 hours for a full refund. 
                      Either party may flag for review. After 48 hours, escrow auto-releases to hall treasury.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "hall" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Hall Information</div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Hall</span>
                      <span className="text-slate-200">{item.hallName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Class</span>
                      <span className={hallClass.color}>{hallClass.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Vertical</span>
                      <span className="text-slate-200">{item.verticalName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Location</span>
                      <span className="text-slate-200">{item.countryFlag} {item.country}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Margin</span>
                      <span className="font-mono text-emerald-400">{margin}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/20 p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <div className="text-xs text-slate-400">
                    This product is sourced from a Class {item.hallClass} hall.
                    {item.hallClass === "III"
                      ? " Hall runs daily operations. 8th Ledger handles fulfillment, customer service, and platform fee collection."
                      : " 8th Ledger manages operations. Revenue flows to hall treasury after platform fees."}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "revenue" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5">
                  <div className="mb-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Revenue Flow (per unit)</div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">1</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-200">Buyer Pays</div>
                        <div className="text-xs text-slate-500">{formatCurrency(item.price)} item + {formatCurrency(platformFee)} fee + {formatCurrency(fulfillmentEstimate)} fulfillment</div>
                      </div>
                    </div>
                    <div className="ml-4 h-6 border-l border-slate-700" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">2</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-200">8th Ledger Deducts</div>
                        <div className="text-xs text-slate-500">5% platform fee ({formatCurrency(platformFee)}) + fulfillment cost</div>
                      </div>
                    </div>
                    <div className="ml-4 h-6 border-l border-slate-700" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">3</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-emerald-300">Net to Hall Treasury</div>
                        <div className="text-xs text-emerald-400/70">{formatCurrency(netToHall)} per unit → distributed to owners as dividends</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-300">Your purchase contributes</span>
                    <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalNetToHall)}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    For {quantity} unit{quantity > 1 ? "s" : ""}, {formatCurrency(totalNetToHall)} net flows to {item.hallName} treasury, then distributed to all owners by ownership percentage.
                  </p>
                </div>
              </div>
            )}

            {/* KYC Block */}
            {kycBlocked && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <div className="text-sm font-semibold text-rose-300">KYC Verification Required</div>
                  <div className="text-xs text-slate-400">
                    Complete KYC verification to purchase items on the 8th Ledger Exchange.
                  </div>
                </div>
              </div>
            )}

            {/* Balance warning */}
            {!canAfford && !kycBlocked && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <div className="text-sm font-semibold text-rose-300">Insufficient Balance</div>
                  <div className="text-xs text-slate-400">
                    You need {formatCurrency(totalToPay)}. Your balance: {formatCurrency(userLedgerBalance)}.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-slate-800/60 bg-slate-950/95 px-6 py-4 backdrop-blur-xl">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!canAfford || isSoldOut || kycBlocked}
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-bold tracking-wider uppercase transition-all",
                  !canAfford || isSoldOut || kycBlocked
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                )}
              >
                {isSoldOut ? "SOLD OUT" : kycBlocked ? "KYC REQUIRED" : !canAfford ? "INSUFFICIENT FUNDS" : "BUY NOW"}
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-center text-xs text-slate-400">
                  Purchase <span className="text-cyan-400 font-semibold">{quantity}</span> units of{" "}
                  <span className="text-slate-200">{item.title}</span> for{" "}
                  <span className="text-cyan-400 font-bold">{formatCurrency(totalToPay)}</span>
                  <div className="mt-1 text-[10px] text-slate-500">
                    48h escrow protection included
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
                    onClick={() => onBuy?.(item.id, quantity)}
                    className="flex-1 rounded-xl bg-cyan-500 py-3 text-sm font-bold tracking-wider uppercase text-slate-950 transition-all hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                  >
                    Confirm Purchase
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

export default InventoryDetail;