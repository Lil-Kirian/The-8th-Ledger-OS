import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";
import { sanitizeDisplayName, sanitizeEmail, sanitizeCountry } from "@/lib/sanitize";
import { createAuditEntry } from "@/lib/audit";
import { createTempToken } from "@/lib/totp";

/* ============================================================
   TYPES
   ============================================================ */
interface AuthResponse {
  success: boolean;
  ledgerId?: string;
  user?: {
    ledgerId: string;
    displayName: string;
    email: string;
    country: string;
    trustScore: number;
    tier: number;
    ledgerBalance: number;
    creditPool: number;
  };
  error?: string;
  message?: string;
  anomaly?: string;
  requiresTOTP?: boolean;
  tempToken?: string;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const MAX_SESSIONS_PER_USER = 5;
const SESSION_ROTATION_MS = 60 * 60 * 1000;
const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/* ============================================================
   PASSWORD STRENGTH VALIDATOR
   ============================================================ */
function isQuantumKeyStrong(password: string): { valid: boolean; error?: string } {
  if (password.length < 10) {
    return { valid: false, error: "Quantum Key must exceed 10 characters" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: "Quantum Key must contain at least 1 number" };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: "Quantum Key must contain at least 1 symbol" };
  }
  return { valid: true };
}

/* ============================================================
   CRYPTO / ID UTILS
   ============================================================ */
function generateLedgerId(): string {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LED-${seg()}-${seg()}`;
}

function generateToken(): string {
  return `ledtok_${crypto.randomBytes(16).toString("hex")}_${Date.now()}`;
}

/* ============================================================
   REQUEST METADATA EXTRACTORS
   ============================================================ */
function getClientIP(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const ri = request.headers.get("x-real-ip");
  if (ri) return ri;
  return (request as unknown).ip ?? "unknown";
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") ?? "unknown";
}

function getDeviceFingerprint(request: NextRequest): string {
  const raw = `${getClientIP(request)}:${getUserAgent(request)}:${request.headers.get("accept-language") ?? "en"}`;
  return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
}

/* ============================================================
   SESSION CAP & ROTATION
   ============================================================ */
async function enforceSessionCap(ledgerId: string) {
  const active = await prisma.session.findMany({
    where: {
      ledgerId,
      expiresAt: { gt: new Date() },
      isRevoked: false,
    },
    orderBy: { lastUsedAt: "asc" },
  });
  if (active.length >= MAX_SESSIONS_PER_USER) {
    const toKill = active.slice(0, active.length - MAX_SESSIONS_PER_USER + 1);
    await prisma.session.deleteMany({
      where: { token: { in: toKill.map((s) => s.token) } },
    });
  }
}

async function rotateSession(session: unknown, request: NextRequest): Promise<string> {
  const newToken = generateToken();
  const ip = getClientIP(request);
  const ua = getUserAgent(request);
  const fp = getDeviceFingerprint(request);

  await prisma.session.update({
    where: { token: session.token },
    data: {
      token: newToken,
      ipAddress: ip,
      userAgent: ua,
      deviceFingerprint: fp,
      lastUsedAt: new Date(),
      rotationCount: { increment: 1 },
    },
  });

  return newToken;
}

/* ============================================================
   ANOMALY DETECTION
   ============================================================ */
function detectAnomaly(session: unknown, request: NextRequest): string | null {
  const fp = getDeviceFingerprint(request);
  if (session.deviceFingerprint && session.deviceFingerprint !== fp) {
    return "DEVICE_MISMATCH";
  }
  const ip = getClientIP(request);
  if (session.ipAddress && session.ipAddress !== ip) {
    const prev = session.ipAddress.split(".")[0];
    const curr = ip.split(".")[0];
    if (prev && curr && prev !== curr) {
      return "IP_SUBNET_JUMP";
    }
  }
  return null;
}

/* ============================================================
   COOKIE SETTER
   ============================================================ */
function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set("ledger_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

/* ============================================================
   POST /api/auth — Access (login) or Initiate (register)
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { mode } = body;
    const clientIP = getClientIP(request);

    /* ===== ACCESS — Login ===== */
    if (mode === "access") {
      const { ledgerId, password } = body;
      if (!ledgerId || !password) {
        return NextResponse.json(
          { success: false, error: "Ledger ID and Quantum Key required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { ledgerId: ledgerId.toUpperCase() },
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        await createAuditEntry({
          type: "login_failed",
          description: `Failed login attempt for ${ledgerId.toUpperCase()} from IP ${clientIP}`,
          txHash: `FAIL-${ledgerId.toUpperCase()}-${Date.now()}`,
          ledgerId: ledgerId.toUpperCase(),
        });

        return NextResponse.json(
          { success: false, error: "Invalid Ledger ID or Quantum Key" },
          { status: 401 }
        );
      }

      // ===== TOTP GATE FOR PRIMARY ADMIN =====
      if (isPrimaryAdmin(user) && user.totpEnabled && user.totpSecret) {
        const tempToken = await createTempToken(user.ledgerId);

        return NextResponse.json({
          success: true,
          requiresTOTP: true,
          tempToken,
          message: "TOTP required. Complete 2FA.",
        });
      }

      // ===== STANDARD SESSION =====
      await enforceSessionCap(user.ledgerId);

      const token = generateToken();
      const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
      const fp = getDeviceFingerprint(request);

      await prisma.session.create({
        data: {
          token,
          ledgerId: user.ledgerId,
          expiresAt,
          ipAddress: clientIP,
          userAgent: getUserAgent(request),
          deviceFingerprint: fp,
          lastUsedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { ledgerId: user.ledgerId },
        data: { lastLoginAt: new Date(), lastLoginIP: clientIP },
      });

      await createAuditEntry({
        type: "login_success",
        description: `${user.displayName} authenticated from IP ${clientIP}`,
        txHash: `AUTH-${user.ledgerId}-${Date.now()}`,
        ledgerId: user.ledgerId,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          ledgerId: user.ledgerId,
          displayName: user.displayName,
          email: user.email,
          country: user.country,
          trustScore: user.trustScore,
          tier: user.tier,
          ledgerBalance: user.ledgerBalance,
          creditPool: user.creditPool,
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    /* ===== INITIATE — Register ===== */
    if (mode === "initiate") {
      const {
        displayName: rawDisplayName,
        email: rawEmail,
        country: rawCountry,
        password,
        confirmPassword,
        agreeTerms,
        agreePir,
        referralCode,
      } = body;

      const nameResult = sanitizeDisplayName(rawDisplayName);
      if (!nameResult.valid) {
        return NextResponse.json(
          { success: false, error: nameResult.error },
          { status: 400 }
        );
      }

      const emailResult = sanitizeEmail(rawEmail);
      if (!emailResult.valid) {
        return NextResponse.json(
          { success: false, error: emailResult.error },
          { status: 400 }
        );
      }

      const countryResult = sanitizeCountry(rawCountry);
      if (!countryResult.valid) {
        return NextResponse.json(
          { success: false, error: countryResult.error },
          { status: 400 }
        );
      }

      const displayName = nameResult.clean;
      const email = emailResult.clean;
      const country = countryResult.clean;

      if (!password) {
        return NextResponse.json(
          { success: false, error: "Quantum Key required" },
          { status: 400 }
        );
      }

      const strength = isQuantumKeyStrong(password);
      if (!strength.valid) {
        return NextResponse.json(
          { success: false, error: strength.error },
          { status: 400 }
        );
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: "Quantum Keys do not match" },
          { status: 400 }
        );
      }

      if (!agreeTerms || !agreePir) {
        return NextResponse.json(
          { success: false, error: "Protocol terms must be accepted" },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "Sovereign identity already exists with this email" },
          { status: 409 }
        );
      }

      const ledgerId = generateLedgerId();
      const passwordHash = await bcrypt.hash(password, 12);
      const fp = getDeviceFingerprint(request);

      const user = await prisma.user.create({
        data: {
          ledgerId,
          displayName,
          email,
          country,
          passwordHash,
          trustScore: 100,
          tier: 1,
          ledgerBalance: 0,
          creditPool: 0,
          forgesCompleted: 0,
          referrals: 0,
          referredBy: referralCode || null,
          lastLoginAt: new Date(),
          lastLoginIP: clientIP,
        },
      });

      await enforceSessionCap(user.ledgerId);

      const token = generateToken();
      const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);

      await prisma.session.create({
        data: {
          token,
          ledgerId: user.ledgerId,
          expiresAt,
          ipAddress: clientIP,
          userAgent: getUserAgent(request),
          deviceFingerprint: fp,
          lastUsedAt: new Date(),
        },
      });

      await createAuditEntry({
        type: "user_registered",
        description: `${displayName} initiated sovereign identity from IP ${clientIP}`,
        txHash: `INIT-${ledgerId}-${Date.now()}`,
        ledgerId,
      });

      const response = NextResponse.json({
        success: true,
        ledgerId: user.ledgerId,
        user: {
          ledgerId: user.ledgerId,
          displayName: user.displayName,
          email: user.email,
          country: user.country,
          trustScore: user.trustScore,
          tier: user.tier,
          ledgerBalance: user.ledgerBalance,
          creditPool: user.creditPool,
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid mode. Expected "access" or "initiate"' },
      { status: 400 }
    );
  } catch (error) {
    console.error("[AUTH POST]", error);
    return NextResponse.json(
      { success: false, error: "Protocol gate malfunction" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH /api/auth — Change Quantum Key
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;
    const clientIP = getClientIP(request);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { success: false, error: "Current Quantum Key, new Quantum Key, and confirmation required" },
        { status: 400 }
      );
    }

    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) {
      await createAuditEntry({
        type: "password_change_failed",
        description: `Failed password change for ${user.displayName} — incorrect current key from IP ${clientIP}`,
        txHash: `PWD-FAIL-${user.ledgerId}-${Date.now()}`,
        ledgerId: user.ledgerId,
      });

      return NextResponse.json(
        { success: false, error: "Current Quantum Key is incorrect" },
        { status: 401 }
      );
    }

    const strength = isQuantumKeyStrong(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: strength.error },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { success: false, error: "New Quantum Keys do not match" },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { success: false, error: "New Quantum Key must differ from current" },
        { status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    const newToken = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      await tx.session.updateMany({
        where: {
          ledgerId: user.ledgerId,
        },
        data: { isRevoked: true },
      });

      await tx.session.deleteMany({
        where: {
          ledgerId: user.ledgerId,
          isRevoked: true,
        },
      });

      await tx.session.create({
        data: {
          token: newToken,
          ledgerId: user.ledgerId,
          expiresAt,
          ipAddress: clientIP,
          userAgent: getUserAgent(request),
          deviceFingerprint: getDeviceFingerprint(request),
          lastUsedAt: new Date(),
          rotationCount: 0,
        },
      });
    });

    await createAuditEntry({
      type: "password_changed",
      description: `${user.displayName} rotated Quantum Key from IP ${clientIP}. All other sessions severed.`,
      txHash: `PWD-OK-${user.ledgerId}-${Date.now()}`,
      ledgerId: user.ledgerId,
    });

    const response = NextResponse.json({
      success: true,
      message: "Quantum Key rotated. All other sessions severed. Re-authenticate on other devices.",
    });

    setSessionCookie(response, newToken);
    return response;
  } catch (error) {
    console.error("[AUTH PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Quantum Key rotation failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET /api/auth — Session Verification
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: "No active session" },
        { status: 401 }
      );
      response.cookies.delete("ledger_session");
      return response;
    }

    const session = await prisma.session.findFirst({
      where: {
        ledgerId: user.ledgerId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: "desc" },
    });

    if (!session) {
      const response = NextResponse.json(
        { success: false, error: "Session expired. Re-authenticate." },
        { status: 401 }
      );
      response.cookies.delete("ledger_session");
      return response;
    }

    const anomaly = detectAnomaly(session, request);
    if (anomaly) {
      await prisma.session.update({
        where: { token: session.token },
        data: {
          anomalyFlags: JSON.stringify([
            ...(session.anomalyFlags ? JSON.parse(session.anomalyFlags) : []),
            { flag: anomaly, at: new Date().toISOString() },
          ]),
        },
      });
    }

    const idleTime = Date.now() - new Date(session.lastUsedAt).getTime();
    let activeToken = session.token;

    if (idleTime > SESSION_ROTATION_MS) {
      activeToken = await rotateSession(session, request);
    } else {
      await prisma.session.update({
        where: { token: session.token },
        data: {
          lastUsedAt: new Date(),
          ipAddress: getClientIP(request),
          userAgent: getUserAgent(request),
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        ledgerId: user.ledgerId,
        displayName: user.displayName,
        email: user.email,
        country: user.country,
        trustScore: user.trustScore,
        tier: user.tier,
        ledgerBalance: user.ledgerBalance,
        creditPool: user.creditPool,
      },
      ...(anomaly ? { anomaly: `Anomaly detected: ${anomaly}` } : {}),
    });

    if (activeToken !== session.token) {
      setSessionCookie(response, activeToken);
    }

    return response;
  } catch (error) {
    console.error("[AUTH GET]", error);
    return NextResponse.json(
      { success: false, error: "Session verification failed" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE /api/auth — Sever Connection (Logout)
   ============================================================ */
export async function DELETE(): Promise<NextResponse> {
  const user = await getSessionUser();

  if (user) {
    await prisma.session.deleteMany({
      where: { ledgerId: user.ledgerId },
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Connection severed",
  });

  response.cookies.delete("ledger_session");
  return response;
}