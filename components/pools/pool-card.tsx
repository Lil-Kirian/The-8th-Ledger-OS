"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { PoolStatusBadge } from "./pool-status-badge";
import { PoolHallClassBadge } from "./pool-hall-class-badge";
import { MapPin, Users, TrendingUp, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PoolCardProps {
  pool: {
    id: string;
    poolId: string;
    name: string;
    verticalId: string;
    imageUrl?: string | null;
    country: string;
    committed: number;
    target: number;
    participants: number;
    maxParticipants: number;
    status: string;
    hallClass?: string | null;
    minCommitment: number;
    closesAt: Date;
    assetBookValue?: number;
  };
  onClick?: () => void;
  index?: number;
  isLoading?: boolean;
}

const verticalLabels: Record<string, { name: string; emoji: string; gradient: string }> = {
  ledgerprop: { name: "LedgerProp", emoji: "🏠", gradient: "from-blue-500/20 to-blue-400/5" },
  ledgerauto: { name: "LedgerAuto", emoji: "🚗", gradient: "from-red-500/20 to-red-400/5" },
  ledgertech: { name: "LedgerTech", emoji: "📱", gradient: "from-purple-500/20 to-purple-400/5" },
  ledgeredu: { name: "LedgerEdu", emoji: "🎓", gradient: "from-indigo-500/20 to-indigo-400/5" },
  ledgerhealth: { name: "LedgerHealth", emoji: "🏥", gradient: "from-pink-500/20 to-pink-400/5" },
  ledgerbiz: { name: "LedgerBiz", emoji: "🏗️", gradient: "from-orange-500/20 to-orange-400/5" },
  ledgertravel: { name: "LedgerTravel", emoji: "✈️", gradient: "from-sky-500/20 to-sky-400/5" },
  ledgeragri: { name: "LedgerAgri", emoji: "🌾", gradient: "from-green-500/20 to-green-400/5" },
  ledgerenergy: { name: "LedgerEnergy", emoji: "⚡", gradient: "from-yellow-500/20 to-yellow-400/5" },
  ledgeraccess: { name: "LedgerAccess", emoji: "📡", gradient: "from-cyan-500/20 to-cyan-400/5" },
};

export function PoolCard({ pool, onClick, index = 0, isLoading }: PoolCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
      >
        <div className="h-40 bg-white/5 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
          <div className="h-2 bg-white/5 rounded w-full animate-pulse" />
          <div className="h-2 bg-white/5 rounded w-3/4 animate-pulse" />
        </div>
      </motion.div>
    );
  }

  const fillPercent = Math.min((pool.committed / pool.target) * 100, 100);
  const vertical = verticalLabels[pool.verticalId] || { name: pool.verticalId, emoji: "📦", gradient: "from-white/10 to-white/5" };
  const timeLeft = Math.max(0, new Date(pool.closesAt).getTime() - Date.now());
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const isHot = fillPercent > 75 && pool.status === "filling";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      {/* Glow backdrop */}
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/20 group-hover:via-cyan-400/10 group-hover:to-cyan-500/20 blur-sm transition-all duration-500 opacity-0 group-hover:opacity-100" />

      <Card
        onClick={onClick}
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl",
          "transition-all duration-300 cursor-pointer",
          "hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.08)]",
          "hover:bg-[#0a0a0a]/95"
        )}
      >
        {/* Image section */}
        <div className="relative h-44 overflow-hidden">
          {pool.imageUrl ? (
            <img
              src={pool.imageUrl}
              alt={pool.name}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
            />
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br flex items-center justify-center text-5xl", vertical.gradient)}>
              {vertical.emoji}
            </div>
          )}

          {/* Premium overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            <PoolStatusBadge status={pool.status} />
            {pool.hallClass && <PoolHallClassBadge hallClass={pool.hallClass} />}
          </div>

          <div className="absolute top-3 right-3 z-10">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
              {vertical.name}
            </span>
          </div>

          {/* Hot indicator */}
          {isHot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-1"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-400">Hot</span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 relative">
          <div>
            <h3 className="text-sm font-bold text-white/90 group-hover:text-cyan-400 transition-colors duration-300 line-clamp-1 tracking-tight">
              {pool.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="h-3 w-3 text-white/25" />
              <span className="text-[11px] text-white/30 font-medium">{pool.country}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-white/25">${pool.committed.toLocaleString()}</span>
              <span className={cn("tabular-nums", fillPercent >= 90 ? "text-emerald-400" : "text-white/40")}>
                {fillPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden ring-1 ring-white/[0.03]">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  fillPercent >= 90
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-cyan-500 to-cyan-300"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${fillPercent}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/15">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {pool.participants} / {pool.maxParticipants}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysLeft}d
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <span className="text-[10px] text-white/15 font-medium">Min ${pool.minCommitment}</span>
            <span className="text-[10px] text-cyan-400/50 font-medium flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
              <TrendingUp className="h-3 w-3" />
              ${pool.target.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}