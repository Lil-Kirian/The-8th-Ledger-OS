// app/(dashboard)/knot/page.tsx
"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Users, Link2, Copy, CheckCircle2, Trophy, TrendingUp,
  Crown, ArrowRight, Clock, ChevronRight, Target,
  Flame, Medal, Sparkles, UserPlus,
  Activity, MapPin, Diamond, Fingerprint, Eye, ShieldCheck, Lock,
  Radio, Network
} from "lucide-react";

/* ============================================================
   TYPES — 8th Ledger Aligned
   ============================================================ */
type KnotMember = {
  id: string;
  ledgerId: string;
  displayName: string;
  country: string;
  kycTier: "visitor" | "verified" | "sovereign" | "whale";
  joinedAt: string;
  totalCommitted: number;
  poolsWon: number;
  activeHalls: number;
  referrals: number;
  depth: number;
  status: "active" | "idle" | "churned";
};

type OracleLeader = {
  rank: number;
  ledgerId: string;
  displayName: string;
  country: string;
  correctForecasts: number;
  totalForecasts: number;
  accuracy: number;
  totalWon: number;
  streak: number;
  oracleTier: "novice" | "seer" | "oracle" | "prophet";
};

type ReferralReward = {
  id: string;
  date: string;
  fromMember: string;
  fromId: string;
  type: "commit" | "win" | "forge";
  amount: number;
  reward: number;
  status: "pending" | "paid";
};

type KnotStats = {
  directReferrals: number;
  networkDepth: number;
  totalNetwork: number;
  activeNetwork: number;
  totalRewards: number;
  pendingRewards: number;
  inviteCode: string;
  inviteLink: string;
  codeUses: number;
  codeMax: number;
};

/* ============================================================
   MOCK DATA — 8th Ledger, USD, No LED
   ============================================================ */
const KNOT_STATS: KnotStats = {
  directReferrals: 12,
  networkDepth: 3,
  totalNetwork: 47,
  activeNetwork: 38,
  totalRewards: 2840,
  pendingRewards: 450,
  inviteCode: "8L-8X2P-ALPHA",
  inviteLink: "https://8thledger.io/enter?ref=8L-8X2P-ALPHA",
  codeUses: 12,
  codeMax: 50,
};

const KNOT_MEMBERS: KnotMember[] = [
  { id: "m-001", ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "East Africa", kycTier: "sovereign", joinedAt: "2026-04-20T10:00:00Z", totalCommitted: 8500, poolsWon: 1, activeHalls: 3, referrals: 4, depth: 1, status: "active" },
  { id: "m-002", ledgerId: "LED-1P4Q-8L3N", displayName: "Sarah", country: "Western Europe", kycTier: "verified", joinedAt: "2026-04-22T14:30:00Z", totalCommitted: 3200, poolsWon: 0, activeHalls: 1, referrals: 2, depth: 1, status: "active" },
  { id: "m-003", ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "East Asia", kycTier: "whale", joinedAt: "2026-04-25T09:15:00Z", totalCommitted: 24000, poolsWon: 2, activeHalls: 5, referrals: 7, depth: 1, status: "active" },
  { id: "m-004", ledgerId: "LED-2V8W-1X4Y", displayName: "Maria", country: "South America", kycTier: "verified", joinedAt: "2026-05-01T11:00:00Z", totalCommitted: 1800, poolsWon: 0, activeHalls: 1, referrals: 0, depth: 2, status: "active" },
  { id: "m-005", ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "North America", kycTier: "sovereign", joinedAt: "2026-05-05T16:45:00Z", totalCommitted: 12000, poolsWon: 1, activeHalls: 2, referrals: 1, depth: 2, status: "active" },
  { id: "m-006", ledgerId: "LED-4D6E-7F8G", displayName: "Aisha", country: "Middle East", kycTier: "visitor", joinedAt: "2026-05-10T08:20:00Z", totalCommitted: 400, poolsWon: 0, activeHalls: 0, referrals: 0, depth: 2, status: "idle" },
  { id: "m-007", ledgerId: "LED-0H2I-3J4K", displayName: "Kofi", country: "West Africa", kycTier: "verified", joinedAt: "2026-05-12T13:10:00Z", totalCommitted: 2100, poolsWon: 0, activeHalls: 1, referrals: 1, depth: 3, status: "active" },
  { id: "m-008", ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "East Asia", kycTier: "whale", joinedAt: "2026-05-15T07:30:00Z", totalCommitted: 35000, poolsWon: 3, activeHalls: 6, referrals: 5, depth: 1, status: "active" },
];

const LEADERBOARD: OracleLeader[] = [
  { rank: 1, ledgerId: "LED-6L7M-8N9O", displayName: "Yuki", country: "East Asia", correctForecasts: 23, totalForecasts: 28, accuracy: 82.1, totalWon: 18400, streak: 7, oracleTier: "prophet" },
  { rank: 2, ledgerId: "LED-9R2S-5T6U", displayName: "Chen", country: "East Asia", correctForecasts: 19, totalForecasts: 25, accuracy: 76.0, totalWon: 15200, streak: 4, oracleTier: "prophet" },
  { rank: 3, ledgerId: "LED-3X9A-7K2M", displayName: "Alex", country: "East Africa", correctForecasts: 17, totalForecasts: 24, accuracy: 70.8, totalWon: 13600, streak: 3, oracleTier: "oracle" },
  { rank: 4, ledgerId: "LED-1P4Q-8L3N", displayName: "Sarah", country: "Western Europe", correctForecasts: 14, totalForecasts: 22, accuracy: 63.6, totalWon: 11200, streak: 2, oracleTier: "oracle" },
  { rank: 5, ledgerId: "LED-5Z1A-9B3C", displayName: "James", country: "North America", correctForecasts: 12, totalForecasts: 20, accuracy: 60.0, totalWon: 9600, streak: 1, oracleTier: "seer" },
  { rank: 6, ledgerId: "LED-2V8W-1X4Y", displayName: "Maria", country: "South America", correctForecasts: 10, totalForecasts: 18, accuracy: 55.6, totalWon: 8000, streak: 0, oracleTier: "seer" },
  { rank: 7, ledgerId: "LED-8X2P-9LQ3", displayName: "Sovereign", country: "East Africa", correctForecasts: 9, totalForecasts: 15, accuracy: 60.0, totalWon: 7200, streak: 2, oracleTier: "seer" },
];

const REWARDS: ReferralReward[] = [
  { id: "rew-001", date: "2026-05-20T10:00:00Z", fromMember: "Alex", fromId: "LED-3X9A-7K2M", type: "commit", amount: 1000, reward: 50, status: "paid" },
  { id: "rew-002", date: "2026-05-21T14:30:00Z", fromMember: "Chen", fromId: "LED-9R2S-5T6U", type: "win", amount: 12000, reward: 600, status: "paid" },
  { id: "rew-003", date: "2026-05-22T09:15:00Z", fromMember: "Yuki", fromId: "LED-6L7M-8N9O", type: "forge", amount: 400, reward: 20, status: "paid" },
  { id: "rew-004", date: "2026-05-23T11:00:00Z", fromMember: "James", fromId: "LED-5Z1A-9B3C", type: "commit", amount: 500, reward: 25, status: "pending" },
  { id: "rew-005", date: "2026-05-24T08:20:00Z", fromMember: "Sarah", fromId: "LED-1P4Q-8L3N", type: "commit", amount: 2000, reward: 100, status: "pending" },
];

/* ============================================================
   UTILITY
   ============================================================ */
function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const KYC_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; icon: React.ElementType }> = {
  visitor: { label: "VISITOR", color: "text-slate-400", border: "border-slate-500/30", bg: "bg-slate-500/10", icon: Lock },
  verified: { label: "VERIFIED", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", icon: ShieldCheck },
  sovereign: { label: "SOVEREIGN", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10", icon: Eye },
  whale: { label: "COUNCIL ELITE", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", icon: Crown },
};

const ORACLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  novice: { label: "NOVICE", color: "text-white/30", icon: Target },
  seer: { label: "SEER", color: "text-violet-400", icon: Sparkles },
  oracle: { label: "ORACLE", color: "text-cyan-400", icon: Eye },
  prophet: { label: "PROPHET", color: "text-amber-400", icon: Crown },
};

/* ============================================================
   PARTICLE FIELD — Background
   ============================================================ */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
    let anim: number;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${p.alpha})`;
        ctx.fill();
      });
      anim = requestAnimationFrame(draw);
    }
    draw();
    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    return () => { cancelAnimationFrame(anim); window.removeEventListener("resize", handleResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
}

/* ============================================================
   GLOW CARD — Holographic Container
   ============================================================ */
function GlowCard({ children, className = "", accent = "indigo" }: { children: React.ReactNode; className?: string; accent?: "indigo" | "cyan" | "amber" | "emerald" | "violet" | "slate" | "rose" }) {
  const accentMap = {
    indigo: "from-indigo-500/10 to-violet-500/10 border-indigo-500/20 shadow-indigo-500/5",
    cyan: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20 shadow-cyan-500/5",
    amber: "from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-amber-500/5",
    emerald: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-emerald-500/5",
    violet: "from-violet-500/10 to-purple-500/10 border-violet-500/20 shadow-violet-500/5",
    slate: "from-slate-500/10 to-gray-500/10 border-slate-500/20 shadow-slate-500/5",
    rose: "from-rose-500/10 to-red-500/10 border-rose-500/20 shadow-rose-500/5",
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] ${accentMap[accent]} ${className}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}

/* ============================================================
   STAT CARD
   ============================================================ */
function StatCard({ label, value, subtext, icon: Icon, color, delay }: { label: string; value: number; subtext: string; icon: React.ElementType; color: string; delay: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStarted(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value]);

  const isMoney = label.includes("Rewards") || label.includes("Value") || label.includes("Committed");

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <GlowCard accent={color.replace("text-", "") as unknown}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color} font-mono tabular-nums`}>
              {isMoney ? formatCurrency(display) : Math.round(display).toLocaleString()}
            </p>
            <p className="mt-0.5 text-[10px] text-white/20">{subtext}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-2">
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}

/* ============================================================
   INVITE CARD — Sovereign Recruitment
   ============================================================ */
function InviteCard({ stats }: { stats: KnotStats }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(stats.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [stats.inviteCode]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(stats.inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [stats.inviteLink]);

  return (
    <GlowCard accent="indigo" className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <Network className="h-4 w-4 text-indigo-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Sovereign Recruitment</span>
      </div>

      <h2 className="text-xl font-bold text-white tracking-tight">Expand Your Knot</h2>
      <p className="mt-1 text-xs text-white/30 leading-relaxed">
        Every sovereign you recruit who commits capital earns you a percentage of their activity.
        The Knot grows infinitely. The rewards compound forever.
      </p>

      <div className="mt-5">
        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-white/20 font-mono">Invite Code</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-sm text-indigo-300 tracking-wider">
            {stats.inviteCode}
          </div>
          <button onClick={copyCode} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/40 transition-all hover:bg-white/5 hover:text-white">
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-white/20 font-mono">{stats.codeUses} / {stats.codeMax} uses remaining</p>
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-white/20 font-mono">Direct Link</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/30 font-mono">
            {stats.inviteLink}
          </div>
          <button onClick={copyLink} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/40 transition-all hover:bg-white/5 hover:text-white">
            {copiedLink ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: "Commit", pct: "5%", desc: "Their pool commitment", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Win", pct: "2%", desc: "When they win a pool", color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Dividend", pct: "1%", desc: "Monthly dividend share", color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-white/20">{item.label}</p>
            <p className={`mt-1 text-lg font-bold ${item.color}`}>{item.pct}</p>
            <p className="text-[9px] text-white/20 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

/* ============================================================
   MEMBER ROW — Holographic
   ============================================================ */
function MemberRow({ member }: { member: KnotMember }) {
  const kyc = KYC_CONFIG[member.kycTier] || KYC_CONFIG.visitor;
  const KycIcon = kyc.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.03]"
    >
      {/* Holographic scan line */}
      <motion.div
        animate={{ top: ["-10%", "110%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none"
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10">
            <span className="text-sm font-bold text-indigo-300">{member.displayName.charAt(0)}</span>
            {member.status === "active" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#030308] bg-emerald-400" />
            )}
            {member.status === "idle" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#030308] bg-orange-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{member.displayName}</span>
              <span className={`flex items-center gap-1 rounded-md border ${kyc.border} ${kyc.bg} px-1.5 py-0.5 text-[9px] font-bold ${kyc.color}`}>
                <KycIcon className="h-2.5 w-2.5" />
                {kyc.label}
              </span>
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] text-white/20 border border-white/5">L{member.depth}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/20 font-mono">
              <MapPin className="h-3 w-3" />
              <span>{member.country}</span>
              <span>•</span>
              <span>{formatDate(member.joinedAt)}</span>
              <span>•</span>
              <span>{member.ledgerId}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-[10px] text-white/20">Committed</p>
            <p className="text-sm font-bold text-white font-mono">{formatCurrency(member.totalCommitted)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/20">Halls</p>
            <p className="text-sm font-bold text-cyan-300">{member.activeHalls}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/20">Wins</p>
            <p className="text-sm font-bold text-amber-300">{member.poolsWon}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/20">Refs</p>
            <p className="text-sm font-bold text-indigo-300">{member.referrals}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-white/30 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   LEADERBOARD ROW — Oracle Standings
   ============================================================ */
function LeaderRow({ leader, isMe }: { leader: OracleLeader; isMe: boolean }) {
  const orb = ORACLE_CONFIG[leader.oracleTier];
  const OrbIcon = orb.icon;

  const rankBadge = leader.rank === 1 ? (
    <Crown className="h-4 w-4 text-amber-400" />
  ) : leader.rank === 2 ? (
    <Medal className="h-4 w-4 text-slate-300" />
  ) : leader.rank === 3 ? (
    <Medal className="h-4 w-4 text-orange-400" />
  ) : (
    <span className="w-5 text-center text-xs font-bold text-white/20">{leader.rank}</span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: leader.rank * 0.05 }}
      className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-all ${isMe ? "border-cyan-500/20 bg-cyan-950/10" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}
    >
      <div className="flex w-6 items-center justify-center">{rankBadge}</div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10">
        <span className="text-xs font-bold text-indigo-300">{leader.displayName.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isMe ? "text-cyan-300" : "text-white"}`}>{leader.displayName}</span>
          {isMe && <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">YOU</span>}
          <span className={`flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold ${orb.color} border border-white/5`}>
            <OrbIcon className="h-2.5 w-2.5" />
            {orb.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/20">
          <MapPin className="h-3 w-3" />
          <span>{leader.country}</span>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-white/20">Accuracy</p>
        <p className="text-xs font-bold text-white font-mono">{leader.accuracy.toFixed(1)}%</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-white/20">Correct</p>
        <p className="text-xs font-bold text-emerald-400">{leader.correctForecasts}/{leader.totalForecasts}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] text-white/20">Streak</p>
        <div className="flex items-center justify-end gap-1">
          <Flame className="h-3 w-3 text-orange-400" />
          <span className="text-xs font-bold text-orange-400">{leader.streak}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-white/20">Standing</p>
        <p className="text-sm font-bold text-amber-300 font-mono">{formatCurrency(leader.totalWon)}</p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   REWARD ROW
   ============================================================ */
function RewardRow({ reward }: { reward: ReferralReward }) {
  const typeConfig = {
    commit: { label: "COMMIT", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    win: { label: "WIN", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    forge: { label: "FORGE", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  };
  const config = typeConfig[reward.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className={`rounded-md ${config.bg} ${config.color} ${config.border} px-2 py-1 text-[9px] font-bold border`}>
          {config.label}
        </span>
        <div>
          <p className="text-xs text-white">From <span className="font-semibold text-indigo-300">{reward.fromMember}</span></p>
          <p className="text-[10px] text-white/20 font-mono">{formatDate(reward.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-right">
          <p className="text-[10px] text-white/20">Their Activity</p>
          <p className="text-xs text-white/40 font-mono">{formatCurrency(reward.amount)}</p>
        </div>
        <ArrowRight className="h-3 w-3 text-white/10 hidden sm:block" />
        <div className="text-right">
          <p className="text-[10px] text-white/20">Your Reward</p>
          <p className={`text-sm font-bold ${reward.status === "paid" ? "text-emerald-400" : "text-amber-300"}`}>+{formatCurrency(reward.reward)}</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-[9px] font-bold border ${reward.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
          {reward.status === "paid" ? "PAID" : "PENDING"}
        </span>
      </div>
    </motion.div>
  );
}

/* ============================================================
   NETWORK VISUALIZATION — Concentric Rings
   ============================================================ */
function NetworkRings() {
  return (
    <GlowCard accent="violet">
      <h3 className="mb-5 text-sm font-bold text-white flex items-center gap-2">
        <Radio className="h-4 w-4 text-violet-400" />
        Network Topology
      </h3>
      <div className="relative h-48 flex items-center justify-center">
        {/* Center — You */}
        <div className="absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-amber-500/20 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <Fingerprint className="h-6 w-6 text-cyan-300" />
        </div>
        
        {/* Ring 1 — Direct */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute h-28 w-28 rounded-full border border-dashed border-indigo-500/20"
        />
        {[0, 90, 180, 270].map((deg, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="absolute h-4 w-4 rounded-full bg-indigo-500/30 border border-indigo-400/40"
            style={{
              transform: `rotate(${deg}deg) translate(56px) rotate(-${deg}deg)`,
            }}
          />
        ))}

        {/* Ring 2 — Extended */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute h-44 w-44 rounded-full border border-dotted border-violet-500/15"
        />
        {[30, 120, 210, 300].map((deg, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="absolute h-3 w-3 rounded-full bg-violet-500/20 border border-violet-400/30"
            style={{
              transform: `rotate(${deg}deg) translate(88px) rotate(-${deg}deg)`,
            }}
          />
        ))}

        {/* Ring 3 — Deep */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute h-56 w-56 rounded-full border border-slate-500/10"
        />

        {/* Labels */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] text-indigo-400 font-mono tracking-wider">LEVEL 1</div>
        <div className="absolute top-12 right-2 text-[9px] text-violet-400 font-mono tracking-wider">LEVEL 2</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 font-mono tracking-wider">LEVEL 3</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
          <p className="text-lg font-bold text-indigo-300">12</p>
          <p className="text-[9px] text-white/20">Level 1</p>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
          <p className="text-lg font-bold text-violet-300">23</p>
          <p className="text-[9px] text-white/20">Level 2</p>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2">
          <p className="text-lg font-bold text-slate-400">12</p>
          <p className="text-[9px] text-white/20">Level 3</p>
        </div>
      </div>
    </GlowCard>
  );
}

/* ============================================================
   MAIN PAGE — The Knot
   ============================================================ */
export default function KnotPage() {
  const [activeTab, setActiveTab] = useState<"network" | "leaderboard" | "rewards">("network");
  const [filterDepth, setFilterDepth] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const headerY = useTransform(scrollYProgress, [0, 0.05], [0, -20]);

  const filteredMembers = useMemo(() => {
    if (filterDepth === null) return KNOT_MEMBERS;
    return KNOT_MEMBERS.filter((m) => m.depth === filterDepth);
  }, [filterDepth]);

  const myRank = LEADERBOARD.find((l) => l.ledgerId === "LED-8X2P-9LQ3");

  return (
    <div className="relative min-h-screen bg-[#030308] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-100 overflow-x-hidden">
      <ParticleField />

      {/* Ambient glows */}
      <div className="fixed top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 pb-20">
        {/* Floating Header */}
        <motion.div style={{ opacity: headerOpacity, y: headerY }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-indigo-500/20 bg-indigo-500/10">
              <Diamond className="h-3 w-3 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              Sovereign Network
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            The Knot
          </h1>
          <p className="mt-1 text-sm text-white/30 max-w-lg">
            Every connection generates value. Your network is your leverage across the 8th Ledger.
            Real referrals. Real capital. Real rewards.
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Direct Referrals" value={KNOT_STATS.directReferrals} subtext="Level 1 in your Knot" icon={UserPlus} color="text-indigo-400" delay={0} />
          <StatCard label="Total Network" value={KNOT_STATS.totalNetwork} subtext={`${KNOT_STATS.activeNetwork} active sovereigns`} icon={Users} color="text-cyan-400" delay={0.05} />
          <StatCard label="Pending Rewards" value={KNOT_STATS.pendingRewards} subtext="Processing to wallet" icon={Clock} color="text-amber-400" delay={0.1} />
          <StatCard label="Network Value" value={KNOT_MEMBERS.reduce((a, m) => a + m.totalCommitted, 0)} subtext="Total capital committed by Knot" icon={TrendingUp} color="text-emerald-400" delay={0.15} />
        </div>

        {/* Invite + Topology */}
        <div className="grid gap-4 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2">
            <InviteCard stats={KNOT_STATS} />
          </div>
          <NetworkRings />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 mb-6">
          {[
            { id: "network" as const, label: "Network", count: KNOT_MEMBERS.length },
            { id: "leaderboard" as const, label: "Oracle", count: LEADERBOARD.length },
            { id: "rewards" as const, label: "Rewards", count: REWARDS.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? "text-white" : "text-white/20 hover:text-white/40"}`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="knot-tab"
                  className="absolute inset-0 rounded-lg bg-indigo-500/20 border border-indigo-500/30"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <span className={`relative z-10 rounded-md px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-white/20"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Network Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "network" && (
            <motion.div
              key="network"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Filter:</span>
                <button
                  onClick={() => setFilterDepth(null)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${filterDepth === null ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" : "bg-white/[0.02] text-white/30 border-white/10 hover:border-white/20"}`}
                >
                  All Levels
                </button>
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDepth(filterDepth === d ? null : d)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${filterDepth === d ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" : "bg-white/[0.02] text-white/30 border-white/10 hover:border-white/20"}`}
                  >
                    Level {d}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredMembers.map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </AnimatePresence>
              </div>
              {filteredMembers.length === 0 && (
                <GlowCard accent="slate" className="text-center py-12">
                  <Users className="mx-auto h-10 w-10 text-white/10 mb-3" />
                  <p className="text-sm text-white/30">No members at this level yet.</p>
                  <p className="text-[10px] text-white/20 mt-1">Share your invite code to grow your Knot.</p>
                </GlowCard>
              )}
            </motion.div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {myRank && (
                <GlowCard accent="cyan">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/20 ring-2 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                        <span className="text-xl font-bold text-cyan-300">#{myRank.rank}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Your Oracle Standing</h3>
                        <p className="text-xs text-white/30">{myRank.correctForecasts} correct of {myRank.totalForecasts} forecasts • {myRank.accuracy.toFixed(1)}% accuracy</p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <p className="text-lg font-bold text-white font-mono">{myRank.streak}</p>
                        <p className="text-[10px] text-white/20">Streak</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-300 font-mono">{formatCurrency(myRank.totalWon)}</p>
                        <p className="text-[10px] text-white/20">Standing</p>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              )}

              <div className="space-y-2">
                {LEADERBOARD.map((leader) => (
                  <LeaderRow key={leader.rank} leader={leader} isMe={leader.ledgerId === "LED-8X2P-9LQ3"} />
                ))}
              </div>

              <GlowCard accent="slate">
                <h3 className="mb-4 text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  How Oracle Works
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Target, title: "Predict the Winner", desc: "Before consensus, guess which country the winning pool will come from.", color: "text-indigo-400" },
                    { icon: Activity, title: "Dynamic Standing", desc: "Odds shift based on crowd predictions. Less popular picks earn higher standing.", color: "text-cyan-400" },
                    { icon: Trophy, title: "Climb the Ranks", desc: "Correct forecasts earn points. Streaks multiply. Seer → Oracle → Prophet.", color: "text-amber-400" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                      <item.icon className={`mb-2 h-5 w-5 ${item.color}`} />
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-[10px] text-white/20 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          )}

          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlowCard accent="emerald">
                  <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Total Paid</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">
                    {formatCurrency(REWARDS.filter((r) => r.status === "paid").reduce((a, r) => a + r.reward, 0))}
                  </p>
                </GlowCard>
                <GlowCard accent="amber">
                  <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Pending</p>
                  <p className="mt-1 text-2xl font-bold text-amber-300 font-mono">
                    {formatCurrency(REWARDS.filter((r) => r.status === "pending").reduce((a, r) => a + r.reward, 0))}
                  </p>
                </GlowCard>
                <GlowCard accent="cyan">
                  <p className="text-[10px] uppercase tracking-wider text-white/20 font-mono">Lifetime Referrals</p>
                  <p className="mt-1 text-2xl font-bold text-white font-mono">{KNOT_STATS.totalNetwork}</p>
                </GlowCard>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {REWARDS.map((reward) => (
                    <RewardRow key={reward.id} reward={reward} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-[10px] text-white/20 uppercase tracking-wider"
        >
          <Lock className="h-3 w-3" />
          <span>All data secured by the 8th Ledger Protocol • Encrypted • Immutable</span>
        </motion.div>
      </div>
    </div>
  );
}