// CARA risk model — loss avoided by detection and response, anchored to
// published loss data.
//
// The dollar figure is built top-down, so it cannot exceed what organisations
// of this size actually stand to lose:
//
//   exposure      = peer loss frequency / (1 - typical control effectiveness)
//                   x expected loss per event              [published data]
//   loss avoided  = exposure x YOUR control effectiveness  [your incidents]
//
//   peer loss frequency and loss size come from published studies by revenue
//   band (see ./anchor-data.ts). Peers' observed losses are the events that got
//   PAST their controls, so dividing by (1 - typical effectiveness) gives the
//   exposure with no detection and response at all.
//
//   YOUR control effectiveness is estimated from your own resolved incidents:
//   each contained incident is weighted by how likely it was real and how far
//   the attack had got (the "seriousness weight"), set against the loss events
//   you actually suffered, starting from the typical figure as a prior.
//
// Incident weights therefore decide only where you sit between "typical" and
// "stopped everything", and how the total is shared between categories. They
// can no longer inflate the total.
//
// This file has no runtime imports so it can run in the browser, on the server
// and under `node --test`.

import type { SecurityAlert } from "@/types/alerts";

// ─── ASSUMPTIONS ────────────────────────────────────────────────────────────
// Every judgment-based parameter lives here. These are starting defaults, not
// published figures: calibrate them per customer before quoting the output.

export interface RiskModelConfig {
  /** Seriousness weight by kill-chain stage, earliest to latest: P(a contained incident at this stage would have become a loss event). */
  escalationByStage: Record<KillChainStage, number>;
  /** Seriousness weight when an incident has no usable MITRE mapping. */
  escalationBySeverity: Record<Severity, number>;
  /** P(real) for an unverified alert that passes the gate but reports no confidence. */
  defaultUnverifiedConfidence: number;
  /** Minimum tool confidence (0–100) for an unverified alert WITH a MITRE mapping. */
  gateConfidenceWithMitre: number;
  /** Minimum tool confidence (0–100) for an unverified alert WITHOUT a MITRE mapping. */
  gateConfidenceWithoutMitre: number;
  /**
   * Share of serious attacks a TYPICAL organisation's detection and response
   * stops before a material loss (0–1). The most influential assumption in the
   * model; see anchor-data.ts for the evidence behind the default.
   */
  typicalControlEffectiveness: number;
  /** How firmly that typical figure is held (Beta concentration). Lower = wider range. */
  typicalControlConcentration: number;
  /** Weight of the typical figure against your own data, in pseudo loss events. */
  priorStrength: number;
  /** Monte Carlo trials for the range. */
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
  // Evidence for 0.4: there is no published measure of exactly this. The closest
  // is Sophos "State of Ransomware" (organisations hit by ransomware, self-
  // reported): attack stopped before encryption in 21% (2023), 27% (2024) and
  // 44% (2025) of cases. Mandiant M-Trends: 43–52% of investigated intrusions
  // were detected internally rather than by an outside party. Microsoft's "99%
  // of attacks" figures count commodity attempts, not footholds, and are not
  // used. The support is weak, so the figure is held loosely (wide range below)
  // and can be changed in Settings.
  typicalControlEffectiveness: 0.4,
  typicalControlConcentration: 10,
  priorStrength: 2,
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
  pReal: number;
  pEscalation: number;
  /** Seriousness weight: pReal × pEscalation. */
  weight: number;
  /** This incident's share of the period's loss avoided (filled in by summariseRisk). */
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

    // The incident is ONE event however many alerts it raised. Its category is
    // that of its most severe alert.
    let lead = members[0];
    for (const m of members) {
      if (SEVERITY_RANK[m.alert.severity as Severity] > SEVERITY_RANK[lead.alert.severity as Severity]) lead = m;
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
    incidents.push({
      id,
      bucket: lead.bucket,
      department,
      severity,
      verdict,
      alertCount: members.length,
      stage,
      pReal,
      pEscalation,
      weight: pReal * pEscalation,
      expectedLossAvoided: 0,
    });
  }
  return incidents;
}

// ─── LOSS DISTRIBUTION ──────────────────────────────────────────────────────

/** Published loss data for organisations of one size. */
export interface PeerAnchor {
  /** Probability of at least one loss event in a year (0–1): central figure. */
  annualEventProbability: number;
  /** Published lower and upper bounds for that probability, where available. */
  annualEventProbabilityLow?: number;
  annualEventProbabilityHigh?: number;
  /** Typical (median) loss per event. */
  lossMedian: number;
  /** Extreme (95th percentile) loss per event. */
  lossP95: number;
}

const Z95 = 1.6448536269514722;

// Standard normal CDF (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7)
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** Lognormal through a median and a 95th percentile. */
export function lognormalFromQuantiles(median: number, p95: number): { mu: number; sigma: number } {
  return { mu: Math.log(median), sigma: Math.log(p95 / median) / Z95 };
}

/**
 * Expected loss per event with every loss capped at the published 95th
 * percentile. Cyber losses are so skewed that the plain average is driven by a
 * handful of catastrophes nobody can estimate; capping at the furthest
 * published point keeps the figure tied to data and errs low.
 */
export function expectedLossPerEvent(anchor: PeerAnchor): number {
  const { mu, sigma } = lognormalFromQuantiles(anchor.lossMedian, anchor.lossP95);
  const cap = anchor.lossP95;
  if (sigma <= 0) return anchor.lossMedian;
  const lnc = Math.log(cap);
  return (
    Math.exp(mu + (sigma * sigma) / 2) * normalCdf((lnc - mu - sigma * sigma) / sigma) +
    cap * (1 - normalCdf((lnc - mu) / sigma))
  );
}

/** Events per year implied by P(at least one event in a year). */
export function annualRate(probability: number): number {
  const p = Math.min(Math.max(probability, 0), 0.999);
  return p === 0 ? 0 : -Math.log(1 - p);
}

// ─── RANDOM NUMBERS ─────────────────────────────────────────────────────────

// Small seeded PRNG (mulberry32) so the same data always gives the same range.
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

function sampleNormal(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
}

// Gamma(shape, 1) by Marsaglia–Tsang, with the usual boost for shape < 1.
function sampleGamma(shape: number, rand: () => number): number {
  if (shape < 1) return sampleGamma(shape + 1, rand) * Math.pow(Math.max(rand(), 1e-12), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = sampleNormal(rand);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x * x * x * x || Math.log(Math.max(u, 1e-12)) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleBeta(a: number, b: number, rand: () => number): number {
  const x = sampleGamma(a, rand);
  const y = sampleGamma(b, rand);
  return x / (x + y);
}

// ─── SUMMARY ────────────────────────────────────────────────────────────────

export interface Estimate {
  mean: number;
  p5: number;
  p50: number;
  p95: number;
}

export interface RiskBreakdownRow {
  key: string;
  incidents: number;
  expectedLossAvoided: number;
}

export interface RiskOptions {
  /** Published loss data for this organisation's size. */
  anchor: PeerAnchor;
  /** Length of the reporting period in years (quarter = 0.25). */
  periodYears: number;
  /** Material loss events the organisation actually suffered IN THE PERIOD. */
  lossEventsSuffered?: number;
  config?: RiskModelConfig;
}

export interface RiskSummary {
  totalAlerts: number;
  /** Alerts belonging to incidents that count toward control effectiveness. */
  countedAlerts: number;
  incidentCount: number;
  confirmedIncidents: number;
  unverifiedIncidents: number; // unverified AND counted (passed the gate)
  dismissedIncidents: number;  // analyst-dismissed or failed the gate
  /** Share of the seriousness weight that rests on analyst-confirmed incidents (0–1). */
  confirmedShare: number;
  /** Sum of incident weights: contained incidents expressed as would-be loss events. */
  seriousnessWeight: number;
  /** What a peer organisation loses in a year, with typical controls in place. */
  peerAnnualLoss: number;
  /** Expected loss per event (capped at the published 95th percentile). */
  lossPerEvent: number;
  /** Expected loss for the PERIOD with no detection and response at all. */
  exposure: number;
  /** Share of that exposure your controls removed (0–1). */
  controlEffectiveness: Estimate;
  /** exposure × control effectiveness, for the period. */
  lossAvoided: Estimate;
  /** Expected loss still carried in the period. */
  residualLoss: number;
  /** Chance of at least one material loss event in a YEAR with no detection and response (0–1). */
  annualLossProbabilityWithoutControls: number;
  /** The same chance with your controls (0–1). */
  annualLossProbabilityWithControls: number;
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

function quantiles(values: Float64Array, mean: number): Estimate {
  const sorted = Float64Array.from(values).sort();
  const q = (f: number) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))];
  return { mean, p5: q(0.05), p50: q(0.5), p95: q(0.95) };
}

export function summariseRisk(
  alerts: ModelAlert[],
  isKnownTechnique: (id: string) => boolean,
  options: RiskOptions
): RiskSummary {
  const config = options.config ?? DEFAULT_RISK_CONFIG;
  const T = Math.max(options.periodYears, 0);
  const suffered = Math.max(options.lossEventsSuffered ?? 0, 0);

  const incidents = scoreIncidents(alerts, isKnownTechnique, config);
  const counted = incidents.filter(i => i.weight > 0);
  const confirmed = counted.filter(i => i.verdict === "confirmed");
  const W = counted.reduce((s, i) => s + i.weight, 0);

  // Published side: what peers lose, and what that implies with no controls.
  const lossPerEvent = expectedLossPerEvent(options.anchor);
  const peerRate = annualRate(options.anchor.annualEventProbability);
  const peerAnnualLoss = peerRate * lossPerEvent;
  const typical = Math.min(Math.max(config.typicalControlEffectiveness, 0.05), 0.9);

  // Your side: contained (W) against suffered, starting from the typical figure.
  const effectiveness = (m: number) => {
    const a = m * config.priorStrength + W;
    const b = (1 - m) * config.priorStrength + suffered;
    return { a, b, mean: a / (a + b) };
  };
  const point = effectiveness(typical);
  const exposureAt = (m: number, rate = peerRate) => (rate / (1 - m)) * lossPerEvent * T;
  const exposure = exposureAt(typical);
  const inherentRate = peerRate / (1 - typical);

  // The published frequency is itself a range; sample it log-uniformly.
  const lowRate = annualRate(options.anchor.annualEventProbabilityLow ?? options.anchor.annualEventProbability);
  const highRate = annualRate(options.anchor.annualEventProbabilityHigh ?? options.anchor.annualEventProbability);
  const logLow = Math.log(Math.max(lowRate, 1e-9));
  const logSpan = Math.log(Math.max(highRate, 1e-9)) - logLow;
  const avoidedMean = exposure * point.mean;

  // Range: uncertainty in the published frequency, the typical figure and your own effectiveness.
  // (It is a range for the EXPECTED value, not for how any one year turns out.)
  let seed = hashString(`${T}|${suffered}|${options.anchor.annualEventProbability}|${options.anchor.lossMedian}|${options.anchor.lossP95}`);
  for (const i of counted) seed = hashString(i.id, seed);
  const rand = mulberry32(seed);
  const c = config.typicalControlConcentration;
  const eff = new Float64Array(config.trials);
  const avoided = new Float64Array(config.trials);
  for (let t = 0; t < config.trials; t++) {
    // Keep the sampled typical figure away from 1, where exposure would explode.
    const m = Math.min(sampleBeta(typical * c, (1 - typical) * c, rand), 0.9);
    const { a, b } = effectiveness(m);
    const mine = sampleBeta(a, b, rand);
    eff[t] = mine;
    const rate = logSpan > 0 ? Math.exp(logLow + rand() * logSpan) : peerRate;
    avoided[t] = exposureAt(m, rate) * mine;
  }

  // Share the expected total between incidents in proportion to their weight.
  for (const i of incidents) i.expectedLossAvoided = W > 0 ? (avoidedMean * i.weight) / W : 0;

  return {
    totalAlerts: alerts.length,
    countedAlerts: counted.reduce((s, i) => s + i.alertCount, 0),
    incidentCount: incidents.length,
    confirmedIncidents: confirmed.length,
    unverifiedIncidents: counted.length - confirmed.length,
    dismissedIncidents: incidents.length - counted.length,
    confirmedShare: W > 0 ? confirmed.reduce((s, i) => s + i.weight, 0) / W : 0,
    seriousnessWeight: W,
    peerAnnualLoss,
    lossPerEvent,
    exposure,
    controlEffectiveness: quantiles(eff, point.mean),
    lossAvoided: quantiles(avoided, avoidedMean),
    residualLoss: exposure - avoidedMean,
    annualLossProbabilityWithoutControls: 1 - Math.exp(-inherentRate),
    annualLossProbabilityWithControls: 1 - Math.exp(-inherentRate * (1 - point.mean)),
    byCategory: breakdown(counted, i => i.bucket),
    byDepartment: breakdown(counted, i => i.department),
    incidents,
  };
}
