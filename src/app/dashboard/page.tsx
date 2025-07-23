"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Target, DollarSign, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  const performanceMetrics = {
    totalRules: 847,
    activeRules: 823,
    avgPerformance: 94.2,
    falsePositiveRate: 2.1,
    truePositiveRate: 97.8,
    responseTime: 1.2,
  }

  const financialImpact = {
    costSavings: 2400000,
    roi: 340,
    breachPrevention: 15600000,
    complianceSavings: 890000,
  }

  const threatMetrics = {
    alertsToday: 1247,
    criticalAlerts: 23,
    mitigatedThreats: 156,
    activeInvestigations: 8,
  }

  const topRules = [
    {
      id: "RULE-001",
      name: "ADVANCED PERSISTENT THREAT DETECTION",
      platform: "Microsoft Sentinel",
      performance: 98.5,
      costSaved: 450000,
      alerts: 45,
      mitreTactic: "Persistence",
    },
    {
      id: "RULE-002",
      name: "LATERAL MOVEMENT DETECTION",
      platform: "Splunk",
      performance: 96.8,
      costSaved: 380000,
      alerts: 32,
      mitreTactic: "Lateral Movement",
    },
    {
      id: "RULE-003",
      name: "DATA EXFILTRATION MONITORING",
      platform: "CrowdStrike",
      performance: 95.2,
      costSaved: 520000,
      alerts: 28,
      mitreTactic: "Exfiltration",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SECURITY OPERATIONS DASHBOARD</h1>
          <p className="text-sm text-neutral-400">Real-time threat detection and financial impact analysis</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>LAST UPDATE: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE RULES</p>
                <p className="text-2xl font-bold text-white font-mono">{performanceMetrics.activeRules}</p>
                <p className="text-xs text-neutral-500">of {performanceMetrics.totalRules} total</p>
              </div>
              <Shield className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">AVG PERFORMANCE</p>
                <p className="text-2xl font-bold text-white font-mono">{performanceMetrics.avgPerformance}%</p>
                <p className="text-xs text-white">+2.3% from last week</p>
              </div>
              <Target className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">COST SAVINGS</p>
                <p className="text-2xl font-bold text-white font-mono">
                  ${(financialImpact.costSavings / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-white">ROI: {financialImpact.roi}%</p>
              </div>
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL ALERTS</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{threatMetrics.criticalAlerts}</p>
                <p className="text-xs text-neutral-500">{threatMetrics.alertsToday} total today</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Overview */}
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              DETECTION PERFORMANCE OVERVIEW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">True Positive Rate</span>
                  <span className="text-white font-mono">{performanceMetrics.truePositiveRate}%</span>
                </div>
                <Progress value={performanceMetrics.truePositiveRate} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">False Positive Rate</span>
                  <span className="text-orange-500 font-mono">{performanceMetrics.falsePositiveRate}%</span>
                </div>
                <Progress value={performanceMetrics.falsePositiveRate} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Avg Response Time</span>
                  <span className="text-white font-mono">{performanceMetrics.responseTime}s</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="h-48 relative">
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,120 50,100 100,90 150,85 200,80 250,75 300,70 350,65"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
                <polyline
                  points="0,140 50,135 100,125 150,120 200,115 250,110 300,105 350,100"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Financial Impact */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">FINANCIAL IMPACT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Breach Prevention</span>
                <span className="text-white font-mono">
                  ${(financialImpact.breachPrevention / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Compliance Savings</span>
                <span className="text-white font-mono">${(financialImpact.complianceSavings / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Total ROI</span>
                <span className="text-white font-mono">{financialImpact.roi}%</span>
              </div>

              {/* ROI Visualization */}
              <div className="mt-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-white font-mono">
                    ${(financialImpact.costSavings / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-neutral-400">TOTAL SAVINGS</div>
                </div>
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 border-4 border-neutral-700 rounded-full"></div>
                  <div
                    className="absolute inset-0 border-4 border-orange-500 rounded-full"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + (financialImpact.roi / 360) * 50}% 0%, 100% 100%, 0% 100%)`,
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{financialImpact.roi}%</div>
                      <div className="text-xs text-neutral-400">ROI</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Rules */}
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              TOP PERFORMING DETECTION RULES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{rule.name}</span>
                        <Badge className="bg-neutral-800 text-neutral-300 text-xs">{rule.platform}</Badge>
                      </div>
                      <div className="text-xs text-neutral-400 font-mono">{rule.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono">{rule.performance}%</div>
                      <div className="text-xs text-neutral-400">Performance</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-neutral-400">Cost Saved</div>
                      <div className="text-white font-mono">${(rule.costSaved / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-neutral-400">Alerts Today</div>
                      <div className="text-white font-mono">{rule.alerts}</div>
                    </div>
                    <div>
                      <div className="text-neutral-400">MITRE Tactic</div>
                      <div className="text-orange-500">{rule.mitreTactic}</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <Progress value={rule.performance} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Threat Intelligence */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              THREAT INTELLIGENCE FEED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[
                {
                  time: "2025-06-17 14:23",
                  threat: "APT29",
                  technique: "T1055.012",
                  severity: "critical",
                  description: "Process hollowing detected in financial sector",
                },
                {
                  time: "2025-06-17 14:18",
                  threat: "Lazarus Group",
                  technique: "T1566.001",
                  severity: "high",
                  description: "Spearphishing attachment campaign targeting healthcare",
                },
                {
                  time: "2025-06-17 14:12",
                  threat: "FIN7",
                  technique: "T1059.003",
                  severity: "medium",
                  description: "Windows command shell activity in retail environment",
                },
                {
                  time: "2025-06-17 14:05",
                  threat: "Carbanak",
                  technique: "T1021.001",
                  severity: "high",
                  description: "Remote desktop protocol lateral movement detected",
                },
              ].map((intel, index) => (
                <div
                  key={index}
                  className="border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-neutral-500 font-mono">{intel.time}</div>
                    <Badge
                      className={`text-xs ${
                        intel.severity === "critical"
                          ? "bg-red-500/20 text-red-500"
                          : intel.severity === "high"
                            ? "bg-orange-500/20 text-orange-500"
                            : "bg-neutral-500/20 text-neutral-300"
                      }`}
                    >
                      {intel.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-white mb-1">
                    <span className="text-orange-500 font-mono">{intel.threat}</span> - {intel.technique}
                  </div>
                  <div className="text-xs text-neutral-300">{intel.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
