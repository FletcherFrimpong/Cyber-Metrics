"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Database, Globe, Eye, AlertTriangle } from "lucide-react"

export default function ThreatIntelPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIntel, setSelectedIntel] = useState(null)

  const threatIntelligence = [
    {
      id: "INTEL-001",
      title: "APT29 Campaign Analysis",
      source: "CISA Advisory",
      classification: "TLP:WHITE",
      confidence: 95,
      date: "2025-06-17",
      threatActor: "APT29 (Cozy Bear)",
      techniques: ["T1055.012", "T1071.001", "T1566.001"],
      industries: ["Government", "Healthcare", "Technology"],
      iocs: ["malicious-domain.com", "192.168.1.100", "suspicious.exe"],
      description:
        "Advanced persistent threat campaign targeting healthcare organizations with sophisticated spearphishing attacks",
      mitreMapping: "Persistence, Command and Control, Initial Access",
      severity: "critical",
    },
    {
      id: "INTEL-002",
      title: "FIN7 Financial Sector Targeting",
      source: "FBI Flash Alert",
      classification: "TLP:AMBER",
      confidence: 88,
      date: "2025-06-16",
      threatActor: "FIN7",
      techniques: ["T1021.001", "T1003.001", "T1041"],
      industries: ["Financial Services", "Retail"],
      iocs: ["fin7-c2.net", "10.0.0.50", "carbanak.dll"],
      description: "Financially motivated threat group conducting point-of-sale malware campaigns",
      mitreMapping: "Lateral Movement, Credential Access, Exfiltration",
      severity: "high",
    },
    {
      id: "INTEL-003",
      title: "Lazarus Group Cryptocurrency Exchange Attacks",
      source: "DetectionLab",
      classification: "TLP:GREEN",
      confidence: 92,
      date: "2025-06-15",
      threatActor: "Lazarus Group",
      techniques: ["T1566.002", "T1059.003", "T1041"],
      industries: ["Financial Services", "Cryptocurrency"],
      iocs: ["lazarus-payload.zip", "203.0.113.5", "crypto-stealer.exe"],
      description: "North Korean state-sponsored group targeting cryptocurrency exchanges and financial institutions",
      mitreMapping: "Initial Access, Execution, Exfiltration",
      severity: "critical",
    },
    {
      id: "INTEL-004",
      title: "Carbanak Banking Trojan Evolution",
      source: "Threat Intelligence Feed",
      classification: "TLP:WHITE",
      confidence: 85,
      date: "2025-06-14",
      threatActor: "Carbanak",
      techniques: ["T1055.001", "T1021.001", "T1005"],
      industries: ["Banking", "Financial Services"],
      iocs: ["carbanak-new.exe", "198.51.100.10", "banking-trojan.dll"],
      description: "Updated version of Carbanak banking trojan with enhanced evasion capabilities",
      mitreMapping: "Defense Evasion, Lateral Movement, Collection",
      severity: "high",
    },
    {
      id: "INTEL-005",
      title: "APT28 Infrastructure Analysis",
      source: "MITRE ATT&CK",
      classification: "TLP:WHITE",
      confidence: 90,
      date: "2025-06-13",
      threatActor: "APT28 (Fancy Bear)",
      techniques: ["T1071.001", "T1090", "T1027"],
      industries: ["Government", "Defense", "Media"],
      iocs: ["apt28-c2.org", "172.16.0.25", "fancy-bear.exe"],
      description: "Russian military intelligence group infrastructure and command and control analysis",
      mitreMapping: "Command and Control, Defense Evasion",
      severity: "high",
    },
  ]

  const dataSources = [
    {
      name: "MITRE ATT&CK Framework",
      type: "Tactics & Techniques",
      status: "active",
      lastUpdate: "2025-06-17",
      reliability: 98,
    },
    {
      name: "CISA Cybersecurity Advisories",
      type: "Government Intelligence",
      status: "active",
      lastUpdate: "2025-06-17",
      reliability: 96,
    },
    {
      name: "FBI Flash Alerts",
      type: "Law Enforcement",
      status: "active",
      lastUpdate: "2025-06-16",
      reliability: 94,
    },
    {
      name: "DetectionLab",
      type: "Community Intelligence",
      status: "active",
      lastUpdate: "2025-06-15",
      reliability: 89,
    },
  ]

  const filteredIntel = threatIntelligence.filter(
    (intel) =>
      intel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intel.threatActor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intel.industries.some((industry) => industry.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getClassificationColor = (classification) => {
    switch (classification) {
      case "TLP:RED":
        return "bg-red-500/20 text-red-500"
      case "TLP:AMBER":
        return "bg-orange-500/20 text-orange-500"
      case "TLP:GREEN":
        return "bg-white/20 text-white"
      case "TLP:WHITE":
        return "bg-neutral-500/20 text-neutral-300"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return "text-white"
    if (confidence >= 80) return "text-white"
    if (confidence >= 70) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">THREAT INTELLIGENCE CENTER</h1>
          <p className="text-sm text-neutral-400">Real-time threat intelligence and IOC management</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Update Intel</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Export IOCs</Button>
        </div>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search threat intelligence..."
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
                <p className="text-xs text-neutral-400 tracking-wider">INTEL REPORTS</p>
                <p className="text-2xl font-bold text-white font-mono">1,247</p>
              </div>
              <Database className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE THREATS</p>
                <p className="text-2xl font-bold text-red-500 font-mono">89</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">DATA SOURCES</p>
                <p className="text-2xl font-bold text-white font-mono">24</p>
              </div>
              <Globe className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            THREAT INTELLIGENCE SOURCES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataSources.map((source) => (
              <div key={source.name} className="border border-neutral-700 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-white">{source.name}</div>
                  <Badge className="bg-white/20 text-white">ACTIVE</Badge>
                </div>
                <div className="text-xs text-neutral-400 mb-2">{source.type}</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Reliability:</span>
                  <span className={`font-mono ${getConfidenceColor(source.reliability)}`}>{source.reliability}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Updated:</span>
                  <span className="text-white font-mono">{source.lastUpdate}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat Intelligence Feed */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            THREAT INTELLIGENCE FEED ({filteredIntel.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIntel.map((intel) => (
              <div
                key={intel.id}
                className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedIntel(intel)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-bold text-white">{intel.title}</div>
                      <Badge className={getSeverityColor(intel.severity)}>{intel.severity.toUpperCase()}</Badge>
                    </div>
                    <div className="text-xs text-neutral-400 font-mono mb-1">{intel.id}</div>
                    <div className="text-xs text-red-500 mb-2">{intel.threatActor}</div>
                  </div>
                  <div className="text-right">
                    <Badge className={getClassificationColor(intel.classification)}>{intel.classification}</Badge>
                    <div className="text-xs text-neutral-400 mt-1">{intel.date}</div>
                  </div>
                </div>

                <div className="text-sm text-neutral-300 mb-3">{intel.description}</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-neutral-400">Source</div>
                    <div className="text-white">{intel.source}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Confidence</div>
                    <div className={`font-mono ${getConfidenceColor(intel.confidence)}`}>{intel.confidence}%</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Industries</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {intel.industries.slice(0, 2).map((industry) => (
                        <Badge key={industry} className="bg-neutral-800 text-neutral-300 text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intel Detail Modal */}
      {selectedIntel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedIntel.title}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">
                  {selectedIntel.id} • {selectedIntel.threatActor}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedIntel(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">CLASSIFICATION</h3>
                    <div className="flex gap-2 mb-2">
                      <Badge className={getClassificationColor(selectedIntel.classification)}>
                        {selectedIntel.classification}
                      </Badge>
                      <Badge className={getSeverityColor(selectedIntel.severity)}>
                        {selectedIntel.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Source:</span>
                        <span className="text-white">{selectedIntel.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Confidence:</span>
                        <span className={`font-mono ${getConfidenceColor(selectedIntel.confidence)}`}>
                          {selectedIntel.confidence}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Date:</span>
                        <span className="text-white font-mono">{selectedIntel.date}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">TARGETED INDUSTRIES</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedIntel.industries.map((industry) => (
                        <Badge key={industry} className="bg-neutral-800 text-neutral-300">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      MITRE ATT&CK TECHNIQUES
                    </h3>
                    <div className="space-y-2">
                      {selectedIntel.techniques.map((technique) => (
                        <div key={technique} className="flex items-center gap-2">
                          <Badge className="bg-orange-500/20 text-orange-500">{technique}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-neutral-400 mt-2">Mapping: {selectedIntel.mitreMapping}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      INDICATORS OF COMPROMISE
                    </h3>
                    <div className="space-y-2">
                      {selectedIntel.iocs.map((ioc, index) => (
                        <div key={index} className="text-xs font-mono text-red-500 bg-neutral-800 p-2 rounded">
                          {ioc}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DETAILED ANALYSIS</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{selectedIntel.description}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  Create Detection Rule
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Export IOCs
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Share Intelligence
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
