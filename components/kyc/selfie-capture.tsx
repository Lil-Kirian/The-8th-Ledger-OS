"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ScanFace,
  Shield,
  Eye,
  Fingerprint,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  UserCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SelfieStatus = "idle" | "capturing" | "processing" | "matched" | "mismatch" | "retry";

interface SelfieCaptureProps {
  onCapture?: (imageData: string) => Promise<void>;
  onRetry?: () => void;
  status?: SelfieStatus;
  capturedImage?: string;
  matchScore?: number;
  idPreviewUrl?: string;
  guidance?: string;
}

const statusConfig: Record<
  SelfieStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  idle: {
    label: "Ready to capture",
    color: "text-slate-400",
    bg: "bg-slate-800/20",
    border: "border-slate-700/30",
    icon: Camera,
  },
  capturing: {
    label: "Capturing...",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: Loader2,
  },
  processing: {
    label: "Analyzing face...",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: ScanFace,
  },
  matched: {
    label: "Face Matched",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: CheckCircle2,
  },
  mismatch: {
    label: "Mismatch Detected",
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/30",
    icon: AlertTriangle,
  },
  retry: {
    label: "Retry Needed",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: RotateCcw,
  },
};

export default function SelfieCapture({
  onCapture,
  onRetry,
  status = "idle",
  capturedImage,
  matchScore,
  idPreviewUrl,
  guidance,
}: SelfieCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [liveImage, setLiveImage] = useState<string | null>(null);
  const [lighting, setLighting] = useState<"auto" | "bright" | "dim">("auto");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

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
  };

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setLiveImage(dataUrl);
    stopCamera();
    onCapture?.(dataUrl);
  }, [stream, onCapture]);

  const retake = () => {
    setLiveImage(null);
    onRetry?.();
    startCamera();
  };

  const getLightingColor = () => {
    switch (lighting) {
      case "bright":
        return "text-amber-400";
      case "dim":
        return "text-blue-400";
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
            <ScanFace size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Selfie Capture</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Step 2 of 4 — Face Match</p>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", cfg.bg, cfg.border, cfg.color)}>
          <StatusIcon size={10} className={status === "capturing" || status === "processing" ? "animate-spin" : ""} />
          {cfg.label}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* ID Preview */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Fingerprint size={10} />
              ID Document
            </div>
            <div className="aspect-[3/4] rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden flex items-center justify-center">
              {idPreviewUrl ? (
                <img src={idPreviewUrl} alt="ID" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-600">
                  <FileText size={24} className="mx-auto mb-1 opacity-30" />
                  <span className="text-[10px]">ID from Step 1</span>
                </div>
              )}
            </div>
          </div>

          {/* Selfie Preview */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Camera size={10} />
              Your Selfie
            </div>
            <div className="aspect-[3/4] rounded-xl bg-slate-800/30 border border-slate-700/30 overflow-hidden relative">
              {liveImage || capturedImage ? (
                <img src={liveImage || capturedImage} alt="Selfie" className="w-full h-full object-cover" />
              ) : stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <div className="text-center">
                    <Camera size={24} className="mx-auto mb-1 opacity-30" />
                    <span className="text-[10px]">Camera preview</span>
                  </div>
                </div>
              )}

              {/* Face overlay guide */}
              {(stream || liveImage || capturedImage) && status !== "matched" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-40 border-2 border-dashed border-cyan-500/30 rounded-full" />
                </div>
              )}

              {/* Match overlay */}
              {status === "matched" && (
                <div className="absolute inset-0 bg-emerald-900/20 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-2" />
                    <span className="text-sm font-bold text-emerald-400">Matched</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Score */}
        {matchScore !== undefined && (
          <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 text-center space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Confidence Score</div>
            <div className="text-3xl font-bold font-mono">
              <span className={matchScore >= 85 ? "text-emerald-400" : matchScore >= 70 ? "text-amber-400" : "text-red-400"}>
                {matchScore.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  matchScore >= 85 ? "bg-emerald-500" : matchScore >= 70 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${matchScore}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-600">
              {matchScore >= 85
                ? "High confidence match. Proceeding to liveness check."
                : matchScore >= 70
                ? "Moderate match. Additional verification may be required."
                : "Low match confidence. Please retake with better lighting."}
            </div>
          </div>
        )}

        {/* Guidance */}
        {guidance && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-cyan-950/10 border border-cyan-800/20">
            <Zap size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-xs text-cyan-300 leading-relaxed">{guidance}</p>
          </div>
        )}

        {/* Camera Controls */}
        <div className="space-y-3">
          {!stream && !liveImage && !capturedImage && (
            <button
              onClick={startCamera}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20"
            >
              <Camera size={18} />
              Start Camera
            </button>
          )}

          {stream && (
            <div className="space-y-3">
              {/* Lighting toggle */}
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

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={stopCamera}
                  className="px-4 py-3 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={capture}
                  className="px-4 py-3 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20"
                >
                  Capture
                </button>
              </div>
            </div>
          )}

          {(liveImage || capturedImage) && status !== "matched" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={retake}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
              >
                <RotateCcw size={16} />
                Retake
              </button>
              <button
                disabled={status === "processing" || status === "capturing"}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50"
              >
                {status === "processing" ? <Loader2 size={16} className="animate-spin" /> : <ScanFace size={16} />}
                {status === "processing" ? "Analyzing..." : "Verify Match"}
              </button>
            </div>
          )}

          {status === "mismatch" && (
            <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-red-400 mb-1">Face Mismatch</div>
                <p className="text-xs text-red-300/80 leading-relaxed">
                  The selfie does not match the uploaded ID. Ensure good lighting, remove glasses, and face the camera directly.
                </p>
                <button
                  onClick={retake}
                  className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <RotateCcw size={12} />
                  Try again
                </button>
              </div>
            </div>
          )}

          {status === "matched" && (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-sm font-bold hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20">
              <ChevronRight size={18} />
              Continue to Liveness Check
            </button>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <Shield size={10} />
            <span>Biometric data never stored raw</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck size={10} />
            <span>1:N face match against ID</span>
          </div>
        </div>
      </div>
    </div>
  );
}