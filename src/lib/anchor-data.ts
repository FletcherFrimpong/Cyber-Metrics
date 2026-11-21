// Published loss data the dollar figures are anchored to, by annual revenue.
//
// Source: Cyentia Institute, Information Risk Insights Study (IRIS), built on
// the Advisen/Zywave Cyber Loss Data set of publicly known incidents.
//   Frequency: IRIS 2022, Table 2 (p.9): modelled probability of one or more
//              loss events in 12 months. Cyentia publishes an upper bound
//              (denominator: firms already in the dataset, an overestimate) and
//              a lower bound (denominator: all registered US firms, an
//              underestimate). The model uses their geometric mean as the
//              central figure and carries both bounds into the range.
//   Loss size: IRIS 2025, Table 1 (p.16) and Figure A4 (p.35): median and 95th
//              percentile loss per event, in 2024 US dollars.
//   https://www.cyentia.com/wp-content/uploads/IRIS-2022_Cyentia.pdf
//   https://www.cyentia.com/wp-content/uploads/2026/03/IRIS-2025.pdf
//
// What this data is, and is not:
//   - Only incidents that became publicly known, and only direct, quantifiable
//     losses. Cyentia calls this a "conservative view", so figures err LOW.
//   - Mostly US organisations (74% of events in IRIS 2022).
//   - The lower-bound frequencies for the three middle bands were recovered
//     from a partly obscured table and are lower confidence.
//   - IRIS 2022 has no frequency model below $10M revenue. That band's lower
//     bound is from IRIS 20/20 (Fig 7) and its upper bound is DERIVED (IRIS
//     2025's 0.60x multiplier on a 9.3% overall probability), not published.

import type { PeerAnchor } from "./risk-model.ts";

export interface RevenueBand extends PeerAnchor {
  id: string;
  label: string;
}

const band = (id: string, label: string, low: number, high: number, lossMedian: number, lossP95: number): RevenueBand => ({
  id,
  label,
  annualEventProbability: Math.sqrt(low * high),
  annualEventProbabilityLow: low,
  annualEventProbabilityHigh: high,
  lossMedian,
  lossP95,
});

export const REVENUE_BANDS: RevenueBand[] = [
  band("lt10m", "Under $10M", 0.0006, 0.0558, 403_000, 10_000_000),
  band("10m-100m", "$10M – $100M", 0.0046, 0.1153, 329_000, 7_000_000),
  band("100m-1b", "$100M – $1B", 0.0218, 0.1295, 466_700, 12_300_000),
  band("1b-10b", "$1B – $10B", 0.0656, 0.1704, 1_800_000, 61_800_000),
  band("10b-100b", "$10B – $100B", 0.142, 0.2193, 2_000_000, 269_000_000),
  band("gt100b", "Over $100B", 0.293, 0.2933, 6_000_000, 259_000_000),
];

/** Assumed until the organisation's size is set in Settings. */
export const DEFAULT_REVENUE_BAND = REVENUE_BANDS[2];

export function getRevenueBand(id: unknown): RevenueBand | undefined {
  return REVENUE_BANDS.find((b) => b.id === id);
}

// Typical control effectiveness: the share of serious attacks a typical
// organisation's detection and response stops before a material loss. There is
// no published figure for exactly this quantity; the default and the evidence
// behind it are recorded next to DEFAULT_RISK_CONFIG in risk-model.ts.
