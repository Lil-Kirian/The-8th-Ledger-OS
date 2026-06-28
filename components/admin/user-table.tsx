"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Crown,
  UserCheck,
  Ban,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

//  Types
interface UserRow {
  id: string;
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  role: "user" | "admin";
  isPrimaryAdmin: boolean;
  kycTier: "visitor" | "sovereign" | "verified" | "whale";
  kycStatus: "pending" | "verified" | "unverified" | "rejected";
  trustScore: number;
  tier: number;
  ledgerBalance: number;
  totalCommitted: number;
  isBanned: boolean;
  banReason?: string;
  lastLoginAt?: string;
  lastLoginIP?: string;
  createdAt: string;
  deviceFingerprint?: string;
}

interface UserTableProps {
  users: UserRow[];
  onAction: (action: string, userId: string, payload?: any) => Promise<void>;
  isLoading?: boolean;
}

type SortKey = keyof UserRow;
type SortDir = "asc" | "desc";

//  KYC Tier Config
const kycTierConfig = {
  visitor: {
    label: "Visitor",
    color: "text-slate-400",
    bg: "bg-slate-800/40",
    border: "border-slate-700/40",
    icon: ShieldX,
  },
  sovereign: {
    label: "Sovereign",
    color: "text-cyan-400",
    bg: "bg-cyan-950/30",
    border: "border-cyan-700/30",
    icon: Shield,
  },
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-950/30",
    border: "border-emerald-700/30",
    icon: ShieldCheck,
  },
  whale: {
    label: "Whale",
    color: "text-amber-400",
    bg: "bg-amber-950/30",
    border: "border-amber-700/30",
    icon: Crown,
  },
};

//  Role Config
const roleConfig = {
  user: { label: "User", color: "text-slate-400", bg: "bg-slate-800/30" },
  admin: { label: "Admin", color: "text-cyan-400", bg: "bg-cyan-950/20" },
};

//  Stats
function UserStats({ users }: { users: UserRow[] }) {
  const stats = useMemo(() => {
    const total = users.length;
    const banned = users.filter((u) => u.isBanned).length;
    const verified = users.filter((u) => u.kycTier === "verified" || u.kycTier === "whale").length;
    const whales = users.filter((u) => u.kycTier === "whale").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const primaryAdmins = users.filter((u) => u.isPrimaryAdmin).length;
    const totalCommitted = users.reduce((sum, u) => sum + u.totalCommitted, 0);
    return { total, banned, verified, whales, admins, primaryAdmins, totalCommitted };
  }, [users]);

  const cards = [
    { label: "Total Subjects", value: stats.total, icon: Activity, color: "text-slate-300", bg: "bg-slate-800/20" },
    { label: "Verified", value: stats.verified, icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-950/20" },
    { label: "Whales", value: stats.whales, icon: Crown, color: "text-amber-400", bg: "bg-amber-950/20" },
    { label: "Banned", value: stats.banned, icon: Ban, color: "text-red-400", bg: "bg-red-950/20" },
    { label: "Admins", value: stats.admins, icon: Shield, color: "text-cyan-400", bg: "bg-cyan-950/20" },
    { label: "Primary Admins", value: stats.primaryAdmins, icon: Crown, color: "text-violet-400", bg: "bg-violet-950/20" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={cn(
              "p-4 rounded-xl border border-slate-800/40 flex items-center gap-3",
              card.bg
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900/50 border border-slate-700/30 flex items-center justify-center shrink-0">
              <Icon size={16} className={card.color} />
            </div>
            <div>
              <div className={cn("text-lg font-bold leading-none", card.color)}>
                {card.value.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                {card.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

//  Main Component
export default function UserTable({ users, onAction, isLoading }: UserTableProps) {
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(15);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.ledgerId.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q)
      );
    }

    if (kycFilter !== "all") {
      data = data.filter((u) => u.kycTier === kycFilter);
    }
    if (roleFilter !== "all") {
      data = data.filter((u) => u.role === roleFilter);
    }
    if (statusFilter === "banned") {
      data = data.filter((u) => u.isBanned);
    } else if (statusFilter === "active") {
      data = data.filter((u) => !u.isBanned);
    }

    data.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return data;
  }, [users, search, kycFilter, roleFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleAction = async (
    action: string,
    userId: string,
    payload?: any,
  ) => {
    setActionLoading(`${action}-${userId}`);
    try {
      await onAction(action, userId, payload);
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <Minus size={12} className="text-slate-700" />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="text-cyan-400" />
    ) : (
      <ChevronDown size={12} className="text-cyan-400" />
    );
  };

  return (
    <div className="w-full">
      <UserStats users={users} />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ledger ID, name, email, country..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0d0d1a] border border-slate-800/60 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-700/50 focus:ring-1 focus:ring-cyan-700/30 transition-all"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={kycFilter}
            onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl bg-[#0d0d1a] border border-slate-800/60 text-xs text-slate-300 focus:outline-none focus:border-cyan-700/50"
          >
            <option value="all">All Tiers</option>
            <option value="visitor">Visitor</option>
            <option value="sovereign">Sovereign</option>
            <option value="verified">Verified</option>
            <option value="whale">Whale</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl bg-[#0d0d1a] border border-slate-800/60 text-xs text-slate-300 focus:outline-none focus:border-cyan-700/50"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl bg-[#0d0d1a] border border-slate-800/60 text-xs text-slate-300 focus:outline-none focus:border-cyan-700/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">
        Showing {paginated.length} of {filtered.length} subjects
      </div>

      {/* Table */}
      <div className="bg-[#0a0a12] border border-slate-800/40 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/60 bg-[#0d0d1a]">
                {[
                  { key: "displayName" as SortKey, label: "Subject" },
                  { key: "ledgerId" as SortKey, label: "Ledger ID" },
                  { key: "kycTier" as SortKey, label: "KYC Tier" },
                  { key: "role" as SortKey, label: "Role" },
                  { key: "trustScore" as SortKey, label: "Trust" },
                  { key: "ledgerBalance" as SortKey, label: "Balance" },
                  { key: "totalCommitted" as SortKey, label: "Committed" },
                  { key: "lastLoginAt" as SortKey, label: "Last Active" },
                  { key: "createdAt" as SortKey, label: "Joined" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginated.map((user, idx) => {
                  const kycCfg = kycTierConfig[user.kycTier];
                  const KycIcon = kycCfg.icon;
                  const roleCfg = roleConfig[user.role];
                  const isMenuOpen = openMenuId === user.id;
                  const isLoadingRow = actionLoading?.endsWith(`-${user.id}`);

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, delay: idx * 0.02 }}
                      className={cn(
                        "border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group",
                        user.isBanned && "bg-red-950/5"
                      )}
                    >
                      {/* Subject */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                            {user.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-200 truncate">
                              {user.displayName}
                            </div>
                            <div className="text-[10px] text-slate-600 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Ledger ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-slate-400">{user.ledgerId}</span>
                          {user.isPrimaryAdmin && (
                            <Crown size={12} className="text-amber-400" title="Primary Admin" />
                          )}
                        </div>
                      </td>

                      {/* KYC Tier */}
                      <td className="px-4 py-3.5">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold",
                            kycCfg.bg,
                            kycCfg.border,
                            kycCfg.color
                          )}
                        >
                          <KycIcon size={10} />
                          {kycCfg.label}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold",
                            roleCfg.bg,
                            roleCfg.color
                          )}
                        >
                          {user.isPrimaryAdmin ? "Primary Admin" : roleCfg.label}
                        </span>
                      </td>

                      {/* Trust */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                user.trustScore >= 80
                                  ? "bg-emerald-500"
                                  : user.trustScore >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              )}
                              style={{ width: `${user.trustScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-400 w-8">{user.trustScore}</span>
                        </div>
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-slate-300">
                          ${user.ledgerBalance.toLocaleString()}
                        </span>
                      </td>

                      {/* Committed */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-cyan-400">
                          ${user.totalCommitted.toLocaleString()}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] text-slate-500">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never"}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 relative">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(isMenuOpen ? null : user.id)}
                            disabled={isLoadingRow}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/40 transition-all",
                              isMenuOpen && "bg-slate-800/60 border-slate-600/50"
                            )}
                          >
                            {isLoadingRow ? (
                              <Loader2 size={14} className="text-cyan-400 animate-spin" />
                            ) : (
                              <MoreHorizontal size={14} className="text-slate-400" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 top-full mt-1 z-50 w-56 bg-[#0d0d1a] border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
                              >
                                {/* KYC Actions */}
                                <div className="px-3 py-2 border-b border-slate-800/40">
                                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold mb-1">
                                    KYC Identity
                                  </div>
                                  <div className="space-y-0.5">
                                    <button
                                      onClick={() => handleAction("verify-kyc", user.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-950/20 transition-colors text-left"
                                    >
                                      <ShieldCheck size={12} />
                                      Verify KYC
                                    </button>
                                    <button
                                      onClick={() => handleAction("unverify-kyc", user.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-950/20 transition-colors text-left"
                                    >
                                      <ShieldAlert size={12} />
                                      Unverify KYC
                                    </button>
                                  </div>
                                </div>

                                {/* Tier Actions */}
                                <div className="px-3 py-2 border-b border-slate-800/40">
                                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold mb-1">
                                    Tier Control
                                  </div>
                                  <div className="space-y-0.5">
                                    <button
                                      onClick={() => handleAction("promote-tier", user.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-cyan-400 hover:bg-cyan-950/20 transition-colors text-left"
                                    >
                                      <TrendingUp size={12} />
                                      Promote Tier
                                    </button>
                                    <button
                                      onClick={() => handleAction("demote-tier", user.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800/30 transition-colors text-left"
                                    >
                                      <TrendingDown size={12} />
                                      Demote Tier
                                    </button>
                                  </div>
                                </div>

                                {/* Role Actions */}
                                <div className="px-3 py-2 border-b border-slate-800/40">
                                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold mb-1">
                                    Role Control
                                  </div>
                                  <div className="space-y-0.5">
                                    {user.role === "user" ? (
                                      <button
                                        onClick={() => handleAction("make-admin", user.id)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-violet-400 hover:bg-violet-950/20 transition-colors text-left"
                                      >
                                        <Shield size={12} />
                                        Make Admin
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleAction("make-user", user.id)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800/30 transition-colors text-left"
                                      >
                                        <UserCheck size={12} />
                                        Demote to User
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Account Actions */}
                                <div className="px-3 py-2">
                                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold mb-1">
                                    Account
                                  </div>
                                  <div className="space-y-0.5">
                                    {user.isBanned ? (
                                      <button
                                        onClick={() => handleAction("unban", user.id)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-950/20 transition-colors text-left"
                                      >
                                        <RotateCcw size={12} />
                                        Unban Account
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleAction("ban", user.id)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/20 transition-colors text-left"
                                      >
                                        <Ban size={12} />
                                        Ban Account
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleAction("suspend", user.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-950/20 transition-colors text-left"
                                    >
                                      <AlertTriangle size={12} />
                                      Suspend
                                    </button>
                                    <button
                                      onClick={() => handleAction("activate", user.id)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800/30 transition-colors text-left"
                                    >
                                      <CheckCircle2 size={12} />
                                      Activate
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {paginated.length === 0 && (
          <div className="py-16 text-center">
            <Search size={32} className="mx-auto text-slate-700 mb-3" />
            <div className="text-sm text-slate-500">No subjects found</div>
            <div className="text-[10px] text-slate-600 mt-1">Adjust your filters or search query</div>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
          <div className="text-[10px] text-slate-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700/30 text-slate-400 hover:text-slate-200 hover:border-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all",
                    page === p
                      ? "bg-cyan-950/30 border-cyan-700/40 text-cyan-400"
                      : "border-slate-700/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/50"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-700/30 text-slate-400 hover:text-slate-200 hover:border-slate-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
}