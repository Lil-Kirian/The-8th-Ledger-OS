// app/api/agora/qa/route.ts
// 8th Ledger — The Archives: Q&A Engine
// The Scribe answers from the Codex. Heralds moderate. The Architect answers strategically.
// GET: Public | POST: Auth + rate-limited | PATCH: Herald/Admin answer gate

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdminRole } from "@/lib/auth";
import { randomUUID } from "crypto";

//
// TYPES & CONSTANTS
//

type QaStatus = "pending" | "answered" | "rejected";
type SortMode = "newest" | "unanswered_first";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_QUESTIONS = 10;

//
// IN-MEMORY RATE LIMITER (swap for Redis at scale)
//

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(userId: string): { allowed: boolean; resetAt: number; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, resetAt: now + RATE_LIMIT_WINDOW_MS, remaining: RATE_LIMIT_MAX_QUESTIONS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_QUESTIONS) {
    return { allowed: false, resetAt: entry.resetAt, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, resetAt: entry.resetAt, remaining: RATE_LIMIT_MAX_QUESTIONS - entry.count };
}

//
// HELPERS
//

function sanitizeText(input: string, maxLength: number): string {
  return input.replace(/[<>]/g, "").trim().slice(0, maxLength);
}

function isValidStatus(status: string): status is QaStatus {
  return ["pending", "answered", "rejected"].includes(status);
}

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
  }
}

//
// FETCH ANSWERER HELPER (answeredBy is String?, not a relation)
//

async function fetchAnswerer(answererId: string | null) {
  if (!answererId) return null;
  const user = await prisma.user.findUnique({
    where: { id: answererId },
    select: { ledgerId: true, displayName: true, role: true, kycTier: true, avatar: true },
  });
  return user;
}

//
// GET /api/agora/qa
// Public. Cached 60s. Full-text search on question + answer.
//

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const statusRaw = searchParams.get("status");
    const status: QaStatus | undefined = statusRaw && isValidStatus(statusRaw) ? statusRaw : undefined;
    const q = searchParams.get("q") || undefined;
    const sort = (searchParams.get("sort") as SortMode) || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: {
      status?: QaStatus;
      OR?: Array<
        | { question: { contains: string; mode: "insensitive" } }
        | { answer: { contains: string; mode: "insensitive" } }
      >;
    } = {};

    if (status) where.status = status;
    if (q) {
      where.OR = [
        { question: { contains: q, mode: "insensitive" } },
        { answer: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "unanswered_first"
        ? [{ status: "asc" as const }, { createdAt: "desc" as const }]
        : { createdAt: "desc" as const };

    const [questions, total] = await Promise.all([
      prisma.agoraQA.findMany({
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
      prisma.agoraQA.count({ where }),
    ]);

    // Fetch answerers separately (answeredBy is String?, not a relation)
    const answererIds = questions
      .map((qa) => qa.answeredBy)
      .filter((id): id is string => !!id);

    const answerers =
      answererIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: [...new Set(answererIds)] } },
            select: { id: true, ledgerId: true, displayName: true, role: true, kycTier: true, avatar: true },
          })
        : [];

    const answererMap = new Map(answerers.map((u) => [u.id, u]));

    const response = NextResponse.json({
      questions: questions.map((qa) => {
        const answerer = qa.answeredBy ? answererMap.get(qa.answeredBy) ?? null : null;
        return {
          id: qa.id,
          question: qa.question,
          answer: qa.answer,
          status: qa.status,
          createdAt: qa.createdAt,
          answeredAt: qa.answeredAt,
          author: {
            ledgerId: qa.user.ledgerId,
            displayName: qa.user.displayName,
            country: qa.user.country,
            avatar: qa.user.avatar,
          },
          answerer: answerer
            ? {
                ledgerId: answerer.ledgerId,
                displayName: answerer.displayName,
                role: answerer.role,
                kycTier: answerer.kycTier,
                avatar: answerer.avatar,
              }
            : null,
        };
      }),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        sort,
      },
    });

    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("[AGORA_QA_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch Q&A", code: "AGORA_QA_001" },
      { status: 500 }
    );
  }
}

//
// POST /api/agora/qa
// Ask a question. Auth required. Rate-limited. Audited.
//

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Max 10 questions per hour.",
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

    const body = await req.json();
    const { question: questionRaw } = body;

    const question = sanitizeText(questionRaw, 500);

    if (question.length < 10) {
      return NextResponse.json(
        {
          error: "Question must be at least 10 characters",
          code: "VALIDATION_QUESTION",
        },
        { status: 400 },
      );
    }

    const recentDuplicate = await prisma.agoraQA.findFirst({
      where: {
        userId: user.id,
        question: { equals: question, mode: "insensitive" },
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          error: "You already asked this question in the last hour",
          code: "DUPLICATE",
        },
        { status: 409 },
      );
    }

    const [qa] = await prisma.$transaction([
      prisma.agoraQA.create({
        data: {
          userId: user.id,
          question,
          status: "pending",
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
      prisma.auditLog.create({
        data: {
          eventType: "agora_qa_asked",
          description: `Question asked: "${question.slice(0, 60)}..."`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ questionLength: question.length }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      }),
    ]);

    return NextResponse.json(
      {
        qa: {
          id: qa.id,
          question: qa.question,
          status: qa.status,
          createdAt: qa.createdAt,
          author: {
            ledgerId: qa.user.ledgerId,
            displayName: qa.user.displayName,
            country: qa.user.country,
            avatar: qa.user.avatar,
          },
        },
        meta: {
          rateLimitRemaining: rateLimit.remaining,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[AGORA_QA_POST]", error);

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
      { error: "Failed to post question", code: "AGORA_QA_002" },
      { status: 500 },
    );
  }
}

//
// PATCH /api/agora/qa
// Answer or reject a question. Herald (kycTier >= verified) or Admin only.
//

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const isHerald =
      user.kycTier === "verified" ||
      user.kycTier === "whale" ||
      isAdminRole(user.role);
    if (!isHerald) {
      return NextResponse.json(
        {
          error: "Only Heralds (verified tier+) and The Architect may answer",
          code: "HERALD_REQUIRED",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { id, answer, action } = body as {
      id: string;
      answer?: string;
      action: "answer" | "reject";
    };

    if (!id || id.length < 10) {
      return NextResponse.json(
        { error: "Invalid question ID", code: "VALIDATION_ID" },
        { status: 400 },
      );
    }

    if (!action || !["answer", "reject"].includes(action)) {
      return NextResponse.json(
        {
          error: "Action must be 'answer' or 'reject'",
          code: "VALIDATION_ACTION",
        },
        { status: 400 },
      );
    }

    const qa = await prisma.agoraQA.findUnique({
      where: { id },
      select: {
        id: true,
        question: true,
        status: true,
        userId: true,
      },
    });

    if (!qa) {
      return NextResponse.json(
        { error: "Question not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (qa.status === "answered" && action === "answer") {
      return NextResponse.json(
        { error: "Question already answered", code: "ALREADY_ANSWERED" },
        { status: 409 },
      );
    }

    if (action === "answer") {
      const sanitizedAnswer = sanitizeText(answer || "", 2000);
      if (sanitizedAnswer.length < 5) {
        return NextResponse.json(
          {
            error: "Answer must be at least 5 characters",
            code: "VALIDATION_ANSWER",
          },
          { status: 400 },
        );
      }

      const [updated] = await prisma.$transaction([
        prisma.agoraQA.update({
          where: { id },
          data: {
            answer: sanitizedAnswer,
            answeredBy: user.id,
            status: "answered",
            answeredAt: new Date(),
          },
          include: {
            user: {
              select: { ledgerId: true, displayName: true, avatar: true },
            },
          },
        }),
        prisma.auditLog.create({
          data: {
            eventType: "agora_qa_answered",
            description: `Question answered by ${isAdminRole(user.role) ? "The Architect" : "Herald"} ${user.ledgerId}`,
            ledgerId: user.ledgerId,
            metadata: JSON.stringify({
              questionId: id,
              answerLength: sanitizedAnswer.length,
            }),
            txHash: `AUD-${randomUUID()}`,
            visibleToPublic: true,
            timestamp: new Date(),
          },
        }),
      ]);

      // Fetch answerer separately (not a relation)
      const answerer = await fetchAnswerer(updated.answeredBy);

      return NextResponse.json({
        qa: {
          id: updated.id,
          question: updated.question,
          answer: updated.answer,
          status: updated.status,
          answeredAt: updated.answeredAt,
          author: updated.user,
          answerer: answerer
            ? {
                ledgerId: answerer.ledgerId,
                displayName: answerer.displayName,
                role: answerer.role,
                kycTier: answerer.kycTier,
                avatar: answerer.avatar,
              }
            : null,
        },
      });
    }

    // action === "reject"
    const [updated] = await prisma.$transaction([
      prisma.agoraQA.update({
        where: { id },
        data: {
          status: "rejected",
          answeredBy: user.id,
          answeredAt: new Date(),
        },
        include: {
          user: {
            select: { ledgerId: true, displayName: true, avatar: true },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          eventType: "agora_qa_rejected",
          description: `Question rejected by ${isAdminRole(user.role) ? "The Architect" : "Herald"} ${user.ledgerId}`,
          ledgerId: user.ledgerId,
          metadata: JSON.stringify({ questionId: id }),
          txHash: `AUD-${randomUUID()}`,
          visibleToPublic: true,
          timestamp: new Date(),
        },
      }),
    ]);

    // Fetch answerer separately (not a relation)
    const answerer = await fetchAnswerer(updated.answeredBy);

    return NextResponse.json({
      qa: {
        id: updated.id,
        question: updated.question,
        status: updated.status,
        answeredAt: updated.answeredAt,
        author: updated.user,
        answerer: answerer
          ? {
              ledgerId: answerer.ledgerId,
              displayName: answerer.displayName,
              role: answerer.role,
              kycTier: answerer.kycTier,
              avatar: answerer.avatar,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("[AGORA_QA_PATCH]", error);

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
      { error: "Failed to process answer", code: "AGORA_QA_003" },
      { status: 500 },
    );
  }
}