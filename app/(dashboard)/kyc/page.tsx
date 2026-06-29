"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield, ShieldCheck, Fingerprint, Camera, Video,
  CheckCircle2, AlertTriangle,
  Eye, Star, Crown,
  Lock, FileText, ScanFace, BadgeCheck,
  ScanLine, RefreshCw,
  ArrowRight, ArrowLeft, MapPin, Clock, Info, HelpCircle, Bell
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
type StepId = "id" | "selfie" | "liveness" | "address" | "review";
type TierLevel = "visitor" | "sovereign" | "verified" | "whale";

interface StepConfig {
  id: StepId;
  label: string;
  description: string;
  icon: React.ElementType;
}

/* ============================================================
   STEP CONFIG
   ============================================================ */
const STEPS: StepConfig[] = [
  { id: "id", label: "Government ID", description: "Upload passport, driver's license, or national ID", icon: FileText },
  { id: "selfie", label: "Selfie Match", description: "Real-time face match against your ID photo", icon: ScanFace },
  { id: "liveness", label: "Liveness Check", description: "Blink, smile, and turn to prove you're real", icon: Video },
  { id: "address", label: "Address Proof", description: "Utility bill or bank statement (last 90 days)", icon: MapPin },
  { id: "review", label: "Review & Submit", description: "Verify all details before final submission", icon: ShieldCheck },
];

const TIER_CONFIG: Record<TierLevel, {
  label: string; color: string; bg: string; border: string;
  icon: React.ElementType; withdraw: string; benefits: string[];
}> = {
  visitor: {
    label: "Visitor", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20",
    icon: Eye, withdraw: "$0 / day", benefits: ["Can commit to pools", "Cannot claim dividends", "No Hall access", "No withdrawals"]
  },
  sovereign: {
    label: "Sovereign", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20",
    icon: Star, withdraw: "$500 / day", benefits: ["Full Hall access", "Dividend claims", "3 invite codes", "Governance voting"]
  },
  verified: {
    label: "Verified", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
    icon: BadgeCheck, withdraw: "$5,000 / day", benefits: ["Priority support", "Higher limits", "Faster KYC", "API access"]
  },
  whale: {
    label: "Whale", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
    icon: Crown, withdraw: "Unlimited", benefits: ["Primary Admin line", "Custom deals", "Early access", "No limits"]
  },
};

/* ============================================================
   UTILS
   ============================================================ */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============================================================
   COMPONENT — Progress Ring
   ============================================================ */
function ProgressRing({ progress, size = 120, color = "#06b6d4" }: { progress: number; size?: number; color?: string }) {
  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={10} />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round" strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
        <span className="text-[9px] text-white/20 uppercase tracking-wider">Complete</span>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — Tier Preview Card
   ============================================================ */
function TierPreview({ currentTier, progress }: { currentTier: TierLevel; progress: number }) {
  const cfg = TIER_CONFIG[currentTier];
  const Icon = cfg.icon;
  const nextTier = currentTier === "visitor" ? "sovereign" : currentTier === "sovereign" ? "verified" : currentTier === "verified" ? "whale" : null;
  const nextCfg = nextTier ? TIER_CONFIG[nextTier] : null;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
      <div className="flex items-center gap-4 mb-4">
        <ProgressRing progress={progress} size={100} />
        <div className="flex-1">
          <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-2", cfg.bg, cfg.border)}>
            <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
            <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
          </div>
          <p className="text-sm text-white font-bold">Current Tier</p>
          <p className="text-xs text-white/30 mt-0.5">Withdraw limit: {cfg.withdraw}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {cfg.benefits.map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-white/30">
            <CheckCircle2 className="h-3 w-3 text-emerald-400/40 shrink-0" />{b}
          </div>
        ))}
      </div>

      {nextCfg && (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="h-3 w-3 text-white/20" />
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Next Tier</span>
          </div>
          <div className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 mb-1", nextCfg.bg, nextCfg.border)}>
            <nextCfg.icon className={cn("h-3 w-3", nextCfg.color)} />
            <span className={cn("text-[10px] font-bold", nextCfg.color)}>{nextCfg.label}</span>
          </div>
          <p className="text-[10px] text-white/20">Withdraw: {nextCfg.withdraw}</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENT — Drag Drop Upload
   ============================================================ */
function DragDropUpload({
  accept, label, sublabel, onFile, preview, icon: Icon
}: {
  accept: string; label: string; sublabel: string;
  onFile: (file: File) => void; preview?: string; icon: React.ElementType;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all",
        dragging ? "border-cyan-500/40 bg-cyan-950/10" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="mx-auto h-40 rounded-xl object-cover border border-white/10" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />Uploaded
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/5 mb-3">
            <Icon className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-sm font-bold text-white/40">{label}</p>
          <p className="text-xs text-white/20 mt-1">{sublabel}</p>
          <p className="text-[10px] text-white/10 mt-3">or drag and drop</p>
        </>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function KYCPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [idFile, setIdFile] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [addressFile, setAddressFile] = useState<string | null>(null);
  const [faceMatchScore, setFaceMatchScore] = useState(0);
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const progress = ((completedSteps.size + (submitted ? 1 : 0)) / STEPS.length) * 100;
  const currentTier: TierLevel = completedSteps.size >= 4 ? "sovereign" : "visitor";

  const step = STEPS[currentStep];

  function completeStep(index: number) {
    setCompletedSteps((prev) => new Set([...prev, index]));
  }

  function simulateFaceMatch() {
    let score = 0;
    const interval = setInterval(() => {
      score += Math.random() * 15;
      if (score >= 94) {
        score = 94.7;
        clearInterval(interval);
        setTimeout(() => completeStep(1), 500);
      }
      setFaceMatchScore(Math.min(score, 94.7));
    }, 200);
  }

  function simulateLiveness() {
    const steps = ["Blink twice", "Smile", "Turn left"];
    let i = 0;
    setLivenessStep(0);
    const interval = setInterval(() => {
      i++;
      setLivenessStep(i);
      if (i >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setLivenessPassed(true);
          completeStep(2);
        }, 800);
      }
    }, 1500);
  }

  function handleSubmit() {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      completeStep(4);
    }, 2000);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-[128px]" />
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <ShieldCheck className="h-12 w-12 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Identity Verified</h1>
          <p className="text-sm text-white/30 mb-6">
            Your SIV (Sovereign Identity Verification) is complete. You are now a Sovereign tier member of the 8th Ledger.
          </p>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
                <Star className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-sky-400">Sovereign</p>
                <p className="text-xs text-white/20">Tier 2 Unlocked</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="text-white/30">Withdraw Limit</span>
                <span className="text-white font-bold">$500 / day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/30">Hall Access</span>
                <span className="text-emerald-400 font-bold">Granted</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/30">Dividend Claims</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/30">Invite Codes</span>
                <span className="text-white font-bold">3 available</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/halls" className="flex-1">
              <button className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30">
                Enter Sovereign Halls
              </button>
            </Link>
            <Link href="/me" className="flex-1">
              <button className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all">
                View Profile
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
              <Shield className="h-3 w-3 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">SIV Protocol</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Sovereign Identity Verification</h1>
          <p className="text-xs text-white/30 mt-1 max-w-lg">
            4-step verification to unlock your 8th Ledger tier. Government ID → Selfie → Liveness → Address.
            All data is encrypted and never shared.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stepper + Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stepper */}
            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between">
                {STEPS.map((s, i) => {
                  const isActive = i === currentStep;
                  const isCompleted = completedSteps.has(i);
                  const StepIcon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => isCompleted && setCurrentStep(i)}
                      className="flex flex-col items-center gap-2 relative"
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border transition-all",
                        isActive ? "bg-cyan-500/10 border-cyan-500/30 ring-2 ring-cyan-500/10" :
                        isCompleted ? "bg-emerald-500/10 border-emerald-500/20" :
                        "bg-white/5 border-white/5"
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> :
                         <StepIcon className={cn("h-5 w-5", isActive ? "text-cyan-400" : "text-white/10")} />}
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        isActive ? "text-cyan-400" : isCompleted ? "text-emerald-400" : "text-white/10"
                      )}>
                        {s.label}
                      </span>
                      {i < STEPS.length - 1 && (
                        <div className={cn(
                          "absolute top-5 left-[calc(100%+8px)] h-0.5 w-[calc(100%-16px)] -translate-y-1/2",
                          isCompleted ? "bg-emerald-500/30" : "bg-white/5"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-6"
              >
                {/* Step 1: ID Upload */}
                {step.id === "id" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{step.label}</h3>
                      <p className="text-xs text-white/30">{step.description}</p>
                    </div>

                    <DragDropUpload
                      accept="image/*,.pdf"
                      label="Upload Government ID"
                      sublabel="JPEG, PNG, or PDF • Max 10MB"
                      icon={FileText}
                      preview={idFile || undefined}
                      onFile={(file) => {
                        const url = URL.createObjectURL(file);
                        setIdFile(url);
                        setTimeout(() => completeStep(0), 800);
                      }}
                    />

                    {idFile && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <ScanLine className="h-5 w-5 text-emerald-400" />
                          <div>
                            <p className="text-sm font-bold text-emerald-400">OCR Scan Complete</p>
                            <p className="text-[10px] text-emerald-300/50">Data extracted from ID</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-lg bg-white/[0.02] p-2.5">
                            <p className="text-white/20 mb-0.5">Name</p>
                            <p className="text-white font-medium">JOHN DOE</p>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] p-2.5">
                            <p className="text-white/20 mb-0.5">ID Number</p>
                            <p className="text-white font-medium font-mono">A12345678</p>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] p-2.5">
                            <p className="text-white/20 mb-0.5">DOB</p>
                            <p className="text-white font-medium">1990-05-15</p>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] p-2.5">
                            <p className="text-white/20 mb-0.5">Nationality</p>
                            <p className="text-white font-medium">United States</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-lg border border-amber-500/10 bg-amber-950/10 p-2.5 flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-200/50">
                            Name must exactly match your account: <span className="text-white font-bold">"John Doe"</span>. Any mismatch will freeze withdrawals until reconciliation.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 2: Selfie */}
                {step.id === "selfie" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{step.label}</h3>
                      <p className="text-xs text-white/30">{step.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <DragDropUpload
                        accept="image/*"
                        label="Take or Upload Selfie"
                        sublabel="Face must be clearly visible • No filters"
                        icon={Camera}
                        preview={selfieFile || undefined}
                        onFile={(file) => {
                          const url = URL.createObjectURL(file);
                          setSelfieFile(url);
                          simulateFaceMatch();
                        }}
                      />

                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center justify-center">
                        <p className="text-[10px] uppercase tracking-wider text-white/20 font-bold mb-3">Face Match Confidence</p>
                        <div className="relative h-32 w-32">
                          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={8} />
                            <motion.circle
                              cx="50" cy="50" r="42" fill="none"
                              stroke={faceMatchScore >= 80 ? "#10b981" : faceMatchScore >= 50 ? "#f59e0b" : "#f43f5e"}
                              strokeWidth={8} strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 42}
                              strokeDashoffset={2 * Math.PI * 42 - (faceMatchScore / 100) * 2 * Math.PI * 42}
                              className="transition-all duration-300"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-white">{faceMatchScore.toFixed(1)}%</span>
                          </div>
                        </div>
                        <p className={cn(
                          "text-xs font-bold mt-3",
                          faceMatchScore >= 80 ? "text-emerald-400" : faceMatchScore >= 50 ? "text-amber-400" : "text-rose-400"
                        )}>
                          {faceMatchScore >= 80 ? "Match Confirmed" : faceMatchScore >= 50 ? "Analyzing..." : "Scanning..."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Liveness */}
                {step.id === "liveness" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{step.label}</h3>
                      <p className="text-xs text-white/30">{step.description}</p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
                      <div className="relative mx-auto h-40 w-40 mb-6">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border border-cyan-500/10" />
                        <div className="relative h-full w-full rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center border border-cyan-500/20">
                          {livenessPassed ? (
                            <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                          ) : (
                            <Video className="h-12 w-12 text-cyan-400/30" />
                          )}
                        </div>
                      </div>

                      {livenessPassed ? (
                        <div>
                          <p className="text-lg font-bold text-emerald-400 mb-1">Liveness Confirmed</p>
                          <p className="text-xs text-white/30">All 3 challenges passed. You are verified as human.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-bold text-white mb-1">
                            {livenessStep === 0 ? "Start Liveness Check" :
                             livenessStep === 1 ? "Blink Twice" :
                             livenessStep === 2 ? "Smile" :
                             livenessStep === 3 ? "Turn Left" : "Processing..."}
                          </p>
                          <p className="text-xs text-white/30 mb-4">
                            {livenessStep === 0 ? "Click start to begin the challenge" :
                             "Follow the instruction on screen"}
                          </p>
                          <div className="flex items-center justify-center gap-2 mb-4">
                            {["Blink", "Smile", "Turn"].map((challenge, i) => (
                              <div key={challenge} className={cn(
                                "flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold border transition-all",
                                i < livenessStep ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                i === livenessStep ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse" :
                                "bg-white/5 text-white/10 border-white/5"
                              )}>
                                {i < livenessStep ? <CheckCircle2 className="h-3 w-3" /> :
                                 i === livenessStep ? <RefreshCw className="h-3 w-3 animate-spin" /> :
                                 <Clock className="h-3 w-3" />}
                                {challenge}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={simulateLiveness}
                            disabled={livenessStep > 0 && !livenessPassed}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-30"
                          >
                            {livenessStep === 0 ? "Start Challenge" : "Processing..."}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Address */}
                {step.id === "address" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{step.label}</h3>
                      <p className="text-xs text-white/30">{step.description}</p>
                    </div>

                    <DragDropUpload
                      accept="image/*,.pdf"
                      label="Upload Address Proof"
                      sublabel="Utility bill, bank statement, or rental agreement"
                      icon={MapPin}
                      preview={addressFile || undefined}
                      onFile={(file) => {
                        const url = URL.createObjectURL(file);
                        setAddressFile(url);
                        setTimeout(() => completeStep(3), 800);
                      }}
                    />

                    {addressFile && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400">Address Verified</span>
                        </div>
                        <p className="text-xs text-white/30">123 Marina Drive, Miami, United States</p>
                        <p className="text-[10px] text-white/20 mt-1">Document dated: 2026-04-15 (within 90 days)</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 5: Review */}
                {step.id === "review" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{step.label}</h3>
                      <p className="text-xs text-white/30">{step.description}</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Government ID", status: "completed", detail: "Passport • JOHN DOE • A12345678" },
                        { label: "Selfie Match", status: "completed", detail: "94.7% confidence match" },
                        { label: "Liveness Check", status: "completed", detail: "3/3 challenges passed" },
                        { label: "Address Proof", status: "completed", detail: "Utility bill • Miami, United States" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className="text-[10px] text-white/20">{item.detail}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-amber-500/10 bg-amber-950/10 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/60">
                          By submitting, you confirm all information is accurate. False information results in permanent ban and forfeiture of all PACs. The 8th Ledger may request additional verification at any time.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Encrypting & Submitting...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Submit Verification
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />Back
                  </button>
                  <button
                    onClick={() => currentStep < STEPS.length - 1 && setCurrentStep(currentStep + 1)}
                    disabled={!completedSteps.has(currentStep) && currentStep < 4}
                    className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 flex items-center gap-1.5"
                  >
                    Next<ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Tier Preview + Info */}
          <div className="space-y-6">
            <TierPreview currentTier={currentTier} progress={progress} />

            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-cyan-400" />
                Why SIV Matters
              </h3>
              <div className="space-y-3 text-xs text-white/30">
                <p className="flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 text-white/10 shrink-0 mt-0.5" />
                  Name must exactly match government ID. "John" vs "Jonathan" = frozen.
                </p>
                <p className="flex items-start gap-2">
                  <Fingerprint className="h-3.5 w-3.5 text-white/10 shrink-0 mt-0.5" />
                  Biometric data is hashed and stored encrypted. Never sold or shared.
                </p>
                <p className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-white/10 shrink-0 mt-0.5" />
                  The Primary Admin can override in fraud cases. All overrides are logged publicly.
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 text-white/10 shrink-0 mt-0.5" />
                  Processing time: 24-48 hours. Expedited for Sovereign+ tiers.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                Requirements by Tier
              </h3>
              <div className="space-y-2">
                {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const required = key === "visitor" ? "None" : key === "sovereign" ? "Steps 1-4" : key === "verified" ? "Steps 1-4 + 6mo history" : "Steps 1-4 + $50K+ commitment";
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                        <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
                      </div>
                      <span className="text-[10px] text-white/20">{required}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0a0a14]/80 backdrop-blur-sm p-4">
              <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-rose-400" />
                Fraud Warning
              </h3>
              <p className="text-xs text-white/20 leading-relaxed">
                Attempting to bypass SIV with synthetic identities, deepfakes, or stolen documents results in:
              </p>
              <div className="mt-2 space-y-1 text-[10px] text-rose-400/50">
                <p>• Permanent global ban across all Halls</p>
                <p>• Forfeiture of all PACs and dividends</p>
                <p>• Blacklist shared across all 8th Ledger verticals</p>
                <p>• Legal referral to local authorities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}