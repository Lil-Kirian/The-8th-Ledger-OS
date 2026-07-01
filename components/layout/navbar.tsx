"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  Flame,
  Gem,
  Crown,
  ScanFace,
  Landmark,
  Store,
  Banknote,
  Wallet,
  ArrowLeftRight,
  Network,
  Trophy,
  FileCheck,
  Eye,
  UserCircle,
  Settings,
  Layers,
  Globe,
  Sparkles,
  Timer,
  Archive,
  Package,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

/* ============================================================
   NAV LINKS — 8th Ledger Protocol
   ============================================================ */
type NavLink = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  mobileOnly?: boolean;
  external?: boolean;
};

const DESKTOP_LINKS: NavLink[] = [
  { label: "Exchange", href: "/exchange", icon: ArrowLeftRight },
  { label: "Pools", href: "/pools", icon: Layers, badge: "11" },
  { label: "Halls", href: "/halls", icon: Landmark, badge: "LIVE" },
  { label: "Dividends", href: "/dividends", icon: Banknote },
  { label: "Vault", href: "/vault", icon: Shield },
];

const MARKETPLACE_LINKS: NavLink[] = [
  { label: "Ownership", href: "/marketplace/ownership", icon: Gem },
  { label: "Inventory", href: "/marketplace/inventory", icon: Package },
];

const DROPDOWN_LINKS: NavLink[] = [
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Forge", href: "/forge", icon: Flame },
  { label: "Knot", href: "/knot", icon: Network },
  { label: "Oracle", href: "/oracle", icon: Sparkles },
  { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
  { label: "KYC / SIV", href: "/kyc", icon: ScanFace },
  { label: "Hall Records", href: "/halls", icon: Archive },
  { label: "Contracts", href: "/contracts", icon: FileCheck },
  { label: "Audit", href: "/audit", icon: Eye },
  { label: "Agora", href: "/agora", icon: Globe, external: true },
  { label: "Meridian", href: "/meridian", icon: Timer },
];

const MOBILE_EXTRA: NavLink[] = [
  { label: "Profile", href: "/me", icon: UserCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  const closeAll = () => {
    setMarketplaceOpen(false);
    setMoreOpen(false);
    setProfileOpen(false);
  };

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.06] bg-[#07070c]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-center px-4">
          <div className="h-4 w-4 animate-pulse rounded-full bg-cyan-500/30" />
        </div>
      </header>
    );
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.06] bg-[#07070c]/80 backdrop-blur-2xl"
    >
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" onClick={closeAll}>
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-cyan-500/20 blur-sm group-hover:bg-cyan-500/30 transition-all" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/30">
              <Gem className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.15em] text-white/90 uppercase">
              8th Ledger
            </span>
            <span className="text-[10px] tracking-widest text-cyan-500/60 uppercase font-mono">
              Protocol
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {DESKTOP_LINKS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAll}
                className={cn(
                  "group relative px-3.5 py-2 text-sm transition-all duration-200 rounded-lg",
                  active
                    ? "text-white bg-white/[0.06]"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-cyan-400" : "text-white/30 group-hover:text-white/50")} />
                  {item.label}
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-1 px-1 py-0.5 rounded text-[9px] font-bold border",
                        item.badge === "LIVE"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                          : "bg-cyan-500/15 text-cyan-400 border-cyan-500/25"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-px bg-cyan-500/50"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Marketplace Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setMarketplaceOpen(!marketplaceOpen);
                setMoreOpen(false);
                setProfileOpen(false);
              }}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all",
                marketplaceOpen || isActive("/marketplace")
                  ? "text-white bg-white/[0.06]"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
              )}
            >
              <Store className="h-3.5 w-3.5 mr-1" />
              <span>Marketplace</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  marketplaceOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {marketplaceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-white/[0.08] bg-[#0f0f1a] p-2 shadow-2xl shadow-black/60 z-50"
                >
                  <div className="grid gap-0.5">
                    {MARKETPLACE_LINKS.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAll}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-cyan-500/10 text-cyan-400"
                              : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* More Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setMoreOpen(!moreOpen);
                setMarketplaceOpen(false);
                setProfileOpen(false);
              }}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all",
                moreOpen
                  ? "text-white bg-white/[0.06]"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
              )}
            >
              <span>More</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  moreOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#0f0f1a] p-2 shadow-2xl shadow-black/60 z-50"
                >
                  <div className="grid gap-0.5">
                    {DROPDOWN_LINKS.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAll}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-cyan-500/10 text-cyan-400"
                              : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                          {item.external && (
                            <span className="ml-auto text-[9px] text-white/20 uppercase">Public</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="hidden lg:flex items-center gap-3">
              {/* LED Balance */}
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/15 bg-amber-950/15 px-3 py-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-mono font-semibold text-amber-300">
                  {user.ledgerBalance?.toLocaleString() || 0}
                </span>
                <span className="text-[9px] text-amber-500/40 uppercase">LED</span>
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setMarketplaceOpen(false);
                    setMoreOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm transition-all hover:bg-white/[0.06] hover:border-white/10"
                >
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                    {user.displayName?.charAt(0).toUpperCase()}
                    {["architech", "scribe", "warden"].includes(user.role || "") && user.isPrimaryAdmin && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border border-[#07070c] flex items-center justify-center">
                        <Crown className="h-2 w-2 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium text-white/80">{user.displayName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-white/25">
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
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-white/30 transition-transform",
                      profileOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/[0.08] bg-[#0f0f1a] p-2 shadow-2xl shadow-black/60 z-50"
                    >
                      {/* Balances */}
                      <div className="grid grid-cols-2 gap-2 px-3 py-2 mb-1 border-b border-white/[0.06]">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/25 uppercase tracking-wider">LED</span>
                          <span className="text-sm font-mono text-amber-300 font-semibold">
                            {user.ledgerBalance?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/25 uppercase tracking-wider">Pools</span>
                          <span className="text-sm font-mono text-emerald-300 font-semibold">
                            {user.totalCommitted?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>

                      {/* Tier Progress */}
                      <div className="px-3 py-2 mb-1 border-b border-white/[0.06]">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-cyan-400" />
                            <span className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-medium">
                              Tier {user.tier || 1}
                            </span>
                          </div>
                          <span className="text-[9px] text-white/20 font-mono">
                            {user.trustScore || 0}/100
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full bg-cyan-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(user.trustScore || 0, 100)}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                      </div>

                      {/* Quick Links */}
                      <div className="grid gap-0.5">
                        <Link
                          href="/me"
                          onClick={closeAll}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/[0.03] hover:text-white/80"
                        >
                          <UserCircle className="h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={closeAll}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/[0.03] hover:text-white/80"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="my-1 border-t border-white/[0.06]" />

                      <button
                        onClick={async () => {
                          closeAll();
                          await logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <Link
              href="/enter"
              className="hidden lg:flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/50"
            >
              <Zap className="h-4 w-4" />
              Enter the Ledger
            </Link>
          )}

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-white/60 hover:bg-white/[0.03]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden border-t border-white/[0.06] bg-[#07070c]/95 backdrop-blur-2xl overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-0.5 max-h-[70vh] overflow-y-auto">
              {/* Main Links */}
              {[...DESKTOP_LINKS, ...MARKETPLACE_LINKS, ...DROPDOWN_LINKS, ...MOBILE_EXTRA].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                      active
                        ? "bg-white/[0.06] text-white border border-white/[0.08]"
                        : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-cyan-400" : "text-white/30")} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {item.badge}
                      </span>
                    )}
                    {item.external && (
                      <span className="ml-auto text-[9px] text-white/20 uppercase">Public</span>
                    )}
                  </Link>
                );
              })}

              {isAuthenticated && user && (
                <div className="mt-3 border-t border-white/[0.06] pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                      <span className="text-[9px] text-white/25 uppercase">LED</span>
                      <span className="text-sm font-mono text-amber-300">{user.ledgerBalance?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex flex-col rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                      <span className="text-[9px] text-white/25 uppercase">Pools</span>
                      <span className="text-sm font-mono text-emerald-300">{user.totalCommitted?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setMobileOpen(false);
                      await logout();
                    }}
                    className="w-full rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-center font-medium text-rose-400"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <Link
                  href="/enter"
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-4 py-3 text-sm text-center font-medium text-cyan-400"
                >
                  Enter the Ledger
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
