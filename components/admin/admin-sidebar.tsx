"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Droplets,
  Briefcase,
  Landmark,
  Package,
  Scale,
  ArrowLeftRight,
  FileText,
  Settings,
  ChevronDown,
  Crown,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Globe,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  isPrimaryAdmin?: boolean;
  adminName?: string;
  ledgerId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { label: string; href: string; icon: React.ElementType; badge?: number }[];
  requiresPrimary?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Command",
    icon: Activity,
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Operations Center", href: "/admin/operations", icon: Briefcase },
      { label: "Audit Trail", href: "/admin/audit", icon: FileText },
    ],
  },
  {
    label: "Sovereigns",
    icon: Users,
    items: [
      { label: "User Registry", href: "/admin/users", icon: Users },
      { label: "KYC Review", href: "/admin/kyc", icon: ShieldCheck },
      { label: "Disputes", href: "/admin/disputes", icon: Scale },
      { label: "Withdrawals", href: "/admin/withdrawals", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Assets",
    icon: Building2,
    items: [
      { label: "Halls", href: "/admin/halls", icon: Building2 },
      { label: "Pools", href: "/admin/pools", icon: Droplets },
      { label: "Assets", href: "/admin/assets", icon: Package },
      { label: "Marketplace", href: "/admin/marketplace", icon: Globe },
    ],
  },
  {
    label: "Economy",
    icon: Landmark,
    items: [
      { label: "PIR Overview", href: "/admin/economy", icon: BarChart3 },
      { label: "Treasury", href: "/admin/treasury", icon: Landmark },
      { label: "SPV Registry", href: "/admin/spv", icon: FileText },
    ],
  },
  {
    label: "System",
    icon: Settings,
    requiresPrimary: true,
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Meridian Cycles", href: "/admin/meridian", icon: Globe },
      { label: "Oracle Control", href: "/admin/oracle", icon: Activity },
    ],
  },
];

export default function AdminSidebar({
  isPrimaryAdmin = false,
  adminName = "Admin",
  ledgerId = "LED-ADMIN-001",
  collapsed: initialCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [openGroups, setOpenGroups] = useState<string[]>(["Command", "Sovereigns"]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onToggleCollapse?.();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "h-screen sticky top-0 left-0 z-40 flex flex-col border-r border-slate-800/60 bg-[#0a0a12]",
        collapsed ? "items-center" : ""
      )}
    >
      {/* Header / Brand */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-slate-800/60", collapsed && "justify-center px-2")}>
        <div className="w-10 h-10 rounded-xl bg-[#0d1117] border border-slate-700/50 flex items-center justify-center shrink-0">
          <span className="text-lg font-black text-cyan-400">8</span>
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-w-0"
          >
            <div className="text-sm font-bold text-slate-100 tracking-tight">8th Ledger</div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Command Center
            </div>
          </motion.div>
        )}
      </div>

      {/* Admin Identity Card */}
      <div className={cn("px-4 py-4 border-b border-slate-800/40", collapsed && "px-2 py-3")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="relative shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2",
              isPrimaryAdmin
                ? "bg-amber-950/30 border-amber-500/50 text-amber-400"
                : "bg-slate-800/50 border-slate-600/50 text-slate-400"
            )}>
              {adminName.slice(0, 1).toUpperCase()}
            </div>
            {isPrimaryAdmin && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-[#0a0a12] flex items-center justify-center">
                <Crown size={8} className="text-[#0a0a12]" />
              </div>
            )}
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-200 truncate">{adminName}</span>
                {isPrimaryAdmin && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase">
                    Architect
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-600 font-mono truncate">{ledgerId}</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-3 space-y-1", collapsed ? "px-2" : "px-3")}>
        {navGroups.map((group) => {
          // Hide primary-only groups from sub-admins
          if (group.requiresPrimary && !isPrimaryAdmin) return null;

          const isOpen = openGroups.includes(group.label);
          const GroupIcon = group.icon;
          const hasActiveItem = group.items.some((item) => pathname?.startsWith(item.href));

          return (
            <div key={group.label} className="mb-2">
              {/* Group Header */}
              <button
                onClick={() => !collapsed && toggleGroup(group.label)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg transition-all",
                  collapsed ? "justify-center p-2" : "px-3 py-2",
                  hasActiveItem ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <GroupIcon size={18} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-wider flex-1 text-left">
                      {group.label}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  </>
                )}
              </button>

              {/* Group Items */}
              <AnimatePresence>
                {(isOpen || collapsed) && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l border-slate-800/50 space-y-0.5 mt-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                              isActive
                                ? "bg-cyan-950/20 text-cyan-400 border border-cyan-800/20"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
                            )}
                          >
                            <ItemIcon size={15} className={cn("shrink-0", isActive && "text-cyan-400")} />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold">
                                {item.badge}
                              </span>
                            )}
                            {isActive && (
                              <div className="w-1 h-1 rounded-full bg-cyan-400" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed: Show items as icon-only tooltip */}
              {collapsed && (
                <div className="mt-1 space-y-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center p-2.5 rounded-lg transition-all",
                          isActive
                            ? "bg-cyan-950/20 text-cyan-400 border border-cyan-800/20"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
                        )}
                        title={item.label}
                      >
                        <ItemIcon size={18} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("p-3 border-t border-slate-800/60 space-y-2", collapsed && "px-2")}>
        <button
          onClick={handleCollapse}
          className={cn(
            "w-full flex items-center gap-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/20 transition-all",
            collapsed ? "justify-center p-2" : "px-3 py-2"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>

        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/20 transition-all",
            collapsed ? "justify-center p-2" : "px-3 py-2"
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Exit to Dashboard</span>}
        </Link>
      </div>
    </motion.aside>
  );
}