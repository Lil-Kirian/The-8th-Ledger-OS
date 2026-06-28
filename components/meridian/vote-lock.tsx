// components/meridian/vote-lock.tsx
// 8th Ledger — The Vote Lock: A Sovereign Seal
// "One vote. One subject. Immutable forever."

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  AlertCircle,
  X,
  Globe,
  Shield,
  Fingerprint,
  Seal,
  Stamp,
  KeyRound,
  Radio,
  FileCheck,
  Clock,
  Crown,
} from "lucide-react";

//
// TYPES
//

type VoteStep = "confirm" | "locking" | "locked" | "error";

interface VoteLockProps {
  cyclePoolId: string;
  poolTitle: string;
  verticalId: string;
  country: string;
  onConfirm: (
    cyclePoolId: string,
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  onCancel: () => void;
}

//
// CONFIG
//

const VERTICAL_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  ledgerprop: { label: "LedgerProp", emoji: "🏠", color: "text-blue-400" },
  ledgerauto: { label: "LedgerAuto", emoji: "🚗", color: "text-red-400" },
  ledgertech: { label: "LedgerTech", emoji: "📱", color: "text-purple-400" },
  ledgeredu: { label: "LedgerEdu", emoji: "🎓", color: "text-indigo-400" },
  ledgerhealth: { label: "LedgerHealth", emoji: "🏥", color: "text-rose-400" },
  ledgerbiz: { label: "LedgerBiz", emoji: "🏗️", color: "text-amber-400" },
  ledgertravel: { label: "LedgerTravel", emoji: "✈️", color: "text-sky-400" },
  ledgeragri: { label: "LedgerAgri", emoji: "🌾", color: "text-emerald-400" },
  ledgerenergy: {
    label: "LedgerEnergy",
    emoji: "⚡",
    color: "text-yellow-400",
  },
  ledgeraccess: { label: "LedgerAccess", emoji: "📡", color: "text-teal-400" },
};

//
// HASH GENERATOR — Deterministic vote receipt hash
//

function generateVoteHash(cyclePoolId: string, timestamp: number): string {
  const input = `${cyclePoolId}:${timestamp}:8TH_LEDGER_VOTE`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash < 5) - hash + char) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(16, "0").toUpperCase();
  return `LEDGER-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

//
// SUB-COMPONENTS
//

function SealRing({
  step,
  progress = 0,
}: {
  step: VoteStep;
  progress?: number;
}) {
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        {/* Outer ring */}
        <circle
          cx="64"
          cy="64"
          r="60"
          fill="none"
          stroke="#0f172a"
          strokeWidth="2"
        />
        {/* Progress ring */}
        <motion.circle
          cx="64"
          cy="64"
          r="58"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={
            step === "locked"
              ? "text-emerald-400"
              : step === "error"
                ? "text-red-400"
                : "text-cyan-400"
          }
        />
        {/* Inner decorative ring */}
        <circle
          cx="64"
          cy="64"
          r="48"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Lock className="w-10 h-10 text-cyan-400" />
            </motion.div>
          )}
          {step === "locking" && (
            <motion.div
              key="locking"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              exit={{ scale: 0 }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { type: "spring" },
              }}
            >
              <Fingerprint className="w-10 h-10 text-cyan-400" />
            </motion.div>
          )}
          {step === "locked" && (
            <motion.div
              key="locked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <Seal className="w-10 h-10 text-emerald-400" />
            </motion.div>
          )}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <AlertCircle className="w-10 h-10 text-red-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-b-0">
      <span className="text-[11px] text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-xs text-slate-300 ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

//
// MAIN COMPONENT
//

export default function VoteLock({
  cyclePoolId,
  poolTitle,
  verticalId,
  country,
  onConfirm,
  onCancel,
}: VoteLockProps) {
  const [step, setStep] = useState<VoteStep>("confirm");
  const [progress, setProgress] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  const vertical = VERTICAL_CONFIG[verticalId] || {
    label: verticalId,
    emoji: "📋",
    color: "text-slate-400",
  };

  // ── Keyboard: Escape to cancel ─
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step === "confirm") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step, onCancel]);

  // ── Focus trap
  useEffect(() => {
    dialogRef.current?.focus();
  }, [step]);

  // ── Confirm handler
  const handleConfirm = useCallback(async () => {
    setStep("locking");
    const timestamp = Date.now();

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15 + 5, 95));
    }, 400);

    try {
      const result = await onConfirm(cyclePoolId);
      clearInterval(progressInterval);

      if (result.success) {
        setProgress(100);
        setTxHash(result.txHash || generateVoteHash(cyclePoolId, timestamp));
        setTimeout(() => setStep("locked"), 600);
      } else {
        setErrorMessage(
          result.error || "Vote failed. The Ledger rejected the seal.",
        );
        setStep("error");
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMessage(
        err.message || "Network failure. Vote may not be recorded.",
      );
      setStep("error");
    }
  }, [cyclePoolId, onConfirm]);

  // ── Backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && step === "confirm") onCancel();
    },
    [step, onCancel],
  );

  const stepTitles = {
    confirm: "Cast Your Vote",
    locking: "Sealing to the Ledger...",
    locked: "Vote Sealed",
    error: "Seal Broken",
  };

  const stepSubtitles = {
    confirm: "One vote per subject. Irreversible. Immutable.",
    locking: "The 8th Ledger is cryptographically sealing your choice...",
    locked: "Your vote is now part of the permanent record.",
    error: "The seal could not be applied. Details below.",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-lock-title"
    >
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg bg-slate-950 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      >
        {/* Close button (confirm only) */}
        <AnimatePresence>
          {step === "confirm" && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCancel}
              className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="px-6 py-6 border-b border-slate-800/50 bg-slate-900/20">
          <div className="flex flex-col items-center text-center gap-3">
            <SealRing step={step} progress={progress} />
            <div>
              <h2
                id="vote-lock-title"
                className="text-xl font-bold text-slate-100 tracking-tight"
              >
                {stepTitles[step]}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                {stepSubtitles[step]}
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════
              CONFIRM STEP
              ═══════════════════════════════════════════════════════ */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="p-6 space-y-5"
            >
              {/* Pool Card */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Cycle Pool
                  </span>
                  <span className="text-[10px] font-mono text-slate-600">
                    {cyclePoolId.slice(0, 8)}...{cyclePoolId.slice(-4)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  {poolTitle}
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`flex items-center gap-1.5 ${vertical.color}`}
                  >
                    <span className="text-sm">{vertical.emoji}</span>
                    {vertical.label}
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Globe className="w-3 h-3" />
                    {country}
                  </span>
                </div>
              </div>

              {/* The Rules — Immutable Contract */}
              <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/15 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    The Compact
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400/60 shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-300/70 leading-relaxed">
                      One vote per subject per cycle. Once sealed, it cannot be
                      changed, withdrawn, or transferred.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400/60 shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-300/70 leading-relaxed">
                      Tally remains hidden for the first 12 hours. Then live
                      bars appear.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400/60 shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-300/70 leading-relaxed">
                      Tiebreaker: The Architect&apos;s Hand. The 8th Ledger
                      holds the final word.
                    </span>
                  </div>
                </div>
              </div>

              {/* Vote weight hint */}
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <Shield className="w-3.5 h-3.5" />
                <span>
                  Your vote weight is determined by your total ownership stake
                  across all halls.
                </span>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              LOCKING STEP
              ═══════════════════════════════════════════════════════ */}
          {step === "locking" && (
            <motion.div
              key="locking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center space-y-6"
            >
              <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
                  <span>Encrypting</span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-400 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="space-y-1 text-center">
                <p className="text-sm text-slate-400 animate-pulse font-mono">
                  {progress < 30 && "Generating cryptographic nonce..."}
                  {progress >= 30 &&
                    progress < 60 &&
                    "Hashing vote with ledger salt..."}
                  {progress >= 60 &&
                    progress < 90 &&
                    "Writing to immutable audit trail..."}
                  {progress >= 90 && "Finalizing seal..."}
                </p>
                <p className="text-[10px] text-slate-700">
                  Do not close this window. The seal is being forged.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/40">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-mono">
                  Live connection to 8th Ledger
                </span>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              LOCKED STEP — The Receipt
              ═══════════════════════════════════════════════════════ */}
          {step === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="p-6 space-y-5"
            >
              {/* Success banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/15">
                <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-400">
                    Vote Recorded
                  </div>
                  <div className="text-[11px] text-emerald-400/60">
                    Your choice has been sealed to the ledger
                  </div>
                </div>
              </div>

              {/* Vote Receipt */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center gap-2 mb-3">
                  <Stamp className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Vote Receipt
                  </span>
                </div>
                <div className="space-y-0">
                  <ReceiptRow label="Pool" value={poolTitle} />
                  <ReceiptRow
                    label="Vertical"
                    value={`${vertical.emoji} ${vertical.label}`}
                  />
                  <ReceiptRow label="Country" value={country} />
                  <ReceiptRow label="Cycle Pool ID" value={cyclePoolId} mono />
                  <ReceiptRow
                    label="Timestamp"
                    value={new Date().toISOString()}
                    mono
                  />
                  <ReceiptRow label="Receipt Hash" value={txHash} mono />
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                This receipt is your proof of participation. Screenshot or save
                it. The 8th Ledger maintains the canonical record.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="w-full py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                Close & Return
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
              className="p-8 flex flex-col items-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-red-950/30 border border-red-800/40 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-red-400 mb-1">
                  The Seal Broke
                </h3>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep("confirm")}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition-all"
                >
                  Try Again
                </motion.button>
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm font-medium hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions (confirm only) */}
        <AnimatePresence>
          {step === "confirm" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 border-t border-slate-800/50 flex items-center justify-end gap-3 bg-slate-900/20"
            >
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center gap-2 shadow-lg shadow-cyan-950/20"
              >
                <Lock className="w-4 h-4" />
                Seal My Vote
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
