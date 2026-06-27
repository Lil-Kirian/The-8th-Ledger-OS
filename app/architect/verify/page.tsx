// app/architect/verify/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Lock,
  KeyRound,
  Fingerprint,
  Globe,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Crown,
  ChevronLeft,
  CheckCircle2,
  QrCode,
  MapPin,
  Settings,
} from "lucide-react";

type Step = "checking" | "setup-totp" | "setup-pin" | "setup-webauthn" | "setup-geo" | "totp" | "pin" | "webauthn" | "geo" | "complete";

type Status = {
  totpEnabled: boolean;
  pinSet: boolean;
  webauthnEnrolled: boolean;
  geoEnrolled: boolean;
  locked: boolean;
  lockMinutes: number;
  windowStart: number;
  windowEnd: number;
};

export default function ArchitectVerifyPage() {
  const [step, setStep] = useState<Step>("checking");
  const [status, setStatus] = useState<Status | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [setupTotpSecret, setSetupTotpSecret] = useState("");
  const [setupTotpUrl, setSetupTotpUrl] = useState("");
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(0);
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/architect";

  /* ===== ON MOUNT: Check what needs setup ===== */
  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const pinRes = await fetch("/api/auth/founder/pin");
      const pinData = await pinRes.json();
      const totpRes = await fetch("/api/auth/founder/totp");
      const totpData = await totpRes.json();

      const s: Status = {
        totpEnabled: totpData.success ? totpData.enabled : false,
        pinSet: pinData.success ? pinData.pinSet : false,
        webauthnEnrolled: pinData.success ? pinData.webauthnEnrolled : false,
        geoEnrolled: pinData.success ? pinData.geoEnrolled : false,
        locked: pinData.success ? pinData.locked : false,
        lockMinutes: pinData.success ? pinData.lockMinutesRemaining : 0,
        windowStart: pinData.success ? pinData.windowStart : 8,
        windowEnd: pinData.success ? pinData.windowEnd : 23,
      };

      setStatus(s);

      if (s.locked) {
        setLocked(true);
        setLockMinutes(s.lockMinutes);
        setStep("totp");
        return;
      }

      if (!s.totpEnabled) { setStep("setup-totp"); return; }
      if (!s.pinSet) { setStep("setup-pin"); return; }
      if (!s.webauthnEnrolled) { setStep("setup-webauthn"); return; }
      if (!s.geoEnrolled) { setStep("setup-geo"); return; }

      setStep("totp");
    } catch (err: unknown) {
      setError("Failed to check fortress status. " + err.message);
      setStep("totp");
    }
  }

  /* ===== SETUP TOTP ===== */
  async function setupTotp() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/founder/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSetupTotpSecret(data.secret);
      setSetupTotpUrl(data.otpauthUrl || "");
      setStep("setup-totp-verify");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function verifySetupTotp(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/founder/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpCode("");
      setStep("setup-pin");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  /* ===== SETUP PIN ===== */
  async function setupPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (setupPin.length !== 6 || confirmPin.length !== 6) {
      setError("PIN must be 6 digits"); return;
    }
    if (setupPin !== confirmPin) {
      setError("PINs do not match"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/founder/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", pin: setupPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSetupPin(""); setConfirmPin("");
      setStep("setup-webauthn");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  /* ===== SETUP WEBAUTHN ===== */
  async function enrollWebAuthn() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "start" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (!window.PublicKeyCredential) {
        throw new Error("Hardware key not supported. Use Safari or Chrome with security key.");
      }

      const options = data.options;
      options.challenge = Uint8Array.from(atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
      options.user.id = Uint8Array.from(atob(options.user.id.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

      const credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential;
      if (!credential) throw new Error("Enrollment cancelled");

      const finishRes = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "finish",
          credential: {
            id: credential.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            response: {
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((credential.response as unknown).clientDataJSON))),
              attestationObject: btoa(String.fromCharCode(...new Uint8Array((credential.response as unknown).attestationObject))),
            },
            type: credential.type,
          },
        }),
      });

      const finishData = await finishRes.json();
      if (!finishRes.ok) throw new Error(finishData.error || "Enrollment failed");
      setStep("setup-geo");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  /* ===== SETUP GEO ===== */
  async function enrollGeo() {
    setLoading(true); setError("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setGeoLat(lat); setGeoLng(lng);

      const res = await fetch("/api/auth/geo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep("complete");
      setTimeout(() => { window.location.href = redirect; }, 2000);
    } catch (err: unknown) {
      setError(err.message || "Location access required for fortress enrollment.");
    } finally { setLoading(false); }
  }

  /* ===== VERIFICATION: TOTP ===== */
  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/founder/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-login", code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotpCode("");
      setStep("pin");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  /* ===== VERIFICATION: PIN ===== */
  async function handlePin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/founder/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.locked) {
          setLocked(true);
          setLockMinutes(data.lockMinutes || 60);
        }
        throw new Error(data.error);
      }
      setLocked(false);
      setPin("");
      setStep("webauthn");
    } catch (err: unknown) { setError(err.message); }
    finally { setLoading(false); }
  }

  /* ===== VERIFICATION: WEBAUTHN ===== */
  async function startWebAuthn() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "start" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (!window.PublicKeyCredential) {
        throw new Error("Hardware key not supported.");
      }

      const options = data.options;
      options.challenge = Uint8Array.from(atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((cred: unknown) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
        }));
      }

      const credential = await navigator.credentials.get({ publicKey: options }) as PublicKeyCredential;
      if (!credential) throw new Error("Authentication cancelled");

      const authRes = await fetch("/api/auth/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "finish",
          credential: {
            id: credential.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            response: {
              authenticatorData: btoa(String.fromCharCode(...new Uint8Array((credential.response as unknown).authenticatorData))),
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((credential.response as unknown).clientDataJSON))),
              signature: btoa(String.fromCharCode(...new Uint8Array((credential.response as unknown).signature))),
              userHandle: (credential.response as unknown).userHandle ? btoa(String.fromCharCode(...new Uint8Array((credential.response as unknown).userHandle))) : null,
            },
            type: credential.type,
          },
        }),
      });

      const authData = await authRes.json();
      if (!authRes.ok) throw new Error(authData.error || "Hardware key verification failed");

      setStep("geo");
      runGeoCheck();
    } catch (err: unknown) { setError(err.message); setLoading(false); }
  }

  /* ===== VERIFICATION: GEO ===== */
  async function runGeoCheck() {
    setLoading(true); setError("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setGeoLat(lat); setGeoLng(lng);

      const res = await fetch("/api/auth/geo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep("complete");
      setTimeout(() => { window.location.href = redirect; }, 2000);
    } catch (err: unknown) {
      try {
        const res = await fetch("/api/auth/geo-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (res.ok) {
          setStep("complete");
          setTimeout(() => { window.location.href = redirect; }, 2000);
          return;
        }
      } catch {}
      setError(err.message || "Geographic verification failed.");
    } finally { setLoading(false); }
  }

  /* ===== RENDER ===== */
  const isSetup = step.startsWith("setup-");
  const steps = [
    { id: "totp", label: "TOTP", icon: KeyRound },
    { id: "pin", label: "PIN", icon: Lock },
    { id: "webauthn", label: "Hardware Key", icon: Fingerprint },
    { id: "geo", label: "Geo", icon: Globe },
  ];

  const currentIndex = isSetup ? -1 : steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSetup ? "Fortress Enrollment" : "Architect Override"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {isSetup ? "Configure your 6 security layers" : "6-factor authentication required"}
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
                    isDone ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : isActive ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-white/20"
                  }`}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider ${isActive ? "text-amber-400" : "text-white/20"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
          {step === "checking" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Scanning fortress security layers...</p>
            </div>
          )}

          {step === "setup-totp" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Step 1: Configure TOTP</p>
                  <p className="text-gray-500 text-xs">Set up your authenticator</p>
                </div>
              </div>
              <button onClick={setupTotp} disabled={loading} className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Generate Secret"}
              </button>
            </div>
          )}

          {step === "setup-totp-verify" && (
            <form onSubmit={verifySetupTotp} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Verify Authenticator</p>
                  <p className="text-gray-500 text-xs">Enter the 6-digit code to confirm</p>
                </div>
              </div>
              {setupTotpUrl && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] text-gray-500 font-mono break-all">{setupTotpUrl}</p>
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:border-amber-500 focus:outline-none placeholder:text-[#333]"
                placeholder="000000"
                autoFocus
                required
              />
              {error && <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>}
              <button type="submit" disabled={loading || totpCode.length !== 6} className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm & Continue"}
              </button>
            </form>
          )}

          {step === "setup-pin" && (
            <form onSubmit={setupPinSubmit} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Step 2: Create PIN</p>
                  <p className="text-gray-500 text-xs">6-digit Architect PIN</p>
                </div>
              </div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-amber-500 focus:outline-none placeholder:text-[#333]"
                placeholder="Create PIN"
                required
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-amber-500 focus:outline-none placeholder:text-[#333]"
                placeholder="Confirm PIN"
                required
              />
              {error && <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>}
              <button type="submit" disabled={loading || setupPin.length !== 6 || confirmPin.length !== 6} className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Set PIN"}
              </button>
            </form>
          )}

          {step === "setup-webauthn" && (
            <div className="text-center space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Fingerprint className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Step 3: Enroll Hardware Key</p>
                  <p className="text-gray-500 text-xs">TouchID, FaceID, or YubiKey</p>
                </div>
              </div>
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-amber-400" />
              </div>
              <p className="text-sm text-gray-400">When prompted, authenticate to enroll your security key.</p>
              {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>}
              <button onClick={enrollWebAuthn} disabled={loading} className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enroll Hardware Key"}
              </button>
            </div>
          )}

          {step === "setup-geo" && (
            <div className="text-center space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Step 4: Set Trusted Location</p>
                  <p className="text-gray-500 text-xs">Your current location becomes the anchor</p>
                </div>
              </div>
              <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Globe className="w-10 h-10 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-sm text-gray-400">Allow location access to set your trusted geographic anchor.</p>
              {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>}
              <button onClick={enrollGeo} disabled={loading} className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Set Trusted Location"}
              </button>
            </div>
          )}

          {step === "totp" && (
            <form onSubmit={handleTotp} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Primary Admin TOTP</p>
                  <p className="text-gray-500 text-xs">6-digit code from authenticator</p>
                </div>
              </div>
              {locked && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-xs text-red-400">Account locked for {lockMinutes} minutes</p>
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:border-amber-500 focus:outline-none placeholder:text-[#333]"
                placeholder="000000"
                autoFocus
                required
                disabled={locked}
              />
              {error && !locked && <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>}
              <button type="submit" disabled={loading || totpCode.length !== 6 || locked} className="w-full bg-amber-500 text-black font-semibold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify TOTP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePin} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Architect PIN</p>
                  <p className="text-gray-500 text-xs">6-digit personal identification number</p>
                </div>
              </div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#0a0a14] border border-[#333] rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono focus:border-amber-500 focus:outline-none placeholder:text-[#333]"
                placeholder="000000"
                autoFocus
                required
              />
              {error && (
                <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/50 rounded-lg py-2 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                  {locked && <span className="block text-xs mt-1">Locked {lockMinutes} min</span>}
                </p>
              )}
              <button type="submit" disabled={loading || pin.length !== 6 || locked} className="w-full bg-amber-500 text-black font-semibold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify PIN <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button onClick={() => { setStep("totp"); setTotpCode(""); setError(""); }} className="w-full text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back to TOTP
              </button>
            </form>
          )}

          {step === "webauthn" && (
            <div className="text-center space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Fingerprint className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Hardware Key</p>
                  <p className="text-gray-500 text-xs">TouchID, FaceID, or YubiKey required</p>
                </div>
              </div>
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-amber-400" />
              </div>
              <p className="text-sm text-gray-400">When prompted, authenticate with your enrolled security key.</p>
              {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>}
              <button onClick={startWebAuthn} disabled={loading} className="w-full bg-amber-500 text-black font-semibold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Authenticate Key <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button onClick={() => { setStep("pin"); setPin(""); setError(""); }} className="text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 mx-auto">
                <ChevronLeft className="w-3 h-3" /> Back to PIN
              </button>
            </div>
          )}

          {step === "geo" && (
            <div className="text-center space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white text-sm font-medium">Geographic Verification</p>
                  <p className="text-gray-500 text-xs">Confirming trusted location</p>
                </div>
              </div>
              <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Globe className="w-10 h-10 text-cyan-400 animate-pulse" />
              </div>
              {geoLat && geoLng && (
                <p className="text-xs font-mono text-gray-500">
                  Lat: {geoLat.toFixed(4)} · Lng: {geoLng.toFixed(4)}
                </p>
              )}
              {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg py-2">{error}</p>}
              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking location...
                </div>
              )}
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Architect Verified</h3>
              <p className="text-sm text-gray-400">
                All 6 factors verified. Redirecting to command center...
              </p>
              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-3">
                <p className="text-xs text-emerald-400 font-mono uppercase tracking-wider">
                  Session: 15 minutes · Auto-lock on idle
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-700 text-xs mt-8">
          8th Ledger Security Fortress
          <br />
          6-Factor Authentication · Immutable Audit Trail
        </p>
      </div>
    </div>
  );
}