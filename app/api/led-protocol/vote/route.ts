import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   LED PROTOCOL — COMMUNITY VOTE API
   /api/led-protocol/vote
   ============================================================ */

// In-memory vote store (replace with Prisma Vote model in production)
interface VoteRecord {
  ledgerId: string;
  vote: "yes" | "no";
  votedAt: string;
  weight: number; // Based on trust score or LED balance
}

const VOTE_STORE: Map<string, VoteRecord> = new Map();
const THRESHOLD_PERCENT = 51;
const MIN_VOTERS = 10000;

function getStats() {
  const votes = Array.from(VOTE_STORE.values());
  const total = votes.length;
  const yes = votes.filter(v => v.vote === "yes").length;
  const no = votes.filter(v => v.vote === "no").length;
  const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;
  const quorumPercent = Math.min(Math.round((total / MIN_VOTERS) * 100), 100);
  const passed = yesPercent >= THRESHOLD_PERCENT && total >= MIN_VOTERS;

  return {
    total,
    yes,
    no,
    yesPercent,
    noPercent: total > 0 ? Math.round((no / total) * 100) : 0,
    quorumPercent,
    threshold: THRESHOLD_PERCENT,
    minVoters: MIN_VOTERS,
    passed,
    status: passed ? "passed" : quorumPercent >= 100 ? "counting" : "gathering",
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    const stats = getStats();
    const userVote = user ? VOTE_STORE.get(user.ledgerId) : null;

    return NextResponse.json({
      success: true,
      stats,
      userVote: userVote ? { vote: userVote.vote, votedAt: userVote.votedAt } : null,
      phase: "03",
      message: "LED Global Launch requires 51% approval with 10,000+ voters.",
    });
  } catch (error) {
    console.error("[LED VOTE GET]", error);
    return NextResponse.json({ success: false, error: "Vote data unavailable" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required to vote" }, { status: 401 });
    }

    const body = await request.json();
    const { vote } = body;

    if (!vote || (vote !== "yes" && vote !== "no")) {
      return NextResponse.json({ success: false, error: "Vote must be 'yes' or 'no'" }, { status: 400 });
    }

    // Check if already voted
    const existing = VOTE_STORE.get(user.ledgerId);
    if (existing) {
      // Allow changing vote
      existing.vote = vote;
      existing.votedAt = new Date().toISOString();
    } else {
      VOTE_STORE.set(user.ledgerId, {
        ledgerId: user.ledgerId,
        vote,
        votedAt: new Date().toISOString(),
        weight: user.trustScore || 1,
      });
    }

    const stats = getStats();

    return NextResponse.json({
      success: true,
      stats,
      yourVote: vote,
      message: `Vote recorded: ${vote.toUpperCase()}. ${stats.total.toLocaleString()} total voters.`,
    });
  } catch (error) {
    console.error("[LED VOTE POST]", error);
    return NextResponse.json({ success: false, error: "Vote failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    VOTE_STORE.delete(user.ledgerId);
    const stats = getStats();

    return NextResponse.json({
      success: true,
      stats,
      message: "Vote withdrawn.",
    });
  } catch (error) {
    console.error("[LED VOTE DELETE]", error);
    return NextResponse.json({ success: false, error: "Withdrawal failed" }, { status: 500 });
  }
}