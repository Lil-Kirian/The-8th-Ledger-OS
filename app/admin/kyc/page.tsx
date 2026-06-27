// app/admin/kyc/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Fingerprint,
  FileText,
  Camera,
  Video,
  MapPin,
  Clock,
  Layers,
  RefreshCw,
  CheckSquare,
  Square,
  Ban,
} from "lucide-react";

type KycTier = "visitor" | "sovereign" | "verified" | "whale";
type KycStatus = "pending" | "approved" | "rejected" | "all";

interface KycRecord {
  id: string;
  ledgerId: string;
  displayName: string;
  email: string;
  tier: KycTier;
  status: KycStatus;
  idDocUrl: string | null;
  selfieUrl: string | null;
  livenessVideoUrl: string | null;
  addressProofUrl: string | null;
  legalName: string | null;
  riskScore: number;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  notes: string | null;
  deviceFingerprint: string | null;
}

const TIER_CONFIG: Record<KycTier, { label: string; color: string; bg: string; border: string; icon: unknown }> = {
  visitor: { label: "Visitor", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Shield },
  sovereign: { label: "Sovereign", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: Shield },
  verified: { label: "Verified", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: CheckCircle2 },
  whale: { label: "Whale", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: Layers },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: unknown }> = {
  pending: { label: "Pending Review", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: XCircle },
};

export default function KycReviewPage() {
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<KycStatus>("pending");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/kyc?status=${activeFilter}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = useMemo(() => {
    let list = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.displayName.toLowerCase().includes(q) ||
          r.ledgerId.toLowerCase().includes(q) ||
          r.legalName?.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [records, search]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      pending: records.filter((r) => r.status === "pending").length,
      approved: records.filter((r) => r.status === "approved").length,
      rejected: records.filter((r) => r.status === "rejected").length,
      avgRisk: records.length > 0 ? records.reduce((sum, r) => sum + (r.riskScore || 0), 0) / records.length : 0,
    };
  }, [records]);

  async function handleReview(recordId: string, action: "approve" | "reject", reason?: string) {
    setActionLoading((prev) => ({ ...prev, [recordId]: true }));
    try {
      const res = await fetch(`/api/admin/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`KYC ${action}d successfully`);
        fetchRecords();
      } else {
        setMessage(data.error || `Failed to ${action}`);
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [recordId]: false }));
    }
  }

  async function handleBulk(action: "approve" | "reject") {
    if (selectedIds.size === 0) {
      setMessage("No records selected");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, recordIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`${selectedIds.size} records ${action}d`);
        setSelectedIds(new Set());
        fetchRecords();
      } else {
        setMessage(data.error || "Bulk action failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setBulkLoading(false);
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (score >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (score >= 20) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return "Critical";
    if (score >= 50) return "Elevated";
    if (score >= 20) return "Moderate";
    return "Low";
  };

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-4 py-1.5">
          <Shield className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">SIV Review</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Identity <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Verification</span>
        </h1>
        <p className="mt-1 max-w-lg text-sm text-slate-400">
          Side-by-side document review. Risk-scored. Immutable audit trail. Sovereign access begins here.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Pending", value: stats.pending, color: "amber", icon: Clock },
          { label: "Approved", value: stats.approved, color: "emerald", icon: CheckCircle2 },
          { label: "Rejected", value: stats.rejected, color: "rose", icon: XCircle },
          { label: "Total Queue", value: stats.total, color: "violet", icon: Layers },
          { label: "Avg Risk", value: stats.avgRisk.toFixed(1), color: "cyan", icon: AlertTriangle },
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

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as KycStatus[]).map((f) => {
            const active = activeFilter === f;
            const config = STATUS_CONFIG[f] || STATUS_CONFIG.pending;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  active
                    ? `${config.bg} ${config.border} ${config.color} ring-1 ${config.border.replace("border", "ring")}`
                    : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                <config.icon className={`h-3.5 w-3.5 ${active ? config.color : "text-slate-500"}`} />
                {f === "all" ? "All" : config.label}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-white/10" : "bg-white/5"} text-white/60`}>
                  {f === "all" ? stats.total : records.filter((r) => r.status === f).length}
                </span>
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
              placeholder="Search Ledger ID, name, email..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-cyan-500/30 focus:bg-white/[0.05] sm:w-64"
            />
          </div>
          <button
            onClick={fetchRecords}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3"
        >
          <span className="text-xs font-semibold text-cyan-300">{selectedIds.size} selected</span>
          <button
            onClick={() => handleBulk("approve")}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Approve All
          </button>
          <button
            onClick={() => handleBulk("reject")}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Reject All
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-[10px] text-slate-500 hover:text-white">
            Clear
          </button>
        </motion.div>
      )}

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs ${
              message.includes("success") || message.includes("approved")
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {message.includes("success") || message.includes("approved") ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message}
            <button onClick={() => setMessage("")} className="ml-auto"><XCircle className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/60 p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-white/10" />
          <p className="mt-4 text-sm text-slate-500">No KYC records match your filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Header */}
          <div className="flex items-center gap-2 px-1">
            <button onClick={selectAll} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-white transition-colors">
              {selectedIds.size === filtered.length ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {filtered.map((record, idx) => {
            const tierCfg = TIER_CONFIG[record.tier];
            const statusCfg = STATUS_CONFIG[record.status];
            const isExpanded = expandedId === record.id;
            const isSelected = selectedIds.has(record.id);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`rounded-2xl border backdrop-blur-md transition-all ${
                  isExpanded ? "border-violet-500/20 bg-[#0a0a14]/90" : "border-white/5 bg-[#0a0a14]/60 hover:border-white/10"
                }`}
              >
                {/* Card Header */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-5"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(record.id);
                    }}
                    className="shrink-0 text-slate-500 hover:text-white transition-colors"
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4 text-cyan-400" /> : <Square className="h-4 w-4" />}
                  </button>

                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tierCfg.bg} ring-1 ${tierCfg.border}`}>
                    <tierCfg.icon className={`h-5 w-5 ${tierCfg.color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{record.displayName}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tierCfg.bg} ${tierCfg.border} ${tierCfg.color}`}>
                        {tierCfg.label}
                      </span>
                      <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{record.ledgerId}</span>
                      <span>•</span>
                      <span>{record.email}</span>
                      <span>•</span>
                      <span>Submitted {new Date(record.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div className="hidden shrink-0 flex-col items-end sm:flex">
                    <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${getRiskColor(record.riskScore || 0)}`}>
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-bold">{record.riskScore || 0}</span>
                    </div>
                    <span className="mt-0.5 text-[9px] text-slate-500">{getRiskLabel(record.riskScore || 0)} Risk</span>
                  </div>

                  <div className="shrink-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Review Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-5 pb-5 pt-4">
                        {/* Legal Name Match */}
                        <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                              <Fingerprint className="h-3.5 w-3.5 text-cyan-400" /> Legal Identity
                            </h4>
                            <span className="text-[10px] text-slate-500">Must match government ID exactly</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] uppercase text-slate-500">Display Name</p>
                              <p className="mt-1 text-sm font-medium text-white">{record.displayName}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase text-slate-500">Legal Name (from ID)</p>
                              <p className="mt-1 text-sm font-medium text-amber-300">{record.legalName || "Not extracted"}</p>
                            </div>
                          </div>
                          {record.legalName && record.displayName.toLowerCase() !== record.legalName.toLowerCase() && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Name mismatch detected. Manual reconciliation required.
                            </div>
                          )}
                        </div>

                        {/* Side-by-Side Document Review */}
                        <div className="mb-4 grid gap-4 lg:grid-cols-2">
                          {/* ID Document */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-amber-400" /> Government ID
                              </h4>
                              {record.idDocUrl ? (
                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">Present</span>
                              ) : (
                                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-400">Missing</span>
                              )}
                            </div>
                            {record.idDocUrl ? (
                              <div className="group relative aspect-[3/2] overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <img src={record.idDocUrl} alt="ID Document" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                  <a href={record.idDocUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm ring-1 ring-white/20">
                                    <Eye className="h-3.5 w-3.5" /> Open Full
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex aspect-[3/2] items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
                                <FileText className="h-8 w-8 text-white/10" />
                              </div>
                            )}
                          </div>

                          {/* Selfie */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                                <Camera className="h-3.5 w-3.5 text-cyan-400" /> Live Selfie
                              </h4>
                              {record.selfieUrl ? (
                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">Present</span>
                              ) : (
                                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-400">Missing</span>
                              )}
                            </div>
                            {record.selfieUrl ? (
                              <div className="group relative aspect-[3/2] overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <img src={record.selfieUrl} alt="Selfie" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                  <a href={record.selfieUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm ring-1 ring-white/20">
                                    <Eye className="h-3.5 w-3.5" /> Open Full
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex aspect-[3/2] items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
                                <Camera className="h-8 w-8 text-white/10" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Liveness & Address */}
                        <div className="mb-4 grid gap-4 lg:grid-cols-2">
                          {/* Liveness Video */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                                <Video className="h-3.5 w-3.5 text-violet-400" /> Liveness Video
                              </h4>
                              {record.livenessVideoUrl ? (
                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">Present</span>
                              ) : (
                                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400">Optional</span>
                              )}
                            </div>
                            {record.livenessVideoUrl ? (
                              <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                                <video src={record.livenessVideoUrl} className="aspect-video w-full" controls preload="metadata" />
                              </div>
                            ) : (
                              <div className="flex aspect-video items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
                                <Video className="h-8 w-8 text-white/10" />
                              </div>
                            )}
                          </div>

                          {/* Address Proof */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Address Proof
                              </h4>
                              {record.addressProofUrl ? (
                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">Present</span>
                              ) : (
                                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400">Optional</span>
                              )}
                            </div>
                            {record.addressProofUrl ? (
                              <div className="group relative aspect-video overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                                <img src={record.addressProofUrl} alt="Address" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                  <a href={record.addressProofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm ring-1 ring-white/20">
                                    <Eye className="h-3.5 w-3.5" /> Open Full
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex aspect-video items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
                                <MapPin className="h-8 w-8 text-white/10" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Risk & Meta */}
                        <div className="mb-4 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">Risk Score</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`text-lg font-bold ${getRiskColor(record.riskScore || 0).split(" ")[0]}`}>
                                {record.riskScore || 0}
                              </span>
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${getRiskColor(record.riskScore || 0)}`}>
                                {getRiskLabel(record.riskScore || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">Device Fingerprint</p>
                            <p className="mt-1 text-xs font-mono text-slate-300 truncate">{record.deviceFingerprint || "N/A"}</p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">Submitted</p>
                            <p className="mt-1 text-xs text-slate-300">{new Date(record.submittedAt).toLocaleString()}</p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <p className="text-[9px] uppercase text-slate-500">Reviewed</p>
                            <p className="mt-1 text-xs text-slate-300">
                              {record.reviewedAt ? new Date(record.reviewedAt).toLocaleString() : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {record.status === "pending" && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleReview(record.id, "approve")}
                              disabled={actionLoading[record.id]}
                              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              {actionLoading[record.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                              Approve to {tierCfg.label}
                            </button>
                            <button
                              onClick={() => handleReview(record.id, "reject", "Manual review: documents insufficient or suspicious")}
                              disabled={actionLoading[record.id]}
                              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 py-3 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/20 disabled:opacity-50"
                            >
                              {actionLoading[record.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                              Reject
                            </button>
                          </div>
                        )}

                        {record.status !== "pending" && (
                          <div className={`rounded-lg border px-4 py-3 text-xs ${
                            record.status === "approved"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                          }`}>
                            <div className="flex items-center gap-2">
                              {record.status === "approved" ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              {record.status === "approved" ? `Approved to ${tierCfg.label}` : `Rejected: ${record.rejectionReason || "No reason"}`}
                            </div>
                            {record.reviewedBy && <p className="mt-1 text-[10px] text-slate-500">Reviewed by {record.reviewedBy}</p>}
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