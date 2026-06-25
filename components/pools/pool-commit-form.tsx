"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowUpRight } from "lucide-react";

interface PoolCommitFormProps {
  poolId: string;
  poolTarget: number;
  minCommitment?: number;
  maxCommitment?: number;
  onSuccess?: () => void;
}

export function PoolCommitForm({
  poolId,
  poolTarget,
  minCommitment = 1,
  maxCommitment,
  onSuccess,
}: PoolCommitFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const ownershipPreview =
    poolTarget > 0 && amount ? ((Number(amount) / poolTarget) * 100).toFixed(4) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num < minCommitment) {
      setMessage(`Minimum commitment is $${minCommitment}`);
      return;
    }
    if (maxCommitment && num > maxCommitment) {
      setMessage(`Maximum commitment is $${maxCommitment.toLocaleString()}`);
      return;
    }
    if (!user) {
      setMessage("Authenticate to commit capital");
      return;
    }
    if (user.kycTier === "visitor") {
      setMessage("Complete SIV/KYC to commit. Minimum tier: Sovereign.");
      return;
    }
    if (user.creditPool < num) {
      setMessage(`Insufficient credit. You have $${user.creditPool.toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/pools/${poolId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Committed $${num.toLocaleString()}. PAC: ${data.pacToken || "Pending"}`);
        setAmount("");
        onSuccess?.();
      } else {
        setMessage(data.error || "Commitment failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/40">
          Amount (USD)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={minCommitment}
          max={maxCommitment}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          placeholder={minCommitment.toString()}
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/20">
          <span>Min ${minCommitment}</span>
          <span>Credit Pool: ${user?.creditPool?.toLocaleString() || 0}</span>
        </div>
      </div>

      {ownershipPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-lg bg-cyan-500/[0.03] border border-cyan-500/10 p-3"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Ownership Preview</span>
            <span className="text-cyan-400 font-mono">{ownershipPreview}%</span>
          </div>
        </motion.div>
      )}

      <Button
        type="submit"
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
        disabled={submitting}
      >
        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
        {submitting ? "Committing..." : "Commit to Earn"}
      </Button>

      {message && (
        <div
          className={`rounded-lg p-2 text-xs text-center ${
            message.includes("Committed")
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}