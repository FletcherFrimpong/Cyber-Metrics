// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RISK_CONFIG as C,
  scoreIncidents,
  simulateLossAvoided,
  summariseRisk,
  verdictFor,
  type ModelAlert,
} from "./risk-model.ts";

const known = (id: string) => id === "T1059" || id === "T1486";

let n = 0;
function alert(over: Record<string, any> = {}): ModelAlert {
  const { bucket = "edr", rawLog = {}, ...rest } = over;
  return {
    bucket,
    alert: {
      id: `A${++n}`,
      timestamp: "2026-10-05T00:00:00Z",
      severity: "High",
      category: "Malware",
      title: "t",
      description: "d",
      source: "s",
      platform: "p",
      rawLog,
      mitreTactics: [],
      mitreTechniques: [],
      iocIndicators: [],
      affectedEntities: [],
      remediationSteps: [],
      costImpact: 200000,
      ...rest,
    },
  };
}

test("analyst verdict is read from the incident classification", () => {
  assert.equal(verdictFor(alert({ rawLog: { classification: "truePositive" } }).alert), "confirmed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "TruePositive" } }).alert), "confirmed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "falsePositive" } }).alert), "dismissed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "informationalExpectedActivity" } }).alert), "dismissed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "unknown" } }).alert), "unverified");
  assert.equal(verdictFor(alert({ status: "False Positive" }).alert), "dismissed");
});

test("an analyst-dismissed incident contributes nothing, whatever its severity", () => {
  const [inc] = scoreIncidents(
    [alert({ severity: "Critical", costImpact: 750000, rawLog: { classification: "falsePositive", Confidence: 99 } })],
    known
  );
  assert.equal(inc.expectedLossAvoided, 0);
});

test("severity alone no longer makes an unverified alert count", () => {
  const [inc] = scoreIncidents([alert({ severity: "Critical", costImpact: 750000 })], known);
  assert.equal(inc.pReal, 0);
  assert.equal(inc.expectedLossAvoided, 0);
});

test("unverified alerts are gated and weighted by tool confidence", () => {
  const score = (over: Record<string, any>) => scoreIncidents([alert(over)], known)[0].pReal;
  assert.equal(score({ mitreTechniques: ["T1059.001"], confidence: 80 }), 0.8);
  assert.equal(score({ mitreTechniques: ["T1059"], confidence: 60 }), 0);
  assert.equal(score({ confidence: 95 }), 0.95);
  assert.equal(score({ confidence: 85 }), 0);
  assert.equal(score({ mitreTechniques: ["T1059"] }), C.defaultUnverifiedConfidence);
});

test("expected loss = P(real) x P(escalation at furthest stage) x benchmark", () => {
  const [inc] = scoreIncidents(
    [alert({ rawLog: { classification: "truePositive" }, mitreTactics: ["Execution", "LateralMovement"], costImpact: 200000 })],
    known
  );
  assert.equal(inc.stage, "lateralMovement");
  assert.equal(inc.expectedLossAvoided, 200000 * C.escalationByStage.lateralMovement);
});

test("without a MITRE tactic, escalation falls back to severity", () => {
  const [inc] = scoreIncidents([alert({ severity: "Critical", rawLog: { classification: "truePositive" } })], known);
  assert.equal(inc.stage, null);
  assert.equal(inc.pEscalation, C.escalationBySeverity.Critical);
});

test("alerts in one incident are a single loss event, not one each", () => {
  const raw = { incidentId: "INC-1", classification: "truePositive" };
  const incidents = scoreIncidents(
    [
      alert({ rawLog: raw, costImpact: 45000, severity: "Medium", mitreTactics: ["Execution"] }),
      alert({ rawLog: raw, costImpact: 750000, severity: "Critical", mitreTactics: ["Impact"] }),
      alert({ rawLog: raw, costImpact: 200000, severity: "High", bucket: "network" }),
    ],
    known
  );
  assert.equal(incidents.length, 1);
  assert.equal(incidents[0].alertCount, 3);
  assert.equal(incidents[0].loss, 750000);
  assert.equal(incidents[0].severity, "Critical");
  assert.equal(incidents[0].stage, "impact");
  assert.equal(incidents[0].bucket, "edr");
});

test("simulation is reproducible, ordered, and centred on the analytic mean", () => {
  const alerts = Array.from({ length: 200 }, (_, i) =>
    alert({ rawLog: { classification: "truePositive" }, mitreTactics: [i % 2 ? "Execution" : "Exfiltration"] })
  );
  const incidents = scoreIncidents(alerts, known);
  const a = simulateLossAvoided(incidents);
  const b = simulateLossAvoided(incidents);
  assert.deepEqual(a, b);
  assert.ok(a.p5 < a.p50 && a.p50 < a.p95);
  assert.ok(a.p5 < a.mean && a.mean < a.p95);
  const expected = 100 * 200000 * 0.1 + 100 * 200000 * 0.6;
  assert.ok(Math.abs(a.mean - expected) < 1e-6);
  assert.ok(Math.abs(a.p50 - expected) / expected < 0.1, `median ${a.p50} vs mean ${expected}`);
});

test("summary separates confirmed, unverified and dismissed, and stays below gross exposure", () => {
  const s = summariseRisk(
    [
      alert({ rawLog: { classification: "truePositive" }, mitreTactics: ["Impact"], department: "Finance" }),
      alert({ mitreTechniques: ["T1059"], confidence: 80, mitreTactics: ["Execution"], bucket: "email" }),
      alert({ rawLog: { classification: "falsePositive" } }),
      alert({ severity: "Low", confidence: 40 }),
    ],
    known
  );
  assert.equal(s.incidentCount, 4);
  assert.equal(s.confirmedIncidents, 1);
  assert.equal(s.unverifiedIncidents, 1);
  assert.equal(s.dismissedIncidents, 2);
  assert.equal(s.countedAlerts, 2);
  assert.equal(s.grossExposure, 400000);
  assert.equal(s.lossAvoided.mean, 200000 * 0.75 + 200000 * 0.8 * 0.1);
  assert.ok(s.lossAvoided.mean < s.grossExposure);
  assert.deepEqual(s.byCategory.map(r => r.key), ["edr", "email"]);
  assert.equal(s.byDepartment[0].key, "Finance");
  assert.ok(s.confirmedShare > 0.9);
});

test("no alerts yields zeros", () => {
  const s = summariseRisk([], known);
  assert.deepEqual(s.lossAvoided, { mean: 0, p5: 0, p50: 0, p95: 0 });
  assert.equal(s.confirmedShare, 0);
});
