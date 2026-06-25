"use client";

import React, { useState } from "react";
import {
  MapPin,
  Home,
  Car,
  Sprout,
  Sun,
  HeartPulse,
  Zap,
  Wifi,
  Briefcase,
  Plane,
  BookOpen,
  Activity,
  Battery,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  ChevronDown,
  ChevronUp,
  Navigation,
  Anchor,
  Fuel,
  Wrench,
  BarChart3,
  Circle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Vertical =
  | "ledgerprop"
  | "ledgerauto"
  | "ledgertech"
  | "ledgeredu"
  | "ledgerhealth"
  | "ledgeraccess"
  | "ledgerbiz"
  | "ledgertravel"
  | "ledgeragri"
  | "ledgerenergy";

interface AssetTrackerProps {
  hallId: string;
  vertical: Vertical;
  assetName: string;
  status: "active" | "maintenance" | "offline" | "deployed";
  // LedgerProp
  occupancyRate?: number;
  tenantCount?: number;
  monthlyRent?: number;
  propertyType?: string;
  sqft?: number;
  // LedgerAuto
  gpsLocation?: { lat: number; lng: number; lastUpdated: string };
  mileage?: number;
  fuelLevel?: number;
  driverStatus?: "available" | "leased" | "in_use" | "maintenance";
  // LedgerAgri
  cropType?: string;
  yieldEstimate?: number;
  acreage?: number;
  soilHealth?: number;
  weatherCondition?: string;
  // LedgerEnergy
  generationKw?: number;
  capacityKw?: number;
  batteryStorage?: number;
  carbonCredits?: number;
  ppaRate?: number;
  // LedgerHealth
  scanCount?: number;
  utilizationRate?: number;
  equipmentStatus?: string;
  // LedgerTravel
  flightHours?: number;
  route?: string;
  dockLocation?: string;
  // Generic
  lastMaintenance?: string;
  nextInspection?: string;
  insuranceExpiry?: string;
  alerts?: { type: "warning" | "critical" | "info"; message: string }[];
}

const verticalConfig: Record<
  Vertical,
  { icon: React.ElementType; color: string; label: string; bg: string }
> = {
  ledgerprop: { icon: Home, color: "text-emerald-400", label: "LedgerProp", bg: "bg-emerald-900/20" },
  ledgerauto: { icon: Car, color: "text-blue-400", label: "LedgerAuto", bg: "bg-blue-900/20" },
  ledgertech: { icon: Zap, color: "text-purple-400", label: "LedgerTech", bg: "bg-purple-900/20" },
  ledgeredu: { icon: BookOpen, color: "text-amber-400", label: "LedgerEdu", bg: "bg-amber-900/20" },
  ledgerhealth: { icon: HeartPulse, color: "text-rose-400", label: "LedgerHealth", bg: "bg-rose-900/20" },
  ledgeraccess: { icon: Wifi, color: "text-cyan-400", label: "LedgerAccess", bg: "bg-cyan-900/20" },
  ledgerbiz: { icon: Briefcase, color: "text-orange-400", label: "LedgerBiz", bg: "bg-orange-900/20" },
  ledgertravel: { icon: Plane, color: "text-indigo-400", label: "LedgerTravel", bg: "bg-indigo-900/20" },
  ledgeragri: { icon: Sprout, color: "text-green-400", label: "LedgerAgri", bg: "bg-green-900/20" },
  ledgerenergy: { icon: Sun, color: "text-yellow-400", label: "LedgerEnergy", bg: "bg-yellow-900/20" },
};

const statusConfig: Record<
  AssetTrackerProps["status"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  active: {
    label: "Active",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: CheckCircle2,
  },
  maintenance: {
    label: "Maintenance",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Wrench,
  },
  offline: {
    label: "Offline",
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/30",
    icon: AlertTriangle,
  },
  deployed: {
    label: "Deployed",
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/30",
    icon: Navigation,
  },
};

function CircularProgress({ value, size = 80, strokeWidth = 8, color = "#10b981" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-lg font-bold text-slate-100 font-mono">{value}%</span>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color, unit = "" }: { label: string; value: number; max: number; color: string; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-300 font-mono">
          {value.toLocaleString()}
          {unit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function AssetTracker({
  hallId,
  vertical,
  assetName,
  status,
  occupancyRate,
  tenantCount,
  monthlyRent,
  propertyType,
  sqft,
  gpsLocation,
  mileage,
  fuelLevel,
  driverStatus,
  cropType,
  yieldEstimate,
  acreage,
  soilHealth,
  weatherCondition,
  generationKw,
  capacityKw,
  batteryStorage,
  carbonCredits,
  ppaRate,
  scanCount,
  utilizationRate,
  equipmentStatus,
  flightHours,
  route,
  dockLocation,
  lastMaintenance,
  nextInspection,
  insuranceExpiry,
  alerts = [],
}: AssetTrackerProps) {
  const [showMap, setShowMap] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const vConfig = verticalConfig[vertical];
  const sConfig = statusConfig[status];
  const VerticalIcon = vConfig.icon;
  const StatusIcon = sConfig.icon;

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", vConfig.bg, "border-slate-700/30")}>
            <VerticalIcon size={18} className={vConfig.color} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Asset Tracker</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{assetName}</p>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", sConfig.bg, sConfig.border, sConfig.color)}>
          <StatusIcon size={10} />
          {sConfig.label}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border text-xs",
                  alert.type === "critical"
                    ? "bg-red-950/20 border-red-800/20 text-red-300"
                    : alert.type === "warning"
                    ? "bg-amber-950/20 border-amber-800/20 text-amber-300"
                    : "bg-blue-950/20 border-blue-800/20 text-blue-300"
                )}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Vertical-Specific Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* LedgerProp: Occupancy Ring */}
          {vertical === "ledgerprop" && occupancyRate !== undefined && (
            <>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Occupancy Rate</div>
                <CircularProgress value={Math.round(occupancyRate)} color="#10b981" />
                <div className="mt-2 text-xs text-slate-400">
                  {tenantCount} tenants • {propertyType}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <MiniBar label="Rent Collection" value={monthlyRent || 0} max={(monthlyRent || 0) * 1.2} color="#10b981" unit="$" />
                <MiniBar label="Property Size" value={sqft || 0} max={(sqft || 1) * 1.5} color="#3b82f6" unit=" sqft" />
                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Monthly Rent</span>
                  <span className="text-slate-200 font-mono">${monthlyRent?.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          {/* LedgerAuto: GPS + Vehicle Stats */}
          {vertical === "ledgerauto" && (
            <>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">GPS Location</span>
                  <button onClick={() => setShowMap(!showMap)} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <MapPin size={10} />
                    {showMap ? "Hide" : "Show"}
                  </button>
                </div>
                {gpsLocation && (
                  <div className="text-xs font-mono text-slate-300 space-y-1">
                    <div>Lat: {gpsLocation.lat.toFixed(6)}</div>
                    <div>Lng: {gpsLocation.lng.toFixed(6)}</div>
                    <div className="text-[10px] text-slate-600">Updated {new Date(gpsLocation.lastUpdated).toLocaleTimeString()}</div>
                  </div>
                )}
                {showMap && gpsLocation && (
                  <div className="aspect-video rounded-lg bg-slate-900/50 border border-slate-700/30 flex items-center justify-center">
                    <div className="text-center text-slate-600">
                      <Navigation size={24} className="mx-auto mb-1 text-blue-500/50" />
                      <span className="text-[10px]">Map view integration</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <MiniBar label="Mileage" value={mileage || 0} max={(mileage || 1) * 1.5} color="#3b82f6" unit=" mi" />
                <MiniBar label="Fuel Level" value={fuelLevel || 0} max={100} color="#f59e0b" unit="%" />
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Driver Status</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border",
                      driverStatus === "available"
                        ? "bg-emerald-900/20 text-emerald-400 border-emerald-700/30"
                        : driverStatus === "leased"
                        ? "bg-blue-900/20 text-blue-400 border-blue-700/30"
                        : driverStatus === "in_use"
                        ? "bg-amber-900/20 text-amber-400 border-amber-700/30"
                        : "bg-red-900/20 text-red-400 border-red-700/30"
                    )}
                  >
                    {driverStatus?.toUpperCase()}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* LedgerAgri: Production Chart */}
          {vertical === "ledgeragri" && (
            <>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Crop Type</span>
                  <span className="text-sm font-bold text-emerald-400">{cropType}</span>
                </div>
                <MiniBar label="Yield Estimate" value={yieldEstimate || 0} max={(yieldEstimate || 1) * 1.5} color="#10b981" unit=" tons" />
                <MiniBar label="Acreage" value={acreage || 0} max={(acreage || 1) * 1.5} color="#8b5cf6" unit=" acres" />
                <MiniBar label="Soil Health" value={soilHealth || 0} max={100} color="#f59e0b" unit="%" />
              </div>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Weather</span>
                  <span className="text-xs text-slate-200 flex items-center gap-1">
                    <Droplets size={12} className="text-blue-400" />
                    {weatherCondition}
                  </span>
                </div>
                <div className="aspect-video rounded-lg bg-slate-900/50 border border-slate-700/30 flex items-center justify-center">
                  <div className="text-center text-slate-600">
                    <BarChart3 size={24} className="mx-auto mb-1 text-emerald-500/50" />
                    <span className="text-[10px]">Production chart integration</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* LedgerEnergy: Generation Meter */}
          {vertical === "ledgerenergy" && (
            <>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Generation</div>
                <div className="text-3xl font-bold text-yellow-400 font-mono">
                  {generationKw?.toLocaleString()}
                  <span className="text-sm text-yellow-500/60 ml-1">kW</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  of {capacityKw?.toLocaleString()} kW capacity
                </div>
                <div className="mt-3 w-full">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500/60 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(((generationKw || 0) / (capacityKw || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <MiniBar label="Battery Storage" value={batteryStorage || 0} max={(batteryStorage || 1) * 2} color="#3b82f6" unit=" MWh" />
                <MiniBar label="Carbon Credits" value={carbonCredits || 0} max={(carbonCredits || 1) * 2} color="#10b981" unit=" tCO2" />
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">PPA Rate</span>
                  <span className="text-yellow-400 font-mono">${ppaRate}/kWh</span>
                </div>
              </div>
            </>
          )}

          {/* LedgerHealth: Utilization */}
          {vertical === "ledgerhealth" && (
            <>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Utilization</div>
                <CircularProgress value={Math.round(utilizationRate || 0)} color="#f43f5e" />
                <div className="mt-2 text-xs text-slate-400">{scanCount} scans this month</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Equipment</span>
                  <span className="text-xs text-slate-200 font-medium">{equipmentStatus}</span>
                </div>
                <MiniBar label="Scans / Day" value={scanCount || 0} max={(scanCount || 1) * 2} color="#f43f5e" unit="" />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HeartPulse size={12} className="text-rose-400" />
                  <span>Operational status: {status}</span>
                </div>
              </div>
            </>
          )}

          {/* LedgerTravel: Flight / Marine */}
          {vertical === "ledgertravel" && (
            <>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Flight Hours</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">{flightHours}h</span>
                </div>
                <MiniBar label="Hours Utilization" value={flightHours || 0} max={(flightHours || 1) * 2} color="#6366f1" unit="h" />
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Route</span>
                  <span className="text-slate-200">{route || "—"}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Dock / Hangar</span>
                  <span className="text-xs text-slate-200 flex items-center gap-1">
                    <Anchor size={12} className="text-indigo-400" />
                    {dockLocation || "—"}
                  </span>
                </div>
                <div className="aspect-video rounded-lg bg-slate-900/50 border border-slate-700/30 flex items-center justify-center">
                  <div className="text-center text-slate-600">
                    <Plane size={24} className="mx-auto mb-1 text-indigo-500/50" />
                    <span className="text-[10px]">Flight tracker integration</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Generic fallback for other verticals */}
          {vertical !== "ledgerprop" && vertical !== "ledgerauto" && vertical !== "ledgeragri" && vertical !== "ledgerenergy" && vertical !== "ledgerhealth" && vertical !== "ledgertravel" && (
            <>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <Activity size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Real-time metrics for {vConfig.label}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <MiniBar label="Asset Health" value={status === "active" ? 95 : status === "maintenance" ? 60 : 30} max={100} color="#10b981" unit="%" />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Zap size={12} className={vConfig.color} />
                  <span>Vertical: {vConfig.label}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Maintenance & Compliance */}
        <div className="space-y-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>Maintenance & Compliance</span>
          </button>

          {showDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center">
                  <Wrench size={14} className="text-slate-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Last Maintenance</div>
                  <div className="text-xs text-slate-200 font-mono">
                    {lastMaintenance ? new Date(lastMaintenance).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center">
                  <Clock size={14} className="text-slate-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Next Inspection</div>
                  <div className="text-xs text-slate-200 font-mono">
                    {nextInspection ? new Date(nextInspection).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center">
                  <ShieldAlert size={14} className="text-slate-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Insurance</div>
                  <div className="text-xs text-slate-200 font-mono">
                    {insuranceExpiry ? new Date(insuranceExpiry).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hall ID Footer */}
        <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-600">
          <span className="font-mono">Hall #{hallId.slice(-6)}</span>
          <span className="flex items-center gap-1">
            <Eye size={10} />
            Live telemetry
          </span>
        </div>
      </div>
    </div>
  );
}