// app/admin/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Crown,
  Star,
  CheckCircle2,
  Ban,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowUpCircle,
  Loader2,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Award,
  Fingerprint,
  Globe,
  Calendar,
  TrendingUp,
  ScanEye,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   TYPES — 8th Ledger Sovereign Identity
   ============================================================ */
type User = {
  id: string;
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  tier: number;
  trustScore: number;
  ledgerBalance: number;
  creditPool: number;
  identityScore: number;
  kycTier: string;
  kycStatus: string;
  role: string;
  isPrimaryAdmin?: boolean;
  status: string;
  totalCommitted: number;
  totalWon: number;
  totalRefunded: number;
  forgesCompleted: number;
  referrals: number;
  createdAt: string;
  lastLoginAt: string | null;
  oracleStanding?: { tier: string; totalPoints: number };
  globalSriScore?: number;
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
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
      {message}
    </motion.div>
  );
}

/* ============================================================
   USER ACTION MENU
   ============================================================ */
function UserActionMenu({
  user,
  onAction,
  loading,
}: {
  user: User;
  onAction: (action: string, ledgerId: string, payload?: any) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    {
      key: "verify-kyc",
      label: "Verify KYC",
      icon: ShieldCheck,
      show: user.kycTier === "visitor" || user.kycTier === "sovereign",
    },
    {
      key: "unverify-kyc",
      label: "Revoke KYC",
      icon: ShieldAlert,
      show: user.kycTier === "verified" || user.kycTier === "whale",
    },
    { key: "promote", label: "Promote Tier", icon: ArrowUpCircle, show: user.tier < 10 },
    { key: "demote", label: "Demote Tier", icon: ChevronDown, show: user.tier > 1 },
    { key: "make-admin", label: "Make Sub-Admin", icon: Award, show: user.role === "user" },
    {
      key: "make-primary-admin",
      label: "Make Primary Admin",
      icon: Crown,
      show: user.role === "user" || (["architech", "scribe", "warden"].includes(user.role) && !user.isPrimaryAdmin),
      danger: true,
    },
    {
      key: "make-user",
      label: "Remove Admin",
      icon: UserX,
      show: ["architech", "scribe", "warden"].includes(user.role),
      danger: true,
    },
    { key: "ban", label: "Ban Sovereign", icon: Ban, show: user.status !== "banned", danger: true },
    { key: "unban", label: "Unban Sovereign", icon: UserCheck, show: user.status === "banned" },
    { key: "suspend", label: "Suspend", icon: UserX, show: user.status === "active", danger: true },
    { key: "activate", label: "Activate", icon: UserCheck, show: user.status !== "active" },
  ].filter((a) => a.show);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 disabled:opacity-30"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f1a] shadow-2xl"
            >
              {actions.map((a) => (
                <button
                  key={a.key}
                  onClick={() => {
                    onAction(a.key, user.ledgerId);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5 ${
                    a.danger ? "text-rose-400 hover:bg-rose-500/10" : "text-white/70"
                  }`}
                >
                  <a.icon className="h-3.5 w-3.5" />
                  {a.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   USER DETAIL MODAL
   ============================================================ */
function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const fields = [
    { label: "Ledger ID", value: user.ledgerId, icon: Fingerprint },
    { label: "Email", value: user.email, icon: Shield },
    { label: "Country", value: user.country, icon: Globe },
    {
      label: "Role",
      value: user.isPrimaryAdmin ? "PRIMARY ADMIN" : user.role.toUpperCase(),
      icon: Award,
    },
    { label: "KYC Tier", value: user.kycTier.toUpperCase(), icon: ShieldCheck },
    { label: "KYC Status (Legacy)", value: user.kycStatus.toUpperCase(), icon: Shield },
    { label: "Joined", value: new Date(user.createdAt).toLocaleDateString(), icon: Calendar },
    {
      label: "Last Login",
      value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never",
      icon: Calendar,
    },
  ];

  const stats = [
    { label: "Total Committed", value: user.totalCommitted, color: "text-cyan-400" },
    { label: "Total Won", value: user.totalWon, color: "text-emerald-400" },
    { label: "Total Refunded", value: user.totalRefunded, color: "text-amber-400" },
    { label: "Forges", value: user.forgesCompleted, color: "text-violet-400" },
    { label: "Referrals", value: user.referrals, color: "text-fuchsia-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a14] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.displayName}</h3>
              <p className="text-[10px] text-white/30">{user.ledgerId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-white/30">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {fields.map((f) => (
            <div key={f.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <f.icon className="h-3 w-3 text-white/20" />
                <span className="text-[9px] uppercase tracking-wider text-white/30">{f.label}</span>
              </div>
              <p className="text-xs font-semibold text-white">{f.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-white/30">Activity Metrics</h4>
          <div className="grid grid-cols-5 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center">
                <p className={`text-sm font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                <p className="mt-1 text-[9px] text-white/20">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 8th Ledger Identity Scores */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Identity Score</p>
                <p className="text-[10px] text-white/30">Trust + KYC + activity</p>
              </div>
            </div>
            <span className="text-xl font-bold text-amber-400">{user.identityScore}</span>
          </div>

          {user.oracleStanding && (
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <ScanEye className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Oracle Standing</p>
                  <p className="text-[10px] text-white/30">{user.oracleStanding.tier}</p>
                </div>
              </div>
              <span className="text-xl font-bold text-violet-400">{user.oracleStanding.totalPoints}</span>
            </div>
          )}

          {user.globalSriScore !== undefined && (
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Shield className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Global SRI</p>
                  <p className="text-[10px] text-white/30">Reputation index</p>
                </div>
              </div>
              <span className="text-xl font-bold text-cyan-400">{user.globalSriScore}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE — 8th Ledger Sovereign Registry
   ============================================================ */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKycTier, setFilterKycTier] = useState("all");
  const [sortBy, setSortBy] = useState("trustScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({
        q: search,
        status: filterStatus,
        kycTier: filterKycTier,
        sort: sortBy,
        dir: sortDir,
        page: String(currentPage),
        limit: "25",
      });
      try {
        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        if (data.success) {
          setUsers((prev) => (reset ? data.users : [...prev, ...data.users]));
          setHasMore(data.users.length === 25);
          if (reset) setPage(1);
        } else {
          setToast({ message: data.error || "Failed to load users", type: "error" });
        }
      } catch {
        setToast({ message: "Network error loading sovereigns", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [search, filterStatus, filterKycTier, sortBy, sortDir, page]
  );

  useEffect(() => {
    setLoading(true);
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterKycTier, sortBy, sortDir]);

  useEffect(() => {
    if (page > 1) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleAction(action: string, ledgerId: string) {
    setActionLoading(ledgerId);
    try {
      const body: any = { action, ledgerId };
      if (action === "promote") body.tierDelta = 1;
      if (action === "demote") body.tierDelta = -1;

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message || "Action completed", type: "success" });
        fetchUsers(true);
      } else {
        setToast({ message: data.error || "Action failed", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  const activeCount = users.filter((u) => u.status === "active").length;
  const bannedCount = users.filter((u) => u.status === "banned").length;
  const verifiedCount = users.filter((u) => u.kycTier === "verified" || u.kycTier === "whale").length;
  // PHASE 4: Oracle stats
  const oracleCount = users.filter((u) => u.oracleStanding && u.oracleStanding.totalPoints > 0).length;
  const prophetCount = users.filter((u) => u.oracleStanding?.tier === "prophet").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1">
          <Users className="h-3 w-3 text-violet-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-300">Identity Control</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Sovereign Registry</h1>
        <p className="mt-1 text-sm text-white/40">
          Ban, verify, promote, and view identity scores across all 8th Ledger identities.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Active", value: activeCount, color: "emerald", icon: UserCheck },
          { label: "Banned", value: bannedCount, color: "rose", icon: Ban },
          { label: "KYC Verified+", value: verifiedCount, color: "cyan", icon: ShieldCheck },
          { label: "Oracle Standing", value: oracleCount, color: "violet", icon: ScanEye },
          { label: "Prophets", value: prophetCount, color: "amber", icon: Eye },
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
            placeholder="Search by Ledger ID, name, email, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 placeholder:text-white/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <Filter className="h-3 w-3 text-white/20 ml-1" />
            {["all", "active", "suspended", "banned"].map((f) => (
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
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {["all", "visitor", "sovereign", "verified", "whale"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterKycTier(f)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition-all ${
                  filterKycTier === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSortDir((d) => (d === "desc" ? "asc" : "desc"));
            }}
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
          <div className="col-span-2 cursor-pointer hover:text-white/50" onClick={() => setSortBy("displayName")}>Sovereign</div>
          <div className="col-span-1 cursor-pointer hover:text-white/50" onClick={() => setSortBy("tier")}>Tier</div>
          <div className="col-span-1 cursor-pointer hover:text-white/50" onClick={() => setSortBy("trustScore")}>Trust</div>
          <div className="col-span-1 cursor-pointer hover:text-white/50" onClick={() => setSortBy("identityScore")}>Identity</div>
          <div className="col-span-1 cursor-pointer hover:text-white/50" onClick={() => setSortBy("oracleStanding")}>Oracle</div>
          <div className="col-span-1">KYC Tier</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-1 cursor-pointer hover:text-white/50" onClick={() => setSortBy("ledgerBalance")}>LED</div>
          <div className="col-span-1 cursor-pointer hover:text-white/50" onClick={() => setSortBy("creditPool")}>Credit</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/20">No sovereigns found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div
                key={u.ledgerId}
                className="grid grid-cols-12 gap-4 px-4 py-3 text-xs items-center hover:bg-white/[0.02] cursor-pointer"
                onClick={() => setDetailUser(u)}
              >
                <div className="col-span-2">
                  <p className="font-semibold text-white">{u.displayName}</p>
                  <p className="text-[10px] text-white/20">{u.ledgerId} • {u.country}</p>
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      u.tier >= 8 ? "text-amber-400" : u.tier >= 5 ? "text-violet-400" : u.tier >= 3 ? "text-indigo-400" : "text-slate-400"
                    }`}
                  >
                    <Crown className="h-3 w-3" />
                    {u.tier}
                  </span>
                </div>
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-sky-400" />
                    <span className="text-white font-mono">{u.trustScore}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <span className="font-mono text-amber-400">{u.identityScore}</span>
                </div>
                {/* PHASE 4: Oracle Standing Column */}
                <div className="col-span-1">
                  {u.oracleStanding && u.oracleStanding.totalPoints > 0 ? (
                    <div className="flex flex-col">
                      <span className={`text-[9px] font-bold uppercase ${
                        u.oracleStanding.tier === "prophet" ? "text-amber-400" :
                        u.oracleStanding.tier === "oracle" ? "text-slate-300" :
                        u.oracleStanding.tier === "seer" ? "text-orange-400" :
                        "text-slate-500"
                      }`}>
                        {u.oracleStanding.tier}
                      </span>
                      <span className="text-[10px] font-mono text-violet-400">{u.oracleStanding.totalPoints} pts</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/20">—</span>
                  )}
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                      u.kycTier === "whale"
                        ? "bg-purple-500/10 text-purple-400"
                        : u.kycTier === "verified"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : u.kycTier === "sovereign"
                        ? "bg-sky-500/10 text-sky-400"
                        : u.kycTier === "pending"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-white/5 text-white/30"
                    }`}
                  >
                    {u.kycTier}
                  </span>
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                      u.isPrimaryAdmin
                        ? "bg-amber-500/10 text-amber-400"
                        : ["architech", "scribe", "warden"].includes(u.role)
                        ? "bg-violet-500/10 text-violet-400"
                        : "bg-white/5 text-white/30"
                    }`}
                  >
                    {u.isPrimaryAdmin ? "Primary" : u.role}
                  </span>
                </div>
                <div className="col-span-1 font-mono text-amber-400">{u.ledgerBalance.toLocaleString()}</div>
                <div className="col-span-1 font-mono text-cyan-400">{u.creditPool.toLocaleString()}</div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-semibold border ${
                      u.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : u.status === "suspended"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {u.status === "active" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Ban className="h-2.5 w-2.5" />}
                    {u.status}
                  </span>
                </div>
                <div className="col-span-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <UserActionMenu user={u} onAction={handleAction} loading={actionLoading === u.ledgerId} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 px-6 py-2 text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More"}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailUser && <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />}
      </AnimatePresence>
    </div>
  );
}
