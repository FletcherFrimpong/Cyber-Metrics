import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { calculateCostMetrics, calculateRiskSummary } from "@/lib/cost-calculations";
import { verdictFor } from "@/lib/risk-model";
import edrDataService from "@/lib/edr-data-service";
import { getSettings } from "@/lib/settings-store";
import { startSavedConnectors } from "@/lib/connectors/runtime";
import type { SecurityAlert } from "@/types/alerts";
import { ALERT_CATEGORIES, emptyByCategory } from "@/lib/connectors/types";
import { integrationOf } from "@/lib/connectors/integration-of";

const BUCKETS = ALERT_CATEGORIES;
const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;

function quartersOf(period: "quarterly" | "yearly", quarter: string): string[] {
  if (period === "quarterly") return [quarter];
  const year = quarter.split(" ")[1];
  return [1, 2, 3, 4].map((q) => `Q${q} ${year}`);
}

/** Share of the current calendar quarter that has passed, never below 5%. */
function elapsedShareOfQuarter(now: Date): number {
  const q = Math.floor(now.getUTCMonth() / 3);
  const start = Date.UTC(now.getUTCFullYear(), q * 3, 1);
  const end = Date.UTC(now.getUTCFullYear(), q * 3 + 3, 1);
  return Math.min(1, Math.max(0.05, (now.getTime() - start) / (end - start)));
}

/** The selected quarter and the three before it. */
function trailingQuarters(quarter: string): string[] {
  const m = quarter.match(/Q(\d)\s+(\d{4})/);
  let q = m ? parseInt(m[1], 10) : Math.floor(new Date().getUTCMonth() / 3) + 1;
  let y = m ? parseInt(m[2], 10) : new Date().getUTCFullYear();
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    out.unshift(`Q${q} ${y}`);
    q -= 1;
    if (q === 0) { q = 4; y -= 1; }
  }
  return out;
}

// GET /api/dashboard?period=quarterly|yearly&quarter=Q4%202026
// Everything the dashboard screens show, computed on the server from the
// alerts the data sources delivered. The browser never computes these.
export async function GET(request: NextRequest) {
  const auth = await requireAuth("dashboard:view");
  if (isAuthError(auth)) return auth;
  startSavedConnectors();

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") === "yearly" ? "yearly" : "quarterly";
    const now = new Date();
    const quarter = searchParams.get("quarter") || `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;
    const investmentAmount = getSettings().investmentAmount || 0;

    const costMetrics = await calculateCostMetrics({ period, selectedQuarter: quarter, investmentAmount });
    const risk = calculateRiskSummary({ period, selectedQuarter: quarter });

    // Alert counts for the period, by category and severity
    const byBucket = emptyByCategory<SecurityAlert>();
    for (const q of quartersOf(period, quarter)) {
      const data = edrDataService.getTimeframeAlerts(q);
      for (const b of BUCKETS) byBucket[b].push(...data[b]);
    }
    const count = (alerts: SecurityAlert[], sev: string) => alerts.filter((a) => a.severity === sev).length;
    const categories = BUCKETS.map((key) => ({
      key,
      count: byBucket[key].length,
      critical: count(byBucket[key], "Critical"),
      high: count(byBucket[key], "High"),
      medium: count(byBucket[key], "Medium"),
      low: count(byBucket[key], "Low"),
      lossAvoided: costMetrics.categoryBreakdown.find((c) => c.category === key)?.lossAvoided || 0,
    }));
    const all = BUCKETS.flatMap((b) => byBucket[b]);
    const severityCounts = Object.fromEntries(SEVERITIES.map((s) => [s, count(all, s)]));

    // Departments: alert counts, with cost taken from the risk model
    const deptMap = new Map<string, { name: string; alerts: number; critical: number; high: number; costImpact: number }>();
    for (const alert of all) {
      const name = alert.department || "Unattributed";
      const row = deptMap.get(name) || { name, alerts: 0, critical: 0, high: 0, costImpact: 0 };
      row.alerts++;
      if (alert.severity === "Critical") row.critical++;
      if (alert.severity === "High") row.high++;
      deptMap.set(name, row);
    }
    for (const d of risk.byDepartment) {
      const row = deptMap.get(d.key);
      if (row) row.costImpact = Math.round(d.expectedLossAvoided);
    }
    const departments = [...deptMap.values()].sort((a, b) => b.costImpact - a.costImpact || b.alerts - a.alerts);

    // Which integration each alert came from, so every source is visible on the dashboard
    const sourceMap = new Map<string, { source: string; alerts: number; incidents: number; lossAvoided: number }>();
    const sourceRow = (name: string) => {
      let row = sourceMap.get(name);
      if (!row) sourceMap.set(name, (row = { source: name, alerts: 0, incidents: 0, lossAvoided: 0 }));
      return row;
    };
    for (const alert of all) sourceRow(integrationOf(alert.id)).alerts++;
    for (const incident of risk.incidents) {
      if (incident.weight <= 0) continue;
      const row = sourceRow(integrationOf(incident.id.replace(/^(inc|alert):/, "")));
      row.incidents++;
      row.lossAvoided += incident.expectedLossAvoided;
    }
    const sources = [...sourceMap.values()]
      .map((r) => ({ ...r, lossAvoided: Math.round(r.lossAvoided) }))
      .sort((a, b) => b.lossAvoided - a.lossAvoided || b.alerts - a.alerts);

    // The last four quarters, side by side: volume, what analysts made of it,
    // and what the model makes of that. Feeds every trend view.
    const thisQuarter = `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;
    // A quarterly view shows the selected quarter and the three before it;
    // a yearly view shows that year's four quarters.
    const order = (q: string) => { const m = q.match(/Q(\d)\s+(\d{4})/); return m ? parseInt(m[2], 10) * 4 + parseInt(m[1], 10) : 0; };
    const trendQuarters = period === "yearly" ? quartersOf("yearly", quarter) : trailingQuarters(quarter);
    const trend = trendQuarters.map((q) => {
      const data = edrDataService.getTimeframeAlerts(q);
      const alerts = BUCKETS.flatMap((b) => data[b]);
      const r = calculateRiskSummary({ period: "quarterly", selectedQuarter: q });
      const triaged = alerts.filter((a) => verdictFor(a) !== "unverified").length;
      const share = (n: number) => (alerts.length > 0 ? Math.round((n / alerts.length) * 1000) / 10 : 0);
      return {
        quarter: q,
        /** The quarter has not finished, so its counts are still growing. */
        inProgress: q === thisQuarter,
        /** The quarter has not started yet. */
        future: order(q) > order(thisQuarter),
        /** How much of the quarter has passed (1 once it is over), for like-for-like comparisons. */
        elapsedShare: q === thisQuarter ? elapsedShareOfQuarter(now) : 1,
        alerts: alerts.length,
        critical: alerts.filter((a) => a.severity === "Critical").length,
        high: alerts.filter((a) => a.severity === "High").length,
        incidentsCounted: r.confirmedIncidents + r.unverifiedIncidents,
        confirmed: r.confirmedIncidents,
        dismissed: r.dismissedIncidents,
        truePositiveRate: share(r.countedAlerts),
        triageCoverage: share(triaged),
        controlEffectiveness: Math.round(r.controlEffectiveness.mean * 1000) / 10,
        cost: Math.round(r.lossAvoided.mean),
        byCategory: Object.fromEntries(BUCKETS.map((b) => [b, data[b].length])),
      };
    });

    const status = edrDataService.getStatus();
    return NextResponse.json({
      success: true,
      period,
      quarter,
      usingSampleData: status.usingSampleData,
      costMetrics,
      totalAlerts: all.length,
      categories,
      severityCounts,
      departments,
      sources,
      trend,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
