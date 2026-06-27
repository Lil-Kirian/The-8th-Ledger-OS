// app/admin/halls/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Shield,
  Users,
  FileText,
  ClipboardCheck,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Crown,
  Hash,
  TrendingUp,
  Clock,
  Activity,
  Ban,
  UserCheck,
  Printer,
  Globe,
  Wallet,
  PieChart,
  Layers,
  Search,
  Siren,
  Hammer,
  Landmark,
  Zap,
  Lock,
  BarChart3,
  HeartPulse,
  MessageSquare,
  BookOpen,
  Package,
  PiggyBank,
  Wrench,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
} from "lucide-react";

/* ============================================================
   TYPES — 8th Ledger Hall Command Center
   ============================================================ */
type MemberRole = "speaker" | "treasurer" | "warden" | "scribe" | "member";

interface Member {
  id: string;
  displayName: string;
  ledgerId: string;
  legalName: string | null;
  email: string;
  avatar: string | null;
  kycTier: string;
  role: MemberRole;
  ownershipPercent: number;
  amount: number;
  status: string;
  joinedAt: string;
  kycStatus: string;
  isBanned: boolean;
  banReason: string | null;
  dynamicValue?: number;
  accumulatedDividends?: number;
}

interface Proposal {
  id: string;
  title: string;
  type: string;
  status: string;
  amount: number | null;
  voteWeightYes: number;
  voteWeightNo: number;
  yesPercent: number;
  endsAt: string;
  executedAt: string | null;
  executionResult: string | null;
  proposer: { displayName: string; ledgerId: string };
}

interface ExecutionLog {
  id: string;
  status: string;
  cost: number | null;
  proofUrls: string[];
  description: string;
  executedBy: string;
  createdAt: string;
}

interface ExecutiveCabinet {
  speakerId: string | null;
  treasurerId: string | null;
  wardenId: string | null;
  scribeId: string | null;
  electedAt: string;
  expiresAt: string;
  isImpeached: boolean;
}

interface PirPillar {
  pillar: string;
  amount: number;
  spent: number;
  purpose: string;
}

// PHASE 4: IHCP Contribution
interface IhcpContribution {
  id: string;
  ledgerId: string;
  displayName: string;
  amount: number;
  purpose: string;
  repaidAmount: number;
  status: string;
  createdAt: string;
}

interface HallDetail {
  id: string;
  name: string;
  status: string;
  vertical: string;
  emojiSet: string[];
  poolId: string;
  listedPrice: number;
  trueCost: number | null;
  pirAllocation: number | null;
  treasuryBalance: number;
  totalIn: number;
  totalOut: number;
  monthlyRevenue: number;
  createdAt: string;
  country: string | null;

  // 8th Ledger Fields
  hallClass: string | null;
  sriScore: number;
  ahgiScore: number;
  closureStatus: string;
  pirDebt: number;
  payrollReserve: number;
  assetBookValue: number | null;
  executiveCabinet: ExecutiveCabinet | null;
  pirPillars: PirPillar[];

  // PHASE 4: Universal flags
  inventoryEnabled: boolean;
  forgeEnabled: boolean;
  ihcpBalance: number;
  ihcpTarget: number | null;
  ihcpContributions: IhcpContribution[];
}

const ROLE_CONFIG: Record<MemberRole, { label: string; color: string; bg: string; border: string; icon: unknown }> = {
  speaker: { label: "Speaker", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: MessageSquare },
  treasurer: { label: "Treasurer", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Wallet },
  warden: { label: "Warden", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: Shield },
  scribe: { label: "Scribe", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: BookOpen },
  member: { label: "Member", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Users },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: unknown }> = {
  ghost: { label: "Ghost", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", icon: LayoutGrid },
  live: { label: "Live", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity },
  mature: { label: "Mature", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: TrendingUp },
  dormant: { label: "Dormant", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle },
  dissolved: { label: "Dissolved", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: X },
};

const CLOSURE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  warning: { label: "Warning", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  decision: { label: "Final Warning", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  liquidation: { label: "Liquidating", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  dissolved: { label: "Dissolved", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

const KYC_TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  whale: { label: "Whale", color: "text-purple-400", bg: "bg-purple-500/10" },
  verified: { label: "Verified", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  sovereign: { label: "Sovereign", color: "text-sky-400", bg: "bg-sky-500/10" },
  visitor: { label: "Visitor", color: "text-slate-400", bg: "bg-slate-500/10" },
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10" },
};

const PILLAR_CONFIG: Record<string, { label: string; color: string; icon: unknown }> = {
  shield: { label: "The Shield", color: "text-red-400", icon: Shield },
  seal: { label: "The Seal", color: "text-blue-400", icon: Lock },
  forge: { label: "The Forge", color: "text-orange-400", icon: Hammer },
  spire: { label: "The Spire", color: "text-violet-400", icon: Landmark },
  vanguard: { label: "The Vanguard", color: "text-amber-400", icon: Zap },
  sanctuary: { label: "The Sanctuary", color: "text-emerald-400", icon: Siren },
};

const HALL_CLASS_CONFIG: Record<string, { label: string; desc: string; color: string }> = {
  I: { label: "Class I — Passive", desc: "8th Ledger manages all operations", color: "text-slate-400" },
  II: { label: "Class II — Managed", desc: "Hall approves operator levels", color: "text-cyan-400" },
  III: { label: "Class III — Active", desc: "Full hall staffing & operations", color: "text-amber-400" },
};

export default function HallDetailPage() {
  const params = useParams();
  const hallId = params.id as string;

  const [hall, setHall] = useState<HallDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | MemberRole>("all");
  const [expandedSection, setExpandedSection] = useState<"members" | "proposals" | "execution" | "cabinet" | "pir" | "operations">("members");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hallRes, membersRes, proposalsRes] = await Promise.all([
        fetch(`/api/halls/${hallId}`),
        fetch(`/api/halls/${hallId}/members`),
        fetch(`/api/halls/${hallId}/proposals`),
      ]);

      const hallData = await hallRes.json();
      const membersData = await membersRes.json();
      const proposalsData = await proposalsRes.json();

      if (hallData.success) setHall(hallData.hall);
      if (membersData.success) setMembers(membersData.members || []);
      if (proposalsData.success) {
        setProposals(proposalsData.proposals || []);
        const logs: ExecutionLog[] = [];
        proposalsData.proposals?.forEach((p: unknown) => {
          if (p.executionLogs) logs.push(...p.executionLogs);
        });
        setExecutionLogs(logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hallId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMembers = useMemo(() => {
    let list = members;
    if (roleFilter !== "all") {
      list = list.filter((m) => m.role === roleFilter);
    }
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.ledgerId.toLowerCase().includes(q) ||
          m.legalName?.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.ownershipPercent - a.ownershipPercent);
  }, [members, roleFilter, memberSearch]);

  const exportCSV = useCallback(() => {
    if (!hall) return;
    const headers = ["LedgerID", "DisplayName", "LegalName", "Email", "KycTier", "Role", "OwnershipPercent", "Amount", "Status", "JoinedAt", "Banned", "DynamicValue"];
    const rows = members.map((m) => [
      m.ledgerId,
      `"${m.displayName}"`,
      `"${m.legalName || ""}"`,
      m.email,
      m.kycTier,
      m.role,
      m.ownershipPercent,
      m.amount,
      m.status,
      new Date(m.joinedAt).toISOString(),
      m.isBanned ? "YES" : "NO",
      m.dynamicValue || 0,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pac-registry-${hall.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }, [members, hall]);

  async function toggleFeature(feature: "inventory" | "forge") {
    setActionLoading(feature);
    try {
      const res = await fetch(`/api/halls/${hallId}/${feature}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`${feature === "inventory" ? "Inventory" : "Forge"} ${data.enabled ? "enabled" : "disabled"}`);
        setHall((prev) =>
          prev
            ? {
                ...prev,
                [feature === "inventory" ? "inventoryEnabled" : "forgeEnabled"]: data.enabled,
              }
            : null
        );
      } else {
        setMessage(data.error || "Toggle failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const totalOwnership = members.reduce((sum, m) => sum + m.ownershipPercent, 0);
  const treasuryAfterPayroll = hall ? hall.treasuryBalance - (hall.payrollReserve || 0) : 0;
  const ihcpRepaymentRate =
    hall && hall.ihcpContributions.length > 0
      ? Math.round(
          (hall.ihcpContributions.reduce((s, c) => s + c.repaidAmount, 0) /
            hall.ihcpContributions.reduce((s, c) => s + c.amount, 0)) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!hall) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <LayoutGrid className="h-12 w-12 text-white/10" />
        <p className="mt-4 text-sm text-slate-500">Hall not found</p>
        <Link href="/admin/halls" className="mt-4 text-xs text-cyan-400 hover:text-cyan-300">
          ← Back to Halls
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[hall.status] || STATUS_CONFIG.ghost;
  const closureCfg = CLOSURE_CONFIG[hall.closureStatus] || CLOSURE_CONFIG.active;
  const classCfg = HALL_CLASS_CONFIG[hall.hallClass || "I"] || HALL_CLASS_CONFIG.I;

  return (
    <div className="relative min-h-full text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-[11px] text-slate-500">
        <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin</Link>
        <ChevronDown className="h-3 w-3 -rotate-90" />
        <Link href="/admin/halls" className="hover:text-slate-300 transition-colors">Halls</Link>
        <ChevronDown className="h-3 w-3 -rotate-90" />
        <span className="text-slate-300">{hall.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
              <statusCfg.icon className="h-3 w-3" /> {statusCfg.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${closureCfg.bg} ${closureCfg.border} ${closureCfg.color}`}>
              {hall.closureStatus !== "active" && <Siren className="h-3 w-3" />}
              {closureCfg.label}
            </span>
            <span className={`text-[10px] font-bold uppercase ${classCfg.color}`}>{classCfg.label}</span>
            <span className="text-[10px] text-slate-500">#{hall.id.slice(-8)}</span>

            {/* PHASE 4: Feature badges */}
            {hall.inventoryEnabled && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[9px] font-bold text-sky-400">
                <Package className="h-3 w-3" /> Inventory
              </span>
            )}
            {hall.forgeEnabled && (
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[9px] font-bold text-orange-400">
                <Hammer className="h-3 w-3" /> Forge
              </span>
            )}
            {hall.ihcpBalance > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                <PiggyBank className="h-3 w-3" /> IHCP
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{hall.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {hall.country || "N/A"}</span>
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> Pool #{hall.poolId?.slice(-6)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(hall.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {classCfg.desc}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/halls/${hallId}?tab=operations`}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <Wrench className="h-3.5 w-3.5" /> Operations
          </Link>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Export PAC CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs ${
              message.includes("enabled") || message.includes("disabled")
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {message.includes("enabled") || message.includes("disabled") ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message}
            <button onClick={() => setMessage("")} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SRI & AHGI Score Cards */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard
          label="SRI Score"
          value={hall.sriScore}
          max={100}
          color={hall.sriScore >= 90 ? "amber" : hall.sriScore >= 75 ? "emerald" : hall.sriScore >= 60 ? "cyan" : "rose"}
          icon={<Shield className="h-4 w-4" />}
          sub={hall.sriScore >= 90 ? "Platinum" : hall.sriScore >= 75 ? "Gold" : hall.sriScore >= 60 ? "Silver" : hall.sriScore >= 40 ? "Bronze" : "At Risk"}
        />
        <ScoreCard
          label="AHGI Score"
          value={hall.ahgiScore}
          max={100}
          color={hall.ahgiScore >= 80 ? "emerald" : hall.ahgiScore >= 60 ? "cyan" : hall.ahgiScore >= 40 ? "amber" : "rose"}
          icon={<HeartPulse className="h-4 w-4" />}
          sub={hall.ahgiScore >= 80 ? "Thriving" : hall.ahgiScore >= 60 ? "Healthy" : hall.ahgiScore >= 40 ? "Stagnant" : hall.ahgiScore >= 20 ? "Declining" : "Critical"}
        />
        <ScoreCard
          label="Asset Book Value"
          value={hall.assetBookValue || 0}
          max={hall.listedPrice}
          color="violet"
          icon={<BarChart3 className="h-4 w-4" />}
          isCurrency
          sub="Current appraisal"
        />
        <ScoreCard
          label="PIR Debt"
          value={hall.pirDebt}
          max={hall.treasuryBalance}
          color={hall.pirDebt > 0 ? "rose" : "emerald"}
          icon={<AlertTriangle className="h-4 w-4" />}
          isCurrency
          sub={hall.pirDebt > 0 ? "Outstanding advances" : "No debt"}
        />
      </div>

      {/* Treasury Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-950/10 via-[#0a0a14]/60 to-transparent p-6 backdrop-blur-md"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wallet className="h-4 w-4 text-cyan-400" /> Treasury Snapshot
          </h2>
          <span className="text-[10px] text-slate-500">8th Ledger Tithe (20%) + Payroll Reserve</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[9px] uppercase text-slate-500">Balance</p>
            <p className="mt-1 text-xl font-bold text-cyan-400">${hall.treasuryBalance.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[9px] uppercase text-slate-500">Payroll Reserve</p>
            <p className="mt-1 text-xl font-bold text-amber-300">${(hall.payrollReserve || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[9px] uppercase text-slate-500">Liquid After Payroll</p>
            <p className="mt-1 text-xl font-bold text-emerald-300">${treasuryAfterPayroll.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[9px] uppercase text-slate-500">Monthly Revenue</p>
            <p className="mt-1 text-xl font-bold text-violet-300">${(hall.monthlyRevenue || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Total In</span>
              <span className="font-semibold text-emerald-300">${hall.totalIn.toLocaleString()}</span>
            </div>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Total Out</span>
              <span className="font-semibold text-rose-300">${hall.totalOut.toLocaleString()}</span>
            </div>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Net Flow</span>
              <span className={`font-semibold ${hall.totalIn - hall.totalOut >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                ${(hall.totalIn - hall.totalOut).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* PHASE 4: Operations & IHCP Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="mb-6 rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-950/10 via-[#0a0a14]/60 to-transparent p-6 backdrop-blur-md"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-400" /> Operations & IHCP
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/halls/${hallId}/operations`}
              className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              <ArrowRight className="h-3 w-3" /> Open Operations
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          {/* Inventory Toggle */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold text-white">Inventory</span>
              </div>
              <button
                onClick={() => toggleFeature("inventory")}
                disabled={actionLoading === "inventory"}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
                  hall.inventoryEnabled
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {actionLoading === "inventory" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : hall.inventoryEnabled ? (
                  <><ToggleRight className="h-3.5 w-3.5" /> On</>
                ) : (
                  <><ToggleLeft className="h-3.5 w-3.5" /> Off</>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              {hall.inventoryEnabled
                ? "Hall can list products on the public inventory marketplace."
                : "Enable to unlock inventory management and public sales."}
            </p>
          </div>

          {/* Forge Toggle */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hammer className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold text-white">Forge</span>
              </div>
              <button
                onClick={() => toggleFeature("forge")}
                disabled={actionLoading === "forge"}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
                  hall.forgeEnabled
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {actionLoading === "forge" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : hall.forgeEnabled ? (
                  <><ToggleRight className="h-3.5 w-3.5" /> On</>
                ) : (
                  <><ToggleLeft className="h-3.5 w-3.5" /> Off</>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              {hall.forgeEnabled
                ? "Hall can hire workers and manage staffing through the Forge."
                : "Enable to unlock worker management and payroll operations."}
            </p>
          </div>

          {/* IHCP Balance */}
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">IHCP Balance</span>
              </div>
              <span className="text-[10px] text-emerald-400/60">5% priority return</span>
            </div>
            <p className="text-xl font-bold text-emerald-300">${(hall.ihcpBalance / 100).toLocaleString()}</p>
            {hall.ihcpTarget && hall.ihcpTarget > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (hall.ihcpBalance / hall.ihcpTarget) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[9px] text-slate-500">
                  Target: ${(hall.ihcpTarget / 100).toLocaleString()} • {Math.round((hall.ihcpBalance / hall.ihcpTarget) * 100)}% funded
                </p>
              </div>
            )}
          </div>
        </div>

        {/* IHCP Contributions Table */}
        {hall.ihcpContributions.length > 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <PiggyBank className="h-3.5 w-3.5 text-emerald-400" /> IHCP Contributions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-slate-500">
                    <th className="pb-2">Contributor</th>
                    <th className="pb-2">Purpose</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Repaid</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {hall.ihcpContributions.map((c) => (
                    <tr key={c.id} className="text-[10px]">
                      <td className="py-2 text-slate-300">{c.displayName || c.ledgerId}</td>
                      <td className="py-2 text-slate-400 capitalize">{c.purpose}</td>
                      <td className="py-2 text-emerald-300 font-semibold">${(c.amount / 100).toLocaleString()}</td>
                      <td className="py-2 text-slate-300">${(c.repaidAmount / 100).toLocaleString()}</td>
                      <td className="py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          c.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                          c.status === "repaid" ? "bg-cyan-500/10 text-cyan-400" :
                          c.status === "defaulted" ? "bg-rose-500/10 text-rose-400" :
                          "bg-slate-500/10 text-slate-400"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
              <span>Repayment rate: {ihcpRepaymentRate}%</span>
              <span>{hall.ihcpContributions.filter((c) => c.status === "active").length} active</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* PIR Allocation */}
      {hall.pirPillars && hall.pirPillars.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md"
        >
          <h2 className="mb-4 text-sm font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" /> Protocol Infrastructure Reserve
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {hall.pirPillars.map((pillar) => {
              const cfg = PILLAR_CONFIG[pillar.pillar] || PILLAR_CONFIG.shield;
              const pct = pillar.amount > 0 ? ((pillar.spent / pillar.amount) * 100).toFixed(0) : "0";
              return (
                <div key={pillar.pillar} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-lg font-bold text-white">${pillar.amount.toLocaleString()}</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">{pct}% utilized • ${pillar.spent.toLocaleString()} spent</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Ownership Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-2xl border border-white/5 bg-[#0a0a14]/80 p-6 backdrop-blur-md"
      >
        <h2 className="mb-4 text-sm font-bold text-white flex items-center gap-2">
          <PieChart className="h-4 w-4 text-violet-400" /> Ownership Breakdown
        </h2>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>Capital Distribution</span>
              <span>{members.length} members • {totalOwnership.toFixed(2)}% total</span>
            </div>
            <div className="h-4 w-full rounded-full bg-white/10 overflow-hidden flex">
              {members.map((m, i) => {
                const colors = ["bg-emerald-500", "bg-cyan-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-indigo-500"];
                return (
                  <div
                    key={m.id}
                    className={`h-full ${colors[i % colors.length]}`}
                    style={{ width: `${m.ownershipPercent}%` }}
                    title={`${m.displayName}: ${m.ownershipPercent}%`}
                  />
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {members.slice(0, 8).map((m, i) => {
                const colors = ["text-emerald-400", "text-cyan-400", "text-violet-400", "text-amber-400", "text-rose-400", "text-sky-400", "text-indigo-400"];
                return (
                  <div key={m.id} className="flex items-center gap-2 text-[10px]">
                    <div className={`h-2 w-2 rounded-full ${colors[i % colors.length].replace("text", "bg")}`} />
                    <span className="truncate text-slate-400">{m.displayName}</span>
                    <span className={`font-bold ${colors[i % colors.length]}`}>{m.ownershipPercent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 space-y-2 lg:w-48">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase text-slate-500">Listed Price</p>
              <p className="mt-1 text-sm font-bold text-cyan-300">${hall.listedPrice.toLocaleString()}</p>
            </div>
            {hall.trueCost !== null && (
              <div className="rounded-lg border border-rose-500/10 bg-rose-500/[0.04] p-3">
                <p className="text-[9px] uppercase text-slate-500">True Cost (Hidden)</p>
                <p className="mt-1 text-sm font-bold text-rose-300">${hall.trueCost.toLocaleString()}</p>
              </div>
            )}
            {hall.pirAllocation !== null && (
              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
                <p className="text-[9px] uppercase text-slate-500">PIR Allocation</p>
                <p className="mt-1 text-sm font-bold text-emerald-300">${hall.pirAllocation.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        {/* EXECUTIVE CABINET */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-md overflow-hidden"
        >
          <button
            onClick={() => setExpandedSection(expandedSection === "cabinet" ? "members" : "cabinet")}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Executive Cabinet</h3>
                <p className="text-[10px] text-slate-500">
                  {hall.executiveCabinet ? "Elected officers • 6-month term" : "No cabinet elected yet"}
                </p>
              </div>
            </div>
            {expandedSection === "cabinet" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          <AnimatePresence>
            {expandedSection === "cabinet" && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="border-t border-white/5 px-5 pb-5 pt-4">
                  {hall.executiveCabinet ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { role: "speaker", label: "The Speaker", icon: MessageSquare, color: "amber", userId: hall.executiveCabinet.speakerId },
                        { role: "treasurer", label: "The Treasurer", icon: Wallet, color: "emerald", userId: hall.executiveCabinet.treasurerId },
                        { role: "warden", label: "The Warden", icon: Shield, color: "cyan", userId: hall.executiveCabinet.wardenId },
                        { role: "scribe", label: "The Scribe", icon: BookOpen, color: "violet", userId: hall.executiveCabinet.scribeId },
                      ].map((seat) => {
                        const member = members.find((m) => m.id === seat.userId);
                        return (
                          <div key={seat.role} className={`rounded-xl border border-${seat.color}-500/10 bg-${seat.color}-500/[0.04] p-4`}>
                            <div className="flex items-center gap-2 mb-3">
                              <seat.icon className={`h-4 w-4 text-${seat.color}-400`} />
                              <span className={`text-xs font-bold text-${seat.color}-400`}>{seat.label}</span>
                            </div>
                            {member ? (
                              <>
                                <p className="text-sm font-semibold text-white">{member.displayName}</p>
                                <p className="text-[10px] text-slate-500">{member.ledgerId}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{member.ownershipPercent}% ownership</p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500 italic">Vacant</p>
                            )}
                            <p className="mt-2 text-[9px] text-slate-600">
                              Term: {new Date(hall.executiveCabinet!.electedAt).toLocaleDateString()} — {new Date(hall.executiveCabinet!.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      <Crown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>No Executive Cabinet elected for this hall.</p>
                      <p className="text-[10px] mt-1">Members must vote to elect Speaker, Treasurer, Warden, and Scribe before hall goes Live.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* MEMBERS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-md overflow-hidden"
        >
          <button
            onClick={() => setExpandedSection(expandedSection === "members" ? "proposals" : "members")}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20">
                <Users className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Member Directory</h3>
                <p className="text-[10px] text-slate-500">{members.length} sovereigns • Full identities • KYC linked</p>
              </div>
            </div>
            {expandedSection === "members" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          <AnimatePresence>
            {expandedSection === "members" && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="border-t border-white/5 px-5 pb-5 pt-4">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/30 focus:bg-white/[0.05]"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(["all", "speaker", "treasurer", "warden", "scribe", "member"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRoleFilter(roleFilter === r ? "all" : r)}
                          className={`rounded-lg border px-3 py-2 text-[10px] font-semibold transition-all ${
                            roleFilter === r
                              ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                              : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10"
                          }`}
                        >
                          {r === "all" ? "All" : ROLE_CONFIG[r].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="pb-3 pl-2">Identity</th>
                          <th className="pb-3">Legal Name</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3">Ownership</th>
                          <th className="pb-3">KYC Tier</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Dynamic Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredMembers.map((m) => {
                          const roleCfg = ROLE_CONFIG[m.role] || ROLE_CONFIG.member;
                          const kycCfg = KYC_TIER_CONFIG[m.kycTier] || KYC_TIER_CONFIG.visitor;
                          return (
                            <tr key={m.id} className="group transition-colors hover:bg-white/[0.02]">
                              <td className="py-3 pl-2">
                                <div className="flex items-center gap-2">
                                  {m.avatar ? (
                                    <img src={m.avatar} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10" />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] ring-1 ring-white/10">
                                      <Users className="h-4 w-4 text-slate-500" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs font-semibold text-white">{m.displayName}</p>
                                    <p className="text-[9px] text-slate-500">{m.ledgerId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <p className="text-xs text-slate-300">{m.legalName || "—"}</p>
                              </td>
                              <td className="py-3">
                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase ${roleCfg.bg} ${roleCfg.border} ${roleCfg.color}`}>
                                  <roleCfg.icon className="h-3 w-3" /> {roleCfg.label}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full bg-violet-500" style={{ width: `${m.ownershipPercent}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-white">{m.ownershipPercent}%</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${kycCfg.bg} ${kycCfg.color}`}>
                                  {kycCfg.label}
                                </span>
                              </td>
                              <td className="py-3">
                                {m.isBanned ? (
                                  <span className="flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-400">
                                    <Ban className="h-3 w-3" /> Banned
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
                                    <UserCheck className="h-3 w-3" /> Active
                                  </span>
                                )}
                              </td>
                              <td className="py-3">
                                <span className="text-xs font-mono text-cyan-400">
                                  ${(m.dynamicValue || 0).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredMembers.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">No members match your filter.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* PROPOSALS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-md overflow-hidden"
        >
          <button
            onClick={() => setExpandedSection(expandedSection === "proposals" ? "execution" : "proposals")}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
                <ClipboardCheck className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Proposal History</h3>
                <p className="text-[10px] text-slate-500">{proposals.length} proposals • All types • Execution linked</p>
              </div>
            </div>
            {expandedSection === "proposals" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          <AnimatePresence>
            {expandedSection === "proposals" && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="border-t border-white/5 px-5 pb-5 pt-4">
                  <div className="space-y-3">
                    {proposals.map((p) => {
                      const passed = p.status === "passed" || p.status === "executing" || p.status === "completed";
                      return (
                        <div key={p.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                passed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                                {p.status}
                              </span>
                              <span className="text-[10px] text-slate-500">{p.type}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(p.endsAt).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                          <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-500">
                            <span>By {p.proposer.displayName} ({p.proposer.ledgerId})</span>
                            <span>{p.yesPercent.toFixed(1)}% approval</span>
                            {p.amount && <span className="text-amber-300">${p.amount.toLocaleString()}</span>}
                          </div>
                          {p.executionResult && (
                            <div className="mt-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-2 text-[10px] text-emerald-300">
                              {p.executionResult}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {proposals.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No proposals yet.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* EXECUTION LOG */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-md overflow-hidden"
        >
          <button
            onClick={() => setExpandedSection(expandedSection === "execution" ? "members" : "execution")}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
                <FileText className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Execution Log</h3>
                <p className="text-[10px] text-slate-500">{executionLogs.length} entries • Immutable • Proof-linked</p>
              </div>
            </div>
            {expandedSection === "execution" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          <AnimatePresence>
            {expandedSection === "execution" && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="border-t border-white/5 px-5 pb-5 pt-4">
                  <div className="space-y-3">
                    {executionLogs.map((log, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            log.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                            log.status === "executing" ? "bg-cyan-500/10 text-cyan-400" :
                            "bg-white/5 text-slate-400"
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-300">{log.description}</p>
                        {log.cost && <p className="mt-1 text-[10px] text-amber-400">Cost: ${log.cost.toLocaleString()}</p>}
                        {log.proofUrls && log.proofUrls.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {log.proofUrls.map((url, j) => (
                              <div key={j} className="h-12 w-12 overflow-hidden rounded-lg border border-white/5">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {executionLogs.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No execution logs yet.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
function ScoreCard({
  label,
  value,
  max,
  color,
  icon,
  sub,
  isCurrency,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
  sub: string;
  isCurrency?: boolean;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const display = isCurrency ? `$${value.toLocaleString()}` : value;

  return (
    <div className={`rounded-xl border border-${color}-500/10 bg-${color}-500/[0.04] p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
          {icon}
          {label}
        </div>
        <span className={`text-[10px] font-bold ${color === "rose" ? "text-rose-400" : color === "amber" ? "text-amber-400" : "text-emerald-400"}`}>
          {sub}
        </span>
      </div>
      <p className={`text-2xl font-bold text-${color}-400`}>{display}</p>
      {!isCurrency && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full bg-${color}-500`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}