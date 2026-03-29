// Canonical alert type used across the entire platform.
// All data sources (Sentinel, webhooks) produce this format.

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  category: string;
  title: string;
  description: string;
  source: string;
  platform: string;
  rawLog: any;
  mitreTactics: string[];
  mitreTechniques: string[];
  iocIndicators: string[];
  affectedEntities: string[];
  remediationSteps: string[];
  costImpact: number;
  confidence?: number;
  status?: "Open" | "In Progress" | "Resolved" | "False Positive";
  department?: string;
}

// Backward-compatible aliases
export type AzureSentinelAlert = SecurityAlert;
export type EDRAlert = SecurityAlert;

export interface CategorizedAlerts {
  edr: SecurityAlert[];
  email: SecurityAlert[];
  network: SecurityAlert[];
  web: SecurityAlert[];
  cloud: SecurityAlert[];
}
