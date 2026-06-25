"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Lock, Umbrella, FileText, Hammer, Rocket, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const pillars = [
  { key: "shield", label: "The Shield", icon: Umbrella, color: "text-blue-400", bg: "from-blue-500/10 to-blue-400/5", border: "border-blue-500/15", bar: "from-blue-500 to-blue-400", percent: 25, desc: "Insurance, casualty, liability, force majeure" },
  { key: "seal", label: "The Seal", icon: FileText, color: "text-purple-400", bg: "from-purple-500/10 to-purple-400/5", border: "border-purple-500/15", bar: "from-purple-500 to-purple-400", percent: 20, desc: "Entity registration, SPV, legal documents" },
  { key: "forge", label: "The Forge", icon: Hammer, color: "text-orange-400", bg: "from-orange-500/10 to-orange-400/5", border: "border-orange-500/15", bar: "from-orange-500 to-orange-400", percent: 20, desc: "Repairs, upkeep, vendor contracts, payroll" },
  { key: "spire", label: "The Spire", icon: Rocket, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-400/5", border: "border-cyan-500/15", bar: "from-cyan-500 to-cyan-400", percent: 15, desc: "Protocol development, infrastructure, API" },
  { key: "vanguard", label: "The Vanguard", icon: Sparkles, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-400/5", border: "border-emerald-500/15", bar: "from-emerald-500 to-emerald-400", percent: 12, desc: "R&D, geographic expansion, ecosystem grants" },
  { key: "sanctuary", label: "The Sanctuary", icon: Heart, color: "text-pink-400", bg: "from-pink-500/10 to-pink-400/5", border: "border-pink-500/15", bar: "from-pink-500 to-pink-400", percent: 8, desc: "Vacancy coverage, dividend smoothing, closure protection" },
];

interface PoolPirPreviewProps {
  trueCost?: number | null;
  surplus?: number | null;
}

export function PoolPirPreview({ trueCost, surplus }: PoolPirPreviewProps) {
  const pirAmount = surplus || (trueCost ? trueCost : 0);
  const totalTarget = (trueCost || 0) + pirAmount;

  return (
    <div className="space-y-5">
      <Card className="p-6 border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-lg bg-cyan-500/10 p-2.5 border border-cyan-500/20">
            <Lock className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Protocol Infrastructure Reserve</h3>
            <p className="text-[11px] text-white/20">The vault of the 8th Ledger</p>
          </div>
        </div>

        <p className="text-[13px] text-white/25 mb-6 leading-[1.7]">
          The PIR transforms raw acquisition cost into a fully legal, insured, governed, income-producing asset. 
          It is not profit. It is infrastructure. The public knows it exists and what it protects — 
          but never sees its contents, its movements, or its depths.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pillars.map((pillar, i) => {
            const amount = Math.round(pirAmount * (pillar.percent / 100));
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={cn(
                  "group relative rounded-xl border p-4 bg-gradient-to-br transition-all duration-300 cursor-default",
                  pillar.border,
                  pillar.bg,
                  "hover:shadow-lg hover:border-opacity-30"
                )}
              >
                {/* Hover glow */}
                <div className={cn(
                  "absolute -inset-px rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm",
                  pillar.bg.replace("bg-gradient-to-br", "")
                )} />

                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("rounded-md p-1.5 bg-black/20", pillar.color)}>
                        <Icon className={cn("h-3.5 w-3.5", pillar.color)} />
                      </div>
                      <span className={cn("text-xs font-bold", pillar.color)}>{pillar.label}</span>
                    </div>
                    <span className="text-[10px] text-white/15 font-mono">{pillar.percent}%</span>
                  </div>

                  <div className="h-1.5 rounded-full bg-black/20 overflow-hidden mb-3">
                    <motion.div
                      className={cn("h-full rounded-full bg-gradient-to-r", pillar.bar)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pillar.percent}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>

                  <p className="text-sm font-mono font-semibold text-white/70">${amount.toLocaleString()}</p>
                  <p className="text-[10px] text-white/15 mt-1.5 leading-relaxed">{pillar.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-white/20 uppercase tracking-wider">True Acquisition Cost</span>
              <span className="text-sm font-mono text-white/50">${trueCost?.toLocaleString() || "Protected"}</span>
            </div>
            <div className="h-px bg-white/[0.04]" />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-white/20 uppercase tracking-wider">Protocol Infrastructure Reserve</span>
              <span className="text-sm font-mono text-cyan-400/70">${pirAmount.toLocaleString()}</span>
            </div>
            <div className="h-px bg-white/[0.04]" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-white/30 uppercase tracking-wider font-semibold">Total Pool Target</span>
              <span className="text-base font-mono font-bold text-white">${totalTarget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}