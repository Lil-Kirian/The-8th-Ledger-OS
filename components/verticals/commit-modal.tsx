"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, Shield, Minus, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Pool {
  id: string;
  name: string;
  assetValue: number;
  committed: number;
  target: number;
  participants: number;
  maxParticipants: number;
  description: string;
}

interface CommitModalProps {
  open: boolean;
  pool: Pool | null;
  onClose: () => void;
  onConfirm: (poolId: string, amount: number) => void;
}

export function CommitModal({ open, pool, onClose, onConfirm }: CommitModalProps) {
  const [amount, setAmount] = useState(100);

  if (!open || !pool) return null;

  const returnAmount = amount * 0.5;
  const winChance = ((1 / pool.maxParticipants) * 100).toFixed(3);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a14] shadow-2xl"
          >
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-space text-lg font-semibold text-white">Commit Capital</h3>
                <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-white/5">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-slate-400">Pool</p>
                <p className="mt-1 font-space text-sm font-semibold text-white">{pool.name}</p>
                <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-500">
                  <span>Asset: ${pool.assetValue.toLocaleString()}</span>
                  <span>Participants: {pool.participants}/{pool.maxParticipants}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-slate-300">Commitment Amount (USD)</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAmount(Math.max(50, amount - 50))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center">
                    <span className="text-lg font-bold text-white">${amount}</span>
                  </div>
                  <button
                    onClick={() => setAmount(amount + 50)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4 space-y-2 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">If you WIN:</span>
                  <span className="font-semibold text-emerald-400">${pool.assetValue.toLocaleString()} asset</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">If you DO NOT win:</span>
                  <span className="font-semibold text-amber-300">${returnAmount} returned (50%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Platform surplus:</span>
                  <span className="font-semibold text-indigo-300">${returnAmount}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Win probability:</span>
                  <span className="font-semibold text-violet-300">~{winChance}%</span>
                </div>
              </div>

              <div className="mb-4 flex items-start gap-2 rounded-lg bg-white/[0.02] p-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <p className="text-[10px] leading-relaxed text-slate-500">
                  The 2X Surplus Model requires the pool to reach 2x the asset value before consensus.
                  Your full commitment helps fill the pool faster.
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                leftIcon={<Shield className="h-4 w-4" />}
                onClick={() => {
                  onConfirm(pool.id, amount);
                  onClose();
                }}
              >
                Confirm Commitment of ${amount}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}