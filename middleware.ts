// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ============================================================
   8TH LEDGER MIDDLEWARE — REDIRECTS DISABLED FOR DEVELOPMENT
   ============================================================ */

const PUBLIC_PATHS = [
  "/",
  "/enter",
  "/create",
  "/recover",
  "/terms",
  "/privacy",
  "/about",
  "/audit",
  "/agora",
  "/agora/suggestions",
  "/agora/archives",
  "/agora/relay",
  "/agora/map",
  "/agora/pulse",
];

const VISITOR_PATHS = [
  "/dashboard",
  "/me",
  "/settings",
  "/kyc",
  "/pools",
  "/verticals",
  "/wallet",
  "/vault",
  "/exchange",
  "/forge",
  "/knot",
  "/leaderboards",
  "/oracle",
  "/contracts",
  "/sri",
  "/ahgi",
  "/valuation",
];

const SOVEREIGN_PATHS = ["/halls", "/dividends", "/marketplace"];
const VERIFIED_PATHS: string[] = [];
const WHALE_PATHS: string[] = [];

const PRIMARY_ADMIN_PAGE_PATHS = ["/architect"];
const PRIMARY_ADMIN_SECRET_PATHS = ["/ledger", "/sovereign"];
const PRIMARY_ADMIN_VERIFY_PATH = "/architect/verify";

const ADMIN_PAGE_PATHS = ["/admin"];
const ADMIN_VERIFY_PATH = "/admin/verify";

const API_KYC_GATED = [
  "/api/halls/",
  "/api/kyc/verify",
  "/api/wallet/withdraw",
  "/api/marketplace/orders",
  "/api/dividends",
  "/api/treasury",
  "/api/forge/",
  "/api/sri/",
  "/api/ahgi/",
  "/api/valuation/",
  "/api/closure/",
  "/api/dormancy/",
];

const API_ADMIN_GATED = ["/api/admin/"];
const API_AUTH_GATED = [
  "/api/oracle",
  "/api/positions",
  "/api/notifications",
  "/api/reports",
  "/api/reviews",
  "/api/activity",
  "/api/user",
  "/api/knot",
  "/api/invite",
  "/api/consensus",
  "/api/dashboard",
  "/api/upload",
  "/api/pools/",
  "/api/meridian/",
  "/api/agora/",
];

const WITHDRAWAL_PATHS = ["/api/wallet/withdraw"];

const TIERS = ["visitor", "sovereign", "verified", "whale"] as const;
type Tier = (typeof TIERS)[number];

function tierIndex(tier: string): number {
  return TIERS.indexOf(tier as Tier);
}

function tierMeetsRequired(userTier: string, requiredTier: string): boolean {
  return tierIndex(userTier) >= tierIndex(requiredTier);
}

type SessionClaims = {
  ledgerId: string;
  kycTier: Tier;
  role: "user" | "admin";
  isPrimaryAdmin: boolean;
  hallIds: string[];
  nameMatchVerified: boolean;
  deviceFingerprint?: string;
  totpEnabled?: boolean;
  totpVerifiedAt?: number;
  adminTotpVerifiedAt?: number;
  adminPinVerifiedAt?: number;
  primaryAdminTotpVerifiedAt?: number;
  primaryAdminPinVerifiedAt?: number;
  webauthnVerifiedAt?: number;
  primaryAdminAccessWindowStart?: number;
  primaryAdminAccessWindowEnd?: number;
  primaryAdminLockedUntil?: number;
  primaryAdminTrustedLat?: number;
  primaryAdminTrustedLng?: number;
  primaryAdminGeoRadiusKm?: number;
  iat: number;
  exp: number;
  legacy?: false;
};

type LegacySession = {
  ledgerId: string;
  legacy: true;
};

async function verifySession(
  req: NextRequest
): Promise<(SessionClaims & { legacy?: false }) | LegacySession | null> {
  const token = req.cookies.get("ledger_session")?.value;
  if (!token) return null;

  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return null;
    if (token.includes(".")) {
      const { jwtVerify } = await import("jose");
      const key = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(token, key, {
        clockTolerance: 60,
        maxTokenAge: "7d",
      });
      return {
        ledgerId: payload.ledgerId as string,
        kycTier: (payload.kycTier as Tier) || "visitor",
        role: (payload.role as "user" | "admin") || "user",
        isPrimaryAdmin: (payload.isPrimaryAdmin as boolean) || false,
        hallIds: (payload.hallIds as string[]) || [],
        nameMatchVerified: (payload.nameMatchVerified as boolean) || false,
        deviceFingerprint: payload.deviceFingerprint as string | undefined,
        totpEnabled: (payload.totpEnabled as boolean) || false,
        totpVerifiedAt: (payload.totpVerifiedAt as number) || undefined,
        adminTotpVerifiedAt: (payload.adminTotpVerifiedAt as number) || undefined,
        adminPinVerifiedAt: (payload.adminPinVerifiedAt as number) || undefined,
        primaryAdminTotpVerifiedAt: (payload.primaryAdminTotpVerifiedAt as number) || undefined,
        primaryAdminPinVerifiedAt: (payload.primaryAdminPinVerifiedAt as number) || undefined,
        webauthnVerifiedAt: (payload.webauthnVerifiedAt as number) || undefined,
        primaryAdminAccessWindowStart: (payload.primaryAdminAccessWindowStart as number) || undefined,
        primaryAdminAccessWindowEnd: (payload.primaryAdminAccessWindowEnd as number) || undefined,
        primaryAdminLockedUntil: (payload.primaryAdminLockedUntil as number) || undefined,
        primaryAdminTrustedLat: (payload.primaryAdminTrustedLat as number) || undefined,
        primaryAdminTrustedLng: (payload.primaryAdminTrustedLng as number) || undefined,
        primaryAdminGeoRadiusKm: (payload.primaryAdminGeoRadiusKm as number) || undefined,
        iat: payload.iat as number,
        exp: payload.exp as number,
      };
    }
  } catch {
    // JWT failed
  }

  if (token.startsWith("ledtok_")) {
    return { ledgerId: token, legacy: true };
  }

  return null;
}

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const ri = req.headers.get("x-real-ip");
  if (ri) return ri;
  return "unknown";
}

function validateDeviceFingerprint(req: NextRequest, claims: SessionClaims): boolean {
  if (!claims.deviceFingerprint) return true;
  const headerFp = req.headers.get("x-device-fingerprint");
  if (!headerFp) return true;
  return headerFp === claims.deviceFingerprint;
}

function strictDeviceFingerprint(req: NextRequest, claims: SessionClaims): boolean {
  if (!claims.deviceFingerprint) return false;
  const headerFp = req.headers.get("x-device-fingerprint");
  if (!headerFp) return true;
  return headerFp === claims.deviceFingerprint;
}

function isFresh(timestamp: number | undefined, maxAgeMinutes: number): boolean {
  if (!timestamp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now - timestamp < maxAgeMinutes * 60;
}

function isWithinWindow(start: number | undefined, end: number | undefined): boolean {
  const startHour = start ?? 8;
  const endHour = end ?? 23;
  const currentHour = new Date().getUTCHours();
  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  }
  return currentHour >= startHour || currentHour < endHour;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function checkRateLimit(clientIp: string, pathname: string, method: string) {
  try {
    const { authRateLimit, commitRateLimit, exchangeRateLimit } = await import("@/lib/rate-limit");
    if ((pathname === "/api/pools" && method === "PATCH") || (pathname.startsWith("/api/pools/") && pathname.endsWith("/commit") && method === "POST")) {
      return await commitRateLimit(clientIp);
    }
    if (pathname === "/api/exchange/orders" && ["POST", "DELETE"].includes(method)) {
      return await exchangeRateLimit(clientIp);
    }
    if (["POST", "PATCH", "PUT", "DELETE"].includes(method) && pathname.startsWith("/api/")) {
      return await authRateLimit(clientIp);
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/* REDIRECT HELPERS — DISABLED FOR DEVELOPMENT
function redirectToLogin(req: NextRequest, target: string) {
  const url = new URL("/enter", req.url);
  url.searchParams.set("redirect", target);
  return NextResponse.redirect(url);
}

function redirectToKyc(req: NextRequest) {
  const url = new URL("/kyc", req.url);
  url.searchParams.set("reason", "tier_required");
  return NextResponse.redirect(url);
}

function redirectToPrimaryAdminVerify(req: NextRequest, returnUrl: string) {
  const url = new URL("/architect/verify", req.url);
  url.searchParams.set("redirect", returnUrl);
  return NextResponse.redirect(url);
}

function redirectToAdminVerify(req: NextRequest, returnUrl: string) {
  const url = new URL("/admin/verify", req.url);
  url.searchParams.set("redirect", returnUrl);
  return NextResponse.redirect(url);
}
*/

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const fullPath = pathname + search;
  const response = NextResponse.next();

  /* ===== 0. STATIC BYPASS ===== */
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|css|js|json)$/.test(pathname);
  if (isStatic) return response;

  /* ===== 1. SECURITY HEADERS ===== */
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
    );
  }

  /* ===== 2. PUBLIC BYPASS ===== */
  if (PUBLIC_PATHS.some((p) => pathname === p)) return response;

  /* ===== 3. CSRF ===== */
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method) && !pathname.startsWith("/api/webhooks")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host") || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (origin) {
      try {
        const allowedHosts = [host];
        if (appUrl) allowedHosts.push(new URL(appUrl).host);
        const originHost = new URL(origin).host;
        if (!allowedHosts.includes(originHost)) {
          return jsonError("Invalid origin. CSRF protection triggered.", 403);
        }
      } catch {
        return jsonError("Invalid origin format.", 403);
      }
    }
  }

  /* ===== 4. RATE LIMIT ===== */
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(clientIp, pathname, method);
  if (!rateLimit.allowed) {
    return jsonError("Rate limit exceeded. Please slow down.", 429, { retryAfter: rateLimit.retryAfter || 60 });
  }

  /* ===== 5. SESSION ===== */
  const session = await verifySession(request);

  /* ===== 6. AUTH API — DISABLED REDIRECT, PASS THROUGH ===== */
  const isAuthApi = API_AUTH_GATED.some((p) => pathname.startsWith(p));
  if (isAuthApi && !session) {
    // DEV: allow through without auth
    response.headers.set("x-dev-auth-bypass", "true");
  }

  /* ===== 7. KYC API — DISABLED BLOCK, PASS THROUGH ===== */
  const isKycApi = API_KYC_GATED.some((p) => pathname.startsWith(p));
  if (isKycApi && session) {
    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-kyc-check", "true");
    } else {
      const claims = session as SessionClaims;
      if (!tierMeetsRequired(claims.kycTier, "sovereign")) {
        // DEV: bypass KYC gate
        response.headers.set("x-dev-kyc-bypass", "true");
      }
    }
  }

  /* ===== 8. WITHDRAWAL — DISABLED BLOCK, PASS THROUGH ===== */
  const isWithdrawal = WITHDRAWAL_PATHS.some((p) => pathname.startsWith(p));
  if (isWithdrawal && session) {
    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-withdrawal-hardening", "true");
    } else {
      const claims = session as SessionClaims;
      if (!tierMeetsRequired(claims.kycTier, "sovereign")) {
        response.headers.set("x-dev-withdrawal-bypass", "true");
      }
      if (!claims.nameMatchVerified) {
        response.headers.set("x-dev-name-bypass", "true");
      }
      if (!validateDeviceFingerprint(request, claims)) {
        response.headers.set("x-dev-device-bypass", "true");
      }
    }
  }

  /* ===== 9. ADMIN API — DISABLED BLOCK, PASS THROUGH ===== */
  const isAdminApi = API_ADMIN_GATED.some((p) => pathname.startsWith(p));
  if (isAdminApi && session) {
    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-admin-check", "true");
    } else {
      const claims = session as SessionClaims;
      if (claims.role !== "admin") {
        response.headers.set("x-dev-admin-bypass", "true");
      }
    }
  }

  /* ===== 10. HALL GATING — DISABLED REDIRECT ===== */
  const hallPageMatch = pathname.match(/^\/halls\/([^\/]+)/);
  const hallApiMatch = pathname.match(/^\/api\/halls\/([^\/]+)/);
  if (hallPageMatch && session) {
    const hallId = hallPageMatch[1];
    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-hall-ownership", hallId);
    } else {
      const claims = session as SessionClaims;
      if (!claims.hallIds.includes(hallId) && claims.role !== "admin") {
        response.headers.set("x-dev-hall-bypass", hallId);
      }
    }
  }
  if (hallApiMatch && session) {
    const hallId = hallApiMatch[1];
    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-hall-ownership", hallId);
    } else {
      const claims = session as SessionClaims;
      if (!claims.hallIds.includes(hallId) && claims.role !== "admin") {
        response.headers.set("x-dev-hall-api-bypass", hallId);
      }
    }
  }

  /* ===== 11. TIER PATHS — DISABLED ALL REDIRECTS ===== */
  const isVisitorPath = VISITOR_PATHS.some((p) => pathname.startsWith(p));
  if (isVisitorPath && !session) {
    response.headers.set("x-dev-visitor-bypass", "true");
  }

  const isSovereignPath = SOVEREIGN_PATHS.some((p) => pathname.startsWith(p));
  if (isSovereignPath && session) {
    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-tier-check", "sovereign");
    } else {
      const claims = session as SessionClaims;
      if (!tierMeetsRequired(claims.kycTier, "sovereign")) {
        response.headers.set("x-dev-tier-bypass", "true");
      }
    }
  } else if (isSovereignPath && !session) {
    response.headers.set("x-dev-sovereign-bypass", "true");
  }

  /* ===== 12. SUB-ADMIN FORTRESS — DISABLED ALL REDIRECTS ===== */
  const isAdminPage = ADMIN_PAGE_PATHS.some((p) => pathname.startsWith(p));
  const isAdminVerify = pathname === ADMIN_VERIFY_PATH;

  if (isAdminPage || isAdminVerify) {
    if (!session) {
      response.headers.set("x-dev-admin-session-bypass", "true");
    }

    if (isAdminVerify) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }

    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-admin-check", "true");
    } else {
      const claims = session as SessionClaims;
      if (claims.role !== "admin") {
        response.headers.set("x-dev-admin-role-bypass", "true");
      }
      if (!isFresh(claims.adminTotpVerifiedAt, 120)) {
        response.headers.set("x-dev-totp-bypass", "true");
      }
      if (!isFresh(claims.adminPinVerifiedAt, 120)) {
        response.headers.set("x-dev-pin-bypass", "true");
      }
      if (!validateDeviceFingerprint(request, claims)) {
        response.headers.set("x-dev-device-bypass", "true");
      }
    }

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Admin-Access-Time", new Date().toISOString());
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  /* ===== 13. PRIMARY ADMIN FORTRESS — DISABLED ALL REDIRECTS ===== */
  const isPrimaryAdminPage = PRIMARY_ADMIN_PAGE_PATHS.some((p) => pathname.startsWith(p));
  const isSecretPrimaryAdmin = PRIMARY_ADMIN_SECRET_PATHS.some((p) => pathname.startsWith(p));
  const isPrimaryAdminVerify = pathname === PRIMARY_ADMIN_VERIFY_PATH;

  if (isPrimaryAdminPage || isSecretPrimaryAdmin || isPrimaryAdminVerify) {
    if (!session) {
      response.headers.set("x-dev-architect-session-bypass", "true");
    }

    if (isPrimaryAdminVerify) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }

    if ("legacy" in session && session.legacy) {
      response.headers.set("x-require-primary-admin-check", "true");
    } else {
      const claims = session as SessionClaims;

      // Gate 1: Role
      if (claims.role !== "admin" || !claims.isPrimaryAdmin) {
        response.headers.set("x-dev-architect-role-bypass", "true");
      }

      // Gate 2: Lockout
      if (claims.primaryAdminLockedUntil && Date.now() / 1000 < claims.primaryAdminLockedUntil) {
        response.headers.set("x-dev-architect-lock-bypass", "true");
      }

      // Gate 3: Time window
      if (!isWithinWindow(claims.primaryAdminAccessWindowStart, claims.primaryAdminAccessWindowEnd)) {
        response.headers.set("x-dev-architect-time-bypass", "true");
      }

      // Gate 4: Strict device fingerprint
      if (!strictDeviceFingerprint(request, claims)) {
        response.headers.set("x-dev-architect-device-bypass", "true");
      }

      // Gate 5: TOTP freshness
      if (!isFresh(claims.primaryAdminTotpVerifiedAt, 15)) {
        response.headers.set("x-dev-architect-totp-bypass", "true");
      }

      // Gate 6: PIN freshness
      if (!isFresh(claims.primaryAdminPinVerifiedAt, 15)) {
        response.headers.set("x-dev-architect-pin-bypass", "true");
      }

      // Gate 7: Hardware key freshness
      if (!isFresh(claims.webauthnVerifiedAt, 15)) {
        response.headers.set("x-dev-architect-webauthn-bypass", "true");
      }

      // Gate 8: Geographic anomaly
      const geoLat = request.headers.get("x-geo-lat");
      const geoLng = request.headers.get("x-geo-lng");
      if (geoLat && geoLng && claims.primaryAdminTrustedLat != null && claims.primaryAdminTrustedLng != null) {
        const distance = getDistanceKm(
          claims.primaryAdminTrustedLat,
          claims.primaryAdminTrustedLng,
          parseFloat(geoLat),
          parseFloat(geoLng)
        );
        const radius = claims.primaryAdminGeoRadiusKm || 50;
        if (distance > radius) {
          response.headers.set("x-dev-architect-geo-bypass", "true");
        }
      }
    }

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Admin-Access-Time", new Date().toISOString());
    response.headers.set("X-Architect-Override", "true");
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  /* ===== 14. SESSION HEADERS ===== */
  if (session) {
    response.headers.set("x-ledger-id", session.ledgerId);
    if (!("legacy" in session)) {
      const claims = session as SessionClaims;
      response.headers.set("x-kyc-tier", claims.kycTier);
      response.headers.set("x-user-role", claims.role);
      response.headers.set("x-name-match-verified", String(claims.nameMatchVerified));
      response.headers.set("x-primary-admin", String(claims.isPrimaryAdmin));
    }
  }

  /* ===== 15. AUDIT CACHE ===== */
  if (pathname.startsWith("/api/audit") || pathname === "/audit") {
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|css|js|json|xml|txt)$).*)",
  ],
};
