/* ============================================================
   8TH LEDGER AUTH SYSTEM — V3.2 SOVEREIGN PARLIAMENT
   Server utilities + Client wrappers + Hall/KYC guards
   ============================================================ */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getSessionSecret } from "./env";

/* ============================================================
   TYPES
   ============================================================ */
export interface AuthUser {
  ledgerId: string;
  displayName: string;
  email: string;
  country: string;
  trustScore: number;
  tier: number;
  ledgerBalance: number;
  creditPool: number;
  forgesCompleted: number;
  referrals: number;
  role?: string;
  kycTier?: string | null;
  kycStatus?: string | null;
  identityScore?: number;
  legalName?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar?: string | null;
  beneficiaryName?: string | null;
  beneficiaryEmail?: string | null;
  totalCommitted?: number;
  reportsSubmitted?: number;
  lastLoginAt?: string | Date | null;
  createdAt?: string | Date | null;
  totpEnabled?: boolean;
  recoveryCodes?: unknown;
  livenessVerified?: boolean;
  addressProofUrl?: string | null;
}

export interface AuthResponse {
  success: boolean;
  ledgerId?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
}

export interface InitiatePayload {
  displayName: string;
  email: string;
  country: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
  agreeTerms: boolean;
  agreePir: boolean;
}

export interface AccessPayload {
  ledgerId: string;
  password: string;
  rememberDevice?: boolean;
}

export interface SessionClaims {
  ledgerId: string;
  kycTier: string;
  role: string;
  isPrimaryAdmin: boolean;
  hallIds: string[];
  nameMatchVerified: boolean;
  deviceFingerprint?: string;
  iat: number;
  exp: number;
}

export const ADMIN_ROLES = ["architech", "scribe", "warden", "admin", "founder"] as const;
export const PRIMARY_ADMIN_ROLES = ["architech", "admin", "founder"] as const;

export function isAdminRole(role?: string | null): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isPrimaryAdminRole(role?: string | null): boolean {
  return !!role && (PRIMARY_ADMIN_ROLES as readonly string[]).includes(role);
}

/* ============================================================
   SERVER UTILITIES — JWT & PASSWORD
   Safe for API routes only.
   ============================================================ */

function getJwtKey() {
  return new TextEncoder().encode(getSessionSecret());
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: object): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtKey());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtKey(), {
    clockTolerance: 60,
  });
  return payload;
}

/* ============================================================
   V3.2 CENTRALIZED SESSION LOOKUP
   Use this in EVERY API route instead of inline copy-paste.
   ============================================================ */

export async function getSessionUser(_req?: Request | unknown) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ledger_session")?.value;
  if (!token) return null;

  /* ── Fast path: JWT token (no DB hit) ── */
  if (token.includes(".")) {
    try {
      const claims = (await verifyToken(token)) as any as SessionClaims;
      const user = await prisma.user.findUnique({
        where: { ledgerId: claims.ledgerId },
        include: { kycRecord: true, wallet: true },
      });
      if (!user) return null;
      return withSessionCompatibility(user, claims);
    } catch {
      // JWT invalid — fall through to legacy DB lookup
    }
  }

  /* ── Legacy path: DB session lookup ── */
  const session = await prisma.session.findUnique({
    where: { token },
    select: { ledgerId: true, expiresAt: true, isRevoked: true },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date())
    return null;

  const user = await prisma.user.findUnique({
    where: { ledgerId: session.ledgerId },
    include: { kycRecord: true, wallet: true },
  });
  return user ? withSessionCompatibility(user) : null;
}

function withSessionCompatibility<
  T extends {
    id: string;
    kycRecord?: { status?: string | null; tier?: string | null } | null;
  },
>(
  user: T,
  claims?: Partial<SessionClaims>,
): T & {
  _sessionClaims?: Partial<SessionClaims>;
  hallIds: string[];
  nameMatchVerified: boolean;
  userId: string;
} {
  return Object.assign(user, {
    _sessionClaims: claims,
    hallIds: claims?.hallIds ?? [],
    nameMatchVerified:
      claims?.nameMatchVerified ?? user.kycRecord?.status === "approved",
    userId: user.id,
  });
}

export async function getSessionClaims(
  _req?: Request | unknown,
): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ledger_session")?.value;
  if (!token || !token.includes(".")) return null;

  try {
    const claims = (await verifyToken(token)) as any as SessionClaims;
    return claims;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: Request | unknown) {
  return getSessionUser();
}

/* ============================================================
   V3.2 SOVEREIGN GATES — DEFENSIVE (accepts string or object)
   ============================================================ */

function resolveLedgerId(
  input: string | { ledgerId?: string } | unknown,
): string | null {
  if (typeof input === "string") return input;
  if (input && typeof input === "object" && "ledgerId" in input) {
    const value = (input as { ledgerId?: unknown }).ledgerId;
    return typeof value === "string" ? value : null;
  }
  return null;
}

export async function isPrimaryAdmin(
  ledgerId: string | { ledgerId?: string } | unknown,
): Promise<boolean> {
  const id = resolveLedgerId(ledgerId);
  if (!id || typeof id !== "string") return false;
  const user = await prisma.user.findUnique({
    where: { ledgerId: id },
    select: { role: true, isPrimaryAdmin: true },
  });
  return isPrimaryAdminRole(user?.role) && user?.isPrimaryAdmin === true;
}

export async function isAdmin(
  ledgerId: string | { ledgerId?: string } | unknown,
): Promise<boolean> {
  const id = resolveLedgerId(ledgerId);
  if (!id || typeof id !== "string") return false;
  const user = await prisma.user.findUnique({
    where: { ledgerId: id },
    select: { role: true },
  });
  return isAdminRole(user?.role);
}

export async function isFounder(
  ledgerId: string | { ledgerId?: string } | unknown,
): Promise<boolean> {
  const id = resolveLedgerId(ledgerId);
  if (!id || typeof id !== "string") return false;
  const user = await prisma.user.findUnique({
    where: { ledgerId: id },
    select: { role: true },
  });
  return isPrimaryAdminRole(user?.role);
}

export function isPrimaryAdminSync(
  ledgerId:
    | string
    | { role?: string; isPrimaryAdmin?: boolean }
    | null
    | undefined,
  userRole?: string,
  isPrimaryAdmin?: boolean,
): boolean {
  if (ledgerId && typeof ledgerId === "object") {
    return isPrimaryAdminRole(ledgerId.role) && ledgerId.isPrimaryAdmin === true;
  }
  if (isPrimaryAdminRole(userRole) && isPrimaryAdmin === true) return true;
  return false;
}

export function isAdminSync(
  userRole?: string | { role?: string } | null,
): boolean {
  const role = typeof userRole === "object" ? userRole?.role : userRole;
  return isAdminRole(role);
}

export function isFounderSync(
  userRole?: string | { role?: string } | null,
): boolean {
  const role = typeof userRole === "object" ? userRole?.role : userRole;
  return isPrimaryAdminRole(role);
}

export async function requirePrimaryAdmin(
  ledgerId: string | { ledgerId?: string } | unknown,
): Promise<void> {
  const id = resolveLedgerId(ledgerId);
  if (!id || typeof id !== "string") {
    throw new Error("Architect authority required. Primary admin access only.");
  }
  const primary = await isPrimaryAdmin(id);
  if (!primary) {
    throw new Error("Architect authority required. Primary admin access only.");
  }
}

type AdminCheckResult = {
  success: boolean;
  ledgerId?: string;
  userId?: string;
  role?: string;
  error?: string;
};

export async function requireAdmin(
  ledgerId: string | { ledgerId?: string },
): Promise<void>;
export async function requireAdmin(req: Request): Promise<AdminCheckResult>;
export async function requireAdmin(
  input: string | { ledgerId?: string } | Request,
): Promise<void | AdminCheckResult> {
  const user =
    typeof input === "object" && input !== null && !("ledgerId" in input)
      ? await getSessionUser(input)
      : null;

  if (user) {
    const allowed = isAdminRole(user.role);
    return allowed
      ? {
          success: true,
          ledgerId: user.ledgerId,
          userId: user.id,
          role: user.role,
        }
      : { success: false, error: "Administrative authority required" };
  }

  const id = resolveLedgerId(input);
  if (!id || !(await isAdmin(id))) {
    throw new Error("Administrative authority required");
  }
}

export async function requireFounder(
  ledgerId: string | { ledgerId?: string } | unknown,
): Promise<void> {
  const id = resolveLedgerId(ledgerId);
  if (!id || typeof id !== "string") {
    throw new Error("Founder authority required");
  }
  const founder = await isFounder(id);
  if (!founder) {
    throw new Error("Founder authority required");
  }
}

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
export type AuthenticatedSessionUser = SessionUser & {
  success: true;
  userId: string;
  hallIds: string[];
  nameMatchVerified: boolean;
  kycTier: string | null;
};

export async function requireAuth(
  _req?: Request | unknown,
): Promise<AuthenticatedSessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Authentication required");
  if (user.isBanned) throw new Error("Account suspended");
  const claims = (
    user as unknown as { _sessionClaims?: Partial<SessionClaims> }
  )._sessionClaims;
  return Object.assign(user, {
    success: true as const,
    userId: user.id,
    hallIds: claims?.hallIds ?? [],
    nameMatchVerified:
      claims?.nameMatchVerified ?? user.kycRecord?.status === "approved",
    kycTier: user.kycRecord?.tier ?? null,
  });
}

export async function requireHallAccess(
  hallId: string,
  userId: string,
): Promise<NonNullable<Awaited<ReturnType<typeof prisma.ownership.findFirst>>>>;
export async function requireHallAccess(
  _req: Request,
  hallId: string,
): Promise<{
  success: boolean;
  ownership?: NonNullable<
    Awaited<ReturnType<typeof prisma.ownership.findFirst>>
  >;
  error?: string;
}>;
export async function requireHallAccess(
  first: string | Request,
  second: string,
): Promise<
  | NonNullable<Awaited<ReturnType<typeof prisma.ownership.findFirst>>>
  | {
      success: boolean;
      ownership?: NonNullable<
        Awaited<ReturnType<typeof prisma.ownership.findFirst>>
      >;
      error?: string;
    }
> {
  if (typeof first === "string") {
    const ownership = await prisma.ownership.findFirst({
      where: { hallId: first, userId: second, status: { not: "forfeited" } },
    });
    if (!ownership) {
      throw new Error(
        "Sovereign access denied. Commit to earn ownership in this Hall.",
      );
    }
    return ownership;
  }

  const user = await getSessionUser(first);
  if (!user) return { success: false, error: "Authentication required" };
  if (isAdminRole(user.role)) {
    return { success: true };
  }
  const ownership = await prisma.ownership.findFirst({
    where: { hallId: second, userId: user.id, status: { not: "forfeited" } },
  });
  return ownership
    ? { success: true, ownership }
    : {
        success: false,
        error:
          "Sovereign access denied. Commit to earn ownership in this Hall.",
      };
}

export async function requireManagerRole(hallId: string, userId: string) {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, role: "manager", status: "active" },
  });
  if (!ownership) throw new Error("Manager role required.");
  return ownership;
}

export async function requireLiaisonRole(hallId: string, userId: string) {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, role: "liaison", status: "active" },
  });
  if (!ownership) throw new Error("Liaison role required.");
  return ownership;
}

export function requireKycTier(
  user: { kycTier?: string | null; tier?: string | number | null },
  minTier: string,
) {
  const tiers = ["visitor", "sovereign", "verified", "whale"];
  const userTier = String(user?.kycTier || user?.tier || "visitor");
  const userTierIndex = tiers.indexOf(userTier);
  const minTierIndex = tiers.indexOf(minTier);
  if (userTierIndex < minTierIndex) {
    throw new Error(
      `Sovereign Identity Verification required. Minimum tier: ${minTier}. Current: ${userTier}.`,
    );
  }
  return true;
}

/* ============================================================
   V3.2 OWNERSHIP & ROLE VERIFICATION
   ============================================================ */

export async function verifyOwnership(
  userId: string,
  poolId?: string,
  hallId?: string,
): Promise<boolean> {
  if (hallId) {
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId, status: { not: "forfeited" } },
    });
    return !!ownership;
  }

  if (poolId) {
    const hall = await prisma.hall.findFirst({
      where: { poolId },
      include: {
        ownerships: {
          where: { userId, status: { not: "forfeited" } },
        },
      },
    });
    return !!hall && hall.ownerships.length > 0;
  }

  return false;
}

export async function getUserHallRole(
  hallId: string,
  userId: string,
): Promise<string | null> {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: "active" },
    select: { role: true },
  });
  return ownership?.role || null;
}

export function generatePacToken(): string {
  return `PAC-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}

/* ============================================================
   QUANTUM MERIT CONSENSUS
   (Legacy — kept for backward compatibility with Oracle system)
   ============================================================ */

export interface ConsensusCandidate {
  ledgerId: string;
  trustScore: number;
  tier: number;
  commitment: number;
  joinedAt: Date;
  referrals: number;
}

export interface ConsensusResult {
  winner: ConsensusCandidate;
  seed: string;
  meritScores: Array<{ ledgerId: string; merit: number; probability: string }>;
}

export function quantumMeritConsensus(
  candidates: ConsensusCandidate[],
  poolClosesAt: Date,
): ConsensusResult {
  const now = new Date();

  const scored = candidates.map((c) => {
    const hoursInPool = Math.max(
      0,
      (now.getTime() - new Date(c.joinedAt).getTime()) / 36e5,
    );
    const timeWeight = Math.min(hoursInPool / 24, 1) * 0.1;
    const tierMultiplier = c.tier * c.tier;
    const trustFactor = c.trustScore / 100;
    const commitmentFactor = Math.log10(c.commitment + 1) / 5;
    const referralBonus = c.referrals * 0.02;

    const merit =
      trustFactor *
      tierMultiplier *
      (1 + commitmentFactor) *
      (1 + timeWeight + referralBonus);

    return { candidate: c, merit };
  });

  const totalMerit = scored.reduce((sum, s) => sum + s.merit, 0);
  const seed = `qmc-${poolClosesAt.toISOString()}-${totalMerit.toFixed(8)}-${Date.now()}`;

  let seedNum = Array.from(seed).reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) | 0;
  }, 0);

  const seededRandom = () => {
    const x = Math.sin(seedNum++) * 10000;
    return x - Math.floor(x);
  };

  let roll = seededRandom() * totalMerit;
  let winner = scored[0];

  for (const entry of scored) {
    roll -= entry.merit;
    if (roll <= 0) {
      winner = entry;
      break;
    }
  }

  const meritScores = scored.map((s) => ({
    ledgerId: s.candidate.ledgerId,
    merit: s.merit,
    probability: ((s.merit / totalMerit) * 100).toFixed(4) + "%",
  }));

  return { winner: winner.candidate, seed, meritScores };
}

/* ============================================================
   PIR ALLOCATION — Protocol Infrastructure Reserve
   ============================================================ */

export interface PirAllocationResult {
  poolId: string;
  totalCommitted: number;
  assetValue: number;
  pirAmount: number;
  pillars: {
    shield: number;
    seal: number;
    forge: number;
    spire: number;
    vanguard: number;
    sanctuary: number;
  };
  perUserReturns: Array<{
    ledgerId: string;
    commitment: number;
    returned: number;
  }>;
}

export function calculatePirAllocation(
  poolId: string,
  totalCommitted: number,
  assetValue: number,
  commitments: Array<{ ledgerId: string; amount: number }>,
): PirAllocationResult {
  const pirAmount = totalCommitted - assetValue;

  const pillars = {
    shield: Math.floor(pirAmount * 0.25),
    seal: Math.floor(pirAmount * 0.2),
    forge: Math.floor(pirAmount * 0.2),
    spire: Math.floor(pirAmount * 0.15),
    vanguard: Math.floor(pirAmount * 0.12),
    sanctuary: Math.floor(pirAmount * 0.08),
  };

  const perUserReturns = commitments.map((c) => ({
    ledgerId: c.ledgerId,
    commitment: c.amount,
    returned: Math.floor(c.amount * 0.5),
  }));

  return {
    poolId,
    totalCommitted,
    assetValue,
    pirAmount,
    pillars,
    perUserReturns,
  };
}

/* ============================================================
   CLIENT API WRAPPERS
   Safe for browser only.
   ============================================================ */

const API_BASE = "";

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    credentials: "include",
  });
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

/* === Auth === */
export async function initiateIdentity(
  payload: InitiatePayload,
): Promise<AuthResponse> {
  return post<AuthResponse>("/api/auth", { mode: "initiate", ...payload });
}

export async function accessIdentity(
  payload: AccessPayload,
): Promise<AuthResponse> {
  return post<AuthResponse>("/api/auth", { mode: "access", ...payload });
}

export async function getSession(): Promise<AuthResponse> {
  return get<AuthResponse>("/api/auth");
}

export async function severConnection(): Promise<AuthResponse> {
  return del<AuthResponse>("/api/auth");
}

/* === V3.2 KYC Client Wrappers === */
export async function getKycStatus() {
  return get<{ success: boolean; kyc?: any; error?: string }>("/api/kyc");
}

export async function submitKycStep(step: string, data: any) {
  return post<{ success: boolean; kyc?: any; error?: string }>("/api/kyc", {
    step,
    ...data,
  });
}

/* === V3.2 Hall Client Wrappers === */
export async function getHall(hallId: string) {
  return get<{ success: boolean; hall?: any; error?: string }>(
    `/api/halls/${hallId}`,
  );
}

export async function sendHallMessage(
  hallId: string,
  content: string,
  type = "text",
  isEphemeral = false,
) {
  return post<{ success: boolean; message?: any; error?: string }>(
    `/api/halls/${hallId}/messages`,
    {
      content,
      type,
      isEphemeral,
    },
  );
}

export async function createProposal(hallId: string, proposal: any) {
  return post<{ success: boolean; proposal?: any; error?: string }>(
    `/api/halls/${hallId}/proposals`,
    proposal,
  );
}

export async function voteOnProposal(
  hallId: string,
  proposalId: string,
  choice: "yes" | "no",
) {
  return post<{ success: boolean; vote?: any; error?: string }>(
    `/api/halls/${hallId}/proposals/${proposalId}/vote`,
    { choice },
  );
}

export async function getHallMarketplace(hallId: string) {
  return get<{ success: boolean; items?: any[]; error?: string }>(
    `/api/halls/${hallId}/marketplace`,
  );
}

export async function createMarketplaceOrder(
  hallId: string,
  itemId: string,
  quantity: number,
  refCode?: string,
) {
  return post<{ success: boolean; order?: any; error?: string }>(
    `/api/halls/${hallId}/marketplace/orders`,
    {
      itemId,
      quantity,
      refCode,
    },
  );
}

export async function generateShareLink(itemId: string, platform?: string) {
  return post<{ success: boolean; share?: any; error?: string }>(
    "/api/marketplace/share",
    { itemId, platform },
  );
}

/* === V3.2 Withdrawal Client Wrapper === */
export async function requestWithdrawal(
  amount: number,
  destination: string,
  destinationType = "bank",
  totpCode?: string,
) {
  return post<{ success: boolean; withdrawal?: any; error?: string }>(
    "/api/wallet/withdraw",
    {
      amount,
      destination,
      destinationType,
      totpCode,
    },
  );
}

/* ============================================================
   LOCAL FALLBACK — For SSR safety & demo mode
   ============================================================ */

const STORAGE_KEY = "ledger_identity";

export function storeIdentityLocally(
  user: AuthUser & { ledgerId: string },
): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

export function getLocalIdentity(): (AuthUser & { ledgerId: string }) | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearLocalIdentity(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* ============================================================
   GUARD — Redirect if no session
   ============================================================ */

export async function requireAuthClient(router: {
  push: (path: string) => void;
}): Promise<AuthUser | null> {
  const res = await getSession();
  if (!res.success) {
    router.push("/enter");
    return null;
  }
  return res.user || null;
}
