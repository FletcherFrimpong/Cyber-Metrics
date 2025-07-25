"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Target, 
  BarChart3,
  Mail,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Globe,
  Server,
  Database,
  Network,
  Smartphone,
  Cloud
} from "lucide-react"

export default function ExecutiveReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState("Q4 2024")
  const [selectedMetric, setSelectedMetric] = useState("overview")

  // Quarterly Security Metrics for Board Presentation
  const quarterlyMetrics = {
    quarter: "Q4 2024",
    period: "October 1 - December 31, 2024",
    totalCostSavings: 24500000,
    roi: 340,
    breachesPreventedValue: 156000000,
    complianceSavings: 8900000,
    totalSecurityIncidents: 1247,
    criticalIncidents: 23,
    resolvedIncidents: 1189,
    avgResolutionTime: "2.3 hours",
    securityScore: 94.2,
  }

  // Security Tool Metrics by Category
  const securityToolMetrics = {
    emailSecurity: {
      name: "Email Security",
      icon: Mail,
      metrics: {
        totalEmails: 2847000,
        maliciousEmails: 1247,
        blockedEmails: 1247,
        blockedRate: 100,
        phishingAttempts: 892,
        malwareAttachments: 355,
        avgDetectionTime: "0.3 seconds",
        costSaved: 4200000,
      },
      status: "excellent"
    },
    antivirus: {
      name: "Antivirus Protection",
      icon: Shield,
      metrics: {
        totalScans: 1847000,
        threatsDetected: 2347,
        threatsQuarantined: 2347,
        quarantineRate: 100,
        ransomwareAttempts: 156,
        zeroDayThreats: 23,
        avgScanTime: "45 seconds",
        costSaved: 3800000,
      },
      status: "excellent"
    },
    firewall: {
      name: "Network Firewall",
      icon: Network,
      metrics: {
        totalConnections: 12470000,
        blockedConnections: 45678,
        blockedRate: 99.6,
        ddosAttempts: 234,
        unauthorizedAccess: 1234,
        avgResponseTime: "0.1 seconds",
        costSaved: 5200000,
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
        suspiciousActivities: 456,
        quarantinedFiles: 234,
        avgResponseTime: "2.1 minutes",
        costSaved: 3100000,
      },
      status: "excellent"
    },
    identityAccess: {
      name: "Identity & Access Management",
      icon: Users,
      metrics: {
        totalUsers: 2847,
        failedLogins: 1234,
        suspiciousLogins: 89,
        mfaEnabled: 100,
        privilegedAccess: 234,
        avgAuthTime: "3.2 seconds",
        costSaved: 2800000,
      },
      status: "good"
    },
    dataProtection: {
      name: "Data Protection & Encryption",
      icon: Database,
      metrics: {
        encryptedData: 99.8,
        dataBreaches: 0,
        encryptionAlerts: 156,
        complianceScore: 98.5,
        auditFindings: 0,
        avgEncryptionTime: "0.5 seconds",
        costSaved: 5400000,
      },
      status: "excellent"
    },
    webApplicationFirewall: {
      name: "Web Application Firewall",
      icon: Globe,
      metrics: {
        totalRequests: 8470000,
        blockedRequests: 23456,
        blockedRate: 99.7,
        sqlInjectionAttempts: 1234,
        xssAttempts: 567,
        avgResponseTime: "0.2 seconds",
        costSaved: 2900000,
      },
      status: "excellent"
    },
    intrusionDetection: {
      name: "Intrusion Detection System",
      icon: AlertTriangle,
      metrics: {
        totalEvents: 1247000,
        alertsGenerated: 2347,
        truePositives: 2234,
        falsePositives: 113,
        detectionRate: 95.2,
        avgResponseTime: "1.8 minutes",
        costSaved: 3600000,
      },
      status: "good"
    },
    siem: {
      name: "Security Information & Event Management",
      icon: Server,
      metrics: {
        totalLogs: 28470000,
        correlatedEvents: 12470,
        incidentsCreated: 2347,
        automatedResponses: 1890,
        avgProcessingTime: "0.5 seconds",
        costSaved: 4100000,
      },
      status: "excellent"
    },
    vulnerabilityManagement: {
      name: "Vulnerability Management",
      icon: CheckCircle,
      metrics: {
        totalAssets: 2847,
        vulnerabilitiesFound: 456,
        criticalVulns: 23,
        patchedVulns: 423,
        patchRate: 92.8,
        avgPatchTime: "3.2 days",
        costSaved: 2700000,
      },
      status: "good"
    },
    cloudSecurity: {
      name: "Cloud Security",
      icon: Cloud,
      metrics: {
        cloudResources: 1247,
        securityMisconfigurations: 89,
        remediatedIssues: 87,
        complianceScore: 96.2,
        avgRemediationTime: "4.1 hours",
        costSaved: 3200000,
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
        costSaved: 1800000,
      },
      status: "excellent"
    }
  }

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
    totalSavings: 24500000,
    roi: 340,
    costPerIncident: 125000,
    incidentsPrevented: 196,
    compliancePenaltiesAvoided: 8900000,
    insuranceSavings: 3200000,
    productivityGains: 12400000
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
        <div className="flex items-center gap-2">
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
