"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Settings,
  Zap,
  Coins,
  Users,
  Shield,
  Eye,
  Activity,
  Flame,
  TrendingUp,
  ArrowRight,
  Server,
  Database,
  Globe,
  Terminal,
  Crown,
  Target,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Scale,
  PieChart,
  Landmark,
  ScanEye,
  Sparkles,
} from "lucide-react";

/* ============================================================
   COLOR MAP — Tailwind needs static classes
   ============================================================ */
const STAT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  fuchsia: { text: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  indigo: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  teal: { text: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  lime: { text: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20" },
};

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */
function AnimatedValue({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * end);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return (
    <span className="tabular-nums">
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

/* ============================================================
   COMMAND MODULE
   ============================================================ */
function CommandModule({
  href,
  icon: Icon,
  title,
  desc,
  color,
  delay,
  onClick,
}: {
  href?: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  delay: number;
  onClick?: () => void;
}) {
  const c = STAT_COLORS[color] || STAT_COLORS.cyan;

  const content = (
    <>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ring-1 ring-white/5 transition-transform duration-500 group-hover:scale-110`}>
        <Icon className={`h-6 w-6 ${c.text}`} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-white/40">{desc}</p>
      <div className={`mt-4 flex items-center gap-1 text-xs ${c.text} opacity-0 transition-all duration-300 group-hover:opacity-100`}>
        <span>{href ? "Execute" : "Open"}</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
      <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full ${c.bg} blur-[50px] opacity-0 transition-opacity duration-500 group-hover:opacity-50`} />
    </>
  );

  if (onClick) {
    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>
        <button
          onClick={onClick}
          className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border ${c.border} bg-[#0a0a14]/80 p-6 text-left backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(192,38,211,0.3)]`}
        >
          {content}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>
      <Link
        href={href!}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border ${c.border} bg-[#0a0a14]/80 p-6 backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)]`}
      >
        {content}
      </Link>
    </motion.div>
  );
}

/* ============================================================
   ORACLE FORECAST CREATION MODAL — 8th Ledger Standing System
   No money. No betting. Just foresight for standing.
   ============================================================ */
const VERTICAL_OPTIONS = [
  "ledgerprop", "ledgerauto", "ledgeredu", "ledgeraccess", "ledgerhealth",
  "ledgerbiz", "ledgertech", "ledgertravel", "ledgeragri", "ledgerenergy",
  "ledgersport",
];

const COUNTRY_OPTIONS = [
  "nigeria", "ghana", "kenya", "south africa", "egypt", "morocco",
  "uae", "saudi arabia", "qatar", "uk", "usa", "canada",
  "germany", "france", "india", "singapore", "brazil", "mexico",
  "australia", "china", "japan",
];

function OracleForecastModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("Next Asset Launch — Oracle Forecast");
  const [description, setDescription] = useState("Predict which vertical and country combination will win the next Meridian Cycle vote.");
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>(["ledgerprop"]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["nigeria", "uae", "usa"]);
  const [lockDate, setLockDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setLockDate(d.toISOString().slice(0, 16));
  }, []);

  function toggleVertical(v: string) {
    setSelectedVerticals((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function toggleCountry(c: string) {
    setSelectedCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedVerticals.length === 0 || selectedCountries.length === 0) {
      setMessage({ text: "Select at least 1 vertical and 1 country", type: "error" });
      return;
    }
    if (!lockDate) {
      setMessage({ text: "Set a lock date", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/oracle/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "asset_launch",
          title: title.trim(),
          description: description.trim(),
          lockDate: new Date(lockDate).toISOString(),
          verticalOptions: selectedVerticals,
          countryOptions: selectedCountries,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Oracle forecast created: ${data.forecast?.title || title}`, type: "success" });
        setTimeout(onClose, 1500);
      } else {
        setMessage({ text: data.error || "Failed to create forecast", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl border border-violet-500/20 bg-[#0a0a14] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ScanEye className="h-5 w-5 text-violet-400" />
            <h3 className="text-lg font-bold text-white">Create Oracle Forecast</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-white/30">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/40">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/40">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/40">
              Lock Date
            </label>
            <input
              type="datetime-local"
              value={lockDate}
              onChange={(e) => setLockDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/40">
              Verticals ({selectedVerticals.length} selected)
            </label>
            <div className="flex flex-wrap gap-2">
              {VERTICAL_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVertical(v)}
                  className={`rounded-md border px-2.5 py-1 text-[10px] font-medium uppercase transition-all ${
                    selectedVerticals.includes(v)
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      : "border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10"
                  }`}
                >
                  {v.replace("ledger", "").toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/40">
              Countries ({selectedCountries.length} selected)
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
              {COUNTRY_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCountry(c)}
                  className={`rounded-md border px-2.5 py-1 text-[10px] font-medium capitalize transition-all ${
                    selectedCountries.includes(c)
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      : "border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div
              className={`rounded-lg p-2.5 text-xs flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/50 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedVerticals.length === 0 || selectedCountries.length === 0}
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white hover:from-violet-400 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Create Forecast
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function AdminPage() {
  const [showOracleModal, setShowOracleModal] = useState(false);

  const stats = [
    { label: "Sovereigns", value: 1420, prefix: "", suffix: "", icon: Users, color: "cyan" },
    { label: "Active Pools", value: 847, prefix: "", suffix: "", icon: Activity, color: "emerald" },
    { label: "Treasury", value: 24800000, prefix: "$", suffix: "", icon: Coins, color: "amber" },
    { label: "LED Circulating", value: 89340, prefix: "", suffix: "", icon: Flame, color: "rose" },
    { label: "Consensus Runs", value: 312, prefix: "", suffix: "", icon: Zap, color: "violet" },
    { label: "Uptime", value: 99, prefix: "", suffix: "%", icon: Server, color: "sky" },
  ];

  const commands = [
    { href: "/admin/pool/create", icon: PlusCircle, title: "Forge Pool", desc: "Launch a new asset pool across any of the 11 sovereign verticals.", color: "emerald", delay: 0 },
    { href: "/admin/settings", icon: Settings, title: "Protocol Settings", desc: "Adjust PIR rates, consensus thresholds, and ledger mechanics.", color: "cyan", delay: 0.05 },
    { href: "/admin/consensus", icon: Zap, title: "Trigger Consensus", desc: "Manually execute Quantum Merit winner selection on a filled pool.", color: "violet", delay: 0.1 },
    { href: "/admin/withdrawals", icon: Coins, title: "Treasury Gate", desc: "Approve or reject sovereign withdrawal requests.", color: "amber", delay: 0.15 },
    { href: "/admin", icon: Activity, title: "Analytics Core", desc: "Real-time protocol metrics, PIR allocations, and forecasts.", color: "sky", delay: 0.2 },
    { href: "/audit", icon: Eye, title: "Public Ledger", desc: "Immutable audit trail of every transaction and consensus result.", color: "rose", delay: 0.25 },
    { onClick: () => setShowOracleModal(true), icon: ScanEye, title: "Oracle Forecast", desc: "Create a standing-based forecast. Subjects predict vertical+country for rank.", color: "violet", delay: 0.3 },
    { href: "/admin/merit", icon: Crown, title: "Merit Selection", desc: "Review Quantum Merit scores and manually trigger winner selection.", color: "orange", delay: 0.35 },
    { href: "/admin/users", icon: Users, title: "Sovereign Registry", desc: "Ban, verify, promote, and view identity scores of all users.", color: "indigo", delay: 0.4 },
    { href: "/admin/assets", icon: Building2, title: "Asset Moderation", desc: "Approve or reject property listings before they go live to the public.", color: "teal", delay: 0.45 },
    { href: "/admin/economy", icon: TrendingUp, title: "Economy Dial", desc: "Control LED supply, PIR allocation, SRI weights, and forge flow.", color: "lime", delay: 0.5 },
    { href: "/admin/disputes", icon: Scale, title: "Dispute Chamber", desc: "Mediate winner and asset disputes. Slash pools or cancel rounds.", color: "rose", delay: 0.55 },
    { href: "/admin/economy?tab=pir", icon: PieChart, title: "PIR Overview", desc: "Real-time tracking of Protocol Infrastructure Reserve across all pools.", color: "amber", delay: 0.6 },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center pt-4 pb-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-5 py-2 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">Primary Admin — 6-Factor Fortress</span>
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Command the
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">
              8th Ledger.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/40 sm:text-lg">
            The ownership engine is under your control. Create pools, trigger consensus, manage treasury, and oversee every sovereign identity.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const colors = STAT_COLORS[stat.color] || STAT_COLORS.cyan;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-5 backdrop-blur-sm transition-all hover:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">{stat.label}</p>
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <p className={`mt-3 text-2xl font-bold ${colors.text}`}>
                  <AnimatedValue value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Command Modules */}
      <section className="py-4">
        <div className="mb-8 flex items-center gap-3">
          <Terminal className="h-5 w-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Command Modules</h2>
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {commands.map((cmd) => (
            <CommandModule key={cmd.title} {...cmd} />
          ))}
        </div>
      </section>

      {/* Bottom Bar */}
      <section className="pb-4">
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950/20 via-[#0a0a14] to-violet-950/20 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-white">System Integrity</h3>
              <p className="mt-1 text-xs text-white/30">
                All administrative actions are permanently logged to the public ledger. Every change is auditable by any sovereign identity.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-white/20">
              <span className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-emerald-400" />
                DB: Online
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-emerald-400" />
                CDN: Active
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-emerald-400" />
                Firewall: Hardened
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Oracle Forecast Modal */}
      <AnimatePresence>
        {showOracleModal && (
          <OracleForecastModal onClose={() => setShowOracleModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}