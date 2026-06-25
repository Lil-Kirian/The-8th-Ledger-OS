"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  Zap,
  Crown,
  Lock,
  HeartPulse,
  TrendingUp as TrendIcon,
  Hexagon,
  Plane,
  Clock,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Wheat,
  Battery,
} from "lucide-react";

type PositionStatus = "active" | "consensus" | "won" | "lost" | "returned";

interface VaultPosition {
  poolId: string;
  poolName: string;
  verticalId: string;
  committed: number;
  status: PositionStatus;
  returnAmount?: number;
  surplusAmount?: number;
  assetValue?: number;
  dateCommitted: string;
  dateResolved?: string;
}

/* ============================================================
   VERTICAL ICONS — 11 Ledger Verticals
   ============================================================ */
const VERTICAL_ICONS: Record<string, React.ElementType> = {
  // Current ledger names
  ledgerprop: Landmark,
  ledgerauto: Zap,
  ledgeredu: Crown,
  ledgeraccess: Lock,
  ledgerhealth: HeartPulse,
  ledgerbiz: TrendIcon,
  ledgertech: Hexagon,
  ledgertravel: Plane,
  ledgeragri: Wheat,
  ledgerenergy: Battery,
  ledgersport: Trophy,
  // Legacy fallbacks
  propvin: Landmark,
  autovin: Zap,
  eduvin: Crown,
  accessvin: Lock,
  healthvin: HeartPulse,
  bizvin: TrendIcon,
  techvin: Hexagon,
  travelvin: Plane,
  agrivin: Wheat,
  energyvin: Battery,
};

const VERTICAL_COLORS: Record<string, string> = {
  // Current ledger names
  ledgerprop: "text-amber-400",
  ledgerauto: "text-cyan-400",
  ledgeredu: "text-violet-400",
  ledgeraccess: "text-emerald-400",
  ledgerhealth: "text-rose-400",
  ledgerbiz: "text-orange-400",
  ledgertech: "text-indigo-400",
  ledgertravel: "text-sky-400",
  ledgeragri: "text-lime-400",
  ledgerenergy: "text-yellow-400",
  ledgersport: "text-red-400",
  // Legacy fallbacks
  propvin: "text-amber-400",
  autovin: "text-cyan-400",
  eduvin: "text-violet-400",
  accessvin: "text-emerald-400",
  healthvin: "text-rose-400",
  bizvin: "text-orange-400",
  techvin: "text-indigo-400",
  travelvin: "text-sky-400",
  agrivin: "text-lime-400",
  energyvin: "text-yellow-400",
};

/* ============================================================
   VERTICAL LABELS — Display names
   ============================================================ */
const VERTICAL_LABELS: Record<string, string> = {
  ledgerprop: "LedgerProp",
  ledgerauto: "LedgerAuto",
  ledgeredu: "LedgerEdu",
  ledgeraccess: "LedgerAccess",
  ledgerhealth: "LedgerHealth",
  ledgerbiz: "LedgerBiz",
  ledgertech: "LedgerTech",
  ledgertravel: "LedgerTravel",
  ledgeragri: "LedgerAgri",
  ledgerenergy: "LedgerEnergy",
  ledgersport: "SportLedger",
  // Legacy
  propvin: "PropVin",
  autovin: "AutoVin",
  eduvin: "EduVin",
  accessvin: "AccessVin",
  healthvin: "HealthVin",
  bizvin: "BizVin",
  techvin: "TechVin",
  travelvin: "TravelVin",
  agrivin: "AgriVin",
  energyvin: "EnergyVin",
};

function formatCurrency(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusConfig(status: PositionStatus) {
  switch (status) {
    case "active": return { label: "Active", color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock };
    case "consensus": return { label: "Consensus", color: "text-indigo-400", bg: "bg-indigo-500/10", icon: Hexagon };
    case "won": return { label: "Won", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 };
    case "lost": return { label: "Returned", color: "text-sky-400", bg: "bg-sky-500/10", icon: RotateCcw };
    case "returned": return { label: "Returned", color: "text-sky-400", bg: "bg-sky-500/10", icon: RotateCcw };
  }
}

interface PositionRowProps {
  position: VaultPosition;
}

export function PositionRow({ position }: PositionRowProps) {
  const status = getStatusConfig(position.status);
  const StatusIcon = status.icon;
  const VerticalIcon = VERTICAL_ICONS[position.verticalId] || Hexagon;
  const verticalColor = VERTICAL_COLORS[position.verticalId] || "text-slate-400";
  const verticalLabel = VERTICAL_LABELS[position.verticalId] || position.verticalId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group flex flex-col gap-3 rounded-xl border border-white/5 bg-[#0a0a14] p-4 transition-all hover:border-white/10 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ${verticalColor}`}>
          <VerticalIcon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{position.poolName}</h4>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
            <span className={verticalColor}>{verticalLabel}</span>
            <span>•</span>
            <span>Committed {formatDate(position.dateCommitted)}</span>
            {position.dateResolved && (
              <>
                <span>•</span>
                <span>Resolved {formatDate(position.dateResolved)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-6">
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Committed</p>
          <p className="text-sm font-bold text-white">{formatCurrency(position.committed)}</p>
        </div>
        {position.returnAmount && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Returned (50%)</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(position.returnAmount)}</p>
          </div>
        )}
        {position.surplusAmount && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Surplus</p>
            <p className="text-sm font-bold text-indigo-400">{formatCurrency(position.surplusAmount)}</p>
          </div>
        )}
        {position.assetValue && position.status === "won" && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Asset Won</p>
            <p className="text-sm font-bold text-amber-300">{formatCurrency(position.assetValue)}</p>
          </div>
        )}
        <span className={`flex items-center gap-1.5 rounded-md ${status.bg} px-2.5 py-1 text-[10px] font-semibold ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>
    </motion.div>
  );
}