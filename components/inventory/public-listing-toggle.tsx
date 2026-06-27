// components/inventory/public-listing-toggle.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Store,
  Globe,
  Shield,
  AlertTriangle,
  Tag,
  DollarSign,
  Package,
  TrendingUp,
  Info,
  Loader2,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface InventoryItem {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  quantitySold: number;
  costOfGoods: number;
  status: string;
  imageUrl?: string | null;
}

interface PublicListingToggleProps {
  item: InventoryItem;
  hallId: string;
  disabled?: boolean;
  onToggle?: (itemId: string, newStatus: string) => void;
  onError?: (message: string) => void;
}

export function PublicListingToggle({ item, hallId, disabled = false, onToggle, onError }: PublicListingToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>("");
  const [listingPrice, setListingPrice] = useState((item.price / 100).toFixed(2));
  const [isToggling, setIsToggling] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const isListed = item.status === "active";
  const margin = item.price - item.costOfGoods;
  const marginPercent = item.price > 0 ? Math.round((margin / item.price) * 100) : 0;

  const handleToggleClick = () => {
    const newStatus = isListed ? "inactive" : "active";
    setPendingStatus(newStatus);
    setListingPrice((item.price / 100).toFixed(2));
    setInlineError(null);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsToggling(true);
    setInlineError(null);

    try {
      const body: Record<string, unknown> = { status: pendingStatus };
      if (pendingStatus === "active") {
        const newPrice = parseFloat(listingPrice);
        if (!isNaN(newPrice) && newPrice > 0 && Math.round(newPrice * 100) !== item.price) {
          body.price = Math.round(newPrice * 100);
        }
      }

      const res = await fetch(`/api/halls/${hallId}/inventory/${item.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `Failed to toggle listing (${res.status})`);

      onToggle?.(item.id, pendingStatus);
      setShowConfirm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to toggle listing";
      setInlineError(msg);
      onError?.(msg);
    } finally {
      setIsToggling(false);
    }
  };

  const canList = item.quantity > 0 && !disabled;
  const displayPrice = item.price / 100;
  const displayCOGS = item.costOfGoods / 100;
  const displayMargin = margin / 100;
  const revenuePotential = displayPrice * item.quantity;
  const netPotential = displayMargin * item.quantity;

  return (
    <>
      <Card className={`bg-slate-900/50 border-slate-800 relative overflow-hidden transition-all ${
        isListed ? "ring-1 ring-emerald-500/20" : ""
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
        <div className={`absolute top-0 right-0 p-2 ${
          isListed ? "bg-emerald-500/10" : "bg-slate-800/50"
        }`}>
          {isListed ? (
            <Globe className="w-4 h-4 text-emerald-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-600" />
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-white text-sm truncate">{item.title}</CardTitle>
                <CardDescription className="text-slate-400 text-xs truncate">
                  {isListed ? "Publicly listed on marketplace" : "Hidden from public view"}
                </CardDescription>
              </div>
            </div>
            <Badge
              className={isListed 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-slate-700/50 text-slate-400 border-slate-700"
              }
            >
              {isListed ? "LISTED" : "HIDDEN"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-500">Price</p>
              <p className="text-sm font-medium text-white">${displayPrice.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-500">Stock</p>
              <p className={`text-sm font-medium ${item.quantity > 0 ? "text-white" : "text-red-400"}`}>
                {item.quantity} units
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-500">Sold</p>
              <p className="text-sm font-medium text-cyan-400">{item.quantitySold}</p>
            </div>
          </div>

          {/* Margin Info */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Margin: {marginPercent}%</span>
            <span className={`${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${displayMargin.toFixed(2)} per unit
            </span>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-1.5 rounded-md ${isListed ? "bg-emerald-500/20" : "bg-slate-700/50"} shrink-0`}>
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Store className={`w-4 h-4 ${isListed ? "text-emerald-400" : "text-slate-500"}`} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {isListed ? "Visible on Marketplace" : "Hidden from Marketplace"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {isListed 
                    ? "Anyone can view and purchase this item" 
                    : "Only hall members can see this item"
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={isListed}
              onCheckedChange={handleToggleClick}
              disabled={!canList || isToggling}
              className="data-[state=checked]:bg-emerald-500 shrink-0"
            />
          </div>

          {/* Revenue Impact Preview */}
          <AnimatePresence>
            {isListed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-emerald-400 font-medium">Revenue Impact</p>
                    <p className="text-xs text-emerald-300/70">
                      If all {item.quantity} units sell at ${displayPrice.toLocaleString()}, 
                      this item generates ${revenuePotential.toLocaleString()} in revenue. 
                      Net to hall treasury after COGS: ${netPotential.toLocaleString()}.
                    </p>
                    <p className="text-[10px] text-emerald-300/50 mt-1">
                      8th Ledger deducts 5% platform fee + fulfillment cost before net reaches treasury.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isListed && item.quantity > 0 && !disabled && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500">
                  This item has {item.quantity} units in stock but is not listed. 
                  Toggle the switch to make it available for public purchase.
                </p>
              </div>
            </div>
          )}

          {item.quantity === 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300/80">
                  Cannot list — item is out of stock. Restock before making it public.
                </p>
              </div>
            </div>
          )}

          {disabled && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500">
                  Inventory management is currently disabled for this hall.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) { setShowConfirm(false); setInlineError(null); } }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingStatus === "active" ? (
                <>
                  <Eye className="w-5 h-5 text-emerald-500" />
                  List on Marketplace
                </>
              ) : (
                <>
                  <EyeOff className="w-5 h-5 text-amber-500" />
                  Hide from Marketplace
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {pendingStatus === "active"
                ? `Make "${item.title}" available for public purchase on the 8th Ledger Marketplace.`
                : `Remove "${item.title}" from public view. Existing orders will still be fulfilled.`
              }
            </DialogDescription>
          </DialogHeader>

          {inlineError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{inlineError}</p>
            </div>
          )}

          <div className="space-y-4 py-2">
            {pendingStatus === "active" && (
              <div className="space-y-2">
                <Label className="text-slate-300">Listing Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Current price: ${displayPrice.toLocaleString()}
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">{item.quantity} units in stock</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-violet-400" />
                <span className="text-slate-300">Margin: {marginPercent}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  Revenue potential: ${revenuePotential.toLocaleString()}
                </span>
              </div>
            </div>

            {pendingStatus === "active" ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-300/80">
                    Public buyers will see this item immediately. 8th Ledger handles payment processing, 
                    fulfillment, and customer service. Revenue flows to hall treasury after 5% platform fee + fulfillment cost.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300/80">
                    This item will no longer appear in marketplace search. Existing orders and pending 
                    purchases will still be processed normally.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowConfirm(false); setInlineError(null); }}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
              disabled={isToggling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isToggling || (pendingStatus === "active" && item.quantity === 0)}
              className={pendingStatus === "active"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
              }
            >
              {isToggling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : pendingStatus === "active" ? (
                "List Item"
              ) : (
                "Hide Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}