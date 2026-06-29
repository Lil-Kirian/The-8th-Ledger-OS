"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/* ============================================================
   TYPES
   ============================================================ */

interface CreateFormState {
  displayName: string;
  email: string;
  country: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
  agreeTerms: boolean;
  agreePir: boolean;
}

interface AuthInitiateResponse {
  success: boolean;
  ledgerId?: string;
  error?: string;
  message?: string;
}

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

export default function CreatePage() {
  const router = useRouter();
  const { mutate } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [form, setForm] = useState<CreateFormState>({
    displayName: "",
    email: "",
    country: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
    agreeTerms: false,
    agreePir: false,
  });

  const updateForm = useCallback(
    <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-cyan-500/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-cyan-500/30";

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (form.password !== form.confirmPassword) {
      setError("Keys do not match.");
      setIsLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must exceed 8 characters.");
      setIsLoading(false);
      return;
    }

    if (!form.agreeTerms || !form.agreePir) {
      setError("You must accept both agreements to proceed.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "initiate", ...form }),
      });

      let result: AuthInitiateResponse;
      try {
        const raw: any = await res.json();
        if (typeof raw !== "object" || raw === null) {
          throw new Error("Invalid response structure");
        }
        const parsed = raw as Record<string, unknown>;
        result = {
          success: parsed.success === true,
          ledgerId:
            typeof parsed.ledgerId === "string" ? parsed.ledgerId : undefined,
          error: typeof parsed.error === "string" ? parsed.error : undefined,
          message:
            typeof parsed.message === "string" ? parsed.message : undefined,
        };
      } catch {
        result = { success: false, error: "Invalid server response" };
      }

      setIsLoading(false);

      if (!result.success) {
        setError(result.error || result.message || "Initiation failed.");
        return;
      }

      setSuccess(`Identity forged: ${result.ledgerId ?? "Unknown"}`);
      mutate();

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Network error. The protocol cannot be reached.";
      setError(msg);
    }
  }

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/30">
            <Zap className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Identity
          </h1>
          <p className="mt-2 text-sm text-white/40">Join the 8th Ledger</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Display Name
                </label>
                <input
                  required
                  value={form.displayName}
                  onChange={(e) => updateForm("displayName", e.target.value)}
                  className={inputClasses}
                  placeholder="How you appear in the Knot"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className={inputClasses}
                  placeholder="you@domain.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Country
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <select
                    required
                    value={form.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                    className={`${inputClasses} pl-10 appearance-none`}
                  >
                    <option value="" disabled className="bg-surface-800">
                      Select your country
                    </option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-surface-800">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setStep(2)}
                variant="cyan"
                className="w-full"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    className={`${inputClasses} pr-10`}
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateForm("confirmPassword", e.target.value)
                  }
                  className={inputClasses}
                  placeholder="Re-enter passkey"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Invite Code <span className="text-white/20">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.inviteCode}
                  onChange={(e) =>
                    updateForm("inviteCode", e.target.value.toUpperCase())
                  }
                  className={inputClasses}
                  placeholder="8L-XXXX-XXXX"
                />
              </div>
              <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => updateForm("agreeTerms", e.target.checked)}
                    className="mt-0.5 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <span className="text-[11px] leading-relaxed text-white/40">
                    I accept the{" "}
                    <a href="/terms" className="text-cyan-400 hover:underline">
                      8th Ledger Protocol Terms
                    </a>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreePir}
                    onChange={(e) => updateForm("agreePir", e.target.checked)}
                    className="mt-0.5 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <span className="text-[11px] leading-relaxed text-white/40">
                    I understand that every pool is protected by the{" "}
                    <span className="font-semibold text-emerald-300">
                      Protocol Infrastructure Reserve
                    </span>{" "}
                    — insurance, legal, maintenance, and closure protection
                    commanded by the 8th Ledger.
                  </span>
                </label>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="amber"
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Forge Identity
                </Button>
              </div>
            </motion.div>
          )}
        </form>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-start gap-2 rounded-lg border border-crimson/20 bg-crimson/10 p-3 text-xs text-crimson"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        <p className="mt-6 text-center text-xs text-white/30">
          Already have an identity?{" "}
          <a
            href="/enter"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Enter here
          </a>
        </p>
      </motion.div>
    </div>
  );
}
