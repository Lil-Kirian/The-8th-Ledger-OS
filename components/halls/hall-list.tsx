"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  MapPin,
  Building2,
  Car,
  Cpu,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Plane,
  Wheat,
  Sun,
  Wifi,
  Crown,
  Shield,
  AlertTriangle,
  Lock,
  Activity,
  ChevronDown,
  Crown as CrownIcon,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HallCard, HallCardSkeleton, HallCardData, VerticalKey, HallStatus, HallClass, SriTier } from "./hall-card";

// ─── Types ───
export type SortKey =
  | "sriDesc"
  | "sriAsc"
  | "ahgiDesc"
  | "ahgiAsc"
  | "membersDesc"
  | "membersAsc"
  | "revenueDesc"
  | "revenueAsc"
  | "ownershipDesc"
  | "ownershipAsc"
  | "newest"
  | "oldest";

export interface HallListProps {
  halls: HallCardData[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  showPrimaryAdminBadge?: boolean;
  onFilterChange?: (filters: HallFilters) => void;
}

export interface HallFilters {
  search: string;
  verticals: VerticalKey[];
  statuses: HallStatus[];
  classes: HallClass[];
  sriTiers: SriTier[];
  continents: string[];
  minSri: number;
  minAhgi: number;
  hasRevenue: boolean | null;
  hasOwnership: boolean | null;
}

// ─── Vertical Options ───
const VERTICAL_OPTIONS: { key: VerticalKey; label: string; icon: React.ElementType }[] = [
  { key: "ledgerprop",   label: "LedgerProp",   icon: Building2 },
  { key: "ledgerauto",   label: "LedgerAuto",   icon: Car },
  { key: "ledgertech",   label: "LedgerTech",   icon: Cpu },
  { key: "ledgeredu",    label: "LedgerEdu",    icon: GraduationCap },
  { key: "ledgerhealth", label: "LedgerHealth", icon: HeartPulse },
  { key: "ledgerbiz",    label: "LedgerBiz",    icon: Briefcase },
  { key: "ledgertravel", label: "LedgerTravel", icon: Plane },
  { key: "ledgeragri",   label: "LedgerAgri",   icon: Wheat },
  { key: "ledgerenergy", label: "LedgerEnergy", icon: Sun },
  { key: "ledgeraccess", label: "LedgerAccess", icon: Wifi },
  { key: "ledgersport",  label: "LedgerSport",  icon: Swords },
];

const STATUS_OPTIONS: { key: HallStatus; label: string; icon: React.ElementType }[] = [
  { key: "ghost",     label: "Ghost",     icon: Lock },
  { key: "live",      label: "Live",      icon: Activity },
  { key: "closing",   label: "Closing",   icon: AlertTriangle },
  { key: "dissolved", label: "Dissolved", icon: Shield },
];

const CLASS_OPTIONS: { key: HallClass; label: string }[] = [
  { key: "I",   label: "Class I — Passive" },
  { key: "II",  label: "Class II — Managed" },
  { key: "III", label: "Class III — Active" },
];

const SRI_TIER_OPTIONS: { key: SriTier; label: string; emoji: string }[] = [
  { key: "platinum", label: "Platinum", emoji: "👑" },
  { key: "gold",     label: "Gold",     emoji: "🥇" },
  { key: "silver",   label: "Silver",   emoji: "🥈" },
  { key: "bronze",   label: "Bronze",   emoji: "🥉" },
  { key: "at_risk",  label: "At Risk",  emoji: "⚠️" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "sriDesc",       label: "SRI: Highest First" },
  { key: "sriAsc",        label: "SRI: Lowest First" },
  { key: "ahgiDesc",      label: "AHGI: Highest First" },
  { key: "ahgiAsc",       label: "AHGI: Lowest First" },
  { key: "membersDesc",   label: "Members: Most First" },
  { key: "membersAsc",    label: "Members: Least First" },
  { key: "revenueDesc",   label: "Revenue: Highest First" },
  { key: "revenueAsc",    label: "Revenue: Lowest First" },
  { key: "ownershipDesc", label: "Ownership: Highest First" },
  { key: "ownershipAsc",  label: "Ownership: Lowest First" },
  { key: "newest",        label: "Newest First" },
  { key: "oldest",        label: "Oldest First" },
];

// ─── Helpers ───
function getContinents(halls: HallCardData[]): string[] {
  const set = new Set(halls.map((h) => h.continent));
  return Array.from(set).sort();
}

function countActiveFilters(filters: HallFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.verticals.length) count++;
  if (filters.statuses.length) count++;
  if (filters.classes.length) count++;
  if (filters.sriTiers.length) count++;
  if (filters.continents.length) count++;
  if (filters.minSri > 0) count++;
  if (filters.minAhgi > 0) count++;
  if (filters.hasRevenue !== null) count++;
  if (filters.hasOwnership !== null) count++;
  return count;
}

// ─── Component ───
export function HallList({
  halls,
  isLoading = false,
  emptyTitle = "No halls found",
  emptySubtitle = "Adjust your filters or explore the Agora for upcoming pools.",
  showPrimaryAdminBadge = false,
  onFilterChange,
}: HallListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortKey, setSortKey] = useState<SortKey>("sriDesc");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<HallFilters>({
    search: "",
    verticals: [],
    statuses: [],
    classes: [],
    sriTiers: [],
    continents: [],
    minSri: 0,
    minAhgi: 0,
    hasRevenue: null,
    hasOwnership: null,
  });

  const continents = useMemo(() => getContinents(halls), [halls]);
  const activeFilterCount = countActiveFilters(filters);

  const updateFilters = useCallback(
    (patch: Partial<HallFilters>) => {
      const next = { ...filters, ...patch };
      setFilters(next);
      onFilterChange?.(next);
    },
    [filters, onFilterChange]
  );

  const clearFilters = useCallback(() => {
    const cleared: HallFilters = {
      search: "",
      verticals: [],
      statuses: [],
      classes: [],
      sriTiers: [],
      continents: [],
      minSri: 0,
      minAhgi: 0,
      hasRevenue: null,
      hasOwnership: null,
    };
    setFilters(cleared);
    onFilterChange?.(cleared);
  }, [onFilterChange]);

  const filteredHalls = useMemo(() => {
    let result = [...halls];

    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q) ||
          h.continent.toLowerCase().includes(q) ||
          h.vertical.toLowerCase().includes(q) ||
          String(h.hallNumber).includes(q)
      );
    }

    // Verticals
    if (filters.verticals.length) {
      result = result.filter((h) => filters.verticals.includes(h.vertical));
    }

    // Statuses
    if (filters.statuses.length) {
      result = result.filter((h) => filters.statuses.includes(h.status));
    }

    // Classes
    if (filters.classes.length) {
      result = result.filter((h) => filters.classes.includes(h.hallClass));
    }

    // SRI Tiers
    if (filters.sriTiers.length) {
      result = result.filter((h) => filters.sriTiers.includes(h.sriTier));
    }

    // Continents
    if (filters.continents.length) {
      result = result.filter((h) => filters.continents.includes(h.continent));
    }

    // Min SRI
    if (filters.minSri > 0) {
      result = result.filter((h) => h.sriScore >= filters.minSri);
    }

    // Min AHGI
    if (filters.minAhgi > 0) {
      result = result.filter((h) => h.ahgiScore >= filters.minAhgi);
    }

    // Has revenue
    if (filters.hasRevenue === true) {
      result = result.filter((h) => (h.monthlyRevenue ?? 0) > 0);
    } else if (filters.hasRevenue === false) {
      result = result.filter((h) => (h.monthlyRevenue ?? 0) === 0);
    }

    // Has ownership
    if (filters.hasOwnership === true) {
      result = result.filter((h) => (h.yourOwnershipPercent ?? 0) > 0);
    } else if (filters.hasOwnership === false) {
      result = result.filter((h) => (h.yourOwnershipPercent ?? 0) === 0);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortKey) {
        case "sriDesc": return b.sriScore - a.sriScore;
        case "sriAsc": return a.sriScore - b.sriScore;
        case "ahgiDesc": return b.ahgiScore - a.ahgiScore;
        case "ahgiAsc": return a.ahgiScore - b.ahgiScore;
        case "membersDesc": return b.memberCount - a.memberCount;
        case "membersAsc": return a.memberCount - b.memberCount;
        case "revenueDesc": return (b.monthlyRevenue ?? 0) - (a.monthlyRevenue ?? 0);
        case "revenueAsc": return (a.monthlyRevenue ?? 0) - (b.monthlyRevenue ?? 0);
        case "ownershipDesc": return (b.yourOwnershipPercent ?? 0) - (a.yourOwnershipPercent ?? 0);
        case "ownershipAsc": return (a.yourOwnershipPercent ?? 0) - (b.yourOwnershipPercent ?? 0);
        case "newest": return b.hallNumber - a.hallNumber;
        case "oldest": return a.hallNumber - b.hallNumber;
        default: return 0;
      }
    });

    return result;
  }, [halls, filters, sortKey]);

  const liveCount = halls.filter((h) => h.status === "live").length;
  const ghostCount = halls.filter((h) => h.status === "ghost").length;
  const closingCount = halls.filter((h) => h.status === "closing").length;
  const yourHallsCount = halls.filter((h) => (h.yourOwnershipPercent ?? 0) > 0).length;

  return (
    <div className="space-y-5">
      {/* ─── Header Bar ─── */}
      <div className="flex flex-col gap-4">
        {/* Title + Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Sovereign Halls</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {halls.length} hall{halls.length === 1 ? "" : "s"} across the 8th Ledger
              {yourHallsCount > 0 && (
                <span className="text-cyan-400 ml-1">· {yourHallsCount} owned</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-xs">
              <Activity className="w-3 h-3 mr-1" />
              {liveCount} Live
            </Badge>
            <Badge variant="outline" className="border-slate-600/20 text-slate-400 bg-slate-500/5 text-xs">
              <Lock className="w-3 h-3 mr-1" />
              {ghostCount} Ghost
            </Badge>
            {closingCount > 0 && (
              <Badge variant="outline" className="border-red-500/20 text-red-400 bg-red-500/5 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {closingCount} Closing
              </Badge>
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search halls by name, location, vertical, or number..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-cyan-500/30"
            />
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-56 bg-slate-900/50 border-slate-800 text-slate-300 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-slate-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} value={opt.key} className="text-xs text-slate-300 focus:bg-slate-800">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 relative ${
              activeFilterCount > 0 ? "border-cyan-500/30 text-cyan-400" : ""
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-800 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Filter Panel ─── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-4">
                {/* Verticals */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                    Vertical
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VERTICAL_OPTIONS.map((v) => {
                      const VIcon = v.icon;
                      const active = filters.verticals.includes(v.key);
                      return (
                        <button
                          key={v.key}
                          onClick={() =>
                            updateFilters({
                              verticals: active
                                ? filters.verticals.filter((x) => x !== v.key)
                                : [...filters.verticals, v.key],
                            })
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-all ${
                            active
                              ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                              : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <VIcon className="w-3.5 h-3.5" />
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status + Class + SRI Tier */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((s) => {
                        const SIcon = s.icon;
                        const active = filters.statuses.includes(s.key);
                        return (
                          <button
                            key={s.key}
                            onClick={() =>
                              updateFilters({
                                statuses: active
                                  ? filters.statuses.filter((x) => x !== s.key)
                                  : [...filters.statuses, s.key],
                              })
                            }
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-all ${
                              active
                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                                : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <SIcon className="w-3.5 h-3.5" />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                      Hall Class
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CLASS_OPTIONS.map((c) => {
                        const active = filters.classes.includes(c.key);
                        return (
                          <button
                            key={c.key}
                            onClick={() =>
                              updateFilters({
                                classes: active
                                  ? filters.classes.filter((x) => x !== c.key)
                                  : [...filters.classes, c.key],
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-md text-xs border transition-all ${
                              active
                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                                : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SRI Tier */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                      SRI Tier
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SRI_TIER_OPTIONS.map((t) => {
                        const active = filters.sriTiers.includes(t.key);
                        return (
                          <button
                            key={t.key}
                            onClick={() =>
                              updateFilters({
                                sriTiers: active
                                  ? filters.sriTiers.filter((x) => x !== t.key)
                                  : [...filters.sriTiers, t.key],
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-md text-xs border transition-all ${
                              active
                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                                : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <span className="mr-1">{t.emoji}</span>
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Continent + Score Sliders + Ownership/Revenue toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Continent */}
                  {continents.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                        Continent
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {continents.map((c) => {
                          const active = filters.continents.includes(c);
                          return (
                            <button
                              key={c}
                              onClick={() =>
                                updateFilters({
                                  continents: active
                                    ? filters.continents.filter((x) => x !== c)
                                    : [...filters.continents, c],
                                })
                              }
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-all ${
                                active
                                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                                  : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Min SRI */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                      Min SRI: {filters.minSri}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={filters.minSri}
                      onChange={(e) => updateFilters({ minSri: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Min AHGI */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                      Min AHGI: {filters.minAhgi}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={filters.minAhgi}
                      onChange={(e) => updateFilters({ minAhgi: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Ownership / Revenue toggles */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                      Ownership
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateFilters({ hasOwnership: filters.hasOwnership === true ? null : true })
                        }
                        className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                          filters.hasOwnership === true
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        My Halls
                      </button>
                      <button
                        onClick={() =>
                          updateFilters({ hasOwnership: filters.hasOwnership === false ? null : false })
                        }
                        className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                          filters.hasOwnership === false
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Not Owned
                      </button>
                    </div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mt-2">
                      Revenue
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateFilters({ hasRevenue: filters.hasRevenue === true ? null : true })
                        }
                        className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                          filters.hasRevenue === true
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Earning
                      </button>
                      <button
                        onClick={() =>
                          updateFilters({ hasRevenue: filters.hasRevenue === false ? null : false })
                        }
                        className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                          filters.hasRevenue === false
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                            : "border-slate-700 bg-slate-800/50 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Not Earning
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs text-slate-500 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500">Active:</span>
            {filters.verticals.map((v) => (
              <Badge
                key={v}
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-xs cursor-pointer hover:bg-cyan-500/10"
                onClick={() => updateFilters({ verticals: filters.verticals.filter((x) => x !== v) })}
              >
                {VERTICAL_OPTIONS.find((o) => o.key === v)?.label} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            {filters.statuses.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-xs cursor-pointer hover:bg-cyan-500/10"
                onClick={() => updateFilters({ statuses: filters.statuses.filter((x) => x !== s) })}
              >
                {STATUS_OPTIONS.find((o) => o.key === s)?.label} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            {filters.classes.map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-xs cursor-pointer hover:bg-cyan-500/10"
                onClick={() => updateFilters({ classes: filters.classes.filter((x) => x !== c) })}
              >
                Class {c} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            {filters.sriTiers.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-xs cursor-pointer hover:bg-cyan-500/10"
                onClick={() => updateFilters({ sriTiers: filters.sriTiers.filter((x) => x !== t) })}
              >
                {SRI_TIER_OPTIONS.find((o) => o.key === t)?.label} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            {filters.continents.map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-xs cursor-pointer hover:bg-cyan-500/10"
                onClick={() => updateFilters({ continents: filters.continents.filter((x) => x !== c) })}
              >
                {c} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            {filters.minSri > 0 && (
              <Badge
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-xs cursor-pointer hover:bg-cyan-500/10"
                onClick={() => updateFilters({ minSri: 0 })}
              >
                SRI ≥ {filters.minSri} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.minAhgi > 0 && (
              <Badge
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5 text-xs cursor-pointer hover:bg-cyan-500/10"
                onClick={() => updateFilters({ minAhgi: 0 })}
              >
                AHGI ≥ {filters.minAhgi} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ─── Results ─── */}
      <div>
        {/* Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">
            Showing <span className="text-slate-300 font-medium">{filteredHalls.length}</span> of{" "}
            <span className="text-slate-300 font-medium">{halls.length}</span> halls
          </span>
          {filteredHalls.length !== halls.length && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-cyan-400 hover:text-cyan-300">
              Reset
            </Button>
          )}
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <HallCardSkeleton />
                    </motion.div>
                  ))
                : filteredHalls.map((hall) => (
                    <motion.div
                      key={hall.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HallCard hall={hall} />
                    </motion.div>
                  ))}
            </AnimatePresence>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <HallCardSkeleton />
                    </motion.div>
                  ))
                : filteredHalls.map((hall) => (
                    <motion.div
                      key={hall.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <HallListRow hall={hall} />
                    </motion.div>
                  ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredHalls.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-1">{emptyTitle}</h3>
            <p className="text-sm text-slate-500 max-w-sm">{emptySubtitle}</p>
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4 border-slate-700 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── List Row Variant ───
function HallListRow({ hall }: { hall: HallCardData }) {
  const v = VERTICAL_OPTIONS.find((o) => o.key === hall.vertical)!;
  const VIcon = v.icon;
  const sri = SRI_TIER_OPTIONS.find((o) => o.key === hall.sriTier)!;
  const ahgi = hall.ahgiScore >= 80
    ? { label: "Thriving", color: "text-emerald-400" }
    : hall.ahgiScore >= 60
    ? { label: "Healthy", color: "text-blue-400" }
    : hall.ahgiScore >= 40
    ? { label: "Stagnant", color: "text-amber-400" }
    : hall.ahgiScore >= 20
    ? { label: "Declining", color: "text-orange-400" }
    : { label: "Critical", color: "text-red-400" };

  // Dynamic bg based on vertical
  const verticalBgMap: Record<VerticalKey, string> = {
    ledgerprop: "bg-emerald-500/10",
    ledgerauto: "bg-blue-500/10",
    ledgertech: "bg-violet-500/10",
    ledgeredu: "bg-amber-500/10",
    ledgerhealth: "bg-rose-500/10",
    ledgerbiz: "bg-orange-500/10",
    ledgertravel: "bg-sky-500/10",
    ledgeragri: "bg-lime-500/10",
    ledgerenergy: "bg-yellow-500/10",
    ledgeraccess: "bg-cyan-500/10",
    ledgersport: "bg-rose-500/10",
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-colors group">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${verticalBgMap[hall.vertical] || "bg-slate-800"}`}>
        <VIcon className="w-5 h-5 text-slate-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-500">#{hall.hallNumber}</span>
          <span className="text-sm font-medium text-slate-200 truncate">{hall.name}</span>
          <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
            {v.label}
          </Badge>
          {hall.isPrimaryAdmin && (
            <Badge className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
              <CrownIcon className="w-2.5 h-2.5 mr-1" />
              8th Ledger
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {hall.location}
          </span>
          <span>Class {hall.hallClass}</span>
          <span className={`${ahgi.color}`}>AHGI {hall.ahgiScore} ({ahgi.label})</span>
          <span className="text-slate-400">SRI {hall.sriScore} {sri.emoji}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-xs">
        {hall.yourOwnershipPercent != null && (
          <div className="text-right">
            <div className="text-slate-500">Your stake</div>
            <div className="font-mono font-medium text-cyan-400">{hall.yourOwnershipPercent.toFixed(2)}%</div>
          </div>
        )}
        {hall.monthlyRevenue != null && hall.status === "live" && (
          <div className="text-right">
            <div className="text-slate-500">Monthly</div>
            <div className="font-mono font-medium text-emerald-400">
              ${hall.monthlyRevenue.toLocaleString()}
            </div>
          </div>
        )}
        <div className="text-right">
          <div className="text-slate-500">Members</div>
          <div className="font-mono text-slate-300">{hall.memberCount}</div>
        </div>
      </div>

      {/* Arrow */}
      <ChevronDown className="w-4 h-4 text-slate-600 rotate-[-90deg] group-hover:text-slate-400 transition-colors shrink-0" />
    </div>
  );
}