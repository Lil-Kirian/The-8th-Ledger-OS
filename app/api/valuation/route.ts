import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/* ============================================================
   GET /api/valuation
   Returns the Dynamic PAC Valuation formula and explanation.
   ============================================================ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    return NextResponse.json({
      formula: {
        name: "8th Ledger Dynamic PAC Valuation",
        description:
          "PACs are not sold at fantasy prices. The 8th Ledger calculates the real, current value of every ownership percentage based on asset performance, accumulated dividends, and market conditions.",
        equation:
          "Value Per 1% = (Asset Book Value / 100) + Accumulated Dividends Per 1% + AHGI Premium + SRI Tier Bonus - PIR Debt Per 1%",
        components: [
          {
            name: "Asset Book Value",
            symbol: "assetBookValue / 100",
            description: "Independent appraisal + revenue multiple + comparable sales",
            updateFrequency: "Quarterly",
            example: 2500,
          },
          {
            name: "Accumulated Dividends",
            symbol: "accumulatedDividendsPerPercent",
            description: "Total dividends ever paid to 1% ownership over lifetime",
            updateFrequency: "Real-time",
            example: 180,
          },
          {
            name: "AHGI Premium",
            symbol: "(AHGI - 50) × $10",
            description: "Asset Health Growth Index premium/discount",
            updateFrequency: "Monthly",
            example: 220,
            note: "AHGI 72 → (72 - 50) × 10 = +220",
          },
          {
            name: "SRI Tier Bonus",
            symbol: "tierBonus",
            description: "Sovereign Reputation Index tier bonus/penalty",
            updateFrequency: "Monthly",
            tiers: {
              platinum: "+$50",
              gold: "+$30",
              silver: "+$10",
              bronze: "$0",
              at_risk: "-$20",
            },
            example: 30,
          },
          {
            name: "PIR Debt",
            symbol: "-pirDebtPerPercent",
            description: "Outstanding PIR advances attributed to 1%",
            updateFrequency: "Real-time",
            example: 0,
          },
        ],
      },
      example: {
        hall: "Hall #2847 — LedgerProp — Nairobi Apartment Building",
        assetBookValue: 250000,
        accumulatedDividendsPerPercent: 180,
        ahgi: 72,
        sriTier: "gold",
        pirDebt: 0,
        calculation: {
          assetBookValuePerPercent: 2500,
          accumulatedDividends: 180,
          ahgiPremium: 220,
          sriBonus: 30,
          pirDebtDeduction: 0,
          valuePerPercent: 2930,
        },
        ownershipExample: {
          percent: 5.0,
          totalValue: 14650,
        },
      },
      rules: {
        floorPrice: {
          description: "100% of 8th Ledger Valuation (hard floor)",
          enforce: true,
        },
        belowFloor: {
          description: "Requires hall vote (51%). Protects against fire sales.",
          enforce: true,
        },
        aboveFloor: {
          description: "Owner sets any price. Market decides.",
          enforce: false,
        },
        fees: {
          fullSale: "1% 8th Ledger fee",
          fractionalSale: "2% 8th Ledger fee",
        },
        autoUpdate: {
          description: "Valuation recalculated monthly. Active listings auto-adjust.",
          frequency: "Monthly",
        },
        minOwnershipAfterSale: {
          value: 0.1,
          description: "0.1% hard protocol rule. Sell all or stay above threshold.",
        },
        maxFractionPerListing: {
          value: 25,
          description: "25% of your ownership per listing. Hall can override.",
        },
        maxActiveListings: {
          value: 3,
          description: "Max 3 active listings per user. Hall can override.",
        },
        listingDuration: {
          value: 30,
          description: "30 days default. Hall can override.",
        },
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[VALUATION FORMULA]", error);
    return NextResponse.json({ error: "Failed to fetch valuation formula" }, { status: 500 });
  }
}