import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

    // Generate recovery token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Store token in a new model or session field
    // For now, just log it (replace with email service in production)
    console.log(`[RECOVERY] User: ${user.ledgerId} | Token: ${token} | Expires: ${expiresAt}`);

    // TODO: Send email via Resend/SendGrid/AWS SES
    // await sendRecoveryEmail(user.email, user.ledgerId, token);

    return NextResponse.json({
      success: true,
      message: "Recovery instructions transmitted.",
    });
  } catch (error) {
    console.error("[RECOVER]", error);
    return NextResponse.json(
      { error: "Recovery protocol malfunctioned" },
      { status: 500 }
    );
  }
}