"use client";

import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // FIX: added AnimatePresence
import {
  ArrowLeft,
  Activity,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Radio,
  ChevronRight,
  Sparkles,
  Lock,
  Hammer,
  Package,
  PiggyBank,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OperationsDashboard } from "@/components/halls/operations-dashboard";
import { useHall } from "@/hooks/use-hall";
import Link from "next/link";

export default function HallOperationsPage() {
  const params = useParams();
  const hallId = params.id as string;
  const { data: hall, isLoading } = useHall(hallId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-xl border border-cyan-500/20 animate-ping" />
          </div>
          <p className="text-sm text-slate-500 tracking-wider uppercase">Initializing Operations</p>
        </div>
      </div>
    );
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-lg text-white font-medium">Hall Not Found</p>
          <p className="text-sm text-slate-500">The hall you are looking for does not exist or you do not have access.</p>
          <Link href="/halls">
            <Button variant="outline" className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Halls
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOperational = hall.status === "live" || hall.status === "operating";
  const hasInventory = hall.inventoryEnabled || false;
  const hasForge = hall.forgeEnabled || false;
  const hasOperations = hasInventory || hasForge;

  // Hall class styling
  const classConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
    I: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Class I — Passive" },
    II: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Class II — Managed" },
    III: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Class III — Active" },
  };
  const hallClass = classConfig[hall.hallClass || "I"] || classConfig.I;

  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/3 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          {/* Back + Breadcrumb */}
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/halls/${hallId}`}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Hall
              </Button>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-xs text-slate-600 uppercase tracking-wider font-medium">Operations</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-xs text-cyan-500/60 uppercase tracking-wider font-medium">Command</span>
          </div>

          {/* Main Hero Card */}
          <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Left: Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Crown className="w-7 h-7 text-cyan-400" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050508] border border-cyan-500/30 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white tracking-tight">
                        {hall.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">HALL-{hallId.slice(-6).toUpperCase()}</span>
                        <span className="text-slate-700">·</span>
                        <Badge className={`${hallClass.bg} ${hallClass.color} ${hallClass.border} text-[10px] font-bold`}>
                          {hallClass.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                    The operations command center for this hall. Manage active inventory, forge operations, 
                    internal contribution pools, revenue distribution, and governance proposals.
                  </p>
                </div>

                {/* Right: Live Status */}
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    {isOperational ? (
                      <>
                        <div className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-sm font-bold text-emerald-400">LIVE</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        <span className="text-sm font-bold text-amber-400">{hall.status.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasInventory && (
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
                        <Package className="w-3 h-3 mr-1" />
                        Inventory
                      </Badge>
                    )}
                    {hasForge && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                        <Hammer className="w-3 h-3 mr-1" />
                        Forge
                      </Badge>
                    )}
                    {!hasOperations && (
                      <Badge className="bg-slate-700/30 text-slate-500 border-slate-700/30 text-[10px]">
                        <Lock className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-cyan-500/50" />
                      SYNCED · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom stat bar */}
            <div className="border-t border-white/[0.04] bg-white/[0.01] px-8 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">SRI Score</p>
                    <p className="text-lg font-bold text-white">{hall.sriScore || 50}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">AHGI Score</p>
                    <p className="text-lg font-bold text-white">{hall.ahgiScore || 50}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <PiggyBank className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">IHCP Balance</p>
                    <p className="text-lg font-bold text-white">${(hall.ihcpBalance || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Hall Class</p>
                    <p className="text-lg font-bold text-white">{hall.hallClass || "I"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Row (if not operational or no ops enabled) */}
        <AnimatePresence>
          {(!isOperational || !hasOperations) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {!isOperational && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-950/5 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">Hall Not Live</p>
                    <p className="text-xs text-slate-500">Operations will unlock when hall goes live</p>
                  </div>
                </div>
              )}
              {isOperational && !hasInventory && (
                <div className="rounded-xl border border-cyan-500/10 bg-cyan-950/5 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cyan-400">Inventory Locked</p>
                    <p className="text-xs text-slate-500">Vote to enable inventory management</p>
                  </div>
                </div>
              )}
              {isOperational && !hasForge && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-950/5 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Hammer className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">Forge Locked</p>
                    <p className="text-xs text-slate-500">Vote to enable worker management</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Operations Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <OperationsDashboard
            hall={{
              id: hall.id,
              name: hall.name,
              status: hall.status,
              hallClass: hall.hallClass || "I",
              inventoryEnabled: hall.inventoryEnabled || false,
              forgeEnabled: hall.forgeEnabled || false,
              ihcpBalance: hall.ihcpBalance || 0,
              sriScore: hall.sriScore || 50,
              ahgiScore: hall.ahgiScore || 50,
              closureStatus: hall.closureStatus || "active",
              businessStatus: hall.businessStatus || "operating",
            }}
            isAdmin={hall.isAdmin || false}
          />
        </motion.div>
      </div>
    </div>
  );
}