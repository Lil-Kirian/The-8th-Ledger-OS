import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";

/**
 * Merge Tailwind classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ============================================================
   CURRENCY & NUMBER FORMATTING
   ============================================================ */

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatCurrencyExact(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatCompact(n: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/* ============================================================
   8TH LEDGER — SPECIFIC FORMATTERS V3.2
   ============================================================ */

export function formatLED(n: number): string {
  return `${n.toLocaleString("en-US")} LED`;
}

/** PAC token formatter */
export function formatPAC(token: string | null): string {
  if (!token) return "—";
  return token;
}

export function formatTrustScore(score: number): string {
  return `${Math.round(score)}/100`;
}

/** KYC Tier — visitor | sovereign | verified | whale */
export function formatTier(tier: string | null | undefined): string {
  const labels: Record<string, string> = {
    visitor: "Visitor",
    sovereign: "Sovereign",
    verified: "Verified",
    whale: "Whale",
  };
  return labels[tier || ""] || "Visitor";
}

export function getTierColor(tier: string | null | undefined): string {
  const colors: Record<string, string> = {
    visitor: "text-slate-400",
    sovereign: "text-emerald-400",
    verified: "text-violet-400",
    whale: "text-amber-400",
  };
  return colors[tier || ""] || "text-slate-400";
}

export function getTierDailyLimit(tier: string | null | undefined): string {
  const limits: Record<string, string> = {
    visitor: "$0",
    sovereign: "$500",
    verified: "$5,000",
    whale: "Unlimited",
  };
  return limits[tier || ""] || "$0";
}

export function truncateHash(hash: string, chars: number = 8): string {
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

/* ============================================================
   DATE & TIME FORMATTING
   ============================================================ */

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: string | Date): string {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d);
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "Expired";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

/* ============================================================
   ID & HASH GENERATORS
   ============================================================ */

export function generateLedgerId(): string {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LED-${seg()}-${seg()}`;
}

export function generateTxHash(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function generateToken(): string {
  return `ltok_${Math.random().toString(36).substring(2)}_${Date.now()}`;
}

export function generatePacToken(poolId: string, ledgerId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAC-${poolId.substring(0, 4)}-${ledgerId.substring(4, 8)}-${timestamp}-${hash}`;
}

export function generateWorkerNumber(hallId: string, seq: number): string {
  return `W-${hallId.substring(0, 4)}-${seq.toString().padStart(3, "0")}`;
}

export function generateInviteCode(ledgerId: string): string {
  const parts = ledgerId.split("-");
  const prefix = parts[1]?.substring(0, 4) || "XXXX";
  return `LED-${prefix.toUpperCase()}-ALPHA`;
}

/* ============================================================
   SECURE RANDOM — Node.js + Browser safe
   ============================================================ */

function getSecureRandomValues(buf: Uint32Array): Uint32Array {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(buf);
  }
  // Node.js fallback
  const bytes = randomBytes(buf.length * 4);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = bytes.readUInt32LE(i * 4);
  }
  return buf;
}

export function secureRandomInt(max: number): number {
  const buf = new Uint32Array(1);
  getSecureRandomValues(buf);
  return buf[0] % max;
}

export function securePick<T>(array: T[]): T {
  return array[secureRandomInt(array.length)];
}

export function secureShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================
   VALIDATION HELPERS
   ============================================================ */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidLedgerId(id: string): boolean {
  return /^LED-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(id.toUpperCase());
}

export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Minimum 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("One special character");
  return { valid: errors.length === 0, errors };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/* ============================================================
   MATH HELPERS
   ============================================================ */

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function percentage(part: number, whole: number): number {
  return whole === 0 ? 0 : round2((part / whole) * 100);
}

/** Safe fill percent calculation */
export function calculateFillPercent(committed: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((committed / target) * 100));
}

/* ============================================================
   ARRAY HELPERS
   ============================================================ */

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/* ============================================================
   ASYNC HELPERS
   ============================================================ */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ============================================================
   8TH LEDGER — STATUS FORMATTERS
   ============================================================ */

export function formatDormancyStatus(status: string): { label: string; color: string; icon: string } {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    active: { label: "Active", color: "text-green-400", icon: "●" },
    warning: { label: "Warning", color: "text-yellow-400", icon: "▲" },
    vaulted: { label: "Vaulted", color: "text-orange-400", icon: "◆" },
    auction: { label: "Auction", color: "text-red-400", icon: "⚡" },
    reclaimed: { label: "Reclaimed", color: "text-red-500", icon: "✕" },
    sold: { label: "Sold", color: "text-slate-400", icon: "✓" },
  };
  return map[status] || { label: status, color: "text-slate-400", icon: "?" };
}

export function formatProposalStatus(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Voting Open", color: "text-blue-400" },
    pending: { label: "Pending", color: "text-slate-400" },
    passed: { label: "Passed", color: "text-green-400" },
    rejected: { label: "Rejected", color: "text-red-400" },
    executing: { label: "Executing", color: "text-amber-400" },
    completed: { label: "Completed", color: "text-emerald-400" },
    cancelled: { label: "Cancelled", color: "text-slate-400" },
  };
  return map[status] || { label: status, color: "text-slate-400" };
}

export function formatEscrowStatus(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    held: { label: "In Escrow", color: "text-amber-400" },
    released: { label: "Released", color: "text-green-400" },
    refunded: { label: "Refunded", color: "text-red-400" },
    cancelled: { label: "Cancelled", color: "text-slate-400" },
  };
  return map[status] || { label: status, color: "text-slate-400" };
}

export function formatPoolStatus(status: string): { label: string; color: string; badge: string } {
  const map: Record<string, { label: string; color: string; badge: string }> = {
    filling: { label: "Filling", color: "text-blue-400", badge: "bg-blue-500/10 border-blue-500/20" },
    filled: { label: "Filled", color: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/20" },
    forged: { label: "Forged", color: "text-violet-400", badge: "bg-violet-500/10 border-violet-500/20" },
    active: { label: "Active", color: "text-green-400", badge: "bg-green-500/10 border-green-500/20" },
    dormant: { label: "Dormant", color: "text-yellow-400", badge: "bg-yellow-500/10 border-yellow-500/20" },
    sold: { label: "Sold", color: "text-amber-400", badge: "bg-amber-500/10 border-amber-500/20" },
    dissolved: { label: "Dissolved", color: "text-red-500", badge: "bg-red-500/10 border-red-500/20" },
  };
  return map[status] || { label: status, color: "text-slate-400", badge: "bg-slate-500/10 border-slate-500/20" };
}

export function formatHallStatus(status: string): { label: string; color: string; badge: string } {
  const map: Record<string, { label: string; color: string; badge: string }> = {
    ghost: { label: "Ghost", color: "text-slate-400", badge: "bg-slate-500/10 border-slate-500/20" },
    live: { label: "Live", color: "text-green-400", badge: "bg-green-500/10 border-green-500/20" },
    mature: { label: "Mature", color: "text-violet-400", badge: "bg-violet-500/10 border-violet-500/20" },
    dormant: { label: "Dormant", color: "text-yellow-400", badge: "bg-yellow-500/10 border-yellow-500/20" },
    dissolved: { label: "Dissolved", color: "text-red-500", badge: "bg-red-500/10 border-red-500/20" },
  };
  return map[status] || { label: status, color: "text-slate-400", badge: "bg-slate-500/10 border-slate-500/20" };
}

export function formatSriTier(score: number): { label: string; icon: string; color: string; feeReduction: string } {
  if (score >= 90) return { label: "Platinum", icon: "👑", color: "text-amber-400", feeReduction: "0.25%" };
  if (score >= 75) return { label: "Gold", icon: "🥇", color: "text-yellow-400", feeReduction: "0.5%" };
  if (score >= 60) return { label: "Silver", icon: "🥈", color: "text-slate-300", feeReduction: "Standard" };
  if (score >= 40) return { label: "Bronze", icon: "🥉", color: "text-orange-400", feeReduction: "Restricted" };
  return { label: "At Risk", icon: "⚠️", color: "text-red-400", feeReduction: "Paused" };
}

export function formatAhgiStatus(score: number): { label: string; color: string; canExpand: boolean } {
  if (score >= 80) return { label: "Thriving", color: "text-green-400", canExpand: true };
  if (score >= 60) return { label: "Healthy", color: "text-emerald-400", canExpand: false };
  if (score >= 40) return { label: "Stagnant", color: "text-yellow-400", canExpand: false };
  if (score >= 20) return { label: "Declining", color: "text-orange-400", canExpand: false };
  return { label: "Critical", color: "text-red-500", canExpand: false };
}

export function formatHallClass(hallClass: string): { label: string; description: string; color: string } {
  const map: Record<string, { label: string; description: string; color: string }> = {
    I: { label: "Class I — Passive", description: "8th Ledger manages everything. Minimal hall input.", color: "text-blue-400" },
    II: { label: "Class II — Managed", description: "Hall hires/approves operators. 8th Ledger executes.", color: "text-violet-400" },
    III: { label: "Class III — Active", description: "Hall runs operations daily. Full staffing.", color: "text-amber-400" },
  };
  return map[hallClass] || { label: "Unknown", description: "", color: "text-slate-400" };
}

export function formatClosureStatus(status: string): { label: string; color: string; icon: string } {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    active: { label: "Active", color: "text-green-400", icon: "●" },
    warning: { label: "Warning", color: "text-yellow-400", icon: "▲" },
    decision: { label: "Decision", color: "text-orange-400", icon: "◆" },
    liquidation: { label: "Liquidation", color: "text-red-400", icon: "⚡" },
    dissolved: { label: "Dissolved", color: "text-red-500", icon: "✕" },
  };
  return map[status] || { label: status, color: "text-slate-400", icon: "?" };
}

export function formatOracleTier(tier: string): { label: string; icon: string; color: string; privileges: string } {
  const map: Record<string, { label: string; icon: string; color: string; privileges: string }> = {
    novice: { label: "Novice", icon: "🔮", color: "text-slate-400", privileges: "Basic forecasting" },
    seer: { label: "Seer", icon: "🥉", color: "text-orange-400", privileges: "Bronze icon, Codex access" },
    oracle: { label: "Oracle", icon: "🥈", color: "text-slate-300", privileges: "Silver icon, early pool access (24h)" },
    prophet: { label: "Prophet", icon: "🥇", color: "text-amber-400", privileges: "Gold icon, name on pool cards, Council invitation" },
  };
  return map[tier] || { label: "Unknown", icon: "?", color: "text-slate-400", privileges: "" };
}

export function formatPirPillar(pillar: string): { label: string; icon: string; color: string; description: string } {
  const map: Record<string, { label: string; icon: string; color: string; description: string }> = {
    shield: { label: "The Shield", icon: "🛡️", color: "text-red-400", description: "Insurance — Lloyd's coverage, casualty, liability" },
    seal: { label: "The Seal", icon: "🔏", color: "text-blue-400", description: "Legal — SPV formation, deeds, operating agreements" },
    forge: { label: "The Forge", icon: "🔨", color: "text-orange-400", description: "Maintenance — repairs, vendor contracts, payroll" },
    spire: { label: "The Spire", icon: "🏗️", color: "text-violet-400", description: "Protocol — infrastructure, API, audits, security" },
    vanguard: { label: "The Vanguard", icon: "🚀", color: "text-cyan-400", description: "R&D — new verticals, geographic expansion" },
    sanctuary: { label: "The Sanctuary", icon: "🏛️", color: "text-emerald-400", description: "Reserve — vacancy, dividend smoothing, closure" },
  };
  return map[pillar] || { label: pillar, icon: "?", color: "text-slate-400", description: "" };
}

export function formatMeridianPhase(phase: string): { label: string; color: string; icon: string; duration: string } {
  const map: Record<string, { label: string; color: string; icon: string; duration: string }> = {
    hush: { label: "The Hush", color: "text-slate-400", icon: "●", duration: "48 hours" },
    unveil: { label: "The Unveil", color: "text-blue-400", icon: "🔒", duration: "24 hours" },
    reveal: { label: "The Reveal", color: "text-violet-400", icon: "✨", duration: "24 hours" },
    forge: { label: "The Forge", color: "text-amber-400", icon: "🔥", duration: "6 hours" },
    complete: { label: "Complete", color: "text-green-400", icon: "✓", duration: "—" },
  };
  return map[phase] || { label: phase, color: "text-slate-400", icon: "?", duration: "—" };
}

/* ============================================================
   URL & SLUG HELPERS
   ============================================================ */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ============================================================
   CONTINENT HELPERS — Meridian Cycle
   ============================================================ */

export function getContinentName(continent: string): string {
  const names: Record<string, string> = {
    africa: "Africa",
    asia: "Asia",
    europe: "Europe",
    americas: "Americas",
    middle_east: "Middle East",
    oceania: "Oceania",
  };
  return names[continent] || continent;
}

export function getContinentEmoji(continent: string): string {
  const emojis: Record<string, string> = {
    africa: "🌍",
    asia: "🌏",
    europe: "🏰",
    americas: "🌎",
    middle_east: "🕌",
    oceania: "🏝️",
  };
  return emojis[continent] || "🌐";
}