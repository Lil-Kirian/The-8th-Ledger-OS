import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, getSessionUser } from "@/lib/auth";
import { getSessionSecret } from "@/lib/env";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

/* ============================================================
   OPTIONAL IMPORTS — Graceful fallback if modules missing
   ============================================================ */
let authenticator: any = null;
let QRCode: any = null;

try {
  const otplib = require("otplib");
  authenticator = otplib.authenticator;
} catch {
  console.warn("[AUTH] otplib not installed — TOTP disabled");
}

try {
  QRCode = require("qrcode");
} catch {
  console.warn("[AUTH] qrcode not installed — QR generation disabled");
}

/* ============================================================
   SANITIZE FALLBACK
   ============================================================ */
function sanitizeDisplayName(raw: string) {
  const clean = raw?.trim().slice(0, 50).replace(/[<>]/g, "") || "";
  if (clean.length < 2)
    return { valid: false, error: "Display name: 2–50 characters", clean: "" };
  return { valid: true, clean };
}

function sanitizeEmail(raw: string) {
  const clean = raw?.trim().toLowerCase().slice(0, 255) || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))
    return { valid: false, error: "Valid email required", clean: "" };
  return { valid: true, clean };
}

function sanitizeCountry(raw: string) {
  const clean = raw?.trim().slice(0, 100) || "";
  if (clean.length < 2)
    return { valid: false, error: "Country required", clean: "" };
  return { valid: true, clean };
}

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
    identityScore: number;
    kycStatus: string;
    kycTier?: string | null;
    legalName?: string | null;
    role: string;
    isPrimaryAdmin: boolean;
  };
  error?: string;
  message?: string;
  anomaly?: string;
  totp?: { secret?: string; qrCode?: string; enabled?: boolean };
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const MAX_SESSIONS_PER_USER = 5;
const SESSION_ROTATION_MS = 60 * 60 * 1000;
const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/* ============================================================
   JWT CONFIG
   ============================================================ */
function getJwtKey() {
  return new TextEncoder().encode(getSessionSecret());
}

async function generateJWT(claims: {
  ledgerId: string;
  kycTier: string;
  role: string;
  isPrimaryAdmin: boolean;
  hallIds: string[];
  nameMatchVerified: boolean;
  deviceFingerprint: string;
}): Promise<string> {
  return new SignJWT({
    ledgerId: claims.ledgerId,
    kycTier: claims.kycTier,
    role: claims.role,
    isPrimaryAdmin: claims.isPrimaryAdmin,
    hallIds: claims.hallIds,
    nameMatchVerified: claims.nameMatchVerified,
    deviceFingerprint: claims.deviceFingerprint,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtKey());
}

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      clockTolerance: 60,
      maxTokenAge: "7d",
    });
    return payload;
  } catch {
    return null;
  }
}

/* ============================================================
   PASSWORD STRENGTH VALIDATOR
   ============================================================ */
function isQuantumKeyStrong(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 10)
    return { valid: false, error: "Quantum Key must exceed 10 characters" };
  if (!/\d/.test(password))
    return {
      valid: false,
      error: "Quantum Key must contain at least 1 number",
    };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return {
      valid: false,
      error: "Quantum Key must contain at least 1 symbol",
    };
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
  return (request as any).ip ?? "unknown";
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") ?? "unknown";
}

function getDeviceFingerprint(request: NextRequest): string {
  const raw = `${getClientIP(request)}:${getUserAgent(request)}:${request.headers.get("accept-language") ?? "en"}`;
  return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
}

/* ============================================================
   SESSION HELPERS
   ============================================================ */
async function getUserHallIds(userId: string): Promise<string[]> {
  const ownerships = await prisma.ownership.findMany({
    where: { userId },
    select: { hallId: true },
  });
  return ownerships.map((o) => o.hallId).filter((id): id is string => !!id);
}

async function checkNameMatch(userId: string): Promise<boolean> {
  const [user, kyc] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { legalName: true },
    }),
    prisma.kycRecord.findUnique({
      where: { userId },
      select: { legalName: true },
    }),
  ]);
  if (!user?.legalName || !kyc?.legalName) return false;
  return user.legalName.trim() === kyc.legalName.trim();
}

async function buildJWTClaims(
  user: {
    id: string;
    ledgerId: string;
    kycTier: string | null;
    role: string;
    isPrimaryAdmin: boolean;
    legalName: string | null;
  },
  request: NextRequest,
) {
  const [hallIds, nameMatchVerified] = await Promise.all([
    getUserHallIds(user.id),
    checkNameMatch(user.id),
  ]);
  return {
    ledgerId: user.ledgerId,
    kycTier: user.kycTier || "visitor",
    role: user.role,
    isPrimaryAdmin: user.isPrimaryAdmin,
    hallIds,
    nameMatchVerified,
    deviceFingerprint: getDeviceFingerprint(request),
  };
}

async function enforceSessionCap(ledgerId: string) {
  const active = await prisma.session.findMany({
    where: { ledgerId, expiresAt: { gt: new Date() }, isRevoked: false },
    orderBy: { lastUsedAt: "asc" },
  });
  if (active.length >= MAX_SESSIONS_PER_USER) {
    const toKill = active.slice(0, active.length - MAX_SESSIONS_PER_USER + 1);
    await prisma.session.deleteMany({
      where: { token: { in: toKill.map((s) => s.token) } },
    });
  }
}

/* ============================================================
   ANOMALY DETECTION
   ============================================================ */
function detectAnomaly(session: any, request: NextRequest): string | null {
  const fp = getDeviceFingerprint(request);
  if (session.deviceFingerprint && session.deviceFingerprint !== fp)
    return "DEVICE_MISMATCH";
  const ip = getClientIP(request);
  if (session.ipAddress && session.ipAddress !== ip) {
    const prev = session.ipAddress.split(".")[0];
    const curr = ip.split(".")[0];
    if (prev && curr && prev !== curr) return "IP_SUBNET_JUMP";
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
          { status: 400 },
        );
      }

      const user = await prisma.user.findUnique({
        where: { ledgerId: ledgerId.toUpperCase() },
      });

      if (!user) {
        try {
          await prisma.auditEntry.create({
            data: {
              type: "login_failed",
              description: `Failed login attempt for ${ledgerId.toUpperCase()} from IP ${clientIP}`,
              txHash: `FAIL-${ledgerId.toUpperCase()}-${Date.now()}`,
            },
          });
        } catch (auditErr) {
          console.error("[AUDIT SKIP]", auditErr);
        }

        return NextResponse.json(
          { success: false, error: "Invalid Ledger ID or Quantum Key" },
          { status: 401 },
        );
      }

      const validPassword = await verifyPassword(password, user.passwordHash);
      if (!validPassword) {
        try {
          await prisma.auditEntry.create({
            data: {
              type: "login_failed",
              ledgerId: user.ledgerId,
              description: `Failed login attempt for ${ledgerId.toUpperCase()} from IP ${clientIP}`,
              txHash: `FAIL-${ledgerId.toUpperCase()}-${Date.now()}`,
            },
          });
        } catch (auditErr) {
          console.error("[AUDIT SKIP]", auditErr);
        }

        return NextResponse.json(
          { success: false, error: "Invalid Ledger ID or Quantum Key" },
          { status: 401 },
        );
      }

      await enforceSessionCap(user.ledgerId);
      const fp = getDeviceFingerprint(request);
      const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
      const jwtClaims = await buildJWTClaims(user, request);
      const jwtToken = await generateJWT(jwtClaims);

      await prisma.session.create({
        data: {
          token: jwtToken,
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
        data: {
          lastLoginAt: new Date(),
          lastLoginIP: clientIP,
          lastActivityAt: new Date(),
          deviceFingerprint: fp,
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "login_success",
          ledgerId: user.ledgerId,
          description: `${user.displayName} authenticated from IP ${clientIP}`,
          txHash: `AUTH-${user.ledgerId}-${Date.now()}`,
        },
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
          identityScore: user.identityScore,
          kycStatus: user.kycStatus,
          kycTier: user.kycTier,
          legalName: user.legalName,
          role: user.role,
          isPrimaryAdmin: user.isPrimaryAdmin,
        },
      });

      setSessionCookie(response, jwtToken);
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
        legalName,
      } = body;

      const nameResult = sanitizeDisplayName(rawDisplayName);
      if (!nameResult.valid)
        return NextResponse.json(
          { success: false, error: nameResult.error },
          { status: 400 },
        );

      const emailResult = sanitizeEmail(rawEmail);
      if (!emailResult.valid)
        return NextResponse.json(
          { success: false, error: emailResult.error },
          { status: 400 },
        );

      const countryResult = sanitizeCountry(rawCountry);
      if (!countryResult.valid)
        return NextResponse.json(
          { success: false, error: countryResult.error },
          { status: 400 },
        );

      const displayName = nameResult.clean;
      const email = emailResult.clean;
      const country = countryResult.clean;

      if (!password)
        return NextResponse.json(
          { success: false, error: "Quantum Key required" },
          { status: 400 },
        );

      const strength = isQuantumKeyStrong(password);
      if (!strength.valid)
        return NextResponse.json(
          { success: false, error: strength.error },
          { status: 400 },
        );

      if (password !== confirmPassword)
        return NextResponse.json(
          { success: false, error: "Quantum Keys do not match" },
          { status: 400 },
        );
      if (!agreeTerms || !agreePir)
        return NextResponse.json(
          { success: false, error: "Protocol terms must be accepted" },
          { status: 400 },
        );

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return NextResponse.json(
          {
            success: false,
            error: "Sovereign identity already exists with this email",
          },
          { status: 409 },
        );

      const ledgerId = generateLedgerId();
      const passwordHash = await hashPassword(password);
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
          lastActivityAt: new Date(),
          identityScore: 0,
          kycStatus: "unverified",
          kycTier: "visitor",
          legalName: legalName || displayName,
          deviceFingerprint: fp,
        },
      });

      await prisma.wallet.create({
        data: {
          ledgerId: user.ledgerId,
          balance: 0,
          lockedBalance: 0,
          currency: "USD",
        },
      });

      await enforceSessionCap(user.ledgerId);
      const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
      const jwtClaims = await buildJWTClaims(user, request);
      const jwtToken = await generateJWT(jwtClaims);

      await prisma.session.create({
        data: {
          token: jwtToken,
          ledgerId: user.ledgerId,
          expiresAt,
          ipAddress: clientIP,
          userAgent: getUserAgent(request),
          deviceFingerprint: fp,
          lastUsedAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "user_registered",
          ledgerId,
          description: `${displayName} initiated sovereign identity from IP ${clientIP}`,
          txHash: `INIT-${ledgerId}-${Date.now()}`,
        },
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
          identityScore: user.identityScore,
          kycStatus: user.kycStatus,
          kycTier: user.kycTier,
          legalName: user.legalName,
          role: user.role,
          isPrimaryAdmin: user.isPrimaryAdmin,
        },
      });

      setSessionCookie(response, jwtToken);
      return response;
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid mode. Expected "access" or "initiate"',
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[AUTH POST]", error);
    return NextResponse.json(
      { success: false, error: "Protocol gate malfunction" },
      { status: 500 },
    );
  }
}

/* ============================================================
   PUT /api/auth — TOTP Setup
   ============================================================ */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    if (!authenticator)
      return NextResponse.json(
        { success: false, error: "TOTP module not available. Install otplib." },
        { status: 503 },
      );

    const user = await getSessionUser();
    if (!user)
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 },
      );

    const body = await request.json();
    const { action, totpCode } = body;

    if (action === "setup") {
      if (user.totpEnabled)
        return NextResponse.json(
          { success: false, error: "TOTP already enabled. Disable first." },
          { status: 400 },
        );
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(
        user.email,
        "8th Ledger Protocol",
        secret,
      );
      const qrCode = QRCode ? await QRCode.toDataURL(otpauthUrl) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpSecret: secret,
          totpEnabled: false,
          totpVerified: false,
          lastActivityAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        totp: { secret, qrCode, enabled: false },
        message:
          "Scan QR code with your authenticator app, then verify with a 6-digit code.",
      });
    }

    if (action === "verify") {
      if (!user.totpSecret)
        return NextResponse.json(
          { success: false, error: "Setup TOTP first (action: 'setup')" },
          { status: 400 },
        );
      if (!totpCode || totpCode.length !== 6)
        return NextResponse.json(
          { success: false, error: "6-digit TOTP code required" },
          { status: 400 },
        );

      const isValid = authenticator.verify({
        token: totpCode,
        secret: user.totpSecret,
      });
      if (!isValid)
        return NextResponse.json(
          { success: false, error: "Invalid TOTP code" },
          { status: 400 },
        );

      const recoveryCodes = Array.from({ length: 8 }, () =>
        crypto.randomBytes(4).toString("hex").toUpperCase(),
      ).join("-");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: true,
          totpVerified: true,
          recoveryCodes,
          lastActivityAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "totp_enabled",
          ledgerId: user.ledgerId,
          description: `TOTP enabled for ${user.displayName}`,
          txHash: `TOTP-${user.ledgerId}-${Date.now()}`,
        },
      });

      return NextResponse.json({
        success: true,
        totp: { enabled: true, recoveryCodes: recoveryCodes.split("-") },
        message:
          "TOTP enabled. Save your recovery codes — they cannot be shown again.",
      });
    }

    if (action === "disable") {
      const { password } = body;
      if (!password)
        return NextResponse.json(
          { success: false, error: "Password required to disable TOTP" },
          { status: 400 },
        );
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid)
        return NextResponse.json(
          { success: false, error: "Incorrect password" },
          { status: 401 },
        );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpSecret: null,
          totpEnabled: false,
          totpVerified: false,
          recoveryCodes: null,
          lastActivityAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          type: "totp_disabled",
          ledgerId: user.ledgerId,
          description: `TOTP disabled for ${user.displayName}`,
          txHash: `TOTP-DISABLE-${user.ledgerId}-${Date.now()}`,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "TOTP disabled. Your account now uses password-only authentication.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Expected: setup | verify | disable",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[AUTH PUT]", error);
    return NextResponse.json(
      { success: false, error: "TOTP operation failed" },
      { status: 500 },
    );
  }
}

/* ============================================================
   PATCH /api/auth — Change Quantum Key
   ============================================================ */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user)
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 },
      );

    const body = await request.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;
    const clientIP = getClientIP(request);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Current Quantum Key, new Quantum Key, and confirmation required",
        },
        { status: 400 },
      );
    }

    const validCurrent = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!validCurrent) {
      await prisma.auditEntry.create({
        data: {
          type: "password_change_failed",
          ledgerId: user.ledgerId,
          description: `Failed password change for ${user.displayName} — incorrect current key from IP ${clientIP}`,
          txHash: `PWD-FAIL-${user.ledgerId}-${Date.now()}`,
        },
      });
      return NextResponse.json(
        { success: false, error: "Current Quantum Key is incorrect" },
        { status: 401 },
      );
    }

    const strength = isQuantumKeyStrong(newPassword);
    if (!strength.valid)
      return NextResponse.json(
        { success: false, error: strength.error },
        { status: 400 },
      );
    if (newPassword !== confirmNewPassword)
      return NextResponse.json(
        { success: false, error: "New Quantum Keys do not match" },
        { status: 400 },
      );
    if (newPassword === currentPassword)
      return NextResponse.json(
        { success: false, error: "New Quantum Key must differ from current" },
        { status: 400 },
      );

    const newPasswordHash = await hashPassword(newPassword);
    const fp = getDeviceFingerprint(request);
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash, lastActivityAt: new Date() },
      });
      await tx.session.updateMany({
        where: { ledgerId: user.ledgerId },
        data: { isRevoked: true },
      });
      await tx.session.deleteMany({
        where: { ledgerId: user.ledgerId, isRevoked: true },
      });

      const jwtClaims = await buildJWTClaims(user, request);
      const jwtToken = await generateJWT(jwtClaims);

      await tx.session.create({
        data: {
          token: jwtToken,
          ledgerId: user.ledgerId,
          expiresAt,
          ipAddress: clientIP,
          userAgent: getUserAgent(request),
          deviceFingerprint: fp,
          lastUsedAt: new Date(),
          rotationCount: 0,
        },
      });
    });

    await prisma.auditEntry.create({
      data: {
        type: "password_changed",
        ledgerId: user.ledgerId,
        description: `${user.displayName} rotated Quantum Key from IP ${clientIP}. All other sessions severed.`,
        txHash: `PWD-OK-${user.ledgerId}-${Date.now()}`,
      },
    });

    const jwtClaims = await buildJWTClaims(user, request);
    const jwtToken = await generateJWT(jwtClaims);

    const response = NextResponse.json({
      success: true,
      message:
        "Quantum Key rotated. All other sessions severed. Re-authenticate on other devices.",
    });

    setSessionCookie(response, jwtToken);
    return response;
  } catch (error) {
    console.error("[AUTH PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Quantum Key rotation failed" },
      { status: 500 },
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
        { success: false, error: "Session expired. Re-authenticate." },
        { status: 401 },
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
        { status: 401 },
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
      const jwtClaims = await buildJWTClaims(user, request);
      activeToken = await generateJWT(jwtClaims);
      await prisma.session.update({
        where: { token: session.token },
        data: {
          token: activeToken,
          ipAddress: getClientIP(request),
          userAgent: getUserAgent(request),
          deviceFingerprint: getDeviceFingerprint(request),
          lastUsedAt: new Date(),
          rotationCount: { increment: 1 },
        },
      });
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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
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
        identityScore: user.identityScore,
        kycStatus: user.kycStatus,
        kycTier: user.kycTier,
        legalName: user.legalName,
        role: user.role,
        isPrimaryAdmin: user.isPrimaryAdmin,
      },
      ...(anomaly ? { anomaly: `Anomaly detected: ${anomaly}` } : {}),
    });

    if (activeToken !== session.token) setSessionCookie(response, activeToken);
    return response;
  } catch (error) {
    console.error("[AUTH GET]", error);
    return NextResponse.json(
      { success: false, error: "Session verification failed" },
      { status: 500 },
    );
  }
}

/* ============================================================
   DELETE /api/auth — Sever Connection (Logout)
   ============================================================ */
export async function DELETE(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (user) {
    await prisma.session.deleteMany({ where: { ledgerId: user.ledgerId } });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    });
  }
  const response = NextResponse.json({
    success: true,
    message: "Connection severed",
  });
  response.cookies.delete("ledger_session");
  return response;
}
