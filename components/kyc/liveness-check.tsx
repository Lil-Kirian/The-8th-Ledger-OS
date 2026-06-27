"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  Eye,
  Smile,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ChevronRight,
  Zap,
  BrainCircuit,
  ScanFace,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LivenessChallenge = "blink" | "smile" | "turn_left" | "turn_right" | "look_up" | "look_down";
type LivenessStatus = "idle" | "challenge" | "detecting" | "passed" | "failed";

interface LivenessCheckProps {
  onComplete?: (result: { passed: boolean; challengeLog: string[] }) => void;
  onRetry?: () => void;
  status?: LivenessStatus;
  currentChallenge?: LivenessChallenge;
  progress?: number; // 0-100
  instruction?: string;
}

const challenges: Record<
  LivenessChallenge,
  { label: string; instruction: string; icon: React.ElementType; timeout: number }
> = {
  blink: {
    label: "Blink",
    instruction: "Blink both eyes naturally",
    icon: Eye,
    timeout: 5000,
  },
  smile: {
    label: "Smile",
    instruction: "Smile briefly",
    icon: Smile,
    timeout: 5000,
  },
  turn_left: {
    label: "Turn Left",
    instruction: "Turn your head to the left",
    icon: ArrowLeft,
    timeout: 6000,
  },
  turn_right: {
    label: "Turn Right",
    instruction: "Turn your head to the right",
    icon: ArrowRight,
    timeout: 6000,
  },
  look_up: {
    label: "Look Up",
    instruction: "Look up toward the ceiling",
    icon: ArrowUp,
    timeout: 5000,
  },
  look_down: {
    label: "Look Down",
    instruction: "Look down toward the floor",
    icon: ArrowDown,
    timeout: 5000,
  },
};

const statusConfig: Record<
  LivenessStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  idle: {
    label: "Ready",
    color: "text-slate-400",
    bg: "bg-slate-800/20",
    border: "border-slate-700/30",
    icon: Video,
  },
  challenge: {
    label: "Challenge Active",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Zap,
  },
  detecting: {
    label: "Analyzing...",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: BrainCircuit,
  },
  passed: {
    label: "Liveness Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: CheckCircle2,
  },
  failed: {
    label: "Verification Failed",
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/30",
    icon: AlertTriangle,
  },
};

export default function LivenessCheck({
  onComplete,
  onRetry,
  status = "idle",
  currentChallenge = "blink",
  progress = 0,
  instruction,
}: LivenessCheckProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [challengeLog, setChallengeLog] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [lighting, setLighting] = useState<"auto" | "bright" | "dim">("auto");
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;
  const challengeCfg = challenges[currentChallenge];
  const ChallengeIcon = challengeCfg.icon;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (status === "challenge" && stream) {
      setTimer(challengeCfg.timeout);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 100) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return t - 100;
        });
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, currentChallenge, stream, challengeCfg.timeout]);

  const handleComplete = () => {
    onComplete?.({ passed: true, challengeLog });
    stopCamera();
  };

  const handleRetry = () => {
    setChallengeLog([]);
    onRetry?.();
    startCamera();
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
            <BrainCircuit size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Liveness Verification</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Step 3 of 4 — Challenge/Response</p>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", cfg.bg, cfg.border, cfg.color)}>
          <StatusIcon size={10} className={status === "detecting" ? "animate-pulse" : ""} />
          {cfg.label}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Camera View */}
        <div className="relative aspect-video rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Video size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Camera inactive</p>
              </div>
            </div>
          )}

          {/* Overlay elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Face oval guide */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-64 border-2 border-dashed border-cyan-500/20 rounded-[50%]" />
            </div>

            {/* Challenge indicator */}
            {status === "challenge" && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-amber-500/30 flex items-center gap-2">
                <ChallengeIcon size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{challengeCfg.label}</span>
              </div>
            )}

            {/* Progress ring */}
            {status === "challenge" && (
              <div className="absolute top-4 right-4">
                <div className="relative w-12 h-12">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={125.6}
                      strokeDashoffset={(timer / challengeCfg.timeout) * 125.6}
                      className="transition-all duration-100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-400 font-mono">
                    {Math.ceil(timer / 1000)}s
                  </div>
                </div>
              </div>
            )}

            {/* Passed overlay */}
            {status === "passed" && (
              <div className="absolute inset-0 bg-emerald-900/20 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-2" />
                  <span className="text-lg font-bold text-emerald-400">Liveness Confirmed</span>
                </div>
              </div>
            )}

            {/* Failed overlay */}
            {status === "failed" && (
              <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle size={48} className="text-red-400 mx-auto mb-2" />
                  <span className="text-lg font-bold text-red-400">Verification Failed</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60">
            <div
              className="h-full bg-cyan-500/60 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Challenge Instructions */}
        {status === "challenge" && (
          <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-800/20 text-center space-y-2 animate-in fade-in">
            <div className="flex items-center justify-center gap-2">
              <ChallengeIcon size={20} className="text-amber-400" />
              <span className="text-base font-bold text-amber-400">{challengeCfg.instruction}</span>
            </div>
            {instruction && (
              <p className="text-xs text-amber-300/70">{instruction}</p>
            )}
            <div className="text-[10px] text-amber-600/60">
              Hold still after completing the action
            </div>
          </div>
        )}

        {/* Challenge Log */}
        {challengeLog.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Completed Challenges</div>
            <div className="flex flex-wrap gap-2">
              {challengeLog.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-[10px] text-emerald-400"
                >
                  <CheckCircle2 size={10} />
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!stream && status === "idle" && (
            <button
              onClick={startCamera}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20"
            >
              <Video size={18} />
              Start Liveness Check
            </button>
          )}

          {stream && status === "idle" && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setLighting("bright")}
                  className={cn(
                    "p-2 rounded-lg border transition-all",
                    lighting === "bright" ? "bg-amber-900/20 border-amber-700/30 text-amber-400" : "bg-slate-800/20 border-slate-700/30 text-slate-500"
                  )}
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => setLighting("auto")}
                  className={cn(
                    "p-2 rounded-lg border transition-all",
                    lighting === "auto" ? "bg-slate-800/40 border-slate-600/40 text-slate-300" : "bg-slate-800/20 border-slate-700/30 text-slate-500"
                  )}
                >
                  <Zap size={16} />
                </button>
                <button
                  onClick={() => setLighting("dim")}
                  className={cn(
                    "p-2 rounded-lg border transition-all",
                    lighting === "dim" ? "bg-blue-900/20 border-blue-700/30 text-blue-400" : "bg-slate-800/20 border-slate-700/30 text-slate-500"
                  )}
                >
                  <Moon size={16} />
                </button>
              </div>
              <div className="text-center text-xs text-slate-500">
                Ensure your face is well-lit and centered in the oval
              </div>
              <button
                onClick={() => {
                  setChallengeLog([]);
                  onComplete?.({ passed: false, challengeLog: [] });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all"
              >
                <ScanFace size={18} />
                Begin Challenges
              </button>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-red-400 mb-1">Could Not Verify Liveness</div>
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    The system could not confirm you are a real person. Common causes: poor lighting, moving too fast, or using a photo/video instead of a live face.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={stopCamera}
                  className="px-4 py-3 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className="px-4 py-3 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all"
                >
                  <RotateCcw size={16} className="inline mr-1.5" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {status === "passed" && (
            <button
              onClick={handleComplete}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 border border-emerald-500 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
            >
              <ChevronRight size={18} />
              Continue to Address Proof
            </button>
          )}
        </div>

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <Shield size={10} />
            <span>Anti-spoofing active</span>
          </div>
          <div className="flex items-center gap-2">
            <BrainCircuit size={10} />
            <span>AI-powered detection</span>
          </div>
        </div>
      </div>
    </div>
  );
}