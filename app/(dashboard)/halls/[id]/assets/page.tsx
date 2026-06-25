"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Landmark, Zap, Crown, Lock, HeartPulse, TrendingUp, Hexagon, Plane,
  Sprout, Sun, ChevronLeft, Activity, MapPin, WifiOff,
  Gauge, Thermometer, Droplets, BatteryCharging,
  Users, CheckCircle2, AlertTriangle,
  XCircle, ArrowUpRight, ArrowDownRight,
  Shield, Wrench, Calendar, Eye, Layers, Radio,
  Signal, Crosshair, Car,
  GraduationCap, Award, Stethoscope,
  BedDouble, Microscope,
  Briefcase, Presentation,
  ThermometerSun, Waves, Plug, TreePine,
  RefreshCw, Download, Satellite, Scan, Radar,
  Info
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type VerticalId = "ledgerprop" | "ledgerauto" | "ledgeredu" | "ledgeraccess" | "ledgerhealth" | "ledgerbiz" | "ledgertech" | "ledgertravel" | "ledgeragri" | "ledgerenergy";

interface AssetMetric {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  status: "optimal" | "good" | "warning" | "critical" | "offline";
  icon: React.ElementType;
  sparkline?: number[];
}

interface AssetUnit {
  id: string;
  name: string;
  status: "active" | "maintenance" | "offline" | "vacant" | "occupied";
  occupant?: string;
  lastUpdated: string;
  coordinates?: { lat: number; lng: number };
  health?: number;
}

/* ============================================================
   VERTICAL CONFIG
   ============================================================ */
const VERTICAL_CONFIG: Record<VerticalId, {
  name: string; color: string; bg: string; border: string;
  gradient: string; icon: React.ElementType;
}> = {
  ledgerprop: { name: "LedgerProp", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/5 to-orange-500/5", icon: Landmark },
  ledgerauto: { name: "LedgerAuto", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", gradient: "from-cyan-500/5 to-blue-500/5", icon: Zap },
  ledgeredu: { name: "LedgerEdu", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", gradient: "from-violet-500/5 to-purple-500/5", icon: Crown },
  ledgeraccess: { name: "LedgerAccess", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/5 to-teal-500/5", icon: Lock },
  ledgerhealth: { name: "LedgerHealth", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500/5 to-pink-500/5", icon: HeartPulse },
  ledgerbiz: { name: "LedgerBiz", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500/5 to-red-500/5", icon: TrendingUp },
  ledgertech: { name: "LedgerTech", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500/5 to-blue-500/5", icon: Hexagon },
  ledgertravel: { name: "LedgerTravel", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/5 to-cyan-500/5", icon: Plane },
  ledgeragri: { name: "LedgerAgri", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", gradient: "from-green-500/5 to-emerald-500/5", icon: Sprout },
  ledgerenergy: { name: "LedgerEnergy", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", gradient: "from-yellow-500/5 to-amber-500/5", icon: Sun },
};

/* ============================================================
   STATUS CONFIG
   ============================================================ */
const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  optimal: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Optimal", icon: CheckCircle2 },
  good: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "Good", icon: CheckCircle2 },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Warning", icon: AlertTriangle },
  critical: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Critical", icon: XCircle },
  offline: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "Offline", icon: WifiOff },
  active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Active", icon: CheckCircle2 },
  maintenance: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Maintenance", icon: Wrench },
  vacant: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", label: "Vacant", icon: Eye },
  occupied: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", label: "Occupied", icon: Users },
};

/* ============================================================
   MOCK DATA PER VERTICAL
   ============================================================ */
const VERTICAL_DATA: Record<VerticalId, {
  metrics: AssetMetric[];
  units: AssetUnit[];
  mapType: "building" | "fleet" | "campus" | "venue" | "hospital" | "office" | "datacenter" | "airspace" | "farm" | "solar";
  alerts: { id: string; level: "info" | "warning" | "critical"; message: string; time: string }[];
}> = {
  ledgerprop: {
    mapType: "building",
    metrics: [
      { label: "Occupancy", value: 94, unit: "%", change: 2, status: "optimal", icon: Users, sparkline: [88, 90, 89, 92, 93, 94, 94] },
      { label: "Rent Yield", value: 8.5, unit: "%", change: 0.3, status: "optimal", icon: TrendingUp, sparkline: [7.8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5] },
      { label: "Maintenance", value: "Good", status: "good", icon: Wrench, sparkline: [95, 94, 96, 95, 97, 96, 95] },
      { label: "Unit Health", value: 96, unit: "%", change: -1, status: "good", icon: Shield, sparkline: [98, 97, 97, 96, 96, 95, 96] },
    ],
    units: [
      { id: "B-01", name: "Unit B-01", status: "occupied", occupant: "Sovereign Alpha", lastUpdated: "2m ago", health: 98 },
      { id: "B-02", name: "Unit B-02", status: "occupied", occupant: "Archon Epsilon", lastUpdated: "5m ago", health: 96 },
      { id: "B-03", name: "Unit B-03", status: "vacant", lastUpdated: "1h ago", health: 100 },
      { id: "B-04", name: "Unit B-04", status: "maintenance", lastUpdated: "30m ago", health: 72 },
      { id: "B-05", name: "Unit B-05", status: "occupied", occupant: "Vanguard Zeta", lastUpdated: "12m ago", health: 94 },
      { id: "B-06", name: "Unit B-06", status: "occupied", occupant: "Operant Beta", lastUpdated: "8m ago", health: 91 },
      { id: "B-07", name: "Unit B-07", status: "vacant", lastUpdated: "2d ago", health: 100 },
      { id: "B-08", name: "Unit B-08", status: "occupied", occupant: "Initiate Delta", lastUpdated: "1m ago", health: 89 },
      { id: "B-09", name: "Unit B-09", status: "occupied", occupant: "Sovereign Gamma", lastUpdated: "3m ago", health: 97 },
      { id: "B-10", name: "Unit B-10", status: "maintenance", lastUpdated: "45m ago", health: 68 },
      { id: "B-11", name: "Unit B-11", status: "occupied", occupant: "The Architect", lastUpdated: "1m ago", health: 99 },
      { id: "B-12", name: "Unit B-12", status: "vacant", lastUpdated: "3d ago", health: 100 },
    ],
    alerts: [
      { id: "a1", level: "warning", message: "Unit B-04: HVAC filter replacement overdue", time: "30m ago" },
      { id: "a2", level: "info", message: "Unit B-12: Listed for sale — consensus pending", time: "2d ago" },
      { id: "a3", level: "critical", message: "Unit B-10: Water leak detected — plumber dispatched", time: "45m ago" },
    ],
  },
  ledgerauto: {
    mapType: "fleet",
    metrics: [
      { label: "Fleet Active", value: 22, unit: "/24", change: 1, status: "optimal", icon: Car, sparkline: [20, 21, 21, 22, 22, 22, 22] },
      { label: "Utilization", value: 76, unit: "%", change: 4, status: "good", icon: Gauge, sparkline: [68, 70, 72, 73, 74, 75, 76] },
      { label: "Avg Charge", value: 78, unit: "%", change: -5, status: "warning", icon: BatteryCharging, sparkline: [92, 88, 85, 82, 80, 79, 78] },
      { label: "Fleet Health", value: 91, unit: "%", status: "good", icon: Wrench, sparkline: [93, 92, 92, 91, 91, 90, 91] },
    ],
    units: [
      { id: "V-01", name: "Tesla Model S — V01", status: "active", occupant: "Rented", lastUpdated: "Live", coordinates: { lat: 25.2048, lng: 55.2708 }, health: 94 },
      { id: "V-02", name: "BMW i7 — V02", status: "active", occupant: "Rented", lastUpdated: "Live", coordinates: { lat: 25.1972, lng: 55.2744 }, health: 89 },
      { id: "V-03", name: "Mercedes EQS — V03", status: "maintenance", occupant: "Service", lastUpdated: "2h ago", coordinates: { lat: 25.165, lng: 55.26 }, health: 72 },
      { id: "V-04", name: "Porsche Taycan — V04", status: "active", occupant: "Rented", lastUpdated: "Live", coordinates: { lat: 25.21, lng: 55.285 }, health: 96 },
      { id: "V-05", name: "Audi e-tron — V05", status: "active", occupant: "Rented", lastUpdated: "Live", coordinates: { lat: 25.18, lng: 55.25 }, health: 91 },
    ],
    alerts: [
      { id: "a1", level: "warning", message: "V-03: Brake pad replacement needed", time: "2h ago" },
      { id: "a2", level: "info", message: "V-01: Route optimized — saved 12 min", time: "5m ago" },
    ],
  },
  ledgertech: {
    mapType: "datacenter",
    metrics: [
      { label: "Uptime", value: 99.97, unit: "%", change: 0.01, status: "optimal", icon: Activity, sparkline: [99.95, 99.96, 99.96, 99.97, 99.97, 99.97, 99.97] },
      { label: "Hash Rate", value: "847", unit: "TH/s", change: 12, status: "optimal", icon: Zap, sparkline: [820, 830, 835, 840, 842, 845, 847] },
      { label: "Power Draw", value: 12.4, unit: "MW", change: 0.3, status: "warning", icon: Plug, sparkline: [11.8, 11.9, 12.0, 12.1, 12.2, 12.3, 12.4] },
      { label: "Temp", value: 68, unit: "°F", change: 2, status: "good", icon: Thermometer, sparkline: [64, 65, 66, 66, 67, 67, 68] },
    ],
    units: [
      { id: "R-01", name: "Rack Alpha-01", status: "active", lastUpdated: "Live", health: 98 },
      { id: "R-02", name: "Rack Alpha-02", status: "active", lastUpdated: "Live", health: 97 },
      { id: "R-03", name: "Rack Alpha-03", status: "active", lastUpdated: "Live", health: 96 },
      { id: "R-04", name: "Rack Beta-01", status: "maintenance", lastUpdated: "1h ago", health: 82 },
      { id: "R-05", name: "Rack Beta-02", status: "active", lastUpdated: "Live", health: 95 },
      { id: "R-06", name: "Rack Beta-03", status: "offline", lastUpdated: "3h ago", health: 45 },
    ],
    alerts: [
      { id: "a1", level: "critical", message: "Rack Beta-03: PSU failure — replacement en route", time: "3h ago" },
      { id: "a2", level: "warning", message: "Power draw approaching 85% capacity", time: "15m ago" },
      { id: "a3", level: "info", message: "Hash rate ATH — cooling efficiency +8%", time: "1h ago" },
    ],
  },
  ledgerenergy: {
    mapType: "solar",
    metrics: [
      { label: "Generation", value: 2.4, unit: "GWh", change: 0.3, status: "optimal", icon: Sun, sparkline: [1.9, 2.0, 2.1, 2.2, 2.2, 2.3, 2.4] },
      { label: "Capacity", value: 78, unit: "%", change: 4, status: "good", icon: Gauge, sparkline: [70, 72, 74, 75, 76, 77, 78] },
      { label: "Carbon Offset", value: "-840", unit: "t", change: -120, status: "optimal", icon: TreePine, sparkline: [-600, -650, -700, -720, -760, -800, -840] },
      { label: "Panel Health", value: 94, unit: "%", change: -1, status: "good", icon: Shield, sparkline: [96, 95, 95, 94, 94, 93, 94] },
    ],
    units: [
      { id: "A-01", name: "Array Sector A", status: "active", lastUpdated: "Live", health: 96 },
      { id: "A-02", name: "Array Sector B", status: "active", lastUpdated: "Live", health: 94 },
      { id: "A-03", name: "Array Sector C", status: "maintenance", lastUpdated: "4h ago", health: 78 },
      { id: "A-04", name: "Array Sector D", status: "active", lastUpdated: "Live", health: 95 },
      { id: "W-01", name: "Wind Turbine 1", status: "active", lastUpdated: "Live", health: 92 },
      { id: "W-02", name: "Wind Turbine 2", status: "active", lastUpdated: "Live", health: 89 },
    ],
    alerts: [
      { id: "a1", level: "warning", message: "Array Sector C: Inverter fault — technician assigned", time: "4h ago" },
      { id: "a2", level: "info", message: "Generation peaked at 14:32 — 3.1 MWh", time: "3h ago" },
    ],
  },
  ledgertravel: {
    mapType: "airspace",
    metrics: [
      { label: "Flights", value: 24, unit: "this month", change: 3, status: "optimal", icon: Plane, sparkline: [18, 19, 20, 21, 22, 23, 24] },
      { label: "Load Factor", value: 78, unit: "%", change: 5, status: "good", icon: Users, sparkline: [68, 70, 72, 73, 75, 76, 78] },
      { label: "Aircraft Health", value: 92, unit: "%", change: -2, status: "good", icon: Wrench, sparkline: [96, 95, 94, 93, 93, 92, 92] },
      { label: "Next Maint", value: 3, unit: "days", status: "warning", icon: Calendar, sparkline: [14, 12, 10, 8, 6, 4, 3] },
    ],
    units: [
      { id: "J-01", name: "Gulfstream G650 — J01", status: "active", occupant: "Dubai→London", lastUpdated: "Live", coordinates: { lat: 40.7128, lng: -0.1276 }, health: 94 },
      { id: "J-02", name: "Bombardier Global — J02", status: "active", occupant: "London→Dubai", lastUpdated: "Live", coordinates: { lat: 30.0, lng: 20.0 }, health: 91 },
      { id: "J-03", name: "Falcon 8X — J03", status: "maintenance", occupant: "Hangar", lastUpdated: "6h ago", health: 76 },
    ],
    alerts: [
      { id: "a1", level: "warning", message: "J-03: Engine inspection due in 3 days", time: "6h ago" },
      { id: "a2", level: "info", message: "J-01: On time — ETA London 14:30 GMT", time: "Live" },
    ],
  },
  ledgeragri: {
    mapType: "farm",
    metrics: [
      { label: "Yield", value: 4.2, unit: "t/ha", change: 0.4, status: "optimal", icon: Sprout, sparkline: [3.6, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2] },
      { label: "Soil pH", value: 6.8, unit: "", status: "optimal", icon: ThermometerSun, sparkline: [6.5, 6.6, 6.7, 6.7, 6.8, 6.8, 6.8] },
      { label: "Irrigation", value: "Active", status: "good", icon: Droplets, sparkline: [95, 96, 95, 97, 96, 97, 97] },
      { label: "Moisture", value: 62, unit: "%", change: -3, status: "good", icon: Waves, sparkline: [68, 66, 65, 64, 63, 62, 62] },
    ],
    units: [
      { id: "P-01", name: "Plot A — Maize", status: "active", lastUpdated: "Live", health: 96 },
      { id: "P-02", name: "Plot B — Soybean", status: "active", lastUpdated: "Live", health: 94 },
      { id: "P-03", name: "Plot C — Fallow", status: "vacant", lastUpdated: "2d ago", health: 100 },
      { id: "P-04", name: "Plot D — Wheat", status: "active", lastUpdated: "Live", health: 91 },
      { id: "P-05", name: "Greenhouse 1", status: "active", lastUpdated: "Live", health: 98 },
    ],
    alerts: [
      { id: "a1", level: "info", message: "Plot A: Optimal growth stage — harvest in 3 weeks", time: "Live" },
      { id: "a2", level: "warning", message: "Moisture dropping — auto-irrigation triggered", time: "15m ago" },
    ],
  },
  ledgeredu: {
    mapType: "campus",
    metrics: [
      { label: "Enrolled", value: 234, unit: "scholars", change: 12, status: "optimal", icon: GraduationCap, sparkline: [210, 215, 220, 222, 225, 230, 234] },
      { label: "Graduation", value: 92, unit: "%", change: 2, status: "optimal", icon: Award, sparkline: [88, 89, 90, 90, 91, 91, 92] },
      { label: "Revenue", value: 15200, unit: "$/mo", change: 1200, status: "good", icon: TrendingUp, sparkline: [12000, 12500, 13000, 13500, 14000, 14500, 15200] },
      { label: "Campus Health", value: 98, unit: "%", status: "optimal", icon: Shield, sparkline: [96, 97, 97, 98, 98, 98, 98] },
    ],
    units: [
      { id: "C-01", name: "Lecture Hall A", status: "occupied", occupant: "Law 101", lastUpdated: "Live", health: 99 },
      { id: "C-02", name: "Lecture Hall B", status: "occupied", occupant: "Ethics 204", lastUpdated: "Live", health: 97 },
      { id: "C-03", name: "Library", status: "active", lastUpdated: "Live", health: 96 },
      { id: "C-04", name: "Lab Alpha", status: "maintenance", lastUpdated: "1d ago", health: 84 },
      { id: "C-05", name: "Dorm Block 1", status: "occupied", occupant: "78 residents", lastUpdated: "Live", health: 95 },
    ],
    alerts: [
      { id: "a1", level: "info", message: "Enrollment cap raised to 250 — 16 slots open", time: "1d ago" },
      { id: "a2", level: "warning", message: "Lab Alpha: Equipment calibration due", time: "1d ago" },
    ],
  },
  ledgerhealth: {
    mapType: "hospital",
    metrics: [
      { label: "Patients", value: 1240, unit: "/mo", change: 89, status: "optimal", icon: Users, sparkline: [1050, 1080, 1100, 1120, 1150, 1180, 1240] },
      { label: "Equipment", value: 98, unit: "%", change: 1, status: "optimal", icon: Microscope, sparkline: [95, 96, 96, 97, 97, 97, 98] },
      { label: "Bed Occupancy", value: 87, unit: "%", change: 3, status: "good", icon: BedDouble, sparkline: [78, 80, 82, 83, 84, 85, 87] },
      { label: "Staff Ratio", value: "1:4", unit: "", status: "good", icon: Stethoscope, sparkline: [95, 94, 95, 96, 95, 96, 96] },
    ],
    units: [
      { id: "W-01", name: "Ward A — General", status: "occupied", occupant: "12 patients", lastUpdated: "Live", health: 96 },
      { id: "W-02", name: "Ward B — ICU", status: "occupied", occupant: "4 patients", lastUpdated: "Live", health: 98 },
      { id: "W-03", name: "Ward C — Maternity", status: "occupied", occupant: "6 patients", lastUpdated: "Live", health: 97 },
      { id: "W-04", name: "OR-1", status: "active", lastUpdated: "Live", health: 99 },
      { id: "W-05", name: "OR-2", status: "maintenance", lastUpdated: "3h ago", health: 82 },
    ],
    alerts: [
      { id: "a1", level: "critical", message: "OR-2: Sterilization cycle failure — redirecting surgeries", time: "3h ago" },
      { id: "a2", level: "info", message: "Ward B: New ventilators installed — capacity +2", time: "1d ago" },
    ],
  },
  ledgerbiz: {
    mapType: "office",
    metrics: [
      { label: "Occupancy", value: 87, unit: "%", change: 5, status: "good", icon: Users, sparkline: [78, 80, 82, 83, 84, 85, 87] },
      { label: "Contracts", value: 14, unit: "active", change: 2, status: "optimal", icon: Briefcase, sparkline: [10, 11, 12, 12, 13, 13, 14] },
      { label: "Growth", value: 12, unit: "% QoQ", change: 3, status: "optimal", icon: TrendingUp, sparkline: [7, 8, 9, 9, 10, 11, 12] },
      { label: "Meeting Rooms", value: 64, unit: "%", change: 8, status: "good", icon: Presentation, sparkline: [50, 52, 55, 56, 58, 60, 64] },
    ],
    units: [
      { id: "F-01", name: "Floor 12 — East", status: "occupied", occupant: "TechCorp", lastUpdated: "Live", health: 96 },
      { id: "F-02", name: "Floor 12 — West", status: "occupied", occupant: "FinVault", lastUpdated: "Live", health: 94 },
      { id: "F-03", name: "Floor 13 — East", status: "vacant", lastUpdated: "1w ago", health: 100 },
      { id: "F-04", name: "Floor 13 — West", status: "occupied", occupant: "BioMed", lastUpdated: "Live", health: 92 },
      { id: "F-05", name: "Conference Center", status: "active", lastUpdated: "Live", health: 98 },
    ],
    alerts: [
      { id: "a1", level: "info", message: "Floor 13 East: Viewing scheduled — 3 prospects", time: "2h ago" },
      { id: "a2", level: "warning", message: "HVAC efficiency -8% — service check recommended", time: "1d ago" },
    ],
  },
  ledgeraccess: {
    mapType: "venue",
    metrics: [
      { label: "Events", value: 12, unit: "this month", change: 3, status: "optimal", icon: Calendar, sparkline: [8, 9, 9, 10, 10, 11, 12] },
      { label: "Members", value: 89, unit: "active", change: 7, status: "good", icon: Users, sparkline: [72, 75, 76, 78, 80, 82, 89] },
      { label: "Venues", value: 4, unit: "open", status: "optimal", icon: MapPin, sparkline: [4, 4, 4, 4, 4, 4, 4] },
      { label: "Satisfaction", value: 94, unit: "%", change: 2, status: "optimal", icon: Award, sparkline: [90, 91, 92, 92, 93, 93, 94] },
    ],
    units: [
      { id: "V-01", name: "Monaco Yacht Club", status: "active", lastUpdated: "Live", health: 98 },
      { id: "V-02", name: "Monte Carlo Casino", status: "occupied", occupant: "Private Event", lastUpdated: "Live", health: 96 },
      { id: "V-03", name: "Grand Prix Suite", status: "active", lastUpdated: "Live", health: 94 },
      { id: "V-04", name: "Rooftop Lounge", status: "maintenance", lastUpdated: "6h ago", health: 85 },
    ],
    alerts: [
      { id: "a1", level: "info", message: "Grand Prix Suite: 98% booked for race weekend", time: "1d ago" },
      { id: "a2", level: "warning", message: "Rooftop Lounge: Sound system upgrade in progress", time: "6h ago" },
    ],
  },
};

/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ============================================================
   COMPONENT — Animated Gauge
   ============================================================ */
function GaugeRing({ value, max = 100, size = 80, color = "#10b981", label }: {
  value: number; max?: number; size?: number; color?: string; label: string;
}) {
  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={10} />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round" strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-white">{value}</span>
        <span className="text-[8px] text-white/20 uppercase">{label}</span>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Sparkline
   ============================================================ */
function Sparkline({ data, color = "#10b981", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        fill={`${color}20`}
        stroke="none"
        points={`0,100 ${points} 100,100`}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ============================================================
   COMPONENT — Status Badge
   ============================================================ */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.offline;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border", cfg.bg, cfg.border, cfg.color)}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
}

/* ============================================================
   COMPONENT — Alert Banner
   ============================================================ */
function AlertBanner({ alert }: { alert: { level: string; message: string; time: string } }) {
  const styles = {
    info: { border: "border-cyan-500/20", bg: "bg-cyan-950/10", icon: Info, color: "text-cyan-400" },
    warning: { border: "border-amber-500/20", bg: "bg-amber-950/10", icon: AlertTriangle, color: "text-amber-400" },
    critical: { border: "border-rose-500/20", bg: "bg-rose-950/10", icon: XCircle, color: "text-rose-400" },
  };
  const style = styles[alert.level as keyof typeof styles] || styles.info;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex items-start gap-2 rounded-xl border p-3", style.border, style.bg)}
    >
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", style.color)} />
      <div className="flex-1">
        <p className={cn("text-xs", style.color)}>{alert.message}</p>
        <p className="text-[9px] text-white/15 mt-0.5">{alert.time}</p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   COMPONENT — Map Visualization (Abstract)
   ============================================================ */
function AssetMap({ units, mapType, config }: {
  units: AssetUnit[]; mapType: string; config: typeof VERTICAL_CONFIG[VerticalId];
}) {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Abstract grid-based map visualization
  const gridCols = mapType === "datacenter" ? 3 : mapType === "building" ? 4 : 3;
  const totalSlots = mapType === "building" ? 12 : mapType === "datacenter" ? 6 : units.length;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin className={cn("h-4 w-4", config.color)} />
          {mapType === "airspace" ? "Flight Tracker" : mapType === "fleet" ? "Fleet Map" : "Asset Map"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400/50">
            <Radio className="h-2.5 w-2.5 animate-pulse" />Live
          </span>
          <span className="text-[10px] text-white/20">{units.length} units</span>
        </div>
      </div>

      {/* Abstract Map Grid */}
      <div className={cn("grid gap-2", `grid-cols-${gridCols}`)} style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
        {Array.from({ length: totalSlots }).map((_, i) => {
          const unit = units[i];
          if (!unit) return <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] h-24" />;

          const isSelected = selectedUnit === unit.id;
          const statusCfg = STATUS_STYLES[unit.status] || STATUS_STYLES.offline;

          return (
            <motion.button
              key={unit.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedUnit(isSelected ? null : unit.id)}
              className={cn(
                "relative rounded-xl border p-3 text-left transition-all h-24",
                isSelected ? "border-cyan-500/30 bg-cyan-950/10" : "border-white/5 bg-white/[0.02] hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-white/60">{unit.name}</span>
                <div className={cn("h-2 w-2 rounded-full", statusCfg.color.replace("text-", "bg-"))} />
              </div>
              <StatusBadge status={unit.status} />
              {unit.health && (
                <div className="mt-2">
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        unit.health > 90 ? "bg-emerald-500" : unit.health > 75 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${unit.health}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-white/20 mt-0.5">{unit.health}% health</span>
                </div>
              )}
              {unit.coordinates && (
                <p className="text-[8px] text-white/10 mt-1 font-mono">
                  {unit.coordinates.lat.toFixed(2)}, {unit.coordinates.lng.toFixed(2)}
                </p>
              )}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <div className="h-3 w-3 rounded-full bg-cyan-400 ring-2 ring-[#0a0a14]" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Unit Detail */}
      <AnimatePresence>
        {selectedUnit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {(() => {
              const unit = units.find((u) => u.id === selectedUnit);
              if (!unit) return null;
              return (
                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{unit.name}</h4>
                      <p className="text-[10px] text-white/20">{unit.lastUpdated}</p>
                    </div>
                    <StatusBadge status={unit.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white/[0.02] p-2 text-center">
                      <p className="text-xs font-bold text-white">{unit.health}%</p>
                      <p className="text-[9px] text-white/20">Health</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] p-2 text-center">
                      <p className="text-xs font-bold text-white">{unit.status}</p>
                      <p className="text-[9px] text-white/20">Status</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] p-2 text-center">
                      <p className="text-xs font-bold text-white">{unit.lastUpdated}</p>
                      <p className="text-[9px] text-white/20">Updated</p>
                    </div>
                  </div>
                  {unit.occupant && (
                    <p className="text-xs text-white/30 mt-3">Current: {unit.occupant}</p>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function HallAssetPage() {
  const params = useParams();
  const hallId = (params.id as VerticalId) || "ledgerprop";
  const config = VERTICAL_CONFIG[hallId] || VERTICAL_CONFIG.ledgerprop;
  const HallIcon = config.icon;
  const data = VERTICAL_DATA[hallId] || VERTICAL_DATA.ledgerprop;

  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-emerald-500/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/halls/${hallId}`}>
                <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </Link>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10", config.bg)}>
                <HallIcon className={cn("h-5 w-5", config.color)} />
              </div>
              <div>
                <h1 className={cn("text-xl font-bold", config.color)}>{config.name} Asset Tracker</h1>
                <p className="text-xs text-white/30">Real-time monitoring • GPS • Telemetry • Health</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className={cn(
                "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2",
                refreshing && "text-cyan-400"
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              {refreshing ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {data.metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-white/20 font-bold">{metric.label}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", STATUS_STYLES[metric.status].bg)}>
                  <metric.icon className={cn("h-4 w-4", STATUS_STYLES[metric.status].color)} />
                </div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-white">
                  {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
                </span>
                {metric.unit && <span className="text-xs text-white/20 mb-1">{metric.unit}</span>}
              </div>
              {metric.change !== undefined && (
                <div className="flex items-center gap-1 mb-2">
                  {metric.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-rose-400" />
                  )}
                  <span className={cn("text-[10px]", metric.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {metric.change >= 0 ? "+" : ""}{metric.change}{metric.unit}
                  </span>
                </div>
              )}
              {metric.sparkline && (
                <Sparkline
                  data={metric.sparkline}
                  color={metric.status === "optimal" ? "#10b981" : metric.status === "good" ? "#06b6d4" : metric.status === "warning" ? "#f59e0b" : "#f43f5e"}
                  height={30}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Map + Units */}
          <div className="lg:col-span-2 space-y-6">
            <AssetMap units={data.units} mapType={data.mapType} config={config} />

            {/* Unit List Table */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-white/20" />
                  Unit Registry
                </h3>
                <span className="text-[10px] text-white/20">{data.units.length} units tracked</span>
              </div>
              <div className="space-y-2">
                {data.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.03] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        STATUS_STYLES[unit.status].bg
                      )}>
                        <Activity className={cn("h-4 w-4", STATUS_STYLES[unit.status].color)} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{unit.name}</p>
                        <p className="text-[10px] text-white/20">{unit.id} • {unit.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {unit.health && (
                        <div className="w-24">
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                unit.health > 90 ? "bg-emerald-500" : unit.health > 75 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${unit.health}%` }}
                            />
                          </div>
                          <p className="text-[8px] text-white/15 mt-0.5 text-right">{unit.health}%</p>
                        </div>
                      )}
                      <StatusBadge status={unit.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Alerts + Details */}
          <div className="space-y-6">
            {/* Alerts */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Radar className="h-3.5 w-3.5 text-rose-400" />
                  Active Alerts
                </h3>
                <span className="text-[10px] text-white/20">{data.alerts.length} open</span>
              </div>
              <div className="space-y-2">
                {data.alerts.map((alert) => (
                  <AlertBanner key={alert.id} alert={alert} />
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Scan className="h-3.5 w-3.5 text-cyan-400" />
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">Telemetry</span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                    <Signal className="h-3 w-3" />Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">GPS Tracking</span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                    <Satellite className="h-3 w-3" />Locked
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">Data Refresh</span>
                  <span className="text-white/40 text-[10px]">Every 30s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">Last Sync</span>
                  <span className="text-white/40 text-[10px]">Just now</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">Encryption</span>
                  <span className="text-cyan-400/50 text-[10px]">AES-256</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all text-left flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5" />Request Maintenance
                </button>
                <button className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all text-left flex items-center gap-2">
                  <Download className="h-3.5 w-3.5" />Export Telemetry
                </button>
                <button className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all text-left flex items-center gap-2">
                  <Crosshair className="h-3.5 w-3.5" />Calibrate Sensors
                </button>
              </div>
            </div>

            {/* SPV Info */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                SPV Entity
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/30">Name</span>
                  <span className="text-white/60">{config.name} SPV Ltd</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30">Jurisdiction</span>
                  <span className="text-white/60">Cayman Islands</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30">Registration</span>
                  <span className="text-white/60 font-mono">CI-2026-8842</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30">Auditor</span>
                  <span className="text-white/60">8th Ledger</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}