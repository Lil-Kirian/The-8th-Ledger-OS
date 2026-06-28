// app/(auth)/recover/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Fingerprint, Mail, Shield, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
interface RecoverApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/* ============================================================
   RESPONSE PARSER
   ============================================================ */
function parseRecoverResponse(raw: any): RecoverApiResponse {
  if (typeof raw !== "object" || raw === null) {
    return { success: false, error: "Invalid response structure" };
  }
  const obj = raw as Record<string, unknown>;
  return {
    success: obj.success === true,
    error: typeof obj.error === "string" ? obj.error : undefined,
    message: typeof obj.message === "string" ? obj.message : undefined,
  };
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function RecoverPage() {
  const [email, setEmail] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const raw: any = await res.json();
      const data = parseRecoverResponse(raw);

      if (!res.ok || !data.success) {
        setError(data.error || data.message || "Recovery failed");
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Protocol connection failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
      >
        {/* Back to login */}
        <Link
          href="/enter"
          className="mb-6 inline-flex items-center gap-2 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Access
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 ring-1 ring-cyan-500/20">
            <Fingerprint className="h-7 w-7 text-cyan-400" />
          </div>
          <h1 className="font-space text-xl font-bold text-white">Recover Identity</h1>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            Enter the email bound to your sovereign identity. We will transmit your Ledger ID and a reset key to your secure channel.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 text-center"
            >
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Recovery Initiated</h3>
              <p className="mt-2 text-xs text-white/40">
                If a sovereign identity exists for <span className="text-cyan-300">{email}</span>, you will receive your Ledger ID and a secure reset link within minutes.
              </p>
              <Link
                href="/enter"
                className="mt-4 inline-block text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Return to Access →
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-start gap-2 rounded-lg bg-crimson/10 p-3 text-xs text-crimson"
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@8thledger.io"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 active:scale-[0.98] disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Initiate Recovery
                    </>
                  )}
                </span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Security note */}
        <div className="mt-6 border-t border-white/5 pt-4 text-center">
          <p className="text-[10px] leading-relaxed text-white/20">
            For security, recovery links expire in 15 minutes. If you no longer have access to your registered email, contact the Council of the Eighth Ledger.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
