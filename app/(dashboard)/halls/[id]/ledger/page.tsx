"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Wrench,
  Receipt,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Building2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type LedgerUpdate = {
  id: string;
  type: string;
  title: string;
  content: string;
  amount?: number;
  createdAt: string;
};

type LedgerData = {
  hallId: string;
  hallName: string;
  hallClass?: string;
  sriScore: number;
  ahgiScore: number;
  status: string;
  updates: LedgerUpdate[];
  totalUpdates: number;
  isOwner: boolean;
  ownershipPercent?: number;
};

const typeConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bg: string; border: string }
> = {
  INSURANCE_RENEWAL: {
    icon: Shield,
    label: "Insurance Renewal",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  EMERGENCY_REPAIR: {
    icon: Wrench,
    label: "Emergency Repair",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  PROPERTY_TAX: {
    icon: Receipt,
    label: "Property Tax",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  PAYROLL_EXECUTED: {
    icon: Users,
    label: "Payroll Executed",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  DYNAMIC_VALUATION: {
    icon: TrendingUp,
    label: "Dynamic Valuation",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  PIR_ADVANCE: {
    icon: AlertTriangle,
    label: "PIR Advance",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  DEFAULT: {
    icon: FileText,
    label: "Update",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
};

export default function LedgerPage() {
  const params = useParams();
  const hallId = params.id as string;
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const { data, error, isLoading } = useSWR<LedgerData>(
    hallId ? `/api/halls/${hallId}/ledger` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const filteredUpdates = useMemo(() => {
    if (!data?.updates) return [];
    if (filterType === "ALL") return data.updates;
    return data.updates.filter((u) => u.type === filterType);
  }, [data?.updates, filterType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: data?.updates?.length ?? 0 };
    data?.updates?.forEach((u) => {
      counts[u.type] = (counts[u.type] ?? 0) + 1;
    });
    return counts;
  }, [data?.updates]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">Loading the 8th Ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <h3 className="text-lg font-semibold text-slate-200">Failed to load ledger</h3>
          <p className="max-w-sm text-sm text-slate-400">
            The 8th Ledger could not retrieve updates for this hall. Try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { hallName, hallClass, sriScore, ahgiScore, status, isOwner, ownershipPercent } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          <Building2 className="h-4 w-4" />
          <span>8th Ledger Ledger</span>
          {hallClass && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
              Class {hallClass}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">{hallName}</h1>
        <p className="text-sm text-slate-400">
          Official records, maintenance logs, insurance renewals, payroll, and dynamic valuations.
          {isOwner && ownershipPercent !== undefined && (
            <span className="ml-1 text-cyan-400">Your stake: {ownershipPercent}%</span>
          )}
        </p>
      </div>

      {/* Health Bar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <HealthCard label="SRI Score" value={sriScore} max={100} color="cyan" />
        <HealthCard label="AHGI Score" value={ahgiScore} max={100} color="emerald" />
        <HealthCard label="Status" value={status === "live" ? "LIVE" : status.toUpperCase()} text />
        <HealthCard label="Records" value={data.totalUpdates} text />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filter Updates</span>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {Object.entries(typeCounts).map(([type, count]) => {
                  const cfg = typeConfig[type] ?? typeConfig.DEFAULT;
                  const isActive = filterType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? `${cfg.bg} ${cfg.border} ${cfg.color} border-current`
                          : "border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <cfg.icon className="h-3.5 w-3.5" />
                      <span>{type === "ALL" ? "All Updates" : cfg.label}</span>
                      <span className="rounded-full bg-slate-900/50 px-1.5 py-0.5 text-[10px]">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Updates Feed */}
      <div className="space-y-3">
        {filteredUpdates.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">No updates recorded yet.</p>
            <p className="text-xs text-slate-600">
              The 8th Ledger will post insurance, maintenance, and payroll records here.
            </p>
          </div>
        ) : (
          filteredUpdates.map((update, index) => {
            const cfg = typeConfig[update.type] ?? typeConfig.DEFAULT;
            const isExpanded = expandedId === update.id;
            const date = new Date(update.createdAt);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`group rounded-xl border bg-slate-900/60 backdrop-blur-sm transition-all hover:bg-slate-900/80 ${
                  isExpanded ? "border-slate-600" : "border-slate-800"
                }`}
              >
                <button
                  onClick={() => toggleExpand(update.id)}
                  className="flex w-full items-start gap-4 p-4 text-left md:p-5"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.border} border`}
                  >
                    <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.border} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formattedDate} · {formattedTime}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">{update.title}</h3>
                    <p className="line-clamp-2 text-sm text-slate-400">{update.content}</p>
                  </div>

                  <div className="shrink-0 pt-1">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-800 px-4 pb-4 pt-2 md:px-5 md:pb-5">
                        <div className="ml-14 space-y-3">
                          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                            {update.content}
                          </p>

                          {update.amount !== undefined && update.amount > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                              <span className="text-xs text-slate-500">Amount:</span>
                              <span className="text-sm font-mono font-semibold text-slate-200">
                                ${update.amount.toLocaleString()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-600">
                              Record ID
                            </span>
                            <code className="rounded bg-slate-950 px-2 py-1 text-[10px] font-mono text-slate-500">
                              {update.id}
                            </code>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HealthCard({
  label,
  value,
  max,
  color,
  text,
}: {
  label: string;
  value: string | number;
  max?: number;
  color?: "cyan" | "emerald" | "amber" | "rose" | "violet";
  text?: boolean;
}) {
  const colorMap = {
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
    rose: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20",
  };

  const style = color ? colorMap[color] : colorMap.cyan;

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${style}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      {text ? (
        <p className="mt-1 text-lg font-bold">{value}</p>
      ) : (
        <div className="mt-2">
          <p className="text-2xl font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
            {max !== undefined && <span className="text-sm opacity-50">/{max}</span>}
          </p>
          {max !== undefined && typeof value === "number" && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-current opacity-80"
                style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}