import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   TYPES
   ============================================================ */
interface SettingsResponse {
  success: boolean;
  settings?: unknown;
  error?: string;
  message?: string;
}

/* ============================================================
   GET /api/admin/settings — Fetch 8th Ledger protocol config
   ============================================================ */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json<SettingsResponse>(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    let settings = await prisma.protocolSettings.findUnique({
      where: { key: "default" },
    });

    // Auto-create default 8th Ledger settings if missing
    if (!settings) {
      settings = await prisma.protocolSettings.create({
        data: {
          key: "default",
          platformFee: 0,
          minCommitment: 50,
          maxCommitment: 50000,
          consensusThreshold: 2,
          publicAudit: true,
          pirEnabled: true,
          oracleEnabled: true,
          meridianCycleEnabled: true,
          closureProtocolEnabled: true,
          dormancyProtocolEnabled: true,
          dynamicValuationEnabled: true,
          forgeLedgerEnabled: true,
          eighthLedgerTithe: 20,
        },
      });
    }

    return NextResponse.json<SettingsResponse>({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("[ADMIN SETTINGS GET]", error);
    return NextResponse.json<SettingsResponse>(
      { success: false, error: "Failed to fetch protocol settings" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST /api/admin/settings — Update 8th Ledger protocol config
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user || !isPrimaryAdmin(user.ledgerId)) {
      return NextResponse.json<SettingsResponse>(
        { success: false, error: "Primary Admin authority required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      platformFee,
      minCommitment,
      maxCommitment,
      consensusThreshold,
      publicAudit,
      pirEnabled,
      oracleEnabled,
      meridianCycleEnabled,
      closureProtocolEnabled,
      dormancyProtocolEnabled,
      dynamicValuationEnabled,
      forgeLedgerEnabled,
      eighthLedgerTithe,
    } = body;

    // Validation
    if (minCommitment !== undefined && minCommitment < 1) {
      return NextResponse.json<SettingsResponse>(
        { success: false, error: "Minimum commitment must be at least $1" },
        { status: 400 }
      );
    }

    if (maxCommitment !== undefined && maxCommitment < (minCommitment || 50)) {
      return NextResponse.json<SettingsResponse>(
        { success: false, error: "Maximum commitment must exceed minimum" },
        { status: 400 }
      );
    }

    if (eighthLedgerTithe !== undefined && (eighthLedgerTithe < 0 || eighthLedgerTithe > 100)) {
      return NextResponse.json<SettingsResponse>(
        { success: false, error: "8th Ledger Tithe must be 0–100" },
        { status: 400 }
      );
    }

    const updateData: unknown = { updatedBy: user.ledgerId };
    if (platformFee !== undefined) updateData.platformFee = Number(platformFee);
    if (minCommitment !== undefined) updateData.minCommitment = Number(minCommitment);
    if (maxCommitment !== undefined) updateData.maxCommitment = Number(maxCommitment);
    if (consensusThreshold !== undefined) updateData.consensusThreshold = Number(consensusThreshold);
    if (publicAudit !== undefined) updateData.publicAudit = Boolean(publicAudit);
    if (pirEnabled !== undefined) updateData.pirEnabled = Boolean(pirEnabled);
    if (oracleEnabled !== undefined) updateData.oracleEnabled = Boolean(oracleEnabled);
    if (meridianCycleEnabled !== undefined) updateData.meridianCycleEnabled = Boolean(meridianCycleEnabled);
    if (closureProtocolEnabled !== undefined) updateData.closureProtocolEnabled = Boolean(closureProtocolEnabled);
    if (dormancyProtocolEnabled !== undefined) updateData.dormancyProtocolEnabled = Boolean(dormancyProtocolEnabled);
    if (dynamicValuationEnabled !== undefined) updateData.dynamicValuationEnabled = Boolean(dynamicValuationEnabled);
    if (forgeLedgerEnabled !== undefined) updateData.forgeLedgerEnabled = Boolean(forgeLedgerEnabled);
    if (eighthLedgerTithe !== undefined) updateData.eighthLedgerTithe = Number(eighthLedgerTithe);

    const updated = await prisma.protocolSettings.upsert({
      where: { key: "default" },
      create: {
        key: "default",
        ...updateData,
      },
      update: updateData,
    });

    // Audit log
    await prisma.auditEntry.create({
      data: {
        type: "settings_updated",
        description: `8th Ledger protocol settings updated by ${user.displayName}`,
        txHash: `SETTINGS-${Date.now().toString(36).toUpperCase()}`,
        ledgerId: user.ledgerId,
      },
    });

    return NextResponse.json<SettingsResponse>({
      success: true,
      settings: updated,
      message: "8th Ledger protocol settings updated",
    });
  } catch (error) {
    console.error("[ADMIN SETTINGS POST]", error);
    return NextResponse.json<SettingsResponse>(
      { success: false, error: "Failed to update protocol settings" },
      { status: 500 }
    );
  }
}