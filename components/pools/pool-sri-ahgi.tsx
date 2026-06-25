"use client";

import { Card } from "@/components/ui/card";
import { Activity, Crown, Medal, Award, AlertTriangle } from "lucide-react";

interface PoolSriAhgiProps {
  sriScore: number;
  ahgiScore: number;
  hallStatus?: string;
}

const sriTier = (score: number) => {
  if (score >= 90) return { label: "Platinum", icon: Crown, color: "text-amber-400", bar: "from-amber-500 to-amber-400" };
  if (score >= 75) return { label: "Gold", icon: Medal, color: "text-yellow-400", bar: "from-yellow-500 to-yellow-400" };
  if (score >= 60) return { label: "Silver", icon: Award, color: "text-slate-300", bar: "from-slate-400 to-slate-300" };
  if (score >= 40) return { label: "Bronze", icon: Award, color: "text-orange-400", bar: "from-orange-500 to-orange-400" };
  return { label: "At Risk", icon: AlertTriangle, color: "text-red-400", bar: "from-red-500 to-red-400" };
};

const ahgiStatus = (score: number) => {
  if (score >= 80) return { label: "Thriving", color: "text-emerald-400", bar: "from-emerald-500 to-emerald-400" };
  if (score >= 60) return { label: "Healthy", color: "text-cyan-400", bar: "from-cyan-500 to-cyan-400" };
  if (score >= 40) return { label: "Stagnant", color: "text-yellow-400", bar: "from-yellow-500 to-yellow-400" };
  if (score >= 20) return { label: "Declining", color: "text-orange-400", bar: "from-orange-500 to-orange-400" };
  return { label: "Critical", color: "text-red-400", bar: "from-red-500 to-red-400" };
};

export function PoolSriAhgi({ sriScore, ahgiScore, hallStatus }: PoolSriAhgiProps) {
  const sri = sriTier(sriScore);
  const ahgi = ahgiStatus(ahgiScore);
  const SriIcon = sri.icon;

  return (
    <Card className="p-5 border-white/5 bg-[#0a0a0a]">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Sovereign Reputation Index</span>
            <span className={`text-xs font-medium ${sri.color}`}>{sri.label}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${sri.bar}`} style={{ width: `${sriScore}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/20">{sriScore}/100</span>
            <SriIcon className={`h-3 w-3 ${sri.color}`} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Asset Health Growth Index</span>
            <span className={`text-xs font-medium ${ahgi.color}`}>{ahgi.label}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${ahgi.bar}`} style={{ width: `${ahgiScore}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/20">{ahgiScore}/100</span>
            <Activity className={`h-3 w-3 ${ahgi.color}`} />
          </div>
        </div>

        {hallStatus && (
          <div className="pt-2 border-t border-white/5">
            <span className="text-[10px] text-white/20">
              Hall Status: <span className="text-white/40">{hallStatus}</span>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}