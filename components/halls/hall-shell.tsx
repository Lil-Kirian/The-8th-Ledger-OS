"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {

  Gavel,
  Wallet,
  ShoppingCart,
  MapPin,
  Users,
  TrendingUp,
  ClipboardList,
  ShieldAlert,
  Menu,
  X,
  ChevronRight,
  Crown,
  Lock,
  Globe,
  Zap,
  Home,
  Car,
  BookOpen,
  HeartPulse,
  Wifi,
  Briefcase,
  Plane,
  Sprout,
  Sun,
  LayoutDashboard,
  FileText,
  Vault,
  Hammer,
  ScrollText,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

type HallStatus = "ghost" | "live" | "mature" | "dormant";
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

interface HallShellProps {
  hallId: string;
  hallName: string;
  vertical: Vertical;
  status: HallStatus;
  emojiSet: string[];
  children: React.ReactNode;
}

const verticalConfig: Record<
  Vertical,
  { icon: React.ElementType; color: string; label: string }
> = {
  ledgerprop: { icon: Home, color: "text-emerald-400", label: "LedgerProp" },
  ledgerauto: { icon: Car, color: "text-blue-400", label: "LedgerAuto" },
  ledgertech: { icon: Zap, color: "text-purple-400", label: "LedgerTech" },
  ledgeredu: { icon: BookOpen, color: "text-amber-400", label: "LedgerEdu" },
  ledgerhealth: { icon: HeartPulse, color: "text-rose-400", label: "LedgerHealth" },
  ledgeraccess: { icon: Wifi, color: "text-cyan-400", label: "LedgerAccess" },
  ledgerbiz: { icon: Briefcase, color: "text-orange-400", label: "LedgerBiz" },
  ledgertravel: { icon: Plane, color: "text-indigo-400", label: "LedgerTravel" },
  ledgeragri: { icon: Sprout, color: "text-green-400", label: "LedgerAgri" },
  ledgerenergy: { icon: Sun, color: "text-yellow-400", label: "LedgerEnergy" },
};

const statusConfig: Record<
  HallStatus,
  { label: string; class: string; icon: React.ElementType }
> = {
  ghost: {
    label: "Ghost Hall",
    class: "bg-slate-800 text-slate-300 border-slate-600",
    icon: Lock,
  },
  live: {
    label: "Live Hall",
    class: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    icon: Globe,
  },
  mature: {
    label: "Sovereign Chamber",
    class: "bg-amber-900/40 text-amber-300 border-amber-700",
    icon: Crown,
  },
  dormant: {
    label: "Dormant",
    class: "bg-red-900/40 text-red-300 border-red-700",
    icon: ShieldAlert,
  },
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "" },
  { id: "sovereign-stream", label: "Sovereign Stream", icon: Radio, href: "sovereign-stream" },
  { id: "cabinet", label: "Cabinet", icon: Crown, href: "cabinet" },
  { id: "governance", label: "Governance", icon: Gavel, href: "governance" },
  { id: "ledger", label: "8th Ledger", icon: ScrollText, href: "ledger" },
  { id: "vault", label: "Vault", icon: Vault, href: "vault" },
  { id: "assets", label: "Assets", icon: MapPin, href: "assets" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingCart, href: "marketplace" },
  { id: "forge", label: "Forge", icon: Hammer, href: "forge" },
  { id: "treasury", label: "Treasury", icon: Wallet, href: "treasury" },
  { id: "members", label: "Members", icon: Users, href: "members" },
  { id: "dividends", label: "Dividends", icon: TrendingUp, href: "dividends" },
  { id: "operations", label: "Operations", icon: ClipboardList, href: "operations" },
];

export default function HallShell({
  hallId,
  hallName,
  vertical,
  status,
  emojiSet,
  children,
}: HallShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const VerticalIcon = verticalConfig[vertical].icon;
  const StatusIcon = statusConfig[status].icon;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (!href) return pathname === `/halls/${hallId}` || pathname === `/halls/${hallId}/`;
    return pathname?.includes(`/halls/${hallId}/${href}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-slate-100 relative overflow-x-hidden">
      {/* Watermark overlay — tamper deterrent */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] select-none flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-[20vw] font-black tracking-tighter rotate-[-12deg] text-white">
          8TH
        </span>
      </div>

      {/* Top Navigation Bar */}
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-slate-800/60 backdrop-blur-md transition-all",
          scrolled ? "bg-[#0a0a14]/90" : "bg-[#0a0a14]/70"
        )}
      >
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Hall Identity */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/80 border border-slate-700",
                  verticalConfig[vertical].color
                )}
              >
                <VerticalIcon size={20} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold leading-tight tracking-tight">
                  {hallName}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className={verticalConfig[vertical].color}>
                    {verticalConfig[vertical].label}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">#{hallId.slice(-6)}</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                statusConfig[status].class
              )}
            >
              <StatusIcon size={12} />
              {statusConfig[status].label}
            </div>
          </div>

          {/* Center: Emoji Set */}
          <div className="hidden md:flex items-center gap-1">
            {emojiSet.map((emoji, i) => (
              <span
                key={i}
                className="w-8 h-8 flex items-center justify-center text-lg bg-slate-800/50 rounded-lg border border-slate-700/50"
                title={`Custom emoji ${i + 1}`}
              >
                {emoji}
              </span>
            ))}
          </div>

          {/* Right: Mobile Panel Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800/60 transition-colors relative"
            onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
          >
            <FileText size={20} />
            {mobilePanelOpen && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto flex">
        {/* Left Sidebar Navigation */}
        <aside
          className={cn(
            "fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-[#0a0a14] border-r border-slate-800/60 overflow-y-auto transition-transform duration-300 lg:translate-x-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const href = item.href ? `/halls/${hallId}/${item.href}` : `/halls/${hallId}`;
              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    active
                      ? "bg-slate-800/80 text-white border border-slate-700"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  <item.icon
                    size={18}
                    className={cn(
                      "transition-colors",
                      active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight size={14} className="text-emerald-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Hall Footer Info */}
          <div className="mt-auto p-4 border-t border-slate-800/60">
            <div className="text-xs text-slate-500 space-y-1">
              <p>Hall ID: <span className="font-mono text-slate-400">{hallId}</span></p>
              <p>Status: <span className="text-slate-400">{statusConfig[status].label}</span></p>
              <p className="pt-1 text-[10px] text-slate-600 uppercase tracking-wider">
                8th Ledger Protocol
              </p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile menu */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">{children}</main>

        {/* Right Panel Drawer (Desktop: visible, Mobile: slide-over) */}
        <aside
          className={cn(
            "fixed lg:sticky top-16 right-0 z-30 w-80 h-[calc(100vh-4rem)] bg-[#0d0d1a] border-l border-slate-800/60 flex flex-col transition-transform duration-300",
            mobilePanelOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800/60">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" />
              Document Vault
            </h3>
            <button
              className="lg:hidden p-1.5 rounded hover:bg-slate-800/60"
              onClick={() => setMobilePanelOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            <div className="text-center space-y-2">
              <Vault size={32} className="mx-auto opacity-30" />
              <p>Vault loads in sub-page</p>
              <p className="text-xs text-slate-700">Immutable & encrypted</p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile panel */}
        {mobilePanelOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setMobilePanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}