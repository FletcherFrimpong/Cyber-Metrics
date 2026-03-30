import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings-store";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";

export async function GET() {
  const auth = await requireAuth("settings:view");
  if (isAuthError(auth)) return auth;

  const s = getSettings();
  return NextResponse.json({
    investmentAmount: s.investmentAmount || 0,
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
  const auth = await requireAuth("settings:edit");
  if (isAuthError(auth)) return auth;

  const body = await request.json();

  const s = updateSettings({
    investmentAmount: body.investmentAmount,
    sentinel: body.sentinel,
  });

  // Try to connect Sentinel if credentials are present
  if (s.sentinel?.tenantId) {
    try {
      const mod = await import("@/lib/edr-data-service");
      await mod.default.connectSentinel(s.sentinel);
    } catch {}
  }

  return NextResponse.json({ success: true, settings: { investmentAmount: s.investmentAmount } });
}
