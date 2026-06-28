"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Trophy,
  Zap,
  ShieldCheck,
  Globe,
  Star,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Eye,
  Lock,
  Users,
  BarChart3,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

/* ============================================================
   TYPES — 8th Ledger Merit Engine
   ============================================================ */
interface MeritBreakdown {
  dimension: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
}

interface MeritScore {
  ledgerId: string;
  displayName: string;
  country: string;
  avatar?: string | null;
  pacBase: number;
  poolHistoryScore: number;
  communityScore: number;
  reviewQualityScore: number;
  identityScore: number;
  arcStreakScore: number;
  countryDiversityScore: number;
  totalMeritScore: number;
  rank: number;
  breakdown: MeritBreakdown[];
}

interface PoolOption {
  poolId: string;
  name: string;
  status: string;
  participantCount: number;
  assetValue: number;
}

/* ============================================================
   COMPONENT — Quantum Merit Consensus (8th Ledger)
   ============================================================ */
export default function QuantumMeritPage() {
  const router = useRouter();
  const [pools, setPools] = useState<PoolOption[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [meritData, setMeritData] = useState<{
    meritScores: MeritScore[];
    poolName: string;
    status: string;
    participantCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ranking" | "breakdown" | "arc">("ranking");

  // Fetch available pools
  useEffect(() => {
    fetch("/api/admin/pools?status=consensus")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPools(data.pools || []);
      })
      .catch(console.error);
  }, []);

  // Preview merit scores
  const previewMerit = useCallback(async () => {
    if (!selectedPoolId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/merit/select?poolId=${selectedPoolId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMeritData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPoolId]);

  // Execute consensus
  const executeConsensus = async () => {
    if (!selectedPoolId || !meritData) return;
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/merit/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId: selectedPoolId, dryRun: false }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess(data.message);
      setConfirmOpen(false);
      setConfirmText("");
      previewMerit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const winner = meritData?.meritScores[0];
  const isDistributed = meritData?.status === "distributed";

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0f0f1a]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quantum Merit Consensus</h1>
              <p className="text-sm text-gray-400">8th Ledger Sovereign Selection Engine</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Control Panel */}
        <div className="rounded-2xl border border-white/10 bg-[#11111a]/80 backdrop-blur-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Select Pool
              </label>
              <select
                value={selectedPoolId}
                onChange={(e) => {
                  setSelectedPoolId(e.target.value);
                  setMeritData(null);
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              >
                <option value="">Choose a pool in consensus...</option>
                {pools.map((p) => (
                  <option key={p.poolId} value={p.poolId}>
                    {p.name} — {p.participantCount} participants · ${p.assetValue.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={previewMerit}
              disabled={!selectedPoolId || loading}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview Scores
            </button>

            {meritData && !isDistributed && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={executing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-cyan-500/20"
              >
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                Execute Consensus
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Consensus Error</p>
                <p className="text-xs text-red-400/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-300">Consensus Executed</p>
                <p className="text-xs text-emerald-400/80 mt-1">{success}</p>
              </div>
            </div>
          )}
        </div>

        {/* Winner Banner */}
        {winner && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#11111a] to-[#11111a] p-6">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Crown className="w-24 h-24 text-amber-400" />
            </div>
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-black shadow-lg shadow-amber-500/30">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Projected Winner</span>
                </div>
                <h2 className="text-xl font-bold">{winner.displayName}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {winner.country}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-cyan-400" /> {winner.totalMeritScore.toLocaleString()} Merit</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Rank #{winner.rank}</span>
                </div>
              </div>
              {isDistributed && (
                <div className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
                  Distributed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        {meritData && (
          <div className="flex gap-2">
            {[
              { id: "ranking", label: "Rankings", icon: Trophy },
              { id: "breakdown", label: "Score Breakdown", icon: BarChart3 },
              { id: "arc", label: "ARC Preview", icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Ranking Table */}
        {meritData && activeTab === "ranking" && (
          <div className="rounded-2xl border border-white/10 bg-[#11111a]/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-6 py-4 font-medium text-gray-400">Rank</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-400">Sovereign</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-400">Country</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-400">PAC</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-400">History</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-400">Community</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-400">Reviews</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-400">Identity</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-400">ARC</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-400">Diversity</th>
                    <th className="text-right px-6 py-4 font-medium text-cyan-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {meritData.meritScores.map((score) => (
                    <tr
                      key={score.ledgerId}
                      className={`group transition-colors hover:bg-white/5 ${
                        score.rank === 1 ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          score.rank === 1
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : score.rank === 2
                            ? "bg-gray-400/20 text-gray-300 border border-gray-400/30"
                            : score.rank === 3
                            ? "bg-orange-700/30 text-orange-400 border border-orange-500/30"
                            : "bg-white/5 text-gray-500"
                        }`}>
                          {score.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 flex items-center justify-center text-xs font-bold">
                            {score.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{score.displayName}</p>
                            <p className="text-xs text-gray-500 font-mono">{score.ledgerId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{score.country}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{score.pacBase}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{score.poolHistoryScore}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{score.communityScore}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{score.reviewQualityScore}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{score.identityScore}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{score.arcStreakScore}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{score.countryDiversityScore}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-bold ${
                          score.rank === 1 ? "text-amber-400" : "text-cyan-400"
                        }`}>
                          {score.totalMeritScore.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Breakdown Visualization */}
        {meritData && activeTab === "breakdown" && winner && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meritData.meritScores.slice(0, 5).map((score) => (
              <div
                key={score.ledgerId}
                className={`rounded-xl border p-5 space-y-3 ${
                  score.rank === 1
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-white/10 bg-[#11111a]/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">#{score.rank}</span>
                    <span className="font-medium">{score.displayName}</span>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">{score.totalMeritScore}</span>
                </div>
                <div className="space-y-2">
                  {score.breakdown.map((b) => (
                    <div key={b.dimension}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{b.dimension}</span>
                        <span className="text-gray-300">{Math.round(b.weightedScore)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            b.dimension === "PAC Base"
                              ? "bg-cyan-400"
                              : b.dimension === "Pool History"
                              ? "bg-violet-400"
                              : b.dimension === "Community"
                              ? "bg-emerald-400"
                              : b.dimension === "Review Quality"
                              ? "bg-amber-400"
                              : b.dimension === "Identity"
                              ? "bg-blue-400"
                              : b.dimension === "ARC Streak"
                              ? "bg-rose-400"
                              : "bg-teal-400"
                          }`}
                          style={{ width: `${Math.min((b.weightedScore / score.totalMeritScore) * 100 * 3, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARC Preview — 8th Ledger Compliant */}
        {meritData && activeTab === "arc" && (
          <div className="rounded-2xl border border-white/10 bg-[#11111a]/60 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              ARC Distribution Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Liquid Return", pct: "50%", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                { label: "Ledger Balance", pct: "25%", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                { label: "PAC Boost", pct: "15%", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                { label: "Credit Pool", pct: "10%", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              ].map((tier) => (
                <div key={tier.label} className={`rounded-xl border ${tier.border} ${tier.bg} p-4 text-center`}>
                  <p className={`text-2xl font-bold ${tier.color}`}>{tier.pct}</p>
                  <p className="text-xs text-gray-400 mt-1">{tier.label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              Non-winners receive 50% liquid return immediately. The remaining balance is credited as Ledger tokens, PAC score, and credit pool access. Winner receives full asset ownership via PAC. No gambling. No prediction fees. The 8th Ledger enforces.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && meritData && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#11111a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Sovereign Confirmation
              </h3>
              <button onClick={() => setConfirmOpen(false)} className="p-1 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <p className="text-sm text-amber-200">
                You are about to execute <strong>Quantum Merit Consensus</strong> for:
              </p>
              <p className="text-lg font-bold text-white">{meritData.poolName}</p>
              <div className="flex items-center gap-2 text-sm text-amber-300/80">
                <Crown className="w-4 h-4" />
                Winner will be: <strong>{winner.displayName}</strong> ({winner.country}) — Score: {winner.totalMeritScore}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                {meritData.participantCount} participants · ARC will trigger for {meritData.participantCount - 1} non-winners
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">
                Type the pool name <span className="text-white font-medium">{meritData.poolName}</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                placeholder="Enter pool name..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeConsensus}
                disabled={confirmText !== meritData.poolName || executing}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                Confirm Consensus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}