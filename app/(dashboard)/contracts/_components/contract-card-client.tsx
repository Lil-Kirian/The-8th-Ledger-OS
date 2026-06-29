// components/contract-card-scroll.tsx
"use client";

import React from "react";
import { formatCurrency, truncateHash } from "@/lib/utils";
import {
  Shield, Zap, Crown, Clock, AlertTriangle, Download, Printer,
  QrCode, Fingerprint, Lock, Globe, ChevronRight, Ban, Stamp,
  UserCheck, EyeOff
} from "lucide-react";

/* ============================================================
   SAFE DATE FORMATTER
   ============================================================ */
function fmtDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

/* ============================================================
   PRINT BUTTON
   ============================================================ */
function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Printer className="h-3 w-3" />
      Print
    </button>
  );
}

/* ============================================================
   SCROLL CONTRACT CARD
   ============================================================ */
export function ContractCardScroll({
  receipt,
  user,
  isPreview,
}: {
  receipt: any;
  user: any;
  isPreview?: boolean;
}) {
  const isOwner = receipt.userId === user.id;
  const winnerName = receipt.pool?.winnerDisplayName || "Consensus Winner";

  const isLegacy = receipt.type === "TAC" || receipt.type === "LEGACY";
  const isPAC = receipt.type === "PAC";
  const isRevoked = receipt.status === "REVOKED";
  const isClaimed = receipt.status === "CLAIMED";
  const isConverted = receipt.status === "CONVERTED";

  const showAsPublicPAC = isPAC && !isOwner;

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    ACTIVE: { label: "Active", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock },
    REVOKED: { label: "Revoked to Protocol", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: Ban },
    CONVERTED: { label: "Converted to PAC", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: Zap },
    CLAIMED: { label: "Asset Claimed", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Crown },
    EXPIRED: { label: "Expired", color: "text-white/40", bg: "bg-white/5", border: "border-white/10", icon: AlertTriangle },
  };

  const s = statusConfig[receipt.status] || statusConfig.ACTIVE;
  const StatusIcon = s.icon;

  const glowColor = isRevoked
    ? "bg-rose-500/20"
    : isPAC
    ? "bg-emerald-500/20"
    : isConverted
    ? "bg-indigo-500/20"
    : "bg-amber-500/20";

  return (
    <div className="group relative">
      {/* Ambient glow on hover */}
      <div className={`absolute -inset-0.5 rounded-2xl opacity-0 blur transition duration-500 group-hover:opacity-100 ${glowColor}`} />

      {/* === TOP ROLLER === */}
      <div className="relative z-20 mx-8 h-6 rounded-full bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 border border-slate-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-x-10 top-1.5 h-0.5 rounded-full bg-slate-300/40" />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-slate-500 border border-slate-400 shadow-md" />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-slate-500 border border-slate-400 shadow-md" />
      </div>

      {/* === SCROLL BODY === */}
      <div className="relative -mt-3 mx-3 bg-[#0a0a12] border-x border-slate-700/30 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
        {/* Parchment texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.5) 3px, rgba(255,255,255,0.5) 4px)" }} />

        <div className="relative p-6 pt-8">
          {/* 8TH LEDGER WATERMARK */}
          <div className="pointer-events-none absolute right-4 top-20 z-0 opacity-[0.04] select-none">
            <div className="flex flex-col items-center">
              <Stamp className="h-28 w-28 text-white" strokeWidth={0.8} />
              <span className="mt-1 text-xs font-black uppercase tracking-[0.3em] text-white">8th Ledger</span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/60">Protocol Seal</span>
            </div>
          </div>

          {/* REVOKED OVERLAY */}
          {isRevoked && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="rotate-[-12deg] rounded-xl border-4 border-rose-500/30 bg-rose-500/5 px-10 py-4 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-1">
                  <Ban className="h-8 w-8 text-rose-500/40" />
                  <span className="text-2xl font-black uppercase tracking-[0.15em] text-rose-500/40">Revoked</span>
                  <span className="text-xs font-medium uppercase tracking-widest text-rose-500/30">Reverted to 8th Ledger</span>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW BADGE */}
          {isPreview && (
            <div className="absolute left-0 top-0 z-20 rounded-br-lg border-b border-r border-amber-500/20 bg-amber-500/10 px-3 py-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Demo Contract</span>
            </div>
          )}

          {/* ── HEADER ── */}
          <div className="relative border-b border-white/5 pb-5 mb-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${s.border} ${s.bg}`}>
                  <StatusIcon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.color} border ${s.border}`}>
                      {isLegacy ? "LEGACY" : receipt.type}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.color} border ${s.border}`}>
                      {showAsPublicPAC ? "Permanent PAC" : s.label}
                    </span>
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                      8th Ledger
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-white/30">{receipt.receiptId}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono text-lg font-bold text-white">
                  {formatCurrency(receipt.amountCommitted)}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/30">{receipt.currency}</p>
              </div>
            </div>

            {/* Lifecycle Progress */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full transition-all ${
                    isRevoked
                      ? "w-full bg-rose-500"
                      : isClaimed
                      ? "w-full bg-emerald-500"
                      : isConverted
                      ? "w-full bg-indigo-500"
                      : isLegacy
                      ? "w-1/2 bg-amber-500"
                      : isPAC
                      ? "w-full bg-emerald-500"
                      : "w-1/3 bg-white/20"
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/20">
                <span className={isLegacy && !isConverted && !isRevoked ? "text-amber-400" : ""}>COMMIT</span>
                <ChevronRight className="h-3 w-3" />
                <span className={isConverted || isPAC ? "text-emerald-400" : ""}>PAC</span>
                <ChevronRight className="h-3 w-3" />
                <span className={isClaimed ? "text-emerald-400" : isRevoked ? "text-rose-500" : ""}>
                  {isRevoked ? "Revoked" : isClaimed ? "Claimed" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="relative z-10 space-y-4">
            {/* PARTIES */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  {isOwner ? (
                    <UserCheck className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-white/20" />
                  )}
                  <p className="text-[10px] uppercase tracking-widest text-white/20">
                    {isOwner ? "Holder (You)" : "Holder"}
                  </p>
                </div>

                {isRevoked ? (
                  <>
                    <p className="mt-1 text-sm font-medium text-rose-400/70">8th Ledger Protocol</p>
                    <p className="text-[10px] font-mono text-white/30">Contract Reverted</p>
                  </>
                ) : showAsPublicPAC ? (
                  <>
                    <p className="mt-1 text-sm font-medium text-emerald-400">{winnerName}</p>
                    <p className="text-[10px] font-mono text-white/30">Permanent Access Owner</p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm font-medium text-white">
                      {isPAC ? "Winner / Owner" : user.displayName || "Participant"}
                    </p>
                    <p className="text-[10px] font-mono text-white/30">
                      {truncateHash(user.ledgerId, 8)}
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-widest text-white/20">Counterparty</p>
                <p className="mt-1 text-sm font-medium text-white">8th Ledger Protocol</p>
                <p className="text-[10px] font-mono text-white/30">Sovereign Asset Engine</p>
              </div>
            </div>

            {/* Asset & Pool */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Pool Reference</span>
              </div>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div className="flex justify-between sm:block">
                  <span className="text-white/30">Pool</span>
                  <span className="text-white/70">{receipt.pool?.name || "—"}</span>
                </div>
                <div className="flex justify-between sm:block">
                  <span className="text-white/30">Vertical</span>
                  <span className="text-white/70 uppercase">{receipt.pool?.verticalId || "—"}</span>
                </div>
                <div className="flex justify-between sm:block">
                  <span className="text-white/30">Asset</span>
                  <span className="text-white/70">{receipt.assetName || "Pool Asset"}</span>
                </div>
                <div className="flex justify-between sm:block">
                  <span className="text-white/30">Asset Value</span>
                  <span className="text-white/70">
                    {receipt.assetValue ? formatCurrency(receipt.assetValue) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Contract Terms</span>
              </div>
              <ul className="space-y-2 text-xs text-white/50">
                <li className="flex gap-2">
                  <span className="text-white/20 font-mono">§1</span>
                  <span>
                    This {isLegacy ? "legacy commitment" : receipt.type} certifies a commitment of {formatCurrency(receipt.amountCommitted)} to{" "}
                    <span className="text-white/70">{receipt.pool?.name}</span>.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/20 font-mono">§2</span>
                  <span>
                    {isLegacy
                      ? "Legacy commitment record. The 8th Ledger system now forges PACs directly through the Meridian Cycle. Legacy records are preserved for historical audit only."
                      : "Permanent Access Certificate (PAC) confers irrevocable ownership rights to the underlying asset."}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/20 font-mono">§3</span>
                  <span>
                    {isRevoked
                      ? `Revoked on ${fmtDate(receipt.revokedAt)}. ${receipt.returnAmount ? formatCurrency(receipt.returnAmount) + " returned to participant." : ""} Contract reverts to 8th Ledger Protocol treasury.`
                      : "If not selected by consensus, 50% of commitment is returned and this contract is revoked to the protocol treasury."}
                  </span>
                </li>
                {receipt.revokedReason && (
                  <li className="flex gap-2">
                    <span className="text-white/20 font-mono">§4</span>
                    <span className="text-rose-400/70">Revocation cause: {receipt.revokedReason}</span>
                  </li>
                )}
                {receipt.convertedFrom && (
                  <li className="flex gap-2">
                    <span className="text-white/20 font-mono">§5</span>
                    <span className="text-indigo-400/70">
                      Converted from {receipt.convertedFrom.type} {receipt.convertedFrom.receiptId}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Verification Block */}
            <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <QrCode className="h-5 w-5 text-white/30" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-3 w-3 text-white/20" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">
                    Verification Hash
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] text-white/40">
                  {receipt.termsHash || `LED-${receipt.receiptId}-SHA256-${receipt.id.slice(-12)}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-white/20">Block Time</p>
                <p className="font-mono text-[10px] text-white/40">
                  {fmtDate(receipt.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="relative z-10 mt-5 flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 text-[10px] text-white/20">
              <Shield className="h-3 w-3 text-amber-400/50" />
              <span className="text-amber-400/50">8th Ledger Protocol</span>
              <span>•</span>
              <span>Immutable Record</span>
              <span>•</span>
              <span>{receipt.pool?.poolId}</span>
            </div>
            <div className="flex items-center gap-2">
              <PrintButton />
              {(receipt.pdfUrl || isPreview) && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-white/50">
                  <Download className="h-3 w-3" />
                  PDF
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === BOTTOM ROLLER === */}
      <div className="relative z-20 -mt-3 mx-8 h-6 rounded-full bg-gradient-to-b from-slate-700 via-slate-600 to-slate-500 border border-slate-500/50 shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-x-10 bottom-1.5 h-0.5 rounded-full bg-slate-300/40" />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-slate-500 border border-slate-400 shadow-md" />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-slate-500 border border-slate-400 shadow-md" />
      </div>
    </div>
  );
}