// app/(dashboard)/me/page.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
   Shield, Crown, BadgeCheck, Coins,
  Hexagon, Eye, TrendingUp, Copy, Check,
  Edit3, Save, X, Lock, Smartphone, KeyRound, LogOut,
  ChevronRight, Flame, Radio,
  FileText, AlertTriangle, Wallet,
  QrCode, Mail, Phone, MapPin, Fingerprint
} from "lucide-react";

/* ============================================================
   KYC TIER CONFIG
   ============================================================ */
const KYC_CONFIG: Record<string, {
  name: string; color: string; bg: string; border: string;
  icon: React.ElementType; privilege: string;
}> = {
  visitor: {
    name: "Visitor", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20",
    icon: Eye, privilege: "Browse only. No commitment, no earnings.",
  },
  sovereign: {
    name: "Sovereign", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20",
    icon: Shield, privilege: "Commit to pools, earn dividends, vote in halls.",
  },
  verified: {
    name: "Verified", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
    icon: BadgeCheck, privilege: "Full marketplace access, higher withdrawal limits.",
  },
  whale: {
    name: "Whale", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
    icon: Crown, privilege: "Unlimited withdrawals, Council access, priority pools.",
  },
};

/* ============================================================
   SAFE FORMATTERS
   ============================================================ */
function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

/* ============================================================
   PROFILE PAGE
   ============================================================ */
export default function MePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    phone: "",
    legalName: "",
    beneficiaryName: "",
    beneficiaryEmail: "",
  });

  React.useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || "",
        bio: user.bio || "",
        phone: user.phone || "",
        legalName: user.legalName || "",
        beneficiaryName: user.beneficiaryName || "",
        beneficiaryEmail: user.beneficiaryEmail || "",
      });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-10 w-10 text-white/10 mb-3" />
          <p className="text-sm text-white/30">Session required</p>
        </div>
      </div>
    );
  }

  const kyc = KYC_CONFIG[user.kycTier || "visitor"];
  const KycIcon = kyc.icon;
  const tierIndex = ["visitor", "sovereign", "verified", "whale"].indexOf(user.kycTier || "visitor");
  const tierProgress = Math.min(((user.trustScore || 0) / 1000) * 100, 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(user.ledgerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditing(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
            <Fingerprint className="h-3 w-3 text-cyan-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
              Sovereign Identity
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Your Profile
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Manage your identity, security, and sovereignty settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            {editing ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Identity Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a14] p-6">
        <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${kyc.bg} to-transparent opacity-20 blur-3xl`} />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 ring-1 ring-white/[0.08]">
              <span className="text-3xl font-bold text-cyan-300/90">
                {user.displayName?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            {user.isPrimaryAdmin && (
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 border border-[#0a0a14]">
                <Crown className="h-3 w-3 text-[#0a0a14]" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {editing ? (
                  <Input
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="h-8 w-64 border-white/10 bg-white/5 text-sm text-white"
                    placeholder="Display Name"
                  />
                ) : (
                  user.displayName || "Unnamed Sovereign"
                )}
              </h2>
              <span className={`inline-flex items-center gap-1.5 rounded-md ${kyc.bg} ${kyc.border} border px-2 py-0.5 text-[10px] font-bold ${kyc.color}`}>
                <KycIcon className="h-3 w-3" />
                {kyc.name}
              </span>
              {user.isPrimaryAdmin && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  <Crown className="h-3 w-3" />
                  Architect
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-sm text-cyan-300/80">
              <span>{user.ledgerId}</span>
              <button onClick={handleCopy} className="rounded p-1 text-white/20 hover:text-cyan-400 transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {editing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/20"
                rows={3}
                placeholder="Bio (optional)"
              />
            ) : (
              <p className="text-sm text-white/40">{user.bio || "No bio set."}</p>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold">Trust Score</p>
                <p className="mt-1 text-lg font-bold text-white">{user.trustScore || 0}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold">Tier</p>
                <p className="mt-1 text-lg font-bold text-cyan-400">{user.tier || 1}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold">LED Balance</p>
                <p className="mt-1 text-lg font-bold text-amber-400">{fmtCurrency(user.ledgerBalance || 0)}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-[9px] uppercase tracking-wider text-white/25 font-semibold">Credit Pool</p>
                <p className="mt-1 text-lg font-bold text-violet-400">{fmtCurrency(user.creditPool || 0)}</p>
              </div>
            </div>

            {/* Tier Progress */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-white/30 mb-1.5">
                <span>Sovereignty Progress</span>
                <span>{Math.round(tierProgress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tierProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-300 to-amber-400"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-white/20">
                {tierProgress >= 100
                  ? "Maximum sovereignty achieved."
                  : `Earn ${1000 - (user.trustScore || 0)} more trust points to reach Whale tier.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 rounded-xl border border-white/5 bg-[#0a0a14] p-6"
        >
          <h3 className="text-sm font-semibold text-white">Edit Identity</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/30">Legal Name</Label>
              <Input
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                className="border-white/10 bg-white/5 text-xs text-white"
                placeholder="As on government ID"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/30">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border-white/10 bg-white/5 text-xs text-white"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/30">Beneficiary Name</Label>
              <Input
                value={form.beneficiaryName}
                onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                className="border-white/10 bg-white/5 text-xs text-white"
                placeholder="In case of dormancy"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/30">Beneficiary Email</Label>
              <Input
                value={form.beneficiaryEmail}
                onChange={(e) => setForm({ ...form, beneficiaryEmail: e.target.value })}
                className="border-white/10 bg-white/5 text-xs text-white"
                placeholder="beneficiary@email.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              className="border-white/10 bg-white/5 text-xs text-white/60 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs"
            >
              {saving ? "Saving..." : <><Save className="h-3 w-3 mr-1" /> Save Changes</>}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pools Committed", value: user.totalCommitted || 0, icon: Hexagon, color: "text-cyan-400" },
          { label: "Forges Completed", value: user.forgesCompleted || 0, icon: Flame, color: "text-orange-400" },
          { label: "Referrals", value: user.referrals || 0, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Reports Filed", value: user.reportsSubmitted || 0, icon: FileText, color: "text-rose-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 border-white/5 bg-white/[0.02]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">{stat.label}</p>
                  <p className={`mt-1 text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Two Column: Security + KYC */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400/80">Security</span>
          </div>

          <Card className="p-4 border-white/5 bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <KeyRound className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Quantum Key</p>
                  <p className="text-[10px] text-white/30">Last rotated: {fmtDate(user.lastLoginAt)}</p>
                </div>
              </div>
              <Link href="/settings/security">
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-[10px] text-white/60 hover:bg-white/10">
                  Rotate
                </Button>
              </Link>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Smartphone className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">TOTP Authenticator</p>
                  <p className="text-[10px] text-white/30">{user.totpEnabled ? "Enabled" : "Not configured"}</p>
                </div>
              </div>
              <Link href="/settings/security">
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-[10px] text-white/60 hover:bg-white/10">
                  {user.totpEnabled ? "Manage" : "Enable"}
                </Button>
              </Link>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <QrCode className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Recovery Codes</p>
                  <p className="text-[10px] text-white/30">{user.recoveryCodes ? "Generated" : "Not generated"}</p>
                </div>
              </div>
              <Link href="/settings/security">
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-[10px] text-white/60 hover:bg-white/10">
                  View
                </Button>
              </Link>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                  <LogOut className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Active Sessions</p>
                  <p className="text-[10px] text-white/30">Manage devices</p>
                </div>
              </div>
              <Link href="/settings/sessions">
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-[10px] text-white/60 hover:bg-white/10">
                  Review
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* KYC / SIV Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400/80">SIV / KYC</span>
          </div>

          <Card className="p-4 border-white/5 bg-white/[0.02] space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kyc.bg} ${kyc.border} border`}>
                <KycIcon className={`h-5 w-5 ${kyc.color}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{kyc.name} Tier</p>
                <p className="text-[10px] text-white/30">{kyc.privilege}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "Email Verified", status: true, icon: Mail },
                { label: "Identity Document", status: user.kycTier !== "visitor", icon: FileText },
                { label: "Liveness Check", status: user.livenessVerified, icon: Eye },
                { label: "Address Proof", status: !!user.addressProofUrl, icon: MapPin },
                { label: "Phone Linked", status: !!user.phone, icon: Phone },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${item.status ? "text-emerald-400" : "text-white/15"}`} />
                      <span className={`text-xs ${item.status ? "text-white/60" : "text-white/20"}`}>{item.label}</span>
                    </div>
                    {item.status ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400/40" />
                    )}
                  </div>
                );
              })}
            </div>

            {user.kycTier === "visitor" && (
              <Link href="/kyc">
                <Button className="w-full bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 text-xs">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade to Sovereign
                </Button>
              </Link>
            )}

            {user.kycTier === "sovereign" && (
              <Link href="/kyc">
                <Button className="w-full bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 text-xs">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
                  Verify Identity (KYC)
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "My Halls", href: "/halls", icon: Radio, desc: "Governance" },
          { label: "Dividends", href: "/dividends", icon: Coins, desc: "Earnings" },
          { label: "Wallet", href: "/wallet", icon: Wallet, desc: "Withdraw" },
          { label: "Settings", href: "/settings", icon: Lock, desc: "Security" },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="group p-4 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 text-white/30 group-hover:text-cyan-400 transition-colors" />
                  <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-white/30 transition-colors" />
                </div>
                <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{link.label}</p>
                <p className="text-[10px] text-white/20">{link.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Danger Zone */}
      <Card className="border-rose-500/10 bg-rose-500/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400/80">Danger Zone</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Sever Connection</p>
            <p className="text-[10px] text-white/30">Logout from all devices and end session.</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}