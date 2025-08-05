"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Eye,
  Lock,
  Network,
  Database,
  Users,
  FileText,
  Zap,
  RefreshCw
} from "lucide-react"

interface Control {
  id: string
  name: string
  category: 'preventive' | 'detective' | 'corrective' | 'deterrent'
  framework: 'NIST' | 'ISO27001' | 'COBIT' | 'CIS' | 'Custom'
  status: 'implemented' | 'partially-implemented' | 'not-implemented' | 'planned'
  effectiveness: number // 0-100
  coverage: number // 0-100
  cost: number // in thousands
  lastAssessment: Date
  description: string
  businessUnits: string[]
  assets: string[]
  risks: string[]
  recommendations: string[]
}

interface GapAnalysis {
  controlId: string
  gapType: 'implementation' | 'coverage' | 'effectiveness' | 'integration'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  recommendation: string
  estimatedCost: number
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface ControlMetrics {
  totalControls: number
  implementedControls: number
  averageEffectiveness: number
  averageCoverage: number
  totalInvestment: number
  riskReduction: number
  gaps: number
  criticalGaps: number
}

const CONTROL_CATEGORIES = [
  { id: 'preventive', name: 'Preventive Controls', icon: Shield, color: 'text-green-500' },
  { id: 'detective', name: 'Detective Controls', icon: Eye, color: 'text-blue-500' },
  { id: 'corrective', name: 'Corrective Controls', icon: RefreshCw, color: 'text-orange-500' },
  { id: 'deterrent', name: 'Deterrent Controls', icon: Lock, color: 'text-purple-500' }
]

const FRAMEWORKS = [
  { id: 'NIST', name: 'NIST Cybersecurity Framework', color: 'text-blue-400' },
  { id: 'ISO27001', name: 'ISO 27001', color: 'text-green-400' },
  { id: 'COBIT', name: 'COBIT', color: 'text-purple-400' },
  { id: 'CIS', name: 'CIS Controls', color: 'text-orange-400' },
  { id: 'Custom', name: 'Custom Controls', color: 'text-neutral-400' }
]

export default function ControlEffectivenessAssessment() {
  const [controls, setControls] = useState<Control[]>([])
  const [gaps, setGaps] = useState<GapAnalysis[]>([])
  const [metrics, setMetrics] = useState<ControlMetrics>({
    totalControls: 0,
    implementedControls: 0,
    averageEffectiveness: 0,
    averageCoverage: 0,
    totalInvestment: 0,
    riskReduction: 0,
    gaps: 0,
    criticalGaps: 0
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFramework, setSelectedFramework] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      loadControlData()
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const loadControlData = () => {
    // Mock control data
    const mockControls: Control[] = [
      {
        id: 'ctrl-1',
        name: 'Multi-Factor Authentication (MFA)',
        category: 'preventive',
        framework: 'NIST',
        status: 'implemented',
        effectiveness: 95,
        coverage: 90,
        cost: 25,
        lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: 'Enforces multi-factor authentication for all user accounts',
        businessUnits: ['IT', 'Finance', 'HR'],
        assets: ['User Accounts', 'Admin Systems'],
        risks: ['Unauthorized Access', 'Credential Theft'],
        recommendations: ['Extend to third-party vendors', 'Implement adaptive MFA']
      },
      {
        id: 'ctrl-2',
        name: 'Network Firewall',
        category: 'preventive',
        framework: 'NIST',
        status: 'implemented',
        effectiveness: 88,
        coverage: 95,
        cost: 50,
        lastAssessment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'Perimeter firewall with advanced threat protection',
        businessUnits: ['IT'],
        assets: ['Network Infrastructure', 'Internet Gateway'],
        risks: ['Network Intrusion', 'DDoS Attacks'],
        recommendations: ['Implement zero-trust architecture', 'Add AI-powered threat detection']
      },
      {
        id: 'ctrl-3',
        name: 'Security Information and Event Management (SIEM)',
        category: 'detective',
        framework: 'ISO27001',
        status: 'implemented',
        effectiveness: 82,
        coverage: 75,
        cost: 120,
        lastAssessment: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        description: 'Centralized log collection and security event correlation',
        businessUnits: ['IT', 'Security'],
        assets: ['All Systems', 'Network Devices'],
        risks: ['Undetected Breaches', 'Compliance Violations'],
        recommendations: ['Improve log coverage', 'Enhance correlation rules']
      },
      {
        id: 'ctrl-4',
        name: 'Data Loss Prevention (DLP)',
        category: 'preventive',
        framework: 'CIS',
        status: 'partially-implemented',
        effectiveness: 65,
        coverage: 60,
        cost: 80,
        lastAssessment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Monitors and prevents unauthorized data exfiltration',
        businessUnits: ['IT', 'Finance', 'HR'],
        assets: ['Sensitive Data', 'Email Systems'],
        risks: ['Data Breach', 'Compliance Violations'],
        recommendations: ['Extend to cloud applications', 'Improve classification accuracy']
      },
      {
        id: 'ctrl-5',
        name: 'Vulnerability Management',
        category: 'corrective',
        framework: 'NIST',
        status: 'implemented',
        effectiveness: 78,
        coverage: 85,
        cost: 45,
        lastAssessment: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Regular vulnerability scanning and patch management',
        businessUnits: ['IT'],
        assets: ['All Systems', 'Applications'],
        risks: ['Exploited Vulnerabilities', 'System Compromise'],
        recommendations: ['Automate patch deployment', 'Implement continuous scanning']
      },
      {
        id: 'ctrl-6',
        name: 'Employee Security Training',
        category: 'deterrent',
        framework: 'Custom',
        status: 'implemented',
        effectiveness: 70,
        coverage: 95,
        cost: 15,
        lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        description: 'Regular security awareness training for all employees',
        businessUnits: ['All'],
        assets: ['Human Resources'],
        risks: ['Social Engineering', 'Phishing Attacks'],
        recommendations: ['Increase training frequency', 'Add phishing simulations']
      },
      {
        id: 'ctrl-7',
        name: 'Backup and Recovery',
        category: 'corrective',
        framework: 'COBIT',
        status: 'implemented',
        effectiveness: 92,
        coverage: 90,
        cost: 35,
        lastAssessment: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        description: 'Automated backup systems with disaster recovery capabilities',
        businessUnits: ['IT'],
        assets: ['All Data', 'Systems'],
        risks: ['Data Loss', 'Business Continuity'],
        recommendations: ['Test recovery procedures', 'Implement cloud backup']
      },
      {
        id: 'ctrl-8',
        name: 'Access Control Management',
        category: 'preventive',
        framework: 'ISO27001',
        status: 'partially-implemented',
        effectiveness: 75,
        coverage: 70,
        cost: 30,
        lastAssessment: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        description: 'Role-based access control and privilege management',
        businessUnits: ['IT', 'HR'],
        assets: ['User Accounts', 'Applications'],
        risks: ['Privilege Escalation', 'Unauthorized Access'],
        recommendations: ['Implement just-in-time access', 'Automate access reviews']
      }
    ]

    const mockGaps: GapAnalysis[] = [
      {
        controlId: 'ctrl-4',
        gapType: 'coverage',
        severity: 'high',
        description: 'DLP coverage limited to on-premise systems',
        impact: 'Cloud data not protected from exfiltration',
        recommendation: 'Extend DLP to cloud applications and SaaS platforms',
        estimatedCost: 40,
        priority: 'high'
      },
      {
        controlId: 'ctrl-8',
        gapType: 'effectiveness',
        severity: 'medium',
        description: 'Manual access review process causing delays',
        impact: 'Stale access accounts increase attack surface',
        recommendation: 'Implement automated access review and provisioning',
        estimatedCost: 25,
        priority: 'medium'
      },
      {
        controlId: 'ctrl-3',
        gapType: 'integration',
        severity: 'critical',
        description: 'SIEM not integrated with cloud security tools',
        impact: 'Limited visibility into cloud-based threats',
        recommendation: 'Integrate SIEM with cloud security platforms',
        estimatedCost: 60,
        priority: 'critical'
      }
    ]

    const metrics: ControlMetrics = {
      totalControls: mockControls.length,
      implementedControls: mockControls.filter(c => c.status === 'implemented').length,
      averageEffectiveness: Math.round(mockControls.reduce((sum, c) => sum + c.effectiveness, 0) / mockControls.length),
      averageCoverage: Math.round(mockControls.reduce((sum, c) => sum + c.coverage, 0) / mockControls.length),
      totalInvestment: mockControls.reduce((sum, c) => sum + c.cost, 0),
      riskReduction: calculateRiskReduction(mockControls),
      gaps: mockGaps.length,
      criticalGaps: mockGaps.filter(g => g.severity === 'critical').length
    }

    setControls(mockControls)
    setGaps(mockGaps)
    setMetrics(metrics)
  }

  const calculateRiskReduction = (controls: Control[]): number => {
    const totalRiskReduction = controls.reduce((sum, control) => {
      return sum + (control.effectiveness * control.coverage / 100)
    }, 0)
    return Math.round(totalRiskReduction / controls.length)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'partially-implemented': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'not-implemented': return <XCircle className="w-4 h-4 text-red-500" />
      case 'planned': return <Target className="w-4 h-4 text-blue-500" />
      default: return <Minus className="w-4 h-4 text-neutral-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = CONTROL_CATEGORIES.find(c => c.id === category)
    return cat ? <cat.icon className="w-4 h-4" /> : <Shield className="w-4 h-4" />
  }

  const getFrameworkColor = (framework: string) => {
    const fw = FRAMEWORKS.find(f => f.id === framework)
    return fw ? fw.color : 'text-neutral-400'
  }

  const filteredControls = controls.filter(control => {
    if (selectedCategory !== 'all' && control.category !== selectedCategory) return false
    if (selectedFramework !== 'all' && control.framework !== selectedFramework) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading control assessment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Control Effectiveness Assessment</h2>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configure Assessment
        </Button>
      </div>

      {/* Control Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL CONTROLS</p>
                <p className="text-2xl font-bold text-white font-mono">{metrics.totalControls}</p>
                <p className="text-xs text-neutral-500">{metrics.implementedControls} implemented</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">AVG EFFECTIVENESS</p>
                <p className="text-2xl font-bold text-white font-mono">{metrics.averageEffectiveness}%</p>
                <p className="text-xs text-neutral-500">across all controls</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">RISK REDUCTION</p>
                <p className="text-2xl font-bold text-white font-mono">{metrics.riskReduction}%</p>
                <p className="text-xs text-neutral-500">overall reduction</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CRITICAL GAPS</p>
                <p className="text-2xl font-bold text-red-400 font-mono">{metrics.criticalGaps}</p>
                <p className="text-xs text-neutral-500">need immediate attention</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300 whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {CONTROL_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300 whitespace-nowrap">Framework:</span>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm w-full sm:w-auto"
          >
            <option value="all">All Frameworks</option>
            {FRAMEWORKS.map(fw => (
              <option key={fw.id} value={fw.id}>{fw.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Control Assessment */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Control Effectiveness Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredControls.map(control => (
              <div key={control.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(control.status)}
                    <div>
                      <h4 className="font-medium text-white">{control.name}</h4>
                      <div className="flex items-center gap-2 text-sm">
                        {getCategoryIcon(control.category)}
                        <span className="text-neutral-400">{CONTROL_CATEGORIES.find(c => c.id === control.category)?.name}</span>
                        <span className={`text-xs ${getFrameworkColor(control.framework)}`}>
                          {control.framework}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-neutral-400">Investment</div>
                    <div className="font-bold text-white">${control.cost}K</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-400">Effectiveness</span>
                      <span className="text-white">{control.effectiveness}%</span>
                    </div>
                    <Progress value={control.effectiveness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-400">Coverage</span>
                      <span className="text-white">{control.coverage}%</span>
                    </div>
                    <Progress value={control.coverage} className="h-2" />
                  </div>
                </div>
                
                <p className="text-sm text-neutral-400 mb-2">{control.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {control.businessUnits.map(unit => (
                    <Badge key={unit} variant="outline" className="text-xs">
                      {unit}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gap Analysis */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Gap Analysis & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gaps.map((gap, index) => (
              <div key={index} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      gap.severity === 'critical' ? 'destructive' :
                      gap.severity === 'high' ? 'default' :
                      gap.severity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {gap.severity}
                    </Badge>
                    <span className="text-sm text-neutral-400">{gap.gapType}</span>
                  </div>
                  <div className="text-sm text-neutral-400">
                    ${gap.estimatedCost}K
                  </div>
                </div>
                
                <h4 className="font-medium text-white mb-2">{gap.description}</h4>
                <p className="text-sm text-neutral-400 mb-2">{gap.impact}</p>
                
                <div className="bg-neutral-700 p-3 rounded">
                  <div className="text-sm font-medium text-white mb-1">Recommendation:</div>
                  <p className="text-sm text-neutral-300">{gap.recommendation}</p>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <Badge variant={
                    gap.priority === 'critical' ? 'destructive' :
                    gap.priority === 'high' ? 'default' :
                    gap.priority === 'medium' ? 'secondary' : 'outline'
                  }>
                    Priority: {gap.priority}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Zap className="w-3 h-3 mr-1" />
                    Implement
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Investment Summary */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Control Investment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                ${metrics.totalInvestment}K
              </div>
              <div className="text-sm text-neutral-400">Total Investment</div>
              <div className="text-xs text-neutral-500 mt-1">in cybersecurity controls</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                ${Math.round(metrics.totalInvestment / metrics.totalControls)}K
              </div>
              <div className="text-sm text-neutral-400">Average per Control</div>
              <div className="text-xs text-neutral-500 mt-1">implementation cost</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                ${gaps.reduce((sum, gap) => sum + gap.estimatedCost, 0)}K
              </div>
              <div className="text-sm text-neutral-400">Additional Investment</div>
              <div className="text-xs text-neutral-500 mt-1">needed to close gaps</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 