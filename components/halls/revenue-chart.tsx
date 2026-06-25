"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Calendar,
  ChevronDown,
  Download,
  Landmark,
  Building2,
  Hammer,
  Wallet,
  PiggyBank,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ───
export interface MonthlyRevenue {
  month: string; // "Jan 2026"
  monthKey: string; // "2026-01"
  grossRevenue: number;
  ledgerTithe: number;
  payrollDeduction: number;
  netRevenue: number;
  dividendPerPercent: number;
  yourDividend: number;
  yourOwnershipPercent: number;
  sriScore: number;
  ahgiScore: number;
  memberCount: number;
}

export type ChartType = "area" | "bar" | "line";
export type TimeRange = "6m" | "1y" | "all";
export type DataView = "revenue" | "dividends" | "health";

export interface RevenueChartProps {
  data: MonthlyRevenue[];
  isLoading?: boolean;
  onExport?: () => void;
}

// ─── Helpers ───
function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function calculateGrowth(data: MonthlyRevenue[], key: keyof MonthlyRevenue): { value: number; pct: number; trend: "up" | "down" | "flat" } {
  if (data.length < 2) return { value: 0, pct: 0, trend: "flat" };
  const current = data[data.length - 1][key] as number;
  const previous = data[data.length - 2][key] as number;
  if (!previous) return { value: current, pct: 0, trend: "flat" };
  const pct = ((current - previous) / previous) * 100;
  return {
    value: current,
    pct: Math.abs(pct),
    trend: pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat",
  };
}

// ─── Custom Tooltip ───
function CustomTooltip({ active, payload, label, view }: { active?: boolean; payload?: any[]; label?: string; view: DataView }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[240px]">
      <div className="text-xs font-semibold text-slate-300 mb-3 pb-2 border-b border-slate-800">{label}</div>
      <div className="space-y-2">
        {payload.map((entry, i) => {
          const color = entry.color || entry.fill || entry.stroke;
          return (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-400">{entry.name}</span>
              </div>
              <span className="font-mono font-semibold text-slate-200">
                {view === "health" ? entry.value : formatCurrency(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ───
export function RevenueChart({ data, isLoading = false, onExport }: RevenueChartProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [timeRange, setTimeRange] = useState<TimeRange>("6m");
  const [dataView, setDataView] = useState<DataView>("revenue");

  const filteredData = useMemo(() => {
    if (timeRange === "all") return data;
    const months = timeRange === "6m" ? 6 : 12;
    return data.slice(-months);
  }, [data, timeRange]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    return {
      gross: calculateGrowth(filteredData, "grossRevenue"),
      net: calculateGrowth(filteredData, "netRevenue"),
      dividend: calculateGrowth(filteredData, "yourDividend"),
      sri: calculateGrowth(filteredData, "sriScore"),
      ahgi: calculateGrowth(filteredData, "ahgiScore"),
      totalGross: filteredData.reduce((s, d) => s + d.grossRevenue, 0),
      totalNet: filteredData.reduce((s, d) => s + d.netRevenue, 0),
      totalDividends: filteredData.reduce((s, d) => s + d.yourDividend, 0),
      avgMembers: Math.round(filteredData.reduce((s, d) => s + d.memberCount, 0) / filteredData.length),
    };
  }, [filteredData]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data.length) {
    return (
      <Card className="border-slate-800 bg-slate-950/50">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Activity className="w-10 h-10 text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No revenue data yet</h3>
          <p className="text-sm text-slate-500 mt-1">Revenue will appear once the hall begins operating.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Header Controls ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Revenue Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredData.length} month{filteredData.length === 1 ? "" : "s"} of data
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Data View Tabs */}
          <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden">
            {([
              { key: "revenue" as DataView, label: "Revenue", icon: Landmark },
              { key: "dividends" as DataView, label: "Dividends", icon: PiggyBank },
              { key: "health" as DataView, label: "Health", icon: Activity },
            ]).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setDataView(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    dataView === tab.key
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Chart Type */}
          <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden">
            {([
              { key: "area" as ChartType, icon: AreaChartIcon },
              { key: "bar" as ChartType, icon: BarChart3 },
              { key: "line" as ChartType, icon: LineChartIcon },
            ]).map((t) => {
              const TIcon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setChartType(t.key)}
                  className={`px-2.5 py-2 transition-colors ${
                    chartType === t.key ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
                  }`}
                  title={t.key}
                >
                  <TIcon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Time Range */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="appearance-none bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 pr-8 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            >
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <Button variant="outline" size="sm" onClick={onExport} className="text-xs border-slate-700 text-slate-400 hover:text-slate-200">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* ─── Summary Stats ─── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryStat
            label="Total Gross"
            value={formatCompact(stats.totalGross)}
            trend={stats.gross.trend}
            pct={stats.gross.pct}
            icon={Landmark}
            color="cyan"
          />
          <SummaryStat
            label="Total Net"
            value={formatCompact(stats.totalNet)}
            trend={stats.net.trend}
            pct={stats.net.pct}
            icon={Wallet}
            color="emerald"
          />
          <SummaryStat
            label="Your Dividends"
            value={formatCompact(stats.totalDividends)}
            trend={stats.dividend.trend}
            pct={stats.dividend.pct}
            icon={PiggyBank}
            color="amber"
          />
          <SummaryStat
            label="SRI Trend"
            value={stats.sri.value.toFixed(0)}
            trend={stats.sri.trend}
            pct={stats.sri.pct}
            icon={Activity}
            color="violet"
            suffix="/100"
          />
          <SummaryStat
            label="AHGI Trend"
            value={stats.ahgi.value.toFixed(0)}
            trend={stats.ahgi.trend}
            pct={stats.ahgi.pct}
            icon={Activity}
            color="emerald"
            suffix="/100"
          />
        </div>
      )}

      {/* ─── Main Chart ─── */}
      <Card className="border-slate-800 bg-slate-950/50">
        <CardContent className="p-4 sm:p-6">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {dataView === "revenue" ? (
                <RevenueChartInner type={chartType} data={filteredData} />
              ) : dataView === "dividends" ? (
                <DividendChartInner type={chartType} data={filteredData} />
              ) : (
                <HealthChartInner type={chartType} data={filteredData} />
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── Legend / Explanation ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <LegendItem
          icon={Landmark}
          color="bg-cyan-500"
          label="Gross Revenue"
          description="Total revenue generated by the asset before any deductions."
        />
        <LegendItem
          icon={Building2}
          color="bg-amber-500"
          label="8th Ledger Tithe"
          description="20% protocol fee paid to 8th Ledger Holdings for infrastructure, insurance, and operations."
        />
        <LegendItem
          icon={Hammer}
          color="bg-violet-500"
          label="Payroll (Forge)"
          description="Worker salaries and vendor contracts executed by the 8th Ledger."
        />
        <LegendItem
          icon={Wallet}
          color="bg-emerald-500"
          label="Net Revenue"
          description="Revenue remaining after tithe and payroll. Distributed to sovereigns by ownership %."
        />
      </div>
    </div>
  );
}

// ─── Revenue Chart (Area/Bar/Line) ───
function RevenueChartInner({ type, data }: { type: ChartType; data: MonthlyRevenue[] }) {
  const Chart = type === "area" ? AreaChart : type === "bar" ? BarChart : LineChart;

  return (
    <Chart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
      <XAxis
        dataKey="month"
        tick={{ fill: "#64748b", fontSize: 11 }}
        axisLine={{ stroke: "#334155" }}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: "#64748b", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => formatCompact(v)}
      />
      <Tooltip content={<CustomTooltip view="revenue" />} />
      <Legend
        wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
        iconType="circle"
        iconSize={8}
      />

      {type === "area" ? (
        <>
          <Area type="monotone" dataKey="grossRevenue" name="Gross Revenue" stroke="#22d3ee" fill="url(#grossGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="ledgerTithe" name="8th Ledger Tithe" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
          <Area type="monotone" dataKey="payrollDeduction" name="Payroll" stroke="#8b5cf6" fill="transparent" strokeWidth={2} strokeDasharray="2 2" />
          <Area type="monotone" dataKey="netRevenue" name="Net Revenue" stroke="#34d399" fill="url(#netGradient)" strokeWidth={2} />
        </>
      ) : type === "bar" ? (
        <>
          <Bar dataKey="grossRevenue" name="Gross Revenue" fill="#22d3ee" radius={[4, 4, 0, 0]} opacity={0.8} />
          <Bar dataKey="ledgerTithe" name="8th Ledger Tithe" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.7} />
          <Bar dataKey="payrollDeduction" name="Payroll" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} />
          <Bar dataKey="netRevenue" name="Net Revenue" fill="#34d399" radius={[4, 4, 0, 0]} opacity={0.9} />
        </>
      ) : (
        <>
          <Line type="monotone" dataKey="grossRevenue" name="Gross Revenue" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: "#22d3ee" }} />
          <Line type="monotone" dataKey="ledgerTithe" name="8th Ledger Tithe" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: "#f59e0b" }} />
          <Line type="monotone" dataKey="payrollDeduction" name="Payroll" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="2 2" dot={{ r: 3, fill: "#8b5cf6" }} />
          <Line type="monotone" dataKey="netRevenue" name="Net Revenue" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} />
        </>
      )}
    </Chart>
  );
}

// ─── Dividend Chart ───
function DividendChartInner({ type, data }: { type: ChartType; data: MonthlyRevenue[] }) {
  const Chart = type === "area" ? AreaChart : type === "bar" ? BarChart : LineChart;

  return (
    <Chart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="divGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
      <Tooltip content={<CustomTooltip view="dividends" />} />
      <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} iconType="circle" iconSize={8} />

      {type === "area" ? (
        <>
          <Area type="monotone" dataKey="yourDividend" name="Your Dividend" stroke="#f59e0b" fill="url(#divGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="dividendPerPercent" name="Per 1% Ownership" stroke="#22d3ee" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
        </>
      ) : type === "bar" ? (
        <>
          <Bar dataKey="yourDividend" name="Your Dividend" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.85} />
          <Bar dataKey="dividendPerPercent" name="Per 1% Ownership" fill="#22d3ee" radius={[4, 4, 0, 0]} opacity={0.6} />
        </>
      ) : (
        <>
          <Line type="monotone" dataKey="yourDividend" name="Your Dividend" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
          <Line type="monotone" dataKey="dividendPerPercent" name="Per 1% Ownership" stroke="#22d3ee" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: "#22d3ee" }} />
        </>
      )}
    </Chart>
  );
}

// ─── Health Chart (SRI + AHGI) ───
function HealthChartInner({ type, data }: { type: ChartType; data: MonthlyRevenue[] }) {
  const Chart = type === "area" ? AreaChart : type === "bar" ? BarChart : LineChart;

  return (
    <Chart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
      <Tooltip content={<CustomTooltip view="health" />} />
      <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} iconType="circle" iconSize={8} />
      <ReferenceLine y={80} stroke="#34d399" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "Thriving", fill: "#34d399", fontSize: 10, position: "insideTopRight" }} />
      <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "Healthy", fill: "#3b82f6", fontSize: 10, position: "insideTopRight" }} />
      <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "Stagnant", fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }} />
      <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "Declining", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }} />

      {type === "area" ? (
        <>
          <Area type="monotone" dataKey="sriScore" name="SRI Score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
          <Area type="monotone" dataKey="ahgiScore" name="AHGI Score" stroke="#34d399" fill="#34d399" fillOpacity={0.1} strokeWidth={2} />
        </>
      ) : type === "bar" ? (
        <>
          <Bar dataKey="sriScore" name="SRI Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} />
          <Bar dataKey="ahgiScore" name="AHGI Score" fill="#34d399" radius={[4, 4, 0, 0]} opacity={0.7} />
        </>
      ) : (
        <>
          <Line type="monotone" dataKey="sriScore" name="SRI Score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6" }} />
          <Line type="monotone" dataKey="ahgiScore" name="AHGI Score" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} />
        </>
      )}
    </Chart>
  );
}

// ─── Summary Stat ───
function SummaryStat({
  icon: Icon,
  label,
  value,
  trend,
  pct,
  color,
  suffix = "",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
  pct: number;
  color: "cyan" | "emerald" | "amber" | "violet";
  suffix?: string;
}) {
  const colorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-500";

  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold font-mono">{value}</span>
        <span className="text-[10px] opacity-60">{suffix}</span>
      </div>
      <div className={`flex items-center gap-1 text-[10px] mt-1 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        {trend === "up" ? "+" : trend === "down" ? "-" : ""}
        {pct.toFixed(1)}% vs prior
      </div>
    </div>
  );
}

// ─── Legend Item ───
function LegendItem({
  icon: Icon,
  color,
  label,
  description,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
      <div className={`w-8 h-8 rounded-lg ${color} bg-opacity-10 flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color.replace("bg-", "text-")}`} />
      </div>
      <div>
        <div className="text-xs font-medium text-slate-300">{label}</div>
        <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ───
function ChartSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-[360px] bg-slate-800 rounded-xl animate-pulse" />
    </div>
  );
}