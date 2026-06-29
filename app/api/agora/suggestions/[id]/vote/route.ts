import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// TYPES & CONSTANTS
//

type VoteDirection = "up" | "down";

const VALID_DIRECTIONS: VoteDirection[] = ["up", "down"];

//
// AUDIT LOGGING
//

async function logAudit(props: {
  eventType: string;
  description: string;
  ledgerId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: props.eventType,
        description: props.description,
        ledgerId: props.ledgerId ?? null,
        metadata: props.metadata ? JSON.stringify(props.metadata) : null,
        txHash: `AUD-${randomUUID()}`,
        visibleToPublic: true,
        timestamp: new Date(),
      },
    });
  } catch {
    // Silent fail — audit must not break user flow
  }
}

//
// POST /api/agora/suggestions/[id]/vote
// Toggle vote with atomic counter recalculation.
// Rules: 1 vote per user per suggestion. Self-voting blocked.
//

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth gate
    const user = await requireAuth(req);
    const { id: suggestionId } = await params;

    if (!suggestionId || suggestionId.length < 10) {
      return NextResponse.json(
        { error: "Invalid suggestion ID", code: "VALIDATION_ID" },
        { status: 400 },
      );
    }

    // 2. Parse & validate body
    const body = await req.json();
    const { direction } = body;

    if (!direction || !VALID_DIRECTIONS.includes(direction as VoteDirection)) {
      return NextResponse.json(
        {
          error: "Direction must be 'up' or 'down'",
          code: "VALIDATION_DIRECTION",
        },
        { status: 400 },
      );
    }

    // 3. Verify suggestion exists and fetch creator
    const suggestion = await prisma.agoraSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        userId: true,
        title: true,
        upvotes: true,
        downvotes: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // 4. Self-vote prevention
    if (suggestion.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot vote on your own suggestion", code: "SELF_VOTE" },
        { status: 403 },
      );
    }

    // 5. Atomic vote toggle
    // Logic:
    //   - No existing vote → create vote, increment counter
    //   - Same direction → delete vote, decrement counter (unvote)
    //   - Different direction → update vote, flip counters
    const existingVote = await prisma.agoraSuggestionVote.findUnique({
      where: {
        suggestionId_userId: {
          suggestionId,
          userId: user.id,
        },
      },
    });

    let voteResult: {
      action: "created" | "removed" | "flipped";
      direction: VoteDirection | null;
      upvotesDelta: number;
      downvotesDelta: number;
    };

    if (!existingVote) {
      // Fresh vote
      voteResult = {
        action: "created",
        direction: direction as VoteDirection,
        upvotesDelta: direction === "up" ? 1 : 0,
        downvotesDelta: direction === "down" ? 1 : 0,
      };
    } else if (existingVote.direction === direction) {
      // Unvote (toggle off)
      voteResult = {
        action: "removed",
        direction: null,
        upvotesDelta: direction === "up" ? -1 : 0,
        downvotesDelta: direction === "down" ? -1 : 0,
      };
    } else {
      // Flip vote
      voteResult = {
        action: "flipped",
        direction: direction as VoteDirection,
        upvotesDelta: direction === "up" ? 1 : -1,
        downvotesDelta: direction === "down" ? 1 : -1,
      };
    }

    // 6. Execute atomic transaction
    const [updatedSuggestion] = await prisma.$transaction([
      // Update counters
      prisma.agoraSuggestion.update({
        where: { id: suggestionId },
        data: {
          upvotes: { increment: voteResult.upvotesDelta },
          downvotes: { increment: voteResult.downvotesDelta },
        },
      }),

      // Manage vote record
      voteResult.action === "created"
        ? prisma.agoraSuggestionVote.create({
            data: {
              suggestionId,
              userId: user.id,
              direction: direction as VoteDirection,
            },
          })
        : voteResult.action === "removed"
          ? prisma.agoraSuggestionVote.delete({
              where: {
                suggestionId_userId: {
                  suggestionId,
                  userId: user.id,
                },
              },
            })
          : prisma.agoraSuggestionVote.update({
              where: {
                suggestionId_userId: {
                  suggestionId,
                  userId: user.id,
                },
              },
              data: {
                direction: direction as VoteDirection,
                updatedAt: new Date(),
              },
            }),

      // Audit trail
      prisma.auditLog.create({
        data: {
          eventType: "agora_suggestion_vote",
          description: `Vote ${voteResult.action} on suggestion "${suggestion.title}"`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            suggestionId,
            action: voteResult.action,
            direction: voteResult.direction,
            previousDirection: existingVote?.direction ?? null,
          }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      }),
    ]);

    // 7. Response
    return NextResponse.json({
      success: true,
      vote: {
        action: voteResult.action,
        direction: voteResult.direction,
      },
      suggestion: {
        id: updatedSuggestion.id,
        upvotes: updatedSuggestion.upvotes,
        downvotes: updatedSuggestion.downvotes,
        score: updatedSuggestion.upvotes - updatedSuggestion.downvotes,
      },
    });
  } catch (error: any) {
    console.error("[AGORA_SUGGESTION_VOTE]", error);

    if (
      error.message?.includes("Unauthorized") ||
      error.message?.includes("unauthorized")
    ) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // Prisma unique-constraint violation (race condition on duplicate vote)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Vote already recorded. Refresh and try again.",
          code: "CONFLICT",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to record vote", code: "AGORA_VOTE_001" },
      { status: 500 },
    );
  }
}