"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Image,
  FileText,
  Receipt,
  X,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Trash2,
  CheckCircle2,
  Plus,
  Hash,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProofType = "photo" | "invoice" | "certificate";

interface ProofFile {
  id: string;
  type: ProofType;
  url: string;
  caption: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
}

interface ExecutionProofUploaderProps {
  proposalId: string;
  proposalTitle: string;
  hallId: string;
  hallName: string;
  existingProofs?: ProofFile[];
  onUpload?: (files: File[], type: ProofType) => Promise<void>;
  onRemove?: (id: string) => void;
  onUpdateCaption?: (id: string, caption: string) => void;
  onReorder?: (ids: string[]) => void;
  onMarkComplete?: (actualCost: number, notes: string) => void;
  costEstimate: number;
  currency?: string;
}

const proofTypeConfig: Record<
  ProofType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string; accept: string }
> = {
  photo: {
    label: "Photo",
    icon: Image,
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/30",
    accept: "image/*",
  },
  invoice: {
    label: "Invoice",
    icon: Receipt,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    accept: "image/*,application/pdf",
  },
  certificate: {
    label: "Certificate",
    icon: FileText,
    color: "text-purple-400",
    bg: "bg-purple-900/20",
    border: "border-purple-700/30",
    accept: "image/*,application/pdf",
  },
};

export default function ExecutionProofUploader({
  proposalId,
  proposalTitle,
  hallId,
  hallName,
  existingProofs = [],
  onUpload,
  onRemove,
  onUpdateCaption,
  onReorder,
  onMarkComplete,
  costEstimate,
  currency = "$",
}: ExecutionProofUploaderProps) {
  const [activeTab, setActiveTab] = useState<ProofType>("photo");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{ file: File; type: ProofType; preview: string }[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [actualCost, setActualCost] = useState(costEstimate);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [expandedGallery, setExpandedGallery] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addToQueue(files, activeTab);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addToQueue(files, activeTab);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addToQueue = (files: File[], type: ProofType) => {
    const newItems = files.map((file) => ({
      file,
      type,
      preview: URL.createObjectURL(file),
    }));
    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const removeFromQueue = (index: number) => {
    setUploadQueue((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleUploadAll = async () => {
    if (uploadQueue.length === 0) return;
    const grouped = uploadQueue.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item.file);
      return acc;
    }, {} as Record<ProofType, File[]>);

    for (const [type, files] of Object.entries(grouped)) {
      await onUpload?.(files, type as ProofType);
    }

    uploadQueue.forEach((item) => URL.revokeObjectURL(item.preview));
    setUploadQueue([]);
  };

  const allProofs = [...existingProofs, ...uploadQueue.map((q, i) => ({
    id: `queue-${i}`,
    type: q.type,
    url: q.preview,
    caption: "",
    uploadedAt: "Pending",
    uploadedBy: "You",
    size: q.file.size,
  }))];

  const groupedProofs = allProofs.reduce((acc, proof) => {
    if (!acc[proof.type]) acc[proof.type] = [];
    acc[proof.type].push(proof);
    return acc;
  }, {} as Record<ProofType, typeof allProofs>);

  const cfg = proofTypeConfig[activeTab];

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-900/20 border border-purple-700/30 flex items-center justify-center">
            <Upload size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Execution Proof Uploader</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {proposalTitle} • Hall #{hallId.slice(-6)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-amber-950/20 border border-amber-800/20 text-[10px] text-amber-400 font-bold">
            <Hash size={10} className="inline mr-1" />
            {existingProofs.length} uploaded
          </div>
          <button
            onClick={() => setShowCompleteForm(!showCompleteForm)}
            className="px-3 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-white text-xs font-bold hover:bg-emerald-500 transition-all"
          >
            <CheckCircle2 size={12} className="inline mr-1" />
            Mark Complete
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Completion Form */}
        {showCompleteForm && (
          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-800/20 space-y-4 animate-in slide-in-from-top-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={14} />
              Mark Execution Complete
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase">Actual Cost</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(Number(e.target.value))}
                    className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase">vs Estimate</label>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-mono",
                  actualCost > costEstimate
                    ? "bg-red-950/10 border-red-800/20 text-red-400"
                    : actualCost < costEstimate
                    ? "bg-emerald-950/10 border-emerald-800/20 text-emerald-400"
                    : "bg-slate-800/20 border-slate-700/20 text-slate-400"
                )}>
                  {actualCost > costEstimate ? "+" : ""}
                  {(actualCost - costEstimate).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase">Completion Notes</label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe what was done, any issues, and final outcomes..."
                rows={3}
                className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCompleteForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-700/40 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onMarkComplete?.(actualCost, completionNotes);
                  setShowCompleteForm(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-500 text-white text-xs font-bold hover:bg-emerald-500 transition-all"
              >
                Confirm Complete
              </button>
            </div>
          </div>
        )}

        {/* Type Tabs */}
        <div className="flex items-center gap-2">
          {(Object.keys(proofTypeConfig) as ProofType[]).map((type) => {
            const tCfg = proofTypeConfig[type];
            const count = groupedProofs[type]?.length || 0;
            const active = activeTab === type;
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                  active
                    ? `${tCfg.bg} ${tCfg.border} ${tCfg.color}`
                    : "bg-slate-800/20 border-slate-700/30 text-slate-500 hover:text-slate-300"
                )}
              >
                <tCfg.icon size={14} />
                {tCfg.label}
                {count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold",
                    active ? "bg-slate-900/30 text-slate-300" : "bg-slate-800/40 text-slate-600"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all",
            isDragging
              ? "border-purple-500/50 bg-purple-950/10"
              : "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/40"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={cfg.accept}
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="w-14 h-14 mx-auto rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-center mb-3">
            <Plus size={24} className="text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-300 mb-1">
            Drop {cfg.label.toLowerCase()}s here or click to browse
          </p>
          <p className="text-xs text-slate-600">
            {cfg.accept.includes("pdf") ? "JPG, PNG, WebP, PDF" : "JPG, PNG, WebP"} • Max 10MB each
          </p>
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Ready to upload ({uploadQueue.length})
              </span>
              <button
                onClick={handleUploadAll}
                className="px-3 py-2 rounded-lg bg-purple-600 border border-purple-500 text-white text-xs font-bold hover:bg-purple-500 transition-all"
              >
                Upload All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {uploadQueue.map((item, i) => (
                <div key={i} className="relative group">
                  <div className="aspect-video rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden">
                    <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => removeFromQueue(i)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-[10px] text-white font-mono">
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {existingProofs.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setExpandedGallery(!expandedGallery)}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              {expandedGallery ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>Proof Gallery ({existingProofs.length})</span>
            </button>

            {expandedGallery && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingProofs.map((proof) => {
                  const pCfg = proofTypeConfig[proof.type];
                  const PIcon = pCfg.icon;

                  return (
                    <div key={proof.id} className="group relative">
                      <div
                        className={cn(
                          "aspect-video rounded-xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02]",
                          pCfg.border
                        )}
                        onClick={() => proof.type === "photo" && setLightboxImage(proof.url)}
                      >
                        {proof.type === "photo" ? (
                          <img src={proof.url} alt={proof.caption} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-900/50 flex items-center justify-center">
                            <PIcon size={32} className={cn(pCfg.color, "opacity-40")} />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-white font-medium flex items-center gap-1">
                          <PIcon size={10} />
                          {pCfg.label}
                        </div>
                      </div>

                      {/* Caption & Meta */}
                      <div className="mt-2 space-y-1">
                        <input
                          type="text"
                          value={proof.caption}
                          onChange={(e) => onUpdateCaption?.(proof.id, e.target.value)}
                          placeholder="Add caption..."
                          className="w-full bg-transparent text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-600">
                          <span>{proof.uploadedBy}</span>
                          <span>{new Date(proof.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {proof.type === "photo" && (
                          <button
                            onClick={() => setLightboxImage(proof.url)}
                            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                          >
                            <ZoomIn size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => onRemove?.(proof.id)}
                          className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {existingProofs.length === 0 && uploadQueue.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            <Upload size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No proofs uploaded yet</p>
            <p className="text-xs text-slate-700 mt-1">Upload before/after photos, invoices, and certificates</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt="Proof"
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border border-slate-800/60"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}