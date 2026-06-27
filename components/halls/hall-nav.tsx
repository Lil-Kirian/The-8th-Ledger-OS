"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard,
  Radio,
  Users,
  Landmark,
  Shield,
  BarChart3,
  ShoppingCart,
  Hammer,
  Lock,
  AlertTriangle,
  ChevronRight,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types ───
export type HallNavTab =
  | "dashboard"
  | "sovereign-stream"
  | "cabinet"
  | "ledger"
  | "vault"
  | "assets"
  | "marketplace"
  | "forge";

export interface HallNavProps {
  hallId: string;
  activeTab: HallNavTab;
  badgeCounts?: Partial<Record<HallNavTab, number>>;
  hallStatus?: "ghost" | "live" | "closing" | "dissolved";
  isPrimaryAdmin?: boolean;
  className?: string;
}

// ─── Tab Config ───
const TABS: {
  key: HallNavTab;
  label: string;
  icon: React.ElementType;
  description: string;
  disabledStatuses?: ("ghost" | "closing" | "dissolved")[];
  adminOnly?: boolean;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Hall overview, treasury, revenue, your dividends",
  },
  {
    key: "sovereign-stream",
    label: "Sovereign Stream",
    icon: Radio,
    description: "Structured proposals, reports, appeals, 8th Ledger updates",
  },
  {
    key: "cabinet",
    label: "Cabinet",
    icon: Users,
    description: "Executive Cabinet — Speaker, Treasurer, Warden, Scribe",
  },
  {
    key: "ledger",
    label: "8th Ledger",
    icon: Landmark,
    description: "Company updates, maintenance, insurance, payroll, valuation",
  },
  {
    key: "vault",
    label: "Vault",
    icon: Shield,
    description: "Deed, insurance certificates, SPV agreements, constitution",
  },
  {
    key: "assets",
    label: "Assets",
    icon: BarChart3,
    description: "Real-time metrics, alerts, health monitoring",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    icon: ShoppingCart,
    description: "PAC trading, inventory sales, ownership exchange",
  },
  {
    key: "forge",
    label: "Forge",
    icon: Hammer,
    description: "Staffing, payroll, worker performance, 8th Ledger Relay",
    disabledStatuses: ["ghost"],
  },
];

// ─── Component ───
export function HallNav({
  hallId,
  activeTab,
  badgeCounts = {},
  hallStatus = "live",
  isPrimaryAdmin = false,
  className = "",
}: HallNavProps) {
  const [hoveredTab, setHoveredTab] = useState<HallNavTab | null>(null);

  const isDisabled = (tab: typeof TABS[0]) => {
    if (tab.disabledStatuses?.includes(hallStatus)) return true;
    if (hallStatus === "dissolved") return true;
    return false;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: Horizontal Tabs */}
      <div className="hidden md:block">
        <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            const isTabDisabled = isDisabled(tab);
            const badgeCount = badgeCounts[tab.key];

            return (
              <Link
                key={tab.key}
                href={isTabDisabled ? `#` : `/halls/${hallId}/${tab.key}`}
                onClick={(e) => {
                  if (isTabDisabled) e.preventDefault();
                }}
                onMouseEnter={() => setHoveredTab(tab.key)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.08)]"
                    : isTabDisabled
                    ? "text-slate-700 cursor-not-allowed"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? "text-cyan-400" : ""}`} />
                <span>{tab.label}</span>
                {badgeCount != null && badgeCount > 0 && (
                  <Badge
                    className={`text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center border-0 ${
                      isActive
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
                {isTabDisabled && (
                  <Lock className="w-3 h-3 text-slate-700 ml-0.5" />
                )}

                {/* Hover tooltip */}
                {hoveredTab === tab.key && !isActive && !isTabDisabled && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 whitespace-nowrap z-20 shadow-xl"
                  >
                    {tab.description}
                  </motion.div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile: Scrollable Horizontal */}
      <div className="md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            const isTabDisabled = isDisabled(tab);
            const badgeCount = badgeCounts[tab.key];

            return (
              <Link
                key={tab.key}
                href={isTabDisabled ? `#` : `/halls/${hallId}/${tab.key}`}
                onClick={(e) => {
                  if (isTabDisabled) e.preventDefault();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : isTabDisabled
                    ? "text-slate-700 cursor-not-allowed"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                {badgeCount != null && badgeCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center border-0 bg-slate-700 text-slate-300">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Status Banner (if closing/dissolved) */}
      {hallStatus === "closing" && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-400">
            This hall is in closure protocol. Some features are restricted.
          </span>
        </div>
      )}
      {hallStatus === "dissolved" && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-zinc-500/5 border border-zinc-500/10">
          <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="text-xs text-zinc-500">
            This hall has been dissolved. Read-only access only.
          </span>
        </div>
      )}
      {hallStatus === "ghost" && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">
            Ghost Hall — Elect the Executive Cabinet to unlock full features.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Vertical Sidebar Nav (for hall pages with side layout) ───
export function HallNavSidebar({
  hallId,
  activeTab,
  badgeCounts = {},
  hallStatus = "live",
  className = "",
}: HallNavProps) {
  const isDisabled = (tab: typeof TABS[0]) => {
    if (tab.disabledStatuses?.includes(hallStatus)) return true;
    if (hallStatus === "dissolved") return true;
    return false;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {TABS.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.key;
        const isTabDisabled = isDisabled(tab);
        const badgeCount = badgeCounts[tab.key];

        return (
          <Link
            key={tab.key}
            href={isTabDisabled ? `#` : `/halls/${hallId}/${tab.key}`}
            onClick={(e) => {
              if (isTabDisabled) e.preventDefault();
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
              isActive
                ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400"
                : isTabDisabled
                ? "text-slate-700 cursor-not-allowed"
                : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <TabIcon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400"}`} />
            <span className="flex-1">{tab.label}</span>
            {badgeCount != null && badgeCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center border-0 bg-slate-700 text-slate-300">
                {badgeCount > 99 ? "99+" : badgeCount}
              </Badge>
            )}
            {isTabDisabled && <Lock className="w-3 h-3 text-slate-700" />}
            {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
          </Link>
        );
      })}
    </div>
  );
}