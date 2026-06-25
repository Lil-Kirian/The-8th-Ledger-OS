"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plane, Anchor, Helicopter, TrendingUp, Globe, MapPin, ChevronRight, Lock, Radio, Users, Zap, Clock, Star } from "lucide-react";

interface TravelAsset {
  id: string;
  name: string;
  region: string;
  type: "jet" | "yacht" | "helicopter" | "rv";
  capacity: number;
  range: number;
  value: number;
  ownership: number;
  monthlyIncome: number;
  charterHours: number;
  status: "active" | "maintenance" | "expanding";
  image?: string;
}

interface CharterContract {
  id: string;
  client: string;
  hours: number;
  rate: number;
  term: string;
  status: "active" | "negotiating" | "renewal";
}

const ASSETS: TravelAsset[] = [
  { id: "t1", name: "Gulfstream G650", region: "Dubai International", type: "jet", capacity: 16, range: 7500, value: 450000, ownership: 10, monthlyIncome: 12500, charterHours: 340, status: "active" },
  { id: "t2", name: "Sunseeker 131 Yacht", region: "Monaco Marina", type: "yacht", capacity: 12, range: 0, value: 380000, ownership: 15, monthlyIncome: 9800, charterHours: 280, status: "active" },
  { id: "t3", name: "Airbus H160", region: "São Paulo Heliport", type: "helicopter", capacity: 8, range: 450, value: 220000, ownership: 8, monthlyIncome: 5400, charterHours: 190, status: "active" },
  { id: "t4", name: "Luxury RV Fleet", region: "Pacific Coast Highway", type: "rv", capacity: 6, range: 1200, value: 180000, ownership: 20, monthlyIncome: 4200, charterHours: 0, status: "expanding" },
];

const CONTRACTS: CharterContract[] = [
  { id: "cc1", client: "Meridian Corporate Travel", hours: 120, rate: 8500, term: "12 months", status: "active" },
  { id: "cc2", client: "Global Executive Services", hours: 80, rate: 9200, term: "6 months", status: "active" },
  { id: "cc3", client: "Resort Alliance Group", hours: 200, rate: 6500, term: "18 months", status: "negotiating" },
  { id: "cc4", client: "Film Production Studio", hours: 60, rate: 12000, term: "3 months", status: "renewal" },
];

const CHARTER_HISTORY = [28000, 32000, 29500, 38000, 41000, 39000, 45000, 48000, 46000, 52000, 55000, 58900];

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

const GlowCard = ({ children, className = "", accent = "cyan" }: { children: React.ReactNode; className?: string; accent?: "cyan" | "gold" | "slate" | "emerald" | "violet" | "amber" }) => {
  const accentMap = {
    cyan: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 shadow-cyan-500/10",
    gold: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 shadow-amber-500/10",
    slate: "from-slate-500/20 to-gray-500/20 border-slate-500/30 shadow-slate-500/10",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 shadow-emerald-500/10",
    violet: "from-violet-500/20 to-purple-500/20 border-violet-500/30 shadow-violet-500/10",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30 shadow-amber-500/10",
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
    active: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    expanding: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    negotiating: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    renewal: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.active}`}>
      {status}
    </span>
  );
};

const TypeIcon = ({ type }: { type: string }) => {
  const icons = {
    jet: <Plane className="h-5 w-5 text-cyan-400" />,
    yacht: <Anchor className="h-5 w-5 text-amber-400" />,
    helicopter: <Helicopter className="h-5 w-5 text-violet-400" />,
    rv: <Zap className="h-5 w-5 text-emerald-400" />,
  };
  return icons[type as keyof typeof icons] || <Plane className="h-5 w-5" />;
};

const ImageSkeleton = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
    <Icon className="h-12 w-12 text-slate-700 animate-pulse" />
  </div>
);

export default function LedgerTravelPage() {
  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0);
  const totalMonthly = ASSETS.reduce((s, a) => s + a.monthlyIncome, 0);
  const totalCapacity = ASSETS.reduce((s, a) => s + a.capacity, 0);
  const totalHours = ASSETS.reduce((s, a) => s + a.charterHours, 0);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[45%] h-[45%] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[45%] h-[45%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-[0.2em]">Class II — Managed Travel</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent flex items-center gap-4">
              <span className="text-5xl">✈️</span> LedgerTravel
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Own the journey. Private jets, superyachts, helicopters, luxury RVs. Hall votes on operator selection and charter standards. 
              8th Ledger handles compliance, maintenance, and crew payroll. Your PAC earns from every charter hour — forever.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Propose Travel Asset
              </span>
            </button>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-[#0a0a14] to-transparent p-8 mb-8">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-5 w-5 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400/80">Charter & Lease Revenue</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Own the Fleet. Earn Per Hour.</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Each asset shows its true acquisition cost and pool target. When the pool fills, the 8th Ledger acquires the vessel, forms the legal SPV, and activates insurance. Revenue from charter contracts flows to the hall treasury. The 8th Ledger Tithe (20%) covers protocol operations. The remainder splits by PAC ownership percentage — monthly, automatically.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">All = Owners</span>
                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">PAC = Dividends</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">Hall = Governance</span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">8th Ledger = Operations</span>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <div className="text-3xl font-bold text-cyan-400 font-mono mb-1">100%</div>
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
                  <div className="text-3xl font-bold text-violet-400 font-mono mb-1">PAC</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Perpetual</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <GlowCard accent="cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Portfolio Value</span>
              <Globe className="h-4 w-4 text-cyan-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalValue} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">{ASSETS.length} active vessels</div>
          </GlowCard>

          <GlowCard accent="amber">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Monthly Revenue</span>
              <TrendingUp className="h-4 w-4 text-amber-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalMonthly} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">From charter contracts</div>
          </GlowCard>

          <GlowCard accent="emerald">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Total Capacity</span>
              <Users className="h-4 w-4 text-emerald-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalCapacity} suffix=" pax" />
            </div>
            <div className="text-xs text-slate-500">Combined passenger capacity</div>
          </GlowCard>

          <GlowCard accent="violet">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">Charter Hours</span>
              <Clock className="h-4 w-4 text-violet-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalHours} suffix=" hrs" />
            </div>
            <div className="text-xs text-slate-500">Monthly utilization</div>
          </GlowCard>
        </div>

        <GlowCard accent="cyan" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Charter Revenue Velocity</h3>
              <p className="text-xs text-slate-400 mt-1">12-month revenue from charters, leases, and subscriptions</p>
            </div>
            <div className="flex gap-2">
              {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                <button key={range} className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${range === "1Y" ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 w-full">
            <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="travelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="travelLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="0" y1={i * 55} x2="800" y2={i * 55} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              <path
                d={`M0,220 ${CHARTER_HISTORY.map((v, i) => {
                  const x = (i / (CHARTER_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 25000) / 35000) * 220;
                  return `L${x},${y}`;
                }).join(" ")} L800,220 Z`}
                fill="url(#travelGrad)"
              />
              <path
                d={`M0,${220 - ((CHARTER_HISTORY[0] - 25000) / 35000) * 220} ${CHARTER_HISTORY.map((v, i) => {
                  const x = (i / (CHARTER_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 25000) / 35000) * 220;
                  return `L${x},${y}`;
                }).join(" ")}`}
                fill="none"
                stroke="url(#travelLine)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {CHARTER_HISTORY.map((v, i) => {
                const x = (i / (CHARTER_HISTORY.length - 1)) * 800;
                const y = 220 - ((v - 25000) / 35000) * 220;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#050508" stroke="#22d3ee" strokeWidth="2" />
                    {i === CHARTER_HISTORY.length - 1 && (
                      <>
                        <circle cx={x} cy={y} r="8" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.5">
                          <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text x={x} y={y - 12} textAnchor="middle" fill="#fff" fontSize="11" fontFamily="monospace">{(v / 1000).toFixed(1)}k</text>
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
            <Star className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Charter Contracts</h3>
              <p className="text-xs text-slate-400">Active charter agreements and lease structures</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-right">Hours</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-right">Rate</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Term</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {CONTRACTS.map((cc) => (
                  <tr key={cc.id} className="group hover:bg-slate-800/20 transition-colors">
                    <td className="py-4">
                      <div className="text-sm font-semibold text-white">{cc.client}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{cc.id.toUpperCase()}</div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-sm font-mono text-white">{cc.hours}<span className="text-xs text-slate-500">/mo</span></div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-sm font-mono text-amber-400">${cc.rate.toLocaleString()}<span className="text-xs text-slate-500">/hr</span></div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs text-slate-300">{cc.term}</span>
                    </td>
                    <td className="py-4 text-center">
                      <StatusBadge status={cc.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlowCard>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Travel Assets</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{ASSETS.length} vessels globally</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ASSETS.map((asset) => (
              <GlowCard key={asset.id} accent="cyan">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-4 border border-slate-800">
                  {asset.image ? (
                    <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageSkeleton icon={Plane} />
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
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-xs text-cyan-300 font-mono">
                      <TypeIcon type={asset.type} />
                      {asset.type}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Capacity</div>
                    <div className="text-sm font-bold text-white font-mono">{asset.capacity} pax</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Range</div>
                    <div className="text-sm font-bold text-cyan-400 font-mono">{asset.range > 0 ? `${asset.range}nm` : "N/A"}</div>
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
                    <Clock className="h-3 w-3 text-violet-400" />
                    <span className="text-violet-300">{asset.charterHours.toLocaleString()} hrs</span> /month
                  </div>
                  <button className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors">
                    View Hall <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>

        <GlowCard accent="cyan" className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Plane className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">How LedgerTravel Works</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each asset shows its true acquisition cost and pool target. When the pool fills, the 8th Ledger acquires the vessel, forms the legal SPV, and activates insurance. Revenue from charter contracts flows to the hall treasury. The 8th Ledger Tithe (20%) covers protocol operations. The remainder splits by PAC ownership percentage — monthly, automatically.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Class II — Managed</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hall hires/approves operators. 8th Ledger executes through operator. Limited staff. Hall votes on operator selection, service standards, pricing tiers, and staff levels. 8th Ledger handles operator contracts, compliance, equipment maintenance, and payroll through operator. Your PAC earns from charter revenue — forever.
                </p>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}