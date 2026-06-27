// components/marketplace/inventory-card.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Package,
  ArrowRight,
  Star,
  MapPin,
  ImageIcon,
  Tag,
  Percent,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   VERTICAL ICON MAP
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

interface InventoryCardProps {
  item: InventoryItemData;
  index?: number;
  onClick?: (item: InventoryItemData) => void;
  compact?: boolean;
}

const hallClassConfig = {
  I: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "CLASS I" },
  II: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "CLASS II" },
  III: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "CLASS III" },
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

function getItemImage(item: InventoryItemData): string | null {
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

export function InventoryCard({ item, index = 0, onClick, compact = false }: InventoryCardProps) {
  const hallClass = hallClassConfig[item.hallClass];
  const available = item.quantity - item.quantitySold;
  const isSoldOut = item.quantity === 0;
  const isLowStock = available <= item.reorderThreshold && available > 0;
  const percentSold = item.quantity > 0 ? (item.quantitySold / item.quantity) * 100 : 0;
  const margin = item.price > 0 ? Math.round(((item.price - item.costOfGoods) / item.price) * 100) : 0;
  const netToHall = Math.round(item.price * 0.95); // 5% platform fee deducted
  const img = getItemImage(item);
  const tags = getItemTags(item);
  const specs = getItemSpecs(item);
  const verticalEmoji = verticalEmojiMap[item.verticalId] || "📦";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35 }}
        onClick={() => onClick?.(item)}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300",
          "bg-slate-900/60 border-slate-700/40 hover:border-cyan-500/40 hover:bg-slate-800/60",
          isSoldOut && "opacity-60"
        )}
      >
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">
            {verticalEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-100">{item.title}</div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{item.countryFlag} {item.country}</span>
              <span className="text-slate-600">|</span>
              <span className={isSoldOut ? "text-rose-400" : isLowStock ? "text-amber-400" : "text-emerald-400"}>
                {isSoldOut ? "SOLD OUT" : isLowStock ? `${available} LOW` : `${available} left`}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-cyan-400">{formatCurrency(item.price)}</div>
            {margin > 0 && (
              <div className="text-[10px] text-emerald-400">{margin}% margin</div>
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
      onClick={() => onClick?.(item)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500",
        "bg-slate-950/70 border-slate-800/60 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-900/10",
        isSoldOut && "opacity-50"
      )}
    >
      {/* Image area */}
      <div className="relative h-40 bg-slate-900/80 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={item.title}
            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            <ImageIcon className="h-12 w-12 text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider border", hallClass.bg, hallClass.color, hallClass.border)}>
            {hallClass.label}
          </span>
          {isSoldOut && (
            <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-rose-400">
              SOLD OUT
            </span>
          )}
          {isLowStock && !isSoldOut && (
            <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-400">
              LOW STOCK
            </span>
          )}
          <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 flex items-center gap-1">
            <Percent className="h-2.5 w-2.5" />
            5% FEE
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{verticalEmoji}</span>
            <div>
              <div className="text-sm font-bold text-slate-100">{item.title}</div>
              <div className="text-xs text-slate-400">{item.hallName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Description */}
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
          {item.description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] text-slate-400 border border-white/5 flex items-center gap-1"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[9px] text-slate-600">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Specs */}
        {Object.keys(specs).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(specs).slice(0, 2).map(([k, v]) => (
              <span key={k} className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                {k}: {v}
              </span>
            ))}
          </div>
        )}

        {/* Metrics */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5 text-center">
            <div className="text-xs font-bold text-slate-100">{formatCurrency(item.price)}</div>
            <div className="text-[10px] text-slate-500">per unit</div>
          </div>
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5 text-center">
            <div className={cn("text-xs font-bold", isSoldOut ? "text-rose-400" : isLowStock ? "text-amber-400" : "text-emerald-400")}>
              {isSoldOut ? "0" : available}
            </div>
            <div className="text-[10px] text-slate-500">available</div>
          </div>
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5 text-center">
            <div className="text-xs font-bold text-violet-400">{margin}%</div>
            <div className="text-[10px] text-slate-500">margin</div>
          </div>
        </div>

        {/* Net to Hall */}
        <div className="mb-4 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">Net to Hall Treasury</span>
          </div>
          <span className="text-xs font-bold text-emerald-400">{formatCurrency(netToHall)}</span>
        </div>

        {/* Stock bar */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>Stock</span>
            <span>{item.quantitySold} / {item.quantity} sold</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentSold}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className={cn(
                "h-full rounded-full",
                percentSold >= 90 ? "bg-rose-500" : percentSold >= 60 ? "bg-amber-500" : "bg-cyan-500"
              )}
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {item.rating && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span className="font-semibold">{item.rating}</span>
                <span className="text-slate-500">({item.reviewCount})</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {item.countryFlag} {item.country}
            </div>
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300"
          >
            {isSoldOut ? "Unavailable" : "View Product"}
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default InventoryCard;