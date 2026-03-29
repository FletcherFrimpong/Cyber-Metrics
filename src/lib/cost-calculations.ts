import edrDataService from "./edr-data-service";

// Centralized cost calculation system
// All metrics are derived from actual alert data — no fabricated multipliers.
// Flow: Get alerts (from Sentinel or sample) → Filter true positives → Sum their costImpact → Derive everything from that.

export interface CostCalculationParams {
  period: "quarterly" | "yearly" | "monthly";
  selectedQuarter?: string;
  investmentAmount?: number; // User-configured security investment
}

export interface CostMetrics {
  totalAlerts: number;
  truePositiveCount: number;
  falsePositiveCount: number;
  truePositiveRate: number;
  totalCostImpact: number;       // Sum of costImpact from true positive alerts
  totalInvestment: number;       // Fixed EDR investment
  totalCostSavings: number;      // costImpact - investment
  breachPrevention: number;
  complianceSavings: number;
  insuranceSavings: number;
  productivityGains: number;
  regulatoryFines: number;
  reputationDamage: number;
  netBenefit: number;
  roi: number;
}

// MITRE ATT&CK Framework validation for true positive analysis
interface MITREValidation {
  isValidTechnique: boolean;
  riskScore: number;
  category: string;
  description: string;
}

// MITRE ATT&CK technique database with risk scoring
const MITRE_ATTACK_TECHNIQUES: Record<string, MITREValidation> = {
  // Initial Access
  'T1566': { isValidTechnique: true, riskScore: 0.9, category: 'Initial Access', description: 'Phishing' },
  'T1190': { isValidTechnique: true, riskScore: 0.95, category: 'Initial Access', description: 'Exploit Public-Facing Application' },
  'T1078': { isValidTechnique: true, riskScore: 0.85, category: 'Initial Access', description: 'Valid Accounts' },
  // Execution
  'T1059': { isValidTechnique: true, riskScore: 0.9, category: 'Execution', description: 'Command and Scripting Interpreter' },
  'T1053': { isValidTechnique: true, riskScore: 0.8, category: 'Execution', description: 'Scheduled Task/Job' },
  'T1204': { isValidTechnique: true, riskScore: 0.75, category: 'Execution', description: 'User Execution' },
  // Persistence
  'T1547': { isValidTechnique: true, riskScore: 0.85, category: 'Persistence', description: 'Boot or Logon Autostart Execution' },
  'T1543': { isValidTechnique: true, riskScore: 0.9, category: 'Persistence', description: 'Create or Modify System Process' },
  'T1136': { isValidTechnique: true, riskScore: 0.8, category: 'Persistence', description: 'Create Account' },
  // Privilege Escalation
  'T1068': { isValidTechnique: true, riskScore: 0.95, category: 'Privilege Escalation', description: 'Exploitation for Privilege Escalation' },
  'T1055': { isValidTechnique: true, riskScore: 0.9, category: 'Privilege Escalation', description: 'Process Injection' },
  'T1134': { isValidTechnique: true, riskScore: 0.85, category: 'Privilege Escalation', description: 'Access Token Manipulation' },
  // Defense Evasion
  'T1027': { isValidTechnique: true, riskScore: 0.85, category: 'Defense Evasion', description: 'Obfuscated Files or Information' },
  'T1070': { isValidTechnique: true, riskScore: 0.9, category: 'Defense Evasion', description: 'Indicator Removal on Host' },
  'T1562': { isValidTechnique: true, riskScore: 0.95, category: 'Defense Evasion', description: 'Impair Defenses' },
  // Credential Access
  'T1003': { isValidTechnique: true, riskScore: 0.95, category: 'Credential Access', description: 'OS Credential Dumping' },
  'T1110': { isValidTechnique: true, riskScore: 0.8, category: 'Credential Access', description: 'Brute Force' },
  'T1555': { isValidTechnique: true, riskScore: 0.85, category: 'Credential Access', description: 'Credentials from Password Stores' },
  // Discovery
  'T1083': { isValidTechnique: true, riskScore: 0.7, category: 'Discovery', description: 'File and Directory Discovery' },
  'T1057': { isValidTechnique: true, riskScore: 0.65, category: 'Discovery', description: 'Process Discovery' },
  'T1018': { isValidTechnique: true, riskScore: 0.75, category: 'Discovery', description: 'Remote System Discovery' },
  // Lateral Movement
  'T1021': { isValidTechnique: true, riskScore: 0.9, category: 'Lateral Movement', description: 'Remote Services' },
  'T1047': { isValidTechnique: true, riskScore: 0.85, category: 'Lateral Movement', description: 'Windows Management Instrumentation' },
  'T1210': { isValidTechnique: true, riskScore: 0.95, category: 'Lateral Movement', description: 'Exploitation of Remote Services' },
  // Collection
  'T1005': { isValidTechnique: true, riskScore: 0.8, category: 'Collection', description: 'Data from Local System' },
  'T1039': { isValidTechnique: true, riskScore: 0.85, category: 'Collection', description: 'Data from Network Shared Drive' },
  'T1113': { isValidTechnique: true, riskScore: 0.75, category: 'Collection', description: 'Screen Capture' },
  // Command and Control
  'T1071': { isValidTechnique: true, riskScore: 0.85, category: 'Command and Control', description: 'Application Layer Protocol' },
  'T1105': { isValidTechnique: true, riskScore: 0.9, category: 'Command and Control', description: 'Ingress Tool Transfer' },
  'T1572': { isValidTechnique: true, riskScore: 0.95, category: 'Command and Control', description: 'Protocol Tunneling' },
  // Exfiltration
  'T1041': { isValidTechnique: true, riskScore: 0.95, category: 'Exfiltration', description: 'Exfiltration Over C2 Channel' },
  'T1052': { isValidTechnique: true, riskScore: 0.8, category: 'Exfiltration', description: 'Exfiltration Over Physical Medium' },
  'T1567': { isValidTechnique: true, riskScore: 0.9, category: 'Exfiltration', description: 'Exfiltration Over Web Service' },
  // Impact
  'T1486': { isValidTechnique: true, riskScore: 0.98, category: 'Impact', description: 'Data Encrypted for Impact' },
  'T1490': { isValidTechnique: true, riskScore: 0.95, category: 'Impact', description: 'Inhibit System Recovery' },
  'T1561': { isValidTechnique: true, riskScore: 0.9, category: 'Impact', description: 'Disk Wipe' }
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

// Investment amount is passed in via params from the calling component,
// which fetches it from the /api/settings endpoint.

// ─── TRUE POSITIVE VALIDATION ───────────────────────────────────────────────
// This is the core of the risk quantification.
// An alert is a true positive if:
//   1. High confidence (≥85%) OR severity is Critical/High
//   2. Has at least one valid MITRE ATT&CK technique with risk score ≥ 0.7

function validateAlert(alert: any): { isValid: boolean; riskScore: number; techniques: string[] } {
  const confidence = alert.confidence || alert.rawLog?.Confidence || 0;
  const hasHighConfidence = confidence >= 85 || alert.severity === "Critical" || alert.severity === "High";

  const techniques = alert.mitreTechniques || [];
  const validTechniques: string[] = [];
  let totalRisk = 0;

  for (const t of techniques) {
    // Handle sub-techniques like T1059.001 — look up the base technique too
    const baseT = t.split('.')[0];
    const entry = MITRE_ATTACK_TECHNIQUES[t] || MITRE_ATTACK_TECHNIQUES[baseT];
    if (entry?.isValidTechnique) {
      validTechniques.push(t);
      totalRisk += entry.riskScore;
    }
  }

  const avgRisk = validTechniques.length > 0 ? totalRisk / validTechniques.length : 0;
  const hasMITRE = validTechniques.length > 0 && avgRisk >= 0.7;

  return {
    isValid: hasHighConfidence && hasMITRE,
    riskScore: avgRisk,
    techniques: validTechniques,
  };
}

// ─── GET ALERTS FOR A PERIOD ────────────────────────────────────────────────
// Pulls all alerts (all categories) for the given period.
// This is the SINGLE source of truth for all calculations.

function getAlertsForPeriod(period: "quarterly" | "yearly" | "monthly", selectedQuarter: string): any[] {
  // Uses the data service — which pulls from Sentinel if configured, sample data otherwise
  if (period === "yearly") {
    const year = selectedQuarter.split(" ")[1] || "2024";
    const all: any[] = [];
    for (let q = 1; q <= 4; q++) {
      const data = edrDataService.getTimeframeAlerts(`Q${q} ${year}`);
      all.push(...data.edr, ...data.email, ...data.network, ...data.web, ...data.cloud);
    }
    return all;
  }

  // Quarterly or monthly — get the selected quarter
  const data = edrDataService.getTimeframeAlerts(selectedQuarter);
  const all = [...data.edr, ...data.email, ...data.network, ...data.web, ...data.cloud];

  if (period === "monthly") {
    // Approximate: take 1/3 of the quarter's alerts
    return all.slice(0, Math.round(all.length / 3));
  }

  return all;
}

// ─── MAIN CALCULATION: calculateCostMetrics ─────────────────────────────────
// One unified function. Everything flows from the actual alert data.
//
// Pipeline:
//   1. Get all alerts for the period
//   2. Validate each alert (true positive filter)
//   3. totalCostImpact = SUM(truePositive.costImpact)  ← the actual risk quantified
//   4. totalCostSavings = totalCostImpact - investment
//   5. ROI = totalCostSavings / investment × 100
//   6. Breakdown = percentage allocation of savings by category

export const calculateCostMetrics = async (params: CostCalculationParams): Promise<CostMetrics> => {
  const { period, selectedQuarter = "Q4 2024", investmentAmount = 0 } = params;

  // Step 1: Get all alerts for the period
  const allAlerts = getAlertsForPeriod(period, selectedQuarter);

  // Step 2: Filter true positives
  const truePositives: any[] = [];
  for (const alert of allAlerts) {
    const result = validateAlert(alert);
    if (result.isValid) {
      truePositives.push(alert);
    }
  }

  // Step 3: Total cost impact = sum of costImpact from true positive alerts
  // This is the actual risk quantified — what these threats would have cost if not detected
  const totalCostImpact = truePositives.reduce((sum, a) => sum + (a.costImpact || 0), 0);

  // Step 4: Derive savings and ROI
  const totalInvestment = investmentAmount;
  const totalCostSavings = totalCostImpact - totalInvestment;
  const netBenefit = totalCostSavings;
  const roi = totalInvestment > 0 ? Math.round((netBenefit / totalInvestment) * 100) : 0;

  // Step 5: Breakdown allocation (sums to 100% of savings)
  const s = Math.max(0, totalCostSavings); // Don't allocate negative savings
  const breachPrevention = Math.round(s * 0.35);
  const complianceSavings = Math.round(s * 0.15);
  const insuranceSavings = Math.round(s * 0.10);
  const productivityGains = Math.round(s * 0.20);
  const regulatoryFines = Math.round(s * 0.12);
  const reputationDamage = Math.round(s * 0.08);

  return {
    totalAlerts: allAlerts.length,
    truePositiveCount: truePositives.length,
    falsePositiveCount: allAlerts.length - truePositives.length,
    truePositiveRate: allAlerts.length > 0 ? Math.round((truePositives.length / allAlerts.length) * 1000) / 10 : 0,
    totalCostImpact,
    totalCostSavings,
    breachPrevention,
    complianceSavings,
    insuranceSavings,
    productivityGains,
    regulatoryFines,
    reputationDamage,
    totalInvestment,
    netBenefit,
    roi,
  };
};

// Legacy wrapper — returns just the cost savings number for backward compat
export const calculateCostSavingsFromEDRAlerts = async (params: CostCalculationParams): Promise<number> => {
  const metrics = await calculateCostMetrics(params);
  return metrics.totalCostImpact; // Return full impact (what true positives would have cost)
};

// ─── EXPORTS ────────────────────────────────────────────────────────────────

export const validateAlertMITRECompliance = async (alert: any) => {
  const result = validateAlert(alert);
  const threatActors = searchThreatActors(result.techniques);
  return {
    isValid: result.isValid,
    riskScore: result.riskScore,
    validatedTechniques: result.techniques,
    threatActors,
    webIntelligence: [] as string[],
  };
};

export const MITRE_TECHNIQUES = MITRE_ATTACK_TECHNIQUES;
export const THREAT_ACTORS = THREAT_ACTOR_DATABASE;
export const searchKnownThreatActors = searchThreatActors;

export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};
