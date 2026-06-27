// components/agora/suggestion-form.tsx
// 8th Ledger — The Stoa Petition Form
// "Every suggestion is a seed planted in sovereign soil."

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Feather,
  Shield,
  Scroll,
  Sparkles,
  Globe,
  Building2,
  PenTool,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface SuggestionFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    continent: string;
    vertical: string;
  }) => Promise<void>;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM — The Petition Config
// ─────────────────────────────────────────────────────────────

const CONTINENTS = [
  { value: "africa", label: "Africa", emoji: "🌍", desc: "Emerging markets, vast resources" },
  { value: "asia", label: "Asia", emoji: "🌏", desc: "Tech hubs, manufacturing power" },
  { value: "europe", label: "Europe", emoji: "🌍", desc: "Stable markets, innovation" },
  { value: "americas", label: "Americas", emoji: "🌎", desc: "Diverse economies, scale" },
  { value: "middle_east", label: "Middle East", emoji: "🌍", desc: "Energy, strategic position" },
  { value: "oceania", label: "Oceania", emoji: "🌏", desc: "Growth, natural assets" },
] as const;

const VERTICALS = [
  { value: "ledgerprop", label: "LedgerProp", emoji: "🏠", desc: "Real estate & property", color: "from-blue-500/20 to-blue-600/10" },
  { value: "ledgerauto", label: "LedgerAuto", emoji: "🚗", desc: "Vehicles & fleets", color: "from-red-500/20 to-red-600/10" },
  { value: "ledgertech", label: "LedgerTech", emoji: "📱", desc: "Electronics & equipment", color: "from-purple-500/20 to-purple-600/10" },
  { value: "ledgeredu", label: "LedgerEdu", emoji: "🎓", desc: "Education & training", color: "from-indigo-500/20 to-indigo-600/10" },
  { value: "ledgerhealth", label: "LedgerHealth", emoji: "🏥", desc: "Medical & wellness", color: "from-rose-500/20 to-rose-600/10" },
  { value: "ledgerbiz", label: "LedgerBiz", emoji: "🏗️", desc: "Business operations", color: "from-amber-500/20 to-amber-600/10" },
  { value: "ledgertravel", label: "LedgerTravel", emoji: "✈️", desc: "Transport & charter", color: "from-sky-500/20 to-sky-600/10" },
  { value: "ledgeragri", label: "LedgerAgri", emoji: "🌾", desc: "Agriculture & farms", color: "from-emerald-500/20 to-emerald-600/10" },
  { value: "ledgerenergy", label: "LedgerEnergy", emoji: "⚡", desc: "Power & renewables", color: "from-yellow-500/20 to-yellow-600/10" },
  { value: "ledgeraccess", label: "LedgerAccess", emoji: "📡", desc: "Infrastructure & towers", color: "from-teal-500/20 to-teal-600/10" },
] as const;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function useCharCount(value: string, max: number) {
  const count = value.length;
  const pct = Math.min((count / max) * 100, 100);
  const isValid = count > 0;
  const isNearLimit = pct > 80;
  const isOverLimit = count > max;

  return { count, pct, isValid, isNearLimit, isOverLimit };
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function KycGate({ tier }: { tier?: string }) {
  const isLocked = !tier || tier === "visitor";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        mb-6 p-4 rounded-xl border backdrop-blur-sm
        ${isLocked
          ? "bg-amber-950/20 border-amber-500/20"
          : "bg-emerald-950/20 border-emerald-500/20"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${isLocked ? "bg-amber-500/10" : "bg-emerald-500/10"}
          `}
        >
          {isLocked ? (
            <Shield className="w-5 h-5 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
        </div>
        <div>
          <h3
            className={`text-sm font-bold ${isLocked ? "text-amber-300" : "text-emerald-300"}`}
          >
            {isLocked ? "Identity Verification Required" : "Sovereign Identity Verified"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {isLocked
              ? "You need Sovereign tier or higher to submit petitions to The Stoa. Complete KYC verification to unlock this privilege."
              : `Your ${tier} tier grants you the right to propose assets. The community will vote on your suggestion.`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function CharCounter({
  count,
  max,
  pct,
  isNearLimit,
  isOverLimit,
  label,
}: {
  count: number;
  max: number;
  pct: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isOverLimit
              ? "bg-red-400"
              : isNearLimit
              ? "bg-amber-400"
              : "bg-cyan-400"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span
        className={`text-[10px] font-mono tabular-nums ${
          isOverLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-slate-600"
        }`}
      >
        {count}/{max}
      </span>
    </div>
  );
}

function ContinentCard({
  continent,
  isSelected,
  onClick,
}: {
  continent: (typeof CONTINENTS)[number];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
        ${isSelected
          ? "bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
          : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700/60 hover:bg-slate-800/30"
        }
      `}
    >
      {isSelected && (
        <motion.div
          layoutId="continent-check"
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-slate-950" />
        </motion.div>
      )}
      <span className="text-2xl">{continent.emoji}</span>
      <span className={`text-xs font-semibold ${isSelected ? "text-cyan-300" : "text-slate-400"}`}>
        {continent.label}
      </span>
      <span className="text-[10px] text-slate-600 text-center leading-tight">
        {continent.desc}
      </span>
    </motion.button>
  );
}

function VerticalCard({
  vertical,
  isSelected,
  onClick,
}: {
  vertical: (typeof VERTICALS)[number];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left
        ${isSelected
          ? `bg-gradient-to-r ${vertical.color} border-white/10 shadow-lg`
          : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700/60 hover:bg-slate-800/30"
        }
      `}
    >
      {isSelected && (
        <motion.div
          layoutId="vertical-check"
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
      <span className="text-xl">{vertical.emoji}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold block ${isSelected ? "text-white" : "text-slate-400"}`}>
          {vertical.label}
        </span>
        <span className={`text-[10px] block ${isSelected ? "text-white/60" : "text-slate-600"}`}>
          {vertical.desc}
        </span>
      </div>
    </motion.button>
  );
}

function SuccessState({ onClose }: { onClose?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4"
      >
        <Sparkles className="w-8 h-8 text-emerald-400" />
      </motion.div>
      <h3 className="text-lg font-bold text-emerald-300 mb-2">Petition Filed</h3>
      <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
        Your suggestion has been submitted to The Stoa. The community will review and vote. The Architect is watching.
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
        >
          Close
        </button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function SuggestionForm({ onSubmit, onClose }: SuggestionFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [continent, setContinent] = useState("");
  const [vertical, setVertical] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(
    () =>
      user?.kycTier === "sovereign" ||
      user?.kycTier === "verified" ||
      user?.kycTier === "whale" ||
      user?.role === "admin",
    [user]
  );

  const titleMeta = useCharCount(title, 200);
  const descMeta = useCharCount(description, 2000);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!canSubmit) {
        setError("Sovereign tier or higher required to submit petitions.");
        return;
      }

      if (title.trim().length < 5) {
        setError("Title must be at least 5 characters.");
        return;
      }

      if (description.trim().length < 20) {
        setError("Description must be at least 20 characters.");
        return;
      }

      if (!continent) {
        setError("Select a continent for the asset.");
        return;
      }

      if (!vertical) {
        setError("Select a vertical for the asset.");
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit({
          title: title.trim(),
          description: description.trim(),
          continent,
          vertical,
        });
        setSuccess(true);
      } catch (err: unknown) {
        setError(err.message || "Failed to submit petition.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [canSubmit, title, description, continent, vertical, onSubmit]
  );

  if (success) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-slate-950/60 backdrop-blur-xl overflow-hidden">
        <SuccessState onClose={onClose} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-slate-800/50 bg-slate-950/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Feather className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                File a Petition
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Propose an asset to The Stoa for Meridian Cycle review
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-500 hover:text-slate-300 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* KYC Gate */}
        <KycGate tier={user?.kycTier} />

        {/* Title */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <PenTool className="w-3.5 h-3.5" />
            Asset Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Nairobi Solar Farm — 50MW Grid Connection"
            maxLength={200}
            disabled={!canSubmit}
            className={`
              w-full px-4 py-3 rounded-xl bg-slate-900/60 border text-sm
              placeholder:text-slate-700 text-slate-100
              focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40
              transition-all disabled:opacity-30
              ${titleMeta.isOverLimit ? "border-red-500/30" : "border-slate-800/60"}
            `}
          />
          <CharCounter
            count={titleMeta.count}
            max={200}
            pct={titleMeta.pct}
            isNearLimit={titleMeta.isNearLimit}
            isOverLimit={titleMeta.isOverLimit}
            label="Title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Scroll className="w-3.5 h-3.5" />
            Justification & Details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the asset, its location, market opportunity, revenue potential, and why the 8th Ledger should forge it into a pool..."
            rows={5}
            maxLength={2000}
            disabled={!canSubmit}
            className={`
              w-full px-4 py-3 rounded-xl bg-slate-900/60 border text-sm
              placeholder:text-slate-700 text-slate-100
              focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40
              transition-all resize-none disabled:opacity-30
              ${descMeta.isOverLimit ? "border-red-500/30" : "border-slate-800/60"}
            `}
          />
          <CharCounter
            count={descMeta.count}
            max={2000}
            pct={descMeta.pct}
            isNearLimit={descMeta.isNearLimit}
            isOverLimit={descMeta.isOverLimit}
            label="Description"
          />
        </div>

        {/* Continent Selection */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Globe className="w-3.5 h-3.5" />
            Target Continent
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CONTINENTS.map((c) => (
              <ContinentCard
                key={c.value}
                continent={c}
                isSelected={continent === c.value}
                onClick={() => setContinent(c.value)}
              />
            ))}
          </div>
        </div>

        {/* Vertical Selection */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5" />
            Asset Vertical
          </label>
          <div className="grid grid-cols-2 gap-2">
            {VERTICALS.map((v) => (
              <VerticalCard
                key={v.value}
                vertical={v}
                isSelected={vertical === v.value}
                onClick={() => setVertical(v.value)}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-red-400/8 border border-red-400/15"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-300 leading-relaxed">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className={`
            w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl
            text-sm font-bold uppercase tracking-wider transition-all duration-300
            ${canSubmit
              ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98]"
              : "bg-slate-800/30 border border-slate-700/30 text-slate-600 cursor-not-allowed"
            }
            ${isSubmitting ? "opacity-70" : ""}
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Filing Petition...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {canSubmit ? "Submit to The Stoa" : "Sovereign Tier Required"}
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}