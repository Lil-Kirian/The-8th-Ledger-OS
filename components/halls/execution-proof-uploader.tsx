"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Award,
  X,
  CheckCircle2,
  Camera,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Save,
  DollarSign,
  FileDigit,
  Loader2,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// ─── Types ───
export type ProofType = "photo" | "invoice" | "certificate";

export interface ProofFile {
  id: string;
  type: ProofType;
  fileName: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  uploadedAt: string;
  uploadProgress: number;
  status: "uploading" | "complete" | "error";
}

export interface ExecutionProofUploaderProps {
  proposalId: string;
  proposalTitle: string;
  estimatedCost: number;
  currency?: string;
  existingProofs?: ProofFile[];
  isLoading?: boolean;
  onUpload?: (files: File[], type: ProofType) => void;
  onDelete?: (proofId: string) => void;
  onUpdateCaption?: (proofId: string, caption: string) => void;
  onComplete?: (data: { actualCost: number; completionNotes: string; proofIds: string[] }) => void;
}

// ─── Config ───
const PROOF_CONFIG: Record<ProofType, { label: string; icon: React.ElementType; color: string; bg: string; border: string; accept: string; description: string }> = {
  photo: {
    label: "Photo Evidence",
    icon: Camera,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    accept: "image/*",
    description: "Before/after photos, site images, work-in-progress shots",
  },
  invoice: {
    label: "Invoice / Receipt",
    icon: Receipt,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    accept: ".pdf,.png,.jpg,.jpeg",
    description: "Vendor invoices, payment receipts, expense reports",
  },
  certificate: {
    label: "Certificate / Document",
    icon: Award,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    accept: ".pdf,.png,.jpg,.jpeg",
    description: "Completion certificates, inspection reports, compliance docs",
  },
};

// ─── Helpers ───
function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatCurrency(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

// ─── Component ───
export function ExecutionProofUploader({
  proposalId,
  proposalTitle,
  estimatedCost,
  currency = "USD",
  existingProofs = [],
  isLoading = false,
  onUpload,
  onDelete,
  onUpdateCaption,
  onComplete,
}: ExecutionProofUploaderProps) {
  const [proofs, setProofs] = useState<ProofFile[]>(existingProofs);
  const [activeType, setActiveType] = useState<ProofType>("photo");
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allProofs = proofs;
  const photoProofs = proofs.filter((p) => p.type === "photo");
  const invoiceProofs = proofs.filter((p) => p.type === "invoice");
  const certProofs = proofs.filter((p) => p.type === "certificate");

  const costVariance = actualCost
    ? Number(actualCost) - estimatedCost
    : 0;
  const costVariancePct = estimatedCost > 0 ? (costVariance / estimatedCost) * 100 : 0;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length && onUpload) {
        onUpload(files, activeType);
        // Simulate local addition for UI
        const newProofs: ProofFile[] = files.map((file, i) => ({
          id: `temp-${Date.now()}-${i}`,
          type: activeType,
          fileName: file.name,
          fileSize: file.size,
          url: URL.createObjectURL(file),
          caption: "",
          uploadedAt: new Date().toISOString(),
          uploadProgress: 0,
          status: "uploading",
        }));
        setProofs((prev) => [...prev, ...newProofs]);
      }
    },
    [activeType, onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length && onUpload) {
        onUpload(files, activeType);
        const newProofs: ProofFile[] = files.map((file, i) => ({
          id: `temp-${Date.now()}-${i}`,
          type: activeType,
          fileName: file.name,
          fileSize: file.size,
          url: URL.createObjectURL(file),
          caption: "",
          uploadedAt: new Date().toISOString(),
          uploadProgress: 0,
          status: "uploading",
        }));
        setProofs((prev) => [...prev, ...newProofs]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [activeType, onUpload]
  );

  const handleDelete = (proofId: string) => {
    onDelete?.(proofId);
    setProofs((prev) => prev.filter((p) => p.id !== proofId));
  };

  const startEditCaption = (proof: ProofFile) => {
    setEditingCaption(proof.id);
    setCaptionDraft(proof.caption);
  };

  const saveCaption = (proofId: string) => {
    onUpdateCaption?.(proofId, captionDraft);
    setProofs((prev) => prev.map((p) => (p.id === proofId ? { ...p, caption: captionDraft } : p)));
    setEditingCaption(null);
    setCaptionDraft("");
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextLightbox = () => setLightboxIndex((prev) => (prev != null && prev < allProofs.length - 1 ? prev + 1 : prev));
  const prevLightbox = () => setLightboxIndex((prev) => (prev != null && prev > 0 ? prev - 1 : prev));

  const handleComplete = () => {
    setIsSubmitting(true);
    onComplete?.({
      actualCost: Number(actualCost) || 0,
      completionNotes,
      proofIds: proofs.filter((p) => p.status === "complete").map((p) => p.id),
    });
    setTimeout(() => setIsSubmitting(false), 1500);
  };

  const cfg = PROOF_CONFIG[activeType];
  const TypeIcon = cfg.icon;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Execution Proof</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Proposal: <span className="text-slate-300">{proposalTitle}</span> ·{" "}
            Est. cost: <span className="font-mono text-slate-300">{formatCurrency(estimatedCost, currency)}</span>
          </p>
        </div>
        <Badge className="text-xs bg-slate-800 text-slate-400 border-0">
          <FileDigit className="w-3 h-3 mr-1" />
          ID: {proposalId}
        </Badge>
      </div>

      {/* ─── Type Tabs ─── */}
      <div className="flex gap-2">
        {(["photo", "invoice", "certificate"] as ProofType[]).map((type) => {
          const t = PROOF_CONFIG[type];
          const TIcon = t.icon;
          const count = proofs.filter((p) => p.type === type).length;
          const isActive = activeType === type;

          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                isActive
                  ? `${t.border} ${t.bg} ${t.color}`
                  : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
              }`}
            >
              <TIcon className="w-4 h-4" />
              {t.label}
              {count > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-slate-900/50" : "bg-slate-800"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Upload Zone ─── */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-cyan-500/40 bg-cyan-950/10"
            : "border-slate-700 bg-slate-950/30 hover:border-slate-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl ${cfg.bg} flex items-center justify-center mb-4`}>
              <TypeIcon className={`w-7 h-7 ${cfg.color}`} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Drop {cfg.label} here
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">{cfg.description}</p>
            <div className="text-[10px] text-slate-600 mb-4">
              Accepted: {cfg.accept} · Max 20MB per file
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs border-slate-700 text-slate-400 hover:text-slate-200"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={cfg.accept}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Upload Queue ─── */}
      {proofs.some((p) => p.status === "uploading") && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploading</h4>
          {proofs
            .filter((p) => p.status === "uploading")
            .map((proof) => (
              <div key={proof.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300 truncate">{proof.fileName}</div>
                  <div className="text-[10px] text-slate-500">{formatFileSize(proof.fileSize)}</div>
                </div>
                <div className="w-24">
                  <Progress value={proof.uploadProgress} className="h-1.5" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{proof.uploadProgress}%</span>
              </div>
            ))}
        </div>
      )}

      {/* ─── Gallery ─── */}
      {proofs.filter((p) => p.type === activeType && p.status === "complete").length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {cfg.label} Gallery
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {proofs
              .filter((p) => p.type === activeType && p.status === "complete")
              .map((proof, index) => {
                const globalIndex = allProofs.findIndex((p) => p.id === proof.id);
                const isEditing = editingCaption === proof.id;

                return (
                  <motion.div
                    key={proof.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-square bg-slate-800 cursor-pointer relative overflow-hidden"
                      onClick={() => openLightbox(globalIndex)}
                    >
                      {proof.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={proof.thumbnailUrl || proof.url}
                          alt={proof.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <FileText className="w-8 h-8 text-slate-600" />
                          <span className="text-[10px] text-slate-600 px-2 text-center truncate w-full">
                            {proof.fileName}
                          </span>
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </div>
                      {/* Type badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`text-[9px] border-0 ${PROOF_CONFIG[proof.type].bg} ${PROOF_CONFIG[proof.type].color}`}>
                          {PROOF_CONFIG[proof.type].label}
                        </Badge>
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="p-2.5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={captionDraft}
                            onChange={(e) => setCaptionDraft(e.target.value)}
                            placeholder="Add caption..."
                            className="h-7 text-xs bg-slate-900 border-slate-700 text-slate-200"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => saveCaption(proof.id)}
                              className="h-6 text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-2"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCaption(null)}
                              className="h-6 text-[10px] text-slate-500 hover:text-slate-300 px-2"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] text-slate-400 line-clamp-2 flex-1">
                            {proof.caption || <span className="text-slate-600 italic">No caption</span>}
                          </p>
                          <button
                            onClick={() => startEditCaption(proof)}
                            className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                        <span className="text-[9px] text-slate-600">{formatFileSize(proof.fileSize)}</span>
                        <button
                          onClick={() => handleDelete(proof.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── Completion Form ─── */}
      <Card className="border-slate-800 bg-slate-950/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">Completion Form</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Actual Cost ({currency})</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder={estimatedCost.toString()}
                  className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600"
                />
              </div>
              {actualCost && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge
                    className={`text-[10px] border-0 ${
                      costVariance > 0
                        ? "bg-red-500/10 text-red-400"
                        : costVariance < 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {costVariance > 0 ? (
                      <TrendingUp className="w-2.5 h-2.5 mr-1" />
                    ) : costVariance < 0 ? (
                      <TrendingDown className="w-2.5 h-2.5 mr-1" />
                    ) : (
                      <Minus className="w-2.5 h-2.5 mr-1" />
                    )}
                    {costVariance > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(costVariance), currency)} ({costVariancePct.toFixed(1)}%)
                  </Badge>
                  <span className="text-[10px] text-slate-500">
                    vs est. {formatCurrency(estimatedCost, currency)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Completion Notes</label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe the work completed, any challenges faced, and outcomes achieved..."
                rows={3}
                className="bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-600 resize-none"
              />
            </div>
          </div>

          {/* Proof Summary */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 mb-2">Proof Summary</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-500">{photoProofs.length} photos</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-500">{invoiceProofs.length} invoices</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Award className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-slate-500">{certProofs.length} certificates</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || proofs.filter((p) => p.status === "complete").length === 0}
              className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Mark Complete
                </>
              )}
            </Button>
            <span className="text-[10px] text-slate-500">
              {proofs.filter((p) => p.status === "complete").length === 0
                ? "Upload at least one proof to complete"
                : `${proofs.filter((p) => p.status === "complete").length} proof(s) ready`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Lightbox ─── */}
      <AnimatePresence>
        {lightboxIndex != null && allProofs[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              {/* Close */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Nav */}
              {lightboxIndex > 0 && (
                <button
                  onClick={prevLightbox}
                  className="absolute left-4 z-10 w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {lightboxIndex < allProofs.length - 1 && (
                <button
                  onClick={nextLightbox}
                  className="absolute right-4 z-10 w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Content */}
              <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
                {allProofs[lightboxIndex].url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={allProofs[lightboxIndex].url}
                    alt={allProofs[lightboxIndex].fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-96 h-64 rounded-lg bg-slate-800 flex flex-col items-center justify-center gap-3">
                    <FileText className="w-12 h-12 text-slate-600" />
                    <span className="text-sm text-slate-400">{allProofs[lightboxIndex].fileName}</span>
                    <span className="text-xs text-slate-600">{formatFileSize(allProofs[lightboxIndex].fileSize)}</span>
                  </div>
                )}
                <div className="mt-4 text-center">
                  <div className="text-sm text-slate-200">{allProofs[lightboxIndex].fileName}</div>
                  {allProofs[lightboxIndex].caption && (
                    <div className="text-xs text-slate-400 mt-1">{allProofs[lightboxIndex].caption}</div>
                  )}
                  <div className="text-[10px] text-slate-600 mt-2">
                    {lightboxIndex + 1} / {allProofs.length} · {PROOF_CONFIG[allProofs[lightboxIndex].type].label}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
