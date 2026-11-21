import edrDataService from "./edr-data-service";
import type { SecurityAlert, CategorizedAlerts } from "@/types/alerts";
import {
  summariseRisk,
  verdictFor,
  unverifiedProbability,
  DEFAULT_RISK_CONFIG,
  type ModelAlert,
  type RiskSummary,
} from "./risk-model";
import { getRevenueBand, DEFAULT_REVENUE_BAND, type RevenueBand } from "./anchor-data.ts";
import { getSettings } from "./settings-store";

// Centralized cost calculation system.
// Flow: alerts (Sentinel or sample) → incidents → risk model → dashboard metrics.
// See ./risk-model.ts for the model and its assumptions.

export interface CostCalculationParams {
  period: "quarterly" | "yearly" | "monthly";
  selectedQuarter?: string;
  investmentAmount?: number; // User-configured ANNUAL security investment
}

export interface CategoryLossAvoided {
  category: string;
  incidents: number;
  lossAvoided: number;
}

export interface CostMetrics {
  totalAlerts: number;
  truePositiveCount: number;     // Alerts in incidents that count toward loss avoided
  falsePositiveCount: number;    // Alerts dismissed by an analyst or failing the quality gate
  truePositiveRate: number;
  incidentCount: number;
  confirmedIncidents: number;    // Analyst classified true positive
  unverifiedIncidents: number;   // No analyst verdict; passed the gate, weighted by confidence
  dismissedIncidents: number;
  confirmedShare: number;        // % of loss avoided resting on analyst-confirmed incidents
  exposure: number;               // Expected loss for the period with no detection and response
  controlEffectiveness: number;   // % of that exposure your controls removed
  controlEffectivenessLow: number;
  controlEffectivenessHigh: number;
  residualLoss: number;           // Expected loss still carried in the period
  lossProbabilityWithoutControls: number; // % chance of a material loss in a year, no detection and response
  lossProbabilityWithControls: number;    // % chance with your controls
  peerAnnualLoss: number;         // What a peer organisation loses per year (published data)
  typicalLoss: number;            // Published median loss per event for this size
  severeLoss: number;             // Published 95th percentile loss per event
  lossPerEvent: number;           // Expected loss per event used in the model
  revenueBand: string;            // Label of the size band the figures are anchored to
  profileAssumed: boolean;        // true until the organisation's size is set in Settings
  typicalControlEffectiveness: number; // % assumed for a typical organisation
  lossEventsSuffered: number;     // Material loss events suffered, last 12 months (from Settings)
  totalCostImpact: number;       // Expected loss avoided (mean)
  lossAvoidedLow: number;        // 5th percentile of the expected value
  lossAvoidedMedian: number;
  lossAvoidedHigh: number;       // 95th percentile of the expected value
  categoryBreakdown: CategoryLossAvoided[];
  totalInvestment: number;       // Annual investment prorated to the period
  totalCostSavings: number;      // Loss avoided − investment (same as netBenefit)
  netBenefit: number;
  roi: number;
  roiLow: number;
  roiHigh: number;
}

// MITRE ATT&CK Framework validation for true positive analysis
interface MITREValidation {
  isValidTechnique: boolean;
  riskScore: number;
  category: string;
  description: string;
}

// MITRE ATT&CK technique database with risk scoring
// Comprehensive coverage of ATT&CK Enterprise matrix (v15+)
const MITRE_ATTACK_TECHNIQUES: Record<string, MITREValidation> = {
  // ─── RECONNAISSANCE ──────────────────────────────────────────────────────
  'T1595': { isValidTechnique: true, riskScore: 0.6, category: 'Reconnaissance', description: 'Active Scanning' },
  'T1592': { isValidTechnique: true, riskScore: 0.5, category: 'Reconnaissance', description: 'Gather Victim Host Information' },
  'T1589': { isValidTechnique: true, riskScore: 0.55, category: 'Reconnaissance', description: 'Gather Victim Identity Information' },
  'T1590': { isValidTechnique: true, riskScore: 0.55, category: 'Reconnaissance', description: 'Gather Victim Network Information' },
  'T1591': { isValidTechnique: true, riskScore: 0.5, category: 'Reconnaissance', description: 'Gather Victim Org Information' },
  'T1598': { isValidTechnique: true, riskScore: 0.7, category: 'Reconnaissance', description: 'Phishing for Information' },
  'T1597': { isValidTechnique: true, riskScore: 0.5, category: 'Reconnaissance', description: 'Search Closed Sources' },
  'T1596': { isValidTechnique: true, riskScore: 0.5, category: 'Reconnaissance', description: 'Search Open Technical Databases' },
  'T1593': { isValidTechnique: true, riskScore: 0.5, category: 'Reconnaissance', description: 'Search Open Websites/Domains' },
  'T1594': { isValidTechnique: true, riskScore: 0.55, category: 'Reconnaissance', description: 'Search Victim-Owned Websites' },

  // ─── RESOURCE DEVELOPMENT ────────────────────────────────────────────────
  'T1583': { isValidTechnique: true, riskScore: 0.6, category: 'Resource Development', description: 'Acquire Infrastructure' },
  'T1586': { isValidTechnique: true, riskScore: 0.65, category: 'Resource Development', description: 'Compromise Accounts' },
  'T1584': { isValidTechnique: true, riskScore: 0.7, category: 'Resource Development', description: 'Compromise Infrastructure' },
  'T1587': { isValidTechnique: true, riskScore: 0.7, category: 'Resource Development', description: 'Develop Capabilities' },
  'T1585': { isValidTechnique: true, riskScore: 0.6, category: 'Resource Development', description: 'Establish Accounts' },
  'T1588': { isValidTechnique: true, riskScore: 0.7, category: 'Resource Development', description: 'Obtain Capabilities' },
  'T1608': { isValidTechnique: true, riskScore: 0.65, category: 'Resource Development', description: 'Stage Capabilities' },

  // ─── INITIAL ACCESS ──────────────────────────────────────────────────────
  'T1189': { isValidTechnique: true, riskScore: 0.85, category: 'Initial Access', description: 'Drive-by Compromise' },
  'T1190': { isValidTechnique: true, riskScore: 0.95, category: 'Initial Access', description: 'Exploit Public-Facing Application' },
  'T1133': { isValidTechnique: true, riskScore: 0.85, category: 'Initial Access', description: 'External Remote Services' },
  'T1200': { isValidTechnique: true, riskScore: 0.8, category: 'Initial Access', description: 'Hardware Additions' },
  'T1566': { isValidTechnique: true, riskScore: 0.9, category: 'Initial Access', description: 'Phishing' },
  'T1091': { isValidTechnique: true, riskScore: 0.8, category: 'Initial Access', description: 'Replication Through Removable Media' },
  'T1195': { isValidTechnique: true, riskScore: 0.95, category: 'Initial Access', description: 'Supply Chain Compromise' },
  'T1199': { isValidTechnique: true, riskScore: 0.9, category: 'Initial Access', description: 'Trusted Relationship' },
  'T1078': { isValidTechnique: true, riskScore: 0.85, category: 'Initial Access', description: 'Valid Accounts' },

  // ─── EXECUTION ───────────────────────────────────────────────────────────
  'T1059': { isValidTechnique: true, riskScore: 0.9, category: 'Execution', description: 'Command and Scripting Interpreter' },
  'T1609': { isValidTechnique: true, riskScore: 0.85, category: 'Execution', description: 'Container Administration Command' },
  'T1610': { isValidTechnique: true, riskScore: 0.8, category: 'Execution', description: 'Deploy Container' },
  'T1203': { isValidTechnique: true, riskScore: 0.9, category: 'Execution', description: 'Exploitation for Client Execution' },
  'T1559': { isValidTechnique: true, riskScore: 0.8, category: 'Execution', description: 'Inter-Process Communication' },
  'T1106': { isValidTechnique: true, riskScore: 0.8, category: 'Execution', description: 'Native API' },
  'T1053': { isValidTechnique: true, riskScore: 0.8, category: 'Execution', description: 'Scheduled Task/Job' },
  'T1648': { isValidTechnique: true, riskScore: 0.85, category: 'Execution', description: 'Serverless Execution' },
  'T1129': { isValidTechnique: true, riskScore: 0.75, category: 'Execution', description: 'Shared Modules' },
  'T1072': { isValidTechnique: true, riskScore: 0.85, category: 'Execution', description: 'Software Deployment Tools' },
  'T1569': { isValidTechnique: true, riskScore: 0.8, category: 'Execution', description: 'System Services' },
  'T1204': { isValidTechnique: true, riskScore: 0.75, category: 'Execution', description: 'User Execution' },
  'T1047': { isValidTechnique: true, riskScore: 0.85, category: 'Execution', description: 'Windows Management Instrumentation' },

  // ─── PERSISTENCE ─────────────────────────────────────────────────────────
  'T1098': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'Account Manipulation' },
  'T1197': { isValidTechnique: true, riskScore: 0.8, category: 'Persistence', description: 'BITS Jobs' },
  'T1547': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'Boot or Logon Autostart Execution' },
  'T1037': { isValidTechnique: true, riskScore: 0.8, category: 'Persistence', description: 'Boot or Logon Initialization Scripts' },
  'T1176': { isValidTechnique: true, riskScore: 0.75, category: 'Persistence', description: 'Browser Extensions' },
  'T1554': { isValidTechnique: true, riskScore: 0.8, category: 'Persistence', description: 'Compromise Client Software Binary' },
  'T1136': { isValidTechnique: true, riskScore: 0.8, category: 'Persistence', description: 'Create Account' },
  'T1543': { isValidTechnique: true, riskScore: 0.9, category: 'Persistence', description: 'Create or Modify System Process' },
  'T1546': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'Event Triggered Execution' },
  'T1133': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'External Remote Services' },
  'T1574': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'Hijack Execution Flow' },
  'T1525': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'Implant Internal Image' },
  'T1556': { isValidTechnique: true, riskScore: 0.9, category: 'Persistence', description: 'Modify Authentication Process' },
  'T1137': { isValidTechnique: true, riskScore: 0.8, category: 'Persistence', description: 'Office Application Startup' },
  'T1542': { isValidTechnique: true, riskScore: 0.95, category: 'Persistence', description: 'Pre-OS Boot' },
  'T1053': { isValidTechnique: true, riskScore: 0.8, category: 'Persistence', description: 'Scheduled Task/Job' },
  'T1505': { isValidTechnique: true, riskScore: 0.9, category: 'Persistence', description: 'Server Software Component' },
  'T1205': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'Traffic Signaling' },

  // ─── PRIVILEGE ESCALATION ────────────────────────────────────────────────
  'T1548': { isValidTechnique: true, riskScore: 0.85, category: 'Privilege Escalation', description: 'Abuse Elevation Control Mechanism' },
  'T1134': { isValidTechnique: true, riskScore: 0.85, category: 'Privilege Escalation', description: 'Access Token Manipulation' },
  'T1611': { isValidTechnique: true, riskScore: 0.9, category: 'Privilege Escalation', description: 'Escape to Host' },
  'T1068': { isValidTechnique: true, riskScore: 0.95, category: 'Privilege Escalation', description: 'Exploitation for Privilege Escalation' },
  'T1055': { isValidTechnique: true, riskScore: 0.9, category: 'Privilege Escalation', description: 'Process Injection' },
  'T1078': { isValidTechnique: true, riskScore: 0.85, category: 'Privilege Escalation', description: 'Valid Accounts' },

  // ─── DEFENSE EVASION ─────────────────────────────────────────────────────
  'T1548': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Abuse Elevation Control Mechanism' },
  'T1134': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Access Token Manipulation' },
  'T1197': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'BITS Jobs' },
  'T1612': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Build Image on Host' },
  'T1140': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Deobfuscate/Decode Files or Information' },
  'T1006': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Direct Volume Access' },
  'T1480': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Execution Guardrails' },
  'T1211': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Exploitation for Defense Evasion' },
  'T1222': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'File and Directory Permissions Modification' },
  'T1564': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Hide Artifacts' },
  'T1574': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Hijack Execution Flow' },
  'T1562': { isValidTechnique: true, riskScore: 0.95, category: 'Defense Evasion', description: 'Impair Defenses' },
  'T1070': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Indicator Removal' },
  'T1202': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Indirect Command Execution' },
  'T1036': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Masquerading' },
  'T1556': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Modify Authentication Process' },
  'T1578': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Modify Cloud Compute Infrastructure' },
  'T1112': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Modify Registry' },
  'T1601': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Modify System Image' },
  'T1599': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Network Boundary Bridging' },
  'T1027': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Obfuscated Files or Information' },
  'T1647': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Plist File Modification' },
  'T1542': { isValidTechnique: true, riskScore: 0.95, category: 'Defense Evasion', description: 'Pre-OS Boot' },
  'T1055': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Process Injection' },
  'T1207': { isValidTechnique: true, riskScore: 0.95, category: 'Defense Evasion', description: 'Rogue Domain Controller' },
  'T1014': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Rootkit' },
  'T1218': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'System Binary Proxy Execution' },
  'T1216': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'System Script Proxy Execution' },
  'T1221': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Template Injection' },
  'T1205': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Traffic Signaling' },
  'T1127': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'Trusted Developer Utilities Proxy Execution' },
  'T1535': { isValidTechnique: true, riskScore: 0.75, category: 'Defense Evasion', description: 'Unused/Unsupported Cloud Regions' },
  'T1550': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Use Alternate Authentication Material' },
  'T1078': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Valid Accounts' },
  'T1497': { isValidTechnique: true, riskScore: 0.75, category: 'Defense Evasion', description: 'Virtualization/Sandbox Evasion' },
  'T1600': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Weaken Encryption' },
  'T1220': { isValidTechnique: true, riskScore: 0.8, category: 'Defense Evasion', description: 'XSL Script Processing' },

  // ─── CREDENTIAL ACCESS ───────────────────────────────────────────────────
  'T1557': { isValidTechnique: true, riskScore: 0.9, category: 'Credential Access', description: 'Adversary-in-the-Middle' },
  'T1110': { isValidTechnique: true, riskScore: 0.8, category: 'Credential Access', description: 'Brute Force' },
  'T1555': { isValidTechnique: true, riskScore: 0.85, category: 'Credential Access', description: 'Credentials from Password Stores' },
  'T1212': { isValidTechnique: true, riskScore: 0.9, category: 'Credential Access', description: 'Exploitation for Credential Access' },
  'T1187': { isValidTechnique: true, riskScore: 0.85, category: 'Credential Access', description: 'Forced Authentication' },
  'T1606': { isValidTechnique: true, riskScore: 0.9, category: 'Credential Access', description: 'Forge Web Credentials' },
  'T1056': { isValidTechnique: true, riskScore: 0.85, category: 'Credential Access', description: 'Input Capture' },
  'T1556': { isValidTechnique: true, riskScore: 0.9, category: 'Credential Access', description: 'Modify Authentication Process' },
  'T1040': { isValidTechnique: true, riskScore: 0.8, category: 'Credential Access', description: 'Network Sniffing' },
  'T1003': { isValidTechnique: true, riskScore: 0.95, category: 'Credential Access', description: 'OS Credential Dumping' },
  'T1528': { isValidTechnique: true, riskScore: 0.85, category: 'Credential Access', description: 'Steal Application Access Token' },
  'T1558': { isValidTechnique: true, riskScore: 0.9, category: 'Credential Access', description: 'Steal or Forge Kerberos Tickets' },
  'T1539': { isValidTechnique: true, riskScore: 0.85, category: 'Credential Access', description: 'Steal Web Session Cookie' },
  'T1111': { isValidTechnique: true, riskScore: 0.8, category: 'Credential Access', description: 'Multi-Factor Authentication Interception' },
  'T1621': { isValidTechnique: true, riskScore: 0.85, category: 'Credential Access', description: 'Multi-Factor Authentication Request Generation' },

  // ─── DISCOVERY ───────────────────────────────────────────────────────────
  'T1087': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Account Discovery' },
  'T1010': { isValidTechnique: true, riskScore: 0.6, category: 'Discovery', description: 'Application Window Discovery' },
  'T1217': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'Browser Information Discovery' },
  'T1580': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Cloud Infrastructure Discovery' },
  'T1538': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Cloud Service Dashboard' },
  'T1526': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Cloud Service Discovery' },
  'T1613': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Container and Resource Discovery' },
  'T1482': { isValidTechnique: true, riskScore: 0.75, category: 'Discovery', description: 'Domain Trust Discovery' },
  'T1083': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'File and Directory Discovery' },
  'T1615': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'Group Policy Discovery' },
  'T1046': { isValidTechnique: true, riskScore: 0.75, category: 'Discovery', description: 'Network Service Discovery' },
  'T1135': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Network Share Discovery' },
  'T1040': { isValidTechnique: true, riskScore: 0.8, category: 'Discovery', description: 'Network Sniffing' },
  'T1201': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Password Policy Discovery' },
  'T1120': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'Peripheral Device Discovery' },
  'T1069': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'Permission Groups Discovery' },
  'T1057': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'Process Discovery' },
  'T1012': { isValidTechnique: true, riskScore: 0.6, category: 'Discovery', description: 'Query Registry' },
  'T1018': { isValidTechnique: true, riskScore: 0.75, category: 'Discovery', description: 'Remote System Discovery' },
  'T1518': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'Software Discovery' },
  'T1082': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'System Information Discovery' },
  'T1614': { isValidTechnique: true, riskScore: 0.6, category: 'Discovery', description: 'System Location Discovery' },
  'T1016': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'System Network Configuration Discovery' },
  'T1049': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'System Network Connections Discovery' },
  'T1033': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'System Owner/User Discovery' },
  'T1007': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'System Service Discovery' },
  'T1124': { isValidTechnique: true, riskScore: 0.6, category: 'Discovery', description: 'System Time Discovery' },
  'T1497': { isValidTechnique: true, riskScore: 0.75, category: 'Discovery', description: 'Virtualization/Sandbox Evasion' },

  // ─── LATERAL MOVEMENT ────────────────────────────────────────────────────
  'T1210': { isValidTechnique: true, riskScore: 0.95, category: 'Lateral Movement', description: 'Exploitation of Remote Services' },
  'T1534': { isValidTechnique: true, riskScore: 0.85, category: 'Lateral Movement', description: 'Internal Spearphishing' },
  'T1570': { isValidTechnique: true, riskScore: 0.85, category: 'Lateral Movement', description: 'Lateral Tool Transfer' },
  'T1563': { isValidTechnique: true, riskScore: 0.85, category: 'Lateral Movement', description: 'Remote Service Session Hijacking' },
  'T1021': { isValidTechnique: true, riskScore: 0.9, category: 'Lateral Movement', description: 'Remote Services' },
  'T1091': { isValidTechnique: true, riskScore: 0.8, category: 'Lateral Movement', description: 'Replication Through Removable Media' },
  'T1072': { isValidTechnique: true, riskScore: 0.85, category: 'Lateral Movement', description: 'Software Deployment Tools' },
  'T1080': { isValidTechnique: true, riskScore: 0.85, category: 'Lateral Movement', description: 'Taint Shared Content' },
  'T1550': { isValidTechnique: true, riskScore: 0.9, category: 'Lateral Movement', description: 'Use Alternate Authentication Material' },

  // ─── COLLECTION ──────────────────────────────────────────────────────────
  'T1557': { isValidTechnique: true, riskScore: 0.9, category: 'Collection', description: 'Adversary-in-the-Middle' },
  'T1560': { isValidTechnique: true, riskScore: 0.8, category: 'Collection', description: 'Archive Collected Data' },
  'T1123': { isValidTechnique: true, riskScore: 0.75, category: 'Collection', description: 'Audio Capture' },
  'T1119': { isValidTechnique: true, riskScore: 0.8, category: 'Collection', description: 'Automated Collection' },
  'T1185': { isValidTechnique: true, riskScore: 0.85, category: 'Collection', description: 'Browser Session Hijacking' },
  'T1115': { isValidTechnique: true, riskScore: 0.75, category: 'Collection', description: 'Clipboard Data' },
  'T1530': { isValidTechnique: true, riskScore: 0.85, category: 'Collection', description: 'Data from Cloud Storage' },
  'T1602': { isValidTechnique: true, riskScore: 0.8, category: 'Collection', description: 'Data from Configuration Repository' },
  'T1213': { isValidTechnique: true, riskScore: 0.8, category: 'Collection', description: 'Data from Information Repositories' },
  'T1005': { isValidTechnique: true, riskScore: 0.8, category: 'Collection', description: 'Data from Local System' },
  'T1039': { isValidTechnique: true, riskScore: 0.85, category: 'Collection', description: 'Data from Network Shared Drive' },
  'T1025': { isValidTechnique: true, riskScore: 0.75, category: 'Collection', description: 'Data from Removable Media' },
  'T1074': { isValidTechnique: true, riskScore: 0.8, category: 'Collection', description: 'Data Staged' },
  'T1114': { isValidTechnique: true, riskScore: 0.85, category: 'Collection', description: 'Email Collection' },
  'T1056': { isValidTechnique: true, riskScore: 0.85, category: 'Collection', description: 'Input Capture' },
  'T1113': { isValidTechnique: true, riskScore: 0.75, category: 'Collection', description: 'Screen Capture' },
  'T1125': { isValidTechnique: true, riskScore: 0.75, category: 'Collection', description: 'Video Capture' },

  // ─── COMMAND AND CONTROL ─────────────────────────────────────────────────
  'T1071': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Application Layer Protocol' },
  'T1092': { isValidTechnique: true, riskScore: 0.8, category: 'Command and Control', description: 'Communication Through Removable Media' },
  'T1132': { isValidTechnique: true, riskScore: 0.8, category: 'Command and Control', description: 'Data Encoding' },
  'T1001': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Data Obfuscation' },
  'T1568': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Dynamic Resolution' },
  'T1573': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Encrypted Channel' },
  'T1008': { isValidTechnique: true, riskScore: 0.8, category: 'Command and Control', description: 'Fallback Channels' },
  'T1105': { isValidTechnique: true, riskScore: 0.9, category: 'Command and Control', description: 'Ingress Tool Transfer' },
  'T1104': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Multi-Stage Channels' },
  'T1095': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Non-Application Layer Protocol' },
  'T1571': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Non-Standard Port' },
  'T1572': { isValidTechnique: true, riskScore: 0.95, category: 'Command and Control', description: 'Protocol Tunneling' },
  'T1090': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Proxy' },
  'T1219': { isValidTechnique: true, riskScore: 0.8, category: 'Command and Control', description: 'Remote Access Software' },
  'T1205': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Traffic Signaling' },
  'T1102': { isValidTechnique: true, riskScore: 0.8, category: 'Command and Control', description: 'Web Service' },

  // ─── EXFILTRATION ────────────────────────────────────────────────────────
  'T1020': { isValidTechnique: true, riskScore: 0.9, category: 'Exfiltration', description: 'Automated Exfiltration' },
  'T1030': { isValidTechnique: true, riskScore: 0.85, category: 'Exfiltration', description: 'Data Transfer Size Limits' },
  'T1048': { isValidTechnique: true, riskScore: 0.9, category: 'Exfiltration', description: 'Exfiltration Over Alternative Protocol' },
  'T1041': { isValidTechnique: true, riskScore: 0.95, category: 'Exfiltration', description: 'Exfiltration Over C2 Channel' },
  'T1011': { isValidTechnique: true, riskScore: 0.85, category: 'Exfiltration', description: 'Exfiltration Over Other Network Medium' },
  'T1052': { isValidTechnique: true, riskScore: 0.8, category: 'Exfiltration', description: 'Exfiltration Over Physical Medium' },
  'T1567': { isValidTechnique: true, riskScore: 0.9, category: 'Exfiltration', description: 'Exfiltration Over Web Service' },
  'T1029': { isValidTechnique: true, riskScore: 0.85, category: 'Exfiltration', description: 'Scheduled Transfer' },
  'T1537': { isValidTechnique: true, riskScore: 0.9, category: 'Exfiltration', description: 'Transfer Data to Cloud Account' },

  // ─── IMPACT ──────────────────────────────────────────────────────────────
  'T1531': { isValidTechnique: true, riskScore: 0.9, category: 'Impact', description: 'Account Access Removal' },
  'T1485': { isValidTechnique: true, riskScore: 0.95, category: 'Impact', description: 'Data Destruction' },
  'T1486': { isValidTechnique: true, riskScore: 0.98, category: 'Impact', description: 'Data Encrypted for Impact' },
  'T1565': { isValidTechnique: true, riskScore: 0.9, category: 'Impact', description: 'Data Manipulation' },
  'T1491': { isValidTechnique: true, riskScore: 0.8, category: 'Impact', description: 'Defacement' },
  'T1561': { isValidTechnique: true, riskScore: 0.95, category: 'Impact', description: 'Disk Wipe' },
  'T1499': { isValidTechnique: true, riskScore: 0.85, category: 'Impact', description: 'Endpoint Denial of Service' },
  'T1657': { isValidTechnique: true, riskScore: 0.85, category: 'Impact', description: 'Financial Theft' },
  'T1495': { isValidTechnique: true, riskScore: 0.95, category: 'Impact', description: 'Firmware Corruption' },
  'T1490': { isValidTechnique: true, riskScore: 0.95, category: 'Impact', description: 'Inhibit System Recovery' },
  'T1498': { isValidTechnique: true, riskScore: 0.85, category: 'Impact', description: 'Network Denial of Service' },
  'T1496': { isValidTechnique: true, riskScore: 0.75, category: 'Impact', description: 'Resource Hijacking' },
  'T1489': { isValidTechnique: true, riskScore: 0.9, category: 'Impact', description: 'Service Stop' },
  'T1529': { isValidTechnique: true, riskScore: 0.85, category: 'Impact', description: 'System Shutdown/Reboot' },
};

// Threat Actor Intelligence Database
interface ThreatActorInfo {
  name: string;
  aliases: string[];
  origin: string;
  motivation: string;
  sophistication: "Low" | "Medium" | "High" | "Advanced";
  techniques: string[];
  description: string;
}

const THREAT_ACTOR_DATABASE: Record<string, ThreatActorInfo> = {
  'APT1': { name: 'APT1 (Comment Crew)', aliases: ['Comment Crew', 'PLA Unit 61398'], origin: 'China', motivation: 'Espionage', sophistication: 'High', techniques: ['T1566', 'T1059', 'T1027', 'T1003', 'T1021', 'T1041'], description: 'Chinese military unit conducting cyber espionage operations' },
  'APT28': { name: 'APT28 (Fancy Bear)', aliases: ['Fancy Bear', 'Pawn Storm', 'Sofacy', 'STRONTIUM'], origin: 'Russia', motivation: 'Espionage', sophistication: 'Advanced', techniques: ['T1566', 'T1190', 'T1078', 'T1059', 'T1055', 'T1003', 'T1021', 'T1041'], description: 'Russian military intelligence (GRU) cyber operations group' },
  'APT29': { name: 'APT29 (Cozy Bear)', aliases: ['Cozy Bear', 'The Dukes', 'NOBELIUM'], origin: 'Russia', motivation: 'Espionage', sophistication: 'Advanced', techniques: ['T1566', 'T1078', 'T1059', 'T1027', 'T1055', 'T1003', 'T1105', 'T1041'], description: 'Russian foreign intelligence service (SVR) operations' },
  'Lazarus': { name: 'Lazarus Group', aliases: ['HIDDEN COBRA', 'Guardians of Peace', 'ZINC'], origin: 'North Korea', motivation: 'Financial, Espionage', sophistication: 'High', techniques: ['T1566', 'T1059', 'T1027', 'T1055', 'T1003', 'T1486', 'T1041'], description: 'North Korean state-sponsored group known for financial crimes and espionage' },
  'Carbanak': { name: 'Carbanak', aliases: ['Carbanak Group'], origin: 'Eastern Europe', motivation: 'Financial', sophistication: 'High', techniques: ['T1566', 'T1059', 'T1055', 'T1003', 'T1021', 'T1105', 'T1041'], description: 'Financially motivated cybercriminal group targeting financial institutions' },
  'Conti': { name: 'Conti Ransomware', aliases: ['Conti', 'Wizard Spider'], origin: 'Russia', motivation: 'Financial', sophistication: 'High', techniques: ['T1566', 'T1059', 'T1027', 'T1055', 'T1003', 'T1021', 'T1486', 'T1490'], description: 'Russian ransomware-as-a-service operation' },
  'Emotet': { name: 'Emotet', aliases: ['Geodo', 'Mealybug'], origin: 'Eastern Europe', motivation: 'Financial', sophistication: 'Medium', techniques: ['T1566', 'T1059', 'T1027', 'T1055', 'T1105', 'T1071'], description: 'Banking trojan turned botnet-as-a-service operation' },
  'Ryuk': { name: 'Ryuk Ransomware', aliases: ['WIZARD SPIDER', 'UNC1878'], origin: 'Russia', motivation: 'Financial', sophistication: 'High', techniques: ['T1566', 'T1059', 'T1055', 'T1003', 'T1021', 'T1486', 'T1490', 'T1561'], description: 'Targeted ransomware operation focusing on high-value targets' }
};

// Search threat actor database by MITRE techniques
const searchThreatActors = (techniques: string[]): ThreatActorInfo[] => {
  const matched: ThreatActorInfo[] = [];
  Object.values(THREAT_ACTOR_DATABASE).forEach(actor => {
    const matching = techniques.filter(t => actor.techniques.includes(t));
    if (matching.length > 0) {
      matched.push({ ...actor, techniques: matching });
    }
  });
  const order = { 'Advanced': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  matched.sort((a, b) => (order[b.sophistication] + b.techniques.length) - (order[a.sophistication] + a.techniques.length));
  return matched.slice(0, 3);
};

// ─── RISK QUANTIFICATION ────────────────────────────────────────────────────
// The model itself lives in ./risk-model.ts. This file feeds it alerts for the
// selected period and turns its output into the metrics the dashboard shows.

const isKnownTechnique = (id: string): boolean => !!MITRE_ATTACK_TECHNIQUES[id]?.isValidTechnique;

const BUCKETS = ["edr", "email", "network", "web", "cloud"] as const;

function tag(data: CategorizedAlerts): ModelAlert[] {
  return BUCKETS.flatMap(bucket => (data[bucket] || []).map(alert => ({ alert, bucket })));
}

// Pulls all alerts (all categories) for the given period.
// This is the SINGLE source of truth for all calculations.
function getAlertsForPeriod(period: "quarterly" | "yearly" | "monthly", selectedQuarter: string): ModelAlert[] {
  if (period === "yearly") {
    const year = selectedQuarter.split(" ")[1] || String(new Date().getUTCFullYear());
    const all: ModelAlert[] = [];
    for (let q = 1; q <= 4; q++) {
      all.push(...tag(edrDataService.getTimeframeAlerts(`Q${q} ${year}`)));
    }
    return all;
  }

  const all = tag(edrDataService.getTimeframeAlerts(selectedQuarter));

  if (period === "monthly") {
    // The most recent calendar month in the quarter that has alerts.
    const monthOf = (a: ModelAlert) => a.alert.timestamp.slice(0, 7); // YYYY-MM
    const latest = all.reduce((m, a) => (monthOf(a) > m ? monthOf(a) : m), "");
    return all.filter(a => monthOf(a) === latest);
  }

  return all;
}

// Investment is entered as an ANNUAL figure; compare like with like.
const PERIOD_SHARE = { yearly: 1, quarterly: 1 / 4, monthly: 1 / 12 } as const;

const roiPct = (lossAvoided: number, investment: number): number =>
  investment > 0 ? Math.round(((lossAvoided - investment) / investment) * 100) : 0;

// ─── ORGANISATION PROFILE ───────────────────────────────────────────────────
// Set in Settings. Until the size is chosen, a mid-sized band is assumed and
// the dashboard says so.

interface Profile {
  band: RevenueBand;
  assumed: boolean;
  lossEventsLast12Months: number;
  typicalControlEffectiveness: number;
}

function getProfile(): Profile {
  const org = getSettings().organisation;
  const band = getRevenueBand(org?.revenueBand);
  const typical = Number(org?.typicalControlEffectiveness);
  return {
    band: band ?? DEFAULT_REVENUE_BAND,
    assumed: !band,
    lossEventsLast12Months: Math.max(0, Number(org?.lossEventsLast12Months) || 0),
    typicalControlEffectiveness:
      isFinite(typical) && typical >= 0.2 && typical <= 0.8 ? typical : DEFAULT_RISK_CONFIG.typicalControlEffectiveness,
  };
}

// ─── MAIN CALCULATION: calculateCostMetrics ─────────────────────────────────
// Pipeline:
//   1. Exposure for the period from published loss data for this size of
//      organisation, with no detection and response
//   2. Your control effectiveness from the period's resolved incidents
//   3. totalCostImpact = exposure × control effectiveness, with a range
//   4. ROI = (loss avoided − investment for the period) / investment

export const calculateRiskSummary = (params: CostCalculationParams): RiskSummary => {
  const { period, selectedQuarter = currentQuarterLabel() } = params;
  const profile = getProfile();
  const periodYears = PERIOD_SHARE[period];
  return summariseRisk(getAlertsForPeriod(period, selectedQuarter), isKnownTechnique, {
    anchor: profile.band,
    periodYears,
    lossEventsSuffered: profile.lossEventsLast12Months * periodYears,
    config: { ...DEFAULT_RISK_CONFIG, typicalControlEffectiveness: profile.typicalControlEffectiveness },
  });
};

export const calculateCostMetrics = async (params: CostCalculationParams): Promise<CostMetrics> => {
  const { period, investmentAmount = 0 } = params;
  const risk = calculateRiskSummary(params);
  const profile = getProfile();
  const pct = (x: number) => Math.round(x * 1000) / 10;

  const totalInvestment = Math.round(investmentAmount * PERIOD_SHARE[period]);
  const totalCostImpact = Math.round(risk.lossAvoided.mean);
  const netBenefit = totalCostImpact - totalInvestment;

  return {
    totalAlerts: risk.totalAlerts,
    truePositiveCount: risk.countedAlerts,
    falsePositiveCount: risk.totalAlerts - risk.countedAlerts,
    truePositiveRate: risk.totalAlerts > 0 ? pct(risk.countedAlerts / risk.totalAlerts) : 0,
    incidentCount: risk.incidentCount,
    confirmedIncidents: risk.confirmedIncidents,
    unverifiedIncidents: risk.unverifiedIncidents,
    dismissedIncidents: risk.dismissedIncidents,
    confirmedShare: pct(risk.confirmedShare),
    exposure: Math.round(risk.exposure),
    controlEffectiveness: pct(risk.controlEffectiveness.mean),
    controlEffectivenessLow: pct(risk.controlEffectiveness.p5),
    controlEffectivenessHigh: pct(risk.controlEffectiveness.p95),
    residualLoss: Math.round(risk.residualLoss),
    lossProbabilityWithoutControls: pct(risk.annualLossProbabilityWithoutControls),
    lossProbabilityWithControls: pct(risk.annualLossProbabilityWithControls),
    peerAnnualLoss: Math.round(risk.peerAnnualLoss),
    typicalLoss: profile.band.lossMedian,
    severeLoss: profile.band.lossP95,
    lossPerEvent: Math.round(risk.lossPerEvent),
    revenueBand: profile.band.label,
    profileAssumed: profile.assumed,
    typicalControlEffectiveness: pct(profile.typicalControlEffectiveness),
    lossEventsSuffered: profile.lossEventsLast12Months,
    totalCostImpact,
    lossAvoidedLow: Math.round(risk.lossAvoided.p5),
    lossAvoidedMedian: Math.round(risk.lossAvoided.p50),
    lossAvoidedHigh: Math.round(risk.lossAvoided.p95),
    categoryBreakdown: risk.byCategory.map(r => ({
      category: r.key,
      incidents: r.incidents,
      lossAvoided: Math.round(r.expectedLossAvoided),
    })),
    totalInvestment,
    totalCostSavings: netBenefit,
    netBenefit,
    roi: roiPct(totalCostImpact, totalInvestment),
    roiLow: roiPct(risk.lossAvoided.p5, totalInvestment),
    roiHigh: roiPct(risk.lossAvoided.p95, totalInvestment),
  };
};

function currentQuarterLabel(): string {
  const now = new Date();
  return `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;
}

// Legacy wrapper — returns just the expected loss avoided
export const calculateCostSavingsFromEDRAlerts = async (params: CostCalculationParams): Promise<number> => {
  const metrics = await calculateCostMetrics(params);
  return metrics.totalCostImpact;
};

// ─── EXPORTS ────────────────────────────────────────────────────────────────

export const validateAlertMITRECompliance = async (alert: SecurityAlert) => {
  const verdict = verdictFor(alert);
  const pReal = verdict === "confirmed" ? 1 : verdict === "dismissed" ? 0 : unverifiedProbability(alert, isKnownTechnique);
  const validatedTechniques = (alert.mitreTechniques || []).filter(
    t => isKnownTechnique(t) || isKnownTechnique(t.split(".")[0])
  );
  return {
    isValid: pReal > 0,
    verdict,
    riskScore: pReal,
    validatedTechniques,
    threatActors: searchThreatActors(validatedTechniques),
    webIntelligence: [] as string[],
  };
};

export const MITRE_TECHNIQUES = MITRE_ATTACK_TECHNIQUES;
export const THREAT_ACTORS = THREAT_ACTOR_DATABASE;
export const searchKnownThreatActors = searchThreatActors;

export const formatCurrency = (amount: number): string => {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString()}`;
};
