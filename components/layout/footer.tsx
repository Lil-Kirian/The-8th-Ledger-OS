"use client";

import Link from "next/link";
import { Gem, Globe, Eye, Shield, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#07070c]/60 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
                <Gem className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <span className="text-sm font-bold text-white/80 tracking-wide">8TH LEDGER</span>
            </div>
            <p className="text-[11px] text-white/25 leading-relaxed max-w-[220px]">
              The Perpetual Ownership Protocol. Where assets live forever, governed by sovereigns, protected by the 8th Ledger.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-wider">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Protocol */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
              Protocol
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/pools" className="text-[11px] text-white/30 hover:text-cyan-400/80 transition-colors">
                  Asset Pools
                </Link>
              </li>
              <li>
                <Link href="/halls" className="text-[11px] text-white/30 hover:text-cyan-400/80 transition-colors">
                  Sovereign Halls
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-[11px] text-white/30 hover:text-cyan-400/80 transition-colors">
                  Ownership Exchange
                </Link>
              </li>
              <li>
                <Link href="/meridian" className="text-[11px] text-white/30 hover:text-cyan-400/80 transition-colors">
                  Meridian Cycle
                </Link>
              </li>
            </ul>
          </div>

          {/* Public Square */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
              Public Square
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/agora" className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-cyan-400/80 transition-colors">
                  <Globe className="h-3 w-3" />
                  The Agora
                </Link>
              </li>
              <li>
                <Link href="/oracle" className="text-[11px] text-white/30 hover:text-cyan-400/80 transition-colors">
                  The Oracle
                </Link>
              </li>
              <li>
                <Link href="/audit" className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-cyan-400/80 transition-colors">
                  <Eye className="h-3 w-3" />
                  Public Audit
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
              8th Ledger Holdings
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-[11px] text-white/30 hover:text-white/50 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[11px] text-white/30 hover:text-white/50 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/kyc" className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors">
                  <Shield className="h-3 w-3" />
                  SIV / KYC
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-white/20 font-mono">
            © 2026 8th Ledger Holdings Ltd. Cayman Islands. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/15 font-mono">
              Protocol v3.2
            </span>
            <span className="text-[10px] text-white/15 font-mono">
              |
            </span>
            <span className="text-[10px] text-white/15 font-mono">
              Ledger Session Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}