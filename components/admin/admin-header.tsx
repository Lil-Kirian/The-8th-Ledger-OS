"use client";

import React from "react";
import {
  Shield,
  Crown,
  Bell,
  Search,
  Menu,
  Activity,
  Lock,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  className?: string;
}

export default function AdminHeader({
  title = "8th Ledger Command",
  subtitle,
  onMenuToggle,
  className,
}: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const isPrimaryAdmin = user?.isPrimaryAdmin ?? false;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-slate-800/60 bg-[#0a0a12]/95 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: Menu + Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/30 border border-cyan-700/30 flex items-center justify-center">
                <Shield size={18} className="text-cyan-400" />
              </div>
              {isPrimaryAdmin && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Crown size={8} className="text-amber-400" />
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[10px] text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />
            <input
              type="text"
              placeholder="Search sovereigns, halls, pools..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-800/20 border border-slate-700/30 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-700/40 focus:ring-1 focus:ring-cyan-700/20 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-2">
          {/* System Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-800/20">
            <Activity size={10} className="text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              System Active
            </span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#0a0a12]" />
          </button>

          {/* Security Badge */}
          {isPrimaryAdmin && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/20 border border-amber-800/20">
              <Lock size={10} className="text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                6-Factor
              </span>
            </div>
          )}

          {/* User Dropdown Trigger */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800/60">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">
                {user?.displayName || "Admin"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {user?.ledgerId || "LED-ADMIN-001"}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-xs font-bold text-slate-400">
              {(user?.displayName?.[0] || "A").toUpperCase()}
            </div>
            <ChevronDown size={14} className="text-slate-600 hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Secondary Bar: Breadcrumbs / Context */}
      <div className="hidden lg:flex h-8 items-center px-6 border-t border-slate-800/40 bg-[#0a0a12]/80">
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <span className="text-cyan-600 font-bold">8TH LEDGER</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-500">Operations Command</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400">{title}</span>
        </div>
      </div>
    </header>
  );
}