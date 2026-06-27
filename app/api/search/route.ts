import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase() || "";
    const vertical = searchParams.get("vertical");
    const minValue = searchParams.get("minValue");
    const maxValue = searchParams.get("maxValue");
    const status = searchParams.get("status") || "filling";
    const type = searchParams.get("type") || "all"; // all | pools | users | verticals
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const results: unknown = { pools: [], users: [], verticals: [] };

    /* ============================================================
       SEARCH POOLS
       ============================================================ */
    if (type === "all" || type === "pools") {
      const where: unknown = {};

      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { verticalId: { contains: q, mode: "insensitive" } },
          { poolId: { contains: q, mode: "insensitive" } },
        ];
      }

      if (vertical) where.verticalId = { contains: vertical, mode: "insensitive" };
      if (status && status !== "all") where.status = status;

      if (minValue || maxValue) {
        where.assetValue = {};
        if (minValue) where.assetValue.gte = Number(minValue);
        if (maxValue) where.assetValue.lte = Number(maxValue);
      }

      const pools = await prisma.pool.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          poolId: true,
          name: true,
          description: true,
          imageUrl: true,
          assetValue: true,
          committed: true,
          target: true,
          status: true,
          verticalId: true,
          country: true,
          participants: true,
          maxParticipants: true,
          isVerified: true,
          closesAt: true,
          createdAt: true,
        },
      });

      results.pools = pools.map((p) => ({
        ...p,
        accessThreshold: p.target,
        fillPercent: p.target > 0 ? Math.round((p.committed / p.target) * 100) : 0,
      }));
    }

    /* ============================================================
       SEARCH USERS (Public Profiles)
       ============================================================ */
    if (type === "all" || type === "users") {
      const userWhere: unknown = {
        isBanned: false,
      };

      if (q) {
        userWhere.OR = [
          { displayName: { contains: q, mode: "insensitive" } },
          { ledgerId: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
        ];
      }

      results.users = await prisma.user.findMany({
        where: userWhere,
        orderBy: { trustScore: "desc" },
        take: limit,
        select: {
          ledgerId: true,
          displayName: true,
          country: true,
          tier: true,
          trustScore: true,
          totalCommitted: true,
          forgesCompleted: true,
          referrals: true,
        },
      });
    }

    /* ============================================================
       SEARCH VERTICALS
       ============================================================ */
    if (type === "all" || type === "verticals") {
      const vertWhere: unknown = { isActive: true };

      if (q) {
        vertWhere.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }

      results.verticals = await prisma.verticalConfig.findMany({
        where: vertWhere,
        orderBy: { sortOrder: "asc" },
        take: limit,
        select: {
          slug: true,
          name: true,
          description: true,
          icon: true,
          color: true,
          minCommitment: true,
          maxCommitment: true,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      query: q,
      count: results.pools.length + results.users.length + results.verticals.length,
      ...results,
    });
  } catch (error) {
    console.error("[SEARCH GET]", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}