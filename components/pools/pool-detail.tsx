"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PoolStatusBadge } from "./pool-status-badge";
import { PoolHallClassBadge } from "./pool-hall-class-badge";
import { PoolCommitModal } from "./commit-modal";
import { PoolPirPreview } from "./pool-pir-preview";
import { PoolMediaVault } from "./pool-media-vault";
import { PoolLocationOptions } from "./pool-location-options";
import { PoolSriAhgi } from "./pool-sri-ahgi";
import { PoolMeridianTimer } from "./pool-meridian-timer";
import { useAuth } from "@/hooks/use-auth";
import {
  MapPin, Users, TrendingUp, Clock, Shield, ArrowUpRight, Lock, Globe, FileText,
  ChevronRight, Zap, Diamond
} from "lucide-react";
import { cn } from "@/lib/utils";

// Animated counter
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

interface PoolDetailProps {
  pool: {
    id: string;
    poolId: string;
    name: string;
    verticalId: string;
    description: string;
    imageUrl?: string | null;
    country: string;
    committed: number;
    target: number;
    participants: number;
    maxParticipants: number;
    status: string;
    hallClass?: string | null;
    minCommitment: number;
    maxCommitment?: number | null;
    closesAt: Date;
    createdAt: Date;
    trueCost?: number | null;
    listedPrice?: number | null;
    surplus?: number | null;
    assetBookValue?: number;
    emojiSet?: string;
    assetImages?: string | null;
    assetVideos?: string | null;
    tour360Url?: string | null;
    documents?: string | null;
    locationOptions?: string | null;
    selectedLocation?: string | null;
    hall?: {
      id: string;
      status: string;
      sriScore?: number;
      ahgiScore?: number;
      closureStatus?: string;
    } | null;
    meridianCycle?: {
      id: string;
      phase: string;
      continent: string;
      endAt: Date;
    } | null;
    ownerships?: Array<{ userId: string; ownershipPercent: number }>;
  };
  userOwnership?: {
    ownershipPercent: number;
    amountCommitted: number;
    pacToken?: string | null;
    status: string;
  } | null;
  onCommitSuccess?: () => void;
}

const verticalLabels: Record<string, { name: string; emoji: string; color: string; gradient: string }> = {
  ledgerprop: { name: "LedgerProp", emoji: "🏠", color: "text-blue-400", gradient: "from-blue-500/30 to-blue-400/10" },
  ledgerauto: { name: "LedgerAuto", emoji: "🚗", color: "text-red-400", gradient: "from-red-500/30 to-red-400/10" },
  ledgertech: { name: "LedgerTech", emoji: "📱", color: "text-purple-400", gradient: "from-purple-500/30 to-purple-400/10" },
  ledgeredu: { name: "LedgerEdu", emoji: "🎓", color: "text-indigo-400", gradient: "from-indigo-500/30 to-indigo-400/10" },
  ledgerhealth: { name: "LedgerHealth", emoji: "🏥", color: "text-pink-400", gradient: "from-pink-500/30 to-pink-400/10" },
  ledgerbiz: { name: "LedgerBiz", emoji: "🏗️", color: "text-orange-400", gradient: "from-orange-500/30 to-orange-400/10" },
  ledgertravel: { name: "LedgerTravel", emoji: "✈️", color: "text-sky-400", gradient: "from-sky-500/30 to-sky-400/10" },
  ledgeragri: { name: "LedgerAgri", emoji: "🌾", color: "text-green-400", gradient: "from-green-500/30 to-green-400/10" },
  ledgerenergy: { name: "LedgerEnergy", emoji: "⚡", color: "text-yellow-400", gradient: "from-yellow-500/30 to-yellow-400/10" },
  ledgeraccess: { name: "LedgerAccess", emoji: "📡", color: "text-cyan-400", gradient: "from-cyan-500/30 to-cyan-400/10" },
};

const tabVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.2 } },
};

export function PoolDetail({ pool, userOwnership, onCommitSuccess }: PoolDetailProps) {
  const { user } = useAuth();
  const [commitOpen, setCommitOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "media" | "location" | "pir" | "governance">("overview");
  const [heroLoaded, setHeroLoaded] = useState(false);

  const fillPercent = Math.min((pool.committed / pool.target) * 100, 100);
  const vertical = verticalLabels[pool.verticalId] || { name: pool.verticalId, emoji: "📦", color: "text-white", gradient: "from-white/10 to-white/5" };
  const timeLeft = Math.max(0, new Date(pool.closesAt).getTime() - Date.now());
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const isCommitted = !!userOwnership;
  const canCommit = pool.status === "filling" && !isCommitted;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: FileText },
    { id: "media" as const, label: "Media Vault", icon: Globe },
    { id: "location" as const, label: "Location", icon: MapPin },
    { id: "pir" as const, label: "PIR", icon: Shield },
    ...(pool.hall ? [{ id: "governance" as const, label: "Governance", icon: Lock }] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a]"
      >
        <div className="h-72 relative">
          {pool.imageUrl ? (
            <>
              <img
                src={pool.imageUrl}
                alt={pool.name}
                onLoad={() => setHeroLoaded(true)}
                className={cn(
                  "h-full w-full object-cover transition-all duration-1000",
                  heroLoaded ? "scale-100 blur-0" : "scale-105 blur-sm"
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            </>
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br flex items-center justify-center text-7xl", vertical.gradient)}>
              {vertical.emoji}
            </div>
          )}

          {/* Floating glass info panel */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-3">
              <PoolStatusBadge status={pool.status} />
              {pool.hallClass && <PoolHallClassBadge hallClass={pool.hallClass} />}
              <span className={cn("text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/30 backdrop-blur-md border border-white/10", vertical.color)}>
                {vertical.name}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
              {pool.name}
            </h1>

            <div className="flex flex-wrap items-center gap-5 mt-3 text-[13px] text-white/40">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {pool.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {daysLeft} days remaining
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {pool.participants} / {pool.maxParticipants} participants
              </span>
            </div>
          </div>
        </div>

        {/* Progress strip */}
        <div className="px-6 md:px-8 pb-6 pt-4">
          <div className="flex justify-between text-[11px] font-medium text-white/30 mb-2">
            <span>
              <AnimatedNumber value={pool.committed} prefix="$" /> committed
            </span>
            <span className={cn("tabular-nums", fillPercent >= 90 ? "text-emerald-400" : "text-white/50")}>
              {fillPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden ring-1 ring-white/[0.04]">
            <motion.div
              className={cn(
                "h-full rounded-full",
                fillPercent >= 90
                  ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
                  : "bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/15">
            <span>Min ${pool.minCommitment}</span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Target: <AnimatedNumber value={pool.target} prefix="$" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Ownership Banner */}
      <AnimatePresence>
        {isCommitted && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.04] to-cyan-400/[0.02] p-5 flex items-center justify-between backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-cyan-500/10 p-2.5 border border-cyan-500/20">
                <Diamond className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cyan-400">
                  You own {userOwnership.ownershipPercent}% of this asset
                </p>
                <p className="text-[11px] text-white/25 mt-0.5 font-mono">
                  PAC: {userOwnership.pacToken || "Pending Forge"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white/60">
                <AnimatedNumber value={userOwnership.amountCommitted} prefix="$" />
              </p>
              <p className="text-[10px] text-white/20">committed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meridian Timer */}
      {pool.meridianCycle && pool.status === "filling" && (
        <PoolMeridianTimer
          phase={pool.meridianCycle.phase}
          endAt={pool.meridianCycle.endAt}
          continent={pool.meridianCycle.continent}
        />
      )}

      {/* Glass Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-300 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.06)]"
                : "text-white/25 hover:text-white/50 hover:bg-white/[0.03] border border-transparent"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="min-h-[300px]"
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <Card className="p-6 border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-4 tracking-tight">About This Asset</h3>
                  <p className="text-[13px] text-white/35 leading-[1.7]">
                    {pool.description || "No description provided by the Architect."}
                  </p>
                </Card>

                <Card className="p-6 border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-5 tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    Asset Economics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "True Acquisition Cost", value: pool.trueCost, hidden: true },
                      { label: "Listed Price", value: pool.listedPrice, hidden: true },
                      { label: "PIR (Reserve)", value: pool.surplus, color: "text-cyan-400" },
                      { label: "Asset Book Value", value: pool.assetBookValue, color: "text-white/60" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 hover:border-white/[0.08] transition-colors">
                        <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1.5">{item.label}</p>
                        <p className={cn("text-sm font-mono font-semibold", item.color || "text-white/50")}>
                          {item.hidden ? "Protected by 8th Ledger" : item.value ? `$${item.value.toLocaleString()}` : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="space-y-5">
                <Card className="p-6 border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-5 tracking-tight">Commitment</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Minimum", value: `$${pool.minCommitment}` },
                      { label: "Maximum", value: pool.maxCommitment ? `$${pool.maxCommitment.toLocaleString()}` : "Unlimited" },
                      { label: "Participants", value: `${pool.participants} / ${pool.maxParticipants}` },
                      { label: "8th Ledger Tithe", value: "20% of net revenue" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center text-[13px]">
                        <span className="text-white/25">{item.label}</span>
                        <span className="text-white/60 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {canCommit && user && (
                    <Button
                      onClick={() => setCommitOpen(true)}
                      className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm h-11 rounded-lg transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1.5" />
                      Commit to Earn
                    </Button>
                  )}

                  {canCommit && !user && (
                    <div className="mt-6 rounded-lg bg-white/[0.02] border border-white/[0.05] p-4 text-center">
                      <p className="text-xs text-white/25">Sign in to commit capital</p>
                    </div>
                  )}

                  {!canCommit && pool.status === "filling" && isCommitted && (
                    <div className="mt-6 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/15 p-4 text-center">
                      <p className="text-xs text-emerald-400 font-medium">You are committed to this pool</p>
                    </div>
                  )}
                </Card>

                {pool.hall && (
                  <PoolSriAhgi
                    sriScore={pool.hall.sriScore || 50}
                    ahgiScore={pool.hall.ahgiScore || 50}
                    hallStatus={pool.hall.status}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <PoolMediaVault
              images={pool.assetImages}
              videos={pool.assetVideos}
              tour360Url={pool.tour360Url}
              documents={pool.documents}
            />
          )}

          {activeTab === "location" && (
            <PoolLocationOptions options={pool.locationOptions} selected={pool.selectedLocation} />
          )}

          {activeTab === "pir" && <PoolPirPreview trueCost={pool.trueCost} surplus={pool.surplus} />}

          {activeTab === "governance" && pool.hall && (
            <Card className="p-6 border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl">
              <h3 className="text-sm font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                <Lock className="h-4 w-4 text-cyan-400" />
                Hall Governance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[13px] text-white/40">Hall Status</span>
                  <span className="text-[13px] font-medium text-white/70 capitalize">{pool.hall.status}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[13px] text-white/40">Hall ID</span>
                  <span className="text-[13px] font-mono text-white/50">#{pool.hall.id.slice(-6).toUpperCase()}</span>
                </div>
                {pool.hall.closureStatus !== "active" && (
                  <div className="p-4 rounded-lg bg-red-500/[0.04] border border-red-500/15">
                    <p className="text-[13px] text-red-400 font-medium">
                      Closure Protocol Active: {pool.hall.closureStatus}
                    </p>
                    <p className="text-[11px] text-white/20 mt-1">
                      The 8th Ledger has initiated protective measures for this asset.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] text-cyan-400/60 hover:text-cyan-400 cursor-pointer transition-colors">
                <span>Enter Hall Dashboard</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <PoolCommitModal
        poolId={pool.poolId}
        poolName={pool.name}
        poolTarget={pool.target}
        minCommitment={pool.minCommitment}
        maxCommitment={pool.maxCommitment || undefined}
        isOpen={commitOpen}
        onClose={() => setCommitOpen(false)}
        onSuccess={onCommitSuccess}
      />
    </div>
  );
}
