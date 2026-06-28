"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Copy,
  CheckCircle2,
  X,
  Users,
  Shield,
  BadgeCheck,
  EyeOff,
  Crown,
  Clock,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

//  Types
export type KycTier = "visitor" | "sovereign" | "verified" | "whale";

export interface ActiveInvite {
  id: string;
  code: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  kycTierRequired: KycTier;
  maxUses: number;
  usedCount: number;
  ownershipPercentOffered: number;
  status: "active" | "expired" | "revoked" | "depleted";
  createdBy: string;
}

export interface InviteUsage {
  inviteId: string;
  usedAt: string;
  userLedgerId: string;
  userName?: string;
  kycTier: KycTier;
  ownershipPercent: number;
}

export interface InvitePanelProps {
  hallId: string;
  hallName: string;
  hallStatus: "ghost" | "live" | "closing" | "dissolved";
  currentOwnershipAllocated: number;
  unallocatedPercent: number;
  yourOwnershipPercent: number;
  isPrimaryAdmin: boolean;
  isSpeaker: boolean;
  activeInvites: ActiveInvite[];
  inviteHistory: InviteUsage[];
  isLoading?: boolean;
  onCreateInvite?: (data: { kycTier: KycTier; maxUses: number; ownershipPercent: number; expiresInDays: number }) => void;
  onRevokeInvite?: (inviteId: string) => void;
  onCopyLink?: (url: string) => void;
}

//  Config
const KYC_CONFIG: Record<KycTier, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  visitor:  { label: "Visitor",  color: "text-slate-400",    bg: "bg-slate-500/10",    icon: EyeOff,      desc: "No KYC required. Anyone can join." },
  sovereign:{ label: "Sovereign",color: "text-cyan-400",     bg: "bg-cyan-500/10",     icon: Shield,      desc: "Must have sovereign tier or higher." },
  verified: { label: "Verified", color: "text-emerald-400",  bg: "bg-emerald-500/10",  icon: BadgeCheck,  desc: "Must have verified KYC tier." },
  whale:    { label: "Whale",    color: "text-amber-400",    bg: "bg-amber-500/10",    icon: Crown,       desc: "Whale tier only. High-value investors." },
};

const EXPIRY_OPTIONS = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
];

//  Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function daysRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

//  Component
export function InvitePanel({
  hallId,
  hallName,
  hallStatus,
  currentOwnershipAllocated,
  unallocatedPercent,
  yourOwnershipPercent,
  isPrimaryAdmin,
  isSpeaker,
  activeInvites,
  inviteHistory,
  isLoading = false,
  onCreateInvite,
  onRevokeInvite,
  onCopyLink,
}: InvitePanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [kycTier, setKycTier] = useState<KycTier>("sovereign");
  const [maxUses, setMaxUses] = useState(10);
  const [ownershipOffered, setOwnershipOffered] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedInvite, setExpandedInvite] = useState<string | null>(null);

  const canCreate = isPrimaryAdmin || isSpeaker;
  const isDisabled = hallStatus === "dissolved" || hallStatus === "closing";

  const handleCopy = useCallback(
    (invite: ActiveInvite) => {
      onCopyLink?.(invite.url);
      navigator.clipboard?.writeText(invite.url);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [onCopyLink]
  );

  const handleCreate = () => {
    if (ownershipOffered > unallocatedPercent) return;
    onCreateInvite?.({ kycTier, maxUses, ownershipPercent: ownershipOffered, expiresInDays });
    setShowCreate(false);
  };

  const totalInvitedOwnership = activeInvites
    .filter((i) => i.status === "active")
    .reduce((s, i) => s + i.ownershipPercentOffered * (i.maxUses - i.usedCount), 0);

  if (isLoading) {
    return <InviteSkeleton />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/*  Header  */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Hall Invitations
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeInvites.filter((i) => i.status === "active").length} active
              · {inviteHistory.length} accepted
            </p>
          </div>
          {canCreate && !isDisabled && (
            <Button
              onClick={() => setShowCreate(!showCreate)}
              className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
            >
              {showCreate ? (
                <X className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <Link2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              {showCreate ? "Cancel" : "Create Invite"}
            </Button>
          )}
        </div>

        {/*  Allocation Warning  */}
        <Card className="border-slate-800 bg-slate-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">
                Ownership Allocation
              </span>
              <span className="text-xs font-mono text-slate-300">
                {currentOwnershipAllocated.toFixed(1)}% allocated ·{" "}
                {unallocatedPercent.toFixed(1)}% available
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
              <div className="flex h-full">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${currentOwnershipAllocated}%` }}
                />
                <div
                  className="h-full bg-amber-400/50"
                  style={{ width: `${totalInvitedOwnership}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                Allocated
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                Reserved for invites
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                Unallocated
              </span>
            </div>
            {totalInvitedOwnership > unallocatedPercent && (
              <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-400">
                  Active invites reserve {totalInvitedOwnership.toFixed(1)}% but
                  only {unallocatedPercent.toFixed(1)}% is available. Some
                  invites may fail.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/*  Create Invite Form  */}
        <AnimatePresence>
          {showCreate && canCreate && !isDisabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <Card className="border-cyan-500/20 bg-cyan-950/5">
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold text-cyan-400">
                    New Invitation
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* KYC Tier */}
                  <div>
                    <label className="text-xs text-slate-500 mb-2 block">
                      KYC Tier Required
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          "visitor",
                          "sovereign",
                          "verified",
                          "whale",
                        ] as KycTier[]
                      ).map((tier) => {
                        const cfg = KYC_CONFIG[tier];
                        const TIcon = cfg.icon;
                        return (
                          <button
                            key={tier}
                            onClick={() => setKycTier(tier)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all ${
                              kycTier === tier
                                ? `${cfg.border} ${cfg.bg}`
                                : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <TIcon
                              className={`w-5 h-5 ${kycTier === tier ? cfg.color : "text-slate-500"}`}
                            />
                            <span className={kycTier === tier ? cfg.color : ""}>
                              {cfg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      {KYC_CONFIG[kycTier].desc}
                    </p>
                  </div>

                  {/* Ownership + Uses + Expiry */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">
                        Ownership per Invite (%)
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type="number"
                          min={0.1}
                          max={unallocatedPercent}
                          step={0.1}
                          value={ownershipOffered}
                          onChange={(e) =>
                            setOwnershipOffered(Number(e.target.value))
                          }
                          className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Max: {unallocatedPercent.toFixed(1)}% (unallocated)
                      </div>
                      {ownershipOffered > unallocatedPercent && (
                        <div className="text-[10px] text-red-400 mt-1">
                          Exceeds available ownership
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">
                        Max Uses
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={maxUses}
                          onChange={(e) => setMaxUses(Number(e.target.value))}
                          className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Total reserved:{" "}
                        {(ownershipOffered * maxUses).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">
                        Expires In
                      </label>
                      <div className="flex gap-2">
                        {EXPIRY_OPTIONS.map((opt) => (
                          <button
                            key={opt.days}
                            onClick={() => setExpiresInDays(opt.days)}
                            className={`flex-1 px-2 py-2 rounded-lg border text-xs transition-all ${
                              expiresInDays === opt.days
                                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                                : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 mx-auto mb-1" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-2">
                      Invite Summary
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Tier:</span>{" "}
                        <span className={KYC_CONFIG[kycTier].color}>
                          {KYC_CONFIG[kycTier].label}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Ownership:</span>{" "}
                        <span className="text-cyan-400 font-mono">
                          {ownershipOffered}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Uses:</span>{" "}
                        <span className="text-slate-300">{maxUses}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Total:</span>{" "}
                        <span className="text-amber-400 font-mono">
                          {(ownershipOffered * maxUses).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreate}
                      disabled={
                        ownershipOffered > unallocatedPercent ||
                        ownershipOffered <= 0
                      }
                      className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Generate Invite Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreate(false)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/*  Active Invites  */}
        {activeInvites.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cyan-400" />
              Active Invites
            </h3>
            <div className="space-y-3">
              {activeInvites.map((invite) => {
                const isExpanded = expandedInvite === invite.id;
                const kyc = KYC_CONFIG[invite.kycTierRequired];
                const KIcon = kyc.icon;
                const daysLeft = daysRemaining(invite.expiresAt);
                const usagePct =
                  invite.maxUses > 0
                    ? (invite.usedCount / invite.maxUses) * 100
                    : 0;

                return (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className={`border transition-colors overflow-hidden ${
                        invite.status === "active"
                          ? "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                          : invite.status === "expired"
                            ? "border-slate-800 bg-slate-950/30 opacity-50"
                            : invite.status === "revoked"
                              ? "border-red-500/10 bg-red-950/5"
                              : "border-slate-800 bg-slate-950/30"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Status */}
                          <div
                            className={`w-10 h-10 rounded-lg ${kyc.bg} flex items-center justify-center shrink-0`}
                          >
                            <KIcon className={`w-5 h-5 ${kyc.color}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-mono font-medium text-slate-200">
                                {invite.code}
                              </span>
                              <Badge
                                className={`text-[10px] ${kyc.bg} ${kyc.color} border-0`}
                              >
                                {kyc.label} required
                              </Badge>
                              <Badge
                                className={`text-[10px] border-0 ${
                                  invite.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : invite.status === "expired"
                                      ? "bg-slate-700 text-slate-400"
                                      : invite.status === "revoked"
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {invite.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <span>
                                {invite.usedCount} / {invite.maxUses} used
                              </span>
                              <span className="text-slate-700">·</span>
                              <span
                                className={
                                  daysLeft <= 1
                                    ? "text-red-400"
                                    : daysLeft <= 3
                                      ? "text-amber-400"
                                      : ""
                                }
                              >
                                {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                              </span>
                              <span className="text-slate-700">·</span>
                              <span className="text-cyan-400 font-mono">
                                {invite.ownershipPercentOffered}% each
                              </span>
                            </div>
                          </div>

                          {/* Usage bar */}
                          <div className="hidden sm:block w-24 shrink-0">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-slate-500">Usage</span>
                              <span className="text-slate-300">
                                {usagePct.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usagePct >= 100
                                    ? "bg-emerald-400"
                                    : "bg-cyan-400"
                                }`}
                                style={{ width: `${usagePct}%` }}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(invite)}
                                  className="text-xs text-slate-500 hover:text-slate-200 h-8 w-8 p-0"
                                >
                                  {copiedId === invite.id ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-slate-800">
                                <p className="text-xs text-slate-300">
                                  {copiedId === invite.id
                                    ? "Copied!"
                                    : "Copy link"}
                                </p>
                              </TooltipContent>
                            </Tooltip>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedInvite(isExpanded ? null : invite.id)
                              }
                              className="text-xs text-slate-500 hover:text-slate-200 h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>

                            {invite.status === "active" && onRevokeInvite && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRevokeInvite(invite.id)}
                                    className="text-xs text-slate-500 hover:text-red-400 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 border-slate-800">
                                  <p className="text-xs text-slate-300">
                                    Revoke invite
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        {/* Expanded URL */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-slate-800/50">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={invite.url}
                                    readOnly
                                    className="flex-1 bg-slate-900/50 border-slate-800 text-xs text-slate-400 font-mono"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(invite)}
                                    className="text-xs border-slate-700 text-slate-400 hover:text-slate-200 shrink-0"
                                  >
                                    {copiedId === invite.id ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    {copiedId === invite.id ? "Copied" : "Copy"}
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                                  <div>
                                    <span className="text-slate-500">
                                      Created:
                                    </span>{" "}
                                    <span className="text-slate-300">
                                      {formatDate(invite.createdAt)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">
                                      Expires:
                                    </span>{" "}
                                    <span
                                      className={
                                        daysLeft <= 1
                                          ? "text-red-400"
                                          : "text-slate-300"
                                      }
                                    >
                                      {formatDate(invite.expiresAt)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">By:</span>{" "}
                                    <span className="text-slate-300">
                                      {invite.createdBy}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">
                                      Ownership:
                                    </span>{" "}
                                    <span className="text-cyan-400 font-mono">
                                      {invite.ownershipPercentOffered}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/*  Invite History  */}
        {inviteHistory.length > 0 && (
          <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Accepted Invites
                </h3>
                <Badge className="text-[10px] bg-slate-800 text-slate-400 border-0">
                  {inviteHistory.length} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inviteHistory.map((usage, i) => {
                  const kyc = KYC_CONFIG[usage.kycTier];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/30 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${kyc.bg} flex items-center justify-center shrink-0`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${kyc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {usage.userName || usage.userLedgerId}
                          </span>
                          <Badge
                            className={`text-[9px] ${kyc.bg} ${kyc.color} border-0`}
                          >
                            {kyc.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          Joined {formatDate(usage.usedAt)} · Invite #
                          {usage.inviteId.slice(-4)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-semibold text-cyan-400">
                          {usage.ownershipPercent.toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ownership
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/*  Empty State  */}
        {!isLoading &&
          activeInvites.length === 0 &&
          inviteHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                <Link2 className="w-7 h-7 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">
                No invites yet
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Create an invitation link to bring new sovereigns into this
                hall. Each invite can specify KYC requirements and ownership
                allocation.
              </p>
            </div>
          )}
      </div>
    </TooltipProvider>
  );
}

//  Skeleton
function InviteSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="h-24 bg-slate-800 rounded-xl animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}