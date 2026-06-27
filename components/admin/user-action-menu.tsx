"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldOff,
  Ban,
  Unlock,
  UserX,
  ChevronUp,
  ChevronDown,
  Crown,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type KycTier = "visitor" | "sovereign" | "verified" | "whale";
export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended" | "banned";

interface UserActionTarget {
  id: string;
  ledgerId: string;
  displayName: string;
  email: string;
  role: UserRole;
  isPrimaryAdmin: boolean;
  kycTier: KycTier;
  status: UserStatus;
  isBanned: boolean;
  lastLoginAt?: string | null;
}

interface UserActionMenuProps {
  user: UserActionTarget;
  onBan?: (userId: string, reason?: string) => void;
  onUnban?: (userId: string) => void;
  onSuspend?: (userId: string) => void;
  onActivate?: (userId: string) => void;
  onVerifyKyc?: (userId: string) => void;
  onUnverifyKyc?: (userId: string) => void;
  onPromoteTier?: (userId: string) => void;
  onDemoteTier?: (userId: string) => void;
  onMakeAdmin?: (userId: string) => void;
  onMakeUser?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewAudit?: (userId: string) => void;
  disabled?: boolean;
}

const tierOrder: KycTier[] = ["visitor", "sovereign", "verified", "whale"];

const tierConfig: Record<KycTier, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  visitor: {
    label: "Visitor",
    color: "text-slate-400",
    bg: "bg-slate-800/30",
    border: "border-slate-700/30",
    icon: ShieldOff,
  },
  sovereign: {
    label: "Sovereign",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20",
    border: "border-cyan-700/30",
    icon: Shield,
  },
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/30",
    icon: ShieldCheck,
  },
  whale: {
    label: "Whale",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    icon: Crown,
  },
};

const statusConfig: Record<UserStatus, { label: string; color: string; dot: string }> = {
  active: { label: "Active", color: "text-emerald-400", dot: "bg-emerald-400" },
  suspended: { label: "Suspended", color: "text-amber-400", dot: "bg-amber-400" },
  banned: { label: "Banned", color: "text-red-400", dot: "bg-red-400" },
};

export default function UserActionMenu({
  user,
  onBan,
  onUnban,
  onSuspend,
  onActivate,
  onVerifyKyc,
  onUnverifyKyc,
  onPromoteTier,
  onDemoteTier,
  onMakeAdmin,
  onMakeUser,
  onViewProfile,
  onViewAudit,
  disabled = false,
}: UserActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmAction(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentTierIndex = tierOrder.indexOf(user.kycTier);
  const canPromote = currentTierIndex < tierOrder.length - 1;
  const canDemote = currentTierIndex > 0;

  const handleAction = async (action: string, handler?: (id: string) => void) => {
    if (!handler) return;
    if (confirmAction === action) {
      setLoading(true);
      try {
        await handler(user.id);
      } finally {
        setLoading(false);
        setConfirmAction(null);
        setOpen(false);
      }
    } else {
      setConfirmAction(action);
    }
  };

  const handleActionWithReason = async (action: string, handler?: (id: string, reason?: string) => void) => {
    if (!handler) return;
    if (confirmAction === action) {
      setLoading(true);
      try {
        await handler(user.id);
      } finally {
        setLoading(false);
        setConfirmAction(null);
        setOpen(false);
      }
    } else {
      setConfirmAction(action);
    }
  };

  const TierIcon = tierConfig[user.kycTier].icon;
  const statusCfg = statusConfig[user.status];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
          open
            ? "bg-cyan-900/20 border-cyan-500/40 text-cyan-400"
            : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:text-slate-200 hover:border-slate-600",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a12] border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* User Header */}
          <div className="px-4 py-3 border-b border-slate-800/60 bg-[#0d0d1a]">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", tierConfig[user.kycTier].bg, tierConfig[user.kycTier].border)}>
                <TierIcon size={18} className={tierConfig[user.kycTier].color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-100 truncate">{user.displayName}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{user.ledgerId}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1", tierConfig[user.kycTier].bg, tierConfig[user.kycTier].border, tierConfig[user.kycTier].color)}>
                  <TierIcon size={8} />
                  {tierConfig[user.kycTier].label}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                  <span className={cn("text-[9px] font-medium", statusCfg.color)}>{statusCfg.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Banner */}
          {confirmAction && (
            <div className="px-4 py-2.5 bg-red-950/20 border-y border-red-800/20 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <span className="text-[11px] text-red-300 font-medium">
                Click again to confirm {confirmAction}
              </span>
              <button
                onClick={() => setConfirmAction(null)}
                className="ml-auto text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="p-2 space-y-1">
            {/* View Section */}
            <div className="px-2 pb-1 text-[9px] text-slate-600 uppercase tracking-wider font-bold">View</div>
            <ActionItem
              icon={Eye}
              label="View Profile"
              onClick={() => { onViewProfile?.(user.id); setOpen(false); }}
              loading={loading}
            />
            <ActionItem
              icon={FileText}
              label="Audit Trail"
              onClick={() => { onViewAudit?.(user.id); setOpen(false); }}
              loading={loading}
            />

            {/* Identity Section */}
            <div className="px-2 pt-2 pb-1 text-[9px] text-slate-600 uppercase tracking-wider font-bold border-t border-slate-800/40 mt-1">Identity & KYC</div>
            {user.kycTier !== "verified" && user.kycTier !== "whale" ? (
              <ActionItem
                icon={ShieldCheck}
                label="Verify KYC"
                color="emerald"
                onClick={() => handleAction("verify KYC", onVerifyKyc)}
                confirm={confirmAction === "verify KYC"}
                loading={loading}
              />
            ) : (
              <ActionItem
                icon={ShieldOff}
                label="Unverify KYC"
                color="red"
                onClick={() => handleAction("unverify KYC", onUnverifyKyc)}
                confirm={confirmAction === "unverify KYC"}
                loading={loading}
              />
            )}
            {canPromote && (
              <ActionItem
                icon={ChevronUp}
                label={`Promote to ${tierOrder[currentTierIndex + 1]}`}
                color="cyan"
                onClick={() => handleAction("promote tier", onPromoteTier)}
                confirm={confirmAction === "promote tier"}
                loading={loading}
              />
            )}
            {canDemote && (
              <ActionItem
                icon={ChevronDown}
                label={`Demote to ${tierOrder[currentTierIndex - 1]}`}
                color="amber"
                onClick={() => handleAction("demote tier", onDemoteTier)}
                confirm={confirmAction === "demote tier"}
                loading={loading}
              />
            )}

            {/* Role Section */}
            <div className="px-2 pt-2 pb-1 text-[9px] text-slate-600 uppercase tracking-wider font-bold border-t border-slate-800/40 mt-1">Role</div>
            {user.role === "user" ? (
              <ActionItem
                icon={Crown}
                label="Make Admin"
                color="amber"
                onClick={() => handleAction("make admin", onMakeAdmin)}
                confirm={confirmAction === "make admin"}
                loading={loading}
              />
            ) : (
              <ActionItem
                icon={UserX}
                label="Remove Admin"
                color="red"
                onClick={() => handleAction("remove admin", onMakeUser)}
                confirm={confirmAction === "remove admin"}
                loading={loading}
                disabled={user.isPrimaryAdmin}
                disabledReason="Primary Admin cannot be demoted"
              />
            )}

            {/* Status Section */}
            <div className="px-2 pt-2 pb-1 text-[9px] text-slate-600 uppercase tracking-wider font-bold border-t border-slate-800/40 mt-1">Status</div>
            {user.isBanned || user.status === "banned" ? (
              <ActionItem
                icon={Unlock}
                label="Unban Account"
                color="emerald"
                onClick={() => handleAction("unban", onUnban)}
                confirm={confirmAction === "unban"}
                loading={loading}
              />
            ) : (
              <>
                <ActionItem
                  icon={Ban}
                  label="Ban Account"
                  color="red"
                  onClick={() => handleActionWithReason("ban", onBan)}
                  confirm={confirmAction === "ban"}
                  loading={loading}
                />
                {user.status === "active" ? (
                  <ActionItem
                    icon={AlertTriangle}
                    label="Suspend"
                    color="amber"
                    onClick={() => handleAction("suspend", onSuspend)}
                    confirm={confirmAction === "suspend"}
                    loading={loading}
                  />
                ) : (
                  <ActionItem
                    icon={CheckCircle2}
                    label="Activate"
                    color="emerald"
                    onClick={() => handleAction("activate", onActivate)}
                    confirm={confirmAction === "activate"}
                    loading={loading}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-800/60 bg-[#0d0d1a]">
            <div className="text-[9px] text-slate-600 text-center">
              {user.isPrimaryAdmin ? (
                <span className="text-amber-500/70 flex items-center justify-center gap-1">
                  <Crown size={10} /> Primary Admin — 6-Factor Auth Required
                </span>
              ) : user.role === "admin" ? (
                <span className="text-cyan-500/70">Admin — 3-Factor Auth Required</span>
              ) : (
                <span className="text-slate-600">Standard User</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Action Item Subcomponent                                              */
/* ------------------------------------------------------------------ */

interface ActionItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: "slate" | "emerald" | "red" | "amber" | "cyan";
  confirm?: boolean;
  loading?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  color = "slate",
  confirm = false,
  loading = false,
  disabled = false,
  disabledReason,
}: ActionItemProps) {
  const colorMap = {
    slate:   { text: "text-slate-300",   hover: "hover:bg-slate-800/40",   icon: "text-slate-400",   confirm: "bg-red-900/20 text-red-300 border-red-700/30" },
    emerald: { text: "text-emerald-300", hover: "hover:bg-emerald-900/20", icon: "text-emerald-400", confirm: "bg-emerald-900/30 text-emerald-300 border-emerald-600/30" },
    red:     { text: "text-red-300",     hover: "hover:bg-red-900/20",     icon: "text-red-400",     confirm: "bg-red-900/30 text-red-300 border-red-600/30" },
    amber:   { text: "text-amber-300",   hover: "hover:bg-amber-900/20",   icon: "text-amber-400",   confirm: "bg-amber-900/30 text-amber-300 border-amber-600/30" },
    cyan:    { text: "text-cyan-300",    hover: "hover:bg-cyan-900/20",    icon: "text-cyan-400",    confirm: "bg-cyan-900/30 text-cyan-300 border-cyan-600/30" },
  };

  const c = colorMap[color];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
      title={disabled ? disabledReason : undefined}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border border-transparent",
        disabled
          ? "opacity-30 cursor-not-allowed"
          : confirm
          ? c.confirm
          : `${c.text} ${c.hover} hover:border-slate-700/30`,
        !disabled && !confirm && "hover:translate-x-0.5"
      )}
    >
      {loading ? (
        <Loader2 size={14} className={cn("animate-spin", c.icon)} />
      ) : (
        <Icon size={14} className={cn("shrink-0", confirm ? "" : c.icon)} />
      )}
      <span className="flex-1 text-left">{label}</span>
      {confirm && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
    </button>
  );
}