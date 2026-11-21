// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RISK_CONFIG as C,
  scoreIncidents,
  summariseRisk,
  verdictFor,
  expectedLossPerEvent,
  lognormalFromQuantiles,
  annualRate,
  type ModelAlert,
  type PeerAnchor,
} from "./risk-model.ts";
import { REVENUE_BANDS, DEFAULT_REVENUE_BAND, getRevenueBand } from "./anchor-data.ts";

const known = (id: string) => id === "T1059" || id === "T1486";
const ANCHOR: PeerAnchor = { annualEventProbability: 0.05, lossMedian: 500_000, lossP95: 12_000_000 };
const near = (a: number, b: number, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

let n = 0;
function alert(over: Record<string, any> = {}): ModelAlert {
  const { bucket = "edr", rawLog = {}, ...rest } = over;
  return {
    bucket,
    alert: {
      id: `A${++n}`, timestamp: "2026-10-05T00:00:00Z", severity: "High", category: "Malware", title: "t",
      description: "d", source: "s", platform: "p", rawLog, mitreTactics: [], mitreTechniques: [],
      iocIndicators: [], affectedEntities: [], remediationSteps: [], costImpact: 200000, ...rest,
    },
  };
}
const confirmed = (tactic: string, over: Record<string, any> = {}) =>
  alert({ rawLog: { classification: "truePositive", ...(over.rawLog || {}) }, mitreTactics: [tactic], ...over, ...(over.rawLog ? { rawLog: { classification: "truePositive", ...over.rawLog } } : {}) });
const run = (alerts: ModelAlert[], opts: Partial<Parameters<typeof summariseRisk>[2]> = {}) =>
  summariseRisk(alerts, known, { anchor: ANCHOR, periodYears: 1, ...opts });

// ─── Incident scoring ───────────────────────────────────────────────────────

test("analyst verdict is read from the incident classification", () => {
  assert.equal(verdictFor(alert({ rawLog: { classification: "truePositive" } }).alert), "confirmed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "TruePositive" } }).alert), "confirmed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "falsePositive" } }).alert), "dismissed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "informationalExpectedActivity" } }).alert), "dismissed");
  assert.equal(verdictFor(alert({ rawLog: { classification: "unknown" } }).alert), "unverified");
  assert.equal(verdictFor(alert({ status: "False Positive" }).alert), "dismissed");
});

test("dismissed incidents and severity-only alerts carry no weight", () => {
  const [fp] = scoreIncidents([alert({ severity: "Critical", rawLog: { classification: "falsePositive", Confidence: 99 } })], known);
  assert.equal(fp.weight, 0);
  const [sev] = scoreIncidents([alert({ severity: "Critical" })], known);
  assert.equal(sev.weight, 0);
});

test("unverified alerts are gated and weighted by tool confidence", () => {
  const p = (over: Record<string, any>) => scoreIncidents([alert(over)], known)[0].pReal;
  assert.equal(p({ mitreTechniques: ["T1059.001"], confidence: 80 }), 0.8);
  assert.equal(p({ mitreTechniques: ["T1059"], confidence: 60 }), 0);
  assert.equal(p({ confidence: 95 }), 0.95);
  assert.equal(p({ confidence: 85 }), 0);
  assert.equal(p({ mitreTechniques: ["T1059"] }), C.defaultUnverifiedConfidence);
});

test("weight = P(real) x stage weight at the furthest stage, falling back to severity", () => {
  const [a] = scoreIncidents([alert({ rawLog: { classification: "truePositive" }, mitreTactics: ["Execution", "LateralMovement"] })], known);
  assert.equal(a.stage, "lateralMovement");
  assert.equal(a.weight, C.escalationByStage.lateralMovement);
  const [b] = scoreIncidents([alert({ severity: "Critical", rawLog: { classification: "truePositive" } })], known);
  assert.equal(b.stage, null);
  assert.equal(b.weight, C.escalationBySeverity.Critical);
});

test("alerts in one incident are a single event, categorised by its most severe alert", () => {
  const raw = { incidentId: "INC-1", classification: "truePositive" };
  const incidents = scoreIncidents(
    [
      alert({ rawLog: raw, severity: "Medium", mitreTactics: ["Execution"], bucket: "email" }),
      alert({ rawLog: raw, severity: "Critical", mitreTactics: ["Impact"], bucket: "edr" }),
      alert({ rawLog: raw, severity: "High", bucket: "network" }),
    ],
    known
  );
  assert.equal(incidents.length, 1);
  assert.equal(incidents[0].alertCount, 3);
  assert.equal(incidents[0].severity, "Critical");
  assert.equal(incidents[0].stage, "impact");
  assert.equal(incidents[0].bucket, "edr");
  assert.equal(incidents[0].weight, C.escalationByStage.impact);
});

// ─── Published loss data ────────────────────────────────────────────────────

test("lognormal fit reproduces the published median and 95th percentile", () => {
  const { mu, sigma } = lognormalFromQuantiles(500_000, 12_000_000);
  near(Math.exp(mu), 500_000);
  near(Math.exp(mu + 1.6448536269514722 * sigma), 12_000_000);
});

test("expected loss per event sits between the median and the cap, checked by simulation", () => {
  const e = expectedLossPerEvent(ANCHOR);
  assert.ok(e > ANCHOR.lossMedian && e < ANCHOR.lossP95, String(e));
  // Independent check: average of capped lognormal draws
  const { mu, sigma } = lognormalFromQuantiles(ANCHOR.lossMedian, ANCHOR.lossP95);
  let seed = 12345, sum = 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const N = 400000;
  for (let i = 0; i < N; i++) {
    const z = Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-12))) * Math.cos(2 * Math.PI * rnd());
    sum += Math.min(Math.exp(mu + sigma * z), ANCHOR.lossP95);
  }
  assert.ok(Math.abs(sum / N - e) / e < 0.02, `${sum / N} vs ${e}`);
});

test("annual rate inverts P(at least one event)", () => {
  near(1 - Math.exp(-annualRate(0.05)), 0.05);
  assert.equal(annualRate(0), 0);
});

test("every revenue band is internally consistent", () => {
  assert.equal(REVENUE_BANDS.length, 6);
  for (const b of REVENUE_BANDS) {
    assert.ok(b.annualEventProbabilityLow! <= b.annualEventProbability && b.annualEventProbability <= b.annualEventProbabilityHigh!, b.id);
    assert.ok(b.lossMedian < b.lossP95, b.id);
    assert.ok(b.annualEventProbability > 0 && b.annualEventProbability < 1, b.id);
  }
  assert.equal(getRevenueBand("100m-1b"), DEFAULT_REVENUE_BAND);
  assert.equal(getRevenueBand("nope"), undefined);
  assert.equal(getRevenueBand(null), undefined);
});

// ─── The anchored total ─────────────────────────────────────────────────────

test("exposure follows the published formula and loss avoided = exposure x effectiveness", () => {
  const s = run([confirmed("Impact"), confirmed("Lateral Movement")]);
  const m = C.typicalControlEffectiveness;
  const W = C.escalationByStage.impact + C.escalationByStage.lateralMovement;
  const exposure = (annualRate(0.05) / (1 - m)) * expectedLossPerEvent(ANCHOR);
  const eff = (m * C.priorStrength + W) / (C.priorStrength + W);
  near(s.seriousnessWeight, W);
  near(s.exposure, exposure);
  near(s.controlEffectiveness.mean, eff);
  near(s.lossAvoided.mean, exposure * eff);
  near(s.residualLoss, exposure * (1 - eff));
  near(s.peerAnnualLoss, annualRate(0.05) * expectedLossPerEvent(ANCHOR));
});

test("THE ANCHOR: loss avoided can never exceed exposure, however many incidents there are", () => {
  const few = run(Array.from({ length: 3 }, () => confirmed("Impact")));
  const many = run(Array.from({ length: 5000 }, () => confirmed("Impact")));
  assert.ok(many.lossAvoided.mean <= many.exposure);
  assert.ok(many.lossAvoided.mean / many.exposure > 0.999);
  near(few.exposure, many.exposure); // exposure does not depend on alert volume
  assert.ok(many.lossAvoided.mean < few.lossAvoided.mean * 1.5, "1,600x the incidents must not mean 1,600x the dollars");
});

test("with no incident data the estimate falls back to a typical organisation", () => {
  const s = run([]);
  near(s.controlEffectiveness.mean, C.typicalControlEffectiveness);
  near(s.lossAvoided.mean, s.exposure * C.typicalControlEffectiveness);
  // which leaves exactly what peers are observed to lose
  near(s.residualLoss, s.peerAnnualLoss);
});

test("loss events actually suffered reduce control effectiveness", () => {
  const alerts = [confirmed("Impact"), confirmed("Exfiltration")];
  const clean = run(alerts);
  const breached = run(alerts, { lossEventsSuffered: 2 });
  assert.ok(breached.controlEffectiveness.mean < clean.controlEffectiveness.mean);
  assert.ok(breached.lossAvoided.mean < clean.lossAvoided.mean);
  near(breached.exposure, clean.exposure);
});

test("exposure scales with the period; a quarter is a quarter of a year", () => {
  const year = run([confirmed("Impact")], { periodYears: 1 });
  const quarter = run([confirmed("Impact")], { periodYears: 0.25 });
  near(quarter.exposure, year.exposure / 4);
  near(quarter.annualLossProbabilityWithoutControls, year.annualLossProbabilityWithoutControls); // always annual
});

test("a larger organisation has a larger exposure", () => {
  const exposures = REVENUE_BANDS.map((b) => run([], { anchor: b }).exposure);
  for (let i = 1; i < exposures.length; i++) assert.ok(exposures[i] > exposures[i - 1], `band ${i}`);
});

test("controls lower the chance of a material loss in the year", () => {
  const s = run(Array.from({ length: 20 }, () => confirmed("Lateral Movement")));
  assert.ok(s.annualLossProbabilityWithControls < s.annualLossProbabilityWithoutControls);
  near(s.annualLossProbabilityWithoutControls, 1 - Math.exp(-annualRate(0.05) / (1 - C.typicalControlEffectiveness)));
});

test("the total is shared between incidents by weight, and breakdowns add up", () => {
  const s = run([
    confirmed("Impact", { department: "Finance" }),
    confirmed("Execution", { bucket: "email" }),
    alert({ rawLog: { classification: "falsePositive" } }),
    alert({ severity: "Low", confidence: 40 }),
  ]);
  assert.equal(s.incidentCount, 4);
  assert.equal(s.confirmedIncidents, 2);
  assert.equal(s.dismissedIncidents, 2);
  assert.equal(s.countedAlerts, 2);
  near(s.byCategory.reduce((t, r) => t + r.expectedLossAvoided, 0), s.lossAvoided.mean);
  near(s.byDepartment.reduce((t, r) => t + r.expectedLossAvoided, 0), s.lossAvoided.mean);
  assert.deepEqual(s.byCategory.map((r) => r.key), ["edr", "email"]);
  near(s.byCategory[0].expectedLossAvoided / s.byCategory[1].expectedLossAvoided, C.escalationByStage.impact / C.escalationByStage.execution);
  assert.equal(s.byDepartment[0].key, "Finance");
  assert.equal(s.confirmedShare, 1);
});

test("the range is reproducible, ordered, and wider when the published frequency is a range", () => {
  const alerts = Array.from({ length: 30 }, () => confirmed("Credential Access"));
  const a = run(alerts);
  const b = run(alerts);
  assert.deepEqual(a.lossAvoided, b.lossAvoided);
  assert.ok(a.lossAvoided.p5 < a.lossAvoided.p50 && a.lossAvoided.p50 < a.lossAvoided.p95);
  assert.ok(a.controlEffectiveness.p5 <= a.controlEffectiveness.mean && a.controlEffectiveness.mean <= a.controlEffectiveness.p95 + 1e-9);
  const wide = run(alerts, { anchor: { ...ANCHOR, annualEventProbabilityLow: 0.01, annualEventProbabilityHigh: 0.2 } });
  assert.ok(wide.lossAvoided.p95 / wide.lossAvoided.p5 > a.lossAvoided.p95 / a.lossAvoided.p5);
});

test("the typical-effectiveness assumption moves exposure in the documented direction", () => {
  const low = run([], { config: { ...C, typicalControlEffectiveness: 0.25 } });
  const high = run([], { config: { ...C, typicalControlEffectiveness: 0.5 } });
  assert.ok(high.exposure > low.exposure);
  near(high.exposure / low.exposure, 0.75 / 0.5);
});
