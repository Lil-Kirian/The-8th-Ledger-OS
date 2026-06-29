"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Building2,
  User,
  CheckCircle2,
  Send,
  Lock,
} from "lucide-react";
import { useRelay, sendRelayMessage } from "@/hooks/use-forge";

interface RelayPanelProps {
  hallId: string;
  workerId: string;
  workerRole: string;
  workerNumber: string;
}

export default function RelayPanel({
  hallId,
  workerId,
  workerRole,
  workerNumber,
}: RelayPanelProps) {
  const { messages, isLoading } = useRelay(hallId, workerId, 50);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (newMessage.trim().length < 10) return;

    setIsSending(true);
    try {
      await sendRelayMessage(hallId, workerId, {
        content: newMessage,
        direction: "hall_to_worker",
      });
      setNewMessage("");
    } catch (err) {
      console.error("Relay send failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl h-[500px] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading relay history...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">{workerRole}</div>
            <div className="text-xs text-slate-500 font-mono">{workerNumber}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/30 border border-emerald-900/50">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Relay Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No relay messages yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Start the conversation through 8th Ledger
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex ${msg.direction === "hall_to_worker" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    msg.direction === "hall_to_worker"
                      ? "bg-cyan-950/30 border border-cyan-900/50 text-cyan-100"
                      : "bg-slate-800 border border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 opacity-60">
                    {msg.direction === "hall_to_worker" ? (
                      <Building2 className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span className="text-xs">
                      {msg.direction === "hall_to_worker" ? "Hall" : "Worker"}
                    </span>
                    <span className="text-xs">•</span>
                    <span className="text-xs">
                      {new Date(msg.relayedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="leading-relaxed">{msg.content}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs opacity-60">{msg.status}</span>
                    <span className="text-xs opacity-40 ml-auto font-mono">
                      #{msg.id.slice(-6)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="flex items-start gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type message to relay through 8th Ledger..."
              rows={2}
              maxLength={500}
              className="w-full p-3 pr-12 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-900 focus:ring-1 focus:ring-cyan-900/50 transition-all resize-none"
            />
            <div className="absolute bottom-2 right-3 text-xs text-slate-600">
              {newMessage.length}/500
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={newMessage.trim().length < 10 || isSending}
            className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-lg text-slate-950 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Lock className="w-3 h-3 text-slate-600" />
          <span className="text-xs text-slate-600">
            All messages logged, hashed, and audited by 8th Ledger Protocol
          </span>
        </div>
      </div>
    </div>
  );
}