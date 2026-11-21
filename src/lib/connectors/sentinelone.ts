// SentinelOne Management Console API v2.1: resolved threats.
// The official reference sits behind console login; endpoint, parameters and
// field names here follow the open-source Cortex XSOAR and Elastic integrations.
//   GET {console}/web/api/v2.1/threats   header  Authorization: ApiToken <token>

import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { request, expectOk, normaliseBaseUrl } from "./http.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert } from "./types";

const PAGE_SIZE = 200; // API maximum is 1000
const MAX_PAGES = 50;

// Analyst verdict → the classification values the risk model reads.
const VERDICT: Record<string, string> = {
  true_positive: "truePositive",
  false_positive: "falsePositive",
  suspicious: "unknown",
  undefined: "unknown",
};

/**
 * SentinelOne threats carry no severity. This is OUR convention, not the
 * vendor's: the engine's confidence level stands in for it.
 */
function severityFor(confidenceLevel: string): SecurityAlert["severity"] {
  if (confidenceLevel === "malicious") return "High";
  if (confidenceLevel === "suspicious") return "Medium";
  return "Low";
}

export function mapSentinelOneThreat(threat: any): SecurityAlert {
  const info = threat?.threatInfo || {};
  const agent = threat?.agentRealtimeInfo || {};
  const tactics = new Set<string>();
  const techniques = new Set<string>();
  for (const indicator of threat?.indicators || []) {
    for (const tactic of indicator?.tactics || []) {
      if (tactic?.name) tactics.add(tactic.name);
      for (const technique of tactic?.techniques || []) {
        // The technique "name" holds the ATT&CK id, e.g. "T1059".
        if (technique?.name) techniques.add(technique.name);
      }
    }
  }
  const severity = severityFor(String(info.confidenceLevel || "").toLowerCase());
  const id = String(threat?.id || info.threatId || "");
  const entities = [agent.agentComputerName, info.processUser].filter(Boolean);

  return {
    id: `S1-${id}`,
    timestamp: info.createdAt || info.identifiedAt || info.updatedAt || new Date().toISOString(),
    severity,
    category: info.classification || "Threat",
    title: info.threatName || "SentinelOne threat",
    description: `${info.classification || "Threat"} detected by SentinelOne${agent.agentComputerName ? ` on ${agent.agentComputerName}` : ""}`,
    source: "SentinelOne",
    platform: agent.agentOsName || agent.agentOsType || "Unknown",
    rawLog: {
      threatId: id,
      classification: VERDICT[String(info.analystVerdict || "undefined").toLowerCase()] || "unknown",
      analystVerdict: info.analystVerdict,
      confidenceLevel: info.confidenceLevel,
      incidentStatus: info.incidentStatus,
      mitigationStatus: info.mitigationStatus,
      storyline: info.storyline,
      Confidence: null,
    },
    mitreTactics: [...tactics],
    mitreTechniques: [...techniques],
    iocIndicators: [info.sha256, info.sha1, info.filePath].filter(Boolean),
    affectedEntities: entities,
    remediationSteps: [],
    costImpact: getIncidentCost("edr", severity),
    status: "Resolved",
  };
}

function client(config: ConnectorConfig) {
  const base = `${normaliseBaseUrl(config.consoleUrl)}/web/api/v2.1`;
  const headers = { Authorization: `ApiToken ${config.apiToken}` };
  return (path: string) => request(`${base}${path}`, { headers });
}

export const sentinelOneConnector: ConnectorDefinition = {
  id: "sentinelone",
  name: "SentinelOne",
  kind: "tool",
  idPrefix: "S1-",
  description: "Resolved threats from the SentinelOne Singularity console (endpoint alerts only).",
  docsUrl: "https://www.elastic.co/docs/reference/integrations/sentinel_one",
  setupSteps: [
    "In the SentinelOne console, create a Service User (Settings → Users → Service Users) with the Viewer role",
    "Copy the API token shown once at creation",
    "Enter your console URL, for example https://yourcompany.sentinelone.net",
  ],
  fields: [
    { key: "consoleUrl", label: "Console URL", type: "text", placeholder: "https://yourcompany.sentinelone.net", required: true },
    { key: "apiToken", label: "API token", type: "password", placeholder: "Service user API token", required: true },
  ],

  async test(config) {
    const res = expectOk(await client(config)("/threats?limit=1"), "SentinelOne");
    const body = res.json();
    if (!Array.isArray(body?.data)) return { ok: false, message: "Connected, but the response was not a threat list. Check the console URL." };
    const total = body?.pagination?.totalItems;
    return { ok: true, message: `Connected to SentinelOne${typeof total === "number" ? ` (${total} threats visible)` : ""}.` };
  },

  async fetchAlerts(config, since) {
    const get = client(config);
    const out: CategorizedAlert[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({
        incidentStatuses: "resolved",
        updatedAt__gte: since,
        sortBy: "updatedAt",
        sortOrder: "asc",
        limit: String(PAGE_SIZE),
      });
      if (cursor) params.set("cursor", cursor);
      const body = expectOk(await get(`/threats?${params}`), "SentinelOne threats").json();
      for (const threat of body?.data || []) {
        out.push({ category: "edr", alert: mapSentinelOneThreat(threat) });
      }
      cursor = body?.pagination?.nextCursor || null;
      if (!cursor) break;
    }
    return out;
  },
};
