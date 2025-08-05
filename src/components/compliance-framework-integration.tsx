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
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Eye,
  Lock,
  Users,
  Building,
  Calendar,
  Target,
  RefreshCw,
  Download,
  Upload
} from "lucide-react"

interface ComplianceFramework {
  id: string
  name: string
  type: 'regulatory' | 'industry' | 'international' | 'custom'
  status: 'active' | 'pending' | 'expired' | 'not-applicable'
  complianceScore: number
  lastAssessment: Date
  nextAssessment: Date
  requirements: ComplianceRequirement[]
  controls: string[]
  risks: ComplianceRisk[]
}

interface ComplianceRequirement {
  id: string
  title: string
  description: string
  category: 'technical' | 'administrative' | 'physical'
  status: 'compliant' | 'non-compliant' | 'partially-compliant' | 'not-assessed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  evidence: string[]
  lastReviewed: Date
  nextReview: Date
  assignedTo: string
}

interface ComplianceRisk {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'mitigated' | 'accepted' | 'transferred'
  mitigation: string
  dueDate: Date
}

interface SCFControl {
  id: string
  name: string
  category: string
  subcategory: string
  description: string
  implementation: 'implemented' | 'partially-implemented' | 'not-implemented'
  effectiveness: number
  mappedFrameworks: string[]
  mappedRequirements: string[]
}

const COMPLIANCE_FRAMEWORKS = [
  {
    id: 'gdpr',
    name: 'General Data Protection Regulation (GDPR)',
    type: 'regulatory',
    region: 'EU',
    applicable: ['healthcare', 'retail', 'technology', 'finance']
  },
  {
    id: 'sox',
    name: 'Sarbanes-Oxley Act (SOX)',
    type: 'regulatory',
    region: 'US',
    applicable: ['finance', 'public-companies']
  },
  {
    id: 'pci-dss',
    name: 'Payment Card Industry Data Security Standard (PCI-DSS)',
    type: 'industry',
    region: 'Global',
    applicable: ['finance', 'retail', 'ecommerce']
  },
  {
    id: 'hipaa',
    name: 'Health Insurance Portability and Accountability Act (HIPAA)',
    type: 'regulatory',
    region: 'US',
    applicable: ['healthcare']
  },
  {
    id: 'iso27001',
    name: 'ISO 27001 Information Security Management',
    type: 'international',
    region: 'Global',
    applicable: ['all']
  },
  {
    id: 'nist-csf',
    name: 'NIST Cybersecurity Framework',
    type: 'regulatory',
    region: 'US',
    applicable: ['all']
  },
  {
    id: 'fedramp',
    name: 'Federal Risk and Authorization Management Program (FedRAMP)',
    type: 'regulatory',
    region: 'US',
    applicable: ['government', 'federal-contractors']
  }
]

const SCF_CATEGORIES = [
  'Access Control',
  'Asset Management',
  'Business Continuity',
  'Change Management',
  'Cryptography',
  'Data Protection',
  'Human Resources',
  'Identity Management',
  'Incident Management',
  'Network Security',
  'Operations Security',
  'Physical Security',
  'Risk Management',
  'Security Architecture',
  'Security Awareness',
  'System Development',
  'Vendor Management'
]

export default function ComplianceFrameworkIntegration() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [scfControls, setScfControls] = useState<SCFControl[]>([])
  const [selectedFramework, setSelectedFramework] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      loadComplianceData()
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const loadComplianceData = () => {
    // Mock compliance frameworks data
    const mockFrameworks: ComplianceFramework[] = [
      {
        id: 'gdpr',
        name: 'General Data Protection Regulation (GDPR)',
        type: 'regulatory',
        status: 'active',
        complianceScore: 78,
        lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        requirements: [
          {
            id: 'gdpr-1',
            title: 'Data Protection by Design and Default',
            description: 'Implement appropriate technical and organizational measures to ensure data protection principles are met',
            category: 'technical',
            status: 'compliant',
            priority: 'high',
            evidence: ['Privacy impact assessments completed', 'Data minimization implemented'],
            lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            assignedTo: 'Privacy Officer'
          },
          {
            id: 'gdpr-2',
            title: 'Data Subject Rights',
            description: 'Ensure data subjects can exercise their rights including access, rectification, and erasure',
            category: 'administrative',
            status: 'partially-compliant',
            priority: 'high',
            evidence: ['Data subject request process documented'],
            lastReviewed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            nextReview: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            assignedTo: 'Legal Team'
          }
        ],
        controls: ['ctrl-1', 'ctrl-4', 'ctrl-8'],
        risks: [
          {
            id: 'gdpr-risk-1',
            title: 'Insufficient Data Subject Rights Process',
            description: 'Current process for handling data subject requests may not meet GDPR requirements',
            severity: 'high',
            likelihood: 'medium',
            impact: 'high',
            status: 'open',
            mitigation: 'Implement automated data subject rights management system',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: 'sox',
        name: 'Sarbanes-Oxley Act (SOX)',
        type: 'regulatory',
        status: 'active',
        complianceScore: 85,
        lastAssessment: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        requirements: [
          {
            id: 'sox-1',
            title: 'Internal Controls Over Financial Reporting',
            description: 'Establish and maintain effective internal controls over financial reporting',
            category: 'administrative',
            status: 'compliant',
            priority: 'critical',
            evidence: ['Control framework implemented', 'Regular testing performed'],
            lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            assignedTo: 'Internal Audit'
          }
        ],
        controls: ['ctrl-2', 'ctrl-3', 'ctrl-5'],
        risks: []
      },
      {
        id: 'pci-dss',
        name: 'Payment Card Industry Data Security Standard (PCI-DSS)',
        type: 'industry',
        status: 'active',
        complianceScore: 92,
        lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextAssessment: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        requirements: [
          {
            id: 'pci-1',
            title: 'Build and Maintain a Secure Network',
            description: 'Install and maintain a firewall configuration to protect cardholder data',
            category: 'technical',
            status: 'compliant',
            priority: 'critical',
            evidence: ['Firewall configuration documented', 'Regular testing performed'],
            lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            assignedTo: 'Network Security'
          }
        ],
        controls: ['ctrl-2', 'ctrl-4', 'ctrl-6'],
        risks: []
      }
    ]

    // Mock SCF controls data
    const mockScfControls: SCFControl[] = [
      {
        id: 'scf-1',
        name: 'Access Control Policy and Procedures',
        category: 'Access Control',
        subcategory: 'Policy and Procedures',
        description: 'Establish, document, and disseminate access control policy and procedures',
        implementation: 'implemented',
        effectiveness: 85,
        mappedFrameworks: ['iso27001', 'nist-csf'],
        mappedRequirements: ['iso-9.1.1', 'nist-ac-1']
      },
      {
        id: 'scf-2',
        name: 'Account Management',
        category: 'Access Control',
        subcategory: 'Account Management',
        description: 'Establish and maintain procedures for account management',
        implementation: 'partially-implemented',
        effectiveness: 70,
        mappedFrameworks: ['iso27001', 'nist-csf', 'sox'],
        mappedRequirements: ['iso-9.2.1', 'nist-ac-2', 'sox-404']
      },
      {
        id: 'scf-3',
        name: 'Data Classification',
        category: 'Data Protection',
        subcategory: 'Data Classification',
        description: 'Establish and maintain data classification procedures',
        implementation: 'implemented',
        effectiveness: 90,
        mappedFrameworks: ['iso27001', 'gdpr', 'pci-dss'],
        mappedRequirements: ['iso-8.1.1', 'gdpr-5', 'pci-7']
      },
      {
        id: 'scf-4',
        name: 'Incident Response Plan',
        category: 'Incident Management',
        subcategory: 'Response Planning',
        description: 'Establish and maintain incident response procedures',
        implementation: 'implemented',
        effectiveness: 80,
        mappedFrameworks: ['iso27001', 'nist-csf'],
        mappedRequirements: ['iso-16.1.1', 'nist-rs-rp']
      },
      {
        id: 'scf-5',
        name: 'Vendor Management',
        category: 'Vendor Management',
        subcategory: 'Vendor Assessment',
        description: 'Establish and maintain vendor management procedures',
        implementation: 'not-implemented',
        effectiveness: 0,
        mappedFrameworks: ['iso27001', 'sox'],
        mappedRequirements: ['iso-15.1.1', 'sox-404']
      }
    ]

    setFrameworks(mockFrameworks)
    setScfControls(mockScfControls)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'partially-compliant': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'non-compliant': return <XCircle className="w-4 h-4 text-red-500" />
      case 'not-assessed': return <Minus className="w-4 h-4 text-neutral-500" />
      default: return <Minus className="w-4 h-4 text-neutral-500" />
    }
  }

  const getFrameworkTypeColor = (type: string) => {
    switch (type) {
      case 'regulatory': return 'text-red-400'
      case 'industry': return 'text-blue-400'
      case 'international': return 'text-green-400'
      case 'custom': return 'text-purple-400'
      default: return 'text-neutral-400'
    }
  }

  const getImplementationStatus = (status: string) => {
    switch (status) {
      case 'implemented': return { color: 'text-green-500', bg: 'bg-green-500/10' }
      case 'partially-implemented': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
      case 'not-implemented': return { color: 'text-red-500', bg: 'bg-red-500/10' }
      default: return { color: 'text-neutral-500', bg: 'bg-neutral-500/10' }
    }
  }

  const filteredFrameworks = selectedFramework === 'all' 
    ? frameworks 
    : frameworks.filter(f => f.id === selectedFramework)

  const filteredScfControls = selectedCategory === 'all'
    ? scfControls
    : scfControls.filter(c => c.category === selectedCategory)

  const overallComplianceScore = frameworks.length > 0 
    ? Math.round(frameworks.reduce((sum, f) => sum + f.complianceScore, 0) / frameworks.length)
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Compliance Framework Integration</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Assessment
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">OVERALL COMPLIANCE</p>
                <p className="text-2xl font-bold text-white font-mono">{overallComplianceScore}%</p>
                <p className="text-xs text-neutral-500">average score</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ACTIVE FRAMEWORKS</p>
                <p className="text-2xl font-bold text-white font-mono">{frameworks.filter(f => f.status === 'active').length}</p>
                <p className="text-xs text-neutral-500">compliance programs</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SCF CONTROLS</p>
                <p className="text-2xl font-bold text-white font-mono">{scfControls.length}</p>
                <p className="text-xs text-neutral-500">secure controls</p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">COMPLIANCE RISKS</p>
                <p className="text-2xl font-bold text-red-400 font-mono">
                  {frameworks.reduce((sum, f) => sum + f.risks.filter(r => r.status === 'open').length, 0)}
                </p>
                <p className="text-xs text-neutral-500">open risks</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">Framework:</span>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm min-w-[200px]"
          >
            <option value="all">All Frameworks</option>
            {frameworks.map(fw => (
              <option key={fw.id} value={fw.id}>{fw.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">SCF Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-md text-white text-sm min-w-[150px]"
          >
            <option value="all">All Categories</option>
            {SCF_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Compliance Frameworks */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Compliance Framework Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredFrameworks.map(framework => (
              <div key={framework.id} className="p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">{framework.name}</h4>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className={`${getFrameworkTypeColor(framework.type)}`}>
                        {framework.type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {framework.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xl font-bold text-white">{framework.complianceScore}%</div>
                    <div className="text-xs text-neutral-400">compliance</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="text-xs text-neutral-400">Requirements</div>
                    <div className="font-bold text-white text-sm">{framework.requirements.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Open Risks</div>
                    <div className="font-bold text-red-400 text-sm">
                      {framework.risks.filter(r => r.status === 'open').length}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {framework.requirements.slice(0, 2).map(req => (
                    <div key={req.id} className="flex items-center justify-between p-2 bg-neutral-700 rounded text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getStatusIcon(req.status)}
                        <span className="text-white truncate">{req.title}</span>
                      </div>
                      <Badge variant={
                        req.priority === 'critical' ? 'destructive' :
                        req.priority === 'high' ? 'default' :
                        req.priority === 'medium' ? 'secondary' : 'outline'
                      } className="text-xs ml-2">
                        {req.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-neutral-400">
                    Next: {framework.nextAssessment.toLocaleDateString()}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SCF Controls */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Secure Controls Framework (SCF)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredScfControls.map(control => {
              const status = getImplementationStatus(control.implementation)
              
              return (
                <div key={control.id} className="p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm truncate">{control.name}</h4>
                      <div className="text-xs text-neutral-400">{control.category} • {control.subcategory}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-lg font-bold text-white">{control.effectiveness}%</div>
                      <div className="text-xs text-neutral-400">effectiveness</div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-neutral-400 mb-2 line-clamp-2">{control.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className={`px-2 py-1 rounded text-xs ${status.bg} ${status.color}`}>
                      {control.implementation.replace('-', ' ')}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {control.mappedFrameworks.length} frameworks mapped
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {control.mappedFrameworks.map(fw => (
                      <Badge key={fw} variant="outline" className="text-xs">
                        {fw.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Risk Assessment */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Compliance Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {frameworks.flatMap(framework => 
              framework.risks.map(risk => (
                <div key={risk.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        risk.severity === 'critical' ? 'destructive' :
                        risk.severity === 'high' ? 'default' :
                        risk.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {risk.severity}
                      </Badge>
                      <span className="font-medium text-white">{risk.title}</span>
                    </div>
                    <div className="text-sm text-neutral-400">
                      Due: {risk.dueDate.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-neutral-400 mb-3">{risk.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-neutral-400">Likelihood</div>
                      <div className="font-bold text-white capitalize">{risk.likelihood}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-400">Impact</div>
                      <div className="font-bold text-white capitalize">{risk.impact}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-400">Status</div>
                      <Badge variant="outline" className="capitalize">
                        {risk.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-700 p-3 rounded">
                    <div className="text-sm font-medium text-white mb-1">Mitigation:</div>
                    <p className="text-sm text-neutral-300">{risk.mitigation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 