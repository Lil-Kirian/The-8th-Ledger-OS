"use client";

import { motion } from "framer-motion";
import {
  Vote,
  TrendingUp,
  Clock,
  Activity,
  Users,
  ArrowUpRight,
  Minus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface GovernanceDetail {
  votesCast: number;
  eligibleVoters: number;
  quorumPercentage: number;
}

interface RevenueDetail {
  positiveMonths: number;
  totalMonths: number;
  streak: number;
}

interface DividendDetail {
  onTime: number;
  delayed: number;
  missed: number;
}

interface ProposalDetail {
  passed: number;
  total: number;
  avgTimeToDecision: number;
}

interface DormancyDetail {
  inactiveOwners: number;
  totalOwners: number;
}

interface MarketplaceDetail {
  pacTurnover: number;
  avgHoldTime: number;
}

interface SRIDetails {
  governanceActivity: GovernanceDetail;
  revenueConsistency: RevenueDetail;
  dividendReliability: DividendDetail;
  proposalQuality: ProposalDetail;
  dormancyRate: DormancyDetail;
  marketplaceVelocity: MarketplaceDetail;
}

interface SRIComponents {
  governanceActivity: number;
  revenueConsistency: number;
  dividendReliability: number;
  proposalQuality: number;
  dormancyRate: number;
  marketplaceVelocity: number;
}

interface SRIBreakdownProps {
  components: SRIComponents;
  details: SRIDetails;
}

interface ComponentMeta {
  label: string;
  weight: number;
  icon: React.ReactNode;
  description: string;
  goodThreshold: number;
  inverted?: boolean;
}

const COMPONENT_META: Record<string, ComponentMeta> = {
  governanceActivity: {
    label: "Governance Activity",
    weight: 25,
    icon: <Vote className="w-5 h-5" />,
    description:
      "Percentage of eligible voters who cast votes. High participation indicates engaged ownership.",
    goodThreshold: 70,
  },
  revenueConsistency: {
    label: "Revenue Consistency",
    weight: 25,
    icon: <TrendingUp className="w-5 h-5" />,
    description:
      "Ratio of positive revenue months to total operating months.",
    goodThreshold: 80,
  },
  dividendReliability: {
    label: "Dividend Reliability",
    weight: 20,
    icon: <Clock className="w-5 h-5" />,
    description:
      "Percentage of dividends distributed on time without delay or error.",
    goodThreshold: 90,
  },
  proposalQuality: {
    label: "Proposal Quality",
    weight: 15,
    icon: <Activity className="w-5 h-5" />,
    description:
      "Pass rate of proposals. Too many failures indicates poor governance planning.",
    goodThreshold: 60,
  },
  dormancyRate: {
    label: "Dormancy Rate",
    weight: 10,
    icon: <Users className="w-5 h-5" />,
    description:
      "Percentage of inactive owners. Lower is better. High dormancy weakens governance.",
    goodThreshold: 70,
    inverted: true,
  },
  marketplaceVelocity: {
    label: "Marketplace Velocity",
    weight: 5,
    icon: <ArrowUpRight className="w-5 h-5" />,
    description:
      "PAC turnover rate. Lower turnover indicates stable, committed ownership.",
    goodThreshold: 80,
    inverted: true,
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-slate-400";
  return "text-red-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 40) return "bg-slate-500";
  return "bg-red-500";
}

interface TrendResult {
  icon: React.ReactNode;
  color: string;
  label: string;
}

function getTrend(score: number, meta: ComponentMeta): TrendResult {
  const threshold = meta.goodThreshold;
  const isInverted = meta.inverted ?? false;

  if (isInverted) {
    if (score >= threshold)
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: "text-emerald-400",
        label: "Healthy",
      };
    if (score >= threshold - 20)
      return {
        icon: <Minus className="w-4 h-4" />,
        color: "text-amber-400",
        label: "Moderate",
      };
    return {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-red-400",
      label: "At Risk",
    };
  }

  if (score >= threshold)
    return {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "text-emerald-400",
      label: "Strong",
    };
  if (score >= threshold - 20)
    return {
      icon: <Minus className="w-4 h-4" />,
      color: "text-amber-400",
      label: "Fair",
    };
  return {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-400",
    label: "Weak",
  };
}

function getDetailText(key: string, detail: any): string {
  switch (key) {
    case "governanceActivity": {
      const d = detail as GovernanceDetail;
      return `${d.votesCast}/${d.eligibleVoters} voters • ${d.quorumPercentage}% quorum`;
    }
    case "revenueConsistency": {
      const d = detail as RevenueDetail;
      return `${d.positiveMonths}/${d.totalMonths} months positive • ${d.streak} month streak`;
    }
    case "dividendReliability": {
      const d = detail as DividendDetail;
      return `${d.onTime} on time • ${d.delayed} delayed • ${d.missed} missed`;
    }
    case "proposalQuality": {
      const d = detail as ProposalDetail;
      return `${d.passed}/${d.total} passed • ${d.avgTimeToDecision}d avg decision`;
    }
    case "dormancyRate": {
      const d = detail as DormancyDetail;
      const pct =
        d.totalOwners > 0
          ? Math.round((d.inactiveOwners / d.totalOwners) * 100)
          : 0;
      return `${d.inactiveOwners}/${d.totalOwners} inactive • ${pct}% dormancy`;
    }
    case "marketplaceVelocity": {
      const d = detail as MarketplaceDetail;
      return `${d.pacTurnover}% turnover • ${d.avgHoldTime}d avg hold`;
    }
    default:
      return "";
  }
}

export default function SRIBreakdown({
  components,
  details,
}: SRIBreakdownProps) {
  return (
    <div className="space-y-4">
      {Object.entries(components).map(([key, score], i) => {
        const meta = COMPONENT_META[key];
        if (!meta) return null;

        const trend = getTrend(score, meta);
        const detail = (details as Record<string, unknown>)[key];
        const barColor = getScoreBarColor(score);

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg bg-slate-800 border border-slate-700 ${trend.color}`}
                >
                  {meta.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-200">
                      {meta.label}
                    </h3>
                    <span className="text-xs text-slate-500">
                      ({meta.weight}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                    {meta.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${trend.color}`}>
                  {score}
                </div>
                <div
                  className={`flex items-center justify-end gap-1 text-xs ${trend.color}`}
                >
                  {trend.icon}
                  {trend.label}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>
            </div>

            {/* Detail Metrics */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                {getDetailText(key, detail)}
              </span>
              <span className={`font-medium ${trend.color}`}>
                Impact: {Math.round((score * meta.weight) / 100)} pts
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}