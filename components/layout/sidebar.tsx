"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

import {
  LayoutDashboard,
  Landmark,
  Layers,
  Gem,
  Package,
  Banknote,
  Shield,
  Wallet,
  ArrowLeftRight,
  Flame,
  Network,
  Trophy,
  Sparkles,
  FileCheck,
  UserCircle,
  Settings,
  Eye,
  ChevronDown,
  Crown,
  Activity,
  ScanFace,
  Globe,
  Timer,
  Archive,
} from "lucide-react";

/* ============================================================
   NAVIGATION GROUPS — 8th Ledger Protocol
   ============================================================ */
type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  desc?: string;
  badge?: string;
  soon?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Sovereign Assets",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Command Center" },
      { href: "/halls", label: "My Halls", icon: Landmark, desc: "Parliaments", badge: "LIVE" },
      { href: "/pools", label: "Pools", icon: Layers, desc: "11 Verticals" },
      { href: "/marketplace/ownership", label: "Ownership", icon: Gem, desc: "PAC Trading" },
      { href: "/marketplace/inventory", label: "Inventory", icon: Package, desc: "Product Sales" },
      { href: "/meridian", label: "Meridian", icon: Timer, desc: "Cycle Rotation" },
    ],
  },
  {
    title: "Capital",
    items: [
      { href: "/dividends", label: "Dividends", icon: Banknote, desc: "Revenue Share" },
      { href: "/vault", label: "Vault", icon: Shield, desc: "PAC Portfolio" },
      { href: "/wallet", label: "Wallet", icon: Wallet, desc: "Deposits & Withdrawals" },
      { href: "/exchange", label: "Exchange", icon: ArrowLeftRight, desc: "Trade LED" },
    ],
  },
  {
    title: "Identity & Power",
    items: [
      { href: "/kyc", label: "SIV / KYC", icon: ScanFace, desc: "Tier Verification" },
      { href: "/forge", label: "Forge", icon: Flame, desc: "Burn & Rise" },
      { href: "/knot", label: "Knot", icon: Network, desc: "Referral Network" },
      { href: "/leaderboards", label: "Leaderboards", icon: Trophy, desc: "Top Sovereigns" },
      { href: "/oracle", label: "Oracle", icon: Sparkles, desc: "Standing & Foresight" },
    ],
  },
  {
    title: "Records",
    items: [
      { href: "/halls", label: "Hall Records", icon: Archive, desc: "Execution History" },
      { href: "/contracts", label: "Contracts", icon: FileCheck, desc: "PAC Certificates" },
      { href: "/audit", label: "Audit", icon: Eye, desc: "Public Ledger" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/me", label: "Profile", icon: UserCircle, desc: "Public Identity" },
      { href: "/settings", label: "Settings", icon: Settings, desc: "Security & Privacy" },
    ],
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(NAV_GROUPS.map((g) => [g.title, true]))
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-72 flex-col border-r border-white/[0.06] bg-[#07070c]/80 backdrop-blur-2xl lg:flex">
      {/* Brand Strip */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20">
          <Gem className="h-4 w-4 text-cyan-400" />
          <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#07070c]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white tracking-wide">8TH LEDGER</span>
          <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Protocol</span>
        </div>
      </div>

      {/* Scrollable Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5">
        {NAV_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.title];
          const hasActiveChild = group.items.some((item) => isActive(item.href));

          return (
            <div key={group.title} className="mb-2">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 hover:text-white/40 transition-colors"
              >
                <span>{group.title}</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-0.5 mt-1">
                      {group.items.map((item, i) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;

                        return (
                          <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Link
                              href={item.href}
                              className={cn(
                                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                                active
                                  ? "bg-white/[0.06] text-white shadow-[0_0_20px_rgba(34,211,238,0.06)]"
                                  : "text-white/35 hover:bg-white/[0.03] hover:text-white/70"
                              )}
                            >
                              {/* Active Glow Background */}
                              {active && (
                                <motion.div
                                  layoutId="sidebar-glow"
                                  className="absolute inset-0 rounded-xl border border-cyan-500/15 bg-gradient-to-r from-cyan-500/5 to-transparent"
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                              )}

                              {/* Icon */}
                              <div
                                className={cn(
                                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                                  active
                                    ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                                    : "border-white/[0.06] bg-white/[0.02] text-white/25 group-hover:border-white/10 group-hover:text-white/50"
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>

                              {/* Text */}
                              <div className="relative flex flex-col min-w-0">
                                <span className="font-medium truncate text-[13px]">{item.label}</span>
                                {item.desc && (
                                  <span className="text-[10px] text-white/20 font-mono truncate">
                                    {item.desc}
                                  </span>
                                )}
                              </div>

                              {/* Right Side Indicators */}
                              <div className="relative ml-auto flex items-center gap-1.5 shrink-0">
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    {item.badge}
                                  </span>
                                )}
                                {active && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Sovereign Card */}
      {isAuthenticated && user && (
        <div className="border-t border-white/[0.06] p-4 space-y-3">
          {/* Identity Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-sm font-bold">
              {user.displayName?.charAt(0).toUpperCase()}
              {user.role === "admin" && user.isPrimaryAdmin && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border border-[#07070c] flex items-center justify-center">
                  <Crown className="h-2 w-2 text-black" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white/90 truncate">
                {user.displayName}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-white/30 truncate">
                  {user.ledgerId}
                </span>
                <span
                  className={cn(
                    "px-1 py-0.5 rounded text-[8px] font-bold uppercase border",
                    user.kycTier === "whale"
                      ? "bg-violet-500/15 text-violet-400 border-violet-500/25"
                      : user.kycTier === "verified"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                      : user.kycTier === "sovereign"
                      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/25"
                      : "bg-white/5 text-white/30 border-white/10"
                  )}
                >
                  {user.kycTier || "visitor"}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Strip */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3 w-3 text-amber-400" />
                <span className="text-[9px] text-white/30 uppercase tracking-wider">LED</span>
              </div>
              <span className="text-xs font-mono text-amber-300 font-semibold">
                {user.ledgerBalance?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] text-white/30 uppercase tracking-wider">Pools</span>
              </div>
              <span className="text-xs font-mono text-emerald-300 font-semibold">
                {user.totalCommitted?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Primary Admin Hint (only for primary admin, subtle) */}
          {user.role === "admin" && user.isPrimaryAdmin && (
            <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <Crown className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400/80 font-mono">
                  Primary Admin Override Active
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Status */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/10 bg-emerald-950/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80">
              Protocol Online
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/20">
            11 Verticals
          </span>
        </div>
      </div>
    </aside>
  );
}