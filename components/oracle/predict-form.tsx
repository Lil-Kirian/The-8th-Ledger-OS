"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface PredictFormProps {
  forecast: {
    id: string;
    title: string;
    continent?: string;
    verticalOptions: string[];
    countryOptions: string[];
  };
  onSubmit: (forecastId: string, vertical: string, country: string) => void;
  onCancel: () => void;
}

export default function PredictForm({
  forecast,
  onSubmit,
  onCancel,
}: PredictFormProps) {
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const isStep1Valid = selectedVertical !== null;
  const isStep2Valid = selectedCountry !== null;

  const handleSubmit = () => {
    if (selectedVertical && selectedCountry) {
      setStep(3);
      setTimeout(() => {
        onSubmit(forecast.id, selectedVertical, selectedCountry);
      }, 1500);
    }
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
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Oracle Forecast</h2>
              <p className="text-xs text-slate-500">{forecast.title}</p>
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
            <div>
              <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 block">
                Step 1 — Select Vertical
              </label>
              <div className="grid grid-cols-2 gap-3">
                {forecast.verticalOptions.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVertical(v)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedVertical === v
                        ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-950/10"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-sm font-semibold">{v}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {selectedVertical === v ? "Selected" : "Click to select"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="px-5 py-2.5 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-cyan-400 text-sm font-medium hover:bg-cyan-950/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
            <div>
              <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 block">
                Step 2 — Select Country
              </label>
              <div className="grid grid-cols-3 gap-2">
                {forecast.countryOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountry(c)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      selectedCountry === c
                        ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-lg mr-1">
                      {getFlagEmoji(c)}
                    </span>
                    <span className="text-xs font-medium">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Your prediction</div>
              <div className="text-sm font-semibold text-slate-200">
                {selectedVertical} + {selectedCountry || "..."}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isStep2Valid}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-slate-950 text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Seal Prediction
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
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-cyan-950/30 border border-cyan-900/50 flex items-center justify-center"
            >
              <Brain className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <h3 className="text-lg font-bold text-cyan-400">Recording to Oracle...</h3>
            <p className="text-sm text-slate-500 text-center">
              Your prediction is being hashed to the 8th Ledger.
            </p>
            <div className="w-full max-w-xs h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-cyan-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Footer */}
      {step < 3 && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              No money required. Predictions earn Oracle Standing points when correct. 
              One prediction per forecast per subject.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function getFlagEmoji(countryName: string): string {
  const flags: Record<string, string> = {
    "Nigeria": "🇳🇬", "Kenya": "🇰🇪", "South Africa": "🇿🇦", "Ghana": "🇬🇭",
    "India": "🇮🇳", "China": "🇨🇳", "Japan": "🇯🇵", "Singapore": "🇸🇬",
    "Germany": "🇩🇪", "UK": "🇬🇧", "France": "🇫🇷", "Netherlands": "🇳🇱",
    "USA": "🇺🇸", "Canada": "🇨🇦", "Brazil": "🇧🇷", "Mexico": "🇲🇽",
    "UAE": "🇦🇪", "Saudi Arabia": "🇸🇦", "Israel": "🇮🇱", "Qatar": "🇶🇦",
    "Australia": "🇦🇺", "New Zealand": "🇳🇿", "Fiji": "🇫🇯",
  };
  return flags[countryName] || "🌍";
}

function ChevronRight(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}