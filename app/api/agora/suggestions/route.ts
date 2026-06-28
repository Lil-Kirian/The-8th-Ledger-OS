// app/api/agora/suggestions/route.ts
// 8th Ledger — The Stoa: Public Suggestion Board
// Production-grade: rate-limited, audited, indexed-query optimized

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireKycTier } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// CONSTANTS & CONFIG
//

const VALID_CONTINENTS = [
  "africa",
  "asia",
  "europe",
  "americas",
  "middle_east",
  "oceania",
] as const;

const VALID_VERTICALS = [
  "ledgerprop",
  "ledgerauto",
  "ledgertech",
  "ledgeredu",
  "ledgerhealth",
  "ledgerbiz",
  "ledgertravel",
  "ledgeragri",
  "ledgerenergy",
  "ledgeraccess",
] as const;

type Continent = (typeof VALID_CONTINENTS)[number];
type Vertical = (typeof VALID_VERTICALS)[number];
type SortMode = "trending" | "newest" | "top";
type StatusFilter = "pending" | "under_review" | "approved" | "rejected";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 suggestions per hour per IP

//
// IN-MEMORY RATE LIMITER (swap for Redis when multi-instance)
//

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): {
  allowed: boolean;
  resetAt: number;
  remaining: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return {
      allowed: true,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
      remaining: RATE_LIMIT_MAX - 1,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetAt: entry.resetAt, remaining: 0 };
  }

  entry.count += 1;
  return {
    allowed: true,
    resetAt: entry.resetAt,
    remaining: RATE_LIMIT_MAX - entry.count,
  };
}

//
// INPUT SANITIZATION
//

function sanitizeText(input: string, maxLength: number): string {
  return input
    .replace(/[<>]/g, "") // Strip angle brackets (basic XSS guard)
    .trim()
    .slice(0, maxLength);
}

function isValidStatus(status: string): status is StatusFilter {
  return ["pending", "under_review", "approved", "rejected"].includes(status);
}

//
// AUDIT LOGGING
//

async function logAudit(props: {
  eventType: string;
  description: string;
  ledgerId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: props.eventType,
        description: props.description,
        ledgerId: props.ledgerId ?? null,
        metadata: props.metadata ? JSON.stringify(props.metadata) : null,
        txHash: `AUD-${randomUUID()}`,
        visibleToPublic: true,
        timestamp: new Date(),
      },
    });
  } catch {
    // Audit failure must not break the user flow
    // In production, send to a dead-letter queue or alerting system
  }
}

//
// GET /api/agora/suggestions
// Public. Cached 60s. Leverages schema indexes: status, continent, userId
//

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse & validate query params
    const statusRaw = searchParams.get("status");
    const status: StatusFilter | undefined =
      statusRaw && isValidStatus(statusRaw) ? statusRaw : undefined;

    const continent = searchParams.get("continent") || undefined;
    const vertical = searchParams.get("vertical") || undefined;
    const q = searchParams.get("q") || undefined;
    const sort = (searchParams.get("sort") as SortMode) || "trending";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const skip = (page - 1) * limit;

    // Build Prisma where clause (schema-indexed fields)
    const where: {
      status?: StatusFilter;
      continent?: string;
      vertical?: string;
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (status) where.status = status;
    if (continent) where.continent = continent;
    if (vertical) where.vertical = vertical;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    // Sort strategy: trending uses a composite of score + recency
    const orderBy =
      sort === "newest"
        ? { createdAt: "desc" as const }
        : sort === "top"
          ? { upvotes: "desc" as const }
          : [{ upvotes: "desc" as const }, { createdAt: "desc" as const }];

    // Parallel fetch: data + count
    const [suggestions, total] = await Promise.all([
      prisma.agoraSuggestion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              country: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.agoraSuggestion.count({ where }),
    ]);

    // Shape response
    const response = NextResponse.json({
      suggestions: suggestions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        continent: s.continent,
        vertical: s.vertical,
        status: s.status,
        upvotes: s.upvotes,
        downvotes: s.downvotes,
        score: s.upvotes - s.downvotes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        author: {
          ledgerId: s.user.ledgerId,
          displayName: s.user.displayName,
          country: s.user.country,
          avatar: s.user.avatar,
        },
      })),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        sort,
      },
    });

    // Public cache: 60 seconds for read-heavy endpoint
    response.headers.set(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300",
    );
    return response;
  } catch (error) {
    console.error("[AGORA_SUGGESTIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions", code: "AGORA_001" },
      { status: 500 },
    );
  }
}

//
// POST /api/agora/suggestions
// Auth required. KYC tier >= sovereign. Rate-limited. Audited.
//

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & KYC gate
    const user = await requireAuth(req);
    requireKycTier(user, "sovereign");

    // 2. Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Max 5 suggestions per hour.",
          code: "RATE_LIMITED",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    // 3. Parse & validate body
    const body = await req.json();
    const {
      title: titleRaw,
      description: descriptionRaw,
      continent,
      vertical,
    } = body;

    const title = sanitizeText(titleRaw, 200);
    const description = sanitizeText(descriptionRaw, 2000);

    if (title.length < 5) {
      return NextResponse.json(
        {
          error: "Title must be at least 5 characters",
          code: "VALIDATION_TITLE",
        },
        { status: 400 },
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        {
          error: "Description must be at least 20 characters",
          code: "VALIDATION_DESCRIPTION",
        },
        { status: 400 },
      );
    }

    if (!continent || !VALID_CONTINENTS.includes(continent as Continent)) {
      return NextResponse.json(
        {
          error: `Continent must be one of: ${VALID_CONTINENTS.join(", ")}`,
          code: "VALIDATION_CONTINENT",
        },
        { status: 400 },
      );
    }

    if (!vertical || !VALID_VERTICALS.includes(vertical as Vertical)) {
      return NextResponse.json(
        {
          error: `Vertical must be one of: ${VALID_VERTICALS.join(", ")}`,
          code: "VALIDATION_VERTICAL",
        },
        { status: 400 },
      );
    }

    // 4. Duplicate guard: same title by same user within 24h
    const recentDuplicate = await prisma.agoraSuggestion.findFirst({
      where: {
        userId: user.id,
        title: { equals: title, mode: "insensitive" },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          error: "You already suggested this asset in the last 24 hours",
          code: "DUPLICATE",
        },
        { status: 409 },
      );
    }

    // 5. Atomic creation + audit log
    const [suggestion] = await prisma.$transaction([
      prisma.agoraSuggestion.create({
        data: {
          userId: user.id,
          title,
          description,
          continent,
          vertical,
          status: "pending",
          upvotes: 0,
          downvotes: 0,
        },
        include: {
          user: {
            select: {
              ledgerId: true,
              displayName: true,
              country: true,
              avatar: true,
            },
          },
        },
      }),
      // Audit trail (non-blocking via try-catch in logAudit, but transactional for consistency)
      prisma.auditLog.create({
        data: {
          eventType: "agora_suggestion_created",
          description: `Suggestion created: "${title}" (${continent} / ${vertical})`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({
            continent,
            vertical,
            titleLength: title.length,
          }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      }),
    ]);

    // 6. Response
    const response = NextResponse.json(
      {
        suggestion: {
          id: suggestion.id,
          title: suggestion.title,
          description: suggestion.description,
          continent: suggestion.continent,
          vertical: suggestion.vertical,
          status: suggestion.status,
          upvotes: suggestion.upvotes,
          downvotes: suggestion.downvotes,
          score: 0,
          createdAt: suggestion.createdAt,
          author: {
            ledgerId: suggestion.user.ledgerId,
            displayName: suggestion.user.displayName,
            country: suggestion.user.country,
            avatar: suggestion.user.avatar,
          },
        },
        meta: {
          rateLimitRemaining: rateLimit.remaining,
        },
      },
      { status: 201 },
    );

    return response;
  } catch (error: any) {
    console.error("[AGORA_SUGGESTIONS_POST]", error);

    if (error.message?.includes("KYC tier")) {
      return NextResponse.json(
        {
          error: "KYC tier 'sovereign' or higher required to suggest",
          code: "KYC_INSUFFICIENT",
        },
        { status: 403 },
      );
    }

    if (
      error.message?.includes("Unauthorized") ||
      error.message?.includes("unauthorized")
    ) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create suggestion", code: "AGORA_002" },
      { status: 500 },
    );
  }
}
