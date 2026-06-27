"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  DollarSign,
  User,
  Shield,
  CheckCircle2,
  Flame,
} from "lucide-react";

interface AuctionItem {
  id: string;
  vaultId: string;
  hallId: string;
  hallName: string;
  vertical: string;
  percent: number;
  startingPrice: number;
  dynamicValue: number;
  listedAt: string;
  expiresAt: string;
  bids: number;
  highestBid?: number;
  highestBidder?: string;
  status: "ACTIVE" | "ENDED" | "NO_BID";
}

interface AuctionCardProps {
  item: AuctionItem;
  onBid: (auctionId: string, amount: number) => void;
  currentUserLedgerId?: string;
}

export default function AuctionCard({
  item,
  onBid,
  currentUserLedgerId,
}: AuctionCardProps) {
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState(item.startingPrice);

  const timeLeft = Math.max(0, new Date(item.expiresAt).getTime() - Date.now());
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60));

  const isHighestBidder = item.highestBidder === currentUserLedgerId;
  const isAboveStarting = bidAmount >= item.startingPrice;
  const premiumOverDynamic = ((bidAmount - item.dynamicValue) / item.dynamicValue) * 100;

  const handleBid = () => {
    if (isAboveStarting) {
      onBid(item.id, bidAmount);
      setShowBidForm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
        item.status === "ENDED"
          ? "border-slate-800 opacity-75"
          : item.status === "NO_BID"
          ? "border-slate-800 opacity-50"
          : "border-slate-800 hover:border-amber-900/50"
      }`}
    >
      {/* Status Banner */}
      {item.status === "ENDED" && (
        <div className="px-4 py-2 bg-emerald-950/30 border-b border-emerald-900/50 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
            Auction Complete — Sold
          </span>
        </div>
      )}
      {item.status === "NO_BID" && (
        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            No Bids — 8th Ledger Absorbed at Dynamic Value
          </span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500">#{item.hallId}</span>
              <span className="text-xs text-cyan-400">{item.vertical}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">{item.hallName}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              <span>{item.percent}% ownership</span>
              <span>•</span>
              <span>Listed {new Date(item.listedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            {item.status === "ACTIVE" && (
              <div className="px-2.5 py-1 rounded-md bg-amber-950/30 border border-amber-900/50 text-amber-400 text-xs font-bold">
                <Flame className="w-3 h-3 inline mr-1" />
                LIVE
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Starting Price (120%)</div>
            <div className="text-lg font-bold text-amber-400">
              ${item.startingPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Dynamic: ${item.dynamicValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Current Bid</div>
            <div className="text-lg font-bold text-slate-200">
              {item.highestBid
                ? `$${item.highestBid.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                : "—"}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {item.bids} bid{item.bids !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Timer */}
        {item.status === "ACTIVE" && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / (30 * 24 * 60 * 60 * 1000)) * 100}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full bg-amber-500"
              />
            </div>
            <span className="text-xs text-slate-500 w-20 text-right">
              {daysLeft}d {hoursLeft}h left
            </span>
          </div>
        )}

        {/* Highest Bidder Badge */}
        {isHighestBidder && item.status === "ACTIVE" && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-bold">
              You are the highest bidder
            </span>
          </div>
        )}

        {/* Actions */}
        {item.status === "ACTIVE" && (
          <div>
            {!showBidForm ? (
              <button
                onClick={() => setShowBidForm(true)}
                className="w-full py-3 bg-amber-950/30 border border-amber-900/50 rounded-lg text-amber-400 text-sm font-bold hover:bg-amber-950/50 transition-colors flex items-center justify-center gap-2"
              >
                <Gavel className="w-4 h-4" />
                Place Bid
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Your Bid</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        min={item.startingPrice}
                        step={10}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className={`w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-lg text-sm text-slate-200 focus:outline-none transition-all ${
                          isAboveStarting
                            ? "border-slate-800 focus:border-cyan-900"
                            : "border-red-900 focus:border-red-700"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-600">
                        Min: ${item.startingPrice.toLocaleString()}
                      </span>
                      <span className={`text-xs ${premiumOverDynamic >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {premiumOverDynamic >= 0 ? "+" : ""}
                        {premiumOverDynamic.toFixed(1)}% vs dynamic
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBidForm(false)}
                      className="flex-1 py-2.5 bg-slate-800 rounded-lg text-slate-400 text-sm hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBid}
                      disabled={!isAboveStarting}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-slate-950 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Gavel className="w-4 h-4" />
                      Confirm Bid
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}

        {item.status === "ENDED" && item.highestBidder && (
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Winning Bidder</div>
            <div className="text-sm font-mono text-slate-300">{item.highestBidder}</div>
            <div className="text-xs text-slate-500 mt-1">
              Final price: ${item.highestBid?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}