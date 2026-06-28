"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import {
  Shield, Mail, Smartphone, Upload, Trash2, AlertTriangle,
  Download, Ban, CheckCircle2, XCircle, Loader2, Plus, Copy,
  Lock, KeyRound, Fingerprint, Globe, Bell, Eye,
  Clock, FileCheck, FileX, HardDrive, LogOut, User,
  Crown, Zap, ShieldCheck, Pencil, Save, X, CreditCard,
  Landmark, Bitcoin, Wallet
} from "lucide-react";

//  TYPES
interface WithdrawalAddress {
  id: string;
  label: string;
  address: string;
  network: string;
  verified: boolean;
  addedAt: string;
  lastUsed?: string;
}

interface KycDoc {
  id: string;
  type: "id" | "selfie" | "address" | "liveness";
  status: "pending" | "verified" | "rejected" | "uploading";
  uploadedAt: string;
  filename: string;
  fileSize?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface SecuritySession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

//  UTILS
const sectionIds = {
  identity: "identity",
  security: "security",
  documents: "documents",
  addresses: "addresses",
  notifications: "notifications",
  danger: "danger",
} as const;

type SectionKey = keyof typeof sectionIds;

const GlowCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.10] ${className}`}>
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>
      <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
    </div>
    <p className="text-xs text-slate-500 ml-11">{subtitle}</p>
  </div>
);

const InputField = ({
  label, value, onChange, type = "text", placeholder, helper, error, disabled, icon: Icon
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; helper?: string; error?: string; disabled?: boolean; icon?: React.ElementType;
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:ring-2 ${
          Icon ? "pl-10" : ""
        } ${
          error
            ? "border-rose-500/40 focus:border-rose-500/60 focus:ring-rose-500/20"
            : "border-slate-800 focus:border-cyan-500/40 focus:ring-cyan-500/10 hover:border-slate-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
    </div>
    {helper && !error && <p className="text-[11px] text-slate-500">{helper}</p>}
    {error && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {error}</p>}
  </div>
);

const ToggleRow = ({
  icon: Icon, title, description, checked, onChange, disabled
}: {
  icon: React.ElementType; title: string; description: string;
  checked: boolean; onChange: () => void; disabled?: boolean;
}) => (
  <div className={`flex items-center justify-between py-4 ${disabled ? "opacity-50" : ""}`}>
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/50 mt-0.5">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
    </div>
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative h-7 w-12 rounded-full transition-all duration-300 ${
        checked ? "bg-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.2)]" : "bg-slate-800"
      }`}
    >
      <div
        className={`absolute top-1 h-5 w-5 rounded-full transition-all duration-300 shadow-sm ${
          checked ? "left-6 bg-cyan-400" : "left-1 bg-slate-500"
        }`}
      />
    </button>
  </div>
);

const StatusBadge = ({ status, text }: { status: "verified" | "pending" | "rejected" | "uploading"; text?: string }) => {
  const map = {
    verified: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: FileCheck },
    pending: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: Clock },
    rejected: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", icon: FileX },
    uploading: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", icon: Loader2 },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}>
      <Icon className={`h-3 w-3 ${status === "uploading" ? "animate-spin" : ""}`} />
      {text || status}
    </span>
  );
};

const NetworkBadge = ({ network }: { network: string }) => {
  const colors: Record<string, string> = {
    Naira: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "USD Swift": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "ERC-20": "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "BEP-20": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const icons: Record<string, React.ElementType> = {
    Naira: Landmark,
    "USD Swift": CreditCard,
    "ERC-20": Wallet,
    "BEP-20": Bitcoin,
  };
  const Icon = icons[network] || Globe;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colors[network] || "bg-slate-800 text-slate-400 border-slate-700"}`}>
      <Icon className="h-3 w-3" /> {network}
    </span>
  );
};

//  MOCK DATA
const MOCK_KYC_DOCS: KycDoc[] = [
  { id: "k1", type: "id", status: "verified", uploadedAt: "2025-01-15", filename: "national_id_front.pdf", fileSize: "2.4 MB", reviewedBy: "8th Ledger KYC", reviewedAt: "2025-01-16" },
  { id: "k2", type: "selfie", status: "verified", uploadedAt: "2025-01-15", filename: "selfie_verification.jpg", fileSize: "1.1 MB", reviewedBy: "AI Liveness Engine", reviewedAt: "2025-01-15" },
  { id: "k3", type: "address", status: "pending", uploadedAt: "2025-06-20", filename: "utility_bill_june.pdf", fileSize: "3.2 MB" },
  { id: "k4", type: "liveness", status: "verified", uploadedAt: "2025-01-15", filename: "liveness_check.mp4", fileSize: "8.7 MB", reviewedBy: "AI Liveness Engine", reviewedAt: "2025-01-15" },
];

const MOCK_SESSIONS: SecuritySession[] = [
  { id: "s1", device: "MacBook Air — Safari", location: "Lagos, NG", ip: "102.88.**.***", lastActive: "Active now", current: true },
  { id: "s2", device: "iPhone 15 — Chrome", location: "Lagos, NG", ip: "102.88.**.***", lastActive: "2 hours ago", current: false },
  { id: "s3", device: "Windows — Edge", location: "London, UK", ip: "185.22.**.***", lastActive: "3 days ago", current: false },
];

const MOCK_ADDRESSES: WithdrawalAddress[] = [
  { id: "a1", label: "Primary Bank", address: "0123456789 • Wema Bank", network: "Naira", verified: true, addedAt: "2025-01-20", lastUsed: "2025-06-22" },
  { id: "a2", label: "USDC Reserve", address: "0x71C...9A3F", network: "ERC-20", verified: true, addedAt: "2025-03-10", lastUsed: "2025-06-15" },
  { id: "a3", label: "Binance Bridge", address: "0x4B2...7E1D", network: "BEP-20", verified: false, addedAt: "2025-06-23" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>("identity");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nameMatch, setNameMatch] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsAlert, setSmsAlert] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [kycDocs, setKycDocs] = useState<KycDoc[]>(MOCK_KYC_DOCS);
  const [withdrawalAddrs, setWithdrawalAddrs] = useState<WithdrawalAddress[]>(MOCK_ADDRESSES);
  const [sessions, setSessions] = useState<SecuritySession[]>(MOCK_SESSIONS);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setLegalName(user.legalName || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setTwoFactor(user.totpEnabled || false);
    }
  }, [user]);

  useEffect(() => {
    const d = displayName.toLowerCase().replace(/\s+/g, " ").trim();
    const l = legalName.toLowerCase().replace(/\s+/g, " ").trim();
    setNameMatch(d === l && d.length > 0);
  }, [displayName, legalName]);

  const scrollToSection = (key: SectionKey) => {
    setActiveSection(key);
    const el = document.getElementById(sectionIds[key]);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(""); setSuccess("");
    setTimeout(() => {
      setSuccess("Profile updated successfully");
      setSaving(false);
    }, 800);
  };

  const handleToggle2FA = async () => {
    setLoading(true);
    setTimeout(() => {
      setTwoFactor(!twoFactor);
      setSuccess(`Two-factor authentication ${twoFactor ? "disabled" : "enabled"}`);
      setLoading(false);
    }, 600);
  };

  const handleFileUpload = async (files: FileList) => {
    setLoading(true);
    const newDocs: KycDoc[] = Array.from(files).map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      type: file.type.includes("image") ? "selfie" : "address",
      status: "uploading",
      uploadedAt: new Date().toISOString().split("T")[0],
      filename: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    }));
    setKycDocs(prev => [...newDocs, ...prev]);
    setTimeout(() => {
      setKycDocs(prev => prev.map(d => d.status === "uploading" ? { ...d, status: "pending" } : d));
      setSuccess("Documents uploaded and queued for review");
      setLoading(false);
    }, 2000);
  };

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setSuccess("Session revoked successfully");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <p className="text-sm text-slate-400">Authenticate to access sovereign settings</p>
        </div>
      </div>
    );
  }

  const navItems: { key: SectionKey; label: string; icon: React.ElementType }[] = [
    { key: "identity", label: "Identity", icon: User },
    { key: "security", label: "Security", icon: Shield },
    { key: "documents", label: "Documents", icon: FileCheck },
    { key: "addresses", label: "Withdrawal", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[5%] w-[30%] h-[30%] bg-cyan-500/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[5%] w-[30%] h-[30%] bg-amber-500/4 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-10">
        {/*  PROFILE HERO  */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-3xl overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#050508] flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#050508]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {displayName || "Sovereign"}
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Tier {user.tier || 1}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Fingerprint className="h-3 w-3" />{" "}
                    {user.ledgerId || "LED-XXXX-XXXX"}
                  </span>
                  <span>•</span>
                  <span>
                    Joined{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "Jan 2025"}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> KYC Verified
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs text-slate-500">Last updated</div>
                <div className="text-xs text-slate-400 font-mono">Just now</div>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/10"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </motion.div>

        {/*  ALERT BANNER  */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${error ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}
              >
                {error ? (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
                <p
                  className={`text-xs ${error ? "text-rose-400" : "text-emerald-400"}`}
                >
                  {error || success}
                </p>
                <button
                  onClick={() => {
                    setError("");
                    setSuccess("");
                  }}
                  className="ml-auto text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">
          {/*  LEFT NAV  */}
          <div className="lg:w-64 shrink-0">
            <div className="sticky top-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => scrollToSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeSection === item.key
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.key === "danger" && (
                    <AlertTriangle className="h-3 w-3 ml-auto text-rose-400" />
                  )}
                </button>
              ))}

              <div className="mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Security Score
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" />
                  </div>
                  <span className="text-sm font-bold text-white">85%</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Enable 2FA to reach 100%
                </div>
              </div>
            </div>
          </div>

          {/*  RIGHT CONTENT  */}
          <div className="flex-1 space-y-10 min-w-0">
            {/* IDENTITY */}
            <section id={sectionIds.identity}>
              <GlowCard>
                <div className="p-6">
                  <SectionHeader
                    icon={User}
                    title="Sovereign Identity"
                    subtitle="Your public profile and legal identity must reconcile exactly for withdrawals."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Display Name"
                      value={displayName}
                      onChange={setDisplayName}
                      placeholder="How others see you"
                      helper="Public across the 8th Ledger"
                      icon={User}
                    />
                    <InputField
                      label="Legal Name (Government ID)"
                      value={legalName}
                      onChange={setLegalName}
                      placeholder="Exact name on ID"
                      helper="Must match KYC documents exactly"
                      icon={Shield}
                    />
                    <InputField
                      label="Email"
                      value={email}
                      onChange={setEmail}
                      type="email"
                      placeholder="sovereign@8thledger.com"
                      helper="Primary contact for notifications"
                      icon={Mail}
                    />
                    <InputField
                      label="Phone"
                      value={phone}
                      onChange={setPhone}
                      type="tel"
                      placeholder="+1 234 567 8900"
                      helper="Required for SMS alerts and 2FA"
                      icon={Smartphone}
                    />
                  </div>

                  <div className="mt-5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Brief description visible on your sovereign profile..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 resize-none"
                    />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] text-slate-500">
                        {bio.length}/280
                      </span>
                    </div>
                  </div>

                  {/* Name Match Reconciliation */}
                  <div
                    className={`mt-6 p-4 rounded-xl border ${nameMatch ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center ${nameMatch ? "bg-emerald-500/10" : "bg-rose-500/10"}`}
                      >
                        {nameMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Identity Reconciliation
                        </div>
                        <div className="text-xs text-slate-500">
                          Name match verification
                        </div>
                      </div>
                      <div className="ml-auto">
                        <StatusBadge
                          status={nameMatch ? "verified" : "rejected"}
                          text={nameMatch ? "MATCHED" : "MISMATCH"}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                        <div className="text-slate-500 mb-1">Display</div>
                        <div className="font-mono text-white">
                          {displayName || "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                        <div className="text-slate-500 mb-1">Legal</div>
                        <div className="font-mono text-white">
                          {legalName || "—"}
                        </div>
                      </div>
                    </div>
                    {!nameMatch && (
                      <p className="mt-3 text-xs text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Withdrawals will be frozen until display name matches
                        legal name exactly.
                      </p>
                    )}
                  </div>
                </div>
              </GlowCard>
            </section>

            {/* SECURITY */}
            <section id={sectionIds.security}>
              <GlowCard>
                <div className="p-6">
                  <SectionHeader
                    icon={Shield}
                    title="Security Fortress"
                    subtitle="Authentication methods, active sessions, and access controls."
                  />

                  <div className="space-y-1 divide-y divide-slate-800/60">
                    <ToggleRow
                      icon={KeyRound}
                      title="Two-Factor Authentication"
                      description="Require TOTP code from authenticator app on every login"
                      checked={twoFactor}
                      onChange={handleToggle2FA}
                    />
                    <ToggleRow
                      icon={Lock}
                      title="Biometric Login"
                      description="Use Face ID or Touch ID on supported devices"
                      checked={false}
                      onChange={() => {}}
                      disabled
                    />
                    <ToggleRow
                      icon={Eye}
                      title="Hide Balance on Dashboard"
                      description="Mask VIN and dollar amounts in public view"
                      checked={false}
                      onChange={() => {}}
                    />
                  </div>

                  {/* Password Change */}
                  <div className="mt-6 pt-6 border-t border-slate-800/60">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-white">
                        Quantum Key (Password)
                      </div>
                      <button
                        onClick={() =>
                          setShowPasswordChange(!showPasswordChange)
                        }
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                      >
                        <Pencil className="h-3 w-3" /> Change
                      </button>
                    </div>
                    <AnimatePresence>
                      {showPasswordChange && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                            <input
                              type="password"
                              placeholder="Current password"
                              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10"
                            />
                            <input
                              type="password"
                              placeholder="New password"
                              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10"
                            />
                            <input
                              type="password"
                              placeholder="Confirm new password"
                              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowPasswordChange(false)}
                              className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-600/30">
                              Update Key
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Active Sessions */}
                  <div className="mt-6 pt-6 border-t border-slate-800/60">
                    <div className="text-sm font-semibold text-white mb-4">
                      Active Sessions
                    </div>
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                              <HardDrive className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm text-white flex items-center gap-2">
                                {session.device}
                                {session.current && (
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                                    CURRENT
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {session.location} • {session.ip}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              {session.lastActive}
                            </span>
                            {!session.current && (
                              <button
                                onClick={() => handleRevokeSession(session.id)}
                                className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <LogOut className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowCard>
            </section>

            {/* DOCUMENTS */}
            <section id={sectionIds.documents}>
              <GlowCard>
                <div className="p-6">
                  <SectionHeader
                    icon={FileCheck}
                    title="Document Vault"
                    subtitle="KYC verification pipeline. All documents are encrypted at rest and access-logged."
                  />

                  <div className="space-y-3 mb-6">
                    {kycDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                              doc.type === "id"
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : doc.type === "selfie"
                                  ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                                  : doc.type === "liveness"
                                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }`}
                          >
                            {doc.type === "id" && (
                              <Shield className="h-5 w-5" />
                            )}
                            {doc.type === "selfie" && (
                              <User className="h-5 w-5" />
                            )}
                            {doc.type === "liveness" && (
                              <Zap className="h-5 w-5" />
                            )}
                            {doc.type === "address" && (
                              <Globe className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white capitalize flex items-center gap-2">
                              {doc.type} Proof
                              <StatusBadge status={doc.status} />
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              {doc.filename} • {doc.fileSize} • Uploaded{" "}
                              {doc.uploadedAt}
                            </div>
                            {doc.reviewedBy && (
                              <div className="text-[10px] text-slate-600 mt-0.5">
                                Reviewed by {doc.reviewedBy} on {doc.reviewedAt}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      e.dataTransfer.files &&
                        handleFileUpload(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? "border-cyan-400 bg-cyan-500/5"
                        : "border-slate-800 hover:border-slate-600 bg-slate-900/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.mp4"
                      onChange={(e) =>
                        e.target.files && handleFileUpload(e.target.files)
                      }
                    />
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium text-white">
                      Drop files or click to upload
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      ID, selfie, address proof, or liveness video
                    </div>
                    <div className="text-[10px] text-slate-600 mt-2">
                      PDF, JPG, PNG, MP4 up to 20MB
                    </div>
                  </div>
                </div>
              </GlowCard>
            </section>

            {/* WITHDRAWAL ADDRESSES */}
            <section id={sectionIds.addresses}>
              <GlowCard>
                <div className="p-6">
                  <SectionHeader
                    icon={CreditCard}
                    title="Withdrawal Addresses"
                    subtitle="Verified destinations for sovereign withdrawals. New addresses require 24-hour cooldown."
                  />

                  <div className="space-y-3 mb-6">
                    {withdrawalAddrs.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                              {addr.network === "Naira" ? (
                                <Landmark className="h-5 w-5" />
                              ) : (
                                <Wallet className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white flex items-center gap-2">
                                {addr.label}
                                {addr.verified ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                    VERIFIED
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                                    PENDING
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {addr.address}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(addr.address, addr.id)}
                              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                            >
                              {copiedAddr === addr.id ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                            <button className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <NetworkBadge network={addr.network} />
                          <span>Added {addr.addedAt}</span>
                          {addr.lastUsed && (
                            <span>• Last used {addr.lastUsed}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Withdrawal Address
                  </button>

                  <AnimatePresence>
                    {showAddAddress && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-5 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-3">
                          <div className="text-sm font-semibold text-white mb-1">
                            Add New Address
                          </div>
                          <input
                            type="text"
                            placeholder="Label (e.g. Primary Bank)"
                            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10"
                          />
                          <input
                            type="text"
                            placeholder="Account Number / Wallet Address"
                            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10"
                          />
                          <select className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10">
                            <option>Naira</option>
                            <option>USD Swift</option>
                            <option>ERC-20</option>
                            <option>BEP-20</option>
                          </select>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setShowAddAddress(false)}
                              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => setShowAddAddress(false)}
                              className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition-colors"
                            >
                              Verify & Add
                            </button>
                          </div>
                          <p className="text-[10px] text-amber-400/70 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> New addresses
                            require 24-hour verification hold before
                            withdrawals.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlowCard>
            </section>

            {/* NOTIFICATIONS */}
            <section id={sectionIds.notifications}>
              <GlowCard>
                <div className="p-6">
                  <SectionHeader
                    icon={Bell}
                    title="Notification Preferences"
                    subtitle="Control how the 8th Ledger reaches you. Critical security alerts cannot be disabled."
                  />
                  <div className="space-y-1 divide-y divide-slate-800/60">
                    <ToggleRow
                      icon={Mail}
                      title="Email Notifications"
                      description="Dividends, vote reminders, proposal updates, and hall announcements"
                      checked={emailNotif}
                      onChange={() => setEmailNotif(!emailNotif)}
                    />
                    <ToggleRow
                      icon={Smartphone}
                      title="SMS Alerts"
                      description="Withdrawal confirmations, login alerts, and dormancy warnings"
                      checked={smsAlert}
                      onChange={() => setSmsAlert(!smsAlert)}
                    />
                    <ToggleRow
                      icon={Bell}
                      title="Marketing & New Pools"
                      description="Early access to cycles, new vertical launches, and empire updates"
                      checked={marketingEmails}
                      onChange={() => setMarketingEmails(!marketingEmails)}
                    />
                    <ToggleRow
                      icon={Shield}
                      title="Security Alerts"
                      description="Failed logins, password changes, and new device authorizations"
                      checked={true}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                </div>
              </GlowCard>
            </section>

            {/* DANGER ZONE */}
            <section id={sectionIds.danger}>
              <GlowCard className="border-rose-500/20">
                <div className="p-6">
                  <SectionHeader
                    icon={AlertTriangle}
                    title="Danger Zone"
                    subtitle="Irreversible actions. Proceed with extreme caution."
                  />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-rose-500/30 transition-all group">
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-rose-300 transition-colors">
                          Export All Data
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Download GDPR-compliant archive of your entire
                          sovereign record
                        </div>
                      </div>
                      <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Export
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-rose-500/30 transition-all group">
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-rose-300 transition-colors">
                          Freeze Account
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Temporarily disable all activity. Can be reversed by
                          contacting the Council.
                        </div>
                      </div>
                      <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5">
                        <Ban className="h-3.5 w-3.5" /> Freeze
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 transition-all group">
                      <div>
                        <div className="text-sm font-semibold text-rose-400">
                          Initiate Dormancy
                        </div>
                        <div className="text-xs text-rose-400/60 mt-0.5">
                          Begin 12-month inactivity countdown. Your PACs will
                          enter the Vault.
                        </div>
                      </div>
                      <Link
                        href="/dormancy"
                        className="px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> Begin
                      </Link>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}