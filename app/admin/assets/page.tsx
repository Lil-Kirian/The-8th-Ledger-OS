"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Shield,
  Globe,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Image as ImageIcon,
  Ban,
  ArrowRight,
  Landmark,
  Hammer,
  HardHat,
  Wrench,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/* ============================================================
   VERTICAL DISPLAY MAP — 8th Ledger
   ============================================================ */
const VERTICAL_LABELS: Record<string, string> = {
  ledgerprop: "LedgerProp",
  ledgerauto: "LedgerAuto",
  ledgertech: "LedgerTech",
  ledgeredu: "LedgerEdu",
  ledgerhealth: "LedgerHealth",
  ledgerbiz: "LedgerBiz",
  ledgertravel: "LedgerTravel",
  ledgeragri: "LedgerAgri",
  ledgerenergy: "LedgerEnergy",
  ledgeraccess: "LedgerAccess",
  ledgersport: "SportLedger",
};

function formatVertical(slug: string): string {
  return VERTICAL_LABELS[slug.toLowerCase()] || slug;
}

/* ============================================================
   TYPES
   ============================================================ */
type Asset = {
  id: string;
  poolId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  assetValue: number;
  country: string;
  verticalId: string;
  creatorId: string;
  creatorName: string;
  committed: number;
  participants: number;
  maxParticipants: number;
  status: string;
  isVerified: boolean;
  reportedCount: number;
  createdAt: string;
  closesAt: string;
  hallClass?: string | null;
  trueCost?: number | null;
  listedPrice?: number | null;
};

type AssetReport = {
  id: string;
  poolId: string;
  poolName: string;
  ledgerId: string;
  reporterName: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
};

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
   ASSET DETAIL MODAL
   ============================================================ */
function AssetDetailModal({ asset, onClose, onAction }: { asset: Asset; onClose: () => void; onAction: (action: string) => void }) {
  const fillPct = Math.min(100, Math.round((asset.committed / (asset.listedPrice || asset.assetValue)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0a0a14] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/10 bg-white/5">
              {asset.imageUrl ? (
                <Image src={asset.imageUrl} alt={asset.name} fill className="object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-white/20 absolute inset-0 m-auto" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{asset.name}</h3>
              <p className="text-[10px] text-white/30">{asset.poolId} • {formatVertical(asset.verticalId)} {asset.hallClass ? `• Class ${asset.hallClass}` : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-white/30">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-white/50 leading-relaxed">{asset.description || "No description provided."}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] uppercase tracking-wider text-white/30">Listed Price</span>
              </div>
              <p className="text-sm font-bold text-emerald-400">${asset.assetValue.toLocaleString()}</p>
              {asset.trueCost && (
                <p className="text-[9px] text-white/20 mt-0.5">True Cost: ${asset.trueCost.toLocaleString()}</p>
              )}
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3 w-3 text-cyan-400" />
                <span className="text-[9px] uppercase tracking-wider text-white/30">Participants</span>
              </div>
              <p className="text-sm font-bold text-cyan-400">
                {asset.participants} / {asset.maxParticipants}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Globe className="h-3 w-3 text-sky-400" />
                <span className="text-[9px] uppercase tracking-wider text-white/30">Country</span>
              </div>
              <p className="text-sm font-bold text-white">{asset.country}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-[9px] uppercase tracking-wider text-white/30">Closes</span>
              </div>
              <p className="text-sm font-bold text-amber-400">{new Date(asset.closesAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-wider text-white/30">Commitment Progress</span>
              <span className="text-xs font-bold text-white">{fillPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-white/20">
              ${asset.committed.toLocaleString()} of ${(asset.listedPrice || asset.assetValue).toLocaleString()} committed
            </p>
          </div>

          {asset.reportedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/10 bg-rose-500/5 p-3">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <p className="text-xs text-rose-300">
                This asset has been reported <strong>{asset.reportedCount}</strong> time(s).
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onAction("approve")}
            className="flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => onAction("reject")}
            className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Ban className="h-4 w-4" />
            Reject
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================
   REPORT CARD
   ============================================================ */
function ReportCard({ report, onResolve }: { report: AssetReport; onResolve: (id: string, action: "dismiss" | "remove") => void }) {
  const [loading, setLoading] = useState(false);

  async function handle(action: "dismiss" | "remove") {
    setLoading(true);
    await onResolve(report.id, action);
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{report.poolName}</p>
          <p className="text-[10px] text-white/20">{report.poolId}</p>
        </div>
        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
          {report.status}
        </span>
      </div>
      <div className="mb-3 space-y-1">
        <p className="text-xs text-white/40">
          <span className="text-white/20">Reporter:</span> {report.reporterName} ({report.ledgerId})
        </p>
        <p className="text-xs text-white/40">
          <span className="text-white/20">Reason:</span> {report.reason}
        </p>
        <p className="text-xs text-white/30 leading-relaxed">{report.description}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handle("dismiss")}
          disabled={loading}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
        >
          Dismiss
        </button>
        <button
          onClick={() => handle("remove")}
          disabled={loading}
          className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-[10px] font-medium text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-30"
        >
          Remove Asset
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [reports, setReports] = useState<AssetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState("pending");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "reports">("listings");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: search,
      verified: filterVerified,
      sort: sortBy,
      dir: sortDir,
    });
    try {
      const res = await fetch(`/api/admin/assets?${params}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets);
        setReports(data.reports || []);
      } else {
        setToast({ message: data.error || "Failed to load assets", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, filterVerified, sortBy, sortDir]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  async function handleAssetAction(action: string) {
    if (!detailAsset) return;
    try {
      const res = await fetch("/api/admin/assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, poolId: detailAsset.poolId }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message, type: "success" });
        setDetailAsset(null);
        fetchAssets();
      } else {
        setToast({ message: data.error || "Action failed", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    }
  }

  async function handleReportResolve(reportId: string, action: "dismiss" | "remove") {
    try {
      const res = await fetch("/api/admin/assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action === "remove" ? "remove-reported" : "dismiss-report", reportId }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message, type: "success" });
        fetchAssets();
      } else {
        setToast({ message: data.error || "Failed", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    }
  }

  const pendingCount = assets.filter((a) => !a.isVerified).length;
  const verifiedCount = assets.filter((a) => a.isVerified).length;
  const reportCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1">
          <Building2 className="h-3 w-3 text-teal-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-300">Asset Moderation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Asset Control</h1>
        <p className="mt-1 text-sm text-white/40">Approve or reject asset pools before they enter the Meridian Cycle. Mediate reported assets.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "listings" ? "text-teal-400" : "text-white/30 hover:text-white/50"
          }`}
        >
          Listings
          {activeTab === "listings" && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />}
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "reports" ? "text-rose-400" : "text-white/30 hover:text-white/50"
          }`}
        >
          Reports
          {reportCount > 0 && (
            <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500/20 px-1 text-[9px] font-bold text-rose-400">
              {reportCount}
            </span>
          )}
          {activeTab === "reports" && <motion.div layoutId="assetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-400" />}
        </button>
      </div>

      {activeTab === "listings" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending", value: pendingCount, color: "amber", icon: Clock },
              { label: "Live", value: verifiedCount, color: "emerald", icon: CheckCircle2 },
              { label: "Reported", value: assets.filter((a) => a.reportedCount > 0).length, color: "rose", icon: AlertTriangle },
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
                placeholder="Search by name, pool ID, country, or vertical..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-teal-500/30 placeholder:text-white/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                {["pending", "verified", "all"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterVerified(f)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition-all ${
                      filterVerified === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
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
              <div className="col-span-4">Asset</div>
              <div className="col-span-1">Value</div>
              <div className="col-span-1">Vertical</div>
              <div className="col-span-1">Country</div>
              <div className="col-span-1">Fill</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Verified</div>
              <div className="col-span-1">Reports</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {loading && assets.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
              </div>
            ) : assets.length === 0 ? (
              <div className="py-12 text-center text-sm text-white/20">No assets found.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {assets.map((a) => {
                  const fillPct = Math.min(100, Math.round((a.committed / (a.listedPrice || a.assetValue)) * 100));
                  return (
                    <div
                      key={a.poolId}
                      className="grid grid-cols-12 gap-4 px-4 py-3 text-xs items-center hover:bg-white/[0.02]"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="relative h-9 w-9 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                          {a.imageUrl ? (
                            <Image src={a.imageUrl} alt={a.name} fill className="object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-white/20 absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{a.name}</p>
                          <p className="text-[10px] text-white/20">{a.poolId} {a.hallClass ? `• Class ${a.hallClass}` : ""}</p>
                        </div>
                      </div>
                      <div className="col-span-1 font-mono text-emerald-400">${(a.assetValue / 1000).toFixed(0)}k</div>
                      <div className="col-span-1 text-white/50">{formatVertical(a.verticalId)}</div>
                      <div className="col-span-1 text-white/50">{a.country}</div>
                      <div className="col-span-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-500"
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-white/30">{fillPct}%</span>
                        </div>
                      </div>
                      <div className="col-span-1">
                        <span
                          className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                            a.status === "filling"
                              ? "bg-sky-500/10 text-sky-400"
                              : a.status === "closed"
                              ? "bg-amber-500/10 text-amber-400"
                              : a.status === "forged"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-white/5 text-white/30"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <div className="col-span-1">
                        {a.isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <div className="col-span-1">
                        {a.reportedCount > 0 ? (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500/10 px-1.5 text-[9px] font-bold text-rose-400">
                            {a.reportedCount}
                          </span>
                        ) : (
                          <span className="text-white/10">—</span>
                        )}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => setDetailAsset(a)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Eye className="h-3 w-3" />
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/20">No pending reports.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reports.map((r) => (
                <ReportCard key={r.id} report={r} onResolve={handleReportResolve} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailAsset && (
          <AssetDetailModal
            asset={detailAsset}
            onClose={() => setDetailAsset(null)}
            onAction={handleAssetAction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}