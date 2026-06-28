"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Crown,
  Eye,
  Shield,
  PenTool,
  Calendar,
  Clock,
  Vote,
  AlertTriangle,
  Lock,
  Gavel,
  ChevronRight,
  UserX,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";

//  Types

interface CabinetMember {
  ledgerId: string;
  displayName: string;
  avatar?: string;
  role: "speaker" | "treasurer" | "warden" | "scribe";
  electedAt: string;
  expiresAt: string;
  votesReceived: number;
  isImpeached: boolean;
  impeachedAt?: string;
  impeachReason?: string;
}

interface CabinetData {
  hallId: string;
  cabinet: {
    id: string;
    electedAt: string;
    expiresAt: string;
    isImpeached: boolean;
    members: CabinetMember[];
  } | null;
  isElectionActive: boolean;
  electionEndsAt?: string;
  myOwnership: number;
  canProposeImpeach: boolean;
  canVote: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_META = {
  speaker: {
    label: "The Speaker",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    badge: "bg-amber-400/20 text-amber-300",
    description: "Voice of the hall. Proposes strategies. Appeals to 8th Ledger for execution.",
    powers: "Propose votes. Cannot spend.",
  },
  treasurer: {
    label: "The Treasurer",
    icon: Eye,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    badge: "bg-emerald-400/20 text-emerald-300",
    description: "Financial oversight. Reviews revenue flows. Flags anomalies.",
    powers: "Read-only treasury. One multi-sig key. Cannot spend.",
  },
  warden: {
    label: "The Warden",
    icon: Shield,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    badge: "bg-rose-400/20 text-rose-300",
    description: "Asset protection. Monitors insurance, maintenance, security, staffing.",
    powers: "Propose maintenance votes. Cannot spend.",
  },
  scribe: {
    label: "The Scribe",
    icon: PenTool,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    badge: "bg-cyan-400/20 text-cyan-300",
    description: "Communications. Publishes reports. Coordinates messaging.",
    powers: "Propose marketing votes. Cannot spend.",
  },
};

//  Component ─

export default function ExecutiveCabinetPage() {
  const params = useParams();
  const hallId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [showImpeachModal, setShowImpeachModal] = useState<string | null>(null);
  const [impeachReason, setImpeachReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showElectionInfo, setShowElectionInfo] = useState(false);

  const { data, mutate, isLoading } = useSWR<CabinetData>(
    hallId ? `/api/halls/${hallId}/cabinet` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const cabinet = data?.cabinet;
  // NEW
  const members = Array.isArray(cabinet?.members) ? cabinet.members : [];
  const isExpired = cabinet
    ? new Date(cabinet.expiresAt) < new Date()
    : true;

  const handleImpeach = async (role: string) => {
    if (!impeachReason.trim()) {
      toast.error("Impeachment requires a reason.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/halls/${hallId}/cabinet/impeach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, reason: impeachReason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Impeachment failed.");
      }
      toast.success("Impeachment proposal submitted. 51% vote required.");
      setShowImpeachModal(null);
      setImpeachReason("");
      mutate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallElection = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/halls/${hallId}/cabinet/elect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Election call failed.");
      }
      toast.success("Election called. Voting opens for 48 hours.");
      mutate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Lock className="h-12 w-12 text-slate-500" />
        <h2 className="text-xl font-semibold text-slate-200">Cabinet Sealed</h2>
        <p className="text-sm text-slate-400">Ownership required to view the Executive Cabinet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Executive Cabinet
          </h1>
          <p className="text-sm text-slate-400">
            Hall #{hallId} — Elected governance. 6-month terms. No executive spends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cabinet && !isExpired && (
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              <Calendar className="mr-1 h-3 w-3" />
              Term expires {new Date(cabinet.expiresAt).toLocaleDateString()}
            </Badge>
          )}
          {cabinet && isExpired && (
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
              <Clock className="mr-1 h-3 w-3" />
              Term expired — Election needed
            </Badge>
          )}
        </div>
      </div>

      {/* Critical Rule Banner */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              The Iron Law of the Cabinet
            </p>
            <p className="text-xs text-amber-400/80">
              No executive can spend money. They propose, appeal, oversee. All spending requires
              hall vote (51%). The 8th Ledger executes. Violation = automatic impeachment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cabinet Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(["speaker", "treasurer", "warden", "scribe"] as const).map((roleKey) => {
          const meta = ROLE_META[roleKey];
          const Icon = meta.icon;
          const member = members.find((m) => m.role === roleKey);
          const isVacant = !member || member.isImpeached;

          return (
            <motion.div
              key={roleKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ["speaker", "treasurer", "warden", "scribe"].indexOf(roleKey) * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden border-slate-800 bg-slate-900/50 transition-colors hover:bg-slate-900/80 ${meta.border}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.bg}`}>
                        <Icon className={`h-6 w-6 ${meta.color}`} />
                      </div>
                      <div>
                        <CardTitle className={`text-base ${meta.color}`}>{meta.label}</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                          {meta.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={meta.badge}>
                      {isVacant ? "VACANT" : "ACTIVE"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isVacant ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <Users className="h-8 w-8 text-slate-600" />
                      <p className="text-sm text-slate-500">Position vacant</p>
                      <p className="text-xs text-slate-600">
                        Election required to fill this seat.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-700">
                          <AvatarFallback className={`text-xs font-bold ${meta.color} bg-slate-800`}>
                            {member.displayName?.slice(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {member.displayName}
                          </p>
                          <p className="font-mono text-xs text-slate-500">{member.ledgerId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-slate-950/50 p-2">
                          <p className="text-slate-500">Elected</p>
                          <p className="text-slate-300">
                            {new Date(member.electedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="rounded-md bg-slate-950/50 p-2">
                          <p className="text-slate-500">Votes</p>
                          <p className="text-slate-300">{member.votesReceived.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="rounded-md border border-slate-800 bg-slate-950/30 p-2">
                        <p className="text-xs text-slate-500">
                          <Info className="mr-1 inline h-3 w-3" />
                          Powers: {meta.powers}
                        </p>
                      </div>

                      {data.canProposeImpeach && !member.isImpeached && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowImpeachModal(roleKey)}
                          className="w-full border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Propose Impeachment
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Election Controls */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base text-slate-200">Election Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.isElectionActive ? (
            <div className="flex items-center gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <Vote className="h-5 w-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-cyan-300">Election in Progress</p>
                <p className="text-xs text-cyan-400/70">
                  Voting closes {data.electionEndsAt ? new Date(data.electionEndsAt).toLocaleString() : "soon"}
                </p>
              </div>
              <Link href={`/halls/${hallId}/governance`}>
                <Button size="sm" className="bg-cyan-600 text-white hover:bg-cyan-500">
                  Vote Now <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-300">
                  {isExpired
                    ? "The cabinet term has expired. An election is required."
                    : "The cabinet is active. Elections can be called by 20% vote or automatically at term expiry."}
                </p>
                <p className="text-xs text-slate-500">
                  6-month term. 48-hour voting window. Capital-weighted.
                </p>
              </div>
              {data.canVote && (
                <Button
                  onClick={handleCallElection}
                  disabled={isSubmitting}
                  className="bg-cyan-600 text-white hover:bg-cyan-500"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSubmitting ? "animate-spin" : ""}`} />
                  {isSubmitting ? "Calling..." : "Call Election"}
                </Button>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowElectionInfo(!showElectionInfo)}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            {showElectionInfo ? "Hide" : "Show"} Election Rules
          </Button>

          <AnimatePresence>
            {showElectionInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400 space-y-2">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Any owner may call an election if the cabinet term has expired or 20% of owners petition.
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Voting lasts 48 hours. Capital-weighted (ownership % = vote weight).
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    Top vote-getter per role wins. Tie = random selection by protocol.
                  </p>
                  <p className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-rose-400" />
                    Executives serve 6 months. No consecutive terms allowed (1-cycle cooldown).
                  </p>
                  <p className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-rose-400" />
                    Impeachment requires 51% vote. Impeached executive barred for 12 months.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Impeachment Modal */}
      <AnimatePresence>
        {showImpeachModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowImpeachModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                  <Gavel className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">
                    Propose Impeachment
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ROLE_META[showImpeachModal as keyof typeof ROLE_META].label}
                  </p>
                </div>
              </div>

              <p className="mb-3 text-sm text-slate-400">
                Impeachment requires a 51% hall vote. Provide a clear reason. This will create a
                proposal in the Sovereign Stream.
              </p>

              <textarea
                value={impeachReason}
                onChange={(e) => setImpeachReason(e.target.value)}
                placeholder="State the grounds for impeachment..."
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-rose-500 focus:outline-none"
              />

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImpeachModal(null)}
                  className="text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleImpeach(showImpeachModal)}
                  disabled={isSubmitting || !impeachReason.trim()}
                  className="bg-rose-600 text-white hover:bg-rose-500"
                >
                  <Gavel className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Impeachment"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}