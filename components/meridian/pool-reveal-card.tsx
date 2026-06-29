// components/meridian/pool-reveal-card.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  MapPin,
  TrendingUp,
  Flame,
  Vote,
  Eye,
  EyeOff,
  Clock,
  Shield,
  CheckCircle2,
  Loader2,
} from "lucide-react";

//
// TYPES — Aligned with CyclePool + Pool schema
//

type Phase = "hush" | "unveil" | "reveal" | "forge" | "complete";
type RiskLevel = "LOW" | "MODERATE" | "HIGH";

interface CyclePoolData {
  id: string;
  voteCount: number;
  voteWeight: number;
  isWinner: boolean;
  revealedAt: Date | string | null;
}

interface PoolData {
  id: string;
  poolId: string;
  name: string;
  verticalId: string; // ledgerprop, ledgerauto, etc.
  country: string;
  imageUrl?: string | null;
  minCommitment: number;
  listedPrice?: number | null;
  assetValue: number;
  hallClass?: string | null;
  emojiSet?: string;
}

interface PoolRevealCardProps {
  cyclePool: CyclePoolData;
  pool: PoolData;
  phase: Phase;
  phaseStartAt: Date | string;
  onVote?: (cyclePoolId: string) => Promise<void>;
  hasVoted?: boolean;
  userVotePoolId?: string | null;
  index: number;
  totalCompetingPools: number;
}

//
// VERTICAL CONFIG — Matches schema lowercase slugs
//

const VERTICAL_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  ledgerprop: { label: "LedgerProp", color: "text-blue-400", emoji: "🏠" },
  ledgerauto: { label: "LedgerAuto", color: "text-purple-400", emoji: "🚗" },
  ledgertech: { label: "LedgerTech", color: "text-pink-400", emoji: "📱" },
  ledgeredu: { label: "LedgerEdu", color: "text-indigo-400", emoji: "🎓" },
  ledgerhealth: { label: "LedgerHealth", color: "text-rose-400", emoji: "🏥" },
  ledgerbiz: { label: "LedgerBiz", color: "text-orange-400", emoji: "🏗️" },
  ledgertravel: { label: "LedgerTravel", color: "text-cyan-400", emoji: "✈️" },
  ledgeragri: { label: "LedgerAgri", color: "text-green-400", emoji: "🌾" },
  ledgerenergy: { label: "LedgerEnergy", color: "text-yellow-400", emoji: "⚡" },
  ledgeraccess: { label: "LedgerAccess", color: "text-teal-400", emoji: "📡" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; classes: string; icon: React.ReactNode }> = {
  LOW: {
    label: "LOW",
    classes: "text-emerald-400 bg-emerald-950/40 border-emerald-900/50",
    icon: <Shield className="w-3 h-3" />,
  },
  MODERATE: {
    label: "MODERATE",
    classes: "text-amber-400 bg-amber-950/40 border-amber-900/50",
    icon: <Clock className="w-3 h-3" />,
  },
  HIGH: {
    label: "HIGH",
    classes: "text-red-400 bg-red-950/40 border-red-900/50",
    icon: <Flame className="w-3 h-3" />,
  },
};

//
// SCRAMBLE EFFECT — Glitch text decryption for UNVEIL
//

function ScrambleText({
  text,
  isRevealed,
  className,
}: {
  text: string;
  isRevealed: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(
    text.split("").map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
  );

  useMemo(() => {
    if (isRevealed) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplay((prev) =>
          prev.map((char, idx) => {
            if (idx <= i) return text[idx];
            return String.fromCharCode(65 + Math.floor(Math.random() * 26));
          })
        );
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isRevealed, text]);

  return (
    <span className={`font-mono ${className || ""}`} aria-label={isRevealed ? text : "Encrypted"}>
      {display.map((char, i) => (
        <motion.span
          key={i}
          animate={isRevealed ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
          transition={isRevealed ? {} : { duration: 0.2, delay: i * 0.02, repeat: Infinity }}
          className="inline-block"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

//
// VOTE BAR — Hidden for first 12h of REVEAL
//

function VoteBar({
  voteCount,
  totalVotes,
  phaseStartAt,
  phase,
}: {
  voteCount: number;
  totalVotes: number;
  phaseStartAt: Date | string;
  phase: Phase;
}) {
  const phaseStart = useMemo(
    () => (phaseStartAt instanceof Date ? phaseStartAt : new Date(phaseStartAt)),
    [phaseStartAt]
  );

  const isTallyVisible = useMemo(() => {
    if (phase !== "reveal") return false;
    const hoursElapsed = (Date.now() - phaseStart.getTime()) / (1000 * 60 * 60);
    return hoursElapsed >= 12;
  }, [phase, phaseStart]);

  const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  if (!isTallyVisible) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Tally hidden
          </span>
          <span>First 12 hours</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-full bg-slate-700 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Live tally
        </span>
        <span className="text-cyan-400 font-mono font-bold">{percent}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-cyan-500 rounded-full"
        />
      </div>
      <div className="text-[10px] text-slate-600 text-right">
        {voteCount.toLocaleString()} of {totalVotes.toLocaleString()} votes
      </div>
    </div>
  );
}

//
// MAIN COMPONENT
//

export default function PoolRevealCard({
  cyclePool,
  pool,
  phase,
  phaseStartAt,
  onVote,
  hasVoted = false,
  userVotePoolId = null,
  index,
  totalCompetingPools,
}: PoolRevealCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const vertical = VERTICAL_CONFIG[pool.verticalId] || {
    label: pool.verticalId,
    color: "text-slate-400",
    emoji: "◆",
  };

  // Derive risk from asset value (schema has no explicit risk field)
  const riskLevel: RiskLevel = useMemo(() => {
    if (pool.assetValue > 500_000) return "HIGH";
    if (pool.assetValue > 100_000) return "MODERATE";
    return "LOW";
  }, [pool.assetValue]);

  const risk = RISK_CONFIG[riskLevel];

  const isRevealed = phase !== "hush" && phase !== "unveil";
  const isWinner = cyclePool.isWinner;
  const isLocked = phase === "unveil" || (phase === "reveal" && hasVoted);
  const userVotedHere = userVotePoolId === cyclePool.id;

  const handleVote = useCallback(async () => {
    if (!onVote || isVoting || hasVoted) return;
    setIsVoting(true);
    try {
      await onVote(cyclePool.id);
    } finally {
      setIsVoting(false);
    }
  }, [onVote, cyclePool.id, isVoting, hasVoted]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isWinner ? 1.02 : 1,
        filter: phase === "unveil" ? "blur(4px) brightness(0.6)" : "blur(0px) brightness(1)",
      }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-slate-950 border rounded-2xl overflow-hidden transition-colors ${
        isWinner
          ? "border-emerald-500/60 shadow-2xl shadow-emerald-950/30"
          : "border-slate-800/80 hover:border-slate-700/80"
      }`}
      aria-label={`Pool ${pool.name} by ${vertical.label}`}
    >
      {/* Winner Banner */}
      <AnimatePresence>
        {isWinner && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-30 bg-emerald-950/90 border-b border-emerald-800/60 px-4 py-2.5 flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">
              FORGED — Winner
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Overlay (UNVEIL) */}
      <AnimatePresence>
        {phase === "unveil" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-10 h-10 text-slate-500" />
            </motion.div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Encrypted
              </p>
              <p className="text-[10px] text-slate-600 font-mono">
                <ScrambleText
                  text={pool.country.toUpperCase()}
                  isRevealed={false}
                  className="text-slate-500"
                />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Section */}
      <div className="relative h-52 bg-slate-900 overflow-hidden">
        {pool.imageUrl ? (
          <>
            <img
              src={pool.imageUrl}
              alt={pool.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
              } ${phase === "unveil" ? "grayscale" : ""}`}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <MapPin className="w-14 h-14 text-slate-800" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950/80 border border-slate-800/80 backdrop-blur-sm ${vertical.color}`}
          >
            <span>{vertical.emoji}</span>
            {vertical.label}
          </span>
          {pool.hallClass && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-950/80 border border-slate-800 text-slate-400 uppercase tracking-wider">
              Class {pool.hallClass}
            </span>
          )}
        </div>

        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm ${risk.classes}`}
          >
            {risk.icon}
            {risk.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title & Location */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-100 leading-tight">{pool.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {isRevealed ? (
              <span>{pool.country}</span>
            ) : (
              <ScrambleText
                text={pool.country.toUpperCase()}
                isRevealed={false}
                className="text-slate-600"
              />
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Minimum
            </div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              ${pool.minCommitment.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/50">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Asset Value
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ${pool.assetValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Vote Bar (REVEAL phase only) */}
        {phase === "reveal" && totalCompetingPools > 0 && (
          <VoteBar
            voteCount={cyclePool.voteCount}
            totalVotes={cyclePool.voteCount * totalCompetingPools} // Approximate from sibling data
            phaseStartAt={phaseStartAt}
            phase={phase}
          />
        )}

        {/* Action Buttons */}
        {phase === "reveal" && onVote && (
          <motion.button
            whileHover={!hasVoted ? { scale: 1.02 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
            onClick={handleVote}
            disabled={hasVoted || isVoting}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
              hasVoted
                ? userVotedHere
                  ? "bg-cyan-950/30 border-cyan-800/50 text-cyan-400 cursor-default"
                  : "bg-slate-800/50 border-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/20"
            }`}
            aria-label={hasVoted ? "Vote locked" : "Vote for this pool"}
          >
            {isVoting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Locking Vote...
              </>
            ) : hasVoted ? (
              userVotedHere ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Your Vote Locked
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Vote Locked
                </>
              )
            ) : (
              <>
                <Vote className="w-4 h-4" />
                Vote for This Pool
              </>
            )}
          </motion.button>
        )}

        {phase === "forge" && isWinner && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
          >
            <Flame className="w-4 h-4" />
            Commit to Earn
          </motion.button>
        )}

        {phase === "unveil" && (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-500">
            <EyeOff className="w-3.5 h-3.5" />
            <span className="font-mono">Awaiting decryption...</span>
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <span className="text-[10px] text-slate-600">
            Pool ID: {pool.poolId.slice(0, 8)}...
          </span>
          {phase === "reveal" && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              {isHovered ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {isHovered ? "Details visible" : "Hover for details"}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}