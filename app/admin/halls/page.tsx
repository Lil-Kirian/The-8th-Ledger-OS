"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Ghost,
  Zap,
  Crown,
  Lock,
  HeartPulse,
  TrendingUp,
  Hexagon,
  Plane,
  Sprout,
  Sun,
  Search,
  Shield,
  Ban,
  Eye,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Users,
  Coins,
  Activity,
  Layers,
  RefreshCw,
  Package,
  Hammer,
  PiggyBank,
  BarChart3,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type HallStatus = "ghost" | "live" | "mature" | "dormant";

interface Hall {
  id: string;
  name: string;
  status: HallStatus;
  vertical: string;
  emojiSet: string[];
  poolId: string;
  listedPrice: number;
  trueCost: number | null;
  pir: number | null;
  ownerCount: number;
  proposalCount: number;
  revenueThisMonth: number;
  createdAt: string;
  lastActivityAt: string | null;
  country: string | null;
  // PHASE 4: Universal flags + metrics
  inventoryEnabled: boolean;
  forgeEnabled: boolean;
  ihcpBalance: number;
  sriScore: number;
  ahgiScore: number;
  hallClass: string | null;
  closureStatus: string;
}

const VERTICAL_ICONS: Record<string, unknown> = {
  ledgerprop: Lock,
  ledgerauto: Zap,
  ledgeredu: Crown,
  ledgeraccess: Shield,
  ledgerhealth: HeartPulse,
  ledgerbiz: TrendingUp,
  ledgertech: Hexagon,
  ledgertravel: Plane,
  ledgeragri: Sprout,
  ledgerenergy: Sun,
};

const VERTICAL_LABELS: Record<string, string> = {
  ledgerprop: "LedgerProp",
  ledgerauto: "LedgerAuto",
  ledgeredu: "LedgerEdu",
  ledgeraccess: "LedgerAccess",
  ledgerhealth: "LedgerHealth",
  ledgerbiz: "LedgerBiz",
  ledgertech: "LedgerTech",
  ledgertravel: "LedgerTravel",
  ledgeragri: "LedgerAgri",
  ledgerenergy: "LedgerEnergy",
};

const STATUS_CONFIG: Record<HallStatus, { label: string; color: string; bg: string; border: string; icon: unknown; desc: string }> = {
  ghost: { label: "Ghost", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: Ghost, desc: "Invisible to public" },
  live: { label: "Live", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity, desc: "Active operations" },
  mature: { label: "Mature", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Crown, desc: "Established revenue" },
  dormant: { label: "Dormant", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle, desc: "Reclamation risk" },
};

export default function AdminHallsPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | HallStatus>("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [featureFilter, setFeatureFilter] = useState<"all" | "inventory" | "forge" | "ihcp">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchHalls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/halls");
      const data = await res.json();
      if (data.success) {
        setHalls(data.halls || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  const filtered = useMemo(() => {
    let list = halls;
    if (statusFilter !== "all") {
      list = list.filter((h) => h.status === statusFilter);
    }
    if (verticalFilter !== "all") {
      list = list.filter((h) => h.vertical === verticalFilter);
    }
    if (featureFilter !== "all") {
      if (featureFilter === "inventory") list = list.filter((h) => h.inventoryEnabled);
      if (featureFilter === "forge") list = list.filter((h) => h.forgeEnabled);
      if (featureFilter === "ihcp") list = list.filter((h) => h.ihcpBalance > 0);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.id.toLowerCase().includes(q) ||
          h.country?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const statusOrder: Record<string, number> = { dormant: 0, ghost: 1, live: 2, mature: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [halls, statusFilter, verticalFilter, featureFilter, search]);

  const stats = useMemo(() => {
    return {
      total: halls.length,
      ghost: halls.filter((h) => h.status === "ghost").length,
      live: halls.filter((h) => h.status === "live").length,
      mature: halls.filter((h) => h.status === "mature").length,
      dormant: halls.filter((h) => h.status === "dormant").length,
      totalOwners: halls.reduce((sum, h) => sum + h.ownerCount, 0),
      totalRevenue: halls.reduce((sum, h) => sum + (h.revenueThisMonth || 0), 0),
      withInventory: halls.filter((h) => h.inventoryEnabled).length,
      withForge: halls.filter((h) => h.forgeEnabled).length,
      totalIhcp: halls.reduce((sum, h) => sum + h.ihcpBalance, 0),
      inWarning: halls.filter((h) => h.closureStatus === "warning").length,
      inLiquidation: halls.filter((h) => h.closureStatus === "liquidation").length,
    };
  }, [halls]);

  async function toggleFeature(hallId: string, feature: "inventory" | "forge") {
    setActionLoading(`${feature}-${hallId}`);
    try {
      const res = await fetch(`/api/halls/${hallId}/${feature}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`${feature === "inventory" ? "Inventory" : "Forge"} ${data.enabled ? "enabled" : "disabled"} for Hall #${hallId.slice(-6)}`);
        setHalls((prev) =>
          prev.map((h) =>
            h.id === hallId
              ? { ...h, [feature === "inventory" ? "inventoryEnabled" : "forgeEnabled"]: data.enabled }
              : h
          )
        );
      } else {
        setMessage(data.error || "Toggle failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const uniqueVerticals = useMemo(() => {
    const set = new Set(halls.map((h) => h.vertical));
    return Array.from(set);
  }, [halls]);

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-4 py-1.5">
          <LayoutGrid className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">Hall Registry</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Sovereign <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Halls</span>
        </h1>
        <p className="mt-1 max-w-lg text-sm text-slate-400">
          Grid view of all Halls. Monitor inventory/forge flags, IHCP balances, SRI/AHGI health, and closure status. Toggle features directly.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
        {[
          { label: "Total", value: stats.total, color: "violet", icon: Layers },
          { label: "Ghost", value: stats.ghost, color: "violet", icon: Ghost },
          { label: "Live", value: stats.live, color: "emerald", icon: Activity },
          { label: "Mature", value: stats.mature, color: "amber", icon: Crown },
          { label: "Dormant", value: stats.dormant, color: "rose", icon: AlertTriangle },
          { label: "Owners", value: stats.totalOwners, color: "cyan", icon: Users },
          { label: "Revenue", value: `$${(stats.totalRevenue / 100).toLocaleString()}`, color: "emerald", icon: Coins },
          { label: "Inventory", value: stats.withInventory, color: "sky", icon: Package },
          { label: "Forge", value: stats.withForge, color: "orange", icon: Hammer },
          { label: "IHCP", value: `$${(stats.totalIhcp / 100).toLocaleString()}`, color: "emerald", icon: PiggyBank },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border border-${s.color}-500/10 bg-${s.color}-500/[0.04] p-3 backdrop-blur-sm`}
          >
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500">
              <s.icon className={`h-3 w-3 text-${s.color}-400`} />
              {s.label}
            </div>
            <p className={`mt-1 text-lg font-bold text-${s.color}-400`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Warning / Liquidation bar */}
      {(stats.inWarning > 0 || stats.inLiquidation > 0) && (
        <div className="mb-4 flex gap-3">
          {stats.inWarning > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {stats.inWarning} hall{stats.inWarning > 1 ? "s" : ""} in closure warning
            </div>
          )}
          {stats.inLiquidation > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-400">
              <Ban className="h-4 w-4" />
              {stats.inLiquidation} hall{stats.inLiquidation > 1 ? "s" : ""} liquidating
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "ghost", "live", "mature", "dormant"] as const).map((f) => {
            const cfg = STATUS_CONFIG[f as HallStatus];
            const active = statusFilter === f;
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(statusFilter === f ? "all" : f)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  active && f !== "all"
                    ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-1 ${cfg.border.replace("border", "ring")}`
                    : active && f === "all"
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20"
                    : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {f !== "all" && <cfg.icon className={`h-3.5 w-3.5 ${active ? cfg.color : "text-slate-500"}`} />}
                {f === "all" ? <Layers className="h-3.5 w-3.5" /> : null}
                {f === "all" ? "All" : cfg.label}
              </button>
            );
          })}

          <select
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500/30"
          >
            <option value="all">All Verticals</option>
            {uniqueVerticals.map((v) => (
              <option key={v} value={v}>{VERTICAL_LABELS[v] || v}</option>
            ))}
          </select>

          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value as unknown)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500/30"
          >
            <option value="all">All Features</option>
            <option value="inventory">Inventory Enabled</option>
            <option value="forge">Forge Enabled</option>
            <option value="ihcp">Has IHCP</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search halls..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] sm:w-56"
            />
          </div>
          <button
            onClick={fetchHalls}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs ${
              message.includes("enabled") || message.includes("disabled")
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {message.includes("enabled") || message.includes("disabled") ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message}
            <button onClick={() => setMessage("")} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/60 p-12 text-center">
          <LayoutGrid className="mx-auto h-12 w-12 text-white/10" />
          <p className="mt-4 text-sm text-slate-500">No halls match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hall, idx) => {
            const statusCfg = STATUS_CONFIG[hall.status];
            const StatusIcon = statusCfg.icon;
            const VIcon = VERTICAL_ICONS[hall.vertical] || Hexagon;
            const isExpanded = expandedId === hall.id;

            return (
              <motion.div
                key={hall.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`group relative rounded-2xl border backdrop-blur-md transition-all ${
                  hall.status === "dormant"
                    ? "border-rose-500/10 bg-[#0a0a14]/60"
                    : "border-white/5 bg-[#0a0a14]/60 hover:border-white/10"
                }`}
              >
                {hall.status === "dormant" && (
                  <div className="absolute -inset-px rounded-2xl bg-rose-500/5" />
                )}

                <div className="relative p-5">
                  {/* Top Row */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusCfg.bg} ring-1 ${statusCfg.border}`}>
                        <VIcon className={`h-5 w-5 ${statusCfg.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white truncate max-w-[140px]">{hall.name}</h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span>{VERTICAL_LABELS[hall.vertical] || hall.vertical}</span>
                          <span>•</span>
                          <span>Class {hall.hallClass || "I"}</span>
                          <span>•</span>
                          <span>#{hall.id.slice(-6)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </div>
                  </div>

                  {/* Feature Badges */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {hall.inventoryEnabled && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[9px] text-sky-400">
                        <Package className="h-3 w-3" /> Inventory
                      </span>
                    )}
                    {hall.forgeEnabled && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[9px] text-orange-400">
                        <Hammer className="h-3 w-3" /> Forge
                      </span>
                    )}
                    {hall.ihcpBalance > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] text-emerald-400">
                        <PiggyBank className="h-3 w-3" /> IHCP
                      </span>
                    )}
                    {hall.closureStatus !== "active" && (
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] ${
                        hall.closureStatus === "warning"
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                      }`}>
                        <AlertTriangle className="h-3 w-3" /> {hall.closureStatus}
                      </span>
                    )}
                  </div>

                  {/* Emoji Set */}
                  <div className="mb-3 flex gap-1">
                    {hall.emojiSet?.map((e, i) => (
                      <span key={i} className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.03] text-sm ring-1 ring-white/5">{e}</span>
                    )) || <span className="text-[10px] text-slate-600 italic">No emojis</span>}
                  </div>

                  {/* Metrics Grid */}
                  <div className="mb-4 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-lg bg-white/[0.02] p-2">
                      <p className="text-slate-500">Owners</p>
                      <p className="mt-0.5 font-semibold text-white">{hall.ownerCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] p-2">
                      <p className="text-slate-500">Proposals</p>
                      <p className="mt-0.5 font-semibold text-white">{hall.proposalCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] p-2">
                      <p className="text-slate-500">Revenue</p>
                      <p className="mt-0.5 font-semibold text-emerald-300">${(hall.revenueThisMonth || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* SRI / AHGI / IHCP Row */}
                  <div className="mb-4 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-lg border border-violet-500/10 bg-violet-500/[0.04] p-2">
                      <p className="text-slate-500 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> SRI</p>
                      <p className={`mt-0.5 font-bold ${
                        hall.sriScore >= 90 ? "text-amber-400" :
                        hall.sriScore >= 75 ? "text-slate-300" :
                        hall.sriScore >= 60 ? "text-slate-400" :
                        "text-rose-400"
                      }`}>{hall.sriScore}</p>
                    </div>
                    <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/[0.04] p-2">
                      <p className="text-slate-500 flex items-center gap-1"><Activity className="h-3 w-3" /> AHGI</p>
                      <p className={`mt-0.5 font-bold ${
                        hall.ahgiScore >= 80 ? "text-emerald-400" :
                        hall.ahgiScore >= 60 ? "text-slate-300" :
                        hall.ahgiScore >= 40 ? "text-amber-400" :
                        "text-rose-400"
                      }`}>{hall.ahgiScore}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-2">
                      <p className="text-slate-500 flex items-center gap-1"><PiggyBank className="h-3 w-3" /> IHCP</p>
                      <p className="mt-0.5 font-bold text-emerald-300">${(hall.ihcpBalance / 100).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Financial Preview */}
                  {hall.listedPrice > 0 && (
                    <div className="mb-3 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Listed</span>
                        <span className="font-semibold text-cyan-300">${hall.listedPrice.toLocaleString()}</span>
                      </div>
                      {hall.pir !== null && (
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">PIR</span>
                          <span className="font-semibold text-amber-300">${hall.pir.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Actions */}
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Package className="h-3.5 w-3.5 text-sky-400" /> Inventory
                      </div>
                      <button
                        onClick={() => toggleFeature(hall.id, "inventory")}
                        disabled={actionLoading === `inventory-${hall.id}`}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
                          hall.inventoryEnabled
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}
                      >
                        {actionLoading === `inventory-${hall.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : hall.inventoryEnabled ? (
                          <><ToggleRight className="h-3.5 w-3.5" /> On</>
                        ) : (
                          <><ToggleLeft className="h-3.5 w-3.5" /> Off</>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Hammer className="h-3.5 w-3.5 text-orange-400" /> Forge
                      </div>
                      <button
                        onClick={() => toggleFeature(hall.id, "forge")}
                        disabled={actionLoading === `forge-${hall.id}`}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
                          hall.forgeEnabled
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}
                      >
                        {actionLoading === `forge-${hall.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : hall.forgeEnabled ? (
                          <><ToggleRight className="h-3.5 w-3.5" /> On</>
                        ) : (
                          <><ToggleLeft className="h-3.5 w-3.5" /> Off</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/halls/${hall.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" /> Oversight
                    </Link>
                    <Link
                      href={`/admin/halls/${hall.id}?tab=operations`}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10 transition-all"
                    >
                      <Activity className="h-3.5 w-3.5" /> Operations
                    </Link>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 border-t border-white/5 pt-4 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="rounded-lg bg-white/[0.02] p-2">
                              <p className="text-slate-500">Created</p>
                              <p className="mt-0.5 text-slate-300">{new Date(hall.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.02] p-2">
                              <p className="text-slate-500">Last Activity</p>
                              <p className="mt-0.5 text-slate-300">{hall.lastActivityAt ? new Date(hall.lastActivityAt).toLocaleDateString() : "—"}</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.02] p-2">
                              <p className="text-slate-500">Country</p>
                              <p className="mt-0.5 text-slate-300">{hall.country || "—"}</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.02] p-2">
                              <p className="text-slate-500">Pool ID</p>
                              <p className="mt-0.5 font-mono text-slate-300">{hall.poolId.slice(-8)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}