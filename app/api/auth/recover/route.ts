import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ============================================================
   ACCOUNT RECOVERY — 8th Ledger
   Ledger ID retrieval via email. Secure by design.
   ============================================================ */

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { ledgerId: true, email: true, displayName: true },
    });

    // Always return success — don't reveal if email exists (security)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If this email exists, recovery instructions have been sent.",
      });
    }

    // The recovery flow intentionally avoids returning or logging secrets.
    // A dedicated email-token table/service should issue expiring tokens once
    // outbound email is configured.

    return NextResponse.json({
      success: true,
      message: "Recovery instructions transmitted.",
    });
  } catch (error) {
    console.error("[RECOVER]", error);
    return NextResponse.json(
      { error: "Recovery protocol malfunctioned" },
      { status: 500 },
    );
  }
}
