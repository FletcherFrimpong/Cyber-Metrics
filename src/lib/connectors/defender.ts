// Microsoft Defender XDR: resolved incidents with their alerts, via the
// Microsoft Graph security API (learn.microsoft.com/graph/api/security-list-incidents).
//   GET https://graph.microsoft.com/v1.0/security/incidents
//       ?$filter=status eq 'resolved' and lastUpdateDateTime ge {iso}&$expand=alerts
// This is the Defender XDR incident queue. Sentinel incidents appear in it only
// when Sentinel has been onboarded to the Defender portal; otherwise use the
// Microsoft Sentinel connector.

import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { DepartmentResolver } from "../department-resolver.ts";
import { request, expectOk } from "./http.ts";
import { getAzureToken, AZURE_APP_FIELDS } from "./microsoft-auth.ts";
import { categoriseBy } from "./product-category.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert, AlertCategory } from "./types";

const GRAPH_URL = "https://graph.microsoft.com/v1.0";
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
// SF_GRAPH_URL: sovereign clouds (e.g. https://graph.microsoft.us/v1.0) and test servers
const graphUrl = (config: ConnectorConfig) => config.__graphUrl || process.env.SF_GRAPH_URL || GRAPH_URL;
const PAGE_SIZE = 50;
const MAX_PAGES = 100;

// Which Defender service raised the alert → our category.
const SERVICE_CATEGORY: Record<string, AlertCategory> = {
  microsoftdefenderforendpoint: "edr",
  microsoftdefenderforoffice365: "email",
  microsoftdefenderforcloudapps: "cloud",
  microsoftdefenderforcloud: "cloud",
  microsoftdefenderforidentity: "identity",
  azureadidentityprotection: "identity",
  microsoftappgovernance: "cloud",
  datalossprevention: "cloud",
};

function severityOf(value: unknown): SecurityAlert["severity"] {
  const s = String(value || "").toLowerCase();
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  if (s === "low" || s === "informational") return "Low";
  return "Medium";
}

function categoryOf(alert: any): AlertCategory {
  const service = String(alert?.serviceSource || "").toLowerCase();
  if (SERVICE_CATEGORY[service]) return SERVICE_CATEGORY[service];
  // Sentinel-sourced and other alerts: go by the product that raised them.
  const product = /^(azure|microsoft) sentinel$/i.test(String(alert?.productName || "").trim()) ? "" : alert?.productName || "";
  return categoriseBy([product, alert?.title], "cloud");
}

/** Flatten the fields we use out of the typed evidence objects. */
export function readEvidence(alert: any) {
  const entities: string[] = [];
  const iocs: string[] = [];
  const forDepartment: { userPrincipalName?: string; accountName?: string; deviceDnsName?: string; deviceName?: string }[] = [];
  let platform = "Unknown";
  for (const ev of alert?.evidence || []) {
    const user = ev?.userAccount;
    if (user?.userPrincipalName || user?.accountName) {
      entities.push(user.userPrincipalName || user.accountName);
      forDepartment.push({ userPrincipalName: user.userPrincipalName, accountName: user.accountName });
    }
    const device = ev?.deviceDnsName || ev?.hostName;
    if (device) {
      entities.push(device);
      forDepartment.push({ deviceDnsName: ev.deviceDnsName, deviceName: ev.hostName || ev.deviceDnsName });
      if (ev.osPlatform) platform = ev.osPlatform;
    }
    if (ev?.ipAddress) iocs.push(ev.ipAddress);
    if (ev?.url) iocs.push(ev.url);
    if (ev?.fileDetails?.fileName) iocs.push(ev.fileDetails.fileName);
    if (ev?.fileDetails?.sha256) iocs.push(ev.fileDetails.sha256);
  }
  return { entities: [...new Set(entities)], iocs: [...new Set(iocs)], forDepartment, platform };
}

export function mapDefenderAlert(alert: any, incident: any): CategorizedAlert {
  const category = categoryOf(alert);
  const severity = severityOf(alert?.severity ?? incident?.severity);
  // `categories` replaces the deprecated single `category`; both hold ATT&CK tactic names.
  const tactics: string[] = (Array.isArray(alert?.categories) && alert.categories.length ? alert.categories : [alert?.category]).filter(Boolean);
  // mitreTechniques is a plain string collection, e.g. ["T1546.003"].
  const techniques: string[] = (alert?.mitreTechniques || []).filter((t: unknown) => typeof t === "string" && t);
  const ev = readEvidence(alert);

  return {
    category,
    alert: {
      id: `DEFENDER-${alert?.id}`,
      timestamp: alert?.createdDateTime || incident?.createdDateTime || new Date().toISOString(),
      severity,
      category: tactics[0] || alert?.serviceSource || "Security alert",
      title: alert?.title || incident?.displayName || "Microsoft Defender alert",
      description: alert?.description || incident?.description || "",
      source: alert?.productName || "Microsoft Defender XDR",
      platform: ev.platform,
      rawLog: {
        incidentId: `DEFENDER-${incident?.id}`,
        alertId: alert?.id,
        classification: incident?.classification,
        determination: incident?.determination,
        alertClassification: alert?.classification,
        alertDetermination: alert?.determination,
        serviceSource: alert?.serviceSource,
        productName: alert?.productName,
        incidentUrl: incident?.incidentWebUrl,
        alertUrl: alert?.alertWebUrl,
        Confidence: null,
      },
      mitreTactics: [...new Set(tactics)],
      mitreTechniques: [...new Set(techniques)],
      iocIndicators: ev.iocs,
      affectedEntities: ev.entities,
      remediationSteps: alert?.recommendedActions
        ? String(alert.recommendedActions).split(/[.\n]/).map((s: string) => s.trim()).filter(Boolean)
        : [],
      costImpact: getIncidentCost(category, severity),
      status: "Resolved",
    },
  };
}

/** One incident → its alerts. An incident with no alerts yields a single alert from the incident itself. */
export function mapDefenderIncident(incident: any): CategorizedAlert[] {
  const alerts: any[] = incident?.alerts || [];
  if (alerts.length > 0) return alerts.map((a) => mapDefenderAlert(a, incident));
  const severity = severityOf(incident?.severity);
  return [{
    category: "cloud",
    alert: {
      id: `DEFENDER-INC-${incident?.id}`,
      timestamp: incident?.createdDateTime || new Date().toISOString(),
      severity,
      category: "Security incident",
      title: incident?.displayName || "Microsoft Defender incident",
      description: incident?.description || "",
      source: "Microsoft Defender XDR",
      platform: "Unknown",
      rawLog: { incidentId: `DEFENDER-${incident?.id}`, classification: incident?.classification, determination: incident?.determination, incidentUrl: incident?.incidentWebUrl, Confidence: null },
      mitreTactics: [],
      mitreTechniques: [],
      iocIndicators: [],
      affectedEntities: [],
      remediationSteps: [],
      costImpact: getIncidentCost("cloud", severity),
      status: "Resolved",
    },
  }];
}

// One resolver (and its 24-hour cache) per tenant.
const resolvers = new Map<string, DepartmentResolver>();

async function attachDepartments(config: ConnectorConfig, incident: any, mapped: CategorizedAlert[]): Promise<void> {
  if (config.__graphUrl) return; // test server: the resolver talks to the real Graph
  let resolver = resolvers.get(config.tenantId);
  if (!resolver) {
    resolver = new DepartmentResolver(() => getAzureToken(config, GRAPH_SCOPE));
    resolvers.set(config.tenantId, resolver);
  }
  const alerts: any[] = incident?.alerts || [];
  for (let i = 0; i < mapped.length; i++) {
    try {
      const evidence = alerts[i] ? readEvidence(alerts[i]).forDepartment : [];
      mapped[i].alert.department = evidence.length ? (await resolver.resolve(evidence)).department : "Unattributed";
    } catch {
      mapped[i].alert.department = "Unattributed";
    }
  }
}

export const defenderConnector: ConnectorDefinition = {
  id: "defender",
  name: "Microsoft Defender XDR",
  kind: "siem",
  idPrefix: "DEFENDER-",
  description: "Resolved incidents from the Defender portal: Defender for Endpoint, Office 365, Identity, Cloud Apps, and Sentinel if it is onboarded there.",
  docsUrl: "https://learn.microsoft.com/en-us/graph/api/security-list-incidents?view=graph-rest-1.0",
  setupSteps: [
    "Azure Portal → App registrations → New registration",
    "API permissions → Microsoft Graph → Application: SecurityIncident.Read.All and SecurityAlert.Read.All",
    "Optional, for department attribution: User.Read.All and Device.Read.All",
    "Grant admin consent, then create a client secret under Certificates & secrets",
  ],
  fields: AZURE_APP_FIELDS,

  async test(config) {
    const token = await getAzureToken(config, GRAPH_SCOPE);
    const res = expectOk(
      await request(`${graphUrl(config)}/security/incidents?$top=1`, { headers: { Authorization: `Bearer ${token}` } }),
      "Microsoft Graph incidents (needs SecurityIncident.Read.All)"
    );
    if (!Array.isArray(res.json()?.value)) return { ok: false, message: "Signed in, but the response was not an incident list." };
    return { ok: true, message: "Connected to Microsoft Defender XDR." };
  },

  async fetchAlerts(config, since) {
    const token = await getAzureToken(config, GRAPH_SCOPE);
    const headers = { Authorization: `Bearer ${token}` };
    const filter = `status eq 'resolved' and lastUpdateDateTime ge ${since}`;
    let url: string | null =
      `${graphUrl(config)}/security/incidents?$filter=${encodeURIComponent(filter)}&$expand=alerts&$top=${PAGE_SIZE}`;
    const out: CategorizedAlert[] = [];
    for (let page = 0; url && page < MAX_PAGES; page++) {
      const body: any = expectOk(await request(url, { headers }), "Microsoft Defender incidents").json();
      for (const incident of body?.value || []) {
        const mapped = mapDefenderIncident(incident);
        await attachDepartments(config, incident, mapped);
        out.push(...mapped);
      }
      url = body?.["@odata.nextLink"] || null;
    }
    return out;
  },
};
