"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Image,
  CheckCircle2,
  X,
  AlertTriangle,
  Eye,
  RotateCcw,
  ChevronRight,
  Shield,
  Fingerprint,
  Scan,
  Loader2,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentType = "passport" | "drivers_license" | "national_id" | "residence_permit";
type UploadStatus = "idle" | "uploading" | "processing" | "verified" | "rejected";

interface DocumentUploadProps {
  onUpload?: (file: File, type: DocumentType) => Promise<void>;
  onRetry?: () => void;
  status?: UploadStatus;
  previewUrl?: string;
  documentType?: DocumentType;
  ocrData?: {
    fullName?: string;
    documentNumber?: string;
    expiryDate?: string;
    issuingCountry?: string;
  };
  rejectionReason?: string;
}

const documentTypes: Record<
  DocumentType,
  { label: string; description: string; icon: React.ElementType }
> = {
  passport: {
    label: "Passport",
    description: "International travel document",
    icon: FileText,
  },
  drivers_license: {
    label: "Driver's License",
    description: "Government-issued driving permit",
    icon: FileText,
  },
  national_id: {
    label: "National ID",
    description: "Citizen identity card",
    icon: FileText,
  },
  residence_permit: {
    label: "Residence Permit",
    description: "Legal residency documentation",
    icon: FileText,
  },
};

const statusConfig: Record<
  UploadStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  idle: {
    label: "Ready to upload",
    color: "text-slate-400",
    bg: "bg-slate-800/20",
    border: "border-slate-700/30",
    icon: Upload,
  },
  uploading: {
    label: "Uploading...",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: Loader2,
  },
  processing: {
    label: "OCR Processing...",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Scan,
  },
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-400",
    bg: "bg-red-900/20",
    border: "border-red-700/30",
    icon: AlertTriangle,
  },
};

export default function DocumentUpload({
  onUpload,
  onRetry,
  status = "idle",
  previewUrl,
  documentType,
  ocrData,
  rejectionReason,
}: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>(documentType || "passport");
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(droppedFile);
      }
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    await onUpload?.(file, selectedType);
  };

  const clearPreview = () => {
    setPreview(undefined);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
            <Fingerprint size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Government ID Upload</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Step 1 of 4 — SIV/KYC Verification</p>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5", cfg.bg, cfg.border, cfg.color)}>
          <StatusIcon size={10} className={status === "uploading" || status === "processing" ? "animate-spin" : ""} />
          {cfg.label}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Document Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Document Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(documentTypes) as DocumentType[]).map((type) => {
              const dt = documentTypes[type];
              const Icon = dt.icon;
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left",
                    active
                      ? "bg-cyan-900/20 border-cyan-700/30"
                      : "bg-slate-800/20 border-slate-700/30 hover:border-slate-600/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border",
                      active ? "bg-cyan-900/20 border-cyan-700/30" : "bg-slate-800/40 border-slate-700/30"
                    )}
                  >
                    <Icon size={14} className={active ? "text-cyan-400" : "text-slate-500"} />
                  </div>
                  <div>
                    <div className={cn("text-xs font-medium", active ? "text-cyan-300" : "text-slate-300")}>
                      {dt.label}
                    </div>
                    <div className="text-[10px] text-slate-600">{dt.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Zone */}
        {!preview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all",
              isDragging
                ? "border-cyan-500/50 bg-cyan-950/10"
                : "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/40"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-center mb-3">
              <Upload size={24} className="text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">
              Drop ID photo here or click to browse
            </p>
            <p className="text-xs text-slate-600">
              JPG, PNG, WebP, or PDF • Max 10MB • Front side required
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
              <Shield size={10} />
              <span>Encrypted at rest • AES-256</span>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-700/30">
            <img src={preview} alt="ID Preview" className="w-full aspect-[3/2] object-contain bg-slate-900/50" />
            <button
              onClick={clearPreview}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] text-white font-mono">
              {file?.name || "document.jpg"}
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrData && status === "verified" && (
          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/20 space-y-2.5 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
              <Scan size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">OCR Extracted Data</span>
            </div>
            {ocrData.fullName && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Full Name</span>
                <span className="text-slate-200 font-medium">{ocrData.fullName}</span>
              </div>
            )}
            {ocrData.documentNumber && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Document Number</span>
                <span className="text-slate-200 font-mono">{ocrData.documentNumber}</span>
              </div>
            )}
            {ocrData.expiryDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Expiry Date</span>
                <span className="text-slate-200 font-mono">{ocrData.expiryDate}</span>
              </div>
            )}
            {ocrData.issuingCountry && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Issuing Country</span>
                <span className="text-slate-200">{ocrData.issuingCountry}</span>
              </div>
            )}
          </div>
        )}

        {/* Rejection */}
        {status === "rejected" && rejectionReason && (
          <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-red-400 mb-1">Verification Failed</div>
              <p className="text-xs text-red-300/80 leading-relaxed">{rejectionReason}</p>
              <button
                onClick={() => {
                  clearPreview();
                  onRetry?.();
                }}
                className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <RotateCcw size={12} />
                Retry upload
              </button>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {preview && status !== "verified" && (
          <button
            onClick={handleUpload}
            disabled={status === "uploading" || status === "processing"}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-bold transition-all",
              status === "uploading" || status === "processing"
                ? "bg-slate-800/40 border-slate-700/40 text-slate-500 cursor-not-allowed"
                : "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20"
            )}
          >
            {status === "uploading" || status === "processing" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileCheck size={18} />
            )}
            {status === "uploading" ? "Uploading..." : status === "processing" ? "Processing..." : "Verify Document"}
          </button>
        )}

        {/* Next Step CTA */}
        {status === "verified" && (
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 border border-emerald-500 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">
            <ChevronRight size={18} />
            Continue to Selfie Capture
          </button>
        )}

        {/* Security Footer */}
        <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <Shield size={10} />
            <span>256-bit encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={10} />
            <span>Only 8th Ledger Security sees this</span>
          </div>
        </div>
      </div>
    </div>
  );
}