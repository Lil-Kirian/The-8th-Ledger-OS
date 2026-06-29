"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Wallet, ArrowDownLeft, Landmark, CreditCard, Globe,
  CheckCircle2, AlertCircle, Loader2, Clock,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface DepositRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  reference: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function DepositPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const methods = [
    { id: "bank_transfer", label: "Bank Transfer", icon: Landmark, desc: "1-2 business days • No fee" },
    { id: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Instant • 1.5% fee" },
    { id: "paystack", label: "Paystack", icon: Globe, desc: "Instant • 1.5% fee" },
  ];

  async function fetchData() {
    try {
      const [balRes, depRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch("/api/wallet/deposit"),
      ]);
      const balData = await balRes.json();
      const depData = await depRes.json();
      if (balData.success) setBalance(balData.balance);
      if (depData.success) setDeposits(depData.deposits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDeposit() {
    const val = parseFloat(amount);
    if (!val || val < 1) {
      setError("Minimum deposit is $1");
      return;
    }
    if (val > 100000) {
      setError("Maximum single deposit is $100,000");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val, method, currency: "USD" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Deposit request of $${val.toLocaleString()} initiated. Reference: ${data.reference || "N/A"}`);
        setAmount("");
        fetchData();
      } else {
        setError(data.message || "Deposit failed. Please try again.");
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Deposit Capital</h1>
          <p className="text-xs text-white/40">Add funds to your 8th Ledger Sovereign Vault</p>
        </div>
      </div>

      {/* Balance Snapshot */}
      <Card className="p-5 border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Current Balance</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">
              {fetching ? <Loader2 className="h-5 w-5 animate-spin text-white/20" /> : `$${balance.toLocaleString()}`}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      </Card>

      {/* Deposit Form */}
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
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-3 text-lg text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[100, 500, 1000, 5000].map((quick) => (
                <button
                  key={quick}
                  onClick={() => setAmount(quick.toString())}
                  className="px-3 py-1 rounded-md text-[10px] font-semibold border border-white/10 text-white/40 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all"
                >
                  +${quick.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="text-xs font-semibold text-white/50 mb-2 block">Deposit Method</label>
            <div className="space-y-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    method === m.id
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    method === m.id ? "bg-emerald-500/10" : "bg-white/5"
                  }`}>
                    <m.icon className={`h-4 w-4 ${method === m.id ? "text-emerald-400" : "text-white/30"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${method === m.id ? "text-emerald-400" : "text-white/70"}`}>
                      {m.label}
                    </p>
                    <p className="text-[10px] text-white/30">{m.desc}</p>
                  </div>
                  {method === m.id && (
                    <div className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

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
            onClick={handleDeposit}
            disabled={loading || !amount || parseFloat(amount) < 1}
            className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 h-11 text-sm font-semibold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowDownLeft className="h-4 w-4 mr-2" />
            )}
            {loading ? "Processing..." : "Initiate Deposit"}
          </Button>

          <p className="text-[10px] text-white/20 text-center">
            Funds are held in escrow until cleared. 8th Ledger never holds your private banking credentials.
          </p>
        </div>
      </Card>

      {/* Recent Deposits */}
      <Card className="p-5 border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Recent Deposits</h3>
        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-8 w-8 text-white/10 mb-2" />
            <p className="text-xs text-white/20">No deposits yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deposits.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    d.status === "completed"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : d.status === "pending"
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-rose-500/10 border-rose-500/20"
                  }`}>
                    {d.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : d.status === "pending" ? (
                      <Clock className="h-4 w-4 text-amber-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">${d.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-white/20">
                      {new Date(d.createdAt).toLocaleDateString()} • {d.method.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    d.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : d.status === "pending"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {d.status}
                  </span>
                  {d.reference && (
                    <p className="text-[9px] text-white/15 mt-1 font-mono">{d.reference}</p>
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