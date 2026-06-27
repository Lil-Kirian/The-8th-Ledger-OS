"use client";

import React from "react";
import {
  Crown,
  Users,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wallet,
  Gavel,
  FileText,
  Hammer,
  ChevronRight,
  Ban,
  Zap,
  DollarSign,
  Briefcase,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HallMember {
  ledgerId: string;
  displayName: string;
  ownershipPercent: number;
  kycTier: string;
  role?: string;
  joinedAt: string;
  isActive: boolean;
}

interface ExecutiveCabinet {
  speakerId?: string;
  speakerName?: string;
  treasurerId?: string;
  treasurerName?: string;
  wardenId?: string;
  wardenName?: string;
  scribeId?: string;
  scribeName?: string;
  electedAt?: string;
  expiresAt?: string;
}

interface PirPillar {
  pillar: string;
  amount: number;
  spent: number;
  purpose: string;
}

interface HallAdminDetailProps {
  hallId: string;
  hallName: string;
  poolName: string;
  verticalId: string;
  hallClass: string;
  status: string;
  sriScore: number;
  ahgiScore: number;
  closureStatus: string;
  treasuryBalance: number;
  totalRevenue: number;
  monthlyRevenue: number;
  payrollReserve: number;
  pirDebt: number;
  closureReserve: number;
  totalDistributed: number;
  assetBookValue: number;
  dynamicValuePerPercent: number;
  workerCount: number;
  ownershipCount: number;
  executiveCabinet?: ExecutiveCabinet;
  pirAllocations?: PirPillar[];
  members?: HallMember[];
  lastDistributionAt?: string;
  createdAt: string;
  onExportRegistry?: () => void;
  onTriggerClosure?: () => void;
  onForceReform?: () => void;
}

const tierColors: Record<string, string> = {
  visitor: "text-slate-400 bg-slate-900/40 border-slate-700/30",
  sovereign: "text-cyan-400 bg-cyan-950/30 border-cyan-700/30",
  verified: "text-emerald-400 bg-emerald-950/30 border-emerald-700/30",
  whale: "text-amber-400 bg-amber-950/30 border-amber-700/30",
};

const hallClassConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  I: { label: "Class I — Passive", color: "text-blue-400", icon: Shield },
  II: { label: "Class II — Managed", color: "text-purple-400", icon: Briefcase },
  III: { label: "Class III — Active", color: "text-orange-400", icon: Hammer },
};

const sriTier = (score: number) => {
  if (score >= 90) return { label: "Platinum", badge: "👑", color: "text-amber-400" };
  if (score >= 75) return { label: "Gold", badge: "🥇", color: "text-yellow-400" };
  if (score >= 60) return { label: "Silver", badge: "🥈", color: "text-slate-300" };
  if (score >= 40) return { label: "Bronze", badge: "🥉", color: "text-orange-400" };
  return { label: "At Risk", badge: "⚠️", color: "text-red-400" };
};

const ahgiStatus = (score: number) => {
  if (score >= 80) return { label: "Thriving", color: "text-emerald-400", bg: "bg-emerald-900/20" };
  if (score >= 60) return { label: "Healthy", color: "text-blue-400", bg: "bg-blue-900/20" };
  if (score >= 40) return { label: "Stagnant", color: "text-amber-400", bg: "bg-amber-900/20" };
  if (score >= 20) return { label: "Declining", color: "text-orange-400", bg: "bg-orange-900/20" };
  return { label: "Critical", color: "text-red-400", bg: "bg-red-900/20" };
};

const closureConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-900/20", icon: CheckCircle2 },
  warning: { label: "Warning", color: "text-amber-400", bg: "bg-amber-900/20", icon: AlertTriangle },
  decision: { label: "Decision", color: "text-orange-400", bg: "bg-orange-900/20", icon: Clock },
  liquidation: { label: "Liquidation", color: "text-red-400", bg: "bg-red-900/20", icon: TrendingDown },
  dissolved: { label: "Dissolved", color: "text-slate-400", bg: "bg-slate-800/40", icon: Ban },
};

const pillarNames: Record<string, string> = {
  shield: "The Shield",
  seal: "The Seal",
  forge: "The Forge",
  spire: "The Spire",
  vanguard: "The Vanguard",
  sanctuary: "The Sanctuary",
};

export default function HallAdminDetail({
  hallId,
  hallName,
  poolName,
  verticalId,
  hallClass,
  status,
  sriScore,
  ahgiScore,
  closureStatus,
  treasuryBalance,
  totalRevenue,
  monthlyRevenue,
  payrollReserve,
  pirDebt,
  closureReserve,
  totalDistributed,
  assetBookValue,
  dynamicValuePerPercent,
  workerCount,
  ownershipCount,
  executiveCabinet,
  pirAllocations,
  members,
  lastDistributionAt,
  createdAt,
  onExportRegistry,
  onTriggerClosure,
  onForceReform,
}: HallAdminDetailProps) {
  const sri = sriTier(sriScore);
  const ahgi = ahgiStatus(ahgiScore);
  const closure = closureConfig[closureStatus] || closureConfig.active;
  const cls = hallClassConfig[hallClass] || hallClassConfig.I;
  const ClsIcon = cls.icon;
  const ClosureIcon = closure.icon;

  const totalPir = pirAllocations?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalPirSpent = pirAllocations?.reduce((sum, p) => sum + p.spent, 0) || 0;

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl space-y-6">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0d0d1a]">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Hall #{hallId.slice(-6)}
              </span>
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1", cls.color, "bg-slate-900/40 border-slate-700/30")}>
                <ClsIcon size={10} />
                {cls.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{hallName}</h2>
            <p className="text-xs text-slate-500">
              {poolName} • {verticalId.replace("ledger", "Ledger")} • {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", closure.bg, closure.color, "border-slate-700/30")}>
              <ClosureIcon size={12} />
              {closure.label}
            </div>
            {status === "live" && (
              <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-900/20 border border-emerald-700/30 text-emerald-400 flex items-center gap-1.5">
                <Zap size={12} />
                LIVE
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* SRI */}
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">SRI Score</span>
              <span className={cn("text-lg font-bold", sri.color)}>{sri.badge} {sriScore}</span>
            </div>
            <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", sriScore >= 60 ? "bg-emerald-500/40" : sriScore >= 40 ? "bg-amber-500/40" : "bg-red-500/40")} style={{ width: `${sriScore}%` }} />
            </div>
            <div className={cn("text-[10px] font-bold mt-2", sri.color)}>{sri.label} Tier</div>
          </div>

          {/* AHGI */}
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">AHGI Score</span>
              <span className={cn("text-lg font-bold", ahgi.color)}>{ahgiScore}</span>
            </div>
            <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", ahgiScore >= 60 ? "bg-blue-500/40" : ahgiScore >= 40 ? "bg-amber-500/40" : "bg-red-500/40")} style={{ width: `${ahgiScore}%` }} />
            </div>
            <div className={cn("text-[10px] font-bold mt-2", ahgi.color)}>{ahgi.label}</div>
          </div>

          {/* Dynamic Valuation */}
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Dynamic Valuation</span>
              <span className="text-lg font-bold text-cyan-400">${dynamicValuePerPercent.toLocaleString()}/1%</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <DollarSign size={10} />
              Asset Book Value: ${assetBookValue.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
              <Users size={10} />
              {ownershipCount} owners
            </div>
          </div>
        </div>

        {/* Treasury Snapshot */}
        <div className="p-5 rounded-xl bg-slate-800/20 border border-slate-700/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Wallet size={16} className="text-cyan-400" />
              Hall Treasury
            </h3>
            {lastDistributionAt && (
              <span className="text-[10px] text-slate-500">
                Last distribution: {new Date(lastDistributionAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Balance</div>
              <div className="text-lg font-bold text-slate-100">${treasuryBalance.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Total Revenue</div>
              <div className="text-lg font-bold text-emerald-400">${totalRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Monthly Revenue</div>
              <div className="text-lg font-bold text-blue-400">${monthlyRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Total Distributed</div>
              <div className="text-lg font-bold text-purple-400">${totalDistributed.toLocaleString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/20">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Payroll Reserve</div>
              <div className="text-sm font-bold text-amber-400">${payrollReserve.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">PIR Debt</div>
              <div className="text-sm font-bold text-red-400">${pirDebt.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Closure Reserve</div>
              <div className="text-sm font-bold text-slate-400">${closureReserve.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Executive Cabinet */}
        {executiveCabinet && (
          <div className="p-5 rounded-xl bg-slate-800/20 border border-slate-700/30">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
              <Crown size={16} className="text-amber-400" />
              Executive Cabinet
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { role: "Speaker", id: executiveCabinet.speakerId, name: executiveCabinet.speakerName, icon: MessageSquare, color: "text-cyan-400" },
                { role: "Treasurer", id: executiveCabinet.treasurerId, name: executiveCabinet.treasurerName, icon: DollarSign, color: "text-emerald-400" },
                { role: "Warden", id: executiveCabinet.wardenId, name: executiveCabinet.wardenName, icon: Shield, color: "text-amber-400" },
                { role: "Scribe", id: executiveCabinet.scribeId, name: executiveCabinet.scribeName, icon: FileText, color: "text-purple-400" },
              ].map((exec) => (
                <div key={exec.role} className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <exec.icon size={12} className={exec.color} />
                    <span className="text-[10px] font-bold uppercase text-slate-500">{exec.role}</span>
                  </div>
                  {exec.id ? (
                    <>
                      <div className="text-xs font-bold text-slate-200 truncate">{exec.name || exec.id}</div>
                      <div className="text-[9px] text-slate-600 font-mono mt-0.5">{exec.id}</div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-600 italic">Vacant</div>
                  )}
                </div>
              ))}
            </div>
            {executiveCabinet.electedAt && (
              <div className="text-[10px] text-slate-600 mt-3">
                Elected: {new Date(executiveCabinet.electedAt).toLocaleDateString()}
                {executiveCabinet.expiresAt && ` • Expires: ${new Date(executiveCabinet.expiresAt).toLocaleDateString()}`}
              </div>
            )}
          </div>
        )}

        {/* PIR Allocation */}
        {pirAllocations && pirAllocations.length > 0 && (
          <div className="p-5 rounded-xl bg-slate-800/20 border border-slate-700/30">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
              <Shield size={16} className="text-blue-400" />
              Protocol Infrastructure Reserve
            </h3>
            <div className="space-y-3">
              {pirAllocations.map((p) => {
                const pct = p.amount > 0 ? (p.spent / p.amount) * 100 : 0;
                return (
                  <div key={p.pillar} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <div className="text-[10px] font-bold text-slate-400">{pillarNames[p.pillar] || p.pillar}</div>
                      <div className="text-[10px] text-slate-600">${p.amount.toLocaleString()}</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/40 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <div className="text-[10px] text-slate-500">${p.spent.toLocaleString()} spent</div>
                      <div className="text-[9px] text-slate-600">{p.purpose}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/20 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Total PIR: ${totalPir.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Spent: ${totalPirSpent.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Workers */}
        {workerCount > 0 && (
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-900/20 border border-orange-700/30 flex items-center justify-center">
                <Wrench size={18} className="text-orange-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">Forge Ledger</div>
                <div className="text-[10px] text-slate-500">{workerCount} active workers</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-600" />
          </div>
        )}

        {/* Member Directory */}
        {members && members.length > 0 && (
          <div className="p-5 rounded-xl bg-slate-800/20 border border-slate-700/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Users size={16} className="text-cyan-400" />
                Sovereign Registry ({members.length})
              </h3>
              <button
                onClick={onExportRegistry}
                className="px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5"
              >
                <FileText size={10} />
                Export CSV
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map((m) => (
                <div key={m.ledgerId} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700/20">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {m.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{m.displayName}</div>
                    <div className="text-[9px] text-slate-600 font-mono">{m.ledgerId}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-cyan-400">{m.ownershipPercent.toFixed(2)}%</div>
                    <div className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block", tierColors[m.kycTier] || tierColors.visitor)}>
                      {m.kycTier}
                    </div>
                  </div>
                  {m.role && (
                    <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-900/20 text-amber-400 border border-amber-700/20">
                      {m.role}
                    </div>
                  )}
                  {!m.isActive && (
                    <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-900/20 text-red-400 border border-red-700/20">
                      DORMANT
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onExportRegistry}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-all"
          >
            <FileText size={14} />
            Export PAC Registry
          </button>
          {closureStatus === "active" && sriScore < 40 && (
            <button
              onClick={onForceReform}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-700/30 text-xs font-bold text-amber-400 hover:bg-amber-900/30 transition-all"
            >
              <Gavel size={14} />
              Force Governance Reform
            </button>
          )}
          {(closureStatus === "active" || closureStatus === "warning") && ahgiScore < 20 && (
            <button
              onClick={onTriggerClosure}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-900/20 border border-red-700/30 text-xs font-bold text-red-400 hover:bg-red-900/30 transition-all"
            >
              <AlertTriangle size={14} />
              Trigger Closure Protocol
            </button>
          )}
        </div>
      </div>
    </div>
  );
}