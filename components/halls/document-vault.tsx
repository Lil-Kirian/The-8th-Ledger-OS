// components/halls/document-vault.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Gavel,
  ScrollText,
  Receipt,
  BadgeCheck,
  Search,
  Download,
  Eye,
  Lock,
  Hash,
  Upload,
  X,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

//  Types

export type DocumentCategory =
  | "deed"
  | "insurance"
  | "spv_agreement"
  | "constitution"
  | "tax_record"
  | "audit_trail"
  | "maintenance_record"
  | "payroll_record"
  | "legal_filing"
  | "valuation_report"
  | "pir_record"
  | "closure_document";

export type DocumentFileType = "pdf" | "doc" | "xls" | "image" | "txt" | "csv" | "json";

export interface VaultDocument {
  id: string;
  hallId: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: DocumentFileType;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: Date;
  auditHash: string;
  isRestricted?: boolean;
  requiresAcknowledgment?: boolean;
  acknowledgedBy?: string[];
  version?: number;
  previousVersionId?: string;
}

export interface DocumentVaultProps {
  hallId: string;
  hallName: string;
  documents: VaultDocument[];
  isAdmin?: boolean;
  isTreasurer?: boolean;
  currentUserLedgerId: string;
  onDownload?: (doc: VaultDocument) => void;
  onView?: (doc: VaultDocument) => void;
  onUpload?: (file: File, category: DocumentCategory, title: string) => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
  onAcknowledge?: (docId: string) => void;
  className?: string;
}

//  Category Config

const CATEGORY_CONFIG: Record<
  DocumentCategory,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    description: string;
  }
> = {
  deed: {
    label: "Deed & Title",
    icon: Gavel,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    description: "Property deed, title documents, and ownership records",
  },
  insurance: {
    label: "Insurance Certificate",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    description: "Lloyd's coverage, casualty, and liability policies",
  },
  spv_agreement: {
    label: "SPV Agreement",
    icon: LandmarkIcon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    description: "Special Purpose Vehicle operating agreements",
  },
  constitution: {
    label: "Hall Constitution",
    icon: ScrollText,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    description: "Governance rules and bylaws voted by the hall",
  },
  tax_record: {
    label: "Tax Record",
    icon: Receipt,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/25",
    description: "Property tax receipts and filings",
  },
  audit_trail: {
    label: "Audit Trail",
    icon: BadgeCheck,
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/25",
    description: "Independent audit reports and verification",
  },
  maintenance_record: {
    label: "Maintenance Record",
    icon: FileText,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/25",
    description: "Repair logs, vendor contracts, and upkeep history",
  },
  payroll_record: {
    label: "Payroll Record",
    icon: FileSpreadsheet,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
    description: "Worker payroll and timesheet records",
  },
  legal_filing: {
    label: "Legal Filing",
    icon: Gavel,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    description: "Court filings, registrations, and compliance documents",
  },
  valuation_report: {
    label: "Valuation Report",
    icon: TrendingUpIcon,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
    description: "Dynamic PAC valuation and appraisal reports",
  },
  pir_record: {
    label: "PIR Record",
    icon: VaultIcon,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    description: "Protocol Infrastructure Reserve allocations and advances",
  },
  closure_document: {
    label: "Closure Document",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    description: "Liquidation records and dissolution papers",
  },
};

function LandmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Gavel {...props} />;
}
function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return <FileText {...props} />;
}
function VaultIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Lock {...props} />;
}

const FILE_TYPE_CONFIG: Record<
  DocumentFileType,
  { icon: React.ElementType; color: string; label: string }
> = {
  pdf: { icon: FileText, color: "text-red-400", label: "PDF" },
  doc: { icon: FileText, color: "text-blue-400", label: "DOC" },
  xls: { icon: FileSpreadsheet, color: "text-emerald-400", label: "XLS" },
  image: { icon: FileImage, color: "text-purple-400", label: "IMG" },
  txt: { icon: FileCode, color: "text-slate-400", label: "TXT" },
  csv: { icon: FileSpreadsheet, color: "text-emerald-400", label: "CSV" },
  json: { icon: FileCode, color: "text-yellow-400", label: "JSON" },
};

//  Helpers

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

//  Document Card

function DocumentCard({
  doc,
  isAdmin,
  isTreasurer,
  currentUserLedgerId,
  onDownload,
  onView,
  onDelete,
  onAcknowledge,
}: {
  doc: VaultDocument;
  isAdmin?: boolean;
  isTreasurer?: boolean;
  currentUserLedgerId: string;
  onDownload?: (doc: VaultDocument) => void;
  onView?: (doc: VaultDocument) => void;
  onDelete?: (docId: string) => Promise<void>;
  onAcknowledge?: (docId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const catCfg = CATEGORY_CONFIG[doc.category];
  const CatIcon = catCfg.icon;
  const fileCfg = FILE_TYPE_CONFIG[doc.fileType];
  const FileIcon = fileCfg.icon;
  const hasAcknowledged = doc.acknowledgedBy?.includes(currentUserLedgerId);
  const canDelete = isAdmin || (isTreasurer && doc.category === "payroll_record");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-slate-900/60 transition-all duration-300",
        catCfg.border,
        doc.isRestricted && "ring-1 ring-amber-500/20",
        hasAcknowledged ? "opacity-90" : "opacity-100"
      )}
    >
      {/* Top accent */}
      <div className={cn("h-[2px] w-full", catCfg.color.replace("text-", "bg-"))} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", catCfg.bg)}>
              <CatIcon className={cn("h-5 w-5", catCfg.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-slate-100 truncate">
                  {doc.title}
                </h3>
                {doc.isRestricted && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                    <Lock className="h-2.5 w-2.5" />
                    Restricted
                  </span>
                )}
                {doc.version && doc.version > 1 && (
                  <span className="text-[9px] font-mono text-slate-500">
                    v{doc.version}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {catCfg.label} • {formatTimeAgo(doc.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {doc.requiresAcknowledgment && !hasAcknowledged && onAcknowledge && (
              <button
                onClick={() => onAcknowledge(doc.id)}
                className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/15 border border-amber-500/20 transition-colors"
                title="Acknowledge"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            )}
            {hasAcknowledged && (
              <span className="rounded-lg p-1.5 text-emerald-400" title="Acknowledged">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            )}
            <button
              onClick={() => setIsExpanded((e) => !e)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* File info row */}
        <div className="mt-3 flex items-center gap-3">
          <div className={cn("flex items-center gap-1.5 rounded-md bg-slate-800/50 px-2 py-1 border border-slate-700/40", fileCfg.color)}>
            <FileIcon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold">{fileCfg.label}</span>
          </div>
          {doc.fileSize && (
            <span className="text-[10px] text-slate-500">{doc.fileSize}</span>
          )}
          <span className="text-[10px] text-slate-600 flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {doc.auditHash.slice(0, 10)}...
          </span>
        </div>

        {/* Description */}
        {doc.description && (
          <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
            {doc.description}
          </p>
        )}

        {/* Expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
                {/* Audit hash full */}
                <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-800/50">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Immutable Audit Hash
                  </p>
                  <p className="text-[11px] font-mono text-slate-300 break-all">
                    {doc.auditHash}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Uploaded By
                    </p>
                    <p className="text-xs font-mono text-slate-200">{doc.uploadedBy}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Date
                    </p>
                    <p className="text-xs text-slate-200">{formatDate(doc.uploadedAt)}</p>
                  </div>
                  {doc.version && (
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Version
                      </p>
                      <p className="text-xs text-slate-200">v{doc.version}</p>
                    </div>
                  )}
                  {doc.previousVersionId && (
                    <div className="rounded-lg bg-slate-800/40 p-2.5 border border-slate-800/50">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Previous
                      </p>
                      <p className="text-xs text-slate-400">{doc.previousVersionId.slice(0, 8)}...</p>
                    </div>
                  )}
                </div>

                {/* Acknowledgment status */}
                {doc.requiresAcknowledgment && (
                  <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-800/50">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Acknowledgment Status
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${((doc.acknowledgedBy?.length || 0) / 10) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {doc.acknowledgedBy?.length || 0} acknowledged
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {onView && (
                    <button
                      onClick={() => onView(doc)}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-300 border border-slate-700/50 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={() => onDownload(doc)}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

//  Upload Zone ─

function UploadZone({
  onUpload,
  isAdmin,
}: {
  onUpload?: (file: File, category: DocumentCategory, title: string) => Promise<void>;
  isAdmin?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("deed");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  if (!isAdmin || !onUpload) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim() || isUploading) return;
    setIsUploading(true);
    try {
      await onUpload(selectedFile, category, title.trim());
      setSelectedFile(null);
      setTitle("");
      setCategory("deed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-6 text-center transition-all",
          isDragging
            ? "border-cyan-500/50 bg-cyan-500/5"
            : "border-slate-700/50 bg-slate-900/30 hover:border-slate-600/50"
        )}
      >
        <Upload className={cn(
          "mx-auto h-8 w-8 mb-2 transition-colors",
          isDragging ? "text-cyan-400" : "text-slate-600"
        )} />
        <p className="text-xs text-slate-400">
          Drag and drop a document, or{" "}
          <label className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors">
            browse
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.png,.jpg,.jpeg"
            />
          </label>
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          PDF, DOC, XLS, CSV, TXT, JSON, PNG, JPG up to 50MB
        </p>
      </div>

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-cyan-400" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setTitle("");
              }}
              className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading || !title.trim()}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? "Uploading..." : "Upload to Vault"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

//  Main Document Vault ─

export function DocumentVault({
  hallId,
  hallName,
  documents,
  isAdmin,
  isTreasurer,
  currentUserLedgerId,
  onDownload,
  onView,
  onUpload,
  onDelete,
  onAcknowledge,
  className,
}: DocumentVaultProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | "all">("all");
  const [showUploader, setShowUploader] = useState(false);

  const filteredDocs = useMemo(() => {
    let result = [...documents];
    if (filterCategory !== "all") {
      result = result.filter((d) => d.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.uploadedBy.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }, [documents, filterCategory, searchQuery]);

  const pendingAck = documents.filter(
    (d) => d.requiresAcknowledgment && !d.acknowledgedBy?.includes(currentUserLedgerId)
  ).length;

  return (
    <div className={cn("flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" />
              Document Vault
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {hallName} — Immutable. Hashed. Sovereign-only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingAck > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 border border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">{pendingAck} pending</span>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowUploader((s) => !s)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border",
                  showUploader
                    ? "bg-slate-700 text-slate-200 border-slate-600"
                    : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25"
                )}
              >
                {showUploader ? "Cancel" : "Upload"}
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents by title, description, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <Filter className="h-3 w-3 text-slate-500 shrink-0" />
            <button
              onClick={() => setFilterCategory("all")}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all border",
                filterCategory === "all"
                  ? "bg-slate-700 text-slate-100 border-slate-600"
                  : "bg-transparent text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300"
              )}
            >
              All
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key as DocumentCategory)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all border flex items-center gap-1",
                  filterCategory === key
                    ? "bg-slate-700 text-slate-100 border-slate-600"
                    : "bg-transparent text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300"
                )}
              >
                <cfg.icon className={cn("h-3 w-3", filterCategory === key ? cfg.color : "text-slate-500")} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Uploader */}
      <AnimatePresence>
        {showUploader && isAdmin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-slate-800 bg-slate-900/30 px-5 py-4"
          >
            <UploadZone onUpload={onUpload} isAdmin={isAdmin} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">No documents in vault</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
              {searchQuery || filterCategory !== "all"
                ? "Try adjusting your search or filters."
                : "The 8th Ledger will populate this vault with deeds, insurance, and legal documents."}
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              isAdmin={isAdmin}
              isTreasurer={isTreasurer}
              currentUserLedgerId={currentUserLedgerId}
              onDownload={onDownload}
              onView={onView}
              onDelete={onDelete}
              onAcknowledge={onAcknowledge}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t border-slate-800 bg-slate-900/30 px-5 py-3 flex items-center justify-between text-[10px] text-slate-500">
        <span>{documents.length} total documents</span>
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Immutable Vault — 8th Ledger Secured
        </span>
      </div>
    </div>
  );
}

//  Skeleton ─

export function DocumentVaultSkeleton() {
  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/50 px-5 py-4">
        <div className="h-4 w-40 rounded bg-slate-800 animate-pulse" />
        <div className="h-3 w-64 rounded bg-slate-800 animate-pulse mt-2" />
        <div className="h-9 rounded-xl bg-slate-800 animate-pulse mt-3" />
      </div>
      <div className="flex-1 px-5 py-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-lg bg-slate-800 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-800 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-slate-800 animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse" />
            </div>
            <div className="h-3 w-3/4 rounded bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentVault;