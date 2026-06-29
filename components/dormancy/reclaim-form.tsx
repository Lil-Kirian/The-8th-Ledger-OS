"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Unlock,
  Shield,
  Hash,
  Fingerprint,
  CheckCircle2,
  X,
  Key,
} from "lucide-react";

interface ReclaimFormProps {
  vaultItem: {
    id: string;
    hallId: string;
    hallName: string;
    vertical: string;
    percent: number;
    dynamicValue: number;
    accumulatedDividends: number;
    vaultedAt: string;
  };
  onReclaim: (vaultId: string, identityVerified: boolean) => void;
  onCancel: () => void;
}

export default function ReclaimForm({
  vaultItem,
  onReclaim,
  onCancel,
}: ReclaimFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const totalValue = vaultItem.percent * vaultItem.dynamicValue + vaultItem.accumulatedDividends;

  const handleVerify = () => {
    setIdentityVerified(true);
    setStep(2);
  };

  const handleConfirm = () => {
    onReclaim(vaultItem.id, identityVerified);
    setStep(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-w-lg mx-auto shadow-2xl shadow-black/50"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-cyan-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/30 border border-cyan-900/50 flex items-center justify-center">
              <Unlock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Reclaim from Vault</h2>
              <p className="text-xs text-slate-500">
                {vaultItem.hallName} — #{vaultItem.hallId}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 space-y-5"
          >
            {/* Asset Summary */}
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Asset</span>
                <span className="text-xs text-cyan-400">{vaultItem.vertical}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Ownership</span>
                  <span className="text-slate-200 font-bold">{vaultItem.percent}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dynamic Value</span>
                  <span className="text-slate-200">
                    ${vaultItem.dynamicValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Accumulated Dividends</span>
                  <span className="text-emerald-400">
                    +${vaultItem.accumulatedDividends.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-slate-800 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-300 font-bold">Total Reclaim Value</span>
                  <span className="text-cyan-400 font-bold">
                    ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Identity Verification */}
            <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-xl">
              <div className="flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-amber-400">Identity Verification Required</div>
                  <p className="text-xs text-amber-400/70 mt-1">
                    The 8th Ledger must verify your identity before releasing vaulted assets. 
                    This protects against unauthorized reclamation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="identity-verify"
                checked={identityVerified}
                onChange={(e) => setIdentityVerified(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-900"
              />
              <label htmlFor="identity-verify" className="text-sm text-slate-300 cursor-pointer">
                I confirm my identity matches government ID on file
              </label>
            </div>

            <button
              onClick={handleVerify}
              disabled={!identityVerified}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-slate-950 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Verify & Continue
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 space-y-5"
          >
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-emerald-400">Identity Verified</div>
                <p className="text-xs text-emerald-400/70 mt-1">
                  8th Ledger Protocol has confirmed your identity. Ready to reclaim.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                Reclaim Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Vault ID</span>
                  <span className="text-slate-200 font-mono">{vaultItem.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Asset</span>
                  <span className="text-slate-200">{vaultItem.hallName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Ownership Restored</span>
                  <span className="text-slate-200 font-bold">{vaultItem.percent}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dividends Credited</span>
                  <span className="text-emerald-400">
                    ${vaultItem.accumulatedDividends.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Key className="w-3.5 h-3.5" />
                <span>
                  Reclaim hash will be generated: <span className="font-mono">RECLAIM-{vaultItem.id.slice(-6)}</span>
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-slate-800 rounded-lg text-slate-400 text-sm hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-slate-950 text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Reclaim Now
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 flex flex-col items-center justify-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-center"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <h3 className="text-lg font-bold text-emerald-400">Reclaim Complete</h3>
            <p className="text-sm text-slate-400 text-center">
              Your {vaultItem.percent}% ownership in {vaultItem.hallName} has been restored.
            </p>
            <div className="px-3 py-1.5 bg-slate-900 rounded-md text-xs font-mono text-slate-500 border border-slate-800">
              HASH: RECLAIM-{vaultItem.id.slice(-6)}
            </div>
            <div className="text-xs text-emerald-400/70">
              ${vaultItem.accumulatedDividends.toLocaleString(undefined, { maximumFractionDigits: 2 })} dividends credited to wallet
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}