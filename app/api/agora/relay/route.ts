// app/api/agora/relay/route.ts
// 8th Ledger — The Relay: Hall Transparency Feed
// Public read-only. Zero internals exposed. Proof of governance.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────

type ActivityType =
  | "vote"
  | "proposal"
  | "execution"
  | "hire"
  | "fire"
  | "maintenance"
  | "inventory"
  | "closure"
  | "impeach"
  | "pir_advance"
  | "location_select";

const PUBLIC_ACTIVITY_TYPES: ActivityType[] = [
  "vote",
  "proposal",
  "execution",
  "hire",
  "fire",
  "maintenance",
  "inventory",
  "closure",
  "impeach",
  "pir_advance",
  "location_select",
];

// ─────────────────────────────────────────────────────────────
// SRI TIER CALCULATOR (public metric)
// ─────────────────────────────────────────────────────────────

function getSriTier(score: number): "platinum" | "gold" | "silver" | "bronze" | "at_risk" {
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 60) return "silver";
  if (score >= 40) return "bronze";
  return "at_risk";
}

// ─────────────────────────────────────────────────────────────
// HALL ID MASKING
// ─────────────────────────────────────────────────────────────

function maskHallId(hallId: string): string {
  if (!hallId || hallId.length < 4) return "HALL-XXXX";
  return `HALL-${hallId.slice(-4).toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────
// DESCRIPTION SANITIZER
// // Aggressive defense: strips anything that could be sensitive
// // even if legacy data was written unsafely.
// ─────────────────────────────────────────────────────────────

function sanitizeRelayDescription(raw: string): string {
  if (!raw) return "";

  return (
    raw
      // Dollar amounts → redacted
      .replace(/\$\d{1,3}(,\d{3})*(\.\d{2})?/g, "[AMOUNT]")
      // LED- user IDs → redacted
      .replace(/LED-[A-Z0-9]{4}-[A-Z0-9]{4}/g, "[USER]")
      // Email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]")
      // Phone numbers
      .replace(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[PHONE]")
      // Ownership percentages (e.g., "owns 5.2%", "holding 10%")
      // Vote percentages like "passed 73%" are SAFE and kept.
      .replace(/(?:owns?|holds?|holding|stake|share of|fraction of|acquired).{0,15}\d+\.?\d*\s*%/gi, "[OWNERSHIP]")
      // Wallet addresses / crypto patterns (defensive)
      .replace(/\b0x[a-fA-F0-9]{40}\b/g, "[ADDRESS]")
      .replace(/\b[A-Za-z0-9]{26,42}\b/g, (match) => (match.length > 30 ? "[ADDRESS]" : match))
      .trim()
  );
}

// ─────────────────────────────────────────────────────────────
// SAFE DESCRIPTION GENERATOR
// // Builds a sanitized description from metadata if available,
// // falls back to sanitized raw description.
// ─────────────────────────────────────────────────────────────

function generateSafeDescription(
  type: string,
  rawDescription: string,
  metadataJson: string | null
): string {
  // Try metadata first for structured, safe descriptions
  if (metadataJson) {
    try {
      const meta = JSON.parse(metadataJson);
      const votePercent = meta.votePercent || meta.passedPercent;
      const proposalTitle = meta.proposalTitle || meta.title;

      if (type === "vote" && votePercent && proposalTitle) {
        return `Voted on "${sanitizeRelayDescription(proposalTitle)}" — passed ${votePercent}%`;
      }
      if (type === "proposal" && proposalTitle) {
        return `New proposal: "${sanitizeRelayDescription(proposalTitle)}"`;
      }
      if (type === "execution" && proposalTitle) {
        return `Executed: "${sanitizeRelayDescription(proposalTitle)}"`;
      }
      if (type === "hire" && meta.role) {
        return `Approved hire for ${sanitizeRelayDescription(meta.role)}`;
      }
      if (type === "fire" && meta.role) {
        return `Approved termination for ${sanitizeRelayDescription(meta.role)}`;
      }
      if (type === "maintenance" && meta.description) {
        return `Maintenance: ${sanitizeRelayDescription(meta.description)}`;
      }
      if (type === "inventory" && meta.itemName) {
        return `Listed inventory: ${sanitizeRelayDescription(meta.itemName)}`;
      }
      if (type === "closure" && meta.phase) {
        return `Closure protocol: ${sanitizeRelayDescription(meta.phase)}`;
      }
      if (type === "impeach" && meta.role) {
        return `Impeachment vote: ${sanitizeRelayDescription(meta.role)}`;
      }
      if (type === "pir_advance" && meta.reason) {
        return `PIR advance: ${sanitizeRelayDescription(meta.reason)}`;
      }
      if (type === "location_select" && meta.locationName) {
        return `Location selected: ${sanitizeRelayDescription(meta.locationName)}`;
      }
    } catch {
      // Metadata malformed — fall through to raw description
    }
  }

  // Fallback: sanitize the raw description
  return sanitizeRelayDescription(rawDescription) || "Governance activity recorded.";
}

// ─────────────────────────────────────────────────────────────
// GET /api/agora/relay
// Public. Cached 120s. Zero auth. Zero internals.
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Filters
    const hallIdFilter = searchParams.get("hallId") || undefined;
    const typeFilter = searchParams.get("type") || undefined;
    const sinceRaw = searchParams.get("since");
    const since = sinceRaw ? new Date(sinceRaw) : undefined;

    // Build where clause (schema-indexed: hallId, type, createdAt)
    const where: {
      type: { in: ActivityType[] };
      hallId?: string;
      createdAt?: { gt: Date };
    } = {
      type: { in: PUBLIC_ACTIVITY_TYPES },
    };

    if (hallIdFilter) where.hallId = hallIdFilter;
    if (since && !isNaN(since.getTime())) {
      where.createdAt = { gt: since };
    }

    // If a specific type is requested, validate it
    if (typeFilter && PUBLIC_ACTIVITY_TYPES.includes(typeFilter as ActivityType)) {
      where.type = { in: [typeFilter as ActivityType] };
    }

    // Parallel fetch
    const [activities, total] = await Promise.all([
      prisma.hallActivity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          hall: {
            select: {
              id: true,
              name: true,
              status: true,
              hallClass: true,
              sriScore: true,
            },
          },
        },
      }),
      prisma.hallActivity.count({ where }),
    ]);

    // Shape feed — every field is public-safe by construction
    const feed = activities.map((activity) => {
      const hall = activity.hall;
      const sriScore = hall?.sriScore ?? 0;
      const sriTier = getSriTier(sriScore);

      return {
        id: activity.id,
        timestamp: activity.createdAt,
        hall: {
          id: maskHallId(activity.hallId),
          name: hall?.name || `Hall ${maskHallId(activity.hallId)}`,
          status: hall?.status || "unknown",
          class: hall?.hallClass || null,
          sri: {
            score: sriScore,
            tier: sriTier,
          },
        },
        event: {
          type: activity.type,
          description: generateSafeDescription(
            activity.type,
            activity.description,
            activity.metadata
          ),
        },
        // Explicitly absent: userId, metadata internals, amounts, percentages
      };
    });

    const response = NextResponse.json({
      feed,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        since: since?.toISOString() ?? null,
      },
    });

    // Public cache: 120s — relay data is low-volatility governance history
    response.headers.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    return response;
  } catch (error) {
    console.error("[AGORA_RELAY_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch relay feed", code: "AGORA_RELAY_001" },
      { status: 500 }
    );
  }
}