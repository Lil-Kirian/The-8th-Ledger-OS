"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
   ArrowUpRight,
  CheckCircle2, AlertCircle, Loader2, Clock, Shield,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface WithdrawalRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  destination: string;
  destinationType: string;
  reference: string | null;
  createdAt: string;
  processedAt: string | null;
}

const KYC_LIMITS: Record<string, { label: string; limit: number; delay: string }> = {
  visitor: { label: "Visitor", limit: 0, delay: "N/A" },
  sovereign: { label: "Sovereign", limit: 500, delay: "Instant" },
  verified: { label: "Verified", limit: 5000, delay: "24h" },
  whale: { label: "Whale", limit: Infinity, delay: "72h" },
};

export default function WithdrawPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationType, setDestinationType] = useState("bank");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [balance, setBalance] = useState(0);
  const [available, setAvailable] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);

  const kycTier = user?.kycTier || "visitor";
  const kycInfo = KYC_LIMITS[kycTier] || KYC_LIMITS.visitor;
  const limitText = kycInfo.limit === Infinity ? "Unlimited" : `$${kycInfo.limit.toLocaleString()}`;

  async function fetchData() {
    try {
      const [balRes, withRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch("/api/wallet/withdraw"),
      ]);
      const balData = await balRes.json();
      const withData = await withRes.json();
      if (balData.success) {
        setBalance(balData.balance);
        setAvailable(balData.available);
      }
      if (withData.success) setWithdrawals(withData.withdrawals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleWithdraw() {
    const val = parseFloat(amount);
    if (!val || val < 1) {
      setError("Minimum withdrawal is $1");
      return;
    }
    if (kycInfo.limit !== Infinity && val > kycInfo.limit) {
      setError(`Your ${kycInfo.label} tier limit is ${limitText} per withdrawal. Upgrade KYC to increase.`);
      return;
    }
    if (val > available) {
      setError("Amount exceeds available balance");
      return;
    }
    if (!destination.trim()) {
      setError("Enter a valid destination");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload: unknown = {
        amount: val,
        destination: destination.trim(),
        destinationType,
        currency: "USD",
      };
      if (totpCode) payload.totpCode = totpCode;

      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(`Withdrawal of $${val.toLocaleString()} submitted. ${kycInfo.delay !== "Instant" ? `Processing time: ${kycInfo.delay}.` : ""}`);
        setAmount("");
        setDestination("");
        setTotpCode("");
        setNeedsTotp(false);
        fetchData();
      } else if (data.needsTotp) {
        setNeedsTotp(true);
        setError("TOTP verification required for this withdrawal.");
      } else {
        setError(data.message || "Withdrawal failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-white/40">Authenticate to access your vault</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
          <ChevronLeft className="h-4 w-4 text-white/60" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Withdraw Capital</h1>
          <p className="text-xs text-white/40">Transfer funds from your 8th Ledger Sovereign Vault</p>
        </div>
      </div>

      {/* KYC Tier Banner */}
      <Card className={`p-4 border-white/5 ${
        kycTier === "visitor" ? "bg-rose-500/5" : "bg-cyan-500/5"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            kycTier === "visitor" ? "bg-rose-500/10" : "bg-cyan-500/10"
          }`}>
            <Shield className={`h-4 w-4 ${kycTier === "visitor" ? "text-rose-400" : "text-cyan-400"}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white/70">
              KYC Tier: <span className={kycTier === "visitor" ? "text-rose-400" : "text-cyan-400"}>{kycInfo.label}</span>
            </p>
            <p className="text-[10px] text-white/30">
              Withdrawal limit: <span className="font-mono text-white/50">{limitText}</span>
              {kycInfo.delay !== "N/A" && <> • Processing: <span className="text-white/50">{kycInfo.delay}</span></>}
            </p>
          </div>
          {kycTier === "visitor" && (
            <Link href="/kyc" className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-colors">
              Verify →
            </Link>
          )}
        </div>
      </Card>

      {/* Balance Snapshot */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4 border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Total Balance</p>
          <p className="text-xl font-bold text-white font-mono mt-1">
            {fetching ? <Loader2 className="h-5 w-5 animate-spin text-white/20" /> : `$${balance.toLocaleString()}`}
          </p>
        </Card>
        <Card className="p-4 border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Available</p>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {fetching ? <Loader2 className="h-5 w-5 animate-spin text-white/20" /> : `$${available.toLocaleString()}`}
          </p>
        </Card>
      </div>

      {/* Withdraw Form */}
      <Card className="p-5 border-white/5">
        <div className="space-y-5">
          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-white/50 mb-2 block">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                placeholder="0.00"
                min="1"
                step="0.01"
                disabled={kycTier === "visitor"}
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-3 text-lg text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-rose-500/40 transition-colors disabled:opacity-30"
              />
            </div>
            {kycTier !== "visitor" && (
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setAmount(quick.toString())}
                    className="px-3 py-1 rounded-md text-[10px] font-semibold border border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all"
                  >
                    ${quick.toLocaleString()}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(Math.floor(available).toString())}
                  className="px-3 py-1 rounded-md text-[10px] font-semibold border border-white/10 text-white/40 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all"
                >
                  Max
                </button>
              </div>
            )}
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-semibold text-white/50 mb-2 block">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setError(""); }}
              placeholder="Bank account IBAN / Wallet address"
              disabled={kycTier === "visitor"}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500/40 transition-colors disabled:opacity-30"
            />
            <div className="flex gap-2 mt-2">
              {["bank", "crypto", "mobile_money"].map((type) => (
                <button
                  key={type}
                  onClick={() => setDestinationType(type)}
                  className={`px-3 py-1 rounded-md text-[10px] font-semibold border transition-all ${
                    destinationType === type
                      ? "border-rose-500/20 text-rose-400 bg-rose-500/5"
                      : "border-white/10 text-white/30 hover:text-white/50"
                  }`}
                >
                  {type === "mobile_money" ? "Mobile Money" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* TOTP (if needed) */}
          {needsTotp && (
            <div>
              <label className="text-xs font-semibold text-white/50 mb-2 block">TOTP Verification Code</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-lg text-white font-mono text-center tracking-[0.5em] placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors"
              />
              <p className="text-[10px] text-white/20 mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400">{success}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleWithdraw}
            disabled={loading || kycTier === "visitor" || !amount || !destination || (needsTotp && totpCode.length !== 6)}
            className="w-full bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 h-11 text-sm font-semibold disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowUpRight className="h-4 w-4 mr-2" />
            )}
            {loading ? "Processing..." : kycTier === "visitor" ? "Verify KYC to Withdraw" : "Request Withdrawal"}
          </Button>

          <p className="text-[10px] text-white/20 text-center">
            Withdrawals are subject to KYC tier limits, dormancy checks, and 8th Ledger security review.
            Name on destination must match your verified legal identity.
          </p>
        </div>
      </Card>

      {/* Recent Withdrawals */}
      <Card className="p-5 border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Recent Withdrawals</h3>
        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-8 w-8 text-white/10 mb-2" />
            <p className="text-xs text-white/20">No withdrawals yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    w.status === "completed"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : w.status === "pending"
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-rose-500/10 border-rose-500/20"
                  }`}>
                    {w.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : w.status === "pending" ? (
                      <Clock className="h-4 w-4 text-amber-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">${w.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-white/20">
                      {new Date(w.createdAt).toLocaleDateString()} • {w.destinationType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    w.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : w.status === "pending"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {w.status}
                  </span>
                  {w.processedAt && (
                    <p className="text-[9px] text-white/15 mt-1">
                      Processed {new Date(w.processedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}