// Demo data shown until a real data source is connected.
//
// Repeatable: the same quarter always produces the same alerts, so figures do
// not change between restarts. Covers all six categories, eight departments
// and a year in which things visibly change from quarter to quarter (a phishing
// wave, an identity attack campaign, improving triage), so the trend views have
// something to show.

import type { AlertCategory } from "@/lib/connectors/types";

export interface DemoAlert {
  id: string;
  timestamp: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  category: string;
  title: string;
  description: string;
  source: string;
  platform: string;
  department: string;
  rawLog: Record<string, unknown>;
  mitreTactics: string[];
  mitreTechniques: string[];
  iocIndicators: string[];
  affectedEntities: string[];
  remediationSteps: string[];
  costImpact: number;
}

type Severity = DemoAlert["severity"];

interface Template {
  title: string;
  tactics: string[];
  techniques: string[];
  /** How serious this kind of alert tends to be: shifts the severity mix. */
  weight: number;
}

const CATALOGUE: Record<AlertCategory, { label: string; sources: string[]; templates: Template[] }> = {
  edr: {
    label: "Endpoint",
    sources: ["Microsoft Defender for Endpoint", "CrowdStrike Falcon"],
    templates: [
      { title: "Ransomware behaviour blocked", tactics: ["Execution", "Impact"], techniques: ["T1486", "T1059"], weight: 3 },
      { title: "Credential dumping from LSASS memory", tactics: ["Credential Access"], techniques: ["T1003.001"], weight: 3 },
      { title: "Suspicious PowerShell download cradle", tactics: ["Execution"], techniques: ["T1059.001"], weight: 2 },
      { title: "Office document spawned a command shell", tactics: ["Initial Access", "Execution"], techniques: ["T1566.001", "T1204.002"], weight: 2 },
      { title: "Unsigned driver loaded", tactics: ["Defense Evasion"], techniques: ["T1068"], weight: 1 },
      { title: "New scheduled task for persistence", tactics: ["Persistence"], techniques: ["T1053.005"], weight: 1 },
      { title: "Potentially unwanted application detected", tactics: ["Execution"], techniques: ["T1204"], weight: 0 },
    ],
  },
  email: {
    label: "Email",
    sources: ["Microsoft Defender for Office 365", "Proofpoint TAP"],
    templates: [
      { title: "Credential-harvesting link delivered to inbox", tactics: ["Initial Access"], techniques: ["T1566.002"], weight: 2 },
      { title: "Payment-change request from look-alike domain", tactics: ["Initial Access"], techniques: ["T1566", "T1656"], weight: 3 },
      { title: "Malicious attachment detonated in sandbox", tactics: ["Initial Access", "Execution"], techniques: ["T1566.001"], weight: 2 },
      { title: "User reported phishing message", tactics: ["Initial Access"], techniques: ["T1566"], weight: 1 },
      { title: "Bulk spam campaign quarantined", tactics: ["Initial Access"], techniques: ["T1566"], weight: 0 },
    ],
  },
  network: {
    label: "Network",
    sources: ["Palo Alto Networks NGFW", "Cisco Secure Firewall"],
    templates: [
      { title: "Outbound connection to known command-and-control host", tactics: ["Command and Control"], techniques: ["T1071.001"], weight: 3 },
      { title: "Lateral movement over SMB", tactics: ["Lateral Movement"], techniques: ["T1021.002"], weight: 3 },
      { title: "DNS tunnelling pattern", tactics: ["Command and Control", "Exfiltration"], techniques: ["T1071.004", "T1048"], weight: 2 },
      { title: "Internal port scan", tactics: ["Discovery"], techniques: ["T1046"], weight: 1 },
      { title: "Large upload to unsanctioned file-sharing site", tactics: ["Exfiltration"], techniques: ["T1567.002"], weight: 2 },
    ],
  },
  web: {
    label: "Web",
    sources: ["Zscaler Internet Access", "Cloudflare WAF"],
    templates: [
      { title: "SQL injection attempt against customer portal", tactics: ["Initial Access"], techniques: ["T1190"], weight: 2 },
      { title: "Drive-by download blocked", tactics: ["Initial Access"], techniques: ["T1189"], weight: 1 },
      { title: "Visit to newly registered phishing domain", tactics: ["Initial Access"], techniques: ["T1566.002"], weight: 1 },
      { title: "Web shell upload attempt", tactics: ["Persistence"], techniques: ["T1505.003"], weight: 3 },
      { title: "Blocked category: anonymiser", tactics: ["Command and Control"], techniques: ["T1090"], weight: 0 },
    ],
  },
  cloud: {
    label: "Cloud",
    sources: ["Microsoft Defender for Cloud", "AWS GuardDuty"],
    templates: [
      { title: "Access key used from an unfamiliar country", tactics: ["Initial Access"], techniques: ["T1078.004"], weight: 3 },
      { title: "Storage bucket made public", tactics: ["Collection"], techniques: ["T1530"], weight: 2 },
      { title: "Crypto-mining workload detected", tactics: ["Impact"], techniques: ["T1496"], weight: 2 },
      { title: "Security group opened to the internet", tactics: ["Defense Evasion"], techniques: ["T1562.007"], weight: 1 },
      { title: "Unusual volume of secret reads from key vault", tactics: ["Credential Access"], techniques: ["T1555.006"], weight: 3 },
    ],
  },
  identity: {
    label: "Identity",
    sources: ["Microsoft Entra ID Protection", "Okta"],
    templates: [
      { title: "Impossible-travel sign-in", tactics: ["Initial Access"], techniques: ["T1078"], weight: 2 },
      { title: "MFA push-bombing followed by approval", tactics: ["Credential Access"], techniques: ["T1621"], weight: 3 },
      { title: "Password spray against multiple accounts", tactics: ["Credential Access"], techniques: ["T1110.003"], weight: 2 },
      { title: "Privileged role assigned outside change window", tactics: ["Privilege Escalation"], techniques: ["T1098.003"], weight: 3 },
      { title: "Sign-in from anonymising proxy", tactics: ["Initial Access"], techniques: ["T1090.003"], weight: 1 },
    ],
  },
};

// Department, and how much of the alert volume lands on it.
const DEPARTMENTS: [string, number][] = [
  ["Finance", 18],
  ["Engineering", 17],
  ["Sales", 15],
  ["Operations", 13],
  ["Customer Support", 12],
  ["Human Resources", 9],
  ["Executive Office", 8],
  ["Legal", 8],
];

// The year's story, by calendar quarter: how busy each category is (alerts per
// quarter), how many alerts turn out to be real, and how much gets triaged.
const QUARTERS: Record<number, { volume: Record<AlertCategory, number>; realShare: number; triaged: number; severityShift: number }> = {
  1: { volume: { edr: 96, email: 58, network: 44, web: 38, cloud: 26, identity: 34 }, realShare: 0.42, triaged: 0.68, severityShift: 0 },
  2: { volume: { edr: 104, email: 92, network: 47, web: 41, cloud: 31, identity: 39 }, realShare: 0.46, triaged: 0.74, severityShift: 0.03 }, // phishing wave
  3: { volume: { edr: 118, email: 71, network: 58, web: 44, cloud: 42, identity: 76 }, realShare: 0.53, triaged: 0.81, severityShift: 0.07 }, // identity attack campaign
  4: { volume: { edr: 99, email: 63, network: 49, web: 36, cloud: 37, identity: 48 }, realShare: 0.49, triaged: 0.88, severityShift: 0.02 },  // campaign contained, triage improved
};

// Small repeatable random number generator (mulberry32).
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(items: [T, number][], r: number): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = r * total;
  for (const [item, w] of items) {
    x -= w;
    if (x <= 0) return item;
  }
  return items[items.length - 1][0];
}

const CATEGORY_CODE: Record<AlertCategory, string> = { edr: "EP", email: "EM", network: "NW", web: "WB", cloud: "CL", identity: "ID" };

/** Demo alerts for one calendar quarter, e.g. "Q3 2026", each with its category. */
export function generateDemoAlerts(timeframe: string): { alert: DemoAlert; category: AlertCategory }[] {
  const year = parseInt(timeframe.match(/(\d{4})/)?.[1] || String(new Date().getFullYear()), 10);
  const quarter = Math.min(4, Math.max(1, parseInt(timeframe.match(/Q(\d)/)?.[1] || "1", 10)));
  const profile = QUARTERS[quarter];
  const random = rng(year * 10 + quarter);
  const quarterStart = Date.UTC(year, (quarter - 1) * 3, 1);
  const quarterEnd = Date.UTC(year, quarter * 3, 1);
  const out: { alert: DemoAlert; category: AlertCategory }[] = [];

  for (const category of Object.keys(CATALOGUE) as AlertCategory[]) {
    const { sources, templates, label } = CATALOGUE[category];
    for (let i = 0; i < profile.volume[category]; i++) {
      const template = templates[Math.floor(random() * templates.length)];
      const source = sources[Math.floor(random() * sources.length)];
      const department = pickWeighted(DEPARTMENTS, random());

      // Severity: more serious kinds of alert skew higher
      const s = random() + template.weight * 0.09 + profile.severityShift;
      const rated: Severity = s > 1.08 ? "Critical" : s > 0.8 ? "High" : s > 0.38 ? "Medium" : "Low";
      // Routine detections (spam, unwanted apps, blocked categories) never rate above medium
      const severity: Severity = template.weight === 0 && (rated === "Critical" || rated === "High") ? "Medium" : rated;

      // Analyst verdict: serious alerts are more often real and more often triaged
      const seriousness = severity === "Critical" ? 0.3 : severity === "High" ? 0.15 : severity === "Medium" ? 0 : -0.2;
      const triaged = random() < Math.min(0.98, profile.triaged + seriousness * 0.4);
      const real = random() < Math.min(0.95, Math.max(0.05, profile.realShare + seriousness));
      const classification = !triaged ? "unknown" : real ? "truePositive" : "falsePositive";
      const confidence = Math.round(55 + random() * 25 + (real ? 15 : 0) + template.weight * 2);

      const n = String(100 + Math.floor(random() * 900));
      const user = `${["a.mensah", "j.owusu", "k.boateng", "e.asante", "s.adjei", "m.osei", "n.appiah", "d.agyeman"][Math.floor(random() * 8)]}@example.com`;
      const host = category === "cloud" ? `prod-${["api", "web", "data", "batch"][Math.floor(random() * 4)]}-${n}` : `${department.slice(0, 3).toUpperCase()}-LT-${n}`;
      const timestamp = new Date(quarterStart + Math.floor(random() * (quarterEnd - quarterStart - 60000))).toISOString();

      out.push({
        category,
        alert: {
          id: `DEMO-${CATEGORY_CODE[category]}-${year}Q${quarter}-${String(i + 1).padStart(3, "0")}`,
          timestamp,
          severity,
          category: label,
          title: template.title,
          description: `${template.title} (${source}), ${department}.`,
          source,
          platform: category === "edr" ? ["Windows 11", "macOS", "Windows Server 2022", "Linux"][Math.floor(random() * 4)] : label,
          department,
          rawLog: { classification, Confidence: Math.min(99, confidence), DeviceName: host, UserPrincipalName: user },
          mitreTactics: template.tactics,
          mitreTechniques: template.techniques,
          iocIndicators: [],
          affectedEntities: category === "email" || category === "identity" ? [user] : [host, user],
          remediationSteps: [],
          costImpact: 0,
        },
      });
    }
  }
  return out;
}
