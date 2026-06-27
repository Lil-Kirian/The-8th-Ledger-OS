/* ============================================================
   8TH LEDGER AUTH SYSTEM — V3.2 SOVEREIGN PARLIAMENT
   Server utilities + Client wrappers + Hall/KYC guards
   ============================================================ */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, randomUUID } from "crypto";
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

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ledger_session")?.value;
  if (!token) return null;

  /* ── Fast path: JWT token (no DB hit) ── */
  if (token.includes(".")) {
    try {
      const claims = (await verifyToken(token)) as unknown as SessionClaims;
      const user = await prisma.user.findUnique({
        where: { ledgerId: claims.ledgerId },
        include: { kycRecord: true, wallet: true },
      });
      if (!user) return null;
      (user as any)._sessionClaims = claims;
      return user;
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

  return prisma.user.findUnique({
    where: { ledgerId: session.ledgerId },
    include: { kycRecord: true, wallet: true },
  });
}

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ledger_session")?.value;
  if (!token || !token.includes(".")) return null;

  try {
    const claims = (await verifyToken(token)) as unknown as SessionClaims;
    return claims;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: Request | any) {
  return getSessionUser();
}

/* ============================================================
   V3.2 SOVEREIGN GATES — DEFENSIVE (accepts string or object)
   ============================================================ */

export async function isPrimaryAdmin(
  ledgerId: string | { ledgerId?: string } | any,
): Promise<boolean> {
  const id = typeof ledgerId === "string" ? ledgerId : ledgerId?.ledgerId;
  if (!id || typeof id !== "string") return false;
  const user = await prisma.user.findUnique({
    where: { ledgerId: id },
    select: { role: true, isPrimaryAdmin: true },
  });
  return user?.role === "admin" && user?.isPrimaryAdmin === true;
}

export async function isAdmin(
  ledgerId: string | { ledgerId?: string } | any,
): Promise<boolean> {
  const id = typeof ledgerId === "string" ? ledgerId : ledgerId?.ledgerId;
  if (!id || typeof id !== "string") return false;
  const user = await prisma.user.findUnique({
    where: { ledgerId: id },
    select: { role: true },
  });
  return user?.role === "admin";
}

export async function isFounder(
  ledgerId: string | { ledgerId?: string } | any,
): Promise<boolean> {
  const id = typeof ledgerId === "string" ? ledgerId : ledgerId?.ledgerId;
  if (!id || typeof id !== "string") return false;
  const user = await prisma.user.findUnique({
    where: { ledgerId: id },
    select: { role: true },
  });
  return user?.role === "founder";
}

export function isPrimaryAdminSync(
  ledgerId: string,
  userRole?: string,
  isPrimaryAdmin?: boolean,
): boolean {
  if (userRole === "admin" && isPrimaryAdmin === true) return true;
  return false;
}

export function isAdminSync(userRole?: string): boolean {
  return userRole === "admin";
}

export function isFounderSync(userRole?: string): boolean {
  return userRole === "founder";
}

export async function requirePrimaryAdmin(
  ledgerId: string | { ledgerId?: string } | any,
): Promise<void> {
  const id = typeof ledgerId === "string" ? ledgerId : ledgerId?.ledgerId;
  if (!id || typeof id !== "string") {
    throw new Error("Architect authority required. Primary admin access only.");
  }
  const primary = await isPrimaryAdmin(id);
  if (!primary) {
    throw new Error("Architect authority required. Primary admin access only.");
  }
}

export async function requireAdmin(
  ledgerId: string | { ledgerId?: string } | any,
): Promise<void> {
  const id = typeof ledgerId === "string" ? ledgerId : ledgerId?.ledgerId;
  if (!id || typeof id !== "string") {
    throw new Error("Administrative authority required");
  }
  const admin = await isAdmin(id);
  if (!admin) {
    throw new Error("Administrative authority required");
  }
}

export async function requireFounder(
  ledgerId: string | { ledgerId?: string } | any,
): Promise<void> {
  const id = typeof ledgerId === "string" ? ledgerId : ledgerId?.ledgerId;
  if (!id || typeof id !== "string") {
    throw new Error("Founder authority required");
  }
  const founder = await isFounder(id);
  if (!founder) {
    throw new Error("Founder authority required");
  }
}

export async function requireAuth(): Promise<
  NonNullable<Awaited<ReturnType<typeof getSessionUser>>>
> {
  const user = await getSessionUser();
  if (!user) throw new Error("Authentication required");
  if (user.isBanned) throw new Error("Account suspended");
  return user;
}

export async function requireHallAccess(hallId: string, userId: string) {
  const ownership = await prisma.ownership.findFirst({
    where: { hallId, userId, status: { not: "forfeited" } },
  });
  if (!ownership)
    throw new Error(
      "Sovereign access denied. Commit to earn ownership in this Hall.",
    );
  return ownership;
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
  user: { kycTier?: string | null; tier?: string | null },
  minTier: string,
) {
  const tiers = ["visitor", "sovereign", "verified", "whale"];
  const userTier = user?.kycTier || user?.tier || "visitor";
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

async function post<T>(path: string, body: unknown): Promise<T> {
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

async function patch<T>(path: string, body: unknown): Promise<T> {
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
