import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings-store";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { REVENUE_BANDS } from "@/lib/anchor-data.ts";
import { DEFAULT_RISK_CONFIG } from "@/lib/risk-model";

export async function GET() {
  const auth = await requireAuth("settings:view");
  if (isAuthError(auth)) return auth;

  const s = getSettings();
  return NextResponse.json({
    investmentAmount: s.investmentAmount || 0,
    organisation: {
      revenueBand: s.organisation?.revenueBand || "",
      lossEventsLast12Months: s.organisation?.lossEventsLast12Months || 0,
      typicalControlEffectiveness: s.organisation?.typicalControlEffectiveness ?? null,
    },
    revenueBands: REVENUE_BANDS.map((b) => ({ id: b.id, label: b.label })),
    defaultTypicalControlEffectiveness: DEFAULT_RISK_CONFIG.typicalControlEffectiveness,
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
    smtp: s.smtp
      ? {
          host: s.smtp.host || "",
          port: s.smtp.port || 587,
          user: s.smtp.user || "",
          pass: s.smtp.pass ? "••••••••" : "",
          from: s.smtp.from || "",
          configured: !!(s.smtp.host && s.smtp.user),
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
    organisation: body.organisation,
    sentinel: body.sentinel,
    smtp: body.smtp,
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
