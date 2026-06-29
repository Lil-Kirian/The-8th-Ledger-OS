"use client";

import React, { useState } from "react";
import {
  Calculator,
  DollarSign,
  Percent,
  ArrowRight,
  Sparkles,
  PieChart,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DividendCalculatorProps {
  poolTarget: number;
  trueCost?: number; // hidden from public, shown only if admin view
  userCommitment: number;
  monthlyRevenue: number;
  currency?: string;
  isAdmin?: boolean;
}

function formatCurrency(n: number, currency = "$") {
  return `${currency}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DividendCalculator({
  poolTarget,
  trueCost,
  userCommitment,
  monthlyRevenue,
  currency = "$",
  isAdmin = false,
}: DividendCalculatorProps) {
  const [rentInput, setRentInput] = useState(monthlyRevenue);
  const [commitmentInput, setCommitmentInput] = useState(userCommitment);
  const [salePrice, setSalePrice] = useState(poolTarget * 1.2);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scenario, setScenario] = useState<"current" | "optimistic" | "pessimistic">("current");

  const ownershipPercent = (commitmentInput / poolTarget) * 100;
  const ledgerTithe = rentInput * 0.2;
  const communityNet = rentInput * 0.8;
  const userMonthly = communityNet * (ownershipPercent / 100);
  const userAnnual = userMonthly * 12;
  const userFiveYear = userAnnual * 5;

  const saleNet = salePrice * 0.97; // 3% closing costs
  const userSalePayout = saleNet * (ownershipPercent / 100);
  const totalReturn = userFiveYear + userSalePayout;
  const roi = commitmentInput > 0 ? ((totalReturn - commitmentInput) / commitmentInput) * 100 : 0;

  const pir = isAdmin && trueCost ? poolTarget - trueCost : null;
  const pirPercent = pir && trueCost ? ((pir / trueCost) * 100).toFixed(0) : null;

  const scenarios = {
    current: { rent: monthlyRevenue, label: "Current Rent", color: "text-blue-400", bg: "bg-blue-900/20" },
    optimistic: { rent: monthlyRevenue * 1.3, label: "Optimistic (+30%)", color: "text-emerald-400", bg: "bg-emerald-900/20" },
    pessimistic: { rent: monthlyRevenue * 0.7, label: "Pessimistic (−30%)", color: "text-amber-400", bg: "bg-amber-900/20" },
  };

  const applyScenario = (key: keyof typeof scenarios) => {
    setScenario(key);
    setRentInput(scenarios[key].rent);
  };

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
            <Calculator size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Dividend Simulator</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">80/20 split • Capital-weighted</p>
          </div>
        </div>
        {isAdmin && pir !== null && (
          <div className="px-2.5 py-1 rounded-lg bg-cyan-950/20 border border-cyan-800/20 text-[10px] text-cyan-400 font-mono">
            PIR: {currency}
            {pir.toLocaleString()} ({pirPercent}%)
          </div>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Scenario Toggles */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(scenarios) as Array<keyof typeof scenarios>).map((key) => {
            const s = scenarios[key];
            const active = scenario === key;
            return (
              <button
                key={key}
                onClick={() => applyScenario(key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center",
                  active
                    ? `${s.bg} ${s.color} border-slate-700/40`
                    : "bg-slate-800/20 text-slate-500 border-slate-800/30 hover:text-slate-300"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Sliders */}
        <div className="space-y-5">
          {/* Monthly Revenue Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <DollarSign size={12} />
                Monthly Gross Revenue
              </label>
              <span className="text-sm font-bold text-slate-100 font-mono">
                {formatCurrency(rentInput, currency)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={monthlyRevenue * 3}
              step={100}
              value={rentInput}
              onChange={(e) => {
                setRentInput(Number(e.target.value));
                setScenario("current");
              }}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono">
              <span>$0</span>
              <span>{formatCurrency(monthlyRevenue * 3, currency)}</span>
            </div>
          </div>

          {/* Commitment Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Target size={12} />
                Your Commitment
              </label>
              <span className="text-sm font-bold text-slate-100 font-mono">
                {formatCurrency(commitmentInput, currency)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={poolTarget}
              step={10}
              value={commitmentInput}
              onChange={(e) => setCommitmentInput(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono">
              <span>{currency}1</span>
              <span>{formatCurrency(poolTarget, currency)} (Pool Target)</span>
            </div>
          </div>

          {/* Ownership Display */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Percent size={12} />
              Your Ownership
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(ownershipPercent, 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-blue-400 font-mono">
                {ownershipPercent.toFixed(4)}%
              </span>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/20 text-center">
            <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Monthly</div>
            <div className="text-lg font-bold text-emerald-300 font-mono">
              {formatCurrency(userMonthly, currency)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-1">after 20% 8th Ledger Tithe</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-950/10 border border-blue-800/20 text-center">
            <div className="text-[10px] text-blue-500 uppercase tracking-wider mb-1">Annual</div>
            <div className="text-lg font-bold text-blue-300 font-mono">
              {formatCurrency(userAnnual, currency)}
            </div>
            <div className="text-[10px] text-blue-700 mt-1">×12 months</div>
          </div>
          <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-800/20 text-center">
            <div className="text-[10px] text-purple-500 uppercase tracking-wider mb-1">5-Year</div>
            <div className="text-lg font-bold text-purple-300 font-mono">
              {formatCurrency(userFiveYear, currency)}
            </div>
            <div className="text-[10px] text-purple-700 mt-1">no sale included</div>
          </div>
        </div>

        {/* 80/20 Split Breakdown */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <PieChart size={10} />
            Revenue Split
          </div>
          <div className="h-10 rounded-xl overflow-hidden flex text-[10px] font-bold">
            <div
              className="h-full bg-emerald-500/30 flex items-center justify-center text-emerald-300 border-r border-slate-900/50"
              style={{ width: "80%" }}
            >
              80% Community {formatCurrency(communityNet, currency)}
            </div>
            <div
              className="h-full bg-amber-500/30 flex items-center justify-center text-amber-300"
              style={{ width: "20%" }}
            >
              20% 8th Ledger {formatCurrency(ledgerTithe, currency)}
            </div>
          </div>
        </div>

        {/* Advanced: Sale Scenario */}
        <div className="space-y-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="font-medium">Sale Scenario (Year 5)</span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/20 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400">Projected Sale Price</label>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {formatCurrency(salePrice, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min={poolTarget * 0.5}
                  max={poolTarget * 2}
                  step={1000}
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/20">
                  <div className="text-[10px] text-slate-500 mb-1">Sale Payout (Net)</div>
                  <div className="text-base font-bold text-slate-200 font-mono">
                    {formatCurrency(userSalePayout, currency)}
                  </div>
                  <div className="text-[9px] text-slate-600 mt-0.5">3% closing costs deducted</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-900/10 border border-emerald-800/20">
                  <div className="text-[10px] text-emerald-500 mb-1">Total 5-Year Return</div>
                  <div className="text-base font-bold text-emerald-300 font-mono">
                    {formatCurrency(totalReturn, currency)}
                  </div>
                  <div className="text-[9px] text-emerald-700 mt-0.5">
                    Dividends + Sale
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-950/10 border border-amber-800/20">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">Total ROI</span>
                </div>
                <span className="text-xl font-bold text-amber-300 font-mono">
                  {roi.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Formula Footer */}
        <div className="pt-4 border-t border-slate-800/40">
          <div className="text-[10px] text-slate-600 font-mono space-y-1 leading-relaxed">
            <div className="flex items-center gap-2">
              <ArrowRight size={10} className="text-slate-500" />
              <span>
                Ownership % = {formatCurrency(commitmentInput, currency)} ÷ {formatCurrency(poolTarget, currency)} = {" "}
                {ownershipPercent.toFixed(4)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight size={10} className="text-slate-500" />
              <span>
                Monthly = ({formatCurrency(rentInput, currency)} × 80%) × {ownershipPercent.toFixed(4)}% = {" "}
                {formatCurrency(userMonthly, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}