"use client";

import React, { useState, useCallback } from "react";
import {
  Wallet,
  ArrowUpRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Clock,
  Crown,
  Landmark,
  CreditCard,
  Globe,
  Eye,
  EyeOff,
  Fingerprint,
  Timer,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

interface KycTierConfig {
  tier: "visitor" | "sovereign" | "verified" | "whale";
  label: string;
  dailyLimit: number;
  delayHours: number;
  instant: boolean;
  badge: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}

interface WithdrawalFormProps {
  ledgerId: string;
  ledgerBalance: number;
  kycTier: "visitor" | "sovereign" | "verified" | "whale";
  displayName: string;
  legalName?: string;
  totpEnabled?: boolean;
  lastActivityAt?: string;
  onSubmit: (data: WithdrawalPayload) => Promise<WithdrawalResult>;
  onCancel?: () => void;
}

interface WithdrawalPayload {
  amount: number;
  destination: string;
  destinationType: "bank" | "crypto" | "mobile_money";
  currency: string;
  totpCode?: string;
  legalNameMatch: boolean;
}

interface WithdrawalResult {
  success: boolean;
  reference?: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  estimatedArrival?: string;
  delayHours?: number;
}

// ─── Tier Config ───

const TIER_CONFIG: Record<string, KycTierConfig> = {
  visitor: {
    tier: "visitor",
    label: "Visitor",
    dailyLimit: 0,
    delayHours: 0,
    instant: false,
    badge: "🔒",
    color: "text-slate-400",
    bg: "bg-slate-900/30",
    border: "border-slate-700/30",
    icon: Lock,
  },
  sovereign: {
    tier: "sovereign",
    label: "Sovereign",
    dailyLimit: 500,
    delayHours: 0,
    instant: true,
    badge: "⚜️",
    color: "text-cyan-400",
    bg: "bg-cyan-950/20",
    border: "border-cyan-700/30",
    icon: Shield,
  },
  verified: {
    tier: "verified",
    label: "Verified",
    dailyLimit: 5000,
    delayHours: 24,
    instant: false,
    badge: "✓",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-700/30",
    icon: CheckCircle2,
  },
  whale: {
    tier: "whale",
    label: "Whale",
    dailyLimit: Infinity,
    delayHours: 72,
    instant: false,
    badge: "👑",
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-700/30",
    icon: Crown,
  },
};

// ─── Component ───

export default function WithdrawalForm({
  ledgerId,
  ledgerBalance,
  kycTier,
  displayName,
  legalName,
  totpEnabled = false,
  lastActivityAt,
  onSubmit,
  onCancel,
}: WithdrawalFormProps) {
  const [step, setStep] = useState<"form" | "verify" | "processing" | "success" | "error">("form");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationType, setDestinationType] = useState<"bank" | "crypto" | "mobile_money">("bank");
  const [currency, setCurrency] = useState("USD");
  const [totpCode, setTotpCode] = useState("");
  const [nameMatchConfirmed, setNameMatchConfirmed] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WithdrawalResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tierCfg = TIER_CONFIG[kycTier] || TIER_CONFIG.visitor;
  const TierIcon = tierCfg.icon;

  const numericAmount = parseFloat(amount) || 0;
  const isDormant = lastActivityAt
    ? Date.now() - new Date(lastActivityAt).getTime() > 365 * 24 * 60 * 60 * 1000
    : false;

  const canWithdraw = kycTier !== "visitor" && !isDormant && ledgerBalance > 0;
  const exceedsLimit = numericAmount > tierCfg.dailyLimit && tierCfg.dailyLimit !== Infinity;
  const exceedsBalance = numericAmount > ledgerBalance;
  const isValidAmount = numericAmount > 0 && !exceedsLimit && !exceedsBalance;
  const canProceed = isValidAmount && destination.trim().length > 5 && nameMatchConfirmed;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(val);

  const handleProceed = useCallback(() => {
    if (!canProceed) return;
    if (totpEnabled) {
      setStep("verify");
    } else {
      handleSubmit();
    }
  }, [canProceed, totpEnabled]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setStep("processing");
    setError("");

    try {
      const payload: WithdrawalPayload = {
        amount: numericAmount,
        destination: destination.trim(),
        destinationType,
        currency,
        totpCode: totpEnabled ? totpCode : undefined,
        legalNameMatch: nameMatchConfirmed,
      };

      const res = await onSubmit(payload);
      setResult(res);

      if (res.success) {
        setStep("success");
      } else {
        setStep("error");
        setError(res.message || "Withdrawal failed");
      }
    } catch (err: unknown) {
      setStep("error");
      setError(err?.message || "Network error. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  }, [numericAmount, destination, destinationType, currency, totpCode, nameMatchConfirmed, totpEnabled, onSubmit]);

  const reset = () => {
    setStep("form");
    setAmount("");
    setDestination("");
    setTotpCode("");
    setNameMatchConfirmed(false);
    setError("");
    setResult(null);
  };

  // ─── RENDER: FORM ───
  if (step === "form") {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-[#0a0a12] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0d0d1a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/30 border border-cyan-700/30 flex items-center justify-center">
                  <Wallet size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Withdraw Ledger</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ledgerId}</p>
                </div>
              </div>
              <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", tierCfg.bg, tierCfg.border, tierCfg.color)}>
                <TierIcon size={10} />
                {tierCfg.label}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Balance Display */}
            <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Available Balance</div>
                <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                  {showBalance ? formatCurrency(ledgerBalance) : "••••••"}
                </div>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* KYC Tier Gate */}
            {!canWithdraw && (
              <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-red-300">Withdrawal Blocked</div>
                  <p className="text-xs text-red-300/70 mt-1 leading-relaxed">
                    {kycTier === "visitor"
                      ? "Visitors cannot withdraw. Complete KYC to unlock withdrawals."
                      : isDormant
                      ? "Account dormant for 365+ days. Reclaim required before withdrawal."
                      : "Insufficient balance."}
                  </p>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    Limit: {tierCfg.dailyLimit === Infinity ? "∞" : formatCurrency(tierCfg.dailyLimit)}
                  </span>
                  {tierCfg.delayHours > 0 && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Clock size={10} />
                      {tierCfg.delayHours}h delay
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={!canWithdraw}
                  className={cn(
                    "w-full pl-8 pr-20 py-3.5 rounded-xl bg-slate-900/40 border text-sm font-mono text-slate-100 placeholder:text-slate-700 focus:outline-none focus:ring-2 transition-all",
                    exceedsLimit || exceedsBalance
                      ? "border-red-700/40 focus:ring-red-500/20"
                      : "border-slate-700/40 focus:ring-cyan-500/20 focus:border-cyan-600/40",
                    !canWithdraw && "opacity-50 cursor-not-allowed"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    onClick={() => setAmount(Math.floor(ledgerBalance / 4).toString())}
                    disabled={!canWithdraw}
                    className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/40 text-[10px] text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setAmount(Math.floor(ledgerBalance / 2).toString())}
                    disabled={!canWithdraw}
                    className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/40 text-[10px] text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setAmount(Math.floor(ledgerBalance).toString())}
                    disabled={!canWithdraw}
                    className="px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/40 text-[10px] text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
                  >
                    MAX
                  </button>
                </div>
              </div>
              {exceedsLimit && (
                <div className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Exceeds {tierCfg.label} daily limit of {formatCurrency(tierCfg.dailyLimit)}
                </div>
              )}
              {exceedsBalance && (
                <div className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Exceeds available balance
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destination</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(["bank", "crypto", "mobile_money"] as const).map((type) => {
                  const icons = { bank: Landmark, crypto: Globe, mobile_money: CreditCard };
                  const Icon = icons[type];
                  const labels = { bank: "Bank", crypto: "Crypto", mobile_money: "Mobile" };
                  return (
                    <button
                      key={type}
                      onClick={() => setDestinationType(type)}
                      disabled={!canWithdraw}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all",
                        destinationType === type
                          ? "bg-cyan-950/20 border-cyan-600/40 text-cyan-400"
                          : "bg-slate-900/20 border-slate-700/30 text-slate-500 hover:text-slate-300",
                        !canWithdraw && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Icon size={14} />
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={
                  destinationType === "bank"
                    ? "IBAN / Account Number"
                    : destinationType === "crypto"
                    ? "Wallet Address (0x...)"
                    : "Mobile Money Number"
                }
                disabled={!canWithdraw}
                className={cn(
                  "w-full px-4 py-3.5 rounded-xl bg-slate-900/40 border border-slate-700/40 text-sm text-slate-100 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600/40 transition-all",
                  !canWithdraw && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currency</label>
              <div className="flex gap-2">
                {["USD", "EUR", "GBP"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    disabled={!canWithdraw}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-xs font-bold transition-all",
                      currency === c
                        ? "bg-cyan-950/20 border-cyan-600/40 text-cyan-400"
                        : "bg-slate-900/20 border-slate-700/30 text-slate-500 hover:text-slate-300",
                      !canWithdraw && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Verification */}
            {legalName && (
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Fingerprint size={14} className="text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300">Identity Verification</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Withdrawals require the destination account to match your verified legal name:
                  <span className="text-slate-300 font-bold ml-1">{legalName}</span>
                </p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                      nameMatchConfirmed
                        ? "bg-cyan-600 border-cyan-500"
                        : "bg-slate-900/40 border-slate-700/40 group-hover:border-slate-600"
                    )}
                  >
                    {nameMatchConfirmed && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={nameMatchConfirmed}
                    onChange={(e) => setNameMatchConfirmed(e.target.checked)}
                    disabled={!canWithdraw}
                    className="sr-only"
                  />
                  <span className="text-xs text-slate-400">
                    I confirm the destination account is registered under <span className="text-slate-300">{legalName}</span>
                  </span>
                </label>
              </div>
            )}

            {/* Dormancy Warning */}
            {isDormant && (
              <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-800/20 flex items-start gap-3">
                <Timer size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300">Dormancy Flag Active</div>
                  <p className="text-[10px] text-amber-300/70 mt-1 leading-relaxed">
                    Account inactive for 365+ days. Withdrawals suspended. Reclaim account to resume.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-5 py-3.5 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleProceed}
                disabled={!canProceed || isSubmitting}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg",
                  canProceed
                    ? "bg-cyan-600 border border-cyan-500 text-white hover:bg-cyan-500 shadow-cyan-900/20"
                    : "bg-slate-800/40 border border-slate-700/30 text-slate-600 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={16} />
                    {totpEnabled ? "Verify & Withdraw" : "Withdraw Now"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: TOTP VERIFY ───
  if (step === "verify") {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-[#0a0a12] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0d0d1a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/30 border border-cyan-700/30 flex items-center justify-center">
                <Shield size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Security Verification</h2>
                <p className="text-[10px] text-slate-500">6-factor authentication required</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 text-center space-y-3">
              <div className="text-sm text-slate-400">Enter TOTP code from your authenticator</div>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={totpCode[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newCode = totpCode.split("");
                      newCode[i] = val;
                      setTotpCode(newCode.join("").slice(0, 6));
                      if (val && i < 5) {
                        const next = document.getElementById(`totp-${i + 1}`) as HTMLInputElement;
                        next?.focus();
                      }
                    }}
                    id={`totp-${i}`}
                    className="w-12 h-14 rounded-xl bg-slate-900/40 border border-slate-700/40 text-center text-lg font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600/40"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("form")}
                className="px-5 py-3.5 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={totpCode.length !== 6 || isSubmitting}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg",
                  totpCode.length === 6
                    ? "bg-cyan-600 border border-cyan-500 text-white hover:bg-cyan-500 shadow-cyan-900/20"
                    : "bg-slate-800/40 border border-slate-700/30 text-slate-600 cursor-not-allowed"
                )}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: PROCESSING ───
  if (step === "processing") {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-[#0a0a12] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl p-12 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-900/30" />
            <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={28} className="text-cyan-400 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Processing Withdrawal</h3>
            <p className="text-sm text-slate-500 mt-2">
              {tierCfg.delayHours > 0
                ? `This withdrawal will be held for ${tierCfg.delayHours} hours for security review.`
                : "Processing your request..."}
            </p>
          </div>
          <div className="text-xs text-slate-600 font-mono">{ledgerId}</div>
        </div>
      </div>
    );
  }

  // ─── RENDER: SUCCESS ───
  if (step === "success" && result) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-[#0a0a12] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950/20 border border-emerald-700/30 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Withdrawal Initiated</h3>
              <p className="text-sm text-slate-500 mt-2">{result.message}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount</span>
                <span className="text-slate-100 font-mono font-bold">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reference</span>
                <span className="text-slate-300 font-mono text-xs">{result.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={cn(
                  "text-xs font-bold uppercase px-2 py-0.5 rounded",
                  result.status === "pending" && "bg-amber-950/20 text-amber-400",
                  result.status === "processing" && "bg-cyan-950/20 text-cyan-400",
                  result.status === "completed" && "bg-emerald-950/20 text-emerald-400"
                )}>
                  {result.status}
                </span>
              </div>
              {result.delayHours && result.delayHours > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimated Arrival</span>
                  <span className="text-amber-400 font-mono text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {result.estimatedArrival || `${result.delayHours} hours`}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-sm font-medium text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-all"
            >
              <ArrowUpRight size={16} />
              New Withdrawal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: ERROR ───
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-[#0a0a12] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-950/20 border border-red-700/30 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Withdrawal Failed</h3>
            <p className="text-sm text-red-300/70 mt-2">{error}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-sm font-medium text-slate-300 hover:text-slate-100 transition-all"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
