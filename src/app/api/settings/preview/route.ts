import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { calculateCostMetrics } from "@/lib/cost-calculations";
import { getRevenueBand, DEFAULT_REVENUE_BAND } from "@/lib/anchor-data.ts";
import { startSavedConnectors } from "@/lib/connectors/runtime";
import edrDataService from "@/lib/edr-data-service";

// POST /api/settings/preview
// What the General settings would produce for the current year, WITHOUT saving
// them. Lets the settings page show the effect of a change before it is made.
export async function POST(request: NextRequest) {
  const auth = await requireAuth("settings:view");
  if (isAuthError(auth)) return auth;
  startSavedConnectors();

  const body = await request.json().catch(() => ({}));
  const org = body?.organisation || {};
  const investmentAmount = Math.max(0, Number(body?.investmentAmount) || 0);
  const typical = Number(org.typicalControlEffectiveness);
  const now = new Date();
  const quarter = `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;

  const m = await calculateCostMetrics({
    period: "yearly",
    selectedQuarter: quarter,
    investmentAmount,
    profileOverride: {
      revenueBand: typeof org.revenueBand === "string" && org.revenueBand ? org.revenueBand : null,
      lossEventsLast12Months: Math.max(0, Math.floor(Number(org.lossEventsLast12Months) || 0)),
      typicalControlEffectiveness: isFinite(typical) && typical > 0 ? typical : null,
    },
  });
  const band = getRevenueBand(org.revenueBand) ?? DEFAULT_REVENUE_BAND;
  const pct = (x: number) => Math.round(x * 1000) / 10;

  return NextResponse.json({
    success: true,
    year: now.getUTCFullYear(),
    usingSampleData: edrDataService.getStatus().usingSampleData,
    // Published figures for the chosen size
    band: {
      label: band.label,
      assumed: m.profileAssumed,
      eventProbability: pct(band.annualEventProbability),
      eventProbabilityLow: pct(band.annualEventProbabilityLow ?? band.annualEventProbability),
      eventProbabilityHigh: pct(band.annualEventProbabilityHigh ?? band.annualEventProbability),
      typicalLoss: band.lossMedian,
      severeLoss: band.lossP95,
    },
    // What the model makes of them, for a full year
    result: {
      typicalControlEffectiveness: m.typicalControlEffectiveness,
      exposure: m.exposure,
      controlEffectiveness: m.controlEffectiveness,
      lossAvoided: m.totalCostImpact,
      lossAvoidedLow: m.lossAvoidedLow,
      lossAvoidedHigh: m.lossAvoidedHigh,
      residualLoss: m.residualLoss,
      lossProbabilityWithoutControls: m.lossProbabilityWithoutControls,
      lossProbabilityWithControls: m.lossProbabilityWithControls,
      investment: m.totalInvestment,
      netBenefit: m.netBenefit,
      roi: m.roi,
      incidentsCounted: m.confirmedIncidents + m.unverifiedIncidents,
    },
  });
}
