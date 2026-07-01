"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Plus,
  MapPin,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/hooks/use-auth";

// ── Types

interface Suggestion {
  id: string;
  title: string;
  description: string;
  continent: string;
  vertical: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  upvotes: number;
  downvotes: number;
  score: number;
  createdAt: string;
  author: {
    ledgerId: string;
    displayName: string;
    country: string;
    avatar: string | null;
  };
}

// ── Constants ─

const CONTINENTS = [
  { value: "africa", label: "Africa", emoji: "🌍" },
  { value: "asia", label: "Asia", emoji: "🌏" },
  { value: "europe", label: "Europe", emoji: "🌍" },
  { value: "americas", label: "Americas", emoji: "🌎" },
  { value: "middle_east", label: "Middle East", emoji: "🌍" },
  { value: "oceania", label: "Oceania", emoji: "🌏" },
];

const VERTICALS = [
  { value: "ledgerprop", label: "LedgerProp", color: "text-blue-400" },
  { value: "ledgerauto", label: "LedgerAuto", color: "text-red-400" },
  { value: "ledgertech", label: "LedgerTech", color: "text-purple-400" },
  { value: "ledgeredu", label: "LedgerEdu", color: "text-yellow-400" },
  { value: "ledgerhealth", label: "LedgerHealth", color: "text-green-400" },
  { value: "ledgerbiz", label: "LedgerBiz", color: "text-orange-400" },
  { value: "ledgertravel", label: "LedgerTravel", color: "text-cyan-400" },
  { value: "ledgeragri", label: "LedgerAgri", color: "text-emerald-400" },
  { value: "ledgerenergy", label: "LedgerEnergy", color: "text-amber-400" },
  { value: "ledgeraccess", label: "LedgerAccess", color: "text-indigo-400" },
];

const STATUS_STYLES = {
  pending: { bg: "bg-white/5", text: "text-white/50", icon: Clock },
  under_review: { bg: "bg-amber-500/10", text: "text-amber-400", icon: AlertCircle },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: CheckCircle2 },
  rejected: { bg: "bg-rose-500/10", text: "text-rose-400", icon: X },
};

// ── Fetcher

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const ADMIN_ROLES = ["architech", "scribe", "warden", "admin", "founder"];

// ── Components

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.pending;
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="h-3 w-3" />
      {status.replace("_", " ")}
    </span>
  );
}

function VoteButton({
  suggestionId,
  direction,
  count,
  active,
  onVote,
}: {
  suggestionId: string;
  direction: "up" | "down";
  count: number;
  active: boolean;
  onVote: (id: string, dir: "up" | "down") => void;
}) {
  const isUp = direction === "up";
  return (
    <button
      onClick={() => onVote(suggestionId, direction)}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? isUp
            ? "bg-cyan-500/20 text-cyan-400"
            : "bg-rose-500/20 text-rose-400"
          : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60"
      }`}
    >
      {isUp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      {count}
    </button>
  );
}

function SuggestionCard({
  suggestion,
  userVotes,
  onVote,
}: {
  suggestion: Suggestion;
  userVotes: Record<string, "up" | "down" | null>;
  onVote: (id: string, dir: "up" | "down") => void;
}) {
  const vertical = VERTICALS.find((v) => v.value === suggestion.vertical);
  const continent = CONTINENTS.find((c) => c.value === suggestion.continent);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={suggestion.status} />
            {vertical && (
              <span className={`text-xs font-medium ${vertical.color}`}>{vertical.label}</span>
            )}
            {continent && (
              <span className="flex items-center gap-1 text-xs text-white/30">
                <MapPin className="h-3 w-3" />
                {continent.label}
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
            {suggestion.title}
          </h3>
          <p className="mt-2 text-sm text-white/40 line-clamp-2">{suggestion.description}</p>

          <div className="mt-4 flex items-center gap-3 text-xs text-white/30">
            <span className="font-mono text-white/20">{suggestion.author.ledgerId}</span>
            <span>·</span>
            <span>{suggestion.author.displayName}</span>
            <span>·</span>
            <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <VoteButton
            suggestionId={suggestion.id}
            direction="up"
            count={suggestion.upvotes}
            active={userVotes[suggestion.id] === "up"}
            onVote={onVote}
          />
          <span className={`text-lg font-bold ${
            suggestion.score > 0 ? "text-cyan-400" : suggestion.score < 0 ? "text-rose-400" : "text-white/30"
          }`}>
            {suggestion.score > 0 ? "+" : ""}{suggestion.score}
          </span>
          <VoteButton
            suggestionId={suggestion.id}
            direction="down"
            count={suggestion.downvotes}
            active={userVotes[suggestion.id] === "down"}
            onVote={onVote}
          />
        </div>
      </div>
    </motion.div>
  );
}

function CreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    continent: "",
    vertical: "",
  });

  const canSubmit = user && (user.kycTier === "sovereign" || user.kycTier === "verified" || user.kycTier === "whale" || ADMIN_ROLES.includes(user.role || ""));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("KYC tier 'sovereign' or higher required to suggest.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/agora/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");

      mutate((key: string) => key.startsWith("/api/agora/suggestions"));
      onClose();
      setForm({ title: "", description: "", continent: "", vertical: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f14] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Suggest an Asset</h2>
              <button onClick={onClose} className="text-white/30 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!canSubmit && (
              <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                Upgrade to Sovereign tier to suggest assets.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  placeholder="e.g., Nairobi Solar Farm — 50MW Grid"
                  required
                  minLength={5}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  placeholder="Describe the asset, location, expected returns, and why it should be forged..."
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Continent</label>
                  <select
                    value={form.continent}
                    onChange={(e) => setForm({ ...form, continent: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                    required
                  >
                    <option value="" className="bg-[#0f0f14]">Select continent</option>
                    {CONTINENTS.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#0f0f14]">
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Vertical</label>
                  <select
                    value={form.vertical}
                    onChange={(e) => setForm({ ...form, vertical: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                    required
                  >
                    <option value="" className="bg-[#0f0f14]">Select vertical</option>
                    {VERTICALS.map((v) => (
                      <option key={v.value} value={v.value} className="bg-[#0f0f14]">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Suggestion"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─

export default function StoaPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [sort, setSort] = useState<"trending" | "newest" | "top">("trending");
  const [status, setStatus] = useState<string>("");
  const [continent, setContinent] = useState<string>("");
  const [vertical, setVertical] = useState<string>("");
  const [search, setSearch] = useState("");
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down" | null>>({});

  const queryParams = new URLSearchParams();
  queryParams.set("limit", "50");
  queryParams.set("sort", sort);
  if (status) queryParams.set("status", status);
  if (continent) queryParams.set("continent", continent);
  if (vertical) queryParams.set("vertical", vertical);
  if (search) queryParams.set("q", search);

  const { data, error, isLoading } = useSWR(
    `/api/agora/suggestions?${queryParams.toString()}`,
    fetcher
  );

  async function handleVote(suggestionId: string, direction: "up" | "down") {
    if (!user) return;

    const currentVote = userVotes[suggestionId];
    let newDirection: "up" | "down" | null = direction;

    if (currentVote === direction) {
      newDirection = null; // toggle off
    }

    // Optimistic update
    setUserVotes((prev) => ({ ...prev, [suggestionId]: newDirection }));

    try {
      const res = await fetch(`/api/agora/suggestions/${suggestionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh list
      mutate((key: string) => key.startsWith("/api/agora/suggestions"));
    } catch (err) {
      // Revert on error
      setUserVotes((prev) => ({ ...prev, [suggestionId]: currentVote }));
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/agora"
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/60">
              The Agora
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">The Stoa</h1>
              <p className="mt-1 text-white/40">
                Suggest assets. Vote on ideas. Shape what the 8th Ledger forges
                next.
              </p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-cyan-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Suggest Asset
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suggestions..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-white/20 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="trending" className="bg-[#0f0f14]">
                Trending
              </option>
              <option value="newest" className="bg-[#0f0f14]">
                Newest
              </option>
              <option value="top" className="bg-[#0f0f14]">
                Top Rated
              </option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="" className="bg-[#0f0f14]">
                All Status
              </option>
              <option value="pending" className="bg-[#0f0f14]">
                Pending
              </option>
              <option value="under_review" className="bg-[#0f0f14]">
                Under Review
              </option>
              <option value="approved" className="bg-[#0f0f14]">
                Approved
              </option>
              <option value="rejected" className="bg-[#0f0f14]">
                Rejected
              </option>
            </select>

            <select
              value={continent}
              onChange={(e) => setContinent(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="" className="bg-[#0f0f14]">
                All Continents
              </option>
              {CONTINENTS.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#0f0f14]">
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="" className="bg-[#0f0f14]">
                All Verticals
              </option>
              {VERTICALS.map((v) => (
                <option key={v.value} value={v.value} className="bg-[#0f0f14]">
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <p className="mt-4 text-white/40">Failed to load suggestions</p>
          </div>
        ) : data?.suggestions?.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="mx-auto h-12 w-12 text-white/10" />
            <p className="mt-4 text-white/30">
              No suggestions yet. Be the first to shape the 8th Ledger.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {data?.suggestions?.map((s: Suggestion) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  userVotes={userVotes}
                  onVote={handleVote}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
