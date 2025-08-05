"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  AlertTriangle, 
  Target, 
  Eye, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Network,
  Database,
  Server,
  Globe,
  Users,
  Clock,
  RefreshCw
} from "lucide-react"

interface AttackSurface {
  assets: Asset[]
  vulnerabilities: Vulnerability[]
  businessUnits: BusinessUnitRisk[]
  threatIndicators: ThreatIndicator[]
  riskMetrics: RiskMetrics
}

interface Asset {
  id: string
  name: string
  type: 'data' | 'system' | 'network' | 'physical' | 'application'
  businessUnit: string
  criticality: 'low' | 'medium' | 'high' | 'critical'
  status: 'secure' | 'at-risk' | 'compromised'
  lastScanned: Date
  vulnerabilities: number
  exposureScore: number
}

interface Vulnerability {
  id: string
  assetId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'network' | 'application' | 'configuration' | 'physical'
  description: string
  cveId?: string
  mitreTechnique?: string
  discovered: Date
  status: 'open' | 'in-progress' | 'resolved'
  riskScore: number
}

interface BusinessUnitRisk {
  id: string
  name: string
  riskScore: number
  assetCount: number
  criticalAssets: number
  openVulnerabilities: number
  trend: 'increasing' | 'decreasing' | 'stable'
  lastAssessment: Date
}

interface ThreatIndicator {
  id: string
  type: 'network' | 'endpoint' | 'application' | 'user'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: Date
  source: string
  status: 'active' | 'investigating' | 'resolved'
}

interface RiskMetrics {
  totalAssets: number
  criticalAssets: number
  openVulnerabilities: number
  criticalVulnerabilities: number
  overallRiskScore: number
  attackSurfaceScore: number
  lastUpdated: Date
}

export default function AttackSurfaceMonitor() {
  const [attackSurface, setAttackSurface] = useState<AttackSurface>({
    assets: [],
    vulnerabilities: [],
    businessUnits: [],
    threatIndicators: [],
    riskMetrics: {
      totalAssets: 0,
      criticalAssets: 0,
      openVulnerabilities: 0,
      criticalVulnerabilities: 0,
      overallRiskScore: 0,
      attackSurfaceScore: 0,
      lastUpdated: new Date()
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'assets' | 'vulnerabilities' | 'threats'>('overview')
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('all')

  useEffect(() => {
    // Simulate loading attack surface data
    const timer = setTimeout(() => {
      loadAttackSurfaceData()
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const loadAttackSurfaceData = () => {
    // Mock data - in real implementation, this would come from API
    const mockAssets: Asset[] = [
      {
        id: 'asset-1',
        name: 'Customer Database Server',
        type: 'system',
        businessUnit: 'IT',
        criticality: 'critical',
        status: 'at-risk',
        lastScanned: new Date(Date.now() - 24 * 60 * 60 * 1000),
        vulnerabilities: 3,
        exposureScore: 85
      },
      {
        id: 'asset-2',
        name: 'Payment Processing API',
        type: 'application',
        businessUnit: 'Finance',
        criticality: 'critical',
        status: 'secure',
        lastScanned: new Date(Date.now() - 2 * 60 * 60 * 1000),
        vulnerabilities: 1,
        exposureScore: 25
      },
      {
        id: 'asset-3',
        name: 'Employee Directory',
        type: 'data',
        businessUnit: 'HR',
        criticality: 'high',
        status: 'at-risk',
        lastScanned: new Date(Date.now() - 12 * 60 * 60 * 1000),
        vulnerabilities: 2,
        exposureScore: 65
      },
      {
        id: 'asset-4',
        name: 'Network Firewall',
        type: 'network',
        businessUnit: 'IT',
        criticality: 'high',
        status: 'secure',
        lastScanned: new Date(Date.now() - 1 * 60 * 60 * 1000),
        vulnerabilities: 0,
        exposureScore: 15
      },
      {
        id: 'asset-5',
        name: 'Marketing Website',
        type: 'application',
        businessUnit: 'Marketing',
        criticality: 'medium',
        status: 'at-risk',
        lastScanned: new Date(Date.now() - 6 * 60 * 60 * 1000),
        vulnerabilities: 4,
        exposureScore: 75
      }
    ]

    const mockVulnerabilities: Vulnerability[] = [
      {
        id: 'vuln-1',
        assetId: 'asset-1',
        severity: 'critical',
        type: 'application',
        description: 'SQL Injection vulnerability in login form',
        cveId: 'CVE-2023-1234',
        mitreTechnique: 'T1190',
        discovered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'open',
        riskScore: 95
      },
      {
        id: 'vuln-2',
        assetId: 'asset-1',
        severity: 'high',
        type: 'configuration',
        description: 'Weak password policy',
        discovered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'in-progress',
        riskScore: 75
      },
      {
        id: 'vuln-3',
        assetId: 'asset-3',
        severity: 'medium',
        type: 'network',
        description: 'Outdated SSL certificate',
        discovered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'open',
        riskScore: 60
      },
      {
        id: 'vuln-4',
        assetId: 'asset-5',
        severity: 'high',
        type: 'application',
        description: 'Cross-site scripting (XSS) vulnerability',
        cveId: 'CVE-2023-5678',
        mitreTechnique: 'T1189',
        discovered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'open',
        riskScore: 80
      }
    ]

    const mockBusinessUnits: BusinessUnitRisk[] = [
      {
        id: 'IT',
        name: 'Information Technology',
        riskScore: 78,
        assetCount: 2,
        criticalAssets: 2,
        openVulnerabilities: 2,
        trend: 'increasing',
        lastAssessment: new Date()
      },
      {
        id: 'Finance',
        name: 'Finance',
        riskScore: 35,
        assetCount: 1,
        criticalAssets: 1,
        openVulnerabilities: 0,
        trend: 'stable',
        lastAssessment: new Date()
      },
      {
        id: 'HR',
        name: 'Human Resources',
        riskScore: 65,
        assetCount: 1,
        criticalAssets: 0,
        openVulnerabilities: 1,
        trend: 'decreasing',
        lastAssessment: new Date()
      },
      {
        id: 'Marketing',
        name: 'Marketing',
        riskScore: 85,
        assetCount: 1,
        criticalAssets: 0,
        openVulnerabilities: 1,
        trend: 'increasing',
        lastAssessment: new Date()
      }
    ]

    const mockThreatIndicators: ThreatIndicator[] = [
      {
        id: 'threat-1',
        type: 'network',
        severity: 'high',
        description: 'Suspicious network traffic from external IP',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        source: 'Firewall',
        status: 'investigating'
      },
      {
        id: 'threat-2',
        type: 'endpoint',
        severity: 'medium',
        description: 'Multiple failed login attempts detected',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        source: 'SIEM',
        status: 'active'
      },
      {
        id: 'threat-3',
        type: 'application',
        severity: 'critical',
        description: 'Potential data exfiltration attempt',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        source: 'DLP System',
        status: 'investigating'
      }
    ]

    const riskMetrics: RiskMetrics = {
      totalAssets: mockAssets.length,
      criticalAssets: mockAssets.filter(a => a.criticality === 'critical').length,
      openVulnerabilities: mockVulnerabilities.filter(v => v.status === 'open').length,
      criticalVulnerabilities: mockVulnerabilities.filter(v => v.severity === 'critical').length,
      overallRiskScore: calculateOverallRiskScore(mockAssets, mockVulnerabilities),
      attackSurfaceScore: calculateAttackSurfaceScore(mockAssets),
      lastUpdated: new Date()
    }

    setAttackSurface({
      assets: mockAssets,
      vulnerabilities: mockVulnerabilities,
      businessUnits: mockBusinessUnits,
      threatIndicators: mockThreatIndicators,
      riskMetrics
    })
  }

  const calculateOverallRiskScore = (assets: Asset[], vulnerabilities: Vulnerability[]): number => {
    const assetRisk = assets.reduce((sum, asset) => {
      const criticalityMultiplier = asset.criticality === 'critical' ? 4 : 
                                   asset.criticality === 'high' ? 3 :
                                   asset.criticality === 'medium' ? 2 : 1
      return sum + (asset.exposureScore * criticalityMultiplier)
    }, 0)
    
    const vulnRisk = vulnerabilities.reduce((sum, vuln) => {
      const severityMultiplier = vuln.severity === 'critical' ? 4 :
                                vuln.severity === 'high' ? 3 :
                                vuln.severity === 'medium' ? 2 : 1
      return sum + (vuln.riskScore * severityMultiplier)
    }, 0)
    
    return Math.min(Math.round((assetRisk + vulnRisk) / (assets.length + vulnerabilities.length)), 100)
  }

  const calculateAttackSurfaceScore = (assets: Asset[]): number => {
    const totalExposure = assets.reduce((sum, asset) => sum + asset.exposureScore, 0)
    return Math.round(totalExposure / assets.length)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure': return <Shield className="w-4 h-4 text-green-500" />
      case 'at-risk': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'compromised': return <Target className="w-4 h-4 text-red-500" />
      default: return <Minus className="w-4 h-4 text-neutral-500" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />
      case 'stable': return <Minus className="w-4 h-4 text-neutral-500" />
      default: return <Minus className="w-4 h-4 text-neutral-500" />
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'data': return <Database className="w-4 h-4" />
      case 'system': return <Server className="w-4 h-4" />
      case 'network': return <Network className="w-4 h-4" />
      case 'application': return <Globe className="w-4 h-4" />
      case 'physical': return <Users className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const filteredAssets = selectedBusinessUnit === 'all' 
    ? attackSurface.assets 
    : attackSurface.assets.filter(asset => asset.businessUnit === selectedBusinessUnit)

  const filteredVulnerabilities = selectedBusinessUnit === 'all'
    ? attackSurface.vulnerabilities
    : attackSurface.vulnerabilities.filter(vuln => 
        attackSurface.assets.find(asset => asset.id === vuln.assetId)?.businessUnit === selectedBusinessUnit
      )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading attack surface data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Attack Surface Monitor</h2>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Clock className="w-4 h-4" />
          Last updated: {attackSurface.riskMetrics.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Risk Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">OVERALL RISK</p>
                <p className="text-2xl font-bold text-white font-mono">{attackSurface.riskMetrics.overallRiskScore}</p>
                <p className="text-xs text-neutral-500">risk score</p>
              </div>
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL ASSETS</p>
                <p className="text-2xl font-bold text-red-400 font-mono">{attackSurface.riskMetrics.criticalAssets}</p>
                <p className="text-xs text-neutral-500">of {attackSurface.riskMetrics.totalAssets} total</p>
              </div>
              <Target className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">OPEN VULNERABILITIES</p>
                <p className="text-2xl font-bold text-yellow-400 font-mono">{attackSurface.riskMetrics.openVulnerabilities}</p>
                <p className="text-xs text-neutral-500">need attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ATTACK SURFACE</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">{attackSurface.riskMetrics.attackSurfaceScore}</p>
                <p className="text-xs text-neutral-500">exposure score</p>
              </div>
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 bg-neutral-800 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'assets', label: 'Assets', icon: Target },
          { id: 'vulnerabilities', label: 'Vulnerabilities', icon: AlertTriangle },
          { id: 'threats', label: 'Threats', icon: Shield }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={selectedView === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedView(tab.id as any)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Business Unit Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <span className="text-sm text-neutral-300 whitespace-nowrap">Filter by Business Unit:</span>
        <select
          value={selectedBusinessUnit}
          onChange={(e) => setSelectedBusinessUnit(e.target.value)}
          className="px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm w-full sm:w-auto"
        >
          <option value="all">All Business Units</option>
          {attackSurface.businessUnits.map(unit => (
            <option key={unit.id} value={unit.id}>{unit.name}</option>
          ))}
        </select>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Business Unit Risk Overview */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white">Business Unit Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attackSurface.businessUnits.map(unit => (
                <div key={unit.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(unit.trend)}
                      <span className="font-medium text-white">{unit.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-neutral-400">Risk Score</div>
                      <div className="font-bold text-white">{unit.riskScore}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-400">Assets</div>
                      <div className="font-bold text-white">{unit.assetCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-400">Vulns</div>
                      <div className="font-bold text-white">{unit.openVulnerabilities}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Threat Indicators */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Threat Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attackSurface.threatIndicators.slice(0, 5).map(threat => (
                <div key={threat.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      threat.severity === 'critical' ? 'destructive' :
                      threat.severity === 'high' ? 'default' :
                      threat.severity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {threat.severity}
                    </Badge>
                    <div>
                      <div className="text-sm text-white">{threat.description}</div>
                      <div className="text-xs text-neutral-400">{threat.source}</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {threat.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'assets' && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Asset Inventory & Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-neutral-800 rounded-lg border border-neutral-700 gap-4">
                  <div className="flex items-center gap-4">
                    {getAssetIcon(asset.type)}
                    <div>
                      <div className="font-medium text-white">{asset.name}</div>
                      <div className="text-sm text-neutral-400">{asset.businessUnit} • {asset.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-neutral-400">Exposure</div>
                      <div className="font-bold text-white">{asset.exposureScore}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-neutral-400">Vulns</div>
                      <div className="font-bold text-white">{asset.vulnerabilities}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(asset.status)}
                      <Badge variant={
                        asset.criticality === 'critical' ? 'destructive' :
                        asset.criticality === 'high' ? 'default' :
                        asset.criticality === 'medium' ? 'secondary' : 'outline'
                      }>
                        {asset.criticality}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedView === 'vulnerabilities' && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Vulnerability Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredVulnerabilities.map(vuln => (
                <div key={vuln.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        vuln.severity === 'critical' ? 'destructive' :
                        vuln.severity === 'high' ? 'default' :
                        vuln.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {vuln.severity}
                      </Badge>
                      <span className="font-medium text-white">{vuln.description}</span>
                    </div>
                    <div className="text-sm text-neutral-400">
                      {vuln.discovered.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-400">Asset:</span>
                      <span className="text-white ml-2">
                        {attackSurface.assets.find(a => a.id === vuln.assetId)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Type:</span>
                      <span className="text-white ml-2">{vuln.type}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Status:</span>
                      <Badge variant="outline" className="ml-2">
                        {vuln.status}
                      </Badge>
                    </div>
                  </div>
                  {vuln.cveId && (
                    <div className="mt-2 text-sm">
                      <span className="text-neutral-400">CVE:</span>
                      <span className="text-blue-400 ml-2">{vuln.cveId}</span>
                    </div>
                  )}
                  {vuln.mitreTechnique && (
                    <div className="mt-1 text-sm">
                      <span className="text-neutral-400">MITRE:</span>
                      <span className="text-orange-400 ml-2">{vuln.mitreTechnique}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedView === 'threats' && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Active Threat Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attackSurface.threatIndicators.map(threat => (
                <div key={threat.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        threat.severity === 'critical' ? 'destructive' :
                        threat.severity === 'high' ? 'default' :
                        threat.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {threat.severity}
                      </Badge>
                      <span className="font-medium text-white">{threat.description}</span>
                    </div>
                    <div className="text-sm text-neutral-400">
                      {threat.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-400">Type:</span>
                      <span className="text-white ml-2">{threat.type}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Source:</span>
                      <span className="text-white ml-2">{threat.source}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Status:</span>
                      <Badge variant="outline" className="ml-2">
                        {threat.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 