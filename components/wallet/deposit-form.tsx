"use client";

import React, { useState } from "react";
import { 
  Wallet, 
  ArrowDownLeft, 
  CreditCard, 
  Building2, 
  Smartphone, 
  Globe, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

type DepositMethod = "bank_transfer" | "card" | "mobile_money" | "crypto";

interface DepositMethodConfig {
  id: DepositMethod;
  label: string;
  icon: React.ElementType;
  description: string;
  processingTime: string;
  fee: string;
  minAmount: number;
  maxAmount: number;
  supported: boolean;
}

const depositMethods: DepositMethodConfig[] = [
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    icon: Building2,
    description: "Direct wire from your bank account",
    processingTime: "1-2 business days",
    fee: "0%",
    minAmount: 10,
    maxAmount: 50000,
    supported: true,
  },
  {
    id: "card",
    label: "Debit / Credit Card",
    icon: CreditCard,
    description: "Instant deposit via Paystack",
    processingTime: "Instant",
    fee: "1.5%",
    minAmount: 1,
    maxAmount: 10000,
    supported: true,
  },
  {
    id: "mobile_money",
    label: "Mobile Money",
    icon: Smartphone,
    description: "M-Pesa, MTN Mobile, etc.",
    processingTime: "Instant",
    fee: "1%",
    minAmount: 1,
    maxAmount: 5000,
    supported: true,
  },
  {
    id: "crypto",
    label: "Stablecoin",
    icon: Globe,
    description: "USDC / USDT on supported networks",
    processingTime: "10-30 mins",
    fee: "Network fee only",
    minAmount: 50,
    maxAmount: 100000,
    supported: false,
  },
];

interface DepositFormProps {
  ledgerId: string;
  ledgerBalance: number;
  currency?: string;
  onDeposit?: (data: {
    amount: number;
    method: DepositMethod;
    reference: string;
  }) => Promise<{ success: boolean; redirectUrl?: string; reference?: string; error?: string }>;
}

export default function DepositForm({
  ledgerId,
  ledgerBalance,
  currency = "USD",
  onDeposit,
}: DepositFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("bank_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    reference?: string;
    redirectUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedConfig = depositMethods.find((m) => m.id === selectedMethod)!;
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount =
    amountNum >= selectedConfig.minAmount && amountNum <= selectedConfig.maxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount || !onDeposit) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const reference = `DEP-${ledgerId.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;
      const response = await onDeposit({
        amount: amountNum,
        method: selectedMethod,
        reference,
      });

      if (response.success) {
        setResult({
          type: "success",
          message: `Deposit initiated. ${selectedConfig.processingTime === "Instant" ? "Funds will appear shortly." : "Funds will clear in " + selectedConfig.processingTime + "."}`,
          reference: response.reference || reference,
          redirectUrl: response.redirectUrl,
        });
        setAmount("");
      } else {
        setResult({
          type: "error",
          message: response.error || "Deposit failed. Please try again or contact support.",
        });
      }
    } catch (err) {
      setResult({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0d0d1a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
              <ArrowDownLeft size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Deposit to Wallet</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{ledgerId}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase">Current Balance</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {currency} {ledgerBalance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Amount ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-lg">
              {currency === "USD" ? "$" : currency}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min={selectedConfig.minAmount}
              max={selectedConfig.maxAmount}
              step="0.01"
              className="w-full bg-slate-900/50 border border-slate-700/40 rounded-xl py-4 pl-12 pr-4 text-xl font-bold text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-600">
            <span>Min: {currency} {selectedConfig.minAmount.toLocaleString()}</span>
            <span>Max: {currency} {selectedConfig.maxAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Method Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Deposit Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {depositMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              const isDisabled = !method.supported;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => !isDisabled && setSelectedMethod(method.id)}
                  disabled={isDisabled}
                  className={cn(
                    "relative p-4 rounded-xl border text-left transition-all",
                    isSelected
                      ? "bg-cyan-950/10 border-cyan-500/30 shadow-lg shadow-cyan-900/10"
                      : "bg-slate-900/20 border-slate-800/40 hover:border-slate-700/60",
                    isDisabled && "opacity-40 cursor-not-allowed hover:border-slate-800/40"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-cyan-400" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                        isSelected
                          ? "bg-cyan-900/20 border-cyan-700/30"
                          : "bg-slate-800/40 border-slate-700/30"
                      )}
                    >
                      <Icon size={16} className={isSelected ? "text-cyan-400" : "text-slate-500"} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold", isSelected ? "text-cyan-300" : "text-slate-300")}>
                          {method.label}
                        </span>
                        {isDisabled && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/30">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        {method.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-slate-600">
                          <span className="text-slate-500">{method.processingTime}</span>
                        </span>
                        <span className="text-[9px] text-emerald-500/80 font-medium">
                          Fee: {method.fee}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {amountNum > 0 && isValidAmount && (
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 space-y-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deposit Summary</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Amount</span>
                <span className="text-slate-200 font-mono font-bold">{currency} {amountNum.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Fee</span>
                <span className="text-slate-400 font-mono">
                  {selectedConfig.fee === "0%" ? "Free" : selectedConfig.fee}
                </span>
              </div>
              <div className="h-px bg-slate-800/40" />
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-slate-300">Total to Account</span>
                <span className="text-emerald-400 font-mono">{currency} {amountNum.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValidAmount || isSubmitting || !onDeposit}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold transition-all",
            isValidAmount && !isSubmitting
              ? "bg-cyan-600 border border-cyan-500 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20"
              : "bg-slate-800/40 border border-slate-700/30 text-slate-600 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing Deposit...
            </>
          ) : (
            <>
              <Wallet size={16} />
              Deposit {currency} {amountNum > 0 ? amountNum.toLocaleString() : ""}
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div
            className={cn(
              "p-4 rounded-xl border space-y-3",
              result.type === "success"
                ? "bg-emerald-950/10 border-emerald-800/20"
                : "bg-red-950/10 border-red-800/20"
            )}
          >
            <div className="flex items-center gap-2">
              {result.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="text-red-400" />
              )}
              <span
                className={cn(
                  "text-xs font-bold",
                  result.type === "success" ? "text-emerald-300" : "text-red-300"
                )}
              >
                {result.type === "success" ? "Deposit Initiated" : "Deposit Failed"}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{result.message}</p>
            {result.reference && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="text-[10px] text-slate-500 font-mono">Ref:</span>
                <span className="text-[10px] text-slate-300 font-mono flex-1 truncate">{result.reference}</span>
                <button
                  type="button"
                  onClick={() => copyReference(result.reference!)}
                  className="p-1.5 rounded-md hover:bg-slate-800/60 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} className="text-slate-500" />
                  )}
                </button>
              </div>
            )}
            {result.redirectUrl && (
              <a
                href={result.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-600/30 transition-all"
              >
                <ExternalLink size={12} />
                Complete Payment
              </a>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="pt-2 border-t border-slate-800/40 space-y-2">
          <div className="flex items-start gap-2 text-[10px] text-slate-600">
            <Building2 size={10} className="shrink-0 mt-0.5" />
            <span>
              <span className="font-bold text-slate-500">8th Ledger Holdings Ltd.</span> processes all deposits through regulated banking partners. Funds are held in segregated accounts.
            </span>
          </div>
          <div className="flex items-start gap-2 text-[10px] text-slate-600">
            <ShieldAlert size={10} className="shrink-0 mt-0.5" />
            <span>
              Deposits may be subject to KYC verification depending on your tier and amount. <span className="text-cyan-500/70">Sovereign tier</span> and above enjoy higher limits.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
