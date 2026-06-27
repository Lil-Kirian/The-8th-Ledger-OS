"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Fingerprint,
  Globe,
  Clock,
  Cpu,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// ============================================================
// TYPES
// ============================================================

type AuthStep = "totp" | "pin" | "webauthn" | "geo" | "device" | "timewindow";

interface GateStatus {
  step: AuthStep;
  label: string;
  description: string;
  verified: boolean;
  required: boolean;
  icon: React.ElementType;
  color: string;
}

interface AdminGateProps {
  onVerified?: () => void;
  redirectTo?: string;
  requiredRole?: "admin" | "primaryAdmin";
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminGate({ onVerified, redirectTo, requiredRole = "admin" }: AdminGateProps) {
  const { user, isPrimaryAdmin, isAdmin, ledgerId, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateStatus, setGateStatus] = useState<GateStatus[]>([]);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  // Determine if primary admin (6-factor) or sub-admin (3-factor)
  const isPrimary = isPrimaryAdmin || requiredRole === "primaryAdmin";

  // Initialize gate status based on role
  useEffect(() => {
    if (!user) return;

    const steps: GateStatus[] = isPrimary
      ? [
          {
            step: "totp",
            label: "TOTP Verification",
            description: "Time-based one-time password",
            verified: false,
            required: true,
            icon: KeyRound,
            color: "text-cyan-400",
          },
          {
            step: "pin",
            label: "PIN Verification",
            description: "6-digit fortress PIN",
            verified: false,
            required: true,
            icon: Lock,
            color: "text-amber-400",
          },
          {
            step: "webauthn",
            label: "Hardware Key",
            description: "WebAuthn biometric key",
            verified: false,
            required: true,
            icon: Fingerprint,
            color: "text-emerald-400",
          },
          {
            step: "geo",
            label: "Geographic Lock",
            description: "Trusted location verification",
            verified: false,
            required: true,
            icon: Globe,
            color: "text-violet-400",
          },
          {
            step: "device",
            label: "Device Fingerprint",
            description: "Trusted device recognition",
            verified: false,
            required: true,
            icon: Cpu,
            color: "text-rose-400",
          },
          {
            step: "timewindow",
            label: "Time Window",
            description: "Authorized access hours",
            verified: false,
            required: true,
            icon: Clock,
            color: "text-orange-400",
          },
        ]
      : [
          {
            step: "totp",
            label: "TOTP Verification",
            description: "Time-based one-time password",
            verified: false,
            required: true,
            icon: KeyRound,
            color: "text-cyan-400",
          },
          {
            step: "pin",
            label: "PIN Verification",
            description: "4-digit operational PIN",
            verified: false,
            required: true,
            icon: Lock,
            color: "text-amber-400",
          },
          {
            step: "device",
            label: "Device Fingerprint",
            description: "Trusted device recognition",
            verified: false,
            required: true,
            icon: Cpu,
            color: "text-rose-400",
          },
        ];

    setGateStatus(steps);
    setCurrentStep("totp");
  }, [user, isPrimary]);

  // Check existing session state on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/founder/totp", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data.totpVerified) {
            updateGateStatus("totp", true);
            setCurrentStep("pin");
          }
        }
      } catch {
        // Silent fail
      }
    };
    checkSession();
  }, []);

  const updateGateStatus = (step: AuthStep, verified: boolean) => {
    setGateStatus((prev) =>
      prev.map((g) => (g.step === step ? { ...g, verified } : g))
    );
  };

  const getNextStep = (current: AuthStep): AuthStep | null => {
    const idx = gateStatus.findIndex((g) => g.step === current);
    if (idx === -1) return null;
    const next = gateStatus[idx + 1];
    return next ? next.step : null;
  };

  const allVerified = gateStatus.every((g) => g.verified || !g.required);

  useEffect(() => {
    if (allVerified && onVerified) {
      onVerified();
    }
  }, [allVerified, onVerified]);

  // ============================================================
  // TOTP HANDLER
  // ============================================================

  const handleTOTP = async () => {
    if (totpCode.length !== 6) {
      setError("Enter 6-digit TOTP code");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const endpoint = isPrimary
        ? "/api/auth/founder/totp"
        : "/api/auth/admin/totp";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-login", code: totpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "TOTP verification failed");
        setAttemptsRemaining((p) => Math.max(0, p - 1));
        return;
      }

      updateGateStatus("totp", true);
      setTotpCode("");
      setAttemptsRemaining(3);

      if (isPrimary && data.founderTotpVerifiedAt) {
        setSessionExpiry(new Date(Date.now() + 15 * 60 * 1000));
      } else if (!isPrimary && data.adminTotpVerifiedAt) {
        setSessionExpiry(new Date(Date.now() + 120 * 60 * 1000));
      }

      const next = getNextStep("totp");
      setCurrentStep(next);
    } catch {
      setError("Network error. Retry.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PIN HANDLER
  // ============================================================

  const handlePIN = async () => {
    const requiredLength = isPrimary ? 6 : 4;
    if (pinCode.length !== requiredLength) {
      setError(`Enter ${requiredLength}-digit PIN`);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const endpoint = isPrimary
        ? "/api/auth/founder/pin"
        : "/api/auth/admin/pin";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", pin: pinCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.lockedUntil) {
          const mins = Math.ceil((new Date(data.lockedUntil).getTime() - Date.now()) / 60000);
          setLockoutMinutes(mins);
          setError(`Locked out. Retry in ${mins} minutes.`);
        } else {
          setError(data.error || "PIN verification failed");
          setAttemptsRemaining(data.attemptsRemaining ?? 0);
        }
        return;
      }

      updateGateStatus("pin", true);
      setPinCode("");
      setLockoutMinutes(0);
      setAttemptsRemaining(3);

      const next = getNextStep("pin");
      setCurrentStep(next);
    } catch {
      setError("Network error. Retry.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // WEBAUTHN HANDLER
  // ============================================================

  const handleWebAuthn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Start authentication
      const startRes = await fetch("/api/auth/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "start" }),
      });

      if (!startRes.ok) {
        setError("WebAuthn not enrolled. Contact the Council.");
        return;
      }

      const options = await startRes.json();

      // Step 2: Get credential (requires browser support)
      if (!window.PublicKeyCredential) {
        setError("Hardware keys not supported on this device.");
        return;
      }

      // Convert base64url challenge
      const challenge = Uint8Array.from(atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
      const allowCredentials = options.allowCredentials?.map((cred: unknown) => ({
        id: Uint8Array.from(atob(cred.id.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
        type: cred.type,
      }));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials,
          rpId: options.rpId,
          userVerification: options.userVerification,
          timeout: options.timeout,
        },
      });

      if (!assertion) {
        setError("Hardware key verification cancelled.");
        return;
      }

      // Step 3: Finish authentication
      const finishRes = await fetch("/api/auth/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "finish",
          id: btoa(String.fromCharCode(...new Uint8Array((assertion as unknown).rawId))),
          rawId: btoa(String.fromCharCode(...new Uint8Array((assertion as unknown).rawId))),
          response: {
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array((assertion as unknown).response.authenticatorData))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((assertion as unknown).response.clientDataJSON))),
            signature: btoa(String.fromCharCode(...new Uint8Array((assertion as unknown).response.signature))),
            userHandle: (assertion as unknown).response.userHandle
              ? btoa(String.fromCharCode(...new Uint8Array((assertion as unknown).response.userHandle)))
              : null,
          },
          type: "public-key",
          clientExtensionResults: (assertion as unknown).getClientExtensionResults(),
        }),
      });

      const finishData = await finishRes.json();

      if (!finishRes.ok) {
        setError(finishData.error || "Hardware key verification failed.");
        return;
      }

      updateGateStatus("webauthn", true);
      const next = getNextStep("webauthn");
      setCurrentStep(next);
    } catch (err: unknown) {
      setError(err.message || "Hardware key error.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GEO HANDLER
  // ============================================================

  const handleGeo = async () => {
    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const res = await fetch("/api/auth/geo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Geographic verification failed.");
        return;
      }

      updateGateStatus("geo", true);
      const next = getNextStep("geo");
      setCurrentStep(next);
    } catch {
      setError("Location access denied or unavailable.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DEVICE & TIME WINDOW (Auto-checked)
  // ============================================================

  const handleDeviceCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      // Device fingerprint is checked server-side via middleware
      // We just verify the session cookie is valid
      const res = await fetch("/api/auth/route", { method: "GET" });
      if (res.ok) {
        updateGateStatus("device", true);
        const next = getNextStep("device");
        setCurrentStep(next);
      } else {
        setError("Device fingerprint mismatch. Use enrolled device.");
      }
    } catch {
      setError("Device verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeWindow = async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const hour = now.getUTCHours();
      // Default window: 8-23 UTC
      const inWindow = hour >= 8 && hour <= 23;

      if (!inWindow) {
        setError(`Access window closed. Available 08:00–23:00 UTC. Current: ${hour}:00 UTC.`);
        return;
      }

      updateGateStatus("timewindow", true);
      const next = getNextStep("timewindow");
      setCurrentStep(next);
    } catch {
      setError("Time window check failed.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <ShieldAlert size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-200">Authentication Required</h2>
          <p className="text-sm text-slate-500">Login to access the 8th Ledger Command Center.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isPrimaryAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <ShieldAlert size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-200">Access Denied</h2>
          <p className="text-sm text-slate-500">
            This fortress requires {isPrimary ? "Primary Admin" : "Admin"} clearance. Your current role does not grant access.
          </p>
          <button
            onClick={logout}
            className="px-6 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/40 mb-2">
            <Shield size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            {isPrimary ? "Primary Admin Fortress" : "Admin Fortress"}
          </h1>
          <p className="text-sm text-slate-500">
            {isPrimary
              ? "6-factor authentication required. The 8th Ledger protects the protocol."
              : "3-factor authentication required. Operational access only."}
          </p>
          {ledgerId && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <Crown size={12} className={isPrimary ? "text-amber-400" : "text-slate-500"} />
              <span className="text-[11px] font-mono text-slate-400">{ledgerId}</span>
            </div>
          )}
        </div>

        {/* Gate Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Fortress Progress</span>
            <span className="text-[10px] font-mono text-slate-400">
              {gateStatus.filter((g) => g.verified).length} / {gateStatus.length} Gates
            </span>
          </div>
          <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500/60 rounded-full transition-all duration-700"
              style={{
                width: `${(gateStatus.filter((g) => g.verified).length / gateStatus.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Gate Cards */}
        <div className="space-y-3 mb-8">
          {gateStatus.map((gate) => {
            const Icon = gate.icon;
            const isActive = currentStep === gate.step;
            const isDone = gate.verified;

            return (
              <div
                key={gate.step}
                className={cn(
                  "relative p-4 rounded-xl border transition-all duration-300",
                  isDone
                    ? "bg-emerald-950/10 border-emerald-800/20"
                    : isActive
                    ? "bg-slate-800/30 border-cyan-700/30 shadow-lg shadow-cyan-900/5"
                    : "bg-slate-800/10 border-slate-800/20 opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center border shrink-0",
                      isDone
                        ? "bg-emerald-900/20 border-emerald-700/30"
                        : isActive
                        ? "bg-cyan-900/20 border-cyan-700/30"
                        : "bg-slate-800/30 border-slate-700/30"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Icon size={20} className={isActive ? gate.color : "text-slate-600"} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isDone ? "text-emerald-400" : isActive ? "text-slate-200" : "text-slate-600"
                        )}
                      >
                        {gate.label}
                      </span>
                      {isDone && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/20 text-emerald-400 font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{gate.description}</p>
                  </div>

                  {isActive && !isDone && (
                    <div className="shrink-0">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Active Input Area */}
                {isActive && !isDone && (
                  <div className="mt-4 pt-4 border-t border-slate-800/30">
                    {gate.step === "totp" && (
                      <div className="space-y-3">
                        <label className="text-[11px] text-slate-500 uppercase tracking-wider">
                          Enter 6-Digit TOTP Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className="flex-1 px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-200 text-center text-lg font-mono tracking-[0.5em] placeholder:text-slate-700 focus:outline-none focus:border-cyan-600/50 focus:ring-1 focus:ring-cyan-600/20 transition-all"
                            onKeyDown={(e) => e.key === "Enter" && handleTOTP()}
                          />
                          <button
                            onClick={handleTOTP}
                            disabled={loading || totpCode.length !== 6}
                            className="px-5 py-3 rounded-lg bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                          >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                          </button>
                        </div>
                        {attemptsRemaining < 3 && (
                          <p className="text-[11px] text-amber-400">
                            {attemptsRemaining} attempts remaining
                          </p>
                        )}
                      </div>
                    )}

                    {gate.step === "pin" && (
                      <div className="space-y-3">
                        <label className="text-[11px] text-slate-500 uppercase tracking-wider">
                          Enter {isPrimary ? "6" : "4"}-Digit PIN
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showPin ? "text" : "password"}
                              inputMode="numeric"
                              maxLength={isPrimary ? 6 : 4}
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                              placeholder={isPrimary ? "••••••" : "••••"}
                              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-200 text-center text-lg font-mono tracking-[0.5em] placeholder:text-slate-700 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-all"
                              onKeyDown={(e) => e.key === "Enter" && handlePIN()}
                            />
                            <button
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                            >
                              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <button
                            onClick={handlePIN}
                            disabled={loading || pinCode.length !== (isPrimary ? 6 : 4)}
                            className="px-5 py-3 rounded-lg bg-amber-600 border border-amber-500 text-white text-sm font-bold hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                          >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                          </button>
                        </div>
                        {lockoutMinutes > 0 && (
                          <p className="text-[11px] text-red-400">
                            Locked out. Retry in {lockoutMinutes} minutes.
                          </p>
                        )}
                      </div>
                    )}

                    {gate.step === "webauthn" && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500">
                          Touch your hardware security key or use biometric authentication.
                        </p>
                        <button
                          onClick={handleWebAuthn}
                          disabled={loading}
                          className="w-full px-4 py-3.5 rounded-lg bg-emerald-600 border border-emerald-500 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                          Verify Hardware Key
                        </button>
                      </div>
                    )}

                    {gate.step === "geo" && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500">
                          Allow location access to verify you are within the trusted geographic radius.
                        </p>
                        <button
                          onClick={handleGeo}
                          disabled={loading}
                          className="w-full px-4 py-3.5 rounded-lg bg-violet-600 border border-violet-500 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                          Verify Location
                        </button>
                      </div>
                    )}

                    {gate.step === "device" && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500">
                          Device fingerprint verification is automatic. Click to confirm.
                        </p>
                        <button
                          onClick={handleDeviceCheck}
                          disabled={loading}
                          className="w-full px-4 py-3.5 rounded-lg bg-rose-600 border border-rose-500 text-white text-sm font-bold hover:bg-rose-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Cpu size={16} />}
                          Verify Device
                        </button>
                      </div>
                    )}

                    {gate.step === "timewindow" && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500">
                          Access is restricted to authorized hours (08:00–23:00 UTC).
                        </p>
                        <button
                          onClick={handleTimeWindow}
                          disabled={loading}
                          className="w-full px-4 py-3.5 rounded-lg bg-orange-600 border border-orange-500 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                          Verify Time Window
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/10 border border-red-800/20 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-300">{error}</p>
              <p className="text-[10px] text-red-400/60 mt-0.5">
                All attempts are logged to the Security Audit Trail.
              </p>
            </div>
          </div>
        )}

        {/* Success / All Verified */}
        {allVerified && (
          <div className="p-6 rounded-xl bg-emerald-950/10 border border-emerald-800/20 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-900/20 flex items-center justify-center border border-emerald-700/30">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-emerald-400">Fortress Cleared</h3>
            <p className="text-sm text-emerald-300/70">
              All {gateStatus.length} gates verified. Welcome to the 8th Ledger Command Center.
            </p>
            {sessionExpiry && (
              <p className="text-[11px] text-emerald-400/50 font-mono">
                Session expires: {sessionExpiry.toLocaleTimeString()}
              </p>
            )}
            {redirectTo && (
              <a
                href={redirectTo}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 border border-emerald-500 text-white text-sm font-bold hover:bg-emerald-500 transition-all mt-2"
              >
                Enter Command Center
                <ChevronRight size={16} />
              </a>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-700">
            8th Ledger Security Fortress v3.2 • All actions are immutable and auditable.
          </p>
        </div>
      </div>
    </div>
  );
}