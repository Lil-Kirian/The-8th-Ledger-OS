"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Flame,
  TrendingUp,
  Coins,
  Shield,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Save,
  RotateCcw,
} from "lucide-react";

interface ProtocolSettings {
  pirReturnRate: number;
  platformFee: number;
  minCommitment: number;
  maxCommitment: number;
  consensusThreshold: number;
  ledBurnRate: number;
  oracleEnabled: boolean;
  publicAudit: boolean;
}

const DEFAULTS: ProtocolSettings = {
  pirReturnRate: 50,
  platformFee: 0,
  minCommitment: 50,
  maxCommitment: 50000,
  consensusThreshold: 2,
  ledBurnRate: 5,
  oracleEnabled: true,
  publicAudit: true,
};

export default function ProtocolSettingsPage() {
  const [settings, setSettings] = useState<ProtocolSettings>(DEFAULTS);
  const [original, setOriginal] = useState<ProtocolSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/protocol/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
            setOriginal(data.settings);
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  function update<K extends keyof ProtocolSettings>(key: K, value: ProtocolSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setMessage("");
  }

  function hasChanges() {
    return JSON.stringify(settings) !== JSON.stringify(original);
  }

  function reset() {
    setSettings(original);
    setMessage("");
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/protocol/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default", ...settings }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginal(settings);
        setMessage("Protocol settings saved");
      } else {
        setMessage(data.error || "Save failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
          <Settings className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
            Protocol Engine
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Primary Admin Controls</h1>
        <p className="mt-1 text-sm text-white/40">
          Adjust economic parameters, security thresholds, and global protocol behavior.
        </p>
      </div>

      {/* PIR Economy */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/80">PIR Economy</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* PIR Return Rate */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Non-Winner Return Rate
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">{settings.pirReturnRate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.pirReturnRate}
              onChange={(e) => update("pirReturnRate", Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-emerald-500 cursor-pointer"
            />
            <p className="mt-1 text-[10px] text-white/20">
              Percentage of commitment returned as ARCs to non-winners
            </p>
          </div>

          {/* Platform Fee */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Platform Fee
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">{settings.platformFee}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={settings.platformFee}
              onChange={(e) => update("platformFee", Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-cyan-500 cursor-pointer"
            />
            <p className="mt-1 text-[10px] text-white/20">
              Fee taken from pool PIR before distribution
            </p>
          </div>

          {/* Min Commitment */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/40">
              Minimum Commitment (USD)
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="number"
                value={settings.minCommitment}
                onChange={(e) => update("minCommitment", Number(e.target.value))}
                min={10}
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Max Commitment */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/40">
              Maximum Commitment (USD)
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="number"
                value={settings.maxCommitment}
                onChange={(e) => update("maxCommitment", Number(e.target.value))}
                min={100}
                className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consensus & LED */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400/80">Consensus Engine</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                Consensus Threshold (participants)
              </label>
              <input
                type="number"
                value={settings.consensusThreshold}
                onChange={(e) => update("consensusThreshold", Number(e.target.value))}
                min={1}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
              />
              <p className="mt-1 text-[10px] text-white/20">
                Minimum participants before Quantum Merit can run
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/80">LED Tokenomics</span>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Forge Burn Rate
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">{settings.ledBurnRate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={settings.ledBurnRate}
              onChange={(e) => update("ledBurnRate", Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-amber-500 cursor-pointer"
            />
            <p className="mt-1 text-[10px] text-white/20">
              Percentage of ARCs burned when forging LED
            </p>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400/80">Protocol Features</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Oracle Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${settings.oracleEnabled ? "bg-violet-500/10" : "bg-white/5"}`}>
                <Globe className={`h-5 w-5 ${settings.oracleEnabled ? "text-violet-400" : "text-white/20"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Oracle</p>
                <p className="text-[10px] text-white/30">Forecast standing system</p>
              </div>
            </div>
            <button
              onClick={() => update("oracleEnabled", !settings.oracleEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings.oracleEnabled ? "bg-violet-500" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.oracleEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Public Audit Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${settings.publicAudit ? "bg-emerald-500/10" : "bg-white/5"}`}>
                {settings.publicAudit ? <Eye className="h-5 w-5 text-emerald-400" /> : <EyeOff className="h-5 w-5 text-white/20" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Public Audit</p>
                <p className="text-[10px] text-white/30">Ledger visible without auth</p>
              </div>
            </div>
            <button
              onClick={() => update("publicAudit", !settings.publicAudit)}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings.publicAudit ? "bg-emerald-500" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.publicAudit ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-400">Sovereign Impact</h4>
            <p className="mt-1 text-xs text-white/40 leading-relaxed">
              Changing PIR return rate or platform fee affects all active and future pools. 
              Existing ownerships are not retroactively adjusted. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-5 py-2.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={reset}
          disabled={!hasChanges()}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        {message && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${message.includes("saved") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
            {message.includes("saved") ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}