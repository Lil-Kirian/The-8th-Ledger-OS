// lib/admin-token.ts

/* ============================================================
   ADMIN TOKEN — HMAC-SHA256 signed payload
   Format: base64url(payload).base64url(signature)
   NOT a JWT — custom compact token for admin elevation
   ============================================================ */

interface AdminTokenPayload {
  ledgerId: string;
  isAdmin: true;
  isPrimaryAdmin: boolean;
  exp: number;
}

function encodeBase64Url(input: string): string {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(input: string): string {
  const pad = input.length % 4;
  if (pad) {
    input += "=".repeat(4 - pad);
  }
  return atob(input.replace(/-/g, "+").replace(/_/g, "/"));
}

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SECRET must be set and at least 32 characters");
  }
  return secret;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createAdminToken(ledgerId: string, isPrimaryAdmin: boolean = false): Promise<string> {
  const secret = getAdminSecret();
  const payload: AdminTokenPayload = {
    ledgerId,
    isAdmin: true,
    isPrimaryAdmin,
    exp: Date.now() + 1000 * 60 * 60 * 24,
  };

  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const encoder = new TextEncoder();
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = encodeBase64Url(
    String.fromCharCode(...new Uint8Array(sig))
  );

  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  const secret = getAdminSecret();
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const encoder = new TextEncoder();
  const key = await importHmacKey(secret);

  let sigBytes: Uint8Array;
  try {
    sigBytes = Uint8Array.from(
      decodeBase64Url(sigB64),
      (c) => c.charCodeAt(0)
    );
  } catch {
    return null;
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(payloadB64)
  );
  if (!valid) return null;

  try {
    const raw: unknown = JSON.parse(decodeBase64Url(payloadB64));
    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as Record<string, unknown>).ledgerId !== "string" ||
      (raw as Record<string, unknown>).isAdmin !== true ||
      typeof (raw as Record<string, unknown>).isPrimaryAdmin !== "boolean" ||
      typeof (raw as Record<string, unknown>).exp !== "number"
    ) {
      return null;
    }
    const payload = raw as AdminTokenPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}