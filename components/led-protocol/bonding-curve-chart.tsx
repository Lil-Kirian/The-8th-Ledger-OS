"use client";

import React from "react";
import { motion } from "framer-motion";

interface BondingPoint {
  supply: number;
  price: number;
}

interface BondingCurveChartProps {
  currentSupply: number;
  currentPrice: number;
}

const BONDING_CURVE: BondingPoint[] = Array.from({ length: 20 }, (_, i) => {
  const supply = (i + 1) * 50000;
  const price = 5 + Math.log(supply / 1000) * 2.5 + (supply / 1000000) * 8;
  return { supply, price: Math.round(price * 100) / 100 };
});

export function BondingCurveChart({ currentSupply, currentPrice }: BondingCurveChartProps) {
  const width = 600;
  const height = 200;
  const padding = 20;

  const maxSupply = Math.max(...BONDING_CURVE.map((p) => p.supply));
  const maxPrice = Math.max(...BONDING_CURVE.map((p) => p.price)) * 1.1;

  const xScale = (supply: number) => padding + (supply / maxSupply) * (width - padding * 2);
  const yScale = (price: number) => height - padding - (price / maxPrice) * (height - padding * 2);

  const pathD = BONDING_CURVE.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.supply)} ${yScale(p.price)}`).join(" ");

  const currentX = xScale(currentSupply);
  const currentY = yScale(currentPrice);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-[#0a0a14] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-space text-sm font-semibold text-white">Bonding Curve</h3>
          <p className="text-[10px] text-slate-500">Price discovery via logarithmic scarcity model</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-400">Live</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding}
            y1={padding + pct * (height - padding * 2)}
            x2={width - padding}
            y2={padding + pct * (height - padding * 2)}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
        ))}

        <path
          d={`${pathD} L ${xScale(maxSupply)} ${height - padding} L ${xScale(50000)} ${height - padding} Z`}
          fill="url(#curveGradient)"
          opacity="0.3"
        />

        <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={currentX} cy={currentY} r="5" fill="#8b5cf6" stroke="#030308" strokeWidth="2" />
        <circle cx={currentX} cy={currentY} r="10" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.5">
          <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>

        <text x={padding} y={height - 4} fontSize="8" fill="#64748b">0</text>
        <text x={width - padding - 30} y={height - 4} fontSize="8" fill="#64748b">21M</text>
        <text x={4} y={padding + 4} fontSize="8" fill="#64748b">${maxPrice.toFixed(0)}</text>

        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>Early adopters: $5.00/VIN</span>
        <span className="text-violet-300">Current: ${currentPrice.toFixed(2)}/VIN</span>
        <span>Max supply cap: ~$85.00/VIN</span>
      </div>
    </div>
  );
}