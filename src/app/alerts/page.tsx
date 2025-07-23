"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Bell, AlertTriangle, Shield, Eye, Clock } from "lucide-react"

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [alerts, setAlerts] = useState([])

  // Simulate real-time alerts
  useEffect(() => {
    const generateAlert = () => {
      const threatActors = ["APT29", "FIN7", "Lazarus Group", "APT28", "Carbanak"]
      const techniques = ["T1055.012", "T1021.001", "T1041", "T1003.001", "T1071.001"]
      const severities = ["critical", "high", "medium", "low"]
      const platforms = ["Microsoft Sentinel", "Splunk", "CrowdStrike"]
      const categories = ["Persistence", "Lateral Movement", "Exfiltration", "Credential Access", "Command and Control"]

      return {
        id: `ALERT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ruleName: `${categories[Math.floor(Math.random() * categories.length)]} Detection`,
        ruleId: `RULE-${String(Math.floor(Math.random() * 100)).padStart(3, "0")}`,
        severity: severities[Math.floor(Math.random() * severities.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        threatActor: threatActors[Math.floor(Math.random() * threatActors.length)],
        mitreTechnique: techniques[Math.floor(Math.random() * techniques.length)],
        costImpact: Math.floor(Math.random() * 5000000) + 100000,
        status: "active",
        description: "Suspicious activity detected requiring immediate investigation",
      }
    }

    // Initialize with some alerts
    const initialAlerts = Array.from({ length: 15 }, () => generateAlert())
    setAlerts(initialAlerts)

    // Add new alerts periodically
    const interval = setInterval(() => {
      setAlerts((prev) => [generateAlert(), ...prev.slice(0, 49)]) // Keep last 50 alerts
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.threatActor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-500"
      case "high":
        return "bg-orange-500/20 text-orange-500"
      case "medium":
        return "bg-neutral-500/20 text-neutral-300"
      case "low":
        return "bg-white/20 text-white"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "medium":
        return <Bell className="w-4 h-4" />
      case "low":
        return <Bell className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical").length
  const highAlerts = alerts.filter((alert) => alert.severity === "high").length
  const totalCostImpact = alerts.reduce((sum, alert) => sum + alert.costImpact, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">REAL-TIME SECURITY ALERTS</h1>
          <p className="text-sm text-neutral-400">Live threat detection and incident response</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Acknowledge All</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL ALERTS</p>
                <p className="text-2xl font-bold text-white font-mono">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL</p>
                <p className="text-2xl font-bold text-red-500 font-mono">{criticalAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">HIGH PRIORITY</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">{highAlerts}</p>
              </div>
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">COST IMPACT</p>
                <p className="text-2xl font-bold text-white font-mono">${(totalCostImpact / 1000000).toFixed(1)}M</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search alerts by rule, category, or threat actor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            LIVE SECURITY ALERTS ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="text-sm font-bold text-white">{alert.ruleName}</div>
                      <div className="text-xs text-neutral-400 font-mono">{alert.ruleId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                    <div className="text-xs text-neutral-400 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-neutral-400">Platform</div>
                    <div className="text-white">{alert.platform}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Threat Actor</div>
                    <div className="text-red-500">{alert.threatActor}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">MITRE Technique</div>
                    <div className="text-orange-500">{alert.mitreTechnique}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Cost Impact</div>
                    <div className="text-white font-mono">${(alert.costImpact / 1000).toFixed(0)}K</div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-neutral-300">{alert.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedAlert.ruleName}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">
                  {selectedAlert.id} • {new Date(selectedAlert.timestamp).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedAlert(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">ALERT DETAILS</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Severity:</span>
                        <Badge className={getSeverityColor(selectedAlert.severity)}>
                          {selectedAlert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Category:</span>
                        <span className="text-white">{selectedAlert.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Platform:</span>
                        <span className="text-white">{selectedAlert.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Status:</span>
                        <Badge className="bg-white/20 text-white">ACTIVE</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">THREAT INTELLIGENCE</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Threat Actor:</span>
                        <span className="text-red-500">{selectedAlert.threatActor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">MITRE Technique:</span>
                        <span className="text-orange-500">{selectedAlert.mitreTechnique}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Cost Impact:</span>
                        <span className="text-white font-mono">${(selectedAlert.costImpact / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">RESPONSE ACTIONS</h3>
                    <div className="space-y-2">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Investigate Alert</Button>
                      <Button
                        variant="outline"
                        className="w-full border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                      >
                        Acknowledge
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                      >
                        Escalate to SOC
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">TIMELINE</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span className="text-neutral-400">Alert Generated:</span>
                        <span className="text-white font-mono">
                          {new Date(selectedAlert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3 text-neutral-400" />
                        <span className="text-neutral-400">First Viewed:</span>
                        <span className="text-white font-mono">Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIPTION</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{selectedAlert.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
