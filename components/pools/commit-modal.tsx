"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { X, Coins, Shield, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";

// Lightweight confetti particles
function Confetti() {
  const particles = Array.from({ length: 24 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: "50%",
            y: "50%",
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${20 + Math.random() * 60}%`,
            y: `${20 + Math.random() * 60}%`,
            scale: Math.random() * 0.8 + 0.2,
            opacity: 0,
          }}
          transition={{
            duration: 1.5 + Math.random(),
            ease: "easeOut",
            delay: Math.random() * 0.3,
          }}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: ["#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5],
          }}
        />
      ))}
    </div>
  );
}

interface PoolCommitModalProps {
  poolId: string;
  poolName: string;
  poolTarget: number;
  minCommitment?: number;
  maxCommitment?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PoolCommitModal({
  poolId,
  poolName,
  poolTarget,
  minCommitment = 1,
  maxCommitment,
  isOpen,
  onClose,
  onSuccess,
}: PoolCommitModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const ownershipPreview =
    poolTarget > 0 && amount ? ((Number(amount) / poolTarget) * 100).toFixed(4) : null;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          setSuccess(true);
          setMessage(`Committed $${num.toLocaleString()}. PAC: ${data.pacToken || "Pending"}`);
          setAmount("");
          onSuccess?.();
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 2800);
        } else {
          setMessage(data.error || "Commitment failed");
        }
      } catch {
        setMessage("Network error");
      } finally {
        setSubmitting(false);
      }
    },
    [amount, poolId, user, minCommitment, maxCommitment, poolTarget, onSuccess, onClose]
  );

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setMessage("");
      setSuccess(false);
      setInputFocused(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 20, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md relative"
          >
            {success && <Confetti />}

            <Card className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0c]/95 backdrop-blur-xl p-0 shadow-2xl shadow-black/50">
              {/* Top glow line */}
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-500/10 p-2 border border-cyan-500/20">
                      <Coins className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">Commit to Earn</h3>
                      <p className="text-[11px] text-white/25 mt-0.5">8th Ledger Protocol</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-white/20 hover:bg-white/5 hover:text-white/50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-5">
                  <p className="text-sm text-white/40 font-medium">{poolName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-white/15 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]">
                      Target: ${poolTarget.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/15 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04]">
                      Min: ${minCommitment}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-white/30">
                      Amount (USD)
                    </label>
                    <div
                      className={cn(
                        "relative rounded-xl border bg-white/[0.03] transition-all duration-300",
                        inputFocused
                          ? "border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)] ring-1 ring-cyan-500/20"
                          : "border-white/[0.08] hover:border-white/[0.12]"
                      )}
                    >
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm font-medium">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        min={minCommitment}
                        className="w-full bg-transparent pl-8 pr-3 py-3.5 text-sm text-white outline-none placeholder:text-white/10"
                        placeholder={minCommitment.toString()}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-white/15">
                      <span>Min ${minCommitment}</span>
                      <span className="font-mono">Credit: ${user?.creditPool?.toLocaleString() || 0}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {ownershipPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-xl bg-cyan-500/[0.04] border border-cyan-500/15 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-white/30">Ownership Preview</span>
                            <span className="text-lg font-mono font-bold text-cyan-400">{ownershipPreview}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(Number(ownershipPreview) * 10, 100)}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                          <p className="text-[10px] text-white/15 mt-2">
                            Converted to PAC when pool reaches 100%
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-cyan-500/10 p-1.5 border border-cyan-500/20 shrink-0 mt-0.5">
                        <Shield className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-[11px] text-white/30 leading-relaxed">
                          Protected by the <span className="text-cyan-300 font-semibold">Protocol Infrastructure Reserve</span>. 
                          Covers insurance, legal structure, maintenance, operations, and payroll. 
                          The 8th Ledger commands. You own.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={cn(
                      "w-full h-12 rounded-xl font-bold text-sm transition-all duration-300",
                      success
                        ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                        : "bg-cyan-500 hover:bg-cyan-400 text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                    )}
                    disabled={submitting || success}
                  >
                    {success ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Committed Successfully
                      </span>
                    ) : submitting ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Committing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4" />
                        Confirm Commitment
                      </span>
                    )}
                  </Button>

                  <AnimatePresence>
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={cn(
                          "rounded-xl p-3 text-xs text-center font-medium",
                          message.includes("Committed")
                            ? "bg-emerald-500/[0.06] text-emerald-400 border border-emerald-500/15"
                            : "bg-red-500/[0.06] text-red-400 border border-red-500/15"
                        )}
                      >
                        {message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}