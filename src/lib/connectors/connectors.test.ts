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
import { createHash } from "node:crypto";
import { defenderConnector, mapDefenderIncident } from "./defender.ts";
import { sentinelConnector, mapSentinelIncident } from "./sentinel.ts";
import { cortexConnector, mapCortexIncident, cortexHeaders, isResolved } from "./cortex.ts";
import { qradarConnector, mapQRadarOffense, classifyClosingReason } from "./qradar.ts";
import { elasticConnector, mapElasticAlert, buildQuery, encodeApiKey, field } from "./elastic.ts";
import { CONNECTORS } from "./registry.ts";
import { matchCategory, mapProductToCategory } from "./product-category.ts";
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
  assert.equal(splunkCategory({ security_domain: "access" }), "identity");
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

// ─── Microsoft Defender XDR ─────────────────────────────────────────────────

const defenderIncident = {
  id: "2972395",
  displayName: "Multi-stage incident involving Initial access & Command and control",
  status: "resolved",
  classification: "truePositive",
  determination: "multiStagedAttack",
  severity: "high",
  createdDateTime: "2026-10-18T09:00:00Z",
  lastUpdateDateTime: "2026-10-19T10:00:00Z",
  incidentWebUrl: "https://security.microsoft.com/incidents/2972395",
  alerts: [
    {
      id: "da637551227677560813_-961444813",
      title: "Suspicious PowerShell command line",
      description: "A suspicious PowerShell activity was observed.",
      severity: "medium",
      serviceSource: "microsoftDefenderForEndpoint",
      productName: "Microsoft Defender for Endpoint",
      category: "Execution",
      categories: ["Execution", "DefenseEvasion"],
      mitreTechniques: ["T1059.001", "T1027"],
      createdDateTime: "2026-10-18T09:01:00Z",
      alertWebUrl: "https://security.microsoft.com/alerts/da637",
      evidence: [
        { "@odata.type": "#microsoft.graph.security.deviceEvidence", deviceDnsName: "fin-lt-014.contoso.com", osPlatform: "Windows11" },
        { "@odata.type": "#microsoft.graph.security.userEvidence", userAccount: { accountName: "jdoe", userPrincipalName: "jdoe@contoso.com" } },
        { "@odata.type": "#microsoft.graph.security.ipEvidence", ipAddress: "203.0.113.7" },
      ],
    },
    {
      id: "fa2-phish",
      title: "Email messages containing malicious URL removed after delivery",
      severity: "informational",
      serviceSource: "microsoftDefenderForOffice365",
      category: "InitialAccess",
      mitreTechniques: ["T1566.002"],
      createdDateTime: "2026-10-18T08:50:00Z",
    },
  ],
};

test("Defender XDR: techniques are read as plain strings and alerts are sorted by Defender service", () => {
  const mapped = mapDefenderIncident(defenderIncident);
  assert.equal(mapped.length, 2);
  const [endpoint, email] = mapped;
  assert.equal(endpoint.category, "edr");
  assert.equal(email.category, "email");
  assert.deepEqual(endpoint.alert.mitreTechniques, ["T1059.001", "T1027"]);
  assert.deepEqual(endpoint.alert.mitreTactics, ["Execution", "DefenseEvasion"]);
  assert.deepEqual(email.alert.mitreTactics, ["InitialAccess"]);
  assert.equal(endpoint.alert.severity, "Medium");
  assert.equal(email.alert.severity, "Low");
  assert.equal(endpoint.alert.rawLog.classification, "truePositive");
  assert.equal(endpoint.alert.rawLog.incidentId, "DEFENDER-2972395");
  assert.equal(email.alert.rawLog.incidentId, "DEFENDER-2972395"); // same incident
  assert.equal(endpoint.alert.platform, "Windows11");
  assert.deepEqual(endpoint.alert.affectedEntities, ["fin-lt-014.contoso.com", "jdoe@contoso.com"]);
  assert.deepEqual(endpoint.alert.iocIndicators, ["203.0.113.7"]);
  // an incident with no alerts still yields one alert
  assert.equal(mapDefenderIncident({ ...defenderIncident, alerts: [] }).length, 1);
});

test("Defender XDR: uses the documented filter field and $expand, and follows @odata.nextLink", async () => {
  seen.length = 0;
  handler = (req) => {
    if (req.path === "/tenant-1/oauth2/v2.0/token") return [200, { access_token: "graph-token", expires_in: 3599 }];
    if (req.path === "/security/incidents") {
      if (req.headers.authorization !== "Bearer graph-token") return [401, { error: { message: "InvalidAuthenticationToken" } }];
      if (req.query.get("$skip") === "50") return [200, { value: [{ ...defenderIncident, id: "second", alerts: [defenderIncident.alerts[1]] }] }];
      return [200, { value: [defenderIncident], "@odata.nextLink": `${base}/security/incidents?$skip=50` }];
    }
    return [404, {}];
  };
  const config = { tenantId: "tenant-1", clientId: "app-1", clientSecret: "s3cret", __loginUrl: base, __graphUrl: base };
  const alerts = await defenderConnector.fetchAlerts(config, SINCE);
  assert.equal(alerts.length, 3);
  const token = new URLSearchParams(seen.find((c) => c.path.endsWith("/token"))!.body);
  assert.equal(token.get("scope"), "https://graph.microsoft.com/.default");
  assert.equal(token.get("grant_type"), "client_credentials");
  assert.equal(token.get("client_id"), "app-1");
  const first = seen.find((c) => c.path === "/security/incidents")!;
  assert.equal(first.query.get("$filter"), `status eq 'resolved' and lastUpdateDateTime ge ${SINCE}`);
  assert.equal(first.query.get("$expand"), "alerts");
  assert.equal(first.query.get("$orderby"), null); // not a documented option on this endpoint
  assert.equal((await defenderConnector.test(config)).ok, true);

  handler = () => [401, { error: "invalid_client", error_description: "AADSTS7000215: Invalid client secret provided." }];
  await assert.rejects(defenderConnector.test(config), /credentials were rejected.*AADSTS7000215/);
});

// ─── Microsoft Sentinel (Azure Resource Manager) ────────────────────────────

const armIncident = {
  id: "/subscriptions/sub-1/resourceGroups/rg-sec/providers/Microsoft.OperationalInsights/workspaces/ws-1/providers/Microsoft.SecurityInsights/Incidents/73e01a99",
  name: "73e01a99",
  properties: {
    title: "Brute force then successful sign-in",
    description: "Multiple failed sign-ins followed by success.",
    severity: "High",
    status: "Closed",
    classification: "TruePositive",
    classificationReason: "SuspiciousActivity",
    createdTimeUtc: "2026-10-22T07:00:00Z",
    lastModifiedTimeUtc: "2026-10-22T12:00:00Z",
    incidentNumber: 3177,
    incidentUrl: "https://portal.azure.com/#asset/Microsoft_Azure_Security_Insights/Incident/73e01a99",
    additionalData: { alertsCount: 1, tactics: ["CredentialAccess"], alertProductNames: ["Azure Sentinel"] },
  },
};
const armAlert = {
  kind: "SecurityAlert",
  name: "alert-guid-1",
  properties: {
    systemAlertId: "sys-alert-1",
    alertDisplayName: "Palo Alto firewall: repeated denied connections",
    description: "x",
    productName: "Palo Alto Networks",
    severity: "Medium",
    tactics: ["CommandAndControl"],
    timeGenerated: "2026-10-22T07:05:00Z",
  },
};

test("Sentinel: incident classification and each alert's product and tactics are mapped", () => {
  const [a] = mapSentinelIncident(armIncident, [armAlert]);
  assert.equal(a.alert.id, "SENTINEL-sys-alert-1");
  assert.equal(a.category, "network"); // sorted by the product that raised the alert
  assert.equal(a.alert.severity, "Medium");
  assert.equal(a.alert.rawLog.classification, "truePositive");
  assert.equal(a.alert.rawLog.incidentId, "SENTINEL-73e01a99");
  assert.deepEqual(a.alert.mitreTactics, ["CommandAndControl"]);
  // without alerts, the incident summary is used
  const [b] = mapSentinelIncident({ ...armIncident, properties: { ...armIncident.properties, classification: "BenignPositive" } });
  assert.equal(b.alert.id, "SENTINEL-INC-73e01a99");
  assert.equal(b.alert.rawLog.classification, "informationalExpectedActivity");
  assert.deepEqual(b.alert.mitreTactics, ["CredentialAccess"]);
  assert.equal(mapSentinelIncident({ ...armIncident, properties: { ...armIncident.properties, classification: "FalsePositive" } })[0].alert.rawLog.classification, "falsePositive");
  // techniques appear only on preview API versions; they are read when present
  const withTech = { ...armIncident, properties: { ...armIncident.properties, additionalData: { ...armIncident.properties.additionalData, techniques: ["T1110"] } } };
  assert.deepEqual(mapSentinelIncident(withTech)[0].alert.mitreTechniques, ["T1110"]);
});

test("Sentinel: signs in for Azure Resource Manager, lists closed incidents and fetches each incident's alerts", async () => {
  seen.length = 0;
  const ws = "/subscriptions/sub-1/resourceGroups/rg-sec/providers/Microsoft.OperationalInsights/workspaces/ws-1/providers/Microsoft.SecurityInsights";
  handler = (req) => {
    if (req.path === "/tenant-1/oauth2/v2.0/token") return [200, { access_token: "arm-token" }];
    if (req.headers.authorization !== "Bearer arm-token") return [401, { error: { code: "InvalidAuthenticationToken", message: "bad token" } }];
    if (req.path === `${ws}/incidents` && req.method === "GET") {
      if (req.query.get("$skipToken")) return [200, { value: [{ ...armIncident, name: "second" }] }];
      return [200, { value: [armIncident], nextLink: `${base}${ws}/incidents?api-version=2025-09-01&$skipToken=abc` }];
    }
    if (req.path === `${ws}/incidents/73e01a99/alerts` && req.method === "POST") return [200, { value: [armAlert] }];
    if (req.path === `${ws}/incidents/second/alerts`) return [403, { error: { code: "AuthorizationFailed" } }];
    return [404, { error: { code: "ResourceNotFound", message: "workspace not found" } }];
  };
  const config = { tenantId: "tenant-1", clientId: "app-1", clientSecret: "s", subscriptionId: "sub-1", resourceGroup: "rg-sec", workspaceName: "ws-1", __loginUrl: base, __armUrl: base };
  const alerts = await sentinelConnector.fetchAlerts(config, SINCE);
  assert.deepEqual(alerts.map((a) => a.alert.id), ["SENTINEL-sys-alert-1", "SENTINEL-INC-second"]); // second falls back to its summary
  assert.equal(new URLSearchParams(seen.find((c) => c.path.endsWith("/token"))!.body).get("scope"), "https://management.azure.com/.default");
  const list = seen.find((c) => c.path === `${ws}/incidents`)!;
  assert.equal(list.query.get("api-version"), "2025-09-01");
  assert.equal(list.query.get("$filter"), `properties/status eq 'Closed' and properties/lastModifiedTimeUtc ge ${SINCE}`);
  assert.equal((await sentinelConnector.test(config)).ok, true);
  await assert.rejects(sentinelConnector.test({ ...config, workspaceName: "wrong" }), /HTTP 404.*workspace not found/);
});

// ─── Palo Alto Cortex XDR ───────────────────────────────────────────────────

const cortexIncident = {
  incident_id: "413",
  incident_name: null,
  description: "'Behavioral Threat' generated by XDR Agent detected on host WKS-22 involving user corp\\asmith",
  severity: "high",
  manual_severity: null,
  status: "resolved_true_positive",
  creation_time: 1761120000000,
  modification_time: 1761206400000,
  resolved_timestamp: 1761206400000,
  resolve_comment: "Contained and reimaged",
  alert_count: 3,
  hosts: ["WKS-22:5e1f0a"],
  users: ["corp\\asmith"],
  incident_sources: ["XDR Agent"],
  alert_categories: ["Malware"],
  mitre_tactics_ids_and_names: ["TA0005 - Defense Evasion", "TA0008 - Lateral Movement"],
  mitre_techniques_ids_and_names: ["T1036.005 - Masquerading: Match Legitimate Name or Location"],
  xdr_url: "https://tenant.xdr.us.paloaltonetworks.com/incident-view/413",
};

test("Cortex XDR: resolution status gives the verdict and MITRE strings are split correctly", () => {
  const { category, alert } = mapCortexIncident(cortexIncident);
  assert.equal(category, "edr");
  assert.equal(alert.id, "CORTEX-413");
  assert.equal(alert.severity, "High");
  assert.equal(alert.rawLog.classification, "truePositive");
  assert.deepEqual(alert.mitreTactics, ["Defense Evasion", "Lateral Movement"]);
  assert.deepEqual(alert.mitreTechniques, ["T1036.005"]);
  assert.deepEqual(alert.affectedEntities, ["WKS-22", "corp\\asmith"]);
  assert.equal(alert.timestamp, new Date(1761120000000).toISOString());
  const verdict = (status: string) => mapCortexIncident({ ...cortexIncident, status }).alert.rawLog.classification;
  assert.equal(verdict("resolved_false_positive"), "falsePositive");
  assert.equal(verdict("resolved_threat_handled"), "truePositive");
  assert.equal(verdict("resolved_known_issue"), "informationalExpectedActivity");
  assert.equal(verdict("resolved_duplicate_incident"), "informationalExpectedActivity");
  assert.equal(verdict("resolved_other"), "unknown");
  assert.equal(verdict("resolved_auto_resolve"), "unknown");
  assert.equal(isResolved({ status: "under_investigation" }), false);
  // null arrays, as seen in Palo Alto's own fixtures
  const bare = mapCortexIncident({ ...cortexIncident, hosts: null, users: null, mitre_tactics_ids_and_names: null, mitre_techniques_ids_and_names: null, incident_sources: ["PAN NGFW"] });
  assert.deepEqual(bare.alert.mitreTactics, []);
  assert.equal(bare.category, "network");
  assert.equal(mapCortexIncident({ ...cortexIncident, manual_severity: "critical" }).alert.severity, "Critical");
});

test("Cortex XDR: advanced keys are hashed as SHA-256(key + nonce + timestamp); standard keys are sent as is", () => {
  const adv = cortexHeaders({ keyId: "7", apiKey: "KEY", keyType: "advanced" }, 1700000000000, "N".repeat(64));
  assert.equal(adv["x-xdr-auth-id"], "7");
  assert.equal(adv["x-xdr-timestamp"], "1700000000000");
  assert.equal(adv["x-xdr-nonce"].length, 64);
  assert.equal(adv.Authorization, createHash("sha256").update("KEY" + "N".repeat(64) + "1700000000000").digest("hex"));
  const std = cortexHeaders({ keyId: "7", apiKey: "KEY", keyType: "standard" });
  assert.deepEqual(std, { "x-xdr-auth-id": "7", Authorization: "KEY" });
  assert.match(cortexHeaders({ keyId: "7", apiKey: "KEY", keyType: "advanced" })["x-xdr-nonce"], /^[A-Za-z0-9]{64}$/);
});

test("Cortex XDR: pages through incidents, keeps only resolved ones, and explains a 401", async () => {
  seen.length = 0;
  const many = Array.from({ length: 100 }, (_, i) => ({ ...cortexIncident, incident_id: String(i), status: i % 2 ? "resolved_true_positive" : "under_investigation" }));
  handler = (req) => {
    if (req.path !== "/public_api/v1/incidents/get_incidents") return [404, {}];
    if (req.headers["x-xdr-auth-id"] !== "7" || req.headers.authorization !== "KEY") return [401, { reply: { err_code: "401", err_msg: "Public API request unauthorized", err_extra: "" } }];
    const d = JSON.parse(req.body).request_data;
    if (d.search_from === 0) return [200, { reply: { total_count: 101, result_count: d.search_to === 1 ? 1 : 100, incidents: d.search_to === 1 ? [many[0]] : many } }];
    return [200, { reply: { total_count: 101, result_count: 1, incidents: [{ ...cortexIncident, incident_id: "last" }] } }];
  };
  const config = { apiUrl: base, keyId: "7", apiKey: "KEY", keyType: "standard" };
  const alerts = await cortexConnector.fetchAlerts(config, SINCE);
  assert.equal(alerts.length, 51); // 50 resolved on page one + 1 on page two
  const first = JSON.parse(seen[0].body).request_data;
  assert.deepEqual(first.filters, [{ field: "modification_time", operator: "gte", value: new Date(SINCE).getTime() }]);
  assert.deepEqual(first.sort, { field: "modification_time", keyword: "asc" });
  assert.deepEqual([first.search_from, first.search_to], [0, 100]);
  assert.equal(JSON.parse(seen[1].body).request_data.search_from, 100);
  assert.match((await cortexConnector.test(config)).message, /101 incidents visible/);
  await assert.rejects(cortexConnector.test({ ...config, apiKey: "WRONG" }), /401.*key type/);
});

// ─── IBM QRadar ─────────────────────────────────────────────────────────────

const offense = {
  id: 1288,
  description: "Multiple Login Failures for the Same User\n preceded by Malware Communication\n",
  status: "CLOSED",
  severity: 8,
  magnitude: 6,
  start_time: 1761300000000,
  last_persisted_time: 1761390000000,
  close_time: 1761390000000,
  closing_reason_id: 54,
  categories: ["Malware", "User Login Failure"],
  offense_source: "10.20.30.40",
  log_sources: [{ id: 69, name: "Palo Alto PA Series @ fw01", type_id: 206, type_name: "Palo Alto PA Series" }],
  event_count: 412,
};

test("QRadar: closing reason gives the verdict, numeric severity is bucketed, no MITRE is invented", () => {
  const reasons = { "54": "True Positive - Confirmed Incident", "2": "False-Positive, Tuned", "1": "Non-Issue", "3": "Policy Violation" };
  const { category, alert } = mapQRadarOffense(offense, reasons);
  assert.equal(alert.id, "QRADAR-1288");
  assert.equal(category, "network"); // from the log source type
  assert.equal(alert.severity, "Critical");
  assert.equal(alert.rawLog.classification, "truePositive");
  assert.equal(alert.title, "Multiple Login Failures for the Same User preceded by Malware Communication");
  assert.deepEqual(alert.mitreTactics, []);
  assert.deepEqual(alert.mitreTechniques, []);
  assert.equal(alert.timestamp, new Date(1761300000000).toISOString());
  assert.equal(classifyClosingReason("False-Positive, Tuned"), "falsePositive");
  assert.equal(classifyClosingReason("Non-Issue"), "informationalExpectedActivity");
  assert.equal(classifyClosingReason("Non-Issues"), "informationalExpectedActivity");
  assert.equal(classifyClosingReason("Policy Violation"), "unknown");
  assert.equal(classifyClosingReason(undefined), "unknown");
  assert.equal(mapQRadarOffense({ ...offense, severity: 5, closing_reason_id: 2 }, reasons).alert.rawLog.classification, "falsePositive");
  assert.equal(mapQRadarOffense({ ...offense, severity: 5 }, reasons).alert.severity, "Medium");
});

test("QRadar: sends the SEC token, filters closed offenses by time, and pages with the Range header", async () => {
  seen.length = 0;
  const page = Array.from({ length: 100 }, (_, i) => ({ ...offense, id: i }));
  handler = (req) => {
    if (req.headers.sec !== "sec-token") return [401, { http_response: { code: 401, message: "Unauthorized" }, message: "No SEC header present in request." }];
    if (req.path === "/api/siem/offense_closing_reasons") return [200, [{ id: 54, text: "True Positive", is_reserved: false, is_deleted: false }]];
    if (req.path === "/api/system/about") return [200, { external_version: "7.5.0", release_name: "7.5.0 UpdatePackage 9" }];
    if (req.path === "/api/siem/offenses") return [200, req.headers.range === "items=0-99" ? page : req.headers.range === "items=0-0" ? [page[0]] : [{ ...offense, id: 999 }]];
    return [404, {}];
  };
  const config = { host: base, token: "sec-token", verifyTls: "yes", apiVersion: "20.0" };
  const alerts = await qradarConnector.fetchAlerts(config, SINCE);
  assert.equal(alerts.length, 101);
  assert.ok(alerts.every((a) => a.alert.rawLog.classification === "truePositive"));
  const calls = seen.filter((c) => c.path === "/api/siem/offenses");
  assert.equal(calls[0].query.get("filter"), `status=CLOSED and last_persisted_time>${new Date(SINCE).getTime()}`);
  assert.equal(calls[0].query.get("sort"), "+last_persisted_time");
  assert.equal(calls[0].headers.range, "items=0-99");
  assert.equal(calls[1].headers.range, "items=100-199");
  assert.equal(calls[0].headers.version, "20.0");
  assert.match((await qradarConnector.test(config)).message, /QRadar 7\.5\.0/);
  // no Version header unless the user set one
  seen.length = 0;
  await qradarConnector.test({ ...config, apiVersion: "" });
  assert.equal(seen[0].headers.version, undefined);
  await assert.rejects(qradarConnector.test({ ...config, token: "bad" }), /credentials were rejected/);
});

// ─── Elastic Security ───────────────────────────────────────────────────────

const elasticHit = {
  _id: "6a1e4f0c",
  _source: {
    "@timestamp": "2026-10-25T14:00:00.000Z",
    "kibana.alert.uuid": "6a1e4f0c",
    "kibana.alert.rule.name": "Suspicious Execution via Scheduled Task",
    "kibana.alert.rule.description": "Identifies execution of a suspicious program via scheduled tasks.",
    "kibana.alert.severity": "high",
    "kibana.alert.risk_score": 73,
    "kibana.alert.workflow_status": "closed",
    "kibana.alert.workflow_reason": "true_positive",
    "kibana.alert.original_time": "2026-10-25T13:58:12.000Z",
    "kibana.alert.rule.tags": ["Domain: Endpoint", "OS: Windows", "Tactic: Persistence"],
    "kibana.alert.rule.threat": [
      {
        framework: "MITRE ATT&CK",
        tactic: { id: "TA0003", name: "Persistence", reference: "https://attack.mitre.org/tactics/TA0003/" },
        technique: [{ id: "T1053", name: "Scheduled Task/Job", reference: "x", subtechnique: [{ id: "T1053.005", name: "Scheduled Task", reference: "x" }] }],
      },
    ],
    host: { name: "srv-app-03", os: { name: "Windows" } },
    user: { name: "svc_deploy" },
  },
};

test("Elastic: reads flat alert fields and nested host fields, with tactic, technique and sub-technique", () => {
  const { category, alert } = mapElasticAlert(elasticHit);
  assert.equal(category, "edr");
  assert.equal(alert.id, "ELASTIC-6a1e4f0c");
  assert.equal(alert.severity, "High");
  assert.equal(alert.rawLog.classification, "truePositive");
  assert.deepEqual(alert.mitreTactics, ["Persistence"]);
  assert.deepEqual(alert.mitreTechniques, ["T1053", "T1053.005"]);
  assert.equal(alert.timestamp, "2026-10-25T13:58:12.000Z");
  assert.deepEqual(alert.affectedEntities, ["srv-app-03", "svc_deploy"]);
  assert.equal(alert.platform, "Windows");
  assert.equal(field({ a: { b: 1 } }, "a.b"), 1);
  assert.equal(field({ "a.b": 2 }, "a.b"), 2);
  const src = elasticHit._source;
  const reason = (r?: string) => mapElasticAlert({ _id: "x", _source: { ...src, "kibana.alert.workflow_reason": r } }).alert.rawLog.classification;
  assert.equal(reason("false_positive"), "falsePositive");
  assert.equal(reason("benign_positive"), "informationalExpectedActivity");
  assert.equal(reason("duplicate"), "informationalExpectedActivity");
  assert.equal(reason("other"), "unknown");
  assert.equal(reason(undefined), "unknown"); // closed without a reason, or Stack before 9.2
  // fully nested _source works too
  const nested = mapElasticAlert({ _id: "n1", _source: { "@timestamp": "2026-10-25T14:00:00.000Z", kibana: { alert: { uuid: "n1", severity: "critical", rule: { name: "AWS Root Login", tags: ["Domain: Cloud"] } } } } });
  assert.equal(nested.alert.severity, "Critical");
  assert.equal(nested.category, "cloud");
});

test("Elastic: API key is accepted encoded or as id:key, and the query pages by (timestamp, uuid)", () => {
  assert.equal(encodeApiKey("abc123:secretkey"), Buffer.from("abc123:secretkey").toString("base64"));
  assert.equal(encodeApiKey("YWJjMTIzOnNlY3JldGtleQ=="), "YWJjMTIzOnNlY3JldGtleQ==");
  const q1: any = buildQuery(SINCE);
  assert.deepEqual(q1.query.bool.filter[0], { term: { "kibana.alert.workflow_status": "closed" } });
  assert.deepEqual(q1.sort, [{ "@timestamp": "asc" }, { "kibana.alert.uuid": "asc" }]);
  assert.equal(q1.query.bool.filter.length, 2);
  assert.equal("search_after" in q1, false); // the endpoint drops it
  const q2: any = buildQuery(SINCE, { ts: "2026-10-25T14:00:00.000Z", uuid: "6a1e" });
  assert.equal(q2.query.bool.filter.length, 3);
  assert.deepEqual(q2.query.bool.filter[2].bool.should[0], { range: { "@timestamp": { gt: "2026-10-25T14:00:00.000Z" } } });
});

test("Elastic: sends ApiKey and kbn-xsrf headers, honours the space, and pages until a short page", async () => {
  seen.length = 0;
  const full = Array.from({ length: 1000 }, (_, i) => ({ _id: `u${i}`, _source: { ...elasticHit._source, "kibana.alert.uuid": `u${String(i).padStart(4, "0")}` } }));
  handler = (req) => {
    if (req.headers.authorization !== `ApiKey ${Buffer.from("id1:key1").toString("base64")}`) return [401, { statusCode: 401, error: "Unauthorized", message: "missing authentication credentials" }];
    if (req.path !== "/s/soc/api/detection_engine/signals/search") return [404, { statusCode: 404, error: "Not Found", message: "Not Found" }];
    const body = JSON.parse(req.body);
    if (body.size === 0) return [200, { hits: { total: { value: 4821, relation: "eq" }, hits: [] } }];
    return [200, { hits: { hits: body.query.bool.filter.length === 2 ? full : [elasticHit] } }];
  };
  const config = { kibanaUrl: base, apiKey: "id1:key1", space: "soc", verifyTls: "yes" };
  const alerts = await elasticConnector.fetchAlerts(config, SINCE);
  assert.equal(alerts.length, 1001);
  assert.equal(seen[0].headers["kbn-xsrf"], "true");
  assert.equal(seen[0].method, "POST");
  const second = JSON.parse(seen[1].body);
  assert.deepEqual(second.query.bool.filter[2].bool.should[1].bool.filter[1], { range: { "kibana.alert.uuid": { gt: "u0999" } } });
  assert.match((await elasticConnector.test(config)).message, /4821 alerts visible/);
  await assert.rejects(elasticConnector.test({ ...config, apiKey: "bad:key" }), /credentials were rejected.*missing authentication/);
  await assert.rejects(elasticConnector.test({ ...config, space: "" }), /HTTP 404/);
});

// ─── Category sorting ────────────────────────────────────────────────────────

test("alerts are sorted into the six categories from product names and titles", () => {
  const cases: [string, string | null][] = [
    // products
    ["Microsoft Defender for Endpoint", "edr"],
    ["CrowdStrike Falcon", "edr"],
    ["Microsoft Defender for Office 365", "email"],
    ["Proofpoint TAP", "email"],
    ["Palo Alto PA Series", "network"],
    ["Fortinet FortiGate Security Gateway", "network"],
    ["Azure Firewall", "network"],
    ["Azure Web Application Firewall", "web"], // WAF is web, not network
    ["AWS WAF", "web"],
    ["Zscaler Nss", "web"],
    ["Blue Coat Web Security Service", "web"],
    ["Microsoft Defender for Cloud", "cloud"],
    ["Amazon AWS CloudTrail", "cloud"],
    ["Okta Identity Management", "identity"],
    ["Microsoft Entra ID Protection", "identity"],
    ["Microsoft Defender for Identity", "identity"],
    ["Microsoft Windows Active Directory", "identity"],
    ["Microsoft Windows Security Event Log", "edr"],
    // titles
    ["Email messages containing malicious URL removed after delivery", "email"],
    ["Suspicious inbox rule created", "email"],
    ["SQL injection attempt against customer portal", "web"],
    ["Impossible travel activity", "identity"],
    ["Password spray against multiple accounts", "identity"],
    ["MFA fatigue: repeated push denials", "identity"],
    ["Kerberoasting activity detected", "identity"],
    ["Storage account key exported", "cloud"],
    ["Kubernetes pod with privileged container", "cloud"],
    ["Brute force then successful sign-in", "identity"],
    ["Ransomware behaviour on FILESRV-02", "edr"],
    ["Port scan from internal host", "network"],
    ["Lateral movement via SMB", "network"],
    // whole words only
    ["Tips for kids", null],
    ["Fedramp boundary review", null],
    ["Quarterly review", null],
  ];
  for (const [text, expected] of cases) assert.equal(matchCategory(text), expected, text);
  assert.equal(mapProductToCategory("Quarterly review"), "cloud");
  assert.equal(mapProductToCategory("Quarterly review", "network"), "network");
});

test("connectors categorise from the most specific evidence they have", () => {
  // Splunk: the security domain decides, except that email and web have no domain of their own
  assert.equal(splunkCategory({ security_domain: "endpoint", rule_name: "Endpoint - Suspicious DNS Query - Rule" }), "edr");
  assert.equal(splunkCategory({ security_domain: "network", rule_name: "Network - Unusual Outbound Volume - Rule" }), "network");
  assert.equal(splunkCategory({ security_domain: "threat", rule_name: "Threat - Phishing Link Clicked - Rule" }), "email");
  assert.equal(splunkCategory({ security_domain: "network", rule_name: "Network - Web Proxy Blocked Category - Rule" }), "web");
  assert.equal(splunkCategory({ security_domain: "identity", rule_name: "Identity - Activity from Expired Account - Rule" }), "identity");
  assert.equal(splunkCategory({ security_domain: "access", rule_name: "Access - AWS IAM Privilege Escalation - Rule" }), "cloud"); // cloud control plane, not a user sign-in
  assert.equal(splunkCategory({ security_domain: "audit", rule_name: "Audit - Expected Host Not Reporting - Rule" }), "cloud");
  assert.equal(splunkCategory({ security_domain: "threat", rule_name: "Threat - Watchlisted Event Observed - Rule" }), "edr");
  // Sentinel: analytics-rule alerts all say "Azure Sentinel", so the titles decide
  const sentinel = (product: string, alertTitle: string, incidentTitle = "x") =>
    mapSentinelIncident({ ...armIncident, properties: { ...armIncident.properties, title: incidentTitle } }, [{ properties: { ...armAlert.properties, productName: product, alertDisplayName: alertTitle } }])[0].category;
  assert.equal(sentinel("Azure Sentinel", "Malicious inbox rule and phishing campaign"), "email");
  assert.equal(sentinel("Azure Sentinel", "Rare process on endpoint with PowerShell"), "edr");
  assert.equal(sentinel("Azure Sentinel", "Anomalous sign-in from unfamiliar location"), "identity");
  assert.equal(sentinel("Microsoft Defender for Endpoint", "Suspicious activity"), "edr");
  assert.equal(sentinel("Azure Sentinel", "Unclassifiable", "Unclassifiable"), "cloud"); // documented fallback
  // QRadar: log source type first, then categories and description; falls back to network
  const q = (o: any) => mapQRadarOffense({ ...offense, log_sources: [], categories: [], description: "x", ...o }).category;
  assert.equal(q({ log_sources: [{ type_name: "Microsoft Windows Security Event Log", name: "DC01" }] }), "edr");
  assert.equal(q({ log_sources: [{ type_name: "Proofpoint Enterprise Protection", name: "pp" }] }), "email");
  assert.equal(q({ log_sources: [{ type_name: "Amazon AWS CloudTrail", name: "ct" }] }), "cloud");
  assert.equal(q({ categories: ["Web Exploit"], description: "SQL Injection detected" }), "web");
  assert.equal(q({}), "network");
  // Cortex: the raising product decides before any keyword
  const cx = (o: any) => mapCortexIncident({ ...cortexIncident, incident_sources: [], alert_categories: [], description: "x", ...o }).category;
  assert.equal(cx({ incident_sources: ["XDR Agent"], description: "Phishing payload executed" }), "edr");
  assert.equal(cx({ incident_sources: ["PAN NGFW"] }), "network");
  assert.equal(cx({ incident_sources: ["Prisma Cloud"] }), "cloud");
  assert.equal(cx({ incident_sources: ["Correlation"], description: "Impossible travel for user" }), "identity");
  assert.equal(cx({ incident_sources: ["Correlation"] }), "edr");
});

test("identity alerts get their own category from each vendor's own signal", () => {
  const dAlert = (serviceSource: string) => mapDefenderIncident({ ...defenderIncident, alerts: [{ ...defenderIncident.alerts[0], serviceSource }] })[0].category;
  assert.equal(dAlert("microsoftDefenderForIdentity"), "identity");
  assert.equal(dAlert("azureAdIdentityProtection"), "identity");
  assert.equal(dAlert("microsoftDefenderForCloudApps"), "cloud");
  assert.equal(mapCrowdStrikeAlert({ ...csAlert, product: "idp" }).category, "identity");
  assert.equal(mapElasticAlert({ _id: "i1", _source: { ...elasticHit._source, "kibana.alert.rule.tags": ["Domain: Identity"] } }).category, "identity");
  assert.equal(q0({ log_sources: [{ type_name: "Okta Identity Management", name: "okta" }] }), "identity");
});
const q0 = (o: any) => mapQRadarOffense({ ...offense, log_sources: [], categories: [], description: "x", ...o }).category;

// ─── Registry ───────────────────────────────────────────────────────────────

test("eight connectors are registered with unique ids and alert prefixes", () => {
  assert.deepEqual(CONNECTORS.map((c) => c.id), ["defender", "sentinel", "splunk", "qradar", "elastic", "crowdstrike", "sentinelone", "cortex"]);
  assert.equal(new Set(CONNECTORS.map((c) => c.idPrefix)).size, CONNECTORS.length);
  for (const c of CONNECTORS) {
    assert.ok(c.fields.some((f) => f.type === "password" && f.required), `${c.id} has a secret field`);
    assert.ok(c.setupSteps.length >= 2 && c.docsUrl.startsWith("https://"), c.id);
    // no prefix may be the start of another, or disconnecting one source would delete another's alerts
    for (const other of CONNECTORS) if (other !== c) assert.ok(!other.idPrefix.startsWith(c.idPrefix), `${c.idPrefix} vs ${other.idPrefix}`);
  }
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
  const s = summariseRisk(alerts, (id) => /^T\d{4}/.test(id), {
    anchor: { annualEventProbability: 0.05, lossMedian: 500_000, lossP95: 12_000_000 },
    periodYears: 0.25,
  });
  assert.equal(s.incidentCount, 4);
  assert.equal(s.confirmedIncidents, 3);
  assert.equal(s.dismissedIncidents, 1);
  // Seriousness weights: CrowdStrike lateral movement 0.45, SentinelOne credential access 0.3, Splunk impact 0.75
  assert.ok(Math.abs(s.seriousnessWeight - (0.45 + 0.3 + 0.75)) < 1e-9);
  assert.ok(s.lossAvoided.mean > 0 && s.lossAvoided.mean <= s.exposure);
});
