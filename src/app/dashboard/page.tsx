"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, Target, DollarSign, AlertTriangle, X, Eye, Settings, Download, Mail, Globe, Lock, Monitor, TrendingUp, TrendingDown } from "lucide-react";

// Define interfaces for type safety
interface BusinessUnit {
  name: string;
  attacks: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  costSaved: number;
}

interface AttackCosts {
  averageBreachCost: number;
  dataTheftCost?: number;
  systemRecoveryCost?: number;
  businessDisruptionCost?: number;
  regulatoryFines: number;
  reputationDamage: number;
  credentialCompromise?: number;
  lateralMovementCost?: number;
  privilegeEscalationCost?: number;
  ransomDemand?: number;
  malwareInfectionCost?: number;
  dataExfiltrationCost?: number;
  dataBreachCost?: number;
  credentialTheftCost?: number;
  serviceDisruptionCost?: number;
  complianceViolationCost?: number;
  customerTrustCost?: number;
  legalLiabilityCost?: number;
  serviceAbuseCost?: number;
  reputationDamageCost?: number;
  operationalDisruptionCost?: number;
  systemCompromiseCost?: number;
}

interface ThreatIntelligence {
  primaryGroups: string[];
  attackVectors: string[];
  targetIndustries: string[];
  recentCampaigns: string[];
  iocPatterns: string[];
}

interface SecurityRule {
  id: string;
  name: string;
  platform: string;
  performance: number;
  truePositives: number;
  falsePositives: number;
  costSaved: number;
  alerts: number;
  mitreTactic: string;
  fileTypes: string[];
  threatActors: string[];
  mitigationActions: string[];
  businessUnits: BusinessUnit[];
  attackCosts: AttackCosts;
  threatIntelligence: ThreatIntelligence;
}

interface SecurityCategory {
  name: string;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  borderColor: string;
  rules: SecurityRule[];
}

export default function DashboardPage() {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const performanceMetrics = {
    totalRules: 847,
    activeRules: 36, // Total true positive attacks from EDR rules
    avgPerformance: 94.2,
    falsePositiveRate: 2.1,
    truePositiveRate: 97.8,
    responseTime: 1.2,
  };

  const financialImpact = {
    costSavings: 28550000, // Total from all security rules (255 attacks blocked)
    breachPrevention: 13050000, // Command & Control attacks (highest impact)
    complianceSavings: 890000,
    // Realistic security investment breakdown
    edrLicensing: 56940, // 2,847 endpoints × $20/year
    implementation: 100000, // Professional services + training
    annualOperations: 480000, // SOC analysts + infrastructure
    totalInvestment: 636940, // Year 1 total investment
    netBenefit: 27913060, // costSavings - totalInvestment
    roi: 4383, // (netBenefit / totalInvestment) × 100
  };

  const threatMetrics = {
    alertsToday: 156,
    criticalAlerts: 8,
    mitigatedThreats: 41,
    activeInvestigations: 3,
  };

  // Security Control Categories with their respective rules
  const securityCategories: Record<string, SecurityCategory> = {
    edr: {
      name: "Endpoint Detection & Response (EDR)",
      icon: <Shield className="w-5 h-5" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      rules: [
        {
          id: "CS-001",
          name: "MALICIOUS EXECUTABLE DETECTION",
          platform: "CrowdStrike Falcon",
          performance: 98.1,
          truePositives: 12,
          falsePositives: 2,
          costSaved: 2400000, // $200K per incident × 12 blocked (based on actual malware incidents)
          alerts: 12,
          mitreTactic: "Malware Detection",
          fileTypes: [".exe", ".dll", ".bat", ".ps1"],
          threatActors: ["APT29 (Cozy Bear)", "Lazarus Group", "APT28 (Fancy Bear)"],
          mitigationActions: ["Quarantine", "Block Execution", "Alert SOC"],
          businessUnits: [
            { name: "Finance & Banking", attacks: 4, riskLevel: "High", costSaved: 800000 },
            { name: "IT & Infrastructure", attacks: 3, riskLevel: "High", costSaved: 600000 },
            { name: "Human Resources", attacks: 2, riskLevel: "Medium", costSaved: 400000 },
            { name: "Marketing", attacks: 2, riskLevel: "Low", costSaved: 400000 },
            { name: "Legal & Compliance", attacks: 1, riskLevel: "Medium", costSaved: 200000 }
          ],
          attackCosts: {
            averageBreachCost: 200000, // Based on actual malware incident costs
            dataTheftCost: 250000,     // Data exfiltration + notification
            systemRecoveryCost: 150000, // IT recovery + system restoration
            businessDisruptionCost: 120000, // Downtime + productivity loss
            regulatoryFines: 180000,   // GDPR, HIPAA compliance fines
            reputationDamage: 350000   // Brand damage + customer trust loss
          },
          threatIntelligence: {
            primaryGroups: ["APT29", "Lazarus Group", "APT28"],
            attackVectors: ["Spearphishing", "Watering Hole", "Supply Chain"],
            targetIndustries: ["Financial Services", "Healthcare", "Government"],
            recentCampaigns: ["SolarWinds", "NotPetya", "WannaCry"],
            iocPatterns: ["C2 domains", "Malware families", "TTPs"]
          }
        },
        {
          id: "CS-002",
          name: "SUSPICIOUS PROCESS CREATION",
          platform: "CrowdStrike Falcon",
          performance: 96.4,
          truePositives: 8,
          falsePositives: 3,
          costSaved: 1600000, // $200K per incident × 8 blocked
          alerts: 8,
          mitreTactic: "Process Monitoring",
          fileTypes: [".exe", ".scr", ".com"],
          threatActors: ["FIN7", "Carbanak", "APT1"],
          mitigationActions: ["Terminate Process", "Block Parent", "Isolate Host"],
          businessUnits: [
            { name: "Finance & Banking", attacks: 3, riskLevel: "High", costSaved: 600000 },
            { name: "IT & Infrastructure", attacks: 2, riskLevel: "High", costSaved: 400000 },
            { name: "Customer Service", attacks: 2, riskLevel: "Low", costSaved: 400000 },
            { name: "Retail Operations", attacks: 1, riskLevel: "Medium", costSaved: 200000 }
          ],
          attackCosts: {
            averageBreachCost: 200000, // Process injection attacks
            dataTheftCost: 250000,     // Sensitive data access
            systemRecoveryCost: 150000, // Process cleanup + security
            businessDisruptionCost: 120000, // System instability
            regulatoryFines: 180000,   // Compliance violations
            reputationDamage: 350000   // Trust erosion
          },
          threatIntelligence: {
            primaryGroups: ["FIN7", "Carbanak", "APT1"],
            attackVectors: ["Point of Sale", "Banking Trojans", "RATs"],
            targetIndustries: ["Retail", "Banking", "Hospitality"],
            recentCampaigns: ["Dridex", "Cobalt Strike", "Emotet"],
            iocPatterns: ["Process injection", "Memory manipulation", "Lateral movement"]
          }
        },
        {
          id: "CS-003",
          name: "MEMORY INJECTION DETECTION",
          platform: "CrowdStrike Falcon",
          performance: 98.0,
          truePositives: 6,
          falsePositives: 1,
          costSaved: 1200000, // $200K per incident × 6 blocked
          alerts: 6,
          mitreTactic: "Memory Protection",
          fileTypes: [".dll", ".sys", "memory"],
          threatActors: ["APT28 (Fancy Bear)", "Cozy Bear", "APT1"],
          mitigationActions: ["Block Injection", "Kill Process", "Memory Scan"],
          businessUnits: [
            { name: "IT & Infrastructure", attacks: 2, riskLevel: "High", costSaved: 400000 },
            { name: "Finance & Banking", attacks: 2, riskLevel: "High", costSaved: 400000 },
            { name: "Research & Development", attacks: 1, riskLevel: "Medium", costSaved: 200000 },
            { name: "Legal & Compliance", attacks: 1, riskLevel: "Medium", costSaved: 200000 }
          ],
          attackCosts: {
            averageBreachCost: 200000, // Advanced persistent threats
            dataTheftCost: 300000,     // High-value data extraction
            systemRecoveryCost: 180000, // Complex memory cleanup
            businessDisruptionCost: 150000, // Extended investigation
            regulatoryFines: 200000,   // Severe compliance issues
            reputationDamage: 400000   // Significant brand impact
          },
          threatIntelligence: {
            primaryGroups: ["APT28", "APT29", "APT1"],
            attackVectors: ["Process Hollowing", "DLL Injection", "Code Injection"],
            targetIndustries: ["Defense", "Energy", "Telecommunications"],
            recentCampaigns: ["X-Agent", "Sednit", "Fancy Bear"],
            iocPatterns: ["Memory artifacts", "Injection techniques", "Evasion methods"]
          }
        },
        {
          id: "CS-004",
          name: "COMMAND & CONTROL DETECTION",
          platform: "CrowdStrike Falcon",
          performance: 95.6,
          truePositives: 87,
          falsePositives: 4,
          costSaved: 13050000, // $150K per incident × 87 blocked
          alerts: 87,
          mitreTactic: "Network Protection",
          fileTypes: [".exe", ".dll", "network"],
          threatActors: ["APT38", "Fancy Bear", "Lazarus Group"],
          mitigationActions: ["Block Connection", "Quarantine", "Network Isolation"],
          businessUnits: [
            { name: "Finance & Banking", attacks: 38, riskLevel: "High", costSaved: 5700000 },
            { name: "IT & Infrastructure", attacks: 25, riskLevel: "High", costSaved: 3750000 },
            { name: "Marketing", attacks: 15, riskLevel: "Medium", costSaved: 2250000 },
            { name: "Sales", attacks: 9, riskLevel: "Low", costSaved: 1350000 }
          ],
          attackCosts: {
            averageBreachCost: 150000,
            dataTheftCost: 180000,
            systemRecoveryCost: 120000,
            businessDisruptionCost: 90000,
            regulatoryFines: 200000,
            reputationDamage: 500000
          },
          threatIntelligence: {
            primaryGroups: ["APT38", "APT28", "Lazarus Group"],
            attackVectors: ["C2 Servers", "DNS Tunneling", "HTTPS Tunneling"],
            targetIndustries: ["Banking", "SWIFT", "Cryptocurrency"],
            recentCampaigns: ["SWIFT Attacks", "Banking Trojans", "Cryptojacking"],
            iocPatterns: ["C2 domains", "Network traffic", "Protocol analysis"]
          }
        },
        {
          id: "CS-005",
          name: "RANSOMWARE BEHAVIOR DETECTION",
          platform: "CrowdStrike Falcon",
          performance: 98.7,
          truePositives: 3,
          falsePositives: 1,
          costSaved: 900000, // $300K per incident × 3 blocked (ransomware is expensive)
          alerts: 3,
          mitreTactic: "Ransomware Protection",
          fileTypes: [".exe", ".dll", ".vbs"],
          threatActors: ["REvil", "Conti", "LockBit"],
          mitigationActions: ["Stop Encryption", "Restore Files", "Block Ransomware"],
          businessUnits: [
            { name: "IT & Infrastructure", attacks: 1, riskLevel: "High", costSaved: 300000 },
            { name: "Finance & Banking", attacks: 1, riskLevel: "High", costSaved: 300000 },
            { name: "Manufacturing", attacks: 1, riskLevel: "Medium", costSaved: 300000 }
          ],
          attackCosts: {
            averageBreachCost: 300000, // Ransomware incidents are very expensive
            ransomDemand: 500000,      // Average ransom payment
            systemRecoveryCost: 250000, // Complete system restoration
            businessDisruptionCost: 400000, // Extended downtime
            regulatoryFines: 150000,   // Incident reporting requirements
            reputationDamage: 500000   // Severe brand damage
          },
          threatIntelligence: {
            primaryGroups: ["REvil", "Conti", "LockBit"],
            attackVectors: ["RDP", "Phishing", "Exploit Kits"],
            targetIndustries: ["Healthcare", "Manufacturing", "Education"],
            recentCampaigns: ["Kaseya", "Colonial Pipeline", "JBS Foods"],
            iocPatterns: ["Ransomware families", "Encryption patterns", "Payment demands"]
          }
        },
        {
          id: "CS-006",
          name: "CREDENTIAL THEFT DETECTION",
          platform: "CrowdStrike Falcon",
          performance: 97.2,
          truePositives: 7,
          falsePositives: 2,
          costSaved: 1400000, // $200K per incident × 7 blocked
          alerts: 7,
          mitreTactic: "Credential Access",
          fileTypes: [".exe", ".dll", "memory"],
          threatActors: ["APT1", "Mimikatz", "APT29"],
          mitigationActions: ["Block Process", "Alert SOC", "Isolate Endpoint"],
          businessUnits: [
            { name: "IT & Infrastructure", attacks: 2, riskLevel: "High", costSaved: 400000 },
            { name: "Finance & Banking", attacks: 2, riskLevel: "High", costSaved: 400000 },
            { name: "Legal & Compliance", attacks: 2, riskLevel: "Medium", costSaved: 400000 },
            { name: "Human Resources", attacks: 1, riskLevel: "Medium", costSaved: 200000 }
          ],
          attackCosts: {
            averageBreachCost: 200000, // Credential compromise
            credentialCompromise: 250000, // Password reset + security overhaul
            lateralMovementCost: 200000, // Network-wide access review
            privilegeEscalationCost: 150000, // Access control remediation
            regulatoryFines: 180000,   // Compliance violations
            reputationDamage: 300000   // Trust in access controls
          },
          threatIntelligence: {
            primaryGroups: ["APT1", "APT29", "APT28"],
            attackVectors: ["Mimikatz", "LSASS Dumping", "Pass the Hash"],
            targetIndustries: ["Government", "Technology", "Defense"],
            recentCampaigns: ["SolarWinds", "Microsoft Exchange", "Log4Shell"],
            iocPatterns: ["Credential dumping", "Hash extraction", "Token manipulation"]
          }
        },
      ]
    },
    email: {
      name: "Email Security",
      icon: <Mail className="w-5 h-5" />,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      rules: [
        {
          id: "ES-001",
          name: "PHISHING EMAIL DETECTION",
          platform: "Microsoft Defender",
          performance: 96.8,
          truePositives: 45,
          falsePositives: 8,
          costSaved: 2250000, // $50K per incident × 45 blocked
          alerts: 45,
          mitreTactic: "Phishing Detection",
          fileTypes: [".html", ".pdf", ".docx"],
          threatActors: ["APT29", "FIN7", "Lazarus Group"],
          mitigationActions: ["Quarantine Email", "Block Sender", "Alert User"],
          businessUnits: [
            { name: "Finance & Banking", attacks: 18, riskLevel: "High", costSaved: 900000 },
            { name: "Human Resources", attacks: 12, riskLevel: "High", costSaved: 600000 },
            { name: "Executive Office", attacks: 8, riskLevel: "Critical", costSaved: 400000 },
            { name: "Legal & Compliance", attacks: 7, riskLevel: "Medium", costSaved: 350000 }
          ],
          attackCosts: {
            averageBreachCost: 50000, // Phishing incident costs
            credentialTheftCost: 75000, // Account compromise
            dataBreachCost: 100000,   // Sensitive data exposure
            businessDisruptionCost: 25000, // Productivity loss
            regulatoryFines: 50000,   // Compliance violations
            reputationDamage: 100000  // Trust erosion
          },
          threatIntelligence: {
            primaryGroups: ["APT29", "FIN7", "Lazarus Group"],
            attackVectors: ["Spearphishing", "Whaling", "Business Email Compromise"],
            targetIndustries: ["Financial Services", "Healthcare", "Government"],
            recentCampaigns: ["Microsoft 365", "Zoom", "COVID-19"],
            iocPatterns: ["Phishing domains", "Malicious attachments", "Social engineering"]
          }
        },
        {
          id: "ES-002",
          name: "MALICIOUS ATTACHMENT DETECTION",
          platform: "Microsoft Defender",
          performance: 97.5,
          truePositives: 15,
          falsePositives: 2,
          costSaved: 750000, // $50K per incident × 15 blocked
          alerts: 15,
          mitreTactic: "Malware Delivery",
          fileTypes: [".exe", ".doc", ".xls", ".pdf"],
          threatActors: ["APT28", "Emotet", "TrickBot"],
          mitigationActions: ["Block Attachment", "Scan File", "Alert SOC"],
          businessUnits: [
            { name: "IT & Infrastructure", attacks: 6, riskLevel: "High", costSaved: 300000 },
            { name: "Finance & Banking", attacks: 5, riskLevel: "High", costSaved: 250000 },
            { name: "Marketing", attacks: 3, riskLevel: "Medium", costSaved: 150000 },
            { name: "Sales", attacks: 1, riskLevel: "Low", costSaved: 50000 }
          ],
          attackCosts: {
            averageBreachCost: 50000, // Malicious attachment costs
            malwareInfectionCost: 80000, // System compromise
            dataExfiltrationCost: 60000, // Data theft
            systemRecoveryCost: 40000, // Cleanup and restoration
            regulatoryFines: 30000,   // Compliance issues
            reputationDamage: 70000   // Brand impact
          },
          threatIntelligence: {
            primaryGroups: ["APT28", "Emotet", "TrickBot"],
            attackVectors: ["Macro-enabled documents", "Executable attachments", "PDF exploits"],
            targetIndustries: ["Technology", "Manufacturing", "Healthcare"],
            recentCampaigns: ["Emotet", "TrickBot", "QakBot"],
            iocPatterns: ["Malicious macros", "Obfuscated code", "C2 communication"]
          }
        },
        {
          id: "ES-003",
          name: "BUSINESS EMAIL COMPROMISE DETECTION",
          platform: "Microsoft Defender",
          performance: 98.2,
          truePositives: 8,
          falsePositives: 1,
          costSaved: 800000, // $100K per incident × 8 blocked (BEC is expensive)
          alerts: 8,
          mitreTactic: "Social Engineering",
          fileTypes: [".html", ".txt", "email"],
          threatActors: ["APT29", "FIN7", "Lazarus Group"],
          mitigationActions: ["Quarantine Email", "Block Domain", "Alert Executives"],
          businessUnits: [
            { name: "Executive Office", attacks: 3, riskLevel: "Critical", costSaved: 300000 },
            { name: "Finance & Banking", attacks: 3, riskLevel: "High", costSaved: 300000 },
            { name: "Legal & Compliance", attacks: 2, riskLevel: "High", costSaved: 200000 }
          ],
          attackCosts: {
            averageBreachCost: 100000, // BEC incidents are very expensive
            dataBreachCost: 150000,   // Sensitive executive data
            businessDisruptionCost: 80000, // Executive productivity loss
            regulatoryFines: 120000,  // Compliance violations
            reputationDamage: 200000, // Executive trust impact
            legalLiabilityCost: 150000 // Legal consequences
          },
          threatIntelligence: {
            primaryGroups: ["APT29", "FIN7", "Lazarus Group"],
            attackVectors: ["CEO Fraud", "Invoice Fraud", "W-2 Scams"],
            targetIndustries: ["Financial Services", "Healthcare", "Technology"],
            recentCampaigns: ["Microsoft 365", "Zoom", "COVID-19"],
            iocPatterns: ["Spoofed domains", "Social engineering", "Urgency tactics"]
          }
        }
      ]
    },
    network: {
      name: "Network Security",
      icon: <Globe className="w-5 h-5" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      rules: [
        {
          id: "NS-001",
          name: "INTRUSION DETECTION",
          platform: "Cisco FirePOWER",
          performance: 94.2,
          truePositives: 18,
          falsePositives: 5,
          costSaved: 1800000, // $100K per incident × 18 blocked
          alerts: 18,
          mitreTactic: "Network Intrusion",
          fileTypes: ["network", "packets"],
          threatActors: ["APT1", "APT28", "Lazarus Group"],
          mitigationActions: ["Block IP", "Drop Traffic", "Alert SOC"],
          businessUnits: [
            { name: "IT & Infrastructure", attacks: 8, riskLevel: "High", costSaved: 800000 },
            { name: "Finance & Banking", attacks: 6, riskLevel: "High", costSaved: 600000 },
            { name: "Research & Development", attacks: 4, riskLevel: "Medium", costSaved: 400000 }
          ],
          attackCosts: {
            averageBreachCost: 100000, // Network intrusion costs
            dataBreachCost: 150000,   // Sensitive data exposure
            systemCompromiseCost: 120000, // Network access
            businessDisruptionCost: 80000, // Service interruption
            regulatoryFines: 100000,  // Compliance violations
            reputationDamage: 200000  // Trust impact
          },
          threatIntelligence: {
            primaryGroups: ["APT1", "APT28", "Lazarus Group"],
            attackVectors: ["SQL Injection", "DDoS", "Man-in-the-Middle"],
            targetIndustries: ["Technology", "Financial Services", "Healthcare"],
            recentCampaigns: ["SolarWinds", "Microsoft Exchange", "Log4Shell"],
            iocPatterns: ["Suspicious IPs", "Anomalous traffic", "Protocol violations"]
          }
        }
      ]
    },
    web: {
      name: "Web Application Security",
      icon: <Lock className="w-5 h-5" />,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      rules: [
        {
          id: "WS-001",
          name: "WEB APPLICATION FIREWALL",
          platform: "Cloudflare",
          performance: 95.8,
          truePositives: 34,
          falsePositives: 6,
          costSaved: 1700000, // $50K per incident × 34 blocked
          alerts: 34,
          mitreTactic: "Web Application Attack",
          fileTypes: ["http", "https", "api"],
          threatActors: ["APT29", "FIN7", "Anonymous"],
          mitigationActions: ["Block Request", "Rate Limit", "Alert Dev Team"],
          businessUnits: [
            { name: "E-commerce", attacks: 15, riskLevel: "High", costSaved: 750000 },
            { name: "Customer Portal", attacks: 12, riskLevel: "High", costSaved: 600000 },
            { name: "Internal Apps", attacks: 7, riskLevel: "Medium", costSaved: 350000 }
          ],
                     attackCosts: {
             averageBreachCost: 50000, // Web application attack costs
             dataBreachCost: 80000,   // Customer data exposure
             serviceDisruptionCost: 60000, // Application downtime
             complianceViolationCost: 40000, // Regulatory issues
             customerTrustCost: 90000, // Brand reputation
             legalLiabilityCost: 70000, // Legal consequences
             regulatoryFines: 50000,   // Compliance violations
             reputationDamage: 100000  // Brand damage
           },
          threatIntelligence: {
            primaryGroups: ["APT29", "FIN7", "Anonymous"],
            attackVectors: ["SQL Injection", "XSS", "CSRF", "DDoS"],
            targetIndustries: ["E-commerce", "Financial Services", "Healthcare"],
            recentCampaigns: ["Magecart", "Card Skimming", "API Abuse"],
            iocPatterns: ["Malicious payloads", "Suspicious requests", "Bot traffic"]
          }
        }
      ]
    },
    cloud: {
      name: "Cloud Security",
      icon: <Monitor className="w-5 h-5" />,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      rules: [
        {
          id: "CS-001",
          name: "CLOUD ACCESS MONITORING",
          platform: "AWS GuardDuty",
          performance: 93.1,
          truePositives: 12,
          falsePositives: 4,
          costSaved: 600000, // $50K per incident × 12 blocked
          alerts: 12,
          mitreTactic: "Cloud Security",
          fileTypes: ["api", "logs", "config"],
          threatActors: ["APT29", "APT28", "Cloud Hopper"],
          mitigationActions: ["Revoke Access", "Update Policies", "Alert Admin"],
          businessUnits: [
            { name: "Cloud Infrastructure", attacks: 6, riskLevel: "High", costSaved: 300000 },
            { name: "DevOps", attacks: 4, riskLevel: "Medium", costSaved: 200000 },
            { name: "Data Analytics", attacks: 2, riskLevel: "Medium", costSaved: 100000 }
          ],
                     attackCosts: {
             averageBreachCost: 50000, // Cloud security incident costs
             dataExfiltrationCost: 80000, // Cloud data theft
             serviceAbuseCost: 40000,   // Resource abuse
             complianceViolationCost: 60000, // Cloud compliance
             reputationDamageCost: 70000, // Trust in cloud services
             operationalDisruptionCost: 30000, // Service interruption
             regulatoryFines: 50000,   // Compliance violations
             reputationDamage: 80000   // Brand damage
           },
          threatIntelligence: {
            primaryGroups: ["APT29", "APT28", "Cloud Hopper"],
            attackVectors: ["Credential Compromise", "API Abuse", "Misconfiguration"],
            targetIndustries: ["Technology", "Financial Services", "Healthcare"],
            recentCampaigns: ["SolarWinds", "Microsoft Exchange", "Cloud Hopper"],
            iocPatterns: ["Suspicious API calls", "Anomalous access patterns", "Configuration drift"]
          }
        }
      ]
    }
  };

  // Calculate totals for all categories
  const getAllRules = () => {
    return Object.values(securityCategories).flatMap(category => category.rules);
  };

  const allRules = getAllRules();
  const totalAttacksBlocked = allRules.reduce((sum, rule) => sum + rule.truePositives, 0);
  const totalCostSaved = allRules.reduce((sum, rule) => sum + rule.costSaved, 0);

  // Filter rules based on selected category
  const getFilteredRules = () => {
    if (selectedCategory === "all") {
      return allRules;
    }
    return securityCategories[selectedCategory]?.rules || [];
  };

  const filteredRules = getFilteredRules();

  // Calculate top 3 business units affected by true positive alerts
  const getTopBusinessUnits = () => {
    const businessUnitStats = new Map<string, { attacks: number; costSaved: number; riskLevel: string }>();
    
    allRules.forEach(rule => {
      rule.businessUnits.forEach(unit => {
        const existing = businessUnitStats.get(unit.name);
        if (existing) {
          existing.attacks += unit.attacks;
          existing.costSaved += unit.costSaved;
          // Keep the highest risk level
          if (unit.riskLevel === "Critical" || 
              (unit.riskLevel === "High" && existing.riskLevel !== "Critical") ||
              (unit.riskLevel === "Medium" && existing.riskLevel === "Low")) {
            existing.riskLevel = unit.riskLevel;
          }
        } else {
          businessUnitStats.set(unit.name, {
            attacks: unit.attacks,
            costSaved: unit.costSaved,
            riskLevel: unit.riskLevel
          });
        }
      });
    });
    
    return Array.from(businessUnitStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.attacks - a.attacks)
      .slice(0, 3);
  };

  const topBusinessUnits = getTopBusinessUnits();

  return (
    <div className="p-6 space-y-6 overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SECURITY OPERATIONS DASHBOARD</h1>
          <p className="text-sm text-neutral-400">Real-time threat detection and financial impact analysis</p>
        </div>
      </div>



             {/* ROI Analysis */}
       <Card className="bg-neutral-900 border-neutral-700 h-fit">
         <CardHeader className="pb-3">
           <CardTitle className="text-white text-lg">ROI ANALYSIS</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="text-center">
               <p className="text-xs text-neutral-400 tracking-wider">TOTAL COST SAVINGS</p>
               <p className="text-2xl font-bold text-green-500 font-mono">${(totalCostSaved / 1000000).toFixed(1)}M</p>
               <p className="text-xs text-neutral-500">annual cost avoidance</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-neutral-400 tracking-wider">TOTAL INVESTMENT</p>
               <p className="text-2xl font-bold text-blue-400 font-mono">${(financialImpact.totalInvestment / 1000).toFixed(0)}K</p>
               <p className="text-xs text-neutral-500">annual security spend</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-neutral-400 tracking-wider">NET BENEFIT</p>
               <p className="text-2xl font-bold text-orange-400 font-mono">${(financialImpact.netBenefit / 1000000).toFixed(1)}M</p>
               <p className="text-xs text-neutral-500">savings minus investment</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-neutral-400 tracking-wider">ROI</p>
               <p className="text-2xl font-bold text-purple-400 font-mono">{financialImpact.roi}%</p>
               <p className="text-xs text-neutral-500">return on investment</p>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Top 3 Business Units Affected */}
       <Card className="bg-neutral-900 border-neutral-700">
         <CardHeader className="pb-3">
           <CardTitle className="text-white text-lg">TOP 3 BUSINESS UNITS AFFECTED</CardTitle>
           <p className="text-sm text-neutral-400">Business units with the highest number of true positive attacks blocked</p>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {topBusinessUnits.map((unit, index) => (
               <div key={unit.name} className="relative p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                 {/* Ranking Badge */}
                 <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                   #{index + 1}
                 </div>
                 
                 <div className="mt-2">
                   <h4 className="text-lg font-bold text-white mb-2">{unit.name}</h4>
                   
                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-neutral-400">Attacks Blocked:</span>
                       <span className="text-2xl font-bold text-orange-400 font-mono">{unit.attacks}</span>
                     </div>
                     
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-neutral-400">Cost Saved:</span>
                       <span className="text-lg font-bold text-green-500 font-mono">${(unit.costSaved / 1000000).toFixed(1)}M</span>
                     </div>
                     
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-neutral-400">Risk Level:</span>
                       <Badge 
                         variant="outline" 
                         className={`text-xs ${
                           unit.riskLevel === "Critical" 
                             ? "bg-red-500/10 border-red-500/30 text-red-400"
                             : unit.riskLevel === "High"
                             ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                             : unit.riskLevel === "Medium"
                             ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                             : "bg-green-500/10 border-green-500/30 text-green-400"
                         }`}
                       >
                         {unit.riskLevel} Risk
                       </Badge>
                     </div>
                   </div>
                   
                   {/* Progress bar showing relative impact */}
                   <div className="mt-4">
                     <div className="flex justify-between text-xs text-neutral-400 mb-1">
                       <span>Impact Level</span>
                       <span>{Math.round((unit.attacks / topBusinessUnits[0].attacks) * 100)}%</span>
                     </div>
                     <Progress 
                       value={(unit.attacks / topBusinessUnits[0].attacks) * 100} 
                       className="h-2 bg-neutral-700"
                     />
                   </div>
                 </div>
               </div>
             ))}
           </div>
           
           {/* Summary Stats */}
           <div className="mt-6 pt-4 border-t border-neutral-700">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
               <div>
                 <p className="text-xs text-neutral-400 tracking-wider">TOTAL ATTACKS BLOCKED</p>
                 <p className="text-xl font-bold text-white font-mono">
                   {topBusinessUnits.reduce((sum, unit) => sum + unit.attacks, 0)}
                 </p>
                 <p className="text-xs text-neutral-500">across top 3 units</p>
               </div>
               <div>
                 <p className="text-xs text-neutral-400 tracking-wider">TOTAL COST SAVED</p>
                 <p className="text-xl font-bold text-green-500 font-mono">
                   ${(topBusinessUnits.reduce((sum, unit) => sum + unit.costSaved, 0) / 1000000).toFixed(1)}M
                 </p>
                 <p className="text-xs text-neutral-500">across top 3 units</p>
               </div>
               <div>
                 <p className="text-xs text-neutral-400 tracking-wider">AVERAGE RISK LEVEL</p>
                 <p className="text-xl font-bold text-orange-400 font-mono">
                   {topBusinessUnits.filter(u => u.riskLevel === "High" || u.riskLevel === "Critical").length > 1 ? "High" : "Medium"}
                 </p>
                 <p className="text-xs text-neutral-500">risk assessment</p>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>

             {/* EXECUTIVE SECURITY OVERVIEW */}
       <Card className="bg-neutral-900 border-neutral-700">
         <CardHeader className="pb-3">
           <div className="flex items-center justify-between">
             <div>
               <CardTitle className="text-white text-xl font-bold tracking-wide">SECURITY INVESTMENT ROI</CardTitle>
               <p className="text-sm text-neutral-400 mt-1">Executive Summary: 30-Second Overview</p>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs text-green-400 font-medium">SECURE</span>
             </div>
           </div>
         </CardHeader>
         <CardContent>
            {/* Executive KPIs - 3 Key Metrics Only */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                                 <div className="text-3xl font-bold text-white font-mono">${(totalCostSaved / 1000000).toFixed(1)}M</div>
                 <div className="text-sm text-green-400 font-medium mb-1">Total Cost Avoided</div>
                 <div className="text-xs text-neutral-400">ROI: 4,383% on security investment</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                                 <div className="text-3xl font-bold text-white font-mono">{totalAttacksBlocked}</div>
                 <div className="text-sm text-blue-400 font-medium mb-1">High Impact Threats Blocked</div>
                 <div className="text-xs text-neutral-400">97.8% success rate</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <Target className="w-6 h-6 text-purple-400" />
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-white font-mono">23</div>
                <div className="text-sm text-purple-400 font-medium mb-1">Critical Incidents</div>
                <div className="text-xs text-neutral-400">-15% vs last month</div>
              </div>
            </div>

            

            {/* Executive Action Items */}
            <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-5">
              <h4 className="text-lg font-bold text-white mb-3">EXECUTIVE SUMMARY</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="text-white font-medium mb-1">Investment Paying Off</div>
                    <div className="text-neutral-400 text-xs leading-relaxed">
                      Security tools prevented $28.6M in potential losses with 4,383% ROI
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="text-white font-medium mb-1">Finance Department</div>
                    <div className="text-neutral-400 text-xs leading-relaxed">
                      Primary target with 38 attacks blocked, highest risk exposure
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>
      
      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
}
