"use client";

import { useState, useEffect } from "react";
import {
  Coins, CheckCircle2, XCircle, Clock, User, Landmark,
  ArrowRight, AlertTriangle, Shield, Filter, Download,
} from "lucide-react";

type WithdrawalStatus = "pending" | "processing" | "completed" | "rejected";

interface Withdrawal {
  id: string;
  userId: string;
  displayName: string;
  ledgerId: string;
  email: string;
  kycTier: string;
  amount: number;
  currency: string;
  destinationType: string;
  destination: string;
  destinationAccount: string;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  rejectionReason: string | null;
  notes: string | null;
}

interface WithdrawalStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  rejected: number;
  pendingAmount: number;
  totalAmount: number;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [filter, setFilter] = useState<WithdrawalStatus | "all">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejectionModal, setRejectionModal] = useState<{ id: string; reason: string } | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  async function fetchWithdrawals() {
    try {
      const res = await fetch("/api/admin/withdrawals?limit=200");
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("[WITHDRAWALS]", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, status: WithdrawalStatus, rejectionReason?: string) {
    setProcessingId(id);
    setMessage("");

    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: id, status, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Withdrawal ${id.slice(0, 8)}... marked as ${status}`);
        setWithdrawals((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status,
                  processedAt: new Date().toISOString(),
                  rejectionReason: rejectionReason || w.rejectionReason,
                }
              : w
          )
        );
        fetchWithdrawals();
      } else {
        setMessage(data.error || "Action failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setProcessingId(null);
      setRejectionModal(null);
    }
  }

  const filtered = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const pendingCount = stats?.pending ?? withdrawals.filter((w) => w.status === "pending").length;
  const totalPendingAmount = stats?.pendingAmount ?? withdrawals
    .filter((w) => w.status === "pending")
    .reduce((a, w) => a + w.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-amber-500/30 selection:text-amber-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
            <Coins className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-300">
              Treasury Gate
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Withdrawal Processor</h1>
          <p className="mt-1 text-sm text-white/40">
            Approve or reject sovereign withdrawal requests. Funds return to wallet if rejected.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Pending Amount</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">${totalPendingAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Completed Today</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {withdrawals.filter(
                (w) =>
                  w.status === "completed" &&
                  w.processedAt &&
                  new Date(w.processedAt).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Rejected</p>
            <p className="mt-1 text-2xl font-bold text-rose-400">
              {stats?.rejected ?? withdrawals.filter((w) => w.status === "rejected").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-white/30" />
          {(["all", "pending", "processing", "completed", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition-all ${
                filter === f ? "bg-white/10 text-white" : "bg-white/5 text-white/40 hover:bg-white/[0.07]"
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto">
            <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-white/60 hover:bg-white/10 transition-all">
              <Download className="h-3 w-3" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30 border-b border-white/5 bg-white/[0.02]">
            <div className="col-span-2">Sovereign</div>
            <div className="col-span-2">Destination</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Requested</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Shield className="mx-auto h-8 w-8 text-white/10 mb-3" />
                <p className="text-sm text-white/30">No withdrawals match this filter</p>
              </div>
            ) : (
              filtered.map((w) => {
                const isPending = w.status === "pending";
                const isProcessing = w.status === "processing";
                const isCompleted = w.status === "completed";
                const isRejected = w.status === "rejected";

                return (
                  <div
                    key={w.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 text-xs hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
                          <User className="h-3.5 w-3.5 text-white/30" />
                        </div>
                        <div>
                          <p className="text-white font-medium truncate">{w.displayName}</p>
                          <p className="text-[10px] text-white/20">{w.ledgerId}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="h-3 w-3 text-white/20" />
                        <span className="text-white/40 truncate capitalize">
                          {w.destinationType}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/20 truncate">{w.destinationAccount}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="font-mono font-bold text-white">${w.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-white/20">{w.currency}</p>
                    </div>

                    <div className="col-span-2 text-white/30">
                      <p>{new Date(w.requestedAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-white/20">
                        {new Date(w.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-semibold border ${
                          isPending
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : isProcessing
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {isPending && <Clock className="h-2.5 w-2.5" />}
                        {isProcessing && <ArrowRight className="h-2.5 w-2.5" />}
                        {isCompleted && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {isRejected && <XCircle className="h-2.5 w-2.5" />}
                        {w.status}
                      </span>
                      {w.rejectionReason && (
                        <p className="text-[9px] text-rose-400/60 mt-1 truncate" title={w.rejectionReason}>
                          {w.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 text-right">
                      {isPending && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                            onClick={() => handleAction(w.id, "completed")}
                            disabled={processingId === w.id}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 text-[10px] font-semibold text-rose-400 transition-all hover:bg-rose-500/20 disabled:opacity-50"
                            onClick={() => setRejectionModal({ id: w.id, reason: "" })}
                            disabled={processingId === w.id}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      )}
                      {!isPending && (
                        <span className="text-[10px] text-white/20">
                          {w.processedAt
                            ? new Date(w.processedAt).toLocaleDateString()
                            : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 text-xs border ${
              message.includes("completed")
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : message.includes("rejected")
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {message}
          </div>
        )}

        {/* Rejection Modal */}
        {rejectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a14] p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-2">Reject Withdrawal</h3>
              <p className="text-xs text-white/40 mb-4">
                Funds will be returned to the sovereign's wallet. A reason is required.
              </p>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="Enter rejection reason..."
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-rose-500/30 min-h-[80px] resize-none"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setRejectionModal(null)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    rejectionModal.reason.trim()
                      ? handleAction(rejectionModal.id, "rejected", rejectionModal.reason)
                      : setMessage("Rejection reason is required")
                  }
                  disabled={!rejectionModal.reason.trim() || processingId === rejectionModal.id}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-500 transition-all disabled:opacity-50"
                >
                  {processingId === rejectionModal.id ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}