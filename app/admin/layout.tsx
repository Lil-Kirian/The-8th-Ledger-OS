// app/admin/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LogOut,
  Landmark,
  Flame,
  Wallet,
  FileText,
  Eye,
  Settings,
  AlertTriangle,
  Clock,
  Hammer,
  ScrollText,
  BarChart3,
  Lock,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/* ============================================================
   ADMIN NAVIGATION
   ============================================================ */
type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  primaryOnly?: boolean;
};
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Command Center",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        badge: "CMD",
      },
      { label: "Operations", href: "/admin/operations", icon: ScrollText },
      { label: "Sovereigns", href: "/admin/users", icon: Users },
      { label: "KYC Review", href: "/admin/kyc", icon: ShieldCheck },
      { label: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
    ],
  },
  {
    title: "Empire",
    items: [
      { label: "Pools", href: "/admin/pools", icon: Flame },
      { label: "Halls", href: "/admin/halls", icon: Landmark },
      {
        label: "Economy",
        href: "/admin/economy",
        icon: BarChart3,
        primaryOnly: true,
      },
      {
        label: "Treasury",
        href: "/admin/treasury",
        icon: Wallet,
        primaryOnly: true,
      },
    ],
  },
  {
    title: "Governance",
    items: [
      { label: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
      { label: "Dormancy", href: "/admin/dormancy", icon: Clock },
      { label: "Audit Trail", href: "/admin/audit", icon: Eye },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "SPV Registry", href: "/admin/spv", icon: FileText },
      { label: "Assets", href: "/admin/assets", icon: Hammer },
    ],
  },
];

function FortressStatus({ isPrimary }: { isPrimary: boolean }) {
  const [gates, setGates] = useState<string[]>([]);
  React.useEffect(() => {
    const check = () => {
      const f: string[] = [];
      if (document.cookie.includes("ledger_session")) f.push("JWT");
      if (document.cookie.includes("adminTotpVerified")) f.push("TOTP");
      if (document.cookie.includes("adminPinVerified")) f.push("PIN");
      if (isPrimary) {
        if (document.cookie.includes("webauthnVerified")) f.push("WebAuthn");
        if (document.cookie.includes("geoVerified")) f.push("Geo");
      }
      setGates(f);
    };
    check();
    const i = setInterval(check, 30000);
    return () => clearInterval(i);
  }, [isPrimary]);

  const total = isPrimary ? 5 : 3;
  const active = gates.length;
  const allClear = active >= total;

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
          {isPrimary ? "5-Factor Fortress" : "3-Factor Fortress"}
        </span>
        <span
          className={`text-[9px] font-bold ${allClear ? "text-emerald-400" : "text-amber-400"}`}
        >
          {active}/{total}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < active ? (allClear ? "bg-emerald-500" : "bg-amber-500") : "bg-white/10"}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {gates.map((g) => (
          <span
            key={g}
            className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          >
            {g}
          </span>
        ))}
        {gates.length === 0 && (
          <span className="text-[9px] text-slate-600">
            Verifying session...
          </span>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  mobileOpen,
  setMobileOpen,
  isPrimary,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  isPrimary: boolean;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.title, true])),
  );
  const toggle = (t: string) => setExpanded((p) => ({ ...p, [t]: !p[t] }));
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

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
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/[0.06] bg-[#05050a] lg:translate-x-0 transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-amber-500/20 blur-sm" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/30">
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.15em] text-white uppercase">
              8th Ledger
            </span>
            <span className="text-[9px] font-mono text-white/30 tracking-wider">
              Admin Command
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-white/30 lg:hidden hover:text-white/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-3 mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold",
                isPrimary
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                  : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
              )}
            >
              {user?.displayName?.charAt(0).toUpperCase() || "A"}
              {isPrimary && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-amber-400 border border-[#05050a] flex items-center justify-center">
                  <Crown className="h-2.5 w-2.5 text-black" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white/90 truncate">
                {user?.displayName || "Admin"}
              </span>
              <span className="text-[10px] font-mono text-white/25 truncate">
                {user?.ledgerId || "No active session"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">
              Access Level
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                isPrimary
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
              )}
            >
              {isPrimary ? "Primary Admin" : "Admin"}
            </span>
          </div>
          <FortressStatus isPrimary={isPrimary} />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5">
          {NAV_GROUPS.map((group) => {
            const exp = expanded[group.title];
            return (
              <div key={group.title} className="mb-4">
                <button
                  onClick={() => toggle(group.title)}
                  className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 hover:text-white/40 transition-colors"
                >
                  <span>{group.title}</span>
                  <motion.div
                    animate={{ rotate: exp ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {exp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-0.5 mt-1">
                        {group.items.map((item, i) => {
                          if (item.primaryOnly && !isPrimary) return null;
                          const active = isActive(item.href);
                          const Icon = item.icon;
                          return (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                                  active
                                    ? "bg-white/[0.06] text-white shadow-[0_0_20px_rgba(245,158,11,0.04)]"
                                    : "text-white/35 hover:bg-white/[0.03] hover:text-white/70",
                                )}
                              >
                                {active && (
                                  <motion.div
                                    layoutId="admin-sidebar-active"
                                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-amber-400"
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 30,
                                    }}
                                  />
                                )}
                                <div
                                  className={cn(
                                    "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all",
                                    active
                                      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                      : "border-white/[0.05] bg-white/[0.02] text-white/25 group-hover:border-white/10",
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-[13px] flex-1 truncate">
                                  {item.label}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-amber-500/15 text-amber-400 border-amber-500/25">
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.primaryOnly && (
                                    <Lock className="h-3 w-3 text-amber-400/50" />
                                  )}
                                  {active && (
                                    <ChevronRight className="h-3 w-3 text-amber-400" />
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

        <div className="border-t border-white/[0.06] p-4 space-y-3">
          {isPrimary && (
            <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400/80 font-mono uppercase tracking-wider">
                  5-Factor Fortress Active
                </span>
              </div>
            </div>
          )}
          <Link
            href="/dashboard"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-white/30 transition-colors hover:bg-white/[0.03] hover:text-white/60"
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Exit to Dashboard
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-white/30 transition-colors hover:bg-white/[0.03] hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" /> Disconnect
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function TopHeader({
  setMobileOpen,
  isPrimary,
}: {
  setMobileOpen: (v: boolean) => void;
  isPrimary: boolean;
}) {
  const { user, isAuthenticated } = useAuth();
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const i = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#05050a]/80 px-4 backdrop-blur-2xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white/40 hover:bg-white/[0.03] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2 text-xs text-white/30 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80">
            Admin Protocol
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-[10px] font-mono text-white/20">{time}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isPrimary && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-1.5 text-[10px] font-bold text-amber-400">
            <Crown className="h-3 w-3" /> Primary Admin
          </span>
        )}
        <button className="relative rounded-lg p-2 text-white/30 hover:bg-white/[0.03] transition-colors">
          <ShieldAlert className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 border border-[#05050a]" />
        </button>
        {isAuthenticated && user && (
          <Link
            href="/me"
            className="hidden sm:flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 hover:bg-white/[0.04] transition-colors"
          >
            <div
              className={cn(
                "relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border",
                isPrimary
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                  : "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
              )}
            >
              {user.displayName?.charAt(0).toUpperCase()}
              {isPrimary && (
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border border-[#05050a] flex items-center justify-center">
                  <Crown className="h-1.5 w-1.5 text-black" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-white/80">
                {user.displayName}
              </span>
              <span className="text-[9px] font-mono text-white/20">
                {user.ledgerId}
              </span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}

/* ============================================================
   AUTH GUARD — DISABLED FOR DEVELOPMENT
   ============================================================ */
function AuthGuard({ children }: { children: React.ReactNode }) {
  // SECURITY DISABLED — remove this override to re-enable fortress
  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const isPrimary = ["architech", "scribe", "warden"].includes(user?.role || "") && user?.isPrimaryAdmin;

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#05050a] text-white selection:bg-amber-500/20 selection:text-amber-100">
        <Sidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          isPrimary={isPrimary}
        />
        <div className="flex flex-1 flex-col lg:ml-72">
          <TopHeader setMobileOpen={setMobileOpen} isPrimary={isPrimary} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
