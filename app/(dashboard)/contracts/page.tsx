"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, QrCode, Shield, Check, Globe, TrendingUp, Calendar, Lock, Award, Stamp,
  Copy, CheckCircle2, ExternalLink, Clock, Sparkles, ChevronRight
} from "lucide-react";

// ─── TYPES ───
interface PacContract {
  id: string;
  token: string;
  hallName: string;
  vertical: string;
  emoji: string;
  ownershipPercent: number;
  value: number;
  issuedAt: string;
  expiresAt: string | null;
  assetImage: string;
  revenueHistory: number[];
  status: "active" | "maturing" | "dormant";
}

// ─── MOCK DATA ───
const CONTRACTS: PacContract[] = [
  { id: "pc1", token: "PAC-LEDGERPROP-7A3F-001", hallName: "LedgerProp — Lekki Phase 1", vertical: "LedgerProp", emoji: "🏛", ownershipPercent: 12.5, value: 45000, issuedAt: "2024-06-12", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=400&fit=crop", revenueHistory: [2100, 2300, 2200, 2600, 2840, 2700, 3100, 2900, 3400, 3200, 3600, 2840], status: "active" },
  { id: "pc2", token: "PAC-LEDGERAUTO-7A3F-002", hallName: "LedgerAuto — Lagos Fleet", vertical: "LedgerAuto", emoji: "🚗", ownershipPercent: 8.3, value: 32000, issuedAt: "2024-08-20", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop", revenueHistory: [1400, 1600, 1500, 1800, 1920, 1850, 2100, 2000, 2300, 2200, 2500, 1920], status: "active" },
  { id: "pc3", token: "PAC-LEDGERTRAVEL-7A3F-003", hallName: "LedgerTravel — Aero Fraction", vertical: "LedgerTravel", emoji: "✈", ownershipPercent: 15.0, value: 55000, issuedAt: "2024-11-05", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=400&fit=crop", revenueHistory: [3200, 3500, 3400, 3900, 4100, 3800, 4500, 4200, 4800, 4600, 5200, 4100], status: "active" },
  { id: "pc4", token: "PAC-LEDGERAGRI-7A3F-004", hallName: "LedgerAgri — Ogun Cocoa", vertical: "LedgerAgri", emoji: "🌿", ownershipPercent: 5.2, value: 18000, issuedAt: "2025-01-15", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=400&fit=crop", revenueHistory: [600, 700, 650, 800, 890, 850, 950, 900, 1000, 950, 1100, 890], status: "maturing" },
  { id: "pc5", token: "PAC-LEDGERENERGY-7A3F-005", hallName: "LedgerEnergy — Solar Array A", vertical: "LedgerEnergy", emoji: "⚡", ownershipPercent: 10.0, value: 34000, issuedAt: "2025-03-22", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=400&fit=crop", revenueHistory: [1800, 2000, 1900, 2200, 2250, 2100, 2400, 2300, 2600, 2500, 2800, 2250], status: "active" },
  { id: "pc6", token: "PAC-LEDGEREDU-7A3F-007", hallName: "LedgerEdu — Quantum Campus", vertical: "LedgerEdu", emoji: "🎓", ownershipPercent: 20.0, value: 68000, issuedAt: "2025-07-01", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=400&fit=crop", revenueHistory: [4200, 4800, 4600, 5200, 5600, 5400, 6000, 5800, 6400, 6200, 6800, 5600], status: "active" },
  { id: "pc7", token: "PAC-LEDGERHEALTH-7A3F-008", hallName: "LedgerHealth — Diagnostics", vertical: "LedgerHealth", emoji: "🏥", ownershipPercent: 4.1, value: 15000, issuedAt: "2025-09-18", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&h=400&fit=crop", revenueHistory: [500, 550, 520, 650, 720, 680, 750, 720, 800, 780, 850, 720], status: "dormant" },
  { id: "pc8", token: "PAC-LEDGERTECH-7A3F-009", hallName: "LedgerTech — Data Center", vertical: "LedgerTech", emoji: "💻", ownershipPercent: 7.5, value: 29000, issuedAt: "2025-11-30", expiresAt: null, assetImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop", revenueHistory: [1200, 1400, 1300, 1600, 1750, 1650, 1900, 1800, 2000, 1950, 2200, 1750], status: "active" },
];

// ─── UTILS ───
const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "decimal", maximumFractionDigits: 0 }).format(n);

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

const GlowCard = ({ children, className = "", accent = "cyan" }: { children: React.ReactNode; className?: string; accent?: "cyan" | "gold" | "purple" | "red" | "slate" | "emerald" | "amber" | "violet" }) => {
  const accentMap = {
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 shadow-cyan-500/10",
    gold: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 shadow-amber-500/10",
    purple: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 shadow-violet-500/10",
    red: "from-rose-500/20 to-red-500/20 border-rose-500/30 shadow-rose-500/10",
    slate: "from-slate-500/20 to-gray-500/20 border-slate-500/30 shadow-slate-500/10",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 shadow-emerald-500/10",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30 shadow-amber-500/10",
    violet: "from-violet-500/20 to-purple-500/20 border-violet-500/30 shadow-violet-500/10",
  };
  return (
    <div className={`relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl ${accentMap[accent]} ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    maturing: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dormant: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.active}`}>
      {status}
    </span>
  );
};

const MiniSparkline = ({ data, color = "#22d3ee" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 200;
  const height = 40;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#spark-${color.replace("#", "")})`} points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="3" fill={color} className="drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]" />
    </svg>
  );
};

// ─── QR CODE COMPONENT ───
const QRCodeSVG = ({ token }: { token: string }) => (
  <svg width="72" height="72" viewBox="0 0 72 72" className="opacity-70">
    <rect x="0" y="0" width="72" height="72" fill="none" />
    <rect x="4" y="4" width="20" height="20" rx="2" fill="currentColor" className="text-slate-300" />
    <rect x="8" y="8" width="12" height="12" rx="1" fill="#050508" />
    <rect x="11" y="11" width="6" height="6" rx="1" fill="currentColor" className="text-slate-300" />
    <rect x="48" y="4" width="20" height="20" rx="2" fill="currentColor" className="text-slate-300" />
    <rect x="52" y="8" width="12" height="12" rx="1" fill="#050508" />
    <rect x="55" y="11" width="6" height="6" rx="1" fill="currentColor" className="text-slate-300" />
    <rect x="4" y="48" width="20" height="20" rx="2" fill="currentColor" className="text-slate-300" />
    <rect x="8" y="52" width="12" height="12" rx="1" fill="#050508" />
    <rect x="11" y="55" width="6" height="6" rx="1" fill="currentColor" className="text-slate-300" />
    {Array.from({ length: 30 }).map((_, i) => {
      const cx = 28 + (i % 6) * 6;
      const cy = 28 + Math.floor(i / 6) * 6;
      return (
        <rect key={i} x={cx} y={cy} width={Math.random() > 0.4 ? 4 : 2} height={Math.random() > 0.4 ? 4 : 2} rx="0.5" fill="currentColor" className="text-slate-500" opacity={0.5 + Math.random() * 0.5} />
      );
    })}
    <text x="36" y="68" textAnchor="middle" fill="currentColor" className="text-slate-400" fontSize="5" fontFamily="monospace" fontWeight="bold">8TH</text>
  </svg>
);

// ─── COPY HOOK ───
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

// ─── CONTRACT AGE HELPER ───
function getContractAge(issuedAt: string): string {
  const days = Math.floor((Date.now() - new Date(issuedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}yr`;
}

export default function ContractsPage() {
  const { copied, copy } = useCopy();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalValue = CONTRACTS.reduce((s, c) => s + c.value, 0);
    const totalContracts = CONTRACTS.length;
    const activeContracts = CONTRACTS.filter(c => c.status === "active").length;
    const totalOwnership = CONTRACTS.reduce((s, c) => s + c.ownershipPercent, 0);
    const totalRevenue = CONTRACTS.reduce((s, c) => s + c.revenueHistory.reduce((a, b) => a + b, 0), 0);
    return { totalValue, totalContracts, activeContracts, totalOwnership, totalRevenue };
  }, []);

  const handleDownload = (contract: PacContract) => {
    const csv = [
      ["8TH LEDGER PERPETUAL ASSET CONTRACT"],
      [""],
      ["Token:", contract.token],
      ["Hall:", contract.hallName],
      ["Vertical:", contract.vertical],
      ["Ownership:", `${contract.ownershipPercent}%`],
      ["Value:", `${contract.value.toLocaleString()}`],
      ["Issued:", contract.issuedAt],
      ["Status:", contract.status.toUpperCase()],
      [""],
      ["This certifies sovereign ownership in the 8th Ledger protocol."],
      ["Immutable. Transferable. Revenue-bearing."],
      [""],
      ["Hash:", `sha256://${contract.token}`],
    ].map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contract.token}_PAC_CERTIFICATE.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const rows = CONTRACTS.map(c => [
      c.token, c.hallName, c.vertical, c.ownershipPercent, c.value, c.status, c.issuedAt
    ]);
    const csv = [
      ["Token", "Hall", "Vertical", "Ownership%", "Value", "Status", "Issued"],
      ...rows
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `8TH_LEDGER_ALL_PAC_CONTRACTS.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-violet-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-[0.2em]">Sovereign Deed Registry</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-4">
              <span className="text-5xl">📜</span> PAC Contracts
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Perpetual Asset Contract certificates. Immutable ownership deeds. Revenue-bearing. Transferable. Downloadable for audit and legal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAll}
              className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-sm overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export All
              </span>
            </button>
          </div>
        </motion.header>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <GlowCard accent="cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Total Value</span>
              <FileText className="h-4 w-4 text-cyan-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              $<AnimatedCounter value={stats.totalValue} />
            </div>
            <div className="text-xs text-slate-500">All PAC certificates</div>
          </GlowCard>

          <GlowCard accent="gold">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Contracts</span>
              <Shield className="h-4 w-4 text-amber-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={stats.totalContracts} />
            </div>
            <div className="text-xs text-slate-500">Active + maturing</div>
          </GlowCard>

          <GlowCard accent="emerald">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Active</span>
              <Check className="h-4 w-4 text-emerald-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={stats.activeContracts} />
            </div>
            <div className="text-xs text-slate-500">Revenue-bearing now</div>
          </GlowCard>

          <GlowCard accent="purple">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">Ownership</span>
              <Lock className="h-4 w-4 text-violet-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedCounter value={stats.totalOwnership} suffix="%" />
            </div>
            <div className="text-xs text-slate-500">Combined stake</div>
          </GlowCard>

          <GlowCard accent="amber">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Revenue</span>
              <TrendingUp className="h-4 w-4 text-amber-400/50" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              $<AnimatedCounter value={stats.totalRevenue} />
            </div>
            <div className="text-xs text-slate-500">Lifetime earned</div>
          </GlowCard>
        </div>

        {/* CONTRACT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CONTRACTS.map((contract, index) => {
            const lastRevenue = contract.revenueHistory[contract.revenueHistory.length - 1];
            const avgRevenue = contract.revenueHistory.reduce((a, b) => a + b, 0) / contract.revenueHistory.length;
            const totalEarned = contract.revenueHistory.reduce((a, b) => a + b, 0);
            const age = getContractAge(contract.issuedAt);
            const isHovered = hoveredCard === contract.id;

            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                onMouseEnter={() => setHoveredCard(contract.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <GlowCard accent={contract.status === "active" ? "cyan" : contract.status === "maturing" ? "amber" : "red"}>
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Certificate Visual */}
                    <div className="relative w-full md:w-48 shrink-0">
                      <div className="aspect-square rounded-xl overflow-hidden border border-slate-700 relative group">
                        <img src={contract.assetImage} alt={contract.hallName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-70" />
                        
                        {/* Watermark Seal */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 flex items-center justify-center backdrop-blur-sm bg-black/20 rotate-[-12deg]">
                            <div className="text-center">
                              <Sparkles className="h-6 w-6 text-cyan-400 mx-auto mb-1" />
                              <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Verified</span>
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center">
                          <div className="px-2 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                            <Stamp className="h-3 w-3" />
                            {contract.token.split("-").pop()}
                          </div>
                        </div>
                      </div>
                      
                      {/* QR Code below image */}
                      <div className="mt-3 flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-900/30 border border-slate-800">
                        <QRCodeSVG token={contract.token} />
                        <div className="text-[9px] text-slate-500 font-mono leading-tight">
                          <div>SCAN TO</div>
                          <div>VERIFY</div>
                          <div className="text-cyan-500/60 mt-1">8TH LEDGER</div>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Data */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{contract.emoji}</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{contract.vertical}</span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-600 ml-2">
                              <Clock className="h-3 w-3" /> {age}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-cyan-200 transition-colors">{contract.hallName}</h3>
                        </div>
                        <StatusBadge status={contract.status} />
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(contract.ownershipPercent / 25) * 100}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400"
                          />
                        </div>
                        <span className="text-sm font-bold text-cyan-400 font-mono">{contract.ownershipPercent}%</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-cyan-500/20 transition-colors">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Value</div>
                          <div className="text-sm font-bold text-white font-mono">${formatMoney(contract.value)}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-emerald-500/20 transition-colors">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Month</div>
                          <div className="text-sm font-bold text-emerald-400 font-mono">${formatMoney(lastRevenue)}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-amber-500/20 transition-colors">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Earned</div>
                          <div className="text-sm font-bold text-amber-400 font-mono">${formatMoney(totalEarned)}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">12-Month Revenue</span>
                          <span className="text-[10px] text-slate-500 font-mono">Avg: ${formatMoney(avgRevenue)}</span>
                        </div>
                        <div className="h-10 opacity-70">
                          <MiniSparkline data={contract.revenueHistory} color={contract.status === "active" ? "#22d3ee" : contract.status === "maturing" ? "#fbbf24" : "#f43f5e"} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {contract.issuedAt}</span>
                          <button
                            onClick={() => copy(contract.token, contract.id)}
                            className="flex items-center gap-1 hover:text-cyan-400 transition-colors group/copy"
                          >
                            {copied === contract.id ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span className="group-hover/copy:text-cyan-400">{copied === contract.id ? "Copied" : contract.token}</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(contract)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/20 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM: LEGAL DISCLAIMER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GlowCard accent="slate" className="mt-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700/30 border border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">PAC Legal Framework</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Each Perpetual Asset Contract (PAC) is a cryptographically signed deed of ownership within the 8th Ledger proprietary engine. 
                  PACs are not securities, not tokens on a public blockchain, and not transferable outside the 8th Ledger ecosystem without 
                  Hall governance approval. Revenue distributions follow the 8th Ledger Tithe: 20% to Protocol Infrastructure Reserve (PIR),
                  80% to Hall Treasury (pro-rata by ownership).
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs border border-slate-700 flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> Immutable Hash
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs border border-slate-700 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Auditable
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs border border-slate-700 flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" /> Revenue-Bearing
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs border border-slate-700 flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Non-Transferable (w/o Vote)
                  </span>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}