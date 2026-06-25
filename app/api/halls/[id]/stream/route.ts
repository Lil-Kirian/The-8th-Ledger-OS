import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAuth } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────
// GET  /api/halls/[id]/stream
// Returns all Sovereign Stream posts for this hall.
// Includes: author, replies with authors, proposal vote stats.
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership gate — zero cross-hall visibility
    const hasAccess = await prisma.ownership.findFirst({
      where: { hallId, ledgerId: user.ledgerId },
    });
    if (!hasAccess && user.role !== "admin" && !user.isPrimaryAdmin) {
      return NextResponse.json(
        { error: "Sovereign Stream is sealed. Ownership required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const posts = await prisma.sovereignStreamPost.findMany({
      where: {
        hallId,
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        author: {
          select: {
            ledgerId: true,
            displayName: true,
            avatar: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                ledgerId: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        proposal: {
          select: {
            id: true,
            voteWeightYes: true,
            voteWeightNo: true,
            voteCountYes: true,
            voteCountNo: true,
            status: true,
            thresholdPercent: true,
          },
        },
      },
    });

    // Shape response — add voteStats for proposals, strip internals
    const shapedPosts = posts.map((post) => {
      const base = {
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        author: post.author,
        proposalId: post.proposalId,
        createdAt: post.createdAt.toISOString(),
        replies: post.replies.map((r) => ({
          id: r.id,
          content: r.content,
          author: r.author,
          createdAt: r.createdAt.toISOString(),
        })),
      };

      if (post.type === "PROPOSAL" && post.proposal) {
        const totalWeight = post.proposal.voteWeightYes + post.proposal.voteWeightNo;
        return {
          ...base,
          voteStats: {
            yesWeight: post.proposal.voteWeightYes,
            noWeight: post.proposal.voteWeightNo,
            yesCount: post.proposal.voteCountYes,
            noCount: post.proposal.voteCountNo,
            status: post.proposal.status,
            threshold: post.proposal.thresholdPercent,
            totalWeight: totalWeight > 0 ? totalWeight : 0,
          },
        };
      }

      return base;
    });

    return NextResponse.json({
      posts: shapedPosts,
      count: shapedPosts.length,
      hallId,
      meta: {
        limit,
        offset,
        hasMore: shapedPosts.length === limit,
      },
    });
  } catch (err) {
    console.error("[8th Ledger] Stream GET error:", err);
    return NextResponse.json(
      { error: "The Stream is momentarily disturbed. Try again." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST  /api/halls/[id]/stream
// Creates a new Sovereign Stream post.
// Types: PROPOSAL | REPORT | APPEAL | 8TH_LEDGER_UPDATE
// ─────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hallId } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership gate
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, ledgerId: user.ledgerId },
    });
    if (!ownership && user.role !== "admin" && !user.isPrimaryAdmin) {
      return NextResponse.json(
        { error: "Hall ownership required to speak in the Stream." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, title, content, proposalId } = body;

    // Validate type
    const validTypes = ["PROPOSAL", "REPORT", "APPEAL", "8TH_LEDGER_UPDATE"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid post type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length < 5 || title.trim().length > 200) {
      return NextResponse.json(
        { error: "Title must be 5–200 characters." },
        { status: 400 }
      );
    }

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters." },
        { status: 400 }
      );
    }

    // If linked to a proposal, verify it exists in this hall
    if (proposalId) {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId, hallId },
      });
      if (!proposal) {
        return NextResponse.json(
          { error: "Linked proposal not found in this hall." },
          { status: 404 }
        );
      }
    }

    // 8TH_LEDGER_UPDATE is admin-only
    if (type === "8TH_LEDGER_UPDATE" && user.role !== "admin" && !user.isPrimaryAdmin) {
      return NextResponse.json(
        { error: "Only the 8th Ledger may post system updates." },
        { status: 403 }
      );
    }

    // Create post
    const post = await prisma.sovereignStreamPost.create({
      data: {
        hallId,
        type,
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        proposalId: proposalId || null,
      },
      include: {
        author: {
          select: {
            ledgerId: true,
            displayName: true,
            avatar: true,
          },
        },
        replies: true,
      },
    });

    // Log to hall activity
    await prisma.hallActivity.create({
      data: {
        hallId,
        userId: user.id,
        type: "sovereign_stream_post",
        description: `${type} posted: "${title.trim()}"`,
        metadata: JSON.stringify({ postId: post.id, postType: type }),
      },
    });

    return NextResponse.json({
      message: "Published to the Sovereign Stream.",
      post: {
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        author: post.author,
        proposalId: post.proposalId,
        createdAt: post.createdAt.toISOString(),
        replies: [],
      },
    });
  } catch (err) {
    console.error("[8th Ledger] Stream POST error:", err);
    return NextResponse.json(
      { error: "Failed to publish. The Stream is momentarily disturbed." },
      { status: 500 }
    );
  }
}