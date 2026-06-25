"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Building2,
  Wallet,
  Gavel,
  Globe,
  Eye,
  MessageSquare,
  BookOpen,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

// ── Fetcher ─────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Metric Card ─────────────────────────────────────────────

function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  color,
  delay,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "flat";
  color: string;
  delay: number;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-white/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
    >
      <div className="flex items-center justify-between">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-4 w-4 ${color.replace("bg-", "text-")}`} />
        </div>
        {trend && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-white/30 uppercase tracking-wider mt-1">{title}</div>
      </div>
      <div className="mt-2 text-xs text-white/20">{subtext}</div>
    </motion.div>
  );
}

// ── Section Header ──────────────────────────────────────────

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-cyan-400/60" />
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function PulsePage() {
  const { data, error, isLoading } = useSWR("/api/agora/pulse", fetcher, {
    refreshInterval: 30000,
  });

  const pulse = data?.pulse;
  const display = data?.display;

  const statusConfig = {
    BEATING: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "Capital flowing. Governance active. Empire expanding." },
    RACING: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Momentum building. Some halls need attention." },
    FLAT: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", desc: "Slow activity. Consider reviewing strategy." },
  };

  const status = pulse?.system?.status || "FLAT";
  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/agora" className="text-white/30 hover:text-white/60">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-rose-400/60">The Agora</span>
          </div>
          <h1 className="text-3xl font-bold text-white">The Pulse</h1>
          <p className="mt-1 text-white/40">
            System health. Capital flow. Governance momentum. The heartbeat of the 8th Ledger.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="space-y-8">
            <div className="h-32 rounded-2xl bg-white/[0.02] animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <p className="mt-4 text-white/40">Failed to load pulse data</p>
          </div>
        ) : (
          <>
            {/* System Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 rounded-2xl border ${config.border} ${config.bg} p-8`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className={`h-6 w-6 ${config.color}`} />
                    <span className={`text-2xl font-bold ${config.color}`}>{status}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-white/40">Score {pulse?.system?.score}/100</span>
                  </div>
                  <p className="text-sm text-white/40">{config.desc}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/20">
                  <Clock className="h-3 w-3" />
                  Updated {new Date(data?.meta?.cachedAt).toLocaleTimeString()}
                  <span className="mx-1">·</span>
                  Auto-refresh 30s
                </div>
              </div>
            </motion.div>

            {/* Pools */}
            <SectionHeader title="Asset Pools" icon={Building2} />
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Active"
                value={pulse?.pools?.active ?? "—"}
                subtext={`${pulse?.pools?.filling ?? 0} filling · ${pulse?.pools?.forged ?? 0} forged`}
                icon={Building2}
                color="bg-cyan-500"
                delay={0}
              />
              <MetricCard
                title="Total Committed"
                value={display?.totalCommittedFormatted ?? "—"}
                subtext={`${pulse?.pools?.targetProgress ?? 0}% of target filled`}
                icon={Wallet}
                trend="up"
                color="bg-emerald-500"
                delay={0.05}
              />
              <MetricCard
                title="Participants"
                value={pulse?.pools?.totalParticipants ?? "—"}
                subtext="Active sovereigns across all pools"
                icon={Users}
                color="bg-violet-500"
                delay={0.1}
              />
              <MetricCard
                title="Target Progress"
                value={`${pulse?.pools?.targetProgress ?? 0}%`}
                subtext="Across all active pools"
                icon={TrendingUp}
                trend={pulse?.pools?.targetProgress > 50 ? "up" : "flat"}
                color="bg-amber-500"
                delay={0.15}
              />
            </div>

            {/* Halls */}
            <SectionHeader title="Sovereign Halls" icon={Building2} />
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Live"
                value={pulse?.halls?.live ?? "—"}
                subtext={`${pulse?.halls?.mature ?? 0} mature · ${pulse?.halls?.total ?? 0} total`}
                icon={Building2}
                color="bg-cyan-500"
                delay={0.2}
              />
              <MetricCard
                title="Avg SRI"
                value={pulse?.halls?.avgSri ?? "—"}
                subtext="Sovereign Reputation Index"
                icon={Activity}
                trend={pulse?.halls?.avgSri > 60 ? "up" : "flat"}
                color="bg-emerald-500"
                delay={0.25}
              />
              <MetricCard
                title="Platinum"
                value={pulse?.halls?.platinum ?? "—"}
                subtext={`${pulse?.halls?.gold ?? 0} gold tier halls`}
                icon={TrendingUp}
                color="bg-purple-500"
                delay={0.3}
              />
              <MetricCard
                title="At Risk"
                value={(pulse?.halls?.warning ?? 0) + (pulse?.halls?.liquidation ?? 0)}
                subtext={`${pulse?.halls?.warning ?? 0} warning · ${pulse?.halls?.liquidation ?? 0} liquidation`}
                icon={AlertCircle}
                trend={(pulse?.halls?.warning ?? 0) > 0 ? "down" : "flat"}
                color="bg-rose-500"
                delay={0.35}
              />
            </div>

            {/* Capital */}
            <SectionHeader title="Capital Flow" icon={Wallet} />
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="This Month"
                value={display?.dividendsThisMonthFormatted ?? "—"}
                subtext={`${pulse?.capital?.changePercent ?? 0}% vs last month`}
                icon={Wallet}
                trend={pulse?.capital?.changePercent > 0 ? "up" : pulse?.capital?.changePercent < 0 ? "down" : "flat"}
                color="bg-emerald-500"
                delay={0.4}
              />
              <MetricCard
                title="Last Month"
                value={display?.dividendsLastMonthFormatted ?? "—"}
                subtext="Previous period comparison"
                icon={Wallet}
                color="bg-cyan-500"
                delay={0.45}
              />
              <MetricCard
                title="All Time"
                value={display?.totalDistributedFormatted ?? "—"}
                subtext="Total distributed since genesis"
                icon={TrendingUp}
                color="bg-violet-500"
                delay={0.5}
              />
              <MetricCard
                title="Change"
                value={`${pulse?.capital?.changePercent > 0 ? "+" : ""}${pulse?.capital?.changePercent ?? 0}%`}
                subtext="Month-over-month growth"
                icon={Activity}
                trend={pulse?.capital?.changePercent > 0 ? "up" : "flat"}
                color="bg-amber-500"
                delay={0.55}
              />
            </div>

            {/* Governance */}
            <SectionHeader title="Governance" icon={Gavel} />
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Proposals (24h)"
                value={pulse?.governance?.proposals24h ?? "—"}
                subtext={`${pulse?.governance?.activeProposals ?? 0} active proposals`}
                icon={Gavel}
                color="bg-cyan-500"
                delay={0.6}
              />
              <MetricCard
                title="Votes (24h)"
                value={pulse?.governance?.votes24h ?? "—"}
                subtext="Capital-weighted ballots cast"
                icon={Users}
                color="bg-emerald-500"
                delay={0.65}
              />
              <MetricCard
                title="New Owners"
                value={pulse?.governance?.newOwners24h ?? "—"}
                subtext="New PACs created in 24h"
                icon={TrendingUp}
                color="bg-violet-500"
                delay={0.7}
              />
              <MetricCard
                title="Active Proposals"
                value={pulse?.governance?.activeProposals ?? "—"}
                subtext="Currently open for voting"
                icon={Clock}
                color="bg-amber-500"
                delay={0.75}
              />
            </div>

            {/* Meridian + Oracle + Agora */}
            <div className="grid gap-8 lg:grid-cols-3">
              <div>
                <SectionHeader title="Meridian Cycle" icon={Globe} />
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="text-2xl font-bold text-white capitalize">
                    {pulse?.meridian?.phase?.replace("_", " ") ?? "—"}
                  </div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mt-1">
                    {pulse?.meridian?.continent?.replace("_", " ") ?? "—"}
                  </div>
                  <div className="mt-3 text-sm text-white/40">
                    {display?.meridianTimeRemainingFormatted
                      ? `${display.meridianTimeRemainingFormatted} remaining`
                      : "No active cycle"}
                  </div>
                  <div className="mt-2 text-xs text-white/20">
                    {pulse?.meridian?.competingPools ?? 0} competing pools · {pulse?.meridian?.totalVotes ?? 0} votes
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader title="Oracle" icon={Eye} />
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="text-2xl font-bold text-white">
                    {pulse?.oracle?.activeForecasts ?? "—"}
                  </div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mt-1">Active Forecasts</div>
                  <div className="mt-3 text-sm text-white/40">
                    {pulse?.oracle?.totalPredictions ?? 0} total predictions
                  </div>
                  <div className="mt-2 text-xs text-white/20">
                    {pulse?.oracle?.totalStandingPoints ?? 0} standing points · Top tier: {pulse?.oracle?.topTier ?? "—"}
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader title="Agora" icon={MessageSquare} />
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="text-2xl font-bold text-white">
                    {pulse?.agora?.pendingSuggestions ?? "—"}
                  </div>
                  <div className="text-xs text-white/30 uppercase tracking-wider mt-1">Pending Suggestions</div>
                  <div className="mt-3 text-sm text-white/40">
                    {pulse?.agora?.answeredQuestions ?? 0} answered questions
                  </div>
                  <div className="mt-2 text-xs text-white/20">
                    {pulse?.agora?.totalSuggestions ?? 0} total suggestions submitted
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}