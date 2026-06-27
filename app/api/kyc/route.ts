import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   GET /api/kyc — Current user's KYC status
   8th Ledger Sovereign Identity Verification
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycRecord.findUnique({
      where: { userId: user.id },
    });

    if (!kyc) {
      return NextResponse.json({
        success: true,
        kyc: {
          status: "pending",
          tier: "visitor",
          progress: { id: false, selfie: false, liveness: false, address: false },
          message: "Start Sovereign Identity Verification to unlock commitments and withdrawals.",
        },
      });
    }

    const progress = {
      id: kyc.idVerified,
      selfie: kyc.selfieVerified,
      liveness: kyc.livenessPassed,
      address: kyc.addressVerified,
    };

    const stepsComplete = Object.values(progress).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      kyc: {
        id: kyc.id,
        status: kyc.status,
        tier: kyc.tier,
        legalName: kyc.legalName,
        idType: kyc.idType,
        idNumber: kyc.idNumber ? `****${kyc.idNumber.slice(-4)}` : null,
        idImageUrl: kyc.idImageUrl,
        selfieUrl: kyc.selfieUrl,
        livenessVideoUrl: kyc.livenessVideoUrl,
        addressProofUrl: kyc.addressProofUrl,
        dateOfBirth: kyc.dateOfBirth,
        address: kyc.address,
        reviewedAt: kyc.reviewedAt,
        rejectionReason: kyc.rejectionReason,
        reviewedBy: kyc.reviewedBy,
        progress,
        stepsComplete,
        totalSteps: 4,
      },
    });
  } catch (error) {
    console.error("[KYC GET]", error);
    return NextResponse.json({ success: false, error: "KYC status unreachable" }, { status: 500 });
  }
}

/* ============================================================
   POST /api/kyc — Submit KYC step
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      step, // "id" | "selfie" | "liveness" | "address"
      idType,
      idNumber,
      idImageUrl,
      selfieUrl,
      selfieMatchScore,
      livenessVideoUrl,
      livenessPassed,
      addressProofUrl,
      legalName,
      dateOfBirth,
      address,
    } = body;

    if (!step || !["id", "selfie", "liveness", "address"].includes(step)) {
      return NextResponse.json(
        { success: false, error: "Step must be 'id', 'selfie', 'liveness', or 'address'" },
        { status: 400 }
      );
    }

    // Upsert KycRecord
    const existing = await prisma.kycRecord.findUnique({
      where: { userId: user.id },
    });

    const updateData: unknown = {};

    if (step === "id") {
      if (!idType || !idNumber || !idImageUrl) {
        return NextResponse.json(
          { success: false, error: "idType, idNumber, and idImageUrl required" },
          { status: 400 }
        );
      }

      // NAME MATCH CHECK
      // User's displayName or legalName must match the ID
      const nameOnAccount = user.legalName || user.displayName;
      const nameOnId = legalName || user.displayName;
      if (nameOnAccount && nameOnId && nameOnAccount.toLowerCase().trim() !== nameOnId.toLowerCase().trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Name mismatch",
            detail: `Account name (${nameOnAccount}) does not match ID name (${nameOnId}). Update your legal name in settings first.`,
          },
          { status: 400 }
        );
      }

      updateData.idType = idType;
      updateData.idNumber = idNumber;
      updateData.idImageUrl = idImageUrl;
      updateData.idVerified = true;
      updateData.legalName = legalName || user.displayName;
    }

    if (step === "selfie") {
      if (!selfieUrl) {
        return NextResponse.json({ success: false, error: "selfieUrl required" }, { status: 400 });
      }
      updateData.selfieUrl = selfieUrl;
      updateData.selfieMatchScore = selfieMatchScore || null;
      updateData.selfieVerified = true;
    }

    if (step === "liveness") {
      if (!livenessVideoUrl) {
        return NextResponse.json({ success: false, error: "livenessVideoUrl required" }, { status: 400 });
      }
      updateData.livenessVideoUrl = livenessVideoUrl;
      updateData.livenessPassed = livenessPassed === true;
    }

    if (step === "address") {
      if (!addressProofUrl || !address) {
        return NextResponse.json(
          { success: false, error: "addressProofUrl and address required" },
          { status: 400 }
        );
      }
      updateData.addressProofUrl = addressProofUrl;
      updateData.addressVerified = true;
      updateData.address = address;
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : existing?.dateOfBirth;
    }

    // Auto-determine tier based on completion
    const willBeComplete =
      (step === "id" || existing?.idVerified) &&
      (step === "selfie" || existing?.selfieVerified) &&
      (step === "liveness" || existing?.livenessPassed) &&
      (step === "address" || existing?.addressVerified);

    if (willBeComplete) {
      updateData.status = "pending"; // Awaiting admin review
      updateData.tier = "sovereign"; // Temporary until admin upgrades to verified/whale
    } else {
      updateData.status = existing?.status || "pending";
      updateData.tier = existing?.tier || "visitor";
    }

    const kyc = await prisma.kycRecord.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...updateData,
        status: willBeComplete ? "pending" : "pending",
        tier: willBeComplete ? "sovereign" : "visitor",
      },
      update: updateData,
    });

    // Update User model for quick lookups
    await prisma.user.update({
      where: { id: user.id },
      data: {
        legalName: kyc.legalName || user.legalName,
        kycTier: kyc.tier,
        kycStatus: kyc.status,
      },
    });

    return NextResponse.json({
      success: true,
      kyc: {
        step,
        status: kyc.status,
        tier: kyc.tier,
        verified: willBeComplete,
      },
      message: willBeComplete
        ? "All steps complete. Awaiting 8th Ledger review for full verification."
        : `${step} submitted. Complete remaining steps.`,
    });
  } catch (error) {
    console.error("[KYC POST]", error);
    return NextResponse.json({ success: false, error: "KYC submission failed" }, { status: 500 });
  }
}

/* ============================================================
   PATCH /api/kyc — Admin review (approve / reject / needs_review)
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json(
        { success: false, error: "Architect authority required. Primary admin access only." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, status, rejectionReason, tier } = body;

    if (!userId || !status || !["approved", "rejected", "needs_review"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "userId and status (approved|rejected|needs_review) required" },
        { status: 400 }
      );
    }

    const targetKyc = await prisma.kycRecord.findUnique({
      where: { userId },
    });

    if (!targetKyc) {
      return NextResponse.json({ success: false, error: "KYC record not found" }, { status: 404 });
    }

    const updateData: unknown = {
      status,
      reviewedBy: user.ledgerId,
      reviewedAt: new Date(),
    };

    if (status === "rejected") {
      updateData.rejectionReason = rejectionReason || "Documentation insufficient";
      updateData.tier = "visitor";
    } else if (status === "approved") {
      updateData.rejectionReason = null;
      // Tier assignment: sovereign (default), verified, or whale
      updateData.tier = tier || "sovereign";
    } else {
      updateData.tier = "visitor";
    }

    const updated = await prisma.kycRecord.update({
      where: { userId },
      data: updateData,
    });

    // Sync User model
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycTier: updated.tier,
        kycStatus: updated.status,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        ledgerId: userId,
        type: "kyc_reviewed",
        title: `Identity Verification ${status.toUpperCase()}`,
        message:
          status === "approved"
            ? `You are now ${updated.tier.toUpperCase()}. Withdrawal limits unlocked.`
            : `Rejected: ${updateData.rejectionReason}. Resubmit required.`,
        actionUrl: "/kyc",
      },
    });

    return NextResponse.json({
      success: true,
      kyc: {
        userId: updated.userId,
        status: updated.status,
        tier: updated.tier,
        reviewedBy: updated.reviewedBy,
        reviewedAt: updated.reviewedAt,
      },
      message: `KYC ${status} for user ${userId}. Tier: ${updated.tier}.`,
    });
  } catch (error) {
    console.error("[KYC PATCH]", error);
    return NextResponse.json({ success: false, error: "KYC review failed" }, { status: 500 });
  }
}