"use client";

import { motion } from "framer-motion";
import {
  Lock,
  DollarSign,
  Users,
  FileText,
  Download,
  Hash,
  Wallet,
} from "lucide-react";

interface LiquidationData {
  hallId: string;
  hallName: string;
  assetSold: number;
  outstandingPirDebt: number;
  liquidationFee: number;
  taxObligations: number;
  workerSeverance: number;
  netProceeds: number;
  yourOwnership: number;
  yourPayout: number;
  workersTerminated: number;
  workersSevered: number;
  closureDate: string;
  auditHash: string;
}

interface ClosureLiquidationProps {
  data: LiquidationData;
  onDownloadStatement: () => void;
  onViewAudit: () => void;
  onReinvest: () => void;
}

export default function ClosureLiquidation({
  data,
  onDownloadStatement,
  onViewAudit,
  onReinvest,
}: ClosureLiquidationProps) {
  const payoutOrder = [
    { label: "Asset Sold", value: data.assetSold, type: "positive" as const },
    { label: "8th Ledger Liquidation Fee (2.5%)", value: -data.liquidationFee, type: "fee" as const },
    { label: "Outstanding PIR Debt", value: -data.outstandingPirDebt, type: "debt" as const },
    { label: "Tax Obligations", value: -data.taxObligations, type: "fee" as const },
    { label: "Worker Severance", value: -data.workerSeverance, type: "worker" as const },
  ];

  const typeColors = {
    positive: "text-slate-200",
    fee: "text-amber-400",
    debt: "text-red-400",
    worker: "text-rose-400",
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent" />
        <div className="relative z-10 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center"
          >
            <Lock className="w-8 h-8 text-slate-500" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              🔒 HALL #{data.hallId} — LIQUIDATION COMPLETE
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {data.hallName} — Dissolved on {new Date(data.closureDate).toLocaleDateString()}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg">
            <Hash className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs font-mono text-slate-500">
              {data.auditHash}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Payout Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            Liquidation Payout Order
          </h3>
        </div>
        <div className="p-5 space-y-3">
          {payoutOrder.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-400">{item.label}</span>
              </div>
              <span className={`text-sm font-mono font-bold ${typeColors[item.type]}`}>
                {item.value >= 0 ? "" : "-"}
                ${Math.abs(item.value).toLocaleString()}
              </span>
            </motion.div>
          ))}

          <div className="h-px bg-slate-800 my-2" />

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-bold text-slate-200">Net Proceeds</span>
            <span className="text-lg font-bold text-emerald-400">
              ${data.netProceeds.toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Your Payout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-emerald-950/10 border border-emerald-900/50 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Your Payout
            </h3>
            <p className="text-xs text-emerald-400/70 mt-1">
              {data.yourOwnership}% ownership
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-emerald-400">
              ${data.yourPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-400/70">→ Your Wallet</div>
          </div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(data.yourPayout / data.netProceeds) * 100}%` }}
            transition={{ duration: 1.5, delay: 0.6 }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
      </motion.div>

      {/* Workers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
      >
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          Worker Impact
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Workers Notified</div>
            <div className="text-lg font-bold text-slate-200">{data.workersTerminated}</div>
            <div className="text-xs text-slate-600">30 days notice</div>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Severance Paid</div>
            <div className="text-lg font-bold text-rose-400">{data.workersSevered}</div>
            <div className="text-xs text-slate-600">1 month per year of service</div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          8th Ledger notified all workers, paid severance from liquidation proceeds, and offered placement in other halls where available. Workers did not see hall financials.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={onDownloadStatement}
          className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Statement
        </button>
        <button
          onClick={onViewAudit}
          className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Full Audit
        </button>
        <button
          onClick={onReinvest}
          className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-bold text-slate-950 transition-colors flex items-center justify-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          Reinvest in New Pool
        </button>
      </motion.div>

      {/* Final Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-6"
      >
        <p className="text-sm text-slate-500">
          This hall is now <span className="text-slate-400 font-bold">DISSOLVED</span>.
        </p>
        <p className="text-xs text-slate-600 mt-1">
          You no longer own this asset. Thank you for being a sovereign.
        </p>
      </motion.div>
    </div>
  );
}