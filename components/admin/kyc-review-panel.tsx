"use client";

import React, { useState } from "react";
import {
  Shield,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  ScanFace,
  FileText,
  MapPin,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Loader2,
  Star,
  Ban,
  Crown,
  MessageSquare,
  Hash,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KycStatus = "pending" | "approved" | "rejected" | "flagged";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface KycRecord {
  id: string;
  ledgerId: string;
  displayName: string;
  email: string;
  tier: "visitor" | "sovereign" | "verified" | "whale";
  status: KycStatus;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  submittedAt: string;
  idDocUrl: string;
  selfieUrl: string;
  livenessVideoUrl?: string;
  addressProofUrl?: string;
  ocrData: {
    fullName?: string;
    documentNumber?: string;
    expiryDate?: string;
    issuingCountry?: string;
  };
  nameMatch: boolean;
  faceMatchScore?: number;
  livenessPassed?: boolean;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface KycReviewPanelProps {
  records: KycRecord[];
  onApprove?: (id: string, notes: string) => void;
  onReject?: (id: string, reason: string, notes: string) => void;
  onBulkApprove?: (ids: string[]) => void;
  onBulkReject?: (ids: string[], reason: string) => void;
}

const statusConfig: Record<
  KycStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Clock,
  },
  approved: {
    label: "Approved",
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
    icon: XCircle,
  },
  flagged: {
    label: "Flagged",
    color: "text-orange-400",
    bg: "bg-orange-900/20",
    border: "border-orange-700/30",
    icon: AlertTriangle,
  },
};

const riskConfig: Record<
  RiskLevel,
  { color: string; bg: string; label: string }
> = {
  low: { color: "text-emerald-400", bg: "bg-emerald-500", label: "Low" },
  medium: { color: "text-amber-400", bg: "bg-amber-500", label: "Medium" },
  high: { color: "text-orange-400", bg: "bg-orange-500", label: "High" },
  critical: { color: "text-red-400", bg: "bg-red-500", label: "Critical" },
};

export default function KycReviewPanel({
  records,
  onApprove,
  onReject,
  onBulkApprove,
  onBulkReject,
}: KycReviewPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<KycStatus | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [sideBySide, setSideBySide] = useState(true);

  const selectedRecord = records.find((r) => r.id === selectedId);

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ledgerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesRisk = riskFilter === "all" || r.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const toggleSelection = (id: string) => {
    const next = new Set(selectedRecords);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRecords(next);
  };

  const toggleAll = () => {
    if (selectedRecords.size === filtered.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filtered.map((r) => r.id)));
    }
  };

  const handleApprove = () => {
    if (!selectedRecord) return;
    onApprove?.(selectedRecord.id, notes);
    setNotes("");
  };

  const handleReject = () => {
    if (!selectedRecord || !rejectReason.trim()) return;
    onReject?.(selectedRecord.id, rejectReason, notes);
    setRejectReason("");
    setNotes("");
    setShowRejectForm(false);
  };

  return (
    <div className="bg-[#0a0a12] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between bg-[#0d0d1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-900/20 border border-cyan-700/30 flex items-center justify-center">
            <Shield size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">SIV Review Queue</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {records.filter((r) => r.status === "pending").length} pending • {records.filter((r) => r.status === "flagged").length} flagged
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedRecords.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBulkApprove?.([...selectedRecords])}
                className="px-3 py-2 rounded-lg bg-emerald-900/20 border border-emerald-700/30 text-xs font-bold text-emerald-400 hover:bg-emerald-900/30 transition-all"
              >
                <CheckCircle2 size={12} className="inline mr-1" />
                Approve {selectedRecords.size}
              </button>
              <button
                onClick={() => onBulkReject?.([...selectedRecords], "Bulk rejection")}
                className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-700/30 text-xs font-bold text-red-400 hover:bg-red-900/30 transition-all"
              >
                <XCircle size={12} className="inline mr-1" />
                Reject {selectedRecords.size}
              </button>
            </div>
          )}
          <button
            onClick={() => setSideBySide(!sideBySide)}
            className={cn(
              "p-2 rounded-lg border transition-all",
              sideBySide ? "bg-slate-800/60 border-slate-600/40 text-slate-200" : "bg-slate-800/20 border-slate-700/30 text-slate-500"
            )}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Left: Queue List */}
        <div className={cn("border-r border-slate-800/60 overflow-y-auto", sideBySide ? "w-1/2" : "w-full")}>
          {/* Filters */}
          <div className="p-4 space-y-3 border-b border-slate-800/40">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, Ledger ID, email..."
                className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as KycStatus | "all")}
                className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "all")}
                className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Risk</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-800/40">
            <div className="px-4 py-2 flex items-center gap-3 bg-slate-900/20">
              <input
                type="checkbox"
                checked={selectedRecords.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider flex-1">
                {filtered.length} records
              </span>
            </div>

            {filtered.map((record) => {
              const statusCfg = statusConfig[record.status];
              const StatusIcon = statusCfg.icon;
              const riskCfg = riskConfig[record.riskLevel];
              const isSelected = selectedId === record.id;

              return (
                <button
                  key={record.id}
                  onClick={() => setSelectedId(record.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-slate-800/20",
                    isSelected ? "bg-slate-800/30 border-l-2 border-l-cyan-500" : "border-l-2 border-l-transparent"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedRecords.has(record.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelection(record.id);
                    }}
                    className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 shrink-0"
                  />
                  <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {record.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200 truncate">{record.displayName}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold border",
                          statusCfg.bg,
                          statusCfg.border,
                          statusCfg.color
                        )}
                      >
                        <StatusIcon size={8} className="inline mr-0.5" />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-600 font-mono">{record.ledgerId}</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-[10px] text-slate-600">{record.email}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className={cn("w-2 h-2 rounded-full", riskCfg.bg)} />
                      <span className={cn("text-[10px] font-bold", riskCfg.color)}>{record.riskScore}</span>
                    </div>
                    <div className="text-[9px] text-slate-600 mt-0.5">
                      {new Date(record.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {sideBySide && selectedRecord && (
          <div className="w-1/2 overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-lg font-bold text-slate-400">
                  {selectedRecord.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-100">{selectedRecord.displayName}</h4>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                        statusConfig[selectedRecord.status].bg,
                        statusConfig[selectedRecord.status].border,
                        statusConfig[selectedRecord.status].color
                      )}
                    >
                      {statusConfig[selectedRecord.status].label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedRecord.ledgerId}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{selectedRecord.email}</div>
                </div>
              </div>

              {/* Risk Score */}
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">Risk Score</span>
                  <span className={cn("text-lg font-bold font-mono", riskConfig[selectedRecord.riskLevel].color)}>
                    {selectedRecord.riskScore}/100
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", riskConfig[selectedRecord.riskLevel].bg)}
                    style={{ width: `${selectedRecord.riskScore}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                  <span>Low Risk</span>
                  <span>Critical</span>
                </div>
              </div>

              {/* Side-by-Side ID vs Selfie */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">ID vs Selfie</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <FileText size={10} />
                      Government ID
                    </div>
                    <div className="aspect-[3/4] rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden">
                      <img
                        src={selectedRecord.idDocUrl}
                        alt="ID"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <ScanFace size={10} />
                      Selfie
                    </div>
                    <div className="aspect-[3/4] rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden">
                      <img
                        src={selectedRecord.selfieUrl}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Results */}
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "p-3 rounded-xl border flex items-center gap-3",
                  selectedRecord.nameMatch
                    ? "bg-emerald-950/10 border-emerald-800/20"
                    : "bg-red-950/10 border-red-800/20"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    selectedRecord.nameMatch ? "bg-emerald-900/20" : "bg-red-900/20"
                  )}>
                    <Fingerprint size={14} className={selectedRecord.nameMatch ? "text-emerald-400" : "text-red-400"} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Name Match</div>
                    <div className={cn("text-sm font-bold", selectedRecord.nameMatch ? "text-emerald-400" : "text-red-400")}>
                      {selectedRecord.nameMatch ? "Matched" : "Mismatch"}
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-3 rounded-xl border flex items-center gap-3",
                  (selectedRecord.faceMatchScore || 0) >= 85
                    ? "bg-emerald-950/10 border-emerald-800/20"
                    : (selectedRecord.faceMatchScore || 0) >= 70
                    ? "bg-amber-950/10 border-amber-800/20"
                    : "bg-red-950/10 border-red-800/20"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    (selectedRecord.faceMatchScore || 0) >= 85 ? "bg-emerald-900/20" : "bg-amber-900/20"
                  )}>
                    <ScanFace size={14} className={(selectedRecord.faceMatchScore || 0) >= 85 ? "text-emerald-400" : "text-amber-400"} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Face Match</div>
                    <div className={cn(
                      "text-sm font-bold",
                      (selectedRecord.faceMatchScore || 0) >= 85 ? "text-emerald-400" : "text-amber-400"
                    )}>
                      {selectedRecord.faceMatchScore?.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* OCR Data */}
              {selectedRecord.ocrData && (
                <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Hash size={10} />
                    OCR Extracted
                  </div>
                  {selectedRecord.ocrData.fullName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Full Name</span>
                      <span className="text-slate-200 font-medium">{selectedRecord.ocrData.fullName}</span>
                    </div>
                  )}
                  {selectedRecord.ocrData.documentNumber && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Document #</span>
                      <span className="text-slate-200 font-mono">{selectedRecord.ocrData.documentNumber}</span>
                    </div>
                  )}
                  {selectedRecord.ocrData.expiryDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Expiry</span>
                      <span className="text-slate-200 font-mono">{selectedRecord.ocrData.expiryDate}</span>
                    </div>
                  )}
                  {selectedRecord.ocrData.issuingCountry && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Country</span>
                      <span className="text-slate-200">{selectedRecord.ocrData.issuingCountry}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Field */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this review..."
                  rows={3}
                  className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {!showRejectForm ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-700/30 bg-red-900/20 text-sm font-bold text-red-400 hover:bg-red-900/30 transition-all"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 border border-emerald-500 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-950/10 border border-red-800/20 space-y-3 animate-in slide-in-from-top-2">
                    <div className="text-xs font-bold text-red-400">Rejection Reason</div>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none"
                    >
                      <option value="">Select reason...</option>
                      <option value="blurry_document">Blurry / unreadable document</option>
                      <option value="expired_document">Expired document</option>
                      <option value="name_mismatch">Name mismatch with account</option>
                      <option value="face_mismatch">Face does not match ID</option>
                      <option value="liveness_failed">Liveness check failed</option>
                      <option value="suspicious_activity">Suspicious activity detected</option>
                      <option value="underage">Underage applicant</option>
                      <option value="sanctioned_country">Sanctioned jurisdiction</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="px-4 py-2 rounded-lg border border-slate-700/40 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={!rejectReason}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                          rejectReason
                            ? "bg-red-600 text-white hover:bg-red-500"
                            : "bg-slate-800/40 text-slate-600 cursor-not-allowed"
                        )}
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Review History */}
              {selectedRecord.reviewedBy && (
                <div className="pt-3 border-t border-slate-800/40 text-[10px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Reviewed by {selectedRecord.reviewedBy}</span>
                    <span>{selectedRecord.reviewedAt ? new Date(selectedRecord.reviewedAt).toLocaleString() : "—"}</span>
                  </div>
                  {selectedRecord.rejectionReason && (
                    <div className="text-red-400/70">Reason: {selectedRecord.rejectionReason}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sideBySide && !selectedRecord && (
          <div className="w-1/2 flex items-center justify-center">
            <div className="text-center text-slate-600">
              <Shield size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a record to review</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}