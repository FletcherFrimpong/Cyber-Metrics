// Run with: npm test
// Each connector is exercised against a local server that answers the way the
// vendor's documentation says the real API does.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { crowdStrikeConnector, mapCrowdStrikeAlert } from "./crowdstrike.ts";
import { sentinelOneConnector, mapSentinelOneThreat } from "./sentinelone.ts";
import { splunkConnector, mapSplunkNotable, splunkClassification, splunkCategory, parseSearchResults } from "./splunk.ts";
import { normaliseBaseUrl } from "./http.ts";
import { summariseRisk } from "../risk-model.ts";

type Handler = (req: { method: string; path: string; query: URLSearchParams; headers: http.IncomingHttpHeaders; body: string }) => [number, unknown];
let server: http.Server;
let base = "";
let handler: Handler = () => [404, {}];
const seen: { method: string; path: string; query: URLSearchParams; headers: http.IncomingHttpHeaders; body: string }[] = [];

before(async () => {
  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const url = new URL(req.url || "/", "http://localhost");
      const call = { method: req.method || "GET", path: url.pathname, query: url.searchParams, headers: req.headers, body };
      seen.push(call);
      const [status, payload] = handler(call);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((r) => server.close(() => r())));

const SINCE = "2026-10-01T00:00:00.000Z";

// ─── CrowdStrike ────────────────────────────────────────────────────────────

const csAlert = {
  composite_id: "abc123:ind:dev456:789-10-11",
  aggregate_id: "aggind:dev456:999",
  display_name: "Credential dumping via LSASS",
  description: "A process attempted to read LSASS memory.",
  severity: 85,
  severity_name: "Critical",
  confidence: 90,
  status: "closed",
  product: "epp",
  created_timestamp: "2026-10-12T08:15:00Z",
  tactic: "Credential Access",
  tactic_id: "TA0006",
  technique: "OS Credential Dumping",
  technique_id: "T1003",
  mitre_attack: [{ tactic: "Lateral Movement", tactic_id: "TA0008", technique: "Remote Services", technique_id: "T1021" }],
  device: { hostname: "FIN-LT-014", platform_name: "Windows" },
  user_name: "j.doe",
  falcon_host_link: "https://falcon.crowdstrike.com/activity/detections/detail/x",
  tags: ["true_positive"],
};

test("CrowdStrike: alert maps to a critical endpoint alert with verdict and MITRE data", () => {
  const { category, alert } = mapCrowdStrikeAlert(csAlert);
  assert.equal(category, "edr");
  assert.equal(alert.id, "CS-abc123:ind:dev456:789-10-11");
  assert.equal(alert.severity, "Critical");
  assert.equal(alert.costImpact, 750000);
  assert.equal(alert.confidence, 90);
  assert.equal(alert.rawLog.classification, "truePositive"); // read from the tag
  assert.equal(alert.rawLog.incidentId, "CS-aggind:dev456:999");
  assert.deepEqual(alert.mitreTactics, ["Credential Access", "Lateral Movement"]);
  assert.deepEqual(alert.mitreTechniques, ["T1003", "T1021"]);
  assert.deepEqual(alert.affectedEntities, ["FIN-LT-014", "j.doe"]);
  assert.equal(alert.platform, "Windows");
});

test("CrowdStrike: resolution field wins over tags, numeric severity is bucketed, cloud products are cloud", () => {
  const a = mapCrowdStrikeAlert({ ...csAlert, resolution: "false_positive", severity_name: undefined, severity: 45, product: "cwpp" });
  assert.equal(a.alert.rawLog.classification, "falsePositive");
  assert.equal(a.alert.severity, "Medium");
  assert.equal(a.category, "cloud");
  assert.equal(mapCrowdStrikeAlert({ ...csAlert, tags: [], resolution: "ignored" }).alert.rawLog.classification, "informationalExpectedActivity");
  assert.equal(mapCrowdStrikeAlert({ ...csAlert, tags: [] }).alert.rawLog.classification, "unknown");
});

test("CrowdStrike: signs in, pages through closed alerts, and sends the documented requests", async () => {
  seen.length = 0;
  handler = (req) => {
    if (req.path === "/oauth2/token") return [201, { access_token: "tok-1", expires_in: 1799, token_type: "bearer" }];
    if (req.path === "/alerts/combined/alerts/v1") {
      const body = JSON.parse(req.body);
      if (!body.after) return [200, { resources: [csAlert, { ...csAlert, composite_id: "second" }], meta: { pagination: { after: "cursor-2", limit: 1000, total: 3 } }, errors: [] }];
      return [200, { resources: [{ ...csAlert, composite_id: "third" }], meta: { pagination: { limit: 1000, total: 3 } }, errors: [] }];
    }
    if (req.path === "/alerts/queries/alerts/v2") return [200, { resources: ["x"], meta: { pagination: { offset: 0, limit: 1, total: 42 } }, errors: [] }];
    return [404, {}];
  };
  const config = { cloud: "us-1", clientId: "id-1", clientSecret: "secret-1", __baseUrl: base };

  const alerts = await crowdStrikeConnector.fetchAlerts(config, SINCE);
  assert.equal(alerts.length, 3);
  const token = seen.find((c) => c.path === "/oauth2/token")!;
  assert.equal(token.method, "POST");
  assert.match(String(token.headers["content-type"]), /x-www-form-urlencoded/);
  assert.equal(new URLSearchParams(token.body).get("client_id"), "id-1");
  assert.equal(new URLSearchParams(token.body).get("client_secret"), "secret-1");
  const pages = seen.filter((c) => c.path === "/alerts/combined/alerts/v1");
  assert.equal(pages.length, 2);
  assert.equal(pages[0].headers.authorization, "Bearer tok-1");
  const first = JSON.parse(pages[0].body);
  assert.equal(first.filter, `status:'closed'+updated_timestamp:>'${SINCE}'`);
  assert.equal(first.limit, 1000);
  assert.equal(JSON.parse(pages[1].body).after, "cursor-2");

  const result = await crowdStrikeConnector.test(config);
  assert.equal(result.ok, true);
  assert.match(result.message, /42 alerts visible/);
});

test("CrowdStrike: rejected credentials and a missing scope give readable errors", async () => {
  handler = () => [401, { errors: [{ code: 401, message: "access denied, invalid client" }] }];
  await assert.rejects(crowdStrikeConnector.test({ cloud: "us-1", clientId: "x", clientSecret: "y", __baseUrl: base }), /credentials were rejected/);
  handler = (req) => (req.path === "/oauth2/token" ? [201, { access_token: "t" }] : [403, { errors: [{ message: "access denied, authorization failed" }] }]);
  await assert.rejects(crowdStrikeConnector.test({ cloud: "us-1", clientId: "x", clientSecret: "y", __baseUrl: base }), /Alerts: Read.*lack the required permission/);
});

// ─── SentinelOne ────────────────────────────────────────────────────────────

const s1Threat = {
  id: "1234567890123456789",
  threatInfo: {
    threatId: "1234567890123456789",
    threatName: "mimikatz.exe",
    classification: "Trojan",
    confidenceLevel: "malicious",
    analystVerdict: "true_positive",
    incidentStatus: "resolved",
    mitigationStatus: "mitigated",
    createdAt: "2026-10-20T11:02:33.123456Z",
    updatedAt: "2026-10-21T09:00:00.000000Z",
    storyline: "ABCDEF0123456789",
    sha256: "aa".repeat(32),
  },
  agentRealtimeInfo: { agentComputerName: "HR-PC-07", agentOsName: "Windows 11 Pro", agentOsType: "windows" },
  indicators: [
    { category: "Exploitation", tactics: [{ name: "Credential Access", source: "MITRE", techniques: [{ name: "T1003", link: "https://attack.mitre.org/techniques/T1003/" }] }] },
    { category: "General", tactics: [] },
  ],
};

test("SentinelOne: threat maps with verdict, MITRE ids from technique names, and no invented confidence", () => {
  const alert = mapSentinelOneThreat(s1Threat);
  assert.equal(alert.id, "S1-1234567890123456789");
  assert.equal(alert.severity, "High"); // malicious confidence level
  assert.equal(alert.costImpact, 200000);
  assert.equal(alert.rawLog.classification, "truePositive");
  assert.deepEqual(alert.mitreTactics, ["Credential Access"]);
  assert.deepEqual(alert.mitreTechniques, ["T1003"]);
  assert.equal(alert.timestamp, "2026-10-20T11:02:33.123456Z");
  assert.equal(alert.platform, "Windows 11 Pro");
  assert.equal(alert.confidence, undefined);
  assert.equal(mapSentinelOneThreat({ ...s1Threat, threatInfo: { ...s1Threat.threatInfo, analystVerdict: "false_positive", confidenceLevel: "suspicious" } }).rawLog.classification, "falsePositive");
  assert.equal(mapSentinelOneThreat({ ...s1Threat, threatInfo: { ...s1Threat.threatInfo, analystVerdict: "undefined", confidenceLevel: "suspicious" } }).severity, "Medium");
});

test("SentinelOne: sends the ApiToken header, filters resolved threats and follows the cursor", async () => {
  seen.length = 0;
  handler = (req) => {
    if (req.headers.authorization !== "ApiToken s1-token") return [401, { errors: [{ code: 4010010, title: "Authentication Failed", detail: null }] }];
    if (req.path !== "/web/api/v2.1/threats") return [404, {}];
    if (req.query.get("limit") === "1") return [200, { data: [s1Threat], pagination: { nextCursor: null, totalItems: 7 } }];
    if (!req.query.get("cursor")) return [200, { data: [s1Threat], pagination: { nextCursor: "next-1", totalItems: 2 } }];
    return [200, { data: [{ ...s1Threat, id: "second" }], pagination: { nextCursor: null, totalItems: 2 } }];
  };
  const config = { consoleUrl: base, apiToken: "s1-token" };
  const alerts = await sentinelOneConnector.fetchAlerts(config, SINCE);
  assert.equal(alerts.length, 2);
  assert.ok(alerts.every((a) => a.category === "edr"));
  const first = seen[0];
  assert.equal(first.query.get("incidentStatuses"), "resolved");
  assert.equal(first.query.get("updatedAt__gte"), SINCE);
  assert.equal(first.query.get("sortBy"), "updatedAt");
  assert.equal(seen[1].query.get("cursor"), "next-1");

  assert.match((await sentinelOneConnector.test(config)).message, /7 threats visible/);
  await assert.rejects(sentinelOneConnector.test({ consoleUrl: base, apiToken: "wrong" }), /credentials were rejected/);
});

// ─── Splunk ─────────────────────────────────────────────────────────────────

const notable = {
  event_id: "A1B2C3D4-E5F6@@notable@@abc123",
  rule_name: "Endpoint - Ransomware Behaviour Detected - Rule",
  rule_title: "Ransomware behaviour on FILESRV-02",
  rule_description: "Mass file encryption detected.",
  urgency: "critical",
  status_label: "Closed",
  status_group: "Closed",
  security_domain: "endpoint",
  dest: "FILESRV-02",
  user: "svc_backup",
  src: "10.20.30.40",
  disposition: "disposition:1",
  disposition_label: "True Positive - Suspicious Activity",
  "annotations.mitre_attack.mitre_technique_id": ["T1486", "T1490"],
  "annotations.mitre_attack.mitre_tactic": ["impact"],
  _time: "2026-11-02T03:14:15.000+00:00",
};

test("Splunk: notable maps with disposition, multivalue MITRE fields and urgency", () => {
  const { category, alert } = mapSplunkNotable(notable);
  assert.equal(category, "edr");
  assert.equal(alert.severity, "Critical");
  assert.equal(alert.costImpact, 750000);
  assert.equal(alert.rawLog.classification, "truePositive");
  assert.deepEqual(alert.mitreTechniques, ["T1486", "T1490"]);
  assert.deepEqual(alert.mitreTactics, ["impact"]);
  assert.equal(alert.timestamp, "2026-11-02T03:14:15.000Z");
  assert.deepEqual(alert.affectedEntities, ["FILESRV-02", "svc_backup"]);
  // single-value strings work too
  const single = mapSplunkNotable({ ...notable, "annotations.mitre_attack.mitre_technique_id": "T1486", "annotations.mitre_attack.mitre_tactic": "impact" });
  assert.deepEqual(single.alert.mitreTechniques, ["T1486"]);
});

test("Splunk: dispositions and categories cover every documented value", () => {
  assert.equal(splunkClassification({ disposition_label: "Benign Positive - Suspicious But Expected" }), "informationalExpectedActivity");
  assert.equal(splunkClassification({ disposition_label: "False Positive - Incorrect Analytic Logic" }), "falsePositive");
  assert.equal(splunkClassification({ disposition: "disposition:4" }), "falsePositive");
  assert.equal(splunkClassification({ disposition_label: "Undetermined" }), "unknown");
  assert.equal(splunkClassification({}), "unknown");
  assert.equal(splunkCategory({ security_domain: "network" }), "network");
  assert.equal(splunkCategory({ security_domain: "access" }), "cloud");
  assert.equal(splunkCategory({ security_domain: "threat", rule_name: "Email - Phishing Link Clicked - Rule" }), "email");
  assert.equal(splunkCategory({ security_domain: "threat", rule_name: "Web - SQL Injection Attempt - Rule" }), "web");
  assert.equal(splunkCategory({ security_domain: "threat", rule_name: "AWS IAM Privilege Escalation" }), "cloud");
});

test("Splunk: results parse from a JSON body or newline-delimited rows", () => {
  assert.equal(parseSearchResults(JSON.stringify({ preview: false, results: [notable, notable] })).length, 2);
  assert.equal(parseSearchResults(`{"preview":false,"result":{"event_id":"1"}}\n{"preview":false,"result":{"event_id":"2"}}\n`).length, 2);
  assert.equal(parseSearchResults("").length, 0);
});

test("Splunk: sends a Bearer token and a oneshot notable search, and reports missing notable access", async () => {
  seen.length = 0;
  handler = (req) => {
    if (req.headers.authorization !== "Bearer splunk-token") return [401, { messages: [{ type: "WARN", text: "call not properly authenticated" }] }];
    if (req.path === "/services/server/info") return [200, { generator: { version: "9.4.1" }, entry: [{ content: { version: "9.4.1" } }] }];
    if (req.path === "/services/search/jobs") return [200, { preview: false, init_offset: 0, messages: [], results: [notable, { ...notable, event_id: "two", security_domain: "network" }] }];
    return [404, {}];
  };
  const config = { host: base, token: "splunk-token", verifyTls: "yes" };
  const alerts = await splunkConnector.fetchAlerts(config, SINCE);
  assert.deepEqual(alerts.map((a) => a.category), ["edr", "network"]);
  const job = seen.find((c) => c.path === "/services/search/jobs")!;
  const form = new URLSearchParams(job.body);
  assert.equal(job.method, "POST");
  assert.equal(form.get("exec_mode"), "oneshot");
  assert.equal(form.get("output_mode"), "json");
  assert.equal(form.get("earliest_time"), SINCE);
  assert.match(form.get("search")!, /^search `notable` \| where lower\(status_group\)="closed"/);

  const ok = await splunkConnector.test(config);
  assert.equal(ok.ok, true);
  assert.match(ok.message, /Splunk 9\.4\.1/);

  handler = (req) => (req.path === "/services/server/info" ? [200, { entry: [{ content: { version: "9.4.1" } }] }] : [400, { messages: [{ type: "FATAL", text: "Error in 'SearchParser': The search specifies a macro 'notable' that cannot be found." }] }]);
  const bad = await splunkConnector.test(config);
  assert.equal(bad.ok, false);
  assert.match(bad.message, /notable search failed/);
  handler = () => [401, { messages: [{ type: "WARN", text: "call not properly authenticated" }] }];
  await assert.rejects(splunkConnector.test({ ...config, token: "nope" }), /credentials were rejected/);
});

// ─── Shared ─────────────────────────────────────────────────────────────────

test("URLs must be https unless local, and Splunk defaults to port 8089", () => {
  assert.equal(normaliseBaseUrl("acme.splunkcloud.com", 8089), "https://acme.splunkcloud.com:8089");
  assert.equal(normaliseBaseUrl("https://acme.sentinelone.net/"), "https://acme.sentinelone.net");
  assert.throws(() => normaliseBaseUrl("http://example.com"), /https/);
  assert.throws(() => normaliseBaseUrl(""), /required/);
});

test("alerts from all three connectors flow through the risk model", () => {
  const alerts = [
    mapCrowdStrikeAlert(csAlert),
    { category: "edr" as const, alert: mapSentinelOneThreat(s1Threat) },
    mapSplunkNotable(notable),
    mapSplunkNotable({ ...notable, event_id: "fp", disposition: "disposition:3", disposition_label: "False Positive - Incorrect Analytic Logic" }),
  ].map((a) => ({ alert: a.alert, bucket: a.category }));
  const s = summariseRisk(alerts, (id) => /^T\d{4}/.test(id));
  assert.equal(s.incidentCount, 4);
  assert.equal(s.confirmedIncidents, 3);
  assert.equal(s.dismissedIncidents, 1);
  // CrowdStrike: lateral movement 0.45 x 750K; SentinelOne: credential access 0.3 x 200K; Splunk: impact 0.75 x 750K
  assert.equal(s.lossAvoided.mean, 0.45 * 750000 + 0.3 * 200000 + 0.75 * 750000);
});
