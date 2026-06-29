// app/(dashboard)/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Flame, Users, User,
  Shield, Grid3X3, Menu, X, ChevronRight, Hexagon,
  Bell, Search, LogOut, Eye, Crown, Settings,
  Radio, FileText, Wallet, Trophy,
  Scroll, Store, Coins, BadgeCheck,
  Landmark, ChevronDown, Globe, Target,
  BookOpen, Sparkles, Library
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ============================================================
   FEATURE FLAGS
   ============================================================ */
const FEATURES = {
  dashboard:    true,
  halls:        true,
  pools:        true,
  marketplace:  true,
  verticals:    true,
  meridian:     true,
  dividends:    true,
  vault:        true,
  wallet:       true,
  exchange:     true,
  kyc:          true,
  forge:        true,
  knot:         true,
  leaderboards: true,
  oracle:       true,
  agora:        true,
  contracts:    true,
  audit:        true,
  codex:        true,
  profile:      true,
  settings:     true,
  privacy:      true,
  terms:        true,
  primaryAdmin: true,
};

/* ============================================================
   NAVIGATION STRUCTURE
   ============================================================ */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  feature: keyof typeof FEATURES;
  section: "sacred" | "assets" | "capital" | "identity" | "records" | "account";
  matchPrefix?: string;
  special?: "codex" | null;
}

const NAV_ITEMS: NavItem[] = [
  /*  THE SACRED RECORD — System Knowledge  */
  {
    label: "The Octachronicle",
    href: "/the-octachronicle",
    icon: Library,
    feature: "codex",
    section: "sacred",
    matchPrefix: "/the-octachronicle",
    badge: "CODEX",
    special: "codex",
  },
  {
    label: "The Codex",
    href: "/codex",
    icon: BookOpen,
    feature: "codex",
    section: "sacred",
    matchPrefix: "/codex",
    badge: "GUIDE",
  },

  /*  SOVEREIGN ASSETS  */
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    feature: "dashboard",
    section: "assets",
    matchPrefix: "/dashboard",
  },
  {
    label: "My Halls",
    href: "/halls",
    icon: Radio,
    feature: "halls",
    section: "assets",
    matchPrefix: "/halls",
  },
  {
    label: "Pools",
    href: "/pools",
    icon: Grid3X3,
    feature: "pools",
    section: "assets",
    matchPrefix: "/pools",
    badge: "Live",
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    icon: Store,
    feature: "marketplace",
    section: "assets",
    matchPrefix: "/marketplace",
  },
  {
    label: "Verticals",
    href: "/verticals",
    icon: Hexagon,
    feature: "verticals",
    section: "assets",
    matchPrefix: "/verticals",
  },
  {
    label: "Meridian",
    href: "/meridian",
    icon: Globe,
    feature: "meridian",
    section: "assets",
    matchPrefix: "/meridian",
    badge: "Cycle",
  },

  /*  CAPITAL  */
  {
    label: "Dividends",
    href: "/dividends",
    icon: Coins,
    feature: "dividends",
    section: "capital",
    matchPrefix: "/dividends",
  },
  {
    label: "Vault",
    href: "/vault",
    icon: Shield,
    feature: "vault",
    section: "capital",
    matchPrefix: "/vault",
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: Wallet,
    feature: "wallet",
    section: "capital",
    matchPrefix: "/wallet",
  },
  {
    label: "LED Protocol",
    href: "/led-protocol",
    icon: Hexagon,
    feature: "exchange",
    section: "capital",
    matchPrefix: "/led-protocol",
  },

  /*  IDENTITY & POWER  */
  {
    label: "SIV / KYC",
    href: "/kyc",
    icon: BadgeCheck,
    feature: "kyc",
    section: "identity",
    matchPrefix: "/kyc",
  },
  {
    label: "Forge",
    href: "/forge",
    icon: Flame,
    feature: "forge",
    section: "identity",
    matchPrefix: "/forge",
  },
  {
    label: "Knot",
    href: "/knot",
    icon: Users,
    feature: "knot",
    section: "identity",
    matchPrefix: "/knot",
  },
  {
    label: "Leaderboards",
    href: "/leaderboards",
    icon: Trophy,
    feature: "leaderboards",
    section: "identity",
    matchPrefix: "/leaderboards",
  },
  {
    label: "Oracle",
    href: "/oracle",
    icon: Target,
    feature: "oracle",
    section: "identity",
    matchPrefix: "/oracle",
  },
  {
    label: "Agora",
    href: "/agora",
    icon: Globe,
    feature: "agora",
    section: "identity",
    matchPrefix: "/agora",
  },

  /*  RECORDS  */
  {
    label: "Contracts",
    href: "/contracts",
    icon: FileText,
    feature: "contracts",
    section: "records",
    matchPrefix: "/contracts",
  },
  {
    label: "Audit",
    href: "/audit",
    icon: Eye,
    feature: "audit",
    section: "records",
    matchPrefix: "/audit",
  },

  /*  ACCOUNT  */
  {
    label: "Profile",
    href: "/me",
    icon: User,
    feature: "profile",
    section: "account",
    matchPrefix: "/me",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    feature: "settings",
    section: "account",
    matchPrefix: "/settings",
  },
];

/*  LEGAL FOOTER LINKS  */
const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy", icon: Shield },
  { label: "Terms", href: "/terms", icon: BookOpen },
];

/*  SECTION METADATA  */
const SECTION_META: Record<string, { name: string; icon: React.ElementType; color: string }> = {
  sacred:   { name: "The Sacred Record", icon: Scroll,   color: "text-amber-400" },
  assets:   { name: "Sovereign Assets",  icon: Landmark, color: "text-cyan-400" },
  capital:  { name: "Capital",           icon: Coins,    color: "text-amber-400" },
  identity: { name: "Identity & Power",  icon: Shield,   color: "text-violet-400" },
  records:  { name: "Records",           icon: Scroll,   color: "text-emerald-400" },
  account:  { name: "Account",           icon: User,     color: "text-slate-400" },
};

/*  KYC TIER CONFIG  */
const KYC_TIER_NAMES: Record<string, string> = {
  visitor:   "Visitor",
  sovereign: "Sovereign",
  verified:  "Verified",
  whale:     "Whale",
};

const KYC_TIER_COLORS: Record<string, string> = {
  visitor:   "from-slate-500/20 to-slate-600/10 border-slate-500/20 text-slate-400",
  sovereign: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400",
  verified:  "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400",
  whale:     "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400",
};

const KYC_TIER_ORDER = ["visitor", "sovereign", "verified", "whale"];

/* ============================================================
   LIVE BLOCK HASH
   ============================================================ */
function BlockHash() {
  const [hash, setHash] = useState("------");
  useEffect(() => {
    const generate = () => Date.now().toString(36).toUpperCase().slice(-6);
    setHash(generate());
    const i = setInterval(() => setHash(generate()), 5000);
    return () => clearInterval(i);
  }, []);
  return <span className="font-mono text-[10px] text-cyan-300/60">Block {hash}</span>;
}

/* ============================================================
   COLLAPSIBLE SECTION
   ============================================================ */
function NavSection({
  sectionKey,
  items,
  pathname,
  onNavigate,
}: {
  sectionKey: string;
  items: NavItem[];
  pathname: string | null;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = SECTION_META[sectionKey];
  const Icon = meta.icon;

  const hasActive = items.some((item) => {
    const prefix = item.matchPrefix || item.href;
    return pathname === item.href || pathname?.startsWith(`${prefix}/`) || pathname === prefix;
  });

  useEffect(() => {
    if (hasActive) setExpanded(true);
  }, [hasActive]);

  if (items.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
          hasActive ? "text-white/40" : "text-white/20 hover:text-white/35"
        }`}
      >
        <Icon className={`h-3 w-3 ${meta.color}`} />
        <span className="flex-1 text-left">{meta.name}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pt-0.5">
              {items.map((item) => {
                const prefix = item.matchPrefix || item.href;
                const isActive = pathname === item.href || pathname?.startsWith(`${prefix}/`) || pathname === prefix;
                const isLocked = !FEATURES[item.feature];
                const isSpecial = item.special === "codex";
                const ItemIcon = item.icon;

                /* ── Special: The Octachronicle ── */
                if (isSpecial) {
                  return (
                    <Link
                      key={item.href}
                      href={isLocked ? "#" : item.href}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                        else onNavigate();
                      }}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition-all ${
                        isActive
                          ? "bg-amber-500/[0.08] text-amber-100 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                          : isLocked
                          ? "text-white/15 cursor-not-allowed"
                          : "text-amber-200/40 hover:bg-amber-500/[0.05] hover:text-amber-200/70 border border-transparent hover:border-amber-500/10"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-codex-glow"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/5 to-transparent"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-codex-active"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-amber-400"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      <ItemIcon
                        className={`h-[15px] w-[15px] transition-colors relative z-10 ${
                          isActive ? "text-amber-400" : "text-amber-500/30 group-hover:text-amber-400/60"
                        }`}
                      />
                      <span className="flex-1 relative z-10 tracking-wide">{item.label}</span>

                      {item.badge && (
                        <span
                          className={`relative z-10 rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${
                            isActive
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-amber-500/10 text-amber-400/70 border-amber-500/15"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isActive && (
                        <Sparkles className="h-3 w-3 text-amber-400/50 relative z-10" />
                      )}
                    </Link>
                  );
                }

                /* ── Standard Item ── */
                return (
                  <Link
                    key={item.href}
                    href={isLocked ? "#" : item.href}
                    onClick={(e) => {
                      if (isLocked) e.preventDefault();
                      else onNavigate();
                    }}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : isLocked
                        ? "text-white/15 cursor-not-allowed"
                        : "text-white/35 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-glow"
                        className="absolute inset-0 rounded-lg bg-cyan-500/5 border border-cyan-500/10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan-400"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <ItemIcon
                      className={`h-[15px] w-[15px] transition-colors relative z-10 ${
                        isActive
                          ? "text-cyan-400"
                          : isLocked
                          ? "text-white/10"
                          : "text-white/20 group-hover:text-white/40"
                      }`}
                    />
                    <span className="flex-1 relative z-10">{item.label}</span>

                    {item.badge && (
                      <span
                        className={`relative z-10 rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${
                          isLocked
                            ? "bg-white/[0.02] text-white/15 border-white/[0.04]"
                            : typeof item.badge === "number"
                            ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/20"
                            : item.badge === "Live"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/20"
                        }`}
                      >
                        {isLocked ? "🔒" : item.badge}
                      </span>
                    )}

                    {isActive && (
                      <ChevronRight className="h-3 w-3 text-cyan-400/60 relative z-10" />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SIDEBAR — STICKY / FIXED
   ============================================================ */
function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const sections = {
    sacred:   NAV_ITEMS.filter((n) => n.section === "sacred"   && FEATURES[n.feature]),
    assets:   NAV_ITEMS.filter((n) => n.section === "assets"   && FEATURES[n.feature]),
    capital:  NAV_ITEMS.filter((n) => n.section === "capital"  && FEATURES[n.feature]),
    identity: NAV_ITEMS.filter((n) => n.section === "identity" && FEATURES[n.feature]),
    records:  NAV_ITEMS.filter((n) => n.section === "records"  && FEATURES[n.feature]),
    account:  NAV_ITEMS.filter((n) => n.section === "account"  && FEATURES[n.feature]),
  };

  if (!isAuthenticated || !user) return null;

  const kycTier = user.kycTier || "visitor";
  const tierName = KYC_TIER_NAMES[kycTier] || "Visitor";
  const tierColor = KYC_TIER_COLORS[kycTier] || KYC_TIER_COLORS["visitor"];
  const tierIndex = KYC_TIER_ORDER.indexOf(kycTier);
  const tierDisplayNum = tierIndex >= 0 ? tierIndex + 1 : 1;
  const isPrimaryAdmin = user.isPrimaryAdmin;

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-white/[0.04] bg-[#08080f] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-out`}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-4 flex-shrink-0">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-lg shadow-cyan-500/15">
            <span className="text-sm font-bold text-white">8</span>
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white">8th Ledger</span>
            <span className="text-[9px] text-white/25 tracking-wide">8th Ledger Protocol</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-white/20 hover:text-white/60 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Sovereign Identity Card ── */}
        <div className="mx-3 mt-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 relative overflow-hidden flex-shrink-0">
          <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tierColor.split(" ")[0]} to-transparent opacity-20 blur-2xl`} />

          <div className="relative">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${tierColor} border`}>
                  <span className="text-[10px] font-bold">{tierDisplayNum}</span>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-cyan-300/90">{user.ledgerId}</p>
                </div>
              </div>
              {isPrimaryAdmin && (
                <div className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5">
                  <Crown className="h-2.5 w-2.5 text-amber-400" />
                  <span className="text-[8px] font-bold text-amber-300 uppercase tracking-wider">Architect</span>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold">Trust Score</p>
                <p className={`text-lg font-bold mt-0.5 ${tierColor.split(" ").pop()}`}>{user.trustScore || 0}</p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[9px] font-medium border ${tierColor}`}>
                {tierName}
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[9px] text-white/20 mb-1">
                <span>Sovereignty</span>
                <span>{Math.min(Math.round(((user.trustScore || 0) / 1000) * 100), 100)}%</span>
              </div>
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((user.trustScore || 0) / 1000) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-300 to-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.06] min-h-0">
          <NavSection sectionKey="sacred"   items={sections.sacred}   pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection sectionKey="assets"   items={sections.assets}   pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection sectionKey="capital"  items={sections.capital}  pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection sectionKey="identity" items={sections.identity} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection sectionKey="records"  items={sections.records}  pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavSection sectionKey="account"  items={sections.account}  pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>

        {/* ── Balances & Footer ── */}
        <div className="border-t border-white/[0.04] p-3 flex-shrink-0">
          <div className="mb-3">
            <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-2">
                <Coins className="h-3.5 w-3.5 text-amber-400/80" />
                <span className="text-[11px] font-medium text-white/60">LED</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-amber-300/90">
                {(user.ledgerBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Architect Override */}
          {isPrimaryAdmin && (
            <Link href="/architect">
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/10 bg-amber-500/[0.03] px-3 py-2 cursor-pointer hover:bg-amber-500/[0.06] transition-colors group">
                <Crown className="h-3.5 w-3.5 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                <span className="text-[10px] text-amber-400/60 group-hover:text-amber-300 transition-colors font-medium">
                  Architect Override
                </span>
                <ChevronRight className="h-3 w-3 text-amber-400/40 ml-auto" />
              </div>
            </Link>
          )}

          {/* Legal Links */}
          <div className="flex items-center gap-3 mb-3 px-1">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[9px] text-white/15 hover:text-white/40 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-white/25 transition-all hover:bg-white/[0.04] hover:text-rose-400/80"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sever Connection
          </button>
        </div>
      </motion.aside>
    </>
  );
}

/* ============================================================
   TOP HEADER
   ============================================================ */
function TopHeader({ setMobileOpen }: { setMobileOpen: (v: boolean) => void }) {
  const { user, isAuthenticated } = useAuth();
  const isPrimaryAdmin = user?.isPrimaryAdmin;

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-white/[0.04] bg-[#08080f]/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2.5 text-[11px] text-white/25 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Protocol Live
          <span className="h-3 w-px bg-white/[0.08]" />
          <BlockHash />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5 sm:flex">
          <Search className="h-3.5 w-3.5 text-white/20" />
          <input
            type="text"
            placeholder="Search pools, IDs, assets..."
            className="w-44 bg-transparent text-[11px] text-white/60 placeholder-white/15 outline-none"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
        </button>

        {/* User Avatar */}
        {isAuthenticated && user && (
          <Link href="/me">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 ring-1 ring-white/[0.08] hover:ring-cyan-500/30 transition-all cursor-pointer relative ${isPrimaryAdmin ? "ring-amber-500/30" : ""}`}>
              <span className="text-xs font-bold text-cyan-300/90">
                {user.displayName?.charAt(0).toUpperCase() ?? "?"}
              </span>
              {isPrimaryAdmin && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-500 border border-[#08080f] flex items-center justify-center">
                  <Crown className="h-2 w-2 text-[#08080f]" />
                </div>
              )}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}

/* ============================================================
   LAYOUT EXPORT
   ============================================================ */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#08080f] text-white selection:bg-cyan-500/20 selection:text-cyan-100">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex flex-1 flex-col lg:ml-[270px]">
        <TopHeader setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}