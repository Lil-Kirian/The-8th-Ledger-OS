/* ============================================================
   8TH LEDGER — INPUT SANITIZATION
   Strip HTML, normalize whitespace, enforce length limits.
   Apply to: displayName, description, review.text, propertyName, etc.
   ============================================================ */

// HTML tag stripper — removes <script>, <img onerror=...>, etc.
const HTML_TAG_PATTERN = /<[^>]*>/g;
// Event handler patterns: onerror, onclick, onload, etc.
const EVENT_HANDLER_PATTERN = /on\w+\s*=/gi;
// Javascript protocol: javascript:, data:text/html, etc.
const DANGEROUS_PROTOCOL_PATTERN = /(javascript|data|vbscript):/gi;
// Control characters and null bytes
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

interface SanitizeOptions {
  maxLength?: number;
  minLength?: number;
  allowNewlines?: boolean;
}

/* ============================================================
   CORE SANITIZER
   ============================================================ */
export function sanitizeText(
  input: string | null | undefined,
  options: SanitizeOptions = {}
): { clean: string; valid: boolean; error?: string } {
  if (input === null || input === undefined) {
    return { clean: "", valid: false, error: "Input required" };
  }

  let clean = String(input);

  // Strip control characters
  clean = clean.replace(CONTROL_CHAR_PATTERN, "");

  // Strip HTML tags entirely
  clean = clean.replace(HTML_TAG_PATTERN, "");

  // Strip event handlers (onerror=, onclick=, etc.)
  clean = clean.replace(EVENT_HANDLER_PATTERN, "");

  // Strip dangerous protocols
  clean = clean.replace(DANGEROUS_PROTOCOL_PATTERN, "");

  // Normalize whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  // Optional: collapse newlines if not allowed
  if (!options.allowNewlines) {
    clean = clean.replace(/\n/g, " ");
  }

  // Length checks
  if (options.minLength !== undefined && clean.length < options.minLength) {
    return {
      clean,
      valid: false,
      error: `Minimum ${options.minLength} characters required`,
    };
  }

  if (options.maxLength !== undefined && clean.length > options.maxLength) {
    clean = clean.substring(0, options.maxLength).trim();
  }

  return { clean, valid: true };
}

/* ============================================================
   FIELD-SPECIFIC WRAPPERS
   ============================================================ */

/** displayName: 2–40 chars, no HTML */
export function sanitizeDisplayName(input: string): { clean: string; valid: boolean; error?: string } {
  return sanitizeText(input, { minLength: 2, maxLength: 40 });
}

/** Email: lowercase, trim, basic validation */
export function sanitizeEmail(input: string): { clean: string; valid: boolean; error?: string } {
  const clean = String(input).toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return { clean, valid: false, error: "Invalid email format" };
  }
  return { clean, valid: true };
}

/** Pool / property name: 3–100 chars */
export function sanitizePropertyName(input: string): { clean: string; valid: boolean; error?: string } {
  return sanitizeText(input, { minLength: 3, maxLength: 100 });
}

/** Description: 10–2000 chars, allow newlines */
export function sanitizeDescription(input: string): { clean: string; valid: boolean; error?: string } {
  return sanitizeText(input, { minLength: 10, maxLength: 2000, allowNewlines: true });
}

/** Review text: 10–2000 chars, allow newlines */
export function sanitizeReviewText(input: string): { clean: string; valid: boolean; error?: string } {
  return sanitizeText(input, { minLength: 10, maxLength: 2000, allowNewlines: true });
}

/** Country: 2–60 chars */
export function sanitizeCountry(input: string): { clean: string; valid: boolean; error?: string } {
  return sanitizeText(input, { minLength: 2, maxLength: 60 });
}

/** Password: only checks for dangerous patterns, NOT length (auth route handles that) */
export function sanitizePassword(input: string): { clean: string; valid: boolean; error?: string } {
  const clean = String(input).replace(CONTROL_CHAR_PATTERN, "");
  // Reject if password contains HTML (someone trying to inject)
  if (HTML_TAG_PATTERN.test(clean)) {
    return { clean, valid: false, error: "Password contains invalid characters" };
  }
  return { clean, valid: true };
}

/** Generic ID / code: alphanumeric + dash + underscore only */
export function sanitizeId(input: string): { clean: string; valid: boolean; error?: string } {
  const clean = String(input).trim();
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (!idRegex.test(clean)) {
    return { clean, valid: false, error: "Invalid ID format" };
  }
  return { clean, valid: true };
}

/** Ledger ID: LED- prefix format */
export function sanitizeLedgerId(input: string): { clean: string; valid: boolean; error?: string } {
  const clean = String(input).trim().toUpperCase();
  const ledgerIdRegex = /^LED-[A-Z0-9]{4,}-[A-Z0-9]{3,}$/;
  if (!ledgerIdRegex.test(clean)) {
    return { clean, valid: false, error: "Invalid Ledger ID format" };
  }
  return { clean, valid: true };
}

/** PAC Token: PAC- prefix format */
export function sanitizePacToken(input: string): { clean: string; valid: boolean; error?: string } {
  const clean = String(input).trim().toUpperCase();
  const pacRegex = /^PAC-[A-Z0-9-]+$/;
  if (!pacRegex.test(clean)) {
    return { clean, valid: false, error: "Invalid PAC token format" };
  }
  return { clean, valid: true };
}

/** Worker Number: W- prefix format */
export function sanitizeWorkerNumber(input: string): { clean: string; valid: boolean; error?: string } {
  const clean = String(input).trim().toUpperCase();
  const workerRegex = /^W-[A-Z0-9-]+$/;
  if (!workerRegex.test(clean)) {
    return { clean, valid: false, error: "Invalid Worker Number format" };
  }
  return { clean, valid: true };
}

/** Proposal title: 5–200 chars */
export function sanitizeProposalTitle(input: string): { clean: string; valid: boolean; error?: string } {
  return sanitizeText(input, { minLength: 5, maxLength: 200 });
}

/** Sovereign Stream post content: 10–5000 chars, allow newlines */
export function sanitizeStreamContent(input: string): { clean: string; valid: boolean; error?: string } {
  return sanitizeText(input, { minLength: 10, maxLength: 5000, allowNewlines: true });
}

/* ============================================================
   BATCH SANITIZER — For request body objects
   ============================================================ */
export function sanitizeBody<T extends Record<string, unknown>>(
  body: T,
  schema: Record<string, (val: string) => { clean: string; valid: boolean; error?: string }>
): { data: Partial<T>; valid: boolean; errors: Record<string, string> } {
  const data: Partial<T> = {};
  const errors: Record<string, string> = {};

  for (const [key, sanitizer] of Object.entries(schema)) {
    const raw = body[key];
    if (raw === undefined || raw === null) continue;

    const result = sanitizer(String(raw));
    if (result.valid) {
      (data as any)[key] = result.clean;
    } else {
      errors[key] = result.error || `Invalid ${key}`;
    }
  }

  return {
    data,
    valid: Object.keys(errors).length === 0,
    errors,
  };
}