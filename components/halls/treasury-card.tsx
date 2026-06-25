"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  PiggyBank,
  Zap,
  Activity,
  BarChart3,
  Clock,
  ChevronRight,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TreasuryData {
  balance: number;
  currency: string;
  monthlyIn: number;
  monthlyOut: number;
  reserveRatio: number; // 0-100
  burnRate: number; // daily
  lastDistribution: string;
  nextDistribution: string;
  revenueHistory: number[]; // last 12 months
  distributionHistory: number[]; // last 12 months
  totalDistributed: number;
  totalRevenue: number;
  ledgerTitheTotal: number; // 20% collected
}

interface TreasuryCardProps {
  hallId: string;
  hallName: string;
  data: TreasuryData;
}

function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 200;
  const height = 48;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const path = `M${points.join(" L")}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.8" />
        );
      })}
    </svg>
  );
}

function Gauge({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-lg font-bold text-slate-100 font-mono">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function TreasuryCard({ hallId, hallName, data }: TreasuryCardProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [animatedBalance, setAnimatedBalance] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedBalance(start + (data.balance - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [data.balance]);

  const netFlow = data.monthlyIn - data.monthlyOut;
  const isPositive = netFlow >= 0;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();

  const reserveStatus =
    data.reserveRatio >= 50
      ? { color: "#10b981", label: "Healthy", icon: Shield }
      : data.reserveRatio >= 25
      ? { color: "#f59e0b", label: "Caution", icon: AlertTriangle }
      : { color: "#ef4444", label: "Critical", icon: AlertTriangle };

  const ReserveIcon = reserveStatus.icon;

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
            <Wallet size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Treasury</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{hallName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1",
              reserveStatus.color === "#10b981"
                ? "bg-emerald-900/20 text-emerald-400 border-emerald-700/30"
                : reserveStatus.color === "#f59e0b"
                ? "bg-amber-900/20 text-amber-400 border-amber-700/30"
                : "bg-red-900/20 text-red-400 border-red-700/30"
            )}
          >
            <ReserveIcon size={10} />
            {reserveStatus.label}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Main Balance */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Community Treasury</div>
            <div className="text-3xl font-bold text-slate-100 font-mono tracking-tight">
              {data.currency}
              {animatedBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isPositive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {isPositive ? "+" : ""}
                {netFlow.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                <span className="text-slate-600">this month</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Next Distribution</div>
            <div className="flex items-center gap-1.5 text-sm text-slate-300">
              <Clock size={14} className="text-amber-400" />
              <span className="font-mono">{new Date(data.nextDistribution).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Sparkline + Monthly Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <BarChart3 size={10} />
              12-Month Revenue
            </span>
            <span className="flex items-center gap-1">
              <Zap size={10} className="text-emerald-400" />
              Total: {data.currency}
              {data.totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <Sparkline data={data.revenueHistory} color="#10b981" />
            {/* Month labels overlay */}
            <div className="flex justify-between mt-1 px-0.5">
              {data.revenueHistory.map((_, i) => {
                const monthIndex = (currentMonth - 11 + i + 12) % 12;
                const isHovered = hoveredMonth === i;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHoveredMonth(i)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className={cn(
                      "text-[9px] font-mono transition-colors",
                      isHovered ? "text-emerald-400" : "text-slate-700"
                    )}
                  >
                    {months[monthIndex]}
                  </button>
                );
              })}
            </div>
            {/* Tooltip */}
            {hoveredMonth !== null && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 shadow-xl whitespace-nowrap z-10">
                <span className="text-emerald-400 font-mono font-bold">
                  {data.currency}
                  {data.revenueHistory[hoveredMonth].toLocaleString()}
                </span>
                <span className="text-slate-500 ml-1">
                  {months[(currentMonth - 11 + hoveredMonth + 12) % 12]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gauges Row */}
        <div className="grid grid-cols-3 gap-4 py-2">
          <Gauge
            value={Math.round(data.reserveRatio)}
            label="Reserve Ratio"
            color={reserveStatus.color}
          />
          <Gauge
            value={Math.round((data.monthlyIn / (data.monthlyIn + data.monthlyOut || 1)) * 100)}
            label="Inflow Ratio"
            color="#3b82f6"
          />
          <Gauge
            value={Math.round((data.totalDistributed / (data.totalRevenue || 1)) * 100)}
            label="Distributed"
            color="#8b5cf6"
          />
        </div>

        {/* Monthly In/Out */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-900/20 flex items-center justify-center">
                <TrendingUp size={12} className="text-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Monthly In</span>
            </div>
            <div className="text-lg font-bold text-emerald-300 font-mono">
              {data.currency}
              {data.monthlyIn.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600/70 mt-1">Revenue + Sales</div>
          </div>

          <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-red-900/20 flex items-center justify-center">
                <TrendingDown size={12} className="text-red-400" />
              </div>
              <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Monthly Out</span>
            </div>
            <div className="text-lg font-bold text-red-300 font-mono">
              {data.currency}
              {data.monthlyOut.toLocaleString()}
            </div>
            <div className="text-[10px] text-red-600/70 mt-1">Distributions + Ops</div>
          </div>
        </div>

        {/* Burn Rate */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/20 border border-slate-700/20">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-slate-500" />
            <span className="text-xs text-slate-400">Daily Burn Rate</span>
          </div>
          <span className="text-xs font-mono text-slate-300">
            {data.currency}
            {data.burnRate.toLocaleString()}
            <span className="text-slate-600">/day</span>
          </span>
        </div>

        {/* 80/20 Split Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
            <span>80/20 Split — Lifetime</span>
            <span>8th Ledger Tithe: {data.currency}{data.ledgerTitheTotal.toLocaleString()}</span>
          </div>
          <div className="h-4 bg-slate-800/40 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500/40 flex items-center justify-center text-[9px] font-bold text-emerald-300"
              style={{ width: "80%" }}
            >
              80% Community
            </div>
            <div
              className="h-full bg-amber-500/40 flex items-center justify-center text-[9px] font-bold text-amber-300"
              style={{ width: "20%" }}
            >
              20% 8th Ledger
            </div>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all group">
          <PiggyBank size={16} className="text-emerald-400" />
          <span>View Full Treasury Ledger</span>
          <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
        </button>
      </div>
    </div>
  );
}