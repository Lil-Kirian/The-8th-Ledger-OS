"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  Radio,
  Globe,
  Activity,
  ChevronRight,
  TrendingUp,
  Clock,
  Users,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

// ── Types ───────────────────────────────────────────────────

interface AgoraStats {
  pendingSuggestions: number;
  answeredQuestions: number;
  totalSuggestions: number;
  activeForecasts: number;
  systemStatus: "BEATING" | "RACING" | "FLAT";
  systemScore: number;
}

// ── Fetcher ─────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Chamber Card ────────────────────────────────────────────

function ChamberCard({
  href,
  icon: Icon,
  title,
  subtitle,
  stat,
  statLabel,
  color,
  delay,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  stat: string;
  statLabel: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link href={href} className="group block h-full">
        <div className="relative h-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.04]">
          <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl ${color}`} />
          
          <div className="flex items-start justify-between">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} bg-opacity-10`}>
              <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
            </div>
            <ArrowUpRight className="h-5 w-5 text-white/20 transition-all group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {title}
            </h3>
            <p className="mt-1 text-sm text-white/40">{subtitle}</p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className={`text-2xl font-bold ${color.replace("bg-", "text-")}`}>
              {stat}
            </span>
            <span className="text-xs text-white/30 uppercase tracking-wider">{statLabel}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Status Badge ────────────────────────────────────────────

function StatusBadge({ status, score }: { status: string; score: number }) {
  const colors = {
    BEATING: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RACING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FLAT: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${colors[status as keyof typeof colors] || colors.FLAT}`}>
      <span className={`h-2 w-2 rounded-full animate-pulse ${status === "BEATING" ? "bg-emerald-400" : status === "RACING" ? "bg-amber-400" : "bg-rose-400"}`} />
      {status} — {score}/100
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function AgoraPage() {
  const { data: pulseData, error: pulseError } = useSWR("/api/agora/pulse", fetcher, {
    refreshInterval: 30000,
  });
  const { data: suggestionsData } = useSWR("/api/agora/suggestions?limit=3&sort=trending", fetcher);
  const { data: qaData } = useSWR("/api/agora/qa?limit=3&sort=unanswered_first", fetcher);

  const pulse = pulseData?.pulse;
  const system = pulse?.system;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 text-cyan-400/60 mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.2em]">The Public Square</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              The Agora
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/40">
              Voice. Question. Witness. The sovereign square where the community writes the law — 
              and the 8th Ledger enforces it.
            </p>
            
            {system && (
              <div className="mt-6">
                <StatusBadge status={system.status} score={system.score} />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { label: "Active Pools", value: pulse?.pools?.active ?? "—", icon: TrendingUp },
              { label: "Live Halls", value: pulse?.halls?.live ?? "—", icon: Users },
              { label: "Pending Suggestions", value: pulse?.agora?.pendingSuggestions ?? "—", icon: MessageSquare },
              { label: "This Month", value: pulse?.display?.dividendsThisMonthFormatted ?? "—", icon: Activity },
              { label: "Meridian Phase", value: pulse?.meridian?.phase ?? "—", icon: Clock },
              { label: "Oracle Forecasts", value: pulse?.oracle?.activeForecasts ?? "—", icon: Sparkles },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-3"
              >
                <stat.icon className="h-4 w-4 text-cyan-500/50" />
                <div>
                  <div className="text-sm font-semibold text-white">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Chambers Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">The Five Chambers</h2>
          <span className="text-xs text-white/30">All chambers are public within the sovereign system</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ChamberCard
            href="/agora/suggestions"
            icon={MessageSquare}
            title="The Stoa"
            subtitle="Suggest assets. Upvote. Downvote. Signal what the 8th Ledger should forge next."
            stat={String(pulse?.agora?.pendingSuggestions ?? "0")}
            statLabel="Pending"
            color="bg-cyan-500"
            delay={0}
          />
          <ChamberCard
            href="/agora/archives"
            icon={BookOpen}
            title="The Archives"
            subtitle="The Scribe answers from the Codex. Heralds moderate. The Architect speaks strategically."
            stat={String(pulse?.agora?.answeredQuestions ?? "0")}
            statLabel="Answered"
            color="bg-violet-500"
            delay={0.1}
          />
          <ChamberCard
            href="/agora/relay"
            icon={Radio}
            title="The Relay"
            subtitle="Read-only hall transparency. See what halls vote on — without seeing inside."
            stat={String(pulse?.governance?.proposals24h ?? "0")}
            statLabel="24h Proposals"
            color="bg-emerald-500"
            delay={0.2}
          />
          <ChamberCard
            href="/agora/map"
            icon={Globe}
            title="The Meridian Map"
            subtitle="Current continent. Next rotation. Past winners. The cycle of global asset distribution."
            stat={pulse?.meridian?.continent ?? "—"}
            statLabel="Current"
            color="bg-amber-500"
            delay={0.3}
          />
          <ChamberCard
            href="/agora/pulse"
            icon={Activity}
            title="The Pulse"
            subtitle="System health. Capital flow. Governance momentum. The heartbeat of the empire."
            stat={system?.status ?? "—"}
            statLabel="Status"
            color="bg-rose-500"
            delay={0.4}
          />
        </div>

        {/* Recent Activity Preview */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Trending Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Trending Suggestions</h3>
              <Link href="/agora/suggestions" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {suggestionsData?.suggestions?.length ? (
                suggestionsData.suggestions.map((s: unknown) => (
                  <div key={s.id} className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-sm">
                      {s.score > 0 ? "+" : ""}{s.score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-white truncate">{s.title}</h4>
                      <p className="mt-1 text-xs text-white/30">
                        {s.continent} · {s.vertical} · by {s.author.displayName}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      s.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                      s.status === "under_review" ? "bg-amber-500/10 text-amber-400" :
                      s.status === "rejected" ? "bg-rose-500/10 text-rose-400" :
                      "bg-white/5 text-white/40"
                    }`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-sm">No suggestions yet</div>
              )}
            </div>
          </motion.div>

          {/* Unanswered Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Awaiting Answers</h3>
              <Link href="/agora/archives" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {qaData?.questions?.length ? (
                qaData.questions.map((q: unknown) => (
                  <div key={q.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-sm text-white/80 line-clamp-2">{q.question}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-white/30">
                      <span>{q.author.displayName}</span>
                      <span>·</span>
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                      {q.status === "answered" && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400">Answered by {q.answerer?.displayName || "The Scribe"}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/20 text-sm">All questions answered</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}