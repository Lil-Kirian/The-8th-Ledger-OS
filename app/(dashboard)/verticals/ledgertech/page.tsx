"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hexagon, ArrowRight, Cpu, Server, HardDrive, Wifi,
  Timer, Users, Globe, Target, Search, SlidersHorizontal,
  ChevronDown, Monitor, Smartphone, CircuitBoard, Database,
  MapPin, TrendingUp, Zap, Lock, Radio, ShoppingCart, Wrench
} from "lucide-react";
import Link from "next/link";

type Pool = {
  id: string;
  poolId: string;
  name: string;
  assetValue: number;
  accessThreshold: number;
  committed: number;
  participants: number;
  maxParticipants: number;
  status: string;
  country: string;
  description: string;
  imageUrl?: string;
  closesAt: string;
};

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

const GlowCard = ({ children, className = "", accent = "pink" }: { children: React.ReactNode; className?: string; accent?: "pink" | "cyan" | "gold" | "slate" | "emerald" | "violet" | "rose" }) => {
  const accentMap = {
    pink: "from-pink-500/20 to-rose-500/20 border-pink-500/30 shadow-pink-500/10",
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 shadow-cyan-500/10",
    gold: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 shadow-amber-500/10",
    slate: "from-slate-500/20 to-gray-500/20 border-slate-500/30 shadow-slate-500/10",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 shadow-emerald-500/10",
    violet: "from-violet-500/20 to-purple-500/20 border-violet-500/30 shadow-violet-500/10",
    rose: "from-rose-500/20 to-pink-500/20 border-rose-500/30 shadow-rose-500/10",
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
    filling: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    consensus: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    distributed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    closed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    suspended: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.filling}`}>
      {status}
    </span>
  );
};

const ImageSkeleton = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
    <Icon className="h-12 w-12 text-slate-700 animate-pulse" />
  </div>
);

export default function LedgerTechPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"threshold" | "value" | "participants" | "closing">("threshold");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchLedgerTech() {
      try {
        const res = await fetch("/api/pools?vertical=ledgertech");
        const data = await res.json();
        if (data.success && data.pools) {
          setPools(data.pools.map((p: any) => ({
            ...p,
            accessThreshold: p.accessThreshold || p.target,
            id: p.poolId || p.id,
          })));
        }
      } catch (err) {
        console.error("[LEDGERTECH]", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLedgerTech();
  }, []);

  const filteredPools = useMemo(() => {
    let result = [...pools];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    switch (sortBy) {
      case "threshold": result.sort((a, b) => b.accessThreshold - a.accessThreshold); break;
      case "value": result.sort((a, b) => b.assetValue - a.assetValue); break;
      case "participants": result.sort((a, b) => b.participants - a.participants); break;
      case "closing": result.sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime()); break;
    }
    return result;
  }, [pools, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const totalValue = pools.reduce((sum, p) => sum + p.assetValue, 0);
    const totalThreshold = pools.reduce((sum, p) => sum + p.accessThreshold, 0);
    const activePools = pools.filter((p) => p.status === "filling").length;
    return { totalValue, totalThreshold, activePools };
  }, [pools]);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-pink-500/30 selection:text-pink-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-pink-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-pink-400 animate-pulse shadow-[0_0_10px_rgba(244,114,182,0.6)]" />
              <span className="text-xs font-mono text-pink-400 uppercase tracking-[0.2em]">Class III — Active Operation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-pink-100 to-pink-200 bg-clip-text text-transparent flex items-center gap-4">
              <span className="text-5xl">💻</span> LedgerTech
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Own technology retail and operations. Electronics stores, repair shops, server farms, 3D printing hubs, drone fleets. 
              Hall runs daily operations — inventory, staffing, pricing, marketing. 8th Ledger handles payroll, compliance, and contracts. Your PAC earns from every sale.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Propose Tech Asset
              </span>
            </button>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-[#0a0a14] to-transparent p-8 mb-8">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="h-5 w-5 text-pink-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400/80">Direct Operation — Fast Turnover</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Own the Store. Earn from Every Sale.</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Each asset shows its true acquisition cost and pool target. When the pool fills, the 8th Ledger acquires the facility, forms the legal SPV, and activates insurance. 
                Revenue from hardware sales, repair services, and subscriptions flows to the hall treasury. The 8th Ledger Tithe (20%) covers protocol operations. Payroll is deducted before dividends. The remainder splits by PAC ownership percentage — monthly, automatically.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20 text-xs font-mono">All = Owners</span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">PAC = Dividends</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">Hall = Operations</span>
                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">8th Ledger = Payroll + Compliance</span>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <div className="text-3xl font-bold text-pink-400 font-mono mb-1">100%</div>
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
          <GlowCard accent="pink">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-pink-400 uppercase tracking-wider">Asset Value</span>
              <Cpu className="h-4 w-4 text-pink-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={stats.totalValue} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">{pools.length} assets globally</div>
          </GlowCard>

          <GlowCard accent="gold">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Pool Target</span>
              <TrendingUp className="h-4 w-4 text-amber-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={stats.totalThreshold} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">Combined acquisition target</div>
          </GlowCard>

          <GlowCard accent="cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Active Pools</span>
              <Zap className="h-4 w-4 text-cyan-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={stats.activePools} />
            </div>
            <div className="text-xs text-slate-500">Available for commitment</div>
          </GlowCard>

          <GlowCard accent="emerald">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Participants</span>
              <Users className="h-4 w-4 text-emerald-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={pools.reduce((s, p) => s + p.participants, 0)} />
            </div>
            <div className="text-xs text-slate-500">Globally committed</div>
          </GlowCard>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search electronics, servers, repair shops, 3D printing..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Sort
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden mb-6"
            >
              {[
                { key: "threshold", label: "Highest Target" },
                { key: "value", label: "Highest Value" },
                { key: "participants", label: "Most Popular" },
                { key: "closing", label: "Closing Soon" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${
                    sortBy === opt.key
                      ? "bg-pink-500/10 text-pink-400 border-pink-500/30"
                      : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-500 border-t-transparent shadow-[0_0_15px_rgba(236,72,153,0.3)]" />
          </div>
        ) : filteredPools.length === 0 ? (
          <GlowCard accent="slate" className="text-center py-16">
            <CircuitBoard className="mx-auto h-12 w-12 text-slate-700 mb-4" />
            <p className="text-lg text-slate-400 font-semibold">No tech assets found</p>
            <p className="text-xs text-slate-600 mt-2">
              {searchQuery ? "Try a different search term" : "Check back soon for new listings"}
            </p>
          </GlowCard>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredPools.map((pool) => {
                const fillPct = pool.accessThreshold > 0
                  ? Math.min((pool.committed / pool.accessThreshold) * 100, 100)
                  : 0;
                const timeLeft = new Date(pool.closesAt).getTime() - Date.now();
                const isExpired = timeLeft <= 0;

                return (
                  <motion.div
                    key={pool.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <GlowCard accent="pink" className="h-full flex flex-col">
                      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-800 mb-4">
                        {pool.imageUrl ? (
                          <img src={pool.imageUrl} alt={pool.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageSkeleton icon={CircuitBoard} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 border border-slate-700 px-2 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
                          <MapPin className="h-3 w-3 text-pink-400" />
                          {pool.country}
                        </div>
                        <div className="absolute right-3 top-3">
                          <StatusBadge status={pool.status} />
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1 mb-1">
                        {pool.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{pool.description || "Technology retail & operations asset."}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700 flex items-center gap-1">
                          <Cpu className="h-3 w-3" /> Hardware
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700 flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Repair
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700 flex items-center gap-1">
                          <Hexagon className="h-3 w-3" /> LedgerTech
                        </span>
                      </div>

                      <div className="mt-auto p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div className="flex items-baseline justify-between mb-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-pink-400/60 font-mono">Target</p>
                            <p className="text-lg font-bold font-mono text-pink-400">
                              ${pool.accessThreshold.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500">Asset Value</p>
                            <p className="text-sm font-mono text-slate-400">${pool.assetValue.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-pink-400/80 font-mono">{fillPct.toFixed(1)}% to target</span>
                            <span className="text-slate-600 font-mono">${pool.committed.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {pool.participants}/{pool.maxParticipants}</span>
                          <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {isExpired ? "Closed" : `${Math.ceil(timeLeft / 86400000)}d`}</span>
                        </div>
                      </div>

                      <Link
                        href={`/pool/${pool.poolId}`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500/10 border border-pink-500/30 py-2.5 text-xs font-bold uppercase tracking-wider text-pink-400 hover:bg-pink-500/20 transition-all"
                      >
                        View Asset
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <GlowCard accent="pink" className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/30">
              <Radio className="h-5 w-5 text-pink-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">How LedgerTech Works</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each asset shows its true acquisition cost and pool target. When the pool fills, the 8th Ledger acquires the facility, forms the legal SPV, and activates insurance. 
                  Revenue from hardware sales, repair services, and licensing flows to the hall treasury. The 8th Ledger Tithe (20%) covers protocol operations. Payroll is deducted before dividends. The remainder splits by PAC ownership percentage — monthly, automatically.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Class III — Active</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hall runs operations daily. Vote on inventory orders, staffing levels, pricing, marketing spend, and supplier selection. 
                  8th Ledger handles payroll execution, vendor contracts, tax, insurance, and worker contracts. Hall proposes hires and fires. 8th Ledger recruits, vets, and manages. Your PAC earns from every sale.
                </p>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}