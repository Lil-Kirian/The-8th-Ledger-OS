"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Shield,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  Hexagon,
  Crown,
  TrendingUp,
  Landmark,
  Loader2,
  Sparkles,
  BookOpen,
  Feather,
  KeyRound,
  Flame,
  Compass,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type AuthMode = "access" | "initiate";

interface EnterFormData {
  displayName: string;
  email: string;
  country: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
  agreeTerms: boolean;
  agreePir: boolean;
}
interface AccessFormData {
  ledgerId: string;
  password: string;
  rememberDevice: boolean;
}
interface AuthUser {
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  trustScore: number;
  tier: number;
  ledgerBalance: number;
  creditPool: number;
  identityScore: number;
  kycStatus: string;
  kycTier?: string;
  legalName?: string | null;
  role: string;
  isPrimaryAdmin: boolean;
}
interface ApiResponse {
  success: boolean;
  ledgerId?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
}
interface VerticalConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  desc: string;
}

const VERTICALS: VerticalConfig[] = [
  {
    id: "ledgerprop",
    name: "LedgerProp",
    icon: Landmark,
    color: "text-[#b8954a]",
    desc: "Real Estate",
  },
  {
    id: "ledgerauto",
    name: "LedgerAuto",
    icon: Compass,
    color: "text-[#a08060]",
    desc: "Vehicles",
  },
  {
    id: "ledgeredu",
    name: "LedgerEdu",
    icon: Crown,
    color: "text-[#c4a76b]",
    desc: "Education",
  },
  {
    id: "ledgeraccess",
    name: "LedgerAccess",
    icon: Lock,
    color: "text-[#8a7a5a]",
    desc: "Exclusive Access",
  },
  {
    id: "ledgerhealth",
    name: "LedgerHealth",
    icon: Shield,
    color: "text-[#b09070]",
    desc: "Wellness",
  },
  {
    id: "ledgerbiz",
    name: "LedgerBiz",
    icon: TrendingUp,
    color: "text-[#c9a86c]",
    desc: "Business Assets",
  },
  {
    id: "ledgertech",
    name: "LedgerTech",
    icon: Hexagon,
    color: "text-[#9a8a6a]",
    desc: "Technology",
  },
  {
    id: "ledgertravel",
    name: "LedgerTravel",
    icon: Globe,
    color: "text-[#b8a070]",
    desc: "Aviation",
  },
  {
    id: "ledgeragri",
    name: "LedgerAgri",
    icon: Flame,
    color: "text-[#a89060]",
    desc: "Agriculture",
  },
  {
    id: "ledgerenergy",
    name: "LedgerEnergy",
    icon: Sparkles,
    color: "text-[#c4a86a]",
    desc: "Energy",
  },
];

const COUNTRIES: string[] = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

function parseApiResponse(raw: any): ApiResponse {
  if (typeof raw !== "object" || raw === null)
    return { success: false, error: "Invalid response" };
  const obj = raw as Record<string, unknown>;
  const userObj = obj.user as Record<string, unknown> | undefined;
  return {
    success: obj.success === true,
    ledgerId: typeof obj.ledgerId === "string" ? obj.ledgerId : undefined,
    user: userObj
      ? {
          ledgerId: String(userObj.ledgerId || ""),
          displayName: String(userObj.displayName || ""),
          email: String(userObj.email || ""),
          country: String(userObj.country || ""),
          trustScore: Number(userObj.trustScore || 0),
          tier: Number(userObj.tier || 1),
          ledgerBalance: Number(userObj.ledgerBalance || 0),
          creditPool: Number(userObj.creditPool || 0),
          identityScore: Number(userObj.identityScore || 0),
          kycStatus: String(userObj.kycStatus || "unverified"),
          kycTier:
            typeof userObj.kycTier === "string" ? userObj.kycTier : undefined,
          legalName:
            typeof userObj.legalName === "string" ? userObj.legalName : null,
          role: String(userObj.role || "user"),
          isPrimaryAdmin: Boolean(userObj.isPrimaryAdmin),
        }
      : undefined,
    error: typeof obj.error === "string" ? obj.error : undefined,
    message: typeof obj.message === "string" ? obj.message : undefined,
  };
}

async function apiInitiateIdentity(data: EnterFormData): Promise<ApiResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      mode: "initiate",
      displayName: data.displayName,
      email: data.email,
      country: data.country,
      password: data.password,
      confirmPassword: data.confirmPassword,
      agreeTerms: data.agreeTerms,
      agreePir: data.agreePir,
      referralCode: data.inviteCode || undefined,
    }),
  });
  return parseApiResponse(await res.json());
}

async function apiAccessIdentity(data: AccessFormData): Promise<ApiResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      mode: "access",
      ledgerId: data.ledgerId,
      password: data.password,
    }),
  });
  return parseApiResponse(await res.json());
}

const ADMIN_ROLES = ["architech", "scribe", "warden", "admin", "founder"];

function getRoleRedirect(role: string, isPrimaryAdmin: boolean): string {
  if (ADMIN_ROLES.includes(role)) {
    if (isPrimaryAdmin) return "/architect/verify?redirect=/architect";
    return "/admin/verify?redirect=/admin";
  }
  return "/dashboard";
}

function DeskBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[#0f0c09]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015 0.003' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundSize: "400px 200px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(8,6,4,0.9) 100%)",
        }}
      />
    </div>
  );
}

function CandleGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        animate={{ opacity: [0.2, 0.3, 0.25, 0.32, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(180,140,80,0.15) 0%, transparent 65%)",
        }}
      />
      <motion.div
        animate={{ opacity: [0.1, 0.18, 0.14, 0.2, 0.1] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
        className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(160,120,60,0.1) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

function LiveStat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold tracking-tight text-[#d4c4a4] sm:text-3xl">
        {value}
        <span className="text-[#c4a86c]">{suffix}</span>
      </span>
      <span className="text-[10px] uppercase tracking-widest text-[#8a7a5a]">
        {label}
      </span>
    </div>
  );
}

function VerticalBadge({ v }: { v: VerticalConfig }) {
  const Icon = v.icon;
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="group flex cursor-default items-center gap-1.5 rounded-md border border-[#5c4a3a]/30 bg-[#1c1610]/50 px-2.5 py-1.5 transition-colors hover:border-[#7a6a4a]/40"
    >
      <Icon className={`h-3 w-3 ${v.color}`} strokeWidth={1.5} />
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold leading-none text-[#b8a88a]">
          {v.name}
        </span>
        <span className="text-[8px] leading-none text-[#7a6a50]">{v.desc}</span>
      </div>
    </motion.div>
  );
}

export default function EnterPage() {
  const router = useRouter();
  const { mutate } = useAuth();
  const [mode, setMode] = useState<AuthMode>("access");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enterForm, setEnterForm] = useState<EnterFormData>({
    displayName: "",
    email: "",
    country: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
    agreeTerms: false,
    agreePir: false,
  });
  const [accessForm, setAccessForm] = useState<AccessFormData>({
    ledgerId: "",
    password: "",
    rememberDevice: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);

  const handleInitiate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      if (enterForm.password !== enterForm.confirmPassword) {
        setError("Quantum keys do not match.");
        setIsLoading(false);
        return;
      }
      if (enterForm.password.length < 10) {
        setError("Quantum Key must exceed 10 characters.");
        setIsLoading(false);
        return;
      }
      if (!enterForm.agreeTerms || !enterForm.agreePir) {
        setError("You must accept both agreements.");
        setIsLoading(false);
        return;
      }
      try {
        const result = await apiInitiateIdentity(enterForm);
        setIsLoading(false);
        if (!result.success) {
          setError(result.error || "Initiation failed.");
          return;
        }
        const lid = result.ledgerId ?? "Unknown";
        setGeneratedId(result.ledgerId ?? null);
        setSuccess(`Identity forged. Your Ledger ID is ${lid}. Store it.`);
        setTimeout(() => {
          setMode("access");
          setAccessForm((p) => ({ ...p, ledgerId: lid }));
          setSuccess(null);
          setGeneratedId(null);
        }, 4000);
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : "Network error.");
      }
    },
    [enterForm],
  );

  const handleAccess = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      try {
        const result = await apiAccessIdentity(accessForm);
        setIsLoading(false);
        if (!result.success) {
          setError(result.error || "Access denied.");
          return;
        }
        mutate();
        setSuccess("Access granted. Entering...");
        setTimeout(
          () =>
            router.push(
              getRoleRedirect(
                result.user?.role || "user",
                result.user?.isPrimaryAdmin || false,
              ),
            ),
          800,
        );
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : "Network error.");
      }
    },
    [accessForm, router, mutate],
  );

  const inputClasses =
    "w-full rounded-lg border border-[#5c4a3a]/40 bg-[#1c1610]/60 px-4 py-3 text-sm text-[#d4c4a4] placeholder-[#6a5a40]/50 outline-none transition-all focus:border-[#8a7a50]/60 focus:bg-[#241e16]/70 focus:ring-1 focus:ring-[#8a7a50]/20";

  return (
    <div className="relative min-h-screen bg-[#0f0c09] flex items-center justify-center p-4 overflow-hidden">
      <DeskBackground />
      <CandleGlow />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-4 inline-flex items-center gap-2">
              <div className="w-6 h-px bg-[#5c4a3a]/50" />
              <span className="text-[10px] text-[#8a7a5a] uppercase tracking-[0.3em] font-mono">
                8th Ledger Holdings Ltd.
              </span>
              <div className="w-6 h-px bg-[#5c4a3a]/50" />
            </div>

            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-[#e8dcc8] sm:text-4xl lg:text-5xl">
              The
              <br />
              <span className="text-[#c4a86c]">Perpetual Ledger.</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#a09070] sm:text-base">
              Commit capital into real-world asset pools. Become a legal
              co-owner through{" "}
              <span className="text-[#c4a86c] font-medium">
                Perpetual Asset Contracts
              </span>
              . Govern your assets through democratic halls, earn monthly
              dividends, and sell ownership at true dynamic value.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4 sm:gap-6">
              <LiveStat label="Active Pools" value="147" />
              <LiveStat label="Total Committed" value="$12.4" suffix="M" />
              <LiveStat label="Dividends" value="$890" suffix="K" />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-[#6a5a40]">
                10 Sovereign Verticals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VERTICALS.map((v) => (
                  <VerticalBadge key={v.id} v={v} />
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-[10px] text-[#6a5a40] font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" strokeWidth={1.5} />
                256-bit
              </span>
              <span className="text-[#5c4a3a]">◈</span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" strokeWidth={1.5} />
                195 Territories
              </span>
              <span className="text-[#5c4a3a]">◈</span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" strokeWidth={1.5} />
                Protocol v3.2
              </span>
            </div>
          </motion.div>

          {/* RIGHT COLUMN — The Auth Book */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[95%] h-[30px] rounded-[50%]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)",
                filter: "blur(12px)",
              }}
            />

            <div
              className="relative rounded-r-lg rounded-l-sm overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #241e16 0%, #1a1610 50%, #201a12 100%)",
                boxShadow:
                  "-8px 0 25px rgba(0,0,0,0.4), 6px 6px 30px rgba(0,0,0,0.3), inset 1px 0 2px rgba(180,140,80,0.08), inset -2px 0 4px rgba(0,0,0,0.2)",
              }}
            >
              {/* Spine */}
              <div
                className="absolute left-0 top-0 bottom-0 w-4 md:w-5 z-20"
                style={{
                  background:
                    "linear-gradient(90deg, #0f0c09 0%, #1c1610 40%, #181410 100%)",
                  boxShadow:
                    "inset -2px 0 4px rgba(0,0,0,0.4), 2px 0 5px rgba(0,0,0,0.2)",
                }}
              >
                <div className="absolute inset-0 flex flex-col justify-evenly py-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-full h-px"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(140,120,80,0.3), transparent)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Page edges */}
              <div
                className="absolute right-0 top-1 bottom-1 w-1.5 md:w-2"
                style={{
                  background:
                    "linear-gradient(90deg, #3a2e20, #5c4a3a, #6a5a40, #5c4a3a, #3a2e20)",
                  backgroundSize: "100% 6px",
                }}
              />

              {/* Content */}
              <div className="relative p-5 sm:p-7 md:p-8 pl-8 md:pl-10">
                <svg
                  className="absolute top-3 right-3 w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M24 0 L12 0 L12 2 L22 2 L22 12 L24 12 Z"
                    fill="#6a5a40"
                    opacity="0.4"
                  />
                </svg>
                <svg
                  className="absolute bottom-3 right-3 w-6 h-6"
                  style={{ transform: "rotate(180deg)" }}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M24 0 L12 0 L12 2 L22 2 L22 12 L24 12 Z"
                    fill="#6a5a40"
                    opacity="0.4"
                  />
                </svg>

                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-8 h-px bg-[#5c4a3a]/40" />
                  <Hexagon className="w-2 h-2 text-[#7a6a4a]" strokeWidth={1} />
                  <div className="w-8 h-px bg-[#5c4a3a]/40" />
                </div>

                {/* Mode Switcher */}
                <div className="relative mb-6 flex rounded-lg border border-[#5c4a3a]/30 bg-[#1c1610]/40 p-1">
                  <button
                    onClick={() => {
                      setMode("access");
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`relative z-10 flex-1 rounded-md py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                      mode === "access"
                        ? "bg-[#2a2218]/60 text-[#d4c4a4] border border-[#6a5a40]/30"
                        : "text-[#6a5a40] hover:text-[#8a7a5a]"
                    }`}
                  >
                    ACCESS
                  </button>
                  <button
                    onClick={() => {
                      setMode("initiate");
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`relative z-10 flex-1 rounded-md py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                      mode === "initiate"
                        ? "bg-[#2a2218]/60 text-[#d4c4a4] border border-[#6a5a40]/30"
                        : "text-[#6a5a40] hover:text-[#8a7a5a]"
                    }`}
                  >
                    INITIATE
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {mode === "access" && (
                    <motion.form
                      key="access"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleAccess}
                      className="space-y-4"
                    >
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                          Ledger ID
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="LED-XXXX-XXXX"
                          value={accessForm.ledgerId}
                          onChange={(e) =>
                            setAccessForm((p) => ({
                              ...p,
                              ledgerId: e.target.value.toUpperCase(),
                            }))
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                          Quantum Key
                        </label>
                        <div className="relative">
                          <input
                            required
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your passkey"
                            value={accessForm.password}
                            onChange={(e) =>
                              setAccessForm((p) => ({
                                ...p,
                                password: e.target.value,
                              }))
                            }
                            className={`${inputClasses} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a5a40] hover:text-[#9a8a6a]"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                            ) : (
                              <Eye className="h-4 w-4" strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[11px] text-[#7a6a50] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accessForm.rememberDevice}
                            onChange={(e) =>
                              setAccessForm((p) => ({
                                ...p,
                                rememberDevice: e.target.checked,
                              }))
                            }
                            className="rounded border-[#5c4a3a]/30 bg-[#1c1610]/40 text-[#c4a86c] w-3.5 h-3.5"
                          />
                          Remember this device
                        </label>
                        <a
                          href="/recover"
                          className="text-[11px] text-[#a09060] hover:text-[#c4a86c]"
                        >
                          Lost ID?
                        </a>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg border border-[#6a5a40]/40 bg-[#2a2218]/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#d4c4a4] hover:bg-[#3a2e20]/50 hover:border-[#7a6a4a]/50 hover:text-[#e8dcc8] disabled:opacity-30 transition-all duration-500 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                        )}
                        Enter the Ledger
                      </button>
                    </motion.form>
                  )}

                  {mode === "initiate" && (
                    <motion.form
                      key="initiate"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleInitiate}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                            Display Name
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Your alias"
                            value={enterForm.displayName}
                            onChange={(e) =>
                              setEnterForm((p) => ({
                                ...p,
                                displayName: e.target.value,
                              }))
                            }
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                            Email
                          </label>
                          <input
                            required
                            type="email"
                            placeholder="you@domain.com"
                            value={enterForm.email}
                            onChange={(e) =>
                              setEnterForm((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            className={inputClasses}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                          Sovereign Territory
                        </label>
                        <select
                          required
                          value={enterForm.country}
                          onChange={(e) =>
                            setEnterForm((p) => ({
                              ...p,
                              country: e.target.value,
                            }))
                          }
                          className={`${inputClasses} appearance-none`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a7a5a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 12px center",
                          }}
                        >
                          <option value="" disabled>
                            Select your country...
                          </option>
                          {COUNTRIES.map((c) => (
                            <option
                              key={c}
                              value={c}
                              className="bg-[#1c1610] text-[#d4c4a4]"
                            >
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                            Quantum Key
                          </label>
                          <div className="relative">
                            <input
                              required
                              type={showPassword ? "text" : "password"}
                              placeholder="Min 10 characters"
                              value={enterForm.password}
                              onChange={(e) =>
                                setEnterForm((p) => ({
                                  ...p,
                                  password: e.target.value,
                                }))
                              }
                              className={`${inputClasses} pr-10`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((p) => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a5a40] hover:text-[#9a8a6a]"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                              ) : (
                                <Eye className="h-4 w-4" strokeWidth={1.5} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                            Confirm Key
                          </label>
                          <input
                            required
                            type="password"
                            placeholder="Re-enter passkey"
                            value={enterForm.confirmPassword}
                            onChange={(e) =>
                              setEnterForm((p) => ({
                                ...p,
                                confirmPassword: e.target.value,
                              }))
                            }
                            className={inputClasses}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7a5a]">
                          Invite Code{" "}
                          <span className="text-[#6a5a40]">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="LED-XXXX-XXXX"
                          value={enterForm.inviteCode}
                          onChange={(e) =>
                            setEnterForm((p) => ({
                              ...p,
                              inviteCode: e.target.value.toUpperCase(),
                            }))
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div className="space-y-2 rounded-lg border border-[#5c4a3a]/25 bg-[#1c1610]/40 p-2.5">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enterForm.agreeTerms}
                            onChange={(e) =>
                              setEnterForm((p) => ({
                                ...p,
                                agreeTerms: e.target.checked,
                              }))
                            }
                            className="mt-0.5 rounded border-[#5c4a3a]/30 bg-[#1c1610]/40 text-[#c4a86c] w-3.5 h-3.5"
                          />
                          <span className="text-[11px] leading-relaxed text-[#7a6a50]">
                            I accept the{" "}
                            <a
                              href="/terms"
                              className="text-[#a09060] hover:text-[#c4a86c] underline decoration-[#5c4a3a]/40"
                            >
                              8th Ledger Protocol Terms
                            </a>
                            , including the Perpetual Ownership rules.
                          </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enterForm.agreePir}
                            onChange={(e) =>
                              setEnterForm((p) => ({
                                ...p,
                                agreePir: e.target.checked,
                              }))
                            }
                            className="mt-0.5 rounded border-[#5c4a3a]/30 bg-[#1c1610]/40 text-[#c4a86c] w-3.5 h-3.5"
                          />
                          <span className="text-[11px] leading-relaxed text-[#7a6a50]">
                            I understand the{" "}
                            <span className="text-[#a09060]">
                              Protocol Infrastructure Reserve
                            </span>{" "}
                            and the{" "}
                            <span className="text-[#a09060]">
                              Perpetual Asset Contract
                            </span>{" "}
                            ownership model.
                          </span>
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg border border-[#8a7a5a]/30 bg-[#2a2218]/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#d4c4a4] hover:bg-[#3a2e20]/50 hover:border-[#a09060]/40 hover:text-[#e8dcc8] disabled:opacity-30 transition-all duration-500 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Fingerprint className="h-4 w-4" strokeWidth={1.5} />
                        )}
                        Forge Identity
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="mt-3 flex items-start gap-2 rounded-lg border border-[#8a4a4a]/40 bg-[#2a1818]/40 p-2.5 text-[11px] text-[#c08080]"
                    >
                      <AlertCircle
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        strokeWidth={1.5}
                      />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="mt-3 flex items-start gap-2 rounded-lg border border-[#4a8a4a]/40 bg-[#182a18]/40 p-2.5 text-[11px] text-[#80c080]"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        strokeWidth={1.5}
                      />
                      <div className="space-y-1">
                        <p>{success}</p>
                        {generatedId && (
                          <p className="font-mono text-[10px] opacity-80">
                            Redirecting to ACCESS in 4 seconds...
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-center gap-2 mt-5">
                  <div className="w-6 h-px bg-[#5c4a3a]/30" />
                  <Feather
                    className="w-2 h-2 text-[#6a5a40]"
                    strokeWidth={1.5}
                  />
                  <div className="w-6 h-px bg-[#5c4a3a]/30" />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[#5c4a3a]"
            >
              <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              <span>
                <a
                  href="/oracle"
                  className="text-[#8a7a5a] hover:text-[#a09060] underline decoration-[#5c4a3a]/30 underline-offset-2"
                >
                  The Oracle
                </a>{" "}
                — Predict the winning vertical. Earn standing. No stakes.
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
