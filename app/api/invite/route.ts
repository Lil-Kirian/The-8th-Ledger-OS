import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface InviteResponse {
  success: boolean;
  codes?: unknown[];
  code?: unknown;
  error?: string;
  message?: string;
}

/* ============================================================
   GET /api/invite — List my invite codes
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<InviteResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const codes = await prisma.inviteCode.findMany({
      where: { ownerId: user.ledgerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<InviteResponse>({
      success: true,
      codes,
    });
  } catch (error) {
    console.error("[INVITE GET]", error);
    return NextResponse.json<InviteResponse>(
      { success: false, error: "Failed to fetch invite codes" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/invite — Generate new invite code
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json<InviteResponse>(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { maxUses = 50, expiresInDays } = body;

    // Generate code: first 4 of ledgerId + random segment
    const segment = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${user.ledgerId.split("-")[1]}-${segment}`;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const created = await prisma.inviteCode.create({
      data: {
        code,
        ownerId: user.ledgerId,
        maxUses: Number(maxUses),
        expiresAt,
      },
    });

    return NextResponse.json<InviteResponse>(
      {
        success: true,
        code: created,
        message: `Invite code generated: ${code}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[INVITE POST]", error);
    return NextResponse.json<InviteResponse>(
      { success: false, error: "Failed to generate invite code" },
      { status: 500 }
    );
  }
}