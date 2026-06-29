// app/admin/pools/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Landmark,
  Zap,
  Crown,
  Lock,
  HeartPulse,
  TrendingUp,
  Hexagon,
  Plane,
  Sprout,
  Sun,
  Swords,
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Ghost,
  Globe,
  Users,
  X,
  ChevronDown,
  AlertTriangle,
  Loader2,
  BarChart3,
} from "lucide-react";

/* ============================================================
   VERTICAL META
   ============================================================ */
const VERTICAL_META: Record<string, { name: string; icon: React.ElementType; color: string; label: string }> = {
  ledgerprop: { name: "LedgerProp", icon: Landmark, color: "emerald", label: "Real Estate" },
  ledgerauto: { name: "LedgerAuto", icon: Zap, color: "cyan", label: "Automotive" },
  ledgeredu: { name: "LedgerEdu", icon: Crown, color: "violet", label: "Education" },
  ledgeraccess: { name: "LedgerAccess", icon: Lock, color: "amber", label: "Access" },
  ledgerhealth: { name: "LedgerHealth", icon: HeartPulse, color: "rose", label: "Health" },
  ledgerbiz: { name: "LedgerBiz", icon: TrendingUp, color: "orange", label: "Business" },
  ledgertech: { name: "LedgerTech", icon: Hexagon, color: "indigo", label: "Technology" },
  ledgertravel: { name: "LedgerTravel", icon: Plane, color: "sky", label: "Travel" },
  ledgeragri: { name: "LedgerAgri", icon: Sprout, color: "green", label: "Agriculture" },
  ledgerenergy: { name: "LedgerEnergy", icon: Sun, color: "yellow", label: "Energy" },
  ledgersport: { name: "LedgerSport", icon: Swords, color: "rose", label: "Sport" },
};

const CMAP: Record<string, { text: string; bg: string; border: string; ring: string; gradient: string }> = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", ring: "ring-emerald-500/20", gradient: "from-emerald-500/20 to-emerald-900/5" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", ring: "ring-cyan-500/20", gradient: "from-cyan-500/20 to-cyan-900/5" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", ring: "ring-violet-500/20", gradient: "from-violet-500/20 to-violet-900/5" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", ring: "ring-amber-500/20", gradient: "from-amber-500/20 to-amber-900/5" },
  rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", ring: "ring-rose-500/20", gradient: "from-rose-500/20 to-rose-900/5" },
  orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", ring: "ring-orange-500/20", gradient: "from-orange-500/20 to-orange-900/5" },
  indigo: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", ring: "ring-indigo-500/20", gradient: "from-indigo-500/20 to-indigo-900/5" },
  sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", ring: "ring-sky-500/20", gradient: "from-sky-500/20 to-sky-900/5" },
  green: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", ring: "ring-green-500/20", gradient: "from-green-500/20 to-green-900/5" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", ring: "ring-yellow-500/20", gradient: "from-yellow-500/20 to-yellow-900/5" },
};

type Pool = {
  id: string;
  name: string;
  verticalId: string;
  listedPrice: number;
  trueCost: number;
  status: "ghost" | "live" | "closed" | "suspended";
  fillPercentage: number;
  committerCount: number;
  maxParticipants: number;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  hallClass?: string;
  ghostHallName?: string;
};

export default function AdminPoolsPage() {
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [showTrueCost, setShowTrueCost] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Fetch pools */
  useEffect(() => {
    async function fetchPools() {
      try {
        const res = await fetch("/api/pools?limit=100&sort=createdAt&order=desc");
        const data = await res.json();
        if (data.success || Array.isArray(data.pools)) {
          setPools(data.pools || []);
        } else {
          setError(data.error || "Failed to load pools");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchPools();
  }, []);

  /* Delete pool */
  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pools/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPools((prev) => prev.filter((p) => p.id !== id));
      } else {
        setError(data.error || "Delete failed");
      }
    } catch {
      setError("Delete network error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, []);

  /* Filtered pools */
  const filtered = useMemo(() => {
    return pools.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.country || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesVertical = verticalFilter === "all" || p.verticalId === verticalFilter;
      return matchesSearch && matchesStatus && matchesVertical;
    });
  }, [pools, search, statusFilter, verticalFilter]);

  const stats = useMemo(() => {
    const total = pools.length;
    const ghost = pools.filter((p) => p.status === "ghost").length;
    const live = pools.filter((p) => p.status === "live").length;
    const closed = pools.filter((p) => p.status === "closed").length;
    const totalValue = pools.reduce((sum, p) => sum + (p.listedPrice || 0), 0);
    return { total, ghost, live, closed, totalValue };
  }, [pools]);

  const toggleTrueCost = (id: string) => {
    setShowTrueCost((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE</span>;
      case "ghost":
        return <span className="inline-flex items-center gap-1 rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-400"><Ghost className="h-3 w-3" /> GHOST</span>;
      case "closed":
        return <span className="inline-flex items-center gap-1 rounded-md border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-400"><X className="h-3 w-3" /> CLOSED</span>;
      case "suspended":
        return <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400"><AlertTriangle className="h-3 w-3" /> SUSPENDED</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-100">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">Pool Registry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Sovereign <span className="bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">Asset Pools</span>
          </h1>
          <p className="mt-1 max-w-lg text-sm text-slate-400">
            All forged pools across the 10 verticals. Ghost halls are invisible to the public until they fill.
          </p>
        </div>
        <Link href="/admin/pools/create" className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)] hover:border-cyan-500/30">
          <Plus className="h-4 w-4" /> Forge New Pool
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-[#0a0a14]/60 p-4 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Total Pools</p>
          <p className="mt-1 text-xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400/60">Live</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">{stats.live}</p>
        </div>
        <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.04] p-4 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-wider text-violet-400/60">Ghost</p>
          <p className="mt-1 text-xl font-bold text-violet-300">{stats.ghost}</p>
        </div>
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-4 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-wider text-amber-400/60">Total Listed Value</p>
          <p className="mt-1 text-xl font-bold text-amber-300">${stats.totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pools by name or country..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-cyan-500/30 focus:bg-white/[0.05]"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/10 bg-white/[0.03] pl-3 pr-8 py-2.5 text-sm text-white outline-none focus:border-cyan-500/30"
            >
              <option value="all">All Status</option>
              <option value="ghost">Ghost</option>
              <option value="live">Live</option>
              <option value="closed">Closed</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={verticalFilter}
              onChange={(e) => setVerticalFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/10 bg-white/[0.03] pl-3 pr-8 py-2.5 text-sm text-white outline-none focus:border-cyan-500/30"
            >
              <option value="all">All Verticals</option>
              {Object.entries(VERTICAL_META).map(([id, v]) => (
                <option key={id} value={id}>{v.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-3 text-sm text-slate-500">Loading pool registry...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/5 bg-[#0a0a14]/40">
          <Layers className="h-10 w-10 text-white/10" />
          <p className="mt-3 text-sm text-slate-500">No pools found.</p>
          <p className="text-xs text-slate-600">Try adjusting filters or forge a new pool.</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0a0a14]/60 backdrop-blur-md">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Pool</th>
                <th className="px-4 py-3 font-medium">Vertical</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Listed Price</th>
                <th className="px-4 py-3 font-medium">True Cost</th>
                <th className="px-4 py-3 font-medium">Fill</th>
                <th className="px-4 py-3 font-medium">Committers</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filtered.map((pool) => {
                  const meta = VERTICAL_META[pool.verticalId] || VERTICAL_META.ledgerprop;
                  const VIcon = meta.icon;
                  const vc = CMAP[meta.color];
                  const fillPct = Math.min(100, pool.fillPercentage || 0);
                  const trueCostVisible = showTrueCost[pool.id];

                  return (
                    <motion.tr
                      key={pool.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${vc.gradient} ring-1 ring-white/5`}>
                            <VIcon className={`h-4 w-4 ${vc.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{pool.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Globe className="h-3 w-3" /> {pool.country || "—"} • {pool.hallClass || "I"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md ${vc.bg} ${vc.border} border px-2 py-0.5 text-[10px] font-bold ${vc.text}`}>
                          <VIcon className="h-3 w-3" /> {meta.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(pool.status)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-cyan-300">${pool.listedPrice.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleTrueCost(pool.id)}
                          className="flex items-center gap-1.5 text-sm font-mono text-rose-300/80 transition-colors hover:text-rose-300"
                        >
                          {trueCostVisible ? (
                            <><Eye className="h-3 w-3" /> ${pool.trueCost.toLocaleString()}</>
                          ) : (
                            <><EyeOff className="h-3 w-3" /> ••••••</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400">{fillPct}%</span>
                            <span className="text-[9px] text-slate-600">{pool.committerCount}/{pool.maxParticipants}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${fillPct >= 100 ? "bg-emerald-500" : fillPct >= 50 ? "bg-amber-500" : "bg-cyan-500"}`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Users className="h-3 w-3" /> {pool.committerCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-slate-500">
                          {new Date(pool.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/pools/${pool.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70"
                            title="View"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/admin/pools/${pool.id}/edit`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-white/40 transition-all hover:bg-white/[0.06] hover:text-cyan-400"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeleteId(pool.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-white/40 transition-all hover:bg-rose-500/10 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a14] p-6 shadow-2xl"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-500/20">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Suspend Pool?</h3>
              <p className="mt-1 text-xs text-slate-400">
                This will suspend the pool and its associated hall. Committers will be notified. This action can be reversed.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Suspend"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}