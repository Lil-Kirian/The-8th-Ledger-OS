"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, Wallet, Zap, Shield,
  Bell, ArrowDownRight, Clock, Globe, Crown,
  Flame, Target, Activity, Layers,
  ChevronRight, Plus, Eye, EyeOff, MessageSquare,
  Gavel, CheckCircle2,
  MapPin, Package, Plane, Car, Home, GraduationCap,
  HeartPulse, Briefcase, Cpu, Sun, Leaf, Lock,
  Sparkles, Diamond, ArrowRight, Coins,
  Receipt, Banknote, Timer, ShieldCheck, Landmark as BuildingIcon, ArrowUpFromLine,
  CircleArrowRight, Swords
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ============================================================
   TYPES
   ============================================================ */
interface Pool {
  id: string;
  poolId: string;
  name: string;
  verticalId: string;
  assetValue: number;
  target: number;
  committed: number;
  participants: number;
  maxParticipants: number;
  status: string;
  country: string;
  emojiSet: string;
  trueCost?: number;
  listedPrice?: number;
  closesAt: string;
  imageUrl?: string;
  description?: string;
}

interface Hall {
  id: string;
  name: string;
  status: string;
  pool: { name: string; verticalId: string };
  _count: { messages: number; proposals: number };
}

interface Position {
  poolId: string;
  poolName: string;
  verticalId: string;
  amountCommitted: number;
  ownershipPercent: number;
  pacToken: string;
  monthlyDividendEstimate: number;
  totalReturned: number;
  status: "commitment" | "pac" | "for_sale";
  hallId?: string;
  assetImage?: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  date: string;
  status?: string;
}

/* ============================================================
   VERTICAL META — 8th Ledger Verticals
   ============================================================ */
const VERTICAL_META: Record<string, { label: string; color: string; icon: React.ElementType; emoji: string; gradient: string }> = {
  ledgerprop:   { label: "LedgerProp",   color: "text-amber-400",  icon: Home,             emoji: "🏛", gradient: "from-amber-500/20 to-orange-500/10" },
  ledgerauto:   { label: "LedgerAuto",   color: "text-cyan-400",   icon: Car,              emoji: "🚗", gradient: "from-cyan-500/20 to-blue-500/10" },
  ledgeredu:    { label: "LedgerEdu",    color: "text-violet-400", icon: GraduationCap,    emoji: "🎓", gradient: "from-violet-500/20 to-purple-500/10" },
  ledgeraccess: { label: "LedgerAccess", color: "text-emerald-400", icon: ShieldCheck,     emoji: "🔧", gradient: "from-emerald-500/20 to-teal-500/10" },
  ledgerhealth: { label: "LedgerHealth", color: "text-rose-400",   icon: HeartPulse,       emoji: "🏥", gradient: "from-rose-500/20 to-red-500/10" },
  ledgerbiz:    { label: "LedgerBiz",    color: "text-orange-400", icon: Briefcase,        emoji: "💼", gradient: "from-orange-500/20 to-amber-500/10" },
  ledgertech:   { label: "LedgerTech",   color: "text-indigo-400", icon: Cpu,              emoji: "💻", gradient: "from-indigo-500/20 to-blue-500/10" },
  ledgertravel: { label: "LedgerTravel", color: "text-sky-400",   icon: Plane,            emoji: "✈️", gradient: "from-sky-500/20 to-cyan-500/10" },
  ledgeragri:   { label: "LedgerAgri",   color: "text-green-400",  icon: Leaf,             emoji: "🌿", gradient: "from-green-500/20 to-emerald-500/10" },
  ledgerenergy: { label: "LedgerEnergy", color: "text-yellow-400", icon: Sun,              emoji: "⚡", gradient: "from-yellow-500/20 to-amber-500/10" },
  ledgersport:  { label: "LedgerSport",  color: "text-rose-400",   icon: Swords,           emoji: "⚽", gradient: "from-rose-500/20 to-pink-500/10" },
};

/* ============================================================
   UTILS
   ============================================================ */
const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatNumber = (n: number) => n.toLocaleString();

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/* ============================================================
   ANIMATED COUNTER — FIXED (no double $$)
   ============================================================ */
function AnimatedCounter({ value, prefix = "", suffix = "", duration = 1500, decimals = 0 }: { 
  value: number; prefix?: string; suffix?: string; duration?: number; decimals?: number;
}) {
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  const formatted = decimals > 0 
    ? display.toFixed(decimals) 
    : display >= 1000 
      ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(display) 
      : Math.floor(display).toLocaleString();

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}{formatted}{suffix}
    </span>
  );
}

/* ============================================================
   GLOW CARD
   ============================================================ */
function GlowCard({ children, className = "", accent = "cyan", hover = true }: { 
  children: React.ReactNode; className?: string; accent?: string; hover?: boolean;
}) {
  const accentMap: Record<string, string> = {
    cyan: "from-cyan-500/10 to-blue-500/5 border-cyan-500/15 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)]",
    amber: "from-amber-500/10 to-yellow-500/5 border-amber-500/15 hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]",
    emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-500/15 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]",
    violet: "from-violet-500/10 to-purple-500/5 border-violet-500/15 hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]",
    rose: "from-rose-500/10 to-red-500/5 border-rose-500/15 hover:border-rose-500/30 hover:shadow-[0_0_30px_rgba(244,63,94,0.08)]",
    slate: "from-white/5 to-white/[0.02] border-white/10 hover:border-white/20",
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-500 ${hover ? "hover:scale-[1.01]" : ""} ${accentMap[accent] || accentMap.slate} ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />
      <div className="relative z-10 p-5">{children}</div>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */
function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const map: Record<string, { bg: string; text: string; border: string; label: string }> = {
    commitment: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Commitment" },
    pac: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "PAC" },
    for_sale: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", label: "Listed" },
    filling: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Filling" },
    filled: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", label: "Filled" },
    live: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Live" },
    ghost: { bg: "bg-white/5", text: "text-white/30", border: "border-white/10", label: "Ghost" },
    mature: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", label: "Mature" },
    active: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Active" },
    pending: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Pending" },
    won: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Won" },
    lost: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", label: "Lost" },
  };
  const s = map[status] || map.pending;
  const sz = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`rounded-full font-bold uppercase tracking-wider border ${sz} ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

/* ============================================================
   COMMITMENT → PAC PROGRESS INDICATOR
   ============================================================ */
function LifecycleBadge({ status, fillPercent }: { status: string; fillPercent: number }) {
  if (status === "pac" || status === "for_sale") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">PAC Active</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
        />
      </div>
      <span className="text-[10px] font-mono text-amber-400">{Math.round(fillPercent)}% → Ownership</span>
    </div>
  );
}

/* ============================================================
   FOREX-STYLE AREA CHART
   ============================================================ */
function AreaChart({ data, color = "#06b6d4", height = 230 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 900;
  const padding = { top: 20, right: 90, bottom: 25, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const getY = (v: number) => padding.top + chartHeight - ((v - min) / range) * chartHeight;

  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const areaPath = `M${getX(0)},${padding.top + chartHeight} ${data.map((v, i) => `L${getX(i)},${getY(v)}`).join(" ")} L${getX(data.length - 1)},${padding.top + chartHeight} Z`;

  const startValue = data[0];
  const endValue = data[data.length - 1];
  const change = endValue - startValue;
  const changePct = ((change / startValue) * 100).toFixed(2);
  const isPositive = change >= 0;

  // Grid lines
  const gridCount = 5;
  const gridValues = Array.from({ length: gridCount + 1 }, (_, i) => max - (i / gridCount) * range);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="40%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${color.replace("#", "")}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`lineGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Background grid - horizontal */}
      {gridValues.map((val, i) => {
        const y = padding.top + (i / gridCount) * chartHeight;
        return (
          <g key={`h${i}`}>
            <line 
              x1={padding.left} y1={y} 
              x2={width - padding.right} y2={y} 
              stroke="rgba(255,255,255,0.04)" 
              strokeWidth="1" 
              strokeDasharray={i === gridCount ? "0" : "4,6"} 
            />
            <text 
              x={width - padding.right + 10} 
              y={y + 4} 
              fill="rgba(255,255,255,0.25)" 
              fontSize="10" 
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" 
              textAnchor="start"
            >
              {formatMoney(val)}
            </text>
          </g>
        );
      })}

      {/* Vertical grid lines */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = padding.left + (i / 6) * chartWidth;
        return (
          <line 
            key={`v${i}`} 
            x1={x} y1={padding.top} 
            x2={x} y2={padding.top + chartHeight} 
            stroke="rgba(255,255,255,0.03)" 
            strokeWidth="1" 
          />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />

      {/* Main line */}
      <polyline 
        points={points} 
        fill="none" 
        stroke={`url(#lineGrad-${color.replace("#", "")})`} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        filter={`url(#glow-${color.replace("#", "")})`} 
      />

      {/* Current price horizontal line */}
      <line 
        x1={padding.left} 
        y1={getY(endValue)} 
        x2={width - padding.right} 
        y2={getY(endValue)} 
        stroke={isPositive ? "#10b981" : "#f43f5e"} 
        strokeWidth="1" 
        strokeDasharray="6,4" 
        opacity="0.4" 
      />

      {/* Current price badge on right */}
      <g>
        <rect 
          x={width - padding.right + 6} 
          y={getY(endValue) - 11} 
          width="74" 
          height="22" 
          rx="5" 
          fill={isPositive ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)"} 
          stroke={isPositive ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"} 
          strokeWidth="1" 
        />
        <text 
          x={width - padding.right + 43} 
          y={getY(endValue) + 4} 
          fill={isPositive ? "#10b981" : "#f43f5e"} 
          fontSize="10" 
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" 
          fontWeight="bold" 
          textAnchor="middle"
        >
          {isPositive ? "+" : ""}{changePct}%
        </text>
      </g>

      {/* Data points */}
      {data.map((v, i) => {
        const x = getX(i);
        const y = getY(v);
        const isLast = i === data.length - 1;
        const isFirst = i === 0;
        return (
          <g key={i}>
            {!isLast && !isFirst && (
              <circle cx={x} cy={y} r="2" fill="#0a0a14" stroke={color} strokeWidth="1.5" opacity="0.6" />
            )}
            {isLast && (
              <>
                <circle cx={x} cy={y} r="5" fill={color} filter={`url(#glow-${color.replace("#", "")})`} />
                <circle cx={x} cy={y} r="14" fill="none" stroke={color} strokeWidth="1" opacity="0.2">
                  <animate attributeName="r" values="8;18;8" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <text 
                  x={x} 
                  y={y - 16} 
                  textAnchor="middle" 
                  fill="#fff" 
                  fontSize="11" 
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" 
                  fontWeight="bold"
                >
                  {formatMoney(v)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Time axis labels */}
      {["30d", "24d", "18d", "12d", "6d", "Now"].map((label, i) => (
        <text 
          key={label} 
          x={padding.left + (i / 5) * chartWidth} 
          y={height - 4} 
          textAnchor="middle" 
          fill="rgba(255,255,255,0.15)" 
          fontSize="9" 
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [pools, setPools] = useState<Pool[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<"1W" | "1M" | "3M" | "1Y" | "ALL">("1M");

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/enter");
  }, [isLoading, isAuthenticated, router]);

  // Fetch all data
  useEffect(() => {
    async function loadData() {
      try {
        const [poolsRes, hallsRes, positionsRes, notifRes, activityRes] = await Promise.all([
          fetch("/api/pools").catch(() => null),
          fetch("/api/halls").catch(() => null),
          fetch("/api/positions").catch(() => null),
          fetch("/api/notifications").catch(() => null),
          fetch("/api/activity").catch(() => null),
        ]);

        if (poolsRes?.ok) {
          const d = await poolsRes.json();
          setPools(d.pools || []);
        } else {
          setPools([
            { 
              id: "1", poolId: "POOL-LEDGERPROP-001", name: "Sovereign Heights — Miami Waterfront", 
              verticalId: "ledgerprop", assetValue: 350000, target: 700000, 
              committed: 420000, participants: 84, maxParticipants: 200, 
              status: "filling", country: "United States", emojiSet: "🏛🌊🌴🔑⚡", 
              closesAt: "2026-12-31",
              imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
              description: "Premium waterfront estate. 4-bed, 5-bath, 600sqm. Pool, gym, smart home."
            },
            { 
              id: "2", poolId: "POOL-LEDGERPROP-002", name: "The Apex Tower — Dubai Marina", 
              verticalId: "ledgerprop", assetValue: 850000, target: 1700000, 
              committed: 1700000, participants: 156, maxParticipants: 300, 
              status: "filled", country: "UAE", emojiSet: "🏛🏙️💎🌃⚡", 
              closesAt: "2026-11-15",
              imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
              description: "Luxury penthouse suite. Full marina view. 24/7 concierge."
            },
            { 
              id: "3", poolId: "POOL-LEDGERPROP-003", name: "Greenleaf Villas — Lisbon", 
              verticalId: "ledgerprop", assetValue: 180000, target: 360000, 
              committed: 89000, participants: 23, maxParticipants: 100, 
              status: "filling", country: "Portugal", emojiSet: "🏛🌿🏡🌳⚡", 
              closesAt: "2027-01-30",
              imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
              description: "Eco-friendly villa complex. Solar powered. Community garden."
            },
          ]);
        }

        if (hallsRes?.ok) {
          const d = await hallsRes.json();
          setHalls(d.halls || []);
        } else {
          setHalls([
            { id: "h1", name: "Sovereign Heights Parliament", status: "live", pool: { name: "Sovereign Heights", verticalId: "ledgerprop" }, _count: { messages: 24, proposals: 3 } },
            { id: "h2", name: "The Apex Council", status: "mature", pool: { name: "The Apex Tower", verticalId: "ledgerprop" }, _count: { messages: 89, proposals: 12 } },
          ]);
        }

        if (positionsRes?.ok) {
          const d = await positionsRes.json();
          setPositions(d.positions || []);
        } else {
          setPositions([
            { poolId: "POOL-LEDGERPROP-001", poolName: "Sovereign Heights — Miami", verticalId: "ledgerprop", amountCommitted: 5000, ownershipPercent: 0.71, pacToken: "PAC-LEDGERPROP-001-7A2B", monthlyDividendEstimate: 0, totalReturned: 0, status: "commitment", hallId: undefined, assetImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400" },
            { poolId: "POOL-LEDGERPROP-002", poolName: "The Apex Tower — Dubai", verticalId: "ledgerprop", amountCommitted: 12000, ownershipPercent: 0.71, pacToken: "PAC-LEDGERPROP-002-9K3M", monthlyDividendEstimate: 340, totalReturned: 1020, status: "pac", hallId: "h2", assetImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
            { poolId: "POOL-LEDGERPROP-002", poolName: "The Apex Tower — Dubai", verticalId: "ledgerprop", amountCommitted: 5000, ownershipPercent: 0.29, pacToken: "PAC-LEDGERPROP-002-4P8Q", monthlyDividendEstimate: 140, totalReturned: 420, status: "for_sale", hallId: "h2", assetImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400" },
          ]);
        }

        if (notifRes?.ok) {
          const d = await notifRes.json();
          setNotifications(d.notifications || []);
        } else {
          setNotifications([
            { id: "n1", type: "dividend", title: "Dividend Distributed", message: "$340.00 from The Apex Tower — April 2026", read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), actionUrl: "/dividends" },
            { id: "n2", type: "proposal", title: "Governance Vote Required", message: "Proposal #12: Increase monthly rent to $5,200", read: false, createdAt: new Date(Date.now() - 7200000).toISOString(), actionUrl: "/halls/h2/proposals" },
            { id: "n3", type: "commitment", title: "Pool Milestone", message: "Sovereign Heights reached 60% — 40% to ownership conversion", read: false, createdAt: new Date(Date.now() - 18000000).toISOString(), actionUrl: "/pools/POOL-LEDGERPROP-001" },
            { id: "n4", type: "system", title: "Hall Activated", message: "The Apex Council is now LIVE. Enter to vote.", read: true, createdAt: new Date(Date.now() - 86400000).toISOString(), actionUrl: "/halls/h2" },
          ]);
        }

        if (activityRes?.ok) {
          const d = await activityRes.json();
          setActivities(d.activities || []);
        } else {
          setActivities([
            { id: "a1", type: "commit", title: "Pool Commitment", description: "Committed $5,000 to Sovereign Heights — Miami Waterfront", amount: 5000, date: new Date(Date.now() - 86400000).toISOString(), status: "commitment" },
            { id: "a2", type: "convert", title: "Commitment → Ownership", description: "The Apex Tower filled. Your commitment converted to ownership. Hall unlocked.", amount: 12000, date: new Date(Date.now() - 604800000).toISOString(), status: "pac" },
            { id: "a3", type: "dividend", title: "Monthly Dividend", description: "The Apex Tower — March 2026 distribution", amount: 340, date: new Date(Date.now() - 2592000000).toISOString(), status: "completed" },
            { id: "a4", type: "vote", title: "Governance Vote", description: "Voted YES on Proposal #8: Install solar panels", date: new Date(Date.now() - 3456000000).toISOString(), status: "passed" },
            { id: "a5", type: "market", title: "Marketplace Listing", description: "Listed 0.29% of The Apex Tower for $6,200", amount: 6200, date: new Date(Date.now() - 4320000000).toISOString(), status: "active" },
          ]);
        }
      } catch (err) {
        console.error("[Dashboard] Data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-amber-400/50" style={{ animationDuration: "1.5s" }} />
          </div>
          <p className="text-xs text-cyan-400/60 uppercase tracking-[0.3em] font-mono">Initializing 8th Ledger Dashboard</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const totalCommitted = positions.reduce((s, p) => s + p.amountCommitted, 0);
  const totalDividendEstimate = positions.filter(p => p.status === "pac").reduce((s, p) => s + p.monthlyDividendEstimate, 0);
  const totalReturned = positions.reduce((s, p) => s + p.totalReturned, 0);
  const commitmentPositions = positions.filter(p => p.status === "commitment");
  const pacPositions = positions.filter(p => p.status === "pac" || p.status === "for_sale");
  const unreadCount = notifications.filter(n => !n.read).length;

  const portfolioHistory = [12000, 12500, 12300, 13100, 12800, 14200, 13900, 14800, 15600, 15200, 16100, 17500, 17200, 18100, 18900, 18500, 19400, 20300, 19900, 20800, 21600, 21200, 22100, 23000, 22600, 23500, 24300, 23900, 24800, 25700];

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-cyan-500/20 selection:text-cyan-100">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* ═══════════════════════════════════════════════════════════
            HEADER — Sovereign Identity Bar
            ═══════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em]">Protocol Live • Block {Date.now().toString(36).toUpperCase().slice(-6)}</span>
              </div>
              {user?.isPrimaryAdmin && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-amber-500/20 bg-amber-500/5">
                  <Crown className="h-3 w-3 text-amber-400" />
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Architect</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="text-white/40">Welcome,</span>{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-transparent">
                {user?.displayName || "Sovereign"}
              </span>
            </h1>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-white/30 font-mono">
              <span>{user?.ledgerId}</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="uppercase">{user?.kycTier || "Visitor"} Tier</span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {user?.country || "Global"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {showBalances ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showBalances ? "Hide" : "Show"}
            </button>
            <button
              onClick={() => router.push("/wallet")}
              className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-all"
            >
              <Wallet className="h-3.5 w-3.5" />
              {showBalances ? `${(user?.ledgerBalance || 0).toLocaleString()} LED` : "••••••"}
            </button>
            <button
              onClick={() => router.push("/pools")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-xs font-bold text-white hover:from-cyan-400 hover:to-violet-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-4 w-4" />
              Commit to Pool
            </button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            STATS ROW — 4 Key Metrics
            ═══════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Portfolio Value */}
          <GlowCard accent="cyan">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Diamond className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">Portfolio Value</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <TrendingUp className="h-3 w-3" /> +12.4%
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">
              {showBalances ? <AnimatedCounter value={totalCommitted} prefix="$" /> : "$••••••"}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-[10px] text-amber-400/60">
                <Flame className="h-3 w-3" />
                <span>{commitmentPositions.length} Commitment</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400/60">
                <ShieldCheck className="h-3 w-3" />
                <span>{pacPositions.length} PAC</span>
              </div>
            </div>
          </GlowCard>

          {/* LED Balance */}
          <GlowCard accent="amber">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Coins className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">LED Balance</span>
              </div>
              <span className="text-[10px] text-white/20 font-mono">Liquid</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">
              {showBalances ? <AnimatedCounter value={user?.ledgerBalance || 0} /> : "••••••"}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-[10px] text-white/20">
                <span className="font-mono">Ledger Currency</span>
              </div>
            </div>
          </GlowCard>

          {/* Monthly Dividends */}
          <GlowCard accent="emerald">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">Monthly Dividends</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">80/20</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">
              {showBalances ? <AnimatedCounter value={totalDividendEstimate} prefix="$" /> : "$••••••"}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-[10px] text-white/20">
                <Receipt className="h-3 w-3" />
                <span>Lifetime: {showBalances ? formatMoney(totalReturned) : "$•••"}</span>
              </div>
            </div>
          </GlowCard>

          {/* Active Pools */}
          <GlowCard accent="violet">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Layers className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">Live Pools</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">
              <AnimatedCounter value={pools.filter(p => p.status === "filling").length} />
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-[10px] text-cyan-400/60">
                <CheckCircle2 className="h-3 w-3" />
                <span>{pools.filter(p => p.status === "filled").length} Filled</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-400/60">
                <Timer className="h-3 w-3" />
                <span>{pools.filter(p => p.status === "filling").reduce((s, p) => s + (p.target - p.committed), 0).toLocaleString()} LED to fill</span>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            MAIN GRID — Chart + Sidebar
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* LEFT COLUMN — Chart + Positions + Pools */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Portfolio Velocity Chart — FOREX STYLE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <GlowCard accent="cyan" className="h-[360px]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      Portfolio Velocity
                    </h3>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5">Asset value trajectory across all sovereign positions</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
                    {(["1W", "1M", "3M", "1Y", "ALL"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedTimeRange(range)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          selectedTimeRange === range 
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                            : "text-white/30 hover:text-white/50"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[260px] w-full">
                  <AreaChart data={portfolioHistory} color="#06b6d4" height={260} />
                </div>
              </GlowCard>
            </motion.div>

            {/* MY SOVEREIGN POSITIONS — Commitment / PAC Lifecycle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  My Sovereign Positions
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-white/30">Commitment</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white/30">PAC</span>
                  </div>
                  <button onClick={() => router.push("/vault")} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    Vault <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {positions.length === 0 ? (
                  <div className="p-10 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                    <Target className="h-10 w-10 text-white/10 mx-auto mb-4" />
                    <p className="text-sm text-white/40 font-semibold">No sovereign positions yet</p>
                    <p className="text-xs text-white/20 mt-2 max-w-sm mx-auto">
                      Commit to a LedgerProp pool to register your commitment. When the pool fills, your commitment converts to a PAC — 
                      a perpetual asset contract that earns monthly dividends.
                    </p>
                    <button 
                      onClick={() => router.push("/pools")}
                      className="mt-4 px-5 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold hover:bg-cyan-500/20 transition-all"
                    >
                      Browse Pools
                    </button>
                  </div>
                ) : (
                  positions.map((pos, i) => {
                    const meta = VERTICAL_META[pos.verticalId] || VERTICAL_META.ledgerprop;
                    const Icon = meta.icon;
                    const pool = pools.find(p => p.poolId === pos.poolId);
                    const fillPercent = pool ? (pool.committed / pool.target) * 100 : 0;
                    const isCommitment = pos.status === "commitment";
                    const isForSale = pos.status === "for_sale";

                    return (
                      <motion.div
                        key={pos.pacToken}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`group relative overflow-hidden rounded-xl border p-4 transition-all hover:border-white/10 ${
                          isCommitment 
                            ? "bg-gradient-to-r from-amber-500/[0.03] to-transparent border-amber-500/10" 
                            : isForSale
                            ? "bg-gradient-to-r from-cyan-500/[0.03] to-transparent border-cyan-500/10"
                            : "bg-gradient-to-r from-emerald-500/[0.03] to-transparent border-emerald-500/10"
                        }`}
                      >
                        {/* Lifecycle indicator line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${
                          isCommitment ? "bg-amber-500/40" : isForSale ? "bg-cyan-500/40" : "bg-emerald-500/40"
                        }`} />

                        <div className="flex flex-col lg:flex-row lg:items-center gap-4 pl-2">
                          {/* Asset Image + Info */}
                          <div className="flex items-center gap-3 min-w-[280px]">
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/10 shrink-0">
                              <img 
                                src={pos.assetImage || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200"} 
                                alt={pos.poolName}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-0.5 left-0.5 right-0.5 text-center">
                                <span className="text-[8px] font-bold text-white/80">{meta.emoji}</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{pos.poolName}</h4>
                                <StatusBadge status={pos.status} />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-white/30">{pos.pacToken}</span>
                                {isCommitment && <LifecycleBadge status="commitment" fillPercent={fillPercent} />}
                                {pos.status === "pac" && <LifecycleBadge status="pac" fillPercent={100} />}
                              </div>
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-white/20 font-mono">Committed</div>
                              <div className="text-sm font-bold text-white font-mono mt-0.5">{formatMoney(pos.amountCommitted)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-white/20 font-mono">Ownership</div>
                              <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">{pos.ownershipPercent.toFixed(2)}%</div>
                            </div>
                            <div>
                              <div className="text-[9px] uppercase tracking-wider text-white/20 font-mono">
                                {pos.status === "pac" ? "Monthly" : "Est. Monthly"}
                              </div>
                              <div className={`text-sm font-bold font-mono mt-0.5 ${pos.status === "pac" ? "text-emerald-400" : "text-amber-400/60"}`}>
                                {pos.status === "pac" ? `+${formatMoney(pos.monthlyDividendEstimate)}` : "Pending fill"}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {pos.hallId && (
                              <button
                                onClick={() => router.push(`/halls/${pos.hallId}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                              >
                                <Gavel className="h-3 w-3" />
                                Hall
                              </button>
                            )}
                            {pos.status === "pac" && (
                              <button
                                onClick={() => router.push("/marketplace")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold hover:bg-cyan-500/20 transition-all"
                              >
                                <ArrowUpFromLine className="h-3 w-3" />
                                Sell
                              </button>
                            )}
                            {isForSale && (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/5 text-cyan-400/60 border border-cyan-500/10 text-[10px] font-bold">
                                <Package className="h-3 w-3" />
                                Listed
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* LIVE POOL OPPORTUNITIES — Only LedgerProp active */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Live Pool Opportunities
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 font-mono">Only LedgerProp active</span>
                  <button onClick={() => router.push("/pools")} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    All Pools <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pools.filter(p => p.status === "filling").map((pool, i) => {
                  const meta = VERTICAL_META[pool.verticalId] || VERTICAL_META.ledgerprop;
                  const fillPct = (pool.committed / pool.target) * 100;
                  const daysLeft = Math.ceil((new Date(pool.closesAt).getTime() - Date.now()) / 86400000);

                  return (
                    <motion.div
                      key={pool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      onClick={() => router.push(`/pools/${pool.poolId}`)}
                      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] cursor-pointer hover:border-amber-500/20 hover:bg-white/[0.03] transition-all duration-500"
                    >
                      {/* Image Header */}
                      <div className="relative h-40 w-full overflow-hidden">
                        <img 
                          src={pool.imageUrl || `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600`} 
                          alt={pool.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/50 to-transparent" />
                        
                        {/* Top badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
                            {meta.emoji} {meta.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300">
                            {pool.country}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <StatusBadge status="filling" />
                        </div>

                        {/* Bottom info */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">{pool.name}</h4>
                          <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{pool.description}</p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 space-y-3">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-[10px] mb-1.5">
                            <span className="text-white/30">Pool Progress</span>
                            <span className="font-mono text-amber-400 font-bold">{Math.round(fillPct)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${fillPct}%` }}
                              transition={{ duration: 1.2, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-white/20 mt-1 font-mono">
                            <span>{formatMoney(pool.committed)} committed</span>
                            <span>Target: {formatMoney(pool.target)}</span>
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="text-[9px] text-white/20 uppercase">Asset Value</div>
                            <div className="text-xs font-bold text-white font-mono mt-0.5">{formatMoney(pool.assetValue)}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="text-[9px] text-white/20 uppercase">Participants</div>
                            <div className="text-xs font-bold text-white font-mono mt-0.5">{pool.participants}/{pool.maxParticipants}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="text-[9px] text-white/20 uppercase">Closes</div>
                            <div className="text-xs font-bold text-white font-mono mt-0.5">{daysLeft}d</div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-white/20">Min: $1 • 8th Ledger</span>
                          <span className="flex items-center gap-1 text-xs text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                            Commit <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN — Notifications + Halls + Activity + Quick Actions */}
          <div className="space-y-6">
            
            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <GlowCard accent="amber">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Sovereign Alerts</h3>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/20 animate-pulse">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => notif.actionUrl && router.push(notif.actionUrl)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        notif.read 
                          ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]" 
                          : "bg-amber-500/[0.03] border-amber-500/15 hover:bg-amber-500/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-semibold truncate ${notif.read ? "text-white/50" : "text-white"}`}>
                              {notif.title}
                            </p>
                            {notif.type === "dividend" && <Banknote className="h-3 w-3 text-emerald-400 shrink-0" />}
                            {notif.type === "proposal" && <Gavel className="h-3 w-3 text-violet-400 shrink-0" />}
                            {notif.type === "commitment" && <Flame className="h-3 w-3 text-amber-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-white/30 truncate mt-0.5">{notif.message}</p>
                          <p className="text-[9px] text-white/15 mt-1 font-mono">{formatRelative(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => router.push("/notifications")} 
                  className="w-full mt-3 py-2.5 rounded-xl bg-white/5 text-white/30 text-xs font-semibold hover:bg-white/10 hover:text-white/50 transition-all border border-white/5"
                >
                  View All Alerts
                </button>
              </GlowCard>
            </motion.div>

            {/* My Halls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BuildingIcon className="h-4 w-4 text-violet-400" />
                  My Digital Parliaments
                </h3>
                <span className="text-[10px] text-white/20 font-mono">{halls.length} halls</span>
              </div>
              <div className="space-y-2">
                {halls.map((hall) => {
                  const meta = VERTICAL_META[hall.pool.verticalId] || VERTICAL_META.ledgerprop;
                  return (
                    <div
                      key={hall.id}
                      onClick={() => router.push(`/halls/${hall.id}`)}
                      className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-violet-500/20 hover:bg-white/[0.04] cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.emoji}</span>
                          <span className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">{hall.name}</span>
                        </div>
                        <StatusBadge status={hall.status} />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-white/25 font-mono">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {hall._count.messages}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gavel className="h-3 w-3" /> {hall._count.proposals} proposals
                        </span>
                        <span className={meta.color}>{meta.label}</span>
                      </div>
                    </div>
                  );
                })}
                {halls.length === 0 && (
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                    <p className="text-xs text-white/30">No halls yet</p>
                    <p className="text-[10px] text-white/20 mt-1">Halls unlock when pools fill</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Deposit", icon: ArrowDownRight, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", action: "/wallet", desc: "Add funds" },
                  { label: "Pools", icon: Target, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", action: "/pools", desc: "Commit" },
                  { label: "Market", icon: Package, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", action: "/marketplace", desc: "Trade" },
                  { label: "Oracle", icon: Target, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", action: "/oracle", desc: "Forecast" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.action)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${action.border} ${action.bg} hover:bg-white/5 transition-all group`}
                  >
                    <action.icon className={`h-4 w-4 ${action.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[11px] font-bold text-white/70">{action.label}</span>
                    <span className="text-[9px] text-white/30">{action.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/30" />
                Sovereign Trail
              </h3>
              <div className="space-y-0">
                {activities.map((act, i) => (
                  <div key={act.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {/* Timeline line */}
                    {i < activities.length - 1 && (
                      <div className="absolute left-[5px] top-3 bottom-0 w-px bg-white/5" />
                    )}
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      act.type === "commit" ? "bg-amber-400" :
                      act.type === "convert" ? "bg-cyan-400" :
                      act.type === "dividend" ? "bg-emerald-400" :
                      act.type === "vote" ? "bg-violet-400" :
                      act.type === "market" ? "bg-cyan-400" :
                      "bg-white/20"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-white/60">{act.description}</p>
                        {act.amount && (
                          <span className="text-[10px] font-mono text-emerald-400 shrink-0">+{formatMoney(act.amount)}</span>
                        )}
                      </div>
                      <p className="text-[9px] text-white/15 font-mono mt-0.5">{formatRelative(act.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            VERTICALS — LedgerProp Active, Rest Coming Soon
            ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />
              Sovereign Verticals
            </h3>
            <span className="text-[10px] text-white/20 font-mono">11 Verticals • 1 Active</span>
          </div>

          {/* Active: LedgerProp */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <button
              onClick={() => router.push("/pools?vertical=ledgerprop")}
              className="group relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4 hover:border-amber-500/40 hover:from-amber-500/15 hover:to-orange-500/10 transition-all text-left"
            >
              <div className="absolute top-2 right-2">
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                </span>
              </div>
              <span className="text-3xl block mb-2">🏛</span>
              <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">LedgerProp</span>
              <span className="text-[10px] text-white/30 block mt-0.5">Real Estate</span>
              <span className="text-[10px] text-emerald-400 font-mono mt-2 block">
                {pools.filter(p => p.verticalId === "ledgerprop" && p.status === "filling").length} pools filling
              </span>
            </button>
          </div>

          {/* Locked Verticals */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 font-bold mb-3">Coming Soon</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 opacity-40">
              {[
                { id: "ledgerauto",   emoji: "🚗", name: "LedgerAuto",   desc: "Vehicles & Fleet" },
                { id: "ledgertech",   emoji: "💻", name: "LedgerTech",   desc: "Electronics" },
                { id: "ledgeredu",    emoji: "🎓", name: "LedgerEdu",    desc: "Education" },
                { id: "ledgerhealth", emoji: "🏥", name: "LedgerHealth", desc: "Medical" },
                { id: "ledgeraccess", emoji: "🔧", name: "LedgerAccess", desc: "Infrastructure" },
                { id: "ledgerbiz",    emoji: "💼", name: "LedgerBiz",    desc: "Businesses" },
                { id: "ledgertravel", emoji: "✈️", name: "LedgerTravel", desc: "Aircraft & Marine" },
                { id: "ledgeragri",   emoji: "🌿", name: "LedgerAgri",   desc: "Agriculture" },
                { id: "ledgerenergy", emoji: "⚡", name: "LedgerEnergy", desc: "Solar & Wind" },
                { id: "ledgersport",  emoji: "⚽", name: "LedgerSport",  desc: "Sport Venues" },
              ].map((v) => (
                <div
                  key={v.id}
                  className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 cursor-not-allowed"
                >
                  <div className="absolute top-2 right-2">
                    <Lock className="h-3 w-3 text-white/10" />
                  </div>
                  <span className="text-2xl block mb-2 grayscale">{v.emoji}</span>
                  <span className="text-sm font-bold text-white/30">{v.name}</span>
                  <span className="text-[10px] text-white/15 block mt-0.5">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER BANNER — Asset Lifecycle
            ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="rounded-2xl border border-cyan-500/10 bg-gradient-to-r from-cyan-500/[0.03] via-transparent to-violet-500/[0.03] p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                  <CircleArrowRight className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">The Sovereign Asset Lifecycle</h4>
                  <p className="text-xs text-white/30 leading-relaxed max-w-xl">
                    Commit capital to a pool. When it fills, your commitment converts to ownership through a{" "}
                    <span className="text-emerald-400 font-semibold">PAC</span> — a Perpetual Asset Contract. 
                    The hall unlocks. Monthly dividends flow. Marketplace liquidity available.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center shrink-0">
                <div>
                  <p className="text-lg font-bold text-amber-400 font-mono">Commit</p>
                  <p className="text-[9px] text-white/20 uppercase">Capital</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/10" />
                <div>
                  <p className="text-lg font-bold text-cyan-400 font-mono">Fill</p>
                  <p className="text-[9px] text-white/20 uppercase">Threshold</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/10" />
                <div>
                  <p className="text-lg font-bold text-emerald-400 font-mono">Own</p>
                  <p className="text-[9px] text-white/20 uppercase">PAC</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/10" />
                <div>
                  <p className="text-lg font-bold text-violet-400 font-mono">Govern</p>
                  <p className="text-[9px] text-white/20 uppercase">Hall</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}