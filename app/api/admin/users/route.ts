import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateTxHash } from "@/lib/utils";

/* ============================================================
   GET — List Users
   V3.2: Filter by kycTier (authoritative) or kycStatus (legacy)
   ============================================================ */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  if (user.role !== "admin")
    return NextResponse.json(
      { success: false, error: "Admin access only" },
      { status: 403 },
    );

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";
  const kyc = searchParams.get("kyc") || "all";
  const kycTierFilter = searchParams.get("kycTier") || "all";
  const sort = searchParams.get("sort") || "trustScore";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "25", 10)),
  );
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status !== "all") where.role = status;
  if (kycTierFilter !== "all") {
    where.kycTier = kycTierFilter;
  } else if (kyc !== "all") {
    where.kycStatus = kyc;
  }
  if (q) {
    where.OR = [
      { ledgerId: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: any = {};
  if (
    [
      "trustScore",
      "tier",
      "identityScore",
      "ledgerBalance",
      "creditPool",
      "displayName",
      "createdAt",
    ].includes(sort)
  ) {
    orderBy[sort] = dir;
  } else {
    orderBy.trustScore = dir;
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          ledgerId: true,
          displayName: true,
          email: true,
          country: true,
          tier: true,
          trustScore: true,
          ledgerBalance: true,
          creditPool: true,
          identityScore: true,
          kycStatus: true,
          kycTier: true,
          role: true,
          isPrimaryAdmin: true,
          totalCommitted: true,
          forgesCompleted: true,
          referrals: true,
          createdAt: true,
          lastLoginAt: true,
          lastActivityAt: true,
          isBanned: true,
          globalSriScore: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 },
    );
  }
}

/* ============================================================
   PATCH — User Actions
   V3.2: verify-kyc / unverify-kyc syncs kycTier + kycStatus
   ============================================================ */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  if (user.role !== "admin")
    return NextResponse.json(
      { success: false, error: "Admin access only" },
      { status: 403 },
    );

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const { action, ledgerId, tierDelta } = body;
  if (!action || !ledgerId) {
    return NextResponse.json(
      { success: false, error: "Missing action or ledgerId" },
      { status: 400 },
    );
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { ledgerId } });
    if (!targetUser)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );

    let updateData: any = {};
    let message = "";

    switch (action) {
      case "ban":
        updateData = { isBanned: true, role: "user" };
        message = `Sovereign ${ledgerId} banned.`;
        break;
      case "unban":
        updateData = { isBanned: false };
        message = `Sovereign ${ledgerId} unbanned.`;
        break;
      case "suspend":
        updateData = { isBanned: true, role: "user" };
        message = `Sovereign ${ledgerId} suspended.`;
        break;
      case "activate":
        updateData = { isBanned: false, role: "user" };
        message = `Sovereign ${ledgerId} activated.`;
        break;
      case "verify-kyc":
        updateData = {
          kycStatus: "verified",
          kycTier: "verified",
          kycVerifiedAt: new Date(),
        };
        message = `KYC verified for ${ledgerId}. Tier upgraded to VERIFIED.`;
        break;
      case "unverify-kyc":
        updateData = {
          kycStatus: "unverified",
          kycTier: "visitor",
          kycVerifiedAt: null,
        };
        message = `KYC revoked for ${ledgerId}. Tier reset to VISITOR.`;
        break;
      case "promote":
        updateData = { tier: Math.min(10, targetUser.tier + (tierDelta || 1)) };
        message = `Sovereign ${ledgerId} promoted to Tier ${updateData.tier}.`;
        break;
      case "demote":
        updateData = {
          tier: Math.max(1, targetUser.tier - (Math.abs(tierDelta) || 1)),
        };
        message = `Sovereign ${ledgerId} demoted to Tier ${updateData.tier}.`;
        break;
      case "make-admin":
        updateData = { role: "admin", isPrimaryAdmin: false };
        message = `Sovereign ${ledgerId} granted Admin privileges.`;
        break;
      case "make-primary-admin":
        if (!user.isPrimaryAdmin) {
          return NextResponse.json(
            { success: false, error: "Primary Admin access only" },
            { status: 403 },
          );
        }
        updateData = { role: "admin", isPrimaryAdmin: true };
        message = `Sovereign ${ledgerId} granted Primary Admin privileges.`;
        break;
      case "make-user":
        updateData = { role: "user", isPrimaryAdmin: false };
        message = `Privileges revoked for ${ledgerId}.`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 },
        );
    }

    await prisma.user.update({ where: { ledgerId }, data: updateData });

    // Sync KycRecord on verify/unverify
    if (action === "verify-kyc" || action === "unverify-kyc") {
      await prisma.kycRecord.updateMany({
        where: { userId: targetUser.id },
        data: {
          status: action === "verify-kyc" ? "approved" : "rejected",
          tier: action === "verify-kyc" ? "verified" : "visitor",
          reviewedBy: user.ledgerId,
          reviewedAt: new Date(),
          ...(action === "unverify-kyc"
            ? { rejectionReason: "Revoked by admin" }
            : {}),
        },
      });
    }

    // Log to audit
    await prisma.auditLog.create({
      data: {
        eventType: "ADMIN_USER_ACTION",
        description: message,
        ledgerId,
        metadata: JSON.stringify({ action, updateData }),
        txHash: generateTxHash("AUD-USER"),
        visibleToPublic: false,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("Admin users PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 },
    );
  }
}
