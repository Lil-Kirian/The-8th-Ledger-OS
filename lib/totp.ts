import crypto from "crypto";

const TEMP_SECRET = Buffer.from(
  process.env.NEXTAUTH_SECRET || "8th-ledger-totp-fallback-key-change-in-prod"
);

/* ============================================================
   BASE32 HELPERS (RFC 4648)
   ============================================================ */
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(secret: string): Buffer {
  const bits: number[] = [];
  for (const char of secret.toUpperCase()) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;
    for (let i = 4; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    if (i + 8 > bits.length) break;
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

/* ============================================================
   TEMP TOKEN — Issued after correct password, before TOTP
   ============================================================ */
export async function createTempToken(ledgerId: string): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ ledgerId, step: "totp_pending", iat: now, exp: now + 300 })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", TEMP_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export async function verifyTempToken(token: string): Promise<{ ledgerId: string }> {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) throw new Error("Invalid token format");
  const sig = crypto.createHmac("sha256", TEMP_SECRET).update(`${header}.${payload}`).digest("base64url");
  if (sig !== signature) throw new Error("Invalid token signature");
  const body = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (body.step !== "totp_pending") throw new Error("Invalid token step");
  if (body.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return { ledgerId: body.ledgerId as string };
}

/* ============================================================
   TOTP SECRET & QR
   ============================================================ */
export function generateTOTPSecret(): string {
  const bytes = crypto.randomBytes(20);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_CHARS[bytes[i] % 32];
  }
  return secret;
}

export async function generateQRCode(
  secret: string,
  _ledgerId: string,
  email: string
): Promise<string> {
  const label = encodeURIComponent(email);
  const issuer = encodeURIComponent("8th Ledger");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTOTP(secret: string, code: string, window: number = 1): boolean {
  const key = base32Decode(secret);
  const timeStep = 30;
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / timeStep);

  for (let i = -window; i <= window; i++) {
    const c = Buffer.alloc(8);
    const v = counter + i;
    c.writeBigUInt64BE(BigInt(v));
    const hmac = crypto.createHmac("sha1", key).update(c).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const codeNum =
      ((hmac[offset] & 0x7f) << 24 |
        (hmac[offset + 1] & 0xff) << 16 |
        (hmac[offset + 2] & 0xff) << 8 |
        (hmac[offset + 3] & 0xff)) %
      1000000;
    if (codeNum.toString().padStart(6, "0") === code) return true;
  }
  return false;
}

/* ============================================================
   RECOVERY CODES — 10 single-use codes
   ============================================================ */
export function generateRecoveryCodes(): {
  plain: string[];
  hashedJson: string;
} {
  const plain = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
  const hashed = plain.map((c) =>
    crypto.pbkdf2Sync(c, TEMP_SECRET, 100000, 32, "sha256").toString("base64url")
  );
  return { plain, hashedJson: JSON.stringify(hashed) };
}

export function verifyRecoveryCode(
  hashedJson: string,
  plainCode: string
): { valid: boolean; updatedCodes?: string } {
  const hashes: string[] = JSON.parse(hashedJson);
  const target = crypto
    .pbkdf2Sync(plainCode, TEMP_SECRET, 100000, 32, "sha256")
    .toString("base64url");
  const index = hashes.findIndex((h) => h === target);
  if (index === -1) return { valid: false };
  const remaining = hashes.filter((_, i) => i !== index);
  return { valid: true, updatedCodes: JSON.stringify(remaining) };
}