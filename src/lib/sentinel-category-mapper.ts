// Maps Sentinel alert productName → our 5 alert categories.
// Sentinel aggregates alerts from 300+ connectors. The productName field
// tells us which security tool generated the alert.

import type { AzureSentinelAlert } from "@/types/alerts";
import { getIncidentCost } from "./cost-benchmarks";

export type AlertCategory = "edr" | "email" | "network" | "web" | "cloud";

// ─── PRODUCT → CATEGORY MAPPING ─────────────────────────────────────────────
// Lowercase keyword matching against the productName field.
// Order matters: first match wins.

const CATEGORY_RULES: { category: AlertCategory; keywords: string[] }[] = [
  {
    category: "edr",
    keywords: [
      "defender for endpoint",
      "sentinelone",
      "crowdstrike",
      "carbon black",
      "cybereason",
      "sophos intercept",
      "sophos endpoint",
      "trend micro apex",
      "trend micro vision one",
      "cortex xdr",
      "symantec endpoint",
      "mcafee endpoint",
      "trellix endpoint",
      "malwarebytes",
      "defender for identity",    // identity-based endpoint threats
      "endpoint detection",
      "edr",
    ],
  },
  {
    category: "email",
    keywords: [
      "defender for office",
      "abnormal security",
      "proofpoint",
      "mimecast",
      "barracuda email",
      "ironscales",
      "tessian",
      "agari",
      "cofense",
      "exchange online protection",
      "email security",
      "mail protection",
      "phishing",
    ],
  },
  {
    category: "network",
    keywords: [
      "azure firewall",
      "palo alto",
      "fortinet",
      "fortigate",
      "cisco asa",
      "cisco meraki",
      "cisco firepower",
      "check point",
      "sonicwall",
      "watchguard",
      "juniper",
      "snort",
      "suricata",
      "darktrace",
      "vectra",
      "zeek",
      "network watcher",
      "nsg flow",
      "ids",
      "ips",
      "firewall",
      "intrusion",
      "network security",
    ],
  },
  {
    category: "web",
    keywords: [
      "web application firewall",
      "azure waf",
      "cloudflare",
      "akamai",
      "imperva",
      "f5 waf",
      "f5 advanced waf",
      "aws waf",
      "application gateway",
      "bot protection",
      "waf",
    ],
  },
  {
    category: "cloud",
    keywords: [
      "defender for cloud",
      "cloud apps",
      "mcas",
      "azure ad",
      "entra",
      "identity protection",
      "defender for resource manager",
      "defender for storage",
      "defender for key vault",
      "defender for dns",
      "defender for sql",
      "defender for cosmos",
      "aws guardduty",
      "aws security hub",
      "prisma cloud",
      "lacework",
      "wiz",
      "orca security",
      "google security command center",
      "google scc",
      "cloud security",
    ],
  },
];

export function mapProductToCategory(productName: string): AlertCategory {
  const lower = productName.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return rule.category;
      }
    }
  }
  // Default: cloud (it's coming through a cloud SIEM)
  return "cloud";
}

// ─── SENTINEL → AzureSentinelAlert TRANSFORMER ──────────────────────────────
// Takes a raw Sentinel incident + its alerts from Graph Security API
// and produces our standard AzureSentinelAlert format.

export interface GraphSecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  createdDateTime: string;
  lastUpdateDateTime: string;
  productName: string;
  alertWebUrl?: string;
  mitreTechniques?: { technique: string; tactic: string }[];
  evidence?: {
    displayName?: string;
    type?: string;
    deviceDetail?: { operatingSystem?: string };
    ipAddress?: string;
    url?: string;
    fileName?: string;
  }[];
  recommendedActions?: string;
  confidence?: number;
}

export interface SentinelIncident {
  id: string;
  displayName: string;
  description: string;
  severity: string;
  status: string;
  classification?: string;           // TruePositive, FalsePositive, etc.
  classificationReason?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  incidentWebUrl?: string;
  alerts?: GraphSecurityAlert[];
}

// Map severity from Sentinel to our standard levels
function mapSeverity(severity: string): "Low" | "Medium" | "High" | "Critical" {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high" || s === "medium" || s === "low") {
    return (s.charAt(0).toUpperCase() + s.slice(1)) as "Low" | "Medium" | "High" | "Critical";
  }
  if (s === "informational") return "Low";
  return "Medium";
}

// Cost impact is looked up from industry benchmarks by category + severity.
// This happens in transformSentinelAlert where we know both the category and severity.

export function transformSentinelAlert(
  alert: GraphSecurityAlert,
  incident: SentinelIncident,
  category?: AlertCategory
): AzureSentinelAlert {
  const severity = mapSeverity(alert.severity || incident.severity);
  const resolvedCategory = category || mapProductToCategory(alert.productName || "");

  // Extract MITRE techniques and tactics
  const mitreTechniques = (alert.mitreTechniques || []).map(m => m.technique).filter(Boolean);
  const mitreTactics = (alert.mitreTechniques || []).map(m => m.tactic).filter(Boolean);
  // Deduplicate
  const uniqueTechniques = [...new Set(mitreTechniques)];
  const uniqueTactics = [...new Set(mitreTactics)];

  // Extract IOC indicators from evidence
  const iocIndicators: string[] = [];
  const affectedEntities: string[] = [];
  let platform = "Unknown";

  for (const ev of alert.evidence || []) {
    if (ev.ipAddress) iocIndicators.push(ev.ipAddress);
    if (ev.url) iocIndicators.push(ev.url);
    if (ev.fileName) iocIndicators.push(ev.fileName);
    if (ev.displayName) affectedEntities.push(ev.displayName);
    if (ev.deviceDetail?.operatingSystem) platform = ev.deviceDetail.operatingSystem;
  }

  // Parse remediation steps
  const remediationSteps = alert.recommendedActions
    ? alert.recommendedActions.split(/[.\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return {
    id: `SENTINEL-${alert.id}`,
    timestamp: alert.createdDateTime || incident.createdDateTime,
    severity,
    category: alert.category || incident.displayName,
    title: alert.title || incident.displayName,
    description: alert.description || incident.description,
    source: alert.productName || "Microsoft Sentinel",
    platform,
    rawLog: {
      incidentId: incident.id,
      alertId: alert.id,
      classification: incident.classification,
      classificationReason: incident.classificationReason,
      productName: alert.productName,
      Confidence: alert.confidence || (severity === "Critical" ? 95 : severity === "High" ? 85 : 70),
      incidentUrl: incident.incidentWebUrl,
      alertUrl: alert.alertWebUrl,
    },
    mitreTactics: uniqueTactics,
    mitreTechniques: uniqueTechniques,
    iocIndicators,
    affectedEntities,
    remediationSteps,
    costImpact: getIncidentCost(resolvedCategory, severity),
  };
}

// Transform a full incident (with its alerts) into categorized AzureSentinelAlerts
export function transformIncident(incident: SentinelIncident): {
  category: AlertCategory;
  alerts: AzureSentinelAlert[];
}[] {
  if (!incident.alerts || incident.alerts.length === 0) {
    // Incident with no alerts — create one from incident metadata
    const severity = mapSeverity(incident.severity);
    const singleAlert: AzureSentinelAlert = {
      id: `SENTINEL-INC-${incident.id}`,
      timestamp: incident.createdDateTime,
      severity,
      category: "Security Incident",
      title: incident.displayName,
      description: incident.description,
      source: "Microsoft Sentinel",
      platform: "Unknown",
      rawLog: {
        incidentId: incident.id,
        classification: incident.classification,
        Confidence: severity === "Critical" ? 95 : severity === "High" ? 85 : 70,
      },
      mitreTactics: [],
      mitreTechniques: [],
      iocIndicators: [],
      affectedEntities: [],
      remediationSteps: [],
      costImpact: getIncidentCost("cloud", severity),
    };
    return [{ category: "cloud" as AlertCategory, alerts: [singleAlert] }];
  }

  // Group alerts by category
  const grouped = new Map<AlertCategory, AzureSentinelAlert[]>();
  for (const alert of incident.alerts) {
    const category = mapProductToCategory(alert.productName || "");
    const transformed = transformSentinelAlert(alert, incident, category);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(transformed);
  }

  return Array.from(grouped.entries()).map(([category, alerts]) => ({ category, alerts }));
}
