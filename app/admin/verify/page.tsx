"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield, Lock, KeyRound, ArrowRight, Loader2, AlertTriangle,
  CheckCircle2, QrCode, Settings, ChevronLeft, Zap, Copy, Check,
} from "lucide-react";

type Step = "checking" | "setup-totp" | "setup-totp-verify" | "setup-pin" | "totp" | "pin" | "complete";

type Status = {
  totpEnabled: boolean;
  pinSet: boolean;
  locked: boolean;
  lockMinutes: number;
};

export default function AdminVerifyPage() {
  const [step, setStep] = useState<Step>("checking");
  const [status, setStatus] = useState<Status | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [setupTotpSecret, setSetupTotpSecret] = useState("");
  const [setupTotpUrl, setSetupTotpUrl] = useState("");
  const [devCode, setDevCode] = useState(""); // ← NEW
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(0);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin/dashboard";

  useEffect(() => { checkStatus(); }, []);

  async function checkStatus() {
    try {
      const [pinRes, totpRes] = await Promise.all([
        fetch("/api/auth/admin/pin"),
        fetch("/api/auth/admin/totp"),
      ]);
      const pinData = await pinRes.json();
      const totpData = await totpRes.json();

      const s: Status = {
        totpEnabled: totpData.success ? totpData.enabled : false,
        pinSet: pinData.success ? pinData.pinSet : false,
        locked: pinData.success ? pinData.locked : false,
        lockMinutes: pinData.success ? pinData.lockMinutesRemaining : 0,
      };

      setStatus(s);
      if (s.locked) { setLocked(true); setLockMinutes(s.lockMinutes); setStep("totp"); return; }
      if (!s.totpEnabled) { setStep("setup-totp"); return; }
      if (!s.pinSet) { setStep("setup-pin"); return; }
      setStep("totp");
    } catch (err: unknown) {
      setError("Failed to check admin status. " + err.message);
      setStep("totp");
    }
  }

  function devBypass() {
    setStep("complete");
    setTimeout(() => { window.location.href = redirect; }, 500);
  }

  async function setupTotp() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSetupTotpSecret(data.secret);
      setSetupTotpUrl(data.otpauthUrl || "");
      setDevCode(data.devCode || ""); // ← CAPTURE CODE
      setStep("setup-totp-verify");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function verifySetupTotp(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpCode(""); setStep("setup-pin");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function setupPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (setupPin.length !== 4 || confirmPin.length !== 4) { setError("PIN must be 4 digits"); return; }
    if (setupPin !== confirmPin) { setError("PINs do not match"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/admin/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", pin: setupPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("complete");
      setTimeout(() => { window.location.href = redirect; }, 2000);
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-login", code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpCode(""); setStep("pin");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handlePin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 4) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/admin/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.locked) { setLocked(true); setLockMinutes(data.lockMinutes || 15); }
        throw new Error(data.error);
      }
      setLocked(false); setPin(""); setStep("complete");
      setTimeout(() => { window.location.href = redirect; }, 2000);
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  function copyCode() {
    if (!devCode) return;
    navigator.clipboard.writeText(devCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isSetup = step.startsWith("setup-");
  const steps = [{ id: "totp", label: "TOTP", icon: KeyRound }, { id: "pin", label: "PIN", icon: Lock }];
  const currentIndex = isSetup ? -1 : steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSetup ? "Operational Enrollment" : "Operational Control"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {isSetup ? "Configure your security layers" : "Three-layer authentication required"}
          </p>
        </div>

        {!isSetup && step !== "checking" && (
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentIndex;
              const isDone = i < currentIndex;
              return (
                <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                    isDone ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : isActive ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-white/20"
                  }`}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider ${isActive ? "text-cyan-400" : "text-white/20"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
          {step === "checking" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Scanning operational security layers...</p>
            </div>
          )}

          {step === "setup-totp" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white text-sm font-medium">Step 1: Configure TOTP</p>
                  <p className="text-gray-500 text-xs">Set up your admin authenticator</p>
                </div>
              </div>
              <button onClick={setupTotp} disabled={loading} className="w-full bg-cyan-500 text-black font-semibold py-3 rounded-xl hover:bg-cyan-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Generate Secret"}
              </button>
              {error && (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>
                  <button onClick={devBypass} className="w-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold py-2 rounded-lg hover:bg-amber-500/30 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" /> DEV BYPASS → Skip to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "setup-totp-verify" && (
            <form onSubmit={verifySetupTotp} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white text-sm font-medium">Verify Authenticator</p>
                  <p className="text-gray-500 text-xs">Enter the 6-digit code to confirm</p>
                </div>
              </div>

              {/* DEV CODE DISPLAY */}
              {devCode && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Dev Test Code</span>
                    <button type="button" onClick={copyCode} className="text-[10px] text-emerald-400 flex items-center gap-1 hover:text-emerald-300">
                      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-mono font-bold text-emerald-400 tracking-[0.3em]">{devCode}</span>
                  </div>
                  <p className="text-[10px] text-emerald-400/60 text-center">Use this code or type 000000 to bypass</p>
                </div>
              )}

              {setupTotpUrl && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] text-gray-500 font-mono break-all">{setupTotpUrl}</p>
                </div>
              )}
              <input
                type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:border-cyan-500 focus:outline-none placeholder:text-[#333]"
                placeholder="000000" autoFocus required
              />
              {error && (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>
                  <button onClick={devBypass} className="w-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold py-2 rounded-lg hover:bg-amber-500/30 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" /> DEV BYPASS → Skip to Dashboard
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full bg-cyan-500 text-black font-semibold py-3 rounded-xl hover:bg-cyan-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm & Continue"}
              </button>
            </form>
          )}

          {step === "setup-pin" && (
            <form onSubmit={setupPinSubmit} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white text-sm font-medium">Step 2: Create PIN</p>
                  <p className="text-gray-500 text-xs">4-digit operational PIN</p>
                </div>
              </div>
              <input type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                value={setupPin} onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-cyan-500 focus:outline-none placeholder:text-[#333]"
                placeholder="Create PIN" required />
              <input type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-cyan-500 focus:outline-none placeholder:text-[#333]"
                placeholder="Confirm PIN" required />
              {error && (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>
                  <button onClick={devBypass} className="w-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold py-2 rounded-lg hover:bg-amber-500/30 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" /> DEV BYPASS → Skip to Dashboard
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading || setupPin.length !== 4 || confirmPin.length !== 4} className="w-full bg-cyan-500 text-black font-semibold py-3 rounded-xl hover:bg-cyan-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Set PIN"}
              </button>
            </form>
          )}

          {step === "totp" && (
            <form onSubmit={handleTotp} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white text-sm font-medium">Admin TOTP</p>
                  <p className="text-gray-500 text-xs">6-digit code from admin authenticator</p>
                </div>
              </div>
              {locked && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-xs text-red-400">Account locked for {lockMinutes} minutes</p>
                </div>
              )}
              <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:border-cyan-500 focus:outline-none placeholder:text-[#333]"
                placeholder="000000" autoFocus required disabled={locked} />
              {error && (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>
                  <button onClick={devBypass} className="w-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold py-2 rounded-lg hover:bg-amber-500/30 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" /> DEV BYPASS → Skip to Dashboard
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading || totpCode.length !== 6 || locked} className="w-full bg-cyan-500 text-black font-semibold py-4 rounded-xl hover:bg-cyan-400 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify TOTP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePin} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white text-sm font-medium">Operational PIN</p>
                  <p className="text-gray-500 text-xs">4-digit personal identification number</p>
                </div>
              </div>
              <input type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:border-cyan-500 focus:outline-none placeholder:text-[#333]"
                placeholder="0000" autoFocus required />
              {error && (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                    {locked && <span className="block text-xs mt-1">Locked {lockMinutes} min</span>}
                  </p>
                  <button onClick={devBypass} className="w-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold py-2 rounded-lg hover:bg-amber-500/30 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" /> DEV BYPASS → Skip to Dashboard
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading || pin.length !== 4 || locked} className="w-full bg-cyan-500 text-black font-semibold py-4 rounded-xl hover:bg-cyan-400 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify PIN <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button onClick={() => { setStep("totp"); setTotpCode(""); setError(""); }} className="w-full text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back to TOTP
              </button>
            </form>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Operational Access Granted</h3>
              <p className="text-sm text-gray-400">All security layers passed. Redirecting to command center...</p>
              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-3">
                <p className="text-xs text-emerald-400 font-mono uppercase tracking-wider">Session: 2 hours · Auto-logout on idle</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-700 text-xs mt-8">
          8th Ledger Operational Security Layer v3.2<br />
          Three-Factor Authentication · Immutable Audit Trail
        </p>
      </div>
    </div>
  );
}