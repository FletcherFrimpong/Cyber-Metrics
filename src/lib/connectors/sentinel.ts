// Microsoft Sentinel: closed incidents from a Sentinel workspace, via the Azure
// Resource Manager API (learn.microsoft.com/rest/api/securityinsights/incidents/list).
//   GET  https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/
//        Microsoft.OperationalInsights/workspaces/{ws}/providers/Microsoft.SecurityInsights/incidents
//   POST .../incidents/{id}/alerts        the incident's alerts (product name, tactics)
// The app registration needs the Microsoft Sentinel Reader role on the workspace.

import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { request, expectOk } from "./http.ts";
import { getAzureToken, AZURE_APP_FIELDS } from "./microsoft-auth.ts";
import { categoriseBy } from "./product-category.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert } from "./types";

const ARM_URL = "https://management.azure.com";
const ARM_SCOPE = "https://management.azure.com/.default";
const API_VERSION = "2025-09-01";
const PAGE_SIZE = 200; // API maximum is 1000
const MAX_PAGES = 50;
const ALERT_CONCURRENCY = 5;

const CLASSIFICATION: Record<string, string> = {
  truepositive: "truePositive",
  falsepositive: "falsePositive",
  benignpositive: "informationalExpectedActivity",
  undetermined: "unknown",
};

function severityOf(value: unknown): SecurityAlert["severity"] {
  const s = String(value || "").toLowerCase();
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  if (s === "low" || s === "informational") return "Low";
  return "Medium";
}

/** Sentinel incident (+ its alerts, when fetched) → our alerts. */
export function mapSentinelIncident(incident: any, alerts: any[] = []): CategorizedAlert[] {
  const p = incident?.properties || {};
  const extra = p.additionalData || {};
  const incidentId = incident?.name || incident?.id || String(p.incidentNumber || "");
  const classification = CLASSIFICATION[String(p.classification || "").toLowerCase()] || "unknown";
  // techniques are only returned by preview API versions; read them when present
  const techniques: string[] = (extra.techniques || []).filter((t: unknown) => typeof t === "string" && t);
  const incidentTactics: string[] = (extra.tactics || []).filter(Boolean);

  const build = (id: string, title: string, description: string, product: string, sev: unknown, tactics: string[], time: string): CategorizedAlert => {
    // Analytics-rule alerts all carry the product name "Azure Sentinel", so the
    // alert and incident titles are matched too.
    const generic = /^(azure|microsoft) sentinel$/i.test(product.trim());
    const category = categoriseBy([generic ? "" : product, title, p.title], "cloud");
    const severity = severityOf(sev);
    return {
      category,
      alert: {
        id: `SENTINEL-${id}`,
        timestamp: time || p.createdTimeUtc || new Date().toISOString(),
        severity,
        category: tactics[0] || product || "Security incident",
        title: title || p.title || "Microsoft Sentinel incident",
        description: description || p.description || "",
        source: product || "Microsoft Sentinel",
        platform: "Unknown",
        rawLog: {
          incidentId: `SENTINEL-${incidentId}`,
          incidentNumber: p.incidentNumber,
          classification,
          classificationReason: p.classificationReason,
          productName: product,
          incidentUrl: p.incidentUrl,
          Confidence: null,
        },
        mitreTactics: [...new Set(tactics)],
        mitreTechniques: [...new Set(techniques)],
        iocIndicators: [],
        affectedEntities: [],
        remediationSteps: [],
        costImpact: getIncidentCost(category, severity),
        status: "Resolved",
      },
    };
  };

  if (alerts.length > 0) {
    return alerts.map((a) => {
      const ap = a?.properties || {};
      const tactics = (ap.tactics || []).filter(Boolean);
      return build(
        ap.systemAlertId || a?.name || `${incidentId}-${ap.alertDisplayName}`,
        ap.alertDisplayName,
        ap.description,
        ap.productName || (extra.alertProductNames || [])[0] || "",
        ap.severity || p.severity,
        tactics.length ? tactics : incidentTactics,
        ap.timeGenerated || ap.startTimeUtc
      );
    });
  }
  return [build(`INC-${incidentId}`, p.title, p.description, (extra.alertProductNames || []).join(" "), p.severity, incidentTactics, p.createdTimeUtc)];
}

function workspaceUrl(config: ConnectorConfig): string {
  const enc = encodeURIComponent;
  return (
    `${config.__armUrl || process.env.SF_ARM_URL || ARM_URL}/subscriptions/${enc(config.subscriptionId)}/resourceGroups/${enc(config.resourceGroup)}` +
    `/providers/Microsoft.OperationalInsights/workspaces/${enc(config.workspaceName)}/providers/Microsoft.SecurityInsights`
  );
}

export const sentinelConnector: ConnectorDefinition = {
  id: "sentinel",
  name: "Microsoft Sentinel",
  kind: "siem",
  idPrefix: "SENTINEL-",
  description: "Closed incidents and their alerts from a Sentinel workspace, across every tool connected to it.",
  docsUrl: "https://learn.microsoft.com/en-us/rest/api/securityinsights/incidents/list",
  setupSteps: [
    "Azure Portal → App registrations → New registration, then create a client secret",
    "On the Sentinel workspace's resource group: Access control (IAM) → add the role Microsoft Sentinel Reader for that app",
    "Copy the subscription ID, resource group name and workspace name from the workspace's Overview page",
  ],
  fields: [
    ...AZURE_APP_FIELDS,
    { key: "subscriptionId", label: "Subscription ID", type: "text", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
    { key: "resourceGroup", label: "Resource group", type: "text", placeholder: "rg-security", required: true },
    { key: "workspaceName", label: "Workspace name", type: "text", placeholder: "Log Analytics workspace name", required: true },
  ],

  async test(config) {
    const token = await getAzureToken(config, ARM_SCOPE);
    const res = expectOk(
      await request(`${workspaceUrl(config)}/incidents?api-version=${API_VERSION}&$top=1`, { headers: { Authorization: `Bearer ${token}` } }),
      "Microsoft Sentinel workspace (needs the Microsoft Sentinel Reader role; check subscription, resource group and workspace name)"
    );
    if (!Array.isArray(res.json()?.value)) return { ok: false, message: "Signed in, but the response was not an incident list." };
    return { ok: true, message: `Connected to Sentinel workspace ${config.workspaceName}.` };
  },

  async fetchAlerts(config, since) {
    const token = await getAzureToken(config, ARM_SCOPE);
    const headers = { Authorization: `Bearer ${token}` };
    const base = workspaceUrl(config);
    const filter = `properties/status eq 'Closed' and properties/lastModifiedTimeUtc ge ${since}`;
    let url: string | null =
      `${base}/incidents?api-version=${API_VERSION}&$filter=${encodeURIComponent(filter)}` +
      `&$orderby=${encodeURIComponent("properties/lastModifiedTimeUtc asc")}&$top=${PAGE_SIZE}`;

    const incidents: any[] = [];
    for (let page = 0; url && page < MAX_PAGES; page++) {
      const body: any = expectOk(await request(url, { headers }), "Microsoft Sentinel incidents").json();
      incidents.push(...(body?.value || []));
      url = body?.nextLink || null;
    }

    // Each incident's alerts carry the product name and tactics. If that call
    // fails for one incident, fall back to the incident's own summary.
    const out: CategorizedAlert[] = [];
    for (let i = 0; i < incidents.length; i += ALERT_CONCURRENCY) {
      const batch = incidents.slice(i, i + ALERT_CONCURRENCY);
      const alertSets = await Promise.all(
        batch.map(async (incident) => {
          try {
            const res = await request(`${base}/incidents/${encodeURIComponent(incident.name)}/alerts?api-version=${API_VERSION}`, { method: "POST", headers });
            return res.status >= 200 && res.status < 300 ? (res.json()?.value || []) : [];
          } catch {
            return [];
          }
        })
      );
      batch.forEach((incident, idx) => out.push(...mapSentinelIncident(incident, alertSets[idx])));
    }
    return out;
  },
};
