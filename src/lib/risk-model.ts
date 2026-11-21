// CARA risk model — loss avoided from detected-and-contained incidents.
//
// For each incident:
//
//   expected loss avoided = P(real) × P(escalation | stage) × loss if escalated
//
//   P(real)        1 when an analyst classified the incident a true positive,
//                  0 when classified false/benign positive. With no verdict the
//                  alert must pass a detection-quality gate and is then weighted
//                  by the detection tool's confidence.
//   P(escalation)  chance the attack would have reached its damaging outcome had
//                  it not been contained, set by the furthest kill-chain stage
//                  observed (MITRE ATT&CK tactic). Falls back to severity.
//   loss           benchmark loss for the incident (category × severity). Alerts
//                  in the same incident are ONE loss event, not one each.
//
// Totals are reported as a mean plus a 5th–95th percentile range from a seeded
// Monte Carlo simulation, so the same data always yields the same numbers.
//
// This file has no runtime imports so it can run in the browser, on the server
// and under `node --test`.

import type { SecurityAlert } from "@/types/alerts";

// ─── ASSUMPTIONS ────────────────────────────────────────────────────────────
// Every judgment-based parameter lives here. These are starting defaults, not
// published figures: calibrate them per customer before quoting the output.

export interface RiskModelConfig {
  /** P(escalation) by kill-chain stage, earliest to latest. */
  escalationByStage: Record<KillChainStage, number>;
  /** P(escalation) when an incident has no usable MITRE mapping. */
  escalationBySeverity: Record<Severity, number>;
  /** P(real) for an unverified alert that passes the gate but reports no confidence. */
  defaultUnverifiedConfidence: number;
  /** Minimum tool confidence (0–100) for an unverified alert WITH a MITRE mapping. */
  gateConfidenceWithMitre: number;
  /** Minimum tool confidence (0–100) for an unverified alert WITHOUT a MITRE mapping. */
  gateConfidenceWithoutMitre: number;
  /** Spread of the loss distribution (lognormal sigma). Benchmark is the mean. */
  lossSigma: number;
  /** Monte Carlo trials. */
  trials: number;
}

export type Severity = "Critical" | "High" | "Medium" | "Low";

export type KillChainStage =
  | "reconnaissance"
  | "initialAccess"
  | "execution"
  | "foothold"
  | "credentialAccess"
  | "commandAndControl"
  | "lateralMovement"
  | "exfiltration"
  | "impact";

export const DEFAULT_RISK_CONFIG: RiskModelConfig = {
  escalationByStage: {
    reconnaissance: 0.02,
    initialAccess: 0.05,
    execution: 0.1,
    foothold: 0.2,
    credentialAccess: 0.3,
    commandAndControl: 0.35,
    lateralMovement: 0.45,
    exfiltration: 0.6,
    impact: 0.75,
  },
  escalationBySeverity: { Critical: 0.3, High: 0.15, Medium: 0.05, Low: 0.01 },
  defaultUnverifiedConfidence: 0.5,
  gateConfidenceWithMitre: 70,
  gateConfidenceWithoutMitre: 90,
  lossSigma: 0.8,
  trials: 5000,
};

// Stages in kill-chain order; later index = further along.
const STAGE_ORDER: KillChainStage[] = [
  "reconnaissance",
  "initialAccess",
  "execution",
  "foothold",
  "credentialAccess",
  "commandAndControl",
  "lateralMovement",
  "exfiltration",
  "impact",
];

// MITRE ATT&CK tactic (normalised: lowercase letters only) → stage.
const TACTIC_TO_STAGE: Record<string, KillChainStage> = {
  reconnaissance: "reconnaissance",
  resourcedevelopment: "reconnaissance",
  initialaccess: "initialAccess",
  execution: "execution",
  persistence: "foothold",
  privilegeescalation: "foothold",
  defenseevasion: "foothold",
  discovery: "foothold",
  credentialaccess: "credentialAccess",
  commandandcontrol: "commandAndControl",
  lateralmovement: "lateralMovement",
  collection: "lateralMovement",
  exfiltration: "exfiltration",
  impact: "impact",
};

export function stageForTactic(tactic: string): KillChainStage | null {
  const key = (tactic || "").toLowerCase().replace(/[^a-z]/g, "");
  return TACTIC_TO_STAGE[key] ?? null;
}

// ─── VERDICT ────────────────────────────────────────────────────────────────

export type Verdict = "confirmed" | "dismissed" | "unverified";

/**
 * Analyst verdict from the SIEM. Reads the incident classification first, then
 * the alert's own, then our normalised status field.
 * Graph values: truePositive | falsePositive | informationalExpectedActivity | unknown.
 */
export function verdictFor(alert: SecurityAlert): Verdict {
  const raw = alert.rawLog || {};
  const values = [raw.classification, raw.alertClassification];
  for (const v of values) {
    const c = String(v || "").toLowerCase().replace(/[^a-z]/g, "");
    if (c === "truepositive") return "confirmed";
    if (c === "falsepositive" || c === "informationalexpectedactivity" || c === "benignpositive") {
      return "dismissed";
    }
  }
  if (alert.status === "False Positive") return "dismissed";
  return "unverified";
}

function confidenceOf(alert: SecurityAlert): number | null {
  const c = alert.confidence ?? alert.rawLog?.Confidence;
  return typeof c === "number" && isFinite(c) ? Math.max(0, Math.min(100, c)) : null;
}

/** P(real) for an alert with no analyst verdict. 0 means it fails the gate. */
export function unverifiedProbability(
  alert: SecurityAlert,
  isKnownTechnique: (id: string) => boolean,
  config: RiskModelConfig = DEFAULT_RISK_CONFIG
): number {
  const confidence = confidenceOf(alert);
  const hasMitre = (alert.mitreTechniques || []).some(
    t => isKnownTechnique(t) || isKnownTechnique(t.split(".")[0])
  );
  // Severity alone is not evidence that an alert is real.
  const threshold = hasMitre ? config.gateConfidenceWithMitre : config.gateConfidenceWithoutMitre;
  if (confidence === null) {
    return hasMitre ? config.defaultUnverifiedConfidence : 0;
  }
  return confidence >= threshold ? confidence / 100 : 0;
}

// ─── INCIDENTS ──────────────────────────────────────────────────────────────

export interface ModelAlert {
  alert: SecurityAlert;
  /** Product bucket the alert was filed under: edr | email | network | web | cloud. */
  bucket: string;
}

export interface IncidentRisk {
  id: string;
  bucket: string;
  department: string;
  severity: Severity;
  verdict: Verdict;
  alertCount: number;
  stage: KillChainStage | null;
  /** Benchmark loss had the incident escalated. */
  loss: number;
  pReal: number;
  pEscalation: number;
  /** pReal × pEscalation × loss */
  expectedLossAvoided: number;
}

const SEVERITY_RANK: Record<Severity, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

function incidentKey(alert: SecurityAlert): string {
  const id = alert.rawLog?.incidentId;
  return id ? `inc:${id}` : `alert:${alert.id}`;
}

/** Collapse alerts into incidents and score each one. */
export function scoreIncidents(
  alerts: ModelAlert[],
  isKnownTechnique: (id: string) => boolean,
  config: RiskModelConfig = DEFAULT_RISK_CONFIG
): IncidentRisk[] {
  const groups = new Map<string, ModelAlert[]>();
  for (const a of alerts) {
    const key = incidentKey(a.alert);
    const list = groups.get(key);
    if (list) list.push(a);
    else groups.set(key, [a]);
  }

  const incidents: IncidentRisk[] = [];
  for (const [id, members] of groups) {
    // Any analyst dismissal or confirmation applies to the whole incident.
    const verdicts = members.map(m => verdictFor(m.alert));
    const verdict: Verdict = verdicts.includes("confirmed")
      ? "confirmed"
      : verdicts.includes("dismissed")
        ? "dismissed"
        : "unverified";

    // The incident is one loss event: take the largest benchmark among its alerts.
    let lead = members[0];
    for (const m of members) {
      if ((m.alert.costImpact || 0) > (lead.alert.costImpact || 0)) lead = m;
    }

    let severity: Severity = "Low";
    let stageIdx = -1;
    const deptCounts = new Map<string, number>();
    for (const m of members) {
      const sev = m.alert.severity as Severity;
      if (SEVERITY_RANK[sev] > SEVERITY_RANK[severity]) severity = sev;
      for (const tactic of m.alert.mitreTactics || []) {
        const stage = stageForTactic(tactic);
        if (stage) stageIdx = Math.max(stageIdx, STAGE_ORDER.indexOf(stage));
      }
      const dept = m.alert.department || "Unattributed";
      deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
    }
    const stage = stageIdx >= 0 ? STAGE_ORDER[stageIdx] : null;
    const department = [...deptCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

    let pReal = 0;
    if (verdict === "confirmed") pReal = 1;
    else if (verdict === "unverified") {
      for (const m of members) {
        pReal = Math.max(pReal, unverifiedProbability(m.alert, isKnownTechnique, config));
      }
    }

    const pEscalation = stage
      ? config.escalationByStage[stage]
      : config.escalationBySeverity[severity] ?? 0;
    const loss = Math.max(0, lead.alert.costImpact || 0);

    incidents.push({
      id,
      bucket: lead.bucket,
      department,
      severity,
      verdict,
      alertCount: members.length,
      stage,
      loss,
      pReal,
      pEscalation,
      expectedLossAvoided: pReal * pEscalation * loss,
    });
  }
  return incidents;
}

// ─── SIMULATION ─────────────────────────────────────────────────────────────

// Small seeded PRNG (mulberry32) so results are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string, h = 2166136261): number {
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface LossDistribution {
  mean: number;
  p5: number;
  p50: number;
  p95: number;
}

/**
 * Distribution of total loss avoided. Each incident independently escalates
 * with probability pReal × pEscalation; if it does, its loss is drawn from a
 * lognormal whose mean is the benchmark.
 */
export function simulateLossAvoided(
  incidents: IncidentRisk[],
  config: RiskModelConfig = DEFAULT_RISK_CONFIG
): LossDistribution {
  const live = incidents.filter(i => i.expectedLossAvoided > 0);
  const mean = live.reduce((s, i) => s + i.expectedLossAvoided, 0);
  if (live.length === 0) return { mean: 0, p5: 0, p50: 0, p95: 0 };

  let seed = 2166136261;
  for (const i of live) seed = hashString(i.id, seed);
  const rand = mulberry32(seed);

  const sigma = config.lossSigma;
  const p = live.map(i => i.pReal * i.pEscalation);
  // mu chosen so the lognormal's MEAN equals the benchmark loss.
  const mu = live.map(i => Math.log(i.loss) - (sigma * sigma) / 2);

  const totals = new Float64Array(config.trials);
  for (let t = 0; t < config.trials; t++) {
    let total = 0;
    for (let k = 0; k < live.length; k++) {
      if (rand() < p[k]) {
        // Box–Muller standard normal
        const u1 = Math.max(rand(), 1e-12);
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
        total += Math.exp(mu[k] + sigma * z);
      }
    }
    totals[t] = total;
  }
  totals.sort();
  const q = (f: number) => totals[Math.min(config.trials - 1, Math.floor(f * config.trials))];
  return { mean, p5: q(0.05), p50: q(0.5), p95: q(0.95) };
}

// ─── SUMMARY ────────────────────────────────────────────────────────────────

export interface RiskBreakdownRow {
  key: string;
  incidents: number;
  expectedLossAvoided: number;
}

export interface RiskSummary {
  totalAlerts: number;
  /** Alerts belonging to incidents that contribute to loss avoided. */
  countedAlerts: number;
  incidentCount: number;
  confirmedIncidents: number;
  unverifiedIncidents: number; // unverified AND counted (passed the gate)
  dismissedIncidents: number;  // analyst-dismissed or failed the gate
  /** Share of expected loss avoided that rests on analyst-confirmed incidents (0–1). */
  confirmedShare: number;
  /** Undiscounted sum of benchmark losses for counted incidents — an upper bound, not an estimate. */
  grossExposure: number;
  lossAvoided: LossDistribution;
  byCategory: RiskBreakdownRow[];
  byDepartment: RiskBreakdownRow[];
  incidents: IncidentRisk[];
}

function breakdown(incidents: IncidentRisk[], keyOf: (i: IncidentRisk) => string): RiskBreakdownRow[] {
  const map = new Map<string, RiskBreakdownRow>();
  for (const i of incidents) {
    const key = keyOf(i);
    const row = map.get(key) || { key, incidents: 0, expectedLossAvoided: 0 };
    row.incidents++;
    row.expectedLossAvoided += i.expectedLossAvoided;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.expectedLossAvoided - a.expectedLossAvoided);
}

export function summariseRisk(
  alerts: ModelAlert[],
  isKnownTechnique: (id: string) => boolean,
  config: RiskModelConfig = DEFAULT_RISK_CONFIG
): RiskSummary {
  const incidents = scoreIncidents(alerts, isKnownTechnique, config);
  const counted = incidents.filter(i => i.pReal > 0);
  const confirmed = counted.filter(i => i.verdict === "confirmed");
  const lossAvoided = simulateLossAvoided(incidents, config);
  const confirmedExpected = confirmed.reduce((s, i) => s + i.expectedLossAvoided, 0);

  return {
    totalAlerts: alerts.length,
    countedAlerts: counted.reduce((s, i) => s + i.alertCount, 0),
    incidentCount: incidents.length,
    confirmedIncidents: confirmed.length,
    unverifiedIncidents: counted.length - confirmed.length,
    dismissedIncidents: incidents.length - counted.length,
    confirmedShare: lossAvoided.mean > 0 ? confirmedExpected / lossAvoided.mean : 0,
    grossExposure: counted.reduce((s, i) => s + i.loss, 0),
    lossAvoided,
    byCategory: breakdown(counted, i => i.bucket),
    byDepartment: breakdown(counted, i => i.department),
    incidents,
  };
}
