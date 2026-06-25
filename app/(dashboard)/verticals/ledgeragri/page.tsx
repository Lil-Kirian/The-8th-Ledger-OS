"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sprout, Tractor, Droplets, Sun, Wind, MapPin, ChevronRight, TrendingUp, Thermometer, Check, Globe, BarChart3, Leaf, Wheat } from "lucide-react";

// ─── TYPES ───
interface FarmAsset {
  id: string;
  name: string;
  region: string;
  crop: string;
  status: "planting" | "growing" | "harvesting" | "fallow";
  yield: number;
  value: number;
  ownership: number;
  monthlyIncome: number;
  image?: string;
}

interface CropVote {
  id: string;
  name: string;
  emoji: string;
  votes: number;
  totalVotes: number;
  projectedYield: string;
  season: string;
}

interface LocationOption {
  id: string;
  name: string;
  region: string;
  soilPH: number;
  sunHours: number;
  rainfall: number;
  elevation: number;
  fertilityScore: number;
  image?: string;
}

interface EquipmentRate {
  id: string;
  name: string;
  icon: React.ReactNode;
  dailyRate: number;
  availability: "high" | "medium" | "low";
  unit: string;
}

// ─── MOCK DATA — GLOBAL, NO HARDCODED IMAGES ───
const FARMS: FarmAsset[] = [
  { id: "f1", name: "Highland Estate", region: "East African Highlands", crop: "Arabica Coffee", status: "harvesting", yield: 4200, value: 85000, ownership: 15, monthlyIncome: 3200 },
  { id: "f2", name: "Delta Cooperative", region: "Southeast Asian Delta", crop: "Jasmine Rice", status: "growing", yield: 12800, value: 120000, ownership: 8.5, monthlyIncome: 4500 },
  { id: "f3", name: "Pampas Collective", region: "South American Plains", crop: "Soybean", status: "planting", yield: 9500, value: 95000, ownership: 12, monthlyIncome: 2800 },
  { id: "f4", name: "Alpine Valley", region: "Central European Alps", crop: "Premium Hops", status: "growing", yield: 2100, value: 68000, ownership: 20, monthlyIncome: 5100 },
];

const CROP_VOTES: CropVote[] = [
  { id: "c1", name: "Arabica Coffee", emoji: "☕", votes: 342, totalVotes: 890, projectedYield: "4.2t/ha", season: "Oct–Mar" },
  { id: "c2", name: "Jasmine Rice", emoji: "🍚", votes: 278, totalVotes: 890, projectedYield: "12.8t/ha", season: "Apr–Sep" },
  { id: "c3", name: "Soybean", emoji: "🫘", votes: 156, totalVotes: 890, projectedYield: "9.5t/ha", season: "Mar–Aug" },
  { id: "c4", name: "Premium Hops", emoji: "🍺", votes: 114, totalVotes: 890, projectedYield: "2.1t/ha", season: "May–Sep" },
];

const LOCATIONS: LocationOption[] = [
  { id: "l1", name: "Highland Terrace A", region: "East African Highlands", soilPH: 6.2, sunHours: 8.5, rainfall: 1200, elevation: 1800, fertilityScore: 94 },
  { id: "l2", name: "Delta Basin B", region: "Southeast Asian Delta", soilPH: 5.8, sunHours: 7.2, rainfall: 1800, elevation: 45, fertilityScore: 91 },
  { id: "l3", name: "Pampas Sector C", region: "South American Plains", soilPH: 6.5, sunHours: 9.1, rainfall: 950, elevation: 320, fertilityScore: 88 },
];

const EQUIPMENT: EquipmentRate[] = [
  { id: "e1", name: "Precision Tractor", icon: <Tractor className="h-5 w-5" />, dailyRate: 240, availability: "high", unit: "day" },
  { id: "e2", name: "Irrigation Drone", icon: <Droplets className="h-5 w-5" />, dailyRate: 180, availability: "medium", unit: "day" },
  { id: "e3", name: "Solar Harvester", icon: <Sun className="h-5 w-5" />, dailyRate: 520, availability: "low", unit: "day" },
  { id: "e4", name: "Soil Analyzer", icon: <BarChart3 className="h-5 w-5" />, dailyRate: 85, availability: "high", unit: "scan" },
  { id: "e5", name: "Wind Pollinator", icon: <Wind className="h-5 w-5" />, dailyRate: 120, availability: "medium", unit: "day" },
];

const YIELD_HISTORY = [3200, 3400, 3100, 3800, 4200, 4500, 4100, 4800, 5200, 4900, 5600, 5900];

// ─── UTILS ───
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

const GlowCard = ({ children, className = "", accent = "emerald" }: { children: React.ReactNode; className?: string; accent?: "emerald" | "cyan" | "gold" | "purple" | "slate" | "amber" }) => {
  const accentMap = {
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 shadow-emerald-500/10",
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 shadow-cyan-500/10",
    gold: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 shadow-amber-500/10",
    purple: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 shadow-violet-500/10",
    slate: "from-slate-500/20 to-gray-500/20 border-slate-500/30 shadow-slate-500/10",
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
    planting: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    growing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    harvesting: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    fallow: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.fallow}`}>
      {status}
    </span>
  );
};

const AvailabilityDot = ({ level }: { level: string }) => {
  const colors = { high: "bg-emerald-400", medium: "bg-amber-400", low: "bg-rose-400" };
  return <div className={`w-2 h-2 rounded-full ${colors[level as keyof typeof colors]} shadow-[0_0_6px_currentColor]`} />;
};

const ImageSkeleton = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
    <Icon className="h-12 w-12 text-slate-700 animate-pulse" />
  </div>
);

export default function LedgerAgriPage() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [votedCrop, setVotedCrop] = useState<string | null>(null);
  const totalValue = FARMS.reduce((s, f) => s + f.value, 0);
  const totalMonthly = FARMS.reduce((s, f) => s + f.monthlyIncome, 0);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-[0.2em]">Vertical Command</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent flex items-center gap-4">
              <span className="text-5xl">🌾</span> LedgerAgri
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Sovereign ownership of agricultural assets — crop farms, greenhouses, livestock, dairy, aquaculture, and apiaries. 
              Class III Active. Hall governs operations. 8th Ledger manages the Protocol Infrastructure Reserve. Global.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                <Sprout className="h-4 w-4" />
                Propose Crop Asset
              </span>
            </button>
          </div>
        </header>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <GlowCard accent="emerald">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Portfolio Value</span>
              <Globe className="h-4 w-4 text-emerald-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalValue} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">{FARMS.length} active farms</div>
          </GlowCard>

          <GlowCard accent="amber">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Monthly Harvest</span>
              <Leaf className="h-4 w-4 text-amber-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalMonthly} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">Revenue from yield sales</div>
          </GlowCard>

          <GlowCard accent="cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Total Yield</span>
              <TrendingUp className="h-4 w-4 text-cyan-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={28600} suffix="t" />
            </div>
            <div className="text-xs text-slate-500">Combined annual tonnage</div>
          </GlowCard>

          <GlowCard accent="purple">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">Equipment Units</span>
              <Tractor className="h-4 w-4 text-violet-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={47} />
            </div>
            <div className="text-xs text-slate-500">Across all regions</div>
          </GlowCard>
        </div>

        {/* YIELD CHART */}
        <GlowCard accent="emerald" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Global Yield Velocity</h3>
              <p className="text-xs text-slate-400 mt-1">12-month production tonnage across all LedgerAgri assets</p>
            </div>
            <div className="flex gap-2">
              {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                <button key={range} className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${range === "1Y" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 w-full">
            <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="agriGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="agriLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="0" y1={i * 55} x2="800" y2={i * 55} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              <path
                d={`M0,220 ${YIELD_HISTORY.map((v, i) => {
                  const x = (i / (YIELD_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 3000) / 3000) * 220;
                  return `L${x},${y}`;
                }).join(" ")} L800,220 Z`}
                fill="url(#agriGrad)"
              />
              <path
                d={`M0,${220 - ((YIELD_HISTORY[0] - 3000) / 3000) * 220} ${YIELD_HISTORY.map((v, i) => {
                  const x = (i / (YIELD_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 3000) / 3000) * 220;
                  return `L${x},${y}`;
                }).join(" ")}`}
                fill="none"
                stroke="url(#agriLine)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {YIELD_HISTORY.map((v, i) => {
                const x = (i / (YIELD_HISTORY.length - 1)) * 800;
                const y = 220 - ((v - 3000) / 3000) * 220;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#050508" stroke="#34d399" strokeWidth="2" />
                    {i === YIELD_HISTORY.length - 1 && (
                      <>
                        <circle cx={x} cy={y} r="8" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.5">
                          <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text x={x} y={y - 12} textAnchor="middle" fill="#fff" fontSize="11" fontFamily="monospace">{(v / 1000).toFixed(1)}k t</text>
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

        {/* LOCATION VOTER */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Location Selection</h3>
              <p className="text-xs text-slate-400">Community vote on next cultivation site</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {LOCATIONS.map((loc) => (
              <GlowCard key={loc.id} accent={selectedLocation === loc.id ? "emerald" : "slate"} className={selectedLocation === loc.id ? "ring-1 ring-emerald-500/50" : ""}>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 border border-slate-800">
                  {loc.image ? (
                    <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageSkeleton icon={MapPin} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-70" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-bold text-white">{loc.name}</span>
                    <div className="text-[10px] text-slate-400">{loc.region}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Soil pH</div>
                    <div className="text-sm font-mono font-bold text-emerald-300">{loc.soilPH}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Sun</div>
                    <div className="text-sm font-mono font-bold text-amber-300">{loc.sunHours}h</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Rainfall</div>
                    <div className="text-sm font-mono font-bold text-cyan-300">{loc.rainfall}mm</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Elevation</div>
                    <div className="text-sm font-mono font-bold text-violet-300">{loc.elevation}m</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-slate-400">Fertility Score</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{loc.fertilityScore}/100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${loc.fertilityScore}%` }} />
                </div>
                <button
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    selectedLocation === loc.id
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {selectedLocation === loc.id ? (
                    <span className="flex items-center justify-center gap-2"><Check className="h-3 w-3" /> Selected</span>
                  ) : (
                    "Vote for This Site"
                  )}
                </button>
              </GlowCard>
            ))}
          </div>
        </div>

        {/* CROP TYPE VOTES */}
        <GlowCard accent="emerald" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sprout className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Crop Type Consensus</h3>
                <p className="text-xs text-slate-400">Community decides what we cultivate next season</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">{CROP_VOTES.reduce((s, c) => s + c.votes, 0)} total votes</span>
          </div>
          <div className="space-y-4">
            {CROP_VOTES.map((crop) => {
              const pct = (crop.votes / crop.totalVotes) * 100;
              return (
                <div key={crop.id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{crop.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{crop.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{crop.season} • {crop.projectedYield}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono">{crop.votes} votes</div>
                      <div className="text-[10px] text-slate-500">{pct.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 relative"
                      style={{ width: `${pct}%` }}
                    >
                      {votedCrop === crop.id && (
                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600 font-mono">Projected: {crop.projectedYield}</span>
                    <button
                      onClick={() => setVotedCrop(crop.id)}
                      className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        votedCrop === crop.id ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400"
                      }`}
                    >
                      {votedCrop === crop.id ? "Voted ✓" : "Vote"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlowCard>

        {/* EQUIPMENT RENTAL */}
        <GlowCard accent="amber" className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Tractor className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Equipment Rental Rates</h3>
              <p className="text-xs text-slate-400">Machinery available to Hall owners</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EQUIPMENT.map((eq) => (
              <div key={eq.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/20 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                      {eq.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{eq.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <AvailabilityDot level={eq.availability} />
                        <span className="text-[10px] text-slate-500 uppercase">{eq.availability} availability</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-amber-400 font-mono">${eq.dailyRate}</span>
                    <span className="text-xs text-slate-500">/{eq.unit}</span>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/20 transition-colors">
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* ACTIVE FARMS GRID */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Active Farms</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{FARMS.length} assets globally</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FARMS.map((farm) => (
              <GlowCard key={farm.id} accent="emerald">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-4 border border-slate-800">
                  {farm.image ? (
                    <img src={farm.image} alt={farm.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageSkeleton icon={Sprout} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={farm.status} />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-lg font-bold text-white">{farm.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {farm.region}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Ownership</div>
                    <div className="text-sm font-bold text-white font-mono">{farm.ownership}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Yield</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">{farm.yield.toLocaleString()}t</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Monthly</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">${farm.monthlyIncome.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Current crop: <span className="text-emerald-300">{farm.crop}</span></div>
                  <button className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors">
                    View Hall <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>

        {/* LedgerAgri Info Footer */}
        <GlowCard accent="emerald" className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Wheat className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">How LedgerAgri Works</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each pool shows the True Acquisition Cost and the Protocol Infrastructure Reserve (PIR). 
                  When the pool fills, the 8th Ledger acquires the asset, forms the legal SPV, and activates 
                  insurance. You receive a Perpetual Asset Contract (PAC) representing your ownership percentage. 
                  Revenue is distributed monthly after the 8th Ledger Tithe (20%) and payroll costs.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Class III Active Operations</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  LedgerAgri is Class III Active — the hall governs daily operations including crop selection, 
                  inventory orders, staffing levels, and equipment rental. The 8th Ledger handles payroll execution, 
                  vendor contracts, and worker management through the Forge Ledger. Any hall can vote to enable 
                  inventory or forge operations at 51% threshold.
                </p>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}