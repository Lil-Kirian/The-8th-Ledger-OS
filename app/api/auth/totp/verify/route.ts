import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { authenticator } from 'otplib';
import prisma from '@/lib/prisma';

/* ============================================================
   PRIMARY ADMIN TOTP VERIFICATION + SESSION REFRESH
   8th Ledger Security Fortress — Architect Layer 1
   Re-issues JWT with fresh totpVerifiedAt, resetting the 15-min clock.
   ============================================================ */

export async function POST(req: Request) {
  try {
    /* ---- 1. Get current session from cookie ---- */
    const cookieHeader = req.headers.get('cookie') || '';
    const sessionCookie = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('ledger_session='));

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const token = sessionCookie.replace('ledger_session=', '');

    /* ---- 2. Verify existing JWT ---- */
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfig' }, { status: 500 });
    }

    const { jwtVerify } = await import('jose');
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { clockTolerance: 60 });

    const ledgerId = payload.ledgerId as string;
    if (!ledgerId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    /* ---- 3. Verify user is primary admin ---- */
    const user = await prisma.user.findUnique({
      where: { ledgerId },
      select: {
        id: true,
        ledgerId: true,
        role: true,
        isPrimaryAdmin: true,
        totpSecret: true,
        kycTier: true,
        hallIds: true,
        nameMatchVerified: true,
        deviceFingerprint: true,
        totpEnabled: true,
      },
    });

    if (!user || user.role !== 'admin' || !user.isPrimaryAdmin) {
      return NextResponse.json({ error: 'Architect authority required. Primary admin access only.' }, { status: 403 });
    }

    if (!user.totpSecret || !user.totpEnabled) {
      return NextResponse.json({ error: 'TOTP not configured' }, { status: 400 });
    }

    /* ---- 4. Verify TOTP code ---- */
    const { code } = await req.json();
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 401 });
    }

    /* ---- 5. Re-issue JWT with fresh totpVerifiedAt ---- */
    const now = Math.floor(Date.now() / 1000);
    const newToken = await new SignJWT({
      ledgerId: user.ledgerId,
      kycTier: user.kycTier || 'visitor',
      role: user.role,
      isPrimaryAdmin: true,
      hallIds: user.hallIds || [],
      nameMatchVerified: user.nameMatchVerified || false,
      deviceFingerprint: user.deviceFingerprint || undefined,
      totpEnabled: user.totpEnabled,
      totpVerifiedAt: now, // FRESH — resets the 15-minute clock
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(key);

    /* ---- 6. Response with new cookie ---- */
    const response = NextResponse.json({ success: true });
    response.cookies.set('ledger_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    console.error('[PRIMARY ADMIN TOTP VERIFY]', err);
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}