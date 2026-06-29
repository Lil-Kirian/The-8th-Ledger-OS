"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Scale,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Clock,
  Ban,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Building2,
  X,
  Gavel,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   TYPES
   ============================================================ */
type Dispute = {
  id: string;
  poolId: string;
  poolName: string;
  ledgerId: string;
  userName: string;
  type: string;
  description: string;
  evidence: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

type ResolutionAction = "resolve" | "slash-pool" | "cancel-pool" | "ban-user" | "dismiss";

/* ============================================================
   TOAST
   ============================================================ */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 20, x: "-50%" }}
      className={`fixed bottom-6 left-1/2 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
        type === "success"
          ? "border-emerald-500/20 bg-emerald-950/80 text-emerald-300"
          : "border-rose-500/20 bg-rose-950/80 text-rose-300"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {message}
    </motion.div>
  );
}

/* ============================================================
   DISPUTE DETAIL MODAL
   ============================================================ */
function DisputeDetailModal({
  dispute,
  onClose,
  onAction,
  loading,
}: {
  dispute: Dispute;
  onClose: () => void;
  onAction: (action: ResolutionAction, resolution?: string) => void;
  loading: boolean;
}) {
  const [resolutionText, setResolutionText] = useState(dispute.resolution || "");
  const [confirmAction, setConfirmAction] = useState<ResolutionAction | null>(null);

  const actions: { key: ResolutionAction; label: string; icon: React.ElementType; color: string; desc: string }[] = [
    {
      key: "resolve",
      label: "Resolve Dispute",
      icon: CheckCircle2,
      color: "emerald",
      desc: "Mark as resolved with explanation",
    },
    {
      key: "slash-pool",
      label: "Slash Pool",
      icon: Gavel,
      color: "amber",
      desc: "Penalize pool and redistribute ownerships",
    },
    {
      key: "cancel-pool",
      label: "Cancel Pool",
      icon: Ban,
      color: "rose",
      desc: "Cancel pool and refund all participants",
    },
    {
      key: "ban-user",
      label: "Ban Sovereign",
      icon: Shield,
      color: "rose",
      desc: "Ban the reporting sovereign",
    },
    {
      key: "dismiss",
      label: "Dismiss",
      icon: XCircle,
      color: "slate",
      desc: "Dismiss as invalid or spam",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0a14] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
              <Scale className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Dispute #{dispute.id.slice(-6).toUpperCase()}</h3>
              <p className="text-[10px] text-white/30">{dispute.poolId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-white/30">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Status badge */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold border ${
                dispute.status === "open"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : dispute.status === "resolved"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {dispute.status === "open" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {dispute.status.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-[10px] text-white/30 border border-white/5">
              <Building2 className="h-3 w-3" />
              {dispute.poolName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-[10px] text-white/30 border border-white/5">
              <User className="h-3 w-3" />
              {dispute.userName}
            </span>
          </div>

          {/* Type */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <span className="text-[9px] uppercase tracking-wider text-white/20">Dispute Type</span>
            <p className="mt-1 text-sm font-semibold text-white">{dispute.type}</p>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <span className="text-[9px] uppercase tracking-wider text-white/20">Description</span>
            <p className="mt-1 text-sm text-white/60 leading-relaxed">{dispute.description}</p>
          </div>

          {/* Evidence */}
          {dispute.evidence && (
            <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[9px] uppercase tracking-wider text-amber-400/60">Evidence</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{dispute.evidence}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="flex items-center gap-4 text-[10px] text-white/20">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Opened {new Date(dispute.createdAt).toLocaleString()}
            </span>
            {dispute.resolvedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Resolved {new Date(dispute.resolvedAt).toLocaleString()}
              </span>
            )}
            {dispute.resolvedBy && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                By {dispute.resolvedBy}
              </span>
            )}
          </div>
        </div>

        {/* Resolution input */}
        {dispute.status === "open" && (
          <div className="mb-6">
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/30">
              Resolution Notes
            </label>
            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/30 placeholder:text-white/20"
              placeholder="Explain your ruling..."
            />
          </div>
        )}

        {/* Actions */}
        {dispute.status === "open" && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/20">Arbitration Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {actions.map((a) => {
                const Icon = a.icon;
                const isConfirming = confirmAction === a.key;
                return (
                  <div key={a.key} className="space-y-2">
                    <button
                      onClick={() => setConfirmAction(isConfirming ? null : a.key)}
                      disabled={loading}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        isConfirming
                          ? `border-${a.color}-500/30 bg-${a.color}-500/10`
                          : "border-white/5 bg-white/[0.02] hover:border-white/10"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${a.color}-500/10`}>
                        <Icon className={`h-4 w-4 text-${a.color}-400`} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isConfirming ? `text-${a.color}-400` : "text-white"}`}>
                          {a.label}
                        </p>
                        <p className="text-[9px] text-white/20">{a.desc}</p>
                      </div>
                    </button>

                    {isConfirming && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex gap-2 px-1"
                      >
                        <button
                          onClick={() => setConfirmAction(null)}
                          className="flex-1 rounded-lg border border-white/10 py-2 text-[10px] text-white/40 hover:text-white/60"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => onAction(a.key, resolutionText)}
                          disabled={loading || (a.key === "resolve" && !resolutionText.trim())}
                          className={`flex-1 rounded-lg bg-${a.color}-500/10 border border-${a.color}-500/20 py-2 text-[10px] font-bold text-${a.color}-400 hover:bg-${a.color}-500/20 disabled:opacity-30`}
                        >
                          {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : `Confirm ${a.label}`}
                        </button>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dispute.status !== "open" && (
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">Resolution Record</span>
            </div>
            <p className="text-xs text-white/50">{dispute.resolution || "No resolution notes provided."}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [detailDispute, setDetailDispute] = useState<Dispute | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: search,
      status: filterStatus,
      type: filterType,
      sort: sortBy,
      dir: sortDir,
    });
    try {
      const res = await fetch(`/api/admin/disputes?${params}`);
      const data = await res.json();
      if (data.success) {
        setDisputes(data.disputes);
      } else {
        setToast({ message: data.error || "Failed to load disputes", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterType, sortBy, sortDir]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  async function handleAction(action: ResolutionAction, resolution?: string) {
    if (!detailDispute) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          disputeId: detailDispute.id,
          resolution: resolution || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message, type: "success" });
        setDetailDispute(null);
        fetchDisputes();
      } else {
        setToast({ message: data.error || "Action failed", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  const openCount = disputes.filter((d) => d.status === "open").length;
  const resolvedCount = disputes.filter((d) => d.status === "resolved").length;
  const dismissedCount = disputes.filter((d) => d.status === "dismissed").length;

  const disputeTypes = [...new Set(disputes.map((d) => d.type))];

  return (
    <div className="space-y-6 max-w-7xl">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1">
          <Scale className="h-3 w-3 text-rose-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-300">Dispute Chamber</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Mediate Disputes</h1>
        <p className="mt-1 text-sm text-white/40">
          Arbitrate ownership and asset disputes. Slash pools, cancel rounds, or ban bad actors.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", value: openCount, color: "amber", icon: Clock },
          { label: "Resolved", value: resolvedCount, color: "emerald", icon: CheckCircle2 },
          { label: "Dismissed", value: dismissedCount, color: "slate", icon: XCircle },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-${s.color}-500/10 bg-${s.color}-500/5 p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 text-${s.color}-400`} />
              <span className="text-[10px] uppercase tracking-wider text-white/30">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
          <input
            type="text"
            placeholder="Search by ID, pool, sovereign, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-rose-500/30 placeholder:text-white/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {["all", "open", "resolved", "dismissed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition-all ${
                  filterStatus === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {disputeTypes.length > 0 && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white outline-none focus:border-rose-500/30"
            >
              <option value="all" className="bg-[#0a0a14]">All Types</option>
              {disputeTypes.map((t) => (
                <option key={t} value={t} className="bg-[#0a0a14]">
                  {t}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/40 hover:text-white/70"
          >
            {sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            {sortBy}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30 border-b border-white/5 bg-white/[0.02]">
          <div className="col-span-3 cursor-pointer hover:text-white/50" onClick={() => setSortBy("poolId")}>Pool / Sovereign</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Opened</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {loading && disputes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/20">No disputes found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 text-xs items-center hover:bg-white/[0.02] cursor-pointer"
                onClick={() => setDetailDispute(d)}
              >
                <div className="col-span-3">
                  <p className="font-semibold text-white truncate">{d.poolName}</p>
                  <p className="text-[10px] text-white/20">{d.userName} • {d.ledgerId.slice(-8)}</p>
                </div>
                <div className="col-span-2">
                  <span className="inline-flex rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-white/40 border border-white/5">
                    {d.type}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="text-white/40 truncate">{d.description}</p>
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                      d.status === "open"
                        ? "bg-amber-500/10 text-amber-400"
                        : d.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {d.status === "open" ? <Clock className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                    {d.status}
                  </span>
                </div>
                <div className="col-span-2 text-white/20">
                  {new Date(d.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setDetailDispute(d)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Eye className="h-3 w-3" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailDispute && (
          <DisputeDetailModal
            dispute={detailDispute}
            onClose={() => setDetailDispute(null)}
            onAction={handleAction}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}