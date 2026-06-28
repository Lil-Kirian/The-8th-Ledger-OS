"use client";

import React, { useState } from "react";
import {
  Shield,
  Fingerprint,
  Scan,
  Camera,
  Home,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Lock,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KycStep = "document" | "selfie" | "address" | "review" | "complete";

interface KycVerificationFlowProps {
  ledgerId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface StepConfig {
  id: KycStep;
  label: string;
  description: string;
  icon: React.ElementType;
}

const steps: StepConfig[] = [
  {
    id: "document",
    label: "Government ID",
    description: "Upload passport, license, or national ID",
    icon: Fingerprint,
  },
  {
    id: "selfie",
    label: "Liveness Check",
    description: "Real-time face verification",
    icon: Scan,
  },
  {
    id: "address",
    label: "Proof of Address",
    description: "Utility bill or bank statement",
    icon: Home,
  },
  {
    id: "review",
    label: "Review",
    description: "Verify and submit",
    icon: FileCheck,
  },
];

export default function KycVerificationFlow({
  ledgerId,
  onComplete,
  onCancel,
}: KycVerificationFlowProps) {
  const [currentStep, setCurrentStep] = useState<KycStep>("document");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step data state
  const [documentData, setDocumentData] = useState<{
    type: string;
    verified: boolean;
  } | null>(null);
  const [selfieData, setSelfieData] = useState<{
    captured: boolean;
    matchScore: number;
  } | null>(null);
  const [addressData, setAddressData] = useState<{
    type: string;
    uploaded: boolean;
    verified: boolean;
  } | null>(null);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
      setError(null);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setCurrentStep("complete");
      onComplete?.();
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "document":
        return documentData?.verified ?? false;
      case "selfie":
        return selfieData?.captured ?? false;
      case "address":
        return addressData?.uploaded ?? false;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const StepIcon = steps[currentStepIndex].icon;

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0d0d1a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
              <Shield size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                SIV / KYC Verification
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Ledger ID:{" "}
                <span className="font-mono text-slate-400">{ledgerId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-800/40 transition-colors text-slate-500 hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            <span>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="font-mono text-cyan-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500/40 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-4 flex items-center gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-all",
                      isCompleted ? "bg-cyan-700/30" : "bg-slate-800/40",
                    )}
                  />
                )}
                <button
                  onClick={() => {
                    if (isCompleted || isActive) setCurrentStep(step.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                    isActive
                      ? "bg-cyan-900/20 border-cyan-700/30"
                      : isCompleted
                        ? "bg-emerald-900/10 border-emerald-700/20"
                        : "bg-slate-800/20 border-slate-800/20 opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      isActive
                        ? "bg-cyan-900/30"
                        : isCompleted
                          ? "bg-emerald-900/20"
                          : "bg-slate-800/30",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <StepIcon
                        size={14}
                        className={
                          isActive ? "text-cyan-400" : "text-slate-600"
                        }
                      />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div
                      className={cn(
                        "text-[10px] font-bold",
                        isActive
                          ? "text-cyan-300"
                          : isCompleted
                            ? "text-emerald-400"
                            : "text-slate-600",
                      )}
                    >
                      {step.label}
                    </div>
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/10 border border-red-800/20 flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Document Step */}
        {currentStep === "document" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center mb-3">
                <Fingerprint size={28} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                Upload Government ID
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Passport, driver's license, or national identity card
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                "passport",
                "drivers_license",
                "national_id",
                "residence_permit",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => setDocumentData({ type, verified: true })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    documentData?.type === type
                      ? "bg-cyan-900/20 border-cyan-700/30"
                      : "bg-slate-800/20 border-slate-700/30 hover:border-slate-600/40",
                  )}
                >
                  <div className="text-xs font-medium text-slate-300 capitalize">
                    {type.replace("_", " ")}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    {type === "passport" && "International travel document"}
                    {type === "drivers_license" && "Government driving permit"}
                    {type === "national_id" && "Citizen identity card"}
                    {type === "residence_permit" && "Legal residency doc"}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-700/40 bg-slate-800/10 text-center">
              <p className="text-xs text-slate-500">
                Drop file here or click to browse
              </p>
              <p className="text-[10px] text-slate-700 mt-1">
                JPG, PNG, PDF • Max 10MB • Front side required
              </p>
            </div>

            {documentData?.verified && (
              <div className="p-3 rounded-lg bg-emerald-950/10 border border-emerald-800/20 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={14} />
                Document verified successfully
              </div>
            )}
          </div>
        )}

        {/* Selfie Step */}
        {currentStep === "selfie" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center mb-3">
                <Scan size={28} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                Liveness Check
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time face verification to prevent identity fraud
              </p>
            </div>

            <div className="aspect-video rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-dashed border-cyan-700/30 animate-pulse" />
              </div>
              <div className="text-center z-10">
                <Camera size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Camera preview will appear here
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Blink", desc: "Both eyes closed" },
                { label: "Turn Left", desc: "Head rotates left" },
                { label: "Smile", desc: "Mouth opens wide" },
              ].map((action) => (
                <div
                  key={action.label}
                  className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/30 text-center"
                >
                  <div className="text-xs font-medium text-slate-300">
                    {action.label}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {action.desc}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                setSelfieData({ captured: true, matchScore: 98.5 })
              }
              className="w-full py-3 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20"
            >
              Start Liveness Check
            </button>

            {selfieData?.captured && (
              <div className="p-3 rounded-lg bg-emerald-950/10 border border-emerald-800/20 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={14} />
                Face match: {selfieData.matchScore}% verified
              </div>
            )}
          </div>
        )}

        {/* Address Step */}
        {currentStep === "address" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center mb-3">
                <Home size={28} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                Proof of Address
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Utility bill, bank statement, or government letter (last 3
                months)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                "utility_bill",
                "bank_statement",
                "government_letter",
                "rental_agreement",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setAddressData({ type, uploaded: true, verified: true })
                  }
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    addressData?.uploaded && addressData?.type === type
                      ? "bg-cyan-900/20 border-cyan-700/30"
                      : "bg-slate-800/20 border-slate-700/30 hover:border-slate-600/40",
                  )}
                >
                  <div className="text-xs font-medium text-slate-300 capitalize">
                    {type.replace("_", " ")}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    {type === "utility_bill" && "Electric, water, or gas"}
                    {type === "bank_statement" && "Official bank document"}
                    {type === "government_letter" && "Tax or official mail"}
                    {type === "rental_agreement" && "Signed lease contract"}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-700/40 bg-slate-800/10 text-center">
              <p className="text-xs text-slate-500">
                Drop file here or click to browse
              </p>
              <p className="text-[10px] text-slate-700 mt-1">
                JPG, PNG, PDF • Max 10MB • Dated within 90 days
              </p>
            </div>

            {addressData?.verified && (
              <div className="p-3 rounded-lg bg-emerald-950/10 border border-emerald-800/20 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={14} />
                Address document verified
              </div>
            )}
          </div>
        )}

        {/* Review Step */}
        {currentStep === "review" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center mb-3">
                <FileCheck size={28} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                Review & Submit
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Verify all information before submitting to 8th Ledger Security
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-200">
                    Government ID
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {documentData?.type?.replace("_", " ") || "Not uploaded"}
                  </div>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  Verified
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-200">
                    Liveness Check
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Match score: {selfieData?.matchScore || 0}%
                  </div>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  Verified
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-200">
                    Proof of Address
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Document uploaded
                  </div>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  Verified
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-800/20 flex items-start gap-3">
              <AlertTriangle
                size={16}
                className="text-amber-400 shrink-0 mt-0.5"
              />
              <div className="text-xs text-amber-300/80 leading-relaxed">
                By submitting, you consent to 8th Ledger Security processing
                your identity data. All documents are encrypted with AES-256 and
                stored in secure vaults. Verification typically takes 24-48
                hours.
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-bold transition-all",
                isSubmitting
                  ? "bg-slate-800/40 border-slate-700/40 text-slate-500 cursor-not-allowed"
                  : "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting to 8th Ledger Security...
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  Submit Verification
                </>
              )}
            </button>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-900/20 border border-emerald-700/30 flex items-center justify-center mb-4">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Verification Submitted
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your SIV/KYC verification has been submitted to 8th Ledger
              Security. You will be notified within 24-48 hours.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 max-w-sm mx-auto">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Reference Number
              </div>
              <div className="text-sm font-mono text-cyan-400">
                SIV-{ledgerId.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {currentStep !== "complete" && (
        <div className="px-6 py-4 border-t border-slate-800/60 bg-[#0d0d1a] flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all",
              currentStepIndex === 0
                ? "bg-slate-800/20 border-slate-800/20 text-slate-700 cursor-not-allowed"
                : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600/40",
            )}
          >
            <ChevronLeft size={14} />
            Back
          </button>

          {currentStep === "review" ? null : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all",
                !canProceed()
                  ? "bg-slate-800/20 border-slate-800/20 text-slate-700 cursor-not-allowed"
                  : "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20",
              )}
            >
              Next
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Security Footer */}
      <div className="px-6 py-3 border-t border-slate-800/40 bg-[#0a0a12] flex items-center justify-center gap-4 text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <Lock size={10} />
          AES-256 Encrypted
        </span>
        <span className="flex items-center gap-1">
          <Eye size={10} />
          8th Ledger Security Only
        </span>
        <span className="flex items-center gap-1">
          <Shield size={10} />
          GDPR Compliant
        </span>
      </div>
    </div>
  );
}
