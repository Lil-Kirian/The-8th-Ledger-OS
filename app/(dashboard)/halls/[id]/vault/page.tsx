"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  Landmark,
  Scroll,
  Receipt,
  ClipboardCheck,
  Download,
  Upload,
  Lock,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  FileCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type VaultDocument = {
  id: string;
  type: string;
  title: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  status: "present" | "missing" | "pending" | "expired";
  expiresAt?: string;
  fileSize?: string;
  description?: string;
};

type VaultData = {
  hallId: string;
  hallName: string;
  hallClass?: string;
  documents: VaultDocument[];
  isOwner: boolean;
  ownershipPercent?: number;
  isAdmin: boolean;
};

const docConfig: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bg: string;
    border: string;
    required: boolean;
    description: string;
  }
> = {
  deed: {
    icon: Landmark,
    label: "Property Deed",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    required: true,
    description: "Legal title and ownership documentation for the asset.",
  },
  insurance_certificate: {
    icon: Shield,
    label: "Insurance Certificate",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    required: true,
    description: "Lloyd's of London coverage, casualty, and liability policy.",
  },
  spv_agreement: {
    icon: Building2,
    label: "SPV Agreement",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    required: true,
    description: "Special Purpose Vehicle operating agreement and beneficial interest documents.",
  },
  constitution: {
    icon: Scroll,
    label: "Hall Constitution",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    required: true,
    description: "Governance rules, voting procedures, and executive powers.",
  },
  tax_records: {
    icon: Receipt,
    label: "Tax Records",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    required: false,
    description: "Annual property tax receipts and filings.",
  },
  audit_report: {
    icon: ClipboardCheck,
    label: "Audit Report",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    required: false,
    description: "Independent audit and compliance verification.",
  },
};

const statusConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bg: string }
> = {
  present: {
    icon: CheckCircle2,
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  missing: {
    icon: AlertCircle,
    label: "Missing",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  pending: {
    icon: Clock,
    label: "Pending Upload",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  expired: {
    icon: X,
    label: "Expired",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
  },
};

export default function VaultPage() {
  const params = useParams();
  const hallId = params.id as string;
  const { user } = useAuth();
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<VaultData>(
    hallId ? `/api/halls/${hallId}/vault` : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const handleUpload = async (type: string, file: File) => {
    if (!file) return;
    setUploadingType(type);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch(`/api/halls/${hallId}/vault`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploadingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">Unlocking the Document Vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <h3 className="text-lg font-semibold text-slate-200">Vault inaccessible</h3>
          <p className="max-w-sm text-sm text-slate-400">
            The 8th Ledger could not retrieve documents for this hall.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { hallName, hallClass, documents, isOwner, ownershipPercent, isAdmin } = data;

  // Merge known types with actual documents
  const allDocs = Object.entries(docConfig).map(([type, cfg]) => {
    const found = documents.find((d) => d.type === type);
    return {
      type,
      ...cfg,
      ...(found ?? {
        id: `missing-${type}`,
        status: "missing" as const,
        title: cfg.label,
        url: "",
        uploadedAt: "",
      }),
    };
  });

  const requiredPresent = allDocs.filter((d) => d.required && d.status === "present").length;
  const requiredTotal = allDocs.filter((d) => d.required).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          <Lock className="h-4 w-4" />
          <span>Document Vault</span>
          {hallClass && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
              Class {hallClass}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-100 md:text-3xl">{hallName}</h1>
        <p className="text-sm text-slate-400">
          Legal documents, deeds, insurance, and governance records.
          {isOwner && ownershipPercent !== undefined && (
            <span className="ml-1 text-cyan-400">Your stake: {ownershipPercent}%</span>
          )}
        </p>
      </div>

      {/* Compliance Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                requiredPresent === requiredTotal
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Vault Compliance: {requiredPresent}/{requiredTotal} Required Documents
              </p>
              <p className="text-xs text-slate-500">
                {requiredPresent === requiredTotal
                  ? "All required documents are present and verified."
                  : "Some required documents are missing. The 8th Ledger will upload them."}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-bold ${
                requiredPresent === requiredTotal ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {Math.round((requiredPresent / requiredTotal) * 100)}%
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-600">Complete</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(requiredPresent / requiredTotal) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              requiredPresent === requiredTotal ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {allDocs.map((doc, index) => {
          const statusCfg = statusConfig[doc.status] ?? statusConfig.missing;
          const StatusIcon = statusCfg.icon;
          const isPresent = doc.status === "present";
          const isExpired = doc.status === "expired";

          return (
            <motion.div
              key={doc.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative rounded-xl border bg-slate-900/60 p-5 backdrop-blur-sm transition-all hover:bg-slate-900/80 ${
                doc.required && !isPresent
                  ? "border-amber-500/30"
                  : isPresent
                  ? "border-slate-700"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${doc.bg} ${doc.border}`}
                >
                  <doc.icon className={`h-6 w-6 ${doc.color}`} />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">{doc.label}</h3>
                    {doc.required && (
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{doc.description}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusCfg.bg} ${statusCfg.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                    {isPresent && doc.uploadedAt && (
                      <span className="text-[10px] text-slate-600">
                        <Clock className="mr-0.5 inline h-3 w-3" />
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {isExpired && doc.expiresAt && (
                      <span className="text-[10px] text-slate-600">
                        Expired {new Date(doc.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                {isPresent && doc.url ? (
                  <>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </a>
                    <a
                      href={doc.url}
                      download
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Document not yet uploaded by the 8th Ledger</span>
                  </div>
                )}

                {isAdmin && (
                  <label className="ml-auto cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.type, file);
                        e.target.value = "";
                      }}
                    />
                    <span
                      className={`flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors ${
                        uploadingType === doc.type ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {uploadingType === doc.type ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {uploadingType === doc.type ? "Uploading..." : "Upload"}
                    </span>
                  </label>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 text-slate-500" />
          <div>
            <p className="text-xs font-medium text-slate-400">Vault Security</p>
            <p className="text-xs text-slate-600">
              All documents are encrypted at rest and transmitted over TLS. Only verified owners
              and the 8th Ledger Council may access this vault. Download logs are recorded
              immutably on the audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}