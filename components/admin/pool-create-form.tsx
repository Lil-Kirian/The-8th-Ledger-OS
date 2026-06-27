"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer,
  SealCheck,
  Swords,
  HeartPulse,
  Building2,
  Plane,
  Wheat,
  Zap,
  Wifi,
  Smartphone,
  GraduationCap,
  Car,
  Home,
  Upload,
  MapPin,
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Eye,
  Sparkles,
  Globe,
  Image as ImageIcon,
  FileText,
  X,
  Lock,
  ShieldCheck,
  Wrench,
  Rocket,
  Umbrella
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   VERTICALS — 10 Pillars of the 8th Ledger
   ============================================================ */

const VERTICALS = [
  { id: "ledgerprop", name: "LedgerProp", icon: Home, color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-700/30", hallClass: "I", description: "Houses, apartments, commercial real estate" },
  { id: "ledgerauto", name: "LedgerAuto", icon: Car, color: "text-blue-400", bg: "bg-blue-900/20", border: "border-blue-700/30", hallClass: "I", description: "Cars, trucks, vans, fleet vehicles" },
  { id: "ledgertech", name: "LedgerTech", icon: Smartphone, color: "text-violet-400", bg: "bg-violet-900/20", border: "border-violet-700/30", hallClass: "III", description: "Electronics, equipment, inventory" },
  { id: "ledgeredu", name: "LedgerEdu", icon: GraduationCap, color: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/30", hallClass: "II", description: "Training equipment, licenses, facilities" },
  { id: "ledgerhealth", name: "LedgerHealth", icon: HeartPulse, color: "text-rose-400", bg: "bg-rose-900/20", border: "border-rose-700/30", hallClass: "II", description: "Medical equipment, clinics, wellness" },
  { id: "ledgerbiz", name: "LedgerBiz", icon: Building2, color: "text-cyan-400", bg: "bg-cyan-900/20", border: "border-cyan-700/30", hallClass: "III", description: "Restaurants, laundromats, coworking" },
  { id: "ledgertravel", name: "LedgerTravel", icon: Plane, color: "text-sky-400", bg: "bg-sky-900/20", border: "border-sky-700/30", hallClass: "II", description: "Jets, yachts, helicopters, RVs" },
  { id: "ledgeragri", name: "LedgerAgri", icon: Wheat, color: "text-lime-400", bg: "bg-lime-900/20", border: "border-lime-700/30", hallClass: "III", description: "Farms, greenhouses, machinery, livestock" },
  { id: "ledgerenergy", name: "LedgerEnergy", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-900/20", border: "border-yellow-700/30", hallClass: "I", description: "Solar, wind, batteries, microgrids" },
  { id: "ledgeraccess", name: "LedgerAccess", icon: Wifi, color: "text-fuchsia-400", bg: "bg-fuchsia-900/20", border: "border-fuchsia-700/30", hallClass: "I", description: "Towers, WiFi, parking, charging" },
] as const;

const LOCATION_VERTICALS = ["ledgeragri", "ledgerbiz", "ledgeraccess", "ledgertravel", "ledgerenergy"];

/* ============================================================
   PIR PILLARS — Protocol Infrastructure Reserve
   ============================================================ */

const PIR_PILLARS = [
  { key: "shield", label: "The Shield", pct: 0.25, icon: ShieldCheck, color: "text-emerald-400", desc: "Insurance, casualty, liability, force majeure" },
  { key: "seal", label: "The Seal", pct: 0.20, icon: SealCheck, color: "text-blue-400", desc: "Entity registration, SPV, legal documents" },
  { key: "forge", label: "The Forge", pct: 0.20, icon: Wrench, color: "text-orange-400", desc: "Repairs, upkeep, vendor contracts, payroll" },
  { key: "spire", label: "The Spire", pct: 0.15, icon: Rocket, color: "text-violet-400", desc: "Protocol development, infrastructure, audits" },
  { key: "vanguard", label: "The Vanguard", pct: 0.12, icon: Swords, color: "text-cyan-400", desc: "R&D, geographic expansion, ecosystem grants" },
  { key: "sanctuary", label: "The Sanctuary", pct: 0.08, icon: Umbrella, color: "text-rose-400", desc: "Vacancy coverage, dividend smoothing, closure" },
] as const;

/* ============================================================
   STEPS
   ============================================================ */

const STEPS = [
  { id: 1, label: "Blueprint", icon: FileText },
  { id: 2, label: "Economics", icon: DollarSign },
  { id: 3, label: "Territory", icon: Globe },
  { id: 4, label: "The Forge", icon: Hammer },
] as const;

/* ============================================================
   TYPES
   ============================================================ */

interface LocationOption {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cost?: number;
  description: string;
}

interface PoolFormData {
  verticalId: string;
  name: string;
  description: string;
  country: string;
  trueCost: number;
  listedPrice: number;
  target: number;
  assetValue: number;
  minCommitment: number;
  maxCommitment: number;
  maxParticipants: number;
  campaignDuration: number;
  emojiSet: string;
  imageUrl: string;
  locationOptions: LocationOption[];
  documents: { name: string; url: string; category: string }[];
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function PoolCreateForm() {
  const [step, setStep] = useState(1);
  const [showTrueCost, setShowTrueCost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<PoolFormData>({
    verticalId: "",
    name: "",
    description: "",
    country: "",
    trueCost: 100000,
    listedPrice: 1,
    target: 200000,
    assetValue: 100000,
    minCommitment: 1,
    maxCommitment: 50000,
    maxParticipants: 1000,
    campaignDuration: 30,
    emojiSet: "🏠💰📈🌍🔒",
    imageUrl: "",
    locationOptions: [],
    documents: [],
  });

  const selectedVertical = VERTICALS.find((v) => v.id === form.verticalId);
  const pirAmount = form.target - form.trueCost;
  const pirValid = pirAmount >= form.trueCost * 0.5 && pirAmount <= form.trueCost * 1.5;

  /* ── helpers ── */
  const update = useCallback(<K extends keyof PoolFormData>(key: K, value: PoolFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "trueCost" && typeof value === "number") {
        next.target = Math.round(value * 2);
      }
      return next;
    });
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }, []);

  const addLocation = useCallback(() => {
    const id = Math.random().toString(36).slice(2, 9);
    setForm((prev) => ({
      ...prev,
      locationOptions: [
        ...prev.locationOptions,
        { id, name: "", address: "", lat: 0, lng: 0, description: "" },
      ],
    }));
  }, []);

  const removeLocation = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      locationOptions: prev.locationOptions.filter((l) => l.id !== id),
    }));
  }, []);

  const updateLocation = useCallback((id: string, patch: Partial<LocationOption>) => {
    setForm((prev) => ({
      ...prev,
      locationOptions: prev.locationOptions.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }, []);

  const validateStep = useCallback((s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.verticalId) e.verticalId = "Select a vertical";
      if (!form.name.trim() || form.name.length < 5) e.name = "Name must be at least 5 characters";
      if (!form.description.trim() || form.description.length < 20) e.description = "Description must be at least 20 characters";
      if (!form.country.trim()) e.country = "Enter a country";
      if (form.emojiSet.replace(/\s/g, "").length < 5) e.emojiSet = "Provide at least 5 emojis";
    }
    if (s === 2) {
      if (form.trueCost < 1000) e.trueCost = "True cost must be at least $1,000";
      if (form.listedPrice <= 0) e.listedPrice = "Listed price must be greater than $0";
      if (form.listedPrice >= form.target) e.listedPrice = "Listed price must be less than total target";
      if (form.target < form.trueCost * 1.5) e.target = "Target must be at least 1.5x true cost (PIR minimum)";
      if (form.minCommitment < 1) e.minCommitment = "Minimum commitment at least $1";
      if (form.maxCommitment <= form.minCommitment) e.maxCommitment = "Max commitment must exceed min";
      if (form.maxParticipants < 2) e.maxParticipants = "At least 2 participants";
      if (form.campaignDuration < 1 || form.campaignDuration > 365) e.campaignDuration = "Duration 1–365 days";
    }
    if (s === 3) {
      if (selectedVertical && LOCATION_VERTICALS.includes(form.verticalId)) {
        if (form.locationOptions.length === 0) e.locationOptions = "Add at least one location option";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, selectedVertical]);

  const nextStep = useCallback(() => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  }, [step, validateStep]);

  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        hallClass: selectedVertical?.hallClass,
        pirAllocation: PIR_PILLARS.map((p) => ({
          pillar: p.key,
          amount: Math.round(pirAmount * p.pct),
          purpose: p.desc,
        })),
      };
      const res = await fetch("/api/admin/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to forge pool");
      alert("Pool forged successfully. Ghost Hall spawned.");
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Forge failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, selectedVertical, pirAmount, validateStep]);

  /* ── render ── */
  return (
    <div className="min-h-screen bg-[#0a0a12] text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0d0d1a]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
              <Hammer size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Pool Forge</h1>
              <p className="text-[11px] text-slate-500">8th Ledger — The Architect creates. The protocol enforces.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <React.Fragment key={s.id}>
                  {i > 0 && <ChevronRight size={14} className="text-slate-700" />}
                  <button
                    onClick={() => active || done ? setStep(s.id) : undefined}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all",
                      active
                        ? "bg-cyan-900/20 border-cyan-500/40 text-cyan-400"
                        : done
                        ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
                        : "bg-slate-800/20 border-slate-800/30 text-slate-600"
                    )}
                  >
                    {done ? <Check size={12} /> : <Icon size={12} />}
                    {s.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Vertical Selection */}
                <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-cyan-400" />
                    <h2 className="text-sm font-bold text-slate-200">Select Vertical</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {VERTICALS.map((v) => {
                      const Icon = v.icon;
                      const active = form.verticalId === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => update("verticalId", v.id)}
                          className={cn(
                            "relative p-4 rounded-xl border text-left transition-all hover:scale-[1.02]",
                            active
                              ? `${v.bg} ${v.border} ring-1 ring-offset-0 ring-offset-[#0d0d1a] ${v.color.replace("text-", "ring-")}`
                              : "bg-slate-800/20 border-slate-800/30 hover:border-slate-700/40"
                          )}
                        >
                          <Icon size={20} className={active ? v.color : "text-slate-600"} />
                          <div className={cn("text-xs font-bold mt-2", active ? v.color : "text-slate-500")}>
                            {v.name}
                          </div>
                          <div className="text-[9px] text-slate-600 mt-1 leading-tight">{v.description}</div>
                          <div className={cn("text-[9px] font-mono mt-1.5 px-1.5 py-0.5 rounded inline-block", active ? "bg-slate-900/40 text-slate-400" : "bg-slate-800/30 text-slate-700")}>
                            Class {v.hallClass}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.verticalId && <p className="text-[11px] text-red-400 mt-2">{errors.verticalId}</p>}
                </div>

                {/* Basic Info */}
                <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-cyan-400" />
                    <h2 className="text-sm font-bold text-slate-200">Asset Blueprint</h2>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Pool Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Nairobi Solar Farm — Phase 2"
                      className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                    {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="Describe the asset, its location, revenue model, and why it belongs on the 8th Ledger..."
                      rows={4}
                      className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
                    />
                    {errors.description && <p className="text-[11px] text-red-400 mt-1">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Country</label>
                      <div className="relative">
                        <Globe size={14} className="absolute left-3 top-3.5 text-slate-600" />
                        <input
                          type="text"
                          value={form.country}
                          onChange={(e) => update("country", e.target.value)}
                          placeholder="Kenya"
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                      {errors.country && <p className="text-[11px] text-red-400 mt-1">{errors.country}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Emoji Set (5+)</label>
                      <input
                        type="text"
                        value={form.emojiSet}
                        onChange={(e) => update("emojiSet", e.target.value)}
                        placeholder="🏠💰📈🌍🔒"
                        className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                      />
                      {errors.emojiSet && <p className="text-[11px] text-red-400 mt-1">{errors.emojiSet}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Economics */}
                <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-cyan-400" />
                    <h2 className="text-sm font-bold text-slate-200">Economic Architecture</h2>
                    <span className="ml-auto text-[10px] text-slate-600 font-mono">All figures in USD</span>
                  </div>

                  {/* True Cost vs Listed Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Lock size={10} className="text-amber-400" />
                        True Acquisition Cost
                        <span className="text-[9px] text-slate-700 font-normal normal-case">(Hidden from public)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-600 text-sm">$</span>
                        <input
                          type="number"
                          value={form.trueCost}
                          onChange={(e) => update("trueCost", Number(e.target.value))}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-7 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                      {errors.trueCost && <p className="text-[11px] text-red-400 mt-1">{errors.trueCost}</p>}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Eye size={10} className="text-emerald-400" />
                        Listed Price (Public)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-600 text-sm">$</span>
                        <input
                          type="number"
                          value={form.listedPrice}
                          onChange={(e) => update("listedPrice", Number(e.target.value))}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-7 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                      {errors.listedPrice && <p className="text-[11px] text-red-400 mt-1">{errors.listedPrice}</p>}
                    </div>
                  </div>

                  {/* Target & PIR */}
                  <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pool Target</label>
                      <span className="text-[10px] text-slate-600">Auto: 2x True Cost</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-600 text-sm">$</span>
                      <input
                        type="number"
                        value={form.target}
                        onChange={(e) => update("target", Number(e.target.value))}
                        className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-7 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                    {errors.target && <p className="text-[11px] text-red-400">{errors.target}</p>}

                    {/* PIR Preview */}
                    <div className="pt-3 border-t border-slate-700/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-cyan-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Protocol Infrastructure Reserve</span>
                        </div>
                        <span className={cn("text-sm font-bold font-mono", pirValid ? "text-cyan-400" : "text-red-400")}>
                          ${pirAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PIR_PILLARS.map((p) => {
                          const PIcon = p.icon;
                          const amount = Math.round(pirAmount * p.pct);
                          return (
                            <div key={p.key} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                <PIcon size={10} className={p.color} />
                                <span className="text-[9px] font-bold text-slate-500">{p.label}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">${amount.toLocaleString()}</div>
                              <div className="text-[9px] text-slate-700">{Math.round(p.pct * 100)}%</div>
                            </div>
                          );
                        })}
                      </div>

                      {!pirValid && (
                        <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
                          <AlertCircle size={10} />
                          PIR should equal True Cost (100%–150% range recommended)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Commitment & Participants */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Min Commitment</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-600 text-sm">$</span>
                        <input
                          type="number"
                          value={form.minCommitment}
                          onChange={(e) => update("minCommitment", Number(e.target.value))}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-7 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                      {errors.minCommitment && <p className="text-[11px] text-red-400 mt-1">{errors.minCommitment}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Max Commitment</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-600 text-sm">$</span>
                        <input
                          type="number"
                          value={form.maxCommitment}
                          onChange={(e) => update("maxCommitment", Number(e.target.value))}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-7 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                      {errors.maxCommitment && <p className="text-[11px] text-red-400 mt-1">{errors.maxCommitment}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Max Participants</label>
                      <div className="relative">
                        <Users size={14} className="absolute left-3 top-3.5 text-slate-600" />
                        <input
                          type="number"
                          value={form.maxParticipants}
                          onChange={(e) => update("maxParticipants", Number(e.target.value))}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                      {errors.maxParticipants && <p className="text-[11px] text-red-400 mt-1">{errors.maxParticipants}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Campaign Duration (Days)</label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-3.5 text-slate-600" />
                        <input
                          type="number"
                          value={form.campaignDuration}
                          onChange={(e) => update("campaignDuration", Number(e.target.value))}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                      {errors.campaignDuration && <p className="text-[11px] text-red-400 mt-1">{errors.campaignDuration}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Location Options */}
                {selectedVertical && LOCATION_VERTICALS.includes(form.verticalId) && (
                  <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-cyan-400" />
                        <h2 className="text-sm font-bold text-slate-200">Location Options</h2>
                      </div>
                      <button
                        onClick={addLocation}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-900/20 border border-cyan-700/30 text-cyan-400 text-[11px] font-bold hover:bg-cyan-900/30 transition-all"
                      >
                        <Upload size={12} />
                        Add Location
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600">Subjects will vote on the final location from these options.</p>

                    <AnimatePresence>
                      {form.locationOptions.map((loc) => (
                        <motion.div
                          key={loc.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-600">LOC-{loc.id.slice(0, 4).toUpperCase()}</span>
                            <button
                              onClick={() => removeLocation(loc.id)}
                              className="p-1 rounded hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Location name"
                              value={loc.name}
                              onChange={(e) => updateLocation(loc.id, { name: e.target.value })}
                              className="bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all"
                            />
                            <input
                              type="text"
                              placeholder="Address"
                              value={loc.address}
                              onChange={(e) => updateLocation(loc.id, { address: e.target.value })}
                              className="bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="number"
                              placeholder="Lat"
                              value={loc.lat || ""}
                              onChange={(e) => updateLocation(loc.id, { lat: Number(e.target.value) })}
                              className="bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all"
                            />
                            <input
                              type="number"
                              placeholder="Lng"
                              value={loc.lng || ""}
                              onChange={(e) => updateLocation(loc.id, { lng: Number(e.target.value) })}
                              className="bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all"
                            />
                            <input
                              type="number"
                              placeholder="Cost ($)"
                              value={loc.cost || ""}
                              onChange={(e) => updateLocation(loc.id, { cost: Number(e.target.value) })}
                              className="bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all"
                            />
                          </div>
                          <textarea
                            placeholder="Description (soil quality, traffic, sun hours, etc.)"
                            value={loc.description}
                            onChange={(e) => updateLocation(loc.id, { description: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-800/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all resize-none"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {errors.locationOptions && <p className="text-[11px] text-red-400">{errors.locationOptions}</p>}
                  </div>
                )}

                {/* Media Upload */}
                <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-cyan-400" />
                    <h2 className="text-sm font-bold text-slate-200">Media Vault</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Hero Image URL</label>
                      <div className="relative">
                        <ImageIcon size={14} className="absolute left-3 top-3.5 text-slate-600" />
                        <input
                          type="text"
                          value={form.imageUrl}
                          onChange={(e) => update("imageUrl", e.target.value)}
                          placeholder="https://cdn.8thledger.io/..."
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Asset Value (for display)</label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-3.5 text-slate-600" />
                        <input
                          type="number"
                          value={form.assetValue}
                          onChange={(e) => update("assetValue", Number(e.target.value))}
                          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl border-2 border-dashed border-slate-800/40 bg-slate-900/20 text-center">
                    <Upload size={24} className="mx-auto text-slate-700 mb-2" />
                    <p className="text-xs text-slate-600">Drag & drop or click to upload asset photos, 360° tours, SPV documents</p>
                    <p className="text-[10px] text-slate-700 mt-1">Max 50MB • JPG, PNG, PDF, MP4</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Review */}
                <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <Hammer size={16} className="text-cyan-400" />
                    <h2 className="text-sm font-bold text-slate-200">The Forge — Final Review</h2>
                  </div>

                  {/* Preview Card */}
                  <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-700/30">
                    <div className="flex items-start gap-4">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="" className="w-24 h-24 rounded-xl object-cover border border-slate-700/30" />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-center">
                          <ImageIcon size={24} className="text-slate-700" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {selectedVertical && (
                            <>
                              <selectedVertical.icon size={14} className={selectedVertical.color} />
                              <span className={cn("text-[10px] font-bold", selectedVertical.color)}>{selectedVertical.name}</span>
                              <span className="text-[9px] text-slate-700 px-1.5 py-0.5 rounded bg-slate-800/40">Class {selectedVertical.hallClass}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-200 truncate">{form.name || "Untitled Pool"}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{form.description || "No description provided."}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Globe size={10} /> {form.country || "—"}
                          </span>
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Users size={10} /> {form.maxParticipants} max
                          </span>
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Clock size={10} /> {form.campaignDuration} days
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/30">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-600 uppercase">True Cost</div>
                        <div className="text-sm font-bold text-slate-400 font-mono">${form.trueCost.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-700">Hidden</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-600 uppercase">Pool Target</div>
                        <div className="text-sm font-bold text-cyan-400 font-mono">${form.target.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-600 uppercase">PIR Reserve</div>
                        <div className={cn("text-sm font-bold font-mono", pirValid ? "text-emerald-400" : "text-red-400")}>
                          ${pirAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PIR Breakdown */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PIR Allocation</div>
                    <div className="grid grid-cols-3 gap-2">
                      {PIR_PILLARS.map((p) => {
                        const PIcon = p.icon;
                        const amount = Math.round(pirAmount * p.pct);
                        return (
                          <div key={p.key} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/30 flex items-center gap-2">
                            <PIcon size={12} className={p.color} />
                            <div>
                              <div className="text-[9px] font-bold text-slate-500">{p.label}</div>
                              <div className="text-[10px] font-mono text-slate-400">${amount.toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location summary */}
                  {form.locationOptions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location Options</div>
                      <div className="space-y-1">
                        {form.locationOptions.map((loc) => (
                          <div key={loc.id} className="flex items-center gap-2 text-[11px] text-slate-400">
                            <MapPin size={10} className="text-cyan-400" />
                            {loc.name || "Unnamed"} — {loc.address || "No address"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-4 border-t border-slate-800/30">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Forging Pool...
                        </>
                      ) : (
                        <>
                          <Hammer size={18} />
                          FORGE POOL
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-600 text-center mt-2">
                      This will spawn a Ghost Hall, initialize the PIR, and open the pool for commitments.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700/40 text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            {step < 4 && (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 border border-cyan-500 text-white text-xs font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/10"
              >
                Continue
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Preview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="sticky top-6 space-y-4">
            {/* Ghost Hall Preview */}
            <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={14} className="text-cyan-400" />
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ghost Hall Preview</h3>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/30 space-y-3">
                <div className="flex items-center gap-3">
                  {selectedVertical ? (
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", selectedVertical.bg, selectedVertical.border)}>
                      <selectedVertical.icon size={18} className={selectedVertical.color} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center">
                      <Sparkles size={18} className="text-slate-700" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-300 truncate">{form.name || "Unnamed Pool"}</div>
                    <div className="text-[9px] text-slate-600">{selectedVertical?.name || "No vertical"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-800/20">
                    <div className="text-[9px] text-slate-600 uppercase">Min</div>
                    <div className="text-xs font-bold text-slate-400 font-mono">${form.minCommitment}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-800/20">
                    <div className="text-[9px] text-slate-600 uppercase">Target</div>
                    <div className="text-xs font-bold text-cyan-400 font-mono">${form.target.toLocaleString()}</div>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-800/20 flex items-center justify-between">
                  <span className="text-[9px] text-slate-600">Hall Class</span>
                  <span className="text-[10px] font-bold text-slate-400">{selectedVertical?.hallClass || "—"}</span>
                </div>

                <div className="p-2 rounded bg-slate-800/20 flex items-center justify-between">
                  <span className="text-[9px] text-slate-600">8th Ledger Tithe</span>
                  <span className="text-[10px] font-bold text-slate-400">20%</span>
                </div>

                <div className="p-2 rounded bg-slate-800/20 flex items-center justify-between">
                  <span className="text-[9px] text-slate-600">PIR</span>
                  <span className={cn("text-[10px] font-bold font-mono", pirValid ? "text-emerald-400" : "text-red-400")}>
                    ${pirAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* PIR Pillars Mini */}
            <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">PIR Pillars</h3>
              <div className="space-y-2">
                {PIR_PILLARS.map((p) => {
                  const PIcon = p.icon;
                  const amount = Math.round(pirAmount * p.pct);
                  return (
                    <div key={p.key} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <PIcon size={10} className={p.color} />
                        <span className="text-slate-500">{p.label}</span>
                      </div>
                      <span className="text-slate-400 font-mono">${amount.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-5">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">The Rules</h3>
              <ul className="space-y-1.5">
                <li className="text-[10px] text-slate-600 flex items-start gap-1.5">
                  <Check size={10} className="shrink-0 mt-0.5 text-emerald-500" />
                  True Cost is hidden from subjects
                </li>
                <li className="text-[10px] text-slate-600 flex items-start gap-1.5">
                  <Check size={10} className="shrink-0 mt-0.5 text-emerald-500" />
                  Listed Price must be &lt; Target
                </li>
                <li className="text-[10px] text-slate-600 flex items-start gap-1.5">
                  <Check size={10} className="shrink-0 mt-0.5 text-emerald-500" />
                  PIR = Target − True Cost
                </li>
                <li className="text-[10px] text-slate-600 flex items-start gap-1.5">
                  <Check size={10} className="shrink-0 mt-0.5 text-emerald-500" />
                  8th Ledger takes 20% tithe forever
                </li>
                <li className="text-[10px] text-slate-600 flex items-start gap-1.5">
                  <Check size={10} className="shrink-0 mt-0.5 text-emerald-500" />
                  Ghost Hall unlocks at 100% fill
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}