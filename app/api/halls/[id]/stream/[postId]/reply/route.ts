import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

//
// POST  /api/halls/[id]/stream/[postId]/reply
// Adds a threaded reply to a Sovereign Stream post.
// Only hall owners may reply. Zero cross-hall visibility.
//
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: hallId, postId } = await params;
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
        { error: "Hall ownership required to reply in the Stream." },
        { status: 403 }
      );
    }

    // Verify the parent post exists in this hall
    const parentPost = await prisma.sovereignStreamPost.findFirst({
      where: { id: postId, hallId },
    });
    if (!parentPost) {
      return NextResponse.json(
        { error: "Post not found in this hall." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length < 2) {
      return NextResponse.json(
        { error: "Reply must be at least 2 characters." },
        { status: 400 }
      );
    }
    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: "Reply cannot exceed 2000 characters." },
        { status: 400 }
      );
    }

    // Create reply
    const reply = await prisma.sovereignStreamPost.create({
      data: {
        hallId,
        type: "REPLY",
        title: `Re: ${parentPost.title}`,
        content: content.trim(),
        authorId: user.id,
        // Replies are linked via a self-relation if you add `parentId` to the schema,
        // or use a separate Reply model. For now, using the schema as-is with a simple
        // convention: we log it as a separate post with type REPLY.
        // NOTE: If your schema has a `parentId` field on SovereignStreamPost, use:
        // parentId: postId,
      },
      include: {
        author: {
          select: {
            ledgerId: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Log to hall activity
    await prisma.hallActivity.create({
      data: {
        hallId,
        userId: user.id,
        type: "sovereign_stream_reply",
        description: `Replied to "${parentPost.title}"`,
        metadata: JSON.stringify({
          postId: parentPost.id,
          replyId: reply.id,
        }),
      },
    });

    return NextResponse.json({
      message: "Reply added to the Stream.",
      reply: {
        id: reply.id,
        content: reply.content,
        author: reply.author,
        createdAt: reply.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[8th Ledger] Stream Reply POST error:", err);
    return NextResponse.json(
      { error: "Failed to post reply. The Stream is disturbed." },
      { status: 500 }
    );
  }
}