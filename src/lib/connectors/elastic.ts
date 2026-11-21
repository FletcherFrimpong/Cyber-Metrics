// Elastic Security: closed detection alerts, via the Kibana detections API
// (elastic.co/docs/api/doc/kibana/operation/operation-searchalerts).
//   POST {kibana}/api/detection_engine/signals/search        (or /s/{space}/api/...)
//   headers: Authorization: ApiKey <base64 id:api_key>, kbn-xsrf: true
// The endpoint ignores search_after and from, so paging is done with a range on
// (@timestamp, alert uuid) inside the query. An analyst verdict exists only as
// the closing reason (kibana.alert.workflow_reason), available from Stack 9.2.

import type { SecurityAlert } from "../../types/alerts";
import { getIncidentCost } from "../cost-benchmarks.ts";
import { request, expectOk, normaliseBaseUrl } from "./http.ts";
import { categoriseBy } from "./product-category.ts";
import type { ConnectorDefinition, ConnectorConfig, CategorizedAlert, AlertCategory } from "./types";

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

const REASON_VERDICT: Record<string, string> = {
  true_positive: "truePositive",
  false_positive: "falsePositive",
  benign_positive: "informationalExpectedActivity",
  duplicate: "informationalExpectedActivity",
};

/** Read a field whether _source holds it as a flat dotted key or as nested objects. */
export function field(src: any, path: string): any {
  if (src == null) return undefined;
  if (src[path] !== undefined) return src[path];
  let cur = src;
  for (const part of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function severityOf(value: unknown): SecurityAlert["severity"] {
  const s = String(value || "").toLowerCase();
  if (s === "critical") return "Critical";
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  if (s === "low") return "Low";
  return "Medium";
}

function categoryOf(src: any): AlertCategory {
  const tags: string[] = [].concat(field(src, "kibana.alert.rule.tags") || []).map(String);
  const text = tags.join(" ").toLowerCase();
  if (/domain:\s*endpoint/.test(text)) return "edr";
  if (/domain:\s*(cloud|identity|saas)/.test(text)) return "cloud";
  if (/domain:\s*network/.test(text)) return "network";
  if (/domain:\s*email/.test(text)) return "email";
  if (/domain:\s*web/.test(text)) return "web";
  return categoriseBy([`${field(src, "event.module") || ""} ${field(src, "event.dataset") || ""}`, field(src, "kibana.alert.rule.name"), text], "edr");
}

export function mapElasticAlert(hit: any): CategorizedAlert {
  const src = hit?._source || {};
  const category = categoryOf(src);
  const severity = severityOf(field(src, "kibana.alert.severity"));
  const tactics = new Set<string>();
  const techniques = new Set<string>();
  for (const threat of [].concat(field(src, "kibana.alert.rule.threat") || []) as any[]) {
    if (threat?.tactic?.name) tactics.add(threat.tactic.name);
    for (const technique of threat?.technique || []) {
      if (technique?.id) techniques.add(technique.id);
      for (const sub of technique?.subtechnique || []) if (sub?.id) techniques.add(sub.id);
    }
  }
  const reason = String(field(src, "kibana.alert.workflow_reason") || "").toLowerCase();
  const id = field(src, "kibana.alert.uuid") || hit?._id;
  const names = (v: unknown) => [].concat((v as any) || []).map(String).filter(Boolean);

  return {
    category,
    alert: {
      id: `ELASTIC-${id}`,
      timestamp: field(src, "kibana.alert.original_time") || src["@timestamp"] || new Date().toISOString(),
      severity,
      category: [...tactics][0] || "Detection alert",
      title: field(src, "kibana.alert.rule.name") || "Elastic Security alert",
      description: field(src, "kibana.alert.rule.description") || "",
      source: "Elastic Security",
      platform: field(src, "host.os.name") || "Unknown",
      rawLog: {
        alertId: id,
        classification: REASON_VERDICT[reason] || "unknown",
        closingReason: reason || undefined,
        riskScore: field(src, "kibana.alert.risk_score"),
        alertUrl: field(src, "kibana.alert.url"),
        Confidence: null,
      },
      mitreTactics: [...tactics],
      mitreTechniques: [...techniques],
      iocIndicators: [],
      affectedEntities: [...names(field(src, "host.name")), ...names(field(src, "user.name"))],
      remediationSteps: [],
      costImpact: getIncidentCost(category, severity),
      status: "Resolved",
    },
  };
}

/** Closed alerts created or closed since `since`, after the (timestamp, uuid) cursor. */
export function buildQuery(since: string, cursor?: { ts: string; uuid: string }) {
  const filter: any[] = [
    { term: { "kibana.alert.workflow_status": "closed" } },
    {
      bool: {
        should: [
          { range: { "@timestamp": { gte: since } } },
          { range: { "kibana.alert.workflow_status_updated_at": { gte: since } } },
        ],
        minimum_should_match: 1,
      },
    },
  ];
  if (cursor) {
    filter.push({
      bool: {
        should: [
          { range: { "@timestamp": { gt: cursor.ts } } },
          { bool: { filter: [{ term: { "@timestamp": cursor.ts } }, { range: { "kibana.alert.uuid": { gt: cursor.uuid } } }] } },
        ],
        minimum_should_match: 1,
      },
    });
  }
  return {
    size: PAGE_SIZE,
    track_total_hits: false,
    query: { bool: { filter } },
    sort: [{ "@timestamp": "asc" }, { "kibana.alert.uuid": "asc" }],
  };
}

/** Kibana shows the key already encoded; also accept the raw "id:api_key" form. */
export function encodeApiKey(key: string): string {
  const k = (key || "").trim();
  return k.includes(":") ? Buffer.from(k, "utf8").toString("base64") : k;
}

function search(config: ConnectorConfig, body: unknown) {
  const space = (config.space || "").trim();
  const path = `${space && space !== "default" ? `/s/${encodeURIComponent(space)}` : ""}/api/detection_engine/signals/search`;
  return request(`${normaliseBaseUrl(config.kibanaUrl)}${path}`, {
    headers: {
      Authorization: `ApiKey ${encodeApiKey(config.apiKey)}`,
      "kbn-xsrf": "true",
      "elastic-api-version": "2023-10-31",
    },
    json: body,
    insecureTls: config.verifyTls === "no",
    timeoutMs: 60000,
  });
}

export const elasticConnector: ConnectorDefinition = {
  id: "elastic",
  name: "Elastic Security",
  kind: "siem",
  idPrefix: "ELASTIC-",
  description: "Closed detection alerts with MITRE mapping, and the closing reason on Stack 9.2 or later.",
  docsUrl: "https://www.elastic.co/docs/api/doc/kibana/operation/operation-searchalerts",
  setupSteps: [
    "In Kibana, open Stack Management → API keys and create a key",
    "Give it read access to Security alerts in your space, and read on the .alerts-security.alerts-<space> indices",
    "Copy the encoded key",
    "On Stack 9.2 or later, close alerts with a reason (true positive, false positive, benign) so verdicts carry through",
  ],
  fields: [
    { key: "kibanaUrl", label: "Kibana URL", type: "text", placeholder: "https://yourdeployment.kb.us-east-1.aws.elastic.cloud", required: true },
    { key: "apiKey", label: "API key", type: "password", placeholder: "Encoded API key", required: true },
    { key: "space", label: "Space", type: "text", placeholder: "default", help: "Leave blank for the default space." },
    {
      key: "verifyTls",
      label: "Verify TLS certificate",
      type: "select",
      required: true,
      default: "yes",
      options: [
        { value: "yes", label: "Yes (recommended)" },
        { value: "no", label: "No (self-signed certificate)" },
      ],
    },
  ],

  async test(config) {
    // A zero-size search exercises the key, its privileges and the space in one call.
    const res = expectOk(await search(config, { size: 0, track_total_hits: true, query: { match_all: {} } }), "Elastic Security alerts");
    const total = res.json()?.hits?.total;
    const count = typeof total === "number" ? total : total?.value;
    return { ok: true, message: `Connected to Elastic Security${typeof count === "number" ? ` (${count} alerts visible)` : ""}.` };
  },

  async fetchAlerts(config, since) {
    const out: CategorizedAlert[] = [];
    let cursor: { ts: string; uuid: string } | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const body = expectOk(await search(config, buildQuery(since, cursor)), "Elastic Security alerts").json();
      const hits: any[] = body?.hits?.hits || [];
      for (const hit of hits) out.push(mapElasticAlert(hit));
      if (hits.length < PAGE_SIZE) break;
      const last = hits[hits.length - 1];
      const ts = last?._source?.["@timestamp"];
      const uuid = field(last?._source, "kibana.alert.uuid") || last?._id;
      if (!ts || !uuid) break; // cannot page safely without both
      cursor = { ts, uuid };
    }
    return out;
  },
};
