"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  MessageCircle,
  CheckCircle2,
  Clock,
  X,
  Send,
  ArrowLeft,
  Shield,
  Crown,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/hooks/use-auth";

// ── Types ───────────────────────────────────────────────────

interface QA {
  id: string;
  question: string;
  answer: string | null;
  status: "pending" | "answered" | "rejected";
  createdAt: string;
  answeredAt: string | null;
  author: {
    ledgerId: string;
    displayName: string;
    country: string;
    avatar: string | null;
  };
  answerer: {
    ledgerId: string;
    displayName: string;
    role: string;
    kycTier: string;
    avatar: string | null;
  } | null;
}

// ── Fetcher ─────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Components ──────────────────────────────────────────────

function HeraldBadge({ role, kycTier }: { role: string; kycTier: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 uppercase tracking-wider">
        <Crown className="h-3 w-3" />
        The Architect
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 uppercase tracking-wider">
      <Shield className="h-3 w-3" />
      Herald
    </span>
  );
}

function QACard({ qa, isHerald }: { qa: QA; isHerald: boolean }) {
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAnswer(action: "answer" | "reject") {
    if (!isHerald) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/agora/qa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: qa.id,
          answer: answerText,
          action,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate((key: string) => key.startsWith("/api/agora/qa"));
      setAnswerText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
    >
      {/* Question */}
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
          <MessageCircle className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white/80">{qa.question}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
            <span className="font-mono">{qa.author.ledgerId}</span>
            <span>·</span>
            <span>{qa.author.displayName}</span>
            <span>·</span>
            <span>{new Date(qa.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
          qa.status === "answered"
            ? "bg-emerald-500/10 text-emerald-400"
            : qa.status === "rejected"
            ? "bg-rose-500/10 text-rose-400"
            : "bg-amber-500/10 text-amber-400"
        }`}>
          {qa.status}
        </span>
      </div>

      {/* Answer */}
      {qa.status === "answered" && qa.answer && (
        <div className="mt-4 ml-12 flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
            <BookOpen className="h-4 w-4 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/70">{qa.answer}</p>
            {qa.answerer && (
              <div className="mt-2 flex items-center gap-2">
                <HeraldBadge role={qa.answerer.role} kycTier={qa.answerer.kycTier} />
                <span className="text-xs text-white/20">{qa.answerer.displayName}</span>
                {qa.answeredAt && (
                  <span className="text-xs text-white/20">{new Date(qa.answeredAt).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Herald Answer Form */}
      {qa.status === "pending" && isHerald && (
        <div className="mt-4 ml-12">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Write your answer from the Codex..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-cyan-500/50 focus:outline-none"
            rows={3}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => handleAnswer("reject")}
              disabled={submitting}
              className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
            >
              Reject
            </button>
            <button
              onClick={() => handleAnswer("answer")}
              disabled={submitting || !answerText.trim()}
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Answer"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function ArchivesPage() {
  const { user } = useAuth();
  const [sort, setSort] = useState<"newest" | "unanswered_first">("unanswered_first");
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isHerald = user && (
    user.kycTier === "verified" || 
    user.kycTier === "whale" || 
    user.role === "admin"
  );

  const queryParams = new URLSearchParams();
  queryParams.set("limit", "50");
  queryParams.set("sort", sort);
  if (search) queryParams.set("q", search);

  const { data, error, isLoading } = useSWR(
    `/api/agora/qa?${queryParams.toString()}`,
    fetcher
  );

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || question.length < 10) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/agora/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate((key: string) => key.startsWith("/api/agora/qa"));
      setQuestion("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/agora" className="text-white/30 hover:text-white/60">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400/60">The Agora</span>
          </div>
          <h1 className="text-3xl font-bold text-white">The Archives</h1>
          <p className="mt-1 text-white/40">
            The Scribe answers from the Codex. Heralds moderate. Knowledge is sovereign.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Ask Question */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Ask the Codex
          </h3>
          <form onSubmit={handleAsk} className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you know about the 8th Ledger?"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-cyan-500/50 focus:outline-none"
              minLength={10}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={submitting || question.length < 10}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Asking..." : "Ask"}
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions and answers..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-white/20 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="unanswered_first" className="bg-[#0f0f14]">Unanswered First</option>
            <option value="newest" className="bg-[#0f0f14]">Newest</option>
          </select>
        </div>

        {/* Q&A List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <p className="mt-4 text-white/40">Failed to load archives</p>
          </div>
        ) : data?.questions?.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="mx-auto h-12 w-12 text-white/10" />
            <p className="mt-4 text-white/30">The Archives are empty. Ask the first question.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {data?.questions?.map((qa: QA) => (
                <QACard key={qa.id} qa={qa} isHerald={!!isHerald} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}