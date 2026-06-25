"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BondingCurveChart } from "@/components/led-protocol/bonding-curve-chart";
import { ScarcityRing } from "@/components/led-protocol/scarcity-ring";
import { useAuth } from "@/hooks/use-auth";

// ───────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────
interface RoadmapPhase {
  phase: string;
  title: string;
  status: "complete" | "active" | "upcoming";
  description: string;
}

interface VoteStats {
  total: number;
  yes: number;
  no: number;
  yesPercent: number;
  noPercent: number;
  quorumPercent: number;
  threshold: number;
  minVoters: number;
  passed: boolean;
  status: string;
}

// ───────────────────────────────────────────
// MOCK DATA
// ───────────────────────────────────────────
const ROADMAP: RoadmapPhase[] = [
  {
    phase: "PHASE 01",
    title: "Internal Ledger",
    status: "complete",
    description: "LED operates as a closed-system proprietary credit unit. Non-transferable. Non-withdrawable. Powers the 8th Ledger ecosystem internally.",
  },
  {
    phase: "PHASE 02",
    title: "Scarcity Engine",
    status: "active",
    description: "Logarithmic bonding curve activated. 21M hard cap. Every deposit, dividend, and commitment mints LED at a rising floor price. Burn mechanics live.",
  },
  {
    phase: "PHASE 03",
    title: "Inter-Hall Liquidity",
    status: "upcoming",
    description: "LED becomes transferable across Halls. PAC holders can trade LED for ownership stakes. Internal marketplace opens. No external access yet.",
  },
  {
    phase: "PHASE 04",
    title: "Chain Migration",
    status: "upcoming",
    description: "LED migrates to its own Layer-1 blockchain. Wallet addresses, private keys, and on-chain verification. The ledger leaves the server.",
  },
  {
    phase: "PHASE 05",
    title: "Global Launch",
    status: "upcoming",
    description: "LED lists on tier-1 exchanges. Full crypto trading pairs. External wallets. The 8th Ledger becomes a sovereign financial protocol on the open market.",
  },
];

const SCARCITY_METRICS = [
  { label: "Hard Cap", value: 21_000_000, suffix: " LED", color: "cyan", icon: "◎" },
  { label: "Circulating", value: 1_240_000, suffix: " LED", color: "emerald", icon: "◈" },
  { label: "Burned", value: 89_340, suffix: " LED", color: "rose", icon: "▲" },
  { label: "Locked", value: 450_000, suffix: " LED", color: "amber", icon: "◉" },
  { label: "Floor Price", value: 20.0, suffix: " USD", color: "violet", icon: "◇" },
  { label: "Market Cap", value: 24_800_000, suffix: " USD", color: "slate", icon: "◊" },
];

// Deterministic particles (no hydration mismatch)
const PARTICLES = [
  { x: -54, y: 85, delay: 0, duration: 3.2 },
  { x: 180, y: -42, delay: 0.5, duration: 4.1 },
  { x: -85, y: -98, delay: 1.0, duration: 3.5 },
  { x: 109, y: 86, delay: 1.5, duration: 4.5 },
  { x: -134, y: -40, delay: 2.0, duration: 3.8 },
  { x: 80, y: 49, delay: 2.5, duration: 4.2 },
];

// ───────────────────────────────────────────
// UTILITIES
// ───────────────────────────────────────────
const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 2000 }: { value: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStarted(true); }, { threshold: 0.1 });
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
      {prefix}{display.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: value < 100 ? 2 : 0 })}{suffix}
    </span>
  );
};

// ───────────────────────────────────────────
// UI COMPONENTS
// ───────────────────────────────────────────
const HologramCard = ({ children, className = "", accent = "cyan" }: { children: React.ReactNode; className?: string; accent?: "cyan" | "amber" | "emerald" | "rose" | "violet" | "slate" }) => {
  const accentMap = {
    cyan: "from-cyan-500/[0.08] via-blue-500/[0.03] to-transparent border-cyan-500/20 shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)]",
    amber: "from-amber-500/[0.08] via-yellow-500/[0.03] to-transparent border-amber-500/20 shadow-[0_0_60px_-15px_rgba(245,158,11,0.2)]",
    emerald: "from-emerald-500/[0.08] via-teal-500/[0.03] to-transparent border-emerald-500/20 shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)]",
    rose: "from-rose-500/[0.08] via-red-500/[0.03] to-transparent border-rose-500/20 shadow-[0_0_60px_-15px_rgba(244,63,94,0.2)]",
    violet: "from-violet-500/[0.08] via-fuchsia-500/[0.03] to-transparent border-violet-500/20 shadow-[0_0_60px_-15px_rgba(139,92,246,0.2)]",
    slate: "from-slate-500/[0.06] via-slate-500/[0.02] to-transparent border-slate-500/15 shadow-[0_0_40px_-15px_rgba(100,116,139,0.1)]",
  };
  return (
    <div className={`relative group overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-2xl transition-all duration-500 hover:scale-[1.005] ${accentMap[accent]} ${className}`}>
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
    complete: { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400", label: "COMPLETE" },
    active: { cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", dot: "bg-cyan-400 animate-pulse", label: "LIVE" },
    upcoming: { cls: "bg-slate-500/10 text-slate-400 border-slate-500/30", dot: "bg-slate-400", label: "UPCOMING" },
  };
  const s = map[status] || map.upcoming;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-[0.15em] ${s.cls}`}>
      <span className={`w-1 h-1 rounded-full ${s.dot} shadow-[0_0_6px_currentColor]`} />
      {s.label}
    </span>
  );
};

// ───────────────────────────────────────────
// COMING SOON BLUR OVERLAY COMPONENT
// ───────────────────────────────────────────
function ComingSoonOverlay({ children, show = true }: { children: React.ReactNode; show?: boolean }) {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-20 rounded-2xl overflow-hidden"
          >
            {/* Blur backdrop */}
            <div className="absolute inset-0 bg-[#020205]/60 backdrop-blur-md" />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* Large blurred SOON text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 
                className="text-[6rem] md:text-[10rem] font-black tracking-tighter text-transparent select-none"
                style={{ 
                  WebkitTextStroke: '2px rgba(6,182,212,0.12)',
                  textShadow: '0 0 60px rgba(6,182,212,0.08)',
                  filter: 'blur(4px)'
                }}
              >
                SOON
              </h1>
            </div>

            {/* Info card */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative z-30 mx-4"
              >
                <div className="rounded-2xl border border-cyan-500/20 bg-[#08080f]/90 backdrop-blur-xl px-8 py-6 shadow-[0_0_60px_-15px_rgba(6,182,212,0.15)] max-w-sm text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="relative">
                      <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                      <div className="absolute inset-0 h-2 w-2 rounded-full bg-amber-400 animate-ping opacity-40" />
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.3em]">Community Vote Pending</span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                    Voting Opens Soon
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    The LED Global Launch vote will activate when Phase 03 reaches <span className="text-cyan-400 font-mono">10,000</span> active holders.
                  </p>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "28%" }}
                        transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 whitespace-nowrap">28% QUORUM</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="text-lg font-bold text-white font-mono">2,847</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider">Holders</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="text-lg font-bold text-amber-400 font-mono">10,000</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider">Required</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="text-lg font-bold text-emerald-400 font-mono">7,153</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider">Remaining</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────────────────────────
// VOTE SECTION (BLURRED OUT)
// ───────────────────────────────────────────
function VoteSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<VoteStats>({
    total: 2847, yes: 1907, no: 940, yesPercent: 67, noPercent: 33,
    quorumPercent: 28, threshold: 51, minVoters: 10000, passed: false, status: "gathering",
  });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVote = useCallback(async () => {
    try {
      const res = await fetch("/api/led-protocol/vote");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setUserVote(data.userVote?.vote || null);
      }
    } catch (err) {
      console.error("[VOTE FETCH]", err);
    }
  }, []);

  useEffect(() => {
    fetchVote();
  }, [fetchVote]);

  const castVote = async (vote: "yes" | "no") => {
    if (!user) { setError("Authenticate to vote"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/led-protocol/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setUserVote(vote);
      } else {
        setError(data.error || "Vote failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const withdrawVote = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/led-protocol/vote", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setUserVote(null);
      }
    } catch (err) {
      setError("Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <HologramCard accent="violet">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-amber-400 animate-ping opacity-40" />
              </div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.3em]">Community Governance</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">LED Global Launch Vote</h3>
            <p className="text-sm text-slate-400 mt-1">Should LED transition to a public blockchain at Phase 03?</p>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-2xl font-bold text-white font-mono">{stats.total.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Voters</div>
          </div>
        </div>

        {/* Vote Tally Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">YES {stats.yesPercent}%</span>
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">NO {stats.noPercent}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.yesPercent}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.noPercent}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-mono text-emerald-400">{stats.yes.toLocaleString()} YES</span>
            <span className="text-[10px] font-mono text-slate-500">Threshold: {stats.threshold}%</span>
            <span className="text-[10px] font-mono text-rose-400">{stats.no.toLocaleString()} NO</span>
          </div>
        </div>

        {/* Quorum Progress */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900/30 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Quorum Progress</span>
            <span className="text-xs font-mono text-cyan-400">{stats.quorumPercent}% / 100%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.quorumPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            {stats.minVoters.toLocaleString()} voters required for quorum. Currently {stats.total.toLocaleString()}.
          </p>
        </div>

        {/* Vote Buttons */}
        {!user ? (
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-center">
            <p className="text-sm text-slate-400">Authenticate to cast your vote</p>
          </div>
        ) : userVote ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  userVote === "yes" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                }`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {userVote === "yes" ? <path d="M20 6L9 17l-5-5"/> : <path d="M18 6L6 18M6 6l12 12"/>}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">You voted <span className={userVote === "yes" ? "text-emerald-400" : "text-rose-400"}>{userVote.toUpperCase()}</span></p>
                  <p className="text-[10px] text-slate-500 font-mono">Vote recorded on ledger</p>
                </div>
              </div>
              <button
                onClick={withdrawVote}
                disabled={loading}
                className="text-[10px] font-mono text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-wider"
              >
                Withdraw
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => castVote("yes")}
                disabled={loading || userVote === "yes"}
                className={`flex-1 py-3 rounded-xl border font-bold text-sm uppercase tracking-wider transition-all ${
                  userVote === "yes"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400/60 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                }`}
              >
                Change to YES
              </button>
              <button
                onClick={() => castVote("no")}
                disabled={loading || userVote === "no"}
                className={`flex-1 py-3 rounded-xl border font-bold text-sm uppercase tracking-wider transition-all ${
                  userVote === "no"
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                    : "bg-rose-500/5 border-rose-500/20 text-rose-400/60 hover:bg-rose-500/10 hover:border-rose-500/30"
                }`}
              >
                Change to NO
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => castVote("yes")}
              disabled={loading}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm uppercase tracking-wider hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Vote YES
                </span>
              )}
            </button>
            <button
              onClick={() => castVote("no")}
              disabled={loading}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-sm uppercase tracking-wider hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Vote NO
                </span>
              )}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-[10px] text-rose-400 font-mono text-center">{error}</p>
        )}
      </div>
    </HologramCard>
  );
}

// ───────────────────────────────────────────
// MAIN PAGE
// ───────────────────────────────────────────
export default function LedProtocolPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showVoteSoon, setShowVoteSoon] = useState(true);

  const handleNotify = () => {
    if (!email || !email.includes("@")) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">
      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-cyan-500/[0.03] rounded-full blur-[180px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-amber-500/[0.03] rounded-full blur-[180px] animate-pulse-slow" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-violet-500/[0.02] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.04),_transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-10">
        {/* ─── HERO ─── */}
        <header className="text-center mb-16 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 mb-6"
          >
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-cyan-400 animate-ping opacity-30" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.3em]">Protocol Genesis</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent mb-4"
          >
            LED<span className="text-cyan-400">.</span>PROTOCOL
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-light mb-8"
          >
            The 8th Ledger is building its own sovereign cryptocurrency. 
            LED is currently an internal scarcity engine. Soon, it becomes a global tradable asset.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <div className="relative w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for early access"
                className="w-full sm:w-80 rounded-xl border border-slate-700 bg-slate-900/40 px-5 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 font-mono transition-colors"
              />
            </div>
            <button
              onClick={handleNotify}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
            >
              {submitted ? (
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  Whitelisted
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Secure Whitelist Spot
                </span>
              )}
            </button>
          </motion.div>

          <AnimatePresence>
            {submitted && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm text-emerald-400 font-mono"
              >
                You have been added to the LED Genesis whitelist. We will contact you when Phase 04 begins.
              </motion.p>
            )}
          </AnimatePresence>
        </header>

        {/* ─── SCARCITY METRICS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-16">
          {SCARCITY_METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <HologramCard accent={metric.color as any} className="h-full">
                <div className="p-5 text-center">
                  <div className="text-2xl mb-2">{metric.icon}</div>
                  <div className="text-xl font-bold text-white font-mono mb-1">
                    <AnimatedCounter value={metric.value} prefix={metric.label === "Floor Price" || metric.label === "Market Cap" ? "$" : ""} />
                    {metric.label === "Floor Price" && <span className="text-sm">{metric.suffix}</span>}
                    {metric.label !== "Floor Price" && <span className="text-sm">{metric.suffix}</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">{metric.label}</div>
                </div>
              </HologramCard>
            </motion.div>
          ))}
        </div>

        {/* ─── BONDING CURVE + SCARCITY RING ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          <HologramCard className="lg:col-span-2" accent="cyan">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Scarcity Engine Preview</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">Logarithmic bonding curve — price rises as supply approaches 21M</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 border border-cyan-500/20">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider">Live Simulation</span>
                </div>
              </div>
              <BondingCurveChart currentSupply={1_240_000} currentPrice={20.0} />
              <div className="flex justify-between mt-4 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                  Current Position: 1.24M LED @ $20.00
                </span>
                <span className="text-cyan-400">Max theoretical: ~$85.00/LED</span>
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="violet">
            <div className="p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-white tracking-tight mb-1">Supply Distribution</h3>
              <p className="text-[10px] text-slate-400 mb-4 font-mono uppercase tracking-wider">LED scarcity visualization</p>
              <ScarcityRing
                circulating={1_240_000}
                max={21_000_000}
                burned={89_340}
                locked={450_000}
              />
              <div className="mt-4 w-full space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">Max Supply</span>
                  <span className="font-mono text-white/60">{formatNumber(21_000_000)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">Remaining to Mine</span>
                  <span className="font-mono text-amber-300">{formatNumber(21_000_000 - 1_240_000 - 89_340 - 450_000)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">Burned Forever</span>
                  <span className="font-mono text-rose-400">{formatNumber(89_340)}</span>
                </div>
              </div>
            </div>
          </HologramCard>
        </div>

        {/* ─── COMMUNITY VOTE SECTION (WITH COMING SOON OVERLAY) ─── */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Sovereign Vote</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">The community decides when LED becomes a global cryptocurrency. Your vote is recorded on the ledger.</p>
          </div>

          {/* Vote card wrapped in Coming Soon overlay */}
          <ComingSoonOverlay show={showVoteSoon}>
            <VoteSection />
          </ComingSoonOverlay>

          {/* Dismiss button */}
          <div className="text-center mt-4">
            <button
              onClick={() => setShowVoteSoon(!showVoteSoon)}
              className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-wider"
            >
              {showVoteSoon ? "Preview Vote Interface ↓" : "Hide Vote Interface ↑"}
            </button>
          </div>
        </div>

        {/* ─── WHY LED + DISTRIBUTION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          <HologramCard accent="amber">
            <div className="p-5">
              <h3 className="text-sm font-bold text-white tracking-tight mb-1">Why LED?</h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-4">The 8th Ledger currency thesis</p>
              <div className="space-y-3">
                {[
                  { label: "Hard Cap", value: "21,000,000", desc: "Bitcoin-level scarcity. No inflation." },
                  { label: "Utility-First", value: "100%", desc: "Every LED is backed by real asset ownership." },
                  { label: "Burn Mechanics", value: "Active", desc: "Protocol fees permanently destroy LED." },
                  { label: "Governance", value: "Future", desc: "LED holders vote on protocol upgrades." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/50">
                    <div className="w-1 h-full min-h-[24px] rounded-full bg-gradient-to-b from-amber-500 to-yellow-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.label}</span>
                        <span className="text-[10px] font-mono text-amber-400">{item.value}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="emerald">
            <div className="p-5">
              <h3 className="text-sm font-bold text-white tracking-tight mb-1">Current LED Holders</h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-4">Internal distribution</p>
              <div className="space-y-2">
                {[
                  { label: "Dividend Recipients", pct: 45, color: "bg-emerald-500" },
                  { label: "Pool Commitments", pct: 30, color: "bg-cyan-500" },
                  { label: "Referral Rewards", pct: 15, color: "bg-amber-500" },
                  { label: "Protocol Reserve", pct: 10, color: "bg-violet-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400">{item.label}</span>
                      <span className="text-[10px] font-mono text-white">{item.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1, delay: i * 0.2 }} className={`h-full rounded-full ${item.color} shadow-[0_0_6px_currentColor]`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </HologramCard>
        </div>

        {/* ─── ROADMAP ─── */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Protocol Roadmap</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">From internal credit to global cryptocurrency. Five phases. One sovereign ledger.</p>
          </div>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-slate-700 to-slate-800 md:-translate-x-px" />

            <div className="space-y-8">
              {ROADMAP.map((phase, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={phase.phase}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                    className={`relative flex items-start gap-6 md:gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
                  >
                    <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 z-10">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        phase.status === "complete" ? "bg-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" :
                        phase.status === "active" ? "bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse" :
                        "bg-slate-800 border-slate-600"
                      }`} />
                    </div>

                    <div className="hidden md:block md:w-1/2" />

                    <div className={`ml-10 md:ml-0 md:w-1/2 ${isLeft ? "md:pr-12" : "md:pl-12"}`}>
                      <HologramCard
                        accent={phase.status === "complete" ? "emerald" : phase.status === "active" ? "cyan" : "slate"}
                        className={phase.status === "upcoming" ? "opacity-70" : ""}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{phase.phase}</span>
                              <StatusBadge status={phase.status} />
                            </div>
                            {phase.status === "active" && (
                              <span className="text-[10px] font-mono text-cyan-400 animate-pulse">● CURRENT</span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">{phase.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed">{phase.description}</p>
                        </div>
                      </HologramCard>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── COMPARISON ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <HologramCard accent="slate">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Current State</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Internal Proprietary System</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "LED is a server-side credit unit",
                  "Non-transferable outside the platform",
                  "Acquired via deposits, dividends, commitments",
                  "No external wallet support",
                  "Value pegged to USD internally",
                  "Controlled by 8th Ledger protocol rules",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="text-slate-600">—</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </HologramCard>

          <HologramCard accent="cyan">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Future State</h3>
                  <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Global Cryptocurrency</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "LED becomes a Layer-1 blockchain asset",
                  "Transferable to any external wallet",
                  "Tradable on tier-1 exchanges globally",
                  "Own private keys, own your LED",
                  "Market-driven price discovery",
                  "Governance rights for LED holders",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-cyan-400">+</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </HologramCard>
        </div>

        {/* ─── FOOTER CTA ─── */}
        <div className="text-center pb-10">
          <HologramCard accent="violet" className="max-w-2xl mx-auto">
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🜛</div>
              <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Join the Genesis List</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Early adopters receive priority access, reduced protocol fees for 12 months, and a genesis LED allocation when the chain launches.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 font-mono transition-colors"
                />
                <button
                  onClick={handleNotify}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
                >
                  {submitted ? "Whitelisted ✓" : "Reserve Genesis Spot"}
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-4 font-mono">No spam. One email when Phase 04 begins. Unsubscribe anytime.</p>
            </div>
          </HologramCard>
        </div>
      </div>

      {/* ─── SUBTLE GLOBAL SOON WATERMARK ─── */}
      <div className="fixed inset-0 z-[40] pointer-events-none flex items-center justify-center">
        <div className="absolute inset-0 bg-[#020205]/10 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.008)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
          className="relative flex flex-col items-center"
        >
          <h1 
            className="text-[4rem] md:text-[8rem] lg:text-[12rem] font-black tracking-tighter text-transparent select-none"
            style={{ 
              WebkitTextStroke: '1px rgba(6,182,212,0.06)',
              textShadow: '0 0 40px rgba(6,182,212,0.03)',
              filter: 'blur(1px)'
            }}
          >
            SOON
          </h1>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-cyan-400/10"
                initial={{ x: p.x, y: p.y, opacity: 0 }}
                animate={{ y: p.y - 80, opacity: [0, 0.3, 0] }}
                transition={{ 
                  duration: p.duration, 
                  repeat: Infinity, 
                  delay: p.delay,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}