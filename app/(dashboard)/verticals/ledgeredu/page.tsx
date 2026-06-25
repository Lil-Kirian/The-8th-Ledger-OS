"use client";

import React, { useState, useRef, useEffect } from "react";
import { Crown, BookOpen, GraduationCap, Users, Globe, Zap, TrendingUp, Check, ChevronRight, Award, Building2, FileText, Lock, Sparkles, School } from "lucide-react";

interface CourseAsset {
  id: string;
  name: string;
  category: string;
  students: number;
  revenue: number;
  value: number;
  ownership: number;
  monthlyIncome: number;
  status: "live" | "pilot" | "archived";
  image?: string;
}

interface CorporateContract {
  id: string;
  company: string;
  trainees: number;
  value: number;
  term: string;
  status: "active" | "renewing" | "completed";
  modules: string[];
}

const COURSES: CourseAsset[] = [
  { id: "c1", name: "Quantum Finance Masterclass", category: "Finance", students: 2840, revenue: 142000, value: 850000, ownership: 12, monthlyIncome: 4200, status: "live" },
  { id: "c2", name: "AI Systems Architecture", category: "Technology", students: 4100, revenue: 205000, value: 1200000, ownership: 8, monthlyIncome: 6800, status: "live" },
  { id: "c3", name: "Global Supply Chain Dynamics", category: "Operations", students: 1560, revenue: 78000, value: 420000, ownership: 15, monthlyIncome: 3100, status: "live" },
  { id: "c4", name: "Biotech Innovation Lab", category: "Science", students: 890, revenue: 44500, value: 280000, ownership: 20, monthlyIncome: 2200, status: "pilot" },
  { id: "c5", name: "Sovereign Leadership Protocol", category: "Leadership", students: 3200, revenue: 160000, value: 950000, ownership: 10, monthlyIncome: 5100, status: "live" },
];

const CORPORATES: CorporateContract[] = [
  { id: "cc1", company: "Continental Logistics Group", trainees: 450, value: 225000, term: "18 months", status: "active", modules: ["Supply Chain", "Operations"] },
  { id: "cc2", company: "Pacific Data Systems", trainees: 320, value: 160000, term: "12 months", status: "active", modules: ["AI Architecture", "Cloud Native"] },
  { id: "cc3", company: "Global Health Alliance", trainees: 280, value: 140000, term: "24 months", status: "renewing", modules: ["Biotech", "Regulatory"] },
  { id: "cc4", company: "Meridian Capital", trainees: 180, value: 90000, term: "6 months", status: "active", modules: ["Quantum Finance", "Risk"] },
];

const REVENUE_HISTORY = [28000, 32000, 29500, 38000, 41000, 39000, 45000, 48000, 46000, 52000, 55000, 58900];

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

const GlowCard = ({ children, className = "", accent = "indigo" }: { children: React.ReactNode; className?: string; accent?: "indigo" | "cyan" | "gold" | "slate" | "emerald" | "amber" }) => {
  const accentMap = {
    indigo: "from-indigo-500/20 to-blue-500/20 border-indigo-500/30 shadow-indigo-500/10",
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 shadow-cyan-500/10",
    gold: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 shadow-amber-500/10",
    slate: "from-slate-500/20 to-gray-500/20 border-slate-500/30 shadow-slate-500/10",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 shadow-emerald-500/10",
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
    live: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    pilot: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    archived: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    renewing: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    completed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.live}`}>
      {status}
    </span>
  );
};

const ImageSkeleton = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
    <Icon className="h-12 w-12 text-slate-700 animate-pulse" />
  </div>
);

export default function LedgerEduPage() {
  const totalValue = COURSES.reduce((s, c) => s + c.value, 0);
  const totalMonthly = COURSES.reduce((s, c) => s + c.monthlyIncome, 0);
  const totalStudents = COURSES.reduce((s, c) => s + c.students, 0);
  const totalCorporate = CORPORATES.reduce((s, c) => s + c.value, 0);

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-[0.2em]">Class II — Managed Education</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent flex items-center gap-4">
              <span className="text-5xl">🎓</span> LedgerEdu
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Own education infrastructure. Training campuses, bootcamps, vocational centers, corporate academies. 
              Hall votes on operator selection and service standards. 8th Ledger handles compliance, payroll, and contracts. Your PAC earns from tuition and licensing — forever.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                <School className="h-4 w-4" />
                Propose Education Asset
              </span>
            </button>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-[#0a0a14] to-transparent p-8 mb-8">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400/80">Perpetual Asset Contract</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Own the School. Earn from Every Student.</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                In LedgerEdu, every committer becomes a co-owner through PACs. When the pool fills, the 8th Ledger acquires the facility, licenses it to an operator, and manages all compliance and payroll. Revenue flows to the hall treasury. The 20% tithe sustains the protocol. The rest is yours — split by ownership percentage, distributed monthly.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono">All = Owners</span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">PAC = Dividends</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">Hall = Governance</span>
                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">8th Ledger = Operations</span>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                  <div className="text-3xl font-bold text-indigo-400 font-mono mb-1">100%</div>
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
          <GlowCard accent="indigo">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Portfolio Value</span>
              <BookOpen className="h-4 w-4 text-indigo-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalValue} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">{COURSES.length} active courses</div>
          </GlowCard>

          <GlowCard accent="amber">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Monthly Revenue</span>
              <TrendingUp className="h-4 w-4 text-amber-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalMonthly} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">From content licensing</div>
          </GlowCard>

          <GlowCard accent="cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Total Students</span>
              <Users className="h-4 w-4 text-cyan-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalStudents} />
            </div>
            <div className="text-xs text-slate-500">Globally enrolled</div>
          </GlowCard>

          <GlowCard accent="emerald">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Corporate</span>
              <Building2 className="h-4 w-4 text-emerald-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={totalCorporate} prefix="$" />
            </div>
            <div className="text-xs text-slate-500">{CORPORATES.length} active contracts</div>
          </GlowCard>
        </div>

        <GlowCard accent="indigo" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Content Licensing Revenue</h3>
              <p className="text-xs text-slate-400 mt-1">12-month revenue from course sales, subscriptions, and licensing</p>
            </div>
            <div className="flex gap-2">
              {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                <button key={range} className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${range === "1Y" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56 w-full">
            <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="eduGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="eduLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="0" y1={i * 55} x2="800" y2={i * 55} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              <path
                d={`M0,220 ${REVENUE_HISTORY.map((v, i) => {
                  const x = (i / (REVENUE_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 25000) / 35000) * 220;
                  return `L${x},${y}`;
                }).join(" ")} L800,220 Z`}
                fill="url(#eduGrad)"
              />
              <path
                d={`M0,${220 - ((REVENUE_HISTORY[0] - 25000) / 35000) * 220} ${REVENUE_HISTORY.map((v, i) => {
                  const x = (i / (REVENUE_HISTORY.length - 1)) * 800;
                  const y = 220 - ((v - 25000) / 35000) * 220;
                  return `L${x},${y}`;
                }).join(" ")}`}
                fill="none"
                stroke="url(#eduLine)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {REVENUE_HISTORY.map((v, i) => {
                const x = (i / (REVENUE_HISTORY.length - 1)) * 800;
                const y = 220 - ((v - 25000) / 35000) * 220;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#050508" stroke="#818cf8" strokeWidth="2" />
                    {i === REVENUE_HISTORY.length - 1 && (
                      <>
                        <circle cx={x} cy={y} r="8" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.5">
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

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Course Assets</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{COURSES.length} programs globally</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {COURSES.map((course) => (
              <GlowCard key={course.id} accent="indigo">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-4 border border-slate-800">
                  {course.image ? (
                    <img src={course.image} alt={course.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageSkeleton icon={BookOpen} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={course.status} />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {course.category}
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mb-3 leading-tight">{course.name}</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Students</div>
                    <div className="text-sm font-bold text-white font-mono">{course.students.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Ownership</div>
                    <div className="text-sm font-bold text-indigo-400 font-mono">{course.ownership}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Value</div>
                    <div className="text-sm font-bold text-white font-mono">{formatMoney(course.value)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Monthly</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">{formatMoney(course.monthlyIncome)}</div>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full" style={{ width: `${(course.ownership / 25) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> PAC-secured
                  </span>
                  <button className="text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors">
                    Enter Hall <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>

        <GlowCard accent="emerald" className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Corporate Training Contracts</h3>
              <p className="text-xs text-slate-400">B2B licensing revenue from enterprise partners</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-right">Trainees</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-right">Contract Value</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Term</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Modules</th>
                  <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {CORPORATES.map((cc) => (
                  <tr key={cc.id} className="group hover:bg-slate-800/20 transition-colors">
                    <td className="py-4">
                      <div className="text-sm font-semibold text-white">{cc.company}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{cc.id.toUpperCase()}</div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-sm font-mono text-white">{cc.trainees.toLocaleString()}</div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-sm font-mono text-emerald-400">{formatMoney(cc.value)}</div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs text-slate-300">{cc.term}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {cc.modules.map((m) => (
                          <span key={m} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700">{m}</span>
                        ))}
                      </div>
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

        <GlowCard accent="slate">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-700/30 border border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">PAC Ownership Policy</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                In LedgerEdu, every participant is a co-owner. Your <span className="text-indigo-300 font-semibold">Perpetual Asset Contract (PAC)</span> represents your ownership stake in the education asset. This entitles you to:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white">Dividend Rights</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Monthly income from course licensing, tuition, and corporate contracts</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">Hall Governance</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Vote on operator selection, service standards, and facility upgrades</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Perpetual Ownership</span>
                  </div>
                  <p className="text-[10px] text-slate-500">PAC never expires. Sell on the Ownership Market at dynamic valuation.</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <div className="flex items-center gap-2 text-xs text-indigo-400">
                  <Check className="h-4 w-4" />
                  <span className="font-semibold">Sell anytime on the 8th Ledger Exchange. Dynamic valuation protects your floor price.</span>
                </div>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}