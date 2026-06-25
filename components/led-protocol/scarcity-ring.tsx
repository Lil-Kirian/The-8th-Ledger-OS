"use client";

import React from "react";

interface ScarcityRingProps {
  circulating: number;
  max: number;
  burned: number;
  locked: number;
}

export function ScarcityRing({ circulating, max, burned, locked }: ScarcityRingProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const burnedPct = burned / max;
  const lockedPct = locked / max;
  const circulatingPct = circulating / max;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={radius} fill="none" stroke="#ef4444" strokeWidth="10"
            strokeDasharray={`${burnedPct * circumference} ${circumference}`}
            strokeLinecap="round" opacity="0.6"
          />
          <circle
            cx="60" cy="60" r={radius} fill="none" stroke="#f59e0b" strokeWidth="10"
            strokeDasharray={`${lockedPct * circumference} ${circumference}`}
            strokeDashoffset={-burnedPct * circumference}
            strokeLinecap="round" opacity="0.6"
          />
          <circle
            cx="60" cy="60" r={radius} fill="none" stroke="#6366f1" strokeWidth="10"
            strokeDasharray={`${circulatingPct * circumference} ${circumference}`}
            strokeDashoffset={-(burnedPct + lockedPct) * circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-space text-lg font-bold text-white">{((circulating / max) * 100).toFixed(1)}%</span>
          <span className="text-[8px] text-slate-500">Circulating</span>
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-[10px]">
        <span className="flex items-center gap-1 text-slate-400"><div className="h-2 w-2 rounded-full bg-indigo-500" /> Circulating</span>
        <span className="flex items-center gap-1 text-slate-400"><div className="h-2 w-2 rounded-full bg-amber-500" /> Locked</span>
        <span className="flex items-center gap-1 text-slate-400"><div className="h-2 w-2 rounded-full bg-red-500" /> Burned</span>
      </div>
    </div>
  );
}