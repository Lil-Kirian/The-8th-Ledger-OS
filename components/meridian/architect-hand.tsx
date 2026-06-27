// components/meridian/architect-hand.tsx
// 8th Ledger — The Architect's Hand
// "When democracy splits, the Architect decides. One choice. One forge. One winner."

"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  Flame,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Hash,
  X,
  Gavel,
  Swords,
  Scale,
  Scroll,
  Fingerprint,
  Radio,
  Award,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES — Schema-Aligned
// ─────────────────────────────────────────────────────────────

interface TiedPool {
  id: string;
  poolId: string;
  title: string;
  verticalId: string;
  country: string;
  voteCount: number;
  voteWeight: number;
  imageUrl?: string | null;
}

interface ArchitectHandProps {
  cycleId: string;
  continent: string;
  phase: "reveal" | "forge" | "complete";
  tiedPools: TiedPool[];
  selectedPoolId?: string | null;
  onSelect: (poolId: string) => void;
  onForge: (cyclePoolId: string) => Promise<{ success: boolean; error?: string }>;
  isPrimaryAdmin: boolean;
  architectLedgerId?: string;
  lastDecisionAt?: Date | string | null;
}

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM — The Throne Room Palette
// ─────────────────────────────────────────────────────────────

const VERTICAL_CONFIG: Record<string, { label: string; color: string; emoji: string; bg: string }> = {
  ledgerprop: { label: "LedgerProp", color: "text-blue-400", emoji: "🏠", bg: "bg-blue-400/10" },
  ledgerauto: { label: "LedgerAuto", color: "text-red-400", emoji: "🚗", bg: "bg-red-400/10" },
  ledgertech: { label: "LedgerTech", color: "text-purple-400", emoji: "📱", bg: "bg-purple-400/10" },
  ledgeredu: { label: "LedgerEdu", color: "text-indigo-400", emoji: "🎓", bg: "bg-indigo-400/10" },
  ledgerhealth: { label: "LedgerHealth", color: "text-rose-400", emoji: "🏥", bg: "bg-rose-400/10" },
  ledgerbiz: { label: "LedgerBiz", color: "text-amber-400", emoji: "🏗️", bg: "bg-amber-400/10" },
  ledgertravel: { label: "LedgerTravel", color: "text-sky-400", emoji: "✈️", bg: "bg-sky-400/10" },
  ledgeragri: { label: "LedgerAgri", color: "text-emerald-400", emoji: "🌾", bg: "bg-emerald-400/10" },
  ledgerenergy: { label: "LedgerEnergy", color: "text-yellow-400", emoji: "⚡", bg: "bg-yellow-400/10" },
  ledgeraccess: { label: "LedgerAccess", color: "text-teal-400", emoji: "📡", bg: "bg-teal-400/10" },
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function generateDecisionHash(cycleId: string, poolId: string, timestamp: number): string {
  const input = `ARCHITECT-HAND:${cycleId}:${poolId}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash < 5) - hash + char) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(16, "0").toUpperCase();
  return `AH-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function CandidateCard({
  pool,
  index,
  isSelected,
  isPrimaryAdmin,
  totalVotes,
  onSelect,
}: {
  pool: TiedPool;
  index: number;
  isSelected: boolean;
  isPrimaryAdmin: boolean;
  totalVotes: number;
  onSelect: () => void;
}) {
  const vertical = VERTICAL_CONFIG[pool.verticalId] || {
    label: pool.verticalId,
    color: "text-slate-400",
    emoji: "◆",
    bg: "bg-slate-400/10",
  };

  const votePct = totalVotes > 0 ? (pool.voteCount / totalVotes) * 100 : 0;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={onSelect}
      disabled={!isPrimaryAdmin}
      className={`
        group relative w-full text-left rounded-xl border transition-all duration-300
        ${isSelected
          ? "bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10"
          : "bg-slate-900/30 border-slate-800/60 hover:border-slate-700/60 hover:bg-slate-800/20"
        }
        ${!isPrimaryAdmin ? "cursor-default" : "cursor-pointer"}
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="selection-glow"
          className="absolute inset-0 rounded-xl ring-1 ring-amber-500/30"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}

      <div className="relative p-4 flex items-center gap-4">
        {/* Rank */}
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0
            transition-all duration-300
            ${isSelected
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "bg-slate-800 text-slate-600 group-hover:bg-slate-700 group-hover:text-slate-500"
            }
          `}
        >
          {isSelected ? <Crown className="w-5 h-5" /> : index + 1}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-bold truncate ${isSelected ? "text-amber-100" : "text-slate-200"}`}>
              {pool.title}
            </h3>
            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider"
              >
                <Sparkles className="w-3 h-3" />
                Selected
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className={`flex items-center gap-1 ${vertical.color}`}>
              <span className="text-sm">{vertical.emoji}</span>
              <span className="font-medium">{vertical.label}</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Scale className="w-3 h-3" />
              {pool.voteCount.toLocaleString()} votes
            </span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500 font-mono">
              {pool.voteWeight.toFixed(1)} weight
            </span>
          </div>

          {/* Vote bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-slate-600">Vote share</span>
              <span className="text-slate-500 font-mono">{votePct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isSelected ? "bg-amber-400" : "bg-slate-600"}`}
                initial={{ width: 0 }}
                animate={{ width: `${votePct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Checkmark */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="shrink-0"
            >
              <CheckCircle2 className="w-6 h-6 text-amber-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

function CompactReceipt({ cycleId, pool, hash }: { cycleId: string; pool: TiedPool; hash: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Scroll className="w-4 h-4 text-slate-500" />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Decision Receipt
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-600 block text-[10px] uppercase tracking-wider">Cycle</span>
          <span className="text-slate-300 font-mono">{cycleId.slice(0, 12)}...</span>
        </div>
        <div>
          <span className="text-slate-600 block text-[10px] uppercase tracking-wider">Pool</span>
          <span className="text-slate-300 font-medium">{pool.title}</span>
        </div>
        <div>
          <span className="text-slate-600 block text-[10px] uppercase tracking-wider">Vertical</span>
          <span className="text-slate-300">{VERTICAL_CONFIG[pool.verticalId]?.label || pool.verticalId}</span>
        </div>
        <div>
          <span className="text-slate-600 block text-[10px] uppercase tracking-wider">Country</span>
          <span className="text-slate-300">{pool.country}</span>
        </div>
      </div>
      <div className="pt-2 border-t border-slate-800/40">
        <div className="flex items-center gap-2">
          <Hash className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] font-mono text-slate-500">{hash}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function ArchitectHand({
  cycleId,
  continent,
  phase,
  tiedPools,
  selectedPoolId,
  onSelect,
  onForge,
  isPrimaryAdmin,
  architectLedgerId,
  lastDecisionAt,
}: ArchitectHandProps) {
  const [step, setStep] = useState<"select" | "confirm" | "forging" | "forged" | "error">("select");
  const [errorMessage, setErrorMessage] = useState("");
  const [decisionHash, setDecisionHash] = useState("");

  const totalVotes = useMemo(
    () => tiedPools.reduce((sum, p) => sum + p.voteCount, 0),
    [tiedPools]
  );

  const isTie = useMemo(() => {
    if (tiedPools.length < 2) return false;
    const firstCount = tiedPools[0].voteCount;
    return tiedPools.every((p) => p.voteCount === firstCount);
  }, [tiedPools]);

  const selectedPool = tiedPools.find((p) => p.id === selectedPoolId);

  const handleSelect = useCallback(
    (poolId: string) => {
      if (!isPrimaryAdmin) return;
      onSelect(poolId);
      setStep("select");
    },
    [isPrimaryAdmin, onSelect]
  );

  const handleInitiateForge = useCallback(() => {
    if (!selectedPoolId || !isPrimaryAdmin) return;
    setStep("confirm");
  }, [selectedPoolId, isPrimaryAdmin]);

  const handleConfirmForge = useCallback(async () => {
    if (!selectedPoolId) return;
    setStep("forging");

    try {
      const result = await onForge(selectedPoolId);
      if (result.success) {
        const hash = generateDecisionHash(cycleId, selectedPoolId, Date.now());
        setDecisionHash(hash);
        setStep("forged");
      } else {
        setErrorMessage(result.error || "The forge failed. The cycle is unchanged.");
        setStep("error");
      }
    } catch (err: unknown) {
      setErrorMessage(err.message || "Network failure. The seal could not be struck.");
      setStep("error");
    }
  }, [selectedPoolId, onForge, cycleId]);

  const handleCancel = useCallback(() => {
    setStep("select");
    setErrorMessage("");
  }, []);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative rounded-2xl border border-amber-900/30 bg-slate-950 overflow-hidden shadow-2xl shadow-black/50"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-40 bg-amber-500/[0.03] blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-900/[0.02] blur-[80px]" />
      </div>

      {/* Header */}
      <div className="relative px-6 py-6 md:px-8 md:py-8 border-b border-amber-900/20 bg-slate-900/20">
        <div className="flex flex-col items-center text-center gap-3">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
          >
            <Crown className="w-7 h-7 text-amber-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight uppercase">
              The Architect&apos;s Hand
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cycle <span className="font-mono text-slate-400">{cycleId.slice(0, 8)}</span> • {" "}
              <span className="capitalize">{continent.replace("_", " ")}</span> • {" "}
              Tiebreaker Protocol
            </p>
            {lastDecisionAt && (
              <p className="text-[10px] text-slate-700 mt-1 font-mono">
                Last override: {new Date(lastDecisionAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative p-6 md:p-8 space-y-6">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════
              SELECT STEP
              ═══════════════════════════════════════════════════════ */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Tie Banner */}
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Swords className="w-5 h-5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isTie ? "Deadlock Detected" : "No Clear Majority"}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-100">
                  {tiedPools.length}-WAY <span className="text-amber-400">TIE</span>
                </div>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {totalVotes.toLocaleString()} total votes. The Meridian requires a single winner.
                  The Architect must select the forge candidate.
                </p>
              </div>

              {/* Candidates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">
                    Candidates
                  </span>
                  {!isPrimaryAdmin && (
                    <span className="text-[10px] text-slate-600 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/40 border border-slate-700/30">
                      <Lock className="w-3 h-3" />
                      Read-only
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {tiedPools.map((pool, i) => (
                    <CandidateCard
                      key={pool.id}
                      pool={pool}
                      index={i}
                      isSelected={selectedPoolId === pool.id}
                      isPrimaryAdmin={isPrimaryAdmin}
                      totalVotes={totalVotes}
                      onSelect={() => handleSelect(pool.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Authority Panel */}
              {isPrimaryAdmin ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/15 flex items-start gap-3">
                    <Gavel className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-amber-400">
                        Override Authority Active
                      </div>
                      <p className="text-xs text-amber-400/60 mt-1 leading-relaxed">
                        You hold the Architect&apos;s Hand. Select one candidate above, then strike the forge.
                        This decision is logged, hashed, and broadcast to all subjects.
                        Requires 6-factor authentication.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={selectedPoolId ? { scale: 1.01 } : {}}
                    whileTap={selectedPoolId ? { scale: 0.99 } : {}}
                    onClick={handleInitiateForge}
                    disabled={!selectedPoolId}
                    className={`
                      w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all
                      flex items-center justify-center gap-2.5
                      ${selectedPoolId
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 shadow-lg shadow-amber-950/20"
                        : "bg-slate-800/30 border border-slate-800/50 text-slate-600 cursor-not-allowed"
                      }
                    `}
                  >
                    <Flame className="w-5 h-5" />
                    {selectedPoolId
                      ? `Strike Forge: ${selectedPool?.title.slice(0, 25)}${selectedPool!.title.length > 25 ? "..." : ""}`
                      : "Select a candidate to forge"}
                  </motion.button>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/30 border border-slate-800/50 text-center space-y-3">
                  <Shield className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-500">
                    The Architect is deliberating. The Meridian awaits their hand.
                  </p>
                  {architectLedgerId && (
                    <p className="text-[10px] text-slate-700 font-mono">
                      Architect: {architectLedgerId}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              CONFIRM STEP
              ═══════════════════════════════════════════════════════ */}
          {step === "confirm" && selectedPool && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-5"
            >
              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold text-amber-400">Strike the Forge?</h3>
                <p className="text-sm text-slate-400">
                  You are about to override the Meridian and crown:
                </p>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-base font-bold text-slate-100">{selectedPool.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {VERTICAL_CONFIG[selectedPool.verticalId]?.label || selectedPool.verticalId} • {" "}
                    {selectedPool.country} • {" "}
                    {selectedPool.voteCount.toLocaleString()} votes
                  </div>
                </div>
                <p className="text-xs text-amber-400/60">
                  This action is irreversible. The cycle will advance to FORGE immediately.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-400 font-medium hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmForge}
                  className="flex-1 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  Confirm Forge
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              FORGING STEP
              ═══════════════════════════════════════════════════════ */}
          {step === "forging" && (
            <motion.div
              key="forging"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center space-y-6"
            >
              <div className="relative w-20 h-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-400"
                />
                <div className="absolute inset-2 rounded-full bg-amber-950/30 border border-amber-500/10 flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <div className="space-y-1 text-center">
                <p className="text-sm text-amber-400 animate-pulse font-mono">
                  Striking the seal...
                </p>
                <p className="text-[10px] text-slate-700">
                  Do not close this window
                </p>
              </div>

              <div className="w-full max-w-xs h-1 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  animate={{ width: ["0%", "25%", "60%", "90%", "100%"] }}
                  transition={{ duration: 4, times: [0, 0.2, 0.5, 0.8, 1], ease: "easeInOut" }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/40">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-mono">
                  Live connection to Meridian Core
                </span>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              FORGED STEP — The Decree
              ═══════════════════════════════════════════════════════ */}
          {step === "forged" && selectedPool && (
            <motion.div
              key="forged"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-5"
            >
              <div className="flex flex-col items-center py-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-center"
                >
                  <Award className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-emerald-400">Winner Crowned</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    The Architect has spoken. The Meridian obeys.
                  </p>
                </div>
              </div>

              <CompactReceipt cycleId={cycleId} pool={selectedPool} hash={decisionHash} />

              <p className="text-xs text-slate-600 text-center leading-relaxed">
                This decree is now part of the permanent ledger. The pool is LIVE.
                Subjects may commit. The cycle turns.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                className="w-full py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
              >
                Close Decree
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              ERROR STEP
              ═══════════════════════════════════════════════════════ */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 flex flex-col items-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-red-950/30 border border-red-500/20 flex items-center justify-center">
                <X className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-red-400">The Seal Broke</h3>
              <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
                {errorMessage}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep("select")}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm font-medium hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}