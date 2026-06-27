// app/admin/audit/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  PiggyBank,
  ShoppingCart,
  Wallet,
  Lock,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  Activity,
  Ban,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  description: string;
  ledgerId?: string;
  poolId?: string;
  hallId?: string;
  amount?: number;
  txHash: string;
  visibleToPublic: boolean;
  metadata?: string;
}

interface IhcpAuditEntry {
  id: string;
  timestamp: string;
  type: "contribution" | "repayment" | "default" | "cancelled";
  ledgerId: string;
  displayName: string;
  hallId: string;
  hallName: string;
  amount: number;
  repaidAmount: number;
  purpose: string;
  status: string;
}

export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [ihcpLogs, setIhcpLogs] = useState<IhcpAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "ihcp" | "marketplace" | "treasury" | "security" | "governance">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true);
      const [auditRes, ihcpRes] = await Promise.all([
        fetch("/api/admin/audit"),
        fetch("/api/admin/audit?type=ihcp"),
      ]);
      const auditData = await auditRes.json();
      const ihcpData = await ihcpRes.json();
      if (auditData.success) setAuditLogs(auditData.logs || []);
      if (ihcpData.success) setIhcpLogs(ihcpData.ihcpLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const filtered = useMemo(() => {
    let list = activeTab === "ihcp" ? [] : auditLogs;

    if (activeTab !== "all" && activeTab !== "ihcp") {
      list = list.filter((l) => {
        if (activeTab === "marketplace") return l.eventType.includes("marketplace") || l.eventType.includes("listing") || l.eventType.includes("inventory");
        if (activeTab === "treasury") return l.eventType.includes("treasury") || l.eventType.includes("dividend") || l.eventType.includes("revenue");
        if (activeTab === "security") return l.eventType.includes("security") || l.eventType.includes("login") || l.eventType.includes("auth");
        if (activeTab === "governance") return l.eventType.includes("proposal") || l.eventType.includes("vote") || l.eventType.includes("hall");
        return true;
      });
    }

    if (typeFilter !== "all") {
      list = list.filter((l) => l.eventType === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.eventType.toLowerCase().includes(q) ||
          l.ledgerId?.toLowerCase().includes(q) ||
          l.txHash.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const aVal = a[sortBy as keyof AuditEntry];
      const bVal = b[sortBy as keyof AuditEntry];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [auditLogs, activeTab, typeFilter, search, sortBy, sortDir]);

  const filteredIhcp = useMemo(() => {
    let list = ihcpLogs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.displayName.toLowerCase().includes(q) ||
          l.hallName.toLowerCase().includes(q) ||
          l.purpose.toLowerCase().includes(q) ||
          l.ledgerId.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      return sortDir === "asc"
        ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [ihcpLogs, search, sortDir]);

  const stats = useMemo(() => {
    return {
      total: auditLogs.length,
      ihcp: ihcpLogs.length,
      marketplace: auditLogs.filter((l) => l.eventType.includes("marketplace")).length,
      treasury: auditLogs.filter((l) => l.eventType.includes("treasury") || l.eventType.includes("dividend")).length,
      security: auditLogs.filter((l) => l.eventType.includes("security") || l.eventType.includes("login")).length,
      governance: auditLogs.filter((l) => l.eventType.includes("proposal") || l.eventType.includes("vote")).length,
    };
  }, [auditLogs, ihcpLogs]);

  const uniqueTypes = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.eventType));
    return Array.from(set).sort();
  }, [auditLogs]);

  function exportCSV() {
    const data = activeTab === "ihcp" ? filteredIhcp : filtered;
    if (activeTab === "ihcp") {
      const headers = ["Timestamp", "Type", "Ledger ID", "Name", "Hall", "Amount", "Repaid", "Purpose", "Status"];
      const rows = (data as IhcpAuditEntry[]).map((l) => [
        new Date(l.timestamp).toISOString(),
        l.type,
        l.ledgerId,
        l.displayName,
        l.hallName,
        l.amount,
        l.repaidAmount,
        l.purpose,
        l.status,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      download(csv, `ihcp-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const headers = ["Timestamp", "Type", "Description", "Ledger ID", "Pool ID", "Hall ID", "Amount", "Tx Hash", "Public"];
      const rows = (data as AuditEntry[]).map((l) => [
        new Date(l.timestamp).toISOString(),
        l.eventType,
        `"${l.description}"`,
        l.ledgerId || "",
        l.poolId || "",
        l.hallId || "",
        l.amount || "",
        l.txHash,
        l.visibleToPublic ? "YES" : "NO",
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      download(csv, `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  }

  function download(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getEventBadge(eventType: string) {
    const map: Record<string, { color: string; icon: unknown }> = {
      marketplace_listing: { color: "bg-sky-500/10 text-sky-400 border-sky-500/20", icon: ShoppingCart },
      marketplace_sale: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: ShoppingCart },
      treasury_deposit: { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", icon: Wallet },
      treasury_withdrawal: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Wallet },
      dividend_distribution: { color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: TrendingUp },
      security_login: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Lock },
      security_failed: { color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: Ban },
      proposal_created: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: FileText },
      proposal_executed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
      vote_cast: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Activity },
      hall_created: { color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: Globe },
      ihcp_contribution: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: PiggyBank },
      ihcp_repayment: { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", icon: PiggyBank },
    };
    const cfg = map[eventType] || { color: "bg-white/5 text-slate-400 border-white/10", icon: ScrollText };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase ${cfg.color}`}>
        <Icon className="h-3 w-3" />
        {eventType.replace(/_/g, " ")}
      </span>
    );
  }

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5">
          <ScrollText className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">Immutable Ledger</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Audit <span className="bg-gradient-to-r from-amber-400 to-cyan-400 bg-clip-text text-transparent">Trail</span>
        </h1>
        <p className="mt-1 max-w-lg text-sm text-slate-400">
          Every transaction, every vote, every IHCP contribution, every security event — hashed, timestamped, and immutable.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Logs", value: stats.total, color: "amber", icon: ScrollText },
          { label: "IHCP Events", value: stats.ihcp, color: "emerald", icon: PiggyBank },
          { label: "Marketplace", value: stats.marketplace, color: "sky", icon: ShoppingCart },
          { label: "Treasury", value: stats.treasury, color: "cyan", icon: Wallet },
          { label: "Security", value: stats.security, color: "rose", icon: Lock },
          { label: "Governance", value: stats.governance, color: "violet", icon: FileText },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border border-${s.color}-500/10 bg-${s.color}-500/[0.04] p-4 backdrop-blur-sm cursor-pointer transition-all hover:bg-${s.color}-500/[0.08]`}
            onClick={() => setActiveTab(s.label === "Total Logs" ? "all" : s.label.toLowerCase().split(" ")[0] as unknown)}
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <s.icon className={`h-3.5 w-3.5 text-${s.color}-400`} />
              {s.label}
            </div>
            <p className={`mt-1 text-2xl font-bold text-${s.color}-400`}>{s.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Logs", icon: ScrollText },
            { key: "ihcp", label: "IHCP Trail", icon: PiggyBank },
            { key: "marketplace", label: "Marketplace", icon: ShoppingCart },
            { key: "treasury", label: "Treasury", icon: Wallet },
            { key: "security", label: "Security", icon: Lock },
            { key: "governance", label: "Governance", icon: FileText },
          ].map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as unknown)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20"
                    : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                <t.icon className={`h-3.5 w-3.5 ${active ? "text-amber-400" : "text-slate-500"}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {activeTab !== "ihcp" && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-500/30"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-500/30 focus:bg-white/[0.05] sm:w-56"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Sort */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-slate-400 hover:text-white"
        >
          {sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          {sortBy}
        </button>
        <span className="text-[10px] text-slate-500">
          {activeTab === "ihcp" ? filteredIhcp.length : filtered.length} entries
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : activeTab === "ihcp" ? (
        /* IHCP Audit Table */
        <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/60 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Contributor</th>
                <th className="px-5 py-3">Hall</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Repaid</th>
                <th className="px-5 py-3">Purpose</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredIhcp.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                    No IHCP audit entries found.
                  </td>
                </tr>
              ) : (
                filteredIhcp.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${
                        entry.type === "contribution"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : entry.type === "repayment"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : entry.type === "default"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {entry.type === "contribution" && <PiggyBank className="h-3 w-3" />}
                        {entry.type === "repayment" && <CheckCircle2 className="h-3 w-3" />}
                        {entry.type === "default" && <AlertTriangle className="h-3 w-3" />}
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-white">{entry.displayName}</p>
                      <p className="text-[10px] text-slate-500">{entry.ledgerId}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-300">{entry.hallName}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-emerald-300">
                      ${(entry.amount / 100).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-cyan-300">
                      ${(entry.repaidAmount / 100).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-[11px] text-slate-400 capitalize">{entry.purpose}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        entry.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : entry.status === "repaid"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : entry.status === "defaulted"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* General Audit Table */
        <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/60 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Ledger</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Tx Hash</th>
                <th className="px-5 py-3">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-3">{getEventBadge(entry.eventType)}</td>
                    <td className="px-5 py-3 text-xs text-slate-300 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-5 py-3 text-[10px] text-slate-500 font-mono">
                      {entry.ledgerId || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-amber-300">
                      {entry.amount ? `$${entry.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-[10px] text-slate-600 font-mono truncate max-w-[120px]">
                      {entry.txHash.slice(0, 16)}...
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        entry.visibleToPublic
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {entry.visibleToPublic ? "Public" : "Internal"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}