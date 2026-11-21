// Connector framework: each security tool that can feed alerts into the
// platform implements ConnectorDefinition. Sentinel predates this framework
// and still has its own client and poller.

import type { SecurityAlert } from "../../types/alerts";

export type AlertCategory = "edr" | "email" | "network" | "web" | "cloud";

export type ConnectorConfig = Record<string, string>;

export interface ConnectorField {
  key: string;
  label: string;
  type: "text" | "password" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Pre-selected value when nothing is saved yet. */
  default?: string;
  help?: string;
}

export interface CategorizedAlert {
  category: AlertCategory;
  alert: SecurityAlert;
}

export interface TestResult {
  ok: boolean;
  message: string;
}

export interface ConnectorDefinition {
  id: string;
  name: string;
  /**
   * "siem": a log source that aggregates every security tool, so it covers all
   * alert categories. "tool": one product, one category. A tool that already
   * feeds a connected SIEM must not also be connected directly, or its alerts
   * are counted twice.
   */
  kind: "siem" | "tool";
  /** Prefix of the alert ids this connector produces, e.g. "SPLUNK-". */
  idPrefix: string;
  description: string;
  docsUrl: string;
  setupSteps: string[];
  fields: ConnectorField[];
  /** Verify the credentials with one cheap authenticated call. */
  test(config: ConnectorConfig): Promise<TestResult>;
  /** Closed/resolved alerts created or updated since the given ISO timestamp. */
  fetchAlerts(config: ConnectorConfig, since: string): Promise<CategorizedAlert[]>;
}

export const SECRET_MASK = "••••••••";
