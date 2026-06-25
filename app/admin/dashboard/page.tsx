// app/admin/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePrimaryAdmin, isPrimaryAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";
import {
  Shield,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  Globe,
  Eye,
  Vote,
  Wallet,
  FileCheck,
  Activity,
  Lock,
  Crown,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Ban,
  CheckCircle2,
  Hourglass,
  Landmark,
  Hammer,
  Sparkles,
  BarChart3,
  ScanEye,
  ScrollText,
  Siren,
  Package,
  CreditCard,
  ShoppingCart,
  PiggyBank,
  Percent,
  HandCoins,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalPools: number;
  activePools: number;
  filledPools: number;
  totalCommitted: number;
  totalRevenue: number;
  totalDividendsDistributed: number;
  pendingKyc: number;
  pendingWithdrawals: number;
  activeHalls: number;
  hallsInWarning: number;
  hallsInLiquidation: number;
  totalWorkers: number;
  activeForecasts: number;
  totalOraclePoints: number;
  currentCycle: {
    id: string;
    continent: string;
    phase: string;
    startAt: Date;
    endAt: Date;
    winnerPoolId: string | null;
  } | null;
  pirByPillar: Array<{
    pillar: string;
    _sum: { amount: number | null };
    _sumSpent: { spent: number | null };
  }>;
  recentAuditLogs: Array<{
    id: string;
    eventType: string;
    description: string;
    timestamp: Date;
    txHash: string;
  }>;
  recentSecurityLogs: Array<{
    id: string;
    action: string;
    ledgerId: string;
    success: boolean;
    createdAt: Date;
    ipAddress: string;
  }>;
  topHallsBySri: Array<{
    id: string;
    name: string;
    sriScore: number;
    hallClass: string | null;
    status: string;
    pool: { poolId: string; verticalId: string } | null;
  }>;
  revenueThisMonth: number;
  newUsersThisMonth: number;
  // PHASE 4: IHCP + Marketplace + Oracle
  ihcpStats: {
    totalContributed: number;
    totalRepaid: number;
    activeContributions: number;
    totalIhcpBalance: number;
  };
  marketplaceStats: {
    activeOwnershipListings: number;
    activeInventoryItems: number;
    totalFeesCollected: number;
    escrowHeld: number;
    ownershipVolume: number;
    inventoryVolume: number;
  };
  oracleBreakdown: {
    prophets: number;
    oracles: number;
    seers: number;
    novices: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getPhaseColor(phase: string) {
  switch (phase) {
    case "hush": return "text-slate-400";
    case "unveil": return "text-amber-400";
    case "reveal": return "text-cyan-400";
    case "forge": return "text-emerald-400";
    case "complete": return "text-violet-400";
    default: return "text-slate-400";
  }
}

function getPhaseIcon(phase: string) {
  switch (phase) {
    case "hush": return <Clock className="w-4 h-4" />;
    case "unveil": return <Eye className="w-4 h-4" />;
    case "reveal": return <Sparkles className="w-4 h-4" />;
    case "forge": return <Hammer className="w-4 h-4" />;
    case "complete": return <CheckCircle2 className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
}

function getPillarIcon(pillar: string) {
  switch (pillar) {
    case "shield": return <Shield className="w-4 h-4" />;
    case "seal": return <Lock className="w-4 h-4" />;
    case "forge": return <Hammer className="w-4 h-4" />;
    case "spire": return <Landmark className="w-4 h-4" />;
    case "vanguard": return <Zap className="w-4 h-4" />;
    case "sanctuary": return <Siren className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
}

function getPillarColor(pillar: string) {
  switch (pillar) {
    case "shield": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "seal": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "forge": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "spire": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "vanguard": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "sanctuary": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

// ─── Data Fetcher ────────────────────────────────────────────

async function getDashboardData(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalAdmins,
    totalPools,
    activePools,
    filledPools,
    totalCommittedAgg,
    totalRevenueAgg,
    totalDividendsAgg,
    pendingKyc,
    pendingWithdrawals,
    activeHalls,
    hallsWarning,
    hallsLiquidation,
    totalWorkers,
    activeForecasts,
    totalOraclePoints,
    currentCycle,
    pirByPillar,
    recentAuditLogs,
    recentSecurityLogs,
    topHalls,
    revenueThisMonthAgg,
    newUsersThisMonth,
    // PHASE 4: IHCP
    ihcpContributedAgg,
    ihcpRepaidAgg,
    activeIhcpCount,
    totalIhcpBalanceAgg,
    // PHASE 4: Marketplace
    activeOwnershipListings,
    activeInventoryItems,
    totalFeesAgg,
    escrowHeldAgg,
    ownershipVolumeAgg,
    inventoryVolumeAgg,
    // PHASE 4: Oracle breakdown
    oracleProphets,
    oracleOracles,
    oracleSeers,
    oracleNovices,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.pool.count(),
    prisma.pool.count({ where: { status: { in: ["filling", "active"] } } }),
    prisma.pool.count({ where: { status: "filled" } }),
    prisma.ownership.aggregate({ _sum: { amountCommitted: true } }),
    prisma.revenueLog.aggregate({ _sum: { amount: true } }),
    prisma.dividendDistribution.aggregate({ _sum: { totalAmount: true } }),
    prisma.kycRecord.count({ where: { status: "pending" } }),
    prisma.withdrawalRequest.count({ where: { status: "pending" } }),
    prisma.hall.count({ where: { status: { in: ["live", "mature"] } } }),
    prisma.hall.count({ where: { closureStatus: "warning" } }),
    prisma.hall.count({ where: { closureStatus: "liquidation" } }),
    prisma.worker.count({ where: { status: "active" } }),
    prisma.oracleForecast.count({ where: { status: "active" } }),
    prisma.oracleStanding.aggregate({ _sum: { totalPoints: true } }),
    prisma.meridianCycle.findFirst({
      where: { phase: { not: "complete" } },
      orderBy: { startAt: "desc" },
    }),
    prisma.pirAllocation.groupBy({
      by: ["pillar"],
      _sum: { amount: true, spent: true },
    }),
    prisma.auditLog.findMany({
      where: { visibleToPublic: true },
      orderBy: { timestamp: "desc" },
      take: 6,
      select: { id: true, eventType: true, description: true, timestamp: true, txHash: true },
    }),
    prisma.securityAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, action: true, ledgerId: true, success: true, createdAt: true, ipAddress: true },
    }),
    prisma.hall.findMany({
      where: { status: { in: ["live", "mature"] } },
      orderBy: { sriScore: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        sriScore: true,
        hallClass: true,
        status: true,
        pool: { select: { poolId: true, verticalId: true } },
      },
    }),
    prisma.revenueLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    // IHCP
    prisma.hallContribution.aggregate({ _sum: { amount: true } }),
    prisma.hallContribution.aggregate({ _sum: { repaidAmount: true } }),
    prisma.hallContribution.count({ where: { status: "active" } }),
    prisma.hall.aggregate({ _sum: { ihcpBalance: true } }),
    // Marketplace
    prisma.ownershipListing.count({ where: { status: "active" } }),
    prisma.inventoryItem.count({ where: { status: "active" } }),
    prisma.hallTreasuryTransaction.aggregate({
      where: { type: "marketplace_fee" },
      _sum: { amount: true },
    }),
    prisma.ownershipListing.aggregate({
      where: { status: "pending" },
      _sum: { totalPrice: true },
    }),
    prisma.ownershipListing.aggregate({
      where: { status: "completed" },
      _sum: { totalPrice: true },
    }),
    prisma.inventoryOrder.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
    }),
    // Oracle tiers
    prisma.oracleStanding.count({ where: { tier: "prophet" } }),
    prisma.oracleStanding.count({ where: { tier: "oracle" } }),
    prisma.oracleStanding.count({ where: { tier: "seer" } }),
    prisma.oracleStanding.count({ where: { tier: "novice" } }),
  ]);

  return {
    totalUsers,
    totalAdmins,
    totalPools,
    activePools,
    filledPools,
    totalCommitted: totalCommittedAgg._sum.amountCommitted ?? 0,
    totalRevenue: totalRevenueAgg._sum.amount ?? 0,
    totalDividendsDistributed: totalDividendsAgg._sum.totalAmount ?? 0,
    pendingKyc,
    pendingWithdrawals,
    activeHalls,
    hallsInWarning: hallsWarning,
    hallsInLiquidation: hallsLiquidation,
    totalWorkers,
    activeForecasts,
    totalOraclePoints: totalOraclePoints._sum.totalPoints ?? 0,
    currentCycle: currentCycle
      ? {
          id: currentCycle.id,
          continent: currentCycle.continent,
          phase: currentCycle.phase,
          startAt: currentCycle.startAt,
          endAt: currentCycle.endAt,
          winnerPoolId: currentCycle.winnerPoolId,
        }
      : null,
    pirByPillar,
    recentAuditLogs,
    recentSecurityLogs,
    topHallsBySri: topHalls,
    revenueThisMonth: revenueThisMonthAgg._sum.amount ?? 0,
    newUsersThisMonth,
    // PHASE 4
    ihcpStats: {
      totalContributed: ihcpContributedAgg._sum.amount ?? 0,
      totalRepaid: ihcpRepaidAgg._sum.repaidAmount ?? 0,
      activeContributions: activeIhcpCount,
      totalIhcpBalance: totalIhcpBalanceAgg._sum.ihcpBalance ?? 0,
    },
    marketplaceStats: {
      activeOwnershipListings,
      activeInventoryItems,
      totalFeesCollected: totalFeesAgg._sum.amount ?? 0,
      escrowHeld: escrowHeldAgg._sum.totalPrice ?? 0,
      ownershipVolume: ownershipVolumeAgg._sum.totalPrice ?? 0,
      inventoryVolume: inventoryVolumeAgg._sum.amount ?? 0,
    },
    oracleBreakdown: {
      prophets: oracleProphets,
      oracles: oracleOracles,
      seers: oracleSeers,
      novices: oracleNovices,
    },
  };
}

// ─── Page ────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  // Auth fortress — verify admin session
  const cookieStore = await cookies();
  const token = cookieStore.get("ledger_session")?.value;
  if (!token) redirect("/enter?redirect=/admin/dashboard");

  const session = await verifyToken(token);
  if (!session || session.role !== "admin") redirect("/enter?redirect=/admin/dashboard");

  const primary = isPrimaryAdmin(session);
  const data = await getDashboardData();

  const ihcpRepaymentRate =
    data.ihcpStats.totalContributed > 0
      ? Math.round((data.ihcpStats.totalRepaid / data.ihcpStats.totalContributed) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">8th Ledger Command Center</h1>
              <p className="text-xs text-slate-500">
                {primary ? "Primary Admin Access — 6-Factor Fortress Active" : "Admin Access — 3-Factor Verified"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-400 text-xs font-mono">
              {session.ledgerId}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* ─── Top Stats Row ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Sovereigns"
            value={formatNumber(data.totalUsers)}
            sub={`+${formatNumber(data.newUsersThisMonth)} this month`}
            trend="up"
            color="cyan"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            label="Active Pools"
            value={`${formatNumber(data.activePools)} / ${formatNumber(data.totalPools)}`}
            sub={`${formatNumber(data.filledPools)} filled`}
            trend="up"
            color="violet"
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Total Committed"
            value={formatCurrency(data.totalCommitted)}
            sub={`${formatCurrency(data.totalRevenue)} revenue lifetime`}
            trend="up"
            color="emerald"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Revenue This Month"
            value={formatCurrency(data.revenueThisMonth)}
            sub={`${formatCurrency(data.totalDividendsDistributed)} dividends lifetime`}
            trend="up"
            color="amber"
          />
        </div>

        {/* ─── Alert Bar ─────────────────────────────────── */}
        {(data.pendingKyc > 0 || data.pendingWithdrawals > 0 || data.hallsInWarning > 0 || data.hallsInLiquidation > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.pendingKyc > 0 && (
              <AlertCard
                icon={<FileCheck className="w-4 h-4" />}
                count={data.pendingKyc}
                label="KYC Pending Review"
                href="/admin/kyc"
                color="amber"
              />
            )}
            {data.pendingWithdrawals > 0 && (
              <AlertCard
                icon={<CreditCard className="w-4 h-4" />}
                count={data.pendingWithdrawals}
                label="Withdrawal Requests"
                href="/admin/withdrawals"
                color="cyan"
              />
            )}
            {data.hallsInWarning > 0 && (
              <AlertCard
                icon={<AlertTriangle className="w-4 h-4" />}
                count={data.hallsInWarning}
                label="Halls in Warning"
                href="/admin/halls"
                color="orange"
              />
            )}
            {data.hallsInLiquidation > 0 && (
              <AlertCard
                icon={<Siren className="w-4 h-4" />}
                count={data.hallsInLiquidation}
                label="Halls Liquidating"
                href="/admin/halls"
                color="red"
              />
            )}
          </div>
        )}

        {/* ─── PHASE 4: IHCP + Marketplace Stats Row ─────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<PiggyBank className="w-5 h-5" />}
            label="IHCP Contributed"
            value={formatCurrency(data.ihcpStats.totalContributed)}
            sub={`${formatCurrency(data.ihcpStats.totalRepaid)} repaid · ${ihcpRepaymentRate}% rate`}
            trend="up"
            color="emerald"
          />
          <StatCard
            icon={<HandCoins className="w-5 h-5" />}
            label="IHCP Active Balance"
            value={formatCurrency(data.ihcpStats.totalIhcpBalance)}
            sub={`${formatNumber(data.ihcpStats.activeContributions)} active contributions`}
            trend="neutral"
            color="cyan"
          />
          <StatCard
            icon={<ShoppingCart className="w-5 h-5" />}
            label="Marketplace Listings"
            value={`${formatNumber(data.marketplaceStats.activeOwnershipListings)}`}
            sub={`${formatNumber(data.marketplaceStats.activeInventoryItems)} inventory items`}
            trend="up"
            color="violet"
          />
          <StatCard
            icon={<Percent className="w-5 h-5" />}
            label="Marketplace Fees"
            value={formatCurrency(data.marketplaceStats.totalFeesCollected)}
            sub={`${formatCurrency(data.marketplaceStats.escrowHeld)} in escrow`}
            trend="up"
            color="amber"
          />
        </div>

        {/* ─── Main Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meridian Cycle */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-white">Meridian Cycle</h2>
                </div>
                <Link
                  href="/admin/meridian"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  Manage <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-6">
                {data.currentCycle ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white capitalize">{data.currentCycle.continent}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Cycle {data.currentCycle.id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border bg-slate-900/50 ${getPhaseColor(data.currentCycle.phase)} border-current`}>
                        {getPhaseIcon(data.currentCycle.phase)}
                        <span className="text-sm font-semibold capitalize">{data.currentCycle.phase}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{
                          width: `${Math.max(
                            5,
                            Math.min(
                              100,
                              ((new Date().getTime() - new Date(data.currentCycle.startAt).getTime()) /
                                (new Date(data.currentCycle.endAt).getTime() - new Date(data.currentCycle.startAt).getTime())) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Started {timeAgo(data.currentCycle.startAt)}</span>
                      <span>Ends {timeAgo(data.currentCycle.endAt)}</span>
                    </div>
                    {data.currentCycle.winnerPoolId && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400">
                          Winner forged: <span className="font-mono">{data.currentCycle.winnerPoolId}</span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active Meridian Cycle</p>
                    {primary && (
                      <Link
                        href="/admin/meridian"
                        className="mt-3 inline-block px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
                      >
                        Initialize Cycle
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* PIR Allocation */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Protocol Infrastructure Reserve</h2>
                </div>
                <span className="text-xs text-slate-500">
                  {formatCurrency(data.pirByPillar.reduce((a, b) => a + (b._sum.amount ?? 0), 0))} total allocated
                </span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.pirByPillar.map((p) => (
                    <div
                      key={p.pillar}
                      className={`p-4 rounded-xl border ${getPillarColor(p.pillar)}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getPillarIcon(p.pillar)}
                        <span className="text-xs font-semibold capitalize">{p.pillar}</span>
                      </div>
                      <p className="text-lg font-bold">{formatCurrency(p._sum.amount ?? 0)}</p>
                      <p className="text-xs opacity-70 mt-0.5">
                        {formatCurrency(p._sumSpent?.spent ?? 0)} spent
                      </p>
                    </div>
                  ))}
                  {data.pirByPillar.length === 0 && (
                    <div className="col-span-full text-center py-6 text-slate-500 text-sm">
                      No PIR allocations recorded yet
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Top Halls by SRI */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-400" />
                  <h2 className="text-sm font-semibold text-white">Top Halls by SRI</h2>
                </div>
                <Link href="/admin/halls" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-800/40">
                {data.topHallsBySri.map((hall) => (
                  <div key={hall.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        hall.sriScore >= 90 ? "bg-amber-500/10 text-amber-400" :
                        hall.sriScore >= 75 ? "bg-slate-700 text-slate-300" :
                        hall.sriScore >= 60 ? "bg-slate-800 text-slate-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {hall.sriScore}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{hall.name}</p>
                        <p className="text-xs text-slate-500">
                          {hall.pool?.poolId} · Class {hall.hallClass ?? "I"} · {hall.status}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/halls/${hall.id}`}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
                {data.topHallsBySri.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-500 text-sm">No live halls yet</div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-4 grid grid-cols-1 gap-2">
                <QuickAction href="/admin/pool/create" icon={<Package className="w-4 h-4" />} label="Forge New Pool" />
                <QuickAction href="/admin/meridian" icon={<Globe className="w-4 h-4" />} label="Manage Meridian" />
                <QuickAction href="/admin/operations" icon={<ScrollText className="w-4 h-4" />} label="Operations Center" />
                <QuickAction href="/admin/marketplace" icon={<ShoppingCart className="w-4 h-4" />} label="Marketplace" />
                <QuickAction href="/admin/users" icon={<Users className="w-4 h-4" />} label="Sovereign Registry" />
                <QuickAction href="/admin/kyc" icon={<FileCheck className="w-4 h-4" />} label="Review KYC" badge={data.pendingKyc > 0 ? data.pendingKyc : undefined} />
                <QuickAction href="/admin/withdrawals" icon={<CreditCard className="w-4 h-4" />} label="Withdrawals" badge={data.pendingWithdrawals > 0 ? data.pendingWithdrawals : undefined} />
                {primary && (
                  <QuickAction href="/admin/economy" icon={<Landmark className="w-4 h-4" />} label="PIR Economy" color="cyan" />
                )}
              </div>
            </section>

            {/* PHASE 4: Enhanced Oracle Standing */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanEye className="w-4 h-4 text-violet-400" />
                  <h2 className="text-sm font-semibold text-white">Oracle Standing</h2>
                </div>
                <span className="text-xs text-slate-500">{data.activeForecasts} active</span>
              </div>
              <div className="p-6">
                <p className="text-3xl font-bold text-white text-center">{formatNumber(data.totalOraclePoints)}</p>
                <p className="text-xs text-slate-500 mt-1 text-center">Total standing points across all sovereigns</p>
                
                <div className="mt-5 space-y-3">
                  <OracleTierRow
                    label="Prophets"
                    count={data.oracleBreakdown.prophets}
                    color="bg-amber-400"
                    icon="👑"
                  />
                  <OracleTierRow
                    label="Oracles"
                    count={data.oracleBreakdown.oracles}
                    color="bg-slate-300"
                    icon="🔮"
                  />
                  <OracleTierRow
                    label="Seers"
                    count={data.oracleBreakdown.seers}
                    color="bg-orange-400"
                    icon="👁️"
                  />
                  <OracleTierRow
                    label="Novices"
                    count={data.oracleBreakdown.novices}
                    color="bg-slate-600"
                    icon="🌱"
                  />
                </div>
              </div>
            </section>

            {/* PHASE 4: IHCP Mini-Widget */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">IHCP Overview</h2>
                </div>
                <Link href="/admin/operations" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  Details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Contributed</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(data.ihcpStats.totalContributed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Repaid</span>
                  <span className="text-sm font-semibold text-emerald-400">{formatCurrency(data.ihcpStats.totalRepaid)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${ihcpRepaymentRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Repayment Rate</span>
                  <span className="text-emerald-400 font-medium">{ihcpRepaymentRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Active Contributions</span>
                  <span className="text-sm font-semibold text-cyan-400">{formatNumber(data.ihcpStats.activeContributions)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Hall Balances</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(data.ihcpStats.totalIhcpBalance)}</span>
                </div>
              </div>
            </section>

            {/* Recent Audit Trail */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Recent Audit Trail
                </h2>
              </div>
              <div className="divide-y divide-slate-800/40">
                {data.recentAuditLogs.map((log) => (
                  <div key={log.id} className="px-6 py-3 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-slate-300 line-clamp-1">{log.description}</p>
                      <span className="text-[10px] text-slate-600 whitespace-nowrap">{timeAgo(log.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">
                        {log.eventType}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono truncate max-w-[120px]">
                        {log.txHash.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                ))}
                {data.recentAuditLogs.length === 0 && (
                  <div className="px-6 py-6 text-center text-slate-500 text-xs">No audit entries yet</div>
                )}
              </div>
            </section>

            {/* Security Log */}
            <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/60">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  Security Events
                </h2>
              </div>
              <div className="divide-y divide-slate-800/40">
                {data.recentSecurityLogs.map((log) => (
                  <div key={log.id} className="px-6 py-3 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Ban className="w-3 h-3 text-red-400" />
                        )}
                        <span className="text-xs text-slate-300">{log.action}</span>
                      </div>
                      <span className="text-[10px] text-slate-600">{timeAgo(log.createdAt)}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                      {log.ledgerId} · {log.ipAddress}
                    </p>
                  </div>
                ))}
                {data.recentSecurityLogs.length === 0 && (
                  <div className="px-6 py-6 text-center text-slate-500 text-xs">No security events</div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* ─── Bottom: System Overview ───────────────────── */}
        <section className="rounded-2xl border border-slate-800/60 bg-[#0f0f16] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-cyan-400" />
              8th Ledger Empire Overview
            </h2>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <OverviewItem label="Active Halls" value={formatNumber(data.activeHalls)} />
            <OverviewItem label="Total Workers" value={formatNumber(data.totalWorkers)} />
            <OverviewItem label="Admins" value={formatNumber(data.totalAdmins)} />
            <OverviewItem label="KYC Verified" value={formatNumber(data.totalUsers - data.pendingKyc)} />
            <OverviewItem label="Dividends Lifetime" value={formatCurrency(data.totalDividendsDistributed)} />
            <OverviewItem label="8th Ledger Tithe" value="20%" />
            <OverviewItem label="Marketplace Vol" value={formatCurrency(data.marketplaceStats.ownershipVolume + data.marketplaceStats.inventoryVolume)} />
            <OverviewItem label="IHCP Balance" value={formatCurrency(data.ihcpStats.totalIhcpBalance)} />
            <OverviewItem label="Verticals" value="11" />
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "neutral";
  color: "cyan" | "violet" | "emerald" | "amber" | "red";
}) {
  const colorMap = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Activity;

  return (
    <div className={`p-5 rounded-2xl border ${colorMap[color]} bg-[#0f0f16]`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-slate-900/50">{icon}</div>
        <TrendIcon className="w-4 h-4 opacity-50" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      <p className="text-[11px] text-slate-600 mt-2">{sub}</p>
    </div>
  );
}

function AlertCard({
  icon,
  count,
  label,
  href,
  color,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  href: string;
  color: "amber" | "cyan" | "orange" | "red";
}) {
  const colorMap = {
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-xl border ${colorMap[color]} transition-colors`}
    >
      <div className="p-2 rounded-lg bg-slate-900/50">{icon}</div>
      <div>
        <p className="text-lg font-bold">{count}</p>
        <p className="text-xs opacity-80">{label}</p>
      </div>
      <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
  badge,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  color?: "cyan";
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/40 hover:border-slate-700 transition-all group ${
        color === "cyan" ? "hover:border-cyan-500/30" : ""
      }`}
    >
      <span className={`${color === "cyan" ? "text-cyan-400" : "text-slate-400"} group-hover:text-white transition-colors`}>
        {icon}
      </span>
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
          {badge}
        </span>
      )}
      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
    </Link>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-slate-900/30 border border-slate-800/40">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

// PHASE 4: Oracle tier breakdown row
function OracleTierRow({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, count > 0 ? 100 : 0)}%` }} />
        </div>
        <span className="text-xs font-semibold text-white w-8 text-right">{count}</span>
      </div>
    </div>
  );
}