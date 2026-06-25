"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  X,
  ChevronRight,
  User,
  Building2,
} from "lucide-react";
import { sendRelayMessage } from "@/hooks/use-forge";

interface RelayMessageProps {
  hallId: string;
  worker: {
    id: string;
    workerNumber: string;
    role: string;
  };
  onSend: () => void;
  onCancel: () => void;
}

export default function RelayMessageForm({
  hallId,
  worker,
  onSend,
  onCancel,
}: RelayMessageProps) {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = content.trim().length >= 10 && content.trim().length <= 500;

  const handleSend = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await sendRelayMessage(hallId, worker.id, {
        content,
        direction: "hall_to_worker",
      });
      setContent("");
      onSend();
    } catch (err) {
      console.error("Relay failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-w-xl mx-auto shadow-2xl shadow-black/50"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-cyan-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/30 border border-cyan-900/50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">8th Ledger Relay</h2>
              <p className="text-xs text-slate-500">
                Hall #{hallId} → {worker.workerNumber}
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

      <div className="p-5 space-y-4">
        {/* Security Banner */}
        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex items-start gap-3">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="text-cyan-400 font-medium">Secured by 8th Ledger.</span> All messages are logged, 
            audited, and relayed through the protocol. The worker cannot see hall internals, ownership data, 
            or financials. Direct contact is prohibited.
          </div>
        </div>

        {/* Worker Target */}
        <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">{worker.role}</div>
            <div className="text-xs text-slate-500 font-mono">{worker.workerNumber}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/30 border border-emerald-900/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Active</span>
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Hall Message
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setShowPreview(e.target.value.length > 0);
            }}
            placeholder="Instructions, priorities, or questions for the worker. Be clear and specific..."
            rows={4}
            maxLength={500}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all resize-none"
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-slate-600">
              {content.length}/500 characters
            </span>
            <span className="text-xs text-slate-600">
              {isValid ? "Ready to relay" : "Min 10 characters"}
            </span>
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  Hall Message Preview
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{content}</p>
              </div>

              <div className="flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-slate-600 rotate-90" />
              </div>

              <div className="p-4 bg-cyan-950/10 border border-cyan-900/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-cyan-400 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  8th Ledger Relay Log
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Timestamped and hashed upon send</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Translated to worker protocol language</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Monitored for policy compliance</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/30">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={!isValid || isSubmitting}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-slate-950 text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "Relaying..." : "Relay Message"}
        </button>
      </div>
    </motion.div>
  );
}