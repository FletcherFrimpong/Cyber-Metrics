"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import edrDataService from "@/lib/edr-data-service"
import { calculateCostMetrics, calculateCostSavingsFromEDRAlerts, formatCurrency } from "@/lib/cost-calculations"
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Target, 
  BarChart3,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Server,
  Database,
  Smartphone
} from "lucide-react"

export default function ExecutiveReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState("Q4 2024")
  const [selectedMetric, setSelectedMetric] = useState("overview")
  const [analysisPeriod, setAnalysisPeriod] = useState<"quarterly" | "yearly" | "monthly">("quarterly")

  // Helper to parse quarter string e.g., "Q2 2025"
  const parseQuarter = (qstr: string) => {
    const [q, y] = qstr.split(" ");
    return { q: parseInt(q.replace("Q", ""), 10), y: parseInt(y, 10) };
  };



  const [quarterlyMetrics, setQuarterlyMetrics] = useState({
    quarter: "Q4 2024",
    period: "October 1 - December 31, 2024",
    totalCostSavings: 0,
    roi: 0,
    breachesPreventedValue: 0,
    complianceSavings: 0,
    totalSecurityIncidents: 0,
    criticalIncidents: 0,
    resolvedIncidents: 0,
    avgResolutionTime: "2.3 hours",
    securityScore: 94.2,
  });

  // Security Metrics for Board Presentation - Dynamic based on analysis period
  useEffect(() => {
    const loadSecurityMetrics = async () => {
      try {
        const baseIncidents = 1247;
        const baseCriticalIncidents = 23;
        const baseResolvedIncidents = 1189;
        
        // Scale incidents based on period
        let incidentScale = 1;
        if (analysisPeriod === "yearly") {
          incidentScale = 4; // 4 quarters in a year
        } else if (analysisPeriod === "quarterly") {
          incidentScale = 1; // Already per-quarter baseline
        } else if (analysisPeriod === "monthly") {
          incidentScale = 1 / 3; // One third of a quarter
        }
        
        // Get quarter display info
        const { q, y } = parseQuarter(selectedQuarter);
        const quarterDisplay = analysisPeriod === "quarterly" ? `Q${q} ${y}` : analysisPeriod === "yearly" ? `${y}` : "December 2024";
        
        // Get period display info
        const getPeriodDisplay = () => {
          if (analysisPeriod === "yearly") return `January 1 - December 31, ${y}`;
          if (analysisPeriod === "monthly") return "December 1 - December 31, 2024";
          
          // For quarterly, calculate the actual quarter period
          const quarterStartMonths = ["January", "April", "July", "October"];
          const quarterEndMonths = ["March", "June", "September", "December"];
          const startMonth = quarterStartMonths[q - 1];
          const endMonth = quarterEndMonths[q - 1];
          return `${startMonth} 1 - ${endMonth} 31, ${y}`;
        };

        const settingsRes = await fetch("/api/settings").catch(() => null);
        const settings = settingsRes ? await settingsRes.json() : {};
        const investment = settings.investmentAmount || 0;

        const totalCostSavings = await calculateCostSavingsFromEDRAlerts({ period: analysisPeriod, selectedQuarter, investmentAmount: investment });
        const costMetrics = await calculateCostMetrics({ period: analysisPeriod, selectedQuarter, investmentAmount: investment });
        
        setQuarterlyMetrics({
          quarter: quarterDisplay,
          period: getPeriodDisplay(),
          totalCostSavings,
          roi: costMetrics.roi,
          breachesPreventedValue: Math.round(totalCostSavings * 6.4),
          complianceSavings: Math.round(totalCostSavings * 0.36),
          totalSecurityIncidents: Math.round(baseIncidents * incidentScale),
          criticalIncidents: Math.round(baseCriticalIncidents * incidentScale),
          resolvedIncidents: Math.round(baseResolvedIncidents * incidentScale),
          avgResolutionTime: "2.3 hours",
          securityScore: 94.2,
        });
      } catch (error) {
        console.error('Failed to load security metrics:', error);
      }
    };

    loadSecurityMetrics();
  }, [analysisPeriod, selectedQuarter]);

  // Security Tool Metrics by Category - Dynamic based on analysis period
  const getSecurityToolMetrics = (period: "quarterly" | "yearly" | "monthly") => {
    // Scale metrics based on period
    let scale = 1;
    if (period === "yearly") {
      scale = 4; // 4 quarters in a year
    } else if (period === "quarterly") {
      scale = 1; // Already per-quarter baseline
    } else if (period === "monthly") {
      scale = 1 / 3; // One third of a quarter
    }

            return {
      antivirus: {
        name: "Antivirus Protection",
        icon: Shield,
        metrics: {
          totalScans: Math.round(1847000 * scale),
          threatsDetected: Math.round(2347 * scale),
          threatsQuarantined: Math.round(2347 * scale),
          quarantineRate: 100,
          ransomwareAttempts: Math.round(156 * scale),
          zeroDayThreats: Math.round(23 * scale),
          avgScanTime: "45 seconds",
          costSaved: Math.round(3800000 * scale),
        },
        status: "excellent"
      },
          endpointProtection: {
        name: "Endpoint Protection",
        icon: Smartphone,
        metrics: {
          totalEndpoints: 2847,
          compromisedEndpoints: 0,
          protectionRate: 100,
          suspiciousActivities: Math.round(456 * scale),
          quarantinedFiles: Math.round(234 * scale),
          avgResponseTime: "2.1 minutes",
          costSaved: 0, // Will be calculated asynchronously
          truePositiveAlerts: Math.round(quarterlyMetrics.totalSecurityIncidents * 0.36 * scale),
          totalAlerts: Math.round(quarterlyMetrics.totalSecurityIncidents * scale),
        },
        status: "excellent"
      },
          identityAccess: {
        name: "Identity & Access Management",
        icon: Users,
        metrics: {
          totalUsers: 2847,
          failedLogins: Math.round(1234 * scale),
          suspiciousLogins: Math.round(89 * scale),
          mfaEnabled: 100,
          privilegedAccess: Math.round(234 * scale),
          avgAuthTime: "3.2 seconds",
          costSaved: Math.round(2800000 * scale),
        },
        status: "good"
      },
          dataProtection: {
        name: "Data Protection & Encryption",
        icon: Database,
        metrics: {
          encryptedData: 99.8,
          dataBreaches: 0,
          encryptionAlerts: Math.round(156 * scale),
          complianceScore: 98.5,
          auditFindings: 0,
          avgEncryptionTime: "0.5 seconds",
          costSaved: Math.round(5400000 * scale),
        },
        status: "excellent"
      },
    
          intrusionDetection: {
        name: "Intrusion Detection System",
        icon: AlertTriangle,
        metrics: {
          totalEvents: Math.round(1247000 * scale),
          alertsGenerated: Math.round(2347 * scale),
          truePositives: Math.round(2234 * scale),
          falsePositives: Math.round(113 * scale),
          detectionRate: 95.2,
          avgResponseTime: "1.8 minutes",
          costSaved: Math.round(3600000 * scale),
        },
        status: "good"
      },
          siem: {
        name: "Security Information & Event Management",
        icon: Server,
        metrics: {
          totalLogs: Math.round(28470000 * scale),
          correlatedEvents: Math.round(12470 * scale),
          incidentsCreated: Math.round(2347 * scale),
          automatedResponses: Math.round(1890 * scale),
          avgProcessingTime: "0.5 seconds",
          costSaved: Math.round(4100000 * scale),
        },
        status: "excellent"
      },
          vulnerabilityManagement: {
        name: "Vulnerability Management",
        icon: CheckCircle,
        metrics: {
          totalAssets: 2847,
          vulnerabilitiesFound: Math.round(456 * scale),
          criticalVulns: Math.round(23 * scale),
          patchedVulns: Math.round(423 * scale),
          patchRate: 92.8,
          avgPatchTime: "3.2 days",
          costSaved: Math.round(2700000 * scale),
        },
        status: "good"
      },
    
    mobileSecurity: {
      name: "Mobile Device Management",
      icon: Smartphone,
      metrics: {
        managedDevices: 1847,
        compliantDevices: 1823,
        complianceRate: 98.7,
        securityIncidents: 24,
        avgEnforcementTime: "2.3 minutes",
        costSaved: Math.round(1800000 * scale),
      },
      status: "excellent"
    }
  };
  };

  const securityToolMetrics = getSecurityToolMetrics(analysisPeriod);

  // Threat Intelligence Metrics
  const threatIntelligence = {
    totalThreats: 1247,
    criticalThreats: 23,
    mitigatedThreats: 1247,
    threatSources: {
      external: 892,
      internal: 234,
      thirdParty: 121
    },
    threatTypes: {
      emailThreats: 1247,
      malwareThreats: 2347,
      networkAttacks: 45678,
      endpointThreats: 456,
      unauthorizedAccess: 1234,
      dataExfiltration: 156,
      webAttacks: 23456,
      intrusionAttempts: 2347,
      securityEvents: 12470,
      vulnerabilities: 456
    },
    iocMatches: 2347,
    threatFeeds: 15,
    avgThreatResponseTime: "1.2 hours"
  }

  // Compliance & Risk Metrics
  const complianceMetrics = {
    overallCompliance: 98.5,
    regulatoryFrameworks: {
      sox: 99.2,
      pci: 98.8,
      hipaa: 99.1,
      gdpr: 97.9,
      iso27001: 98.3
    },
    auditFindings: 0,
    riskScore: 12.3,
    riskTrend: "decreasing",
    securityIncidents: 23,
    incidentSeverity: {
      critical: 2,
      high: 8,
      medium: 13,
      low: 0
    }
  }

  // Financial Impact Analysis
  const financialImpact = {
    totalInvestment: 7200000,
    totalSavings: 0, // Will be calculated asynchronously
    roi: 0, // Will be calculated asynchronously
    costPerIncident: 125000,
    incidentsPrevented: 0, // Will be calculated asynchronously
    compliancePenaltiesAvoided: 0, // Will be calculated asynchronously
    insuranceSavings: 0, // Will be calculated asynchronously
    productivityGains: 0 // Will be calculated asynchronously
  }

  // EDR Solution Performance Data
  const edrSolutionData = {
    platform: "CrowdStrike Falcon EDR",
    totalEndpoints: 2847,
    protectedEndpoints: 2847,
    protectionRate: 100,
    totalThreatsDetected: quarterlyMetrics.totalSecurityIncidents,
    maliciousExecutablesBlocked: Math.round(quarterlyMetrics.totalSecurityIncidents * 0.85),
    truePositiveRate: 98.2,
    falsePositiveRate: 1.8,
    avgResponseTime: "0.9 seconds",
    totalCostSaved: 0, // Will be calculated asynchronously
    lastUpdated: "2024-12-15",
    
    topDetectionRules: [
      {
        id: "EDR-001",
        name: "MALICIOUS EXECUTABLE DETECTION",
        category: "Malware Detection",
        truePositives: 156,
        falsePositives: 3,
        detectionRate: 98.1,
        avgResponseTime: "0.8 seconds",
        costSaved: 890000,
        threatActors: ["APT29", "Lazarus Group"],
        fileTypes: [".exe", ".dll", ".bat", ".ps1"],
        mitigationActions: ["Quarantine", "Block Execution", "Alert SOC"],
        lastUpdated: "2024-12-15"
      },
      {
        id: "EDR-002", 
        name: "SUSPICIOUS PROCESS CREATION",
        category: "Process Monitoring",
        truePositives: 134,
        falsePositives: 5,
        detectionRate: 96.4,
        avgResponseTime: "1.2 seconds",
        costSaved: 720000,
        threatActors: ["FIN7", "Carbanak"],
        fileTypes: [".exe", ".scr", ".com"],
        mitigationActions: ["Terminate Process", "Block Parent", "Isolate Host"],
        lastUpdated: "2024-12-12"
      },
      {
        id: "EDR-003",
        name: "MEMORY INJECTION DETECTION",
        category: "Memory Protection",
        truePositives: 98,
        falsePositives: 2,
        detectionRate: 98.0,
        avgResponseTime: "0.6 seconds",
        costSaved: 540000,
        threatActors: ["APT28", "Cozy Bear"],
        fileTypes: [".dll", ".sys", "memory"],
        mitigationActions: ["Block Injection", "Kill Process", "Memory Scan"],
        lastUpdated: "2024-12-10"
      },
      {
        id: "EDR-004",
        name: "COMMAND & CONTROL DETECTION",
        category: "Network Protection",
        truePositives: 87,
        falsePositives: 4,
        detectionRate: 95.6,
        avgResponseTime: "1.5 seconds",
        costSaved: 480000,
        threatActors: ["APT38", "Fancy Bear"],
        fileTypes: [".exe", ".dll", "network"],
        mitigationActions: ["Block Connection", "Quarantine", "Network Isolation"],
        lastUpdated: "2024-12-08"
      },
      {
        id: "EDR-005",
        name: "RANSOMWARE BEHAVIOR DETECTION",
        category: "Ransomware Protection",
        truePositives: 76,
        falsePositives: 1,
        detectionRate: 98.7,
        avgResponseTime: "0.9 seconds",
        costSaved: 620000,
        threatActors: ["REvil", "Conti"],
        fileTypes: [".exe", ".dll", ".vbs"],
        mitigationActions: ["Stop Encryption", "Restore Files", "Block Ransomware"],
        lastUpdated: "2024-12-05"
      }
    ],
    
    threatBreakdown: {
      maliciousExecutables: 551,
      ransomwareAttempts: 76,
      memoryInjection: 98,
      commandControl: 87,
      processInjection: 134,
      credentialTheft: 156
    },
    
    fileTypesDetected: {
      ".exe": 234,
      ".dll": 156,
      ".bat": 67,
      ".ps1": 45,
      ".scr": 23,
      ".com": 18,
      ".vbs": 8
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "good":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const generateBoardReport = () => {
    // Simulate board report generation
    alert("Quarterly Board Report PDF generated successfully!")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">QUARTERLY SECURITY METRICS</h1>
          <p className="text-sm text-neutral-400">Board of Directors Presentation - {quarterlyMetrics.quarter}</p>
          <p className="text-xs text-neutral-500">Period: {quarterlyMetrics.period}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Analysis Period Toolbar */}
          <div className="flex items-center gap-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-300 font-medium">Analysis Period:</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={analysisPeriod === "quarterly" ? "default" : "outline"}
                size="sm"
                onClick={() => setAnalysisPeriod("quarterly")}
                className={`text-xs ${
                  analysisPeriod === "quarterly" 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Quarterly
              </Button>
              <Button
                variant={analysisPeriod === "yearly" ? "default" : "outline"}
                size="sm"
                onClick={() => setAnalysisPeriod("yearly")}
                className={`text-xs ${
                  analysisPeriod === "yearly" 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Yearly
              </Button>
              <Button
                variant={analysisPeriod === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setAnalysisPeriod("monthly")}
                className={`text-xs ${
                  analysisPeriod === "monthly" 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Monthly
              </Button>
            </div>
            <div className="text-xs text-neutral-500 px-2 py-1 bg-neutral-700/50 rounded">
              {analysisPeriod === "quarterly" && selectedQuarter}
              {analysisPeriod === "yearly" && "2024"}
              {analysisPeriod === "monthly" && "December 2024"}
            </div>
          </div>
          
          <Button onClick={generateBoardReport} className="bg-orange-600 hover:bg-orange-700">
            <Download className="w-4 h-4 mr-2" />
            Generate Board Report
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL COST SAVINGS</p>
                <p className="text-2xl font-bold text-green-400 font-mono">{formatCurrency(quarterlyMetrics.totalCostSavings)}</p>
                <p className="text-xs text-green-500">+{quarterlyMetrics.roi}% ROI</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SECURITY SCORE</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">{quarterlyMetrics.securityScore}%</p>
                <p className="text-xs text-blue-500">+2.3% from Q3</p>
              </div>
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">INCIDENTS RESOLVED</p>
                <p className="text-2xl font-bold text-orange-400 font-mono">{quarterlyMetrics.resolvedIncidents}</p>
                <p className="text-xs text-orange-500">95.4% resolution rate</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">COMPLIANCE SCORE</p>
                <p className="text-2xl font-bold text-purple-400 font-mono">{complianceMetrics.overallCompliance}%</p>
                <p className="text-xs text-purple-500">0 audit findings</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Tools Performance */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Security Tools Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(securityToolMetrics).map(([key, tool]) => {
            const IconComponent = tool.icon
            return (
              <Card key={key} className={`bg-neutral-900 border-neutral-700 ${getStatusColor(tool.status)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-6 h-6" />
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(tool.status)}>
                      {tool.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                                         <div>
                       <p className="text-neutral-400">Threats Blocked</p>
                       <p className="text-white font-mono">
                         {'threatsDetected' in tool.metrics ? tool.metrics.threatsDetected :
                          'maliciousEmails' in tool.metrics ? tool.metrics.maliciousEmails :
                          'blockedConnections' in tool.metrics ? tool.metrics.blockedConnections :
                          'suspiciousActivities' in tool.metrics ? tool.metrics.suspiciousActivities :
                          'failedLogins' in tool.metrics ? tool.metrics.failedLogins :
                          'encryptionAlerts' in tool.metrics ? tool.metrics.encryptionAlerts : 0}
                       </p>
                     </div>
                     <div>
                       <p className="text-neutral-400">Success Rate</p>
                       <p className="text-green-400 font-mono">
                         {'blockedRate' in tool.metrics ? tool.metrics.blockedRate :
                          'quarantineRate' in tool.metrics ? tool.metrics.quarantineRate :
                          'protectionRate' in tool.metrics ? tool.metrics.protectionRate :
                          'mfaEnabled' in tool.metrics ? tool.metrics.mfaEnabled :
                          'encryptedData' in tool.metrics ? tool.metrics.encryptedData : 0}%
                       </p>
                     </div>
                    <div>
                      <p className="text-neutral-400">Response Time</p>
                      <p className="text-white font-mono">
                        {('avgDetectionTime' in tool.metrics && tool.metrics.avgDetectionTime) ||
                         ('avgScanTime' in tool.metrics && tool.metrics.avgScanTime) ||
                         ('avgResponseTime' in tool.metrics && tool.metrics.avgResponseTime) ||
                         ('avgAuthTime' in tool.metrics && tool.metrics.avgAuthTime) ||
                         ('avgEncryptionTime' in tool.metrics && tool.metrics.avgEncryptionTime) ||
                         ('avgProcessingTime' in tool.metrics && tool.metrics.avgProcessingTime) ||
                         ('avgRemediationTime' in tool.metrics && tool.metrics.avgRemediationTime) ||
                         ('avgEnforcementTime' in tool.metrics && tool.metrics.avgEnforcementTime) ||
                         ('avgPatchTime' in tool.metrics && tool.metrics.avgPatchTime) ||
                         'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400">Cost Saved</p>
                      <p className="text-green-400 font-mono">{formatCurrency(tool.metrics.costSaved)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* EDR Solution Performance */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">EDR SOLUTION PERFORMANCE</h2>
        <p className="text-sm text-neutral-400">CrowdStrike Falcon EDR - Malicious Executable Detection & Mitigation</p>
        
        {/* EDR Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">MALICIOUS EXECUTABLES BLOCKED</p>
                  <p className="text-2xl font-bold text-green-400 font-mono">{edrSolutionData.maliciousExecutablesBlocked}</p>
                  <p className="text-xs text-green-500">{edrSolutionData.truePositiveRate}% true positive rate</p>
                </div>
                <Shield className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">PROTECTED ENDPOINTS</p>
                  <p className="text-2xl font-bold text-blue-400 font-mono">{edrSolutionData.protectedEndpoints}</p>
                  <p className="text-xs text-blue-500">{edrSolutionData.protectionRate}% protection rate</p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">AVG RESPONSE TIME</p>
                  <p className="text-2xl font-bold text-orange-400 font-mono">{edrSolutionData.avgResponseTime}</p>
                  <p className="text-xs text-orange-500">Real-time detection</p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">COST SAVINGS</p>
                  <p className="text-2xl font-bold text-green-400 font-mono">{formatCurrency(edrSolutionData.totalCostSaved)}</p>
                  <p className="text-xs text-green-500">From prevented incidents</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* EDR Protection Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">EDR PROTECTION RULES</h3>
          <p className="text-sm text-neutral-400">Active Protection Rules for Malicious Executable Detection</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {edrSolutionData.topDetectionRules.map((rule, index) => (
              <Card key={rule.id} className="bg-neutral-900 border-neutral-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
                        <span className="text-red-400 font-bold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{rule.name}</CardTitle>
                        <p className="text-sm text-neutral-400 font-mono">{rule.id} • {rule.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {rule.detectionRate}% DETECTION
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-neutral-800 rounded">
                      <p className="text-lg font-bold text-green-400">{rule.truePositives}</p>
                      <p className="text-xs text-neutral-400">True Positives</p>
                    </div>
                    <div className="text-center p-2 bg-neutral-800 rounded">
                      <p className="text-lg font-bold text-orange-400">{rule.avgResponseTime}</p>
                      <p className="text-xs text-neutral-400">Response Time</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-300 mb-2">FILE TYPES PROTECTED</h4>
                    <div className="flex flex-wrap gap-1">
                      {rule.fileTypes.map((fileType: string) => (
                        <Badge key={fileType} className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                          {fileType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-300 mb-2">MITIGATION ACTIONS</h4>
                    <div className="flex flex-wrap gap-1">
                      {rule.mitigationActions.map((action: string) => (
                        <Badge key={action} className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-700">
                    <p className="text-xs text-neutral-500">Last Updated: {rule.lastUpdated}</p>
                    <Badge className="bg-blue-500/20 text-blue-400">Active Protection</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Detection Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">PREVENTED CYBER INCIDENCE</h3>
          <div className="grid grid-cols-1 gap-4">
            {edrSolutionData.topDetectionRules.map((rule, index) => (
              <Card key={rule.id} className="bg-neutral-900 border-neutral-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-500/20 rounded-full">
                        <span className="text-orange-400 font-bold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{rule.name}</CardTitle>
                        <p className="text-sm text-neutral-400 font-mono">{rule.id} • {rule.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {rule.detectionRate}% DETECTION RATE
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-neutral-800 rounded">
                      <p className="text-2xl font-bold text-green-400">{rule.truePositives}</p>
                      <p className="text-xs text-neutral-400">True Positives</p>
                      <p className="text-xs text-orange-500">{rule.falsePositives} false positives</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-800 rounded">
                      <p className="text-2xl font-bold text-blue-400">{rule.avgResponseTime}</p>
                      <p className="text-xs text-neutral-400">Avg Response Time</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-800 rounded">
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(rule.costSaved)}</p>
                      <p className="text-xs text-neutral-400">Cost Saved</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-800 rounded">
                      <p className="text-2xl font-bold text-purple-400">{rule.category}</p>
                      <p className="text-xs text-neutral-400">Category</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-300 mb-2">THREAT ACTORS</h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.threatActors.map((actor: string) => (
                          <Badge key={actor} className="bg-red-500/20 text-red-400 border-red-500/30">
                            {actor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-300 mb-2">FILE TYPES DETECTED</h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.fileTypes.map((fileType: string) => (
                          <Badge key={fileType} className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            {fileType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-300 mb-2">MITIGATION ACTIONS</h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.mitigationActions.map((action: string) => (
                          <Badge key={action} className="bg-green-500/20 text-green-400 border-green-500/30">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-700">
                    <p className="text-xs text-neutral-500">Last Updated: {rule.lastUpdated}</p>
                    <div className="flex gap-2">
                      <Badge className="bg-neutral-800 text-neutral-300">EDR Tool</Badge>
                      <Badge className="bg-blue-500/20 text-blue-400">Malicious Executables</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* File Type Breakdown */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">MALICIOUS EXECUTABLE FILE TYPES DETECTED</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(edrSolutionData.fileTypesDetected).map(([fileType, count]) => (
                <div key={fileType} className="text-center p-3 bg-neutral-800 rounded">
                  <p className="text-lg font-bold text-orange-400">{fileType}</p>
                  <p className="text-2xl font-bold text-white font-mono">{count}</p>
                  <p className="text-xs text-neutral-400">detected</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Intelligence & Financial Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Intelligence */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Threat Intelligence Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-neutral-800 rounded">
                <p className="text-2xl font-bold text-red-400">{threatIntelligence.criticalThreats}</p>
                <p className="text-xs text-neutral-400">Critical Threats</p>
              </div>
              <div className="text-center p-3 bg-neutral-800 rounded">
                <p className="text-2xl font-bold text-green-400">{threatIntelligence.mitigatedThreats}</p>
                <p className="text-xs text-neutral-400">Threats Mitigated</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-2">Threat Types</p>
              <div className="space-y-2">
                {Object.entries(threatIntelligence.threatTypes).map(([type, count]) => {
                  const labels = {
                    emailThreats: "Email Threats",
                    malwareThreats: "Malware Threats", 
                    networkAttacks: "Network Attacks",
                    endpointThreats: "Endpoint Threats",
                    unauthorizedAccess: "Unauthorized Access",
                    dataExfiltration: "Data Exfiltration",
                    webAttacks: "Web Attacks",
                    intrusionAttempts: "Intrusion Attempts",
                    securityEvents: "Security Events",
                    vulnerabilities: "Vulnerabilities"
                  }
                  return (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-neutral-300">{labels[type as keyof typeof labels] || type}</span>
                      <span className="text-sm font-mono text-white">{count.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Impact */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Financial Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Total Investment</span>
                <span className="text-sm font-mono text-red-400">{formatCurrency(financialImpact.totalInvestment)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Total Savings</span>
                <span className="text-sm font-mono text-green-400">{formatCurrency(financialImpact.totalSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">ROI</span>
                <span className="text-sm font-mono text-green-400">+{financialImpact.roi}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Incidents Prevented</span>
                <span className="text-sm font-mono text-white">{financialImpact.incidentsPrevented}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Compliance Penalties Avoided</span>
                <span className="text-sm font-mono text-green-400">{formatCurrency(financialImpact.compliancePenaltiesAvoided)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance & Risk Metrics */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Compliance & Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(complianceMetrics.regulatoryFrameworks).map(([framework, score]) => (
              <div key={framework} className="text-center p-4 bg-neutral-800 rounded">
                <p className="text-lg font-bold text-white">{framework.toUpperCase()}</p>
                <p className="text-2xl font-bold text-green-400">{score}%</p>
                <p className="text-xs text-neutral-400">Compliance Score</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-neutral-800 rounded">
              <p className="text-2xl font-bold text-green-400">{complianceMetrics.auditFindings}</p>
              <p className="text-xs text-neutral-400">Audit Findings</p>
            </div>
            <div className="text-center p-3 bg-neutral-800 rounded">
              <p className="text-2xl font-bold text-orange-400">{complianceMetrics.riskScore}</p>
              <p className="text-xs text-neutral-400">Risk Score</p>
            </div>
            <div className="text-center p-3 bg-neutral-800 rounded">
              <p className="text-2xl font-bold text-blue-400">{quarterlyMetrics.avgResolutionTime}</p>
              <p className="text-xs text-neutral-400">Avg Resolution Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
