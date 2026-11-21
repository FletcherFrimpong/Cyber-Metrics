// CrowdStrike Falcon: closed alerts via the Alerts API.
// Endpoints and field names follow CrowdStrike's developer site and its
// falconpy / gofalcon SDKs (developer.crowdstrike.com/api-reference/collections/alerts).
//   POST {base}/oauth2/token                  form: client_id, client_secret  → 201 { access_token }
//   POST {base}/alerts/combined/alerts/v1     json: { filter, sort, limit, after }
// The older Detects API is deprecated and is not used.

import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { request, expectOk } from "./http.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert, AlertCategory } from "./types";

export const CROWDSTRIKE_CLOUDS: Record<string, string> = {
  "us-1": "https://api.crowdstrike.com",
  "us-2": "https://api.us-2.crowdstrike.com",
  "eu-1": "https://api.eu-1.crowdstrike.com",
  "us-gov-1": "https://api.laggar.gcw.crowdstrike.com",
};

const PAGE_SIZE = 1000; // API maximum for the combined endpoint
const MAX_PAGES = 20;

// Falcon product that raised the alert → our category.
const PRODUCT_CATEGORY: Record<string, AlertCategory> = {
  cwpp: "cloud",
  idp: "identity",
  "data-protection": "cloud",
};

const RESOLUTION: Record<string, string> = {
  true_positive: "truePositive",
  false_positive: "falsePositive",
  ignored: "informationalExpectedActivity",
};

function severityFor(alert: any): SecurityAlert["severity"] {
  const name = String(alert?.severity_name || "").toLowerCase();
  if (name === "critical") return "Critical";
  if (name === "high") return "High";
  if (name === "medium") return "Medium";
  if (name === "low" || name === "informational") return "Low";
  const n = Number(alert?.severity);
  if (!isFinite(n)) return "Medium";
  return n >= 80 ? "Critical" : n >= 60 ? "High" : n >= 40 ? "Medium" : "Low";
}

/** Analyst verdict: the `resolution` field where present, otherwise the same value carried as a tag. */
function resolutionOf(alert: any): string {
  const direct = String(alert?.resolution || "").toLowerCase();
  if (RESOLUTION[direct]) return RESOLUTION[direct];
  for (const tag of alert?.tags || []) {
    const t = String(tag).toLowerCase();
    if (RESOLUTION[t]) return RESOLUTION[t];
  }
  return "unknown";
}

export function mapCrowdStrikeAlert(alert: any): CategorizedAlert {
  const product = String(alert?.product || "").toLowerCase();
  const category = PRODUCT_CATEGORY[product] || "edr";
  const severity = severityFor(alert);

  const tactics = new Set<string>();
  const techniques = new Set<string>();
  if (alert?.tactic) tactics.add(alert.tactic);
  if (alert?.technique_id) techniques.add(alert.technique_id);
  for (const m of alert?.mitre_attack || []) {
    if (m?.tactic) tactics.add(m.tactic);
    if (m?.technique_id) techniques.add(m.technique_id);
  }
  const confidence = Number(alert?.confidence);
  const id = String(alert?.composite_id || alert?.id || "");

  return {
    category,
    alert: {
      id: `CS-${id}`,
      timestamp: alert?.created_timestamp || alert?.timestamp || new Date().toISOString(),
      severity,
      category: alert?.tactic || alert?.name || "Falcon alert",
      title: alert?.display_name || alert?.name || "CrowdStrike Falcon alert",
      description: alert?.description || "",
      source: "CrowdStrike Falcon",
      platform: alert?.device?.platform_name || "Unknown",
      rawLog: {
        alertId: id,
        incidentId: alert?.aggregate_id ? `CS-${alert.aggregate_id}` : undefined,
        classification: resolutionOf(alert),
        product,
        status: alert?.status,
        alertUrl: alert?.falcon_host_link,
        Confidence: isFinite(confidence) ? confidence : null,
      },
      mitreTactics: [...tactics],
      mitreTechniques: [...techniques],
      iocIndicators: [alert?.sha256, alert?.filename].filter(Boolean),
      affectedEntities: [alert?.device?.hostname, alert?.user_name].filter(Boolean),
      remediationSteps: [],
      costImpact: getIncidentCost(category, severity),
      confidence: isFinite(confidence) ? confidence : undefined,
      status: "Resolved",
    },
  };
}

function baseUrl(config: ConnectorConfig): string {
  // __baseUrl is a test hook; the API only accepts the declared fields, so it cannot be set from outside.
  return config.__baseUrl || process.env.SF_CROWDSTRIKE_URL || CROWDSTRIKE_CLOUDS[config.cloud] || CROWDSTRIKE_CLOUDS["us-1"];
}

async function getToken(config: ConnectorConfig): Promise<string> {
  const res = expectOk(
    await request(`${baseUrl(config)}/oauth2/token`, {
      form: { client_id: config.clientId, client_secret: config.clientSecret },
    }),
    "CrowdStrike sign-in",
    true
  );
  const token = res.json()?.access_token;
  if (!token) throw new Error("CrowdStrike sign-in returned no access token");
  return token;
}

export const crowdStrikeConnector: ConnectorDefinition = {
  id: "crowdstrike",
  name: "CrowdStrike Falcon",
  kind: "tool",
  idPrefix: "CS-",
  description: "Closed alerts from CrowdStrike Falcon (endpoint, identity and cloud workload products).",
  docsUrl: "https://developer.crowdstrike.com/api-reference/collections/alerts/",
  setupSteps: [
    "In the Falcon console, open Support and resources → API clients and keys",
    "Create an API client with the scope Alerts: Read",
    "Copy the Client ID and Secret (the secret is shown once)",
    "Pick the cloud region your Falcon console runs in",
  ],
  fields: [
    {
      key: "cloud",
      label: "Cloud region",
      type: "select",
      required: true,
      default: "us-1",
      options: [
        { value: "us-1", label: "US-1 (api.crowdstrike.com)" },
        { value: "us-2", label: "US-2" },
        { value: "eu-1", label: "EU-1" },
        { value: "us-gov-1", label: "US-GOV-1" },
      ],
    },
    { key: "clientId", label: "Client ID", type: "text", placeholder: "API client ID", required: true },
    { key: "clientSecret", label: "Client secret", type: "password", placeholder: "API client secret", required: true },
  ],

  async test(config) {
    const token = await getToken(config);
    const res = expectOk(
      await request(`${baseUrl(config)}/alerts/queries/alerts/v2?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      "CrowdStrike alerts (needs the Alerts: Read scope)"
    );
    const total = res.json()?.meta?.pagination?.total;
    return { ok: true, message: `Connected to CrowdStrike Falcon${typeof total === "number" ? ` (${total} alerts visible)` : ""}.` };
  },

  async fetchAlerts(config, since) {
    const token = await getToken(config);
    const out: CategorizedAlert[] = [];
    let after: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const body = expectOk(
        await request(`${baseUrl(config)}/alerts/combined/alerts/v1`, {
          headers: { Authorization: `Bearer ${token}` },
          json: {
            filter: `status:'closed'+updated_timestamp:>'${since}'`,
            sort: "created_timestamp|asc",
            limit: PAGE_SIZE,
            ...(after ? { after } : {}),
          },
        }),
        "CrowdStrike alerts"
      ).json();
      for (const alert of body?.resources || []) out.push(mapCrowdStrikeAlert(alert));
      after = body?.meta?.pagination?.after;
      if (!after || (body?.resources || []).length === 0) break;
    }
    return out;
  },
};
