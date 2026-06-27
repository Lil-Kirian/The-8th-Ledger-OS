"use client";

import { motion } from "framer-motion";
import {
  Vault,
  Clock,
  Wallet,
  AlertTriangle,
  Unlock,
  User,
  Calendar,
  Hash,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface VaultItem {
  id: string;
  ownershipId: string;
  hallId: string;
  hallName: string;
  vertical: string;
  percent: number;
  vaultedAt: string;
  accumulatedDividends: number;
  dynamicValue: number;
  daysUntilAuction: number;
  status: "VAULTED" | "AUCTION_PENDING" | "RECLAIMED";
}

interface VaultPanelProps {
  items: VaultItem[];
  onReclaim: (vaultId: string) => void;
  totalVaultedValue: number;
  totalAccumulatedDividends: number;
}

export default function VaultPanel({
  items,
  onReclaim,
  totalVaultedValue,
  totalAccumulatedDividends,
}: VaultPanelProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const year2Items = items.filter((i) => i.status === "VAULTED");
  const year3Items = items.filter((i) => i.status === "AUCTION_PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Vault className="w-6 h-6 text-cyan-400" />
            The Dormancy Vault
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Year 2 — PACs held in trust. Reclaim instantly.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Total Value</div>
          <div className="text-xl font-bold text-cyan-400">
            ${totalVaultedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Vault className="w-5 h-5" />}
          label="Vaulted PACs"
          value={items.length.toString()}
          color="cyan"
          delay={0.1}
        />
        <SummaryCard
          icon={<Wallet className="w-5 h-5" />}
          label="Accumulated Dividends"
          value={`$${totalAccumulatedDividends.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          color="emerald"
          delay={0.2}
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="Avg. Days Vaulted"
          value={items.length > 0
            ? Math.round(
                items.reduce((sum, i) => sum + (Date.now() - new Date(i.vaultedAt).getTime()) / (1000 * 60 * 60 * 24), 0) / items.length
              ).toString()
            : "0"}
          color="amber"
          delay={0.3}
        />
      </div>

      {/* Year 2 Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-xl flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-amber-400">Year 2 — Vault Active</div>
          <p className="text-xs text-amber-400/70 mt-1">
            Your PACs are safe but dormant. Dividends continue to accrue. 
            If you do not reclaim by Year 3, your PACs will be listed at auction at 120% of Dynamic Valuation.
          </p>
        </div>
      </motion.div>

      {/* Vault Items */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Vaulted Assets ({year2Items.length})
        </div>

        {year2Items.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
            <Vault className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No PACs in vault.</p>
          </div>
        ) : (
          year2Items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">#{item.hallId}</span>
                        <span className="text-xs text-cyan-400">{item.vertical}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-200">{item.hallName}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.percent}% ownership
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Vaulted {new Date(item.vaultedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-200">
                      ${item.dynamicValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-emerald-400 mt-0.5">
                      +${item.accumulatedDividends.toLocaleString(undefined, { maximumFractionDigits: 2 })} dividends
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-800/50 bg-slate-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.daysUntilAuction} days until auction</span>
                </div>
                <button
                  onClick={() => onReclaim(item.id)}
                  className="px-4 py-2 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-cyan-400 text-xs font-bold hover:bg-cyan-950/50 transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Reclaim
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Year 3 Auction Pending */}
      {year3Items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Auction Pending ({year3Items.length})
          </div>

          {year3Items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-red-950/10 border border-red-900/50 rounded-xl p-5 opacity-75"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-400">{item.hallName}</h3>
                  <p className="text-xs text-red-400/70 mt-1">
                    Listed at 120% valuation — Auction opens in {item.daysUntilAuction} days
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "cyan" | "emerald" | "amber";
  delay: number;
}) {
  const colors = {
    cyan: "bg-cyan-950/30 border-cyan-900/50 text-cyan-400",
    emerald: "bg-emerald-950/30 border-emerald-900/50 text-emerald-400",
    amber: "bg-amber-950/30 border-amber-900/50 text-amber-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className={`p-4 rounded-xl border ${colors[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-2 opacity-80">{icon}</div>
      <div className="text-xl font-bold text-slate-100">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider mt-1 opacity-90">{label}</div>
    </motion.div>
  );
}