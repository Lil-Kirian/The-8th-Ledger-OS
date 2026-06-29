"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

// ─
// TYPES
// ─
interface Transaction {
  id: string;
  amount: number;
  status: "completed" | "pending" | "processing" | "failed" | "cancelled";
  method?: string;
  destination?: string;
  destinationType?: string;
  createdAt: string;
  type:
    | "deposit"
    | "withdrawal"
    | "dividend"
    | "commitment"
    | "reinvestment"
    | "tithe";
  hallName?: string;
  txHash?: string;
}

interface KycTierLimit {
  tier: string;
  label: string;
  dailyLimit: number;
  instant: boolean;
  delayHours: number;
  color: string;
}

const KYC_TIERS: KycTierLimit[] = [
  {
    tier: "visitor",
    label: "Visitor",
    dailyLimit: 0,
    instant: false,
    delayHours: 0,
    color: "#64748b",
  },
  {
    tier: "sovereign",
    label: "Sovereign",
    dailyLimit: 500,
    instant: true,
    delayHours: 0,
    color: "#22d3ee",
  },
  {
    tier: "verified",
    label: "Verified",
    dailyLimit: 5000,
    instant: false,
    delayHours: 24,
    color: "#34d399",
  },
  {
    tier: "whale",
    label: "Whale",
    dailyLimit: 999999,
    instant: false,
    delayHours: 72,
    color: "#fbbf24",
  },
];

const MONTHLY_FLOW = [
  4200, 5100, 4800, 6200, 5900, 7100, 6800, 7500, 8200, 7800, 9100, 8500,
];

// ─
// UTILITIES
// ─
const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const formatMoneyPrecise = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

const AnimatedCounter = ({
  value,
  prefix = "",
  suffix = "",
  duration = 1800,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return (
    <span ref={ref} className="tabular-nums tracking-tighter">
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}
      {suffix}
    </span>
  );
};

// ─
// FUTURISTIC UI COMPONENTS
// ─
const HologramCard = ({
  children,
  className = "",
  accent = "cyan",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "cyan" | "amber" | "emerald" | "rose" | "violet" | "slate";
}) => {
  const accentMap = {
    cyan: "from-cyan-500/[0.08] via-blue-500/[0.03] to-transparent border-cyan-500/20 shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)]",
    amber:
      "from-amber-500/[0.08] via-yellow-500/[0.03] to-transparent border-amber-500/20 shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)]",
    emerald:
      "from-emerald-500/[0.08] via-teal-500/[0.03] to-transparent border-emerald-500/20 shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)]",
    rose: "from-rose-500/[0.08] via-red-500/[0.03] to-transparent border-rose-500/20 shadow-[0_0_60px_-15px_rgba(244,63,94,0.2)]",
    violet:
      "from-violet-500/[0.08] via-fuchsia-500/[0.03] to-transparent border-violet-500/20 shadow-[0_0_60px_-15px_rgba(139,92,246,0.2)]",
    slate:
      "from-slate-500/[0.06] via-slate-500/[0.02] to-transparent border-slate-500/15 shadow-[0_0_40px_-15px_rgba(100,116,139,0.1)]",
  };
  return (
    <div
      className={`relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-2xl transition-all duration-500 hover:scale-[1.005] ${accentMap[accent]} ${className}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    completed: {
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400",
      label: "DONE",
    },
    pending: {
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dot: "bg-amber-400 animate-pulse",
      label: "PENDING",
    },
    processing: {
      cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      dot: "bg-cyan-400 animate-pulse",
      label: "PROCESSING",
    },
    failed: {
      cls: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      dot: "bg-rose-400",
      label: "FAILED",
    },
    cancelled: {
      cls: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      dot: "bg-slate-400",
      label: "CANCELLED",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-[0.15em] ${s.cls}`}
    >
      <span
        className={`w-1 h-1 rounded-full ${s.dot} shadow-[0_0_6px_currentColor]`}
      />
      {s.label}
    </span>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, { icon: string; color: string }> = {
    deposit: {
      icon: "↓",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    withdrawal: {
      icon: "↑",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    dividend: {
      icon: "◆",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    commitment: {
      icon: "🔒",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    reinvestment: {
      icon: "↻",
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    tithe: {
      icon: "🏛",
      color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
    },
  };
  const t = map[type] || map.deposit;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${t.color}`}
    >
      <span>{t.icon}</span>
      <span className="uppercase tracking-wider">{type}</span>
    </span>
  );
};

const MiniSparkline = ({
  data,
  color = "#22d3ee",
  height = 28,
}: {
  data: number[];
  color?: string;
  height?: number;
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const points = data
    .map(
      (v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`,
    )
    .join(" ");
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient
          id={`sp-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#sp-${color.replace("#", "")})`}
        stroke="none"
        points={`0,${h} ${points} ${w},${h}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const HexBadge = ({
  value,
  label,
  color = "cyan",
}: {
  value: string;
  label: string;
  color?: "cyan" | "amber" | "emerald" | "violet" | "rose" | "slate";
}) => {
  const colors = {
    cyan: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5",
    amber: "border-amber-500/30 text-amber-400 bg-amber-500/5",
    emerald: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
    violet: "border-violet-500/30 text-violet-400 bg-violet-500/5",
    rose: "border-rose-500/30 text-rose-400 bg-rose-500/5",
    slate: "border-slate-500/30 text-slate-400 bg-slate-500/5",
  };
  return (
    <div
      className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${colors[color]} backdrop-blur-sm`}
    >
      <span className="text-xs font-bold font-mono">{value}</span>
      <span className="text-[8px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
};

// ─
// MAIN PAGE
// ─
export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(42580);
  const [locked, setLocked] = useState(23750);
  const [available, setAvailable] = useState(18830);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [kycTier, setKycTier] = useState("verified");

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDestination, setWithdrawDestination] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "deposit" | "withdraw" | "history"
  >("overview");
  const [txFilter, setTxFilter] = useState<
    "all" | "deposit" | "withdrawal" | "dividend" | "commitment"
  >("all");
  const [showKycInfo, setShowKycInfo] = useState(false);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const currentTier = KYC_TIERS.find((t) => t.tier === kycTier) || KYC_TIERS[0];
  const dailyUsed = transactions
    .filter(
      (t) =>
        t.type === "withdrawal" &&
        t.status === "completed" &&
        new Date(t.createdAt).toDateString() === new Date().toDateString(),
    )
    .reduce((s, t) => s + t.amount, 0);
  const dailyRemaining = currentTier.dailyLimit - dailyUsed;

  const filteredTx = useMemo(() => {
    const list =
      txFilter === "all"
        ? transactions
        : transactions.filter((t) => t.type === txFilter);
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [transactions, txFilter]);

  const txStats = useMemo(() => {
    const inflow = transactions
      .filter(
        (t) =>
          ["deposit", "dividend"].includes(t.type) && t.status === "completed",
      )
      .reduce((s, t) => s + t.amount, 0);
    const outflow = transactions
      .filter(
        (t) =>
          ["withdrawal", "commitment", "tithe"].includes(t.type) &&
          t.status === "completed",
      )
      .reduce((s, t) => s + t.amount, 0);
    const pending = transactions
      .filter((t) => t.status === "pending")
      .reduce((s, t) => s + t.amount, 0);
    const failed = transactions.filter((t) => t.status === "failed").length;
    return { inflow, outflow, pending, failed };
  }, [transactions]);

  async function fetchWallet() {
    try {
      const res = await fetch("/api/wallet/balance");
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setLocked(data.lockedBalance);
        setAvailable(data.available);
      }
      const [depRes, withRes] = await Promise.all([
        fetch("/api/wallet/deposit"),
        fetch("/api/wallet/withdraw"),
      ]);
      const depData = await depRes.json();
      const withData = await withRes.json();
      if (depData.success) {
        const deps = depData.deposits.map((d: Omit<Transaction, "type">) => ({
          ...d,
          type: "deposit" as const,
        }));
        const withs = withData.withdrawals.map(
          (w: Omit<Transaction, "type">) => ({
            ...w,
            type: "withdrawal" as const,
          }),
        );
        setTransactions([...deps, ...withs]);
      }
    } catch (err) {
      console.error("[WALLET]", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWallet();
  }, []);

  async function handleDeposit() {
    const amount = parseInt(depositAmount);
    if (!amount || amount < 1) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: "bank_transfer" }),
      });
      const data = await res.json();
      if (data.success) {
        setDepositAmount("");
        fetchWallet();
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 1 || !withdrawDestination) return;
    if (amount > available) return;
    if (amount > dailyRemaining) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          destination: withdrawDestination,
          destinationType: "bank",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawAmount("");
        setWithdrawDestination("");
        fetchWallet();
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020205] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-800/20 flex items-center justify-center mx-auto mb-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-500"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">
            Authenticate to access your Sovereign Vault
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-emerald-500/[0.025] rounded-full blur-[180px] animate-pulse-slow" />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-amber-500/[0.025] rounded-full blur-[180px] animate-pulse-slow"
          style={{ animationDelay: "3s" }}
        />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-cyan-500/[0.02] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping opacity-30" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.3em]">
                Sovereign Liquidity Engine
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono uppercase tracking-wider">
                {currentTier.label}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
              VAULT<span className="text-emerald-400">.</span>COMMAND
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed font-light">
              Liquidity management, capital flow tracking, and withdrawal
              orchestration. KYC-gated limits. Immutable ledger. Real-time
              velocity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKycInfo(!showKycInfo)}
              className="group relative px-5 py-3 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300 font-semibold text-sm overflow-hidden transition-all hover:border-cyan-500/40 hover:text-cyan-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md"
            >
              <span className="relative z-10 flex items-center gap-2 font-mono text-xs">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                KYC Limits
              </span>
            </button>
            <button
              onClick={fetchWallet}
              className="group relative px-5 py-3 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-300 font-semibold text-sm overflow-hidden transition-all hover:border-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-md"
            >
              <span className="relative z-10 flex items-center gap-2 font-mono text-xs">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                Refresh Ledger
              </span>
            </button>
          </div>
        </header>

        {/* KYC LIMITS EXPANDABLE */}
        <AnimatePresence>
          {showKycInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden mb-10"
            >
              <HologramCard accent="cyan">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                    KYC Tier Architecture
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-6">
                    Withdrawal limits and processing delays per identity tier
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {KYC_TIERS.map((tier) => (
                      <div
                        key={tier.tier}
                        className={`p-4 rounded-xl border transition-all ${kycTier === tier.tier ? "border-cyan-500/40 bg-cyan-500/5" : "border-slate-800 bg-slate-900/20"}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-white">
                            {tier.label}
                          </span>
                          {kycTier === tier.tier && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono uppercase">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">Daily Limit</span>
                            <span className="text-white font-mono">
                              {tier.dailyLimit === 999999
                                ? "Unlimited"
                                : formatMoney(tier.dailyLimit)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">Processing</span>
                            <span
                              className={`font-mono ${tier.instant ? "text-emerald-400" : "text-amber-400"}`}
                            >
                              {tier.instant
                                ? "Instant"
                                : `${tier.delayHours}h Delay`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min((tier.dailyLimit / 5000) * 100, 100)}%`,
                                backgroundColor: tier.color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Daily Used:
                      </span>
                      <span className="text-sm font-mono text-white">
                        {formatMoney(dailyUsed)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Remaining:
                      </span>
                      <span className="text-sm font-mono text-emerald-400">
                        {currentTier.dailyLimit === 999999
                          ? "∞"
                          : formatMoney(dailyRemaining)}
                      </span>
                    </div>
                    <div className="w-32 bg-slate-800 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        style={{
                          width: `${currentTier.dailyLimit === 999999 ? 0 : Math.min((dailyUsed / currentTier.dailyLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </HologramCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP COMMAND STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-10">
          <HologramCard accent="emerald" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-[0.2em]">
                  Total Balance
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  LIQUID
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={balance} prefix="$" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Sovereign capital reserve
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="amber" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-amber-400 uppercase tracking-[0.2em]">
                  Locked in Pools
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                  COMMITTED
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={locked} prefix="$" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {((locked / (balance + locked)) * 100).toFixed(1)}% of total
                capital
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="cyan" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.2em]">
                  Available
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  FREE
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={available} prefix="$" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Withdrawal-ready liquidity
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="violet" className="col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-violet-400 uppercase tracking-[0.2em]">
                  Net Flow
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-mono">
                  30D
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                <AnimatedCounter
                  value={txStats.inflow - txStats.outflow}
                  prefix="$"
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {txStats.inflow > txStats.outflow ? "+" : ""}
                {(
                  ((txStats.inflow - txStats.outflow) / txStats.outflow) *
                  100
                ).toFixed(1)}
                % net yield
              </div>
            </div>
          </HologramCard>
        </div>

        {/* SYSTEM HEALTH ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10">
          <HologramCard
            accent="emerald"
            className="flex items-center gap-4 p-4"
          >
            <HexBadge
              value={formatMoney(txStats.inflow)}
              label="INFLOW"
              color="emerald"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  30-Day Capital Inflow
                </span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                />
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="rose" className="flex items-center gap-4 p-4">
            <HexBadge
              value={formatMoney(txStats.outflow)}
              label="OUTFLOW"
              color="rose"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  30-Day Capital Outflow
                </span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "45%" }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                />
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="amber" className="flex items-center gap-4 p-4">
            <HexBadge
              value={formatMoney(txStats.pending)}
              label="PENDING"
              color="amber"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Unsettled Transactions
                </span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((txStats.pending / balance) * 100, 100)}%`,
                  }}
                  transition={{ duration: 1.5, delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                />
              </div>
            </div>
          </HologramCard>

          <HologramCard
            accent={txStats.failed > 0 ? "rose" : "slate"}
            className="flex items-center gap-4 p-4"
          >
            <HexBadge
              value={txStats.failed.toString()}
              label="FAILED"
              color={txStats.failed > 0 ? "rose" : "slate"}
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Failed Transactions
                </span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${transactions.length === 0 ? 0 : Math.min((txStats.failed / transactions.length) * 100, 100)}%`,
                  }}
                  transition={{ duration: 1.5, delay: 0.6 }}
                  className={`h-full rounded-full ${txStats.failed > 0 ? "bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-gradient-to-r from-slate-500 to-slate-400"}`}
                />
              </div>
            </div>
          </HologramCard>
        </div>

        {/* MAIN DASHBOARD: CHART + FLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10">
          {/* CAPITAL VELOCITY CHART */}
          <HologramCard className="lg:col-span-8" accent="emerald">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Capital Velocity
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
                    12-month liquidity flow trend
                  </p>
                </div>
                <div className="flex gap-1">
                  {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
                    <button
                      key={range}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono border transition-all ${range === "1Y" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]" : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-52 w-full relative">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 900 220"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="walletArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="walletLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                    <filter id="walletGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 55}
                      x2="900"
                      y2={i * 55}
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="1"
                    />
                  ))}
                  <path
                    d={`M0,220 ${MONTHLY_FLOW.map((v, i) => {
                      const x = (i / (MONTHLY_FLOW.length - 1)) * 900;
                      const y = 220 - ((v - 3500) / 6000) * 220;
                      return `L${x},${y}`;
                    }).join(" ")} L900,220 Z`}
                    fill="url(#walletArea)"
                  />
                  <path
                    d={`M0,${220 - ((MONTHLY_FLOW[0] - 3500) / 6000) * 220} ${MONTHLY_FLOW.map(
                      (v, i) => {
                        const x = (i / (MONTHLY_FLOW.length - 1)) * 900;
                        const y = 220 - ((v - 3500) / 6000) * 220;
                        return `L${x},${y}`;
                      },
                    ).join(" ")}`}
                    fill="none"
                    stroke="url(#walletLine)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#walletGlow)"
                  />
                  {MONTHLY_FLOW.map((v, i) => {
                    const x = (i / (MONTHLY_FLOW.length - 1)) * 900;
                    const y = 220 - ((v - 3500) / 6000) * 220;
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#020205"
                          stroke="#34d399"
                          strokeWidth="1.5"
                        />
                        {i === MONTHLY_FLOW.length - 1 && (
                          <>
                            <circle
                              cx={x}
                              cy={y}
                              r="10"
                              fill="none"
                              stroke="#34d399"
                              strokeWidth="1"
                              opacity="0.3"
                            >
                              <animate
                                attributeName="r"
                                values="10;16;10"
                                dur="2.5s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                values="0.3;0;0.3"
                                dur="2.5s"
                                repeatCount="indefinite"
                              />
                            </circle>
                            <text
                              x={x}
                              y={y - 14}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize="10"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              ${(v / 1000).toFixed(1)}k
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-2 px-2 uppercase tracking-wider">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </HologramCard>

          {/* QUICK ACTIONS */}
          <div className="lg:col-span-4 space-y-4">
            <HologramCard accent="emerald">
              <div className="p-5">
                <h3 className="text-sm font-bold text-white tracking-tight mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("deposit")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14M5 12l7-7 7 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        Deposit Capital
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        Bank transfer · Crypto · Wire
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("withdraw")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors">
                        Withdraw Funds
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {currentTier.delayHours}h delay ·{" "}
                        {formatMoney(currentTier.dailyLimit)} daily
                      </div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 1l4 4-4 4" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <path d="M7 23l-4-4 4-4" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        Transfer to Hall
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        Direct pool commitment
                      </div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M16 16h5v-5" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-white group-hover:text-violet-300 transition-colors">
                        Auto-Reinvest
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        Compound dividend yield
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </HologramCard>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mr-2">
            Module:
          </span>
          {[
            { id: "overview" as const, label: "Overview", icon: "◎" },
            { id: "deposit" as const, label: "Deposit", icon: "↓" },
            { id: "withdraw" as const, label: "Withdraw", icon: "↑" },
            { id: "history" as const, label: "History", icon: "≡" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-semibold transition-all border font-mono ${
                activeTab === tab.id
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <HologramCard accent="slate">
                  <div className="p-5">
                    <h3 className="text-sm font-bold text-white tracking-tight mb-4">
                      Capital Allocation
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Available Liquidity",
                          value: available,
                          total: balance + locked,
                          color: "from-cyan-500 to-blue-500",
                          textColor: "text-cyan-400",
                        },
                        {
                          label: "Locked Commitments",
                          value: locked,
                          total: balance + locked,
                          color: "from-amber-500 to-yellow-500",
                          textColor: "text-amber-400",
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                              {item.label}
                            </span>
                            <span
                              className={`text-sm font-mono font-bold ${item.textColor}`}
                            >
                              {formatMoney(item.value)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(item.value / item.total) * 100}%`,
                              }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${item.color} shadow-[0_0_8px_rgba(6,182,212,0.3)]`}
                            />
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono mt-1">
                            {((item.value / item.total) * 100).toFixed(1)}% of
                            total capital
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </HologramCard>

                <HologramCard accent="slate">
                  <div className="p-5">
                    <h3 className="text-sm font-bold text-white tracking-tight mb-4">
                      Transaction Velocity
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Deposits",
                          count: transactions.filter(
                            (t) => t.type === "deposit",
                          ).length,
                          value: txStats.inflow,
                          color: "emerald",
                        },
                        {
                          label: "Withdrawals",
                          count: transactions.filter(
                            (t) => t.type === "withdrawal",
                          ).length,
                          value: txStats.outflow,
                          color: "rose",
                        },
                        {
                          label: "Dividends",
                          count: transactions.filter(
                            (t) => t.type === "dividend",
                          ).length,
                          value: transactions
                            .filter((t) => t.type === "dividend")
                            .reduce((s, t) => s + t.amount, 0),
                          color: "amber",
                        },
                        {
                          label: "Commitments",
                          count: transactions.filter(
                            (t) => t.type === "commitment",
                          ).length,
                          value: transactions
                            .filter((t) => t.type === "commitment")
                            .reduce((s, t) => s + t.amount, 0),
                          color: "cyan",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="p-3 rounded-xl bg-slate-900/40 border border-slate-800"
                        >
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                            {item.label}
                          </div>
                          <div
                            className={`text-sm font-bold font-mono text-${item.color}-400`}
                          >
                            {formatMoney(item.value)}
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono">
                            {item.count} transactions
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </HologramCard>
              </div>

              {/* RECENT TRANSACTIONS PREVIEW */}
              <HologramCard accent="slate">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => setActiveTab("history")}
                      className="text-[10px] text-cyan-400 font-mono hover:text-cyan-300 transition-colors"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/20 border border-slate-800/50 hover:border-slate-700 transition-colors group cursor-pointer"
                        onClick={() =>
                          setSelectedTx(selectedTx === tx.id ? null : tx.id)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <TypeBadge type={tx.type} />
                          <div>
                            <div className="text-sm text-white group-hover:text-cyan-300 transition-colors">
                              {tx.type === "dividend" ||
                              tx.type === "commitment"
                                ? tx.hallName
                                : tx.type === "withdrawal"
                                  ? `To ${tx.destination}`
                                  : "Deposit"}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              {new Date(tx.createdAt).toLocaleDateString()} ·{" "}
                              {tx.txHash || tx.id}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-mono font-bold ${["deposit", "dividend"].includes(tx.type) ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            {["deposit", "dividend"].includes(tx.type)
                              ? "+"
                              : "-"}
                            {formatMoneyPrecise(tx.amount)}
                          </div>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </HologramCard>
            </motion.div>
          )}

          {/* DEPOSIT TAB */}
          {activeTab === "deposit" && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl"
            >
              <HologramCard accent="emerald">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                    Deposit Capital
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-6">
                    Add liquidity to your sovereign vault
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-3 gap-3">
                      {["Bank Transfer", "Wire", "Crypto"].map((method) => (
                        <button
                          key={method}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/20 text-[10px] text-slate-400 font-mono uppercase tracking-wider hover:border-emerald-500/40 hover:text-emerald-300 transition-all"
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 block font-mono">
                        Amount (USD)
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 font-mono transition-colors"
                        />
                        <button
                          onClick={handleDeposit}
                          disabled={actionLoading || !depositAmount}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {actionLoading ? (
                            <svg
                              className="animate-spin h-5 w-5"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                opacity="0.3"
                              />
                              <path
                                d="M12 2a10 10 0 0 1 10 10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                            </svg>
                          ) : (
                            <span className="flex items-center gap-2">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 5v14M5 12l7-7 7 7" />
                              </svg>
                              Deposit
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                    <div className="flex items-start gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-emerald-400 mt-0.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <div>
                        <div className="text-xs text-white font-semibold mb-1">
                          Deposit Protocol
                        </div>
                        <div className="text-[10px] text-slate-400 leading-relaxed">
                          Deposits are held in escrow until confirmed. Bank
                          transfers typically clear within 1-2 business days.
                          Crypto deposits require 6 network confirmations. All
                          deposits are insured up to $250,000.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </HologramCard>
            </motion.div>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === "withdraw" && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl"
            >
              <HologramCard accent="rose">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                    Withdraw Capital
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-6">
                    Request liquidity extraction from your vault
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                      {["Bank Account", "Crypto Wallet"].map((method) => (
                        <button
                          key={method}
                          className="p-3 rounded-xl border border-slate-800 bg-slate-900/20 text-[10px] text-slate-400 font-mono uppercase tracking-wider hover:border-rose-500/40 hover:text-rose-300 transition-all"
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 block font-mono">
                        Amount (USD)
                      </label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40 font-mono transition-colors mb-3"
                      />
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 block font-mono">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={withdrawDestination}
                        onChange={(e) => setWithdrawDestination(e.target.value)}
                        placeholder="Account number or wallet address"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40 font-mono transition-colors mb-3"
                      />
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={
                        actionLoading ||
                        !withdrawAmount ||
                        !withdrawDestination ||
                        parseInt(withdrawAmount) > available ||
                        parseInt(withdrawAmount) > dailyRemaining
                      }
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {actionLoading ? (
                        <svg
                          className="animate-spin h-5 w-5 mx-auto"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            opacity="0.3"
                          />
                          <path
                            d="M12 2a10 10 0 0 1 10 10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                        </svg>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 5v14M5 12l7 7 7-7" />
                          </svg>
                          Request Withdrawal
                        </span>
                      )}
                    </button>
                    {parseInt(withdrawAmount) > available && (
                      <p className="text-[10px] text-rose-400 font-mono">
                        Amount exceeds available balance (
                        {formatMoney(available)})
                      </p>
                    )}
                    {parseInt(withdrawAmount) > dailyRemaining &&
                      currentTier.dailyLimit !== 999999 && (
                        <p className="text-[10px] text-rose-400 font-mono">
                          Amount exceeds daily limit (
                          {formatMoney(currentTier.dailyLimit)})
                        </p>
                      )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                    <div className="flex items-start gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-amber-400 mt-0.5"
                      >
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <div>
                        <div className="text-xs text-white font-semibold mb-1">
                          Withdrawal Protocol
                        </div>
                        <div className="text-[10px] text-slate-400 leading-relaxed">
                          Your KYC tier ({currentTier.label}) allows{" "}
                          {formatMoney(currentTier.dailyLimit)} daily
                          withdrawals
                          {currentTier.instant
                            ? " instantly"
                            : ` with a ${currentTier.delayHours}-hour processing delay`}
                          . Name verification and TOTP (if enabled) are
                          required. Dormancy check active (&lt;365 days).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </HologramCard>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <HologramCard accent="slate">
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        Transaction Ledger
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
                        Immutable record of all capital movements
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        Filter:
                      </span>
                      {[
                        {
                          id: "all" as const,
                          label: "All",
                          count: transactions.length,
                        },
                        {
                          id: "deposit" as const,
                          label: "Deposits",
                          count: transactions.filter(
                            (t) => t.type === "deposit",
                          ).length,
                        },
                        {
                          id: "withdrawal" as const,
                          label: "Withdrawals",
                          count: transactions.filter(
                            (t) => t.type === "withdrawal",
                          ).length,
                        },
                        {
                          id: "dividend" as const,
                          label: "Dividends",
                          count: transactions.filter(
                            (t) => t.type === "dividend",
                          ).length,
                        },
                        {
                          id: "commitment" as const,
                          label: "Commitments",
                          count: transactions.filter(
                            (t) => t.type === "commitment",
                          ).length,
                        },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setTxFilter(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border font-mono ${
                            txFilter === f.id
                              ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                              : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                          }`}
                        >
                          {f.label}{" "}
                          <span className="opacity-50 ml-1">{f.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80">
                          <th className="pb-3 pt-4 pl-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                            Transaction
                          </th>
                          <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-center">
                            Status
                          </th>
                          <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">
                            Amount
                          </th>
                          <th className="pb-3 pt-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">
                            Date
                          </th>
                          <th className="pb-3 pt-4 pr-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider text-right">
                            Hash
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredTx.map((tx) => (
                          <tr
                            key={tx.id}
                            className="group hover:bg-slate-800/20 transition-colors cursor-pointer"
                            onClick={() =>
                              setSelectedTx(selectedTx === tx.id ? null : tx.id)
                            }
                          >
                            <td className="py-3 pl-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                    tx.type === "deposit"
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                      : tx.type === "withdrawal"
                                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                        : tx.type === "dividend"
                                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                          : tx.type === "commitment"
                                            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                            : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                                  }`}
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    {tx.type === "deposit" && (
                                      <path d="M12 5v14M5 12l7-7 7 7" />
                                    )}
                                    {tx.type === "withdrawal" && (
                                      <path d="M12 5v14M5 12l7 7 7-7" />
                                    )}
                                    {tx.type === "dividend" && (
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    )}
                                    {tx.type === "commitment" && (
                                      <>
                                        <rect
                                          x="3"
                                          y="11"
                                          width="18"
                                          height="11"
                                          rx="2"
                                        />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                      </>
                                    )}
                                    {tx.type === "tithe" && (
                                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    )}
                                    {tx.type === "reinvestment" && (
                                      <>
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                        <path d="M16 16h5v-5" />
                                      </>
                                    )}
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                    {tx.type === "dividend" ||
                                    tx.type === "commitment"
                                      ? tx.hallName
                                      : tx.type === "withdrawal"
                                        ? `To ${tx.destination}`
                                        : "Deposit"}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-mono">
                                    {tx.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <TypeBadge type={tx.type} />
                            </td>
                            <td className="py-3 text-center">
                              <StatusBadge status={tx.status} />
                            </td>
                            <td className="py-3 text-right">
                              <div
                                className={`text-sm font-mono font-bold ${["deposit", "dividend"].includes(tx.type) ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                {["deposit", "dividend"].includes(tx.type)
                                  ? "+"
                                  : "-"}
                                {formatMoneyPrecise(tx.amount)}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="text-[10px] font-mono text-slate-400">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-[9px] font-mono text-slate-600">
                                {new Date(tx.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <div className="text-[9px] font-mono text-slate-500">
                                {tx.txHash || "—"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredTx.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-900/20 flex items-center justify-center mx-auto mb-3">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-600"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">
                        No transactions match this filter
                      </p>
                    </div>
                  )}
                </div>
              </HologramCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
