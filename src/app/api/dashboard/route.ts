import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { calculateCostMetrics, calculateRiskSummary } from "@/lib/cost-calculations";
import edrDataService from "@/lib/edr-data-service";
import { getSettings } from "@/lib/settings-store";
import { startSavedConnectors } from "@/lib/connectors/runtime";
import type { SecurityAlert } from "@/types/alerts";
import { integrationOf } from "@/lib/connectors/integration-of";

const BUCKETS = ["edr", "email", "network", "web", "cloud"] as const;
const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;

function quartersOf(period: "quarterly" | "yearly", quarter: string): string[] {
  if (period === "quarterly") return [quarter];
  const year = quarter.split(" ")[1];
  return [1, 2, 3, 4].map((q) => `Q${q} ${year}`);
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
    const byBucket: Record<string, SecurityAlert[]> = { edr: [], email: [], network: [], web: [], cloud: [] };
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

    // Loss avoided and alert volume for the last four quarters
    const trend = trailingQuarters(quarter).map((q) => {
      const data = edrDataService.getTimeframeAlerts(q);
      return {
        quarter: q,
        alerts: BUCKETS.reduce((sum, b) => sum + data[b].length, 0),
        cost: Math.round(calculateRiskSummary({ period: "quarterly", selectedQuarter: q }).lossAvoided.mean),
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
