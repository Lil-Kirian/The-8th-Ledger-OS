// components/wallet/ledger-transfer.tsx
"use client";

import React, { useState, useCallback } from "react";
import {
  ArrowRightLeft,
  Wallet,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Shield,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LedgerTransferProps {
  currentBalance: number;
  ledgerId: string;
  onTransfer: (data: {
    recipientLedgerId: string;
    amount: number;
    note?: string;
  }) => Promise<{ success: boolean; error?: string; txHash?: string }>;
  onCancel?: () => void;
}

type TransferStep = "form" | "confirm" | "processing" | "success" | "error";

export default function LedgerTransfer({
  currentBalance,
  ledgerId,
  onTransfer,
  onCancel,
}: LedgerTransferProps) {
  const [step, setStep] = useState<TransferStep>("form");
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<{
    displayName: string;
    kycTier: string;
  } | null>(null);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= currentBalance;
  const isValidRecipient = recipientId.startsWith("LED-") && recipientId.length >= 12;

  const validateRecipient = useCallback(async (id: string) => {
    if (!id.startsWith("LED-") || id.length < 12) {
      setRecipientPreview(null);
      return;
    }
    setIsValidating(true);
    try {
      const res = await fetch(`/api/user/lookup?ledgerId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setRecipientPreview(data);
      } else {
        setRecipientPreview(null);
      }
    } catch {
      setRecipientPreview(null);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleReview = () => {
    if (!isValidRecipient || !isValidAmount) {
      setError("Please enter a valid recipient and amount.");
      return;
    }
    if (recipientId === ledgerId) {
      setError("You cannot transfer to yourself.");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleSubmit = async () => {
    setStep("processing");
    try {
      const result = await onTransfer({
        recipientLedgerId: recipientId,
        amount: parsedAmount,
        note: note.trim() || undefined,
      });
      if (result.success) {
        setTxHash(result.txHash || "");
        setStep("success");
      } else {
        setError(result.error || "Transfer failed.");
        setStep("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("form");
    setRecipientId("");
    setAmount("");
    setNote("");
    setError("");
    setTxHash("");
    setRecipientPreview(null);
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0d0d1a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/30 border border-cyan-800/30 flex items-center justify-center">
            <ArrowRightLeft size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Ledger Transfer</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ledgerId}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Available</div>
          <div className="text-lg font-bold text-cyan-400 font-mono">
            {currentBalance.toLocaleString()} <span className="text-xs text-cyan-600">LED</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {step === "form" && (
          <div className="space-y-5">
            {/* Recipient */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Recipient Ledger ID
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => {
                    setRecipientId(e.target.value.toUpperCase());
                    if (e.target.value.length >= 12) validateRecipient(e.target.value.toUpperCase());
                  }}
                  placeholder="LED-XXXX-XXXX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-700/50 focus:ring-1 focus:ring-cyan-700/30 transition-all font-mono"
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="animate-spin text-cyan-500" />
                  </div>
                )}
              </div>
              {recipientPreview && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-800/20">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-xs text-emerald-300">{recipientPreview.displayName}</span>
                  <span className="text-[10px] text-emerald-500 uppercase">({recipientPreview.kycTier})</span>
                </div>
              )}
              {recipientId && !isValidating && !recipientPreview && recipientId.length >= 12 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/20 border border-red-800/20">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-xs text-red-300">User not found</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Amount (LED)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <Wallet size={16} />
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  max={currentBalance}
                  className="w-full pl-10 pr-20 py-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-700/50 focus:ring-1 focus:ring-cyan-700/30 transition-all font-mono"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button
                    onClick={() => setAmount(currentBalance.toString())}
                    className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 uppercase tracking-wider"
                  >
                    MAX
                  </button>
                </div>
              </div>
              {parsedAmount > currentBalance && (
                <p className="text-xs text-red-400">Amount exceeds available balance.</p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Transfer purpose..."
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-700/50 focus:ring-1 focus:ring-cyan-700/30 transition-all"
              />
              <div className="text-right text-[10px] text-slate-700">{note.length}/100</div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-800/20 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onCancel}
                className="px-4 py-3 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!isValidRecipient || !isValidAmount}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  isValidRecipient && isValidAmount
                    ? "bg-cyan-600 border border-cyan-500 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20"
                    : "bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed"
                )}
              >
                <Send size={16} />
                Review Transfer
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase">From</span>
                <span className="text-xs text-slate-300 font-mono">{ledgerId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase">To</span>
                <span className="text-xs text-slate-300 font-mono">{recipientId}</span>
              </div>
              {recipientPreview && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">Recipient</span>
                  <span className="text-xs text-slate-300">{recipientPreview.displayName}</span>
                </div>
              )}
              <div className="h-px bg-slate-700/30" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase">Amount</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {parsedAmount.toLocaleString()} LED
                </span>
              </div>
              {note && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[10px] text-slate-500 uppercase shrink-0">Note</span>
                  <span className="text-xs text-slate-300 text-right">{note}</span>
                </div>
              )}
              <div className="h-px bg-slate-700/30" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase">Balance After</span>
                <span className="text-xs text-slate-400 font-mono">
                  {(currentBalance - parsedAmount).toLocaleString()} LED
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/10 border border-amber-800/20 flex items-start gap-2">
              <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Transfers are irreversible. The 8th Ledger verifies all transactions for compliance. Suspicious patterns may trigger a 48-hour hold.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("form")}
                className="px-4 py-3 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20"
              >
                <Send size={16} />
                Confirm Transfer
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-800/30 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-slate-200">Processing Transfer</div>
            <div className="text-xs text-slate-500">The 8th Ledger is verifying your transaction...</div>
          </div>
        )}

        {step === "success" && (
          <div className="py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/30 border border-emerald-800/30 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-slate-200">Transfer Complete</div>
            <div className="text-xs text-slate-500 text-center max-w-xs">
              {parsedAmount.toLocaleString()} LED sent to {recipientId}
            </div>
            {txHash && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <Hash size={12} className="text-slate-500" />
                <span className="text-[10px] text-slate-400 font-mono">{txHash.slice(0, 16)}...</span>
              </div>
            )}
            <button
              onClick={reset}
              className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all"
            >
              New Transfer
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-950/30 border border-red-800/30 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <div className="text-sm font-bold text-slate-200">Transfer Failed</div>
            <div className="text-xs text-red-300 text-center max-w-xs">{error}</div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setStep("form")}
                className="px-4 py-2.5 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}