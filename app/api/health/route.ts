// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health — system status & DB connection check
export async function GET() {
  const startedAt = Date.now();
  let dbStatus: "healthy" | "degraded" | "down" = "down";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = dbLatency > 500 ? "degraded" : "healthy";
  } catch (error) {
    console.error("[HEALTH_DB]", error);
    dbStatus = "down";
  }

  const totalLatency = Date.now() - startedAt;

  const statusCode = dbStatus === "down" ? 503 : 200;

  return NextResponse.json(
    {
      status: dbStatus === "healthy" ? "operational" : dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          provider: "sqlite",
        },
        api: {
          latencyMs: totalLatency,
          version: process.env.npm_package_version || "unknown",
        },
      },
      environment: process.env.NODE_ENV || "unknown",
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}