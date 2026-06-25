"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sun, Wind, Zap, Battery, TrendingUp, Globe, MapPin, ChevronRight, Leaf, BarChart3, Activity, Lock, Radio, Server } from "lucide-react";

interface EnergyAsset {
  id: string;
  name: string;
  region: string;
  type: "solar" | "wind" | "hydro" | "grid";
  capacity: number;
  generation: number;
  value: number;
  ownership: number;
  monthlyIncome: number;
  carbonOffset: number;
  status: "active" | "maintenance" | "expanding";
  image?: string;
}

interface PPAContract {
  id: string;
  buyer: string;
  rate: number;
  term: string;
  volume: number;
  status: "active" | "negotiating" | "renewal";
}

interface CarbonCredit {
  id: string;
  vintage: string;
  tons: number;
  price: number;
  standard: "VCS" | "Gold Standard" | "CDM";
  status: "verified" | "pending" | "retired";
}

const ASSETS: EnergyAsset[] = [
  { id: "e1", name: "Desert Array Alpha", region: "North African Desert Belt", type: "solar", capacity: 120, generation: 28400, value: 320000, ownership: 10, monthlyIncome: 8200, carbonOffset: 1890, status: "active" },
  { id: "e2", name: "Coastal Wind Farm", region: "North Sea Corridor", type: "wind", capacity: 85, generation: 19600, value: 280000, ownership: 15, monthlyIncome: 6400, carbonOffset: 1420, status: "active" },
  { id: "e3", name: "Highland Hydro", region: "Andean Ridge", type: "hydro", capacity: 45, generation: 11200, value: 195000, ownership: 8, monthlyIncome: 3800, carbonOffset: 680, status: "active" },
  { id: "e4", name: "Grid Storage Node", region: "Pacific Intertie", type: "grid", capacity: 200, generation: 0, value: 450000, ownership: 5, monthlyIncome: 9500, carbonOffset: 0, status: "expanding" },
];

const PPAS: PPAContract[] = [
  { id: "p1", buyer: "Continental Grid Authority", rate: 48, term: "15 years", volume: 420000, status: "active" },
  { id: "p2", buyer: "Municipal Power Consortium", rate: 52, term: "10 years", volume: 180000, status: "active" },
  { id: "p3", buyer: "Industrial Park Complex", rate: 45, term: "12 years", volume: 260000, status: "negotiating" },
  { id: "p4", buyer: "Cross-Border Utility", rate: 55, term: "20 years", volume: 600000, status: "renewal" },
];

const CARBON: CarbonCredit[] = [
  { id: "c1", vintage: "2024", tons: 4200, price: 28, standard: "VCS", status: "verified" },
  { id: "c2", vintage: "2025", tons: 3100, price: 32, standard: "Gold Standard", status: "verified" },
  { id: "c3", vintage: "2025", tons: 1800, price: 24, standard: "CDM", status: "pending" },
  { id: "c4", vintage: "2023", tons: 5600, price: 35, standard: "VCS", status: "retired" },
];

const GENERATION_HISTORY = [42000, 38000, 41000, 45000, 48000, 52000, 49000, 54000, 58000, 55000, 61000, 59200];

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 1500 }: { value: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStarted(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}{value >= 1000 ? formatMoney(display) : display.toFixed(0)}{suffix}
    </span>
  );
};

const GlowCard = ({ children, className = "", accent = "amber" }: { children: React.ReactNode; className?: string; accent?: "amber" | "cyan" | "gold" | "slate" | "emerald" | "violet" }) => {
  const accentMap = {
    amber: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 shadow-amber-500/10",
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 shadow-cyan-500/10",
    gold: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 shadow-amber-500/10",
    slate: "from-slate-500/20 to-gray-500/20 border-slate-500/30 shadow-slate-500/10",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 shadow-emerald-500/10",
    violet: "from-violet-500/20 to-purple-500/20 border-violet-500/30 shadow-violet-500/10",
  };
  return (
    <div className={`relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl ${accentMap[accent]} ${className}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    maintenance: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    expanding: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    negotiating: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    renewal: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    retired: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.active}`}>
      {status}
    </span>
  );
};

const TypeIcon = ({ type }: { type: string }) => {
  const icons = {
    solar: <Sun className="h-5 w-5 text-amber-400" />,
    wind: <Wind className="h-5 w-5 text-cyan-400" />,
    hydro: <Droplets className="h-5 w-5 text-blue-400" />,
    grid: <Battery className="h-5 w-5 text-emerald-400" />,
  };
  return icons[type as keyof typeof icons] || <Zap className="h-5 w-5" />;
};

const ImageSkeleton = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
    <Icon className="h-12 w-12 text-slate-700 animate-pulse" />
  </div>
);

function Droplets({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

export default function LedgerEnergyPage() {
  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0);
  const totalMonthly = ASSETS.reduce((s, a) => s + a.monthlyIncome, 0);
  const totalCapacity = ASSETS.reduce((s, a) => s + a.capacity, 0);
  const totalCarbon = ASSETS.reduce((s, a) => s + a.carbonOffset, 0);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-amber-500/30 selection:text-amber-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[45%] h-[45%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[45%] h-[45%] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
              <span className="text-xs font-mono text-amber-400 uppercase tracking-[0.2em]">Class I — Passive Infrastructure</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent flex items-center gap-4">
              <span className="text-5xl">⚡</span> LedgerEnergy
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Own the power grid. Solar farms, wind arrays, hydro dams, battery storage, and microgrids. 
              8th Ledger manages PPA contracts, grid connections, and maintenance. You own the asset. You earn from every kWh — forever.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Propose Energy Asset
              </span>
            </button>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#0a0a14] to-transparent p-8 mb-8">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400/80">Power Purchase Agreement</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Own the Grid. Earn Per kWh.</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Each asset shows its true acquisition cost and pool target. When the pool fills, the 8th Ledger acquires the installation, forms the legal SPV, and activates insurance. Revenue from PPAs and carbon credits flows to the hall treasury. The 8th Ledger Tithe (20%) covers protocol operations. The remainder splits by PAC ownership percentage — monthly, automatically.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">All = Owners</span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">PAC = Dividends</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">Hall = Governance</span>
                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">8th Ledger = Operations</span>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <div className="text-3xl font-bold text-amber-400 font-mono mb-1">100%</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ownership</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <div className="text-3xl font-bold text-amber-400 font-mono mb-1">20%</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">8th Ledger Tithe</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <div className="text-3xl font-bold text-emerald-400 font-mono mb-1">∞</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Dividend Duration</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <div className="text-3xl font-bold text-cyan-400 font-mono mb-1">PAC</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Perpetual</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <GlowCard accent="amber">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Portfolio Value</span>
              <Globe className="h-4 w-4 text-amber-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalValue} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">{ASSETS.length} active installations</div>
          </GlowCard>

          <GlowCard accent="gold">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-yellow-400 uppercase tracking-wider">Monthly Revenue</span>
              <Activity className="h-4 w-4 text-yellow-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalMonthly} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">From PPA contracts</div>
          </GlowCard>

          <GlowCard accent="emerald">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Total Capacity</span>
              <Zap className="h-4 w-4 text-emerald-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalCapacity} suffix=" MW" />
            </div>
            <div className="text-xs text-slate-500">Combined nameplate capacity</div>
          </GlowCard>

          <GlowCard accent="cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Carbon Offset</span>
              <Leaf className="h-4 w-4 text-cyan-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalCarbon} suffix=" t" />
            </div>
            <div className="text-xs text-slate-500">Monthly CO₂ avoided</div>
          </GlowCard>
        </div>

        <GlowCard accent="amber" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Generation Velocity</h3>
              <p className="text-xs text-slate-400 mt-1">12-month MWh output across all LedgerEnergy assets</p>
            </div>
            <div className="flex gap-2">
              {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                <button key={range} className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${range === "1Y" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 w-full">
            <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="energyLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="0" y1={i * 55} x2="800" y2={i * 55} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              <path
                d={`M0,220 ${GENERATION_HISTORY.map((v, i) => {
                  const x = (i / (GENERATION_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 35000) / 28000) * 220;
                  return `L${x},${y}`;
                }).join(" ")} L800,220 Z`}
                fill="url(#energyGrad)"
              />
              <path
                d={`M0,${220 - ((GENERATION_HISTORY[0] - 35000) / 28000) * 220} ${GENERATION_HISTORY.map((v, i) => {
                  const x = (i / (GENERATION_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 35000) / 28000) * 220;
                  return `L${x},${y}`;
                }).join(" ")}`}
                fill="none"
                stroke="url(#energyLine)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {GENERATION_HISTORY.map((v, i) => {
                const x = (i / (GENERATION_HISTORY.length - 1)) * 800;
                const y = 220 - ((v - 35000) / 28000) * 220;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#050508" stroke="#fbbf24" strokeWidth="2" />
                    {i === GENERATION_HISTORY.length - 1 && (
                      <>
                        <circle cx={x} cy={y} r="8" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5">
                          <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text x={x} y={y - 12} textAnchor="middle" fill="#fff" fontSize="11" fontFamily="monospace">{(v / 1000).toFixed(1)}k MWh</text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-500 mt-2 px-2">
            <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
            <span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span>
          </div>
        </GlowCard>

        <GlowCard accent="gold" className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Power Purchase Agreements</h3>
              <p className="text-xs text-slate-400">Offtake contracts and rate structures — revenue flows to hall treasury</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Buyer</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-right">Rate</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-right">Volume</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Term</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {PPAS.map((ppa) => (
                  <tr key={ppa.id} className="group hover:bg-slate-800/20 transition-colors">
                    <td className="py-4">
                      <div className="text-sm font-semibold text-white">{ppa.buyer}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{ppa.id.toUpperCase()}</div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-sm font-mono text-amber-400">${ppa.rate}<span className="text-xs text-slate-500">/MWh</span></div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-sm font-mono text-white">{(ppa.volume / 1000).toFixed(0)}k <span className="text-xs text-slate-500">MWh/yr</span></div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs text-slate-300">{ppa.term}</span>
                    </td>
                    <td className="py-4 text-center">
                      <StatusBadge status={ppa.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlowCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <GlowCard accent="emerald">
              <div className="flex items-center gap-3 mb-6">
                <Leaf className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Carbon Credit Registry</h3>
                  <p className="text-xs text-slate-400">Verified emission reductions — revenue asset for the hall</p>
                </div>
              </div>
              <div className="space-y-3">
                {CARBON.map((credit) => (
                  <div key={credit.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{credit.standard}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Vintage {credit.vintage} • {credit.tons.toLocaleString()} tCO₂</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-emerald-400">${credit.price}<span className="text-xs text-slate-500">/ton</span></div>
                      <div className="mt-1"><StatusBadge status={credit.status} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>
          </div>

          <div>
            <GlowCard accent="violet">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Market Price</h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">VCS Spot</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">$28.40</div>
                  <div className="text-[10px] text-emerald-400/70">↑ 4.2% this week</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Gold Standard</div>
                  <div className="text-xl font-bold text-amber-400 font-mono">$32.15</div>
                  <div className="text-[10px] text-amber-400/70">↑ 2.8% this week</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">CDM Forward</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono">$24.00</div>
                  <div className="text-[10px] text-cyan-400/70">↑ 1.5% this week</div>
                </div>
              </div>
            </GlowCard>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Generation Assets</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{ASSETS.length} installations globally</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ASSETS.map((asset) => (
              <GlowCard key={asset.id} accent="amber">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-4 border border-slate-800">
                  {asset.image ? (
                    <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageSkeleton icon={Sun} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={asset.status} />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <div className="text-lg font-bold text-white">{asset.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {asset.region}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-xs text-amber-300 font-mono">
                      <TypeIcon type={asset.type} />
                      {asset.type}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Capacity</div>
                    <div className="text-sm font-bold text-white font-mono">{asset.capacity}MW</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Gen</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">{(asset.generation / 1000).toFixed(1)}k</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Ownership</div>
                    <div className="text-sm font-bold text-white font-mono">{asset.ownership}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Monthly</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">${asset.monthlyIncome.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Leaf className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">{asset.carbonOffset.toLocaleString()} t</span> CO₂/month
                  </div>
                  <button className="text-xs text-amber-400 flex items-center gap-1 hover:text-amber-300 transition-colors">
                    View Hall <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>

        <GlowCard accent="amber" className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Server className="h-5 w-5 text-amber-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">How LedgerEnergy Works</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each asset shows its true acquisition cost and pool target. When the pool fills, the 8th Ledger acquires the installation, forms the legal SPV, and activates insurance. 
                  Revenue from PPAs and carbon credits flows to the hall treasury. The 8th Ledger Tithe (20%) covers protocol operations. The remainder splits by PAC ownership percentage — monthly, automatically.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Class I — Passive</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  8th Ledger manages everything. Minimal hall input. No workers hired by the hall — only contracted vendors for maintenance and grid operations. 
                  You vote on PPA terms and major repairs. The 8th Ledger handles grid connections, insurance, and compliance. Your PAC earns forever.
                </p>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}