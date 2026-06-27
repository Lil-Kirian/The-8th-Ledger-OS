// app/architect/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Shield, Eye, Globe, Flame, TrendingUp, AlertTriangle, Lock,
  Clock, MapPin, Fingerprint, KeyRound, Landmark, Users, Zap, ChevronRight, Hammer, Anchor, Sparkles, BarChart3, Wallet,
  ArrowUpRight, RefreshCw, LogOut, Settings, CheckCircle2, XCircle,
  Timer, Package, Building2, Server, ShieldCheck, ScrollText, Siren,
  Target, CircleDot, Ban,
} from "lucide-react";
import useSWR from "swr";

// ─── Deterministic formatters (no hydration mismatch) ───────────

function formatCompactUSD(n: number | undefined | null): string {
  if (n == null || typeof n !== "number" || isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${n.toLocaleString("en-US")}`;
}

function formatCompact(n: number | undefined | null): string {
  if (n == null || typeof n !== "number" || isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-US");
}

// Deterministic date formatters
function formatTimeUTC(d: Date | null): string {
  if (!d) return "--:--:--";
  return d.toISOString().slice(11, 19);
}

function formatDateShort(d: string | Date | undefined | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  });

export default function ArchitectCommandCenter() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "council" | "meridian" | "pir" | "operations" | "security"
  >("overview");

  const { data: user } = useSWR("/api/user", fetcher);
  const { data: pulse } = useSWR("/api/agora/pulse", fetcher);
  const { data: fortress } = useSWR("/api/auth/founder/status", fetcher);
  const { data: operations } = useSWR("/api/admin/operations", fetcher);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ledgerId = user?.ledgerId || "LED-FOUNDER-001";
  const displayName = user?.displayName || "The Architect";

  const systemPulse = pulse || {
    activePools: 147,
    totalCommitted: 12_400_000,
    hallsLive: 89,
    monthlyRevenue: 890_000,
    pirReserve: 4_200_000,
    totalSubjects: 12_847,
    oracleForecasts: 3,
    status: "BEATING",
  };

  const council = [
    {
      role: "architect" as const,
      name: displayName,
      ledgerId,
      status: "active" as const,
      lastAction: "Approved Meridian Cycle #12",
    },
    {
      role: "warden" as const,
      name: "Warden Protocol",
      ledgerId: "LED-WARDEN-001",
      status: "active" as const,
      lastAction: "Signed PIR release — Hall #2847",
    },
    {
      role: "scribe" as const,
      name: "Scribe System",
      ledgerId: "LED-SCRIBE-001",
      status: "active" as const,
      lastAction: "Infrastructure audit complete",
    },
  ];

  const pirPillars = [
    { pillar: "shield", amount: 1_050_000, spent: 120_000, label: "The Shield", icon: <ShieldCheck className="w-5 h-5" />, color: "text-emerald-400" },
    { pillar: "seal", amount: 840_000, spent: 340_000, label: "The Seal", icon: <ScrollText className="w-5 h-5" />, color: "text-blue-400" },
    { pillar: "forge", amount: 840_000, spent: 560_000, label: "The Forge", icon: <Hammer className="w-5 h-5" />, color: "text-orange-400" },
    { pillar: "spire", amount: 630_000, spent: 210_000, label: "The Spire", icon: <Zap className="w-5 h-5" />, color: "text-cyan-400" },
    { pillar: "vanguard", amount: 504_000, spent: 80_000, label: "The Vanguard", icon: <Target className="w-5 h-5" />, color: "text-purple-400" },
    { pillar: "sanctuary", amount: 336_000, spent: 45_000, label: "The Sanctuary", icon: <Anchor className="w-5 h-5" />, color: "text-rose-400" },
  ];

  const hallAlerts = [
    { hallId: "2847", name: "Nairobi Solar Farm", sri: 87, ahgi: 72, closureStatus: "active", issue: "AHGI declining — review scheduled", severity: "warning" as const },
    { hallId: "2848", name: "Lagos Apartment Block", sri: 34, ahgi: 18, closureStatus: "warning", issue: "Critical AHGI — 2nd month negative", severity: "critical" as const },
    { hallId: "2849", name: "Accra Tech Hub", sri: 92, ahgi: 81, closureStatus: "active", issue: "SRI Platinum — featured in Agora", severity: "info" as const },
  ];

  const forecasts = [
    { id: "1", title: "Africa Cycle #12 — Asset Launch", phase: "reveal", predictions: 1247, lockDate: "2026-06-15T00:00:00Z", status: "active" },
    { id: "2", title: "Asia Cycle #13 — Pre-Hush", phase: "hush", predictions: 0, lockDate: "2026-06-22T00:00:00Z", status: "locked" },
  ];

  const recentOps = operations?.proposals?.slice(0, 5) || [
    { id: "p-001", hallId: "2847", hallName: "Nairobi Solar Farm", title: "Emergency Roof Repair", type: "maintenance", status: "passed", cost: 2400, votesYes: 73, votesNo: 12, passedAt: "2026-06-12T14:30:00Z" },
    { id: "p-002", hallId: "2848", hallName: "Lagos Apartment Block", title: "Hire Farm Manager", type: "hire", status: "executing", cost: 1800, votesYes: 66, votesNo: 8, passedAt: "2026-06-11T09:15:00Z" },
  ];

  const fortressStatus = fortress || {
    totp: true, pin: true, webauthn: true, geo: true, device: true, timeWindow: true,
    lastVerifiedAt: "2026-06-23T10:00:00Z", ip: "192.168.1.100", location: "Cayman Islands",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 selection:bg-cyan-500/20">
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0a0a0f]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">8th Ledger</h1>
              <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase font-medium">The Architect — Primary Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
              <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">
                {formatTimeUTC(currentTime)} UTC
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-slate-300">Fortress Active — 6/6</span>
            </div>
            <button 
  onClick={async () => {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
    window.location.href = "/enter";
  }} 
  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" 
  title="Exit Fortress"
>
  <LogOut className="w-4 h-4" />
</button>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-800/40 bg-[#0a0a0f]/50">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "council", label: "Council", icon: Landmark },
              { id: "meridian", label: "Meridian", icon: Globe },
              { id: "pir", label: "PIR Vault", icon: VaultIcon },
              { id: "operations", label: "Operations", icon: Hammer },
              { id: "security", label: "Fortress", icon: Lock },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedTab === tab.id ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {selectedTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-semibold tracking-widest uppercase text-amber-400">The Architect&apos;s Hand</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {displayName}</h2>
                  <p className="text-slate-400 max-w-2xl">
                    The 8th Ledger commands {systemPulse.hallsLive || 0} live halls, {formatCompactUSD(systemPulse.totalCommitted)} in committed capital, and {formatCompact(systemPulse.totalSubjects)} sovereign subjects. The protocol is <span className={systemPulse.status === "BEATING" ? "text-emerald-400 font-semibold" : systemPulse.status === "RACING" ? "text-amber-400 font-semibold" : "text-rose-400 font-semibold"}>{systemPulse.status || "BEATING"}</span>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { label: "Active Pools", value: String(systemPulse.activePools || 0), icon: Package, color: "text-cyan-400" },
                  { label: "Committed", value: formatCompactUSD(systemPulse.totalCommitted), icon: Wallet, color: "text-emerald-400" },
                  { label: "Live Halls", value: String(systemPulse.hallsLive || 0), icon: Building2, color: "text-blue-400" },
                  { label: "Monthly Revenue", value: formatCompactUSD(systemPulse.monthlyRevenue), icon: TrendingUp, color: "text-amber-400" },
                  { label: "PIR Reserve", value: formatCompactUSD(systemPulse.pirReserve), icon: Shield, color: "text-purple-400" },
                  { label: "Subjects", value: formatCompact(systemPulse.totalSubjects), icon: Users, color: "text-rose-400" },
                  { label: "Oracle Active", value: String(systemPulse.oracleForecasts || 0), icon: Eye, color: "text-indigo-400" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2"><Siren className="w-5 h-5 text-rose-400" /><h3 className="font-semibold text-white">Hall Oversight</h3></div>
                    <button onClick={() => router.push("/admin/halls")} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-3">
                    {hallAlerts.map((alert) => (
                      <div key={alert.hallId} className={`flex items-center justify-between p-4 rounded-xl border ${alert.severity === "critical" ? "border-rose-500/30 bg-rose-500/5" : alert.severity === "warning" ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${alert.severity === "critical" ? "bg-rose-400" : alert.severity === "warning" ? "bg-amber-400" : "bg-emerald-400"}`} />
                          <div>
                            <p className="text-sm font-medium text-white">Hall #{alert.hallId} — {alert.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{alert.issue}</p>
                            <div className="flex gap-3 mt-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">SRI: {alert.sri}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">AHGI: {alert.ahgi}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => router.push(`/admin/halls/${alert.hallId}`)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowUpRight className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <div className="flex items-center gap-2 mb-6"><Zap className="w-5 h-5 text-cyan-400" /><h3 className="font-semibold text-white">Quick Actions</h3></div>
                  <div className="space-y-2">
                    {[
                      { label: "Create Meridian Cycle", desc: "Start new continent rotation", icon: Globe, action: () => router.push("/admin/meridian"), color: "cyan" },
                      { label: "Forge Pool", desc: "Convert winner to live pool", icon: Flame, action: () => router.push("/admin/pool/create"), color: "orange" },
                      { label: "PIR Override", desc: "Emergency asset protection", icon: Shield, action: () => {}, color: "emerald" },
                      { label: "Execute Operations", desc: "Approve passed proposals", icon: Hammer, action: () => setSelectedTab("operations"), color: "blue" },
                      { label: "System Settings", desc: "Protocol configuration", icon: Settings, action: () => router.push("/admin/settings"), color: "slate" },
                    ].map((action) => (
                      <button key={action.label} onClick={action.action} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all text-left group">
                        <div className={`w-9 h-9 rounded-lg bg-${action.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <action.icon className={`w-4 h-4 text-${action.color}-400`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200 group-hover:text-white">{action.label}</p>
                          <p className="text-xs text-slate-500">{action.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2"><Hammer className="w-5 h-5 text-blue-400" /><h3 className="font-semibold text-white">Pending Operations</h3></div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{recentOps.length} Active</span>
                  </div>
                  <div className="space-y-3">
                    {recentOps.map((op) => (
                      <div key={op.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${op.type === "maintenance" ? "bg-orange-500/10" : op.type === "hire" ? "bg-blue-500/10" : "bg-slate-800"}`}>
                            {op.type === "maintenance" ? <Hammer className="w-5 h-5 text-orange-400" /> : <Users className="w-5 h-5 text-blue-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{op.title}</p>
                            <p className="text-xs text-slate-400">Hall #{op.hallId} — {op.hallName}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{(op.votesYes ?? op.voteCountYes ?? 0)}% YES</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">${(op.cost ?? op.amount ?? 0).toLocaleString("en-US")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-3 py-1 rounded-full border ${op.status === "passed" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" : "border-amber-500/20 text-amber-400 bg-amber-500/5"}`}>{op.status}</span>
                          <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-semibold transition-colors">Execute</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-400" /><h3 className="font-semibold text-white">Oracle Forecasts</h3></div>
                    <button onClick={() => router.push("/admin/merit")} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">Manage <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-3">
                    {forecasts.map((fc) => (
                      <div key={fc.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white">{fc.title}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase border ${fc.status === "active" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" : "border-slate-700 text-slate-400 bg-slate-800"}`}>{fc.phase}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{fc.predictions} predictions</span>
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" />Locks {formatDateShort(fc.lockDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === "council" && (
            <motion.div key="council" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
                <h2 className="text-2xl font-bold text-white mb-2">Council of the Eighth Ledger</h2>
                <p className="text-slate-400 text-sm">No single hand holds the scepter. The Council governs the empire. The protocol enforces the law.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {council.map((member) => (
                  <div key={member.role} className={`relative overflow-hidden rounded-2xl border p-6 ${member.role === "architect" ? "border-cyan-500/30 bg-cyan-500/5" : "border-slate-800 bg-slate-900/30"}`}>
                    {member.role === "architect" && <div className="absolute top-4 right-4"><Crown className="w-5 h-5 text-cyan-400" /></div>}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${member.role === "architect" ? "bg-cyan-500/10" : member.role === "warden" ? "bg-emerald-500/10" : "bg-purple-500/10"}`}>
                        {member.role === "architect" ? <Landmark className="w-6 h-6 text-cyan-400" /> : member.role === "warden" ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <ScrollText className="w-6 h-6 text-purple-400" />}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{member.role}</p>
                        <p className="text-lg font-bold text-white">{member.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400"><span>Ledger ID</span><span className="text-slate-300 font-mono">{member.ledgerId}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Status</span><span className="text-emerald-400 capitalize">{member.status}</span></div>
                      <div className="pt-2 border-t border-slate-800"><p className="text-xs text-slate-500">Last action: {member.lastAction}</p></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                <h3 className="font-semibold text-white mb-4">Council Governance Rules</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50"><p className="text-white font-medium mb-1">Architect Override</p><p>Emergency powers logged and visible to Council. Requires 1 Council sign-off for PIR release.</p></div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50"><p className="text-white font-medium mb-1">Replacement Protocol</p><p>Any Council member replaceable by 2-of-3 vote. Architect cannot remove Council members unilaterally.</p></div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50"><p className="text-white font-medium mb-1">PIR Signatory</p><p>The Warden must co-sign all PIR advances over $50,000. Independent audit oversight.</p></div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50"><p className="text-white font-medium mb-1">Infrastructure Control</p><p>The Scribe controls platform security, disaster recovery, and all infrastructure keys.</p></div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === "meridian" && (
            <motion.div key="meridian" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center">
                <Globe className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Meridian Cycle Control</h2>
                <p className="text-slate-400">Pools are not born. They are forged through a cycle of anticipation, revelation, and democratic choice.</p>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { phase: "The Hush", duration: "48h", desc: "Dark screen. Single pulsing dot. Continent name in glitch text.", status: "complete" },
                  { phase: "The Unveil", duration: "24h", desc: "Blurred cards slide in. Oracle forecast opens.", status: "complete" },
                  { phase: "The Reveal", duration: "24h", desc: "Full data revealed. One vote per subject. Live tally.", status: "active" },
                  { phase: "The Forge", duration: "6h", desc: "Winner card expands. Pool opens. Early Ledger status.", status: "pending" },
                ].map((p) => (
                  <div key={p.phase} className={`rounded-xl border p-6 ${p.status === "active" ? "border-cyan-500/30 bg-cyan-500/5" : p.status === "complete" ? "border-emerald-500/20 bg-emerald-500/5" : "border-slate-800 bg-slate-900/30"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{p.duration}</span>
                      {p.status === "active" && <span className="flex items-center gap-1 text-[10px] text-cyan-400"><CircleDot className="w-2 h-2 animate-pulse" />LIVE</span>}
                      {p.status === "complete" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{p.phase}</h4>
                    <p className="text-xs text-slate-400">{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-white">Continent Rotation</h3>
                  <span className="text-xs text-slate-500">Winner continent locked 2 cycles</span>
                </div>
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2" />
                  {[
                    { name: "Africa", cycle: "1-2", active: true },
                    { name: "Asia", cycle: "3-4", active: false },
                    { name: "Europe", cycle: "5-6", active: false },
                    { name: "Americas", cycle: "7-8", active: false },
                    { name: "Middle East", cycle: "9-10", active: false },
                    { name: "Oceania", cycle: "11-12", active: false },
                  ].map((continent) => (
                    <div key={continent.name} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${continent.active ? "border-cyan-400 bg-cyan-400 shadow-lg shadow-cyan-400/30" : "border-slate-700 bg-slate-900"}`} />
                      <span className={`text-xs font-medium ${continent.active ? "text-cyan-400" : "text-slate-500"}`}>{continent.name}</span>
                      <span className="text-[10px] text-slate-600">{continent.cycle}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <button className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition-colors">Trigger Reveal</button>
                <button className="flex-1 py-3 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold transition-colors">Architect&apos;s Hand — Wildcard</button>
                <button className="flex-1 py-3 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold transition-colors">Force Forge Winner</button>
              </div>
            </motion.div>
          )}

          {selectedTab === "pir" && (
            <motion.div key="pir" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
                <div className="flex items-center gap-3 mb-2"><Shield className="w-6 h-6 text-purple-400" /><h2 className="text-2xl font-bold text-white">Protocol Infrastructure Reserve</h2></div>
                <p className="text-slate-400 text-sm">The vault of the 8th Ledger. The public knows it exists and what it protects, but never sees its contents or movements.</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50"><p className="text-xs text-slate-500 mb-1">Total Reserve</p><p className="text-2xl font-bold text-white">{formatCompactUSD(4_200_000)}</p></div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50"><p className="text-xs text-slate-500 mb-1">Deployed</p><p className="text-2xl font-bold text-slate-300">{formatCompactUSD(1_355_000)}</p></div>
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50"><p className="text-xs text-slate-500 mb-1">Available</p><p className="text-2xl font-bold text-emerald-400">{formatCompactUSD(2_845_000)}</p></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pirPillars.map((pillar) => {
                  const pct = Math.round((pillar.spent / pillar.amount) * 100);
                  return (
                    <div key={pillar.pillar} className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
                      <div className="flex items-center gap-3 mb-4"><div className={`${pillar.color}`}>{pillar.icon}</div><div><p className="text-sm font-semibold text-white">{pillar.label}</p><p className="text-xs text-slate-500 capitalize">{pillar.pillar}</p></div></div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs"><span className="text-slate-400">Allocated</span><span className="text-white">{formatCompactUSD(pillar.amount)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-400">Spent</span><span className="text-slate-300">{formatCompactUSD(pillar.spent)}</span></div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-current opacity-60" style={{ width: `${pct}%`, color: pillar.pillar === "shield" ? "#34d399" : pillar.pillar === "seal" ? "#60a5fa" : pillar.pillar === "forge" ? "#fb923c" : pillar.pillar === "spire" ? "#22d3ee" : pillar.pillar === "vanguard" ? "#a78bfa" : "#fb7185" }} /></div>
                        <p className="text-[10px] text-slate-600 text-right">{pct}% utilized</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 mb-1">PIR Override Authority</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">The 8th Ledger can command Sanctuary funds without vote if an asset is endangered. All overrides are logged, visible to the Council, and require Warden co-sign for amounts over $50,000. The Architect cannot spend PIR alone.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === "operations" && (
            <motion.div key="operations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
                <h2 className="text-2xl font-bold text-white mb-2">VIN Operations Command Center</h2>
                <p className="text-slate-400 text-sm">Passed proposals awaiting execution. The 8th Ledger executes all approved hall votes.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center gap-4">
                  {["all", "passed", "executing", "completed"].map((f) => (
                    <button key={f} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white capitalize">{f}</button>
                  ))}
                </div>
                <div className="divide-y divide-slate-800">
                  {recentOps.map((op) => (
                    <div key={op.id} className="p-6 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${op.type === "maintenance" ? "bg-orange-500/10" : op.type === "hire" ? "bg-blue-500/10" : "bg-slate-800"}`}>
                          {op.type === "maintenance" ? <Hammer className="w-5 h-5 text-orange-400" /> : <Users className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{op.title}</p>
                          <p className="text-xs text-slate-400">Hall #{op.hallId} — {op.hallName}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{(op.votesYes ?? op.voteCountYes ?? 0)}% YES</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">${(op.cost ?? op.amount ?? 0).toLocaleString("en-US")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-3 py-1 rounded-full border ${op.status === "passed" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" : "border-amber-500/20 text-amber-400 bg-amber-500/5"}`}>{op.status}</span>
                        <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-sm font-semibold transition-colors">Execute</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === "security" && (
            <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
                <h2 className="text-2xl font-bold text-white mb-2">Fortress Status</h2>
                <p className="text-slate-400 text-sm">6-factor authentication active. All layers verified.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "TOTP", status: fortressStatus.totp, icon: KeyRound, desc: "Time-based one-time password" },
                  { name: "PIN", status: fortressStatus.pin, icon: Lock, desc: "6-digit hardware-locked PIN" },
                  { name: "WebAuthn", status: fortressStatus.webauthn, icon: Fingerprint, desc: "Hardware key verification" },
                  { name: "Geographic", status: fortressStatus.geo, icon: MapPin, desc: "Trusted location radius check" },
                  { name: "Device Fingerprint", status: fortressStatus.device, icon: Server, desc: "Enrolled device signature" },
                  { name: "Time Window", status: fortressStatus.timeWindow, icon: Clock, desc: "UTC access window enforced" },
                ].map((layer) => (
                  <div key={layer.name} className={`rounded-xl border p-5 ${layer.status ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <layer.icon className={`w-5 h-5 ${layer.status ? "text-emerald-400" : "text-rose-400"}`} />
                      {layer.status ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                    <p className="text-sm font-semibold text-white">{layer.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{layer.desc}</p>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <h3 className="font-semibold text-white mb-4">Session Telemetry</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400"><span>IP Address</span><span className="text-slate-200 font-mono">{fortressStatus.ip}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Location</span><span className="text-slate-200">{fortressStatus.location}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Last Verified</span><span className="text-slate-200">{formatDateShort(fortressStatus.lastVerifiedAt)}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Session TTL</span><span className="text-amber-400">14:32 remaining</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                  <h3 className="font-semibold text-white mb-4">Security Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left"><div className="flex items-center gap-3"><RefreshCw className="w-4 h-4 text-amber-400" /><span className="text-sm text-slate-200">Rotate TOTP Secret</span></div><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left"><div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-amber-400" /><span className="text-sm text-slate-200">Update Trusted Location</span></div><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all text-left"><div className="flex items-center gap-3"><Ban className="w-4 h-4 text-rose-400" /><span className="text-sm text-slate-200">Emergency Lock All Sessions</span></div><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function VaultIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}