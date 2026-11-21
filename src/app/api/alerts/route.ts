import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import edrDataService from "@/lib/edr-data-service";
import { startSavedConnectors } from "@/lib/connectors/runtime";
import { integrationOf } from "@/lib/connectors/integration-of";
import { verdictFor, stageForTactic } from "@/lib/risk-model";
import type { SecurityAlert } from "@/types/alerts";

const BUCKETS = ["edr", "email", "network", "web", "cloud"] as const;
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

// GET /api/alerts?period=quarterly|yearly&quarter=Q4%202026&limit=500
// The alerts behind the dashboard for a period, newest first, as flat rows
// with the category, analyst verdict and integration each one came from.
export async function GET(request: NextRequest) {
  const auth = await requireAuth("alerts:view");
  if (isAuthError(auth)) return auth;
  startSavedConnectors();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "yearly" ? "yearly" : "quarterly";
  const now = new Date();
  const quarter = searchParams.get("quarter") || `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "", 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const quarters = period === "yearly" ? [1, 2, 3, 4].map((q) => `Q${q} ${quarter.split(" ")[1]}`) : [quarter];
  const rows: {
    id: string; timestamp: string; title: string; integration: string; source: string; category: string;
    severity: string; verdict: string; tactic: string; stage: string | null; techniques: string[];
    department: string; entities: string[]; url: string | null;
  }[] = [];
  for (const q of quarters) {
    const data = edrDataService.getTimeframeAlerts(q);
    for (const bucket of BUCKETS) {
      for (const alert of data[bucket] as SecurityAlert[]) {
        const tactics = alert.mitreTactics || [];
        const stages = tactics.map(stageForTactic).filter(Boolean) as string[];
        rows.push({
          id: alert.id,
          timestamp: alert.timestamp,
          title: alert.title,
          integration: integrationOf(alert.id),
          source: alert.source,
          category: bucket,
          severity: alert.severity,
          verdict: verdictFor(alert),
          tactic: tactics[0] || "",
          stage: stages[stages.length - 1] || null,
          techniques: alert.mitreTechniques || [],
          department: alert.department || "Unattributed",
          entities: (alert.affectedEntities || []).slice(0, 4),
          url: alert.rawLog?.alertUrl || alert.rawLog?.incidentUrl || null,
        });
      }
    }
  }
  rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0));

  const count = (key: (r: (typeof rows)[number]) => string) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(key(r), (m.get(key(r)) || 0) + 1);
    return [...m.entries()].map(([name, alerts]) => ({ name, alerts })).sort((a, b) => b.alerts - a.alerts);
  };

  return NextResponse.json({
    success: true,
    period,
    quarter,
    usingSampleData: edrDataService.getStatus().usingSampleData,
    total: rows.length,
    byIntegration: count((r) => r.integration),
    byCategory: count((r) => r.category),
    byVerdict: count((r) => r.verdict),
    alerts: rows.slice(0, limit),
  });
}
