// Palo Alto Networks Cortex XDR: resolved incidents.
// Follows the Cortex XDR API reference (cortex-docs.paloaltonetworks.com/xdr-3-api)
// and Palo Alto's own open-source client (demisto/content, CortexXDRIR).
//   POST https://api-{fqdn}/public_api/v1/incidents/get_incidents
//   headers: x-xdr-auth-id, Authorization; advanced keys add x-xdr-nonce and
//   x-xdr-timestamp, with Authorization = SHA-256(api_key + nonce + timestamp).
// Cortex XSIAM uses the same authentication, but its current reference lists a
// different incident endpoint; this connector is verified for XDR only.

import { createHash, randomBytes } from "node:crypto";
import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { request, expectOk, normaliseBaseUrl } from "./http.ts";
import { categoriseBy } from "./product-category.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert, AlertCategory } from "./types";

const PAGE_SIZE = 100;   // the API's page cap
const MAX_RESULTS = 10000; // total_count is capped at 10,000

// Resolution status → the classification values the risk model reads.
const STATUS_VERDICT: Record<string, string> = {
  resolved_true_positive: "truePositive",
  resolved_threat_handled: "truePositive",
  resolved_false_positive: "falsePositive",
  resolved_known_issue: "informationalExpectedActivity",
  resolved_security_testing: "informationalExpectedActivity",
  resolved_duplicate: "informationalExpectedActivity",
  resolved_duplicate_incident: "informationalExpectedActivity",
  // resolved_other, resolved_auto, resolved_auto_resolve: no verdict
};

function severityOf(incident: any): SecurityAlert["severity"] {
  const s = String(incident?.manual_severity || incident?.severity || "").toLowerCase();
  if (s === "critical") return "Critical";
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  if (s === "low" || s === "informational") return "Low";
  return "Medium";
}

function categoryOf(incident: any): AlertCategory {
  const sources = (incident?.incident_sources || []).join(" ").toLowerCase();
  // The product that raised the incident decides first.
  if (/xdr agent|\bagent\b/.test(sources)) return "edr";
  if (/ngfw|firewall|pan-?os|\bpalo\b|prisma access/.test(sources)) return "network";
  if (/prisma cloud|cloud/.test(sources)) return "cloud";
  return categoriseBy([sources, (incident?.alert_categories || []).join(" "), incident?.description], "edr");
}

/** "TA0005 - Defense Evasion" → "Defense Evasion";  "T1036.005 - Masquerading: ..." → "T1036.005" */
const afterDash = (v: string) => (v.includes(" - ") ? v.slice(v.indexOf(" - ") + 3) : v).trim();
const beforeDash = (v: string) => v.split(" - ")[0].trim();

export function isResolved(incident: any): boolean {
  return String(incident?.status || "").toLowerCase().startsWith("resolved");
}

export function mapCortexIncident(incident: any): CategorizedAlert {
  const category = categoryOf(incident);
  const severity = severityOf(incident);
  const status = String(incident?.status || "").toLowerCase();
  const id = String(incident?.incident_id ?? "");
  const created = Number(incident?.creation_time);

  return {
    category,
    alert: {
      id: `CORTEX-${id}`,
      timestamp: isFinite(created) && created > 0 ? new Date(created).toISOString() : new Date().toISOString(),
      severity,
      category: (incident?.alert_categories || [])[0] || "Cortex XDR incident",
      title: incident?.incident_name || incident?.description || `Cortex XDR incident ${id}`,
      description: incident?.manual_description || incident?.description || "",
      source: "Palo Alto Cortex XDR",
      platform: "Unknown",
      rawLog: {
        incidentId: `CORTEX-${id}`,
        classification: STATUS_VERDICT[status] || "unknown",
        status: incident?.status,
        resolveComment: incident?.resolve_comment,
        incidentSources: incident?.incident_sources,
        alertCount: incident?.alert_count,
        incidentUrl: incident?.xdr_url,
        Confidence: null,
      },
      mitreTactics: [...new Set((incident?.mitre_tactics_ids_and_names || []).filter(Boolean).map((v: string) => afterDash(String(v))))] as string[],
      mitreTechniques: [...new Set((incident?.mitre_techniques_ids_and_names || []).filter(Boolean).map((v: string) => beforeDash(String(v))))] as string[],
      iocIndicators: [],
      // hosts look like "name:endpoint_id"; keep the name
      affectedEntities: [
        ...(incident?.hosts || []).filter(Boolean).map((h: string) => String(h).split(":")[0]),
        ...(incident?.users || []).filter(Boolean).map(String),
      ],
      remediationSteps: [],
      costImpact: getIncidentCost(category, severity),
      status: "Resolved",
    },
  };
}

export function cortexHeaders(config: ConnectorConfig, now = Date.now(), nonce = randomNonce()): Record<string, string> {
  if (config.keyType === "standard") {
    return { "x-xdr-auth-id": config.keyId, Authorization: config.apiKey };
  }
  const timestamp = String(now);
  return {
    "x-xdr-auth-id": config.keyId,
    "x-xdr-nonce": nonce,
    "x-xdr-timestamp": timestamp,
    Authorization: createHash("sha256").update(`${config.apiKey}${nonce}${timestamp}`, "utf8").digest("hex"),
  };
}

function randomNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(64);
  let out = "";
  for (let i = 0; i < 64; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function getIncidents(config: ConnectorConfig, sinceMs: number, from: number, to: number) {
  const res = await request(`${normaliseBaseUrl(config.apiUrl)}/public_api/v1/incidents/get_incidents`, {
    headers: cortexHeaders(config),
    json: {
      request_data: {
        filters: [{ field: "modification_time", operator: "gte", value: sinceMs }],
        search_from: from,
        search_to: to,
        sort: { field: "modification_time", keyword: "asc" },
      },
    },
  });
  if (res.status === 401) {
    throw new Error("Cortex XDR: HTTP 401, credentials were rejected. Check the key ID, the key, and that the key type (Standard or Advanced) matches; a server clock that is out of sync also causes this.");
  }
  return expectOk(res, "Cortex XDR incidents (the key's role needs Alerts And Incidents: View)").json()?.reply || {};
}

export const cortexConnector: ConnectorDefinition = {
  id: "cortex",
  name: "Palo Alto Cortex XDR",
  kind: "tool",
  idPrefix: "CORTEX-",
  description: "Resolved incidents from Cortex XDR, with the analyst's resolution status and MITRE mapping.",
  docsUrl: "https://cortex-docs.paloaltonetworks.com/xdr-3-api/get-started-with-cortex-xdr-apis.md",
  setupSteps: [
    "In Cortex XDR, open Settings → Configurations → API Keys and create a key with a role that can view alerts and incidents (for example Viewer)",
    "Note the key's ID and whether it is Standard or Advanced",
    "Click Copy URL on that page for your API URL, which looks like https://api-yourtenant.xdr.us.paloaltonetworks.com",
  ],
  fields: [
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://api-yourtenant.xdr.us.paloaltonetworks.com", required: true },
    { key: "keyId", label: "API key ID", type: "text", placeholder: "e.g. 12", required: true },
    { key: "apiKey", label: "API key", type: "password", placeholder: "API key", required: true },
    {
      key: "keyType",
      label: "Key type",
      type: "select",
      required: true,
      default: "advanced",
      options: [
        { value: "advanced", label: "Advanced" },
        { value: "standard", label: "Standard" },
      ],
    },
  ],

  async test(config) {
    const reply = await getIncidents(config, 0, 0, 1);
    const total = reply?.total_count;
    return { ok: true, message: `Connected to Cortex XDR${typeof total === "number" ? ` (${total} incidents visible)` : ""}.` };
  },

  async fetchAlerts(config, since) {
    const sinceMs = new Date(since).getTime();
    const out: CategorizedAlert[] = [];
    for (let from = 0; from < MAX_RESULTS; from += PAGE_SIZE) {
      const reply = await getIncidents(config, sinceMs, from, from + PAGE_SIZE);
      const incidents: any[] = reply?.incidents || [];
      // The status filter takes one value at a time, so resolved incidents are picked here.
      for (const incident of incidents) if (isResolved(incident)) out.push(mapCortexIncident(incident));
      if (incidents.length < PAGE_SIZE) break;
    }
    return out;
  },
};
