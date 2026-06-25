"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Link2, CheckCircle2 } from "lucide-react";

interface InviteStats {
  inviteCode: string;
  inviteLink: string;
  codeUses: number;
  codeMax: number;
}

export function InviteCard({ stats }: { stats: InviteStats }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(stats.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [stats.inviteCode]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(stats.inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [stats.inviteLink]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-violet-950/30 p-6"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-[50px]" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <Share2 className="h-4 w-4 text-indigo-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">Invite & Earn</span>
        </div>
        <h2 className="font-space text-xl font-semibold text-white">Grow Your Knot</h2>
        <p className="mt-1 text-xs text-slate-400">
          Every person you invite who commits capital earns you 5% of their commitment as VIN credit.
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-500">Invite Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-indigo-300">{stats.inviteCode}</div>
            <button onClick={copyCode} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10">
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">{stats.codeUses} / {stats.codeMax} uses remaining</p>
        </div>

        <div className="mt-3">
          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-slate-500">Direct Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-400">{stats.inviteLink}</div>
            <button onClick={copyLink} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10">
              {copiedLink ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <p className="text-[10px] text-slate-500">Commit</p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-400">5%</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <p className="text-[10px] text-slate-500">Win</p>
            <p className="mt-0.5 text-xs font-semibold text-amber-400">2%</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <p className="text-[10px] text-slate-500">Forge</p>
            <p className="mt-0.5 text-xs font-semibold text-violet-400">1%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}