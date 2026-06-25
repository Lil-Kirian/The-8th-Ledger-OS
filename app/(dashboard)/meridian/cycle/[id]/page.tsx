// app/(dashboard)/meridian/cycle/[id]/page.tsx
// 8th Ledger — Cycle Detail: The full anatomy of a Meridian rotation.

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Clock,
  Trophy,
  BarChart3,
  MapPin,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Vote,
  Flame,
  Eye,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CONTINENTS: Record<string, { name: string; emoji: string }> = {
  africa: { name: "Africa", emoji: "🌍" },
  asia: { name: "Asia", emoji: "🌏" },
  europe: { name: "Europe", emoji: "🌍" },
  americas: { name: "Americas", emoji: "🌎" },
  middle_east: { name: "Middle East", emoji: "🌍" },
  oceania: { name: "Oceania", emoji: "🌏" },
};

const VERTICAL_META: Record<string, { label: string; icon: string; color: string }> = {
  ledgerprop: { label: "LedgerProp", icon: "🏠", color: "text-emerald-400" },
  ledgerauto: { label: "LedgerAuto", icon: "🚗", color: "text-blue-400" },
  ledgertech: { label: "LedgerTech", icon: "📱", color: "text-violet-400" },
  ledgeredu: { label: "LedgerEdu", icon: "🎓", color: "text-amber-400" },
  ledgerhealth: { label: "LedgerHealth", icon: "🏥", color: "text-rose-400" },
  ledgerbiz: { label: "LedgerBiz", icon: "🏗️", color: "text-orange-400" },
  ledgertravel: { label: "LedgerTravel", icon: "✈️", color: "text-sky-400" },
  ledgeragri: { label: "LedgerAgri", icon: "🌾", color: "text-lime-400" },
  ledgerenergy: { label: "LedgerEnergy", icon: "⚡", color: "text-yellow-400" },
  ledgeraccess: { label: "LedgerAccess", icon: "🔑", color: "text-cyan-400" },
};

const PHASE_ICONS: Record<string, React.ReactNode> = {
  hush: <Clock className="w-4 h-4" />,
  unveil: <Eye className="w-4 h-4" />,
  reveal: <Vote className="w-4 h-4" />,
  forge: <Flame className="w-4 h-4" />,
  complete: <Trophy className="w-4 h-4" />,
};

interface CycleDetail {
  id: string;
  continent: string;
  phase: string;
  startAt: string;
  endAt: string;
  winnerPoolId: string | null;
  createdAt: string;
  cyclePools: Array<{
    id: string;
    poolId: string;
    voteCount: number;
    voteWeight: number;
    isWinner: boolean;
    pool: {
      name: string;
      verticalId: string;
      country: string;
      imageUrl: string | null;
      listedPrice: number | null;
      minCommitment: number;
    };
  }>;
  cycleVotes: Array<{
    id: string;
    userId: string;
    votedAt: string;
  }>;
}

export default function CycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, error, isLoading } = useSWR<{ cycle: CycleDetail }>(
    `/api/meridian/cycle/${id}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !data?.cycle) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Cycle Not Found</h2>
          <button
            onClick={() => router.push("/meridian")}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Meridian
          </button>
        </div>
      </div>
    );
  }

  const cycle = data.cycle;
  const continent = CONTINENTS[cycle.continent];
  const totalVotes = cycle.cycleVotes.length;
  const winner = cycle.cyclePools.find((cp) => cp.isWinner);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => router.push("/meridian")}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meridian
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{continent?.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">{continent?.name || cycle.continent}</h1>
              <p className="text-slate-400 text-sm">
                Cycle #{cycle.id.slice(-6).toUpperCase()} • {new Date(cycle.startAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs">
              {PHASE_ICONS[cycle.phase] || <Clock className="w-4 h-4" />}
              <span className="capitalize">{cycle.phase}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs">
              <Vote className="w-4 h-4 text-slate-400" />
              {totalVotes} votes
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              {cycle.cyclePools.length} pools
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 mb-10"
          >
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                Winner
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{winner.pool.name}</h2>
            <p className="text-slate-400 text-sm mb-4">
              {VERTICAL_META[winner.pool.verticalId]?.label || winner.pool.verticalId} • {winner.pool.country}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-500">Votes:</span>{" "}
                <span className="text-white font-medium">{winner.voteCount}</span>
              </div>
              <div>
                <span className="text-slate-500">Weight:</span>{" "}
                <span className="text-white font-medium">{winner.voteWeight.toFixed(1)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Competing Pools */}
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-slate-400" />
          Competing Pools
        </h3>

        <div className="space-y-3">
          {cycle.cyclePools
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((cp, idx) => {
              const vertical = VERTICAL_META[cp.pool.verticalId];
              const percent = totalVotes > 0 ? (cp.voteCount / totalVotes) * 100 : 0;

              return (
                <motion.div
                  key={cp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    cp.isWinner
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {cp.isWinner ? (
                      <Trophy className="w-5 h-5 text-amber-400 mx-auto" />
                    ) : (
                      <span className="text-sm font-bold text-slate-600">{idx + 1}</span>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
                    {vertical?.icon || "📦"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-white truncate">{cp.pool.name}</span>
                      <span className={`text-xs ${vertical?.color || "text-slate-400"}`}>
                        {vertical?.label || cp.pool.verticalId}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {cp.pool.country}
                      </span>
                      <span>Min: ${cp.pool.minCommitment}</span>
                    </div>
                  </div>

                  {/* Vote bar */}
                  <div className="w-32 hidden sm:block">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">{cp.voteCount}</span>
                      <span className="text-slate-500">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cp.isWinner ? "bg-amber-400" : "bg-cyan-400"}`}
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => router.push(`/pools/${cp.poolId}`)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </motion.div>
              );
            })}
        </div>

        {/* Timeline */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            Cycle Timeline
          </h3>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-800" />
            {[
              { label: "The Hush", time: cycle.startAt, desc: "Anticipation begins. The continent is named." },
              { label: "The Unveil", time: null, desc: "4 blurred pools appear. Oracle forecasts open." },
              { label: "The Reveal", time: null, desc: "Full data revealed. Community votes." },
              { label: "The Forge", time: cycle.endAt, desc: "Winner is forged into a live pool." },
            ].map((event, i) => (
              <div key={i} className="relative mb-8 last:mb-0">
                <div className="absolute -left-5 top-0.5 w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600" />
                <div className="text-sm font-medium text-white">{event.label}</div>
                {event.time && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(event.time).toLocaleString()}
                  </div>
                )}
                <div className="text-xs text-slate-600 mt-1">{event.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}