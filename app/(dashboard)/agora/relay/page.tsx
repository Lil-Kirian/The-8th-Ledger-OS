"use client";

import { motion } from "framer-motion";
import {
  Radio,
  ArrowLeft,
  Filter,
  Shield,
  Crown,
  Wrench,
  Users,
  Gavel,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

// ── Types ───────────────────────────────────────────────────

interface RelayEvent {
  id: string;
  timestamp: string;
  hall: {
    id: string;
    name: string;
    status: string;
    class: string | null;
    sri: {
      score: number;
      tier: string;
    };
  };
  event: {
    type: string;
    description: string;
  };
}

// ── Fetcher ─────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Event Type Icons ────────────────────────────────────────

const EVENT_ICONS: Record<string, React.ElementType> = {
  vote: Gavel,
  proposal: TrendingUp,
  execution: CheckIcon,
  hire: Users,
  fire: AlertTriangle,
  maintenance: Wrench,
  inventory: Package,
  closure: AlertTriangle,
  impeach: Gavel,
  pir_advance: Shield,
  location_select: MapPin,
};

function CheckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ── SRI Badge ───────────────────────────────────────────────

function SriBadge({ tier, score }: { tier: string; score: number }) {
  const colors: Record<string, string> = {
    platinum: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    gold: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    silver: "text-slate-300 bg-slate-500/10 border-slate-500/20",
    bronze: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    at_risk: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors[tier] || colors.at_risk}`}>
      {tier === "platinum" && <Crown className="h-3 w-3" />}
      {tier} · {score}
    </span>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function RelayPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [hallFilter, setHallFilter] = useState("");

  const queryParams = new URLSearchParams();
  queryParams.set("limit", "50");
  if (typeFilter) queryParams.set("type", typeFilter);

  const { data, error, isLoading } = useSWR(
    `/api/agora/relay?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const eventTypes = [
    { value: "", label: "All Events", icon: Radio },
    { value: "vote", label: "Votes", icon: Gavel },
    { value: "proposal", label: "Proposals", icon: TrendingUp },
    { value: "execution", label: "Executions", icon: CheckIcon },
    { value: "hire", label: "Hires", icon: Users },
    { value: "maintenance", label: "Maintenance", icon: Wrench },
    { value: "inventory", label: "Inventory", icon: Package },
    { value: "closure", label: "Closures", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/agora" className="text-white/30 hover:text-white/60">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/60">The Agora</span>
          </div>
          <h1 className="text-3xl font-bold text-white">The Relay</h1>
          <p className="mt-1 text-white/40">
            Hall transparency. Read-only. Zero internals. Proof of governance.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {eventTypes.map((et) => (
            <button
              key={et.value}
              onClick={() => setTypeFilter(et.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                typeFilter === et.value
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
              }`}
            >
              <et.icon className="h-3 w-3" />
              {et.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <p className="mt-4 text-white/40">Failed to load relay feed</p>
          </div>
        ) : data?.feed?.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="mx-auto h-12 w-12 text-white/10" />
            <p className="mt-4 text-white/30">No governance activity to relay yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.feed?.map((event: RelayEvent, i: number) => {
              const Icon = EVENT_ICONS[event.event.type] || Radio;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/70">{event.event.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-white/20">{event.hall.id}</span>
                      <span className="text-xs text-white/20">·</span>
                      <span className="text-xs text-white/30">{event.hall.name}</span>
                      {event.hall.class && (
                        <>
                          <span className="text-xs text-white/20">·</span>
                          <span className="text-xs text-white/30">Class {event.hall.class}</span>
                        </>
                      )}
                      <span className="text-xs text-white/20">·</span>
                      <SriBadge tier={event.hall.sri.tier} score={event.hall.sri.score} />
                      <span className="text-xs text-white/20">·</span>
                      <span className="flex items-center gap-1 text-xs text-white/20">
                        <Clock className="h-3 w-3" />
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}