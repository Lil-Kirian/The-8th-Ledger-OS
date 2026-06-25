// components/marketplace/escrow-48h.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Hash,
  FileCheck,
  Loader2,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EscrowType = "ownership" | "inventory";

export type EscrowStatus = "pending" | "active" | "completed" | "cancelled" | "refunded";

export interface Escrow48hData {
  id: string;
  type: EscrowType;
  listingId: string;
  buyerId: string;
  sellerId: string;
  buyerLedgerId: string;
  sellerLedgerId: string;
  buyerKycTier: string;
  sellerKycTier: string;
  amount: number; // in cents
  fee: number; // in cents
  total: number; // in cents
  status: EscrowStatus;
  createdAt: string;
  paymentHeldAt?: string;
  expiresAt: string;
  escrowExpiresAt?: string;
  transferHash?: string;
  auditHash?: string;
  fraudFlags?: string[];
  dormancyCheck: boolean;
  valuationCheck: boolean;
  identityMatched: boolean;
  hallNotified: boolean;
  isFractional?: boolean;
  platformFee?: number; // inventory only
  fulfillmentCost?: number; // inventory only
  netToHall?: number; // inventory only
}

interface Escrow48hProps {
  escrow: Escrow48hData;
  onCancel?: (escrowId: string) => void;
  onDispute?: (escrowId: string) => void;
  onRelease?: (escrowId: string) => void;
  variant?: "full" | "compact" | "badge";
}

const statusConfig: Record<EscrowStatus, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  pending: { label: "PENDING PAYMENT", color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock, desc: "Buyer must complete payment to initiate escrow" },
  active: { label: "FUNDS HELD", color: "text-cyan-400", bg: "bg-cyan-500/10", icon: Lock, desc: "48-hour hold active. Either party may flag for review." },
  completed: { label: "COMPLETED", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2, desc: "Transfer complete. Ownership updated." },
  cancelled: { label: "CANCELLED", color: "text-slate-400", bg: "bg-slate-500/10", icon: XCircle, desc: "Buyer cancelled within 48h. Full refund issued." },
  refunded: { label: "REFUNDED", color: "text-slate-400", bg: "bg-slate-500/10", icon: Unlock, desc: "Full refund processed to buyer wallet." },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100);
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return (
    <div className="font-mono text-lg font-bold tracking-wider text-cyan-400">
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}

export function Escrow48h({ escrow, onCancel, onDispute, onRelease, variant = "full" }: Escrow48hProps) {
  const status = statusConfig[escrow.status];
  const StatusIcon = status.icon;

  const isOwnership = escrow.type === "ownership";
  const feePercent = isOwnership
    ? (escrow.isFractional ? 2 : 1)
    : 5;

  const effectiveExpiry = escrow.escrowExpiresAt || escrow.expiresAt;

  if (variant === "badge") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider", status.bg, status.color)}>
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-xl border p-3 backdrop-blur-md", status.bg.replace("/10", "/5"), status.color.replace("text-", "border-").replace("400", "500/20"))}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", status.color)} />
            <span className={cn("text-xs font-bold", status.color)}>{status.label}</span>
          </div>
          {escrow.status === "active" && <CountdownTimer expiresAt={effectiveExpiry} />}
        </div>
      </motion.div>
    );
  }

  const isActive = escrow.status === "active";
  const isCancellable = escrow.status === "active";
  const canRelease = escrow.status === "active" && new Date(effectiveExpiry).getTime() <= Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800/60 bg-slate-950/70 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className={cn("border-b px-6 py-4", status.color.replace("text-", "border-").replace("400", "500/20"))}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", status.bg)}>
              <StatusIcon className={cn("h-5 w-5", status.color)} />
            </div>
            <div>
              <div className={cn("text-sm font-bold tracking-wider", status.color)}>{status.label}</div>
              <div className="text-xs text-slate-500">{status.desc}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Escrow ID</div>
            <div className="font-mono text-xs text-slate-400">{escrow.id.slice(-8)}</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Countdown */}
        {isActive && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Hold Expires In</div>
            <CountdownTimer expiresAt={effectiveExpiry} />
            <div className="mt-1 text-xs text-slate-500">
              {canRelease
                ? "Hold expired. Ready for release."
                : "After expiry, either party may flag for review. Auto-completes if no flags."}
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="mb-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            {isOwnership ? "Ownership Transfer" : "Inventory Purchase"}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                {isOwnership ? "Listing Price" : "Item Price"}
              </span>
              <span className="font-mono text-slate-200">{formatCurrency(escrow.amount)}</span>
            </div>

            {isOwnership ? (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  8th Ledger Fee ({feePercent}%)
                  {escrow.isFractional && <span className="text-[10px] text-violet-400 ml-1">Fractional</span>}
                </span>
                <span className="font-mono text-slate-200">{formatCurrency(escrow.fee)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Platform Fee (5%)</span>
                  <span className="font-mono text-cyan-400">{formatCurrency(escrow.platformFee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fulfillment</span>
                  <span className="font-mono text-amber-400">{formatCurrency(escrow.fulfillmentCost || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Net to Hall Treasury</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(escrow.netToHall || 0)}</span>
                </div>
              </>
            )}

            <div className="border-t border-slate-800/60 pt-2">
              <div className="flex justify-between text-base">
                <span className="font-semibold text-slate-200">Total Held</span>
                <span className="font-mono font-bold text-cyan-400">{formatCurrency(escrow.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security layers */}
        <div>
          <div className="mb-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Anti-Fraud Verification Layers</div>
          <div className="space-y-2">
            <SecurityLayer
              label="KYC Gate"
              status={escrow.buyerKycTier !== "visitor" ? "passed" : "failed"}
              desc={`Buyer: ${escrow.buyerKycTier} · Seller: ${escrow.sellerKycTier}`}
            />
            <SecurityLayer
              label="Identity Lock"
              status={escrow.identityMatched ? "passed" : "pending"}
              desc="Government ID matches account name"
            />
            <SecurityLayer
              label="Dormancy Check"
              status={escrow.dormancyCheck ? "passed" : "failed"}
              desc="Seller account not flagged dormant"
            />
            <SecurityLayer
              label="Valuation Check"
              status={escrow.valuationCheck ? "passed" : "failed"}
              desc="Price meets or exceeds dynamic floor"
            />
            <SecurityLayer
              label="48-Hour Hold"
              status={isActive ? "active" : escrow.status === "completed" ? "passed" : "pending"}
              desc="Funds locked. Either party can flag."
            />
            <SecurityLayer
              label="Hash Audit"
              status={escrow.auditHash ? "passed" : "pending"}
              desc={escrow.auditHash ? `Hash: ${escrow.auditHash.slice(0, 16)}...` : "Awaiting transfer"}
            />
            <SecurityLayer
              label="Hall Notification"
              status={escrow.hallNotified ? "passed" : "pending"}
              desc="All members see ownership change"
            />
          </div>
        </div>

        {/* Fraud flags */}
        {escrow.fraudFlags && escrow.fraudFlags.length > 0 && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-bold">Fraud Flags Detected</span>
            </div>
            <ul className="space-y-1">
              {escrow.fraudFlags.map((flag, i) => (
                <li key={i} className="text-xs text-rose-300">• {flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Transfer hash */}
        {escrow.transferHash && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-400">
              <FileCheck className="h-4 w-4" />
              <span className="text-sm font-bold">Immutable Registry Hash</span>
            </div>
            <div className="font-mono text-xs text-emerald-300 break-all">{escrow.transferHash}</div>
            <div className="mt-1 text-[10px] text-slate-500">Logged to audit trail. Permanent. Irreversible.</div>
          </div>
        )}

        {/* Audit hash */}
        {escrow.auditHash && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-violet-400">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-bold">Audit Trail Hash</span>
            </div>
            <div className="font-mono text-xs text-violet-300 break-all">{escrow.auditHash}</div>
            <div className="mt-1 text-[10px] text-slate-500">Every transfer hashed, timestamped, stored forever.</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isCancellable && (
            <button
              onClick={() => onCancel?.(escrow.id)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 py-3 text-sm font-semibold text-slate-400 transition-colors hover:border-rose-500/30 hover:text-rose-400"
            >
              Cancel & Refund
            </button>
          )}
          {isCancellable && (
            <button
              onClick={() => onDispute?.(escrow.id)}
              className="flex-1 rounded-xl border border-amber-700/30 bg-amber-900/20 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-900/30"
            >
              Flag for Review
            </button>
          )}
          {canRelease && onRelease && (
            <button
              onClick={() => onRelease(escrow.id)}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
            >
              Release Escrow
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SecurityLayer({ label, status, desc }: { label: string; status: "passed" | "pending" | "active" | "failed"; desc: string }) {
  const config = {
    passed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    pending: { icon: Clock, color: "text-slate-400", bg: "bg-slate-500/10" },
    active: { icon: Loader2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    failed: { icon: Ban, color: "text-rose-400", bg: "bg-rose-500/10" },
  };
  const { icon: Icon, color, bg } = config[status];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800/40 bg-slate-900/20 px-3 py-2.5">
      <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", bg)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">{label}</span>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", color)}>{status}</span>
        </div>
        <div className="text-[10px] text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

export default Escrow48h;