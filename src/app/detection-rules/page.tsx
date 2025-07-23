"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, Filter, Shield, Target, DollarSign, Eye, Settings } from "lucide-react"

export default function DetectionRulesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRule, setSelectedRule] = useState(null)

  const detectionRules = [
    {
      id: "RULE-001",
      name: "ADVANCED PERSISTENT THREAT DETECTION",
      platform: "Microsoft Sentinel",
      category: "Persistence",
      mitreTactic: "T1055.012",
      performance: 98.5,
      falsePositiveRate: 0.8,
      truePositiveRate: 99.2,
      costSaved: 450000,
      alertsToday: 45,
      responseTime: 0.9,
      threatActors: ["APT29", "Cozy Bear"],
      compliance: ["PCI DSS", "HIPAA"],
      status: "active",
      lastOptimized: "2025-06-15",
    },
    {
      id: "RULE-002",
      name: "LATERAL MOVEMENT DETECTION",
      platform: "Splunk",
      category: "Lateral Movement",
      mitreTactic: "T1021.001",
      performance: 96.8,
      falsePositiveRate: 1.2,
      truePositiveRate: 98.8,
      costSaved: 380000,
      alertsToday: 32,
      responseTime: 1.1,
      threatActors: ["FIN7", "Carbanak"],
      compliance: ["SOX", "GLBA"],
      status: "active",
      lastOptimized: "2025-06-12",
    },
    {
      id: "RULE-003",
      name: "DATA EXFILTRATION MONITORING",
      platform: "CrowdStrike",
      category: "Exfiltration",
      mitreTactic: "T1041",
      performance: 95.2,
      falsePositiveRate: 2.1,
      truePositiveRate: 97.9,
      costSaved: 520000,
      alertsToday: 28,
      responseTime: 1.3,
      threatActors: ["Lazarus Group", "APT38"],
      compliance: ["PCI DSS", "SOX"],
      status: "active",
      lastOptimized: "2025-06-10",
    },
    {
      id: "RULE-004",
      name: "CREDENTIAL DUMPING DETECTION",
      platform: "Microsoft Sentinel",
      category: "Credential Access",
      mitreTactic: "T1003.001",
      performance: 94.7,
      falsePositiveRate: 1.8,
      truePositiveRate: 98.2,
      costSaved: 290000,
      alertsToday: 18,
      responseTime: 0.8,
      threatActors: ["Mimikatz", "APT1"],
      compliance: ["HIPAA", "GLBA"],
      status: "active",
      lastOptimized: "2025-06-08",
    },
    {
      id: "RULE-005",
      name: "COMMAND AND CONTROL DETECTION",
      platform: "Splunk",
      category: "Command and Control",
      mitreTactic: "T1071.001",
      performance: 93.4,
      falsePositiveRate: 2.8,
      truePositiveRate: 96.6,
      costSaved: 340000,
      alertsToday: 22,
      responseTime: 1.5,
      threatActors: ["APT28", "Fancy Bear"],
      compliance: ["PCI DSS", "SOX"],
      status: "tuning",
      lastOptimized: "2025-06-05",
    },
  ]

  const filteredRules = detectionRules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-white/20 text-white"
      case "tuning":
        return "bg-orange-500/20 text-orange-500"
      case "disabled":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getPerformanceColor = (performance) => {
    if (performance >= 95) return "text-white"
    if (performance >= 90) return "text-white"
    if (performance >= 85) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DETECTION RULES MANAGEMENT</h1>
          <p className="text-sm text-neutral-400">AI-powered rule optimization and threat intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Optimize Rules</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search detection rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL RULES</p>
                <p className="text-2xl font-bold text-white font-mono">847</p>
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
                <p className="text-2xl font-bold text-white font-mono">94.2%</p>
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
                <p className="text-2xl font-bold text-white font-mono">$2.4M</p>
              </div>
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Rules Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            DETECTION RULES ANALYTICS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RULE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">PLATFORM</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    PERFORMANCE
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">FP RATE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                    COST SAVED
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ALERTS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">STATUS</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule, index) => (
                  <tr
                    key={rule.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer ${
                      index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                    }`}
                    onClick={() => setSelectedRule(rule)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm text-white font-medium">{rule.name}</div>
                        <div className="text-xs text-neutral-400 font-mono">{rule.id}</div>
                        <div className="text-xs text-orange-500">{rule.mitreTactic}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-neutral-800 text-neutral-300">{rule.platform}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className={`text-sm font-bold font-mono ${getPerformanceColor(rule.performance)}`}>
                          {rule.performance}%
                        </div>
                        <Progress value={rule.performance} className="h-1 w-16" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-orange-500 font-mono">{rule.falsePositiveRate}%</td>
                    <td className="py-3 px-4 text-sm text-white font-mono">${(rule.costSaved / 1000).toFixed(0)}K</td>
                    <td className="py-3 px-4 text-sm text-white font-mono">{rule.alertsToday}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(rule.status)}>{rule.status.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rule Detail Modal */}
      {selectedRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedRule.name}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">
                  {selectedRule.id} • {selectedRule.mitreTactic}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedRule(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">RULE INFORMATION</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Platform:</span>
                        <Badge className="bg-neutral-800 text-neutral-300">{selectedRule.platform}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Category:</span>
                        <span className="text-white">{selectedRule.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Status:</span>
                        <Badge className={getStatusColor(selectedRule.status)}>
                          {selectedRule.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Last Optimized:</span>
                        <span className="text-white font-mono">{selectedRule.lastOptimized}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">THREAT ACTORS</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRule.threatActors.map((actor) => (
                        <Badge key={actor} className="bg-red-500/20 text-red-500">
                          {actor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">COMPLIANCE</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRule.compliance.map((comp) => (
                        <Badge key={comp} className="bg-white/20 text-white">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">PERFORMANCE METRICS</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">Overall Performance</span>
                          <span className={`font-mono ${getPerformanceColor(selectedRule.performance)}`}>
                            {selectedRule.performance}%
                          </span>
                        </div>
                        <Progress value={selectedRule.performance} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">True Positive Rate</span>
                          <span className="text-white font-mono">{selectedRule.truePositiveRate}%</span>
                        </div>
                        <Progress value={selectedRule.truePositiveRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">False Positive Rate</span>
                          <span className="text-orange-500 font-mono">{selectedRule.falsePositiveRate}%</span>
                        </div>
                        <Progress value={selectedRule.falsePositiveRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">FINANCIAL IMPACT</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Cost Saved:</span>
                        <span className="text-white font-mono">${(selectedRule.costSaved / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Alerts Today:</span>
                        <span className="text-white font-mono">{selectedRule.alertsToday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Response Time:</span>
                        <span className="text-white font-mono">{selectedRule.responseTime}s</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">OPTIMIZATION</h3>
                    <div className="space-y-2">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">AI Optimize Rule</Button>
                      <Button
                        variant="outline"
                        className="w-full border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                      >
                        Benchmark Test
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
