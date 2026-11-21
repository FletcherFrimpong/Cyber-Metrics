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
    smtp: body.smtp,
  });

  return NextResponse.json({ success: true, settings: { investmentAmount: s.investmentAmount } });
}
