// IBM QRadar SIEM: closed offenses.
// Follows IBM's QRadar REST API reference and IBM/api-samples.
//   GET https://{console}/api/siem/offenses?filter=status=CLOSED and last_persisted_time>{ms}
//   headers: SEC: <authorized service token>, Range: items=0-99
//   GET https://{console}/api/siem/offense_closing_reasons   closing reason id → text
// An offense has no true/false-positive field and no MITRE fields: the only
// analyst signal is its closing reason, and its weight falls back to severity.

import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { request, expectOk, normaliseBaseUrl } from "./http.ts";
import { categoriseBy } from "./product-category.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert } from "./types";

const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const FIELDS = "id,description,status,severity,magnitude,start_time,last_persisted_time,close_time,closing_reason_id,categories,offense_source,log_sources,event_count";

/**
 * Closing reason text → classification. QRadar ships "False-Positive, Tuned",
 * "Non-Issue" and "Policy Violation"; customers add their own. Only a reason
 * that says the offense was a real incident counts as a true positive.
 */
export function classifyClosingReason(text: string | undefined): string {
  const t = String(text || "").toLowerCase();
  if (!t) return "unknown";
  if (/false[\s-]*positive/.test(t)) return "falsePositive";
  if (/non[\s-]*issue|benign|duplicate|testing|expected/.test(t)) return "informationalExpectedActivity";
  if (/true[\s-]*positive|confirmed|real incident|malicious|compromise|breach/.test(t)) return "truePositive";
  return "unknown";
}

function severityOf(value: unknown): SecurityAlert["severity"] {
  const n = Number(value);
  if (!isFinite(n)) return "Medium";
  return n >= 8 ? "Critical" : n >= 6 ? "High" : n >= 4 ? "Medium" : "Low";
}

export function mapQRadarOffense(offense: any, closingReasons: Record<string, string> = {}): CategorizedAlert {
  const logSources = (offense?.log_sources || []).map((l: any) => `${l?.type_name || ""} ${l?.name || ""}`).join(" ");
  const categories: string[] = (offense?.categories || []).filter(Boolean);
  const category = categoriseBy([logSources, categories.join(" "), offense?.description], "network");
  const severity = severityOf(offense?.severity);
  const reason = closingReasons[String(offense?.closing_reason_id)];
  const start = Number(offense?.start_time);

  return {
    category,
    alert: {
      id: `QRADAR-${offense?.id}`,
      timestamp: isFinite(start) && start > 0 ? new Date(start).toISOString() : new Date().toISOString(),
      severity,
      category: categories[0] || "Offense",
      title: String(offense?.description || `QRadar offense ${offense?.id}`).replace(/\s+/g, " ").trim(),
      description: categories.join(", "),
      source: "IBM QRadar",
      platform: "Unknown",
      rawLog: {
        offenseId: offense?.id,
        classification: classifyClosingReason(reason),
        closingReason: reason,
        magnitude: offense?.magnitude,
        eventCount: offense?.event_count,
        Confidence: null,
      },
      mitreTactics: [],
      mitreTechniques: [],
      iocIndicators: [],
      affectedEntities: [offense?.offense_source].filter(Boolean).map(String),
      remediationSteps: [],
      costImpact: getIncidentCost(category, severity),
      status: "Resolved",
    },
  };
}

function client(config: ConnectorConfig) {
  const base = `${normaliseBaseUrl(config.host)}/api`;
  const headers: Record<string, string> = { SEC: config.token };
  if (config.apiVersion) headers.Version = config.apiVersion;
  const insecureTls = config.verifyTls === "no";
  return (path: string, extra: Record<string, string> = {}) =>
    request(`${base}${path}`, { headers: { ...headers, ...extra }, insecureTls });
}

const enc = encodeURIComponent;

export const qradarConnector: ConnectorDefinition = {
  id: "qradar",
  name: "IBM QRadar",
  kind: "siem",
  idPrefix: "QRADAR-",
  description: "Closed offenses with their closing reason, across every log source feeding QRadar.",
  docsUrl: "https://ibmsecuritydocs.github.io/qradar_api_20.0/20.0--siem-offenses-GET.html",
  setupSteps: [
    "In QRadar, open Admin → Authorized Services and add a service with a role that can read offenses",
    "Deploy changes, then copy the token",
    "For the estimate to count offenses, close real incidents with a closing reason that says so (for example \"True Positive\"). The default reasons only mark false positives and non-issues.",
  ],
  fields: [
    { key: "host", label: "Console URL", type: "text", placeholder: "https://qradar.yourcompany.com", required: true },
    { key: "token", label: "Authorized service token", type: "password", placeholder: "SEC token", required: true },
    {
      key: "verifyTls",
      label: "Verify TLS certificate",
      type: "select",
      required: true,
      default: "yes",
      options: [
        { value: "yes", label: "Yes (recommended)" },
        { value: "no", label: "No (self-signed console certificate)" },
      ],
    },
    { key: "apiVersion", label: "API version", type: "text", placeholder: "Leave blank for the console's latest", help: "Only set this if your console needs a specific version, for example 20.0." },
  ],

  async test(config) {
    const get = client(config);
    // One offense is enough to prove the token and the offense permission.
    const res = expectOk(await get(`/siem/offenses?fields=id`, { Range: "items=0-0" }), "QRadar offenses");
    if (!Array.isArray(res.json())) return { ok: false, message: "Connected, but the response was not an offense list. Check the console URL." };
    let version = "";
    try {
      const about = await get("/system/about");
      if (about.status === 200) version = about.json()?.external_version || "";
    } catch {
      // version is a nicety only
    }
    return { ok: true, message: `Connected to QRadar${version ? ` ${version}` : ""}.` };
  },

  async fetchAlerts(config, since) {
    const get = client(config);

    const reasons: Record<string, string> = {};
    const rr = await get(`/siem/offense_closing_reasons?include_reserved=true&include_deleted=true`);
    if (rr.status === 200) for (const r of rr.json() || []) reasons[String(r.id)] = r.text;

    const filter = `status=CLOSED and last_persisted_time>${new Date(since).getTime()}`;
    const out: CategorizedAlert[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const res = expectOk(
        await get(`/siem/offenses?filter=${enc(filter)}&sort=${enc("+last_persisted_time")}&fields=${enc(FIELDS)}`, {
          Range: `items=${from}-${from + PAGE_SIZE - 1}`,
        }),
        "QRadar offenses"
      );
      const offenses: any[] = res.json() || [];
      for (const offense of offenses) out.push(mapQRadarOffense(offense, reasons));
      if (offenses.length < PAGE_SIZE) break;
    }
    return out;
  },
};
