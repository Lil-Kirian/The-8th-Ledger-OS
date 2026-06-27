import { prisma } from "./prisma";
import { getHallMembership, getHallTotalCapital, hasQuorum, HallAccessError } from "./halls";

/* ============================================================
   TYPES
   ============================================================ */
export interface ProposalInput {
  hallId: number;
  creatorId: number;
  title: string;
  description: string;
  type: "spend" | "policy" | "impeach" | "ban" | "general";
  amount?: number;
  currency?: string;
  threshold?: number;
  endsAt?: Date;
}

export interface VoteInput {
  proposalId: number;
  userId: number;
  vote: "yes" | "no";
}

export interface VoteTally {
  yesCount: number;
  noCount: number;
  yesWeight: number;
  noWeight: number;
  totalWeight: number;
  yesPct: number;
  noPct: number;
  threshold: number;
  hasPassed: boolean;
  hasFailed: boolean;
  quorumMet: boolean;
}

export interface ExecutionQueueItem {
  id: number;
  title: string;
  type: string;
  amount: number | null;
  hallId: number;
  hallName: string;
  passedAt: Date;
  daysInQueue: number;
  priority: number;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const DEFAULT_THRESHOLD = 51;
const DEFAULT_DURATION_DAYS = 7;
const MIN_OWNERSHIP_TO_PROPOSE = 1; // minimum 1% ownership to create proposal

/* ============================================================
   VALIDATORS
   ============================================================ */

/**
 * Check if user can vote on a proposal.
 */
export async function canVote(proposalId: number, userId: number): Promise<{
  eligible: boolean;
  reason?: string;
  weight?: number;
}> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { hallId: true, status: true, endsAt: true },
  });

  if (!proposal) {
    return { eligible: false, reason: "Proposal not found" };
  }

  if (proposal.status !== "active" && proposal.status !== "pending") {
    return { eligible: false, reason: `Proposal is ${proposal.status}` };
  }

  if (proposal.endsAt && new Date() > proposal.endsAt) {
    return { eligible: false, reason: "Voting period has ended" };
  }

  const membership = await getHallMembership(proposal.hallId, userId);
  if (!membership) {
    return { eligible: false, reason: "Not a member of this Hall" };
  }

  if (membership.isBanned) {
    return { eligible: false, reason: "You are banned from this Hall" };
  }

  if (membership.status !== "active") {
    return { eligible: false, reason: "Membership is not active" };
  }

  // Check if already voted
  const existingVote = await prisma.vote.findFirst({
    where: { proposalId, ownership: { userId } },
  });

  if (existingVote) {
    return { eligible: false, reason: "Already voted", weight: membership.ownershipPercent };
  }

  return {
    eligible: true,
    weight: membership.ownershipPercent,
  };
}

/**
 * Check if user can create a proposal.
 */
export async function canCreateProposal(hallId: number, userId: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const membership = await getHallMembership(hallId, userId);
  if (!membership) {
    return { allowed: false, reason: "Not a member of this Hall" };
  }

  if (membership.isBanned) {
    return { allowed: false, reason: "You are banned from this Hall" };
  }

  if (membership.ownershipPercent < MIN_OWNERSHIP_TO_PROPOSE) {
    return {
      allowed: false,
      reason: `Minimum ${MIN_OWNERSHIP_TO_PROPOSE}% ownership required to propose`,
    };
  }

  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    select: { status: true },
  });

  if (hall?.status === "ghost") {
    return { allowed: false, reason: "Hall is still in ghost mode" };
  }

  if (hall?.status === "locked") {
    return { allowed: false, reason: "Hall is locked" };
  }

  return { allowed: true };
}

/* ============================================================
   MUTATIONS
   ============================================================ */

/**
 * Create a new proposal.
 */
export async function createProposal(input: ProposalInput): Promise<{
  success: boolean;
  proposal?: { id: number; title: string };
  error?: string;
}> {
  const canCreate = await canCreateProposal(input.hallId, input.creatorId);
  if (!canCreate.allowed) {
    return { success: false, error: canCreate.reason };
  }

  // Validate quorum exists
  const quorum = await hasQuorum(input.hallId);
  if (!quorum) {
    return { success: false, error: "Hall does not have quorum (no active owners)" };
  }

  const threshold = input.threshold || DEFAULT_THRESHOLD;
  const endsAt = input.endsAt || new Date(Date.now() + DEFAULT_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const proposal = await prisma.proposal.create({
    data: {
      hallId: input.hallId,
      creatorId: input.creatorId,
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      amount: input.amount || null,
      currency: input.currency || "USD",
      threshold,
      status: "active",
      executionStatus: "pending",
      endsAt,
      voteCountYes: 0,
      voteCountNo: 0,
    },
  });

  await prisma.auditEntry.create({
    data: {
      type: "proposal_created",
      description: `Proposal "${proposal.title}" created in Hall ${input.hallId}`,
      amount: input.amount || 0,
      txHash: `PROP-CREATE-${proposal.id}-${Date.now()}`,
    },
  });

  return { success: true, proposal: { id: proposal.id, title: proposal.title } };
}

/**
 * Cast a capital-weighted vote.
 */
export async function castVote(input: VoteInput): Promise<{
  success: boolean;
  tally?: VoteTally;
  passed?: boolean;
  error?: string;
}> {
  const eligibility = await canVote(input.proposalId, input.userId);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }

  const weight = eligibility.weight || 0;

  await prisma.$transaction(async (tx) => {
    // Get ownership record for this user in this proposal's hall
    const proposal = await tx.proposal.findUnique({
      where: { id: input.proposalId },
      select: { hallId: true },
    });

    if (!proposal) throw new Error("Proposal not found");

    const ownership = await tx.ownership.findFirst({
      where: { hallId: proposal.hallId, userId: input.userId },
    });

    if (!ownership) throw new Error("Ownership not found");

    // Create vote
    await tx.vote.create({
      data: {
        proposalId: input.proposalId,
        ownershipId: ownership.id,
        vote: input.vote,
        weight,
      },
    });

    // Update proposal counters
    if (input.vote === "yes") {
      await tx.proposal.update({
        where: { id: input.proposalId },
        data: {
          voteCountYes: { increment: 1 },
        },
      });
    } else {
      await tx.proposal.update({
        where: { id: input.proposalId },
        data: {
          voteCountNo: { increment: 1 },
        },
      });
    }
  });

  // Recalculate tally
  const tally = await getProposalTally(input.proposalId);

  // Auto-pass if threshold reached
  if (tally.hasPassed) {
    await prisma.proposal.update({
      where: { id: input.proposalId },
      data: {
        status: "passed",
        passedAt: new Date(),
      },
    });

    await prisma.auditEntry.create({
      data: {
        type: "proposal_passed",
        description: `Proposal #${input.proposalId} passed with ${tally.yesPct.toFixed(2)}% (threshold: ${tally.threshold}%)`,
        txHash: `PROP-PASS-${input.proposalId}-${Date.now()}`,
      },
    });
  }

  // Auto-fail if impossible to reach threshold
  if (tally.hasFailed) {
    await prisma.proposal.update({
      where: { id: input.proposalId },
      data: { status: "rejected" },
    });
  }

  return {
    success: true,
    tally,
    passed: tally.hasPassed,
  };
}

/**
 * Get live vote tally for a proposal.
 */
export async function getProposalTally(proposalId: number): Promise<VoteTally> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { hallId: true, threshold: true, status: true },
  });

  if (!proposal) {
    throw new HallAccessError("Proposal not found", 404);
  }

  const [votes, totalCapital] = await Promise.all([
    prisma.vote.findMany({
      where: { proposalId },
      select: { vote: true, weight: true },
    }),
    getHallTotalCapital(proposal.hallId),
  ]);

  const yesVotes = votes.filter((v) => v.vote === "yes");
  const noVotes = votes.filter((v) => v.vote === "no");

  const yesWeight = yesVotes.reduce((s, v) => s + Number(v.weight), 0);
  const noWeight = noVotes.reduce((s, v) => s + Number(v.weight), 0);
  const totalWeight = yesWeight + noWeight;

  const yesPct = totalCapital > 0 ? (yesWeight / totalCapital) * 100 : 0;
  const noPct = totalCapital > 0 ? (noWeight / totalCapital) * 100 : 0;

  // Has passed if yes >= threshold of TOTAL capital (not just voted capital)
  const hasPassed = yesPct >= proposal.threshold;

  // Has failed if even if all remaining capital voted yes, still wouldn't reach threshold
  const remainingCapital = totalCapital - totalWeight;
  const maxPossibleYes = yesWeight + remainingCapital;
  const hasFailed = totalCapital > 0 && (maxPossibleYes / totalCapital) * 100 < proposal.threshold;

  return {
    yesCount: yesVotes.length,
    noCount: noVotes.length,
    yesWeight,
    noWeight,
    totalWeight,
    yesPct: Number(yesPct.toFixed(2)),
    noPct: Number(noPct.toFixed(2)),
    threshold: proposal.threshold,
    hasPassed,
    hasFailed,
    quorumMet: totalCapital > 0,
  };
}

/**
 * Move a passed proposal to execution queue.
 */
export async function executeProposal(
  proposalId: number,
  executorId: number,
  isFounder: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isFounder) {
    return { success: false, error: "Founder authority required to execute" };
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { status: true, executionStatus: true, title: true, hallId: true },
  });

  if (!proposal) {
    return { success: false, error: "Proposal not found" };
  }

  if (proposal.status !== "passed") {
    return { success: false, error: `Proposal is ${proposal.status}, not passed` };
  }

  if (proposal.executionStatus !== "pending") {
    return { success: false, error: `Already ${proposal.executionStatus}` };
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      executionStatus: "in_progress",
      startedAt: new Date(),
      executedBy: executorId,
    },
  });

  await prisma.auditEntry.create({
    data: {
      type: "proposal_execution_started",
      description: `Proposal "${proposal.title}" execution started`,
      txHash: `PROP-EXEC-${proposalId}-${Date.now()}`,
    },
  });

  return { success: true };
}

/* ============================================================
   QUERIES
   ============================================================ */

/**
 * Get all active proposals for a hall.
 */
export async function getActiveProposals(hallId: number): Promise<Array<{
  id: number;
  title: string;
  type: string;
  status: string;
  endsAt: Date;
  tally: VoteTally;
}>> {
  const proposals = await prisma.proposal.findMany({
    where: {
      hallId,
      status: { in: ["active", "pending"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    proposals.map(async (p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      status: p.status,
      endsAt: p.endsAt,
      tally: await getProposalTally(p.id),
    }))
  );
}

/**
 * Get execution queue (passed proposals awaiting execution).
 */
export async function getExecutionQueue(): Promise<ExecutionQueueItem[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: "passed",
      executionStatus: { in: ["pending", "in_progress", "stalled"] },
    },
    orderBy: [
      { executionStatus: "asc" }, // pending first
      { passedAt: "asc" }, // oldest first
    ],
    include: {
      hall: {
        select: { id: true, name: true },
      },
    },
  });

  const now = Date.now();

  return proposals.map((p) => {
    const passedTime = p.passedAt ? now - p.passedAt.getTime() : 0;
    const daysInQueue = Math.floor(passedTime / (1000 * 60 * 60 * 24));

    // Priority: stalled > pending > in_progress, then by age
    let priority = daysInQueue;
    if (p.executionStatus === "stalled") priority += 1000;
    if (p.executionStatus === "pending") priority += 100;

    return {
      id: p.id,
      title: p.title,
      type: p.type,
      amount: p.amount,
      hallId: p.hallId,
      hallName: p.hall?.name || "",
      passedAt: p.passedAt || p.createdAt,
      daysInQueue,
      priority,
    };
  });
}

/**
 * Close expired proposals.
 * Should be called by a cron job periodically.
 */
export async function closeExpiredProposals(): Promise<{
  closed: number;
  passed: number;
  rejected: number;
}> {
  const now = new Date();

  const expired = await prisma.proposal.findMany({
    where: {
      status: "active",
      endsAt: { lt: now },
    },
    select: { id: true, threshold: true, hallId: true },
  });

  let passed = 0;
  let rejected = 0;

  for (const proposal of expired) {
    const tally = await getProposalTally(proposal.id);

    if (tally.hasPassed) {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: "passed", passedAt: now },
      });
      passed++;
    } else {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: "rejected" },
      });
      rejected++;
    }
  }

  return { closed: expired.length, passed, rejected };
}