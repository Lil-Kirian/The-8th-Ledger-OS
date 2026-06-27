import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin, verifyOwnership } from "@/lib/auth";

/* ============================================================
   GET /api/halls/[id]/tribunal — Tribunal history & active cases
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    // Gate
    const hasAccess = await verifyOwnership(user.id, undefined, hallId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 }
      );
    }

    const where: unknown = { hallId };
    if (status !== "all") where.status = status;

    const cases = await prisma.hallActivity.findMany({
      where: {
        ...where,
        type: { in: ["ban", "tribunal", "fraud_override"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { ledgerId: true, displayName: true, avatar: true },
        },
      },
    });

    // Enrich with ban records if applicable
    const enriched = await Promise.all(
      cases.map(async (c) => {
        let banRecord = null;
        let votes = null;
        if (c.metadata) {
          try {
            const meta = JSON.parse(c.metadata);
            if (meta.banId) {
              banRecord = await prisma.banRecord.findUnique({
                where: { id: meta.banId },
                select: {
                  reason: true,
                  evidence: true,
                  isAppealed: true,
                  appealReason: true,
                  duration: true,
                  expiresAt: true,
                },
              });
            }
            if (meta.proposalId) {
              votes = await prisma.vote.findMany({
                where: { proposalId: meta.proposalId },
                select: { choice: true, weight: true },
              });
            }
          } catch {
            // metadata not JSON
          }
        }
        return { ...c, banRecord, votes };
      })
    );

    return NextResponse.json({
      success: true,
      cases: enriched,
      total: enriched.length,
      yourOverridePower: isPrimaryAdmin(user.ledgerId),
    });
  } catch (error) {
    console.error("[TRIBUNAL GET]", error);
    return NextResponse.json({ success: false, error: "Tribunal history unavailable" }, { status: 500 });
  }
}

/* ============================================================
   POST /api/halls/[id]/tribunal — File report evidence
   Screenshots, links, text. Community vote. Primary Admin override.
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
    const {
      targetUserId,
      reportType, // fraud | harassment | scam | spam | other
      description,
      evidenceUrls, // Array of screenshot/image URLs
      externalLinks, // Array of supporting links
      severity = "medium", // low | medium | high | critical
    } = body;

    if (!targetUserId || !reportType || !description) {
      return NextResponse.json(
        { success: false, error: "targetUserId, reportType, and description required" },
        { status: 400 }
      );
    }

    if (!["fraud", "harassment", "scam", "spam", "other"].includes(reportType)) {
      return NextResponse.json({ success: false, error: "Invalid report type" }, { status: 400 });
    }

    // Gate
    const hasAccess = await verifyOwnership(user.id, undefined, hallId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Sovereign access denied" },
        { status: 403 }
      );
    }

    // Cannot report primary admin
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { ledgerId: true, displayName: true },
    });
    if (!target) {
      return NextResponse.json({ success: false, error: "Target user not found" }, { status: 404 });
    }
    if (isPrimaryAdmin(target.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Cannot report the 8th Ledger Primary Admin to Tribunal" },
        { status: 403 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create tribunal activity record
      const tribunal = await tx.hallActivity.create({
        data: {
          hallId,
          userId: user.id,
          type: "tribunal",
          description: `${user.displayName} reported ${target.displayName} for ${reportType}: ${description}`,
          metadata: JSON.stringify({
            targetUserId,
            reportType,
            severity,
            evidenceUrls: evidenceUrls || [],
            externalLinks: externalLinks || [],
            reporterId: user.id,
          }),
        },
      });

      // Auto-create ban proposal for high/critical severity
      let proposal = null;
      if (severity === "high" || severity === "critical") {
        proposal = await tx.proposal.create({
          data: {
            poolId: (await tx.hall.findUnique({ where: { id: hallId }, select: { poolId: true } }))?.poolId || "",
            hallId,
            proposerId: user.id,
            title: `Tribunal: Ban ${target.displayName} (${reportType})`,
            description: `Severity: ${severity}. ${description}. Evidence: ${(evidenceUrls || []).length} files.`,
            type: "impeach_manager",
            status: "active",
            endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            thresholdPercent: 51.0,
          },
        });

        // Pre-create ban record (pending vote)
        await tx.banRecord.create({
          data: {
            hallId,
            userId: targetUserId,
            bannedById: user.id,
            reason: `Tribunal: ${reportType} — ${description}`,
            evidence: JSON.stringify({ evidenceUrls, externalLinks, severity }),
            duration: severity === "critical" ? "permanent" : "90d",
            isAppealed: false,
          },
        });
      }

      // Notify target user
      await tx.notification.create({
        data: {
          ledgerId: target.ledgerId,
          type: "tribunal_reported",
          title: "Tribunal Report Filed Against You",
          message: `${user.displayName} reported you for ${reportType} in Hall ${hallId}. Severity: ${severity}.`,
          actionUrl: `/halls/${hallId}/tribunal`,
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          eventType: "TRIBUNAL_REPORT",
          description: `${user.displayName} reported ${target.displayName} for ${reportType}`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ hallId, targetUserId, severity, tribunalId: tribunal.id }),
          txHash: `TRB-${hallId}-${Date.now()}`,
          visibleToPublic: false,
        },
      });

      return { tribunal, proposal };
    });

    return NextResponse.json({
      success: true,
      tribunal: result.tribunal,
      ...(result.proposal ? { proposalId: result.proposal.id, voteRequired: true } : { voteRequired: false }),
      message: result.proposal
        ? `Report filed. High severity triggered automatic ban vote. Community must reach 51%.`
        : `Report filed. Tribunal will review. No automatic ban triggered for ${severity} severity.`,
    });
  } catch (error: unknown) {
    console.error("[TRIBUNAL POST]", error);
    return NextResponse.json({ success: false, error: error.message || "Tribunal filing failed" }, { status: 500 });
  }
}

/* ============================================================
   PATCH /api/halls/[id]/tribunal — Primary Admin override
   8th Ledger Primary Admin can override community vote in fraud cases.
   ============================================================ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const { id: hallId } = await params;
    const body = await request.json();
    const { tribunalId, action, overrideReason } = body;

    if (!tribunalId || !action || !["enforce_ban", "overturn_ban", "dismiss"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "tribunalId and action (enforce_ban|overturn_ban|dismiss) required" },
        { status: 400 }
      );
    }

    const tribunal = await prisma.hallActivity.findFirst({
      where: { id: tribunalId, hallId, type: "tribunal" },
    });
    if (!tribunal) {
      return NextResponse.json({ success: false, error: "Tribunal case not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update tribunal record
      const updated = await tx.hallActivity.update({
        where: { id: tribunalId },
        data: {
          type: "fraud_override",
          description: `${tribunal.description} [PRIMARY ADMIN OVERRIDE: ${action}] Reason: ${overrideReason || "No reason provided"}`,
          metadata: JSON.stringify({
            ...JSON.parse(tribunal.metadata || "{}"),
            primaryAdminOverride: true,
            action,
            overrideReason,
            overriddenBy: user.ledgerId,
            overriddenAt: new Date().toISOString(),
          }),
        },
      });

      // Execute primary admin decision
      let meta: unknown = {};
      try { meta = JSON.parse(tribunal.metadata || "{}"); } catch {}

      if (action === "enforce_ban" && meta.targetUserId) {
        await tx.banRecord.create({
          data: {
            hallId,
            userId: meta.targetUserId,
            bannedById: user.id,
            reason: `Primary Admin override: ${overrideReason || "Fraud confirmed"}`,
            duration: "permanent",
            isAppealed: false,
          },
        });
      } else if (action === "overturn_ban" && meta.targetUserId) {
        await tx.banRecord.updateMany({
          where: { hallId, userId: meta.targetUserId },
          data: { expiresAt: new Date() }, // Expire immediately
        });
      }

      // Audit
      await tx.auditLog.create({
        data: {
          eventType: "TRIBUNAL_OVERRIDE",
          description: `Primary Admin ${user.displayName} overrode tribunal ${tribunalId}: ${action}`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ hallId, tribunalId, action, overrideReason }),
          txHash: `TRB-OVERRIDE-${hallId}-${Date.now()}`,
          visibleToPublic: false,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      tribunal: result,
      message: `Primary Admin override executed: ${action}. ${overrideReason || "No reason provided"}.`,
    });
  } catch (error: unknown) {
    console.error("[TRIBUNAL PATCH]", error);
    return NextResponse.json({ success: false, error: error.message || "Override failed" }, { status: 500 });
  }
}