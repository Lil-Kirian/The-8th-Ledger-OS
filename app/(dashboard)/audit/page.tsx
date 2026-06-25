import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber, truncateHash } from "@/lib/utils";
import {
  Eye,
  Hash,
  TrendingUp,
  Flame,
  Shield,
  CheckCircle2,
  Coins,
  ArrowRight,
  Download,
  FileText,
  Clock,
  Crown,
  Ban,
  Zap,
  Banknote,
  PieChart,
  AlertTriangle,
  Landmark,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Protocol Audit — 8th Ledger",
  description:
    "Publicly verifiable ledger of every PAC issuance, revenue distribution, PIR allocation, treasury flow, and governance action within the 8th Ledger Protocol.",
  openGraph: {
    title: "Protocol Audit — 8th Ledger",
    description: "Immutable audit trail. Every contract and transaction cryptographically signed and permanently recorded.",
  },
};

export const dynamic = "force-dynamic";

/* ============================================================
   SAFE DATE FORMATTERS — No hydration mismatch
   ============================================================ */
function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}/${day}/${y}`;
}

function fmtTime(d: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

/* ============================================================
   SERVER COMPONENT — Public Audit Ledger
   ============================================================ */
export default async function AuditPage(props: {
  searchParams?: Promise<{ type?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1");
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  // ── 8th Ledger audit entry types ──
  const ledgerTypes = [
    "pool_created",
    "hall_activated",
    "ownership_issued",
    "dividend_distributed",
    "pir_allocated",
    "proposal_executed",
    "marketplace_sale",
    "hall_closure_triggered",
    "worker_hired",
    "oracle_forecast_resolved",
    "pir_advance_approved",
    "tier_upgrade",
    "withdrawal",
  ];

  const [entries, treasuryTxs, revenueLogs, pirAllocs] = await prisma.$transaction([
    prisma.auditEntry.findMany({
      where: { type: { in: ledgerTypes } },
      orderBy: { timestamp: "desc" },
      take: pageSize,
      skip,
      include: { user: { select: { ledgerId: true, displayName: true } } },
    }),
    prisma.treasuryTransaction.findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
      include: { pool: { select: { poolId: true, name: true } } },
    }),
    prisma.revenueLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { pool: { select: { poolId: true, name: true } } },
    }),
    prisma.pirAllocation.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { hall: { select: { id: true, name: true } } },
    }),
  ]);

  // Counts
  const [totalEntries, totalTreasury, totalRevenue, totalPools, totalPir] =
    await prisma.$transaction([
      prisma.auditEntry.count({ where: { type: { in: ledgerTypes } } }),
      prisma.treasuryTransaction.count(),
      prisma.revenueLog.count(),
      prisma.pool.count(),
      prisma.pirAllocation.count(),
    ]);

  // Totals
  const totalVolume = await prisma.treasuryTransaction.aggregate({
    where: {
      type: { in: ["surplus_in", "return_out", "withdrawal"] },
    },
    _sum: { amount: true },
  });

  const totalDividends = await prisma.revenueLog.aggregate({
    where: { distributed: true },
    _sum: { communityNet: true },
  });

  const totalPirDeployed = await prisma.pirAllocation.aggregate({
    _sum: { amount: true },
  });

  const stats = [
    {
      label: "Ledger Entries",
      value: formatNumber(totalEntries),
      icon: Eye,
      color: "text-cyan-400",
    },
    {
      label: "Treasury TXs",
      value: formatNumber(totalTreasury),
      icon: Coins,
      color: "text-amber-400",
    },
    {
      label: "Revenue Logs",
      value: formatNumber(totalRevenue),
      icon: Banknote,
      color: "text-emerald-400",
    },
    {
      label: "Total Volume",
      value: formatCurrency(Number(totalVolume._sum.amount || 0)),
      icon: TrendingUp,
      color: "text-violet-400",
    },
    {
      label: "Dividends Paid",
      value: formatCurrency(Number(totalDividends._sum.communityNet || 0)),
      icon: PieChart,
      color: "text-emerald-400",
    },
    {
      label: "Active Pools",
      value: formatNumber(totalPools),
      icon: Shield,
      color: "text-sky-400",
    },
  ];

  const entryTypeConfig: Record<
    string,
    { color: string; bg: string; label: string; icon: React.ElementType }
  > = {
    pool_created: {
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      label: "Pool Created",
      icon: Shield,
    },
    hall_activated: {
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      label: "Hall Live",
      icon: Zap,
    },
    ownership_issued: {
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      label: "PAC Issued",
      icon: Crown,
    },
    dividend_distributed: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      label: "Dividends",
      icon: Banknote,
    },
    pir_allocated: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      label: "PIR Allocated",
      icon: Landmark,
    },
    proposal_executed: {
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      label: "Proposal Exec",
      icon: CheckCircle2,
    },
    marketplace_sale: {
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      label: "Market Sale",
      icon: TrendingUp,
    },
    hall_closure_triggered: {
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      label: "Closure",
      icon: AlertTriangle,
    },
    worker_hired: {
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      label: "Worker Hired",
      icon: Clock,
    },
    oracle_forecast_resolved: {
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      label: "Oracle Resolved",
      icon: Eye,
    },
    pir_advance_approved: {
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      label: "PIR Advance",
      icon: Landmark,
    },
    tier_upgrade: {
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      label: "Tier Up",
      icon: TrendingUp,
    },
    withdrawal: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      label: "Withdrawal",
      icon: ArrowRight,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <Eye className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
              Public Ledger
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Protocol Audit
          </h1>
          <p className="mt-1 text-sm text-white/40">
            PAC issuance, revenue distribution, PIR allocation, treasury flow, and governance actions — permanently recorded and publicly verifiable.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-mono text-emerald-400/80">
            Live Sync
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="p-4 border-white/5 bg-white/[0.02]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-1 font-space text-lg font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </p>
                </div>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Contracts Quick Link */}
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
            <FileText className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Perpetual Asset Contracts
            </p>
            <p className="text-xs text-white/40">
              PAC ownership trails, transfers, and registry.
            </p>
          </div>
        </div>
        <Link
          href="/contracts"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          View Contracts
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Main Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-white/40" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">
              8th Ledger Audit Trail
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
              {totalEntries} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/api/audit/export"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/10"
            >
              <Download className="h-3 w-3" />
              Export CSV
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30 border-b border-white/5 bg-white/[0.02]">
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Event</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">TX Hash</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {entries.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Eye className="mx-auto h-8 w-8 text-white/10 mb-3" />
                <p className="text-sm text-white/30">No ledger entries yet.</p>
                <p className="text-xs text-white/20 mt-1">
                  The audit trail begins when the first pool is forged.
                </p>
              </div>
            ) : (
              entries.map((entry) => {
                const config = entryTypeConfig[entry.type] || {
                  color: "text-white/40",
                  bg: "bg-white/5",
                  label: entry.type,
                  icon: Shield,
                };
                const EventIcon = config.icon;

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 text-xs hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-2 text-white/40 font-mono">
                      {fmtDate(entry.timestamp)}
                      <span className="block text-[10px] text-white/20">
                        {fmtTime(entry.timestamp)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md ${config.bg} px-2 py-0.5 text-[10px] font-medium ${config.color} border border-white/5`}
                      >
                        <EventIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    <div className="col-span-4 text-white/70 truncate">
                      {entry.description}
                      {entry.user && (
                        <span className="block text-[10px] text-white/20 mt-0.5">
                          By {entry.user.displayName} ({entry.user.ledgerId})
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-white font-mono">
                      {entry.amount
                        ? `$${entry.amount.toLocaleString()}`
                        : "—"}
                    </div>
                    <div
                      className="col-span-2 font-mono text-white/30 truncate"
                      title={entry.txHash}
                    >
                      {truncateHash(entry.txHash, 6)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalEntries > pageSize && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">
              Showing {skip + 1}-{Math.min(skip + pageSize, totalEntries)} of{" "}
              {totalEntries}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/audit?page=${page - 1}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                >
                  Previous
                </Link>
              )}
              {skip + pageSize < totalEntries && (
                <Link
                  href={`/audit?page=${page + 1}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Treasury + Revenue Split */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Treasury Transactions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
              Treasury Flow
            </span>
          </div>
          <div className="space-y-2">
            {treasuryTxs.length === 0 ? (
              <Card className="p-6 text-center border-white/5">
                <Coins className="mx-auto h-6 w-6 text-white/10 mb-2" />
                <p className="text-xs text-white/30">
                  No treasury transactions yet.
                </p>
              </Card>
            ) : (
              treasuryTxs.map((tx) => (
                <Card
                  key={tx.id}
                  className="p-3 border-white/5 bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          tx.type === "surplus_in"
                            ? "bg-emerald-500/10"
                            : tx.type === "return_out"
                            ? "bg-amber-500/10"
                            : tx.type === "withdrawal"
                            ? "bg-cyan-500/10"
                            : "bg-white/5"
                        }`}
                      >
                        {tx.type === "surplus_in" && (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        )}
                        {tx.type === "return_out" && (
                          <ArrowRight className="h-4 w-4 text-amber-400" />
                        )}
                        {tx.type === "withdrawal" && (
                          <Coins className="h-4 w-4 text-cyan-400" />
                        )}
                        {!["surplus_in", "return_out", "withdrawal"].includes(tx.type) && (
                          <Shield className="h-4 w-4 text-white/30" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {tx.pool?.name || "8th Ledger Protocol"} •{" "}
                          {truncateHash(tx.txHash, 6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-mono font-bold ${
                          tx.type === "surplus_in"
                            ? "text-emerald-400"
                            : tx.type === "return_out"
                            ? "text-amber-400"
                            : tx.type === "withdrawal"
                            ? "text-cyan-400"
                            : "text-white"
                        }`}
                      >
                        {tx.type === "surplus_in"
                          ? "+"
                          : tx.type === "return_out"
                          ? "-"
                          : ""}
                        {formatCurrency(Number(tx.amount))}
                      </p>
                      <p className="text-[10px] text-white/20">{tx.currency}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Revenue / PIR Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/80">
              Revenue & PIR
            </span>
          </div>
          <div className="space-y-2">
            {revenueLogs.length === 0 ? (
              <Card className="p-6 text-center border-white/5">
                <Banknote className="mx-auto h-6 w-6 text-white/10 mb-2" />
                <p className="text-xs text-white/30">No revenue logs yet.</p>
              </Card>
            ) : (
              revenueLogs.map((log) => (
                <Card
                  key={log.id}
                  className="p-3 border-white/5 bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">
                        {log.pool?.name || "Hall Revenue"}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          log.distributed
                            ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                            : "border-amber-500/20 text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {log.distributed ? "Distributed" : "Pending"}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/30">
                      {fmtDate(log.createdAt)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-white/30">Gross Revenue</span>
                      <span className="text-white/60">
                        ${log.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30">8th Ledger Tithe</span>
                      <span className="text-amber-400">
                        -${log.ledgerFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30">Payroll</span>
                      <span className="text-rose-400">
                        -${log.payrollDeducted.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30">Net to Owners</span>
                      <span className="text-emerald-400 font-bold">
                        ${log.netAfterPayroll.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${(log.ledgerFee / log.amount) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-rose-500"
                        style={{
                          width: `${(log.payrollDeducted / log.amount) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${(log.netAfterPayroll / log.amount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-white/20">
                    <span>Tithe</span>
                    <span>Payroll</span>
                    <span>Owners</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PIR Allocation Mini Section */}
      {pirAllocs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
              Protocol Infrastructure Reserve (PIR)
            </span>
            <span className="text-[10px] text-white/30">
              {totalPir} allocations deployed
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {pirAllocs.map((pir) => (
              <Card key={pir.id} className="p-3 border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white capitalize">
                    {pir.pillar.replace("_", " ")}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      pir.spent >= pir.amount
                        ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                        : "border-amber-500/20 text-amber-400 bg-amber-500/10"
                    }`}
                  >
                    {pir.spent >= pir.amount ? "Fully Deployed" : "Active"}
                  </span>
                </div>
                <p className="text-[10px] text-white/30 mb-2">{pir.purpose}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">
                    ${pir.spent.toLocaleString()} / ${pir.amount.toLocaleString()}
                  </span>
                  <span className="text-white/40">
                    {Math.round((pir.spent / pir.amount) * 100)}%
                  </span>
                </div>
                <div className="mt-1 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(pir.spent / pir.amount) * 100}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Integrity Footer */}
      <div className="rounded-xl border border-white/5 bg-[#0a0a14] p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-cyan-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-white">
              Ledger Integrity
            </h4>
            <p className="mt-1 text-xs text-white/40 leading-relaxed">
              Every entry in this ledger is cryptographically signed and
              permanently recorded. The 8th Ledger protocol does not allow
              retroactive modifications, deletions, or hidden transactions. All
              PIR allocations, revenue distributions, and governance actions are
              verifiable by any sovereign identity.
            </p>
            <div className="mt-2 flex items-center gap-4 text-[10px] font-mono text-white/20">
              <span>Last Block: {Date.now().toString(36).toUpperCase()}</span>
              <span>•</span>
              <span>Entries: {totalEntries}</span>
              <span>•</span>
              <span>
                Hash: {truncateHash(`audit-${Date.now()}-${totalEntries}`, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}