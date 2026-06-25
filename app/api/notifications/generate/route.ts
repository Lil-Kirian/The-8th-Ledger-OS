import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isFounder } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/* ============================================================
   POST /api/notifications/generate — Triggered notifications
   Vote start, vote end, dividend available, proposal passed,
   ban enacted, impeachment triggered, dormancy warning, execution update.
   ============================================================ */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only admin/founder or system webhooks can trigger bulk notifications
    const founder = await isFounder(user.vinculumId);
    if (!founder && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin or Founder authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      eventType,
      hallId,
      poolId,
      proposalId,
      targetVinculumId,
      senderId,
      senderName,
      messageType,
      metadata,
    } = body;

    if (!eventType) {
      return NextResponse.json(
        { success: false, error: "eventType required" },
        { status: 400 }
      );
    }

    let notificationsCreated = 0;
    const recipients: string[] = [];
    const MAX_BULK = 500;

    switch (eventType) {
      /* ===== VOTE START ===== */
      case "vote_start": {
        if (!hallId || !proposalId) {
          return NextResponse.json({ success: false, error: "hallId and proposalId required" }, { status: 400 });
        }
        const owners = await prisma.ownership.findMany({
          where: { hallId: Number(hallId), status: "active" },
          select: { user: { select: { vinculumId: true } } },
          take: MAX_BULK,
        });
        for (const o of owners) {
          if (!o.user?.vinculumId) continue;
          await prisma.notification.create({
            data: {
              vinculumId: o.user.vinculumId,
              poolId: poolId || null,
              proposalId: Number(proposalId),
              type: "vote_start",
              title: "New Vote Opened",
              message: "A new proposal requires your sovereign vote. Review and vote before it closes.",
              actionUrl: `/halls/${hallId}/governance`,
              createdAt: new Date(),
            },
          });
          recipients.push(o.user.vinculumId);
        }
        notificationsCreated = recipients.length;
        break;
      }

      /* ===== VOTE END / PROPOSAL PASSED ===== */
      case "vote_end":
      case "proposal_passed": {
        if (!hallId || !proposalId) {
          return NextResponse.json({ success: false, error: "hallId and proposalId required" }, { status: 400 });
        }
        const proposal = await prisma.proposal.findUnique({
          where: { id: Number(proposalId) },
          select: { title: true, status: true, voteCountYes: true, voteCountNo: true },
        });
        if (!proposal) {
          return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
        }

        const owners = await prisma.ownership.findMany({
          where: { hallId: Number(hallId), status: "active" },
          select: { user: { select: { vinculumId: true } } },
          take: MAX_BULK,
        });

        const passed = proposal.status === "passed";
        const totalVotes = (proposal.voteCountYes || 0) + (proposal.voteCountNo || 0);
        const yesPct = totalVotes > 0 ? ((proposal.voteCountYes || 0) / totalVotes) * 100 : 0;

        for (const o of owners) {
          if (!o.user?.vinculumId) continue;
          await prisma.notification.create({
            data: {
              vinculumId: o.user.vinculumId,
              poolId: poolId || null,
              proposalId: Number(proposalId),
              type: passed ? "proposal_passed" : "vote_end",
              title: passed ? "Proposal Passed" : "Vote Closed",
              message: passed
                ? `"${proposal.title}" passed with ${yesPct.toFixed(1)}% approval. Execution begins.`
                : `"${proposal.title}" closed. Result: ${yesPct.toFixed(1)}% yes.`,
              actionUrl: `/halls/${hallId}/governance`,
              createdAt: new Date(),
            },
          });
          recipients.push(o.user.vinculumId);
        }
        notificationsCreated = recipients.length;
        break;
      }

      /* ===== DIVIDEND AVAILABLE ===== */
      case "dividend": {
        if (!hallId) {
          return NextResponse.json({ success: false, error: "hallId required" }, { status: 400 });
        }
        const owners = await prisma.ownership.findMany({
          where: { hallId: Number(hallId), status: "active" },
          select: { user: { select: { vinculumId: true } }, ownershipPercent: true },
          take: MAX_BULK,
        });
        for (const o of owners) {
          if (!o.user?.vinculumId) continue;
          await prisma.notification.create({
            data: {
              vinculumId: o.user.vinculumId,
              poolId: poolId || null,
              type: "dividend",
              title: "Dividend Available",
              message: `New revenue distributed. Your ownership (${Number(o.ownershipPercent).toFixed(2)}%) earned a dividend. Claim now.`,
              actionUrl: `/halls/${hallId}/dividends`,
              createdAt: new Date(),
            },
          });
          recipients.push(o.user.vinculumId);
        }
        notificationsCreated = recipients.length;
        break;
      }

      /* ===== BAN ENACTED ===== */
      case "ban_enacted": {
        if (!hallId || !targetVinculumId) {
          return NextResponse.json({ success: false, error: "hallId and targetVinculumId required" }, { status: 400 });
        }
        await prisma.notification.create({
          data: {
            vinculumId: targetVinculumId,
            poolId: poolId || null,
            type: "ban_enacted",
            title: "Ban Enforced",
            message: "A ban against you has been enacted by the Hall Tribunal. You may appeal.",
            actionUrl: `/halls/${hallId}/tribunal`,
            createdAt: new Date(),
          },
        });
        recipients.push(targetVinculumId);
        notificationsCreated = 1;
        break;
      }

      /* ===== IMPEACHMENT TRIGGERED ===== */
      case "impeachment": {
        if (!hallId || !targetVinculumId) {
          return NextResponse.json({ success: false, error: "hallId and targetVinculumId required" }, { status: 400 });
        }
        const target = await prisma.user.findUnique({
          where: { vinculumId: targetVinculumId },
          select: { vinculumId: true },
        });
        if (target) {
          await prisma.notification.create({
            data: {
              vinculumId: target.vinculumId,
              poolId: poolId || null,
              type: "impeachment",
              title: "Impeachment Vote Triggered",
              message: "An impeachment vote has been filed against your role. Prepare your defense.",
              actionUrl: `/halls/${hallId}/governance`,
              createdAt: new Date(),
            },
          });
          recipients.push(target.vinculumId);
          notificationsCreated = 1;
        }
        break;
      }

      /* ===== DORMANCY WARNING ===== */
      case "dormancy": {
        if (!targetVinculumId) {
          return NextResponse.json({ success: false, error: "targetVinculumId required" }, { status: 400 });
        }
        await prisma.notification.create({
          data: {
            vinculumId: targetVinculumId,
            poolId: poolId || null,
            type: "dormancy",
            title: "Dormancy Warning",
            message: "Your account or asset is approaching dormancy. Activity required within 30 days to prevent forfeiture.",
            actionUrl: "/settings",
            createdAt: new Date(),
          },
        });
        recipients.push(targetVinculumId);
        notificationsCreated = 1;
        break;
      }

      /* ===== EXECUTION UPDATE ===== */
      case "execution": {
        if (!hallId || !proposalId) {
          return NextResponse.json({ success: false, error: "hallId and proposalId required" }, { status: 400 });
        }
        const owners = await prisma.ownership.findMany({
          where: { hallId: Number(hallId), status: "active" },
          select: { user: { select: { vinculumId: true } } },
          take: MAX_BULK,
        });
        for (const o of owners) {
          if (!o.user?.vinculumId) continue;
          await prisma.notification.create({
            data: {
              vinculumId: o.user.vinculumId,
              poolId: poolId || null,
              proposalId: Number(proposalId),
              type: "execution",
              title: "Execution Update",
              message: "A passed proposal is being executed. Proof photos and cost tracker updated.",
              actionUrl: `/halls/${hallId}/operations`,
              createdAt: new Date(),
            },
          });
          recipients.push(o.user.vinculumId);
        }
        notificationsCreated = recipients.length;
        break;
      }

      /* ===== HALL MESSAGE ===== */
      case "hall_message": {
        if (!hallId || !senderId) {
          return NextResponse.json({ success: false, error: "hallId and senderId required" }, { status: 400 });
        }
        const senderIdNum = Number(senderId);
        const owners = await prisma.ownership.findMany({
          where: {
            hallId: Number(hallId),
            status: "active",
            NOT: { userId: senderIdNum },
          },
          select: { user: { select: { vinculumId: true } } },
          take: MAX_BULK,
        });
        for (const o of owners) {
          if (!o.user?.vinculumId) continue;
          await prisma.notification.create({
            data: {
              vinculumId: o.user.vinculumId,
              poolId: poolId || null,
              type: "hall_message",
              title: `New ${messageType || "Message"} in Hall`,
              message: `${senderName || "A sovereign"} sent a message.`,
              actionUrl: `/halls/${hallId}/chat`,
              createdAt: new Date(),
            },
          });
          recipients.push(o.user.vinculumId);
        }
        notificationsCreated = recipients.length;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown eventType: ${eventType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      eventType,
      notificationsCreated,
      recipients,
      message: `${notificationsCreated} notification(s) dispatched for ${eventType}.`,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "Related record not found" },
          { status: 404 }
        );
      }
    }
    console.error("[NOTIFICATION GENERATE]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Notification generation failed" },
      { status: 500 }
    );
  }
}