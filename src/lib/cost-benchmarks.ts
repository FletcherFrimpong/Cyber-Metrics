// Industry benchmark cost-per-incident matrix.
// Sources:
//   - IBM Cost of a Data Breach Report 2024 ($4.88M avg breach, $5.13M ransomware)
//   - FBI IC3 2024 ($125K avg BEC loss)
//   - Ponemon Institute: Cost of Insider Threats 2023
//   - Verizon DBIR 2024: incident frequency and impact by type
//   - SANS Institute: incident response cost benchmarks
//
// These represent the POTENTIAL LOSS PREVENTED per incident — not the cost of a full breach.
// A single detected-and-resolved incident prevents escalation to a breach.
// The values are conservative estimates based on:
//   - Average cost if the incident had escalated undetected
//   - Weighted by probability of escalation at each severity level
//   - Adjusted for industry median (Technology sector baseline)

import type { AlertCategory } from "./sentinel-category-mapper";

type Severity = "Critical" | "High" | "Medium" | "Low";

export interface CostBenchmark {
  amount: number;
  rationale: string;
}

// Cost matrix: category × severity → potential loss prevented per incident
const BENCHMARK_MATRIX: Record<string, Record<Severity, CostBenchmark>> = {
  edr: {
    Critical: {
      amount: 750000,
      rationale: "Ransomware/active breach prevention. IBM 2024: avg ransomware incident $5.13M. Single endpoint containment prevents lateral spread — estimated 15% of full breach cost.",
    },
    High: {
      amount: 200000,
      rationale: "Malware/credential theft containment. Ponemon 2023: avg credential compromise leads to $200K in response costs if caught early before lateral movement.",
    },
    Medium: {
      amount: 45000,
      rationale: "Suspicious process/behavioral detection. SANS: avg investigation + remediation cost for contained medium-severity endpoint incident.",
    },
    Low: {
      amount: 8000,
      rationale: "Policy violation/PUP detection. Minimal direct impact but prevents potential escalation. Based on avg SOC analyst time + remediation.",
    },
  },

  email: {
    Critical: {
      amount: 125000,
      rationale: "Business Email Compromise prevention. FBI IC3 2024: median BEC loss $125,000 per incident.",
    },
    High: {
      amount: 65000,
      rationale: "Targeted spear-phishing with payload. Verizon DBIR: 30% of phishing leads to credential harvest, avg downstream cost $65K if contained at email layer.",
    },
    Medium: {
      amount: 12000,
      rationale: "Bulk phishing campaign blocked. Cost of potential credential reset, user notification, and SOC investigation time.",
    },
    Low: {
      amount: 2000,
      rationale: "Spam/low-confidence phishing. Automated blocking with minimal analyst overhead.",
    },
  },

  network: {
    Critical: {
      amount: 500000,
      rationale: "Active network intrusion/C2 communication. IBM 2024: incidents involving C2 channels avg $500K+ in containment when caught before data staging.",
    },
    High: {
      amount: 175000,
      rationale: "Lateral movement/data staging detected. Ponemon: avg cost of contained network breach before exfiltration.",
    },
    Medium: {
      amount: 30000,
      rationale: "Suspicious connection/port scan/anomalous traffic. Investigation + firewall rule updates + threat hunting hours.",
    },
    Low: {
      amount: 5000,
      rationale: "Policy violation/blocked connection attempt. Automated response with log review.",
    },
  },

  web: {
    Critical: {
      amount: 350000,
      rationale: "SQL injection/RCE prevention on production systems. IBM 2024: web application attacks leading to data exposure avg $350K in immediate response.",
    },
    High: {
      amount: 100000,
      rationale: "XSS/CSRF with authenticated session compromise. Cost includes session invalidation, user notification, forensic analysis.",
    },
    Medium: {
      amount: 15000,
      rationale: "Bot activity/credential stuffing/scraping attempts blocked. WAF tuning + investigation time.",
    },
    Low: {
      amount: 2500,
      rationale: "Blocked malicious request/known bad signature. Automated WAF response.",
    },
  },

  cloud: {
    Critical: {
      amount: 650000,
      rationale: "Cloud breach/exposed storage/compromised workload. IBM 2024: cloud-specific breaches avg 12% higher than on-prem ($5.17M). Single incident containment ≈ 12.5% of full breach.",
    },
    High: {
      amount: 225000,
      rationale: "Privilege escalation/IAM misconfiguration exploited. Ponemon: cloud misconfig incidents avg $225K when detected before data access.",
    },
    Medium: {
      amount: 50000,
      rationale: "Access anomaly/suspicious API calls/resource modification. Investigation + config remediation + audit review.",
    },
    Low: {
      amount: 10000,
      rationale: "Compliance drift/minor policy violation. Automated remediation with review cycle.",
    },
  },
};

// Get cost for a specific category + severity
export function getIncidentCost(category: string, severity: string): number {
  const catBenchmarks = BENCHMARK_MATRIX[category];
  if (!catBenchmarks) return BENCHMARK_MATRIX.cloud[severity as Severity]?.amount || 50000;
  return catBenchmarks[severity as Severity]?.amount || 50000;
}

// Get the full benchmark entry with rationale
export function getIncidentBenchmark(category: string, severity: string): CostBenchmark {
  const catBenchmarks = BENCHMARK_MATRIX[category];
  if (!catBenchmarks) return { amount: 50000, rationale: "Default estimate" };
  return catBenchmarks[severity as Severity] || { amount: 50000, rationale: "Default estimate" };
}

// Get the entire matrix (for display in settings/reports)
export function getBenchmarkMatrix(): Record<string, Record<Severity, CostBenchmark>> {
  return BENCHMARK_MATRIX;
}

// Summary stats
export function getBenchmarkSummary() {
  const allCosts: number[] = [];
  for (const cat of Object.values(BENCHMARK_MATRIX)) {
    for (const sev of Object.values(cat)) {
      allCosts.push(sev.amount);
    }
  }
  return {
    min: Math.min(...allCosts),
    max: Math.max(...allCosts),
    avg: Math.round(allCosts.reduce((a, b) => a + b, 0) / allCosts.length),
    categories: Object.keys(BENCHMARK_MATRIX),
  };
}
