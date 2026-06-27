"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  AlertTriangle,
  Calendar,
  X,
} from "lucide-react";

interface PACValuationCardProps {
  ownership: {
    id: string;
    hallId: string;
    hallName: string;
    vertical: string;
    percent: number;
    dynamicValuePerPercent: number;
    accumulatedDividends: number;
    ahgiPremium: number;
    sriBonus: number;
    pirDebt: number;
    assetBookValue: number;
    lastUpdated: string;
    nextAppraisal: string;
  };
  onList: (ownershipId: string, percent: number, pricePerPercent: number) => void;
  onViewHall: (hallId: string) => void;
}

export default function PACValuationCard({
  ownership,
  onList,
  onViewHall,
}: PACValuationCardProps) {
  const [showListForm, setShowListForm] = useState(false);
  const [listPercent, setListPercent] = useState(0);
  const [listPrice, setListPrice] = useState(ownership.dynamicValuePerPercent);

  const totalValue = ownership.percent * ownership.dynamicValuePerPercent;
  const floorPrice = ownership.dynamicValuePerPercent;
  const isAboveFloor = listPrice >= floorPrice;
  const maxListPercent = Math.min(25, ownership.percent - 0.1);
  const minOwnershipAfter = 0.1;

  const breakdown = [
    { label: "Asset Value", value: ownership.assetBookValue / 100, color: "text-slate-300" },
    { label: "Dividends", value: ownership.accumulatedDividends, color: "text-emerald-400" },
    { label: "AHGI Premium", value: ownership.ahgiPremium, color: "text-cyan-400" },
    { label: "SRI Bonus", value: ownership.sriBonus, color: "text-amber-400" },
  ];

  if (ownership.pirDebt > 0) {
    breakdown.push({ label: "PIR Debt", value: -ownership.pirDebt, color: "text-red-400" });
  }

  const handleList = () => {
    if (isAboveFloor && listPercent > 0 && listPercent <= maxListPercent) {
      onList(ownership.id, listPercent, listPrice);
      setShowListForm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500">#{ownership.hallId}</span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-cyan-400">{ownership.vertical}</span>
            </div>
            <h3
              className="text-lg font-bold text-slate-100 cursor-pointer hover:text-cyan-400 transition-colors"
              onClick={() => onViewHall(ownership.hallId)}
            >
              {ownership.hallName}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Your Ownership</div>
            <div className="text-2xl font-black text-slate-100">{ownership.percent}%</div>
          </div>
        </div>
      </div>

      {/* Valuation */}
      <div className="p-5 space-y-4">
        <div className="p-4 bg-cyan-950/10 border border-cyan-900/30 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">8th Ledger Valuation</span>
            </div>
            <span className="text-xs text-cyan-400/70">Per 1%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">
              ${ownership.dynamicValuePerPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-cyan-400/70">/ 1%</span>
          </div>
          <div className="mt-2 pt-2 border-t border-cyan-900/20 flex justify-between">
            <span className="text-xs text-cyan-400/70">Your total value</span>
            <span className="text-sm font-bold text-cyan-400">
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Breakdown
          </div>
          {breakdown.map((item, i) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{item.label}</span>
              <span className={`font-medium ${item.color}`}>
                {item.value >= 0 ? "+" : ""}
                ${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200">Total per 1%</span>
            <span className="text-sm font-bold text-slate-100">
              ${ownership.dynamicValuePerPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Updated {new Date(ownership.lastUpdated).toLocaleDateString()}
          </span>
          <span>Next: {new Date(ownership.nextAppraisal).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/20">
        {!showListForm ? (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setListPercent(Math.min(25, ownership.percent));
                setListPrice(ownership.dynamicValuePerPercent * 1.1);
                setShowListForm(true);
              }}
              className="flex-1 py-2.5 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-cyan-400 text-sm font-bold hover:bg-cyan-950/50 transition-colors flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              List for Sale
            </button>
            <button
              onClick={() => onViewHall(ownership.hallId)}
              className="px-4 py-2.5 bg-slate-800 rounded-lg text-slate-300 text-sm hover:bg-slate-700 transition-colors"
            >
              View Hall
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-200">List for Sale</span>
                <button
                  onClick={() => setShowListForm(false)}
                  className="p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">% to List</label>
                  <input
                    type="number"
                    min={0.1}
                    max={maxListPercent}
                    step={0.1}
                    value={listPercent}
                    onChange={(e) => setListPercent(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-900 transition-all"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600">Max: {maxListPercent.toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-600">
                      After: {(ownership.percent - listPercent).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Price per 1%</label>
                  <input
                    type="number"
                    min={floorPrice}
                    step={10}
                    value={listPrice}
                    onChange={(e) => setListPrice(Number(e.target.value))}
                    className={`w-full p-2.5 bg-slate-900 border rounded-lg text-sm text-slate-200 focus:outline-none transition-all ${
                      isAboveFloor ? "border-slate-800 focus:border-cyan-900" : "border-red-900 focus:border-red-700"
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600">Floor: ${floorPrice.toFixed(2)}</span>
                    <span className={`text-[10px] ${isAboveFloor ? "text-emerald-400" : "text-red-400"}`}>
                      {isAboveFloor ? "Above floor" : "Below floor!"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Total listing price</span>
                  <span className="text-slate-200 font-bold">
                    ${(listPercent * listPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">8th Ledger fee (2%)</span>
                  <span className="text-slate-500">
                    -${(listPercent * listPrice * 0.02).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-500">You receive</span>
                  <span className="text-emerald-400 font-medium">
                    ${(listPercent * listPrice * 0.98).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowListForm(false)}
                  className="flex-1 py-2.5 bg-slate-800 rounded-lg text-slate-400 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleList}
                  disabled={!isAboveFloor || listPercent <= 0 || listPercent > maxListPercent || (ownership.percent - listPercent) < minOwnershipAfter}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-slate-950 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Confirm Listing
                </button>
              </div>

              {(ownership.percent - listPercent) < minOwnershipAfter && listPercent > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Minimum ownership after sale must be ≥ 0.1%
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}