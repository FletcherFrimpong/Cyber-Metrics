// Splunk Enterprise Security: closed notable events (called "findings" in ES 8).
// Follows the Splunk REST API reference and the ES documentation (help.splunk.com).
//   GET  {host}:8089/services/server/info?output_mode=json     header  Authorization: Bearer <token>
//   POST {host}:8089/services/search/jobs  exec_mode=oneshot    search `notable` ...
// The `notable` macro is used rather than index=notable because it joins the
// current review state (status, owner, disposition) onto each event.

import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { request, expectOk, normaliseBaseUrl, type HttpResponse } from "./http.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert, AlertCategory } from "./types";

const MAX_RESULTS = 10000; // Splunk's default max_count for a search job

const FIELDS = [
  "event_id", "rule_name", "rule_title", "rule_description", "search_name",
  "urgency", "severity", "status_label", "status_group", "security_domain",
  "src", "dest", "user", "disposition", "disposition_label",
  "annotations.mitre_attack", "annotations.mitre_attack.mitre_technique_id",
  "annotations.mitre_attack.mitre_tactic", "_time",
];

const NOTABLE_SEARCH =
  'search `notable` | where lower(status_group)="closed" ' +
  `| head ${MAX_RESULTS} | fields ${FIELDS.map((f) => (f.includes(".") ? `"${f}"` : f)).join(" ")}`;

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function severityFor(notable: any): SecurityAlert["severity"] {
  const v = String(notable?.urgency || notable?.severity || "").toLowerCase();
  if (v === "critical") return "Critical";
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low" || v === "informational") return "Low";
  return "Medium";
}

/** Analyst disposition → the classification values the risk model reads. */
export function splunkClassification(notable: any): string {
  const label = String(notable?.disposition_label || "").toLowerCase();
  const code = String(notable?.disposition || "").toLowerCase();
  if (label.startsWith("true positive") || code === "disposition:1") return "truePositive";
  if (label.startsWith("benign positive") || code === "disposition:2") return "informationalExpectedActivity";
  if (label.startsWith("false positive") || code === "disposition:3" || code === "disposition:4") return "falsePositive";
  return "unknown";
}

/** Splunk is a SIEM, so one feed spans every category: sort each notable into ours. */
export function splunkCategory(notable: any): AlertCategory {
  const text = `${notable?.rule_name || ""} ${notable?.rule_title || ""} ${notable?.search_name || ""}`.toLowerCase();
  if (/\b(e-?mail|phish|spam|mailbox)\b/.test(text)) return "email";
  if (/\b(aws|azure|gcp|cloud|o365|office 365|kubernetes|saas)\b/.test(text)) return "cloud";
  if (/\b(web|proxy|waf|http|url|sql injection|xss)\b/.test(text)) return "web";
  const domain = String(notable?.security_domain || "").toLowerCase();
  if (domain === "endpoint") return "edr";
  if (domain === "network") return "network";
  if (domain === "access" || domain === "identity" || domain === "audit") return "cloud";
  return "edr";
}

export function mapSplunkNotable(notable: any): CategorizedAlert {
  const category = splunkCategory(notable);
  const severity = severityFor(notable);
  const techniques = list(notable?.["annotations.mitre_attack.mitre_technique_id"]);
  // Before enrichment the raw annotation holds the technique ids themselves.
  const raw = list(notable?.["annotations.mitre_attack"]).filter((v) => /^T\d{4}/i.test(v));
  const title = notable?.rule_title || notable?.rule_name || notable?.search_name || "Splunk notable event";
  const time = notable?._time ? new Date(notable._time) : new Date();

  return {
    category,
    alert: {
      id: `SPLUNK-${notable?.event_id || `${title}-${notable?._time}`}`,
      timestamp: isNaN(time.getTime()) ? new Date().toISOString() : time.toISOString(),
      severity,
      category: notable?.security_domain || "Notable event",
      title,
      description: notable?.rule_description || "",
      source: "Splunk Enterprise Security",
      platform: "Unknown",
      rawLog: {
        eventId: notable?.event_id,
        classification: splunkClassification(notable),
        disposition: notable?.disposition_label || notable?.disposition,
        statusLabel: notable?.status_label,
        securityDomain: notable?.security_domain,
        Confidence: null,
      },
      mitreTactics: list(notable?.["annotations.mitre_attack.mitre_tactic"]),
      mitreTechniques: [...new Set([...techniques, ...raw])],
      iocIndicators: list(notable?.src),
      affectedEntities: [...list(notable?.dest), ...list(notable?.user)],
      remediationSteps: [],
      costImpact: getIncidentCost(category, severity),
      status: "Resolved",
    },
  };
}

/** A oneshot search answers {results:[...]}; tolerate newline-delimited {result:{...}} too. */
export function parseSearchResults(text: string): any[] {
  try {
    const body = JSON.parse(text);
    if (Array.isArray(body?.results)) return body.results;
    if (body?.result) return [body.result];
  } catch {
    // fall through to line-by-line
  }
  const rows: any[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj?.result) rows.push(obj.result);
    } catch {
      // ignore partial lines
    }
  }
  return rows;
}

function opts(config: ConnectorConfig) {
  return {
    headers: { Authorization: `Bearer ${config.token}` },
    insecureTls: config.verifyTls === "no",
  };
}

function base(config: ConnectorConfig): string {
  return normaliseBaseUrl(config.host, 8089);
}

async function oneshot(config: ConnectorConfig, search: string, earliest: string, timeoutMs: number): Promise<HttpResponse> {
  return request(`${base(config)}/services/search/jobs`, {
    ...opts(config),
    timeoutMs,
    form: {
      search,
      exec_mode: "oneshot",
      output_mode: "json",
      earliest_time: earliest,
      latest_time: "now",
      count: "0",
    },
  });
}

export const splunkConnector: ConnectorDefinition = {
  id: "splunk",
  name: "Splunk Enterprise Security",
  kind: "siem",
  idPrefix: "SPLUNK-",
  description: "Closed notable events (findings) with their analyst disposition, across every alert category.",
  docsUrl: "https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/9.4/search-endpoints/search-endpoint-descriptions",
  setupSteps: [
    "In Splunk, enable token authentication and create a token (Settings → Tokens → New Token)",
    "Give the token's user a role that can search the notable index",
    "Splunk Cloud: add this server's IP to the search-api allow list so port 8089 is reachable",
    "Enter the management URL, for example https://yourstack.splunkcloud.com:8089",
  ],
  fields: [
    { key: "host", label: "Management URL", type: "text", placeholder: "https://yourstack.splunkcloud.com:8089", required: true, help: "Port 8089 is assumed if you leave it out." },
    { key: "token", label: "Authentication token", type: "password", placeholder: "Splunk authentication token", required: true },
    {
      key: "verifyTls",
      label: "Verify TLS certificate",
      type: "select",
      required: true,
      default: "yes",
      options: [
        { value: "yes", label: "Yes (recommended)" },
        { value: "no", label: "No (self-signed on-premise certificate)" },
      ],
    },
  ],

  async test(config) {
    const info = expectOk(
      await request(`${base(config)}/services/server/info?output_mode=json`, { ...opts(config), timeoutMs: 20000 }),
      "Splunk"
    ).json();
    const version = info?.entry?.[0]?.content?.version || info?.generator?.version || "unknown version";

    // Signing in is not enough: the token must also be able to read notables.
    const probe = await oneshot(config, "search `notable` | head 1 | fields event_id", "-7d", 45000);
    if (probe.status < 200 || probe.status >= 300) {
      return {
        ok: false,
        message: `Signed in to Splunk ${version}, but the notable search failed (HTTP ${probe.status}). Check that Enterprise Security is installed and the token's role can search the notable index. ${probe.text.slice(0, 200)}`,
      };
    }
    const found = parseSearchResults(probe.text).length;
    return {
      ok: true,
      message: `Connected to Splunk ${version}. Notable search works${found ? "" : " (no notables in the last 7 days)"}.`,
    };
  },

  async fetchAlerts(config, since) {
    const res = expectOk(await oneshot(config, NOTABLE_SEARCH, since, 120000), "Splunk notable search");
    return parseSearchResults(res.text).map(mapSplunkNotable);
  },
};
