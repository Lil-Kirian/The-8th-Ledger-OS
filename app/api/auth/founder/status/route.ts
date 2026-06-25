import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireFounder } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only founder can check founder status
    if (user.role !== "founder") {
      return NextResponse.json({ success: false, error: "Founder only" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      founder: {
        ledgerId: user.ledgerId,
        totpEnabled: user.founderTotpEnabled,
        pinSet: !!user.founderPinHash,
        webauthnEnrolled: !!user.webauthnCredentialId,
        geoEnrolled: !!(user.founderTrustedLat && user.founderTrustedLng),
        accessWindow: {
          start: user.founderAccessWindowStart ?? 8,
          end: user.founderAccessWindowEnd ?? 23,
        },
        lockedUntil: user.founderLockedUntil,
        accessCount: user.founderAccessCount,
        lastAccessAt: user.lastFounderAccessAt,
      },
    });
  } catch (error) {
    console.error("[FOUNDER STATUS]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}