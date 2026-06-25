import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { randomBytes } from "crypto";

/* ============================================================
   HELPERS
   ============================================================ */
function generateInviteCode(): string {
  return `LED-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/* ============================================================
   GET /api/halls/[id]/invite — My active invites for this Hall
   ============================================================ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;

    // Verify I belong to this hall
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id, status: { not: "forfeited" } },
      select: { id: true },
    });
    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied. Commit to enter this Hall." },
        { status: 403 }
      );
    }

    const invites = await prisma.hallInvite.findMany({
      where: {
        hallId,
        creatorId: user.id,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    // ── V3.2: Ownership is authoritative. Invite quota from Ownership. ──
    const ownershipRecord = await prisma.ownership.findFirst({
      where: {
        hallId,
        userId: user.id,
      },
      select: { inviteCodesRemaining: true, inviteCodesUsed: true },
    });

    return NextResponse.json({
      success: true,
      invites,
      remaining: ownershipRecord?.inviteCodesRemaining || 0,
      used: ownershipRecord?.inviteCodesUsed || 0,
      canGenerate: (ownershipRecord?.inviteCodesRemaining || 0) > 0,
    });
  } catch (error) {
    console.error("[INVITE GET]", error);
    return NextResponse.json({ success: false, error: "Invite list failed" }, { status: 500 });
  }
}

/* ============================================================
   POST /api/halls/[id]/invite — Generate Sovereign Invite Codes
   3 codes per committer. Single-use each. Expire when pool fills.
   ============================================================ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { count = 1 } = body;

    if (count < 1 || count > 3) {
      return NextResponse.json(
        { success: false, error: "Generate 1–3 codes at a time" },
        { status: 400 }
      );
    }

    // ── 1. VERIFY OWNERSHIP ─────────────────────────────────
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { pool: { select: { id: true, status: true } } },
    });
    if (!hall) {
      return NextResponse.json({ success: false, error: "Hall not found" }, { status: 404 });
    }

    // ── V3.2: Ownership is authoritative ────────────────────
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id },
    });
    if (!ownership) {
      return NextResponse.json(
        { success: false, error: "Commit to this pool before generating invites." },
        { status: 403 }
      );
    }

    // ── 2. CHECK REMAINING QUOTA ─────────────────────────────
    const remaining = ownership.inviteCodesRemaining;
    if (remaining <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invite quota exhausted",
          detail: `You have used all 3 invites. Used: ${ownership.inviteCodesUsed}/3.`,
        },
        { status: 403 }
      );
    }
    if (count > remaining) {
      return NextResponse.json(
        {
          success: false,
          error: "Not enough invite quota",
          detail: `Requested ${count}, but only ${remaining} remaining.`,
        },
        { status: 400 }
      );
    }

    // ── 3. GENERATE CODES ────────────────────────────────────
    const codes: string[] = [];
    const result = await prisma.$transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        let code = generateInviteCode();
        // Ensure uniqueness
        let exists = await tx.hallInvite.findUnique({ where: { code } });
        while (exists) {
          code = generateInviteCode();
          exists = await tx.hallInvite.findUnique({ where: { code } });
        }

        await tx.hallInvite.create({
          data: {
            hallId,
            creatorId: user.id,
            code,
            maxUses: 1, // Single-use per code
            usedCount: 0,
            isActive: true,
            // No expiry date — expires when pool fills (commit route deactivates all)
          },
        });
        codes.push(code);
      }

      // Update ownership quota
      await tx.ownership.update({
        where: { id: ownership.id },
        data: {
          inviteCodesRemaining: { decrement: count },
          inviteCodesUsed: { increment: count },
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          eventType: "HALL_INVITE_GENERATED",
          description: `${user.displayName} generated ${count} invite code(s) for Hall ${hall.name}`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ hallId, codes, poolId: hall.poolId }),
          txHash: `INV-${hallId}-${Date.now()}`,
          visibleToPublic: false,
        },
      });

      return codes;
    });

    return NextResponse.json({
      success: true,
      codes: result.map((code) => ({
        code,
        link: `${process.env.NEXT_PUBLIC_APP_URL || ""}/pools/${hall.poolId}?invite=${code}`,
        maxUses: 1,
        usedCount: 0,
      })),
      remaining: remaining - count,
      message: `${count} Sovereign Invite code(s) forged. Share securely. Each code admits one sovereign.`,
    });
  } catch (error) {
    console.error("[INVITE POST]", error);
    return NextResponse.json({ success: false, error: "Invite generation failed" }, { status: 500 });
  }
}