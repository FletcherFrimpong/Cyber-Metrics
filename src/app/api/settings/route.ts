// GET /api/settings — returns current platform settings (secrets masked)
// POST /api/settings — saves platform settings
//
// Uses globalThis for storage to avoid importing heavy modules.

import { NextRequest, NextResponse } from "next/server";

interface PlatformSettings {
  investmentAmount: number;
  sentinel: any | null;
}

const g = globalThis as any;
if (!g.__sfSettings) {
  g.__sfSettings = { investmentAmount: 0, sentinel: null } as PlatformSettings;
}

function getSettings(): PlatformSettings {
  return g.__sfSettings;
}

function saveSettings(updates: Partial<PlatformSettings>): PlatformSettings {
  g.__sfSettings = { ...g.__sfSettings, ...updates };
  return g.__sfSettings;
}

export async function GET() {
  const s = getSettings();
  return NextResponse.json({
    investmentAmount: s.investmentAmount,
    sentinel: s.sentinel
      ? {
          tenantId: s.sentinel.tenantId || "",
          clientId: s.sentinel.clientId || "",
          clientSecret: s.sentinel.clientSecret ? "••••••••" : "",
          workspaceId: s.sentinel.workspaceId || "",
          pollingIntervalMs: s.sentinel.pollingIntervalMs || 900000,
          connected: !!(s.sentinel.tenantId && s.sentinel.clientId && s.sentinel.clientSecret),
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = getSettings();
    const updates: Partial<PlatformSettings> = {};

    if (body.investmentAmount !== undefined) {
      updates.investmentAmount = Math.max(0, Number(body.investmentAmount) || 0);
    }

    if (body.sentinel !== undefined) {
      if (body.sentinel === null) {
        updates.sentinel = null;
      } else {
        const existing = current.sentinel || {};
        updates.sentinel = {
          tenantId: body.sentinel.tenantId ?? existing.tenantId ?? "",
          clientId: body.sentinel.clientId ?? existing.clientId ?? "",
          clientSecret:
            body.sentinel.clientSecret && body.sentinel.clientSecret !== "••••••••"
              ? body.sentinel.clientSecret
              : existing.clientSecret ?? "",
          workspaceId: body.sentinel.workspaceId ?? existing.workspaceId ?? "",
          pollingIntervalMs: body.sentinel.pollingIntervalMs ?? existing.pollingIntervalMs ?? 900000,
        };
      }
    }

    const saved = saveSettings(updates);

    // If Sentinel config changed, tell the data service to reinitialize (lazy import)
    if (updates.sentinel && updates.sentinel.tenantId) {
      try {
        const { default: edrDataService } = await import("@/lib/edr-data-service");
        await edrDataService.connectSentinel(updates.sentinel);
      } catch (err: any) {
        console.warn("Failed to reinitialize Sentinel:", err.message);
      }
    }

    return NextResponse.json({ success: true, settings: { investmentAmount: saved.investmentAmount } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
