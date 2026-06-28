"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  AlertTriangle,
  Skull,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Ban,
  UserX,
  Archive,
  Layers,
  Search,
  X,
  CheckCircle2,
  Activity,
} from "lucide-react";

type DormancyStatus = "healthy" | "warning" | "critical" | "forfeited" | "reclaimed";

interface DormancyRecord {
  id: string;
  type: "account" | "asset";
  accountId?: string;
  displayName?: string;
  hallId?: string;
  hallName?: string;
  vertical?: string;
  warningDate?: string;
  criticalDate?: string;
  forfeitureDate?: string;
  status: DormancyStatus;
  daysUntilNextStage: number | null;
  lastActivityAt: string;
  createdAt: string;
  resolvedAt?: string;
  dissolvedCount?: number;
}

const STAGE_CONFIG: Record<DormancyStatus, { label: string; color: string; bg: string; border: string; icon: any; pulse?: boolean }> = {
  healthy: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity },
  warning: { label: "Warning", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle, pulse: true },
  critical: { label: "Critical", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: Zap, pulse: true },
  forfeited: { label: "Forfeited", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: UserX },
  reclaimed: { label: "Reclaimed", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Archive },
};

const THRESHOLDS = {
  account: { warning: 365, critical: 545, forfeiture: 730 },
  asset: { warning: 365, critical: 545, reclamation: 730 },
};

export default function DormancyPage() {
  const [records, setRecords] = useState<DormancyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "account" | "asset">("all");
  const [statusFilter, setStatusFilter] = useState<DormancyStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dormancy/check");
      const data = await res.json();
      if (data.success) {
        // Transform raw data into records
        const transformed: DormancyRecord[] = [];
        // In real implementation, this would come from the API
        // For now, we'll show a placeholder structure
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = useMemo(() => {
    let list = records;
    if (activeFilter !== "all") {
      list = list.filter((r) => r.type === activeFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.displayName?.toLowerCase().includes(q) ||
          r.hallName?.toLowerCase().includes(q) ||
          r.accountId?.toLowerCase().includes(q) ||
          r.hallId?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, warning: 1, forfeited: 2, reclaimed: 3, healthy: 4 };
      return severityOrder[a.status] - severityOrder[b.status];
    });
  }, [records, activeFilter, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      healthy: records.filter((r) => r.status === "healthy").length,
      warning: records.filter((r) => r.status === "warning").length,
      critical: records.filter((r) => r.status === "critical").length,
      forfeited: records.filter((r) => r.status === "forfeited").length,
      reclaimed: records.filter((r) => r.status === "reclaimed").length,
    };
  }, [records]);

  async function handleReclaim(recordId: string, type: "account" | "asset") {
    setActionLoading((prev) => ({ ...prev, [recordId]: true }));
    try {
      const res = await fetch("/api/dormancy/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: type === "account" ? "reactivate_account" : "force_reclamation",
          [type === "account" ? "accountId" : "hallId"]: recordId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`${type === "account" ? "Account" : "Asset"} ${type === "account" ? "reactivated" : "reclaimed"} successfully`);
        fetchRecords();
      } else {
        setMessage(data.error || "Action failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [recordId]: false }));
    }
  }

  const getTimelinePercent = (record: DormancyRecord) => {
    if (record.status === "healthy") return 0;
    if (record.status === "warning") return 33;
    if (record.status === "critical") return 66;
    if (record.status === "forfeited" || record.status === "reclaimed") return 100;
    return 0;
  };

  const getDaysLabel = (days: number | null) => {
    if (days === null) return "—";
    if (days <= 0) return "Overdue";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/[0.08] px-4 py-1.5">
          <Timer className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">Dormancy Watch</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Asset <span className="bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">Lifecycle</span> Monitor
        </h1>
        <p className="mt-1 max-w-lg text-sm text-slate-400">
          Account dormancy: 12mo warning → 18mo critical → 24mo forfeiture. Asset dormancy: 12mo warning → 18mo critical → 24mo reclamation.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          { label: "Active", value: stats.healthy, color: "emerald", icon: Activity },
          { label: "Warning", value: stats.warning, color: "amber", icon: AlertTriangle },
          { label: "Critical", value: stats.critical, color: "rose", icon: Zap },
          { label: "Forfeited", value: stats.forfeited, color: "red", icon: UserX },
          { label: "Reclaimed", value: stats.reclaimed, color: "slate", icon: Archive },
          { label: "Total Tracked", value: stats.total, color: "violet", icon: Layers },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border border-${s.color}-500/10 bg-${s.color}-500/[0.04] p-4 backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <s.icon className={`h-3.5 w-3.5 text-${s.color}-400`} />
              {s.label}
            </div>
            <p className={`mt-1 text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "account", "asset"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                activeFilter === f
                  ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20"
                  : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
              }`}
            >
              {f === "all" ? <Layers className="h-3.5 w-3.5" /> : f === "account" ? <UserX className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              {f === "all" ? "All" : f === "account" ? "Accounts" : "Assets"}
            </button>
          ))}

          {(["all", "warning", "critical", "forfeited", "reclaimed"] as const).map((s) => {
            if (s === "all") return null;
            const cfg = STAGE_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-1 ${cfg.border.replace("border", "ring")}`
                    : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                <cfg.icon className={`h-3.5 w-3.5 ${statusFilter === s ? cfg.color : "text-slate-500"}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] sm:w-56"
            />
          </div>
          <button
            onClick={fetchRecords}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Run Check
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
              message.includes("success") || message.includes("reclaimed") || message.includes("reactivated")
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {message.includes("success") || message.includes("reclaimed") || message.includes("reactivated") ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message}
            <button onClick={() => setMessage("")} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/60 p-12 text-center">
          <Timer className="mx-auto h-12 w-12 text-white/10" />
          <p className="mt-4 text-sm text-slate-500">No dormancy records match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((record, idx) => {
            const cfg = STAGE_CONFIG[record.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === record.id;
            const timelinePct = getTimelinePercent(record);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`rounded-2xl border backdrop-blur-md transition-all ${
                  isExpanded ? "border-rose-500/20 bg-[#0a0a14]/90" : "border-white/5 bg-[#0a0a14]/60 hover:border-white/10"
                }`}
              >
                {/* Header */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-5"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ring-1 ${cfg.border}`}>
                    <StatusIcon className={`h-5 w-5 ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {record.type === "account" ? "Account" : "Asset"} Dormancy
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-white truncate">
                      {record.type === "account" ? record.displayName || record.accountId : record.hallName || record.hallId}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                      {record.type === "asset" && (
                        <>
                          <span className="truncate">{record.vertical}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Last activity {new Date(record.lastActivityAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="hidden shrink-0 flex-col items-end sm:flex">
                    {record.daysUntilNextStage !== null && record.status !== "forfeited" && record.status !== "reclaimed" && (
                      <>
                        <span className={`text-sm font-bold ${record.daysUntilNextStage <= 30 ? "text-rose-400" : record.daysUntilNextStage <= 90 ? "text-amber-400" : "text-slate-400"}`}>
                          {getDaysLabel(record.daysUntilNextStage)}
                        </span>
                        <span className="text-[9px] text-slate-500">until {record.type === "account" ? "forfeiture" : "reclamation"}</span>
                      </>
                    )}
                    {(record.status === "forfeited" || record.status === "reclaimed") && (
                      <span className="text-sm font-bold text-slate-400">
                        {record.dissolvedCount !== undefined ? `${record.dissolvedCount} PACs dissolved` : "Resolved"}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-5 pb-5 pt-4">
                        {/* Timeline Visual */}
                        <div className="mb-6">
                          <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Dormancy Timeline</span>
                            <span>{timelinePct}% elapsed</span>
                          </div>
                          <div className="relative h-3 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                                record.status === "healthy" ? "bg-emerald-500" :
                                record.status === "warning" ? "bg-amber-500" :
                                record.status === "critical" ? "bg-rose-500" :
                                "bg-slate-500"
                              }`}
                              style={{ width: `${timelinePct}%` }}
                            />
                            {/* Stage markers */}
                            <div className="absolute left-[33%] top-0 h-full w-px bg-white/20" />
                            <div className="absolute left-[66%] top-0 h-full w-px bg-white/20" />
                          </div>
                          <div className="mt-2 flex justify-between text-[9px] text-slate-600">
                            <span className={record.status === "healthy" ? "text-emerald-400" : ""}>0mo</span>
                            <span className={record.status === "warning" ? "text-amber-400" : ""}>12mo Warning</span>
                            <span className={record.status === "critical" ? "text-rose-400" : ""}>18mo Critical</span>
                            <span className={record.status === "forfeited" || record.status === "reclaimed" ? "text-slate-400" : ""}>24mo {record.type === "account" ? "Forfeiture" : "Reclamation"}</span>
                          </div>
                        </div>

                        {/* Meta Grid */}
                        <div className="mb-4 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">Type</p>
                            <p className="mt-1 text-xs font-semibold text-white">{record.type === "account" ? "Account" : "Asset"}</p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">Warning Date</p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {record.warningDate ? new Date(record.warningDate).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">Critical Date</p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {record.criticalDate ? new Date(record.criticalDate).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">{record.type === "account" ? "Forfeiture" : "Reclamation"}</p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {record.forfeitureDate ? new Date(record.forfeitureDate).toLocaleDateString() : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {record.status !== "forfeited" && record.status !== "reclaimed" && record.status !== "healthy" && (
                          <div className="flex items-center gap-3">
                            {record.type === "account" ? (
                              <button
                                onClick={() => handleReclaim(record.accountId!, "account")}
                                disabled={actionLoading[record.id]}
                                className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                {actionLoading[record.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                Reactivate Account
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReclaim(record.hallId!, "asset")}
                                disabled={actionLoading[record.id]}
                                className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/20 disabled:opacity-50"
                              >
                                {actionLoading[record.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Skull className="h-3.5 w-3.5" />}
                                Reclaim Asset
                              </button>
                            )}
                          </div>
                        )}

                        {record.status === "forfeited" && (
                          <div className="rounded-lg border border-slate-500/20 bg-slate-500/10 px-4 py-3 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <Ban className="h-4 w-4" />
                              Account forfeited. PACs redistributed to active owners.
                            </div>
                          </div>
                        )}

                        {record.status === "reclaimed" && (
                          <div className="rounded-lg border border-slate-500/20 bg-slate-500/10 px-4 py-3 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <Archive className="h-4 w-4" />
                              Asset reclaimed by VIN. Hall status: dormant.
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
