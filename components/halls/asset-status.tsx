"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Zap,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Building2,
  Car,
  Cpu,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Plane,
  Wheat,
  Wifi,
  Users,
  Wrench,
  Ban,
  Globe,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Battery,
  Signal,
  Truck,
  Package,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ─── Types ───
export type VerticalKey =
  | "ledgerprop"
  | "ledgerauto"
  | "ledgertech"
  | "ledgeredu"
  | "ledgerhealth"
  | "ledgerbiz"
  | "ledgertravel"
  | "ledgeragri"
  | "ledgerenergy"
  | "ledgeraccess";

export type AlertSeverity = "info" | "warning" | "critical" | "resolved";

export interface AssetAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  verticalMetric: string;
  timestamp: string;
  resolvedAt?: string;
  actionRequired?: string;
}

export interface AssetMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  direction: "up" | "down" | "neutral";
  status: "good" | "warning" | "critical";
  icon: React.ElementType;
}

export interface AssetStatusData {
  hallId: string;
  hallName: string;
  vertical: VerticalKey;
  location: string;
  coordinates?: { lat: number; lng: number };
  hallClass: "I" | "II" | "III";
  sriScore: number;
  ahgiScore: number;
  ahgiHealthScore: number;
  ahgiGrowthScore: number;
  status: "operational" | "maintenance" | "disrupted" | "offline";
  lastUpdated: string;
  metrics: AssetMetric[];
  alerts: AssetAlert[];
  recentEvents: { action: string; timestamp: string; actor: string }[];
}

export interface AssetStatusProps {
  data: AssetStatusData;
  isLoading?: boolean;
  onRefresh?: () => void;
  onViewMap?: () => void;
  onReportIssue?: () => void;
}

// ─── Vertical Config ───
const VERTICAL_CONFIG: Record<VerticalKey, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ledgerprop:   { label: "LedgerProp",   icon: Building2,      color: "text-emerald-400",  bg: "bg-emerald-500/10" },
  ledgerauto:   { label: "LedgerAuto",   icon: Car,            color: "text-blue-400",     bg: "bg-blue-500/10" },
  ledgertech:   { label: "LedgerTech",   icon: Cpu,            color: "text-violet-400",   bg: "bg-violet-500/10" },
  ledgeredu:    { label: "LedgerEdu",    icon: GraduationCap,  color: "text-amber-400",    bg: "bg-amber-500/10" },
  ledgerhealth: { label: "LedgerHealth", icon: HeartPulse,      color: "text-rose-400",     bg: "bg-rose-500/10" },
  ledgerbiz:    { label: "LedgerBiz",    icon: Briefcase,      color: "text-orange-400",   bg: "bg-orange-500/10" },
  ledgertravel: { label: "LedgerTravel", icon: Plane,          color: "text-sky-400",      bg: "bg-sky-500/10" },
  ledgeragri:   { label: "LedgerAgri",   icon: Wheat,          color: "text-lime-400",     bg: "bg-lime-500/10" },
  ledgerenergy: { label: "LedgerEnergy", icon: Sun,            color: "text-yellow-400",   bg: "bg-yellow-500/10" },
  ledgeraccess: { label: "LedgerAccess", icon: Wifi,           color: "text-cyan-400",     bg: "bg-cyan-500/10" },
};

const STATUS_CONFIG = {
  operational: { label: "Operational", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
  maintenance: { label: "Maintenance", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: Wrench },
  disrupted:   { label: "Disrupted",   color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  icon: AlertTriangle },
  offline:     { label: "Offline",     color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     icon: Ban },
};

const AHGI_STATUS = {
  thriving:  { label: "Thriving",  color: "text-emerald-400", min: 80 },
  healthy:   { label: "Healthy",   color: "text-blue-400",    min: 60 },
  stagnant:  { label: "Stagnant",  color: "text-amber-400",   min: 40 },
  declining: { label: "Declining", color: "text-orange-400",  min: 20 },
  critical:  { label: "Critical",  color: "text-red-400",     min: 0 },
};

// ─── Helpers ───
function getAhgiStatus(score: number) {
  if (score >= 80) return AHGI_STATUS.thriving;
  if (score >= 60) return AHGI_STATUS.healthy;
  if (score >= 40) return AHGI_STATUS.stagnant;
  if (score >= 20) return AHGI_STATUS.declining;
  return AHGI_STATUS.critical;
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Component ───
export function AssetStatus({ data, isLoading = false, onRefresh, onViewMap, onReportIssue }: AssetStatusProps) {
  const [showAlerts, setShowAlerts] = useState(true);
  const [showEvents, setShowEvents] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const v = VERTICAL_CONFIG[data.vertical];
  const VIcon = v.icon;
  const status = STATUS_CONFIG[data.status];
  const StatusIcon = status.icon;
  const ahgi = getAhgiStatus(data.ahgiScore);

  const activeAlerts = useMemo(() => data.alerts.filter((a) => !a.resolvedAt), [data.alerts]);
  const resolvedAlerts = useMemo(() => data.alerts.filter((a) => a.resolvedAt), [data.alerts]);

  if (isLoading) {
    return <AssetStatusSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${v.bg} flex items-center justify-center shrink-0`}>
            <VIcon className={`w-7 h-7 ${v.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-slate-100">{data.hallName}</h2>
              <Badge className={`text-[10px] ${v.bg} ${v.color} border-0`}>{v.label}</Badge>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                Class {data.hallClass}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {data.location}
              </span>
              {data.coordinates && (
                <span className="font-mono text-xs">
                  {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Updated {formatTimeAgo(data.lastUpdated)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${status.bg} ${status.color} ${status.border} border`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
            {status.label}
          </Badge>
          <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs border-slate-700 text-slate-400 hover:text-slate-200">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          {data.coordinates && (
            <Button variant="outline" size="sm" onClick={onViewMap} className="text-xs border-slate-700 text-slate-400 hover:text-slate-200">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Map
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onReportIssue} className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            Report
          </Button>
        </div>
      </div>

      {/* ─── Score Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* SRI */}
        <ScoreCard
          label="SRI Score"
          score={data.sriScore}
          max={100}
          color={data.sriScore >= 90 ? "platinum" : data.sriScore >= 75 ? "gold" : data.sriScore >= 60 ? "silver" : data.sriScore >= 40 ? "bronze" : "at_risk"}
          icon={Shield}
        />
        {/* AHGI */}
        <ScoreCard
          label="AHGI Score"
          score={data.ahgiScore}
          max={100}
          color={data.ahgiScore >= 80 ? "emerald" : data.ahgiScore >= 60 ? "blue" : data.ahgiScore >= 40 ? "amber" : data.ahgiScore >= 20 ? "orange" : "red"}
          icon={Activity}
          subLabel={ahgi.label}
        />
        {/* Health */}
        <ScoreCard
          label="Health Component"
          score={data.ahgiHealthScore}
          max={100}
          color={data.ahgiHealthScore >= 80 ? "emerald" : data.ahgiHealthScore >= 60 ? "blue" : data.ahgiHealthScore >= 40 ? "amber" : "red"}
          icon={HeartPulse}
          subLabel={`${(data.ahgiHealthScore * 0.4).toFixed(0)}% of AHGI`}
        />
        {/* Growth */}
        <ScoreCard
          label="Growth Component"
          score={data.ahgiGrowthScore}
          max={100}
          color={data.ahgiGrowthScore >= 80 ? "emerald" : data.ahgiGrowthScore >= 60 ? "blue" : data.ahgiGrowthScore >= 40 ? "amber" : "red"}
          icon={TrendingUp}
          subLabel={`${(data.ahgiGrowthScore * 0.6).toFixed(0)}% of AHGI`}
        />
      </div>

      {/* ─── Metrics Grid ─── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          Real-Time Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.metrics.map((metric) => {
            const MetricIcon = metric.icon;
            const isSelected = selectedMetric === metric.key;
            const pct = metric.target > 0 ? Math.min((metric.value / metric.target) * 100, 100) : 0;

            return (
              <motion.div
                key={metric.key}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedMetric(isSelected ? null : metric.key)}
                className={`rounded-xl border p-4 cursor-pointer transition-colors ${
                  metric.status === "good"
                    ? "border-emerald-500/20 bg-emerald-950/5"
                    : metric.status === "warning"
                    ? "border-amber-500/20 bg-amber-950/5"
                    : "border-red-500/20 bg-red-950/5"
                } ${isSelected ? "ring-1 ring-cyan-500/30" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MetricIcon
                      className={`w-4 h-4 ${
                        metric.status === "good"
                          ? "text-emerald-400"
                          : metric.status === "warning"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-300">{metric.label}</span>
                  </div>
                  <Badge
                    className={`text-[9px] border-0 ${
                      metric.status === "good"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : metric.status === "warning"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {metric.status}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-100">
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">{metric.unit}</span>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">Target: {metric.target.toLocaleString()} {metric.unit}</span>
                    <span
                      className={`font-mono ${
                        metric.direction === "up"
                          ? "text-emerald-400"
                          : metric.direction === "down"
                          ? "text-red-400"
                          : "text-slate-500"
                      }`}
                    >
                      {metric.direction === "up" ? "↑" : metric.direction === "down" ? "↓" : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        metric.status === "good"
                          ? "bg-emerald-400"
                          : metric.status === "warning"
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-slate-800/50 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Current vs Target</span>
                          <span className="font-mono">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Trend</span>
                          <span
                            className={
                              metric.direction === "up"
                                ? "text-emerald-400"
                                : metric.direction === "down"
                                ? "text-red-400"
                                : "text-slate-500"
                            }
                          >
                            {metric.direction === "up" ? "Improving" : metric.direction === "down" ? "Declining" : "Stable"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Alerts ─── */}
      {data.alerts.length > 0 && (
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Asset Alerts
                  {activeAlerts.length > 0 && (
                    <Badge className="ml-2 text-[10px] bg-red-500/10 text-red-400 border-0">
                      {activeAlerts.length} active
                    </Badge>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showAlerts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {showAlerts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {data.alerts.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* ─── Recent Events ─── */}
      {data.recentEvents.length > 0 && (
        <Card className="border-slate-800 bg-slate-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Recent Events</h3>
              </div>
              <button
                onClick={() => setShowEvents(!showEvents)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showEvents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {showEvents && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3">
                    {data.recentEvents.map((event, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-slate-300">{event.action}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span>by {event.actor}</span>
                            <span>·</span>
                            <span>{formatTimeAgo(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Score Card ───
function ScoreCard({
  label,
  score,
  max,
  color,
  icon: Icon,
  subLabel,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
  icon: React.ElementType;
  subLabel?: string;
}) {
  const colorMap: Record<string, string> = {
    platinum: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    gold: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    silver: "text-slate-300 bg-slate-500/10 border-slate-500/20",
    bronze: "text-amber-600 bg-amber-500/10 border-amber-600/20",
    at_risk: "text-red-400 bg-red-500/10 border-red-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  const cfg = colorMap[color] || colorMap.slate;

  return (
    <div className={`rounded-xl border p-4 ${cfg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
        </div>
        {subLabel && (
          <Badge className="text-[9px] border-0 bg-slate-800 text-slate-400">{subLabel}</Badge>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono">{score}</span>
        <span className="text-xs text-slate-500">/ {max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800/50 mt-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(score / max) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            color === "platinum" || color === "purple"
              ? "bg-purple-400"
              : color === "gold" || color === "yellow"
              ? "bg-yellow-400"
              : color === "emerald"
              ? "bg-emerald-400"
              : color === "blue"
              ? "bg-blue-400"
              : color === "amber"
              ? "bg-amber-400"
              : color === "orange"
              ? "bg-orange-400"
              : color === "red" || color === "at_risk"
              ? "bg-red-400"
              : "bg-slate-400"
          }`}
        />
      </div>
    </div>
  );
}

// ─── Alert Item ───
function AlertItem({ alert }: { alert: AssetAlert }) {
  const severityConfig = {
    info: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Shield },
    warning: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle },
    critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: Ban },
    resolved: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
  };

  const cfg = severityConfig[alert.severity];
  const AIcon = cfg.icon;
  const isResolved = alert.severity === "resolved" || !!alert.resolvedAt;

  return (
    <div className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border} ${isResolved ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <AIcon className={`w-4 h-4 ${cfg.color} shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold ${cfg.color}`}>{alert.title}</span>
            <Badge className={`text-[9px] border-0 ${cfg.bg} ${cfg.color}`}>{alert.severity}</Badge>
            {isResolved && (
              <Badge className="text-[9px] border-0 bg-emerald-500/10 text-emerald-400">Resolved</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{alert.description}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
            <span>{alert.verticalMetric}</span>
            <span>·</span>
            <span>{formatTimeAgo(alert.timestamp)}</span>
            {alert.resolvedAt && (
              <>
                <span>·</span>
                <span>Resolved {formatTimeAgo(alert.resolvedAt)}</span>
              </>
            )}
          </div>
          {alert.actionRequired && !isResolved && (
            <div className="mt-2 text-[10px] text-amber-400 bg-amber-500/5 rounded px-2 py-1 inline-block">
              Action required: {alert.actionRequired}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ───
function AssetStatusSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-72 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}