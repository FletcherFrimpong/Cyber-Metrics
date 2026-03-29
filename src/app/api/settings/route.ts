// GET /api/settings — returns current platform settings (secrets masked)
// POST /api/settings — saves platform settings

import { NextRequest, NextResponse } from "next/server";
import { getClientSafeSettings, saveSettings, getSettings } from "@/lib/settings-store";

export async function GET() {
  return NextResponse.json(getClientSafeSettings());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = getSettings();

    const updates: any = {};

    // Investment amount
    if (body.investmentAmount !== undefined) {
      updates.investmentAmount = Math.max(0, Number(body.investmentAmount) || 0);
    }

    // Sentinel config
    if (body.sentinel !== undefined) {
      if (body.sentinel === null) {
        updates.sentinel = null;
      } else {
        const existing = current.sentinel || { pollingIntervalMs: 900000 };
        updates.sentinel = {
          tenantId: body.sentinel.tenantId ?? existing.tenantId ?? "",
          clientId: body.sentinel.clientId ?? existing.clientId ?? "",
          // Only update secret if it's not the masked placeholder
          clientSecret:
            body.sentinel.clientSecret && body.sentinel.clientSecret !== "••••••••"
              ? body.sentinel.clientSecret
              : existing.clientSecret ?? "",
          workspaceId: body.sentinel.workspaceId ?? existing.workspaceId ?? "",
          resourceGroup: body.sentinel.resourceGroup ?? existing.resourceGroup ?? "",
          workspaceName: body.sentinel.workspaceName ?? existing.workspaceName ?? "",
          subscriptionId: body.sentinel.subscriptionId ?? existing.subscriptionId ?? "",
          pollingIntervalMs: body.sentinel.pollingIntervalMs ?? existing.pollingIntervalMs ?? 900000,
          webhookSecret: body.sentinel.webhookSecret ?? existing.webhookSecret ?? "",
        };
      }
    }

    const saved = saveSettings(updates);

    // If Sentinel config changed, tell the data service to reinitialize
    if (updates.sentinel) {
      try {
        const { default: edrDataService } = await import("@/lib/edr-data-service");
        await edrDataService.connectSentinel(updates.sentinel);
      } catch (err: any) {
        console.warn("Failed to reinitialize Sentinel:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      settings: getClientSafeSettings(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
